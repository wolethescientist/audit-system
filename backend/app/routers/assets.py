from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from app.database import get_db
from app.auth import get_current_user
from app.models import (
    User, Asset, AssetAssignment, Department, RiskAssessment,
    AssetStatus, UserRole
)
from app.schemas import UserResponse, ErrorResponse

router = APIRouter(prefix="/api/v1/assets", tags=["Asset Management"])

# Pydantic schemas for asset management
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from decimal import Decimal

class AssetCreate(BaseModel):
    asset_name: str = Field(..., min_length=1, max_length=200)
    asset_category: str = Field(..., min_length=1, max_length=100)  # hardware, software, data, personnel, facilities
    asset_type: Optional[str] = None  # server, laptop, database, application, etc.
    asset_value: Optional[Decimal] = None
    criticality_level: Optional[str] = Field(None, pattern="^(critical|high|medium|low)$")
    procurement_date: Optional[datetime] = None
    warranty_expiry: Optional[datetime] = None
    owner_id: Optional[UUID] = None
    custodian_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    location: Optional[str] = None
    serial_number: Optional[str] = None
    model: Optional[str] = None
    vendor: Optional[str] = None
    notes: Optional[str] = None

class AssetUpdate(BaseModel):
    asset_name: Optional[str] = None
    asset_category: Optional[str] = None
    asset_type: Optional[str] = None
    asset_value: Optional[Decimal] = None
    criticality_level: Optional[str] = Field(None, pattern="^(critical|high|medium|low)$")
    procurement_date: Optional[datetime] = None
    warranty_expiry: Optional[datetime] = None
    owner_id: Optional[UUID] = None
    custodian_id: Optional[UUID] = None
    department_id: Optional[UUID] = None
    location: Optional[str] = None
    serial_number: Optional[str] = None
    model: Optional[str] = None
    vendor: Optional[str] = None
    status: Optional[AssetStatus] = None
    disposal_date: Optional[datetime] = None
    disposal_value: Optional[Decimal] = None
    disposal_method: Optional[str] = None
    notes: Optional[str] = None

class AssetResponse(BaseModel):
    id: UUID
    asset_name: str
    asset_category: str
    asset_type: Optional[str]
    asset_value: Optional[Decimal]
    criticality_level: Optional[str]
    procurement_date: Optional[datetime]
    warranty_expiry: Optional[datetime]
    owner_id: Optional[UUID]
    custodian_id: Optional[UUID]
    department_id: Optional[UUID]
    location: Optional[str]
    serial_number: Optional[str]
    model: Optional[str]
    vendor: Optional[str]
    status: AssetStatus
    disposal_date: Optional[datetime]
    disposal_value: Optional[Decimal]
    disposal_method: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class AssetAssignmentCreate(BaseModel):
    user_id: UUID
    assignment_purpose: Optional[str] = None
    assignment_notes: Optional[str] = None
    expected_return_date: Optional[datetime] = None

class AssetAssignmentUpdate(BaseModel):
    expected_return_date: Optional[datetime] = None
    assignment_notes: Optional[str] = None
    return_condition: Optional[str] = None
    return_notes: Optional[str] = None
    is_active: Optional[bool] = None

class AssetAssignmentResponse(BaseModel):
    id: UUID
    asset_id: UUID
    user_id: UUID
    assigned_by_id: Optional[UUID]
    assigned_date: datetime
    expected_return_date: Optional[datetime]
    returned_date: Optional[datetime]
    assignment_purpose: Optional[str]
    assignment_notes: Optional[str]
    return_condition: Optional[str]
    return_notes: Optional[str]
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class AssetReportData(BaseModel):
    total_assets: int
    assets_by_category: Dict[str, int]
    assets_by_status: Dict[str, int]
    assets_by_criticality: Dict[str, int]
    total_value: Decimal
    assets_expiring_warranty: List[Dict[str, Any]]
    unassigned_assets: int
    overdue_returns: int

@router.post("/", response_model=AssetResponse)
async def create_asset(
    asset_data: AssetCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new asset with lifecycle tracking.
    
    Implements ISO 27001 A.8.1.1 (Inventory of assets) requirements.
    """
    try:
        # Validate department exists if provided
        if asset_data.department_id:
            department = db.query(Department).filter(Department.id == asset_data.department_id).first()
            if not department:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Department not found"
                )
        
        # Validate owner exists if provided
        if asset_data.owner_id:
            owner = db.query(User).filter(User.id == asset_data.owner_id).first()
            if not owner:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Asset owner not found"
                )
        
        # Validate custodian exists if provided
        if asset_data.custodian_id:
            custodian = db.query(User).filter(User.id == asset_data.custodian_id).first()
            if not custodian:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Asset custodian not found"
                )
        
        # Create asset
        asset = Asset(
            **asset_data.dict()
        )
        
        db.add(asset)
        db.commit()
        db.refresh(asset)
        
        return asset
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create asset: {str(e)}"
        )

@router.get("/", response_model=List[AssetResponse])
async def list_assets(
    category: Optional[str] = None,
    status: Optional[AssetStatus] = None,
    criticality_level: Optional[str] = None,
    department_id: Optional[UUID] = None,
    owner_id: Optional[UUID] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List assets with filtering options.
    """
    try:
        query = db.query(Asset)
        
        # Apply filters
        if category:
            query = query.filter(Asset.asset_category == category)
        if status:
            query = query.filter(Asset.status == status)
        if criticality_level:
            query = query.filter(Asset.criticality_level == criticality_level)
        if department_id:
            query = query.filter(Asset.department_id == department_id)
        if owner_id:
            query = query.filter(Asset.owner_id == owner_id)
        
        # Apply user access controls
        if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
            # Regular users can only see assets from their department
            query = query.filter(Asset.department_id == current_user.department_id)
        
        assets = query.offset(skip).limit(limit).all()
        return assets
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve assets: {str(e)}"
        )

@router.get("/{asset_id}", response_model=AssetResponse)
async def get_asset(
    asset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific asset by ID.
    """
    try:
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found"
            )
        
        # Check access permissions
        if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
            if asset.department_id != current_user.department_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to view this asset"
                )
        
        return asset
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve asset: {str(e)}"
        )

@router.put("/{asset_id}", response_model=AssetResponse)
async def update_asset(
    asset_id: UUID,
    asset_data: AssetUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update an asset.
    """
    try:
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found"
            )
        
        # Check permissions
        if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
            if asset.department_id != current_user.department_id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to update this asset"
                )
        
        # Update fields
        update_data = asset_data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(asset, field, value)
        
        asset.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(asset)
        
        return asset
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update asset: {str(e)}"
        )

@router.delete("/{asset_id}")
async def delete_asset(
    asset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete an asset.
    """
    try:
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found"
            )
        
        # Check permissions
        if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete assets"
            )
        
        # Check if asset has active assignments
        active_assignments = db.query(AssetAssignment).filter(
            and_(
                AssetAssignment.asset_id == asset_id,
                AssetAssignment.is_active == True,
                AssetAssignment.returned_date.is_(None)
            )
        ).count()
        
        if active_assignments > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete asset with active assignments"
            )
        
        db.delete(asset)
        db.commit()
        
        return {"success": True, "message": "Asset deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete asset: {str(e)}"
        )

@router.get("/{asset_id}/assignments", response_model=List[AssetAssignmentResponse])
async def get_asset_assignments(
    asset_id: UUID,
    include_inactive: bool = False,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get assignment history for an asset.
    """
    try:
        # Verify asset exists and user has access
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found"
            )
        
        query = db.query(AssetAssignment).filter(AssetAssignment.asset_id == asset_id)
        
        if not include_inactive:
            query = query.filter(AssetAssignment.is_active == True)
        
        assignments = query.order_by(AssetAssignment.assigned_date.desc()).all()
        return assignments
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve asset assignments: {str(e)}"
        )

@router.post("/{asset_id}/assignments", response_model=AssetAssignmentResponse)
async def assign_asset(
    asset_id: UUID,
    assignment_data: AssetAssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Assign an asset to a user.
    """
    try:
        # Verify asset exists
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found"
            )
        
        # Verify user exists
        user = db.query(User).filter(User.id == assignment_data.user_id).first()
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        # Check if asset is already assigned
        existing_assignment = db.query(AssetAssignment).filter(
            and_(
                AssetAssignment.asset_id == asset_id,
                AssetAssignment.is_active == True,
                AssetAssignment.returned_date.is_(None)
            )
        ).first()
        
        if existing_assignment:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Asset is already assigned to another user"
            )
        
        # Create assignment
        assignment = AssetAssignment(
            asset_id=asset_id,
            assigned_by_id=current_user.id,
            **assignment_data.dict()
        )
        
        db.add(assignment)
        db.commit()
        db.refresh(assignment)
        
        return assignment
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to assign asset: {str(e)}"
        )

@router.put("/{asset_id}/assignments/{assignment_id}/return")
async def return_asset(
    asset_id: UUID,
    assignment_id: UUID,
    return_data: AssetAssignmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Return an assigned asset.
    """
    try:
        assignment = db.query(AssetAssignment).filter(
            and_(
                AssetAssignment.id == assignment_id,
                AssetAssignment.asset_id == asset_id
            )
        ).first()
        
        if not assignment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Assignment not found"
            )
        
        if not assignment.is_active:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Assignment is already inactive"
            )
        
        # Update assignment with return information
        assignment.returned_date = datetime.utcnow()
        assignment.is_active = False
        
        if return_data.return_condition:
            assignment.return_condition = return_data.return_condition
        if return_data.return_notes:
            assignment.return_notes = return_data.return_notes
        
        db.commit()
        
        return {"success": True, "message": "Asset returned successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to return asset: {str(e)}"
        )

@router.get("/reports/summary", response_model=AssetReportData)
async def get_asset_reports(
    department_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get comprehensive asset reports and analytics.
    """
    try:
        query = db.query(Asset)
        
        # Apply department filter
        if department_id:
            query = query.filter(Asset.department_id == department_id)
        elif current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
            query = query.filter(Asset.department_id == current_user.department_id)
        
        assets = query.all()
        
        # Calculate metrics
        total_assets = len(assets)
        
        # Assets by category
        assets_by_category = {}
        for asset in assets:
            category = asset.asset_category
            assets_by_category[category] = assets_by_category.get(category, 0) + 1
        
        # Assets by status
        assets_by_status = {}
        for asset in assets:
            status = asset.status.value
            assets_by_status[status] = assets_by_status.get(status, 0) + 1
        
        # Assets by criticality
        assets_by_criticality = {}
        for asset in assets:
            criticality = asset.criticality_level or "unknown"
            assets_by_criticality[criticality] = assets_by_criticality.get(criticality, 0) + 1
        
        # Total value
        total_value = sum(asset.asset_value or 0 for asset in assets)
        
        # Assets with expiring warranty (next 90 days)
        expiry_threshold = datetime.utcnow() + timedelta(days=90)
        assets_expiring_warranty = []
        for asset in assets:
            if asset.warranty_expiry and asset.warranty_expiry <= expiry_threshold:
                assets_expiring_warranty.append({
                    "id": str(asset.id),
                    "name": asset.asset_name,
                    "warranty_expiry": asset.warranty_expiry,
                    "days_until_expiry": (asset.warranty_expiry - datetime.utcnow()).days
                })
        
        # Unassigned assets
        assigned_asset_ids = db.query(AssetAssignment.asset_id).filter(
            and_(
                AssetAssignment.is_active == True,
                AssetAssignment.returned_date.is_(None)
            )
        ).subquery()
        
        unassigned_assets = query.filter(
            ~Asset.id.in_(assigned_asset_ids)
        ).count()
        
        # Overdue returns
        overdue_returns = db.query(AssetAssignment).filter(
            and_(
                AssetAssignment.is_active == True,
                AssetAssignment.returned_date.is_(None),
                AssetAssignment.expected_return_date < datetime.utcnow()
            )
        ).count()
        
        return AssetReportData(
            total_assets=total_assets,
            assets_by_category=assets_by_category,
            assets_by_status=assets_by_status,
            assets_by_criticality=assets_by_criticality,
            total_value=total_value,
            assets_expiring_warranty=assets_expiring_warranty,
            unassigned_assets=unassigned_assets,
            overdue_returns=overdue_returns
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate asset reports: {str(e)}"
        )

@router.get("/{asset_id}/risks", response_model=List[dict])
async def get_asset_risks(
    asset_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get risk assessments linked to an asset for risk assessment integration.
    """
    try:
        # Verify asset exists
        asset = db.query(Asset).filter(Asset.id == asset_id).first()
        if not asset:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Asset not found"
            )
        
        # Get linked risk assessments
        risks = db.query(RiskAssessment).filter(RiskAssessment.asset_id == asset_id).all()
        
        risk_data = []
        for risk in risks:
            risk_data.append({
                "id": str(risk.id),
                "risk_title": risk.risk_title,
                "risk_rating": risk.risk_rating,
                "risk_category": risk.risk_category.value,
                "likelihood_score": risk.likelihood_score,
                "impact_score": risk.impact_score,
                "status": risk.status,
                "created_at": risk.created_at
            })
        
        return risk_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve asset risks: {str(e)}"
        )