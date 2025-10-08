"""
Database connection management with SQLAlchemy and Redis.

This module provides database connection handling, session management,
and Redis cache setup for the household services API.
"""

import logging
from contextlib import asynccontextmanager
from typing import AsyncGenerator, Optional

import redis.asyncio as redis
from sqlalchemy import event, pool, text
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import declarative_base

from ..core.config import settings

# Logger for database operations
logger = logging.getLogger(__name__)

# SQLAlchemy Base for model definitions
Base = declarative_base()

# Database engine and session factory
engine: Optional[create_async_engine] = None
async_session: Optional[async_sessionmaker] = None
redis_client: Optional[redis.Redis] = None


class Database:
    """Database connection and session management."""
    
    @classmethod
    @property
    def client(cls):
        """Get database engine client."""
        return engine
    
    @classmethod
    async def ping(cls) -> bool:
        """
        Test database connectivity.
        
        Returns:
            True if database is accessible, False otherwise
        """
        try:
            if not engine or not async_session:
                return False
                
            async with async_session() as session:
                await session.execute(text("SELECT 1"))
                return True
        except Exception as e:
            logger.error(f"Database ping failed: {e}")
            return False
    
    @classmethod
    async def connect_db(cls) -> None:
        """
        Initialize database connection and Redis client.
        
        Sets up async SQLAlchemy engine with connection pooling
        and Redis client for caching.
        """
        global engine, async_session, redis_client
        
        try:
            # Create async SQLAlchemy engine
            engine = create_async_engine(
                settings.postgres_url,
                echo=settings.DATABASE_ECHO,
                pool_size=settings.DATABASE_MIN_CONNECTIONS,
                max_overflow=settings.DATABASE_MAX_CONNECTIONS - settings.DATABASE_MIN_CONNECTIONS,
                pool_pre_ping=True,
                pool_recycle=3600,  # Recycle connections after 1 hour
                future=True,
            )
            
            # Add connection pool logging
            if settings.is_development:
                @event.listens_for(engine.sync_engine, "connect")
                def set_sqlite_pragma(dbapi_connection, connection_record):
                    """Set connection parameters."""
                    logger.debug("Database connection established")
                
                @event.listens_for(engine.sync_engine, "checkout")
                def receive_checkout(dbapi_connection, connection_record, connection_proxy):
                    """Log connection checkout."""
                    logger.debug("Connection checked out from pool")
            
            # Create session factory
            async_session = async_sessionmaker(
                engine,
                class_=AsyncSession,
                expire_on_commit=False,
                autoflush=True,
                autocommit=False
            )
            
            # Test database connection
            async with async_session() as session:
                result = await session.execute(text("SELECT 1"))
                result.fetchone()
            
            # Initialize Redis client (temporarily disabled for testing)
            # redis_client = redis.from_url(
            #     settings.redis_connection_url,
            #     encoding="utf-8",
            #     decode_responses=True,
            #     socket_connect_timeout=5,
            #     socket_timeout=5,
            #     retry_on_timeout=True,
            #     health_check_interval=30
            # )
            
            # # Test Redis connection
            # await redis_client.ping()
            redis_client = None  # Temporary: skip Redis for testing
            
            logger.info(
                "Database connections established successfully",
                extra={
                    "postgres_url": settings.postgres_url.split("@")[-1],  # Hide credentials
                    "redis_url": "disabled_for_testing",
                    "pool_size": settings.DATABASE_MIN_CONNECTIONS,
                    "max_overflow": settings.DATABASE_MAX_CONNECTIONS - settings.DATABASE_MIN_CONNECTIONS,
                }
            )
            
        except Exception as e:
            logger.error(f"Failed to connect to database: {e}")
            raise
    
    @classmethod
    async def close_db(cls) -> None:
        """Close database connections and Redis client."""
        global engine, async_session, redis_client
        
        try:
            if redis_client:
                await redis_client.close()
                logger.info("Redis connection closed")
            
            if engine:
                await engine.dispose()
                logger.info("Database connection pool closed")
                
        except Exception as e:
            logger.error(f"Error closing database connections: {e}")
        finally:
            engine = None
            async_session = None
            redis_client = None
    
    @classmethod
    @asynccontextmanager
    async def get_session(cls) -> AsyncGenerator[AsyncSession, None]:
        """
        Get database session with automatic transaction management.
        
        Yields:
            AsyncSession: Database session
            
        Raises:
            RuntimeError: If database is not connected
        """
        if not async_session:
            raise RuntimeError("Database not connected. Call connect_db() first.")
        
        async with async_session() as session:
            try:
                yield session
                await session.commit()
            except Exception:
                await session.rollback()
                raise
            finally:
                await session.close()
    
    @classmethod
    async def get_redis(cls) -> redis.Redis:
        """
        Get Redis client instance.
        
        Returns:
            Redis client
            
        Raises:
            RuntimeError: If Redis is not connected
        """
        if not redis_client:
            raise RuntimeError("Redis not connected. Call connect_db() first.")
        return redis_client


# Dependency function for FastAPI
async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    """
    FastAPI dependency to get database session.
    
    Yields:
        Database session for request handling
    """
    async with Database.get_session() as session:
        yield session


# Dependency function for Redis
async def get_redis_client() -> redis.Redis:
    """
    FastAPI dependency to get Redis client.
    
    Returns:
        Redis client instance
    """
    return await Database.get_redis()


# Cache utility functions
class Cache:
    """Redis cache utility functions."""
    
    @staticmethod
    async def get(key: str) -> Optional[str]:
        """Get value from cache."""
        try:
            client = await Database.get_redis()
            return await client.get(key)
        except Exception as e:
            logger.warning(f"Cache GET error: {e}")
            return None
    
    @staticmethod
    async def set(key: str, value: str, ttl: int = None) -> bool:
        """Set value in cache with optional TTL."""
        try:
            client = await Database.get_redis()
            ttl = ttl or settings.CACHE_TTL
            return await client.setex(key, ttl, value)
        except Exception as e:
            logger.warning(f"Cache SET error: {e}")
            return False
    
    @staticmethod
    async def delete(key: str) -> bool:
        """Delete key from cache."""
        try:
            client = await Database.get_redis()
            return bool(await client.delete(key))
        except Exception as e:
            logger.warning(f"Cache DELETE error: {e}")
            return False
    
    @staticmethod
    async def exists(key: str) -> bool:
        """Check if key exists in cache."""
        try:
            client = await Database.get_redis()
            return bool(await client.exists(key))
        except Exception as e:
            logger.warning(f"Cache EXISTS error: {e}")
            return False
    
    @staticmethod
    async def flush_pattern(pattern: str) -> int:
        """Delete all keys matching pattern."""
        try:
            client = await Database.get_redis()
            keys = await client.keys(pattern)
            if keys:
                return await client.delete(*keys)
            return 0
        except Exception as e:
            logger.warning(f"Cache FLUSH_PATTERN error: {e}")
            return 0


# Health check functions
async def check_database_health() -> dict:
    """
    Check database connection health.
    
    Returns:
        Health check results
    """
    try:
        async with Database.get_session() as session:
            result = await session.execute(text("SELECT 1"))
            result.fetchone()
            return {"status": "healthy", "message": "Database connection OK"}
    except Exception as e:
        return {"status": "unhealthy", "message": f"Database error: {str(e)}"}


async def check_redis_health() -> dict:
    """
    Check Redis connection health.
    
    Returns:
        Health check results
    """
    try:
        client = await Database.get_redis()
        await client.ping()
        return {"status": "healthy", "message": "Redis connection OK"}
    except Exception as e:
        return {"status": "unhealthy", "message": f"Redis error: {str(e)}"}