"""
Rate limiting middleware to prevent abuse and ensure fair usage.
"""

import asyncio
import time
from collections import defaultdict, deque
from typing import Dict, Deque, Optional, Tuple

from fastapi import Request, Response, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware

from ..core.config import settings
from ..core.logging import get_logger
from ..schemas.base import ErrorResponse

logger = get_logger(__name__)


class InMemoryRateLimiter:
    """
    In-memory rate limiter using sliding window algorithm.
    
    For production use, consider using Redis or another distributed cache.
    """
    
    def __init__(self):
        self.clients: Dict[str, Deque[float]] = defaultdict(deque)
        self.lock = asyncio.Lock()
    
    async def is_allowed(
        self, 
        client_id: str, 
        max_requests: int, 
        window_seconds: int
    ) -> Tuple[bool, int, float]:
        """
        Check if client is allowed to make a request.
        
        Args:
            client_id: Unique client identifier
            max_requests: Maximum requests allowed in window
            window_seconds: Time window in seconds
            
        Returns:
            Tuple of (is_allowed, requests_made, reset_time)
        """
        async with self.lock:
            now = time.time()
            window_start = now - window_seconds
            
            # Get client's request history
            client_requests = self.clients[client_id]
            
            # Remove old requests outside the window
            while client_requests and client_requests[0] < window_start:
                client_requests.popleft()
            
            # Check if client has exceeded the limit
            requests_made = len(client_requests)
            is_allowed = requests_made < max_requests
            
            # If allowed, record this request
            if is_allowed:
                client_requests.append(now)
                requests_made += 1
            
            # Calculate reset time (when oldest request will expire)
            reset_time = client_requests[0] + window_seconds if client_requests else now
            
            return is_allowed, requests_made, reset_time
    
    async def cleanup_old_entries(self, max_age_seconds: int = 3600) -> None:
        """
        Clean up old client entries to prevent memory leaks.
        
        Args:
            max_age_seconds: Age threshold for cleanup
        """
        async with self.lock:
            now = time.time()
            cutoff = now - max_age_seconds
            
            # Remove clients with no recent requests
            to_remove = []
            for client_id, requests in self.clients.items():
                if not requests or requests[-1] < cutoff:
                    to_remove.append(client_id)
            
            for client_id in to_remove:
                del self.clients[client_id]
            
            if to_remove:
                logger.debug(f"Cleaned up {len(to_remove)} rate limiter entries")


class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware with configurable limits per endpoint.
    """
    
    def __init__(
        self,
        app,
        default_requests: int = None,
        default_window: int = None,
        limiter: Optional[InMemoryRateLimiter] = None,
        exempt_paths: Optional[list] = None,
        custom_limits: Optional[Dict[str, Tuple[int, int]]] = None
    ):
        """
        Initialize rate limiting middleware.
        
        Args:
            app: ASGI application
            default_requests: Default max requests per window
            default_window: Default window size in seconds
            limiter: Rate limiter instance (creates new if None)
            exempt_paths: Paths to exempt from rate limiting
            custom_limits: Custom limits per path pattern
        """
        super().__init__(app)
        self.default_requests = default_requests or settings.RATE_LIMIT_REQUESTS
        self.default_window = default_window or settings.RATE_LIMIT_WINDOW
        self.limiter = limiter or InMemoryRateLimiter()
        self.exempt_paths = exempt_paths or [
            "/health",
            "/docs",
            "/redoc",
            "/openapi.json",
            "/favicon.ico",
        ]
        self.custom_limits = custom_limits or {
            "/api/v1/auth/login": (5, 300),  # 5 login attempts per 5 minutes
            "/api/v1/auth/register": (3, 3600),  # 3 registrations per hour
            "/api/v1/auth/forgot-password": (3, 3600),  # 3 password resets per hour
            "/api/v1/bookings": (10, 600),  # 10 bookings per 10 minutes
        }
        
        # Start cleanup task
        asyncio.create_task(self._periodic_cleanup())
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Process request and apply rate limiting.
        
        Args:
            request: FastAPI request object
            call_next: Next middleware/endpoint in chain
            
        Returns:
            Response or rate limit error
        """
        # Skip rate limiting for exempt paths
        if request.url.path in self.exempt_paths:
            return await call_next(request)
        
        # Get client identifier
        client_id = self._get_client_id(request)
        
        # Determine rate limits for this path
        max_requests, window_seconds = self._get_limits_for_path(request.url.path)
        
        # Check rate limit
        is_allowed, requests_made, reset_time = await self.limiter.is_allowed(
            client_id, max_requests, window_seconds
        )
        
        if not is_allowed:
            # Rate limit exceeded
            request_id = getattr(request.state, "request_id", "unknown")
            logger.warning(
                "Rate limit exceeded",
                request_id=request_id,
                client_id=client_id,
                path=request.url.path,
                requests_made=requests_made,
                max_requests=max_requests,
                window_seconds=window_seconds,
            )
            
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content=ErrorResponse(
                    success=False,
                    message="Rate limit exceeded. Please try again later.",
                    error_code="RATE_LIMITED",
                    request_id=request_id
                ).dict(),
                headers={
                    "X-Rate-Limit-Limit": str(max_requests),
                    "X-Rate-Limit-Remaining": "0",
                    "X-Rate-Limit-Reset": str(int(reset_time)),
                    "Retry-After": str(int(reset_time - time.time())),
                }
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        remaining = max_requests - requests_made
        response.headers["X-Rate-Limit-Limit"] = str(max_requests)
        response.headers["X-Rate-Limit-Remaining"] = str(remaining)
        response.headers["X-Rate-Limit-Reset"] = str(int(reset_time))
        
        return response
    
    def _get_client_id(self, request: Request) -> str:
        """
        Get unique client identifier for rate limiting.
        
        Args:
            request: FastAPI request object
            
        Returns:
            Unique client identifier
        """
        # Try to get authenticated user ID first
        if hasattr(request.state, "user") and request.state.user:
            return f"user:{request.state.user.id}"
        
        # Fall back to IP address
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            ip = forwarded_for.split(",")[0].strip()
        else:
            ip = request.client.host if request.client else "unknown"
        
        return f"ip:{ip}"
    
    def _get_limits_for_path(self, path: str) -> Tuple[int, int]:
        """
        Get rate limits for a specific path.
        
        Args:
            path: Request path
            
        Returns:
            Tuple of (max_requests, window_seconds)
        """
        # Check for exact path match
        if path in self.custom_limits:
            return self.custom_limits[path]
        
        # Check for pattern matches
        for pattern, limits in self.custom_limits.items():
            if self._path_matches_pattern(path, pattern):
                return limits
        
        # Return default limits
        return self.default_requests, self.default_window
    
    def _path_matches_pattern(self, path: str, pattern: str) -> bool:
        """
        Check if path matches a pattern (simple wildcard support).
        
        Args:
            path: Request path
            pattern: Pattern to match against
            
        Returns:
            True if path matches pattern
        """
        # Simple wildcard matching
        if "*" in pattern:
            pattern_parts = pattern.split("*")
            if len(pattern_parts) == 2:
                prefix, suffix = pattern_parts
                return path.startswith(prefix) and path.endswith(suffix)
        
        return path == pattern
    
    async def _periodic_cleanup(self) -> None:
        """Periodic cleanup of old rate limiter entries."""
        while True:
            try:
                await asyncio.sleep(300)  # Clean up every 5 minutes
                await self.limiter.cleanup_old_entries()
            except Exception as e:
                logger.error(f"Error in rate limiter cleanup: {e}")


class UserBasedRateLimitMiddleware(BaseHTTPMiddleware):
    """
    Rate limiting middleware with different limits for authenticated vs anonymous users.
    """
    
    def __init__(
        self,
        app,
        anonymous_requests: int = 100,
        anonymous_window: int = 3600,
        authenticated_requests: int = 1000,
        authenticated_window: int = 3600,
        limiter: Optional[InMemoryRateLimiter] = None
    ):
        """
        Initialize user-based rate limiting middleware.
        
        Args:
            app: ASGI application
            anonymous_requests: Max requests for anonymous users
            anonymous_window: Window for anonymous users (seconds)
            authenticated_requests: Max requests for authenticated users
            authenticated_window: Window for authenticated users (seconds)
            limiter: Rate limiter instance
        """
        super().__init__(app)
        self.anonymous_requests = anonymous_requests
        self.anonymous_window = anonymous_window
        self.authenticated_requests = authenticated_requests
        self.authenticated_window = authenticated_window
        self.limiter = limiter or InMemoryRateLimiter()
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Apply user-based rate limiting.
        
        Args:
            request: FastAPI request object
            call_next: Next middleware/endpoint in chain
            
        Returns:
            Response or rate limit error
        """
        # Determine if user is authenticated
        is_authenticated = hasattr(request.state, "user") and request.state.user
        
        # Set limits based on authentication status
        if is_authenticated:
            max_requests = self.authenticated_requests
            window_seconds = self.authenticated_window
            client_id = f"user:{request.state.user.id}"
        else:
            max_requests = self.anonymous_requests
            window_seconds = self.anonymous_window
            # Use IP for anonymous users
            ip = request.client.host if request.client else "unknown"
            client_id = f"anonymous:{ip}"
        
        # Check rate limit
        is_allowed, requests_made, reset_time = await self.limiter.is_allowed(
            client_id, max_requests, window_seconds
        )
        
        if not is_allowed:
            return JSONResponse(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                content=ErrorResponse(
                    success=False,
                    message="Rate limit exceeded",
                    error_code="RATE_LIMITED"
                ).dict(),
                headers={
                    "X-Rate-Limit-Limit": str(max_requests),
                    "X-Rate-Limit-Remaining": "0",
                    "X-Rate-Limit-Reset": str(int(reset_time)),
                }
            )
        
        # Process request
        response = await call_next(request)
        
        # Add rate limit headers
        remaining = max_requests - requests_made
        response.headers["X-Rate-Limit-Limit"] = str(max_requests)
        response.headers["X-Rate-Limit-Remaining"] = str(remaining)
        response.headers["X-Rate-Limit-Reset"] = str(int(reset_time))
        
        return response