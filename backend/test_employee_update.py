#!/usr/bin/env python3
"""
Test Employee Update Functionality
Tests the employee update API endpoints to debug the update issue
"""

import requests
import json
import uuid

# Configuration
BASE_URL = "http://localhost:8001/api"
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

def get_employees():
    """Get all employees to see current data"""
    try:
        response = requests.get(f"{BASE_URL}/employees", headers=HEADERS)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                employees = result.get('data', [])
                print(f"✅ Found {len(employees)} employees")
                return employees
            else:
                print(f"❌ API returned error: {result.get('error')}")
                return []
        else:
            print(f"❌ Failed to get employees: {response.status_code}")
            print(f"   Response: {response.text}")
            return []
    except Exception as e:
        print(f"❌ Error getting employees: {e}")
        return []

def test_employee_update(employee_id, update_data):
    """Test updating an employee"""
    print(f"\n🧪 Testing employee update for ID: {employee_id}")
    print(f"   Update data: {json.dumps(update_data, indent=2)}")
    
    try:
        response = requests.put(
            f"{BASE_URL}/employees/{employee_id}",
            headers=HEADERS,
            data=json.dumps(update_data)
        )
        
        print(f"   Status Code: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ Update API returned success")
                return result.get('data')
            else:
                print(f"❌ Update failed: {result.get('error')}")
                return None
        else:
            print(f"❌ Update request failed: {response.status_code}")
            return None
    except Exception as e:
        print(f"❌ Update error: {e}")
        return None

def verify_update(employee_id, expected_changes):
    """Verify that the update actually persisted by fetching the employee again"""
    print(f"\n🔍 Verifying update for employee {employee_id}")
    
    try:
        response = requests.get(f"{BASE_URL}/employees/{employee_id}", headers=HEADERS)
        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                employee = result.get('data')
                print(f"✅ Retrieved updated employee data")
                
                # Check if expected changes are present
                verification_passed = True
                for field, expected_value in expected_changes.items():
                    actual_value = employee.get(field)
                    if actual_value != expected_value:
                        print(f"❌ Field '{field}': expected '{expected_value}', got '{actual_value}'")
                        verification_passed = False
                    else:
                        print(f"✅ Field '{field}': correctly updated to '{actual_value}'")
                
                return verification_passed
            else:
                print(f"❌ Failed to retrieve employee: {result.get('error')}")
                return False
        else:
            print(f"❌ Failed to retrieve employee: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Verification error: {e}")
        return False

def create_test_employee():
    """Create a test employee for updating"""
    test_employee = {
        "employee_id": f"TEST-{uuid.uuid4().hex[:8].upper()}",
        "name": "Test Employee",
        "expert": "General Plumbing",
        "expertise_areas": ["Bath Fittings", "General Plumbing"],
        "manager": "Test Manager",
        "phone": "9999999999",
        "email": "test@happyhomes.com",
        "is_active": True
    }
    
    try:
        response = requests.post(
            f"{BASE_URL}/employees",
            headers=HEADERS,
            data=json.dumps(test_employee)
        )
        
        if response.status_code in [200, 201]:
            result = response.json()
            if result.get('success'):
                created_employee = result.get('data')
                print(f"✅ Test employee created: {created_employee['id']}")
                return created_employee
            else:
                print(f"❌ Failed to create test employee: {result.get('error')}")
                return None
        else:
            print(f"❌ Employee creation failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return None
    except Exception as e:
        print(f"❌ Employee creation error: {e}")
        return None

def cleanup_test_employee(employee_id):
    """Clean up test employee"""
    try:
        response = requests.delete(f"{BASE_URL}/employees/{employee_id}", headers=HEADERS)
        if response.status_code == 200:
            print(f"🧹 Test employee {employee_id} deleted")
        else:
            print(f"⚠️ Failed to delete test employee: {response.status_code}")
    except Exception as e:
        print(f"⚠️ Cleanup error: {e}")

def main():
    """Main test function"""
    print("🧪 Testing Employee Update Functionality")
    print("=" * 50)
    
    # Step 1: Test API connection
    if not test_api_connection():
        return
    
    # Step 2: Get current employees
    print(f"\n📋 Getting current employees...")
    employees = get_employees()
    
    # Step 3: Create test employee
    print(f"\n👤 Creating test employee...")
    test_employee = create_test_employee()
    if not test_employee:
        return
    
    employee_id = test_employee['id']
    
    try:
        # Step 4: Test basic update
        print(f"\n🧪 Test 1: Basic field update")
        update_data = {
            "name": "Updated Test Employee",
            "phone": "8888888888"
        }
        updated_employee = test_employee_update(employee_id, update_data)
        
        if updated_employee:
            verify_update(employee_id, {
                "name": "Updated Test Employee",
                "phone": "8888888888"
            })
        
        # Step 5: Test expertise areas update
        print(f"\n🧪 Test 2: Expertise areas update")
        update_data = {
            "expertise_areas": ["Bath Fittings", "Wiring & Installation", "AC Cleaning"],
            "expert": "Multi-skilled Technician"
        }
        updated_employee = test_employee_update(employee_id, update_data)
        
        if updated_employee:
            verify_update(employee_id, {
                "expert": "Multi-skilled Technician",
                "expertise_areas": ["Bath Fittings", "Wiring & Installation", "AC Cleaning"]
            })
        
        # Step 6: Test using string ID (like emp-1)
        print(f"\n🧪 Test 3: Update using string-based ID")
        # Try to find an employee with string ID format
        string_id_employee = None
        for emp in employees:
            if emp.get('employee_id', '').startswith('EMP') or emp.get('id', '').startswith('emp-'):
                string_id_employee = emp
                break
        
        if string_id_employee:
            test_id = string_id_employee.get('employee_id') or string_id_employee.get('id')
            update_data = {
                "name": f"Updated {string_id_employee.get('name', 'Employee')}"
            }
            test_employee_update(test_id, update_data)
        else:
            print("   No string-format employee ID found to test")
        
        print(f"\n" + "=" * 50)
        print("🎯 Employee Update Test Summary:")
        print("   - Basic field updates")
        print("   - Multi-expertise area updates") 
        print("   - String ID format compatibility")
        print("   - Database persistence verification")
        
    finally:
        # Cleanup
        print(f"\n🧹 Cleaning up...")
        cleanup_test_employee(employee_id)

if __name__ == "__main__":
    main()