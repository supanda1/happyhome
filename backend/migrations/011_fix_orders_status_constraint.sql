-- Migration: Fix orders status constraint to include 'confirmed'
-- Date: 2025-10-05
-- Issue: Frontend uses 'confirmed' status but database constraint doesn't allow it

-- Drop the existing constraint
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;

-- Add the new constraint with 'confirmed' included
ALTER TABLE orders ADD CONSTRAINT orders_status_check 
    CHECK (status IN ('pending', 'confirmed', 'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed'));

-- Update any existing orders that might have invalid status (if any)
-- This is safe because we're expanding the allowed values
UPDATE orders SET status = 'pending' WHERE status NOT IN ('pending', 'confirmed', 'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed');