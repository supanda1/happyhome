"""
Database models for the household services application.

This module contains all the database models using SQLAlchemy ORM for PostgreSQL.
All models include proper validation, relationships, and business logic.
"""

# Import the base classes and database connection
from .base import Base, BaseModel

# Import all models
from .user import User, UserAddress, RefreshToken, UserRole
from .service import (
    ServiceCategory, 
    ServiceSubcategory, 
    Service, 
    ServicePhoto, 
    ServiceVariant
)
from .review import Review, ReviewPhoto, ReviewHelpfulness
from .booking import Booking, CartItem, BookingStatus, PaymentStatus
from .order import Order, OrderItem, OrderStatus, OrderPriority, ItemStatus
from .coupon import Coupon, CouponUsage, CouponType, CouponStatus
from .employee import Employee
from .notification import (
    Notification, 
    NotificationTemplate, 
    UserNotificationPreference, 
    NotificationLog,
    NotificationType, 
    NotificationEvent, 
    NotificationStatus, 
    NotificationPriority
)

# Import database utilities
from ..database.connection import (
    Database,
    get_db_session,
    get_redis_client,
    Cache,
    check_database_health,
    check_redis_health
)

__all__ = [
    # Base
    "Base",
    "BaseModel",
    
    # User models
    "User",
    "UserAddress", 
    "RefreshToken",
    "UserRole",
    
    # Service models
    "ServiceCategory",
    "ServiceSubcategory",
    "Service",
    "ServicePhoto",
    "ServiceVariant",
    
    # Review models
    "Review",
    "ReviewPhoto",
    "ReviewHelpfulness",
    
    # Booking models
    "Booking",
    "CartItem",
    "BookingStatus",
    "PaymentStatus",
    
    # Order models
    "Order",
    "OrderItem", 
    "OrderStatus",
    "OrderPriority",
    "ItemStatus",
    
    # Coupon models
    "Coupon",
    "CouponUsage",
    "CouponType",
    "CouponStatus",
    
    # Employee models
    "Employee",
    
    # Notification models
    "Notification",
    "NotificationTemplate", 
    "UserNotificationPreference",
    "NotificationLog",
    "NotificationType",
    "NotificationEvent",
    "NotificationStatus",
    "NotificationPriority",
    
    # Database utilities
    "Database",
    "get_db_session",
    "get_redis_client",
    "Cache",
    "check_database_health",
    "check_redis_health",
]