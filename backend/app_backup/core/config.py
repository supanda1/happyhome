"""
Application configuration management using Pydantic Settings.
"""

import os
import secrets
from functools import lru_cache
from typing import List, Optional, Union

from pydantic import EmailStr, Field, field_validator
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """
    Application settings loaded from environment variables.
    
    All configuration is centralized here and validated at startup.
    """
    
    # Application Configuration
    APP_NAME: str = "Happy Homes Services API"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    LOG_LEVEL: str = "INFO"
    
    # Server Configuration
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    RELOAD: bool = True
    
    @field_validator("PORT", mode="before")
    @classmethod
    def validate_port(cls, v):
        """Handle Railway's $PORT environment variable."""
        if isinstance(v, str):
            if v.startswith("$"):
                port_val = os.getenv(v[1:])  # Remove $ and get env var
                if port_val:
                    return int(port_val)
                return 8000  # Default fallback
            return int(v)
        return v
    
    # Database Configuration - PostgreSQL
    DATABASE_URL: str = "postgresql+asyncpg://postgres:password@localhost:5432/household_services"
    DATABASE_HOST: str = "localhost"
    DATABASE_PORT: int = 5432
    DATABASE_NAME: str = "household_services"
    DATABASE_USER: str = "postgres"
    DATABASE_PASSWORD: str = "password"
    DATABASE_MIN_CONNECTIONS: int = 10
    DATABASE_MAX_CONNECTIONS: int = 100
    DATABASE_ECHO: bool = False  # Set to True for SQL logging
    
    # Redis Configuration
    REDIS_URL: str = "redis://localhost:6379"
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    
    # Security Configuration
    SECRET_KEY: str = Field(default_factory=lambda: secrets.token_urlsafe(32))
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # Password Security
    PASSWORD_MIN_LENGTH: int = 8
    BCRYPT_ROUNDS: int = 12
    
    # CORS Configuration  
    ALLOWED_ORIGINS: List[str] = [
        "http://localhost:3000",
        "http://localhost:3001", 
        "http://localhost:3002",  # Added for current frontend port
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002"   # Added for current frontend port
    ]
    ALLOWED_METHODS: List[str] = ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"]
    ALLOWED_HEADERS: List[str] = ["*"]
    
    # File Upload Configuration
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    UPLOAD_DIR: str = "uploads"
    ALLOWED_IMAGE_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "gif", "webp"]
    
    # Email Configuration (optional)
    SMTP_HOST: Optional[str] = None
    SMTP_PORT: int = 587
    SMTP_USER: Optional[str] = None
    SMTP_PASSWORD: Optional[str] = None
    SMTP_USE_TLS: bool = True
    FROM_EMAIL: Optional[EmailStr] = None
    
    # External Services
    GOOGLE_MAPS_API_KEY: Optional[str] = None
    PEXELS_API_KEY: Optional[str] = None
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = 100
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
    # Cache Configuration
    CACHE_TTL: int = 3600  # 1 hour
    
    # Monitoring and Logging
    SENTRY_DSN: Optional[str] = None
    LOG_JSON_FORMAT: bool = False
    
    # Development Settings
    AUTO_RELOAD: bool = True
    SHOW_DOCS: bool = True
    
    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def assemble_cors_origins(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        """Parse CORS origins from environment variable."""
        if isinstance(v, str) and not v.startswith("["):
            # Handle Railway $FRONTEND_URL environment variable
            if v.startswith("$"):
                frontend_url = os.getenv(v[1:])  # Remove $ and get env var
                if frontend_url:
                    origins = [frontend_url]
                    # Add common local development origins
                    origins.extend([
                        "http://localhost:3000",
                        "http://localhost:3001", 
                        "http://localhost:3002",
                        "http://127.0.0.1:3000",
                        "http://127.0.0.1:3001",
                        "http://127.0.0.1:3002"
                    ])
                    return origins
                return ["*"]  # Fallback for Railway deployment
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @field_validator("ALLOWED_METHODS", mode="before")
    @classmethod
    def assemble_cors_methods(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        """Parse CORS methods from environment variable."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @field_validator("ALLOWED_IMAGE_EXTENSIONS", mode="before")
    @classmethod
    def assemble_image_extensions(cls, v: Union[str, List[str]]) -> Union[List[str], str]:
        """Parse allowed image extensions from environment variable."""
        if isinstance(v, str) and not v.startswith("["):
            return [i.strip() for i in v.split(",")]
        elif isinstance(v, (list, str)):
            return v
        raise ValueError(v)
    
    @field_validator("SECRET_KEY", mode="before")
    @classmethod
    def validate_secret_key(cls, v: str) -> str:
        """Ensure secret key is set and secure."""
        if not v:
            raise ValueError("SECRET_KEY must be set")
        if len(v) < 32:
            raise ValueError("SECRET_KEY must be at least 32 characters long")
        return v
    
    @field_validator("ENVIRONMENT")
    @classmethod
    def validate_environment(cls, v: str) -> str:
        """Validate environment setting."""
        allowed_environments = ["development", "staging", "production", "testing"]
        if v.lower() not in allowed_environments:
            raise ValueError(f"ENVIRONMENT must be one of: {allowed_environments}")
        return v.lower()
    
    @property
    def is_development(self) -> bool:
        """Check if running in development mode."""
        return self.ENVIRONMENT == "development"
    
    @property
    def is_production(self) -> bool:
        """Check if running in production mode."""
        return self.ENVIRONMENT == "production"
    
    @property
    def is_testing(self) -> bool:
        """Check if running in testing mode."""
        return self.ENVIRONMENT == "testing"
    
    @property
    def postgres_url(self) -> str:
        """Get PostgreSQL connection URL."""
        # First check for Railway-provided DATABASE_URL
        railway_db_url = os.getenv("DATABASE_URL")
        if railway_db_url:
            # Convert postgres:// to postgresql+asyncpg:// if needed
            if railway_db_url.startswith("postgres://"):
                railway_db_url = railway_db_url.replace("postgres://", "postgresql+asyncpg://", 1)
            elif railway_db_url.startswith("postgresql://"):
                railway_db_url = railway_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)
            return railway_db_url
        
        # Fallback to configured DATABASE_URL
        if self.DATABASE_URL and not self.DATABASE_URL.startswith("sqlite"):
            return self.DATABASE_URL
        
        # Build from individual components
        return f"postgresql+asyncpg://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"
    
    @property
    def postgres_url_sync(self) -> str:
        """Get synchronous PostgreSQL connection URL for Alembic."""
        return self.postgres_url.replace("postgresql+asyncpg://", "postgresql://")
    
    @property
    def redis_connection_url(self) -> str:
        """Get Redis connection URL."""
        if self.REDIS_PASSWORD:
            return f"redis://:{self.REDIS_PASSWORD}@{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
        return f"redis://{self.REDIS_HOST}:{self.REDIS_PORT}/{self.REDIS_DB}"
    
    @property
    def upload_path(self) -> str:
        """Get full upload directory path."""
        return os.path.abspath(self.UPLOAD_DIR)
    
    class Config:
        """Pydantic configuration."""
        
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True
        validate_assignment = True
        extra = "ignore"  # Ignore extra environment variables


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached application settings.
    
    Uses lru_cache to ensure settings are loaded only once.
    """
    return Settings()


# Global settings instance
settings = get_settings()


def create_upload_dir():
    """Create upload directory if it doesn't exist."""
    upload_dir = settings.upload_path
    if not os.path.exists(upload_dir):
        os.makedirs(upload_dir, exist_ok=True)
        print(f"Created upload directory: {upload_dir}")