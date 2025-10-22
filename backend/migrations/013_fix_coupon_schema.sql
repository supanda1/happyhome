-- ==============================================================================
-- FIX COUPON SYSTEM SCHEMA MISMATCHES
-- Add missing columns and create coupon_usages table
-- ==============================================================================

-- Add missing columns to coupons table
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS minimum_order_amount DECIMAL(10,2) DEFAULT 0.00,
ADD COLUMN IF NOT EXISTS maximum_discount_amount DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS usage_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_limit_per_user INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS first_time_users_only BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS applicable_categories JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS applicable_services JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(100);

-- Update existing records to populate new columns from old ones
UPDATE coupons SET 
    title = name,
    minimum_order_amount = minimum_amount,
    maximum_discount_amount = maximum_discount,
    usage_count = used_count,
    coupon_code = code
WHERE title IS NULL;

-- Create coupon_usages table for tracking per-user usage
CREATE TABLE IF NOT EXISTS coupon_usages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_coupon_usages_coupon_user ON coupon_usages(coupon_id, user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usages_order ON coupon_usages(order_id);
CREATE INDEX IF NOT EXISTS idx_coupons_code_active ON coupons(code, is_active) WHERE is_active = true;

-- Add coupon_code to orders table if it doesn't exist
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(100),
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id);

-- Update WELCOME50 coupon to be a proper first-time user coupon
UPDATE coupons 
SET 
    first_time_users_only = true,
    applicable_categories = '[]'::jsonb,
    applicable_services = '[]'::jsonb,
    minimum_order_amount = 199.00,
    maximum_discount_amount = 500.00,
    title = 'Welcome Offer - First Time Users',
    description = 'Get 50% off on your first service booking (up to ₹500 off)',
    usage_limit_per_user = 1
WHERE code = 'WELCOME50';

-- Update other coupons
UPDATE coupons 
SET 
    first_time_users_only = false,
    applicable_categories = '[]'::jsonb,
    applicable_services = '[]'::jsonb,
    title = 'Save ₹100 on Orders Above ₹500',
    minimum_order_amount = 500.00,
    usage_limit_per_user = 3
WHERE code = 'SAVE100';

UPDATE coupons 
SET 
    first_time_users_only = true,
    applicable_categories = '[]'::jsonb,
    applicable_services = '[]'::jsonb,
    title = 'New User 25% Discount',
    minimum_order_amount = 299.00,
    maximum_discount_amount = 300.00,
    usage_limit_per_user = 1
WHERE code = 'NEWUSER25';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Coupon schema fixed - added missing columns and coupon_usages table';
    RAISE NOTICE 'Updated WELCOME50 coupon to be first-time user only with proper limits';
END $$;