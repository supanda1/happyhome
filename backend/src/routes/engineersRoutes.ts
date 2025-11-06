import express from 'express';
import { EngineersController } from '../controllers/engineersController';
import { requireAdminAuth } from '../middleware/auth';
import { validationChains, validateUUID, commonValidations, handleValidationErrors } from '../middleware/validation';
import { body, param } from 'express-validator';

const router = express.Router();

// Engineer creation validation - extends employee validation with additional fields
const createEngineerValidation = [
  ...validationChains.employee.create.slice(0, -1), // Use employee validation minus handleValidationErrors
  commonValidations.optionalArray('specializations'),
  commonValidations.optionalString('emergency_contact_name', 100),
  commonValidations.optionalString('emergency_contact_phone', 20),
  commonValidations.optionalString('license_number', 50),
  body('certification_details').optional().isObject().withMessage('certification_details must be an object'),
  body('work_schedule').optional().isObject().withMessage('work_schedule must be an object'),
  body('max_concurrent_jobs').optional().isInt({ min: 1, max: 50 }).withMessage('max_concurrent_jobs must be between 1 and 50'),
  handleValidationErrors
];

// Engineer update validation (similar to create but optional fields)
const updateEngineerValidation = [
  ...validateUUID('id'),
  commonValidations.optionalString('employee_id', 50),
  commonValidations.optionalString('name', 100),
  commonValidations.optionalArray('expertise'),
  commonValidations.optionalArray('specializations'),
  commonValidations.optionalString('address', 500),
  body('phone').optional().matches(/^[+]?[\d\s\-()]{10,15}$/),
  body('email').optional().isEmail().normalizeEmail(),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
  commonValidations.optionalString('emergency_contact_name', 100),
  commonValidations.optionalString('emergency_contact_phone', 20),
  commonValidations.optionalString('license_number', 50),
  body('certification_details').optional().isObject().withMessage('certification_details must be an object'),
  body('work_schedule').optional().isObject().withMessage('work_schedule must be an object'),
  body('max_concurrent_jobs').optional().isInt({ min: 1, max: 50 }).withMessage('max_concurrent_jobs must be between 1 and 50'),
  handleValidationErrors
];

// Expertise validation
const expertiseValidation = [
  param('expertise')
    .trim()
    .notEmpty()
    .withMessage('Expertise parameter is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Expertise must be between 2 and 100 characters'),
  handleValidationErrors
];

// Admin-only endpoints (all engineer operations require authentication)
// GET /api/engineers - Get all engineers with optional filtering
router.get('/', requireAdminAuth, EngineersController.getAllEngineers);

// GET /api/engineers/expertise-areas - Get all available expertise areas (must come before /:id)
router.get('/expertise-areas', requireAdminAuth, EngineersController.getExpertiseAreas);

// GET /api/engineers/expertise/:expertise - Get engineers by expertise (must come before /:id)
router.get('/expertise/:expertise', requireAdminAuth, ...expertiseValidation, EngineersController.getEngineersByExpertise);

// GET /api/engineers/:id - Get single engineer by ID
router.get('/:id', requireAdminAuth, ...validateUUID('id'), EngineersController.getEngineerById);

// POST /api/engineers - Create new engineer
router.post('/', requireAdminAuth, ...createEngineerValidation, EngineersController.createEngineer);

// PUT /api/engineers/:id - Update engineer
router.put('/:id', requireAdminAuth, ...updateEngineerValidation, EngineersController.updateEngineer);

// DELETE /api/engineers/:id - Delete engineer
router.delete('/:id', requireAdminAuth, ...validateUUID('id'), EngineersController.deleteEngineer);

export default router;