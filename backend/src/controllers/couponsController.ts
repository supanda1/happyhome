import { Request, Response } from 'express';
import pool from '../config/database';

// Get all coupons
export const getCoupons = async (req: Request, res: Response) => {
  try {
    
    const result = await pool.query(`
      SELECT 
        id,
        code,
        title,
        description,
        discount_type,
        discount_value,
        minimum_order_amount,
        maximum_discount_amount,
        valid_from,
        valid_until,
        usage_limit,
        usage_count,
        usage_limit_per_user,
        is_active,
        applicable_categories,
        applicable_services,
        created_at,
        updated_at
      FROM coupons
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching coupons:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch coupons'
    });
  }
};

// Get active coupons only
export const getActiveCoupons = async (req: Request, res: Response) => {
  try {
    
    const result = await pool.query(`
      SELECT 
        id,
        code,
        title,
        description,
        discount_type,
        discount_value,
        minimum_order_amount,
        maximum_discount_amount,
        valid_from,
        valid_until,
        usage_limit,
        usage_count,
        usage_limit_per_user,
        is_active,
        applicable_categories,
        applicable_services,
        created_at,
        updated_at
      FROM coupons
      WHERE is_active = true AND valid_from <= NOW() AND valid_until >= NOW()
      ORDER BY created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching active coupons:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active coupons'
    });
  }
};

// Create new coupon
export const createCoupon = async (req: Request, res: Response) => {
  try {
    
    const { 
      id,
      code,
      title,
      description,
      discount_type,
      discount_value,
      minimum_order_amount = 0,
      maximum_discount_amount,
      valid_from,
      valid_until,
      usage_limit,
      usage_limit_per_user = 1,
      usage_count = 0,
      applicable_categories = [],
      applicable_services = [],
      is_active = true
    } = req.body;
    
    
    if (!id || !code || !title || !description || !discount_type || !discount_value || !valid_from || !valid_until) {
      return res.status(400).json({
        success: false,
        error: 'ID, code, name, description, type, value, valid_from, and valid_until are required'
      });
    }

    // Check if coupon code already exists
    const existingCoupon = await pool.query('SELECT id FROM coupons WHERE code = $1', [code]);
    if (existingCoupon.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code already exists'
      });
    }
    
    // Ensure arrays are properly serialized as JSON for PostgreSQL
    const serializedCategories = Array.isArray(applicable_categories) 
      ? JSON.stringify(applicable_categories) 
      : applicable_categories || '[]';
    const serializedServices = Array.isArray(applicable_services) 
      ? JSON.stringify(applicable_services) 
      : applicable_services || '[]';

    
    const result = await pool.query(`
      INSERT INTO coupons (
        id, code, title, description, discount_type, discount_value, 
        minimum_order_amount, maximum_discount_amount, valid_from, valid_until,
        usage_limit, usage_count, usage_limit_per_user, applicable_categories,
        applicable_services, is_active, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW(), NOW())
      RETURNING *
    `, [
      id, code, title, description, discount_type, discount_value,
      minimum_order_amount, maximum_discount_amount, valid_from, valid_until,
      usage_limit, usage_count, usage_limit_per_user, serializedCategories,
      serializedServices, is_active
    ]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating coupon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create coupon'
    });
  }
};

// Update coupon
export const updateCoupon = async (req: Request, res: Response) => {
  try {
    
    const { id } = req.params;
    const { 
      code,
      title,
      description,
      discount_type,
      discount_value,
      minimum_order_amount,
      maximum_discount_amount,
      valid_from,
      valid_until,
      usage_limit,
      usage_limit_per_user,
      applicable_categories,
      applicable_services,
      is_active
    } = req.body;

    // Check if coupon code already exists for other coupons
    if (code) {
      const existingCoupon = await pool.query(
        'SELECT id FROM coupons WHERE code = $1 AND id != $2', 
        [code, id]
      );
      if (existingCoupon.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Coupon code already exists'
        });
      }
    }
    
    // Ensure arrays are properly serialized as JSON for PostgreSQL
    const serializedCategories = Array.isArray(applicable_categories) 
      ? JSON.stringify(applicable_categories) 
      : applicable_categories || '[]';
    const serializedServices = Array.isArray(applicable_services) 
      ? JSON.stringify(applicable_services) 
      : applicable_services || '[]';


    const result = await pool.query(`
      UPDATE coupons 
      SET 
        code = $1,
        title = $2,
        description = $3,
        discount_type = $4,
        discount_value = $5,
        minimum_order_amount = $6,
        maximum_discount_amount = $7,
        valid_from = $8,
        valid_until = $9,
        usage_limit = $10,
        usage_limit_per_user = $11,
        applicable_categories = $12,
        applicable_services = $13,
        is_active = $14,
        updated_at = NOW()
      WHERE id = $15
      RETURNING *
    `, [
      code, title, description, discount_type, discount_value,
      minimum_order_amount, maximum_discount_amount, valid_from, valid_until,
      usage_limit, usage_limit_per_user, serializedCategories,
      serializedServices, is_active, id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating coupon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update coupon'
    });
  }
};

// Delete coupon
export const deleteCoupon = async (req: Request, res: Response) => {
  try {
    
    const { id } = req.params;
    
    // Check if coupon is used in any orders (if you have coupon_usages table)
    const usageCheck = await pool.query('SELECT COUNT(*) FROM coupon_usages WHERE coupon_id = $1', [id]);
    if (parseInt(usageCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete coupon that has been used. Deactivate instead.'
      });
    }
    
    const result = await pool.query(
      'DELETE FROM coupons WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Coupon deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting coupon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete coupon'
    });
  }
};

// Get coupon by ID
export const getCouponById = async (req: Request, res: Response) => {
  try {
    
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        id,
        code,
        title,
        description,
        discount_type,
        discount_value,
        minimum_order_amount,
        maximum_discount_amount,
        valid_from,
        valid_until,
        usage_limit,
        usage_count,
        usage_limit_per_user,
        is_active,
        applicable_categories,
        applicable_services,
        created_at,
        updated_at
      FROM coupons
      WHERE id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Coupon not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching coupon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch coupon'
    });
  }
};

// Validate coupon for order
export const validateCoupon = async (req: Request, res: Response) => {
  try {
    
    const { code, orderAmount, categoryIds, serviceIds, userId, isFirstTime } = req.body;
    
    if (!code || orderAmount === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Coupon code and order amount are required'
      });
    }

    // Get coupon details with proper field mapping
    const couponResult = await pool.query(`
      SELECT 
        id,
        code,
        title,
        description,
        discount_type,
        discount_value,
        minimum_order_amount,
        maximum_discount_amount,
        valid_from,
        valid_until,
        usage_limit,
        usage_count,
        usage_limit_per_user,
        is_active,
        applicable_categories,
        applicable_services,
        created_at,
        updated_at
      FROM coupons 
      WHERE code = $1 AND is_active = true 
      AND valid_from <= NOW() AND valid_until >= NOW()
    `, [code]);

    if (couponResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Invalid or expired coupon code'
      });
    }

    const coupon = couponResult.rows[0];

    // Check minimum order amount
    if (orderAmount < coupon.minimum_order_amount) {
      return res.status(400).json({
        success: false,
        error: `Minimum order amount of ₹${coupon.minimum_order_amount} required`
      });
    }

    // Check first-time user restriction
    if (coupon.first_time_users_only && !isFirstTime) {
      return res.status(400).json({
        success: false,
        error: 'This coupon is only valid for first-time users'
      });
    }

    // Check usage limits
    if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
      return res.status(400).json({
        success: false,
        error: 'Coupon usage limit exceeded'
      });
    }

    // Check per-user usage limit (if userId provided)
    if (userId && coupon.usage_limit_per_user) {
      const userUsage = await pool.query(
        'SELECT COUNT(*) FROM coupon_usages WHERE coupon_id = $1 AND user_id = $2',
        [coupon.id, userId]
      );
      if (parseInt(userUsage.rows[0].count) >= coupon.usage_limit_per_user) {
        return res.status(400).json({
          success: false,
          error: 'You have already used this coupon the maximum number of times'
        });
      }
    }

    // Check category/service applicability
    if (coupon.applicable_categories && coupon.applicable_categories.length > 0) {
      const hasValidCategory = categoryIds?.some((catId: string) => 
        coupon.applicable_categories.includes(catId)
      );
      if (!hasValidCategory) {
        return res.status(400).json({
          success: false,
          error: 'Coupon not applicable to items in your cart'
        });
      }
    }

    if (coupon.applicable_services && coupon.applicable_services.length > 0) {
      const hasValidService = serviceIds?.some((serviceId: string) => 
        coupon.applicable_services.includes(serviceId)
      );
      if (!hasValidService) {
        return res.status(400).json({
          success: false,
          error: 'Coupon not applicable to items in your cart'
        });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (orderAmount * coupon.discount_value) / 100;
      if (coupon.maximum_discount_amount) {
        discountAmount = Math.min(discountAmount, coupon.maximum_discount_amount);
      }
    } else if (coupon.discount_type === 'fixed_amount') {
      discountAmount = Math.min(coupon.discount_value, orderAmount);
    } else if (coupon.discount_type === 'free_service') {
      discountAmount = Math.min(coupon.discount_value, orderAmount);
    }

    res.json({
      success: true,
      data: {
        coupon,
        discountAmount: Math.round(discountAmount),
        finalAmount: Math.round(orderAmount - discountAmount),
        message: `Coupon applied! You save ₹${Math.round(discountAmount)}`
      }
    });
    
  } catch (error) {
    console.error('Error validating coupon:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to validate coupon'
    });
  }
};