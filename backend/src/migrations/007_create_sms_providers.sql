-- SMS Providers Migration
-- Creates tables for managing SMS provider configurations and statistics

-- Create SMS providers table
CREATE TABLE IF NOT EXISTS sms_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    provider_type VARCHAR(50) NOT NULL CHECK (provider_type IN ('twilio', 'textlocal', 'teleo', 'aws_sns', 'mock')),
    description TEXT,
    
    -- Configuration
    is_enabled BOOLEAN DEFAULT false,
    is_primary BOOLEAN DEFAULT false,
    priority INTEGER DEFAULT 1 CHECK (priority > 0),
    
    -- Provider-specific configuration (JSON)
    config_data JSONB NOT NULL DEFAULT '{}',
    
    -- Limits and throttling
    daily_limit INTEGER CHECK (daily_limit > 0),
    rate_limit_per_minute INTEGER DEFAULT 60 CHECK (rate_limit_per_minute > 0),
    cost_per_sms DECIMAL(10, 4) CHECK (cost_per_sms >= 0),
    
    -- Status and monitoring
    last_used_at TIMESTAMP WITH TIME ZONE,
    total_sent INTEGER DEFAULT 0 CHECK (total_sent >= 0),
    total_failed INTEGER DEFAULT 0 CHECK (total_failed >= 0),
    current_balance DECIMAL(15, 4),
    balance_updated_at TIMESTAMP WITH TIME ZONE,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- Create indexes for SMS providers
CREATE INDEX IF NOT EXISTS idx_sms_providers_type ON sms_providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_sms_providers_enabled ON sms_providers(is_enabled);
CREATE INDEX IF NOT EXISTS idx_sms_providers_primary ON sms_providers(is_primary);
CREATE INDEX IF NOT EXISTS idx_sms_providers_priority ON sms_providers(priority);

-- Create unique constraint for primary provider
CREATE UNIQUE INDEX IF NOT EXISTS idx_sms_providers_single_primary 
ON sms_providers(is_primary) WHERE is_primary = true;

-- Create SMS provider statistics table
CREATE TABLE IF NOT EXISTS sms_provider_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES sms_providers(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- Daily counters
    messages_sent INTEGER DEFAULT 0 CHECK (messages_sent >= 0),
    messages_failed INTEGER DEFAULT 0 CHECK (messages_failed >= 0),
    messages_delivered INTEGER DEFAULT 0 CHECK (messages_delivered >= 0),
    
    -- Performance metrics
    avg_response_time_ms DECIMAL(10, 2),
    total_cost DECIMAL(15, 4) DEFAULT 0.0 CHECK (total_cost >= 0),
    
    -- Error tracking
    error_codes JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint for provider per day
    UNIQUE(provider_id, date)
);

-- Create indexes for SMS provider stats
CREATE INDEX IF NOT EXISTS idx_sms_provider_stats_provider ON sms_provider_stats(provider_id);
CREATE INDEX IF NOT EXISTS idx_sms_provider_stats_date ON sms_provider_stats(date);
CREATE INDEX IF NOT EXISTS idx_sms_provider_stats_provider_date ON sms_provider_stats(provider_id, date);

-- Create SMS templates table
CREATE TABLE IF NOT EXISTS sms_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    
    -- Template content
    message_template TEXT NOT NULL,
    variables JSONB DEFAULT '[]',
    
    -- Configuration
    is_active BOOLEAN DEFAULT true,
    max_length INTEGER DEFAULT 160 CHECK (max_length > 0),
    
    -- Provider-specific templates
    provider_overrides JSONB DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint for event type
    UNIQUE(event_type)
);

-- Create indexes for SMS templates
CREATE INDEX IF NOT EXISTS idx_sms_templates_event_type ON sms_templates(event_type);
CREATE INDEX IF NOT EXISTS idx_sms_templates_active ON sms_templates(is_active);

-- Create SMS blacklist table
CREATE TABLE IF NOT EXISTS sms_blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phone_number VARCHAR(20) NOT NULL UNIQUE,
    reason VARCHAR(200),
    
    -- Metadata
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by VARCHAR(100)
);

-- Create index for SMS blacklist
CREATE INDEX IF NOT EXISTS idx_sms_blacklist_phone ON sms_blacklist(phone_number);

-- Create SMS webhook logs table
CREATE TABLE IF NOT EXISTS sms_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_type VARCHAR(50) NOT NULL,
    message_id VARCHAR(100),
    
    -- Webhook data
    webhook_data JSONB NOT NULL,
    delivery_status VARCHAR(50),
    delivered_at TIMESTAMP WITH TIME ZONE,
    
    -- Processing
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for SMS webhooks
CREATE INDEX IF NOT EXISTS idx_sms_webhooks_provider ON sms_webhooks(provider_type);
CREATE INDEX IF NOT EXISTS idx_sms_webhooks_message_id ON sms_webhooks(message_id);
CREATE INDEX IF NOT EXISTS idx_sms_webhooks_processed ON sms_webhooks(processed);
CREATE INDEX IF NOT EXISTS idx_sms_webhooks_created ON sms_webhooks(created_at);

-- Add updated_at trigger for sms_providers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_sms_providers_updated_at ON sms_providers;
CREATE TRIGGER update_sms_providers_updated_at 
    BEFORE UPDATE ON sms_providers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sms_templates_updated_at ON sms_templates;
CREATE TRIGGER update_sms_templates_updated_at 
    BEFORE UPDATE ON sms_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default SMS templates
INSERT INTO sms_templates (name, event_type, message_template, variables) VALUES
('Order Placed', 'ORDER_PLACED', 
 'Hi {customer_name}! Your order #{order_number} for {service_names} has been placed successfully. Total: ₹{final_amount}. Happy Homes team will contact you soon.', 
 '["customer_name", "order_number", "service_names", "final_amount"]'),

('Order Confirmed', 'ORDER_CONFIRMED', 
 'Great news {customer_name}! Your order #{order_number} is confirmed. Our expert will visit on {scheduled_date} between {time_slot}. Thank you for choosing Happy Homes!', 
 '["customer_name", "order_number", "scheduled_date", "time_slot"]'),

('Engineer Assigned', 'ENGINEER_ASSIGNED', 
 'Hi {customer_name}! Engineer {engineer_name} ({engineer_phone}) has been assigned to your order #{order_number}. Service: {service_name}. Happy Homes', 
 '["customer_name", "engineer_name", "engineer_phone", "order_number", "service_name"]'),

('Service Started', 'SERVICE_STARTED', 
 'Your service has started! Engineer {engineer_name} is now working on {service_name} at your location. Order #{order_number}. Happy Homes', 
 '["customer_name", "engineer_name", "service_name", "order_number"]'),

('Service Completed', 'SERVICE_COMPLETED', 
 'Service completed! {service_name} for order #{order_number} is done. Please rate our service. Thank you for choosing Happy Homes!', 
 '["customer_name", "service_name", "order_number"]'),

('Payment Due', 'PAYMENT_DUE', 
 'Payment reminder: ₹{due_amount} is due for order #{order_number}. Please complete payment to avoid service interruption. Happy Homes', 
 '["customer_name", "due_amount", "order_number"]'),

('Payment Received', 'PAYMENT_RECEIVED', 
 'Payment received! ₹{amount} for order #{order_number} has been confirmed. Thank you for your business! - Happy Homes', 
 '["customer_name", "amount", "order_number"]')

ON CONFLICT (event_type) DO NOTHING;

-- Insert mock SMS provider for development
INSERT INTO sms_providers (
    name, 
    provider_type, 
    description, 
    is_enabled, 
    is_primary,
    priority, 
    config_data, 
    cost_per_sms,
    created_by
) VALUES (
    'Mock SMS Provider (Development)',
    'mock',
    'Mock SMS provider for development and testing purposes. Does not send real SMS messages.',
    true,
    true,
    1,
    '{"simulate_failures": false, "failure_rate": 0.1}',
    0.0,
    'system'
) ON CONFLICT DO NOTHING;