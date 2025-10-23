-- ==============================================================================
-- COMPLETE HOUSEHOLD SERVICES DATABASE SETUP
-- This migration creates all tables and inserts all seed data in one go
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
-- ENUMS AND TYPES
-- ==============================================================================

CREATE TYPE user_role AS ENUM ('customer', 'admin', 'super_admin', 'employee');
CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'scheduled', 'in_progress', 'completed', 'postponed', 'cancelled');
CREATE TYPE assignment_status AS ENUM ('assigned', 'accepted', 'rejected', 'in_progress', 'completed');
CREATE TYPE banner_position AS ENUM ('hero', 'secondary', 'promotional');

-- ==============================================================================
-- CORE TABLES
-- ==============================================================================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role user_role DEFAULT 'customer',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User addresses
CREATE TABLE user_addresses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    address_line1 VARCHAR(255) NOT NULL,
    address_line2 VARCHAR(255),
    city VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20) NOT NULL,
    country VARCHAR(100) DEFAULT 'India',
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Refresh tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Services
CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID REFERENCES service_categories(id) ON DELETE CASCADE,
    subcategory_id UUID REFERENCES service_subcategories(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    short_description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    discounted_price DECIMAL(10,2),
    duration INTEGER, -- in minutes
    inclusions JSONB DEFAULT '[]',
    exclusions JSONB DEFAULT '[]',
    requirements JSONB DEFAULT '[]',
    tags JSONB DEFAULT '[]',
    image_paths JSONB DEFAULT '[]',
    gst_percentage DECIMAL(5,2) DEFAULT 18.00,
    service_charge DECIMAL(10,2) DEFAULT 0.00,
    rating DECIMAL(3,2) DEFAULT 0.00,
    review_count INTEGER DEFAULT 0,
    booking_count INTEGER DEFAULT 0,
    availability_settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    is_combo_eligible BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Service variants (for different pricing tiers)
CREATE TABLE service_variants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    discounted_price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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

-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status order_status DEFAULT 'pending',
    subtotal DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    gst_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    service_charge DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00,
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20) NOT NULL,
    service_address TEXT NOT NULL,
    preferred_date DATE,
    preferred_time TIME,
    special_instructions TEXT,
    assigned_employee_id UUID REFERENCES employees(id),
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    service_variant_id UUID REFERENCES service_variants(id),
    category_id UUID REFERENCES service_categories(id),
    subcategory_id UUID REFERENCES service_subcategories(id),
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    service_name VARCHAR(255) NOT NULL,
    service_description TEXT,
    assigned_engineer_id UUID REFERENCES users(id),
    assigned_engineer_name VARCHAR(100),
    item_status order_status NOT NULL DEFAULT 'pending',
    scheduled_date VARCHAR(20), -- YYYY-MM-DD format
    scheduled_time_slot VARCHAR(20), -- e.g., "09:00-11:00"
    completion_date VARCHAR(20), -- YYYY-MM-DD format
    item_notes TEXT,
    item_rating INTEGER CHECK (item_rating >= 1 AND item_rating <= 5),
    item_review TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
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
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    service_variant_id UUID REFERENCES service_variants(id),
    quantity INTEGER NOT NULL DEFAULT 1,
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

-- Offer plans
CREATE TABLE offer_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration_months INTEGER NOT NULL,
    discount_percentage DECIMAL(5,2) NOT NULL,
    original_price DECIMAL(10,2),
    discounted_price DECIMAL(10,2),
    benefits JSONB DEFAULT '[]',
    terms_conditions JSONB DEFAULT '[]',
    applicable_services JSONB DEFAULT '[]',
    min_services_required INTEGER DEFAULT 1,
    max_services_allowed INTEGER DEFAULT 10,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Legacy tables for backward compatibility
CREATE TABLE categories AS SELECT * FROM service_categories WHERE false;
CREATE TABLE subcategories AS SELECT * FROM service_subcategories WHERE false;

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_service_categories_active ON service_categories(is_active);
CREATE INDEX idx_service_subcategories_category ON service_subcategories(category_id);
CREATE INDEX idx_services_category ON services(category_id);
CREATE INDEX idx_services_subcategory ON services(subcategory_id);
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_services_featured ON services(is_featured);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_order_items_category_id ON order_items(category_id);
CREATE INDEX idx_order_items_subcategory_id ON order_items(subcategory_id);
CREATE INDEX idx_order_items_assigned_engineer_id ON order_items(assigned_engineer_id);
CREATE INDEX idx_order_items_item_status ON order_items(item_status);
CREATE INDEX idx_cart_user ON cart(user_id);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_employees_available ON employees(is_available);

-- ==============================================================================
-- SEED DATA - CATEGORIES
-- ==============================================================================

INSERT INTO service_categories (id, name, description, icon, sort_order, is_active) VALUES
('b181c7f3-03cd-43ea-9fcd-85368fbfa628', 'Plumbing', 'Professional plumbing repair and installation services for your home', '🔧', 1, true),
('5750b6f5-0a36-4839-8b5d-783aa5f4a40a', 'Electrical', 'Expert electrical work and appliance repair services', '⚡', 2, true),
('48857699-7785-4875-a787-d1f0b7d2f28c', 'Cleaning', 'Professional cleaning and sanitization services', '🧹', 3, true),
('c4d5e6f7-8901-2345-6789-012345678901', 'Call A Service', 'On-demand service booking and logistics support', '📞', 4, true),
('d5e6f7g8-9012-3456-7890-123456789012', 'Finance & Insurance', 'Financial documentation and insurance services', '💰', 5, true),
('e6f7g8h9-0123-4567-8901-234567890123', 'Personal Care', 'Health, beauty, and personal care services', '💆', 6, true),
('f7g8h9i0-1234-5678-9012-345678901234', 'Civil Work', 'Construction, painting, and civil engineering services', '🏗️', 7, true);

-- ==============================================================================
-- SEED DATA - SUBCATEGORIES
-- ==============================================================================

INSERT INTO service_subcategories (id, category_id, name, description, icon, sort_order, is_active) VALUES
-- Plumbing subcategories
('11111111-1111-1111-1111-111111111111', 'b181c7f3-03cd-43ea-9fcd-85368fbfa628', 'Bath Fittings', 'Shower heads, taps, and bathroom fixture installation', '🚿', 1, true),
('11111111-1111-1111-1111-111111111112', 'b181c7f3-03cd-43ea-9fcd-85368fbfa628', 'Basin & Drainage', 'Sink installation and drainage solutions', '🚰', 2, true),
('11111111-1111-1111-1111-111111111113', 'b181c7f3-03cd-43ea-9fcd-85368fbfa628', 'Toilet Installation', 'Toilet installation and repair services', '🚽', 3, true),
('11111111-1111-1111-1111-111111111115', 'b181c7f3-03cd-43ea-9fcd-85368fbfa628', 'Pipe & Connector', 'Pipe installation and connector services', '🔗', 4, true),

-- Electrical subcategories
('22222222-2222-2222-2222-222222222221', '5750b6f5-0a36-4839-8b5d-783aa5f4a40a', 'Wiring & Installation', 'House wiring and electrical installation', '🔌', 1, true),
('22222222-2222-2222-2222-222222222222', '5750b6f5-0a36-4839-8b5d-783aa5f4a40a', 'Appliance Repair', 'Home appliance repair and maintenance', '🔧', 2, true),
('22222222-2222-2222-2222-222222222223', '5750b6f5-0a36-4839-8b5d-783aa5f4a40a', 'Switch & Socket', 'Switch and socket installation', '🔘', 3, true),
('22222222-2222-2222-2222-222222222224', '5750b6f5-0a36-4839-8b5d-783aa5f4a40a', 'Fan Installation', 'Ceiling and wall fan installation', '🌀', 4, true),
('22222222-2222-2222-2222-222222222225', '5750b6f5-0a36-4839-8b5d-783aa5f4a40a', 'Lighting Solution', 'LED and decorative lighting installation', '💡', 5, true),

-- Cleaning subcategories
('33333333-3333-3333-3333-333333333331', '48857699-7785-4875-a787-d1f0b7d2f28c', 'Bathroom Cleaning', 'Deep bathroom cleaning and sanitization', '🚿', 1, true),
('33333333-3333-3333-3333-333333333332', '48857699-7785-4875-a787-d1f0b7d2f28c', 'AC Cleaning', 'Air conditioner cleaning and maintenance', '❄️', 2, true),
('33333333-3333-3333-3333-333333333333', '48857699-7785-4875-a787-d1f0b7d2f28c', 'Water Tank Cleaning', 'Water tank cleaning and sanitization', '💧', 3, true),
('33333333-3333-3333-3333-333333333334', '48857699-7785-4875-a787-d1f0b7d2f28c', 'Car Wash', 'Professional car washing services', '🚗', 4, true),

-- Call A Service subcategories
('d003fe2d-af43-49a1-927b-a083108bf290', 'c4d5e6f7-8901-2345-6789-012345678901', 'Photography', 'Event and product photography services', '📸', 1, true),
('b326ec14-8ce0-4ea1-95f1-6909cf2fa34d', 'c4d5e6f7-8901-2345-6789-012345678901', 'Logistics', 'Goods transportation and home shifting', '🚚', 2, true),
('44444444-4444-4444-4444-444444444441', 'c4d5e6f7-8901-2345-6789-012345678901', 'Courier Services', 'Pickup and delivery services', '📦', 3, true),
('44444444-4444-4444-4444-444444444442', 'c4d5e6f7-8901-2345-6789-012345678901', 'CAB Booking', 'Taxi and cab booking services', '🚕', 4, true),
('44444444-4444-4444-4444-444444444443', 'c4d5e6f7-8901-2345-6789-012345678901', 'Vehicle Breakdown', 'Vehicle breakdown assistance', '🔧', 5, true),

-- Finance & Insurance subcategories
('c7fe0fb3-27c8-4841-83e8-d1ee8f7f7c52', 'd5e6f7g8-9012-3456-7890-123456789012', 'Financial Services', 'Investment and insurance advisory', '💰', 1, true),
('55555555-5555-5555-5555-555555555551', 'd5e6f7g8-9012-3456-7890-123456789012', 'GST Services', 'GST registration and filing', '📊', 2, true),
('55555555-5555-5555-5555-555555555552', 'd5e6f7g8-9012-3456-7890-123456789012', 'PAN Card Services', 'PAN card application and services', '🆔', 3, true),
('55555555-5555-5555-5555-555555555553', 'd5e6f7g8-9012-3456-7890-123456789012', 'ITR Filing', 'Income tax return filing', '📋', 4, true),
('51038c0d-6ae7-40a2-bfca-813cafefe48b', 'd5e6f7g8-9012-3456-7890-123456789012', 'Legal Documentation', 'Legal agreement and documentation', '⚖️', 5, true),

-- Personal Care subcategories
('66666666-6666-6666-6666-666666666661', 'e6f7g8h9-0123-4567-8901-234567890123', 'Medicine Delivery', 'Home medicine delivery services', '💊', 1, true),
('66666666-6666-6666-6666-666666666662', 'e6f7g8h9-0123-4567-8901-234567890123', 'Beauty & Salon', 'Beauty and salon services at home', '💅', 2, true),
('29e6efae-bd5e-43b4-9f84-0b871d550619', 'e6f7g8h9-0123-4567-8901-234567890123', 'Health Services', 'Health checkup and physiotherapy', '🏥', 3, true),

-- Civil Work subcategories
('77777777-7777-7777-7777-777777777771', 'f7g8h9i0-1234-5678-9012-345678901234', 'House Painting', 'Interior and exterior house painting', '🎨', 1, true),
('77777777-7777-7777-7777-777777777772', 'f7g8h9i0-1234-5678-9012-345678901234', 'Tile & Marble Work', 'Tile and marble installation', '🏠', 2, true),
('77777777-7777-7777-7777-777777777773', 'f7g8h9i0-1234-5678-9012-345678901234', 'House Repair', 'General house repair services', '🔨', 3, true),
('fbf8ad0b-a03f-47b3-8b2f-b22cb9643021', 'f7g8h9i0-1234-5678-9012-345678901234', 'Construction', 'Construction and extension work', '🏗️', 4, true),
('a89773f3-b8be-4da9-8002-a2dfc7e9dbb1', 'f7g8h9i0-1234-5678-9012-345678901234', 'Civil Engineering', 'Building plans and structural consultation', '📐', 5, true);

-- ==============================================================================
-- SEED DATA - SERVICES
-- ==============================================================================

-- Insert sample services for each subcategory
INSERT INTO services (id, category_id, subcategory_id, name, description, short_description, base_price, discounted_price, duration, 
                     inclusions, exclusions, requirements, tags, is_active, is_featured) VALUES

-- Plumbing Services
('459218e6-b7c6-4200-a556-e3234b90bc3f', 'b181c7f3-03cd-43ea-9fcd-85368fbfa628', '11111111-1111-1111-1111-111111111111', 
'Shower Head Installation & Repair', 'Expert installation and repair of all types of shower heads including rain shower, handheld, and fixed shower heads with proper sealing and testing.', 
'Professional shower head installation and repair service', 199, 149, 90,
'["Professional plumber visit", "Shower head installation/repair", "Water pressure testing", "Leak detection and fixing", "30-day service warranty"]',
'["Cost of shower head", "Drilling charges in tiles", "Major plumbing modifications", "Water connection charges"]',
'["Access to bathroom", "Water supply available", "Existing plumbing connection"]',
'["plumbing", "shower", "bathroom", "installation", "repair"]', true, true),

('8a9b0c1d-2e3f-4567-8901-23456789abcd', 'b181c7f3-03cd-43ea-9fcd-85368fbfa628', '11111111-1111-1111-1111-111111111112', 
'Basin Installation Services', 'Complete basin installation including plumbing connections, drainage setup, and sealing work for kitchen and bathroom basins.', 
'Professional basin installation and setup', 299, 229, 120,
'["Professional plumber visit", "Basin mounting and installation", "Plumbing connections setup", "Drainage pipe connection", "Water flow testing", "45-day warranty"]',
'["Cost of basin and fixtures", "Wall drilling in granite/marble", "Major pipe routing changes", "Electrical work"]',
'["Clear access to installation area", "Water supply connection nearby", "Proper wall support structure"]',
'["plumbing", "basin", "kitchen", "bathroom", "installation"]', true, false),

('9b0c1d2e-3f45-6789-0123-456789abcdef', 'b181c7f3-03cd-43ea-9fcd-85368fbfa628', '11111111-1111-1111-1111-111111111113', 
'Toilet Installation & Repair', 'Complete toilet installation, repair, and replacement services with proper sealing and water connections.', 
'Professional toilet installation and repair', 399, 299, 150,
'["Expert plumber visit", "Toilet installation/repair", "Water connection setup", "Proper sealing and testing", "Cleaning after work", "60-day warranty"]',
'["Cost of toilet and accessories", "Flooring/tiling work", "Major plumbing modifications", "Septic tank work"]',
'["Access to bathroom", "Water supply available", "Proper drainage system", "Level flooring"]',
'["plumbing", "toilet", "bathroom", "installation", "repair"]', true, true),

('0c1d2e3f-4567-8901-2345-6789abcdef01', 'b181c7f3-03cd-43ea-9fcd-85368fbfa628', '11111111-1111-1111-1111-111111111115', 
'Pipe & Connector Installation', 'Professional pipe installation, connector fitting, and plumbing system setup for residential properties.', 
'Expert pipe and connector installation service', 249, 199, 120,
'["Professional plumber visit", "Pipe cutting and fitting", "Connector installation", "Pressure testing", "Leak detection", "30-day warranty"]',
'["Cost of pipes and connectors", "Wall breaking charges", "Major route changes", "Pump installation"]',
'["Clear access to work area", "Water supply connection", "Proper planning of pipe routes"]',
'["plumbing", "pipes", "connectors", "installation", "water supply"]', true, false),

-- Electrical Services
('1d2e3f45-6789-0123-4567-89abcdef0123', '5750b6f5-0a36-4839-8b5d-783aa5f4a40a', '22222222-2222-2222-2222-222222222221', 
'House Wiring & Installation', 'Complete house wiring solutions including new installations, rewiring, and electrical safety checks.', 
'Professional house wiring and electrical installation', 599, 499, 240,
'["Certified electrician visit", "Wiring installation/repair", "Safety checks", "Circuit testing", "60-day warranty", "ISI standard materials"]',
'["Cost of wires and electrical materials", "Wall cutting charges", "Meter box installation", "High voltage work"]',
'["Access to electrical areas", "Power supply disconnection", "Proper planning", "Safety clearance"]',
'["electrical", "wiring", "installation", "house", "safety"]', true, true),

('2e3f4567-8901-2345-6789-abcdef012345', '5750b6f5-0a36-4839-8b5d-783aa5f4a40a', '22222222-2222-2222-2222-222222222222', 
'Home Appliance Repair', 'Expert repair services for all home appliances including refrigerators, washing machines, ACs, and kitchen appliances.', 
'Professional home appliance repair service', 299, 249, 90,
'["Expert technician visit", "Appliance diagnosis", "Repair service", "Performance testing", "30-day service warranty", "Genuine parts"]',
'["Cost of spare parts", "Appliance transportation", "Major component replacement", "Gas filling charges"]',
'["Access to appliance", "Power supply available", "Appliance manual if available", "Clear work space"]',
'["electrical", "appliance", "repair", "maintenance", "home"]', true, false),

('cd7bb3cb-9bfe-4f14-b4dc-3e9058f82fa3', '5750b6f5-0a36-4839-8b5d-783aa5f4a40a', '22222222-2222-2222-2222-222222222225', 
'Chandelier & Decorative Lighting', 'Installation of chandeliers, LED strips, decorative lights, and smart lighting solutions.', 
'Decorative and smart lighting installation', 399, 329, 120,
'["Professional electrician visit", "Light fixture installation", "Wiring setup", "Switch configuration", "Testing and demonstration", "45-day warranty"]',
'["Cost of lights and fixtures", "Ceiling work charges", "Dimmer installation", "Smart home integration"]',
'["Access to installation area", "Proper ceiling support", "Power supply nearby", "Height clearance"]',
'["electrical", "lighting", "chandelier", "LED", "decoration"]', true, true),

-- Cleaning Services
('e8b1992a-4952-496b-8b54-56af60b8a6e6', '48857699-7785-4875-a787-d1f0b7d2f28c', '33333333-3333-3333-3333-333333333333', 
'Overhead Tank Cleaning', 'Thorough cleaning and sanitization of overhead water tanks including removal of sediments and bacterial treatment.', 
'Professional overhead water tank cleaning', 399, 299, 180,
'["Professional cleaning team", "Complete tank draining", "Sediment removal", "Disinfection treatment", "Water quality testing", "30-day guarantee"]',
'["Water refilling charges", "Tank repair work", "Plumbing modifications", "Pump maintenance"]',
'["Tank access available", "Water supply for cleaning", "Alternative water arrangement", "Safety clearance"]',
'["cleaning", "water tank", "sanitization", "health", "maintenance"]', true, true),

('4493cecd-6344-44d8-9a68-905618ba86c0', '48857699-7785-4875-a787-d1f0b7d2f28c', '33333333-3333-3333-3333-333333333333', 
'Underground Tank Cleaning', 'Complete cleaning of underground and sump tanks with pump removal, deep cleaning, and sanitization services.', 
'Deep cleaning of underground water tanks', 499, 379, 240,
'["Expert cleaning team", "Pump removal and cleaning", "Deep tank cleaning", "Sanitization", "Water testing", "Quality certificate", "45-day warranty"]',
'["Pump repair charges", "Tank structural repair", "New pump installation", "Electrical work"]',
'["Tank access available", "Pump removal permission", "Alternative water supply", "Safety equipment access"]',
'["cleaning", "underground tank", "sump", "sanitization", "water quality"]', true, false),

-- Call A Service
('8cf9964a-f90c-4257-adfa-aeacd6a6ded1', 'c4d5e6f7-8901-2345-6789-012345678901', 'd003fe2d-af43-49a1-927b-a083108bf290', 
'Event Photography', 'Professional photography services for weddings, parties, corporate events, and special occasions.', 
'Professional event photography service', 2999, 2499, 480,
'["Professional photographer", "High-quality camera equipment", "Photo editing", "Digital copies", "Online gallery", "Same-day preview"]',
'["Printed photos", "Album creation", "Drone photography", "Video recording", "Additional photographer"]',
'["Event venue access", "Adequate lighting conditions", "Photography permissions", "Event timeline"]',
'["photography", "events", "wedding", "professional", "memories"]', true, true),

('8faa3cfc-21d9-46d4-ac61-4cdf1073d7d9', 'c4d5e6f7-8901-2345-6789-012345678901', 'b326ec14-8ce0-4ea1-95f1-6909cf2fa34d', 
'Goods Transportation', 'Safe and reliable transportation of household goods, furniture, and commercial items within the city.', 
'Professional goods transportation service', 799, 649, 240,
'["Professional drivers", "Loading and unloading", "Safe packaging", "Insurance coverage", "Tracking service", "Timely delivery"]',
'["Packing materials", "Interstate charges", "Storage charges", "Insurance claims", "Fragile item guarantee"]',
'["Proper addressing", "Contact availability", "Item inventory", "Loading access", "Destination access"]',
'["logistics", "transportation", "goods", "delivery", "moving"]', true, false),

-- Finance & Insurance Services
('66c669bb-1cdd-4735-9dcf-15ad40d42fb6', 'd5e6f7g8-9012-3456-7890-123456789012', 'c7fe0fb3-27c8-4841-83e8-d1ee8f7f7c52', 
'Insurance Advisory', 'Expert consultation on health, life, vehicle, and property insurance with policy comparison and selection.', 
'Professional insurance advisory service', 499, 399, 90,
'["Expert advisor consultation", "Policy comparison", "Premium calculation", "Documentation assistance", "Claim guidance", "Follow-up support"]',
'["Premium payments", "Policy processing fees", "Medical tests", "Legal charges", "Third-party costs"]',
'["Personal documents", "Income proof", "Identity verification", "Contact availability", "Decision authority"]',
'["insurance", "advisory", "policy", "financial", "protection"]', true, true),

('541bddd7-240f-442e-a1d4-d52591c0f036', 'd5e6f7g8-9012-3456-7890-123456789012', '51038c0d-6ae7-40a2-bfca-813cafefe48b', 
'Legal Agreement Drafting', 'Professional drafting of legal agreements, contracts, and documentation with legal review and consultation.', 
'Expert legal agreement and contract drafting', 1999, 1599, 120,
'["Legal expert consultation", "Agreement drafting", "Legal review", "Documentation", "Revision support", "Legal advice"]',
'["Stamp paper costs", "Registration charges", "Notary fees", "Court fees", "Additional legal services"]',
'["Complete information", "Supporting documents", "Identity proofs", "Witness availability", "Clear requirements"]',
'["legal", "agreement", "contract", "documentation", "consultation"]', true, false),

-- Personal Care Services
('b65c5df8-06af-4b02-a7da-861fd5434e22', 'e6f7g8h9-0123-4567-8901-234567890123', '29e6efae-bd5e-43b4-9f84-0b871d550619', 
'Home Health Checkup', 'Comprehensive health checkup services at home including basic tests, vitals check, and health consultation.', 
'Professional home health checkup service', 1299, 999, 90,
'["Qualified healthcare professional", "Basic health tests", "Vitals monitoring", "Health consultation", "Report generation", "Follow-up advice"]',
'["Advanced medical tests", "Prescription medicines", "Specialist consultation", "Emergency treatment", "Hospital charges"]',
'["Patient availability", "Basic health information", "Clean environment", "Family member present", "Medical history"]',
'["health", "checkup", "medical", "home service", "consultation"]', true, true),

-- Civil Work Services  
('dbb9811a-2c92-4abd-a078-5e8a8b2a5384', 'f7g8h9i0-1234-5678-9012-345678901234', 'fbf8ad0b-a03f-47b3-8b2f-b22cb9643021', 
'Bathroom & Kitchen Construction', 'Complete construction and renovation of bathrooms and kitchens with plumbing, tiling, and electrical work.', 
'Professional bathroom and kitchen construction', 49999, 39999, 2160,
'["Expert construction team", "Complete planning", "Material sourcing", "Plumbing and electrical", "Tiling and finishing", "6-month warranty"]',
'["Raw materials cost", "Electrical appliances", "Sanitary fittings", "Design charges", "Permit fees"]',
'["Site accessibility", "Utility connections", "Proper planning", "Material storage space", "Work permits"]',
'["construction", "bathroom", "kitchen", "renovation", "building"]', true, true),

('889838ad-9ca8-49ce-bf0d-11e5e612c97e', 'f7g8h9i0-1234-5678-9012-345678901234', 'a89773f3-b8be-4da9-8002-a2dfc7e9dbb1', 
'Building Plan & Approval', 'Professional building plan preparation, architectural drawings, and government approval assistance.', 
'Building plan preparation and approval service', 9999, 7999, 720,
'["Licensed architect", "Detailed drawings", "Structural planning", "Approval assistance", "Government liaison", "Revision support"]',
'["Government fees", "Soil testing", "Survey charges", "Legal clearances", "Additional approvals"]',
'["Site documents", "Survey report", "Clear title", "Site accessibility", "Owner authorization"]',
'["civil engineering", "building plan", "architecture", "approval", "construction"]', true, false);

-- ==============================================================================
-- SEED DATA - DEFAULT ADMIN USER
-- ==============================================================================

INSERT INTO users (id, email, password, first_name, last_name, role, is_active, email_verified) VALUES
('admin-user-id-1234-5678-9012-345678901234', 'admin@happyhomes.com', '$2b$10$K5J.6y8mQ8YvYIJ5Kw8.N.nYvBjYhIi0Ij8qN4.Qw2Kj7k8Kw4.5e', 'System', 'Administrator', 'super_admin', true, true);

-- ==============================================================================
-- SEED DATA - SAMPLE EMPLOYEES
-- ==============================================================================

INSERT INTO employees (id, user_id, employee_id, name, email, phone, address, expertise, rating, is_available, is_active) VALUES
('emp-1111-1111-1111-1111-111111111111', NULL, 'EMP001', 'Rajesh Kumar', 'rajesh@happyhomes.com', '9876543210', 'Bhubaneswar, Odisha', 
'["Bath Fittings", "Basin & Drainage", "Toilet Installation", "Pipe & Connector", "General Plumbing"]', 4.5, true, true),
('emp-2222-2222-2222-2222-222222222222', NULL, 'EMP002', 'Suresh Patel', 'suresh@happyhomes.com', '9876543211', 'Bhubaneswar, Odisha', 
'["Wiring & Installation", "Appliance Repair", "Switch & Socket", "Fan Installation", "Lighting Solution"]', 4.3, true, true),
('emp-3333-3333-3333-3333-333333333333', NULL, 'EMP003', 'Ramesh Singh', 'ramesh@happyhomes.com', '9876543212', 'Bhubaneswar, Odisha', 
'["Bathroom Cleaning", "AC Cleaning", "Water Tank Cleaning", "General Cleaning"]', 4.7, true, true);

-- ==============================================================================
-- SEED DATA - SAMPLE COUPONS
-- ==============================================================================

INSERT INTO coupons (code, name, description, discount_type, discount_value, minimum_amount, usage_limit, valid_from, valid_until) VALUES
('WELCOME50', 'Welcome Offer', 'Get 50% off on your first service booking', 'percentage', 50.00, 199.00, 1000, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days'),
('SAVE100', 'Save 100 Rupees', 'Flat ₹100 off on orders above ₹500', 'fixed', 100.00, 500.00, 500, CURRENT_DATE, CURRENT_DATE + INTERVAL '60 days'),
('NEWUSER25', 'New User Discount', '25% off for new customers', 'percentage', 25.00, 299.00, 2000, CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days');

-- ==============================================================================
-- SEED DATA - SAMPLE BANNERS
-- ==============================================================================

INSERT INTO banners (title, subtitle, description, button_text, button_link, position, sort_order, is_active) VALUES
('Professional Home Services', 'At Your Doorstep', 'Get reliable, professional services for your home. From plumbing to cleaning, we connect you with trusted professionals in your area.', 'Browse Services', '/services', 'hero', 1, true),
('Special Offer', 'Up to 50% Off', 'Limited time offer on all services. Book now and save big on your home maintenance needs.', 'Get Offer', '/offers', 'promotional', 1, true),
('24/7 Service Support', 'We Are Always Here', 'Round the clock customer support for all your service needs. Call us anytime for assistance.', 'Contact Us', '/contact', 'secondary', 1, true);

-- ==============================================================================
-- SEED DATA - OFFER PLANS
-- ==============================================================================

INSERT INTO offer_plans (title, description, duration_months, discount_percentage, original_price, discounted_price, benefits, terms_conditions, applicable_services, min_services_required, max_services_allowed, is_active, is_featured, sort_order) VALUES
('Smart Start Plan', 'Perfect starter plan for new homeowners with essential services and priority support.', 3, 20.00, 1500.00, 1200.00, 
'["🏠 Monthly service priority", "💰 20% discount on all bookings", "📞 Free consultation calls", "⏰ 24/7 customer support", "📅 Flexible scheduling", "🔧 Basic maintenance tips"]',
'["Valid for 3 months from purchase", "Minimum 1 service per month", "Cannot be combined with other offers", "Non-refundable", "Terms subject to change"]',
'[]', 1, 5, true, false, 1),

('Premium Care Plus', 'Comprehensive home maintenance solution with premium services and dedicated support team.', 6, 25.00, 3000.00, 2250.00,
'["👨‍🔧 Dedicated service coordinator", "💎 25% discount on all bookings", "🚨 Free emergency callouts", "⭐ Priority scheduling", "🔍 Monthly home inspection", "🛡️ Extended warranty on repairs"]',
'["Valid for 6 months from purchase", "Minimum 2 services per month", "Emergency services subject to availability", "Cannot be transferred", "Terms subject to change"]',
'[]', 2, 8, true, true, 2),

('Elite Home Guard', 'Ultimate yearly home protection plan with maximum savings and VIP benefits for the savvy homeowner.', 12, 30.00, 6000.00, 4200.00,
'["👑 Personal home care manager", "🎯 30% discount on all bookings", "🚑 Unlimited emergency callouts", "🌟 VIP priority scheduling", "📊 Quarterly home health reports", "💯 Extended warranty on all work", "🆓 Free minor repairs", "🏆 Premium member benefits"]',
'["Valid for 12 months from purchase", "Minimum 3 services per month", "Premium benefits included", "Transferable within family", "90-day money back guarantee", "Terms subject to change"]',
'[]', 3, 10, true, true, 3);

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
    RAISE NOTICE 'HOUSEHOLD SERVICES DATABASE SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '=============================================================';
    RAISE NOTICE 'Categories: %', (SELECT COUNT(*) FROM service_categories);
    RAISE NOTICE 'Subcategories: %', (SELECT COUNT(*) FROM service_subcategories);
    RAISE NOTICE 'Services: %', (SELECT COUNT(*) FROM services);
    RAISE NOTICE 'Employees: %', (SELECT COUNT(*) FROM employees);
    RAISE NOTICE 'Coupons: %', (SELECT COUNT(*) FROM coupons);
    RAISE NOTICE '=============================================================';
    RAISE NOTICE 'Default Admin Login: admin@happyhomes.com / admin123';
    RAISE NOTICE 'API Base URL: http://localhost:8001/api';
    RAISE NOTICE '=============================================================';
END $$;