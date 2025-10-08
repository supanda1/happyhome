"""
Notification system models for SMS and email notifications.

This module handles:
- Notification records and delivery status
- Notification templates for different events
- User notification preferences
- Notification delivery history and analytics
"""

from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
from uuid import UUID, uuid4

from sqlalchemy import Boolean, DateTime, Float, Integer, String, Text, ForeignKey, JSON, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class NotificationType(str, Enum):
    """Notification delivery type enumeration."""
    SMS = "sms"
    EMAIL = "email"
    PUSH = "push"  # For future mobile app integration


class NotificationStatus(str, Enum):
    """Notification delivery status enumeration."""
    PENDING = "pending"
    SENT = "sent"
    DELIVERED = "delivered"
    FAILED = "failed"
    CANCELLED = "cancelled"


class NotificationEvent(str, Enum):
    """Notification event types for order lifecycle."""
    ORDER_PLACED = "order_placed"
    ORDER_CONFIRMED = "order_confirmed"
    ENGINEER_ASSIGNED = "engineer_assigned"
    SERVICE_SCHEDULED = "service_scheduled"
    ENGINEER_EN_ROUTE = "engineer_en_route"
    SERVICE_STARTED = "service_started"
    SERVICE_COMPLETED = "service_completed"
    PAYMENT_REMINDER = "payment_reminder"
    FEEDBACK_REQUEST = "feedback_request"
    ORDER_CANCELLED = "order_cancelled"
    SERVICE_RESCHEDULED = "service_rescheduled"


class NotificationPriority(str, Enum):
    """Notification priority levels."""
    LOW = "low"
    NORMAL = "normal"
    HIGH = "high"
    URGENT = "urgent"


class Notification(Base):
    """
    Individual notification record.
    
    Tracks each notification sent to customers including delivery status,
    content, and metadata for analytics.
    """
    
    __tablename__ = "notifications"
    
    # Recipient information
    customer_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True
    )
    
    customer_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    
    customer_phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )
    
    customer_email: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    
    # Notification details
    notification_type: Mapped[NotificationType] = mapped_column(
        SQLEnum(NotificationType),
        nullable=False,
        index=True
    )
    
    event_type: Mapped[NotificationEvent] = mapped_column(
        SQLEnum(NotificationEvent),
        nullable=False,
        index=True
    )
    
    priority: Mapped[NotificationPriority] = mapped_column(
        SQLEnum(NotificationPriority),
        nullable=False,
        default=NotificationPriority.NORMAL
    )
    
    # Content
    subject: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True  # Only for emails
    )
    
    message: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    
    # Related entities
    order_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("orders.id"),
        nullable=True,
        index=True
    )
    
    order_number: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True,
        index=True
    )
    
    # Template information
    template_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("notification_templates.id"),
        nullable=True
    )
    
    # Delivery status
    status: Mapped[NotificationStatus] = mapped_column(
        SQLEnum(NotificationStatus),
        nullable=False,
        default=NotificationStatus.PENDING,
        index=True
    )
    
    # Timing
    scheduled_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )
    
    sent_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )
    
    delivered_at: Mapped[Optional[datetime]] = mapped_column(
        DateTime,
        nullable=True
    )
    
    # Provider details
    provider: Mapped[Optional[str]] = mapped_column(
        String(50),
        nullable=True  # e.g., "twilio", "sendgrid", "aws_sns"
    )
    
    provider_message_id: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    
    # Error handling
    error_message: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    retry_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    
    max_retries: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=3
    )
    
    # Additional data
    extra_data: Mapped[Optional[Dict]] = mapped_column(
        JSON,
        nullable=True
    )
    
    # Relationships
    template: Mapped[Optional["NotificationTemplate"]] = relationship(
        "NotificationTemplate",
        back_populates="notifications",
        lazy="select"
    )
    
    def dict_for_response(self, exclude: set = None) -> Dict[str, any]:
        """Get notification data for API responses."""
        data = self.to_dict(exclude=exclude)
        
        return {
            "id": data["id"],
            "customer_id": data["customer_id"],
            "customer_name": data["customer_name"],
            "customer_phone": data["customer_phone"],
            "customer_email": data["customer_email"],
            "notification_type": data["notification_type"],
            "event_type": data["event_type"],
            "priority": data["priority"],
            "subject": data["subject"],
            "message": data["message"],
            "order_id": data["order_id"],
            "order_number": data["order_number"],
            "status": data["status"],
            "scheduled_at": data["scheduled_at"],
            "sent_at": data["sent_at"],
            "delivered_at": data["delivered_at"],
            "provider": data["provider"],
            "error_message": data["error_message"],
            "retry_count": data["retry_count"],
            "created_at": data["created_at"],
            "updated_at": data["updated_at"],
            "extra_data": data["extra_data"]
        }


class NotificationTemplate(Base):
    """
    Notification templates for different events.
    
    Stores reusable message templates with placeholders that can be
    customized for different notification events.
    """
    
    __tablename__ = "notification_templates"
    
    # Template identification
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        unique=True,
        index=True
    )
    
    event_type: Mapped[NotificationEvent] = mapped_column(
        SQLEnum(NotificationEvent),
        nullable=False,
        index=True
    )
    
    notification_type: Mapped[NotificationType] = mapped_column(
        SQLEnum(NotificationType),
        nullable=False,
        index=True
    )
    
    # Template content
    subject_template: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True  # Only for emails
    )
    
    message_template: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    
    # Template metadata
    description: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True
    )
    
    # Available variables for template
    available_variables: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list
    )
    
    # Sample data for preview
    sample_data: Mapped[Optional[Dict]] = mapped_column(
        JSON,
        nullable=True
    )
    
    # Relationships
    notifications: Mapped[List["Notification"]] = relationship(
        "Notification",
        back_populates="template",
        cascade="all, delete-orphan",
        lazy="select"
    )
    
    def render_template(self, variables: Dict[str, str]) -> Dict[str, str]:
        """Render template with provided variables."""
        try:
            rendered_subject = None
            if self.subject_template:
                rendered_subject = self.subject_template.format(**variables)
            
            rendered_message = self.message_template.format(**variables)
            
            return {
                "subject": rendered_subject,
                "message": rendered_message
            }
        except KeyError as e:
            raise ValueError(f"Missing template variable: {e}")
        except Exception as e:
            raise ValueError(f"Template rendering error: {e}")
    
    def dict_for_response(self, exclude: set = None) -> Dict[str, any]:
        """Get template data for API responses."""
        data = self.to_dict(exclude=exclude)
        
        return {
            "id": data["id"],
            "name": data["name"],
            "event_type": data["event_type"],
            "notification_type": data["notification_type"],
            "subject_template": data["subject_template"],
            "message_template": data["message_template"],
            "description": data["description"],
            "is_active": data["is_active"],
            "available_variables": data["available_variables"],
            "sample_data": data["sample_data"],
            "created_at": data["created_at"],
            "updated_at": data["updated_at"]
        }


class UserNotificationPreference(Base):
    """
    User notification preferences.
    
    Stores user preferences for receiving different types of notifications
    via different channels (SMS, email).
    """
    
    __tablename__ = "user_notification_preferences"
    
    # User identification
    user_id: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
        index=True
    )
    
    # Notification channel preferences
    sms_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )
    
    email_enabled: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )
    
    # Event-specific preferences
    order_updates: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )
    
    engineer_updates: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )
    
    marketing_notifications: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )
    
    promotional_offers: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )
    
    # Timing preferences
    quiet_hours_start: Mapped[Optional[str]] = mapped_column(
        String(5),  # HH:MM format
        nullable=True,
        default="22:00"
    )
    
    quiet_hours_end: Mapped[Optional[str]] = mapped_column(
        String(5),  # HH:MM format
        nullable=True,
        default="08:00"
    )
    
    # Contact preferences
    preferred_phone: Mapped[Optional[str]] = mapped_column(
        String(20),
        nullable=True
    )
    
    preferred_email: Mapped[Optional[str]] = mapped_column(
        String(100),
        nullable=True
    )
    
    # Timezone
    timezone: Mapped[str] = mapped_column(
        String(50),
        nullable=False,
        default="Asia/Kolkata"
    )
    
    def should_send_notification(self, event_type: NotificationEvent, notification_type: NotificationType) -> bool:
        """Check if notification should be sent based on user preferences."""
        # Check if notification type is enabled
        if notification_type == NotificationType.SMS and not self.sms_enabled:
            return False
        if notification_type == NotificationType.EMAIL and not self.email_enabled:
            return False
        
        # Check event-specific preferences
        if event_type in [
            NotificationEvent.ORDER_PLACED,
            NotificationEvent.ORDER_CONFIRMED,
            NotificationEvent.SERVICE_COMPLETED,
            NotificationEvent.ORDER_CANCELLED
        ] and not self.order_updates:
            return False
        
        if event_type in [
            NotificationEvent.ENGINEER_ASSIGNED,
            NotificationEvent.SERVICE_SCHEDULED,
            NotificationEvent.ENGINEER_EN_ROUTE,
            NotificationEvent.SERVICE_STARTED
        ] and not self.engineer_updates:
            return False
        
        return True
    
    def dict_for_response(self, exclude: set = None) -> Dict[str, any]:
        """Get preferences data for API responses."""
        data = self.to_dict(exclude=exclude)
        
        return {
            "id": data["id"],
            "user_id": data["user_id"],
            "sms_enabled": data["sms_enabled"],
            "email_enabled": data["email_enabled"],
            "order_updates": data["order_updates"],
            "engineer_updates": data["engineer_updates"],
            "marketing_notifications": data["marketing_notifications"],
            "promotional_offers": data["promotional_offers"],
            "quiet_hours_start": data["quiet_hours_start"],
            "quiet_hours_end": data["quiet_hours_end"],
            "preferred_phone": data["preferred_phone"],
            "preferred_email": data["preferred_email"],
            "timezone": data["timezone"],
            "created_at": data["created_at"],
            "updated_at": data["updated_at"]
        }


class NotificationLog(Base):
    """
    Notification delivery log for analytics and debugging.
    
    Stores detailed logs of notification sending attempts,
    delivery confirmations, and error tracking.
    """
    
    __tablename__ = "notification_logs"
    
    # Reference to notification
    notification_id: Mapped[UUID] = mapped_column(
        ForeignKey("notifications.id"),
        nullable=False,
        index=True
    )
    
    # Log details
    action: Mapped[str] = mapped_column(
        String(50),
        nullable=False  # send_attempt, delivered, failed, retry
    )
    
    status_code: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True
    )
    
    provider_response: Mapped[Optional[Dict]] = mapped_column(
        JSON,
        nullable=True
    )
    
    error_details: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    # Timing
    logged_at: Mapped[datetime] = mapped_column(
        DateTime,
        nullable=False,
        default=datetime.utcnow
    )
    
    # Processing time
    processing_time_ms: Mapped[Optional[int]] = mapped_column(
        Integer,
        nullable=True
    )
    
    def dict_for_response(self, exclude: set = None) -> Dict[str, any]:
        """Get log data for API responses."""
        data = self.to_dict(exclude=exclude)
        
        return {
            "id": data["id"],
            "notification_id": data["notification_id"],
            "action": data["action"],
            "status_code": data["status_code"],
            "provider_response": data["provider_response"],
            "error_details": data["error_details"],
            "logged_at": data["logged_at"],
            "processing_time_ms": data["processing_time_ms"],
            "created_at": data["created_at"]
        }