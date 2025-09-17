"""
FastAPI dependencies for authentication and authorization.
"""

from typing import Optional
from uuid import UUID, uuid4, uuid5, NAMESPACE_DNS
from datetime import datetime

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from ..core.config import settings
from ..core.logging import get_logger
from ..core.security import verify_token
from ..database.connection import get_db_session
from ..models.user import User, UserRole

logger = get_logger(__name__)

# HTTP Bearer token extractor
security = HTTPBearer(auto_error=False)


class AuthenticationError(HTTPException):
    """Custom authentication error."""
    
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"},
        )


class AuthorizationError(HTTPException):
    """Custom authorization error."""
    
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail,
        )


async def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db_session)
) -> User:
    """
    Get current authenticated user from JWT token.
    
    Args:
        credentials: HTTP Bearer credentials from request header
        db: Database session
        
    Returns:
        User: Current authenticated user
        
    Raises:
        AuthenticationError: If token is invalid or user not found
    """
    if not credentials:
        logger.warning("No authorization credentials provided")
        raise AuthenticationError("Authorization header missing")
    
    token = credentials.credentials
    
    # Verify JWT token
    payload = verify_token(token, token_type="access")
    if not payload:
        logger.warning("Invalid or expired token")
        raise AuthenticationError("Invalid or expired token")
    
    # Get user ID from token
    user_id = payload.get("sub")
    if not user_id:
        logger.warning("Token missing user ID")
        raise AuthenticationError("Invalid token payload")
    
    # Handle mock users in development mode
    if settings.is_development and (user_id.startswith("customer-") or user_id.startswith("admin-")):
        logger.info("Creating mock user for development", user_id=user_id)
        
        # Create mock user object
        user = User()
        # Generate deterministic UUID based on user_id to ensure consistency across requests
        user.id = uuid5(NAMESPACE_DNS, f"mockuser.{user_id}")
        user.email = f"{user_id}@test.com"
        user.first_name = "Test" if user_id.startswith("customer-") else "Admin"
        user.last_name = "User"
        user.phone = "9876543210"
        user.role = UserRole.CUSTOMER if user_id.startswith("customer-") else UserRole.ADMIN
        user.is_active = True
        user.is_verified = True
        user.profile_completed = True
        user.failed_login_attempts = 0
        user.locked_until = None
        user.created_at = datetime.utcnow()
        user.updated_at = datetime.utcnow()
        
        logger.debug("Mock user created successfully", user_id=user_id, role=user.role)
    else:
        # Get real user from database
        try:
            user = await db.get(User, UUID(user_id))
        except Exception as e:
            logger.error("Database error fetching user", user_id=user_id, error=str(e))
            raise AuthenticationError("Authentication failed")
        
        if not user:
            logger.warning("User not found", user_id=user_id)
            raise AuthenticationError("User not found")
    
    # Check if user is active
    if not user.is_active:
        logger.warning("Inactive user attempted access", user_id=user_id)
        raise AuthenticationError("Account is deactivated")
    
    # Check if account is locked
    if user.is_locked:
        logger.warning("Locked user attempted access", user_id=user_id)
        raise AuthenticationError("Account is temporarily locked")
    
    logger.debug("User authenticated successfully", user_id=user_id, role=user.role)
    return user


async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current active user (alias for get_current_user for clarity).
    
    Args:
        current_user: Current user from authentication
        
    Returns:
        User: Current active user
    """
    return current_user


async def get_current_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current user with admin role verification.
    
    Args:
        current_user: Current user from authentication
        
    Returns:
        User: Current admin user
        
    Raises:
        AuthorizationError: If user is not an admin
    """
    if not current_user.is_admin:
        logger.warning("Non-admin user attempted admin access", user_id=str(current_user.id))
        raise AuthorizationError("Admin access required")
    
    logger.debug("Admin user verified", user_id=str(current_user.id))
    return current_user


async def get_current_customer_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """
    Get current user with customer role verification.
    
    Args:
        current_user: Current user from authentication
        
    Returns:
        User: Current customer user
        
    Raises:
        AuthorizationError: If user is not a customer
    """
    if not current_user.is_customer:
        logger.warning("Non-customer user attempted customer access", user_id=str(current_user.id))
        raise AuthorizationError("Customer access required")
    
    logger.debug("Customer user verified", user_id=str(current_user.id))
    return current_user


def require_roles(*allowed_roles: UserRole):
    """
    Dependency factory for role-based access control.
    
    Args:
        allowed_roles: Roles that are allowed to access the endpoint
        
    Returns:
        Dependency function that checks user role
    """
    async def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in allowed_roles:
            logger.warning(
                "User with insufficient role attempted access",
                user_id=str(current_user.id),
                user_role=current_user.role,
                required_roles=[role.value for role in allowed_roles]
            )
            raise AuthorizationError(
                f"Access denied. Required roles: {[role.value for role in allowed_roles]}"
            )
        
        logger.debug(
            "User role verified",
            user_id=str(current_user.id),
            role=current_user.role
        )
        return current_user
    
    return role_checker


def require_user_or_admin(user_id_field: str = "user_id"):
    """
    Dependency factory to allow access to resource owner or admin.
    
    This is useful for endpoints where users can access their own resources
    or admins can access any resource.
    
    Args:
        user_id_field: Name of the field containing the user ID to check
        
    Returns:
        Dependency function that checks ownership or admin role
    """
    async def ownership_checker(
        request_user_id: str,
        current_user: User = Depends(get_current_user)
    ) -> User:
        # Admin can access any resource
        if current_user.is_admin:
            logger.debug("Admin access granted", admin_id=str(current_user.id))
            return current_user
        
        # User can access their own resource
        if str(current_user.id) == request_user_id:
            logger.debug("Owner access granted", user_id=str(current_user.id))
            return current_user
        
        # Access denied
        logger.warning(
            "User attempted to access another user's resource",
            current_user_id=str(current_user.id),
            requested_user_id=request_user_id
        )
        raise AuthorizationError("You can only access your own resources")
    
    return ownership_checker


async def get_optional_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: AsyncSession = Depends(get_db_session)
) -> Optional[User]:
    """
    Get current user if authenticated, None otherwise.
    
    This is useful for endpoints that behave differently for authenticated
    vs unauthenticated users but don't require authentication.
    
    Args:
        credentials: HTTP Bearer credentials from request header
        db: Database session
        
    Returns:
        User or None: Current user if authenticated, None otherwise
    """
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except AuthenticationError:
        logger.debug("Optional authentication failed, continuing without user")
        return None


class AuthContext:
    """
    Authentication context for storing user information in request state.
    
    This can be used to access current user information throughout the
    request lifecycle without passing it explicitly.
    """
    
    def __init__(self):
        self.current_user: Optional[User] = None
        self.is_authenticated: bool = False
        self.is_admin: bool = False
        self.is_customer: bool = False
    
    def set_user(self, user: User) -> None:
        """Set the current user in context."""
        self.current_user = user
        self.is_authenticated = True
        self.is_admin = user.is_admin
        self.is_customer = user.is_customer
    
    def clear(self) -> None:
        """Clear the authentication context."""
        self.current_user = None
        self.is_authenticated = False
        self.is_admin = False
        self.is_customer = False


# Global auth context (can be overridden with dependency injection)
auth_context = AuthContext()


async def get_auth_context() -> AuthContext:
    """
    Get the current authentication context.
    
    Returns:
        AuthContext: Current authentication context
    """
    return auth_context