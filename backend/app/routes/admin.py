"""
Admin API routes that match frontend adminDataManager.ts expectations.

This module provides the exact API endpoints that the frontend adminDataManager.ts
is calling, with proper URL structure and response formats.
"""

from typing import List, Optional, Dict, Any
from uuid import UUID
import time
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, and_, text
from sqlalchemy.orm import selectinload

from ..core.dependencies import get_current_admin_user
from ..database.connection import get_db_session
from ..core.logging import get_logger
from ..models.service import Service, ServiceCategory, ServiceSubcategory
from ..models.coupon import Coupon
from ..models.employee import Employee
from ..models.booking import Booking
from ..models.order import Order
from ..models.user import User
from ..schemas.base import BaseResponse

logger = get_logger(__name__)

router = APIRouter(prefix="/admin")


# ============================================================================
# CATEGORIES - Admin Management
# ============================================================================

@router.get("/categories")
async def get_admin_categories(
    include_inactive: bool = Query(False),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get all categories for admin management."""
    logger.info("Admin categories request", admin_id=str(current_user.id))
    
    try:
        query = select(ServiceCategory)
        if not include_inactive:
            query = query.where(ServiceCategory.is_active == True)
        query = query.order_by(ServiceCategory.sort_order, ServiceCategory.name)
        
        result = await db.execute(query)
        categories = result.scalars().all()
        
        categories_data = [category.dict_for_response() for category in categories]
        
        return {
            "success": True,
            "message": "Categories retrieved successfully",
            "data": categories_data
        }
        
    except Exception as e:
        logger.error("Failed to get admin categories", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve categories"
        )


@router.post("/categories")
async def create_admin_category(
    category_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create new category."""
    logger.info("Creating admin category", admin_id=str(current_user.id))
    
    try:
        # Check for existing category with same name
        existing = await db.scalar(
            select(ServiceCategory).where(ServiceCategory.name == category_data["name"])
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Category with this name already exists"
            )
        
        # Create category
        category = ServiceCategory(
            name=category_data["name"],
            description=category_data.get("description", ""),
            icon=category_data.get("icon", "🏠"),
            is_active=category_data.get("is_active", True),
            sort_order=category_data.get("sort_order", 0)
        )
        
        db.add(category)
        await db.commit()
        await db.refresh(category)
        
        return {
            "success": True,
            "message": "Category created successfully",
            "data": category.dict_for_response()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create category", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create category"
        )


@router.put("/categories/{category_id}")
async def update_admin_category(
    category_id: str,
    updates: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update category."""
    logger.info("Updating admin category", category_id=category_id, admin_id=str(current_user.id))
    
    try:
        category = await db.scalar(
            select(ServiceCategory).where(ServiceCategory.id == UUID(category_id))
        )
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        # Update fields
        for field, value in updates.items():
            if hasattr(category, field):
                setattr(category, field, value)
        
        await db.commit()
        await db.refresh(category)
        
        return {
            "success": True,
            "message": "Category updated successfully",
            "data": category.dict_for_response()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update category", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update category"
        )


@router.delete("/categories/{category_id}")
async def delete_admin_category(
    category_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete category."""
    logger.info("Deleting admin category", category_id=category_id, admin_id=str(current_user.id))
    
    try:
        category = await db.scalar(
            select(ServiceCategory).where(ServiceCategory.id == UUID(category_id))
        )
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        await db.delete(category)
        await db.commit()
        
        return {
            "success": True,
            "message": "Category deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete category", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete category"
        )


# ============================================================================
# SUBCATEGORIES - Admin Management
# ============================================================================

@router.get("/subcategories")
async def get_admin_subcategories(
    category_id: Optional[str] = Query(None),
    include_inactive: bool = Query(False),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get all subcategories for admin management."""
    logger.info("Admin subcategories request", admin_id=str(current_user.id))
    
    try:
        query = select(ServiceSubcategory)
        
        if category_id:
            query = query.where(ServiceSubcategory.category_id == UUID(category_id))
        
        if not include_inactive:
            query = query.where(ServiceSubcategory.is_active == True)
        
        query = query.order_by(ServiceSubcategory.sort_order, ServiceSubcategory.name)
        
        result = await db.execute(query)
        subcategories = result.scalars().all()
        
        subcategories_data = [subcategory.dict_for_response() for subcategory in subcategories]
        
        return {
            "success": True,
            "message": "Subcategories retrieved successfully",
            "data": subcategories_data
        }
        
    except Exception as e:
        logger.error("Failed to get admin subcategories", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve subcategories"
        )


@router.post("/subcategories")
async def create_admin_subcategory(
    subcategory_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create new subcategory."""
    logger.info("Creating admin subcategory", admin_id=str(current_user.id))
    
    try:
        # Verify category exists
        category = await db.scalar(
            select(ServiceCategory).where(ServiceCategory.id == UUID(subcategory_data["category_id"]))
        )
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Parent category not found"
            )
        
        # Create subcategory
        subcategory = ServiceSubcategory(
            category_id=UUID(subcategory_data["category_id"]),
            name=subcategory_data["name"],
            description=subcategory_data.get("description", ""),
            icon=subcategory_data.get("icon", "📋"),
            is_active=subcategory_data.get("is_active", True),
            sort_order=subcategory_data.get("sort_order", 0)
        )
        
        db.add(subcategory)
        await db.commit()
        await db.refresh(subcategory)
        
        return {
            "success": True,
            "message": "Subcategory created successfully",
            "data": subcategory.dict_for_response()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create subcategory", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create subcategory"
        )


@router.put("/subcategories/{subcategory_id}")
async def update_admin_subcategory(
    subcategory_id: str,
    updates: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update subcategory."""
    logger.info("Updating admin subcategory", subcategory_id=subcategory_id, admin_id=str(current_user.id))
    
    try:
        subcategory = await db.scalar(
            select(ServiceSubcategory).where(ServiceSubcategory.id == UUID(subcategory_id))
        )
        if not subcategory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subcategory not found"
            )
        
        # Update fields
        for field, value in updates.items():
            if hasattr(subcategory, field):
                setattr(subcategory, field, value)
        
        await db.commit()
        await db.refresh(subcategory)
        
        return {
            "success": True,
            "message": "Subcategory updated successfully",
            "data": subcategory.dict_for_response()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update subcategory", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update subcategory"
        )


@router.delete("/subcategories/{subcategory_id}")
async def delete_admin_subcategory(
    subcategory_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete subcategory."""
    logger.info("Deleting admin subcategory", subcategory_id=subcategory_id, admin_id=str(current_user.id))
    
    try:
        subcategory = await db.scalar(
            select(ServiceSubcategory).where(ServiceSubcategory.id == UUID(subcategory_id))
        )
        if not subcategory:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subcategory not found"
            )
        
        await db.delete(subcategory)
        await db.commit()
        
        return {
            "success": True,
            "message": "Subcategory deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete subcategory", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete subcategory"
        )


# ============================================================================
# SERVICES - Admin Management
# ============================================================================

@router.get("/services")
async def get_admin_services(
    category_id: Optional[str] = Query(None),
    subcategory_id: Optional[str] = Query(None),
    include_inactive: bool = Query(False),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get all services for admin management."""
    logger.info("Admin services request", admin_id=str(current_user.id))
    
    try:
        query = select(Service).options(
            selectinload(Service.category),
            selectinload(Service.subcategory)
        )
        
        if category_id:
            query = query.where(Service.category_id == UUID(category_id))
        
        if subcategory_id:
            query = query.where(Service.subcategory_id == UUID(subcategory_id))
        
        if not include_inactive:
            query = query.where(Service.is_active == True)
        
        query = query.order_by(Service.created_at.desc())
        
        result = await db.execute(query)
        services = result.scalars().all()
        
        services_data = [service.dict_for_response(include_relationships=True) for service in services]
        
        return {
            "success": True,
            "message": "Services retrieved successfully",
            "data": services_data
        }
        
    except Exception as e:
        logger.error("Failed to get admin services", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve services"
        )


@router.get("/services/{service_id}")
async def get_admin_service(
    service_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get single service for admin management."""
    logger.info("Admin service detail request", service_id=service_id, admin_id=str(current_user.id))
    
    try:
        service = await db.scalar(
            select(Service)
            .options(selectinload(Service.category), selectinload(Service.subcategory))
            .where(Service.id == UUID(service_id))
        )
        
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )
        
        return {
            "success": True,
            "message": "Service retrieved successfully",
            "data": service.dict_for_response(include_relationships=True)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get admin service", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve service"
        )


@router.post("/services")
async def create_admin_service(
    service_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create new service."""
    logger.info("Creating admin service", admin_id=str(current_user.id))
    
    try:
        # Verify category exists
        category = await db.scalar(
            select(ServiceCategory).where(ServiceCategory.id == UUID(service_data["category_id"]))
        )
        if not category:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Category not found"
            )
        
        # Create service
        service = Service(
            name=service_data["name"],
            category_id=UUID(service_data["category_id"]),
            subcategory_id=UUID(service_data["subcategory_id"]) if service_data.get("subcategory_id") else None,
            description=service_data.get("description", ""),
            short_description=service_data.get("short_description", ""),
            base_price=service_data.get("base_price", 0.0),
            discounted_price=service_data.get("discounted_price"),
            duration=service_data.get("duration", 60),
            inclusions=service_data.get("inclusions", []),
            exclusions=service_data.get("exclusions", []),
            requirements=service_data.get("requirements", []),
            rating=service_data.get("rating", 0.0),
            review_count=service_data.get("review_count", 0),
            booking_count=service_data.get("booking_count", 0),
            is_active=service_data.get("is_active", True),
            is_featured=service_data.get("is_featured", False),
            tags=service_data.get("tags", [])
        )
        
        db.add(service)
        await db.commit()
        await db.refresh(service)
        
        return {
            "success": True,
            "message": "Service created successfully",
            "data": service.dict_for_response()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create service", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create service"
        )


@router.put("/services/{service_id}")
async def update_admin_service(
    service_id: str,
    updates: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update service."""
    logger.info("Updating admin service", service_id=service_id, admin_id=str(current_user.id))
    
    try:
        service = await db.scalar(
            select(Service).where(Service.id == UUID(service_id))
        )
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )
        
        # Update fields
        for field, value in updates.items():
            if hasattr(service, field):
                setattr(service, field, value)
        
        await db.commit()
        await db.refresh(service)
        
        return {
            "success": True,
            "message": "Service updated successfully",
            "data": service.dict_for_response()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update service", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update service"
        )


@router.delete("/services/{service_id}")
async def delete_admin_service(
    service_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete service."""
    logger.info("Deleting admin service", service_id=service_id, admin_id=str(current_user.id))
    
    try:
        service = await db.scalar(
            select(Service).where(Service.id == UUID(service_id))
        )
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )
        
        await db.delete(service)
        await db.commit()
        
        return {
            "success": True,
            "message": "Service deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete service", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete service"
        )


@router.patch("/services/{service_id}/toggle")
async def toggle_admin_service_status(
    service_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Toggle service active status."""
    logger.info("Toggling admin service status", service_id=service_id, admin_id=str(current_user.id))
    
    try:
        service = await db.scalar(
            select(Service).where(Service.id == UUID(service_id))
        )
        if not service:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )
        
        service.is_active = not service.is_active
        await db.commit()
        await db.refresh(service)
        
        return {
            "success": True,
            "message": f"Service {'activated' if service.is_active else 'deactivated'} successfully",
            "data": service.dict_for_response()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to toggle service status", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to toggle service status"
        )


# ============================================================================
# COUPONS - Admin Management
# ============================================================================

@router.get("/coupons")
async def get_admin_coupons(
    include_inactive: bool = Query(False),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get all coupons for admin management."""
    logger.info("Admin coupons request", admin_id=str(current_user.id))
    
    try:
        query = select(Coupon)
        if not include_inactive:
            query = query.where(Coupon.is_active == True)
        query = query.order_by(Coupon.created_at.desc())
        
        result = await db.execute(query)
        coupons = result.scalars().all()
        
        coupons_data = [coupon.dict_for_response(include_admin_fields=True) for coupon in coupons]
        
        return {
            "success": True,
            "message": "Coupons retrieved successfully",
            "data": coupons_data
        }
        
    except Exception as e:
        logger.error("Failed to get admin coupons", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve coupons"
        )


@router.post("/coupons")
async def create_admin_coupon(
    coupon_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create new coupon."""
    logger.info("Creating admin coupon", admin_id=str(current_user.id))
    
    try:
        from datetime import datetime
        
        # Check for existing coupon code
        existing = await db.scalar(
            select(Coupon).where(Coupon.code == coupon_data["code"])
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Coupon with this code already exists"
            )
        
        # Create coupon
        coupon = Coupon(
            code=coupon_data["code"],
            name=coupon_data["name"],
            description=coupon_data.get("description", ""),
            type=coupon_data["type"],
            value=coupon_data["value"],
            minimum_order_amount=coupon_data.get("minimum_order_amount"),
            maximum_discount_amount=coupon_data.get("maximum_discount_amount"),
            usage_limit=coupon_data.get("usage_limit", 1000),
            per_user_limit=coupon_data.get("per_user_limit", 1),
            is_active=coupon_data.get("is_active", True),
            valid_from=datetime.fromisoformat(coupon_data["valid_from"].replace('Z', '+00:00')),
            valid_until=datetime.fromisoformat(coupon_data["valid_until"].replace('Z', '+00:00')),
            applicable_services=coupon_data.get("applicable_services", []),
            applicable_categories=coupon_data.get("applicable_categories", []),
            created_by=current_user.id
        )
        
        db.add(coupon)
        await db.commit()
        await db.refresh(coupon)
        
        return {
            "success": True,
            "message": "Coupon created successfully",
            "data": coupon.dict_for_response(include_admin_fields=True)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create coupon", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create coupon"
        )


@router.put("/coupons/{coupon_id}")
async def update_admin_coupon(
    coupon_id: str,
    updates: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update coupon."""
    logger.info("Updating admin coupon", coupon_id=coupon_id, admin_id=str(current_user.id))
    
    try:
        coupon = await db.scalar(
            select(Coupon).where(Coupon.id == UUID(coupon_id))
        )
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coupon not found"
            )
        
        # Update fields
        for field, value in updates.items():
            if hasattr(coupon, field):
                setattr(coupon, field, value)
        
        await db.commit()
        await db.refresh(coupon)
        
        return {
            "success": True,
            "message": "Coupon updated successfully",
            "data": coupon.dict_for_response(include_admin_fields=True)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update coupon", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update coupon"
        )


@router.delete("/coupons/{coupon_id}")
async def delete_admin_coupon(
    coupon_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete coupon."""
    logger.info("Deleting admin coupon", coupon_id=coupon_id, admin_id=str(current_user.id))
    
    try:
        coupon = await db.scalar(
            select(Coupon).where(Coupon.id == UUID(coupon_id))
        )
        if not coupon:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coupon not found"
            )
        
        await db.delete(coupon)
        await db.commit()
        
        return {
            "success": True,
            "message": "Coupon deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete coupon", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete coupon"
        )


# ============================================================================
# EMPLOYEES - Admin Management
# ============================================================================

@router.get("/employees")
async def get_admin_employees(
    expertise: Optional[str] = Query(None),
    include_inactive: bool = Query(False),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get all employees for admin management."""
    logger.info("Admin employees request", admin_id=str(current_user.id))
    
    try:
        query = select(Employee)
        
        if not include_inactive:
            query = query.where(Employee.is_active == True)
        
        if expertise:
            # Filter by expertise area (JSON array contains)
            query = query.where(Employee.expertise_areas.op('?')(expertise))
        
        query = query.order_by(Employee.name)
        
        result = await db.execute(query)
        employees = result.scalars().all()
        
        employees_data = [employee.dict_for_response(include_admin_fields=True) for employee in employees]
        
        return {
            "success": True,
            "message": "Employees retrieved successfully",
            "data": employees_data
        }
        
    except Exception as e:
        logger.error("Failed to get admin employees", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve employees"
        )


@router.post("/employees")
async def create_admin_employee(
    employee_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create new employee."""
    logger.info("Creating admin employee", admin_id=str(current_user.id))
    
    try:
        # Check for existing employee with same email
        existing = await db.scalar(
            select(Employee).where(Employee.email == employee_data["email"])
        )
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Employee with this email already exists"
            )
        
        # Create employee
        employee = Employee(
            name=employee_data["name"],
            email=employee_data["email"],
            phone=employee_data["phone"],
            expertise_areas=employee_data.get("expertise_areas", []),
            rating=employee_data.get("rating", 0.0),
            completed_jobs=employee_data.get("completed_jobs", 0),
            is_active=employee_data.get("is_active", True),
            is_available=employee_data.get("is_available", True),
            location=employee_data.get("location", ""),
            service_areas=employee_data.get("service_areas", []),
            employee_id=employee_data.get("employee_id"),
            department=employee_data.get("department"),
            position=employee_data.get("position")
        )
        
        db.add(employee)
        await db.commit()
        await db.refresh(employee)
        
        return {
            "success": True,
            "message": "Employee created successfully",
            "data": employee.dict_for_response(include_admin_fields=True)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to create employee", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create employee"
        )


@router.put("/employees/{employee_id}")
async def update_admin_employee(
    employee_id: str,
    updates: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update employee."""
    logger.info("Updating admin employee", employee_id=employee_id, admin_id=str(current_user.id))
    
    try:
        employee = await db.scalar(
            select(Employee).where(Employee.id == UUID(employee_id))
        )
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Update fields
        for field, value in updates.items():
            if hasattr(employee, field):
                setattr(employee, field, value)
        
        await db.commit()
        await db.refresh(employee)
        
        return {
            "success": True,
            "message": "Employee updated successfully",
            "data": employee.dict_for_response(include_admin_fields=True)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update employee", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update employee"
        )


@router.delete("/employees/{employee_id}")
async def delete_admin_employee(
    employee_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Delete employee."""
    logger.info("Deleting admin employee", employee_id=employee_id, admin_id=str(current_user.id))
    
    try:
        employee = await db.scalar(
            select(Employee).where(Employee.id == UUID(employee_id))
        )
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        await db.delete(employee)
        await db.commit()
        
        return {
            "success": True,
            "message": "Employee deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to delete employee", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete employee"
        )


# ============================================================================
# ORDERS - Admin Management  
# ============================================================================

@router.get("/orders")
async def get_admin_orders(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get all orders for admin management."""
    logger.info("Admin orders request", admin_id=str(current_user.id))
    
    try:
        # Try to get from Order model first, fallback to Booking
        try:
            query = select(Order).options(
                selectinload(Order.customer) if hasattr(Order, 'customer') else None
            )
            if status:
                query = query.where(Order.status == status)
            query = query.order_by(Order.created_at.desc())
            
            result = await db.execute(query)
            orders = result.scalars().all()
            
            orders_data = []
            for order in orders:
                order_dict = order.to_dict() if hasattr(order, 'to_dict') else {}
                orders_data.append(order_dict)
                
        except Exception:
            # Fallback to Booking model
            query = select(Booking).options(
                selectinload(Booking.user),
                selectinload(Booking.service)
            )
            if status:
                query = query.where(Booking.status == status)
            query = query.order_by(Booking.created_at.desc())
            
            result = await db.execute(query)
            bookings = result.scalars().all()
            
            orders_data = []
            for booking in bookings:
                booking_dict = booking.to_dict() if hasattr(booking, 'to_dict') else {
                    'id': str(booking.id),
                    'user_id': str(booking.user_id) if booking.user_id else None,
                    'service_id': str(booking.service_id) if booking.service_id else None,
                    'status': booking.status if hasattr(booking, 'status') else 'pending',
                    'created_at': booking.created_at.isoformat() if hasattr(booking, 'created_at') else None
                }
                orders_data.append(booking_dict)
        
        return {
            "success": True,
            "message": "Orders retrieved successfully",
            "data": orders_data
        }
        
    except Exception as e:
        logger.error("Failed to get admin orders", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve orders"
        )


@router.get("/orders/{order_id}")
async def get_admin_order(
    order_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get single order for admin management."""
    logger.info("Admin order detail request", order_id=order_id, admin_id=str(current_user.id))
    
    try:
        # Try Order model first, fallback to Booking
        try:
            order = await db.scalar(
                select(Order).where(Order.id == UUID(order_id))
            )
            if order:
                order_data = order.to_dict() if hasattr(order, 'to_dict') else {}
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Order not found"
                )
        except Exception:
            # Fallback to Booking model
            booking = await db.scalar(
                select(Booking).where(Booking.id == UUID(order_id))
            )
            if booking:
                order_data = booking.to_dict() if hasattr(booking, 'to_dict') else {
                    'id': str(booking.id),
                    'status': booking.status if hasattr(booking, 'status') else 'pending'
                }
            else:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Order not found"
                )
        
        return {
            "success": True,
            "message": "Order retrieved successfully",
            "data": order_data
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get admin order", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve order"
        )


@router.patch("/orders/{order_id}/status")
async def update_admin_order_status(
    order_id: str,
    status_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update order status."""
    logger.info("Updating admin order status", order_id=order_id, admin_id=str(current_user.id))
    
    try:
        # Try Order model first, fallback to Booking
        entity = None
        try:
            entity = await db.scalar(
                select(Order).where(Order.id == UUID(order_id))
            )
        except Exception:
            entity = await db.scalar(
                select(Booking).where(Booking.id == UUID(order_id))
            )
        
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Update status
        new_status = status_data.get("status")
        if hasattr(entity, 'status'):
            entity.status = new_status
        
        # Add notes if provided
        notes = status_data.get("notes")
        if notes and hasattr(entity, 'notes'):
            entity.notes = notes
        
        await db.commit()
        await db.refresh(entity)
        
        return {
            "success": True,
            "message": "Order status updated successfully",
            "data": entity.to_dict() if hasattr(entity, 'to_dict') else {"id": str(entity.id)}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update order status", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update order status"
        )


@router.patch("/orders/{order_id}/assign")
async def assign_employee_to_admin_order(
    order_id: str,
    assignment_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Assign employee to order."""
    logger.info("Assigning employee to admin order", order_id=order_id, admin_id=str(current_user.id))
    
    try:
        # Try Order model first, fallback to Booking
        entity = None
        try:
            entity = await db.scalar(
                select(Order).where(Order.id == UUID(order_id))
            )
        except Exception:
            entity = await db.scalar(
                select(Booking).where(Booking.id == UUID(order_id))
            )
        
        if not entity:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Verify employee exists
        employee_id = assignment_data.get("employee_id")
        employee = await db.scalar(
            select(Employee).where(Employee.id == UUID(employee_id))
        )
        if not employee:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Employee not found"
            )
        
        # Assign employee
        if hasattr(entity, 'assigned_employee_id'):
            entity.assigned_employee_id = UUID(employee_id)
        elif hasattr(entity, 'employee_id'):
            entity.employee_id = UUID(employee_id)
        
        await db.commit()
        await db.refresh(entity)
        
        return {
            "success": True,
            "message": "Employee assigned to order successfully",
            "data": entity.to_dict() if hasattr(entity, 'to_dict') else {"id": str(entity.id)}
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to assign employee to order", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign employee to order"
        )


# ============================================================================
# DASHBOARD & ANALYTICS - Admin Management
# ============================================================================

@router.get("/dashboard/stats")
async def get_admin_dashboard_stats(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get dashboard statistics for admin."""
    logger.info("Admin dashboard stats request", admin_id=str(current_user.id))
    
    try:
        # Basic counts
        total_services = await db.scalar(select(func.count(Service.id)))
        total_categories = await db.scalar(select(func.count(ServiceCategory.id)))
        total_employees = await db.scalar(select(func.count(Employee.id)))
        total_coupons = await db.scalar(select(func.count(Coupon.id)))
        
        # Try to get order/booking counts
        try:
            total_orders = await db.scalar(select(func.count(Order.id)))
        except Exception:
            total_orders = await db.scalar(select(func.count(Booking.id))) or 0
        
        total_customers = await db.scalar(select(func.count(User.id))) or 0
        
        stats_data = {
            "totalServices": total_services or 0,
            "totalCategories": total_categories or 0,
            "totalEmployees": total_employees or 0,
            "totalCoupons": total_coupons or 0,
            "totalOrders": total_orders or 0,
            "totalCustomers": total_customers or 0,
            "totalRevenue": 0.0,  # Would calculate from orders/bookings
            "monthlyRevenue": 0.0,
            "activeServices": await db.scalar(select(func.count(Service.id)).where(Service.is_active == True)) or 0,
            "activeEmployees": await db.scalar(select(func.count(Employee.id)).where(Employee.is_active == True)) or 0,
            "activeCoupons": await db.scalar(select(func.count(Coupon.id)).where(Coupon.is_active == True)) or 0,
        }
        
        return {
            "success": True,
            "message": "Dashboard statistics retrieved successfully",
            "data": stats_data
        }
        
    except Exception as e:
        logger.error("Failed to get admin dashboard stats", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve dashboard statistics"
        )


# ============================================================================
# SEARCH & UTILITIES - Admin Management
# ============================================================================

@router.get("/search")
async def admin_global_search(
    q: str = Query(..., min_length=1),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Global search across all entities."""
    logger.info("Admin global search", query=q, admin_id=str(current_user.id))
    
    try:
        search_term = f"%{q.lower()}%"
        
        # Search categories
        categories = await db.scalars(
            select(ServiceCategory).where(
                or_(
                    ServiceCategory.name.ilike(search_term),
                    ServiceCategory.description.ilike(search_term)
                )
            ).limit(10)
        )
        
        # Search subcategories
        subcategories = await db.scalars(
            select(ServiceSubcategory).where(
                or_(
                    ServiceSubcategory.name.ilike(search_term),
                    ServiceSubcategory.description.ilike(search_term)
                )
            ).limit(10)
        )
        
        # Search services
        services = await db.scalars(
            select(Service).where(
                or_(
                    Service.name.ilike(search_term),
                    Service.description.ilike(search_term),
                    Service.short_description.ilike(search_term)
                )
            ).limit(10)
        )
        
        # Search employees
        employees = await db.scalars(
            select(Employee).where(
                or_(
                    Employee.name.ilike(search_term),
                    Employee.email.ilike(search_term),
                    Employee.location.ilike(search_term)
                )
            ).limit(10)
        )
        
        results = {
            "categories": [cat.dict_for_response() for cat in categories],
            "subcategories": [subcat.dict_for_response() for subcat in subcategories],
            "services": [svc.dict_for_response() for svc in services],
            "employees": [emp.dict_for_response() for emp in employees],
        }
        
        return {
            "success": True,
            "message": "Search completed successfully",
            "data": results
        }
        
    except Exception as e:
        logger.error("Failed to perform admin search", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Search failed"
        )


# ============================================================================
# COUPON VALIDATION - Public Endpoint
# ============================================================================

@router.post("/coupons/validate", include_in_schema=False)
async def validate_coupon_for_cart(
    validation_data: dict,
    db: AsyncSession = Depends(get_db_session)
):
    """Validate coupon for cart (public endpoint used by frontend)."""
    logger.info("Coupon validation request")
    
    try:
        coupon_code = validation_data.get("code")
        cart_items = validation_data.get("cartItems", [])
        
        if not coupon_code:
            return {
                "success": False,
                "data": {
                    "valid": False,
                    "error": "Coupon code is required"
                }
            }
        
        # Find coupon by code
        coupon = await db.scalar(
            select(Coupon).where(Coupon.code == coupon_code.upper())
        )
        
        if not coupon:
            return {
                "success": False,
                "data": {
                    "valid": False,
                    "error": "Invalid coupon code"
                }
            }
        
        # Check if coupon is valid
        if not coupon.is_valid:
            error_msg = "Coupon is not valid"
            if coupon.is_expired:
                error_msg = "Coupon has expired"
            elif not coupon.is_active:
                error_msg = "Coupon is not active"
            elif coupon.is_usage_exhausted:
                error_msg = "Coupon usage limit reached"
                
            return {
                "success": False,
                "data": {
                    "valid": False,
                    "error": error_msg
                }
            }
        
        # Calculate total cart amount
        cart_total = sum([float(item.get("totalPrice", 0)) for item in cart_items])
        
        # Calculate discount
        discount_result = coupon.calculate_discount(cart_total)
        
        return {
            "success": True,
            "data": {
                "valid": discount_result["is_applicable"],
                "coupon": coupon.dict_for_response() if discount_result["is_applicable"] else None,
                "discount": discount_result["discount_amount"] if discount_result["is_applicable"] else 0,
                "error": discount_result["message"] if not discount_result["is_applicable"] else None
            }
        }
        
    except Exception as e:
        logger.error("Failed to validate coupon", error=str(e))
        return {
            "success": False,
            "data": {
                "valid": False,
                "error": "Coupon validation failed"
            }
        }


# Add this endpoint outside admin prefix for public access
from fastapi import APIRouter as PublicRouter
public_router = PublicRouter()

@public_router.post("/coupons/validate")
async def validate_coupon_public(
    validation_data: dict,
    db: AsyncSession = Depends(get_db_session)
):
    """Public coupon validation endpoint."""
    return await validate_coupon_for_cart(validation_data, db)


# ============================================================================
# BULK OPERATIONS - Admin Management
# ============================================================================

@router.post("/bulk-import")
async def admin_bulk_import(
    import_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Bulk import data."""
    logger.info("Admin bulk import", admin_id=str(current_user.id))
    
    try:
        imported_count = 0
        errors = []
        
        # Import categories
        if "categories" in import_data:
            for cat_data in import_data["categories"]:
                try:
                    category = ServiceCategory(**cat_data)
                    db.add(category)
                    imported_count += 1
                except Exception as e:
                    errors.append(f"Category '{cat_data.get('name', 'unknown')}': {str(e)}")
        
        # Import services
        if "services" in import_data:
            for svc_data in import_data["services"]:
                try:
                    service = Service(**svc_data)
                    db.add(service)
                    imported_count += 1
                except Exception as e:
                    errors.append(f"Service '{svc_data.get('name', 'unknown')}': {str(e)}")
        
        # Import employees
        if "employees" in import_data:
            for emp_data in import_data["employees"]:
                try:
                    employee = Employee(**emp_data)
                    db.add(employee)
                    imported_count += 1
                except Exception as e:
                    errors.append(f"Employee '{emp_data.get('name', 'unknown')}': {str(e)}")
        
        await db.commit()
        
        return {
            "success": len(errors) == 0,
            "message": "Bulk import completed",
            "data": {
                "imported": imported_count,
                "errors": errors
            }
        }
        
    except Exception as e:
        logger.error("Failed to perform bulk import", error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Bulk import failed"
        )


@router.get("/export")
async def admin_export_all_data(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Export all data."""
    logger.info("Admin data export", admin_id=str(current_user.id))
    
    try:
        # Get all data
        categories = await db.scalars(select(ServiceCategory))
        subcategories = await db.scalars(select(ServiceSubcategory))
        services = await db.scalars(select(Service))
        employees = await db.scalars(select(Employee))
        coupons = await db.scalars(select(Coupon))
        
        export_data = {
            "categories": [cat.dict_for_response() for cat in categories],
            "subcategories": [subcat.dict_for_response() for subcat in subcategories],
            "services": [svc.dict_for_response() for svc in services],
            "employees": [emp.dict_for_response(include_admin_fields=True) for emp in employees],
            "coupons": [coupon.dict_for_response(include_admin_fields=True) for coupon in coupons],
        }
        
        return {
            "success": True,
            "message": "Data export completed successfully",
            "data": export_data
        }
        
    except Exception as e:
        logger.error("Failed to export data", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Data export failed"
        )


# ============================================================================
# CONTACT SETTINGS - Admin Management
# ============================================================================

@router.get("/contact-settings")
async def get_contact_settings(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get contact settings for admin management."""
    logger.info("Admin contact settings request", admin_id=str(current_user.id))
    
    try:
        # For now, return default contact settings
        # TODO: Implement proper contact settings storage in database
        contact_settings = {
            "companyName": "Happy Homes",
            "tagline": "Your trusted home service partner",
            "phone": "",
            "email": "",
            "emergencyPhone": "",
            "whatsappNumber": "",
            "facebookUrl": "https://www.facebook.com/happyhomes.official",
            "twitterUrl": "https://x.com/happyhomes_in",
            "address": ""
        }
        
        return {
            "success": True,
            "message": "Contact settings retrieved successfully",
            "data": contact_settings
        }
        
    except Exception as e:
        logger.error("Failed to get contact settings", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve contact settings"
        )


@router.put("/contact-settings")
async def update_contact_settings(
    settings_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update contact settings."""
    logger.info("Updating contact settings", admin_id=str(current_user.id))
    
    try:
        # DEBUG: Log received data
        print(f"🐛 Backend received data: {settings_data}")
        print(f"🐛 Keys in data: {list(settings_data.keys())}")
        print(f"🐛 Required fields check:")
        print(f"  - phone: '{settings_data.get('phone', '')}'")
        print(f"  - email: '{settings_data.get('email', '')}'")
        print(f"  - companyName: '{settings_data.get('companyName', '')}'")
        
        # Validate required fields
        required_fields = ["phone", "email", "companyName"]
        missing_fields = [field for field in required_fields if not settings_data.get(field, "").strip()]
        
        print(f"🐛 Missing fields: {missing_fields}")
        
        if missing_fields:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Phone, email, and company name are required"
            )
        
        # TODO: Store in database instead of returning static data
        # For now, we'll validate and return the updated settings
        updated_settings = {
            "companyName": settings_data.get("companyName", "").strip(),
            "tagline": settings_data.get("tagline", "").strip(),
            "phone": settings_data.get("phone", "").strip(),
            "email": settings_data.get("email", "").strip(),
            "emergencyPhone": settings_data.get("emergencyPhone", "").strip(),
            "whatsappNumber": settings_data.get("whatsappNumber", "").strip(),
            "facebookUrl": settings_data.get("facebookUrl", "").strip(),
            "twitterUrl": settings_data.get("twitterUrl", "").strip(),
            "address": settings_data.get("address", "").strip(),
            "updated_by": settings_data.get("updated_by", "admin"),
            "updated_at": "2025-09-16T16:50:00Z"
        }
        
        logger.info("Contact settings updated successfully", settings=updated_settings)
        
        return {
            "success": True,
            "message": "Contact settings updated successfully",
            "data": updated_settings
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update contact settings", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update contact settings"
        )


# ============================================================================
# USER PREFERENCES - Admin Management
# ============================================================================

@router.get("/user-preferences")
async def get_user_preferences(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get current user's preferences."""
    logger.info("User preferences request", user_id=str(current_user.id))
    
    try:
        # Get user with preferences
        user = await db.scalar(
            select(User).where(User.id == current_user.id)
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        preferences = user.preferences or {}
        
        return {
            "success": True,
            "message": "User preferences retrieved successfully",
            "data": preferences
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get user preferences", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user preferences"
        )


@router.post("/user-preferences")
async def update_user_preferences(
    preferences_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Update current user's preferences."""
    logger.info("Updating user preferences", user_id=str(current_user.id))
    
    try:
        # Get user
        user = await db.scalar(
            select(User).where(User.id == current_user.id)
        )
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update preferences - merge with existing preferences
        current_prefs = user.preferences or {}
        current_prefs.update(preferences_data)
        
        user.preferences = current_prefs
        
        await db.commit()
        await db.refresh(user)
        
        logger.info("User preferences updated successfully", 
                   user_id=str(current_user.id), 
                   preferences=preferences_data)
        
        return {
            "success": True,
            "message": "User preferences updated successfully",
            "data": user.preferences
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to update user preferences", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user preferences"
        )


# ============================================================================
# SYSTEM HEALTH MONITORING - Admin System Management
# ============================================================================

@router.get("/system/containers")
async def get_docker_containers(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get Docker container status for health monitoring."""
    logger.info("Container status request", user_id=str(current_user.id))
    
    try:
        import subprocess
        import json
        
        # Get container status using docker command
        try:
            result = subprocess.run(
                ['docker', 'ps', '--format', 'json'],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                containers = []
                for line in result.stdout.strip().split('\n'):
                    if line:
                        try:
                            container_info = json.loads(line)
                            containers.append({
                                'name': container_info.get('Names', 'Unknown'),
                                'image': container_info.get('Image', 'Unknown'),
                                'status': 'running' if container_info.get('State') == 'running' else 'stopped',
                                'uptime': container_info.get('Status', 'Unknown'),
                                'ports': container_info.get('Ports', '')
                            })
                        except json.JSONDecodeError:
                            continue
                
                return {
                    "success": True,
                    "message": "Container status retrieved successfully",
                    "data": containers
                }
            else:
                raise Exception("Docker command failed")
                
        except subprocess.TimeoutExpired:
            raise Exception("Docker command timeout")
        except FileNotFoundError:
            raise Exception("Docker not found")
            
    except Exception as e:
        logger.error("Failed to get container status", error=str(e))
        return {
            "success": False,
            "message": "Container monitoring not available",
            "data": []
        }


@router.post("/notifications/alerts")
async def create_system_alert(
    alert_data: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Create system alert notification for admins."""
    logger.info("Creating system alert", user_id=str(current_user.id), alert_type=alert_data.get('type'))
    
    try:
        # Store alert in database (you might want to create an alerts table)
        # For now, we'll log it and return success
        
        alert_message = f"SYSTEM ALERT [{alert_data.get('severity', 'unknown').upper()}]: {alert_data.get('message', 'No message')}"
        logger.warning("System Alert Created", 
                      service=alert_data.get('service'),
                      severity=alert_data.get('severity'),
                      message=alert_data.get('message'),
                      action_required=alert_data.get('actionRequired'),
                      suggested_fix=alert_data.get('suggestedFix'))
        
        # Here you could integrate with external notification services:
        # - Send email via SendGrid
        # - Send SMS via Twilio
        # - Send Slack notification
        # - Store in database for admin dashboard
        
        return {
            "success": True,
            "message": "Alert notification created successfully",
            "data": {
                "alert_id": f"alert_{int(time.time())}",
                "created_at": datetime.utcnow().isoformat(),
                "status": "sent"
            }
        }
        
    except Exception as e:
        logger.error("Failed to create alert notification", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create alert notification"
        )


@router.get("/system/health/detailed")
async def get_detailed_system_health(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get detailed system health information."""
    logger.info("Detailed health check request", user_id=str(current_user.id))
    
    try:
        # Database health
        db_health = {"status": "healthy", "response_time_ms": 0}
        start_time = time.time()
        try:
            await db.execute(select(1))
            db_health["response_time_ms"] = round((time.time() - start_time) * 1000, 2)
        except Exception as e:
            db_health = {"status": "error", "error": str(e)}
        
        # System resources (simplified without psutil)
        system_info = {
            "status": "monitoring_unavailable",
            "message": "System resource monitoring requires additional setup"
        }
        
        # Try to get basic system info if psutil is available
        try:
            import psutil
            system_info = {
                "cpu_percent": psutil.cpu_percent(interval=1),
                "memory_percent": psutil.virtual_memory().percent,
                "disk_percent": psutil.disk_usage('/').percent,
                "uptime": time.time() - psutil.boot_time()
            }
        except ImportError:
            # psutil not available, use basic info
            pass
        except Exception as e:
            system_info = {
                "status": "error",
                "error": str(e)
            }
        
        # Application health
        app_health = {
            "status": "healthy",
            "version": "1.0.0",
            "environment": "development",
            "startup_time": datetime.utcnow().isoformat()
        }
        
        return {
            "success": True,
            "message": "Detailed health information retrieved",
            "data": {
                "database": db_health,
                "system": system_info,
                "application": app_health,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
    except Exception as e:
        logger.error("Failed to get detailed health", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve detailed health information"
        )


# ============================================================================
# AUTOMATED ASSIGNMENT - Super Admin Management
# ============================================================================

@router.post("/assignments/auto-assign/{booking_id}")
async def auto_assign_employee_to_booking(
    booking_id: str,
    assignment_request: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Automatically assign employee to booking using intelligent algorithms.
    
    Request body:
    {
        "strategy": "best_fit|location_only|availability_only|location_and_availability|round_robin",
        "manualEmployeeId": "optional-employee-id-for-manual",
        "config": {
            "maxDistanceKm": 25.0,
            "requireExpertiseMatch": true,
            "maxDailyAssignments": 8,
            "priorityWeights": {
                "location": 0.3,
                "availability": 0.25,
                "expertise": 0.2,
                "rating": 0.15,
                "workload": 0.1
            }
        }
    }
    """
    logger.info("Auto assignment request", booking_id=booking_id, admin_id=str(current_user.id))
    
    try:
        from ..services.assignment_service import (
            AutomatedAssignmentService,
            AssignmentStrategy,
            AssignmentConfiguration,
            AssignmentPriority,
            AssignmentConfigurationManager
        )
        
        assignment_service = AutomatedAssignmentService()
        
        # Parse strategy
        strategy_str = assignment_request.get("strategy", "best_fit")
        try:
            strategy = AssignmentStrategy(strategy_str)
        except ValueError:
            strategy = AssignmentStrategy.BEST_FIT
        
        # Parse manual employee ID
        manual_employee_id = assignment_request.get("manualEmployeeId")
        if manual_employee_id:
            try:
                manual_employee_id = UUID(manual_employee_id)
                strategy = AssignmentStrategy.MANUAL
            except ValueError:
                manual_employee_id = None
        
        # Parse custom configuration
        config = None
        if "config" in assignment_request:
            config_data = assignment_request["config"]
            
            # Parse priority weights
            weights = {}
            if "priorityWeights" in config_data:
                weight_mapping = {
                    "location": AssignmentPriority.LOCATION,
                    "availability": AssignmentPriority.AVAILABILITY,
                    "expertise": AssignmentPriority.EXPERTISE,
                    "rating": AssignmentPriority.RATING,
                    "workload": AssignmentPriority.WORKLOAD,
                    "customerSatisfaction": AssignmentPriority.CUSTOMER_SATISFACTION
                }
                
                for key, value in config_data["priorityWeights"].items():
                    if key in weight_mapping:
                        weights[weight_mapping[key]] = float(value)
            
            # Create configuration
            config = AssignmentConfiguration(
                strategy=strategy,
                max_distance_km=float(config_data.get("maxDistanceKm", 25.0)),
                priority_weights=weights if weights else None,
                require_expertise_match=bool(config_data.get("requireExpertiseMatch", True)),
                max_daily_assignments=int(config_data.get("maxDailyAssignments", 8))
            )
        
        # Perform assignment
        result = await assignment_service.assign_employee_to_booking(
            db=db,
            booking_id=UUID(booking_id),
            strategy=strategy,
            manual_employee_id=manual_employee_id,
            config=config
        )
        
        # Log assignment result
        if result["success"]:
            logger.info(
                "Employee assignment successful",
                booking_id=booking_id,
                employee_id=result["assignment"]["employeeId"],
                strategy=strategy_str,
                admin_id=str(current_user.id)
            )
        else:
            logger.warning(
                "Employee assignment failed",
                booking_id=booking_id,
                error=result["error"],
                admin_id=str(current_user.id)
            )
        
        return {
            "success": result["success"],
            "message": "Assignment completed successfully" if result["success"] else result["error"],
            "data": result
        }
        
    except Exception as e:
        logger.error("Auto assignment failed", error=str(e), booking_id=booking_id)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Auto assignment failed: {str(e)}"
        )


@router.get("/assignments/configurations")
async def get_assignment_configurations(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get available assignment configurations and strategies."""
    logger.info("Assignment configurations request", admin_id=str(current_user.id))
    
    try:
        from ..services.assignment_service import (
            AssignmentStrategy,
            AssignmentPriority,
            AssignmentConfigurationManager
        )
        
        configurations = {
            "strategies": {
                "best_fit": {
                    "name": "Best Overall Fit",
                    "description": "Assigns based on weighted combination of all factors",
                    "factors": ["location", "availability", "expertise", "rating", "workload"]
                },
                "location_only": {
                    "name": "Location Priority",
                    "description": "Assigns closest available employee",
                    "factors": ["location", "basic_availability"]
                },
                "availability_only": {
                    "name": "Availability Priority", 
                    "description": "Assigns employee with lowest current workload",
                    "factors": ["availability", "workload"]
                },
                "location_and_availability": {
                    "name": "Location + Availability",
                    "description": "Balanced approach considering location and availability",
                    "factors": ["location", "availability"]
                },
                "round_robin": {
                    "name": "Round Robin",
                    "description": "Distributes assignments evenly among eligible employees",
                    "factors": ["workload_balancing"]
                },
                "manual": {
                    "name": "Manual Assignment",
                    "description": "Manually select specific employee",
                    "factors": ["admin_choice"]
                }
            },
            "priorityFactors": {
                "location": {
                    "name": "Location Proximity",
                    "description": "Distance between employee and service location",
                    "weight": 0.3,
                    "range": "0.0 - 1.0"
                },
                "availability": {
                    "name": "Current Availability", 
                    "description": "Employee's current workload and schedule",
                    "weight": 0.25,
                    "range": "0.0 - 1.0"
                },
                "expertise": {
                    "name": "Skill Match",
                    "description": "Employee's expertise in required service category",
                    "weight": 0.2,
                    "range": "0.0 - 1.0"
                },
                "rating": {
                    "name": "Employee Rating",
                    "description": "Overall customer rating and performance",
                    "weight": 0.15,
                    "range": "0.0 - 1.0"
                },
                "workload": {
                    "name": "Workload Balance",
                    "description": "Current daily assignment count",
                    "weight": 0.1,
                    "range": "0.0 - 1.0"
                }
            },
            "defaultSettings": {
                "maxDistanceKm": 25.0,
                "requireExpertiseMatch": True,
                "maxDailyAssignments": 8,
                "workingHoursStart": "08:00",
                "workingHoursEnd": "18:00",
                "bufferTimeMinutes": 30
            },
            "presetConfigurations": {
                "quality_focused": {
                    "name": "Quality Focused",
                    "description": "Prioritizes highly rated, experienced employees",
                    "weights": {
                        "location": 0.15,
                        "availability": 0.2,
                        "expertise": 0.3,
                        "rating": 0.25,
                        "workload": 0.1
                    }
                },
                "speed_focused": {
                    "name": "Speed Focused", 
                    "description": "Prioritizes quick assignment and availability",
                    "weights": {
                        "location": 0.4,
                        "availability": 0.4,
                        "expertise": 0.1,
                        "rating": 0.05,
                        "workload": 0.05
                    }
                },
                "balanced": {
                    "name": "Balanced Approach",
                    "description": "Equal consideration of all factors",
                    "weights": {
                        "location": 0.2,
                        "availability": 0.2,
                        "expertise": 0.2,
                        "rating": 0.2,
                        "workload": 0.2
                    }
                }
            }
        }
        
        return {
            "success": True,
            "message": "Assignment configurations retrieved successfully",
            "data": configurations
        }
        
    except Exception as e:
        logger.error("Failed to get assignment configurations", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve assignment configurations"
        )


@router.get("/assignments/eligible-employees/{booking_id}")
async def get_eligible_employees_for_booking(
    booking_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get list of eligible employees for a specific booking with their scores."""
    logger.info("Eligible employees request", booking_id=booking_id, admin_id=str(current_user.id))
    
    try:
        from ..services.assignment_service import AutomatedAssignmentService
        
        # Get booking details
        booking = await db.scalar(
            select(Booking)
            .options(
                selectinload(Booking.service).selectinload(Service.category),
                selectinload(Booking.address)
            )
            .where(Booking.id == UUID(booking_id))
        )
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        assignment_service = AutomatedAssignmentService()
        eligible_employees = await assignment_service._get_eligible_employees(
            db, booking, assignment_service.config
        )
        
        # Sort by total score descending
        eligible_employees.sort(key=lambda x: x.total_score, reverse=True)
        
        employees_data = []
        for emp_score in eligible_employees:
            emp_data = {
                "employeeId": str(emp_score.employee.id),
                "employeeName": emp_score.employee.name,
                "employeeEmail": emp_score.employee.email,
                "employeePhone": emp_score.employee.phone,
                "employeeLocation": emp_score.employee.location,
                "expertiseAreas": emp_score.employee.expertise_areas,
                "rating": emp_score.employee.rating,
                "completedJobs": emp_score.employee.completed_jobs,
                "isActive": emp_score.employee.is_active,
                "isAvailable": emp_score.employee.is_available,
                "scores": {
                    "total": round(emp_score.total_score, 3),
                    "location": round(emp_score.location_score, 3),
                    "availability": round(emp_score.availability_score, 3),
                    "expertise": round(emp_score.expertise_score, 3),
                    "rating": round(emp_score.rating_score, 3),
                    "workload": round(emp_score.workload_score, 3),
                    "customerSatisfaction": round(emp_score.customer_satisfaction_score, 3)
                },
                "metrics": {
                    "distanceKm": emp_score.distance_km,
                    "currentWorkload": emp_score.current_workload,
                    "hasExpertise": emp_score.has_expertise,
                    "isAvailableForSlot": emp_score.is_available
                }
            }
            employees_data.append(emp_data)
        
        return {
            "success": True,
            "message": f"Found {len(employees_data)} eligible employees",
            "data": {
                "bookingId": booking_id,
                "serviceCategory": booking.service.category.name if booking.service.category else None,
                "serviceName": booking.service.name,
                "scheduledDate": booking.scheduled_date.isoformat(),
                "eligibleEmployees": employees_data,
                "totalCount": len(employees_data)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Failed to get eligible employees", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve eligible employees"
        )


@router.post("/assignments/bulk-assign")
async def bulk_assign_employees(
    assignment_requests: dict,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Bulk assign employees to multiple bookings.
    
    Request body:
    {
        "bookingIds": ["booking-id-1", "booking-id-2"],
        "strategy": "best_fit",
        "config": { ... }
    }
    """
    logger.info("Bulk assignment request", admin_id=str(current_user.id))
    
    try:
        from ..services.assignment_service import (
            AutomatedAssignmentService,
            AssignmentStrategy
        )
        
        booking_ids = assignment_requests.get("bookingIds", [])
        if not booking_ids:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No booking IDs provided"
            )
        
        strategy_str = assignment_requests.get("strategy", "best_fit")
        try:
            strategy = AssignmentStrategy(strategy_str)
        except ValueError:
            strategy = AssignmentStrategy.BEST_FIT
        
        assignment_service = AutomatedAssignmentService()
        results = []
        
        # Process each booking
        for booking_id in booking_ids:
            try:
                result = await assignment_service.assign_employee_to_booking(
                    db=db,
                    booking_id=UUID(booking_id),
                    strategy=strategy
                )
                
                results.append({
                    "bookingId": booking_id,
                    "success": result["success"],
                    "assignment": result.get("assignment"),
                    "error": result.get("error")
                })
                
            except Exception as e:
                results.append({
                    "bookingId": booking_id,
                    "success": False,
                    "assignment": None,
                    "error": str(e)
                })
        
        # Calculate summary
        successful_assignments = sum(1 for r in results if r["success"])
        failed_assignments = len(results) - successful_assignments
        
        logger.info(
            "Bulk assignment completed",
            total=len(results),
            successful=successful_assignments,
            failed=failed_assignments,
            admin_id=str(current_user.id)
        )
        
        return {
            "success": True,
            "message": f"Bulk assignment completed: {successful_assignments} successful, {failed_assignments} failed",
            "data": {
                "results": results,
                "summary": {
                    "totalBookings": len(results),
                    "successfulAssignments": successful_assignments,
                    "failedAssignments": failed_assignments,
                    "strategy": strategy_str
                }
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Bulk assignment failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bulk assignment failed: {str(e)}"
        )


@router.delete("/assignments/{booking_id}")
async def unassign_employee_from_booking(
    booking_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Remove employee assignment from booking."""
    logger.info("Unassign employee request", booking_id=booking_id, admin_id=str(current_user.id))
    
    try:
        booking = await db.scalar(
            select(Booking).where(Booking.id == UUID(booking_id))
        )
        
        if not booking:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        if not booking.assigned_technician_id:
            return {
                "success": True,
                "message": "No employee assigned to this booking",
                "data": None
            }
        
        # Store previous assignment for logging
        previous_employee_id = booking.assigned_technician_id
        
        # Remove assignment
        booking.assigned_technician_id = None
        booking.status = BookingStatus.PENDING
        
        # Add unassignment note
        unassign_note = f"Employee unassigned by admin {current_user.name}"
        booking.admin_notes = f"{booking.admin_notes}\n{unassign_note}" if booking.admin_notes else unassign_note
        
        await db.commit()
        
        logger.info(
            "Employee unassigned successfully",
            booking_id=booking_id,
            previous_employee_id=str(previous_employee_id),
            admin_id=str(current_user.id)
        )
        
        return {
            "success": True,
            "message": "Employee unassigned successfully",
            "data": {
                "bookingId": booking_id,
                "previousEmployeeId": str(previous_employee_id),
                "newStatus": booking.status
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Unassign employee failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unassign employee failed: {str(e)}"
        )


@router.get("/assignments/analytics")
async def get_assignment_analytics(
    days: int = Query(30, ge=1, le=365),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Get assignment analytics and performance metrics."""
    logger.info("Assignment analytics request", days=days, admin_id=str(current_user.id))
    
    try:
        from datetime import datetime, timedelta
        
        # Calculate date range
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Total assignments in period
        total_assignments = await db.scalar(
            select(func.count(Booking.id))
            .where(
                and_(
                    Booking.assigned_technician_id.isnot(None),
                    Booking.created_at >= start_date
                )
            )
        )
        
        # Auto vs manual assignments (based on admin notes)
        auto_assignments = await db.scalar(
            select(func.count(Booking.id))
            .where(
                and_(
                    Booking.assigned_technician_id.isnot(None),
                    Booking.created_at >= start_date,
                    Booking.admin_notes.like('%Auto-assigned%')
                )
            )
        )
        
        manual_assignments = (total_assignments or 0) - (auto_assignments or 0)
        
        # Assignment completion rate
        completed_assignments = await db.scalar(
            select(func.count(Booking.id))
            .where(
                and_(
                    Booking.assigned_technician_id.isnot(None),
                    Booking.created_at >= start_date,
                    Booking.status == BookingStatus.COMPLETED
                )
            )
        )
        
        completion_rate = (
            (completed_assignments / total_assignments * 100) 
            if total_assignments and total_assignments > 0 else 0
        )
        
        # Employee workload distribution
        employee_workloads = await db.execute(
            select(
                Employee.name,
                Employee.location,
                func.count(Booking.id).label('assignment_count')
            )
            .outerjoin(Booking, Employee.id == Booking.assigned_technician_id)
            .where(
                or_(
                    Booking.created_at.is_(None),
                    Booking.created_at >= start_date
                )
            )
            .group_by(Employee.id, Employee.name, Employee.location)
            .order_by(func.count(Booking.id).desc())
            .limit(10)
        )
        
        workload_data = [
            {
                "employeeName": row.name,
                "employeeLocation": row.location,
                "assignmentCount": row.assignment_count
            }
            for row in employee_workloads
        ]
        
        analytics = {
            "period": {
                "days": days,
                "startDate": start_date.isoformat(),
                "endDate": end_date.isoformat()
            },
            "assignmentStats": {
                "totalAssignments": total_assignments or 0,
                "autoAssignments": auto_assignments or 0,
                "manualAssignments": manual_assignments or 0,
                "completedAssignments": completed_assignments or 0,
                "completionRate": round(completion_rate, 2)
            },
            "performanceMetrics": {
                "autoAssignmentRate": round(
                    (auto_assignments / total_assignments * 100) 
                    if total_assignments and total_assignments > 0 else 0, 2
                ),
                "averageAssignmentsPerEmployee": round(
                    total_assignments / len(workload_data) 
                    if workload_data and total_assignments else 0, 2
                )
            },
            "employeeWorkloads": workload_data
        }
        
        return {
            "success": True,
            "message": "Assignment analytics retrieved successfully", 
            "data": analytics
        }
        
    except Exception as e:
        logger.error("Failed to get assignment analytics", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve assignment analytics"
        )