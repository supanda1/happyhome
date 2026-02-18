-- Enhanced Services Table Migration
-- Adds missing fields for better service detail functionality

-- Add warranty field for service warranty information
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS warranty VARCHAR(100) DEFAULT '30 Days';

-- Add FAQ field for frequently asked questions (JSON array)
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]'::jsonb;

-- Add gallery_images as alias/additional field for better frontend compatibility
-- Note: We already have image_paths, but adding this for explicit gallery images
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS gallery_images JSONB DEFAULT '[]'::jsonb;

-- Add services field for service-specific offerings (different from main description)
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS services JSONB DEFAULT '[]'::jsonb;

-- Update existing services with default warranty values based on category
UPDATE public.services 
SET warranty = CASE 
    WHEN EXISTS (
        SELECT 1 FROM public.categories c 
        WHERE c.id = services.category_id 
        AND c.name ILIKE '%plumbing%'
    ) THEN '90 Days'
    WHEN EXISTS (
        SELECT 1 FROM public.categories c 
        WHERE c.id = services.category_id 
        AND c.name ILIKE '%electrical%'
    ) THEN '60 Days'
    WHEN EXISTS (
        SELECT 1 FROM public.categories c 
        WHERE c.id = services.category_id 
        AND c.name ILIKE '%cleaning%'
    ) THEN '7 Days'
    ELSE '30 Days'
END
WHERE warranty = '30 Days' OR warranty IS NULL;

-- Add sample FAQ data for Test services
UPDATE public.services 
SET faq = '[
    {"question": "What does this service include?", "answer": "Professional service with expert technician and quality materials."},
    {"question": "How long does the service take?", "answer": "Service duration depends on complexity, typically 1-3 hours."},
    {"question": "Do you provide warranty?", "answer": "Yes, we provide service warranty as mentioned in the service details."},
    {"question": "What are the payment options?", "answer": "We accept cash, card, UPI, and online payments."}
]'::jsonb
WHERE faq = '[]'::jsonb OR faq IS NULL;

-- Add sample services data for better service detail display
UPDATE public.services 
SET services = CASE 
    WHEN name ILIKE '%plumbing%' OR name ILIKE '%toilet%' OR name ILIKE '%pipe%' THEN 
        '["Professional installation and repair", "Quality fixtures and fittings", "Leak detection and fixing", "Water pressure optimization"]'::jsonb
    WHEN name ILIKE '%electrical%' OR name ILIKE '%wiring%' OR name ILIKE '%switch%' THEN 
        '["Electrical installation and repair", "Safety inspection included", "Quality components used", "Code compliance assured"]'::jsonb
    WHEN name ILIKE '%cleaning%' THEN 
        '["Deep cleaning service", "Eco-friendly products", "Professional equipment", "Sanitization included"]'::jsonb
    ELSE 
        '["Professional service delivery", "Quality workmanship", "Expert technician visit", "Customer satisfaction assured"]'::jsonb
END
WHERE services = '[]'::jsonb OR services IS NULL;

-- Copy image_paths to gallery_images for consistency
UPDATE public.services 
SET gallery_images = image_paths
WHERE gallery_images = '[]'::jsonb AND image_paths != '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.services.warranty IS 'Service warranty period (e.g., "30 Days", "90 Days")';
COMMENT ON COLUMN public.services.faq IS 'Frequently Asked Questions as JSON array of {question, answer} objects';
COMMENT ON COLUMN public.services.gallery_images IS 'Gallery images for service detail page display';
COMMENT ON COLUMN public.services.services IS 'Specific service offerings as JSON array of strings';

-- Create index for better performance on warranty queries
CREATE INDEX IF NOT EXISTS idx_services_warranty ON public.services(warranty);

-- Create index for FAQ searches (GIN index for JSONB)
CREATE INDEX IF NOT EXISTS idx_services_faq ON public.services USING GIN(faq);

COMMIT;