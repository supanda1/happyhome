import { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// JWT payload interfaces
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

interface RefreshTokenPayload {
  userId: string;
}

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';

// Register new user
export const register = async (req: Request, res: Response) => {
  try {
    
    const { email, password, first_name, last_name, phone, role = 'customer' } = req.body;
    
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, first name, and last name are required'
      });
    }

    // Check if user already exists
    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'User already exists with this email'
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const result = await pool.query(`
      INSERT INTO users (
        id, email, password_hash, first_name, last_name, phone, role, 
        is_active, is_verified, failed_login_attempts, profile_completed, 
        created_at, updated_at
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, false, 0, false, NOW(), NOW())
      RETURNING id, email, first_name, last_name, phone, role, is_active, is_verified, created_at
    `, [email, hashedPassword, first_name, last_name, phone, role]);

    const user = result.rows[0];

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token in database
    await pool.query(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at, is_revoked, created_at)
      VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL '7 days', false, NOW())
    `, [user.id, refreshToken]);

    // Format user response
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      isActive: user.is_active,
      isVerified: user.is_verified,
      createdAt: user.created_at
    };

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        accessToken,
        refreshToken
      },
      message: 'User registered successfully'
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user'
    });
  }
};

// Login user
export const login = async (req: Request, res: Response) => {
  try {
    
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required'
      });
    }

    // Get user by email
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const user = result.rows[0];

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Generate tokens
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Store refresh token
    await pool.query(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at, is_revoked, created_at)
      VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL '7 days', false, NOW())
    `, [user.id, refreshToken]);

    // Format user response
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      isActive: user.is_active,
      isVerified: user.is_verified,
      createdAt: user.created_at
    };

    // Set JWT token as HTTP-only cookie for session-based authentication
    res.setHeader('Set-Cookie', [
      `access_token=${accessToken}; HttpOnly; SameSite=Lax; Max-Age=${60 * 60}; Path=/`,
      `refresh_token=${refreshToken}; HttpOnly; SameSite=Lax; Max-Age=${7 * 24 * 60 * 60}; Path=/`
    ]);


    res.json({
      success: true,
      data: {
        user: userResponse
        // Removed tokens from response - they're now in HTTP-only cookies
      },
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Error logging in user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login'
    });
  }
};

// Logout user
export const logout = async (req: Request, res: Response) => {
  try {
    
    // Simple cookie parser helper
    const parseCookies = (req: Request): Record<string, string> => {
      const cookies: Record<string, string> = {};
      const cookieHeader = req.headers.cookie;
      
      if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
          const [name, ...rest] = cookie.split('=');
          const value = rest.join('=').trim();
          if (name && value) {
            cookies[name.trim()] = decodeURIComponent(value);
          }
        });
      }
      
      return cookies;
    };
    
    // Get cookies from request
    const cookies = parseCookies(req);
    
    // Try to get token from cookie first, then fallback to Authorization header
    let token = cookies.access_token;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        // Invalidate all refresh tokens for this user
        await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [decoded.userId]);
      } catch {
        // Token might be expired, that's ok
      }
    }

    // Clear HTTP-only cookies
    res.setHeader('Set-Cookie', [
      'access_token=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/',
      'refresh_token=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/'
    ]);


    res.json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    console.error('Error logging out user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to logout'
    });
  }
};

// Update user profile
export const updateProfile = async (req: Request, res: Response) => {
  try {
    
    // Simple cookie parser helper
    const parseCookies = (req: Request): Record<string, string> => {
      const cookies: Record<string, string> = {};
      const cookieHeader = req.headers.cookie;
      
      if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
          const [name, ...rest] = cookie.split('=');
          const value = rest.join('=').trim();
          if (name && value) {
            cookies[name.trim()] = decodeURIComponent(value);
          }
        });
      }
      
      return cookies;
    };

    // Get cookies from request
    const cookies = parseCookies(req);
    
    // Try to get token from cookie first, then fallback to Authorization header
    let token = cookies.access_token;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const userId = decoded.userId;

    const { first_name, last_name, phone } = req.body;

    // Build dynamic update query
    const updateFields: string[] = [];
    const values: (string | number)[] = [];
    let paramIndex = 1;

    if (first_name !== undefined) {
      updateFields.push(`first_name = $${paramIndex++}`);
      values.push(first_name);
    }

    if (last_name !== undefined) {
      updateFields.push(`last_name = $${paramIndex++}`);
      values.push(last_name);
    }

    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    // Add updated_at and user ID
    updateFields.push(`updated_at = NOW()`);
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, email, first_name, last_name, phone, role, is_active, is_verified, created_at, updated_at
    `;


    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      isActive: user.is_active,
      isVerified: user.is_verified,
      createdAt: user.created_at,
      updatedAt: user.updated_at
    };


    res.json({
      success: true,
      data: userResponse,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
};

// Get user profile
export const getProfile = async (req: Request, res: Response) => {
  try {
    
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;

    // Get user profile
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, phone, role, is_active, is_verified, created_at FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      isActive: user.is_active,
      isVerified: user.is_verified,
      createdAt: user.created_at
    };

    res.json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Error getting profile:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
};

// Get current user (session-based authentication) 
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    
    // Simple cookie parser helper
    const parseCookies = (req: Request): Record<string, string> => {
      const cookies: Record<string, string> = {};
      const cookieHeader = req.headers.cookie;
      
      if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
          const [name, ...rest] = cookie.split('=');
          const value = rest.join('=').trim();
          if (name && value) {
            cookies[name.trim()] = decodeURIComponent(value);
          }
        });
      }
      
      return cookies;
    };

    // Get cookies from request
    const cookies = parseCookies(req);
    
    // Helper function to extract user ID from JWT token (from cookies or Authorization header)
    const getUserIdFromToken = (): string | null => {
      // First try to get token from HTTP-only cookie
      let token = cookies.access_token;
      
      // Fallback to Authorization header if no cookie (for backward compatibility)
      if (!token) {
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
          token = authHeader.substring(7);
        }
      }
      
      if (!token) {
        return null;
      }
      
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
        return decoded.userId;
      } catch {
        return null;
      }
    };
    
    // Try to get user ID from JWT token (from cookies or header)
    const userId = getUserIdFromToken();
    
    if (!userId) {
      // No valid JWT token - user is not authenticated (anonymous session)
      return res.status(401).json({
        success: false,
        error: 'User not authenticated'
      });
    }
    
    
    // Get user profile from database
    const result = await pool.query(
      'SELECT id, email, first_name, last_name, phone, role, is_active, is_verified, created_at FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = result.rows[0];
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      role: user.role,
      isActive: user.is_active,
      isVerified: user.is_verified,
      createdAt: user.created_at
    };

    
    res.json({
      success: true,
      data: userResponse
    });
  } catch (error) {
    console.error('Error getting current user:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid authentication token'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to get current user'
    });
  }
};

// Refresh token
export const refreshToken = async (req: Request, res: Response) => {
  try {
    
    const { refresh_token } = req.body;
    
    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        error: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refresh_token, JWT_REFRESH_SECRET) as RefreshTokenPayload;

    // Check if refresh token exists and is valid
    const tokenResult = await pool.query(
      'SELECT user_id FROM refresh_tokens WHERE token = $1 AND expires_at > NOW()',
      [refresh_token]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Invalid or expired refresh token'
      });
    }

    // Get user
    const userResult = await pool.query(
      'SELECT id, email, role FROM users WHERE id = $1 AND is_active = true',
      [decoded.userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
    }

    const user = userResult.rows[0];

    // Generate new tokens
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const newRefreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Replace old refresh token with new one
    await pool.query('DELETE FROM refresh_tokens WHERE token = $1', [refresh_token]);
    await pool.query(`
      INSERT INTO refresh_tokens (id, user_id, token, expires_at, created_at)
      VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL '7 days', NOW())
    `, [user.id, newRefreshToken]);

    res.json({
      success: true,
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid refresh token'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to refresh token'
    });
  }
};

// Change password
export const changePassword = async (req: Request, res: Response) => {
  try {
    
    // Simple cookie parser helper
    const parseCookies = (req: Request): Record<string, string> => {
      const cookies: Record<string, string> = {};
      const cookieHeader = req.headers.cookie;
      
      if (cookieHeader) {
        cookieHeader.split(';').forEach(cookie => {
          const [name, ...rest] = cookie.split('=');
          const value = rest.join('=').trim();
          if (name && value) {
            cookies[name.trim()] = decodeURIComponent(value);
          }
        });
      }
      
      return cookies;
    };

    // Get cookies from request
    const cookies = parseCookies(req);
    
    // Try to get token from cookie first, then fallback to Authorization header
    let token = cookies.access_token;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Authorization token required'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    const userId = decoded.userId;

    const { current_password, new_password } = req.body;

    // Validate required fields
    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        error: 'Current password and new password are required'
      });
    }

    // Validate new password strength
    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        error: 'New password must be at least 6 characters long'
      });
    }

    // Get user from database
    const userResult = await pool.query(
      'SELECT id, password_hash FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        error: 'Current password is incorrect'
      });
    }

    // Hash new password
    const saltRounds = 10;
    const hashedNewPassword = await bcrypt.hash(new_password, saltRounds);

    // Update password in database
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [hashedNewPassword, userId]
    );

    // Invalidate all refresh tokens for security
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);


    res.json({
      success: true,
      message: 'Password changed successfully. Please login again.'
    });
  } catch (error) {
    console.error('Error changing password:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to change password'
    });
  }
};