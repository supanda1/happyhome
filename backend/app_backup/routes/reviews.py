"""
Review management routes for service reviews and ratings.
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
from ..models.review import Review, ReviewPhoto, ReviewHelpfulness
from ..models.service import Service
from ..models.user import User
from ..models.booking import Booking, BookingStatus
from ..schemas.base import BaseResponse, PaginatedResponse, PaginationMeta, SuccessResponse
from ..schemas.review import (
    ReviewCreate,
    ReviewUpdate,
    ReviewApprovalRequest,
    ReviewBulkApprovalRequest,
    ReviewResponse,
    ReviewListResponse,
    ReviewFilters,
    ReviewStatsResponse,
    ServiceRatingStats,
)

logger = get_logger(__name__)

router = APIRouter(prefix="/reviews")


# Public Endpoints

@router.get("/service/{service_id}", response_model=PaginatedResponse[ReviewListResponse])
async def get_service_reviews(
    service_id: str,
    filters: ReviewFilters = Depends(),
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get reviews for a specific service with filtering and pagination.
    
    Args:
        service_id: Service ID
        filters: Review filtering parameters
        current_user: Optional current user
        db: Database session
        
    Returns:
        PaginatedResponse containing list of service reviews
        
    Raises:
        HTTPException: 404 if service not found
    """
    logger.debug("Service reviews request", service_id=service_id, page=filters.page)
    
    try:
        # Verify service exists
        service = await db.get(Service, UUID(service_id))
        if not service:
            logger.warning("Service not found for reviews", service_id=service_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )
        
        # Build query - only show approved reviews for non-admin users
        query = db.query(Review).filter(Review.service_id == UUID(service_id))
        
        if not current_user or not current_user.is_admin:
            query = query.filter(Review.is_approved == True)
        
        # Apply filters
        if filters.user_id:
            query = query.filter(Review.user_id == UUID(filters.user_id))
        
        if filters.rating:
            query = query.filter(Review.rating == filters.rating)
        
        if filters.min_rating:
            query = query.filter(Review.rating >= filters.min_rating)
        
        if filters.is_approved is not None and current_user and current_user.is_admin:
            query = query.filter(Review.is_approved == filters.is_approved)
        
        if filters.is_verified is not None:
            query = query.filter(Review.is_verified == filters.is_verified)
        
        if filters.has_photos is not None:
            if filters.has_photos:
                query = query.filter(func.json_length(Review.photos) > 0)
            else:
                query = query.filter(func.json_length(Review.photos) == 0)
        
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    Review.title.ilike(search_term),
                    Review.comment.ilike(search_term)
                )
            )
        
        # Get total count
        total = await db.scalar(func.count().select().select_from(query.subquery()))
        
        # Apply sorting
        sort_field = getattr(Review, filters.sort_by or "created_at", Review.created_at)
        if filters.sort_order == "desc":
            sort_field = desc(sort_field)
        query = query.order_by(sort_field)
        
        # Apply pagination
        skip = (filters.page - 1) * filters.limit
        reviews = await db.scalars(
            query.options(selectinload(Review.user), selectinload(Review.service))
            .offset(skip)
            .limit(filters.limit)
        )
        
        # Convert to response format
        review_responses = []
        for review in reviews:
            review_dict = {
                "id": str(review.id),
                "serviceId": str(review.service_id),
                "userId": str(review.user_id),
                "rating": review.rating,
                "title": review.title,
                "comment": review.comment,
                "photos": review.photos or [],
                "isVerified": review.is_verified,
                "isApproved": review.is_approved,
                "createdAt": review.created_at.isoformat(),
                "updatedAt": review.updated_at.isoformat(),
                "user": {
                    "firstName": review.user.first_name,
                    "lastName": review.user.last_name
                } if review.user else None
            }
            review_responses.append(ReviewListResponse(**review_dict))
        
        # Create pagination metadata
        pagination = PaginationMeta.create(filters.page, filters.limit, total)
        
        return PaginatedResponse(
            success=True,
            message="Service reviews retrieved successfully",
            data=review_responses,
            pagination=pagination
        )
        
    except ValueError:
        logger.warning("Invalid service ID format", service_id=service_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid service ID format"
        )
    except Exception as e:
        logger.error("Get service reviews failed", service_id=service_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve service reviews"
        )


@router.get("/service/{service_id}/stats", response_model=BaseResponse[ServiceRatingStats])
async def get_service_rating_stats(
    service_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get rating statistics for a specific service.
    
    Args:
        service_id: Service ID
        current_user: Optional current user
        db: Database session
        
    Returns:
        BaseResponse containing service rating statistics
        
    Raises:
        HTTPException: 404 if service not found
    """
    logger.debug("Service rating stats request", service_id=service_id)
    
    try:
        # Verify service exists
        service = await db.get(Service, UUID(service_id))
        if not service:
            logger.warning("Service not found for rating stats", service_id=service_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found"
            )
        
        # Query approved reviews only
        query = db.query(Review).filter(
            and_(
                Review.service_id == UUID(service_id),
                Review.is_approved == True
            )
        )
        
        # Get total reviews and average rating
        total_reviews = await db.scalar(func.count(Review.id).select().select_from(query.subquery()))
        avg_rating = await db.scalar(func.avg(Review.rating).select().select_from(query.subquery())) or 0.0
        
        # Get rating distribution
        rating_distribution = {}
        for rating in range(1, 6):
            count = await db.scalar(
                func.count(Review.id).filter(
                    and_(
                        Review.service_id == UUID(service_id),
                        Review.is_approved == True,
                        Review.rating == rating
                    )
                )
            ) or 0
            rating_distribution[str(rating)] = count
        
        stats = {
            "serviceId": service_id,
            "average": round(avg_rating, 1),
            "total": total_reviews,
            "distribution": rating_distribution
        }
        
        return BaseResponse(
            success=True,
            message="Service rating statistics retrieved successfully",
            data=ServiceRatingStats(**stats)
        )
        
    except ValueError:
        logger.warning("Invalid service ID format", service_id=service_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid service ID format"
        )
    except Exception as e:
        logger.error("Get service rating stats failed", service_id=service_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve service rating statistics"
        )


# User Endpoints

@router.post("/", response_model=BaseResponse[ReviewResponse])
async def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Create a new review for a service.
    
    Args:
        review_data: Review creation data
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        BaseResponse containing created review
        
    Raises:
        HTTPException: 404 if service not found
        HTTPException: 400 if user has already reviewed this service
    """
    logger.info("Review creation", service_id=review_data.service_id, user_id=str(current_user.id))
    
    try:
        # Verify service exists and is active
        service = await db.get(Service, UUID(review_data.service_id))
        if not service or not service.is_active:
            logger.warning("Service not found or inactive", service_id=review_data.service_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Service not found or not available"
            )
        
        # Check if user has already reviewed this service
        existing_review = await db.scalar(
            db.query(Review).filter(
                and_(
                    Review.service_id == UUID(review_data.service_id),
                    Review.user_id == current_user.id
                )
            )
        )
        if existing_review:
            logger.warning("User already reviewed service", service_id=review_data.service_id, user_id=str(current_user.id))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already reviewed this service"
            )
        
        # Check if user has a completed booking for this service (for verification)
        completed_booking = await db.scalar(
            db.query(Booking).filter(
                and_(
                    Booking.user_id == current_user.id,
                    Booking.service_id == UUID(review_data.service_id),
                    Booking.status == BookingStatus.COMPLETED
                )
            )
        )
        
        is_verified = completed_booking is not None
        booking_id = completed_booking.id if completed_booking else None
        
        # Create review
        review = Review(
            service_id=UUID(review_data.service_id),
            user_id=current_user.id,
            booking_id=booking_id,
            rating=review_data.rating,
            title=review_data.title,
            comment=review_data.comment,
            photos=review_data.photos,
            is_verified=is_verified,
            is_approved=False  # Reviews need admin approval
        )
        
        db.add(review)
        await db.commit()
        await db.refresh(review)
        
        logger.info("Review created successfully", review_id=str(review.id), is_verified=is_verified)
        
        # Load related data for response
        user = await db.get(User, review.user_id)
        service = await db.get(Service, review.service_id)
        
        # Build response
        review_dict = {
            "id": str(review.id),
            "serviceId": str(review.service_id),
            "userId": str(review.user_id),
            "rating": review.rating,
            "title": review.title,
            "comment": review.comment,
            "photos": review.photos or [],
            "isVerified": review.is_verified,
            "isApproved": review.is_approved,
            "adminNotes": review.admin_notes,
            "approvedBy": review.approved_by,
            "approvedAt": review.approved_at.isoformat() if review.approved_at else None,
            "createdAt": review.created_at.isoformat(),
            "updatedAt": review.updated_at.isoformat(),
            "user": {
                "id": str(user.id),
                "firstName": user.first_name,
                "lastName": user.last_name,
                "email": user.email
            } if user else None,
            "service": {
                "id": str(service.id),
                "name": service.name,
                "description": service.description
            } if service else None
        }
        
        return BaseResponse(
            success=True,
            message="Review created successfully and is pending approval",
            data=ReviewResponse(**review_dict)
        )
        
    except ValueError as e:
        logger.warning("Review creation validation error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Review creation failed", service_id=review_data.service_id, error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create review"
        )


@router.get("/my", response_model=PaginatedResponse[ReviewListResponse])
async def get_user_reviews(
    filters: ReviewFilters = Depends(),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get current user's reviews with filtering and pagination.
    
    Args:
        filters: Review filtering parameters
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        PaginatedResponse containing list of user reviews
    """
    logger.debug("User reviews request", user_id=str(current_user.id), page=filters.page)
    
    try:
        # Build query for user's reviews
        query = db.query(Review).filter(Review.user_id == current_user.id)
        
        # Apply filters
        if filters.service_id:
            query = query.filter(Review.service_id == UUID(filters.service_id))
        
        if filters.rating:
            query = query.filter(Review.rating == filters.rating)
        
        if filters.min_rating:
            query = query.filter(Review.rating >= filters.min_rating)
        
        if filters.is_approved is not None:
            query = query.filter(Review.is_approved == filters.is_approved)
        
        if filters.is_verified is not None:
            query = query.filter(Review.is_verified == filters.is_verified)
        
        if filters.has_photos is not None:
            if filters.has_photos:
                query = query.filter(func.json_length(Review.photos) > 0)
            else:
                query = query.filter(func.json_length(Review.photos) == 0)
        
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    Review.title.ilike(search_term),
                    Review.comment.ilike(search_term)
                )
            )
        
        # Get total count
        total = await db.scalar(func.count().select().select_from(query.subquery()))
        
        # Apply sorting
        sort_field = getattr(Review, filters.sort_by or "created_at", Review.created_at)
        if filters.sort_order == "desc":
            sort_field = desc(sort_field)
        query = query.order_by(sort_field)
        
        # Apply pagination
        skip = (filters.page - 1) * filters.limit
        reviews = await db.scalars(
            query.options(selectinload(Review.service))
            .offset(skip)
            .limit(filters.limit)
        )
        
        # Convert to response format
        review_responses = []
        for review in reviews:
            review_dict = {
                "id": str(review.id),
                "serviceId": str(review.service_id),
                "userId": str(review.user_id),
                "rating": review.rating,
                "title": review.title,
                "comment": review.comment,
                "photos": review.photos or [],
                "isVerified": review.is_verified,
                "isApproved": review.is_approved,
                "createdAt": review.created_at.isoformat(),
                "updatedAt": review.updated_at.isoformat(),
                "service": {
                    "id": str(review.service.id),
                    "name": review.service.name,
                    "description": review.service.description
                } if review.service else None
            }
            review_responses.append(ReviewListResponse(**review_dict))
        
        # Create pagination metadata
        pagination = PaginationMeta.create(filters.page, filters.limit, total)
        
        return PaginatedResponse(
            success=True,
            message="User reviews retrieved successfully",
            data=review_responses,
            pagination=pagination
        )
        
    except Exception as e:
        logger.error("Get user reviews failed", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user reviews"
        )


@router.get("/{review_id}", response_model=BaseResponse[ReviewResponse])
async def get_review(
    review_id: str,
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get review details by ID.
    
    Args:
        review_id: Review ID
        current_user: Optional current user
        db: Database session
        
    Returns:
        BaseResponse containing review details
        
    Raises:
        HTTPException: 404 if review not found
        HTTPException: 403 if review is not approved and user is not owner/admin
    """
    logger.debug("Review detail request", review_id=review_id)
    
    try:
        # Get review with related data
        review = await db.scalar(
            db.query(Review)
            .options(selectinload(Review.user), selectinload(Review.service))
            .filter(Review.id == UUID(review_id))
        )
        
        if not review:
            logger.warning("Review not found", review_id=review_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        # Check access permissions for non-approved reviews
        if not review.is_approved:
            if not current_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Review not found"
                )
            
            # Only review owner and admin can view non-approved reviews
            if str(review.user_id) != str(current_user.id) and not current_user.is_admin:
                logger.warning("Unauthorized review access", review_id=review_id, user_id=str(current_user.id))
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Review not found"
                )
        
        # Build response
        review_dict = {
            "id": str(review.id),
            "serviceId": str(review.service_id),
            "userId": str(review.user_id),
            "rating": review.rating,
            "title": review.title,
            "comment": review.comment,
            "photos": review.photos or [],
            "isVerified": review.is_verified,
            "isApproved": review.is_approved,
            "adminNotes": review.admin_notes,
            "approvedBy": review.approved_by,
            "approvedAt": review.approved_at.isoformat() if review.approved_at else None,
            "createdAt": review.created_at.isoformat(),
            "updatedAt": review.updated_at.isoformat(),
            "user": {
                "id": str(review.user.id),
                "firstName": review.user.first_name,
                "lastName": review.user.last_name
            } if review.user else None,
            "service": {
                "id": str(review.service.id),
                "name": review.service.name,
                "description": review.service.description
            } if review.service else None
        }
        
        return BaseResponse(
            success=True,
            message="Review retrieved successfully",
            data=ReviewResponse(**review_dict)
        )
        
    except ValueError:
        logger.warning("Invalid review ID format", review_id=review_id)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid review ID format"
        )
    except Exception as e:
        logger.error("Get review failed", review_id=review_id, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve review"
        )


@router.put("/{review_id}", response_model=BaseResponse[ReviewResponse])
async def update_review(
    review_id: str,
    review_updates: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Update a review (only by the review owner).
    
    Args:
        review_id: Review ID
        review_updates: Review update data
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        BaseResponse containing updated review
        
    Raises:
        HTTPException: 404 if review not found
        HTTPException: 403 if user is not the review owner
        HTTPException: 400 if review is already approved
    """
    logger.info("Review update", review_id=review_id, user_id=str(current_user.id))
    
    try:
        # Get review
        review = await db.get(Review, UUID(review_id))
        if not review:
            logger.warning("Review not found for update", review_id=review_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        # Check if user owns the review
        if str(review.user_id) != str(current_user.id):
            logger.warning("Unauthorized review update", review_id=review_id, user_id=str(current_user.id))
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only update your own reviews"
            )
        
        # Check if review is already approved (may want to restrict updates)
        if review.is_approved:
            logger.warning("Cannot update approved review", review_id=review_id)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot update approved reviews. Contact support if needed."
            )
        
        # Update fields
        if review_updates.rating is not None:
            review.rating = review_updates.rating
        
        if review_updates.title is not None:
            review.title = review_updates.title
        
        if review_updates.comment is not None:
            review.comment = review_updates.comment
        
        if review_updates.photos is not None:
            review.photos = review_updates.photos
        
        review.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(review)
        
        logger.info("Review updated successfully", review_id=review_id)
        
        # Load related data for response
        user = await db.get(User, review.user_id)
        service = await db.get(Service, review.service_id)
        
        # Build response
        review_dict = {
            "id": str(review.id),
            "serviceId": str(review.service_id),
            "userId": str(review.user_id),
            "rating": review.rating,
            "title": review.title,
            "comment": review.comment,
            "photos": review.photos or [],
            "isVerified": review.is_verified,
            "isApproved": review.is_approved,
            "adminNotes": review.admin_notes,
            "approvedBy": review.approved_by,
            "approvedAt": review.approved_at.isoformat() if review.approved_at else None,
            "createdAt": review.created_at.isoformat(),
            "updatedAt": review.updated_at.isoformat(),
            "user": {
                "id": str(user.id),
                "firstName": user.first_name,
                "lastName": user.last_name,
                "email": user.email
            } if user else None,
            "service": {
                "id": str(service.id),
                "name": service.name,
                "description": service.description
            } if service else None
        }
        
        return BaseResponse(
            success=True,
            message="Review updated successfully",
            data=ReviewResponse(**review_dict)
        )
        
    except ValueError as e:
        logger.warning("Review update validation error", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error("Review update failed", review_id=review_id, error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update review"
        )


@router.delete("/{review_id}", response_model=SuccessResponse)
async def delete_review(
    review_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Delete a review (only by the review owner or admin).
    
    Args:
        review_id: Review ID
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        SuccessResponse
        
    Raises:
        HTTPException: 404 if review not found
        HTTPException: 403 if user doesn't have permission
    """
    logger.info("Review deletion", review_id=review_id, user_id=str(current_user.id))
    
    try:
        # Get review
        review = await db.get(Review, UUID(review_id))
        if not review:
            logger.warning("Review not found for deletion", review_id=review_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        # Check permissions (owner or admin)
        if str(review.user_id) != str(current_user.id) and not current_user.is_admin:
            logger.warning("Unauthorized review deletion", review_id=review_id, user_id=str(current_user.id))
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own reviews"
            )
        
        # Delete review
        await db.delete(review)
        await db.commit()
        
        logger.info("Review deleted successfully", review_id=review_id)
        
        return SuccessResponse(message="Review deleted successfully")
        
    except Exception as e:
        logger.error("Review deletion failed", review_id=review_id, error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete review"
        )


# Admin Endpoints

@router.get("/admin/all", response_model=PaginatedResponse[ReviewResponse])
async def get_all_reviews(
    filters: ReviewFilters = Depends(),
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get all reviews with filtering and pagination (Admin only).
    
    Args:
        filters: Review filtering parameters
        current_user: Current admin user
        db: Database session
        
    Returns:
        PaginatedResponse containing list of all reviews
    """
    logger.debug("Admin all reviews request", admin_id=str(current_user.id), page=filters.page)
    
    try:
        # Build query (no restriction for admin)
        query = db.query(Review)
        
        # Apply filters
        if filters.service_id:
            query = query.filter(Review.service_id == UUID(filters.service_id))
        
        if filters.user_id:
            query = query.filter(Review.user_id == UUID(filters.user_id))
        
        if filters.rating:
            query = query.filter(Review.rating == filters.rating)
        
        if filters.min_rating:
            query = query.filter(Review.rating >= filters.min_rating)
        
        if filters.is_approved is not None:
            query = query.filter(Review.is_approved == filters.is_approved)
        
        if filters.is_verified is not None:
            query = query.filter(Review.is_verified == filters.is_verified)
        
        if filters.has_photos is not None:
            if filters.has_photos:
                query = query.filter(func.json_length(Review.photos) > 0)
            else:
                query = query.filter(func.json_length(Review.photos) == 0)
        
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.filter(
                or_(
                    Review.title.ilike(search_term),
                    Review.comment.ilike(search_term)
                )
            )
        
        # Get total count
        total = await db.scalar(func.count().select().select_from(query.subquery()))
        
        # Apply sorting
        sort_field = getattr(Review, filters.sort_by or "created_at", Review.created_at)
        if filters.sort_order == "desc":
            sort_field = desc(sort_field)
        query = query.order_by(sort_field)
        
        # Apply pagination
        skip = (filters.page - 1) * filters.limit
        reviews = await db.scalars(
            query.options(selectinload(Review.user), selectinload(Review.service))
            .offset(skip)
            .limit(filters.limit)
        )
        
        # Convert to response format
        review_responses = []
        for review in reviews:
            review_dict = {
                "id": str(review.id),
                "serviceId": str(review.service_id),
                "userId": str(review.user_id),
                "rating": review.rating,
                "title": review.title,
                "comment": review.comment,
                "photos": review.photos or [],
                "isVerified": review.is_verified,
                "isApproved": review.is_approved,
                "adminNotes": review.admin_notes,
                "approvedBy": review.approved_by,
                "approvedAt": review.approved_at.isoformat() if review.approved_at else None,
                "createdAt": review.created_at.isoformat(),
                "updatedAt": review.updated_at.isoformat(),
                "user": {
                    "id": str(review.user.id),
                    "firstName": review.user.first_name,
                    "lastName": review.user.last_name,
                    "email": review.user.email
                } if review.user else None,
                "service": {
                    "id": str(review.service.id),
                    "name": review.service.name,
                    "description": review.service.description
                } if review.service else None
            }
            review_responses.append(ReviewResponse(**review_dict))
        
        # Create pagination metadata
        pagination = PaginationMeta.create(filters.page, filters.limit, total)
        
        return PaginatedResponse(
            success=True,
            message="All reviews retrieved successfully",
            data=review_responses,
            pagination=pagination
        )
        
    except Exception as e:
        logger.error("Get all reviews failed", admin_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve reviews"
        )


@router.put("/{review_id}/approve", response_model=BaseResponse[ReviewResponse])
async def approve_review(
    review_id: str,
    approval_request: ReviewApprovalRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Approve or reject a review (Admin only).
    
    Args:
        review_id: Review ID
        approval_request: Approval/rejection data
        current_user: Current admin user
        db: Database session
        
    Returns:
        BaseResponse containing updated review
        
    Raises:
        HTTPException: 404 if review not found
    """
    logger.info("Review approval", review_id=review_id, is_approved=approval_request.is_approved, admin_id=str(current_user.id))
    
    try:
        # Get review
        review = await db.get(Review, UUID(review_id))
        if not review:
            logger.warning("Review not found for approval", review_id=review_id)
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Review not found"
            )
        
        # Update approval status
        review.is_approved = approval_request.is_approved
        review.admin_notes = approval_request.admin_notes
        review.approved_by = str(current_user.id)
        review.approved_at = datetime.utcnow()
        review.updated_at = datetime.utcnow()
        
        await db.commit()
        await db.refresh(review)
        
        action = "approved" if approval_request.is_approved else "rejected"
        logger.info(f"Review {action} successfully", review_id=review_id, admin_id=str(current_user.id))
        
        # Load related data for response
        user = await db.get(User, review.user_id)
        service = await db.get(Service, review.service_id)
        
        # Build response
        review_dict = {
            "id": str(review.id),
            "serviceId": str(review.service_id),
            "userId": str(review.user_id),
            "rating": review.rating,
            "title": review.title,
            "comment": review.comment,
            "photos": review.photos or [],
            "isVerified": review.is_verified,
            "isApproved": review.is_approved,
            "adminNotes": review.admin_notes,
            "approvedBy": review.approved_by,
            "approvedAt": review.approved_at.isoformat() if review.approved_at else None,
            "createdAt": review.created_at.isoformat(),
            "updatedAt": review.updated_at.isoformat(),
            "user": {
                "id": str(user.id),
                "firstName": user.first_name,
                "lastName": user.last_name,
                "email": user.email
            } if user else None,
            "service": {
                "id": str(service.id),
                "name": service.name,
                "description": service.description
            } if service else None
        }
        
        return BaseResponse(
            success=True,
            message=f"Review {action} successfully",
            data=ReviewResponse(**review_dict)
        )
        
    except Exception as e:
        logger.error("Review approval failed", review_id=review_id, error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process review approval"
        )


@router.post("/admin/bulk-approve", response_model=SuccessResponse)
async def bulk_approve_reviews(
    bulk_request: ReviewBulkApprovalRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Bulk approve or reject multiple reviews (Admin only).
    
    Args:
        bulk_request: Bulk approval/rejection data
        current_user: Current admin user
        db: Database session
        
    Returns:
        SuccessResponse with processing summary
    """
    logger.info("Bulk review approval", count=len(bulk_request.review_ids), is_approved=bulk_request.is_approved, admin_id=str(current_user.id))
    
    try:
        processed_count = 0
        current_time = datetime.utcnow()
        
        # Process each review
        for review_id in bulk_request.review_ids:
            try:
                review = await db.get(Review, UUID(review_id))
                if review:
                    review.is_approved = bulk_request.is_approved
                    review.admin_notes = bulk_request.admin_notes
                    review.approved_by = str(current_user.id)
                    review.approved_at = current_time
                    review.updated_at = current_time
                    processed_count += 1
            except Exception as e:
                logger.warning("Failed to process review in bulk", review_id=review_id, error=str(e))
                continue
        
        await db.commit()
        
        action = "approved" if bulk_request.is_approved else "rejected"
        logger.info(f"Bulk review {action} completed", processed_count=processed_count, admin_id=str(current_user.id))
        
        return SuccessResponse(
            message=f"Successfully {action} {processed_count} reviews"
        )
        
    except Exception as e:
        logger.error("Bulk review approval failed", error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process bulk review approval"
        )


@router.get("/admin/stats", response_model=BaseResponse[ReviewStatsResponse])
async def get_review_stats(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get review statistics (Admin only).
    
    Args:
        current_user: Current admin user
        db: Database session
        
    Returns:
        BaseResponse containing review statistics
    """
    logger.debug("Review stats request", admin_id=str(current_user.id))
    
    try:
        # Get total reviews
        total_reviews = await db.scalar(func.count(Review.id))
        
        # Get approved reviews
        approved_reviews = await db.scalar(
            func.count(Review.id).filter(Review.is_approved == True)
        )
        
        # Get pending reviews
        pending_reviews = total_reviews - approved_reviews
        
        # Get average rating (approved reviews only)
        avg_rating = await db.scalar(
            func.avg(Review.rating).filter(Review.is_approved == True)
        ) or 0.0
        
        # Get rating distribution (approved reviews only)
        rating_distribution = {}
        for rating in range(1, 6):
            count = await db.scalar(
                func.count(Review.id).filter(
                    and_(
                        Review.rating == rating,
                        Review.is_approved == True
                    )
                )
            ) or 0
            rating_distribution[str(rating)] = count
        
        # Get verified reviews
        verified_reviews = await db.scalar(
            func.count(Review.id).filter(Review.is_verified == True)
        ) or 0
        
        # Get reviews with photos
        reviews_with_photos = await db.scalar(
            func.count(Review.id).filter(func.json_length(Review.photos) > 0)
        ) or 0
        
        # Monthly reviews (simplified - just current month)
        current_month_start = datetime.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        current_month_reviews = await db.scalar(
            func.count(Review.id).filter(Review.created_at >= current_month_start)
        ) or 0
        
        monthly_reviews = [{"month": "Current", "count": current_month_reviews}]
        
        stats = {
            "totalReviews": total_reviews,
            "approvedReviews": approved_reviews,
            "pendingReviews": pending_reviews,
            "averageRating": round(avg_rating, 1),
            "ratingDistribution": rating_distribution,
            "verifiedReviews": verified_reviews,
            "reviewsWithPhotos": reviews_with_photos,
            "monthlyReviews": monthly_reviews
        }
        
        return BaseResponse(
            success=True,
            message="Review statistics retrieved successfully",
            data=ReviewStatsResponse(**stats)
        )
        
    except Exception as e:
        logger.error("Get review stats failed", admin_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve review statistics"
        )