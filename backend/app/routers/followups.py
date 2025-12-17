from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from app.database import get_db
from app.auth import get_current_user, require_roles
from app.models import (
    AuditFollowup, Audit, User, UserRole, AuditFinding, 
    AuditStatus, Department
)
from app.schemas import FollowupResponse, FollowupUpdate, FollowupCreate

router = APIRouter(prefix="/followups", tags=["Follow-ups"])


@router.post("/audit/{audit_id}", response_model=FollowupResponse)
def create_followup(
    audit_id: UUID,
    followup_data: FollowupCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new follow-up action for an audit
    Requirements: 2.5, 14.1
    """
    # Verify audit exists
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Verify finding exists if provided
    if followup_data.finding_id:
        finding = db.query(AuditFinding).filter(
            AuditFinding.id == followup_data.finding_id,
            AuditFinding.audit_id == audit_id
        ).first()
        if not finding:
            raise HTTPException(status_code=404, detail="Finding not found for this audit")
    
    # Verify assigned user exists
    assigned_user = db.query(User).filter(User.id == followup_data.assigned_to_id).first()
    if not assigned_user:
        raise HTTPException(status_code=404, detail="Assigned user not found")
    
    # Create the follow-up
    new_followup = AuditFollowup(
        audit_id=audit_id,
        finding_id=followup_data.finding_id,
        assigned_to_id=followup_data.assigned_to_id,
        due_date=followup_data.due_date,
        status="pending"
    )
    
    db.add(new_followup)
    db.commit()
    db.refresh(new_followup)
    
    return new_followup


@router.put("/{followup_id}", response_model=FollowupResponse)
def update_followup(
    followup_id: UUID,
    followup_data: FollowupUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a follow-up action
    Requirements: 2.5, 14.2
    """
    followup = db.query(AuditFollowup).filter(AuditFollowup.id == followup_id).first()
    if not followup:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    
    # Check permission
    if followup.assigned_to_id != current_user.id and current_user.role not in [UserRole.AUDIT_MANAGER, UserRole.SYSTEM_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to modify this follow-up")
    
    # Update fields
    if followup_data.status is not None:
        followup.status = followup_data.status
    if followup_data.evidence_url is not None:
        followup.evidence_url = followup_data.evidence_url
    if followup_data.completion_notes is not None:
        followup.completion_notes = followup_data.completion_notes
    
    db.commit()
    db.refresh(followup)
    
    return followup

@router.get("/my-followups", response_model=List[FollowupResponse])
def get_my_followups(
    status: Optional[str] = Query(None, description="Filter by status"),
    overdue_only: Optional[bool] = Query(False, description="Show only overdue items"),
    audit_id: Optional[UUID] = Query(None, description="Filter by specific audit"),
    sort_by: Optional[str] = Query("due_date", description="Sort by: due_date, created_at, status"),
    sort_order: Optional[str] = Query("asc", description="Sort order: asc, desc"),
    limit: Optional[int] = Query(50, description="Maximum number of results"),
    offset: Optional[int] = Query(0, description="Offset for pagination"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user-specific follow-up list with advanced filtering and sorting
    Requirements: 2.5, 14.1, 14.2, 14.3, 14.4
    """
    # Base query for user's assigned follow-ups
    query = db.query(AuditFollowup).filter(
        AuditFollowup.assigned_to_id == current_user.id
    )
    
    # Apply filters
    if status:
        query = query.filter(AuditFollowup.status == status)
    
    if overdue_only:
        query = query.filter(
            and_(
                AuditFollowup.due_date < datetime.utcnow(),
                AuditFollowup.status.notin_(["completed", "closed"])
            )
        )
    
    if audit_id:
        query = query.filter(AuditFollowup.audit_id == audit_id)
    
    # Apply sorting
    if sort_by == "due_date":
        sort_column = AuditFollowup.due_date
    elif sort_by == "created_at":
        sort_column = AuditFollowup.created_at
    elif sort_by == "status":
        sort_column = AuditFollowup.status
    else:
        sort_column = AuditFollowup.due_date
    
    if sort_order == "desc":
        query = query.order_by(desc(sort_column))
    else:
        query = query.order_by(asc(sort_column))
    
    # Apply pagination
    query = query.offset(offset).limit(limit)
    
    followups = query.all()
    return followups

@router.get("/department-followups", response_model=List[FollowupResponse])
def get_department_followups(
    status: Optional[str] = Query(None, description="Filter by status"),
    overdue_only: Optional[bool] = Query(False, description="Show only overdue items"),
    assigned_user_id: Optional[UUID] = Query(None, description="Filter by assigned user"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.DEPARTMENT_HEAD, UserRole.AUDIT_MANAGER]))
):
    """
    Get department-specific follow-ups for managers
    Requirements: 14.1, 14.2, 14.3
    """
    if not current_user.department_id:
        raise HTTPException(status_code=400, detail="User must be assigned to a department")
    
    # Get all users in the same department
    department_users = db.query(User).filter(
        User.department_id == current_user.department_id
    ).all()
    department_user_ids = [user.id for user in department_users]
    
    # Base query for department follow-ups
    query = db.query(AuditFollowup).filter(
        AuditFollowup.assigned_to_id.in_(department_user_ids)
    )
    
    # Apply filters
    if status:
        query = query.filter(AuditFollowup.status == status)
    
    if overdue_only:
        query = query.filter(
            and_(
                AuditFollowup.due_date < datetime.utcnow(),
                AuditFollowup.status.notin_(["completed", "closed"])
            )
        )
    
    if assigned_user_id:
        query = query.filter(AuditFollowup.assigned_to_id == assigned_user_id)
    
    followups = query.order_by(AuditFollowup.due_date.asc()).all()
    return followups

@router.get("/audit/{audit_id}/followups-with-navigation")
def get_audit_followups_with_navigation(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get follow-ups for an audit with direct navigation links
    Requirements: 14.3, 14.4
    """
    # Verify audit exists and user has access
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Get follow-ups for the audit
    followups = db.query(AuditFollowup).filter(
        AuditFollowup.audit_id == audit_id
    ).order_by(AuditFollowup.due_date.asc()).all()
    
    # Convert followups to serializable dicts
    followups_data = [
        {
            "id": str(f.id),
            "audit_id": str(f.audit_id),
            "finding_id": str(f.finding_id) if f.finding_id else None,
            "assigned_to_id": str(f.assigned_to_id) if f.assigned_to_id else None,
            "due_date": f.due_date.isoformat() if f.due_date else None,
            "status": f.status,
            "evidence_url": f.evidence_url,
            "completion_notes": f.completion_notes,
            "created_at": f.created_at.isoformat() if f.created_at else None
        }
        for f in followups
    ]
    
    # Build navigation context
    navigation = {
        "audit_id": str(audit_id),
        "audit_title": audit.title,
        "audit_status": audit.status.value,
        "navigation_links": {
            "audit_overview": f"/audits/{audit_id}",
            "audit_findings": f"/audits/{audit_id}/findings",
            "audit_evidence": f"/audits/{audit_id}/evidence",
            "audit_report": f"/audits/{audit_id}/report"
        }
    }
    
    return {
        "followups": followups_data,
        "navigation": navigation,
        "summary": {
            "total_followups": len(followups),
            "pending": len([f for f in followups if f.status == "pending"]),
            "in_progress": len([f for f in followups if f.status == "in_progress"]),
            "completed": len([f for f in followups if f.status == "completed"]),
            "overdue": len([f for f in followups if f.due_date and f.due_date < datetime.utcnow() and f.status not in ["completed", "closed"]])
        }
    }

@router.put("/{followup_id}/auto-transition", response_model=FollowupResponse)
def auto_transition_followup_status(
    followup_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Automated status transition for follow-ups (completed → closed)
    Requirements: 2.5, 14.4
    """
    followup = db.query(AuditFollowup).filter(AuditFollowup.id == followup_id).first()
    if not followup:
        raise HTTPException(status_code=404, detail="Follow-up not found")
    
    # Check if user has permission to modify this follow-up
    if followup.assigned_to_id != current_user.id and current_user.role not in [UserRole.AUDIT_MANAGER, UserRole.SYSTEM_ADMIN]:
        raise HTTPException(status_code=403, detail="Not authorized to modify this follow-up")
    
    # Automated transition logic
    if followup.status == "completed":
        # Auto-transition to closed
        followup.status = "closed"
        followup.completion_notes = (followup.completion_notes or "") + f"\nAuto-closed by system on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"
        
        db.commit()
        db.refresh(followup)
        
        return followup
    else:
        raise HTTPException(status_code=400, detail="Follow-up must be in 'completed' status for auto-transition")

@router.get("/overdue-notifications")
def get_overdue_followup_notifications(
    days_ahead: Optional[int] = Query(7, description="Days ahead to check for upcoming due dates"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get follow-up notifications for due date alerts
    Requirements: 14.1, 14.4
    """
    # Helper function to serialize followup
    def serialize_followup(f):
        return {
            "id": str(f.id),
            "audit_id": str(f.audit_id),
            "finding_id": str(f.finding_id) if f.finding_id else None,
            "assigned_to_id": str(f.assigned_to_id) if f.assigned_to_id else None,
            "due_date": f.due_date.isoformat() if f.due_date else None,
            "status": f.status,
            "evidence_url": f.evidence_url,
            "completion_notes": f.completion_notes,
            "created_at": f.created_at.isoformat() if f.created_at else None
        }
    
    # Calculate date ranges
    now = datetime.utcnow()
    upcoming_date = now + timedelta(days=days_ahead)
    
    # Get overdue follow-ups
    overdue_followups = db.query(AuditFollowup).filter(
        and_(
            AuditFollowup.assigned_to_id == current_user.id,
            AuditFollowup.due_date < now,
            AuditFollowup.status.notin_(["completed", "closed"])
        )
    ).all()
    
    # Get upcoming due follow-ups
    upcoming_followups = db.query(AuditFollowup).filter(
        and_(
            AuditFollowup.assigned_to_id == current_user.id,
            AuditFollowup.due_date >= now,
            AuditFollowup.due_date <= upcoming_date,
            AuditFollowup.status.notin_(["completed", "closed"])
        )
    ).all()
    
    return {
        "overdue": {
            "count": len(overdue_followups),
            "items": [serialize_followup(f) for f in overdue_followups]
        },
        "upcoming": {
            "count": len(upcoming_followups),
            "items": [serialize_followup(f) for f in upcoming_followups]
        },
        "notification_summary": {
            "total_alerts": len(overdue_followups) + len(upcoming_followups),
            "overdue_count": len(overdue_followups),
            "upcoming_count": len(upcoming_followups)
        }
    }

@router.post("/bulk-auto-close")
def bulk_auto_close_completed_followups(
    audit_id: Optional[UUID] = Query(None, description="Limit to specific audit"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.AUDIT_MANAGER, UserRole.SYSTEM_ADMIN]))
):
    """
    Bulk auto-close completed follow-ups
    Requirements: 15.1, 15.2
    """
    # Base query for completed follow-ups
    query = db.query(AuditFollowup).filter(
        AuditFollowup.status == "completed"
    )
    
    if audit_id:
        query = query.filter(AuditFollowup.audit_id == audit_id)
    
    completed_followups = query.all()
    
    # Auto-close all completed follow-ups
    closed_count = 0
    for followup in completed_followups:
        followup.status = "closed"
        followup.completion_notes = (followup.completion_notes or "") + f"\nBulk auto-closed by {current_user.full_name} on {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')}"
        closed_count += 1
    
    db.commit()
    
    return {
        "message": f"Successfully auto-closed {closed_count} completed follow-ups",
        "closed_count": closed_count,
        "audit_id": audit_id
    }

@router.get("/statistics")
def get_followup_statistics(
    audit_id: Optional[UUID] = Query(None, description="Filter by specific audit"),
    department_id: Optional[UUID] = Query(None, description="Filter by department"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get follow-up statistics and metrics
    Requirements: 15.3, 15.4
    """
    # Base query
    query = db.query(AuditFollowup)
    
    # Apply filters based on user role and permissions
    if current_user.role in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
        # Admin/Manager can see all statistics
        if audit_id:
            query = query.filter(AuditFollowup.audit_id == audit_id)
        if department_id:
            # Filter by department users
            dept_users = db.query(User).filter(User.department_id == department_id).all()
            dept_user_ids = [user.id for user in dept_users]
            query = query.filter(AuditFollowup.assigned_to_id.in_(dept_user_ids))
    else:
        # Regular users see only their own statistics
        query = query.filter(AuditFollowup.assigned_to_id == current_user.id)
        if audit_id:
            query = query.filter(AuditFollowup.audit_id == audit_id)
    
    all_followups = query.all()
    
    # Calculate statistics
    now = datetime.utcnow()
    
    stats = {
        "total_followups": len(all_followups),
        "by_status": {
            "pending": len([f for f in all_followups if f.status == "pending"]),
            "in_progress": len([f for f in all_followups if f.status == "in_progress"]),
            "completed": len([f for f in all_followups if f.status == "completed"]),
            "closed": len([f for f in all_followups if f.status == "closed"])
        },
        "overdue_count": len([f for f in all_followups if f.due_date and f.due_date < now and f.status not in ["completed", "closed"]]),
        "due_this_week": len([f for f in all_followups if f.due_date and f.due_date >= now and f.due_date <= now + timedelta(days=7) and f.status not in ["completed", "closed"]]),
        "completion_rate": round((len([f for f in all_followups if f.status in ["completed", "closed"]]) / len(all_followups) * 100), 2) if all_followups else 0
    }
    
    return stats