import express from 'express';
import { OrdersController } from '../controllers/ordersController';
import { requireAdminAuth, requireAuth } from '../middleware/auth';
import { validationChains, validateUUID, commonValidations, handleValidationErrors } from '../middleware/validation';
import { body } from 'express-validator';

const router = express.Router();

// Order update validation
const updateOrderValidation = [
  ...validateUUID('id'),
  commonValidations.optionalEnum('status', ['pending', 'confirmed', 'scheduled', 'in_progress', 'completed', 'cancelled']),
  commonValidations.optionalEnum('priority', ['low', 'medium', 'high', 'urgent']),
  commonValidations.optionalString('notes', 1000),
  commonValidations.optionalDate('scheduled_date'),
  body('final_amount').optional().isFloat({ min: 0 }),
  handleValidationErrors
];

// Order item update validation
const updateOrderItemValidation = [
  ...validateUUID('orderId'),
  ...validateUUID('itemId'),
  commonValidations.optionalEnum('item_status', ['pending', 'scheduled', 'in_progress', 'completed', 'cancelled']),
  body('quantity').optional().isInt({ min: 1 }),
  body('unit_price').optional().isFloat({ min: 0 }),
  body('total_price').optional().isFloat({ min: 0 }),
  commonValidations.optionalDate('scheduled_date'),
  commonValidations.optionalString('notes', 500),
  handleValidationErrors
];

// Engineer assignment validation
const assignEngineerValidation = [
  ...validateUUID('orderId'),
  ...validateUUID('itemId'),
  commonValidations.uuid('engineer_id'),
  commonValidations.optionalDate('scheduled_date'),
  commonValidations.optionalString('notes', 500),
  handleValidationErrors
];

// Bulk assignment validation
const bulkAssignValidation = [
  commonValidations.array('assignments'),
  body('assignments.*.order_id').isUUID(4).withMessage('Each assignment must have a valid order_id'),
  body('assignments.*.item_id').isUUID(4).withMessage('Each assignment must have a valid item_id'),
  body('assignments.*.engineer_id').isUUID(4).withMessage('Each assignment must have a valid engineer_id'),
  body('assignments.*.scheduled_date').optional().isISO8601().withMessage('Scheduled date must be valid ISO 8601 date'),
  handleValidationErrors
];

// Routes that need to come before /:id to avoid conflicts
// POST /api/orders/bulk-assign - Bulk assign engineers to multiple items (admin only)
router.post('/bulk-assign', requireAdminAuth, ...bulkAssignValidation, OrdersController.bulkAssignEngineers);

// GET /api/orders/workload/engineers - Get engineer workload statistics (admin only)
router.get('/workload/engineers', requireAdminAuth, OrdersController.getEngineerWorkloadStats);

// Order management endpoints
// GET /api/orders - Get all orders with optional filtering (admin only for all orders)
router.get('/', requireAdminAuth, OrdersController.getAllOrders);

// POST /api/orders - Create new order
router.post('/', requireAuth, ...validationChains.order.create, OrdersController.createOrder);

// GET /api/orders/:id - Get single order by ID
router.get('/:id', requireAdminAuth, ...validateUUID('id'), OrdersController.getOrderById);

// PUT /api/orders/:id - Update order (admin only)
router.put('/:id', requireAdminAuth, ...updateOrderValidation, OrdersController.updateOrder);

// DELETE /api/orders/:id - Delete order (admin only)
router.delete('/:id', requireAdminAuth, ...validateUUID('id'), OrdersController.deleteOrder);

// Order item management (admin only)
// PUT /api/orders/:orderId/items/:itemId - Update order item
router.put('/:orderId/items/:itemId', requireAdminAuth, ...updateOrderItemValidation, OrdersController.updateOrderItem);

// Engineer assignment endpoints (admin only)
// POST /api/orders/:orderId/items/:itemId/assign - Assign engineer to order item
router.post('/:orderId/items/:itemId/assign', requireAdminAuth, ...assignEngineerValidation, OrdersController.assignEngineer);

// POST /api/orders/:orderId/auto-assign - Auto-assign engineers based on expertise and workload
router.post('/:orderId/auto-assign', requireAdminAuth, ...validateUUID('orderId'), OrdersController.autoAssignEngineers);

// Assignment history endpoints (admin only)
// GET /api/orders/:orderId/assignments/history - Get assignment history for order
router.get('/:orderId/assignments/history', requireAdminAuth, ...validateUUID('orderId'), OrdersController.getAssignmentHistory);

// GET /api/orders/:orderId/items/:itemId/assignments/history - Get assignment history for specific item
router.get('/:orderId/items/:itemId/assignments/history', requireAdminAuth, ...validateUUID('orderId'), ...validateUUID('itemId'), OrdersController.getAssignmentHistory);

export default router;