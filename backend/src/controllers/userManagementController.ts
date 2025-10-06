import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import pool from '../config/database';

// Get all admin users (Super Admin only)
export const getAllAdminUsers = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.role,
        u.is_active,
        u.is_verified,
        u.last_login,
        u.created_at,
        u.updated_at,
        COUNT(uap.id) as assigned_permissions
      FROM users u
      LEFT JOIN user_admin_permissions uap ON u.id = uap.user_id
      WHERE u.role IN ('admin', 'super_admin')
      GROUP BY u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.is_active, u.is_verified, u.last_login, u.created_at, u.updated_at
      ORDER BY u.role DESC, u.created_at DESC
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching admin users:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch admin users'
    });
  }
};

// Get user permissions
export const getUserPermissions = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const query = `
      SELECT 
        ap.id,
        ap.permission_key,
        ap.permission_name,
        ap.permission_description,
        ap.category,
        uap.can_view,
        uap.can_edit,
        uap.granted_at,
        granted_by_user.email as granted_by_email,
        granted_by_user.first_name as granted_by_first_name,
        granted_by_user.last_name as granted_by_last_name
      FROM admin_permissions ap
      LEFT JOIN user_admin_permissions uap ON ap.id = uap.permission_id AND uap.user_id = $1
      LEFT JOIN users granted_by_user ON uap.granted_by = granted_by_user.id
      WHERE ap.is_active = true
      ORDER BY ap.category, ap.permission_name
    `;
    
    const result = await pool.query(query, [userId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching user permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch user permissions'
    });
  }
};

// Create new admin user
export const createAdminUser = async (req: Request, res: Response) => {
  try {
    const { email, password, firstName, lastName, phone, role } = req.body;
    // Note: currentUserId available for audit logging if needed
    // const currentUserId = req.user?.userId;
    
    // Validation
    if (!email || !password || !firstName || !lastName || !role) {
      return res.status(400).json({
        success: false,
        error: 'Email, password, first name, last name, and role are required'
      });
    }
    
    // Only allow creating admin users, not super_admin (security measure)
    if (role !== 'admin') {
      return res.status(400).json({
        success: false,
        error: 'Can only create admin users'
      });
    }
    
    // Check if email already exists
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists'
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const query = `
      INSERT INTO users (
        email, password_hash, first_name, last_name, phone, role,
        is_active, is_verified, profile_completed, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, true, true, true, NOW(), NOW())
      RETURNING id, email, first_name, last_name, phone, role, is_active, created_at
    `;
    
    const result = await pool.query(query, [
      email.toLowerCase(),
      hashedPassword,
      firstName,
      lastName,
      phone || null,
      role
    ]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Admin user created successfully'
    });
  } catch (error) {
    console.error('Error creating admin user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create admin user'
    });
  }
};

// Update admin user
export const updateAdminUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, phone, isActive } = req.body;
    
    const query = `
      UPDATE users 
      SET 
        first_name = COALESCE($1, first_name),
        last_name = COALESCE($2, last_name), 
        phone = COALESCE($3, phone),
        is_active = COALESCE($4, is_active),
        updated_at = NOW()
      WHERE id = $5 AND role IN ('admin', 'super_admin')
      RETURNING id, email, first_name, last_name, phone, role, is_active, updated_at
    `;
    
    const result = await pool.query(query, [
      firstName || null,
      lastName || null,
      phone || null,
      isActive !== undefined ? isActive : null,
      userId
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Admin user updated successfully'
    });
  } catch (error) {
    console.error('Error updating admin user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update admin user'
    });
  }
};

// Grant permission to admin user
export const grantPermission = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { permissionIds, canView = true, canEdit = false } = req.body;
    const currentUserId = req.user?.userId;
    
    if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Permission IDs array is required'
      });
    }
    
    // Verify user exists and is admin
    const userCheck = await pool.query(
      'SELECT id, role FROM users WHERE id = $1 AND role = $2',
      [userId, 'admin']
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found'
      });
    }
    
    // Grant permissions
    const grantedPermissions = [];
    for (const permissionId of permissionIds) {
      try {
        const query = `
          INSERT INTO user_admin_permissions (user_id, permission_id, can_view, can_edit, granted_by)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (user_id, permission_id) 
          DO UPDATE SET 
            can_view = EXCLUDED.can_view,
            can_edit = EXCLUDED.can_edit,
            granted_by = EXCLUDED.granted_by,
            granted_at = NOW(),
            updated_at = NOW()
          RETURNING permission_id
        `;
        
        const result = await pool.query(query, [
          userId, permissionId, canView, canEdit, currentUserId
        ]);
        
        if (result.rows.length > 0) {
          grantedPermissions.push(permissionId);
        }
      } catch (permError) {
        console.error(`Error granting permission ${permissionId}:`, permError);
      }
    }
    
    res.json({
      success: true,
      message: `Granted ${grantedPermissions.length} permission(s) successfully`,
      granted: grantedPermissions.length,
      total: permissionIds.length
    });
  } catch (error) {
    console.error('Error granting permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to grant permissions'
    });
  }
};

// Revoke permission from admin user
export const revokePermission = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { permissionIds } = req.body;
    
    if (!permissionIds || !Array.isArray(permissionIds) || permissionIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Permission IDs array is required'
      });
    }
    
    // Revoke permissions
    const query = `
      DELETE FROM user_admin_permissions 
      WHERE user_id = $1 AND permission_id = ANY($2::uuid[])
    `;
    
    const result = await pool.query(query, [userId, permissionIds]);
    
    res.json({
      success: true,
      message: `Revoked ${result.rowCount} permission(s) successfully`,
      revoked: result.rowCount
    });
  } catch (error) {
    console.error('Error revoking permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to revoke permissions'
    });
  }
};

// Get all available permissions
export const getAllPermissions = async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        id,
        permission_key,
        permission_name,
        permission_description,
        category,
        is_active,
        created_at
      FROM admin_permissions
      WHERE is_active = true
      ORDER BY category, permission_name
    `;
    
    const result = await pool.query(query);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching permissions:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch permissions'
    });
  }
};

// Delete admin user (deactivate)
export const deleteAdminUser = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    // Cannot delete super admin users
    const userCheck = await pool.query(
      'SELECT role FROM users WHERE id = $1',
      [userId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    
    if (userCheck.rows[0].role === 'super_admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot delete super admin users'
      });
    }
    
    // Deactivate user instead of deleting
    const query = `
      UPDATE users 
      SET is_active = false, updated_at = NOW()
      WHERE id = $1 AND role = 'admin'
      RETURNING id, email, is_active
    `;
    
    const result = await pool.query(query, [userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Admin user not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Admin user deactivated successfully'
    });
  } catch (error) {
    console.error('Error deleting admin user:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete admin user'
    });
  }
};