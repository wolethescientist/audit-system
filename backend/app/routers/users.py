from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from app.database import get_db
from app.models import User, UserRole
from app.schemas import UserCreate, UserUpdate, UserResponse
from app.auth import get_current_user, require_roles, can_manage_users, get_assignable_roles

router = APIRouter(prefix="/users", tags=["Users"])

@router.post("/", response_model=UserResponse)
def create_user(
    user_data: UserCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Check if user has permission to create users
    if not can_manage_users(current_user, user_data.department_id):
        raise HTTPException(
            status_code=403, 
            detail="Not authorized to create users in this department"
        )
    
    # Validate role assignment
    assignable_roles = get_assignable_roles(current_user)
    if user_data.role not in assignable_roles:
        raise HTTPException(
            status_code=403,
            detail=f"Not authorized to assign role: {user_data.role}"
        )
    
    # For non-admins, enforce department constraint
    if current_user.role != UserRole.SYSTEM_ADMIN:
        if not user_data.department_id:
            user_data.department_id = current_user.department_id
        elif user_data.department_id != current_user.department_id:
            raise HTTPException(
                status_code=403,
                detail="Can only create users in your own department"
            )
    
    existing = db.query(User).filter(User.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    new_user = User(**user_data.model_dump())
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    # Include soft delete fields if user is admin
    is_admin = current_user.role == UserRole.SYSTEM_ADMIN
    return UserResponse.from_user(new_user, include_soft_delete=is_admin)

@router.get("/", response_model=List[UserResponse])
def list_users(
    include_deleted: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List users, excluding soft-deleted by default
    Requirements: 5.4
    """
    query = db.query(User)
    
    if not include_deleted:
        query = query.filter(User.is_deleted == False)
    
    users = query.all()
    
    # Only include soft delete fields for admins
    is_admin = current_user.role == UserRole.SYSTEM_ADMIN
    return [UserResponse.from_user(user, include_soft_delete=is_admin) for user in users]

@router.get("/assignable-roles", response_model=List[str])
def get_user_assignable_roles(
    current_user: User = Depends(get_current_user)
):
    """
    Get list of roles current user can assign
    Requirements: 1.3, 1.4
    """
    return [role.value for role in get_assignable_roles(current_user)]

@router.get("/deleted", response_model=List[UserResponse])
def list_deleted_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN]))
):
    """
    List all soft-deleted users (admin only)
    Requirements: 5.5
    """
    deleted_users = db.query(User).filter(User.is_deleted == True).all()
    
    # Admin endpoint, always include soft delete fields
    return [UserResponse.from_user(user, include_soft_delete=True) for user in deleted_users]

@router.get("/{user_id}", response_model=UserResponse)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Only include soft delete fields for admins
    is_admin = current_user.role == UserRole.SYSTEM_ADMIN
    return UserResponse.from_user(user, include_soft_delete=is_admin)

@router.put("/{user_id}", response_model=UserResponse)
def update_user(
    user_id: UUID,
    user_data: UserUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN]))
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for key, value in user_data.model_dump(exclude_unset=True).items():
        setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    
    # Admin is updating, so include soft delete fields
    return UserResponse.from_user(user, include_soft_delete=True)

@router.delete("/{user_id}")
def soft_delete_user(
    user_id: UUID,
    deletion_reason: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN]))
):
    """
    Soft delete a user (mark as deleted without removing from database)
    Requirements: 5.1, 5.2, 5.3
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_deleted:
        raise HTTPException(status_code=400, detail="User is already deleted")
    
    # Prevent self-deletion
    if user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Soft delete
    user.is_deleted = True
    user.deleted_at = datetime.utcnow()
    user.deleted_by_id = current_user.id
    user.deletion_reason = deletion_reason
    user.is_active = False  # Also deactivate to prevent login
    
    db.commit()
    
    return {
        "success": True,
        "message": f"User {user.full_name} has been soft deleted",
        "deleted_at": user.deleted_at
    }

@router.post("/{user_id}/restore")
def restore_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles([UserRole.SYSTEM_ADMIN]))
):
    """
    Restore a soft-deleted user
    Requirements: 5.6
    """
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    if not user.is_deleted:
        raise HTTPException(status_code=400, detail="User is not deleted")
    
    # Restore user
    user.is_deleted = False
    user.deleted_at = None
    user.deleted_by_id = None
    user.deletion_reason = None
    user.is_active = True  # Reactivate account
    
    db.commit()
    db.refresh(user)
    
    return {
        "success": True,
        "message": f"User {user.full_name} has been restored",
        "user": user
    }
