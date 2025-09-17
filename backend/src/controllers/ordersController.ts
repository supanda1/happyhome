import { Request, Response } from 'express';
import pool from '../config/database';
import { 
  Order, 
  OrderItem, 
  ApiResponse, 
  CreateOrderRequest, 
  UpdateOrderRequest,
  UpdateOrderItemRequest,
  AssignEngineerRequest,
  BulkAssignEngineerRequest,
  AssignmentHistory,
  AutoAssignmentResult,
  EngineerWorkload
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
      const values: any[] = [];
      
      if (status) {
        conditions.push(`o.status = $${values.length + 1}`);
        values.push(status);
      }
      
      if (priority) {
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
        items: row.items.filter((item: any) => item.id !== null) // Remove null items
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
        items: result.rows[0].items.filter((item: any) => item.id !== null)
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
      const values: any[] = [];
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
      
      const response: ApiResponse<any> = {
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
      const values: any[] = [];
      let valueIndex = 1;
      
      if (updates.assigned_engineer_id) {
        // Get engineer details (handle both UUID and string IDs)
        const engineerResult = await pool.query('SELECT id, name FROM employees WHERE (id::text = $1 OR employee_id = $1)', [updates.assigned_engineer_id]);
        if (engineerResult.rows.length > 0) {
          const engineer = engineerResult.rows[0];
          
          updateFields.push(`assigned_engineer_id = $${valueIndex}`);
          values.push(engineer.id); // Use actual database UUID
          valueIndex++;
          
          updateFields.push(`assigned_engineer_name = $${valueIndex}`);
          values.push(engineer.name);
          valueIndex++;
        }
      }
      
      if (updates.item_status) {
        updateFields.push(`item_status = $${valueIndex}`);
        values.push(updates.item_status);
        valueIndex++;
        
        if (updates.item_status === 'completed') {
          updateFields.push(`completion_date = CURRENT_TIMESTAMP`);
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
      
      const response: ApiResponse<any> = {
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
      
      // Add assignment history tracking
      const previousAssignment = await client.query(
        'SELECT assigned_engineer_id, assigned_engineer_name FROM order_items WHERE id = $1',
        [itemId]
      );
      
      const isReassignment = previousAssignment.rows[0]?.assigned_engineer_id !== null;
      const actionType = isReassignment ? 'reassigned' : 'assigned';
      const assignmentNotes = expertiseWarning ? expertiseWarning.slice(7, -1) : null; // Remove " (Note: " and ")"
      
      // Insert assignment history record
      await client.query(`
        INSERT INTO assignment_history (
          order_id, item_id, engineer_id, engineer_name, action_type, notes, created_by
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, [
        orderId,
        itemId, 
        engineer.id,
        engineer.name,
        actionType,
        assignmentNotes,
        'system' // Could be enhanced to track actual admin user
      ]);
      
      // Update order item with assigned engineer
      const updateFields = [
        'assigned_engineer_id = $1',
        'assigned_engineer_name = $2',
        'item_status = $3'
      ];
      
      const updateValues = [engineer.id, engineer.name, 'scheduled']; // Use actual database UUID
      let paramIndex = 4;
      
      if (scheduled_date) {
        updateFields.push(`scheduled_date = $${paramIndex}`);
        updateValues.push(scheduled_date);
        paramIndex++;
      }
      
      if (scheduled_time_slot) {
        updateFields.push(`scheduled_time_slot = $${paramIndex}`);
        updateValues.push(scheduled_time_slot);
        paramIndex++;
      }
      
      // Enhanced notes with assignment details
      const enhancedNotes = [
        orderItem.item_notes || '',
        `\n[${new Date().toISOString()}] ${orderItem.assigned_engineer_id ? 'Reassigned' : 'Assigned'} to ${engineer.name} (${engineer.expert})`,
        notes ? `Admin Note: ${notes}` : '',
        expertiseWarning,
        workloadWarning
      ].filter(Boolean).join('\n');
      
      updateFields.push(`item_notes = $${paramIndex}`);
      updateValues.push(enhancedNotes);
      paramIndex++;
      
      updateValues.push(itemId, orderId);
      
      const updateQuery = `
        UPDATE order_items 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex} AND order_id = $${paramIndex + 1}
        RETURNING *
      `;
      
      const result = await client.query(updateQuery, updateValues);
      
      // Update overall order status if needed
      const orderItemsResult = await client.query(
        'SELECT COUNT(*) as total, COUNT(assigned_engineer_id) as assigned FROM order_items WHERE order_id = $1',
        [orderId]
      );
      
      const { total, assigned } = orderItemsResult.rows[0];
      
      if (parseInt(assigned) === parseInt(total)) {
        // All items are assigned, update order status
        await client.query(
          'UPDATE orders SET status = $1, admin_notes = COALESCE(admin_notes, \'\') || $2 WHERE id = $3',
          ['scheduled', `\n[${new Date().toISOString()}] All items assigned - Order ready for scheduling`, orderId]
        );
      }
      
      await client.query('COMMIT');
      
      const response: ApiResponse<any> = {
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
            engineer.name,
            `\n[${new Date().toISOString()}] Bulk assigned to ${engineer.name}${assignment.notes ? ': ' + assignment.notes : ''}`,
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
          
        } catch (error) {
          errors.push({
            orderId: assignment.orderId,
            itemId: assignment.itemId,
            error: 'Failed to assign engineer'
          });
        }
      }
      
      await client.query('COMMIT');
      
      const response: ApiResponse<any> = {
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

  // Get assignment history for order or item
  static async getAssignmentHistory(req: Request, res: Response) {
    try {
      const { orderId, itemId } = req.params;
      
      let query = `
        SELECT 
          ah.id,
          ah.order_id,
          ah.item_id,
          ah.engineer_id,
          ah.engineer_name,
          ah.action_type,
          ah.notes,
          ah.created_by,
          ah.created_at,
          e.phone as engineer_phone,
          e.email as engineer_email,
          e.expert as engineer_expertise
        FROM assignment_history ah
        LEFT JOIN employees e ON ah.engineer_id = e.id
      `;
      
      const queryParams = [];
      const conditions = [];
      
      if (itemId) {
        conditions.push('ah.item_id = $' + (queryParams.length + 1));
        queryParams.push(itemId);
      } else if (orderId) {
        conditions.push('ah.order_id = $' + (queryParams.length + 1));
        queryParams.push(orderId);
      } else {
        return res.status(400).json({
          success: false,
          error: 'Either orderId or itemId parameter is required'
        });
      }
      
      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }
      
      query += ' ORDER BY ah.created_at DESC';
      
      const result = await pool.query(query, queryParams);
      
      const response: ApiResponse<any[]> = {
        success: true,
        data: result.rows,
        message: `Found ${result.rows.length} assignment history records`
      };
      
      res.json(response);
    } catch (error) {
      console.error('Error fetching assignment history:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch assignment history'
      };
      res.status(500).json(response);
    }
  }

  // Auto-assign engineers based on expertise and workload
  static async autoAssignEngineers(req: Request, res: Response) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const { orderId } = req.params;
      
      // Get unassigned items for the order
      const unassignedItems = await client.query(`
        SELECT oi.*, sc.name as category_name
        FROM order_items oi
        LEFT JOIN service_categories sc ON oi.category_id = sc.id
        WHERE oi.order_id = $1 AND oi.assigned_engineer_id IS NULL
      `, [orderId]);
      
      if (unassignedItems.rows.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'No unassigned items found for this order'
        };
        await client.query('ROLLBACK');
        return res.status(404).json(response);
      }
      
      const assignments = [];
      const failures = [];
      
      for (const item of unassignedItems.rows) {
        try {
          // Find best engineer for this category (supports multiple expertise areas)
          const engineerResult = await client.query(`
            SELECT e.id, e.name, e.expert, e.expertise_areas,
                   COUNT(oi.id) as current_load,
                   CASE 
                     WHEN e.expertise_areas @> $1 THEN 4
                     WHEN LOWER(e.expert) LIKE LOWER($2) THEN 3
                     WHEN e.expertise_areas::text ILIKE '%' || $3 || '%' THEN 2
                     WHEN LOWER(e.expert) LIKE '%' || LOWER($4) || '%' THEN 1
                     ELSE 0
                   END as expertise_score
            FROM employees e
            LEFT JOIN order_items oi ON e.id = oi.assigned_engineer_id 
                                      AND oi.item_status IN ('scheduled', 'in_progress')
            WHERE e.is_active = true AND (
              e.expertise_areas @> $5 OR 
              LOWER(e.expert) LIKE '%' || LOWER($6) || '%'
            )
            GROUP BY e.id, e.name, e.expert, e.expertise_areas
            ORDER BY expertise_score DESC, current_load ASC, e.name ASC
            LIMIT 1
          `, [
            JSON.stringify([item.category_name]), // Perfect match in expertise_areas
            `%${item.category_name}%`, // Legacy expert field exact match
            item.category_name, // Partial match in expertise_areas
            item.category_name, // Partial match in legacy expert
            JSON.stringify([item.category_name]), // Filter condition
            item.category_name // Filter condition for legacy
          ]);
          
          if (engineerResult.rows.length === 0) {
            failures.push({
              itemId: item.id,
              service_name: item.service_name,
              reason: 'No available engineers found'
            });
            continue;
          }
          
          const engineer = engineerResult.rows[0];
          
          // Assign engineer
          await client.query(`
            UPDATE order_items 
            SET assigned_engineer_id = $1, 
                assigned_engineer_name = $2,
                item_status = 'scheduled',
                item_notes = COALESCE(item_notes, '') || $3
            WHERE id = $4
          `, [
            engineer.id,
            engineer.name,
            `\n[${new Date().toISOString()}] Auto-assigned to ${engineer.name} (expertise: ${engineer.expertise_areas ? engineer.expertise_areas.join(', ') : engineer.expert}, load: ${engineer.current_load})`,
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
          failures.push({
            itemId: item.id,
            service_name: item.service_name,
            reason: 'Assignment failed'
          });
        }
      }
      
      await client.query('COMMIT');
      
      const response: ApiResponse<any> = {
        success: assignments.length > 0,
        data: {
          successful_assignments: assignments,
          failed_assignments: failures,
          total_processed: unassignedItems.rows.length
        },
        message: `Auto-assignment completed: ${assignments.length} assigned, ${failures.length} failed`
      };
      
      res.json(response);
      
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error in auto-assignment:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to auto-assign engineers'
      };
      res.status(500).json(response);
    } finally {
      client.release();
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