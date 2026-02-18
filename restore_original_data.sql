-- Restore original 6 categories with professional images
INSERT INTO public.service_categories (id, name, description, icon, image_path, sort_order, is_active, created_at, updated_at) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Plumbing', 'Professional plumbing repair and installation services for your home', '🔧', 'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=400&h=300&fit=crop&auto=format&q=75', 1, true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'Electrical', 'Expert electrical work and appliance repair services', '⚡', 'https://images.unsplash.com/photo-1609220136736-443140cffec6?w=400&h=300&fit=crop&auto=format&q=75', 2, true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'Cleaning', 'Professional cleaning and sanitization services', '🧹', 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=300&fit=crop&auto=format&q=75', 3, true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'Call A Service', 'On-demand service booking and logistics support', '📞', 'https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=400&h=300&fit=crop&auto=format&q=75', 4, true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Finance & Insurance', 'Financial documentation and insurance services', '💰', 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=300&fit=crop&auto=format&q=75', 5, true, NOW(), NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'Personal Care', 'Health, beauty, and personal care services', '💆', 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=400&h=300&fit=crop&auto=format&q=75', 6, true, NOW(), NOW());

-- Restore original subcategories (32 subcategories)
INSERT INTO public.service_subcategories (id, category_id, name, description, icon, sort_order, is_active, created_at, updated_at) VALUES 
-- Plumbing subcategories (6)
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Bath Fittings', 'Shower heads, taps, and bathroom fixture installation', '🛿', 1, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Basin & Sink', 'Sink installation and drainage solutions', '🚰', 2, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Toilets', 'Toilet installation and repair services', '🚽', 3, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Water Tank', 'Water tank installation and maintenance', '🫗', 4, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'Pipes', 'Pipe installation and connector services', '🔗', 5, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'Grouting', 'Professional grouting and sealing services', '🔧', 6, true, NOW(), NOW()),

-- Electrical subcategories (6) 
('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', 'Wiring Installation', 'House wiring and electrical installation', '🔌', 1, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', 'Appliance Repair', 'Home appliance repair and maintenance', '🔧', 2, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 'Switch & Socket', 'Switch and socket installation', '🔘', 3, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', 'Fan Installation', 'Ceiling and wall fan installation', '🌀', 4, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', 'Lighting Solutions', 'LED and decorative lighting installation', '💡', 5, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440002', 'Electrical Safety Check', 'Electrical safety inspection and testing', '🔒', 6, true, NOW(), NOW()),

-- Cleaning subcategories (6)
('650e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440003', 'Bathroom Cleaning', 'Deep bathroom cleaning and sanitization', '🚿', 1, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440003', 'AC Cleaning', 'Air conditioner cleaning and maintenance', '❄️', 2, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440003', 'Water Tank Cleaning', 'Water tank cleaning and sanitization', '💧', 3, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440003', 'Car Wash', 'Professional car washing services', '🚗', 4, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440003', 'Septic Tank Cleaning', 'Septic tank cleaning and maintenance', '🔄', 5, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440003', 'Water Purifier Cleaning', 'Water purifier cleaning and filter replacement', '💧', 6, true, NOW(), NOW()),

-- Call A Service subcategories (5)
('650e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440004', 'Courier Service', 'Pickup and delivery services', '📦', 1, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440004', 'CAB Booking', 'Taxi and cab booking services', '🚕', 2, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440004', 'Vehicle Breakdown', 'Vehicle breakdown assistance', '🔧', 3, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440004', 'Photographer', 'Event and product photography services', '📸', 4, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440045', '550e8400-e29b-41d4-a716-446655440004', 'Event Management', 'Complete event planning and management', '🎉', 5, true, NOW(), NOW()),

-- Finance & Insurance subcategories (5)
('650e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440005', 'GST Registration', 'GST registration and filing', '📊', 1, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440005', 'PAN Card Services', 'PAN card application and services', '🆔', 2, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440005', 'ITR Filing', 'Income tax return filing', '📋', 3, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440054', '550e8400-e29b-41d4-a716-446655440005', 'Insurance Services', 'Insurance planning and claim assistance', '🛡️', 4, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440055', '550e8400-e29b-41d4-a716-446655440005', 'Loan Assistance', 'Personal and business loan assistance', '💳', 5, true, NOW(), NOW()),

-- Personal Care subcategories (4)
('650e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440006', 'Medicine Delivery', 'Home medicine delivery services', '💊', 1, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440006', 'Salon at Home', 'Beauty and salon services at home', '💅', 2, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440006', 'Health Checkup', 'Health checkup and physiotherapy', '🏥', 3, true, NOW(), NOW()),
('650e8400-e29b-41d4-a716-446655440064', '550e8400-e29b-41d4-a716-446655440006', 'Fitness Training', 'Personal fitness training at home', '💪', 4, true, NOW(), NOW());

-- Copy subcategories to legacy table for compatibility
INSERT INTO public.subcategories SELECT * FROM public.service_subcategories;