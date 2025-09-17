import { Request, Response } from 'express';
import pool from '../config/database';

// Get all categories
export const getCategories = async (req: Request, res: Response) => {
  try {
    
    const result = await pool.query(`
      SELECT 
        id,
        name,
        description,
        icon,
        image_paths,
        is_active,
        sort_order,
        created_at,
        updated_at
      FROM service_categories 
      ORDER BY sort_order ASC, name ASC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories'
    });
  }
};

// Create new category
export const createCategory = async (req: Request, res: Response) => {
  try {
    
    const { name, description, icon, is_active = true, sort_order = 0 } = req.body;
    
    if (!name || !description) {
      return res.status(400).json({
        success: false,
        error: 'Name and description are required'
      });
    }
    
    const result = await pool.query(`
      INSERT INTO service_categories (name, description, icon, is_active, sort_order, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING *
    `, [name, description, icon, is_active, sort_order]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create category'
    });
  }
};

// Update category
export const updateCategory = async (req: Request, res: Response) => {
  try {
    
    const { id } = req.params;
    const { name, description, icon, is_active, sort_order } = req.body;
    
    const result = await pool.query(`
      UPDATE service_categories 
      SET name = $1, description = $2, icon = $3, is_active = $4, sort_order = $5, updated_at = NOW()
      WHERE id = $6::uuid
      RETURNING *
    `, [name, description, icon, is_active, sort_order, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update category'
    });
  }
};

// Delete category
export const deleteCategory = async (req: Request, res: Response) => {
  try {
    
    const { id } = req.params;
    
    // Check if category has subcategories
    const subcategoriesResult = await pool.query(
      'SELECT COUNT(*) FROM service_subcategories WHERE category_id = $1::uuid',
      [id]
    );
    
    if (parseInt(subcategoriesResult.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete category with existing subcategories'
      });
    }
    
    const result = await pool.query(
      'DELETE FROM service_categories WHERE id = $1::uuid RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete category'
    });
  }
};

// Get category by ID
export const getCategoryById = async (req: Request, res: Response) => {
  try {
    
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM service_categories WHERE id = $1::uuid',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Category not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch category'
    });
  }
};