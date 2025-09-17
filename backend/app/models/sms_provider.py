"""
SMS Provider Configuration Models.

Manages SMS provider configurations, settings, and statistics
for different SMS service providers like TextLocal, Teleo, Twilio, etc.
"""

from sqlalchemy import Column, String, Integer, Boolean, Text, DateTime, Float, JSON
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from enum import Enum

from ..core.database import Base


class SMSProviderType(str, Enum):
    """Supported SMS provider types."""
    TWILIO = "twilio"
    TEXTLOCAL = "textlocal"
    TELEO = "teleo"
    AWS_SNS = "aws_sns"
    MOCK = "mock"


class SMSProvider(Base):
    """SMS Provider configuration model."""
    
    __tablename__ = "sms_providers"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)  # Display name
    provider_type = Column(String(50), nullable=False)  # SMSProviderType
    description = Column(Text)
    
    # Configuration
    is_enabled = Column(Boolean, default=False)
    is_primary = Column(Boolean, default=False)  # Primary provider for SMS
    priority = Column(Integer, default=1)  # Lower number = higher priority
    
    # Provider-specific configuration (encrypted JSON)
    config_data = Column(JSON, nullable=False, default=dict)
    
    # Limits and throttling
    daily_limit = Column(Integer)  # Max SMS per day
    rate_limit_per_minute = Column(Integer, default=60)  # Max SMS per minute
    cost_per_sms = Column(Float)  # Cost per SMS in local currency
    
    # Status and monitoring
    last_used_at = Column(DateTime)
    total_sent = Column(Integer, default=0)
    total_failed = Column(Integer, default=0)
    current_balance = Column(Float)  # Provider account balance
    balance_updated_at = Column(DateTime)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    created_by = Column(String(100))
    updated_by = Column(String(100))
    
    def __repr__(self):
        return f"<SMSProvider {self.name} ({self.provider_type})>"
    
    @property
    def success_rate(self) -> float:
        """Calculate SMS success rate percentage."""
        if self.total_sent == 0:
            return 0.0
        return ((self.total_sent - self.total_failed) / self.total_sent) * 100
    
    @property
    def is_active(self) -> bool:
        """Check if provider is active and usable."""
        return self.is_enabled and bool(self.config_data)
    
    def get_masked_config(self) -> dict:
        """Get configuration with sensitive data masked."""
        if not self.config_data:
            return {}
        
        masked = self.config_data.copy()
        
        # Mask sensitive fields
        sensitive_fields = [
            'api_key', 'auth_token', 'password', 'secret_key',
            'hash_key', 'access_key', 'private_key'
        ]
        
        for field in sensitive_fields:
            if field in masked:
                value = masked[field]
                if len(value) > 8:
                    masked[field] = value[:4] + '*' * (len(value) - 8) + value[-4:]
                else:
                    masked[field] = '*' * len(value)
        
        return masked
    
    def increment_sent(self):
        """Increment sent SMS counter."""
        self.total_sent += 1
        self.last_used_at = datetime.utcnow()
    
    def increment_failed(self):
        """Increment failed SMS counter."""
        self.total_failed += 1
    
    def update_balance(self, balance: float):
        """Update provider account balance."""
        self.current_balance = balance
        self.balance_updated_at = datetime.utcnow()


class SMSProviderStats(Base):
    """Daily SMS provider statistics."""
    
    __tablename__ = "sms_provider_stats"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_id = Column(UUID(as_uuid=True), nullable=False)
    date = Column(DateTime, nullable=False)
    
    # Daily counters
    messages_sent = Column(Integer, default=0)
    messages_failed = Column(Integer, default=0)
    messages_delivered = Column(Integer, default=0)
    
    # Performance metrics
    avg_response_time_ms = Column(Float)
    total_cost = Column(Float, default=0.0)
    
    # Error tracking
    error_codes = Column(JSON, default=dict)  # {error_code: count}
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<SMSProviderStats {self.provider_id} {self.date.date()}>"
    
    @property
    def success_rate(self) -> float:
        """Calculate daily success rate."""
        if self.messages_sent == 0:
            return 0.0
        return ((self.messages_sent - self.messages_failed) / self.messages_sent) * 100
    
    @property
    def delivery_rate(self) -> float:
        """Calculate delivery rate."""
        if self.messages_sent == 0:
            return 0.0
        return (self.messages_delivered / self.messages_sent) * 100


class SMSTemplate(Base):
    """SMS message templates for different events."""
    
    __tablename__ = "sms_templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    event_type = Column(String(50), nullable=False)  # ORDER_PLACED, ORDER_CONFIRMED, etc.
    
    # Template content
    message_template = Column(Text, nullable=False)
    variables = Column(JSON, default=list)  # List of available variables
    
    # Configuration
    is_active = Column(Boolean, default=True)
    max_length = Column(Integer, default=160)  # SMS length limit
    
    # Provider-specific templates
    provider_overrides = Column(JSON, default=dict)  # {provider_type: template}
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<SMSTemplate {self.name} ({self.event_type})>"
    
    def render_message(self, variables: dict, provider_type: str = None) -> str:
        """Render SMS message with variables."""
        # Use provider-specific template if available
        template = self.provider_overrides.get(provider_type, self.message_template)
        
        # Replace variables in template
        message = template
        for key, value in variables.items():
            placeholder = f"{{{key}}}"
            message = message.replace(placeholder, str(value))
        
        # Truncate if needed
        if len(message) > self.max_length:
            message = message[:self.max_length - 3] + "..."
        
        return message
    
    def validate_template(self) -> list:
        """Validate template and return list of errors."""
        errors = []
        
        if not self.message_template:
            errors.append("Message template is required")
        
        if len(self.message_template) > self.max_length:
            errors.append(f"Template exceeds maximum length of {self.max_length} characters")
        
        # Check for unclosed variables
        open_braces = self.message_template.count('{')
        close_braces = self.message_template.count('}')
        if open_braces != close_braces:
            errors.append("Template has unmatched curly braces")
        
        return errors


class SMSBlacklist(Base):
    """Blacklisted phone numbers for SMS."""
    
    __tablename__ = "sms_blacklist"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone_number = Column(String(20), nullable=False, unique=True)
    reason = Column(String(200))
    
    # Metadata
    added_at = Column(DateTime, default=datetime.utcnow)
    added_by = Column(String(100))
    
    def __repr__(self):
        return f"<SMSBlacklist {self.phone_number}>"


class SMSWebhook(Base):
    """SMS provider webhook logs for delivery status updates."""
    
    __tablename__ = "sms_webhooks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    provider_type = Column(String(50), nullable=False)
    message_id = Column(String(100))
    
    # Webhook data
    webhook_data = Column(JSON, nullable=False)
    delivery_status = Column(String(50))
    delivered_at = Column(DateTime)
    
    # Processing
    processed = Column(Boolean, default=False)
    processed_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    def __repr__(self):
        return f"<SMSWebhook {self.provider_type} {self.message_id}>"