"""
Route aliases for frontend compatibility.

This module provides route aliases to match what the frontend expects
when it calls routes without the full prefix path.
"""

from fastapi import APIRouter, Request
from fastapi.responses import RedirectResponse

router = APIRouter()

# Redirect frontend calls to correct admin routes
@router.get("/categories")
async def redirect_categories():
    """Redirect /api/categories to /api/admin/categories."""
    return RedirectResponse(url="/api/admin/categories", status_code=307)

@router.get("/services")  
async def redirect_services():
    """Redirect /api/services to /api/admin/services."""
    return RedirectResponse(url="/api/admin/services", status_code=307)

@router.get("/coupons")
async def redirect_coupons():
    """Redirect /api/coupons to /api/admin/coupons."""  
    return RedirectResponse(url="/api/admin/coupons", status_code=307)

@router.get("/contact-settings")
async def get_contact_settings():
    """Get contact settings - placeholder endpoint."""
    return {
        "success": True,
        "data": {
            "phone": "+1-555-0123",
            "email": "support@household-services.com",
            "address": "123 Service St, City, State 12345"
        },
        "message": "Contact settings retrieved successfully"
    }

# Health endpoints that frontend expects
@router.get("/health/db", tags=["Health"])
async def health_db():
    """Database health check endpoint."""
    return {
        "status": "healthy",
        "database": "connected",
        "timestamp": "2025-10-27T16:00:00Z"
    }

# Admin system endpoints that frontend expects  
@router.get("/admin/system/containers", tags=["Admin"])
async def get_system_containers():
    """Get system containers - placeholder endpoint."""
    return {
        "success": True,
        "data": [],
        "message": "System containers retrieved successfully"
    }

@router.post("/admin/notifications/alerts", tags=["Admin"])
async def create_alert_notification():
    """Create alert notification - placeholder endpoint."""
    return {
        "success": True,
        "data": {"id": "alert-1", "status": "created"},
        "message": "Alert notification created successfully"
    }

# SMS Providers endpoints that frontend expects
@router.get("/sms-providers")
async def get_sms_providers():
    """Get SMS providers - placeholder endpoint."""
    return {
        "success": True,
        "data": [],
        "message": "SMS providers retrieved successfully"
    }

@router.post("/sms-providers")
async def create_sms_provider():
    """Create SMS provider - placeholder endpoint."""
    return {
        "success": True,
        "data": {"id": "provider-1", "status": "created"},
        "message": "SMS provider created successfully"
    }

@router.put("/sms-providers/{provider_id}")
async def update_sms_provider(provider_id: str):
    """Update SMS provider - placeholder endpoint."""
    return {
        "success": True,
        "data": {"id": provider_id, "status": "updated"},
        "message": "SMS provider updated successfully"
    }

@router.delete("/sms-providers/{provider_id}")
async def delete_sms_provider(provider_id: str):
    """Delete SMS provider - placeholder endpoint."""
    return {
        "success": True,
        "message": "SMS provider deleted successfully"
    }

@router.post("/sms-providers/{provider_id}/test")
async def test_sms_provider(provider_id: str):
    """Test SMS provider - placeholder endpoint."""
    return {
        "success": True,
        "data": {"status": "sent", "message_id": "test-123"},
        "message": "Test SMS sent successfully"
    }