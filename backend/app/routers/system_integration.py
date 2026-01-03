"""
System Integration Router for ISO Audit System

This router provides endpoints for:
- System integrity validation
- Performance monitoring and optimization
- Audit trail management
- Error handling and diagnostics
- Module integration status

Requirements: 11.1, 11.2, 11.3, 11.4, 11.5
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
import logging

from app.database import get_db
from app.auth import get_current_user
from app.models import User, UserRole, SystemAuditLog
from app.services.system_integration_service import system_integration_service
from app.services.performance_monitoring_service import performance_monitoring_service
from app.middleware.error_handling import (
    AuthorizationException, ValidationException, ResourceNotFoundException
)

router = APIRouter(prefix="/api/v1/system", tags=["System Integration"])
logger = logging.getLogger(__name__)

@router.get("/integrity", response_model=Dict[str, Any])
async def validate_system_integrity(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Validate system integrity across all modules.
    
    Requires system administrator role.
    """
    # Check authorization
    if current_user.role != UserRole.SYSTEM_ADMIN:
        raise AuthorizationException("System administrator role required")
    
    try:
        # Perform comprehensive system integrity validation
        validation_results = await system_integration_service.validate_system_integrity(db)
        
        # Log the integrity check
        await system_integration_service.log_system_action(
            db=db,
            user_id=str(current_user.id),
            action_type="SYSTEM_INTEGRITY_CHECK",
            resource_type="system",
            business_context="Manual system integrity validation",
            risk_level="low",
            request_data=validation_results
        )
        
        return {
            "success": True,
            "data": validation_results,
            "message": "System integrity validation completed"
        }
        
    except Exception as e:
        logger.error(f"System integrity validation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Integrity validation failed: {str(e)}")

@router.get("/performance/current", response_model=Dict[str, Any])
async def get_current_performance_metrics(
    current_user: User = Depends(get_current_user)
):
    """
    Get current system performance metrics.
    
    Available to audit managers and system administrators.
    """
    # Check authorization
    if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
        raise AuthorizationException("Audit manager or system administrator role required")
    
    try:
        metrics = await performance_monitoring_service.get_current_metrics()
        
        return {
            "success": True,
            "data": metrics,
            "message": "Current performance metrics retrieved"
        }
        
    except Exception as e:
        logger.error(f"Failed to get performance metrics: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Performance metrics retrieval failed: {str(e)}")

@router.get("/performance/trends", response_model=Dict[str, Any])
async def get_performance_trends(
    hours: int = Query(24, ge=1, le=168, description="Time period in hours (1-168)"),
    current_user: User = Depends(get_current_user)
):
    """
    Get performance trends over specified time period.
    
    Available to audit managers and system administrators.
    """
    # Check authorization
    if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
        raise AuthorizationException("Audit manager or system administrator role required")
    
    try:
        trends = await performance_monitoring_service.get_performance_trends(hours=hours)
        
        return {
            "success": True,
            "data": trends,
            "message": f"Performance trends for last {hours} hours retrieved"
        }
        
    except Exception as e:
        logger.error(f"Failed to get performance trends: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Performance trends retrieval failed: {str(e)}")

@router.get("/performance/alerts", response_model=Dict[str, Any])
async def get_performance_alerts(
    hours: int = Query(24, ge=1, le=168, description="Time period in hours (1-168)"),
    level: Optional[str] = Query(None, pattern="^(warning|critical)$", description="Alert level filter"),
    current_user: User = Depends(get_current_user)
):
    """
    Get performance alerts from specified time period.
    
    Available to audit managers and system administrators.
    """
    # Check authorization
    if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
        raise AuthorizationException("Audit manager or system administrator role required")
    
    try:
        alerts = await performance_monitoring_service.get_performance_alerts(hours=hours)
        
        # Filter by level if specified
        if level:
            alerts = [alert for alert in alerts if alert.get('level') == level]
        
        return {
            "success": True,
            "data": {
                "alerts": alerts,
                "total_count": len(alerts),
                "period_hours": hours,
                "filter_level": level
            },
            "message": f"Performance alerts for last {hours} hours retrieved"
        }
        
    except Exception as e:
        logger.error(f"Failed to get performance alerts: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Performance alerts retrieval failed: {str(e)}")

@router.get("/performance/slow-queries", response_model=Dict[str, Any])
async def get_slow_queries(
    limit: int = Query(10, ge=1, le=50, description="Number of queries to return (1-50)"),
    current_user: User = Depends(get_current_user)
):
    """
    Get slowest database queries for optimization.
    
    Available to system administrators only.
    """
    # Check authorization
    if current_user.role != UserRole.SYSTEM_ADMIN:
        raise AuthorizationException("System administrator role required")
    
    try:
        slow_queries = await performance_monitoring_service.get_slow_queries(limit=limit)
        
        return {
            "success": True,
            "data": {
                "slow_queries": slow_queries,
                "count": len(slow_queries)
            },
            "message": f"Top {len(slow_queries)} slow queries retrieved"
        }
        
    except Exception as e:
        logger.error(f"Failed to get slow queries: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Slow queries retrieval failed: {str(e)}")

@router.post("/performance/optimize", response_model=Dict[str, Any])
async def optimize_system_performance(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Perform automated system performance optimization.
    
    Available to system administrators only.
    """
    # Check authorization
    if current_user.role != UserRole.SYSTEM_ADMIN:
        raise AuthorizationException("System administrator role required")
    
    try:
        # Perform optimization
        optimization_results = await performance_monitoring_service.optimize_performance(db)
        
        # Log the optimization action
        await system_integration_service.log_system_action(
            db=db,
            user_id=str(current_user.id),
            action_type="SYSTEM_OPTIMIZATION",
            resource_type="system",
            business_context="Manual system performance optimization",
            risk_level="medium",
            request_data=optimization_results
        )
        
        return {
            "success": True,
            "data": optimization_results,
            "message": "System performance optimization completed"
        }
        
    except Exception as e:
        logger.error(f"System optimization failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"System optimization failed: {str(e)}")

@router.get("/audit-trail", response_model=Dict[str, Any])
async def get_audit_trail(
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    action_type: Optional[str] = Query(None, description="Filter by action type"),
    resource_type: Optional[str] = Query(None, description="Filter by resource type"),
    risk_level: Optional[str] = Query(None, pattern="^(low|medium|high|critical)$", description="Filter by risk level"),
    hours: int = Query(24, ge=1, le=168, description="Time period in hours (1-168)"),
    limit: int = Query(100, ge=1, le=1000, description="Maximum number of records (1-1000)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get system audit trail records.
    
    Available to audit managers and system administrators.
    """
    # Check authorization
    if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
        raise AuthorizationException("Audit manager or system administrator role required")
    
    try:
        # Build query filters
        cutoff_time = datetime.utcnow() - timedelta(hours=hours)
        query = db.query(SystemAuditLog).filter(SystemAuditLog.timestamp >= cutoff_time)
        
        if user_id:
            query = query.filter(SystemAuditLog.user_id == user_id)
        
        if action_type:
            query = query.filter(SystemAuditLog.action_type == action_type)
        
        if resource_type:
            query = query.filter(SystemAuditLog.resource_type == resource_type)
        
        if risk_level:
            query = query.filter(SystemAuditLog.risk_level == risk_level)
        
        # Execute query with limit and ordering
        audit_logs = query.order_by(SystemAuditLog.timestamp.desc()).limit(limit).all()
        
        # Convert to response format
        log_records = []
        for log in audit_logs:
            log_records.append({
                "id": str(log.id),
                "user_id": str(log.user_id) if log.user_id else None,
                "action_type": log.action_type,
                "resource_type": log.resource_type,
                "resource_id": log.resource_id,
                "ip_address": log.ip_address,
                "endpoint": log.endpoint,
                "http_method": log.http_method,
                "response_status": log.response_status,
                "risk_level": log.risk_level,
                "security_event": log.security_event,
                "business_context": log.business_context,
                "timestamp": log.timestamp.isoformat(),
                "changed_fields": log.changed_fields
            })
        
        # Log the audit trail access
        await system_integration_service.log_system_action(
            db=db,
            user_id=str(current_user.id),
            action_type="AUDIT_TRAIL_ACCESS",
            resource_type="audit_log",
            business_context="Audit trail records accessed",
            risk_level="low",
            request_data={
                "filters": {
                    "user_id": user_id,
                    "action_type": action_type,
                    "resource_type": resource_type,
                    "risk_level": risk_level,
                    "hours": hours
                },
                "records_returned": len(log_records)
            }
        )
        
        return {
            "success": True,
            "data": {
                "audit_logs": log_records,
                "total_count": len(log_records),
                "filters_applied": {
                    "user_id": user_id,
                    "action_type": action_type,
                    "resource_type": resource_type,
                    "risk_level": risk_level,
                    "hours": hours
                }
            },
            "message": f"Retrieved {len(log_records)} audit trail records"
        }
        
    except Exception as e:
        logger.error(f"Failed to get audit trail: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Audit trail retrieval failed: {str(e)}")

@router.get("/modules/status", response_model=Dict[str, Any])
async def get_module_integration_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get integration status of all system modules.
    
    Available to audit managers and system administrators.
    """
    # Check authorization
    if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
        raise AuthorizationException("Audit manager or system administrator role required")
    
    try:
        # Get comprehensive system status
        integrity_results = await system_integration_service.validate_system_integrity(db)
        performance_metrics = await performance_monitoring_service.get_current_metrics()
        
        # Module-specific status checks
        module_status = {
            "audit_management": {
                "status": integrity_results.get('module_status', {}).get('audits', 'unknown'),
                "description": "Core audit workflow and management"
            },
            "risk_assessment": {
                "status": integrity_results.get('module_status', {}).get('risks', 'unknown'),
                "description": "ISO 31000/27005 compliant risk assessment"
            },
            "capa_management": {
                "status": integrity_results.get('module_status', {}).get('capa', 'unknown'),
                "description": "ISO 9001/27001 compliant CAPA tracking"
            },
            "document_control": {
                "status": "healthy",  # Assume healthy if no specific check
                "description": "ISO 9001/27001 document management"
            },
            "asset_management": {
                "status": "healthy",
                "description": "Asset lifecycle and inventory management"
            },
            "vendor_management": {
                "status": "healthy",
                "description": "Vendor evaluation and SLA tracking"
            },
            "gap_analysis": {
                "status": "healthy",
                "description": "ISO compliance gap identification"
            },
            "performance_monitoring": {
                "status": "healthy" if performance_metrics.get('monitoring_active') else "inactive",
                "description": "System performance and optimization"
            },
            "audit_trail": {
                "status": integrity_results.get('module_status', {}).get('database', 'unknown'),
                "description": "ISO 27001 compliant audit logging"
            }
        }
        
        return {
            "success": True,
            "data": {
                "overall_status": integrity_results.get('status', 'unknown'),
                "modules": module_status,
                "system_health": {
                    "issues_count": len(integrity_results.get('issues', [])),
                    "warnings_count": len(integrity_results.get('warnings', [])),
                    "performance_alerts": len(performance_monitoring_service.performance_alerts)
                },
                "last_check": integrity_results.get('timestamp')
            },
            "message": "Module integration status retrieved"
        }
        
    except Exception as e:
        logger.error(f"Failed to get module status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Module status retrieval failed: {str(e)}")

@router.post("/modules/restart-monitoring", response_model=Dict[str, Any])
async def restart_performance_monitoring(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Restart performance monitoring service.
    
    Available to system administrators only.
    """
    # Check authorization
    if current_user.role != UserRole.SYSTEM_ADMIN:
        raise AuthorizationException("System administrator role required")
    
    try:
        # Stop and restart monitoring
        performance_monitoring_service.stop_monitoring()
        performance_monitoring_service.start_monitoring()
        
        # Log the restart action
        await system_integration_service.log_system_action(
            db=db,
            user_id=str(current_user.id),
            action_type="SERVICE_RESTART",
            resource_type="monitoring_service",
            business_context="Performance monitoring service restarted",
            risk_level="medium"
        )
        
        return {
            "success": True,
            "data": {
                "monitoring_active": performance_monitoring_service.monitoring_active,
                "restart_timestamp": datetime.utcnow().isoformat()
            },
            "message": "Performance monitoring service restarted successfully"
        }
        
    except Exception as e:
        logger.error(f"Failed to restart monitoring: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Monitoring restart failed: {str(e)}")