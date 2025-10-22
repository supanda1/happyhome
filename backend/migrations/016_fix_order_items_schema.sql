-- Fix order_items table schema by adding missing columns
-- This migration adds all the missing columns needed for order item management

-- Add category and subcategory columns for engineer assignment
ALTER TABLE order_items 
ADD COLUMN category_id UUID REFERENCES service_categories(id),
ADD COLUMN subcategory_id UUID REFERENCES service_subcategories(id);

-- Add engineer assignment columns
ALTER TABLE order_items 
ADD COLUMN assigned_engineer_id UUID REFERENCES users(id),
ADD COLUMN assigned_engineer_name VARCHAR(100);

-- Add item status column with proper enum type
ALTER TABLE order_items 
ADD COLUMN item_status order_status NOT NULL DEFAULT 'pending';

-- Add scheduling columns
ALTER TABLE order_items 
ADD COLUMN scheduled_date VARCHAR(20), -- YYYY-MM-DD format
ADD COLUMN scheduled_time_slot VARCHAR(20), -- e.g., "09:00-11:00"
ADD COLUMN completion_date VARCHAR(20); -- YYYY-MM-DD format

-- Add notes and feedback columns
ALTER TABLE order_items 
ADD COLUMN item_notes TEXT,
ADD COLUMN item_rating INTEGER CHECK (item_rating >= 1 AND item_rating <= 5),
ADD COLUMN item_review TEXT;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_category_id ON order_items(category_id);
CREATE INDEX IF NOT EXISTS idx_order_items_subcategory_id ON order_items(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_order_items_assigned_engineer_id ON order_items(assigned_engineer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item_status ON order_items(item_status);

-- Update existing order items to have proper category/subcategory references
-- This sets category_id and subcategory_id based on the service relationships
UPDATE order_items 
SET 
    category_id = s.category_id,
    subcategory_id = s.subcategory_id
FROM services s 
WHERE order_items.service_id = s.id;

-- Add comments for documentation
COMMENT ON COLUMN order_items.item_status IS 'Individual item status independent of overall order status';
COMMENT ON COLUMN order_items.scheduled_date IS 'Date when service is scheduled (YYYY-MM-DD format)';
COMMENT ON COLUMN order_items.scheduled_time_slot IS 'Time slot for service delivery (e.g., 09:00-11:00)';
COMMENT ON COLUMN order_items.completion_date IS 'Date when service was completed (YYYY-MM-DD format)';