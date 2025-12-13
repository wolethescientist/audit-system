from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime
from app.database import get_db
from app.models import AuditProgramme, User, UserRole
from app.schemas import AuditProgrammeCreate, AuditProgrammeResponse
from app.auth import get_current_user, require_roles

router = APIRouter(prefix="/audit-programmes", tags=["Audit Programmes"])

@router.post("/", response_model=AuditProgrammeResponse)
def create_audit_programme(
    programme_data: AuditProgrammeCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]))
):
    """
    Create a new audit programme per ISO 19011 Clause 5
    """
    new_programme = AuditProgramme(
        **programme_data.model_dump(),
        created_by_id=current_user.id
    )
    db.add(new_programme)
    db.commit()
    db.refresh(new_programme)
    return new_programme

@router.get("/", response_model=List[AuditProgrammeResponse])
def list_audit_programmes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List all audit programmes
    """
    programmes = db.query(AuditProgramme).all()
    return programmes

@router.get("/{programme_id}", response_model=AuditProgrammeResponse)
def get_audit_programme(
    programme_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific audit programme
    """
    programme = db.query(AuditProgramme).filter(AuditProgramme.id == programme_id).first()
    if not programme:
        raise HTTPException(status_code=404, detail="Audit programme not found")
    return programme

@router.put("/{programme_id}", response_model=AuditProgrammeResponse)
def update_audit_programme(
    programme_id: UUID,
    programme_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]))
):
    """
    Update an audit programme
    """
    programme = db.query(AuditProgramme).filter(AuditProgramme.id == programme_id).first()
    if not programme:
        raise HTTPException(status_code=404, detail="Audit programme not found")
    
    for key, value in programme_data.items():
        if hasattr(programme, key):
            setattr(programme, key, value)
    
    db.commit()
    db.refresh(programme)
    return programme

@router.delete("/{programme_id}")
def delete_audit_programme(
    programme_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]))
):
    """
    Delete an audit programme
    """
    programme = db.query(AuditProgramme).filter(AuditProgramme.id == programme_id).first()
    if not programme:
        raise HTTPException(status_code=404, detail="Audit programme not found")
    
    db.delete(programme)
    db.commit()
    
    return {"success": True, "message": "Audit programme deleted successfully"}

@router.get("/{programme_id}/audits")
def get_programme_audits(
    programme_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get all audits associated with a programme
    """
    from app.models import Audit
    
    programme = db.query(AuditProgramme).filter(AuditProgramme.id == programme_id).first()
    if not programme:
        raise HTTPException(status_code=404, detail="Audit programme not found")
    
    audits = db.query(Audit).filter(Audit.audit_programme_id == programme_id).all()
    return audits

@router.post("/{programme_id}/risk-assessment")
def update_programme_risk_assessment(
    programme_id: UUID,
    risk_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]))
):
    """
    Update programme risk assessment per ISO 19011 Clause 5.4
    """
    programme = db.query(AuditProgramme).filter(AuditProgramme.id == programme_id).first()
    if not programme:
        raise HTTPException(status_code=404, detail="Audit programme not found")
    
    programme.risk_assessment_completed = risk_data.get("risk_assessment_completed", False)
    programme.risk_factors_considered = risk_data.get("risk_factors_considered", [])
    
    db.commit()
    db.refresh(programme)
    
    return {
        "success": True,
        "message": "Programme risk assessment updated",
        "programme": programme
    }