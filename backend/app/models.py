from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Enum, Boolean, text, JSON, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum
from app.database import Base

class UserRole(str, enum.Enum):
    SYSTEM_ADMIN = "system_admin"
    AUDIT_MANAGER = "audit_manager"
    AUDITOR = "auditor"
    DEPARTMENT_HEAD = "department_head"
    DEPARTMENT_OFFICER = "department_officer"
    VIEWER = "viewer"

class AuditStatus(str, enum.Enum):
    PLANNED = "PLANNED"
    INITIATED = "INITIATED"      # ISO 19011 Clause 6.2
    PREPARATION = "PREPARATION"  # ISO 19011 Clause 6.3
    EXECUTING = "EXECUTING"      # ISO 19011 Clause 6.4
    REPORTING = "REPORTING"      # ISO 19011 Clause 6.5
    FOLLOWUP = "FOLLOWUP"        # ISO 19011 Clause 6.6
    CLOSED = "CLOSED"

class ReportStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    PUBLISHED = "PUBLISHED"

class FindingSeverity(str, enum.Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Two-Factor Authentication (2FA) fields
    totp_secret = Column(String(32), nullable=True)  # TOTP secret key for authenticator apps
    totp_enabled = Column(Boolean, default=False)    # Whether 2FA is enabled for this user
    backup_codes = Column(Text, nullable=True)       # JSON array of hashed backup codes
    
    # Soft delete fields
    is_deleted = Column(Boolean, default=False, index=True)
    deleted_at = Column(DateTime, nullable=True)
    deleted_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    deletion_reason = Column(Text, nullable=True)
    
    department = relationship("Department", back_populates="users")
    deleted_by = relationship("User", remote_side=[id], foreign_keys=[deleted_by_id])

class Department(Base):
    __tablename__ = "departments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False)
    parent_department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    users = relationship("User", back_populates="department")
    parent = relationship("Department", remote_side=[id], backref="children")

class Audit(Base):
    __tablename__ = "audits"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title = Column(String, nullable=False)
    year = Column(Integer, nullable=False)
    scope = Column(Text)
    risk_rating = Column(String)
    status = Column(Enum(AuditStatus), default=AuditStatus.PLANNED)
    assigned_manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # ISO 19011 Clause 6.2 - Audit Initiation Fields
    audit_objectives = Column(Text)  # ISO 19011 6.2 - Clear audit objectives
    audit_criteria = Column(Text)    # ISO 19011 6.2 - Audit criteria (standards, procedures, requirements)
    audit_scope_detailed = Column(Text)  # ISO 19011 6.2 - Detailed scope definition
    audit_methodology = Column(Text)     # ISO 19011 6.2 - Audit methods and techniques
    
    # ISO 19011 Clause 5 - Audit Programme Integration
    audit_programme_id = Column(UUID(as_uuid=True), ForeignKey("audit_programmes.id"))
    risk_based_selection = Column(Boolean, default=False)  # ISO 19011 5.4 - Risk-based audit selection
    audit_priority = Column(String, default="medium")     # high, medium, low based on risk assessment
    
    # ISO 19011 Clause 6.2 - Audit Team Assignment
    lead_auditor_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    audit_team_competency_verified = Column(Boolean, default=False)  # ISO 19011 7.2 - Competency verification
    
    # ISO 19011 Clause 6.2 - Auditee Information
    auditee_organization = Column(String)
    auditee_contact_person_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    auditee_location = Column(String)
    
    # ISO 19011 Clause 6.2 - Audit Feasibility
    feasibility_confirmed = Column(Boolean, default=False)
    feasibility_notes = Column(Text)
    
    # ISO 19011 Workflow Status Tracking
    initiation_completed = Column(Boolean, default=False)
    preparation_completed = Column(Boolean, default=False)
    execution_completed = Column(Boolean, default=False)
    reporting_completed = Column(Boolean, default=False)
    followup_completed = Column(Boolean, default=False)
    
    assigned_manager = relationship("User", foreign_keys=[assigned_manager_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    department = relationship("Department")
    lead_auditor = relationship("User", foreign_keys=[lead_auditor_id])
    auditee_contact = relationship("User", foreign_keys=[auditee_contact_person_id])
    audit_programme = relationship("AuditProgramme", back_populates="audits")

class AuditTeam(Base):
    __tablename__ = "audit_team"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role_in_audit = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    audit = relationship("Audit")
    user = relationship("User")

class AuditWorkProgram(Base):
    __tablename__ = "audit_work_program"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=False)
    procedure_name = Column(String, nullable=False)
    description = Column(Text)
    status = Column(String, default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    audit = relationship("Audit")

class AuditEvidence(Base):
    __tablename__ = "audit_evidence"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # ISO 19011 Clause 6.4 - Enhanced Evidence Fields
    evidence_type = Column(String, default="document")  # document, interview, observation, record
    file_hash = Column(String)  # SHA-256 hash for integrity checking
    file_size = Column(Integer)  # File size in bytes
    mime_type = Column(String)   # MIME type for file validation
    
    # Evidence linking and categorization
    linked_checklist_id = Column(UUID(as_uuid=True), ForeignKey("audit_checklists.id"))
    linked_finding_id = Column(UUID(as_uuid=True), ForeignKey("audit_findings.id"))
    evidence_category = Column(String)  # policy, procedure, record, interview_note, observation
    
    # ISO 19011 Clause 6.4.5 - Objective Evidence Requirements
    is_objective_evidence = Column(Boolean, default=True)
    evidence_source = Column(String)  # auditee, auditor, system, external
    collection_method = Column(String)  # sampling, interview, observation, document_review
    
    # Timestamp and integrity (ISO 19011 Clause 6.4.6)
    evidence_timestamp = Column(DateTime, default=datetime.utcnow)  # When evidence was collected
    chain_of_custody = Column(JSON)  # Array of custody transfer records
    
    audit = relationship("Audit")
    uploaded_by = relationship("User")
    linked_checklist = relationship("AuditChecklist")
    linked_finding = relationship("AuditFinding")

class AuditFinding(Base):
    __tablename__ = "audit_findings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=False)
    title = Column(String, nullable=False)
    severity = Column(Enum(FindingSeverity), nullable=False)
    impact = Column(Text)
    root_cause = Column(Text)
    recommendation = Column(Text)
    response_from_auditee = Column(Text)
    status = Column(String, default="open")
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    audit = relationship("Audit")
    assigned_to = relationship("User")

class AuditQuery(Base):
    __tablename__ = "audit_queries"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=False)
    from_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    to_user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    message = Column(Text, nullable=False)
    parent_query_id = Column(UUID(as_uuid=True), ForeignKey("audit_queries.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    audit = relationship("Audit")
    from_user = relationship("User", foreign_keys=[from_user_id])
    to_user = relationship("User", foreign_keys=[to_user_id])
    replies = relationship("AuditQuery", remote_side=[parent_query_id])

# ISO 19011 Clause 6.4 - Interview Notes Model
class AuditInterviewNote(Base):
    __tablename__ = "audit_interview_notes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=False)
    
    # Interview Details - matches actual database columns
    interview_title = Column(String, nullable=False)
    interviewee_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    interviewer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Interview Context
    interview_date = Column(DateTime, nullable=False)
    interview_location = Column(String)
    interview_duration_minutes = Column(Integer)
    
    # Interview Content
    interview_objective = Column(Text)
    questions_asked = Column(JSON)
    key_findings = Column(Text)
    follow_up_actions = Column(JSON)
    interview_method = Column(String)
    
    # Additional fields
    witnesses_present = Column(JSON)
    audio_recording_url = Column(String)
    transcript_url = Column(String)
    supporting_documents = Column(JSON)
    
    # Approval
    notes_reviewed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    notes_approved = Column(Boolean, default=False)
    interviewee_confirmation = Column(Boolean, default=False)
    
    # Metadata
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    audit = relationship("Audit")
    interviewee = relationship("User", foreign_keys=[interviewee_id])
    interviewer = relationship("User", foreign_keys=[interviewer_id])
    notes_reviewed_by = relationship("User", foreign_keys=[notes_reviewed_by_id])
    created_by = relationship("User", foreign_keys=[created_by_id])

class AuditReport(Base):
    __tablename__ = "audit_reports"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=False)
    version = Column(Integer, default=1)
    content = Column(Text)
    status = Column(Enum(ReportStatus), default=ReportStatus.DRAFT)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    comments = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    audit = relationship("Audit")
    created_by = relationship("User")

class AuditFollowup(Base):
    __tablename__ = "audit_followup"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=False)
    finding_id = Column(UUID(as_uuid=True), ForeignKey("audit_findings.id"))
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    due_date = Column(DateTime)
    status = Column(String, default="pending")
    evidence_url = Column(String)
    completion_notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    audit = relationship("Audit")
    finding = relationship("AuditFinding")
    assigned_to = relationship("User")

class WorkflowStatus(str, enum.Enum):
    PENDING = "PENDING"
    IN_PROGRESS = "IN_PROGRESS"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    COMPLETED = "COMPLETED"

class Workflow(Base):
    __tablename__ = "workflows"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reference_number = Column(String, unique=True, nullable=False, index=True)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=True)  # Now optional for standalone workflows
    name = Column(String, nullable=False)
    description = Column(Text)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    status = Column(Enum(WorkflowStatus), default=WorkflowStatus.PENDING)
    current_step = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    # Sender information for standalone workflows
    sender_name = Column(String(255), nullable=True)
    sender_department = Column(String(255), nullable=True)
    
    audit = relationship("Audit")
    created_by = relationship("User")
    steps = relationship("WorkflowStep", back_populates="workflow", order_by="WorkflowStep.step_order")
    documents = relationship("WorkflowDocument", back_populates="workflow")

class WorkflowStep(Base):
    __tablename__ = "workflow_steps"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id"), nullable=False)
    step_order = Column(Integer, nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=False)
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    action_required = Column(String, default="review_and_approve")
    custom_action_text = Column(String(500), nullable=True)  # Custom action instructions
    status = Column(Enum(WorkflowStatus), default=WorkflowStatus.PENDING)
    due_date = Column(DateTime)
    started_at = Column(DateTime)
    completed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    workflow = relationship("Workflow", back_populates="steps")
    department = relationship("Department")
    assigned_to = relationship("User")
    approvals = relationship("WorkflowApproval", back_populates="workflow_step")

class ApprovalAction(str, enum.Enum):
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    RETURNED = "RETURNED"
    SIGNED = "SIGNED"
    REVIEWED = "REVIEWED"
    ACKNOWLEDGED = "ACKNOWLEDGED"

class ComplianceStatus(str, enum.Enum):
    NOT_ASSESSED = "NOT_ASSESSED"
    COMPLIANT = "COMPLIANT"
    PARTIALLY_COMPLIANT = "PARTIALLY_COMPLIANT"
    NON_COMPLIANT = "NON_COMPLIANT"
    NOT_APPLICABLE = "NOT_APPLICABLE"

class RiskCategory(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class CAPAType(str, enum.Enum):
    CORRECTIVE = "CORRECTIVE"
    PREVENTIVE = "PREVENTIVE"
    BOTH = "BOTH"

class CAPAStatus(str, enum.Enum):
    OPEN = "OPEN"
    IN_PROGRESS = "IN_PROGRESS"
    PENDING_VERIFICATION = "PENDING_VERIFICATION"
    CLOSED = "CLOSED"
    OVERDUE = "OVERDUE"

class DocumentStatus(str, enum.Enum):
    DRAFT = "DRAFT"
    UNDER_REVIEW = "UNDER_REVIEW"
    APPROVED = "APPROVED"
    ACTIVE = "ACTIVE"
    EXPIRED = "EXPIRED"
    ARCHIVED = "ARCHIVED"

class AssetStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    DISPOSED = "DISPOSED"
    UNDER_MAINTENANCE = "UNDER_MAINTENANCE"

class VendorRiskRating(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class WorkflowApproval(Base):
    __tablename__ = "workflow_approvals"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_step_id = Column(UUID(as_uuid=True), ForeignKey("workflow_steps.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    action = Column(Enum(ApprovalAction), nullable=False)
    comments = Column(Text)
    signature_data = Column(Text)  # Base64 encoded signature or signature URL
    ip_address = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    workflow_step = relationship("WorkflowStep", back_populates="approvals")
    user = relationship("User")

class WorkflowDocument(Base):
    """Documents attached to workflows for reference"""
    __tablename__ = "workflow_documents"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id"), nullable=False)
    file_name = Column(String(255), nullable=False)
    file_url = Column(String(1000), nullable=False)
    file_size = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=True)
    description = Column(Text, nullable=True)
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    workflow = relationship("Workflow", back_populates="documents")
    uploaded_by = relationship("User")

# ISO 19011 Audit Programme Models (Clause 5)

class AuditProgramme(Base):
    __tablename__ = "audit_programmes"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    programme_name = Column(String, nullable=False)
    programme_year = Column(Integer, nullable=False)
    
    # ISO 19011 Clause 5.2 - Programme Objectives
    programme_objectives = Column(Text, nullable=False)
    
    # ISO 19011 Clause 5.3 - Programme Management
    programme_manager_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # ISO 19011 Clause 5.4 - Risk-based Planning
    risk_assessment_completed = Column(Boolean, default=False)
    risk_factors_considered = Column(JSON)  # Array of risk factors
    
    # ISO 19011 Clause 5.5 - Programme Implementation
    total_planned_audits = Column(Integer, default=0)
    completed_audits = Column(Integer, default=0)
    
    # Programme Status
    status = Column(String, default="planning")  # planning, active, completed, cancelled
    start_date = Column(DateTime)
    end_date = Column(DateTime)
    
    # Metadata
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    programme_manager = relationship("User", foreign_keys=[programme_manager_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    audits = relationship("Audit", back_populates="audit_programme")

# ISO 19011 Clause 6.3 - Audit Preparation Models

class AuditPreparationChecklist(Base):
    __tablename__ = "audit_preparation_checklists"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=False)
    
    # ISO 19011 Clause 6.3 - Preparation Requirements
    checklist_name = Column(String, nullable=False)
    framework_template = Column(String)  # ISO framework used for template
    
    # Checklist Items (JSON structure)
    checklist_items = Column(JSON, nullable=False)  # Array of checklist items with status
    
    # Preparation Status
    total_items = Column(Integer, default=0)
    completed_items = Column(Integer, default=0)
    completion_percentage = Column(Integer, default=0)
    
    # Assignment and Tracking
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    due_date = Column(DateTime)
    completed_date = Column(DateTime)
    
    # Metadata
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    audit = relationship("Audit")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    created_by = relationship("User", foreign_keys=[created_by_id])

class AuditDocumentRequest(Base):
    __tablename__ = "audit_document_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=False)
    
    # Document Request Details
    document_name = Column(String, nullable=False)
    document_description = Column(Text)
    document_type = Column(String)  # policy, procedure, record, evidence, etc.
    
    # Request Information
    requested_from_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))  # Auditee
    requested_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))    # Auditor
    request_date = Column(DateTime, default=datetime.utcnow)
    due_date = Column(DateTime)
    
    # Status Tracking
    status = Column(String, default="requested")  # requested, provided, overdue, not_available
    priority = Column(String, default="medium")   # low, medium, high, critical
    
    # Response Information
    response_date = Column(DateTime)
    response_notes = Column(Text)
    document_url = Column(String)  # URL to provided document
    
    # Follow-up
    follow_up_required = Column(Boolean, default=False)
    follow_up_notes = Column(Text)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    audit = relationship("Audit")
    requested_from = relationship("User", foreign_keys=[requested_from_id])
    requested_by = relationship("User", foreign_keys=[requested_by_id])

class AuditRiskAssessment(Base):
    __tablename__ = "audit_risk_assessments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=False)
    
    # ISO 19011 Clause 6.3 - Pre-audit Risk Assessment
    risk_area = Column(String, nullable=False)  # Process, department, or area being assessed
    risk_description = Column(Text, nullable=False)
    
    # Risk Evaluation
    likelihood = Column(Integer, nullable=False)  # 1-5 scale
    impact = Column(Integer, nullable=False)      # 1-5 scale
    risk_score = Column(Integer, nullable=False)  # likelihood × impact
    risk_level = Column(String, nullable=False)   # low, medium, high, critical
    
    # Risk Factors
    inherent_risk_factors = Column(JSON)  # Array of factors contributing to risk
    control_effectiveness = Column(String, default="unknown")  # effective, partially_effective, ineffective, unknown
    
    # Audit Focus Areas
    requires_detailed_testing = Column(Boolean, default=False)
    sampling_approach = Column(String)  # statistical, judgmental, block, systematic
    recommended_audit_procedures = Column(Text)
    
    # Assessment Details
    assessed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    assessment_date = Column(DateTime, default=datetime.utcnow)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    audit = relationship("Audit")
    assessed_by = relationship("User")

# ISO 19011 Clause 6.4 - Audit Execution Models

class AuditSampling(Base):
    __tablename__ = "audit_sampling"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=False)
    
    # Sampling Design (ISO 19011 Clause 6.4.3)
    sampling_name = Column(String, nullable=False)
    population_description = Column(Text, nullable=False)  # Description of the population being sampled
    population_size = Column(Integer)                      # Total size of population
    sample_size = Column(Integer, nullable=False)          # Number of items to sample
    
    # Sampling Method
    sampling_method = Column(String, nullable=False)  # statistical, judgmental, block, systematic, random
    sampling_rationale = Column(Text)                 # Justification for sampling approach
    confidence_level = Column(Integer, default=95)   # Statistical confidence level (%)
    margin_of_error = Column(Integer, default=5)     # Acceptable margin of error (%)
    
    # Sampling Criteria
    selection_criteria = Column(JSON)  # Array of criteria for sample selection
    stratification = Column(JSON)     # Stratification parameters if applicable
    
    # Sample Items
    sample_items = Column(JSON, nullable=False)  # Array of selected sample items with details
    
    # Execution Status
    samples_tested = Column(Integer, default=0)
    samples_passed = Column(Integer, default=0)
    samples_failed = Column(Integer, default=0)
    completion_percentage = Column(Integer, default=0)
    
    # Results and Analysis
    sampling_results = Column(JSON)    # Detailed results for each sample item
    error_rate = Column(Numeric(5, 2)) # Calculated error rate as percentage
    projection_to_population = Column(Text)  # Projection of sample results to population
    
    # ISO 19011 Requirements
    sampling_risk_assessment = Column(Text)  # Assessment of sampling risk
    limitations = Column(Text)               # Limitations of the sampling approach
    
    # Assignment and Tracking
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    due_date = Column(DateTime)
    completed_date = Column(DateTime)
    
    # Metadata
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    audit = relationship("Audit")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    created_by = relationship("User", foreign_keys=[created_by_id])

class AuditObservation(Base):
    __tablename__ = "audit_observations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=False)
    
    # Observation Details
    observation_title = Column(String, nullable=False)
    observation_area = Column(String, nullable=False)  # Location or process area observed
    observation_date = Column(DateTime, nullable=False)
    observation_duration_minutes = Column(Integer)
    
    # Observation Content
    observation_objective = Column(Text)    # Purpose of the observation
    process_observed = Column(String)       # Specific process or activity observed
    personnel_observed = Column(JSON)       # Array of personnel IDs observed
    
    # Findings and Evidence
    observations_made = Column(Text, nullable=False)  # Detailed observations
    compliance_status = Column(String)                # compliant, non_compliant, partially_compliant
    deviations_noted = Column(Text)                   # Any deviations from expected procedures
    
    # Supporting Evidence
    photos_taken = Column(JSON)        # Array of photo URLs
    documents_reviewed = Column(JSON)  # Array of document references
    measurements_taken = Column(JSON)  # Array of measurements or data collected
    
    # ISO 19011 Clause 6.4.2 - Observation Guidelines
    observer_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    observation_method = Column(String, default="direct")  # direct, remote, continuous, spot_check
    observation_announced = Column(Boolean, default=True)  # Whether observation was announced
    
    # Follow-up
    requires_follow_up = Column(Boolean, default=False)
    follow_up_actions = Column(JSON)  # Array of required follow-up actions
    
    # Metadata
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    audit = relationship("Audit")
    observer = relationship("User", foreign_keys=[observer_id])
    created_by = relationship("User", foreign_keys=[created_by_id])

# ISO Compliance Models

class ISOFramework(Base):
    __tablename__ = "iso_frameworks"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String, nullable=False, unique=True)  # e.g., "ISO 27001", "ISO 9001"
    version = Column(String, nullable=False)  # e.g., "2022", "2015"
    description = Column(Text)
    clauses = Column(JSON)  # JSON structure containing framework clauses and requirements
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    audit_checklists = relationship("AuditChecklist", back_populates="framework")

class AuditChecklist(Base):
    __tablename__ = "audit_checklists"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=False)
    framework_id = Column(UUID(as_uuid=True), ForeignKey("iso_frameworks.id"), nullable=False)
    clause_reference = Column(String, nullable=False)  # e.g., "A.5.1.1", "4.1"
    clause_title = Column(String, nullable=False)
    description = Column(Text)
    compliance_status = Column(Enum(ComplianceStatus), default=ComplianceStatus.NOT_ASSESSED)
    compliance_score = Column(Integer, default=0)  # 0-100 percentage
    notes = Column(Text)
    next_due_date = Column(DateTime)  # For recurring controls
    assessed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    assessed_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    audit = relationship("Audit")
    framework = relationship("ISOFramework", back_populates="audit_checklists")
    assessed_by = relationship("User")
    evidence_items = relationship("ChecklistEvidence", back_populates="checklist")

class ChecklistEvidence(Base):
    __tablename__ = "checklist_evidence"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    checklist_id = Column(UUID(as_uuid=True), ForeignKey("audit_checklists.id"), nullable=False)
    file_name = Column(String, nullable=False)
    file_url = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)  # SHA-256 hash for integrity checking
    file_size = Column(Integer)  # File size in bytes
    mime_type = Column(String)
    description = Column(Text)
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    checklist = relationship("AuditChecklist", back_populates="evidence_items")
    uploaded_by = relationship("User")

# Risk Assessment Models

class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    # Note: audit_id is deprecated and kept for backward compatibility only
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=True)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False)  # Required field
    risk_title = Column(String, nullable=False)
    description = Column(Text)
    likelihood_score = Column(Integer, nullable=False)  # 1-5 scale per ISO 31000
    impact_score = Column(Integer, nullable=False)      # 1-5 scale per ISO 31000
    risk_rating = Column(Integer, nullable=False)       # likelihood × impact
    risk_category = Column(Enum(RiskCategory), nullable=False)  # Calculated based on risk_rating
    threat_source = Column(String)
    vulnerability = Column(Text)
    existing_controls = Column(Text)
    mitigation_plan = Column(Text)
    residual_risk_score = Column(Integer)
    risk_owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    next_review_date = Column(DateTime)
    status = Column(String, default="active")
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    audit = relationship("Audit")  # Deprecated - kept for backward compatibility
    asset = relationship("Asset")
    risk_owner = relationship("User", foreign_keys=[risk_owner_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    controls = relationship("RiskControl", back_populates="risk")

class RiskControl(Base):
    __tablename__ = "risk_controls"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    risk_id = Column(UUID(as_uuid=True), ForeignKey("risk_assessments.id"), nullable=False)
    control_reference = Column(String, nullable=False)  # e.g., "A.5.1.1" from ISO 27001
    control_title = Column(String, nullable=False)
    control_description = Column(Text)
    control_type = Column(String)  # preventive, detective, corrective
    implementation_status = Column(String, default="planned")  # planned, implementing, implemented, not_applicable
    effectiveness_rating = Column(Integer)  # 1-5 scale
    implementation_date = Column(DateTime)
    responsible_person_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    evidence_url = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    risk = relationship("RiskAssessment", back_populates="controls")
    responsible_person = relationship("User")

# Asset Management Models

class Asset(Base):
    __tablename__ = "assets"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_name = Column(String, nullable=False)
    asset_category = Column(String, nullable=False)  # hardware, software, data, personnel, facilities
    asset_type = Column(String)  # server, laptop, database, application, etc.
    asset_value = Column(Numeric(15, 2))  # Monetary value
    criticality_level = Column(String)  # critical, high, medium, low
    procurement_date = Column(DateTime)
    warranty_expiry = Column(DateTime)
    owner_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    custodian_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    location = Column(String)
    serial_number = Column(String)
    model = Column(String)
    vendor = Column(String)
    status = Column(Enum(AssetStatus), default=AssetStatus.ACTIVE)
    disposal_date = Column(DateTime)
    disposal_value = Column(Numeric(15, 2))
    disposal_method = Column(String)
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    owner = relationship("User", foreign_keys=[owner_id])
    custodian = relationship("User", foreign_keys=[custodian_id])
    department = relationship("Department")
    assignments = relationship("AssetAssignment", back_populates="asset")
    risk_assessments = relationship("RiskAssessment", back_populates="asset")

class AssetAssignment(Base):
    __tablename__ = "asset_assignments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    asset_id = Column(UUID(as_uuid=True), ForeignKey("assets.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    assigned_date = Column(DateTime, default=datetime.utcnow)
    expected_return_date = Column(DateTime)
    returned_date = Column(DateTime)
    assignment_purpose = Column(String)
    assignment_notes = Column(Text)
    return_condition = Column(String)
    return_notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    asset = relationship("Asset", back_populates="assignments")
    user = relationship("User", foreign_keys=[user_id])
    assigned_by = relationship("User", foreign_keys=[assigned_by_id])

# Enhanced CAPA Management Models

class CAPAItem(Base):
    __tablename__ = "capa_items"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    capa_number = Column(String, unique=True, nullable=False)  # Auto-generated CAPA reference
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"))
    finding_id = Column(UUID(as_uuid=True), ForeignKey("audit_findings.id"))
    risk_id = Column(UUID(as_uuid=True), ForeignKey("risk_assessments.id"))
    capa_type = Column(Enum(CAPAType), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    
    # Root Cause Analysis (ISO 9001 Clause 10.2.1)
    root_cause_analysis = Column(Text)  # Five Whys, Fishbone, etc.
    root_cause_method = Column(String)  # five_whys, fishbone, fault_tree
    
    # Actions (ISO 9001 Clause 10.2.1)
    immediate_action = Column(Text)  # Immediate containment
    corrective_action = Column(Text)  # Address root cause
    preventive_action = Column(Text)  # Prevent recurrence
    
    # Assignment and Timeline
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    responsible_department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    due_date = Column(DateTime)
    target_completion_date = Column(DateTime)
    actual_completion_date = Column(DateTime)
    
    # Status and Progress
    status = Column(Enum(CAPAStatus), default=CAPAStatus.OPEN)
    progress_percentage = Column(Integer, default=0)
    
    # Verification and Effectiveness (ISO 9001 Clause 10.2.1)
    verification_method = Column(String)
    verification_evidence = Column(Text)
    effectiveness_review_date = Column(DateTime)
    effectiveness_confirmed = Column(Boolean, default=False)
    effectiveness_notes = Column(Text)
    
    # Metadata
    priority = Column(String, default="medium")  # low, medium, high, critical
    estimated_cost = Column(Numeric(15, 2))
    actual_cost = Column(Numeric(15, 2))
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    closed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    audit = relationship("Audit")
    finding = relationship("AuditFinding")
    risk = relationship("RiskAssessment")
    assigned_to = relationship("User", foreign_keys=[assigned_to_id])
    responsible_department = relationship("Department")
    created_by = relationship("User", foreign_keys=[created_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    closed_by = relationship("User", foreign_keys=[closed_by_id])

# Document Control System Models

class DocumentRepository(Base):
    __tablename__ = "document_repository"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_number = Column(String, unique=True, nullable=False)  # Auto-generated doc reference
    document_name = Column(String, nullable=False)
    document_type = Column(String, nullable=False)  # policy, procedure, manual, form, etc.
    category = Column(String)  # HR, IT, Quality, Security, etc.
    version = Column(String, nullable=False, default="1.0")
    
    # File Information
    file_url = Column(String, nullable=False)
    file_name = Column(String, nullable=False)
    file_hash = Column(String, nullable=False)  # SHA-256 for integrity
    file_size = Column(Integer)
    mime_type = Column(String)
    
    # Document Control (ISO 9001 Clause 7.5)
    approval_status = Column(Enum(DocumentStatus), default=DocumentStatus.DRAFT)
    effective_date = Column(DateTime)
    expiry_date = Column(DateTime)
    review_frequency_months = Column(Integer)  # Review cycle in months
    next_review_date = Column(DateTime)
    
    # Approval Workflow
    uploaded_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    reviewed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    
    # Change Management
    change_history = Column(JSON)  # Array of change records
    supersedes_document_id = Column(UUID(as_uuid=True), ForeignKey("document_repository.id"))
    
    # Access Control
    confidentiality_level = Column(String, default="internal")  # public, internal, confidential, restricted
    access_roles = Column(JSON)  # Array of roles that can access this document
    
    # Metadata
    description = Column(Text)
    keywords = Column(String)  # Comma-separated for search
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    is_controlled = Column(Boolean, default=True)  # Whether this is a controlled document
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    uploaded_by = relationship("User", foreign_keys=[uploaded_by_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    department = relationship("Department")
    supersedes = relationship("DocumentRepository", remote_side=[id])
    tags = relationship("DocumentTag", back_populates="document")

class DocumentTag(Base):
    __tablename__ = "document_tags"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("document_repository.id"), nullable=False)
    tag_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    document = relationship("DocumentRepository", back_populates="tags")

# Vendor Management Models

class Vendor(Base):
    __tablename__ = "vendors"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_code = Column(String, unique=True, nullable=False)  # Auto-generated vendor code
    vendor_name = Column(String, nullable=False)
    vendor_type = Column(String)  # supplier, service_provider, contractor, consultant
    
    # Contact Information
    primary_contact_name = Column(String)
    primary_contact_email = Column(String)
    primary_contact_phone = Column(String)
    secondary_contact_name = Column(String)
    secondary_contact_email = Column(String)
    secondary_contact_phone = Column(String)
    
    # Address Information
    address_line1 = Column(String)
    address_line2 = Column(String)
    city = Column(String)
    state_province = Column(String)
    postal_code = Column(String)
    country = Column(String)
    
    # Business Information
    business_registration_number = Column(String)
    tax_identification_number = Column(String)
    website = Column(String)
    industry = Column(String)
    
    # Risk Assessment
    risk_rating = Column(Enum(VendorRiskRating), default=VendorRiskRating.MEDIUM)
    risk_assessment_date = Column(DateTime)
    risk_notes = Column(Text)
    
    # Status and Lifecycle
    status = Column(String, default="active")  # active, inactive, suspended, terminated
    onboarding_date = Column(DateTime)
    contract_start_date = Column(DateTime)
    contract_end_date = Column(DateTime)
    
    # Compliance and Certifications
    iso_certifications = Column(JSON)  # Array of ISO certifications
    other_certifications = Column(JSON)  # Array of other certifications
    insurance_coverage = Column(Numeric(15, 2))
    insurance_expiry = Column(DateTime)
    
    # Performance Metrics
    performance_rating = Column(Integer)  # 1-5 scale
    last_evaluation_date = Column(DateTime)
    
    # Metadata
    notes = Column(Text)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    created_by = relationship("User")
    evaluations = relationship("VendorEvaluation", back_populates="vendor")
    slas = relationship("VendorSLA", back_populates="vendor")

class VendorEvaluation(Base):
    __tablename__ = "vendor_evaluations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id"), nullable=False)
    evaluation_type = Column(String, nullable=False)  # initial, periodic, incident_based
    evaluation_period_start = Column(DateTime)
    evaluation_period_end = Column(DateTime)
    
    # Questionnaire and Assessment
    questionnaire_data = Column(JSON)  # Structured questionnaire responses
    evaluation_criteria = Column(JSON)  # Criteria and scoring
    overall_score = Column(Integer)  # Overall evaluation score
    evaluation_result = Column(String)  # approved, conditional, rejected
    
    # Specific Assessment Areas
    quality_score = Column(Integer)
    delivery_score = Column(Integer)
    cost_score = Column(Integer)
    service_score = Column(Integer)
    compliance_score = Column(Integer)
    
    # Findings and Recommendations
    strengths = Column(Text)
    weaknesses = Column(Text)
    recommendations = Column(Text)
    action_items = Column(JSON)  # Array of required actions
    
    # Approval and Review
    evaluated_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    reviewed_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    evaluation_date = Column(DateTime, default=datetime.utcnow)
    next_evaluation_date = Column(DateTime)
    
    # Metadata
    notes = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    vendor = relationship("Vendor", back_populates="evaluations")
    evaluated_by = relationship("User", foreign_keys=[evaluated_by_id])
    reviewed_by = relationship("User", foreign_keys=[reviewed_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])

class VendorSLA(Base):
    __tablename__ = "vendor_slas"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    vendor_id = Column(UUID(as_uuid=True), ForeignKey("vendors.id"), nullable=False)
    sla_name = Column(String, nullable=False)
    sla_type = Column(String)  # service_level, performance, availability, security
    
    # SLA Document
    document_url = Column(String)
    document_hash = Column(String)  # SHA-256 hash
    
    # SLA Terms
    service_description = Column(Text)
    performance_metrics = Column(JSON)  # Array of KPIs and targets
    availability_target = Column(Numeric(5, 2))  # Percentage (e.g., 99.9%)
    response_time_target = Column(Integer)  # In minutes
    resolution_time_target = Column(Integer)  # In hours
    
    # Contract Information
    start_date = Column(DateTime, nullable=False)
    end_date = Column(DateTime)
    auto_renewal = Column(Boolean, default=False)
    renewal_notice_days = Column(Integer, default=30)
    
    # Performance Tracking
    current_performance = Column(JSON)  # Current performance metrics
    last_review_date = Column(DateTime)
    next_review_date = Column(DateTime)
    
    # Status and Compliance
    status = Column(String, default="active")  # active, suspended, terminated, expired
    compliance_status = Column(String, default="compliant")  # compliant, non_compliant, under_review
    penalty_clauses = Column(JSON)  # Penalty structure for non-compliance
    
    # Metadata
    notes = Column(Text)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    vendor = relationship("Vendor", back_populates="slas")
    created_by = relationship("User")

# Comprehensive Audit Trail System Models

class SystemAuditLog(Base):
    __tablename__ = "system_audit_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # User and Session Information (ISO 27001 A.12.4.1)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    session_id = Column(String)
    ip_address = Column(String)
    user_agent = Column(String)
    
    # Action Information
    action_type = Column(String, nullable=False)  # CREATE, READ, UPDATE, DELETE, LOGIN, LOGOUT, etc.
    resource_type = Column(String, nullable=False)  # audit, finding, user, document, etc.
    resource_id = Column(String)  # ID of the affected resource
    table_name = Column(String)  # Database table affected
    
    # Change Tracking (ISO 27001 A.12.4.1)
    before_values = Column(JSON)  # Previous state of the record
    after_values = Column(JSON)   # New state of the record
    changed_fields = Column(JSON)  # Array of field names that changed
    
    # Request Information
    endpoint = Column(String)  # API endpoint called
    http_method = Column(String)  # GET, POST, PUT, DELETE
    request_data = Column(JSON)  # Request payload (sanitized)
    response_status = Column(Integer)  # HTTP response status
    
    # Audit Context
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"))  # Related audit if applicable
    business_context = Column(String)  # Business reason for the action
    
    # Security Information (ISO 27001 A.12.4.2)
    risk_level = Column(String, default="low")  # low, medium, high, critical
    security_event = Column(Boolean, default=False)  # Whether this is a security-relevant event
    
    # Compliance and Retention
    retention_period_years = Column(Integer, default=7)  # ISO compliance retention
    is_immutable = Column(Boolean, default=True)  # Prevent modification
    
    # Timestamp (ISO 27001 A.12.4.4)
    timestamp = Column(DateTime, default=datetime.utcnow, nullable=False)
    
    # Relationships
    user = relationship("User")
    audit = relationship("Audit")

# Gap Analysis Models

class GapAnalysis(Base):
    __tablename__ = "gap_analysis"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Framework and Audit Context
    framework_id = Column(UUID(as_uuid=True), ForeignKey("iso_frameworks.id"), nullable=False)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"))
    
    # Gap Identification
    requirement_clause = Column(String, nullable=False)  # e.g., "A.5.1.1", "4.1"
    requirement_title = Column(String, nullable=False)
    requirement_description = Column(Text)
    
    # Current vs Required State
    current_state = Column(Text)  # What is currently implemented
    required_state = Column(Text)  # What should be implemented per ISO
    gap_description = Column(Text)  # Description of the gap
    
    # Gap Assessment
    gap_severity = Column(String)  # critical, high, medium, low
    compliance_percentage = Column(Integer, default=0)  # 0-100% compliance
    gap_status = Column(String, default="identified")  # identified, in_progress, closed, not_applicable
    
    # Remediation
    remediation_plan = Column(Text)
    estimated_effort = Column(String)  # hours, days, weeks
    estimated_cost = Column(Numeric(15, 2))
    target_closure_date = Column(DateTime)
    actual_closure_date = Column(DateTime)
    
    # Linking to CAPA
    capa_id = Column(UUID(as_uuid=True), ForeignKey("capa_items.id"))
    
    # Assignment and Ownership
    responsible_person_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    
    # Evidence and Verification
    evidence_required = Column(Text)
    evidence_provided = Column(Text)
    verification_method = Column(String)
    verified_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    verification_date = Column(DateTime)
    
    # Metadata
    priority = Column(String, default="medium")  # low, medium, high, critical
    notes = Column(Text)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    framework = relationship("ISOFramework")
    audit = relationship("Audit")
    capa = relationship("CAPAItem")
    responsible_person = relationship("User", foreign_keys=[responsible_person_id])
    department = relationship("Department")
    verified_by = relationship("User", foreign_keys=[verified_by_id])
    created_by = relationship("User", foreign_keys=[created_by_id])

# Role Matrix and Access Control Models

class RoleMatrix(Base):
    __tablename__ = "role_matrix"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Role Definition
    role_name = Column(String, nullable=False, unique=True)
    role_description = Column(Text)
    role_category = Column(String)  # system, business, audit, compliance
    
    # Department and Organizational Context
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    is_global_role = Column(Boolean, default=False)  # Whether role applies across all departments
    
    # System Access Levels (ISO 27001 A.9.2.2)
    system_access_levels = Column(JSON)  # Detailed access permissions structure
    
    # Audit System Permissions
    can_create_audits = Column(Boolean, default=False)
    can_view_all_audits = Column(Boolean, default=False)
    can_view_assigned_audits = Column(Boolean, default=True)
    can_edit_audits = Column(Boolean, default=False)
    can_delete_audits = Column(Boolean, default=False)
    can_approve_reports = Column(Boolean, default=False)
    can_manage_users = Column(Boolean, default=False)
    can_manage_departments = Column(Boolean, default=False)
    can_view_analytics = Column(Boolean, default=False)
    can_export_data = Column(Boolean, default=False)
    
    # Risk Management Permissions
    can_create_risks = Column(Boolean, default=False)
    can_assess_risks = Column(Boolean, default=False)
    can_approve_risk_treatments = Column(Boolean, default=False)
    
    # CAPA Permissions
    can_create_capa = Column(Boolean, default=False)
    can_assign_capa = Column(Boolean, default=False)
    can_close_capa = Column(Boolean, default=False)
    
    # Document Control Permissions
    can_upload_documents = Column(Boolean, default=False)
    can_approve_documents = Column(Boolean, default=False)
    can_archive_documents = Column(Boolean, default=False)
    
    # Asset Management Permissions
    can_manage_assets = Column(Boolean, default=False)
    can_assign_assets = Column(Boolean, default=False)
    
    # Vendor Management Permissions
    can_manage_vendors = Column(Boolean, default=False)
    can_evaluate_vendors = Column(Boolean, default=False)
    
    # Data Access Restrictions (ISO 27001 A.9.4.1)
    data_classification_access = Column(JSON)  # What data classifications this role can access
    geographic_restrictions = Column(JSON)  # Geographic access limitations
    time_restrictions = Column(JSON)  # Time-based access restrictions
    
    # Segregation of Duties (ISO 27001 A.6.1.2)
    incompatible_roles = Column(JSON)  # Array of role IDs that cannot be combined
    requires_dual_approval = Column(Boolean, default=False)
    
    # Compliance and Audit
    requires_background_check = Column(Boolean, default=False)
    requires_training_certification = Column(Boolean, default=False)
    max_access_duration_days = Column(Integer)  # Maximum time someone can hold this role
    
    # Metadata
    is_active = Column(Boolean, default=True)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    last_reviewed_date = Column(DateTime)
    next_review_date = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    department = relationship("Department")
    created_by = relationship("User", foreign_keys=[created_by_id])
    approved_by = relationship("User", foreign_keys=[approved_by_id])
    user_role_assignments = relationship("UserRoleAssignment", back_populates="role")

class UserRoleAssignment(Base):
    __tablename__ = "user_role_assignments"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role_id = Column(UUID(as_uuid=True), ForeignKey("role_matrix.id"), nullable=False)
    
    # Assignment Context
    assigned_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    assignment_reason = Column(Text)
    
    # Temporal Controls
    effective_date = Column(DateTime, default=datetime.utcnow)
    expiry_date = Column(DateTime)
    is_temporary = Column(Boolean, default=False)
    
    # Approval and Compliance
    requires_approval = Column(Boolean, default=True)
    approved_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    approval_date = Column(DateTime)
    
    # Status
    is_active = Column(Boolean, default=True)
    deactivated_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    deactivation_date = Column(DateTime)
    deactivation_reason = Column(Text)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    user = relationship("User", foreign_keys=[user_id], viewonly=False)
    role = relationship("RoleMatrix", back_populates="user_role_assignments")
    assigned_by = relationship("User", foreign_keys=[assigned_by_id], viewonly=False)
    approved_by = relationship("User", foreign_keys=[approved_by_id], viewonly=False)
    deactivated_by = relationship("User", foreign_keys=[deactivated_by_id], viewonly=False)
