import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../config/database';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Extend Request interface to include user data
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
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

// JWT payload interface
interface JWTPayload {
  userId: string;
  email: string;
  role: string;
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
    console.log(`🔐 AUTH DEBUG: ${req.method} ${req.path} - Starting authentication`);
    const token = extractToken(req);
    console.log(`🔐 AUTH DEBUG: Token extracted: ${token ? 'YES' : 'NO'}`);
    
    if (!token) {
      console.log('🔐 AUTH DEBUG: No token found, returning 401');
      return res.status(401).json({
        success: false,
        error: 'Access token required'
      });
    }

    // Verify JWT token
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    console.log(`🔐 AUTH DEBUG: JWT decoded successfully, userId: ${decoded.userId}, role: ${decoded.role}`);
    
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
    console.log(`🔐 AUTH DEBUG: User found in DB - id: ${user.id}, email: ${user.email}, role: ${user.role}, is_active: ${user.is_active}`);
    
    if (!user.is_active) {
      console.log('🔐 AUTH DEBUG: User account is deactivated, returning 401');
      return res.status(401).json({
        success: false,
        error: 'User account is deactivated'
      });
    }
    
    // Load user permissions for admin/super_admin users
    let permissions: string[] = [];
    
    // For super_admin, grant all permissions without database lookup
    if (user.role === 'super_admin') {
      console.log('🔐 AUTH DEBUG: Super admin detected, granting all permissions');
      permissions = ['*']; // Universal permission for super admin
    }
    // For regular admin, try to load permissions but handle missing tables gracefully
    else if (user.role === 'admin') {
      try {
        const permissionsResult = await pool.query(`
          SELECT ap.permission_key 
          FROM user_admin_permissions uap
          JOIN admin_permissions ap ON uap.permission_id = ap.id
          WHERE uap.user_id = $1 AND ap.is_active = true AND uap.can_view = true
        `, [user.id]);
        
        permissions = permissionsResult.rows.map(row => row.permission_key);
        console.log(`🔐 AUTH DEBUG: Loaded ${permissions.length} permissions for admin user`);
      } catch (permError) {
        console.log('🔐 AUTH DEBUG: Admin permissions table not found, granting basic admin access');
        permissions = ['admin']; // Basic admin permissions if tables don't exist
      }
    }
    
    // Attach user info to request
    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role,
      permissions: permissions
    };
    
    console.log(`🔐 AUTH DEBUG: Authentication successful for user ${user.email} (${user.role})`);
    next();
  } catch (error) {
    console.log(`🔐 AUTH DEBUG: Authentication error:`, error);
    if (error instanceof jwt.JsonWebTokenError) {
      console.log('🔐 AUTH DEBUG: JWT verification failed:', error.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid access token'
      });
    }
    
    console.log('🔐 AUTH DEBUG: General authentication failure:', error);
    return res.status(500).json({
      success: false,
      error: 'Authentication failed'
    });
  }
};

// Middleware to require admin role (admin or super_admin)
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  console.log(`🔐 ADMIN DEBUG: Checking admin access for ${req.method} ${req.path}`);
  if (!req.user) {
    console.log('🔐 ADMIN DEBUG: No user in request, returning 401');
    return res.status(401).json({
      success: false,
      error: 'Authentication required'
    });
  }
  
  console.log(`🔐 ADMIN DEBUG: User role: ${req.user.role}, checking if admin or super_admin`);
  if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
    console.log(`🔐 ADMIN DEBUG: Role ${req.user.role} is not admin or super_admin, returning 403`);
    return res.status(403).json({
      success: false,
      error: 'Admin access required. Contact administrator for access.'
    });
  }
  
  console.log(`🔐 ADMIN DEBUG: Role ${req.user.role} is valid admin role, proceeding`);
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
      .catch(() => {
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

// Middleware for super admin OR admin with specific permission
export const requireSuperAdminOrPermission = (permissionKey: string, requireCreate: boolean = true, requireEdit: boolean = false) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    console.log(`🔐 PERMISSION DEBUG: Checking ${permissionKey} access for ${req.method} ${req.path}`);
    
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }
    
    console.log(`🔐 PERMISSION DEBUG: User role: ${req.user.role}`);
    
    // Super admins have all permissions
    if (req.user.role === 'super_admin') {
      console.log('🔐 PERMISSION DEBUG: Super admin access granted');
      return next();
    }
    
    // For regular admin users, check permissions
    if (req.user.role === 'admin') {
      try {
        const permissionQuery = `
          SELECT uap.can_view, uap.can_create, uap.can_edit, uap.can_delete
          FROM user_admin_permissions uap
          JOIN admin_permissions ap ON uap.permission_id = ap.id
          WHERE uap.user_id = $1 AND ap.permission_key = $2 AND ap.is_active = true
        `;
        
        const result = await pool.query(permissionQuery, [req.user.userId, permissionKey]);
        
        if (result.rows.length === 0) {
          console.log(`🔐 PERMISSION DEBUG: No permission found for ${permissionKey}`);
          return res.status(403).json({
            success: false,
            error: `Access denied. Super admin privileges or '${permissionKey}' permission required. Contact super admin for access.`
          });
        }
        
        const permissions = result.rows[0];
        console.log(`🔐 PERMISSION DEBUG: Found permissions:`, permissions);
        
        // Check specific permission requirements
        if (requireCreate && !permissions.can_create) {
          return res.status(403).json({
            success: false,
            error: `Create access denied for '${permissionKey}'. Contact super admin to grant create permissions.`
          });
        }
        
        if (requireEdit && !permissions.can_edit) {
          return res.status(403).json({
            success: false,
            error: `Edit access denied for '${permissionKey}'. Contact super admin to grant edit permissions.`
          });
        }
        
        console.log(`🔐 PERMISSION DEBUG: Permission check passed for ${permissionKey}`);
        return next();
        
      } catch (error) {
        console.error('🔐 PERMISSION DEBUG: Permission check error:', error);
        // Gracefully handle missing permission tables - deny access for create operations
        if (requireCreate || requireEdit) {
          return res.status(403).json({
            success: false,
            error: `Access denied. Super admin privileges required for '${permissionKey}' operations.`
          });
        }
        return next();
      }
    }
    
    // Non-admin users are denied access
    console.log(`🔐 PERMISSION DEBUG: Role ${req.user.role} denied access to ${permissionKey}`);
    return res.status(403).json({
      success: false,
      error: `Access denied. Admin or super admin role required for '${permissionKey}' operations.`
    });
  };
};

// Combined middleware for admin authentication
export const requireAdminAuth = [authenticateToken, requireAdmin];

// Combined middleware for super admin authentication
export const requireSuperAdminAuth = [authenticateToken, requireSuperAdmin];

// Middleware to require user authentication (customer or admin)
export const requireAuth = authenticateToken;

// Optional authentication (for endpoints that work for both auth and non-auth users)
export const optionalAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const token = extractToken(req);
    
    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
      const userResult = await pool.query(
        'SELECT id, email, role, is_active FROM users WHERE id = $1',
        [decoded.userId]
      );
      
      if (userResult.rows.length > 0 && userResult.rows[0].is_active) {
        const user = userResult.rows[0];
        
        // Load permissions for admin users (handle missing tables gracefully)
        let permissions: string[] = [];
        if (user.role === 'super_admin') {
          permissions = ['*']; // Universal permission for super admin
        } else if (user.role === 'admin') {
          try {
            const permissionsResult = await pool.query(`
              SELECT ap.permission_key 
              FROM user_admin_permissions uap
              JOIN admin_permissions ap ON uap.permission_id = ap.id
              WHERE uap.user_id = $1 AND ap.is_active = true AND uap.can_view = true
            `, [user.id]);
            
            permissions = permissionsResult.rows.map(row => row.permission_key);
          } catch (permError) {
            permissions = ['admin']; // Basic admin permissions if tables don't exist
          }
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
  } catch {
    // Ignore auth errors for optional auth, continue without user
    next();
  }
};