-- ==============================================================================
-- FINAL COMPLETE HOUSEHOLD SERVICES DATABASE SETUP
-- Single comprehensive migration and seed file
-- This is the ONLY file needed for complete database initialization
-- ==============================================================================

-- Database initialization (skip if running in specific database context)
-- CREATE DATABASE household_services;

-- Connect to the household_services database (skip for targeted database runs)
-- \c household_services;

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
DROP TABLE IF EXISTS sms_providers CASCADE;
DROP TABLE IF EXISTS sms_provider_stats CASCADE;
DROP TABLE IF EXISTS sms_templates CASCADE;
DROP TABLE IF EXISTS sms_blacklist CASCADE;
DROP TABLE IF EXISTS sms_webhooks CASCADE;

-- ==============================================================================
-- TABLE CREATION - COMPLETE SCHEMA
-- ==============================================================================

SET default_tablespace = '';
SET default_table_access_method = heap;


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
    service_id uuid NOT NULL,
    service_name character varying(100) NOT NULL,
    variant_id uuid,
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
    title character varying(200) NOT NULL,
    description text,
    discount_type character varying(20) DEFAULT 'percentage'::character varying,
    discount_value double precision NOT NULL,
    minimum_order_amount double precision DEFAULT 0.0,
    maximum_discount_amount double precision,
    usage_limit integer,
    usage_count integer DEFAULT 0,
    usage_limit_per_user integer,
    first_time_users_only boolean DEFAULT false NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    valid_from date NOT NULL,
    valid_until date NOT NULL,
    applicable_categories JSONB DEFAULT '[]'::JSONB,
    applicable_services JSONB DEFAULT '[]'::JSONB,
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

-- SMS Providers Table
CREATE TABLE public.sms_providers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    provider_type character varying(50) NOT NULL CHECK (provider_type IN ('twilio', 'textlocal', 'teleo', 'aws_sns', 'mock')),
    description text,
    is_enabled boolean DEFAULT false,
    is_primary boolean DEFAULT false,
    priority integer DEFAULT 1 CHECK (priority > 0),
    config_data jsonb DEFAULT '{}' NOT NULL,
    daily_limit integer CHECK (daily_limit > 0),
    rate_limit_per_minute integer DEFAULT 60 CHECK (rate_limit_per_minute > 0),
    cost_per_sms numeric(10,4) CHECK (cost_per_sms >= 0),
    last_used_at timestamp with time zone,
    total_sent integer DEFAULT 0 CHECK (total_sent >= 0),
    total_failed integer DEFAULT 0 CHECK (total_failed >= 0),
    current_balance numeric(15,4),
    balance_updated_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    created_by character varying(100),
    updated_by character varying(100)
);

-- SMS Provider Statistics Table
CREATE TABLE public.sms_provider_stats (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_id uuid NOT NULL,
    date date NOT NULL,
    messages_sent integer DEFAULT 0 CHECK (messages_sent >= 0),
    messages_failed integer DEFAULT 0 CHECK (messages_failed >= 0),
    messages_delivered integer DEFAULT 0 CHECK (messages_delivered >= 0),
    avg_response_time_ms numeric(10,2),
    total_cost numeric(15,4) DEFAULT 0.0 CHECK (total_cost >= 0),
    error_codes jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- SMS Templates Table
CREATE TABLE public.sms_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    event_type character varying(50) NOT NULL,
    message_template text NOT NULL,
    variables jsonb DEFAULT '[]',
    is_active boolean DEFAULT true,
    max_length integer DEFAULT 160 CHECK (max_length > 0),
    provider_overrides jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- SMS Blacklist Table
CREATE TABLE public.sms_blacklist (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    phone_number character varying(20) NOT NULL,
    reason character varying(200),
    added_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    added_by character varying(100)
);

-- SMS Webhook Logs Table
CREATE TABLE public.sms_webhooks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    provider_type character varying(50) NOT NULL,
    message_id character varying(100),
    webhook_data jsonb NOT NULL,
    delivery_status character varying(50),
    delivered_at timestamp with time zone,
    processed boolean DEFAULT false,
    processed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Orders Table (Enhanced Version)
CREATE TABLE public.orders (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_number character varying(50) NOT NULL,
    customer_id uuid NOT NULL,
    customer_name character varying(100) NOT NULL,
    customer_phone character varying(20) NOT NULL,
    customer_email character varying(100) NOT NULL,
    service_address jsonb NOT NULL,
    total_amount numeric(10,2) DEFAULT 0.00 NOT NULL,
    discount_amount numeric(10,2) DEFAULT 0.00 NOT NULL,
    gst_amount numeric(10,2) DEFAULT 0.00 NOT NULL,
    service_charge numeric(10,2) DEFAULT 0.00 NOT NULL,
    final_amount numeric(10,2) DEFAULT 0.00 NOT NULL,
    status character varying(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'confirmed', 'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
    priority character varying(10) DEFAULT 'medium' NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    notes text,
    admin_notes text,
    customer_rating integer CHECK (customer_rating >= 1 AND customer_rating <= 5),
    customer_review text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Order Items Table (Enhanced Version)
CREATE TABLE public.order_items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    service_id uuid NOT NULL,
    service_name character varying(100) NOT NULL,
    variant_id uuid,
    variant_name character varying(50),
    quantity integer DEFAULT 1 NOT NULL CHECK (quantity > 0),
    unit_price numeric(10,2) DEFAULT 0.00 NOT NULL,
    total_price numeric(10,2) DEFAULT 0.00 NOT NULL,
    category_id uuid NOT NULL,
    subcategory_id uuid NOT NULL,
    assigned_engineer_id uuid,
    assigned_engineer_name character varying(100),
    item_status character varying(20) DEFAULT 'pending' NOT NULL CHECK (item_status IN ('pending', 'scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
    scheduled_date character varying(20),
    scheduled_time_slot character varying(20),
    completion_date character varying(20),
    item_notes text,
    item_rating integer CHECK (item_rating >= 1 AND item_rating <= 5),
    item_review text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Assignment History Table (Enhanced Version)
CREATE TABLE public.assignment_history (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    order_id uuid NOT NULL,
    item_id uuid NOT NULL,
    engineer_id uuid,
    engineer_name character varying(100) NOT NULL,
    action_type character varying(20) NOT NULL CHECK (action_type IN ('assigned', 'reassigned', 'unassigned')),
    notes text,
    created_by character varying(50) NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Bookings Table
CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    service_id uuid NOT NULL,
    variant_id uuid,
    address_id uuid NOT NULL,
    scheduled_date timestamp with time zone NOT NULL,
    scheduled_time_start character varying(10) NOT NULL,
    scheduled_time_end character varying(10) NOT NULL,
    status character varying(20) DEFAULT 'pending' NOT NULL,
    quantity integer DEFAULT 1 NOT NULL,
    unit_price double precision NOT NULL,
    subtotal_amount double precision NOT NULL,
    discount_amount double precision DEFAULT 0.0 NOT NULL,
    tax_amount double precision DEFAULT 0.0 NOT NULL,
    total_amount double precision NOT NULL,
    coupon_id uuid,
    coupon_code character varying(50),
    customer_notes text,
    customizations jsonb DEFAULT '{}' NOT NULL,
    admin_notes text,
    assigned_technician_id uuid,
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    cancelled_at timestamp with time zone,
    cancellation_reason text,
    payment_status character varying(20) DEFAULT 'pending' NOT NULL,
    payment_method character varying(50),
    transaction_id character varying(100),
    invoice_number character varying(50),
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE public.notifications (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    customer_id character varying(255) NOT NULL,
    customer_name character varying(100) NOT NULL,
    customer_phone character varying(20),
    customer_email character varying(100),
    notification_type character varying(20) NOT NULL CHECK (notification_type IN ('sms', 'email', 'push')),
    event_type character varying(50) NOT NULL,
    priority character varying(20) DEFAULT 'normal' NOT NULL CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    subject character varying(200),
    message text NOT NULL,
    order_id uuid,
    order_number character varying(50),
    template_id uuid,
    status character varying(20) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'sent', 'delivered', 'failed', 'cancelled')),
    provider_name character varying(50),
    provider_message_id character varying(100),
    sent_at timestamp with time zone,
    delivered_at timestamp with time zone,
    failed_at timestamp with time zone,
    failure_reason text,
    retry_count integer DEFAULT 0,
    max_retries integer DEFAULT 3,
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Notification Templates Table
CREATE TABLE public.notification_templates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name character varying(100) NOT NULL,
    event_type character varying(50) NOT NULL,
    notification_type character varying(20) NOT NULL CHECK (notification_type IN ('sms', 'email', 'push')),
    subject_template character varying(200),
    message_template text NOT NULL,
    variables jsonb DEFAULT '[]',
    is_active boolean DEFAULT true NOT NULL,
    language character varying(10) DEFAULT 'en' NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- User Notification Preferences Table
CREATE TABLE public.user_notification_preferences (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    sms_enabled boolean DEFAULT true NOT NULL,
    email_enabled boolean DEFAULT true NOT NULL,
    push_enabled boolean DEFAULT true NOT NULL,
    marketing_sms boolean DEFAULT false NOT NULL,
    marketing_email boolean DEFAULT false NOT NULL,
    order_updates boolean DEFAULT true NOT NULL,
    appointment_reminders boolean DEFAULT true NOT NULL,
    promotional_offers boolean DEFAULT false NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Notification Logs Table
CREATE TABLE public.notification_logs (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    notification_id uuid NOT NULL,
    log_level character varying(20) DEFAULT 'info' NOT NULL CHECK (log_level IN ('debug', 'info', 'warn', 'error')),
    message text NOT NULL,
    error_code character varying(50),
    provider_response jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Payment Webhooks Table
CREATE TABLE public.payment_webhooks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    payment_id uuid,
    provider_name character varying(50) NOT NULL,
    webhook_event character varying(50) NOT NULL,
    webhook_data jsonb NOT NULL,
    processed boolean DEFAULT false,
    processed_at timestamp with time zone,
    error_message text,
    retry_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Review Photos Table
CREATE TABLE public.review_photos (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    review_id uuid NOT NULL,
    photo_url character varying(500) NOT NULL,
    caption character varying(200),
    sort_order integer DEFAULT 1,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Review Helpfulness Table
CREATE TABLE public.review_helpfulness (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    review_id uuid NOT NULL,
    user_id uuid NOT NULL,
    is_helpful boolean NOT NULL,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- Engineers Table (alias for employees with enhanced fields)
CREATE TABLE public.engineers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    employee_id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    email character varying(100),
    phone character varying(20) NOT NULL,
    address text,
    expertise jsonb DEFAULT '[]',
    specializations jsonb DEFAULT '[]',
    rating double precision DEFAULT 0.0,
    total_jobs integer DEFAULT 0,
    completed_jobs integer DEFAULT 0,
    cancelled_jobs integer DEFAULT 0,
    current_active_jobs integer DEFAULT 0,
    max_concurrent_jobs integer DEFAULT 5,
    is_available boolean DEFAULT true NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    hire_date date,
    emergency_contact_name character varying(100),
    emergency_contact_phone character varying(20),
    license_number character varying(50),
    certification_details jsonb DEFAULT '{}',
    work_schedule jsonb DEFAULT '{}',
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);

-- ==============================================================================
-- PRIMARY KEYS AND CONSTRAINTS
-- ==============================================================================

ALTER TABLE ONLY public.banners ADD CONSTRAINT banners_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cart_items ADD CONSTRAINT cart_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.cart ADD CONSTRAINT cart_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.service_categories ADD CONSTRAINT service_categories_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.contact_settings ADD CONSTRAINT contact_settings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.coupons ADD CONSTRAINT coupons_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.coupon_usages ADD CONSTRAINT coupon_usages_pkey PRIMARY KEY (id);
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
ALTER TABLE ONLY public.sms_providers ADD CONSTRAINT sms_providers_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sms_provider_stats ADD CONSTRAINT sms_provider_stats_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sms_templates ADD CONSTRAINT sms_templates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sms_blacklist ADD CONSTRAINT sms_blacklist_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.sms_webhooks ADD CONSTRAINT sms_webhooks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.assignment_history ADD CONSTRAINT assignment_history_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.bookings ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notification_templates ADD CONSTRAINT notification_templates_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_notification_preferences ADD CONSTRAINT user_notification_preferences_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.notification_logs ADD CONSTRAINT notification_logs_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.payment_webhooks ADD CONSTRAINT payment_webhooks_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.review_photos ADD CONSTRAINT review_photos_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.review_helpfulness ADD CONSTRAINT review_helpfulness_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.engineers ADD CONSTRAINT engineers_pkey PRIMARY KEY (id);

-- Unique constraints
ALTER TABLE ONLY public.coupons ADD CONSTRAINT coupons_code_key UNIQUE (code);
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_order_number_key UNIQUE (order_number);
ALTER TABLE ONLY public.users ADD CONSTRAINT users_email_key UNIQUE (email);
ALTER TABLE ONLY public.admin_permissions ADD CONSTRAINT admin_permissions_permission_key_key UNIQUE (permission_key);
ALTER TABLE ONLY public.payments ADD CONSTRAINT payments_transaction_id_key UNIQUE (transaction_id);
ALTER TABLE ONLY public.offer_plans ADD CONSTRAINT offer_plans_combo_coupon_code_key UNIQUE (combo_coupon_code);
ALTER TABLE ONLY public.user_admin_permissions ADD CONSTRAINT user_admin_permissions_user_id_permission_id_key UNIQUE (user_id, permission_id);
ALTER TABLE ONLY public.sms_blacklist ADD CONSTRAINT sms_blacklist_phone_number_key UNIQUE (phone_number);
ALTER TABLE ONLY public.sms_templates ADD CONSTRAINT sms_templates_event_type_key UNIQUE (event_type);
ALTER TABLE ONLY public.sms_provider_stats ADD CONSTRAINT sms_provider_stats_provider_date_key UNIQUE (provider_id, date);
ALTER TABLE ONLY public.bookings ADD CONSTRAINT bookings_transaction_id_key UNIQUE (transaction_id);
ALTER TABLE ONLY public.bookings ADD CONSTRAINT bookings_invoice_number_key UNIQUE (invoice_number);
ALTER TABLE ONLY public.notification_templates ADD CONSTRAINT notification_templates_event_type_notification_type_key UNIQUE (event_type, notification_type, language);
ALTER TABLE ONLY public.user_notification_preferences ADD CONSTRAINT user_notification_preferences_user_id_key UNIQUE (user_id);
ALTER TABLE ONLY public.review_helpfulness ADD CONSTRAINT review_helpfulness_review_user_key UNIQUE (review_id, user_id);
ALTER TABLE ONLY public.engineers ADD CONSTRAINT engineers_employee_id_key UNIQUE (employee_id);
ALTER TABLE ONLY public.engineers ADD CONSTRAINT engineers_user_id_key UNIQUE (user_id);
ALTER TABLE ONLY public.sms_providers ADD CONSTRAINT sms_providers_name_key UNIQUE (name);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE
-- ==============================================================================

CREATE INDEX idx_cart_items_cart_id ON public.cart_items USING btree (cart_id);
CREATE INDEX idx_cart_user_id ON public.cart USING btree (user_id);
CREATE INDEX idx_coupon_usages_coupon_id ON public.coupon_usages USING btree (coupon_id);
CREATE INDEX idx_coupon_usages_user_id ON public.coupon_usages USING btree (user_id);
CREATE INDEX idx_coupon_usages_order_id ON public.coupon_usages USING btree (order_id);
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
CREATE INDEX idx_sms_providers_type ON public.sms_providers USING btree (provider_type);
CREATE INDEX idx_sms_providers_enabled ON public.sms_providers USING btree (is_enabled);
CREATE INDEX idx_sms_providers_primary ON public.sms_providers USING btree (is_primary);
CREATE INDEX idx_sms_providers_priority ON public.sms_providers USING btree (priority);
CREATE INDEX idx_sms_provider_stats_provider ON public.sms_provider_stats USING btree (provider_id);
CREATE INDEX idx_sms_provider_stats_date ON public.sms_provider_stats USING btree (date);
CREATE INDEX idx_sms_templates_event_type ON public.sms_templates USING btree (event_type);
CREATE INDEX idx_sms_templates_active ON public.sms_templates USING btree (is_active);
CREATE INDEX idx_sms_blacklist_phone ON public.sms_blacklist USING btree (phone_number);
CREATE INDEX idx_sms_webhooks_provider ON public.sms_webhooks USING btree (provider_type);
CREATE INDEX idx_sms_webhooks_message_id ON public.sms_webhooks USING btree (message_id);
CREATE INDEX idx_sms_webhooks_processed ON public.sms_webhooks USING btree (processed);
CREATE INDEX idx_sms_webhooks_created ON public.sms_webhooks USING btree (created_at);
CREATE UNIQUE INDEX idx_sms_providers_single_primary ON public.sms_providers USING btree (is_primary) WHERE (is_primary = true);
CREATE INDEX idx_orders_customer_id ON public.orders USING btree (customer_id);
CREATE INDEX idx_orders_order_number ON public.orders USING btree (order_number);
CREATE INDEX idx_orders_status ON public.orders USING btree (status);
CREATE INDEX idx_orders_priority ON public.orders USING btree (priority);
CREATE INDEX idx_orders_created_at ON public.orders USING btree (created_at);
CREATE INDEX idx_order_items_order_id ON public.order_items USING btree (order_id);
CREATE INDEX idx_order_items_service_id ON public.order_items USING btree (service_id);
CREATE INDEX idx_order_items_category_id ON public.order_items USING btree (category_id);
CREATE INDEX idx_order_items_subcategory_id ON public.order_items USING btree (subcategory_id);
CREATE INDEX idx_order_items_assigned_engineer_id ON public.order_items USING btree (assigned_engineer_id);
CREATE INDEX idx_order_items_item_status ON public.order_items USING btree (item_status);
CREATE INDEX idx_assignment_history_order_id ON public.assignment_history USING btree (order_id);
CREATE INDEX idx_assignment_history_item_id ON public.assignment_history USING btree (item_id);
CREATE INDEX idx_assignment_history_engineer_id ON public.assignment_history USING btree (engineer_id);
CREATE INDEX idx_assignment_history_action_type ON public.assignment_history USING btree (action_type);
CREATE INDEX idx_assignment_history_created_at ON public.assignment_history USING btree (created_at);
CREATE INDEX idx_bookings_user_id ON public.bookings USING btree (user_id);
CREATE INDEX idx_bookings_service_id ON public.bookings USING btree (service_id);
CREATE INDEX idx_bookings_scheduled_date ON public.bookings USING btree (scheduled_date);
CREATE INDEX idx_bookings_status ON public.bookings USING btree (status);
CREATE INDEX idx_bookings_payment_status ON public.bookings USING btree (payment_status);
CREATE INDEX idx_bookings_assigned_technician ON public.bookings USING btree (assigned_technician_id);
CREATE INDEX idx_notifications_customer_id ON public.notifications USING btree (customer_id);
CREATE INDEX idx_notifications_order_id ON public.notifications USING btree (order_id);
CREATE INDEX idx_notifications_event_type ON public.notifications USING btree (event_type);
CREATE INDEX idx_notifications_notification_type ON public.notifications USING btree (notification_type);
CREATE INDEX idx_notifications_status ON public.notifications USING btree (status);
CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at);
CREATE INDEX idx_notification_templates_event_type ON public.notification_templates USING btree (event_type);
CREATE INDEX idx_notification_templates_active ON public.notification_templates USING btree (is_active);
CREATE INDEX idx_user_notification_preferences_user_id ON public.user_notification_preferences USING btree (user_id);
CREATE INDEX idx_notification_logs_notification_id ON public.notification_logs USING btree (notification_id);
CREATE INDEX idx_notification_logs_level ON public.notification_logs USING btree (log_level);
CREATE INDEX idx_payment_webhooks_payment_id ON public.payment_webhooks USING btree (payment_id);
CREATE INDEX idx_payment_webhooks_provider ON public.payment_webhooks USING btree (provider_name);
CREATE INDEX idx_payment_webhooks_processed ON public.payment_webhooks USING btree (processed);
CREATE INDEX idx_review_photos_review_id ON public.review_photos USING btree (review_id);
CREATE INDEX idx_review_helpfulness_review_id ON public.review_helpfulness USING btree (review_id);
CREATE INDEX idx_review_helpfulness_user_id ON public.review_helpfulness USING btree (user_id);
CREATE INDEX idx_engineers_employee_id ON public.engineers USING btree (employee_id);
CREATE INDEX idx_engineers_is_active ON public.engineers USING btree (is_active);
CREATE INDEX idx_engineers_is_available ON public.engineers USING btree (is_available);

-- ==============================================================================
-- FOREIGN KEY CONSTRAINTS
-- ==============================================================================

ALTER TABLE ONLY public.cart_items ADD CONSTRAINT cart_items_cart_id_fkey FOREIGN KEY (cart_id) REFERENCES public.cart(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.cart_items ADD CONSTRAINT cart_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;
-- Cart user_id constraint removed to allow session UUIDs for anonymous users
-- ALTER TABLE ONLY public.cart ADD CONSTRAINT cart_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.coupon_usages ADD CONSTRAINT coupon_usages_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.coupon_usages ADD CONSTRAINT coupon_usages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.coupon_usages ADD CONSTRAINT coupon_usages_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.service_categories(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_subcategory_id_fkey FOREIGN KEY (subcategory_id) REFERENCES public.service_subcategories(id) ON DELETE CASCADE;
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
ALTER TABLE ONLY public.sms_provider_stats ADD CONSTRAINT sms_provider_stats_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES public.sms_providers(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.orders ADD CONSTRAINT orders_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.service_variants(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.order_items ADD CONSTRAINT order_items_assigned_engineer_id_fkey FOREIGN KEY (assigned_engineer_id) REFERENCES public.engineers(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.assignment_history ADD CONSTRAINT assignment_history_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.assignment_history ADD CONSTRAINT assignment_history_item_id_fkey FOREIGN KEY (item_id) REFERENCES public.order_items(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.assignment_history ADD CONSTRAINT assignment_history_engineer_id_fkey FOREIGN KEY (engineer_id) REFERENCES public.engineers(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.bookings ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.bookings ADD CONSTRAINT bookings_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.bookings ADD CONSTRAINT bookings_variant_id_fkey FOREIGN KEY (variant_id) REFERENCES public.service_variants(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.bookings ADD CONSTRAINT bookings_address_id_fkey FOREIGN KEY (address_id) REFERENCES public.user_addresses(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.bookings ADD CONSTRAINT bookings_coupon_id_fkey FOREIGN KEY (coupon_id) REFERENCES public.coupons(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.bookings ADD CONSTRAINT bookings_assigned_technician_fkey FOREIGN KEY (assigned_technician_id) REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.notifications ADD CONSTRAINT notifications_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.notification_templates(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.user_notification_preferences ADD CONSTRAINT user_notification_preferences_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.notification_logs ADD CONSTRAINT notification_logs_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.payment_webhooks ADD CONSTRAINT payment_webhooks_payment_id_fkey FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;
ALTER TABLE ONLY public.review_photos ADD CONSTRAINT review_photos_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.review_helpfulness ADD CONSTRAINT review_helpfulness_review_id_fkey FOREIGN KEY (review_id) REFERENCES public.reviews(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.review_helpfulness ADD CONSTRAINT review_helpfulness_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;
ALTER TABLE ONLY public.engineers ADD CONSTRAINT engineers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- ==============================================================================
-- SEED DATA - COMPLETE INITIAL DATA SET
-- ==============================================================================

-- Insert Admin Users
INSERT INTO public.users (id, created_at, updated_at, email, password_hash, first_name, last_name, phone, role, is_active, is_verified, profile_completed) VALUES 
('43942929-b0ef-4f4b-a910-3c4e5a14b002', NOW(), NOW(), 'superadmin@happyhomes.com', '$2a$10$L6NfFS.5G2ov.mKehJwg9uBreLryZf/NJ39j/hFVTcZds4t6s0Bpu', 'Super', 'Admin', '9437341234', 'super_admin', true, true, false),
('58e31fde-9500-42b8-a916-87cfe7ccccd1', NOW(), NOW(), 'admin@test.com', '$2a$10$L6NfFS.5G2ov.mKehJwg9uBreLryZf/NJ39j/hFVTcZds4t6s0Bpu', 'Test', 'Admin', '9437341235', 'admin', true, true, false),
('f9ac9cfe-173d-4498-aa63-950412f53da5', NOW(), NOW(), 'admin@happyhomes.com', '$2a$10$L6NfFS.5G2ov.mKehJwg9uBreLryZf/NJ39j/hFVTcZds4t6s0Bpu', 'System', 'Administrator', '9437341236', 'super_admin', true, true, false)
ON CONFLICT (id) DO NOTHING;

-- Insert Service Categories
INSERT INTO public.service_categories (id, name, description, icon, image_path, sort_order, is_active) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Plumbing', 'Professional plumbing services for your home', '🔧', '/images/categories/plumbing-hero.jpg', 1, true),
('550e8400-e29b-41d4-a716-446655440002', 'Electrical', 'Certified electrical services and repairs', '⚡', '/images/categories/electrical.jpg', 2, true),
('550e8400-e29b-41d4-a716-446655440003', 'Cleaning', 'Professional cleaning services', '🧹', '/images/categories/cleaning.jpg', 3, true),
('550e8400-e29b-41d4-a716-446655440004', 'Call A Service', 'Transportation, delivery and professional services', '📞', '/images/categories/call-service-hero.jpg', 4, true),
('550e8400-e29b-41d4-a716-446655440005', 'Finance & Insurance', 'Financial documentation and insurance services', '💰', '/images/categories/finance-hero.jpg', 5, true),
('550e8400-e29b-41d4-a716-446655440006', 'Personal Care', 'Health, beauty and personal care services', '💆', '/images/categories/personal-care-hero.jpg', 6, true),
('550e8400-e29b-41d4-a716-446655440007', 'Civil Work', 'Home renovation and construction services', '🏗️', '/images/categories/civil-work-hero.jpg', 7, true)
ON CONFLICT (id) DO NOTHING;

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
-- Call A Service Subcategories  
('650e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440004', 'Courier Service', 'Pickup and delivery services', '📦', 1, true),
('650e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440004', 'CAB Booking', 'Taxi and cab booking services', '🚕', 2, true),
('650e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440004', 'Vehicle Breakdown', 'Vehicle breakdown assistance', '🔧', 3, true),
('650e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440004', 'Photographer', 'Event and product photography services', '📸', 4, true),
-- Finance & Insurance Subcategories
('650e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440005', 'GST Registration', 'GST registration and filing', '📊', 1, true),
('650e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440005', 'PAN Card Services', 'PAN card application and services', '🆔', 2, true),
('650e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440005', 'ITR Filing', 'Income tax return filing', '📋', 3, true),
('650e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440005', 'Stamp Paper & Agreement', 'Legal documentation and stamp paper services', '⚖️', 4, true),
-- Personal Care Subcategories
('650e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440006', 'Medicine Delivery', 'Home medicine delivery services', '💊', 1, true),
('650e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440006', 'Salon at Home', 'Beauty and salon services at home', '💅', 2, true),
('650e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440006', 'Health Checkup', 'Health checkup and physiotherapy', '🏥', 3, true),
-- Civil Work Subcategories
('650e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440007', 'House Painting', 'Interior and exterior house painting', '🎨', 1, true),
('650e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440007', 'Tile Work', 'Tile and marble installation', '🏠', 2, true),
('650e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440007', 'Home Repairs', 'General home repair services', '🔨', 3, true)
ON CONFLICT (id) DO NOTHING;

-- Copy subcategories to legacy table for compatibility
INSERT INTO public.subcategories SELECT * FROM public.service_subcategories ON CONFLICT (id) DO NOTHING;

-- Update Plumbing Subcategory Images
UPDATE service_subcategories SET image_paths = '["images/subcategories/plumbing/bath-fittings/pexels-artbovich-6782356.jpg"]'::jsonb WHERE name = 'Bath Fittings';
UPDATE service_subcategories SET image_paths = '["images/subcategories/plumbing/basin-sink/pexels-artbovich-6782575.jpg"]'::jsonb WHERE name = 'Basin & Sink';
UPDATE service_subcategories SET image_paths = '["images/subcategories/plumbing/toilet-classic/pexels-artbovich-6444240.jpg"]'::jsonb WHERE name = 'Toilets';
UPDATE service_subcategories SET image_paths = '["images/subcategories/plumbing/water-tank/pexels-nc-farm-bureau-mark-7509423.jpg"]'::jsonb WHERE name = 'Water Tank';
UPDATE service_subcategories SET image_paths = '["images/subcategories/plumbing/pipes/pexels-anilkarakaya-6419128.jpg"]'::jsonb WHERE name = 'Pipes';
UPDATE service_subcategories SET image_paths = '["images/subcategories/plumbing/grouting/pexels-liliana-drew-9462766.jpg"]'::jsonb WHERE name = 'Grouting';

-- Create alias table for backward compatibility (categories = service_categories)
CREATE VIEW public.categories AS SELECT * FROM public.service_categories;

-- Insert Sample Services (32 services across all categories - includes Toilet Classic & Premium)
INSERT INTO public.services (id, name, category_id, subcategory_id, description, short_description, base_price, discounted_price, duration, is_active, is_featured) VALUES 
-- Plumbing Services (7 services - includes Toilet Classic & Premium)
('750e8400-e29b-41d4-a716-446655440001', 'Bathroom Tap Installation', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440001', 'Professional installation of bathroom taps and fixtures', 'Expert tap installation service', 299.00, 249.00, '1-2 hours', true, true),
('750e8400-e29b-41d4-a716-446655440002', 'Kitchen Sink Installation', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440002', 'Complete kitchen sink installation with plumbing connections', 'Kitchen sink setup service', 499.00, 399.00, '2-3 hours', true, false),
('750e8400-e29b-41d4-a716-446655440003', 'Toilet Service (Classic)', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', 'Professional toilet installation and repair services - Classic package with essential services', 'Classic toilet services', 299.00, 199.00, '2-4 hours', true, true),
('750e8400-e29b-41d4-a716-446655440099', 'Toilet Service (Premium)', '550e8400-e29b-41d4-a716-446655440001', '650e8400-e29b-41d4-a716-446655440003', 'Premium toilet installation and repair services with advanced features and warranty', 'Premium toilet service with extended warranty', 499.00, 349.00, '2-4 hours', true, true),
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

-- Call A Service Services (4 services)
('750e8400-e29b-41d4-a716-446655440031', 'Courier & Delivery', '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440031', 'Reliable pickup and delivery services across the city', 'Courier service', 99.00, 79.00, '2-6 hours', true, false),
('750e8400-e29b-41d4-a716-446655440032', 'Taxi Booking Service', '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440032', 'Professional taxi and cab booking services', 'Taxi booking', 199.00, 149.00, 'As needed', true, false),
('750e8400-e29b-41d4-a716-446655440033', 'Vehicle Breakdown Assistance', '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440033', '24/7 vehicle breakdown assistance and towing', 'Breakdown service', 599.00, 499.00, '1-3 hours', true, true),
('750e8400-e29b-41d4-a716-446655440034', 'Photography Service', '550e8400-e29b-41d4-a716-446655440004', '650e8400-e29b-41d4-a716-446655440034', 'Professional event and product photography services', 'Photography', 1999.00, 1699.00, '2-8 hours', true, false),

-- Finance & Insurance Services (4 services)
('750e8400-e29b-41d4-a716-446655440041', 'GST Registration Service', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440041', 'Complete GST registration and filing assistance', 'GST registration', 1499.00, 1299.00, '3-7 days', true, false),
('750e8400-e29b-41d4-a716-446655440042', 'PAN Card Application', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440042', 'PAN card application and correction services', 'PAN card service', 499.00, 399.00, '7-15 days', true, false),
('750e8400-e29b-41d4-a716-446655440043', 'ITR Filing Service', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440043', 'Professional income tax return filing service', 'ITR filing', 999.00, 799.00, '2-5 days', true, true),
('750e8400-e29b-41d4-a716-446655440044', 'Legal Documentation', '550e8400-e29b-41d4-a716-446655440005', '650e8400-e29b-41d4-a716-446655440044', 'Stamp paper, agreements and legal documentation', 'Legal docs', 699.00, 599.00, '1-3 days', true, false),

-- Personal Care Services (3 services)  
('750e8400-e29b-41d4-a716-446655440051', 'Medicine Home Delivery', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440051', 'Prescription medicine delivery to your doorstep', 'Medicine delivery', 49.00, 29.00, '30-120 minutes', true, false),
('750e8400-e29b-41d4-a716-446655440052', 'Home Salon Service', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440052', 'Professional beauty and salon services at home', 'Home salon', 799.00, 699.00, '1-3 hours', true, true),
('750e8400-e29b-41d4-a716-446655440053', 'Home Health Checkup', '550e8400-e29b-41d4-a716-446655440006', '650e8400-e29b-41d4-a716-446655440053', 'Comprehensive health checkup at your home', 'Health checkup', 1299.00, 1099.00, '1-2 hours', true, false),

-- Civil Work Services (3 services)
('750e8400-e29b-41d4-a716-446655440061', 'House Painting Service', '550e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440061', 'Professional interior and exterior house painting', 'House painting', 2999.00, 2499.00, '2-5 days', true, true),
('750e8400-e29b-41d4-a716-446655440062', 'Tile & Marble Work', '550e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440062', 'Professional tile and marble installation services', 'Tile work', 1999.00, 1699.00, '1-3 days', true, false),
('750e8400-e29b-41d4-a716-446655440063', 'General Home Repairs', '550e8400-e29b-41d4-a716-446655440007', '650e8400-e29b-41d4-a716-446655440063', 'Comprehensive home repair and maintenance services', 'Home repairs', 899.00, 799.00, '4-8 hours', true, false)
ON CONFLICT (id) DO NOTHING;

-- Update Service Image Paths for Plumbing Services
UPDATE services SET image_paths = '[
  "images/subcategories/plumbing/bath-fittings/pexels-artbovich-6782356.jpg",
  "images/subcategories/plumbing/bath-fittings/pexels-artbovich-6934233.jpg",
  "images/subcategories/plumbing/bath-fittings/pexels-artbovich-7061067.jpg",
  "images/subcategories/plumbing/bath-fittings/pexels-artbovich-8082549.jpg",
  "images/subcategories/plumbing/bath-fittings/pexels-pixabay-534116.jpg"
]'::jsonb WHERE name = 'Bathroom Tap Installation';

UPDATE services SET image_paths = '[
  "images/subcategories/plumbing/basin-sink/pexels-aj-ahamad-767001191-32168954.jpg",
  "images/subcategories/plumbing/basin-sink/pexels-artbovich-6782575.jpg",
  "images/subcategories/plumbing/basin-sink/pexels-artbovich-6899441.jpg",
  "images/subcategories/plumbing/basin-sink/pexels-artbovich-7031908.jpg",
  "images/subcategories/plumbing/basin-sink/pexels-pu-ca-adryan-163345030-29399427.jpg"
]'::jsonb WHERE name = 'Kitchen Sink Installation';

UPDATE services SET image_paths = '[
  "images/subcategories/plumbing/toilet-classic/pexels-artbovich-6444240.jpg",
  "images/subcategories/plumbing/toilet-classic/pexels-happy-donut-9996232-6226767.jpg",
  "images/subcategories/plumbing/toilet-classic/pexels-karola-g-4239067.jpg",
  "images/subcategories/plumbing/toilet-classic/pexels-karola-g-4239090.jpg",
  "images/subcategories/plumbing/toilet-classic/pexels-polina-zimmerman-4107973.jpg"
]'::jsonb WHERE name = 'Toilet Service (Classic)';

UPDATE services SET image_paths = '[
  "images/subcategories/plumbing/toilet-premium/pexels-artbovich-6585618.jpg",
  "images/subcategories/plumbing/toilet-premium/pexels-artbovich-6933771.jpg",
  "images/subcategories/plumbing/toilet-premium/pexels-artbovich-7031620.jpg",
  "images/subcategories/plumbing/toilet-premium/pexels-artbovich-7045911.jpg",
  "images/subcategories/plumbing/toilet-premium/pexels-karola-g-4239071.jpg"
]'::jsonb WHERE name = 'Toilet Service (Premium)';

UPDATE services SET image_paths = '[
  "images/subcategories/plumbing/water-tank/pexels-nc-farm-bureau-mark-7509423.jpg",
  "images/subcategories/plumbing/water-tank/pexels-magda-ehlers-pexels-28674471.jpg",
  "images/subcategories/plumbing/water-tank/pexels-joetography-9043542-10934932.jpg",
  "images/subcategories/plumbing/water-tank/pexels-sashmere-6961082.jpg"
]'::jsonb WHERE name = 'Water Tank Installation';

UPDATE services SET image_paths = '[
  "images/subcategories/plumbing/pipes/pexels-anilkarakaya-6419128.jpg",
  "images/subcategories/plumbing/pipes/pexels-dxaxoxfz-12142829.jpg",
  "images/subcategories/plumbing/pipes/pexels-maotuizhutuzi-4432160.jpg",
  "images/subcategories/plumbing/pipes/pexels-shkrabaanthony-4981803.jpg",
  "images/subcategories/plumbing/pipes/pexels-swastikarora-15206136.jpg"
]'::jsonb WHERE name = 'Pipe Repair & Installation';

UPDATE services SET image_paths = '[
  "images/subcategories/plumbing/grouting/pexels-liliana-drew-9462766.jpg",
  "images/subcategories/plumbing/grouting/pexels-tkirkgoz-14124893.jpg",
  "images/subcategories/plumbing/grouting/pexels-vladimirsrajber-11806477.jpg",
  "images/subcategories/plumbing/grouting/pexels-vladimirsrajber-11806482.jpg",
  "images/subcategories/plumbing/grouting/pexels-vladimirsrajber-11806486.jpg"
]'::jsonb WHERE name = 'Bathroom Grouting Service';

-- Insert Coupons
INSERT INTO public.coupons (id, code, title, description, discount_type, discount_value, minimum_order_amount, maximum_discount_amount, usage_limit, usage_count, is_active, valid_from, valid_until, applicable_categories, applicable_services) VALUES 
('54615e55-a281-422e-9e11-1f54bb03c2c7', 'WELCOME50', 'Welcome Offer', 'Get 50% off on your first service booking', 'percentage', 50.00, 199.00, NULL, 1000, 0, true, '2025-10-29', '2025-11-28', '[]'::JSONB, '[]'::JSONB),
('1430ecdb-14dc-4130-9068-49e81022276f', 'NEWUSER25', 'New User Discount', '25% off for new customers', 'percentage', 25.00, 299.00, NULL, 2000, 0, true, '2025-10-29', '2026-01-27', '[]'::JSONB, '[]'::JSONB),
('7f636c64-f83b-4003-9e88-f11d1a4f3ef5', 'PLUMBING20', 'Plumbing Special', '20% off on all plumbing services', 'percentage', 20.00, 199.00, NULL, 300, 0, true, '2025-10-29', '2025-12-13', '[]'::JSONB, '[]'::JSONB),
-- OFFER PLAN COUPONS - UPDATED TO MATCH CURRENT DATABASE STATE
('a1b2c3d4-e5f6-7890-1234-567890abcdef', 'STARTER10', 'Smart Start Offer', '10% discount for Smart Start plan subscribers', 'percentage', 10.00, 0.00, NULL, 10000, 0, true, '2025-01-01', '2026-12-31', '[]'::JSONB, '[]'::JSONB),
('b2c3d4e5-f6a7-8901-2345-678901bcdef0', 'PREMIUM15', 'Premium Care Offer', '15% discount for Premium Care plan subscribers', 'percentage', 15.00, 0.00, NULL, 10000, 0, true, '2025-01-01', '2026-12-31', '[]'::JSONB, '[]'::JSONB),
('c3d4e5f6-a7b8-9012-3456-789012cdef01', 'ELITE20', 'Elite Guard Offer', '20% discount for Elite Guard plan subscribers', 'percentage', 20.00, 0.00, NULL, 10000, 0, true, '2025-01-01', '2026-12-31', '[]'::JSONB, '[]'::JSONB)
ON CONFLICT (id) DO NOTHING;

-- Insert Offer Plans - UPDATED TO MATCH CURRENT DATABASE STATE
INSERT INTO public.offer_plans (id, title, description, duration_months, discount_percentage, combo_coupon_code, is_active, sort_order, benefits, terms_conditions) VALUES 
('d4e5f6a7-b8c9-0123-4567-890123defabc', 'Smart Start', '10% discount at checkout with priority support', 3, 10.00, 'STARTER10', true, 1, 
'["10% discount at checkout", "Priority customer support", "Quick response time", "Basic service guarantee"]',
'["Valid for 3 months from activation", "Applies to all regular services", "Cannot be combined with other offers", "Service charges may apply"]'),
('e5f6a7b8-c9d0-1234-5678-901234efabcd', 'Premium Care', '15% discount at checkout with enhanced benefits', 6, 15.00, 'PREMIUM15', true, 2,
'["15% discount at checkout", "Premium customer support", "Extended warranty", "Free home consultations"]',
'["Valid for 6 months from activation", "Includes premium services", "Priority booking slots", "Service charges may apply"]'),
('f6a7b8c9-d0e1-2345-6789-012345fabcde', 'Elite Guard', '20% discount at checkout with VIP treatment', 12, 20.00, 'ELITE20', true, 3,
'["20% discount at checkout", "VIP customer support", "Dedicated service manager", "Emergency service priority", "Annual maintenance plans"]',
'["Valid for 12 months from activation", "Includes all premium features", "24/7 priority support", "Exclusive member benefits"]')
ON CONFLICT (id) DO NOTHING;

-- Insert Banners (Default Reference Banners for Admin)
INSERT INTO public.banners (id, title, subtitle, description, button_text, button_link, image_url, background_color, text_color, "position", sort_order, is_active) VALUES 
('ebc273fa-6735-4a38-90bf-f2029750b723', 'Professional Home Services at Your Doorstep', 'Your Trusted Partner for Quality Care', 'Expert plumbing, electrical, cleaning, and maintenance services by certified professionals. Same-day service available.', 'Book Service Now', '/services', 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200&h=600&fit=crop&crop=center', '#3B82F6', '#FFFFFF', 'hero', 1, true),
('375a8d6e-1fcb-46fe-866f-821648963968', 'Emergency Services Available 24/7', 'Fast Response When You Need It Most', 'Plumbing leaks, electrical issues, or urgent repairs? Our emergency team is ready to help anytime.', 'Get Emergency Help', '/emergency', NULL, '#059669', '#FFFFFF', 'secondary', 1, false),
('4dfc2218-27dd-4a57-9099-c0ae32d16ee3', 'Special Offer: 20% Off First Service', 'New Customer Discount', 'Welcome to Happy Homes! Enjoy 20% off your first service booking. Professional quality guaranteed.', 'Claim Offer', '/offers', NULL, '#DC2626', '#FFFFFF', 'promotional', 1, false)
ON CONFLICT (id) DO NOTHING;

-- Insert Contact Settings  
INSERT INTO public.contact_settings (id, company_name, tagline, phone, emergency_phone, whatsapp_number, email, address, facebook_url) VALUES 
('998367c2-80f9-44a8-bded-f3b8cab2ee8f', 'Happy Homes', 'Your Trusted Home Service Partner', '9437341234', '9437341234', '9437341234', 'care@happyhomesworld.com', 'Bhubaneswar, Odisha 751001', 'https://www.facebook.com/happyhomes.official')
ON CONFLICT (id) DO NOTHING;

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
('11111111-1111-1111-1111-111111111125', 'permissions.manage', 'Permission Management', 'Assign permissions to admin users', 'page', true, NOW(), NOW()),

-- Additional Management Pages
('11111111-1111-1111-1111-111111111126', 'bookings.manage', 'Bookings Management', 'Manage service appointments and bookings', 'page', true, NOW(), NOW()),
('11111111-1111-1111-1111-111111111127', 'notifications.manage', 'Notifications Management', 'Manage SMS and email notifications', 'page', true, NOW(), NOW()),
('11111111-1111-1111-1111-111111111128', 'payments.manage', 'Payments Management', 'View and manage payments', 'page', true, NOW(), NOW()),
('11111111-1111-1111-1111-111111111129', 'offers.manage', 'Offers Management', 'Manage promotional offers and plans', 'page', true, NOW(), NOW()),
('11111111-1111-1111-1111-111111111130', 'system.health', 'System Health', 'View system health and monitoring', 'page', true, NOW(), NOW()),

-- Action Permissions
('22222222-2222-2222-2222-222222222201', 'orders.create', 'Create Orders', 'Create new customer orders', 'action', true, NOW(), NOW()),
('22222222-2222-2222-2222-222222222202', 'orders.edit', 'Edit Orders', 'Modify existing orders', 'action', true, NOW(), NOW()),
('22222222-2222-2222-2222-222222222203', 'orders.delete', 'Delete Orders', 'Delete customer orders', 'action', true, NOW(), NOW()),
('22222222-2222-2222-2222-222222222204', 'engineers.assign', 'Assign Engineers', 'Assign engineers to orders', 'action', true, NOW(), NOW()),
('22222222-2222-2222-2222-222222222205', 'payments.process', 'Process Payments', 'Process customer payments', 'action', true, NOW(), NOW()),
('22222222-2222-2222-2222-222222222206', 'reviews.approve', 'Approve Reviews', 'Approve customer reviews', 'action', true, NOW(), NOW()),
('22222222-2222-2222-2222-222222222207', 'notifications.send', 'Send Notifications', 'Send SMS/email notifications', 'action', true, NOW(), NOW()),
('22222222-2222-2222-2222-222222222208', 'services.create', 'Create Services', 'Add new services', 'action', true, NOW(), NOW()),
('22222222-2222-2222-2222-222222222209', 'coupons.create', 'Create Coupons', 'Create discount coupons', 'action', true, NOW(), NOW()),
('22222222-2222-2222-2222-222222222210', 'users.create', 'Create Users', 'Create admin/engineer accounts', 'action', true, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- Insert Sample Review Settings (default configuration)
INSERT INTO public.review_settings (id, auto_approve_reviews, require_booking_for_review, minimum_rating_threshold, maximum_reviews_per_user_per_service, review_moderation_enabled, display_average_rating, display_review_count, allow_anonymous_reviews, updated_by, created_at, updated_at) VALUES
('22222222-2222-2222-2222-222222222222', false, true, 1, 1, true, true, true, false, '43942929-b0ef-4f4b-a910-3c4e5a14b002', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;


-- Insert SMS Templates
INSERT INTO public.sms_templates (name, event_type, message_template, variables) VALUES
('Order Placed', 'ORDER_PLACED', 
 'Hi {customer_name}! Your order #{order_number} for {service_names} has been placed successfully. Total: ₹{final_amount}. Happy Homes team will contact you soon.', 
 '["customer_name", "order_number", "service_names", "final_amount"]'),

('Order Confirmed', 'ORDER_CONFIRMED', 
 'Great news {customer_name}! Your order #{order_number} is confirmed. Our expert will visit on {scheduled_date} between {time_slot}. Thank you for choosing Happy Homes!', 
 '["customer_name", "order_number", "scheduled_date", "time_slot"]'),

('Engineer Assigned', 'ENGINEER_ASSIGNED', 
 'Hi {customer_name}! Engineer {engineer_name} ({engineer_phone}) has been assigned to your order #{order_number}. Service: {service_name}. Happy Homes', 
 '["customer_name", "engineer_name", "engineer_phone", "order_number", "service_name"]'),

('Service Started', 'SERVICE_STARTED', 
 'Your service has started! Engineer {engineer_name} is now working on {service_name} at your location. Order #{order_number}. Happy Homes', 
 '["customer_name", "engineer_name", "service_name", "order_number"]'),

('Service Completed', 'SERVICE_COMPLETED', 
 'Service completed! {service_name} for order #{order_number} is done. Please rate our service. Thank you for choosing Happy Homes!', 
 '["customer_name", "service_name", "order_number"]'),

('Payment Due', 'PAYMENT_DUE', 
 'Payment reminder: ₹{due_amount} is due for order #{order_number}. Please complete payment to avoid service interruption. Happy Homes', 
 '["customer_name", "due_amount", "order_number"]'),

('Payment Received', 'PAYMENT_RECEIVED', 
 'Payment received! ₹{amount} for order #{order_number} has been confirmed. Thank you for your business! - Happy Homes', 
 '["customer_name", "amount", "order_number"]')

ON CONFLICT (event_type) DO NOTHING;

-- Insert Mock SMS Provider for Development
INSERT INTO public.sms_providers (
    name, 
    provider_type, 
    description, 
    is_enabled, 
    is_primary,
    priority, 
    config_data, 
    cost_per_sms,
    created_by
) VALUES (
    'Mock SMS Provider (Development)',
    'mock',
    'Mock SMS provider for development and testing purposes. Does not send real SMS messages.',
    true,
    true,
    1,
    '{"simulate_failures": false, "failure_rate": 0.1}',
    0.0,
    'system'
) ON CONFLICT (name) DO NOTHING;

-- Insert Notification Templates
INSERT INTO public.notification_templates (name, event_type, notification_type, subject_template, message_template, variables, is_active, language) VALUES
('Order Placed SMS', 'order_placed', 'sms', NULL, 
 'Hi {customer_name}! Your order #{order_number} for {service_names} has been placed successfully. Total: ₹{final_amount}. Happy Homes team will contact you soon.', 
 '["customer_name", "order_number", "service_names", "final_amount"]', true, 'en'),

('Order Confirmed SMS', 'order_confirmed', 'sms', NULL,
 'Great news {customer_name}! Your order #{order_number} is confirmed. Our expert will visit on {scheduled_date} between {time_slot}. Thank you for choosing Happy Homes!', 
 '["customer_name", "order_number", "scheduled_date", "time_slot"]', true, 'en'),

('Engineer Assigned SMS', 'engineer_assigned', 'sms', NULL,
 'Hi {customer_name}! Engineer {engineer_name} ({engineer_phone}) has been assigned to your order #{order_number}. Service: {service_name}. Happy Homes', 
 '["customer_name", "engineer_name", "engineer_phone", "order_number", "service_name"]', true, 'en'),

('Service Started SMS', 'service_started', 'sms', NULL,
 'Your service has started! Engineer {engineer_name} is now working on {service_name} at your location. Order #{order_number}. Happy Homes', 
 '["customer_name", "engineer_name", "service_name", "order_number"]', true, 'en'),

('Service Completed SMS', 'service_completed', 'sms', NULL,
 'Service completed! {service_name} for order #{order_number} is done. Please rate our service. Thank you for choosing Happy Homes!', 
 '["customer_name", "service_name", "order_number"]', true, 'en'),

('Order Placed Email', 'order_placed', 'email', 'Order Confirmation - #{order_number}',
 'Dear {customer_name}, Thank you for your order! Order Details: Order Number: {order_number}, Services: {service_names}, Total Amount: ₹{final_amount}. Our team will contact you soon to schedule the service. Best regards, Happy Homes Team', 
 '["customer_name", "order_number", "service_names", "final_amount"]', true, 'en'),

('Order Confirmed Email', 'order_confirmed', 'email', 'Service Scheduled - #{order_number}',
 'Dear {customer_name}, Your service has been confirmed! Scheduled Date: {scheduled_date}, Time Slot: {time_slot}, Order Number: {order_number}. Our expert will arrive at the scheduled time. Please ensure someone is available at the service location. Best regards, Happy Homes Team', 
 '["customer_name", "order_number", "scheduled_date", "time_slot"]', true, 'en')

ON CONFLICT (event_type, notification_type, language) DO NOTHING;

-- Insert Sample Engineers (enhanced version of employees)
INSERT INTO public.engineers (employee_id, name, expertise, specializations, phone, email, address, is_active, max_concurrent_jobs) VALUES
('ENG001', 'Sunil Kumar Panda', 
 '["Plumbing", "Electrical", "AC Services"]', 
 '["Bath Fittings", "Wiring Installation", "AC Cleaning", "Appliance Repair"]',
 '9731739111', 'sunil.engineer@happyhomes.com', 'Bhubaneswar, Odisha', true, 3),

('ENG002', 'Debashis Mohanty', 
 '["Civil Work", "Cleaning", "General Services"]', 
 '["House Painting", "Bathroom Cleaning", "Home Repairs", "Water Tank Cleaning"]',
 '9731739222', 'debashis.engineer@happyhomes.com', 'Bhubaneswar, Odisha', true, 4),

('ENG003', 'Rajesh Kumar', 
 '["Electrical", "Electronics"]', 
 '["Switch & Socket", "Fan Installation", "Lighting Solutions", "Electrical Safety Check"]',
 '9731739333', 'rajesh.engineer@happyhomes.com', 'Bhubaneswar, Odisha', true, 2)

ON CONFLICT (employee_id) DO NOTHING;

-- Add triggers for updated_at columns on new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to SMS tables that have updated_at columns
DROP TRIGGER IF EXISTS update_sms_providers_updated_at ON public.sms_providers;
CREATE TRIGGER update_sms_providers_updated_at 
    BEFORE UPDATE ON public.sms_providers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_sms_templates_updated_at ON public.sms_templates;
CREATE TRIGGER update_sms_templates_updated_at 
    BEFORE UPDATE ON public.sms_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add triggers for new tables with updated_at columns
DROP TRIGGER IF EXISTS update_bookings_updated_at ON public.bookings;
CREATE TRIGGER update_bookings_updated_at 
    BEFORE UPDATE ON public.bookings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at 
    BEFORE UPDATE ON public.notifications 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_notification_templates_updated_at ON public.notification_templates;
CREATE TRIGGER update_notification_templates_updated_at 
    BEFORE UPDATE ON public.notification_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_notification_preferences_updated_at ON public.user_notification_preferences;
CREATE TRIGGER update_user_notification_preferences_updated_at 
    BEFORE UPDATE ON public.user_notification_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_engineers_updated_at ON public.engineers;
CREATE TRIGGER update_engineers_updated_at 
    BEFORE UPDATE ON public.engineers 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Add trigger for orders table
DROP TRIGGER IF EXISTS update_orders_updated_at ON public.orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON public.orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Log successful initialization
SELECT 'Database household_services initialized successfully with complete schema and seed data' as message;

-- ==============================================================================
-- END OF FINAL COMPLETE SETUP
-- ==============================================================================