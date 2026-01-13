-- Add soft delete fields to users table
-- Requirements: 5.1, 5.2

-- Add soft delete columns
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_by_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_reason TEXT;

-- Create index on is_deleted for performance
CREATE INDEX IF NOT EXISTS ix_users_is_deleted ON users(is_deleted);

-- Create foreign key constraint for deleted_by_id
ALTER TABLE users ADD CONSTRAINT fk_users_deleted_by 
    FOREIGN KEY (deleted_by_id) REFERENCES users(id);

-- Add comment for documentation
COMMENT ON COLUMN users.is_deleted IS 'Soft delete flag - marks user as deleted without removing from database';
COMMENT ON COLUMN users.deleted_at IS 'Timestamp when user was soft deleted';
COMMENT ON COLUMN users.deleted_by_id IS 'ID of admin who performed the soft delete';
COMMENT ON COLUMN users.deletion_reason IS 'Optional reason for user deletion';
