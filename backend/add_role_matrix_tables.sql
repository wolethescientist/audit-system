-- Add role_matrix and user_role_assignments tables
-- Run this on your production database to fix the /rbac/role-matrix 500 error

-- Create role_matrix table
CREATE TABLE IF NOT EXISTS role_matrix (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_name VARCHAR NOT NULL UNIQUE,
    role_description TEXT,
    role_category VARCHAR,
    department_id UUID REFERENCES departments(id),
    is_global_role BOOLEAN DEFAULT FALSE,
    system_access_levels JSONB,
    
    -- Audit System Permissions
    can_create_audits BOOLEAN DEFAULT FALSE,
    can_view_all_audits BOOLEAN DEFAULT FALSE,
    can_view_assigned_audits BOOLEAN DEFAULT TRUE,
    can_edit_audits BOOLEAN DEFAULT FALSE,
    can_delete_audits BOOLEAN DEFAULT FALSE,
    can_approve_reports BOOLEAN DEFAULT FALSE,
    can_manage_users BOOLEAN DEFAULT FALSE,
    can_manage_departments BOOLEAN DEFAULT FALSE,
    can_view_analytics BOOLEAN DEFAULT FALSE,
    can_export_data BOOLEAN DEFAULT FALSE,
    
    -- Risk Management Permissions
    can_create_risks BOOLEAN DEFAULT FALSE,
    can_assess_risks BOOLEAN DEFAULT FALSE,
    can_approve_risk_treatments BOOLEAN DEFAULT FALSE,
    
    -- CAPA Permissions
    can_create_capa BOOLEAN DEFAULT FALSE,
    can_assign_capa BOOLEAN DEFAULT FALSE,
    can_close_capa BOOLEAN DEFAULT FALSE,
    
    -- Document Control Permissions
    can_upload_documents BOOLEAN DEFAULT FALSE,
    can_approve_documents BOOLEAN DEFAULT FALSE,
    can_archive_documents BOOLEAN DEFAULT FALSE,
    
    -- Asset Management Permissions
    can_manage_assets BOOLEAN DEFAULT FALSE,
    can_assign_assets BOOLEAN DEFAULT FALSE,
    
    -- Vendor Management Permissions
    can_manage_vendors BOOLEAN DEFAULT FALSE,
    can_evaluate_vendors BOOLEAN DEFAULT FALSE,
    
    -- Data Access Restrictions
    data_classification_access JSONB,
    geographic_restrictions JSONB,
    time_restrictions JSONB,
    
    -- Segregation of Duties
    incompatible_roles JSONB,
    requires_dual_approval BOOLEAN DEFAULT FALSE,
    
    -- Compliance and Audit
    requires_background_check BOOLEAN DEFAULT FALSE,
    requires_training_certification BOOLEAN DEFAULT FALSE,
    max_access_duration_days INTEGER,
    
    -- Metadata
    is_active BOOLEAN DEFAULT TRUE,
    created_by_id UUID REFERENCES users(id),
    approved_by_id UUID REFERENCES users(id),
    last_reviewed_date TIMESTAMP,
    next_review_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create user_role_assignments table
CREATE TABLE IF NOT EXISTS user_role_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    role_id UUID NOT NULL REFERENCES role_matrix(id),
    assigned_by_id UUID REFERENCES users(id),
    assignment_reason TEXT,
    effective_date TIMESTAMP DEFAULT NOW(),
    expiry_date TIMESTAMP,
    is_temporary BOOLEAN DEFAULT FALSE,
    requires_approval BOOLEAN DEFAULT TRUE,
    approved_by_id UUID REFERENCES users(id),
    approval_date TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    deactivated_by_id UUID REFERENCES users(id),
    deactivation_date TIMESTAMP,
    deactivation_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Insert default roles based on UserRole enum
INSERT INTO role_matrix (role_name, role_description, role_category, is_global_role, 
    can_create_audits, can_view_all_audits, can_view_assigned_audits, can_edit_audits, 
    can_delete_audits, can_approve_reports, can_manage_users, can_manage_departments,
    can_view_analytics, can_export_data, can_create_risks, can_assess_risks,
    can_approve_risk_treatments, can_create_capa, can_assign_capa, can_close_capa,
    can_upload_documents, can_approve_documents, can_archive_documents,
    can_manage_assets, can_assign_assets, can_manage_vendors, can_evaluate_vendors)
VALUES 
    ('SYSTEM_ADMIN', 'System Administrator with full access', 'system', TRUE,
     TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE),
    ('AUDIT_MANAGER', 'Audit Manager with audit management capabilities', 'audit', TRUE,
     TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE),
    ('AUDITOR', 'Auditor with assigned audit access', 'audit', TRUE,
     FALSE, FALSE, TRUE, TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, FALSE, TRUE, TRUE, FALSE, TRUE, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE),
    ('DEPARTMENT_HEAD', 'Department Head with department-level access', 'business', FALSE,
     FALSE, FALSE, TRUE, FALSE, FALSE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE, TRUE, TRUE, TRUE, TRUE),
    ('DEPARTMENT_OFFICER', 'Department Officer with limited access', 'business', FALSE,
     FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, TRUE, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE),
    ('VIEWER', 'Read-only viewer access', 'business', TRUE,
     FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, TRUE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE, FALSE)
ON CONFLICT (role_name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_role_matrix_department ON role_matrix(department_id);
CREATE INDEX IF NOT EXISTS idx_role_matrix_active ON role_matrix(is_active);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_user ON user_role_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_role ON user_role_assignments(role_id);
CREATE INDEX IF NOT EXISTS idx_user_role_assignments_active ON user_role_assignments(is_active);
