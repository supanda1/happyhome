"""
Payment schemas for request and response validation.

This module contains Pydantic schemas for payment-related API operations
including payment initiation, callbacks, and status management.
"""

from datetime import datetime
from typing import Dict, List, Optional
from uuid import UUID

from pydantic import BaseModel, Field, validator
from enum import Enum

from ..models.payment import PaymentMethod, PaymentStatus


class PaymentMethodEnum(str, Enum):
    """Payment method enumeration for API."""
    CREDIT_CARD = "credit_card"
    DEBIT_CARD = "debit_card"
    NET_BANKING = "net_banking"
    UPI = "upi"
    WALLET = "wallet"
    EMI = "emi"


class PaymentStatusEnum(str, Enum):
    """Payment status enumeration for API."""
    PENDING = "pending"
    INITIATED = "initiated"
    PROCESSING = "processing"
    SUCCESS = "success"
    FAILED = "failed"
    CANCELLED = "cancelled"
    REFUNDED = "refunded"
    PARTIAL_REFUND = "partial_refund"


# Request Schemas

class PaymentInitiateRequest(BaseModel):
    """Schema for payment initiation request."""
    order_id: UUID = Field(..., description="Order ID to create payment for")
    payment_method: PaymentMethodEnum = Field(..., description="Selected payment method")
    return_url: Optional[str] = Field(None, description="Custom return URL after payment")
    customer_data: Optional[Dict[str, str]] = Field(None, description="Additional customer data")
    
    class Config:
        json_encoders = {
            UUID: str
        }


class PaymentCallbackRequest(BaseModel):
    """Schema for payment gateway callback."""
    encResp: str = Field(..., description="Encrypted response from gateway")
    orderNo: Optional[str] = Field(None, description="Order number from gateway")
    
    class Config:
        extra = "allow"  # Allow additional fields from gateway


class PaymentVerificationRequest(BaseModel):
    """Schema for payment verification request."""
    transaction_id: str = Field(..., description="Transaction ID to verify")
    
    @validator('transaction_id')
    def validate_transaction_id(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Transaction ID cannot be empty')
        return v.strip()


class RefundRequest(BaseModel):
    """Schema for refund request."""
    payment_id: UUID = Field(..., description="Payment ID to refund")
    refund_amount: float = Field(..., gt=0, description="Amount to refund")
    refund_reason: str = Field(..., min_length=1, max_length=500, description="Reason for refund")
    
    @validator('refund_amount')
    def validate_refund_amount(cls, v):
        if v <= 0:
            raise ValueError('Refund amount must be greater than 0')
        if v > 999999.99:
            raise ValueError('Refund amount too large')
        return round(v, 2)
    
    class Config:
        json_encoders = {
            UUID: str
        }


class WebhookRequest(BaseModel):
    """Schema for webhook notification."""
    webhook_id: str = Field(..., description="Webhook ID from gateway")
    order_id: str = Field(..., description="Order/Transaction ID")
    status: str = Field(..., description="Payment status from gateway")
    amount: Optional[float] = Field(None, description="Payment amount")
    gateway_transaction_id: Optional[str] = Field(None, description="Gateway transaction ID")
    signature: Optional[str] = Field(None, description="Webhook signature for verification")
    
    class Config:
        extra = "allow"  # Allow additional webhook fields


# Response Schemas

class PaymentResponse(BaseModel):
    """Schema for payment response."""
    id: UUID
    order_id: UUID
    transaction_id: str
    gateway_transaction_id: Optional[str]
    amount: float
    currency: str
    payment_method: PaymentMethodEnum
    payment_status: PaymentStatusEnum
    customer_name: str
    customer_email: str
    customer_phone: str
    card_number_masked: Optional[str]
    card_type: Optional[str]
    bank_name: Optional[str]
    upi_id: Optional[str]
    initiated_at: Optional[datetime]
    completed_at: Optional[datetime]
    refund_amount: float
    is_verified: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            UUID: str,
            datetime: lambda v: v.isoformat() if v else None
        }


class PaymentInitiateResponse(BaseModel):
    """Schema for payment initiation response."""
    success: bool
    payment: PaymentResponse
    payment_form: str = Field(..., description="HTML form for payment gateway redirect")
    gateway_url: str = Field(..., description="Payment gateway URL")
    message: str = Field(default="Payment initiated successfully")
    
    class Config:
        json_encoders = {
            UUID: str
        }


class PaymentCallbackResponse(BaseModel):
    """Schema for payment callback response."""
    success: bool
    payment: PaymentResponse
    order_id: UUID
    transaction_status: PaymentStatusEnum
    message: str
    redirect_url: Optional[str] = Field(None, description="URL to redirect user after callback")
    
    class Config:
        json_encoders = {
            UUID: str
        }


class PaymentVerificationResponse(BaseModel):
    """Schema for payment verification response."""
    success: bool
    payment: PaymentResponse
    is_verified: bool
    gateway_status: Optional[str]
    message: str
    
    class Config:
        json_encoders = {
            UUID: str
        }


class RefundResponse(BaseModel):
    """Schema for refund response."""
    success: bool
    payment_id: UUID
    transaction_id: str
    refund_amount: float
    refund_reference: Optional[str]
    refund_status: str
    message: str
    gateway_response: Optional[Dict[str, str]] = Field(None, description="Gateway refund response")
    
    class Config:
        json_encoders = {
            UUID: str
        }


class PaymentListResponse(BaseModel):
    """Schema for payment list response."""
    success: bool
    payments: List[PaymentResponse]
    total_count: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool
    
    class Config:
        json_encoders = {
            UUID: str
        }


class PaymentStatsResponse(BaseModel):
    """Schema for payment statistics response."""
    success: bool
    total_payments: int
    successful_payments: int
    failed_payments: int
    pending_payments: int
    total_amount: float
    successful_amount: float
    refunded_amount: float
    success_rate: float = Field(..., description="Payment success rate as percentage")
    
    @validator('success_rate')
    def validate_success_rate(cls, v):
        return round(v, 2)


class WebhookResponse(BaseModel):
    """Schema for webhook response."""
    success: bool
    webhook_id: str
    processed: bool
    is_verified: bool
    message: str
    payment_updated: bool = Field(default=False, description="Whether associated payment was updated")


class PaymentMethodsResponse(BaseModel):
    """Schema for available payment methods response."""
    success: bool
    payment_methods: List[Dict[str, str]] = Field(
        ..., 
        description="List of available payment methods with details"
    )
    
    class Config:
        schema_extra = {
            "example": {
                "success": True,
                "payment_methods": [
                    {
                        "method": "credit_card",
                        "name": "Credit Card",
                        "description": "Visa, MasterCard, American Express",
                        "icon": "credit-card"
                    },
                    {
                        "method": "debit_card", 
                        "name": "Debit Card",
                        "description": "All major bank debit cards",
                        "icon": "debit-card"
                    },
                    {
                        "method": "net_banking",
                        "name": "Net Banking", 
                        "description": "50+ banks supported",
                        "icon": "bank"
                    },
                    {
                        "method": "upi",
                        "name": "UPI",
                        "description": "PhonePe, GPay, Paytm, BHIM",
                        "icon": "upi"
                    },
                    {
                        "method": "wallet",
                        "name": "Digital Wallets",
                        "description": "Paytm, Amazon Pay, MobiKwik",
                        "icon": "wallet"
                    }
                ]
            }
        }


# Error Schemas

class PaymentError(BaseModel):
    """Schema for payment error response."""
    success: bool = False
    error_code: str
    error_message: str
    transaction_id: Optional[str] = None
    details: Optional[Dict[str, str]] = None


class ValidationError(BaseModel):
    """Schema for validation error response."""
    success: bool = False
    error_code: str = "validation_error"
    error_message: str = "Request validation failed"
    validation_errors: List[Dict[str, str]]


# Update existing schemas to include payment information

class OrderWithPayments(BaseModel):
    """Schema for order with payment information."""
    id: UUID
    order_number: str
    customer_name: str
    customer_email: str
    customer_phone: str
    total_amount: float
    final_amount: float
    status: str
    payments: List[PaymentResponse]
    payment_status: str
    is_paid: bool
    total_paid_amount: float
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        json_encoders = {
            UUID: str,
            datetime: lambda v: v.isoformat() if v else None
        }