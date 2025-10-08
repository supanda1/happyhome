"""
SMS Configuration API routes for Happy Homes application.
Provides SMS provider configuration status and setup guidance for administrators.
"""

import os
from typing import Dict, Any, List
from fastapi import APIRouter, HTTPException, Depends

from ..core.dependencies import get_current_admin_user
from ..core.logging import get_logger
from ..models.user import User

logger = get_logger(__name__)
router = APIRouter()


def mask_sensitive_value(value: str) -> str:
    """Mask sensitive values for UI display."""
    if not value:
        return ""
    if len(value) <= 8:
        return "*" * len(value)
    return value[:4] + "*" * (len(value) - 8) + value[-4:]


def get_sms_provider_config(provider_type: str) -> Dict[str, Any]:
    """Get SMS provider configuration from environment variables."""
    
    if provider_type == "twilio":
        return {
            "name": "Twilio",
            "type": "Global SMS Service",
            "configured": bool(
                os.getenv("TWILIO_ACCOUNT_SID") and 
                os.getenv("TWILIO_AUTH_TOKEN") and 
                os.getenv("TWILIO_FROM_NUMBER")
            ),
            "enabled": os.getenv("TWILIO_ENABLED", "false").lower() == "true",
            "cost_per_sms": "₹1.20",
            "coverage": "Global",
            "config_fields": [
                {
                    "name": "TWILIO_ENABLED",
                    "value": os.getenv("TWILIO_ENABLED", "false"),
                    "required": False
                },
                {
                    "name": "TWILIO_ACCOUNT_SID",
                    "value": mask_sensitive_value(os.getenv("TWILIO_ACCOUNT_SID", "")),
                    "required": True
                },
                {
                    "name": "TWILIO_AUTH_TOKEN",
                    "value": mask_sensitive_value(os.getenv("TWILIO_AUTH_TOKEN", "")),
                    "required": True
                },
                {
                    "name": "TWILIO_FROM_NUMBER",
                    "value": os.getenv("TWILIO_FROM_NUMBER", ""),
                    "required": True
                }
            ]
        }
    
    elif provider_type == "textlocal":
        return {
            "name": "TextLocal",
            "type": "Indian SMS Service",
            "configured": bool(
                os.getenv("TEXTLOCAL_API_KEY") and 
                os.getenv("TEXTLOCAL_SENDER")
            ),
            "enabled": os.getenv("TEXTLOCAL_ENABLED", "false").lower() == "true",
            "cost_per_sms": "₹0.25",
            "coverage": "India",
            "config_fields": [
                {
                    "name": "TEXTLOCAL_ENABLED",
                    "value": os.getenv("TEXTLOCAL_ENABLED", "false"),
                    "required": False
                },
                {
                    "name": "TEXTLOCAL_API_KEY",
                    "value": mask_sensitive_value(os.getenv("TEXTLOCAL_API_KEY", "")),
                    "required": True
                },
                {
                    "name": "TEXTLOCAL_SENDER",
                    "value": os.getenv("TEXTLOCAL_SENDER", ""),
                    "required": True
                },
                {
                    "name": "TEXTLOCAL_USE_HASH_AUTH",
                    "value": os.getenv("TEXTLOCAL_USE_HASH_AUTH", "false"),
                    "required": False
                },
                {
                    "name": "TEXTLOCAL_USERNAME",
                    "value": os.getenv("TEXTLOCAL_USERNAME", ""),
                    "required": False
                },
                {
                    "name": "TEXTLOCAL_HASH_KEY",
                    "value": mask_sensitive_value(os.getenv("TEXTLOCAL_HASH_KEY", "")),
                    "required": False
                }
            ]
        }
    
    elif provider_type == "teleo":
        return {
            "name": "Teleo",
            "type": "Indian SMS Service",
            "configured": bool(
                os.getenv("TELEO_USERNAME") and 
                os.getenv("TELEO_PASSWORD") and 
                os.getenv("TELEO_SENDER_ID")
            ),
            "enabled": os.getenv("TELEO_ENABLED", "false").lower() == "true",
            "cost_per_sms": "₹0.30",
            "coverage": "India",
            "config_fields": [
                {
                    "name": "TELEO_ENABLED",
                    "value": os.getenv("TELEO_ENABLED", "false"),
                    "required": False
                },
                {
                    "name": "TELEO_USERNAME",
                    "value": os.getenv("TELEO_USERNAME", ""),
                    "required": True
                },
                {
                    "name": "TELEO_PASSWORD",
                    "value": mask_sensitive_value(os.getenv("TELEO_PASSWORD", "")),
                    "required": True
                },
                {
                    "name": "TELEO_SENDER_ID",
                    "value": os.getenv("TELEO_SENDER_ID", ""),
                    "required": True
                }
            ]
        }
    
    elif provider_type == "aws_sns":
        return {
            "name": "AWS SNS",
            "type": "Cloud SMS Service",
            "configured": bool(
                os.getenv("AWS_ACCESS_KEY_ID") and 
                os.getenv("AWS_SECRET_ACCESS_KEY") and 
                os.getenv("AWS_REGION")
            ),
            "enabled": os.getenv("AWS_SNS_ENABLED", "false").lower() == "true",
            "cost_per_sms": "₹0.60",
            "coverage": "Global",
            "config_fields": [
                {
                    "name": "AWS_SNS_ENABLED",
                    "value": os.getenv("AWS_SNS_ENABLED", "false"),
                    "required": False
                },
                {
                    "name": "AWS_ACCESS_KEY_ID",
                    "value": mask_sensitive_value(os.getenv("AWS_ACCESS_KEY_ID", "")),
                    "required": True
                },
                {
                    "name": "AWS_SECRET_ACCESS_KEY",
                    "value": mask_sensitive_value(os.getenv("AWS_SECRET_ACCESS_KEY", "")),
                    "required": True
                },
                {
                    "name": "AWS_REGION",
                    "value": os.getenv("AWS_REGION", "ap-south-1"),
                    "required": True
                }
            ]
        }
    
    else:
        return {}


def get_email_provider_config() -> Dict[str, Any]:
    """Get email provider configuration from environment variables."""
    return {
        "sendgrid": {
            "name": "SendGrid",
            "type": "Email Service",
            "configured": bool(
                os.getenv("SENDGRID_API_KEY") and 
                os.getenv("SENDGRID_FROM_EMAIL")
            ),
            "enabled": os.getenv("SENDGRID_ENABLED", "false").lower() == "true",
            "config_fields": [
                {
                    "name": "SENDGRID_ENABLED",
                    "value": os.getenv("SENDGRID_ENABLED", "false"),
                    "required": False
                },
                {
                    "name": "SENDGRID_API_KEY",
                    "value": mask_sensitive_value(os.getenv("SENDGRID_API_KEY", "")),
                    "required": True
                },
                {
                    "name": "SENDGRID_FROM_EMAIL",
                    "value": os.getenv("SENDGRID_FROM_EMAIL", ""),
                    "required": True
                },
                {
                    "name": "SENDGRID_FROM_NAME",
                    "value": os.getenv("SENDGRID_FROM_NAME", "Happy Homes"),
                    "required": False
                }
            ]
        }
    }


def has_any_real_provider(sms_providers: Dict, email_provider: Dict) -> bool:
    """Check if any real provider is configured and enabled."""
    sms_configured = any(
        provider.get("configured") and provider.get("enabled")
        for provider in sms_providers.values()
    )
    email_configured = (
        email_provider.get("sendgrid", {}).get("configured") and
        email_provider.get("sendgrid", {}).get("enabled")
    )
    
    return sms_configured or email_configured


def generate_recommendations(sms_providers: Dict, email_provider: Dict) -> List[str]:
    """Generate setup recommendations based on current configuration."""
    recommendations = []

    # Check SMS providers
    configured_sms = [
        p for p in sms_providers.values()
        if p.get("configured") and p.get("enabled")
    ]
    
    if len(configured_sms) == 0:
        recommendations.append(
            "🔴 No SMS providers configured. Add TextLocal for India or Twilio for global coverage."
        )
    elif len(configured_sms) == 1:
        recommendations.append(
            "🟡 Only one SMS provider configured. Add a backup provider for reliability."
        )
    else:
        recommendations.append("🟢 Multiple SMS providers configured for redundancy.")

    # Check email provider
    sendgrid = email_provider.get("sendgrid", {})
    if not (sendgrid.get("configured") and sendgrid.get("enabled")):
        recommendations.append(
            "🔴 Email provider not configured. Add SendGrid for email notifications."
        )
    else:
        recommendations.append("🟢 Email provider configured and ready.")

    # Cost optimization
    has_textlocal = (
        sms_providers.get("textlocal", {}).get("configured") and
        sms_providers.get("textlocal", {}).get("enabled")
    )
    has_teleo = (
        sms_providers.get("teleo", {}).get("configured") and
        sms_providers.get("teleo", {}).get("enabled")
    )
    only_twilio = (
        sms_providers.get("twilio", {}).get("configured") and
        sms_providers.get("twilio", {}).get("enabled") and
        not has_textlocal and not has_teleo
    )
    
    if only_twilio:
        recommendations.append(
            "💰 Consider adding TextLocal (₹0.25/SMS) or Teleo (₹0.30/SMS) for 75% cost savings on Indian numbers."
        )
    elif has_textlocal or has_teleo:
        recommendations.append("💰 Cost-optimized setup detected. Indian SMS costs reduced by 75%.")

    return recommendations


@router.get("/status")
async def get_sms_config_status(
    current_user: User = Depends(get_current_admin_user)
):
    """Get SMS configuration status and provider information."""
    try:
        # Get all SMS providers
        sms_providers = {
            "twilio": get_sms_provider_config("twilio"),
            "textlocal": get_sms_provider_config("textlocal"),
            "teleo": get_sms_provider_config("teleo"),
            "aws_sns": get_sms_provider_config("aws_sns")
        }

        # Get email provider
        email_provider = get_email_provider_config()

        # Mock provider status
        mock_provider = {
            "enabled": not has_any_real_provider(sms_providers, email_provider),
            "simulate_failures": os.getenv("MOCK_SIMULATE_FAILURES", "false").lower() == "true",
            "failure_rate": os.getenv("MOCK_FAILURE_RATE", "0.1")
        }

        # Overall status
        status = {
            "mock_mode": mock_provider["enabled"],
            "sms_providers": sms_providers,
            "email_provider": email_provider,
            "mock_settings": mock_provider,
            "recommendations": generate_recommendations(sms_providers, email_provider),
            "setup_instructions": get_setup_instructions()
        }

        return {
            "success": True,
            "data": status
        }

    except Exception as e:
        logger.error(f"Error getting SMS configuration status: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get SMS configuration status"
        )


@router.get("/setup-guide")
async def get_setup_guide(
    current_user: User = Depends(get_current_admin_user)
):
    """Get SMS provider setup guide with step-by-step instructions."""
    try:
        guide = {
            "steps": [
                {
                    "step": 1,
                    "title": "Choose SMS Provider",
                    "description": "Select based on your target audience and budget",
                    "providers": [
                        {
                            "name": "TextLocal",
                            "best_for": "India (Domestic)",
                            "cost": "₹0.25/SMS",
                            "setup_time": "15 minutes",
                            "signup_url": "https://www.textlocal.in"
                        },
                        {
                            "name": "Teleo",
                            "best_for": "India (High Volume)",
                            "cost": "₹0.30/SMS",
                            "setup_time": "10 minutes",
                            "signup_url": "https://www.teleo.in"
                        },
                        {
                            "name": "Twilio",
                            "best_for": "Global Coverage",
                            "cost": "₹1.20/SMS",
                            "setup_time": "10 minutes",
                            "signup_url": "https://www.twilio.com"
                        }
                    ]
                },
                {
                    "step": 2,
                    "title": "Get API Credentials",
                    "description": "Sign up with your chosen provider and obtain API credentials",
                    "actions": [
                        "Create account on provider website",
                        "Verify your phone number and identity",
                        "Get API key/credentials from dashboard",
                        "Apply for Sender ID approval (India providers)",
                        "Add initial balance to your account"
                    ]
                },
                {
                    "step": 3,
                    "title": "Update Environment Variables",
                    "description": "Add your provider credentials to the backend .env file",
                    "file_location": "backend/.env",
                    "restart_required": True
                },
                {
                    "step": 4,
                    "title": "Test Configuration", 
                    "description": "Send test SMS from admin panel to verify setup",
                    "test_location": "Admin Panel → SMS Providers → Test SMS"
                }
            ],
            "env_template": {
                "textlocal": [
                    "TEXTLOCAL_ENABLED=true",
                    "TEXTLOCAL_API_KEY=your_textlocal_api_key_here",
                    "TEXTLOCAL_SENDER=HPYHMS"
                ],
                "teleo": [
                    "TELEO_ENABLED=true",
                    "TELEO_USERNAME=your_teleo_username",
                    "TELEO_PASSWORD=your_teleo_password",
                    "TELEO_SENDER_ID=HPYHMS"
                ],
                "twilio": [
                    "TWILIO_ENABLED=true",
                    "TWILIO_ACCOUNT_SID=AC1234567890abcdef",
                    "TWILIO_AUTH_TOKEN=your_auth_token_here",
                    "TWILIO_FROM_NUMBER=+1234567890"
                ],
                "sendgrid": [
                    "SENDGRID_ENABLED=true",
                    "SENDGRID_API_KEY=SG.your_sendgrid_api_key_here",
                    "SENDGRID_FROM_EMAIL=noreply@happyhomes.com",
                    "SENDGRID_FROM_NAME=Happy Homes"
                ]
            }
        }

        return {
            "success": True,
            "data": guide
        }

    except Exception as e:
        logger.error(f"Error getting setup guide: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail="Failed to get setup guide"
        )


def get_setup_instructions() -> Dict[str, Any]:
    """Get setup instructions for SMS providers."""
    return {
        "quick_start": [
            {
                "title": "For Indian Customers (Recommended)",
                "provider": "TextLocal",
                "steps": [
                    "Go to https://www.textlocal.in",
                    "Sign up and verify your account",
                    "Get API key from dashboard",
                    'Apply for sender ID "HPYHMS"',
                    "Add ₹100 initial balance",
                    "Set TEXTLOCAL_ENABLED=true in .env"
                ],
                "time": "15 minutes",
                "cost": "₹0.25 per SMS"
            },
            {
                "title": "For Global Customers",
                "provider": "Twilio",
                "steps": [
                    "Go to https://www.twilio.com/try-twilio",
                    "Sign up with phone verification",
                    "Get Account SID and Auth Token",
                    "Purchase a phone number",
                    "Add $20 initial balance",
                    "Set TWILIO_ENABLED=true in .env"
                ],
                "time": "10 minutes",
                "cost": "₹1.20 per SMS"
            }
        ],
        "troubleshooting": [
            {
                "issue": "SMS not sending",
                "solutions": [
                    "Check API credentials are correct",
                    "Verify sender ID is approved",
                    "Ensure sufficient account balance",
                    "Check phone number format (+91XXXXXXXXXX)",
                    "Restart backend server after .env changes"
                ]
            },
            {
                "issue": "High failure rate",
                "solutions": [
                    "Check DND (Do Not Disturb) compliance",
                    "Verify message content follows guidelines",
                    "Ensure sender ID is registered",
                    "Check provider service status",
                    "Review message length (160 chars max)"
                ]
            }
        ]
    }