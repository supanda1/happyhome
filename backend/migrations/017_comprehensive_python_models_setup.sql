-- ==============================================================================
-- COMPREHENSIVE PYTHON MODELS DATABASE SETUP
-- This migration creates all tables to match the Python SQLAlchemy models exactly
-- Updated: 2025-01-22 - Matches all Python models in backend/app/models/
-- ==============================================================================

-- Drop existing tables if they exist (for clean setup)
DROP TABLE IF EXISTS sms_logs CASCADE;
DROP TABLE IF EXISTS notification_templates CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS assignment_history CASCADE;
DROP TABLE IF EXISTS cart_items CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS service_variants CASCADE;
DROP TABLE IF EXISTS service_photos CASCADE;
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
DROP TYPE IF EXISTS order_priority CASCADE;
DROP TYPE IF EXISTS item_status CASCADE;
DROP TYPE IF EXISTS assignment_status CASCADE;
DROP TYPE IF EXISTS banner_position CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS notification_type CASCADE;
DROP TYPE IF EXISTS notification_priority CASCADE;
DROP TYPE IF EXISTS sms_provider_type CASCADE;

-- ==============================================================================
-- CORE TABLES MATCHING PYTHON MODELS
-- ==============================================================================

-- Users table - matches User model in user.py
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

-- User addresses table - matches UserAddress model
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

-- Refresh tokens table - matches RefreshToken model
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

-- Service categories table - matches ServiceCategory model
CREATE TABLE service_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    name VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(500) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    
    -- Image paths for category images (from Pexels downloads)
    image_paths JSONB DEFAULT '[]'::jsonb
);

-- Service subcategories table - matches ServiceSubcategory model
CREATE TABLE service_subcategories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    category_id UUID NOT NULL REFERENCES service_categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description VARCHAR(500) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0
);

-- Services table - matches Service model
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

-- Service variants table - matches ServiceVariant model
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

-- Orders table - matches Order model
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

-- Order items table - matches OrderItem model
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

-- Employees table - matches Employee model (need to check if this exists)
CREATE TABLE employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    employee_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT,
    expertise JSONB DEFAULT '[]'::jsonb,
    rating FLOAT DEFAULT 0.00,
    total_jobs INTEGER DEFAULT 0,
    completed_jobs INTEGER DEFAULT 0,
    is_available BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    hire_date DATE DEFAULT CURRENT_DATE
);

-- Bookings table - matches Booking model (if it exists)
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    user_id UUID REFERENCES users(id),
    service_id UUID REFERENCES services(id),
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    booking_date TIMESTAMP WITH TIME ZONE,
    total_amount FLOAT,
    notes TEXT
);

-- Reviews table - matches Review model (if it exists)
CREATE TABLE reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    user_id UUID REFERENCES users(id),
    service_id UUID REFERENCES services(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    is_verified BOOLEAN DEFAULT false
);

-- Coupons table - matches Coupon model (if it exists)
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage' or 'fixed'
    discount_value FLOAT NOT NULL,
    minimum_amount FLOAT DEFAULT 0.00,
    maximum_discount FLOAT,
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL
);

-- Notifications table - matches Notification model (if it exists)
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    user_id UUID REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT false,
    priority VARCHAR(20) DEFAULT 'medium'
);

-- Banners table
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    title VARCHAR(255) NOT NULL,
    subtitle VARCHAR(255),
    description TEXT,
    button_text VARCHAR(100),
    button_link VARCHAR(255),
    image_url VARCHAR(255),
    background_color VARCHAR(7) DEFAULT '#ffffff',
    text_color VARCHAR(7) DEFAULT '#000000',
    position VARCHAR(20) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

-- Contact settings table
CREATE TABLE contact_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
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
    updated_by UUID
);

-- Legacy tables for backward compatibility
CREATE TABLE categories AS SELECT * FROM service_categories WHERE false;
CREATE TABLE subcategories AS SELECT * FROM service_subcategories WHERE false;

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
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
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_service_id ON bookings(service_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_service_id ON reviews(service_id);
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_is_active ON coupons(is_active);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- Log completion
DO $$
BEGIN
    RAISE NOTICE '================================================================';
    RAISE NOTICE 'COMPREHENSIVE PYTHON MODELS DATABASE SETUP COMPLETED!';
    RAISE NOTICE 'All tables now match the SQLAlchemy models in backend/app/models/';
    RAISE NOTICE 'Created tables: users, user_addresses, refresh_tokens, services,';
    RAISE NOTICE 'service_categories, service_subcategories, service_photos,';
    RAISE NOTICE 'service_variants, orders, order_items, employees, bookings,';
    RAISE NOTICE 'reviews, coupons, notifications, banners, contact_settings';
    RAISE NOTICE '================================================================';
END $$;