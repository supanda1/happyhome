-- Update Employee Table to Support Multiple Expertise Areas
-- This script migrates from single expertise string to array of expertise areas

-- Add new expertise_areas column as JSONB array
ALTER TABLE employees 
ADD COLUMN expertise_areas JSONB DEFAULT '[]'::jsonb;

-- Migrate existing single expertise to array format
UPDATE employees 
SET expertise_areas = jsonb_build_array(expert)
WHERE expert IS NOT NULL AND expert != '';

-- For employees with no expertise, set empty array
UPDATE employees 
SET expertise_areas = '[]'::jsonb
WHERE expert IS NULL OR expert = '';

-- Add index for better performance on expertise queries
CREATE INDEX IF NOT EXISTS idx_employees_expertise_areas 
ON employees USING GIN (expertise_areas);

-- Add check constraint to ensure expertise_areas is always an array
ALTER TABLE employees 
ADD CONSTRAINT check_expertise_areas_is_array 
CHECK (jsonb_typeof(expertise_areas) = 'array');

-- Comments for documentation
COMMENT ON COLUMN employees.expertise_areas IS 'Array of expertise areas this employee specializes in (e.g., ["Plumbing", "Electrical"])';
COMMENT ON COLUMN employees.expert IS 'Legacy single expertise field - deprecated in favor of expertise_areas';

-- Optional: Create view for backward compatibility
CREATE OR REPLACE VIEW employees_with_legacy_expert AS
SELECT 
    id,
    employee_id,
    name,
    -- Convert first expertise area back to string for legacy compatibility
    CASE 
        WHEN jsonb_array_length(expertise_areas) > 0 
        THEN expertise_areas->0->>0
        ELSE expert 
    END as expert,
    expertise_areas,
    manager,
    phone,
    email,
    is_active,
    created_at,
    updated_at
FROM employees;

-- Example usage after migration:
-- SELECT * FROM employees WHERE expertise_areas @> '["Plumbing"]';  -- Find plumbers
-- SELECT * FROM employees WHERE expertise_areas @> '["Plumbing", "Electrical"]';  -- Multi-skilled
-- UPDATE employees SET expertise_areas = '["Plumbing", "Electrical", "HVAC"]' WHERE id = 'some-uuid';

COMMENT ON VIEW employees_with_legacy_expert IS 'Backward compatibility view that provides legacy expert field while using new expertise_areas';