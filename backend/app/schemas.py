from pydantic import BaseModel, EmailStr
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from app.models import UserRole, AuditStatus, ReportStatus, FindingSeverity, WorkflowStatus, ApprovalAction, CAPAType, CAPAStatus, DocumentStatus

# Auth Schemas
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: UUID
    role: UserRole
    department_id: Optional[UUID] = None

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    role: UserRole
    department_id: Optional[UUID] = None

class UserCreate(UserBase):
    pass

class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    department_id: Optional[UUID] = None
    is_active: Optional[bool] = None

class UserResponse(UserBase):
    id: UUID
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Department Schemas
class DepartmentBase(BaseModel):
    name: str
    parent_department_id: Optional[UUID] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentResponse(DepartmentBase):
    id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# Audit Schemas
class AuditBase(BaseModel):
    title: str
    year: int
    scope: Optional[str] = None
    risk_rating: Optional[str] = None
    department_id: Optional[UUID] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class AuditCreate(AuditBase):
    assigned_manager_id: Optional[UUID] = None

class AuditUpdate(BaseModel):
    title: Optional[str] = None
    scope: Optional[str] = None
    risk_rating: Optional[str] = None
    status: Optional[AuditStatus] = None
    assigned_manager_id: Optional[UUID] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None

class AuditResponse(AuditBase):
    id: UUID
    status: AuditStatus
    assigned_manager_id: Optional[UUID]
    created_by_id: UUID
    created_at: datetime
    
    class Config:
        from_attributes = True

# ISO 19011 Audit Initiation Schemas
class AuditInitiationData(BaseModel):
    audit_objectives: str
    audit_criteria: str
    audit_scope_detailed: str
    audit_methodology: str
    auditee_organization: Optional[str] = None
    auditee_contact_person_id: Optional[UUID] = None
    auditee_location: Optional[str] = None
    feasibility_confirmed: Optional[bool] = False
    feasibility_notes: Optional[str] = None
    audit_programme_id: Optional[UUID] = None
    risk_based_selection: Optional[bool] = False
    audit_priority: Optional[str] = "medium"

class AuditTeamAssignment(BaseModel):
    lead_auditor_id: UUID
    team_members: List[Dict[str, Any]]  # Array of {user_id, role_in_audit}

class AuditInitiationStatus(BaseModel):
    audit_id: UUID
    status: AuditStatus
    initiation_checklist: Dict[str, bool]
    completion_percentage: float
    can_proceed_to_preparation: bool

# Audit Programme Schemas
class AuditProgrammeBase(BaseModel):
    programme_name: str
    programme_year: int
    programme_objectives: str
    programme_manager_id: Optional[UUID] = None
    risk_assessment_completed: Optional[bool] = False
    risk_factors_considered: Optional[List[str]] = None

class AuditProgrammeCreate(AuditProgrammeBase):
    pass

class AuditProgrammeResponse(BaseModel):
    id: UUID
    programme_name: str
    programme_year: int
    programme_objectives: str
    programme_manager_id: Optional[UUID] = None
    risk_assessment_completed: Optional[bool] = False
    risk_factors_considered: Optional[List[str]] = None
    status: str
    total_planned_audits: int
    completed_audits: int
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Audit Team Schemas
class AuditTeamCreate(BaseModel):
    user_id: UUID
    role_in_audit: str

class AuditTeamResponse(BaseModel):
    id: UUID
    audit_id: UUID
    user_id: UUID
    role_in_audit: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Work Program Schemas
class WorkProgramCreate(BaseModel):
    procedure_name: str
    description: Optional[str] = None

class WorkProgramUpdate(BaseModel):
    procedure_name: Optional[str] = None
    description: Optional[str] = None
    status: Optional[str] = None

class WorkProgramResponse(BaseModel):
    id: UUID
    audit_id: UUID
    procedure_name: str
    description: Optional[str]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Evidence Schemas
class EvidenceCreate(BaseModel):
    file_name: str
    file_url: str
    description: Optional[str] = None

class EvidenceResponse(BaseModel):
    id: UUID
    audit_id: UUID
    file_name: str
    file_url: str
    uploaded_by_id: Optional[UUID]
    description: Optional[str]
    created_at: datetime
    evidence_type: Optional[str] = "document"
    file_hash: Optional[str] = None
    file_size: Optional[int] = None
    mime_type: Optional[str] = None
    linked_checklist_id: Optional[UUID] = None
    linked_finding_id: Optional[UUID] = None
    
    class Config:
        from_attributes = True

# Finding Schemas
class FindingCreate(BaseModel):
    title: str
    severity: FindingSeverity
    impact: Optional[str] = None
    root_cause: Optional[str] = None
    recommendation: Optional[str] = None

class FindingUpdate(BaseModel):
    title: Optional[str] = None
    severity: Optional[FindingSeverity] = None
    impact: Optional[str] = None
    root_cause: Optional[str] = None
    recommendation: Optional[str] = None
    response_from_auditee: Optional[str] = None
    status: Optional[str] = None

class FindingResponse(BaseModel):
    id: UUID
    audit_id: UUID
    title: str
    severity: FindingSeverity
    impact: Optional[str]
    root_cause: Optional[str]
    recommendation: Optional[str]
    response_from_auditee: Optional[str]
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

# Query Schemas
class QueryCreate(BaseModel):
    to_user_id: UUID
    message: str
    parent_query_id: Optional[UUID] = None

class QueryResponse(BaseModel):
    id: UUID
    audit_id: UUID
    from_user_id: Optional[UUID]
    to_user_id: Optional[UUID]
    message: str
    parent_query_id: Optional[UUID]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Report Schemas
class ReportCreate(BaseModel):
    content: str

class ReportUpdate(BaseModel):
    content: Optional[str] = None
    status: Optional[ReportStatus] = None
    comments: Optional[str] = None

class ReportResponse(BaseModel):
    id: UUID
    audit_id: UUID
    version: int
    content: Optional[str]
    status: ReportStatus
    created_by_id: Optional[UUID]
    comments: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# AI Report Generation Schemas
class ReportGenerationRequest(BaseModel):
    """Request schema for AI report generation."""
    include_executive_summary: Optional[bool] = True
    include_detailed_findings: Optional[bool] = True
    include_capa_recommendations: Optional[bool] = True
    custom_sections: Optional[List[str]] = None

class ReportGenerationResponse(BaseModel):
    """Response schema for AI report generation."""
    report_id: UUID
    audit_id: UUID
    status: str
    content: str  # Markdown content for preview
    html_content: Optional[str]  # HTML content for preview
    generation_date: str
    iso_compliance_validated: bool
    validation_notes: List[str]
    word_count: int
    sections_generated: int
    download_files: Dict[str, Any]  # Contains base64 content for downloads
    supported_formats: List[str]

class ReportExportRequest(BaseModel):
    """Request schema for report export."""
    format: str
    include_metadata: Optional[bool] = True
    custom_styling: Optional[Dict[str, Any]] = None

class ReportExportResponse(BaseModel):
    """Response schema for report export."""
    report_id: UUID
    format: str
    file_url: str
    export_date: str
    file_size: int

class ReportValidationResult(BaseModel):
    """Schema for report validation results."""
    is_compliant: bool
    notes: List[str]
    sections_found: int
    total_sections_required: int
    iso_terms_found: List[str]
    recommendations: List[str]

# Followup Schemas
class FollowupCreate(BaseModel):
    finding_id: UUID
    assigned_to_id: UUID
    due_date: datetime

class FollowupUpdate(BaseModel):
    status: Optional[str] = None
    evidence_url: Optional[str] = None
    completion_notes: Optional[str] = None

class FollowupResponse(BaseModel):
    id: UUID
    audit_id: UUID
    finding_id: Optional[UUID]
    assigned_to_id: Optional[UUID]
    due_date: Optional[datetime]
    status: str
    evidence_url: Optional[str]
    completion_notes: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True

# Analytics Schemas
class AnalyticsOverview(BaseModel):
    total_audits: int
    planned_audits: int
    executing_audits: int
    completed_audits: int
    total_findings: int
    critical_findings: int
    overdue_followups: int

# Dashboard Schemas for ISO Compliance
class DashboardMetrics(BaseModel):
    # Audit metrics
    total_audits: int
    planned_audits: int
    executing_audits: int
    reporting_audits: int
    followup_audits: int
    closed_audits: int
    
    # Finding metrics
    total_findings: int
    open_findings: int
    critical_findings: int
    high_findings: int
    medium_findings: int
    low_findings: int
    
    # Compliance metrics
    overall_compliance_score: float
    
    # Risk metrics
    total_risks: int
    critical_risks: int
    high_risks: int
    
    # CAPA metrics
    total_capa: int
    open_capa: int
    overdue_capa: int
    
    # Followup metrics
    overdue_followups: int

class RiskHeatmapData(BaseModel):
    likelihood: int  # 1-5 scale
    impact: int      # 1-5 scale
    count: int       # Number of risks at this likelihood/impact combination
    risk_category: str  # low, medium, high, critical
    risk_rating: int    # likelihood × impact

class ComplianceScores(BaseModel):
    overall_compliance_score: float
    frameworks: List[Dict[str, Any]]  # Framework-specific compliance data

class CAPASummary(BaseModel):
    total_capa: int
    open_capa: int
    in_progress_capa: int
    pending_verification_capa: int
    closed_capa: int
    overdue_capa: int
    due_soon_capa: int
    corrective_capa: int
    preventive_capa: int
    avg_completion_days: float
    effectiveness_confirmed: int
    pending_effectiveness_review: int

class ErrorResponse(BaseModel):
    success: bool = False
    message: str
    code: str

# Workflow Schemas
class WorkflowStepCreate(BaseModel):
    step_order: int
    department_id: UUID
    assigned_to_id: Optional[UUID] = None
    action_required: str = "review_and_approve"
    due_date: Optional[datetime] = None

class WorkflowStepResponse(BaseModel):
    id: UUID
    workflow_id: UUID
    step_order: int
    department_id: UUID
    assigned_to_id: Optional[UUID] = None
    action_required: str = "review_and_approve"
    status: WorkflowStatus
    due_date: Optional[datetime] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
        use_enum_values = True

class WorkflowCreate(BaseModel):
    audit_id: UUID
    name: str
    description: Optional[str] = None
    steps: List[WorkflowStepCreate]

class WorkflowResponse(BaseModel):
    id: UUID
    reference_number: str
    audit_id: UUID
    name: str
    description: Optional[str] = None
    created_by_id: Optional[UUID] = None
    status: WorkflowStatus
    current_step: int = 0
    created_at: datetime
    completed_at: Optional[datetime] = None
    
    class Config:
        from_attributes = True
        use_enum_values = True

class WorkflowDetailResponse(WorkflowResponse):
    steps: List[WorkflowStepResponse]
    
    class Config:
        from_attributes = True
        use_enum_values = True

# Approval Schemas
class ApprovalCreate(BaseModel):
    action: str  # approved, rejected, returned, signed
    comments: Optional[str] = None
    signature_data: Optional[str] = None  # Base64 signature or URL

class ApprovalResponse(BaseModel):
    id: UUID
    workflow_step_id: UUID
    user_id: UUID
    action: ApprovalAction
    comments: Optional[str]
    signature_data: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
        use_enum_values = True

# CAPA Management Schemas

class CAPABase(BaseModel):
    title: str
    description: Optional[str] = None
    capa_type: CAPAType
    audit_id: Optional[UUID] = None
    finding_id: Optional[UUID] = None
    risk_id: Optional[UUID] = None
    assigned_to_id: Optional[UUID] = None
    responsible_department_id: Optional[UUID] = None
    due_date: Optional[datetime] = None
    target_completion_date: Optional[datetime] = None
    priority: Optional[str] = "medium"  # low, medium, high, critical
    estimated_cost: Optional[float] = None

class CAPACreate(CAPABase):
    immediate_action: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None

class CAPAUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    immediate_action: Optional[str] = None
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None
    assigned_to_id: Optional[UUID] = None
    responsible_department_id: Optional[UUID] = None
    due_date: Optional[datetime] = None
    target_completion_date: Optional[datetime] = None
    priority: Optional[str] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    progress_percentage: Optional[int] = None
    status: Optional[CAPAStatus] = None

class CAPAResponse(BaseModel):
    id: UUID
    capa_number: str
    title: str
    description: Optional[str]
    capa_type: CAPAType
    status: CAPAStatus
    audit_id: Optional[UUID]
    finding_id: Optional[UUID]
    risk_id: Optional[UUID]
    assigned_to_id: Optional[UUID]
    responsible_department_id: Optional[UUID]
    due_date: Optional[datetime]
    target_completion_date: Optional[datetime]
    actual_completion_date: Optional[datetime]
    priority: str
    progress_percentage: int
    estimated_cost: Optional[float]
    actual_cost: Optional[float]
    created_by_id: UUID
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        use_enum_values = True

class CAPADetailResponse(CAPAResponse):
    immediate_action: Optional[str]
    corrective_action: Optional[str]
    preventive_action: Optional[str]
    root_cause_analysis: Optional[str]
    root_cause_method: Optional[str]
    verification_method: Optional[str]
    verification_evidence: Optional[str]
    effectiveness_review_date: Optional[datetime]
    effectiveness_confirmed: bool
    effectiveness_notes: Optional[str]
    approved_by_id: Optional[UUID]
    closed_by_id: Optional[UUID]
    
    class Config:
        from_attributes = True
        use_enum_values = True

class RootCauseAnalysisUpdate(BaseModel):
    root_cause_analysis: str
    root_cause_method: str  # five_whys, fishbone, fault_tree, etc.
    corrective_action: Optional[str] = None
    preventive_action: Optional[str] = None

class EffectivenessReviewUpdate(BaseModel):
    verification_method: str
    verification_evidence: str
    effectiveness_confirmed: bool
    effectiveness_notes: Optional[str] = None
    actual_cost: Optional[float] = None

class CAPAOverdueResponse(BaseModel):
    id: UUID
    capa_number: str
    title: str
    assigned_to_id: Optional[UUID]
    due_date: Optional[datetime]
    days_overdue: int
    priority: str
    status: CAPAStatus
    
    class Config:
        use_enum_values = True

# Document Control Schemas
class DocumentBase(BaseModel):
    document_name: str
    document_type: str
    category: Optional[str] = None
    description: Optional[str] = None
    keywords: Optional[str] = None
    department_id: Optional[UUID] = None
    confidentiality_level: Optional[str] = "internal"
    access_roles: Optional[List[str]] = None
    review_frequency_months: Optional[int] = 12
    is_controlled: Optional[bool] = True

class DocumentUpload(BaseModel):
    document_name: str
    document_type: str
    category: Optional[str] = None
    description: Optional[str] = None
    keywords: Optional[str] = None
    department_id: Optional[UUID] = None
    confidentiality_level: Optional[str] = "internal"
    access_roles: Optional[List[str]] = None
    review_frequency_months: Optional[int] = 12
    is_controlled: Optional[bool] = True
    effective_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None

class DocumentApproval(BaseModel):
    action: str  # approve, reject, request_changes
    comments: Optional[str] = None
    effective_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None

class DocumentResponse(BaseModel):
    id: UUID
    document_number: str
    document_name: str
    document_type: str
    category: Optional[str]
    version: str
    file_url: str
    file_name: str
    file_size: Optional[int]
    mime_type: Optional[str]
    approval_status: DocumentStatus
    effective_date: Optional[datetime]
    expiry_date: Optional[datetime]
    next_review_date: Optional[datetime]
    uploaded_by_id: UUID
    reviewed_by_id: Optional[UUID]
    approved_by_id: Optional[UUID]
    department_id: Optional[UUID]
    confidentiality_level: str
    is_controlled: bool
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True
        use_enum_values = True

class DocumentDetailResponse(DocumentResponse):
    description: Optional[str]
    keywords: Optional[str]
    access_roles: Optional[List[str]]
    change_history: Optional[List[Dict[str, Any]]]
    supersedes_document_id: Optional[UUID]
    tags: Optional[List[str]]

class DocumentSearchRequest(BaseModel):
    query: Optional[str] = None
    document_type: Optional[str] = None
    category: Optional[str] = None
    department_id: Optional[UUID] = None
    approval_status: Optional[DocumentStatus] = None
    confidentiality_level: Optional[str] = None
    tags: Optional[List[str]] = None
    date_from: Optional[datetime] = None
    date_to: Optional[datetime] = None
    include_expired: Optional[bool] = False
    limit: Optional[int] = 50
    offset: Optional[int] = 0

class DocumentSearchResponse(BaseModel):
    documents: List[DocumentResponse]
    total_count: int
    has_more: bool

class DocumentExpiringResponse(BaseModel):
    id: UUID
    document_number: str
    document_name: str
    document_type: str
    expiry_date: datetime
    days_until_expiry: int
    next_review_date: Optional[datetime]
    responsible_person: Optional[str]
    department_name: Optional[str]
    
class DocumentTagCreate(BaseModel):
    tag_name: str

class DocumentTagResponse(BaseModel):
    id: UUID
    document_id: UUID
    tag_name: str
    created_at: datetime
    
    class Config:
        from_attributes = True