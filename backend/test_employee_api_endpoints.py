#!/usr/bin/env python3
"""
Test Employee API Endpoints
Quick test to verify that all employee API endpoints are working
"""

import requests
import json

BASE_URL = "http://localhost:8001/api"
HEADERS = {"Content-Type": "application/json"}

def test_get_employees():
    """Test GET /api/employees"""
    print("🧪 Testing GET /api/employees")
    
    try:
        response = requests.get(f"{BASE_URL}/employees", headers=HEADERS)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                employees = data.get('data', [])
                print(f"   ✅ SUCCESS: Found {len(employees)} employees")
                
                # Show first employee to verify structure
                if employees:
                    first_emp = employees[0]
                    print(f"   📋 Sample employee: {first_emp.get('name')} ({first_emp.get('employee_id')})")
                    print(f"      Expert: {first_emp.get('expert')}")
                    print(f"      Expertise Areas: {first_emp.get('expertise_areas')}")
                return True
            else:
                print(f"   ❌ API Error: {data.get('error')}")
                return False
        else:
            print(f"   ❌ HTTP Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False

def test_create_employee():
    """Test POST /api/employees"""
    print("\n🧪 Testing POST /api/employees")
    
    test_employee = {
        "employee_id": "TEST-API-001",
        "name": "API Test Employee",
        "expert": "Bath Fittings",
        "expertise_areas": ["Bath Fittings", "General Plumbing"],
        "manager": "API Test Manager",
        "phone": "9999999999",
        "email": "apitest@happyhomes.com",
        "is_active": True
    }
    
    try:
        response = requests.post(f"{BASE_URL}/employees", 
                               headers=HEADERS, 
                               data=json.dumps(test_employee))
        print(f"   Status: {response.status_code}")
        
        if response.status_code in [200, 201]:
            data = response.json()
            if data.get('success'):
                created_emp = data.get('data')
                print(f"   ✅ SUCCESS: Created employee {created_emp.get('id')}")
                print(f"      Name: {created_emp.get('name')}")
                print(f"      Expert: {created_emp.get('expert')}")
                print(f"      Expertise Areas: {created_emp.get('expertise_areas')}")
                return created_emp
            else:
                print(f"   ❌ API Error: {data.get('error')}")
                return None
        else:
            print(f"   ❌ HTTP Error: {response.text}")
            return None
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return None

def test_update_employee(employee_id):
    """Test PUT /api/employees/{id}"""
    print(f"\n🧪 Testing PUT /api/employees/{employee_id}")
    
    update_data = {
        "name": "Updated API Test Employee",
        "expertise_areas": ["Bath Fittings", "Wiring & Installation", "AC Cleaning"],
        "expert": "Multi-skilled Technician",
        "phone": "8888888888"
    }
    
    try:
        response = requests.put(f"{BASE_URL}/employees/{employee_id}",
                              headers=HEADERS,
                              data=json.dumps(update_data))
        print(f"   Status: {response.status_code}")
        print(f"   Response: {response.text}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                updated_emp = data.get('data')
                print(f"   ✅ SUCCESS: Updated employee")
                print(f"      Name: {updated_emp.get('name')}")
                print(f"      Expert: {updated_emp.get('expert')}")
                print(f"      Expertise Areas: {updated_emp.get('expertise_areas')}")
                return True
            else:
                print(f"   ❌ API Error: {data.get('error')}")
                return False
        else:
            print(f"   ❌ HTTP Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False

def test_get_employee_by_id(employee_id):
    """Test GET /api/employees/{id}"""
    print(f"\n🧪 Testing GET /api/employees/{employee_id}")
    
    try:
        response = requests.get(f"{BASE_URL}/employees/{employee_id}", headers=HEADERS)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                emp = data.get('data')
                print(f"   ✅ SUCCESS: Retrieved employee")
                print(f"      Name: {emp.get('name')}")
                print(f"      Expert: {emp.get('expert')}")
                print(f"      Expertise Areas: {emp.get('expertise_areas')}")
                return emp
            else:
                print(f"   ❌ API Error: {data.get('error')}")
                return None
        else:
            print(f"   ❌ HTTP Error: {response.text}")
            return None
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return None

def test_delete_employee(employee_id):
    """Test DELETE /api/employees/{id}"""
    print(f"\n🧪 Testing DELETE /api/employees/{employee_id}")
    
    try:
        response = requests.delete(f"{BASE_URL}/employees/{employee_id}", headers=HEADERS)
        print(f"   Status: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"   ✅ SUCCESS: Deleted employee")
                return True
            else:
                print(f"   ❌ API Error: {data.get('error')}")
                return False
        else:
            print(f"   ❌ HTTP Error: {response.text}")
            return False
    except Exception as e:
        print(f"   ❌ Exception: {e}")
        return False

def main():
    """Main test function"""
    print("🧪 Employee API Endpoints Test")
    print("=" * 40)
    
    # Test 1: Get all employees
    success_get_all = test_get_employees()
    
    # Test 2: Create employee
    created_employee = test_create_employee()
    
    if created_employee:
        employee_id = created_employee.get('id')
        
        # Test 3: Update employee
        success_update = test_update_employee(employee_id)
        
        # Test 4: Get employee by ID
        retrieved_employee = test_get_employee_by_id(employee_id)
        
        # Test 5: Delete employee
        success_delete = test_delete_employee(employee_id)
        
        # Summary
        print("\n" + "=" * 40)
        print("📋 Test Summary:")
        print(f"   GET All Employees: {'✅ PASS' if success_get_all else '❌ FAIL'}")
        print(f"   CREATE Employee: {'✅ PASS' if created_employee else '❌ FAIL'}")
        print(f"   UPDATE Employee: {'✅ PASS' if success_update else '❌ FAIL'}")
        print(f"   GET Employee by ID: {'✅ PASS' if retrieved_employee else '❌ FAIL'}")
        print(f"   DELETE Employee: {'✅ PASS' if success_delete else '❌ FAIL'}")
        
        all_passed = all([success_get_all, created_employee, success_update, 
                         retrieved_employee, success_delete])
        
        print(f"\n🎯 Overall Result: {'✅ ALL TESTS PASSED' if all_passed else '❌ SOME TESTS FAILED'}")
        return all_passed
    else:
        print("\n❌ Could not create test employee, skipping other tests")
        return False

if __name__ == "__main__":
    main()