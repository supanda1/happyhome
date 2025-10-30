-- ==============================================================================
-- FINAL COMPLETE HOUSEHOLD SERVICES DATABASE SETUP
-- Single comprehensive migration and seed file
-- This is the ONLY file needed for complete database initialization
-- ==============================================================================

-- Database initialization
CREATE DATABASE household_services;

-- Connect to the household_services database
\c household_services;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set up proper permissions
GRANT ALL PRIVILEGES ON DATABASE household_services TO postgres;

-- Clean slate - drop all existing tables
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
DROP TABLE IF EXISTS coupon_usages CASCADE;
DROP TABLE IF EXISTS coupons CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS contact_settings CASCADE;
DROP TABLE IF EXISTS user_preferences CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS offer_services CASCADE;
DROP TABLE IF EXISTS offer_plans CASCADE;
DROP TABLE IF EXISTS review_settings CASCADE;
DROP TABLE IF EXISTS user_admin_permissions CASCADE;
DROP TABLE IF EXISTS admin_permissions CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;

-- ==============================================================================
-- TABLE CREATION - COMPLETE SCHEMA
-- ==============================================================================

SET default_tablespace = '';
SET default_table_access_method = heap;

-- Assignment History Table
CREATE TABLE public.assignment_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid,
    employee_id uuid,
    status character varying(20) DEFAULT 'assigned'::character varying,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    accepted_at timestamp without time zone,
    completed_at timestamp without time zone,
    notes text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);

-- Banners Table
CREATE TABLE public.banners (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(200) NOT NULL,
    subtitle character varying(300),
    description text,
    button_text character varying(100),
    button_link character varying(500),
    image_url character varying(500),
    background_color character varying(20) DEFAULT '#ffffff'::character varying,
    text_color character varying(20) DEFAULT '#000000'::character varying,
    "position" character varying(20) DEFAULT 'hero'::character varying,
    sort_order integer DEFAULT 1,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Cart Table
CREATE TABLE public.cart (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Cart Items Table
CREATE TABLE public.cart_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    cart_id uuid NOT NULL,
    service_id character varying(100) NOT NULL,
    service_name character varying(100) NOT NULL,
    variant_id character varying(100),
    quantity integer DEFAULT 1 NOT NULL,
    unit_price double precision NOT NULL,
    total_price double precision NOT NULL,
    customizations jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Service Categories Table
CREATE TABLE public.service_categories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    icon character varying(100),
    image_path character varying(500),
    sort_order integer DEFAULT 1,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Contact Settings Table
CREATE TABLE public.contact_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    company_name character varying(200) NOT NULL,
    tagline character varying(300),
    phone character varying(20),
    emergency_phone character varying(20),
    whatsapp_number character varying(20),
    email character varying(100),
    address text,
    facebook_url character varying(500),
    twitter_url character varying(500),
    instagram_url character varying(500),
    linkedin_url character varying(500),
    website_url character varying(500),
    updated_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Coupons Table
CREATE TABLE public.coupons (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    code character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    discount_type character varying(20) DEFAULT 'percentage'::character varying,
    discount_value double precision NOT NULL,
    minimum_amount double precision DEFAULT 0.0,
    maximum_discount double precision,
    usage_limit integer,
    used_count integer DEFAULT 0,
    usage_limit_per_user integer,
    first_time_users_only boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    valid_from date NOT NULL,
    valid_until date NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Coupon Usages Tracking Table
CREATE TABLE public.coupon_usages (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    coupon_id uuid NOT NULL,
    user_id uuid NOT NULL,
    order_id uuid,
    discount_amount double precision NOT NULL,
    used_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Payments Table
CREATE TABLE public.payments (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    transaction_id character varying(100) NOT NULL,
    amount double precision NOT NULL,
    currency character varying(10) DEFAULT 'INR'::character varying NOT NULL,
    payment_method character varying(50) NOT NULL,
    payment_status character varying(20) DEFAULT 'initiated'::character varying NOT NULL,
    customer_name character varying(100),
    customer_email character varying(100),
    customer_phone character varying(20),
    gateway_name character varying(50),
    gateway_transaction_id character varying(100),
    gateway_response jsonb,
    initiated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    completed_at timestamp with time zone,
    failed_at timestamp with time zone,
    failure_reason text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Offer Plans Table
CREATE TABLE public.offer_plans (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    title character varying(200) NOT NULL,
    description text,
    duration_months integer NOT NULL,
    discount_percentage double precision NOT NULL,
    combo_coupon_code character varying(50),
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 1,
    benefits jsonb DEFAULT '[]'::jsonb,
    terms_conditions jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Offer Services Table (for offer plan to service mapping)
CREATE TABLE public.offer_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    plan_id uuid NOT NULL,
    service_id uuid NOT NULL,
    included_quantity integer DEFAULT 1 NOT NULL,
    discount_percentage double precision DEFAULT 0.0,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Review Settings Table
CREATE TABLE public.review_settings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    auto_approve_reviews boolean DEFAULT false NOT NULL,
    require_booking_for_review boolean DEFAULT true NOT NULL,
    minimum_rating_threshold integer DEFAULT 1,
    maximum_reviews_per_user_per_service integer DEFAULT 1,
    review_moderation_enabled boolean DEFAULT true NOT NULL,
    display_average_rating boolean DEFAULT true NOT NULL,
    display_review_count boolean DEFAULT true NOT NULL,
    allow_anonymous_reviews boolean DEFAULT false NOT NULL,
    updated_by uuid,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- User Admin Permissions Table
CREATE TABLE public.user_admin_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    permission_id uuid NOT NULL,
    can_view boolean DEFAULT true NOT NULL,
    can_edit boolean DEFAULT false NOT NULL,
    granted_by uuid,
    granted_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Employees Table (Engineers)
CREATE TABLE public.employees (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    employee_id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100),
    phone character varying(20) NOT NULL,
    address text,
    expertise text,
    rating double precision DEFAULT 0.0,
    total_jobs integer DEFAULT 0,
    completed_jobs integer DEFAULT 0,
    is_available boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    hire_date date,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table
CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    order_id uuid NOT NULL,
    service_id character varying(100) NOT NULL,
    service_name character varying(100) NOT NULL,
    variant_id character varying(100),
    variant_name character varying(50),
    quantity integer DEFAULT 1 NOT NULL,
    unit_price double precision NOT NULL,
    total_price double precision NOT NULL,
    category_id character varying(100) NOT NULL,
    subcategory_id character varying(100) NOT NULL,
    assigned_engineer_id character varying(100),
    assigned_engineer_name character varying(100),
    item_status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    scheduled_date character varying(20),
    scheduled_time_slot character varying(20),
    completion_date character varying(20),
    item_notes text,
    item_rating integer,
    item_review text,
    CONSTRAINT order_items_item_rating_check CHECK (((item_rating >= 1) AND (item_rating <= 5)))
);

-- Orders Table
CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    order_number character varying(50) NOT NULL,
    customer_id character varying(255) NOT NULL,
    customer_name character varying(100) NOT NULL,
    customer_phone character varying(20) NOT NULL,
    customer_email character varying(100) NOT NULL,
    service_address jsonb NOT NULL,
    total_amount double precision NOT NULL,
    discount_amount double precision DEFAULT 0.0 NOT NULL,
    gst_amount double precision DEFAULT 0.0 NOT NULL,
    service_charge double precision DEFAULT 0.0 NOT NULL,
    final_amount double precision NOT NULL,
    status character varying(20) DEFAULT 'pending'::character varying NOT NULL,
    priority character varying(10) DEFAULT 'medium'::character varying NOT NULL,
    notes text,
    admin_notes text,
    customer_rating integer,
    customer_review text,
    CONSTRAINT orders_customer_rating_check CHECK (((customer_rating >= 1) AND (customer_rating <= 5)))
);

-- Refresh Tokens Table
CREATE TABLE public.refresh_tokens (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    token_hash character varying(255) NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    is_revoked boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Service Photos Table
CREATE TABLE public.service_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    service_id uuid NOT NULL,
    photo_url character varying(500) NOT NULL,
    alt_text character varying(200),
    sort_order integer DEFAULT 1,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Service Subcategories Table
CREATE TABLE public.service_subcategories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    icon character varying(100),
    image_paths jsonb DEFAULT '[]'::jsonb,
    sort_order integer DEFAULT 1,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Service Variants Table
CREATE TABLE public.service_variants (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    service_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    base_price double precision NOT NULL,
    discounted_price double precision,
    duration character varying(50),
    inclusions text,
    exclusions text,
    features jsonb DEFAULT '[]'::jsonb,
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 1
);

-- Services Table
CREATE TABLE public.services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    name character varying(100) NOT NULL,
    category_id uuid NOT NULL,
    subcategory_id uuid NOT NULL,
    description text,
    short_description character varying(300),
    base_price double precision NOT NULL,
    discounted_price double precision,
    duration character varying(50),
    inclusions text,
    exclusions text,
    requirements text,
    rating double precision DEFAULT 0.0,
    review_count integer DEFAULT 0,
    booking_count integer DEFAULT 0,
    is_active boolean DEFAULT true NOT NULL,
    is_featured boolean DEFAULT false NOT NULL,
    tags jsonb DEFAULT '[]'::jsonb,
    availability_settings jsonb DEFAULT '{}'::jsonb,
    image_paths jsonb DEFAULT '[]'::jsonb,
    gst_percentage double precision DEFAULT 18.0,
    service_charge double precision DEFAULT 0.0,
    is_combo_eligible boolean DEFAULT false NOT NULL,
    notes text
);

-- Subcategories Table (Legacy/Compatibility)
CREATE TABLE public.subcategories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    category_id uuid NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    icon character varying(100),
    image_paths jsonb DEFAULT '[]'::jsonb,
    sort_order integer DEFAULT 1,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- User Addresses Table - CORRECT SCHEMA FOR APPLICATION
CREATE TABLE public.user_addresses (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_id uuid NOT NULL,
    type character varying(20) DEFAULT 'home'::character varying NOT NULL,
    title character varying(100) NOT NULL,
    full_address text NOT NULL,
    landmark character varying(200),
    city character varying(100) NOT NULL,
    state character varying(100) NOT NULL,
    postal_code character varying(20) NOT NULL,
    country character varying(100) DEFAULT 'India'::character varying NOT NULL,
    latitude double precision,
    longitude double precision,
    is_default boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL
);

-- User Preferences Table
CREATE TABLE public.user_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    email_notifications boolean DEFAULT true NOT NULL,
    sms_notifications boolean DEFAULT true NOT NULL,
    push_notifications boolean DEFAULT true NOT NULL,
    marketing_emails boolean DEFAULT false NOT NULL,
    service_reminders boolean DEFAULT true NOT NULL,
    theme character varying(20) DEFAULT 'light'::character varying NOT NULL,
    language character varying(10) DEFAULT 'en'::character varying NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Users Table - CORRECT SCHEMA FOR APPLICATION
CREATE TABLE public.users (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    email character varying(255) NOT NULL,
    password_hash character varying(255) NOT NULL,
    first_name character varying(100) NOT NULL,
    last_name character varying(100) NOT NULL,
    phone character varying(20) NOT NULL,
    role character varying(20) DEFAULT 'customer'::character varying NOT NULL CHECK (role IN ('customer', 'admin', 'engineer', 'super_admin')),
    is_active boolean DEFAULT true NOT NULL,
    is_verified boolean DEFAULT false NOT NULL,
    last_login timestamp with time zone,
    failed_login_attempts integer DEFAULT 0 NOT NULL,
    locked_until timestamp with time zone,
    profile_completed boolean DEFAULT false NOT NULL,
    avatar_url character varying(500),
    preferences jsonb DEFAULT '{}'::jsonb
);

-- Admin Permissions Table
CREATE TABLE public.admin_permissions (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    permission_key character varying(100) NOT NULL,
    permission_name character varying(200) NOT NULL,
    permission_description text,
    category character varying(100) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Reviews Table
CREATE TABLE public.reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    service_id uuid NOT NULL,
    order_id uuid,
    rating integer NOT NULL,
    comment text,
    is_approved boolean DEFAULT false NOT NULL,
    approved_by uuid,
    approved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);

-- ==============================================================================
-- PRIMARY KEYS AND CONSTRAINTS
-- ==============================================================================

ALTER TABLE ONLY public.assignment_history ADD CONSTRAINT assignment_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.banners ADD CONSTRAINT banners_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cart_items ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cart ADD CONSTRAINT cart_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.service_categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.contact_settings ADD CONSTRAINT contact_settings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.coupons ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.coupon_usages ADD CONSTRAINT coupon_usages_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.employees ADD CONSTRAINT employees_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.refresh_tokens ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.service_photos ADD CONSTRAINT service_photos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.service_subcategories ADD CONSTRAINT service_subcategories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.service_variants ADD CONSTRAINT service_variants_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.services ADD CONSTRAINT services_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.subcategories ADD CONSTRAINT subcategories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_addresses ADD CONSTRAINT user_addresses_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_preferences ADD CONSTRAINT user_preferences_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.admin_permissions ADD CONSTRAINT admin_permissions_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.offer_plans ADD CONSTRAINT offer_plans_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.offer_services ADD CONSTRAINT offer_services_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.review_settings ADD CONSTRAINT review_settings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_admin_permissions ADD CONSTRAINT user_admin_permissions_pkey PRIMARY KEY (id);

-- Unique constraints
ALTER TABLE ONLY public.coupons ADD CONSTRAINT coupons_code_key UNIQUE (code);
ALTER TABLE ONLY public.employees ADD CONSTRAINT employees_employee_id_key UNIQUE (employee_id);
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY public.admin_permissions ADD CONSTRAINT admin_permissions_permission_key_key UNIQUE (permission_key);
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_transaction_id_key UNIQUE (transaction_id);
ALTER TABLE ONLY public.offer_plans ADD CONSTRAINT offer_plans_combo_coupon_code_key UNIQUE (combo_coupon_code);
ALTER TABLE ONLY public.user_admin_permissions ADD CONSTRAINT user_admin_permissions_user_id_permission_id_key UNIQUE (user_id, permission_id);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX idx_assignment_history_employee_id ON public.assignment_history USING btree (employee_id);
CREATE INDEX idx_assignment_history_order_id ON public.assignment_history USING btree (order_id);
CREATE INDEX idx_cart_items_cart_id ON public.cart_items USING btree (cart_id);
CREATE INDEX idx_cart_user_id ON public.cart USING btree (user_id);
CREATE INDEX idx_coupon_usages_coupon_id ON public.coupon_usages USING btree (coupon_id);
CREATE INDEX idx_coupon_usages_user_id ON public.coupon_usages USING btree (user_id);
CREATE INDEX idx_coupon_usages_order_id ON public.coupon_usages USING btree (order_id);
CREATE INDEX idx_employees_is_active ON public.employees USING btree (is_active);
CREATE INDEX idx_employees_is_available ON public.employees USING btree (is_available);
CREATE INDEX idx_order_items_assigned_engineer_id ON public.order_items USING btree (assigned_engineer_id);
CREATE INDEX idx_order_items_category_id ON public.order_items USING btree (category_id);
CREATE INDEX idx_order_items_item_status ON public.order_items USING btree (item_status);
CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);
CREATE INDEX idx_order_items_service_id ON public.order_items USING btree (service_id);
CREATE INDEX idx_order_items_subcategory_id ON public.order_items USING btree (subcategory_id);
CREATE INDEX idx_orders_customer_id ON public.orders USING btree (customer_id);
CREATE INDEX idx_orders_order_number ON public.orders USING btree (order_number);
CREATE INDEX idx_orders_priority ON public.orders USING btree (priority);
CREATE INDEX idx_orders_status ON public.orders USING btree (status);
CREATE INDEX idx_refresh_tokens_user_id ON public.refresh_tokens USING btree (user_id);
CREATE INDEX idx_service_photos_service_id ON public.service_photos USING btree (service_id);
CREATE INDEX idx_service_subcategories_category_id ON public.service_subcategories USING btree (category_id);
CREATE INDEX idx_service_variants_service_id ON public.service_variants USING btree (service_id);
CREATE INDEX idx_services_category_id ON public.services USING btree (category_id);
CREATE INDEX idx_services_is_active ON public.services USING btree (is_active);
CREATE INDEX idx_services_is_featured ON public.services USING btree (is_featured);
CREATE INDEX idx_services_subcategory_id ON public.services USING btree (subcategory_id);
CREATE INDEX idx_subcategories_category_id ON public.subcategories USING btree (category_id);
CREATE INDEX idx_user_addresses_default ON public.user_addresses USING btree (user_id, is_default) WHERE (is_default = true);
CREATE INDEX idx_user_addresses_is_active ON public.user_addresses USING btree (is_active);
CREATE INDEX idx_user_addresses_user_active ON public.user_addresses USING btree (user_id, is_active);
CREATE INDEX idx_user_addresses_user_id ON public.user_addresses USING btree (user_id);
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences USING btree (user_id);
CREATE INDEX idx_users_email ON public.users USING btree (email);
CREATE INDEX idx_users_is_active ON public.users USING btree (is_active);
CREATE INDEX idx_users_phone ON public.users USING btree (phone);
CREATE INDEX idx_users_role ON public.users USING btree (role);
CREATE INDEX idx_admin_permissions_key ON public.admin_permissions USING btree (permission_key);
CREATE INDEX idx_admin_permissions_category ON public.admin_permissions USING btree (category);
CREATE INDEX idx_reviews_user_id ON public.reviews USING btree (user_id);
CREATE INDEX idx_reviews_service_id ON public.reviews USING btree (service_id);
CREATE INDEX idx_reviews_is_approved ON public.reviews USING btree (is_approved);
CREATE INDEX idx_reviews_rating ON public.reviews USING btree (rating);
CREATE INDEX idx_payments_order_id ON public.payments USING btree (order_id);
CREATE INDEX idx_payments_status ON public.payments USING btree (payment_status);
CREATE INDEX idx_payments_transaction_id ON public.payments USING btree (transaction_id);
CREATE INDEX idx_offer_plans_active ON public.offer_plans USING btree (is_active);
CREATE INDEX idx_offer_services_plan_id ON public.offer_services USING btree (plan_id);
CREATE INDEX idx_offer_services_service_id ON public.offer_services USING btree (service_id);

-- ==============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ==============================================================================

ALTER TABLE ONLY public.assignment_history ADD CONSTRAINT assignment_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.cart_items ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.cart(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.cart ADD CONSTRAINT cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.coupon_usages ADD CONSTRAINT coupon_usages_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.coupon_usages ADD CONSTRAINT coupon_usages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.coupon_usages ADD CONSTRAINT coupon_usages_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.employees ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.refresh_tokens ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.service_photos ADD CONSTRAINT service_photos_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.service_subcategories ADD CONSTRAINT service_subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.service_variants ADD CONSTRAINT service_variants_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.services ADD CONSTRAINT services_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id);
ALTER TABLE ONLY public.services ADD CONSTRAINT services_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.service_subcategories(id);
ALTER TABLE ONLY public.subcategories ADD CONSTRAINT subcategories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_addresses ADD CONSTRAINT user_addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_preferences ADD CONSTRAINT user_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_admin_permissions ADD CONSTRAINT user_admin_permissions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_admin_permissions ADD CONSTRAINT user_admin_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.admin_permissions(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.user_admin_permissions ADD CONSTRAINT user_admin_permissions_granted_by_fkey FOREIGN KEY (granted_by) REFERENCES public.users(id);
ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.reviews ADD CONSTRAINT reviews_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.offer_services ADD CONSTRAINT offer_services_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.offer_plans(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.offer_services ADD CONSTRAINT offer_services_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;

-- ==============================================================================
-- SEED DATA - COMPLETE INITIAL DATA SET
-- ==============================================================================

-- Insert Admin Users
INSERT INTO public.users (id, created_at, updated_at, email, password_hash, first_name, last_name, phone, role, is_active, is_verified, profile_completed) VALUES 
('43942929-b0ef-4f4b-a910-3c4e5a14b002', NOW(), NOW(), 'superadmin@happyhomes.com', '$2a$10$L6NfFS.5G2ov.mKehJwg9uBreLryZf/NJ39j/hFVTcZds4t6s0Bpu', 'Super', 'Admin', '9437341234', 'super_admin', true, true, false),
('58e31fde-9500-42b8-a916-87cfe7ccccd1', NOW(), NOW(), 'admin@test.com', '$2a$10$L6NfFS.5G2ov.mKehJwg9uBreLryZf/NJ39j/hFVTcZds4t6s0Bpu', 'Test', 'Admin', '9437341235', 'admin', true, true, false),
('f9ac9cfe-173d-4498-aa63-950412f53da5', NOW(), NOW(), 'admin@happyhomes.com', '$2a$10$L6NfFS.5G2ov.mKehJwg9uBreLryZf/NJ39j/hFVTcZds4t6s0Bpu', 'System', 'Administrator', '9437341236', 'super_admin', true, true, false);

-- Insert Service Categories
INSERT INTO public.service_categories (id, name, description, icon, image_path, sort_order, is_active) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Plumbing', 'Professional plumbing services for your home', '🔧', '/images/categories/plumbing.jpg', 1, true),
('550e8400-e29b-41d4-a716-446655440002', 'Electrical', 'Certified electrical services and repairs', '⚡', '/images/categories/electrical.jpg', 2, true),
('550e8400-e29b-41d4-a716-446655440003', 'Cleaning', 'Professional cleaning services', '🧹', '/images/categories/cleaning.jpg', 3, true),
('550e8400-e29b-41d4-a716-446655440004', 'Transportation', 'Reliable transportation and delivery services', '🚚', '/images/categories/transport.jpg', 4, true),
('550e8400-e29b-41d4-a716-446655440005', 'Documentation', 'Legal and government documentation services', '📋', '/images/categories/documentation.jpg', 5, true),
('550e8400-e29b-41d4-a716-446655440006', 'Personal Care', 'Health, beauty and personal care services', '💆', '/images/categories/personal-care.jpg', 6, true),
('550e8400-e29b-41d4-a716-446655440007', 'Home Improvement', 'Home renovation and improvement services', '🏠', '/images/categories/home-improvement.jpg', 7, true);

-- Insert Service Subcategories
INSERT INTO public.service_subcategories (id, category_id, name, description, icon, sort_order, is_active) VALUES 
-- Plumbing Subcategories
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Bath Fittings', 'Shower heads, taps, and bathroom fixture installation', '🚿', 1, true),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Basin & Sink', 'Sink installation and drainage solutions', '🚰', 2, true),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Toilets', 'Toilet installation and repair services', '🚽', 3, true),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Water Tank', 'Water tank installation and maintenance', '🫗', 4, true),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'Pipes', 'Pipe installation and connector services', '🔗', 5, true),
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'Grouting', 'Professional grouting and sealing services', '🔧', 6, true),
-- Electrical Subcategories
('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', 'Wiring Installation', 'House wiring and electrical installation', '🔌', 1, true),
('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', 'Appliance Repair', 'Home appliance repair and maintenance', '🔧', 2, true),
('650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 'Switch & Socket', 'Switch and socket installation', '🔘', 3, true),
('650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', 'Fan Installation', 'Ceiling and wall fan installation', '🌀', 4, true),
('650e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', 'Lighting Solutions', 'LED and decorative lighting installation', '💡', 5, true),
('650e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440002', 'Electrical Safety Check', 'Electrical safety inspection and testing', '🔒', 6, true),
-- Cleaning Subcategories
('650e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440003', 'Bathroom Cleaning', 'Deep bathroom cleaning and sanitization', '🚿', 1, true),
('650e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440003', 'AC Cleaning', 'Air conditioner cleaning and maintenance', '❄️', 2, true),
('650e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440003', 'Water Tank Cleaning', 'Water tank cleaning and sanitization', '💧', 3, true),
('650e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440003', 'Car Wash', 'Professional car washing services', '🚗', 4, true),
('650e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440003', 'Septic Tank Cleaning', 'Septic tank cleaning and maintenance', '🔄', 5, true),
('650e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440003', 'Water Purifier Cleaning', 'Water purifier cleaning and filter replacement', '💧', 6, true),
-- Transportation Subcategories  
('650e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440004', 'Courier Service', 'Pickup and delivery services', '📦', 1, true),
('650e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440004', 'CAB Booking', 'Taxi and cab booking services', '🚕', 2, true),
('650e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440004', 'Vehicle Breakdown', 'Vehicle breakdown assistance', '🔧', 3, true),
('650e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440004', 'Photographer', 'Event and product photography services', '📸', 4, true),
-- Documentation Subcategories
('650e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440005', 'GST Registration', 'GST registration and filing', '📊', 1, true),
('650e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440005', 'PAN Card Services', 'PAN card application and services', '🆔', 2, true),
('650e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440005', 'ITR Filing', 'Income tax return filing', '📋', 3, true),
('650e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440005', 'Stamp Paper & Agreement', 'Legal documentation and stamp paper services', '⚖️', 4, true),
-- Personal Care Subcategories
('650e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440006', 'Medicine Delivery', 'Home medicine delivery services', '💊', 1, true),
('650e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440006', 'Salon at Home', 'Beauty and salon services at home', '💅', 2, true),
('650e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440006', 'Health Checkup', 'Health checkup and physiotherapy', '🏥', 3, true),
-- Home Improvement Subcategories
('650e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440007', 'House Painting', 'Interior and exterior house painting', '🎨', 1, true),
('650e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440007', 'Tile Work', 'Tile and marble installation', '🏠', 2, true),
('650e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440007', 'Home Repairs', 'General home repair services', '🔨', 3, true);

-- Copy subcategories to legacy table for compatibility
INSERT INTO public.subcategories SELECT * FROM public.service_subcategories;

-- Insert Sample Services (28 services across all categories)
INSERT INTO public.services (id, name, category_id, subcategory_id, description, short_description, base_price, discounted_price, duration, is_active, is_featured) VALUES 
-- Plumbing Services (6 services)
('750e8400-e29b-41d4-a716-446655440001', 'Bathroom Tap Installation', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Professional installation of bathroom taps and fixtures', 'Expert tap installation service', 299.00, 249.00, '1-2 hours', true, true),
('750e8400-e29b-41d4-a716-446655440002', 'Kitchen Sink Installation', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', 'Complete kitchen sink installation with plumbing connections', 'Kitchen sink setup service', 499.00, 399.00, '2-3 hours', true, false),
('750e8400-e29b-41d4-a716-446655440003', 'Toilet Installation & Repair', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', 'Professional toilet installation and repair services', 'Complete toilet services', 799.00, 699.00, '2-4 hours', true, true),
('750e8400-e29b-41d4-a716-446655440004', 'Water Tank Installation', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440004', 'Water tank installation and connection services', 'Water tank setup', 999.00, 899.00, '3-5 hours', true, false),
('750e8400-e29b-41d4-a716-446655440005', 'Pipe Repair & Installation', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440005', 'Pipe repair, replacement and new installation', 'Pipe services', 399.00, 349.00, '1-3 hours', true, false),
('750e8400-e29b-41d4-a716-446655440006', 'Bathroom Grouting Service', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440006', 'Professional bathroom tile grouting and sealing', 'Bathroom grouting', 599.00, 549.00, '2-4 hours', true, false),

-- Electrical Services (5 services)
('750e8400-e29b-41d4-a716-446655440011', 'House Wiring Installation', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440011', 'Complete house wiring installation by certified electricians', 'Professional house wiring', 1999.00, 1799.00, '1-2 days', true, true),
('750e8400-e29b-41d4-a716-446655440012', 'Appliance Repair Service', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440012', 'Home appliance repair and maintenance services', 'Appliance repair', 299.00, 249.00, '1-2 hours', true, false),
('750e8400-e29b-41d4-a716-446655440013', 'Switch & Socket Installation', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440013', 'Installation of electrical switches and sockets', 'Switch installation', 199.00, 149.00, '30-60 minutes', true, false),
('750e8400-e29b-41d4-a716-446655440014', 'Ceiling Fan Installation', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440014', 'Professional ceiling and wall fan installation', 'Fan installation', 399.00, 349.00, '1-2 hours', true, true),
('750e8400-e29b-41d4-a716-446655440015', 'LED Light Installation', '550e8400-e29b-41d4-a716-446655440002', '650e8400-e29b-41d4-a716-446655440015', 'LED and decorative lighting installation services', 'LED installation', 299.00, 249.00, '1-2 hours', true, false),

-- Cleaning Services (6 services)
('750e8400-e29b-41d4-a716-446655440021', 'Bathroom Deep Cleaning', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440021', 'Professional deep cleaning and sanitization of bathrooms', 'Bathroom deep clean', 399.00, 349.00, '2-3 hours', true, true),
('750e8400-e29b-41d4-a716-446655440022', 'AC Service & Cleaning', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440022', 'Complete AC cleaning and maintenance service', 'AC service', 599.00, 499.00, '2-3 hours', true, true),
('750e8400-e29b-41d4-a716-446655440023', 'Water Tank Cleaning', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440023', 'Professional water tank cleaning and sanitization', 'Tank cleaning', 899.00, 799.00, '3-4 hours', true, false),
('750e8400-e29b-41d4-a716-446655440024', 'Car Washing Service', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440024', 'Professional car washing and detailing service', 'Car wash', 299.00, 249.00, '1-2 hours', true, false),
('750e8400-e29b-41d4-a716-446655440025', 'Septic Tank Cleaning', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440025', 'Professional septic tank cleaning and maintenance', 'Septic cleaning', 1499.00, 1299.00, '3-5 hours', true, false),
('750e8400-e29b-41d4-a716-446655440026', 'Water Purifier Service', '550e8400-e29b-41d4-a716-446655440003', '650e8400-e29b-41d4-a716-446655440026', 'Water purifier cleaning and filter replacement', 'Purifier service', 399.00, 349.00, '1-2 hours', true, false),

-- Transportation Services (4 services)
('750e8400-e29b-41d4-a716-446655440031', 'Courier & Delivery', '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440031', 'Reliable pickup and delivery services across the city', 'Courier service', 99.00, 79.00, '2-6 hours', true, false),
('750e8400-e29b-41d4-a716-446655440032', 'Taxi Booking Service', '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440032', 'Professional taxi and cab booking services', 'Taxi booking', 199.00, 149.00, 'As needed', true, false),
('750e8400-e29b-41d4-a716-446655440033', 'Vehicle Breakdown Assistance', '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440033', '24/7 vehicle breakdown assistance and towing', 'Breakdown service', 599.00, 499.00, '1-3 hours', true, true),
('750e8400-e29b-41d4-a716-446655440034', 'Photography Service', '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440034', 'Professional event and product photography services', 'Photography', 1999.00, 1699.00, '2-8 hours', true, false),

-- Documentation Services (4 services)
('750e8400-e29b-41d4-a716-446655440041', 'GST Registration Service', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440041', 'Complete GST registration and filing assistance', 'GST registration', 1499.00, 1299.00, '3-7 days', true, false),
('750e8400-e29b-41d4-a716-446655440042', 'PAN Card Application', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440042', 'PAN card application and correction services', 'PAN card service', 499.00, 399.00, '7-15 days', true, false),
('750e8400-e29b-41d4-a716-446655440043', 'ITR Filing Service', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440043', 'Professional income tax return filing service', 'ITR filing', 999.00, 799.00, '2-5 days', true, true),
('750e8400-e29b-41d4-a716-446655440044', 'Legal Documentation', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440044', 'Stamp paper, agreements and legal documentation', 'Legal docs', 699.00, 599.00, '1-3 days', true, false),

-- Personal Care Services (3 services)  
('750e8400-e29b-41d4-a716-446655440051', 'Medicine Home Delivery', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440051', 'Prescription medicine delivery to your doorstep', 'Medicine delivery', 49.00, 29.00, '30-120 minutes', true, false),
('750e8400-e29b-41d4-a716-446655440052', 'Home Salon Service', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440052', 'Professional beauty and salon services at home', 'Home salon', 799.00, 699.00, '1-3 hours', true, true),
('750e8400-e29b-41d4-a716-446655440053', 'Home Health Checkup', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440053', 'Comprehensive health checkup at your home', 'Health checkup', 1299.00, 1099.00, '1-2 hours', true, false);

-- Insert Coupons
INSERT INTO public.coupons (id, code, name, description, discount_type, discount_value, minimum_amount, maximum_discount, usage_limit, used_count, is_active, valid_from, valid_until) VALUES 
('54615e55-a281-422e-9e11-1f54bb03c2c7', 'WELCOME50', 'Welcome Offer', 'Get 50% off on your first service booking', 'percentage', 50.00, 199.00, NULL, 1000, 0, true, '2025-10-29', '2025-11-28'),
('f0266ae8-b755-4ac3-a4a8-4e6576c8f59d', 'SAVE100', 'Save 100 Rupees', 'Flat ₹100 off on orders above ₹500', 'fixed', 100.00, 500.00, NULL, 500, 0, true, '2025-10-29', '2025-12-28'),
('1430ecdb-14dc-4130-9068-49e81022276f', 'NEWUSER25', 'New User Discount', '25% off for new customers', 'percentage', 25.00, 299.00, NULL, 2000, 0, true, '2025-10-29', '2026-01-27'),
('7f636c64-f83b-4003-9e88-f11d1a4f3ef5', 'PLUMBING20', 'Plumbing Special', '20% off on all plumbing services', 'percentage', 20.00, 199.00, NULL, 300, 0, true, '2025-10-29', '2025-12-13'),
('b171c0cc-4d8e-4f9e-85c4-9da685510205', 'ELECTRICAL15', 'Electrical Discount', '15% off on electrical services', 'percentage', 15.00, 199.00, NULL, 250, 0, true, '2025-10-29', '2025-12-13'),
('06ab5b79-f8ba-4959-8ecf-84c7e9391959', 'CLEANING30', 'Cleaning Special', '30% off on cleaning services', 'percentage', 30.00, 149.00, NULL, 400, 0, true, '2025-10-29', '2025-11-28');

-- Insert Banners
INSERT INTO public.banners (id, title, subtitle, description, button_text, button_link, background_color, text_color, "position", sort_order, is_active) VALUES 
('ebc273fa-6735-4a38-90bf-f2029750b723', 'Professional Home Services', 'At Your Doorstep', 'Get reliable, professional services for your home. From plumbing to cleaning, we connect you with trusted professionals in your area.', 'Browse Services', '/services', '#ffffff', '#000000', 'hero', 1, true),
('375a8d6e-1fcb-46fe-866f-821648963968', 'Special Offer', 'Up to 50% Off', 'Limited time offer on all services. Book now and save big on your home maintenance needs.', 'Get Offer', '/offers', '#ffffff', '#000000', 'promotional', 1, true),
('4dfc2218-27dd-4a57-9099-c0ae32d16ee3', '24/7 Service Support', 'We Are Always Here', 'Round the clock customer support for all your service needs. Call us anytime for assistance.', 'Contact Us', '/contact', '#ffffff', '#000000', 'secondary', 1, true);

-- Insert Contact Settings  
INSERT INTO public.contact_settings (id, company_name, tagline, phone, emergency_phone, whatsapp_number, email, address, facebook_url) VALUES 
('998367c2-80f9-44a8-bded-f3b8cab2ee8f', 'Happy Homes', 'Your Trusted Home Service Partner', '9437341234', '9437341234', '9437341234', 'care@happyhomesworld.com', 'Bhubaneswar, Odisha 751001', 'https://www.facebook.com/happyhomes.official');

-- Insert Admin Permissions
INSERT INTO public.admin_permissions (id, permission_key, permission_name, permission_description, category, is_active, created_at, updated_at) VALUES
-- Dashboard & Analytics
('11111111-1111-1111-1111-111111111111', 'dashboard.view', 'Dashboard Access', 'Access to main admin dashboard', 'page', true, NOW(), NOW()),
('11111111-1111-1111-1111-111111111112', 'analytics.view', 'Analytics Dashboard', 'Access to analytics and reporting', 'page', true, NOW(), NOW()),

-- Content Management
('11111111-1111-1111-1111-111111111113', 'categories.manage', 'Categories Management', 'Manage service categories', 'page', true, NOW(), NOW()),
('11111111-1111-1111-1111-111111111114', 'services.manage', 'Services Management', 'Manage services and variants', 'page', true, NOW(), NOW()),
('11111111-1111-1111-1111-111111111115', 'banners.manage', 'Banner Management', 'Manage promotional banners', 'page', true, NOW(), NOW()),

-- Customer & Orders
('11111111-1111-1111-1111-111111111116', 'orders.manage', 'Orders Management', 'View and manage customer orders', 'page', true, NOW(), NOW()),
('11111111-1111-1111-1111-111111111117', 'customers.view', 'Customer Management', 'View customer information', 'page', true, NOW(), NOW()),

-- Business Management
('11111111-1111-1111-1111-111111111118', 'coupons.manage', 'Coupon Management', 'Create and manage discount coupons', 'page', true, NOW(), NOW()),
('11111111-1111-1111-1111-111111111119', 'engineers.manage', 'Engineers Management', 'Manage service engineers', 'page', true, NOW(), NOW()),
('11111111-1111-1111-1111-111111111120', 'reviews.manage', 'Reviews Management', 'Moderate customer reviews', 'page', true, NOW(), NOW()),

-- System Configuration
('11111111-1111-1111-1111-111111111121', 'settings.contact', 'Contact Settings', 'Update contact information', 'page', true, NOW(), NOW()),
('11111111-1111-1111-1111-111111111122', 'settings.review', 'Review Settings', 'Configure review system', 'page', true, NOW(), NOW()),
('11111111-1111-1111-1111-111111111123', 'settings.sms', 'SMS Configuration', 'Configure SMS providers', 'page', true, NOW(), NOW()),

-- Super Admin Only
('11111111-1111-1111-1111-111111111124', 'users.manage', 'User Management', 'Create and manage admin users', 'page', true, NOW(), NOW()),
('11111111-1111-1111-1111-111111111125', 'permissions.manage', 'Permission Management', 'Assign permissions to admin users', 'page', true, NOW(), NOW());

-- Insert Sample Review Settings (default configuration)
INSERT INTO public.review_settings (id, auto_approve_reviews, require_booking_for_review, minimum_rating_threshold, maximum_reviews_per_user_per_service, review_moderation_enabled, display_average_rating, display_review_count, allow_anonymous_reviews, updated_by, created_at, updated_at) VALUES
('22222222-2222-2222-2222-222222222222', false, true, 1, 1, true, true, true, false, '43942929-b0ef-4f4b-a910-3c4e5a14b002', NOW(), NOW());

-- Log successful initialization
SELECT 'Database household_services initialized successfully with complete schema and seed data' as message;

-- ==============================================================================
-- END OF FINAL COMPLETE SETUP
-- ==============================================================================