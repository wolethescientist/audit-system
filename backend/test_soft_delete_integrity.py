"""
Test script to verify audit trail references to deleted users are maintained.
This ensures historical data integrity per Requirement 5.7.

Tests:
1. Audit logs maintain references to soft-deleted users
2. Findings, follow-ups, and other records show deleted user names
3. Reports can still display historical data with deleted users
"""

import sys
import os
from datetime import datetime, timedelta
from uuid import uuid4

# Add the app directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base
from app.models import (
    User, UserRole, Department, Audit, AuditStatus, AuditFinding, FindingSeverity,
    AuditFollowup, AuditEvidence, AuditReport, ReportStatus, AuditQuery,
    WorkflowApproval, ApprovalAction, CAPAItem, CAPAType, CAPAStatus,
    RiskAssessment, RiskCategory, Asset, AssetStatus, SystemAuditLog,
    AuditTeam, AuditInterviewNote
)
from app.config import settings

# Database connection
engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def print_section(title):
    """Print a formatted section header"""
    print(f"\n{'='*80}")
    print(f"  {title}")
    print(f"{'='*80}\n")

def test_soft_delete_integrity():
    """Main test function to verify historical data integrity"""
    db = SessionLocal()
    
    try:
        print_section("SOFT DELETE HISTORICAL DATA INTEGRITY TEST")
        print("This test verifies that soft-deleted users maintain audit trail integrity")
        print("per Requirement 5.7: Historical data references to deleted users are preserved\n")
        
        # Step 1: Create test department
        print_section("Step 1: Creating Test Data")
        test_dept = Department(
            name=f"Test Department {uuid4().hex[:8]}"
        )
        db.add(test_dept)
        db.flush()
        print(f"✓ Created test department: {test_dept.name}")
        
        # Step 2: Create test users
        admin_user = User(
            email=f"admin_{uuid4().hex[:8]}@test.com",
            full_name="Test Admin",
            role=UserRole.SYSTEM_ADMIN,
            department_id=test_dept.id,
            is_active=True
        )
        db.add(admin_user)
        db.flush()
        print(f"✓ Created admin user: {admin_user.full_name} ({admin_user.email})")
        
        auditor_user = User(
            email=f"auditor_{uuid4().hex[:8]}@test.com",
            full_name="Test Auditor (To Be Deleted)",
            role=UserRole.AUDITOR,
            department_id=test_dept.id,
            is_active=True
        )
        db.add(auditor_user)
        db.flush()
        print(f"✓ Created auditor user: {auditor_user.full_name} ({auditor_user.email})")
        print(f"  User ID: {auditor_user.id}")
        
        # Step 3: Create audit with the auditor
        test_audit = Audit(
            title=f"Test Audit {uuid4().hex[:8]}",
            year=2025,
            scope="Test scope for soft delete verification",
            status=AuditStatus.EXECUTING,
            assigned_manager_id=auditor_user.id,
            created_by_id=auditor_user.id,
            lead_auditor_id=auditor_user.id,
            department_id=test_dept.id,
            start_date=datetime.utcnow(),
            end_date=datetime.utcnow() + timedelta(days=30)
        )
        db.add(test_audit)
        db.flush()
        print(f"\n✓ Created audit: {test_audit.title}")
        print(f"  Assigned Manager: {auditor_user.full_name}")
        print(f"  Created By: {auditor_user.full_name}")
        print(f"  Lead Auditor: {auditor_user.full_name}")
        
        # Step 4: Create audit team assignment
        team_member = AuditTeam(
            audit_id=test_audit.id,
            user_id=auditor_user.id,
            role_in_audit="Lead Auditor"
        )
        db.add(team_member)
        db.flush()
        print(f"✓ Added {auditor_user.full_name} to audit team")
        
        # Step 5: Create finding assigned to auditor
        test_finding = AuditFinding(
            audit_id=test_audit.id,
            title="Test Finding for Soft Delete",
            severity=FindingSeverity.HIGH,
            impact="Test impact",
            root_cause="Test root cause",
            recommendation="Test recommendation",
            status="open",
            assigned_to_id=auditor_user.id
        )
        db.add(test_finding)
        db.flush()
        print(f"\n✓ Created finding: {test_finding.title}")
        print(f"  Assigned To: {auditor_user.full_name}")
        
        # Step 6: Create follow-up assigned to auditor
        test_followup = AuditFollowup(
            audit_id=test_audit.id,
            finding_id=test_finding.id,
            assigned_to_id=auditor_user.id,
            due_date=datetime.utcnow() + timedelta(days=14),
            status="pending"
        )
        db.add(test_followup)
        db.flush()
        print(f"✓ Created follow-up assigned to: {auditor_user.full_name}")
        
        # Step 7: Create evidence uploaded by auditor
        test_evidence = AuditEvidence(
            audit_id=test_audit.id,
            file_name="test_evidence.pdf",
            file_url="https://example.com/evidence.pdf",
            uploaded_by_id=auditor_user.id,
            description="Test evidence uploaded by auditor",
            evidence_type="document"
        )
        db.add(test_evidence)
        db.flush()
        print(f"✓ Created evidence uploaded by: {auditor_user.full_name}")
        
        # Step 8: Create audit report created by auditor
        test_report = AuditReport(
            audit_id=test_audit.id,
            version=1,
            content="Test audit report content",
            status=ReportStatus.DRAFT,
            created_by_id=auditor_user.id
        )
        db.add(test_report)
        db.flush()
        print(f"✓ Created audit report by: {auditor_user.full_name}")
        
        # Step 9: Create audit query from auditor
        test_query = AuditQuery(
            audit_id=test_audit.id,
            from_user_id=auditor_user.id,
            to_user_id=admin_user.id,
            message="Test query from auditor"
        )
        db.add(test_query)
        db.flush()
        print(f"✓ Created audit query from: {auditor_user.full_name}")
        
        # Step 10: Create interview note with auditor as interviewer
        test_interview = AuditInterviewNote(
            audit_id=test_audit.id,
            interview_title="Test Interview",
            interviewer_id=auditor_user.id,
            interviewee_id=admin_user.id,
            interview_date=datetime.utcnow(),
            interview_objective="Test interview objective",
            key_findings="Test findings",
            created_by_id=auditor_user.id
        )
        db.add(test_interview)
        db.flush()
        print(f"✓ Created interview note with interviewer: {auditor_user.full_name}")
        
        # Step 11: Create system audit log entry
        test_log = SystemAuditLog(
            user_id=auditor_user.id,
            action_type="CREATE",
            resource_type="audit_finding",
            resource_id=str(test_finding.id),
            table_name="audit_findings",
            audit_id=test_audit.id,
            timestamp=datetime.utcnow()
        )
        db.add(test_log)
        db.flush()
        print(f"✓ Created system audit log for user: {auditor_user.full_name}")
        
        # Step 12: Create asset owned by auditor
        test_asset = Asset(
            asset_name="Test Laptop",
            asset_category="hardware",
            asset_type="laptop",
            owner_id=auditor_user.id,
            custodian_id=auditor_user.id,
            department_id=test_dept.id,
            status=AssetStatus.ACTIVE
        )
        db.add(test_asset)
        db.flush()
        print(f"✓ Created asset owned by: {auditor_user.full_name}")
        
        # Step 13: Create risk assessment
        test_risk = RiskAssessment(
            asset_id=test_asset.id,
            risk_title="Test Risk",
            description="Test risk description",
            likelihood_score=3,
            impact_score=4,
            risk_rating=12,
            risk_category=RiskCategory.HIGH,
            risk_owner_id=auditor_user.id,
            created_by_id=auditor_user.id
        )
        db.add(test_risk)
        db.flush()
        print(f"✓ Created risk assessment owned by: {auditor_user.full_name}")
        
        # Step 14: Create CAPA item
        test_capa = CAPAItem(
            capa_number=f"CAPA-{uuid4().hex[:8]}",
            audit_id=test_audit.id,
            finding_id=test_finding.id,
            capa_type=CAPAType.CORRECTIVE,
            title="Test CAPA",
            description="Test CAPA description",
            assigned_to_id=auditor_user.id,
            responsible_department_id=test_dept.id,
            status=CAPAStatus.OPEN,
            created_by_id=auditor_user.id
        )
        db.add(test_capa)
        db.flush()
        print(f"✓ Created CAPA assigned to: {auditor_user.full_name}")
        
        db.commit()
        print("\n✓ All test data created successfully")
        
        # Step 15: Soft delete the auditor user
        print_section("Step 2: Soft Deleting User")
        print(f"Soft deleting user: {auditor_user.full_name}")
        print(f"User ID: {auditor_user.id}")
        
        auditor_user.is_deleted = True
        auditor_user.deleted_at = datetime.utcnow()
        auditor_user.deleted_by_id = admin_user.id
        auditor_user.deletion_reason = "Test soft delete for historical data integrity verification"
        auditor_user.is_active = False
        
        db.commit()
        print(f"✓ User soft deleted at: {auditor_user.deleted_at}")
        print(f"✓ Deleted by: {admin_user.full_name}")
        print(f"✓ Reason: {auditor_user.deletion_reason}")
        
        # Step 16: Verify all relationships still exist
        print_section("Step 3: Verifying Historical Data Integrity")
        
        # Refresh objects to get latest state
        db.refresh(test_audit)
        db.refresh(test_finding)
        db.refresh(test_followup)
        db.refresh(test_evidence)
        db.refresh(test_report)
        db.refresh(test_query)
        db.refresh(test_interview)
        db.refresh(test_log)
        db.refresh(test_asset)
        db.refresh(test_risk)
        db.refresh(test_capa)
        
        verification_results = []
        
        # Verify audit relationships
        print("Verifying Audit Relationships:")
        if test_audit.assigned_manager and test_audit.assigned_manager.id == auditor_user.id:
            print(f"  ✓ Audit assigned_manager reference maintained: {test_audit.assigned_manager.full_name}")
            print(f"    User is_deleted: {test_audit.assigned_manager.is_deleted}")
            verification_results.append(True)
        else:
            print(f"  ✗ Audit assigned_manager reference LOST")
            verification_results.append(False)
        
        if test_audit.created_by and test_audit.created_by.id == auditor_user.id:
            print(f"  ✓ Audit created_by reference maintained: {test_audit.created_by.full_name}")
            verification_results.append(True)
        else:
            print(f"  ✗ Audit created_by reference LOST")
            verification_results.append(False)
        
        if test_audit.lead_auditor and test_audit.lead_auditor.id == auditor_user.id:
            print(f"  ✓ Audit lead_auditor reference maintained: {test_audit.lead_auditor.full_name}")
            verification_results.append(True)
        else:
            print(f"  ✗ Audit lead_auditor reference LOST")
            verification_results.append(False)
        
        # Verify finding relationship
        print("\nVerifying Finding Relationships:")
        if test_finding.assigned_to and test_finding.assigned_to.id == auditor_user.id:
            print(f"  ✓ Finding assigned_to reference maintained: {test_finding.assigned_to.full_name}")
            print(f"    User is_deleted: {test_finding.assigned_to.is_deleted}")
            verification_results.append(True)
        else:
            print(f"  ✗ Finding assigned_to reference LOST")
            verification_results.append(False)
        
        # Verify follow-up relationship
        print("\nVerifying Follow-up Relationships:")
        if test_followup.assigned_to and test_followup.assigned_to.id == auditor_user.id:
            print(f"  ✓ Follow-up assigned_to reference maintained: {test_followup.assigned_to.full_name}")
            verification_results.append(True)
        else:
            print(f"  ✗ Follow-up assigned_to reference LOST")
            verification_results.append(False)
        
        # Verify evidence relationship
        print("\nVerifying Evidence Relationships:")
        if test_evidence.uploaded_by and test_evidence.uploaded_by.id == auditor_user.id:
            print(f"  ✓ Evidence uploaded_by reference maintained: {test_evidence.uploaded_by.full_name}")
            verification_results.append(True)
        else:
            print(f"  ✗ Evidence uploaded_by reference LOST")
            verification_results.append(False)
        
        # Verify report relationship
        print("\nVerifying Report Relationships:")
        if test_report.created_by and test_report.created_by.id == auditor_user.id:
            print(f"  ✓ Report created_by reference maintained: {test_report.created_by.full_name}")
            verification_results.append(True)
        else:
            print(f"  ✗ Report created_by reference LOST")
            verification_results.append(False)
        
        # Verify query relationship
        print("\nVerifying Query Relationships:")
        if test_query.from_user and test_query.from_user.id == auditor_user.id:
            print(f"  ✓ Query from_user reference maintained: {test_query.from_user.full_name}")
            verification_results.append(True)
        else:
            print(f"  ✗ Query from_user reference LOST")
            verification_results.append(False)
        
        # Verify interview relationship
        print("\nVerifying Interview Note Relationships:")
        if test_interview.interviewer and test_interview.interviewer.id == auditor_user.id:
            print(f"  ✓ Interview interviewer reference maintained: {test_interview.interviewer.full_name}")
            verification_results.append(True)
        else:
            print(f"  ✗ Interview interviewer reference LOST")
            verification_results.append(False)
        
        if test_interview.created_by and test_interview.created_by.id == auditor_user.id:
            print(f"  ✓ Interview created_by reference maintained: {test_interview.created_by.full_name}")
            verification_results.append(True)
        else:
            print(f"  ✗ Interview created_by reference LOST")
            verification_results.append(False)
        
        # Verify system audit log relationship
        print("\nVerifying System Audit Log Relationships:")
        if test_log.user and test_log.user.id == auditor_user.id:
            print(f"  ✓ Audit log user reference maintained: {test_log.user.full_name}")
            verification_results.append(True)
        else:
            print(f"  ✗ Audit log user reference LOST")
            verification_results.append(False)
        
        # Verify asset relationships
        print("\nVerifying Asset Relationships:")
        if test_asset.owner and test_asset.owner.id == auditor_user.id:
            print(f"  ✓ Asset owner reference maintained: {test_asset.owner.full_name}")
            verification_results.append(True)
        else:
            print(f"  ✗ Asset owner reference LOST")
            verification_results.append(False)
        
        if test_asset.custodian and test_asset.custodian.id == auditor_user.id:
            print(f"  ✓ Asset custodian reference maintained: {test_asset.custodian.full_name}")
            verification_results.append(True)
        else:
            print(f"  ✗ Asset custodian reference LOST")
            verification_results.append(False)
        
        # Verify risk assessment relationships
        print("\nVerifying Risk Assessment Relationships:")
        if test_risk.risk_owner and test_risk.risk_owner.id == auditor_user.id:
            print(f"  ✓ Risk risk_owner reference maintained: {test_risk.risk_owner.full_name}")
            verification_results.append(True)
        else:
            print(f"  ✗ Risk risk_owner reference LOST")
            verification_results.append(False)
        
        if test_risk.created_by and test_risk.created_by.id == auditor_user.id:
            print(f"  ✓ Risk created_by reference maintained: {test_risk.created_by.full_name}")
            verification_results.append(True)
        else:
            print(f"  ✗ Risk created_by reference LOST")
            verification_results.append(False)
        
        # Verify CAPA relationships
        print("\nVerifying CAPA Relationships:")
        if test_capa.assigned_to and test_capa.assigned_to.id == auditor_user.id:
            print(f"  ✓ CAPA assigned_to reference maintained: {test_capa.assigned_to.full_name}")
            verification_results.append(True)
        else:
            print(f"  ✗ CAPA assigned_to reference LOST")
            verification_results.append(False)
        
        if test_capa.created_by and test_capa.created_by.id == auditor_user.id:
            print(f"  ✓ CAPA created_by reference maintained: {test_capa.created_by.full_name}")
            verification_results.append(True)
        else:
            print(f"  ✗ CAPA created_by reference LOST")
            verification_results.append(False)
        
        # Verify audit team membership
        print("\nVerifying Audit Team Relationships:")
        team_check = db.query(AuditTeam).filter(
            AuditTeam.audit_id == test_audit.id,
            AuditTeam.user_id == auditor_user.id
        ).first()
        if team_check and team_check.user:
            print(f"  ✓ Audit team membership maintained: {team_check.user.full_name}")
            verification_results.append(True)
        else:
            print(f"  ✗ Audit team membership LOST")
            verification_results.append(False)
        
        # Final results
        print_section("Step 4: Test Results Summary")
        total_checks = len(verification_results)
        passed_checks = sum(verification_results)
        failed_checks = total_checks - passed_checks
        
        print(f"Total Verification Checks: {total_checks}")
        print(f"Passed: {passed_checks}")
        print(f"Failed: {failed_checks}")
        print(f"Success Rate: {(passed_checks/total_checks)*100:.1f}%")
        
        if all(verification_results):
            print("\n✓ ALL CHECKS PASSED - Historical data integrity is maintained!")
            print("✓ Requirement 5.7 VERIFIED: Audit trail references to deleted users are preserved")
            return True
        else:
            print("\n✗ SOME CHECKS FAILED - Historical data integrity issues detected!")
            print("✗ Requirement 5.7 NOT MET: Some audit trail references were lost")
            return False
        
    except Exception as e:
        print(f"\n✗ ERROR during test execution: {str(e)}")
        import traceback
        traceback.print_exc()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("\n" + "="*80)
    print("  SOFT DELETE HISTORICAL DATA INTEGRITY VERIFICATION")
    print("  Testing Requirement 5.7: Historical data references to deleted users")
    print("="*80 + "\n")
    
    success = test_soft_delete_integrity()
    
    print("\n" + "="*80)
    if success:
        print("  TEST COMPLETED SUCCESSFULLY")
        print("  Historical data integrity is maintained for soft-deleted users")
        sys.exit(0)
    else:
        print("  TEST FAILED")
        print("  Historical data integrity issues detected")
        sys.exit(1)
