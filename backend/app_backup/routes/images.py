"""
Image management routes for downloading and serving service images.

This module handles:
- Pexels API integration for downloading license-free images
- Local storage of images with proper folder structure
- Serving images via backend endpoints
- Bulk image download operations for services and categories
"""

import asyncio
import os
import shutil
from pathlib import Path
from typing import Dict, List, Optional
from urllib.parse import urlparse

import aiofiles
import aiohttp
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..core.dependencies import get_current_admin_user
from ..core.logging import get_logger
from ..database.connection import get_db_session
from ..models.service import Service, ServiceCategory, ServiceSubcategory
from ..models.user import User
from ..schemas.base import BaseResponse

logger = get_logger(__name__)

router = APIRouter(prefix="/images")

# Pexels API Configuration
PEXELS_API_KEY = settings.PEXELS_API_KEY
PEXELS_API_URL = "https://api.pexels.com/v1"
IMAGES_BASE_PATH = Path("public/images")

# Service-specific search queries for better image matching
SERVICE_SEARCH_QUERIES = {
    # Plumbing services
    "plumbing-bath-fittings": ["bathroom fixtures", "bath fittings", "bathroom taps", "shower fixtures", "bathroom hardware"],
    "plumbing-basin-sink-and-drainage": ["kitchen sink", "bathroom basin", "drain cleaning", "sink installation", "plumbing repair"],
    "plumbing-grouting": ["tile grouting", "bathroom tiles", "grout repair", "tile installation", "bathroom renovation"],
    "plumbing-toilets": ["toilet installation", "bathroom toilet", "toilet repair", "bathroom fixtures", "plumbing work"],
    "plumbing-pipe-connector": ["plumbing pipes", "pipe installation", "water pipes", "plumbing repair", "pipe fitting"],
    "plumbing-water-tank": ["water tank", "water storage", "tank installation", "water system", "plumbing tank"],
    "plumbing-others": ["plumber working", "plumbing tools", "pipe repair", "bathroom plumbing", "water leak repair"],

    # Electrical services
    "electrical-wiring-installation": ["electrical wiring", "electrician work", "house wiring", "electrical installation", "wire installation"],
    "electrical-appliance-repair": ["appliance repair", "electrical appliances", "home appliances", "repair service", "electrical maintenance"],
    "electrical-switch-socket": ["light switch", "electrical socket", "wall switch", "electrical outlet", "switch installation"],
    "electrical-fan-installation": ["ceiling fan", "fan installation", "electrical fan", "home ventilation", "fan repair"],
    "electrical-lighting-solutions": ["home lighting", "LED lights", "light installation", "interior lighting", "electrical lighting"],
    "electrical-safety-check": ["electrical safety", "electrical inspection", "safety check", "electrical testing", "electrical maintenance"],
    "electrical-others": ["electrician", "electrical work", "electrical tools", "electrical repair", "electrical service"],

    # Cleaning services
    "cleaning-bathroom-cleaning": ["bathroom cleaning", "clean bathroom", "bathroom maintenance", "deep cleaning", "bathroom hygiene"],
    "cleaning-ac-cleaning": ["air conditioner cleaning", "AC maintenance", "HVAC cleaning", "air conditioning service", "AC repair"],
    "cleaning-water-tank-cleaning": ["water tank cleaning", "tank maintenance", "water storage cleaning", "tank disinfection", "water hygiene"],
    "cleaning-septic-tank-cleaning": ["septic tank", "sewage cleaning", "waste management", "sanitation service", "septic maintenance"],
    "cleaning-water-purifier-cleaning": ["water purifier", "water filter", "RO service", "water treatment", "filter cleaning"],
    "cleaning-car-wash": ["car wash", "vehicle cleaning", "car detailing", "auto cleaning", "car maintenance"],
    "cleaning-others": ["house cleaning", "deep cleaning", "professional cleaning", "home maintenance", "cleaning service"],

    # Call A Service
    "call-a-service-cab-booking": ["taxi service", "cab booking", "transportation", "ride service", "vehicle hire"],
    "call-a-service-courier": ["courier service", "package delivery", "logistics", "shipping service", "delivery"],
    "call-a-service-vehicle-breakdown": ["roadside assistance", "vehicle repair", "car breakdown", "auto service", "emergency repair"],
    "call-a-service-photographer": ["photographer", "photography service", "professional photography", "event photography", "portrait photography"],
    "call-a-service-others": ["service provider", "professional service", "home service", "maintenance service", "repair service"],

    # Finance & Insurance
    "finance-insurance-gst": ["GST filing", "tax preparation", "financial documents", "accounting service", "tax consultant"],
    "finance-insurance-pan": ["PAN card", "identity documents", "financial paperwork", "document service", "government forms"],
    "finance-insurance-itr": ["income tax", "tax filing", "financial planning", "tax consultant", "accounting"],
    "finance-insurance-stamp-paper": ["legal documents", "stamp paper", "official documents", "legal service", "documentation"],
    "finance-insurance-others": ["financial planning", "insurance service", "financial consultant", "money management", "financial advice"],

    # Personal Care
    "personal-care-medicine-delivery": ["medicine delivery", "pharmacy service", "medical supplies", "healthcare", "prescription delivery"],
    "personal-care-salon-at-door": ["home salon", "beauty service", "personal grooming", "beauty treatment", "salon service"],
    "personal-care-others": ["personal care", "wellness service", "health service", "beauty care", "self care"],

    # Civil Work
    "civil-work-house-painting": ["house painting", "interior painting", "wall painting", "home renovation", "paint service"],
    "civil-work-tile-granite-marble": ["tile installation", "marble flooring", "granite work", "flooring service", "stone work"],
    "civil-work-house-repair": ["home repair", "house maintenance", "building repair", "construction work", "renovation"],
    "civil-work-others": ["construction work", "building maintenance", "civil engineering", "structural repair", "home improvement"]
}

# Category-level search queries
CATEGORY_SEARCH_QUERIES = {
    "plumbing": ["plumbing", "plumber", "water pipes", "bathroom repair", "plumbing tools"],
    "electrical": ["electrician", "electrical work", "wiring", "electrical repair", "electrical tools"],
    "cleaning": ["cleaning service", "house cleaning", "professional cleaning", "deep cleaning", "maintenance"],
    "call-a-service": ["service provider", "professional service", "customer service", "home service", "maintenance"],
    "finance-insurance": ["financial service", "accounting", "tax preparation", "financial planning", "documents"],
    "personal-care": ["personal care", "wellness", "beauty service", "health care", "self care"],
    "civil-work": ["construction", "home improvement", "renovation", "building work", "house repair"]
}


# Pydantic models for requests/responses

class ImageDownloadRequest(BaseModel):
    imageUrl: str = Field(..., description="URL of the image to download")
    filename: str = Field(..., description="Name for the saved file")
    folder: str = Field(..., description="Folder path relative to images base")


class PexelsSearchRequest(BaseModel):
    query: str = Field(..., description="Search query for Pexels")
    per_page: int = Field(default=15, ge=1, le=80, description="Number of images per page")
    page: int = Field(default=1, ge=1, description="Page number")


class PexelsPhoto(BaseModel):
    id: int
    width: int
    height: int
    url: str
    photographer: str
    photographer_url: str
    photographer_id: int
    avg_color: str
    src: Dict[str, str]
    liked: bool
    alt: str


class PexelsSearchResponse(BaseModel):
    total_results: int
    page: int
    per_page: int
    photos: List[PexelsPhoto]
    next_page: Optional[str] = None


class ServiceImageDownloadRequest(BaseModel):
    service_id: str = Field(..., description="Service ID")
    service_name: str = Field(..., description="Service name for search")
    category_id: str = Field(..., description="Category ID for folder structure")
    image_count: int = Field(default=5, ge=1, le=10, description="Number of images to download")


class CategoryImageDownloadRequest(BaseModel):
    category_id: str = Field(..., description="Category ID")
    category_name: str = Field(..., description="Category name for search")
    image_count: int = Field(default=3, ge=1, le=10, description="Number of images to download")


class BulkDownloadRequest(BaseModel):
    image_count: int = Field(default=5, ge=1, le=10, description="Number of images per service")


class ImageValidationRequest(BaseModel):
    image_path: str = Field(..., description="Image path to validate")


async def search_pexels_images(query: str, per_page: int = 15, page: int = 1) -> Optional[PexelsSearchResponse]:
    """Search Pexels API for images based on query."""
    if not PEXELS_API_KEY:
        logger.error("Pexels API key not configured")
        return None
    
    headers = {
        "Authorization": PEXELS_API_KEY
    }
    
    params = {
        "query": query,
        "per_page": per_page,
        "page": page
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{PEXELS_API_URL}/search",
                headers=headers,
                params=params
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    return PexelsSearchResponse(**data)
                else:
                    logger.error(f"Pexels API error: {response.status}")
                    return None
    except Exception as e:
        logger.error(f"Failed to search Pexels: {e}")
        return None


async def download_image_from_url(image_url: str, file_path: Path) -> bool:
    """Download image from URL and save to local path."""
    try:
        # Create directory if it doesn't exist
        file_path.parent.mkdir(parents=True, exist_ok=True)
        
        async with aiohttp.ClientSession() as session:
            async with session.get(image_url) as response:
                if response.status == 200:
                    async with aiofiles.open(file_path, 'wb') as f:
                        async for chunk in response.content.iter_chunked(8192):
                            await f.write(chunk)
                    
                    logger.info(f"Downloaded image: {file_path}")
                    return True
                else:
                    logger.error(f"Failed to download image: HTTP {response.status}")
                    return False
    except Exception as e:
        logger.error(f"Error downloading image from {image_url}: {e}")
        return False


def generate_image_filename(service_id: str, image_index: int, photographer: str) -> str:
    """Generate a unique filename for downloaded image."""
    import time
    clean_photographer = "".join(c for c in photographer.lower() if c.isalnum())[:10]
    timestamp = int(time.time())
    return f"{service_id}-{image_index + 1}-{clean_photographer}-{timestamp}.jpg"


# API Routes

@router.post("/download")
async def download_image(
    request: ImageDownloadRequest,
    current_user: User = Depends(get_current_admin_user)
):
    """Download image from URL and save locally."""
    try:
        # Construct full file path
        folder_path = IMAGES_BASE_PATH / request.folder
        file_path = folder_path / request.filename
        
        # Download image
        success = await download_image_from_url(request.imageUrl, file_path)
        
        if success:
            # Return relative path for database storage
            relative_path = f"images/{request.folder}/{request.filename}"
            return BaseResponse(
                success=True,
                message="Image downloaded successfully",
                data={"localPath": relative_path}
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to download image"
            )
    except Exception as e:
        logger.error(f"Image download failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image download failed: {str(e)}"
        )


@router.post("/search-pexels")
async def search_pexels(
    request: PexelsSearchRequest,
    current_user: User = Depends(get_current_admin_user)
):
    """Search Pexels API for images."""
    try:
        result = await search_pexels_images(
            request.query,
            request.per_page,
            request.page
        )
        
        if result:
            return BaseResponse(
                success=True,
                message="Pexels search completed",
                data=result.dict()
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Pexels search failed"
            )
    except Exception as e:
        logger.error(f"Pexels search failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Pexels search failed: {str(e)}"
        )


@router.post("/validate")
async def validate_image(
    request: ImageValidationRequest,
    current_user: User = Depends(get_current_admin_user)
):
    """Validate if image exists locally."""
    try:
        # Convert to absolute path
        if request.image_path.startswith("images/"):
            file_path = IMAGES_BASE_PATH.parent / request.image_path
        else:
            file_path = IMAGES_BASE_PATH / request.image_path
        
        exists = file_path.exists() and file_path.is_file()
        
        return BaseResponse(
            success=True,
            message="Image validation completed",
            data={"exists": exists}
        )
    except Exception as e:
        logger.error(f"Image validation failed: {e}")
        return BaseResponse(
            success=True,
            message="Image validation completed",
            data={"exists": False}
        )


@router.post("/cleanup")
async def cleanup_unused_images(
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Clean up unused images from local storage."""
    try:
        if not IMAGES_BASE_PATH.exists():
            return BaseResponse(
                success=True,
                message="No images directory found",
                data={"deleted": 0, "freed_space": "0 MB"}
            )
        
        # Get all image paths from database
        services_query = select(Service.image_paths).where(Service.image_paths.isnot(None))
        result = await db.execute(services_query)
        db_images = set()
        
        for row in result.fetchall():
            if row[0]:  # image_paths is not None
                db_images.update(row[0])
        
        # Get all categories image paths
        categories_query = select(ServiceCategory.image_paths).where(ServiceCategory.image_paths.isnot(None))
        cat_result = await db.execute(categories_query)
        
        for row in cat_result.fetchall():
            if row[0]:  # image_paths is not None
                db_images.update(row[0])
        
        # Find unused files
        deleted_count = 0
        freed_bytes = 0
        
        for root, dirs, files in os.walk(IMAGES_BASE_PATH):
            for file in files:
                file_path = Path(root) / file
                relative_path = file_path.relative_to(IMAGES_BASE_PATH.parent)
                
                if str(relative_path) not in db_images:
                    try:
                        file_size = file_path.stat().st_size
                        file_path.unlink()
                        deleted_count += 1
                        freed_bytes += file_size
                    except Exception as e:
                        logger.error(f"Failed to delete {file_path}: {e}")
        
        # Convert bytes to readable format
        freed_mb = freed_bytes / (1024 * 1024)
        freed_space = f"{freed_mb:.2f} MB"
        
        return BaseResponse(
            success=True,
            message="Image cleanup completed",
            data={"deleted": deleted_count, "freed_space": freed_space}
        )
        
    except Exception as e:
        logger.error(f"Image cleanup failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Image cleanup failed: {str(e)}"
        )


# Service image management routes

@router.post("/services/{service_id}/download")
async def download_service_images(
    service_id: str,
    request: ServiceImageDownloadRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Download images for a specific service from Pexels."""
    try:
        # Get search queries for this service
        search_queries = SERVICE_SEARCH_QUERIES.get(service_id, [request.service_name])
        if not search_queries:
            search_queries = [request.service_name]
        
        # Use a random query for variety
        import random
        query = random.choice(search_queries)
        
        # Search Pexels
        pexels_result = await search_pexels_images(query, request.image_count)
        if not pexels_result or not pexels_result.photos:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No images found for service: {request.service_name}"
            )
        
        # Download images
        downloaded_paths = []
        folder_path = f"services/{request.category_id}/{service_id}"
        
        for i, photo in enumerate(pexels_result.photos[:request.image_count]):
            filename = generate_image_filename(service_id, i, photo.photographer)
            file_path = IMAGES_BASE_PATH / folder_path / filename
            
            # Use medium quality for balance of size and quality
            image_url = photo.src.get("medium", photo.src.get("original"))
            
            success = await download_image_from_url(image_url, file_path)
            if success:
                relative_path = f"images/{folder_path}/{filename}"
                downloaded_paths.append(relative_path)
        
        # Update service in database
        if downloaded_paths:
            update_stmt = (
                update(Service)
                .where(Service.id == service_id)
                .values(image_paths=downloaded_paths)
            )
            await db.execute(update_stmt)
            await db.commit()
        
        return BaseResponse(
            success=True,
            message=f"Downloaded {len(downloaded_paths)} images for service {request.service_name}",
            data=downloaded_paths
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Service image download failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Service image download failed: {str(e)}"
        )


@router.post("/categories/{category_id}/download")
async def download_category_images(
    category_id: str,
    request: CategoryImageDownloadRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Download images for a category from Pexels."""
    try:
        # Get search queries for this category
        search_queries = CATEGORY_SEARCH_QUERIES.get(category_id, [request.category_name])
        
        # Use a random query for variety
        import random
        query = random.choice(search_queries)
        
        # Search Pexels
        pexels_result = await search_pexels_images(query, request.image_count)
        if not pexels_result or not pexels_result.photos:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"No images found for category: {request.category_name}"
            )
        
        # Download images
        downloaded_paths = []
        folder_path = f"categories/{category_id}"
        
        for i, photo in enumerate(pexels_result.photos[:request.image_count]):
            filename = generate_image_filename(category_id, i, photo.photographer)
            file_path = IMAGES_BASE_PATH / folder_path / filename
            
            # Use large quality for category images
            image_url = photo.src.get("large", photo.src.get("original"))
            
            success = await download_image_from_url(image_url, file_path)
            if success:
                relative_path = f"images/{folder_path}/{filename}"
                downloaded_paths.append(relative_path)
        
        # Update category in database
        if downloaded_paths:
            update_stmt = (
                update(ServiceCategory)
                .where(ServiceCategory.id == category_id)
                .values(image_paths=downloaded_paths)
            )
            await db.execute(update_stmt)
            await db.commit()
        
        return BaseResponse(
            success=True,
            message=f"Downloaded {len(downloaded_paths)} images for category {request.category_name}",
            data=downloaded_paths
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Category image download failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Category image download failed: {str(e)}"
        )


@router.post("/services/bulk-download")
async def bulk_download_service_images(
    request: BulkDownloadRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Bulk download images for all services."""
    try:
        # Get all active services
        services_query = select(Service).where(Service.is_active == True)
        result = await db.execute(services_query)
        services = result.scalars().all()
        
        success_count = 0
        failed_count = 0
        results = []
        
        for service in services:
            try:
                # Get category for folder structure
                category_query = select(ServiceCategory).where(ServiceCategory.id == service.category_id)
                cat_result = await db.execute(category_query)
                category = cat_result.scalar_one_or_none()
                
                if not category:
                    failed_count += 1
                    results.append({
                        "serviceId": str(service.id),
                        "serviceName": service.name,
                        "images": [],
                        "success": False
                    })
                    continue
                
                # Download images for this service
                service_request = ServiceImageDownloadRequest(
                    service_id=str(service.id),
                    service_name=service.name,
                    category_id=str(category.id),
                    image_count=request.image_count
                )
                
                # Get search queries for this service
                search_queries = SERVICE_SEARCH_QUERIES.get(str(service.id), [service.name])
                if not search_queries:
                    search_queries = [service.name]
                
                import random
                query = random.choice(search_queries)
                
                # Search and download
                pexels_result = await search_pexels_images(query, request.image_count)
                if pexels_result and pexels_result.photos:
                    downloaded_paths = []
                    folder_path = f"services/{category.id}/{service.id}"
                    
                    for i, photo in enumerate(pexels_result.photos[:request.image_count]):
                        filename = generate_image_filename(str(service.id), i, photo.photographer)
                        file_path = IMAGES_BASE_PATH / folder_path / filename
                        
                        image_url = photo.src.get("medium", photo.src.get("original"))
                        success = await download_image_from_url(image_url, file_path)
                        
                        if success:
                            relative_path = f"images/{folder_path}/{filename}"
                            downloaded_paths.append(relative_path)
                    
                    # Update service in database
                    if downloaded_paths:
                        update_stmt = (
                            update(Service)
                            .where(Service.id == service.id)
                            .values(image_paths=downloaded_paths)
                        )
                        await db.execute(update_stmt)
                    
                    success_count += 1
                    results.append({
                        "serviceId": str(service.id),
                        "serviceName": service.name,
                        "images": downloaded_paths,
                        "success": True
                    })
                else:
                    failed_count += 1
                    results.append({
                        "serviceId": str(service.id),
                        "serviceName": service.name,
                        "images": [],
                        "success": False
                    })
                
                # Add small delay to avoid rate limiting
                await asyncio.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Failed to download images for service {service.name}: {e}")
                failed_count += 1
                results.append({
                    "serviceId": str(service.id),
                    "serviceName": service.name,
                    "images": [],
                    "success": False
                })
        
        # Commit all database changes
        await db.commit()
        
        return BaseResponse(
            success=True,
            message=f"Bulk download completed: {success_count} succeeded, {failed_count} failed",
            data={
                "success": success_count,
                "failed": failed_count,
                "results": results
            }
        )
        
    except Exception as e:
        logger.error(f"Bulk service image download failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bulk service image download failed: {str(e)}"
        )


@router.post("/categories/bulk-download")
async def bulk_download_category_images(
    request: BulkDownloadRequest,
    current_user: User = Depends(get_current_admin_user),
    db: AsyncSession = Depends(get_db_session)
):
    """Bulk download images for all categories."""
    try:
        # Get all active categories
        categories_query = select(ServiceCategory).where(ServiceCategory.is_active == True)
        result = await db.execute(categories_query)
        categories = result.scalars().all()
        
        success_count = 0
        failed_count = 0
        results = []
        
        for category in categories:
            try:
                # Get search queries for this category
                search_queries = CATEGORY_SEARCH_QUERIES.get(str(category.id), [category.name])
                
                import random
                query = random.choice(search_queries)
                
                # Search and download
                pexels_result = await search_pexels_images(query, request.image_count)
                if pexels_result and pexels_result.photos:
                    downloaded_paths = []
                    folder_path = f"categories/{category.id}"
                    
                    for i, photo in enumerate(pexels_result.photos[:request.image_count]):
                        filename = generate_image_filename(str(category.id), i, photo.photographer)
                        file_path = IMAGES_BASE_PATH / folder_path / filename
                        
                        image_url = photo.src.get("large", photo.src.get("original"))
                        success = await download_image_from_url(image_url, file_path)
                        
                        if success:
                            relative_path = f"images/{folder_path}/{filename}"
                            downloaded_paths.append(relative_path)
                    
                    # Update category in database
                    if downloaded_paths:
                        update_stmt = (
                            update(ServiceCategory)
                            .where(ServiceCategory.id == category.id)
                            .values(image_paths=downloaded_paths)
                        )
                        await db.execute(update_stmt)
                    
                    success_count += 1
                    results.append({
                        "categoryId": str(category.id),
                        "categoryName": category.name,
                        "images": downloaded_paths,
                        "success": True
                    })
                else:
                    failed_count += 1
                    results.append({
                        "categoryId": str(category.id),
                        "categoryName": category.name,
                        "images": [],
                        "success": False
                    })
                
                # Add small delay to avoid rate limiting
                await asyncio.sleep(0.5)
                
            except Exception as e:
                logger.error(f"Failed to download images for category {category.name}: {e}")
                failed_count += 1
                results.append({
                    "categoryId": str(category.id),
                    "categoryName": category.name,
                    "images": [],
                    "success": False
                })
        
        # Commit all database changes
        await db.commit()
        
        return BaseResponse(
            success=True,
            message=f"Category bulk download completed: {success_count} succeeded, {failed_count} failed",
            data={
                "success": success_count,
                "failed": failed_count,
                "results": results
            }
        )
        
    except Exception as e:
        logger.error(f"Bulk category image download failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Bulk category image download failed: {str(e)}"
        )


# Image serving route

@router.get("/{file_path:path}")
async def serve_image(file_path: str):
    """Serve images from local storage."""
    try:
        # Construct full file path
        full_path = IMAGES_BASE_PATH / file_path
        
        # Check if file exists and is within allowed directory
        if not full_path.exists() or not full_path.is_file():
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Image not found"
            )
        
        # Security check: ensure path is within images directory
        if not str(full_path.resolve()).startswith(str(IMAGES_BASE_PATH.resolve())):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied"
            )
        
        return FileResponse(full_path)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error serving image {file_path}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error serving image"
        )