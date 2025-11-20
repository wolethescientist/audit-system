from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from app.database import get_db
from app.models import Audit, AuditFinding, AuditFollowup, User, AuditStatus, FindingSeverity
from app.schemas import AnalyticsOverview
from app.auth import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics"])

@router.get("/dashboard", response_model=AnalyticsOverview)
def get_analytics_overview(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    total_audits = db.query(Audit).count()
    planned_audits = db.query(Audit).filter(Audit.status == AuditStatus.PLANNED).count()
    executing_audits = db.query(Audit).filter(Audit.status == AuditStatus.EXECUTING).count()
    completed_audits = db.query(Audit).filter(Audit.status == AuditStatus.CLOSED).count()
    
    total_findings = db.query(AuditFinding).count()
    critical_findings = db.query(AuditFinding).filter(AuditFinding.severity == FindingSeverity.CRITICAL).count()
    
    overdue_followups = db.query(AuditFollowup).filter(
        AuditFollowup.due_date < datetime.utcnow(),
        AuditFollowup.status != "completed"
    ).count()
    
    return AnalyticsOverview(
        total_audits=total_audits,
        planned_audits=planned_audits,
        executing_audits=executing_audits,
        completed_audits=completed_audits,
        total_findings=total_findings,
        critical_findings=critical_findings,
        overdue_followups=overdue_followups
    )

@router.get("/findings-summary")
def get_findings_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    findings_by_severity = db.query(
        AuditFinding.severity,
        func.count(AuditFinding.id).label("count")
    ).group_by(AuditFinding.severity).all()
    
    return {
        "findings_by_severity": [
            {"severity": item[0].value, "count": item[1]}
            for item in findings_by_severity
        ]
    }

@router.get("/audit-completion")
def get_audit_completion_chart(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audits_by_status = db.query(
        Audit.status,
        func.count(Audit.id).label("count")
    ).group_by(Audit.status).all()
    
    return {
        "audits_by_status": [
            {"status": item[0].value, "count": item[1]}
            for item in audits_by_status
        ]
    }
