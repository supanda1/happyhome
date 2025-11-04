/**
 * Notifications management routes - handles SMS and email notifications
 * Provides CRUD operations and analytics for notification system
 */

import { Router, Request, Response } from 'express';
import { Pool } from 'pg';
import { authenticateToken } from '../middleware/auth';
import { body, param, query, validationResult } from 'express-validator';

const router = Router();

/**
 * Get all notifications with filtering and pagination
 * GET /api/notifications?page=1&limit=10&type=sms&status=pending&event_type=order_placed
 */
router.get('/', authenticateToken, [
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('type').optional().isIn(['sms', 'email', 'push']),
  query('status').optional().isIn(['pending', 'sent', 'delivered', 'failed', 'cancelled']),
  query('event_type').optional().isString(),
  query('customer_id').optional().isString(),
  query('order_id').optional().isUUID(),
  query('date_from').optional().isISO8601(),
  query('date_to').optional().isISO8601(),
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
      type,
      status,
      event_type,
      customer_id,
      order_id,
      date_from,
      date_to,
      search
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    const db = req.app.get('db') as Pool;

    // Build dynamic WHERE clause
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    if (type) {
      conditions.push(`n.notification_type = $${++paramCount}`);
      params.push(type);
    }

    if (status) {
      conditions.push(`n.status = $${++paramCount}`);
      params.push(status);
    }

    if (event_type) {
      conditions.push(`n.event_type = $${++paramCount}`);
      params.push(event_type);
    }

    if (customer_id) {
      conditions.push(`n.customer_id = $${++paramCount}`);
      params.push(customer_id);
    }

    if (order_id) {
      conditions.push(`n.order_id = $${++paramCount}`);
      params.push(order_id);
    }

    if (date_from) {
      conditions.push(`n.created_at >= $${++paramCount}`);
      params.push(date_from);
    }

    if (date_to) {
      conditions.push(`n.created_at <= $${++paramCount}`);
      params.push(date_to);
    }

    if (search) {
      conditions.push(`(
        n.customer_name ILIKE $${++paramCount} OR 
        n.customer_phone ILIKE $${++paramCount} OR
        n.customer_email ILIKE $${++paramCount} OR
        n.message ILIKE $${++paramCount} OR
        n.order_number ILIKE $${++paramCount}
      )`);
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern, searchPattern);
      paramCount += 4;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM notifications n
      ${whereClause}
    `;

    // Get notifications with pagination
    const notificationsQuery = `
      SELECT 
        n.id,
        n.customer_id,
        n.customer_name,
        n.customer_phone,
        n.customer_email,
        n.notification_type,
        n.event_type,
        n.priority,
        n.subject,
        n.message,
        n.order_id,
        n.order_number,
        n.status,
        n.provider_name,
        n.provider_message_id,
        n.sent_at,
        n.delivered_at,
        n.failed_at,
        n.failure_reason,
        n.retry_count,
        n.max_retries,
        n.created_at,
        n.updated_at,
        CASE 
          WHEN n.order_id IS NOT NULL THEN (
            SELECT json_build_object(
              'id', o.id,
              'order_number', o.order_number,
              'status', o.status,
              'final_amount', o.final_amount
            )
            FROM orders o WHERE o.id = n.order_id
          )
          ELSE NULL
        END as order_details
      FROM notifications n
      ${whereClause}
      ORDER BY n.created_at DESC
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;

    params.push(Number(limit), offset);

    const [countResult, notificationsResult] = await Promise.all([
      db.query(countQuery, params.slice(0, paramCount - 2)),
      db.query(notificationsQuery, params)
    ]);

    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      success: true,
      data: {
        notifications: notificationsResult.rows,
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
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notifications' 
    });
  }
});

/**
 * Get notification by ID
 * GET /api/notifications/:id
 */
router.get('/:id', authenticateToken, [
  param('id').isUUID()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid notification ID' 
      });
    }

    const { id } = req.params;
    const db = req.app.get('db') as Pool;

    const query = `
      SELECT 
        n.*,
        CASE 
          WHEN n.order_id IS NOT NULL THEN (
            SELECT json_build_object(
              'id', o.id,
              'order_number', o.order_number,
              'status', o.status,
              'final_amount', o.final_amount,
              'customer_name', o.customer_name,
              'customer_phone', o.customer_phone
            )
            FROM orders o WHERE o.id = n.order_id
          )
          ELSE NULL
        END as order_details,
        (
          SELECT json_agg(json_build_object(
            'id', nl.id,
            'log_level', nl.log_level,
            'message', nl.message,
            'error_code', nl.error_code,
            'provider_response', nl.provider_response,
            'created_at', nl.created_at
          ) ORDER BY nl.created_at DESC)
          FROM notification_logs nl 
          WHERE nl.notification_id = n.id
        ) as logs
      FROM notifications n
      WHERE n.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error fetching notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notification' 
    });
  }
});

/**
 * Create new notification
 * POST /api/notifications
 */
router.post('/', authenticateToken, [
  body('customer_id').isString().notEmpty(),
  body('customer_name').isString().notEmpty(),
  body('customer_phone').optional().isMobilePhone('any'),
  body('customer_email').optional().isEmail(),
  body('notification_type').isIn(['sms', 'email', 'push']),
  body('event_type').isString().notEmpty(),
  body('priority').optional().isIn(['low', 'normal', 'high', 'urgent']),
  body('subject').optional().isString(),
  body('message').isString().notEmpty(),
  body('order_id').optional().isUUID(),
  body('order_number').optional().isString(),
  body('template_id').optional().isUUID(),
  body('metadata').optional().isObject()
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

    const notificationData = req.body;
    const db = req.app.get('db') as Pool;

    // Validate notification type requirements
    if (notificationData.notification_type === 'email' && !notificationData.customer_email) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer email is required for email notifications' 
      });
    }

    if (notificationData.notification_type === 'sms' && !notificationData.customer_phone) {
      return res.status(400).json({ 
        success: false, 
        error: 'Customer phone is required for SMS notifications' 
      });
    }

    const insertQuery = `
      INSERT INTO notifications (
        customer_id, customer_name, customer_phone, customer_email,
        notification_type, event_type, priority, subject, message,
        order_id, order_number, template_id, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;

    const values = [
      notificationData.customer_id,
      notificationData.customer_name,
      notificationData.customer_phone || null,
      notificationData.customer_email || null,
      notificationData.notification_type,
      notificationData.event_type,
      notificationData.priority || 'normal',
      notificationData.subject || null,
      notificationData.message,
      notificationData.order_id || null,
      notificationData.order_number || null,
      notificationData.template_id || null,
      JSON.stringify(notificationData.metadata || {})
    ];

    const result = await db.query(insertQuery, values);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Notification created successfully'
    });

  } catch (error) {
    console.error('Error creating notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to create notification' 
    });
  }
});

/**
 * Update notification status
 * PUT /api/notifications/:id/status
 */
router.put('/:id/status', authenticateToken, [
  param('id').isUUID(),
  body('status').isIn(['pending', 'sent', 'delivered', 'failed', 'cancelled']),
  body('provider_name').optional().isString(),
  body('provider_message_id').optional().isString(),
  body('failure_reason').optional().isString(),
  body('delivered_at').optional().isISO8601(),
  body('metadata').optional().isObject()
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
    const { status, provider_name, provider_message_id, failure_reason, delivered_at, metadata } = req.body;
    const db = req.app.get('db') as Pool;

    // Build update query dynamically
    const updates: string[] = ['status = $2', 'updated_at = NOW()'];
    const values: any[] = [id, status];
    let paramCount = 2;

    if (provider_name) {
      updates.push(`provider_name = $${++paramCount}`);
      values.push(provider_name);
    }

    if (provider_message_id) {
      updates.push(`provider_message_id = $${++paramCount}`);
      values.push(provider_message_id);
    }

    if (status === 'sent') {
      updates.push('sent_at = NOW()');
    }

    if (status === 'delivered' && delivered_at) {
      updates.push(`delivered_at = $${++paramCount}`);
      values.push(delivered_at);
    } else if (status === 'delivered') {
      updates.push('delivered_at = NOW()');
    }

    if (status === 'failed') {
      updates.push('failed_at = NOW()');
      if (failure_reason) {
        updates.push(`failure_reason = $${++paramCount}`);
        values.push(failure_reason);
      }
      // Increment retry count
      updates.push('retry_count = retry_count + 1');
    }

    if (metadata) {
      updates.push(`metadata = $${++paramCount}`);
      values.push(JSON.stringify(metadata));
    }

    const query = `
      UPDATE notifications 
      SET ${updates.join(', ')}
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }

    res.json({
      success: true,
      data: result.rows[0],
      message: `Notification status updated to ${status}`
    });

  } catch (error) {
    console.error('Error updating notification status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update notification status' 
    });
  }
});

/**
 * Add log entry to notification
 * POST /api/notifications/:id/logs
 */
router.post('/:id/logs', authenticateToken, [
  param('id').isUUID(),
  body('log_level').isIn(['debug', 'info', 'warn', 'error']),
  body('message').isString().notEmpty(),
  body('error_code').optional().isString(),
  body('provider_response').optional().isObject()
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
    const { log_level, message, error_code, provider_response } = req.body;
    const db = req.app.get('db') as Pool;

    // Check if notification exists
    const notificationCheck = await db.query('SELECT id FROM notifications WHERE id = $1', [id]);
    if (notificationCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }

    const insertQuery = `
      INSERT INTO notification_logs (notification_id, log_level, message, error_code, provider_response)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const result = await db.query(insertQuery, [
      id, log_level, message, error_code || null, JSON.stringify(provider_response || {})
    ]);

    res.status(201).json({
      success: true,
      data: result.rows[0],
      message: 'Log entry added successfully'
    });

  } catch (error) {
    console.error('Error adding notification log:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to add notification log' 
    });
  }
});

/**
 * Retry failed notification
 * POST /api/notifications/:id/retry
 */
router.post('/:id/retry', authenticateToken, [
  param('id').isUUID()
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid notification ID' 
      });
    }

    const { id } = req.params;
    const db = req.app.get('db') as Pool;

    // Get notification details
    const notificationQuery = 'SELECT * FROM notifications WHERE id = $1';
    const notificationResult = await db.query(notificationQuery, [id]);

    if (notificationResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Notification not found' 
      });
    }

    const notification = notificationResult.rows[0];

    // Check if notification can be retried
    if (notification.status !== 'failed') {
      return res.status(400).json({ 
        success: false, 
        error: 'Only failed notifications can be retried' 
      });
    }

    if (notification.retry_count >= notification.max_retries) {
      return res.status(400).json({ 
        success: false, 
        error: 'Maximum retry limit reached' 
      });
    }

    // Reset notification to pending status
    const updateQuery = `
      UPDATE notifications 
      SET 
        status = 'pending',
        failed_at = NULL,
        failure_reason = NULL,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `;

    const result = await db.query(updateQuery, [id]);

    // Add log entry
    await db.query(
      'INSERT INTO notification_logs (notification_id, log_level, message) VALUES ($1, $2, $3)',
      [id, 'info', 'Notification queued for retry']
    );

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Notification queued for retry'
    });

  } catch (error) {
    console.error('Error retrying notification:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retry notification' 
    });
  }
});

/**
 * Get notification analytics
 * GET /api/notifications/analytics/summary
 */
router.get('/analytics/summary', authenticateToken, [
  query('period').optional().isIn(['24h', '7d', '30d', '90d']),
  query('notification_type').optional().isIn(['sms', 'email', 'push']),
  query('event_type').optional().isString()
], async (req: Request, res: Response) => {
  try {
    const { period = '30d', notification_type, event_type } = req.query;
    const db = req.app.get('db') as Pool;

    // Build filters
    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    // Date filter
    const hours = period === '24h' ? 24 : 0;
    const days = period === '7d' ? 7 : period === '30d' ? 30 : period === '90d' ? 90 : 0;
    
    if (hours > 0) {
      conditions.push(`created_at >= NOW() - INTERVAL '${hours} hours'`);
    } else if (days > 0) {
      conditions.push(`created_at >= NOW() - INTERVAL '${days} days'`);
    }

    if (notification_type) {
      conditions.push(`notification_type = $${++paramCount}`);
      params.push(notification_type);
    }

    if (event_type) {
      conditions.push(`event_type = $${++paramCount}`);
      params.push(event_type);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    const analyticsQuery = `
      SELECT 
        COUNT(*) as total_notifications,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_count,
        COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_count,
        COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_count,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_count,
        COUNT(CASE WHEN notification_type = 'sms' THEN 1 END) as sms_count,
        COUNT(CASE WHEN notification_type = 'email' THEN 1 END) as email_count,
        COUNT(CASE WHEN notification_type = 'push' THEN 1 END) as push_count,
        COUNT(DISTINCT customer_id) as unique_customers,
        AVG(CASE WHEN sent_at IS NOT NULL AND created_at IS NOT NULL 
          THEN EXTRACT(EPOCH FROM (sent_at - created_at)) END) as avg_send_time_seconds
      FROM notifications
      ${whereClause}
    `;

    const result = await db.query(analyticsQuery, params);
    const analytics = result.rows[0];

    // Calculate rates
    const totalNotifications = parseInt(analytics.total_notifications);
    const deliveredCount = parseInt(analytics.delivered_count);
    const failedCount = parseInt(analytics.failed_count);
    const sentCount = parseInt(analytics.sent_count);

    const deliveryRate = totalNotifications > 0 ? 
      parseFloat((deliveredCount / totalNotifications * 100).toFixed(2)) : 0;
    
    const failureRate = totalNotifications > 0 ? 
      parseFloat((failedCount / totalNotifications * 100).toFixed(2)) : 0;

    const successRate = totalNotifications > 0 ? 
      parseFloat(((sentCount + deliveredCount) / totalNotifications * 100).toFixed(2)) : 0;

    // Get event type breakdown
    const eventBreakdownQuery = `
      SELECT event_type, COUNT(*) as count
      FROM notifications
      ${whereClause}
      GROUP BY event_type
      ORDER BY count DESC
      LIMIT 10
    `;

    const eventResult = await db.query(eventBreakdownQuery, params);

    res.json({
      success: true,
      data: {
        ...analytics,
        avg_send_time_seconds: analytics.avg_send_time_seconds ? 
          parseFloat(analytics.avg_send_time_seconds).toFixed(2) : null,
        delivery_rate: deliveryRate,
        failure_rate: failureRate,
        success_rate: successRate,
        event_breakdown: eventResult.rows,
        type_breakdown: {
          sms: parseInt(analytics.sms_count),
          email: parseInt(analytics.email_count),
          push: parseInt(analytics.push_count)
        },
        status_breakdown: {
          pending: parseInt(analytics.pending_count),
          sent: parseInt(analytics.sent_count),
          delivered: parseInt(analytics.delivered_count),
          failed: parseInt(analytics.failed_count),
          cancelled: parseInt(analytics.cancelled_count)
        },
        period: period,
        generated_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching notification analytics:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch notification analytics' 
    });
  }
});

/**
 * Bulk operations on notifications
 * POST /api/notifications/bulk
 */
router.post('/bulk', authenticateToken, [
  body('action').isIn(['cancel', 'retry', 'delete']),
  body('notification_ids').isArray({ min: 1 }),
  body('notification_ids.*').isUUID()
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

    const { action, notification_ids } = req.body;
    const db = req.app.get('db') as Pool;

    let query = '';
    const results: any = { processed: 0, errors: [] };

    switch (action) {
      case 'cancel':
        query = `
          UPDATE notifications 
          SET status = 'cancelled', updated_at = NOW()
          WHERE id = ANY($1) AND status IN ('pending', 'failed')
        `;
        break;
        
      case 'retry':
        query = `
          UPDATE notifications 
          SET status = 'pending', failed_at = NULL, failure_reason = NULL, updated_at = NOW()
          WHERE id = ANY($1) AND status = 'failed' AND retry_count < max_retries
        `;
        break;
        
      case 'delete':
        query = `
          DELETE FROM notifications 
          WHERE id = ANY($1) AND status IN ('cancelled', 'delivered', 'failed')
        `;
        break;
    }

    const result = await db.query(query, [notification_ids]);
    results.processed = result.rowCount || 0;

    res.json({
      success: true,
      data: results,
      message: `Bulk ${action} operation completed successfully`
    });

  } catch (error) {
    console.error('Error in bulk notification operation:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to execute bulk operation' 
    });
  }
});

export default router;