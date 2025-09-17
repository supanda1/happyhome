-- Migration: Add social media columns to contact_settings table
-- Description: Add Facebook, Twitter and other social media URL fields

-- Add missing social media columns
ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS facebook_url VARCHAR(500);
ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS twitter_url VARCHAR(500);
ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS instagram_url VARCHAR(500);
ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS linkedin_url VARCHAR(500);
ALTER TABLE contact_settings ADD COLUMN IF NOT EXISTS website_url VARCHAR(500);

-- Update existing record with default social media URLs (if any exists)
UPDATE contact_settings 
SET 
    facebook_url = COALESCE(facebook_url, 'https://www.facebook.com/happyhomes.official'),
    twitter_url = COALESCE(twitter_url, 'https://x.com/happyhomes_in'),
    instagram_url = COALESCE(instagram_url, ''),
    linkedin_url = COALESCE(linkedin_url, ''),
    website_url = COALESCE(website_url, '')
WHERE facebook_url IS NULL OR twitter_url IS NULL;