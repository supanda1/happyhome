-- Create assignment history table for tracking engineer assignments
-- This table tracks all assignment changes for audit and analytics purposes

CREATE TABLE IF NOT EXISTS assignment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Reference to order and item
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
    
    -- Engineer information
    engineer_id UUID REFERENCES employees(id),
    engineer_name VARCHAR(100) NOT NULL,
    
    -- Assignment action details
    action_type VARCHAR(20) NOT NULL CHECK (action_type IN ('assigned', 'reassigned', 'unassigned')),
    notes TEXT,
    
    -- Tracking information
    created_by VARCHAR(50) NOT NULL, -- Could be 'system', admin user ID, or username
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assignment_history_order_id ON assignment_history(order_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_item_id ON assignment_history(item_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_engineer_id ON assignment_history(engineer_id);
CREATE INDEX IF NOT EXISTS idx_assignment_history_action_type ON assignment_history(action_type);
CREATE INDEX IF NOT EXISTS idx_assignment_history_created_at ON assignment_history(created_at);

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_assignment_history_order_item ON assignment_history(order_id, item_id);

-- Comments for documentation
COMMENT ON TABLE assignment_history IS 'Tracks all engineer assignment changes for orders';
COMMENT ON COLUMN assignment_history.action_type IS 'Type of assignment action: assigned, reassigned, or unassigned';
COMMENT ON COLUMN assignment_history.notes IS 'Additional notes about the assignment change';
COMMENT ON COLUMN assignment_history.created_by IS 'User or system that made the assignment change';

-- Grant permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT ON assignment_history TO your_app_user;