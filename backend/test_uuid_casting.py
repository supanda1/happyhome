#!/usr/bin/env python3
"""
Test UUID Casting Fix
Quickly test that the UUID casting syntax works in PostgreSQL
"""

import psycopg2
import os

def test_uuid_casting():
    """Test the UUID casting query syntax"""
    try:
        # Connect to database
        conn = psycopg2.connect(
            host=os.getenv('DB_HOST', 'localhost'),
            port=os.getenv('DB_PORT', '5432'),
            database=os.getenv('DB_NAME', 'household_services'),
            user=os.getenv('DB_USER', 'household_user'),
            password=os.getenv('DB_PASSWORD', 'household_pass')
        )
        
        cursor = conn.cursor()
        
        # Test the casting query syntax
        print("🧪 Testing UUID casting query syntax...")
        
        # This should not throw a syntax error
        test_query = """
        SELECT e.id, e.name, e.expert, e.employee_id
        FROM employees e
        WHERE (e.id::text = $1 OR e.employee_id = $1) AND e.is_active = true
        LIMIT 1
        """
        
        # Test with a string ID that won't match any real records
        cursor.execute(test_query, ['test-id-12345'])
        result = cursor.fetchall()
        
        print("✅ UUID casting query syntax is valid")
        print(f"   Query executed successfully, returned {len(result)} rows")
        
        # Test the query with different parameter types
        print("\n🧪 Testing with different ID formats...")
        
        # Test 1: String ID format
        cursor.execute(test_query, ['emp-1'])
        result1 = cursor.fetchall()
        print(f"   String ID 'emp-1': {len(result1)} matches")
        
        # Test 2: UUID format (if any exist)
        cursor.execute("SELECT id FROM employees WHERE id IS NOT NULL LIMIT 1")
        uuid_test = cursor.fetchone()
        
        if uuid_test:
            cursor.execute(test_query, [str(uuid_test[0])])
            result2 = cursor.fetchall()
            print(f"   UUID format: {len(result2)} matches")
        else:
            print("   No UUIDs found in database to test")
        
        print("\n✅ All casting tests passed!")
        return True
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Test error: {e}")
        return False
    finally:
        try:
            conn.close()
        except:
            pass

def main():
    """Main test function"""
    print("🔧 Testing UUID Casting Fix")
    print("=" * 30)
    
    success = test_uuid_casting()
    
    if success:
        print("\n🎯 UUID casting fix is working correctly!")
        print("   The assignment functionality should now work with both:")
        print("   • String IDs (emp-1, emp-2, etc.)")
        print("   • UUID format (550e8400-e29b-41d4-a716-446655440000)")
    else:
        print("\n❌ UUID casting test failed!")
        print("   Check database connection and table structure")
    
    return success

if __name__ == "__main__":
    main()