"""
Order management models for multi-item service orders.

This handles the complete order flow from cart to completion, including:
- Orders with multiple service items
- Order tracking and status management
- Engineer assignment per item
- Order-level pricing and customer information
"""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, ForeignKey, JSON, cast, text
from sqlalchemy.orm import Mapped, mapped_column, relationship, foreign

from .base import Base


class OrderStatus(str, Enum):
    """Order status enumeration."""
    PENDING = "pending"
    SCHEDULED = "scheduled" 
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    POSTPONED = "postponed"


class OrderPriority(str, Enum):
    """Order priority enumeration."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    URGENT = "urgent"


class ItemStatus(str, Enum):
    """Individual order item status enumeration."""
    PENDING = "pending"
    SCHEDULED = "scheduled"
    IN_PROGRESS = "in_progress" 
    COMPLETED = "completed"
    CANCELLED = "cancelled"
    POSTPONED = "postponed"


class Order(Base):
    """
    Order model for multi-item service orders.
    
    Represents a complete customer order that can contain multiple service items.
    Each order has a unique order number, customer information, and overall pricing.
    """
    
    __tablename__ = "orders"
    
    # Order identification
    order_number: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        unique=True,
        index=True
    )
    
    # Customer information  
    customer_id: Mapped[str] = mapped_column(
        String(255),  # Changed from UUID to String to match database schema
        nullable=False,
        index=True
    )
    
    customer_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    
    customer_phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )
    
    customer_email: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    
    # Service address (stored as JSON for flexibility)
    service_address: Mapped[Dict] = mapped_column(
        JSON,
        nullable=False
    )
    
    # Order totals
    total_amount: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    
    discount_amount: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0
    )
    
    gst_amount: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0
    )
    
    service_charge: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0
    )
    
    final_amount: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    
    # Order status and priority
    status: Mapped[OrderStatus] = mapped_column(
        String(20),
        nullable=False,
        default=OrderStatus.PENDING,
        index=True
    )
    
    priority: Mapped[OrderPriority] = mapped_column(
        String(10),
        nullable=False,
        default=OrderPriority.MEDIUM,
        index=True
    )
    
    # Notes
    notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    admin_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    # Customer feedback
    customer_rating: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True
    )
    
    customer_review: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    # Relationships - Removed problematic customer relationship for now
    
    items: Mapped[List["OrderItem"]] = relationship(
        "OrderItem",
        back_populates="order",
        cascade="all, delete-orphan",
        lazy="select"
    )
    
    @property
    def calculated_final_amount(self) -> float:
        """Calculate final amount from components."""
        return max(0, self.total_amount + self.gst_amount + self.service_charge - self.discount_amount)
    
    @property
    def total_items(self) -> int:
        """Get total number of items in order."""
        return sum(item.quantity for item in self.items)
    
    @property
    def completed_items(self) -> int:
        """Get number of completed items."""
        return sum(item.quantity for item in self.items if item.item_status == ItemStatus.COMPLETED)
    
    @property
    def progress_percentage(self) -> float:
        """Calculate order completion percentage."""
        if not self.total_items:
            return 0.0
        return (self.completed_items / self.total_items) * 100
    
    def generate_order_number(self) -> str:
        """Generate unique order number."""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        short_uuid = str(uuid4()).replace('-', '')[:8].upper()
        return f"HH-{timestamp}-{short_uuid}"
    
    def dict_for_response(self, exclude: set = None, include_relationships: bool = False) -> Dict[str, any]:
        """Get order data for API responses."""
        data = self.to_dict(exclude=exclude)
        
        result = {
            "id": data["id"],
            "order_number": data["order_number"],
            "customer_id": data["customer_id"],
            "customer_name": data["customer_name"],
            "customer_phone": data["customer_phone"],
            "customer_email": data["customer_email"],
            "service_address": data["service_address"],
            "total_amount": data["total_amount"],
            "discount_amount": data["discount_amount"],
            "gst_amount": data["gst_amount"],
            "service_charge": data["service_charge"],
            "final_amount": data["final_amount"],
            "status": data["status"],
            "priority": data["priority"],
            "notes": data["notes"],
            "admin_notes": data["admin_notes"],
            "customer_rating": data["customer_rating"],
            "customer_review": data["customer_review"],
            "total_items": self.total_items if include_relationships and hasattr(self, '_sa_instance_state') else 0,
            "completed_items": self.completed_items if include_relationships and hasattr(self, '_sa_instance_state') else 0,
            "progress_percentage": self.progress_percentage if include_relationships and hasattr(self, '_sa_instance_state') else 0.0,
            "created_at": data["created_at"],
            "updated_at": data["updated_at"],
        }
        
        # Include relationships if requested
        if include_relationships:
            if self.items:
                result["items"] = [item.dict_for_response() for item in self.items]
            
            # Customer relationship removed for string ID compatibility
        
        return result


class OrderItem(Base):
    """
    Individual item within an order.
    
    Represents a single service item within a multi-item order.
    Each item can have its own status, engineer assignment, and tracking.
    """
    
    __tablename__ = "order_items"
    
    # Order relationship
    order_id: Mapped[UUID] = mapped_column(
        ForeignKey("orders.id"),
        nullable=False,
        index=True
    )
    
    # Service information
    service_id: Mapped[str] = mapped_column(
        String(100),  # Changed from UUID to String for mock data compatibility
        nullable=False,
        index=True
    )
    
    service_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    
    variant_id: Mapped[Optional[str]] = mapped_column(
        String(100),  # Changed from UUID to String for mock data compatibility
        nullable=True,
        index=True
    )
    
    variant_name: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True
    )
    
    # Quantity and pricing
    quantity: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=1
    )
    
    unit_price: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    
    total_price: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    
    # Category information for engineer assignment
    category_id: Mapped[str] = mapped_column(
        String(100),  # Changed from UUID to String for mock data compatibility
        nullable=False,
        index=True
    )
    
    subcategory_id: Mapped[str] = mapped_column(
        String(100),  # Changed from UUID to String for mock data compatibility
        nullable=False,
        index=True
    )
    
    # Engineer assignment
    assigned_engineer_id: Mapped[Optional[str]] = mapped_column(
        String(100),  # Changed from UUID to String for mock data compatibility
        nullable=True,
        index=True
    )
    
    assigned_engineer_name: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    
    # Item status and scheduling
    item_status: Mapped[ItemStatus] = mapped_column(
        String(20),
        nullable=False,
        default=ItemStatus.PENDING,
        index=True
    )
    
    scheduled_date: Mapped[Optional[str]] = mapped_column(
        String(20),  # YYYY-MM-DD format
        nullable=True
    )
    
    scheduled_time_slot: Mapped[Optional[str]] = mapped_column(
        String(20),  # e.g., "09:00-11:00"
        nullable=True
    )
    
    completion_date: Mapped[Optional[str]] = mapped_column(
        String(20),  # YYYY-MM-DD format
        nullable=True
    )
    
    # Notes and feedback
    item_notes: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    item_rating: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True
    )
    
    item_review: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    # Relationships - Keeping only the main order relationship
    order: Mapped["Order"] = relationship(
        "Order",
        back_populates="items",
        lazy="select"
    )
    
    # Removed other relationships due to string ID compatibility issues
    # service, variant, category, subcategory, assigned_engineer relationships removed
    
    def dict_for_response(self, exclude: set = None, include_relationships: bool = False) -> Dict[str, any]:
        """Get order item data for API responses."""
        data = self.to_dict(exclude=exclude)
        
        result = {
            "id": data["id"],
            "order_id": data["order_id"],
            "service_id": data["service_id"],
            "service_name": data["service_name"],
            "variant_id": data["variant_id"],
            "variant_name": data["variant_name"],
            "quantity": data["quantity"],
            "unit_price": data["unit_price"],
            "total_price": data["total_price"],
            "category_id": data["category_id"],
            "subcategory_id": data["subcategory_id"],
            "assigned_engineer_id": data["assigned_engineer_id"],
            "assigned_engineer_name": data["assigned_engineer_name"],
            "item_status": data["item_status"],
            "scheduled_date": data["scheduled_date"],
            "scheduled_time_slot": data["scheduled_time_slot"],
            "completion_date": data["completion_date"],
            "item_notes": data["item_notes"],
            "item_rating": data["item_rating"],
            "item_review": data["item_review"],
            "created_at": data["created_at"],
        }
        
        # Include relationships if requested  
        # Note: Relationships removed for string ID compatibility
        # if include_relationships:
        #     # Relationships would be included here if they existed
        
        return result