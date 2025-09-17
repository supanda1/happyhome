#!/usr/bin/env python3
"""
Create order management tables script.

This script creates the orders and order_items tables in the database
for handling multi-item service orders.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the parent directory to Python path to import app modules
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.database.connection import Database
from app.core.config import settings
from app.core.logging import get_logger

logger = get_logger(__name__)


async def create_order_tables():
    """Create order management tables."""
    try:
        # Connect to database
        await Database.connect_db()
        
        # Read SQL file
        sql_file = Path(__file__).parent.parent / "create_order_tables.sql"
        
        if not sql_file.exists():
            raise FileNotFoundError(f"SQL file not found: {sql_file}")
        
        with open(sql_file, 'r') as f:
            sql_content = f.read()
        
        # Execute SQL
        db = Database.get_db()
        async with db.begin() as conn:
            # Split SQL into individual statements and execute
            statements = [stmt.strip() for stmt in sql_content.split(';') if stmt.strip()]
            
            for statement in statements:
                if statement:
                    logger.info(f"Executing: {statement[:100]}...")
                    await conn.execute(statement)
            
            logger.info("✅ Order tables created successfully!")
        
        # Verify tables exist
        async with db.begin() as conn:
            # Check orders table
            result = await conn.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'orders'
            """)
            
            if result.fetchone():
                logger.info("✅ Orders table verified")
            else:
                logger.error("❌ Orders table not found")
            
            # Check order_items table
            result = await conn.execute("""
                SELECT table_name FROM information_schema.tables 
                WHERE table_schema = 'public' AND table_name = 'order_items'
            """)
            
            if result.fetchone():
                logger.info("✅ Order items table verified")
            else:
                logger.error("❌ Order items table not found")
        
        logger.info("🎉 Order management tables setup complete!")
        
    except Exception as e:
        logger.error(f"❌ Error creating order tables: {str(e)}")
        raise
    finally:
        await Database.close_db()


async def main():
    """Main function."""
    try:
        logger.info("🚀 Starting order tables creation...")
        await create_order_tables()
        
    except Exception as e:
        logger.error(f"❌ Setup failed: {str(e)}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit_code = asyncio.run(main())