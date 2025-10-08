"""
Service-related schemas for categories, services, and photos.
"""

from typing import List, Optional

from pydantic import BaseModel, Field, validator

from .base import FilterParams


class ServiceCategoryCreate(BaseModel):
    """
    Schema for creating service categories.
    """
    
    name: str = Field(..., min_length=1, max_length=100, description="Category name")
    description: str = Field(..., min_length=1, max_length=500, description="Category description")
    icon: str = Field(..., min_length=1, max_length=10, description="Category icon (emoji or icon code)")
    is_active: bool = Field(default=True, description="Whether category is active")
    sort_order: int = Field(default=0, description="Sort order for display")
    
    @validator("name")
    def validate_name(cls, v):
        """Validate and clean category name."""
        return v.strip().title()
    
    class Config:
        """Pydantic configuration."""
        
        schema_extra = {
            "example": {
                "name": "Plumbing",
                "description": "Professional plumbing services for all your needs",
                "icon": "🔧",
                "is_active": True,
                "sort_order": 1
            }
        }


class ServiceCategoryUpdate(BaseModel):
    """
    Schema for updating service categories.
    """
    
    name: Optional[str] = Field(default=None, min_length=1, max_length=100, description="Category name")
    description: Optional[str] = Field(default=None, min_length=1, max_length=500, description="Category description")
    icon: Optional[str] = Field(default=None, min_length=1, max_length=10, description="Category icon")
    is_active: Optional[bool] = Field(default=None, description="Whether category is active")
    sort_order: Optional[int] = Field(default=None, description="Sort order for display")
    
    @validator("name")
    def validate_name(cls, v):
        """Validate and clean category name."""
        return v.strip().title() if v else v
    
    class Config:
        """Pydantic configuration."""
        
        schema_extra = {
            "example": {
                "name": "Plumbing Services",
                "description": "Updated description for plumbing services",
                "is_active": True,
                "sort_order": 2
            }
        }


class ServiceCategoryResponse(BaseModel):
    """
    Schema for service category responses.
    """
    
    id: str = Field(..., description="Category ID")
    name: str = Field(..., description="Category name")
    description: str = Field(..., description="Category description")
    icon: str = Field(..., description="Category icon")
    is_active: bool = Field(..., description="Whether category is active", alias="isActive")
    sort_order: int = Field(..., description="Sort order for display", alias="sortOrder")
    created_at: str = Field(..., description="Creation timestamp", alias="createdAt")
    updated_at: str = Field(..., description="Last update timestamp", alias="updatedAt")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "name": "Plumbing",
                "description": "Professional plumbing services for all your needs",
                "icon": "🔧",
                "isActive": True,
                "sortOrder": 1,
                "createdAt": "2024-01-01T00:00:00Z",
                "updatedAt": "2024-01-01T00:00:00Z"
            }
        }


class ServiceSubcategoryCreate(BaseModel):
    """
    Schema for creating service subcategories.
    """
    
    category_id: str = Field(..., description="Parent category ID", alias="categoryId")
    name: str = Field(..., min_length=1, max_length=100, description="Subcategory name")
    description: str = Field(..., min_length=1, max_length=500, description="Subcategory description")
    icon: str = Field(..., min_length=1, max_length=10, description="Subcategory icon (emoji or icon code)")
    is_active: bool = Field(default=True, description="Whether subcategory is active")
    sort_order: int = Field(default=0, description="Sort order for display")
    
    @validator("name")
    def validate_name(cls, v):
        """Validate and clean subcategory name."""
        return v.strip().title()
    
    class Config:
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "categoryId": "507f1f77bcf86cd799439011",
                "name": "Bath Fittings",
                "description": "Professional installation and repair of bathroom fittings",
                "icon": "🚿",
                "is_active": True,
                "sort_order": 1
            }
        }


class ServiceSubcategoryUpdate(BaseModel):
    """
    Schema for updating service subcategories.
    """
    
    category_id: Optional[str] = Field(default=None, description="Parent category ID", alias="categoryId")
    name: Optional[str] = Field(default=None, min_length=1, max_length=100, description="Subcategory name")
    description: Optional[str] = Field(default=None, min_length=1, max_length=500, description="Subcategory description")
    icon: Optional[str] = Field(default=None, min_length=1, max_length=10, description="Subcategory icon")
    is_active: Optional[bool] = Field(default=None, description="Whether subcategory is active")
    sort_order: Optional[int] = Field(default=None, description="Sort order for display")
    
    @validator("name")
    def validate_name(cls, v):
        """Validate and clean subcategory name."""
        if v is not None:
            return v.strip().title()
        return v
    
    class Config:
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "name": "Bath Fittings & Accessories",
                "description": "Updated description for bath fittings services",
                "is_active": True,
                "sort_order": 2
            }
        }


class ServiceSubcategoryResponse(BaseModel):
    """
    Schema for service subcategory responses.
    """
    
    id: str = Field(..., description="Subcategory ID")
    category_id: str = Field(..., description="Parent category ID", alias="categoryId")
    name: str = Field(..., description="Subcategory name")
    description: str = Field(..., description="Subcategory description")
    icon: str = Field(..., description="Subcategory icon")
    is_active: bool = Field(..., description="Whether subcategory is active", alias="isActive")
    sort_order: int = Field(..., description="Sort order for display", alias="sortOrder")
    created_at: str = Field(..., description="Creation timestamp", alias="createdAt")
    updated_at: str = Field(..., description="Last update timestamp", alias="updatedAt")
    
    class Config:
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439012",
                "categoryId": "507f1f77bcf86cd799439011",
                "name": "Bath Fittings",
                "description": "Professional installation and repair of bathroom fittings",
                "icon": "🚿",
                "isActive": True,
                "sortOrder": 1,
                "createdAt": "2024-01-01T00:00:00Z",
                "updatedAt": "2024-01-01T00:00:00Z"
            }
        }


class TimeSlotCreate(BaseModel):
    """
    Schema for creating time slots.
    """
    
    start_time: str = Field(..., pattern=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", description="Start time in HH:MM format")
    end_time: str = Field(..., pattern=r"^([01]?[0-9]|2[0-3]):[0-5][0-9]$", description="End time in HH:MM format")
    is_available: bool = Field(default=True, description="Whether time slot is available")
    
    @validator("end_time")
    def validate_end_time(cls, v, values):
        """Validate that end time is after start time."""
        if "start_time" in values and v <= values["start_time"]:
            raise ValueError("End time must be after start time")
        return v


class ServiceAvailabilityCreate(BaseModel):
    """
    Schema for creating service availability.
    """
    
    is_available: bool = Field(default=True, description="Whether service is currently available")
    time_slots: List[TimeSlotCreate] = Field(default_factory=list, description="Available time slots")
    blackout_dates: List[str] = Field(default_factory=list, description="Unavailable dates (YYYY-MM-DD format)")
    
    @validator("blackout_dates")
    def validate_blackout_dates(cls, v):
        """Validate blackout date format."""
        from datetime import datetime
        
        for date_str in v:
            try:
                datetime.strptime(date_str, "%Y-%m-%d")
            except ValueError:
                raise ValueError(f"Invalid date format: {date_str}. Use YYYY-MM-DD format.")
        return v


class ServiceCreate(BaseModel):
    """
    Schema for creating services.
    """
    
    name: str = Field(..., min_length=1, max_length=200, description="Service name")
    category_id: str = Field(..., description="Service category ID", alias="categoryId")
    description: str = Field(..., min_length=1, max_length=2000, description="Detailed service description")
    short_description: str = Field(..., min_length=1, max_length=300, description="Short service description", alias="shortDescription")
    base_price: float = Field(..., ge=0, description="Base service price", alias="basePrice")
    discounted_price: Optional[float] = Field(default=None, ge=0, description="Discounted price if applicable", alias="discountedPrice")
    duration: int = Field(..., gt=0, description="Service duration in minutes")
    inclusions: List[str] = Field(default_factory=list, description="What's included in the service")
    exclusions: List[str] = Field(default_factory=list, description="What's not included in the service")
    is_active: bool = Field(default=True, description="Whether service is active", alias="isActive")
    is_featured: bool = Field(default=False, description="Whether service is featured", alias="isFeatured")
    tags: List[str] = Field(default_factory=list, description="Service tags for search and filtering")
    availability: ServiceAvailabilityCreate = Field(default_factory=ServiceAvailabilityCreate, description="Service availability")
    
    @validator("discounted_price")
    def validate_discounted_price(cls, v, values):
        """Validate that discounted price is less than base price."""
        if v is not None and "base_price" in values and v >= values["base_price"]:
            raise ValueError("Discounted price must be less than base price")
        return v
    
    @validator("tags")
    def validate_tags(cls, v):
        """Clean and validate tags."""
        return [tag.strip().lower() for tag in v if tag.strip()]
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "name": "Emergency Plumbing Repair",
                "categoryId": "507f1f77bcf86cd799439011",
                "description": "Fast and reliable emergency plumbing repairs available 24/7",
                "shortDescription": "24/7 emergency plumbing repairs by certified professionals",
                "basePrice": 150.0,
                "discountedPrice": 120.0,
                "duration": 60,
                "inclusions": ["Emergency call-out service", "Initial diagnosis", "Basic materials"],
                "exclusions": ["Major pipe replacements", "Permit fees"],
                "isActive": True,
                "isFeatured": True,
                "tags": ["emergency", "repair", "pipes"],
                "availability": {
                    "is_available": True,
                    "time_slots": [
                        {"start_time": "08:00", "end_time": "10:00", "is_available": True}
                    ],
                    "blackout_dates": []
                }
            }
        }


class ServiceUpdate(BaseModel):
    """
    Schema for updating services.
    """
    
    name: Optional[str] = Field(default=None, min_length=1, max_length=200, description="Service name")
    category_id: Optional[str] = Field(default=None, description="Service category ID", alias="categoryId")
    description: Optional[str] = Field(default=None, min_length=1, max_length=2000, description="Detailed service description")
    short_description: Optional[str] = Field(default=None, min_length=1, max_length=300, description="Short service description", alias="shortDescription")
    base_price: Optional[float] = Field(default=None, ge=0, description="Base service price", alias="basePrice")
    discounted_price: Optional[float] = Field(default=None, ge=0, description="Discounted price if applicable", alias="discountedPrice")
    duration: Optional[int] = Field(default=None, gt=0, description="Service duration in minutes")
    inclusions: Optional[List[str]] = Field(default=None, description="What's included in the service")
    exclusions: Optional[List[str]] = Field(default=None, description="What's not included in the service")
    is_active: Optional[bool] = Field(default=None, description="Whether service is active", alias="isActive")
    is_featured: Optional[bool] = Field(default=None, description="Whether service is featured", alias="isFeatured")
    tags: Optional[List[str]] = Field(default=None, description="Service tags for search and filtering")
    availability: Optional[ServiceAvailabilityCreate] = Field(default=None, description="Service availability")
    
    @validator("discounted_price")
    def validate_discounted_price(cls, v, values):
        """Validate that discounted price is less than base price."""
        if v is not None and "base_price" in values and values["base_price"] is not None and v >= values["base_price"]:
            raise ValueError("Discounted price must be less than base price")
        return v
    
    @validator("tags")
    def validate_tags(cls, v):
        """Clean and validate tags."""
        return [tag.strip().lower() for tag in v if tag.strip()] if v else v
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True


class ServicePhotoCreate(BaseModel):
    """
    Schema for creating service photos.
    """
    
    service_id: str = Field(..., description="Associated service ID", alias="serviceId")
    url: str = Field(..., description="Photo URL or file path")
    alt_text: str = Field(..., min_length=1, max_length=200, description="Alt text for accessibility", alias="altText")
    is_primary: bool = Field(default=False, description="Whether this is the primary photo", alias="isPrimary")
    sort_order: int = Field(default=0, description="Sort order for display", alias="sortOrder")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "serviceId": "507f1f77bcf86cd799439011",
                "url": "https://example.com/photo.jpg",
                "altText": "Professional plumber working on pipes",
                "isPrimary": True,
                "sortOrder": 1
            }
        }


class ServicePhotoResponse(BaseModel):
    """
    Schema for service photo responses.
    """
    
    id: str = Field(..., description="Photo ID")
    service_id: str = Field(..., description="Associated service ID", alias="serviceId")
    url: str = Field(..., description="Photo URL")
    alt_text: str = Field(..., description="Alt text for accessibility", alias="altText")
    is_primary: bool = Field(..., description="Whether this is the primary photo", alias="isPrimary")
    sort_order: int = Field(..., description="Sort order for display", alias="sortOrder")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True


class ServiceResponse(BaseModel):
    """
    Schema for service responses.
    """
    
    id: str = Field(..., description="Service ID")
    name: str = Field(..., description="Service name")
    category_id: str = Field(..., description="Service category ID", alias="categoryId")
    category: Optional[ServiceCategoryResponse] = Field(default=None, description="Service category")
    description: str = Field(..., description="Detailed service description")
    short_description: str = Field(..., description="Short service description", alias="shortDescription")
    base_price: float = Field(..., description="Base service price", alias="basePrice")
    discounted_price: Optional[float] = Field(..., description="Discounted price if applicable", alias="discountedPrice")
    discount_percentage: Optional[int] = Field(..., description="Discount percentage", alias="discountPercentage")
    duration: int = Field(..., description="Service duration in minutes")
    inclusions: List[str] = Field(..., description="What's included in the service")
    exclusions: List[str] = Field(..., description="What's not included in the service")
    photos: List[ServicePhotoResponse] = Field(default_factory=list, description="Service photos")
    rating: float = Field(..., description="Average service rating")
    review_count: int = Field(..., description="Number of reviews", alias="reviewCount")
    is_active: bool = Field(..., description="Whether service is active", alias="isActive")
    is_featured: bool = Field(..., description="Whether service is featured", alias="isFeatured")
    tags: List[str] = Field(..., description="Service tags")
    availability: dict = Field(..., description="Service availability")
    created_at: str = Field(..., description="Creation timestamp", alias="createdAt")
    updated_at: str = Field(..., description="Last update timestamp", alias="updatedAt")
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "name": "Emergency Plumbing Repair",
                "categoryId": "507f1f77bcf86cd799439012",
                "description": "Fast and reliable emergency plumbing repairs available 24/7",
                "shortDescription": "24/7 emergency plumbing repairs by certified professionals",
                "basePrice": 150.0,
                "discountedPrice": 120.0,
                "discountPercentage": 20,
                "duration": 60,
                "inclusions": ["Emergency call-out service", "Initial diagnosis"],
                "exclusions": ["Major pipe replacements", "Permit fees"],
                "photos": [],
                "rating": 4.5,
                "reviewCount": 25,
                "isActive": True,
                "isFeatured": True,
                "tags": ["emergency", "repair", "pipes"],
                "availability": {
                    "is_available": True,
                    "time_slots": [],
                    "blackout_dates": []
                },
                "createdAt": "2024-01-01T00:00:00Z",
                "updatedAt": "2024-01-15T00:00:00Z"
            }
        }


class ServiceListResponse(ServiceResponse):
    """
    Schema for service list responses (lighter version).
    
    Excludes some fields for better performance in list views.
    """
    
    class Config:
        """Pydantic configuration."""
        
        fields = {
            "description": {"exclude": True},
            "inclusions": {"exclude": True},
            "exclusions": {"exclude": True},
            "availability": {"exclude": True},
        }


class ServiceFilters(FilterParams):
    """
    Schema for service filtering parameters.
    """
    
    category_ids: Optional[List[str]] = Field(default=None, description="Filter by category IDs", alias="categoryIds")
    min_price: Optional[float] = Field(default=None, ge=0, description="Minimum price filter", alias="minPrice")
    max_price: Optional[float] = Field(default=None, ge=0, description="Maximum price filter", alias="maxPrice")
    min_rating: Optional[float] = Field(default=None, ge=0, le=5, description="Minimum rating filter", alias="minRating")
    is_featured: Optional[bool] = Field(default=None, description="Filter by featured status", alias="isFeatured")
    tags: Optional[List[str]] = Field(default=None, description="Filter by tags")
    
    @validator("max_price")
    def validate_price_range(cls, v, values):
        """Validate that max price is greater than min price."""
        min_price = values.get("min_price")
        if min_price is not None and v is not None and v < min_price:
            raise ValueError("Maximum price must be greater than minimum price")
        return v
    
    class Config:
        """Pydantic configuration."""
        
        allow_population_by_field_name = True
        schema_extra = {
            "example": {
                "page": 1,
                "limit": 20,
                "search": "plumbing",
                "categoryIds": ["507f1f77bcf86cd799439011"],
                "minPrice": 50.0,
                "maxPrice": 200.0,
                "minRating": 4.0,
                "isFeatured": True,
                "tags": ["emergency", "repair"],
                "sort_by": "rating",
                "sort_order": "desc"
            }
        }