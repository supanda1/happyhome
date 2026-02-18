import { Request, Response } from 'express';
import pool from '../config/database';

// Get all offer plans
export const getOfferPlans = async (req: Request, res: Response) => {
  try {
    
    const result = await pool.query(`
      SELECT 
        id,
        title,
        description,
        duration_months,
        discount_percentage,
        combo_coupon_code,
        is_active,
        sort_order,
        benefits,
        terms_conditions,
        created_at,
        updated_at
      FROM offer_plans 
      ORDER BY sort_order ASC, duration_months ASC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching offer plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch offer plans'
    });
  }
};

// Get active offer plans only
export const getActiveOfferPlans = async (req: Request, res: Response) => {
  try {
    
    const result = await pool.query(`
      SELECT 
        id,
        title,
        description,
        duration_months,
        discount_percentage,
        combo_coupon_code,
        sort_order,
        benefits,
        terms_conditions
      FROM offer_plans 
      WHERE is_active = true
      ORDER BY sort_order ASC, duration_months ASC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching active offer plans:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active offer plans'
    });
  }
};

// Create new offer plan
export const createOfferPlan = async (req: Request, res: Response) => {
  try {
    
    const { 
      title,
      description,
      duration_months,
      discount_percentage,
      combo_coupon_code,
      is_active = true,
      sort_order = 0,
      benefits = [],
      terms_conditions = []
    } = req.body;
    
    if (!title || !description || !duration_months || !discount_percentage || !combo_coupon_code) {
      return res.status(400).json({
        success: false,
        error: 'Title, description, duration_months, discount_percentage, and combo_coupon_code are required'
      });
    }

    // Check if combo coupon code already exists
    const existingPlan = await pool.query(
      'SELECT id FROM offer_plans WHERE combo_coupon_code = $1', 
      [combo_coupon_code]
    );
    if (existingPlan.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Combo coupon code already exists'
      });
    }
    
    // Validate discount percentage
    if (discount_percentage <= 0 || discount_percentage > 100) {
      return res.status(400).json({
        success: false,
        error: 'Discount percentage must be between 1 and 100'
      });
    }
    
    // Validate duration months
    if (duration_months <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Duration must be at least 1 month'
      });
    }
    
    const result = await pool.query(`
      INSERT INTO offer_plans (
        title, description, duration_months, discount_percentage,
        combo_coupon_code, is_active, sort_order, benefits,
        terms_conditions, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `, [
      title, description, duration_months, discount_percentage,
      combo_coupon_code, is_active, sort_order, 
      JSON.stringify(benefits), JSON.stringify(terms_conditions)
    ]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating offer plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create offer plan'
    });
  }
};

// Update offer plan
export const updateOfferPlan = async (req: Request, res: Response) => {
  try {
    
    const { id } = req.params;
    const { 
      title,
      description,
      duration_months,
      discount_percentage,
      combo_coupon_code,
      is_active,
      sort_order,
      benefits,
      terms_conditions
    } = req.body;

    // Check if combo coupon code already exists for other plans
    if (combo_coupon_code) {
      const existingPlan = await pool.query(
        'SELECT id FROM offer_plans WHERE combo_coupon_code = $1 AND id != $2', 
        [combo_coupon_code, id]
      );
      if (existingPlan.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Combo coupon code already exists'
        });
      }
    }
    
    // Validate discount percentage if provided
    if (discount_percentage !== undefined && (discount_percentage <= 0 || discount_percentage > 100)) {
      return res.status(400).json({
        success: false,
        error: 'Discount percentage must be between 1 and 100'
      });
    }
    
    // Validate duration months if provided
    if (duration_months !== undefined && duration_months <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Duration must be at least 1 month'
      });
    }
    
    const result = await pool.query(`
      UPDATE offer_plans 
      SET 
        title = $1,
        description = $2,
        duration_months = $3,
        discount_percentage = $4,
        combo_coupon_code = $5,
        is_active = $6,
        sort_order = $7,
        benefits = $8,
        terms_conditions = $9,
        updated_at = NOW()
      WHERE id = $10
      RETURNING *
    `, [
      title, description, duration_months, discount_percentage,
      combo_coupon_code, is_active, sort_order,
      JSON.stringify(benefits || []), JSON.stringify(terms_conditions || []),
      id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Offer plan not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating offer plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update offer plan'
    });
  }
};

// Delete offer plan
export const deleteOfferPlan = async (req: Request, res: Response) => {
  try {
    
    const { id } = req.params;
    
    // Check if offer plan has associated services
    const servicesCheck = await pool.query(
      'SELECT COUNT(*) FROM offer_services WHERE plan_id = $1', 
      [id]
    );
    if (parseInt(servicesCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete offer plan with associated services. Remove services first.'
      });
    }
    
    const result = await pool.query(
      'DELETE FROM offer_plans WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Offer plan not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Offer plan deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting offer plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete offer plan'
    });
  }
};

// Get offer plan by ID with associated services
export const getOfferPlanById = async (req: Request, res: Response) => {
  try {
    
    const { id } = req.params;
    
    // Get the offer plan
    const planResult = await pool.query(
      'SELECT * FROM offer_plans WHERE id = $1',
      [id]
    );
    
    if (planResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Offer plan not found'
      });
    }
    
    // Get associated services
    const servicesResult = await pool.query(`
      SELECT 
        os.*,
        s.name as service_name,
        sc.name as category_name
      FROM offer_services os
      LEFT JOIN services s ON os.service_id = s.id
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      WHERE os.plan_id = $1 AND os.is_active = true
      ORDER BY s.name ASC
    `, [id]);
    
    const planData = {
      ...planResult.rows[0],
      services: servicesResult.rows
    };
    
    res.json({
      success: true,
      data: planData
    });
  } catch (error) {
    console.error('Error fetching offer plan:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch offer plan'
    });
  }
};

// Calculate offer totals for selected services
export const calculateOfferTotals = async (req: Request, res: Response) => {
  try {
    
    const { planId, serviceIds, quantities } = req.body;
    
    if (!planId || !serviceIds || !Array.isArray(serviceIds)) {
      return res.status(400).json({
        success: false,
        error: 'Plan ID and service IDs array are required'
      });
    }
    
    // Get the offer plan
    const planResult = await pool.query(
      'SELECT * FROM offer_plans WHERE id = $1 AND is_active = true',
      [planId]
    );
    
    if (planResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Offer plan not found or inactive'
      });
    }
    
    const plan = planResult.rows[0];
    
    // Get services with their prices
    const servicesResult = await pool.query(
      'SELECT id, name, base_price, discounted_price FROM services WHERE id = ANY($1) AND is_active = true',
      [serviceIds]
    );
    
    let originalAmount = 0;
    const serviceDetails = [];
    
    for (const service of servicesResult.rows) {
      const quantity = quantities?.[service.id] || 1;
      const servicePrice = service.discounted_price || service.base_price;
      const serviceTotalPrice = servicePrice * quantity;
      
      originalAmount += serviceTotalPrice;
      serviceDetails.push({
        service_id: service.id,
        service_name: service.name,
        unit_price: servicePrice,
        quantity: quantity,
        total_price: serviceTotalPrice
      });
    }
    
    // Calculate discount and final amounts
    const discountAmount = (originalAmount * plan.discount_percentage) / 100;
    const finalAmount = originalAmount - discountAmount;
    const monthlyAmount = finalAmount / plan.duration_months;
    
    res.json({
      success: true,
      data: {
        plan: {
          id: plan.id,
          title: plan.title,
          duration_months: plan.duration_months,
          discount_percentage: plan.discount_percentage
        },
        services: serviceDetails,
        calculation: {
          original_amount: Math.round(originalAmount),
          discount_amount: Math.round(discountAmount),
          final_amount: Math.round(finalAmount),
          monthly_amount: Math.round(monthlyAmount),
          savings: Math.round(discountAmount)
        }
      }
    });
  } catch (error) {
    console.error('Error calculating offer totals:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate offer totals'
    });
  }
};