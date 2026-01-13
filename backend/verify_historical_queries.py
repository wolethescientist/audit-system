"""
Demonstration script showing how to query historical data with soft-deleted users.
This shows practical examples of maintaining audit trail integrity.
"""

import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'app'))

from sqlalchemy import create_engine, and_, or_
from sqlalchemy.orm import sessionmaker
from app.models import (
    User, Audit, AuditFinding, AuditFollowup, AuditEvidence,
    AuditReport, SystemAuditLog, CAPAItem
)
from app.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def demonstrate_historical_queries():
    """Demonstrate various historical queries that include deleted users"""
    db = SessionLocal()
    
    try:
        print("\n" + "="*80)
        print("  HISTORICAL DATA QUERY DEMONSTRATIONS")
        print("  Showing how to query data including soft-deleted users")
        print("="*80 + "\n")
        
        # Example 1: Get all audits with their managers (including deleted)
        print("Example 1: Audits with Manager Information (including deleted users)")
        print("-" * 80)
        audits = db.query(Audit).limit(5).all()
        for audit in audits:
            if audit.assigned_manager:
                status = "DELETED" if audit.assigned_manager.is_deleted else "ACTIVE"
                print(f"  Audit: {audit.title}")
                print(f"  Manager: {audit.assigned_manager.full_name} [{status}]")
                if audit.assigned_manager.is_deleted:
                    print(f"  Deleted: {audit.assigned_manager.deleted_at}")
                print()
        
        # Example 2: Get findings with assignees (including deleted)
        print("\nExample 2: Findings with Assignee Information (including deleted users)")
        print("-" * 80)
        findings = db.query(AuditFinding).limit(5).all()
        for finding in findings:
            if finding.assigned_to:
                status = "DELETED" if finding.assigned_to.is_deleted else "ACTIVE"
                print(f"  Finding: {finding.title}")
                print(f"  Assigned To: {finding.assigned_to.full_name} [{status}]")
                print(f"  Severity: {finding.severity.value}")
                print()
        
        # Example 3: Get follow-ups with assignees (including deleted)
        print("\nExample 3: Follow-ups with Assignee Information (including deleted users)")
        print("-" * 80)
        followups = db.query(AuditFollowup).limit(5).all()
        for followup in followups:
            if followup.assigned_to:
                status = "DELETED" if followup.assigned_to.is_deleted else "ACTIVE"
                print(f"  Follow-up ID: {followup.id}")
                print(f"  Assigned To: {followup.assigned_to.full_name} [{status}]")
                print(f"  Status: {followup.status}")
                print(f"  Due Date: {followup.due_date}")
                print()
        
        # Example 4: Get audit trail logs (including deleted users)
        print("\nExample 4: System Audit Logs (including deleted users)")
        print("-" * 80)
        logs = db.query(SystemAuditLog).limit(5).all()
        for log in logs:
            if log.user:
                status = "DELETED" if log.user.is_deleted else "ACTIVE"
                print(f"  Action: {log.action_type} on {log.resource_type}")
                print(f"  User: {log.user.full_name} [{status}]")
                print(f"  Timestamp: {log.timestamp}")
                print()
        
        # Example 5: Get evidence with uploader info (including deleted)
        print("\nExample 5: Evidence with Uploader Information (including deleted users)")
        print("-" * 80)
        evidence = db.query(AuditEvidence).limit(5).all()
        for item in evidence:
            if item.uploaded_by:
                status = "DELETED" if item.uploaded_by.is_deleted else "ACTIVE"
                print(f"  File: {item.file_name}")
                print(f"  Uploaded By: {item.uploaded_by.full_name} [{status}]")
                print(f"  Upload Date: {item.created_at}")
                print()
        
        # Example 6: Get reports with creator info (including deleted)
        print("\nExample 6: Reports with Creator Information (including deleted users)")
        print("-" * 80)
        reports = db.query(AuditReport).limit(5).all()
        for report in reports:
            if report.created_by:
                status = "DELETED" if report.created_by.is_deleted else "ACTIVE"
                print(f"  Report Version: {report.version}")
                print(f"  Created By: {report.created_by.full_name} [{status}]")
                print(f"  Status: {report.status.value}")
                print(f"  Created: {report.created_at}")
                print()
        
        # Example 7: Count statistics including deleted users
        print("\nExample 7: Statistics Including Deleted Users")
        print("-" * 80)
        
        total_users = db.query(User).count()
        active_users = db.query(User).filter(User.is_deleted == False).count()
        deleted_users = db.query(User).filter(User.is_deleted == True).count()
        
        print(f"  Total Users in System: {total_users}")
        print(f"  Active Users: {active_users}")
        print(f"  Deleted Users: {deleted_users}")
        print()
        
        # Audits created by deleted users
        audits_by_deleted = db.query(Audit).join(
            User, Audit.created_by_id == User.id
        ).filter(User.is_deleted == True).count()
        
        print(f"  Audits Created by Deleted Users: {audits_by_deleted}")
        
        # Findings assigned to deleted users
        findings_to_deleted = db.query(AuditFinding).join(
            User, AuditFinding.assigned_to_id == User.id
        ).filter(User.is_deleted == True).count()
        
        print(f"  Findings Assigned to Deleted Users: {findings_to_deleted}")
        
        # Follow-ups assigned to deleted users
        followups_to_deleted = db.query(AuditFollowup).join(
            User, AuditFollowup.assigned_to_id == User.id
        ).filter(User.is_deleted == True).count()
        
        print(f"  Follow-ups Assigned to Deleted Users: {followups_to_deleted}")
        print()
        
        # Example 8: Query pattern for reports (include deleted users)
        print("\nExample 8: Report Query Pattern (Audit Summary)")
        print("-" * 80)
        print("  This demonstrates how to generate reports that include deleted users:\n")
        
        sample_audit = db.query(Audit).first()
        if sample_audit:
            print(f"  Audit: {sample_audit.title}")
            print(f"  Year: {sample_audit.year}")
            print(f"  Status: {sample_audit.status.value}")
            print()
            
            if sample_audit.assigned_manager:
                print(f"  Assigned Manager: {sample_audit.assigned_manager.full_name}")
                if sample_audit.assigned_manager.is_deleted:
                    print(f"    ⚠ User was deleted on {sample_audit.assigned_manager.deleted_at}")
                    print(f"    Reason: {sample_audit.assigned_manager.deletion_reason or 'Not specified'}")
            
            if sample_audit.created_by:
                print(f"  Created By: {sample_audit.created_by.full_name}")
                if sample_audit.created_by.is_deleted:
                    print(f"    ⚠ User was deleted on {sample_audit.created_by.deleted_at}")
            
            if sample_audit.lead_auditor:
                print(f"  Lead Auditor: {sample_audit.lead_auditor.full_name}")
                if sample_audit.lead_auditor.is_deleted:
                    print(f"    ⚠ User was deleted on {sample_audit.lead_auditor.deleted_at}")
            
            print()
        
        print("\n" + "="*80)
        print("  DEMONSTRATION COMPLETE")
        print("  All queries successfully retrieved data including soft-deleted users")
        print("="*80 + "\n")
        
    except Exception as e:
        print(f"\nError during demonstration: {str(e)}")
        import traceback
        traceback.print_exc()
    finally:
        db.close()

def show_query_examples():
    """Show code examples for common query patterns"""
    print("\n" + "="*80)
    print("  QUERY PATTERN EXAMPLES")
    print("="*80 + "\n")
    
    print("1. Get all audits including those managed by deleted users:")
    print("-" * 80)
    print("""
    audits = db.query(Audit).all()
    for audit in audits:
        if audit.assigned_manager:
            manager_name = audit.assigned_manager.full_name
            is_deleted = audit.assigned_manager.is_deleted
            # Use in report/display
    """)
    
    print("\n2. Get findings with deleted user indicator:")
    print("-" * 80)
    print("""
    findings = db.query(AuditFinding).filter(
        AuditFinding.audit_id == audit_id
    ).all()
    
    for finding in findings:
        if finding.assigned_to:
            assignee = {
                'name': finding.assigned_to.full_name,
                'is_deleted': finding.assigned_to.is_deleted,
                'deleted_at': finding.assigned_to.deleted_at
            }
    """)
    
    print("\n3. Get audit trail logs (always include deleted users):")
    print("-" * 80)
    print("""
    logs = db.query(SystemAuditLog).filter(
        SystemAuditLog.audit_id == audit_id
    ).order_by(SystemAuditLog.timestamp.desc()).all()
    
    for log in logs:
        if log.user:
            user_info = {
                'name': log.user.full_name,
                'action': log.action_type,
                'timestamp': log.timestamp,
                'is_deleted': log.user.is_deleted
            }
    """)
    
    print("\n4. Generate report with team members (including deleted):")
    print("-" * 80)
    print("""
    from app.models import AuditTeam
    
    team_members = db.query(AuditTeam).filter(
        AuditTeam.audit_id == audit_id
    ).all()
    
    for member in team_members:
        if member.user:
            team_info = {
                'name': member.user.full_name,
                'role': member.role_in_audit,
                'is_deleted': member.user.is_deleted,
                'email': member.user.email if not member.user.is_deleted else 'N/A'
            }
    """)
    
    print("\n5. Filter active users for assignment (exclude deleted):")
    print("-" * 80)
    print("""
    # For NEW assignments, filter out deleted users
    active_users = db.query(User).filter(
        User.is_deleted == False,
        User.is_active == True
    ).all()
    
    # For VIEWING historical assignments, include deleted users
    all_assignees = db.query(User).all()
    """)
    
    print("\n" + "="*80 + "\n")

if __name__ == "__main__":
    demonstrate_historical_queries()
    show_query_examples()
