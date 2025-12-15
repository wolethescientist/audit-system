-- Complete SQL script to add ALL missing columns to audit_evidence table
-- Run this in Supabase SQL Editor

-- Add linked_checklist_id
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS linked_checklist_id UUID;

-- Add linked_finding_id  
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS linked_finding_id UUID;

-- Add evidence_type
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS evidence_type VARCHAR DEFAULT 'document';

-- Add file_hash
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS file_hash VARCHAR;

-- Add file_size
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Add mime_type
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS mime_type VARCHAR;

-- Add evidence_category
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS evidence_category VARCHAR;

-- Add is_objective_evidence
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS is_objective_evidence BOOLEAN DEFAULT true;

-- Add evidence_source
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS evidence_source VARCHAR DEFAULT 'auditee';

-- Add collection_method
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS collection_method VARCHAR DEFAULT 'document_review';

-- Add evidence_timestamp
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS evidence_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add chain_of_custody
ALTER TABLE audit_evidence ADD COLUMN IF NOT EXISTS chain_of_custody JSONB;

-- Verify all columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'audit_evidence'
ORDER BY ordinal_position;
