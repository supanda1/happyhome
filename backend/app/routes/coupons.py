"""
Coupon management routes for discount codes and promotions.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import and_, desc, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..core.dependencies import get_current_user, get_current_admin_user, get_optional_current_user
from ..core.logging import get_logger
from ..database.connection import get_db_session
from ..models.coupon import Coupon, CouponUsage, CouponType, CouponStatus
from ..models.service import Service, ServiceCategory
from ..models.user import User
from ..schemas.base import BaseResponse, PaginatedResponse, PaginationMeta, SuccessResponse
from ..schemas.coupon import (
    CouponCreate,
    CouponUpdate,
    CouponValidationRequest,
    CouponValidationResponse,
    CouponResponse,
    CouponListResponse,
    CouponFilters,
    CouponStatsResponse,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/coupons")


# Public Endpoints

@router.get("/available", response_model=BaseResponse[List[CouponListResponse]])
async def get_available_coupons(
    service_id: Optional[str] = Query(None, description="Filter by applicable service", alias="serviceId"),
    category_id: Optional[str] = Query(None, description="Filter by applicable category", alias="categoryId"),
    order_amount: Optional[float] = Query(None, ge=0, description="Order amount for minimum check", alias="orderAmount"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get available coupons for a user/service/category.
    
    Args:
        service_id: Optional service ID for filtering
        category_id: Optional category ID for filtering
        order_amount: Optional order amount for minimum order check
        current_user: Optional current user
        db: Database session
        
    Returns:
        BaseResponse containing list of available coupons
    """
    logger.debug("Available coupons request", service_id=service_id, category_id=category_id)
    
    try:
        # Build query for active, non-expired coupons
        current_time = datetime.utcnow()
        query = db.query(Coupon).filter(
            and_(
                Coupon.is_active == True,
                Coupon.valid_from <= current_time,
                Coupon.valid_until >= current_time,
                Coupon.used_count < Coupon.usage_limit
            )
        )
        
        # Filter by minimum order amount if provided
        if order_amount is not None:
            query = query.filter(
                or_(
                    Coupon.minimum_order_amount.is_(None),
                    Coupon.minimum_order_amount <= order_amount
                )
            )
        
        # Get coupons
        coupons = await db.scalars(query.order_by(desc(Coupon.created_at)))
        
        # Filter applicable coupons
        applicable_coupons = []
        for coupon in coupons:
            is_applicable = True
            
            # Check service applicability
            if service_id and coupon.applicable_services:
                is_applicable = service_id in coupon.applicable_services
            
            # Check category applicability
            if category_id and coupon.applicable_categories:
                is_applicable = category_id in coupon.applicable_categories
            
            # Check per-user usage limit if user is authenticated
            if current_user and is_applicable:
                user_usage = await db.scalar(
                    func.count(CouponUsage.id).filter(
                        and_(
                            CouponUsage.coupon_id == coupon.id,
                            CouponUsage.user_id == current_user.id
                        )
                    )
                )
                if user_usage >= coupon.per_user_limit:
                    is_applicable = False
            
            if is_applicable:
                applicable_coupons.append(coupon)
        
        # Convert to response format
        coupon_responses = []
        for coupon in applicable_coupons:
            coupon_dict = {
                "id": str(coupon.id),
                "code": coupon.code,
                "name": coupon.name,
                "description": coupon.description,
                "type": coupon.type.value,
                "value": coupon.value,
                "minimumOrderAmount": coupon.minimum_order_amount,
                "maximumDiscountAmount": coupon.maximum_discount_amount,
                "usageLimit": coupon.usage_limit,
                "usedCount": coupon.used_count,
                "perUserLimit": coupon.per_user_limit,
                "isActive": coupon.is_active,
                "validFrom": coupon.valid_from.isoformat(),
                "validUntil": coupon.valid_until.isoformat(),
                "applicableServices": coupon.applicable_services or [],
                "applicableCategories": coupon.applicable_categories or [],
                "createdBy": coupon.created_by,
                "createdAt": coupon.created_at.isoformat(),
                "updatedAt": coupon.updated_at.isoformat()
            }
            coupon_responses.append(CouponListResponse(**coupon_dict))
        
        return BaseResponse(
            success=True,
            message="Available coupons retrieved successfully",
            data=coupon_responses
        )
        
    except Exception as e:
        logger.error("Get available coupons failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve available coupons"
        )


@router.post("/validate", response_model=BaseResponse[CouponValidationResponse])
async def validate_coupon(
    validation_request: CouponValidationRequest,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Validate a coupon code for an order.
    
    Args:
        validation_request: Coupon validation data
        current_user: Optional current user
        db: Database session
        
    Returns:
        BaseResponse containing validation result
    """
    logger.info("Coupon validation", code=validation_request.code, order_amount=validation_request.order_amount)
    
    try:
        # Find coupon by code
        coupon = await db.scalar(
            db.query(Coupon).filter(Coupon.code == validation_request.code)
        )
        
        if not coupon:
            return BaseResponse(
                success=True,
                message="Coupon validation completed",
                data=CouponValidationResponse(
                    isValid=False,
                    isApplicable=False,
                    discountAmount=0.0,
                    finalAmount=validation_request.order_amount,
                    message="Coupon code not found"
                )
            )
        
        # Check if coupon is active
        if not coupon.is_active:
            return BaseResponse(
                success=True,
                message="Coupon validation completed",
                data=CouponValidationResponse(
                    isValid=False,
                    isApplicable=False,
                    discountAmount=0.0,
                    finalAmount=validation_request.order_amount,
                    message="Coupon is inactive"
                )
            )
        
        # Check validity period
        current_time = datetime.utcnow()
        if current_time < coupon.valid_from:
            return BaseResponse(
                success=True,
                message="Coupon validation completed",
                data=CouponValidationResponse(
                    isValid=False,
                    isApplicable=False,
                    discountAmount=0.0,
                    finalAmount=validation_request.order_amount,
                    message="Coupon is not yet valid"
                )
            )
        
        if current_time > coupon.valid_until:
            return BaseResponse(
                success=True,
                message="Coupon validation completed",
                data=CouponValidationResponse(
                    isValid=False,
                    isApplicable=False,
                    discountAmount=0.0,
                    finalAmount=validation_request.order_amount,
                    message="Coupon has expired"
                )
            )
        
        # Check usage limit
        if coupon.used_count >= coupon.usage_limit:
            return BaseResponse(
                success=True,
                message="Coupon validation completed",
                data=CouponValidationResponse(
                    isValid=False,
                    isApplicable=False,
                    discountAmount=0.0,
                    finalAmount=validation_request.order_amount,
                    message="Coupon usage limit exceeded"
                )
            )
        
        # Check per-user usage limit if user is provided
        if validation_request.user_id:
            user_usage = await db.scalar(
                func.count(CouponUsage.id).filter(
                    and_(
                        CouponUsage.coupon_id == coupon.id,
                        CouponUsage.user_id == UUID(validation_request.user_id)
                    )
                )
            )
            if user_usage >= coupon.per_user_limit:
                return BaseResponse(
                    success=True,
                    message="Coupon validation completed",
                    data=CouponValidationResponse(
                        isValid=False,
                        isApplicable=False,
                        discountAmount=0.0,
                        finalAmount=validation_request.order_amount,
                        message="You have already used this coupon maximum times"
                    )
                )
        
        # Check minimum order amount
        if coupon.minimum_order_amount and validation_request.order_amount < coupon.minimum_order_amount:
            return BaseResponse(
                success=True,
                message="Coupon validation completed",
                data=CouponValidationResponse(
                    isValid=False,
                    isApplicable=False,
                    discountAmount=0.0,
                    finalAmount=validation_request.order_amount,
                    message=f"Minimum order amount of ₹{coupon.minimum_order_amount} required"
                )
            )
        
        # Check service applicability
        if validation_request.service_id and coupon.applicable_services:
            if validation_request.service_id not in coupon.applicable_services:
                return BaseResponse(
                    success=True,
                    message="Coupon validation completed",
                    data=CouponValidationResponse(
                        isValid=False,
                        isApplicable=False,
                        discountAmount=0.0,
                        finalAmount=validation_request.order_amount,
                        message="Coupon is not applicable to this service"
                    )
                )
        
        # Check category applicability
        if validation_request.category_id and coupon.applicable_categories:
            if validation_request.category_id not in coupon.applicable_categories:
                return BaseResponse(
                    success=True,
                    message="Coupon validation completed",
                    data=CouponValidationResponse(
                        isValid=False,
                        isApplicable=False,
                        discountAmount=0.0,
                        finalAmount=validation_request.order_amount,
                        message="Coupon is not applicable to this service category"
                    )
                )
        
        # Calculate discount
        if coupon.type == CouponType.PERCENTAGE:
            discount_amount = validation_request.order_amount * (coupon.value / 100)
        else:  # FIXED
            discount_amount = coupon.value
        
        # Apply maximum discount limit
        if coupon.maximum_discount_amount:
            discount_amount = min(discount_amount, coupon.maximum_discount_amount)
        
        # Ensure discount doesn't exceed order amount
        discount_amount = min(discount_amount, validation_request.order_amount)
        
        final_amount = validation_request.order_amount - discount_amount
        
        # Build coupon details for response
        coupon_details = {
            "id": str(coupon.id),
            "code": coupon.code,
            "name": coupon.name,
            "type": coupon.type.value,
            "value": coupon.value
        }
        
        return BaseResponse(
            success=True,
            message="Coupon validation completed",
            data=CouponValidationResponse(
                isValid=True,
                isApplicable=True,
                discountAmount=discount_amount,
                finalAmount=final_amount,
                message="Coupon applied successfully",
                coupon=coupon_details
            )
        )
        
    except Exception as e:
        logger.error("Coupon validation failed", code=validation_request.code, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to validate coupon"
        )


# Admin Endpoints

@router.get("/", response_model=PaginatedResponse[CouponResponse])
async def get_all_coupons(
    filters: CouponFilters = Depends(),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get all coupons with filtering and pagination (Admin only).
    
    Args:
        filters: Coupon filtering parameters
        current_user: Current admin user
        db: Database session
        
    Returns:
        PaginatedResponse containing list of coupons
    """
    logger.debug("All coupons request", admin_id=str(current_user.id), page=filters.page)
    
    try:
        # Build query
        query = db.query(Coupon)
        
        # Apply filters
        if filters.type:
            query = query.filter(Coupon.type == filters.type)
        
        if filters.is_active is not None:
            query = query.filter(Coupon.is_active == filters.is_active)
        
        if filters.is_expired is not None:
            current_time = datetime.utcnow()
            if filters.is_expired:
                query = query.filter(Coupon.valid_until < current_time)
            else:
                query = query.filter(Coupon.valid_until >= current_time)
        
        if filters.service_id:
            # This would need a JSON query for the applicable_services array
            # For simplicity, we'll skip this complex filter for now
            pass
        
        if filters.category_id:
            # Similar to service_id, this would need JSON array querying
            pass
        
        if filters.created_by:
            query = query.filter(Coupon.created_by == filters.created_by)
        
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    Coupon.code.ilike(search_term),
                    Coupon.name.ilike(search_term),
                    Coupon.description.ilike(search_term)
                )
            )
        
        # Get total count
        total = await db.scalar(func.count().select().select_from(query.subquery()))
        
        # Apply sorting
        sort_field = getattr(Coupon, filters.sort_by or "created_at", Coupon.created_at)
        if filters.sort_order == "desc":
            sort_field = desc(sort_field)
        query = query.order_by(sort_field)
        
        # Apply pagination
        skip = (filters.page - 1) * filters.limit
        coupons = await db.scalars(query.offset(skip).limit(filters.limit))
        
        # Convert to response format
        coupon_responses = []
        for coupon in coupons:
            coupon_dict = {
                "id": str(coupon.id),
                "code": coupon.code,
                "name": coupon.name,
                "description": coupon.description,
                "type": coupon.type.value,
                "value": coupon.value,
                "minimumOrderAmount": coupon.minimum_order_amount,
                "maximumDiscountAmount": coupon.maximum_discount_amount,
                "usageLimit": coupon.usage_limit,
                "usedCount": coupon.used_count,
                "perUserLimit": coupon.per_user_limit,
                "isActive": coupon.is_active,
                "validFrom": coupon.valid_from.isoformat(),
                "validUntil": coupon.valid_until.isoformat(),
                "applicableServices": coupon.applicable_services or [],
                "applicableCategories": coupon.applicable_categories or [],
                "createdBy": coupon.created_by,
                "createdAt": coupon.created_at.isoformat(),
                "updatedAt": coupon.updated_at.isoformat()
            }
            coupon_responses.append(CouponResponse(**coupon_dict))
        
        # Create pagination metadata
        pagination = PaginationMeta.create(filters.page, filters.limit, total)
        
        return PaginatedResponse(
            success=True,
            message="Coupons retrieved successfully",
            data=coupon_responses,
            pagination=pagination
        )
        
    except Exception as e:
        logger.error("Get all coupons failed", admin_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve coupons"
        )


@router.post("/", response_model=BaseResponse[CouponResponse])
async def create_coupon(
    coupon_data: CouponCreate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Create a new coupon (Admin only).
    
    Args:
        coupon_data: Coupon creation data
        current_user: Current admin user
        db: Database session
        
    Returns:
        BaseResponse containing created coupon
        
    Raises:
        HTTPException: 409 if coupon code already exists
    """
    logger.info("Coupon creation", code=coupon_data.code, admin_id=str(current_user.id))
    
    try:
        # Check if coupon code already exists
        existing_coupon = await db.scalar(
            db.query(Coupon).filter(Coupon.code == coupon_data.code)
        )
        if existing_coupon:
            logger.warning("Duplicate coupon code", code=coupon_data.code)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="A coupon with this code already exists"
            )
        
        # Parse dates
        valid_from = datetime.fromisoformat(coupon_data.valid_from.replace('Z', '+00:00'))
        valid_until = datetime.fromisoformat(coupon_data.valid_until.replace('Z', '+00:00'))
        
        # Create coupon
        coupon = Coupon(
            code=coupon_data.code,
            name=coupon_data.name,
            description=coupon_data.description,
            type=coupon_data.type,
            value=coupon_data.value,
            minimum_order_amount=coupon_data.minimum_order_amount,
            maximum_discount_amount=coupon_data.maximum_discount_amount,
            usage_limit=coupon_data.usage_limit,
            per_user_limit=coupon_data.per_user_limit,
            is_active=coupon_data.is_active,
            valid_from=valid_from,
            valid_until=valid_until,
            applicable_services=coupon_data.applicable_services,
            applicable_categories=coupon_data.applicable_categories,
            created_by=str(current_user.id)
        )
        
        db.add(coupon)
        await db.commit()
        await db.refresh(coupon)
        
        logger.info("Coupon created successfully", coupon_id=str(coupon.id), code=coupon.code)
        
        # Build response
        coupon_dict = {
            "id": str(coupon.id),
            "code": coupon.code,
            "name": coupon.name,
            "description": coupon.description,
            "type": coupon.type.value,
            "value": coupon.value,
            "minimumOrderAmount": coupon.minimum_order_amount,
            "maximumDiscountAmount": coupon.maximum_discount_amount,
            "usageLimit": coupon.usage_limit,
            "usedCount": coupon.used_count,
            "perUserLimit": coupon.per_user_limit,
            "isActive": coupon.is_active,
            "validFrom": coupon.valid_from.isoformat(),
            "validUntil": coupon.valid_until.isoformat(),
            "applicableServices": coupon.applicable_services or [],
            "applicableCategories": coupon.applicable_categories or [],
            "createdBy": coupon.created_by,
            "createdAt": coupon.created_at.isoformat(),
            "updatedAt": coupon.updated_at.isoformat()
        }
        
        return BaseResponse(
            success=True,
            message="Coupon created successfully",
            data=CouponResponse(**coupon_dict)
        )
        
    except ValueError as e:
        logger.warning("Coupon creation validation error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Coupon creation failed", code=coupon_data.code, error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create coupon"
        )


@router.get("/{coupon_id}", response_model=BaseResponse[CouponResponse])
async def get_coupon(
    coupon_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get coupon details by ID (Admin only).
    
    Args:
        coupon_id: Coupon ID
        current_user: Current admin user
        db: Database session
        
    Returns:
        BaseResponse containing coupon details
        
    Raises:
        HTTPException: 404 if coupon not found
    """
    logger.debug("Coupon detail request", coupon_id=coupon_id, admin_id=str(current_user.id))
    
    try:
        # Get coupon
        coupon = await db.get(Coupon, UUID(coupon_id))
        if not coupon:
            logger.warning("Coupon not found", coupon_id=coupon_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coupon not found"
            )
        
        # Build response
        coupon_dict = {
            "id": str(coupon.id),
            "code": coupon.code,
            "name": coupon.name,
            "description": coupon.description,
            "type": coupon.type.value,
            "value": coupon.value,
            "minimumOrderAmount": coupon.minimum_order_amount,
            "maximumDiscountAmount": coupon.maximum_discount_amount,
            "usageLimit": coupon.usage_limit,
            "usedCount": coupon.used_count,
            "perUserLimit": coupon.per_user_limit,
            "isActive": coupon.is_active,
            "validFrom": coupon.valid_from.isoformat(),
            "validUntil": coupon.valid_until.isoformat(),
            "applicableServices": coupon.applicable_services or [],
            "applicableCategories": coupon.applicable_categories or [],
            "createdBy": coupon.created_by,
            "createdAt": coupon.created_at.isoformat(),
            "updatedAt": coupon.updated_at.isoformat()
        }
        
        return BaseResponse(
            success=True,
            message="Coupon retrieved successfully",
            data=CouponResponse(**coupon_dict)
        )
        
    except ValueError:
        logger.warning("Invalid coupon ID format", coupon_id=coupon_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid coupon ID format"
        )
    except Exception as e:
        logger.error("Get coupon failed", coupon_id=coupon_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve coupon"
        )


@router.put("/{coupon_id}", response_model=BaseResponse[CouponResponse])
async def update_coupon(
    coupon_id: str,
    coupon_updates: CouponUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Update coupon details (Admin only).
    
    Args:
        coupon_id: Coupon ID
        coupon_updates: Coupon update data
        current_user: Current admin user
        db: Database session
        
    Returns:
        BaseResponse containing updated coupon
        
    Raises:
        HTTPException: 404 if coupon not found
    """
    logger.info("Coupon update", coupon_id=coupon_id, admin_id=str(current_user.id))
    
    try:
        # Get coupon
        coupon = await db.get(Coupon, UUID(coupon_id))
        if not coupon:
            logger.warning("Coupon not found for update", coupon_id=coupon_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coupon not found"
            )
        
        # Update fields
        if coupon_updates.name is not None:
            coupon.name = coupon_updates.name
        
        if coupon_updates.description is not None:
            coupon.description = coupon_updates.description
        
        if coupon_updates.value is not None:
            coupon.value = coupon_updates.value
        
        if coupon_updates.minimum_order_amount is not None:
            coupon.minimum_order_amount = coupon_updates.minimum_order_amount
        
        if coupon_updates.maximum_discount_amount is not None:
            coupon.maximum_discount_amount = coupon_updates.maximum_discount_amount
        
        if coupon_updates.usage_limit is not None:
            coupon.usage_limit = coupon_updates.usage_limit
        
        if coupon_updates.per_user_limit is not None:
            coupon.per_user_limit = coupon_updates.per_user_limit
        
        if coupon_updates.is_active is not None:
            coupon.is_active = coupon_updates.is_active
        
        if coupon_updates.valid_from is not None:
            coupon.valid_from = datetime.fromisoformat(coupon_updates.valid_from.replace('Z', '+00:00'))
        
        if coupon_updates.valid_until is not None:
            coupon.valid_until = datetime.fromisoformat(coupon_updates.valid_until.replace('Z', '+00:00'))
        
        if coupon_updates.applicable_services is not None:
            coupon.applicable_services = coupon_updates.applicable_services
        
        if coupon_updates.applicable_categories is not None:
            coupon.applicable_categories = coupon_updates.applicable_categories
        
        coupon.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(coupon)
        
        logger.info("Coupon updated successfully", coupon_id=coupon_id)
        
        # Build response
        coupon_dict = {
            "id": str(coupon.id),
            "code": coupon.code,
            "name": coupon.name,
            "description": coupon.description,
            "type": coupon.type.value,
            "value": coupon.value,
            "minimumOrderAmount": coupon.minimum_order_amount,
            "maximumDiscountAmount": coupon.maximum_discount_amount,
            "usageLimit": coupon.usage_limit,
            "usedCount": coupon.used_count,
            "perUserLimit": coupon.per_user_limit,
            "isActive": coupon.is_active,
            "validFrom": coupon.valid_from.isoformat(),
            "validUntil": coupon.valid_until.isoformat(),
            "applicableServices": coupon.applicable_services or [],
            "applicableCategories": coupon.applicable_categories or [],
            "createdBy": coupon.created_by,
            "createdAt": coupon.created_at.isoformat(),
            "updatedAt": coupon.updated_at.isoformat()
        }
        
        return BaseResponse(
            success=True,
            message="Coupon updated successfully",
            data=CouponResponse(**coupon_dict)
        )
        
    except ValueError as e:
        logger.warning("Coupon update validation error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Coupon update failed", coupon_id=coupon_id, error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update coupon"
        )


@router.delete("/{coupon_id}", response_model=SuccessResponse)
async def delete_coupon(
    coupon_id: str,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Delete a coupon (Admin only).
    
    Args:
        coupon_id: Coupon ID
        current_user: Current admin user
        db: Database session
        
    Returns:
        SuccessResponse
        
    Raises:
        HTTPException: 404 if coupon not found
        HTTPException: 400 if coupon has been used
    """
    logger.info("Coupon deletion", coupon_id=coupon_id, admin_id=str(current_user.id))
    
    try:
        # Get coupon
        coupon = await db.get(Coupon, UUID(coupon_id))
        if not coupon:
            logger.warning("Coupon not found for deletion", coupon_id=coupon_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Coupon not found"
            )
        
        # Check if coupon has been used
        if coupon.used_count > 0:
            logger.warning("Cannot delete used coupon", coupon_id=coupon_id, used_count=coupon.used_count)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete coupon that has been used. Deactivate it instead."
            )
        
        # Delete coupon
        await db.delete(coupon)
        await db.commit()
        
        logger.info("Coupon deleted successfully", coupon_id=coupon_id)
        
        return SuccessResponse(message="Coupon deleted successfully")
        
    except Exception as e:
        logger.error("Coupon deletion failed", coupon_id=coupon_id, error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete coupon"
        )


@router.get("/stats", response_model=BaseResponse[CouponStatsResponse])
async def get_coupon_stats(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get coupon statistics (Admin only).
    
    Args:
        current_user: Current admin user
        db: Database session
        
    Returns:
        BaseResponse containing coupon statistics
    """
    logger.debug("Coupon stats request", admin_id=str(current_user.id))
    
    try:
        current_time = datetime.utcnow()
        
        # Get total coupons
        total_coupons = await db.scalar(func.count(Coupon.id))
        
        # Get active coupons
        active_coupons = await db.scalar(
            func.count(Coupon.id).filter(Coupon.is_active == True)
        )
        
        # Get expired coupons
        expired_coupons = await db.scalar(
            func.count(Coupon.id).filter(Coupon.valid_until < current_time)
        )
        
        # Get total usage
        total_usage = await db.scalar(func.sum(Coupon.used_count)) or 0
        
        # Get total discount given (simplified calculation)
        # In a real implementation, you'd track actual discount amounts from CouponUsage
        total_discount_given = 0.0  # This would require complex calculation
        
        # Get coupon type distribution
        percentage_count = await db.scalar(
            func.count(Coupon.id).filter(Coupon.type == CouponType.PERCENTAGE)
        ) or 0
        fixed_count = await db.scalar(
            func.count(Coupon.id).filter(Coupon.type == CouponType.FIXED)
        ) or 0
        
        coupon_types = {
            "percentage": percentage_count,
            "fixed": fixed_count
        }
        
        # Get most used coupons (top 5)
        most_used_result = await db.scalars(
            db.query(Coupon)
            .filter(Coupon.used_count > 0)
            .order_by(desc(Coupon.used_count))
            .limit(5)
        )
        
        most_used_coupons = [
            {"code": coupon.code, "usage": coupon.used_count}
            for coupon in most_used_result
        ]
        
        # Monthly usage (simplified - just current month)
        current_month_usage = 0  # This would require CouponUsage table analysis
        monthly_usage = [{"month": "Current", "usage": current_month_usage, "discount": 0.0}]
        
        stats = {
            "totalCoupons": total_coupons,
            "activeCoupons": active_coupons,
            "expiredCoupons": expired_coupons,
            "totalUsage": total_usage,
            "totalDiscountGiven": total_discount_given,
            "mostUsedCoupons": most_used_coupons,
            "couponTypes": coupon_types,
            "monthlyUsage": monthly_usage
        }
        
        return BaseResponse(
            success=True,
            message="Coupon statistics retrieved successfully",
            data=CouponStatsResponse(**stats)
        )
        
    except Exception as e:
        logger.error("Get coupon stats failed", admin_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve coupon statistics"
        )