"""Insert initial coupons

Revision ID: 005_initial_coupons
Revises: 004_initial_employees
Create Date: 2025-09-09 14:00:00.000000

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

# revision identifiers, used by Alembic.
revision: str = '005_initial_coupons'
down_revision: Union[str, None] = '004_initial_employees'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Insert initial coupons
    op.execute("""
        INSERT INTO coupons (
            id, code, name, description, type, value, minimum_order_amount,
            maximum_discount_amount, usage_limit, used_count, per_user_limit,
            is_active, valid_from, valid_until, applicable_services, 
            applicable_categories, applicable_user_tiers, terms_and_conditions,
            marketing_message, auto_deactivate_after_expiry, created_at, updated_at
        ) VALUES
        
        (
            '950e8400-e29b-41d4-a716-446655440001',
            'WELCOME10',
            'Welcome 10% Off',
            'Get 10% off on your first service booking with Happy Homes',
            'percentage',
            10.0,
            500.0,
            200.0,
            1000,
            45,
            1,
            true,
            NOW(),
            NOW() + INTERVAL '90 days',
            '[]'::jsonb,
            '[]'::jsonb,
            '["new"]'::jsonb,
            'Valid for first-time users only. Cannot be combined with other offers. Minimum order value ₹500 required. Maximum discount ₹200.',
            'Welcome to Happy Homes! Get 10% off your first service.',
            true,
            NOW(),
            NOW()
        ),
        
        (
            '950e8400-e29b-41d4-a716-446655440002',
            'PLUMBING50',
            'Plumbing Special ₹50 Off',
            'Get ₹50 off on any plumbing service',
            'fixed',
            50.0,
            1000.0,
            NULL,
            500,
            123,
            3,
            true,
            NOW(),
            NOW() + INTERVAL '30 days',
            '[]'::jsonb,
            '["550e8400-e29b-41d4-a716-446655440001"]'::jsonb,
            '[]'::jsonb,
            'Valid on plumbing services only. Minimum order value ₹1000. Can be used up to 3 times per user.',
            'Save ₹50 on your plumbing needs!',
            true,
            NOW(),
            NOW()
        ),
        
        (
            '950e8400-e29b-41d4-a716-446655440003',
            'CLEAN20',
            'Cleaning Service 20% Off',
            'Get 20% off on all cleaning services',
            'percentage',
            20.0,
            800.0,
            300.0,
            200,
            67,
            2,
            true,
            NOW(),
            NOW() + INTERVAL '45 days',
            '[]'::jsonb,
            '["550e8400-e29b-41d4-a716-446655440003"]'::jsonb,
            '[]'::jsonb,
            'Valid on cleaning services only. Minimum order value ₹800. Maximum discount ₹300. Can be used twice per user.',
            'Sparkling clean homes at 20% less!',
            true,
            NOW(),
            NOW()
        ),
        
        (
            '950e8400-e29b-41d4-a716-446655440004',
            'ELECTRICAL100',
            'Electrical Service ₹100 Off',
            'Get ₹100 off on electrical services',
            'fixed',
            100.0,
            1500.0,
            NULL,
            300,
            34,
            2,
            true,
            NOW(),
            NOW() + INTERVAL '60 days',
            '[]'::jsonb,
            '["550e8400-e29b-41d4-a716-446655440002"]'::jsonb,
            '[]'::jsonb,
            'Valid on electrical services only. Minimum order value ₹1500. Can be used twice per user.',
            'Power up your savings with ₹100 off!',
            true,
            NOW(),
            NOW()
        ),
        
        (
            '950e8400-e29b-41d4-a716-446655440005',
            'FIRSTTIME15',
            'First Time Customer 15% Off',
            'Special discount for first-time customers',
            'percentage',
            15.0,
            750.0,
            250.0,
            500,
            12,
            1,
            true,
            NOW(),
            NOW() + INTERVAL '120 days',
            '[]'::jsonb,
            '[]'::jsonb,
            '["new", "first-time"]'::jsonb,
            'Valid for first-time customers only. Minimum order value ₹750. Maximum discount ₹250. One-time use only.',
            'Special welcome offer - 15% off your first service!',
            true,
            NOW(),
            NOW()
        ),
        
        (
            '950e8400-e29b-41d4-a716-446655440006',
            'SERVICE200',
            'Service Combo ₹200 Off',
            'Get ₹200 off when you book multiple services',
            'fixed',
            200.0,
            2500.0,
            NULL,
            150,
            8,
            1,
            true,
            NOW(),
            NOW() + INTERVAL '30 days',
            '[]'::jsonb,
            '[]'::jsonb,
            '[]'::jsonb,
            'Valid on orders above ₹2500. Applicable when booking 2 or more services. One-time use per user.',
            'Book multiple services and save ₹200!',
            true,
            NOW(),
            NOW()
        ),
        
        (
            '950e8400-e29b-41d4-a716-446655440007',
            'WEEKEND25',
            'Weekend Special 25% Off',
            'Weekend special offer on selected services',
            'percentage',
            25.0,
            1200.0,
            400.0,
            100,
            23,
            2,
            true,
            NOW(),
            NOW() + INTERVAL '15 days',
            '[]'::jsonb,
            '["550e8400-e29b-41d4-a716-446655440003"]'::jsonb,
            '[]'::jsonb,
            'Valid on weekends only for cleaning services. Minimum order ₹1200. Maximum discount ₹400. Limited time offer.',
            'Weekend cleaning special - 25% off!',
            true,
            NOW(),
            NOW()
        ),
        
        (
            '950e8400-e29b-41d4-a716-446655440008',
            'URGENT75',
            'Emergency Service ₹75 Off',
            'Discount on emergency and urgent services',
            'fixed',
            75.0,
            1000.0,
            NULL,
            200,
            56,
            3,
            true,
            NOW(),
            NOW() + INTERVAL '90 days',
            '[]'::jsonb,
            '["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"]'::jsonb,
            '[]'::jsonb,
            'Valid on emergency plumbing and electrical services. Minimum order ₹1000. Available 24/7.',
            'Emergency service at discounted rates!',
            true,
            NOW(),
            NOW()
        )
        
        ON CONFLICT (id) DO NOTHING;
    """)


def downgrade() -> None:
    # Remove the coupons we added
    op.execute("""
        DELETE FROM coupons WHERE id IN (
            '950e8400-e29b-41d4-a716-446655440001',
            '950e8400-e29b-41d4-a716-446655440002',
            '950e8400-e29b-41d4-a716-446655440003',
            '950e8400-e29b-41d4-a716-446655440004',
            '950e8400-e29b-41d4-a716-446655440005',
            '950e8400-e29b-41d4-a716-446655440006',
            '950e8400-e29b-41d4-a716-446655440007',
            '950e8400-e29b-41d4-a716-446655440008'
        )
    """)