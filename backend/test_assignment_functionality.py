#!/usr/bin/env python3
"""
Test Assignment Functionality
Tests the engineer assignment API endpoints with various ID formats
"""

import requests
import json
import uuid
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:8001/api/v1"
HEADERS = {"Content-Type": "application/json"}

def test_api_connection():
    """Test if the API is accessible"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ API connection successful")
            return True
        else:
            print(f"❌ API connection failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ API connection error: {e}")
        return False

def create_test_employee():
    """Create a test employee for assignment testing"""
    employee_data = {
        "employee_id": "emp-test-1",
        "name": "Test Engineer",
        "expert": "Plumbing",
        "manager": "Test Manager",
        "phone": "9999999999",
        "email": "test@engineer.com",
        "is_active": True
    }
    
    try:
        response = requests.post(f"{BASE_URL}/employees", 
                               headers=HEADERS, 
                               data=json.dumps(employee_data))
        if response.status_code in [200, 201]:
            result = response.json()
            if result.get('success'):
                print(f"✅ Test employee created: {result['data']['id']}")
                return result['data']
            else:
                print(f"❌ Failed to create test employee: {result.get('error')}")
                return None
        else:
            print(f"❌ Employee creation failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Employee creation error: {e}")
        return None

def create_test_order():
    """Create a test order for assignment testing"""
    order_data = {
        "customer_id": str(uuid.uuid4()),
        "customer_name": "Test Customer",
        "customer_phone": "9876543210",
        "customer_email": "test@customer.com",
        "service_address": {
            "house_number": "123",
            "area": "Test Area",
            "city": "Test City",
            "state": "Test State",
            "pincode": "123456"
        },
        "items": [{
            "service_id": str(uuid.uuid4()),
            "service_name": "Test Plumbing Service",
            "quantity": 1,
            "unit_price": 500.00,
            "total_price": 500.00,
            "category_id": "cat-1",  # Plumbing category
            "subcategory_id": "sub-1",
            "item_status": "pending"
        }],
        "total_amount": 500.00,
        "discount_amount": 0.00,
        "gst_amount": 90.00,
        "service_charge": 50.00,
        "final_amount": 640.00,
        "priority": "medium",
        "notes": "Test order for assignment functionality"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/orders", 
                               headers=HEADERS, 
                               data=json.dumps(order_data))
        if response.status_code in [200, 201]:
            result = response.json()
            if result.get('success'):
                print(f"✅ Test order created: {result['data']['order_number']}")
                return result['data']
            else:
                print(f"❌ Failed to create test order: {result.get('error')}")
                return None
        else:
            print(f"❌ Order creation failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Order creation error: {e}")
        return None

def test_assignment_with_string_id(order_id, item_id, engineer_employee_id):
    """Test assignment using string-based employee ID (emp-1 format)"""
    assignment_data = {
        "engineer_id": engineer_employee_id,  # Use string ID like "emp-1"
        "notes": "Test assignment with string ID"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/orders/{order_id}/items/{item_id}/assign",
                               headers=HEADERS,
                               data=json.dumps(assignment_data))
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"✅ Assignment with string ID successful")
                print(f"   Engineer: {result['data']['engineer_details']['name']}")
                print(f"   UUID used: {result['data']['engineer_details']['id']}")
                return True
            else:
                print(f"❌ Assignment failed: {result.get('error')}")
                return False
        else:
            print(f"❌ Assignment request failed: {response.status_code}")
            if response.text:
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data.get('error', 'Unknown error')}")
                except:
                    print(f"   Raw error: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Assignment error: {e}")
        return False

def test_assignment_with_uuid(order_id, item_id, engineer_uuid):
    """Test assignment using UUID-based employee ID"""
    assignment_data = {
        "engineer_id": engineer_uuid,  # Use UUID
        "notes": "Test assignment with UUID"
    }
    
    try:
        response = requests.post(f"{BASE_URL}/orders/{order_id}/items/{item_id}/assign",
                               headers=HEADERS,
                               data=json.dumps(assignment_data))
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print(f"✅ Assignment with UUID successful")
                print(f"   Engineer: {result['data']['engineer_details']['name']}")
                return True
            else:
                print(f"❌ Assignment failed: {result.get('error')}")
                return False
        else:
            print(f"❌ Assignment request failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Assignment error: {e}")
        return False

def get_assignment_history(order_id, item_id):
    """Test getting assignment history"""
    try:
        response = requests.get(f"{BASE_URL}/orders/{order_id}/items/{item_id}/assignments/history")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                history = result.get('data', [])
                print(f"✅ Assignment history retrieved: {len(history)} entries")
                for entry in history:
                    print(f"   {entry['created_at']}: {entry['action_type']} - {entry['engineer_name']}")
                return True
            else:
                print(f"❌ Failed to get history: {result.get('error')}")
                return False
        else:
            print(f"❌ History request failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ History error: {e}")
        return False

def cleanup_test_data(order_id, employee_id):
    """Clean up test data"""
    try:
        # Delete order
        requests.delete(f"{BASE_URL}/orders/{order_id}")
        print("🧹 Test order deleted")
        
        # Delete employee
        requests.delete(f"{BASE_URL}/employees/{employee_id}")
        print("🧹 Test employee deleted")
    except Exception as e:
        print(f"⚠️ Cleanup error: {e}")

def main():
    """Main test function"""
    print("🧪 Starting Assignment Functionality Tests")
    print("=" * 50)
    
    # Step 1: Test API connection
    if not test_api_connection():
        return
    
    # Step 2: Create test employee
    employee = create_test_employee()
    if not employee:
        return
    
    # Step 3: Create test order
    order = create_test_order()
    if not order:
        return
    
    # Step 4: Test assignment with string ID (emp-1 format)
    print("\n🔧 Testing Assignment with String ID (emp-test-1)...")
    item_id = order['items'][0]['id']
    success_string = test_assignment_with_string_id(
        order['id'], 
        item_id, 
        employee['employee_id']  # This should be "emp-test-1"
    )
    
    # Step 5: Test assignment with UUID
    print(f"\n🔧 Testing Assignment with UUID ({employee['id']})...")
    success_uuid = test_assignment_with_uuid(
        order['id'], 
        item_id, 
        employee['id']  # This should be the actual UUID
    )
    
    # Step 6: Test assignment history
    print(f"\n📊 Testing Assignment History...")
    success_history = get_assignment_history(order['id'], item_id)
    
    # Results summary
    print("\n" + "=" * 50)
    print("📋 Test Results Summary:")
    print(f"   String ID Assignment: {'✅ PASS' if success_string else '❌ FAIL'}")
    print(f"   UUID Assignment: {'✅ PASS' if success_uuid else '❌ FAIL'}")
    print(f"   Assignment History: {'✅ PASS' if success_history else '❌ FAIL'}")
    
    overall_success = success_string and success_uuid and success_history
    print(f"\n🎯 Overall Result: {'✅ ALL TESTS PASSED' if overall_success else '❌ SOME TESTS FAILED'}")
    
    # Cleanup
    print(f"\n🧹 Cleaning up test data...")
    cleanup_test_data(order['id'], employee['id'])
    
    return overall_success

if __name__ == "__main__":
    main()