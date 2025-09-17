"""
Booking-related schemas for appointments and orders.
"""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field, validator

from ..models.booking import BookingStatus
from .base import FilterParams


class AddressCreate(BaseModel):
    """
    Schema for creating addresses.
    """
    
    street: str = Field(..., min_length=1, max_length=200, description="Street address")
    city: str = Field(..., min_length=1, max_length=100, description="City")
    state: str = Field(..., min_length=1, max_length=100, description="State/Province")
    zip_code: str = Field(..., min_length=5, max_length=20, description="ZIP/Postal code", alias="zipCode")
    landmark: Optional[str] = Field(default=None, max_length=200, description="Nearby landmark")
    
    @validator("zip_code")
    def validate_zip_code(cls, v):
        """Validate ZIP code format."""
        # Remove spaces and hyphens for validation
        cleaned = v.replace(" ", "").replace("-", "")
        if not cleaned.isalnum():
            raise ValueError("ZIP code must contain only letters and numbers")
        return v
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "street": "123 Main St",
                "city": "New York",
                "state": "NY",
                "zipCode": "10001",
                "landmark": "Near Central Park"
            }
        }


class AddressResponse(BaseModel):
    """
    Schema for address responses.
    """
    
    street: str = Field(..., description="Street address")
    city: str = Field(..., description="City")
    state: str = Field(..., description="State/Province")
    zip_code: str = Field(..., description="ZIP/Postal code", alias="zipCode")
    landmark: Optional[str] = Field(default=None, description="Nearby landmark")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True


class TimeSlotRequest(BaseModel):
    """
    Schema for time slot in booking requests.
    """
    
    start_time: str = Field(..., pattern=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", description="Start time in HH:MM format", alias="startTime")
    end_time: str = Field(..., pattern=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", description="End time in HH:MM format", alias="endTime")
    is_available: bool = Field(default=True, description="Whether time slot is available", alias="isAvailable")
    
    @validator("end_time")
    def validate_end_time(cls, v, values):
        """Validate that end time is after start time."""
        start_time = values.get("start_time")
        if start_time and v <= start_time:
            raise ValueError("End time must be after start time")
        return v
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True


class BookingCreate(BaseModel):
    """
    Schema for creating bookings.
    """
    
    service_id: str = Field(..., description="Service being booked", alias="serviceId")
    scheduled_date: str = Field(..., description="Date and time of service (ISO format)", alias="scheduledDate")
    time_slot: TimeSlotRequest = Field(..., description="Specific time slot for service", alias="timeSlot")
    customer_address: AddressCreate = Field(..., description="Service location address", alias="customerAddress")
    customer_notes: Optional[str] = Field(default=None, max_length=1000, description="Customer notes/instructions", alias="customerNotes")
    coupon_code: Optional[str] = Field(default=None, description="Applied coupon code", alias="couponCode")
    
    @validator("scheduled_date")
    def validate_scheduled_date(cls, v):
        """Validate that scheduled date is in the future."""
        try:
            scheduled_dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
            if scheduled_dt <= datetime.utcnow():
                raise ValueError("Scheduled date must be in the future")
            return v
        except ValueError as e:
            if "Scheduled date must be in the future" in str(e):
                raise e
            raise ValueError("Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)")
    
    @validator("coupon_code")
    def validate_coupon_code(cls, v):
        """Clean coupon code."""
        return v.upper().strip() if v else v
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "serviceId": "507f1f77bcf86cd799439011",
                "scheduledDate": "2024-02-15T10:00:00Z",
                "timeSlot": {
                    "startTime": "10:00",
                    "endTime": "12:00",
                    "isAvailable": True
                },
                "customerAddress": {
                    "street": "123 Main St",
                    "city": "New York",
                    "state": "NY",
                    "zipCode": "10001",
                    "landmark": "Near Central Park"
                },
                "customerNotes": "Urgent repair needed for kitchen sink",
                "couponCode": "WELCOME20"
            }
        }


class BookingUpdate(BaseModel):
    """
    Schema for updating bookings.
    """
    
    scheduled_date: Optional[str] = Field(default=None, description="Date and time of service (ISO format)", alias="scheduledDate")
    time_slot: Optional[TimeSlotRequest] = Field(default=None, description="Specific time slot for service", alias="timeSlot")
    customer_address: Optional[AddressCreate] = Field(default=None, description="Service location address", alias="customerAddress")
    customer_notes: Optional[str] = Field(default=None, max_length=1000, description="Customer notes/instructions", alias="customerNotes")
    coupon_code: Optional[str] = Field(default=None, description="Applied coupon code", alias="couponCode")
    
    @validator("scheduled_date")
    def validate_scheduled_date(cls, v):
        """Validate that scheduled date is in the future."""
        if v is None:
            return v
        
        try:
            scheduled_dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
            if scheduled_dt <= datetime.utcnow():
                raise ValueError("Scheduled date must be in the future")
            return v
        except ValueError as e:
            if "Scheduled date must be in the future" in str(e):
                raise e
            raise ValueError("Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)")
    
    @validator("coupon_code")
    def validate_coupon_code(cls, v):
        """Clean coupon code."""
        return v.upper().strip() if v else v
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True


class BookingStatusUpdate(BaseModel):
    """
    Schema for updating booking status (admin only).
    """
    
    status: BookingStatus = Field(..., description="New booking status")
    admin_notes: Optional[str] = Field(default=None, max_length=1000, description="Admin notes", alias="adminNotes")
    assigned_technician: Optional[str] = Field(default=None, description="Assigned technician ID", alias="assignedTechnician")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        use_enum_values = True
        schema_extra = {
            "example": {
                "status": "confirmed",
                "adminNotes": "Booking confirmed, technician assigned",
                "assignedTechnician": "tech_001"
            }
        }


class BookingCancellation(BaseModel):
    """
    Schema for booking cancellation.
    """
    
    reason: str = Field(..., min_length=1, max_length=500, description="Reason for cancellation")
    
    class Config:
        """Pydantic configuration."""
        
        schema_extra = {
            "example": {
                "reason": "Customer requested cancellation due to schedule conflict"
            }
        }


class BookingResponse(BaseModel):
    """
    Schema for booking responses.
    """
    
    id: str = Field(..., description="Booking ID")
    user_id: str = Field(..., description="Customer ID", alias="userId")
    service_id: str = Field(..., description="Service ID", alias="serviceId")
    scheduled_date: str = Field(..., description="Scheduled date and time", alias="scheduledDate")
    time_slot: dict = Field(..., description="Time slot details", alias="timeSlot")
    status: str = Field(..., description="Booking status")
    total_amount: float = Field(..., description="Total amount", alias="totalAmount")
    discount_amount: float = Field(..., description="Discount applied", alias="discountAmount")
    final_amount: float = Field(..., description="Final amount after discount", alias="finalAmount")
    coupon_code: Optional[str] = Field(default=None, description="Applied coupon code", alias="couponCode")
    customer_address: AddressResponse = Field(..., description="Service location", alias="customerAddress")
    customer_notes: Optional[str] = Field(default=None, description="Customer notes", alias="customerNotes")
    payment_status: str = Field(..., description="Payment status", alias="paymentStatus")
    payment_method: Optional[str] = Field(default=None, description="Payment method", alias="paymentMethod")
    transaction_id: Optional[str] = Field(default=None, description="Transaction ID", alias="transactionId")
    completed_at: Optional[str] = Field(default=None, description="Completion timestamp", alias="completedAt")
    cancelled_at: Optional[str] = Field(default=None, description="Cancellation timestamp", alias="cancelledAt")
    cancellation_reason: Optional[str] = Field(default=None, description="Cancellation reason", alias="cancellationReason")
    admin_notes: Optional[str] = Field(default=None, description="Admin notes", alias="adminNotes")
    assigned_technician: Optional[str] = Field(default=None, description="Assigned technician", alias="assignedTechnician")
    created_at: str = Field(..., description="Creation timestamp", alias="createdAt")
    updated_at: str = Field(..., description="Last update timestamp", alias="updatedAt")
    
    # Optional populated fields
    user: Optional[dict] = Field(default=None, description="User details")
    service: Optional[dict] = Field(default=None, description="Service details")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "userId": "507f1f77bcf86cd799439012",
                "serviceId": "507f1f77bcf86cd799439013",
                "scheduledDate": "2024-02-15T10:00:00Z",
                "timeSlot": {
                    "startTime": "10:00",
                    "endTime": "12:00",
                    "isAvailable": True
                },
                "status": "confirmed",
                "totalAmount": 150.0,
                "discountAmount": 30.0,
                "finalAmount": 120.0,
                "couponCode": "WELCOME20",
                "customerAddress": {
                    "street": "123 Main St",
                    "city": "New York",
                    "state": "NY",
                    "zipCode": "10001",
                    "landmark": "Near Central Park"
                },
                "customerNotes": "Urgent repair needed",
                "paymentStatus": "pending",
                "createdAt": "2024-02-01T08:00:00Z",
                "updatedAt": "2024-02-01T08:30:00Z"
            }
        }


class BookingListResponse(BookingResponse):
    """
    Schema for booking list responses (lighter version).
    """
    
    class Config:
        """Pydantic configuration."""
        
        fields = {
            "customer_notes": {"exclude": True},
            "admin_notes": {"exclude": True},
            "transaction_id": {"exclude": True},
        }


class BookingFilters(FilterParams):
    """
    Schema for booking filtering parameters.
    """
    
    user_id: Optional[str] = Field(default=None, description="Filter by user ID", alias="userId")
    service_id: Optional[str] = Field(default=None, description="Filter by service ID", alias="serviceId")
    status: Optional[BookingStatus] = Field(default=None, description="Filter by status")
    start_date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="Start date filter (YYYY-MM-DD)", alias="startDate")
    end_date: Optional[str] = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$", description="End date filter (YYYY-MM-DD)", alias="endDate")
    min_amount: Optional[float] = Field(default=None, ge=0, description="Minimum amount filter", alias="minAmount")
    max_amount: Optional[float] = Field(default=None, ge=0, description="Maximum amount filter", alias="maxAmount")
    payment_status: Optional[str] = Field(default=None, description="Filter by payment status", alias="paymentStatus")
    
    @validator("end_date")
    def validate_date_range(cls, v, values):
        """Validate that end date is after start date."""
        start_date = values.get("start_date")
        if start_date and v and v < start_date:
            raise ValueError("End date must be after start date")
        return v
    
    @validator("max_amount")
    def validate_amount_range(cls, v, values):
        """Validate that max amount is greater than min amount."""
        min_amount = values.get("min_amount")
        if min_amount is not None and v is not None and v < min_amount:
            raise ValueError("Maximum amount must be greater than minimum amount")
        return v
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        use_enum_values = True
        schema_extra = {
            "example": {
                "page": 1,
                "limit": 20,
                "userId": "507f1f77bcf86cd799439012",
                "status": "confirmed",
                "startDate": "2024-02-01",
                "endDate": "2024-02-28",
                "minAmount": 50.0,
                "maxAmount": 500.0,
                "sort_by": "scheduled_date",
                "sort_order": "desc"
            }
        }


class BookingStatsResponse(BaseModel):
    """
    Schema for booking statistics responses.
    """
    
    total_bookings: int = Field(..., description="Total number of bookings", alias="totalBookings")
    status_counts: dict = Field(..., description="Count by status", alias="statusCounts")
    revenue: dict = Field(..., description="Revenue statistics")
    monthly_bookings: list = Field(..., description="Monthly booking counts", alias="monthlyBookings")
    top_services: list = Field(..., description="Most booked services", alias="topServices")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "totalBookings": 156,
                "statusCounts": {
                    "pending": 12,
                    "confirmed": 35,
                    "completed": 98,
                    "cancelled": 11
                },
                "revenue": {
                    "total": 28500.0,
                    "monthly": 4200.0,
                    "average_per_booking": 182.69
                },
                "monthlyBookings": [
                    {"month": "Jan", "count": 25},
                    {"month": "Feb", "count": 31}
                ],
                "topServices": [
                    {"serviceId": "507f1f77bcf86cd799439013", "count": 45, "revenue": 6750.0}
                ]
            }
        }