from datetime import datetime, timedelta
from typing import Optional, List
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from uuid import UUID
from app.config import settings
from app.database import get_db
from app.models import User, UserRole, Audit, AuditTeam, RoleMatrix, UserRoleAssignment, SystemAuditLog
from app.schemas import TokenData

security = HTTPBearer()

# Export these for use in other modules
SECRET_KEY = settings.JWT_SECRET_KEY
ALGORITHM = settings.JWT_ALGORITHM

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None, expires_minutes: Optional[int] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    elif expires_minutes:
        expire = datetime.utcnow() + timedelta(minutes=expires_minutes)
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.JWT_EXPIRATION_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str) -> TokenData:
    try:
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("user_id")
        role: str = payload.get("role")
        department_id: str = payload.get("department_id")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Could not validate credentials"
            )
        
        return TokenData(
            user_id=UUID(user_id),
            role=UserRole(role),
            department_id=UUID(department_id) if department_id else None
        )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    token = credentials.credentials
    token_data = verify_token(token)
    
    user = db.query(User).filter(User.id == token_data.user_id).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Check if user is soft-deleted
    if user.is_deleted:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This account has been deactivated. Please contact your administrator."
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    return user

def require_roles(allowed_roles: list[UserRole]):
    def role_checker(current_user: User = Depends(get_current_user)):
        # SYSTEM_ADMIN always has access to everything
        if current_user.role == UserRole.SYSTEM_ADMIN:
            return current_user
        if current_user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

# Enhanced RBAC Functions for ISO Compliance

def log_access_attempt(
    db: Session,
    user_id: UUID,
    action_type: str,
    resource_type: str,
    resource_id: str = None,
    success: bool = True,
    ip_address: str = None
):
    """Log access attempts for ISO 27001 A.12.4.1 compliance"""
    try:
        audit_log = SystemAuditLog(
            user_id=user_id,
            action_type=action_type,
            resource_type=resource_type,
            resource_id=resource_id,
            ip_address=ip_address,
            security_event=not success,
            risk_level="medium" if not success else "low"
        )
        db.add(audit_log)
        db.commit()
    except Exception:
        # Don't fail the main operation if logging fails
        pass

def check_audit_access(user: User, audit: Audit, db: Session) -> bool:
    """
    Enhanced audit access control with ISO-required segregation of duties
    Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
    """
    # System admins have access to all audits (admin override)
    if user.role == UserRole.SYSTEM_ADMIN:
        return True
    
    # Audit managers can access audits in their department or assigned to them
    if user.role == UserRole.AUDIT_MANAGER:
        if (audit.assigned_manager_id == user.id or 
            audit.created_by_id == user.id or
            audit.department_id == user.department_id):
            return True
    
    # Auditors can only access audits they are assigned to
    if user.role == UserRole.AUDITOR:
        # Check if user is assigned as lead auditor
        if audit.lead_auditor_id == user.id:
            return True
        
        # Check if user is part of audit team
        team_assignment = db.query(AuditTeam).filter(
            and_(
                AuditTeam.audit_id == audit.id,
                AuditTeam.user_id == user.id
            )
        ).first()
        if team_assignment:
            return True
    
    # Department heads can view audits in their department (read-only)
    if user.role == UserRole.DEPARTMENT_HEAD:
        if audit.department_id == user.department_id:
            return True
    
    # Department officers can view audits in their department (read-only)
    if user.role == UserRole.DEPARTMENT_OFFICER:
        if audit.department_id == user.department_id:
            return True
    
    return False

def get_user_audit_filter(user: User, db: Session):
    """
    Get SQLAlchemy filter for audits based on user's role and department
    Implements department-based access filtering per requirements 6.3, 6.4
    """
    # System admins see all audits
    if user.role == UserRole.SYSTEM_ADMIN:
        return None  # No filter needed
    
    # Audit managers see audits they manage or in their department
    if user.role == UserRole.AUDIT_MANAGER:
        return or_(
            Audit.assigned_manager_id == user.id,
            Audit.created_by_id == user.id,
            Audit.department_id == user.department_id
        )
    
    # Auditors see only assigned audits
    if user.role == UserRole.AUDITOR:
        # Get audit IDs where user is assigned
        assigned_audit_ids = db.query(AuditTeam.audit_id).filter(
            AuditTeam.user_id == user.id
        ).subquery()
        
        return or_(
            Audit.lead_auditor_id == user.id,
            Audit.id.in_(assigned_audit_ids)
        )
    
    # Department heads and officers see audits in their department
    if user.role in [UserRole.DEPARTMENT_HEAD, UserRole.DEPARTMENT_OFFICER]:
        return Audit.department_id == user.department_id
    
    # Viewers see audits in their department (read-only)
    if user.role == UserRole.VIEWER:
        return Audit.department_id == user.department_id
    
    # Default: no access
    return Audit.id == None  # This will return no results

def check_permission(user: User, permission: str, db: Session) -> bool:
    """
    Check if user has specific permission based on role matrix
    Requirements: 6.1, 6.2, 6.5
    """
    # Get user's role assignments
    role_assignments = db.query(UserRoleAssignment).filter(
        and_(
            UserRoleAssignment.user_id == user.id,
            UserRoleAssignment.is_active == True,
            or_(
                UserRoleAssignment.expiry_date.is_(None),
                UserRoleAssignment.expiry_date > datetime.utcnow()
            )
        )
    ).all()
    
    # Check permissions in role matrix
    for assignment in role_assignments:
        role_matrix = db.query(RoleMatrix).filter(RoleMatrix.id == assignment.role_id).first()
        if role_matrix and role_matrix.is_active:
            # Check if role has the requested permission
            if hasattr(role_matrix, permission) and getattr(role_matrix, permission):
                return True
    
    # Fallback to basic role-based permissions
    return check_basic_permission(user, permission)

def check_basic_permission(user: User, permission: str) -> bool:
    """
    Basic permission checking based on user role
    Fallback when role matrix is not configured
    """
    role_permissions = {
        UserRole.SYSTEM_ADMIN: [
            "can_create_audits", "can_view_all_audits", "can_edit_audits", 
            "can_delete_audits", "can_approve_reports", "can_manage_users",
            "can_manage_departments", "can_view_analytics", "can_export_data",
            "can_create_risks", "can_assess_risks", "can_approve_risk_treatments",
            "can_create_capa", "can_assign_capa", "can_close_capa",
            "can_upload_documents", "can_approve_documents", "can_archive_documents",
            "can_manage_assets", "can_assign_assets", "can_manage_vendors", "can_evaluate_vendors"
        ],
        UserRole.AUDIT_MANAGER: [
            "can_create_audits", "can_view_assigned_audits", "can_edit_audits",
            "can_approve_reports", "can_view_analytics", "can_export_data",
            "can_create_risks", "can_assess_risks", "can_create_capa", "can_assign_capa",
            "can_upload_documents", "can_manage_assets"
        ],
        UserRole.AUDITOR: [
            "can_view_assigned_audits", "can_create_risks", "can_assess_risks",
            "can_create_capa", "can_upload_documents"
        ],
        UserRole.DEPARTMENT_HEAD: [
            "can_view_assigned_audits", "can_view_analytics", "can_upload_documents",
            "can_manage_assets"
        ],
        UserRole.DEPARTMENT_OFFICER: [
            "can_view_assigned_audits", "can_upload_documents"
        ],
        UserRole.VIEWER: [
            "can_view_assigned_audits"
        ]
    }
    
    user_permissions = role_permissions.get(user.role, [])
    return permission in user_permissions

def require_permission(permission: str):
    """
    Decorator to require specific permission
    """
    def permission_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        if not check_permission(current_user, permission, db):
            # Log unauthorized access attempt
            log_access_attempt(
                db, current_user.id, "ACCESS_DENIED", "PERMISSION", 
                permission, False
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Permission denied: {permission}"
            )
        return current_user
    return permission_checker

def require_audit_access(audit_id: UUID):
    """
    Decorator to require access to specific audit
    Implements department-based filtering per requirements 6.3, 6.4
    """
    def audit_access_checker(
        current_user: User = Depends(get_current_user),
        db: Session = Depends(get_db)
    ):
        audit = db.query(Audit).filter(Audit.id == audit_id).first()
        if not audit:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Audit not found"
            )
        
        if not check_audit_access(current_user, audit, db):
            # Log unauthorized access attempt
            log_access_attempt(
                db, current_user.id, "ACCESS_DENIED", "AUDIT", 
                str(audit_id), False
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this audit"
            )
        
        # Log successful access
        log_access_attempt(
            db, current_user.id, "ACCESS_GRANTED", "AUDIT", 
            str(audit_id), True
        )
        return current_user
    return audit_access_checker

def get_accessible_audits(user: User, db: Session):
    """
    Get list of audits accessible to the user
    Implements ISO-required segregation of duties per requirements 6.1, 6.2
    """
    query = db.query(Audit)
    
    # Apply user-specific filter
    audit_filter = get_user_audit_filter(user, db)
    if audit_filter is not None:
        query = query.filter(audit_filter)
    
    return query.all()

def check_team_assignment_permission(user: User, audit: Audit, db: Session) -> bool:
    """
    Check if user can assign team members to audit
    Requirements: 6.2, 6.3
    """
    # System admins can assign anyone
    if user.role == UserRole.SYSTEM_ADMIN:
        return True
    
    # Audit managers can assign team members to audits they manage
    if user.role == UserRole.AUDIT_MANAGER:
        if (audit.assigned_manager_id == user.id or 
            audit.created_by_id == user.id):
            return True
    
    return False

def validate_team_member_eligibility(user_id: UUID, db: Session) -> bool:
    """
    Validate if user is eligible to be assigned to audit team
    Requirements: 6.1, 6.2 - ISO-required segregation of duties
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user or not user.is_active:
        return False
    
    # Only auditors and audit managers can be assigned to audit teams
    eligible_roles = [UserRole.AUDITOR, UserRole.AUDIT_MANAGER]
    return user.role in eligible_roles

def can_manage_users(current_user: User, target_department_id: Optional[UUID] = None) -> bool:
    """
    Check if user can manage other users
    Requirements: 1.1, 1.2, 1.5
    - SYSTEM_ADMIN: Can manage all users
    - AUDIT_MANAGER: Can manage users in their department
    - DEPARTMENT_HEAD: Can manage users in their department
    """
    if current_user.role == UserRole.SYSTEM_ADMIN:
        return True
    
    if current_user.role in [UserRole.AUDIT_MANAGER, UserRole.DEPARTMENT_HEAD]:
        if target_department_id:
            return current_user.department_id == target_department_id
        return True  # Can create users in their department
    
    return False

def get_assignable_roles(current_user: User) -> List[UserRole]:
    """
    Get list of roles that current user can assign
    Requirements: 1.3, 1.4
    """
    if current_user.role == UserRole.SYSTEM_ADMIN:
        return list(UserRole)
    
    if current_user.role == UserRole.AUDIT_MANAGER:
        return [
            UserRole.AUDITOR,
            UserRole.DEPARTMENT_OFFICER,
            UserRole.VIEWER
        ]
    
    if current_user.role == UserRole.DEPARTMENT_HEAD:
        return [
            UserRole.DEPARTMENT_OFFICER,
            UserRole.VIEWER
        ]
    
    return []
