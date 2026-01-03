-- Add 2FA fields to users table
-- Run this script directly against the database if Alembic migration fails

-- Add totp_secret column for storing TOTP secret key
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_secret VARCHAR(32);

-- Add totp_enabled column to track if 2FA is enabled
ALTER TABLE users ADD COLUMN IF NOT EXISTS totp_enabled BOOLEAN DEFAULT FALSE;

-- Add backup_codes column for storing hashed recovery codes (JSON array)
ALTER TABLE users ADD COLUMN IF NOT EXISTS backup_codes TEXT;

-- Update existing rows to ensure totp_enabled is false
UPDATE users SET totp_enabled = FALSE WHERE totp_enabled IS NULL;

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND column_name IN ('totp_secret', 'totp_enabled', 'backup_codes');
