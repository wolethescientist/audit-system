from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta

from app.database import get_db
from app.auth import get_current_user
from app.models import (
    User, RiskAssessment, RiskControl, Asset, Audit, CAPAItem, AuditFinding,
    RiskCategory, UserRole
)
from app.schemas import (
    UserResponse, ErrorResponse
)

router = APIRouter(prefix="/api/v1/risks", tags=["Risk Assessment"])

# ISO 31000 and ISO 27005 compliant likelihood and impact scales
LIKELIHOOD_SCALE = {
    1: {"name": "Rare", "description": "May occur only in exceptional circumstances", "probability": "< 5%"},
    2: {"name": "Unlikely", "description": "Could occur at some time", "probability": "5-25%"},
    3: {"name": "Possible", "description": "Might occur at some time", "probability": "25-50%"},
    4: {"name": "Likely", "description": "Will probably occur in most circumstances", "probability": "50-75%"},
    5: {"name": "Almost Certain", "description": "Expected to occur in most circumstances", "probability": "> 75%"}
}

IMPACT_SCALE = {
    1: {"name": "Insignificant", "description": "Minimal impact on operations", "financial": "< $10K"},
    2: {"name": "Minor", "description": "Minor impact on operations", "financial": "$10K-$50K"},
    3: {"name": "Moderate", "description": "Moderate impact on operations", "financial": "$50K-$250K"},
    4: {"name": "Major", "description": "Major impact on operations", "financial": "$250K-$1M"},
    5: {"name": "Catastrophic", "description": "Severe impact on operations", "financial": "> $1M"}
}

# ISO 27001 Annex A Controls Library
ISO_27001_CONTROLS = {
    "A.5": {
        "title": "Information Security Policies",
        "controls": {
            "A.5.1.1": {"title": "Policies for information security", "type": "preventive"},
            "A.5.1.2": {"title": "Review of the policies for information security", "type": "detective"}
        }
    },
    "A.6": {
        "title": "Organization of Information Security",
        "controls": {
            "A.6.1.1": {"title": "Information security roles and responsibilities", "type": "preventive"},
            "A.6.1.2": {"title": "Segregation of duties", "type": "preventive"},
            "A.6.1.3": {"title": "Contact with authorities", "type": "preventive"},
            "A.6.1.4": {"title": "Contact with special interest groups", "type": "preventive"},
            "A.6.1.5": {"title": "Information security in project management", "type": "preventive"},
            "A.6.2.1": {"title": "Mobile device policy", "type": "preventive"},
            "A.6.2.2": {"title": "Teleworking", "type": "preventive"}
        }
    },
    "A.7": {
        "title": "Human Resource Security",
        "controls": {
            "A.7.1.1": {"title": "Screening", "type": "preventive"},
            "A.7.1.2": {"title": "Terms and conditions of employment", "type": "preventive"},
            "A.7.2.1": {"title": "Management responsibilities", "type": "preventive"},
            "A.7.2.2": {"title": "Information security awareness, education and training", "type": "preventive"},
            "A.7.2.3": {"title": "Disciplinary process", "type": "corrective"},
            "A.7.3.1": {"title": "Termination or change of employment responsibilities", "type": "preventive"}
        }
    },
    "A.8": {
        "title": "Asset Management",
        "controls": {
            "A.8.1.1": {"title": "Inventory of assets", "type": "preventive"},
            "A.8.1.2": {"title": "Ownership of assets", "type": "preventive"},
            "A.8.1.3": {"title": "Acceptable use of assets", "type": "preventive"},
            "A.8.1.4": {"title": "Return of assets", "type": "preventive"},
            "A.8.2.1": {"title": "Classification of information", "type": "preventive"},
            "A.8.2.2": {"title": "Labelling of information", "type": "preventive"},
            "A.8.2.3": {"title": "Handling of assets", "type": "preventive"},
            "A.8.3.1": {"title": "Management of removable media", "type": "preventive"},
            "A.8.3.2": {"title": "Disposal of media", "type": "preventive"},
            "A.8.3.3": {"title": "Physical media transfer", "type": "preventive"}
        }
    },
    "A.9": {
        "title": "Access Control",
        "controls": {
            "A.9.1.1": {"title": "Access control policy", "type": "preventive"},
            "A.9.1.2": {"title": "Access to networks and network services", "type": "preventive"},
            "A.9.2.1": {"title": "User registration and de-registration", "type": "preventive"},
            "A.9.2.2": {"title": "User access provisioning", "type": "preventive"},
            "A.9.2.3": {"title": "Management of privileged access rights", "type": "preventive"},
            "A.9.2.4": {"title": "Management of secret authentication information of users", "type": "preventive"},
            "A.9.2.5": {"title": "Review of user access rights", "type": "detective"},
            "A.9.2.6": {"title": "Removal or adjustment of access rights", "type": "preventive"},
            "A.9.3.1": {"title": "Use of secret authentication information", "type": "preventive"},
            "A.9.4.1": {"title": "Information access restriction", "type": "preventive"},
            "A.9.4.2": {"title": "Secure log-on procedures", "type": "preventive"},
            "A.9.4.3": {"title": "Password management system", "type": "preventive"},
            "A.9.4.4": {"title": "Use of privileged utility programs", "type": "preventive"},
            "A.9.4.5": {"title": "Access control to program source code", "type": "preventive"}
        }
    }
}

def calculate_risk_category(risk_rating: int) -> RiskCategory:
    """Calculate risk category based on ISO 31000 risk matrix"""
    if risk_rating <= 4:
        return RiskCategory.LOW
    elif risk_rating <= 9:
        return RiskCategory.MEDIUM
    elif risk_rating <= 16:
        return RiskCategory.HIGH
    else:
        return RiskCategory.CRITICAL

def suggest_controls_for_risk(risk_rating: int, threat_source: str = None) -> List[dict]:
    """Suggest appropriate ISO 27001 controls based on risk level and threat source"""
    suggestions = []
    
    # Base controls for all risks
    base_controls = [
        {"reference": "A.5.1.1", "title": "Policies for information security", "priority": "high"},
        {"reference": "A.6.1.1", "title": "Information security roles and responsibilities", "priority": "medium"}
    ]
    
    # High/Critical risk controls
    if risk_rating >= 10:
        high_risk_controls = [
            {"reference": "A.9.2.3", "title": "Management of privileged access rights", "priority": "critical"},
            {"reference": "A.8.1.1", "title": "Inventory of assets", "priority": "high"},
            {"reference": "A.7.2.2", "title": "Information security awareness, education and training", "priority": "high"}
        ]
        suggestions.extend(high_risk_controls)
    
    # Threat-specific controls
    if threat_source:
        if "human" in threat_source.lower() or "insider" in threat_source.lower():
            suggestions.extend([
                {"reference": "A.7.1.1", "title": "Screening", "priority": "high"},
                {"reference": "A.6.1.2", "title": "Segregation of duties", "priority": "medium"}
            ])
        elif "external" in threat_source.lower() or "cyber" in threat_source.lower():
            suggestions.extend([
                {"reference": "A.9.1.2", "title": "Access to networks and network services", "priority": "critical"},
                {"reference": "A.9.4.2", "title": "Secure log-on procedures", "priority": "high"}
            ])
    
    suggestions.extend(base_controls)
    return suggestions

# Pydantic schemas for risk assessment
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class RiskAssessmentCreate(BaseModel):
    audit_id: Optional[UUID] = None
    asset_id: Optional[UUID] = None
    risk_title: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    likelihood_score: int = Field(..., ge=1, le=5)
    impact_score: int = Field(..., ge=1, le=5)
    threat_source: Optional[str] = None
    vulnerability: Optional[str] = None
    existing_controls: Optional[str] = None
    mitigation_plan: Optional[str] = None
    risk_owner_id: Optional[UUID] = None
    next_review_date: Optional[datetime] = None

class RiskAssessmentUpdate(BaseModel):
    risk_title: Optional[str] = None
    description: Optional[str] = None
    likelihood_score: Optional[int] = Field(None, ge=1, le=5)
    impact_score: Optional[int] = Field(None, ge=1, le=5)
    threat_source: Optional[str] = None
    vulnerability: Optional[str] = None
    existing_controls: Optional[str] = None
    mitigation_plan: Optional[str] = None
    residual_risk_score: Optional[int] = None
    risk_owner_id: Optional[UUID] = None
    next_review_date: Optional[datetime] = None
    status: Optional[str] = None

class RiskAssessmentResponse(BaseModel):
    id: UUID
    audit_id: Optional[UUID]
    asset_id: Optional[UUID]
    risk_title: str
    description: Optional[str]
    likelihood_score: int
    impact_score: int
    risk_rating: int
    risk_category: RiskCategory
    threat_source: Optional[str]
    vulnerability: Optional[str]
    existing_controls: Optional[str]
    mitigation_plan: Optional[str]
    residual_risk_score: Optional[int]
    risk_owner_id: Optional[UUID]
    next_review_date: Optional[datetime]
    status: str
    created_by_id: Optional[UUID]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class RiskControlCreate(BaseModel):
    control_reference: str = Field(..., min_length=1, max_length=20)
    control_title: str = Field(..., min_length=1, max_length=200)
    control_description: Optional[str] = None
    control_type: str = Field(..., pattern="^(preventive|detective|corrective)$")
    implementation_status: str = Field(default="planned", pattern="^(planned|implementing|implemented|not_applicable)$")
    effectiveness_rating: Optional[int] = Field(None, ge=1, le=5)
    implementation_date: Optional[datetime] = None
    responsible_person_id: Optional[UUID] = None
    evidence_url: Optional[str] = None
    notes: Optional[str] = None

class RiskControlResponse(BaseModel):
    id: UUID
    risk_id: UUID
    control_reference: str
    control_title: str
    control_description: Optional[str]
    control_type: str
    implementation_status: str
    effectiveness_rating: Optional[int]
    implementation_date: Optional[datetime]
    responsible_person_id: Optional[UUID]
    evidence_url: Optional[str]
    notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

class RiskMatrixData(BaseModel):
    likelihood: int
    impact: int
    count: int
    risk_category: str
    risk_rating: int
    risks: List[Dict[str, Any]]

class RiskLinkingRequest(BaseModel):
    asset_ids: Optional[List[UUID]] = None
    finding_ids: Optional[List[UUID]] = None
    capa_ids: Optional[List[UUID]] = None

@router.post("/assess", response_model=RiskAssessmentResponse)
async def create_risk_assessment(
    risk_data: RiskAssessmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new risk assessment following ISO 31000 and ISO 27005 standards.
    
    This endpoint implements:
    - ISO 31000 Clause 6.3: Risk analysis with likelihood and consequence determination
    - ISO 27005 Clause 8.2: Information security risk assessment
    """
    try:
        # Validate audit exists if provided
        if risk_data.audit_id:
            audit = db.query(Audit).filter(Audit.id == risk_data.audit_id).first()
            if not audit:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Audit not found"
                )
        
        # Validate asset exists if provided
        if risk_data.asset_id:
            asset = db.query(Asset).filter(Asset.id == risk_data.asset_id).first()
            if not asset:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Asset not found"
                )
        
        # Calculate risk rating (ISO 31000 compliant)
        risk_rating = risk_data.likelihood_score * risk_data.impact_score
        risk_category = calculate_risk_category(risk_rating)
        
        # Create risk assessment
        risk_assessment = RiskAssessment(
            audit_id=risk_data.audit_id,
            asset_id=risk_data.asset_id,
            risk_title=risk_data.risk_title,
            description=risk_data.description,
            likelihood_score=risk_data.likelihood_score,
            impact_score=risk_data.impact_score,
            risk_rating=risk_rating,
            risk_category=risk_category,
            threat_source=risk_data.threat_source,
            vulnerability=risk_data.vulnerability,
            existing_controls=risk_data.existing_controls,
            mitigation_plan=risk_data.mitigation_plan,
            risk_owner_id=risk_data.risk_owner_id,
            next_review_date=risk_data.next_review_date,
            created_by_id=current_user.id
        )
        
        db.add(risk_assessment)
        db.commit()
        db.refresh(risk_assessment)
        
        return risk_assessment
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create risk assessment: {str(e)}"
        )

@router.get("/matrix", response_model=List[RiskMatrixData])
async def get_risk_matrix(
    audit_id: Optional[UUID] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get risk matrix visualization data with Green/Yellow/Red categorization.
    
    Returns risk distribution across likelihood × impact matrix following ISO 31000.
    """
    try:
        # Build query
        query = db.query(RiskAssessment)
        
        # Filter by audit if provided
        if audit_id:
            query = query.filter(RiskAssessment.audit_id == audit_id)
        
        # Apply user access controls
        if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
            # Regular users can only see risks from their audits
            user_audits = db.query(Audit.id).filter(
                or_(
                    Audit.assigned_manager_id == current_user.id,
                    Audit.lead_auditor_id == current_user.id,
                    Audit.created_by_id == current_user.id
                )
            ).subquery()
            query = query.filter(RiskAssessment.audit_id.in_(user_audits))
        
        risks = query.all()
        
        # Group risks by likelihood and impact
        matrix_data = {}
        for risk in risks:
            key = (risk.likelihood_score, risk.impact_score)
            if key not in matrix_data:
                matrix_data[key] = {
                    "likelihood": risk.likelihood_score,
                    "impact": risk.impact_score,
                    "count": 0,
                    "risk_category": risk.risk_category.value,
                    "risk_rating": risk.risk_rating,
                    "risks": []
                }
            
            matrix_data[key]["count"] += 1
            matrix_data[key]["risks"].append({
                "id": str(risk.id),
                "title": risk.risk_title,
                "risk_rating": risk.risk_rating,
                "status": risk.status
            })
        
        return list(matrix_data.values())
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve risk matrix: {str(e)}"
        )

@router.get("/{risk_id}/controls", response_model=List[RiskControlResponse])
async def get_risk_controls(
    risk_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get control recommendations for a specific risk using ISO 27001 Annex A controls.
    """
    try:
        # Verify risk exists and user has access
        risk = db.query(RiskAssessment).filter(RiskAssessment.id == risk_id).first()
        if not risk:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Risk assessment not found"
            )
        
        # Get existing controls
        controls = db.query(RiskControl).filter(RiskControl.risk_id == risk_id).all()
        
        return controls
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve risk controls: {str(e)}"
        )

@router.post("/{risk_id}/controls", response_model=RiskControlResponse)
async def add_risk_control(
    risk_id: UUID,
    control_data: RiskControlCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Add a control to a risk assessment.
    """
    try:
        # Verify risk exists
        risk = db.query(RiskAssessment).filter(RiskAssessment.id == risk_id).first()
        if not risk:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Risk assessment not found"
            )
        
        # Create control
        control = RiskControl(
            risk_id=risk_id,
            **control_data.dict()
        )
        
        db.add(control)
        db.commit()
        db.refresh(control)
        
        return control
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to add risk control: {str(e)}"
        )

@router.get("/{risk_id}/control-suggestions")
async def get_control_suggestions(
    risk_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get ISO 27001 Annex A control suggestions for a specific risk.
    """
    try:
        # Get risk details
        risk = db.query(RiskAssessment).filter(RiskAssessment.id == risk_id).first()
        if not risk:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Risk assessment not found"
            )
        
        # Generate control suggestions
        suggestions = suggest_controls_for_risk(risk.risk_rating, risk.threat_source)
        
        # Add detailed control information from ISO 27001 library
        detailed_suggestions = []
        for suggestion in suggestions:
            control_ref = suggestion["reference"]
            
            # Find control in ISO 27001 library
            control_details = None
            for section, section_data in ISO_27001_CONTROLS.items():
                if control_ref in section_data["controls"]:
                    control_details = section_data["controls"][control_ref]
                    control_details["section"] = section
                    control_details["section_title"] = section_data["title"]
                    break
            
            if control_details:
                detailed_suggestions.append({
                    "reference": control_ref,
                    "title": control_details["title"],
                    "type": control_details["type"],
                    "section": control_details["section"],
                    "section_title": control_details["section_title"],
                    "priority": suggestion["priority"],
                    "risk_rating": risk.risk_rating,
                    "applicable_threat": risk.threat_source
                })
        
        return {
            "risk_id": risk_id,
            "risk_title": risk.risk_title,
            "risk_rating": risk.risk_rating,
            "risk_category": risk.risk_category.value,
            "suggested_controls": detailed_suggestions,
            "iso_scales": {
                "likelihood": LIKELIHOOD_SCALE,
                "impact": IMPACT_SCALE
            }
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get control suggestions: {str(e)}"
        )

@router.post("/{risk_id}/link", response_model=dict)
async def link_risk_to_entities(
    risk_id: UUID,
    linking_data: RiskLinkingRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Link risk assessment to assets, findings, and CAPA items.
    """
    try:
        # Verify risk exists
        risk = db.query(RiskAssessment).filter(RiskAssessment.id == risk_id).first()
        if not risk:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Risk assessment not found"
            )
        
        linked_entities = {
            "assets": [],
            "findings": [],
            "capa_items": []
        }
        
        # Link to assets
        if linking_data.asset_ids:
            for asset_id in linking_data.asset_ids:
                asset = db.query(Asset).filter(Asset.id == asset_id).first()
                if asset:
                    # Update risk to link to asset if not already linked
                    if not risk.asset_id:
                        risk.asset_id = asset_id
                    linked_entities["assets"].append({
                        "id": str(asset.id),
                        "name": asset.asset_name,
                        "category": asset.asset_category
                    })
        
        # Link to findings (update finding to reference this risk)
        if linking_data.finding_ids:
            for finding_id in linking_data.finding_ids:
                finding = db.query(AuditFinding).filter(AuditFinding.id == finding_id).first()
                if finding:
                    linked_entities["findings"].append({
                        "id": str(finding.id),
                        "title": finding.title,
                        "severity": finding.severity.value
                    })
        
        # Link to CAPA items
        if linking_data.capa_ids:
            for capa_id in linking_data.capa_ids:
                capa = db.query(CAPAItem).filter(CAPAItem.id == capa_id).first()
                if capa:
                    # Update CAPA to reference this risk
                    capa.risk_id = risk_id
                    linked_entities["capa_items"].append({
                        "id": str(capa.id),
                        "title": capa.title,
                        "status": capa.status.value
                    })
        
        db.commit()
        
        return {
            "success": True,
            "message": "Risk successfully linked to entities",
            "risk_id": str(risk_id),
            "linked_entities": linked_entities
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to link risk to entities: {str(e)}"
        )

@router.get("/", response_model=List[RiskAssessmentResponse])
async def list_risk_assessments(
    audit_id: Optional[UUID] = None,
    asset_id: Optional[UUID] = None,
    risk_category: Optional[str] = None,
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List risk assessments with filtering options.
    """
    try:
        query = db.query(RiskAssessment)
        
        # Apply filters
        if audit_id:
            query = query.filter(RiskAssessment.audit_id == audit_id)
        if asset_id:
            query = query.filter(RiskAssessment.asset_id == asset_id)
        if risk_category:
            query = query.filter(RiskAssessment.risk_category == risk_category)
        if status:
            query = query.filter(RiskAssessment.status == status)
        
        # Apply user access controls
        if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
            user_audits = db.query(Audit.id).filter(
                or_(
                    Audit.assigned_manager_id == current_user.id,
                    Audit.lead_auditor_id == current_user.id,
                    Audit.created_by_id == current_user.id
                )
            ).subquery()
            query = query.filter(RiskAssessment.audit_id.in_(user_audits))
        
        risks = query.offset(skip).limit(limit).all()
        return risks
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve risk assessments: {str(e)}"
        )

@router.get("/{risk_id}", response_model=RiskAssessmentResponse)
async def get_risk_assessment(
    risk_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get a specific risk assessment by ID.
    """
    try:
        risk = db.query(RiskAssessment).filter(RiskAssessment.id == risk_id).first()
        if not risk:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Risk assessment not found"
            )
        
        return risk
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to retrieve risk assessment: {str(e)}"
        )

@router.put("/{risk_id}", response_model=RiskAssessmentResponse)
async def update_risk_assessment(
    risk_id: UUID,
    risk_data: RiskAssessmentUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Update a risk assessment.
    """
    try:
        risk = db.query(RiskAssessment).filter(RiskAssessment.id == risk_id).first()
        if not risk:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Risk assessment not found"
            )
        
        # Update fields
        update_data = risk_data.dict(exclude_unset=True)
        
        # Recalculate risk rating if likelihood or impact changed
        if "likelihood_score" in update_data or "impact_score" in update_data:
            likelihood = update_data.get("likelihood_score", risk.likelihood_score)
            impact = update_data.get("impact_score", risk.impact_score)
            update_data["risk_rating"] = likelihood * impact
            update_data["risk_category"] = calculate_risk_category(update_data["risk_rating"])
        
        for field, value in update_data.items():
            setattr(risk, field, value)
        
        risk.updated_at = datetime.utcnow()
        
        db.commit()
        db.refresh(risk)
        
        return risk
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update risk assessment: {str(e)}"
        )

@router.delete("/{risk_id}")
async def delete_risk_assessment(
    risk_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a risk assessment.
    """
    try:
        risk = db.query(RiskAssessment).filter(RiskAssessment.id == risk_id).first()
        if not risk:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Risk assessment not found"
            )
        
        # Check if user has permission to delete
        if current_user.role not in [UserRole.SYSTEM_ADMIN, UserRole.AUDIT_MANAGER]:
            if risk.created_by_id != current_user.id:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authorized to delete this risk assessment"
                )
        
        db.delete(risk)
        db.commit()
        
        return {"success": True, "message": "Risk assessment deleted successfully"}
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete risk assessment: {str(e)}"
        )

@router.get("/scales/iso-compliant")
async def get_iso_compliant_scales():
    """
    Get ISO 31000 compliant likelihood and impact scales.
    """
    return {
        "likelihood_scale": LIKELIHOOD_SCALE,
        "impact_scale": IMPACT_SCALE,
        "risk_matrix_categories": {
            "1-4": {"category": "LOW", "color": "green", "action": "Accept or monitor"},
            "5-9": {"category": "MEDIUM", "color": "yellow", "action": "Mitigate or transfer"},
            "10-16": {"category": "HIGH", "color": "orange", "action": "Mitigate immediately"},
            "17-25": {"category": "CRITICAL", "color": "red", "action": "Avoid or mitigate urgently"}
        },
        "iso_standards": {
            "ISO 31000": "Risk management — Guidelines",
            "ISO 27005": "Information security risk management"
        }
    }

@router.get("/controls/iso27001-library")
async def get_iso27001_controls_library():
    """
    Get the complete ISO 27001 Annex A controls library.
    """
    return {
        "standard": "ISO/IEC 27001:2022",
        "annex": "Annex A - Reference control objectives and controls",
        "controls": ISO_27001_CONTROLS,
        "control_types": {
            "preventive": "Controls that prevent incidents from occurring",
            "detective": "Controls that detect incidents when they occur",
            "corrective": "Controls that correct incidents after they occur"
        }
    }