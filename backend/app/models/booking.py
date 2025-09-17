"""
Booking model for service appointments and orders.
"""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class BookingStatus(str, Enum):
    """Booking status enumeration."""
    PENDING = "pending"
    CONFIRMED = "confirmed"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"


class PaymentStatus(str, Enum):
    """Payment status enumeration."""
    PENDING = "pending"
    PAID = "paid"
    FAILED = "failed"
    REFUNDED = "refunded"
    PARTIAL_REFUND = "partial_refund"


class CartItem(Base):
    """
    Shopping cart item model.
    
    Represents items in a user's shopping cart before booking.
    """
    
    __tablename__ = "cart_items"
    
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )
    
    service_id: Mapped[UUID] = mapped_column(
        ForeignKey("services.id"),
        nullable=False,
        index=True
    )
    
    variant_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("service_variants.id"),
        nullable=True,
        index=True
    )
    
    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1
    )
    
    # Pricing at time of adding to cart
    unit_price: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    
    # Optional customizations
    customizations: Mapped[Dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        lazy="select"
    )
    
    service: Mapped["Service"] = relationship(
        "Service",
        lazy="select"
    )
    
    variant: Mapped[Optional["ServiceVariant"]] = relationship(
        "ServiceVariant",
        lazy="select"
    )
    
    @property
    def total_price(self) -> float:
        """Calculate total price for this cart item."""
        return self.unit_price * self.quantity
    
    def dict_for_response(self, exclude: set = None) -> Dict[str, any]:
        """Get cart item data for API responses."""
        data = self.to_dict(exclude=exclude)
        
        return {
            "id": data["id"],
            "userId": data["user_id"],
            "serviceId": data["service_id"],
            "variantId": data["variant_id"],
            "quantity": data["quantity"],
            "unitPrice": data["unit_price"],
            "totalPrice": self.total_price,
            "customizations": data["customizations"],
            "createdAt": data["created_at"],
            "updatedAt": data["updated_at"],
        }


class Booking(Base):
    """
    Booking model for service appointments.
    
    Represents a customer's booking for a specific service at a specific
    time and location. Includes pricing, status tracking, and customer information.
    """
    
    __tablename__ = "bookings"
    
    # Reference fields
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )
    
    service_id: Mapped[UUID] = mapped_column(
        ForeignKey("services.id"),
        nullable=False,
        index=True
    )
    
    variant_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("service_variants.id"),
        nullable=True,
        index=True
    )
    
    address_id: Mapped[UUID] = mapped_column(
        ForeignKey("user_addresses.id"),
        nullable=False,
        index=True
    )
    
    # Scheduling
    scheduled_date: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True
    )
    
    scheduled_time_start: Mapped[str] = mapped_column(
        String(10),  # HH:MM format
        nullable=False
    )
    
    scheduled_time_end: Mapped[str] = mapped_column(
        String(10),  # HH:MM format
        nullable=False
    )
    
    # Status and tracking
    status: Mapped[BookingStatus] = mapped_column(
        String(20),
        nullable=False,
        default=BookingStatus.PENDING,
        index=True
    )
    
    # Pricing
    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1
    )
    
    unit_price: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    
    subtotal_amount: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    
    discount_amount: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0
    )
    
    tax_amount: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0
    )
    
    total_amount: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        index=True
    )
    
    # Coupon information
    coupon_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("coupons.id"),
        nullable=True,
        index=True
    )
    
    coupon_code: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )
    
    # Customer information
    customer_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    # Booking customizations
    customizations: Mapped[Dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict
    )
    
    # Admin/Service provider information
    admin_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    assigned_technician_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("users.id"),
        nullable=True,
        index=True
    )
    
    # Completion tracking
    started_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    cancelled_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    cancellation_reason: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    # Payment tracking
    payment_status: Mapped[PaymentStatus] = mapped_column(
        String(20),
        nullable=False,
        default=PaymentStatus.PENDING,
        index=True
    )
    
    payment_method: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )
    
    transaction_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True
    )
    
    # Invoice details
    invoice_number: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        foreign_keys=[user_id],
        back_populates="bookings",
        lazy="select"
    )
    
    service: Mapped["Service"] = relationship(
        "Service",
        back_populates="bookings",
        lazy="select"
    )
    
    variant: Mapped[Optional["ServiceVariant"]] = relationship(
        "ServiceVariant",
        lazy="select"
    )
    
    address: Mapped["UserAddress"] = relationship(
        "UserAddress",
        lazy="select"
    )
    
    coupon: Mapped[Optional["Coupon"]] = relationship(
        "Coupon",
        lazy="select"
    )
    
    assigned_technician: Mapped[Optional["User"]] = relationship(
        "User",
        foreign_keys=[assigned_technician_id],
        lazy="select"
    )
    
    reviews: Mapped[List["Review"]] = relationship(
        "Review",
        back_populates="booking",
        lazy="select"
    )
    
    # Properties
    @property
    def final_amount(self) -> float:
        """Calculate final amount after tax and discount."""
        return max(0, self.subtotal_amount + self.tax_amount - self.discount_amount)
    
    @property
    def is_past_due(self) -> bool:
        """Check if booking is past its scheduled time."""
        return self.scheduled_date < datetime.utcnow()
    
    @property
    def can_be_cancelled(self) -> bool:
        """Check if booking can be cancelled."""
        # Can't cancel completed, already cancelled, or refunded bookings
        if self.status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED, BookingStatus.REFUNDED]:
            return False
        
        # Can't cancel if service is in progress
        if self.status == BookingStatus.IN_PROGRESS:
            return False
        
        return True
    
    @property
    def can_be_modified(self) -> bool:
        """Check if booking can be modified."""
        # Can only modify pending or confirmed bookings
        if self.status not in [BookingStatus.PENDING, BookingStatus.CONFIRMED]:
            return False
        
        # Can't modify if service time has passed
        if self.is_past_due:
            return False
        
        return True
    
    @property
    def duration_minutes(self) -> int:
        """Calculate booking duration in minutes."""
        try:
            start_hour, start_min = map(int, self.scheduled_time_start.split(':'))
            end_hour, end_min = map(int, self.scheduled_time_end.split(':'))
            
            start_total = start_hour * 60 + start_min
            end_total = end_hour * 60 + end_min
            
            return end_total - start_total
        except (ValueError, AttributeError):
            return 0
    
    # Status management methods
    def confirm(self, admin_id: Optional[UUID] = None) -> None:
        """
        Confirm the booking.
        
        Args:
            admin_id: ID of admin confirming the booking
        """
        self.status = BookingStatus.CONFIRMED
        if admin_id:
            note = f"Confirmed by admin {admin_id}"
            self.admin_notes = f"{self.admin_notes}\n{note}" if self.admin_notes else note
    
    def start_service(self, technician_id: Optional[UUID] = None) -> None:
        """
        Mark service as in progress.
        
        Args:
            technician_id: ID of technician starting the service
        """
        self.status = BookingStatus.IN_PROGRESS
        self.started_at = datetime.utcnow()
        if technician_id:
            self.assigned_technician_id = technician_id
    
    def complete_service(self, admin_id: Optional[UUID] = None) -> None:
        """
        Mark service as completed.
        
        Args:
            admin_id: ID of admin completing the service
        """
        self.status = BookingStatus.COMPLETED
        self.completed_at = datetime.utcnow()
        if admin_id:
            note = f"Completed by admin {admin_id}"
            self.admin_notes = f"{self.admin_notes}\n{note}" if self.admin_notes else note
    
    def cancel(self, reason: str, admin_id: Optional[UUID] = None) -> None:
        """
        Cancel the booking.
        
        Args:
            reason: Reason for cancellation
            admin_id: ID of admin cancelling (if admin-initiated)
        """
        if not self.can_be_cancelled:
            raise ValueError(f"Booking with status {self.status} cannot be cancelled")
        
        self.status = BookingStatus.CANCELLED
        self.cancelled_at = datetime.utcnow()
        self.cancellation_reason = reason
        
        if admin_id:
            note = f"Cancelled by admin {admin_id}: {reason}"
            self.admin_notes = f"{self.admin_notes}\n{note}" if self.admin_notes else note
    
    def process_refund(self, admin_id: UUID, refund_amount: Optional[float] = None) -> None:
        """
        Process refund for cancelled booking.
        
        Args:
            admin_id: ID of admin processing refund
            refund_amount: Amount to refund (defaults to total amount)
        """
        if self.status != BookingStatus.CANCELLED:
            raise ValueError("Can only refund cancelled bookings")
        
        self.status = BookingStatus.REFUNDED
        self.payment_status = PaymentStatus.REFUNDED
        refund_amount = refund_amount or self.total_amount
        
        note = f"Refund of Rs.{refund_amount} processed by admin {admin_id}"
        self.admin_notes = f"{self.admin_notes}\n{note}" if self.admin_notes else note
    
    def dict_for_response(self, exclude: set = None, include_relationships: bool = False) -> Dict[str, any]:
        """
        Get booking data for API responses.
        
        Args:
            exclude: Fields to exclude
            include_relationships: Whether to include related data
        """
        data = self.to_dict(exclude=exclude)
        
        result = {
            "id": data["id"],
            "userId": data["user_id"],
            "serviceId": data["service_id"],
            "variantId": data["variant_id"],
            "addressId": data["address_id"],
            "scheduledDate": data["scheduled_date"],
            "scheduledTimeStart": data["scheduled_time_start"],
            "scheduledTimeEnd": data["scheduled_time_end"],
            "durationMinutes": self.duration_minutes,
            "status": data["status"],
            "quantity": data["quantity"],
            "unitPrice": data["unit_price"],
            "subtotalAmount": data["subtotal_amount"],
            "discountAmount": data["discount_amount"],
            "taxAmount": data["tax_amount"],
            "totalAmount": data["total_amount"],
            "finalAmount": self.final_amount,
            "couponId": data["coupon_id"],
            "couponCode": data["coupon_code"],
            "customerNotes": data["customer_notes"],
            "customizations": data["customizations"],
            "paymentStatus": data["payment_status"],
            "paymentMethod": data["payment_method"],
            "transactionId": data["transaction_id"],
            "invoiceNumber": data["invoice_number"],
            "createdAt": data["created_at"],
            "updatedAt": data["updated_at"],
        }
        
        # Include completion/cancellation details
        if data.get("started_at"):
            result["startedAt"] = data["started_at"]
        if data.get("completed_at"):
            result["completedAt"] = data["completed_at"]
        if data.get("cancelled_at"):
            result["cancelledAt"] = data["cancelled_at"]
            result["cancellationReason"] = data["cancellation_reason"]
        
        # Include admin fields for admin users
        if data.get("admin_notes"):
            result["adminNotes"] = data["admin_notes"]
        if data.get("assigned_technician_id"):
            result["assignedTechnicianId"] = data["assigned_technician_id"]
        
        # Include relationships if requested
        if include_relationships:
            if self.service:
                result["service"] = self.service.dict_for_response()
            
            if self.variant:
                result["variant"] = self.variant.dict_for_response()
            
            if self.address:
                result["address"] = self.address.dict_for_response()
            
            if self.coupon:
                result["coupon"] = self.coupon.dict_for_response()
        
        return result