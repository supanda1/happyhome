#!/usr/bin/env python3

import asyncio
import os
import sys
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from sqlalchemy import select, text

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

from app.models.service import ServiceCategory, Service

async def test_database():
    # Create database connection
    DATABASE_URL = "postgresql+asyncpg://postgres:password@localhost:5432/household_services"
    
    engine = create_async_engine(DATABASE_URL, echo=True)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    
    try:
        async with async_session() as session:
            print("✅ Database connection established")
            
            # Test raw query
            result = await session.execute(text("SELECT COUNT(*) as count FROM service_categories"))
            category_count = result.scalar()
            print(f"📊 Categories in database: {category_count}")
            
            # Test SQLAlchemy query
            query = select(ServiceCategory).where(ServiceCategory.is_active == True)
            result = await session.execute(query)
            categories = result.scalars().all()
            
            print(f"📋 Active categories found: {len(categories)}")
            for category in categories:
                print(f"   - {category.name}: {category.description}")
            
            # Test services count
            service_result = await session.execute(text("SELECT COUNT(*) as count FROM services"))
            service_count = service_result.scalar()
            print(f"🔧 Services in database: {service_count}")
            
    except Exception as e:
        print(f"❌ Database error: {e}")
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(test_database())