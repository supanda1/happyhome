-- ================================================================
-- FIX IMAGE PATHS MIGRATION
-- This script fixes the incorrect image paths in the database
-- Run this to update existing data with correct image paths
-- ================================================================

-- Fix category image paths (update to match actual files)
UPDATE public.service_categories SET image_path = '/images/categories/plumbing-hero.jpg' WHERE name = 'Plumbing';
UPDATE public.service_categories SET image_path = '/images/categories/electrical-hero.jpg' WHERE name = 'Electrical';  
UPDATE public.service_categories SET image_path = '/images/categories/cleaning-hero.jpg' WHERE name = 'Cleaning';
UPDATE public.service_categories SET image_path = '/images/categories/call-service-hero.jpg' WHERE name = 'Call A Service';
UPDATE public.service_categories SET image_path = '/images/categories/finance-hero.jpg' WHERE name = 'Finance & Insurance';
UPDATE public.service_categories SET image_path = '/images/categories/personal-care-hero.jpg' WHERE name = 'Personal Care';
UPDATE public.service_categories SET image_path = '/images/categories/civil-work-hero.jpg' WHERE name = 'Civil Work';

-- Add image paths to plumbing subcategories
UPDATE public.service_subcategories 
SET image_paths = '[
  "/images/subcategories/plumbing/bath-fittings/bath-fittings-1.jpg",
  "/images/subcategories/plumbing/bath-fittings/bath-fittings-2.jpg", 
  "/images/subcategories/plumbing/bath-fittings/bath-fittings-3.jpg",
  "/images/subcategories/plumbing/bath-fittings/bath-fittings-4.jpg",
  "/images/subcategories/plumbing/bath-fittings/bath-fittings-5.jpg"
]'::jsonb 
WHERE name = 'Bath Fittings';

UPDATE public.service_subcategories 
SET image_paths = '[
  "/images/subcategories/plumbing/basin-sink-drainage-1.jpg",
  "/images/subcategories/plumbing/basin-sink-drainage-2.jpg",
  "/images/subcategories/plumbing/basin-sink-drainage-3.jpg", 
  "/images/subcategories/plumbing/basin-sink-drainage-4.jpg",
  "/images/subcategories/plumbing/basin-sink-drainage-5.jpg"
]'::jsonb 
WHERE name = 'Basin & Sink';

UPDATE public.service_subcategories 
SET image_paths = '[
  "/images/subcategories/plumbing/toilet-services/toilet-service-1.jpg",
  "/images/subcategories/plumbing/toilet-services/toilet-service-2.jpg",
  "/images/subcategories/plumbing/toilet-services/toilet-service-3.jpg",
  "/images/subcategories/plumbing/toilet-services/toilet-service-4.jpg", 
  "/images/subcategories/plumbing/toilet-services/toilet-service-5.jpg"
]'::jsonb 
WHERE name = 'Toilets';

UPDATE public.service_subcategories 
SET image_paths = '[
  "/images/subcategories/plumbing/water-tank/water-tank-1.jpg",
  "/images/subcategories/plumbing/water-tank/water-tank-2.jpg",
  "/images/subcategories/plumbing/water-tank/water-tank-3.jpg",
  "/images/subcategories/plumbing/water-tank/water-tank-4.jpg",
  "/images/subcategories/plumbing/water-tank/water-tank-5.jpg" 
]'::jsonb 
WHERE name = 'Water Tank';

UPDATE public.service_subcategories 
SET image_paths = '[
  "/images/subcategories/plumbing/pipe-connector/pipe-connector-1.jpg",
  "/images/subcategories/plumbing/pipe-connector/pipe-connector-2.jpg",
  "/images/subcategories/plumbing/pipe-connector/pipe-connector-3.jpg",
  "/images/subcategories/plumbing/pipe-connector/pipe-connector-4.jpg",
  "/images/subcategories/plumbing/pipe-connector/pipe-connector-5.jpg"
]'::jsonb 
WHERE name = 'Pipes';

UPDATE public.service_subcategories 
SET image_paths = '[
  "/images/subcategories/plumbing/grouting/grouting-1.jpg",
  "/images/subcategories/plumbing/grouting/grouting-2.jpg", 
  "/images/subcategories/plumbing/grouting/grouting-3.jpg",
  "/images/subcategories/plumbing/grouting/grouting-4.jpg",
  "/images/subcategories/plumbing/grouting/grouting-5.jpg"
]'::jsonb 
WHERE name = 'Grouting';

-- Add image paths to electrical subcategories  
UPDATE public.service_subcategories 
SET image_paths = '[
  "/images/subcategories/electrical/wiring-installation-1.jpg",
  "/images/subcategories/electrical/wiring-installation-2.jpg",
  "/images/subcategories/electrical/wiring-installation-3.jpg", 
  "/images/subcategories/electrical/wiring-installation-4.jpg"
]'::jsonb 
WHERE name = 'Wiring Installation';

UPDATE public.service_subcategories 
SET image_paths = '[
  "/images/subcategories/electrical/appliance-repair-1.jpg",
  "/images/subcategories/electrical/appliance-repair-2.jpg",
  "/images/subcategories/electrical/appliance-repair-3.jpg",
  "/images/subcategories/electrical/appliance-repair-4.jpg"
]'::jsonb 
WHERE name = 'Appliance Repair';

-- Add image paths to cleaning subcategories
UPDATE public.service_subcategories 
SET image_paths = '[
  "/images/subcategories/cleaning/bathroom-cleaning-1.jpg",
  "/images/subcategories/cleaning/bathroom-cleaning-2.jpg", 
  "/images/subcategories/cleaning/bathroom-cleaning-3.jpg",
  "/images/subcategories/cleaning/bathroom-cleaning-4.jpg"
]'::jsonb 
WHERE name LIKE '%Bathroom%';

UPDATE public.service_subcategories 
SET image_paths = '[
  "/images/subcategories/cleaning/ac-cleaning-1.jpg",
  "/images/subcategories/cleaning/ac-cleaning-2.jpg",
  "/images/subcategories/cleaning/ac-cleaning-3.jpg",
  "/images/subcategories/cleaning/ac-cleaning-4.jpg"
]'::jsonb 
WHERE name LIKE '%AC%';

-- Copy to subcategories table (for backward compatibility)
UPDATE public.subcategories 
SET image_paths = service_subcategories.image_paths
FROM public.service_subcategories 
WHERE subcategories.id = service_subcategories.id;

-- Add sample image paths to services (using first image from subcategory)
UPDATE public.services 
SET image_paths = (
  SELECT jsonb_build_array(sc.image_paths->0) 
  FROM public.service_subcategories sc 
  WHERE sc.id = services.subcategory_id 
  AND jsonb_array_length(sc.image_paths) > 0
)
WHERE image_paths = '[]'::jsonb;

SELECT 'Image paths migration completed successfully!' as result;