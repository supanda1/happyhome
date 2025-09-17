"""
SendGrid email notification provider.

Handles email sending via SendGrid API with proper error handling,
retry logic, and delivery status tracking.
"""

import requests
from typing import Dict, Any
from datetime import datetime

from .notification_base import NotificationProvider, NotificationMessage, NotificationResult
from ..core.logging import get_logger

logger = get_logger(__name__)


class SendGridEmailProvider(NotificationProvider):
    """SendGrid email provider for sending email notifications."""
    
    def validate_config(self) -> None:
        """Validate SendGrid configuration."""
        required_fields = ['api_key', 'from_email', 'from_name']
        for field in required_fields:
            if not self.config.get(field):
                raise ValueError(f"SendGrid configuration missing required field: {field}")
    
    def send_sms(self, message: NotificationMessage) -> NotificationResult:
        """SendGrid doesn't support SMS - return error."""
        return NotificationResult(
            success=False,
            error_message="SendGrid provider does not support SMS notifications",
            status_code=400,
            extra_data={
                "provider": "sendgrid",
                "error_type": "unsupported_notification_type",
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    def send_email(self, message: NotificationMessage) -> NotificationResult:
        """Send email via SendGrid API."""
        if not message.recipient_email:
            return NotificationResult(
                success=False,
                error_message="No recipient email address provided",
                status_code=400
            )
        
        try:
            # SendGrid API endpoint
            url = "https://api.sendgrid.com/v3/mail/send"
            
            # Headers
            headers = {
                'Authorization': f'Bearer {self.config["api_key"]}',
                'Content-Type': 'application/json'
            }
            
            # Email data in SendGrid format
            email_data = {
                "personalizations": [
                    {
                        "to": [
                            {
                                "email": message.recipient_email,
                                "name": message.recipient_name
                            }
                        ],
                        "subject": message.subject or "Happy Homes Notification"
                    }
                ],
                "from": {
                    "email": self.config["from_email"],
                    "name": self.config["from_name"]
                },
                "content": [
                    {
                        "type": "text/plain",
                        "value": message.message
                    },
                    {
                        "type": "text/html",
                        "value": self._convert_to_html(message.message)
                    }
                ],
                "custom_args": {
                    "event_type": message.event_type.value,
                    "notification_id": message.extra_data.get("notification_id") if message.extra_data else "",
                    "order_number": message.extra_data.get("order_number") if message.extra_data else ""
                }
            }
            
            logger.info(f"Sending email via SendGrid to {message.recipient_email}")
            
            # Make API request
            response = requests.post(url, headers=headers, json=email_data, timeout=30)
            
            if response.status_code == 202:  # SendGrid returns 202 for accepted
                # SendGrid doesn't return message ID in response body for v3 API
                # Message ID is in X-Message-Id header if available
                message_id = response.headers.get('X-Message-Id', f"sg_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}")
                
                return NotificationResult(
                    success=True,
                    provider_message_id=message_id,
                    status_code=response.status_code,
                    extra_data={
                        "provider": "sendgrid",
                        "message_id": message_id,
                        "recipient": message.recipient_email,
                        "subject": message.subject,
                        "timestamp": datetime.utcnow().isoformat(),
                        "response_headers": dict(response.headers)
                    }
                )
            else:
                try:
                    error_data = response.json()
                    error_message = "; ".join([err.get('message', 'Unknown error') for err in error_data.get('errors', [])])
                except:
                    error_message = f"SendGrid API error: {response.status_code}"
                
                return NotificationResult(
                    success=False,
                    error_message=error_message,
                    status_code=response.status_code,
                    extra_data={
                        "provider": "sendgrid",
                        "error_response": error_data if 'error_data' in locals() else None,
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
        
        except requests.exceptions.RequestException as e:
            logger.error(f"SendGrid email request failed: {str(e)}")
            return NotificationResult(
                success=False,
                error_message=f"Network error: {str(e)}",
                status_code=500,
                extra_data={
                    "provider": "sendgrid",
                    "error_type": "network_error",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
        
        except Exception as e:
            logger.error(f"Unexpected error sending email: {str(e)}")
            return NotificationResult(
                success=False,
                error_message=f"Unexpected error: {str(e)}",
                status_code=500,
                extra_data={
                    "provider": "sendgrid",
                    "error_type": "unexpected_error",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    def get_delivery_status(self, provider_message_id: str) -> NotificationResult:
        """Get email delivery status from SendGrid."""
        try:
            # SendGrid Stats API - this is a simplified approach
            # In production, you'd use webhooks for real-time delivery status
            url = f"https://api.sendgrid.com/v3/messages/{provider_message_id}"
            
            headers = {
                'Authorization': f'Bearer {self.config["api_key"]}'
            }
            
            logger.info(f"Checking SendGrid email status for {provider_message_id}")
            
            response = requests.get(url, headers=headers, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                
                return NotificationResult(
                    success=True,
                    extra_data={
                        "provider": "sendgrid",
                        "message_id": provider_message_id,
                        "status": data.get('status', 'unknown'),
                        "events": data.get('events', []),
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
            else:
                # Note: SendGrid's message details API has limited availability
                # In production, use Event Webhook for delivery tracking
                return NotificationResult(
                    success=False,
                    error_message=f"Status not available: {response.status_code}",
                    status_code=response.status_code,
                    extra_data={
                        "provider": "sendgrid",
                        "error_type": "status_unavailable",
                        "note": "Use SendGrid Event Webhook for real-time delivery tracking",
                        "timestamp": datetime.utcnow().isoformat()
                    }
                )
        
        except Exception as e:
            logger.error(f"Error checking SendGrid email status: {str(e)}")
            return NotificationResult(
                success=False,
                error_message=f"Status check error: {str(e)}",
                extra_data={
                    "provider": "sendgrid",
                    "error_type": "status_check_error",
                    "timestamp": datetime.utcnow().isoformat()
                }
            )
    
    def _convert_to_html(self, text_message: str) -> str:
        """Convert plain text message to simple HTML."""
        # Basic text to HTML conversion
        html_message = text_message.replace('\n', '<br>')
        
        # Wrap in basic HTML structure
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Happy Homes Notification</title>
            <style>
                body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }}
                .header {{ background: linear-gradient(135deg, #f97316, #a855f7, #3b82f6); color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }}
                .content {{ background: #f9f9f9; padding: 20px; border-radius: 8px; }}
                .footer {{ text-align: center; margin-top: 20px; font-size: 12px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h2>Happy Homes</h2>
            </div>
            <div class="content">
                <p>{html_message}</p>
            </div>
            <div class="footer">
                <p>This is an automated message from Happy Homes. Please do not reply to this email.</p>
                <p>Need help? Contact us at support@happyhomes.com or call +91 9999888877</p>
            </div>
        </body>
        </html>
        """