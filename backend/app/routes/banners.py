"""
Banner API routes for frontend compatibility.

This module provides basic banner endpoints that the frontend expects
to prevent 404 errors. Returns empty arrays for now as banner functionality
is not fully implemented.
"""

from fastapi import APIRouter

router = APIRouter(prefix="/banners")


@router.get("/position/hero")
async def get_hero_banners():
    """Get hero banners for homepage."""
    return {
        "success": True,
        "data": [],
        "message": "Hero banners retrieved successfully"
    }


@router.get("/position/secondary") 
async def get_secondary_banners():
    """Get secondary banners for homepage."""
    return {
        "success": True,
        "data": [],
        "message": "Secondary banners retrieved successfully"
    }


@router.get("/position/promotional")
async def get_promotional_banners():
    """Get promotional banners for homepage."""
    return {
        "success": True,
        "data": [],
        "message": "Promotional banners retrieved successfully"
    }