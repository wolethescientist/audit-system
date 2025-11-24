-- ============================================
-- COMPREHENSIVE DUMMY DATA FOR AUDIT SYSTEM
-- ============================================
-- This script creates realistic test data for all tables
-- Run after initial setup and user creation

-- ============================================
-- 1. ADDITIONAL DEPARTMENTS
-- ============================================

INSERT INTO departments (id, name, parent_department_id, created_at)
VALUES 
    ('d1111111-1111-1111-1111-111111111111', 'Internal Audit', NULL, NOW()),
    ('d2222222-2222-2222-2222-222222222222', 'Finance Department', NULL, NOW()),
    ('d3333333-3333-3333-3333-333333333333', 'Human Resources', NULL, NOW()),
    ('d4444444-4444-4444-4444-444444444444', 'Information Technology', NULL, NOW()),
    ('d5555555-5555-5555-5555-555555555555', 'Operations', NULL, NOW()),
    ('d6666666-6666-6666-6666-666666666666', 'Compliance', NULL, NOW()),
    ('d7777777-7777-7777-7777-777777777777', 'Procurement', NULL, NOW()),
    ('d8888888-8888-8888-8888-888888888888', 'Legal', NULL, NOW()),
    ('d9999999-9999-9999-9999-999999999999', 'Marketing', NULL, NOW())
ON CONFLICT (id) DO NOTHING;

-- Sub-departments
INSERT INTO departments (id, name, parent_department_id, created_at)
VALUES 
    ('da111111-1111-1111-1111-111111111111', 'Accounts Payable', 'd2222222-2222-2222-2222-222222222222', NOW()),
    ('da222222-2222-2222-2222-222222222222', 'Accounts Receivable', 'd2222222-2222-2222-2222-222222222222', NOW()),
    ('da333333-3333-3333-3333-333333333333', 'Payroll', 'd3333333-3333-3333-3333-333333333333', NOW())
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- 2. ADDITIONAL USERS
-- ============================================

-- More department officers
INSERT INTO users (id, email, full_name, role, department_id, is_active, created_at)
VALUES 
    ('u1111111-1111-1111-1111-111111111111', 'operations.head@company.com', 'Operations Manager', 'department_head', 'd5555555-5555-5555-5555-555555555555', true, NOW()),
    ('u2222222-2222-2222-2222-222222222222', 'compliance.head@company.com', 'Compliance Officer', 'department_head', 'd6666666-6666-6666-6666-666666666666', true, NOW()),
    ('u3333333-3333-3333-3333-333333333333', 'procurement.head@company.com', 'Procurement Manager', 'department_head', 'd7777777-7777-7777-7777-777777777777', true, NOW()),
    ('u4444444-4444-4444-4444-444444444444', 'legal.head@company.com', 'Legal Counsel', 'department_head', 'd8888888-8888-8888-8888-888888888888', true, NOW()),
    ('u5555555-5555-5555-5555-555555555555', 'finance.officer@company.com', 'Finance Officer', 'department_officer', 'd2222222-2222-2222-2222-222222222222', true, NOW()),
    ('u6666666-6666-6666-6666-666666666666', 'hr.officer@company.com', 'HR Officer', 'department_officer', 'd3333333-3333-3333-3333-333333333333', true, NOW()),
    ('u7777777-7777-7777-7777-777777777777', 'it.officer@company.com', 'IT Support', 'department_officer', 'd4444444-4444-4444-4444-444444444444', true, NOW()),
    ('u8888888-8888-8888-8888-888888888888', 'auditor2@audit.com', 'Senior Auditor', 'auditor', 'd1111111-1111-1111-1111-111111111111', true, NOW()),
    ('u9999999-9999-9999-9999-999999999999', 'viewer@company.com', 'External Viewer', 'viewer', NULL, true, NOW())
ON CONFLICT (email) DO NOTHING;


-- ============================================
-- 3. AUDITS (Various Statuses and Types)
-- ============================================

INSERT INTO audits (id, title, year, scope, risk_rating, status, assigned_manager_id, created_by_id, department_id, start_date, end_date, created_at)
VALUES 
    -- Planned Audits
    ('a1111111-1111-1111-1111-111111111111', 'Procurement Process Audit 2025', 2025, 
     'Review procurement policies, vendor selection, contract management, and compliance with regulations', 
     'High', 'planned', 
     (SELECT id FROM users WHERE email = 'manager@audit.com'), 
     (SELECT id FROM users WHERE email = 'admin@audit.com'), 
     'd7777777-7777-7777-7777-777777777777', 
     '2025-02-01', '2025-03-31', NOW()),
    
    ('a2222222-2222-2222-2222-222222222222', 'IT Security Assessment 2025', 2025, 
     'Evaluate cybersecurity controls, data protection measures, and IT infrastructure security', 
     'Critical', 'planned', 
     (SELECT id FROM users WHERE email = 'manager@audit.com'), 
     (SELECT id FROM users WHERE email = 'admin@audit.com'), 
     'd4444444-4444-4444-4444-444444444444', 
     '2025-03-01', '2025-04-30', NOW()),
    
    -- Executing Audits
    ('a3333333-3333-3333-3333-333333333333', 'Financial Controls Audit 2025', 2025, 
     'Assessment of financial reporting, internal controls, budget management, and compliance', 
     'High', 'executing', 
     (SELECT id FROM users WHERE email = 'manager@audit.com'), 
     (SELECT id FROM users WHERE email = 'admin@audit.com'), 
     'd2222222-2222-2222-2222-222222222222', 
     '2025-01-15', '2025-03-15', NOW() - INTERVAL '15 days'),
    
    ('a4444444-4444-4444-4444-444444444444', 'HR Compliance Review 2025', 2025, 
     'Review of recruitment processes, employee records, payroll accuracy, and labor law compliance', 
     'Medium', 'executing', 
     (SELECT id FROM users WHERE email = 'manager@audit.com'), 
     (SELECT id FROM users WHERE email = 'auditor@audit.com'), 
     'd3333333-3333-3333-3333-333333333333', 
     '2025-01-10', '2025-02-28', NOW() - INTERVAL '20 days'),
    
    -- Reporting Stage
    ('a5555555-5555-5555-5555-555555555555', 'Operations Efficiency Audit 2024', 2024, 
     'Evaluation of operational processes, resource utilization, and performance metrics', 
     'Medium', 'reporting', 
     (SELECT id FROM users WHERE email = 'manager@audit.com'), 
     (SELECT id FROM users WHERE email = 'admin@audit.com'), 
     'd5555555-5555-5555-5555-555555555555', 
     '2024-11-01', '2024-12-31', NOW() - INTERVAL '60 days'),
    
    -- Follow-up Stage
    ('a6666666-6666-6666-6666-666666666666', 'Compliance Audit 2024', 2024, 
     'Review of regulatory compliance, policy adherence, and risk management practices', 
     'High', 'followup', 
     (SELECT id FROM users WHERE email = 'manager@audit.com'), 
     (SELECT id FROM users WHERE email = 'admin@audit.com'), 
     'd6666666-6666-6666-6666-666666666666', 
     '2024-09-01', '2024-10-31', NOW() - INTERVAL '90 days'),
    
    -- Closed Audits
    ('a7777777-7777-7777-7777-777777777777', 'Legal Department Audit 2024', 2024, 
     'Assessment of contract management, legal risk exposure, and litigation tracking', 
     'Low', 'closed', 
     (SELECT id FROM users WHERE email = 'manager@audit.com'), 
     (SELECT id FROM users WHERE email = 'admin@audit.com'), 
     'd8888888-8888-8888-8888-888888888888', 
     '2024-08-01', '2024-09-30', NOW() - INTERVAL '120 days'),
    
    ('a8888888-8888-8888-8888-888888888888', 'Marketing Budget Audit 2024', 2024, 
     'Review of marketing expenditures, ROI analysis, and budget compliance', 
     'Low', 'closed', 
     (SELECT id FROM users WHERE email = 'manager@audit.com'), 
     (SELECT id FROM users WHERE email = 'auditor@audit.com'), 
     'd9999999-9999-9999-9999-999999999999', 
     '2024-07-01', '2024-08-31', NOW() - INTERVAL '150 days')
ON CONFLICT (id) DO NOTHING;


-- ============================================
-- 4. AUDIT TEAMS
-- ============================================

INSERT INTO audit_team (id, audit_id, user_id, role_in_audit, created_at)
VALUES 
    -- Financial Controls Audit Team
    (gen_random_uuid(), 'a3333333-3333-3333-3333-333333333333', (SELECT id FROM users WHERE email = 'auditor@audit.com'), 'Lead Auditor', NOW()),
    (gen_random_uuid(), 'a3333333-3333-3333-3333-333333333333', (SELECT id FROM users WHERE email = 'auditor2@audit.com'), 'Team Member', NOW()),
    
    -- HR Compliance Review Team
    (gen_random_uuid(), 'a4444444-4444-4444-4444-444444444444', (SELECT id FROM users WHERE email = 'auditor@audit.com'), 'Lead Auditor', NOW()),
    
    -- Operations Efficiency Audit Team
    (gen_random_uuid(), 'a5555555-5555-5555-5555-555555555555', (SELECT id FROM users WHERE email = 'auditor2@audit.com'), 'Lead Auditor', NOW()),
    (gen_random_uuid(), 'a5555555-5555-5555-5555-555555555555', (SELECT id FROM users WHERE email = 'auditor@audit.com'), 'Reviewer', NOW()),
    
    -- Compliance Audit Team
    (gen_random_uuid(), 'a6666666-6666-6666-6666-666666666666', (SELECT id FROM users WHERE email = 'auditor@audit.com'), 'Lead Auditor', NOW()),
    (gen_random_uuid(), 'a6666666-6666-6666-6666-666666666666', (SELECT id FROM users WHERE email = 'auditor2@audit.com'), 'Team Member', NOW());


-- ============================================
-- 5. AUDIT WORK PROGRAMS
-- ============================================

INSERT INTO audit_work_program (id, audit_id, procedure_name, description, status, created_at)
VALUES 
    -- Financial Controls Audit Work Program
    ('wp111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 
     'Review Financial Policies', 'Examine and evaluate current financial policies and procedures', 'completed', NOW()),
    ('wp222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', 
     'Test Internal Controls', 'Sample testing of key financial controls and authorization processes', 'in_progress', NOW()),
    ('wp333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 
     'Verify Budget Compliance', 'Review budget vs actual spending and variance analysis', 'pending', NOW()),
    ('wp444444-4444-4444-4444-444444444444', 'a3333333-3333-3333-3333-333333333333', 
     'Assess Segregation of Duties', 'Evaluate separation of duties in financial processes', 'pending', NOW()),
    
    -- HR Compliance Review Work Program
    ('wp555555-5555-5555-5555-555555555555', 'a4444444-4444-4444-4444-444444444444', 
     'Review Recruitment Process', 'Examine hiring procedures and documentation', 'completed', NOW()),
    ('wp666666-6666-6666-6666-666666666666', 'a4444444-4444-4444-4444-444444444444', 
     'Test Payroll Accuracy', 'Sample testing of payroll calculations and payments', 'in_progress', NOW()),
    ('wp777777-7777-7777-7777-777777777777', 'a4444444-4444-4444-4444-444444444444', 
     'Verify Employee Records', 'Check completeness and accuracy of personnel files', 'pending', NOW()),
    
    -- Operations Efficiency Audit Work Program
    ('wp888888-8888-8888-8888-888888888888', 'a5555555-5555-5555-5555-555555555555', 
     'Process Mapping', 'Document and analyze key operational processes', 'completed', NOW()),
    ('wp999999-9999-9999-9999-999999999999', 'a5555555-5555-5555-5555-555555555555', 
     'Performance Metrics Review', 'Evaluate KPIs and performance measurement systems', 'completed', NOW());


-- ============================================
-- 6. AUDIT EVIDENCE
-- ============================================

INSERT INTO audit_evidence (id, audit_id, file_name, file_url, uploaded_by_id, description, created_at)
VALUES 
    ('ev111111-1111-1111-1111-111111111111', 'a3333333-3333-3333-3333-333333333333', 
     'Financial_Policy_Manual.pdf', '/evidence/financial_policy_manual.pdf', 
     (SELECT id FROM users WHERE email = 'auditor@audit.com'), 
     'Current financial policies and procedures manual', NOW()),
    
    ('ev222222-2222-2222-2222-222222222222', 'a3333333-3333-3333-3333-333333333333', 
     'Sample_Purchase_Orders.xlsx', '/evidence/sample_purchase_orders.xlsx', 
     (SELECT id FROM users WHERE email = 'auditor@audit.com'), 
     'Sample of 50 purchase orders for testing', NOW()),
    
    ('ev333333-3333-3333-3333-333333333333', 'a3333333-3333-3333-3333-333333333333', 
     'Budget_Report_2025.pdf', '/evidence/budget_report_2025.pdf', 
     (SELECT id FROM users WHERE email = 'auditor2@audit.com'), 
     'Annual budget report with variance analysis', NOW()),
    
    ('ev444444-4444-4444-4444-444444444444', 'a4444444-4444-4444-4444-444444444444', 
     'HR_Policy_Document.pdf', '/evidence/hr_policy_document.pdf', 
     (SELECT id FROM users WHERE email = 'auditor@audit.com'), 
     'Human resources policies and procedures', NOW()),
    
    ('ev555555-5555-5555-5555-555555555555', 'a4444444-4444-4444-4444-444444444444', 
     'Payroll_Sample_Data.xlsx', '/evidence/payroll_sample_data.xlsx', 
     (SELECT id FROM users WHERE email = 'auditor@audit.com'), 
     'Sample payroll data for three months', NOW()),
    
    ('ev666666-6666-6666-6666-666666666666', 'a5555555-5555-5555-5555-555555555555', 
     'Process_Flow_Diagrams.pdf', '/evidence/process_flow_diagrams.pdf', 
     (SELECT id FROM users WHERE email = 'auditor2@audit.com'), 
     'Documented operational process flows', NOW());

