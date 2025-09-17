"""
Teleo SMS notification provider for Indian market.

Teleo is an Indian SMS service provider offering bulk SMS services
with competitive pricing and good delivery rates for Indian numbers.
"""

import requests
import json
from typing import Dict, Any
from datetime import datetime
from urllib.parse import quote

from .notification_base import NotificationProvider, NotificationMessage, NotificationResult
from ..core.logging import get_logger

logger = get_logger(__name__)


class TeleoSMSProvider(NotificationProvider):
    """Teleo SMS provider for Indian phone numbers."""
    
    def validate_config(self) -> None:
        """Validate Teleo configuration."""
        required_fields = ['username', 'password', 'sender_id']
        for field in required_fields:
            if not self.config.get(field):
                raise ValueError(f"Teleo configuration missing required field: {field}")
        
        # Validate sender ID format
        sender_id = self.config.get('sender_id', '')
        if len(sender_id) > 6:
            raise ValueError("Teleo sender ID must be 6 characters or less")
    
    def send_sms(self, message: NotificationMessage) -> NotificationResult:
        """Send SMS via Teleo API."""
        if not message.recipient_phone:
            return NotificationResult(
                success=False,
                error_message="No recipient phone number provided",
                status_code=400
            )
        
        try:
            # Clean and validate phone number
            phone = self._clean_phone_number(message.recipient_phone)
            
            if not self._is_valid_indian_number(phone):
                return NotificationResult(
                    success=False,
                    error_message="Invalid Indian phone number format",
                    status_code=400
                )
            
            # Prepare Teleo API request
            base_url = self.config.get('base_url', 'http://sms.teleo.in/api/smsapi.aspx')
            
            # Teleo API parameters
            params = {
                'username': self.config['username'],
                'password': self.config['password'],
                'from': self.config['sender_id'],
                'to': phone,
                'text': message.message,
                'type': self.config.get('message_type', '1'),  # 1 = Normal, 2 = Flash
                'dlr': self.config.get('dlr', '1')  # 1 = Request DLR, 0 = No DLR
            }
            
            logger.info(f"Sending SMS via Teleo to {phone}")
            
            # Make API request
            response = requests.get(
                base_url,
                params=params,
                timeout=30,
                headers={'Content-Type': 'application/x-www-form-urlencoded'}
            )
            
            if response.status_code == 200:
                response_text = response.text.strip()
                
                # Teleo returns different response formats
                if response_text.startswith('OK:'):
                    # Successful submission: "OK: message_id"
                    message_id = response_text.split(':', 1)[1].strip()
                    
                    return NotificationResult(
                        success=True,
                        provider_message_id=message_id,
                        status_code=200,
                        extra_data={
                            "provider": "teleo",
                            "message_id": message_id,
                            "recipient": phone,
                            "sender_id": self.config['sender_id'],
                            "timestamp": datetime.utcnow().isoformat(),
                            "raw_response": response_text
                        }
                    )
                
                elif response_text.startswith('ERROR:'):
                    # Error response: "ERROR: error_message"
                    error_message = response_text.split(':', 1)[1].strip()
                    
                    return NotificationResult(
                        success=False,
                        error_message=f"Teleo API error: {error_message}",
                        status_code=400,
                        extra_data={
                            "provider": "teleo",
                            "error_response": response_text,
                            "timestamp": datetime.utcnow().isoformat()
                        }
                    )
                
                else:
                    # Try to parse as JSON (newer API format)
                    try:
                        json_response = json.loads(response_text)
                        
                        if json_response.get('status') == 'success':
                            return NotificationResult(
                                success=True,
                                provider_message_id=json_response.get('message_id'),
                                status_code=200,
                                extra_data={
                                    "provider": "teleo",
                                    "message_id": json_response.get('message_id'),
                                    "cost": json_response.get('cost'),
                                    "recipient": phone,
                                    "timestamp": datetime.utcnow().isoformat()
                                }
                            )
                        else:
                            return NotificationResult(
                                success=False,
                                error_message=json_response.get('message', 'Unknown error'),
                                status_code=400,
                                extra_data={
                                    "provider": "teleo",
                                    "error_code": json_response.get('error_code'),
                                    "timestamp": datetime.utcnow().isoformat()
                                }
                            )
                    
                    except json.JSONDecodeError:
                        # Unknown response format
                        return NotificationResult(
                            success=False,
                            error_message=f"Unexpected Teleo response: {response_text}",
                            status_code=400,
                            extra_data={
                                "provider": "teleo",
                                "raw_response": response_text,
                                "timestamp": datetime.utcnow().isoformat()
                            }
                        )
            
            else:
                return NotificationResult(
                    success=False,
                    error_message=f"Teleo HTTP error: {response.status_code}",
                    status_code=response.status_code,
                    extra_data={
                        "provider": "teleo",
                        "http_status": response.status_code,
                        "response_text": response.text[:200],
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
        
        except requests.exceptions.RequestException as e:
            logger.error(f"Teleo SMS request failed: {str(e)}")
            return NotificationResult(
                success=False,
                error_message=f"Network error: {str(e)}",
                status_code=500,
                extra_data={
                    "provider": "teleo",
                    "error_type": "network_error",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        except Exception as e:
            logger.error(f"Unexpected error sending Teleo SMS: {str(e)}")
            return NotificationResult(
                success=False,
                error_message=f"Unexpected error: {str(e)}",
                status_code=500,
                extra_data={
                    "provider": "teleo",
                    "error_type": "unexpected_error",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    def send_email(self, message: NotificationMessage) -> NotificationResult:
        """Teleo doesn't support email - return error."""
        return NotificationResult(
            success=False,
            error_message="Teleo provider does not support email notifications",
            status_code=400,
            extra_data={
                "provider": "teleo",
                "error_type": "unsupported_notification_type",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    def get_delivery_status(self, provider_message_id: str) -> NotificationResult:
        """Get SMS delivery status from Teleo."""
        try:
            # Teleo delivery status API
            base_url = self.config.get('status_url', 'http://sms.teleo.in/api/dlr.aspx')
            
            params = {
                'username': self.config['username'],
                'password': self.config['password'],
                'msgid': provider_message_id
            }
            
            logger.info(f"Checking Teleo SMS status for {provider_message_id}")
            
            response = requests.get(base_url, params=params, timeout=30)
            
            if response.status_code == 200:
                response_text = response.text.strip()
                
                # Parse Teleo status response
                # Format: "msgid|mobile|status|delivered_time"
                if '|' in response_text:
                    parts = response_text.split('|')
                    if len(parts) >= 3:
                        msg_id, mobile, status = parts[0], parts[1], parts[2]
                        delivered_time = parts[3] if len(parts) > 3 else None
                        
                        # Map Teleo status codes
                        status_mapping = {
                            '1': 'delivered',
                            '2': 'failed',
                            '4': 'sent',
                            '8': 'rejected',
                            '16': 'unknown'
                        }
                        
                        status_text = status_mapping.get(status, f'unknown_{status}')
                        success = status in ['1', '4']  # delivered or sent
                        
                        return NotificationResult(
                            success=success,
                            extra_data={
                                "provider": "teleo",
                                "message_id": msg_id,
                                "mobile": mobile,
                                "status": status_text,
                                "status_code": status,
                                "delivered_time": delivered_time,
                                "timestamp": datetime.utcnow().isoformat()
                            }
                        )
                
                # Try JSON format for newer API
                try:
                    json_response = json.loads(response_text)
                    status = json_response.get('status', 'unknown')
                    success = status.lower() in ['delivered', 'sent']
                    
                    return NotificationResult(
                        success=success,
                        extra_data={
                            "provider": "teleo",
                            "message_id": provider_message_id,
                            "status": status,
                            "delivery_time": json_response.get('delivery_time'),
                            "timestamp": datetime.utcnow().isoformat()
                        }
                    )
                
                except json.JSONDecodeError:
                    return NotificationResult(
                        success=False,
                        error_message=f"Could not parse status response: {response_text}",
                        extra_data={
                            "provider": "teleo",
                            "raw_response": response_text,
                            "timestamp": datetime.utcnow().isoformat()
                        }
                    )
            
            else:
                return NotificationResult(
                    success=False,
                    error_message=f"Status check failed: {response.status_code}",
                    status_code=response.status_code,
                    extra_data={
                        "provider": "teleo",
                        "error_type": "status_check_failed",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
        
        except Exception as e:
            logger.error(f"Error checking Teleo SMS status: {str(e)}")
            return NotificationResult(
                success=False,
                error_message=f"Status check error: {str(e)}",
                extra_data={
                    "provider": "teleo",
                    "error_type": "status_check_error",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    def _clean_phone_number(self, phone: str) -> str:
        """Clean and format phone number for Teleo."""
        # Remove all non-digit characters
        clean_phone = ''.join(filter(str.isdigit, phone))
        
        # Handle Indian number format
        if len(clean_phone) == 10:
            # Add 91 country code for Indian numbers
            return '91' + clean_phone
        elif len(clean_phone) == 12 and clean_phone.startswith('91'):
            return clean_phone
        elif len(clean_phone) == 13 and clean_phone.startswith('091'):
            return clean_phone[1:]  # Remove leading 0
        else:
            return clean_phone
    
    def _is_valid_indian_number(self, phone: str) -> bool:
        """Validate Indian phone number format."""
        # Clean phone number
        clean_phone = ''.join(filter(str.isdigit, phone))
        
        # Check format: should be 12 digits (91 + 10 digit mobile)
        if len(clean_phone) == 12 and clean_phone.startswith('91'):
            mobile_number = clean_phone[2:]
            # Indian mobile numbers start with 6, 7, 8, or 9
            return len(mobile_number) == 10 and mobile_number[0] in ['6', '7', '8', '9']
        
        return False
    
    def get_balance(self) -> NotificationResult:
        """Get account balance from Teleo."""
        try:
            # Teleo balance check API
            base_url = self.config.get('balance_url', 'http://sms.teleo.in/api/balance.aspx')
            
            params = {
                'username': self.config['username'],
                'password': self.config['password']
            }
            
            response = requests.get(base_url, params=params, timeout=30)
            
            if response.status_code == 200:
                response_text = response.text.strip()
                
                # Teleo balance format: "BALANCE: credits"
                if response_text.startswith('BALANCE:'):
                    balance_str = response_text.split(':', 1)[1].strip()
                    try:
                        balance = float(balance_str)
                        return NotificationResult(
                            success=True,
                            extra_data={
                                "provider": "teleo",
                                "balance": balance,
                                "currency": "Credits",
                                "timestamp": datetime.utcnow().isoformat()
                            }
                        )
                    except ValueError:
                        pass
                
                # Try JSON format
                try:
                    json_response = json.loads(response_text)
                    return NotificationResult(
                        success=True,
                        extra_data={
                            "provider": "teleo",
                            "balance": json_response.get('balance', 0),
                            "currency": json_response.get('currency', 'Credits'),
                            "timestamp": datetime.utcnow().isoformat()
                        }
                    )
                
                except json.JSONDecodeError:
                    return NotificationResult(
                        success=False,
                        error_message=f"Could not parse balance response: {response_text}"
                    )
            
            return NotificationResult(
                success=False,
                error_message="Failed to retrieve balance",
                status_code=response.status_code
            )
            
        except Exception as e:
            logger.error(f"Error checking Teleo balance: {str(e)}")
            return NotificationResult(
                success=False,
                error_message=f"Balance check error: {str(e)}"
            )
    
    def send_bulk_sms(self, recipients: list, message: str) -> NotificationResult:
        """Send bulk SMS via Teleo (if supported)."""
        try:
            # Clean phone numbers
            clean_numbers = []
            for phone in recipients:
                clean_phone = self._clean_phone_number(phone)
                if self._is_valid_indian_number(clean_phone):
                    clean_numbers.append(clean_phone)
            
            if not clean_numbers:
                return NotificationResult(
                    success=False,
                    error_message="No valid phone numbers provided"
                )
            
            # Teleo bulk SMS API
            base_url = self.config.get('bulk_url', 'http://sms.teleo.in/api/bulksms.aspx')
            
            params = {
                'username': self.config['username'],
                'password': self.config['password'],
                'from': self.config['sender_id'],
                'to': ','.join(clean_numbers),  # Comma-separated numbers
                'text': message,
                'type': self.config.get('message_type', '1')
            }
            
            response = requests.get(base_url, params=params, timeout=60)
            
            if response.status_code == 200:
                response_text = response.text.strip()
                
                if response_text.startswith('OK:'):
                    batch_id = response_text.split(':', 1)[1].strip()
                    
                    return NotificationResult(
                        success=True,
                        provider_message_id=batch_id,
                        status_code=200,
                        extra_data={
                            "provider": "teleo",
                            "batch_id": batch_id,
                            "recipient_count": len(clean_numbers),
                            "recipients": clean_numbers,
                            "timestamp": datetime.utcnow().isoformat()
                        }
                    )
                else:
                    return NotificationResult(
                        success=False,
                        error_message=f"Bulk SMS failed: {response_text}",
                        status_code=400
                    )
            
            else:
                return NotificationResult(
                    success=False,
                    error_message=f"Bulk SMS HTTP error: {response.status_code}",
                    status_code=response.status_code
                )
        
        except Exception as e:
            logger.error(f"Error sending bulk SMS: {str(e)}")
            return NotificationResult(
                success=False,
                error_message=f"Bulk SMS error: {str(e)}"
            )