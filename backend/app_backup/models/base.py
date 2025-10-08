"""
Base SQLAlchemy model with common fields and functionality.
"""

from datetime import datetime
from typing import Any, Dict
from uuid import UUID, uuid4

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID as PostgreSQLUUID
from sqlalchemy.ext.declarative import as_declarative, declared_attr
from sqlalchemy.orm import Mapped, mapped_column


@as_declarative()
class Base:
    """
    Base class for all SQLAlchemy models.
    
    Provides common fields and functionality for all database models
    including auto-generated primary keys, timestamps, and utility methods.
    """
    
    # Generate table name automatically from class name
    @declared_attr
    def __tablename__(cls) -> str:
        """Generate table name from class name (lowercase, pluralized)."""
        name = cls.__name__
        # Simple pluralization logic
        if name.endswith('y'):
            return name[:-1] + 'ies'
        elif name.endswith(('s', 'x', 'z')) or name.endswith(('ch', 'sh')):
            return name + 'es'
        else:
            return name + 's'
    
    # Primary key with UUID
    id: Mapped[UUID] = mapped_column(
        PostgreSQLUUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
        index=True
    )
    
    # Timestamp fields
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )
    
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        onupdate=func.now(),
        nullable=False,
        index=True
    )
    
    def __repr__(self) -> str:
        """String representation of the model."""
        return f"<{self.__class__.__name__}(id={self.id})>"
    
    def __hash__(self) -> int:
        """Make model hashable using its ID."""
        return hash(self.id)
    
    def __eq__(self, other: Any) -> bool:
        """Compare models by ID."""
        if isinstance(other, Base):
            return self.id == other.id
        return False
    
    def to_dict(self, exclude: set = None, include: set = None) -> Dict[str, Any]:
        """
        Convert model to dictionary.
        
        Args:
            exclude: Set of fields to exclude
            include: Set of specific fields to include (if provided, only these will be included)
            
        Returns:
            Dictionary representation of the model
        """
        exclude = exclude or set()
        
        # Get all columns
        columns = {c.name for c in self.__table__.columns}
        
        # Apply include filter if provided
        if include:
            columns = columns.intersection(include)
        
        # Apply exclude filter
        columns = columns - exclude
        
        result = {}
        for column in columns:
            value = getattr(self, column)
            
            # Handle UUID serialization
            if isinstance(value, UUID):
                result[column] = str(value)
            # Handle datetime serialization
            elif isinstance(value, datetime):
                result[column] = value.isoformat()
            else:
                result[column] = value
        
        return result
    
    def update_from_dict(self, data: Dict[str, Any], exclude: set = None) -> None:
        """
        Update model attributes from dictionary.
        
        Args:
            data: Dictionary with field values
            exclude: Set of fields to exclude from update
        """
        exclude = exclude or {'id', 'created_at', 'updated_at'}
        
        for key, value in data.items():
            if key not in exclude and hasattr(self, key):
                setattr(self, key, value)
    
    @classmethod
    def get_table_name(cls) -> str:
        """Get the table name for this model."""
        return cls.__tablename__
    
    @classmethod
    def get_column_names(cls) -> set:
        """Get all column names for this model."""
        return {c.name for c in cls.__table__.columns}
    
    def dict_for_response(self, exclude: set = None) -> Dict[str, Any]:
        """
        Get model data safe for API responses.
        
        By default excludes sensitive fields and converts to JSON-serializable format.
        Override in subclasses to customize response data.
        
        Args:
            exclude: Additional fields to exclude
            
        Returns:
            Dictionary with model data for API responses
        """
        default_exclude = set()
        if exclude:
            default_exclude.update(exclude)
        
        return self.to_dict(exclude=default_exclude)


# Type alias for the Base class
BaseModel = Base