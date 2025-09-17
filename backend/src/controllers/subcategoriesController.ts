import { Request, Response } from 'express';
import pool from '../config/database';

// Get all subcategories with category info
export const getSubcategories = async (req: Request, res: Response) => {
  try {
    
    const result = await pool.query(`
      SELECT 
        ss.id,
        ss.name,
        ss.description,
        ss.icon,
        ss.is_active,
        ss.sort_order,
        ss.category_id,
        ss.created_at,
        ss.updated_at,
        sc.name as category_name,
        sc.icon as category_icon,
        sc.image_paths as category_image_path
      FROM service_subcategories ss
      LEFT JOIN service_categories sc ON ss.category_id = sc.id
      ORDER BY sc.sort_order ASC, ss.sort_order ASC, ss.name ASC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching subcategories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subcategories'
    });
  }
};

// Get subcategories by category
export const getSubcategoriesByCategory = async (req: Request, res: Response) => {
  try {
    
    const { categoryId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        ss.*,
        sc.name as category_name,
        sc.icon as category_icon
      FROM service_subcategories ss
      LEFT JOIN service_categories sc ON ss.category_id = sc.id
      WHERE ss.category_id = $1::uuid AND ss.is_active = true
      ORDER BY ss.sort_order ASC, ss.name ASC
    `, [categoryId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching subcategories by category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subcategories by category'
    });
  }
};

// Create new subcategory
export const createSubcategory = async (req: Request, res: Response) => {
  try {
    
    const { 
      name, 
      description, 
      icon,
      category_id,
      sort_order = 0,
      is_active = true
    } = req.body;
    
    if (!name || !description || !category_id) {
      return res.status(400).json({
        success: false,
        error: 'Name, description, and category_id are required'
      });
    }
    
    const result = await pool.query(`
      INSERT INTO service_subcategories (
        name, description, icon, category_id, sort_order, is_active, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4::uuid, $5, $6, NOW(), NOW())
      RETURNING *
    `, [name, description, icon, category_id, sort_order, is_active]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating subcategory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create subcategory'
    });
  }
};

// Update subcategory
export const updateSubcategory = async (req: Request, res: Response) => {
  try {
    
    const { id } = req.params;
    const { 
      name, 
      description, 
      icon,
      category_id,
      sort_order,
      is_active
    } = req.body;
    
    const result = await pool.query(`
      UPDATE service_subcategories 
      SET 
        name = $1, 
        description = $2, 
        icon = $3,
        category_id = $4,
        sort_order = $5,
        is_active = $6,
        updated_at = NOW()
      WHERE id = $7::uuid
      RETURNING *
    `, [name, description, icon, category_id, sort_order, is_active, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Subcategory not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating subcategory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update subcategory'
    });
  }
};

// Delete subcategory
export const deleteSubcategory = async (req: Request, res: Response) => {
  try {
    
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM service_subcategories WHERE id = $1::uuid RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Subcategory not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Subcategory deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete subcategory'
    });
  }
};

// Get subcategory by ID
export const getSubcategoryById = async (req: Request, res: Response) => {
  try {
    
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        ss.*,
        sc.name as category_name,
        sc.icon as category_icon
      FROM service_subcategories ss
      LEFT JOIN service_categories sc ON ss.category_id = sc.id
      WHERE ss.id = $1::uuid
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Subcategory not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching subcategory:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch subcategory'
    });
  }
};