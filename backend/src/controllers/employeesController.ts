import { Request, Response } from 'express';
import pool from '../config/database';
import { Employee, ApiResponse } from '../models/types';
import { v4 as uuidv4 } from 'uuid';

export class EmployeesController {
  // Get all employees
  static async getAllEmployees(req: Request, res: Response) {
    try {
      const { active_only, expert } = req.query;
      
      let query = 'SELECT * FROM employees';
      const conditions: string[] = [];
      const values: (string | boolean)[] = [];
      
      if (active_only === 'true') {
        conditions.push('is_active = true');
      }
      
      if (expert) {
        // Support both legacy expert field and new expertise_areas
        conditions.push(`(expert = $${values.length + 1} OR expertise_areas @> $${values.length + 2})`);
        values.push(expert as string);
        values.push(JSON.stringify([expert])); // Check if expertise is in the array
      }
      
      if (conditions.length > 0) {
        query += ` WHERE ${conditions.join(' AND ')}`;
      }
      
      query += ' ORDER BY name ASC';
      
      const result = await pool.query(query, values);
      
      const response: ApiResponse<Employee[]> = {
        success: true,
        data: result.rows,
        message: `Found ${result.rows.length} employees`
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error fetching employees:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch employees'
      };
      res.status(500).json(response);
    }
  }

  // Get employee by ID
  static async getEmployeeById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Handle both UUID and string-based employee IDs
      const result = await pool.query('SELECT * FROM employees WHERE (id::text = $1 OR employee_id = $1)', [id]);
      
      if (result.rows.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Employee not found'
        };
        return res.status(404).json(response);
      }
      
      const response: ApiResponse<Employee> = {
        success: true,
        data: result.rows[0]
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error fetching employee:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch employee'
      };
      res.status(500).json(response);
    }
  }

  // Create new employee
  static async createEmployee(req: Request, res: Response) {
    try {
      const { employee_id, name, expert, expertise_areas, manager, phone, email } = req.body;
      
      // Check if employee_id already exists
      const existingEmployee = await pool.query(
        'SELECT id FROM employees WHERE employee_id = $1',
        [employee_id]
      );
      
      if (existingEmployee.rows.length > 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Employee ID already exists'
        };
        return res.status(400).json(response);
      }
      
      const id = uuidv4();
      
      // Ensure expertise_areas is an array, fallback to expert if not provided
      const expertiseArray = Array.isArray(expertise_areas) 
        ? expertise_areas 
        : (expert ? [expert] : []);
      
      let query: string;
      let values: (string | boolean)[];
      
      try {
        // Try to insert with expertise_areas column
        await pool.query('SELECT expertise_areas FROM employees LIMIT 1');
        
        query = `
          INSERT INTO employees (id, employee_id, name, expert, expertise_areas, manager, phone, email, is_active)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
          RETURNING *
        `;
        
        values = [
          id, 
          employee_id, 
          name, 
          expert || (expertiseArray[0] || ''), // Legacy field
          JSON.stringify(expertiseArray), // New multi-expertise field
          manager, 
          phone, 
          email
        ];
      } catch (columnError: unknown) {
        const error = columnError as { code?: string };
        if (error.code === '42703') { // Column does not exist
          
          query = `
            INSERT INTO employees (id, employee_id, name, expert, manager, phone, email, is_active)
            VALUES ($1, $2, $3, $4, $5, $6, $7, true)
            RETURNING *
          `;
          
          values = [
            id, 
            employee_id, 
            name, 
            expert || (expertiseArray[0] || ''), // Use first expertise or provided expert
            manager, 
            phone, 
            email
          ];
        } else {
          throw columnError;
        }
      }
      const result = await pool.query(query, values);
      
      const response: ApiResponse<Employee> = {
        success: true,
        data: result.rows[0],
        message: 'Employee created successfully'
      };
      
      res.status(201).json(response);
      
    } catch (error) {
      console.error('Error creating employee:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to create employee'
      };
      res.status(500).json(response);
    }
  }

  // Update employee
  static async updateEmployee(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { employee_id, name, expert, expertise_areas, manager, phone, email, is_active } = req.body;
      
      // Check if employee_id already exists for other employees
      if (employee_id) {
        const existingEmployee = await pool.query(
          'SELECT id FROM employees WHERE employee_id = $1 AND id::text != $2 AND employee_id != $2',
          [employee_id, id]
        );
        
        if (existingEmployee.rows.length > 0) {
          const response: ApiResponse<null> = {
            success: false,
            error: 'Employee ID already exists'
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
      
      if (expert !== undefined) {
        updateFields.push(`expert = $${valueIndex}`);
        values.push(expert);
        valueIndex++;
      }
      
      if (expertise_areas !== undefined) {
        try {
          const expertiseArray = Array.isArray(expertise_areas) ? expertise_areas : [];
          
          // Check if expertise_areas column exists by trying a small query first
          await pool.query('SELECT expertise_areas FROM employees LIMIT 1');
          
          updateFields.push(`expertise_areas = $${valueIndex}`);
          values.push(JSON.stringify(expertiseArray));
          valueIndex++;
          
          // Auto-update legacy expert field if not explicitly set
          if (expert === undefined && expertiseArray.length > 0) {
            updateFields.push(`expert = $${valueIndex}`);
            values.push(expertiseArray[0]);
            valueIndex++;
          }
        } catch (columnError: unknown) {
          const error = columnError as { code?: string };
          if (error.code === '42703') { // Column does not exist
            // Update only the legacy expert field
            if (expertise_areas && Array.isArray(expertise_areas) && expertise_areas.length > 0) {
              updateFields.push(`expert = $${valueIndex}`);
              values.push(expertise_areas[0]);
              valueIndex++;
            }
          } else {
            throw columnError; // Re-throw other errors
          }
        }
      }
      
      if (manager !== undefined) {
        updateFields.push(`manager = $${valueIndex}`);
        values.push(manager);
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
      
      if (is_active !== undefined) {
        updateFields.push(`is_active = $${valueIndex}`);
        values.push(is_active);
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
        UPDATE employees 
        SET ${updateFields.join(', ')}
        WHERE (id::text = $${idParamIndex} OR employee_id = $${employeeIdParamIndex})
        RETURNING *
      `;
      
      
      const result = await pool.query(query, values);
      
      if (result.rows.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Employee not found'
        };
        return res.status(404).json(response);
      }
      
      const response: ApiResponse<Employee> = {
        success: true,
        data: result.rows[0],
        message: 'Employee updated successfully'
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error updating employee:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to update employee'
      };
      res.status(500).json(response);
    }
  }

  // Delete employee
  static async deleteEmployee(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      // Check if employee is assigned to any active orders (handle both UUID and string IDs)
      const assignedOrders = await pool.query(`
        SELECT COUNT(*) FROM order_items oi 
        JOIN employees e ON oi.assigned_engineer_id = e.id 
        WHERE (e.id::text = $1 OR e.employee_id = $1)
      `, [id]);
      
      if (parseInt(assignedOrders.rows[0].count) > 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Cannot delete employee with active order assignments. Deactivate instead.'
        };
        return res.status(400).json(response);
      }
      
      const result = await pool.query('DELETE FROM employees WHERE (id::text = $1 OR employee_id = $1) RETURNING id', [id]);
      
      if (result.rows.length === 0) {
        const response: ApiResponse<null> = {
          success: false,
          error: 'Employee not found'
        };
        return res.status(404).json(response);
      }
      
      const response: ApiResponse<null> = {
        success: true,
        message: 'Employee deleted successfully'
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error deleting employee:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to delete employee'
      };
      res.status(500).json(response);
    }
  }


  // Get employees by expertise areas (supports multiple)
  static async getEmployeesByExpertise(req: Request, res: Response) {
    try {
      const { expertise } = req.params;
      const { active_only } = req.query;
      
      let query = `
        SELECT * FROM employees 
        WHERE (expert = $1 OR expertise_areas @> $2)
      `;
      const values = [expertise, JSON.stringify([expertise])];
      
      if (active_only === 'true') {
        query += ' AND is_active = true';
      }
      
      query += ' ORDER BY name ASC';
      
      const result = await pool.query(query, values);
      
      const response: ApiResponse<Employee[]> = {
        success: true,
        data: result.rows,
        message: `Found ${result.rows.length} employees with ${expertise} expertise`
      };
      
      res.json(response);
      
    } catch (error) {
      console.error('Error fetching employees by expertise:', error);
      const response: ApiResponse<null> = {
        success: false,
        error: 'Failed to fetch employees by expertise'
      };
      res.status(500).json(response);
    }
  }

  // Get available expertise areas
  static async getExpertiseAreas(_req: Request, res: Response) {
    try {
      // Get unique expertise areas from database
      const result = await pool.query(`
        SELECT DISTINCT jsonb_array_elements_text(expertise_areas) as expertise
        FROM employees 
        WHERE expertise_areas IS NOT NULL 
        AND jsonb_array_length(expertise_areas) > 0
        UNION
        SELECT DISTINCT expert as expertise
        FROM employees 
        WHERE expert IS NOT NULL 
        AND expert != ''
        ORDER BY expertise
      `);
      
      const expertiseAreas = result.rows.map(row => row.expertise);
      
      const response: ApiResponse<string[]> = {
        success: true,
        data: expertiseAreas,
        message: `Found ${expertiseAreas.length} expertise areas`
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