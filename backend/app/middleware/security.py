"""
Security headers middleware to enhance application security.
"""

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from ..core.config import settings  
from ..core.logging import get_logger

logger = get_logger(__name__)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add security headers to all responses.
    
    Implements common security headers to protect against various attacks
    including XSS, clickjacking, MIME sniffing, etc.
    """
    
    def __init__(
        self,
        app,
        force_https: bool = None,
        hsts_max_age: int = 31536000,  # 1 year
        content_type_nosniff: bool = True,
        frame_options: str = "DENY",
        xss_protection: str = "1; mode=block",
        referrer_policy: str = "strict-origin-when-cross-origin",
        csp_policy: str = None,
        permissions_policy: str = None,
    ):
        """
        Initialize security headers middleware.
        
        Args:
            app: ASGI application
            force_https: Whether to force HTTPS redirects
            hsts_max_age: HSTS max age in seconds
            content_type_nosniff: Whether to add X-Content-Type-Options header
            frame_options: X-Frame-Options header value
            xss_protection: X-XSS-Protection header value
            referrer_policy: Referrer-Policy header value
            csp_policy: Content Security Policy
            permissions_policy: Permissions Policy
        """
        super().__init__(app)
        self.force_https = force_https if force_https is not None else settings.is_production
        self.hsts_max_age = hsts_max_age
        self.content_type_nosniff = content_type_nosniff
        self.frame_options = frame_options
        self.xss_protection = xss_protection
        self.referrer_policy = referrer_policy
        
        # Default CSP policy
        self.csp_policy = csp_policy or (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self' https:; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )
        
        # Default Permissions Policy
        self.permissions_policy = permissions_policy or (
            "geolocation=(), "
            "microphone=(), "
            "camera=(), "
            "magnetometer=(), "
            "gyroscope=(), "
            "fullscreen=(self), "
            "payment=()"
        )
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Process request and add security headers to response.
        
        Args:
            request: FastAPI request object
            call_next: Next middleware/endpoint in chain
            
        Returns:
            Response with security headers added
        """
        # Check for HTTPS enforcement
        if self.force_https and not self._is_secure_request(request):
            # For API requests, return an error instead of redirect
            if request.url.path.startswith("/api/"):
                from fastapi import HTTPException, status
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="HTTPS is required for this endpoint"
                )
        
        # Process request
        response = await call_next(request)
        
        # Add security headers
        self._add_security_headers(request, response)
        
        return response
    
    def _is_secure_request(self, request: Request) -> bool:
        """
        Check if request is made over HTTPS.
        
        Args:
            request: FastAPI request object
            
        Returns:
            True if request is secure
        """
        # Check scheme
        if request.url.scheme == "https":
            return True
        
        # Check for proxy headers
        forwarded_proto = request.headers.get("x-forwarded-proto")
        if forwarded_proto == "https":
            return True
        
        forwarded_ssl = request.headers.get("x-forwarded-ssl")
        if forwarded_ssl == "on":
            return True
        
        return False
    
    def _add_security_headers(self, request: Request, response: Response) -> None:
        """
        Add security headers to response.
        
        Args:
            request: FastAPI request object
            response: Response object to add headers to
        """
        # HTTPS Strict Transport Security (HSTS)
        if self._is_secure_request(request):
            response.headers["Strict-Transport-Security"] = (
                f"max-age={self.hsts_max_age}; includeSubDomains; preload"
            )
        
        # Prevent MIME type sniffing
        if self.content_type_nosniff:
            response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Clickjacking protection
        if self.frame_options:
            response.headers["X-Frame-Options"] = self.frame_options
        
        # XSS protection (legacy browsers)
        if self.xss_protection:
            response.headers["X-XSS-Protection"] = self.xss_protection
        
        # Referrer policy
        if self.referrer_policy:
            response.headers["Referrer-Policy"] = self.referrer_policy
        
        # Content Security Policy
        if self.csp_policy:
            response.headers["Content-Security-Policy"] = self.csp_policy
        
        # Permissions Policy (formerly Feature Policy)
        if self.permissions_policy:
            response.headers["Permissions-Policy"] = self.permissions_policy
        
        # Remove server information
        if "server" in response.headers:
            del response.headers["server"]
        
        # Add custom security headers
        response.headers["X-Content-Security-Policy"] = self.csp_policy
        response.headers["X-WebKit-CSP"] = self.csp_policy
        
        # Cache control for sensitive endpoints
        if self._is_sensitive_endpoint(request):
            response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
            response.headers["Pragma"] = "no-cache"
            response.headers["Expires"] = "0"
    
    def _is_sensitive_endpoint(self, request: Request) -> bool:
        """
        Check if endpoint contains sensitive information.
        
        Args:
            request: FastAPI request object
            
        Returns:
            True if endpoint is sensitive
        """
        sensitive_patterns = [
            "/api/v1/auth/",
            "/api/v1/dashboard/",
            "/api/v1/admin/",
            "/login",
            "/register",
            "/profile",
        ]
        
        path = request.url.path
        return any(pattern in path for pattern in sensitive_patterns)


class CSPMiddleware(BaseHTTPMiddleware):
    """
    Advanced Content Security Policy middleware with nonce support.
    """
    
    def __init__(
        self,
        app,
        policy: str = None,
        report_uri: str = None,
        report_only: bool = False,
        nonce_source: bool = False,
    ):
        """
        Initialize CSP middleware.
        
        Args:
            app: ASGI application
            policy: CSP policy string
            report_uri: URI for CSP violation reports
            report_only: Whether to use report-only mode
            nonce_source: Whether to generate nonces for inline scripts
        """
        super().__init__(app)
        self.policy = policy
        self.report_uri = report_uri
        self.report_only = report_only
        self.nonce_source = nonce_source
        
        # Default policy
        if not self.policy:
            self.policy = self._get_default_policy()
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Process request and add CSP header.
        
        Args:
            request: FastAPI request object
            call_next: Next middleware/endpoint in chain
            
        Returns:
            Response with CSP header
        """
        # Generate nonce if needed
        nonce = None
        if self.nonce_source:
            import secrets
            nonce = secrets.token_urlsafe(16)
            request.state.csp_nonce = nonce
        
        # Process request
        response = await call_next(request)
        
        # Build CSP policy
        policy = self.policy
        if nonce:
            policy = policy.replace("'unsafe-inline'", f"'nonce-{nonce}'")
        
        if self.report_uri:
            policy += f"; report-uri {self.report_uri}"
        
        # Add CSP header
        header_name = (
            "Content-Security-Policy-Report-Only" if self.report_only
            else "Content-Security-Policy"
        )
        response.headers[header_name] = policy
        
        return response
    
    def _get_default_policy(self) -> str:
        """Get default CSP policy."""
        return (
            "default-src 'self'; "
            "script-src 'self'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: https:; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none'; "
            "base-uri 'self'; "
            "form-action 'self'"
        )


class IPWhitelistMiddleware(BaseHTTPMiddleware):
    """
    IP whitelist middleware for restricting access to specific IPs.
    """
    
    def __init__(
        self,
        app,
        allowed_ips: list = None,
        allowed_networks: list = None,
        admin_only_paths: list = None,
    ):
        """
        Initialize IP whitelist middleware.
        
        Args:
            app: ASGI application
            allowed_ips: List of allowed IP addresses
            allowed_networks: List of allowed network ranges (CIDR)
            admin_only_paths: Paths that require IP whitelisting
        """
        super().__init__(app)
        self.allowed_ips = allowed_ips or []
        self.allowed_networks = allowed_networks or []
        self.admin_only_paths = admin_only_paths or [
            "/admin",
            "/api/v1/admin/",
            "/api/v1/dashboard/",
        ]
    
    async def dispatch(self, request: Request, call_next) -> Response:
        """
        Check IP whitelist and process request.
        
        Args:
            request: FastAPI request object
            call_next: Next middleware/endpoint in chain
            
        Returns:
            Response or forbidden error
        """
        # Check if path requires IP whitelisting
        if not self._requires_ip_check(request):
            return await call_next(request)
        
        # Get client IP
        client_ip = self._get_client_ip(request)
        
        # Check if IP is allowed
        if not self._is_ip_allowed(client_ip):
            logger.warning(
                "Blocked request from unauthorized IP",
                client_ip=client_ip,
                path=request.url.path,
                user_agent=request.headers.get("user-agent"),
            )
            
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied from this IP address"
            )
        
        return await call_next(request)
    
    def _requires_ip_check(self, request: Request) -> bool:
        """Check if request path requires IP whitelisting."""
        path = request.url.path
        return any(admin_path in path for admin_path in self.admin_only_paths)
    
    def _get_client_ip(self, request: Request) -> str:
        """Get client IP address."""
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        return request.client.host if request.client else "unknown"
    
    def _is_ip_allowed(self, ip: str) -> bool:
        """Check if IP is in allowed list or networks."""
        # Check exact IP matches
        if ip in self.allowed_ips:
            return True
        
        # Check network ranges (simplified - would need ipaddress module for full CIDR support)
        for network in self.allowed_networks:
            if self._ip_in_network(ip, network):
                return True
        
        return False
    
    def _ip_in_network(self, ip: str, network: str) -> bool:
        """Simple network check (implement proper CIDR checking in production)."""
        # This is a simplified implementation
        # In production, use the ipaddress module for proper CIDR checking
        if "/" not in network:
            return ip == network
        
        # Simple subnet matching (implement properly with ipaddress module)
        network_base = network.split("/")[0]
        return ip.startswith(".".join(network_base.split(".")[:-1]))


logger.info("Security middleware modules loaded successfully")