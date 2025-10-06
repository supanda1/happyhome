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
            'variant_id', oi.variant_id,
            'variant_name', oi.variant_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'category_id', oi.category_id,
            'subcategory_id', oi.subcategory_id,
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
      const userId = (req as any).user?.userId;
      
      if (!userId) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'User not authenticated'
        };
        return res.status(401).json(response);
      }

      const query = `
        SELECT o.*, 
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'id', oi.id,
            'service_id', oi.service_id,
            'service_name', oi.service_name,
            'variant_id', oi.variant_id,
            'variant_name', oi.variant_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'category_id', oi.category_id,
            'subcategory_id', oi.subcategory_id,
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
        WHERE o.customer_id = $1
        GROUP BY o.id
        ORDER BY o.created_at DESC
      `;
      
      const result = await pool.query(query, [userId]);
      
      // Transform Order data to Booking format expected by frontend
      const bookings = result.rows.flatMap(order => {
        if (!order.items || order.items.length === 0) return [];
        
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
              startTime: item.scheduled_time_slot?.start_time || '09:00',
              endTime: item.scheduled_time_slot?.end_time || '11:00', 
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
            couponCode: order.coupon_code,
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
            'variant_id', oi.variant_id,
            'variant_name', oi.variant_name,
            'quantity', oi.quantity,
            'unit_price', oi.unit_price,
            'total_price', oi.total_price,
            'category_id', oi.category_id,
            'subcategory_id', oi.subcategory_id,
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
      
      // Generate order number
      const countResult = await client.query('SELECT COUNT(*) FROM orders');
      const orderNumber = `HH${String(parseInt(countResult.rows[0].count) + 1).padStart(3, '0')}`;
      
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
        orderData.discount_amount,
        orderData.gst_amount,
        orderData.service_charge,
        orderData.final_amount,
        orderData.priority || 'medium',
        orderData.notes,
        'pending'
      ];
      
      const orderResult = await client.query(orderInsertQuery, orderValues);
      
      // Insert order items
      const itemInsertQuery = `
        INSERT INTO order_items (
          id, order_id, service_id, service_name, variant_id, variant_name,
          quantity, unit_price, total_price, category_id, subcategory_id, item_status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *
      `;
      
      const items: OrderItem[] = [];
      
      for (const item of orderData.items) {
        const itemId = uuidv4();
        const itemValues = [
          itemId,
          orderId,
          item.service_id,
          item.service_name,
          item.variant_id,
          item.variant_name,
          item.quantity,
          item.unit_price,
          item.total_price,
          item.category_id,
          item.subcategory_id,
          'pending'
        ];
        
        const itemResult = await client.query(itemInsertQuery, itemValues);
        items.push(itemResult.rows[0]);
      }
      
      await client.query('COMMIT');
      
      const order: Order = {
        ...orderResult.rows[0],
        service_address: typeof orderResult.rows[0].service_address === 'string' 
          ? JSON.parse(orderResult.rows[0].service_address) 
          : orderResult.rows[0].service_address,
        items
      };

      // Trigger auto-assignment after order creation
      try {
        await OrdersController.performAutoAssignment(orderId);
      } catch (autoAssignError) {
        console.warn(`⚠️ Auto-assignment failed for order ${orderNumber}:`, autoAssignError);
        // Don't fail the order creation if auto-assignment fails
      }
      
      const response: ApiResponse<Order> = {
        success: true,
        data: order,
        message: `Order ${orderNumber} created successfully`
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
        updateFields.push(`admin_notes = $${valueIndex}`);
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
        
        if (updates.item_status === 'completed') {
          updateFields.push(`completion_date = $${valueIndex}`);
          values.push(new Date().toISOString().split('T')[0]); // YYYY-MM-DD format
          valueIndex++;
        }
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
        SELECT e.id, e.name, e.expert, e.phone, e.email,
               COUNT(oi.id) as current_assignments
        FROM employees e
        LEFT JOIN order_items oi ON e.id = oi.assigned_engineer_id 
                                  AND oi.item_status IN ('scheduled', 'in_progress')
        WHERE (e.id::text = $1 OR e.employee_id = $1) AND e.is_active = true
        GROUP BY e.id, e.name, e.expert, e.phone, e.email
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
        SET assigned_engineer_id = $1, assigned_engineer_name = $2, item_status = $3, scheduled_date = $4, item_notes = $5
        WHERE id = $6 AND order_id = $7
        RETURNING *
      `;
      
      const updateValues = [
        engineer.id,
        engineer.name,
        'scheduled',
        formattedScheduledDate,
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
        const orderNote = `\n[${new Date().toISOString().substring(0, 10)}] All items assigned - Order ready`;
        await client.query(
          'UPDATE orders SET status = $1, admin_notes = COALESCE(admin_notes, \'\') || $2 WHERE id = $3',
          ['scheduled', orderNote, orderId]
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
      
      const results = [];
      const errors = [];
      
      for (const assignment of assignments) {
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
        
        switch(order.status) {
          case 'scheduled':
            statusDescription = 'Order confirmed and scheduled for service';
            break;
          case 'in_progress':
            statusDescription = 'Service work in progress';
            break;
          case 'completed':
            statusDescription = 'Order completed successfully';
            break;
          case 'cancelled':
            statusDescription = 'Order cancelled';
            break;
          default:
            statusDescription = `Order status updated to ${order.status}`;
        }

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

        // Item Completion
        if (item.item_status === 'completed' && item.completion_date) {
          timeline.push({
            timestamp: item.completion_date,
            event_type: 'service_completed',
            title: 'Service Completed',
            description: `${item.service_name} completed by ${item.engineer_name}`,
            details: {
              service: item.service_name,
              engineer: item.engineer_name,
              rating: item.item_rating,
              review: item.item_review,
              completion_date: item.completion_date
            }
          });
        }
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
        completed_items: itemsResult.rows.filter(item => item.item_status === 'completed').length
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

  // Internal method for auto-assignment (used by createOrder)
  static async performAutoAssignment(orderId: string): Promise<{ assigned: number; failed: number }> {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      // Get unassigned items for the order
      const unassignedItems = await client.query(`
        SELECT oi.*, sc.name as category_name
        FROM order_items oi
        LEFT JOIN service_categories sc ON oi.category_id = sc.id
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
            SELECT e.id, e.name, e.expert, e.expertise_areas,
                   COUNT(oi.id) as current_load,
                   CASE 
                     -- Exact category match in expertise_areas (highest priority)
                     WHEN e.expertise_areas @> $1 THEN 10
                     
                     -- DOMAIN-SPECIFIC matching (highest priority for expertise matching)
                     -- Plumbing domain keywords (MUST have plumbing expertise)
                     WHEN (
                       (LOWER($2) LIKE '%plumb%' OR LOWER($2) LIKE '%pipe%' OR LOWER($2) LIKE '%drain%' OR LOWER($2) LIKE '%water%' OR
                        LOWER($2) LIKE '%bath%' OR LOWER($2) LIKE '%basin%' OR LOWER($2) LIKE '%toilet%' OR LOWER($2) LIKE '%faucet%' OR
                        LOWER($2) LIKE '%fitting%' OR LOWER($2) LIKE '%tap%' OR LOWER($2) LIKE '%sink%' OR LOWER($2) LIKE '%shower%') AND
                       (LOWER(e.expert) LIKE '%plumb%' OR LOWER(e.expert) LIKE '%pipe%' OR LOWER(e.expert) LIKE '%drain%' OR
                        LOWER(e.expert) LIKE '%bath%' OR LOWER(e.expert) LIKE '%fitting%' OR
                        e.expertise_areas::text ILIKE '%plumb%' OR e.expertise_areas::text ILIKE '%pipe%' OR
                        e.expertise_areas::text ILIKE '%bath%' OR e.expertise_areas::text ILIKE '%fitting%')
                     ) THEN 9
                     
                     -- Electrical domain keywords (MUST have electrical expertise)
                     WHEN (
                       (LOWER($2) LIKE '%electric%' OR LOWER($2) LIKE '%wiring%' OR LOWER($2) LIKE '%electrical%' OR
                        LOWER($2) LIKE '%switch%' OR LOWER($2) LIKE '%socket%' OR LOWER($2) LIKE '%lighting%' OR LOWER($2) LIKE '%fan%') AND
                       (LOWER(e.expert) LIKE '%electric%' OR LOWER(e.expert) LIKE '%wiring%' OR LOWER(e.expert) LIKE '%electrical%' OR
                        e.expertise_areas::text ILIKE '%electric%' OR e.expertise_areas::text ILIKE '%wiring%')
                     ) THEN 9
                     
                     -- Cleaning domain keywords (MUST have cleaning expertise)
                     WHEN (
                       (LOWER($2) LIKE '%clean%' OR LOWER($2) LIKE '%wash%' OR LOWER($2) LIKE '%septic%' OR LOWER($2) LIKE '%ac clean%') AND
                       (LOWER(e.expert) LIKE '%clean%' OR LOWER(e.expert) LIKE '%wash%' OR
                        e.expertise_areas::text ILIKE '%clean%')
                     ) THEN 9
                     
                     -- Generic installation/repair matching (LOWER PRIORITY - only when no domain expert available)
                     WHEN (
                       (LOWER($2) LIKE '%install%' OR LOWER($2) LIKE '%repair%' OR LOWER($2) LIKE '%fix%') AND
                       (LOWER(e.expert) LIKE '%install%' OR LOWER(e.expert) LIKE '%repair%' OR LOWER(e.expert) LIKE '%fix%' OR
                        e.expertise_areas::text ILIKE '%install%')
                     ) THEN 6
                     
                     -- Category name partial match (broader)
                     WHEN LOWER(e.expert) LIKE '%' || LOWER($3) || '%' THEN 5
                     WHEN e.expertise_areas::text ILIKE '%' || $3 || '%' THEN 4
                     
                     -- Fallback: any active engineer gets minimal score (ONLY if no domain expert available)
                     ELSE 1
                   END as expertise_score
            FROM employees e
            LEFT JOIN order_items oi ON e.id = oi.assigned_engineer_id 
                                      AND oi.item_status IN ('scheduled', 'in_progress')
            WHERE e.is_active = true
            GROUP BY e.id, e.name, e.expert, e.expertise_areas
            ORDER BY expertise_score DESC, current_load ASC, e.name ASC
            LIMIT 1
          `, [
            JSON.stringify([item.category_name]), // $1 - exact category match
            item.service_name,                    // $2 - service name for all domain matching
            item.category_name || ''              // $3 - category name for partial match
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
          
          await client.query(`
            UPDATE order_items 
            SET assigned_engineer_id = $1, 
                assigned_engineer_name = $2,
                item_status = 'scheduled',
                item_notes = COALESCE(item_notes, '') || $3
            WHERE id = $4
          `, [
            engineer.id,
            truncatedName,
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
          
        } catch (error) {
          console.error(`❌ Assignment failed for ${item.service_name}:`, error);
          failures.push({
            itemId: item.id,
            service_name: item.service_name,
            reason: 'Assignment failed'
          });
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
        const response: ApiResponse<null> = {
          success: false,
          error: 'No unassigned items found for this order'
        };
        return res.status(404).json(response);
      }
      
      const response: ApiResponse<{ successful_assignments: number; failed_assignments: number; total_processed: number }> = {
        success: result.assigned > 0,
        data: {
          successful_assignments: result.assigned,
          failed_assignments: result.failed,
          total_processed: result.assigned + result.failed
        },
        message: `Auto-assignment completed: ${result.assigned} assigned, ${result.failed} failed`
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
      
      // Check if order can be cancelled
      if (order.status === 'completed' || order.status === 'cancelled') {
        const response: ApiResponse<null> = {
          success: false,
          error: `Cannot cancel order with status: ${order.status}`
        };
        await client.query('ROLLBACK');
        return res.status(400).json(response);
      }
      
      // Update order status to cancelled
      const originalStatus = order.status;
      const cancellationNote = `CANCELLED by ${userEmail}: ${cancelReason}`;
      const existingNotes = order.admin_notes || '';
      const updatedAdminNotes = existingNotes 
        ? `${existingNotes}\n${cancellationNote}` 
        : cancellationNote;
      
      await client.query(`
        UPDATE orders 
        SET status = 'cancelled', 
            admin_notes = $1,
            updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
      `, [updatedAdminNotes, orderId]);
      
      // Cancel all order items as well
      let cancelledItems = 0;
      const items = order.items || [];
      
      for (const item of items) {
        if (item.item_status !== 'completed') {
          const originalItemStatus = item.item_status;
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

      // Check if order is completed (only completed orders can be rated)
      if (order.status !== 'completed') {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Only completed orders can be rated'
        };
        return res.status(400).json(response);
      }

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
          e.expert,
          e.phone,
          e.email,
          e.is_active,
          COUNT(CASE WHEN oi.item_status IN ('pending', 'scheduled', 'in_progress') THEN 1 END) as active_tasks,
          COUNT(CASE WHEN oi.item_status = 'pending' THEN 1 END) as pending_tasks,
          COUNT(CASE WHEN oi.item_status = 'scheduled' THEN 1 END) as scheduled_tasks,
          COUNT(CASE WHEN oi.item_status = 'in_progress' THEN 1 END) as in_progress_tasks,
          COUNT(CASE WHEN oi.item_status = 'completed' THEN 1 END) as completed_tasks,
          COALESCE(
            JSON_AGG(
              CASE 
                WHEN oi.id IS NOT NULL AND oi.item_status IN ('pending', 'scheduled', 'in_progress') 
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
            ) FILTER (WHERE oi.id IS NOT NULL AND oi.item_status IN ('pending', 'scheduled', 'in_progress')),
            '[]'::json
          ) as active_assignments
        FROM employees e
        LEFT JOIN order_items oi ON e.id = oi.assigned_engineer_id
        LEFT JOIN orders o ON oi.order_id = o.id
        WHERE e.is_active = true
        GROUP BY e.id, e.employee_id, e.name, e.expert, e.phone, e.email, e.is_active
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