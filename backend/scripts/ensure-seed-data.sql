-- Ensure seed data exists (idempotent)
-- This script can be run multiple times safely

-- Check and insert engineers if missing
INSERT INTO public.employees (id, employee_id, name, expertise, phone, email, address, is_active, created_at, updated_at) 
SELECT gen_random_uuid(), 'EPM001', 'Sunil Kumar', 
       '["AC Cleaning","Appliance Repair","Basin & Sink","Bath Fittings","Bathroom Cleaning","CAB Booking","Car Wash","Courier Service","Electrical Safety Check","Fan Installation","GST Registration","Grouting","Health Checkup"]', 
       '9731739111', 'sunil1@gmail.com', 'HNo 506 A Plus,Subhadra Apartement , Bhubaneswar , Odisha 24', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.employees WHERE employee_id = 'EPM001');

INSERT INTO public.employees (id, employee_id, name, expertise, phone, email, address, is_active, created_at, updated_at) 
SELECT gen_random_uuid(), 'EMP002', 'Debashis', 
       '["Home Repairs","House Painting","ITR Filing","Lighting Solutions","Medicine Delivery","PAN Card Services","Photographer","Pipes","Salon at Home","Stamp Paper & Agreement","Septic Tank Cleaning","Switch & Socket","Tile Work","Toilets","Vehicle Breakdown","Water Purifier Cleaning","Water Tank","Water Tank Cleaning","Wiring Installation"]', 
       '9731739222', 'debasish@gmail.com', 'HNo 506 A Plus,Subhadra Apartement , Bhubaneswar , Odisha 24', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM public.employees WHERE employee_id = 'EMP002');

-- Log status
SELECT 
    CASE 
        WHEN COUNT(*) >= 2 THEN 'Engineers data validated - all required engineers present'
        ELSE 'Engineers data missing - ' || COUNT(*) || ' engineers found'
    END as status
FROM public.employees 
WHERE employee_id IN ('EPM001', 'EMP002');