-- ============================================================================
-- AUDIT MANAGEMENT SYSTEM - Seed Data
-- ============================================================================
-- Run this script after 01-init.sql to populate the database with initial
-- configuration, reference data, and sample transactional data.
-- ============================================================================

-- ============================================================================
-- 1. DEPARTMENTS
-- ============================================================================
INSERT INTO departments (id, name, created_at) VALUES 
('c629bf50-2886-4381-8098-2b71e630fccb', 'Executive Management', NOW()),
('d15dfecd-0c64-4b07-9cb3-3aeb7ab7d365', 'Information Technology', NOW()),
('7c6be350-9f80-4b07-84ad-fc8f9885f4d7', 'Finance & Procurement', NOW()),
('954eea22-bd6e-4805-8f4d-071e89dfae81', 'Human Resources', NOW()),
('38d5ea26-1d5e-4345-8f43-be2febabd54b', 'Operations', NOW())
ON CONFLICT DO NOTHING;

-- Set a parent department for IT
UPDATE departments 
SET parent_department_id = 'c629bf50-2886-4381-8098-2b71e630fccb' 
WHERE id = 'd15dfecd-0c64-4b07-9cb3-3aeb7ab7d365';

-- ============================================================================
-- 2. ISO FRAMEWORKS
-- ============================================================================
INSERT INTO iso_frameworks (id, name, version, description, clauses) VALUES
('18ccbd81-64d1-4518-b528-f5ee02620d74', 'ISO/IEC 27001', '2022', 'Information Security Management System',
 '{"4": "Context of the organization", "5": "Leadership", "6": "Planning", "7": "Support", "8": "Operation", "9": "Performance evaluation", "10": "Improvement"}'),
('144e5cbb-e314-4b25-a065-7576d2434e70', 'ISO 9001', '2015', 'Quality Management System',
 '{"4": "Context", "5": "Leadership", "6": "Planning", "7": "Support", "8": "Operation", "9": "Performance evaluation", "10": "Improvement"}'),
('4be10aa7-d715-4177-a7ec-b2c1f3557c8a', 'ISO 31000', '2018', 'Risk Management Guidelines',
 '{"4": "Principles", "5": "Framework", "6": "Process"}')
ON CONFLICT (name) DO NOTHING;

-- ============================================================================
-- 3. USERS
-- ============================================================================
INSERT INTO users (id, email, full_name, role, department_id, is_active) VALUES
('5dda1bb4-bcce-4b2f-b13c-de85c767a4e3', 'admin@auditsystem.com', 'System Administrator', 'system_admin', 'd15dfecd-0c64-4b07-9cb3-3aeb7ab7d365', true),
('4da95b9e-bbf5-42ad-a6e1-843c1b14d9cc', 'manager@auditsystem.com', 'Audit Manager', 'audit_manager', 'c629bf50-2886-4381-8098-2b71e630fccb', true),
('008b1991-11ee-4439-b690-cd779fb7fda8', 'auditor1@auditsystem.com', 'Senior Auditor', 'auditor', 'c629bf50-2886-4381-8098-2b71e630fccb', true),
('648b968f-12f6-4e46-aeef-8c91d51447b6', 'auditor2@auditsystem.com', 'IT Auditor', 'auditor', 'c629bf50-2886-4381-8098-2b71e630fccb', true),
('8ac1b068-9a88-4ef4-9ce6-167615d85275', 'it.head@auditsystem.com', 'IT Director', 'department_head', 'd15dfecd-0c64-4b07-9cb3-3aeb7ab7d365', true),
('55e34ac6-2eee-4a70-a65e-6efe64c88224', 'finance.head@auditsystem.com', 'CFO', 'department_head', '7c6be350-9f80-4b07-84ad-fc8f9885f4d7', true),
('39369adf-f3f3-431c-9dda-89dbfb506949', 'ops.officer@auditsystem.com', 'Operations Officer', 'department_officer', '38d5ea26-1d5e-4345-8f43-be2febabd54b', true)
ON CONFLICT (email) DO NOTHING;

-- ============================================================================
-- 4. ROLE MATRIX & ASSIGNMENTS
-- ============================================================================
INSERT INTO role_matrix (id, role_name, role_category, role_description, is_global_role,
    can_create_audits, can_view_all_audits, can_view_assigned_audits, can_edit_audits,
    can_delete_audits, can_approve_reports, can_manage_users, can_manage_departments,
    can_view_analytics, can_export_data, can_create_risks, can_assess_risks,
    can_create_capa, can_assign_capa, can_close_capa, can_upload_documents,
    can_approve_documents, can_manage_assets, can_manage_vendors, created_by_id)
VALUES
('8eb2c184-877f-4d3e-90b1-dc15c6f80fab', 'System Administrator Role', 'Administrative', 'Full system access', true,
    true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, true, '5dda1bb4-bcce-4b2f-b13c-de85c767a4e3'),
('799847f0-357c-4cdb-86d3-330fd465927b', 'Audit Manager Role', 'Audit', 'Can manage all audits', true,
    true, true, true, true, false, true, false, false, true, true, true, true, true, true, true, true, true, true, true, '5dda1bb4-bcce-4b2f-b13c-de85c767a4e3')
ON CONFLICT (role_name) DO NOTHING;

INSERT INTO user_role_assignments (id, user_id, role_id, assigned_by_id, is_active) VALUES
('2af87ed8-0e40-475c-99f6-43e122be2d45', '5dda1bb4-bcce-4b2f-b13c-de85c767a4e3', '8eb2c184-877f-4d3e-90b1-dc15c6f80fab', '5dda1bb4-bcce-4b2f-b13c-de85c767a4e3', true),
('1e9d2428-42f8-498c-a03e-5a5103fa50af', '4da95b9e-bbf5-42ad-a6e1-843c1b14d9cc', '799847f0-357c-4cdb-86d3-330fd465927b', '5dda1bb4-bcce-4b2f-b13c-de85c767a4e3', true);

-- ============================================================================
-- 5. AUDIT PROGRAMMES
-- ============================================================================
INSERT INTO audit_programmes (id, programme_name, programme_year, programme_objectives, programme_manager_id, status, created_by_id)
VALUES
('a11eda3e-5d93-414f-93fb-554deee5a935', 'Annual Corporate Audit Programme', 2026, 'Ensure continuous compliance with ISO standards across all departments globally.', '4da95b9e-bbf5-42ad-a6e1-843c1b14d9cc', 'active', '4da95b9e-bbf5-42ad-a6e1-843c1b14d9cc'),
('cecfcf7b-edc4-499a-9aa8-91ef95e048fb', 'Q3 IT Risk Assessment Programme', 2026, 'Review core IT infrastructure risks against ISMS objectives.', '4da95b9e-bbf5-42ad-a6e1-843c1b14d9cc', 'planning', '4da95b9e-bbf5-42ad-a6e1-843c1b14d9cc');

-- ============================================================================
-- 6. AUDITS
-- ============================================================================
INSERT INTO audits (id, title, year, scope, risk_rating, status, assigned_manager_id, created_by_id, department_id, audit_programme_id, start_date, end_date)
VALUES
('1d2044cf-dc77-4d21-b0cd-46ee6f2099d5', 'Q1 IT General Controls Audit', 2026, 'Review of access controls, change management, and IT operations.', 'HIGH', 'EXECUTING', '4da95b9e-bbf5-42ad-a6e1-843c1b14d9cc', '4da95b9e-bbf5-42ad-a6e1-843c1b14d9cc', 'd15dfecd-0c64-4b07-9cb3-3aeb7ab7d365', 'a11eda3e-5d93-414f-93fb-554deee5a935', NOW() - INTERVAL '10 days', NOW() + INTERVAL '5 days'),
('053073b4-abe5-4d02-8023-53b0434531c7', 'Finance ISO 9001 Compliance Audit', 2026, 'Comprehensive evaluation of finance processes against quality standards.', 'MEDIUM', 'PLANNED', '4da95b9e-bbf5-42ad-a6e1-843c1b14d9cc', '4da95b9e-bbf5-42ad-a6e1-843c1b14d9cc', '7c6be350-9f80-4b07-84ad-fc8f9885f4d7', 'a11eda3e-5d93-414f-93fb-554deee5a935', NOW() + INTERVAL '30 days', NOW() + INTERVAL '40 days'),
('dfd99d2f-ef2f-4481-9a60-7362751e9cbd', 'HR Onboarding & Offboarding Audit', 2025, 'Review of HR processes regarding employee lifecycle changes.', 'LOW', 'CLOSED', '4da95b9e-bbf5-42ad-a6e1-843c1b14d9cc', '4da95b9e-bbf5-42ad-a6e1-843c1b14d9cc', '954eea22-bd6e-4805-8f4d-071e89dfae81', 'a11eda3e-5d93-414f-93fb-554deee5a935', NOW() - INTERVAL '100 days', NOW() - INTERVAL '90 days');

-- ============================================================================
-- 7. AUDIT TEAM
-- ============================================================================
INSERT INTO audit_team (audit_id, user_id, role_in_audit) VALUES
('1d2044cf-dc77-4d21-b0cd-46ee6f2099d5', '008b1991-11ee-4439-b690-cd779fb7fda8', 'Lead Auditor'),
('1d2044cf-dc77-4d21-b0cd-46ee6f2099d5', '648b968f-12f6-4e46-aeef-8c91d51447b6', 'Auditor'),
('053073b4-abe5-4d02-8023-53b0434531c7', '008b1991-11ee-4439-b690-cd779fb7fda8', 'Lead Auditor'),
('dfd99d2f-ef2f-4481-9a60-7362751e9cbd', '648b968f-12f6-4e46-aeef-8c91d51447b6', 'Lead Auditor');

-- ============================================================================
-- 8. AUDIT WORK PROGRAM
-- ============================================================================
INSERT INTO audit_work_program (id, audit_id, procedure_name, description, status) VALUES
('683c0ed0-b29b-4844-a646-e3e37e2032ae', '1d2044cf-dc77-4d21-b0cd-46ee6f2099d5', 'Access Control Review', 'Review active user accounts against HR roster.', 'completed'),
('ecdcbc3e-ccdf-46df-9971-e4d4923ad2f6', '1d2044cf-dc77-4d21-b0cd-46ee6f2099d5', 'Change Management Sampling', 'Sample 10 recent production changes for proper approvals.', 'in_progress'),
('6fc35adc-433e-4108-96b3-5f5638543f27', '1d2044cf-dc77-4d21-b0cd-46ee6f2099d5', 'Incident Response Trace', 'Trace 3 high severity incidents from declaration to resolution.', 'pending');

-- ============================================================================
-- 9. AUDIT CHECKLISTS
-- ============================================================================
INSERT INTO audit_checklists (id, audit_id, framework_id, clause_reference, clause_title, description, compliance_status, compliance_score, assessed_by_id) VALUES
('657b874f-6686-4f47-a57c-895a33566c2f', '1d2044cf-dc77-4d21-b0cd-46ee6f2099d5', '18ccbd81-64d1-4518-b528-f5ee02620d74', 'A.9.2.1', 'User registration and de-registration', 'Formal process for granting/revoking access.', 'PARTIALLY_COMPLIANT', 60, '648b968f-12f6-4e46-aeef-8c91d51447b6'),
('8d55a8c1-83f8-4b51-b6c9-55ad762f160c', '1d2044cf-dc77-4d21-b0cd-46ee6f2099d5', '18ccbd81-64d1-4518-b528-f5ee02620d74', 'A.9.2.2', 'User access provisioning', 'Timely creation/removal of system accesses.', 'NON_COMPLIANT', 30, '648b968f-12f6-4e46-aeef-8c91d51447b6'),
('27ae277d-e827-440f-ab2b-d07c17d17d96', '053073b4-abe5-4d02-8023-53b0434531c7', '144e5cbb-e314-4b25-a065-7576d2434e70', '7.1.6', 'Organizational knowledge', 'Organization shall determine knowledge necessary for operation.', 'NOT_ASSESSED', 0, NULL);

-- ============================================================================
-- 10. AUDIT FINDINGS
-- ============================================================================
INSERT INTO audit_findings (id, audit_id, title, severity, impact, root_cause, recommendation, status, assigned_to_id) VALUES
('970b86cc-294f-4d07-b3c4-092a0d983166', '1d2044cf-dc77-4d21-b0cd-46ee6f2099d5', 'Terminated users retaining access', 'HIGH', 'Unauthorized access to production systems by ex-employees.', 'Lack of automated de-provisioning.', 'Integrate HR system with IAM for automated offboarding.', 'open', '8ac1b068-9a88-4ef4-9ce6-167615d85275'),
('537e0b68-be84-4a06-a561-dab09b9d350a', 'dfd99d2f-ef2f-4481-9a60-7362751e9cbd', 'Missing non-disclosure agreements', 'MEDIUM', 'Potential confidentiality breach.', 'Oversight during rapid hiring.', 'Mandatory checklist enforcement before system access.', 'closed', '648b968f-12f6-4e46-aeef-8c91d51447b6');

-- ============================================================================
-- 11. AUDIT FOLLOWUP
-- ============================================================================
INSERT INTO audit_followup (audit_id, finding_id, assigned_to_id, due_date, status, completion_notes) VALUES
('1d2044cf-dc77-4d21-b0cd-46ee6f2099d5', '970b86cc-294f-4d07-b3c4-092a0d983166', '8ac1b068-9a88-4ef4-9ce6-167615d85275', NOW() + INTERVAL '30 days', 'pending', NULL),
('dfd99d2f-ef2f-4481-9a60-7362751e9cbd', '537e0b68-be84-4a06-a561-dab09b9d350a', '648b968f-12f6-4e46-aeef-8c91d51447b6', NOW() - INTERVAL '10 days', 'completed', 'All 15 missing NDAs have been signed and uploaded.');

-- ============================================================================
-- 12. AUDIT REPORTS
-- ============================================================================
INSERT INTO audit_reports (id, audit_id, version, content, status, created_by_id) VALUES
('f6ee3480-5d1c-4785-b491-67f02ea46acc', 'dfd99d2f-ef2f-4481-9a60-7362751e9cbd', 1, '<h1>HR Audit Report</h1><p>We conducted an audit of HR operations and found 1 medium finding.</p>', 'PUBLISHED', '648b968f-12f6-4e46-aeef-8c91d51447b6'),
('4678f2cc-fc10-4472-b176-bc5e09208a8d', '1d2044cf-dc77-4d21-b0cd-46ee6f2099d5', 1, '<h1>IT GC Audit Report (Draft)</h1><p>Work is ongoing, initial finding identified.</p>', 'DRAFT', '008b1991-11ee-4439-b690-cd779fb7fda8');

-- ============================================================================
-- 13. WORKFLOWS & WORKFLOW STEPS
-- ============================================================================
INSERT INTO workflows (id, reference_number, audit_id, name, description, created_by_id, status) VALUES
('3a2b2b55-3de4-4690-9274-d2b80be37193', 'WF-2026-001', '1d2044cf-dc77-4d21-b0cd-46ee6f2099d5', 'IT GC Report Approval', 'Approval workflow for the IT General Controls audit report.', '008b1991-11ee-4439-b690-cd779fb7fda8', 'IN_PROGRESS');

INSERT INTO workflow_steps (id, workflow_id, step_order, department_id, assigned_to_id, action_required, status, due_date) VALUES
('c05070e2-2605-410f-a6d0-c26f753535a7', '3a2b2b55-3de4-4690-9274-d2b80be37193', 1, 'c629bf50-2886-4381-8098-2b71e630fccb', '4da95b9e-bbf5-42ad-a6e1-843c1b14d9cc', 'review_and_approve', 'PENDING', NOW() + INTERVAL '7 days');

-- ============================================================================
-- 14. ASSETS & ASSIGNMENTS
-- ============================================================================
INSERT INTO assets (id, asset_name, asset_category, criticality_level, location, status, owner_id, department_id) VALUES
('662a9b18-b1f4-4c7f-84a0-0976878b14cd', 'Primary Database Server', 'Hardware', 'Critical', 'Data Center A', 'ACTIVE', '8ac1b068-9a88-4ef4-9ce6-167615d85275', 'd15dfecd-0c64-4b07-9cb3-3aeb7ab7d365'),
('5d27d9fd-e9d8-4a2e-80b4-c49b486c8cc5', 'Audit Management System Codebase', 'Software', 'High', 'GitHub Repository', 'ACTIVE', '5dda1bb4-bcce-4b2f-b13c-de85c767a4e3', 'd15dfecd-0c64-4b07-9cb3-3aeb7ab7d365'),
('dd835ab8-7c57-4dcd-9f70-5bd3f3316059', 'CFO Laptop', 'Hardware', 'Medium', 'Headquarters', 'ACTIVE', '55e34ac6-2eee-4a70-a65e-6efe64c88224', '7c6be350-9f80-4b07-84ad-fc8f9885f4d7');

INSERT INTO asset_assignments (id, asset_id, user_id, assigned_by_id, is_active) VALUES
('0016919a-e5b4-4e9d-af21-f14f83f10732', 'dd835ab8-7c57-4dcd-9f70-5bd3f3316059', '55e34ac6-2eee-4a70-a65e-6efe64c88224', '5dda1bb4-bcce-4b2f-b13c-de85c767a4e3', true);

-- ============================================================================
-- 15. RISK ASSESSMENTS & CONTROLS
-- ============================================================================
INSERT INTO risk_assessments (id, audit_id, asset_id, risk_title, description, likelihood_score, impact_score, risk_rating, risk_category, status, risk_owner_id, created_by_id) VALUES
('e4efa2ec-9e5d-49bc-a69f-63ae2ee6e9ab', '1d2044cf-dc77-4d21-b0cd-46ee6f2099d5', '662a9b18-b1f4-4c7f-84a0-0976878b14cd', 'Unauthorized Database Access', 'Risk of ex-employees retaining database credentials.', 4, 5, 20, 'HIGH', 'active', '8ac1b068-9a88-4ef4-9ce6-167615d85275', '648b968f-12f6-4e46-aeef-8c91d51447b6'),
('2e91a6a8-96a1-4ff1-af45-27f5f29c1042', NULL, 'dd835ab8-7c57-4dcd-9f70-5bd3f3316059', 'Laptop Theft', 'Physical theft of CFO laptop containing financial data.', 2, 4, 8, 'MEDIUM', 'active', '55e34ac6-2eee-4a70-a65e-6efe64c88224', '5dda1bb4-bcce-4b2f-b13c-de85c767a4e3');

INSERT INTO risk_controls (id, risk_id, control_reference, control_title, control_type, implementation_status, effectiveness_rating) VALUES
('a8f7749c-68e1-4b8c-acad-0f8a8d58df90', 'e4efa2ec-9e5d-49bc-a69f-63ae2ee6e9ab', 'CTRL-001', 'Automated Offboarding Script', 'Preventive', 'planned', NULL),
('42766392-9145-4639-8339-61e4f5560ee1', '2e91a6a8-96a1-4ff1-af45-27f5f29c1042', 'CTRL-002', 'Full Disk Encryption', 'Preventive', 'implemented', 5);

-- ============================================================================
-- 16. CAPA ITEMS
-- ============================================================================
INSERT INTO capa_items (id, capa_number, audit_id, finding_id, risk_id, capa_type, title, description, assigned_to_id, status, priority, due_date) VALUES
('c5ac3b47-037b-45ad-bf39-a84e140334c0', 'CAPA-2026-001', '1d2044cf-dc77-4d21-b0cd-46ee6f2099d5', '970b86cc-294f-4d07-b3c4-092a0d983166', 'e4efa2ec-9e5d-49bc-a69f-63ae2ee6e9ab', 'CORRECTIVE', 'Implement Automated Access Revocation', 'The automated IAM process needs to be completely rolled out to prevent retained access.', '8ac1b068-9a88-4ef4-9ce6-167615d85275', 'OPEN', 'HIGH', NOW() + INTERVAL '45 days'),
('5f8924f9-cad9-4cc1-8249-98b91537da3b', 'CAPA-2025-055', 'dfd99d2f-ef2f-4481-9a60-7362751e9cbd', '537e0b68-be84-4a06-a561-dab09b9d350a', NULL, 'PREVENTIVE', 'Integrate NDA flow in recruitment portal', 'Make NDA signing a hard requirement in the recruitment portal before next steps.', '648b968f-12f6-4e46-aeef-8c91d51447b6', 'CLOSED', 'MEDIUM', NOW() - INTERVAL '5 days');

-- ============================================================================
-- 17. DOCUMENT REPOSITORY
-- ============================================================================
INSERT INTO document_repository (id, document_number, document_name, document_type, version, file_url, file_name, file_hash, approval_status, uploaded_by_id, department_id, is_active) VALUES
('30551e94-1337-478b-bf3b-00c9f554c2f7', 'POL-IT-001', 'Information Security Policy', 'Policy', '1.0', '/uploads/docs/pol_it_001.pdf', 'pol_it_001.pdf', 'hash123', 'APPROVED', '5dda1bb4-bcce-4b2f-b13c-de85c767a4e3', 'd15dfecd-0c64-4b07-9cb3-3aeb7ab7d365', true),
('a58c272a-4eb3-4fd1-bebe-5367ffff68a8', 'PRO-FIN-012', 'Vendor Payment Procedure', 'Procedure', '2.1', '/uploads/docs/pro_fin_012.pdf', 'pro_fin_012.pdf', 'hash456', 'APPROVED', '55e34ac6-2eee-4a70-a65e-6efe64c88224', '7c6be350-9f80-4b07-84ad-fc8f9885f4d7', true);

-- ============================================================================
-- 18. VENDORS, EVALUATIONS & SLAS
-- ============================================================================
INSERT INTO vendors (id, vendor_code, vendor_name, vendor_type, status, risk_rating, created_by_id) VALUES
('e17de810-b2e3-46fa-bfc5-d09fe1833e40', 'V-0001', 'CloudHosting Provider Inc', 'IT Infrastructure', 'active', 'HIGH', '5dda1bb4-bcce-4b2f-b13c-de85c767a4e3'),
('b7f41ff4-3347-4c9e-b58d-203524b71ec2', 'V-0002', 'Office Supplies Co', 'General Supplies', 'active', 'LOW', '55e34ac6-2eee-4a70-a65e-6efe64c88224');

INSERT INTO vendor_evaluations (vendor_id, evaluation_type, overall_score, evaluation_result, evaluated_by_id) VALUES
('e17de810-b2e3-46fa-bfc5-d09fe1833e40', 'Annual Security Review', 85, 'PASSED_WITH_CONDITIONS', '8ac1b068-9a88-4ef4-9ce6-167615d85275');

INSERT INTO vendor_slas (vendor_id, sla_name, start_date, status, created_by_id) VALUES
('e17de810-b2e3-46fa-bfc5-d09fe1833e40', '99.9% Uptime Commitment', NOW() - INTERVAL '1 year', 'active', '8ac1b068-9a88-4ef4-9ce6-167615d85275');

-- ============================================================================
-- 19. GAP ANALYSIS
-- ============================================================================
INSERT INTO gap_analysis (framework_id, requirement_clause, requirement_title, gap_severity, compliance_percentage, gap_status) VALUES
('18ccbd81-64d1-4518-b528-f5ee02620d74', '8.1', 'Operational planning and control', 'MEDIUM', 50, 'identified');

-- END OF SEED DATA
