import { Request, Response } from 'express';
import pool from '../config/database';

// Get all services with category and subcategory info
export const getServices = async (req: Request, res: Response) => {
  try {
    // Check for query parameters
    const { subcategory, category, featured, limit, include_inactive } = req.query;
    
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;
    
    // Only filter by active if include_inactive is not set
    if (include_inactive !== 'true') {
      conditions.push('s.is_active = true');
    }
    
    // Add WHERE conditions based on query parameters
    if (subcategory) {
      conditions.push(`s.subcategory_id = $${paramIndex}::uuid`);
      params.push(subcategory);
      paramIndex++;
    }
    
    if (category) {
      conditions.push(`s.category_id = $${paramIndex}::uuid`);
      params.push(category);
      paramIndex++;
    }
    
    if (featured === 'true') {
      conditions.push(`s.is_featured = true`);
    }
    
    let query = `
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
        sc.description as category_description,
        sc.image_path as category_image,
        ss.name as subcategory_name,
        ss.icon as subcategory_icon,
        ss.description as subcategory_description
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      LEFT JOIN service_subcategories ss ON s.subcategory_id = ss.id
      ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}
      ORDER BY sc.sort_order ASC, ss.sort_order ASC, s.name ASC
    `;
    
    if (limit) {
      query += ` LIMIT ${parseInt(limit as string)}`;
    }
    
    const result = await pool.query(query, params);
    
    // Parse JSONB fields that come as strings from PostgreSQL
    const parsedRows = result.rows.map(row => ({
      ...row,
      inclusions: typeof row.inclusions === 'string' ? JSON.parse(row.inclusions || '[]') : (row.inclusions || []),
      exclusions: typeof row.exclusions === 'string' ? JSON.parse(row.exclusions || '[]') : (row.exclusions || []),
      requirements: typeof row.requirements === 'string' ? JSON.parse(row.requirements || '[]') : (row.requirements || []),
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : (row.tags || []),
      image_paths: typeof row.image_paths === 'string' ? JSON.parse(row.image_paths || '[]') : (row.image_paths || [])
    }));
    
    res.json({
      success: true,
      data: parsedRows
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
        sc.description as category_description,
        sc.image_path as category_image,
        ss.name as subcategory_name,
        ss.icon as subcategory_icon,
        ss.description as subcategory_description,
        ss.image_paths as subcategory_images
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      LEFT JOIN service_subcategories ss ON s.subcategory_id = ss.id
      WHERE (
        CASE 
          WHEN $1 = 'cat-1' THEN sc.name = 'Plumbing'
          WHEN $1 = 'cat-2' THEN sc.name = 'Electrical'  
          WHEN $1 = 'cat-3' THEN sc.name = 'Cleaning'
          WHEN $1 = 'cat-4' THEN sc.name = 'Call A Service'
          WHEN $1 = 'cat-5' THEN sc.name = 'Finance & Insurance'
          WHEN $1 = 'cat-6' THEN sc.name = 'Personal Care'
          WHEN $1 = 'cat-7' THEN sc.name = 'Civil Work'
          ELSE s.category_id = $1::uuid
        END
      ) AND s.is_active = true
      ORDER BY s.name ASC
    `, [categoryId]);
    
    // Parse JSONB fields that come as strings from PostgreSQL
    const parsedRows = result.rows.map(row => ({
      ...row,
      inclusions: typeof row.inclusions === 'string' ? JSON.parse(row.inclusions || '[]') : (row.inclusions || []),
      exclusions: typeof row.exclusions === 'string' ? JSON.parse(row.exclusions || '[]') : (row.exclusions || []),
      requirements: typeof row.requirements === 'string' ? JSON.parse(row.requirements || '[]') : (row.requirements || []),
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : (row.tags || []),
      image_paths: typeof row.image_paths === 'string' ? JSON.parse(row.image_paths || '[]') : (row.image_paths || []),
      subcategory_images: typeof row.subcategory_images === 'string' ? JSON.parse(row.subcategory_images || '[]') : (row.subcategory_images || [])
    }));
    
    res.json({
      success: true,
      data: parsedRows
    });
  } catch (error) {
    console.error('Error fetching services by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch services by category'
    });
  }
};

// Get services by subcategory
export const getServicesBySubcategory = async (req: Request, res: Response) => {
  try {
    
    const { subcategoryId } = req.params;
    
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
        sc.description as category_description,
        sc.image_path as category_image,
        ss.name as subcategory_name,
        ss.icon as subcategory_icon,
        ss.description as subcategory_description
      FROM services s
      LEFT JOIN service_categories sc ON s.category_id = sc.id
      LEFT JOIN service_subcategories ss ON s.subcategory_id = ss.id
      WHERE s.subcategory_id = $1::uuid AND s.is_active = true
      ORDER BY s.name ASC
    `, [subcategoryId]);
    
    // Parse JSONB fields that come as strings from PostgreSQL
    const parsedRows = result.rows.map(row => ({
      ...row,
      inclusions: typeof row.inclusions === 'string' ? JSON.parse(row.inclusions || '[]') : (row.inclusions || []),
      exclusions: typeof row.exclusions === 'string' ? JSON.parse(row.exclusions || '[]') : (row.exclusions || []),
      requirements: typeof row.requirements === 'string' ? JSON.parse(row.requirements || '[]') : (row.requirements || []),
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : (row.tags || []),
      image_paths: typeof row.image_paths === 'string' ? JSON.parse(row.image_paths || '[]') : (row.image_paths || [])
    }));
    
    res.json({
      success: true,
      data: parsedRows
    });
  } catch (error) {
    console.error('Error fetching services by subcategory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch services by subcategory'
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
      image_paths = [],
      is_active = true,
      is_featured = false,
      is_combo_eligible = true,
      gst_percentage = 18,
      service_charge = 79
    } = req.body;
    
    // Handle legacy 'images' field name from frontend
    const actualImagePaths = req.body.images || image_paths;
    
    // Ensure JSONB fields are properly formatted
    const safeInclusions = Array.isArray(inclusions) ? inclusions : (inclusions ? [inclusions] : []);
    const safeExclusions = Array.isArray(exclusions) ? exclusions : (exclusions ? [exclusions] : []);
    const safeRequirements = Array.isArray(requirements) ? requirements : (requirements ? [requirements] : []);
    const safeTags = Array.isArray(tags) ? tags : (tags ? [tags] : []);
    const safeImagePaths = Array.isArray(actualImagePaths) ? actualImagePaths : (actualImagePaths ? [actualImagePaths] : []);
    
    if (!name || !description || !short_description || !base_price || !category_id || !subcategory_id) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, short_description, base_price, category_id, and subcategory_id are required'
      });
    }
    
    // Additional validation
    if (description.length < 10 || description.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: description: description must be between 10 and 255 characters'
      });
    }
    
    if (short_description.length < 10 || short_description.length > 255) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: short_description: short_description must be between 10 and 255 characters'
      });
    }
    
    const result = await pool.query(`
      INSERT INTO services (
        name, description, short_description, base_price, discounted_price, 
        duration, category_id, subcategory_id, inclusions, exclusions, 
        requirements, tags, image_paths, is_active, is_featured, 
        is_combo_eligible, gst_percentage, service_charge,
        rating, review_count, booking_count, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7::uuid, $8::uuid, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 0.0, 0, 0, NOW(), NOW())
      RETURNING *
    `, [
      name, description, short_description, base_price, discounted_price,
      duration, category_id, subcategory_id, JSON.stringify(safeInclusions), JSON.stringify(safeExclusions),
      JSON.stringify(safeRequirements), JSON.stringify(safeTags), JSON.stringify(safeImagePaths), is_active, is_featured, 
      is_combo_eligible, gst_percentage, service_charge
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
      image_paths,
      is_active,
      is_featured,
      is_combo_eligible,
      gst_percentage,
      service_charge,
      notes
    } = req.body;
    
    // Handle legacy 'images' field name from frontend
    const actualImagePaths = req.body.images || image_paths;
    
    // Build dynamic update query - only update provided fields
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    
    if (short_description !== undefined) {
      updateFields.push(`short_description = $${paramIndex++}`);
      values.push(short_description);
    }
    
    if (base_price !== undefined) {
      updateFields.push(`base_price = $${paramIndex++}`);
      values.push(base_price);
    }
    
    if (discounted_price !== undefined) {
      updateFields.push(`discounted_price = $${paramIndex++}`);
      values.push(discounted_price);
    }
    
    if (duration !== undefined) {
      updateFields.push(`duration = $${paramIndex++}`);
      values.push(duration);
    }
    
    if (category_id !== undefined) {
      updateFields.push(`category_id = $${paramIndex++}::uuid`);
      values.push(category_id);
    }
    
    if (subcategory_id !== undefined) {
      updateFields.push(`subcategory_id = $${paramIndex++}::uuid`);
      values.push(subcategory_id);
    }
    
    if (inclusions !== undefined) {
      updateFields.push(`inclusions = $${paramIndex++}`);
      const safeInclusions = Array.isArray(inclusions) ? inclusions : (inclusions ? [inclusions] : []);
      values.push(JSON.stringify(safeInclusions));
    }
    
    if (exclusions !== undefined) {
      updateFields.push(`exclusions = $${paramIndex++}`);
      const safeExclusions = Array.isArray(exclusions) ? exclusions : (exclusions ? [exclusions] : []);
      values.push(JSON.stringify(safeExclusions));
    }
    
    if (requirements !== undefined) {
      updateFields.push(`requirements = $${paramIndex++}`);
      const safeRequirements = Array.isArray(requirements) ? requirements : (requirements ? [requirements] : []);
      values.push(JSON.stringify(safeRequirements));
    }
    
    if (tags !== undefined) {
      updateFields.push(`tags = $${paramIndex++}`);
      const safeTags = Array.isArray(tags) ? tags : (tags ? [tags] : []);
      values.push(JSON.stringify(safeTags));
    }
    
    if (is_active !== undefined) {
      updateFields.push(`is_active = $${paramIndex++}`);
      values.push(is_active);
    }
    
    if (is_featured !== undefined) {
      updateFields.push(`is_featured = $${paramIndex++}`);
      values.push(is_featured);
    }
    
    if (is_combo_eligible !== undefined) {
      updateFields.push(`is_combo_eligible = $${paramIndex++}`);
      values.push(is_combo_eligible);
    }
    
    if (gst_percentage !== undefined) {
      updateFields.push(`gst_percentage = $${paramIndex++}`);
      values.push(gst_percentage);
    }
    
    if (service_charge !== undefined) {
      updateFields.push(`service_charge = $${paramIndex++}`);
      values.push(service_charge);
    }
    
    if (notes !== undefined) {
      updateFields.push(`notes = $${paramIndex++}`);
      values.push(notes);
    }
    
    if (actualImagePaths !== undefined) {
      updateFields.push(`image_paths = $${paramIndex++}`);
      const safeImagePaths = Array.isArray(actualImagePaths) ? actualImagePaths : (actualImagePaths ? [actualImagePaths] : []);
      values.push(JSON.stringify(safeImagePaths));
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }
    
    // Always update the updated_at timestamp
    updateFields.push('updated_at = NOW()');
    
    // Add the ID parameter
    values.push(id);
    
    const query = `
      UPDATE services 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}::uuid
      RETURNING *
    `;
    
    const result = await pool.query(query, values);
    
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
        sc.description as category_description,
        sc.image_path as category_image,
        ss.name as subcategory_name,
        ss.icon as subcategory_icon,
        ss.description as subcategory_description,
        ss.image_paths as subcategory_images
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
    
    // Parse JSONB fields that come as strings from PostgreSQL
    const row = result.rows[0];
    const parsedRow = {
      ...row,
      inclusions: typeof row.inclusions === 'string' ? JSON.parse(row.inclusions || '[]') : (row.inclusions || []),
      exclusions: typeof row.exclusions === 'string' ? JSON.parse(row.exclusions || '[]') : (row.exclusions || []),
      requirements: typeof row.requirements === 'string' ? JSON.parse(row.requirements || '[]') : (row.requirements || []),
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : (row.tags || []),
      image_paths: typeof row.image_paths === 'string' ? JSON.parse(row.image_paths || '[]') : (row.image_paths || []),
      subcategory_images: typeof row.subcategory_images === 'string' ? JSON.parse(row.subcategory_images || '[]') : (row.subcategory_images || [])
    };
    
    res.json({
      success: true,
      data: parsedRow
    });
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch service'
    });
  }
};