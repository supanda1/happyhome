/**
 * Booking management routes - handles service appointment bookings
 * Provides CRUD operations for booking management system
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authMiddleware } from '../middleware/auth';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();

/**
 * Get all bookings with filtering and pagination
 * GET /api/bookings?page=1&limit=10&status=pending&search=
 */
router.get('/', authMiddleware, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('status').optional().isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded']),
  query('search').optional().isString().trim(),
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601()
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
      search, 
      date_from, 
      date_to 
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const db = req.app.get('db') as Pool;

    // Build dynamic WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (status) {
      conditions.push(`b.status = $${++paramCount}`);
      params.push(status);
    }

    if (search) {
      conditions.push(`(
        b.invoice_number ILIKE $${++paramCount} OR 
        u.name ILIKE $${++paramCount} OR
        u.email ILIKE $${++paramCount} OR
        s.name ILIKE $${++paramCount}
      )`);
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
      paramCount += 3;
    }

    if (date_from) {
      conditions.push(`b.scheduled_date >= $${++paramCount}`);
      params.push(date_from);
    }

    if (date_to) {
      conditions.push(`b.scheduled_date <= $${++paramCount}`);
      params.push(date_to);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN services s ON b.service_id = s.id
      ${whereClause}
    `;

    // Get bookings with pagination
    const bookingsQuery = `
      SELECT 
        b.id,
        b.user_id,
        u.name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        b.service_id,
        s.name as service_name,
        b.variant_id,
        b.scheduled_date,
        b.scheduled_time_start,
        b.scheduled_time_end,
        b.status,
        b.payment_status,
        b.total_amount,
        b.coupon_code,
        b.customer_notes,
        b.admin_notes,
        b.assigned_technician_id,
        t.name as technician_name,
        b.invoice_number,
        b.created_at,
        b.updated_at
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN services s ON b.service_id = s.id
      LEFT JOIN users t ON b.assigned_technician_id = t.id
      ${whereClause}
      ORDER BY b.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

    params.push(Number(limit), offset);

    const [countResult, bookingsResult] = await Promise.all([
      db.query(countQuery, params.slice(0, paramCount - 2)),
      db.query(bookingsQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        bookings: bookingsResult.rows,
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
    console.error('Error fetching bookings:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch bookings' 
    });
  }
});

/**
 * Get booking by ID
 * GET /api/bookings/:id
 */
router.get('/:id', authMiddleware, [
  param('id').isUUID()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid booking ID' 
      });
    }

    const { id } = req.params;
    const db = req.app.get('db') as Pool;

    const query = `
      SELECT 
        b.*,
        u.name as customer_name,
        u.email as customer_email,
        u.phone as customer_phone,
        s.name as service_name,
        s.base_price as service_base_price,
        sv.name as variant_name,
        ua.house_number,
        ua.area,
        ua.landmark,
        ua.city,
        ua.state,
        ua.pincode,
        t.name as technician_name,
        t.phone as technician_phone,
        c.code as coupon_code,
        c.discount_value as coupon_discount
      FROM bookings b
      JOIN users u ON b.user_id = u.id
      JOIN services s ON b.service_id = s.id
      LEFT JOIN service_variants sv ON b.variant_id = sv.id
      JOIN user_addresses ua ON b.address_id = ua.id
      LEFT JOIN users t ON b.assigned_technician_id = t.id
      LEFT JOIN coupons c ON b.coupon_id = c.id
      WHERE b.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Booking not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch booking' 
    });
  }
});

/**
 * Create new booking
 * POST /api/bookings
 */
router.post('/', authMiddleware, [
  body('user_id').isUUID(),
  body('service_id').isUUID(),
  body('address_id').isUUID(),
  body('scheduled_date').isISO8601(),
  body('scheduled_time_start').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('scheduled_time_end').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/),
  body('quantity').optional().isInt({ min: 1 }),
  body('unit_price').isFloat({ min: 0 }),
  body('total_amount').isFloat({ min: 0 }),
  body('coupon_code').optional().isString(),
  body('customer_notes').optional().isString(),
  body('payment_method').optional().isIn(['cash', 'card', 'upi', 'netbanking'])
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

    const db = req.app.get('db') as Pool;
    const bookingData = req.body;

    // Generate invoice number
    const invoiceNumber = `BK${Date.now()}`;

    const insertQuery = `
      INSERT INTO bookings (
        user_id, service_id, variant_id, address_id,
        scheduled_date, scheduled_time_start, scheduled_time_end,
        quantity, unit_price, subtotal_amount, discount_amount,
        tax_amount, total_amount, coupon_code, customer_notes,
        payment_method, invoice_number
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *
    `;

    const values = [
      bookingData.user_id,
      bookingData.service_id,
      bookingData.variant_id || null,
      bookingData.address_id,
      bookingData.scheduled_date,
      bookingData.scheduled_time_start,
      bookingData.scheduled_time_end,
      bookingData.quantity || 1,
      bookingData.unit_price,
      bookingData.subtotal_amount || bookingData.total_amount,
      bookingData.discount_amount || 0,
      bookingData.tax_amount || 0,
      bookingData.total_amount,
      bookingData.coupon_code || null,
      bookingData.customer_notes || null,
      bookingData.payment_method || null,
      invoiceNumber
    ];

    const result = await db.query(insertQuery, values);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Booking created successfully'
    });

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create booking' 
    });
  }
});

/**
 * Update booking status
 * PUT /api/bookings/:id/status
 */
router.put('/:id/status', authMiddleware, [
  param('id').isUUID(),
  body('status').isIn(['pending', 'confirmed', 'in_progress', 'completed', 'cancelled', 'refunded']),
  body('admin_notes').optional().isString(),
  body('assigned_technician_id').optional().isUUID(),
  body('cancellation_reason').optional().isString()
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
    const { status, admin_notes, assigned_technician_id, cancellation_reason } = req.body;
    const db = req.app.get('db') as Pool;

    // Build update query dynamically
    const updates: string[] = ['status = $2', 'updated_at = NOW()'];
    const values: any[] = [id, status];
    let paramCount = 2;

    if (admin_notes) {
      updates.push(`admin_notes = $${++paramCount}`);
      values.push(admin_notes);
    }

    if (assigned_technician_id) {
      updates.push(`assigned_technician_id = $${++paramCount}`);
      values.push(assigned_technician_id);
    }

    if (status === 'cancelled' && cancellation_reason) {
      updates.push(`cancelled_at = NOW(), cancellation_reason = $${++paramCount}`);
      values.push(cancellation_reason);
    }

    if (status === 'in_progress') {
      updates.push('started_at = NOW()');
    }

    if (status === 'completed') {
      updates.push('completed_at = NOW()');
    }

    const query = `
      UPDATE bookings 
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Booking not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: `Booking status updated to ${status}`
    });

  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update booking status' 
    });
  }
});

/**
 * Delete booking
 * DELETE /api/bookings/:id
 */
router.delete('/:id', authMiddleware, [
  param('id').isUUID()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid booking ID' 
      });
    }

    const { id } = req.params;
    const db = req.app.get('db') as Pool;

    // Check if booking can be deleted (only pending bookings)
    const checkQuery = 'SELECT status FROM bookings WHERE id = $1';
    const checkResult = await db.query(checkQuery, [id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Booking not found' 
      });
    }

    const booking = checkResult.rows[0];
    if (booking.status !== 'pending') {
      return res.status(400).json({ 
        success: false, 
        error: 'Only pending bookings can be deleted' 
      });
    }

    const deleteQuery = 'DELETE FROM bookings WHERE id = $1';
    await db.query(deleteQuery, [id]);

    res.json({
      success: true,
      message: 'Booking deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting booking:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete booking' 
    });
  }
});

/**
 * Get booking analytics
 * GET /api/bookings/analytics/summary
 */
router.get('/analytics/summary', authMiddleware, [
  query('period').optional().isIn(['7d', '30d', '90d', '1y']),
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601()
], async (req: Request, res: Response) => {
  try {
    const { period = '30d', date_from, date_to } = req.query;
    const db = req.app.get('db') as Pool;

    // Calculate date range
    let dateFilter = '';
    const params: any[] = [];
    
    if (date_from && date_to) {
      dateFilter = 'WHERE b.created_at >= $1 AND b.created_at <= $2';
      params.push(date_from, date_to);
    } else {
      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
      dateFilter = 'WHERE b.created_at >= NOW() - INTERVAL \'' + days + ' days\'';
    }

    const analyticsQuery = `
      SELECT 
        COUNT(*) as total_bookings,
        COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending_bookings,
        COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
        COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
        COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
        COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount ELSE 0 END), 0) as total_revenue,
        COALESCE(AVG(CASE WHEN b.status = 'completed' THEN b.total_amount END), 0) as avg_booking_value,
        COUNT(DISTINCT b.user_id) as unique_customers
      FROM bookings b
      ${dateFilter}
    `;

    const result = await db.query(analyticsQuery, params);
    const analytics = result.rows[0];

    // Calculate metrics
    const totalBookings = parseInt(analytics.total_bookings);
    const completedBookings = parseInt(analytics.completed_bookings);
    const cancelledBookings = parseInt(analytics.cancelled_bookings);
    
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings * 100).toFixed(2) : '0';
    const cancellationRate = totalBookings > 0 ? (cancelledBookings / totalBookings * 100).toFixed(2) : '0';

    res.json({
      success: true,
      data: {
        ...analytics,
        total_revenue: parseFloat(analytics.total_revenue).toFixed(2),
        avg_booking_value: parseFloat(analytics.avg_booking_value).toFixed(2),
        completion_rate: parseFloat(completionRate),
        cancellation_rate: parseFloat(cancellationRate),
        period: period,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching booking analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch booking analytics' 
    });
  }
});

export default router;