-- Migration: Add coupon_code column to orders table
-- This column is needed for order creation with coupon functionality

-- Add coupon_code column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS coupon_code VARCHAR(50);

-- Add index for better query performance on coupon_code lookups
CREATE INDEX IF NOT EXISTS idx_orders_coupon_code ON orders(coupon_code);

-- Add comment for documentation
COMMENT ON COLUMN orders.coupon_code IS 'Coupon code applied during order creation';

-- Verify the column was added (for logging purposes)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'coupon_code'
    ) THEN
        RAISE NOTICE '✅ Column coupon_code successfully added to orders table';
    ELSE
        RAISE NOTICE '❌ Failed to add coupon_code column to orders table';
    END IF;
END $$;