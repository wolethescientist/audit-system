from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, text
from datetime import datetime, timedelta
from typing import List
import logging
from app.database import get_db
from app.models import (
    Audit, AuditFinding, AuditFollowup, User, AuditStatus, FindingSeverity,
    RiskAssessment, RiskCategory, CAPAItem, CAPAStatus, CAPAType,
    AuditChecklist, ComplianceStatus, ISOFramework
)
from app.schemas import DashboardMetrics, RiskHeatmapData, ComplianceScores, CAPASummary
from app.auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/v1/dashboard", tags=["Dashboard"])


@router.get("/metrics", response_model=DashboardMetrics)
def get_dashboard_metrics(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Audit counts
        total_audits = db.query(Audit).count()
        planned_audits = db.query(Audit).filter(Audit.status == AuditStatus.PLANNED).count()
        executing_audits = db.query(Audit).filter(Audit.status == AuditStatus.EXECUTING).count()
        reporting_audits = db.query(Audit).filter(Audit.status == AuditStatus.REPORTING).count()
        followup_audits = db.query(Audit).filter(Audit.status == AuditStatus.FOLLOWUP).count()
        closed_audits = db.query(Audit).filter(Audit.status == AuditStatus.CLOSED).count()

        # Findings
        total_findings = db.query(AuditFinding).count()
        critical_findings = db.query(AuditFinding).filter(AuditFinding.severity == FindingSeverity.CRITICAL).count()
        high_findings = db.query(AuditFinding).filter(AuditFinding.severity == FindingSeverity.HIGH).count()
        medium_findings = db.query(AuditFinding).filter(AuditFinding.severity == FindingSeverity.MEDIUM).count()
        low_findings = db.query(AuditFinding).filter(AuditFinding.severity == FindingSeverity.LOW).count()
        open_findings = db.query(AuditFinding).filter(AuditFinding.status == "open").count()

        # Compliance score
        compliance_result = db.query(func.avg(AuditChecklist.compliance_score)).filter(
            AuditChecklist.compliance_status != ComplianceStatus.NOT_ASSESSED
        ).scalar()
        overall_compliance_score = round(float(compliance_result) if compliance_result else 0, 1)

        # Risk metrics
        total_risks = db.query(RiskAssessment).count()
        critical_risks = db.query(RiskAssessment).filter(RiskAssessment.risk_category == RiskCategory.CRITICAL).count()
        high_risks = db.query(RiskAssessment).filter(RiskAssessment.risk_category == RiskCategory.HIGH).count()

        # CAPA metrics
        total_capa = db.query(CAPAItem).count()
        open_capa = db.query(CAPAItem).filter(CAPAItem.status == CAPAStatus.OPEN).count()
        overdue_capa = db.query(CAPAItem).filter(
            CAPAItem.due_date < datetime.utcnow(),
            CAPAItem.status.in_([CAPAStatus.OPEN, CAPAStatus.IN_PROGRESS])
        ).count()

        # Followups
        overdue_followups = db.query(AuditFollowup).filter(
            AuditFollowup.due_date < datetime.utcnow(),
            AuditFollowup.status != "completed"
        ).count()

        return DashboardMetrics(
            total_audits=total_audits,
            planned_audits=planned_audits,
            executing_audits=executing_audits,
            reporting_audits=reporting_audits,
            followup_audits=followup_audits,
            closed_audits=closed_audits,
            total_findings=total_findings,
            open_findings=open_findings,
            critical_findings=critical_findings,
            high_findings=high_findings,
            medium_findings=medium_findings,
            low_findings=low_findings,
            overall_compliance_score=overall_compliance_score,
            total_risks=total_risks,
            critical_risks=critical_risks,
            high_risks=high_risks,
            total_capa=total_capa,
            open_capa=open_capa,
            overdue_capa=overdue_capa,
            overdue_followups=overdue_followups
        )
    except Exception as e:
        logger.error(f"Dashboard metrics error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/risk-heatmap", response_model=List[RiskHeatmapData])
def get_risk_heatmap(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
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

        return [
            RiskHeatmapData(
                likelihood=r.likelihood_score,
                impact=r.impact_score,
                count=r.count,
                risk_category=r.risk_category.value if hasattr(r.risk_category, 'value') else r.risk_category,
                risk_rating=r.likelihood_score * r.impact_score
            ) for r in risks
        ]
    except Exception as e:
        logger.error(f"Risk heatmap error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/compliance-scores", response_model=ComplianceScores)
def get_compliance_scores(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        # Use raw SQL to handle both uppercase and lowercase enum values
        query = text("""
            SELECT 
                f.name,
                f.version,
                COALESCE(AVG(c.compliance_score), 0) as avg_score,
                COUNT(c.id) as total_controls,
                SUM(CASE WHEN UPPER(c.compliance_status::text) = 'COMPLIANT' THEN 1 ELSE 0 END) as compliant,
                SUM(CASE WHEN UPPER(c.compliance_status::text) = 'NON_COMPLIANT' THEN 1 ELSE 0 END) as non_compliant
            FROM iso_frameworks f
            LEFT JOIN audit_checklists c ON f.id = c.framework_id
            WHERE c.compliance_status IS NULL OR UPPER(c.compliance_status::text) != 'NOT_ASSESSED'
            GROUP BY f.id, f.name, f.version
        """)
        results = db.execute(query).fetchall()

        frameworks = []
        total_score = 0
        for r in results:
            avg = round(float(r.avg_score) if r.avg_score else 0, 1)
            total_controls = r.total_controls or 0
            compliant = r.compliant or 0
            pct = round((compliant / total_controls * 100) if total_controls > 0 else 0, 1)
            frameworks.append({
                "framework_name": r.name,
                "framework_version": r.version,
                "compliance_score": avg,
                "compliance_percentage": pct,
                "total_controls": total_controls,
                "compliant_controls": compliant,
                "non_compliant_controls": r.non_compliant or 0
            })
            total_score += avg

        overall = round(total_score / len(results), 1) if results else 0
        return ComplianceScores(overall_compliance_score=overall, frameworks=frameworks)
    except Exception as e:
        logger.error(f"Compliance scores error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/capa-summary", response_model=CAPASummary)
def get_capa_summary(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    try:
        now = datetime.utcnow()
        next_week = now + timedelta(days=7)

        # Use raw SQL to handle both uppercase and lowercase enum values
        query = text("""
            SELECT 
                COUNT(*) as total_capa,
                SUM(CASE WHEN UPPER(status::text) = 'OPEN' THEN 1 ELSE 0 END) as open_capa,
                SUM(CASE WHEN UPPER(status::text) = 'IN_PROGRESS' THEN 1 ELSE 0 END) as in_progress,
                SUM(CASE WHEN UPPER(status::text) = 'PENDING_VERIFICATION' THEN 1 ELSE 0 END) as pending_ver,
                SUM(CASE WHEN UPPER(status::text) = 'CLOSED' THEN 1 ELSE 0 END) as closed_capa,
                SUM(CASE WHEN due_date < :now AND UPPER(status::text) IN ('OPEN', 'IN_PROGRESS') THEN 1 ELSE 0 END) as overdue,
                SUM(CASE WHEN due_date BETWEEN :now AND :next_week AND UPPER(status::text) IN ('OPEN', 'IN_PROGRESS') THEN 1 ELSE 0 END) as due_soon,
                SUM(CASE WHEN UPPER(capa_type::text) IN ('CORRECTIVE', 'BOTH') THEN 1 ELSE 0 END) as corrective,
                SUM(CASE WHEN UPPER(capa_type::text) IN ('PREVENTIVE', 'BOTH') THEN 1 ELSE 0 END) as preventive,
                SUM(CASE WHEN effectiveness_confirmed = true THEN 1 ELSE 0 END) as effectiveness_confirmed,
                SUM(CASE WHEN UPPER(status::text) = 'PENDING_VERIFICATION' AND (effectiveness_confirmed = false OR effectiveness_confirmed IS NULL) THEN 1 ELSE 0 END) as pending_review
            FROM capa_items
        """)
        result = db.execute(query, {"now": now, "next_week": next_week}).fetchone()

        # Calculate avg completion days
        avg_query = text("""
            SELECT AVG(EXTRACT(DAY FROM (actual_completion_date - created_at))) as avg_days
            FROM capa_items
            WHERE UPPER(status::text) = 'CLOSED' 
            AND actual_completion_date IS NOT NULL 
            AND created_at IS NOT NULL
        """)
        avg_result = db.execute(avg_query).fetchone()
        avg_days = round(float(avg_result.avg_days), 1) if avg_result and avg_result.avg_days else 0.0

        return CAPASummary(
            total_capa=result.total_capa or 0,
            open_capa=result.open_capa or 0,
            in_progress_capa=result.in_progress or 0,
            pending_verification_capa=result.pending_ver or 0,
            closed_capa=result.closed_capa or 0,
            overdue_capa=result.overdue or 0,
            due_soon_capa=result.due_soon or 0,
            corrective_capa=result.corrective or 0,
            preventive_capa=result.preventive or 0,
            avg_completion_days=avg_days,
            effectiveness_confirmed=result.effectiveness_confirmed or 0,
            pending_effectiveness_review=result.pending_review or 0
        )
    except Exception as e:
        logger.error(f"CAPA summary error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))
