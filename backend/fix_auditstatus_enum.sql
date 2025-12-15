-- Fix auditstatus enum - Add ISO 19011 status values
-- Run this script directly on your PostgreSQL database
-- Date: 2025-12-15

-- Add INITIATED status value after PLANNED
ALTER TYPE auditstatus ADD VALUE IF NOT EXISTS 'INITIATED' AFTER 'PLANNED';

-- Add PREPARATION status value after INITIATED  
ALTER TYPE auditstatus ADD VALUE IF NOT EXISTS 'PREPARATION' AFTER 'INITIATED';

-- Verify the enum values (optional - run to confirm)
-- SELECT enumlabel FROM pg_enum WHERE enumtypid = 'auditstatus'::regtype ORDER BY enumsortorder;
