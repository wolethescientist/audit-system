from fastapi import APIRouter, Depends, HTTPException, status as http_status, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, case, desc, asc
from typing import List, Optional
from datetime import datetime, timedelta
from uuid import UUID
import uuid

from app.database import get_db
from app.auth import get_current_user
from app.models import (
    User, CAPAItem, AuditFinding, RiskAssessment, Audit, 
    CAPAType, CAPAStatus, UserRole
)
from app.schemas import (
    CAPACreate, CAPAUpdate, CAPAResponse, CAPADetailResponse,
    RootCauseAnalysisUpdate, EffectivenessReviewUpdate,
    CAPAOverdueResponse, ErrorResponse
)

router = APIRouter(prefix="/api/v1/capa", tags=["CAPA Management"])

def generate_capa_number() -> str:
    """Generate unique CAPA reference number"""
    timestamp = datetime.now().strftime("%Y%m%d")
    random_suffix = str(uuid.uuid4())[:8].upper()
    return f"CAPA-{timestamp}-{random_suffix}"

@router.post("/create", response_model=CAPAResponse)
async def create_capa(
    capa_data: CAPACreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create new CAPA item following ISO 9001 and ISO 27001 requirements.
    """
    try:
        if capa_data.finding_id:
            finding = db.query(AuditFinding).filter(AuditFinding.id == capa_data.finding_id).first()
            if not finding:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Finding not found"
                )
        
        if capa_data.risk_id:
            risk = db.query(RiskAssessment).filter(RiskAssessment.id == capa_data.risk_id).first()
            if not risk:
                raise HTTPException(
                    status_code=http_status.HTTP_404_NOT_FOUND,
                    detail="Risk assessment not found"
                )
        
        capa_number = generate_capa_number()
        
        capa_item = CAPAItem(
            capa_number=capa_number,
            audit_id=capa_data.audit_id,
            finding_id=capa_data.finding_id,
            risk_id=capa_data.risk_id,
            capa_type=capa_data.capa_type,
            title=capa_data.title,
            description=capa_data.description,
            immediate_action=capa_data.immediate_action,
            corrective_action=capa_data.corrective_action,
            preventive_action=capa_data.preventive_action,
            assigned_to_id=capa_data.assigned_to_id,
            responsible_department_id=capa_data.responsible_department_id,
            due_date=capa_data.due_date,
            target_completion_date=capa_data.target_completion_date,
            priority=capa_data.priority or "medium",
            estimated_cost=capa_data.estimated_cost,
            created_by_id=current_user.id,
            status=CAPAStatus.OPEN
        )
        
        db.add(capa_item)
        db.commit()
        db.refresh(capa_item)
        
        return CAPAResponse.model_validate(capa_item)
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create CAPA: {str(e)}"
        )

@router.get("/", response_model=List[CAPAResponse])
async def get_capa_items(
    audit_id: Optional[UUID] = Query(None, description="Filter by audit ID"),
    capa_status: Optional[CAPAStatus] = Query(None, description="Filter by CAPA status"),
    assigned_to_id: Optional[UUID] = Query(None, description="Filter by assigned user"),
    priority: Optional[str] = Query(None, description="Filter by priority"),
    overdue_only: Optional[bool] = Query(False, description="Show only overdue items"),
    skip: int = Query(0, ge=0, description="Number of records to skip"),
    limit: int = Query(100, ge=1, le=1000, description="Number of records to return"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get CAPA items with filtering and pagination"""
    try:
        query = db.query(CAPAItem)
        
        if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
            query = query.filter(
                or_(
                    CAPAItem.assigned_to_id == current_user.id,
                    CAPAItem.responsible_department_id == current_user.department_id
                )
            )
        
        if audit_id:
            query = query.filter(CAPAItem.audit_id == audit_id)
        
        if capa_status:
            query = query.filter(CAPAItem.status == capa_status)
        
        if assigned_to_id:
            query = query.filter(CAPAItem.assigned_to_id == assigned_to_id)
        
        if priority:
            query = query.filter(CAPAItem.priority == priority)
        
        if overdue_only:
            today = datetime.now().date()
            query = query.filter(
                and_(
                    CAPAItem.due_date < today,
                    CAPAItem.status.in_([CAPAStatus.OPEN, CAPAStatus.IN_PROGRESS])
                )
            )
        
        # Simple ordering by due date (avoid complex case statement)
        query = query.order_by(asc(CAPAItem.due_date))
        
        capa_items = query.offset(skip).limit(limit).all()
        return [CAPAResponse.model_validate(item) for item in capa_items]
    except Exception as e:
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch CAPA items: {str(e)}"
        )

@router.get("/{capa_id}", response_model=CAPADetailResponse)
async def get_capa_detail(
    capa_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed CAPA information"""
    capa_item = db.query(CAPAItem).filter(CAPAItem.id == capa_id).first()
    if not capa_item:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="CAPA item not found"
        )
    
    if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
        if (capa_item.assigned_to_id != current_user.id and 
            capa_item.responsible_department_id != current_user.department_id):
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied to this CAPA item"
            )
    
    return CAPADetailResponse.model_validate(capa_item)

@router.put("/{capa_id}/root-cause", response_model=CAPAResponse)
async def update_root_cause_analysis(
    capa_id: UUID,
    root_cause_data: RootCauseAnalysisUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update root cause analysis for CAPA item."""
    capa_item = db.query(CAPAItem).filter(CAPAItem.id == capa_id).first()
    if not capa_item:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="CAPA item not found"
        )
    
    if (current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER] and
        capa_item.assigned_to_id != current_user.id):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Only assigned user or managers can update root cause analysis"
        )
    
    try:
        capa_item.root_cause_analysis = root_cause_data.root_cause_analysis
        capa_item.root_cause_method = root_cause_data.root_cause_method
        
        if root_cause_data.corrective_action:
            capa_item.corrective_action = root_cause_data.corrective_action
        if root_cause_data.preventive_action:
            capa_item.preventive_action = root_cause_data.preventive_action
        
        if capa_item.status == CAPAStatus.OPEN:
            capa_item.status = CAPAStatus.IN_PROGRESS
        
        capa_item.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(capa_item)
        
        return CAPAResponse.model_validate(capa_item)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update root cause analysis: {str(e)}"
        )

@router.get("/overdue", response_model=List[CAPAOverdueResponse])
async def get_overdue_capa(
    days_overdue: Optional[int] = Query(None, description="Filter by days overdue"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get overdue CAPA items for monitoring and alerts"""
    today = datetime.now().date()
    
    query = db.query(CAPAItem).filter(
        and_(
            CAPAItem.due_date < today,
            CAPAItem.status.in_([CAPAStatus.OPEN, CAPAStatus.IN_PROGRESS])
        )
    )
    
    if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
        query = query.filter(
            or_(
                CAPAItem.assigned_to_id == current_user.id,
                CAPAItem.responsible_department_id == current_user.department_id
            )
        )
    
    if days_overdue:
        cutoff_date = today - timedelta(days=days_overdue)
        query = query.filter(CAPAItem.due_date >= cutoff_date)
    
    query = query.order_by(asc(CAPAItem.due_date))
    overdue_items = query.all()
    
    result = []
    for item in overdue_items:
        days_overdue_calc = (today - item.due_date.date()).days if item.due_date else 0
        result.append(CAPAOverdueResponse(
            id=item.id,
            capa_number=item.capa_number,
            title=item.title,
            assigned_to_id=item.assigned_to_id,
            due_date=item.due_date,
            days_overdue=days_overdue_calc,
            priority=item.priority,
            status=item.status
        ))
    
    return result

@router.put("/{capa_id}/verify", response_model=CAPAResponse)
async def verify_capa_effectiveness(
    capa_id: UUID,
    verification_data: EffectivenessReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify CAPA effectiveness and close if confirmed."""
    capa_item = db.query(CAPAItem).filter(CAPAItem.id == capa_id).first()
    if not capa_item:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="CAPA item not found"
        )
    
    if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Only managers can verify CAPA effectiveness"
        )
    
    try:
        capa_item.verification_method = verification_data.verification_method
        capa_item.verification_evidence = verification_data.verification_evidence
        capa_item.effectiveness_review_date = datetime.utcnow()
        capa_item.effectiveness_confirmed = verification_data.effectiveness_confirmed
        capa_item.effectiveness_notes = verification_data.effectiveness_notes
        
        if verification_data.actual_cost:
            capa_item.actual_cost = verification_data.actual_cost
        
        if verification_data.effectiveness_confirmed:
            capa_item.status = CAPAStatus.CLOSED
            capa_item.actual_completion_date = datetime.utcnow()
            capa_item.closed_by_id = current_user.id
        else:
            capa_item.status = CAPAStatus.IN_PROGRESS
        
        capa_item.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(capa_item)
        
        return CAPAResponse.model_validate(capa_item)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to verify CAPA effectiveness: {str(e)}"
        )

@router.put("/{capa_id}", response_model=CAPAResponse)
async def update_capa(
    capa_id: UUID,
    capa_update: CAPAUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update CAPA item details"""
    capa_item = db.query(CAPAItem).filter(CAPAItem.id == capa_id).first()
    if not capa_item:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="CAPA item not found"
        )
    
    if (current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER] and
        capa_item.assigned_to_id != current_user.id):
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Access denied to update this CAPA item"
        )
    
    try:
        update_data = capa_update.dict(exclude_unset=True)
        for field, value in update_data.items():
            if hasattr(capa_item, field):
                setattr(capa_item, field, value)
        
        capa_item.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(capa_item)
        
        return CAPAResponse.model_validate(capa_item)
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update CAPA: {str(e)}"
        )

@router.delete("/{capa_id}")
async def delete_capa(
    capa_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete CAPA item (admin only)"""
    if current_user.role != UserRole.SYSTEM_ADMIN:
        raise HTTPException(
            status_code=http_status.HTTP_403_FORBIDDEN,
            detail="Only system administrators can delete CAPA items"
        )
    
    capa_item = db.query(CAPAItem).filter(CAPAItem.id == capa_id).first()
    if not capa_item:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="CAPA item not found"
        )
    
    try:
        db.delete(capa_item)
        db.commit()
        return {"message": "CAPA item deleted successfully"}
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete CAPA: {str(e)}"
        )

@router.get("/{capa_id}/progress", response_model=dict)
async def get_capa_progress(
    capa_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get CAPA progress tracking information"""
    capa_item = db.query(CAPAItem).filter(CAPAItem.id == capa_id).first()
    if not capa_item:
        raise HTTPException(
            status_code=http_status.HTTP_404_NOT_FOUND,
            detail="CAPA item not found"
        )
    
    if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
        if (capa_item.assigned_to_id != current_user.id and 
            capa_item.responsible_department_id != current_user.department_id):
            raise HTTPException(
                status_code=http_status.HTTP_403_FORBIDDEN,
                detail="Access denied to this CAPA item"
            )
    
    today = datetime.now().date()
    days_since_creation = (today - capa_item.created_at.date()).days
    
    days_until_due = None
    is_overdue = False
    if capa_item.due_date:
        days_until_due = (capa_item.due_date.date() - today).days
        is_overdue = days_until_due < 0
    
    progress_percentage = capa_item.progress_percentage or 0
    
    status_progress = {
        CAPAStatus.OPEN: 10,
        CAPAStatus.IN_PROGRESS: 50,
        CAPAStatus.PENDING_VERIFICATION: 80,
        CAPAStatus.CLOSED: 100,
        CAPAStatus.OVERDUE: 0
    }
    
    calculated_progress = status_progress.get(capa_item.status, 0)
    
    return {
        "capa_id": capa_item.id,
        "capa_number": capa_item.capa_number,
        "status": capa_item.status,
        "progress_percentage": max(progress_percentage, calculated_progress),
        "days_since_creation": days_since_creation,
        "days_until_due": days_until_due,
        "is_overdue": is_overdue,
        "has_root_cause_analysis": bool(capa_item.root_cause_analysis),
        "has_corrective_action": bool(capa_item.corrective_action),
        "has_preventive_action": bool(capa_item.preventive_action),
        "effectiveness_confirmed": capa_item.effectiveness_confirmed,
        "completion_milestones": {
            "root_cause_completed": bool(capa_item.root_cause_analysis),
            "actions_defined": bool(capa_item.corrective_action or capa_item.preventive_action),
            "implementation_started": capa_item.status in [CAPAStatus.IN_PROGRESS, CAPAStatus.PENDING_VERIFICATION, CAPAStatus.CLOSED],
            "verification_completed": bool(capa_item.verification_evidence),
            "effectiveness_confirmed": capa_item.effectiveness_confirmed
        }
    }
