import { Request, Response } from 'express';
import pool from '../config/database';

// Get review settings (only one record should exist)
export const getReviewSettings = async (req: Request, res: Response) => {
  try {
    
    const result = await pool.query(`
      SELECT 
        id,
        auto_approve_reviews,
        require_booking_for_review,
        minimum_rating_threshold,
        maximum_reviews_per_user_per_service,
        review_moderation_enabled,
        display_average_rating,
        display_review_count,
        allow_anonymous_reviews,
        updated_at,
        updated_by
      FROM review_settings 
      ORDER BY updated_at DESC
      LIMIT 1
    `);
    
    // If no settings exist, return default values
    if (result.rows.length === 0) {
      const defaultSettings = {
        auto_approve_reviews: false,
        require_booking_for_review: true,
        minimum_rating_threshold: 1.0,
        maximum_reviews_per_user_per_service: 1,
        review_moderation_enabled: true,
        display_average_rating: true,
        display_review_count: true,
        allow_anonymous_reviews: false
      };
      
      return res.json({
        success: true,
        data: defaultSettings
      });
    }
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching review settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch review settings'
    });
  }
};

// Update review settings (upsert operation)
export const updateReviewSettings = async (req: Request, res: Response) => {
  try {
    
    const { 
      auto_approve_reviews,
      require_booking_for_review,
      minimum_rating_threshold,
      maximum_reviews_per_user_per_service,
      review_moderation_enabled,
      display_average_rating,
      display_review_count,
      allow_anonymous_reviews,
      updated_by = 'admin'
    } = req.body;
    
    // Validate minimum_rating_threshold
    if (minimum_rating_threshold !== undefined && 
        (minimum_rating_threshold < 1.0 || minimum_rating_threshold > 5.0)) {
      return res.status(400).json({
        success: false,
        error: 'Minimum rating threshold must be between 1.0 and 5.0'
      });
    }
    
    // Validate maximum_reviews_per_user_per_service
    if (maximum_reviews_per_user_per_service !== undefined && 
        maximum_reviews_per_user_per_service < 1) {
      return res.status(400).json({
        success: false,
        error: 'Maximum reviews per user per service must be at least 1'
      });
    }
    
    // Check if settings already exist
    const existingResult = await pool.query('SELECT id FROM review_settings LIMIT 1');
    
    let result;
    if (existingResult.rows.length > 0) {
      // Update existing settings
      result = await pool.query(`
        UPDATE review_settings 
        SET 
          auto_approve_reviews = $1,
          require_booking_for_review = $2,
          minimum_rating_threshold = $3,
          maximum_reviews_per_user_per_service = $4,
          review_moderation_enabled = $5,
          display_average_rating = $6,
          display_review_count = $7,
          allow_anonymous_reviews = $8,
          updated_at = NOW(),
          updated_by = $9
        WHERE id = $10
        RETURNING *
      `, [
        auto_approve_reviews, require_booking_for_review, 
        minimum_rating_threshold, maximum_reviews_per_user_per_service,
        review_moderation_enabled, display_average_rating,
        display_review_count, allow_anonymous_reviews, 
        updated_by, existingResult.rows[0].id
      ]);
    } else {
      // Insert new settings
      result = await pool.query(`
        INSERT INTO review_settings (
          auto_approve_reviews, require_booking_for_review,
          minimum_rating_threshold, maximum_reviews_per_user_per_service,
          review_moderation_enabled, display_average_rating,
          display_review_count, allow_anonymous_reviews,
          updated_at, updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
        RETURNING *
      `, [
        auto_approve_reviews, require_booking_for_review, 
        minimum_rating_threshold, maximum_reviews_per_user_per_service,
        review_moderation_enabled, display_average_rating,
        display_review_count, allow_anonymous_reviews, updated_by
      ]);
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Review settings updated successfully'
    });
  } catch (error) {
    console.error('Error updating review settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update review settings'
    });
  }
};

// Reset review settings to defaults
export const resetReviewSettings = async (req: Request, res: Response) => {
  try {
    
    const { updated_by = 'admin' } = req.body;
    
    const defaultSettings = {
      auto_approve_reviews: false,
      require_booking_for_review: true,
      minimum_rating_threshold: 1.0,
      maximum_reviews_per_user_per_service: 1,
      review_moderation_enabled: true,
      display_average_rating: true,
      display_review_count: true,
      allow_anonymous_reviews: false
    };
    
    // Check if settings exist
    const existingResult = await pool.query('SELECT id FROM review_settings LIMIT 1');
    
    let result;
    if (existingResult.rows.length > 0) {
      // Update existing settings with defaults
      result = await pool.query(`
        UPDATE review_settings 
        SET 
          auto_approve_reviews = $1,
          require_booking_for_review = $2,
          minimum_rating_threshold = $3,
          maximum_reviews_per_user_per_service = $4,
          review_moderation_enabled = $5,
          display_average_rating = $6,
          display_review_count = $7,
          allow_anonymous_reviews = $8,
          updated_at = NOW(),
          updated_by = $9
        WHERE id = $10
        RETURNING *
      `, [
        defaultSettings.auto_approve_reviews, 
        defaultSettings.require_booking_for_review,
        defaultSettings.minimum_rating_threshold, 
        defaultSettings.maximum_reviews_per_user_per_service,
        defaultSettings.review_moderation_enabled, 
        defaultSettings.display_average_rating,
        defaultSettings.display_review_count, 
        defaultSettings.allow_anonymous_reviews,
        updated_by, existingResult.rows[0].id
      ]);
    } else {
      // Insert default settings
      result = await pool.query(`
        INSERT INTO review_settings (
          auto_approve_reviews, require_booking_for_review,
          minimum_rating_threshold, maximum_reviews_per_user_per_service,
          review_moderation_enabled, display_average_rating,
          display_review_count, allow_anonymous_reviews,
          updated_at, updated_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), $9)
        RETURNING *
      `, [
        defaultSettings.auto_approve_reviews, 
        defaultSettings.require_booking_for_review,
        defaultSettings.minimum_rating_threshold, 
        defaultSettings.maximum_reviews_per_user_per_service,
        defaultSettings.review_moderation_enabled, 
        defaultSettings.display_average_rating,
        defaultSettings.display_review_count, 
        defaultSettings.allow_anonymous_reviews, updated_by
      ]);
    }
    
    res.json({
      success: true,
      data: result.rows[0],
      message: 'Review settings reset to defaults successfully'
    });
  } catch (error) {
    console.error('Error resetting review settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reset review settings'
    });
  }
};

// Get review statistics for dashboard
export const getReviewStatistics = async (req: Request, res: Response) => {
  try {
    
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(*) FILTER (WHERE is_approved = true) as approved_reviews,
        COUNT(*) FILTER (WHERE is_approved = false) as pending_reviews,
        ROUND(AVG(rating), 2) as average_rating,
        COUNT(*) FILTER (WHERE rating >= 4) as positive_reviews,
        COUNT(*) FILTER (WHERE rating <= 2) as negative_reviews
      FROM reviews
    `);
    
    const recentReviewsResult = await pool.query(`
      SELECT 
        r.id,
        r.rating,
        r.comment,
        r.created_at,
        r.is_approved,
        s.name as service_name,
        u.first_name,
        u.last_name
      FROM reviews r
      LEFT JOIN services s ON r.service_id = s.id
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 10
    `);
    
    const stats = result.rows[0];
    const statsData = {
      total_reviews: parseInt(stats.total_reviews) || 0,
      approved_reviews: parseInt(stats.approved_reviews) || 0,
      pending_reviews: parseInt(stats.pending_reviews) || 0,
      average_rating: parseFloat(stats.average_rating) || 0,
      positive_reviews: parseInt(stats.positive_reviews) || 0,
      negative_reviews: parseInt(stats.negative_reviews) || 0,
      recent_reviews: recentReviewsResult.rows
    };
    
    res.json({
      success: true,
      data: statsData
    });
  } catch (error) {
    console.error('Error fetching review statistics:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch review statistics'
    });
  }
};