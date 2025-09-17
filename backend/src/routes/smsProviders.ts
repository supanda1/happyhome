import { Router, Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import pool from '../config/database';
import { requireAdminAuth } from '../middleware/auth';

const router = Router();

// Get all SMS providers
router.get('/', requireAdminAuth, async (req: Request, res: Response) => {
  try {
    const result = await pool.query(`
      SELECT 
        id,
        name,
        provider_type,
        description,
        is_enabled,
        is_primary,
        priority,
        daily_limit,
        rate_limit_per_minute,
        cost_per_sms,
        total_sent,
        total_failed,
        current_balance,
        last_used_at,
        created_at,
        updated_at,
        CASE 
          WHEN total_sent > 0 THEN 
            ROUND(((total_sent - total_failed)::DECIMAL / total_sent::DECIMAL) * 100, 2)
          ELSE 0 
        END as success_rate
      FROM sms_providers 
      ORDER BY priority ASC, name ASC
    `);

    // Mask sensitive configuration data
    const providers = result.rows.map(provider => ({
      ...provider,
      config_masked: true // Indicate that config is not included for security
    }));

    res.json({
      success: true,
      data: providers
    });
  } catch (error) {
    console.error('Error fetching SMS providers:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch SMS providers'
    });
  }
});

// Get specific SMS provider
router.get('/:id', requireAdminAuth, 
  param('id').isUUID().withMessage('Invalid provider ID'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    try {
      const result = await pool.query(`
        SELECT 
          id, name, provider_type, description, is_enabled, is_primary,
          priority, config_data, daily_limit, rate_limit_per_minute,
          cost_per_sms, total_sent, total_failed, current_balance,
          balance_updated_at, last_used_at, created_at, updated_at
        FROM sms_providers 
        WHERE id = $1
      `, [req.params.id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'SMS provider not found'
        });
      }

      const provider = result.rows[0];
      
      // Mask sensitive configuration data
      if (provider.config_data) {
        const sensitiveFields = ['api_key', 'auth_token', 'password', 'secret_key', 'hash_key'];
        const maskedConfig = { ...provider.config_data };
        
        sensitiveFields.forEach(field => {
          if (maskedConfig[field]) {
            const value = maskedConfig[field];
            maskedConfig[field] = value.length > 8 
              ? value.substring(0, 4) + '*'.repeat(value.length - 8) + value.substring(value.length - 4)
              : '*'.repeat(value.length);
          }
        });
        
        provider.config_data = maskedConfig;
      }

      res.json({
        success: true,
        data: provider
      });
    } catch (error) {
      console.error('Error fetching SMS provider:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch SMS provider'
      });
    }
  }
);

// Create new SMS provider
router.post('/', requireAdminAuth,
  [
    body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Name is required (max 100 chars)'),
    body('provider_type').isIn(['twilio', 'textlocal', 'teleo', 'aws_sns', 'mock']).withMessage('Invalid provider type'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
    body('is_enabled').optional().isBoolean().withMessage('is_enabled must be boolean'),
    body('is_primary').optional().isBoolean().withMessage('is_primary must be boolean'),
    body('priority').optional().isInt({ min: 1, max: 100 }).withMessage('Priority must be 1-100'),
    body('config_data').isObject().withMessage('Configuration data is required'),
    body('daily_limit').optional().isInt({ min: 1 }).withMessage('Daily limit must be positive'),
    body('rate_limit_per_minute').optional().isInt({ min: 1 }).withMessage('Rate limit must be positive'),
    body('cost_per_sms').optional().isFloat({ min: 0 }).withMessage('Cost must be non-negative')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      const {
        name, provider_type, description, is_enabled = false, is_primary = false,
        priority = 1, config_data, daily_limit, rate_limit_per_minute = 60,
        cost_per_sms
      } = req.body;

      // If setting as primary, unset other primary providers
      if (is_primary) {
        await client.query(`
          UPDATE sms_providers 
          SET is_primary = false, updated_at = NOW()
          WHERE is_primary = true
        `);
      }

      // Validate configuration based on provider type
      const configErrors = validateProviderConfig(provider_type, config_data);
      if (configErrors.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid configuration',
          details: configErrors
        });
      }

      const result = await client.query(`
        INSERT INTO sms_providers (
          name, provider_type, description, is_enabled, is_primary,
          priority, config_data, daily_limit, rate_limit_per_minute,
          cost_per_sms, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING id, name, provider_type, is_enabled, created_at
      `, [
        name, provider_type, description, is_enabled, is_primary,
        priority, JSON.stringify(config_data), daily_limit,
        rate_limit_per_minute, cost_per_sms, req.user?.email
      ]);

      await client.query('COMMIT');

      res.status(201).json({
        success: true,
        data: result.rows[0],
        message: 'SMS provider created successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating SMS provider:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create SMS provider'
      });
    } finally {
      client.release();
    }
  }
);

// Update SMS provider
router.put('/:id', requireAdminAuth,
  [
    param('id').isUUID().withMessage('Invalid provider ID'),
    body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Name max 100 chars'),
    body('description').optional().isLength({ max: 500 }).withMessage('Description too long'),
    body('is_enabled').optional().isBoolean().withMessage('is_enabled must be boolean'),
    body('is_primary').optional().isBoolean().withMessage('is_primary must be boolean'),
    body('priority').optional().isInt({ min: 1, max: 100 }).withMessage('Priority must be 1-100'),
    body('config_data').optional().isObject().withMessage('Configuration must be object'),
    body('daily_limit').optional().isInt({ min: 1 }).withMessage('Daily limit must be positive'),
    body('rate_limit_per_minute').optional().isInt({ min: 1 }).withMessage('Rate limit must be positive'),
    body('cost_per_sms').optional().isFloat({ min: 0 }).withMessage('Cost must be non-negative')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Check if provider exists
      const existingResult = await client.query(
        'SELECT id, provider_type FROM sms_providers WHERE id = $1',
        [req.params.id]
      );

      if (existingResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'SMS provider not found'
        });
      }

      const provider = existingResult.rows[0];
      const updates: string[] = [];
      const values: any[] = [];
      let valueIndex = 1;

      // Build dynamic update query
      Object.entries(req.body).forEach(([key, value]) => {
        if (key === 'config_data' && value) {
          // Validate configuration
          const configErrors = validateProviderConfig(provider.provider_type, value);
          if (configErrors.length > 0) {
            throw new Error(`Invalid configuration: ${configErrors.join(', ')}`);
          }
          updates.push(`${key} = $${valueIndex}`);
          values.push(JSON.stringify(value));
        } else if (['name', 'description', 'is_enabled', 'is_primary', 'priority', 
                   'daily_limit', 'rate_limit_per_minute', 'cost_per_sms'].includes(key)) {
          updates.push(`${key} = $${valueIndex}`);
          values.push(value);
        }
        valueIndex++;
      });

      if (updates.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No valid fields to update'
        });
      }

      // If setting as primary, unset other primary providers
      if (req.body.is_primary) {
        await client.query(`
          UPDATE sms_providers 
          SET is_primary = false, updated_at = NOW()
          WHERE is_primary = true AND id != $1
        `, [req.params.id]);
      }

      // Add updated metadata
      updates.push(`updated_at = NOW()`);
      updates.push(`updated_by = $${valueIndex}`);
      values.push(req.user?.email);
      values.push(req.params.id); // For WHERE clause

      const result = await client.query(`
        UPDATE sms_providers 
        SET ${updates.join(', ')}
        WHERE id = $${valueIndex + 1}
        RETURNING id, name, provider_type, is_enabled, is_primary, updated_at
      `, values);

      await client.query('COMMIT');

      res.json({
        success: true,
        data: result.rows[0],
        message: 'SMS provider updated successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error updating SMS provider:', error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update SMS provider'
      });
    } finally {
      client.release();
    }
  }
);

// Delete SMS provider
router.delete('/:id', requireAdminAuth,
  param('id').isUUID().withMessage('Invalid provider ID'),
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    try {
      const result = await pool.query(
        'DELETE FROM sms_providers WHERE id = $1 RETURNING id, name',
        [req.params.id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'SMS provider not found'
        });
      }

      res.json({
        success: true,
        message: `SMS provider "${result.rows[0].name}" deleted successfully`
      });
    } catch (error) {
      console.error('Error deleting SMS provider:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete SMS provider'
      });
    }
  }
);

// Test SMS provider
router.post('/:id/test', requireAdminAuth,
  [
    param('id').isUUID().withMessage('Invalid provider ID'),
    body('test_phone').isMobilePhone('any', { strictMode: false }).withMessage('Valid phone number required'),
    body('test_message').optional().isLength({ min: 1, max: 160 }).withMessage('Message 1-160 chars')
  ],
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    try {
      // Get provider configuration
      const result = await pool.query(`
        SELECT id, name, provider_type, config_data, is_enabled
        FROM sms_providers 
        WHERE id = $1
      `, [req.params.id]);

      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'SMS provider not found'
        });
      }

      const provider = result.rows[0];

      if (!provider.is_enabled) {
        return res.status(400).json({
          success: false,
          error: 'Provider is not enabled'
        });
      }

      const testMessage = req.body.test_message || 
        `Test SMS from Happy Homes admin panel. Provider: ${provider.name}. Time: ${new Date().toLocaleString()}`;

      // Here you would integrate with your SMS service to actually send the test
      // For now, we'll simulate the test
      res.json({
        success: true,
        message: 'Test SMS sent successfully',
        data: {
          provider_name: provider.name,
          provider_type: provider.provider_type,
          test_phone: req.body.test_phone,
          message: testMessage,
          timestamp: new Date().toISOString(),
          simulated: true // Remove this when real integration is complete
        }
      });
    } catch (error) {
      console.error('Error testing SMS provider:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to test SMS provider'
      });
    }
  }
);

// Get provider statistics
router.get('/:id/stats', requireAdminAuth,
  [
    param('id').isUUID().withMessage('Invalid provider ID'),
    query('days').optional().isInt({ min: 1, max: 90 }).withMessage('Days must be 1-90')
  ],
  async (req: Request, res: Response) => {
    try {
      const days = parseInt(req.query.days as string) || 30;
      
      const result = await pool.query(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as total_messages,
          COUNT(CASE WHEN status = 'sent' THEN 1 END) as sent_messages,
          COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_messages,
          COUNT(CASE WHEN status = 'delivered' THEN 1 END) as delivered_messages
        FROM notifications 
        WHERE provider_id = $1 
        AND created_at >= NOW() - INTERVAL '$2 days'
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `, [req.params.id, days]);

      res.json({
        success: true,
        data: result.rows
      });
    } catch (error) {
      console.error('Error fetching provider stats:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch provider statistics'
      });
    }
  }
);

// Validate provider configuration
function validateProviderConfig(providerType: string, config: any): string[] {
  const errors: string[] = [];

  switch (providerType) {
    case 'twilio':
      if (!config.account_sid) errors.push('Twilio Account SID is required');
      if (!config.auth_token) errors.push('Twilio Auth Token is required');
      if (!config.from_number) errors.push('Twilio From Number is required');
      break;

    case 'textlocal':
      if (!config.api_key) errors.push('TextLocal API Key is required');
      if (!config.sender) errors.push('TextLocal Sender ID is required');
      if (config.sender && config.sender.length > 6) {
        errors.push('TextLocal Sender ID must be 6 characters or less');
      }
      break;

    case 'teleo':
      if (!config.username) errors.push('Teleo Username is required');
      if (!config.password) errors.push('Teleo Password is required');
      if (!config.sender_id) errors.push('Teleo Sender ID is required');
      if (config.sender_id && config.sender_id.length > 6) {
        errors.push('Teleo Sender ID must be 6 characters or less');
      }
      break;

    case 'aws_sns':
      if (!config.access_key_id) errors.push('AWS Access Key ID is required');
      if (!config.secret_access_key) errors.push('AWS Secret Access Key is required');
      if (!config.region) errors.push('AWS Region is required');
      break;

    case 'mock':
      // Mock provider doesn't need validation
      break;

    default:
      errors.push('Invalid provider type');
  }

  return errors;
}

export default router;