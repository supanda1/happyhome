"""
Logging middleware for HTTP requests and responses.
"""

import time
import uuid
from typing import Callable

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from ..core.logging import get_logger

logger = get_logger(__name__)


class LoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log HTTP requests and responses with timing information.
    """
    
    def __init__(self, app, log_requests: bool = True, log_responses: bool = True):
        """
        Initialize logging middleware.
        
        Args:
            app: ASGI application
            log_requests: Whether to log incoming requests
            log_responses: Whether to log outgoing responses
        """
        super().__init__(app)
        self.log_requests = log_requests
        self.log_responses = log_responses
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request and log details.
        
        Args:
            request: FastAPI request object
            call_next: Next middleware/endpoint in chain
            
        Returns:
            Response from downstream handlers
        """
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Extract request information
        start_time = time.time()
        method = request.method
        url = str(request.url)
        path = request.url.path
        query_params = str(request.query_params) if request.query_params else None
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent")
        content_type = request.headers.get("content-type")
        content_length = request.headers.get("content-length")
        
        # Log incoming request
        if self.log_requests:
            logger.info(
                "HTTP request started",
                request_id=request_id,
                method=method,
                path=path,
                url=url,
                query_params=query_params,
                client_ip=client_ip,
                user_agent=user_agent,
                content_type=content_type,
                content_length=content_length,
            )
        
        # Process request
        try:
            response = await call_next(request)
            
            # Calculate processing time
            process_time = time.time() - start_time
            
            # Add custom headers
            response.headers["X-Request-ID"] = request_id
            response.headers["X-Response-Time"] = f"{process_time:.4f}s"
            
            # Log response
            if self.log_responses:
                logger.info(
                    "HTTP request completed",
                    request_id=request_id,
                    method=method,
                    path=path,
                    status_code=response.status_code,
                    response_time_ms=round(process_time * 1000, 2),
                    response_size=response.headers.get("content-length"),
                )
            
            return response
            
        except Exception as exc:
            # Calculate processing time for failed requests
            process_time = time.time() - start_time
            
            # Log failed request
            logger.error(
                "HTTP request failed",
                request_id=request_id,
                method=method,
                path=path,
                error=str(exc),
                error_type=type(exc).__name__,
                response_time_ms=round(process_time * 1000, 2),
            )
            
            # Re-raise the exception to be handled by error handlers
            raise
    
    def _get_client_ip(self, request: Request) -> str:
        """
        Extract client IP address from request.
        
        Args:
            request: FastAPI request object
            
        Returns:
            Client IP address
        """
        # Check for X-Forwarded-For header (common with load balancers/proxies)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            # X-Forwarded-For can contain multiple IPs, take the first one
            return forwarded_for.split(",")[0].strip()
        
        # Check for X-Real-IP header (common with Nginx)
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fall back to direct client IP
        if request.client:
            return request.client.host
        
        return "unknown"


class PerformanceLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log performance metrics for requests.
    """
    
    def __init__(self, app, slow_request_threshold: float = 1.0):
        """
        Initialize performance logging middleware.
        
        Args:
            app: ASGI application
            slow_request_threshold: Threshold in seconds to log slow requests
        """
        super().__init__(app)
        self.slow_request_threshold = slow_request_threshold
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request and log performance metrics.
        
        Args:
            request: FastAPI request object
            call_next: Next middleware/endpoint in chain
            
        Returns:
            Response from downstream handlers
        """
        start_time = time.time()
        
        # Process request
        response = await call_next(request)
        
        # Calculate processing time
        process_time = time.time() - start_time
        
        # Log slow requests
        if process_time > self.slow_request_threshold:
            request_id = getattr(request.state, "request_id", "unknown")
            logger.warning(
                "Slow request detected",
                request_id=request_id,
                method=request.method,
                path=request.url.path,
                response_time_ms=round(process_time * 1000, 2),
                threshold_ms=self.slow_request_threshold * 1000,
                status_code=response.status_code,
            )
        
        return response


class SecurityLoggingMiddleware(BaseHTTPMiddleware):
    """
    Middleware to log security-related events.
    """
    
    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        """
        Process request and log security events.
        
        Args:
            request: FastAPI request object
            call_next: Next middleware/endpoint in chain
            
        Returns:
            Response from downstream handlers
        """
        # Check for suspicious patterns
        self._check_suspicious_patterns(request)
        
        # Process request
        response = await call_next(request)
        
        # Log authentication failures
        if response.status_code == 401:
            request_id = getattr(request.state, "request_id", "unknown")
            logger.warning(
                "Authentication failure",
                request_id=request_id,
                method=request.method,
                path=request.url.path,
                client_ip=self._get_client_ip(request),
                user_agent=request.headers.get("user-agent"),
            )
        
        # Log authorization failures
        elif response.status_code == 403:
            request_id = getattr(request.state, "request_id", "unknown")
            logger.warning(
                "Authorization failure",
                request_id=request_id,
                method=request.method,
                path=request.url.path,
                client_ip=self._get_client_ip(request),
                user_agent=request.headers.get("user-agent"),
            )
        
        return response
    
    def _check_suspicious_patterns(self, request: Request) -> None:
        """
        Check for suspicious patterns in the request.
        
        Args:
            request: FastAPI request object
        """
        path = request.url.path.lower()
        query = str(request.query_params).lower()
        
        # SQL injection patterns
        sql_patterns = [
            "union select", "drop table", "insert into", "delete from",
            "or 1=1", "and 1=1", "'or'", "admin'--", "' or '1'='1"
        ]
        
        # XSS patterns
        xss_patterns = [
            "<script", "javascript:", "onerror=", "onload=", "alert(",
        ]
        
        # Path traversal patterns
        traversal_patterns = [
            "../", "..\\", "/etc/passwd", "/windows/system32",
        ]
        
        # Check for suspicious patterns
        suspicious_found = []
        for pattern in sql_patterns + xss_patterns + traversal_patterns:
            if pattern in path or pattern in query:
                suspicious_found.append(pattern)
        
        if suspicious_found:
            request_id = getattr(request.state, "request_id", "unknown")
            logger.warning(
                "Suspicious request pattern detected",
                request_id=request_id,
                method=request.method,
                path=path,
                patterns=suspicious_found,
                client_ip=self._get_client_ip(request),
                user_agent=request.headers.get("user-agent"),
            )
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request."""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        if request.client:
            return request.client.host
        
        return "unknown"