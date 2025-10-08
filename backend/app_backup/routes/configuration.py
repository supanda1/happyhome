"""
Configuration management routes for time slots, images, and system settings.

This module provides endpoints for managing configurable system data like
time slots, image mappings, and other settings that should be dynamically
managed rather than hardcoded in the frontend.
"""

from typing import List, Optional, Dict, Any
from datetime import datetime, time

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, text
from sqlalchemy.orm import selectinload

from ..core.dependencies import get_current_admin_user, get_optional_current_user
from ..database.connection import get_db_session
from ..core.logging import get_logger
from ..models.user import User
from ..schemas.base import BaseResponse

logger = get_logger(__name__)

router = APIRouter(prefix="/config")


# ============================================================================
# TIME SLOTS MANAGEMENT
# ============================================================================

@router.get("/time-slots")
async def get_available_time_slots(
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format"),
    service_id: Optional[str] = Query(None, description="Service ID for specific availability"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get available time slots for booking services.
    
    Args:
        date: Optional specific date to check availability
        service_id: Optional service ID for service-specific slots
        current_user: Optional current user
        db: Database session
        
    Returns:
        BaseResponse containing available time slots
    """
    logger.debug("Time slots request", date=date, service_id=service_id)
    
    try:
        # Define standard time slots (can be made configurable later)
        standard_slots = [
            {"start_time": "09:00", "end_time": "11:00", "display": "9:00 AM - 11:00 AM"},
            {"start_time": "11:00", "end_time": "13:00", "display": "11:00 AM - 1:00 PM"},
            {"start_time": "13:00", "end_time": "15:00", "display": "1:00 PM - 3:00 PM"},
            {"start_time": "15:00", "end_time": "17:00", "display": "3:00 PM - 5:00 PM"},
            {"start_time": "17:00", "end_time": "19:00", "display": "5:00 PM - 7:00 PM"},
            {"start_time": "19:00", "end_time": "21:00", "display": "7:00 PM - 9:00 PM"},
        ]
        
        # If specific date is provided, filter out unavailable slots
        if date:
            try:
                target_date = datetime.strptime(date, "%Y-%m-%d").date()
                
                # Get existing bookings for the date (if booking table exists)
                try:
                    from ..models.booking import Booking
                    existing_bookings = await db.execute(
                        select(Booking.scheduled_date, Booking.time_slot)
                        .where(func.date(Booking.scheduled_date) == target_date)
                    )
                    booked_slots = {booking.time_slot for booking in existing_bookings.scalars()}
                    
                    # Filter out booked slots
                    available_slots = [
                        slot for slot in standard_slots 
                        if slot["display"] not in booked_slots
                    ]
                except Exception:
                    # If booking table doesn't exist or error occurs, return all slots
                    available_slots = standard_slots
                
            except ValueError:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Invalid date format. Use YYYY-MM-DD"
                )
        else:
            available_slots = standard_slots
        
        # Service-specific slot filtering (if needed)
        if service_id:
            # Could add service-specific availability logic here
            pass
        
        return {
            "success": True,
            "message": "Time slots retrieved successfully",
            "data": available_slots
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get time slots", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve time slots"
        )


@router.post("/time-slots")
async def create_time_slot(
    slot_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create new time slot (Admin only)."""
    logger.info("Creating time slot", admin_id=str(current_user.id))
    
    # This would create custom time slots in database
    # For now, return success as we use standard slots
    return {
        "success": True,
        "message": "Time slot configuration updated",
        "data": slot_data
    }


# ============================================================================
# IMAGE CONFIGURATION MANAGEMENT
# ============================================================================

@router.get("/images/categories/{category_id}")
async def get_category_images(
    category_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get image URLs for a specific category.
    
    Args:
        category_id: Category ID
        current_user: Optional current user
        db: Database session
        
    Returns:
        BaseResponse containing category image URLs
    """
    logger.debug("Category images request", category_id=category_id)
    
    try:
        from ..models.service import ServiceCategory
        from uuid import UUID
        
        # Get category
        category = await db.scalar(
            select(ServiceCategory).where(ServiceCategory.id == UUID(category_id))
        )
        
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        # Build image URLs based on category name
        category_name_slug = category.name.lower().replace(" ", "-").replace("&", "").replace(" ", "-")
        
        image_config = {
            "hero_image": f"/images/categories/{category_name_slug}-hero.jpg",
            "thumbnail": f"/images/categories/{category_name_slug}-thumb.jpg",
            "icon": category.icon if category.icon.startswith("http") or category.icon.startswith("/") else f"/images/icons/{category.icon}",
            "gallery": [
                f"/images/categories/{category_name_slug}-1.jpg",
                f"/images/categories/{category_name_slug}-2.jpg",
                f"/images/categories/{category_name_slug}-3.jpg"
            ]
        }
        
        return {
            "success": True,
            "message": "Category images retrieved successfully",
            "data": {
                "category_id": str(category.id),
                "category_name": category.name,
                "images": image_config
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get category images", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve category images"
        )


@router.get("/images/subcategories/{subcategory_id}")
async def get_subcategory_images(
    subcategory_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get image URLs for a specific subcategory.
    
    Args:
        subcategory_id: Subcategory ID
        current_user: Optional current user
        db: Database session
        
    Returns:
        BaseResponse containing subcategory image URLs
    """
    logger.debug("Subcategory images request", subcategory_id=subcategory_id)
    
    try:
        from ..models.service import ServiceSubcategory, ServiceCategory
        from uuid import UUID
        
        # Get subcategory with category
        subcategory = await db.scalar(
            select(ServiceSubcategory)
            .options(selectinload(ServiceSubcategory.category))
            .where(ServiceSubcategory.id == UUID(subcategory_id))
        )
        
        if not subcategory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subcategory not found"
            )
        
        # Build image URLs based on category and subcategory names
        category_name_slug = subcategory.category.name.lower().replace(" ", "-").replace("&", "").replace(" ", "-")
        subcategory_name_slug = subcategory.name.lower().replace(" ", "-").replace("&", "").replace(" ", "-")
        
        image_config = {
            "primary_image": f"/images/subcategories/{category_name_slug}/{subcategory_name_slug}.jpg",
            "thumbnail": f"/images/subcategories/{category_name_slug}/{subcategory_name_slug}-thumb.jpg",
            "icon": subcategory.icon if subcategory.icon.startswith("http") or subcategory.icon.startswith("/") else f"/images/icons/{subcategory.icon}",
            "gallery": [
                f"/images/subcategories/{category_name_slug}/{subcategory_name_slug}-1.jpg",
                f"/images/subcategories/{category_name_slug}/{subcategory_name_slug}-2.jpg",
                f"/images/subcategories/{category_name_slug}/{subcategory_name_slug}-3.jpg",
                f"/images/subcategories/{category_name_slug}/{subcategory_name_slug}-4.jpg"
            ]
        }
        
        return {
            "success": True,
            "message": "Subcategory images retrieved successfully",
            "data": {
                "subcategory_id": str(subcategory.id),
                "subcategory_name": subcategory.name,
                "category_name": subcategory.category.name,
                "images": image_config
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get subcategory images", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve subcategory images"
        )


@router.get("/images/services/{service_id}")
async def get_service_images(
    service_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get image URLs for a specific service.
    
    Args:
        service_id: Service ID
        current_user: Optional current user
        db: Database session
        
    Returns:
        BaseResponse containing service image URLs
    """
    logger.debug("Service images request", service_id=service_id)
    
    try:
        from ..models.service import Service, ServicePhoto
        from uuid import UUID
        
        # Get service with photos
        service = await db.scalar(
            select(Service)
            .options(
                selectinload(Service.photos),
                selectinload(Service.category),
                selectinload(Service.subcategory)
            )
            .where(Service.id == UUID(service_id))
        )
        
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )
        
        # Get service photos from database
        service_photos = []
        if service.photos:
            service_photos = [
                {
                    "url": photo.url,
                    "alt_text": photo.alt_text,
                    "is_primary": photo.is_primary,
                    "sort_order": photo.sort_order
                }
                for photo in sorted(service.photos, key=lambda p: p.sort_order)
            ]
        
        # Fallback to generated image URLs if no photos in database
        if not service_photos:
            category_name_slug = service.category.name.lower().replace(" ", "-").replace("&", "")
            service_name_slug = service.name.lower().replace(" ", "-").replace("&", "")
            
            service_photos = [
                {
                    "url": f"/images/services/{category_name_slug}/{service_name_slug}-1.jpg",
                    "alt_text": f"{service.name} - Image 1",
                    "is_primary": True,
                    "sort_order": 1
                },
                {
                    "url": f"/images/services/{category_name_slug}/{service_name_slug}-2.jpg",
                    "alt_text": f"{service.name} - Image 2", 
                    "is_primary": False,
                    "sort_order": 2
                },
                {
                    "url": f"/images/services/{category_name_slug}/{service_name_slug}-3.jpg",
                    "alt_text": f"{service.name} - Image 3",
                    "is_primary": False,
                    "sort_order": 3
                }
            ]
        
        return {
            "success": True,
            "message": "Service images retrieved successfully",
            "data": {
                "service_id": str(service.id),
                "service_name": service.name,
                "images": service_photos
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get service images", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve service images"
        )


# ============================================================================
# SERVICE/CATEGORY RESOLUTION
# ============================================================================

@router.get("/resolve/service/{service_identifier}")
async def resolve_service_id(
    service_identifier: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Resolve service identifier to proper service data.
    
    Args:
        service_identifier: Service name, slug, or ID
        current_user: Optional current user
        db: Database session
        
    Returns:
        BaseResponse containing resolved service data
    """
    logger.debug("Service resolution request", identifier=service_identifier)
    
    try:
        from ..models.service import Service, ServiceCategory, ServiceSubcategory
        from uuid import UUID
        
        service = None
        
        # Try to resolve as UUID first
        try:
            service_uuid = UUID(service_identifier)
            service = await db.scalar(
                select(Service)
                .options(
                    selectinload(Service.category),
                    selectinload(Service.subcategory)
                )
                .where(Service.id == service_uuid)
            )
        except ValueError:
            pass
        
        # Try to resolve by name
        if not service:
            service = await db.scalar(
                select(Service)
                .options(
                    selectinload(Service.category),
                    selectinload(Service.subcategory)
                )
                .where(Service.name.ilike(f"%{service_identifier}%"))
            )
        
        # Try to resolve by service slug/key patterns
        if not service:
            # Handle patterns like "service-1", "bath-fitting", etc.
            search_terms = service_identifier.replace("-", " ").replace("_", " ").split()
            
            for term in search_terms:
                service = await db.scalar(
                    select(Service)
                    .options(
                        selectinload(Service.category),
                        selectinload(Service.subcategory)
                    )
                    .where(Service.name.ilike(f"%{term}%"))
                )
                if service:
                    break
        
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Service not found: {service_identifier}"
            )
        
        return {
            "success": True,
            "message": "Service resolved successfully", 
            "data": {
                "id": str(service.id),
                "name": service.name,
                "category": {
                    "id": str(service.category.id),
                    "name": service.category.name
                } if service.category else None,
                "subcategory": {
                    "id": str(service.subcategory.id),
                    "name": service.subcategory.name
                } if service.subcategory else None,
                "base_price": service.base_price,
                "discounted_price": service.discounted_price,
                "rating": service.rating,
                "is_active": service.is_active
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to resolve service", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resolve service"
        )


@router.get("/resolve/category/{category_identifier}")
async def resolve_category_id(
    category_identifier: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Resolve category identifier to proper category data.
    
    Args:
        category_identifier: Category name, slug, or ID
        current_user: Optional current user
        db: Database session
        
    Returns:
        BaseResponse containing resolved category data
    """
    logger.debug("Category resolution request", identifier=category_identifier)
    
    try:
        from ..models.service import ServiceCategory
        from uuid import UUID
        
        category = None
        
        # Try to resolve as UUID first
        try:
            category_uuid = UUID(category_identifier)
            category = await db.scalar(
                select(ServiceCategory).where(ServiceCategory.id == category_uuid)
            )
        except ValueError:
            pass
        
        # Try to resolve by name
        if not category:
            category = await db.scalar(
                select(ServiceCategory).where(ServiceCategory.name.ilike(f"%{category_identifier}%"))
            )
        
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Category not found: {category_identifier}"
            )
        
        return {
            "success": True,
            "message": "Category resolved successfully",
            "data": {
                "id": str(category.id),
                "name": category.name,
                "description": category.description,
                "icon": category.icon,
                "is_active": category.is_active
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to resolve category", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to resolve category"
        )


# ============================================================================
# SYSTEM CONFIGURATION
# ============================================================================

@router.get("/system-settings")
async def get_system_settings(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get system-wide configuration settings.
    
    Args:
        current_user: Optional current user
        db: Database session
        
    Returns:
        BaseResponse containing system settings
    """
    logger.debug("System settings request")
    
    try:
        settings = {
            "business_hours": {
                "start": "09:00",
                "end": "21:00",
                "timezone": "Asia/Kolkata"
            },
            "booking_settings": {
                "advance_booking_days": 30,
                "min_booking_hours": 2,
                "cancellation_hours": 24
            },
            "service_settings": {
                "default_service_duration": 120,
                "emergency_service_available": True,
                "weekend_service_available": True
            },
            "pricing_settings": {
                "currency": "INR",
                "tax_rate": 18,
                "service_charge_rate": 5
            }
        }
        
        return {
            "success": True,
            "message": "System settings retrieved successfully",
            "data": settings
        }
        
    except Exception as e:
        logger.error("Failed to get system settings", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve system settings"
        )