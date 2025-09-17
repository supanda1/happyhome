"""
Coupon-related schemas for discount codes and promotions.
"""

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field, validator

from ..models.coupon import CouponType
from .base import FilterParams


class CouponCreate(BaseModel):
    """
    Schema for creating coupons.
    """
    
    code: str = Field(..., min_length=3, max_length=50, description="Unique coupon code")
    name: str = Field(..., min_length=1, max_length=200, description="Coupon display name")
    description: str = Field(..., min_length=1, max_length=500, description="Coupon description")
    type: CouponType = Field(..., description="Discount type (percentage or fixed)")
    value: float = Field(..., gt=0, description="Discount value (percentage or fixed amount)")
    minimum_order_amount: Optional[float] = Field(default=None, ge=0, description="Minimum order amount required", alias="minimumOrderAmount")
    maximum_discount_amount: Optional[float] = Field(default=None, gt=0, description="Maximum discount amount", alias="maximumDiscountAmount")
    usage_limit: int = Field(..., gt=0, description="Maximum number of times coupon can be used", alias="usageLimit")
    per_user_limit: int = Field(default=1, gt=0, description="Maximum uses per user", alias="perUserLimit")
    is_active: bool = Field(default=True, description="Whether coupon is active", alias="isActive")
    valid_from: str = Field(..., description="When coupon becomes valid (ISO format)", alias="validFrom")
    valid_until: str = Field(..., description="When coupon expires (ISO format)", alias="validUntil")
    applicable_services: List[str] = Field(default_factory=list, description="Service IDs this coupon applies to", alias="applicableServices")
    applicable_categories: List[str] = Field(default_factory=list, description="Category IDs this coupon applies to", alias="applicableCategories")
    
    @validator("code")
    def validate_code(cls, v):
        """Validate and clean coupon code."""
        # Convert to uppercase and remove spaces
        cleaned = v.upper().replace(" ", "")
        
        # Check for valid characters
        allowed_chars = set("ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-_")
        if not all(c in allowed_chars for c in cleaned):
            raise ValueError("Coupon code can only contain letters, numbers, hyphens, and underscores")
        
        return cleaned
    
    @validator("value")
    def validate_value(cls, v, values):
        """Validate discount value based on type."""
        coupon_type = values.get("type")
        
        if coupon_type == CouponType.PERCENTAGE:
            if v > 100:
                raise ValueError("Percentage discount cannot exceed 100%")
        elif coupon_type == CouponType.FIXED:
            if v <= 0:
                raise ValueError("Fixed discount must be greater than 0")
        
        return v
    
    @validator("valid_from")
    def validate_valid_from(cls, v):
        """Validate valid_from date format."""
        try:
            datetime.fromisoformat(v.replace('Z', '+00:00'))
            return v
        except ValueError:
            raise ValueError("Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)")
    
    @validator("valid_until")
    def validate_valid_until(cls, v, values):
        """Validate that valid_until is after valid_from."""
        try:
            valid_until_dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError("Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)")
        
        valid_from = values.get("valid_from")
        if valid_from:
            try:
                valid_from_dt = datetime.fromisoformat(valid_from.replace('Z', '+00:00'))
                if valid_until_dt <= valid_from_dt:
                    raise ValueError("Valid until date must be after valid from date")
            except ValueError:
                pass  # valid_from format error will be caught by its validator
        
        return v
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        use_enum_values = True
        schema_extra = {
            "example": {
                "code": "WELCOME20",
                "name": "Welcome Offer",
                "description": "20% off on your first service booking",
                "type": "percentage",
                "value": 20.0,
                "minimumOrderAmount": 100.0,
                "maximumDiscountAmount": 50.0,
                "usageLimit": 100,
                "perUserLimit": 1,
                "isActive": True,
                "validFrom": "2024-01-01T00:00:00Z",
                "validUntil": "2024-12-31T23:59:59Z",
                "applicableServices": [],
                "applicableCategories": []
            }
        }


class CouponUpdate(BaseModel):
    """
    Schema for updating coupons.
    """
    
    name: Optional[str] = Field(default=None, min_length=1, max_length=200, description="Coupon display name")
    description: Optional[str] = Field(default=None, min_length=1, max_length=500, description="Coupon description")
    value: Optional[float] = Field(default=None, gt=0, description="Discount value")
    minimum_order_amount: Optional[float] = Field(default=None, ge=0, description="Minimum order amount", alias="minimumOrderAmount")
    maximum_discount_amount: Optional[float] = Field(default=None, gt=0, description="Maximum discount amount", alias="maximumDiscountAmount")
    usage_limit: Optional[int] = Field(default=None, gt=0, description="Usage limit", alias="usageLimit")
    per_user_limit: Optional[int] = Field(default=None, gt=0, description="Per user limit", alias="perUserLimit")
    is_active: Optional[bool] = Field(default=None, description="Whether coupon is active", alias="isActive")
    valid_from: Optional[str] = Field(default=None, description="Valid from date", alias="validFrom")
    valid_until: Optional[str] = Field(default=None, description="Valid until date", alias="validUntil")
    applicable_services: Optional[List[str]] = Field(default=None, description="Applicable services", alias="applicableServices")
    applicable_categories: Optional[List[str]] = Field(default=None, description="Applicable categories", alias="applicableCategories")
    
    @validator("valid_from")
    def validate_valid_from(cls, v):
        """Validate valid_from date format."""
        if v is None:
            return v
        try:
            datetime.fromisoformat(v.replace('Z', '+00:00'))
            return v
        except ValueError:
            raise ValueError("Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)")
    
    @validator("valid_until")
    def validate_valid_until(cls, v, values):
        """Validate valid_until date format."""
        if v is None:
            return v
        
        try:
            valid_until_dt = datetime.fromisoformat(v.replace('Z', '+00:00'))
        except ValueError:
            raise ValueError("Invalid date format. Use ISO format (YYYY-MM-DDTHH:MM:SSZ)")
        
        valid_from = values.get("valid_from")
        if valid_from:
            try:
                valid_from_dt = datetime.fromisoformat(valid_from.replace('Z', '+00:00'))
                if valid_until_dt <= valid_from_dt:
                    raise ValueError("Valid until date must be after valid from date")
            except ValueError:
                pass
        
        return v
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True


class CouponValidationRequest(BaseModel):
    """
    Schema for coupon validation requests.
    """
    
    code: str = Field(..., description="Coupon code to validate")
    order_amount: float = Field(..., ge=0, description="Order amount to validate against", alias="orderAmount")
    service_id: Optional[str] = Field(default=None, description="Service ID (for applicability check)", alias="serviceId")
    category_id: Optional[str] = Field(default=None, description="Category ID (for applicability check)", alias="categoryId")
    user_id: Optional[str] = Field(default=None, description="User ID (for usage limit check)", alias="userId")
    
    @validator("code")
    def validate_code(cls, v):
        """Clean coupon code."""
        return v.upper().strip()
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "code": "WELCOME20",
                "orderAmount": 150.0,
                "serviceId": "507f1f77bcf86cd799439011",
                "categoryId": "507f1f77bcf86cd799439012",
                "userId": "507f1f77bcf86cd799439013"
            }
        }


class CouponValidationResponse(BaseModel):
    """
    Schema for coupon validation responses.
    """
    
    is_valid: bool = Field(..., description="Whether coupon is valid", alias="isValid")
    is_applicable: bool = Field(..., description="Whether coupon applies to the order", alias="isApplicable")
    discount_amount: float = Field(..., description="Discount amount", alias="discountAmount")
    final_amount: float = Field(..., description="Final amount after discount", alias="finalAmount")
    message: str = Field(..., description="Validation message")
    coupon: Optional[dict] = Field(default=None, description="Coupon details")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "isValid": True,
                "isApplicable": True,
                "discountAmount": 30.0,
                "finalAmount": 120.0,
                "message": "Coupon applied successfully",
                "coupon": {
                    "code": "WELCOME20",
                    "name": "Welcome Offer",
                    "type": "percentage",
                    "value": 20.0
                }
            }
        }


class CouponResponse(BaseModel):
    """
    Schema for coupon responses.
    """
    
    id: str = Field(..., description="Coupon ID")
    code: str = Field(..., description="Coupon code")
    name: str = Field(..., description="Coupon name")
    description: str = Field(..., description="Coupon description")
    type: str = Field(..., description="Discount type")
    value: float = Field(..., description="Discount value")
    minimum_order_amount: Optional[float] = Field(..., description="Minimum order amount", alias="minimumOrderAmount")
    maximum_discount_amount: Optional[float] = Field(..., description="Maximum discount amount", alias="maximumDiscountAmount")
    usage_limit: int = Field(..., description="Usage limit", alias="usageLimit")
    used_count: int = Field(..., description="Used count", alias="usedCount")
    per_user_limit: int = Field(..., description="Per user limit", alias="perUserLimit")
    is_active: bool = Field(..., description="Whether coupon is active", alias="isActive")
    valid_from: str = Field(..., description="Valid from date", alias="validFrom")
    valid_until: str = Field(..., description="Valid until date", alias="validUntil")
    applicable_services: List[str] = Field(..., description="Applicable services", alias="applicableServices")
    applicable_categories: List[str] = Field(..., description="Applicable categories", alias="applicableCategories")
    created_by: Optional[str] = Field(..., description="Created by admin", alias="createdBy")
    created_at: str = Field(..., description="Creation timestamp", alias="createdAt")
    updated_at: str = Field(..., description="Last update timestamp", alias="updatedAt")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "code": "WELCOME20",
                "name": "Welcome Offer",
                "description": "20% off on your first service booking",
                "type": "percentage",
                "value": 20.0,
                "minimumOrderAmount": 100.0,
                "maximumDiscountAmount": 50.0,
                "usageLimit": 100,
                "usedCount": 15,
                "perUserLimit": 1,
                "isActive": True,
                "validFrom": "2024-01-01T00:00:00Z",
                "validUntil": "2024-12-31T23:59:59Z",
                "applicableServices": [],
                "applicableCategories": [],
                "createdBy": "admin_001",
                "createdAt": "2024-01-01T00:00:00Z",
                "updatedAt": "2024-01-01T00:00:00Z"
            }
        }


class CouponListResponse(CouponResponse):
    """
    Schema for coupon list responses (public version).
    """
    
    class Config:
        """Pydantic configuration."""
        
        fields = {
            "used_count": {"exclude": True},
            "created_by": {"exclude": True},
            "created_at": {"exclude": True},
            "updated_at": {"exclude": True},
        }


class CouponFilters(FilterParams):
    """
    Schema for coupon filtering parameters.
    """
    
    type: Optional[CouponType] = Field(default=None, description="Filter by coupon type")
    is_active: Optional[bool] = Field(default=None, description="Filter by active status", alias="isActive")
    is_expired: Optional[bool] = Field(default=None, description="Filter by expiration status", alias="isExpired")
    service_id: Optional[str] = Field(default=None, description="Filter by applicable service", alias="serviceId")
    category_id: Optional[str] = Field(default=None, description="Filter by applicable category", alias="categoryId")
    created_by: Optional[str] = Field(default=None, description="Filter by creator", alias="createdBy")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        use_enum_values = True
        schema_extra = {
            "example": {
                "page": 1,
                "limit": 20,
                "search": "welcome",
                "type": "percentage",
                "isActive": True,
                "isExpired": False,
                "sort_by": "created_at",
                "sort_order": "desc"
            }
        }


class CouponStatsResponse(BaseModel):
    """
    Schema for coupon statistics responses.
    """
    
    total_coupons: int = Field(..., description="Total number of coupons", alias="totalCoupons")
    active_coupons: int = Field(..., description="Number of active coupons", alias="activeCoupons")
    expired_coupons: int = Field(..., description="Number of expired coupons", alias="expiredCoupons")
    total_usage: int = Field(..., description="Total coupon usage", alias="totalUsage")
    total_discount_given: float = Field(..., description="Total discount amount given", alias="totalDiscountGiven")
    most_used_coupons: list = Field(..., description="Most used coupons", alias="mostUsedCoupons")
    coupon_types: dict = Field(..., description="Distribution by type", alias="couponTypes")
    monthly_usage: list = Field(..., description="Monthly usage statistics", alias="monthlyUsage")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "totalCoupons": 25,
                "activeCoupons": 18,
                "expiredCoupons": 7,
                "totalUsage": 145,
                "totalDiscountGiven": 2850.0,
                "mostUsedCoupons": [
                    {"code": "WELCOME20", "usage": 48},
                    {"code": "SAVE50", "usage": 32}
                ],
                "couponTypes": {
                    "percentage": 15,
                    "fixed": 10
                },
                "monthlyUsage": [
                    {"month": "Jan", "usage": 25, "discount": 485.0},
                    {"month": "Feb", "usage": 31, "discount": 620.0}
                ]
            }
        }