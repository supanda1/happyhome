#!/usr/bin/env python3

import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def insert_categories_data():
    # Create database connection
    DATABASE_URL = "postgresql+asyncpg://postgres:password@localhost:5432/household_services"
    
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    try:
        async with engine.begin() as conn:
            print("✅ Inserting categories data...")
            
            # Insert service categories
            await conn.execute(text("""
                INSERT INTO service_categories (id, name, description, icon, is_active, sort_order, created_at, updated_at) VALUES
                ('550e8400-e29b-41d4-a716-446655440001', 'Plumbing', 'Professional plumbing services for your home', '🔧', true, 1, NOW(), NOW()),
                ('550e8400-e29b-41d4-a716-446655440002', 'Electrical', 'Safe and reliable electrical services', '⚡', true, 2, NOW(), NOW()),
                ('550e8400-e29b-41d4-a716-446655440003', 'Cleaning', 'Professional cleaning services', '🧹', true, 3, NOW(), NOW()),
                ('550e8400-e29b-41d4-a716-446655440004', 'Call A Service', 'On-demand utility services', '📞', true, 4, NOW(), NOW()),
                ('550e8400-e29b-41d4-a716-446655440005', 'Finance & Insurance', 'Financial and documentation services', '💰', true, 5, NOW(), NOW()),
                ('550e8400-e29b-41d4-a716-446655440006', 'Personal Care', 'Health and wellness services', '💄', true, 6, NOW(), NOW()),
                ('550e8400-e29b-41d4-a716-446655440007', 'Civil Work', 'Construction and renovation services', '🏗️', true, 7, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING;
            """))
            
            # Insert service subcategories
            await conn.execute(text("""
                INSERT INTO service_subcategories (id, category_id, name, description, icon, is_active, sort_order, created_at, updated_at) VALUES
                -- Plumbing subcategories
                ('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'Bath Fittings', 'Installation and repair of bath fixtures', '🚿', true, 1, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', 'Basin & Sink', 'Basin and sink installation and repair', '🚰', true, 2, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 'Toilets', 'Toilet installation and repair services', '🚽', true, 3, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440001', 'Water Tank', 'Water tank installation and maintenance', '🏺', true, 4, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440001', 'Pipes', 'Pipe installation and repair', '🔧', true, 5, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440001', 'Grouting', 'Professional grouting services', '🧱', true, 6, NOW(), NOW()),
                
                -- Electrical subcategories
                ('650e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440002', 'Wiring Installation', 'Complete electrical wiring solutions', '🔌', true, 1, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440002', 'Appliance Repair', 'Home appliance repair services', '🔧', true, 2, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 'Switch & Socket', 'Switch and socket installation', '🔘', true, 3, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440014', '550e8400-e29b-41d4-a716-446655440002', 'Fan Installation', 'Ceiling and wall fan installation', '🌀', true, 4, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440015', '550e8400-e29b-41d4-a716-446655440002', 'Lighting Solutions', 'Indoor and outdoor lighting installation', '💡', true, 5, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440016', '550e8400-e29b-41d4-a716-446655440002', 'Electrical Safety Check', 'Comprehensive electrical safety inspection', '🔍', true, 6, NOW(), NOW()),
                
                -- Cleaning subcategories
                ('650e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440003', 'Bathroom Cleaning', 'Deep bathroom cleaning services', '🛁', true, 1, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440003', 'AC Cleaning', 'Air conditioner cleaning and maintenance', '❄️', true, 2, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440003', 'Water Tank Cleaning', 'Water tank cleaning and disinfection', '🏺', true, 3, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440024', '550e8400-e29b-41d4-a716-446655440003', 'Car Wash', 'Professional car washing services', '🚗', true, 4, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440025', '550e8400-e29b-41d4-a716-446655440003', 'Septic Tank Cleaning', 'Septic tank cleaning and maintenance', '🏭', true, 5, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440026', '550e8400-e29b-41d4-a716-446655440003', 'Water Purifier Cleaning', 'Water purifier cleaning and service', '💧', true, 6, NOW(), NOW()),
                
                -- Call A Service subcategories
                ('650e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440004', 'Courier Service', 'Package pickup and delivery', '📦', true, 1, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440004', 'CAB Booking', 'Local and outstation cab services', '🚕', true, 2, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440033', '550e8400-e29b-41d4-a716-446655440004', 'Vehicle Breakdown', 'Emergency vehicle repair services', '🚗', true, 3, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440034', '550e8400-e29b-41d4-a716-446655440004', 'Photographer', 'Professional photography services', '📸', true, 4, NOW(), NOW()),
                
                -- Finance & Insurance subcategories
                ('650e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440005', 'GST Registration', 'GST registration and compliance', '📋', true, 1, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440005', 'PAN Card Services', 'PAN card application and updates', '🆔', true, 2, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440005', 'ITR Filing', 'Income tax return filing services', '💰', true, 3, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440044', '550e8400-e29b-41d4-a716-446655440005', 'Stamp Paper & Agreement', 'Legal documentation services', '📄', true, 4, NOW(), NOW()),
                
                -- Personal Care subcategories
                ('650e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440006', 'Medicine Delivery', 'Home delivery of medicines', '💊', true, 1, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440052', '550e8400-e29b-41d4-a716-446655440006', 'Salon at Home', 'Professional beauty services at home', '✂️', true, 2, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440053', '550e8400-e29b-41d4-a716-446655440006', 'Health Checkup', 'Home health screening services', '🏥', true, 3, NOW(), NOW()),
                
                -- Civil Work subcategories
                ('650e8400-e29b-41d4-a716-446655440061', '550e8400-e29b-41d4-a716-446655440007', 'House Painting', 'Interior and exterior painting', '🎨', true, 1, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440062', '550e8400-e29b-41d4-a716-446655440007', 'Tile Work', 'Floor and wall tile installation', '🏠', true, 2, NOW(), NOW()),
                ('650e8400-e29b-41d4-a716-446655440063', '550e8400-e29b-41d4-a716-446655440007', 'Home Repairs', 'General home maintenance and repairs', '🔨', true, 3, NOW(), NOW())
                ON CONFLICT (id) DO NOTHING;
            """))
            
            print("✅ Categories and subcategories data inserted successfully!")
            
    except Exception as e:
        print(f"❌ Error inserting categories data: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(insert_categories_data())