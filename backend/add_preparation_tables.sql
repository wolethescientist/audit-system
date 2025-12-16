-- Migration: Add ISO 19011 Audit Preparation Tables
-- These tables support the preparation phase (Clause 6.3)

-- 1. Audit Preparation Checklists Table
CREATE TABLE IF NOT EXISTS audit_preparation_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    
    -- ISO 19011 Clause 6.3 - Preparation Requirements
    checklist_name VARCHAR(255) NOT NULL,
    framework_template VARCHAR(100),  -- ISO framework used for template
    
    -- Checklist Items (JSON structure)
    checklist_items JSONB NOT NULL DEFAULT '[]',  -- Array of checklist items with status
    
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Audit Document Requests Table
CREATE TABLE IF NOT EXISTS audit_document_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    
    -- Document Request Details
    document_name VARCHAR(255) NOT NULL,
    document_description TEXT,
    document_type VARCHAR(100),  -- policy, procedure, record, evidence, etc.
    
    -- Request Information
    requested_from_id UUID REFERENCES users(id),  -- Auditee
    requested_by_id UUID REFERENCES users(id),    -- Auditor
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    
    -- Status Tracking
    status VARCHAR(50) DEFAULT 'requested',  -- requested, provided, overdue, not_available
    priority VARCHAR(50) DEFAULT 'medium',   -- low, medium, high, critical
    
    -- Response Information
    response_date TIMESTAMP,
    response_notes TEXT,
    document_url VARCHAR(500),  -- URL to provided document
    
    -- Follow-up
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Audit Risk Assessments Table
CREATE TABLE IF NOT EXISTS audit_risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    
    -- ISO 19011 Clause 6.3 - Pre-audit Risk Assessment
    risk_area VARCHAR(255) NOT NULL,  -- Process, department, or area being assessed
    risk_description TEXT NOT NULL,
    
    -- Risk Evaluation
    likelihood INTEGER NOT NULL CHECK (likelihood >= 1 AND likelihood <= 5),  -- 1-5 scale
    impact INTEGER NOT NULL CHECK (impact >= 1 AND impact <= 5),              -- 1-5 scale
    risk_score INTEGER NOT NULL,  -- likelihood × impact
    risk_level VARCHAR(50) NOT NULL,   -- low, medium, high, critical
    
    -- Risk Factors
    inherent_risk_factors JSONB DEFAULT '[]',  -- Array of factors contributing to risk
    control_effectiveness VARCHAR(50) DEFAULT 'unknown',  -- effective, partially_effective, ineffective, unknown
    
    -- Audit Focus Areas
    requires_detailed_testing BOOLEAN DEFAULT FALSE,
    sampling_approach VARCHAR(100),  -- statistical, judgmental, block, systematic
    recommended_audit_procedures TEXT,
    
    -- Assessment Details
    assessed_by_id UUID REFERENCES users(id),
    assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_prep_checklists_audit_id ON audit_preparation_checklists(audit_id);
CREATE INDEX IF NOT EXISTS idx_doc_requests_audit_id ON audit_document_requests(audit_id);
CREATE INDEX IF NOT EXISTS idx_doc_requests_status ON audit_document_requests(status);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_audit_id ON audit_risk_assessments(audit_id);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_risk_level ON audit_risk_assessments(risk_level);

-- Grant permissions (adjust as needed for your setup)
-- GRANT ALL ON audit_preparation_checklists TO your_app_user;
-- GRANT ALL ON audit_document_requests TO your_app_user;
-- GRANT ALL ON audit_risk_assessments TO your_app_user;
