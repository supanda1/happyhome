-- Migration: Add coupon_id column to orders table 
-- This column is needed for order creation with coupon functionality to reference the coupon table

-- Add coupon_id column to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES coupons(id);

-- Add index for better query performance on coupon_id lookups
CREATE INDEX IF NOT EXISTS idx_orders_coupon_id ON orders(coupon_id);

-- Add comment for documentation
COMMENT ON COLUMN orders.coupon_id IS 'Foreign key reference to the coupons table for applied coupons';

-- Verify the column was added (for logging purposes)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'orders' AND column_name = 'coupon_id'
    ) THEN
        RAISE NOTICE '✅ Column coupon_id successfully added to orders table';
    ELSE
        RAISE NOTICE '❌ Failed to add coupon_id column to orders table';
    END IF;
END $$;