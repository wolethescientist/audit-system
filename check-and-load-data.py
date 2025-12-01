#!/usr/bin/env python3
"""
Check what data exists in Supabase and load only what's missing
"""
import os
import sys
from dotenv import load_dotenv
import psycopg2

# Load environment variables
load_dotenv('backend/.env')
DATABASE_URL = os.getenv('DATABASE_URL')

print("=" * 60)
print("Checking Supabase Database Content")
print("=" * 60)
print()

try:
    conn = psycopg2.connect(DATABASE_URL)
    cursor = conn.cursor()
    
    # Check what exists
    print("📊 Current Database Content:")
    print()
    
    cursor.execute("SELECT COUNT(*) FROM departments")
    dept_count = cursor.fetchone()[0]
    print(f"   Departments: {dept_count}")
    
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]
    print(f"   Users: {user_count}")
    
    cursor.execute("SELECT COUNT(*) FROM audits")
    audit_count = cursor.fetchone()[0]
    print(f"   Audits: {audit_count}")
    
    cursor.execute("SELECT COUNT(*) FROM audit_team")
    team_count = cursor.fetchone()[0]
    print(f"   Audit Team Members: {team_count}")
    
    cursor.execute("SELECT COUNT(*) FROM audit_work_program")
    work_count = cursor.fetchone()[0]
    print(f"   Work Program Items: {work_count}")
    
    cursor.execute("SELECT COUNT(*) FROM audit_evidence")
    evidence_count = cursor.fetchone()[0]
    print(f"   Evidence Files: {evidence_count}")
    
    cursor.execute("SELECT COUNT(*) FROM audit_findings")
    finding_count = cursor.fetchone()[0]
    print(f"   Findings: {finding_count}")
    
    cursor.execute("SELECT COUNT(*) FROM audit_queries")
    query_count = cursor.fetchone()[0]
    print(f"   Queries: {query_count}")
    
    cursor.execute("SELECT COUNT(*) FROM audit_reports")
    report_count = cursor.fetchone()[0]
    print(f"   Reports: {report_count}")
    
    cursor.execute("SELECT COUNT(*) FROM audit_followup")
    followup_count = cursor.fetchone()[0]
    print(f"   Follow-ups: {followup_count}")
    
    cursor.execute("SELECT COUNT(*) FROM workflows")
    workflow_count = cursor.fetchone()[0]
    print(f"   Workflows: {workflow_count}")
    
    cursor.execute("SELECT COUNT(*) FROM workflow_steps")
    step_count = cursor.fetchone()[0]
    print(f"   Workflow Steps: {step_count}")
    
    cursor.execute("SELECT COUNT(*) FROM workflow_approvals")
    approval_count = cursor.fetchone()[0]
    print(f"   Workflow Approvals: {approval_count}")
    
    print()
    print("=" * 60)
    
    # Check if we need to add more data
    if audit_count == 0:
        print("❌ No audits found! You need to add audit data.")
        print()
        print("The issue is that users and departments already exist,")
        print("but audits don't, so we can't link other data.")
        print()
        print("Let me create a simplified script that adds just the audits")
        print("and related data using your existing users and departments.")
    elif audit_count < 5:
        print(f"⚠️  Only {audit_count} audits found. You need more for a good presentation.")
    else:
        print(f"✅ You have {audit_count} audits - that's good!")
        
    if workflow_count == 0:
        print("❌ No workflows found!")
    elif workflow_count < 5:
        print(f"⚠️  Only {workflow_count} workflows found.")
    else:
        print(f"✅ You have {workflow_count} workflows - that's good!")
    
    print()
    
    # Show existing users
    print("👥 Existing Users:")
    cursor.execute("SELECT email, role FROM users ORDER BY role, email LIMIT 20")
    for email, role in cursor.fetchall():
        print(f"   • {email} ({role})")
    
    print()
    
    # Show existing departments
    print("🏢 Existing Departments:")
    cursor.execute("SELECT name FROM departments ORDER BY name")
    for (name,) in cursor.fetchall():
        print(f"   • {name}")
    
    print()
    
    # Show existing audits
    if audit_count > 0:
        print("📋 Existing Audits:")
        cursor.execute("SELECT title, status FROM audits ORDER BY created_at DESC LIMIT 10")
        for title, status in cursor.fetchall():
            print(f"   • {title} ({status})")
        print()
    
    cursor.close()
    conn.close()
    
except Exception as e:
    print(f"❌ Error: {e}")
    sys.exit(1)
