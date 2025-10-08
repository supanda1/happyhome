"""
Comprehensive dummy FastAPI app for Railway.
Includes all APIs needed by frontend with dummy data.
"""
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
from datetime import datetime, timedelta
import uuid

print("🚀 COMPREHENSIVE FASTAPI STARTING")
print(f"PORT: {os.getenv('PORT', 'NOT SET')}")
print("This is the COMPREHENSIVE app with ALL dummy APIs")

app = FastAPI(title="Happy Homes Comprehensive API", version="2.0.0")

# CORS for Vercel frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://happyhome-zeta.vercel.app",
        "http://localhost:3000", 
        "http://localhost:3001",
        "*"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Models
class User(BaseModel):
    id: str
    email: str
    firstName: str
    lastName: str
    phone: str
    role: str = "customer"
    isActive: bool = True
    createdAt: str
    updatedAt: str

class LoginRequest(BaseModel):
    email: str
    password: str

class RegisterRequest(BaseModel):
    email: str
    password: str
    firstName: str
    lastName: str
    phone: str
    role: Optional[str] = "customer"

class Category(BaseModel):
    id: str
    name: str
    description: str
    icon: str
    isActive: bool = True
    sortOrder: int
    createdAt: str
    updatedAt: str

class Service(BaseModel):
    id: str
    name: str
    category_id: str
    category_name: str
    subcategory_name: Optional[str] = None
    description: str
    short_description: Optional[str] = None
    base_price: float
    discounted_price: Optional[float] = None
    rating: Optional[float] = 4.5
    review_count: Optional[int] = 0
    booking_count: Optional[int] = 0
    is_active: bool = True
    tags: Optional[List[str]] = []
    inclusions: Optional[List[str]] = []
    exclusions: Optional[List[str]] = []
    requirements: Optional[List[str]] = []
    services: Optional[List[str]] = []
    notes: Optional[str] = None
    warranty: Optional[str] = None
    gallery_images: Optional[List[str]] = []
    images: Optional[List[str]] = []
    faq: Optional[List[Dict[str, str]]] = []

class Employee(BaseModel):
    id: str
    employee_id: str
    name: str
    expert: str
    expertise_areas: Optional[List[str]] = None
    phone: str
    email: str
    is_active: bool = True
    created_at: str
    updated_at: str

class CartItem(BaseModel):
    id: str
    serviceId: str
    serviceName: str
    quantity: int = 1
    basePrice: float
    totalPrice: float

class Order(BaseModel):
    id: str
    order_number: str
    customer_name: str
    customer_phone: str
    customer_email: str
    status: str = "pending"
    priority: str = "medium"
    total_amount: float
    created_at: str
    updated_at: str
    items: List[Dict[str, Any]] = []

# Sample Data
SAMPLE_USERS = [
    User(
        id="user1",
        email="john@example.com",
        firstName="John",
        lastName="Doe", 
        phone="+1234567890",
        role="customer",
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    ),
    User(
        id="admin1",
        email="admin@happyhomes.com",
        firstName="Admin",
        lastName="User",
        phone="+1234567899",
        role="admin",
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    ),
    User(
        id="superadmin1",
        email="superadmin@happyhomes.com",
        firstName="Super",
        lastName="Admin",
        phone="+1234567888",
        role="superadmin",
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    )
]

SAMPLE_CATEGORIES = [
    Category(
        id="b181c7f3-03cd-43ea-9fcd-85368fbfa628",
        name="Plumbing",
        description="Professional plumbing repair and installation services",
        icon="🔧",
        sortOrder=1,
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    ),
    Category(
        id="5750b6f5-0a36-4839-8b5d-783aa5f4a40a",
        name="Electrical",
        description="Expert electrical installation and repair services",
        icon="⚡",
        sortOrder=2,
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    ),
    Category(
        id="48857699-7785-4875-a787-d1f0b7d2f28c",
        name="Cleaning",
        description="Professional home and office cleaning services",
        icon="🧽",
        sortOrder=3,
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    ),
    Category(
        id="f9c8e7d6-5a4b-3c2d-1e0f-9g8h7i6j5k4l",
        name="HVAC",
        description="Heating, ventilation, and air conditioning services",
        icon="❄️",
        sortOrder=4,
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    )
]

SAMPLE_SERVICES = [
    Service(
        id="svc1",
        name="Basic Plumbing Repair",
        category_id="b181c7f3-03cd-43ea-9fcd-85368fbfa628",
        category_name="Plumbing",
        description="Fix leaky faucets, unclog drains, and minor pipe repairs",
        short_description="Quick plumbing fixes",
        base_price=75.0,
        discounted_price=65.0,
        rating=4.8,
        review_count=127,
        booking_count=342,
        tags=["repair", "emergency", "affordable"],
        inclusions=["Diagnosis", "Basic repair", "1-year warranty"],
        exclusions=["Parts cost", "Major installations"],
        warranty="1 year on labor"
    ),
    Service(
        id="svc2",
        name="Electrical Installation",
        category_id="5750b6f5-0a36-4839-8b5d-783aa5f4a40a",
        category_name="Electrical",
        description="Professional electrical wiring and outlet installation",
        short_description="Safe electrical work",
        base_price=120.0,
        discounted_price=100.0,
        rating=4.9,
        review_count=89,
        booking_count=156,
        tags=["installation", "certified", "safety"],
        inclusions=["Safety inspection", "Professional installation", "Code compliance"],
        exclusions=["Electrical permits", "Major rewiring"]
    ),
    Service(
        id="svc3",
        name="Deep House Cleaning",
        category_id="48857699-7785-4875-a787-d1f0b7d2f28c",
        category_name="Cleaning",
        description="Complete deep cleaning service for your entire home",
        short_description="Thorough home cleaning",
        base_price=150.0,
        discounted_price=130.0,
        rating=4.7,
        review_count=203,
        booking_count=445,
        tags=["deep-clean", "eco-friendly", "insured"],
        inclusions=["All rooms", "Kitchen deep clean", "Bathroom sanitization"],
        exclusions=["Window cleaning", "Carpet shampooing"]
    ),
    Service(
        id="svc4",
        name="AC Installation & Repair",
        category_id="f9c8e7d6-5a4b-3c2d-1e0f-9g8h7i6j5k4l",
        category_name="HVAC",
        description="Professional air conditioning installation and repair services",
        short_description="AC installation & repair",
        base_price=200.0,
        discounted_price=180.0,
        rating=4.8,
        review_count=156,
        booking_count=234,
        tags=["hvac", "cooling", "energy-efficient"],
        inclusions=["Installation", "Basic repair", "System testing"],
        exclusions=["AC unit cost", "Electrical work"],
        warranty="2 years on labor"
    ),
    Service(
        id="svc5",
        name="Bathroom Deep Clean",
        category_id="48857699-7785-4875-a787-d1f0b7d2f28c",
        category_name="Cleaning",
        description="Specialized bathroom deep cleaning and sanitization",
        short_description="Bathroom deep clean",
        base_price=80.0,
        rating=4.6,
        review_count=134,
        booking_count=267,
        tags=["bathroom", "sanitization", "deep-clean"],
        inclusions=["Tile cleaning", "Grout cleaning", "Fixture polishing"],
        exclusions=["Drain unclogging", "Plumbing repairs"]
    )
]

SAMPLE_EMPLOYEES = [
    Employee(
        id="emp1",
        employee_id="EMP001",
        name="Mike Wilson",
        expert="Plumbing",
        expertise_areas=["Plumbing", "Pipe Repair", "Faucet Installation"],
        phone="+1234567801",
        email="mike.wilson@happyhomes.com",
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    ),
    Employee(
        id="emp2",
        employee_id="EMP002",
        name="Sarah Johnson",
        expert="Electrical",
        expertise_areas=["Electrical", "Wiring", "Panel Installation"],
        phone="+1234567802",
        email="sarah.johnson@happyhomes.com",
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    ),
    Employee(
        id="emp3",
        employee_id="EMP003",
        name="Carlos Rodriguez",
        expert="Cleaning",
        expertise_areas=["Cleaning", "Deep Cleaning", "Sanitization"],
        phone="+1234567803",
        email="carlos.rodriguez@happyhomes.com",
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    ),
    Employee(
        id="emp4",
        employee_id="EMP004",
        name="David Chen",
        expert="HVAC",
        expertise_areas=["HVAC", "AC Installation", "Heating Systems"],
        phone="+1234567804",
        email="david.chen@happyhomes.com",
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    ),
    Employee(
        id="emp5",
        employee_id="EMP005",
        name="Jennifer Brown",
        expert="Plumbing",
        expertise_areas=["Plumbing", "Bathroom Renovation", "Water Heaters"],
        phone="+1234567805",
        email="jennifer.brown@happyhomes.com",
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat()
    )
]

# Root endpoint
@app.get("/")
def root():
    return {
        "message": "✅ Happy Homes Comprehensive API Working!",
        "status": "success",
        "app": "comprehensive_version",
        "version": "2.0.0",
        "port": os.getenv("PORT", "unknown"),
        "endpoints": {
            "auth": "/api/auth/*",
            "categories": "/categories",
            "services": "/services",
            "orders": "/orders",
            "employees": "/employees",
            "health": "/health"
        }
    }

# Health endpoints
@app.get("/health")
def health():
    return {"alive": True, "status": "healthy", "timestamp": datetime.now().isoformat()}

@app.get("/health/readiness")
def health_readiness():
    return {"status": "ready", "connection": True}

@app.get("/ping")
def ping():
    return {"message": "pong", "timestamp": datetime.now().isoformat()}

@app.get("/test-frontend")
def test_frontend():
    return {
        "message": "Frontend connection test successful",
        "backend_version": "2.0.0", 
        "cors_enabled": True,
        "timestamp": datetime.now().isoformat(),
        "available_endpoints": {
            "categories": "/categories",
            "services": "/services", 
            "auth": "/api/auth/login",
            "health": "/health"
        }
    }

# Categories API
@app.get("/categories")
def get_categories():
    return {"success": True, "data": [cat.dict() for cat in SAMPLE_CATEGORIES]}

@app.get("/categories/{category_id}")
def get_category_by_id(category_id: str):
    category = next((cat for cat in SAMPLE_CATEGORIES if cat.id == category_id), None)
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"success": True, "data": category.dict()}

# Services API
@app.get("/services")
def get_services(
    page: int = 1,
    limit: int = 10,
    categoryId: Optional[str] = None,
    searchQuery: Optional[str] = None,
    minPrice: Optional[float] = None,
    maxPrice: Optional[float] = None,
    featured: Optional[bool] = None
):
    services = SAMPLE_SERVICES.copy()
    
    # Apply filters
    if categoryId:
        services = [s for s in services if s.category_id == categoryId]
    if searchQuery:
        services = [s for s in services if searchQuery.lower() in s.name.lower() or searchQuery.lower() in s.description.lower()]
    if minPrice is not None:
        services = [s for s in services if s.base_price >= minPrice]
    if maxPrice is not None:
        services = [s for s in services if s.base_price <= maxPrice]
    
    # Pagination
    total = len(services)
    start = (page - 1) * limit
    end = start + limit
    services = services[start:end]
    
    return {
        "success": True,
        "data": [svc.dict() for svc in services],
        "total": total,
        "page": page,
        "limit": limit,
        "totalPages": (total + limit - 1) // limit
    }

@app.get("/services/{service_id}")
def get_service_by_id(service_id: str):
    service = next((svc for svc in SAMPLE_SERVICES if svc.id == service_id), None)
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    return {"success": True, "data": service.dict()}

# Authentication API
@app.post("/api/auth/login")
def login(request: LoginRequest):
    # Simple dummy authentication
    user = next((u for u in SAMPLE_USERS if u.email == request.email), None)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    return {
        "data": {
            "user": user.dict(),
            "accessToken": f"dummy_token_{user.id}_{datetime.now().timestamp()}",
            "refreshToken": f"refresh_token_{user.id}_{datetime.now().timestamp()}"
        }
    }

@app.post("/api/auth/register")
def register(request: RegisterRequest):
    # Check if user already exists
    if any(u.email == request.email for u in SAMPLE_USERS):
        raise HTTPException(status_code=400, detail="User already exists")
    
    new_user = User(
        id=str(uuid.uuid4()),
        email=request.email,
        firstName=request.firstName,
        lastName=request.lastName,
        phone=request.phone,
        role=request.role or "customer",
        createdAt=datetime.now().isoformat(),
        updatedAt=datetime.now().isoformat()
    )
    
    return {
        "data": {
            "user": new_user.dict(),
            "accessToken": f"dummy_token_{new_user.id}_{datetime.now().timestamp()}",
            "refreshToken": f"refresh_token_{new_user.id}_{datetime.now().timestamp()}"
        }
    }

@app.get("/api/auth/me")
def get_current_user():
    # Return first user as dummy authenticated user
    return {"data": SAMPLE_USERS[0].dict()}

@app.post("/api/auth/logout")
def logout():
    return {"message": "Logged out successfully"}

# Users Management API
@app.get("/users")
def get_all_users():
    return {"success": True, "data": [user.dict() for user in SAMPLE_USERS]}

@app.get("/users/{user_id}")
def get_user_by_id(user_id: str):
    user = next((u for u in SAMPLE_USERS if u.id == user_id), None)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return {"success": True, "data": user.dict()}

# Employees API  
@app.get("/employees")
def get_employees(active_only: bool = True, expert: Optional[str] = None):
    employees = SAMPLE_EMPLOYEES.copy()
    
    if active_only:
        employees = [e for e in employees if e.is_active]
    if expert:
        employees = [e for e in employees if e.expert.lower() == expert.lower()]
    
    return {"data": [emp.dict() for emp in employees]}

@app.get("/employees/{employee_id}")
def get_employee_by_id(employee_id: str):
    employee = next((emp for emp in SAMPLE_EMPLOYEES if emp.id == employee_id), None)
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return {"data": employee.dict()}

@app.get("/employees/expertise-areas")
def get_expertise_areas():
    areas = set()
    for emp in SAMPLE_EMPLOYEES:
        if emp.expertise_areas:
            areas.update(emp.expertise_areas)
    return {"data": list(areas)}

# Orders API
@app.get("/orders")
def get_orders(
    status: Optional[str] = None,
    priority: Optional[str] = None,
    limit: int = 10,
    offset: int = 0
):
    # Generate sample orders
    sample_orders = [
        Order(
            id=f"order_{i}",
            order_number=f"HH{1000+i:04d}",
            customer_name=f"Customer {i}",
            customer_phone=f"+123456780{i}",
            customer_email=f"customer{i}@example.com",
            status=["pending", "confirmed", "in_progress", "completed"][i % 4],
            priority=["low", "medium", "high", "urgent"][i % 4],
            total_amount=100.0 + (i * 25),
            created_at=(datetime.now() - timedelta(days=i)).isoformat(),
            updated_at=datetime.now().isoformat(),
            items=[{
                "id": f"item_{i}",
                "service_name": SAMPLE_SERVICES[i % len(SAMPLE_SERVICES)].name,
                "quantity": 1,
                "price": SAMPLE_SERVICES[i % len(SAMPLE_SERVICES)].base_price
            }]
        ) for i in range(15)
    ]
    
    # Apply filters
    if status:
        sample_orders = [o for o in sample_orders if o.status == status]
    if priority:
        sample_orders = [o for o in sample_orders if o.priority == priority]
    
    # Apply pagination
    total = len(sample_orders)
    orders = sample_orders[offset:offset + limit]
    
    return {
        "data": [order.dict() for order in orders],
        "total": total
    }

@app.get("/orders/{order_id}")
def get_order_by_id(order_id: str):
    # Generate a sample order
    order = Order(
        id=order_id,
        order_number=f"HH{order_id[-4:]}",
        customer_name="John Doe",
        customer_phone="+1234567890",
        customer_email="john@example.com",
        status="confirmed",
        priority="medium",
        total_amount=150.0,
        created_at=datetime.now().isoformat(),
        updated_at=datetime.now().isoformat(),
        items=[{
            "id": "item_1",
            "service_name": "Basic Plumbing Repair",
            "quantity": 1,
            "price": 75.0
        }]
    )
    return {"data": order.dict()}

# Cart API
@app.get("/api/cart")
def get_cart():
    return {
        "data": {
            "id": "cart_1",
            "userId": "user1",
            "items": [
                {
                    "id": "cart_item_1",
                    "serviceId": "svc1",
                    "serviceName": "Basic Plumbing Repair",
                    "quantity": 1,
                    "basePrice": 75.0,
                    "totalPrice": 75.0
                }
            ],
            "totalItems": 1,
            "totalAmount": 75.0,
            "discountAmount": 0.0,
            "finalAmount": 75.0
        }
    }

@app.post("/api/cart/items")
def add_to_cart(item: Dict[str, Any]):
    return {
        "data": {
            "id": str(uuid.uuid4()),
            "serviceId": item.get("serviceId"),
            "serviceName": item.get("serviceName", "Unknown Service"),
            "quantity": item.get("quantity", 1),
            "basePrice": item.get("basePrice", 0),
            "totalPrice": item.get("basePrice", 0) * item.get("quantity", 1)
        }
    }

# Coupons API
@app.get("/api/coupons")
def get_coupons():
    return {
        "data": [
            {
                "id": "coupon1",
                "code": "WELCOME10",
                "discount": 10,
                "type": "percentage",
                "isActive": True,
                "minAmount": 50
            },
            {
                "id": "coupon2", 
                "code": "FLAT20",
                "discount": 20,
                "type": "fixed",
                "isActive": True,
                "minAmount": 100
            }
        ]
    }

@app.post("/api/coupons/validate")
def validate_coupon(request: Dict[str, Any]):
    code = request.get("code")
    amount = request.get("amount", 0)
    
    if code == "WELCOME10" and amount >= 50:
        return {
            "data": {
                "valid": True,
                "discount": amount * 0.1,
                "finalAmount": amount * 0.9
            }
        }
    elif code == "FLAT20" and amount >= 100:
        return {
            "data": {
                "valid": True, 
                "discount": 20,
                "finalAmount": amount - 20
            }
        }
    else:
        return {"data": {"valid": False, "message": "Invalid or expired coupon"}}

# Bookings API (alias for orders)
@app.get("/api/bookings")
def get_bookings():
    return get_orders()

@app.post("/api/bookings")
def create_booking(booking: Dict[str, Any]):
    new_booking = {
        "id": str(uuid.uuid4()),
        "order_number": f"HH{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "customer_name": booking.get("customerName", "Unknown"),
        "customer_phone": booking.get("customerPhone", ""),
        "customer_email": booking.get("customerEmail", ""),
        "status": "confirmed",
        "total_amount": booking.get("totalAmount", 0),
        "created_at": datetime.now().isoformat(),
        "items": booking.get("items", [])
    }
    return {"data": new_booking}

# Reviews API
@app.get("/api/reviews")
def get_reviews(serviceId: Optional[str] = None):
    reviews = [
        {
            "id": "review1",
            "serviceId": "svc1",
            "userName": "John D.",
            "rating": 5,
            "comment": "Excellent plumbing service!",
            "createdAt": datetime.now().isoformat()
        },
        {
            "id": "review2", 
            "serviceId": "svc2",
            "userName": "Sarah M.",
            "rating": 4,
            "comment": "Good electrical work, professional team.",
            "createdAt": datetime.now().isoformat()
        }
    ]
    
    if serviceId:
        reviews = [r for r in reviews if r["serviceId"] == serviceId]
    
    return {"data": reviews}

# Legacy endpoints for compatibility
@app.get("/api/services")
def api_services():
    return {
        "services": [
            {"id": 1, "name": "Plumbing", "price": "$75"},
            {"id": 2, "name": "Electrical", "price": "$120"},
            {"id": 3, "name": "Cleaning", "price": "$150"}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    print(f"🌟 Starting comprehensive API on 0.0.0.0:{port}")
    uvicorn.run(app, host="0.0.0.0", port=port)