"""
API route modules for the household services application.

This module exports all API routers for easy import and registration
with the main FastAPI application.
"""

from .admin import router as admin_router
from .analytics import router as analytics_router
from .auth import router as auth_router
from .bookings import router as bookings_router  
from .cart import router as cart_router
from .configuration import router as configuration_router
from .coupons import router as coupons_router
from .dashboard import router as dashboard_router
from .health import router as health_router
from .images import router as images_router
from .notifications import router as notifications_router
from .orders import router as orders_router
from .reviews import router as reviews_router
from .services import router as services_router
from .sms_config import router as sms_config_router

__all__ = [
    "admin_router",
    "analytics_router",
    "auth_router",
    "bookings_router",
    "cart_router",
    "configuration_router",
    "coupons_router", 
    "dashboard_router",
    "health_router",
    "images_router",
    "notifications_router",
    "orders_router",
    "reviews_router",
    "services_router",
    "sms_config_router",
]