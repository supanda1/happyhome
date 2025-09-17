import { Request, Response } from 'express';
import pool from '../config/database';

// Get all banners
export const getBanners = async (req: Request, res: Response) => {
  try {
    
    const result = await pool.query(`
      SELECT 
        id,
        title,
        subtitle,
        description,
        button_text,
        button_link,
        image_url,
        background_color,
        text_color,
        position_type,
        is_active,
        sort_order,
        created_at,
        updated_at
      FROM banners 
      ORDER BY sort_order ASC, created_at DESC
    `);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching banners:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch banners'
    });
  }
};

// Get active banners by position type
export const getActiveBannersByPosition = async (req: Request, res: Response) => {
  try {
    
    const { position } = req.params;
    
    const result = await pool.query(`
      SELECT 
        id,
        title,
        subtitle,
        description,
        button_text,
        button_link,
        image_url,
        background_color,
        text_color,
        position_type,
        sort_order
      FROM banners 
      WHERE is_active = true AND position_type = $1
      ORDER BY sort_order ASC
    `, [position]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching active banners by position:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch active banners by position'
    });
  }
};

// Create new banner
export const createBanner = async (req: Request, res: Response) => {
  try {
    
    const { 
      title,
      subtitle,
      description,
      button_text,
      button_link,
      image_url,
      background_color = '#ffffff',
      text_color = '#000000',
      position_type = 'hero',
      is_active = true,
      sort_order = 0
    } = req.body;
    
    if (!title) {
      return res.status(400).json({
        success: false,
        error: 'Title is required'
      });
    }
    
    const result = await pool.query(`
      INSERT INTO banners (
        title, subtitle, description, button_text, button_link,
        image_url, background_color, text_color, position_type,
        is_active, sort_order, created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
      RETURNING *
    `, [
      title, subtitle, description, button_text, button_link,
      image_url, background_color, text_color, position_type,
      is_active, sort_order
    ]);
    
    res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error creating banner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create banner'
    });
  }
};

// Update banner
export const updateBanner = async (req: Request, res: Response) => {
  try {
    
    const { id } = req.params;
    const { 
      title,
      subtitle,
      description,
      button_text,
      button_link,
      image_url,
      background_color,
      text_color,
      position_type,
      is_active,
      sort_order
    } = req.body;
    
    const result = await pool.query(`
      UPDATE banners 
      SET 
        title = $1,
        subtitle = $2,
        description = $3,
        button_text = $4,
        button_link = $5,
        image_url = $6,
        background_color = $7,
        text_color = $8,
        position_type = $9,
        is_active = $10,
        sort_order = $11,
        updated_at = NOW()
      WHERE id = $12
      RETURNING *
    `, [
      title, subtitle, description, button_text, button_link,
      image_url, background_color, text_color, position_type,
      is_active, sort_order, id
    ]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Banner not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating banner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update banner'
    });
  }
};

// Delete banner
export const deleteBanner = async (req: Request, res: Response) => {
  try {
    
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM banners WHERE id = $1 RETURNING *',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Banner not found'
      });
    }
    
    res.json({
      success: true,
      message: 'Banner deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting banner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete banner'
    });
  }
};

// Get banner by ID
export const getBannerById = async (req: Request, res: Response) => {
  try {
    
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM banners WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Banner not found'
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching banner:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch banner'
    });
  }
};