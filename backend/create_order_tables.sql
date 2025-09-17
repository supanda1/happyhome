-- Create order management tables for household services
-- This script creates the orders and order_items tables with proper relationships

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Customer information
    customer_id UUID NOT NULL REFERENCES users(id),
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    
    -- Service address (stored as JSON)
    service_address JSONB NOT NULL,
    
    -- Order totals
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    gst_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    service_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    final_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- Order status and priority
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
    priority VARCHAR(10) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    
    -- Notes
    notes TEXT,
    admin_notes TEXT,
    
    -- Customer feedback
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_review TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Service information
    service_id UUID NOT NULL REFERENCES services(id),
    service_name VARCHAR(100) NOT NULL,
    variant_id UUID REFERENCES service_variants(id),
    variant_name VARCHAR(50),
    
    -- Quantity and pricing
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    
    -- Category information for engineer assignment
    category_id UUID NOT NULL REFERENCES service_categories(id),
    subcategory_id UUID NOT NULL REFERENCES service_subcategories(id),
    
    -- Engineer assignment
    assigned_engineer_id UUID REFERENCES users(id),
    assigned_engineer_name VARCHAR(100),
    
    -- Item status and scheduling
    item_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (item_status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
    scheduled_date VARCHAR(20), -- YYYY-MM-DD format
    scheduled_time_slot VARCHAR(20), -- e.g., "09:00-11:00"
    completion_date VARCHAR(20), -- YYYY-MM-DD format
    
    -- Notes and feedback
    item_notes TEXT,
    item_rating INTEGER CHECK (item_rating >= 1 AND item_rating <= 5),
    item_review TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_priority ON orders(priority);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_service_id ON order_items(service_id);
CREATE INDEX IF NOT EXISTS idx_order_items_category_id ON order_items(category_id);
CREATE INDEX IF NOT EXISTS idx_order_items_subcategory_id ON order_items(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_order_items_assigned_engineer_id ON order_items(assigned_engineer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_item_status ON order_items(item_status);

-- Create trigger to update updated_at timestamp for orders
CREATE OR REPLACE FUNCTION update_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_orders_updated_at();

-- Insert sample data for testing (optional)
-- Note: This assumes you have existing users, services, categories, and subcategories

COMMENT ON TABLE orders IS 'Multi-item service orders with customer information and tracking';
COMMENT ON TABLE order_items IS 'Individual service items within orders with engineer assignment and tracking';

COMMENT ON COLUMN orders.order_number IS 'Unique order identifier for customer reference';
COMMENT ON COLUMN orders.service_address IS 'JSON object containing service delivery address';
COMMENT ON COLUMN orders.final_amount IS 'Final amount after applying discounts and adding taxes/charges';
COMMENT ON COLUMN order_items.item_status IS 'Individual item status independent of overall order status';
COMMENT ON COLUMN order_items.scheduled_date IS 'Date when service is scheduled (YYYY-MM-DD format)';
COMMENT ON COLUMN order_items.scheduled_time_slot IS 'Time slot for service delivery (e.g., 09:00-11:00)';

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON orders TO your_app_user;
-- GRANT ALL PRIVILEGES ON order_items TO your_app_user;