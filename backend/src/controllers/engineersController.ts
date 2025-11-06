import { Request, Response } from 'express';
import pool from '../config/database';
import { Engineer, ApiResponse } from '../models/types';
import { v4 as uuidv4 } from 'uuid';

export class EngineersController {
  // Get all engineers
  static async getAllEngineers(req: Request, res: Response) {
    try {
      const { active_only, expert } = req.query;
      
      let query = 'SELECT * FROM engineers';
      const conditions: string[] = [];
      const values: (string | boolean)[] = [];
      
      if (active_only === 'true') {
        conditions.push('is_active = true');
      }
      
      if (expert) {
        // Search in the expertise JSONB array
        conditions.push(`expertise @> $${values.length + 1}`);
        values.push(JSON.stringify([expert])); // Check if expertise is in the array
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ' ORDER BY name ASC';
      
      const result = await pool.query(query, values);
      
      const response: ApiResponse<Engineer[]> = {
        success: true,
        data: result.rows,
        message: `Found ${result.rows.length} engineers`
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error fetching engineers:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch engineers'
      };
      res.status(500).json(response);
    }
  }

  // Get engineer by ID
  static async getEngineerById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Handle both UUID and string-based engineer IDs
      const result = await pool.query('SELECT * FROM engineers WHERE (id::text = $1 OR employee_id = $1)', [id]);
      
      if (result.rows.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Engineer not found'
        };
        return res.status(404).json(response);
      }
      
      const response: ApiResponse<Engineer> = {
        success: true,
        data: result.rows[0]
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error fetching engineer:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch engineer'
      };
      res.status(500).json(response);
    }
  }

  // Create new engineer
  static async createEngineer(req: Request, res: Response) {
    try {
      const { 
        employee_id, 
        name, 
        expertise, 
        specializations,
        phone, 
        email, 
        address,
        emergency_contact_name,
        emergency_contact_phone,
        license_number,
        certification_details,
        work_schedule,
        max_concurrent_jobs
      } = req.body;
      
      // Check if employee_id already exists
      const existingEngineer = await pool.query(
        'SELECT id FROM engineers WHERE employee_id = $1',
        [employee_id]
      );
      
      if (existingEngineer.rows.length > 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Engineer ID already exists'
        };
        return res.status(400).json(response);
      }
      
      // Check if email already exists
      if (email) {
        const existingEmail = await pool.query(
          'SELECT id FROM engineers WHERE email = $1',
          [email]
        );
        
        if (existingEmail.rows.length > 0) {
          const response: ApiResponse<null> = {
            success: false,
            error: 'Email already exists'
          };
          return res.status(400).json(response);
        }
      }
      
      const id = uuidv4();
      
      // Ensure expertise and specializations are arrays
      const expertiseArray = Array.isArray(expertise) ? expertise : [];
      const specializationsArray = Array.isArray(specializations) ? specializations : [];
      const certificationsObj = typeof certification_details === 'object' ? certification_details : {};
      const workScheduleObj = typeof work_schedule === 'object' ? work_schedule : {};
      
      const query = `
        INSERT INTO engineers (
          id, employee_id, name, expertise, specializations, phone, email, address, 
          emergency_contact_name, emergency_contact_phone, license_number, 
          certification_details, work_schedule, max_concurrent_jobs, is_active
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, true)
        RETURNING *
      `;
      
      const values = [
        id, 
        employee_id, 
        name, 
        JSON.stringify(expertiseArray),
        JSON.stringify(specializationsArray),
        phone, 
        email || null,
        address || null,
        emergency_contact_name || null,
        emergency_contact_phone || null,
        license_number || null,
        JSON.stringify(certificationsObj),
        JSON.stringify(workScheduleObj),
        max_concurrent_jobs || 5
      ];

      const result = await pool.query(query, values);
      
      const response: ApiResponse<Engineer> = {
        success: true,
        data: result.rows[0],
        message: 'Engineer created successfully'
      };
      
      res.status(201).json(response);
      
    } catch (error) {
      console.error('Error creating engineer:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to create engineer'
      };
      res.status(500).json(response);
    }
  }

  // Update engineer
  static async updateEngineer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { 
        employee_id, 
        name, 
        expertise, 
        specializations,
        phone, 
        email, 
        address, 
        is_active,
        emergency_contact_name,
        emergency_contact_phone,
        license_number,
        certification_details,
        work_schedule,
        max_concurrent_jobs
      } = req.body;
      
      // Check if employee_id already exists for other engineers
      if (employee_id) {
        const existingEngineer = await pool.query(
          'SELECT id FROM engineers WHERE employee_id = $1 AND id::text != $2 AND employee_id != $2',
          [employee_id, id]
        );
        
        if (existingEngineer.rows.length > 0) {
          const response: ApiResponse<null> = {
            success: false,
            error: 'Engineer ID already exists'
          };
          return res.status(400).json(response);
        }
      }
      
      const updateFields: string[] = [];
      const values: (string | number | boolean)[] = [];
      let valueIndex = 1;
      
      if (employee_id !== undefined) {
        updateFields.push(`employee_id = $${valueIndex}`);
        values.push(employee_id);
        valueIndex++;
      }
      
      if (name !== undefined) {
        updateFields.push(`name = $${valueIndex}`);
        values.push(name);
        valueIndex++;
      }
      
      if (expertise !== undefined) {
        const expertiseArray = Array.isArray(expertise) ? expertise : [];
        updateFields.push(`expertise = $${valueIndex}`);
        values.push(JSON.stringify(expertiseArray));
        valueIndex++;
      }
      
      if (specializations !== undefined) {
        const specializationsArray = Array.isArray(specializations) ? specializations : [];
        updateFields.push(`specializations = $${valueIndex}`);
        values.push(JSON.stringify(specializationsArray));
        valueIndex++;
      }
      
      if (phone !== undefined) {
        updateFields.push(`phone = $${valueIndex}`);
        values.push(phone);
        valueIndex++;
      }
      
      if (email !== undefined) {
        updateFields.push(`email = $${valueIndex}`);
        values.push(email);
        valueIndex++;
      }
      
      if (address !== undefined) {
        updateFields.push(`address = $${valueIndex}`);
        values.push(address);
        valueIndex++;
      }
      
      if (is_active !== undefined) {
        updateFields.push(`is_active = $${valueIndex}`);
        values.push(is_active);
        valueIndex++;
      }
      
      if (emergency_contact_name !== undefined) {
        updateFields.push(`emergency_contact_name = $${valueIndex}`);
        values.push(emergency_contact_name);
        valueIndex++;
      }
      
      if (emergency_contact_phone !== undefined) {
        updateFields.push(`emergency_contact_phone = $${valueIndex}`);
        values.push(emergency_contact_phone);
        valueIndex++;
      }
      
      if (license_number !== undefined) {
        updateFields.push(`license_number = $${valueIndex}`);
        values.push(license_number);
        valueIndex++;
      }
      
      if (certification_details !== undefined) {
        const certificationsObj = typeof certification_details === 'object' ? certification_details : {};
        updateFields.push(`certification_details = $${valueIndex}`);
        values.push(JSON.stringify(certificationsObj));
        valueIndex++;
      }
      
      if (work_schedule !== undefined) {
        const workScheduleObj = typeof work_schedule === 'object' ? work_schedule : {};
        updateFields.push(`work_schedule = $${valueIndex}`);
        values.push(JSON.stringify(workScheduleObj));
        valueIndex++;
      }
      
      if (max_concurrent_jobs !== undefined) {
        updateFields.push(`max_concurrent_jobs = $${valueIndex}`);
        values.push(max_concurrent_jobs);
        valueIndex++;
      }
      
      // Only add updated_at if we have fields to update
      if (updateFields.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'No fields to update'
        };
        return res.status(400).json(response);
      }
      
      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
      
      // Add ID parameter separately for WHERE clause
      const idParamIndex = valueIndex;
      const employeeIdParamIndex = valueIndex + 1;
      values.push(id); // For UUID comparison
      values.push(id); // For employee_id comparison
      
      const query = `
        UPDATE engineers 
        SET ${updateFields.join(', ')}
        WHERE (id::text = $${idParamIndex} OR employee_id = $${employeeIdParamIndex})
        RETURNING *
      `;
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Engineer not found'
        };
        return res.status(404).json(response);
      }
      
      const response: ApiResponse<Engineer> = {
        success: true,
        data: result.rows[0],
        message: 'Engineer updated successfully'
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error updating engineer:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to update engineer'
      };
      res.status(500).json(response);
    }
  }

  // Delete engineer
  static async deleteEngineer(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Check if engineer is assigned to any active orders (handle both UUID and string IDs)
      const assignedOrders = await pool.query(`
        SELECT COUNT(*) FROM order_items oi 
        JOIN engineers e ON oi.assigned_engineer_id = e.id 
        WHERE (e.id::text = $1 OR e.employee_id = $1)
      `, [id]);
      
      if (parseInt(assignedOrders.rows[0].count) > 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Cannot delete engineer with active order assignments. Deactivate instead.'
        };
        return res.status(400).json(response);
      }
      
      const result = await pool.query('DELETE FROM engineers WHERE (id::text = $1 OR employee_id = $1) RETURNING id', [id]);
      
      if (result.rows.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Engineer not found'
        };
        return res.status(404).json(response);
      }
      
      const response: ApiResponse<null> = {
        success: true,
        message: 'Engineer deleted successfully'
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error deleting engineer:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to delete engineer'
      };
      res.status(500).json(response);
    }
  }

  // Get engineers by expertise areas (supports multiple)
  static async getEngineersByExpertise(req: Request, res: Response) {
    try {
      const { expertise } = req.params;
      const { active_only } = req.query;
      
      let query = `
        SELECT * FROM engineers 
        WHERE expertise @> $1
      `;
      const values = [JSON.stringify([expertise])];
      
      if (active_only === 'true') {
        query += ' AND is_active = true';
      }
      
      query += ' ORDER BY name ASC';
      
      const result = await pool.query(query, values);
      
      const response: ApiResponse<Engineer[]> = {
        success: true,
        data: result.rows,
        message: `Found ${result.rows.length} engineers with ${expertise} expertise`
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error fetching engineers by expertise:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch engineers by expertise'
      };
      res.status(500).json(response);
    }
  }

  // Get available expertise areas
  static async getExpertiseAreas(_req: Request, res: Response) {
    try {
      // Get expertise areas from authoritative service_subcategories table
      const result = await pool.query(`
        SELECT name as expertise
        FROM service_subcategories 
        WHERE is_active = true
        ORDER BY name ASC
      `);
      
      const expertiseAreas = result.rows.map(row => row.expertise);
      
      const response: ApiResponse<string[]> = {
        success: true,
        data: expertiseAreas,
        message: `Found ${expertiseAreas.length} expertise areas from service subcategories`
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error fetching expertise areas:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch expertise areas'
      };
      res.status(500).json(response);
    }
  }
}