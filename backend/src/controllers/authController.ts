import { Request, Response } from 'express';
import pool from '../config/database';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { getSessionType, getCookieOptions, SessionTypeName } from '../config/sessionConfig';

// Helper function to convert duration strings to PostgreSQL intervals
function convertDurationToInterval(duration: string): string {
  const match = duration.match(/^(\d+)([hdm])$/);
  if (!match) return '1 hour'; // fallback
  
  const [, amount, unit] = match;
  switch (unit) {
    case 'h': return `${amount} hours`;
    case 'd': return `${amount} days`;
    case 'm': return `${amount} minutes`;
    default: return '1 hour';
  }
}

// JWT payload interfaces
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

interface RefreshTokenPayload {
  userId: string;
}

// Ensure JWT secrets are properly typed and not undefined
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';

// Validate JWT secrets
if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  throw new Error('JWT_SECRET and JWT_REFRESH_SECRET environment variables are required');
}

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
        is_active, is_verified, created_at, updated_at
      )
      VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, true, false, NOW(), NOW())
      RETURNING id, email, first_name, last_name, phone, role, is_active, is_verified, created_at
    `, [email, hashedPassword, first_name, last_name, phone, role]);

    const user = result.rows[0];

    // Get session type for new user registration (browsing session by default)
    const sessionType = getSessionType(user.role, 'login');
    const cookieOptions = getCookieOptions(sessionType, process.env.NODE_ENV === 'production');

    // Generate tokens with dynamic duration based on session type
    const signOptions: SignOptions = { expiresIn: sessionType.accessTokenDuration as any };
    const refreshSignOptions: SignOptions = { expiresIn: sessionType.refreshTokenDuration as any };
    
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      signOptions
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      refreshSignOptions
    );

    // Store refresh token in database with dynamic expiration
    const refreshTokenDuration = sessionType.refreshTokenDuration;
    const intervalStr = convertDurationToInterval(refreshTokenDuration);
    await pool.query(`
      INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, is_revoked, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL '${intervalStr}', false, NOW(), NOW())
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

    // Set JWT tokens as HTTP-only cookies with dynamic session duration
    res.setHeader('Set-Cookie', [
      `access_token=${accessToken}; HttpOnly; SameSite=Lax; Max-Age=${cookieOptions.maxAge}; Path=/`,
      `refresh_token=${refreshToken}; HttpOnly; SameSite=Lax; Max-Age=${cookieOptions.maxAge}; Path=/`
    ]);

    res.status(201).json({
      success: true,
      data: {
        user: userResponse,
        sessionType: sessionType.description
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
    
    console.log('Login attempt:', { email, passwordLength: password?.length });
    
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

    console.log('User found:', result.rows.length > 0 ? 'Yes' : 'No');

    if (result.rows.length === 0) {
      console.log('No user found with email:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    const user = result.rows[0];
    console.log('User data:', { id: user.id, email: user.email, hasPassword: !!user.password_hash });

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('Password mismatch for user:', email);
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password'
      });
    }

    // Get session type for login operation
    const sessionType = getSessionType(user.role, 'login');
    const cookieOptions = getCookieOptions(sessionType, process.env.NODE_ENV === 'production');

    // Generate tokens with dynamic duration based on session type
    const signOptions: SignOptions = { expiresIn: sessionType.accessTokenDuration as any };
    const refreshSignOptions: SignOptions = { expiresIn: sessionType.refreshTokenDuration as any };
    
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      signOptions
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      refreshSignOptions
    );

    // Store refresh token with dynamic expiration
    const refreshTokenDuration = sessionType.refreshTokenDuration;
    const intervalStr = convertDurationToInterval(refreshTokenDuration);
    await pool.query(`
      INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, is_revoked, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL '${intervalStr}', false, NOW(), NOW())
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

    // Set JWT tokens as HTTP-only cookies with dynamic session duration
    res.setHeader('Set-Cookie', [
      `access_token=${accessToken}; HttpOnly; SameSite=Lax; Max-Age=${cookieOptions.maxAge}; Path=/`,
      `refresh_token=${refreshToken}; HttpOnly; SameSite=Lax; Max-Age=${cookieOptions.maxAge}; Path=/`
    ]);

    res.json({
      success: true,
      data: {
        user: userResponse,
        sessionType: sessionType.description
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
      'SELECT user_id FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()',
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

    // Get session type for refresh operation (keep current session level)
    const sessionType = getSessionType(user.role, 'refresh');

    // Generate new tokens with dynamic duration
    const signOptions: SignOptions = { expiresIn: sessionType.accessTokenDuration as any };
    const refreshSignOptions: SignOptions = { expiresIn: sessionType.refreshTokenDuration as any };
    
    const newAccessToken = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      signOptions
    );

    const newRefreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      refreshSignOptions
    );

    // Replace old refresh token with new one
    await pool.query('DELETE FROM refresh_tokens WHERE token_hash = $1', [refresh_token]);
    const refreshTokenDuration = sessionType.refreshTokenDuration;
    await pool.query(`
      INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, is_revoked, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL $3, false, NOW(), NOW())
    `, [user.id, newRefreshToken, refreshTokenDuration]);

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

// Update session type based on user activity
export const updateSessionType = async (req: Request, res: Response) => {
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

    const { sessionType: requestedSessionType, operation = 'manual', currentRoute } = req.body;

    if (!requestedSessionType) {
      return res.status(400).json({
        success: false,
        error: 'Session type is required'
      });
    }

    // Map frontend session type names to backend session types
    const sessionTypeMap: Record<string, string> = {
      'BROWSING': 'browse',
      'BOOKING': 'booking', 
      'PROFILE_VIEW': 'profile_view',
      'PROFILE_EDIT': 'profile_edit',
      'ADMIN_READ': 'admin_read',
      'ADMIN_WRITE': 'admin_write', 
      'ADMIN_SENSITIVE': 'admin_sensitive'
    };

    const mappedOperation = sessionTypeMap[requestedSessionType] || 'browse';

    // Get user information for session type calculation
    const userResult = await pool.query(
      'SELECT id, role FROM users WHERE id = $1 AND is_active = true',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = userResult.rows[0];

    // Determine if this is a sensitive operation
    const isSensitiveOperation = mappedOperation.includes('sensitive') || mappedOperation.includes('password') || mappedOperation.includes('user_management');
    const isWriteOperation = mappedOperation.includes('write') || mappedOperation.includes('edit') || mappedOperation.includes('update');

    // Get appropriate session type based on user role and operation
    const sessionType = getSessionType(user.role, mappedOperation, isWriteOperation, isSensitiveOperation);
    const cookieOptions = getCookieOptions(sessionType, process.env.NODE_ENV === 'production');

    // Generate new tokens with updated session duration
    const signOptions: SignOptions = { expiresIn: sessionType.accessTokenDuration as any };
    const refreshSignOptions: SignOptions = { expiresIn: sessionType.refreshTokenDuration as any };
    
    const newAccessToken = jwt.sign(
      { userId: user.id, email: decoded.email, role: user.role },
      JWT_SECRET,
      signOptions
    );

    const newRefreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      refreshSignOptions
    );

    // Update refresh token in database
    await pool.query('DELETE FROM refresh_tokens WHERE user_id = $1', [userId]);
    const refreshTokenDuration = sessionType.refreshTokenDuration;
    await pool.query(`
      INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at, is_revoked, created_at, updated_at)
      VALUES (gen_random_uuid(), $1, $2, NOW() + INTERVAL $3, false, NOW(), NOW())
    `, [user.id, newRefreshToken, refreshTokenDuration]);

    // Set updated JWT tokens as HTTP-only cookies
    res.setHeader('Set-Cookie', [
      `access_token=${newAccessToken}; HttpOnly; SameSite=Lax; Max-Age=${cookieOptions.maxAge}; Path=/`,
      `refresh_token=${newRefreshToken}; HttpOnly; SameSite=Lax; Max-Age=${cookieOptions.maxAge}; Path=/`
    ]);

    res.json({
      success: true,
      data: {
        sessionType: sessionType.description,
        operation: mappedOperation,
        route: currentRoute,
        expiresIn: sessionType.accessTokenDuration
      },
      message: `Session updated for ${operation}`
    });
  } catch (error) {
    console.error('Error updating session type:', error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
    res.status(500).json({
      success: false,
      error: 'Failed to update session type'
    });
  }
};