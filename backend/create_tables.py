#!/usr/bin/env python3
"""
Create database tables directly without migrations for testing.
"""

import asyncio
import sys
import os

# Add the project root to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '.'))

from sqlalchemy.ext.asyncio import create_async_engine
from app.core.config import settings
from app.models.base import Base

async def create_tables():
    """Create all database tables."""
    print("Creating database tables...")
    
    # Create engine
    engine = create_async_engine(settings.postgres_url, echo=True)
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    await engine.dispose()
    print("✅ All tables created successfully!")

if __name__ == "__main__":
    asyncio.run(create_tables())