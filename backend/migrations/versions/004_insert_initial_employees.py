"""Insert initial employees

Revision ID: 004_initial_employees
Revises: 003_initial_services
Create Date: 2025-09-09 13:30:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '004_initial_employees'
down_revision: Union[str, None] = '003_initial_services'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Insert initial employees
    op.execute("""
        INSERT INTO employees (
            id, name, email, phone, expertise_areas, rating, completed_jobs,
            is_active, is_available, location, service_areas, employee_id,
            department, position, skills, certifications, work_schedule,
            created_at, updated_at
        ) VALUES
        
        (
            '850e8400-e29b-41d4-a716-446655440001',
            'Rajesh Kumar',
            'rajesh.kumar@happyhomes.com',
            '+91-9876543210',
            '["Plumbing", "Bath Fittings", "Water Tank Installation", "Pipe Repair"]'::jsonb,
            4.7,
            245,
            true,
            true,
            'Mumbai Central',
            '["Mumbai Central", "Dadar", "Bandra", "Andheri"]'::jsonb,
            'HH-PLB-001',
            'Plumbing Services',
            'Senior Plumber',
            '["Pipe Installation", "Leak Detection", "Water System Design", "Pressure Testing"]'::jsonb,
            '["Certified Plumber", "Water System Specialist", "Safety Certified"]'::jsonb,
            '{"monday": "9:00-18:00", "tuesday": "9:00-18:00", "wednesday": "9:00-18:00", "thursday": "9:00-18:00", "friday": "9:00-18:00", "saturday": "9:00-15:00", "sunday": "off"}'::jsonb,
            NOW(),
            NOW()
        ),
        
        (
            '850e8400-e29b-41d4-a716-446655440002',
            'Amit Sharma',
            'amit.sharma@happyhomes.com',
            '+91-9876543211',
            '["Electrical Wiring", "Appliance Repair", "Safety Check", "Fan Installation"]'::jsonb,
            4.5,
            189,
            true,
            true,
            'Pune',
            '["Pune", "PCMC", "Kothrud", "Wakad"]'::jsonb,
            'HH-ELC-001',
            'Electrical Services',
            'Senior Electrician',
            '["House Wiring", "Motor Repair", "Panel Installation", "Circuit Design"]'::jsonb,
            '["Licensed Electrician", "Safety Inspector", "Industrial Certified"]'::jsonb,
            '{"monday": "8:00-17:00", "tuesday": "8:00-17:00", "wednesday": "8:00-17:00", "thursday": "8:00-17:00", "friday": "8:00-17:00", "saturday": "8:00-14:00", "sunday": "emergency-only"}'::jsonb,
            NOW(),
            NOW()
        ),
        
        (
            '850e8400-e29b-41d4-a716-446655440003',
            'Priya Patel',
            'priya.patel@happyhomes.com',
            '+91-9876543212',
            '["Deep Cleaning", "Bathroom Cleaning", "AC Cleaning", "Water Tank Cleaning"]'::jsonb,
            4.8,
            312,
            true,
            true,
            'Delhi',
            '["Delhi", "Gurgaon", "Noida", "Faridabad"]'::jsonb,
            'HH-CLN-001',
            'Cleaning Services',
            'Senior Cleaning Specialist',
            '["Deep Cleaning", "Sanitization", "Equipment Operation", "Chemical Handling"]'::jsonb,
            '["Professional Cleaner", "Hygiene Specialist", "Chemical Safety Certified"]'::jsonb,
            '{"monday": "9:00-17:00", "tuesday": "9:00-17:00", "wednesday": "9:00-17:00", "thursday": "9:00-17:00", "friday": "9:00-17:00", "saturday": "9:00-15:00", "sunday": "off"}'::jsonb,
            NOW(),
            NOW()
        ),
        
        (
            '850e8400-e29b-41d4-a716-446655440004',
            'Suresh Reddy',
            'suresh.reddy@happyhomes.com',
            '+91-9876543213',
            '["General Repairs", "Civil Work", "Maintenance", "Home Repairs"]'::jsonb,
            4.3,
            167,
            true,
            true,
            'Bangalore',
            '["Bangalore", "Whitefield", "Electronic City", "Koramangala"]'::jsonb,
            'HH-HND-001',
            'General Services',
            'Handyman',
            '["Carpentry", "Painting", "Minor Repairs", "Assembly Work"]'::jsonb,
            '["Multi-skill Technician", "Safety Training Completed"]'::jsonb,
            '{"monday": "9:00-18:00", "tuesday": "9:00-18:00", "wednesday": "9:00-18:00", "thursday": "9:00-18:00", "friday": "9:00-18:00", "saturday": "10:00-16:00", "sunday": "emergency-only"}'::jsonb,
            NOW(),
            NOW()
        ),
        
        (
            '850e8400-e29b-41d4-a716-446655440005',
            'Kavita Singh',
            'kavita.singh@happyhomes.com',
            '+91-9876543214',
            '["Personal Care Services", "Health Checkup", "Medicine Delivery"]'::jsonb,
            4.9,
            89,
            true,
            true,
            'Chennai',
            '["Chennai", "Tambaram", "Velachery", "Adyar"]'::jsonb,
            'HH-PC-001',
            'Personal Care',
            'Care Specialist',
            '["Health Assessment", "Care Planning", "Documentation", "Customer Care"]'::jsonb,
            '["Healthcare Assistant", "First Aid Certified", "CPR Certified"]'::jsonb,
            '{"monday": "10:00-19:00", "tuesday": "10:00-19:00", "wednesday": "10:00-19:00", "thursday": "10:00-19:00", "friday": "10:00-19:00", "saturday": "10:00-17:00", "sunday": "emergency-only"}'::jsonb,
            NOW(),
            NOW()
        ),
        
        (
            '850e8400-e29b-41d4-a716-446655440006',
            'Vikram Mehta',
            'vikram.mehta@happyhomes.com',
            '+91-9876543215',
            '["Courier Service", "CAB Booking", "Vehicle Breakdown", "Logistics"]'::jsonb,
            4.4,
            234,
            true,
            true,
            'Hyderabad',
            '["Hyderabad", "Secunderabad", "Gachibowli", "Madhapur"]'::jsonb,
            'HH-SRV-001',
            'Service Coordination',
            'Service Coordinator',
            '["Route Planning", "Customer Service", "Emergency Response", "Fleet Management"]'::jsonb,
            '["Driver Licensed", "Emergency Response Trained", "Customer Service Certified"]'::jsonb,
            '{"monday": "8:00-20:00", "tuesday": "8:00-20:00", "wednesday": "8:00-20:00", "thursday": "8:00-20:00", "friday": "8:00-20:00", "saturday": "8:00-20:00", "sunday": "10:00-18:00"}'::jsonb,
            NOW(),
            NOW()
        ),
        
        (
            '850e8400-e29b-41d4-a716-446655440007',
            'Anita Desai',
            'anita.desai@happyhomes.com',
            '+91-9876543216',
            '["Finance Services", "GST Registration", "ITR Filing", "Documentation"]'::jsonb,
            4.6,
            156,
            true,
            true,
            'Ahmedabad',
            '["Ahmedabad", "Gandhinagar", "Surat", "Vadodara"]'::jsonb,
            'HH-FIN-001',
            'Finance & Documentation',
            'Financial Consultant',
            '["Tax Planning", "Documentation", "Compliance", "Advisory Services"]'::jsonb,
            '["CA Inter", "Tax Consultant", "GST Practitioner"]'::jsonb,
            '{"monday": "10:00-18:00", "tuesday": "10:00-18:00", "wednesday": "10:00-18:00", "thursday": "10:00-18:00", "friday": "10:00-18:00", "saturday": "10:00-15:00", "sunday": "off"}'::jsonb,
            NOW(),
            NOW()
        ),
        
        (
            '850e8400-e29b-41d4-a716-446655440008',
            'Raman Singh',
            'raman.singh@happyhomes.com',
            '+91-9876543217',
            '["House Painting", "Tile Work", "Civil Work", "Construction"]'::jsonb,
            4.5,
            198,
            true,
            true,
            'Jaipur',
            '["Jaipur", "Jodhpur", "Kota", "Udaipur"]'::jsonb,
            'HH-CIV-001',
            'Civil Works',
            'Construction Specialist',
            '["Painting", "Tiling", "Masonry", "Finishing Work"]'::jsonb,
            '["Construction Supervisor", "Safety Trained", "Quality Inspector"]'::jsonb,
            '{"monday": "8:00-17:00", "tuesday": "8:00-17:00", "wednesday": "8:00-17:00", "thursday": "8:00-17:00", "friday": "8:00-17:00", "saturday": "8:00-15:00", "sunday": "off"}'::jsonb,
            NOW(),
            NOW()
        )
        
        ON CONFLICT (id) DO NOTHING;
    """)


def downgrade() -> None:
    # Remove the employees we added
    op.execute("""
        DELETE FROM employees WHERE id IN (
            '850e8400-e29b-41d4-a716-446655440001',
            '850e8400-e29b-41d4-a716-446655440002',
            '850e8400-e29b-41d4-a716-446655440003',
            '850e8400-e29b-41d4-a716-446655440004',
            '850e8400-e29b-41d4-a716-446655440005',
            '850e8400-e29b-41d4-a716-446655440006',
            '850e8400-e29b-41d4-a716-446655440007',
            '850e8400-e29b-41d4-a716-446655440008'
        )
    """)