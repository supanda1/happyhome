/**
 * Bookings Controller
 * Handles business logic for booking management operations
 */

import { Request, Response } from 'express';
import { Pool } from 'pg';

export interface BookingFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
  user_id?: string;
  service_id?: string;
}

export interface CreateBookingData {
  user_id: string;
  service_id: string;
  variant_id?: string;
  address_id: string;
  scheduled_date: string;
  scheduled_time_start: string;
  scheduled_time_end: string;
  quantity?: number;
  unit_price: number;
  subtotal_amount?: number;
  discount_amount?: number;
  tax_amount?: number;
  total_amount: number;
  coupon_code?: string;
  customer_notes?: string;
  payment_method?: string;
}

export class BookingsController {
  
  /**
   * Get all bookings with advanced filtering
   */
  static async getAllBookings(req: Request, res: Response) {
    try {
      const filters: BookingFilters = req.query;
      const db = req.app.get('db') as Pool;
      
      const {
        page = 1,
        limit = 10,
        status,
        search,
        date_from,
        date_to,
        user_id,
        service_id
      } = filters;

      const offset = (Number(page) - 1) * Number(limit);

      // Build dynamic query
      const conditions: string[] = [];
      const params: any[] = [];
      let paramCount = 0;

      if (status) {
        conditions.push(`b.status = $${++paramCount}`);
        params.push(status);
      }

      if (user_id) {
        conditions.push(`b.user_id = $${++paramCount}`);
        params.push(user_id);
      }

      if (service_id) {
        conditions.push(`b.service_id = $${++paramCount}`);
        params.push(service_id);
      }

      if (search) {
        conditions.push(`(
          b.invoice_number ILIKE $${++paramCount} OR 
          u.name ILIKE $${++paramCount} OR
          s.name ILIKE $${++paramCount}
        )`);
        const searchPattern = `%${search}%`;
        params.push(searchPattern, searchPattern, searchPattern);
        paramCount += 2;
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

      // Get bookings with enhanced data
      const query = `
        SELECT 
          b.*,
          u.name as customer_name,
          u.email as customer_email,
          u.phone as customer_phone,
          s.name as service_name,
          s.base_price as service_base_price,
          sc.name as service_category,
          sv.name as variant_name,
          ua.house_number || ', ' || ua.area || ', ' || ua.city as customer_address,
          t.name as technician_name,
          t.phone as technician_phone,
          c.code as coupon_code,
          c.discount_value as coupon_discount,
          COUNT(*) OVER() as total_count
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN services s ON b.service_id = s.id
        JOIN service_categories sc ON s.category_id = sc.id
        LEFT JOIN service_variants sv ON b.variant_id = sv.id
        JOIN user_addresses ua ON b.address_id = ua.id
        LEFT JOIN users t ON b.assigned_technician_id = t.id
        LEFT JOIN coupons c ON b.coupon_id = c.id
        ${whereClause}
        ORDER BY b.created_at DESC
        LIMIT $${++paramCount} OFFSET $${++paramCount}
      `;

      params.push(Number(limit), offset);

      const result = await db.query(query, params);
      const bookings = result.rows;
      const total = bookings.length > 0 ? parseInt(bookings[0].total_count) : 0;
      const totalPages = Math.ceil(total / Number(limit));

      return res.json({
        success: true,
        data: {
          bookings: bookings.map(booking => ({
            ...booking,
            total_count: undefined // Remove the count field from individual records
          })),
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
      console.error('Error in getAllBookings:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch bookings'
      });
    }
  }

  /**
   * Get booking by ID with complete details
   */
  static async getBookingById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const db = req.app.get('db') as Pool;

      const query = `
        SELECT 
          b.*,
          u.name as customer_name,
          u.email as customer_email,
          u.phone as customer_phone,
          s.name as service_name,
          s.description as service_description,
          s.base_price as service_base_price,
          s.inclusions as service_inclusions,
          s.exclusions as service_exclusions,
          sc.name as service_category,
          sv.name as variant_name,
          sv.description as variant_description,
          sv.base_price as variant_price,
          ua.house_number,
          ua.area,
          ua.landmark,
          ua.city,
          ua.state,
          ua.pincode,
          t.name as technician_name,
          t.phone as technician_phone,
          t.email as technician_email,
          c.code as coupon_code,
          c.discount_value as coupon_discount,
          c.discount_type as coupon_type
        FROM bookings b
        JOIN users u ON b.user_id = u.id
        JOIN services s ON b.service_id = s.id
        JOIN service_categories sc ON s.category_id = sc.id
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

      return res.json({
        success: true,
        data: result.rows[0]
      });

    } catch (error) {
      console.error('Error in getBookingById:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch booking'
      });
    }
  }

  /**
   * Create new booking with validation
   */
  static async createBooking(req: Request, res: Response) {
    try {
      const bookingData: CreateBookingData = req.body;
      const db = req.app.get('db') as Pool;

      // Start transaction
      await db.query('BEGIN');

      try {
        // Validate service exists and is active
        const serviceCheck = await db.query(
          'SELECT id, is_active, base_price FROM services WHERE id = $1',
          [bookingData.service_id]
        );

        if (serviceCheck.rows.length === 0) {
          throw new Error('Service not found');
        }

        if (!serviceCheck.rows[0].is_active) {
          throw new Error('Service is not active');
        }

        // Validate user exists
        const userCheck = await db.query(
          'SELECT id FROM users WHERE id = $1',
          [bookingData.user_id]
        );

        if (userCheck.rows.length === 0) {
          throw new Error('User not found');
        }

        // Validate address belongs to user
        const addressCheck = await db.query(
          'SELECT id FROM user_addresses WHERE id = $1 AND user_id = $2',
          [bookingData.address_id, bookingData.user_id]
        );

        if (addressCheck.rows.length === 0) {
          throw new Error('Address not found or does not belong to user');
        }

        // Check for scheduling conflicts
        const conflictCheck = await db.query(`
          SELECT id FROM bookings 
          WHERE assigned_technician_id IS NOT NULL 
          AND assigned_technician_id = $1
          AND scheduled_date = $2
          AND status NOT IN ('completed', 'cancelled')
          AND (
            (scheduled_time_start <= $3 AND scheduled_time_end > $3) OR
            (scheduled_time_start < $4 AND scheduled_time_end >= $4) OR
            (scheduled_time_start >= $3 AND scheduled_time_end <= $4)
          )
        `, [
          bookingData.user_id, // This should be technician_id when implemented
          bookingData.scheduled_date,
          bookingData.scheduled_time_start,
          bookingData.scheduled_time_end
        ]);

        // Generate invoice number
        const invoiceNumber = `BK${Date.now()}`;

        // Insert booking
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

        await db.query('COMMIT');

        return res.status(201).json({
          success: true,
          data: result.rows[0],
          message: 'Booking created successfully'
        });

      } catch (error) {
        await db.query('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Error in createBooking:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create booking'
      });
    }
  }

  /**
   * Update booking status with business logic
   */
  static async updateBookingStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status, admin_notes, assigned_technician_id, cancellation_reason } = req.body;
      const db = req.app.get('db') as Pool;

      // Get current booking
      const currentBooking = await db.query(
        'SELECT * FROM bookings WHERE id = $1',
        [id]
      );

      if (currentBooking.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }

      const booking = currentBooking.rows[0];

      // Validate status transitions
      const allowedTransitions: { [key: string]: string[] } = {
        'pending': ['confirmed', 'cancelled'],
        'confirmed': ['in_progress', 'cancelled'],
        'in_progress': ['completed', 'cancelled'],
        'completed': [], // No transitions from completed
        'cancelled': ['confirmed'], // Can reactivate cancelled bookings
        'refunded': [] // No transitions from refunded
      };

      if (!allowedTransitions[booking.status]?.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Cannot transition from ${booking.status} to ${status}`
        });
      }

      // Build update query
      const updates: string[] = ['status = $2', 'updated_at = NOW()'];
      const values: any[] = [id, status];
      let paramCount = 2;

      if (admin_notes) {
        updates.push(`admin_notes = COALESCE(admin_notes, '') || $${++paramCount}`);
        values.push(`\n${new Date().toISOString()}: ${admin_notes}`);
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

      return res.json({
        success: true,
        data: result.rows[0],
        message: `Booking status updated to ${status}`
      });

    } catch (error) {
      console.error('Error in updateBookingStatus:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update booking status'
      });
    }
  }

  /**
   * Get booking analytics and insights
   */
  static async getBookingAnalytics(req: Request, res: Response) {
    try {
      const { period = '30d', technician_id, service_category } = req.query;
      const db = req.app.get('db') as Pool;

      // Build date filter
      const conditions: string[] = [];
      const params: any[] = [];
      let paramCount = 0;

      const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 365;
      conditions.push(`b.created_at >= NOW() - INTERVAL '${days} days'`);

      if (technician_id) {
        conditions.push(`b.assigned_technician_id = $${++paramCount}`);
        params.push(technician_id);
      }

      if (service_category) {
        conditions.push(`sc.id = $${++paramCount}`);
        params.push(service_category);
      }

      const whereClause = `WHERE ${conditions.join(' AND ')}`;

      // Main analytics query
      const analyticsQuery = `
        SELECT 
          COUNT(*) as total_bookings,
          COUNT(CASE WHEN b.status = 'pending' THEN 1 END) as pending_bookings,
          COUNT(CASE WHEN b.status = 'confirmed' THEN 1 END) as confirmed_bookings,
          COUNT(CASE WHEN b.status = 'completed' THEN 1 END) as completed_bookings,
          COUNT(CASE WHEN b.status = 'cancelled' THEN 1 END) as cancelled_bookings,
          COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.total_amount ELSE 0 END), 0) as total_revenue,
          COALESCE(AVG(CASE WHEN b.status = 'completed' THEN b.total_amount END), 0) as avg_booking_value,
          COUNT(DISTINCT b.user_id) as unique_customers,
          COUNT(DISTINCT b.assigned_technician_id) as active_technicians
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN service_categories sc ON s.category_id = sc.id
        ${whereClause}
      `;

      // Service category breakdown
      const categoryBreakdownQuery = `
        SELECT 
          sc.name as category_name,
          COUNT(*) as booking_count,
          SUM(CASE WHEN b.status = 'completed' THEN b.total_amount ELSE 0 END) as revenue
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN service_categories sc ON s.category_id = sc.id
        ${whereClause}
        GROUP BY sc.id, sc.name
        ORDER BY booking_count DESC
      `;

      // Daily trend
      const trendQuery = `
        SELECT 
          DATE(b.created_at) as date,
          COUNT(*) as bookings,
          SUM(CASE WHEN b.status = 'completed' THEN b.total_amount ELSE 0 END) as revenue
        FROM bookings b
        JOIN services s ON b.service_id = s.id
        JOIN service_categories sc ON s.category_id = sc.id
        ${whereClause}
        GROUP BY DATE(b.created_at)
        ORDER BY date DESC
        LIMIT 30
      `;

      const [analyticsResult, categoryResult, trendResult] = await Promise.all([
        db.query(analyticsQuery, params),
        db.query(categoryBreakdownQuery, params),
        db.query(trendQuery, params)
      ]);

      const analytics = analyticsResult.rows[0];
      const totalBookings = parseInt(analytics.total_bookings);
      const completedBookings = parseInt(analytics.completed_bookings);
      const cancelledBookings = parseInt(analytics.cancelled_bookings);

      return res.json({
        success: true,
        data: {
          summary: {
            ...analytics,
            total_revenue: parseFloat(analytics.total_revenue).toFixed(2),
            avg_booking_value: parseFloat(analytics.avg_booking_value).toFixed(2),
            completion_rate: totalBookings > 0 ? 
              parseFloat((completedBookings / totalBookings * 100).toFixed(2)) : 0,
            cancellation_rate: totalBookings > 0 ? 
              parseFloat((cancelledBookings / totalBookings * 100).toFixed(2)) : 0
          },
          category_breakdown: categoryResult.rows,
          daily_trend: trendResult.rows,
          period: period,
          generated_at: new Date().toISOString()
        }
      });

    } catch (error) {
      console.error('Error in getBookingAnalytics:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch booking analytics'
      });
    }
  }

  /**
   * Cancel booking with proper validation
   */
  static async cancelBooking(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { cancellation_reason, refund_amount } = req.body;
      const db = req.app.get('db') as Pool;

      // Get current booking
      const bookingResult = await db.query(
        'SELECT * FROM bookings WHERE id = $1',
        [id]
      );

      if (bookingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }

      const booking = bookingResult.rows[0];

      // Check if booking can be cancelled
      if (!['pending', 'confirmed'].includes(booking.status)) {
        return res.status(400).json({
          success: false,
          error: 'Only pending or confirmed bookings can be cancelled'
        });
      }

      // Update booking status
      const updateQuery = `
        UPDATE bookings 
        SET 
          status = 'cancelled',
          cancelled_at = NOW(),
          cancellation_reason = $2,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const result = await db.query(updateQuery, [id, cancellation_reason]);

      return res.json({
        success: true,
        data: result.rows[0],
        message: 'Booking cancelled successfully'
      });

    } catch (error) {
      console.error('Error in cancelBooking:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to cancel booking'
      });
    }
  }

  /**
   * Assign technician to booking
   */
  static async assignTechnician(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { technician_id, notes } = req.body;
      const db = req.app.get('db') as Pool;

      // Validate technician exists
      const technicianCheck = await db.query(
        'SELECT id, name FROM users WHERE id = $1 AND role = $2',
        [technician_id, 'technician'] // Assuming you have role-based users
      );

      if (technicianCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Technician not found'
        });
      }

      // Update booking
      const updateQuery = `
        UPDATE bookings 
        SET 
          assigned_technician_id = $2,
          status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
          admin_notes = COALESCE(admin_notes, '') || $3,
          updated_at = NOW()
        WHERE id = $1
        RETURNING *
      `;

      const noteText = `\n${new Date().toISOString()}: Assigned technician ${technicianCheck.rows[0].name}. ${notes || ''}`;

      const result = await db.query(updateQuery, [id, technician_id, noteText]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Booking not found'
        });
      }

      return res.json({
        success: true,
        data: result.rows[0],
        message: 'Technician assigned successfully'
      });

    } catch (error) {
      console.error('Error in assignTechnician:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to assign technician'
      });
    }
  }
}

export default BookingsController;