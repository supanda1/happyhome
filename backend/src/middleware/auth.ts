import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extend Request interface to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        email: string;
        role: string;
        permissions?: string[];
      };
    }
  }
}

// Helper function to extract token from request
const extractToken = (req: Request): string | null => {
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
  
  // First try to get token from HTTP-only cookie
  let token = cookies.access_token;
  
  // Fallback to Authorization header if no cookie
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    }
  }
  
  return token;
};

// Middleware to verify JWT token and extract user info
export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    
    // Get user details from database to ensure user still exists and is active
    const userResult = await pool.query(
      'SELECT id, email, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'User not found'
      });
    }
    
    const user = userResult.rows[0];
    
    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'User account is deactivated'
      });
    }
    
    // Load user permissions for admin/super_admin users
    let permissions: string[] = [];
    if (user.role === 'admin') {
      const permissionsResult = await pool.query(`
        SELECT ap.permission_key 
        FROM user_admin_permissions uap
        JOIN admin_permissions ap ON uap.permission_id = ap.id
        WHERE uap.user_id = $1 AND ap.is_active = true AND uap.can_view = true
      `, [user.id]);
      
      permissions = permissionsResult.rows.map(row => row.permission_key);
    }
    // Super admins have all permissions by default
    else if (user.role === 'super_admin') {
      const allPermissionsResult = await pool.query(`
        SELECT permission_key FROM admin_permissions WHERE is_active = true
      `);
      permissions = allPermissionsResult.rows.map(row => row.permission_key);
    }
    
    // Attach user info to request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: permissions
    };
    
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({
        success: false,
        error: 'Invalid access token'
      });
    }
    
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Middleware to require admin role (admin or super_admin)
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Admin access required. Contact administrator for access.'
    });
  }
  
  next();
};

// Middleware to require super admin role specifically
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  if (req.user.role !== 'super_admin') {
    return res.status(403).json({
      success: false,
      error: 'Super admin access required'
    });
  }
  
  next();
};

// Middleware factory to require specific permission
export const requirePermission = (permissionKey: string, requireEdit: boolean = false) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    // Super admins have all permissions
    if (req.user.role === 'super_admin') {
      return next();
    }
    
    // Check if user has the required permission
    if (!req.user.permissions || !req.user.permissions.includes(permissionKey)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required permission: ${permissionKey}`
      });
    }
    
    // For edit operations, check if user has edit permission
    if (requireEdit) {
      // Need to check edit permission in database
      pool.query(`
        SELECT uap.can_edit 
        FROM user_admin_permissions uap
        JOIN admin_permissions ap ON uap.permission_id = ap.id
        WHERE uap.user_id = $1 AND ap.permission_key = $2
      `, [req.user.userId, permissionKey])
      .then(result => {
        if (result.rows.length === 0 || !result.rows[0].can_edit) {
          return res.status(403).json({
            success: false,
            error: `Edit access denied for: ${permissionKey}`
          });
        }
        next();
      })
      .catch(error => {
        return res.status(500).json({
          success: false,
          error: 'Permission check failed'
        });
      });
    } else {
      next();
    }
  };
};

// Combined middleware for admin authentication
export const requireAdminAuth = [authenticateToken, requireAdmin];

// Combined middleware for super admin authentication
export const requireSuperAdminAuth = [authenticateToken, requireSuperAdmin];

// Middleware to require user authentication (customer or admin)
export const requireAuth = authenticateToken;

// Optional authentication (for endpoints that work for both auth and non-auth users)
export const optionalAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      const userResult = await pool.query(
        'SELECT id, email, role, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );
      
      if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
        const user = userResult.rows[0];
        
        // Load permissions for admin users
        let permissions: string[] = [];
        if (user.role === 'admin') {
          const permissionsResult = await pool.query(`
            SELECT ap.permission_key 
            FROM user_admin_permissions uap
            JOIN admin_permissions ap ON uap.permission_id = ap.id
            WHERE uap.user_id = $1 AND ap.is_active = true AND uap.can_view = true
          `, [user.id]);
          
          permissions = permissionsResult.rows.map(row => row.permission_key);
        }
        // Super admins have all permissions by default
        else if (user.role === 'super_admin') {
          const allPermissionsResult = await pool.query(`
            SELECT permission_key FROM admin_permissions WHERE is_active = true
          `);
          permissions = allPermissionsResult.rows.map(row => row.permission_key);
        }
        
        req.user = {
          userId: user.id,
          email: user.email,
          role: user.role,
          permissions: permissions
        };
      }
    }
    
    // Continue regardless of authentication status
    next();
  } catch (error) {
    // Ignore auth errors for optional auth, continue without user
    next();
  }
};