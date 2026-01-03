-- Add 2FA columns to users table
-- Run this script to enable Two-Factor Authentication support

-- Add totp_secret column
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(32);

-- Add totp_enabled column
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;

-- Add backup_codes column
ALTER TABLE users ADD COLUMN IF NOT EXISTS backup_codes TEXT;

-- Verification
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('totp_secret', 'totp_enabled', 'backup_codes');
