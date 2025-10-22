-- ==============================================================================
-- FIX USER ADDRESSES TABLE SCHEMA
-- Add missing columns that the userController expects
-- ==============================================================================

-- Add missing columns to user_addresses table
ALTER TABLE user_addresses 
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'home',
ADD COLUMN IF NOT EXISTS title VARCHAR(255),
ADD COLUMN IF NOT EXISTS full_address TEXT,
ADD COLUMN IF NOT EXISTS landmark VARCHAR(255),
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing records to populate new columns from existing data
UPDATE user_addresses 
SET 
    type = 'home',
    title = 'Home Address',
    full_address = CONCAT(address_line1, CASE WHEN address_line2 IS NOT NULL THEN ', ' || address_line2 ELSE '' END),
    landmark = NULL,
    is_active = true
WHERE type IS NULL;

-- Add constraints for the new columns
ALTER TABLE user_addresses 
ADD CONSTRAINT check_address_type CHECK (type IN ('home', 'office', 'other'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_addresses_user_active ON user_addresses(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_user_addresses_default ON user_addresses(user_id, is_default) WHERE is_default = true;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'User addresses schema fixed - added type, title, full_address, landmark, is_active columns';
END $$;