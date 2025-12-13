"""
Comprehensive Error Handling Middleware for ISO Audit System

This middleware provides:
- Centralized error handling and categorization
- ISO 27001 compliant error logging
- Structured error responses
- Security event detection and logging

Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
"""

import logging
import traceback
import json
from datetime import datetime
from typing import Dict, Any, Optional
from fastapi import Request, Response, HTTPException
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.exc import SQLAlchemyError, IntegrityError, DataError
from pydantic import ValidationError
import uuid

from app.services.system_integration_service import system_integration_service
from app.database import SessionLocal

logger = logging.getLogger(__name__)

class AuditSystemException(Exception):
    """Base exception class for audit system errors."""
    
    def __init__(
        self,
        message: str,
        error_code: str,
        status_code: int = 400,
        details: Optional[Dict[str, Any]] = None,
        user_message: Optional[str] = None
    ):
        self.message = message
        self.error_code = error_code
        self.status_code = status_code
        self.details = details or {}
        self.user_message = user_message or message
        super().__init__(self.message)

class ValidationException(AuditSystemException):
    """Exception for data validation errors."""
    
    def __init__(self, message: str, field: str = None, value: Any = None):
        details = {}
        if field:
            details['field'] = field
        if value is not None:
            details['value'] = str(value)
            
        super().__init__(
            message=message,
            error_code="VALIDATION_ERROR",
            status_code=400,
            details=details,
            user_message="The provided data is invalid. Please check your input and try again."
        )

class AuthenticationException(AuditSystemException):
    """Exception for authentication errors."""
    
    def __init__(self, message: str = "Authentication failed"):
        super().__init__(
            message=message,
            error_code="AUTHENTICATION_FAILED",
            status_code=401,
            user_message="Authentication failed. Please check your credentials."
        )

class AuthorizationException(AuditSystemException):
    """Exception for authorization errors."""
    
    def __init__(self, message: str = "Access denied"):
        super().__init__(
            message=message,
            error_code="ACCESS_DENIED",
            status_code=403,
            user_message="You don't have permission to perform this action."
        )

class ResourceNotFoundException(AuditSystemException):
    """Exception for resource not found errors."""
    
    def __init__(self, resource_type: str, resource_id: str = None):
        message = f"{resource_type} not found"
        if resource_id:
            message += f" with ID: {resource_id}"
            
        super().__init__(
            message=message,
            error_code="RESOURCE_NOT_FOUND",
            status_code=404,
            details={'resource_type': resource_type, 'resource_id': resource_id},
            user_message=f"The requested {resource_type.lower()} could not be found."
        )

class BusinessRuleException(AuditSystemException):
    """Exception for business rule violations."""
    
    def __init__(self, message: str, rule_code: str):
        super().__init__(
            message=message,
            error_code=f"BUSINESS_RULE_VIOLATION_{rule_code}",
            status_code=422,
            details={'rule_code': rule_code},
            user_message=message
        )

class DatabaseException(AuditSystemException):
    """Exception for database errors."""
    
    def __init__(self, message: str, operation: str = None):
        super().__init__(
            message=message,
            error_code="DATABASE_ERROR",
            status_code=500,
            details={'operation': operation} if operation else {},
            user_message="A database error occurred. Please try again later."
        )

class IntegrationException(AuditSystemException):
    """Exception for module integration errors."""
    
    def __init__(self, message: str, module: str, operation: str = None):
        super().__init__(
            message=message,
            error_code="INTEGRATION_ERROR",
            status_code=500,
            details={'module': module, 'operation': operation},
            user_message="A system integration error occurred. Please try again later."
        )

class PerformanceException(AuditSystemException):
    """Exception for performance-related errors."""
    
    def __init__(self, message: str, operation: str, duration: float):
        super().__init__(
            message=message,
            error_code="PERFORMANCE_DEGRADATION",
            status_code=503,
            details={'operation': operation, 'duration_seconds': duration},
            user_message="The system is experiencing high load. Please try again later."
        )

class ComplianceException(AuditSystemException):
    """Exception for ISO compliance violations."""
    
    def __init__(self, message: str, iso_clause: str, requirement: str):
        super().__init__(
            message=message,
            error_code="COMPLIANCE_VIOLATION",
            status_code=422,
            details={'iso_clause': iso_clause, 'requirement': requirement},
            user_message=f"This action violates ISO compliance requirement: {iso_clause}"
        )

class ErrorHandlingMiddleware(BaseHTTPMiddleware):
    """
    Comprehensive error handling middleware for the audit system.
    
    Provides:
    - Centralized error processing and categorization
    - ISO 27001 compliant error logging
    - Structured error responses
    - Security event detection
    - Performance monitoring integration
    """
    
    def __init__(self, app):
        super().__init__(app)
        self.error_categories = {
            "authentication": ["AUTHENTICATION_FAILED", "TOKEN_EXPIRED", "INVALID_CREDENTIALS"],
            "authorization": ["ACCESS_DENIED", "INSUFFICIENT_PERMISSIONS", "ROLE_REQUIRED"],
            "validation": ["VALIDATION_ERROR", "INVALID_INPUT", "MISSING_REQUIRED_FIELD"],
            "database": ["DATABASE_ERROR", "CONNECTION_FAILED", "TRANSACTION_FAILED"],
            "integration": ["INTEGRATION_ERROR", "SERVICE_UNAVAILABLE", "API_ERROR"],
            "security": ["SECURITY_VIOLATION", "SUSPICIOUS_ACTIVITY", "RATE_LIMIT_EXCEEDED"],
            "performance": ["PERFORMANCE_DEGRADATION", "TIMEOUT", "RESOURCE_EXHAUSTED"],
            "compliance": ["COMPLIANCE_VIOLATION", "AUDIT_TRAIL_ERROR", "ISO_REQUIREMENT_VIOLATION"]
        }
    
    async def dispatch(self, request: Request, call_next):
        """Process request and handle any errors that occur."""
        
        # Generate request ID for tracking
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        # Extract client information
        client_ip = self._get_client_ip(request)
        user_agent = request.headers.get("user-agent", "")
        
        # Start timing the request
        start_time = datetime.utcnow()
        
        try:
            # Process the request
            response = await call_next(request)
            
            # Log successful requests for audit trail
            if hasattr(request.state, 'user_id'):
                await self._log_successful_request(
                    request, response, request_id, client_ip, user_agent, start_time
                )
            
            return response
            
        except Exception as e:
            # Handle and log the error
            return await self._handle_error(
                e, request, request_id, client_ip, user_agent, start_time
            )
    
    def _get_client_ip(self, request: Request) -> str:
        """Extract client IP address from request."""
        # Check for forwarded headers first (for load balancers/proxies)
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            return forwarded_for.split(",")[0].strip()
        
        real_ip = request.headers.get("x-real-ip")
        if real_ip:
            return real_ip
        
        # Fall back to direct client IP
        return request.client.host if request.client else "unknown"
    
    async def _handle_error(
        self,
        error: Exception,
        request: Request,
        request_id: str,
        client_ip: str,
        user_agent: str,
        start_time: datetime
    ) -> JSONResponse:
        """
        Handle and categorize errors, create appropriate responses.
        
        Args:
            error: The exception that occurred
            request: The FastAPI request object
            request_id: Unique request identifier
            client_ip: Client IP address
            user_agent: Client user agent
            start_time: Request start time
            
        Returns:
            JSONResponse: Structured error response
        """
        
        # Calculate request duration
        duration = (datetime.utcnow() - start_time).total_seconds()
        
        # Categorize and process the error
        error_info = self._categorize_error(error)
        
        # Create structured error response
        error_response = {
            "success": False,
            "error": {
                "code": error_info["code"],
                "message": error_info["user_message"],
                "request_id": request_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        }
        
        # Add details for development/debugging (exclude in production)
        if error_info.get("details"):
            error_response["error"]["details"] = error_info["details"]
        
        # Log the error for audit trail and monitoring
        await self._log_error(
            error, error_info, request, request_id, client_ip, user_agent, duration
        )
        
        # Return appropriate HTTP response
        return JSONResponse(
            status_code=error_info["status_code"],
            content=error_response
        )
    
    def _categorize_error(self, error: Exception) -> Dict[str, Any]:
        """
        Categorize error and extract relevant information.
        
        Args:
            error: The exception to categorize
            
        Returns:
            Dict: Error information including code, message, status, etc.
        """
        
        # Handle custom audit system exceptions
        if isinstance(error, AuditSystemException):
            return {
                "code": error.error_code,
                "message": error.message,
                "user_message": error.user_message,
                "status_code": error.status_code,
                "details": error.details,
                "category": self._get_error_category(error.error_code),
                "risk_level": self._get_risk_level(error.error_code)
            }
        
        # Handle FastAPI HTTP exceptions
        elif isinstance(error, HTTPException):
            return {
                "code": f"HTTP_{error.status_code}",
                "message": str(error.detail),
                "user_message": str(error.detail),
                "status_code": error.status_code,
                "details": {},
                "category": "http",
                "risk_level": "low" if error.status_code < 500 else "medium"
            }
        
        # Handle Pydantic validation errors
        elif isinstance(error, ValidationError):
            return {
                "code": "VALIDATION_ERROR",
                "message": "Input validation failed",
                "user_message": "The provided data is invalid. Please check your input.",
                "status_code": 422,
                "details": {"validation_errors": error.errors()},
                "category": "validation",
                "risk_level": "low"
            }
        
        # Handle SQLAlchemy database errors
        elif isinstance(error, SQLAlchemyError):
            return self._handle_database_error(error)
        
        # Handle unexpected errors
        else:
            logger.error(f"Unexpected error: {str(error)}\n{traceback.format_exc()}")
            return {
                "code": "INTERNAL_SERVER_ERROR",
                "message": f"An unexpected error occurred: {str(error)}",
                "user_message": "An internal server error occurred. Please try again later.",
                "status_code": 500,
                "details": {"error_type": type(error).__name__},
                "category": "system",
                "risk_level": "high"
            }
    
    def _handle_database_error(self, error: SQLAlchemyError) -> Dict[str, Any]:
        """Handle SQLAlchemy database errors."""
        
        if isinstance(error, IntegrityError):
            return {
                "code": "DATABASE_INTEGRITY_ERROR",
                "message": "Database integrity constraint violation",
                "user_message": "The operation violates data integrity rules.",
                "status_code": 409,
                "details": {"constraint_violation": True},
                "category": "database",
                "risk_level": "medium"
            }
        
        elif isinstance(error, DataError):
            return {
                "code": "DATABASE_DATA_ERROR",
                "message": "Invalid data format for database operation",
                "user_message": "The provided data format is invalid.",
                "status_code": 400,
                "details": {"data_format_error": True},
                "category": "database",
                "risk_level": "low"
            }
        
        else:
            return {
                "code": "DATABASE_ERROR",
                "message": f"Database error: {str(error)}",
                "user_message": "A database error occurred. Please try again later.",
                "status_code": 500,
                "details": {"database_error": True},
                "category": "database",
                "risk_level": "high"
            }
    
    def _get_error_category(self, error_code: str) -> str:
        """Get error category based on error code."""
        for category, codes in self.error_categories.items():
            if error_code in codes:
                return category
        return "unknown"
    
    def _get_risk_level(self, error_code: str) -> str:
        """Determine risk level based on error code."""
        high_risk_codes = [
            "AUTHENTICATION_FAILED", "ACCESS_DENIED", "SECURITY_VIOLATION",
            "DATABASE_ERROR", "COMPLIANCE_VIOLATION"
        ]
        
        medium_risk_codes = [
            "INTEGRATION_ERROR", "PERFORMANCE_DEGRADATION", "BUSINESS_RULE_VIOLATION"
        ]
        
        if error_code in high_risk_codes:
            return "high"
        elif error_code in medium_risk_codes:
            return "medium"
        else:
            return "low"
    
    async def _log_error(
        self,
        error: Exception,
        error_info: Dict[str, Any],
        request: Request,
        request_id: str,
        client_ip: str,
        user_agent: str,
        duration: float
    ):
        """Log error for audit trail and monitoring."""
        
        try:
            # Get user ID if available
            user_id = getattr(request.state, 'user_id', None)
            
            # Create database session for logging
            db = SessionLocal()
            
            try:
                # Log to system audit trail
                await system_integration_service.log_system_action(
                    db=db,
                    user_id=user_id,
                    action_type="ERROR",
                    resource_type="system",
                    ip_address=client_ip,
                    user_agent=user_agent,
                    endpoint=str(request.url.path),
                    http_method=request.method,
                    response_status=error_info["status_code"],
                    business_context=f"Error: {error_info['code']}",
                    risk_level=error_info["risk_level"],
                    request_data={
                        "error_code": error_info["code"],
                        "error_message": error_info["message"],
                        "error_category": error_info["category"],
                        "request_id": request_id,
                        "duration_seconds": duration,
                        "stack_trace": traceback.format_exc() if error_info["risk_level"] == "high" else None
                    }
                )
                
            finally:
                db.close()
                
        except Exception as log_error:
            # Don't let logging errors break the error response
            logger.error(f"Failed to log error to audit trail: {str(log_error)}")
    
    async def _log_successful_request(
        self,
        request: Request,
        response: Response,
        request_id: str,
        client_ip: str,
        user_agent: str,
        start_time: datetime
    ):
        """Log successful requests for audit trail."""
        
        try:
            # Only log significant operations (not health checks, etc.)
            if self._should_log_request(request):
                duration = (datetime.utcnow() - start_time).total_seconds()
                user_id = getattr(request.state, 'user_id', None)
                
                db = SessionLocal()
                
                try:
                    await system_integration_service.log_system_action(
                        db=db,
                        user_id=user_id,
                        action_type=request.method,
                        resource_type=self._extract_resource_type(request.url.path),
                        ip_address=client_ip,
                        user_agent=user_agent,
                        endpoint=str(request.url.path),
                        http_method=request.method,
                        response_status=response.status_code,
                        business_context="Successful API request",
                        risk_level="low",
                        request_data={
                            "request_id": request_id,
                            "duration_seconds": duration
                        }
                    )
                    
                finally:
                    db.close()
                    
        except Exception as log_error:
            logger.error(f"Failed to log successful request: {str(log_error)}")
    
    def _should_log_request(self, request: Request) -> bool:
        """Determine if request should be logged to audit trail."""
        
        # Don't log health checks and static resources
        skip_paths = ['/health', '/docs', '/openapi.json', '/favicon.ico']
        
        return not any(request.url.path.startswith(path) for path in skip_paths)
    
    def _extract_resource_type(self, path: str) -> str:
        """Extract resource type from request path."""
        
        path_parts = path.strip('/').split('/')
        
        if len(path_parts) >= 2 and path_parts[0] == 'api':
            # API paths like /api/v1/audits -> audits
            if len(path_parts) >= 3:
                return path_parts[2]
        
        # Direct paths like /audits -> audits
        if path_parts:
            return path_parts[0]
        
        return "unknown"