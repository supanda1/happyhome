import { Request, Response } from 'express';
import pool from '../config/database';
import { ApiResponse } from '../models/types';

export class EngineerJobsController {
  static async getMyJobs(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const userId = user?.userId || user?.id;

      const engineerResult = await pool.query(
        'SELECT id, name FROM engineers WHERE user_id = $1 AND is_active = true',
        [userId],
      );

      if (engineerResult.rows.length === 0) {
        const response: ApiResponse<null> = { success: false, error: 'Engineer profile not found' };
        return res.status(404).json(response);
      }

      const engineerId = engineerResult.rows[0].id;

      const result = await pool.query(
        `SELECT
          oi.id,
          oi.order_id,
          oi.service_id,
          oi.service_name,
          oi.unit_price AS amount,
          oi.item_status AS status,
          oi.scheduled_date,
          oi.scheduled_time_slot,
          oi.item_notes AS special_instructions,
          oi.actual_start_time,
          oi.actual_end_time,
          oi.completion_notes,
          oi.created_at,
          oi.updated_at,
          o.customer_id,
          o.customer_name,
          o.customer_phone,
          o.customer_email,
          o.service_address,
          o.priority
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        WHERE oi.assigned_engineer_id = $1
        ORDER BY oi.scheduled_date ASC, oi.created_at DESC`,
        [engineerId],
      );

      const jobs = result.rows.map(row => ({
        id: row.id,
        order_id: row.order_id,
        service: {
          id: row.service_id,
          name: row.service_name,
          price: parseFloat(row.amount) || 0,
        },
        customer: {
          id: row.customer_id,
          name: row.customer_name,
          phone: row.customer_phone,
          email: row.customer_email,
        },
        location: row.service_address || {},
        scheduled_at: row.scheduled_date
          ? `${row.scheduled_date}T${row.scheduled_time_slot || '10:00'}:00`
          : null,
        status: row.status,
        priority: row.priority || 'medium',
        special_instructions: row.special_instructions,
        amount: parseFloat(row.amount) || 0,
        actual_start_time: row.actual_start_time,
        actual_end_time: row.actual_end_time,
        completion_notes: row.completion_notes,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }));

      const response: ApiResponse<typeof jobs> = { success: true, data: jobs };
      return res.json(response);
    } catch (error) {
      console.error('getMyJobs error:', error);
      const response: ApiResponse<null> = { success: false, error: 'Failed to fetch jobs' };
      return res.status(500).json(response);
    }
  }

  static async acceptJob(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const userId = user?.userId || user?.id;
      const { jobId } = req.params;

      const engineerResult = await pool.query(
        'SELECT id FROM engineers WHERE user_id = $1 AND is_active = true',
        [userId],
      );

      if (engineerResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Engineer profile not found' });
      }

      const engineerId = engineerResult.rows[0].id;

      const result = await pool.query(
        `UPDATE order_items
         SET item_status = 'confirmed', updated_at = NOW()
         WHERE id = $1 AND assigned_engineer_id = $2 AND item_status = 'scheduled'
         RETURNING id, item_status`,
        [jobId, engineerId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Job not found or cannot be accepted' });
      }

      return res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('acceptJob error:', error);
      return res.status(500).json({ success: false, error: 'Failed to accept job' });
    }
  }

  static async rejectJob(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const userId = user?.userId || user?.id;
      const { jobId } = req.params;

      const engineerResult = await pool.query(
        'SELECT id FROM engineers WHERE user_id = $1 AND is_active = true',
        [userId],
      );

      if (engineerResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Engineer profile not found' });
      }

      const engineerId = engineerResult.rows[0].id;

      await pool.query(
        `UPDATE order_items
         SET assigned_engineer_id = NULL, assigned_engineer_name = NULL,
             item_status = 'scheduled', updated_at = NOW()
         WHERE id = $1 AND assigned_engineer_id = $2`,
        [jobId, engineerId],
      );

      return res.json({ success: true, data: { id: jobId } });
    } catch (error) {
      console.error('rejectJob error:', error);
      return res.status(500).json({ success: false, error: 'Failed to reject job' });
    }
  }

  static async startJob(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const userId = user?.userId || user?.id;
      const { jobId } = req.params;

      const engineerResult = await pool.query(
        'SELECT id FROM engineers WHERE user_id = $1 AND is_active = true',
        [userId],
      );

      if (engineerResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Engineer profile not found' });
      }

      const engineerId = engineerResult.rows[0].id;

      const result = await pool.query(
        `UPDATE order_items
         SET item_status = 'in_progress',
             actual_start_time = NOW(),
             updated_at = NOW()
         WHERE id = $1 AND assigned_engineer_id = $2
           AND item_status IN ('scheduled', 'confirmed')
         RETURNING id, item_status, actual_start_time`,
        [jobId, engineerId],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Job not found or cannot be started' });
      }

      await pool.query(
        `UPDATE orders SET status = 'in_progress', updated_at = NOW()
         WHERE id = (SELECT order_id FROM order_items WHERE id = $1)
           AND status NOT IN ('completed', 'cancelled')`,
        [jobId],
      );

      return res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('startJob error:', error);
      return res.status(500).json({ success: false, error: 'Failed to start job' });
    }
  }

  static async completeJob(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const userId = user?.userId || user?.id;
      const { jobId } = req.params;
      const { completion_notes } = req.body;

      const engineerResult = await pool.query(
        'SELECT id FROM engineers WHERE user_id = $1 AND is_active = true',
        [userId],
      );

      if (engineerResult.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Engineer profile not found' });
      }

      const engineerId = engineerResult.rows[0].id;

      const result = await pool.query(
        `UPDATE order_items
         SET item_status = 'completed',
             actual_end_time = NOW(),
             completion_notes = $3,
             updated_at = NOW()
         WHERE id = $1 AND assigned_engineer_id = $2 AND item_status = 'in_progress'
         RETURNING id, item_status, actual_end_time`,
        [jobId, engineerId, completion_notes || ''],
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, error: 'Job not found or not in progress' });
      }

      const pendingItems = await pool.query(
        `SELECT COUNT(*) FROM order_items
         WHERE order_id = (SELECT order_id FROM order_items WHERE id = $1)
           AND item_status NOT IN ('completed', 'cancelled')`,
        [jobId],
      );

      if (parseInt(pendingItems.rows[0].count) === 0) {
        await pool.query(
          `UPDATE orders SET status = 'completed', completed_at = NOW(), updated_at = NOW()
           WHERE id = (SELECT order_id FROM order_items WHERE id = $1)`,
          [jobId],
        );
      }

      return res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      console.error('completeJob error:', error);
      return res.status(500).json({ success: false, error: 'Failed to complete job' });
    }
  }
}
