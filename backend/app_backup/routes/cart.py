"""
Cart management routes for shopping cart and coupon operations.
"""

from datetime import datetime
from typing import List, Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, func
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.dependencies import get_current_user, get_optional_current_user
from ..core.logging import get_logger
from ..database.connection import get_db_session
from ..models.coupon import Coupon, CouponUsage, CouponType
from ..models.user import User
from ..schemas.base import BaseResponse, SuccessResponse

logger = get_logger(__name__)

router = APIRouter(prefix="/cart")


@router.get("", response_model=BaseResponse)
async def get_cart(
    current_user: Optional[User] = Depends(get_optional_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get user's cart.
    
    Args:
        current_user: Current authenticated user (optional for guest carts)
        db: Database session
        
    Returns:
        BaseResponse with cart data
    """
    # For now, return an empty cart structure
    # TODO: Implement proper cart storage and retrieval
    cart_data = {
        "items": [],
        "totalItems": 0,
        "subtotal": 0,
        "tax": 0,
        "total": 0,
        "appliedCoupons": []
    }
    
    logger.info("Getting cart", user_id=str(current_user.id) if current_user else "guest")
    
    return BaseResponse(
        success=True,
        message="Cart retrieved successfully",
        data=cart_data
    )


@router.post("/coupon", response_model=BaseResponse)
async def apply_coupon_to_cart(
    request_data: dict,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Apply a coupon to the user's cart.
    
    Args:
        request_data: Dictionary containing couponCode
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        BaseResponse with coupon application result
    """
    coupon_code = request_data.get("couponCode")
    
    if not coupon_code:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Coupon code is required"
        )
    
    logger.info("Applying coupon to cart", user_id=str(current_user.id), coupon_code=coupon_code)
    
    try:
        # Find coupon by code
        coupon = await db.scalar(
            db.query(Coupon).filter(Coupon.code == coupon_code)
        )
        
        if not coupon:
            return BaseResponse(
                success=False,
                message="Coupon code not found",
                error="Invalid coupon code"
            )
        
        # Check if coupon is active
        if not coupon.is_active:
            return BaseResponse(
                success=False,
                message="Coupon is not active",
                error="This coupon is currently inactive"
            )
        
        # Check validity period
        current_time = datetime.utcnow()
        if current_time < coupon.valid_from:
            return BaseResponse(
                success=False,
                message="Coupon is not yet valid",
                error="This coupon is not yet available for use"
            )
        
        if current_time > coupon.valid_until:
            return BaseResponse(
                success=False,
                message="Coupon has expired",
                error="This coupon has expired"
            )
        
        # Check usage limit
        if coupon.used_count >= coupon.usage_limit:
            return BaseResponse(
                success=False,
                message="Coupon usage limit exceeded",
                error="This coupon has reached its usage limit"
            )
        
        # Check per-user usage limit
        user_usage = await db.scalar(
            func.count(CouponUsage.id).filter(
                and_(
                    CouponUsage.coupon_id == coupon.id,
                    CouponUsage.user_id == current_user.id
                )
            )
        )
        
        if user_usage >= coupon.per_user_limit:
            return BaseResponse(
                success=False,
                message="You have already used this coupon maximum times",
                error="Personal usage limit exceeded"
            )
        
        # For now, we'll return success without actually applying to cart
        # In a full implementation, you would:
        # 1. Get user's current cart from database
        # 2. Validate coupon against cart contents
        # 3. Calculate discount amount
        # 4. Store applied coupon in cart record
        
        # Calculate a sample discount (this should be based on actual cart)
        discount_amount = 50.0  # This would be calculated based on cart contents
        
        return BaseResponse(
            success=True,
            message="Coupon applied successfully",
            data={
                "message": f"Coupon '{coupon_code}' applied! You save ₹{discount_amount}",
                "discountAmount": discount_amount,
                "coupon": {
                    "code": coupon.code,
                    "name": coupon.name,
                    "type": coupon.type.value,
                    "value": coupon.value
                }
            }
        )
        
    except Exception as e:
        logger.error("Apply coupon failed", user_id=str(current_user.id), coupon_code=coupon_code, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to apply coupon"
        )


@router.delete("/coupon", response_model=SuccessResponse)
async def remove_coupon_from_cart(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Remove applied coupon from the user's cart.
    
    Args:
        current_user: Current authenticated user
        db: Database session
        
    Returns:
        SuccessResponse indicating coupon removal
    """
    logger.info("Removing coupon from cart", user_id=str(current_user.id))
    
    try:
        # For now, we'll just return success
        # In a full implementation, you would:
        # 1. Get user's current cart from database  
        # 2. Remove any applied coupon from cart record
        # 3. Recalculate cart totals without discount
        
        return SuccessResponse(
            success=True,
            message="Coupon removed successfully"
        )
        
    except Exception as e:
        logger.error("Remove coupon failed", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove coupon"
        )