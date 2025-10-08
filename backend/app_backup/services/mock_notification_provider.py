"""
Mock notification provider for development and testing.

Simulates SMS and email sending without actually sending messages.
Useful for development, testing, and demo environments.
"""

import time
import random
import uuid
from typing import Dict, Any
from datetime import datetime

from .notification_base import NotificationProvider, NotificationMessage, NotificationResult
from ..core.logging import get_logger

logger = get_logger(__name__)


class MockNotificationProvider(NotificationProvider):
    """Mock notification provider that simulates sending without actual delivery."""
    
    def validate_config(self) -> None:
        """Validate mock provider configuration."""
        # Mock provider doesn't need validation
        pass
    
    def send_sms(self, message: NotificationMessage) -> NotificationResult:
        """Simulate sending SMS."""
        logger.info(f"📱 [MOCK SMS] To: {message.recipient_phone}")
        logger.info(f"📱 [MOCK SMS] Message: {message.message[:100]}...")
        
        # Simulate processing delay
        time.sleep(0.1)
        
        # Simulate occasional failures if configured
        if self._should_simulate_failure():
            return NotificationResult(
                success=False,
                error_message="Mock simulated SMS failure",
                status_code=400,
                extra_data={
                    "provider": "mock",
                    "simulated_failure": True,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        # Generate mock message ID
        mock_message_id = f"mock_sms_{uuid.uuid4().hex[:12]}"
        
        return NotificationResult(
            success=True,
            provider_message_id=mock_message_id,
            status_code=200,
            extra_data={
                "provider": "mock",
                "recipient": message.recipient_phone,
                "message_length": len(message.message),
                "timestamp": datetime.utcnow().isoformat(),
                "event_type": message.event_type.value
            }
        )
    
    def send_email(self, message: NotificationMessage) -> NotificationResult:
        """Simulate sending email."""
        logger.info(f"📧 [MOCK EMAIL] To: {message.recipient_email}")
        logger.info(f"📧 [MOCK EMAIL] Subject: {message.subject}")
        logger.info(f"📧 [MOCK EMAIL] Message: {message.message[:100]}...")
        
        # Simulate processing delay
        time.sleep(0.2)
        
        # Simulate occasional failures if configured
        if self._should_simulate_failure():
            return NotificationResult(
                success=False,
                error_message="Mock simulated email failure",
                status_code=400,
                extra_data={
                    "provider": "mock",
                    "simulated_failure": True,
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        # Generate mock message ID
        mock_message_id = f"mock_email_{uuid.uuid4().hex[:12]}"
        
        return NotificationResult(
            success=True,
            provider_message_id=mock_message_id,
            status_code=200,
            extra_data={
                "provider": "mock",
                "recipient": message.recipient_email,
                "subject": message.subject,
                "message_length": len(message.message),
                "timestamp": datetime.utcnow().isoformat(),
                "event_type": message.event_type.value
            }
        )
    
    def get_delivery_status(self, provider_message_id: str) -> NotificationResult:
        """Simulate getting delivery status."""
        logger.info(f"📊 [MOCK STATUS] Checking status for: {provider_message_id}")
        
        # Simulate processing delay
        time.sleep(0.1)
        
        # Mock delivery status - usually successful
        if random.random() < 0.95:  # 95% success rate
            return NotificationResult(
                success=True,
                extra_data={
                    "provider": "mock",
                    "message_id": provider_message_id,
                    "delivery_status": "delivered",
                    "delivered_at": datetime.utcnow().isoformat(),
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        else:
            return NotificationResult(
                success=False,
                error_message="Mock simulated delivery failure",
                extra_data={
                    "provider": "mock",
                    "message_id": provider_message_id,
                    "delivery_status": "failed",
                    "error_reason": "Mock network timeout",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    def _should_simulate_failure(self) -> bool:
        """Determine if we should simulate a failure."""
        if not self.config.get('simulate_failures', False):
            return False
        
        failure_rate = self.config.get('failure_rate', 0.1)
        return random.random() < failure_rate