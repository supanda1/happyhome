"""
Order management schemas for API validation and serialization.

This module provides Pydantic schemas for order-related operations including:
- Order creation and updates
- Order item management 
- Engineer assignment
- Filtering and pagination
"""

from typing import List, Optional
from uuid import UUID

from pydantic import BaseModel, Field

from ..models.order import OrderStatus, OrderPriority, ItemStatus


class ServiceAddressCreate(BaseModel):
    """Service address for orders."""
    house_number: str = Field(..., min_length=1, max_length=20)
    area: str = Field(..., min_length=1, max_length=100)
    landmark: Optional[str] = Field(None, max_length=100)
    city: str = Field(..., min_length=1, max_length=50)
    state: str = Field(..., min_length=1, max_length=50)
    pincode: str = Field(..., min_length=6, max_length=6)


class ServiceAddressResponse(BaseModel):
    """Service address in API responses."""
    house_number: str
    area: str
    landmark: Optional[str] = None
    city: str
    state: str
    pincode: str


class OrderItemCreate(BaseModel):
    """Order item creation schema."""
    service_id: str = Field(..., min_length=1, max_length=100)  # Changed from UUID to str for mock data compatibility
    service_name: str = Field(..., min_length=1, max_length=100)
    variant_id: Optional[str] = Field(None, max_length=100)  # Changed from UUID to str
    variant_name: Optional[str] = Field(None, max_length=50)
    quantity: int = Field(ge=1, le=10)
    unit_price: float = Field(ge=0)
    total_price: float = Field(ge=0)
    category_id: str = Field(..., min_length=1, max_length=100)  # Changed from UUID to str
    subcategory_id: str = Field(..., min_length=1, max_length=100)  # Changed from UUID to str
    assigned_engineer_id: Optional[str] = Field(None, max_length=100)  # Changed from UUID to str
    assigned_engineer_name: Optional[str] = Field(None, max_length=100)
    item_status: ItemStatus = ItemStatus.PENDING
    scheduled_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    scheduled_time_slot: Optional[str] = Field(None, max_length=20)
    completion_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    item_notes: Optional[str] = Field(None, max_length=1000)
    item_rating: Optional[int] = Field(None, ge=1, le=5)
    item_review: Optional[str] = Field(None, max_length=1000)


class OrderItemResponse(BaseModel):
    """Order item in API responses."""
    id: str
    order_id: str
    service_id: str
    service_name: str
    variant_id: Optional[str] = None
    variant_name: Optional[str] = None
    quantity: int
    unit_price: float
    total_price: float
    category_id: str
    subcategory_id: str
    assigned_engineer_id: Optional[str] = None
    assigned_engineer_name: Optional[str] = None
    item_status: ItemStatus
    scheduled_date: Optional[str] = None
    scheduled_time_slot: Optional[str] = None
    completion_date: Optional[str] = None
    item_notes: Optional[str] = None
    item_rating: Optional[int] = None
    item_review: Optional[str] = None
    created_at: str


class OrderCreate(BaseModel):
    """Order creation schema."""
    customer_id: str = Field(..., min_length=1, max_length=100)  # Changed from UUID to str for mock data compatibility
    customer_name: str = Field(..., min_length=1, max_length=100)
    customer_phone: str = Field(..., min_length=10, max_length=20)
    customer_email: str = Field(..., min_length=5, max_length=100)
    service_address: ServiceAddressCreate
    items: List[OrderItemCreate] = Field(..., min_items=1, max_items=20)
    total_amount: float = Field(ge=0)
    discount_amount: float = Field(ge=0, default=0)
    gst_amount: float = Field(ge=0, default=0)
    service_charge: float = Field(ge=0, default=0)
    final_amount: float = Field(ge=0)
    priority: OrderPriority = OrderPriority.MEDIUM
    notes: Optional[str] = Field(None, max_length=1000)


class OrderResponse(BaseModel):
    """Order in API responses."""
    id: str
    order_number: str
    customer_id: str  
    customer_name: str
    customer_phone: str
    customer_email: str
    service_address: ServiceAddressResponse
    total_amount: float
    discount_amount: float
    gst_amount: float
    service_charge: float
    final_amount: float
    status: OrderStatus
    priority: OrderPriority
    notes: Optional[str] = None
    admin_notes: Optional[str] = None
    customer_rating: Optional[int] = None
    customer_review: Optional[str] = None
    total_items: int
    completed_items: int
    progress_percentage: float
    created_at: str
    updated_at: str
    items: Optional[List[OrderItemResponse]] = None


class OrderUpdate(BaseModel):
    """Order update schema."""
    status: Optional[OrderStatus] = None
    priority: Optional[OrderPriority] = None
    admin_notes: Optional[str] = Field(None, max_length=1000)
    customer_rating: Optional[int] = Field(None, ge=1, le=5)
    customer_review: Optional[str] = Field(None, max_length=1000)


class OrderItemUpdate(BaseModel):
    """Order item update schema."""
    assigned_engineer_id: Optional[UUID] = None
    item_status: Optional[ItemStatus] = None
    scheduled_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    scheduled_time_slot: Optional[str] = Field(None, max_length=20)
    item_notes: Optional[str] = Field(None, max_length=1000)
    item_rating: Optional[int] = Field(None, ge=1, le=5)
    item_review: Optional[str] = Field(None, max_length=1000)


class AssignEngineerRequest(BaseModel):
    """Engineer assignment schema."""
    engineer_id: UUID
    notes: Optional[str] = Field(None, max_length=500)


class OrderFilters(BaseModel):
    """Order filtering parameters."""
    status: Optional[OrderStatus] = None
    priority: Optional[OrderPriority] = None
    customer_id: Optional[UUID] = None
    from_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    to_date: Optional[str] = Field(None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    order_number: Optional[str] = Field(None, min_length=1, max_length=50)
    engineer_id: Optional[UUID] = None
    
    
class OrderSummaryResponse(BaseModel):
    """Order summary for list views."""
    id: str
    order_number: str
    customer_name: str
    status: OrderStatus
    priority: OrderPriority
    total_amount: float
    final_amount: float
    total_items: int
    completed_items: int
    progress_percentage: float
    created_at: str


class OrderStatsResponse(BaseModel):
    """Order statistics response."""
    total_orders: int
    pending_orders: int
    in_progress_orders: int
    completed_orders: int
    cancelled_orders: int
    total_revenue: float
    average_order_value: float
    total_items: int
    completion_rate: float


class CreateOrderResponse(BaseModel):
    """Response for order creation."""
    order_id: str
    order_number: str
    status: OrderStatus
    final_amount: float
    total_items: int
    message: str