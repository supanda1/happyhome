import express from 'express';
import {
  register,
  login,
  logout,
  getProfile,
  updateProfile,
  getCurrentUser,
  refreshToken,
  changePassword
} from '../controllers/authController';

const router = express.Router();

// POST /api/auth/register - Register new user
router.post('/register', register);

// POST /api/auth/login - Login user
router.post('/login', login);

// POST /api/auth/logout - Logout user
router.post('/logout', logout);

// GET /api/auth/profile - Get user profile
router.get('/profile', getProfile);

// PATCH /api/auth/profile - Update user profile
router.patch('/profile', updateProfile);

// GET /api/auth/me - Get current authenticated user 
router.get('/me', getCurrentUser);

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', refreshToken);

// POST /api/auth/change-password - Change user password
router.post('/change-password', changePassword);

export default router;