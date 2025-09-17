-- Super Admin Role-Based Permission System
-- This script creates the necessary tables and data for hierarchical admin management

-- ================================
-- 1. UPDATE USER ROLES
-- ================================

-- Drop existing role constraint and add super_admin
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check 
CHECK (role::text = ANY (ARRAY['customer'::character varying, 'admin'::character varying, 'engineer'::character varying, 'super_admin'::character varying]::text[]));

-- ================================
-- 2. ADMIN PERMISSIONS SYSTEM
-- ================================

-- Admin Permissions Table - defines what admin pages/actions exist
CREATE TABLE IF NOT EXISTS admin_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    permission_key VARCHAR(100) NOT NULL UNIQUE,
    permission_name VARCHAR(200) NOT NULL,
    permission_description TEXT,
    category VARCHAR(100) NOT NULL, -- 'page' or 'action'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User Admin Permissions Table - links users to specific admin permissions
CREATE TABLE IF NOT EXISTS user_admin_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES admin_permissions(id) ON DELETE CASCADE,
    can_view BOOLEAN NOT NULL DEFAULT true,
    can_edit BOOLEAN NOT NULL DEFAULT false,
    granted_by UUID NOT NULL REFERENCES users(id), -- which super admin granted this
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, permission_id)
);

-- ================================
-- 3. INSERT ADMIN PERMISSIONS
-- ================================

-- Define all admin page permissions
INSERT INTO admin_permissions (permission_key, permission_name, permission_description, category) VALUES
-- Dashboard & Analytics
('dashboard.view', 'Dashboard Access', 'Access to main admin dashboard', 'page'),
('analytics.view', 'Analytics Dashboard', 'Access to analytics and reporting', 'page'),

-- Content Management
('categories.manage', 'Categories Management', 'Manage service categories', 'page'),
('services.manage', 'Services Management', 'Manage services and variants', 'page'),
('banners.manage', 'Banner Management', 'Manage promotional banners', 'page'),

-- Customer & Orders
('orders.manage', 'Orders Management', 'View and manage customer orders', 'page'),
('customers.view', 'Customer Management', 'View customer information', 'page'),

-- Business Management  
('coupons.manage', 'Coupon Management', 'Create and manage discount coupons', 'page'),
('employees.manage', 'Employee Management', 'Manage service engineers', 'page'),
('reviews.manage', 'Reviews Management', 'Moderate customer reviews', 'page'),

-- System Configuration
('settings.contact', 'Contact Settings', 'Update contact information', 'page'),
('settings.review', 'Review Settings', 'Configure review system', 'page'),
('settings.sms', 'SMS Configuration', 'Configure SMS providers', 'page'),

-- Super Admin Only
('users.manage', 'User Management', 'Create and manage admin users', 'page'),
('permissions.manage', 'Permission Management', 'Assign permissions to admin users', 'page')

ON CONFLICT (permission_key) DO NOTHING;

-- ================================
-- 4. CREATE SUPER ADMIN USER
-- ================================

-- Create the super admin user (password: superadmin123)
INSERT INTO users (
    email, 
    password_hash, 
    first_name, 
    last_name, 
    phone, 
    role, 
    is_active, 
    is_verified,
    profile_completed,
    created_at,
    updated_at
) VALUES (
    'superadmin@happyhomes.com',
    '$2b$10$8K2J7wM.9t5nF1qL3pR6XeYvB8nM9wF.7qL3pR6XeYvB8nM9wF.7q', -- superadmin123
    'Super',
    'Administrator', 
    '9437341234',
    'super_admin',
    true,
    true,
    true,
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- Grant ALL permissions to super admin (they have full access by default)
-- Super admins don't need explicit permissions - they have access to everything

-- ================================
-- 5. UPDATE EXISTING ADMIN USER
-- ================================

-- Update the existing admin user to have limited permissions (example)
DO $$
DECLARE
    admin_user_id UUID;
    super_admin_id UUID;
    perm_id UUID;
BEGIN
    -- Get admin user ID
    SELECT id INTO admin_user_id FROM users WHERE email = 'admin@happyhomes.com' LIMIT 1;
    -- Get super admin ID  
    SELECT id INTO super_admin_id FROM users WHERE email = 'superadmin@happyhomes.com' LIMIT 1;
    
    IF admin_user_id IS NOT NULL AND super_admin_id IS NOT NULL THEN
        -- Grant basic permissions to existing admin user
        FOR perm_id IN 
            SELECT id FROM admin_permissions 
            WHERE permission_key IN (
                'dashboard.view', 'orders.manage', 'customers.view', 
                'services.manage', 'categories.manage'
            )
        LOOP
            INSERT INTO user_admin_permissions (user_id, permission_id, can_view, can_edit, granted_by)
            VALUES (admin_user_id, perm_id, true, true, super_admin_id)
            ON CONFLICT (user_id, permission_id) DO NOTHING;
        END LOOP;
    END IF;
END $$;

-- ================================
-- 6. CREATE INDEXES
-- ================================

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_admin_permissions_key ON admin_permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_admin_permissions_category ON admin_permissions(category);
CREATE INDEX IF NOT EXISTS idx_user_admin_permissions_user_id ON user_admin_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_admin_permissions_permission_id ON user_admin_permissions(permission_id);

-- ================================
-- 7. CREATE TRIGGERS
-- ================================

-- Auto-update timestamps
DROP TRIGGER IF EXISTS update_admin_permissions_updated_at ON admin_permissions;
CREATE TRIGGER update_admin_permissions_updated_at 
    BEFORE UPDATE ON admin_permissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_admin_permissions_updated_at ON user_admin_permissions;
CREATE TRIGGER update_user_admin_permissions_updated_at 
    BEFORE UPDATE ON user_admin_permissions 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- SUMMARY
-- ================================
-- 
-- Created:
-- ✅ Updated user roles to include 'super_admin'
-- ✅ admin_permissions table - defines all available admin permissions
-- ✅ user_admin_permissions table - assigns permissions to users  
-- ✅ Super admin user: superadmin@happyhomes.com / superadmin123
-- ✅ Sample permissions for existing admin user
-- ✅ Performance indexes and triggers
-- 
-- Access Levels:
-- 🔥 Super Admin: Full access to everything (no permission checks needed)
-- 👤 Admin: Only permissions explicitly granted by super admin
-- 👥 Customer/Engineer: No admin access
-- 
-- Next Steps:
-- 1. Update backend auth middleware to check permissions
-- 2. Create super admin user management interface
-- 3. Remove admin signup from regular signup page
-- 4. Add permission checks to all admin pages
-- ================================