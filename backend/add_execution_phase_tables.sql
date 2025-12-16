-- Add missing ISO 19011 tables for execution phase
-- Run this script on your production database to fix the 500 error on execution page

-- =====================================================
-- 1. ISO Frameworks table (required for audit_checklists)
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'iso_frameworks') THEN
        CREATE TABLE iso_frameworks (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name VARCHAR NOT NULL UNIQUE,
            version VARCHAR NOT NULL,
            description TEXT,
            clauses JSONB,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );
        RAISE NOTICE 'Table iso_frameworks created successfully';
    ELSE
        RAISE NOTICE 'Table iso_frameworks already exists';
    END IF;
END $$;

-- =====================================================
-- 2. Audit Checklists table (ISO 19011 Clause 6.3)
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_checklists') THEN
        CREATE TYPE compliance_status AS ENUM ('NOT_ASSESSED', 'COMPLIANT', 'PARTIALLY_COMPLIANT', 'NON_COMPLIANT', 'NOT_APPLICABLE');
        
        CREATE TABLE audit_checklists (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            audit_id UUID NOT NULL REFERENCES audits(id),
            framework_id UUID NOT NULL REFERENCES iso_frameworks(id),
            clause_reference VARCHAR NOT NULL,
            clause_title VARCHAR NOT NULL,
            description TEXT,
            compliance_status compliance_status DEFAULT 'NOT_ASSESSED',
            compliance_score INTEGER DEFAULT 0,
            notes TEXT,
            next_due_date TIMESTAMP,
            assessed_by_id UUID REFERENCES users(id),
            assessed_at TIMESTAMP,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE INDEX idx_audit_checklists_audit_id ON audit_checklists(audit_id);
        CREATE INDEX idx_audit_checklists_framework_id ON audit_checklists(framework_id);
        CREATE INDEX idx_audit_checklists_compliance_status ON audit_checklists(compliance_status);

        RAISE NOTICE 'Table audit_checklists created successfully';
    ELSE
        RAISE NOTICE 'Table audit_checklists already exists';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN
        RAISE NOTICE 'Type compliance_status already exists';
END $$;

-- =====================================================
-- 3. Audit Interview Notes table (ISO 19011 Clause 6.4.7)
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_interview_notes') THEN
        CREATE TABLE audit_interview_notes (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            audit_id UUID NOT NULL REFERENCES audits(id),
            
            -- Interview Details (ISO 19011 Clause 6.4.7)
            interviewee_name VARCHAR NOT NULL,
            interviewee_position VARCHAR,
            interviewee_department VARCHAR,
            interviewer_id UUID NOT NULL REFERENCES users(id),
            
            -- Interview Context
            interview_date TIMESTAMP NOT NULL,
            interview_location VARCHAR,
            interview_duration_minutes INTEGER,
            
            -- Interview Content (ISO 19011 Clause 6.4.5)
            interview_purpose TEXT,
            questions_asked JSONB,
            responses_received JSONB,
            key_points TEXT,
            
            -- Evidence and Findings Links
            related_checklist_items JSONB,
            related_findings JSONB,
            supporting_evidence JSONB,
            
            -- ISO 19011 Compliance Fields
            objective_evidence_obtained BOOLEAN DEFAULT FALSE NOT NULL,
            follow_up_required BOOLEAN DEFAULT FALSE NOT NULL,
            follow_up_notes TEXT,
            
            -- Verification and Approval
            notes_verified_by_interviewee BOOLEAN DEFAULT FALSE NOT NULL,
            verification_date TIMESTAMP,
            verification_method VARCHAR,
            
            -- Metadata
            created_by_id UUID REFERENCES users(id),
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE INDEX idx_audit_interview_notes_audit_id ON audit_interview_notes(audit_id);
        CREATE INDEX idx_audit_interview_notes_interviewer_id ON audit_interview_notes(interviewer_id);
        CREATE INDEX idx_audit_interview_notes_interview_date ON audit_interview_notes(interview_date);

        RAISE NOTICE 'Table audit_interview_notes created successfully';
    ELSE
        RAISE NOTICE 'Table audit_interview_notes already exists';
    END IF;
END $$;

-- =====================================================
-- 4. Audit Sampling table (ISO 19011 Clause 6.4.3)
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_sampling') THEN
        CREATE TABLE audit_sampling (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE INDEX idx_audit_sampling_audit_id ON audit_sampling(audit_id);
        CREATE INDEX idx_audit_sampling_assigned_to_id ON audit_sampling(assigned_to_id);

        RAISE NOTICE 'Table audit_sampling created successfully';
    ELSE
        RAISE NOTICE 'Table audit_sampling already exists';
    END IF;
END $$;

-- =====================================================
-- 5. Audit Observations table (ISO 19011 Clause 6.4.2)
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_observations') THEN
        CREATE TABLE audit_observations (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE INDEX idx_audit_observations_audit_id ON audit_observations(audit_id);
        CREATE INDEX idx_audit_observations_observer_id ON audit_observations(observer_id);
        CREATE INDEX idx_audit_observations_observation_date ON audit_observations(observation_date);

        RAISE NOTICE 'Table audit_observations created successfully';
    ELSE
        RAISE NOTICE 'Table audit_observations already exists';
    END IF;
END $$;

-- =====================================================
-- Verify tables were created
-- =====================================================
SELECT 'Tables created:' as status;
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('iso_frameworks', 'audit_checklists', 'audit_interview_notes', 'audit_sampling', 'audit_observations');
