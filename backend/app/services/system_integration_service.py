"""
System Integration Service for ISO Audit System Enhancement

This service provides comprehensive system integration capabilities including:
- Centralized error handling and validation
- ISO 27001 compliant audit trail logging
- Performance monitoring and optimization
- Module integration coordination

Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
"""

import logging
import time
import traceback
import json
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List, Union
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from sqlalchemy import text, func
import psutil
import asyncio
from functools import wraps

from app.models import (
    SystemAuditLog, User, Audit, RiskAssessment, CAPAItem, 
    DocumentRepository, Asset, Vendor, GapAnalysis, CAPAStatus
)
from app.database import SessionLocal, engine

logger = logging.getLogger(__name__)

class SystemIntegrationService:
    """
    Comprehensive system integration service for ISO compliance and performance optimization.
    
    Implements:
    - ISO 27001 A.12.4 compliant audit trail logging
    - Centralized error handling with proper categorization
    - Performance monitoring and bottleneck identification
    - Cross-module integration validation
    """
    
    def __init__(self):
        """Initialize system integration service."""
        self.performance_metrics = {}
        self.error_categories = {
            "AUTHENTICATION": "Authentication and authorization errors",
            "VALIDATION": "Data validation and business rule violations",
            "DATABASE": "Database connectivity and transaction errors",
            "INTEGRATION": "Module integration and API errors",
            "SECURITY": "Security-related events and violations",
            "PERFORMANCE": "Performance degradation and resource issues",
            "COMPLIANCE": "ISO compliance and audit trail violations"
        }
        
    async def log_system_action(
        self,
        db: Session,
        user_id: Optional[str],
        action_type: str,
        resource_type: str,
        resource_id: Optional[str] = None,
        before_values: Optional[Dict] = None,
        after_values: Optional[Dict] = None,
        audit_id: Optional[str] = None,
        ip_address: Optional[str] = None,
        user_agent: Optional[str] = None,
        endpoint: Optional[str] = None,
        http_method: Optional[str] = None,
        request_data: Optional[Dict] = None,
        response_status: Optional[int] = None,
        business_context: Optional[str] = None,
        risk_level: str = "low"
    ) -> SystemAuditLog:
        """
        Log system action for ISO 27001 A.12.4 compliance.
        
        Creates immutable audit trail records for all system activities.
        
        Args:
            db: Database session
            user_id: ID of user performing action
            action_type: Type of action (CREATE, READ, UPDATE, DELETE, LOGIN, etc.)
            resource_type: Type of resource affected
            resource_id: ID of affected resource
            before_values: Previous state of record
            after_values: New state of record
            audit_id: Related audit ID if applicable
            ip_address: Client IP address
            user_agent: Client user agent
            endpoint: API endpoint called
            http_method: HTTP method used
            request_data: Sanitized request payload
            response_status: HTTP response status
            business_context: Business reason for action
            risk_level: Security risk level (low, medium, high, critical)
            
        Returns:
            SystemAuditLog: Created audit log entry
        """
        try:
            # Sanitize sensitive data from request
            sanitized_request = self._sanitize_request_data(request_data) if request_data else None
            
            # Calculate changed fields if before/after values provided
            changed_fields = []
            if before_values and after_values:
                changed_fields = [
                    field for field in after_values.keys()
                    if field in before_values and before_values[field] != after_values[field]
                ]
            
            # Determine if this is a security event
            security_event = self._is_security_event(action_type, resource_type, risk_level)
            
            # Create audit log entry
            audit_log = SystemAuditLog(
                user_id=user_id,
                action_type=action_type,
                resource_type=resource_type,
                resource_id=resource_id,
                table_name=self._get_table_name(resource_type),
                before_values=before_values,
                after_values=after_values,
                changed_fields=changed_fields,
                endpoint=endpoint,
                http_method=http_method,
                request_data=sanitized_request,
                response_status=response_status,
                audit_id=audit_id,
                business_context=business_context,
                ip_address=ip_address,
                user_agent=user_agent,
                risk_level=risk_level,
                security_event=security_event,
                timestamp=datetime.utcnow()
            )
            
            db.add(audit_log)
            db.commit()
            
            # Log security events separately for monitoring
            if security_event:
                logger.warning(
                    f"Security event logged: {action_type} on {resource_type} "
                    f"by user {user_id} from {ip_address}"
                )
            
            return audit_log
            
        except Exception as e:
            logger.error(f"Failed to create audit log: {str(e)}")
            db.rollback()
            # Don't raise exception to avoid breaking main operation
            return None
    
    def _sanitize_request_data(self, request_data: Dict) -> Dict:
        """
        Sanitize request data by removing sensitive information.
        
        Args:
            request_data: Original request data
            
        Returns:
            Dict: Sanitized request data
        """
        if not request_data:
            return {}
            
        sensitive_fields = [
            'password', 'token', 'secret', 'key', 'authorization',
            'api_key', 'private_key', 'credential', 'auth'
        ]
        
        sanitized = {}
        for key, value in request_data.items():
            if any(sensitive in key.lower() for sensitive in sensitive_fields):
                sanitized[key] = "[REDACTED]"
            elif isinstance(value, dict):
                sanitized[key] = self._sanitize_request_data(value)
            else:
                sanitized[key] = value
                
        return sanitized
    
    def _is_security_event(self, action_type: str, resource_type: str, risk_level: str) -> bool:
        """
        Determine if an action constitutes a security event.
        
        Args:
            action_type: Type of action performed
            resource_type: Type of resource affected
            risk_level: Risk level of the action
            
        Returns:
            bool: True if this is a security event
        """
        security_actions = ['LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PERMISSION_DENIED', 'DELETE']
        security_resources = ['user', 'role', 'permission', 'audit_log']
        
        return (
            action_type in security_actions or
            resource_type in security_resources or
            risk_level in ['high', 'critical']
        )
    
    def _get_table_name(self, resource_type: str) -> str:
        """
        Map resource type to database table name.
        
        Args:
            resource_type: Type of resource
            
        Returns:
            str: Database table name
        """
        table_mapping = {
            'audit': 'audits',
            'user': 'users',
            'finding': 'audit_findings',
            'evidence': 'audit_evidence',
            'risk': 'risk_assessments',
            'capa': 'capa_items',
            'document': 'document_repository',
            'asset': 'assets',
            'vendor': 'vendors',
            'gap_analysis': 'gap_analysis',
            'workflow': 'workflows'
        }
        
        return table_mapping.get(resource_type, resource_type)
    
    @asynccontextmanager
    async def performance_monitor(self, operation_name: str, db: Session = None):
        """
        Context manager for performance monitoring.
        
        Args:
            operation_name: Name of operation being monitored
            db: Database session for logging
        """
        start_time = time.time()
        start_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
        
        try:
            yield
        finally:
            end_time = time.time()
            end_memory = psutil.Process().memory_info().rss / 1024 / 1024  # MB
            
            duration = end_time - start_time
            memory_delta = end_memory - start_memory
            
            # Store performance metrics
            self.performance_metrics[operation_name] = {
                'duration_seconds': duration,
                'memory_delta_mb': memory_delta,
                'timestamp': datetime.utcnow().isoformat()
            }
            
            # Log performance issues
            if duration > 5.0:  # Operations taking more than 5 seconds
                logger.warning(
                    f"Performance issue detected: {operation_name} took {duration:.2f}s"
                )
                
                if db:
                    await self.log_system_action(
                        db=db,
                        user_id=None,
                        action_type="PERFORMANCE_ISSUE",
                        resource_type="system",
                        business_context=f"Slow operation: {operation_name}",
                        risk_level="medium",
                        request_data={
                            'operation': operation_name,
                            'duration_seconds': duration,
                            'memory_delta_mb': memory_delta
                        }
                    )
    
    def performance_decorator(self, operation_name: str):
        """
        Decorator for automatic performance monitoring.
        
        Args:
            operation_name: Name of operation being monitored
        """
        def decorator(func):
            @wraps(func)
            async def wrapper(*args, **kwargs):
                async with self.performance_monitor(operation_name):
                    return await func(*args, **kwargs)
            return wrapper
        return decorator
    
    async def validate_system_integrity(self, db: Session) -> Dict[str, Any]:
        """
        Validate system integrity across all modules.
        
        Args:
            db: Database session
            
        Returns:
            Dict: Validation results with any issues found
        """
        validation_results = {
            'status': 'healthy',
            'issues': [],
            'warnings': [],
            'module_status': {},
            'timestamp': datetime.utcnow().isoformat()
        }
        
        try:
            # Validate database connectivity
            db.execute(text("SELECT 1"))
            validation_results['module_status']['database'] = 'healthy'
            
            # Validate audit data integrity
            audit_issues = await self._validate_audit_integrity(db)
            if audit_issues:
                validation_results['issues'].extend(audit_issues)
                validation_results['module_status']['audits'] = 'issues_found'
            else:
                validation_results['module_status']['audits'] = 'healthy'
            
            # Validate risk assessment integrity
            risk_issues = await self._validate_risk_integrity(db)
            if risk_issues:
                validation_results['issues'].extend(risk_issues)
                validation_results['module_status']['risks'] = 'issues_found'
            else:
                validation_results['module_status']['risks'] = 'healthy'
            
            # Validate CAPA integrity
            capa_issues = await self._validate_capa_integrity(db)
            if capa_issues:
                validation_results['issues'].extend(capa_issues)
                validation_results['module_status']['capa'] = 'issues_found'
            else:
                validation_results['module_status']['capa'] = 'healthy'
            
            # Check for orphaned records
            orphan_issues = await self._check_orphaned_records(db)
            if orphan_issues:
                validation_results['warnings'].extend(orphan_issues)
            
            # Overall status determination
            if validation_results['issues']:
                validation_results['status'] = 'issues_found'
            elif validation_results['warnings']:
                validation_results['status'] = 'warnings'
                
        except Exception as e:
            logger.error(f"System integrity validation failed: {str(e)}")
            validation_results['status'] = 'error'
            validation_results['issues'].append(f"Validation error: {str(e)}")
        
        return validation_results
    
    async def _validate_audit_integrity(self, db: Session) -> List[str]:
        """Validate audit data integrity."""
        issues = []
        
        try:
            # Check for audits without required ISO 19011 fields
            incomplete_audits = db.query(Audit).filter(
                (Audit.audit_objectives.is_(None)) |
                (Audit.audit_criteria.is_(None)) |
                (Audit.audit_scope_detailed.is_(None))
            ).count()
            
            if incomplete_audits > 0:
                issues.append(f"{incomplete_audits} audits missing required ISO 19011 fields")
            
            # Check for audits with invalid status transitions
            invalid_status = db.query(Audit).filter(
                Audit.status.notin_(['planned', 'initiated', 'preparation', 'executing', 'reporting', 'followup', 'closed'])
            ).count()
            
            if invalid_status > 0:
                issues.append(f"{invalid_status} audits with invalid status values")
                
        except Exception as e:
            issues.append(f"Audit validation error: {str(e)}")
        
        return issues
    
    async def _validate_risk_integrity(self, db: Session) -> List[str]:
        """Validate risk assessment data integrity."""
        issues = []
        
        try:
            # Check for risks with invalid likelihood/impact scores
            invalid_risks = db.query(RiskAssessment).filter(
                (RiskAssessment.likelihood_score < 1) |
                (RiskAssessment.likelihood_score > 5) |
                (RiskAssessment.impact_score < 1) |
                (RiskAssessment.impact_score > 5)
            ).count()
            
            if invalid_risks > 0:
                issues.append(f"{invalid_risks} risks with invalid likelihood/impact scores")
            
            # Check for risks with incorrect calculated ratings
            miscalculated_risks = db.query(RiskAssessment).filter(
                RiskAssessment.risk_rating != (RiskAssessment.likelihood_score * RiskAssessment.impact_score)
            ).count()
            
            if miscalculated_risks > 0:
                issues.append(f"{miscalculated_risks} risks with incorrect calculated ratings")
                
        except Exception as e:
            issues.append(f"Risk validation error: {str(e)}")
        
        return issues
    
    async def _validate_capa_integrity(self, db: Session) -> List[str]:
        """Validate CAPA data integrity."""
        issues = []
        
        try:
            # Check for overdue CAPA items
            overdue_capa = db.query(CAPAItem).filter(
                CAPAItem.due_date < datetime.utcnow(),
                CAPAItem.status.notin_([CAPAStatus.CLOSED.value])
            ).count()
            
            if overdue_capa > 0:
                issues.append(f"{overdue_capa} CAPA items are overdue")
            
            # Check for CAPA items without root cause analysis
            missing_rca = db.query(CAPAItem).filter(
                CAPAItem.root_cause_analysis.is_(None),
                CAPAItem.status != CAPAStatus.OPEN.value
            ).count()
            
            if missing_rca > 0:
                issues.append(f"{missing_rca} CAPA items missing root cause analysis")
                
        except Exception as e:
            issues.append(f"CAPA validation error: {str(e)}")
        
        return issues
    
    async def _check_orphaned_records(self, db: Session) -> List[str]:
        """Check for orphaned records across modules."""
        warnings = []
        
        try:
            # Check for evidence without linked audits
            orphaned_evidence = db.execute(text("""
                SELECT COUNT(*) FROM audit_evidence ae
                LEFT JOIN audits a ON ae.audit_id = a.id
                WHERE a.id IS NULL
            """)).scalar()
            
            if orphaned_evidence > 0:
                warnings.append(f"{orphaned_evidence} evidence records without linked audits")
            
            # Check for findings without linked audits
            orphaned_findings = db.execute(text("""
                SELECT COUNT(*) FROM audit_findings af
                LEFT JOIN audits a ON af.audit_id = a.id
                WHERE a.id IS NULL
            """)).scalar()
            
            if orphaned_findings > 0:
                warnings.append(f"{orphaned_findings} findings without linked audits")
                
        except Exception as e:
            warnings.append(f"Orphaned records check error: {str(e)}")
        
        return warnings
    
    async def get_performance_metrics(self) -> Dict[str, Any]:
        """
        Get current performance metrics.
        
        Returns:
            Dict: Performance metrics and system health data
        """
        try:
            # System resource metrics
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            
            # Database connection pool status
            db_pool_status = {
                'pool_size': engine.pool.size(),
                'checked_in': engine.pool.checkedin(),
                'checked_out': engine.pool.checkedout(),
                'overflow': engine.pool.overflow(),
                'invalid': engine.pool.invalid()
            }
            
            return {
                'system_resources': {
                    'cpu_percent': cpu_percent,
                    'memory_percent': memory.percent,
                    'memory_available_gb': memory.available / (1024**3),
                    'disk_percent': disk.percent,
                    'disk_free_gb': disk.free / (1024**3)
                },
                'database_pool': db_pool_status,
                'operation_metrics': self.performance_metrics,
                'timestamp': datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Failed to get performance metrics: {str(e)}")
            return {'error': str(e), 'timestamp': datetime.utcnow().isoformat()}
    
    async def optimize_database_performance(self, db: Session) -> Dict[str, Any]:
        """
        Optimize database performance through maintenance operations.
        
        Args:
            db: Database session
            
        Returns:
            Dict: Optimization results
        """
        optimization_results = {
            'operations_performed': [],
            'performance_improvements': {},
            'timestamp': datetime.utcnow().isoformat()
        }
        
        try:
            # Update table statistics
            db.execute(text("ANALYZE"))
            optimization_results['operations_performed'].append('Updated table statistics')
            
            # Check for missing indexes on frequently queried columns
            missing_indexes = await self._check_missing_indexes(db)
            if missing_indexes:
                optimization_results['recommendations'] = missing_indexes
            
            # Clean up old audit logs (keep last 2 years for compliance)
            cutoff_date = datetime.utcnow() - timedelta(days=730)
            old_logs_count = db.query(SystemAuditLog).filter(
                SystemAuditLog.timestamp < cutoff_date
            ).count()
            
            if old_logs_count > 0:
                optimization_results['operations_performed'].append(
                    f"Identified {old_logs_count} old audit logs for archival"
                )
            
            db.commit()
            
        except Exception as e:
            logger.error(f"Database optimization failed: {str(e)}")
            optimization_results['error'] = str(e)
            db.rollback()
        
        return optimization_results
    
    async def _check_missing_indexes(self, db: Session) -> List[str]:
        """Check for missing database indexes."""
        recommendations = []
        
        try:
            # Check for slow queries that might benefit from indexes
            slow_query_patterns = [
                "SELECT * FROM audits WHERE status = ?",
                "SELECT * FROM risk_assessments WHERE risk_category = ?",
                "SELECT * FROM capa_items WHERE status = ? AND due_date < ?",
                "SELECT * FROM system_audit_logs WHERE user_id = ? AND timestamp > ?"
            ]
            
            # This is a simplified check - in production, you'd analyze actual query performance
            recommendations.append("Consider adding composite index on (status, created_at) for audits table")
            recommendations.append("Consider adding index on risk_category for risk_assessments table")
            recommendations.append("Consider adding composite index on (status, due_date) for capa_items table")
            
        except Exception as e:
            logger.error(f"Index check failed: {str(e)}")
        
        return recommendations

# Global instance
system_integration_service = SystemIntegrationService()