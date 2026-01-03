-- Workflow Enhancements Migration Script
-- Run this directly on your PostgreSQL database
-- This adds: custom action text, sender fields, and workflow documents table

-- ============================================
-- 1. Add custom_action_text to workflow_steps
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workflow_steps' AND column_name = 'custom_action_text'
    ) THEN
        ALTER TABLE workflow_steps ADD COLUMN custom_action_text VARCHAR(500);
        RAISE NOTICE 'Added custom_action_text column to workflow_steps';
    ELSE
        RAISE NOTICE 'custom_action_text column already exists in workflow_steps';
    END IF;
END $$;

-- ============================================
-- 2. Make audit_id nullable in workflows (for standalone workflows)
-- ============================================
DO $$
BEGIN
    ALTER TABLE workflows ALTER COLUMN audit_id DROP NOT NULL;
    RAISE NOTICE 'Made audit_id nullable in workflows table';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'audit_id is already nullable or column does not exist';
END $$;

-- ============================================
-- 3. Add sender fields to workflows
-- ============================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workflows' AND column_name = 'sender_name'
    ) THEN
        ALTER TABLE workflows ADD COLUMN sender_name VARCHAR(255);
        RAISE NOTICE 'Added sender_name column to workflows';
    ELSE
        RAISE NOTICE 'sender_name column already exists in workflows';
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'workflows' AND column_name = 'sender_department'
    ) THEN
        ALTER TABLE workflows ADD COLUMN sender_department VARCHAR(255);
        RAISE NOTICE 'Added sender_department column to workflows';
    ELSE
        RAISE NOTICE 'sender_department column already exists in workflows';
    END IF;
END $$;

-- ============================================
-- 4. Create workflow_documents table
-- ============================================
CREATE TABLE IF NOT EXISTS workflow_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workflow_id UUID NOT NULL REFERENCES workflows(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(1000) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    description TEXT,
    uploaded_by_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS ix_workflow_documents_workflow_id 
ON workflow_documents(workflow_id);

-- ============================================
-- Verification
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Workflow Enhancements Migration Complete';
    RAISE NOTICE '========================================';
END $$;

-- Show the new columns and table
SELECT 'workflow_steps columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'workflow_steps' AND column_name = 'custom_action_text';

SELECT 'workflows new columns:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'workflows' AND column_name IN ('sender_name', 'sender_department', 'audit_id');

SELECT 'workflow_documents table exists:' as info;
SELECT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'workflow_documents'
) as table_exists;
