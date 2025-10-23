-- Add offer plan coupons for Smart Start, Premium Care, and Elite Guard plans
-- Migration: 018_add_offer_plan_coupons.sql

INSERT INTO coupons (
    id, code, name, description, discount_type, discount_value, minimum_amount,
    maximum_discount, usage_limit, usage_count, usage_limit_per_user,
    is_active, valid_from, valid_until, applicable_services, 
    applicable_categories, created_at, updated_at
) VALUES

-- STARTER20 - Smart Start Plan (20% discount)
(
    '950e8400-e29b-41d4-a716-446655440020',
    'STARTER20',
    'Smart Start Plan - 20% Off',
    'Exclusive 20% discount for Smart Start plan subscribers',
    'percentage',
    20.0,
    0.0,
    NULL,
    99999,
    0,
    99,
    true,
    NOW()::date - INTERVAL '1 day',
    NOW()::date + INTERVAL '365 days',
    '[]'::jsonb,
    '[]'::jsonb,
    NOW(),
    NOW()
),

-- PREMIUM25 - Premium Care Plan (25% discount)  
(
    '950e8400-e29b-41d4-a716-446655440025',
    'PREMIUM25',
    'Premium Care Plan - 25% Off',
    'Exclusive 25% discount for Premium Care plan subscribers',
    'percentage',
    25.0,
    0.0,
    NULL,
    99999,
    0,
    99,
    true,
    NOW()::date - INTERVAL '1 day',
    NOW()::date + INTERVAL '365 days',
    '[]'::jsonb,
    '[]'::jsonb,
    NOW(),
    NOW()
),

-- ELITE30 - Elite Guard Plan (30% discount)
(
    '950e8400-e29b-41d4-a716-446655440030',
    'ELITE30',
    'Elite Guard Plan - 30% Off',
    'Exclusive 30% discount for Elite Guard plan subscribers',
    'percentage',
    30.0,
    0.0,
    NULL,
    99999,
    0,
    99,
    true,
    NOW()::date - INTERVAL '1 day',
    NOW()::date + INTERVAL '365 days',
    '[]'::jsonb,
    '[]'::jsonb,
    NOW(),
    NOW()
)

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    discount_type = EXCLUDED.discount_type,
    discount_value = EXCLUDED.discount_value,
    minimum_amount = EXCLUDED.minimum_amount,
    maximum_discount = EXCLUDED.maximum_discount,
    usage_limit = EXCLUDED.usage_limit,
    usage_limit_per_user = EXCLUDED.usage_limit_per_user,
    is_active = EXCLUDED.is_active,
    valid_from = EXCLUDED.valid_from,
    valid_until = EXCLUDED.valid_until,
    applicable_services = EXCLUDED.applicable_services,
    applicable_categories = EXCLUDED.applicable_categories,
    updated_at = NOW();