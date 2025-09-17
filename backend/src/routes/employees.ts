import express from 'express';
import { EmployeesController } from '../controllers/employeesController';
import { requireAdminAuth } from '../middleware/auth';
import { validationChains, validateUUID, commonValidations, handleValidationErrors } from '../middleware/validation';
import { body, param } from 'express-validator';

const router = express.Router();

// Employee update validation (similar to create but optional fields)
const updateEmployeeValidation = [
  ...validateUUID('id'),
  commonValidations.optionalString('employee_id', 50),
  commonValidations.optionalString('name', 100),
  commonValidations.optionalString('expert', 100),
  commonValidations.optionalArray('expertise_areas'),
  commonValidations.optionalString('manager', 100),
  body('phone').optional().matches(/^[+]?[\d\s\-\(\)]{10,15}$/),
  body('email').optional().isEmail().normalizeEmail(),
  commonValidations.boolean('is_active'),
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

// Admin-only endpoints (all employee operations require authentication)
// GET /api/employees - Get all employees with optional filtering
router.get('/', requireAdminAuth, EmployeesController.getAllEmployees);

// GET /api/employees/expertise-areas - Get all available expertise areas (must come before /:id)
router.get('/expertise-areas', requireAdminAuth, EmployeesController.getExpertiseAreas);

// GET /api/employees/expertise/:expertise - Get employees by expertise (must come before /:id)
router.get('/expertise/:expertise', requireAdminAuth, ...expertiseValidation, EmployeesController.getEmployeesByExpertise);

// GET /api/employees/:id - Get single employee by ID
router.get('/:id', requireAdminAuth, ...validateUUID('id'), EmployeesController.getEmployeeById);

// POST /api/employees - Create new employee
router.post('/', requireAdminAuth, ...validationChains.employee.create, EmployeesController.createEmployee);

// PUT /api/employees/:id - Update employee
router.put('/:id', requireAdminAuth, ...updateEmployeeValidation, EmployeesController.updateEmployee);

// DELETE /api/employees/:id - Delete employee
router.delete('/:id', requireAdminAuth, ...validateUUID('id'), EmployeesController.deleteEmployee);

export default router;