from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func, desc
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta

from app.database import get_db
from app.auth import get_current_user
from app.models import (
    User, GapAnalysis, ISOFramework, Audit, CAPAItem, AuditFinding, 
    AuditChecklist, ComplianceStatus, UserRole, Department
)
from app.schemas import ErrorResponse

router = APIRouter(prefix="/api/v1/gap-analysis", tags=["Gap Analysis"])

# Pydantic schemas for gap analysis
from pydantic import BaseModel, Field

class GapAnalysisCreate(BaseModel):
    framework_id: UUID
    audit_id: Optional[UUID] = None
    requirement_clause: str = Field(..., min_length=1, max_length=50)
    requirement_title: str = Field(..., min_length=1, max_length=200)
    requirement_description: Optional[str] = None
    current_state: str = Field(..., min_length=1)
    required_state: str = Field(..., min_length=1)
    gap_description: str = Field(..., min_length=1)
    gap_severity: str = Field(default="medium", pattern="^(critical|high|medium|low)$")
    compliance_percentage: int = Field(default=0, ge=0, le=100)
    remediation_plan: Optional[str] = None
    estimated_effort: Optional[str] = None
    estimated_cost: Optional[float] = None
    target_closure_date: Optional[datetime] = None
    responsible_person_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    priority: str = Field(default="medium", pattern="^(critical|high|medium|low)$")

class GapAnalysisUpdate(BaseModel):
    requirement_title: Optional[str] = None
    requirement_description: Optional[str] = None
    current_state: Optional[str] = None
    required_state: Optional[str] = None
    gap_description: Optional[str] = None
    gap_severity: Optional[str] = None
    compliance_percentage: Optional[int] = Field(None, ge=0, le=100)
    gap_status: Optional[str] = None
    remediation_plan: Optional[str] = None
    estimated_effort: Optional[str] = None
    estimated_cost: Optional[float] = None
    target_closure_date: Optional[datetime] = None
    actual_closure_date: Optional[datetime] = None
    responsible_person_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    priority: Optional[str] = None
    evidence_required: Optional[str] = None
    evidence_provided: Optional[str] = None
    verification_method: Optional[str] = None
    capa_id: Optional[UUID] = None

class GapAnalysisResponse(BaseModel):
    id: UUID
    framework_id: UUID
    audit_id: Optional[UUID]
    requirement_clause: str
    requirement_title: str
    requirement_description: Optional[str]
    current_state: str
    required_state: str
    gap_description: str
    gap_severity: str
    compliance_percentage: int
    gap_status: str
    remediation_plan: Optional[str]
    estimated_effort: Optional[str]
    estimated_cost: Optional[float]
    target_closure_date: Optional[datetime]
    actual_closure_date: Optional[datetime]
    capa_id: Optional[UUID]
    responsible_person_id: Optional[UUID]
    department_id: Optional[UUID]
    evidence_required: Optional[str]
    evidence_provided: Optional[str]
    verification_method: Optional[str]
    verified_by_id: Optional[UUID]
    verification_date: Optional[datetime]
    priority: str
    notes: Optional[str]
    created_by_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class FrameworkComparisonRequest(BaseModel):
    primary_framework_id: UUID
    comparison_framework_ids: List[UUID]
    include_compliance_data: Optional[bool] = True
    department_filter: Optional[UUID] = None

class FrameworkComparisonResponse(BaseModel):
    primary_framework: Dict[str, Any]
    comparison_frameworks: List[Dict[str, Any]]
    gap_summary: Dict[str, Any]
    compliance_comparison: Dict[str, Any]
    recommendations: List[Dict[str, Any]]

class AutoGapGenerationRequest(BaseModel):
    framework_ids: List[UUID]
    include_audit_findings: Optional[bool] = True
    include_checklist_data: Optional[bool] = True
    minimum_compliance_threshold: Optional[int] = 80
    severity_filter: Optional[List[str]] = None

class AutoGapGenerationResponse(BaseModel):
    audit_id: UUID
    framework_gaps: List[Dict[str, Any]]
    total_gaps_identified: int
    critical_gaps: int
    high_priority_gaps: int
    estimated_remediation_effort: str
    recommended_capa_items: List[Dict[str, Any]]

class ComplianceReportRequest(BaseModel):
    framework_ids: Optional[List[UUID]] = None
    department_ids: Optional[List[UUID]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    include_closed_gaps: Optional[bool] = False
    group_by: Optional[str] = "framework"  # framework, department, severity
    export_format: Optional[str] = "json"  # json, csv, pdf

class ComplianceReportResponse(BaseModel):
    report_id: str
    generated_at: datetime
    frameworks_analyzed: List[Dict[str, Any]]
    overall_compliance_score: float
    gap_statistics: Dict[str, Any]
    department_breakdown: List[Dict[str, Any]]
    trend_analysis: Dict[str, Any]
    recommendations: List[str]
    export_url: Optional[str] = None

class GapCAPALinkingRequest(BaseModel):
    gap_ids: List[UUID]
    capa_id: Optional[UUID] = None
    create_new_capa: Optional[bool] = False
    capa_details: Optional[Dict[str, Any]] = None

@router.get("/frameworks", response_model=List[Dict[str, Any]])
async def get_frameworks_for_comparison(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get available ISO frameworks for gap analysis comparison.
    
    Requirements: 13.1, 13.2, 16.1, 16.2, 16.3, 16.4, 16.5
    """
    try:
        frameworks = db.query(ISOFramework).filter(ISOFramework.is_active == True).all()
        
        framework_data = []
        for framework in frameworks:
            # Get gap analysis statistics for each framework
            gap_stats = db.query(
                func.count(GapAnalysis.id).label('total_gaps'),
                func.count(GapAnalysis.id).filter(GapAnalysis.gap_status == 'identified').label('open_gaps'),
                func.count(GapAnalysis.id).filter(GapAnalysis.gap_status == 'closed').label('closed_gaps'),
                func.avg(GapAnalysis.compliance_percentage).label('avg_compliance')
            ).filter(GapAnalysis.framework_id == framework.id).first()
            
            framework_data.append({
                "id": str(framework.id),
                "name": framework.name,
                "version": framework.version,
                "description": framework.description,
                "total_clauses": len(framework.clauses) if framework.clauses else 0,
                "gap_statistics": {
                    "total_gaps": gap_stats.total_gaps or 0,
                    "open_gaps": gap_stats.open_gaps or 0,
                    "closed_gaps": gap_stats.closed_gaps or 0,
                    "average_compliance": round(float(gap_stats.avg_compliance or 0), 2)
                },
                "created_at": framework.created_at.isoformat(),
                "updated_at": framework.updated_at.isoformat()
            })
        
        return framework_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve frameworks: {str(e)}"
        )

@router.post("/frameworks/compare", response_model=FrameworkComparisonResponse)
async def compare_frameworks(
    comparison_request: FrameworkComparisonRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Compare ISO frameworks to identify overlapping requirements and gaps.
    
    Requirements: 13.1, 13.2, 16.1, 16.2, 16.3, 16.4, 16.5
    """
    try:
        # Get primary framework
        primary_framework = db.query(ISOFramework).filter(
            ISOFramework.id == comparison_request.primary_framework_id
        ).first()
        
        if not primary_framework:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Primary framework not found"
            )
        
        # Get comparison frameworks
        comparison_frameworks = db.query(ISOFramework).filter(
            ISOFramework.id.in_(comparison_request.comparison_framework_ids)
        ).all()
        
        # Build comparison data
        primary_data = {
            "id": str(primary_framework.id),
            "name": primary_framework.name,
            "version": primary_framework.version,
            "clauses": primary_framework.clauses or {},
            "total_clauses": len(primary_framework.clauses) if primary_framework.clauses else 0
        }
        
        comparison_data = []
        for framework in comparison_frameworks:
            framework_gaps = db.query(GapAnalysis).filter(
                GapAnalysis.framework_id == framework.id
            ).all()
            
            comparison_data.append({
                "id": str(framework.id),
                "name": framework.name,
                "version": framework.version,
                "clauses": framework.clauses or {},
                "total_clauses": len(framework.clauses) if framework.clauses else 0,
                "gap_count": len(framework_gaps),
                "compliance_score": sum(gap.compliance_percentage for gap in framework_gaps) / len(framework_gaps) if framework_gaps else 0
            })
        
        # Calculate gap summary
        all_framework_ids = [comparison_request.primary_framework_id] + comparison_request.comparison_framework_ids
        total_gaps = db.query(GapAnalysis).filter(
            GapAnalysis.framework_id.in_(all_framework_ids)
        ).count()
        
        critical_gaps = db.query(GapAnalysis).filter(
            and_(
                GapAnalysis.framework_id.in_(all_framework_ids),
                GapAnalysis.gap_severity == 'critical'
            )
        ).count()
        
        gap_summary = {
            "total_gaps_across_frameworks": total_gaps,
            "critical_gaps": critical_gaps,
            "frameworks_compared": len(all_framework_ids),
            "comparison_date": datetime.utcnow().isoformat()
        }
        
        # Generate compliance comparison
        compliance_comparison = {}
        for framework in [primary_framework] + comparison_frameworks:
            gaps = db.query(GapAnalysis).filter(GapAnalysis.framework_id == framework.id).all()
            compliance_comparison[framework.name] = {
                "overall_compliance": sum(gap.compliance_percentage for gap in gaps) / len(gaps) if gaps else 100,
                "total_requirements": len(framework.clauses) if framework.clauses else 0,
                "gaps_identified": len(gaps),
                "critical_gaps": len([gap for gap in gaps if gap.gap_severity == 'critical'])
            }
        
        # Generate recommendations
        recommendations = [
            {
                "type": "framework_alignment",
                "priority": "high",
                "description": "Focus on critical gaps across all frameworks",
                "action": "Prioritize remediation of critical severity gaps"
            },
            {
                "type": "resource_optimization",
                "priority": "medium", 
                "description": "Identify overlapping requirements for efficient implementation",
                "action": "Look for common controls that address multiple framework requirements"
            }
        ]
        
        return FrameworkComparisonResponse(
            primary_framework=primary_data,
            comparison_frameworks=comparison_data,
            gap_summary=gap_summary,
            compliance_comparison=compliance_comparison,
            recommendations=recommendations
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to compare frameworks: {str(e)}"
        )

@router.post("/{audit_id}/generate", response_model=AutoGapGenerationResponse)
async def generate_automated_gap_analysis(
    audit_id: UUID,
    generation_request: AutoGapGenerationRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate automated gap analysis from audit findings and checklist data.
    
    Requirements: 13.1, 13.2, 13.3, 13.4
    """
    try:
        # Verify audit exists and user has access
        audit = db.query(Audit).filter(Audit.id == audit_id).first()
        if not audit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audit not found"
            )
        
        # Check user access
        if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
            if audit.created_by_id != current_user.id and audit.assigned_manager_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to generate gap analysis for this audit"
                )
        
        framework_gaps = []
        total_gaps_identified = 0
        critical_gaps = 0
        high_priority_gaps = 0
        recommended_capa_items = []
        
        for framework_id in generation_request.framework_ids:
            framework = db.query(ISOFramework).filter(ISOFramework.id == framework_id).first()
            if not framework:
                continue
            
            # Get audit checklist items for this framework
            checklist_items = []
            if generation_request.include_checklist_data:
                checklist_items = db.query(AuditChecklist).filter(
                    and_(
                        AuditChecklist.audit_id == audit_id,
                        AuditChecklist.framework_id == framework_id
                    )
                ).all()
            
            # Get audit findings
            findings = []
            if generation_request.include_audit_findings:
                findings = db.query(AuditFinding).filter(AuditFinding.audit_id == audit_id).all()
            
            # Analyze checklist compliance
            framework_gap_data = {
                "framework_id": str(framework_id),
                "framework_name": framework.name,
                "gaps_identified": [],
                "compliance_score": 0,
                "total_requirements": 0
            }
            
            # Process checklist items to identify gaps
            non_compliant_items = []
            total_items = len(checklist_items)
            compliant_items = 0
            
            for item in checklist_items:
                if item.compliance_percentage < generation_request.minimum_compliance_threshold:
                    gap_severity = "critical" if item.compliance_percentage < 50 else "high" if item.compliance_percentage < 70 else "medium"
                    
                    # Check if gap already exists
                    existing_gap = db.query(GapAnalysis).filter(
                        and_(
                            GapAnalysis.framework_id == framework_id,
                            GapAnalysis.requirement_clause == item.clause_reference,
                            GapAnalysis.audit_id == audit_id
                        )
                    ).first()
                    
                    if not existing_gap:
                        # Create new gap analysis record
                        gap_analysis = GapAnalysis(
                            framework_id=framework_id,
                            audit_id=audit_id,
                            requirement_clause=item.clause_reference,
                            requirement_title=item.clause_title,
                            requirement_description=item.description,
                            current_state=f"Current compliance: {item.compliance_percentage}%. {item.notes or 'No additional notes.'}",
                            required_state=f"Required compliance: 100% for {item.clause_title}",
                            gap_description=f"Compliance gap of {100 - item.compliance_percentage}% identified in {item.clause_reference}",
                            gap_severity=gap_severity,
                            compliance_percentage=item.compliance_percentage,
                            gap_status="identified",
                            priority=gap_severity,
                            created_by_id=current_user.id
                        )
                        
                        db.add(gap_analysis)
                        total_gaps_identified += 1
                        
                        if gap_severity == "critical":
                            critical_gaps += 1
                        elif gap_severity == "high":
                            high_priority_gaps += 1
                        
                        framework_gap_data["gaps_identified"].append({
                            "clause": item.clause_reference,
                            "title": item.clause_title,
                            "compliance_percentage": item.compliance_percentage,
                            "severity": gap_severity,
                            "gap_id": str(gap_analysis.id)
                        })
                        
                        # Generate CAPA recommendation for critical/high gaps
                        if gap_severity in ["critical", "high"]:
                            recommended_capa_items.append({
                                "gap_id": str(gap_analysis.id),
                                "clause": item.clause_reference,
                                "title": f"Address compliance gap in {item.clause_title}",
                                "description": f"Implement corrective actions to achieve full compliance with {item.clause_reference}",
                                "priority": gap_severity,
                                "estimated_effort": "2-4 weeks" if gap_severity == "high" else "4-8 weeks"
                            })
                else:
                    compliant_items += 1
            
            # Calculate framework compliance score
            framework_gap_data["compliance_score"] = (compliant_items / total_items * 100) if total_items > 0 else 100
            framework_gap_data["total_requirements"] = total_items
            
            framework_gaps.append(framework_gap_data)
        
        # Commit all gap analysis records
        db.commit()
        
        # Estimate overall remediation effort
        if critical_gaps > 5:
            estimated_effort = "6+ months"
        elif critical_gaps > 2 or high_priority_gaps > 10:
            estimated_effort = "3-6 months"
        elif high_priority_gaps > 5:
            estimated_effort = "1-3 months"
        else:
            estimated_effort = "2-4 weeks"
        
        return AutoGapGenerationResponse(
            audit_id=audit_id,
            framework_gaps=framework_gaps,
            total_gaps_identified=total_gaps_identified,
            critical_gaps=critical_gaps,
            high_priority_gaps=high_priority_gaps,
            estimated_remediation_effort=estimated_effort,
            recommended_capa_items=recommended_capa_items
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate gap analysis: {str(e)}"
        )

@router.get("/reports", response_model=ComplianceReportResponse)
async def generate_compliance_report(
    framework_ids: Optional[str] = None,
    department_ids: Optional[str] = None,
    date_from: Optional[datetime] = None,
    date_to: Optional[datetime] = None,
    include_closed_gaps: bool = False,
    group_by: str = "framework",
    export_format: str = "json",
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate comprehensive compliance reports with gap analysis data.
    
    Requirements: 13.1, 13.2, 13.3, 13.4
    """
    try:
        # Parse comma-separated IDs
        framework_id_list = []
        if framework_ids:
            framework_id_list = [UUID(id.strip()) for id in framework_ids.split(',')]
        
        department_id_list = []
        if department_ids:
            department_id_list = [UUID(id.strip()) for id in department_ids.split(',')]
        
        # Build query
        query = db.query(GapAnalysis)
        
        # Apply filters
        if framework_id_list:
            query = query.filter(GapAnalysis.framework_id.in_(framework_id_list))
        
        if department_id_list:
            query = query.filter(GapAnalysis.department_id.in_(department_id_list))
        
        if date_from:
            query = query.filter(GapAnalysis.created_at >= date_from)
        
        if date_to:
            query = query.filter(GapAnalysis.created_at <= date_to)
        
        if not include_closed_gaps:
            query = query.filter(GapAnalysis.gap_status != 'closed')
        
        gaps = query.all()
        
        # Generate report ID
        report_id = f"GAP_REPORT_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        # Analyze frameworks
        frameworks_analyzed = []
        if framework_id_list:
            frameworks = db.query(ISOFramework).filter(ISOFramework.id.in_(framework_id_list)).all()
        else:
            frameworks = db.query(ISOFramework).filter(ISOFramework.is_active == True).all()
        
        for framework in frameworks:
            framework_gaps = [gap for gap in gaps if gap.framework_id == framework.id]
            
            frameworks_analyzed.append({
                "id": str(framework.id),
                "name": framework.name,
                "version": framework.version,
                "total_gaps": len(framework_gaps),
                "critical_gaps": len([gap for gap in framework_gaps if gap.gap_severity == 'critical']),
                "high_gaps": len([gap for gap in framework_gaps if gap.gap_severity == 'high']),
                "average_compliance": sum(gap.compliance_percentage for gap in framework_gaps) / len(framework_gaps) if framework_gaps else 100
            })
        
        # Calculate overall compliance score
        overall_compliance_score = sum(gap.compliance_percentage for gap in gaps) / len(gaps) if gaps else 100
        
        # Gap statistics
        gap_statistics = {
            "total_gaps": len(gaps),
            "critical_gaps": len([gap for gap in gaps if gap.gap_severity == 'critical']),
            "high_gaps": len([gap for gap in gaps if gap.gap_severity == 'high']),
            "medium_gaps": len([gap for gap in gaps if gap.gap_severity == 'medium']),
            "low_gaps": len([gap for gap in gaps if gap.gap_severity == 'low']),
            "open_gaps": len([gap for gap in gaps if gap.gap_status == 'identified']),
            "in_progress_gaps": len([gap for gap in gaps if gap.gap_status == 'in_progress']),
            "closed_gaps": len([gap for gap in gaps if gap.gap_status == 'closed'])
        }
        
        # Department breakdown
        department_breakdown = []
        if department_id_list:
            departments = db.query(Department).filter(Department.id.in_(department_id_list)).all()
        else:
            departments = db.query(Department).all()
        
        for dept in departments:
            dept_gaps = [gap for gap in gaps if gap.department_id == dept.id]
            if dept_gaps:  # Only include departments with gaps
                department_breakdown.append({
                    "department_id": str(dept.id),
                    "department_name": dept.name,
                    "total_gaps": len(dept_gaps),
                    "critical_gaps": len([gap for gap in dept_gaps if gap.gap_severity == 'critical']),
                    "average_compliance": sum(gap.compliance_percentage for gap in dept_gaps) / len(dept_gaps)
                })
        
        # Trend analysis (simplified)
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        recent_gaps = [gap for gap in gaps if gap.created_at >= thirty_days_ago]
        
        trend_analysis = {
            "gaps_created_last_30_days": len(recent_gaps),
            "gaps_closed_last_30_days": len([gap for gap in gaps if gap.actual_closure_date and gap.actual_closure_date >= thirty_days_ago]),
            "trend_direction": "improving" if len(recent_gaps) < len(gaps) / 2 else "stable"
        }
        
        # Generate recommendations
        recommendations = []
        if gap_statistics["critical_gaps"] > 0:
            recommendations.append("Immediate attention required for critical gaps - consider emergency remediation plan")
        if overall_compliance_score < 80:
            recommendations.append("Overall compliance below 80% - implement comprehensive improvement program")
        if gap_statistics["open_gaps"] > gap_statistics["in_progress_gaps"] * 2:
            recommendations.append("Many gaps remain unaddressed - increase resource allocation for gap remediation")
        
        return ComplianceReportResponse(
            report_id=report_id,
            generated_at=datetime.utcnow(),
            frameworks_analyzed=frameworks_analyzed,
            overall_compliance_score=round(overall_compliance_score, 2),
            gap_statistics=gap_statistics,
            department_breakdown=department_breakdown,
            trend_analysis=trend_analysis,
            recommendations=recommendations,
            export_url=f"/api/v1/gap-analysis/reports/{report_id}/export/{export_format}" if export_format != "json" else None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate compliance report: {str(e)}"
        )

@router.post("/link-capa", response_model=Dict[str, Any])
async def link_gaps_to_capa(
    linking_request: GapCAPALinkingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Link gap analysis items to CAPA for remediation tracking.
    
    Requirements: 13.3, 13.4
    """
    try:
        # Verify gaps exist
        gaps = db.query(GapAnalysis).filter(GapAnalysis.id.in_(linking_request.gap_ids)).all()
        if len(gaps) != len(linking_request.gap_ids):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more gap analysis items not found"
            )
        
        capa_item = None
        
        # Link to existing CAPA or create new one
        if linking_request.capa_id:
            capa_item = db.query(CAPAItem).filter(CAPAItem.id == linking_request.capa_id).first()
            if not capa_item:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="CAPA item not found"
                )
        elif linking_request.create_new_capa and linking_request.capa_details:
            # Create new CAPA item
            from app.models import CAPAType, CAPAStatus
            
            capa_number = f"CAPA-GAP-{datetime.utcnow().strftime('%Y%m%d-%H%M%S')}"
            
            capa_item = CAPAItem(
                capa_number=capa_number,
                title=linking_request.capa_details.get('title', 'Gap Remediation CAPA'),
                description=linking_request.capa_details.get('description', 'CAPA created for gap analysis remediation'),
                capa_type=CAPAType.CORRECTIVE,
                status=CAPAStatus.OPEN,
                corrective_action=linking_request.capa_details.get('corrective_action'),
                preventive_action=linking_request.capa_details.get('preventive_action'),
                assigned_to_id=linking_request.capa_details.get('assigned_to_id'),
                due_date=linking_request.capa_details.get('due_date'),
                priority=linking_request.capa_details.get('priority', 'medium'),
                created_by_id=current_user.id
            )
            
            db.add(capa_item)
            db.flush()  # Get the ID without committing
        
        # Link gaps to CAPA
        linked_gaps = []
        for gap in gaps:
            gap.capa_id = capa_item.id
            gap.gap_status = "in_progress"
            gap.updated_at = datetime.utcnow()
            
            linked_gaps.append({
                "gap_id": str(gap.id),
                "requirement_clause": gap.requirement_clause,
                "requirement_title": gap.requirement_title,
                "gap_severity": gap.gap_severity,
                "compliance_percentage": gap.compliance_percentage
            })
        
        db.commit()
        
        return {
            "success": True,
            "message": f"Successfully linked {len(gaps)} gap(s) to CAPA",
            "capa_id": str(capa_item.id),
            "capa_number": capa_item.capa_number,
            "linked_gaps": linked_gaps,
            "total_gaps_linked": len(linked_gaps)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to link gaps to CAPA: {str(e)}"
        )

@router.get("/", response_model=List[GapAnalysisResponse])
async def list_gap_analyses(
    framework_id: Optional[UUID] = None,
    audit_id: Optional[UUID] = None,
    gap_status: Optional[str] = None,
    gap_severity: Optional[str] = None,
    department_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List gap analysis items with filtering options.
    """
    try:
        query = db.query(GapAnalysis)
        
        # Apply filters
        if framework_id:
            query = query.filter(GapAnalysis.framework_id == framework_id)
        if audit_id:
            query = query.filter(GapAnalysis.audit_id == audit_id)
        if gap_status:
            query = query.filter(GapAnalysis.gap_status == gap_status)
        if gap_severity:
            query = query.filter(GapAnalysis.gap_severity == gap_severity)
        if department_id:
            query = query.filter(GapAnalysis.department_id == department_id)
        
        # Apply user access controls
        if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
            # Regular users can only see gaps from their audits or department
            user_audits = db.query(Audit.id).filter(
                or_(
                    Audit.assigned_manager_id == current_user.id,
                    Audit.lead_auditor_id == current_user.id,
                    Audit.created_by_id == current_user.id
                )
            ).subquery()
            
            query = query.filter(
                or_(
                    GapAnalysis.audit_id.in_(user_audits),
                    GapAnalysis.department_id == current_user.department_id,
                    GapAnalysis.responsible_person_id == current_user.id
                )
            )
        
        gaps = query.order_by(desc(GapAnalysis.created_at)).offset(skip).limit(limit).all()
        return gaps
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve gap analyses: {str(e)}"
        )

@router.post("/", response_model=GapAnalysisResponse)
async def create_gap_analysis(
    gap_data: GapAnalysisCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new gap analysis item.
    """
    try:
        # Verify framework exists
        framework = db.query(ISOFramework).filter(ISOFramework.id == gap_data.framework_id).first()
        if not framework:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="ISO framework not found"
            )
        
        # Verify audit exists if provided
        if gap_data.audit_id:
            audit = db.query(Audit).filter(Audit.id == gap_data.audit_id).first()
            if not audit:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Audit not found"
                )
        
        # Create gap analysis
        gap_analysis = GapAnalysis(
            **gap_data.dict(),
            gap_status="identified",
            created_by_id=current_user.id
        )
        
        db.add(gap_analysis)
        db.commit()
        db.refresh(gap_analysis)
        
        return gap_analysis
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create gap analysis: {str(e)}"
        )

@router.get("/{gap_id}", response_model=GapAnalysisResponse)
async def get_gap_analysis(
    gap_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific gap analysis item by ID.
    """
    try:
        gap = db.query(GapAnalysis).filter(GapAnalysis.id == gap_id).first()
        if not gap:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Gap analysis not found"
            )
        
        return gap
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve gap analysis: {str(e)}"
        )

@router.put("/{gap_id}", response_model=GapAnalysisResponse)
async def update_gap_analysis(
    gap_id: UUID,
    gap_data: GapAnalysisUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a gap analysis item.
    """
    try:
        gap = db.query(GapAnalysis).filter(GapAnalysis.id == gap_id).first()
        if not gap:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Gap analysis not found"
            )
        
        # Update fields
        update_data = gap_data.dict(exclude_unset=True)
        for field, value in update_data.items():
            setattr(gap, field, value)
        
        gap.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(gap)
        
        return gap
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update gap analysis: {str(e)}"
        )

@router.delete("/{gap_id}")
async def delete_gap_analysis(
    gap_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a gap analysis item.
    """
    try:
        gap = db.query(GapAnalysis).filter(GapAnalysis.id == gap_id).first()
        if not gap:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Gap analysis not found"
            )
        
        # Check if user has permission to delete
        if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
            if gap.created_by_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to delete this gap analysis"
                )
        
        db.delete(gap)
        db.commit()
        
        return {"success": True, "message": "Gap analysis deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete gap analysis: {str(e)}"
        )