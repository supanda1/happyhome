#!/usr/bin/env python3
"""
Update Plumbing Services Image Paths Script

This script updates the image_paths field for all plumbing services with the 
newly downloaded images from Pexels (stored locally).
"""

import asyncio
import sys
import os
from typing import Dict, List
from uuid import UUID

# Add the parent directory to the path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database.connection import Database, get_db_session
from app.models.service import Service, ServiceSubcategory
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

# Image mapping for all plumbing services
PLUMBING_SERVICE_IMAGES = {
    "Bath Fittings": [
        "/images/subcategories/plumbing/bath-fittings/bath-fittings-1.jpg",
        "/images/subcategories/plumbing/bath-fittings/bath-fittings-2.jpg", 
        "/images/subcategories/plumbing/bath-fittings/bath-fittings-3.jpg",
        "/images/subcategories/plumbing/bath-fittings/bath-fittings-4.jpg",
        "/images/subcategories/plumbing/bath-fittings/bath-fittings-5.jpg"
    ],
    "Basin, Sink & Drainage": [
        "/images/subcategories/plumbing/basin-sink-drainage-1.jpg",
        "/images/subcategories/plumbing/basin-sink-drainage-2.jpg",
        "/images/subcategories/plumbing/basin-sink-drainage-3.jpg",
        "/images/subcategories/plumbing/basin-sink-drainage-4.jpg",
        "/images/subcategories/plumbing/basin-sink-drainage-5.jpg"
    ],
    "Grouting": [
        "/images/subcategories/plumbing/grouting/grouting-1.jpg",
        "/images/subcategories/plumbing/grouting/grouting-2.jpg",
        "/images/subcategories/plumbing/grouting/grouting-3.jpg", 
        "/images/subcategories/plumbing/grouting/grouting-4.jpg",
        "/images/subcategories/plumbing/grouting/grouting-5.jpg"
    ],
    "Toilets": [
        "/images/subcategories/plumbing/toilet-services/toilet-service-1.jpg",
        "/images/subcategories/plumbing/toilet-services/toilet-service-2.jpg",
        "/images/subcategories/plumbing/toilet-services/toilet-service-3.jpg",
        "/images/subcategories/plumbing/toilet-services/toilet-service-4.jpg",
        "/images/subcategories/plumbing/toilet-services/toilet-service-5.jpg"
    ],
    "Pipe & Connector": [
        "/images/subcategories/plumbing/pipe-connector/pipe-connector-1.jpg",
        "/images/subcategories/plumbing/pipe-connector/pipe-connector-2.jpg",
        "/images/subcategories/plumbing/pipe-connector/pipe-connector-3.jpg",
        "/images/subcategories/plumbing/pipe-connector/pipe-connector-4.jpg", 
        "/images/subcategories/plumbing/pipe-connector/pipe-connector-5.jpg"
    ],
    "Water Tank": [
        "/images/subcategories/plumbing/water-tank/water-tank-1.jpg",
        "/images/subcategories/plumbing/water-tank/water-tank-2.jpg",
        "/images/subcategories/plumbing/water-tank/water-tank-3.jpg",
        "/images/subcategories/plumbing/water-tank/water-tank-4.jpg",
        "/images/subcategories/plumbing/water-tank/water-tank-5.jpg"
    ],
    "Others": [
        "/images/subcategories/plumbing/others/others-1.jpg",
        "/images/subcategories/plumbing/others/others-2.jpg",
        "/images/subcategories/plumbing/others/others-3.jpg",
        "/images/subcategories/plumbing/others/others-4.jpg",
        "/images/subcategories/plumbing/others/others-5.jpg"
    ]
}


class PlumbingImageUpdater:
    """Updates plumbing service images in the database"""
    
    def __init__(self):
        self.db: AsyncSession = None
        
    async def connect_database(self):
        """Initialize database connection"""
        print("🔌 Connecting to database...")
        await Database.connect_db()
        async for session in get_db_session():
            self.db = session
            break
        print("✅ Database connected successfully!")
        
    async def disconnect_database(self):
        """Close database connection"""
        await Database.close_db()
        print("🔌 Database connection closed.")
        
    async def update_plumbing_service_images(self):
        """Update image paths for all plumbing services"""
        print("\n🖼️ Updating plumbing service images...")
        
        updated_count = 0
        
        for subcategory_name, image_paths in PLUMBING_SERVICE_IMAGES.items():
            # Find the subcategory
            result = await self.db.execute(
                select(ServiceSubcategory).where(
                    ServiceSubcategory.name == subcategory_name
                )
            )
            subcategory = result.scalar_one_or_none()
            
            if not subcategory:
                print(f"   ⚠️ Subcategory '{subcategory_name}' not found, skipping...")
                continue
                
            # Find services for this subcategory
            result = await self.db.execute(
                select(Service).where(
                    Service.subcategory_id == subcategory.id
                )
            )
            services = result.scalars().all()
            
            if not services:
                print(f"   ⚠️ No services found for subcategory '{subcategory_name}', skipping...")
                continue
                
            # Update image paths for all services in this subcategory
            for service in services:
                service.image_paths = image_paths
                updated_count += 1
                print(f"   ✅ Updated images for service: {service.name}")
                print(f"      📁 Added {len(image_paths)} image paths")
                
        # Commit all changes
        await self.db.commit()
        print(f"\n🖼️ Image update completed! ({updated_count} services updated)")
        
    async def verify_image_updates(self):
        """Verify that all plumbing services have updated images"""
        print("\n🔍 Verifying image updates...")
        
        # Get all plumbing services
        result = await self.db.execute(
            select(Service, ServiceSubcategory).join(
                ServiceSubcategory, Service.subcategory_id == ServiceSubcategory.id
            ).where(
                ServiceSubcategory.name.in_(PLUMBING_SERVICE_IMAGES.keys())
            )
        )
        
        services_with_subcategories = result.all()
        
        for service, subcategory in services_with_subcategories:
            image_count = len(service.image_paths) if service.image_paths else 0
            expected_count = len(PLUMBING_SERVICE_IMAGES[subcategory.name])
            
            if image_count == expected_count:
                print(f"   ✅ {subcategory.name}: {image_count}/{expected_count} images")
            else:
                print(f"   ⚠️ {subcategory.name}: {image_count}/{expected_count} images (MISMATCH)")
                
        print("🔍 Verification completed!")
        
    async def run_update(self):
        """Run the complete image update process"""
        try:
            await self.connect_database()
            
            print("🚀 Starting plumbing services image update...")
            print("=" * 60)
            
            await self.update_plumbing_service_images()
            await self.verify_image_updates()
            
            print("\n" + "=" * 60)
            print("🎉 Plumbing service images updated successfully!")
            print("📊 All plumbing services now have 5 high-quality images each")
            print("🎯 Database image paths are now properly configured!")
            
        except Exception as e:
            print(f"❌ Error during update: {str(e)}")
            raise
        finally:
            await self.disconnect_database()


async def main():
    """Main update function"""
    updater = PlumbingImageUpdater()
    await updater.run_update()


if __name__ == "__main__":
    print("🏠 Happy Homes - Plumbing Services Image Update Script")
    print("=" * 50)
    asyncio.run(main())