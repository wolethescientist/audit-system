from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging

from app.routers import auth, users, departments, audits, analytics, workflows, dashboard, audit_programmes, risks, capa, reports, documents, assets, vendors, gap_analysis, followups, rbac, system_integration
from app.middleware.error_handling import ErrorHandlingMiddleware
from app.services.performance_monitoring_service import performance_monitoring_service
from app.services.system_integration_service import system_integration_service

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management."""
    # Startup
    logger.info("Starting ISO Audit Management System...")
    
    # Start performance monitoring
    performance_monitoring_service.start_monitoring()
    logger.info("Performance monitoring started")
    
    # System integration validation
    from app.database import SessionLocal
    db = SessionLocal()
    try:
        validation_results = await system_integration_service.validate_system_integrity(db)
        if validation_results['status'] == 'healthy':
            logger.info("System integrity validation passed")
        else:
            logger.warning(f"System integrity issues detected: {validation_results}")
    except Exception as e:
        logger.error(f"System integrity validation failed: {str(e)}")
    finally:
        db.close()
    
    logger.info("ISO Audit Management System startup complete")
    
    yield
    
    # Shutdown
    logger.info("Shutting down ISO Audit Management System...")
    performance_monitoring_service.stop_monitoring()
    logger.info("Performance monitoring stopped")
    logger.info("ISO Audit Management System shutdown complete")

app = FastAPI(
    title="ISO Audit Management System",
    version="2.0.0",
    description="Comprehensive ISO-compliant audit management system with enhanced features",
    lifespan=lifespan
)

# Add error handling middleware first (processes responses)
app.add_middleware(ErrorHandlingMiddleware)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://audit-system-nxef.vercel.app",
        "https://audit.hikey.com.ng",
        "https://www.audit.hikey.com.ng"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all routers
app.include_router(auth.router)
app.include_router(users.router)
app.include_router(departments.router)
app.include_router(audits.router)
app.include_router(analytics.router)
app.include_router(workflows.router)
app.include_router(dashboard.router)
app.include_router(audit_programmes.router)
app.include_router(risks.router)
app.include_router(capa.router)
app.include_router(reports.router)
app.include_router(documents.router)
app.include_router(assets.router)
app.include_router(vendors.router)
app.include_router(gap_analysis.router)
app.include_router(followups.router)
app.include_router(rbac.router)
app.include_router(system_integration.router)

@app.get("/")
async def root():
    """Root endpoint with system information."""
    return {
        "message": "ISO Audit Management System API",
        "version": "2.0.0",
        "status": "operational",
        "features": [
            "ISO 19011 Compliant Audit Workflows",
            "Risk Assessment Engine (ISO 31000/27005)",
            "CAPA Management (ISO 9001/27001)",
            "AI-Powered Report Generation",
            "Document Control System",
            "Asset & Vendor Management",
            "Gap Analysis & Compliance Tracking",
            "Performance Monitoring",
            "Comprehensive Audit Trail"
        ]
    }

@app.get("/health")
async def health_check():
    """Enhanced health check with system status."""
    try:
        # Get performance metrics
        metrics = await performance_monitoring_service.get_current_metrics()
        
        # Basic database connectivity check
        from app.database import SessionLocal
        db = SessionLocal()
        try:
            from sqlalchemy import text
            db.execute(text("SELECT 1"))
            db_status = "healthy"
        except Exception as e:
            db_status = f"error: {str(e)}"
        finally:
            db.close()
        
        return {
            "status": "healthy",
            "timestamp": performance_monitoring_service._add_metric.__defaults__[0] if hasattr(performance_monitoring_service, '_add_metric') else None,
            "database": db_status,
            "monitoring": {
                "active": performance_monitoring_service.monitoring_active,
                "alerts": len(performance_monitoring_service.performance_alerts)
            },
            "version": "2.0.0"
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "degraded",
            "error": str(e),
            "version": "2.0.0"
        }

@app.get("/api/v1/system/status")
async def system_status():
    """Detailed system status endpoint."""
    try:
        # Get comprehensive system metrics
        metrics = await performance_monitoring_service.get_current_metrics()
        alerts = await performance_monitoring_service.get_performance_alerts(hours=1)
        
        # System integrity check
        from app.database import SessionLocal
        db = SessionLocal()
        try:
            integrity_results = await system_integration_service.validate_system_integrity(db)
        finally:
            db.close()
        
        return {
            "system_status": "operational",
            "performance_metrics": metrics,
            "recent_alerts": alerts,
            "integrity_check": integrity_results,
            "timestamp": performance_monitoring_service._add_metric.__defaults__[0] if hasattr(performance_monitoring_service, '_add_metric') else None
        }
        
    except Exception as e:
        logger.error(f"System status check failed: {str(e)}")
        return {
            "system_status": "error",
            "error": str(e)
        }

@app.get("/api/v1/system/performance")
async def performance_metrics():
    """Get current performance metrics."""
    try:
        current_metrics = await performance_monitoring_service.get_current_metrics()
        trends = await performance_monitoring_service.get_performance_trends(hours=6)
        slow_queries = await performance_monitoring_service.get_slow_queries(limit=5)
        
        return {
            "current_metrics": current_metrics,
            "trends": trends,
            "slow_queries": slow_queries,
            "timestamp": performance_monitoring_service._add_metric.__defaults__[0] if hasattr(performance_monitoring_service, '_add_metric') else None
        }
        
    except Exception as e:
        logger.error(f"Performance metrics retrieval failed: {str(e)}")
        return {"error": str(e)}
