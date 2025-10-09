/**
 * Database Schema Adapter - Environment-Agnostic Database Operations
 * 
 * This adapter handles the inconsistency between different database schemas
 * across environments without hardcoding type casts everywhere.
 * 
 * Problems this solves:
 * 1. Mixed ID types: some tables use VARCHAR, others use UUID
 * 2. Missing tables in different environments  
 * 3. Column name differences between environments
 * 4. Hardcoded JOIN conditions that break deployment
 */

import pool from './database';

interface TableSchema {
  name: string;
  exists: boolean;
  columns: {
    [key: string]: {
      type: 'uuid' | 'varchar' | 'integer' | 'timestamp' | 'boolean' | 'text' | 'decimal';
      nullable: boolean;
    };
  };
}

interface SchemaMapping {
  [tableName: string]: TableSchema;
}

class DatabaseAdapter {
  private schemaCache: SchemaMapping = {};
  private initialized = false;

  /**
   * Initialize the adapter by detecting current database schema
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;
    
    console.log('🔍 Initializing Database Schema Adapter...');
    
    // Detect all tables and their schemas
    const tables = [
      'services', 'service_categories', 'service_subcategories',
      'categories', 'subcategories', 'users', 'orders', 'order_items',
      'coupons', 'reviews', 'employees'
    ];
    
    for (const tableName of tables) {
      await this.detectTableSchema(tableName);
    }
    
    this.initialized = true;
    console.log('✅ Database Schema Adapter initialized');
    console.log('📊 Detected schemas:', Object.keys(this.schemaCache));
  }

  /**
   * Detect if table exists and get its schema
   */
  private async detectTableSchema(tableName: string): Promise<void> {
    try {
      const result = await pool.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = $1 AND table_schema = 'public'
        ORDER BY ordinal_position
      `, [tableName]);

      if (result.rows.length === 0) {
        this.schemaCache[tableName] = { name: tableName, exists: false, columns: {} };
        return;
      }

      const columns: { [key: string]: any } = {};
      for (const row of result.rows) {
        const pgType = row.data_type;
        let mappedType: string;
        
        // Map PostgreSQL types to our standard types
        if (pgType === 'uuid') mappedType = 'uuid';
        else if (pgType.includes('character')) mappedType = 'varchar';
        else if (pgType.includes('integer')) mappedType = 'integer';
        else if (pgType.includes('timestamp')) mappedType = 'timestamp';
        else if (pgType === 'boolean') mappedType = 'boolean';
        else if (pgType === 'text') mappedType = 'text';
        else if (pgType === 'numeric') mappedType = 'decimal';
        else mappedType = 'varchar'; // fallback
        
        columns[row.column_name] = {
          type: mappedType,
          nullable: row.is_nullable === 'YES'
        };
      }

      this.schemaCache[tableName] = {
        name: tableName,
        exists: true,
        columns
      };
      
    } catch (error) {
      console.log(`⚠️ Table ${tableName} does not exist or is inaccessible`);
      this.schemaCache[tableName] = { name: tableName, exists: false, columns: {} };
    }
  }

  /**
   * Check if table exists
   */
  tableExists(tableName: string): boolean {
    return this.schemaCache[tableName]?.exists || false;
  }

  /**
   * Get column type for a table
   */
  getColumnType(tableName: string, columnName: string): string | null {
    const table = this.schemaCache[tableName];
    if (!table?.exists) return null;
    return table.columns[columnName]?.type || null;
  }

  /**
   * Generate safe JOIN condition between two tables
   * Handles type casting automatically
   */
  safeJoin(
    leftTable: string, 
    leftColumn: string, 
    rightTable: string, 
    rightColumn: string
  ): string {
    const leftType = this.getColumnType(leftTable, leftColumn);
    const rightType = this.getColumnType(rightTable, rightColumn);
    
    if (!leftType || !rightType) {
      // Fallback to basic join if we can't detect types
      return `${leftTable}.${leftColumn} = ${rightTable}.${rightColumn}`;
    }
    
    // Handle type mismatches
    if (leftType === rightType) {
      // Same types - direct comparison
      return `${leftTable}.${leftColumn} = ${rightTable}.${rightColumn}`;
    } else if (leftType === 'varchar' && rightType === 'uuid') {
      // varchar = uuid: cast uuid to text
      return `${leftTable}.${leftColumn} = ${rightTable}.${rightColumn}::text`;
    } else if (leftType === 'uuid' && rightType === 'varchar') {
      // uuid = varchar: cast uuid to text  
      return `${leftTable}.${leftColumn}::text = ${rightTable}.${rightColumn}`;
    } else {
      // Other mismatches - try casting both to text
      return `${leftTable}.${leftColumn}::text = ${rightTable}.${rightColumn}::text`;
    }
  }

  /**
   * Execute query with optional table existence check
   */
  async safeQuery(query: string, params: any[] = [], requiredTables: string[] = []): Promise<any> {
    await this.ensureInitialized();
    
    // Check if all required tables exist
    for (const table of requiredTables) {
      if (!this.tableExists(table)) {
        console.log(`⚠️ Skipping query - table ${table} does not exist`);
        return { rows: [] };
      }
    }
    
    return await pool.query(query, params);
  }

  /**
   * Get table name with fallback
   * Useful when different environments have different table names
   */
  getTableName(preferredName: string, fallbackName?: string): string {
    if (this.tableExists(preferredName)) return preferredName;
    if (fallbackName && this.tableExists(fallbackName)) return fallbackName;
    return preferredName; // Return preferred even if it doesn't exist
  }

  /**
   * Build dynamic query with proper JOINs based on detected schema
   */
  buildServicesQuery(): string {
    // Note: This method assumes adapter is already initialized
    // Call await dbAdapter.initialize() before using this method
    
    const categoriesTable = this.getTableName('service_categories', 'categories');
    const subcategoriesTable = this.getTableName('service_subcategories', 'subcategories');
    
    // Get type-aware JOIN conditions but replace table names with aliases
    const categoryJoinBase = this.safeJoin('services', 'category_id', categoriesTable, 'id');
    const subcategoryJoinBase = this.safeJoin('services', 'subcategory_id', subcategoriesTable, 'id');
    
    // Replace actual table names with aliases in the generated JOIN conditions
    const categoryJoin = categoryJoinBase.replace('services.', 's.').replace(`${categoriesTable}.`, 'sc.');
    const subcategoryJoin = subcategoryJoinBase.replace('services.', 's.').replace(`${subcategoriesTable}.`, 'ss.');
    
    return `
      SELECT 
        s.id, s.name, s.description, s.short_description,
        s.base_price, s.discounted_price, s.duration,
        s.is_active, s.is_featured, s.rating, s.review_count,
        s.booking_count, s.category_id, s.subcategory_id,
        s.inclusions, s.exclusions, s.requirements, s.tags,
        s.gst_percentage, s.service_charge, s.image_paths,
        s.created_at, s.updated_at,
        sc.name as category_name, sc.icon as category_icon,
        ss.name as subcategory_name, ss.icon as subcategory_icon
      FROM services s
      LEFT JOIN ${categoriesTable} sc ON ${categoryJoin}
      LEFT JOIN ${subcategoriesTable} ss ON ${subcategoryJoin}
    `;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      await this.initialize();
    }
  }

  /**
   * Get schema information for debugging
   */
  getSchemaInfo(): SchemaMapping {
    return this.schemaCache;
  }
}

// Export singleton instance
export const dbAdapter = new DatabaseAdapter();
export default dbAdapter;