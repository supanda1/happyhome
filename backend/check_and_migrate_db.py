#!/usr/bin/env python3
"""
Check Database Schema and Apply Migration
Checks if expertise_areas column exists and applies migration if needed
"""

import psycopg2
import os
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def get_db_connection():
    """Get database connection"""
    try:
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432'),
            database=os.getenv('DB_NAME', 'household_services'),
            user=os.getenv('DB_USER', 'household_user'),
            password=os.getenv('DB_PASSWORD', 'household_pass')
        )
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        return conn
    except Exception as e:
        print(f"❌ Database connection failed: {e}")
        print("💡 Make sure PostgreSQL is running and credentials are correct")
        return None

def check_column_exists(cursor, table_name, column_name):
    """Check if a column exists in a table"""
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.columns 
            WHERE table_name = %s AND column_name = %s
        );
    """, (table_name, column_name))
    return cursor.fetchone()[0]

def check_employees_table_structure(cursor):
    """Check the current structure of employees table"""
    print("🔍 Checking employees table structure...")
    
    try:
        cursor.execute("""
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'employees' 
            ORDER BY ordinal_position;
        """)
        
        columns = cursor.fetchall()
        if columns:
            print("✅ employees table exists with columns:")
            for col_name, data_type, is_nullable in columns:
                print(f"   - {col_name}: {data_type} ({'nullable' if is_nullable == 'YES' else 'not null'})")
            return True
        else:
            print("❌ employees table does not exist")
            return False
    except Exception as e:
        print(f"❌ Error checking table structure: {e}")
        return False

def add_expertise_areas_column(cursor):
    """Add expertise_areas column to employees table"""
    print("📝 Adding expertise_areas column...")
    
    try:
        # Add the new column
        cursor.execute("""
            ALTER TABLE employees 
            ADD COLUMN IF NOT EXISTS expertise_areas JSONB DEFAULT '[]'::jsonb;
        """)
        
        # Create index for better performance
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_employees_expertise_areas 
            ON employees USING GIN (expertise_areas);
        """)
        
        # Add check constraint (check if exists first)
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.table_constraints 
                WHERE constraint_name = 'check_expertise_areas_is_array'
                AND table_name = 'employees'
            );
        """)
        constraint_exists = cursor.fetchone()[0]
        
        if not constraint_exists:
            cursor.execute("""
                ALTER TABLE employees 
                ADD CONSTRAINT check_expertise_areas_is_array 
                CHECK (jsonb_typeof(expertise_areas) = 'array');
            """)
        
        print("✅ expertise_areas column added successfully")
        return True
    except Exception as e:
        print(f"❌ Error adding expertise_areas column: {e}")
        return False

def migrate_existing_data(cursor):
    """Migrate existing expert field data to expertise_areas"""
    print("🔄 Migrating existing data...")
    
    try:
        # Update existing records to have expertise_areas based on expert field
        cursor.execute("""
            UPDATE employees 
            SET expertise_areas = CASE 
                WHEN expert IS NOT NULL AND expert != '' 
                THEN jsonb_build_array(expert)
                ELSE '[]'::jsonb
            END
            WHERE expertise_areas IS NULL OR expertise_areas = '[]'::jsonb;
        """)
        
        rows_affected = cursor.rowcount
        print(f"✅ Migrated {rows_affected} employee records")
        return True
    except Exception as e:
        print(f"❌ Error migrating data: {e}")
        return False

def verify_migration(cursor):
    """Verify the migration was successful"""
    print("✅ Verifying migration...")
    
    try:
        cursor.execute("""
            SELECT id, employee_id, name, expert, expertise_areas
            FROM employees 
            LIMIT 5;
        """)
        
        employees = cursor.fetchall()
        print(f"📋 Sample employee data after migration:")
        for emp in employees:
            emp_id, employee_id, name, expert, expertise_areas = emp
            print(f"   {employee_id}: {name}")
            print(f"      Legacy expert: {expert}")
            print(f"      Expertise areas: {expertise_areas}")
            print()
        
        return True
    except Exception as e:
        print(f"❌ Error verifying migration: {e}")
        return False

def main():
    """Main migration function"""
    print("🛠️ Database Schema Check and Migration")
    print("=" * 50)
    
    # Connect to database
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Check if employees table exists
        if not check_employees_table_structure(cursor):
            print("❌ employees table not found. Please run the main table creation script first.")
            return False
        
        # Check if expertise_areas column exists
        expertise_areas_exists = check_column_exists(cursor, 'employees', 'expertise_areas')
        
        if expertise_areas_exists:
            print("✅ expertise_areas column already exists")
        else:
            print("📝 expertise_areas column not found, applying migration...")
            
            if not add_expertise_areas_column(cursor):
                return False
            
            if not migrate_existing_data(cursor):
                return False
        
        # Verify current state
        if not verify_migration(cursor):
            return False
        
        print("\n🎯 Database migration completed successfully!")
        print("   The employee update functionality should now work properly.")
        return True
        
    except Exception as e:
        print(f"❌ Migration error: {e}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    main()