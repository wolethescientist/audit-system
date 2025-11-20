"""
Create test users for POC demonstration
Simplified flow: Planning → Execution → Report & Approvals → Follow-up → Close-up
"""
import requests
import json

API_URL = "http://localhost:8000"

# Test users for simplified POC
test_users = [
    {
        "email": "admin@audit.com",
        "full_name": "System Administrator",
        "role": "system_admin"
    },
    {
        "email": "manager@audit.com",
        "full_name": "Audit Manager",
        "role": "audit_manager"
    },
    {
        "email": "auditor@audit.com",
        "full_name": "Lead Auditor",
        "role": "auditor"
    },
    {
        "email": "finance.head@company.com",
        "full_name": "Finance Department Head",
        "role": "department_head"
    },
    {
        "email": "hr.head@company.com",
        "full_name": "HR Department Head",
        "role": "department_head"
    },
    {
        "email": "it.head@company.com",
        "full_name": "IT Department Head",
        "role": "department_head"
    }
]

print("=" * 60)
print("CREATING TEST USERS FOR POC")
print("=" * 60)

created_users = []

for user in test_users:
    try:
        response = requests.post(f"{API_URL}/auth/signup", json=user)
        if response.status_code == 200:
            result = response.json()
            created_users.append(result)
            print(f"✅ Created: {user['full_name']} ({user['email']})")
            print(f"   Role: {user['role']}")
        else:
            print(f"⚠️  {user['email']}: {response.json().get('detail', 'Already exists')}")
    except Exception as e:
        print(f"❌ Error creating {user['email']}: {str(e)}")

print("\n" + "=" * 60)
print("SIMPLIFIED POC FLOW")
print("=" * 60)
print("""
1. AUDIT PLANNING (Audit Manager)
   - Create audit plan
   - Assign auditor team
   - Define scope & departments to audit

2. AUDIT EXECUTION (Auditor)
   - Conduct fieldwork
   - Collect evidence
   - Document findings
   - Send queries to departments

3. REPORT WRITING & APPROVALS (Multi-Department)
   - Auditor drafts report
   - Route to Finance Head → HR Head → IT Head
   - Each department signs/acknowledges
   - Audit Manager final approval

4. FOLLOW-UP (Department Heads)
   - Action plans assigned
   - Track remediation
   - Upload evidence

5. CLOSE-UP (Audit Manager)
   - Verify all actions complete
   - Final sign-off
   - Archive audit
""")

print("=" * 60)
print("LOGIN CREDENTIALS (No password needed)")
print("=" * 60)
for user in test_users:
    print(f"Email: {user['email']}")
print("\n✅ Backend running at: http://localhost:8000")
print("✅ Frontend running at: http://localhost:3000")
print("✅ API Docs: http://localhost:8000/docs")
