export enum UserRole {
  SYSTEM_ADMIN = 'system_admin',
  AUDIT_MANAGER = 'audit_manager',
  AUDITOR = 'auditor',
  DEPARTMENT_HEAD = 'department_head',
  DEPARTMENT_OFFICER = 'department_officer',
  VIEWER = 'viewer',
}

export enum AuditStatus {
  PLANNED = 'PLANNED',
  INITIATED = 'INITIATED',
  PREPARATION = 'PREPARATION',
  EXECUTING = 'EXECUTING',
  REPORTING = 'REPORTING',
  FOLLOWUP = 'FOLLOWUP',
  CLOSED = 'CLOSED',
}

export enum FindingSeverity {
  CRITICAL = 'CRITICAL',
  HIGH = 'HIGH',
  MEDIUM = 'MEDIUM',
  LOW = 'LOW',
}

export enum ReportStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  PUBLISHED = 'PUBLISHED',
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

// Enhanced Dashboard Types for ISO Compliance
export interface DashboardMetrics {
  // Audit metrics
  total_audits: number;
  planned_audits: number;
  executing_audits: number;
  reporting_audits: number;
  followup_audits: number;
  closed_audits: number;
  
  // Finding metrics
  total_findings: number;
  open_findings: number;
  critical_findings: number;
  high_findings: number;
  medium_findings: number;
  low_findings: number;
  
  // Compliance metrics
  overall_compliance_score: number;
  
  // Risk metrics
  total_risks: number;
  critical_risks: number;
  high_risks: number;
  
  // CAPA metrics
  total_capa: number;
  open_capa: number;
  overdue_capa: number;
  
  // Followup metrics
  overdue_followups: number;
}

export interface RiskHeatmapData {
  likelihood: number;  // 1-5 scale
  impact: number;      // 1-5 scale
  count: number;       // Number of risks at this likelihood/impact combination
  risk_category: string;  // low, medium, high, critical
  risk_rating: number;    // likelihood × impact
}

export interface ComplianceFramework {
  framework_name: string;
  framework_version: string;
  compliance_score: number;
  compliance_percentage: number;
  total_controls: number;
  compliant_controls: number;
  non_compliant_controls: number;
}

export interface ComplianceScores {
  overall_compliance_score: number;
  frameworks: ComplianceFramework[];
}

export interface CAPASummary {
  total_capa: number;
  open_capa: number;
  in_progress_capa: number;
  pending_verification_capa: number;
  closed_capa: number;
  overdue_capa: number;
  due_soon_capa: number;
  corrective_capa: number;
  preventive_capa: number;
  avg_completion_days: number;
  effectiveness_confirmed: number;
  pending_effectiveness_review: number;
}

export enum WorkflowStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  COMPLETED = 'COMPLETED',
}

export enum ApprovalAction {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  RETURNED = 'RETURNED',
  SIGNED = 'SIGNED',
  REVIEWED = 'REVIEWED',
  ACKNOWLEDGED = 'ACKNOWLEDGED',
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
  reference_number: string;
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

// Risk Assessment Types
export enum RiskCategory {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface RiskAssessment {
  id: string;
  audit_id?: string;
  asset_id?: string;
  risk_title: string;
  description?: string;
  likelihood_score: number;
  impact_score: number;
  risk_rating: number;
  risk_category: RiskCategory;
  threat_source?: string;
  vulnerability?: string;
  existing_controls?: string;
  mitigation_plan?: string;
  residual_risk_score?: number;
  risk_owner_id?: string;
  next_review_date?: string;
  status: string;
  created_by_id?: string;
  created_at: string;
  updated_at: string;
}

export interface RiskAssessmentCreate {
  audit_id?: string;
  asset_id?: string;
  risk_title: string;
  description?: string;
  likelihood_score: number;
  impact_score: number;
  threat_source?: string;
  vulnerability?: string;
  existing_controls?: string;
  mitigation_plan?: string;
  risk_owner_id?: string;
  next_review_date?: string;
}

export interface RiskControl {
  id: string;
  risk_id: string;
  control_reference: string;
  control_title: string;
  control_description?: string;
  control_type: string;
  implementation_status: string;
  effectiveness_rating?: number;
  implementation_date?: string;
  responsible_person_id?: string;
  evidence_url?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface RiskControlCreate {
  control_reference: string;
  control_title: string;
  control_description?: string;
  control_type: string;
  implementation_status?: string;
  effectiveness_rating?: number;
  implementation_date?: string;
  responsible_person_id?: string;
  evidence_url?: string;
  notes?: string;
}

export interface RiskMatrixData {
  likelihood: number;
  impact: number;
  count: number;
  risk_category: string;
  risk_rating: number;
  risks: Array<{
    id: string;
    title: string;
    risk_rating: number;
    status: string;
  }>;
}

export interface ControlSuggestion {
  reference: string;
  title: string;
  type: string;
  section: string;
  section_title: string;
  priority: string;
  risk_rating: number;
  applicable_threat?: string;
}

export interface ISO31000Scale {
  name: string;
  description: string;
  probability?: string;
  financial?: string;
}

export interface RiskLinkingRequest {
  asset_ids?: string[];
  finding_ids?: string[];
  capa_ids?: string[];
}

export interface Asset {
  id: string;
  asset_name: string;
  asset_category: string;
  asset_type?: string;
  asset_value?: number;
  criticality_level?: string;
  owner_id?: string;
  department_id?: string;
  status: string;
  created_at: string;
}

// CAPA Management Types
export enum CAPAType {
  CORRECTIVE = 'CORRECTIVE',
  PREVENTIVE = 'PREVENTIVE',
  BOTH = 'BOTH',
}

export enum CAPAStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_VERIFICATION = 'PENDING_VERIFICATION',
  CLOSED = 'CLOSED',
  OVERDUE = 'OVERDUE',
}

export interface CAPAItem {
  id: string;
  capa_number: string;
  title: string;
  description?: string;
  capa_type: CAPAType;
  status: CAPAStatus;
  audit_id?: string;
  finding_id?: string;
  risk_id?: string;
  assigned_to_id?: string;
  responsible_department_id?: string;
  due_date?: string;
  target_completion_date?: string;
  actual_completion_date?: string;
  priority: string;
  progress_percentage: number;
  estimated_cost?: number;
  actual_cost?: number;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface CAPADetail extends CAPAItem {
  immediate_action?: string;
  corrective_action?: string;
  preventive_action?: string;
  root_cause_analysis?: string;
  root_cause_method?: string;
  verification_method?: string;
  verification_evidence?: string;
  effectiveness_review_date?: string;
  effectiveness_confirmed: boolean;
  effectiveness_notes?: string;
  approved_by_id?: string;
  closed_by_id?: string;
}

export interface CAPACreate {
  title: string;
  description?: string;
  capa_type: CAPAType;
  audit_id?: string;
  finding_id?: string;
  risk_id?: string;
  assigned_to_id?: string;
  responsible_department_id?: string;
  due_date?: string;
  target_completion_date?: string;
  priority?: string;
  estimated_cost?: number;
  immediate_action?: string;
  corrective_action?: string;
  preventive_action?: string;
}

export interface CAPAUpdate {
  title?: string;
  description?: string;
  immediate_action?: string;
  corrective_action?: string;
  preventive_action?: string;
  assigned_to_id?: string;
  responsible_department_id?: string;
  due_date?: string;
  target_completion_date?: string;
  priority?: string;
  estimated_cost?: number;
  actual_cost?: number;
  progress_percentage?: number;
  status?: CAPAStatus;
}

export interface RootCauseAnalysisUpdate {
  root_cause_analysis: string;
  root_cause_method: string;
  corrective_action?: string;
  preventive_action?: string;
}

export interface EffectivenessReviewUpdate {
  verification_method: string;
  verification_evidence: string;
  effectiveness_confirmed: boolean;
  effectiveness_notes?: string;
  actual_cost?: number;
}

export interface CAPAOverdue {
  id: string;
  capa_number: string;
  title: string;
  assigned_to_id?: string;
  due_date?: string;
  days_overdue: number;
  priority: string;
  status: CAPAStatus;
}

export interface CAPAProgress {
  capa_id: string;
  capa_number: string;
  status: CAPAStatus;
  progress_percentage: number;
  days_since_creation: number;
  days_until_due?: number;
  is_overdue: boolean;
  has_root_cause_analysis: boolean;
  has_corrective_action: boolean;
  has_preventive_action: boolean;
  effectiveness_confirmed: boolean;
  completion_milestones: {
    root_cause_completed: boolean;
    actions_defined: boolean;
    implementation_started: boolean;
    verification_completed: boolean;
    effectiveness_confirmed: boolean;
  };
}
// Document Control Types
export enum DocumentStatus {
  DRAFT = 'DRAFT',
  UNDER_REVIEW = 'UNDER_REVIEW',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
  EXPIRED = 'EXPIRED',
  ARCHIVED = 'ARCHIVED',
}

export interface Document {
  id: string;
  document_number: string;
  document_name: string;
  document_type: string;
  category?: string;
  version: string;
  file_url: string;
  file_name: string;
  file_size?: number;
  mime_type?: string;
  approval_status: DocumentStatus;
  effective_date?: string;
  expiry_date?: string;
  next_review_date?: string;
  uploaded_by_id: string;
  reviewed_by_id?: string;
  approved_by_id?: string;
  department_id?: string;
  confidentiality_level: string;
  is_controlled: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DocumentDetail extends Document {
  description?: string;
  keywords?: string;
  access_roles?: string[];
  change_history?: Array<{
    action: string;
    user_id: string;
    user_name: string;
    timestamp: string;
    comments?: string;
    version: string;
  }>;
  supersedes_document_id?: string;
  tags?: string[];
}

export interface DocumentUpload {
  document_name: string;
  document_type: string;
  category?: string;
  description?: string;
  keywords?: string;
  department_id?: string;
  confidentiality_level?: string;
  access_roles?: string[];
  review_frequency_months?: number;
  is_controlled?: boolean;
  effective_date?: string;
  expiry_date?: string;
}

export interface DocumentApproval {
  action: 'approve' | 'reject' | 'request_changes';
  comments?: string;
  effective_date?: string;
  expiry_date?: string;
}

export interface DocumentSearchRequest {
  query?: string;
  document_type?: string;
  category?: string;
  department_id?: string;
  approval_status?: DocumentStatus;
  confidentiality_level?: string;
  tags?: string[];
  date_from?: string;
  date_to?: string;
  include_expired?: boolean;
  limit?: number;
  offset?: number;
}

export interface DocumentSearchResponse {
  documents: Document[];
  total_count: number;
  has_more: boolean;
}

export interface DocumentExpiring {
  id: string;
  document_number: string;
  document_name: string;
  document_type: string;
  expiry_date: string;
  days_until_expiry: number;
  next_review_date?: string;
  responsible_person?: string;
  department_name?: string;
}

export interface DocumentTag {
  id: string;
  document_id: string;
  tag_name: string;
  created_at: string;
}

export interface DocumentTagCreate {
  tag_name: string;
}

// Gap Analysis Types
export interface ISOFramework {
  id: string;
  name: string;
  version: string;
  description?: string;
  clauses?: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface GapAnalysis {
  id: string;
  framework_id: string;
  audit_id?: string;
  requirement_clause: string;
  requirement_title: string;
  requirement_description?: string;
  current_state: string;
  required_state: string;
  gap_description: string;
  gap_severity: 'critical' | 'high' | 'medium' | 'low';
  compliance_percentage: number;
  gap_status: 'identified' | 'in_progress' | 'closed' | 'not_applicable';
  remediation_plan?: string;
  estimated_effort?: string;
  estimated_cost?: number;
  target_closure_date?: string;
  actual_closure_date?: string;
  capa_id?: string;
  responsible_person_id?: string;
  department_id?: string;
  evidence_required?: string;
  evidence_provided?: string;
  verification_method?: string;
  verified_by_id?: string;
  verification_date?: string;
  priority: 'critical' | 'high' | 'medium' | 'low';
  notes?: string;
  created_by_id: string;
  created_at: string;
  updated_at: string;
}

export interface GapAnalysisCreate {
  framework_id: string;
  audit_id?: string;
  requirement_clause: string;
  requirement_title: string;
  requirement_description?: string;
  current_state: string;
  required_state: string;
  gap_description: string;
  gap_severity?: 'critical' | 'high' | 'medium' | 'low';
  compliance_percentage?: number;
  remediation_plan?: string;
  estimated_effort?: string;
  estimated_cost?: number;
  target_closure_date?: string;
  responsible_person_id?: string;
  department_id?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
}

export interface GapAnalysisUpdate {
  requirement_title?: string;
  requirement_description?: string;
  current_state?: string;
  required_state?: string;
  gap_description?: string;
  gap_severity?: 'critical' | 'high' | 'medium' | 'low';
  compliance_percentage?: number;
  gap_status?: 'identified' | 'in_progress' | 'closed' | 'not_applicable';
  remediation_plan?: string;
  estimated_effort?: string;
  estimated_cost?: number;
  target_closure_date?: string;
  actual_closure_date?: string;
  responsible_person_id?: string;
  department_id?: string;
  priority?: 'critical' | 'high' | 'medium' | 'low';
  evidence_required?: string;
  evidence_provided?: string;
  verification_method?: string;
  capa_id?: string;
}

export interface FrameworkComparisonRequest {
  primary_framework_id: string;
  comparison_framework_ids: string[];
  include_compliance_data?: boolean;
  department_filter?: string;
}

export interface FrameworkComparisonResponse {
  primary_framework: {
    id: string;
    name: string;
    version: string;
    clauses: Record<string, any>;
    total_clauses: number;
  };
  comparison_frameworks: Array<{
    id: string;
    name: string;
    version: string;
    clauses: Record<string, any>;
    total_clauses: number;
    gap_count: number;
    compliance_score: number;
  }>;
  gap_summary: {
    total_gaps_across_frameworks: number;
    critical_gaps: number;
    frameworks_compared: number;
    comparison_date: string;
  };
  compliance_comparison: Record<string, {
    overall_compliance: number;
    total_requirements: number;
    gaps_identified: number;
    critical_gaps: number;
  }>;
  recommendations: Array<{
    type: string;
    priority: string;
    description: string;
    action: string;
  }>;
}

export interface AutoGapGenerationRequest {
  framework_ids: string[];
  include_audit_findings?: boolean;
  include_checklist_data?: boolean;
  minimum_compliance_threshold?: number;
  severity_filter?: string[];
}

export interface AutoGapGenerationResponse {
  audit_id: string;
  framework_gaps: Array<{
    framework_id: string;
    framework_name: string;
    gaps_identified: Array<{
      clause: string;
      title: string;
      compliance_percentage: number;
      severity: string;
      gap_id: string;
    }>;
    compliance_score: number;
    total_requirements: number;
  }>;
  total_gaps_identified: number;
  critical_gaps: number;
  high_priority_gaps: number;
  estimated_remediation_effort: string;
  recommended_capa_items: Array<{
    gap_id: string;
    clause: string;
    title: string;
    description: string;
    priority: string;
    estimated_effort: string;
  }>;
}

export interface ComplianceReportResponse {
  report_id: string;
  generated_at: string;
  frameworks_analyzed: Array<{
    id: string;
    name: string;
    version: string;
    total_gaps: number;
    critical_gaps: number;
    high_gaps: number;
    average_compliance: number;
  }>;
  overall_compliance_score: number;
  gap_statistics: {
    total_gaps: number;
    critical_gaps: number;
    high_gaps: number;
    medium_gaps: number;
    low_gaps: number;
    open_gaps: number;
    in_progress_gaps: number;
    closed_gaps: number;
  };
  department_breakdown: Array<{
    department_id: string;
    department_name: string;
    total_gaps: number;
    critical_gaps: number;
    average_compliance: number;
  }>;
  trend_analysis: {
    gaps_created_last_30_days: number;
    gaps_closed_last_30_days: number;
    trend_direction: string;
  };
  recommendations: string[];
  export_url?: string;
}

export interface GapCAPALinkingRequest {
  gap_ids: string[];
  capa_id?: string;
  create_new_capa?: boolean;
  capa_details?: {
    title?: string;
    description?: string;
    corrective_action?: string;
    preventive_action?: string;
    assigned_to_id?: string;
    due_date?: string;
    priority?: string;
  };
}