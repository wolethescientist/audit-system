-- ============================================================================
-- AUDIT MANAGEMENT SYSTEM - Complete Database Schema
-- Generated from SQLAlchemy models.py
-- Target: PostgreSQL (Supabase)
-- ============================================================================
-- This script creates ALL tables, enums, indexes, and constraints needed
-- for the Audit Management System. Run this on a fresh Supabase project.
-- ============================================================================

-- Enable UUID extension (required for UUID primary keys)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. ENUM TYPES (14 total) - DROP IF EXISTS then CREATE
-- ============================================================================

DROP TYPE IF EXISTS userrole CASCADE;
CREATE TYPE userrole AS ENUM (
    'system_admin',
    'audit_manager',
    'auditor',
    'department_head',
    'department_officer',
    'viewer'
);

DROP TYPE IF EXISTS auditstatus CASCADE;
CREATE TYPE auditstatus AS ENUM (
    'PLANNED',
    'INITIATED',
    'PREPARATION',
    'EXECUTING',
    'REPORTING',
    'FOLLOWUP',
    'CLOSED'
);

DROP TYPE IF EXISTS reportstatus CASCADE;
CREATE TYPE reportstatus AS ENUM (
    'DRAFT',
    'UNDER_REVIEW',
    'APPROVED',
    'REJECTED',
    'PUBLISHED'
);

DROP TYPE IF EXISTS findingseverity CASCADE;
CREATE TYPE findingseverity AS ENUM (
    'CRITICAL',
    'HIGH',
    'MEDIUM',
    'LOW'
);

DROP TYPE IF EXISTS workflowstatus CASCADE;
CREATE TYPE workflowstatus AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'APPROVED',
    'REJECTED',
    'COMPLETED'
);

DROP TYPE IF EXISTS approvalaction CASCADE;
CREATE TYPE approvalaction AS ENUM (
    'APPROVED',
    'REJECTED',
    'RETURNED',
    'SIGNED',
    'REVIEWED',
    'ACKNOWLEDGED'
);

DROP TYPE IF EXISTS compliancestatus CASCADE;
CREATE TYPE compliancestatus AS ENUM (
    'NOT_ASSESSED',
    'COMPLIANT',
    'PARTIALLY_COMPLIANT',
    'NON_COMPLIANT',
    'NOT_APPLICABLE'
);

DROP TYPE IF EXISTS riskcategory CASCADE;
CREATE TYPE riskcategory AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);

DROP TYPE IF EXISTS capatype CASCADE;
CREATE TYPE capatype AS ENUM (
    'CORRECTIVE',
    'PREVENTIVE',
    'BOTH'
);

DROP TYPE IF EXISTS capastatus CASCADE;
CREATE TYPE capastatus AS ENUM (
    'OPEN',
    'IN_PROGRESS',
    'PENDING_VERIFICATION',
    'CLOSED',
    'OVERDUE'
);

DROP TYPE IF EXISTS documentstatus CASCADE;
CREATE TYPE documentstatus AS ENUM (
    'DRAFT',
    'UNDER_REVIEW',
    'APPROVED',
    'ACTIVE',
    'EXPIRED',
    'ARCHIVED'
);

DROP TYPE IF EXISTS assetstatus CASCADE;
CREATE TYPE assetstatus AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'DISPOSED',
    'UNDER_MAINTENANCE'
);

DROP TYPE IF EXISTS vendorriskrating CASCADE;
CREATE TYPE vendorriskrating AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);

-- ============================================================================
-- 2. INDEPENDENT TABLES (no foreign key dependencies)
-- ============================================================================

-- --------------------------------------------------------------------------
-- 2a. departments (self-referencing FK added after creation)
-- --------------------------------------------------------------------------
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL,
    parent_department_id UUID,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Self-referencing foreign key
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_parent
    FOREIGN KEY (parent_department_id) REFERENCES departments(id);

-- --------------------------------------------------------------------------
-- 2b. iso_frameworks
-- --------------------------------------------------------------------------
CREATE TABLE iso_frameworks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR NOT NULL UNIQUE,
    version VARCHAR NOT NULL,
    description TEXT,
    clauses JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 3. USERS TABLE (depends on departments, self-referencing for deleted_by)
-- ============================================================================

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR NOT NULL UNIQUE,
    full_name VARCHAR NOT NULL,
    role userrole NOT NULL,
    department_id UUID REFERENCES departments(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),

    -- Two-Factor Authentication (2FA) fields
    totp_secret VARCHAR(32),
    totp_enabled BOOLEAN DEFAULT FALSE,
    backup_codes TEXT,

    -- Soft delete fields
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP,
    deleted_by_id UUID REFERENCES users(id),
    deletion_reason TEXT
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_deleted ON users(is_deleted);

-- ============================================================================
-- 4. AUDIT PROGRAMME TABLE (depends on users)
-- ============================================================================

CREATE TABLE audit_programmes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    programme_name VARCHAR NOT NULL,
    programme_year INTEGER NOT NULL,

    -- ISO 19011 Clause 5.2 - Programme Objectives
    programme_objectives TEXT NOT NULL,

    -- ISO 19011 Clause 5.3 - Programme Management
    programme_manager_id UUID REFERENCES users(id),

    -- ISO 19011 Clause 5.4 - Risk-based Planning
    risk_assessment_completed BOOLEAN DEFAULT FALSE,
    risk_factors_considered JSONB,

    -- ISO 19011 Clause 5.5 - Programme Implementation
    total_planned_audits INTEGER DEFAULT 0,
    completed_audits INTEGER DEFAULT 0,

    -- Programme Status
    status VARCHAR DEFAULT 'planning',
    start_date TIMESTAMP,
    end_date TIMESTAMP,

    -- Metadata
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 5. AUDITS TABLE (depends on users, departments, audit_programmes)
-- ============================================================================

CREATE TABLE audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR NOT NULL,
    year INTEGER NOT NULL,
    scope TEXT,
    risk_rating VARCHAR,
    status auditstatus DEFAULT 'PLANNED',
    assigned_manager_id UUID REFERENCES users(id),
    created_by_id UUID REFERENCES users(id),
    department_id UUID REFERENCES departments(id),
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),

    -- ISO 19011 Clause 6.2 - Audit Initiation Fields
    audit_objectives TEXT,
    audit_criteria TEXT,
    audit_scope_detailed TEXT,
    audit_methodology TEXT,

    -- ISO 19011 Clause 5 - Audit Programme Integration
    audit_programme_id UUID REFERENCES audit_programmes(id),
    risk_based_selection BOOLEAN DEFAULT FALSE,
    audit_priority VARCHAR DEFAULT 'medium',

    -- ISO 19011 Clause 6.2 - Audit Team Assignment
    lead_auditor_id UUID REFERENCES users(id),
    audit_team_competency_verified BOOLEAN DEFAULT FALSE,

    -- ISO 19011 Clause 6.2 - Auditee Information
    auditee_organization VARCHAR,
    auditee_contact_person_id UUID REFERENCES users(id),
    auditee_location VARCHAR,

    -- ISO 19011 Clause 6.2 - Audit Feasibility
    feasibility_confirmed BOOLEAN DEFAULT FALSE,
    feasibility_notes TEXT,

    -- ISO 19011 Workflow Status Tracking
    initiation_completed BOOLEAN DEFAULT FALSE,
    preparation_completed BOOLEAN DEFAULT FALSE,
    execution_completed BOOLEAN DEFAULT FALSE,
    reporting_completed BOOLEAN DEFAULT FALSE,
    followup_completed BOOLEAN DEFAULT FALSE
);

-- ============================================================================
-- 6. AUDIT SUPPORTING TABLES (depend on audits and users)
-- ============================================================================

-- --------------------------------------------------------------------------
-- 6a. audit_team
-- --------------------------------------------------------------------------
CREATE TABLE audit_team (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id),
    user_id UUID NOT NULL REFERENCES users(id),
    role_in_audit VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 6b. audit_work_program
-- --------------------------------------------------------------------------
CREATE TABLE audit_work_program (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id),
    procedure_name VARCHAR NOT NULL,
    description TEXT,
    status VARCHAR DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 6c. audit_findings
-- --------------------------------------------------------------------------
CREATE TABLE audit_findings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id),
    title VARCHAR NOT NULL,
    severity findingseverity NOT NULL,
    impact TEXT,
    root_cause TEXT,
    recommendation TEXT,
    response_from_auditee TEXT,
    status VARCHAR DEFAULT 'open',
    assigned_to_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 6d. audit_checklists (depends on audits, iso_frameworks)
-- --------------------------------------------------------------------------
CREATE TABLE audit_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id),
    framework_id UUID NOT NULL REFERENCES iso_frameworks(id),
    clause_reference VARCHAR NOT NULL,
    clause_title VARCHAR NOT NULL,
    description TEXT,
    compliance_status compliancestatus DEFAULT 'NOT_ASSESSED',
    compliance_score INTEGER DEFAULT 0,
    notes TEXT,
    next_due_date TIMESTAMP,
    assessed_by_id UUID REFERENCES users(id),
    assessed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 6e. audit_evidence (depends on audits, users, audit_checklists, audit_findings)
-- --------------------------------------------------------------------------
CREATE TABLE audit_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id),
    file_name VARCHAR NOT NULL,
    file_url VARCHAR NOT NULL,
    uploaded_by_id UUID REFERENCES users(id),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW(),

    -- ISO 19011 Clause 6.4 - Enhanced Evidence Fields
    evidence_type VARCHAR DEFAULT 'document',
    file_hash VARCHAR,
    file_size INTEGER,
    mime_type VARCHAR,

    -- Evidence linking and categorization
    linked_checklist_id UUID REFERENCES audit_checklists(id),
    linked_finding_id UUID REFERENCES audit_findings(id),
    evidence_category VARCHAR,

    -- ISO 19011 Clause 6.4.5 - Objective Evidence Requirements
    is_objective_evidence BOOLEAN DEFAULT TRUE,
    evidence_source VARCHAR,
    collection_method VARCHAR,

    -- Timestamp and integrity (ISO 19011 Clause 6.4.6)
    evidence_timestamp TIMESTAMP DEFAULT NOW(),
    chain_of_custody JSONB
);

-- --------------------------------------------------------------------------
-- 6f. audit_queries (self-referencing for threaded replies)
-- --------------------------------------------------------------------------
CREATE TABLE audit_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id),
    from_user_id UUID REFERENCES users(id),
    to_user_id UUID REFERENCES users(id),
    message TEXT NOT NULL,
    parent_query_id UUID REFERENCES audit_queries(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 6g. audit_interview_notes
-- --------------------------------------------------------------------------
CREATE TABLE audit_interview_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id),

    -- Interview Details
    interview_title VARCHAR NOT NULL,
    interviewee_id UUID REFERENCES users(id),
    interviewer_id UUID NOT NULL REFERENCES users(id),

    -- Interview Context
    interview_date TIMESTAMP NOT NULL,
    interview_location VARCHAR,
    interview_duration_minutes INTEGER,

    -- Interview Content
    interview_objective TEXT,
    questions_asked JSONB,
    key_findings TEXT,
    follow_up_actions JSONB,
    interview_method VARCHAR,

    -- Additional fields
    witnesses_present JSONB,
    audio_recording_url VARCHAR,
    transcript_url VARCHAR,
    supporting_documents JSONB,

    -- Approval
    notes_reviewed_by_id UUID REFERENCES users(id),
    notes_approved BOOLEAN DEFAULT FALSE,
    interviewee_confirmation BOOLEAN DEFAULT FALSE,

    -- Metadata
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 6h. audit_reports
-- --------------------------------------------------------------------------
CREATE TABLE audit_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id),
    version INTEGER DEFAULT 1,
    content TEXT,
    status reportstatus DEFAULT 'DRAFT',
    created_by_id UUID REFERENCES users(id),
    comments TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 6i. audit_followup
-- --------------------------------------------------------------------------
CREATE TABLE audit_followup (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id),
    finding_id UUID REFERENCES audit_findings(id),
    assigned_to_id UUID REFERENCES users(id),
    due_date TIMESTAMP,
    status VARCHAR DEFAULT 'pending',
    evidence_url VARCHAR,
    completion_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 6j. audit_preparation_checklists
-- --------------------------------------------------------------------------
CREATE TABLE audit_preparation_checklists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id),

    -- ISO 19011 Clause 6.3 - Preparation Requirements
    checklist_name VARCHAR NOT NULL,
    framework_template VARCHAR,

    -- Checklist Items (JSON structure)
    checklist_items JSONB NOT NULL,

    -- Preparation Status
    total_items INTEGER DEFAULT 0,
    completed_items INTEGER DEFAULT 0,
    completion_percentage INTEGER DEFAULT 0,

    -- Assignment and Tracking
    assigned_to_id UUID REFERENCES users(id),
    due_date TIMESTAMP,
    completed_date TIMESTAMP,

    -- Metadata
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 6k. audit_document_requests
-- --------------------------------------------------------------------------
CREATE TABLE audit_document_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id),

    -- Document Request Details
    document_name VARCHAR NOT NULL,
    document_description TEXT,
    document_type VARCHAR,

    -- Request Information
    requested_from_id UUID REFERENCES users(id),
    requested_by_id UUID REFERENCES users(id),
    request_date TIMESTAMP DEFAULT NOW(),
    due_date TIMESTAMP,

    -- Status Tracking
    status VARCHAR DEFAULT 'requested',
    priority VARCHAR DEFAULT 'medium',

    -- Response Information
    response_date TIMESTAMP,
    response_notes TEXT,
    document_url VARCHAR,

    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 6l. audit_risk_assessments
-- --------------------------------------------------------------------------
CREATE TABLE audit_risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id),

    -- ISO 19011 Clause 6.3 - Pre-audit Risk Assessment
    risk_area VARCHAR NOT NULL,
    risk_description TEXT NOT NULL,

    -- Risk Evaluation
    likelihood INTEGER NOT NULL,
    impact INTEGER NOT NULL,
    risk_score INTEGER NOT NULL,
    risk_level VARCHAR NOT NULL,

    -- Risk Factors
    inherent_risk_factors JSONB,
    control_effectiveness VARCHAR DEFAULT 'unknown',

    -- Audit Focus Areas
    requires_detailed_testing BOOLEAN DEFAULT FALSE,
    sampling_approach VARCHAR,
    recommended_audit_procedures TEXT,

    -- Assessment Details
    assessed_by_id UUID REFERENCES users(id),
    assessment_date TIMESTAMP DEFAULT NOW(),

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 6m. audit_sampling
-- --------------------------------------------------------------------------
CREATE TABLE audit_sampling (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id),

    -- Sampling Design (ISO 19011 Clause 6.4.3)
    sampling_name VARCHAR NOT NULL,
    population_description TEXT NOT NULL,
    population_size INTEGER,
    sample_size INTEGER NOT NULL,

    -- Sampling Method
    sampling_method VARCHAR NOT NULL,
    sampling_rationale TEXT,
    confidence_level INTEGER DEFAULT 95,
    margin_of_error INTEGER DEFAULT 5,

    -- Sampling Criteria
    selection_criteria JSONB,
    stratification JSONB,

    -- Sample Items
    sample_items JSONB NOT NULL,

    -- Execution Status
    samples_tested INTEGER DEFAULT 0,
    samples_passed INTEGER DEFAULT 0,
    samples_failed INTEGER DEFAULT 0,
    completion_percentage INTEGER DEFAULT 0,

    -- Results and Analysis
    sampling_results JSONB,
    error_rate NUMERIC(5, 2),
    projection_to_population TEXT,

    -- ISO 19011 Requirements
    sampling_risk_assessment TEXT,
    limitations TEXT,

    -- Assignment and Tracking
    assigned_to_id UUID REFERENCES users(id),
    due_date TIMESTAMP,
    completed_date TIMESTAMP,

    -- Metadata
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 6n. audit_observations
-- --------------------------------------------------------------------------
CREATE TABLE audit_observations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID NOT NULL REFERENCES audits(id),

    -- Observation Details
    observation_title VARCHAR NOT NULL,
    observation_area VARCHAR NOT NULL,
    observation_date TIMESTAMP NOT NULL,
    observation_duration_minutes INTEGER,

    -- Observation Content
    observation_objective TEXT,
    process_observed VARCHAR,
    personnel_observed JSONB,

    -- Findings and Evidence
    observations_made TEXT NOT NULL,
    compliance_status VARCHAR,
    deviations_noted TEXT,

    -- Supporting Evidence
    photos_taken JSONB,
    documents_reviewed JSONB,
    measurements_taken JSONB,

    -- ISO 19011 Clause 6.4.2 - Observation Guidelines
    observer_id UUID REFERENCES users(id),
    observation_method VARCHAR DEFAULT 'direct',
    observation_announced BOOLEAN DEFAULT TRUE,

    -- Follow-up
    requires_follow_up BOOLEAN DEFAULT FALSE,
    follow_up_actions JSONB,

    -- Metadata
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 6o. checklist_evidence
-- --------------------------------------------------------------------------
CREATE TABLE checklist_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    checklist_id UUID NOT NULL REFERENCES audit_checklists(id),
    file_name VARCHAR NOT NULL,
    file_url VARCHAR NOT NULL,
    file_hash VARCHAR NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR,
    description TEXT,
    uploaded_by_id UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 7. WORKFLOW TABLES
-- ============================================================================

-- --------------------------------------------------------------------------
-- 7a. workflows
-- --------------------------------------------------------------------------
CREATE TABLE workflows (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    reference_number VARCHAR NOT NULL UNIQUE,
    audit_id UUID REFERENCES audits(id),
    name VARCHAR NOT NULL,
    description TEXT,
    created_by_id UUID REFERENCES users(id),
    status workflowstatus DEFAULT 'PENDING',
    current_step INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,

    -- Sender information for standalone workflows
    sender_name VARCHAR(255),
    sender_department VARCHAR(255)
);

-- Index for workflow reference number
CREATE INDEX idx_workflows_reference_number ON workflows(reference_number);

-- --------------------------------------------------------------------------
-- 7b. workflow_steps
-- --------------------------------------------------------------------------
CREATE TABLE workflow_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id),
    step_order INTEGER NOT NULL,
    department_id UUID NOT NULL REFERENCES departments(id),
    assigned_to_id UUID REFERENCES users(id),
    action_required VARCHAR DEFAULT 'review_and_approve',
    custom_action_text VARCHAR(500),
    status workflowstatus DEFAULT 'PENDING',
    due_date TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 7c. workflow_approvals
-- --------------------------------------------------------------------------
CREATE TABLE workflow_approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_step_id UUID NOT NULL REFERENCES workflow_steps(id),
    user_id UUID NOT NULL REFERENCES users(id),
    action approvalaction NOT NULL,
    comments TEXT,
    signature_data TEXT,
    ip_address VARCHAR,
    created_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 7d. workflow_documents
-- --------------------------------------------------------------------------
CREATE TABLE workflow_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workflow_id UUID NOT NULL REFERENCES workflows(id),
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(1000) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    uploaded_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 8. ASSET MANAGEMENT TABLES
-- ============================================================================

-- --------------------------------------------------------------------------
-- 8a. assets
-- --------------------------------------------------------------------------
CREATE TABLE assets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_name VARCHAR NOT NULL,
    asset_category VARCHAR NOT NULL,
    asset_type VARCHAR,
    asset_value NUMERIC(15, 2),
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
    status assetstatus DEFAULT 'ACTIVE',
    disposal_date TIMESTAMP,
    disposal_value NUMERIC(15, 2),
    disposal_method VARCHAR,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 8b. asset_assignments
-- --------------------------------------------------------------------------
CREATE TABLE asset_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    user_id UUID NOT NULL REFERENCES users(id),
    assigned_by_id UUID REFERENCES users(id),
    assigned_date TIMESTAMP DEFAULT NOW(),
    expected_return_date TIMESTAMP,
    returned_date TIMESTAMP,
    assignment_purpose VARCHAR,
    assignment_notes TEXT,
    return_condition VARCHAR,
    return_notes TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 9. RISK MANAGEMENT TABLES
-- ============================================================================

-- --------------------------------------------------------------------------
-- 9a. risk_assessments (depends on audits and assets)
-- --------------------------------------------------------------------------
CREATE TABLE risk_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID REFERENCES audits(id),
    asset_id UUID NOT NULL REFERENCES assets(id),
    risk_title VARCHAR NOT NULL,
    description TEXT,
    likelihood_score INTEGER NOT NULL,
    impact_score INTEGER NOT NULL,
    risk_rating INTEGER NOT NULL,
    risk_category riskcategory NOT NULL,
    threat_source VARCHAR,
    vulnerability TEXT,
    existing_controls TEXT,
    mitigation_plan TEXT,
    residual_risk_score INTEGER,
    risk_owner_id UUID REFERENCES users(id),
    next_review_date TIMESTAMP,
    status VARCHAR DEFAULT 'active',
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 9b. risk_controls
-- --------------------------------------------------------------------------
CREATE TABLE risk_controls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    risk_id UUID NOT NULL REFERENCES risk_assessments(id),
    control_reference VARCHAR NOT NULL,
    control_title VARCHAR NOT NULL,
    control_description TEXT,
    control_type VARCHAR,
    implementation_status VARCHAR DEFAULT 'planned',
    effectiveness_rating INTEGER,
    implementation_date TIMESTAMP,
    responsible_person_id UUID REFERENCES users(id),
    evidence_url VARCHAR,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 10. CAPA MANAGEMENT TABLE
-- ============================================================================

CREATE TABLE capa_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    capa_number VARCHAR NOT NULL UNIQUE,
    audit_id UUID REFERENCES audits(id),
    finding_id UUID REFERENCES audit_findings(id),
    risk_id UUID REFERENCES risk_assessments(id),
    capa_type capatype NOT NULL,
    title VARCHAR NOT NULL,
    description TEXT,

    -- Root Cause Analysis (ISO 9001 Clause 10.2.1)
    root_cause_analysis TEXT,
    root_cause_method VARCHAR,

    -- Actions (ISO 9001 Clause 10.2.1)
    immediate_action TEXT,
    corrective_action TEXT,
    preventive_action TEXT,

    -- Assignment and Timeline
    assigned_to_id UUID REFERENCES users(id),
    responsible_department_id UUID REFERENCES departments(id),
    due_date TIMESTAMP,
    target_completion_date TIMESTAMP,
    actual_completion_date TIMESTAMP,

    -- Status and Progress
    status capastatus DEFAULT 'OPEN',
    progress_percentage INTEGER DEFAULT 0,

    -- Verification and Effectiveness (ISO 9001 Clause 10.2.1)
    verification_method VARCHAR,
    verification_evidence TEXT,
    effectiveness_review_date TIMESTAMP,
    effectiveness_confirmed BOOLEAN DEFAULT FALSE,
    effectiveness_notes TEXT,

    -- Metadata
    priority VARCHAR DEFAULT 'medium',
    estimated_cost NUMERIC(15, 2),
    actual_cost NUMERIC(15, 2),
    created_by_id UUID REFERENCES users(id),
    approved_by_id UUID REFERENCES users(id),
    closed_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 11. DOCUMENT CONTROL TABLES
-- ============================================================================

-- --------------------------------------------------------------------------
-- 11a. document_repository (self-referencing for supersedes)
-- --------------------------------------------------------------------------
CREATE TABLE document_repository (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_number VARCHAR NOT NULL UNIQUE,
    document_name VARCHAR NOT NULL,
    document_type VARCHAR NOT NULL,
    category VARCHAR,
    version VARCHAR NOT NULL DEFAULT '1.0',

    -- File Information
    file_url VARCHAR NOT NULL,
    file_name VARCHAR NOT NULL,
    file_hash VARCHAR NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR,

    -- Document Control (ISO 9001 Clause 7.5)
    approval_status documentstatus DEFAULT 'DRAFT',
    effective_date TIMESTAMP,
    expiry_date TIMESTAMP,
    review_frequency_months INTEGER,
    next_review_date TIMESTAMP,

    -- Approval Workflow
    uploaded_by_id UUID REFERENCES users(id),
    reviewed_by_id UUID REFERENCES users(id),
    approved_by_id UUID REFERENCES users(id),

    -- Change Management
    change_history JSONB,
    supersedes_document_id UUID REFERENCES document_repository(id),

    -- Access Control
    confidentiality_level VARCHAR DEFAULT 'internal',
    access_roles JSONB,

    -- Metadata
    description TEXT,
    keywords VARCHAR,
    department_id UUID REFERENCES departments(id),
    is_controlled BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 11b. document_tags
-- --------------------------------------------------------------------------
CREATE TABLE document_tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES document_repository(id),
    tag_name VARCHAR NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 12. VENDOR MANAGEMENT TABLES
-- ============================================================================

-- --------------------------------------------------------------------------
-- 12a. vendors
-- --------------------------------------------------------------------------
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_code VARCHAR NOT NULL UNIQUE,
    vendor_name VARCHAR NOT NULL,
    vendor_type VARCHAR,

    -- Contact Information
    primary_contact_name VARCHAR,
    primary_contact_email VARCHAR,
    primary_contact_phone VARCHAR,
    secondary_contact_name VARCHAR,
    secondary_contact_email VARCHAR,
    secondary_contact_phone VARCHAR,

    -- Address Information
    address_line1 VARCHAR,
    address_line2 VARCHAR,
    city VARCHAR,
    state_province VARCHAR,
    postal_code VARCHAR,
    country VARCHAR,

    -- Business Information
    business_registration_number VARCHAR,
    tax_identification_number VARCHAR,
    website VARCHAR,
    industry VARCHAR,

    -- Risk Assessment
    risk_rating vendorriskrating DEFAULT 'MEDIUM',
    risk_assessment_date TIMESTAMP,
    risk_notes TEXT,

    -- Status and Lifecycle
    status VARCHAR DEFAULT 'active',
    onboarding_date TIMESTAMP,
    contract_start_date TIMESTAMP,
    contract_end_date TIMESTAMP,

    -- Compliance and Certifications
    iso_certifications JSONB,
    other_certifications JSONB,
    insurance_coverage NUMERIC(15, 2),
    insurance_expiry TIMESTAMP,

    -- Performance Metrics
    performance_rating INTEGER,
    last_evaluation_date TIMESTAMP,

    -- Metadata
    notes TEXT,
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 12b. vendor_evaluations
-- --------------------------------------------------------------------------
CREATE TABLE vendor_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    evaluation_type VARCHAR NOT NULL,
    evaluation_period_start TIMESTAMP,
    evaluation_period_end TIMESTAMP,

    -- Questionnaire and Assessment
    questionnaire_data JSONB,
    evaluation_criteria JSONB,
    overall_score INTEGER,
    evaluation_result VARCHAR,

    -- Specific Assessment Areas
    quality_score INTEGER,
    delivery_score INTEGER,
    cost_score INTEGER,
    service_score INTEGER,
    compliance_score INTEGER,

    -- Findings and Recommendations
    strengths TEXT,
    weaknesses TEXT,
    recommendations TEXT,
    action_items JSONB,

    -- Approval and Review
    evaluated_by_id UUID REFERENCES users(id),
    reviewed_by_id UUID REFERENCES users(id),
    approved_by_id UUID REFERENCES users(id),
    evaluation_date TIMESTAMP DEFAULT NOW(),
    next_evaluation_date TIMESTAMP,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 12c. vendor_slas
-- --------------------------------------------------------------------------
CREATE TABLE vendor_slas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vendor_id UUID NOT NULL REFERENCES vendors(id),
    sla_name VARCHAR NOT NULL,
    sla_type VARCHAR,

    -- SLA Document
    document_url VARCHAR,
    document_hash VARCHAR,

    -- SLA Terms
    service_description TEXT,
    performance_metrics JSONB,
    availability_target NUMERIC(5, 2),
    response_time_target INTEGER,
    resolution_time_target INTEGER,

    -- Contract Information
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP,
    auto_renewal BOOLEAN DEFAULT FALSE,
    renewal_notice_days INTEGER DEFAULT 30,

    -- Performance Tracking
    current_performance JSONB,
    last_review_date TIMESTAMP,
    next_review_date TIMESTAMP,

    -- Status and Compliance
    status VARCHAR DEFAULT 'active',
    compliance_status VARCHAR DEFAULT 'compliant',
    penalty_clauses JSONB,

    -- Metadata
    notes TEXT,
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 13. SYSTEM AUDIT LOG TABLE
-- ============================================================================

CREATE TABLE system_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- User and Session Information (ISO 27001 A.12.4.1)
    user_id UUID REFERENCES users(id),
    session_id VARCHAR,
    ip_address VARCHAR,
    user_agent VARCHAR,

    -- Action Information
    action_type VARCHAR NOT NULL,
    resource_type VARCHAR NOT NULL,
    resource_id VARCHAR,
    table_name VARCHAR,

    -- Change Tracking (ISO 27001 A.12.4.1)
    before_values JSONB,
    after_values JSONB,
    changed_fields JSONB,

    -- Request Information
    endpoint VARCHAR,
    http_method VARCHAR,
    request_data JSONB,
    response_status INTEGER,

    -- Audit Context
    audit_id UUID REFERENCES audits(id),
    business_context VARCHAR,

    -- Security Information (ISO 27001 A.12.4.2)
    risk_level VARCHAR DEFAULT 'low',
    security_event BOOLEAN DEFAULT FALSE,

    -- Compliance and Retention
    retention_period_years INTEGER DEFAULT 7,
    is_immutable BOOLEAN DEFAULT TRUE,

    -- Timestamp (ISO 27001 A.12.4.4)
    timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- 14. GAP ANALYSIS TABLE
-- ============================================================================

CREATE TABLE gap_analysis (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Framework and Audit Context
    framework_id UUID NOT NULL REFERENCES iso_frameworks(id),
    audit_id UUID REFERENCES audits(id),

    -- Gap Identification
    requirement_clause VARCHAR NOT NULL,
    requirement_title VARCHAR NOT NULL,
    requirement_description TEXT,

    -- Current vs Required State
    current_state TEXT,
    required_state TEXT,
    gap_description TEXT,

    -- Gap Assessment
    gap_severity VARCHAR,
    compliance_percentage INTEGER DEFAULT 0,
    gap_status VARCHAR DEFAULT 'identified',

    -- Remediation
    remediation_plan TEXT,
    estimated_effort VARCHAR,
    estimated_cost NUMERIC(15, 2),
    target_closure_date TIMESTAMP,
    actual_closure_date TIMESTAMP,

    -- Linking to CAPA
    capa_id UUID REFERENCES capa_items(id),

    -- Assignment and Ownership
    responsible_person_id UUID REFERENCES users(id),
    department_id UUID REFERENCES departments(id),

    -- Evidence and Verification
    evidence_required TEXT,
    evidence_provided TEXT,
    verification_method VARCHAR,
    verified_by_id UUID REFERENCES users(id),
    verification_date TIMESTAMP,

    -- Metadata
    priority VARCHAR DEFAULT 'medium',
    notes TEXT,
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 15. ROLE MATRIX & ACCESS CONTROL TABLES
-- ============================================================================

-- --------------------------------------------------------------------------
-- 15a. role_matrix
-- --------------------------------------------------------------------------
CREATE TABLE role_matrix (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Role Definition
    role_name VARCHAR NOT NULL UNIQUE,
    role_description TEXT,
    role_category VARCHAR,

    -- Department and Organizational Context
    department_id UUID REFERENCES departments(id),
    is_global_role BOOLEAN DEFAULT FALSE,

    -- System Access Levels (ISO 27001 A.9.2.2)
    system_access_levels JSONB,

    -- Audit System Permissions
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

    -- Risk Management Permissions
    can_create_risks BOOLEAN DEFAULT FALSE,
    can_assess_risks BOOLEAN DEFAULT FALSE,
    can_approve_risk_treatments BOOLEAN DEFAULT FALSE,

    -- CAPA Permissions
    can_create_capa BOOLEAN DEFAULT FALSE,
    can_assign_capa BOOLEAN DEFAULT FALSE,
    can_close_capa BOOLEAN DEFAULT FALSE,

    -- Document Control Permissions
    can_upload_documents BOOLEAN DEFAULT FALSE,
    can_approve_documents BOOLEAN DEFAULT FALSE,
    can_archive_documents BOOLEAN DEFAULT FALSE,

    -- Asset Management Permissions
    can_manage_assets BOOLEAN DEFAULT FALSE,
    can_assign_assets BOOLEAN DEFAULT FALSE,

    -- Vendor Management Permissions
    can_manage_vendors BOOLEAN DEFAULT FALSE,
    can_evaluate_vendors BOOLEAN DEFAULT FALSE,

    -- Data Access Restrictions (ISO 27001 A.9.4.1)
    data_classification_access JSONB,
    geographic_restrictions JSONB,
    time_restrictions JSONB,

    -- Segregation of Duties (ISO 27001 A.6.1.2)
    incompatible_roles JSONB,
    requires_dual_approval BOOLEAN DEFAULT FALSE,

    -- Compliance and Audit
    requires_background_check BOOLEAN DEFAULT FALSE,
    requires_training_certification BOOLEAN DEFAULT FALSE,
    max_access_duration_days INTEGER,

    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_by_id UUID REFERENCES users(id),
    approved_by_id UUID REFERENCES users(id),
    last_reviewed_date TIMESTAMP,
    next_review_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- --------------------------------------------------------------------------
-- 15b. user_role_assignments
-- --------------------------------------------------------------------------
CREATE TABLE user_role_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id),
    role_id UUID NOT NULL REFERENCES role_matrix(id),

    -- Assignment Context
    assigned_by_id UUID REFERENCES users(id),
    assignment_reason TEXT,

    -- Temporal Controls
    effective_date TIMESTAMP DEFAULT NOW(),
    expiry_date TIMESTAMP,
    is_temporary BOOLEAN DEFAULT FALSE,

    -- Approval and Compliance
    requires_approval BOOLEAN DEFAULT TRUE,
    approved_by_id UUID REFERENCES users(id),
    approval_date TIMESTAMP,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    deactivated_by_id UUID REFERENCES users(id),
    deactivation_date TIMESTAMP,
    deactivation_reason TEXT,

    -- Metadata
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- 16. ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Audit lookups
CREATE INDEX idx_audits_status ON audits(status);
CREATE INDEX idx_audits_year ON audits(year);
CREATE INDEX idx_audits_department_id ON audits(department_id);
CREATE INDEX idx_audits_created_by_id ON audits(created_by_id);
CREATE INDEX idx_audits_assigned_manager_id ON audits(assigned_manager_id);

-- Finding lookups
CREATE INDEX idx_audit_findings_audit_id ON audit_findings(audit_id);
CREATE INDEX idx_audit_findings_severity ON audit_findings(severity);
CREATE INDEX idx_audit_findings_status ON audit_findings(status);

-- Follow-up lookups
CREATE INDEX idx_audit_followup_audit_id ON audit_followup(audit_id);
CREATE INDEX idx_audit_followup_status ON audit_followup(status);
CREATE INDEX idx_audit_followup_due_date ON audit_followup(due_date);

-- Workflow lookups
CREATE INDEX idx_workflows_status ON workflows(status);
CREATE INDEX idx_workflow_steps_workflow_id ON workflow_steps(workflow_id);
CREATE INDEX idx_workflow_steps_status ON workflow_steps(status);

-- CAPA lookups
CREATE INDEX idx_capa_items_status ON capa_items(status);
CREATE INDEX idx_capa_items_audit_id ON capa_items(audit_id);
CREATE INDEX idx_capa_items_due_date ON capa_items(due_date);

-- Risk lookups
CREATE INDEX idx_risk_assessments_asset_id ON risk_assessments(asset_id);
CREATE INDEX idx_risk_assessments_risk_category ON risk_assessments(risk_category);

-- Document lookups
CREATE INDEX idx_document_repository_approval_status ON document_repository(approval_status);
CREATE INDEX idx_document_repository_department_id ON document_repository(department_id);

-- Vendor lookups
CREATE INDEX idx_vendors_status ON vendors(status);
CREATE INDEX idx_vendors_risk_rating ON vendors(risk_rating);

-- System Audit Log lookups
CREATE INDEX idx_system_audit_logs_user_id ON system_audit_logs(user_id);
CREATE INDEX idx_system_audit_logs_action_type ON system_audit_logs(action_type);
CREATE INDEX idx_system_audit_logs_resource_type ON system_audit_logs(resource_type);
CREATE INDEX idx_system_audit_logs_timestamp ON system_audit_logs(timestamp);
CREATE INDEX idx_system_audit_logs_audit_id ON system_audit_logs(audit_id);

-- Gap Analysis lookups
CREATE INDEX idx_gap_analysis_framework_id ON gap_analysis(framework_id);
CREATE INDEX idx_gap_analysis_gap_status ON gap_analysis(gap_status);

-- Asset lookups
CREATE INDEX idx_assets_status ON assets(status);
CREATE INDEX idx_assets_department_id ON assets(department_id);

-- User Role Assignment lookups
CREATE INDEX idx_user_role_assignments_user_id ON user_role_assignments(user_id);
CREATE INDEX idx_user_role_assignments_role_id ON user_role_assignments(role_id);
CREATE INDEX idx_user_role_assignments_is_active ON user_role_assignments(is_active);

-- ============================================================================
-- SCHEMA CREATION COMPLETE
-- ============================================================================
-- Tables created: 33
-- Enum types created: 14
-- 
-- Tables summary:
--   1.  departments
--   2.  iso_frameworks
--   3.  users
--   4.  audit_programmes
--   5.  audits
--   6.  audit_team
--   7.  audit_work_program
--   8.  audit_findings
--   9.  audit_checklists
--   10. audit_evidence
--   11. audit_queries
--   12. audit_interview_notes
--   13. audit_reports
--   14. audit_followup
--   15. audit_preparation_checklists
--   16. audit_document_requests
--   17. audit_risk_assessments
--   18. audit_sampling
--   19. audit_observations
--   20. checklist_evidence
--   21. workflows
--   22. workflow_steps
--   23. workflow_approvals
--   24. workflow_documents
--   25. assets
--   26. asset_assignments
--   27. risk_assessments
--   28. risk_controls
--   29. capa_items
--   30. document_repository
--   31. document_tags
--   32. vendors
--   33. vendor_evaluations
--   34. vendor_slas
--   35. system_audit_logs
--   36. gap_analysis
--   37. role_matrix
--   38. user_role_assignments
-- ============================================================================