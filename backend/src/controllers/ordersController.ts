import { Request, Response } from 'express';
import pool from '../config/database';
import { 
  Order, 
  OrderItem, 
  ApiResponse, 
  CreateOrderRequest, 
  UpdateOrderRequest,
  UpdateOrderItemRequest,
  AssignEngineerRequest
} from '../models/types';
import { v4 as uuidv4 } from 'uuid';

export class OrdersController {
  // Get all orders with optional filtering
  static async getAllOrders(req: Request, res: Response) {
    try {
      const { status, priority, limit, offset } = req.query;
      
      let query = `
        SELECT o.*, 
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', oi.id,
            'service_id', oi.service_id,
            'service_name', oi.service_name,
            'variant_id', oi.service_variant_id,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'service_description', oi.service_description,
            'customizations', oi.customizations,
            'assigned_engineer_id', oi.assigned_engineer_id,
            'assigned_engineer_name', oi.assigned_engineer_name,
            'item_status', oi.item_status,
            'scheduled_date', oi.scheduled_date,
            'scheduled_time_slot', oi.scheduled_time_slot,
            'completion_date', oi.completion_date,
            'item_notes', oi.item_notes,
            'item_rating', oi.item_rating,
            'item_review', oi.item_review,
            'created_at', oi.created_at
          )
        ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
      `;
      
      const conditions: string[] = [];
      const values: (string | number | boolean)[] = [];
      
      if (status && typeof status === 'string') {
        conditions.push(`o.status = $${values.length + 1}`);
        values.push(status);
      }
      
      if (priority && typeof priority === 'string') {
        conditions.push(`o.priority = $${values.length + 1}`);
        values.push(priority);
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ` GROUP BY o.id ORDER BY o.created_at DESC`;
      
      if (limit) {
        query += ` LIMIT $${values.length + 1}`;
        values.push(parseInt(limit as string));
      }
      
      if (offset) {
        query += ` OFFSET $${values.length + 1}`;
        values.push(parseInt(offset as string));
      }
      
      const result = await pool.query(query, values);
      
      const orders: Order[] = result.rows.map(row => ({
        ...row,
        items: row.items.filter((item: OrderItem) => item.id !== null) // Remove null items
      }));
      
      const response: ApiResponse<Order[]> = {
        success: true,
        data: orders,
        message: `Found ${orders.length} orders`
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error fetching orders:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch orders'
      };
      res.status(500).json(response);
    }
  }

  // Get current user's orders
  static async getUserOrders(req: Request, res: Response) {
    try {
      const user = (req as any).user;
      const userId = user?.userId || user?.id;
      
      console.log('🔍 DEBUG: getUserOrders - user object:', user);
      console.log('🔍 DEBUG: getUserOrders - extracted userId:', userId);
      
      if (!userId || userId === '') {
        console.log('❌ No valid userId found in user object');
        const response: ApiResponse<null> = {
          success: false,
          error: 'User not authenticated - invalid user ID'
        };
        return res.status(401).json(response);
      }

      const query = `
        SELECT o.*, 
        COALESCE(
          JSON_AGG(
            CASE 
              WHEN oi.id IS NOT NULL THEN 
                JSON_BUILD_OBJECT(
                  'id', oi.id,
                  'service_id', oi.service_id,
                  'service_name', COALESCE(oi.service_name, 'Service'),
                  'variant_id', oi.service_variant_id,
                  'variant_name', COALESCE(oi.service_name, 'Service'),
                  'quantity', COALESCE(oi.quantity, 1),
                  'unit_price', COALESCE(oi.unit_price, 0),
                  'total_price', COALESCE(oi.total_price, 0),
                  'assigned_engineer_id', oi.assigned_engineer_id,
                  'assigned_engineer_name', oi.assigned_engineer_name,
                  'item_status', COALESCE(oi.item_status, 'pending'),
                  'scheduled_date', oi.scheduled_date,
                  'scheduled_time_slot', oi.scheduled_time_slot,
                  'completion_date', oi.completion_date,
                  'item_notes', oi.item_notes,
                  'item_rating', oi.item_rating,
                  'item_review', oi.item_review,
                  'created_at', COALESCE(oi.created_at, o.created_at)
                )
              ELSE NULL
            END
          ) FILTER (WHERE oi.id IS NOT NULL), 
          '[]'::json
        ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.customer_id = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `;
      
      const result = await pool.query(query, [userId]);
      
      if (!result || !result.rows) {
        const response: ApiResponse<any[]> = {
          success: true,
          data: []
        };
        return res.json(response);
      }
      
      // Transform Order data to Booking format expected by frontend
      const bookings = result.rows.flatMap(order => {
        try {
          if (!order || !order.items || !Array.isArray(order.items) || order.items.length === 0) {
            // Return a basic order entry even if no items
            return [{
              id: order?.id || '',
              orderNumber: order?.order_number || `HH${(order?.id || '').slice(0, 3).toUpperCase()}`,
              userId: order?.customer_id || '',
              serviceId: null,
              scheduledDate: order?.created_at || new Date().toISOString(),
              timeSlot: { startTime: '09:00', endTime: '11:00', isAvailable: true },
              status: order?.status || 'pending',
              itemStatus: 'pending',
              items: [],
              totalAmount: parseFloat(order?.total_amount || '0'),
              discountAmount: parseFloat(order?.discount_amount || '0'),
              finalAmount: parseFloat(order?.final_amount || order?.total_amount || '0'),
              couponCode: null, // Coupon code not stored in orders table
              customerAddress: {
                street: 'Address not provided',
                city: 'City not specified',
                state: 'State not specified',
                zipCode: 'PIN not provided',
                landmark: ''
              },
              customerNotes: order?.notes || '',
              paymentStatus: order?.payment_status || 'pending',
              paymentMethod: order?.payment_method || null,
              paymentId: order?.transaction_id || null,
              transactionId: order?.transaction_id || null,
              completedAt: null,
              cancelledAt: null,
              cancellationReason: null,
              adminNotes: '',
              assignedTechnician: null,
              customerRating: order?.customer_rating || null,
              customerReview: order?.customer_review || null,
              createdAt: order?.created_at || new Date().toISOString(),
              updatedAt: order?.updated_at || new Date().toISOString(),
              service: {
                id: null,
                name: 'Service',
                description: '',
                basePrice: 0
              }
            }];
          }
          
          return order.items.map((item: any) => {
          // Handle date formatting properly
          const getValidDate = (dateValue: any, fallbackDate: any) => {
            // First try the provided date value
            if (dateValue) {
              if (dateValue instanceof Date) return dateValue.toISOString();
              if (typeof dateValue === 'string' && dateValue.trim() !== '') {
                const parsed = new Date(dateValue);
                if (!isNaN(parsed.getTime())) return parsed.toISOString();
              }
            }
            
            // Then try fallback date (order created_at)
            if (fallbackDate) {
              if (fallbackDate instanceof Date) return fallbackDate.toISOString();
              if (typeof fallbackDate === 'string') {
                const parsed = new Date(fallbackDate);
                if (!isNaN(parsed.getTime())) return parsed.toISOString();
              }
            }
            
            // Only use current date as last resort
            return new Date().toISOString();
          };

          // Handle address using the correct service_address field
          const getAddress = () => {
            // Use service_address from orders table (JSONB format)
            if (order.service_address) {
              const addr = order.service_address;
              
              // Build street from house_number and area
              const streetParts = [];
              if (addr.house_number) streetParts.push(addr.house_number);
              if (addr.area) streetParts.push(addr.area);
              
              return {
                street: streetParts.length > 0 ? streetParts.join(', ') : 'Address not provided',
                city: addr.city || 'City not specified',
                state: addr.state || 'State not specified',
                zipCode: addr.pincode || addr.zip_code || 'PIN not provided',
                landmark: addr.landmark || addr.area || ''
              };
            }
            
            // Fallback to default address
            return {
              street: 'Address not provided',
              city: 'City not specified', 
              state: 'State not specified',
              zipCode: 'PIN not provided',
              landmark: ''
            };
          };

          return {
            id: order.id,
            orderNumber: order.order_number || `HH${order.id.slice(0, 3).toUpperCase()}`,
            userId: order.customer_id,
            serviceId: item.service_id,
            scheduledDate: getValidDate(item.scheduled_date, order.created_at),
            timeSlot: {
              startTime: item.scheduled_time_slot?.split('-')[0] || '09:00',
              endTime: item.scheduled_time_slot?.split('-')[1] || '11:00', 
              isAvailable: true
            },
            // Preserve both status fields for unified status logic
            status: order.status || 'pending', // Order-level status
            itemStatus: item.item_status || 'pending', // Item-level status
            // Add order structure for unified status logic
            items: [{
              id: item.id,
              item_status: item.item_status,
              status: item.item_status
            }],
            totalAmount: parseFloat(item.total_price || order.total_amount || '0'),
            discountAmount: parseFloat(order.discount_amount || '0'),
            finalAmount: parseFloat(order.final_amount || item.total_price || order.total_amount || '0'),
            couponCode: null, // Coupon code not stored in orders table
            customerAddress: getAddress(),
          customerNotes: order.notes || item.item_notes || '',
          paymentStatus: order.payment_status || 'pending',
          paymentMethod: order.payment_method,
          paymentId: order.transaction_id,
          transactionId: order.transaction_id,
          completedAt: item.completion_date,
          cancelledAt: null,
          cancellationReason: null,
          adminNotes: item.item_notes || '',
          assignedTechnician: item.assigned_engineer_name || null,
          customerRating: order.customer_rating || null,
          customerReview: order.customer_review || null,
          createdAt: order.created_at,
          updatedAt: order.updated_at,
          service: {
            id: item.service_id,
            name: item.service_name || 'Service',
            description: item.variant_name || item.service_name || '',
            basePrice: parseFloat(item.unit_price || '0')
          }
        };
        });
      } catch (orderError) {
        console.error('Error processing order:', orderError, order);
        return []; // Skip this order if processing fails
      }
      });
      
      const response: ApiResponse<any[]> = {
        success: true,
        data: bookings
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching user orders:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch user orders'
      };
      res.status(500).json(response);
    }
  }

  // Get single order by ID
  static async getOrderById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const orderQuery = `
        SELECT o.*, 
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', oi.id,
            'service_id', oi.service_id,
            'service_name', oi.service_name,
            'variant_id', oi.service_variant_id,
            'variant_name', oi.service_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'assigned_engineer_id', oi.assigned_engineer_id,
            'assigned_engineer_name', oi.assigned_engineer_name,
            'item_status', oi.item_status,
            'scheduled_date', oi.scheduled_date,
            'scheduled_time_slot', oi.scheduled_time_slot,
            'completion_date', oi.completion_date,
            'item_notes', oi.item_notes,
            'item_rating', oi.item_rating,
            'item_review', oi.item_review,
            'created_at', oi.created_at
          )
        ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1
        GROUP BY o.id
      `;
      
      const result = await pool.query(orderQuery, [id]);
      
      if (result.rows.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Order not found'
        };
        return res.status(404).json(response);
      }
      
      const order: Order = {
        ...result.rows[0],
        items: result.rows[0].items.filter((item: OrderItem) => item.id !== null)
      };
      
      const response: ApiResponse<Order> = {
        success: true,
        data: order
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error fetching order:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch order'
      };
      res.status(500).json(response);
    }
  }

  // Create new order
  static async createOrder(req: Request, res: Response) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const orderData: CreateOrderRequest = req.body;
      const orderId = uuidv4();
      
      // Generate order number - HH + 8 digits (10 total)
      const countResult = await client.query('SELECT COUNT(*) FROM orders');
      const orderNumber = `HH${String(parseInt(countResult.rows[0].count) + 1).padStart(8, '0')}`;
      
      // Handle coupon application if provided
      let appliedCoupon = null;
      let calculatedDiscountAmount = orderData.discount_amount || 0;
      
      if (orderData.coupon_code) {
        try {
          // Validate coupon
          const couponResult = await client.query(`
            SELECT id, code, title, discount_type, discount_value, minimum_order_amount, 
                   maximum_discount_amount, usage_limit, usage_count, usage_limit_per_user,
                   first_time_users_only, is_active, valid_from, valid_until
            FROM coupons 
            WHERE code = $1 AND is_active = true 
            AND valid_from <= CURRENT_DATE AND valid_until >= CURRENT_DATE
          `, [orderData.coupon_code]);
          
          if (couponResult.rows.length === 0) {
            throw new Error('Invalid or expired coupon code');
          }
          
          const coupon = couponResult.rows[0];
          
          // Check minimum order amount
          if (orderData.total_amount < coupon.minimum_order_amount) {
            throw new Error(`Minimum order amount of ₹${coupon.minimum_order_amount} required for this coupon`);
          }
          
          // Check usage limits
          if (coupon.usage_limit && coupon.usage_count >= coupon.usage_limit) {
            throw new Error('Coupon usage limit exceeded');
          }
          
          // Check first-time user restriction
          if (coupon.first_time_users_only && orderData.customer_id) {
            const existingOrdersResult = await client.query(
              'SELECT COUNT(*) FROM orders WHERE customer_id = $1',
              [orderData.customer_id]
            );
            if (parseInt(existingOrdersResult.rows[0].count) > 0) {
              throw new Error('This coupon is only valid for first-time users');
            }
          }
          
          // Check per-user usage limit
          if (orderData.customer_id && coupon.usage_limit_per_user) {
            const userUsageResult = await client.query(
              'SELECT COUNT(*) FROM coupon_usages WHERE coupon_id = $1 AND user_id = $2',
              [coupon.id, orderData.customer_id]
            );
            if (parseInt(userUsageResult.rows[0].count) >= coupon.usage_limit_per_user) {
              throw new Error('You have already used this coupon the maximum number of times');
            }
          }
          
          // Calculate discount
          if (coupon.discount_type === 'percentage') {
            calculatedDiscountAmount = (orderData.total_amount * coupon.discount_value) / 100;
            if (coupon.maximum_discount_amount) {
              calculatedDiscountAmount = Math.min(calculatedDiscountAmount, coupon.maximum_discount_amount);
            }
          } else if (coupon.discount_type === 'fixed_amount') {
            calculatedDiscountAmount = Math.min(coupon.discount_value, orderData.total_amount);
          }
          
          appliedCoupon = coupon;
          
        } catch (couponError) {
          await client.query('ROLLBACK');
          return res.status(400).json({
            success: false,
            error: `Coupon validation failed: ${couponError instanceof Error ? couponError.message : 'Unknown error'}`
          });
        }
      }
      
      // Recalculate final amount with applied discount
      const finalCalculatedAmount = orderData.total_amount + (orderData.gst_amount || 0) + (orderData.service_charge || 0) - calculatedDiscountAmount;
      
      // Insert order
      const orderInsertQuery = `
        INSERT INTO orders (
          id, order_number, customer_id, customer_name, customer_phone, customer_email,
          service_address, total_amount, discount_amount, gst_amount, service_charge,
          final_amount, priority, notes, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
        RETURNING *
      `;
      
      const orderValues = [
        orderId,
        orderNumber,
        orderData.customer_id,
        orderData.customer_name,
        orderData.customer_phone,
        orderData.customer_email,
        JSON.stringify(orderData.service_address),
        orderData.total_amount,
        calculatedDiscountAmount, // Use calculated discount amount
        orderData.gst_amount,
        orderData.service_charge,
        finalCalculatedAmount, // Use calculated final amount
        orderData.priority || 'medium',
        orderData.notes,
        'pending'
      ];
      
      const orderResult = await client.query(orderInsertQuery, orderValues);
      
      // Insert order items
      const itemInsertQuery = `
        INSERT INTO order_items (
          id, order_id, service_id, service_name, variant_id, variant_name,
          quantity, unit_price, total_price, category_id, subcategory_id
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        RETURNING *
      `;
      
      const items: OrderItem[] = [];
      
      for (const item of orderData.items) {
        const itemId = uuidv4();
        const itemValues = [
          itemId,
          orderId,
          item.service_id,
          item.service_name || 'Service',
          item.variant_id || null,
          item.variant_name || null,
          item.quantity,
          item.unit_price,
          item.total_price,
          item.category_id || 'default-category',
          item.subcategory_id || 'default-subcategory'
        ];
        
        const itemResult = await client.query(itemInsertQuery, itemValues);
        items.push(itemResult.rows[0]);
      }
      
      // Record coupon usage if coupon was applied
      if (appliedCoupon && orderData.customer_id) {
        // Update coupon usage count
        await client.query(
          'UPDATE coupons SET usage_count = usage_count + 1, updated_at = NOW() WHERE id = $1',
          [appliedCoupon.id]
        );
        
        // Record usage in coupon_usages table
        await client.query(`
          INSERT INTO coupon_usages (coupon_id, user_id, order_id, discount_amount, used_at)
          VALUES ($1, $2, $3, $4, NOW())
        `, [
          appliedCoupon.id,
          orderData.customer_id,
          orderId,
          calculatedDiscountAmount
        ]);
      }
      
      await client.query('COMMIT');
      
      const order: Order = {
        ...orderResult.rows[0],
        service_address: typeof orderResult.rows[0].service_address === 'string' 
          ? JSON.parse(orderResult.rows[0].service_address) 
          : orderResult.rows[0].service_address,
        items
      };

      // Order created successfully - return order details for payment method selection
      console.log(`✅ Order ${orderNumber} created successfully, ready for payment`);
      console.log('🔍 DEBUG: Order object fields:', Object.keys(order));
      console.log('🔍 DEBUG: Order number from DB:', order.order_number);
      console.log('🔍 DEBUG: Complete order object:', JSON.stringify(order, null, 2));
      
      const response: ApiResponse<any> = {
        success: true,
        data: {
          order: order,
          requires_payment: true,
          payment_options: {
            methods: ['credit_card', 'debit_card', 'net_banking', 'upi', 'wallet'],
            gateway: 'ICICI',
            amount: order.final_amount
          }
        },
        message: `Order ${orderNumber} created successfully. Please select payment method to proceed.`
      };
      
      res.status(201).json(response);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error creating order:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to create order'
      };
      res.status(500).json(response);
    } finally {
      client.release();
    }
  }

  // Update order
  static async updateOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const updates: UpdateOrderRequest = req.body;
      
      const updateFields: string[] = [];
      const values: (string | number | boolean)[] = [];
      let valueIndex = 1;
      
      if (updates.status) {
        updateFields.push(`status = $${valueIndex}`);
        values.push(updates.status);
        valueIndex++;
      }
      
      if (updates.priority) {
        updateFields.push(`priority = $${valueIndex}`);
        values.push(updates.priority);
        valueIndex++;
      }
      
      if (updates.admin_notes) {
        updateFields.push(`special_instructions = $${valueIndex}`);
        values.push(updates.admin_notes);
        valueIndex++;
      }
      
      if (updates.customer_rating) {
        updateFields.push(`customer_rating = $${valueIndex}`);
        values.push(updates.customer_rating);
        valueIndex++;
      }
      
      if (updates.customer_review) {
        updateFields.push(`customer_review = $${valueIndex}`);
        values.push(updates.customer_review);
        valueIndex++;
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(id);
      
      const query = `
        UPDATE orders 
        SET ${updateFields.join(', ')}
        WHERE id = $${valueIndex}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Order not found'
        };
        return res.status(404).json(response);
      }
      
      const response: ApiResponse<Order> = {
        success: true,
        data: result.rows[0],
        message: 'Order updated successfully'
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error updating order:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to update order'
      };
      res.status(500).json(response);
    }
  }

  // Update order item
  static async updateOrderItem(req: Request, res: Response) {
    try {
      const { orderId, itemId } = req.params;
      const updates: UpdateOrderItemRequest = req.body;
      
      const updateFields: string[] = [];
      const values: (string | number | boolean)[] = [];
      let valueIndex = 1;
      
      if (updates.assigned_engineer_id) {
        // Get engineer details (handle both UUID and string IDs)
        const engineerResult = await pool.query('SELECT id, name FROM employees WHERE (id::text = $1 OR employee_id = $1)', [updates.assigned_engineer_id]);
        if (engineerResult.rows.length > 0) {
          const engineer = engineerResult.rows[0];
          
          updateFields.push(`assigned_engineer_id = $${valueIndex}`);
          values.push(engineer.id); // Use actual database UUID
          valueIndex++;
          
          // Truncate engineer name to fit database constraints
          const truncatedName = engineer.name.length > 20 ? engineer.name.substring(0, 20) : engineer.name;
          updateFields.push(`assigned_engineer_name = $${valueIndex}`);
          values.push(truncatedName);
          valueIndex++;
        }
      }
      
      if (updates.item_status) {
        updateFields.push(`item_status = $${valueIndex}`);
        values.push(updates.item_status);
        valueIndex++;
        
        // Supports all order_status enum values: pending, confirmed, scheduled, in_progress, completed, postponed, cancelled
      }
      
      if (updates.scheduled_date) {
        updateFields.push(`scheduled_date = $${valueIndex}`);
        values.push(updates.scheduled_date);
        valueIndex++;
      }
      
      if (updates.scheduled_time_slot) {
        updateFields.push(`scheduled_time_slot = $${valueIndex}`);
        values.push(updates.scheduled_time_slot);
        valueIndex++;
      }
      
      if (updates.item_notes) {
        updateFields.push(`item_notes = $${valueIndex}`);
        values.push(updates.item_notes);
        valueIndex++;
      }
      
      if (updates.item_rating) {
        updateFields.push(`item_rating = $${valueIndex}`);
        values.push(updates.item_rating);
        valueIndex++;
      }
      
      if (updates.item_review) {
        updateFields.push(`item_review = $${valueIndex}`);
        values.push(updates.item_review);
        valueIndex++;
      }
      
      values.push(itemId, orderId);
      
      const query = `
        UPDATE order_items 
        SET ${updateFields.join(', ')}
        WHERE id = $${valueIndex} AND order_id = $${valueIndex + 1}
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Order item not found'
        };
        return res.status(404).json(response);
      }

      // Check if we need to update overall order status when item status changes
      if (updates.item_status) {
        const client = await pool.connect();
        try {
          await client.query('BEGIN');
          
          // Get all items in the order to check overall completion status
          const orderItemsResult = await client.query(`
            SELECT 
              COUNT(*) as total_items,
              COUNT(CASE WHEN item_status = 'completed' THEN 1 END) as completed_items,
              COUNT(CASE WHEN item_status = 'in_progress' THEN 1 END) as in_progress_items,
              COUNT(CASE WHEN item_status = 'scheduled' THEN 1 END) as scheduled_items,
              COUNT(CASE WHEN item_status = 'cancelled' THEN 1 END) as cancelled_items
            FROM order_items 
            WHERE order_id = $1
          `, [orderId]);
          
          const stats = orderItemsResult.rows[0];
          const totalItems = parseInt(stats.total_items);
          const completedItems = parseInt(stats.completed_items);
          const inProgressItems = parseInt(stats.in_progress_items);
          const scheduledItems = parseInt(stats.scheduled_items);
          const cancelledItems = parseInt(stats.cancelled_items);
          
          let newOrderStatus = null;
          let statusMessage = '';
          
          // Determine new order status based on item statuses
          if (completedItems === totalItems) {
            // All items completed - mark order as completed
            newOrderStatus = 'completed';
            statusMessage = `All ${totalItems} items completed - Order completed`;
          } else if (inProgressItems > 0) {
            // At least one item is in progress - mark order as in_progress
            newOrderStatus = 'in_progress';
            statusMessage = `${inProgressItems} items in progress - Order in progress`;
          } else if (scheduledItems > 0) {
            // Items are scheduled but none in progress - keep as scheduled
            newOrderStatus = 'scheduled';
            statusMessage = `${scheduledItems} items scheduled - Order scheduled`;
          } else if (cancelledItems === totalItems) {
            // All items cancelled - mark order as cancelled
            newOrderStatus = 'cancelled';
            statusMessage = `All ${totalItems} items cancelled - Order cancelled`;
          }
          
          // Update order status if it changed
          if (newOrderStatus) {
            const currentOrderResult = await client.query('SELECT status FROM orders WHERE id = $1', [orderId]);
            const currentStatus = currentOrderResult.rows[0]?.status;
            
            if (currentStatus !== newOrderStatus) {
              const orderNote = `\n[${new Date().toISOString().substring(0, 10)}] ${statusMessage}`;
              
              await client.query(`
                UPDATE orders 
                SET status = $1, 
                    special_instructions = COALESCE(special_instructions, '') || $2,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $3
              `, [newOrderStatus, orderNote, orderId]);
              
              console.log(`✅ Order ${orderId} status automatically updated from '${currentStatus}' to '${newOrderStatus}' - ${statusMessage}`);
            }
          }
          
          await client.query('COMMIT');
        } catch (error) {
          await client.query('ROLLBACK');
          console.error('Error updating order status:', error);
        } finally {
          client.release();
        }
      }
      
      const response: ApiResponse<OrderItem> = {
        success: true,
        data: result.rows[0],
        message: 'Order item updated successfully'
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error updating order item:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to update order item'
      };
      res.status(500).json(response);
    }
  }

  // Assign engineer to order item with enhanced validation and tracking
  static async assignEngineer(req: Request, res: Response) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { orderId, itemId } = req.params;
      const { engineer_id, notes, scheduled_date, scheduled_time_slot }: AssignEngineerRequest = req.body;
      
      // Validate order exists and is in confirmed state
      const orderResult = await client.query(
        'SELECT status FROM orders WHERE id = $1',
        [orderId]
      );
      
      if (orderResult.rows.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Order not found'
        };
        await client.query('ROLLBACK');
        return res.status(404).json(response);
      }
      
      const orderStatus = orderResult.rows[0].status;
      if (orderStatus !== 'confirmed' && orderStatus !== 'scheduled') {
        const response: ApiResponse<null> = {
          success: false,
          error: `Cannot assign engineers to order in '${orderStatus}' status. Order must be in 'confirmed' or 'scheduled' status.`
        };
        await client.query('ROLLBACK');
        return res.status(400).json(response);
      }

      // Validate order item exists and get category info
      const itemResult = await client.query(
        'SELECT * FROM order_items WHERE id = $1 AND order_id = $2',
        [itemId, orderId]
      );
      
      if (itemResult.rows.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Order item not found'
        };
        await client.query('ROLLBACK');
        return res.status(404).json(response);
      }
      
      const orderItem = itemResult.rows[0];
      
      // Check if item is already assigned
      if (orderItem.assigned_engineer_id && orderItem.assigned_engineer_id !== engineer_id) {
        // Item being reassigned to new engineer
      }
      
      // Get engineer details with expertise validation
      // Handle both UUID and string-based employee IDs (for localStorage compatibility)
      const engineerResult = await client.query(`
        SELECT e.id, e.name, e.expertise, e.phone, e.email,
               COUNT(oi.id) as current_assignments
        FROM employees e
        LEFT JOIN order_items oi ON e.id = oi.assigned_engineer_id 
                                  AND oi.item_status = 'scheduled'
        WHERE (e.id::text = $1 OR e.employee_id = $1) AND e.is_active = true
        GROUP BY e.id, e.name, e.expertise, e.phone, e.email
      `, [engineer_id]);
      
      if (engineerResult.rows.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Engineer not found or inactive'
        };
        await client.query('ROLLBACK');
        return res.status(404).json(response);
      }
      
      const engineer = engineerResult.rows[0];
      
      // Check engineer workload (warn if over 5 active assignments)
      const currentLoad = parseInt(engineer.current_assignments);
      let workloadWarning = '';
      if (currentLoad >= 5) {
        workloadWarning = ` (Warning: Engineer has ${currentLoad} active assignments)`;
      }
      
      // Enhanced expertise matching for category (supports multiple expertise areas)
      const categoryResult = await client.query(
        'SELECT name FROM service_categories WHERE id = $1',
        [orderItem.category_id]
      );
      
      let expertiseMatch = false;
      let expertiseWarning = '';
      
      if (categoryResult.rows.length > 0) {
        const categoryName = categoryResult.rows[0].name.toLowerCase();
        const engineerExpertise = engineer.expert ? engineer.expert.toLowerCase() : '';
        const expertiseAreas = engineer.expertise_areas || [];
        
        // Enhanced expertise matching logic aligned with actual service categories and subcategories
        const expertiseMap: { [key: string]: string[] } = {
          'plumbing': [
            'bath fittings', 'basin & drainage', 'grouting & sealing', 'toilet installation',
            'pipe & connector', 'water tank services', 'general plumbing', 'plumbing', 'plumber'
          ],
          'electrical': [
            'wiring & installation', 'appliance repair', 'switch & socket', 'fan installation',
            'lighting solutions', 'electrical safety', 'general electrical', 'electrical', 'electrician'
          ],
          'cleaning': [
            'bathroom cleaning', 'ac cleaning', 'water tank cleaning', 'septic tank cleaning',
            'water purifier cleaning', 'car wash', 'general cleaning', 'cleaning', 'cleaner'
          ],
          'call a service': [
            'courier services', 'cab booking', 'vehicle breakdown', 'photography', 'logistics',
            'transport', 'delivery', 'call a service'
          ],
          'finance & insurance': [
            'gst services', 'pan card services', 'itr filing', 'legal documentation',
            'financial services', 'finance', 'insurance', 'accounting'
          ],
          'personal care': [
            'medicine delivery', 'beauty & salon', 'health services', 'personal care',
            'healthcare', 'medical', 'beauty'
          ],
          'civil work': [
            'house painting', 'tile & marble work', 'house repair', 'construction',
            'civil engineering', 'civil work', 'painting', 'masonry', 'carpentry'
          ]
        };
        
        const expectedExpertise = expertiseMap[categoryName] || [];
        
        // Check both new expertise_areas and legacy expert field
        const allExpertise = [...expertiseAreas.map((area: string) => area.toLowerCase()), engineerExpertise].filter(Boolean);
        expertiseMatch = expectedExpertise.some(exp => 
          allExpertise.some(userExp => userExp.includes(exp) || exp.includes(userExp))
        );
        
        if (!expertiseMatch) {
          const displayExpertise = expertiseAreas.length > 0 ? expertiseAreas.join(', ') : engineer.expert;
          expertiseWarning = ` (Note: Engineer expertise '${displayExpertise}' may not match service category '${categoryResult.rows[0].name}')`;
        }
      }
      
      // Build assignment update with proper data formatting
      const assignmentNote = notes || `\n[${new Date().toISOString().substring(0, 10)}] Assigned to ${engineer.name}\nAdmin: Manually assigned by admin`;
      
      // Format scheduled_date properly (database expects YYYY-MM-DD format, not ISO timestamp)
      let formattedScheduledDate = null;
      if (scheduled_date) {
        // If it's already a date string, extract just the date part
        if (scheduled_date.includes('T')) {
          formattedScheduledDate = scheduled_date.substring(0, 10);
        } else {
          formattedScheduledDate = scheduled_date;
        }
      }
      
      
      // Update order item with engineer assignment
      const updateQuery = `
        UPDATE order_items 
        SET assigned_engineer_id = $1, assigned_engineer_name = $2, item_status = $3, scheduled_date = $4, scheduled_time_slot = $5, item_notes = $6
        WHERE id = $7 AND order_id = $8
        RETURNING *
      `;
      
      const updateValues = [
        engineer.id,
        engineer.name,
        'scheduled', // Set status to scheduled after assignment
        formattedScheduledDate,
        scheduled_time_slot, // Include the time slot from request
        assignmentNote,
        itemId,
        orderId
      ];
      
      
      const result = await client.query(updateQuery, updateValues);
      
      // Update overall order status if needed
      const orderItemsResult = await client.query(
        'SELECT COUNT(*) as total, COUNT(assigned_engineer_id) as assigned FROM order_items WHERE order_id = $1',
        [orderId]
      );
      
      const { total, assigned } = orderItemsResult.rows[0];
      
      if (parseInt(assigned) === parseInt(total)) {
        // All items are assigned, update order status
        const orderNote = `\n[${new Date().toISOString().substring(0, 10)}] All items assigned - Order scheduled`;
        await client.query(
          'UPDATE orders SET status = $1, special_instructions = COALESCE(special_instructions, \'\') || $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
          ['scheduled', orderNote, orderId] // Set order status to scheduled when all items assigned
        );
      }
      
      await client.query('COMMIT');
      
      const response: ApiResponse<Record<string, unknown>> = {
        success: true,
        data: {
          ...result.rows[0],
          engineer_details: {
            id: engineer.id,
            name: engineer.name,
            expertise: engineer.expert,
            phone: engineer.phone,
            current_workload: currentLoad
          },
          assignment_info: {
            expertise_match: expertiseMatch,
            is_reassignment: !!orderItem.assigned_engineer_id,
            previous_engineer: orderItem.assigned_engineer_name
          }
        },
        message: `Engineer ${engineer.name} ${orderItem.assigned_engineer_id ? 'reassigned' : 'assigned'} successfully${expertiseWarning}${workloadWarning}`
      };
      
      res.json(response);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error assigning engineer:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to assign engineer'
      };
      res.status(500).json(response);
    } finally {
      client.release();
    }
  }

  // Bulk assign engineers to multiple items
  static async bulkAssignEngineers(req: Request, res: Response) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { assignments }: { assignments: Array<{orderId: string, itemId: string, engineer_id: string, notes?: string}> } = req.body;
      
      if (!assignments || assignments.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'No assignments provided'
        };
        await client.query('ROLLBACK');
        return res.status(400).json(response);
      }
      
      const results: Array<{orderId: string, itemId: string, engineer: string, success: boolean}> = [];
      const errors: Array<{orderId: string, itemId: string | null, error: string}> = [];
      
      // First validate all orders are in confirmed status
      const uniqueOrderIds = [...new Set(assignments.map(a => a.orderId))];
      for (const orderId of uniqueOrderIds) {
        const orderResult = await client.query('SELECT status FROM orders WHERE id = $1', [orderId]);
        if (orderResult.rows.length === 0) {
          errors.push({
            orderId: orderId,
            itemId: null,
            error: 'Order not found'
          });
          continue;
        }
        
        const orderStatus = orderResult.rows[0].status;
        if (orderStatus !== 'confirmed' && orderStatus !== 'scheduled') {
          // Mark all assignments for this order as failed
          const failedAssignments = assignments.filter(a => a.orderId === orderId);
          failedAssignments.forEach(assignment => {
            errors.push({
              orderId: assignment.orderId,
              itemId: assignment.itemId,
              error: `Cannot assign engineers to order in '${orderStatus}' status. Order must be in 'confirmed' or 'scheduled' status.`
            });
          });
          continue;
        }
      }
      
      // Filter out assignments for failed orders
      const validAssignments = assignments.filter(a => 
        !errors.some(e => e.orderId === a.orderId)
      );
      
      for (const assignment of validAssignments) {
        try {
          // Validate engineer exists and is active (handle both UUID and string IDs)
          const engineerResult = await client.query(
            'SELECT id, name, expert FROM employees WHERE (id::text = $1 OR employee_id = $1) AND is_active = true',
            [assignment.engineer_id]
          );
          
          if (engineerResult.rows.length === 0) {
            errors.push({
              orderId: assignment.orderId,
              itemId: assignment.itemId,
              error: 'Engineer not found or inactive'
            });
            continue;
          }
          
          const engineer = engineerResult.rows[0];
          
          // Truncate engineer name to fit database constraints
          const truncatedName = engineer.name.length > 20 ? engineer.name.substring(0, 20) : engineer.name;
          const shortNote = `\n[${new Date().toISOString().substring(0, 10)}] Bulk assigned to ${truncatedName}`;
          
          // Update order item (use actual database UUID)
          const updateResult = await client.query(`
            UPDATE order_items 
            SET assigned_engineer_id = $1, 
                assigned_engineer_name = $2,
                item_status = 'scheduled',
                item_notes = COALESCE(item_notes, '') || $3
            WHERE id = $4 AND order_id = $5
            RETURNING *
          `, [
            engineer.id, // Use actual database UUID
            truncatedName,
            shortNote,
            assignment.itemId,
            assignment.orderId
          ]);
          
          if (updateResult.rows.length > 0) {
            results.push({
              orderId: assignment.orderId,
              itemId: assignment.itemId,
              engineer: engineer.name,
              success: true
            });
          } else {
            errors.push({
              orderId: assignment.orderId,
              itemId: assignment.itemId,
              error: 'Order item not found'
            });
          }
          
        } catch {
          errors.push({
            orderId: assignment.orderId,
            itemId: assignment.itemId,
            error: 'Failed to assign engineer'
          });
        }
      }
      
      await client.query('COMMIT');
      
      const response: ApiResponse<{ successful_assignments: number; failed_assignments: number; results: unknown[]; errors: unknown[] }> = {
        success: errors.length === 0,
        data: {
          successful_assignments: results.length,
          failed_assignments: errors.length,
          results,
          errors
        },
        message: `Bulk assignment completed: ${results.length} successful, ${errors.length} failed`
      };
      
      res.json(response);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in bulk assignment:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to process bulk assignment'
      };
      res.status(500).json(response);
    } finally {
      client.release();
    }
  }

  // Get complete order timeline/history
  static async getAssignmentHistory(req: Request, res: Response) {
    try {
      const { orderId, itemId } = req.params;
      
      if (!orderId) {
        return res.status(400).json({
          success: false,
          error: 'Order ID is required'
        });
      }

      // Get order details (orders table already has customer info)
      const orderQuery = `
        SELECT *
        FROM orders o
        WHERE o.id = $1
      `;
      const orderResult = await pool.query(orderQuery, [orderId]);

      if (orderResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }

      const order = orderResult.rows[0];

      // Get order items with assignment details
      const itemsQuery = `
        SELECT oi.*, s.name as service_name, sc.name as category_name,
               e.name as engineer_name, e.phone as engineer_phone
        FROM order_items oi
        LEFT JOIN services s ON oi.service_id = s.id
        LEFT JOIN service_categories sc ON oi.category_id = sc.id
        LEFT JOIN employees e ON oi.assigned_engineer_id = e.id
        WHERE oi.order_id = $1
        ORDER BY oi.created_at ASC
      `;
      const itemsResult = await pool.query(itemsQuery, [orderId]);

      // Build timeline events
      const timeline = [];

      // 1. Order Created
      timeline.push({
        timestamp: order.created_at,
        event_type: 'order_created',
        title: 'Order Created',
        description: `Order #${order.order_number} created by ${order.customer_name}`,
        details: {
          order_number: order.order_number,
          customer: order.customer_name,
          email: order.customer_email,
          total_amount: order.final_amount,
          items_count: itemsResult.rows.length
        }
      });

      // 2. Order Status Changes
      if (order.status !== 'pending') {
        const statusTimestamp = order.updated_at || order.created_at;
        let statusDescription = '';
        
        // Simplified status logic - only 'pending' status exists
        statusDescription = order.status === 'pending' 
          ? 'Order is pending' 
          : `Order status: ${order.status}`;

        timeline.push({
          timestamp: statusTimestamp,
          event_type: 'status_change',
          title: `Order ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}`,
          description: statusDescription,
          details: {
            status: order.status,
            priority: order.priority
          }
        });
      }

      // 3. Item-level events (assignments, scheduling, completion)
      for (const item of itemsResult.rows) {
        // Engineer Assignment
        if (item.assigned_engineer_id) {
          timeline.push({
            timestamp: item.created_at, // Approximate assignment time
            event_type: 'engineer_assigned',
            title: 'Engineer Assigned',
            description: `${item.engineer_name} assigned to ${item.service_name}`,
            details: {
              service: item.service_name,
              category: item.category_name,
              engineer: item.engineer_name,
              engineer_phone: item.engineer_phone,
              quantity: item.quantity,
              price: item.total_price
            }
          });
        }

        // Scheduling
        if (item.scheduled_date) {
          const scheduleDescription = item.scheduled_time_slot 
            ? `${item.service_name} scheduled for ${item.scheduled_date} at ${item.scheduled_time_slot}`
            : `${item.service_name} scheduled for ${item.scheduled_date}`;

          timeline.push({
            timestamp: item.created_at, // Approximate scheduling time
            event_type: 'service_scheduled',
            title: 'Service Scheduled',
            description: scheduleDescription,
            details: {
              service: item.service_name,
              engineer: item.engineer_name,
              scheduled_date: item.scheduled_date,
              time_slot: item.scheduled_time_slot,
              status: item.item_status
            }
          });
        }

        // Item completion logic removed - only 'pending' status exists
      }

      // Sort timeline by timestamp
      timeline.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

      // Add order summary
      const summary = {
        order_number: order.order_number,
        customer: {
          name: order.customer_name,
          email: order.customer_email,
          phone: order.customer_phone
        },
        status: order.status,
        created_at: order.created_at,
        updated_at: order.updated_at,
        total_amount: order.final_amount,
        items_count: itemsResult.rows.length,
        assigned_items: itemsResult.rows.filter(item => item.assigned_engineer_id).length,
        completed_items: 0 // Always 0 since only 'pending' status exists
      };

      const response: ApiResponse<{summary: any, timeline: any[]}> = {
        success: true,
        data: {
          summary,
          timeline
        },
        message: 'Order history retrieved successfully'
      };

      res.json(response);
      
    } catch (error) {
      console.error('Error fetching order history:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: `Failed to fetch order history: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
      res.status(500).json(response);
    }
  }

  // Internal method for auto-assignment (used by admin after confirming order)
  static async performAutoAssignment(orderId: string): Promise<{ assigned: number; failed: number }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Check if order is in confirmed status
      const orderResult = await client.query('SELECT status FROM orders WHERE id = $1', [orderId]);
      if (orderResult.rows.length === 0) {
        await client.query('ROLLBACK');
        throw new Error('Order not found');
      }
      
      const orderStatus = orderResult.rows[0].status;
      if (orderStatus !== 'confirmed' && orderStatus !== 'scheduled') {
        await client.query('ROLLBACK');
        throw new Error(`Cannot auto-assign engineers to order in '${orderStatus}' status. Order must be in 'confirmed' or 'scheduled' status.`);
      }
      
      // Get unassigned items for the confirmed or scheduled order
      const unassignedItems = await client.query(`
        SELECT oi.*, s.category_id, s.subcategory_id, sc.name as category_name
        FROM order_items oi
        LEFT JOIN services s ON oi.service_id = s.id
        LEFT JOIN service_categories sc ON s.category_id = sc.id
        WHERE oi.order_id = $1 AND oi.assigned_engineer_id IS NULL
      `, [orderId]);
      
      if (unassignedItems.rows.length === 0) {
        await client.query('ROLLBACK');
        return { assigned: 0, failed: 0 };
      }
      
      const assignments = [];
      const failures = [];
      
      for (const item of unassignedItems.rows) {
        try {
          
          // Enhanced flexible matching for engineer expertise
          // This handles variations like "Wiring & Installation" vs "Electric Wiring and installation"
          const engineerResult = await client.query(`
            SELECT e.id, e.name, e.expertise,
                   COUNT(oi.id) as current_load,
                   CASE
                     
                     -- DOMAIN-SPECIFIC matching (highest priority for expertise matching)
                     -- Plumbing domain keywords (MUST have plumbing expertise)
                     WHEN (
                       (LOWER($1) LIKE '%plumb%' OR LOWER($1) LIKE '%pipe%' OR LOWER($1) LIKE '%drain%' OR LOWER($1) LIKE '%water%' OR
                        LOWER($1) LIKE '%bath%' OR LOWER($1) LIKE '%basin%' OR LOWER($1) LIKE '%toilet%' OR LOWER($1) LIKE '%faucet%' OR
                        LOWER($1) LIKE '%fitting%' OR LOWER($1) LIKE '%tap%' OR LOWER($1) LIKE '%sink%' OR LOWER($1) LIKE '%shower%') AND
                       (LOWER(e.expertise::text) LIKE '%plumb%' OR LOWER(e.expertise::text) LIKE '%pipe%' OR LOWER(e.expertise::text) LIKE '%drain%' OR
                        LOWER(e.expertise::text) LIKE '%bath%' OR LOWER(e.expertise::text) LIKE '%fitting%')
                     ) THEN 9
                     
                     -- Electrical domain keywords (MUST have electrical expertise)
                     WHEN (
                       (LOWER($1) LIKE '%electric%' OR LOWER($1) LIKE '%wiring%' OR LOWER($1) LIKE '%electrical%' OR
                        LOWER($1) LIKE '%switch%' OR LOWER($1) LIKE '%socket%' OR LOWER($1) LIKE '%lighting%' OR LOWER($1) LIKE '%fan%') AND
                       (LOWER(e.expertise::text) LIKE '%electric%' OR LOWER(e.expertise::text) LIKE '%wiring%' OR LOWER(e.expertise::text) LIKE '%electrical%')
                     ) THEN 9
                     
                     -- Cleaning domain keywords (MUST have cleaning expertise)
                     WHEN (
                       (LOWER($1) LIKE '%clean%' OR LOWER($1) LIKE '%wash%' OR LOWER($1) LIKE '%septic%' OR LOWER($1) LIKE '%ac clean%') AND
                       (LOWER(e.expertise::text) LIKE '%clean%' OR LOWER(e.expertise::text) LIKE '%wash%')
                     ) THEN 9
                     
                     -- Generic installation/repair matching (LOWER PRIORITY - only when no domain expert available)
                     WHEN (
                       (LOWER($1) LIKE '%install%' OR LOWER($1) LIKE '%repair%' OR LOWER($1) LIKE '%fix%') AND
                       (LOWER(e.expertise::text) LIKE '%install%' OR LOWER(e.expertise::text) LIKE '%repair%' OR LOWER(e.expertise::text) LIKE '%fix%')
                     ) THEN 6
                     
                     -- Category name partial match (broader)
                     WHEN LOWER(e.expertise::text) LIKE '%' || LOWER($2) || '%' THEN 5
                     
                     -- Fallback: any active engineer gets minimal score (ONLY if no domain expert available)
                     ELSE 1
                   END as expertise_score
            FROM employees e
            LEFT JOIN order_items oi ON e.id = oi.assigned_engineer_id 
                                      AND oi.item_status = 'pending'
            WHERE e.is_active = true
            GROUP BY e.id, e.name, e.expertise
            ORDER BY expertise_score DESC, current_load ASC, e.name ASC
            LIMIT 1
          `, [
            item.service_name,                    // $1 - service name for all domain matching  
            item.category_name || ''              // $2 - category name for partial match
          ]);
          
          
          if (engineerResult.rows.length === 0) {
            console.warn(`❌ No engineers found for service: ${item.service_name} (Category: ${item.category_name})`);
            failures.push({
              itemId: item.id,
              service_name: item.service_name,
              reason: 'No available engineers found'
            });
            continue;
          }
          
          const engineer = engineerResult.rows[0];
          const expertiseScore = parseInt(engineer.expertise_score);
          
          // Prevent cross-domain assignments by requiring minimum expertise score
          if (expertiseScore < 4) {
            console.warn(`❌ Engineer ${engineer.name} has insufficient expertise for ${item.service_name} (Score: ${expertiseScore})`);
            console.warn(`🔍 Service requires domain expertise, but engineer only matches general criteria`);
            failures.push({
              itemId: item.id,
              service_name: item.service_name,
              reason: `No qualified engineers found (best candidate: ${engineer.name}, score: ${expertiseScore})`
            });
            continue;
          }
          
          // Assign engineer
          
          // Truncate engineer name and create short note to fit database constraints
          const truncatedName = engineer.name.length > 20 ? engineer.name.substring(0, 20) : engineer.name;
          const shortNote = `\n[${new Date().toISOString().substring(0, 10)}] Auto-assigned to ${truncatedName} (load: ${engineer.current_load})`;
          
          // Set default scheduled date (tomorrow) and time slot for auto-assigned items
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          const defaultScheduledDate = tomorrow.toISOString().substring(0, 10); // YYYY-MM-DD format
          const defaultTimeSlot = '09:00-11:00'; // Simple string format expected by frontend
          
          console.log(`🤖 Auto-assigning ${engineer.name} (ID: ${engineer.id}) to item ${item.id} with default schedule ${defaultScheduledDate} 09:00-11:00`);
          
          await client.query(`
            UPDATE order_items 
            SET assigned_engineer_id = $1, 
                assigned_engineer_name = $2,
                item_status = 'scheduled',
                scheduled_date = $3,
                scheduled_time_slot = $4,
                item_notes = COALESCE(item_notes, '') || $5
            WHERE id = $6
          `, [
            engineer.id,
            truncatedName,
            defaultScheduledDate,
            defaultTimeSlot,
            shortNote,
            item.id
          ]);
          
          assignments.push({
            itemId: item.id,
            service_name: item.service_name,
            engineer_name: engineer.name,
            engineer_expertise: engineer.expert,
            current_load: parseInt(engineer.current_load)
          });
          
          console.log(`✅ Successfully assigned ${engineer.name} to ${item.service_name} - scheduled for ${defaultScheduledDate} at ${defaultTimeSlot}`);
          
        } catch (error) {
          console.error(`❌ Assignment failed for ${item.service_name}:`, error);
          failures.push({
            itemId: item.id,
            service_name: item.service_name,
            reason: 'Assignment failed'
          });
        }
      }
      
      // Update overall order status if all items are now assigned
      if (assignments.length > 0) {
        const orderItemsResult = await client.query(
          'SELECT COUNT(*) as total, COUNT(assigned_engineer_id) as assigned FROM order_items WHERE order_id = $1',
          [orderId]
        );
        
        const { total, assigned } = orderItemsResult.rows[0];
        
        if (parseInt(assigned) === parseInt(total)) {
          // All items are assigned, update order status to scheduled
          const orderNote = `\n[${new Date().toISOString().substring(0, 10)}] All items auto-assigned - Order scheduled`;
          await client.query(
            'UPDATE orders SET status = $1, special_instructions = COALESCE(special_instructions, \'\') || $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
            ['scheduled', orderNote, orderId]
          );
          
          console.log(`✅ Order ${orderId} status updated to 'scheduled' - all ${total} items assigned`);
        }
      }
      
      await client.query('COMMIT');
      return { assigned: assignments.length, failed: failures.length };
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in performAutoAssignment:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Auto-assign engineers based on expertise and workload (API endpoint)
  static async autoAssignEngineers(req: Request, res: Response) {
    try {
      const { orderId } = req.params;
      
      // Use the internal performAutoAssignment method
      const result = await OrdersController.performAutoAssignment(orderId);
      
      if (result.assigned === 0 && result.failed === 0) {
        const response: ApiResponse<{ successful_assignments: number; failed_assignments: number; total_processed: number }> = {
          success: true,
          data: {
            successful_assignments: 0,
            failed_assignments: 0,
            total_processed: 0
          },
          message: 'All items in this order are already assigned to engineers'
        };
        return res.status(200).json(response);
      }
      
      // Check if order was moved to scheduled status and get assignment details
      const orderResult = await pool.query(`
        SELECT o.status, 
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', oi.id,
            'service_name', oi.service_name,
            'assigned_engineer_id', oi.assigned_engineer_id,
            'assigned_engineer_name', oi.assigned_engineer_name,
            'item_status', oi.item_status,
            'scheduled_date', oi.scheduled_date,
            'scheduled_time_slot', oi.scheduled_time_slot
          )
        ) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1
        GROUP BY o.id, o.status
      `, [orderId]);
      
      const currentStatus = orderResult.rows[0]?.status;
      const assignedItems = orderResult.rows[0]?.items || [];
      const statusMessage = currentStatus === 'scheduled' ? ' - Order moved to scheduled status' : '';
      
      console.log('🔍 AUTO-ASSIGNMENT RESULT DEBUG:', {
        orderId,
        currentStatus,
        assignedCount: result.assigned,
        failedCount: result.failed,
        assignedItems: assignedItems.filter((item: any) => item.id !== null)
      });
      
      const response: ApiResponse<{ successful_assignments: number; failed_assignments: number; total_processed: number; assigned_items: any[] }> = {
        success: result.assigned > 0,
        data: {
          successful_assignments: result.assigned,
          failed_assignments: result.failed,
          total_processed: result.assigned + result.failed,
          assigned_items: assignedItems.filter((item: any) => item.id !== null)
        },
        message: `Auto-assignment completed: ${result.assigned} assigned, ${result.failed} failed${statusMessage}`
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error in auto-assignment:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to auto-assign engineers'
      };
      res.status(500).json(response);
    }
  }

  // Cancel order (customer or admin)
  static async cancelOrder(req: Request, res: Response) {
    const client = await pool.connect();
    
    try {
      const { id: orderId } = req.params;
      const userId = (req as any).user?.userId;
      const userRole = (req as any).user?.role;
      const userEmail = (req as any).user?.email || 'unknown';
      
      // Parse cancellation reason from request body
      let cancelReason = 'No reason provided';
      try {
        const requestData = req.body;
        cancelReason = requestData.reason || 'No reason provided';
      } catch (error) {
        // Use default reason if parsing fails
      }
      
      
      await client.query('BEGIN');
      
      // Get order with items
      const orderQuery = `
        SELECT o.*, 
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', oi.id,
            'service_name', oi.service_name,
            'item_status', oi.item_status
          )
        ) FILTER (WHERE oi.id IS NOT NULL) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1
        GROUP BY o.id
      `;
      
      const orderResult = await client.query(orderQuery, [orderId]);
      
      if (orderResult.rows.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Order not found'
        };
        await client.query('ROLLBACK');
        return res.status(404).json(response);
      }
      
      const order = orderResult.rows[0];
      
      // Check permissions - user can cancel their own orders, admin can cancel any
      if (userRole !== 'admin' && userRole !== 'super_admin' && order.customer_id !== userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'You can only cancel your own orders'
        };
        await client.query('ROLLBACK');
        return res.status(403).json(response);
      }
      
      // Status check removed - all orders can be cancelled (only 'pending' status exists)
      
      // Update order status to cancelled
      // originalStatus variable removed - not used
      const cancellationNote = `CANCELLED by ${userEmail}: ${cancelReason}`;
      const existingNotes = order.special_instructions || '';
      const updatedAdminNotes = existingNotes 
        ? `${existingNotes}\n${cancellationNote}` 
        : cancellationNote;
      
      await client.query(`
        UPDATE orders 
        SET status = 'cancelled', 
            special_instructions = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [updatedAdminNotes, orderId]);
      
      // Cancel all order items as well
      let cancelledItems = 0;
      const items = order.items || [];
      
      for (const item of items) {
        // Always true since only 'pending' status exists
        if (true) {
          // originalItemStatus variable removed - not used
          await client.query(`
            UPDATE order_items 
            SET item_status = 'cancelled'
            WHERE id = $1
          `, [item.id]);
          
          cancelledItems++;
        }
      }
      
      await client.query('COMMIT');
      
      
      // Get updated order data for response
      const updatedOrderResult = await pool.query(orderQuery, [orderId]);
      const updatedOrder = updatedOrderResult.rows[0];
      
      const response: ApiResponse<Order> = {
        success: true,
        message: 'Order cancelled successfully',
        data: updatedOrder
      };
      
      res.json(response);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error(`Error cancelling order:`, error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to cancel order'
      };
      res.status(500).json(response);
    } finally {
      client.release();
    }
  }

  // Rate order (customer only)
  static async rateOrder(req: Request, res: Response) {
    try {
      const { id: orderId } = req.params;
      const { customer_rating, customer_review } = req.body;
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'User not authenticated'
        };
        return res.status(401).json(response);
      }

      console.log('🔍 Rating Submission Details:', {
        orderId,
        userId,
        rating: customer_rating,
        reviewLength: customer_review?.length || 0
      });

      // Verify order exists and belongs to the user
      const orderResult = await pool.query(
        'SELECT id, customer_id, status FROM orders WHERE id = $1',
        [orderId]
      );

      if (orderResult.rows.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Order not found'
        };
        return res.status(404).json(response);
      }

      const order = orderResult.rows[0];

      // Check if the order belongs to the authenticated user
      if (order.customer_id !== userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'You can only rate your own orders'
        };
        return res.status(403).json(response);
      }

      // Rating check removed - all orders can be rated (only 'pending' status exists)

      // Update order with rating and review
      const updateQuery = `
        UPDATE orders 
        SET customer_rating = $1, 
            customer_review = $2, 
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING *
      `;

      const updateResult = await pool.query(updateQuery, [
        customer_rating,
        customer_review || null,
        orderId
      ]);

      console.log('✅ Rating submitted successfully:', {
        orderId,
        rating: customer_rating,
        hasReview: !!customer_review
      });

      const response: ApiResponse<Order> = {
        success: true,
        data: updateResult.rows[0],
        message: 'Rating submitted successfully'
      };

      res.json(response);

    } catch (error) {
      console.error('Error submitting rating:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to submit rating'
      };
      res.status(500).json(response);
    }
  }

  // Delete order
  static async deleteOrder(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      const result = await pool.query('DELETE FROM orders WHERE id = $1 RETURNING id', [id]);
      
      if (result.rows.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Order not found'
        };
        return res.status(404).json(response);
      }
      
      const response: ApiResponse<null> = {
        success: true,
        message: 'Order deleted successfully'
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error deleting order:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to delete order'
      };
      res.status(500).json(response);
    }
  }

  // Get engineer workload statistics
  static async getEngineerWorkloadStats(req: Request, res: Response) {
    try {
      const query = `
        SELECT 
          e.id,
          e.employee_id,
          e.name,
          e.expertise,
          e.phone,
          e.email,
          e.is_active,
          COUNT(CASE WHEN oi.item_status = 'scheduled' THEN 1 END) as active_tasks,
          COUNT(CASE WHEN oi.item_status = 'pending' THEN 1 END) as pending_tasks,
          COUNT(CASE WHEN oi.item_status = 'confirmed' THEN 1 END) as confirmed_tasks,
          COUNT(CASE WHEN oi.item_status = 'scheduled' THEN 1 END) as scheduled_tasks,
          COUNT(CASE WHEN oi.item_status = 'postponed' THEN 1 END) as postponed_tasks,
          COUNT(CASE WHEN oi.item_status = 'cancelled' THEN 1 END) as cancelled_tasks,
          COALESCE(
            JSON_AGG(
              CASE 
                WHEN oi.id IS NOT NULL AND oi.item_status = 'scheduled' 
                THEN JSON_BUILD_OBJECT(
                  'order_id', o.id,
                  'order_number', o.order_number,
                  'service_name', oi.service_name,
                  'item_status', oi.item_status,
                  'scheduled_date', oi.scheduled_date,
                  'customer_name', o.customer_name,
                  'customer_phone', o.customer_phone,
                  'priority', o.priority
                )
              END
            ) FILTER (WHERE oi.id IS NOT NULL AND oi.item_status = 'scheduled'),
            '[]'::json
          ) as active_assignments
        FROM employees e
        LEFT JOIN order_items oi ON e.id = oi.assigned_engineer_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE e.is_active = true
        GROUP BY e.id, e.employee_id, e.name, e.expertise, e.phone, e.email, e.is_active
        ORDER BY active_tasks DESC, e.name ASC
      `;
      
      const result = await pool.query(query);
      
      // Calculate summary statistics
      const totalActiveEngineers = result.rows.filter(row => row.active_tasks > 0).length;
      const totalActiveTasks = result.rows.reduce((sum, row) => sum + parseInt(row.active_tasks), 0);
      const averageTasksPerActiveEngineer = totalActiveEngineers > 0 ? (totalActiveTasks / totalActiveEngineers).toFixed(1) : "0";
      
      const summaryStats = {
        total_engineers: result.rows.length,
        active_engineers: totalActiveEngineers,
        idle_engineers: result.rows.length - totalActiveEngineers,
        total_active_tasks: totalActiveTasks,
        average_tasks_per_active_engineer: parseFloat(averageTasksPerActiveEngineer),
        busiest_engineer: result.rows[0]?.name || null,
        max_tasks: result.rows[0]?.active_tasks || 0
      };
      
      const response: ApiResponse<{
        summary: typeof summaryStats;
        engineers: typeof result.rows;
      }> = {
        success: true,
        data: {
          summary: summaryStats,
          engineers: result.rows
        },
        message: `Found workload statistics for ${result.rows.length} engineers`
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error fetching engineer workload stats:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch engineer workload statistics'
      };
      res.status(500).json(response);
    }
  }
}