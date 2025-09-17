"""Insert initial services

Revision ID: 003_initial_services
Revises: 002_initial_categories
Create Date: 2025-09-09 13:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '003_initial_services'
down_revision: Union[str, None] = '002_initial_categories'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Insert initial services
    op.execute("""
        INSERT INTO services (
            id, name, category_id, subcategory_id, description, short_description,
            base_price, discounted_price, duration, inclusions, exclusions, requirements,
            rating, review_count, booking_count, is_active, is_featured, tags, 
            availability_settings, created_at, updated_at
        ) VALUES
        
        -- Plumbing Services
        (
            '750e8400-e29b-41d4-a716-446655440001',
            'Bath Fitting Installation - Classic',
            '550e8400-e29b-41d4-a716-446655440001',  -- Plumbing category
            '650e8400-e29b-41d4-a716-446655440001',  -- Bath Fittings subcategory
            'Professional installation of bath fittings including faucets, showerheads, and accessories. Our experienced technicians ensure proper installation with leak-proof connections and quality testing.',
            'Basic bath fitting installation with standard fixtures',
            1500.0,
            1200.0,
            120,
            '["Installation of basic fittings", "Testing for leaks", "Basic warranty", "Quality assurance"]'::jsonb,
            '["Premium fittings not included", "Tile work not included", "Wall cutting charges extra"]'::jsonb,
            '["Clear access to bathroom", "Water connection available", "Basic tools and fittings ready"]'::jsonb,
            4.2,
            45,
            120,
            true,
            true,
            '["plumbing", "bathroom", "installation", "fittings"]'::jsonb,
            '{}'::jsonb,
            NOW(),
            NOW()
        ),
        
        (
            '750e8400-e29b-41d4-a716-446655440002',
            'Basin Installation Service',
            '550e8400-e29b-41d4-a716-446655440001',  -- Plumbing category
            '650e8400-e29b-41d4-a716-446655440002',  -- Basin & Sink subcategory
            'Complete basin installation with piping and drainage connections. Includes proper mounting, water supply connections, and drainage setup with quality testing.',
            'Professional basin installation service',
            2000.0,
            1700.0,
            180,
            '["Basin installation", "Plumbing connections", "Drainage setup", "Quality testing", "Basic warranty"]'::jsonb,
            '["Basin hardware not included", "Tile cutting charges extra", "Advanced plumbing modifications extra"]'::jsonb,
            '["Basin hardware to be provided", "Access to plumbing connections", "Clear work area"]'::jsonb,
            4.5,
            67,
            95,
            true,
            false,
            '["plumbing", "basin", "installation", "sink"]'::jsonb,
            '{}'::jsonb,
            NOW(),
            NOW()
        ),
        
        (
            '750e8400-e29b-41d4-a716-446655440003',
            'Toilet Installation & Repair',
            '550e8400-e29b-41d4-a716-446655440001',  -- Plumbing category
            '650e8400-e29b-41d4-a716-446655440003',  -- Toilets subcategory
            'Professional toilet installation and repair services including seat, tank, and plumbing connections. Expert diagnosis and repair of common toilet issues.',
            'Complete toilet installation and repair service',
            2500.0,
            2200.0,
            150,
            '["Toilet installation/repair", "Plumbing connections", "Seat and tank setup", "Testing and adjustment"]'::jsonb,
            '["Toilet hardware not included", "Major plumbing modifications extra", "Flooring work not included"]'::jsonb,
            '["Toilet hardware ready", "Access to water connection", "Clear bathroom access"]'::jsonb,
            4.3,
            89,
            156,
            true,
            true,
            '["plumbing", "toilet", "installation", "repair"]'::jsonb,
            '{}'::jsonb,
            NOW(),
            NOW()
        ),
        
        -- Electrical Services
        (
            '750e8400-e29b-41d4-a716-446655440011',
            'House Wiring Installation',
            '550e8400-e29b-41d4-a716-446655440002',  -- Electrical category
            '650e8400-e29b-41d4-a716-446655440011',  -- Wiring Installation subcategory
            'Complete house wiring installation with safety standards compliance. Includes circuit planning, wire routing, safety testing, and electrical certification.',
            'Professional house wiring installation service',
            5000.0,
            4500.0,
            480,
            '["Complete wiring installation", "Safety testing", "Circuit breaker installation", "Basic switches and sockets", "Electrical certification"]'::jsonb,
            '["Electrical accessories not included", "Fancy switches extra cost", "Additional circuit modifications extra"]'::jsonb,
            '["Electrical plan ready", "Wall channeling completed", "Electrical board space available", "Clear access to work areas"]'::jsonb,
            4.7,
            89,
            156,
            true,
            true,
            '["electrical", "wiring", "installation", "safety"]'::jsonb,
            '{}'::jsonb,
            NOW(),
            NOW()
        ),
        
        (
            '750e8400-e29b-41d4-a716-446655440012',
            'Home Appliance Repair',
            '550e8400-e29b-41d4-a716-446655440002',  -- Electrical category
            '650e8400-e29b-41d4-a716-446655440012',  -- Appliance Repair subcategory
            'Expert repair service for home appliances including refrigerators, washing machines, microwaves, and more. Professional diagnosis and quality repairs with warranty.',
            'Expert repair for home appliances',
            800.0,
            600.0,
            90,
            '["Diagnostic service", "Minor repairs included", "Testing after repair", "Basic parts warranty", "Expert consultation"]'::jsonb,
            '["Major parts cost extra", "Transportation charges may apply", "Specialized tools extra if needed"]'::jsonb,
            '["Appliance accessible", "Power connection available", "Clear work space around appliance"]'::jsonb,
            4.1,
            234,
            345,
            true,
            false,
            '["electrical", "repair", "appliance", "maintenance"]'::jsonb,
            '{}'::jsonb,
            NOW(),
            NOW()
        ),
        
        (
            '750e8400-e29b-41d4-a716-446655440013',
            'Fan Installation Service',
            '550e8400-e29b-41d4-a716-446655440002',  -- Electrical category
            '650e8400-e29b-41d4-a716-446655440014',  -- Fan Installation subcategory
            'Professional ceiling and wall fan installation with proper electrical connections and safety checks. Includes mounting, wiring, and speed controller setup.',
            'Ceiling and wall fan installation',
            1200.0,
            1000.0,
            120,
            '["Fan mounting", "Electrical connections", "Speed controller setup", "Safety testing", "Basic warranty"]'::jsonb,
            '["Fan hardware not included", "Additional wiring charges extra", "Ceiling reinforcement extra if needed"]'::jsonb,
            '["Fan hardware ready", "Electrical connection available", "Clear ceiling/wall access"]'::jsonb,
            4.4,
            78,
            134,
            true,
            true,
            '["electrical", "fan", "installation", "mounting"]'::jsonb,
            '{}'::jsonb,
            NOW(),
            NOW()
        ),
        
        -- Cleaning Services
        (
            '750e8400-e29b-41d4-a716-446655440021',
            'Bathroom Deep Cleaning',
            '550e8400-e29b-41d4-a716-446655440003',  -- Cleaning category
            '650e8400-e29b-41d4-a716-446655440021',  -- Bathroom Cleaning subcategory
            'Comprehensive deep cleaning of bathrooms including tiles, fixtures, and sanitization. Professional-grade cleaning products and techniques for a spotless bathroom.',
            'Professional bathroom deep cleaning service',
            1200.0,
            900.0,
            150,
            '["Deep scrubbing of all surfaces", "Tile and grout cleaning", "Sanitization", "Fixture polishing", "Eco-friendly products"]'::jsonb,
            '["Cleaning supplies cost extra", "Major stain removal extra", "Plumbing repairs not included"]'::jsonb,
            '["Clear access to bathroom", "Water and electricity available", "Remove personal items"]'::jsonb,
            4.6,
            123,
            234,
            true,
            true,
            '["cleaning", "bathroom", "deep-clean", "sanitization"]'::jsonb,
            '{}'::jsonb,
            NOW(),
            NOW()
        ),
        
        (
            '750e8400-e29b-41d4-a716-446655440022',
            'AC Deep Cleaning Service',
            '550e8400-e29b-41d4-a716-446655440003',  -- Cleaning category
            '650e8400-e29b-41d4-a716-446655440022',  -- AC Cleaning subcategory
            'Complete air conditioner deep cleaning including coils, filters, and duct cleaning. Improves AC efficiency, air quality, and extends appliance life.',
            'Professional AC cleaning and maintenance',
            1800.0,
            1500.0,
            120,
            '["Coil cleaning", "Filter cleaning/replacement", "Duct cleaning", "Performance testing", "Gas level check", "Efficiency optimization"]'::jsonb,
            '["Gas refilling charges extra", "Major repairs not included", "Specialized chemicals extra if needed"]'::jsonb,
            '["AC accessible for service", "Power connection available", "Clear access around AC unit"]'::jsonb,
            4.4,
            156,
            278,
            true,
            true,
            '["cleaning", "ac", "maintenance", "deep-clean"]'::jsonb,
            '{}'::jsonb,
            NOW(),
            NOW()
        ),
        
        (
            '750e8400-e29b-41d4-a716-446655440023',
            'Water Tank Cleaning Service',
            '550e8400-e29b-41d4-a716-446655440003',  -- Cleaning category
            '650e8400-e29b-41d4-a716-446655440023',  -- Water Tank Cleaning subcategory
            'Professional water tank cleaning and disinfection service. Ensures clean and safe drinking water with thorough cleaning and sanitization.',
            'Water tank cleaning and disinfection',
            2200.0,
            1800.0,
            180,
            '["Complete tank cleaning", "Disinfection treatment", "Water quality testing", "Safety inspection", "Health certificate"]'::jsonb,
            '["Water supply arrangements extra", "Tank repairs not included", "Access equipment rental extra"]'::jsonb,
            '["Tank accessibility", "Alternative water arrangement", "Clear access to tank area"]'::jsonb,
            4.5,
            92,
            167,
            true,
            false,
            '["cleaning", "water-tank", "disinfection", "health"]'::jsonb,
            '{}'::jsonb,
            NOW(),
            NOW()
        ),
        
        -- Call A Service
        (
            '750e8400-e29b-41d4-a716-446655440031',
            'Local Courier Service',
            '550e8400-e29b-41d4-a716-446655440004',  -- Call A Service category
            '650e8400-e29b-41d4-a716-446655440031',  -- Courier Service subcategory
            'Reliable local courier service for document and package delivery. Same-day delivery with tracking and proof of delivery.',
            'Local package pickup and delivery service',
            150.0,
            120.0,
            60,
            '["Same-day delivery", "Package tracking", "Proof of delivery", "Secure handling", "Customer support"]'::jsonb,
            '["Weight restrictions apply", "Fragile item charges extra", "Multiple stops extra"]'::jsonb,
            '["Package ready for pickup", "Clear pickup and delivery addresses", "Contact details provided"]'::jsonb,
            4.3,
            186,
            423,
            true,
            true,
            '["courier", "delivery", "logistics", "service"]'::jsonb,
            '{}'::jsonb,
            NOW(),
            NOW()
        ),
        
        (
            '750e8400-e29b-41d4-a716-446655440032',
            'Local CAB Booking',
            '550e8400-e29b-41d4-a716-446655440004',  -- Call A Service category
            '650e8400-e29b-41d4-a716-446655440032',  -- CAB Booking subcategory
            'Convenient local cab booking service for city travel. Clean vehicles, professional drivers, and competitive rates for all your transportation needs.',
            'Local and city cab booking service',
            200.0,
            180.0,
            30,
            '["Professional drivers", "Clean vehicles", "GPS tracking", "24/7 availability", "Customer support"]'::jsonb,
            '["Outstation charges extra", "Waiting charges apply", "Toll charges extra"]'::jsonb,
            '["Valid pickup location", "Contact number", "Destination details"]'::jsonb,
            4.2,
            312,
            789,
            true,
            false,
            '["cab", "taxi", "transportation", "booking"]'::jsonb,
            '{}'::jsonb,
            NOW(),
            NOW()
        )
        
        ON CONFLICT (id) DO NOTHING;
    """)


def downgrade() -> None:
    # Remove the services we added
    op.execute("""
        DELETE FROM services WHERE id IN (
            '750e8400-e29b-41d4-a716-446655440001',
            '750e8400-e29b-41d4-a716-446655440002',
            '750e8400-e29b-41d4-a716-446655440003',
            '750e8400-e29b-41d4-a716-446655440011',
            '750e8400-e29b-41d4-a716-446655440012',
            '750e8400-e29b-41d4-a716-446655440013',
            '750e8400-e29b-41d4-a716-446655440021',
            '750e8400-e29b-41d4-a716-446655440022',
            '750e8400-e29b-41d4-a716-446655440023',
            '750e8400-e29b-41d4-a716-446655440031',
            '750e8400-e29b-41d4-a716-446655440032'
        )
    """)