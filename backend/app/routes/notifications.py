"""
Notification management routes for admin operations.

Handles notification templates, user preferences, delivery tracking,
and manual notification sending for admin users.
"""

from datetime import datetime, timedelta
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import and_, desc, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.future import select

from ..core.dependencies import get_current_user, get_current_admin_user
from ..core.logging import get_logger
from ..database.connection import get_db_session
from ..models.notification import (
    Notification, NotificationTemplate, UserNotificationPreference, NotificationLog,
    NotificationType, NotificationEvent, NotificationStatus, NotificationPriority
)
from ..models.user import User
from ..schemas.base import BaseResponse, PaginatedResponse, PaginationMeta
from ..services.notification_service import notification_service

logger = get_logger(__name__)

# Router setup
router = APIRouter(prefix="/notifications", tags=["notifications"])


# Notification Templates Management

@router.get("/templates", response_model=PaginatedResponse)
async def get_notification_templates(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    event_type: Optional[NotificationEvent] = None,
    notification_type: Optional[NotificationType] = None,
    is_active: Optional[bool] = None,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
) -> PaginatedResponse:
    """Get paginated list of notification templates (admin only)."""
    try:
        # Build query
        query = select(NotificationTemplate)
        
        # Apply filters
        if event_type:
            query = query.where(NotificationTemplate.event_type == event_type)
        if notification_type:
            query = query.where(NotificationTemplate.notification_type == notification_type)
        if is_active is not None:
            query = query.where(NotificationTemplate.is_active == is_active)
        
        # Get total count
        count_query = select(func.count(NotificationTemplate.id))
        if event_type:
            count_query = count_query.where(NotificationTemplate.event_type == event_type)
        if notification_type:
            count_query = count_query.where(NotificationTemplate.notification_type == notification_type)
        if is_active is not None:
            count_query = count_query.where(NotificationTemplate.is_active == is_active)
        
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Apply pagination and ordering
        query = query.order_by(desc(NotificationTemplate.created_at))
        query = query.offset((page - 1) * limit).limit(limit)
        
        # Execute query
        result = await db.execute(query)
        templates = result.scalars().all()
        
        # Format response
        templates_data = [template.dict_for_response() for template in templates]
        
        return PaginatedResponse(
            success=True,
            data=templates_data,
            pagination=PaginationMeta.create(page=page, limit=limit, total=total)
        )
        
    except Exception as e:
        logger.error(f"Error getting notification templates: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notification templates"
        )


@router.get("/templates/{template_id}", response_model=BaseResponse)
async def get_notification_template(
    template_id: UUID,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
) -> BaseResponse:
    """Get a specific notification template (admin only)."""
    try:
        query = select(NotificationTemplate).where(NotificationTemplate.id == template_id)
        result = await db.execute(query)
        template = result.scalar_one_or_none()
        
        if not template:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification template not found"
            )
        
        return BaseResponse(
            success=True,
            data=template.dict_for_response()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting template {template_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notification template"
        )


# Notification History

@router.get("/", response_model=PaginatedResponse)
async def get_notifications(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    customer_id: Optional[str] = None,
    event_type: Optional[NotificationEvent] = None,
    notification_type: Optional[NotificationType] = None,
    status: Optional[NotificationStatus] = None,
    from_date: Optional[datetime] = None,
    to_date: Optional[datetime] = None,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
) -> PaginatedResponse:
    """Get paginated list of sent notifications (admin only)."""
    try:
        # Build query
        query = select(Notification)
        
        # Apply filters
        if customer_id:
            query = query.where(Notification.customer_id == customer_id)
        if event_type:
            query = query.where(Notification.event_type == event_type)
        if notification_type:
            query = query.where(Notification.notification_type == notification_type)
        if status:
            query = query.where(Notification.status == status)
        if from_date:
            query = query.where(Notification.created_at >= from_date)
        if to_date:
            query = query.where(Notification.created_at <= to_date)
        
        # Get total count
        count_query = select(func.count(Notification.id))
        if customer_id:
            count_query = count_query.where(Notification.customer_id == customer_id)
        if event_type:
            count_query = count_query.where(Notification.event_type == event_type)
        if notification_type:
            count_query = count_query.where(Notification.notification_type == notification_type)
        if status:
            count_query = count_query.where(Notification.status == status)
        if from_date:
            count_query = count_query.where(Notification.created_at >= from_date)
        if to_date:
            count_query = count_query.where(Notification.created_at <= to_date)
        
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Apply pagination and ordering
        query = query.order_by(desc(Notification.created_at))
        query = query.offset((page - 1) * limit).limit(limit)
        
        # Execute query
        result = await db.execute(query)
        notifications = result.scalars().all()
        
        # Format response
        notifications_data = [notification.dict_for_response() for notification in notifications]
        
        return PaginatedResponse(
            success=True,
            data=notifications_data,
            pagination=PaginationMeta.create(page=page, limit=limit, total=total)
        )
        
    except Exception as e:
        logger.error(f"Error getting notifications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notifications"
        )


@router.get("/{notification_id}", response_model=BaseResponse)
async def get_notification(
    notification_id: UUID,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
) -> BaseResponse:
    """Get a specific notification with logs (admin only)."""
    try:
        # Get notification
        query = select(Notification).where(Notification.id == notification_id)
        result = await db.execute(query)
        notification = result.scalar_one_or_none()
        
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        # Get logs
        logs_query = select(NotificationLog).where(
            NotificationLog.notification_id == notification_id
        ).order_by(NotificationLog.logged_at)
        logs_result = await db.execute(logs_query)
        logs = logs_result.scalars().all()
        
        # Prepare response data
        notification_data = notification.dict_for_response()
        notification_data['logs'] = [log.dict_for_response() for log in logs]
        
        return BaseResponse(
            success=True,
            data=notification_data
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting notification {notification_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notification"
        )


# Manual Notification Sending

@router.post("/send-manual", response_model=BaseResponse)
async def send_manual_notification(
    customer_id: str,
    event_type: NotificationEvent,
    notification_type: NotificationType,
    priority: NotificationPriority = NotificationPriority.NORMAL,
    order_id: Optional[UUID] = None,
    custom_message: Optional[str] = None,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
) -> BaseResponse:
    """Send a manual notification (admin only)."""
    try:
        # Get customer info
        customer_query = select(User).where(User.id == customer_id)
        customer_result = await db.execute(customer_query)
        customer = customer_result.scalar_one_or_none()
        
        if not customer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Customer not found"
            )
        
        # Send notification
        if order_id:
            # Order-based notification
            results = await notification_service.send_order_notification(
                db=db,
                order_id=str(order_id),
                event_type=event_type,
                priority=priority,
                force_send=True  # Override user preferences for manual sends
            )
        else:
            # Direct notification (would need additional implementation)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Direct notifications not yet implemented. Please provide an order_id."
            )
        
        if results:
            success_count = sum(1 for result in results if result.success)
            return BaseResponse(
                success=True,
                message=f"Manual notification sent successfully. {success_count}/{len(results)} notifications delivered.",
                data={"results": [{"success": r.success, "error": r.error_message} for r in results]}
            )
        else:
            return BaseResponse(
                success=False,
                message="No notifications were sent. Check customer preferences and template availability."
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending manual notification: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send manual notification"
        )


# Notification Analytics

@router.get("/analytics/summary", response_model=BaseResponse)
async def get_notification_analytics(
    days: int = Query(7, ge=1, le=30),
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
) -> BaseResponse:
    """Get notification analytics summary (admin only)."""
    try:
        cutoff_date = datetime.utcnow() - timedelta(days=days)
        
        # Total notifications
        total_query = select(func.count(Notification.id)).where(
            Notification.created_at >= cutoff_date
        )
        total_result = await db.execute(total_query)
        total_notifications = total_result.scalar() or 0
        
        # By status
        status_query = select(
            Notification.status,
            func.count(Notification.id)
        ).where(
            Notification.created_at >= cutoff_date
        ).group_by(Notification.status)
        status_result = await db.execute(status_query)
        status_counts = {row[0]: row[1] for row in status_result}
        
        # By type
        type_query = select(
            Notification.notification_type,
            func.count(Notification.id)
        ).where(
            Notification.created_at >= cutoff_date
        ).group_by(Notification.notification_type)
        type_result = await db.execute(type_query)
        type_counts = {row[0]: row[1] for row in type_result}
        
        # By event
        event_query = select(
            Notification.event_type,
            func.count(Notification.id)
        ).where(
            Notification.created_at >= cutoff_date
        ).group_by(Notification.event_type)
        event_result = await db.execute(event_query)
        event_counts = {row[0]: row[1] for row in event_result}
        
        # Success rate
        success_rate = 0
        if total_notifications > 0:
            success_count = status_counts.get(NotificationStatus.SENT, 0) + status_counts.get(NotificationStatus.DELIVERED, 0)
            success_rate = round((success_count / total_notifications) * 100, 2)
        
        analytics_data = {
            "period_days": days,
            "total_notifications": total_notifications,
            "success_rate_percentage": success_rate,
            "status_breakdown": status_counts,
            "type_breakdown": type_counts,
            "event_breakdown": event_counts,
            "generated_at": datetime.utcnow().isoformat()
        }
        
        return BaseResponse(
            success=True,
            data=analytics_data
        )
        
    except Exception as e:
        logger.error(f"Error getting notification analytics: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve notification analytics"
        )


# User Notification Preferences

@router.get("/preferences/{user_id}", response_model=BaseResponse)
async def get_user_notification_preferences(
    user_id: str,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
) -> BaseResponse:
    """Get user notification preferences (admin only)."""
    try:
        query = select(UserNotificationPreference).where(
            UserNotificationPreference.user_id == user_id
        )
        result = await db.execute(query)
        preferences = result.scalar_one_or_none()
        
        if not preferences:
            # Return default preferences if none exist
            default_prefs = {
                "user_id": user_id,
                "sms_enabled": True,
                "email_enabled": True,
                "order_updates": True,
                "engineer_updates": True,
                "marketing_notifications": False,
                "promotional_offers": False,
                "quiet_hours_start": "22:00",
                "quiet_hours_end": "08:00",
                "timezone": "Asia/Kolkata"
            }
            
            return BaseResponse(
                success=True,
                message="No preferences found. Showing defaults.",
                data=default_prefs
            )
        
        return BaseResponse(
            success=True,
            data=preferences.dict_for_response()
        )
        
    except Exception as e:
        logger.error(f"Error getting user preferences for {user_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve user notification preferences"
        )


# Retry Failed Notifications

@router.post("/retry-failed", response_model=BaseResponse)
async def retry_failed_notifications(
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
) -> BaseResponse:
    """Retry failed notifications (admin only)."""
    try:
        retried_count = await notification_service.retry_failed_notifications(db)
        
        return BaseResponse(
            success=True,
            message=f"Retry process completed. {retried_count} notifications were retried.",
            data={"retried_count": retried_count}
        )
        
    except Exception as e:
        logger.error(f"Error retrying failed notifications: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retry failed notifications"
        )