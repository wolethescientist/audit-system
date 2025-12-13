-- ISO 19011 Audit Initiation Migration Script
-- Adds fields required for ISO 19011 Clause 6.2 compliance

-- Create audit_programmes table for ISO 19011 Clause 5
CREATE TABLE IF NOT EXISTS audit_programmes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    programme_name VARCHAR NOT NULL,
    programme_year INTEGER NOT NULL,
    programme_objectives TEXT NOT NULL,
    programme_manager_id UUID REFERENCES users(id),
    risk_assessment_completed BOOLEAN DEFAULT FALSE,
    risk_factors_considered JSONB,
    total_planned_audits INTEGER DEFAULT 0,
    completed_audits INTEGER DEFAULT 0,
    status VARCHAR DEFAULT 'planning',
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add ISO 19011 fields to audits table
ALTER TABLE audits ADD COLUMN IF NOT EXISTS audit_objectives TEXT;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS audit_criteria TEXT;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS audit_scope_detailed TEXT;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS audit_methodology TEXT;

-- Add audit programme integration fields
ALTER TABLE audits ADD COLUMN IF NOT EXISTS audit_programme_id UUID REFERENCES audit_programmes(id);
ALTER TABLE audits ADD COLUMN IF NOT EXISTS risk_based_selection BOOLEAN DEFAULT FALSE;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS audit_priority VARCHAR DEFAULT 'medium';

-- Add audit team assignment fields
ALTER TABLE audits ADD COLUMN IF NOT EXISTS lead_auditor_id UUID REFERENCES users(id);
ALTER TABLE audits ADD COLUMN IF NOT EXISTS audit_team_competency_verified BOOLEAN DEFAULT FALSE;

-- Add auditee information fields
ALTER TABLE audits ADD COLUMN IF NOT EXISTS auditee_organization VARCHAR;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS auditee_contact_person_id UUID REFERENCES users(id);
ALTER TABLE audits ADD COLUMN IF NOT EXISTS auditee_location VARCHAR;

-- Add audit feasibility fields
ALTER TABLE audits ADD COLUMN IF NOT EXISTS feasibility_confirmed BOOLEAN DEFAULT FALSE;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS feasibility_notes TEXT;

-- Add ISO 19011 workflow status tracking fields
ALTER TABLE audits ADD COLUMN IF NOT EXISTS initiation_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS preparation_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS execution_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS reporting_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE audits ADD COLUMN IF NOT EXISTS followup_completed BOOLEAN DEFAULT FALSE;

-- Update audit status enum to include ISO 19011 phases
-- Handle enum type properly for PostgreSQL
DO $$ 
BEGIN
    -- Check if the enum type exists and add new values
    IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'auditstatus') THEN
        -- Add new enum values if they don't exist
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'initiated' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'auditstatus')) THEN
            ALTER TYPE auditstatus ADD VALUE 'initiated';
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'preparation' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'auditstatus')) THEN
            ALTER TYPE auditstatus ADD VALUE 'preparation';
        END IF;
    ELSE
        -- Create the enum type if it doesn't exist
        CREATE TYPE auditstatus AS ENUM ('planned', 'initiated', 'preparation', 'executing', 'reporting', 'followup', 'closed');
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        -- Enum values already exist, continue
        NULL;
    WHEN others THEN
        -- Handle other errors gracefully
        RAISE NOTICE 'Could not modify auditstatus enum: %', SQLERRM;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_audits_programme_id ON audits(audit_programme_id);
CREATE INDEX IF NOT EXISTS idx_audits_lead_auditor_id ON audits(lead_auditor_id);
CREATE INDEX IF NOT EXISTS idx_audits_auditee_contact_id ON audits(auditee_contact_person_id);
CREATE INDEX IF NOT EXISTS idx_audits_initiation_status ON audits(initiation_completed);
CREATE INDEX IF NOT EXISTS idx_audit_programmes_manager ON audit_programmes(programme_manager_id);
CREATE INDEX IF NOT EXISTS idx_audit_programmes_year ON audit_programmes(programme_year);

-- Insert sample audit programme for testing (without manager assignment for now)
INSERT INTO audit_programmes (
    programme_name,
    programme_year,
    programme_objectives,
    risk_assessment_completed,
    status,
    start_date,
    end_date
) VALUES (
    'Annual ISO Compliance Audit Programme 2024',
    2024,
    'Ensure compliance with ISO 27001, ISO 9001, and ISO 22301 standards across all organizational processes and departments.',
    true,
    'active',
    '2024-01-01',
    '2024-12-31'
) ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE audit_programmes IS 'ISO 19011 Clause 5 - Audit programmes for systematic audit planning';
COMMENT ON COLUMN audits.audit_objectives IS 'ISO 19011 Clause 6.2 - Clear, measurable audit objectives';
COMMENT ON COLUMN audits.audit_criteria IS 'ISO 19011 Clause 6.2 - Standards, procedures, and requirements to audit against';
COMMENT ON COLUMN audits.audit_scope_detailed IS 'ISO 19011 Clause 6.2 - Detailed scope including boundaries and exclusions';
COMMENT ON COLUMN audits.audit_methodology IS 'ISO 19011 Clause 6.2 - Audit methods and techniques to be employed';
COMMENT ON COLUMN audits.lead_auditor_id IS 'ISO 19011 Clause 6.2 - Assigned lead auditor with verified competency';
COMMENT ON COLUMN audits.audit_team_competency_verified IS 'ISO 19011 Clause 7.2 - Confirmation of team competency requirements';
COMMENT ON COLUMN audits.initiation_completed IS 'ISO 19011 Clause 6.2 - Audit initiation phase completion status';

-- Create trigger to update updated_at timestamp for audit_programmes
CREATE OR REPLACE FUNCTION update_audit_programmes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_audit_programmes_updated_at
    BEFORE UPDATE ON audit_programmes
    FOR EACH ROW
    EXECUTE FUNCTION update_audit_programmes_updated_at();

-- Verify the migration
SELECT 
    'Migration completed successfully. Added ' || 
    (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'audits' AND column_name LIKE '%audit_%') ||
    ' new audit fields and created audit_programmes table.' as migration_status;