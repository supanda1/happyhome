-- ==============================================================================
-- COMPREHENSIVE HOUSEHOLD SERVICES DATABASE SETUP - PRODUCTION READY
-- This migration creates all tables and inserts ALL working data
-- Updated: 2025-01-20 - Matches current production database
-- ==============================================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS assignment_history CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS service_variants CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS cart CASCADE;
DROP TABLE IF EXISTS refresh_tokens CASCADE;
DROP TABLE IF EXISTS user_addresses CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS services CASCADE;
DROP TABLE IF EXISTS service_subcategories CASCADE;
DROP TABLE IF EXISTS service_categories CASCADE;
DROP TABLE IF EXISTS subcategories CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS contact_settings CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;
DROP TYPE IF EXISTS assignment_status CASCADE;
DROP TYPE IF EXISTS banner_position CASCADE;

-- ==============================================================================
-- ENUMS AND TYPES - Updated to match Python models
-- ==============================================================================

-- Note: Python models use VARCHAR for roles and statuses for flexibility
-- So we'll use VARCHAR instead of ENUMs to match the Python models exactly

-- ==============================================================================
-- CORE TABLES
-- ==============================================================================

-- Users table - Updated to match Python User model
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Authentication fields
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    
    -- Profile fields
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    
    -- Role and status (using VARCHAR to match Python model)
    role VARCHAR(20) NOT NULL DEFAULT 'customer',
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    
    -- Authentication tracking
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    
    -- Profile completion
    profile_completed BOOLEAN NOT NULL DEFAULT false,
    
    -- Avatar/profile image
    avatar_url VARCHAR(500),
    
    -- User preferences (JSON storage for flexible settings)
    preferences JSONB DEFAULT '{}'::jsonb
);

-- User addresses - Updated to match Python UserAddress model
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    
    -- Address type
    type VARCHAR(20) NOT NULL DEFAULT 'home',
    
    -- Address details
    title VARCHAR(100) NOT NULL,
    full_address TEXT NOT NULL,
    landmark VARCHAR(200),
    
    -- Location details
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) NOT NULL DEFAULT 'India',
    
    -- GPS coordinates (optional)
    latitude FLOAT,
    longitude FLOAT,
    
    -- Status
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true
);

-- Refresh tokens - Updated to match Python RefreshToken model
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    token VARCHAR(500) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_revoked BOOLEAN NOT NULL DEFAULT false,
    
    -- Session tracking
    device_info VARCHAR(200),
    ip_address VARCHAR(45), -- IPv6 max length
    user_agent TEXT
);

-- Service categories
CREATE TABLE service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    image_path VARCHAR(255),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service subcategories
CREATE TABLE service_subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES service_categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    image_paths JSONB DEFAULT '[]',
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Services - Updated to match Python Service model
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Basic information
    name VARCHAR(200) NOT NULL,
    category_id UUID NOT NULL REFERENCES service_categories(id),
    subcategory_id UUID REFERENCES service_subcategories(id),
    description TEXT NOT NULL,
    short_description VARCHAR(300) NOT NULL,
    
    -- Base pricing (can be overridden by variants)
    base_price FLOAT NOT NULL,
    discounted_price FLOAT,
    
    -- Service details
    duration INTEGER NOT NULL, -- Duration in minutes
    
    -- JSON fields for flexible data storage
    inclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
    exclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
    requirements JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Ratings and reviews
    rating FLOAT NOT NULL DEFAULT 0.0,
    review_count INTEGER NOT NULL DEFAULT 0,
    booking_count INTEGER NOT NULL DEFAULT 0,
    
    -- Status and visibility
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_featured BOOLEAN NOT NULL DEFAULT false,
    
    -- Tags and categorization
    tags JSONB NOT NULL DEFAULT '[]'::jsonb,
    
    -- Availability settings
    availability_settings JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    -- Image paths for service images (from Pexels downloads)
    image_paths JSONB DEFAULT '[]'::jsonb
);

-- Service variants - Updated to match Python ServiceVariant model
CREATE TABLE service_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    base_price FLOAT NOT NULL,
    discounted_price FLOAT,
    duration INTEGER NOT NULL, -- Duration in minutes
    
    -- JSON fields for flexible data storage
    inclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
    exclusions JSONB NOT NULL DEFAULT '[]'::jsonb,
    features JSONB NOT NULL DEFAULT '{}'::jsonb,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Service photos table - matches ServicePhoto model
CREATE TABLE service_photos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    service_id UUID NOT NULL REFERENCES services(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    alt_text VARCHAR(200) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Employees
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    expertise JSONB DEFAULT '[]',
    rating DECIMAL(3,2) DEFAULT 0.00,
    total_jobs INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    hire_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Orders - Updated to match Python Order model
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Order identification
    order_number VARCHAR(50) UNIQUE NOT NULL,
    
    -- Customer information (using String to match model)
    customer_id VARCHAR(255) NOT NULL,
    customer_name VARCHAR(100) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    customer_email VARCHAR(100) NOT NULL,
    
    -- Service address (stored as JSON for flexibility)
    service_address JSONB NOT NULL,
    
    -- Order totals
    total_amount FLOAT NOT NULL,
    discount_amount FLOAT NOT NULL DEFAULT 0.0,
    gst_amount FLOAT NOT NULL DEFAULT 0.0,
    service_charge FLOAT NOT NULL DEFAULT 0.0,
    final_amount FLOAT NOT NULL,
    
    -- Order status and priority
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    priority VARCHAR(10) NOT NULL DEFAULT 'medium',
    
    -- Notes
    notes TEXT,
    admin_notes TEXT,
    
    -- Customer feedback
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_review TEXT
);

-- Order items - Updated to match Python OrderItem model
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Order relationship
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Service information (using String IDs to match model)
    service_id VARCHAR(100) NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    variant_id VARCHAR(100),
    variant_name VARCHAR(50),
    
    -- Quantity and pricing
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price FLOAT NOT NULL,
    total_price FLOAT NOT NULL,
    
    -- Category information for engineer assignment
    category_id VARCHAR(100) NOT NULL,
    subcategory_id VARCHAR(100) NOT NULL,
    
    -- Engineer assignment
    assigned_engineer_id VARCHAR(100),
    assigned_engineer_name VARCHAR(100),
    
    -- Item status and scheduling
    item_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    scheduled_date VARCHAR(20), -- YYYY-MM-DD format
    scheduled_time_slot VARCHAR(20), -- e.g., "09:00-11:00"
    completion_date VARCHAR(20), -- YYYY-MM-DD format
    
    -- Notes and feedback
    item_notes TEXT,
    item_rating INTEGER CHECK (item_rating >= 1 AND item_rating <= 5),
    item_review TEXT
);

-- Shopping cart
CREATE TABLE cart (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cart items
CREATE TABLE cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cart_id UUID REFERENCES cart(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    service_variant_id UUID REFERENCES service_variants(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    customizations JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assignment history
CREATE TABLE assignment_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    employee_id UUID REFERENCES employees(id) ON DELETE CASCADE,
    status assignment_status DEFAULT 'assigned',
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accepted_at TIMESTAMP,
    completed_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Coupons
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
    discount_value DECIMAL(10,2) NOT NULL,
    minimum_amount DECIMAL(10,2) DEFAULT 0.00,
    maximum_discount DECIMAL(10,2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Banners
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    button_text VARCHAR(100),
    button_link VARCHAR(255),
    image_url VARCHAR(255),
    background_color VARCHAR(7) DEFAULT '#ffffff',
    text_color VARCHAR(7) DEFAULT '#000000',
    position banner_position NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contact settings
CREATE TABLE contact_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) DEFAULT 'Happy Homes',
    tagline VARCHAR(255) DEFAULT 'Your Trusted Home Service Partner',
    phone VARCHAR(20) DEFAULT '9437341234',
    emergency_phone VARCHAR(20) DEFAULT '9437341234',
    whatsapp_number VARCHAR(20) DEFAULT '9437341234',
    email VARCHAR(255) DEFAULT 'care@happyhomesworld.com',
    address TEXT DEFAULT 'Bhubaneswar, Odisha 751001',
    facebook_url VARCHAR(255) DEFAULT 'https://www.facebook.com/happyhomes.official',
    twitter_url VARCHAR(255),
    instagram_url VARCHAR(255),
    linkedin_url VARCHAR(255),
    website_url VARCHAR(255),
    updated_by UUID,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legacy tables for backward compatibility
CREATE TABLE categories AS SELECT * FROM service_categories WHERE false;
CREATE TABLE subcategories AS SELECT * FROM service_subcategories WHERE false;

-- ==============================================================================
-- INDEXES FOR PERFORMANCE - Updated for Python models
-- ==============================================================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_is_active ON users(is_active);

-- User addresses indexes
CREATE INDEX idx_user_addresses_user_id ON user_addresses(user_id);
CREATE INDEX idx_user_addresses_is_active ON user_addresses(is_active);
CREATE INDEX idx_user_addresses_user_active ON user_addresses(user_id, is_active);
CREATE INDEX idx_user_addresses_default ON user_addresses(user_id, is_default) WHERE is_default = true;

-- Refresh tokens indexes
CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
CREATE INDEX idx_refresh_tokens_is_revoked ON refresh_tokens(is_revoked);

-- Service categories indexes
CREATE INDEX idx_service_categories_is_active ON service_categories(is_active);
CREATE INDEX idx_service_categories_sort_order ON service_categories(sort_order);

-- Service subcategories indexes
CREATE INDEX idx_service_subcategories_category_id ON service_subcategories(category_id);
CREATE INDEX idx_service_subcategories_is_active ON service_subcategories(is_active);
CREATE INDEX idx_service_subcategories_sort_order ON service_subcategories(sort_order);

-- Services indexes
CREATE INDEX idx_services_category_id ON services(category_id);
CREATE INDEX idx_services_subcategory_id ON services(subcategory_id);
CREATE INDEX idx_services_is_active ON services(is_active);
CREATE INDEX idx_services_is_featured ON services(is_featured);
CREATE INDEX idx_services_rating ON services(rating);
CREATE INDEX idx_services_base_price ON services(base_price);

-- Service photos indexes
CREATE INDEX idx_service_photos_service_id ON service_photos(service_id);
CREATE INDEX idx_service_photos_is_primary ON service_photos(is_primary);
CREATE INDEX idx_service_photos_sort_order ON service_photos(sort_order);

-- Service variants indexes
CREATE INDEX idx_service_variants_service_id ON service_variants(service_id);
CREATE INDEX idx_service_variants_is_active ON service_variants(is_active);
CREATE INDEX idx_service_variants_sort_order ON service_variants(sort_order);

-- Orders indexes
CREATE INDEX idx_orders_customer_id ON orders(customer_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_priority ON orders(priority);
CREATE INDEX idx_orders_order_number ON orders(order_number);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_service_id ON order_items(service_id);
CREATE INDEX idx_order_items_category_id ON order_items(category_id);
CREATE INDEX idx_order_items_subcategory_id ON order_items(subcategory_id);
CREATE INDEX idx_order_items_assigned_engineer_id ON order_items(assigned_engineer_id);
CREATE INDEX idx_order_items_item_status ON order_items(item_status);

-- Other indexes
CREATE INDEX idx_employees_is_available ON employees(is_available);
CREATE INDEX idx_employees_is_active ON employees(is_active);

-- ==============================================================================
-- SEED DATA - CATEGORIES (EXACT WORKING IDS)
-- ==============================================================================

INSERT INTO service_categories (id, name, description, icon, sort_order, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'Plumbing', 'Professional plumbing repair and installation services for your home', '🔧', 1, true),
('550e8400-e29b-41d4-a716-446655440002', 'Electrical', 'Expert electrical work and appliance repair services', '⚡', 2, true),
('550e8400-e29b-41d4-a716-446655440003', 'Cleaning', 'Professional cleaning and sanitization services', '🧹', 3, true),
('550e8400-e29b-41d4-a716-446655440004', 'Call A Service', 'On-demand service booking and logistics support', '📞', 4, true),
('550e8400-e29b-41d4-a716-446655440005', 'Finance & Insurance', 'Financial documentation and insurance services', '💰', 5, true),
('550e8400-e29b-41d4-a716-446655440006', 'Personal Care', 'Health, beauty, and personal care services', '💆', 6, true),
('550e8400-e29b-41d4-a716-446655440007', 'Civil Work', 'Construction, painting, and civil engineering services', '🏗️', 7, true);

-- ==============================================================================
-- SEED DATA - SUBCATEGORIES (EXACT WORKING IDS AND NAMES)
-- ==============================================================================

INSERT INTO service_subcategories (id, category_id, name, description, icon, sort_order, is_active) VALUES
-- Plumbing subcategories
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Bath Fittings', 'Shower heads, taps, and bathroom fixture installation', '🚿', 1, true),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Basin & Sink', 'Sink installation and drainage solutions', '🚰', 2, true),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Toilets', 'Toilet installation and repair services', '🚽', 3, true),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Water Tank', 'Water tank installation and maintenance', '🫗', 4, true),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'Pipes', 'Pipe installation and connector services', '🔗', 5, true),
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'Grouting', 'Professional grouting and sealing services', '🔧', 6, true),

-- Electrical subcategories
('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', 'Wiring Installation', 'House wiring and electrical installation', '🔌', 1, true),
('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', 'Appliance Repair', 'Home appliance repair and maintenance', '🔧', 2, true),
('650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 'Switch & Socket', 'Switch and socket installation', '🔘', 3, true),
('650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', 'Fan Installation', 'Ceiling and wall fan installation', '🌀', 4, true),
('650e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', 'Lighting Solutions', 'LED and decorative lighting installation', '💡', 5, true),
('650e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440002', 'Electrical Safety Check', 'Electrical safety inspection and testing', '🔒', 6, true),

-- Cleaning subcategories
('650e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440003', 'Bathroom Cleaning', 'Deep bathroom cleaning and sanitization', '🚿', 1, true),
('650e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440003', 'AC Cleaning', 'Air conditioner cleaning and maintenance', '❄️', 2, true),
('650e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440003', 'Water Tank Cleaning', 'Water tank cleaning and sanitization', '💧', 3, true),
('650e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440003', 'Car Wash', 'Professional car washing services', '🚗', 4, true),
('650e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440003', 'Septic Tank Cleaning', 'Septic tank cleaning and maintenance', '🔄', 5, true),
('650e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440003', 'Water Purifier Cleaning', 'Water purifier cleaning and filter replacement', '💧', 6, true),

-- Call A Service subcategories
('650e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440004', 'Courier Service', 'Pickup and delivery services', '📦', 1, true),
('650e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440004', 'CAB Booking', 'Taxi and cab booking services', '🚕', 2, true),
('650e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440004', 'Vehicle Breakdown', 'Vehicle breakdown assistance', '🔧', 3, true),
('650e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440004', 'Photographer', 'Event and product photography services', '📸', 4, true),

-- Finance & Insurance subcategories
('650e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440005', 'GST Registration', 'GST registration and filing', '📊', 1, true),
('650e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440005', 'PAN Card Services', 'PAN card application and services', '🆔', 2, true),
('650e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440005', 'ITR Filing', 'Income tax return filing', '📋', 3, true),
('650e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440005', 'Stamp Paper & Agreement', 'Legal documentation and stamp paper services', '⚖️', 4, true),

-- Personal Care subcategories
('650e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440006', 'Medicine Delivery', 'Home medicine delivery services', '💊', 1, true),
('650e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440006', 'Salon at Home', 'Beauty and salon services at home', '💅', 2, true),
('650e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440006', 'Health Checkup', 'Health checkup and physiotherapy', '🏥', 3, true),

-- Civil Work subcategories
('650e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440007', 'House Painting', 'Interior and exterior house painting', '🎨', 1, true),
('650e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440007', 'Tile Work', 'Tile and marble installation', '🏠', 2, true),
('650e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440007', 'Home Repairs', 'General home repair services', '🔨', 3, true);

-- ==============================================================================
-- SEED DATA - COMPREHENSIVE SERVICES (ALL WORKING SERVICES)
-- ==============================================================================

INSERT INTO services (id, category_id, subcategory_id, name, description, short_description, base_price, discounted_price, duration, 
                     inclusions, exclusions, requirements, tags, rating, review_count, booking_count, is_active, is_featured) VALUES

-- Plumbing Services
('750e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 
'Bath Fitting Installation', 'Professional installation and repair of all types of bath fittings including shower heads, taps, and bathroom fixtures with proper sealing and testing.', 
'Complete bath fitting installation and repair service', 299, 199, 90,
'["Professional plumber visit", "Bath fitting installation/repair", "Water pressure testing", "Leak detection and fixing", "30-day service warranty"]',
'["Cost of fittings", "Drilling charges in tiles", "Major plumbing modifications", "Water connection charges"]',
'["Access to bathroom", "Water supply available", "Existing plumbing connection"]',
'["plumbing", "bath", "fittings", "installation", "repair"]', 4.5, 127, 89, true, true),

('750e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', 
'Basin & Sink Installation', 'Complete basin and sink installation including plumbing connections, drainage setup, and sealing work for kitchen and bathroom basins.', 
'Professional basin and sink installation service', 399, 299, 120,
'["Professional plumber visit", "Basin/sink mounting", "Plumbing connections", "Drainage pipe connection", "Water flow testing", "45-day warranty"]',
'["Cost of basin/sink", "Wall drilling in granite/marble", "Major pipe routing", "Electrical work"]',
'["Clear access to installation area", "Water supply connection", "Proper wall support"]',
'["plumbing", "basin", "sink", "kitchen", "bathroom", "installation"]', 4.3, 98, 67, true, false),

('750e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', 
'Toilet Installation & Repair', 'Complete toilet installation, repair, and replacement services with proper sealing and water connections.', 
'Professional toilet installation and repair service', 499, 399, 150,
'["Expert plumber visit", "Toilet installation/repair", "Water connection setup", "Proper sealing", "Cleaning after work", "60-day warranty"]',
'["Cost of toilet and accessories", "Flooring/tiling work", "Major plumbing modifications", "Septic tank work"]',
'["Access to bathroom", "Water supply available", "Proper drainage system", "Level flooring"]',
'["plumbing", "toilet", "bathroom", "installation", "repair"]', 4.6, 156, 112, true, true),

('750e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', 
'Toilet Services (Premium)', 'Premium toilet installation and repair services with enhanced features and extended warranty coverage.', 
'Premium toilet service with enhanced features', 599, 499, 180,
'["Expert plumber visit", "Premium toilet installation", "Advanced sealing technology", "Water efficiency optimization", "90-day warranty", "Priority support"]',
'["Cost of premium toilet", "Specialized fittings", "Advanced plumbing modifications", "Premium accessories"]',
'["Access to bathroom", "Water supply available", "Proper drainage system", "Premium fixture compatibility"]',
'["plumbing", "toilet", "premium", "installation", "repair"]', 4.8, 89, 62, true, true),

('750e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440004', 
'Water Tank Installation', 'Professional water tank installation and maintenance services for residential properties.', 
'Water tank installation and maintenance service', 799, 599, 240,
'["Professional plumber visit", "Tank installation", "Pipe connections", "Water flow testing", "Structural support check", "60-day warranty"]',
'["Cost of water tank", "Structural modifications", "Pump installation", "Electrical work"]',
'["Roof access available", "Structural support adequate", "Water supply connection", "Installation clearance"]',
'["plumbing", "water tank", "installation", "maintenance"]', 4.4, 67, 45, true, false),

('750e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440005', 
'Pipe & Connector Installation', 'Professional pipe installation, connector fitting, and plumbing system setup for residential properties.', 
'Expert pipe and connector installation service', 349, 249, 120,
'["Professional plumber visit", "Pipe cutting and fitting", "Connector installation", "Pressure testing", "Leak detection", "30-day warranty"]',
'["Cost of pipes and connectors", "Wall breaking charges", "Major route changes", "Pump installation"]',
'["Clear access to work area", "Water supply connection", "Proper planning of pipe routes"]',
'["plumbing", "pipes", "connectors", "installation", "water supply"]', 4.2, 78, 56, true, false),

('750e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440006', 
'Professional Grouting Service', 'Expert grouting and sealing services for tiles, bathrooms, and kitchens with waterproof solutions.', 
'Professional tile grouting and sealing service', 199, 149, 90,
'["Professional worker visit", "Tile grouting", "Waterproof sealing", "Cleaning after work", "Quality materials", "30-day warranty"]',
'["Cost of grouting materials", "Tile replacement", "Major structural work", "Electrical work"]',
'["Access to work area", "Proper ventilation", "Clean surface preparation"]',
'["grouting", "tiles", "sealing", "bathroom", "kitchen"]', 4.1, 45, 34, true, false),

-- Electrical Services
('750e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440011', 
'Wiring Installation', 'Professional house wiring installation and electrical system setup for residential properties.', 
'Expert house wiring installation service', 799, 599, 240,
'["Certified electrician visit", "Wiring installation", "Safety checks", "Circuit testing", "60-day warranty", "ISI materials"]',
'["Cost of wires and materials", "Wall cutting charges", "Meter box installation", "High voltage work"]',
'["Access to electrical areas", "Power disconnection", "Proper planning", "Safety clearance"]',
'["electrical", "wiring", "installation", "house", "safety"]', 4.5, 134, 89, true, true),

('750e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440014', 
'Ceiling Fan Installation', 'Professional ceiling fan installation with proper mounting and electrical connections.', 
'Expert ceiling fan installation service', 299, 199, 90,
'["Certified electrician visit", "Fan installation", "Electrical connections", "Balance testing", "Safety check", "30-day warranty"]',
'["Cost of ceiling fan", "Ceiling reinforcement", "Additional wiring", "Regulator installation"]',
'["Ceiling access available", "Proper electrical supply", "Adequate ceiling support"]',
'["electrical", "fan", "installation", "ceiling", "mounting"]', 4.3, 156, 123, true, false),

('750e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440013', 
'Switch & Socket Installation', 'Professional switch and socket installation with proper wiring and safety measures.', 
'Expert switch and socket installation service', 199, 149, 60,
'["Certified electrician visit", "Switch/socket installation", "Wiring connections", "Safety testing", "30-day warranty"]',
'["Cost of switches/sockets", "Wall cutting charges", "Additional wiring", "Board modifications"]',
'["Access to electrical points", "Power supply available", "Wall preparation"]',
'["electrical", "switch", "socket", "installation", "wiring"]', 4.4, 189, 167, true, true),

('750e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440012', 
'Home Appliance Repair', 'Expert repair services for all home appliances including refrigerators, washing machines, and kitchen appliances.', 
'Professional home appliance repair service', 399, 299, 120,
'["Expert technician visit", "Appliance diagnosis", "Repair service", "Performance testing", "30-day warranty", "Genuine parts"]',
'["Cost of spare parts", "Appliance transportation", "Major component replacement", "Gas filling"]',
'["Access to appliance", "Power supply available", "Appliance manual", "Clear work space"]',
'["electrical", "appliance", "repair", "maintenance", "home"]', 4.2, 234, 189, true, false),

('750e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440015', 
'Lighting Solutions', 'Professional lighting installation including LED lights, chandeliers, and decorative lighting solutions.', 
'Expert lighting installation and setup service', 499, 399, 150,
'["Certified electrician visit", "Light fixture installation", "Wiring setup", "Switch configuration", "Testing", "45-day warranty"]',
'["Cost of lights and fixtures", "Ceiling work charges", "Dimmer installation", "Smart home integration"]',
'["Access to installation area", "Proper ceiling support", "Power supply nearby", "Height clearance"]',
'["electrical", "lighting", "LED", "chandelier", "decoration"]', 4.6, 112, 87, true, true),

-- Cleaning Services
('750e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440021', 
'Deep Bathroom Cleaning', 'Thorough bathroom cleaning and sanitization service with professional cleaning agents and equipment.', 
'Professional deep bathroom cleaning service', 299, 199, 120,
'["Professional cleaning team", "Deep cleaning", "Sanitization", "Tile and grout cleaning", "Fixture polishing", "30-day guarantee"]',
'["Bathroom renovation", "Fixture replacement", "Plumbing repairs", "Electrical work"]',
'["Access to bathroom", "Water supply available", "Ventilation available", "Basic cleaning access"]',
'["cleaning", "bathroom", "sanitization", "deep clean", "hygiene"]', 4.4, 203, 156, true, true),

('750e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440022', 
'AC Cleaning Service', 'Professional air conditioner cleaning and maintenance with filter cleaning and sanitization.', 
'Expert AC cleaning and maintenance service', 399, 299, 90,
'["Certified technician visit", "AC deep cleaning", "Filter cleaning/replacement", "Coil cleaning", "Performance check", "30-day warranty"]',
'["Spare parts cost", "Gas refilling", "Major repairs", "Electrical work"]',
'["Access to AC unit", "Power supply available", "Ladder access if needed", "Area clearance"]',
'["cleaning", "AC", "air conditioner", "maintenance", "filter"]', 4.3, 167, 134, true, false),

('750e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440024', 
'Car Wash Service', 'Professional car washing and detailing service with interior and exterior cleaning.', 
'Professional car wash and detailing service', 199, 149, 60,
'["Professional team", "Exterior wash", "Interior cleaning", "Vacuum cleaning", "Wax polishing", "Water wash"]',
'["Engine cleaning", "Paint protection", "Seat covers", "Air fresheners"]',
'["Car access available", "Water supply nearby", "Parking space", "Vehicle keys"]',
'["cleaning", "car", "wash", "detailing", "automotive"]', 4.1, 289, 234, true, true),

('750e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440023', 
'Water Tank Cleaning', 'Comprehensive water tank cleaning and sanitization service for overhead and underground tanks.', 
'Professional water tank cleaning service', 499, 399, 180,
'["Professional cleaning team", "Complete tank draining", "Sediment removal", "Disinfection", "Water quality testing", "45-day guarantee"]',
'["Water refilling charges", "Tank repairs", "Plumbing modifications", "Pump maintenance"]',
'["Tank access available", "Water supply for cleaning", "Alternative water arrangement", "Safety clearance"]',
'["cleaning", "water tank", "sanitization", "health", "maintenance"]', 4.5, 156, 123, true, true),

-- Call A Service
('750e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440031', 
'Courier Pickup & Delivery', 'Reliable courier pickup and delivery service for documents and small packages within the city.', 
'Professional courier pickup and delivery service', 99, 79, 60,
'["Professional courier", "Pickup service", "Safe delivery", "Tracking service", "Insurance coverage", "Same day delivery"]',
'["Interstate charges", "Fragile item guarantee", "COD charges", "Storage charges"]',
'["Proper addressing", "Contact availability", "Package ready", "Identity verification"]',
'["courier", "delivery", "pickup", "logistics", "shipping"]', 4.2, 345, 289, true, false),

('750e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440032', 
'Local Cab Booking', 'Convenient local cab booking service with verified drivers and safe transportation.', 
'Reliable local cab booking service', 199, 149, 30,
'["Verified driver", "GPS tracking", "Safe transportation", "24/7 support", "Clean vehicle", "Timely pickup"]',
'["Toll charges", "Parking fees", "Interstate travel", "Waiting charges"]',
'["Pickup location access", "Contact availability", "Proper addressing", "Payment ready"]',
'["cab", "taxi", "transportation", "booking", "local"]', 4.0, 567, 456, true, true),

('750e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440034', 
'Professional Photography', 'Expert photography services for events, portraits, and special occasions with professional equipment.', 
'Professional photography for events and portraits', 2999, 2499, 240,
'["Professional photographer", "High-quality equipment", "Photo editing", "Digital copies", "Online gallery", "Same-day preview"]',
'["Printed photos", "Album creation", "Drone photography", "Video recording", "Additional photographer"]',
'["Event venue access", "Adequate lighting", "Photography permissions", "Event timeline"]',
'["photography", "events", "professional", "portraits", "memories"]', 4.7, 89, 67, true, true),

-- Finance & Insurance Services
('750e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440041', 
'GST Registration Service', 'Complete GST registration service with documentation assistance and government filing support.', 
'Professional GST registration and filing service', 1999, 1499, 120,
'["GST expert consultation", "Document preparation", "Government filing", "Registration assistance", "Compliance guidance", "Follow-up support"]',
'["Government fees", "Additional documents", "Legal complications", "Court fees"]',
'["Business documents", "Identity proofs", "Address proofs", "Bank details", "Contact availability"]',
'["GST", "registration", "tax", "business", "compliance"]', 4.3, 167, 134, true, false),

('750e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440042', 
'PAN Card Application', 'Complete PAN card application service with form filling and document submission assistance.', 
'Professional PAN card application service', 599, 499, 90,
'["Expert assistance", "Form filling", "Document verification", "Application submission", "Status tracking", "Correction support"]',
'["Government fees", "Courier charges", "Additional documents", "Urgent processing fees"]',
'["Identity proofs", "Address proofs", "Photographs", "Contact details", "Signature verification"]',
'["PAN", "card", "application", "tax", "identity"]', 4.1, 234, 189, true, true),

('750e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440043', 
'ITR Filing Service', 'Professional income tax return filing service with expert consultation and e-filing support.', 
'Expert ITR filing and tax consultation service', 999, 799, 120,
'["Tax expert consultation", "ITR preparation", "E-filing service", "Tax calculation", "Refund assistance", "Compliance check"]',
'["Tax payments", "Additional forms", "Audit charges", "Legal consultation"]',
'["Income documents", "Investment proofs", "Bank statements", "Previous ITR", "Contact availability"]',
'["ITR", "tax", "filing", "income", "refund"]', 4.4, 123, 98, true, false),

-- Personal Care Services
('750e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440051', 
'Medicine Home Delivery', 'Reliable medicine delivery service from certified pharmacies with prescription verification.', 
'Professional medicine home delivery service', 49, 29, 30,
'["Certified pharmacy", "Prescription verification", "Home delivery", "Quality medicines", "Emergency delivery", "Digital receipt"]',
'["Medicine cost", "Prescription fees", "Emergency charges", "Insurance claims"]',
'["Valid prescription", "Contact availability", "Proper addressing", "Payment ready"]',
'["medicine", "pharmacy", "delivery", "health", "prescription"]', 4.2, 456, 389, true, true),

('750e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440052', 
'Salon Services at Home', 'Professional beauty and salon services at home including hair care, facial, and grooming services.', 
'Professional salon services at your doorstep', 799, 599, 120,
'["Professional beautician", "Quality products", "Sanitized equipment", "Multiple services", "Home comfort", "Flexible timing"]',
'["Premium products", "Specialized treatments", "Additional services", "Product purchases"]',
'["Clean environment", "Power supply", "Water availability", "Privacy space", "Appointment booking"]',
'["salon", "beauty", "grooming", "hair", "facial"]', 4.6, 178, 145, true, true),

('750e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440053', 
'Home Health Checkup', 'Comprehensive health checkup services at home with qualified healthcare professionals.', 
'Professional home health checkup service', 1499, 1199, 90,
'["Qualified healthcare professional", "Basic health tests", "Vitals monitoring", "Health consultation", "Report generation", "Follow-up advice"]',
'["Advanced tests", "Prescription medicines", "Specialist consultation", "Emergency treatment", "Hospital charges"]',
'["Patient availability", "Health information", "Clean environment", "Family member present", "Medical history"]',
'["health", "checkup", "medical", "home service", "consultation"]', 4.5, 134, 98, true, true),

-- Civil Work Services
('750e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440061', 
'House Painting Service', 'Professional house painting service for interior and exterior with quality paints and expert painters.', 
'Expert house painting for interior and exterior', 4999, 3999, 480,
'["Professional painters", "Quality paints", "Surface preparation", "Interior/exterior painting", "Clean-up service", "90-day warranty"]',
'["Paint cost", "Scaffolding charges", "Major repairs", "Designer paints", "Additional coats"]',
'["Surface accessibility", "Furniture moving", "Weather conditions", "Color selection", "Site preparation"]',
'["painting", "house", "interior", "exterior", "renovation"]', 4.3, 89, 67, true, true),

('750e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440062', 
'Tile Installation Service', 'Professional tile installation service for floors and walls with expert finishing and grouting.', 
'Expert tile installation for floors and walls', 2999, 2499, 360,
'["Expert tile installer", "Professional installation", "Grouting service", "Level checking", "Quality finishing", "60-day warranty"]',
'["Tile cost", "Adhesive materials", "Floor preparation", "Electrical work", "Plumbing modifications"]',
'["Site accessibility", "Floor preparation", "Material storage", "Proper measurements", "Design planning"]',
'["tiles", "installation", "flooring", "walls", "renovation"]', 4.4, 67, 54, true, false),

('750e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440063', 
'General Home Repairs', 'Comprehensive home repair services including minor fixes, maintenance, and general household repairs.', 
'Professional general home repair service', 799, 599, 180,
'["Skilled technician", "Multiple repair services", "Quality materials", "Problem diagnosis", "Clean-up service", "30-day warranty"]',
'["Major structural work", "Specialized tools", "Electrical/plumbing major work", "Material cost for major repairs"]',
'["Problem accessibility", "Basic tools available", "Material storage", "Site safety", "Clear instructions"]',
'["repairs", "maintenance", "home", "fixing", "general"]', 4.2, 156, 123, true, false);

-- ==============================================================================
-- SEED DATA - ADMIN USERS (EXACT WORKING CREDENTIALS)
-- ==============================================================================

INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, is_active, is_verified) VALUES
('43942929-b0ef-4f4b-a910-3c4e5a14b002', 'superadmin@happyhomes.com', '$2a$10$L6NfFS.5G2ov.mKehJwg9uBreLryZf/NJ39j/hFVTcZds4t6s0Bpu', 'Super', 'Admin', '9437341234', 'super_admin', true, true),
('58e31fde-9500-42b8-a916-87cfe7ccccd1', 'admin@test.com', '$2a$10$L6NfFS.5G2ov.mKehJwg9uBreLryZf/NJ39j/hFVTcZds4t6s0Bpu', 'Test', 'Admin', '9437341235', 'admin', true, true),
('a1b2c3d4-1234-5678-9012-345678901234', 'admin@happyhomes.com', '$2a$10$L6NfFS.5G2ov.mKehJwg9uBreLryZf/NJ39j/hFVTcZds4t6s0Bpu', 'System', 'Administrator', '9437341236', 'super_admin', true, true);

-- ==============================================================================
-- SEED DATA - SAMPLE EMPLOYEES
-- ==============================================================================

INSERT INTO employees (id, user_id, employee_id, name, email, phone, address, expertise, rating, is_available, is_active) VALUES
('e1111111-1111-1111-1111-111111111111', NULL, 'EMP001', 'Rajesh Kumar', 'rajesh@happyhomes.com', '9876543210', 'Bhubaneswar, Odisha', 
'["Bath Fittings", "Basin & Sink", "Toilets", "Pipes", "General Plumbing"]', 4.5, true, true),
('e2222222-2222-2222-2222-222222222222', NULL, 'EMP002', 'Suresh Patel', 'suresh@happyhomes.com', '9876543211', 'Bhubaneswar, Odisha', 
'["Wiring Installation", "Appliance Repair", "Switch & Socket", "Fan Installation", "Lighting Solutions"]', 4.3, true, true),
('e3333333-3333-3333-3333-333333333333', NULL, 'EMP003', 'Ramesh Singh', 'ramesh@happyhomes.com', '9876543212', 'Bhubaneswar, Odisha', 
'["Bathroom Cleaning", "AC Cleaning", "Water Tank Cleaning", "Car Wash"]', 4.7, true, true);

-- ==============================================================================
-- SEED DATA - COMPREHENSIVE COUPONS
-- ==============================================================================

INSERT INTO coupons (code, name, description, discount_type, discount_value, minimum_amount, usage_limit, valid_from, valid_until) VALUES
('WELCOME50', 'Welcome Offer', 'Get 50% off on your first service booking', 'percentage', 50.00, 199.00, 1000, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
('SAVE100', 'Save 100 Rupees', 'Flat ₹100 off on orders above ₹500', 'fixed', 100.00, 500.00, 500, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days'),
('NEWUSER25', 'New User Discount', '25% off for new customers', 'percentage', 25.00, 299.00, 2000, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days'),
('PLUMBING20', 'Plumbing Special', '20% off on all plumbing services', 'percentage', 20.00, 199.00, 300, CURRENT_DATE, CURRENT_DATE + INTERVAL '45 days'),
('ELECTRICAL15', 'Electrical Discount', '15% off on electrical services', 'percentage', 15.00, 199.00, 250, CURRENT_DATE, CURRENT_DATE + INTERVAL '45 days'),
('CLEANING30', 'Cleaning Special', '30% off on cleaning services', 'percentage', 30.00, 149.00, 400, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days');

-- ==============================================================================
-- SEED DATA - BANNERS
-- ==============================================================================

INSERT INTO banners (title, subtitle, description, button_text, button_link, position, sort_order, is_active) VALUES
('Professional Home Services', 'At Your Doorstep', 'Get reliable, professional services for your home. From plumbing to cleaning, we connect you with trusted professionals in your area.', 'Browse Services', '/services', 'hero', 1, true),
('Special Offer', 'Up to 50% Off', 'Limited time offer on all services. Book now and save big on your home maintenance needs.', 'Get Offer', '/offers', 'promotional', 1, true),
('24/7 Service Support', 'We Are Always Here', 'Round the clock customer support for all your service needs. Call us anytime for assistance.', 'Contact Us', '/contact', 'secondary', 1, true);

-- ==============================================================================
-- SEED DATA - CONTACT SETTINGS
-- ==============================================================================

INSERT INTO contact_settings (company_name, tagline, phone, emergency_phone, whatsapp_number, email, address, facebook_url) VALUES
('Happy Homes', 'Your Trusted Home Service Partner', '9437341234', '9437341234', '9437341234', 'care@happyhomesworld.com', 'Bhubaneswar, Odisha 751001', 'https://www.facebook.com/happyhomes.official');

-- ==============================================================================
-- POPULATE LEGACY TABLES
-- ==============================================================================

INSERT INTO categories SELECT * FROM service_categories;
INSERT INTO subcategories SELECT * FROM service_subcategories;

-- ==============================================================================
-- FINAL SETUP COMPLETE MESSAGE
-- ==============================================================================

DO $$
BEGIN
    RAISE NOTICE '=============================================================';
    RAISE NOTICE 'COMPREHENSIVE HOUSEHOLD SERVICES DATABASE SETUP COMPLETED!';
    RAISE NOTICE '=============================================================';
    RAISE NOTICE 'Categories: %', (SELECT COUNT(*) FROM service_categories);
    RAISE NOTICE 'Subcategories: %', (SELECT COUNT(*) FROM service_subcategories);
    RAISE NOTICE 'Services: %', (SELECT COUNT(*) FROM services);
    RAISE NOTICE 'Users: %', (SELECT COUNT(*) FROM users);
    RAISE NOTICE 'Employees: %', (SELECT COUNT(*) FROM employees);
    RAISE NOTICE 'Coupons: %', (SELECT COUNT(*) FROM coupons);
    RAISE NOTICE '=============================================================';
    RAISE NOTICE 'Super Admin: superadmin@happyhomes.com / admin123';
    RAISE NOTICE 'Test Admin: admin@test.com / admin123';
    RAISE NOTICE 'API Base URL: http://localhost:8001/api';
    RAISE NOTICE '=============================================================';
END $$;