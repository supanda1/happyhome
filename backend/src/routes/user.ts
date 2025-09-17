import express from 'express';
import {
  getUserAddresses,
  addUserAddress,
  updateUserAddresses,
  updateUserAddress,
  deleteUserAddress,
  getUserPreferences,
  updateUserPreferences
} from '../controllers/userController';

const router = express.Router();

// GET /api/user/addresses - Get user's addresses
router.get('/addresses', getUserAddresses);

// POST /api/user/addresses - Add new address
router.post('/addresses', addUserAddress);

// PUT /api/user/addresses - Update all addresses (bulk save)
router.put('/addresses', updateUserAddresses);

// PUT /api/user/addresses/:addressId - Update specific address
router.put('/addresses/:addressId', updateUserAddress);

// DELETE /api/user/addresses/:addressId - Delete specific address
router.delete('/addresses/:addressId', deleteUserAddress);

// GET /api/user/preferences - Get user preferences
router.get('/preferences', getUserPreferences);

// PUT /api/user/preferences - Update user preferences
router.put('/preferences', updateUserPreferences);

export default router;