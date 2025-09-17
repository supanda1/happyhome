import { Request, Response } from 'express';
import pool from '../config/database';

// Get all services with category and subcategory info
export const getServices = async (req: Request, res: Response) => {
  try {
    
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.description,
        s.short_description,
        s.base_price,
        s.discounted_price,
        s.duration,
        s.is_active,
        s.is_featured,
        s.rating,
        s.review_count,
        s.booking_count,
        s.category_id,
        s.subcategory_id,
        s.inclusions,
        s.exclusions,
        s.requirements,
        s.tags,
        s.gst_percentage,
        s.service_charge,
        s.image_paths,
        s.created_at,
        s.updated_at,
        sc.name as category_name,
        sc.icon as category_icon,
        ss.name as subcategory_name,
        ss.icon as subcategory_icon
      FROM services s
      LEFT JOIN service_categories sc ON (
        CASE 
          WHEN s.category_id = 'cat-1' THEN sc.name = 'Plumbing'
          WHEN s.category_id = 'cat-2' THEN sc.name = 'Electrical'  
          WHEN s.category_id = 'cat-3' THEN sc.name = 'Cleaning'
          WHEN s.category_id = 'cat-4' THEN sc.name = 'Call A Service'
          WHEN s.category_id = 'cat-5' THEN sc.name = 'Finance & Insurance'
          WHEN s.category_id = 'cat-6' THEN sc.name = 'Personal Care'
          WHEN s.category_id = 'cat-7' THEN sc.name = 'Civil Work'
          ELSE s.category_id::text = sc.id::text
        END
      )
      LEFT JOIN service_subcategories ss ON s.subcategory_id::text = ss.id::text
      ORDER BY sc.sort_order ASC, ss.sort_order ASC, s.name ASC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching services:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch services'
    });
  }
};

// Get services by category
export const getServicesByCategory = async (req: Request, res: Response) => {
  try {
    
    const { categoryId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.description,
        s.short_description,
        s.base_price,
        s.discounted_price,
        s.duration,
        s.is_active,
        s.is_featured,
        s.rating,
        s.review_count,
        s.booking_count,
        s.category_id,
        s.subcategory_id,
        s.inclusions,
        s.exclusions,
        s.requirements,
        s.tags,
        s.gst_percentage,
        s.service_charge,
        s.image_paths,
        s.created_at,
        s.updated_at,
        sc.name as category_name,
        sc.icon as category_icon,
        ss.name as subcategory_name,
        ss.icon as subcategory_icon
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      LEFT JOIN service_subcategories ss ON s.subcategory_id = ss.id
      WHERE s.category_id = $1::uuid AND s.is_active = true
      ORDER BY s.name ASC
    `, [categoryId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching services by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch services by category'
    });
  }
};

// Create new service
export const createService = async (req: Request, res: Response) => {
  try {
    
    const { 
      name, 
      description, 
      short_description,
      base_price,
      discounted_price,
      duration,
      category_id,
      subcategory_id,
      inclusions = [],
      exclusions = [],
      requirements = [],
      tags = [],
      availability_settings = {},
      is_active = true,
      is_featured = false 
    } = req.body;
    
    if (!name || !description || !base_price || !category_id) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, base_price, and category_id are required'
      });
    }
    
    const result = await pool.query(`
      INSERT INTO services (
        name, description, short_description, base_price, discounted_price, 
        duration, category_id, subcategory_id, inclusions, exclusions, 
        requirements, tags, availability_settings, is_active, is_featured, 
        rating, review_count, booking_count, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 0.0, 0, 0, NOW(), NOW())
      RETURNING *
    `, [
      name, description, short_description, base_price, discounted_price,
      duration, category_id, subcategory_id, inclusions, exclusions,
      requirements, tags, availability_settings, is_active, is_featured
    ]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create service'
    });
  }
};

// Update service
export const updateService = async (req: Request, res: Response) => {
  try {
    
    const { id } = req.params;
    const { 
      name, 
      description, 
      short_description,
      base_price,
      discounted_price,
      duration,
      category_id,
      subcategory_id,
      inclusions,
      exclusions,
      requirements,
      tags,
      availability_settings,
      is_active,
      is_featured 
    } = req.body;
    
    const result = await pool.query(`
      UPDATE services 
      SET 
        name = $1, 
        description = $2, 
        short_description = $3,
        base_price = $4,
        discounted_price = $5,
        duration = $6,
        category_id = $7,
        subcategory_id = $8,
        inclusions = $9,
        exclusions = $10,
        requirements = $11,
        tags = $12,
        availability_settings = $13,
        is_active = $14,
        is_featured = $15,
        updated_at = NOW()
      WHERE id = $16::uuid
      RETURNING *
    `, [
      name, description, short_description, base_price, discounted_price,
      duration, category_id, subcategory_id, inclusions, exclusions,
      requirements, tags, availability_settings, is_active, is_featured, id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update service'
    });
  }
};

// Delete service
export const deleteService = async (req: Request, res: Response) => {
  try {
    
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM services WHERE id = $1::uuid RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete service'
    });
  }
};

// Get service by ID
export const getServiceById = async (req: Request, res: Response) => {
  try {
    
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        s.id,
        s.name,
        s.description,
        s.short_description,
        s.base_price,
        s.discounted_price,
        s.duration,
        s.is_active,
        s.is_featured,
        s.rating,
        s.review_count,
        s.booking_count,
        s.category_id,
        s.subcategory_id,
        s.inclusions,
        s.exclusions,
        s.requirements,
        s.tags,
        s.gst_percentage,
        s.service_charge,
        s.image_paths,
        s.created_at,
        s.updated_at,
        sc.name as category_name,
        sc.icon as category_icon,
        ss.name as subcategory_name,
        ss.icon as subcategory_icon
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      LEFT JOIN service_subcategories ss ON s.subcategory_id = ss.id
      WHERE s.id = $1::uuid
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Service not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service'
    });
  }
};