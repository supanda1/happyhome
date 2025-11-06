import express from 'express';
import { EngineersController } from '../controllers/engineersController';
import { requireAdminAuth } from '../middleware/auth';
import { validationChains, validateUUID, commonValidations, handleValidationErrors } from '../middleware/validation';
import { body, param } from 'express-validator';

const router = express.Router();

// Engineer update validation (similar to create but optional fields)
const updateEngineerValidation = [
  ...validateUUID('id'),
  commonValidations.optionalString('employee_id', 50),
  commonValidations.optionalString('name', 100),
  commonValidations.optionalArray('expertise'),
  commonValidations.optionalString('address', 500),
  body('phone').optional().matches(/^[+]?[\d\s\-()]{10,15}$/),
  body('email').optional().isEmail().normalizeEmail(),
  body('is_active').optional().isBoolean().withMessage('is_active must be a boolean'),
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
router.post('/', requireAdminAuth, ...validationChains.engineer.create, EngineersController.createEngineer);

// PUT /api/engineers/:id - Update engineer
router.put('/:id', requireAdminAuth, ...updateEngineerValidation, EngineersController.updateEngineer);

// DELETE /api/engineers/:id - Delete engineer
router.delete('/:id', requireAdminAuth, ...validateUUID('id'), EngineersController.deleteEngineer);

export default router;