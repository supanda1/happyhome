-- Update Plumbing Service Image Paths with New Downloaded Images
-- 
-- NOTE: This migration is NOW INCLUDED in final_complete_setup.sql (master seed file)
-- This file is kept for manual updates to existing databases only.
-- Fresh deployments will get these updates automatically from final_complete_setup.sql
--

-- Kitchen Sink Installation (4 images)
UPDATE services 
SET image_paths = '[
  "images/subcategories/plumbing/basin-sink/basin-sink-1.jpg",
  "images/subcategories/plumbing/basin-sink/basin-sink-2.jpg",
  "images/subcategories/plumbing/basin-sink/basin-sink-3.jpg",
  "images/subcategories/plumbing/basin-sink/basin-sink-4.jpg"
]'::jsonb
WHERE name = 'Kitchen Sink Installation';

-- Bathroom Tap Installation (5 images - already updated, confirming)
UPDATE services 
SET image_paths = '[
  "images/subcategories/plumbing/bath-fittings/bath-fittings-1.jpg",
  "images/subcategories/plumbing/bath-fittings/bath-fittings-2.jpg",
  "images/subcategories/plumbing/bath-fittings/bath-fittings-3.jpg",
  "images/subcategories/plumbing/bath-fittings/bath-fittings-4.jpg",
  "images/subcategories/plumbing/bath-fittings/bath-fittings-5.jpg"
]'::jsonb
WHERE name = 'Bathroom Tap Installation';

-- Bathroom Grouting Service (5 images)
UPDATE services 
SET image_paths = '[
  "images/subcategories/plumbing/grouting/grouting-1.jpg",
  "images/subcategories/plumbing/grouting/grouting-2.jpg",
  "images/subcategories/plumbing/grouting/grouting-3.jpg",
  "images/subcategories/plumbing/grouting/grouting-4.jpg",
  "images/subcategories/plumbing/grouting/grouting-5.jpg"
]'::jsonb
WHERE name = 'Bathroom Grouting Service';

-- Pipe Repair & Installation (4 images)
UPDATE services 
SET image_paths = '[
  "images/subcategories/plumbing/pipes/pipes-1.jpg",
  "images/subcategories/plumbing/pipes/pipes-2.jpg",
  "images/subcategories/plumbing/pipes/pipes-3.jpg",
  "images/subcategories/plumbing/pipes/pipes-4.jpg"
]'::jsonb
WHERE name = 'Pipe Repair & Installation';

-- Toilet Service (Classic) - 4 images
UPDATE services 
SET image_paths = '[
  "images/subcategories/plumbing/toilets/toilet-1.jpg",
  "images/subcategories/plumbing/toilets/toilet-2.jpg",
  "images/subcategories/plumbing/toilets/toilet-3.jpg",
  "images/subcategories/plumbing/toilets/toilet-4.jpg"
]'::jsonb
WHERE name = 'Toilet Service (Classic)';

-- Toilet Service (Premium) - 4 images (same as Classic)
UPDATE services 
SET image_paths = '[
  "images/subcategories/plumbing/toilets/toilet-1.jpg",
  "images/subcategories/plumbing/toilets/toilet-2.jpg",
  "images/subcategories/plumbing/toilets/toilet-3.jpg",
  "images/subcategories/plumbing/toilets/toilet-4.jpg"
]'::jsonb
WHERE name = 'Toilet Service (Premium)';

-- Legacy: Update old toilet service name if it still exists
UPDATE services 
SET image_paths = '[
  "images/subcategories/plumbing/toilets/toilet-1.jpg",
  "images/subcategories/plumbing/toilets/toilet-2.jpg",
  "images/subcategories/plumbing/toilets/toilet-3.jpg",
  "images/subcategories/plumbing/toilets/toilet-4.jpg"
]'::jsonb
WHERE name = 'Toilet Installation & Repair';

-- Water Tank Installation (5 images)
UPDATE services 
SET image_paths = '[
  "images/subcategories/plumbing/water-tank/water-tank-1.jpg",
  "images/subcategories/plumbing/water-tank/water-tank-2.jpg",
  "images/subcategories/plumbing/water-tank/water-tank-3.jpg",
  "images/subcategories/plumbing/water-tank/water-tank-4.jpg",
  "images/subcategories/plumbing/water-tank/water-tank-5.jpg"
]'::jsonb
WHERE name = 'Water Tank Installation';

-- Verify updates
SELECT 
  s.name,
  jsonb_array_length(s.image_paths) as image_count,
  s.image_paths->>0 as first_image
FROM services s
JOIN service_categories cat ON s.category_id = cat.id
WHERE cat.name = 'Plumbing'
ORDER BY s.name;
