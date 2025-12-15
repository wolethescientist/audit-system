-- Fix capa_status enum to add uppercase values (matching SQLAlchemy enum names)
-- Run this script to add the missing uppercase enum values

-- Add uppercase values to capa_status enum
ALTER TYPE capa_status ADD VALUE IF NOT EXISTS 'OPEN';
ALTER TYPE capa_status ADD VALUE IF NOT EXISTS 'IN_PROGRESS';
ALTER TYPE capa_status ADD VALUE IF NOT EXISTS 'PENDING_VERIFICATION';
ALTER TYPE capa_status ADD VALUE IF NOT EXISTS 'CLOSED';
ALTER TYPE capa_status ADD VALUE IF NOT EXISTS 'OVERDUE';

-- Verify the changes
SELECT 
    t.typname AS enum_name,
    e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'capa_status'
ORDER BY e.enumsortorder;
