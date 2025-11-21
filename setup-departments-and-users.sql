-- SQL Script to Setup Departments and Assign Users for Workflow Testing
-- This script creates departments and links existing test users to them

-- ============================================
-- 1. CREATE DEPARTMENTS
-- ============================================

-- Internal Audit Department (parent department)
INSERT INTO departments (id, name, parent_department_id, created_at)
VALUES 
    (gen_random_uuid(), 'Internal Audit', NULL, NOW());

-- Business Departments
INSERT INTO departments (id, name, parent_department_id, created_at)
VALUES 
    (gen_random_uuid(), 'Finance Department', NULL, NOW()),
    (gen_random_uuid(), 'Human Resources', NULL, NOW()),
    (gen_random_uuid(), 'Information Technology', NULL, NOW()),
    (gen_random_uuid(), 'Operations', NULL, NOW()),
    (gen_random_uuid(), 'Compliance', NULL, NOW());

-- ============================================
-- 2. ASSIGN USERS TO DEPARTMENTS
-- ============================================

-- Update admin@audit.com -> Internal Audit Department (System Admin)
UPDATE users 
SET department_id = (SELECT id FROM departments WHERE name = 'Internal Audit')
WHERE email = 'admin@audit.com';

-- Update manager@audit.com -> Internal Audit Department (Audit Manager)
UPDATE users 
SET department_id = (SELECT id FROM departments WHERE name = 'Internal Audit')
WHERE email = 'manager@audit.com';

-- Update auditor@audit.com -> Internal Audit Department (Auditor)
UPDATE users 
SET department_id = (SELECT id FROM departments WHERE name = 'Internal Audit')
WHERE email = 'auditor@audit.com';

-- Update finance.head@company.com -> Finance Department (Department Head)
UPDATE users 
SET department_id = (SELECT id FROM departments WHERE name = 'Finance Department')
WHERE email = 'finance.head@company.com';

-- Update hr.head@company.com -> Human Resources (Department Head)
UPDATE users 
SET department_id = (SELECT id FROM departments WHERE name = 'Human Resources')
WHERE email = 'hr.head@company.com';

-- Update it.head@company.com -> Information Technology (Department Head)
UPDATE users 
SET department_id = (SELECT id FROM departments WHERE name = 'Information Technology')
WHERE email = 'it.head@company.com';

-- ============================================
-- 3. VERIFICATION QUERIES
-- ============================================

-- View all departments
SELECT id, name, parent_department_id, created_at 
FROM departments 
ORDER BY name;

-- View users with their departments
SELECT 
    u.email,
    u.full_name,
    u.role,
    d.name as department_name,
    u.is_active
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
ORDER BY d.name, u.email;

-- ============================================
-- 4. SAMPLE WORKFLOW TEST DATA (OPTIONAL)
-- ============================================

-- Create a sample audit for workflow testing
-- Uncomment the following if you want to create test audit data

/*
INSERT INTO audits (id, title, year, scope, risk_rating, status, assigned_manager_id, created_by_id, department_id, start_date, end_date, created_at)
SELECT 
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Finance Department Annual Audit 2025',
    2025,
    'Review of financial controls, budget management, and compliance with financial regulations',
    'High',
    'planned',
    (SELECT id FROM users WHERE email = 'manager@audit.com'),
    (SELECT id FROM users WHERE email = 'admin@audit.com'),
    '22222222-2222-2222-2222-222222222222',
    NOW(),
    NOW() + INTERVAL '30 days',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM audits WHERE id = 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa');

-- Create a workflow for the audit
INSERT INTO workflows (id, audit_id, name, description, created_by_id, status, current_step, created_at)
SELECT 
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    'Finance Audit Approval Workflow',
    'Multi-department approval workflow for Finance audit report',
    (SELECT id FROM users WHERE email = 'manager@audit.com'),
    'pending',
    0,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM workflows WHERE id = 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb');

-- Create workflow steps (moving through different departments)
-- Step 1: Finance Department Head Review
INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, created_at)
SELECT 
    'cccccccc-cccc-cccc-cccc-cccccccccc01',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    1,
    '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM users WHERE email = 'finance.head@company.com'),
    'review_and_approve',
    'pending',
    NOW() + INTERVAL '7 days',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM workflow_steps WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc01');

-- Step 2: HR Department Head Review
INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, created_at)
SELECT 
    'cccccccc-cccc-cccc-cccc-cccccccccc02',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    2,
    '33333333-3333-3333-3333-333333333333',
    (SELECT id FROM users WHERE email = 'hr.head@company.com'),
    'review_and_approve',
    'pending',
    NOW() + INTERVAL '14 days',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM workflow_steps WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc02');

-- Step 3: IT Department Head Review
INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, created_at)
SELECT 
    'cccccccc-cccc-cccc-cccc-cccccccccc03',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    3,
    '44444444-4444-4444-4444-444444444444',
    (SELECT id FROM users WHERE email = 'it.head@company.com'),
    'review_and_approve',
    'pending',
    NOW() + INTERVAL '21 days',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM workflow_steps WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc03');

-- Step 4: Audit Manager Final Sign-off
INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, created_at)
SELECT 
    'cccccccc-cccc-cccc-cccc-cccccccccc04',
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    4,
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM users WHERE email = 'manager@audit.com'),
    'final_sign_off',
    'pending',
    NOW() + INTERVAL '28 days',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM workflow_steps WHERE id = 'cccccccc-cccc-cccc-cccc-cccccccccc04');
*/

-- ============================================
-- SUMMARY
-- ============================================
-- Departments Created:
--   - Internal Audit (admin, manager, auditor)
--   - Finance Department (finance.head)
--   - Human Resources (hr.head)
--   - Information Technology (it.head)
--   - Operations (no users yet)
--   - Compliance (no users yet)
--
-- This setup allows you to:
--   1. Create audits assigned to specific departments
--   2. Create workflows that move between departments
--   3. Test approval chains across different department heads
--   4. Test workflow reassignment and routing
--
-- To run this script:
--   psql -U your_username -d your_database -f setup-departments-and-users.sql
--
-- Or copy and paste into your PostgreSQL client
