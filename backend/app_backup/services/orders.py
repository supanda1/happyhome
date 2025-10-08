"""
Order service for handling order-related business logic.

This module provides business logic for order operations including:
- Order creation and validation
- Order status management
- Order calculations (pricing, totals, GST)
- Engineer assignment logic
- Order filtering and search
"""

from datetime import datetime
from decimal import Decimal
from typing import Dict, List, Optional, Tuple
from uuid import UUID

from sqlalchemy import and_, desc, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from sqlalchemy.future import select

from ..core.logging import get_logger
from ..models.order import Order, OrderItem, OrderStatus, OrderPriority, ItemStatus
from ..models.service import Service, ServiceCategory, ServiceSubcategory, ServiceVariant
from ..models.user import User
from ..schemas.order import OrderCreate, OrderItemCreate

logger = get_logger(__name__)


class OrderService:
    """Service class for order-related business operations."""
    
    @staticmethod
    async def create_order(
        order_data: OrderCreate,
        current_user: User,
        db: AsyncSession
    ) -> Tuple[Order, str]:
        """
        Create a new order with business validation.
        
        Args:
            order_data: Order creation data
            current_user: User creating the order
            db: Database session
            
        Returns:
            Tuple of (created_order, success_message)
            
        Raises:
            ValueError: If validation fails
        """
        try:
            # Validate customer permissions
            if current_user.role != "admin" and order_data.customer_id != current_user.id:
                raise ValueError("You can only create orders for yourself")
            
            # Validate customer exists
            customer_query = select(User).where(User.id == order_data.customer_id)
            customer_result = await db.execute(customer_query)
            customer = customer_result.scalar_one_or_none()
            
            if not customer:
                raise ValueError("Customer not found")
            
            # Validate services and calculate totals
            validated_items = await OrderService._validate_order_items(order_data.items, db)
            calculated_totals = OrderService._calculate_order_totals(validated_items, order_data)
            
            # Create order
            new_order = Order(
                order_number=Order().generate_order_number(),
                customer_id=order_data.customer_id,
                customer_name=order_data.customer_name,
                customer_phone=order_data.customer_phone,
                customer_email=order_data.customer_email,
                service_address=order_data.service_address.dict(),
                total_amount=calculated_totals["total_amount"],
                discount_amount=calculated_totals["discount_amount"],
                gst_amount=calculated_totals["gst_amount"],
                service_charge=calculated_totals["service_charge"],
                final_amount=calculated_totals["final_amount"],
                priority=order_data.priority,
                notes=order_data.notes
            )
            
            db.add(new_order)
            await db.flush()  # Get the order ID
            
            # Create order items
            for item_data in validated_items:
                order_item = OrderItem(
                    order_id=new_order.id,
                    service_id=item_data["service_id"],
                    service_name=item_data["service_name"],
                    variant_id=item_data.get("variant_id"),
                    variant_name=item_data.get("variant_name"),
                    quantity=item_data["quantity"],
                    unit_price=item_data["unit_price"],
                    total_price=item_data["total_price"],
                    category_id=item_data["category_id"],
                    subcategory_id=item_data["subcategory_id"],
                    assigned_engineer_id=item_data.get("assigned_engineer_id"),
                    assigned_engineer_name=item_data.get("assigned_engineer_name"),
                    item_status=item_data.get("item_status", ItemStatus.PENDING),
                    scheduled_date=item_data.get("scheduled_date"),
                    scheduled_time_slot=item_data.get("scheduled_time_slot"),
                    item_notes=item_data.get("item_notes")
                )
                db.add(order_item)
            
            await db.commit()
            
            logger.info(f"Order {new_order.order_number} created successfully by user {current_user.id}")
            
            return new_order, f"Order {new_order.order_number} created successfully"
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error creating order: {str(e)}")
            await db.rollback()
            raise ValueError(f"Failed to create order: {str(e)}")
    
    @staticmethod 
    async def _validate_order_items(
        items: List[OrderItemCreate],
        db: AsyncSession
    ) -> List[Dict]:
        """
        Validate order items and enrich with service data.
        
        Args:
            items: List of order items to validate
            db: Database session
            
        Returns:
            List of validated and enriched item data
            
        Raises:
            ValueError: If validation fails
        """
        validated_items = []
        
        for item in items:
            # Validate service exists
            service_query = select(Service).options(
                selectinload(Service.category),
                selectinload(Service.subcategory)
            ).where(Service.id == item.service_id)
            
            service_result = await db.execute(service_query)
            service = service_result.scalar_one_or_none()
            
            if not service:
                raise ValueError(f"Service with ID {item.service_id} not found")
            
            if not service.is_active:
                raise ValueError(f"Service '{service.name}' is not available")
            
            # Validate variant if provided
            variant = None
            if item.variant_id:
                variant_query = select(ServiceVariant).where(
                    and_(
                        ServiceVariant.id == item.variant_id,
                        ServiceVariant.service_id == item.service_id
                    )
                )
                variant_result = await db.execute(variant_query)
                variant = variant_result.scalar_one_or_none()
                
                if not variant:
                    raise ValueError(f"Service variant with ID {item.variant_id} not found")
                
                if not variant.is_active:
                    raise ValueError(f"Service variant '{variant.name}' is not available")
            
            # Validate engineer if assigned
            if item.assigned_engineer_id:
                engineer_query = select(User).where(
                    and_(
                        User.id == item.assigned_engineer_id,
                        User.role == "engineer"
                    )
                )
                engineer_result = await db.execute(engineer_query)
                engineer = engineer_result.scalar_one_or_none()
                
                if not engineer:
                    raise ValueError(f"Engineer with ID {item.assigned_engineer_id} not found")
            
            # Build validated item data
            validated_item = {
                "service_id": item.service_id,
                "service_name": service.name,
                "variant_id": item.variant_id,
                "variant_name": variant.name if variant else None,
                "quantity": item.quantity,
                "unit_price": variant.price if variant else service.base_price,
                "total_price": item.quantity * (variant.price if variant else service.base_price),
                "category_id": service.category_id,
                "subcategory_id": service.subcategory_id,
                "assigned_engineer_id": item.assigned_engineer_id,
                "assigned_engineer_name": item.assigned_engineer_name,
                "item_status": item.item_status,
                "scheduled_date": item.scheduled_date,
                "scheduled_time_slot": item.scheduled_time_slot,
                "item_notes": item.item_notes
            }
            
            validated_items.append(validated_item)
        
        return validated_items
    
    @staticmethod
    def _calculate_order_totals(
        validated_items: List[Dict],
        order_data: OrderCreate
    ) -> Dict[str, float]:
        """
        Calculate order totals with GST and service charges.
        
        Args:
            validated_items: List of validated order items
            order_data: Original order data
            
        Returns:
            Dictionary with calculated totals
        """
        # Calculate subtotal from items
        subtotal = sum(item["total_price"] for item in validated_items)
        
        # Use provided amounts or calculate defaults
        total_amount = order_data.total_amount or subtotal
        discount_amount = order_data.discount_amount or 0.0
        
        # Calculate GST (default 18% on services)
        gst_rate = 0.18
        taxable_amount = total_amount - discount_amount
        gst_amount = order_data.gst_amount or round(taxable_amount * gst_rate, 2)
        
        # Calculate service charge (default 2% of taxable amount)
        service_charge_rate = 0.02
        service_charge = order_data.service_charge or round(taxable_amount * service_charge_rate, 2)
        
        # Calculate final amount
        final_amount = total_amount + gst_amount + service_charge - discount_amount
        
        return {
            "total_amount": total_amount,
            "discount_amount": discount_amount,
            "gst_amount": gst_amount,
            "service_charge": service_charge,
            "final_amount": max(0, final_amount)  # Ensure non-negative
        }
    
    @staticmethod
    async def assign_engineer_to_item(
        order_id: UUID,
        item_id: UUID,
        engineer_id: UUID,
        notes: Optional[str],
        current_admin: User,
        db: AsyncSession
    ) -> Tuple[OrderItem, str]:
        """
        Assign engineer to specific order item.
        
        Args:
            order_id: Order ID
            item_id: Order item ID
            engineer_id: Engineer to assign
            notes: Assignment notes
            current_admin: Admin performing assignment
            db: Database session
            
        Returns:
            Tuple of (updated_item, success_message)
            
        Raises:
            ValueError: If validation fails
        """
        try:
            # Get order item
            item_query = select(OrderItem).where(
                and_(OrderItem.id == item_id, OrderItem.order_id == order_id)
            )
            item_result = await db.execute(item_query)
            item = item_result.scalar_one_or_none()
            
            if not item:
                raise ValueError("Order item not found")
            
            # Verify engineer exists and is active
            engineer_query = select(User).where(
                and_(
                    User.id == engineer_id,
                    User.role == "engineer",
                    User.is_active == True
                )
            )
            engineer_result = await db.execute(engineer_query)
            engineer = engineer_result.scalar_one_or_none()
            
            if not engineer:
                raise ValueError("Engineer not found or inactive")
            
            # Update assignment
            item.assigned_engineer_id = engineer_id
            item.assigned_engineer_name = f"{engineer.first_name} {engineer.last_name}"
            
            # Update status to scheduled if still pending
            if item.item_status == ItemStatus.PENDING:
                item.item_status = ItemStatus.SCHEDULED
            
            # Add assignment notes
            if notes:
                existing_notes = item.item_notes or ""
                timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
                assignment_note = f"[{timestamp}] Assigned to {engineer.first_name}: {notes}"
                item.item_notes = f"{existing_notes}\n{assignment_note}".strip()
            
            await db.commit()
            
            logger.info(f"Engineer {engineer_id} assigned to item {item_id} by admin {current_admin.id}")
            
            return item, f"Engineer {engineer.first_name} {engineer.last_name} assigned successfully"
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error assigning engineer to item {item_id}: {str(e)}")
            await db.rollback()
            raise ValueError(f"Failed to assign engineer: {str(e)}")
    
    @staticmethod
    async def update_order_status(
        order_id: UUID,
        new_status: OrderStatus,
        admin_notes: Optional[str],
        current_admin: User,
        db: AsyncSession
    ) -> Tuple[Order, str]:
        """
        Update order status with business logic validation.
        
        Args:
            order_id: Order to update
            new_status: New status
            admin_notes: Admin notes
            current_admin: Admin performing update
            db: Database session
            
        Returns:
            Tuple of (updated_order, message)
            
        Raises:
            ValueError: If status transition is invalid
        """
        try:
            # Get order with items
            order_query = select(Order).options(
                selectinload(Order.items)
            ).where(Order.id == order_id)
            
            order_result = await db.execute(order_query)
            order = order_result.scalar_one_or_none()
            
            if not order:
                raise ValueError("Order not found")
            
            # Validate status transition
            OrderService._validate_status_transition(order.status, new_status, order)
            
            # Update order
            old_status = order.status
            order.status = new_status
            
            if admin_notes:
                existing_notes = order.admin_notes or ""
                timestamp = datetime.utcnow().strftime("%Y-%m-%d %H:%M")
                new_note = f"[{timestamp}] Status changed from {old_status} to {new_status}: {admin_notes}"
                order.admin_notes = f"{existing_notes}\n{new_note}".strip()
            
            # Auto-update item statuses based on order status
            if new_status == OrderStatus.CANCELLED:
                for item in order.items:
                    if item.item_status not in [ItemStatus.COMPLETED, ItemStatus.CANCELLED]:
                        item.item_status = ItemStatus.CANCELLED
            
            await db.commit()
            
            logger.info(f"Order {order.order_number} status updated to {new_status} by admin {current_admin.id}")
            
            return order, f"Order status updated to {new_status.value}"
            
        except ValueError:
            raise
        except Exception as e:
            logger.error(f"Error updating order status: {str(e)}")
            await db.rollback()
            raise ValueError(f"Failed to update order status: {str(e)}")
    
    @staticmethod
    def _validate_status_transition(
        current_status: OrderStatus,
        new_status: OrderStatus,
        order: Order
    ) -> None:
        """
        Validate if status transition is allowed.
        
        Args:
            current_status: Current order status
            new_status: Desired new status
            order: Order instance for additional validation
            
        Raises:
            ValueError: If transition is not allowed
        """
        # Define allowed transitions
        allowed_transitions = {
            OrderStatus.PENDING: [OrderStatus.SCHEDULED, OrderStatus.CANCELLED],
            OrderStatus.SCHEDULED: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED, OrderStatus.POSTPONED],
            OrderStatus.IN_PROGRESS: [OrderStatus.COMPLETED, OrderStatus.CANCELLED],
            OrderStatus.COMPLETED: [],  # No transitions from completed
            OrderStatus.CANCELLED: [OrderStatus.PENDING],  # Can reopen cancelled orders
            OrderStatus.POSTPONED: [OrderStatus.SCHEDULED, OrderStatus.CANCELLED]
        }
        
        if new_status not in allowed_transitions.get(current_status, []):
            raise ValueError(
                f"Invalid status transition from {current_status.value} to {new_status.value}"
            )
        
        # Additional business rules
        if new_status == OrderStatus.COMPLETED:
            # All items must be completed
            incomplete_items = [
                item for item in order.items 
                if item.item_status != ItemStatus.COMPLETED
            ]
            if incomplete_items:
                raise ValueError("Cannot complete order with incomplete items")
    
    @staticmethod
    async def get_order_statistics(
        customer_id: Optional[UUID],
        db: AsyncSession
    ) -> Dict[str, any]:
        """
        Get order statistics for dashboard.
        
        Args:
            customer_id: Filter by customer (None for all)
            db: Database session
            
        Returns:
            Dictionary with order statistics
        """
        try:
            # Base query
            query = select(Order)
            if customer_id:
                query = query.where(Order.customer_id == customer_id)
            
            # Get all orders
            result = await db.execute(query)
            orders = result.scalars().all()
            
            if not orders:
                return {
                    "total_orders": 0,
                    "pending_orders": 0,
                    "in_progress_orders": 0,
                    "completed_orders": 0,
                    "cancelled_orders": 0,
                    "total_revenue": 0.0,
                    "average_order_value": 0.0,
                    "total_items": 0,
                    "completion_rate": 0.0
                }
            
            # Calculate statistics
            total_orders = len(orders)
            pending_orders = len([o for o in orders if o.status == OrderStatus.PENDING])
            in_progress_orders = len([o for o in orders if o.status == OrderStatus.IN_PROGRESS])
            completed_orders = len([o for o in orders if o.status == OrderStatus.COMPLETED])
            cancelled_orders = len([o for o in orders if o.status == OrderStatus.CANCELLED])
            
            total_revenue = sum(o.final_amount for o in orders if o.status == OrderStatus.COMPLETED)
            average_order_value = total_revenue / completed_orders if completed_orders > 0 else 0.0
            
            total_items = sum(o.total_items for o in orders)
            completion_rate = (completed_orders / total_orders * 100) if total_orders > 0 else 0.0
            
            return {
                "total_orders": total_orders,
                "pending_orders": pending_orders,
                "in_progress_orders": in_progress_orders,
                "completed_orders": completed_orders,
                "cancelled_orders": cancelled_orders,
                "total_revenue": round(total_revenue, 2),
                "average_order_value": round(average_order_value, 2),
                "total_items": total_items,
                "completion_rate": round(completion_rate, 2)
            }
            
        except Exception as e:
            logger.error(f"Error getting order statistics: {str(e)}")
            raise ValueError(f"Failed to get order statistics: {str(e)}")