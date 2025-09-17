"""
Main notification service that coordinates all notification providers.

Handles notification sending, template rendering, user preferences,
retry logic, and delivery tracking across multiple providers.
"""

import asyncio
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.orm import selectinload

from .notification_base import NotificationProvider, NotificationMessage, NotificationResult, NotificationConfig
from .mock_notification_provider import MockNotificationProvider
from .twilio_sms_provider import TwilioSMSProvider
from .sendgrid_email_provider import SendGridEmailProvider
from .textlocal_sms_provider import TextLocalSMSProvider
from .teleo_sms_provider import TeleoSMSProvider

from ..models.notification import (
    Notification, NotificationTemplate, UserNotificationPreference, NotificationLog,
    NotificationType, NotificationEvent, NotificationStatus, NotificationPriority
)
from ..models.order import Order, OrderItem
from ..core.logging import get_logger

logger = get_logger(__name__)


class NotificationService:
    """Main notification service coordinating all providers."""
    
    def __init__(self):
        """Initialize notification service with providers."""
        self.providers: Dict[str, NotificationProvider] = {}
        self._initialize_providers()
    
    def _initialize_providers(self) -> None:
        """Initialize all notification providers based on configuration."""
        
        # Mock provider (always available for development)
        mock_config = NotificationConfig.get_mock_config()
        self.providers['mock'] = MockNotificationProvider(mock_config)
        
        # Twilio SMS provider
        twilio_config = NotificationConfig.get_twilio_config()
        if twilio_config.get('enabled'):
            try:
                self.providers['twilio'] = TwilioSMSProvider(twilio_config)
                logger.info("Twilio SMS provider initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Twilio provider: {e}")
        
        # SendGrid email provider
        sendgrid_config = NotificationConfig.get_sendgrid_config()
        if sendgrid_config.get('enabled'):
            try:
                self.providers['sendgrid'] = SendGridEmailProvider(sendgrid_config)
                logger.info("SendGrid email provider initialized")
            except Exception as e:
                logger.error(f"Failed to initialize SendGrid provider: {e}")
        
        # TextLocal SMS provider
        textlocal_config = NotificationConfig.get_textlocal_config()
        if textlocal_config.get('enabled'):
            try:
                self.providers['textlocal'] = TextLocalSMSProvider(textlocal_config)
                logger.info("TextLocal SMS provider initialized")
            except Exception as e:
                logger.error(f"Failed to initialize TextLocal provider: {e}")
        
        # Teleo SMS provider
        teleo_config = NotificationConfig.get_teleo_config()
        if teleo_config.get('enabled'):
            try:
                self.providers['teleo'] = TeleoSMSProvider(teleo_config)
                logger.info("Teleo SMS provider initialized")
            except Exception as e:
                logger.error(f"Failed to initialize Teleo provider: {e}")
        
        logger.info(f"Initialized {len(self.providers)} notification providers: {list(self.providers.keys())}")
    
    async def send_order_notification(
        self,
        db: AsyncSession,
        order_id: str,
        event_type: NotificationEvent,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        custom_variables: Optional[Dict[str, str]] = None,
        force_send: bool = False
    ) -> List[NotificationResult]:
        """Send notification for an order event."""
        
        try:
            # Get order with items
            query = select(Order).options(
                selectinload(Order.items)
            ).where(Order.id == order_id)
            result = await db.execute(query)
            order = result.scalar_one_or_none()
            
            if not order:
                logger.error(f"Order not found: {order_id}")
                return []
            
            # Get user preferences
            prefs_query = select(UserNotificationPreference).where(
                UserNotificationPreference.user_id == order.customer_id
            )
            prefs_result = await db.execute(prefs_query)
            user_prefs = prefs_result.scalar_one_or_none()
            
            # Prepare template variables
            template_vars = self._prepare_order_template_variables(order, custom_variables)
            
            # Send notifications
            results = []
            
            # Send SMS if enabled
            if not user_prefs or user_prefs.should_send_notification(event_type, NotificationType.SMS):
                sms_result = await self._send_notification(
                    db=db,
                    recipient_phone=order.customer_phone,
                    recipient_email=None,
                    recipient_name=order.customer_name,
                    customer_id=order.customer_id,
                    notification_type=NotificationType.SMS,
                    event_type=event_type,
                    priority=priority,
                    template_variables=template_vars,
                    order=order,
                    force_send=force_send
                )
                if sms_result:
                    results.append(sms_result)
            
            # Send email if enabled
            if not user_prefs or user_prefs.should_send_notification(event_type, NotificationType.EMAIL):
                email_result = await self._send_notification(
                    db=db,
                    recipient_phone=None,
                    recipient_email=order.customer_email,
                    recipient_name=order.customer_name,
                    customer_id=order.customer_id,
                    notification_type=NotificationType.EMAIL,
                    event_type=event_type,
                    priority=priority,
                    template_variables=template_vars,
                    order=order,
                    force_send=force_send
                )
                if email_result:
                    results.append(email_result)
            
            return results
            
        except Exception as e:
            logger.error(f"Error sending order notification: {e}")
            return []
    
    async def send_engineer_notification(
        self,
        db: AsyncSession,
        order_id: str,
        order_item_id: str,
        engineer_id: str,
        engineer_name: str,
        engineer_phone: str,
        event_type: NotificationEvent,
        priority: NotificationPriority = NotificationPriority.NORMAL,
        custom_variables: Optional[Dict[str, str]] = None
    ) -> List[NotificationResult]:
        """Send notification about engineer assignment or updates."""
        
        try:
            # Get order and item
            query = select(Order).options(
                selectinload(Order.items)
            ).where(Order.id == order_id)
            result = await db.execute(query)
            order = result.scalar_one_or_none()
            
            if not order:
                logger.error(f"Order not found: {order_id}")
                return []
            
            # Find the specific item
            order_item = next((item for item in order.items if str(item.id) == order_item_id), None)
            if not order_item:
                logger.error(f"Order item not found: {order_item_id}")
                return []
            
            # Prepare template variables
            template_vars = self._prepare_engineer_template_variables(
                order, order_item, engineer_name, engineer_phone, custom_variables
            )
            
            # Send notification to customer
            return await self.send_order_notification(
                db=db,
                order_id=order_id,
                event_type=event_type,
                priority=priority,
                custom_variables=template_vars,
                force_send=True  # Engineer notifications are important
            )
            
        except Exception as e:
            logger.error(f"Error sending engineer notification: {e}")
            return []
    
    async def _send_notification(
        self,
        db: AsyncSession,
        recipient_phone: Optional[str],
        recipient_email: Optional[str],
        recipient_name: str,
        customer_id: str,
        notification_type: NotificationType,
        event_type: NotificationEvent,
        priority: NotificationPriority,
        template_variables: Dict[str, str],
        order: Optional[Order] = None,
        force_send: bool = False
    ) -> Optional[NotificationResult]:
        """Send a single notification."""
        
        try:
            # Get template
            template_query = select(NotificationTemplate).where(
                NotificationTemplate.event_type == event_type,
                NotificationTemplate.notification_type == notification_type,
                NotificationTemplate.is_active == True
            )
            template_result = await db.execute(template_query)
            template = template_result.scalar_one_or_none()
            
            if not template:
                logger.warning(f"No template found for {event_type.value} + {notification_type.value}")
                return None
            
            # Render template
            try:
                rendered = template.render_template(template_variables)
            except Exception as e:
                logger.error(f"Template rendering failed: {e}")
                return None
            
            # Create notification record
            notification = Notification(
                customer_id=customer_id,
                customer_name=recipient_name,
                customer_phone=recipient_phone,
                customer_email=recipient_email,
                notification_type=notification_type,
                event_type=event_type,
                priority=priority,
                subject=rendered.get('subject'),
                message=rendered['message'],
                order_id=order.id if order else None,
                order_number=order.order_number if order else None,
                template_id=template.id,
                status=NotificationStatus.PENDING,
                scheduled_at=datetime.utcnow()
            )
            
            db.add(notification)
            await db.flush()  # Get ID
            
            # Send via appropriate provider
            provider_name = self._get_provider_for_notification(notification_type)
            if not provider_name:
                notification.status = NotificationStatus.FAILED
                notification.error_message = f"No provider available for {notification_type.value}"
                await db.commit()
                return None
            
            provider = self.providers[provider_name]
            
            # Prepare message
            message = NotificationMessage(
                recipient_phone=recipient_phone,
                recipient_email=recipient_email,
                recipient_name=recipient_name,
                subject=rendered.get('subject'),
                message=rendered['message'],
                notification_type=notification_type,
                event_type=event_type,
                extra_data={
                    "notification_id": str(notification.id),
                    "order_number": order.order_number if order else None,
                    "customer_id": customer_id
                }
            )
            
            # Log send attempt
            log_entry = NotificationLog(
                notification_id=notification.id,
                action="send_attempt",
                logged_at=datetime.utcnow()
            )
            db.add(log_entry)
            
            # Send notification
            start_time = datetime.utcnow()
            
            if notification_type == NotificationType.SMS:
                result = provider.send_sms(message)
            elif notification_type == NotificationType.EMAIL:
                result = provider.send_email(message)
            else:
                result = NotificationResult(
                    success=False,
                    error_message=f"Unsupported notification type: {notification_type.value}"
                )
            
            end_time = datetime.utcnow()
            processing_time = int((end_time - start_time).total_seconds() * 1000)
            
            # Update notification status
            if result.success:
                notification.status = NotificationStatus.SENT
                notification.sent_at = datetime.utcnow()
                notification.provider = provider_name
                notification.provider_message_id = result.provider_message_id
                notification.extra_data = result.extra_data
            else:
                notification.status = NotificationStatus.FAILED
                notification.error_message = result.error_message
                notification.retry_count += 1
            
            # Update log entry
            log_entry.status_code = result.status_code
            log_entry.provider_response = result.extra_data
            log_entry.error_details = result.error_message if not result.success else None
            log_entry.processing_time_ms = processing_time
            
            await db.commit()
            
            logger.info(f"Notification {notification.id} {'sent' if result.success else 'failed'} via {provider_name}")
            
            return result
            
        except Exception as e:
            logger.error(f"Error sending notification: {e}")
            return None
    
    def _get_provider_for_notification(self, notification_type: NotificationType) -> Optional[str]:
        """Get the best available provider for a notification type."""
        
        if notification_type == NotificationType.SMS:
            # Priority order: Twilio (international) -> TextLocal (India) -> Teleo (India) -> Mock (dev)
            priority_order = ['twilio', 'textlocal', 'teleo', 'mock']
            for provider_name in priority_order:
                if provider_name in self.providers:
                    return provider_name
        
        elif notification_type == NotificationType.EMAIL:
            # Prefer SendGrid, fallback to mock
            if 'sendgrid' in self.providers:
                return 'sendgrid'
            elif 'mock' in self.providers:
                return 'mock'
        
        return None
    
    def _prepare_order_template_variables(
        self, 
        order: Order, 
        custom_variables: Optional[Dict[str, str]] = None
    ) -> Dict[str, str]:
        """Prepare template variables for order notifications."""
        
        # Build service names list
        service_names = ", ".join([item.service_name for item in order.items])
        
        # Prepare service address
        addr = order.service_address
        service_address = f"{addr.get('house_number', '')}, {addr.get('area', '')}, {addr.get('city', '')}"
        
        variables = {
            'customer_name': order.customer_name,
            'order_number': order.order_number,
            'service_names': service_names,
            'final_amount': str(int(order.final_amount)),
            'total_amount': str(int(order.total_amount)),
            'service_address': service_address,
            'order_date': order.created_at.strftime('%d %b %Y'),
            'item_count': str(len(order.items))
        }
        
        # Add custom variables
        if custom_variables:
            variables.update(custom_variables)
        
        return variables
    
    def _prepare_engineer_template_variables(
        self, 
        order: Order, 
        order_item: OrderItem,
        engineer_name: str,
        engineer_phone: str,
        custom_variables: Optional[Dict[str, str]] = None
    ) -> Dict[str, str]:
        """Prepare template variables for engineer notifications."""
        
        variables = self._prepare_order_template_variables(order, custom_variables)
        
        # Add engineer-specific variables
        variables.update({
            'engineer_name': engineer_name,
            'engineer_phone': engineer_phone,
            'service_name': order_item.service_name,
            'scheduled_date': order_item.scheduled_date or 'TBD',
            'time_slot': order_item.scheduled_time_slot or 'TBD'
        })
        
        return variables
    
    async def retry_failed_notifications(self, db: AsyncSession) -> int:
        """Retry failed notifications that haven't exceeded max retries."""
        
        try:
            # Get failed notifications that can be retried
            cutoff_time = datetime.utcnow() - timedelta(minutes=30)  # Don't retry too recent failures
            
            query = select(Notification).where(
                Notification.status == NotificationStatus.FAILED,
                Notification.retry_count < Notification.max_retries,
                Notification.updated_at < cutoff_time
            )
            result = await db.execute(query)
            failed_notifications = result.scalars().all()
            
            retried_count = 0
            
            for notification in failed_notifications:
                # Attempt retry
                provider_name = self._get_provider_for_notification(notification.notification_type)
                if not provider_name:
                    continue
                
                provider = self.providers[provider_name]
                
                message = NotificationMessage(
                    recipient_phone=notification.customer_phone,
                    recipient_email=notification.customer_email,
                    recipient_name=notification.customer_name,
                    subject=notification.subject,
                    message=notification.message,
                    notification_type=notification.notification_type,
                    event_type=notification.event_type,
                    extra_data={"notification_id": str(notification.id), "retry": True}
                )
                
                # Send notification
                if notification.notification_type == NotificationType.SMS:
                    result = provider.send_sms(message)
                elif notification.notification_type == NotificationType.EMAIL:
                    result = provider.send_email(message)
                else:
                    continue
                
                # Update notification
                if result.success:
                    notification.status = NotificationStatus.SENT
                    notification.sent_at = datetime.utcnow()
                    notification.provider = provider_name
                    notification.provider_message_id = result.provider_message_id
                    notification.error_message = None
                    retried_count += 1
                else:
                    notification.retry_count += 1
                    notification.error_message = result.error_message
                
                # Log retry attempt
                log_entry = NotificationLog(
                    notification_id=notification.id,
                    action="retry_attempt",
                    status_code=result.status_code,
                    provider_response=result.metadata,
                    error_details=result.error_message if not result.success else None,
                    logged_at=datetime.utcnow()
                )
                db.add(log_entry)
            
            await db.commit()
            
            logger.info(f"Retried {retried_count} failed notifications")
            return retried_count
            
        except Exception as e:
            logger.error(f"Error retrying failed notifications: {e}")
            return 0


# Global notification service instance
notification_service = NotificationService()