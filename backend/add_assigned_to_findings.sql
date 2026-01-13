-- Add assigned_to_id column to audit_findings table
-- This enables flexible finding assignment to any audit team member

-- Add the assigned_to_id column
ALTER TABLE audit_findings 
ADD COLUMN IF NOT EXISTS assigned_to_id UUID;

-- Add foreign key constraint to users table
ALTER TABLE audit_findings 
ADD CONSTRAINT fk_audit_findings_assigned_to 
FOREIGN KEY (assigned_to_id) 
REFERENCES users(id) 
ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_audit_findings_assigned_to 
ON audit_findings(assigned_to_id);

-- Add comment to document the column purpose
COMMENT ON COLUMN audit_findings.assigned_to_id IS 'User ID of the team member assigned to this finding';

