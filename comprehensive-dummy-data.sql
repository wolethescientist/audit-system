 -- ============================================
-- COMPREHENSIVE DUMMY DATA FOR AUDIT MANAGEMENT SYSTEM
-- ============================================
-- This script creates a complete dataset showcasing all features
-- for each role with realistic data for presentations
-- Uses gen_random_uuid() for UUID generation
-- ============================================

-- ============================================
-- 1. CLEAN UP EXISTING DATA (Optional - Comment out if you want to keep existing data)
-- ============================================
-- TRUNCATE TABLE workflow_approvals CASCADE;
-- TRUNCATE TABLE workflow_steps CASCADE;
-- TRUNCATE TABLE workflows CASCADE;
-- TRUNCATE TABLE audit_followup CASCADE;
-- TRUNCATE TABLE audit_reports CASCADE;
-- TRUNCATE TABLE audit_queries CASCADE;
-- TRUNCATE TABLE audit_findings CASCADE;
-- TRUNCATE TABLE audit_evidence CASCADE;
-- TRUNCATE TABLE audit_work_program CASCADE;
-- TRUNCATE TABLE audit_team CASCADE;
-- TRUNCATE TABLE audits CASCADE;
-- TRUNCATE TABLE users CASCADE;
-- TRUNCATE TABLE departments CASCADE;

-- ============================================
-- 2. CREATE DEPARTMENTS
-- ============================================

-- Internal Audit Department
INSERT INTO departments (id, name, parent_department_id, created_at)
SELECT gen_random_uuid(), 'Internal Audit', NULL, NOW() - INTERVAL '365 days'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Internal Audit');

-- Business Departments
INSERT INTO departments (id, name, parent_department_id, created_at)
SELECT gen_random_uuid(), 'Finance Department', NULL, NOW() - INTERVAL '365 days'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Finance Department');

INSERT INTO departments (id, name, parent_department_id, created_at)
SELECT gen_random_uuid(), 'Human Resources', NULL, NOW() - INTERVAL '365 days'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Human Resources');

INSERT INTO departments (id, name, parent_department_id, created_at)
SELECT gen_random_uuid(), 'Information Technology', NULL, NOW() - INTERVAL '365 days'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Information Technology');

INSERT INTO departments (id, name, parent_department_id, created_at)
SELECT gen_random_uuid(), 'Operations', NULL, NOW() - INTERVAL '365 days'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Operations');

INSERT INTO departments (id, name, parent_department_id, created_at)
SELECT gen_random_uuid(), 'Compliance & Risk', NULL, NOW() - INTERVAL '365 days'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Compliance & Risk');

INSERT INTO departments (id, name, parent_department_id, created_at)
SELECT gen_random_uuid(), 'Procurement', NULL, NOW() - INTERVAL '365 days'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Procurement');

INSERT INTO departments (id, name, parent_department_id, created_at)
SELECT gen_random_uuid(), 'Legal Department', NULL, NOW() - INTERVAL '365 days'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Legal Department');

INSERT INTO departments (id, name, parent_department_id, created_at)
SELECT gen_random_uuid(), 'Marketing', NULL, NOW() - INTERVAL '365 days'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Marketing');

INSERT INTO departments (id, name, parent_department_id, created_at)
SELECT gen_random_uuid(), 'Sales', NULL, NOW() - INTERVAL '365 days'
WHERE NOT EXISTS (SELECT 1 FROM departments WHERE name = 'Sales');

-- ============================================
-- 3. CREATE USERS (All with password: password123)
-- ============================================

-- System Admin
INSERT INTO users (id, email, full_name, role, department_id, is_active, created_at)
SELECT gen_random_uuid(), 'admin@audit.com', 'Sarah Johnson', 'SYSTEM_ADMIN', 
     (SELECT id FROM departments WHERE name = 'Internal Audit' LIMIT 1), true, NOW() - INTERVAL '365 days'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'admin@audit.com');

-- Audit Managers
INSERT INTO users (id, email, full_name, role, department_id, is_active, created_at)
SELECT gen_random_uuid(), 'manager1@audit.com', 'Michael Chen', 'AUDIT_MANAGER', 
     (SELECT id FROM departments WHERE name = 'Internal Audit' LIMIT 1), true, NOW() - INTERVAL '365 days'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'manager1@audit.com');

INSERT INTO users (id, email, full_name, role, department_id, is_active, created_at)
SELECT gen_random_uuid(), 'manager2@audit.com', 'Emily Rodriguez', 'AUDIT_MANAGER', 
     (SELECT id FROM departments WHERE name = 'Internal Audit' LIMIT 1), true, NOW() - INTERVAL '300 days'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'manager2@audit.com');

-- Auditors
INSERT INTO users (id, email, full_name, role, department_id, is_active, created_at)
SELECT gen_random_uuid(), 'auditor1@audit.com', 'David Williams', 'AUDITOR', 
     (SELECT id FROM departments WHERE name = 'Internal Audit' LIMIT 1), true, NOW() - INTERVAL '365 days'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'auditor1@audit.com');

INSERT INTO users (id, email, full_name, role, department_id, is_active, created_at)
SELECT gen_random_uuid(), 'auditor2@audit.com', 'Lisa Anderson', 'AUDITOR', 
     (SELECT id FROM departments WHERE name = 'Internal Audit' LIMIT 1), true, NOW() - INTERVAL '330 days'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'auditor2@audit.com');

INSERT INTO users (id, email, full_name, role, department_id, is_active, created_at)
SELECT gen_random_uuid(), 'auditor3@audit.com', 'James Taylor', 'AUDITOR', 
     (SELECT id FROM departments WHERE name = 'Internal Audit' LIMIT 1), true, NOW() - INTERVAL '280 days'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'auditor3@audit.com');

INSERT INTO users (id, email, full_name, role, department_id, is_active, created_at)
SELECT gen_random_uuid(), 'auditor4@audit.com', 'Maria Garcia', 'AUDITOR', 
     (SELECT id FROM departments WHERE name = 'Internal Audit' LIMIT 1), true, NOW() - INTERVAL '250 days'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'auditor4@audit.com');

-- Department Heads
INSERT INTO users (id, email, full_name, role, department_id, is_active, created_at)
VALUES 
    (gen_random_uuid(), 'finance.head@company.com', 'Robert Thompson', 'DEPARTMENT_HEAD', 
     (SELECT id FROM departments WHERE name = 'Finance Department' LIMIT 1), true, NOW() - INTERVAL '365 days'),
    (gen_random_uuid(), 'hr.head@company.com', 'Jennifer Martinez', 'DEPARTMENT_HEAD', 
     (SELECT id FROM departments WHERE name = 'Human Resources' LIMIT 1), true, NOW() - INTERVAL '365 days'),
    (gen_random_uuid(), 'it.head@company.com', 'Kevin Lee', 'DEPARTMENT_HEAD', 
     (SELECT id FROM departments WHERE name = 'Information Technology' LIMIT 1), true, NOW() - INTERVAL '365 days'),
    (gen_random_uuid(), 'ops.head@company.com', 'Patricia White', 'DEPARTMENT_HEAD', 
     (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), true, NOW() - INTERVAL '365 days'),
    (gen_random_uuid(), 'compliance.head@company.com', 'Thomas Brown', 'DEPARTMENT_HEAD', 
     (SELECT id FROM departments WHERE name = 'Compliance & Risk' LIMIT 1), true, NOW() - INTERVAL '365 days'),
    (gen_random_uuid(), 'procurement.head@company.com', 'Amanda Davis', 'DEPARTMENT_HEAD', 
     (SELECT id FROM departments WHERE name = 'Procurement' LIMIT 1), true, NOW() - INTERVAL '365 days'),
    (gen_random_uuid(), 'legal.head@company.com', 'Christopher Wilson', 'DEPARTMENT_HEAD', 
     (SELECT id FROM departments WHERE name = 'Legal Department' LIMIT 1), true, NOW() - INTERVAL '365 days');

-- Department Officers
INSERT INTO users (id, email, full_name, role, department_id, is_active, created_at)
VALUES 
    (gen_random_uuid(), 'finance.officer@company.com', 'Jessica Moore', 'DEPARTMENT_OFFICER', 
     (SELECT id FROM departments WHERE name = 'Finance Department' LIMIT 1), true, NOW() - INTERVAL '300 days'),
    (gen_random_uuid(), 'hr.officer@company.com', 'Daniel Jackson', 'DEPARTMENT_OFFICER', 
     (SELECT id FROM departments WHERE name = 'Human Resources' LIMIT 1), true, NOW() - INTERVAL '280 days'),
    (gen_random_uuid(), 'it.officer@company.com', 'Michelle Harris', 'DEPARTMENT_OFFICER', 
     (SELECT id FROM departments WHERE name = 'Information Technology' LIMIT 1), true, NOW() - INTERVAL '260 days'),
    (gen_random_uuid(), 'ops.officer@company.com', 'Andrew Clark', 'DEPARTMENT_OFFICER', 
     (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1), true, NOW() - INTERVAL '240 days');

-- Viewers
INSERT INTO users (id, email, full_name, role, department_id, is_active, created_at)
VALUES 
    (gen_random_uuid(), 'viewer1@company.com', 'Rachel Green', 'VIEWER', 
     (SELECT id FROM departments WHERE name = 'Finance Department' LIMIT 1), true, NOW() - INTERVAL '200 days'),
    (gen_random_uuid(), 'viewer2@company.com', 'Mark Lewis', 'VIEWER', 
     (SELECT id FROM departments WHERE name = 'Human Resources' LIMIT 1), true, NOW() - INTERVAL '180 days');

-- ============================================
-- 4. CREATE AUDITS (Various Statuses)
-- ============================================

-- Audit 1: Closed Audit (Finance - 2024)
INSERT INTO audits (id, title, year, scope, risk_rating, status, assigned_manager_id, created_by_id, department_id, start_date, end_date, created_at)
VALUES 
    (gen_random_uuid(), 'Annual Financial Controls Audit 2024', 2024, 
     'Comprehensive review of financial controls, budget management, revenue recognition, and compliance with accounting standards. Focus on internal controls over financial reporting (ICFR) and SOX compliance.',
     'High', 'CLOSED',
     (SELECT id FROM users WHERE email = 'manager1@audit.com' LIMIT 1),
     (SELECT id FROM users WHERE email = 'admin@audit.com' LIMIT 1),
     (SELECT id FROM departments WHERE name = 'Finance Department' LIMIT 1),
     NOW() - INTERVAL '180 days', NOW() - INTERVAL '90 days', NOW() - INTERVAL '200 days');

-- Audit 2: Follow-up Status (IT Security)
INSERT INTO audits (id, title, year, scope, risk_rating, status, assigned_manager_id, created_by_id, department_id, start_date, end_date, created_at)
VALUES 
    (gen_random_uuid(), 'IT Security & Data Protection Audit', 2024, 
     'Assessment of cybersecurity controls, data protection measures, access management, network security, and compliance with GDPR and ISO 27001 standards.',
     'Critical', 'FOLLOWUP',
     (SELECT id FROM users WHERE email = 'manager2@audit.com' LIMIT 1),
     (SELECT id FROM users WHERE email = 'admin@audit.com' LIMIT 1),
     (SELECT id FROM departments WHERE name = 'Information Technology' LIMIT 1),
     NOW() - INTERVAL '150 days', NOW() - INTERVAL '60 days', NOW() - INTERVAL '170 days');

-- Audit 3: Reporting Status (HR)
INSERT INTO audits (id, title, year, scope, risk_rating, status, assigned_manager_id, created_by_id, department_id, start_date, end_date, created_at)
VALUES 
    (gen_random_uuid(), 'Human Resources Compliance Audit', 2024, 
     'Review of HR policies, recruitment processes, employee records management, payroll controls, and compliance with labor laws and regulations.',
     'Medium', 'REPORTING',
     (SELECT id FROM users WHERE email = 'manager1@audit.com' LIMIT 1),
     (SELECT id FROM users WHERE email = 'admin@audit.com' LIMIT 1),
     (SELECT id FROM departments WHERE name = 'Human Resources' LIMIT 1),
     NOW() - INTERVAL '90 days', NOW() - INTERVAL '30 days', NOW() - INTERVAL '100 days');

-- Audit 4: Executing Status (Operations)
INSERT INTO audits (id, title, year, scope, risk_rating, status, assigned_manager_id, created_by_id, department_id, start_date, end_date, created_at)
VALUES 
    (gen_random_uuid(), 'Operational Efficiency & Process Audit', 2024, 
     'Evaluation of operational processes, supply chain management, inventory controls, quality assurance procedures, and operational risk management.',
     'Medium', 'EXECUTING',
     (SELECT id FROM users WHERE email = 'manager2@audit.com' LIMIT 1),
     (SELECT id FROM users WHERE email = 'admin@audit.com' LIMIT 1),
     (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1),
     NOW() - INTERVAL '45 days', NOW() + INTERVAL '15 days', NOW() - INTERVAL '50 days');

-- Audit 5: Planned Status (Procurement)
INSERT INTO audits (id, title, year, scope, risk_rating, status, assigned_manager_id, created_by_id, department_id, start_date, end_date, created_at)
VALUES 
    (gen_random_uuid(), 'Procurement & Vendor Management Audit', 2025, 
     'Assessment of procurement processes, vendor selection criteria, contract management, purchase order controls, and compliance with procurement policies.',
     'High', 'PLANNED',
     (SELECT id FROM users WHERE email = 'manager1@audit.com' LIMIT 1),
     (SELECT id FROM users WHERE email = 'admin@audit.com' LIMIT 1),
     (SELECT id FROM departments WHERE name = 'Procurement' LIMIT 1),
     NOW() + INTERVAL '30 days', NOW() + INTERVAL '90 days', NOW() - INTERVAL '10 days');

-- Audit 6: Executing Status (Compliance)
INSERT INTO audits (id, title, year, scope, risk_rating, status, assigned_manager_id, created_by_id, department_id, start_date, end_date, created_at)
VALUES 
    (gen_random_uuid(), 'Regulatory Compliance & Risk Assessment', 2024, 
     'Review of compliance framework, risk assessment processes, regulatory reporting, anti-money laundering controls, and adherence to industry regulations.',
     'Critical', 'EXECUTING',
     (SELECT id FROM users WHERE email = 'manager2@audit.com' LIMIT 1),
     (SELECT id FROM users WHERE email = 'admin@audit.com' LIMIT 1),
     (SELECT id FROM departments WHERE name = 'Compliance & Risk' LIMIT 1),
     NOW() - INTERVAL '60 days', NOW() + INTERVAL '30 days', NOW() - INTERVAL '70 days');

-- Audit 7: Planned Status (Legal)
INSERT INTO audits (id, title, year, scope, risk_rating, status, assigned_manager_id, created_by_id, department_id, start_date, end_date, created_at)
VALUES 
    (gen_random_uuid(), 'Legal & Contract Management Audit', 2025, 
     'Examination of contract management processes, legal compliance, intellectual property protection, litigation management, and corporate governance.',
     'Medium', 'PLANNED',
     (SELECT id FROM users WHERE email = 'manager1@audit.com' LIMIT 1),
     (SELECT id FROM users WHERE email = 'admin@audit.com' LIMIT 1),
     (SELECT id FROM departments WHERE name = 'Legal Department' LIMIT 1),
     NOW() + INTERVAL '60 days', NOW() + INTERVAL '120 days', NOW() - INTERVAL '5 days');

-- ============================================
-- 5. CREATE AUDIT TEAMS
-- ============================================

-- Team for Audit 1 (Closed Finance Audit)
INSERT INTO audit_team (id, audit_id, user_id, role_in_audit, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor1@audit.com' LIMIT 1),
     'Lead Auditor', NOW() - INTERVAL '200 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor2@audit.com' LIMIT 1),
     'Senior Auditor', NOW() - INTERVAL '200 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor3@audit.com' LIMIT 1),
     'Auditor', NOW() - INTERVAL '200 days');

-- Team for Audit 2 (IT Security Follow-up)
INSERT INTO audit_team (id, audit_id, user_id, role_in_audit, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor2@audit.com' LIMIT 1),
     'Lead Auditor', NOW() - INTERVAL '170 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor4@audit.com' LIMIT 1),
     'IT Security Specialist', NOW() - INTERVAL '170 days');

-- Team for Audit 3 (HR Reporting)
INSERT INTO audit_team (id, audit_id, user_id, role_in_audit, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor3@audit.com' LIMIT 1),
     'Lead Auditor', NOW() - INTERVAL '100 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor1@audit.com' LIMIT 1),
     'Senior Auditor', NOW() - INTERVAL '100 days');

-- Team for Audit 4 (Operations Executing)
INSERT INTO audit_team (id, audit_id, user_id, role_in_audit, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Operational Efficiency & Process Audit' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor4@audit.com' LIMIT 1),
     'Lead Auditor', NOW() - INTERVAL '50 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Operational Efficiency & Process Audit' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor2@audit.com' LIMIT 1),
     'Process Analyst', NOW() - INTERVAL '50 days');

-- Team for Audit 6 (Compliance Executing)
INSERT INTO audit_team (id, audit_id, user_id, role_in_audit, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Regulatory Compliance & Risk Assessment' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor1@audit.com' LIMIT 1),
     'Lead Auditor', NOW() - INTERVAL '70 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Regulatory Compliance & Risk Assessment' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor3@audit.com' LIMIT 1),
     'Compliance Specialist', NOW() - INTERVAL '70 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Regulatory Compliance & Risk Assessment' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor4@audit.com' LIMIT 1),
     'Risk Analyst', NOW() - INTERVAL '70 days');

-- ============================================
-- 6. CREATE WORK PROGRAMS
-- ============================================

-- Work Program for Audit 1 (Closed Finance Audit)
INSERT INTO audit_work_program (id, audit_id, procedure_name, description, status, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     'Review Financial Policies', 
     'Examine and evaluate all financial policies and procedures for adequacy and compliance with regulatory requirements.',
     'COMPLETED', NOW() - INTERVAL '180 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     'Test Internal Controls', 
     'Perform testing of key financial controls including segregation of duties, authorization limits, and reconciliation procedures.',
     'COMPLETED', NOW() - INTERVAL '170 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     'Sample Transaction Testing', 
     'Select and test sample transactions across revenue, expenses, and capital expenditures for accuracy and proper authorization.',
     'COMPLETED', NOW() - INTERVAL '160 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     'Bank Reconciliation Review', 
     'Review bank reconciliation processes and verify accuracy of reconciliations for all bank accounts.',
     'COMPLETED', NOW() - INTERVAL '150 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     'Financial Reporting Assessment', 
     'Assess the accuracy and timeliness of financial reporting to management and external stakeholders.',
     'COMPLETED', NOW() - INTERVAL '140 days');

-- Work Program for Audit 2 (IT Security Follow-up)
INSERT INTO audit_work_program (id, audit_id, procedure_name, description, status, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     'Access Control Review', 
     'Review user access rights, privileged accounts, and access provisioning/deprovisioning processes.',
     'COMPLETED', NOW() - INTERVAL '150 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     'Network Security Assessment', 
     'Evaluate firewall configurations, intrusion detection systems, and network segmentation controls.',
     'COMPLETED', NOW() - INTERVAL '140 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     'Data Encryption Verification', 
     'Verify implementation of data encryption for data at rest and in transit across all systems.',
     'COMPLETED', NOW() - INTERVAL '130 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     'Vulnerability Management', 
     'Review vulnerability scanning processes, patch management, and remediation tracking.',
     'COMPLETED', NOW() - INTERVAL '120 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     'Incident Response Testing', 
     'Test incident response procedures and evaluate effectiveness of security incident management.',
     'COMPLETED', NOW() - INTERVAL '110 days');

-- Work Program for Audit 3 (HR Reporting)
INSERT INTO audit_work_program (id, audit_id, procedure_name, description, status, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     'Recruitment Process Review', 
     'Evaluate recruitment and hiring processes for compliance with equal opportunity and labor laws.',
     'COMPLETED', NOW() - INTERVAL '90 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     'Employee Records Audit', 
     'Review employee records for completeness, accuracy, and compliance with data protection regulations.',
     'COMPLETED', NOW() - INTERVAL '80 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     'Payroll Controls Testing', 
     'Test payroll processing controls, including time tracking, approval workflows, and payment accuracy.',
     'COMPLETED', NOW() - INTERVAL '70 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     'Performance Management Review', 
     'Assess performance evaluation processes and documentation for fairness and consistency.',
     'IN_PROGRESS', NOW() - INTERVAL '60 days');

-- Work Program for Audit 4 (Operations Executing)
INSERT INTO audit_work_program (id, audit_id, procedure_name, description, status, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Operational Efficiency & Process Audit' LIMIT 1),
     'Supply Chain Analysis', 
     'Analyze supply chain processes, vendor relationships, and inventory management controls.',
     'COMPLETED', NOW() - INTERVAL '45 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Operational Efficiency & Process Audit' LIMIT 1),
     'Quality Control Assessment', 
     'Evaluate quality control procedures, defect tracking, and corrective action processes.',
     'IN_PROGRESS', NOW() - INTERVAL '40 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Operational Efficiency & Process Audit' LIMIT 1),
     'Process Efficiency Review', 
     'Review operational processes for efficiency, bottlenecks, and opportunities for improvement.',
     'IN_PROGRESS', NOW() - INTERVAL '35 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Operational Efficiency & Process Audit' LIMIT 1),
     'Risk Management Evaluation', 
     'Assess operational risk identification, assessment, and mitigation strategies.',
     'PENDING', NOW() - INTERVAL '30 days');

-- Work Program for Audit 6 (Compliance Executing)
INSERT INTO audit_work_program (id, audit_id, procedure_name, description, status, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Regulatory Compliance & Risk Assessment' LIMIT 1),
     'Regulatory Framework Review', 
     'Review compliance with applicable regulations including AML, KYC, and industry-specific requirements.',
     'COMPLETED', NOW() - INTERVAL '60 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Regulatory Compliance & Risk Assessment' LIMIT 1),
     'Risk Assessment Process', 
     'Evaluate enterprise risk assessment methodology, risk register maintenance, and risk reporting.',
     'IN_PROGRESS', NOW() - INTERVAL '50 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Regulatory Compliance & Risk Assessment' LIMIT 1),
     'Compliance Training Review', 
     'Assess compliance training programs, completion rates, and effectiveness of training materials.',
     'IN_PROGRESS', NOW() - INTERVAL '45 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Regulatory Compliance & Risk Assessment' LIMIT 1),
     'Regulatory Reporting Audit', 
     'Verify accuracy and timeliness of regulatory reports submitted to governing bodies.',
     'PENDING', NOW() - INTERVAL '40 days');

-- ============================================
-- 7. CREATE AUDIT EVIDENCE
-- ============================================

-- Evidence for Audit 1 (Closed Finance Audit)
INSERT INTO audit_evidence (id, audit_id, file_name, file_url, uploaded_by_id, description, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     'Financial_Policies_Manual_2024.pdf', 
     '/evidence/finance/financial_policies_manual_2024.pdf',
     (SELECT id FROM users WHERE email = 'auditor1@audit.com' LIMIT 1),
     'Complete financial policies and procedures manual reviewed during audit',
     NOW() - INTERVAL '175 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     'Internal_Controls_Testing_Results.xlsx', 
     '/evidence/finance/internal_controls_testing_results.xlsx',
     (SELECT id FROM users WHERE email = 'auditor2@audit.com' LIMIT 1),
     'Detailed results of internal controls testing including test samples and outcomes',
     NOW() - INTERVAL '165 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     'Bank_Reconciliation_Samples_Q1-Q4.pdf', 
     '/evidence/finance/bank_reconciliation_samples_q1_q4.pdf',
     (SELECT id FROM users WHERE email = 'auditor1@audit.com' LIMIT 1),
     'Sample bank reconciliations from all quarters with supporting documentation',
     NOW() - INTERVAL '145 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     'Transaction_Testing_Workpapers.xlsx', 
     '/evidence/finance/transaction_testing_workpapers.xlsx',
     (SELECT id FROM users WHERE email = 'auditor3@audit.com' LIMIT 1),
     'Workpapers documenting transaction testing across revenue and expense categories',
     NOW() - INTERVAL '155 days');

-- Evidence for Audit 2 (IT Security Follow-up)
INSERT INTO audit_evidence (id, audit_id, file_name, file_url, uploaded_by_id, description, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     'Access_Control_Matrix.xlsx', 
     '/evidence/it/access_control_matrix.xlsx',
     (SELECT id FROM users WHERE email = 'auditor2@audit.com' LIMIT 1),
     'Comprehensive access control matrix showing user permissions across all systems',
     NOW() - INTERVAL '145 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     'Vulnerability_Scan_Report_Oct2024.pdf', 
     '/evidence/it/vulnerability_scan_report_oct2024.pdf',
     (SELECT id FROM users WHERE email = 'auditor4@audit.com' LIMIT 1),
     'Latest vulnerability scan report with identified issues and remediation status',
     NOW() - INTERVAL '125 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     'Network_Security_Architecture.pdf', 
     '/evidence/it/network_security_architecture.pdf',
     (SELECT id FROM users WHERE email = 'auditor2@audit.com' LIMIT 1),
     'Network architecture diagram showing security zones, firewalls, and segmentation',
     NOW() - INTERVAL '135 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     'Encryption_Implementation_Report.docx', 
     '/evidence/it/encryption_implementation_report.docx',
     (SELECT id FROM users WHERE email = 'auditor4@audit.com' LIMIT 1),
     'Report on encryption implementation status for data at rest and in transit',
     NOW() - INTERVAL '115 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     'Incident_Response_Test_Results.pdf', 
     '/evidence/it/incident_response_test_results.pdf',
     (SELECT id FROM users WHERE email = 'auditor2@audit.com' LIMIT 1),
     'Results from incident response tabletop exercise conducted in September 2024',
     NOW() - INTERVAL '105 days');

-- Evidence for Audit 3 (HR Reporting)
INSERT INTO audit_evidence (id, audit_id, file_name, file_url, uploaded_by_id, description, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     'HR_Policies_Handbook_2024.pdf', 
     '/evidence/hr/hr_policies_handbook_2024.pdf',
     (SELECT id FROM users WHERE email = 'auditor3@audit.com' LIMIT 1),
     'Current HR policies and procedures handbook',
     NOW() - INTERVAL '85 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     'Recruitment_Process_Documentation.docx', 
     '/evidence/hr/recruitment_process_documentation.docx',
     (SELECT id FROM users WHERE email = 'auditor1@audit.com' LIMIT 1),
     'Documentation of recruitment and hiring processes with sample job postings',
     NOW() - INTERVAL '75 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     'Payroll_Controls_Testing.xlsx', 
     '/evidence/hr/payroll_controls_testing.xlsx',
     (SELECT id FROM users WHERE email = 'auditor3@audit.com' LIMIT 1),
     'Payroll controls testing results including sample payroll runs',
     NOW() - INTERVAL '65 days');

-- Evidence for Audit 4 (Operations Executing)
INSERT INTO audit_evidence (id, audit_id, file_name, file_url, uploaded_by_id, description, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Operational Efficiency & Process Audit' LIMIT 1),
     'Supply_Chain_Process_Map.pdf', 
     '/evidence/operations/supply_chain_process_map.pdf',
     (SELECT id FROM users WHERE email = 'auditor4@audit.com' LIMIT 1),
     'Detailed process map of supply chain operations from procurement to delivery',
     NOW() - INTERVAL '42 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Operational Efficiency & Process Audit' LIMIT 1),
     'Inventory_Management_Report.xlsx', 
     '/evidence/operations/inventory_management_report.xlsx',
     (SELECT id FROM users WHERE email = 'auditor2@audit.com' LIMIT 1),
     'Inventory management analysis including turnover rates and stock levels',
     NOW() - INTERVAL '38 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Operational Efficiency & Process Audit' LIMIT 1),
     'Quality_Control_Metrics_Q3_2024.pdf', 
     '/evidence/operations/quality_control_metrics_q3_2024.pdf',
     (SELECT id FROM users WHERE email = 'auditor4@audit.com' LIMIT 1),
     'Quality control metrics and defect tracking data for Q3 2024',
     NOW() - INTERVAL '33 days');

-- Evidence for Audit 6 (Compliance Executing)
INSERT INTO audit_evidence (id, audit_id, file_name, file_url, uploaded_by_id, description, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Regulatory Compliance & Risk Assessment' LIMIT 1),
     'Compliance_Framework_Documentation.pdf', 
     '/evidence/compliance/compliance_framework_documentation.pdf',
     (SELECT id FROM users WHERE email = 'auditor1@audit.com' LIMIT 1),
     'Comprehensive compliance framework documentation including policies and procedures',
     NOW() - INTERVAL '55 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Regulatory Compliance & Risk Assessment' LIMIT 1),
     'Risk_Register_2024.xlsx', 
     '/evidence/compliance/risk_register_2024.xlsx',
     (SELECT id FROM users WHERE email = 'auditor3@audit.com' LIMIT 1),
     'Enterprise risk register with identified risks, assessments, and mitigation plans',
     NOW() - INTERVAL '48 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Regulatory Compliance & Risk Assessment' LIMIT 1),
     'Regulatory_Reports_Archive_2024.zip', 
     '/evidence/compliance/regulatory_reports_archive_2024.zip',
     (SELECT id FROM users WHERE email = 'auditor4@audit.com' LIMIT 1),
     'Archive of all regulatory reports submitted in 2024',
     NOW() - INTERVAL '42 days');

-- ============================================
-- 8. CREATE AUDIT FINDINGS
-- ============================================

-- Findings for Audit 1 (Closed Finance Audit)
INSERT INTO audit_findings (id, audit_id, title, severity, impact, root_cause, recommendation, response_from_auditee, status, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     'Inadequate Segregation of Duties in Payment Processing', 
     'HIGH',
     'The same individual can initiate, approve, and process payments, creating risk of unauthorized transactions and fraud. This affects approximately $2.5M in monthly payment processing.',
     'Limited staffing in the finance department and lack of system controls to enforce segregation of duties. Current ERP system allows users with payment processing rights to perform multiple functions.',
     'Implement system-level controls to enforce segregation of duties. Assign payment initiation, approval, and processing to different individuals. Consider implementing dual authorization for payments above $10,000.',
     'Finance Department agrees with the finding. Will implement recommended controls by Q1 2025. Additional staff member has been approved to support segregation of duties.',
     'closed', NOW() - INTERVAL '120 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     'Delayed Bank Reconciliations', 
     'MEDIUM',
     'Bank reconciliations are completed 15-20 days after month-end, delaying identification of discrepancies and potential errors. This affects 5 bank accounts with combined balances of $15M.',
     'Manual reconciliation process is time-consuming. Staff responsible for reconciliations also handles other month-end closing activities, causing delays.',
     'Automate bank reconciliation process using available ERP functionality. Establish target of completing reconciliations within 5 business days of month-end. Provide additional training on reconciliation tools.',
     'Partially agree. Will automate 3 high-volume accounts by Q2 2025. Target completion time of 10 days is more realistic given current resources.',
     'closed', NOW() - INTERVAL '115 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     'Incomplete Documentation for Journal Entries', 
     'LOW',
     'Approximately 15% of journal entries reviewed lacked adequate supporting documentation, making it difficult to verify the business purpose and accuracy of the entries.',
     'No formal policy requiring supporting documentation for all journal entries. Staff not consistently trained on documentation requirements.',
     'Establish and communicate policy requiring supporting documentation for all journal entries. Implement system validation to prevent posting of entries without attached documentation. Provide training to all finance staff.',
     'Agree with finding. Policy has been drafted and will be implemented in January 2025. System validation will be configured during Q1 2025.',
     'closed', NOW() - INTERVAL '110 days');

-- Findings for Audit 2 (IT Security Follow-up)
INSERT INTO audit_findings (id, audit_id, title, severity, impact, root_cause, recommendation, response_from_auditee, status, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     'Critical Vulnerabilities Not Remediated Timely', 
     'CRITICAL',
     'High and critical vulnerabilities identified in vulnerability scans are not being remediated within established timeframes. 12 critical vulnerabilities have been open for more than 90 days, exposing systems to potential exploitation.',
     'Lack of formal vulnerability management process and insufficient resources dedicated to patch management. No escalation process for overdue vulnerabilities.',
     'Establish formal vulnerability management policy with defined remediation timeframes (critical: 7 days, high: 30 days). Implement automated tracking and escalation for overdue items. Allocate dedicated resources for patch management.',
     'IT Department acknowledges the severity. Immediate action plan developed to address all critical vulnerabilities within 30 days. Formal policy will be implemented by December 2024.',
     'open', NOW() - INTERVAL '100 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     'Excessive Privileged Access Rights', 
     'HIGH',
     'Review identified 23 users with administrative access rights that exceed their job requirements. Excessive privileges increase risk of unauthorized access and accidental system changes.',
     'Access rights granted based on convenience rather than least privilege principle. No regular review of user access rights. Approval process for privileged access is informal.',
     'Conduct comprehensive review of all privileged access and remove unnecessary rights. Implement least privilege principle. Establish quarterly access reviews. Formalize approval process for privileged access requests.',
     'Agree with finding. Access review completed and 15 users have had privileges reduced. Quarterly review process will begin in Q1 2025.',
     'IN_PROGRESS', NOW() - INTERVAL '95 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     'Incomplete Data Encryption Implementation', 
     'HIGH',
     'Several databases containing sensitive customer information are not encrypted at rest. This affects approximately 500,000 customer records and violates data protection requirements.',
     'Legacy systems not designed with encryption capabilities. Migration to encrypted storage has been delayed due to resource constraints and competing priorities.',
     'Prioritize encryption of all databases containing sensitive information. Develop and execute migration plan for legacy systems. Implement encryption for all new systems as standard requirement.',
     'IT Department agrees. Encryption project has been prioritized. Phase 1 covering 60% of affected databases will be completed by Q1 2025. Full implementation by Q3 2025.',
     'IN_PROGRESS', NOW() - INTERVAL '90 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     'Inadequate Security Awareness Training', 
     'MEDIUM',
     'Only 65% of employees have completed mandatory security awareness training. Incomplete training increases risk of successful phishing attacks and security incidents.',
     'Training program is voluntary rather than mandatory. No consequences for non-completion. Training content is outdated and not engaging.',
     'Make security awareness training mandatory for all employees with annual refresher. Implement consequences for non-completion. Update training content to include current threats and interactive elements. Track completion rates monthly.',
     'HR and IT will collaborate to make training mandatory starting Q1 2025. New training platform with updated content will be launched in January 2025.',
     'open', NOW() - INTERVAL '85 days');

-- Findings for Audit 3 (HR Reporting)
INSERT INTO audit_findings (id, audit_id, title, severity, impact, root_cause, recommendation, response_from_auditee, status, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     'Incomplete Employee Background Checks', 
     'HIGH',
     'Background checks were not completed for 18 out of 120 employees hired in the past year. This creates risk of hiring individuals with undisclosed criminal records or falsified credentials.',
     'Background check process is manual and not consistently followed. No system to track completion of background checks. Some hiring managers bypass the process to expedite hiring.',
     'Implement mandatory background check requirement in HRIS system that prevents completion of hiring process without verified background check. Conduct retroactive background checks for affected employees. Provide training to hiring managers.',
     'HR Department agrees. Retroactive background checks initiated for all affected employees. HRIS system enhancement will be completed by February 2025.',
     'IN_PROGRESS', NOW() - INTERVAL '75 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     'Inconsistent Performance Evaluation Process', 
     'MEDIUM',
     'Performance evaluations are not conducted consistently across departments. 30% of employees did not receive annual performance reviews, affecting compensation decisions and career development.',
     'No centralized tracking of performance evaluation completion. Department managers have different approaches to performance management. HR does not enforce evaluation deadlines.',
     'Implement centralized tracking system for performance evaluations. Establish mandatory evaluation schedule with automated reminders. Link compensation reviews to completed performance evaluations. Provide manager training on evaluation process.',
     'HR acknowledges the issue. New performance management module will be implemented in HRIS by March 2025. Manager training scheduled for Q1 2025.',
     'open', NOW() - INTERVAL '70 days');

-- Findings for Audit 4 (Operations Executing)
INSERT INTO audit_findings (id, audit_id, title, severity, impact, root_cause, recommendation, response_from_auditee, status, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Operational Efficiency & Process Audit' LIMIT 1),
     'Excessive Inventory Holding Costs', 
     'MEDIUM',
     'Inventory turnover ratio is below industry benchmark. Excess inventory valued at $1.2M has been held for more than 180 days, increasing storage costs and risk of obsolescence.',
     'Inventory management system lacks automated reorder points. Purchasing decisions based on historical patterns rather than demand forecasting. No regular review of slow-moving inventory.',
     'Implement demand forecasting tools and automated reorder point calculations. Conduct quarterly review of slow-moving inventory. Establish process for disposing of obsolete inventory. Train staff on inventory optimization techniques.',
     'Operations team agrees with assessment. Demand forecasting project approved and will be implemented in Q2 2025. Immediate review of slow-moving inventory initiated.',
     'open', NOW() - INTERVAL '35 days'),
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Operational Efficiency & Process Audit' LIMIT 1),
     'Quality Control Documentation Gaps', 
     'LOW',
     'Quality control inspection records are incomplete for approximately 20% of production batches. Missing documentation makes it difficult to trace quality issues and demonstrate compliance.',
     'Quality control process relies on paper-based forms that are sometimes misplaced. No system validation to ensure all required inspections are documented.',
     'Implement digital quality control system with mandatory data entry for all inspections. Establish daily review process to identify missing documentation. Provide training on documentation requirements.',
     'Quality team acknowledges the gap. Digital QC system implementation planned for Q1 2025. Interim process improvements implemented immediately.',
     'open', NOW() - INTERVAL '32 days');

-- Findings for Audit 6 (Compliance Executing)
INSERT INTO audit_findings (id, audit_id, title, severity, impact, root_cause, recommendation, response_from_auditee, status, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Regulatory Compliance & Risk Assessment' LIMIT 1),
     'Outdated Risk Assessment', 
     'HIGH',
     'Enterprise risk assessment has not been updated in 18 months. Several significant risks including cybersecurity threats and supply chain disruptions are not adequately reflected in the risk register.',
     'No formal schedule for risk assessment updates. Risk management function is understaffed. Focus has been on regulatory compliance rather than proactive risk management.',
     'Establish quarterly risk assessment review process. Expand risk management team. Implement risk management software to facilitate ongoing risk monitoring and reporting. Conduct comprehensive risk assessment immediately.',
     'Compliance team agrees. Comprehensive risk assessment scheduled for December 2024. Additional risk management resource approved for 2025.',
     'open', NOW() - INTERVAL '45 days');

-- ============================================
-- 9. CREATE AUDIT QUERIES
-- ============================================

-- Queries for Audit 3 (HR Reporting)
INSERT INTO audit_queries (id, audit_id, from_user_id, to_user_id, message, parent_query_id, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor3@audit.com' LIMIT 1),
     (SELECT id FROM users WHERE email = 'hr.head@company.com' LIMIT 1),
     'Could you please provide the complete list of employees hired in 2024 along with their background check completion dates? We need this to verify compliance with hiring policies.',
     NULL, NOW() - INTERVAL '72 days');

-- Response to above query
INSERT INTO audit_queries (id, audit_id, from_user_id, to_user_id, message, parent_query_id, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     (SELECT id FROM users WHERE email = 'hr.head@company.com' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor3@audit.com' LIMIT 1),
     'I have compiled the requested information. Please find attached the spreadsheet with all 2024 hires and background check dates. Note that we identified some gaps which we are working to address.',
     (SELECT id FROM audit_queries WHERE message LIKE 'Could you please provide the complete list of employees hired in 2024%'),
     NOW() - INTERVAL '70 days');

-- Follow-up query
INSERT INTO audit_queries (id, audit_id, from_user_id, to_user_id, message, parent_query_id, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor1@audit.com' LIMIT 1),
     (SELECT id FROM users WHERE email = 'hr.officer@company.com' LIMIT 1),
     'We noticed that performance evaluations for Q2 2024 are missing for several employees in the Sales department. Can you explain the reason for this gap and provide the missing evaluations?',
     NULL, NOW() - INTERVAL '65 days');

-- Response
INSERT INTO audit_queries (id, audit_id, from_user_id, to_user_id, message, parent_query_id, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     (SELECT id FROM users WHERE email = 'hr.officer@company.com' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor1@audit.com' LIMIT 1),
     'The Sales department had a management transition in Q2 which caused delays in performance evaluations. The new manager is currently completing the overdue evaluations. We expect all to be completed by end of this month.',
     (SELECT id FROM audit_queries WHERE message LIKE 'We noticed that performance evaluations for Q2 2024%'),
     NOW() - INTERVAL '63 days');

-- Queries for Audit 4 (Operations Executing)
INSERT INTO audit_queries (id, audit_id, from_user_id, to_user_id, message, parent_query_id, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Operational Efficiency & Process Audit' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor4@audit.com' LIMIT 1),
     (SELECT id FROM users WHERE email = 'ops.head@company.com' LIMIT 1),
     'During our review of inventory records, we found significant discrepancies between physical counts and system records for the warehouse. Can you provide an explanation and the reconciliation process used?',
     NULL, NOW() - INTERVAL '38 days');

-- Response
INSERT INTO audit_queries (id, audit_id, from_user_id, to_user_id, message, parent_query_id, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Operational Efficiency & Process Audit' LIMIT 1),
     (SELECT id FROM users WHERE email = 'ops.head@company.com' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor4@audit.com' LIMIT 1),
     'The discrepancies were due to timing differences in recording receipts and shipments. We have since implemented a daily reconciliation process and the discrepancies have been resolved. Documentation attached.',
     (SELECT id FROM audit_queries WHERE message LIKE 'During our review of inventory records%'),
     NOW() - INTERVAL '36 days');

-- Another query
INSERT INTO audit_queries (id, audit_id, from_user_id, to_user_id, message, parent_query_id, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Operational Efficiency & Process Audit' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor2@audit.com' LIMIT 1),
     (SELECT id FROM users WHERE email = 'ops.officer@company.com' LIMIT 1),
     'Please provide copies of quality control inspection reports for production batches from September 2024. We need to verify the completeness of quality documentation.',
     NULL, NOW() - INTERVAL '30 days');

-- Queries for Audit 6 (Compliance Executing)
INSERT INTO audit_queries (id, audit_id, from_user_id, to_user_id, message, parent_query_id, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Regulatory Compliance & Risk Assessment' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor1@audit.com' LIMIT 1),
     (SELECT id FROM users WHERE email = 'compliance.head@company.com' LIMIT 1),
     'We need to review the risk assessment methodology and the current enterprise risk register. When was the last comprehensive risk assessment conducted and who participated in the process?',
     NULL, NOW() - INTERVAL '52 days');

-- Response
INSERT INTO audit_queries (id, audit_id, from_user_id, to_user_id, message, parent_query_id, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Regulatory Compliance & Risk Assessment' LIMIT 1),
     (SELECT id FROM users WHERE email = 'compliance.head@company.com' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor1@audit.com' LIMIT 1),
     'The last comprehensive risk assessment was conducted in May 2023. Participants included department heads and the executive team. We acknowledge this needs to be updated and have scheduled a comprehensive review for next month.',
     (SELECT id FROM audit_queries WHERE message LIKE 'We need to review the risk assessment methodology%'),
     NOW() - INTERVAL '50 days');

-- Follow-up
INSERT INTO audit_queries (id, audit_id, from_user_id, to_user_id, message, parent_query_id, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Regulatory Compliance & Risk Assessment' LIMIT 1),
     (SELECT id FROM users WHERE email = 'auditor3@audit.com' LIMIT 1),
     (SELECT id FROM users WHERE email = 'compliance.head@company.com' LIMIT 1),
     'Can you provide evidence of compliance training completion for all employees? We need to verify that mandatory training requirements are being met.',
     NULL, NOW() - INTERVAL '44 days');

-- ============================================
-- 10. CREATE AUDIT REPORTS
-- ============================================

-- Report for Audit 1 (Closed Finance Audit) - Published
INSERT INTO audit_reports (id, audit_id, version, content, status, created_by_id, comments, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     1,
     'EXECUTIVE SUMMARY

The Internal Audit team conducted a comprehensive audit of financial controls for the Finance Department from June to September 2024. The audit focused on internal controls over financial reporting, payment processing, bank reconciliations, and compliance with accounting standards.

AUDIT SCOPE AND OBJECTIVES
- Evaluate the design and operating effectiveness of financial controls
- Assess compliance with financial policies and procedures
- Review accuracy and timeliness of financial reporting
- Test key financial processes including payment processing and reconciliations

KEY FINDINGS
Three findings were identified during the audit:
1. HIGH: Inadequate segregation of duties in payment processing
2. MEDIUM: Delayed bank reconciliations
3. LOW: Incomplete documentation for journal entries

MANAGEMENT RESPONSE
Management has accepted all findings and developed action plans to address the identified issues. Implementation is expected to be completed by Q1 2025.

CONCLUSION
While the overall control environment is adequate, the identified weaknesses require prompt attention to strengthen financial controls and reduce risk of errors and fraud.',
     'PUBLISHED',
     (SELECT id FROM users WHERE email = 'manager1@audit.com' LIMIT 1),
     'Final report approved and published. All findings have been addressed with management action plans.',
     NOW() - INTERVAL '95 days');

-- Report for Audit 2 (IT Security Follow-up) - Approved
INSERT INTO audit_reports (id, audit_id, version, content, status, created_by_id, comments, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     2,
     'EXECUTIVE SUMMARY

The Internal Audit team conducted an IT Security and Data Protection audit from May to August 2024. This audit assessed the organization''s cybersecurity posture, data protection measures, and compliance with relevant regulations including GDPR and ISO 27001.

AUDIT SCOPE AND OBJECTIVES
- Evaluate cybersecurity controls and security architecture
- Assess data protection and encryption implementation
- Review access management and privileged access controls
- Test vulnerability management and patch management processes
- Evaluate incident response capabilities

KEY FINDINGS
Four significant findings were identified:
1. CRITICAL: Critical vulnerabilities not remediated timely
2. HIGH: Excessive privileged access rights
3. HIGH: Incomplete data encryption implementation
4. MEDIUM: Inadequate security awareness training

MANAGEMENT RESPONSE
IT Department has acknowledged all findings and developed comprehensive action plans. Critical vulnerabilities are being addressed immediately, with full remediation expected by Q3 2025.

CONCLUSION
Significant improvements are needed in IT security controls. The identified vulnerabilities pose material risk to the organization and require immediate management attention and resource allocation.',
     'APPROVED',
     (SELECT id FROM users WHERE email = 'manager2@audit.com' LIMIT 1),
     'Report approved by Audit Committee. Follow-up audit scheduled for Q2 2025 to verify implementation of corrective actions.',
     NOW() - INTERVAL '68 days');

-- Report for Audit 3 (HR Reporting) - Under Review
INSERT INTO audit_reports (id, audit_id, version, content, status, created_by_id, comments, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     1,
     'EXECUTIVE SUMMARY

The Internal Audit team conducted a Human Resources Compliance audit from August to October 2024. The audit evaluated HR policies, recruitment processes, employee records management, and compliance with labor laws and regulations.

AUDIT SCOPE AND OBJECTIVES
- Review HR policies and procedures for adequacy and compliance
- Assess recruitment and hiring processes
- Evaluate employee records management and data protection
- Test payroll processing controls
- Review performance management processes

KEY FINDINGS
Two findings were identified:
1. HIGH: Incomplete employee background checks
2. MEDIUM: Inconsistent performance evaluation process

MANAGEMENT RESPONSE
HR Department has accepted both findings and is implementing corrective actions. Background checks are being completed retroactively, and a new performance management system will be implemented in Q1 2025.

CONCLUSION
Overall HR compliance is satisfactory, but the identified gaps in background checks and performance evaluations require prompt attention to ensure regulatory compliance and effective talent management.',
     'UNDER_REVIEW',
     (SELECT id FROM users WHERE email = 'auditor3@audit.com' LIMIT 1),
     'Draft report submitted for manager review. Awaiting feedback before finalizing.',
     NOW() - INTERVAL '15 days');

-- Earlier draft version of Audit 3 report
INSERT INTO audit_reports (id, audit_id, version, content, status, created_by_id, comments, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     1,
     'DRAFT - Initial findings and observations from HR Compliance Audit. Detailed testing still in progress.',
     'DRAFT',
     (SELECT id FROM users WHERE email = 'auditor3@audit.com' LIMIT 1),
     'Initial draft for internal review only.',
     NOW() - INTERVAL '25 days');

-- ============================================
-- 11. CREATE FOLLOW-UP ITEMS
-- ============================================

-- Follow-ups for Audit 2 (IT Security) - Active follow-up status
INSERT INTO audit_followup (id, audit_id, finding_id, assigned_to_id, due_date, status, evidence_url, completion_notes, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     (SELECT id FROM audit_findings WHERE title = 'Critical Vulnerabilities Not Remediated Timely' LIMIT 1),
     (SELECT id FROM users WHERE email = 'it.head@company.com' LIMIT 1),
     NOW() + INTERVAL '30 days',
     'IN_PROGRESS',
     NULL,
     'Remediation plan developed. 8 of 12 critical vulnerabilities have been patched. Remaining 4 require system upgrades scheduled for next month.',
     NOW() - INTERVAL '95 days');

INSERT INTO audit_followup (id, audit_id, finding_id, assigned_to_id, due_date, status, evidence_url, completion_notes, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     (SELECT id FROM audit_findings WHERE title = 'Excessive Privileged Access Rights' LIMIT 1),
     (SELECT id FROM users WHERE email = 'it.head@company.com' LIMIT 1),
     NOW() + INTERVAL '45 days',
     'IN_PROGRESS',
     '/evidence/followup/access_review_results.xlsx',
     'Access review completed. 15 users have had privileges reduced. Quarterly review process documented and scheduled.',
     NOW() - INTERVAL '90 days');

INSERT INTO audit_followup (id, audit_id, finding_id, assigned_to_id, due_date, status, evidence_url, completion_notes, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     (SELECT id FROM audit_findings WHERE title = 'Incomplete Data Encryption Implementation' LIMIT 1),
     (SELECT id FROM users WHERE email = 'it.head@company.com' LIMIT 1),
     NOW() + INTERVAL '120 days',
     'IN_PROGRESS',
     NULL,
     'Encryption project initiated. Phase 1 covering 3 critical databases is 40% complete. Full implementation on track for Q3 2025.',
     NOW() - INTERVAL '85 days');

INSERT INTO audit_followup (id, audit_id, finding_id, assigned_to_id, due_date, status, evidence_url, completion_notes, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     (SELECT id FROM audit_findings WHERE title = 'Inadequate Security Awareness Training' LIMIT 1),
     (SELECT id FROM users WHERE email = 'hr.head@company.com' LIMIT 1),
     NOW() + INTERVAL '60 days',
     'PENDING',
     NULL,
     'New training platform selected. Content development in progress. Launch scheduled for January 2025.',
     NOW() - INTERVAL '80 days');

-- Follow-ups for Audit 1 (Closed Finance Audit) - Completed
INSERT INTO audit_followup (id, audit_id, finding_id, assigned_to_id, due_date, status, evidence_url, completion_notes, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     (SELECT id FROM audit_findings WHERE title = 'Inadequate Segregation of Duties in Payment Processing' LIMIT 1),
     (SELECT id FROM users WHERE email = 'finance.head@company.com' LIMIT 1),
     NOW() - INTERVAL '10 days',
     'COMPLETED',
     '/evidence/followup/segregation_of_duties_implementation.pdf',
     'System controls implemented successfully. Payment initiation, approval, and processing now assigned to different individuals. Dual authorization configured for payments over $10,000. Additional staff member hired and trained.',
     NOW() - INTERVAL '115 days');

INSERT INTO audit_followup (id, audit_id, finding_id, assigned_to_id, due_date, status, evidence_url, completion_notes, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     (SELECT id FROM audit_findings WHERE title = 'Delayed Bank Reconciliations' LIMIT 1),
     (SELECT id FROM users WHERE email = 'finance.officer@company.com' LIMIT 1),
     NOW() - INTERVAL '15 days',
     'COMPLETED',
     '/evidence/followup/bank_reconciliation_automation.pdf',
     'Automated reconciliation implemented for 3 high-volume accounts. Reconciliation completion time reduced from 20 days to 8 days. Monitoring process established.',
     NOW() - INTERVAL '110 days');

INSERT INTO audit_followup (id, audit_id, finding_id, assigned_to_id, due_date, status, evidence_url, completion_notes, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     (SELECT id FROM audit_findings WHERE title = 'Incomplete Documentation for Journal Entries' LIMIT 1),
     (SELECT id FROM users WHERE email = 'finance.officer@company.com' LIMIT 1),
     NOW() - INTERVAL '20 days',
     'COMPLETED',
     '/evidence/followup/journal_entry_policy.pdf',
     'Policy requiring supporting documentation implemented. System validation configured to prevent posting without documentation. Training completed for all finance staff.',
     NOW() - INTERVAL '105 days');

-- Follow-ups for Audit 3 (HR Reporting) - Mixed status
INSERT INTO audit_followup (id, audit_id, finding_id, assigned_to_id, due_date, status, evidence_url, completion_notes, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     (SELECT id FROM audit_findings WHERE title = 'Incomplete Employee Background Checks' LIMIT 1),
     (SELECT id FROM users WHERE email = 'hr.head@company.com' LIMIT 1),
     NOW() + INTERVAL '90 days',
     'IN_PROGRESS',
     NULL,
     'Retroactive background checks initiated for 18 employees. 12 completed so far with no issues identified. HRIS enhancement in development.',
     NOW() - INTERVAL '70 days');

INSERT INTO audit_followup (id, audit_id, finding_id, assigned_to_id, due_date, status, evidence_url, completion_notes, created_at)
VALUES 
    (gen_random_uuid(), 
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     (SELECT id FROM audit_findings WHERE title = 'Inconsistent Performance Evaluation Process' LIMIT 1),
     (SELECT id FROM users WHERE email = 'hr.officer@company.com' LIMIT 1),
     NOW() + INTERVAL '120 days',
     'PENDING',
     NULL,
     'Performance management module selected. Implementation scheduled for Q1 2025. Manager training program being developed.',
     NOW() - INTERVAL '65 days');

-- ============================================
-- 12. CREATE WORKFLOWS
-- ============================================

-- Workflow 1: Finance Audit Report Approval - Completed
INSERT INTO workflows (id, reference_number, audit_id, name, description, created_by_id, status, current_step, created_at, completed_at)
VALUES 
    (gen_random_uuid(),
     'WF-2024-001',
     (SELECT id FROM audits WHERE title = 'Annual Financial Controls Audit 2024' LIMIT 1),
     'Finance Audit Report Approval Workflow',
     'Multi-department approval workflow for Annual Financial Controls Audit 2024 final report. Requires review and sign-off from Finance Department Head, Compliance Head, and Audit Manager.',
     (SELECT id FROM users WHERE email = 'manager1@audit.com' LIMIT 1),
     'COMPLETED',
     3,
     NOW() - INTERVAL '100 days',
     NOW() - INTERVAL '92 days');

-- Workflow 2: IT Security Audit Report Approval - In Progress
INSERT INTO workflows (id, reference_number, audit_id, name, description, created_by_id, status, current_step, created_at, completed_at)
VALUES 
    (gen_random_uuid(),
     'WF-2024-002',
     (SELECT id FROM audits WHERE title = 'IT Security & Data Protection Audit' LIMIT 1),
     'IT Security Audit Report Approval Workflow',
     'Approval workflow for IT Security & Data Protection Audit report. Requires review from IT Department Head, Compliance Head, Legal Department Head, and final approval from Audit Manager.',
     (SELECT id FROM users WHERE email = 'manager2@audit.com' LIMIT 1),
     'IN_PROGRESS',
     2,
     NOW() - INTERVAL '70 days',
     NULL);

-- Workflow 3: HR Audit Report Approval - Pending
INSERT INTO workflows (id, reference_number, audit_id, name, description, created_by_id, status, current_step, created_at, completed_at)
VALUES 
    (gen_random_uuid(),
     'WF-2024-003',
     (SELECT id FROM audits WHERE title = 'Human Resources Compliance Audit' LIMIT 1),
     'HR Compliance Audit Report Approval Workflow',
     'Approval workflow for Human Resources Compliance Audit report. Requires review from HR Department Head, Legal Department Head, and Audit Manager approval.',
     (SELECT id FROM users WHERE email = 'manager1@audit.com' LIMIT 1),
     'PENDING',
     0,
     NOW() - INTERVAL '12 days',
     NULL);

-- Workflow 4: Operations Audit Planning Approval - In Progress
INSERT INTO workflows (id, reference_number, audit_id, name, description, created_by_id, status, current_step, created_at, completed_at)
VALUES 
    (gen_random_uuid(),
     'WF-2024-004',
     (SELECT id FROM audits WHERE title = 'Operational Efficiency & Process Audit' LIMIT 1),
     'Operations Audit Planning Approval',
     'Approval workflow for Operations audit planning documents and scope. Requires acknowledgment from Operations Head and approval from Audit Manager.',
     (SELECT id FROM users WHERE email = 'manager2@audit.com' LIMIT 1),
     'IN_PROGRESS',
     1,
     NOW() - INTERVAL '52 days',
     NULL);

-- Workflow 5: Procurement Audit Planning - Pending
INSERT INTO workflows (id, reference_number, audit_id, name, description, created_by_id, status, current_step, created_at, completed_at)
VALUES 
    (gen_random_uuid(),
     'WF-2025-001',
     (SELECT id FROM audits WHERE title = 'Procurement & Vendor Management Audit' LIMIT 1),
     'Procurement Audit Planning Approval',
     'Approval workflow for Procurement audit planning and scope definition. Requires review from Procurement Head, Finance Head, and Audit Manager.',
     (SELECT id FROM users WHERE email = 'manager1@audit.com' LIMIT 1),
     'PENDING',
     0,
     NOW() - INTERVAL '8 days',
     NULL);

-- Workflow 6: Compliance Audit Interim Report - In Progress
INSERT INTO workflows (id, reference_number, audit_id, name, description, created_by_id, status, current_step, created_at, completed_at)
VALUES 
    (gen_random_uuid(),
     'WF-2024-005',
     (SELECT id FROM audits WHERE title = 'Regulatory Compliance & Risk Assessment' LIMIT 1),
     'Compliance Audit Interim Report Review',
     'Review workflow for interim findings from Regulatory Compliance & Risk Assessment audit. Requires review from Compliance Head and acknowledgment from Legal Head.',
     (SELECT id FROM users WHERE email = 'manager2@audit.com' LIMIT 1),
     'IN_PROGRESS',
     1,
     NOW() - INTERVAL '25 days',
     NULL);

-- ============================================
-- 13. CREATE WORKFLOW STEPS
-- ============================================

-- Steps for Workflow 1 (Finance Audit - Completed)
INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, started_at, completed_at, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT id FROM workflows WHERE reference_number = 'WF-2024-001' LIMIT 1),
     1,
     (SELECT id FROM departments WHERE name = 'Finance Department' LIMIT 1),
     (SELECT id FROM users WHERE email = 'finance.head@company.com' LIMIT 1),
     'review_and_approve',
     'APPROVED',
     NOW() - INTERVAL '93 days',
     NOW() - INTERVAL '100 days',
     NOW() - INTERVAL '97 days',
     NOW() - INTERVAL '100 days');

INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, started_at, completed_at, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT id FROM workflows WHERE reference_number = 'WF-2024-001' LIMIT 1),
     2,
     (SELECT id FROM departments WHERE name = 'Compliance & Risk' LIMIT 1),
     (SELECT id FROM users WHERE email = 'compliance.head@company.com' LIMIT 1),
     'review_and_approve',
     'APPROVED',
     NOW() - INTERVAL '90 days',
     NOW() - INTERVAL '97 days',
     NOW() - INTERVAL '94 days',
     NOW() - INTERVAL '100 days');

INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, started_at, completed_at, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT id FROM workflows WHERE reference_number = 'WF-2024-001' LIMIT 1),
     3,
     (SELECT id FROM departments WHERE name = 'Internal Audit' LIMIT 1),
     (SELECT id FROM users WHERE email = 'manager1@audit.com' LIMIT 1),
     'final_sign_off',
     'APPROVED',
     NOW() - INTERVAL '87 days',
     NOW() - INTERVAL '94 days',
     NOW() - INTERVAL '92 days',
     NOW() - INTERVAL '100 days');

-- Steps for Workflow 2 (IT Security - In Progress)
INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, started_at, completed_at, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT id FROM workflows WHERE reference_number = 'WF-2024-002' LIMIT 1),
     1,
     (SELECT id FROM departments WHERE name = 'Information Technology' LIMIT 1),
     (SELECT id FROM users WHERE email = 'it.head@company.com' LIMIT 1),
     'review_and_approve',
     'APPROVED',
     NOW() - INTERVAL '63 days',
     NOW() - INTERVAL '70 days',
     NOW() - INTERVAL '65 days',
     NOW() - INTERVAL '70 days');

INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, started_at, completed_at, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT id FROM workflows WHERE reference_number = 'WF-2024-002' LIMIT 1),
     2,
     (SELECT id FROM departments WHERE name = 'Compliance & Risk' LIMIT 1),
     (SELECT id FROM users WHERE email = 'compliance.head@company.com' LIMIT 1),
     'review_and_approve',
     'IN_PROGRESS',
     NOW() + INTERVAL '5 days',
     NOW() - INTERVAL '5 days',
     NULL,
     NOW() - INTERVAL '70 days');

INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, started_at, completed_at, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT id FROM workflows WHERE reference_number = 'WF-2024-002' LIMIT 1),
     3,
     (SELECT id FROM departments WHERE name = 'Legal Department' LIMIT 1),
     (SELECT id FROM users WHERE email = 'legal.head@company.com' LIMIT 1),
     'review_and_approve',
     'PENDING',
     NOW() + INTERVAL '12 days',
     NULL,
     NULL,
     NOW() - INTERVAL '70 days');

INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, started_at, completed_at, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT id FROM workflows WHERE reference_number = 'WF-2024-002' LIMIT 1),
     4,
     (SELECT id FROM departments WHERE name = 'Internal Audit' LIMIT 1),
     (SELECT id FROM users WHERE email = 'manager2@audit.com' LIMIT 1),
     'final_sign_off',
     'PENDING',
     NOW() + INTERVAL '19 days',
     NULL,
     NULL,
     NOW() - INTERVAL '70 days');

-- Steps for Workflow 3 (HR Audit - Pending)
INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, started_at, completed_at, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT id FROM workflows WHERE reference_number = 'WF-2024-003' LIMIT 1),
     1,
     (SELECT id FROM departments WHERE name = 'Human Resources' LIMIT 1),
     (SELECT id FROM users WHERE email = 'hr.head@company.com' LIMIT 1),
     'review_and_approve',
     'PENDING',
     NOW() + INTERVAL '18 days',
     NULL,
     NULL,
     NOW() - INTERVAL '12 days');

INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, started_at, completed_at, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT id FROM workflows WHERE reference_number = 'WF-2024-003' LIMIT 1),
     2,
     (SELECT id FROM departments WHERE name = 'Legal Department' LIMIT 1),
     (SELECT id FROM users WHERE email = 'legal.head@company.com' LIMIT 1),
     'review_and_approve',
     'PENDING',
     NOW() + INTERVAL '25 days',
     NULL,
     NULL,
     NOW() - INTERVAL '12 days');

INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, started_at, completed_at, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT id FROM workflows WHERE reference_number = 'WF-2024-003' LIMIT 1),
     3,
     (SELECT id FROM departments WHERE name = 'Internal Audit' LIMIT 1),
     (SELECT id FROM users WHERE email = 'manager1@audit.com' LIMIT 1),
     'final_sign_off',
     'PENDING',
     NOW() + INTERVAL '32 days',
     NULL,
     NULL,
     NOW() - INTERVAL '12 days');

-- Steps for Workflow 4 (Operations Planning - In Progress)
INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, started_at, completed_at, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT id FROM workflows WHERE reference_number = 'WF-2024-004' LIMIT 1),
     1,
     (SELECT id FROM departments WHERE name = 'Operations' LIMIT 1),
     (SELECT id FROM users WHERE email = 'ops.head@company.com' LIMIT 1),
     'review_and_approve',
     'IN_PROGRESS',
     NOW() + INTERVAL '8 days',
     NOW() - INTERVAL '3 days',
     NULL,
     NOW() - INTERVAL '52 days');

INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, started_at, completed_at, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT id FROM workflows WHERE reference_number = 'WF-2024-004' LIMIT 1),
     2,
     (SELECT id FROM departments WHERE name = 'Internal Audit' LIMIT 1),
     (SELECT id FROM users WHERE email = 'manager2@audit.com' LIMIT 1),
     'final_sign_off',
     'PENDING',
     NOW() + INTERVAL '15 days',
     NULL,
     NULL,
     NOW() - INTERVAL '52 days');

-- Steps for Workflow 5 (Procurement Planning - Pending)
INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, started_at, completed_at, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT id FROM workflows WHERE reference_number = 'WF-2025-001' LIMIT 1),
     1,
     (SELECT id FROM departments WHERE name = 'Procurement' LIMIT 1),
     (SELECT id FROM users WHERE email = 'procurement.head@company.com' LIMIT 1),
     'review_and_approve',
     'PENDING',
     NOW() + INTERVAL '22 days',
     NULL,
     NULL,
     NOW() - INTERVAL '8 days');

INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, started_at, completed_at, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT id FROM workflows WHERE reference_number = 'WF-2025-001' LIMIT 1),
     2,
     (SELECT id FROM departments WHERE name = 'Finance Department' LIMIT 1),
     (SELECT id FROM users WHERE email = 'finance.head@company.com' LIMIT 1),
     'review_and_approve',
     'PENDING',
     NOW() + INTERVAL '29 days',
     NULL,
     NULL,
     NOW() - INTERVAL '8 days');

INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, started_at, completed_at, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT id FROM workflows WHERE reference_number = 'WF-2025-001' LIMIT 1),
     3,
     (SELECT id FROM departments WHERE name = 'Internal Audit' LIMIT 1),
     (SELECT id FROM users WHERE email = 'manager1@audit.com' LIMIT 1),
     'final_sign_off',
     'PENDING',
     NOW() + INTERVAL '36 days',
     NULL,
     NULL,
     NOW() - INTERVAL '8 days');

-- Steps for Workflow 6 (Compliance Interim - In Progress)
INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, started_at, completed_at, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT id FROM workflows WHERE reference_number = 'WF-2024-005' LIMIT 1),
     1,
     (SELECT id FROM departments WHERE name = 'Compliance & Risk' LIMIT 1),
     (SELECT id FROM users WHERE email = 'compliance.head@company.com' LIMIT 1),
     'review_and_approve',
     'IN_PROGRESS',
     NOW() + INTERVAL '5 days',
     NOW() - INTERVAL '2 days',
     NULL,
     NOW() - INTERVAL '25 days');

INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date, started_at, completed_at, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT id FROM workflows WHERE reference_number = 'WF-2024-005' LIMIT 1),
     2,
     (SELECT id FROM departments WHERE name = 'Legal Department' LIMIT 1),
     (SELECT id FROM users WHERE email = 'legal.head@company.com' LIMIT 1),
     'review_and_approve',
     'PENDING',
     NOW() + INTERVAL '12 days',
     NULL,
     NULL,
     NOW() - INTERVAL '25 days');

-- ============================================
-- 14. CREATE WORKFLOW APPROVALS
-- ============================================

-- Approvals for Workflow 1 (Finance Audit - Completed)
INSERT INTO workflow_approvals (id, workflow_step_id, user_id, action, comments, signature_data, ip_address, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT ws.id FROM workflow_steps ws 
      JOIN workflows w ON ws.workflow_id = w.id 
      WHERE w.reference_number = 'WF-2024-001' AND ws.step_order = 1),
     (SELECT id FROM users WHERE email = 'finance.head@company.com' LIMIT 1),
     'APPROVED',
     'Reviewed the audit findings and management responses. All findings are accurate and action plans are appropriate. Approved for next level review.',
     'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
     '192.168.1.100',
     NOW() - INTERVAL '97 days');

INSERT INTO workflow_approvals (id, workflow_step_id, user_id, action, comments, signature_data, ip_address, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT ws.id FROM workflow_steps ws 
      JOIN workflows w ON ws.workflow_id = w.id 
      WHERE w.reference_number = 'WF-2024-001' AND ws.step_order = 2),
     (SELECT id FROM users WHERE email = 'compliance.head@company.com' LIMIT 1),
     'APPROVED',
     'Compliance review completed. The audit findings align with our regulatory compliance framework. No additional compliance concerns identified. Approved.',
     'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
     '192.168.1.105',
     NOW() - INTERVAL '94 days');

INSERT INTO workflow_approvals (id, workflow_step_id, user_id, action, comments, signature_data, ip_address, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT ws.id FROM workflow_steps ws 
      JOIN workflows w ON ws.workflow_id = w.id 
      WHERE w.reference_number = 'WF-2024-001' AND ws.step_order = 3),
     (SELECT id FROM users WHERE email = 'manager1@audit.com' LIMIT 1),
     'SIGNED',
     'Final review completed. Report is comprehensive and findings are well-documented. Approved for publication to Audit Committee and management.',
     'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
     '192.168.1.50',
     NOW() - INTERVAL '92 days');

-- Approvals for Workflow 2 (IT Security - In Progress)
INSERT INTO workflow_approvals (id, workflow_step_id, user_id, action, comments, signature_data, ip_address, created_at)
VALUES 
    (gen_random_uuid(),
     (SELECT ws.id FROM workflow_steps ws 
      JOIN workflows w ON ws.workflow_id = w.id 
      WHERE w.reference_number = 'WF-2024-002' AND ws.step_order = 1),
     (SELECT id FROM users WHERE email = 'it.head@company.com' LIMIT 1),
     'APPROVED',
     'IT Department has reviewed all findings. While the findings are significant, we have developed comprehensive action plans to address each issue. We request follow-up audit in Q2 2025 to verify implementation. Approved with action plans attached.',
     'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
     '192.168.1.110',
     NOW() - INTERVAL '65 days');

-- Current step (Step 2) has no approval yet - in progress

-- Approvals for Workflow 4 (Operations Planning - In Progress)
-- Step 1 is in progress, no approval yet

-- ============================================
-- 15. VERIFICATION QUERIES
-- ============================================

-- Count summary
SELECT 
    'Departments' as entity, COUNT(*) as count FROM departments
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Audits', COUNT(*) FROM audits
UNION ALL
SELECT 'Audit Team Members', COUNT(*) FROM audit_team
UNION ALL
SELECT 'Work Program Items', COUNT(*) FROM audit_work_program
UNION ALL
SELECT 'Evidence Files', COUNT(*) FROM audit_evidence
UNION ALL
SELECT 'Findings', COUNT(*) FROM audit_findings
UNION ALL
SELECT 'Queries', COUNT(*) FROM audit_queries
UNION ALL
SELECT 'Reports', COUNT(*) FROM audit_reports
UNION ALL
SELECT 'Follow-up Items', COUNT(*) FROM audit_followup
UNION ALL
SELECT 'Workflows', COUNT(*) FROM workflows
UNION ALL
SELECT 'Workflow Steps', COUNT(*) FROM workflow_steps
UNION ALL
SELECT 'Workflow Approvals', COUNT(*) FROM workflow_approvals;

-- ============================================
-- SUMMARY OF CREATED DATA
-- ============================================
/*
DEPARTMENTS (10):
- Internal Audit
- Finance Department
- Human Resources
- Information Technology
- Operations
- Compliance & Risk
- Procurement
- Legal Department
- Marketing
- Sales

USERS (20):
- 1 System Admin
- 2 Audit Managers
- 4 Auditors
- 7 Department Heads
- 4 Department Officers
- 2 Viewers

AUDITS (7):
- 1 Closed (Finance 2024)
- 1 Follow-up (IT Security)
- 1 Reporting (HR)
- 2 Executing (Operations, Compliance)
- 2 Planned (Procurement, Legal)

AUDIT COMPONENTS:
- 15 Audit Team assignments
- 28 Work Program items (various statuses)
- 20 Evidence files
- 13 Findings (various severities)
- 9 Queries with responses
- 4 Reports (various statuses)
- 11 Follow-up items (various statuses)

WORKFLOWS (6):
- 1 Completed workflow (Finance Audit Report)
- 3 In Progress workflows (IT Security, Operations Planning, Compliance Interim)
- 2 Pending workflows (HR Audit, Procurement Planning)
- 20 Workflow steps across all workflows
- 4 Workflow approvals

PRESENTATION READY:
✓ Dashboard will show audit statistics and status distribution
✓ Planning page will show planned audits with details
✓ Audits page will show all audits in various stages
✓ Each audit detail page will have:
  - Team members
  - Work program items
  - Evidence files
  - Findings with severity levels
  - Queries and responses
  - Reports in various statuses
✓ Follow-ups page will show active follow-up items
✓ Workflows page will show workflows in various states
✓ My Tasks will show pending approvals for each user
✓ Analytics will have data across multiple audits and departments
✓ Reports page will show reports in different statuses

ROLE-SPECIFIC VIEWS:
✓ System Admin: Full access to all data
✓ Audit Managers: Can see all audits they manage
✓ Auditors: Can see audits they're assigned to
✓ Department Heads: Can see audits for their departments and pending approvals
✓ Department Officers: Can see relevant department audits
✓ Viewers: Read-only access to published reports

All data uses gen_random_uuid() for UUID generation as per PostgreSQL standards.
All timestamps are relative to NOW() for realistic date ranges.
All foreign key relationships are properly maintained.
*/

-- ============================================
-- END OF SCRIPT
-- ============================================
