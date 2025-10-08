"""
Booking management routes for service appointments and orders.
"""

from datetime import datetime, date
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import and_, desc, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from ..core.dependencies import get_current_user, get_current_admin_user, get_optional_current_user
from ..core.logging import get_logger
from ..database.connection import get_db_session
from ..models.booking import Booking, CartItem, BookingStatus, PaymentStatus
from ..models.service import Service
from ..models.user import User
from ..schemas.base import BaseResponse, PaginatedResponse, PaginationMeta, SuccessResponse
from ..schemas.booking import (
    BookingCreate,
    BookingUpdate,
    BookingStatusUpdate,
    BookingCancellation,
    BookingResponse,
    BookingListResponse,
    BookingFilters,
    BookingStatsResponse,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/bookings")


# Booking Management Endpoints

@router.post("/", response_model=BaseResponse[BookingResponse])
async def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Create a new service booking.
    
    Args:
        booking_data: Booking creation data
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        BaseResponse containing created booking
        
    Raises:
        HTTPException: 404 if service not found
        HTTPException: 400 if booking validation fails
    """
    logger.info("Booking creation", service_id=booking_data.service_id, user_id=str(current_user.id))
    
    try:
        # Verify service exists and is active
        service = await db.get(Service, UUID(booking_data.service_id))
        if not service or not service.is_active:
            logger.warning("Service not found or inactive", service_id=booking_data.service_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found or not available"
            )
        
        # Parse scheduled date
        scheduled_dt = datetime.fromisoformat(booking_data.scheduled_date.replace('Z', '+00:00'))
        
        # Calculate amounts
        total_amount = service.base_price
        discount_amount = 0.0
        
        # Apply coupon if provided
        if booking_data.coupon_code:
            # TODO: Implement coupon validation and discount calculation
            # For now, just log the coupon code
            logger.info("Coupon code provided", coupon_code=booking_data.coupon_code)
        
        final_amount = total_amount - discount_amount
        
        # Create booking
        booking = Booking(
            user_id=current_user.id,
            service_id=UUID(booking_data.service_id),
            scheduled_date=scheduled_dt,
            time_slot={
                "start_time": booking_data.time_slot.start_time,
                "end_time": booking_data.time_slot.end_time,
                "is_available": booking_data.time_slot.is_available
            },
            status=BookingStatus.PENDING,
            total_amount=total_amount,
            discount_amount=discount_amount,
            final_amount=final_amount,
            coupon_code=booking_data.coupon_code,
            customer_address={
                "street": booking_data.customer_address.street,
                "city": booking_data.customer_address.city,
                "state": booking_data.customer_address.state,
                "zip_code": booking_data.customer_address.zip_code,
                "landmark": booking_data.customer_address.landmark
            },
            customer_notes=booking_data.customer_notes,
            payment_status=PaymentStatus.PENDING
        )
        
        db.add(booking)
        await db.commit()
        await db.refresh(booking)
        
        logger.info("Booking created successfully", booking_id=str(booking.id))
        
        # Load related data for response
        await db.refresh(booking)
        user = await db.get(User, booking.user_id)
        service = await db.get(Service, booking.service_id)
        
        # Build response
        booking_dict = {
            "id": str(booking.id),
            "userId": str(booking.user_id),
            "serviceId": str(booking.service_id),
            "scheduledDate": booking.scheduled_date.isoformat(),
            "timeSlot": booking.time_slot,
            "status": booking.status.value,
            "totalAmount": booking.total_amount,
            "discountAmount": booking.discount_amount,
            "finalAmount": booking.final_amount,
            "couponCode": booking.coupon_code,
            "customerAddress": booking.customer_address,
            "customerNotes": booking.customer_notes,
            "paymentStatus": booking.payment_status.value,
            "paymentMethod": booking.payment_method,
            "transactionId": booking.transaction_id,
            "completedAt": booking.completed_at.isoformat() if booking.completed_at else None,
            "cancelledAt": booking.cancelled_at.isoformat() if booking.cancelled_at else None,
            "cancellationReason": booking.cancellation_reason,
            "adminNotes": booking.admin_notes,
            "assignedTechnician": booking.assigned_technician,
            "createdAt": booking.created_at.isoformat(),
            "updatedAt": booking.updated_at.isoformat(),
            "user": {
                "id": str(user.id),
                "firstName": user.first_name,
                "lastName": user.last_name,
                "email": user.email,
                "phone": user.phone
            } if user else None,
            "service": {
                "id": str(service.id),
                "name": service.name,
                "description": service.description,
                "basePrice": service.base_price
            } if service else None
        }
        
        return BaseResponse(
            success=True,
            message="Booking created successfully",
            data=BookingResponse(**booking_dict)
        )
        
    except ValueError as e:
        logger.warning("Booking validation error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Booking creation failed", error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create booking"
        )


@router.get("/", response_model=PaginatedResponse[BookingListResponse])
async def get_user_bookings(
    filters: BookingFilters = Depends(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get user's bookings with filtering and pagination.
    
    Args:
        filters: Booking filtering parameters
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        PaginatedResponse containing list of bookings
    """
    logger.debug("User bookings request", user_id=str(current_user.id), page=filters.page)
    
    try:
        # Build query
        query = db.query(Booking).filter(Booking.user_id == current_user.id)
        
        # Apply filters
        if filters.service_id:
            query = query.filter(Booking.service_id == UUID(filters.service_id))
        
        if filters.status:
            query = query.filter(Booking.status == filters.status)
        
        if filters.start_date:
            start_dt = datetime.strptime(filters.start_date, "%Y-%m-%d")
            query = query.filter(Booking.scheduled_date >= start_dt)
        
        if filters.end_date:
            end_dt = datetime.strptime(f"{filters.end_date} 23:59:59", "%Y-%m-%d %H:%M:%S")
            query = query.filter(Booking.scheduled_date <= end_dt)
        
        if filters.min_amount is not None:
            query = query.filter(Booking.final_amount >= filters.min_amount)
        
        if filters.max_amount is not None:
            query = query.filter(Booking.final_amount <= filters.max_amount)
        
        if filters.payment_status:
            query = query.filter(Booking.payment_status == filters.payment_status)
        
        # Get total count
        total = await db.scalar(func.count().select().select_from(query.subquery()))
        
        # Apply sorting
        sort_field = getattr(Booking, filters.sort_by or "created_at", Booking.created_at)
        if filters.sort_order == "desc":
            sort_field = desc(sort_field)
        query = query.order_by(sort_field)
        
        # Apply pagination
        skip = (filters.page - 1) * filters.limit
        bookings = await db.scalars(
            query.options(selectinload(Booking.user), selectinload(Booking.service))
            .offset(skip)
            .limit(filters.limit)
        )
        
        # Convert to response format
        booking_responses = []
        for booking in bookings:
            booking_dict = {
                "id": str(booking.id),
                "userId": str(booking.user_id),
                "serviceId": str(booking.service_id),
                "scheduledDate": booking.scheduled_date.isoformat(),
                "timeSlot": booking.time_slot,
                "status": booking.status.value,
                "totalAmount": booking.total_amount,
                "discountAmount": booking.discount_amount,
                "finalAmount": booking.final_amount,
                "couponCode": booking.coupon_code,
                "customerAddress": booking.customer_address,
                "paymentStatus": booking.payment_status.value,
                "createdAt": booking.created_at.isoformat(),
                "updatedAt": booking.updated_at.isoformat()
            }
            booking_responses.append(BookingListResponse(**booking_dict))
        
        # Create pagination metadata
        pagination = PaginationMeta.create(filters.page, filters.limit, total)
        
        return PaginatedResponse(
            success=True,
            message="Bookings retrieved successfully",
            data=booking_responses,
            pagination=pagination
        )
        
    except Exception as e:
        logger.error("Get bookings failed", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve bookings"
        )


@router.get("/{booking_id}", response_model=BaseResponse[BookingResponse])
async def get_booking(
    booking_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get booking details by ID.
    
    Args:
        booking_id: Booking ID
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        BaseResponse containing booking details
        
    Raises:
        HTTPException: 404 if booking not found
        HTTPException: 403 if user doesn't have access
    """
    logger.debug("Booking detail request", booking_id=booking_id, user_id=str(current_user.id))
    
    try:
        # Get booking with related data
        booking = await db.scalar(
            db.query(Booking)
            .options(selectinload(Booking.user), selectinload(Booking.service))
            .filter(Booking.id == UUID(booking_id))
        )
        
        if not booking:
            logger.warning("Booking not found", booking_id=booking_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        # Check access permissions
        if str(booking.user_id) != str(current_user.id) and not current_user.is_admin:
            logger.warning("Unauthorized booking access", booking_id=booking_id, user_id=str(current_user.id))
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only access your own bookings"
            )
        
        # Build response
        booking_dict = {
            "id": str(booking.id),
            "userId": str(booking.user_id),
            "serviceId": str(booking.service_id),
            "scheduledDate": booking.scheduled_date.isoformat(),
            "timeSlot": booking.time_slot,
            "status": booking.status.value,
            "totalAmount": booking.total_amount,
            "discountAmount": booking.discount_amount,
            "finalAmount": booking.final_amount,
            "couponCode": booking.coupon_code,
            "customerAddress": booking.customer_address,
            "customerNotes": booking.customer_notes,
            "paymentStatus": booking.payment_status.value,
            "paymentMethod": booking.payment_method,
            "transactionId": booking.transaction_id,
            "completedAt": booking.completed_at.isoformat() if booking.completed_at else None,
            "cancelledAt": booking.cancelled_at.isoformat() if booking.cancelled_at else None,
            "cancellationReason": booking.cancellation_reason,
            "adminNotes": booking.admin_notes,
            "assignedTechnician": booking.assigned_technician,
            "createdAt": booking.created_at.isoformat(),
            "updatedAt": booking.updated_at.isoformat(),
            "user": {
                "id": str(booking.user.id),
                "firstName": booking.user.first_name,
                "lastName": booking.user.last_name,
                "email": booking.user.email,
                "phone": booking.user.phone
            } if booking.user else None,
            "service": {
                "id": str(booking.service.id),
                "name": booking.service.name,
                "description": booking.service.description,
                "basePrice": booking.service.base_price
            } if booking.service else None
        }
        
        return BaseResponse(
            success=True,
            message="Booking retrieved successfully",
            data=BookingResponse(**booking_dict)
        )
        
    except ValueError:
        logger.warning("Invalid booking ID format", booking_id=booking_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid booking ID format"
        )
    except Exception as e:
        logger.error("Get booking failed", booking_id=booking_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve booking"
        )


@router.put("/{booking_id}", response_model=BaseResponse[BookingResponse])
async def update_booking(
    booking_id: str,
    booking_updates: BookingUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Update booking details (customer only for their own bookings).
    
    Args:
        booking_id: Booking ID
        booking_updates: Booking update data
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        BaseResponse containing updated booking
        
    Raises:
        HTTPException: 404 if booking not found
        HTTPException: 403 if user doesn't have access
        HTTPException: 400 if booking cannot be updated
    """
    logger.info("Booking update", booking_id=booking_id, user_id=str(current_user.id))
    
    try:
        # Get booking
        booking = await db.get(Booking, UUID(booking_id))
        if not booking:
            logger.warning("Booking not found for update", booking_id=booking_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        # Check access permissions
        if str(booking.user_id) != str(current_user.id):
            logger.warning("Unauthorized booking update", booking_id=booking_id, user_id=str(current_user.id))
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own bookings"
            )
        
        # Check if booking can be updated
        if booking.status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
            logger.warning("Cannot update completed/cancelled booking", booking_id=booking_id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update completed or cancelled bookings"
            )
        
        # Update fields
        if booking_updates.scheduled_date:
            scheduled_dt = datetime.fromisoformat(booking_updates.scheduled_date.replace('Z', '+00:00'))
            booking.scheduled_date = scheduled_dt
        
        if booking_updates.time_slot:
            booking.time_slot = {
                "start_time": booking_updates.time_slot.start_time,
                "end_time": booking_updates.time_slot.end_time,
                "is_available": booking_updates.time_slot.is_available
            }
        
        if booking_updates.customer_address:
            booking.customer_address = {
                "street": booking_updates.customer_address.street,
                "city": booking_updates.customer_address.city,
                "state": booking_updates.customer_address.state,
                "zip_code": booking_updates.customer_address.zip_code,
                "landmark": booking_updates.customer_address.landmark
            }
        
        if booking_updates.customer_notes is not None:
            booking.customer_notes = booking_updates.customer_notes
        
        if booking_updates.coupon_code is not None:
            booking.coupon_code = booking_updates.coupon_code
        
        booking.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(booking)
        
        logger.info("Booking updated successfully", booking_id=booking_id)
        
        # Load related data for response
        user = await db.get(User, booking.user_id)
        service = await db.get(Service, booking.service_id)
        
        # Build response
        booking_dict = {
            "id": str(booking.id),
            "userId": str(booking.user_id),
            "serviceId": str(booking.service_id),
            "scheduledDate": booking.scheduled_date.isoformat(),
            "timeSlot": booking.time_slot,
            "status": booking.status.value,
            "totalAmount": booking.total_amount,
            "discountAmount": booking.discount_amount,
            "finalAmount": booking.final_amount,
            "couponCode": booking.coupon_code,
            "customerAddress": booking.customer_address,
            "customerNotes": booking.customer_notes,
            "paymentStatus": booking.payment_status.value,
            "paymentMethod": booking.payment_method,
            "transactionId": booking.transaction_id,
            "completedAt": booking.completed_at.isoformat() if booking.completed_at else None,
            "cancelledAt": booking.cancelled_at.isoformat() if booking.cancelled_at else None,
            "cancellationReason": booking.cancellation_reason,
            "adminNotes": booking.admin_notes,
            "assignedTechnician": booking.assigned_technician,
            "createdAt": booking.created_at.isoformat(),
            "updatedAt": booking.updated_at.isoformat(),
            "user": {
                "id": str(user.id),
                "firstName": user.first_name,
                "lastName": user.last_name,
                "email": user.email,
                "phone": user.phone
            } if user else None,
            "service": {
                "id": str(service.id),
                "name": service.name,
                "description": service.description,
                "basePrice": service.base_price
            } if service else None
        }
        
        return BaseResponse(
            success=True,
            message="Booking updated successfully",
            data=BookingResponse(**booking_dict)
        )
        
    except ValueError as e:
        logger.warning("Booking update validation error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Booking update failed", booking_id=booking_id, error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update booking"
        )


@router.put("/{booking_id}/status", response_model=BaseResponse[BookingResponse])
async def update_booking_status(
    booking_id: str,
    status_update: BookingStatusUpdate,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Update booking status (Admin only).
    
    Args:
        booking_id: Booking ID
        status_update: Status update data
        current_user: Current admin user
        db: Database session
        
    Returns:
        BaseResponse containing updated booking
        
    Raises:
        HTTPException: 404 if booking not found
    """
    logger.info("Booking status update", booking_id=booking_id, new_status=status_update.status, admin_id=str(current_user.id))
    
    try:
        # Get booking
        booking = await db.get(Booking, UUID(booking_id))
        if not booking:
            logger.warning("Booking not found for status update", booking_id=booking_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        # Update status and related fields
        booking.status = status_update.status
        
        if status_update.admin_notes:
            booking.admin_notes = status_update.admin_notes
        
        if status_update.assigned_technician:
            booking.assigned_technician = status_update.assigned_technician
        
        # Set completion/cancellation timestamp
        if status_update.status == BookingStatus.COMPLETED:
            booking.completed_at = datetime.utcnow()
        elif status_update.status == BookingStatus.CANCELLED:
            booking.cancelled_at = datetime.utcnow()
        
        booking.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(booking)
        
        logger.info("Booking status updated successfully", booking_id=booking_id, new_status=status_update.status)
        
        # Load related data for response
        user = await db.get(User, booking.user_id)
        service = await db.get(Service, booking.service_id)
        
        # Build response (same as other endpoints)
        booking_dict = {
            "id": str(booking.id),
            "userId": str(booking.user_id),
            "serviceId": str(booking.service_id),
            "scheduledDate": booking.scheduled_date.isoformat(),
            "timeSlot": booking.time_slot,
            "status": booking.status.value,
            "totalAmount": booking.total_amount,
            "discountAmount": booking.discount_amount,
            "finalAmount": booking.final_amount,
            "couponCode": booking.coupon_code,
            "customerAddress": booking.customer_address,
            "customerNotes": booking.customer_notes,
            "paymentStatus": booking.payment_status.value,
            "paymentMethod": booking.payment_method,
            "transactionId": booking.transaction_id,
            "completedAt": booking.completed_at.isoformat() if booking.completed_at else None,
            "cancelledAt": booking.cancelled_at.isoformat() if booking.cancelled_at else None,
            "cancellationReason": booking.cancellation_reason,
            "adminNotes": booking.admin_notes,
            "assignedTechnician": booking.assigned_technician,
            "createdAt": booking.created_at.isoformat(),
            "updatedAt": booking.updated_at.isoformat(),
            "user": {
                "id": str(user.id),
                "firstName": user.first_name,
                "lastName": user.last_name,
                "email": user.email,
                "phone": user.phone
            } if user else None,
            "service": {
                "id": str(service.id),
                "name": service.name,
                "description": service.description,
                "basePrice": service.base_price
            } if service else None
        }
        
        return BaseResponse(
            success=True,
            message="Booking status updated successfully",
            data=BookingResponse(**booking_dict)
        )
        
    except Exception as e:
        logger.error("Booking status update failed", booking_id=booking_id, error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update booking status"
        )


@router.delete("/{booking_id}", response_model=SuccessResponse)
async def cancel_booking(
    booking_id: str,
    cancellation: BookingCancellation,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Cancel a booking.
    
    Args:
        booking_id: Booking ID
        cancellation: Cancellation data with reason
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        SuccessResponse
        
    Raises:
        HTTPException: 404 if booking not found
        HTTPException: 403 if user doesn't have access
        HTTPException: 400 if booking cannot be cancelled
    """
    logger.info("Booking cancellation", booking_id=booking_id, user_id=str(current_user.id))
    
    try:
        # Get booking
        booking = await db.get(Booking, UUID(booking_id))
        if not booking:
            logger.warning("Booking not found for cancellation", booking_id=booking_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Booking not found"
            )
        
        # Check access permissions
        if str(booking.user_id) != str(current_user.id) and not current_user.is_admin:
            logger.warning("Unauthorized booking cancellation", booking_id=booking_id, user_id=str(current_user.id))
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only cancel your own bookings"
            )
        
        # Check if booking can be cancelled
        if booking.status in [BookingStatus.COMPLETED, BookingStatus.CANCELLED]:
            logger.warning("Cannot cancel completed/cancelled booking", booking_id=booking_id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot cancel completed or already cancelled bookings"
            )
        
        # Update booking status
        booking.status = BookingStatus.CANCELLED
        booking.cancelled_at = datetime.utcnow()
        booking.cancellation_reason = cancellation.reason
        booking.updated_at = datetime.utcnow()
        
        await db.commit()
        
        logger.info("Booking cancelled successfully", booking_id=booking_id)
        
        return SuccessResponse(message="Booking cancelled successfully")
        
    except Exception as e:
        logger.error("Booking cancellation failed", booking_id=booking_id, error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel booking"
        )


# Admin Endpoints

@router.get("/admin/all", response_model=PaginatedResponse[BookingListResponse])
async def get_all_bookings(
    filters: BookingFilters = Depends(),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get all bookings with filtering and pagination (Admin only).
    
    Args:
        filters: Booking filtering parameters
        current_user: Current admin user
        db: Database session
        
    Returns:
        PaginatedResponse containing list of all bookings
    """
    logger.debug("Admin all bookings request", admin_id=str(current_user.id), page=filters.page)
    
    try:
        # Build query (no user filter for admin)
        query = db.query(Booking)
        
        # Apply filters (same as user bookings but without user restriction)
        if filters.user_id:
            query = query.filter(Booking.user_id == UUID(filters.user_id))
        
        if filters.service_id:
            query = query.filter(Booking.service_id == UUID(filters.service_id))
        
        if filters.status:
            query = query.filter(Booking.status == filters.status)
        
        if filters.start_date:
            start_dt = datetime.strptime(filters.start_date, "%Y-%m-%d")
            query = query.filter(Booking.scheduled_date >= start_dt)
        
        if filters.end_date:
            end_dt = datetime.strptime(f"{filters.end_date} 23:59:59", "%Y-%m-%d %H:%M:%S")
            query = query.filter(Booking.scheduled_date <= end_dt)
        
        if filters.min_amount is not None:
            query = query.filter(Booking.final_amount >= filters.min_amount)
        
        if filters.max_amount is not None:
            query = query.filter(Booking.final_amount <= filters.max_amount)
        
        if filters.payment_status:
            query = query.filter(Booking.payment_status == filters.payment_status)
        
        # Get total count
        total = await db.scalar(func.count().select().select_from(query.subquery()))
        
        # Apply sorting
        sort_field = getattr(Booking, filters.sort_by or "created_at", Booking.created_at)
        if filters.sort_order == "desc":
            sort_field = desc(sort_field)
        query = query.order_by(sort_field)
        
        # Apply pagination
        skip = (filters.page - 1) * filters.limit
        bookings = await db.scalars(
            query.options(selectinload(Booking.user), selectinload(Booking.service))
            .offset(skip)
            .limit(filters.limit)
        )
        
        # Convert to response format
        booking_responses = []
        for booking in bookings:
            booking_dict = {
                "id": str(booking.id),
                "userId": str(booking.user_id),
                "serviceId": str(booking.service_id),
                "scheduledDate": booking.scheduled_date.isoformat(),
                "timeSlot": booking.time_slot,
                "status": booking.status.value,
                "totalAmount": booking.total_amount,
                "discountAmount": booking.discount_amount,
                "finalAmount": booking.final_amount,
                "couponCode": booking.coupon_code,
                "customerAddress": booking.customer_address,
                "paymentStatus": booking.payment_status.value,
                "createdAt": booking.created_at.isoformat(),
                "updatedAt": booking.updated_at.isoformat()
            }
            booking_responses.append(BookingListResponse(**booking_dict))
        
        # Create pagination metadata
        pagination = PaginationMeta.create(filters.page, filters.limit, total)
        
        return PaginatedResponse(
            success=True,
            message="All bookings retrieved successfully",
            data=booking_responses,
            pagination=pagination
        )
        
    except Exception as e:
        logger.error("Get all bookings failed", admin_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve bookings"
        )


@router.get("/admin/stats", response_model=BaseResponse[BookingStatsResponse])
async def get_booking_stats(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get booking statistics (Admin only).
    
    Args:
        current_user: Current admin user
        db: Database session
        
    Returns:
        BaseResponse containing booking statistics
    """
    logger.debug("Booking stats request", admin_id=str(current_user.id))
    
    try:
        # Get total bookings
        total_bookings = await db.scalar(func.count(Booking.id))
        
        # Get status counts
        status_counts = {}
        for status in BookingStatus:
            count = await db.scalar(func.count(Booking.id).filter(Booking.status == status))
            status_counts[status.value] = count or 0
        
        # Get revenue statistics
        total_revenue = await db.scalar(func.sum(Booking.final_amount)) or 0.0
        avg_booking_value = total_revenue / total_bookings if total_bookings > 0 else 0.0
        
        # Get current month revenue
        current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        current_month_revenue = await db.scalar(
            func.sum(Booking.final_amount).filter(Booking.created_at >= current_month_start)
        ) or 0.0
        
        revenue_stats = {
            "total": total_revenue,
            "monthly": current_month_revenue,
            "average_per_booking": avg_booking_value
        }
        
        # Get monthly booking counts (last 12 months)
        monthly_bookings = []
        # This is a simplified version - would need more complex SQL for actual monthly data
        monthly_bookings.append({"month": "Current", "count": total_bookings})
        
        # Get top services (simplified - would need JOIN with services table)
        top_services = []
        # This would require a proper GROUP BY query with service details
        
        stats = {
            "totalBookings": total_bookings,
            "statusCounts": status_counts,
            "revenue": revenue_stats,
            "monthlyBookings": monthly_bookings,
            "topServices": top_services
        }
        
        return BaseResponse(
            success=True,
            message="Booking statistics retrieved successfully",
            data=BookingStatsResponse(**stats)
        )
        
    except Exception as e:
        logger.error("Get booking stats failed", admin_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve booking statistics"
        )


# Time Slot Management

@router.get("/time-slots", response_model=BaseResponse[List[dict]])
async def get_available_time_slots(
    service_id: str = Query(..., description="Service ID"),
    date: str = Query(..., description="Date in YYYY-MM-DD format"),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get available time slots for a service on a specific date.
    
    Args:
        service_id: Service ID
        date: Date in YYYY-MM-DD format
        current_user: Optional current user
        db: Database session
        
    Returns:
        BaseResponse containing available time slots
    """
    logger.debug("Time slots request", service_id=service_id, date=date)
    
    try:
        # Validate date format
        try:
            requested_date = datetime.strptime(date, "%Y-%m-%d").date()
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date format. Use YYYY-MM-DD"
            )
        
        # Check if date is in the future
        if requested_date <= date.today():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Date must be in the future"
            )
        
        # Verify service exists
        service = await db.get(Service, UUID(service_id))
        if not service or not service.is_active:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found or not available"
            )
        
        # Get existing bookings for the date
        start_of_day = datetime.combine(requested_date, datetime.min.time())
        end_of_day = datetime.combine(requested_date, datetime.max.time())
        
        existing_bookings = await db.scalars(
            db.query(Booking)
            .filter(
                and_(
                    Booking.service_id == UUID(service_id),
                    Booking.scheduled_date >= start_of_day,
                    Booking.scheduled_date <= end_of_day,
                    Booking.status.in_([BookingStatus.PENDING, BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS])
                )
            )
        )
        
        # Generate available time slots
        # This is a simplified implementation - in production you'd have more sophisticated slot management
        all_slots = [
            {"startTime": "09:00", "endTime": "11:00", "isAvailable": True},
            {"startTime": "11:00", "endTime": "13:00", "isAvailable": True},
            {"startTime": "13:00", "endTime": "15:00", "isAvailable": True},
            {"startTime": "15:00", "endTime": "17:00", "isAvailable": True},
            {"startTime": "17:00", "endTime": "19:00", "isAvailable": True},
        ]
        
        # Mark slots as unavailable if already booked
        booked_slots = [booking.time_slot for booking in existing_bookings]
        for slot in all_slots:
            for booked_slot in booked_slots:
                if (slot["startTime"] == booked_slot.get("start_time") and 
                    slot["endTime"] == booked_slot.get("end_time")):
                    slot["isAvailable"] = False
                    break
        
        return BaseResponse(
            success=True,
            message="Available time slots retrieved successfully",
            data=all_slots
        )
        
    except Exception as e:
        logger.error("Get time slots failed", service_id=service_id, date=date, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve time slots"
        )