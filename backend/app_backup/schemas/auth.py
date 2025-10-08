"""
Authentication schemas for login, registration, and user management.
"""

from typing import Optional

from pydantic import BaseModel, EmailStr, Field, validator

from ..models.user import UserRole


class LoginRequest(BaseModel):
    """
    Schema for user login requests.
    """
    
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="User password")
    
    @validator("email")
    def validate_email_lowercase(cls, v):
        """Ensure email is lowercase."""
        return v.lower()
    
    class Config:
        """Pydantic configuration."""
        
        schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "securepassword123"
            }
        }


class RegisterRequest(BaseModel):
    """
    Schema for user registration requests.
    """
    
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=8, description="User password")
    first_name: str = Field(..., min_length=1, max_length=100, description="User first name")
    last_name: str = Field(..., min_length=1, max_length=100, description="User last name")
    phone: str = Field(..., min_length=10, max_length=20, description="User phone number")
    role: UserRole = Field(default=UserRole.CUSTOMER, description="User role")
    
    @validator("email")
    def validate_email_lowercase(cls, v):
        """Ensure email is lowercase."""
        return v.lower()
    
    @validator("first_name", "last_name")
    def validate_names(cls, v):
        """Clean and validate names."""
        return v.strip().title()
    
    @validator("phone")
    def validate_phone(cls, v):
        """Basic phone number validation."""
        # Remove non-digit characters for validation
        digits_only = ''.join(filter(str.isdigit, v))
        
        if len(digits_only) < 10 or len(digits_only) > 15:
            raise ValueError("Phone number must be between 10 and 15 digits")
        
        return v
    
    class Config:
        """Pydantic configuration."""
        
        use_enum_values = True
        schema_extra = {
            "example": {
                "email": "user@example.com",
                "password": "SecurePass123!",
                "first_name": "John",
                "last_name": "Doe",
                "phone": "+1234567890",
                "role": "customer"
            }
        }


class RefreshTokenRequest(BaseModel):
    """
    Schema for refresh token requests.
    """
    
    refresh_token: str = Field(..., description="Refresh token")
    
    class Config:
        """Pydantic configuration."""
        
        schema_extra = {
            "example": {
                "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
            }
        }


class ChangePasswordRequest(BaseModel):
    """
    Schema for password change requests.
    """
    
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, description="New password")
    
    @validator("new_password")
    def validate_new_password(cls, v, values):
        """Validate new password requirements."""
        current = values.get("current_password")
        
        if current and v == current:
            raise ValueError("New password must be different from current password")
        
        # Additional password strength validation could be added here
        return v
    
    class Config:
        """Pydantic configuration."""
        
        schema_extra = {
            "example": {
                "current_password": "currentpass123",
                "new_password": "NewSecurePass123!"
            }
        }


class ForgotPasswordRequest(BaseModel):
    """
    Schema for forgot password requests.
    """
    
    email: EmailStr = Field(..., description="User email address")
    
    @validator("email")
    def validate_email_lowercase(cls, v):
        """Ensure email is lowercase."""
        return v.lower()
    
    class Config:
        """Pydantic configuration."""
        
        schema_extra = {
            "example": {
                "email": "user@example.com"
            }
        }


class ResetPasswordRequest(BaseModel):
    """
    Schema for password reset requests.
    """
    
    token: str = Field(..., description="Password reset token")
    password: str = Field(..., min_length=8, description="New password")
    
    class Config:
        """Pydantic configuration."""
        
        schema_extra = {
            "example": {
                "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "password": "NewSecurePass123!"
            }
        }


class UpdateProfileRequest(BaseModel):
    """
    Schema for profile update requests.
    """
    
    first_name: Optional[str] = Field(default=None, min_length=1, max_length=100, description="User first name")
    last_name: Optional[str] = Field(default=None, min_length=1, max_length=100, description="User last name")
    phone: Optional[str] = Field(default=None, min_length=10, max_length=20, description="User phone number")
    
    @validator("first_name", "last_name")
    def validate_names(cls, v):
        """Clean and validate names."""
        return v.strip().title() if v else v
    
    @validator("phone")
    def validate_phone(cls, v):
        """Basic phone number validation."""
        if v is None:
            return v
        
        # Remove non-digit characters for validation
        digits_only = ''.join(filter(str.isdigit, v))
        
        if len(digits_only) < 10 or len(digits_only) > 15:
            raise ValueError("Phone number must be between 10 and 15 digits")
        
        return v
    
    class Config:
        """Pydantic configuration."""
        
        schema_extra = {
            "example": {
                "first_name": "John",
                "last_name": "Doe",
                "phone": "+1234567890"
            }
        }


class UserResponse(BaseModel):
    """
    Schema for user data in API responses.
    """
    
    id: str = Field(..., description="User ID")
    email: str = Field(..., description="User email address")
    first_name: str = Field(..., description="User first name", alias="firstName")
    last_name: str = Field(..., description="User last name", alias="lastName")
    phone: str = Field(..., description="User phone number")
    role: str = Field(..., description="User role")
    is_active: bool = Field(..., description="Whether user account is active", alias="isActive")
    is_verified: bool = Field(..., description="Whether user email is verified", alias="isVerified")
    profile_completed: bool = Field(..., description="Whether user profile is complete", alias="profileCompleted")
    created_at: str = Field(..., description="Account creation timestamp", alias="createdAt")
    updated_at: str = Field(..., description="Last update timestamp", alias="updatedAt")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        use_enum_values = True
        schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "email": "user@example.com",
                "firstName": "John",
                "lastName": "Doe",
                "phone": "+1234567890",
                "role": "customer",
                "isActive": True,
                "isVerified": True,
                "profileCompleted": True,
                "createdAt": "2024-01-15T10:30:00Z",
                "updatedAt": "2024-01-20T14:25:00Z"
            }
        }


class LoginResponse(BaseModel):
    """
    Schema for login response.
    """
    
    user: UserResponse = Field(..., description="User information")
    access_token: str = Field(..., description="JWT access token", alias="accessToken")
    refresh_token: str = Field(..., description="JWT refresh token", alias="refreshToken")
    token_type: str = Field(default="bearer", description="Token type", alias="tokenType")
    expires_in: int = Field(..., description="Access token expiration time in seconds", alias="expiresIn")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "user": {
                    "id": "507f1f77bcf86cd799439011",
                    "email": "user@example.com",
                    "firstName": "John",
                    "lastName": "Doe",
                    "phone": "+1234567890",
                    "role": "customer",
                    "isActive": True,
                    "isVerified": True,
                    "profileCompleted": True,
                    "createdAt": "2024-01-15T10:30:00Z",
                    "updatedAt": "2024-01-20T14:25:00Z"
                },
                "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "tokenType": "bearer",
                "expiresIn": 1800
            }
        }


class RefreshTokenResponse(BaseModel):
    """
    Schema for refresh token response.
    """
    
    access_token: str = Field(..., description="New JWT access token", alias="accessToken")
    refresh_token: str = Field(..., description="New JWT refresh token", alias="refreshToken")
    token_type: str = Field(default="bearer", description="Token type", alias="tokenType")
    expires_in: int = Field(..., description="Access token expiration time in seconds", alias="expiresIn")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "accessToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "refreshToken": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
                "tokenType": "bearer",
                "expiresIn": 1800
            }
        }


class EmailVerificationRequest(BaseModel):
    """
    Schema for email verification requests.
    """
    
    token: str = Field(..., description="Email verification token")
    
    class Config:
        """Pydantic configuration."""
        
        schema_extra = {
            "example": {
                "token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
            }
        }