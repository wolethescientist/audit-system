from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_
from sqlalchemy.exc import ProgrammingError, OperationalError
from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging
from app.database import get_db
from app.models import (
    Audit, AuditFinding, AuditFollowup, User, AuditStatus, FindingSeverity,
    RiskAssessment, RiskCategory, CAPAItem, CAPAStatus
)
from app.schemas import DashboardMetrics, RiskHeatmapData, ComplianceScores, CAPASummary
from app.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])

# Try to import optional models that may not have tables yet
try:
    from app.models import AuditChecklist, ComplianceStatus, ISOFramework
    HAS_COMPLIANCE_TABLES = True
except ImportError:
    HAS_COMPLIANCE_TABLES = False

@router.get("/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive dashboard metrics for ISO compliance tracking.
    Requirements: 1.1, 1.2, 1.3, 1.4, 1.5
    """
    try:
        # Audit counts by status
        total_audits = db.query(Audit).count()
        planned_audits = db.query(Audit).filter(Audit.status == AuditStatus.PLANNED).count()
        executing_audits = db.query(Audit).filter(Audit.status == AuditStatus.EXECUTING).count()
        reporting_audits = db.query(Audit).filter(Audit.status == AuditStatus.REPORTING).count()
        followup_audits = db.query(Audit).filter(Audit.status == AuditStatus.FOLLOWUP).count()
        closed_audits = db.query(Audit).filter(Audit.status == AuditStatus.CLOSED).count()
        
        # Non-conformities and findings
        total_findings = db.query(AuditFinding).count()
        critical_findings = db.query(AuditFinding).filter(AuditFinding.severity == FindingSeverity.CRITICAL).count()
        high_findings = db.query(AuditFinding).filter(AuditFinding.severity == FindingSeverity.HIGH).count()
        medium_findings = db.query(AuditFinding).filter(AuditFinding.severity == FindingSeverity.MEDIUM).count()
        low_findings = db.query(AuditFinding).filter(AuditFinding.severity == FindingSeverity.LOW).count()
        
        # Open findings (non-conformities)
        open_findings = db.query(AuditFinding).filter(AuditFinding.status == "open").count()
        
        # Compliance scores - calculate average compliance from checklists
        compliance_query = db.query(
            func.avg(AuditChecklist.compliance_score).label("avg_score")
        ).filter(AuditChecklist.compliance_status != ComplianceStatus.NOT_ASSESSED).first()
        
        overall_compliance_score = round(compliance_query.avg_score or 0, 1)
        
        # Risk metrics
        total_risks = db.query(RiskAssessment).count()
        critical_risks = db.query(RiskAssessment).filter(RiskAssessment.risk_category == RiskCategory.CRITICAL).count()
        high_risks = db.query(RiskAssessment).filter(RiskAssessment.risk_category == RiskCategory.HIGH).count()
        
        # CAPA metrics
        total_capa = db.query(CAPAItem).count()
        open_capa = db.query(CAPAItem).filter(CAPAItem.status == CAPAStatus.OPEN).count()
        overdue_capa = db.query(CAPAItem).filter(
            and_(
                CAPAItem.due_date < datetime.utcnow(),
                CAPAItem.status.in_([CAPAStatus.OPEN, CAPAStatus.IN_PROGRESS])
            )
        ).count()
        
        # Overdue followups
        overdue_followups = db.query(AuditFollowup).filter(
            and_(
                AuditFollowup.due_date < datetime.utcnow(),
                AuditFollowup.status != "completed"
            )
        ).count()
        
        return DashboardMetrics(
            # Audit metrics
            total_audits=total_audits,
            planned_audits=planned_audits,
            executing_audits=executing_audits,
            reporting_audits=reporting_audits,
            followup_audits=followup_audits,
            closed_audits=closed_audits,
            
            # Finding metrics
            total_findings=total_findings,
            open_findings=open_findings,
            critical_findings=critical_findings,
            high_findings=high_findings,
            medium_findings=medium_findings,
            low_findings=low_findings,
            
            # Compliance metrics
            overall_compliance_score=overall_compliance_score,
            
            # Risk metrics
            total_risks=total_risks,
            critical_risks=critical_risks,
            high_risks=high_risks,
            
            # CAPA metrics
            total_capa=total_capa,
            open_capa=open_capa,
            overdue_capa=overdue_capa,
            
            # Followup metrics
            overdue_followups=overdue_followups
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving dashboard metrics: {str(e)}")

@router.get("/risk-heatmap", response_model=List[RiskHeatmapData])
def get_risk_heatmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get risk heatmap data for likelihood × impact matrix visualization.
    Requirements: 1.2, 7.1, 7.2, 7.3
    """
    try:
        # Query risk assessments with likelihood and impact scores
        risks = db.query(
            RiskAssessment.likelihood_score,
            RiskAssessment.impact_score,
            RiskAssessment.risk_category,
            func.count(RiskAssessment.id).label("count")
        ).filter(
            RiskAssessment.status == "active"
        ).group_by(
            RiskAssessment.likelihood_score,
            RiskAssessment.impact_score,
            RiskAssessment.risk_category
        ).all()
        
        heatmap_data = []
        for risk in risks:
            heatmap_data.append(RiskHeatmapData(
                likelihood=risk.likelihood_score,
                impact=risk.impact_score,
                count=risk.count,
                risk_category=risk.risk_category.value,
                risk_rating=risk.likelihood_score * risk.impact_score
            ))
        
        return heatmap_data
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving risk heatmap data: {str(e)}")

@router.get("/compliance-scores", response_model=ComplianceScores)
def get_compliance_scores(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get ISO compliance scores by framework for tracking compliance status.
    Requirements: 1.3, 3.1, 3.2, 3.3, 16.1, 16.2
    """
    try:
        # Get compliance scores by ISO framework
        framework_scores = db.query(
            ISOFramework.name,
            ISOFramework.version,
            func.avg(AuditChecklist.compliance_score).label("avg_score"),
            func.count(AuditChecklist.id).label("total_controls"),
            func.sum(
                func.case(
                    (AuditChecklist.compliance_status == ComplianceStatus.COMPLIANT, 1),
                    else_=0
                )
            ).label("compliant_controls"),
            func.sum(
                func.case(
                    (AuditChecklist.compliance_status == ComplianceStatus.NON_COMPLIANT, 1),
                    else_=0
                )
            ).label("non_compliant_controls")
        ).join(
            AuditChecklist, ISOFramework.id == AuditChecklist.framework_id
        ).filter(
            AuditChecklist.compliance_status != ComplianceStatus.NOT_ASSESSED
        ).group_by(
            ISOFramework.id, ISOFramework.name, ISOFramework.version
        ).all()
        
        frameworks = []
        overall_score = 0
        total_frameworks = len(framework_scores)
        
        for framework in framework_scores:
            compliance_percentage = round((framework.compliant_controls / framework.total_controls * 100) if framework.total_controls > 0 else 0, 1)
            avg_score = round(framework.avg_score or 0, 1)
            
            frameworks.append({
                "framework_name": framework.name,
                "framework_version": framework.version,
                "compliance_score": avg_score,
                "compliance_percentage": compliance_percentage,
                "total_controls": framework.total_controls,
                "compliant_controls": framework.compliant_controls,
                "non_compliant_controls": framework.non_compliant_controls
            })
            
            overall_score += avg_score
        
        overall_compliance_score = round(overall_score / total_frameworks, 1) if total_frameworks > 0 else 0
        
        return ComplianceScores(
            overall_compliance_score=overall_compliance_score,
            frameworks=frameworks
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving compliance scores: {str(e)}")

@router.get("/capa-summary", response_model=CAPASummary)
def get_capa_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get CAPA summary with overdue alerts and progress indicators.
    Requirements: 1.4, 5.1, 5.2, 5.3, 5.4, 5.5
    """
    try:
        # CAPA counts by status
        total_capa = db.query(CAPAItem).count()
        open_capa = db.query(CAPAItem).filter(CAPAItem.status == CAPAStatus.OPEN).count()
        in_progress_capa = db.query(CAPAItem).filter(CAPAItem.status == CAPAStatus.IN_PROGRESS).count()
        pending_verification_capa = db.query(CAPAItem).filter(CAPAItem.status == CAPAStatus.PENDING_VERIFICATION).count()
        closed_capa = db.query(CAPAItem).filter(CAPAItem.status == CAPAStatus.CLOSED).count()
        
        # Overdue CAPA items
        overdue_capa = db.query(CAPAItem).filter(
            and_(
                CAPAItem.due_date < datetime.utcnow(),
                CAPAItem.status.in_([CAPAStatus.OPEN, CAPAStatus.IN_PROGRESS])
            )
        ).count()
        
        # CAPA items due in next 7 days
        next_week = datetime.utcnow() + timedelta(days=7)
        due_soon_capa = db.query(CAPAItem).filter(
            and_(
                CAPAItem.due_date <= next_week,
                CAPAItem.due_date >= datetime.utcnow(),
                CAPAItem.status.in_([CAPAStatus.OPEN, CAPAStatus.IN_PROGRESS])
            )
        ).count()
        
        # CAPA by type
        corrective_capa = db.query(CAPAItem).filter(
            or_(
                CAPAItem.capa_type == "corrective",
                CAPAItem.capa_type == "both"
            )
        ).count()
        
        preventive_capa = db.query(CAPAItem).filter(
            or_(
                CAPAItem.capa_type == "preventive", 
                CAPAItem.capa_type == "both"
            )
        ).count()
        
        # Average completion time for closed CAPA items (in days)
        closed_capa_with_dates = db.query(CAPAItem).filter(
            and_(
                CAPAItem.status == CAPAStatus.CLOSED,
                CAPAItem.actual_completion_date.isnot(None),
                CAPAItem.created_at.isnot(None)
            )
        ).all()
        
        avg_completion_days = 0
        if closed_capa_with_dates:
            total_days = sum([
                (capa.actual_completion_date - capa.created_at).days 
                for capa in closed_capa_with_dates
            ])
            avg_completion_days = round(total_days / len(closed_capa_with_dates), 1)
        
        # Effectiveness review metrics
        effectiveness_confirmed = db.query(CAPAItem).filter(
            CAPAItem.effectiveness_confirmed == True
        ).count()
        
        pending_effectiveness_review = db.query(CAPAItem).filter(
            and_(
                CAPAItem.status == CAPAStatus.PENDING_VERIFICATION,
                CAPAItem.effectiveness_confirmed == False
            )
        ).count()
        
        return CAPASummary(
            total_capa=total_capa,
            open_capa=open_capa,
            in_progress_capa=in_progress_capa,
            pending_verification_capa=pending_verification_capa,
            closed_capa=closed_capa,
            overdue_capa=overdue_capa,
            due_soon_capa=due_soon_capa,
            corrective_capa=corrective_capa,
            preventive_capa=preventive_capa,
            avg_completion_days=avg_completion_days,
            effectiveness_confirmed=effectiveness_confirmed,
            pending_effectiveness_review=pending_effectiveness_review
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving CAPA summary: {str(e)}")