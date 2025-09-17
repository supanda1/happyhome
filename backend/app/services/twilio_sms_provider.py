"""
Twilio SMS notification provider.

Handles SMS sending via Twilio API with proper error handling,
retry logic, and delivery status tracking.
"""

import requests
from typing import Dict, Any
from datetime import datetime
import base64

from .notification_base import NotificationProvider, NotificationMessage, NotificationResult
from ..core.logging import get_logger

logger = get_logger(__name__)


class TwilioSMSProvider(NotificationProvider):
    """Twilio SMS provider for sending SMS notifications."""
    
    def validate_config(self) -> None:
        """Validate Twilio configuration."""
        required_fields = ['account_sid', 'auth_token', 'from_number']
        for field in required_fields:
            if not self.config.get(field):
                raise ValueError(f"Twilio configuration missing required field: {field}")
    
    def send_sms(self, message: NotificationMessage) -> NotificationResult:
        """Send SMS via Twilio API."""
        if not message.recipient_phone:
            return NotificationResult(
                success=False,
                error_message="No recipient phone number provided",
                status_code=400
            )
        
        try:
            # Prepare Twilio API request
            url = f"https://api.twilio.com/2010-04-01/Accounts/{self.config['account_sid']}/Messages.json"
            
            # Basic auth header
            auth_string = f"{self.config['account_sid']}:{self.config['auth_token']}"
            auth_bytes = auth_string.encode('ascii')
            auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
            
            headers = {
                'Authorization': f'Basic {auth_b64}',
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            
            # SMS data
            data = {
                'From': self.config['from_number'],
                'To': message.recipient_phone,
                'Body': message.message
            }
            
            logger.info(f"Sending SMS via Twilio to {message.recipient_phone}")
            
            # Make API request
            response = requests.post(url, headers=headers, data=data, timeout=30)
            
            if response.status_code in [200, 201]:
                response_data = response.json()
                return NotificationResult(
                    success=True,
                    provider_message_id=response_data.get('sid'),
                    status_code=response.status_code,
                    extra_data={
                        "provider": "twilio",
                        "message_sid": response_data.get('sid'),
                        "status": response_data.get('status'),
                        "price": response_data.get('price'),
                        "direction": response_data.get('direction'),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
            else:
                error_data = response.json() if response.headers.get('content-type', '').startswith('application/json') else {}
                return NotificationResult(
                    success=False,
                    error_message=error_data.get('message', f"Twilio API error: {response.status_code}"),
                    status_code=response.status_code,
                    extra_data={
                        "provider": "twilio",
                        "error_code": error_data.get('code'),
                        "more_info": error_data.get('more_info'),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Twilio SMS request failed: {str(e)}")
            return NotificationResult(
                success=False,
                error_message=f"Network error: {str(e)}",
                status_code=500,
                extra_data={
                    "provider": "twilio",
                    "error_type": "network_error",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        except Exception as e:
            logger.error(f"Unexpected error sending SMS: {str(e)}")
            return NotificationResult(
                success=False,
                error_message=f"Unexpected error: {str(e)}",
                status_code=500,
                extra_data={
                    "provider": "twilio",
                    "error_type": "unexpected_error",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    def send_email(self, message: NotificationMessage) -> NotificationResult:
        """Twilio doesn't support email - return error."""
        return NotificationResult(
            success=False,
            error_message="Twilio provider does not support email notifications",
            status_code=400,
            extra_data={
                "provider": "twilio",
                "error_type": "unsupported_notification_type",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    def get_delivery_status(self, provider_message_id: str) -> NotificationResult:
        """Get SMS delivery status from Twilio."""
        try:
            # Twilio message status API
            url = f"https://api.twilio.com/2010-04-01/Accounts/{self.config['account_sid']}/Messages/{provider_message_id}.json"
            
            # Basic auth header
            auth_string = f"{self.config['account_sid']}:{self.config['auth_token']}"
            auth_bytes = auth_string.encode('ascii')
            auth_b64 = base64.b64encode(auth_bytes).decode('ascii')
            
            headers = {
                'Authorization': f'Basic {auth_b64}'
            }
            
            logger.info(f"Checking Twilio SMS status for {provider_message_id}")
            
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                status = data.get('status', 'unknown')
                
                # Map Twilio status to our result
                success = status in ['sent', 'delivered', 'received']
                
                return NotificationResult(
                    success=success,
                    extra_data={
                        "provider": "twilio",
                        "message_sid": provider_message_id,
                        "status": status,
                        "error_code": data.get('error_code'),
                        "error_message": data.get('error_message'),
                        "price": data.get('price'),
                        "date_sent": data.get('date_sent'),
                        "date_updated": data.get('date_updated'),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
            else:
                return NotificationResult(
                    success=False,
                    error_message=f"Failed to get status: {response.status_code}",
                    status_code=response.status_code,
                    extra_data={
                        "provider": "twilio",
                        "error_type": "status_check_failed",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
        
        except Exception as e:
            logger.error(f"Error checking Twilio SMS status: {str(e)}")
            return NotificationResult(
                success=False,
                error_message=f"Status check error: {str(e)}",
                extra_data={
                    "provider": "twilio",
                    "error_type": "status_check_error",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )