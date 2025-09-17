"""
Coupon model for discount codes and promotions.
"""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class CouponType(str, Enum):
    """Coupon type enumeration."""
    PERCENTAGE = "percentage"
    FIXED = "fixed"


class CouponStatus(str, Enum):
    """Coupon status enumeration."""
    ACTIVE = "active"
    INACTIVE = "inactive"
    EXPIRED = "expired"
    EXHAUSTED = "exhausted"


class Coupon(Base):
    """
    Coupon model for discount codes and promotional offers.
    
    Supports both percentage and fixed amount discounts with flexible
    applicability rules and usage limits.
    """
    
    __tablename__ = "coupons"
    
    # Basic information
    code: Mapped[str] = mapped_column(
        String(50),
        unique=True,
        nullable=False,
        index=True
    )
    
    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )
    
    description: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )
    
    # Discount configuration
    type: Mapped[CouponType] = mapped_column(
        String(20),
        nullable=False,
        index=True
    )
    
    value: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    
    # Constraints
    minimum_order_amount: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True
    )
    
    maximum_discount_amount: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True
    )
    
    # Usage limits
    usage_limit: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1000  # Default high limit
    )
    
    used_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        index=True
    )
    
    per_user_limit: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1
    )
    
    # Status and timing
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True
    )
    
    valid_from: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True
    )
    
    valid_until: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True
    )
    
    # Applicability
    applicable_services: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list
    )
    
    applicable_categories: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list
    )
    
    # Advanced targeting
    applicable_user_tiers: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list  # e.g., ["premium", "gold", "vip"]
    )
    
    # Metadata
    created_by: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )
    
    # Marketing information
    terms_and_conditions: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    marketing_message: Mapped[Optional[str]] = mapped_column(
        String(300),
        nullable=True
    )
    
    # Auto-deactivation
    auto_deactivate_after_expiry: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )
    
    # Relationships
    creator: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[created_by],
        lazy="select"
    )
    
    usage_logs: Mapped[List["CouponUsage"]] = relationship(
        "CouponUsage",
        back_populates="coupon",
        cascade="all, delete-orphan",
        lazy="select"
    )
    
    # Properties
    @property
    def is_expired(self) -> bool:
        """Check if coupon is expired."""
        return datetime.utcnow() > self.valid_until
    
    @property
    def is_not_yet_valid(self) -> bool:
        """Check if coupon is not yet valid."""
        return datetime.utcnow() < self.valid_from
    
    @property
    def is_usage_exhausted(self) -> bool:
        """Check if coupon usage limit is reached."""
        return self.used_count >= self.usage_limit
    
    @property
    def is_valid(self) -> bool:
        """Check if coupon is currently valid and usable."""
        return (
            self.is_active
            and not self.is_expired
            and not self.is_not_yet_valid
            and not self.is_usage_exhausted
        )
    
    @property
    def status(self) -> CouponStatus:
        """Get current coupon status."""
        if not self.is_active:
            return CouponStatus.INACTIVE
        elif self.is_expired:
            return CouponStatus.EXPIRED
        elif self.is_usage_exhausted:
            return CouponStatus.EXHAUSTED
        else:
            return CouponStatus.ACTIVE
    
    @property
    def remaining_uses(self) -> int:
        """Get remaining number of uses."""
        return max(0, self.usage_limit - self.used_count)
    
    # Methods
    def calculate_discount(self, order_amount: float) -> Dict[str, any]:
        """
        Calculate discount amount for given order.
        
        Args:
            order_amount: Total order amount
            
        Returns:
            Dictionary with discount calculation details
        """
        result = {
            "is_applicable": False,
            "discount_amount": 0.0,
            "final_amount": order_amount,
            "message": "",
            "coupon_details": {
                "code": self.code,
                "name": self.name,
                "type": self.type.value,
                "value": self.value,
            }
        }
        
        # Check if coupon is valid
        if not self.is_valid:
            if not self.is_active:
                result["message"] = "Coupon is not active"
            elif self.is_expired:
                result["message"] = "Coupon has expired"
            elif self.is_not_yet_valid:
                result["message"] = "Coupon is not yet valid"
            elif self.is_usage_exhausted:
                result["message"] = "Coupon usage limit reached"
            return result
        
        # Check minimum order amount
        if self.minimum_order_amount and order_amount < self.minimum_order_amount:
            result["message"] = f"Minimum order amount of Rs.{self.minimum_order_amount} required"
            return result
        
        # Calculate discount
        if self.type == CouponType.PERCENTAGE:
            discount_amount = (order_amount * self.value) / 100
            
            # Apply maximum discount limit if set
            if self.maximum_discount_amount:
                discount_amount = min(discount_amount, self.maximum_discount_amount)
        else:  # FIXED
            discount_amount = self.value
        
        # Ensure discount doesn't exceed order amount
        discount_amount = min(discount_amount, order_amount)
        
        result.update({
            "is_applicable": True,
            "discount_amount": round(discount_amount, 2),
            "final_amount": round(order_amount - discount_amount, 2),
            "message": "Coupon applied successfully",
        })
        
        return result
    
    def is_applicable_to_service(self, service_id: str, category_id: str = None) -> bool:
        """
        Check if coupon is applicable to a specific service.
        
        Args:
            service_id: Service ID to check
            category_id: Service category ID to check
            
        Returns:
            True if coupon is applicable, False otherwise
        """
        # If no specific services or categories are set, coupon applies to all
        if not self.applicable_services and not self.applicable_categories:
            return True
        
        # Check if service is specifically included
        if service_id in self.applicable_services:
            return True
        
        # Check if service category is included
        if category_id and category_id in self.applicable_categories:
            return True
        
        return False
    
    def increment_usage(self) -> None:
        """Increment the usage count."""
        self.used_count += 1
    
    def dict_for_response(self, exclude: set = None, include_admin_fields: bool = False) -> Dict[str, any]:
        """
        Get coupon data for API responses.
        
        Args:
            exclude: Fields to exclude
            include_admin_fields: Whether to include admin-only fields
        """
        data = self.to_dict(exclude=exclude)
        
        result = {
            "id": data["id"],
            "code": data["code"],
            "name": data["name"],
            "description": data["description"],
            "type": data["type"],
            "value": data["value"],
            "minimumOrderAmount": data["minimum_order_amount"],
            "maximumDiscountAmount": data["maximum_discount_amount"],
            "isActive": data["is_active"],
            "validFrom": data["valid_from"],
            "validUntil": data["valid_until"],
            "applicableServices": data["applicable_services"],
            "applicableCategories": data["applicable_categories"],
            "applicableUserTiers": data["applicable_user_tiers"],
            "termsAndConditions": data["terms_and_conditions"],
            "marketingMessage": data["marketing_message"],
            "status": self.status.value,
            "isValid": self.is_valid,
            "remainingUses": self.remaining_uses,
        }
        
        if include_admin_fields:
            result.update({
                "usageLimit": data["usage_limit"],
                "usedCount": data["used_count"],
                "perUserLimit": data["per_user_limit"],
                "createdBy": data["created_by"],
                "autoDeactivateAfterExpiry": data["auto_deactivate_after_expiry"],
                "createdAt": data["created_at"],
                "updatedAt": data["updated_at"],
            })
        
        return result


class CouponUsage(Base):
    """
    Coupon usage tracking model.
    
    Tracks when and by whom coupons are used for analytics and limits.
    """
    
    __tablename__ = "coupon_usages"
    
    coupon_id: Mapped[UUID] = mapped_column(
        ForeignKey("coupons.id"),
        nullable=False,
        index=True
    )
    
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )
    
    booking_id: Mapped[UUID] = mapped_column(
        ForeignKey("bookings.id"),
        nullable=False,
        index=True
    )
    
    # Usage details
    order_amount: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    
    discount_amount: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    
    final_amount: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    
    # Tracking
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),  # IPv6 max length
        nullable=True
    )
    
    user_agent: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    # Relationships
    coupon: Mapped["Coupon"] = relationship(
        "Coupon",
        back_populates="usage_logs"
    )
    
    user: Mapped["User"] = relationship(
        "User",
        lazy="select"
    )
    
    booking: Mapped["Booking"] = relationship(
        "Booking",
        lazy="select"
    )
    
    def dict_for_response(self, exclude: set = None) -> Dict[str, any]:
        """Get coupon usage data for API responses."""
        data = self.to_dict(exclude=exclude)
        
        return {
            "id": data["id"],
            "couponId": data["coupon_id"],
            "userId": data["user_id"],
            "bookingId": data["booking_id"],
            "orderAmount": data["order_amount"],
            "discountAmount": data["discount_amount"],
            "finalAmount": data["final_amount"],
            "ipAddress": data["ip_address"],
            "userAgent": data["user_agent"],
            "createdAt": data["created_at"],
        }