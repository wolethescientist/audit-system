-- Add missing columns to audit_evidence table for Supabase Storage integration
-- Run this script to fix the "column does not exist" error

-- Add evidence_category if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='audit_evidence' AND column_name='evidence_category'
    ) THEN
        ALTER TABLE audit_evidence ADD COLUMN evidence_category VARCHAR;
    END IF;
END $$;

-- Add is_objective_evidence if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='audit_evidence' AND column_name='is_objective_evidence'
    ) THEN
        ALTER TABLE audit_evidence ADD COLUMN is_objective_evidence BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Add evidence_source if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='audit_evidence' AND column_name='evidence_source'
    ) THEN
        ALTER TABLE audit_evidence ADD COLUMN evidence_source VARCHAR DEFAULT 'auditee';
    END IF;
END $$;

-- Add collection_method if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='audit_evidence' AND column_name='collection_method'
    ) THEN
        ALTER TABLE audit_evidence ADD COLUMN collection_method VARCHAR DEFAULT 'document_review';
    END IF;
END $$;

-- Add evidence_timestamp if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='audit_evidence' AND column_name='evidence_timestamp'
    ) THEN
        ALTER TABLE audit_evidence ADD COLUMN evidence_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;
END $$;

-- Add chain_of_custody if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name='audit_evidence' AND column_name='chain_of_custody'
    ) THEN
        ALTER TABLE audit_evidence ADD COLUMN chain_of_custody JSONB;
    END IF;
END $$;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'audit_evidence'
ORDER BY ordinal_position;
