"""
Pydantic schemas for API request/response validation.

This module contains all the Pydantic schemas used for API validation,
serialization, and documentation. Schemas are organized by functionality
and include both request and response models.
"""

from .base import BaseResponse, PaginatedResponse, ErrorResponse
from .auth import (
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RefreshTokenRequest,
    RefreshTokenResponse,
    ChangePasswordRequest,
    ForgotPasswordRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    UserResponse,
)
from .service import (
    ServiceCategoryCreate,
    ServiceCategoryUpdate,
    ServiceCategoryResponse,
    ServiceCreate,
    ServiceUpdate,
    ServiceResponse,
    ServiceListResponse,
    ServicePhotoCreate,
    ServicePhotoResponse,
)
from .booking import (
    BookingCreate,
    BookingUpdate,
    BookingResponse,
    BookingListResponse,
    AddressCreate,
    AddressResponse,
)
from .review import (
    ReviewCreate,
    ReviewUpdate,
    ReviewResponse,
    ReviewListResponse,
    ReviewApprovalRequest,
)
from .coupon import (
    CouponCreate,
    CouponUpdate,
    CouponResponse,
    CouponValidationRequest,
    CouponValidationResponse,
)
from .dashboard import (
    DashboardStatsResponse,
)
from .order import (
    ServiceAddressCreate,
    ServiceAddressResponse,
    OrderItemCreate,
    OrderItemResponse,
    OrderCreate,
    OrderResponse,
    OrderUpdate,
    OrderItemUpdate,
    AssignEngineerRequest,
    OrderFilters,
    OrderSummaryResponse,
    OrderStatsResponse,
    CreateOrderResponse,
)

__all__ = [
    # Base schemas
    "BaseResponse",
    "PaginatedResponse", 
    "ErrorResponse",
    
    # Auth schemas
    "LoginRequest",
    "LoginResponse",
    "RegisterRequest",
    "RefreshTokenRequest",
    "RefreshTokenResponse",
    "ChangePasswordRequest",
    "ForgotPasswordRequest",
    "ResetPasswordRequest",
    "UpdateProfileRequest",
    "UserResponse",
    
    # Service schemas
    "ServiceCategoryCreate",
    "ServiceCategoryUpdate",
    "ServiceCategoryResponse",
    "ServiceCreate",
    "ServiceUpdate",
    "ServiceResponse",
    "ServiceListResponse",
    "ServicePhotoCreate",
    "ServicePhotoResponse",
    
    # Booking schemas
    "BookingCreate",
    "BookingUpdate",
    "BookingResponse",
    "BookingListResponse",
    "AddressCreate",
    "AddressResponse",
    
    # Review schemas
    "ReviewCreate",
    "ReviewUpdate",
    "ReviewResponse",
    "ReviewListResponse",
    "ReviewApprovalRequest",
    
    # Coupon schemas
    "CouponCreate",
    "CouponUpdate",
    "CouponResponse",
    "CouponValidationRequest",
    "CouponValidationResponse",
    
    # Dashboard schemas
    "DashboardStatsResponse",
    
    # Order schemas
    "ServiceAddressCreate",
    "ServiceAddressResponse",
    "OrderItemCreate", 
    "OrderItemResponse",
    "OrderCreate",
    "OrderResponse",
    "OrderUpdate",
    "OrderItemUpdate",
    "AssignEngineerRequest",
    "OrderFilters",
    "OrderSummaryResponse",
    "OrderStatsResponse",
    "CreateOrderResponse",
]