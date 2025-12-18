"""
Reports API Router for ISO 19011 Compliant Report Generation

This router provides endpoints for:
- Generating AI-powered audit reports using GEMINI
- Exporting reports in multiple formats (PDF, Word, CSV, HTML, Markdown)
- Managing report lifecycle and validation
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional
from uuid import UUID
import logging

from app.database import get_db
from app.auth import get_current_user
from app.models import User, UserRole, Audit, AuditReport
from app.services.report_generation_service import ReportGenerationService
from app.schemas import ReportResponse

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/reports", tags=["reports"])

# Lazy initialize report generation service
_report_service = None

def get_report_service():
    global _report_service
    if _report_service is None:
        _report_service = ReportGenerationService()
    return _report_service

@router.post("/generate/{audit_id}")
async def generate_audit_report(
    audit_id: UUID,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Generate ISO 19011 compliant audit report using GEMINI AI.
    
    This endpoint implements ISO 19011:2018 Clause 6.5 requirements for audit reporting.
    
    Args:
        audit_id (UUID): ID of audit to generate report for
        background_tasks (BackgroundTasks): FastAPI background tasks
        db (Session): Database session
        current_user (User): Authenticated user
        
    Returns:
        Dict[str, Any]: Report generation result with metadata and export URLs
        
    Raises:
        HTTPException: If audit not found, user unauthorized, or generation fails
    """
    try:
        # Validate user permissions
        if not _can_generate_reports(current_user):
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to generate reports"
            )
        
        # Validate audit exists and user has access
        audit = db.query(Audit).filter(Audit.id == audit_id).first()
        if not audit:
            raise HTTPException(
                status_code=404,
                detail=f"Audit with ID {audit_id} not found"
            )
        
        # Check audit access permissions
        if not _can_access_audit(current_user, audit):
            raise HTTPException(
                status_code=403,
                detail="Access denied to this audit"
            )
        
        logger.info(f"User {current_user.id} generating report for audit {audit_id}")
        
        # Generate report using AI service
        result = await get_report_service().generate_report(
            audit_id=str(audit_id),
            db=db,
            user_id=str(current_user.id)
        )
        
        return {
            "success": True,
            "message": "Report generated successfully",
            "data": result
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Report generation failed for audit {audit_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Report generation failed: {str(e)}"
        )

@router.get("/{report_id}/download/{format}")
async def download_report(
    report_id: UUID,
    format: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Download audit report in specified format for immediate download.
    
    Supported formats:
    - pdf: Professional PDF document
    - docx: Microsoft Word document
    - csv: CSV data export for analysis
    - html: Styled HTML document
    - markdown: Markdown format with metadata
    
    Args:
        report_id (UUID): ID of report to download
        format (str): Download format (pdf, docx, csv, html, markdown)
        db (Session): Database session
        current_user (User): Authenticated user
        
    Returns:
        File response for immediate download
        
    Raises:
        HTTPException: If report not found, format invalid, or download fails
    """
    from fastapi.responses import Response
    import base64
    
    try:
        # Validate user permissions
        if not _can_export_reports(current_user):
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to download reports"
            )
        
        # Validate report exists and user has access
        report = db.query(AuditReport).filter(AuditReport.id == report_id).first()
        if not report:
            raise HTTPException(
                status_code=404,
                detail=f"Report with ID {report_id} not found"
            )
        
        # Get associated audit for access control
        audit = db.query(Audit).filter(Audit.id == report.audit_id).first()
        if not audit or not _can_access_audit(current_user, audit):
            raise HTTPException(
                status_code=403,
                detail="Access denied to this report"
            )
        
        logger.info(f"User {current_user.id} downloading report {report_id} as {format}")
        
        # Generate content based on format
        if format.lower() == "pdf":
            pdf_content = await report_service._generate_pdf_content(report.content, audit)
            file_content = base64.b64decode(pdf_content)
            filename = f"audit_report_{audit.year}_{audit.title.replace(' ', '_')}.pdf"
            media_type = "application/pdf"
            
        elif format.lower() == "docx":
            docx_content = await report_service._generate_docx_content(report.content, audit)
            file_content = base64.b64decode(docx_content)
            filename = f"audit_report_{audit.year}_{audit.title.replace(' ', '_')}.docx"
            media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            
        elif format.lower() == "csv":
            csv_content = await report_service._generate_csv_content(audit, str(report_id))
            file_content = csv_content.encode('utf-8')
            filename = f"audit_data_{audit.year}_{audit.title.replace(' ', '_')}.csv"
            media_type = "text/csv"
            
        elif format.lower() == "html":
            html_content = await report_service._generate_html_content(report.content, audit)
            file_content = html_content.encode('utf-8')
            filename = f"audit_report_{audit.year}_{audit.title.replace(' ', '_')}.html"
            media_type = "text/html"
            
        elif format.lower() == "markdown":
            markdown_content = await report_service._generate_markdown_content(report.content, audit)
            file_content = markdown_content.encode('utf-8')
            filename = f"audit_report_{audit.year}_{audit.title.replace(' ', '_')}.md"
            media_type = "text/markdown"
            
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported format: {format}. Supported: pdf, docx, csv, html, markdown"
            )
        
        # Return file for download
        return Response(
            content=file_content,
            media_type=media_type,
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "Content-Length": str(len(file_content))
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Report download failed for report {report_id} to {format}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Report download failed: {str(e)}"
        )

@router.get("/")
async def get_all_reports(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get all reports accessible to the current user.
    
    Args:
        db (Session): Database session
        current_user (User): Authenticated user
        
    Returns:
        Dict[str, Any]: List of reports
    """
    try:
        # Get all reports with audit info
        reports_query = db.query(AuditReport).join(Audit, AuditReport.audit_id == Audit.id)
        
        # Filter based on user role
        if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
            if current_user.role == UserRole.AUDITOR:
                reports_query = reports_query.filter(
                    (Audit.assigned_manager_id == current_user.id) |
                    (Audit.lead_auditor_id == current_user.id) |
                    (Audit.created_by_id == current_user.id)
                )
            else:
                reports_query = reports_query.filter(Audit.department_id == current_user.department_id)
        
        reports = reports_query.all()
        
        # Build response with audit info
        result = []
        for report in reports:
            audit = db.query(Audit).filter(Audit.id == report.audit_id).first()
            created_by = db.query(User).filter(User.id == report.created_by_id).first()
            result.append({
                "id": str(report.id),
                "audit_id": str(report.audit_id),
                "audit_title": audit.title if audit else "Unknown",
                "audit_year": audit.year if audit else None,
                "version": report.version,
                "status": report.status,
                "created_at": report.created_at.isoformat() if report.created_at else None,
                "created_by_name": created_by.full_name if created_by else "Unknown",
                "content": report.content[:200] + "..." if report.content and len(report.content) > 200 else report.content
            })
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Failed to get reports: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve reports: {str(e)}"
        )

@router.get("/{report_id}")
async def get_report(
    report_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> ReportResponse:
    """
    Get audit report by ID.
    
    Args:
        report_id (UUID): Report ID
        db (Session): Database session
        current_user (User): Authenticated user
        
    Returns:
        ReportResponse: Report data
        
    Raises:
        HTTPException: If report not found or access denied
    """
    try:
        # Get report
        report = db.query(AuditReport).filter(AuditReport.id == report_id).first()
        if not report:
            raise HTTPException(
                status_code=404,
                detail=f"Report with ID {report_id} not found"
            )
        
        # Check access permissions
        audit = db.query(Audit).filter(Audit.id == report.audit_id).first()
        if not audit or not _can_access_audit(current_user, audit):
            raise HTTPException(
                status_code=403,
                detail="Access denied to this report"
            )
        
        return ReportResponse.from_orm(report)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get report {report_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve report: {str(e)}"
        )

@router.get("/audit/{audit_id}")
async def get_audit_reports(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get all reports for a specific audit.
    
    Args:
        audit_id (UUID): Audit ID
        db (Session): Database session
        current_user (User): Authenticated user
        
    Returns:
        Dict[str, Any]: List of reports for the audit
        
    Raises:
        HTTPException: If audit not found or access denied
    """
    try:
        # Validate audit exists and user has access
        audit = db.query(Audit).filter(Audit.id == audit_id).first()
        if not audit:
            raise HTTPException(
                status_code=404,
                detail=f"Audit with ID {audit_id} not found"
            )
        
        if not _can_access_audit(current_user, audit):
            raise HTTPException(
                status_code=403,
                detail="Access denied to this audit"
            )
        
        # Get all reports for the audit
        reports = db.query(AuditReport).filter(AuditReport.audit_id == audit_id).all()
        
        return {
            "success": True,
            "data": {
                "audit_id": str(audit_id),
                "audit_title": audit.title,
                "reports": [ReportResponse.from_orm(report) for report in reports]
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get reports for audit {audit_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve audit reports: {str(e)}"
        )

@router.delete("/{report_id}")
async def delete_report(
    report_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Delete audit report.
    
    Args:
        report_id (UUID): Report ID
        db (Session): Database session
        current_user (User): Authenticated user
        
    Returns:
        Dict[str, Any]: Deletion confirmation
        
    Raises:
        HTTPException: If report not found, access denied, or deletion fails
    """
    try:
        # Validate user permissions (only admins and audit managers can delete)
        if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
            raise HTTPException(
                status_code=403,
                detail="Insufficient permissions to delete reports"
            )
        
        # Get report
        report = db.query(AuditReport).filter(AuditReport.id == report_id).first()
        if not report:
            raise HTTPException(
                status_code=404,
                detail=f"Report with ID {report_id} not found"
            )
        
        # Check access permissions
        audit = db.query(Audit).filter(Audit.id == report.audit_id).first()
        if not audit or not _can_access_audit(current_user, audit):
            raise HTTPException(
                status_code=403,
                detail="Access denied to this report"
            )
        
        logger.info(f"User {current_user.id} deleting report {report_id}")
        
        # Delete report
        db.delete(report)
        db.commit()
        
        return {
            "success": True,
            "message": "Report deleted successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete report {report_id}: {str(e)}")
        raise HTTPException(
            status_code=500,
            detail=f"Failed to delete report: {str(e)}"
        )

@router.get("/formats/supported")
async def get_supported_formats(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """
    Get list of supported export formats.
    
    Args:
        current_user (User): Authenticated user
        
    Returns:
        Dict[str, Any]: List of supported formats with descriptions
    """
    return {
        "success": True,
        "data": {
            "formats": [
                {
                    "format": "pdf",
                    "description": "Professional PDF document with formatting",
                    "mime_type": "application/pdf"
                },
                {
                    "format": "docx",
                    "description": "Microsoft Word document",
                    "mime_type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                },
                {
                    "format": "csv",
                    "description": "CSV data export for analysis",
                    "mime_type": "text/csv"
                },
                {
                    "format": "html",
                    "description": "Styled HTML document",
                    "mime_type": "text/html"
                },
                {
                    "format": "markdown",
                    "description": "Markdown format with metadata",
                    "mime_type": "text/markdown"
                }
            ]
        }
    }

# Helper functions for access control

def _can_generate_reports(user: User) -> bool:
    """Check if user can generate reports."""
    allowed_roles = [
        UserRole.SYSTEM_ADMIN,
        UserRole.AUDIT_MANAGER,
        UserRole.AUDITOR
    ]
    return user.role in allowed_roles

def _can_export_reports(user: User) -> bool:
    """Check if user can export reports."""
    allowed_roles = [
        UserRole.SYSTEM_ADMIN,
        UserRole.AUDIT_MANAGER,
        UserRole.AUDITOR,
        UserRole.DEPARTMENT_HEAD,
        UserRole.VIEWER
    ]
    return user.role in allowed_roles

def _can_access_audit(user: User, audit: Audit) -> bool:
    """Check if user can access specific audit."""
    # System admins and audit managers can access all audits
    if user.role in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
        return True
    
    # Auditors can access audits they are assigned to
    if user.role == UserRole.AUDITOR:
        return (
            audit.assigned_manager_id == user.id or
            audit.lead_auditor_id == user.id or
            audit.created_by_id == user.id
        )
    
    # Department heads can access audits in their department
    if user.role == UserRole.DEPARTMENT_HEAD:
        return audit.department_id == user.department_id
    
    # Department officers can access audits in their department
    if user.role == UserRole.DEPARTMENT_OFFICER:
        return audit.department_id == user.department_id
    
    # Viewers can access audits in their department
    if user.role == UserRole.VIEWER:
        return audit.department_id == user.department_id
    
    return False