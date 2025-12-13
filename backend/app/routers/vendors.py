from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from app.database import get_db
from app.auth import get_current_user
from app.models import (
    User, Vendor, VendorEvaluation, VendorSLA, Department,
    VendorRiskRating, UserRole
)
from app.schemas import UserResponse, ErrorResponse

router = APIRouter(prefix="/api/v1/vendors", tags=["Vendor Management"])

# Pydantic schemas for vendor management
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict, Any
from decimal import Decimal

class VendorCreate(BaseModel):
    vendor_name: str = Field(..., min_length=1, max_length=200)
    vendor_type: Optional[str] = Field(None, pattern="^(supplier|service_provider|contractor|consultant)$")
    primary_contact_name: Optional[str] = None
    primary_contact_email: Optional[EmailStr] = None
    primary_contact_phone: Optional[str] = None
    secondary_contact_name: Optional[str] = None
    secondary_contact_email: Optional[EmailStr] = None
    secondary_contact_phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    business_registration_number: Optional[str] = None
    tax_identification_number: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    risk_rating: Optional[VendorRiskRating] = VendorRiskRating.MEDIUM
    contract_start_date: Optional[datetime] = None
    contract_end_date: Optional[datetime] = None
    iso_certifications: Optional[List[str]] = None
    other_certifications: Optional[List[str]] = None
    insurance_coverage: Optional[Decimal] = None
    insurance_expiry: Optional[datetime] = None
    notes: Optional[str] = None

class VendorUpdate(BaseModel):
    vendor_name: Optional[str] = None
    vendor_type: Optional[str] = Field(None, pattern="^(supplier|service_provider|contractor|consultant)$")
    primary_contact_name: Optional[str] = None
    primary_contact_email: Optional[EmailStr] = None
    primary_contact_phone: Optional[str] = None
    secondary_contact_name: Optional[str] = None
    secondary_contact_email: Optional[EmailStr] = None
    secondary_contact_phone: Optional[str] = None
    address_line1: Optional[str] = None
    address_line2: Optional[str] = None
    city: Optional[str] = None
    state_province: Optional[str] = None
    postal_code: Optional[str] = None
    country: Optional[str] = None
    business_registration_number: Optional[str] = None
    tax_identification_number: Optional[str] = None
    website: Optional[str] = None
    industry: Optional[str] = None
    risk_rating: Optional[VendorRiskRating] = None
    status: Optional[str] = Field(None, pattern="^(active|inactive|suspended|terminated)$")
    contract_start_date: Optional[datetime] = None
    contract_end_date: Optional[datetime] = None
    iso_certifications: Optional[List[str]] = None
    other_certifications: Optional[List[str]] = None
    insurance_coverage: Optional[Decimal] = None
    insurance_expiry: Optional[datetime] = None
    performance_rating: Optional[int] = Field(None, ge=1, le=5)
    notes: Optional[str] = None

class VendorResponse(BaseModel):
    id: UUID
    vendor_code: str
    vendor_name: str
    vendor_type: Optional[str]
    primary_contact_name: Optional[str]
    primary_contact_email: Optional[str]
    primary_contact_phone: Optional[str]
    secondary_contact_name: Optional[str]
    secondary_contact_email: Optional[str]
    secondary_contact_phone: Optional[str]
    address_line1: Optional[str]
    address_line2: Optional[str]
    city: Optional[str]
    state_province: Optional[str]
    postal_code: Optional[str]
    country: Optional[str]
    business_registration_number: Optional[str]
    tax_identification_number: Optional[str]
    website: Optional[str]
    industry: Optional[str]
    risk_rating: VendorRiskRating
    risk_assessment_date: Optional[datetime]
    risk_notes: Optional[str]
    status: str
    onboarding_date: Optional[datetime]
    contract_start_date: Optional[datetime]
    contract_end_date: Optional[datetime]
    iso_certifications: Optional[List[str]]
    other_certifications: Optional[List[str]]
    insurance_coverage: Optional[Decimal]
    insurance_expiry: Optional[datetime]
    performance_rating: Optional[int]
    last_evaluation_date: Optional[datetime]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class VendorEvaluationCreate(BaseModel):
    evaluation_type: str = Field(..., pattern="^(initial|periodic|incident_based)$")
    evaluation_period_start: Optional[datetime] = None
    evaluation_period_end: Optional[datetime] = None
    questionnaire_data: Optional[Dict[str, Any]] = None
    evaluation_criteria: Optional[Dict[str, Any]] = None
    overall_score: Optional[int] = Field(None, ge=0, le=100)
    quality_score: Optional[int] = Field(None, ge=0, le=100)
    delivery_score: Optional[int] = Field(None, ge=0, le=100)
    cost_score: Optional[int] = Field(None, ge=0, le=100)
    service_score: Optional[int] = Field(None, ge=0, le=100)
    compliance_score: Optional[int] = Field(None, ge=0, le=100)
    strengths: Optional[str] = None
    weaknesses: Optional[str] = None
    recommendations: Optional[str] = None
    action_items: Optional[List[Dict[str, Any]]] = None
    next_evaluation_date: Optional[datetime] = None
    notes: Optional[str] = None

class VendorEvaluationResponse(BaseModel):
    id: UUID
    vendor_id: UUID
    evaluation_type: str
    evaluation_period_start: Optional[datetime]
    evaluation_period_end: Optional[datetime]
    questionnaire_data: Optional[Dict[str, Any]]
    evaluation_criteria: Optional[Dict[str, Any]]
    overall_score: Optional[int]
    evaluation_result: Optional[str]
    quality_score: Optional[int]
    delivery_score: Optional[int]
    cost_score: Optional[int]
    service_score: Optional[int]
    compliance_score: Optional[int]
    strengths: Optional[str]
    weaknesses: Optional[str]
    recommendations: Optional[str]
    action_items: Optional[List[Dict[str, Any]]]
    evaluated_by_id: Optional[UUID]
    reviewed_by_id: Optional[UUID]
    approved_by_id: Optional[UUID]
    evaluation_date: datetime
    next_evaluation_date: Optional[datetime]
    notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

class VendorSLACreate(BaseModel):
    sla_name: str = Field(..., min_length=1, max_length=200)
    sla_type: Optional[str] = Field(None, pattern="^(service_level|performance|availability|security)$")
    document_url: Optional[str] = None
    service_description: Optional[str] = None
    performance_metrics: Optional[List[Dict[str, Any]]] = None
    availability_target: Optional[Decimal] = Field(None, ge=0, le=100)
    response_time_target: Optional[int] = None  # In minutes
    resolution_time_target: Optional[int] = None  # In hours
    start_date: datetime
    end_date: Optional[datetime] = None
    auto_renewal: Optional[bool] = False
    renewal_notice_days: Optional[int] = 30
    penalty_clauses: Optional[List[Dict[str, Any]]] = None
    notes: Optional[str] = None

class VendorSLAResponse(BaseModel):
    id: UUID
    vendor_id: UUID
    sla_name: str
    sla_type: Optional[str]
    document_url: Optional[str]
    document_hash: Optional[str]
    service_description: Optional[str]
    performance_metrics: Optional[List[Dict[str, Any]]]
    availability_target: Optional[Decimal]
    response_time_target: Optional[int]
    resolution_time_target: Optional[int]
    start_date: datetime
    end_date: Optional[datetime]
    auto_renewal: bool
    renewal_notice_days: int
    current_performance: Optional[Dict[str, Any]]
    last_review_date: Optional[datetime]
    next_review_date: Optional[datetime]
    status: str
    compliance_status: str
    penalty_clauses: Optional[List[Dict[str, Any]]]
    notes: Optional[str]
    created_by_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

def generate_vendor_code(db: Session) -> str:
    """Generate unique vendor code"""
    import random
    import string
    
    while True:
        code = "VND" + "".join(random.choices(string.digits, k=6))
        existing = db.query(Vendor).filter(Vendor.vendor_code == code).first()
        if not existing:
            return code

@router.post("/", response_model=VendorResponse)
async def create_vendor(
    vendor_data: VendorCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new vendor with comprehensive information management.
    """
    try:
        # Generate unique vendor code
        vendor_code = generate_vendor_code(db)
        
        # Create vendor
        vendor_dict = vendor_data.dict()
        
        # Convert list fields to JSON
        if vendor_dict.get("iso_certifications"):
            vendor_dict["iso_certifications"] = vendor_dict["iso_certifications"]
        if vendor_dict.get("other_certifications"):
            vendor_dict["other_certifications"] = vendor_dict["other_certifications"]
        
        vendor = Vendor(
            vendor_code=vendor_code,
            onboarding_date=datetime.utcnow(),
            created_by_id=current_user.id,
            **vendor_dict
        )
        
        db.add(vendor)
        db.commit()
        db.refresh(vendor)
        
        return vendor
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create vendor: {str(e)}"
        )

@router.get("/", response_model=List[VendorResponse])
async def list_vendors(
    vendor_type: Optional[str] = None,
    risk_rating: Optional[VendorRiskRating] = None,
    status: Optional[str] = None,
    industry: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List vendors with filtering options.
    """
    try:
        query = db.query(Vendor)
        
        # Apply filters
        if vendor_type:
            query = query.filter(Vendor.vendor_type == vendor_type)
        if risk_rating:
            query = query.filter(Vendor.risk_rating == risk_rating)
        if status:
            query = query.filter(Vendor.status == status)
        if industry:
            query = query.filter(Vendor.industry == industry)
        
        vendors = query.offset(skip).limit(limit).all()
        return vendors
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve vendors: {str(e)}"
        )

@router.get("/{vendor_id}", response_model=VendorResponse)
async def get_vendor(
    vendor_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific vendor by ID.
    """
    try:
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )
        
        return vendor
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve vendor: {str(e)}"
        )

@router.put("/{vendor_id}", response_model=VendorResponse)
async def update_vendor(
    vendor_id: UUID,
    vendor_data: VendorUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a vendor.
    """
    try:
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )
        
        # Update fields
        update_data = vendor_data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(vendor, field, value)
        
        vendor.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(vendor)
        
        return vendor
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update vendor: {str(e)}"
        )

@router.delete("/{vendor_id}")
async def delete_vendor(
    vendor_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a vendor.
    """
    try:
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )
        
        # Check permissions
        if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Not authorized to delete vendors"
            )
        
        # Check if vendor has active SLAs
        active_slas = db.query(VendorSLA).filter(
            and_(
                VendorSLA.vendor_id == vendor_id,
                VendorSLA.status == "active"
            )
        ).count()
        
        if active_slas > 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot delete vendor with active SLAs"
            )
        
        db.delete(vendor)
        db.commit()
        
        return {"success": True, "message": "Vendor deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete vendor: {str(e)}"
        )

@router.get("/{vendor_id}/evaluations", response_model=List[VendorEvaluationResponse])
async def get_vendor_evaluations(
    vendor_id: UUID,
    evaluation_type: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get evaluation history for a vendor.
    """
    try:
        # Verify vendor exists
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )
        
        query = db.query(VendorEvaluation).filter(VendorEvaluation.vendor_id == vendor_id)
        
        if evaluation_type:
            query = query.filter(VendorEvaluation.evaluation_type == evaluation_type)
        
        evaluations = query.order_by(VendorEvaluation.evaluation_date.desc()).all()
        return evaluations
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve vendor evaluations: {str(e)}"
        )

@router.post("/{vendor_id}/evaluations", response_model=VendorEvaluationResponse)
async def create_vendor_evaluation(
    vendor_id: UUID,
    evaluation_data: VendorEvaluationCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new vendor evaluation assessment.
    """
    try:
        # Verify vendor exists
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )
        
        # Determine evaluation result based on overall score
        evaluation_result = "pending"
        if evaluation_data.overall_score is not None:
            if evaluation_data.overall_score >= 80:
                evaluation_result = "approved"
            elif evaluation_data.overall_score >= 60:
                evaluation_result = "conditional"
            else:
                evaluation_result = "rejected"
        
        # Create evaluation
        evaluation = VendorEvaluation(
            vendor_id=vendor_id,
            evaluated_by_id=current_user.id,
            evaluation_result=evaluation_result,
            **evaluation_data.dict()
        )
        
        db.add(evaluation)
        
        # Update vendor's last evaluation date and performance rating
        vendor.last_evaluation_date = datetime.utcnow()
        if evaluation_data.overall_score:
            vendor.performance_rating = min(5, max(1, evaluation_data.overall_score // 20 + 1))
        
        db.commit()
        db.refresh(evaluation)
        
        return evaluation
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create vendor evaluation: {str(e)}"
        )

@router.get("/{vendor_id}/slas", response_model=List[VendorSLAResponse])
async def get_vendor_slas(
    vendor_id: UUID,
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get SLA agreements for a vendor.
    """
    try:
        # Verify vendor exists
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )
        
        query = db.query(VendorSLA).filter(VendorSLA.vendor_id == vendor_id)
        
        if status:
            query = query.filter(VendorSLA.status == status)
        
        slas = query.order_by(VendorSLA.start_date.desc()).all()
        return slas
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve vendor SLAs: {str(e)}"
        )

@router.post("/{vendor_id}/slas", response_model=VendorSLAResponse)
async def create_vendor_sla(
    vendor_id: UUID,
    sla_data: VendorSLACreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new SLA agreement for a vendor.
    """
    try:
        # Verify vendor exists
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )
        
        # Generate document hash if document URL provided
        document_hash = None
        if sla_data.document_url:
            import hashlib
            document_hash = hashlib.sha256(sla_data.document_url.encode()).hexdigest()
        
        # Create SLA
        sla = VendorSLA(
            vendor_id=vendor_id,
            document_hash=document_hash,
            created_by_id=current_user.id,
            **sla_data.dict()
        )
        
        db.add(sla)
        db.commit()
        db.refresh(sla)
        
        return sla
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create vendor SLA: {str(e)}"
        )

@router.put("/{vendor_id}/risk-rating")
async def update_vendor_risk_rating(
    vendor_id: UUID,
    risk_rating: VendorRiskRating,
    risk_notes: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update vendor risk rating with integration to risk assessment system.
    """
    try:
        vendor = db.query(Vendor).filter(Vendor.id == vendor_id).first()
        if not vendor:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Vendor not found"
            )
        
        # Update risk rating
        vendor.risk_rating = risk_rating
        vendor.risk_assessment_date = datetime.utcnow()
        if risk_notes:
            vendor.risk_notes = risk_notes
        
        db.commit()
        
        return {
            "success": True,
            "message": "Vendor risk rating updated successfully",
            "vendor_id": str(vendor_id),
            "new_risk_rating": risk_rating.value,
            "assessment_date": vendor.risk_assessment_date
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update vendor risk rating: {str(e)}"
        )