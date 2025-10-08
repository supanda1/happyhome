"""
Base notification service interface and configuration.

Defines the abstract base class for all notification providers
and common configuration management.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from enum import Enum
import os
from dataclasses import dataclass

from ..models.notification import NotificationType, NotificationEvent


@dataclass
class NotificationResult:
    """Result of a notification send attempt."""
    success: bool
    provider_message_id: Optional[str] = None
    error_message: Optional[str] = None
    status_code: Optional[int] = None
    extra_data: Optional[Dict[str, Any]] = None


@dataclass
class NotificationMessage:
    """Structured notification message."""
    recipient_phone: Optional[str] = None
    recipient_email: Optional[str] = None
    recipient_name: str = ""
    subject: Optional[str] = None
    message: str = ""
    notification_type: NotificationType = NotificationType.SMS
    event_type: NotificationEvent = NotificationEvent.ORDER_PLACED
    extra_data: Optional[Dict[str, Any]] = None


class NotificationProvider(ABC):
    """Abstract base class for all notification providers."""
    
    def __init__(self, config: Dict[str, Any]):
        """Initialize provider with configuration."""
        self.config = config
        self.validate_config()
    
    @abstractmethod
    def validate_config(self) -> None:
        """Validate provider configuration."""
        pass
    
    @abstractmethod
    def send_sms(self, message: NotificationMessage) -> NotificationResult:
        """Send SMS notification."""
        pass
    
    @abstractmethod
    def send_email(self, message: NotificationMessage) -> NotificationResult:
        """Send email notification."""
        pass
    
    @abstractmethod
    def get_delivery_status(self, provider_message_id: str) -> NotificationResult:
        """Get delivery status for a sent message."""
        pass


class NotificationConfig:
    """Notification service configuration manager."""
    
    @staticmethod
    def get_twilio_config() -> Dict[str, Any]:
        """Get Twilio SMS configuration."""
        return {
            'account_sid': os.getenv('TWILIO_ACCOUNT_SID', 'demo_account_sid'),
            'auth_token': os.getenv('TWILIO_AUTH_TOKEN', 'demo_auth_token'),
            'from_number': os.getenv('TWILIO_FROM_NUMBER', '+1234567890'),
            'enabled': os.getenv('TWILIO_ENABLED', 'false').lower() == 'true'
        }
    
    @staticmethod
    def get_sendgrid_config() -> Dict[str, Any]:
        """Get SendGrid email configuration."""
        return {
            'api_key': os.getenv('SENDGRID_API_KEY', 'demo_api_key'),
            'from_email': os.getenv('SENDGRID_FROM_EMAIL', 'noreply@happyhomes.com'),
            'from_name': os.getenv('SENDGRID_FROM_NAME', 'Happy Homes'),
            'enabled': os.getenv('SENDGRID_ENABLED', 'false').lower() == 'true'
        }
    
    @staticmethod
    def get_aws_sns_config() -> Dict[str, Any]:
        """Get AWS SNS configuration."""
        return {
            'aws_access_key_id': os.getenv('AWS_ACCESS_KEY_ID', 'demo_key'),
            'aws_secret_access_key': os.getenv('AWS_SECRET_ACCESS_KEY', 'demo_secret'),
            'region_name': os.getenv('AWS_REGION', 'us-east-1'),
            'enabled': os.getenv('AWS_SNS_ENABLED', 'false').lower() == 'true'
        }
    
    @staticmethod
    def get_textlocal_config() -> Dict[str, Any]:
        """Get TextLocal SMS configuration."""
        return {
            'api_key': os.getenv('TEXTLOCAL_API_KEY', 'demo_api_key'),
            'sender': os.getenv('TEXTLOCAL_SENDER', 'DEMO'),
            'use_hash_auth': os.getenv('TEXTLOCAL_USE_HASH_AUTH', 'false').lower() == 'true',
            'username': os.getenv('TEXTLOCAL_USERNAME', ''),
            'hash_key': os.getenv('TEXTLOCAL_HASH_KEY', ''),
            'base_url': os.getenv('TEXTLOCAL_BASE_URL', 'https://api.textlocal.in/send/'),
            'enabled': os.getenv('TEXTLOCAL_ENABLED', 'false').lower() == 'true'
        }
    
    @staticmethod
    def get_teleo_config() -> Dict[str, Any]:
        """Get Teleo SMS configuration."""
        return {
            'username': os.getenv('TELEO_USERNAME', 'demo_username'),
            'password': os.getenv('TELEO_PASSWORD', 'demo_password'),
            'sender_id': os.getenv('TELEO_SENDER_ID', 'DEMO'),
            'base_url': os.getenv('TELEO_BASE_URL', 'http://sms.teleo.in/api/smsapi.aspx'),
            'status_url': os.getenv('TELEO_STATUS_URL', 'http://sms.teleo.in/api/dlr.aspx'),
            'balance_url': os.getenv('TELEO_BALANCE_URL', 'http://sms.teleo.in/api/balance.aspx'),
            'message_type': os.getenv('TELEO_MESSAGE_TYPE', '1'),  # 1 = Normal, 2 = Flash
            'dlr': os.getenv('TELEO_DLR', '1'),  # 1 = Request DLR, 0 = No DLR
            'enabled': os.getenv('TELEO_ENABLED', 'false').lower() == 'true'
        }
    
    @staticmethod
    def get_mock_config() -> Dict[str, Any]:
        """Get mock provider configuration for development."""
        return {
            'enabled': True,
            'simulate_failures': os.getenv('MOCK_SIMULATE_FAILURES', 'false').lower() == 'true',
            'failure_rate': float(os.getenv('MOCK_FAILURE_RATE', '0.1'))
        }