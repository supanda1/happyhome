"""
Security utilities for authentication and authorization.
"""

from datetime import datetime, timedelta
from typing import Any, Dict, Optional, Union

from jose import JWTError, jwt
from passlib.context import CryptContext

from .config import settings
from .logging import get_logger

logger = get_logger(__name__)

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def create_access_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT access token.
    
    Args:
        subject: The subject (usually user ID) to encode in the token
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT token string
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "access"
    }
    
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    
    logger.debug("Access token created", subject=subject, expires_at=expire)
    return encoded_jwt


def create_refresh_token(
    subject: Union[str, Any], expires_delta: Optional[timedelta] = None
) -> str:
    """
    Create a JWT refresh token.
    
    Args:
        subject: The subject (usually user ID) to encode in the token
        expires_delta: Optional custom expiration time
        
    Returns:
        Encoded JWT refresh token string
    """
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            days=settings.REFRESH_TOKEN_EXPIRE_DAYS
        )
    
    to_encode = {
        "exp": expire,
        "sub": str(subject),
        "type": "refresh"
    }
    
    encoded_jwt = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    
    logger.debug("Refresh token created", subject=subject, expires_at=expire)
    return encoded_jwt


def verify_token(token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
    """
    Verify and decode a JWT token.
    
    Args:
        token: JWT token string to verify
        token_type: Expected token type ("access" or "refresh")
        
    Returns:
        Decoded token payload or None if invalid
    """
    # Handle mock tokens in development mode
    if settings.ENVIRONMENT == "development" and token.startswith("mock-token-"):
        user_id = token.replace("mock-token-", "")
        logger.info("Accepting mock token for development", user_id=user_id)
        return {
            "sub": user_id,
            "type": token_type,
            "exp": 9999999999,  # Far future expiration
            "iat": datetime.utcnow().timestamp()
        }
    
    try:
        payload = jwt.decode(
            token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        
        # Verify token type
        if payload.get("type") != token_type:
            logger.warning(
                "Token type mismatch",
                expected=token_type,
                actual=payload.get("type")
            )
            return None
        
        # Check expiration
        exp = payload.get("exp")
        if exp is None:
            logger.warning("Token missing expiration")
            return None
        
        if datetime.utcnow() > datetime.fromtimestamp(exp):
            logger.debug("Token expired", expires_at=datetime.fromtimestamp(exp))
            return None
        
        logger.debug("Token verified successfully", subject=payload.get("sub"))
        return payload
        
    except JWTError as e:
        logger.warning("JWT verification failed", error=str(e))
        return None


def get_password_hash(password: str) -> str:
    """
    Hash a password using bcrypt.
    
    Args:
        password: Plain text password
        
    Returns:
        Hashed password string
    """
    hashed = pwd_context.hash(password)
    logger.debug("Password hashed successfully")
    return hashed


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verify a password against its hash.
    
    Args:
        plain_password: Plain text password
        hashed_password: Hashed password from database
        
    Returns:
        True if password matches, False otherwise
    """
    is_valid = pwd_context.verify(plain_password, hashed_password)
    logger.debug("Password verification", is_valid=is_valid)
    return is_valid


def validate_password_strength(password: str) -> Dict[str, Any]:
    """
    Validate password strength according to security requirements.
    
    Args:
        password: Password to validate
        
    Returns:
        Dictionary with validation results
    """
    errors = []
    requirements = {
        "min_length": False,
        "has_uppercase": False,
        "has_lowercase": False,
        "has_digit": False,
        "has_special": False,
    }
    
    # Check minimum length
    if len(password) >= settings.PASSWORD_MIN_LENGTH:
        requirements["min_length"] = True
    else:
        errors.append(f"Password must be at least {settings.PASSWORD_MIN_LENGTH} characters long")
    
    # Check for uppercase letter
    if any(c.isupper() for c in password):
        requirements["has_uppercase"] = True
    else:
        errors.append("Password must contain at least one uppercase letter")
    
    # Check for lowercase letter
    if any(c.islower() for c in password):
        requirements["has_lowercase"] = True
    else:
        errors.append("Password must contain at least one lowercase letter")
    
    # Check for digit
    if any(c.isdigit() for c in password):
        requirements["has_digit"] = True
    else:
        errors.append("Password must contain at least one digit")
    
    # Check for special character
    special_chars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    if any(c in special_chars for c in password):
        requirements["has_special"] = True
    else:
        errors.append("Password must contain at least one special character")
    
    is_valid = all(requirements.values())
    
    result = {
        "is_valid": is_valid,
        "requirements": requirements,
        "errors": errors,
        "strength_score": sum(requirements.values()) / len(requirements)
    }
    
    logger.debug("Password strength validation", is_valid=is_valid, score=result["strength_score"])
    return result


def generate_password_reset_token(email: str) -> str:
    """
    Generate a password reset token.
    
    Args:
        email: User email address
        
    Returns:
        Password reset token
    """
    expire = datetime.utcnow() + timedelta(hours=1)  # 1 hour expiry
    to_encode = {
        "exp": expire,
        "sub": email,
        "type": "password_reset"
    }
    
    token = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    
    logger.debug("Password reset token generated", email=email, expires_at=expire)
    return token


def verify_password_reset_token(token: str) -> Optional[str]:
    """
    Verify a password reset token and return the email.
    
    Args:
        token: Password reset token
        
    Returns:
        Email address if token is valid, None otherwise
    """
    payload = verify_token(token, token_type="password_reset")
    if payload:
        return payload.get("sub")
    return None


def generate_email_verification_token(email: str) -> str:
    """
    Generate an email verification token.
    
    Args:
        email: User email address
        
    Returns:
        Email verification token
    """
    expire = datetime.utcnow() + timedelta(days=7)  # 7 days expiry
    to_encode = {
        "exp": expire,
        "sub": email,
        "type": "email_verification"
    }
    
    token = jwt.encode(
        to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM
    )
    
    logger.debug("Email verification token generated", email=email, expires_at=expire)
    return token


def verify_email_verification_token(token: str) -> Optional[str]:
    """
    Verify an email verification token and return the email.
    
    Args:
        token: Email verification token
        
    Returns:
        Email address if token is valid, None otherwise
    """
    payload = verify_token(token, token_type="email_verification")
    if payload:
        return payload.get("sub")
    return None