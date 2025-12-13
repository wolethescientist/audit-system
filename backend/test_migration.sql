-- Simple test script to verify database structure before running ISO 19011 migrations

-- Check if users table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
        THEN 'users table exists' 
        ELSE 'users table missing' 
    END as users_status;

-- Check if audits table exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audits') 
        THEN 'audits table exists' 
        ELSE 'audits table missing' 
    END as audits_status;

-- Check existing enum types
SELECT typname, enumlabel 
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE typname IN ('userrole', 'auditstatus')
ORDER BY typname, enumlabel;

-- Check current audit table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'audits'
ORDER BY ordinal_position;