from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.models import Audit, User, UserRole, AuditTeam, AuditWorkProgram, AuditEvidence, AuditFinding, AuditQuery, AuditReport, AuditFollowup, AuditStatus
from app.schemas import (
    AuditCreate, AuditUpdate, AuditResponse,
    AuditTeamCreate, AuditTeamResponse,
    WorkProgramCreate, WorkProgramUpdate, WorkProgramResponse,
    EvidenceCreate, EvidenceResponse,
    FindingCreate, FindingUpdate, FindingResponse,
    QueryCreate, QueryResponse,
    ReportCreate, ReportUpdate, ReportResponse,
    FollowupCreate, FollowupUpdate, FollowupResponse
)
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/audits", tags=["Audits"])

# Audit CRUD
@router.post("/", response_model=AuditResponse)
def create_audit(
    audit_data: AuditCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]))
):
    new_audit = Audit(**audit_data.model_dump(), created_by_id=current_user.id)
    db.add(new_audit)
    db.commit()
    db.refresh(new_audit)
    return new_audit

@router.get("/", response_model=List[AuditResponse])
def list_audits(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audits = db.query(Audit).all()
    return audits

@router.get("/{audit_id}", response_model=AuditResponse)
def get_audit(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    return audit

@router.put("/{audit_id}", response_model=AuditResponse)
def update_audit(
    audit_id: UUID,
    audit_data: AuditUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]))
):
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    for key, value in audit_data.model_dump(exclude_unset=True).items():
        setattr(audit, key, value)
    
    db.commit()
    db.refresh(audit)
    return audit

# Audit Team
@router.post("/{audit_id}/team", response_model=AuditTeamResponse)
def add_team_member(
    audit_id: UUID,
    team_data: AuditTeamCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]))
):
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    team_member = AuditTeam(audit_id=audit_id, **team_data.model_dump())
    db.add(team_member)
    db.commit()
    db.refresh(team_member)
    return team_member

@router.get("/{audit_id}/team", response_model=List[AuditTeamResponse])
def list_team_members(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    team = db.query(AuditTeam).filter(AuditTeam.audit_id == audit_id).all()
    return team

# Work Program
@router.post("/{audit_id}/work-program", response_model=WorkProgramResponse)
def create_work_program(
    audit_id: UUID,
    wp_data: WorkProgramCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    wp = AuditWorkProgram(audit_id=audit_id, **wp_data.model_dump())
    db.add(wp)
    db.commit()
    db.refresh(wp)
    return wp

@router.get("/{audit_id}/work-program", response_model=List[WorkProgramResponse])
def list_work_programs(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    programs = db.query(AuditWorkProgram).filter(AuditWorkProgram.audit_id == audit_id).all()
    return programs

@router.put("/{audit_id}/work-program/{wp_id}", response_model=WorkProgramResponse)
def update_work_program(
    audit_id: UUID,
    wp_id: UUID,
    wp_data: WorkProgramUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    wp = db.query(AuditWorkProgram).filter(
        AuditWorkProgram.id == wp_id,
        AuditWorkProgram.audit_id == audit_id
    ).first()
    if not wp:
        raise HTTPException(status_code=404, detail="Work program not found")
    
    for key, value in wp_data.model_dump(exclude_unset=True).items():
        setattr(wp, key, value)
    
    db.commit()
    db.refresh(wp)
    return wp

# Evidence
@router.post("/{audit_id}/evidence", response_model=EvidenceResponse)
def upload_evidence(
    audit_id: UUID,
    evidence_data: EvidenceCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    evidence = AuditEvidence(
        audit_id=audit_id,
        uploaded_by_id=current_user.id,
        **evidence_data.model_dump()
    )
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    return evidence

@router.get("/{audit_id}/evidence", response_model=List[EvidenceResponse])
def list_evidence(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    evidence = db.query(AuditEvidence).filter(AuditEvidence.audit_id == audit_id).all()
    return evidence

# Findings
@router.post("/{audit_id}/findings", response_model=FindingResponse)
def create_finding(
    audit_id: UUID,
    finding_data: FindingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    finding = AuditFinding(audit_id=audit_id, **finding_data.model_dump())
    db.add(finding)
    db.commit()
    db.refresh(finding)
    return finding

@router.get("/{audit_id}/findings", response_model=List[FindingResponse])
def list_findings(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    findings = db.query(AuditFinding).filter(AuditFinding.audit_id == audit_id).all()
    return findings

@router.put("/{audit_id}/findings/{finding_id}", response_model=FindingResponse)
def update_finding(
    audit_id: UUID,
    finding_id: UUID,
    finding_data: FindingUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    finding = db.query(AuditFinding).filter(
        AuditFinding.id == finding_id,
        AuditFinding.audit_id == audit_id
    ).first()
    if not finding:
        raise HTTPException(status_code=404, detail="Finding not found")
    
    for key, value in finding_data.model_dump(exclude_unset=True).items():
        setattr(finding, key, value)
    
    db.commit()
    db.refresh(finding)
    return finding

# Queries
@router.post("/{audit_id}/queries", response_model=QueryResponse)
def create_query(
    audit_id: UUID,
    query_data: QueryCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = AuditQuery(
        audit_id=audit_id,
        from_user_id=current_user.id,
        **query_data.model_dump()
    )
    db.add(query)
    db.commit()
    db.refresh(query)
    return query

@router.get("/{audit_id}/queries", response_model=List[QueryResponse])
def list_queries(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    queries = db.query(AuditQuery).filter(AuditQuery.audit_id == audit_id).all()
    return queries

# Reports
@router.post("/{audit_id}/report", response_model=ReportResponse)
def create_report(
    audit_id: UUID,
    report_data: ReportCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    latest = db.query(AuditReport).filter(AuditReport.audit_id == audit_id).order_by(AuditReport.version.desc()).first()
    version = (latest.version + 1) if latest else 1
    
    report = AuditReport(
        audit_id=audit_id,
        version=version,
        created_by_id=current_user.id,
        **report_data.model_dump()
    )
    db.add(report)
    db.commit()
    db.refresh(report)
    return report

@router.get("/{audit_id}/report", response_model=List[ReportResponse])
def list_reports(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    reports = db.query(AuditReport).filter(AuditReport.audit_id == audit_id).order_by(AuditReport.version.desc()).all()
    return reports

@router.put("/{audit_id}/report/{report_id}", response_model=ReportResponse)
def update_report(
    audit_id: UUID,
    report_id: UUID,
    report_data: ReportUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    report = db.query(AuditReport).filter(
        AuditReport.id == report_id,
        AuditReport.audit_id == audit_id
    ).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    for key, value in report_data.model_dump(exclude_unset=True).items():
        setattr(report, key, value)
    
    db.commit()
    db.refresh(report)
    return report

# Follow-up
@router.post("/{audit_id}/followup", response_model=FollowupResponse)
def create_followup(
    audit_id: UUID,
    followup_data: FollowupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    followup = AuditFollowup(audit_id=audit_id, **followup_data.model_dump())
    db.add(followup)
    db.commit()
    db.refresh(followup)
    return followup

@router.get("/{audit_id}/followup", response_model=List[FollowupResponse])
def list_followups(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    followups = db.query(AuditFollowup).filter(AuditFollowup.audit_id == audit_id).all()
    return followups

@router.put("/{audit_id}/followup/{followup_id}", response_model=FollowupResponse)
def update_followup(
    audit_id: UUID,
    followup_id: UUID,
    followup_data: FollowupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    followup = db.query(AuditFollowup).filter(
        AuditFollowup.id == followup_id,
        AuditFollowup.audit_id == audit_id
    ).first()
    if not followup:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    
    for key, value in followup_data.model_dump(exclude_unset=True).items():
        setattr(followup, key, value)
    
    db.commit()
    db.refresh(followup)
    return followup

# Close Audit
@router.post("/{audit_id}/finalize")
def finalize_audit(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]))
):
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    audit.status = AuditStatus.CLOSED
    db.commit()
    
    return {"success": True, "message": "Audit finalized and closed"}
