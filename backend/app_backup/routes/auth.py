"""
Authentication routes for user registration, login, and profile management.
"""

from datetime import datetime, timedelta
from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..core.dependencies import get_current_user, get_optional_current_user
from ..core.logging import get_logger
from ..core.security import (
    create_access_token,
    create_refresh_token,
    generate_email_verification_token,
    generate_password_reset_token,
    get_password_hash,
    validate_password_strength,
    verify_email_verification_token,
    verify_password,
    verify_password_reset_token,
    verify_token,
)
from ..database.connection import get_db_session
from ..models.user import RefreshToken, User
from ..schemas.auth import (
    ChangePasswordRequest,
    EmailVerificationRequest,
    ForgotPasswordRequest,
    LoginRequest,
    LoginResponse,
    RefreshTokenRequest,
    RefreshTokenResponse,
    RegisterRequest,
    ResetPasswordRequest,
    UpdateProfileRequest,
    UserResponse,
)
from ..schemas.base import BaseResponse, SuccessResponse

logger = get_logger(__name__)

router = APIRouter(prefix="/auth")


@router.post("/register", response_model=BaseResponse[LoginResponse])
async def register_user(
    user_data: RegisterRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Register a new user account.
    
    Creates a new user account with the provided information and returns
    authentication tokens for immediate login.
    
    Args:
        user_data: User registration information
        db: Database session
        
    Returns:
        BaseResponse containing user info and authentication tokens
        
    Raises:
        HTTPException: 409 if email already exists
        HTTPException: 400 if password is weak
    """
    logger.info("User registration attempt", email=user_data.email, role=user_data.role)
    
    try:
        # Check if user already exists
        existing_user = await db.scalar(
            select(User).filter(User.email == user_data.email)
        )
        if existing_user:
            logger.warning("Registration attempt with existing email", email=user_data.email)
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User with this email already exists"
            )
        
        # Validate password strength
        password_validation = validate_password_strength(user_data.password)
        if not password_validation["is_valid"]:
            logger.warning("Registration with weak password", email=user_data.email)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Password does not meet security requirements",
                    "errors": password_validation["errors"],
                    "requirements": password_validation["requirements"]
                }
            )
        
        # Hash password
        password_hash = get_password_hash(user_data.password)
        
        # Create user
        user = User(
            email=user_data.email,
            password_hash=password_hash,
            first_name=user_data.first_name,
            last_name=user_data.last_name,
            phone=user_data.phone,
            role=user_data.role,
            is_active=True,
            is_verified=False,  # Require email verification
            profile_completed=True,  # Mark as completed since all required fields are provided
        )
        
        db.add(user)
        await db.commit()
        await db.refresh(user)
        
        logger.info("User registered successfully", user_id=str(user.id), email=user.email)
        
        # Generate tokens
        access_token = create_access_token(str(user.id))
        refresh_token_str = create_refresh_token(str(user.id))
        
        # Store refresh token
        refresh_token = RefreshToken(
            token=refresh_token_str,
            user_id=user.id,
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        db.add(refresh_token)
        await db.commit()
        
        # Prepare response - avoid async property access issues
        user_dict = {
            "id": str(user.id),
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "phone": user.phone,
            "role": user.role,
            "isActive": user.is_active,
            "isVerified": user.is_verified,
            "profileCompleted": user.profile_completed,
            "createdAt": user.created_at.isoformat() if user.created_at else None,
            "updatedAt": user.updated_at.isoformat() if user.updated_at else None,
        }
        
        login_response = LoginResponse(
            user=UserResponse(**user_dict),
            accessToken=access_token,
            refreshToken=refresh_token_str,
            tokenType="bearer",
            expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
        
        return BaseResponse(
            success=True,
            message="User registered successfully",
            data=login_response
        )
        
    except HTTPException:
        await db.rollback()
        raise
    except Exception as e:
        logger.error("User registration failed", email=user_data.email, error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed. Please try again."
        )


@router.post("/login", response_model=BaseResponse[LoginResponse])
async def login_user(
    credentials: LoginRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Authenticate user and return access tokens.
    
    Args:
        credentials: User login credentials
        db: Database session
        
    Returns:
        BaseResponse containing user info and authentication tokens
        
    Raises:
        HTTPException: 401 if credentials are invalid
        HTTPException: 423 if account is locked
    """
    logger.info("Login attempt", email=credentials.email)
    
    try:
        # Find user by email
        user = await db.scalar(
            select(User).filter(User.email == credentials.email)
        )
        if not user:
            logger.warning("Login attempt with non-existent email", email=credentials.email)
            # Don't reveal that email doesn't exist
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if account is locked
        if user.locked_until and user.locked_until > datetime.utcnow():
            logger.warning("Login attempt on locked account", user_id=str(user.id))
            raise HTTPException(
                status_code=status.HTTP_423_LOCKED,
                detail="Account is temporarily locked due to multiple failed login attempts"
            )
        
        # Verify password
        if not verify_password(credentials.password, user.password_hash):
            logger.warning("Failed login attempt", user_id=str(user.id))
            
            # Update failed login attempts
            user.failed_login_attempts += 1
            if user.failed_login_attempts >= 5:  # Lock after 5 failed attempts
                user.locked_until = datetime.utcnow() + timedelta(minutes=30)
                logger.warning("Account locked due to multiple failed attempts", user_id=str(user.id))
            
            await db.commit()
            
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Check if user is active
        if not user.is_active:
            logger.warning("Login attempt on inactive account", user_id=str(user.id))
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Account is deactivated"
            )
        
        # Prepare response data BEFORE any commits to avoid session issues
        user_dict = {
            "id": str(user.id),
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "phone": user.phone,
            "role": user.role,
            "isActive": user.is_active,
            "isVerified": user.is_verified,
            "profileCompleted": user.profile_completed,
            "createdAt": user.created_at.isoformat() if user.created_at else None,
            "updatedAt": user.updated_at.isoformat() if user.updated_at else None,
        }
        
        # Record successful login
        user.last_login = datetime.utcnow()
        user.failed_login_attempts = 0
        user.locked_until = None
        await db.commit()
        
        logger.info("User logged in successfully", user_id=str(user.id))
        
        # Generate tokens
        access_token = create_access_token(str(user.id))
        refresh_token_str = create_refresh_token(str(user.id))
        
        # Store refresh token
        refresh_token = RefreshToken(
            token=refresh_token_str,
            user_id=user.id,
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        db.add(refresh_token)
        await db.commit()
        
        login_response = LoginResponse(
            user=UserResponse(**user_dict),
            accessToken=access_token,
            refreshToken=refresh_token_str,
            tokenType="bearer",
            expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
        
        return BaseResponse(
            success=True,
            message="Login successful",
            data=login_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Login failed", email=credentials.email, error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed. Please try again."
        )


@router.post("/refresh", response_model=BaseResponse[RefreshTokenResponse])
async def refresh_access_token(
    refresh_request: RefreshTokenRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Refresh access token using refresh token.
    
    Args:
        refresh_request: Refresh token request
        db: Database session
        
    Returns:
        BaseResponse containing new tokens
        
    Raises:
        HTTPException: 401 if refresh token is invalid
    """
    logger.debug("Token refresh attempt")
    
    try:
        # Verify refresh token
        payload = verify_token(refresh_request.refresh_token, token_type="refresh")
        if not payload:
            logger.warning("Invalid refresh token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        user_id = payload.get("sub")
        
        # Find refresh token in database
        stored_token = await db.scalar(
            select(RefreshToken).filter(
                and_(
                    RefreshToken.token == refresh_request.refresh_token,
                    RefreshToken.user_id == UUID(user_id)
                )
            )
        )
        
        if not stored_token or stored_token.expires_at <= datetime.utcnow():
            logger.warning("Refresh token not found or expired", user_id=user_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token"
            )
        
        # Get user
        user = await db.get(User, UUID(user_id))
        if not user or not user.is_active:
            logger.warning("User not found or inactive", user_id=user_id)
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or account deactivated"
            )
        
        # Revoke old refresh token
        await db.delete(stored_token)
        
        # Generate new tokens
        new_access_token = create_access_token(user_id)
        new_refresh_token = create_refresh_token(user_id)
        
        # Store new refresh token
        new_token_record = RefreshToken(
            token=new_refresh_token,
            user_id=UUID(user_id),
            expires_at=datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS),
        )
        db.add(new_token_record)
        await db.commit()
        
        logger.info("Tokens refreshed successfully", user_id=user_id)
        
        response = RefreshTokenResponse(
            accessToken=new_access_token,
            refreshToken=new_refresh_token,
            tokenType="bearer",
            expiresIn=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
        )
        
        return BaseResponse(
            success=True,
            message="Tokens refreshed successfully",
            data=response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Token refresh failed", error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )


@router.post("/logout", response_model=SuccessResponse)
async def logout_user(
    refresh_request: Optional[RefreshTokenRequest] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Logout user and revoke refresh tokens.
    
    Args:
        refresh_request: Optional refresh token to revoke specifically
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        SuccessResponse
    """
    logger.info("User logout", user_id=str(current_user.id))
    
    try:
        if refresh_request:
            # Revoke specific refresh token
            stored_token = await db.scalar(
                select(RefreshToken).filter(
                    and_(
                        RefreshToken.token == refresh_request.refresh_token,
                        RefreshToken.user_id == current_user.id
                    )
                )
            )
            if stored_token:
                await db.delete(stored_token)
        else:
            # Revoke all refresh tokens for the user
            tokens = await db.scalars(
                select(RefreshToken).filter(RefreshToken.user_id == current_user.id)
            )
            for token in tokens:
                await db.delete(token)
        
        await db.commit()
        logger.info("User logged out successfully", user_id=str(current_user.id))
        
        return SuccessResponse(message="Logged out successfully")
        
    except Exception as e:
        logger.error("Logout failed", user_id=str(current_user.id), error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )


@router.get("/profile", response_model=BaseResponse[UserResponse])
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Get current user profile information.
    
    Args:
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        BaseResponse containing user profile
    """
    logger.debug("Profile request", user_id=str(current_user.id))
    
    try:
        # Refresh user data from database
        user = await db.get(User, current_user.id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        user_dict = {
            "id": str(user.id),
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "phone": user.phone,
            "role": user.role,
            "isActive": user.is_active,
            "isVerified": user.is_verified,
            "profileCompleted": user.profile_completed,
            "createdAt": user.created_at.isoformat() if user.created_at else None,
            "updatedAt": user.updated_at.isoformat() if user.updated_at else None,
        }
        
        return BaseResponse(
            success=True,
            message="Profile retrieved successfully",
            data=UserResponse(**user_dict)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Get profile failed", user_id=str(current_user.id), error=str(e))
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to retrieve profile"
        )


@router.patch("/profile", response_model=BaseResponse[UserResponse])
async def update_user_profile(
    profile_updates: UpdateProfileRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Update user profile information.
    
    Args:
        profile_updates: Profile update data
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        BaseResponse containing updated user profile
    """
    logger.info("Profile update", user_id=str(current_user.id))
    
    try:
        # Get fresh user data
        user = await db.get(User, current_user.id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Update fields if provided
        update_needed = False
        if profile_updates.first_name is not None:
            user.first_name = profile_updates.first_name
            update_needed = True
        if profile_updates.last_name is not None:
            user.last_name = profile_updates.last_name
            update_needed = True
        if profile_updates.phone is not None:
            user.phone = profile_updates.phone
            update_needed = True
        
        if update_needed:
            user.updated_at = datetime.utcnow()
            await db.commit()
            await db.refresh(user)
        
        logger.info("Profile updated successfully", user_id=str(user.id))
        
        user_dict = {
            "id": str(user.id),
            "email": user.email,
            "firstName": user.first_name,
            "lastName": user.last_name,
            "phone": user.phone,
            "role": user.role,
            "isActive": user.is_active,
            "isVerified": user.is_verified,
            "profileCompleted": user.profile_completed,
            "createdAt": user.created_at.isoformat() if user.created_at else None,
            "updatedAt": user.updated_at.isoformat() if user.updated_at else None,
        }
        
        return BaseResponse(
            success=True,
            message="Profile updated successfully",
            data=UserResponse(**user_dict)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Profile update failed", user_id=str(current_user.id), error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Profile update failed"
        )


@router.post("/change-password", response_model=SuccessResponse)
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db_session)
):
    """
    Change user password.
    
    Args:
        password_data: Password change data
        current_user: Currently authenticated user
        db: Database session
        
    Returns:
        SuccessResponse
        
    Raises:
        HTTPException: 400 if current password is incorrect or new password is weak
    """
    logger.info("Password change request", user_id=str(current_user.id))
    
    try:
        # Get fresh user data
        user = await db.get(User, current_user.id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Verify current password
        if not verify_password(password_data.current_password, user.password_hash):
            logger.warning("Incorrect current password", user_id=str(user.id))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Validate new password strength
        password_validation = validate_password_strength(password_data.new_password)
        if not password_validation["is_valid"]:
            logger.warning("Weak new password", user_id=str(user.id))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "New password does not meet security requirements",
                    "errors": password_validation["errors"],
                    "requirements": password_validation["requirements"]
                }
            )
        
        # Update password
        new_password_hash = get_password_hash(password_data.new_password)
        user.password_hash = new_password_hash
        user.updated_at = datetime.utcnow()
        
        # Revoke all refresh tokens to force re-login on other devices
        tokens = await db.scalars(
            select(RefreshToken).filter(RefreshToken.user_id == user.id)
        )
        for token in tokens:
            await db.delete(token)
        
        await db.commit()
        
        logger.info("Password changed successfully", user_id=str(user.id))
        
        return SuccessResponse(message="Password changed successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Password change failed", user_id=str(current_user.id), error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password change failed"
        )


@router.post("/forgot-password", response_model=SuccessResponse)
async def forgot_password(
    request: ForgotPasswordRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Request password reset email.
    
    Args:
        request: Forgot password request
        db: Database session
        
    Returns:
        SuccessResponse (always returns success for security)
    """
    logger.info("Password reset request", email=request.email)
    
    try:
        # Find user (but don't reveal if email exists)
        user = await db.scalar(
            select(User).filter(User.email == request.email)
        )
        
        if user and user.is_active:
            # Generate password reset token
            reset_token = generate_password_reset_token(user.email)
            
            # TODO: Send email with reset token
            # For now, just log it (remove in production)
            logger.info("Password reset token generated", 
                       user_id=str(user.id), 
                       token=reset_token[:20] + "...")
            
            # In production, send email:
            # await send_password_reset_email(user.email, reset_token)
        
        # Always return success (don't reveal if email exists)
        return SuccessResponse(
            message="If an account with that email exists, a password reset link has been sent"
        )
        
    except Exception as e:
        logger.error("Forgot password failed", email=request.email, error=str(e))
        # Still return success for security
        return SuccessResponse(
            message="If an account with that email exists, a password reset link has been sent"
        )


@router.post("/reset-password", response_model=SuccessResponse) 
async def reset_password(
    request: ResetPasswordRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Reset password using reset token.
    
    Args:
        request: Password reset request
        db: Database session
        
    Returns:
        SuccessResponse
        
    Raises:
        HTTPException: 400 if token is invalid or password is weak
    """
    logger.info("Password reset attempt")
    
    try:
        # Verify reset token
        email = verify_password_reset_token(request.token)
        if not email:
            logger.warning("Invalid password reset token")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired reset token"
            )
        
        # Find user
        user = await db.scalar(
            select(User).filter(User.email == email)
        )
        if not user or not user.is_active:
            logger.warning("Password reset for non-existent/inactive user", email=email)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid reset token"
            )
        
        # Validate new password
        password_validation = validate_password_strength(request.password)
        if not password_validation["is_valid"]:
            logger.warning("Weak password in reset", user_id=str(user.id))
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Password does not meet security requirements",
                    "errors": password_validation["errors"],
                    "requirements": password_validation["requirements"]
                }
            )
        
        # Update password
        new_password_hash = get_password_hash(request.password)
        user.password_hash = new_password_hash
        user.failed_login_attempts = 0
        user.locked_until = None
        user.updated_at = datetime.utcnow()
        
        # Revoke all refresh tokens
        tokens = await db.scalars(
            select(RefreshToken).filter(RefreshToken.user_id == user.id)
        )
        for token in tokens:
            await db.delete(token)
        
        await db.commit()
        
        logger.info("Password reset successfully", user_id=str(user.id))
        
        return SuccessResponse(message="Password reset successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Password reset failed", error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password reset failed"
        )


@router.post("/verify-email", response_model=SuccessResponse)
async def verify_email(
    request: EmailVerificationRequest,
    db: AsyncSession = Depends(get_db_session)
):
    """
    Verify user email address.
    
    Args:
        request: Email verification request
        db: Database session
        
    Returns:
        SuccessResponse
        
    Raises:
        HTTPException: 400 if token is invalid
    """
    logger.info("Email verification attempt")
    
    try:
        # Verify email token
        email = verify_email_verification_token(request.token)
        if not email:
            logger.warning("Invalid email verification token")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired verification token"
            )
        
        # Find and update user
        user = await db.scalar(
            select(User).filter(User.email == email)
        )
        if not user:
            logger.warning("Email verification for non-existent user", email=email)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid verification token"
            )
        
        if user.is_verified:
            return SuccessResponse(message="Email already verified")
        
        user.is_verified = True
        user.updated_at = datetime.utcnow()
        await db.commit()
        
        logger.info("Email verified successfully", user_id=str(user.id))
        
        return SuccessResponse(message="Email verified successfully")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Email verification failed", error=str(e))
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Email verification failed"
        )


@router.post("/resend-verification", response_model=SuccessResponse)
async def resend_verification(
    current_user: User = Depends(get_current_user)
):
    """
    Resend email verification link.
    
    Args:
        current_user: Currently authenticated user
        
    Returns:
        SuccessResponse
    """
    logger.info("Resend verification request", user_id=str(current_user.id))
    
    if current_user.is_verified:
        return SuccessResponse(message="Email is already verified")
    
    # Generate verification token
    verification_token = generate_email_verification_token(current_user.email)
    
    # TODO: Send verification email
    # For now, just log it (remove in production)
    logger.info("Email verification token generated", 
               user_id=str(current_user.id), 
               token=verification_token[:20] + "...")
    
    # In production, send email:
    # await send_verification_email(current_user.email, verification_token)
    
    return SuccessResponse(message="Verification email sent")


@router.get("/me", response_model=BaseResponse[Optional[UserResponse]])
async def get_current_user_info(
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Get current user information (optional authentication).
    
    This endpoint can be called with or without authentication.
    If authenticated, returns user info. If not, returns None.
    
    Args:
        current_user: Optional current user
        
    Returns:
        BaseResponse with user info or None
    """
    if current_user:
        logger.debug("Authenticated user info request", user_id=str(current_user.id))
        
        user_dict = {
            "id": str(current_user.id),
            "email": current_user.email,
            "firstName": current_user.first_name,
            "lastName": current_user.last_name,
            "phone": current_user.phone,
            "role": current_user.role,
            "isActive": current_user.is_active,
            "isVerified": current_user.is_verified,
            "profileCompleted": current_user.profile_completed,
            "createdAt": current_user.created_at.isoformat() if current_user.created_at else None,
            "updatedAt": current_user.updated_at.isoformat() if current_user.updated_at else None,
        }
        
        return BaseResponse(
            success=True,
            message="User information retrieved",
            data=UserResponse(**user_dict)
        )
    else:
        logger.debug("Unauthenticated user info request")
        return BaseResponse(
            success=True,
            message="No authenticated user",
            data=None
        )