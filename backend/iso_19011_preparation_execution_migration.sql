-- ISO 19011 Audit Preparation and Execution Migration Script
-- Adds tables and fields required for ISO 19011 Clause 6.3 and 6.4 compliance

-- Create audit preparation checklists table (ISO 19011 Clause 6.3)
CREATE TABLE IF NOT EXISTS audit_preparation_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    checklist_name VARCHAR NOT NULL,
    framework_template VARCHAR,
    checklist_items JSONB NOT NULL,
    total_items INTEGER DEFAULT 0,
    completed_items INTEGER DEFAULT 0,
    completion_percentage INTEGER DEFAULT 0,
    assigned_to_id UUID REFERENCES users(id),
    due_date TIMESTAMP,
    completed_date TIMESTAMP,
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit document requests table (ISO 19011 Clause 6.3)
CREATE TABLE IF NOT EXISTS audit_document_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    document_name VARCHAR NOT NULL,
    document_description TEXT,
    document_type VARCHAR,
    requested_from_id UUID REFERENCES users(id),
    requested_by_id UUID REFERENCES users(id),
    request_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP,
    status VARCHAR DEFAULT 'requested',
    priority VARCHAR DEFAULT 'medium',
    response_date TIMESTAMP,
    response_notes TEXT,
    document_url VARCHAR,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit risk assessments table (ISO 19011 Clause 6.3)
CREATE TABLE IF NOT EXISTS audit_risk_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    risk_area VARCHAR NOT NULL,
    risk_description TEXT NOT NULL,
    likelihood INTEGER NOT NULL CHECK (likelihood >= 1 AND likelihood <= 5),
    impact INTEGER NOT NULL CHECK (impact >= 1 AND impact <= 5),
    risk_score INTEGER NOT NULL,
    risk_level VARCHAR NOT NULL,
    inherent_risk_factors JSONB,
    control_effectiveness VARCHAR DEFAULT 'unknown',
    requires_detailed_testing BOOLEAN DEFAULT FALSE,
    sampling_approach VARCHAR,
    recommended_audit_procedures TEXT,
    assessed_by_id UUID REFERENCES users(id),
    assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit interview notes table (ISO 19011 Clause 6.4.4)
CREATE TABLE IF NOT EXISTS audit_interview_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    interview_title VARCHAR NOT NULL,
    interviewee_id UUID REFERENCES users(id),
    interviewer_id UUID REFERENCES users(id),
    interview_date TIMESTAMP NOT NULL,
    interview_duration_minutes INTEGER,
    interview_objective TEXT,
    questions_asked JSONB,
    key_findings TEXT,
    follow_up_actions JSONB,
    interview_method VARCHAR DEFAULT 'structured',
    interview_location VARCHAR,
    witnesses_present JSONB,
    audio_recording_url VARCHAR,
    transcript_url VARCHAR,
    supporting_documents JSONB,
    notes_reviewed_by_id UUID REFERENCES users(id),
    notes_approved BOOLEAN DEFAULT FALSE,
    interviewee_confirmation BOOLEAN DEFAULT FALSE,
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit sampling table (ISO 19011 Clause 6.4.3)
CREATE TABLE IF NOT EXISTS audit_sampling (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    sampling_name VARCHAR NOT NULL,
    population_description TEXT NOT NULL,
    population_size INTEGER,
    sample_size INTEGER NOT NULL,
    sampling_method VARCHAR NOT NULL,
    sampling_rationale TEXT,
    confidence_level INTEGER DEFAULT 95,
    margin_of_error INTEGER DEFAULT 5,
    selection_criteria JSONB,
    stratification JSONB,
    sample_items JSONB NOT NULL,
    samples_tested INTEGER DEFAULT 0,
    samples_passed INTEGER DEFAULT 0,
    samples_failed INTEGER DEFAULT 0,
    completion_percentage INTEGER DEFAULT 0,
    sampling_results JSONB,
    error_rate NUMERIC(5, 2),
    projection_to_population TEXT,
    sampling_risk_assessment TEXT,
    limitations TEXT,
    assigned_to_id UUID REFERENCES users(id),
    due_date TIMESTAMP,
    completed_date TIMESTAMP,
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create audit observations table (ISO 19011 Clause 6.4.2)
CREATE TABLE IF NOT EXISTS audit_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_id UUID NOT NULL REFERENCES audits(id) ON DELETE CASCADE,
    observation_title VARCHAR NOT NULL,
    observation_area VARCHAR NOT NULL,
    observation_date TIMESTAMP NOT NULL,
    observation_duration_minutes INTEGER,
    observation_objective TEXT,
    process_observed VARCHAR,
    personnel_observed JSONB,
    observations_made TEXT NOT NULL,
    compliance_status VARCHAR,
    deviations_noted TEXT,
    photos_taken JSONB,
    documents_reviewed JSONB,
    measurements_taken JSONB,
    observer_id UUID REFERENCES users(id),
    observation_method VARCHAR DEFAULT 'direct',
    observation_announced BOOLEAN DEFAULT TRUE,
    requires_follow_up BOOLEAN DEFAULT FALSE,
    follow_up_actions JSONB,
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Enhance existing audit_evidence table with ISO 19011 Clause 6.4 fields
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS evidence_type VARCHAR DEFAULT 'document';
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS file_hash VARCHAR;
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS mime_type VARCHAR;
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS timestamp_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS integrity_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS chain_of_custody JSONB;
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS relevance_score INTEGER DEFAULT 1;
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS reliability_score INTEGER DEFAULT 1;
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS evidence_source VARCHAR;
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS finding_id UUID REFERENCES audit_findings(id);
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS supports_finding BOOLEAN DEFAULT FALSE;
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS tags JSONB;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audit_prep_checklists_audit_id ON audit_preparation_checklists(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_prep_checklists_assigned_to ON audit_preparation_checklists(assigned_to_id);
CREATE INDEX IF NOT EXISTS idx_audit_doc_requests_audit_id ON audit_document_requests(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_doc_requests_status ON audit_document_requests(status);
CREATE INDEX IF NOT EXISTS idx_audit_risk_assessments_audit_id ON audit_risk_assessments(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_risk_assessments_level ON audit_risk_assessments(risk_level);
CREATE INDEX IF NOT EXISTS idx_audit_interview_notes_audit_id ON audit_interview_notes(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_interview_notes_date ON audit_interview_notes(interview_date);
CREATE INDEX IF NOT EXISTS idx_audit_sampling_audit_id ON audit_sampling(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_sampling_method ON audit_sampling(sampling_method);
CREATE INDEX IF NOT EXISTS idx_audit_observations_audit_id ON audit_observations(audit_id);
CREATE INDEX IF NOT EXISTS idx_audit_observations_date ON audit_observations(observation_date);
CREATE INDEX IF NOT EXISTS idx_audit_evidence_type ON audit_evidence(evidence_type);
CREATE INDEX IF NOT EXISTS idx_audit_evidence_source ON audit_evidence(evidence_source);
CREATE INDEX IF NOT EXISTS idx_audit_evidence_finding ON audit_evidence(finding_id);

-- Create triggers to update updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all new tables
CREATE TRIGGER trigger_update_audit_prep_checklists_updated_at
    BEFORE UPDATE ON audit_preparation_checklists
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_audit_doc_requests_updated_at
    BEFORE UPDATE ON audit_document_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_audit_risk_assessments_updated_at
    BEFORE UPDATE ON audit_risk_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_audit_interview_notes_updated_at
    BEFORE UPDATE ON audit_interview_notes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_audit_sampling_updated_at
    BEFORE UPDATE ON audit_sampling
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_update_audit_observations_updated_at
    BEFORE UPDATE ON audit_observations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE audit_preparation_checklists IS 'ISO 19011 Clause 6.3 - Preparation checklists with framework templates';
COMMENT ON TABLE audit_document_requests IS 'ISO 19011 Clause 6.3 - Document requests tracking for auditees';
COMMENT ON TABLE audit_risk_assessments IS 'ISO 19011 Clause 6.3 - Pre-audit risk assessment integration';
COMMENT ON TABLE audit_interview_notes IS 'ISO 19011 Clause 6.4.4 - Structured interview notes with templates';
COMMENT ON TABLE audit_sampling IS 'ISO 19011 Clause 6.4.3 - Audit sampling support per ISO requirements';
COMMENT ON TABLE audit_observations IS 'ISO 19011 Clause 6.4.2 - Systematic observation recording';

COMMENT ON COLUMN audit_evidence.evidence_type IS 'ISO 19011 Clause 6.4 - Type of evidence (document, interview, observation, etc.)';
COMMENT ON COLUMN audit_evidence.file_hash IS 'ISO 19011 Clause 6.4 - SHA-256 hash for integrity checking';
COMMENT ON COLUMN audit_evidence.timestamp_verified IS 'ISO 19011 Clause 6.4 - Timestamp verification for evidence';
COMMENT ON COLUMN audit_evidence.integrity_verified IS 'ISO 19011 Clause 6.4 - Integrity verification status';
COMMENT ON COLUMN audit_evidence.chain_of_custody IS 'ISO 19011 Clause 6.4 - Chain of custody records';

-- Verify the migration
SELECT 
    'Preparation and Execution migration completed successfully. Created ' || 
    (SELECT COUNT(*) FROM information_schema.tables WHERE table_name LIKE 'audit_%' AND table_name NOT IN ('audits', 'audit_team', 'audit_work_program', 'audit_evidence', 'audit_findings', 'audit_queries', 'audit_reports', 'audit_followup')) ||
    ' new tables for ISO 19011 compliance.' as migration_status;