import { Request, Response } from 'express';
import pool from '../config/database';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// In-memory store for applied coupons per user (in production, use Redis or database)
const userAppliedCoupons = new Map<string, {
  couponCode: string;
  discountAmount: number;
  appliedAt: Date;
}>();

// Helper function to extract user ID from JWT token
const getUserIdFromToken = (req: Request): string | null => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  
  try {
    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.userId;
  } catch (error) {
    return null;
  }
};

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

// Get or create anonymous session ID for non-authenticated users
const getOrCreateSessionId = (req: Request, res: Response): string => {
  // First try to get user ID from JWT token
  const userId = getUserIdFromToken(req);
  if (userId) {
    return userId; // Return actual user UUID
  }
  
  // For anonymous users, use session cookie with UUID format
  const cookies = parseCookies(req);
  let sessionId = cookies['cart_session'];
  
  // Validate existing sessionId is a proper UUID format
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!sessionId || !uuidRegex.test(sessionId)) {
    // Generate a proper UUID for anonymous sessions
    sessionId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
    
    // Set secure HTTP-only cookie for anonymous sessions
    res.setHeader('Set-Cookie', 
      `cart_session=${sessionId}; HttpOnly; SameSite=Lax; Max-Age=${30 * 24 * 60 * 60}; Path=/`
    );
  }
  
  return sessionId; // Return UUID directly
};

// Get user's cart
export const getCart = async (req: Request, res: Response) => {
  try {
    // Get session ID (works for both authenticated and anonymous users)
    const sessionId = getOrCreateSessionId(req, res);
    
    const itemsResult = await pool.query(`
      SELECT 
        ci.id,
        ci.service_id as "serviceId",
        ci.variant_id as "variantId", 
        ci.quantity,
        ci.unit_price as "unitPrice",
        ci.created_at as "createdAt",
        ci.updated_at as "updatedAt",
        s.name as "serviceName",
        s.base_price as "basePrice",
        s.discounted_price as "discountedPrice",
        s.gst_percentage as "gstPercentage",
        s.service_charge as "serviceChargePerService",
        s.category_id as "categoryId",
        sc.name as "categoryName"
      FROM cart_items ci
      LEFT JOIN services s ON ci.service_id::text = s.id::text
      LEFT JOIN service_categories sc ON s.category_id::text = sc.id::text
      WHERE ci.user_id::text = $1
      ORDER BY ci.created_at DESC
    `, [sessionId]);

    const totalItems = itemsResult.rows.reduce((sum, item) => sum + item.quantity, 0);
    const subtotal = itemsResult.rows.reduce((sum, item) => {
      const price = item.unitPrice;
      return sum + (price * item.quantity);
    }, 0);
    
    // Get unique categories for service charge calculation (₹79 per unique category)
    const uniqueCategories = new Set();
    itemsResult.rows.forEach(item => {
      if (item.categoryId) {
        uniqueCategories.add(item.categoryId);
      }
    });
    const serviceChargeAmount = uniqueCategories.size * 79;
    
    // Check for applied coupon
    const appliedCoupon = userAppliedCoupons.get(sessionId);
    let discountAmount = 0;
    let appliedCouponCode = null;
    
    if (appliedCoupon) {
      // Check if coupon was applied within last 24 hours (or remove this check for persistent coupons)
      const hoursSinceApplied = (new Date().getTime() - appliedCoupon.appliedAt.getTime()) / (1000 * 60 * 60);
      if (hoursSinceApplied < 24) {
        discountAmount = appliedCoupon.discountAmount;
        appliedCouponCode = appliedCoupon.couponCode;
      } else {
        // Remove expired coupon
        userAppliedCoupons.delete(sessionId);
      }
    }
    
    // Calculate GST on subtotal after discount, per service's GST percentage
    const subtotalAfterDiscount = subtotal - discountAmount;
    let totalGstAmount = 0;
    
    itemsResult.rows.forEach(item => {
      const itemSubtotal = item.unitPrice * item.quantity;
      const itemAfterDiscount = itemSubtotal * (subtotalAfterDiscount / subtotal); // Proportional discount
      const itemGst = (itemAfterDiscount * item.gstPercentage) / 100;
      totalGstAmount += itemGst;
    });
    
    // Round GST to 2 decimal places
    const gstAmount = Math.round(totalGstAmount * 100) / 100;
    
    // Calculate final amount: subtotal - discount + GST + service charge
    const finalAmount = subtotalAfterDiscount + gstAmount + serviceChargeAmount;
    
    const cart = {
      id: `cart-${sessionId}`,
      userId: sessionId,
      items: itemsResult.rows.map(item => ({
        ...item,
        totalPrice: item.unitPrice * item.quantity
      })),
      totalItems: totalItems,
      totalAmount: subtotal,
      subtotal: subtotal,  // Add this for frontend compatibility
      discountAmount: discountAmount,
      gstAmount: gstAmount,
      serviceChargeAmount: serviceChargeAmount,
      finalAmount: Math.round(finalAmount * 100) / 100,
      appliedCoupon: appliedCouponCode,
      createdAt: itemsResult.rows[0]?.createdAt || new Date().toISOString(),
      updatedAt: itemsResult.rows[0]?.updatedAt || new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: cart
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch cart'
    });
  }
};

// Add item to cart
export const addToCart = async (req: Request, res: Response) => {
  try {
    
    const { serviceId, variantId, quantity = 1 } = req.body;
    
    // Get session ID (works for both authenticated and anonymous users)
    const sessionId = getOrCreateSessionId(req, res);
    
    if (!serviceId) {
      return res.status(400).json({
        success: false,
        error: 'Service ID is required'
      });
    }

    // Get service details
    const serviceResult = await pool.query('SELECT * FROM services WHERE id = $1', [serviceId]);
    if (serviceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }

    const service = serviceResult.rows[0];
    const unitPrice = service.discounted_price || service.base_price;

    // Check if item already exists in cart
    const existingItem = await pool.query(`
      SELECT * FROM cart_items 
      WHERE user_id = $1 AND service_id = $2 AND variant_id IS NOT DISTINCT FROM $3
    `, [sessionId, serviceId, variantId || null]);

    let cartItem;
    
    if (existingItem.rows.length > 0) {
      // Update existing item
      const newQuantity = existingItem.rows[0].quantity + quantity;
      
      const updateResult = await pool.query(`
        UPDATE cart_items 
        SET quantity = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING *
      `, [newQuantity, existingItem.rows[0].id]);
      
      cartItem = updateResult.rows[0];
    } else {
      // Insert new item
      const insertResult = await pool.query(`
        INSERT INTO cart_items (
          id, user_id, service_id, variant_id, quantity, unit_price, customizations
        )
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, '{}')
        RETURNING *
      `, [sessionId, serviceId, variantId || null, quantity, unitPrice]);
      
      cartItem = insertResult.rows[0];
    }

    // Format response
    const responseItem = {
      id: cartItem.id,
      serviceId: cartItem.service_id,
      serviceName: service.name,
      variantId: cartItem.variant_id,
      quantity: cartItem.quantity,
      basePrice: service.base_price,
      discountedPrice: service.discounted_price,
      totalPrice: cartItem.unit_price * cartItem.quantity,
      createdAt: cartItem.created_at,
      updatedAt: cartItem.updated_at
    };
    
    res.status(201).json({
      success: true,
      data: responseItem,
      message: 'Item added to cart successfully'
    });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add item to cart'
    });
  }
};

// Update cart item quantity
export const updateCartItem = async (req: Request, res: Response) => {
  try {
    
    const { itemId } = req.params;
    const { quantity } = req.body;
    
    // Get user ID from JWT token
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token required'
      });
    }

    if (!quantity || quantity < 1) {
      return res.status(400).json({
        success: false,
        error: 'Valid quantity is required'
      });
    }

    // Get current item and service details
    const itemResult = await pool.query(`
      SELECT ci.*, s.name as service_name, s.base_price, s.discounted_price
      FROM cart_items ci
      LEFT JOIN services s ON ci.service_id = s.id
      WHERE ci.id = $1::uuid AND ci.user_id = $2
    `, [itemId, userId]);

    if (itemResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found'
      });
    }

    const item = itemResult.rows[0];

    const updateResult = await pool.query(`
      UPDATE cart_items 
      SET quantity = $1, updated_at = NOW()
      WHERE id = $2::uuid
      RETURNING *
    `, [quantity, itemId]);

    const updatedItem = {
      id: updateResult.rows[0].id,
      serviceId: updateResult.rows[0].service_id,
      serviceName: item.service_name,
      variantId: updateResult.rows[0].variant_id,
      quantity: updateResult.rows[0].quantity,
      basePrice: item.base_price,
      discountedPrice: item.discounted_price,
      totalPrice: updateResult.rows[0].unit_price * updateResult.rows[0].quantity,
      createdAt: updateResult.rows[0].created_at,
      updatedAt: updateResult.rows[0].updated_at
    };
    
    res.json({
      success: true,
      data: updatedItem,
      message: 'Cart item updated successfully'
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update cart item'
    });
  }
};

// Remove item from cart
export const removeFromCart = async (req: Request, res: Response) => {
  try {
    
    const { itemId } = req.params;
    
    // Get user ID from JWT token
    const userId = getUserIdFromToken(req);
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Authentication token required'
      });
    }

    const result = await pool.query(`
      DELETE FROM cart_items 
      WHERE id = $1::uuid AND user_id = $2
      RETURNING *
    `, [itemId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Cart item not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Error removing item from cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove item from cart'
    });
  }
};

// Clear entire cart
export const clearCart = async (req: Request, res: Response) => {
  try {
    
    // Get session ID (works for both authenticated and anonymous users)
    const sessionId = getOrCreateSessionId(req, res);

    await pool.query('DELETE FROM cart_items WHERE user_id = $1', [sessionId]);
    
    res.json({
      success: true,
      message: 'Cart cleared successfully'
    });
  } catch (error) {
    console.error('Error clearing cart:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear cart'
    });
  }
};

// Apply coupon to cart
export const applyCoupon = async (req: Request, res: Response) => {
  try {
    
    const { couponCode } = req.body;
    
    // Get session ID (works for both authenticated and anonymous users)
    const sessionId = getOrCreateSessionId(req, res);

    if (!couponCode) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code is required'
      });
    }

    // Validate coupon
    const couponResult = await pool.query(`
      SELECT * FROM coupons 
      WHERE code = $1 AND is_active = true 
      AND valid_from <= NOW() AND valid_until >= NOW()
    `, [couponCode]);

    if (couponResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired coupon code'
      });
    }

    // Get cart items with category and service information for validation
    const cartItemsResult = await pool.query(`
      SELECT 
        ci.*,
        s.category_id,
        s.id as service_id
      FROM cart_items ci
      LEFT JOIN services s ON ci.service_id = s.id
      WHERE ci.user_id = $1
    `, [sessionId]);

    if (cartItemsResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Cart is empty'
      });
    }

    // Get cart total
    const cartTotal = await pool.query(`
      SELECT COALESCE(SUM(unit_price * quantity), 0) as total
      FROM cart_items WHERE user_id = $1
    `, [sessionId]);

    const total = parseFloat(cartTotal.rows[0].total);
    const coupon = couponResult.rows[0];

    // Check minimum order amount
    if (total < coupon.minimum_order_amount) {
      return res.status(400).json({
        success: false,
        error: `Minimum order amount of ₹${coupon.minimum_order_amount} required`
      });
    }

    // Validate coupon applicability to cart items
    const cartItems = cartItemsResult.rows;

    // Check if coupon has category restrictions
    if (coupon.applicable_categories && coupon.applicable_categories.length > 0) {
      const hasValidCategory = cartItems.some(item => 
        coupon.applicable_categories.includes(item.category_id)
      );
      
      if (!hasValidCategory) {
        return res.status(400).json({
          success: false,
          error: 'This coupon is not applicable to the items in your cart'
        });
      }
    }

    // Check if coupon has service restrictions
    if (coupon.applicable_services && coupon.applicable_services.length > 0) {
      const hasValidService = cartItems.some(item => 
        coupon.applicable_services.includes(item.service_id)
      );
      
      if (!hasValidService) {
        return res.status(400).json({
          success: false,
          error: 'This coupon is not applicable to the items in your cart'
        });
      }
    }


    // Calculate discount
    let discountAmount = 0;
    if (coupon.type === 'percentage') {
      discountAmount = (total * coupon.value) / 100;
      if (coupon.maximum_discount_amount) {
        discountAmount = Math.min(discountAmount, coupon.maximum_discount_amount);
      }
    } else if (coupon.type === 'fixed_amount') {
      discountAmount = Math.min(coupon.value, total);
    }

    // Store applied coupon information
    userAppliedCoupons.set(sessionId, {
      couponCode: couponCode,
      discountAmount: Math.round(discountAmount),
      appliedAt: new Date()
    });

    // Return the cart with discount calculated
    const cart = {
      id: `cart-${sessionId}`,
      userId: sessionId,
      totalAmount: total,
      discountAmount: Math.round(discountAmount),
      finalAmount: Math.round(total - discountAmount),
      appliedCoupon: couponCode
    };

    res.json({
      success: true,
      data: cart,
      message: `Coupon applied! You save ₹${Math.round(discountAmount)}`
    });
  } catch (error) {
    console.error('Error applying coupon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to apply coupon'
    });
  }
};

// Remove coupon from cart
export const removeCoupon = async (req: Request, res: Response) => {
  try {
    
    // Get session ID (works for both authenticated and anonymous users)
    const sessionId = getOrCreateSessionId(req, res);

    // Remove applied coupon from memory
    userAppliedCoupons.delete(sessionId);

    // Get cart total without discount
    const cartTotal = await pool.query(`
      SELECT COALESCE(SUM(unit_price * quantity), 0) as total
      FROM cart_items WHERE user_id = $1
    `, [sessionId]);

    const total = parseFloat(cartTotal.rows[0].total);

    const cart = {
      id: `cart-${sessionId}`,
      userId: sessionId,
      totalAmount: total,
      discountAmount: 0,
      finalAmount: total,
      appliedCoupon: null
    };

    res.json({
      success: true,
      data: cart,
      message: 'Coupon removed successfully'
    });
  } catch (error) {
    console.error('Error removing coupon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove coupon'
    });
  }
};