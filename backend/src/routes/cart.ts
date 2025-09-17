import express from 'express';
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  applyCoupon,
  removeCoupon
} from '../controllers/cartController';

const router = express.Router();

// GET /api/cart - Get user's cart
router.get('/', getCart);

// POST /api/cart/items - Add item to cart
router.post('/items', addToCart);

// PUT /api/cart/items/:itemId - Update cart item quantity
router.put('/items/:itemId', updateCartItem);

// DELETE /api/cart/items/:itemId - Remove item from cart
router.delete('/items/:itemId', removeFromCart);

// DELETE /api/cart - Clear entire cart
router.delete('/', clearCart);

// POST /api/cart/apply-coupon - Apply coupon to cart
router.post('/apply-coupon', applyCoupon);

// POST /api/cart/coupon - Apply coupon to cart (alternative route for frontend compatibility)
router.post('/coupon', applyCoupon);

// DELETE /api/cart/coupon - Remove coupon from cart
router.delete('/coupon', removeCoupon);

export default router;