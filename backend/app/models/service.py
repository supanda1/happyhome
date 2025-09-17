"""
Service-related models for service categories, services, and photos.
"""

from typing import Dict, List, Optional
from uuid import UUID

from sqlalchemy import Boolean, Float, Integer, String, Text, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .base import Base


class ServiceCategory(Base):
    """
    Service category model for organizing services.
    
    Categories help organize services into logical groups like
    Plumbing, Electrical, Cleaning, etc.
    """
    
    __tablename__ = "service_categories"
    
    name: Mapped[str] = mapped_column(
        String(100),
        unique=True,
        nullable=False,
        index=True
    )
    
    description: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )
    
    icon: Mapped[str] = mapped_column(
        String(10),
        nullable=False
    )
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True
    )
    
    sort_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        index=True
    )
    
    # Image paths for category images (from Pexels downloads)
    image_paths: Mapped[Optional[List[str]]] = mapped_column(
        JSON,
        nullable=True,
        default=None
    )
    
    # Relationships
    services: Mapped[List["Service"]] = relationship(
        "Service",
        back_populates="category",
        lazy="select"
    )
    
    subcategories: Mapped[List["ServiceSubcategory"]] = relationship(
        "ServiceSubcategory",
        back_populates="category",
        cascade="all, delete-orphan",
        lazy="select"
    )
    
    def dict_for_response(self, exclude: set = None) -> Dict[str, any]:
        """Get category data for API responses."""
        data = self.to_dict(exclude=exclude)
        
        return {
            "id": data["id"],
            "name": data["name"],
            "description": data["description"],
            "icon": data["icon"],
            "isActive": data["is_active"],
            "sortOrder": data["sort_order"],
            "imagePaths": data.get("image_paths"),
            "createdAt": data["created_at"],
            "updatedAt": data["updated_at"],
        }


class ServiceSubcategory(Base):
    """
    Service subcategory model for organizing services within categories.
    
    Examples: Under Plumbing -> Bath Fittings, Basin & Sink, etc.
    """
    
    __tablename__ = "service_subcategories"
    
    category_id: Mapped[UUID] = mapped_column(
        ForeignKey("service_categories.id"),
        nullable=False,
        index=True
    )
    
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
        index=True
    )
    
    description: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )
    
    icon: Mapped[str] = mapped_column(
        String(10),
        nullable=False
    )
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True
    )
    
    sort_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        index=True
    )
    
    # Relationships
    category: Mapped["ServiceCategory"] = relationship(
        "ServiceCategory",
        back_populates="subcategories"
    )
    
    services: Mapped[List["Service"]] = relationship(
        "Service",
        back_populates="subcategory",
        lazy="select"
    )
    
    def dict_for_response(self, exclude: set = None) -> Dict[str, any]:
        """Get subcategory data for API responses."""
        data = self.to_dict(exclude=exclude)
        
        return {
            "id": data["id"],
            "categoryId": data["category_id"],
            "name": data["name"],
            "description": data["description"],
            "icon": data["icon"],
            "isActive": data["is_active"],
            "sortOrder": data["sort_order"],
            "createdAt": data["created_at"],
            "updatedAt": data["updated_at"],
        }


class ServicePhoto(Base):
    """
    Service photo model for service images.
    """
    
    __tablename__ = "service_photos"
    
    service_id: Mapped[UUID] = mapped_column(
        ForeignKey("services.id"),
        nullable=False,
        index=True
    )
    
    url: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )
    
    alt_text: Mapped[str] = mapped_column(
        String(200),
        nullable=False
    )
    
    is_primary: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True
    )
    
    sort_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0,
        index=True
    )
    
    # Relationships
    service: Mapped["Service"] = relationship(
        "Service",
        back_populates="photos"
    )
    
    def dict_for_response(self, exclude: set = None) -> Dict[str, any]:
        """Get photo data for API responses."""
        data = self.to_dict(exclude=exclude)
        
        return {
            "id": data["id"],
            "serviceId": data["service_id"],
            "url": data["url"],
            "altText": data["alt_text"],
            "isPrimary": data["is_primary"],
            "sortOrder": data["sort_order"],
        }


class ServiceVariant(Base):
    """
    Service variant model for different service packages (Classic, Premium, etc.)
    """
    
    __tablename__ = "service_variants"
    
    service_id: Mapped[UUID] = mapped_column(
        ForeignKey("services.id"),
        nullable=False,
        index=True
    )
    
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False
    )
    
    description: Mapped[str] = mapped_column(
        String(500),
        nullable=False
    )
    
    base_price: Mapped[float] = mapped_column(
        Float,
        nullable=False
    )
    
    discounted_price: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True
    )
    
    duration: Mapped[int] = mapped_column(
        Integer,
        nullable=False  # Duration in minutes
    )
    
    # JSON fields for flexible data storage
    inclusions: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list
    )
    
    exclusions: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list
    )
    
    features: Mapped[Dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict
    )
    
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True
    )
    
    sort_order: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    
    # Relationships
    service: Mapped["Service"] = relationship(
        "Service",
        back_populates="variants"
    )
    
    @property
    def discount_percentage(self) -> Optional[int]:
        """Calculate discount percentage."""
        if self.discounted_price and self.base_price > 0:
            return int(((self.base_price - self.discounted_price) / self.base_price) * 100)
        return None
    
    @property
    def effective_price(self) -> float:
        """Get the effective price (discounted or base)."""
        return self.discounted_price if self.discounted_price else self.base_price
    
    def dict_for_response(self, exclude: set = None) -> Dict[str, any]:
        """Get variant data for API responses."""
        data = self.to_dict(exclude=exclude)
        
        return {
            "id": data["id"],
            "serviceId": data["service_id"],
            "name": data["name"],
            "description": data["description"],
            "basePrice": data["base_price"],
            "discountedPrice": data["discounted_price"],
            "discountPercentage": self.discount_percentage,
            "effectivePrice": self.effective_price,
            "duration": data["duration"],
            "inclusions": data["inclusions"],
            "exclusions": data["exclusions"],
            "features": data["features"],
            "isActive": data["is_active"],
            "sortOrder": data["sort_order"],
            "createdAt": data["created_at"],
            "updatedAt": data["updated_at"],
        }


class Service(Base):
    """
    Service model for individual services offered.
    
    Each service belongs to a category and subcategory and contains detailed information
    about pricing, availability, inclusions, and more.
    """
    
    __tablename__ = "services"
    
    # Basic information
    name: Mapped[str] = mapped_column(
        String(200),
        nullable=False,
        index=True
    )
    
    category_id: Mapped[UUID] = mapped_column(
        ForeignKey("service_categories.id"),
        nullable=False,
        index=True
    )
    
    subcategory_id: Mapped[Optional[UUID]] = mapped_column(
        ForeignKey("service_subcategories.id"),
        nullable=True,
        index=True
    )
    
    description: Mapped[str] = mapped_column(
        Text,
        nullable=False
    )
    
    short_description: Mapped[str] = mapped_column(
        String(300),
        nullable=False
    )
    
    # Base pricing (can be overridden by variants)
    base_price: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        index=True
    )
    
    discounted_price: Mapped[Optional[float]] = mapped_column(
        Float,
        nullable=True
    )
    
    # Service details
    duration: Mapped[int] = mapped_column(
        Integer,
        nullable=False  # Duration in minutes
    )
    
    # JSON fields for flexible data storage
    inclusions: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list
    )
    
    exclusions: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list
    )
    
    requirements: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list
    )
    
    # Ratings and reviews
    rating: Mapped[float] = mapped_column(
        Float,
        nullable=False,
        default=0.0,
        index=True
    )
    
    review_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    
    booking_count: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        default=0
    )
    
    # Status and visibility
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
        index=True
    )
    
    is_featured: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=False,
        index=True
    )
    
    # Tags and categorization
    tags: Mapped[List[str]] = mapped_column(
        JSON,
        nullable=False,
        default=list
    )
    
    # Availability settings
    availability_settings: Mapped[Dict] = mapped_column(
        JSON,
        nullable=False,
        default=dict
    )
    
    # Image paths for service images (from Pexels downloads)
    image_paths: Mapped[Optional[List[str]]] = mapped_column(
        JSON,
        nullable=True,
        default=None
    )
    
    # Relationships
    category: Mapped["ServiceCategory"] = relationship(
        "ServiceCategory",
        back_populates="services"
    )
    
    subcategory: Mapped[Optional["ServiceSubcategory"]] = relationship(
        "ServiceSubcategory",
        back_populates="services"
    )
    
    photos: Mapped[List["ServicePhoto"]] = relationship(
        "ServicePhoto",
        back_populates="service",
        cascade="all, delete-orphan",
        lazy="select",
        order_by="ServicePhoto.sort_order"
    )
    
    variants: Mapped[List["ServiceVariant"]] = relationship(
        "ServiceVariant",
        back_populates="service",
        cascade="all, delete-orphan",
        lazy="select",
        order_by="ServiceVariant.sort_order"
    )
    
    bookings: Mapped[List["Booking"]] = relationship(
        "Booking",
        back_populates="service",
        lazy="select"
    )
    
    reviews: Mapped[List["Review"]] = relationship(
        "Review",
        back_populates="service",
        lazy="select"
    )
    
    @property
    def discount_percentage(self) -> Optional[int]:
        """Calculate discount percentage."""
        if self.discounted_price and self.base_price > 0:
            return int(((self.base_price - self.discounted_price) / self.base_price) * 100)
        return None
    
    @property
    def effective_price(self) -> float:
        """Get the effective price (discounted or base)."""
        return self.discounted_price if self.discounted_price else self.base_price
    
    def get_primary_photo(self) -> Optional["ServicePhoto"]:
        """Get the primary photo for this service."""
        for photo in self.photos:
            if photo.is_primary:
                return photo
        return self.photos[0] if self.photos else None
    
    def dict_for_response(self, exclude: set = None, include_relationships: bool = False) -> Dict[str, any]:
        """Get service data for API responses."""
        data = self.to_dict(exclude=exclude)
        
        result = {
            "id": data["id"],
            "name": data["name"],
            "categoryId": data["category_id"],
            "subcategoryId": data["subcategory_id"],
            "description": data["description"],
            "shortDescription": data["short_description"],
            "basePrice": data["base_price"],
            "discountedPrice": data["discounted_price"],
            "discountPercentage": self.discount_percentage,
            "effectivePrice": self.effective_price,
            "duration": data["duration"],
            "inclusions": data["inclusions"],
            "exclusions": data["exclusions"],
            "requirements": data["requirements"],
            "rating": data["rating"],
            "reviewCount": data["review_count"],
            "bookingCount": data["booking_count"],
            "isActive": data["is_active"],
            "isFeatured": data["is_featured"],
            "tags": data["tags"],
            "availability": data["availability_settings"],
            "imagePaths": data.get("image_paths"),
            "createdAt": data["created_at"],
            "updatedAt": data["updated_at"],
        }
        
        # Include relationships if requested
        if include_relationships:
            if self.category:
                result["category"] = self.category.dict_for_response()
            
            if self.subcategory:
                result["subcategory"] = self.subcategory.dict_for_response()
            
            if self.photos:
                result["photos"] = [photo.dict_for_response() for photo in self.photos]
            
            if self.variants:
                result["variants"] = [variant.dict_for_response() for variant in self.variants]
        
        return result