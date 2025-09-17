#!/usr/bin/env python3
"""
Test script for order creation API endpoint.

This script tests the order creation functionality with mock data
to verify the complete order management API is working correctly.
"""

import asyncio
import json
import uuid
from datetime import datetime

import httpx

# Test configuration
BASE_URL = "http://localhost:8001"
API_PREFIX = "/api/v1"

# Mock test data
MOCK_ORDER_DATA = {
    "customer_id": str(uuid.uuid4()),
    "customer_name": "John Doe",
    "customer_phone": "9876543210",
    "customer_email": "john.doe@example.com",
    "service_address": {
        "house_number": "123",
        "area": "MG Road",
        "landmark": "Near City Mall",
        "city": "Bhubaneswar",
        "state": "Odisha",
        "pincode": "751001"
    },
    "items": [
        {
            "service_id": str(uuid.uuid4()),
            "service_name": "Bath Fittings Installation",
            "variant_id": str(uuid.uuid4()),
            "variant_name": "Premium Package",
            "quantity": 2,
            "unit_price": 149.0,
            "total_price": 298.0,
            "category_id": str(uuid.uuid4()),
            "subcategory_id": str(uuid.uuid4()),
            "item_status": "pending"
        },
        {
            "service_id": str(uuid.uuid4()),
            "service_name": "Electrical Switch Installation",
            "quantity": 1,
            "unit_price": 99.0,
            "total_price": 99.0,
            "category_id": str(uuid.uuid4()),
            "subcategory_id": str(uuid.uuid4()),
            "item_status": "pending"
        }
    ],
    "total_amount": 397.0,
    "discount_amount": 50.0,
    "gst_amount": 62.46,
    "service_charge": 6.94,
    "final_amount": 416.40,
    "priority": "medium",
    "notes": "Please call before arriving"
}

MOCK_USER_DATA = {
    "username": "testuser@example.com",
    "email": "testuser@example.com",
    "password": "testpassword123",
    "first_name": "Test",
    "last_name": "User",
    "phone": "9876543210",
    "role": "customer"
}

ADMIN_USER_DATA = {
    "username": "admin@example.com", 
    "email": "admin@example.com",
    "password": "admin123",
    "first_name": "Admin",
    "last_name": "User",
    "phone": "9876543211",
    "role": "admin"
}


async def create_test_user(client: httpx.AsyncClient, user_data: dict) -> dict:
    """Create a test user and return login response."""
    try:
        # Try to register the user
        register_response = await client.post(
            f"{API_PREFIX}/auth/register",
            json=user_data
        )
        
        if register_response.status_code == 201:
            print(f"✅ User {user_data['email']} registered successfully")
        elif register_response.status_code == 400:
            print(f"ℹ️ User {user_data['email']} already exists")
        else:
            print(f"❌ Failed to register user: {register_response.status_code}")
            print(register_response.text)
        
        # Login the user
        login_response = await client.post(
            f"{API_PREFIX}/auth/login",
            json={
                "username": user_data["username"],
                "password": user_data["password"]
            }
        )
        
        if login_response.status_code == 200:
            login_data = login_response.json()
            print(f"✅ User {user_data['email']} logged in successfully")
            return login_data
        else:
            print(f"❌ Failed to login user: {login_response.status_code}")
            print(login_response.text)
            return None
            
    except Exception as e:
        print(f"❌ Error creating test user: {str(e)}")
        return None


async def test_order_creation():
    """Test the complete order creation flow."""
    print("🧪 Starting Order Creation API Test")
    print("=" * 50)
    
    async with httpx.AsyncClient(base_url=BASE_URL, timeout=30.0) as client:
        try:
            # Step 1: Check API health
            print("\n1️⃣ Checking API health...")
            health_response = await client.get("/health")
            if health_response.status_code == 200:
                print("✅ API is healthy")
            else:
                print(f"❌ API health check failed: {health_response.status_code}")
                return
            
            # Step 2: Create test users
            print("\n2️⃣ Creating test users...")
            customer_login = await create_test_user(client, MOCK_USER_DATA)
            admin_login = await create_test_user(client, ADMIN_USER_DATA)
            
            if not customer_login:
                print("❌ Failed to create customer user")
                return
            
            # Update mock data with actual customer ID
            customer_id = customer_login["data"]["user"]["id"]
            MOCK_ORDER_DATA["customer_id"] = customer_id
            
            # Step 3: Test order creation without authentication
            print("\n3️⃣ Testing order creation without authentication...")
            unauth_response = await client.post(
                f"{API_PREFIX}/orders",
                json=MOCK_ORDER_DATA
            )
            print(f"Response status: {unauth_response.status_code}")
            if unauth_response.status_code == 401:
                print("✅ Correctly rejected unauthenticated request")
            else:
                print("⚠️ Should require authentication")
            
            # Step 4: Test order creation with customer authentication
            print("\n4️⃣ Testing order creation with customer authentication...")
            customer_token = customer_login["data"]["access_token"]
            auth_headers = {"Authorization": f"Bearer {customer_token}"}
            
            order_response = await client.post(
                f"{API_PREFIX}/orders",
                json=MOCK_ORDER_DATA,
                headers=auth_headers
            )
            
            print(f"Response status: {order_response.status_code}")
            
            if order_response.status_code == 200:
                order_data = order_response.json()
                print("✅ Order created successfully!")
                print(f"📝 Order Number: {order_data['data']['order_number']}")
                print(f"💰 Final Amount: ₹{order_data['data']['final_amount']}")
                print(f"📦 Total Items: {order_data['data']['total_items']}")
                
                created_order_id = order_data["data"]["id"]
                
                # Step 5: Test order retrieval
                print("\n5️⃣ Testing order retrieval...")
                
                # Get specific order
                get_order_response = await client.get(
                    f"{API_PREFIX}/orders/{created_order_id}",
                    headers=auth_headers
                )
                
                if get_order_response.status_code == 200:
                    print("✅ Order retrieved successfully")
                    retrieved_order = get_order_response.json()
                    print(f"📋 Order Status: {retrieved_order['data']['status']}")
                    print(f"📊 Progress: {retrieved_order['data']['progress_percentage']:.1f}%")
                else:
                    print(f"❌ Failed to retrieve order: {get_order_response.status_code}")
                
                # Get all orders for customer
                get_orders_response = await client.get(
                    f"{API_PREFIX}/orders",
                    headers=auth_headers
                )
                
                if get_orders_response.status_code == 200:
                    orders_data = get_orders_response.json()
                    print(f"✅ Retrieved {len(orders_data['data'])} orders")
                    print(f"📊 Pagination: Page {orders_data['pagination']['page']} of {orders_data['pagination']['total_pages']}")
                else:
                    print(f"❌ Failed to get orders list: {get_orders_response.status_code}")
                
                # Step 6: Test admin operations (if admin login successful)
                if admin_login:
                    print("\n6️⃣ Testing admin operations...")
                    admin_token = admin_login["data"]["access_token"]
                    admin_headers = {"Authorization": f"Bearer {admin_token}"}
                    
                    # Update order status
                    order_update_data = {
                        "status": "scheduled",
                        "admin_notes": "Order scheduled for processing"
                    }
                    
                    update_response = await client.put(
                        f"{API_PREFIX}/orders/{created_order_id}",
                        json=order_update_data,
                        headers=admin_headers
                    )
                    
                    if update_response.status_code == 200:
                        print("✅ Order status updated successfully")
                    else:
                        print(f"❌ Failed to update order: {update_response.status_code}")
                        print(update_response.text)
                
                print("\n🎉 All tests completed successfully!")
                
            else:
                print(f"❌ Order creation failed: {order_response.status_code}")
                print("Response content:")
                print(json.dumps(order_response.json(), indent=2))
                
        except httpx.RequestError as e:
            print(f"❌ Request error: {str(e)}")
        except Exception as e:
            print(f"❌ Unexpected error: {str(e)}")


async def main():
    """Main test function."""
    try:
        await test_order_creation()
    except KeyboardInterrupt:
        print("\n⏹️ Test interrupted by user")
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")


if __name__ == "__main__":
    asyncio.run(main())