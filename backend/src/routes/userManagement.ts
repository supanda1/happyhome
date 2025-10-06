import { Router } from 'express';
import {
  getAllAdminUsers,
  getUserPermissions,
  createAdminUser,
  updateAdminUser,
  grantPermission,
  revokePermission,
  getAllPermissions,
  deleteAdminUser
} from '../controllers/userManagementController';
import { requireSuperAdminAuth } from '../middleware/auth';
import { validateUUID, handleValidationErrors } from '../middleware/validation';
import { body } from 'express-validator';

const router = Router();

// Validation for creating admin user
const createAdminUserValidation = [
  body('email').isEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('firstName').notEmpty().withMessage('First name is required'),
  body('lastName').notEmpty().withMessage('Last name is required'),
  body('role').equals('admin').withMessage('Only admin role is allowed'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  handleValidationErrors
];

// Validation for updating admin user
const updateAdminUserValidation = [
  ...validateUUID('userId'),
  body('firstName').optional().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().notEmpty().withMessage('Last name cannot be empty'),
  body('phone').optional().isMobilePhone('any').withMessage('Valid phone number required'),
  body('isActive').optional().isBoolean().withMessage('isActive must be boolean'),
  handleValidationErrors
];

// Validation for granting permissions
const grantPermissionValidation = [
  ...validateUUID('userId'),
  body('permissionIds').isArray({ min: 1 }).withMessage('Permission IDs array is required'),
  body('permissionIds.*').isUUID().withMessage('Each permission ID must be valid UUID'),
  body('canView').optional().isBoolean().withMessage('canView must be boolean'),
  body('canEdit').optional().isBoolean().withMessage('canEdit must be boolean'),
  handleValidationErrors
];

// Validation for revoking permissions
const revokePermissionValidation = [
  ...validateUUID('userId'),
  body('permissionIds').isArray({ min: 1 }).withMessage('Permission IDs array is required'),
  body('permissionIds.*').isUUID().withMessage('Each permission ID must be valid UUID'),
  handleValidationErrors
];

// ================================
// SUPER ADMIN ONLY ROUTES
// ================================

// Get all admin users
router.get('/users', requireSuperAdminAuth, getAllAdminUsers);

// Get all available permissions
router.get('/permissions', requireSuperAdminAuth, getAllPermissions);

// Get specific user's permissions
router.get('/users/:userId/permissions', requireSuperAdminAuth, ...validateUUID('userId'), getUserPermissions);

// Create new admin user
router.post('/users', requireSuperAdminAuth, ...createAdminUserValidation, createAdminUser);

// Update admin user
router.put('/users/:userId', requireSuperAdminAuth, ...updateAdminUserValidation, updateAdminUser);

// Grant permissions to admin user
router.post('/users/:userId/permissions/grant', requireSuperAdminAuth, ...grantPermissionValidation, grantPermission);

// Revoke permissions from admin user
router.post('/users/:userId/permissions/revoke', requireSuperAdminAuth, ...revokePermissionValidation, revokePermission);

// Delete (deactivate) admin user
router.delete('/users/:userId', requireSuperAdminAuth, ...validateUUID('userId'), deleteAdminUser);

export default router;