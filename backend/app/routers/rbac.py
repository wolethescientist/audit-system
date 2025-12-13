from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import List, Optional, Dict, Any
from uuid import UUID
from datetime import datetime, timedelta
from app.database import get_db
from app.models import (
    User, UserRole, Audit, AuditTeam, RoleMatrix, UserRoleAssignment,
    SystemAuditLog, Department
)
from app.schemas import UserResponse, ErrorResponse
from app.auth import (
    get_current_user, require_roles, require_permission, 
    check_audit_access, get_accessible_audits, check_team_assignment_permission,
    validate_team_member_eligibility, log_access_attempt
)
from pydantic import BaseModel

router = APIRouter(prefix="/rbac", tags=["Role-Based Access Control"])

# Enhanced Authentication and Authorization Schemas

class TeamAssignmentRequest(BaseModel):
    audit_id: UUID
    team_members: List[Dict[str, Any]]  # [{"user_id": UUID, "role_in_audit": str}]
    lead_auditor_id: Optional[UUID] = None

class TeamAssignmentResponse(BaseModel):
    success: bool
    message: str
    assigned_members: int
    lead_auditor_assigned: bool
    audit_id: UUID

class AccessControlCheck(BaseModel):
    resource_type: str
    resource_id: Optional[str] = None
    permission: Optional[str] = None

class AccessControlResponse(BaseModel):
    has_access: bool
    reason: str
    user_role: str
    department_id: Optional[UUID] = None

class UserAuditAccess(BaseModel):
    user_id: UUID
    accessible_audit_count: int
    accessible_audits: List[Dict[str, Any]]
    access_level: str  # full, department, assigned_only, none

class RoleMatrixCreate(BaseModel):
    role_name: str
    role_description: Optional[str] = None
    role_category: Optional[str] = "business"
    department_id: Optional[UUID] = None
    is_global_role: Optional[bool] = False
    permissions: Dict[str, bool]

class RoleMatrixResponse(BaseModel):
    id: UUID
    role_name: str
    role_description: Optional[str]
    role_category: str
    department_id: Optional[UUID]
    is_global_role: bool
    permissions: Dict[str, bool]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class UserRoleAssignmentCreate(BaseModel):
    user_id: UUID
    role_id: UUID
    assignment_reason: Optional[str] = None
    effective_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    is_temporary: Optional[bool] = False

class UserRoleAssignmentResponse(BaseModel):
    id: UUID
    user_id: UUID
    role_id: UUID
    assignment_reason: Optional[str]
    effective_date: datetime
    expiry_date: Optional[datetime]
    is_temporary: bool
    is_active: bool
    approved_by_id: Optional[UUID]
    approval_date: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Multi-Auditor Team Assignment API

@router.post("/team-assignment", response_model=TeamAssignmentResponse)
def assign_audit_team(
    assignment_request: TeamAssignmentRequest,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_create_audits"))
):
    """
    Assign multi-auditor team to audit with competency validation
    Requirements: 6.2, 6.3 - Multi-auditor support and team assignment
    """
    # Get audit and verify access
    audit = db.query(Audit).filter(Audit.id == assignment_request.audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Check if user can assign team members to this audit
    if not check_team_assignment_permission(current_user, audit, db):
        log_access_attempt(
            db, current_user.id, "TEAM_ASSIGNMENT_DENIED", "AUDIT",
            str(assignment_request.audit_id), False, request.client.host
        )
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Insufficient permissions to assign team members"
        )
    
    assigned_count = 0
    lead_auditor_assigned = False
    
    # Assign lead auditor if specified
    if assignment_request.lead_auditor_id:
        if validate_team_member_eligibility(assignment_request.lead_auditor_id, db):
            audit.lead_auditor_id = assignment_request.lead_auditor_id
            lead_auditor_assigned = True
        else:
            raise HTTPException(
                status_code=400, 
                detail="Lead auditor is not eligible for audit team assignment"
            )
    
    # Assign team members
    for member_data in assignment_request.team_members:
        user_id = member_data.get("user_id")
        role_in_audit = member_data.get("role_in_audit", "auditor")
        
        # Validate team member eligibility
        if not validate_team_member_eligibility(user_id, db):
            continue  # Skip ineligible members
        
        # Check if already assigned
        existing = db.query(AuditTeam).filter(
            and_(
                AuditTeam.audit_id == assignment_request.audit_id,
                AuditTeam.user_id == user_id
            )
        ).first()
        
        if not existing:
            team_member = AuditTeam(
                audit_id=assignment_request.audit_id,
                user_id=user_id,
                role_in_audit=role_in_audit
            )
            db.add(team_member)
            assigned_count += 1
    
    # Mark team competency as verified (ISO 19011 requirement)
    audit.audit_team_competency_verified = True
    
    db.commit()
    
    # Log successful team assignment
    log_access_attempt(
        db, current_user.id, "TEAM_ASSIGNMENT_SUCCESS", "AUDIT",
        str(assignment_request.audit_id), True, request.client.host
    )
    
    return TeamAssignmentResponse(
        success=True,
        message=f"Successfully assigned {assigned_count} team members",
        assigned_members=assigned_count,
        lead_auditor_assigned=lead_auditor_assigned,
        audit_id=assignment_request.audit_id
    )

@router.get("/team-assignment/{audit_id}")
def get_audit_team(
    audit_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get audit team assignment details
    Requirements: 6.2, 6.3
    """
    # Verify audit access
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    if not check_audit_access(current_user, audit, db):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this audit"
        )
    
    # Get team members
    team_members = db.query(AuditTeam).filter(AuditTeam.audit_id == audit_id).all()
    
    # Get lead auditor details
    lead_auditor = None
    if audit.lead_auditor_id:
        lead_auditor = db.query(User).filter(User.id == audit.lead_auditor_id).first()
    
    return {
        "audit_id": audit_id,
        "lead_auditor": {
            "id": lead_auditor.id if lead_auditor else None,
            "full_name": lead_auditor.full_name if lead_auditor else None,
            "email": lead_auditor.email if lead_auditor else None,
            "role": lead_auditor.role if lead_auditor else None
        } if lead_auditor else None,
        "team_members": [
            {
                "id": member.id,
                "user_id": member.user_id,
                "role_in_audit": member.role_in_audit,
                "user_details": {
                    "full_name": member.user.full_name,
                    "email": member.user.email,
                    "role": member.user.role
                }
            }
            for member in team_members
        ],
        "team_competency_verified": audit.audit_team_competency_verified,
        "total_team_size": len(team_members) + (1 if lead_auditor else 0)
    }

# Department-Based Access Control

@router.get("/user-audit-access", response_model=UserAuditAccess)
def get_user_audit_access(
    user_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user's audit access based on department and role
    Requirements: 6.3, 6.4 - Department-based access filtering
    """
    # If no user_id provided, use current user
    target_user = current_user
    if user_id:
        # Only admins can check other users' access
        if current_user.role != UserRole.SYSTEM_ADMIN:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Can only check your own audit access"
            )
        target_user = db.query(User).filter(User.id == user_id).first()
        if not target_user:
            raise HTTPException(status_code=404, detail="User not found")
    
    # Get accessible audits
    accessible_audits = get_accessible_audits(target_user, db)
    
    # Determine access level
    access_level = "none"
    if target_user.role == UserRole.SYSTEM_ADMIN:
        access_level = "full"
    elif target_user.role in [UserRole.AUDIT_MANAGER, UserRole.DEPARTMENT_HEAD]:
        access_level = "department"
    elif target_user.role in [UserRole.AUDITOR, UserRole.DEPARTMENT_OFFICER, UserRole.VIEWER]:
        access_level = "assigned_only"
    
    # Format audit details
    audit_details = []
    for audit in accessible_audits:
        audit_details.append({
            "id": str(audit.id),
            "title": audit.title,
            "status": audit.status,
            "department_id": str(audit.department_id) if audit.department_id else None,
            "assigned_manager_id": str(audit.assigned_manager_id) if audit.assigned_manager_id else None,
            "lead_auditor_id": str(audit.lead_auditor_id) if audit.lead_auditor_id else None,
            "access_reason": get_access_reason(target_user, audit, db)
        })
    
    return UserAuditAccess(
        user_id=target_user.id,
        accessible_audit_count=len(accessible_audits),
        accessible_audits=audit_details,
        access_level=access_level
    )

def get_access_reason(user: User, audit: Audit, db: Session) -> str:
    """Helper function to determine why user has access to audit"""
    if user.role == UserRole.SYSTEM_ADMIN:
        return "System Administrator"
    if audit.assigned_manager_id == user.id:
        return "Assigned Manager"
    if audit.created_by_id == user.id:
        return "Audit Creator"
    if audit.lead_auditor_id == user.id:
        return "Lead Auditor"
    if audit.department_id == user.department_id:
        return "Same Department"
    
    # Check team assignment
    team_assignment = db.query(AuditTeam).filter(
        and_(AuditTeam.audit_id == audit.id, AuditTeam.user_id == user.id)
    ).first()
    if team_assignment:
        return f"Team Member ({team_assignment.role_in_audit})"
    
    return "Unknown"

# Access Control Validation

@router.post("/check-access", response_model=AccessControlResponse)
def check_access_control(
    access_check: AccessControlCheck,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Check if user has access to specific resource
    Requirements: 6.1, 6.4, 6.5 - Access control validation
    """
    has_access = False
    reason = "Access denied"
    
    try:
        if access_check.resource_type == "audit" and access_check.resource_id:
            audit = db.query(Audit).filter(Audit.id == UUID(access_check.resource_id)).first()
            if audit:
                has_access = check_audit_access(current_user, audit, db)
                reason = "Audit access granted" if has_access else "Insufficient audit permissions"
        
        elif access_check.permission:
            from app.auth import check_permission
            has_access = check_permission(current_user, access_check.permission, db)
            reason = f"Permission {access_check.permission} granted" if has_access else f"Permission {access_check.permission} denied"
        
        # Log access check
        log_access_attempt(
            db, current_user.id, "ACCESS_CHECK", access_check.resource_type,
            access_check.resource_id, has_access, request.client.host
        )
        
    except Exception as e:
        reason = f"Access check failed: {str(e)}"
    
    return AccessControlResponse(
        has_access=has_access,
        reason=reason,
        user_role=current_user.role.value,
        department_id=current_user.department_id
    )

# Admin Override Capabilities

@router.post("/admin-override/audit-access")
def admin_override_audit_access(
    audit_id: UUID,
    target_user_id: UUID,
    override_reason: str,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN]))
):
    """
    Admin override for system-wide audit access
    Requirements: 6.5 - Admin override capabilities
    """
    # Verify audit exists
    audit = db.query(Audit).filter(Audit.id == audit_id).first()
    if not audit:
        raise HTTPException(status_code=404, detail="Audit not found")
    
    # Verify target user exists
    target_user = db.query(User).filter(User.id == target_user_id).first()
    if not target_user:
        raise HTTPException(status_code=404, detail="Target user not found")
    
    # Add user to audit team with admin override
    existing = db.query(AuditTeam).filter(
        and_(AuditTeam.audit_id == audit_id, AuditTeam.user_id == target_user_id)
    ).first()
    
    if not existing:
        team_member = AuditTeam(
            audit_id=audit_id,
            user_id=target_user_id,
            role_in_audit="admin_override"
        )
        db.add(team_member)
    
    # Log admin override action
    log_access_attempt(
        db, current_user.id, "ADMIN_OVERRIDE", "AUDIT_ACCESS",
        f"{audit_id}:{target_user_id}", True, request.client.host
    )
    
    # Create detailed audit log for admin override
    override_log = SystemAuditLog(
        user_id=current_user.id,
        action_type="ADMIN_OVERRIDE",
        resource_type="AUDIT_ACCESS",
        resource_id=str(audit_id),
        before_values={"target_user_id": str(target_user_id), "had_access": False},
        after_values={"target_user_id": str(target_user_id), "had_access": True},
        business_context=f"Admin override: {override_reason}",
        ip_address=request.client.host,
        security_event=True,
        risk_level="high"
    )
    db.add(override_log)
    
    db.commit()
    
    return {
        "success": True,
        "message": f"Admin override granted audit access to {target_user.full_name}",
        "audit_id": audit_id,
        "target_user_id": target_user_id,
        "override_reason": override_reason,
        "overridden_by": current_user.full_name
    }

@router.get("/admin-override/system-access")
def get_system_wide_access(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN]))
):
    """
    Get system-wide access overview for admins
    Requirements: 6.5 - Admin system-wide access
    """
    # Get all audits with access statistics
    all_audits = db.query(Audit).all()
    
    audit_access_summary = []
    for audit in all_audits:
        # Count team members
        team_count = db.query(AuditTeam).filter(AuditTeam.audit_id == audit.id).count()
        
        # Get department info
        department = db.query(Department).filter(Department.id == audit.department_id).first()
        
        audit_access_summary.append({
            "audit_id": str(audit.id),
            "title": audit.title,
            "status": audit.status,
            "department": department.name if department else "No Department",
            "assigned_manager": audit.assigned_manager.full_name if audit.assigned_manager else None,
            "lead_auditor": audit.lead_auditor.full_name if audit.lead_auditor else None,
            "team_size": team_count,
            "created_at": audit.created_at
        })
    
    # Get user statistics
    total_users = db.query(User).filter(User.is_active == True).count()
    users_by_role = {}
    for role in UserRole:
        count = db.query(User).filter(
            and_(User.role == role, User.is_active == True)
        ).count()
        users_by_role[role.value] = count
    
    return {
        "total_audits": len(all_audits),
        "total_active_users": total_users,
        "users_by_role": users_by_role,
        "audit_access_summary": audit_access_summary,
        "admin_user": {
            "id": str(current_user.id),
            "full_name": current_user.full_name,
            "email": current_user.email
        }
    }

# Role Matrix Management

@router.post("/role-matrix", response_model=RoleMatrixResponse)
def create_role_matrix(
    role_data: RoleMatrixCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN]))
):
    """
    Create new role in role matrix
    Requirements: 6.1, 6.5 - Role matrix management
    """
    # Check if role name already exists
    existing = db.query(RoleMatrix).filter(RoleMatrix.role_name == role_data.role_name).first()
    if existing:
        raise HTTPException(status_code=400, detail="Role name already exists")
    
    # Create role matrix entry
    role_matrix = RoleMatrix(
        role_name=role_data.role_name,
        role_description=role_data.role_description,
        role_category=role_data.role_category,
        department_id=role_data.department_id,
        is_global_role=role_data.is_global_role,
        created_by_id=current_user.id
    )
    
    # Set permissions
    for permission, value in role_data.permissions.items():
        if hasattr(role_matrix, permission):
            setattr(role_matrix, permission, value)
    
    db.add(role_matrix)
    db.commit()
    db.refresh(role_matrix)
    
    return role_matrix

@router.get("/role-matrix", response_model=List[RoleMatrixResponse])
def list_role_matrix(
    department_id: Optional[UUID] = None,
    is_active: Optional[bool] = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_permission("can_manage_users"))
):
    """
    List roles in role matrix
    Requirements: 6.1, 6.5
    """
    query = db.query(RoleMatrix)
    
    if department_id:
        query = query.filter(
            or_(
                RoleMatrix.department_id == department_id,
                RoleMatrix.is_global_role == True
            )
        )
    
    if is_active is not None:
        query = query.filter(RoleMatrix.is_active == is_active)
    
    return query.all()

@router.post("/user-role-assignment", response_model=UserRoleAssignmentResponse)
def assign_user_role(
    assignment_data: UserRoleAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN]))
):
    """
    Assign role to user
    Requirements: 6.1, 6.2, 6.5
    """
    # Verify user and role exist
    user = db.query(User).filter(User.id == assignment_data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    role = db.query(RoleMatrix).filter(RoleMatrix.id == assignment_data.role_id).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")
    
    # Check for existing active assignment
    existing = db.query(UserRoleAssignment).filter(
        and_(
            UserRoleAssignment.user_id == assignment_data.user_id,
            UserRoleAssignment.role_id == assignment_data.role_id,
            UserRoleAssignment.is_active == True
        )
    ).first()
    
    if existing:
        raise HTTPException(status_code=400, detail="User already has this role assigned")
    
    # Create assignment
    assignment = UserRoleAssignment(
        user_id=assignment_data.user_id,
        role_id=assignment_data.role_id,
        assigned_by_id=current_user.id,
        assignment_reason=assignment_data.assignment_reason,
        effective_date=assignment_data.effective_date or datetime.utcnow(),
        expiry_date=assignment_data.expiry_date,
        is_temporary=assignment_data.is_temporary,
        approved_by_id=current_user.id,  # Auto-approve for admin
        approval_date=datetime.utcnow()
    )
    
    db.add(assignment)
    db.commit()
    db.refresh(assignment)
    
    return assignment

@router.get("/user-role-assignments/{user_id}")
def get_user_role_assignments(
    user_id: UUID,
    include_inactive: Optional[bool] = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get user's role assignments
    Requirements: 6.1, 6.5
    """
    # Users can only view their own assignments unless they're admin
    if user_id != current_user.id and current_user.role != UserRole.SYSTEM_ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Can only view your own role assignments"
        )
    
    query = db.query(UserRoleAssignment).filter(UserRoleAssignment.user_id == user_id)
    
    if not include_inactive:
        query = query.filter(UserRoleAssignment.is_active == True)
    
    assignments = query.all()
    
    return [
        {
            "id": assignment.id,
            "role_name": assignment.role.role_name,
            "role_description": assignment.role.role_description,
            "assignment_reason": assignment.assignment_reason,
            "effective_date": assignment.effective_date,
            "expiry_date": assignment.expiry_date,
            "is_temporary": assignment.is_temporary,
            "is_active": assignment.is_active,
            "assigned_by": assignment.assigned_by.full_name if assignment.assigned_by else None,
            "approved_by": assignment.approved_by.full_name if assignment.approved_by else None
        }
        for assignment in assignments
    ]