-- Migration: Rename employees table and references to engineers
-- This migration ensures consistency between frontend "Engineers" terminology and backend data model
-- Works for both fresh deployments and existing environments

-- Check if we're dealing with existing employees table or need to create engineers table
DO $$
BEGIN
  -- Check if employees table exists and engineers table doesn't exist
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'employees') 
     AND NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'engineers') THEN
    
    RAISE NOTICE 'Migrating existing employees table to engineers...';
    
    -- Rename the table
    ALTER TABLE employees RENAME TO engineers;
    
    -- Update all foreign key references in other tables
    -- Update order_items table
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'assigned_employee_id') THEN
      ALTER TABLE order_items RENAME COLUMN assigned_employee_id TO assigned_engineer_id;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'assigned_employee_name') THEN
      ALTER TABLE order_items RENAME COLUMN assigned_employee_name TO assigned_engineer_name;
    END IF;
    
    -- Update orders table if it has employee references
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'assigned_employee_id') THEN
      ALTER TABLE orders RENAME COLUMN assigned_employee_id TO assigned_engineer_id;
    END IF;
    
    -- Update assignment_history table if it exists
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assignment_history') THEN
      IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'assignment_history' AND column_name = 'employee_id') THEN
        ALTER TABLE assignment_history RENAME COLUMN employee_id TO engineer_id;
      END IF;
    END IF;
    
    -- Update any existing sequences
    IF EXISTS (SELECT FROM information_schema.sequences WHERE sequence_name = 'employees_id_seq') THEN
      ALTER SEQUENCE employees_id_seq RENAME TO engineers_id_seq;
    END IF;
    
    -- Update constraints if they exist
    -- Rename primary key constraint
    DO $constraint$
    BEGIN
      IF EXISTS (SELECT constraint_name FROM information_schema.table_constraints 
                 WHERE table_name = 'engineers' AND constraint_name = 'employees_pkey') THEN
        ALTER TABLE engineers RENAME CONSTRAINT employees_pkey TO engineers_pkey;
      END IF;
    END $constraint$;
    
    -- Update foreign key constraints in other tables
    -- This will update FK constraint names to reflect the new table name
    DO $fk_update$
    DECLARE
      constraint_record RECORD;
    BEGIN
      -- Find and rename foreign key constraints that reference the old employees table
      FOR constraint_record IN 
        SELECT tc.constraint_name, tc.table_name
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
        JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
        WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND ccu.table_name = 'engineers'
        AND tc.constraint_name LIKE '%employee%'
      LOOP
        -- Skip if constraint doesn't exist anymore
        IF EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = constraint_record.constraint_name 
                   AND table_name = constraint_record.table_name) THEN
          
          -- Create new constraint name by replacing 'employee' with 'engineer'
          EXECUTE format('ALTER TABLE %I RENAME CONSTRAINT %I TO %I',
            constraint_record.table_name,
            constraint_record.constraint_name,
            replace(constraint_record.constraint_name, 'employee', 'engineer')
          );
        END IF;
      END LOOP;
    END $fk_update$;
    
    RAISE NOTICE 'Successfully migrated employees table to engineers';
    
  ELSIF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'engineers') THEN
    
    RAISE NOTICE 'Creating new engineers table for fresh deployment...';
    
    -- Create engineers table for fresh deployment
    CREATE TABLE engineers (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(100) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      phone VARCHAR(20),
      expertise_areas TEXT[], -- Array of expertise areas
      location JSONB, -- Location information
      is_active BOOLEAN DEFAULT true,
      rating DECIMAL(3,2) DEFAULT 0.00,
      completed_jobs INTEGER DEFAULT 0,
      hourly_rate DECIMAL(10,2),
      availability_schedule JSONB, -- Schedule information
      notes TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- Create indexes for performance
    CREATE INDEX idx_engineers_name ON engineers(name);
    CREATE INDEX idx_engineers_email ON engineers(email);
    CREATE INDEX idx_engineers_is_active ON engineers(is_active);
    CREATE INDEX idx_engineers_expertise ON engineers USING GIN(expertise_areas);
    CREATE INDEX idx_engineers_location ON engineers USING GIN(location);
    
    -- Add trigger for updated_at
    CREATE OR REPLACE FUNCTION update_engineers_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
    
    CREATE TRIGGER trigger_engineers_updated_at
      BEFORE UPDATE ON engineers
      FOR EACH ROW
      EXECUTE FUNCTION update_engineers_updated_at();
    
    RAISE NOTICE 'Successfully created engineers table for fresh deployment';
    
  ELSE
    RAISE NOTICE 'Engineers table already exists, skipping migration';
  END IF;
  
  -- Ensure all other tables have the correct engineer column names
  -- This handles cases where tables were created after the employees table was renamed
  
  -- Update order_items table columns if they still have old names
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'order_items') THEN
    -- Add assigned_engineer_id if it doesn't exist but assigned_employee_id does
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'assigned_engineer_id')
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'assigned_employee_id') THEN
      ALTER TABLE order_items RENAME COLUMN assigned_employee_id TO assigned_engineer_id;
    END IF;
    
    -- Add assigned_engineer_name if it doesn't exist but assigned_employee_name does  
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'assigned_engineer_name')
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'order_items' AND column_name = 'assigned_employee_name') THEN
      ALTER TABLE order_items RENAME COLUMN assigned_employee_name TO assigned_engineer_name;
    END IF;
  END IF;
  
END $$;

-- Insert seed data for engineers if table is empty (fresh deployment)
DO $$
BEGIN
  IF (SELECT COUNT(*) FROM engineers) = 0 THEN
    RAISE NOTICE 'Seeding initial engineers data...';
    
    INSERT INTO engineers (name, email, phone, expertise_areas, location, is_active, rating, completed_jobs, hourly_rate, notes) VALUES
    ('Rajesh Kumar', 'rajesh.kumar@happyhomes.com', '+91-9876543210', ARRAY['plumbing', 'electrical'], '{"city": "Bhubaneswar", "area": "Sahid Nagar"}', true, 4.8, 150, 500.00, 'Senior technician with 10+ years experience'),
    ('Priya Sharma', 'priya.sharma@happyhomes.com', '+91-9876543211', ARRAY['cleaning', 'pest_control'], '{"city": "Bhubaneswar", "area": "Khandagiri"}', true, 4.9, 200, 400.00, 'Specialized in deep cleaning and pest management'),
    ('Amit Patel', 'amit.patel@happyhomes.com', '+91-9876543212', ARRAY['appliance_repair', 'electrical'], '{"city": "Bhubaneswar", "area": "Patia"}', true, 4.7, 120, 550.00, 'Expert in home appliance repairs'),
    ('Sunita Devi', 'sunita.devi@happyhomes.com', '+91-9876543213', ARRAY['cleaning', 'laundry'], '{"city": "Bhubaneswar", "area": "Old Town"}', true, 4.6, 180, 350.00, 'Reliable cleaning and laundry services'),
    ('Vikram Singh', 'vikram.singh@happyhomes.com', '+91-9876543214', ARRAY['plumbing', 'bathroom_fitting'], '{"city": "Bhubaneswar", "area": "Chandrasekharpur"}', true, 4.9, 90, 600.00, 'Specialized in bathroom and kitchen fittings');
    
    RAISE NOTICE 'Successfully seeded engineers data';
  ELSE
    RAISE NOTICE 'Engineers table already contains data, skipping seed';
  END IF;
END $$;

-- Final verification
DO $$
DECLARE
  engineer_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO engineer_count FROM engineers;
  RAISE NOTICE 'Migration completed. Engineers table contains % records', engineer_count;
  
  -- Verify the table structure
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'engineers') THEN
    RAISE NOTICE 'Engineers table structure verified successfully';
  ELSE
    RAISE EXCEPTION 'Engineers table was not created properly';
  END IF;
END $$;

-- Add comments for documentation
COMMENT ON TABLE engineers IS 'Service engineers/technicians who perform household services';
COMMENT ON COLUMN engineers.expertise_areas IS 'Array of service categories the engineer specializes in';
COMMENT ON COLUMN engineers.location IS 'JSON object containing city, area, and other location details';
COMMENT ON COLUMN engineers.availability_schedule IS 'JSON object containing weekly availability schedule';