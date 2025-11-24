-- ============================================
-- COMPREHENSIVE DUMMY DATA FOR AUDIT SYSTEM
-- ============================================
-- This script creates realistic test data for all tables
-- Run after initial setup and user creation

-- ============================================
-- 1. DEPARTMENTS
-- ============================================

WITH dept_inserts AS (
    INSERT INTO departments (name, parent_department_id, created_at)
    VALUES 
        ('Internal Audit', NULL, NOW()),
        ('Finance Department', NULL, NOW()),
        ('Human Resources', NULL, NOW()),
        ('Information Technology', NULL, NOW()),
        ('Operations', NULL, NOW()),
        ('Compliance', NULL, NOW()),
        ('Procurement', NULL, NOW()),
        ('Legal', NULL, NOW()),
        ('Marketing', NULL, NOW())
    RETURNING id, name
)
SELECT * FROM dept_inserts;

-- Sub-departments (run after parent departments exist)
INSERT INTO departments (name, parent_department_id, created_at)
SELECT 
    'Accounts Payable',
    (SELECT id FROM departments WHERE name = 'Finance Department' LIMIT 1),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Accounts Payable');

INSERT INTO departments (name, parent_department_id, created_at)
SELECT 
    'Accounts Receivable',
    (SELECT id FROM departments WHERE name = 'Finance Department' LIMIT 1),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Accounts Receivable');

INSERT INTO departments (name, parent_department_id, created_at)
SELECT 
    'Payroll',
    (SELECT id FROM departments WHERE name = 'Human Resources' LIMIT 1),
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Payroll');


-- ============================================
-- 2. ADDITIONAL USERS
-- ============================================

INSERT INTO users (email, full_name, role, department_id, is_active, created_at)
SELECT 
    'operations.head@company.com',
    'Operations Manager',
    'department_head',
    (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1),
    true,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'operations.head@company.com');

INSERT INTO users (email, full_name, role, department_id, is_active, created_at)
SELECT 
    'compliance.head@company.com',
    'Compliance Officer',
    'department_head',
    (SELECT id FROM departments WHERE name = 'Compliance' LIMIT 1),
    true,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'compliance.head@company.com');

INSERT INTO users (email, full_name, role, department_id, is_active, created_at)
SELECT 
    'procurement.head@company.com',
    'Procurement Manager',
    'department_head',
    (SELECT id FROM departments WHERE name = 'Procurement' LIMIT 1),
    true,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'procurement.head@company.com');

INSERT INTO users (email, full_name, role, department_id, is_active, created_at)
SELECT 
    'legal.head@company.com',
    'Legal Counsel',
    'department_head',
    (SELECT id FROM departments WHERE name = 'Legal' LIMIT 1),
    true,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'legal.head@company.com');

INSERT INTO users (email, full_name, role, department_id, is_active, created_at)
SELECT 
    'finance.officer@company.com',
    'Finance Officer',
    'department_officer',
    (SELECT id FROM departments WHERE name = 'Finance Department' LIMIT 1),
    true,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'finance.officer@company.com');

INSERT INTO users (email, full_name, role, department_id, is_active, created_at)
SELECT 
    'hr.officer@company.com',
    'HR Officer',
    'department_officer',
    (SELECT id FROM departments WHERE name = 'Human Resources' LIMIT 1),
    true,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'hr.officer@company.com');

INSERT INTO users (email, full_name, role, department_id, is_active, created_at)
SELECT 
    'it.officer@company.com',
    'IT Support',
    'department_officer',
    (SELECT id FROM departments WHERE name = 'Information Technology' LIMIT 1),
    true,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'it.officer@company.com');

INSERT INTO users (email, full_name, role, department_id, is_active, created_at)
SELECT 
    'auditor2@audit.com',
    'Senior Auditor',
    'auditor',
    (SELECT id FROM departments WHERE name = 'Internal Audit' LIMIT 1),
    true,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'auditor2@audit.com');

INSERT INTO users (email, full_name, role, department_id, is_active, created_at)
SELECT 
    'viewer@company.com',
    'External Viewer',
    'viewer',
    NULL,
    true,
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'viewer@company.com');


-- ============================================
-- 3. AUDITS (Various Statuses and Types)
-- ============================================

-- Planned Audits
INSERT INTO audits (title, year, scope, risk_rating, status, assigned_manager_id, created_by_id, department_id, start_date, end_date, created_at)
SELECT 
    'Procurement Process Audit 2025',
    2025,
    'Review procurement policies, vendor selection, contract management, and compliance with regulations',
    'High',
    'planned',
    (SELECT id FROM users WHERE email = 'manager@audit.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'admin@audit.com' LIMIT 1),
    (SELECT id FROM departments WHERE name = 'Procurement' LIMIT 1),
    '2025-02-01',
    '2025-03-31',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM audits WHERE title = 'Procurement Process Audit 2025');

INSERT INTO audits (title, year, scope, risk_rating, status, assigned_manager_id, created_by_id, department_id, start_date, end_date, created_at)
SELECT 
    'IT Security Assessment 2025',
    2025,
    'Evaluate cybersecurity controls, data protection measures, and IT infrastructure security',
    'Critical',
    'planned',
    (SELECT id FROM users WHERE email = 'manager@audit.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'admin@audit.com' LIMIT 1),
    (SELECT id FROM departments WHERE name = 'Information Technology' LIMIT 1),
    '2025-03-01',
    '2025-04-30',
    NOW()
WHERE NOT EXISTS (SELECT 1 FROM audits WHERE title = 'IT Security Assessment 2025');

-- Executing Audits
INSERT INTO audits (title, year, scope, risk_rating, status, assigned_manager_id, created_by_id, department_id, start_date, end_date, created_at)
SELECT 
    'Financial Controls Audit 2025',
    2025,
    'Assessment of financial reporting, internal controls, budget management, and compliance',
    'High',
    'executing',
    (SELECT id FROM users WHERE email = 'manager@audit.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'admin@audit.com' LIMIT 1),
    (SELECT id FROM departments WHERE name = 'Finance Department' LIMIT 1),
    '2025-01-15',
    '2025-03-15',
    NOW() - INTERVAL '15 days'
WHERE NOT EXISTS (SELECT 1 FROM audits WHERE title = 'Financial Controls Audit 2025');

INSERT INTO audits (title, year, scope, risk_rating, status, assigned_manager_id, created_by_id, department_id, start_date, end_date, created_at)
SELECT 
    'HR Compliance Review 2025',
    2025,
    'Review of recruitment processes, employee records, payroll accuracy, and labor law compliance',
    'Medium',
    'executing',
    (SELECT id FROM users WHERE email = 'manager@audit.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'auditor@audit.com' LIMIT 1),
    (SELECT id FROM departments WHERE name = 'Human Resources' LIMIT 1),
    '2025-01-10',
    '2025-02-28',
    NOW() - INTERVAL '20 days'
WHERE NOT EXISTS (SELECT 1 FROM audits WHERE title = 'HR Compliance Review 2025');

-- Reporting Stage
INSERT INTO audits (title, year, scope, risk_rating, status, assigned_manager_id, created_by_id, department_id, start_date, end_date, created_at)
SELECT 
    'Operations Efficiency Audit 2024',
    2024,
    'Evaluation of operational processes, resource utilization, and performance metrics',
    'Medium',
    'reporting',
    (SELECT id FROM users WHERE email = 'manager@audit.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'admin@audit.com' LIMIT 1),
    (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1),
    '2024-11-01',
    '2024-12-31',
    NOW() - INTERVAL '60 days'
WHERE NOT EXISTS (SELECT 1 FROM audits WHERE title = 'Operations Efficiency Audit 2024');

-- Follow-up Stage
INSERT INTO audits (title, year, scope, risk_rating, status, assigned_manager_id, created_by_id, department_id, start_date, end_date, created_at)
SELECT 
    'Compliance Audit 2024',
    2024,
    'Review of regulatory compliance, policy adherence, and risk management practices',
    'High',
    'followup',
    (SELECT id FROM users WHERE email = 'manager@audit.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'admin@audit.com' LIMIT 1),
    (SELECT id FROM departments WHERE name = 'Compliance' LIMIT 1),
    '2024-09-01',
    '2024-10-31',
    NOW() - INTERVAL '90 days'
WHERE NOT EXISTS (SELECT 1 FROM audits WHERE title = 'Compliance Audit 2024');

-- Closed Audits
INSERT INTO audits (title, year, scope, risk_rating, status, assigned_manager_id, created_by_id, department_id, start_date, end_date, created_at)
SELECT 
    'Legal Department Audit 2024',
    2024,
    'Assessment of contract management, legal risk exposure, and litigation tracking',
    'Low',
    'closed',
    (SELECT id FROM users WHERE email = 'manager@audit.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'admin@audit.com' LIMIT 1),
    (SELECT id FROM departments WHERE name = 'Legal' LIMIT 1),
    '2024-08-01',
    '2024-09-30',
    NOW() - INTERVAL '120 days'
WHERE NOT EXISTS (SELECT 1 FROM audits WHERE title = 'Legal Department Audit 2024');

INSERT INTO audits (title, year, scope, risk_rating, status, assigned_manager_id, created_by_id, department_id, start_date, end_date, created_at)
SELECT 
    'Marketing Budget Audit 2024',
    2024,
    'Review of marketing expenditures, ROI analysis, and budget compliance',
    'Low',
    'closed',
    (SELECT id FROM users WHERE email = 'manager@audit.com' LIMIT 1),
    (SELECT id FROM users WHERE email = 'auditor@audit.com' LIMIT 1),
    (SELECT id FROM departments WHERE name = 'Marketing' LIMIT 1),
    '2024-07-01',
    '2024-08-31',
    NOW() - INTERVAL '150 days'
WHERE NOT EXISTS (SELECT 1 FROM audits WHERE title = 'Marketing Budget Audit 2024');


-- ============================================
-- 4. AUDIT TEAMS
-- ============================================

-- Financial Controls Audit Team
INSERT INTO audit_team (audit_id, user_id, role_in_audit, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'Financial Controls Audit 2025' LIMIT 1),
    (SELECT id FROM users WHERE email = 'auditor@audit.com' LIMIT 1),
    'Lead Auditor',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'Financial Controls Audit 2025');

INSERT INTO audit_team (audit_id, user_id, role_in_audit, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'Financial Controls Audit 2025' LIMIT 1),
    (SELECT id FROM users WHERE email = 'auditor2@audit.com' LIMIT 1),
    'Team Member',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'Financial Controls Audit 2025');

-- HR Compliance Review Team
INSERT INTO audit_team (audit_id, user_id, role_in_audit, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'HR Compliance Review 2025' LIMIT 1),
    (SELECT id FROM users WHERE email = 'auditor@audit.com' LIMIT 1),
    'Lead Auditor',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'HR Compliance Review 2025');

-- Operations Efficiency Audit Team
INSERT INTO audit_team (audit_id, user_id, role_in_audit, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'Operations Efficiency Audit 2024' LIMIT 1),
    (SELECT id FROM users WHERE email = 'auditor2@audit.com' LIMIT 1),
    'Lead Auditor',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'Operations Efficiency Audit 2024');

INSERT INTO audit_team (audit_id, user_id, role_in_audit, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'Operations Efficiency Audit 2024' LIMIT 1),
    (SELECT id FROM users WHERE email = 'auditor@audit.com' LIMIT 1),
    'Reviewer',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'Operations Efficiency Audit 2024');

-- Compliance Audit Team
INSERT INTO audit_team (audit_id, user_id, role_in_audit, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'Compliance Audit 2024' LIMIT 1),
    (SELECT id FROM users WHERE email = 'auditor@audit.com' LIMIT 1),
    'Lead Auditor',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'Compliance Audit 2024');

INSERT INTO audit_team (audit_id, user_id, role_in_audit, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'Compliance Audit 2024' LIMIT 1),
    (SELECT id FROM users WHERE email = 'auditor2@audit.com' LIMIT 1),
    'Team Member',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'Compliance Audit 2024');


-- ============================================
-- 5. AUDIT WORK PROGRAMS
-- ============================================

-- Financial Controls Audit Work Program
INSERT INTO audit_work_program (audit_id, procedure_name, description, status, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'Financial Controls Audit 2025' LIMIT 1),
    'Review Financial Policies',
    'Examine and evaluate current financial policies and procedures',
    'completed',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'Financial Controls Audit 2025');

INSERT INTO audit_work_program (audit_id, procedure_name, description, status, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'Financial Controls Audit 2025' LIMIT 1),
    'Test Internal Controls',
    'Sample testing of key financial controls and authorization processes',
    'in_progress',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'Financial Controls Audit 2025');

INSERT INTO audit_work_program (audit_id, procedure_name, description, status, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'Financial Controls Audit 2025' LIMIT 1),
    'Verify Budget Compliance',
    'Review budget vs actual spending and variance analysis',
    'pending',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'Financial Controls Audit 2025');

INSERT INTO audit_work_program (audit_id, procedure_name, description, status, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'Financial Controls Audit 2025' LIMIT 1),
    'Assess Segregation of Duties',
    'Evaluate separation of duties in financial processes',
    'pending',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'Financial Controls Audit 2025');

-- HR Compliance Review Work Program
INSERT INTO audit_work_program (audit_id, procedure_name, description, status, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'HR Compliance Review 2025' LIMIT 1),
    'Review Recruitment Process',
    'Examine hiring procedures and documentation',
    'completed',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'HR Compliance Review 2025');

INSERT INTO audit_work_program (audit_id, procedure_name, description, status, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'HR Compliance Review 2025' LIMIT 1),
    'Test Payroll Accuracy',
    'Sample testing of payroll calculations and payments',
    'in_progress',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'HR Compliance Review 2025');

INSERT INTO audit_work_program (audit_id, procedure_name, description, status, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'HR Compliance Review 2025' LIMIT 1),
    'Verify Employee Records',
    'Check completeness and accuracy of personnel files',
    'pending',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'HR Compliance Review 2025');

-- Operations Efficiency Audit Work Program
INSERT INTO audit_work_program (audit_id, procedure_name, description, status, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'Operations Efficiency Audit 2024' LIMIT 1),
    'Process Mapping',
    'Document and analyze key operational processes',
    'completed',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'Operations Efficiency Audit 2024');

INSERT INTO audit_work_program (audit_id, procedure_name, description, status, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'Operations Efficiency Audit 2024' LIMIT 1),
    'Performance Metrics Review',
    'Evaluate KPIs and performance measurement systems',
    'completed',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'Operations Efficiency Audit 2024');


-- ============================================
-- 6. AUDIT EVIDENCE
-- ============================================

INSERT INTO audit_evidence (audit_id, file_name, file_url, uploaded_by_id, description, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'Financial Controls Audit 2025' LIMIT 1),
    'Financial_Policy_Manual.pdf',
    '/evidence/financial_policy_manual.pdf',
    (SELECT id FROM users WHERE email = 'auditor@audit.com' LIMIT 1),
    'Current financial policies and procedures manual',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'Financial Controls Audit 2025');

INSERT INTO audit_evidence (audit_id, file_name, file_url, uploaded_by_id, description, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'Financial Controls Audit 2025' LIMIT 1),
    'Sample_Purchase_Orders.xlsx',
    '/evidence/sample_purchase_orders.xlsx',
    (SELECT id FROM users WHERE email = 'auditor@audit.com' LIMIT 1),
    'Sample of 50 purchase orders for testing',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'Financial Controls Audit 2025');

INSERT INTO audit_evidence (audit_id, file_name, file_url, uploaded_by_id, description, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'Financial Controls Audit 2025' LIMIT 1),
    'Budget_Report_2025.pdf',
    '/evidence/budget_report_2025.pdf',
    (SELECT id FROM users WHERE email = 'auditor2@audit.com' LIMIT 1),
    'Annual budget report with variance analysis',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'Financial Controls Audit 2025');

INSERT INTO audit_evidence (audit_id, file_name, file_url, uploaded_by_id, description, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'HR Compliance Review 2025' LIMIT 1),
    'HR_Policy_Document.pdf',
    '/evidence/hr_policy_document.pdf',
    (SELECT id FROM users WHERE email = 'auditor@audit.com' LIMIT 1),
    'Human resources policies and procedures',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'HR Compliance Review 2025');

INSERT INTO audit_evidence (audit_id, file_name, file_url, uploaded_by_id, description, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'HR Compliance Review 2025' LIMIT 1),
    'Payroll_Sample_Data.xlsx',
    '/evidence/payroll_sample_data.xlsx',
    (SELECT id FROM users WHERE email = 'auditor@audit.com' LIMIT 1),
    'Sample payroll data for three months',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'HR Compliance Review 2025');

INSERT INTO audit_evidence (audit_id, file_name, file_url, uploaded_by_id, description, created_at)
SELECT 
    (SELECT id FROM audits WHERE title = 'Operations Efficiency Audit 2024' LIMIT 1),
    'Process_Flow_Diagrams.pdf',
    '/evidence/process_flow_diagrams.pdf',
    (SELECT id FROM users WHERE email = 'auditor2@audit.com' LIMIT 1),
    'Documented operational process flows',
    NOW()
WHERE EXISTS (SELECT 1 FROM audits WHERE title = 'Operations Efficiency Audit 2024');
