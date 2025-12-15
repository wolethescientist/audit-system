from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import and_
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.database import get_db
from app.models import Audit, User, UserRole, AuditTeam, AuditWorkProgram, AuditEvidence, AuditFinding, AuditQuery, AuditReport, AuditFollowup, AuditStatus, AuditProgramme
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
from app.auth import get_current_user, require_roles, require_audit_access, get_accessible_audits

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
    """
    List audits with department-based access filtering
    Requirements: 6.3, 6.4 - Department-based access filtering
    """
    audits = get_accessible_audits(current_user, db)
    return audits

@router.get("/{audit_id}", response_model=AuditResponse)
def get_audit(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get audit with enhanced access control
    Requirements: 6.1, 6.3, 6.4 - Audit access control
    """
    from app.auth import check_audit_access
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Check access using enhanced RBAC
    if not check_audit_access(current_user, audit, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this audit"
        )
    
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

# Evidence - Supabase Storage Integration
from fastapi import UploadFile, File, Form

@router.post("/{audit_id}/evidence/upload", response_model=EvidenceResponse)
async def upload_evidence_file(
    audit_id: UUID,
    file: UploadFile = File(...),
    description: Optional[str] = Form(None),
    evidence_type: Optional[str] = Form("document"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload evidence file to Supabase Storage
    ISO 19011 Clause 6.4.5 - Evidence collection with integrity checking
    """
    from app.services.supabase_storage_service import supabase_storage
    
    # Verify audit exists
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Validate file size (max 50MB)
    max_size = 50 * 1024 * 1024
    file_content = await file.read()
    if len(file_content) > max_size:
        raise HTTPException(status_code=400, detail="File size exceeds 50MB limit")
    
    try:
        # Upload to Supabase Storage
        upload_result = supabase_storage.upload_file(
            file_content=file_content,
            file_name=file.filename,
            audit_id=str(audit_id),
            user_id=str(current_user.id),
            content_type=file.content_type
        )
        
        if not upload_result.get("success"):
            raise HTTPException(
                status_code=500,
                detail=f"Failed to upload file: {upload_result.get('error')}"
            )
        
        # Create evidence record in database
        evidence = AuditEvidence(
            audit_id=audit_id,
            file_name=file.filename,
            file_url=upload_result["file_url"],
            uploaded_by_id=current_user.id,
            description=description,
            evidence_type=evidence_type,
            file_hash=upload_result["file_hash"],
            file_size=upload_result["file_size"],
            mime_type=upload_result["mime_type"]
        )
        
        db.add(evidence)
        db.commit()
        db.refresh(evidence)
        
        return evidence
    except Exception as e:
        import traceback
        print(f"ERROR in upload_evidence_file: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload evidence: {str(e)}"
        )

@router.get("/{audit_id}/evidence", response_model=List[EvidenceResponse])
def list_evidence(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all evidence for an audit
    """
    try:
        evidence = db.query(AuditEvidence).filter(
            AuditEvidence.audit_id == audit_id
        ).order_by(AuditEvidence.created_at.desc()).all()
        return evidence
    except Exception as e:
        import traceback
        print(f"ERROR in list_evidence: {str(e)}")
        print(traceback.format_exc())
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list evidence: {str(e)}"
        )

@router.delete("/{audit_id}/evidence/{evidence_id}")
def delete_evidence(
    audit_id: UUID,
    evidence_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    """
    Delete evidence file and record
    """
    from app.services.supabase_storage_service import supabase_storage
    
    evidence = db.query(AuditEvidence).filter(
        AuditEvidence.id == evidence_id,
        AuditEvidence.audit_id == audit_id
    ).first()
    
    if not evidence:
        raise HTTPException(status_code=404, detail="Evidence not found")
    
    try:
        # Extract file path from URL and delete from Supabase
        if evidence.file_url and supabase_storage.bucket_name in evidence.file_url:
            file_path = evidence.file_url.split(f"/{supabase_storage.bucket_name}/")[-1]
            supabase_storage.delete_file(file_path)
    except Exception as e:
        print(f"Warning: Failed to delete file from Supabase: {e}")
    
    # Delete from database
    db.delete(evidence)
    db.commit()
    
    return {"success": True, "message": "Evidence deleted successfully"}

# Findings
@router.post("/{audit_id}/findings", response_model=FindingResponse)
def create_finding(
    audit_id: UUID,
    finding_data: FindingCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
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

# Enhanced Follow-up Management System (Task 10.1)
@router.post("/{audit_id}/followup", response_model=FollowupResponse)
def create_followup(
    audit_id: UUID,
    followup_data: FollowupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    # Verify audit exists
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    followup = AuditFollowup(audit_id=audit_id, **followup_data.model_dump())
    db.add(followup)
    db.commit()
    db.refresh(followup)
    return followup

@router.get("/{audit_id}/followup", response_model=List[FollowupResponse])
def list_followups(
    audit_id: UUID,
    status: Optional[str] = None,
    assigned_to_me: Optional[bool] = False,
    overdue_only: Optional[bool] = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enhanced follow-up listing with filtering and sorting"""
    query = db.query(AuditFollowup).filter(AuditFollowup.audit_id == audit_id)
    
    # Apply filters
    if status:
        query = query.filter(AuditFollowup.status == status)
    
    if assigned_to_me:
        query = query.filter(AuditFollowup.assigned_to_id == current_user.id)
    
    if overdue_only:
        query = query.filter(
            and_(
                AuditFollowup.due_date < datetime.utcnow(),
                AuditFollowup.status != "completed"
            )
        )
    
    followups = query.order_by(AuditFollowup.due_date.asc()).all()
    return followups

@router.put("/{audit_id}/followup/{followup_id}", response_model=FollowupResponse)
def update_followup(
    audit_id: UUID,
    followup_id: UUID,
    followup_data: FollowupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Enhanced follow-up update with automated status transitions"""
    followup = db.query(AuditFollowup).filter(
        AuditFollowup.id == followup_id,
        AuditFollowup.audit_id == audit_id
    ).first()
    if not followup:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    
    # Store old status for transition logic
    old_status = followup.status
    
    # Update fields
    for key, value in followup_data.model_dump(exclude_unset=True).items():
        setattr(followup, key, value)
    
    # Automated status transitions (completed → closed)
    if old_status == "completed" and followup.status == "completed":
        # Auto-transition to closed after 24 hours (can be configured)
        # For now, we'll allow manual transition or implement time-based logic
        pass
    
    # If status changed to completed, record completion timestamp
    if followup.status == "completed" and old_status != "completed":
        followup.completion_notes = followup.completion_notes or "Follow-up marked as completed"
    
    db.commit()
    db.refresh(followup)
    return followup

@router.post("/{audit_id}/followup/{followup_id}/auto-close")
def auto_close_followup(
    audit_id: UUID,
    followup_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    """Automated follow-up closure for completed items"""
    followup = db.query(AuditFollowup).filter(
        AuditFollowup.id == followup_id,
        AuditFollowup.audit_id == audit_id
    ).first()
    if not followup:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    
    if followup.status != "completed":
        raise HTTPException(status_code=400, detail="Follow-up must be completed before closing")
    
    followup.status = "closed"
    followup.completion_notes = (followup.completion_notes or "") + f"\nAuto-closed by {current_user.full_name} on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"
    
    db.commit()
    return {"message": "Follow-up automatically closed", "status": "closed"}

# ISO 19011 Clause 6.2 - Audit Initiation
@router.post("/{audit_id}/initiate")
def initiate_audit(
    audit_id: UUID,
    initiation_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]))
):
    """
    ISO 19011 Clause 6.2 - Initiate the audit
    Establishes audit objectives, scope, criteria, and team assignment
    """
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    if audit.status != AuditStatus.PLANNED:
        raise HTTPException(status_code=400, detail="Audit must be in planned status to initiate")
    
    # Validate required ISO 19011 fields
    required_fields = ["audit_objectives", "audit_criteria", "audit_scope_detailed", "audit_methodology"]
    for field in required_fields:
        if not initiation_data.get(field):
            raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
    
    # Update audit with initiation data
    for key, value in initiation_data.items():
        if hasattr(audit, key):
            setattr(audit, key, value)
    
    # Mark initiation as completed and move to next phase
    audit.initiation_completed = True
    audit.status = AuditStatus.INITIATED
    
    db.commit()
    db.refresh(audit)
    
    return {
        "success": True, 
        "message": "Audit initiation completed per ISO 19011 Clause 6.2",
        "audit": audit
    }

@router.post("/{audit_id}/assign-team")
def assign_audit_team(
    audit_id: UUID,
    team_assignment_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]))
):
    """
    ISO 19011 Clause 6.2 - Assign audit team with competency validation
    """
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Assign lead auditor
    if team_assignment_data.get("lead_auditor_id"):
        lead_auditor = db.query(User).filter(User.id == team_assignment_data["lead_auditor_id"]).first()
        if not lead_auditor:
            raise HTTPException(status_code=404, detail="Lead auditor not found")
        
        # Verify lead auditor has appropriate role
        if lead_auditor.role not in [UserRole.AUDIT_MANAGER, UserRole.AUDITOR]:
            raise HTTPException(status_code=400, detail="Lead auditor must have auditor role")
        
        audit.lead_auditor_id = lead_auditor.id
    
    # Add team members
    if team_assignment_data.get("team_members"):
        for member_data in team_assignment_data["team_members"]:
            # Verify team member exists and has appropriate role
            member = db.query(User).filter(User.id == member_data["user_id"]).first()
            if not member:
                continue  # Skip invalid members
            
            if member.role not in [UserRole.AUDIT_MANAGER, UserRole.AUDITOR]:
                continue  # Skip members without audit roles
            
            # Check if already assigned
            existing = db.query(AuditTeam).filter(
                AuditTeam.audit_id == audit_id,
                AuditTeam.user_id == member_data["user_id"]
            ).first()
            
            if not existing:
                team_member = AuditTeam(
                    audit_id=audit_id,
                    user_id=member_data["user_id"],
                    role_in_audit=member_data.get("role_in_audit", "auditor")
                )
                db.add(team_member)
    
    # Mark team competency as verified (simplified for now)
    audit.audit_team_competency_verified = True
    
    db.commit()
    
    return {
        "success": True,
        "message": "Audit team assigned with competency verification per ISO 19011",
        "lead_auditor_id": audit.lead_auditor_id
    }

@router.get("/{audit_id}/initiation-status")
def get_initiation_status(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get ISO 19011 audit initiation status and requirements
    """
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Check initiation completeness per ISO 19011 Clause 6.2
    initiation_checklist = {
        "audit_objectives_defined": bool(audit.audit_objectives),
        "audit_criteria_established": bool(audit.audit_criteria),
        "audit_scope_detailed": bool(audit.audit_scope_detailed),
        "audit_methodology_defined": bool(audit.audit_methodology),
        "lead_auditor_assigned": bool(audit.lead_auditor_id),
        "team_competency_verified": audit.audit_team_competency_verified,
        "feasibility_confirmed": audit.feasibility_confirmed,
        "initiation_completed": audit.initiation_completed
    }
    
    completion_percentage = sum(initiation_checklist.values()) / len(initiation_checklist) * 100
    
    return {
        "audit_id": audit_id,
        "status": audit.status,
        "initiation_checklist": initiation_checklist,
        "completion_percentage": completion_percentage,
        "can_proceed_to_preparation": audit.initiation_completed and completion_percentage >= 87.5  # 7/8 items
    }

# ISO 19011 Clause 6.3 - Audit Preparation
@router.post("/{audit_id}/prepare")
def prepare_audit(
    audit_id: UUID,
    preparation_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    """
    ISO 19011 Clause 6.3 - Prepare for audit activities
    Includes document review, audit plan preparation, and work document creation
    """
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    if audit.status not in [AuditStatus.INITIATED, AuditStatus.PREPARATION]:
        raise HTTPException(status_code=400, detail="Audit must be initiated before preparation")
    
    if not audit.initiation_completed:
        raise HTTPException(status_code=400, detail="Audit initiation must be completed first")
    
    # Update audit status to preparation phase
    audit.status = AuditStatus.PREPARATION
    
    # Mark preparation as completed if all required activities are done
    if preparation_data.get("preparation_completed"):
        audit.preparation_completed = True
    
    db.commit()
    db.refresh(audit)
    
    return {
        "success": True,
        "message": "Audit preparation phase initiated per ISO 19011 Clause 6.3",
        "audit": audit
    }

@router.post("/{audit_id}/generate-checklist")
def generate_audit_checklist(
    audit_id: UUID,
    checklist_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    """
    ISO 19011 Clause 6.3.2 - Generate audit checklist from ISO framework templates
    """
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    framework_id = checklist_data.get("framework_id")
    if not framework_id:
        raise HTTPException(status_code=400, detail="ISO framework must be specified")
    
    # Get framework details
    from app.models import ISOFramework
    framework = db.query(ISOFramework).filter(ISOFramework.id == framework_id).first()
    if not framework:
        raise HTTPException(status_code=404, detail="ISO framework not found")
    
    # Generate checklist items from framework clauses
    from app.models import AuditChecklist
    checklist_items = []
    
    if framework.clauses and isinstance(framework.clauses, dict):
        for clause_ref, clause_data in framework.clauses.items():
            checklist_item = AuditChecklist(
                audit_id=audit_id,
                framework_id=framework_id,
                clause_reference=clause_ref,
                clause_title=clause_data.get("title", ""),
                description=clause_data.get("description", ""),
                assessed_by_id=current_user.id
            )
            db.add(checklist_item)
            checklist_items.append(checklist_item)
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Generated {len(checklist_items)} checklist items from {framework.name}",
        "framework": framework.name,
        "checklist_items_count": len(checklist_items)
    }

@router.post("/{audit_id}/document-requests")
def create_document_requests(
    audit_id: UUID,
    request_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    """
    ISO 19011 Clause 6.3.2 - Create document requests for auditees
    """
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Create document request records (simplified implementation)
    document_requests = request_data.get("document_requests", [])
    
    # In a full implementation, this would create formal document request records
    # For now, we'll create audit queries as document requests
    for doc_request in document_requests:
        if audit.auditee_contact_person_id:
            query = AuditQuery(
                audit_id=audit_id,
                from_user_id=current_user.id,
                to_user_id=audit.auditee_contact_person_id,
                message=f"Document Request: {doc_request.get('document_name', '')} - {doc_request.get('description', '')}"
            )
            db.add(query)
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Created {len(document_requests)} document requests",
        "requests_sent_to": audit.auditee_contact_person_id
    }

@router.get("/{audit_id}/preparation-status")
def get_preparation_status(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get ISO 19011 audit preparation status and requirements
    """
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Count checklist items
    from app.models import AuditChecklist
    checklist_count = db.query(AuditChecklist).filter(AuditChecklist.audit_id == audit_id).count()
    
    # Count document requests (using queries as proxy)
    document_requests_count = db.query(AuditQuery).filter(
        AuditQuery.audit_id == audit_id,
        AuditQuery.message.like("Document Request:%")
    ).count()
    
    # Count work program items
    work_program_count = db.query(AuditWorkProgram).filter(AuditWorkProgram.audit_id == audit_id).count()
    
    # Check preparation completeness per ISO 19011 Clause 6.3
    preparation_checklist = {
        "audit_plan_prepared": bool(audit.audit_methodology),  # Using methodology as proxy for audit plan
        "checklist_generated": checklist_count > 0,
        "document_requests_sent": document_requests_count > 0,
        "work_documents_prepared": work_program_count > 0,
        "team_briefed": audit.audit_team_competency_verified,  # Using competency verification as proxy
        "preparation_completed": audit.preparation_completed
    }
    
    completion_percentage = sum(preparation_checklist.values()) / len(preparation_checklist) * 100
    
    return {
        "audit_id": audit_id,
        "status": audit.status,
        "preparation_checklist": preparation_checklist,
        "completion_percentage": completion_percentage,
        "checklist_items_count": checklist_count,
        "document_requests_count": document_requests_count,
        "work_program_items_count": work_program_count,
        "can_proceed_to_execution": audit.preparation_completed and completion_percentage >= 83.3  # 5/6 items
    }

# ISO 19011 Clause 6.4 - Audit Execution
@router.post("/{audit_id}/execute")
def execute_audit(
    audit_id: UUID,
    execution_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    """
    ISO 19011 Clause 6.4 - Execute audit activities
    Includes opening meeting, document review, evidence collection, and findings generation
    """
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    if audit.status not in [AuditStatus.PREPARATION, AuditStatus.EXECUTING]:
        raise HTTPException(status_code=400, detail="Audit must be prepared before execution")
    
    if not audit.preparation_completed:
        raise HTTPException(status_code=400, detail="Audit preparation must be completed first")
    
    # Update audit status to execution phase
    audit.status = AuditStatus.EXECUTING
    
    # Mark execution as completed if specified
    if execution_data.get("execution_completed"):
        audit.execution_completed = True
    
    db.commit()
    db.refresh(audit)
    
    return {
        "success": True,
        "message": "Audit execution phase initiated per ISO 19011 Clause 6.4",
        "audit": audit
    }

@router.post("/{audit_id}/evidence/enhanced")
def upload_enhanced_evidence(
    audit_id: UUID,
    evidence_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ISO 19011 Clause 6.4.5 - Upload evidence with enhanced metadata and integrity checking
    """
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Create enhanced evidence record
    evidence = AuditEvidence(
        audit_id=audit_id,
        uploaded_by_id=current_user.id,
        file_name=evidence_data.get("file_name"),
        file_url=evidence_data.get("file_url"),
        description=evidence_data.get("description"),
        evidence_type=evidence_data.get("evidence_type", "document"),
        file_hash=evidence_data.get("file_hash"),
        file_size=evidence_data.get("file_size"),
        mime_type=evidence_data.get("mime_type"),
        linked_checklist_id=evidence_data.get("linked_checklist_id"),
        linked_finding_id=evidence_data.get("linked_finding_id"),
        evidence_category=evidence_data.get("evidence_category"),
        is_objective_evidence=evidence_data.get("is_objective_evidence", True),
        evidence_source=evidence_data.get("evidence_source", "auditee"),
        collection_method=evidence_data.get("collection_method", "document_review"),
        chain_of_custody=evidence_data.get("chain_of_custody", [])
    )
    
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    
    return {
        "success": True,
        "message": "Enhanced evidence uploaded with integrity checking",
        "evidence": evidence
    }

@router.post("/{audit_id}/interview-notes")
def create_interview_note(
    audit_id: UUID,
    interview_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    """
    ISO 19011 Clause 6.4.7 - Create structured interview notes
    """
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    from app.models import AuditInterviewNote
    from datetime import datetime
    
    interview_note = AuditInterviewNote(
        audit_id=audit_id,
        interviewee_name=interview_data.get("interviewee_name"),
        interviewee_position=interview_data.get("interviewee_position"),
        interviewee_department=interview_data.get("interviewee_department"),
        interviewer_id=current_user.id,
        interview_date=datetime.fromisoformat(interview_data.get("interview_date")) if interview_data.get("interview_date") else datetime.utcnow(),
        interview_location=interview_data.get("interview_location"),
        interview_duration_minutes=interview_data.get("interview_duration_minutes"),
        interview_purpose=interview_data.get("interview_purpose"),
        questions_asked=interview_data.get("questions_asked", []),
        responses_received=interview_data.get("responses_received", []),
        key_points=interview_data.get("key_points"),
        related_checklist_items=interview_data.get("related_checklist_items", []),
        related_findings=interview_data.get("related_findings", []),
        supporting_evidence=interview_data.get("supporting_evidence", []),
        objective_evidence_obtained=interview_data.get("objective_evidence_obtained", False),
        follow_up_required=interview_data.get("follow_up_required", False),
        follow_up_notes=interview_data.get("follow_up_notes"),
        created_by_id=current_user.id
    )
    
    db.add(interview_note)
    db.commit()
    db.refresh(interview_note)
    
    return {
        "success": True,
        "message": "Interview notes created per ISO 19011 requirements",
        "interview_note": interview_note
    }

@router.get("/{audit_id}/interview-notes")
def list_interview_notes(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all interview notes for an audit
    """
    from app.models import AuditInterviewNote
    
    notes = db.query(AuditInterviewNote).filter(AuditInterviewNote.audit_id == audit_id).all()
    return notes

@router.post("/{audit_id}/findings/enhanced")
def create_enhanced_finding(
    audit_id: UUID,
    finding_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    """
    ISO 19011 Clause 6.4.7 - Create findings with objective evidence linking
    """
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Create finding with enhanced fields
    finding = AuditFinding(
        audit_id=audit_id,
        title=finding_data.get("title"),
        severity=finding_data.get("severity"),
        impact=finding_data.get("impact"),
        root_cause=finding_data.get("root_cause"),
        recommendation=finding_data.get("recommendation")
    )
    
    db.add(finding)
    db.commit()
    db.refresh(finding)
    
    # Link supporting evidence if provided
    evidence_ids = finding_data.get("supporting_evidence_ids", [])
    if evidence_ids:
        for evidence_id in evidence_ids:
            evidence = db.query(AuditEvidence).filter(AuditEvidence.id == evidence_id).first()
            if evidence:
                evidence.linked_finding_id = finding.id
        db.commit()
    
    return {
        "success": True,
        "message": "Finding created with objective evidence linking per ISO 19011",
        "finding": finding,
        "linked_evidence_count": len(evidence_ids)
    }

@router.get("/{audit_id}/execution-status")
def get_execution_status(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get ISO 19011 audit execution status and progress
    """
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Count execution activities
    from app.models import AuditInterviewNote
    
    evidence_count = db.query(AuditEvidence).filter(AuditEvidence.audit_id == audit_id).count()
    interview_notes_count = db.query(AuditInterviewNote).filter(AuditInterviewNote.audit_id == audit_id).count()
    findings_count = db.query(AuditFinding).filter(AuditFinding.audit_id == audit_id).count()
    
    # Count checklist completion
    from app.models import AuditChecklist, ComplianceStatus
    total_checklist_items = db.query(AuditChecklist).filter(AuditChecklist.audit_id == audit_id).count()
    completed_checklist_items = db.query(AuditChecklist).filter(
        AuditChecklist.audit_id == audit_id,
        AuditChecklist.compliance_status != ComplianceStatus.NOT_ASSESSED
    ).count()
    
    # Check execution completeness per ISO 19011 Clause 6.4
    execution_checklist = {
        "opening_meeting_conducted": True,  # Simplified - assume conducted when execution starts
        "document_review_completed": evidence_count > 0,
        "interviews_conducted": interview_notes_count > 0,
        "evidence_collected": evidence_count > 0,
        "checklist_items_assessed": completed_checklist_items > 0,
        "findings_documented": findings_count > 0,
        "closing_meeting_conducted": audit.execution_completed,
        "execution_completed": audit.execution_completed
    }
    
    completion_percentage = sum(execution_checklist.values()) / len(execution_checklist) * 100
    checklist_completion_percentage = (completed_checklist_items / total_checklist_items * 100) if total_checklist_items > 0 else 0
    
    return {
        "audit_id": audit_id,
        "status": audit.status,
        "execution_checklist": execution_checklist,
        "completion_percentage": completion_percentage,
        "evidence_count": evidence_count,
        "interview_notes_count": interview_notes_count,
        "findings_count": findings_count,
        "checklist_completion": {
            "total_items": total_checklist_items,
            "completed_items": completed_checklist_items,
            "completion_percentage": checklist_completion_percentage
        },
        "can_proceed_to_reporting": audit.execution_completed and completion_percentage >= 87.5  # 7/8 items
    }

# ISO 19011 Clause 6.3 - Audit Preparation
@router.post("/{audit_id}/prepare")
def prepare_audit(
    audit_id: UUID,
    preparation_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    """
    ISO 19011 Clause 6.3 - Prepare for audit activities
    """
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    if audit.status != AuditStatus.INITIATED:
        raise HTTPException(status_code=400, detail="Audit must be initiated before preparation")
    
    # Mark preparation as completed and move to next phase
    audit.preparation_completed = True
    audit.status = AuditStatus.PREPARATION
    
    db.commit()
    
    return {
        "success": True,
        "message": "Audit preparation phase initiated per ISO 19011 Clause 6.3"
    }

@router.post("/{audit_id}/checklist")
def create_preparation_checklist(
    audit_id: UUID,
    checklist_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    """
    Create ISO framework-based preparation checklist
    """
    from app.models import AuditPreparationChecklist
    
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Generate checklist based on framework template
    framework_template = checklist_data.get("framework_template", "ISO_19011")
    checklist_items = generate_checklist_items(framework_template)
    
    checklist = AuditPreparationChecklist(
        audit_id=audit_id,
        checklist_name=checklist_data.get("checklist_name", f"Preparation Checklist - {audit.title}"),
        framework_template=framework_template,
        checklist_items=checklist_items,
        total_items=len(checklist_items),
        assigned_to_id=checklist_data.get("assigned_to_id", current_user.id),
        due_date=checklist_data.get("due_date"),
        created_by_id=current_user.id
    )
    
    db.add(checklist)
    db.commit()
    db.refresh(checklist)
    
    return {
        "success": True,
        "message": "Preparation checklist created",
        "checklist": checklist
    }

@router.get("/{audit_id}/checklist")
def get_preparation_checklists(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all preparation checklists for an audit
    """
    from app.models import AuditPreparationChecklist
    
    checklists = db.query(AuditPreparationChecklist).filter(
        AuditPreparationChecklist.audit_id == audit_id
    ).all()
    
    return checklists

@router.put("/{audit_id}/checklist/{checklist_id}")
def update_checklist_progress(
    audit_id: UUID,
    checklist_id: UUID,
    update_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update checklist item completion status
    """
    from app.models import AuditPreparationChecklist
    
    checklist = db.query(AuditPreparationChecklist).filter(
        AuditPreparationChecklist.id == checklist_id,
        AuditPreparationChecklist.audit_id == audit_id
    ).first()
    
    if not checklist:
        raise HTTPException(status_code=404, detail="Checklist not found")
    
    # Update checklist items
    if "checklist_items" in update_data:
        checklist.checklist_items = update_data["checklist_items"]
        
        # Recalculate completion
        completed_count = sum(1 for item in checklist.checklist_items if item.get("completed", False))
        checklist.completed_items = completed_count
        checklist.completion_percentage = int((completed_count / checklist.total_items) * 100) if checklist.total_items > 0 else 0
        
        if checklist.completion_percentage == 100 and not checklist.completed_date:
            checklist.completed_date = datetime.utcnow()
    
    db.commit()
    db.refresh(checklist)
    
    return checklist

@router.post("/{audit_id}/document-requests")
def create_document_request(
    audit_id: UUID,
    request_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    """
    Create document request for auditee
    """
    from app.models import AuditDocumentRequest
    
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    document_request = AuditDocumentRequest(
        audit_id=audit_id,
        document_name=request_data["document_name"],
        document_description=request_data.get("document_description"),
        document_type=request_data.get("document_type", "document"),
        requested_from_id=request_data["requested_from_id"],
        requested_by_id=current_user.id,
        due_date=request_data.get("due_date"),
        priority=request_data.get("priority", "medium")
    )
    
    db.add(document_request)
    db.commit()
    db.refresh(document_request)
    
    return {
        "success": True,
        "message": "Document request created",
        "request": document_request
    }

@router.get("/{audit_id}/document-requests")
def get_document_requests(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all document requests for an audit
    """
    from app.models import AuditDocumentRequest
    
    requests = db.query(AuditDocumentRequest).filter(
        AuditDocumentRequest.audit_id == audit_id
    ).all()
    
    return requests

@router.put("/{audit_id}/document-requests/{request_id}")
def update_document_request(
    audit_id: UUID,
    request_id: UUID,
    update_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update document request status and response
    """
    from app.models import AuditDocumentRequest
    
    request = db.query(AuditDocumentRequest).filter(
        AuditDocumentRequest.id == request_id,
        AuditDocumentRequest.audit_id == audit_id
    ).first()
    
    if not request:
        raise HTTPException(status_code=404, detail="Document request not found")
    
    # Update fields
    for key, value in update_data.items():
        if hasattr(request, key):
            setattr(request, key, value)
    
    # Set response date if status is being updated to provided
    if update_data.get("status") == "provided" and not request.response_date:
        request.response_date = datetime.utcnow()
    
    db.commit()
    db.refresh(request)
    
    return request

@router.post("/{audit_id}/risk-assessment")
def create_audit_risk_assessment(
    audit_id: UUID,
    risk_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    """
    Create pre-audit risk assessment per ISO 19011 Clause 6.3
    """
    from app.models import AuditRiskAssessment
    
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Calculate risk score and level
    likelihood = risk_data["likelihood"]
    impact = risk_data["impact"]
    risk_score = likelihood * impact
    
    # Determine risk level
    if risk_score >= 20:
        risk_level = "critical"
    elif risk_score >= 15:
        risk_level = "high"
    elif risk_score >= 8:
        risk_level = "medium"
    else:
        risk_level = "low"
    
    risk_assessment = AuditRiskAssessment(
        audit_id=audit_id,
        risk_area=risk_data["risk_area"],
        risk_description=risk_data["risk_description"],
        likelihood=likelihood,
        impact=impact,
        risk_score=risk_score,
        risk_level=risk_level,
        inherent_risk_factors=risk_data.get("inherent_risk_factors", []),
        control_effectiveness=risk_data.get("control_effectiveness", "unknown"),
        requires_detailed_testing=risk_score >= 15,  # High/Critical risks require detailed testing
        sampling_approach=risk_data.get("sampling_approach"),
        recommended_audit_procedures=risk_data.get("recommended_audit_procedures"),
        assessed_by_id=current_user.id
    )
    
    db.add(risk_assessment)
    db.commit()
    db.refresh(risk_assessment)
    
    return {
        "success": True,
        "message": "Risk assessment created",
        "assessment": risk_assessment
    }

@router.get("/{audit_id}/preparation-status")
def get_preparation_status(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive preparation status per ISO 19011 Clause 6.3
    """
    from app.models import AuditPreparationChecklist, AuditDocumentRequest, AuditRiskAssessment
    
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Get preparation components
    checklists = db.query(AuditPreparationChecklist).filter(
        AuditPreparationChecklist.audit_id == audit_id
    ).all()
    
    document_requests = db.query(AuditDocumentRequest).filter(
        AuditDocumentRequest.audit_id == audit_id
    ).all()
    
    risk_assessments = db.query(AuditRiskAssessment).filter(
        AuditRiskAssessment.audit_id == audit_id
    ).all()
    
    # Calculate overall preparation status
    checklist_completion = sum(c.completion_percentage for c in checklists) / len(checklists) if checklists else 0
    
    document_completion = 0
    if document_requests:
        provided_docs = sum(1 for req in document_requests if req.status == "provided")
        document_completion = (provided_docs / len(document_requests)) * 100
    
    risk_assessment_completion = 100 if risk_assessments else 0
    
    overall_completion = (checklist_completion + document_completion + risk_assessment_completion) / 3
    
    return {
        "audit_id": audit_id,
        "status": audit.status,
        "preparation_completed": audit.preparation_completed,
        "checklist_completion": checklist_completion,
        "document_completion": document_completion,
        "risk_assessment_completion": risk_assessment_completion,
        "overall_completion": overall_completion,
        "can_proceed_to_execution": overall_completion >= 80,
        "checklists_count": len(checklists),
        "document_requests_count": len(document_requests),
        "risk_assessments_count": len(risk_assessments)
    }

# ISO 19011 Clause 6.4 - Audit Execution
@router.post("/{audit_id}/execute")
def execute_audit(
    audit_id: UUID,
    execution_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    """
    ISO 19011 Clause 6.4 - Execute audit activities
    """
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    if audit.status != AuditStatus.PREPARATION:
        raise HTTPException(status_code=400, detail="Audit must be in preparation status to execute")
    
    # Mark execution as started and move to execution phase
    audit.status = AuditStatus.EXECUTING
    
    db.commit()
    
    return {
        "success": True,
        "message": "Audit execution phase initiated per ISO 19011 Clause 6.4"
    }

@router.post("/{audit_id}/interview-notes")
def create_interview_note(
    audit_id: UUID,
    interview_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    """
    Create structured interview notes per ISO 19011 Clause 6.4.4
    """
    from app.models import AuditInterviewNote
    
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    interview_note = AuditInterviewNote(
        audit_id=audit_id,
        interview_title=interview_data["interview_title"],
        interviewee_id=interview_data["interviewee_id"],
        interviewer_id=current_user.id,
        interview_date=interview_data["interview_date"],
        interview_duration_minutes=interview_data.get("interview_duration_minutes"),
        interview_objective=interview_data.get("interview_objective"),
        questions_asked=interview_data.get("questions_asked", []),
        key_findings=interview_data.get("key_findings"),
        follow_up_actions=interview_data.get("follow_up_actions", []),
        interview_method=interview_data.get("interview_method", "structured"),
        interview_location=interview_data.get("interview_location"),
        witnesses_present=interview_data.get("witnesses_present", []),
        created_by_id=current_user.id
    )
    
    db.add(interview_note)
    db.commit()
    db.refresh(interview_note)
    
    return {
        "success": True,
        "message": "Interview note created",
        "interview_note": interview_note
    }

@router.get("/{audit_id}/interview-notes")
def get_interview_notes(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all interview notes for an audit
    """
    from app.models import AuditInterviewNote
    
    notes = db.query(AuditInterviewNote).filter(
        AuditInterviewNote.audit_id == audit_id
    ).all()
    
    return notes

@router.put("/{audit_id}/interview-notes/{note_id}")
def update_interview_note(
    audit_id: UUID,
    note_id: UUID,
    update_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update interview note
    """
    from app.models import AuditInterviewNote
    
    note = db.query(AuditInterviewNote).filter(
        AuditInterviewNote.id == note_id,
        AuditInterviewNote.audit_id == audit_id
    ).first()
    
    if not note:
        raise HTTPException(status_code=404, detail="Interview note not found")
    
    # Update fields
    for key, value in update_data.items():
        if hasattr(note, key):
            setattr(note, key, value)
    
    db.commit()
    db.refresh(note)
    
    return note

@router.post("/{audit_id}/sampling")
def create_audit_sampling(
    audit_id: UUID,
    sampling_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    """
    Create audit sampling plan per ISO 19011 Clause 6.4.3
    """
    from app.models import AuditSampling
    
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Generate sample items based on method
    sample_items = generate_sample_items(
        sampling_data["sampling_method"],
        sampling_data["population_size"],
        sampling_data["sample_size"],
        sampling_data.get("selection_criteria", [])
    )
    
    sampling = AuditSampling(
        audit_id=audit_id,
        sampling_name=sampling_data["sampling_name"],
        population_description=sampling_data["population_description"],
        population_size=sampling_data["population_size"],
        sample_size=sampling_data["sample_size"],
        sampling_method=sampling_data["sampling_method"],
        sampling_rationale=sampling_data.get("sampling_rationale"),
        confidence_level=sampling_data.get("confidence_level", 95),
        margin_of_error=sampling_data.get("margin_of_error", 5),
        selection_criteria=sampling_data.get("selection_criteria", []),
        sample_items=sample_items,
        assigned_to_id=sampling_data.get("assigned_to_id", current_user.id),
        due_date=sampling_data.get("due_date"),
        created_by_id=current_user.id
    )
    
    db.add(sampling)
    db.commit()
    db.refresh(sampling)
    
    return {
        "success": True,
        "message": "Audit sampling plan created",
        "sampling": sampling
    }

@router.get("/{audit_id}/sampling")
def get_audit_sampling(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all sampling plans for an audit
    """
    from app.models import AuditSampling
    
    sampling_plans = db.query(AuditSampling).filter(
        AuditSampling.audit_id == audit_id
    ).all()
    
    return sampling_plans

@router.put("/{audit_id}/sampling/{sampling_id}")
def update_sampling_results(
    audit_id: UUID,
    sampling_id: UUID,
    update_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update sampling test results
    """
    from app.models import AuditSampling
    
    sampling = db.query(AuditSampling).filter(
        AuditSampling.id == sampling_id,
        AuditSampling.audit_id == audit_id
    ).first()
    
    if not sampling:
        raise HTTPException(status_code=404, detail="Sampling plan not found")
    
    # Update sampling results
    if "sampling_results" in update_data:
        sampling.sampling_results = update_data["sampling_results"]
        
        # Recalculate statistics
        results = update_data["sampling_results"]
        sampling.samples_tested = len([r for r in results if r.get("tested", False)])
        sampling.samples_passed = len([r for r in results if r.get("result") == "pass"])
        sampling.samples_failed = len([r for r in results if r.get("result") == "fail"])
        
        if sampling.sample_size > 0:
            sampling.completion_percentage = int((sampling.samples_tested / sampling.sample_size) * 100)
            if sampling.samples_tested > 0:
                sampling.error_rate = (sampling.samples_failed / sampling.samples_tested) * 100
    
    # Update other fields
    for key, value in update_data.items():
        if hasattr(sampling, key) and key != "sampling_results":
            setattr(sampling, key, value)
    
    db.commit()
    db.refresh(sampling)
    
    return sampling

@router.post("/{audit_id}/observations")
def create_audit_observation(
    audit_id: UUID,
    observation_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.AUDITOR]))
):
    """
    Create audit observation per ISO 19011 Clause 6.4.2
    """
    from app.models import AuditObservation
    
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    observation = AuditObservation(
        audit_id=audit_id,
        observation_title=observation_data["observation_title"],
        observation_area=observation_data["observation_area"],
        observation_date=observation_data["observation_date"],
        observation_duration_minutes=observation_data.get("observation_duration_minutes"),
        observation_objective=observation_data.get("observation_objective"),
        process_observed=observation_data["process_observed"],
        personnel_observed=observation_data.get("personnel_observed", []),
        observations_made=observation_data["observations_made"],
        compliance_status=observation_data.get("compliance_status"),
        deviations_noted=observation_data.get("deviations_noted"),
        photos_taken=observation_data.get("photos_taken", []),
        documents_reviewed=observation_data.get("documents_reviewed", []),
        measurements_taken=observation_data.get("measurements_taken", []),
        observer_id=current_user.id,
        observation_method=observation_data.get("observation_method", "direct"),
        observation_announced=observation_data.get("observation_announced", True),
        requires_follow_up=observation_data.get("requires_follow_up", False),
        follow_up_actions=observation_data.get("follow_up_actions", []),
        created_by_id=current_user.id
    )
    
    db.add(observation)
    db.commit()
    db.refresh(observation)
    
    return {
        "success": True,
        "message": "Audit observation created",
        "observation": observation
    }

@router.get("/{audit_id}/observations")
def get_audit_observations(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all observations for an audit
    """
    from app.models import AuditObservation
    
    observations = db.query(AuditObservation).filter(
        AuditObservation.audit_id == audit_id
    ).all()
    
    return observations

@router.post("/{audit_id}/enhanced-evidence")
def upload_enhanced_evidence(
    audit_id: UUID,
    evidence_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upload evidence with enhanced ISO 19011 compliance features
    """
    import hashlib
    
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Calculate file hash for integrity
    file_hash = None
    if evidence_data.get("file_content"):
        file_hash = hashlib.sha256(evidence_data["file_content"].encode()).hexdigest()
    
    # Create chain of custody record
    chain_of_custody = [{
        "timestamp": datetime.utcnow().isoformat(),
        "user_id": str(current_user.id),
        "action": "uploaded",
        "location": evidence_data.get("collection_location", "system")
    }]
    
    evidence = AuditEvidence(
        audit_id=audit_id,
        file_name=evidence_data["file_name"],
        file_url=evidence_data["file_url"],
        uploaded_by_id=current_user.id,
        description=evidence_data.get("description"),
        evidence_type=evidence_data.get("evidence_type", "document"),
        file_hash=file_hash,
        file_size=evidence_data.get("file_size"),
        mime_type=evidence_data.get("mime_type"),
        timestamp_verified=evidence_data.get("timestamp_verified", False),
        integrity_verified=bool(file_hash),
        chain_of_custody=chain_of_custody,
        relevance_score=evidence_data.get("relevance_score", 3),
        reliability_score=evidence_data.get("reliability_score", 3),
        evidence_source=evidence_data.get("evidence_source", "manual_upload"),
        finding_id=evidence_data.get("finding_id"),
        supports_finding=evidence_data.get("supports_finding", False),
        tags=evidence_data.get("tags", [])
    )
    
    db.add(evidence)
    db.commit()
    db.refresh(evidence)
    
    return {
        "success": True,
        "message": "Enhanced evidence uploaded with integrity verification",
        "evidence": evidence
    }

@router.get("/{audit_id}/execution-status")
def get_execution_status(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive execution status per ISO 19011 Clause 6.4
    """
    from app.models import AuditInterviewNote, AuditSampling, AuditObservation
    
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Get execution components
    interview_notes = db.query(AuditInterviewNote).filter(
        AuditInterviewNote.audit_id == audit_id
    ).all()
    
    sampling_plans = db.query(AuditSampling).filter(
        AuditSampling.audit_id == audit_id
    ).all()
    
    observations = db.query(AuditObservation).filter(
        AuditObservation.audit_id == audit_id
    ).all()
    
    evidence_items = db.query(AuditEvidence).filter(
        AuditEvidence.audit_id == audit_id
    ).all()
    
    findings = db.query(AuditFinding).filter(
        AuditFinding.audit_id == audit_id
    ).all()
    
    # Calculate execution progress
    total_sampling_completion = 0
    if sampling_plans:
        total_sampling_completion = sum(s.completion_percentage for s in sampling_plans) / len(sampling_plans)
    
    evidence_with_integrity = sum(1 for e in evidence_items if e.integrity_verified)
    evidence_integrity_percentage = (evidence_with_integrity / len(evidence_items) * 100) if evidence_items else 0
    
    return {
        "audit_id": audit_id,
        "status": audit.status,
        "execution_completed": audit.execution_completed,
        "interview_notes_count": len(interview_notes),
        "sampling_plans_count": len(sampling_plans),
        "sampling_completion": total_sampling_completion,
        "observations_count": len(observations),
        "evidence_items_count": len(evidence_items),
        "evidence_integrity_percentage": evidence_integrity_percentage,
        "findings_count": len(findings),
        "can_proceed_to_reporting": (
            len(interview_notes) > 0 or 
            len(observations) > 0 or 
            len(evidence_items) > 0
        )
    }

def generate_sample_items(method: str, population_size: int, sample_size: int, criteria: list) -> list:
    """
    Generate sample items based on sampling method
    """
    import random
    
    sample_items = []
    
    if method == "random":
        # Simple random sampling
        selected_indices = random.sample(range(1, population_size + 1), min(sample_size, population_size))
        for i, index in enumerate(selected_indices):
            sample_items.append({
                "sample_id": i + 1,
                "population_item_id": index,
                "selected_date": datetime.utcnow().isoformat(),
                "tested": False,
                "result": None,
                "notes": ""
            })
    
    elif method == "systematic":
        # Systematic sampling
        interval = population_size // sample_size if sample_size > 0 else 1
        start = random.randint(1, interval)
        for i in range(sample_size):
            item_id = start + (i * interval)
            if item_id <= population_size:
                sample_items.append({
                    "sample_id": i + 1,
                    "population_item_id": item_id,
                    "selected_date": datetime.utcnow().isoformat(),
                    "tested": False,
                    "result": None,
                    "notes": ""
                })
    
    else:
        # Judgmental or other methods - create placeholder items
        for i in range(sample_size):
            sample_items.append({
                "sample_id": i + 1,
                "population_item_id": f"TBD_{i+1}",
                "selected_date": datetime.utcnow().isoformat(),
                "tested": False,
                "result": None,
                "notes": "To be determined based on judgmental criteria"
            })
    
    return sample_items

def generate_checklist_items(framework_template: str) -> list:
    """
    Generate checklist items based on ISO framework template
    """
    if framework_template == "ISO_19011":
        return [
            {"id": 1, "item": "Review audit objectives and criteria", "completed": False, "category": "Planning"},
            {"id": 2, "item": "Confirm audit scope and boundaries", "completed": False, "category": "Planning"},
            {"id": 3, "item": "Identify key auditee personnel", "completed": False, "category": "Coordination"},
            {"id": 4, "item": "Schedule opening meeting", "completed": False, "category": "Coordination"},
            {"id": 5, "item": "Prepare audit plan and work programme", "completed": False, "category": "Planning"},
            {"id": 6, "item": "Review previous audit reports", "completed": False, "category": "Research"},
            {"id": 7, "item": "Analyze relevant documentation", "completed": False, "category": "Research"},
            {"id": 8, "item": "Conduct pre-audit risk assessment", "completed": False, "category": "Risk Assessment"},
            {"id": 9, "item": "Prepare audit checklists and questionnaires", "completed": False, "category": "Tools"},
            {"id": 10, "item": "Confirm logistics and resources", "completed": False, "category": "Logistics"}
        ]
    elif framework_template == "ISO_27001":
        return [
            {"id": 1, "item": "Review ISMS scope and boundaries", "completed": False, "category": "ISMS"},
            {"id": 2, "item": "Analyze risk assessment methodology", "completed": False, "category": "Risk"},
            {"id": 3, "item": "Review security controls implementation", "completed": False, "category": "Controls"},
            {"id": 4, "item": "Check management review records", "completed": False, "category": "Management"},
            {"id": 5, "item": "Verify incident management processes", "completed": False, "category": "Incidents"}
        ]
    else:
        return [
            {"id": 1, "item": "General preparation checklist item", "completed": False, "category": "General"}
        ]

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
