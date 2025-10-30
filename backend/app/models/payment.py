"""
Payment management models for ICICI Gateway integration.

This handles payment processing for orders, including:
- Payment transactions with ICICI Gateway
- Multiple payment methods (cards, UPI, net banking)
- Payment status tracking and webhooks
- Transaction security and verification
"""

from datetime import datetime
from enum import Enum
from typing import Dict, Optional
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Float, String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class PaymentMethod(str, Enum):
    """Payment method enumeration."""
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    NET_BANKING = "net_banking"
    UPI = "upi"
    WALLET = "wallet"
    EMI = "emi"


class PaymentStatus(str, Enum):
    """Payment status enumeration."""
    PENDING = "pending"
    INITIATED = "initiated"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    PARTIAL_REFUND = "partial_refund"


class Payment(Base):
    """
    Payment transaction model for ICICI Gateway integration.
    
    Represents a payment transaction linked to an order with complete
    tracking of payment flow from initiation to completion.
    """
    
    __tablename__ = "payments"
    
    # Order relationship
    order_id: Mapped[UUID] = mapped_column(
        ForeignKey("orders.id"),
        nullable=False,
        index=True
    )
    
    # Transaction identification
    transaction_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True
    )
    
    gateway_transaction_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True,
        index=True
    )
    
    # Payment details
    amount: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    
    currency: Mapped[str] = mapped_column(
        String(3),
        nullable=False,
        default="INR"
    )
    
    payment_method: Mapped[PaymentMethod] = mapped_column(
        String(20),
        nullable=False,
        index=True
    )
    
    payment_status: Mapped[PaymentStatus] = mapped_column(
        String(20),
        nullable=False,
        default=PaymentStatus.PENDING,
        index=True
    )
    
    # Gateway specific fields
    merchant_id: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )
    
    access_code: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )
    
    # Customer payment information (encrypted/masked)
    customer_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    
    customer_email: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    
    customer_phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )
    
    # Payment instrument details (masked for security)
    card_number_masked: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )
    
    card_type: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )
    
    bank_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    
    upi_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    
    # Gateway response data
    gateway_response: Mapped[Optional[Dict]] = mapped_column(
        JSON,
        nullable=True
    )
    
    gateway_status_code: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )
    
    gateway_status_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    # Transaction timestamps
    initiated_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )
    
    completed_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )
    
    # Refund information
    refund_amount: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0
    )
    
    refund_reason: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    refund_reference: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    
    # Security and verification
    checksum: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )
    
    # Admin notes
    admin_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    # Relationships
    order: Mapped["Order"] = relationship(
        "Order",
        back_populates="payments",
        lazy="select"
    )
    
    @property
    def is_successful(self) -> bool:
        """Check if payment is successful."""
        return self.payment_status == PaymentStatus.SUCCESS
    
    @property
    def is_refundable(self) -> bool:
        """Check if payment can be refunded."""
        return (
            self.payment_status == PaymentStatus.SUCCESS and
            self.refund_amount < self.amount
        )
    
    @property
    def remaining_refund_amount(self) -> float:
        """Get remaining refundable amount."""
        if not self.is_refundable:
            return 0.0
        return self.amount - self.refund_amount
    
    def generate_transaction_id(self) -> str:
        """Generate unique transaction ID."""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        import uuid
        short_uuid = str(uuid.uuid4()).replace('-', '')[:8].upper()
        return f"TXN-{timestamp}-{short_uuid}"
    
    def mask_sensitive_data(self):
        """Mask sensitive payment data for logging."""
        if self.card_number_masked and len(self.card_number_masked) > 8:
            # Keep first 4 and last 4 digits
            self.card_number_masked = (
                self.card_number_masked[:4] + 
                "*" * (len(self.card_number_masked) - 8) + 
                self.card_number_masked[-4:]
            )
    
    def dict_for_response(self, exclude: set = None, include_sensitive: bool = False) -> Dict[str, any]:
        """Get payment data for API responses."""
        data = self.to_dict(exclude=exclude)
        
        result = {
            "id": data["id"],
            "order_id": data["order_id"],
            "transaction_id": data["transaction_id"],
            "gateway_transaction_id": data["gateway_transaction_id"],
            "amount": data["amount"],
            "currency": data["currency"],
            "payment_method": data["payment_method"],
            "payment_status": data["payment_status"],
            "customer_name": data["customer_name"],
            "customer_email": data["customer_email"],
            "customer_phone": data["customer_phone"],
            "initiated_at": data["initiated_at"],
            "completed_at": data["completed_at"],
            "refund_amount": data["refund_amount"],
            "is_verified": data["is_verified"],
            "created_at": data["created_at"],
            "updated_at": data["updated_at"],
        }
        
        # Add masked payment instrument details
        if data["card_number_masked"]:
            result["card_number_masked"] = data["card_number_masked"]
        if data["card_type"]:
            result["card_type"] = data["card_type"]
        if data["bank_name"]:
            result["bank_name"] = data["bank_name"]
        if data["upi_id"]:
            result["upi_id"] = data["upi_id"]
        
        # Include sensitive data only if explicitly requested (for admin)
        if include_sensitive:
            result["gateway_response"] = data["gateway_response"]
            result["gateway_status_code"] = data["gateway_status_code"]
            result["gateway_status_message"] = data["gateway_status_message"]
            result["checksum"] = data["checksum"]
            result["admin_notes"] = data["admin_notes"]
        
        return result


class PaymentWebhook(Base):
    """
    Payment webhook model for tracking gateway callbacks.
    
    Stores all webhook notifications from ICICI Gateway for
    audit trail and debugging purposes.
    """
    
    __tablename__ = "payment_webhooks"
    
    # Webhook identification
    webhook_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True
    )
    
    # Associated payment
    payment_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("payments.id"),
        nullable=True,
        index=True
    )
    
    transaction_id: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    
    # Webhook data
    webhook_data: Mapped[Dict] = mapped_column(
        JSON,
        nullable=False
    )
    
    # Processing status
    processed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )
    
    processing_error: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    # Verification
    signature: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )
    
    # Relationships
    payment: Mapped[Optional["Payment"]] = relationship(
        "Payment",
        lazy="select"
    )
    
    def dict_for_response(self, exclude: set = None) -> Dict[str, any]:
        """Get webhook data for API responses."""
        data = self.to_dict(exclude=exclude)
        
        return {
            "id": data["id"],
            "webhook_id": data["webhook_id"],
            "payment_id": data["payment_id"],
            "transaction_id": data["transaction_id"],
            "processed": data["processed"],
            "is_verified": data["is_verified"],
            "created_at": data["created_at"],
            "updated_at": data["updated_at"],
        }