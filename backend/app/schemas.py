from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime
from uuid import UUID
from app.models import UserRole, AuditStatus, ReportStatus, FindingSeverity

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
    assigned_to_id: Optional[UUID]
    action_required: str
    status: str
    due_date: Optional[datetime]
    started_at: Optional[datetime]
    completed_at: Optional[datetime]
    created_at: datetime
    
    class Config:
        from_attributes = True

class WorkflowCreate(BaseModel):
    audit_id: UUID
    name: str
    description: Optional[str] = None
    steps: List[WorkflowStepCreate]

class WorkflowResponse(BaseModel):
    id: UUID
    audit_id: UUID
    name: str
    description: Optional[str]
    created_by_id: Optional[UUID]
    status: str
    current_step: int
    created_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True

class WorkflowDetailResponse(WorkflowResponse):
    steps: List[WorkflowStepResponse]
    
    class Config:
        from_attributes = True

# Approval Schemas
class ApprovalCreate(BaseModel):
    action: str  # approved, rejected, returned, signed
    comments: Optional[str] = None
    signature_data: Optional[str] = None  # Base64 signature or URL

class ApprovalResponse(BaseModel):
    id: UUID
    workflow_step_id: UUID
    user_id: UUID
    action: str
    comments: Optional[str]
    signature_data: Optional[str]
    ip_address: Optional[str]
    created_at: datetime
    
    class Config:
        from_attributes = True
