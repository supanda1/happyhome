"""
TextLocal SMS notification provider for Indian market.

TextLocal is a popular SMS service provider in India with competitive pricing
and reliable delivery for domestic SMS campaigns.
"""

import requests
import urllib.parse
import hashlib
from typing import Dict, Any
from datetime import datetime

from .notification_base import NotificationProvider, NotificationMessage, NotificationResult
from ..core.logging import get_logger

logger = get_logger(__name__)


class TextLocalSMSProvider(NotificationProvider):
    """TextLocal SMS provider for Indian phone numbers."""
    
    def validate_config(self) -> None:
        """Validate TextLocal configuration."""
        required_fields = ['api_key', 'sender']
        for field in required_fields:
            if not self.config.get(field):
                raise ValueError(f"TextLocal configuration missing required field: {field}")
        
        # Validate sender ID format (6 characters max for India)
        sender = self.config.get('sender', '')
        if len(sender) > 6:
            raise ValueError("TextLocal sender ID must be 6 characters or less")
    
    def send_sms(self, message: NotificationMessage) -> NotificationResult:
        """Send SMS via TextLocal API."""
        if not message.recipient_phone:
            return NotificationResult(
                success=False,
                error_message="No recipient phone number provided",
                status_code=400
            )
        
        try:
            # Clean phone number (remove +91 if present, keep only digits)
            phone = message.recipient_phone.replace('+91', '').replace('+', '').strip()
            if not phone.startswith('91') and len(phone) == 10:
                phone = '91' + phone
            
            # Validate Indian phone number
            if not self._is_valid_indian_number(phone):
                return NotificationResult(
                    success=False,
                    error_message="Invalid Indian phone number format",
                    status_code=400
                )
            
            # Prepare TextLocal API request
            base_url = self.config.get('base_url', 'https://api.textlocal.in/send/')
            
            # Use different endpoints based on authentication method
            if self.config.get('use_hash_auth', False):
                data = self._prepare_hash_auth_data(phone, message.message)
            else:
                data = self._prepare_api_key_data(phone, message.message)
            
            logger.info(f"Sending SMS via TextLocal to {phone}")
            
            # Make API request
            response = requests.post(
                base_url,
                data=data,
                timeout=30,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('status') == 'success':
                    # TextLocal successful response
                    messages = result.get('messages', [])
                    message_id = messages[0].get('id') if messages else None
                    
                    return NotificationResult(
                        success=True,
                        provider_message_id=str(message_id) if message_id else None,
                        status_code=200,
                        extra_data={
                            "provider": "textlocal",
                            "batch_id": result.get('batch_id'),
                            "cost": result.get('cost', 0),
                            "num_messages": result.get('num_messages', 1),
                            "message_id": message_id,
                            "recipient": phone,
                            "timestamp": datetime.utcnow().isoformat()
                        }
                    )
                else:
                    # TextLocal error response
                    errors = result.get('errors', [])
                    error_message = errors[0].get('message', 'Unknown TextLocal error') if errors else 'API call failed'
                    error_code = errors[0].get('code') if errors else None
                    
                    return NotificationResult(
                        success=False,
                        error_message=f"TextLocal API error: {error_message}",
                        status_code=400,
                        extra_data={
                            "provider": "textlocal",
                            "error_code": error_code,
                            "errors": errors,
                            "timestamp": datetime.utcnow().isoformat()
                        }
                    )
            else:
                return NotificationResult(
                    success=False,
                    error_message=f"TextLocal HTTP error: {response.status_code}",
                    status_code=response.status_code,
                    extra_data={
                        "provider": "textlocal",
                        "http_status": response.status_code,
                        "response_text": response.text[:200],
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
        
        except requests.exceptions.RequestException as e:
            logger.error(f"TextLocal SMS request failed: {str(e)}")
            return NotificationResult(
                success=False,
                error_message=f"Network error: {str(e)}",
                status_code=500,
                extra_data={
                    "provider": "textlocal",
                    "error_type": "network_error",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        except Exception as e:
            logger.error(f"Unexpected error sending TextLocal SMS: {str(e)}")
            return NotificationResult(
                success=False,
                error_message=f"Unexpected error: {str(e)}",
                status_code=500,
                extra_data={
                    "provider": "textlocal",
                    "error_type": "unexpected_error",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    def send_email(self, message: NotificationMessage) -> NotificationResult:
        """TextLocal doesn't support email - return error."""
        return NotificationResult(
            success=False,
            error_message="TextLocal provider does not support email notifications",
            status_code=400,
            extra_data={
                "provider": "textlocal",
                "error_type": "unsupported_notification_type",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    def get_delivery_status(self, provider_message_id: str) -> NotificationResult:
        """Get SMS delivery status from TextLocal."""
        try:
            # TextLocal status check API
            base_url = self.config.get('base_url', 'https://api.textlocal.in')
            status_url = f"{base_url}/get_message_status/"
            
            data = {
                'apikey': self.config['api_key'],
                'message_id': provider_message_id
            }
            
            logger.info(f"Checking TextLocal SMS status for {provider_message_id}")
            
            response = requests.post(status_url, data=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('status') == 'success':
                    messages = result.get('messages', [])
                    if messages:
                        message_status = messages[0]
                        status = message_status.get('status', 'unknown')
                        
                        # Map TextLocal status to our standard
                        success = status.lower() in ['delivered', 'sent']
                        
                        return NotificationResult(
                            success=success,
                            extra_data={
                                "provider": "textlocal",
                                "message_id": provider_message_id,
                                "status": status,
                                "recipient": message_status.get('recipient'),
                                "cost": message_status.get('cost'),
                                "sent_time": message_status.get('sent_time'),
                                "delivery_time": message_status.get('delivery_time'),
                                "timestamp": datetime.utcnow().isoformat()
                            }
                        )
                
                return NotificationResult(
                    success=False,
                    error_message="No status information available",
                    extra_data={
                        "provider": "textlocal",
                        "message_id": provider_message_id,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
            else:
                return NotificationResult(
                    success=False,
                    error_message=f"Status check failed: {response.status_code}",
                    status_code=response.status_code,
                    extra_data={
                        "provider": "textlocal",
                        "error_type": "status_check_failed",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
        
        except Exception as e:
            logger.error(f"Error checking TextLocal SMS status: {str(e)}")
            return NotificationResult(
                success=False,
                error_message=f"Status check error: {str(e)}",
                extra_data={
                    "provider": "textlocal",
                    "error_type": "status_check_error",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    def _prepare_api_key_data(self, phone: str, message: str) -> Dict[str, str]:
        """Prepare data for API key authentication."""
        return {
            'apikey': self.config['api_key'],
            'numbers': phone,
            'message': message,
            'sender': self.config['sender']
        }
    
    def _prepare_hash_auth_data(self, phone: str, message: str) -> Dict[str, str]:
        """Prepare data for hash-based authentication (more secure)."""
        username = self.config.get('username')
        hash_key = self.config.get('hash_key')
        
        if not username or not hash_key:
            raise ValueError("Username and hash_key required for hash authentication")
        
        # Create hash for authentication
        hash_string = f"{hash_key}{message}"
        hash_value = hashlib.sha512(hash_string.encode()).hexdigest()
        
        return {
            'username': username,
            'hash': hash_value,
            'numbers': phone,
            'message': message,
            'sender': self.config['sender']
        }
    
    def _is_valid_indian_number(self, phone: str) -> bool:
        """Validate Indian phone number format."""
        # Remove any spaces or special characters
        clean_phone = ''.join(filter(str.isdigit, phone))
        
        # Should be 12 digits with 91 country code, or 10 digits without
        if len(clean_phone) == 12 and clean_phone.startswith('91'):
            mobile_number = clean_phone[2:]
        elif len(clean_phone) == 10:
            mobile_number = clean_phone
        else:
            return False
        
        # Indian mobile numbers start with 6, 7, 8, or 9
        return len(mobile_number) == 10 and mobile_number[0] in ['6', '7', '8', '9']
    
    def get_balance(self) -> NotificationResult:
        """Get account balance from TextLocal."""
        try:
            base_url = self.config.get('base_url', 'https://api.textlocal.in')
            balance_url = f"{base_url}/balance/"
            
            data = {
                'apikey': self.config['api_key']
            }
            
            response = requests.post(balance_url, data=data, timeout=30)
            
            if response.status_code == 200:
                result = response.json()
                
                if result.get('status') == 'success':
                    balance = result.get('balance', {})
                    
                    return NotificationResult(
                        success=True,
                        extra_data={
                            "provider": "textlocal",
                            "sms_balance": balance.get('sms', 0),
                            "email_balance": balance.get('email', 0),
                            "currency": "INR",
                            "timestamp": datetime.utcnow().isoformat()
                        }
                    )
            
            return NotificationResult(
                success=False,
                error_message="Failed to retrieve balance",
                status_code=response.status_code
            )
            
        except Exception as e:
            logger.error(f"Error checking TextLocal balance: {str(e)}")
            return NotificationResult(
                success=False,
                error_message=f"Balance check error: {str(e)}"
            )