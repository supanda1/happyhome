#!/usr/bin/env python3

import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def create_service_tables():
    # Create database connection
    DATABASE_URL = "postgresql+asyncpg://postgres:password@localhost:5432/household_services"
    
    engine = create_async_engine(DATABASE_URL, echo=True)
    
    try:
        async with engine.begin() as conn:
            print("✅ Creating service tables...")
            
            # Create service_categories table
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS service_categories (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    name VARCHAR(100) NOT NULL UNIQUE,
                    description VARCHAR(500) NOT NULL,
                    icon VARCHAR(10) NOT NULL,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    sort_order INTEGER NOT NULL DEFAULT 0,
                    image_paths JSONB
                );
            """))
            
            # Create indexes for service_categories
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_service_categories_name ON service_categories (name);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_service_categories_is_active ON service_categories (is_active);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_service_categories_sort_order ON service_categories (sort_order);"))
            
            # Create service_subcategories table
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS service_subcategories (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    category_id UUID NOT NULL REFERENCES service_categories(id),
                    name VARCHAR(100) NOT NULL,
                    description VARCHAR(500) NOT NULL,
                    icon VARCHAR(10) NOT NULL,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    sort_order INTEGER NOT NULL DEFAULT 0
                );
            """))
            
            # Create indexes for service_subcategories
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_service_subcategories_category_id ON service_subcategories (category_id);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_service_subcategories_name ON service_subcategories (name);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_service_subcategories_is_active ON service_subcategories (is_active);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_service_subcategories_sort_order ON service_subcategories (sort_order);"))
            
            # Create services table
            await conn.execute(text("""
                CREATE TABLE IF NOT EXISTS services (
                    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                    name VARCHAR(200) NOT NULL,
                    category_id UUID NOT NULL REFERENCES service_categories(id),
                    subcategory_id UUID REFERENCES service_subcategories(id),
                    description TEXT NOT NULL,
                    short_description VARCHAR(300) NOT NULL,
                    base_price FLOAT NOT NULL,
                    discounted_price FLOAT,
                    duration INTEGER NOT NULL,
                    inclusions JSONB NOT NULL DEFAULT '[]',
                    exclusions JSONB NOT NULL DEFAULT '[]',
                    requirements JSONB NOT NULL DEFAULT '[]',
                    rating FLOAT NOT NULL DEFAULT 0.0,
                    review_count INTEGER NOT NULL DEFAULT 0,
                    booking_count INTEGER NOT NULL DEFAULT 0,
                    is_active BOOLEAN NOT NULL DEFAULT TRUE,
                    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
                    tags JSONB NOT NULL DEFAULT '[]',
                    availability_settings JSONB NOT NULL DEFAULT '{}',
                    image_paths JSONB
                );
            """))
            
            # Create indexes for services
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_services_name ON services (name);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_services_category_id ON services (category_id);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_services_subcategory_id ON services (subcategory_id);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_services_base_price ON services (base_price);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_services_rating ON services (rating);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_services_is_active ON services (is_active);"))
            await conn.execute(text("CREATE INDEX IF NOT EXISTS ix_services_is_featured ON services (is_featured);"))
            
            print("✅ Service tables created successfully!")
            
    except Exception as e:
        print(f"❌ Error creating service tables: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(create_service_tables())