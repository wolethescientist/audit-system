-- SQL Script to add missing tables for dashboard functionality
-- Run this on your production database

-- Create enum types if they don't exist
DO $$ BEGIN
    CREATE TYPE compliancestatus AS ENUM ('not_assessed', 'compliant', 'non_compliant', 'partially_compliant', 'not_applicable');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE riskcategory AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE capatype AS ENUM ('corrective', 'preventive', 'both');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE capastatus AS ENUM ('open', 'in_progress', 'pending_verification', 'closed', 'overdue');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE assetstatus AS ENUM ('active', 'inactive', 'disposed', 'under_maintenance');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create iso_frameworks table
CREATE TABLE IF NOT EXISTS iso_frameworks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR NOT NULL UNIQUE,
    version VARCHAR NOT NULL,
    description TEXT,
    clauses JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create assets table
CREATE TABLE IF NOT EXISTS assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    status assetstatus DEFAULT 'active',
    disposal_date TIMESTAMP,
    disposal_value NUMERIC(15, 2),
    disposal_method VARCHAR,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit_checklists table
CREATE TABLE IF NOT EXISTS audit_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id),
    framework_id UUID NOT NULL REFERENCES iso_frameworks(id),
    clause_reference VARCHAR NOT NULL,
    clause_title VARCHAR NOT NULL,
    description TEXT,
    compliance_status compliancestatus DEFAULT 'not_assessed',
    compliance_score INTEGER DEFAULT 0,
    notes TEXT,
    next_due_date TIMESTAMP,
    assessed_by_id UUID REFERENCES users(id),
    assessed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create checklist_evidence table
CREATE TABLE IF NOT EXISTS checklist_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    checklist_id UUID NOT NULL REFERENCES audit_checklists(id),
    file_name VARCHAR NOT NULL,
    file_url VARCHAR NOT NULL,
    file_hash VARCHAR NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR,
    description TEXT,
    uploaded_by_id UUID REFERENCES users(id),
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create risk_assessments table
CREATE TABLE IF NOT EXISTS risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID REFERENCES audits(id),
    asset_id UUID REFERENCES assets(id),
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create risk_controls table
CREATE TABLE IF NOT EXISTS risk_controls (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create capa_items table
CREATE TABLE IF NOT EXISTS capa_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    capa_number VARCHAR UNIQUE NOT NULL,
    audit_id UUID REFERENCES audits(id),
    finding_id UUID REFERENCES audit_findings(id),
    risk_id UUID REFERENCES risk_assessments(id),
    capa_type capatype NOT NULL,
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
    status capastatus DEFAULT 'open',
    progress_percentage INTEGER DEFAULT 0,
    verification_method VARCHAR,
    verification_evidence TEXT,
    effectiveness_review_date TIMESTAMP,
    effectiveness_confirmed BOOLEAN DEFAULT FALSE,
    effectiveness_notes TEXT,
    priority VARCHAR DEFAULT 'medium',
    estimated_cost NUMERIC(15, 2),
    actual_cost NUMERIC(15, 2),
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create asset_assignments table
CREATE TABLE IF NOT EXISTS asset_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    asset_id UUID NOT NULL REFERENCES assets(id),
    user_id UUID NOT NULL REFERENCES users(id),
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

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_checklists_audit_id ON audit_checklists(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_checklists_framework_id ON audit_checklists(framework_id);
CREATE INDEX IF NOT EXISTS idx_audit_checklists_compliance_status ON audit_checklists(compliance_status);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_status ON risk_assessments(status);
CREATE INDEX IF NOT EXISTS idx_risk_assessments_risk_category ON risk_assessments(risk_category);
CREATE INDEX IF NOT EXISTS idx_capa_items_status ON capa_items(status);
CREATE INDEX IF NOT EXISTS idx_capa_items_due_date ON capa_items(due_date);

-- Insert some default ISO frameworks
INSERT INTO iso_frameworks (name, version, description, is_active) VALUES
    ('ISO 27001', '2022', 'Information Security Management System', TRUE),
    ('ISO 9001', '2015', 'Quality Management System', TRUE),
    ('ISO 14001', '2015', 'Environmental Management System', TRUE),
    ('ISO 45001', '2018', 'Occupational Health and Safety Management System', TRUE),
    ('ISO 22301', '2019', 'Business Continuity Management System', TRUE)
ON CONFLICT (name) DO NOTHING;

-- Verify tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('iso_frameworks', 'audit_checklists', 'checklist_evidence', 
                   'risk_assessments', 'risk_controls', 'capa_items', 'assets', 'asset_assignments');
