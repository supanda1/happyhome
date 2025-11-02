/**
 * Reviews management routes - handles customer reviews and ratings
 * Provides CRUD operations and analytics for review system
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();

/**
 * Get all reviews with filtering and pagination
 * GET /api/reviews?page=1&limit=10&status=pending&rating=5&service_id=
 */
router.get('/', authMiddleware, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(['pending', 'approved', 'rejected']),
  query('rating').optional().isInt({ min: 1, max: 5 }),
  query('service_id').optional().isUUID(),
  query('user_id').optional().isUUID(),
  query('search').optional().isString().trim()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { 
      page = 1, 
      limit = 10, 
      status, 
      rating,
      service_id,
      user_id,
      search
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const db = req.app.get('db') as Pool;

    // Build dynamic WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (status) {
      if (status === 'approved') {
        conditions.push(`r.is_approved = true`);
      } else if (status === 'rejected') {
        conditions.push(`r.is_approved = false AND r.approved_by IS NOT NULL`);
      } else if (status === 'pending') {
        conditions.push(`r.approved_by IS NULL`);
      }
    }

    if (rating) {
      conditions.push(`r.rating = $${++paramCount}`);
      params.push(rating);
    }

    if (service_id) {
      conditions.push(`r.service_id = $${++paramCount}`);
      params.push(service_id);
    }

    if (user_id) {
      conditions.push(`r.user_id = $${++paramCount}`);
      params.push(user_id);
    }

    if (search) {
      conditions.push(`(
        r.comment ILIKE $${++paramCount} OR 
        u.name ILIKE $${++paramCount} OR
        s.name ILIKE $${++paramCount}
      )`);
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern);
      paramCount += 2;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN services s ON r.service_id = s.id
      ${whereClause}
    `;

    // Get reviews with pagination
    const reviewsQuery = `
      SELECT 
        r.id,
        r.user_id,
        u.name as customer_name,
        u.email as customer_email,
        r.service_id,
        s.name as service_name,
        sc.name as service_category,
        r.order_id,
        r.rating,
        r.comment,
        r.is_approved,
        r.approved_by,
        admin.name as approved_by_name,
        r.approved_at,
        r.created_at,
        r.updated_at,
        (
          SELECT json_agg(json_build_object(
            'id', rp.id,
            'photo_url', rp.photo_url,
            'caption', rp.caption
          ))
          FROM review_photos rp 
          WHERE rp.review_id = r.id
        ) as photos,
        (
          SELECT COUNT(*)::int
          FROM review_helpfulness rh 
          WHERE rh.review_id = r.id AND rh.is_helpful = true
        ) as helpful_count,
        (
          SELECT COUNT(*)::int
          FROM review_helpfulness rh 
          WHERE rh.review_id = r.id AND rh.is_helpful = false
        ) as not_helpful_count
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN services s ON r.service_id = s.id
      JOIN service_categories sc ON s.category_id = sc.id
      LEFT JOIN users admin ON r.approved_by = admin.id
      ${whereClause}
      ORDER BY r.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

    params.push(Number(limit), offset);

    const [countResult, reviewsResult] = await Promise.all([
      db.query(countQuery, params.slice(0, paramCount - 2)),
      db.query(reviewsQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        reviews: reviewsResult.rows,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages,
          hasNext: Number(page) < totalPages,
          hasPrev: Number(page) > 1
        }
      }
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch reviews' 
    });
  }
});

/**
 * Get review by ID
 * GET /api/reviews/:id
 */
router.get('/:id', authMiddleware, [
  param('id').isUUID()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid review ID' 
      });
    }

    const { id } = req.params;
    const db = req.app.get('db') as Pool;

    const query = `
      SELECT 
        r.*,
        u.name as customer_name,
        u.email as customer_email,
        s.name as service_name,
        sc.name as service_category,
        admin.name as approved_by_name,
        (
          SELECT json_agg(json_build_object(
            'id', rp.id,
            'photo_url', rp.photo_url,
            'caption', rp.caption,
            'sort_order', rp.sort_order
          ) ORDER BY rp.sort_order)
          FROM review_photos rp 
          WHERE rp.review_id = r.id
        ) as photos
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      JOIN services s ON r.service_id = s.id
      JOIN service_categories sc ON s.category_id = sc.id
      LEFT JOIN users admin ON r.approved_by = admin.id
      WHERE r.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Review not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch review' 
    });
  }
});

/**
 * Create new review
 * POST /api/reviews
 */
router.post('/', authMiddleware, [
  body('user_id').isUUID(),
  body('service_id').isUUID(),
  body('order_id').optional().isUUID(),
  body('rating').isInt({ min: 1, max: 5 }),
  body('comment').isString().isLength({ min: 10, max: 1000 }),
  body('photos').optional().isArray(),
  body('photos.*.photo_url').optional().isURL(),
  body('photos.*.caption').optional().isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { user_id, service_id, order_id, rating, comment, photos } = req.body;
    const db = req.app.get('db') as Pool;

    // Start transaction
    await db.query('BEGIN');

    try {
      // Insert review
      const insertReviewQuery = `
        INSERT INTO reviews (user_id, service_id, order_id, rating, comment)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING *
      `;

      const reviewResult = await db.query(insertReviewQuery, [
        user_id, service_id, order_id || null, rating, comment
      ]);

      const review = reviewResult.rows[0];

      // Insert photos if provided
      if (photos && photos.length > 0) {
        const photoInserts = photos.map((photo: any, index: number) => {
          return db.query(
            'INSERT INTO review_photos (review_id, photo_url, caption, sort_order) VALUES ($1, $2, $3, $4)',
            [review.id, photo.photo_url, photo.caption || null, index + 1]
          );
        });

        await Promise.all(photoInserts);
      }

      await db.query('COMMIT');

      res.status(201).json({
        success: true,
        data: review,
        message: 'Review created successfully'
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create review' 
    });
  }
});

/**
 * Approve or reject review
 * PUT /api/reviews/:id/moderate
 */
router.put('/:id/moderate', authMiddleware, [
  param('id').isUUID(),
  body('action').isIn(['approve', 'reject']),
  body('admin_notes').optional().isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { action, admin_notes } = req.body;
    const adminId = req.user?.id; // Assuming user ID is available from auth middleware
    const db = req.app.get('db') as Pool;

    const updateQuery = `
      UPDATE reviews 
      SET 
        is_approved = $2,
        approved_by = $3,
        approved_at = NOW(),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(updateQuery, [
      id, 
      action === 'approve', 
      adminId
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Review not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: `Review ${action}d successfully`
    });

  } catch (error) {
    console.error('Error moderating review:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to moderate review' 
    });
  }
});

/**
 * Add photo to existing review
 * POST /api/reviews/:id/photos
 */
router.post('/:id/photos', authMiddleware, [
  param('id').isUUID(),
  body('photo_url').isURL(),
  body('caption').optional().isString()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { photo_url, caption } = req.body;
    const db = req.app.get('db') as Pool;

    // Check if review exists
    const reviewCheck = await db.query('SELECT id FROM reviews WHERE id = $1', [id]);
    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Review not found' 
      });
    }

    // Get next sort order
    const sortOrderResult = await db.query(
      'SELECT COALESCE(MAX(sort_order), 0) + 1 as next_order FROM review_photos WHERE review_id = $1',
      [id]
    );
    const sortOrder = sortOrderResult.rows[0].next_order;

    // Insert photo
    const insertQuery = `
      INSERT INTO review_photos (review_id, photo_url, caption, sort_order)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await db.query(insertQuery, [id, photo_url, caption || null, sortOrder]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Photo added to review successfully'
    });

  } catch (error) {
    console.error('Error adding photo to review:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add photo to review' 
    });
  }
});

/**
 * Mark review as helpful/not helpful
 * POST /api/reviews/:id/helpfulness
 */
router.post('/:id/helpfulness', authMiddleware, [
  param('id').isUUID(),
  body('is_helpful').isBoolean()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { id } = req.params;
    const { is_helpful } = req.body;
    const userId = req.user?.id; // Assuming user ID is available from auth middleware
    const db = req.app.get('db') as Pool;

    // Insert or update helpfulness record
    const upsertQuery = `
      INSERT INTO review_helpfulness (review_id, user_id, is_helpful)
      VALUES ($1, $2, $3)
      ON CONFLICT (review_id, user_id)
      DO UPDATE SET is_helpful = EXCLUDED.is_helpful, created_at = NOW()
      RETURNING *
    `;

    const result = await db.query(upsertQuery, [id, userId, is_helpful]);

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Helpfulness feedback recorded successfully'
    });

  } catch (error) {
    console.error('Error recording helpfulness:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to record helpfulness feedback' 
    });
  }
});

/**
 * Get review analytics
 * GET /api/reviews/analytics/summary
 */
router.get('/analytics/summary', authMiddleware, [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']),
  query('service_id').optional().isUUID(),
  query('category_id').optional().isUUID()
], async (req: Request, res: Response) => {
  try {
    const { period = '30d', service_id, category_id } = req.query;
    const db = req.app.get('db') as Pool;

    // Build filters
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    // Date filter
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
    conditions.push(`r.created_at >= NOW() - INTERVAL '${days} days'`);

    if (service_id) {
      conditions.push(`r.service_id = $${++paramCount}`);
      params.push(service_id);
    }

    if (category_id) {
      conditions.push(`s.category_id = $${++paramCount}`);
      params.push(category_id);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const analyticsQuery = `
      SELECT 
        COUNT(*) as total_reviews,
        COUNT(CASE WHEN r.is_approved = true THEN 1 END) as approved_reviews,
        COUNT(CASE WHEN r.approved_by IS NULL THEN 1 END) as pending_reviews,
        COUNT(CASE WHEN r.is_approved = false AND r.approved_by IS NOT NULL THEN 1 END) as rejected_reviews,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(CASE WHEN r.rating = 5 THEN 1 END) as five_star_reviews,
        COUNT(CASE WHEN r.rating = 4 THEN 1 END) as four_star_reviews,
        COUNT(CASE WHEN r.rating = 3 THEN 1 END) as three_star_reviews,
        COUNT(CASE WHEN r.rating = 2 THEN 1 END) as two_star_reviews,
        COUNT(CASE WHEN r.rating = 1 THEN 1 END) as one_star_reviews,
        COUNT(DISTINCT r.user_id) as unique_reviewers,
        COUNT(DISTINCT r.service_id) as services_reviewed
      FROM reviews r
      JOIN services s ON r.service_id = s.id
      ${whereClause}
    `;

    const result = await db.query(analyticsQuery, params);
    const analytics = result.rows[0];

    // Calculate rating distribution
    const totalReviews = parseInt(analytics.total_reviews);
    const ratingDistribution = {
      5: { count: parseInt(analytics.five_star_reviews), percentage: 0 },
      4: { count: parseInt(analytics.four_star_reviews), percentage: 0 },
      3: { count: parseInt(analytics.three_star_reviews), percentage: 0 },
      2: { count: parseInt(analytics.two_star_reviews), percentage: 0 },
      1: { count: parseInt(analytics.one_star_reviews), percentage: 0 }
    };

    if (totalReviews > 0) {
      Object.keys(ratingDistribution).forEach(rating => {
        const count = ratingDistribution[rating as keyof typeof ratingDistribution].count;
        ratingDistribution[rating as keyof typeof ratingDistribution].percentage = 
          parseFloat((count / totalReviews * 100).toFixed(2));
      });
    }

    res.json({
      success: true,
      data: {
        ...analytics,
        average_rating: parseFloat(analytics.average_rating).toFixed(2),
        rating_distribution: ratingDistribution,
        approval_rate: totalReviews > 0 ? 
          parseFloat((parseInt(analytics.approved_reviews) / totalReviews * 100).toFixed(2)) : 0,
        period: period,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching review analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch review analytics' 
    });
  }
});

/**
 * Delete review
 * DELETE /api/reviews/:id
 */
router.delete('/:id', authMiddleware, [
  param('id').isUUID()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid review ID' 
      });
    }

    const { id } = req.params;
    const db = req.app.get('db') as Pool;

    // Start transaction
    await db.query('BEGIN');

    try {
      // Delete associated photos first (due to foreign key constraint)
      await db.query('DELETE FROM review_photos WHERE review_id = $1', [id]);
      
      // Delete helpfulness records
      await db.query('DELETE FROM review_helpfulness WHERE review_id = $1', [id]);
      
      // Delete the review
      const deleteResult = await db.query('DELETE FROM reviews WHERE id = $1', [id]);

      if (deleteResult.rowCount === 0) {
        await db.query('ROLLBACK');
        return res.status(404).json({ 
          success: false, 
          error: 'Review not found' 
        });
      }

      await db.query('COMMIT');

      res.json({
        success: true,
        message: 'Review deleted successfully'
      });

    } catch (error) {
      await db.query('ROLLBACK');
      throw error;
    }

  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete review' 
    });
  }
});

export default router;