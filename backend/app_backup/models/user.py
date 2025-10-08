"""
User model for authentication and user management.
"""

from datetime import datetime, timedelta
from enum import Enum
from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import Boolean, DateTime, Integer, String, Text, ForeignKey, cast
from sqlalchemy.orm import Mapped, mapped_column, relationship, foreign
from sqlalchemy.dialects.postgresql import UUID as PG_UUID, JSONB

from .base import Base


class UserRole(str, Enum):
    """User role enumeration."""
    CUSTOMER = "customer"
    ADMIN = "admin"
    SERVICE_PROVIDER = "service_provider"


class User(Base):
    """
    User model for customer and admin authentication.
    
    Contains all user information including authentication details,
    profile information, and role-based access control.
    """
    
    __tablename__ = "users"
    
    # Authentication fields
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True
    )
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False
    )
    
    # Profile fields
    first_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    last_name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    phone: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True
    )
    
    # Role and status
    role: Mapped[UserRole] = mapped_column(
        String(20),
        nullable=False,
        default=UserRole.CUSTOMER,
        index=True
    )
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True
    )
    is_verified: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )
    
    # Authentication tracking
    last_login: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    failed_login_attempts: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    locked_until: Mapped[Optional[datetime]] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )
    
    # Profile completion
    profile_completed: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )
    
    # Avatar/profile image
    avatar_url: Mapped[Optional[str]] = mapped_column(
        String(500),
        nullable=True
    )
    
    # User preferences (JSON storage for flexible settings)
    preferences: Mapped[Optional[Dict]] = mapped_column(
        JSONB,
        nullable=True,
        default=lambda: {}
    )
    
    # Relationships
    addresses: Mapped[List["UserAddress"]] = relationship(
        "UserAddress",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select"
    )
    
    bookings: Mapped[List["Booking"]] = relationship(
        "Booking",
        back_populates="user",
        foreign_keys="Booking.user_id",
        lazy="select"
    )
    
    # orders: Mapped[List["Order"]] - Removed problematic relationship for now
    
    reviews: Mapped[List["Review"]] = relationship(
        "Review",
        back_populates="user",
        foreign_keys="Review.user_id",
        lazy="select"
    )
    
    refresh_tokens: Mapped[List["RefreshToken"]] = relationship(
        "RefreshToken",
        back_populates="user",
        cascade="all, delete-orphan",
        lazy="select"
    )
    
    @property
    def full_name(self) -> str:
        """Get user's full name."""
        return f"{self.first_name} {self.last_name}"
    
    @property
    def is_admin(self) -> bool:
        """Check if user is an admin."""
        return self.role == UserRole.ADMIN
    
    @property
    def is_customer(self) -> bool:
        """Check if user is a customer."""
        return self.role == UserRole.CUSTOMER
    
    @property
    def is_service_provider(self) -> bool:
        """Check if user is a service provider."""
        return self.role == UserRole.SERVICE_PROVIDER
    
    @property
    def is_locked(self) -> bool:
        """Check if user account is locked."""
        if self.locked_until is None:
            return False
        return datetime.utcnow() < self.locked_until
    
    def lock_account(self, duration_minutes: int = 30) -> None:
        """
        Lock user account for specified duration.
        
        Args:
            duration_minutes: Lock duration in minutes
        """
        self.locked_until = datetime.utcnow() + timedelta(minutes=duration_minutes)
        self.failed_login_attempts = 0
    
    def unlock_account(self) -> None:
        """Unlock user account."""
        self.locked_until = None
        self.failed_login_attempts = 0
    
    def record_login_attempt(self, success: bool) -> None:
        """
        Record login attempt and handle account locking.
        
        Args:
            success: Whether login was successful
        """
        if success:
            self.last_login = datetime.utcnow()
            self.failed_login_attempts = 0
            self.locked_until = None
        else:
            self.failed_login_attempts += 1
            
            # Lock account after 5 failed attempts
            if self.failed_login_attempts >= 5:
                self.lock_account(30)  # Lock for 30 minutes
    
    def verify_email(self) -> None:
        """Mark user email as verified."""
        self.is_verified = True
    
    def dict_for_response(self, exclude: set = None) -> Dict[str, any]:
        """
        Get user data safe for API responses.
        
        Returns:
            Dictionary with user data excluding sensitive fields
        """
        default_exclude = {'password_hash', 'failed_login_attempts', 'locked_until'}
        if exclude:
            default_exclude.update(exclude)
        
        data = self.to_dict(exclude=default_exclude)
        
        # Convert camelCase for frontend
        return {
            "id": data["id"],
            "email": data["email"],
            "firstName": data["first_name"],
            "lastName": data["last_name"],
            "phone": data["phone"],
            "role": data["role"],
            "isActive": data["is_active"],
            "isVerified": data["is_verified"],
            "profileCompleted": data["profile_completed"],
            "avatarUrl": data.get("avatar_url"),
            "lastLogin": data.get("last_login"),
            "createdAt": data["created_at"],
            "updatedAt": data["updated_at"],
        }


class UserAddress(Base):
    """
    User address model for delivery and service locations.
    
    Users can have multiple addresses for different purposes.
    """
    
    __tablename__ = "user_addresses"
    
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )
    
    # Address type
    type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        default="home"  # home, work, other
    )
    
    # Address details
    title: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    
    full_address: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    
    landmark: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True
    )
    
    # Location details
    city: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    
    state: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    
    postal_code: Mapped[str] = mapped_column(
        String(20),
        nullable=False
    )
    
    country: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        default="India"
    )
    
    # GPS coordinates (optional)
    latitude: Mapped[Optional[float]] = mapped_column(
        nullable=True
    )
    
    longitude: Mapped[Optional[float]] = mapped_column(
        nullable=True
    )
    
    # Status
    is_default: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False
    )
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="addresses"
    )
    
    def dict_for_response(self, exclude: set = None) -> Dict[str, any]:
        """Get address data for API responses."""
        data = self.to_dict(exclude=exclude)
        
        return {
            "id": data["id"],
            "type": data["type"],
            "title": data["title"],
            "fullAddress": data["full_address"],
            "landmark": data.get("landmark"),
            "city": data["city"],
            "state": data["state"],
            "postalCode": data["postal_code"],
            "country": data["country"],
            "latitude": data.get("latitude"),
            "longitude": data.get("longitude"),
            "isDefault": data["is_default"],
            "isActive": data["is_active"],
            "createdAt": data["created_at"],
            "updatedAt": data["updated_at"],
        }


class RefreshToken(Base):
    """
    Refresh token model for JWT token management.
    
    Stores refresh tokens to handle token rotation and revocation.
    """
    
    __tablename__ = "refresh_tokens"
    
    token: Mapped[str] = mapped_column(
        String(500),
        unique=True,
        nullable=False,
        index=True
    )
    
    user_id: Mapped[UUID] = mapped_column(
        ForeignKey("users.id"),
        nullable=False,
        index=True
    )
    
    expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True
    )
    
    is_revoked: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True
    )
    
    # Session tracking
    device_info: Mapped[Optional[str]] = mapped_column(
        String(200),
        nullable=True
    )
    
    ip_address: Mapped[Optional[str]] = mapped_column(
        String(45),  # IPv6 max length
        nullable=True
    )
    
    user_agent: Mapped[Optional[str]] = mapped_column(
        Text,
        nullable=True
    )
    
    # Relationships
    user: Mapped["User"] = relationship(
        "User",
        back_populates="refresh_tokens"
    )
    
    @property
    def is_expired(self) -> bool:
        """Check if token is expired."""
        return datetime.utcnow() > self.expires_at
    
    @property
    def is_valid(self) -> bool:
        """Check if token is valid (not expired and not revoked)."""
        return not self.is_expired and not self.is_revoked
    
    def revoke(self) -> None:
        """Revoke the refresh token."""
        self.is_revoked = True