#!/usr/bin/env python3
"""
Simple database seeding script without Redis dependency.
"""

import asyncio
import logging
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy import text
import sys
import os

# Add the project root to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from app.core.config import settings
from app.models.base import Base
from app.models import *

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def create_db_connection():
    """Create database connection without Redis."""
    engine = create_async_engine(
        settings.postgres_url,
        echo=False,
        pool_size=5,
        max_overflow=10,
        pool_pre_ping=True,
        pool_recycle=3600,
        future=True,
    )
    
    async_session = async_sessionmaker(
        engine,
        class_=AsyncSession,
        expire_on_commit=False,
        autoflush=True,
        autocommit=False
    )
    
    # Test connection
    async with async_session() as session:
        result = await session.execute(text("SELECT 1"))
        result.fetchone()
    
    logger.info("Database connected successfully")
    return engine, async_session

async def seed_categories(session):
    """Seed service categories."""
    logger.info("Seeding service categories...")
    
    categories_data = [
        {"name": "Plumbing", "icon": "🔧", "description": "Professional plumbing services", "sort_order": 1},
        {"name": "Electrical", "icon": "⚡", "description": "Electrical installation and repair", "sort_order": 2}, 
        {"name": "Cleaning", "icon": "🧹", "description": "Home and office cleaning services", "sort_order": 3},
        {"name": "Call A Service", "icon": "📞", "description": "On-demand service providers", "sort_order": 4},
        {"name": "Finance & Insurance", "icon": "💰", "description": "Financial and insurance services", "sort_order": 5},
        {"name": "Personal Care", "icon": "💄", "description": "Beauty and wellness services", "sort_order": 6},
        {"name": "Civil Work", "icon": "🏗️", "description": "Construction and repair work", "sort_order": 7},
    ]
    
    categories = {}
    for cat_data in categories_data:
        category = ServiceCategory(**cat_data)
        session.add(category)
        await session.flush()
        categories[cat_data["name"]] = category
    
    logger.info(f"Seeded {len(categories_data)} service categories")
    return categories

async def seed_subcategories(session, categories):
    """Seed service subcategories."""
    logger.info("Seeding service subcategories...")
    
    subcategories_data = {
        "Plumbing": [
            {"name": "Bath Fittings", "description": "Installation and repair of bathroom fixtures", "icon": "🚿"},
            {"name": "Basin, Sink & Drainage", "description": "Kitchen and bathroom sink services", "icon": "🚰"},
            {"name": "Grouting", "description": "Tile grouting and sealing services", "icon": "🔧"},
        ],
        "Electrical": [
            {"name": "Wiring & Installation", "description": "Electrical wiring and installation services", "icon": "⚡"},
            {"name": "Appliance Repair", "description": "Home appliance repair services", "icon": "🔌"},
        ],
        "Cleaning": [
            {"name": "Bathroom Cleaning", "description": "Deep bathroom cleaning services", "icon": "🚿"},
            {"name": "AC Cleaning", "description": "Air conditioner cleaning and maintenance", "icon": "❄️"},
        ]
    }
    
    subcategories = {}
    for category_name, subcats in subcategories_data.items():
        category = categories[category_name]
        for subcat_data in subcats:
            subcategory = ServiceSubcategory(
                category_id=category.id,
                **subcat_data
            )
            session.add(subcategory)
            await session.flush()
            subcategories[f"{category_name}:{subcat_data['name']}"] = subcategory
    
    logger.info(f"Seeded {sum(len(subcats) for subcats in subcategories_data.values())} subcategories")
    return subcategories

async def seed_services(session, subcategories):
    """Seed sample services."""
    logger.info("Seeding services...")
    
    # Bath Fittings Service
    bath_fittings_subcat = subcategories["Plumbing:Bath Fittings"]
    
    service = Service(
        subcategory_id=bath_fittings_subcat.id,
        category_id=bath_fittings_subcat.category_id,
        name="Bath Fittings Installation & Repair",
        description="Professional installation and repair of bathroom fittings including taps, showers, and accessories",
        short_description="Professional bath fittings installation and repair service",
        base_price=99.0,
        duration=60,
        inclusions=["Professional technician", "Basic tools", "30-day warranty"],
        exclusions=["Materials cost", "Electrical work"],
        requirements=["Access to bathroom", "Clear workspace"],
        rating=4.8,
        review_count=1247,
        booking_count=324,
        is_active=True,
        is_featured=True,
        tags=["bathroom", "plumbing", "installation", "repair"],
        availability_settings={"working_hours": {"start": "09:00", "end": "18:00"}}
    )
    session.add(service)
    await session.flush()
    
    # Service Variants
    classic_variant = ServiceVariant(
        service_id=service.id,
        name="Classic",
        base_price=99.0,
        discounted_price=None,
        duration=60,
        description="Basic bath fittings service",
        inclusions=["Professional technician", "Basic tools", "30-day warranty"],
        exclusions=["Materials cost", "Electrical work"],
        features={"warranty_days": 30, "priority": "standard"},
        is_active=True,
        sort_order=1
    )
    session.add(classic_variant)
    
    premium_variant = ServiceVariant(
        service_id=service.id,
        name="Premium",
        base_price=149.0,
        discounted_price=None,
        duration=90,
        description="Premium bath fittings service with extended warranty",
        inclusions=["Expert technician", "Premium tools", "Quality materials", "1-year warranty"],
        exclusions=["Electrical work"],
        features={"warranty_days": 365, "priority": "high", "premium_support": True},
        is_active=True,
        sort_order=2
    )
    session.add(premium_variant)
    
    logger.info("Seeded Bath Fittings service with variants")
    return service

async def seed_sample_data():
    """Main seeding function."""
    try:
        engine, async_session = await create_db_connection()
        
        async with async_session() as session:
            # Seed basic data
            categories = await seed_categories(session)
            subcategories = await seed_subcategories(session, categories)
            service = await seed_services(session, subcategories)
            
            # Commit all changes
            await session.commit()
            logger.info("All sample data seeded successfully!")
            
        await engine.dispose()
        
    except Exception as e:
        logger.error(f"Error seeding database: {e}")
        raise

if __name__ == "__main__":
    asyncio.run(seed_sample_data())