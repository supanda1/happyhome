#!/usr/bin/env python3
"""
Setup Assignment Tables
Creates the assignment_history table if it doesn't exist
"""

import psycopg2
import os
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def get_db_connection():
    """Get database connection"""
    try:
        # Try to get connection parameters from environment or use defaults
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
        return None

def check_table_exists(cursor, table_name):
    """Check if a table exists"""
    cursor.execute("""
        SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_name = %s
        );
    """, (table_name,))
    return cursor.fetchone()[0]

def create_assignment_history_table(cursor):
    """Create the assignment_history table"""
    sql = """
    -- Create assignment history table for tracking engineer assignments
    CREATE TABLE IF NOT EXISTS assignment_history (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        
        -- Reference to order and item
        order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
        item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
        
        -- Engineer information
        engineer_id UUID REFERENCES employees(id),
        engineer_name VARCHAR(100) NOT NULL,
        
        -- Assignment action details
        action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('assigned', 'reassigned', 'unassigned')),
        notes TEXT,
        
        -- Tracking information
        created_by VARCHAR(50) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Create indexes for better performance
    CREATE INDEX IF NOT EXISTS idx_assignment_history_order_id ON assignment_history(order_id);
    CREATE INDEX IF NOT EXISTS idx_assignment_history_item_id ON assignment_history(item_id);
    CREATE INDEX IF NOT EXISTS idx_assignment_history_engineer_id ON assignment_history(engineer_id);
    CREATE INDEX IF NOT EXISTS idx_assignment_history_action_type ON assignment_history(action_type);
    CREATE INDEX IF NOT EXISTS idx_assignment_history_created_at ON assignment_history(created_at);
    CREATE INDEX IF NOT EXISTS idx_assignment_history_order_item ON assignment_history(order_id, item_id);

    -- Comments for documentation
    COMMENT ON TABLE assignment_history IS 'Tracks all engineer assignment changes for orders';
    COMMENT ON COLUMN assignment_history.action_type IS 'Type of assignment action: assigned, reassigned, or unassigned';
    COMMENT ON COLUMN assignment_history.notes IS 'Additional notes about the assignment change';
    COMMENT ON COLUMN assignment_history.created_by IS 'User or system that made the assignment change';
    """
    
    try:
        cursor.execute(sql)
        print("✅ Assignment history table created successfully")
        return True
    except Exception as e:
        print(f"❌ Failed to create assignment history table: {e}")
        return False

def main():
    """Main setup function"""
    print("🛠️ Setting up Assignment Tables")
    print("=" * 40)
    
    # Connect to database
    conn = get_db_connection()
    if not conn:
        return False
    
    try:
        cursor = conn.cursor()
        
        # Check if assignment_history table exists
        if check_table_exists(cursor, 'assignment_history'):
            print("✅ Assignment history table already exists")
        else:
            print("📝 Creating assignment history table...")
            create_assignment_history_table(cursor)
        
        # Check required tables exist
        required_tables = ['orders', 'order_items', 'employees']
        for table in required_tables:
            if check_table_exists(cursor, table):
                print(f"✅ Required table '{table}' exists")
            else:
                print(f"❌ Required table '{table}' missing - please run order table setup first")
                return False
        
        print("\n🎯 Assignment table setup completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Setup error: {e}")
        return False
    finally:
        conn.close()

if __name__ == "__main__":
    main()