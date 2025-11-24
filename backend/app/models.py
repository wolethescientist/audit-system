from sqlalchemy import Column, String, Integer, DateTime, ForeignKey, Text, Enum, Boolean, text
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
    PLANNED = "planned"
    EXECUTING = "executing"
    REPORTING = "reporting"
    FOLLOWUP = "followup"
    CLOSED = "closed"

class ReportStatus(str, enum.Enum):
    DRAFT = "draft"
    UNDER_REVIEW = "under_review"
    APPROVED = "approved"
    REJECTED = "rejected"
    PUBLISHED = "published"

class FindingSeverity(str, enum.Enum):
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    LOW = "low"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    full_name = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    department = relationship("Department", back_populates="users")

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
    
    assigned_manager = relationship("User", foreign_keys=[assigned_manager_id])
    created_by = relationship("User", foreign_keys=[created_by_id])
    department = relationship("Department")

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
    
    audit = relationship("Audit")
    uploaded_by = relationship("User")

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
    created_at = Column(DateTime, default=datetime.utcnow)
    
    audit = relationship("Audit")

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
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    APPROVED = "approved"
    REJECTED = "rejected"
    COMPLETED = "completed"

class Workflow(Base):
    __tablename__ = "workflows"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reference_number = Column(String, unique=True, nullable=False, index=True)
    audit_id = Column(UUID(as_uuid=True), ForeignKey("audits.id"), nullable=False)
    name = Column(String, nullable=False)
    description = Column(Text)
    created_by_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    status = Column(Enum(WorkflowStatus), default=WorkflowStatus.PENDING)
    current_step = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    audit = relationship("Audit")
    created_by = relationship("User")
    steps = relationship("WorkflowStep", back_populates="workflow", order_by="WorkflowStep.step_order")

class WorkflowStep(Base):
    __tablename__ = "workflow_steps"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    workflow_id = Column(UUID(as_uuid=True), ForeignKey("workflows.id"), nullable=False)
    step_order = Column(Integer, nullable=False)
    department_id = Column(UUID(as_uuid=True), ForeignKey("departments.id"), nullable=False)
    assigned_to_id = Column(UUID(as_uuid=True), ForeignKey("users.id"))
    action_required = Column(String, default="review_and_approve")
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
    APPROVED = "approved"
    REJECTED = "rejected"
    RETURNED = "returned"
    SIGNED = "signed"
    REVIEWED = "reviewed"
    ACKNOWLEDGED = "acknowledged"

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
