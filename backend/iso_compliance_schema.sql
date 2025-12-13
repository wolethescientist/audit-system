-- ISO Compliance Database Schema Extension
-- This script adds all new tables for ISO compliance features
-- Run this script directly in your PostgreSQL database

-- Create new enum types
CREATE TYPE compliance_status AS ENUM ('not_assessed', 'compliant', 'partially_compliant', 'non_compliant', 'not_applicable');
CREATE TYPE risk_category AS ENUM ('low', 'medium', 'high', 'critical');
CREATE TYPE capa_type AS ENUM ('corrective', 'preventive', 'both');
CREATE TYPE capa_status AS ENUM ('open', 'in_progress', 'pending_verification', 'closed', 'overdue');
CREATE TYPE document_status AS ENUM ('draft', 'under_review', 'approved', 'active', 'expired', 'archived');
CREATE TYPE asset_status AS ENUM ('active', 'inactive', 'disposed', 'under_maintenance');
CREATE TYPE vendor_risk_rating AS ENUM ('low', 'medium', 'high', 'critical');

-- ISO Frameworks Table
CREATE TABLE iso_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    version VARCHAR NOT NULL,
    description TEXT,
    clauses JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Audit Checklists Table
CREATE TABLE audit_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    framework_id UUID NOT NULL REFERENCES iso_frameworks(id) ON DELETE RESTRICT,
    clause_reference VARCHAR NOT NULL,
    clause_title VARCHAR NOT NULL,
    description TEXT,
    compliance_status compliance_status DEFAULT 'not_assessed',
    compliance_score INTEGER DEFAULT 0 CHECK (compliance_score >= 0 AND compliance_score <= 100),
    notes TEXT,
    next_due_date TIMESTAMP,
    assessed_by_id UUID REFERENCES users(id),
    assessed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Checklist Evidence Table
CREATE TABLE checklist_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES audit_checklists(id) ON DELETE CASCADE,
    file_name VARCHAR NOT NULL,
    file_url VARCHAR NOT NULL,
    file_hash VARCHAR NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR,
    description TEXT,
    uploaded_by_id UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assets Table
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_name VARCHAR NOT NULL,
    asset_category VARCHAR NOT NULL,
    asset_type VARCHAR,
    asset_value NUMERIC(15,2),
    criticality_level VARCHAR,
    procurement_date TIMESTAMP,
    warranty_expiry TIMESTAMP,
    owner_id UUID REFERENCES users(id),
    custodian_id UUID REFERENCES users(id),
    department_id UUID REFERENCES departments(id),
    location VARCHAR,
    serial_number VARCHAR,
    model VARCHAR,
    vendor VARCHAR,
    status asset_status DEFAULT 'active',
    disposal_date TIMESTAMP,
    disposal_value NUMERIC(15,2),
    disposal_method VARCHAR,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk Assessments Table
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES audits(id) ON DELETE SET NULL,
    asset_id UUID REFERENCES assets(id) ON DELETE SET NULL,
    risk_title VARCHAR NOT NULL,
    description TEXT,
    likelihood_score INTEGER NOT NULL CHECK (likelihood_score >= 1 AND likelihood_score <= 5),
    impact_score INTEGER NOT NULL CHECK (impact_score >= 1 AND impact_score <= 5),
    risk_rating INTEGER NOT NULL,
    risk_category risk_category NOT NULL,
    threat_source VARCHAR,
    vulnerability TEXT,
    existing_controls TEXT,
    mitigation_plan TEXT,
    residual_risk_score INTEGER,
    risk_owner_id UUID REFERENCES users(id),
    next_review_date TIMESTAMP,
    status VARCHAR DEFAULT 'active',
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Risk Controls Table
CREATE TABLE risk_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    risk_id UUID NOT NULL REFERENCES risk_assessments(id) ON DELETE CASCADE,
    control_reference VARCHAR NOT NULL,
    control_title VARCHAR NOT NULL,
    control_description TEXT,
    control_type VARCHAR,
    implementation_status VARCHAR DEFAULT 'planned',
    effectiveness_rating INTEGER CHECK (effectiveness_rating >= 1 AND effectiveness_rating <= 5),
    implementation_date TIMESTAMP,
    responsible_person_id UUID REFERENCES users(id),
    evidence_url VARCHAR,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Asset Assignments Table
CREATE TABLE asset_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assigned_by_id UUID REFERENCES users(id),
    assigned_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expected_return_date TIMESTAMP,
    returned_date TIMESTAMP,
    assignment_purpose VARCHAR,
    assignment_notes TEXT,
    return_condition VARCHAR,
    return_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- CAPA Items Table
CREATE TABLE capa_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capa_number VARCHAR UNIQUE NOT NULL,
    audit_id UUID REFERENCES audits(id) ON DELETE SET NULL,
    finding_id UUID REFERENCES audit_findings(id) ON DELETE SET NULL,
    risk_id UUID REFERENCES risk_assessments(id) ON DELETE SET NULL,
    capa_type capa_type NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,
    root_cause_analysis TEXT,
    root_cause_method VARCHAR,
    immediate_action TEXT,
    corrective_action TEXT,
    preventive_action TEXT,
    assigned_to_id UUID REFERENCES users(id),
    responsible_department_id UUID REFERENCES departments(id),
    due_date TIMESTAMP,
    target_completion_date TIMESTAMP,
    actual_completion_date TIMESTAMP,
    status capa_status DEFAULT 'open',
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    verification_method VARCHAR,
    verification_evidence TEXT,
    effectiveness_review_date TIMESTAMP,
    effectiveness_confirmed BOOLEAN DEFAULT FALSE,
    effectiveness_notes TEXT,
    priority VARCHAR DEFAULT 'medium',
    estimated_cost NUMERIC(15,2),
    actual_cost NUMERIC(15,2),
    created_by_id UUID REFERENCES users(id),
    approved_by_id UUID REFERENCES users(id),
    closed_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Repository Table
CREATE TABLE document_repository (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_number VARCHAR UNIQUE NOT NULL,
    document_name VARCHAR NOT NULL,
    document_type VARCHAR NOT NULL,
    category VARCHAR,
    version VARCHAR NOT NULL DEFAULT '1.0',
    file_url VARCHAR NOT NULL,
    file_name VARCHAR NOT NULL,
    file_hash VARCHAR NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR,
    approval_status document_status DEFAULT 'draft',
    effective_date TIMESTAMP,
    expiry_date TIMESTAMP,
    review_frequency_months INTEGER,
    next_review_date TIMESTAMP,
    uploaded_by_id UUID REFERENCES users(id),
    reviewed_by_id UUID REFERENCES users(id),
    approved_by_id UUID REFERENCES users(id),
    change_history JSONB,
    supersedes_document_id UUID REFERENCES document_repository(id),
    confidentiality_level VARCHAR DEFAULT 'internal',
    access_roles JSONB,
    description TEXT,
    keywords VARCHAR,
    department_id UUID REFERENCES departments(id),
    is_controlled BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Document Tags Table
CREATE TABLE document_tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES document_repository(id) ON DELETE CASCADE,
    tag_name VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendors Table
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_code VARCHAR UNIQUE NOT NULL,
    vendor_name VARCHAR NOT NULL,
    vendor_type VARCHAR,
    primary_contact_name VARCHAR,
    primary_contact_email VARCHAR,
    primary_contact_phone VARCHAR,
    secondary_contact_name VARCHAR,
    secondary_contact_email VARCHAR,
    secondary_contact_phone VARCHAR,
    address_line1 VARCHAR,
    address_line2 VARCHAR,
    city VARCHAR,
    state_province VARCHAR,
    postal_code VARCHAR,
    country VARCHAR,
    business_registration_number VARCHAR,
    tax_identification_number VARCHAR,
    website VARCHAR,
    industry VARCHAR,
    risk_rating vendor_risk_rating DEFAULT 'medium',
    risk_assessment_date TIMESTAMP,
    risk_notes TEXT,
    status VARCHAR DEFAULT 'active',
    onboarding_date TIMESTAMP,
    contract_start_date TIMESTAMP,
    contract_end_date TIMESTAMP,
    iso_certifications JSONB,
    other_certifications JSONB,
    insurance_coverage NUMERIC(15,2),
    insurance_expiry TIMESTAMP,
    performance_rating INTEGER CHECK (performance_rating >= 1 AND performance_rating <= 5),
    last_evaluation_date TIMESTAMP,
    notes TEXT,
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor Evaluations Table
CREATE TABLE vendor_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    evaluation_type VARCHAR NOT NULL,
    evaluation_period_start TIMESTAMP,
    evaluation_period_end TIMESTAMP,
    questionnaire_data JSONB,
    evaluation_criteria JSONB,
    overall_score INTEGER,
    evaluation_result VARCHAR,
    quality_score INTEGER,
    delivery_score INTEGER,
    cost_score INTEGER,
    service_score INTEGER,
    compliance_score INTEGER,
    strengths TEXT,
    weaknesses TEXT,
    recommendations TEXT,
    action_items JSONB,
    evaluated_by_id UUID REFERENCES users(id),
    reviewed_by_id UUID REFERENCES users(id),
    approved_by_id UUID REFERENCES users(id),
    evaluation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    next_evaluation_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Vendor SLAs Table
CREATE TABLE vendor_slas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    sla_name VARCHAR NOT NULL,
    sla_type VARCHAR,
    document_url VARCHAR,
    document_hash VARCHAR,
    service_description TEXT,
    performance_metrics JSONB,
    availability_target NUMERIC(5,2),
    response_time_target INTEGER,
    resolution_time_target INTEGER,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    auto_renewal BOOLEAN DEFAULT FALSE,
    renewal_notice_days INTEGER DEFAULT 30,
    current_performance JSONB,
    last_review_date TIMESTAMP,
    next_review_date TIMESTAMP,
    status VARCHAR DEFAULT 'active',
    compliance_status VARCHAR DEFAULT 'compliant',
    penalty_clauses JSONB,
    notes TEXT,
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System Audit Logs Table
CREATE TABLE system_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    session_id VARCHAR,
    ip_address VARCHAR,
    user_agent VARCHAR,
    action_type VARCHAR NOT NULL,
    resource_type VARCHAR NOT NULL,
    resource_id VARCHAR,
    table_name VARCHAR,
    before_values JSONB,
    after_values JSONB,
    changed_fields JSONB,
    endpoint VARCHAR,
    http_method VARCHAR,
    request_data JSONB,
    response_status INTEGER,
    audit_id UUID REFERENCES audits(id),
    business_context VARCHAR,
    risk_level VARCHAR DEFAULT 'low',
    security_event BOOLEAN DEFAULT FALSE,
    retention_period_years INTEGER DEFAULT 7,
    is_immutable BOOLEAN DEFAULT TRUE,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Gap Analysis Table
CREATE TABLE gap_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    framework_id UUID NOT NULL REFERENCES iso_frameworks(id) ON DELETE RESTRICT,
    audit_id UUID REFERENCES audits(id) ON DELETE SET NULL,
    requirement_clause VARCHAR NOT NULL,
    requirement_title VARCHAR NOT NULL,
    requirement_description TEXT,
    current_state TEXT,
    required_state TEXT,
    gap_description TEXT,
    gap_severity VARCHAR,
    compliance_percentage INTEGER DEFAULT 0 CHECK (compliance_percentage >= 0 AND compliance_percentage <= 100),
    gap_status VARCHAR DEFAULT 'identified',
    remediation_plan TEXT,
    estimated_effort VARCHAR,
    estimated_cost NUMERIC(15,2),
    target_closure_date TIMESTAMP,
    actual_closure_date TIMESTAMP,
    capa_id UUID REFERENCES capa_items(id),
    responsible_person_id UUID REFERENCES users(id),
    department_id UUID REFERENCES departments(id),
    evidence_required TEXT,
    evidence_provided TEXT,
    verification_method VARCHAR,
    verified_by_id UUID REFERENCES users(id),
    verification_date TIMESTAMP,
    priority VARCHAR DEFAULT 'medium',
    notes TEXT,
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Role Matrix Table
CREATE TABLE role_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR NOT NULL UNIQUE,
    role_description TEXT,
    role_category VARCHAR,
    department_id UUID REFERENCES departments(id),
    is_global_role BOOLEAN DEFAULT FALSE,
    system_access_levels JSONB,
    can_create_audits BOOLEAN DEFAULT FALSE,
    can_view_all_audits BOOLEAN DEFAULT FALSE,
    can_view_assigned_audits BOOLEAN DEFAULT TRUE,
    can_edit_audits BOOLEAN DEFAULT FALSE,
    can_delete_audits BOOLEAN DEFAULT FALSE,
    can_approve_reports BOOLEAN DEFAULT FALSE,
    can_manage_users BOOLEAN DEFAULT FALSE,
    can_manage_departments BOOLEAN DEFAULT FALSE,
    can_view_analytics BOOLEAN DEFAULT FALSE,
    can_export_data BOOLEAN DEFAULT FALSE,
    can_create_risks BOOLEAN DEFAULT FALSE,
    can_assess_risks BOOLEAN DEFAULT FALSE,
    can_approve_risk_treatments BOOLEAN DEFAULT FALSE,
    can_create_capa BOOLEAN DEFAULT FALSE,
    can_assign_capa BOOLEAN DEFAULT FALSE,
    can_close_capa BOOLEAN DEFAULT FALSE,
    can_upload_documents BOOLEAN DEFAULT FALSE,
    can_approve_documents BOOLEAN DEFAULT FALSE,
    can_archive_documents BOOLEAN DEFAULT FALSE,
    can_manage_assets BOOLEAN DEFAULT FALSE,
    can_assign_assets BOOLEAN DEFAULT FALSE,
    can_manage_vendors BOOLEAN DEFAULT FALSE,
    can_evaluate_vendors BOOLEAN DEFAULT FALSE,
    data_classification_access JSONB,
    geographic_restrictions JSONB,
    time_restrictions JSONB,
    incompatible_roles JSONB,
    requires_dual_approval BOOLEAN DEFAULT FALSE,
    requires_background_check BOOLEAN DEFAULT FALSE,
    requires_training_certification BOOLEAN DEFAULT FALSE,
    max_access_duration_days INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_by_id UUID REFERENCES users(id),
    approved_by_id UUID REFERENCES users(id),
    last_reviewed_date TIMESTAMP,
    next_review_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User Role Assignments Table
CREATE TABLE user_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES role_matrix(id) ON DELETE CASCADE,
    assigned_by_id UUID REFERENCES users(id),
    assignment_reason TEXT,
    effective_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expiry_date TIMESTAMP,
    is_temporary BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT TRUE,
    approved_by_id UUID REFERENCES users(id),
    approval_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    deactivated_by_id UUID REFERENCES users(id),
    deactivation_date TIMESTAMP,
    deactivation_reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance optimization
CREATE INDEX idx_audit_checklists_audit_id ON audit_checklists(audit_id);
CREATE INDEX idx_audit_checklists_framework_id ON audit_checklists(framework_id);
CREATE INDEX idx_audit_checklists_compliance_status ON audit_checklists(compliance_status);
CREATE INDEX idx_audit_checklists_clause_reference ON audit_checklists(clause_reference);

CREATE INDEX idx_checklist_evidence_checklist_id ON checklist_evidence(checklist_id);
CREATE INDEX idx_checklist_evidence_file_hash ON checklist_evidence(file_hash);

CREATE INDEX idx_risk_assessments_audit_id ON risk_assessments(audit_id);
CREATE INDEX idx_risk_assessments_asset_id ON risk_assessments(asset_id);
CREATE INDEX idx_risk_assessments_risk_category ON risk_assessments(risk_category);
CREATE INDEX idx_risk_assessments_risk_owner_id ON risk_assessments(risk_owner_id);

CREATE INDEX idx_risk_controls_risk_id ON risk_controls(risk_id);
CREATE INDEX idx_risk_controls_control_reference ON risk_controls(control_reference);

CREATE INDEX idx_assets_owner_id ON assets(owner_id);
CREATE INDEX idx_assets_department_id ON assets(department_id);
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_asset_category ON assets(asset_category);

CREATE INDEX idx_asset_assignments_asset_id ON asset_assignments(asset_id);
CREATE INDEX idx_asset_assignments_user_id ON asset_assignments(user_id);
CREATE INDEX idx_asset_assignments_is_active ON asset_assignments(is_active);

CREATE INDEX idx_capa_items_audit_id ON capa_items(audit_id);
CREATE INDEX idx_capa_items_finding_id ON capa_items(finding_id);
CREATE INDEX idx_capa_items_risk_id ON capa_items(risk_id);
CREATE INDEX idx_capa_items_status ON capa_items(status);
CREATE INDEX idx_capa_items_assigned_to_id ON capa_items(assigned_to_id);
CREATE INDEX idx_capa_items_due_date ON capa_items(due_date);
CREATE INDEX idx_capa_items_capa_number ON capa_items(capa_number);

CREATE INDEX idx_document_repository_document_number ON document_repository(document_number);
CREATE INDEX idx_document_repository_document_type ON document_repository(document_type);
CREATE INDEX idx_document_repository_approval_status ON document_repository(approval_status);
CREATE INDEX idx_document_repository_expiry_date ON document_repository(expiry_date);
CREATE INDEX idx_document_repository_department_id ON document_repository(department_id);

CREATE INDEX idx_document_tags_document_id ON document_tags(document_id);
CREATE INDEX idx_document_tags_tag_name ON document_tags(tag_name);

CREATE INDEX idx_vendors_vendor_code ON vendors(vendor_code);
CREATE INDEX idx_vendors_risk_rating ON vendors(risk_rating);
CREATE INDEX idx_vendors_status ON vendors(status);

CREATE INDEX idx_vendor_evaluations_vendor_id ON vendor_evaluations(vendor_id);
CREATE INDEX idx_vendor_evaluations_evaluation_date ON vendor_evaluations(evaluation_date);

CREATE INDEX idx_vendor_slas_vendor_id ON vendor_slas(vendor_id);
CREATE INDEX idx_vendor_slas_status ON vendor_slas(status);

CREATE INDEX idx_system_audit_logs_user_id ON system_audit_logs(user_id);
CREATE INDEX idx_system_audit_logs_action_type ON system_audit_logs(action_type);
CREATE INDEX idx_system_audit_logs_resource_type ON system_audit_logs(resource_type);
CREATE INDEX idx_system_audit_logs_timestamp ON system_audit_logs(timestamp);
CREATE INDEX idx_system_audit_logs_audit_id ON system_audit_logs(audit_id);

CREATE INDEX idx_gap_analysis_framework_id ON gap_analysis(framework_id);
CREATE INDEX idx_gap_analysis_audit_id ON gap_analysis(audit_id);
CREATE INDEX idx_gap_analysis_gap_status ON gap_analysis(gap_status);
CREATE INDEX idx_gap_analysis_responsible_person_id ON gap_analysis(responsible_person_id);

CREATE INDEX idx_role_matrix_role_name ON role_matrix(role_name);
CREATE INDEX idx_role_matrix_department_id ON role_matrix(department_id);
CREATE INDEX idx_role_matrix_is_active ON role_matrix(is_active);

CREATE INDEX idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX idx_user_role_assignments_role_id ON user_role_assignments(role_id);
CREATE INDEX idx_user_role_assignments_is_active ON user_role_assignments(is_active);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_iso_frameworks_updated_at BEFORE UPDATE ON iso_frameworks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_audit_checklists_updated_at BEFORE UPDATE ON audit_checklists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_assessments_updated_at BEFORE UPDATE ON risk_assessments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_risk_controls_updated_at BEFORE UPDATE ON risk_controls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_capa_items_updated_at BEFORE UPDATE ON capa_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_document_repository_updated_at BEFORE UPDATE ON document_repository FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_slas_updated_at BEFORE UPDATE ON vendor_slas FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_gap_analysis_updated_at BEFORE UPDATE ON gap_analysis FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_role_matrix_updated_at BEFORE UPDATE ON role_matrix FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default ISO frameworks
INSERT INTO iso_frameworks (name, version, description, clauses) VALUES
('ISO 27001', '2022', 'Information security management systems', '{
  "clauses": [
    {"number": "4", "title": "Context of the organization"},
    {"number": "5", "title": "Leadership"},
    {"number": "6", "title": "Planning"},
    {"number": "7", "title": "Support"},
    {"number": "8", "title": "Operation"},
    {"number": "9", "title": "Performance evaluation"},
    {"number": "10", "title": "Improvement"}
  ],
  "controls": [
    {"reference": "A.5", "title": "Information security policies"},
    {"reference": "A.6", "title": "Organization of information security"},
    {"reference": "A.7", "title": "Human resource security"},
    {"reference": "A.8", "title": "Asset management"},
    {"reference": "A.9", "title": "Access control"},
    {"reference": "A.10", "title": "Cryptography"},
    {"reference": "A.11", "title": "Physical and environmental security"},
    {"reference": "A.12", "title": "Operations security"},
    {"reference": "A.13", "title": "Communications security"},
    {"reference": "A.14", "title": "System acquisition, development and maintenance"},
    {"reference": "A.15", "title": "Supplier relationships"},
    {"reference": "A.16", "title": "Information security incident management"},
    {"reference": "A.17", "title": "Information security aspects of business continuity management"},
    {"reference": "A.18", "title": "Compliance"}
  ]
}'),
('ISO 9001', '2015', 'Quality management systems', '{
  "clauses": [
    {"number": "4", "title": "Context of the organization"},
    {"number": "5", "title": "Leadership"},
    {"number": "6", "title": "Planning"},
    {"number": "7", "title": "Support"},
    {"number": "8", "title": "Operation"},
    {"number": "9", "title": "Performance evaluation"},
    {"number": "10", "title": "Improvement"}
  ]
}'),
('ISO 22301', '2019', 'Business continuity management systems', '{
  "clauses": [
    {"number": "4", "title": "Context of the organization"},
    {"number": "5", "title": "Leadership"},
    {"number": "6", "title": "Planning"},
    {"number": "7", "title": "Support"},
    {"number": "8", "title": "Operation"},
    {"number": "9", "title": "Performance evaluation"},
    {"number": "10", "title": "Improvement"}
  ]
}'),
('ISO 45001', '2018', 'Occupational health and safety management systems', '{
  "clauses": [
    {"number": "4", "title": "Context of the organization"},
    {"number": "5", "title": "Leadership and worker participation"},
    {"number": "6", "title": "Planning"},
    {"number": "7", "title": "Support"},
    {"number": "8", "title": "Operation"},
    {"number": "9", "title": "Performance evaluation"},
    {"number": "10", "title": "Improvement"}
  ]
}'),
('COBIT 5', '2012', 'Control Objectives for Information and Related Technologies', '{
  "domains": [
    {"code": "EDM", "title": "Evaluate, Direct and Monitor"},
    {"code": "APO", "title": "Align, Plan and Organise"},
    {"code": "BAI", "title": "Build, Acquire and Implement"},
    {"code": "DSS", "title": "Deliver, Service and Support"},
    {"code": "MEA", "title": "Monitor, Evaluate and Assess"}
  ]
}'),
('NIST CSF', '1.1', 'NIST Cybersecurity Framework', '{
  "functions": [
    {"code": "ID", "title": "Identify"},
    {"code": "PR", "title": "Protect"},
    {"code": "DE", "title": "Detect"},
    {"code": "RS", "title": "Respond"},
    {"code": "RC", "title": "Recover"}
  ]
}');

-- Insert default role matrix entries
INSERT INTO role_matrix (role_name, role_description, role_category, is_global_role, can_create_audits, can_view_all_audits, can_edit_audits, can_delete_audits, can_approve_reports, can_manage_users, can_manage_departments, can_view_analytics, can_export_data) VALUES
('System Administrator', 'Full system access and administration', 'system', TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
('Audit Manager', 'Manages audit processes and teams', 'audit', TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, TRUE, TRUE),
('Senior Auditor', 'Conducts audits and reviews findings', 'audit', TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, TRUE),
('Auditor', 'Conducts assigned audits', 'audit', FALSE, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE),
('Risk Manager', 'Manages organizational risks', 'business', TRUE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE, TRUE),
('Compliance Officer', 'Ensures regulatory compliance', 'compliance', TRUE, FALSE, TRUE, FALSE, FALSE, TRUE, FALSE, FALSE, TRUE, TRUE),
('Department Head', 'Manages department operations', 'business', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE, FALSE),
('Viewer', 'Read-only access to assigned content', 'business', FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE);

COMMIT;