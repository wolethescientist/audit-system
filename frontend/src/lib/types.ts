export enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
  AUDIT_MANAGER = 'audit_manager',
  AUDITOR = 'auditor',
  DEPARTMENT_HEAD = 'department_head',
  DEPARTMENT_OFFICER = 'department_officer',
  VIEWER = 'viewer',
}

export enum AuditStatus {
  PLANNED = 'planned',
  EXECUTING = 'executing',
  REPORTING = 'reporting',
  FOLLOWUP = 'followup',
  CLOSED = 'closed',
}

export enum FindingSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
}

export enum ReportStatus {
  DRAFT = 'draft',
  UNDER_REVIEW = 'under_review',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  PUBLISHED = 'published',
}

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  department_id?: string;
  is_active: boolean;
  created_at: string;
}

export interface Department {
  id: string;
  name: string;
  parent_department_id?: string;
  created_at: string;
}

export interface Audit {
  id: string;
  title: string;
  year: number;
  scope?: string;
  risk_rating?: string;
  status: AuditStatus;
  assigned_manager_id?: string;
  created_by_id: string;
  department_id?: string;
  start_date?: string;
  end_date?: string;
  created_at: string;
}

export interface AuditFinding {
  id: string;
  audit_id: string;
  title: string;
  severity: FindingSeverity;
  impact?: string;
  root_cause?: string;
  recommendation?: string;
  response_from_auditee?: string;
  status: string;
  created_at: string;
}

export interface AuditReport {
  id: string;
  audit_id: string;
  version: number;
  content?: string;
  status: ReportStatus;
  created_by_id?: string;
  comments?: string;
  created_at: string;
}

export interface AnalyticsOverview {
  total_audits: number;
  planned_audits: number;
  executing_audits: number;
  completed_audits: number;
  total_findings: number;
  critical_findings: number;
  overdue_followups: number;
}

export enum WorkflowStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  COMPLETED = 'completed',
}

export enum ApprovalAction {
  APPROVED = 'approved',
  REJECTED = 'rejected',
  RETURNED = 'returned',
  SIGNED = 'signed',
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_order: number;
  department_id: string;
  assigned_to_id?: string;
  action_required: string;
  status: WorkflowStatus;
  due_date?: string;
  started_at?: string;
  completed_at?: string;
  created_at: string;
}

export interface Workflow {
  id: string;
  audit_id: string;
  name: string;
  description?: string;
  created_by_id?: string;
  status: WorkflowStatus;
  current_step: number;
  created_at: string;
  completed_at?: string;
  steps?: WorkflowStep[];
}

export interface WorkflowApproval {
  id: string;
  workflow_step_id: string;
  user_id: string;
  action: ApprovalAction;
  comments?: string;
  signature_data?: string;
  ip_address?: string;
  created_at: string;
}

export interface WorkflowStepCreate {
  step_order: number;
  department_id: string;
  assigned_to_id?: string;
  action_required?: string;
  due_date?: string;
}

export interface WorkflowCreate {
  audit_id: string;
  name: string;
  description?: string;
  steps: WorkflowStepCreate[];
}
