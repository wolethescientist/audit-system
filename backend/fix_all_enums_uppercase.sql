-- Fix all enums to use UPPERCASE values consistently
-- Run this on your production database

-- 1. Fix compliancestatus enum
DO $$
BEGIN
    ALTER TYPE compliancestatus RENAME VALUE 'not_assessed' TO 'NOT_ASSESSED';
EXCEPTION WHEN others THEN RAISE NOTICE 'not_assessed already renamed or does not exist'; END $$;
DO $$
BEGIN
    ALTER TYPE compliancestatus RENAME VALUE 'compliant' TO 'COMPLIANT';
EXCEPTION WHEN others THEN RAISE NOTICE 'compliant already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE compliancestatus RENAME VALUE 'non_compliant' TO 'NON_COMPLIANT';
EXCEPTION WHEN others THEN RAISE NOTICE 'non_compliant already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE compliancestatus RENAME VALUE 'partially_compliant' TO 'PARTIALLY_COMPLIANT';
EXCEPTION WHEN others THEN RAISE NOTICE 'partially_compliant already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE compliancestatus RENAME VALUE 'not_applicable' TO 'NOT_APPLICABLE';
EXCEPTION WHEN others THEN RAISE NOTICE 'not_applicable already renamed'; END $$;

-- 2. Fix riskcategory enum
DO $$
BEGIN
    ALTER TYPE riskcategory RENAME VALUE 'low' TO 'LOW';
EXCEPTION WHEN others THEN RAISE NOTICE 'low already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE riskcategory RENAME VALUE 'medium' TO 'MEDIUM';
EXCEPTION WHEN others THEN RAISE NOTICE 'medium already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE riskcategory RENAME VALUE 'high' TO 'HIGH';
EXCEPTION WHEN others THEN RAISE NOTICE 'high already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE riskcategory RENAME VALUE 'critical' TO 'CRITICAL';
EXCEPTION WHEN others THEN RAISE NOTICE 'critical already renamed'; END $$;

-- 3. Fix capatype enum
DO $$
BEGIN
    ALTER TYPE capatype RENAME VALUE 'corrective' TO 'CORRECTIVE';
EXCEPTION WHEN others THEN RAISE NOTICE 'corrective already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE capatype RENAME VALUE 'preventive' TO 'PREVENTIVE';
EXCEPTION WHEN others THEN RAISE NOTICE 'preventive already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE capatype RENAME VALUE 'both' TO 'BOTH';
EXCEPTION WHEN others THEN RAISE NOTICE 'both already renamed'; END $$;

-- 4. Fix capastatus enum
DO $$
BEGIN
    ALTER TYPE capastatus RENAME VALUE 'open' TO 'OPEN';
EXCEPTION WHEN others THEN RAISE NOTICE 'open already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE capastatus RENAME VALUE 'in_progress' TO 'IN_PROGRESS';
EXCEPTION WHEN others THEN RAISE NOTICE 'in_progress already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE capastatus RENAME VALUE 'pending_verification' TO 'PENDING_VERIFICATION';
EXCEPTION WHEN others THEN RAISE NOTICE 'pending_verification already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE capastatus RENAME VALUE 'closed' TO 'CLOSED';
EXCEPTION WHEN others THEN RAISE NOTICE 'closed already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE capastatus RENAME VALUE 'overdue' TO 'OVERDUE';
EXCEPTION WHEN others THEN RAISE NOTICE 'overdue already renamed'; END $$;

-- 5. Fix assetstatus enum
DO $$
BEGIN
    ALTER TYPE assetstatus RENAME VALUE 'active' TO 'ACTIVE';
EXCEPTION WHEN others THEN RAISE NOTICE 'active already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE assetstatus RENAME VALUE 'inactive' TO 'INACTIVE';
EXCEPTION WHEN others THEN RAISE NOTICE 'inactive already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE assetstatus RENAME VALUE 'disposed' TO 'DISPOSED';
EXCEPTION WHEN others THEN RAISE NOTICE 'disposed already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE assetstatus RENAME VALUE 'under_maintenance' TO 'UNDER_MAINTENANCE';
EXCEPTION WHEN others THEN RAISE NOTICE 'under_maintenance already renamed'; END $$;

-- 6. Fix workflowstatus enum
DO $$
BEGIN
    ALTER TYPE workflowstatus RENAME VALUE 'pending' TO 'PENDING';
EXCEPTION WHEN others THEN RAISE NOTICE 'pending already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE workflowstatus RENAME VALUE 'in_progress' TO 'IN_PROGRESS';
EXCEPTION WHEN others THEN RAISE NOTICE 'in_progress already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE workflowstatus RENAME VALUE 'approved' TO 'APPROVED';
EXCEPTION WHEN others THEN RAISE NOTICE 'approved already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE workflowstatus RENAME VALUE 'rejected' TO 'REJECTED';
EXCEPTION WHEN others THEN RAISE NOTICE 'rejected already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE workflowstatus RENAME VALUE 'completed' TO 'COMPLETED';
EXCEPTION WHEN others THEN RAISE NOTICE 'completed already renamed'; END $$;

-- 7. Fix approvalaction enum
DO $$
BEGIN
    ALTER TYPE approvalaction RENAME VALUE 'approved' TO 'APPROVED';
EXCEPTION WHEN others THEN RAISE NOTICE 'approved already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE approvalaction RENAME VALUE 'rejected' TO 'REJECTED';
EXCEPTION WHEN others THEN RAISE NOTICE 'rejected already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE approvalaction RENAME VALUE 'returned' TO 'RETURNED';
EXCEPTION WHEN others THEN RAISE NOTICE 'returned already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE approvalaction RENAME VALUE 'signed' TO 'SIGNED';
EXCEPTION WHEN others THEN RAISE NOTICE 'signed already renamed'; END $$;

-- 8. Fix auditstatus enum - update lowercase values
DO $$
BEGIN
    ALTER TYPE auditstatus RENAME VALUE 'initiated' TO 'INITIATED_DUP';
EXCEPTION WHEN others THEN RAISE NOTICE 'initiated already renamed'; END $$;
DO $$
BEGIN
    ALTER TYPE auditstatus RENAME VALUE 'preparation' TO 'PREPARATION_DUP';
EXCEPTION WHEN others THEN RAISE NOTICE 'preparation already renamed'; END $$;

-- Update any data using lowercase values
UPDATE audits SET status = 'INITIATED' WHERE status::text IN ('initiated', 'INITIATED_DUP');
UPDATE audits SET status = 'PREPARATION' WHERE status::text IN ('preparation', 'PREPARATION_DUP');

-- 9. Fix duplicate capa_status type if exists
DO $$
BEGIN
    ALTER TYPE capa_status RENAME VALUE 'open' TO 'OPEN';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE capa_status RENAME VALUE 'in_progress' TO 'IN_PROGRESS';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE capa_status RENAME VALUE 'pending_verification' TO 'PENDING_VERIFICATION';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE capa_status RENAME VALUE 'closed' TO 'CLOSED';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE capa_status RENAME VALUE 'overdue' TO 'OVERDUE';
EXCEPTION WHEN others THEN NULL; END $$;

-- 10. Fix compliance_status type if exists
DO $$
BEGIN
    ALTER TYPE compliance_status RENAME VALUE 'not_assessed' TO 'NOT_ASSESSED';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE compliance_status RENAME VALUE 'compliant' TO 'COMPLIANT';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE compliance_status RENAME VALUE 'non_compliant' TO 'NON_COMPLIANT';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE compliance_status RENAME VALUE 'partially_compliant' TO 'PARTIALLY_COMPLIANT';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE compliance_status RENAME VALUE 'not_applicable' TO 'NOT_APPLICABLE';
EXCEPTION WHEN others THEN NULL; END $$;

-- 11. Fix risk_category type if exists
DO $$
BEGIN
    ALTER TYPE risk_category RENAME VALUE 'low' TO 'LOW';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE risk_category RENAME VALUE 'medium' TO 'MEDIUM';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE risk_category RENAME VALUE 'high' TO 'HIGH';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE risk_category RENAME VALUE 'critical' TO 'CRITICAL';
EXCEPTION WHEN others THEN NULL; END $$;

-- 12. Fix asset_status type if exists
DO $$
BEGIN
    ALTER TYPE asset_status RENAME VALUE 'active' TO 'ACTIVE';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE asset_status RENAME VALUE 'inactive' TO 'INACTIVE';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE asset_status RENAME VALUE 'disposed' TO 'DISPOSED';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE asset_status RENAME VALUE 'under_maintenance' TO 'UNDER_MAINTENANCE';
EXCEPTION WHEN others THEN NULL; END $$;

-- 13. Fix document_status type if exists
DO $$
BEGIN
    ALTER TYPE document_status RENAME VALUE 'draft' TO 'DRAFT';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE document_status RENAME VALUE 'under_review' TO 'UNDER_REVIEW';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE document_status RENAME VALUE 'approved' TO 'APPROVED';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE document_status RENAME VALUE 'active' TO 'ACTIVE';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE document_status RENAME VALUE 'expired' TO 'EXPIRED';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE document_status RENAME VALUE 'archived' TO 'ARCHIVED';
EXCEPTION WHEN others THEN NULL; END $$;

-- 14. Fix vendor_risk_rating type if exists
DO $$
BEGIN
    ALTER TYPE vendor_risk_rating RENAME VALUE 'low' TO 'LOW';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE vendor_risk_rating RENAME VALUE 'medium' TO 'MEDIUM';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE vendor_risk_rating RENAME VALUE 'high' TO 'HIGH';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE vendor_risk_rating RENAME VALUE 'critical' TO 'CRITICAL';
EXCEPTION WHEN others THEN NULL; END $$;

-- 15. Fix capa_type type if exists
DO $$
BEGIN
    ALTER TYPE capa_type RENAME VALUE 'corrective' TO 'CORRECTIVE';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE capa_type RENAME VALUE 'preventive' TO 'PREVENTIVE';
EXCEPTION WHEN others THEN NULL; END $$;
DO $$
BEGIN
    ALTER TYPE capa_type RENAME VALUE 'both' TO 'BOTH';
EXCEPTION WHEN others THEN NULL; END $$;

-- Verify the changes
SELECT 'Enum types after fix:' as message;
SELECT t.typname as enum_name,
       string_agg(e.enumlabel, ', ' ORDER BY e.enumsortorder) as enum_values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
GROUP BY t.typname
ORDER BY t.typname;
