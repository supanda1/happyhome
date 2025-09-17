-- Migration: Create contact_settings table
-- Description: Store company contact information and social media links

CREATE TABLE contact_settings (
    id SERIAL PRIMARY KEY,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    emergency_phone VARCHAR(20),
    whatsapp_number VARCHAR(20),
    company_name VARCHAR(255) NOT NULL,
    tagline TEXT,
    address TEXT,
    facebook_url VARCHAR(500),
    twitter_url VARCHAR(500),
    instagram_url VARCHAR(500),
    linkedin_url VARCHAR(500),
    website_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(100) DEFAULT 'system'
);

-- Insert default contact settings
INSERT INTO contact_settings (
    phone,
    email,
    emergency_phone,
    whatsapp_number,
    company_name,
    tagline,
    address,
    facebook_url,
    twitter_url,
    updated_by
) VALUES (
    '9437341234',
    'care@happyhomesworld.com',
    '9437341234',
    '9437341234',
    'Happy Homes',
    'Your Trusted Home Service Partner',
    'Bhubaneswar, Odisha 751001',
    'https://www.facebook.com/happyhomes.official',
    'https://x.com/happyhomes_in',
    'system'
);

-- Create index for faster queries (only one record expected)
CREATE INDEX idx_contact_settings_updated_at ON contact_settings(updated_at DESC);