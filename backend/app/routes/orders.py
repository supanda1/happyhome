"""
Order management routes for multi-item service orders.

Handles complete order lifecycle from creation to completion:
- Creating orders from cart items
- Order tracking and status updates  
- Engineer assignment to order items
- Order completion and customer feedback
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy import and_, desc, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.future import select

from ..core.dependencies import get_current_user, get_current_admin_user, get_optional_current_user
from ..core.logging import get_logger
from ..database.connection import get_db_session
from ..models.order import Order, OrderItem, OrderStatus, OrderPriority, ItemStatus
from ..models.service import Service, ServiceCategory, ServiceSubcategory
from ..models.user import User
from ..models.notification import NotificationEvent, NotificationPriority
from ..schemas.base import BaseResponse, PaginatedResponse, PaginationMeta, SuccessResponse
from ..schemas.order import (
    OrderCreate,
    OrderUpdate,
    OrderItemUpdate,
    AssignEngineerRequest,
    OrderFilters
)
from ..services.notification_service import notification_service

logger = get_logger(__name__)

# Router setup
router = APIRouter(prefix="/orders", tags=["orders"])


# All schemas are now imported from ..schemas.order


# API Endpoints

@router.post("/", response_model=BaseResponse)
async def create_order(
    order_data: OrderCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
) -> BaseResponse:
    """
    Create a new order with multiple items.
    
    Converts cart items into a complete order with order number,
    customer information, and individual item tracking.
    """
    try:
        # Generate order number directly 
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        short_uuid = str(uuid4()).replace('-', '')[:8].upper()
        order_number = f"HH-{timestamp}-{short_uuid}"
        
        # Create new order
        new_order = Order(
            order_number=order_number,
            customer_id=str(current_user.id),  # Use authenticated user's ID
            customer_name=order_data.customer_name,
            customer_phone=order_data.customer_phone,
            customer_email=order_data.customer_email,
            service_address=order_data.service_address.dict(),
            total_amount=order_data.total_amount,
            discount_amount=order_data.discount_amount,
            gst_amount=order_data.gst_amount,
            service_charge=order_data.service_charge,
            final_amount=order_data.final_amount,
            priority=order_data.priority,
            notes=order_data.notes
        )
        
        db.add(new_order)
        await db.flush()  # Get the order ID
        
        # Create order items
        for item_data in order_data.items:
            order_item = OrderItem(
                order_id=new_order.id,
                service_id=item_data.service_id,
                service_name=item_data.service_name,
                variant_id=item_data.variant_id,
                variant_name=item_data.variant_name,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                total_price=item_data.total_price,
                category_id=item_data.category_id,
                subcategory_id=item_data.subcategory_id,
                assigned_engineer_id=item_data.assigned_engineer_id,
                assigned_engineer_name=item_data.assigned_engineer_name,
                item_status=item_data.item_status,
                scheduled_date=item_data.scheduled_date,
                scheduled_time_slot=item_data.scheduled_time_slot,
                item_notes=item_data.item_notes
            )
            db.add(order_item)
        
        await db.commit()
        
        # Reload order with relationships for response
        query = select(Order).options(
            selectinload(Order.items)
        ).where(Order.id == new_order.id)
        result = await db.execute(query)
        order_with_items = result.scalar_one()
        
        logger.info(f"Order {new_order.order_number} created by user {current_user.id}")
        
        # Send order placed notification
        try:
            await notification_service.send_order_notification(
                db=db,
                order_id=str(new_order.id),
                event_type=NotificationEvent.ORDER_PLACED,
                priority=NotificationPriority.HIGH
            )
            logger.info(f"Order placed notification sent for order {new_order.order_number}")
        except Exception as e:
            logger.error(f"Failed to send order placed notification: {e}")
            # Don't fail the order creation if notification fails
        
        return BaseResponse(
            success=True,
            message="Order created successfully",
            data=order_with_items.dict_for_response(include_relationships=True)
        )
        
    except Exception as e:
        logger.error(f"Error creating order: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create order"
        )


@router.get("/", response_model=PaginatedResponse)
async def get_orders(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    filters: OrderFilters = Depends(),
    current_user: User = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db_session)
) -> PaginatedResponse:
    """
    Get paginated list of orders with filtering.
    
    Customers see only their orders, admins see all orders.
    """
    try:
        # Build query
        query = select(Order).options(
            selectinload(Order.items)
        )
        
        # Apply user-based filtering
        if current_user and current_user.role != "admin":
            # Regular users only see their own orders
            query = query.where(Order.customer_id == str(current_user.id))
        
        # Apply filters
        if filters.status:
            query = query.where(Order.status == filters.status)
        
        if filters.priority:
            query = query.where(Order.priority == filters.priority)
            
        if filters.customer_id and (not current_user or current_user.role == "admin"):
            # Only admins can filter by customer_id
            query = query.where(Order.customer_id == filters.customer_id)
        
        if filters.from_date:
            query = query.where(Order.created_at >= filters.from_date)
            
        if filters.to_date:
            query = query.where(Order.created_at <= filters.to_date)
        
        # Get total count
        count_query = select(func.count(Order.id))
        if current_user and current_user.role != "admin":
            count_query = count_query.where(Order.customer_id == str(current_user.id))
        
        total_result = await db.execute(count_query)
        total = total_result.scalar() or 0
        
        # Apply pagination and ordering
        query = query.order_by(desc(Order.created_at))
        query = query.offset((page - 1) * limit).limit(limit)
        
        # Execute query
        result = await db.execute(query)
        orders = result.scalars().all()
        
        # Format response
        orders_data = [
            order.dict_for_response(include_relationships=True) 
            for order in orders
        ]
        
        return PaginatedResponse(
            success=True,
            data=orders_data,
            pagination=PaginationMeta.create(page=page, limit=limit, total=total)
        )
        
    except Exception as e:
        logger.error(f"Error getting orders: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve orders"
        )


@router.get("/{order_id}", response_model=BaseResponse)
async def get_order(
    order_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
) -> BaseResponse:
    """
    Get a specific order by ID.
    
    Users can only access their own orders unless they're admin.
    """
    try:
        # Query order with relationships
        query = select(Order).options(
            selectinload(Order.items)
        ).where(Order.id == order_id)
        
        result = await db.execute(query)
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Check permissions
        if current_user.role != "admin" and order.customer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return BaseResponse(
            success=True,
            data=order.dict_for_response(include_relationships=True)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting order {order_id}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve order"
        )


@router.put("/{order_id}", response_model=BaseResponse)
async def update_order(
    order_id: UUID,
    order_updates: OrderUpdate,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
) -> BaseResponse:
    """
    Update order details (admin only).
    
    Allows updating status, priority, admin notes, and customer feedback.
    """
    try:
        # Get order
        query = select(Order).where(Order.id == order_id)
        result = await db.execute(query)
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Update fields
        if order_updates.status is not None:
            order.status = order_updates.status
            
        if order_updates.priority is not None:
            order.priority = order_updates.priority
            
        if order_updates.admin_notes is not None:
            order.admin_notes = order_updates.admin_notes
            
        if order_updates.customer_rating is not None:
            order.customer_rating = order_updates.customer_rating
            
        if order_updates.customer_review is not None:
            order.customer_review = order_updates.customer_review
        
        await db.commit()
        
        logger.info(f"Order {order.order_number} updated by admin {current_admin.id}")
        
        return BaseResponse(
            success=True,
            message="Order updated successfully",
            data=order.dict_for_response()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating order {order_id}: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update order"
        )


@router.put("/{order_id}/items/{item_id}", response_model=BaseResponse)  
async def update_order_item(
    order_id: UUID,
    item_id: UUID,
    item_updates: OrderItemUpdate,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
) -> BaseResponse:
    """
    Update individual order item (admin only).
    
    Allows updating engineer assignment, status, scheduling, and notes.
    """
    try:
        # Get order item
        query = select(OrderItem).where(
            and_(OrderItem.id == item_id, OrderItem.order_id == order_id)
        )
        result = await db.execute(query)
        item = result.scalar_one_or_none()
        
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order item not found"
            )
        
        # Update fields
        if item_updates.assigned_engineer_id is not None:
            item.assigned_engineer_id = item_updates.assigned_engineer_id
            # Also update engineer name if engineer exists
            if item_updates.assigned_engineer_id:
                engineer_query = select(User).where(User.id == item_updates.assigned_engineer_id)
                engineer_result = await db.execute(engineer_query)
                engineer = engineer_result.scalar_one_or_none()
                if engineer:
                    item.assigned_engineer_name = f"{engineer.first_name} {engineer.last_name}"
            
        if item_updates.item_status is not None:
            item.item_status = item_updates.item_status
            
        if item_updates.scheduled_date is not None:
            item.scheduled_date = item_updates.scheduled_date
            
        if item_updates.scheduled_time_slot is not None:
            item.scheduled_time_slot = item_updates.scheduled_time_slot
            
        if item_updates.item_notes is not None:
            item.item_notes = item_updates.item_notes
            
        if item_updates.item_rating is not None:
            item.item_rating = item_updates.item_rating
            
        if item_updates.item_review is not None:
            item.item_review = item_updates.item_review
        
        # Store original status for notification comparison
        original_status = item.item_status
        
        # Auto-complete item if marked as completed
        if item_updates.item_status == ItemStatus.COMPLETED and not item.completion_date:
            item.completion_date = datetime.utcnow().strftime("%Y-%m-%d")
        
        await db.commit()
        
        logger.info(f"Order item {item_id} updated by admin {current_admin.id}")
        
        # Send notifications for status changes
        try:
            if item_updates.item_status and item_updates.item_status != original_status:
                event_type = None
                
                if item_updates.item_status == ItemStatus.SCHEDULED:
                    event_type = NotificationEvent.SERVICE_SCHEDULED
                elif item_updates.item_status == ItemStatus.IN_PROGRESS:
                    event_type = NotificationEvent.SERVICE_STARTED
                elif item_updates.item_status == ItemStatus.COMPLETED:
                    event_type = NotificationEvent.SERVICE_COMPLETED
                
                if event_type:
                    custom_vars = {}
                    if item_updates.scheduled_date:
                        custom_vars['scheduled_date'] = item_updates.scheduled_date
                    if item_updates.scheduled_time_slot:
                        custom_vars['time_slot'] = item_updates.scheduled_time_slot
                    
                    await notification_service.send_order_notification(
                        db=db,
                        order_id=str(order_id),
                        event_type=event_type,
                        priority=NotificationPriority.NORMAL,
                        custom_variables=custom_vars
                    )
                    logger.info(f"Status change notification sent for item {item_id}: {event_type.value}")
        except Exception as e:
            logger.error(f"Failed to send status change notification: {e}")
            # Don't fail the update if notification fails
        
        return BaseResponse(
            success=True,
            message="Order item updated successfully",
            data=item.dict_for_response()
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating order item {item_id}: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update order item"
        )


@router.post("/{order_id}/items/{item_id}/assign", response_model=BaseResponse)
async def assign_engineer(
    order_id: UUID,
    item_id: UUID,
    assignment: AssignEngineerRequest,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
) -> BaseResponse:
    """
    Assign engineer to specific order item (admin only).
    
    Associates an engineer with an order item for service delivery.
    """
    try:
        # Get order item
        query = select(OrderItem).where(
            and_(OrderItem.id == item_id, OrderItem.order_id == order_id)
        )
        result = await db.execute(query)
        item = result.scalar_one_or_none()
        
        if not item:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order item not found"
            )
        
        # Verify engineer exists
        engineer_query = select(User).where(User.id == assignment.engineer_id)
        engineer_result = await db.execute(engineer_query)
        engineer = engineer_result.scalar_one_or_none()
        
        if not engineer:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Engineer not found"
            )
        
        # Update assignment
        item.assigned_engineer_id = assignment.engineer_id
        item.assigned_engineer_name = f"{engineer.first_name} {engineer.last_name}"
        
        if assignment.notes:
            existing_notes = item.item_notes or ""
            item.item_notes = f"{existing_notes}\nAssigned to {engineer.first_name}: {assignment.notes}".strip()
        
        await db.commit()
        
        logger.info(f"Engineer {assignment.engineer_id} assigned to item {item_id} by admin {current_admin.id}")
        
        # Send engineer assigned notification
        try:
            engineer_phone = getattr(engineer, 'phone', '')  # Get engineer phone if available
            await notification_service.send_engineer_notification(
                db=db,
                order_id=str(order_id),
                order_item_id=str(item_id),
                engineer_id=str(assignment.engineer_id),
                engineer_name=f"{engineer.first_name} {engineer.last_name}",
                engineer_phone=engineer_phone,
                event_type=NotificationEvent.ENGINEER_ASSIGNED,
                priority=NotificationPriority.HIGH
            )
            logger.info(f"Engineer assigned notification sent for item {item_id}")
        except Exception as e:
            logger.error(f"Failed to send engineer assigned notification: {e}")
            # Don't fail the assignment if notification fails
        
        return BaseResponse(
            success=True,
            message=f"Engineer {engineer.first_name} {engineer.last_name} assigned successfully",
            data=item.dict_for_response(include_relationships=True)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error assigning engineer to item {item_id}: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to assign engineer"
        )


@router.delete("/{order_id}", response_model=BaseResponse)
async def delete_order(
    order_id: UUID,
    current_admin: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
) -> BaseResponse:
    """
    Delete order (admin only).
    
    Removes order and all associated items from the database.
    Should only be used for test orders or invalid entries.
    """
    try:
        # Get order
        query = select(Order).where(Order.id == order_id)
        result = await db.execute(query)
        order = result.scalar_one_or_none()
        
        if not order:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Order not found"
            )
        
        # Check if order can be deleted (only pending orders)
        if order.status not in [OrderStatus.PENDING]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Only pending orders can be deleted"
            )
        
        await db.delete(order)
        await db.commit()
        
        logger.info(f"Order {order.order_number} deleted by admin {current_admin.id}")
        
        return BaseResponse(
            success=True,
            message="Order deleted successfully"
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting order {order_id}: {str(e)}")
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete order"
        )