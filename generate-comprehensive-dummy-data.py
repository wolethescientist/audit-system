"""
Comprehensive Dummy Data Generator for Audit Management System
This script generates realistic data showcasing all features for each role.
"""

import requests
import json
from datetime import datetime, timedelta
import random
import sys

# Configuration
BASE_URL = "http://localhost:8000"  # Your backend API URL
ADMIN_EMAIL = "admin@audit.com"

# Note: This script uses the backend API which connects to Supabase
# Make sure your backend is running and connected to Supabase

# Color codes for output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    END = '\033[0m'

def print_success(msg):
    print(f"{Colors.GREEN}✓ {msg}{Colors.END}")

def print_info(msg):
    print(f"{Colors.BLUE}ℹ {msg}{Colors.END}")

def print_error(msg):
    print(f"{Colors.RED}✗ {msg}{Colors.END}")

def print_section(msg):
    print(f"\n{Colors.YELLOW}{'='*60}\n{msg}\n{'='*60}{Colors.END}")

# Get authentication token
def get_auth_token(email):
    try:
        response = requests.post(f"{BASE_URL}/auth/login", json={"email": email})
        if response.status_code == 200:
            return response.json()["access_token"]
        return None
    except Exception as e:
        print_error(f"Failed to authenticate: {e}")
        return None

def get_headers(token):
    return {"Authorization": f"Bearer {token}"}

# Department data
DEPARTMENTS = [
    {"name": "Finance Department", "parent": None},
    {"name": "Human Resources", "parent": None},
    {"name": "Information Technology", "parent": None},
    {"name": "Operations", "parent": None},
    {"name": "Procurement", "parent": None},
    {"name": "Legal & Compliance", "parent": None},
    {"name": "Marketing", "parent": None},
    {"name": "Sales", "parent": None},
    {"name": "Accounts Payable", "parent": "Finance Department"},
    {"name": "Accounts Receivable", "parent": "Finance Department"},
    {"name": "Payroll", "parent": "Human Resources"},
    {"name": "Recruitment", "parent": "Human Resources"},
    {"name": "Network Security", "parent": "Information Technology"},
    {"name": "Software Development", "parent": "Information Technology"},
]

# User data with different roles
USERS = [
    {"email": "admin@audit.com", "full_name": "System Administrator", "role": "system_admin", "dept": None},
    {"email": "audit.manager@audit.com", "full_name": "Sarah Johnson", "role": "audit_manager", "dept": None},
    {"email": "senior.auditor@audit.com", "full_name": "Michael Chen", "role": "auditor", "dept": None},
    {"email": "junior.auditor@audit.com", "full_name": "Emily Rodriguez", "role": "auditor", "dept": None},
    {"email": "finance.head@company.com", "full_name": "Robert Williams", "role": "department_head", "dept": "Finance Department"},
    {"email": "finance.officer@company.com", "full_name": "Jennifer Davis", "role": "department_officer", "dept": "Finance Department"},
    {"email": "hr.head@company.com", "full_name": "Patricia Brown", "role": "department_head", "dept": "Human Resources"},
    {"email": "hr.officer@company.com", "full_name": "James Wilson", "role": "department_officer", "dept": "Human Resources"},
    {"email": "it.head@company.com", "full_name": "David Martinez", "role": "department_head", "dept": "Information Technology"},
    {"email": "it.officer@company.com", "full_name": "Linda Anderson", "role": "department_officer", "dept": "Information Technology"},
    {"email": "ops.head@company.com", "full_name": "Christopher Taylor", "role": "department_head", "dept": "Operations"},
    {"email": "procurement.head@company.com", "full_name": "Mary Thomas", "role": "department_head", "dept": "Procurement"},
    {"email": "legal.head@company.com", "full_name": "Richard Jackson", "role": "department_head", "dept": "Legal & Compliance"},
    {"email": "viewer@company.com", "full_name": "Susan White", "role": "viewer", "dept": None},
]

# Audit data templates
AUDIT_TEMPLATES = [
    {
        "title": "Annual Financial Audit 2025",
        "year": 2025,
        "scope": "Comprehensive review of financial statements, internal controls, and compliance with accounting standards. Focus on revenue recognition, expense management, and financial reporting accuracy.",
        "risk_rating": "High",
        "dept": "Finance Department",
        "status": "executing",
        "findings_count": 5,
        "queries_count": 8,
        "evidence_count": 12
    },
    {
        "title": "IT Security and Infrastructure Audit",
        "year": 2025,
        "scope": "Assessment of cybersecurity measures, network infrastructure, data protection policies, and disaster recovery procedures. Evaluation of access controls and vulnerability management.",
        "risk_rating": "Critical",
        "dept": "Information Technology",
        "status": "reporting",
        "findings_count": 7,
        "queries_count": 10,
        "evidence_count": 15
    },
    {
        "title": "HR Compliance and Payroll Audit",
        "year": 2025,
        "scope": "Review of employee records, payroll processing, benefits administration, and compliance with labor laws. Assessment of recruitment processes and performance management systems.",
        "risk_rating": "Medium",
        "dept": "Human Resources",
        "status": "followup",
        "findings_count": 4,
        "queries_count": 6,
        "evidence_count": 10
    },
    {
        "title": "Procurement Process Audit",
        "year": 2025,
        "scope": "Evaluation of procurement policies, vendor selection processes, contract management, and purchase order controls. Review of supplier relationships and cost optimization.",
        "risk_rating": "High",
        "dept": "Procurement",
        "status": "executing",
        "findings_count": 6,
        "queries_count": 7,
        "evidence_count": 11
    },
    {
        "title": "Operations Efficiency Audit",
        "year": 2025,
        "scope": "Analysis of operational workflows, resource utilization, process optimization, and quality control measures. Assessment of productivity metrics and operational risks.",
        "risk_rating": "Medium",
        "dept": "Operations",
        "status": "planned",
        "findings_count": 0,
        "queries_count": 3,
        "evidence_count": 5
    },
    {
        "title": "Legal and Regulatory Compliance Audit",
        "year": 2025,
        "scope": "Review of compliance with applicable laws, regulations, and industry standards. Assessment of legal risk management and contract compliance.",
        "risk_rating": "High",
        "dept": "Legal & Compliance",
        "status": "closed",
        "findings_count": 3,
        "queries_count": 4,
        "evidence_count": 8
    },
]

# Finding templates by severity
FINDING_TEMPLATES = {
    "critical": [
        {
            "title": "Inadequate Access Controls to Financial Systems",
            "impact": "Unauthorized access could lead to financial fraud, data manipulation, and significant financial losses. Potential regulatory violations and reputational damage.",
            "root_cause": "Lack of role-based access control implementation and insufficient monitoring of privileged user activities.",
            "recommendation": "Implement multi-factor authentication, enforce principle of least privilege, and establish comprehensive access logging and monitoring."
        },
        {
            "title": "Missing Disaster Recovery Plan",
            "impact": "Critical business operations could be severely disrupted in case of system failures, natural disasters, or cyber attacks, leading to extended downtime and data loss.",
            "root_cause": "Absence of documented disaster recovery procedures and lack of regular backup testing.",
            "recommendation": "Develop and document comprehensive disaster recovery plan, conduct regular backup tests, and establish recovery time objectives (RTO) and recovery point objectives (RPO)."
        }
    ],
    "high": [
        {
            "title": "Weak Password Policies",
            "impact": "Increased vulnerability to unauthorized access and potential data breaches. Compromised accounts could lead to data theft or system manipulation.",
            "root_cause": "Outdated password requirements and lack of enforcement of password complexity and rotation policies.",
            "recommendation": "Implement strong password policies requiring minimum 12 characters with complexity requirements, enforce 90-day password rotation, and implement account lockout after failed attempts."
        },
        {
            "title": "Inadequate Segregation of Duties",
            "impact": "Single individuals have excessive control over critical processes, increasing risk of errors and fraud going undetected.",
            "root_cause": "Insufficient analysis of user roles and responsibilities, combined with limited system controls.",
            "recommendation": "Conduct comprehensive segregation of duties analysis, implement system-level controls, and establish maker-checker processes for critical transactions."
        },
        {
            "title": "Incomplete Vendor Due Diligence",
            "impact": "Engagement with unreliable or non-compliant vendors could result in poor service delivery, financial losses, and regulatory violations.",
            "root_cause": "Lack of standardized vendor assessment procedures and insufficient documentation requirements.",
            "recommendation": "Establish comprehensive vendor evaluation framework, require financial and compliance documentation, and implement ongoing vendor performance monitoring."
        }
    ],
    "medium": [
        {
            "title": "Outdated Software Inventory",
            "impact": "Inability to effectively manage software licenses and security patches, potentially leading to compliance issues and security vulnerabilities.",
            "root_cause": "Absence of automated software inventory management system and irregular manual updates.",
            "recommendation": "Implement automated software asset management tool, establish quarterly inventory reviews, and create software lifecycle management procedures."
        },
        {
            "title": "Insufficient Employee Training Records",
            "impact": "Difficulty demonstrating compliance with training requirements and potential gaps in employee competencies.",
            "root_cause": "Decentralized training record keeping and lack of standardized training tracking system.",
            "recommendation": "Implement centralized learning management system, establish mandatory training completion tracking, and conduct annual training needs assessments."
        },
        {
            "title": "Incomplete Documentation of Policies",
            "impact": "Inconsistent application of procedures and difficulty ensuring compliance with organizational standards.",
            "root_cause": "Ad-hoc policy development process and lack of centralized policy repository.",
            "recommendation": "Establish policy management framework, create centralized policy repository with version control, and implement regular policy review cycles."
        }
    ],
    "low": [
        {
            "title": "Minor Data Entry Errors in Reports",
            "impact": "Potential for minor inaccuracies in management reports that could affect decision-making if not corrected.",
            "root_cause": "Manual data entry processes without validation checks.",
            "recommendation": "Implement data validation rules, establish peer review process for reports, and consider automation of data transfer where feasible."
        },
        {
            "title": "Inconsistent File Naming Conventions",
            "impact": "Reduced efficiency in document retrieval and potential confusion in document management.",
            "root_cause": "Lack of standardized file naming guidelines and insufficient user training.",
            "recommendation": "Develop and communicate file naming standards, provide user training, and implement automated file naming tools where possible."
        }
    ]
}

# Work program templates
WORK_PROGRAM_TEMPLATES = [
    "Review and test internal controls over financial reporting",
    "Examine compliance with regulatory requirements and industry standards",
    "Assess risk management framework and mitigation strategies",
    "Evaluate effectiveness of governance structures and oversight mechanisms",
    "Test accuracy and completeness of financial transactions and records",
    "Review access controls and user permission management",
    "Assess data backup and recovery procedures",
    "Evaluate vendor management and contract compliance",
    "Test segregation of duties in critical business processes",
    "Review policy documentation and compliance monitoring",
    "Assess training programs and competency requirements",
    "Evaluate performance metrics and KPI tracking",
]

# Query templates for different scenarios
QUERY_TEMPLATES = [
    {
        "from_role": "auditor",
        "to_role": "department_officer",
        "message": "Could you please provide the detailed breakdown of expenses for Q4 2024? We need to verify the allocation across different cost centers."
    },
    {
        "from_role": "auditor",
        "to_role": "department_head",
        "message": "We noticed some discrepancies in the access log reports. Can you clarify the approval process for granting system administrator privileges?"
    },
    {
        "from_role": "department_officer",
        "to_role": "auditor",
        "message": "Regarding your request for expense breakdown, I've attached the detailed report. Please note that some allocations were adjusted in January 2025 due to year-end corrections."
    },
    {
        "from_role": "audit_manager",
        "to_role": "department_head",
        "message": "We need to schedule an interview with your team to discuss the findings related to procurement processes. What dates work best for your availability?"
    },
    {
        "from_role": "department_head",
        "to_role": "audit_manager",
        "message": "Thank you for the preliminary findings. We would like to provide our management response and corrective action plan. When is the deadline for submission?"
    },
]

# Evidence templates
EVIDENCE_TEMPLATES = [
    {"name": "Financial_Statements_Q4_2024.pdf", "desc": "Quarterly financial statements with balance sheet, income statement, and cash flow"},
    {"name": "Access_Control_Matrix.xlsx", "desc": "Comprehensive matrix showing user roles, permissions, and access levels across all systems"},
    {"name": "Vendor_Contracts_2024.zip", "desc": "Collection of vendor agreements, service level agreements, and contract amendments"},
    {"name": "Policy_Manual_v2.3.pdf", "desc": "Updated organizational policies and procedures manual"},
    {"name": "Training_Records_2024.xlsx", "desc": "Employee training completion records and certification tracking"},
    {"name": "Backup_Test_Results.pdf", "desc": "Results of quarterly disaster recovery and backup restoration tests"},
    {"name": "Audit_Trail_Report.csv", "desc": "System audit trail showing user activities and transaction logs"},
    {"name": "Risk_Assessment_Matrix.xlsx", "desc": "Enterprise risk assessment with likelihood and impact ratings"},
    {"name": "Compliance_Checklist.pdf", "desc": "Regulatory compliance verification checklist with supporting documentation"},
    {"name": "Internal_Control_Documentation.docx", "desc": "Detailed documentation of internal control procedures and testing results"},
]

def create_departments(token):
    """Create all departments"""
    print_section("Creating Departments")
    headers = get_headers(token)
    dept_map = {}
    
    # First pass: create departments without parents
    for dept in DEPARTMENTS:
        if dept["parent"] is None:
            try:
                response = requests.post(
                    f"{BASE_URL}/departments",
                    headers=headers,
                    json={"name": dept["name"]}
                )
                if response.status_code == 200:
                    dept_data = response.json()
                    dept_map[dept["name"]] = dept_data["id"]
                    print_success(f"Created department: {dept['name']}")
            except Exception as e:
                print_error(f"Failed to create {dept['name']}: {e}")
    
    # Second pass: create departments with parents
    for dept in DEPARTMENTS:
        if dept["parent"] is not None:
            parent_id = dept_map.get(dept["parent"])
            if parent_id:
                try:
                    response = requests.post(
                        f"{BASE_URL}/departments",
                        headers=headers,
                        json={"name": dept["name"], "parent_department_id": parent_id}
                    )
                    if response.status_code == 200:
                        dept_data = response.json()
                        dept_map[dept["name"]] = dept_data["id"]
                        print_success(f"Created sub-department: {dept['name']} under {dept['parent']}")
                except Exception as e:
                    print_error(f"Failed to create {dept['name']}: {e}")
    
    return dept_map

def create_users(token, dept_map):
    """Create all users"""
    print_section("Creating Users")
    headers = get_headers(token)
    user_map = {}
    
    for user in USERS:
        dept_id = dept_map.get(user["dept"]) if user["dept"] else None
        user_data = {
            "email": user["email"],
            "full_name": user["full_name"],
            "role": user["role"]
        }
        if dept_id:
            user_data["department_id"] = dept_id
        
        try:
            response = requests.post(
                f"{BASE_URL}/users",
                headers=headers,
                json=user_data
            )
            if response.status_code == 200:
                created_user = response.json()
                user_map[user["email"]] = created_user["id"]
                print_success(f"Created user: {user['full_name']} ({user['role']})")
        except Exception as e:
            print_error(f"Failed to create {user['email']}: {e}")
    
    return user_map

def create_audits(token, dept_map, user_map):
    """Create audits with comprehensive data"""
    print_section("Creating Audits")
    headers = get_headers(token)
    audit_map = []
    
    manager_id = user_map.get("audit.manager@audit.com")
    senior_auditor_id = user_map.get("senior.auditor@audit.com")
    junior_auditor_id = user_map.get("junior.auditor@audit.com")
    
    for template in AUDIT_TEMPLATES:
        dept_id = dept_map.get(template["dept"])
        start_date = datetime.now() - timedelta(days=random.randint(30, 90))
        end_date = start_date + timedelta(days=random.randint(60, 120))
        
        audit_data = {
            "title": template["title"],
            "year": template["year"],
            "scope": template["scope"],
            "risk_rating": template["risk_rating"],
            "department_id": dept_id,
            "assigned_manager_id": manager_id,
            "start_date": start_date.isoformat(),
            "end_date": end_date.isoformat()
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/audits",
                headers=headers,
                json=audit_data
            )
            if response.status_code == 200:
                audit = response.json()
                audit_id = audit["id"]
                print_success(f"Created audit: {template['title']}")
                
                # Update status if not planned
                if template["status"] != "planned":
                    requests.put(
                        f"{BASE_URL}/audits/{audit_id}",
                        headers=headers,
                        json={"status": template["status"]}
                    )
                
                # Add audit team
                for auditor_id in [senior_auditor_id, junior_auditor_id]:
                    requests.post(
                        f"{BASE_URL}/audits/{audit_id}/team",
                        headers=headers,
                        json={
                            "user_id": auditor_id,
                            "role_in_audit": "Lead Auditor" if auditor_id == senior_auditor_id else "Staff Auditor"
                        }
                    )
                
                audit_map.append({
                    "id": audit_id,
                    "template": template,
                    "dept_id": dept_id
                })
                
        except Exception as e:
            print_error(f"Failed to create audit {template['title']}: {e}")
    
    return audit_map

def create_work_programs(token, audit_map):
    """Create work programs for audits"""
    print_section("Creating Work Programs")
    headers = get_headers(token)
    
    for audit in audit_map:
        audit_id = audit["id"]
        num_procedures = random.randint(8, 12)
        selected_procedures = random.sample(WORK_PROGRAM_TEMPLATES, num_procedures)
        
        for procedure in selected_procedures:
            status = random.choice(["pending", "in_progress", "completed"])
            try:
                requests.post(
                    f"{BASE_URL}/audits/{audit_id}/work-program",
                    headers=headers,
                    json={
                        "procedure_name": procedure,
                        "description": f"Detailed testing and evaluation of {procedure.lower()}",
                        "status": status
                    }
                )
            except Exception as e:
                print_error(f"Failed to create work program: {e}")
        
        print_success(f"Created {num_procedures} work program items for audit")

def create_evidence(token, audit_map, user_map):
    """Create evidence for audits"""
    print_section("Creating Evidence")
    headers = get_headers(token)
    
    auditor_id = user_map.get("senior.auditor@audit.com")
    
    for audit in audit_map:
        audit_id = audit["id"]
        evidence_count = audit["template"]["evidence_count"]
        
        for i in range(evidence_count):
            evidence = random.choice(EVIDENCE_TEMPLATES)
            try:
                requests.post(
                    f"{BASE_URL}/audits/{audit_id}/evidence",
                    headers=headers,
                    json={
                        "file_name": evidence["name"],
                        "file_url": f"https://storage.example.com/audits/{audit_id}/{evidence['name']}",
                        "description": evidence["desc"]
                    }
                )
            except Exception as e:
                print_error(f"Failed to create evidence: {e}")
        
        print_success(f"Created {evidence_count} evidence items for audit")

def create_findings(token, audit_map):
    """Create findings for audits"""
    print_section("Creating Findings")
    headers = get_headers(token)
    finding_map = []
    
    for audit in audit_map:
        audit_id = audit["id"]
        findings_count = audit["template"]["findings_count"]
        
        if findings_count == 0:
            continue
        
        # Distribute findings across severities
        severities = []
        if findings_count >= 5:
            severities = ["critical"] * 1 + ["high"] * 2 + ["medium"] * 1 + ["low"] * 1
        elif findings_count >= 3:
            severities = ["high"] * 2 + ["medium"] * 1
        else:
            severities = ["medium"] * findings_count
        
        severities = severities[:findings_count]
        
        for severity in severities:
            finding_template = random.choice(FINDING_TEMPLATES[severity])
            
            finding_data = {
                "title": finding_template["title"],
                "severity": severity,
                "impact": finding_template["impact"],
                "root_cause": finding_template["root_cause"],
                "recommendation": finding_template["recommendation"]
            }
            
            try:
                response = requests.post(
                    f"{BASE_URL}/audits/{audit_id}/findings",
                    headers=headers,
                    json=finding_data
                )
                if response.status_code == 200:
                    finding = response.json()
                    finding_map.append({
                        "id": finding["id"],
                        "audit_id": audit_id,
                        "severity": severity
                    })
            except Exception as e:
                print_error(f"Failed to create finding: {e}")
        
        print_success(f"Created {findings_count} findings for audit")
    
    return finding_map

def create_queries(token, audit_map, user_map):
    """Create queries between auditors and department staff"""
    print_section("Creating Queries")
    headers = get_headers(token)
    
    auditor_id = user_map.get("senior.auditor@audit.com")
    manager_id = user_map.get("audit.manager@audit.com")
    
    for audit in audit_map:
        audit_id = audit["id"]
        queries_count = audit["template"]["queries_count"]
        dept_id = audit["dept_id"]
        
        # Find department users
        dept_users = [email for email, uid in user_map.items() 
                      if "officer" in email or "head" in email]
        
        for i in range(queries_count):
            query_template = random.choice(QUERY_TEMPLATES)
            
            # Determine from and to users based on template
            if query_template["from_role"] == "auditor":
                from_user = auditor_id
                to_user = user_map.get(random.choice(dept_users))
            elif query_template["from_role"] == "audit_manager":
                from_user = manager_id
                to_user = user_map.get(random.choice(dept_users))
            else:
                from_user = user_map.get(random.choice(dept_users))
                to_user = auditor_id
            
            if from_user and to_user:
                try:
                    response = requests.post(
                        f"{BASE_URL}/audits/{audit_id}/queries",
                        headers=headers,
                        json={
                            "to_user_id": to_user,
                            "message": query_template["message"]
                        }
                    )
                    
                    # Add a reply for some queries
                    if response.status_code == 200 and random.random() > 0.5:
                        query = response.json()
                        requests.post(
                            f"{BASE_URL}/audits/{audit_id}/queries",
                            headers=headers,
                            json={
                                "to_user_id": from_user,
                                "message": "Thank you for your query. I will provide the requested information by end of week.",
                                "parent_query_id": query["id"]
                            }
                        )
                except Exception as e:
                    print_error(f"Failed to create query: {e}")
        
        print_success(f"Created {queries_count} queries for audit")

def create_reports(token, audit_map):
    """Create audit reports"""
    print_section("Creating Audit Reports")
    headers = get_headers(token)
    
    for audit in audit_map:
        audit_id = audit["id"]
        status = audit["template"]["status"]
        
        # Only create reports for audits in reporting or later stages
        if status in ["reporting", "followup", "closed"]:
            report_content = f"""
# Audit Report: {audit['template']['title']}

## Executive Summary
This audit was conducted to evaluate the effectiveness of controls and compliance with established policies and procedures. The audit covered the period from {datetime.now().year - 1} to {datetime.now().year}.

## Scope and Objectives
{audit['template']['scope']}

## Methodology
The audit was conducted in accordance with International Standards for the Professional Practice of Internal Auditing. Our approach included:
- Review of policies, procedures, and documentation
- Testing of internal controls
- Interviews with key personnel
- Analysis of transactions and records
- Risk assessment and evaluation

## Key Findings
During our audit, we identified {audit['template']['findings_count']} findings requiring management attention. These findings have been categorized by severity and include recommendations for improvement.

## Overall Assessment
Risk Rating: {audit['template']['risk_rating']}

The overall control environment requires improvement in several areas. Management has been cooperative throughout the audit process and has committed to implementing the recommended corrective actions.

## Conclusion
We appreciate the cooperation and assistance provided by management and staff during this audit. We will conduct follow-up reviews to ensure that agreed-upon actions are implemented effectively.
"""
            
            report_status = "draft"
            if status == "followup":
                report_status = "approved"
            elif status == "closed":
                report_status = "published"
            
            try:
                response = requests.post(
                    f"{BASE_URL}/audits/{audit_id}/reports",
                    headers=headers,
                    json={"content": report_content}
                )
                
                if response.status_code == 200 and report_status != "draft":
                    report = response.json()
                    requests.put(
                        f"{BASE_URL}/audits/{audit_id}/reports/{report['id']}",
                        headers=headers,
                        json={"status": report_status}
                    )
                
                print_success(f"Created report for audit ({report_status})")
            except Exception as e:
                print_error(f"Failed to create report: {e}")

def create_followups(token, audit_map, finding_map, user_map):
    """Create follow-up actions for findings"""
    print_section("Creating Follow-up Actions")
    headers = get_headers(token)
    
    for audit in audit_map:
        audit_id = audit["id"]
        status = audit["template"]["status"]
        
        # Only create followups for audits in followup stage
        if status in ["followup", "closed"]:
            audit_findings = [f for f in finding_map if f["audit_id"] == audit_id]
            
            for finding in audit_findings:
                # Assign to department officers
                dept_officers = [email for email in user_map.keys() if "officer" in email]
                assigned_to = user_map.get(random.choice(dept_officers))
                
                due_date = datetime.now() + timedelta(days=random.randint(30, 90))
                followup_status = "pending"
                
                if status == "closed":
                    followup_status = random.choice(["completed", "completed", "in_progress"])
                
                try:
                    requests.post(
                        f"{BASE_URL}/audits/{audit_id}/followup",
                        headers=headers,
                        json={
                            "finding_id": finding["id"],
                            "assigned_to_id": assigned_to,
                            "due_date": due_date.isoformat()
                        }
                    )
                except Exception as e:
                    print_error(f"Failed to create followup: {e}")
            
            print_success(f"Created {len(audit_findings)} follow-up actions for audit")

def create_workflows(token, audit_map, dept_map, user_map):
    """Create workflows for audits"""
    print_section("Creating Workflows")
    headers = get_headers(token)
    
    for audit in audit_map[:3]:  # Create workflows for first 3 audits
        audit_id = audit["id"]
        
        # Create workflow with multiple steps
        workflow_steps = []
        step_departments = random.sample(list(dept_map.keys()), min(4, len(dept_map)))
        
        for i, dept_name in enumerate(step_departments):
            dept_id = dept_map[dept_name]
            
            # Find a user in this department
            dept_users = [uid for email, uid in user_map.items() 
                         if any(d in email for d in dept_name.lower().split())]
            assigned_to = dept_users[0] if dept_users else None
            
            workflow_steps.append({
                "step_order": i + 1,
                "department_id": dept_id,
                "assigned_to_id": assigned_to,
                "action_required": random.choice([
                    "review_and_approve",
                    "provide_input",
                    "sign_off",
                    "acknowledge"
                ]),
                "due_date": (datetime.now() + timedelta(days=(i+1)*7)).isoformat()
            })
        
        workflow_data = {
            "audit_id": audit_id,
            "name": f"Approval Workflow - {audit['template']['title'][:30]}",
            "description": "Multi-department review and approval workflow for audit completion",
            "steps": workflow_steps
        }
        
        try:
            response = requests.post(
                f"{BASE_URL}/workflows",
                headers=headers,
                json=workflow_data
            )
            if response.status_code == 200:
                workflow = response.json()
                print_success(f"Created workflow with {len(workflow_steps)} steps")
                
                # Approve first step for some workflows
                if random.random() > 0.5:
                    workflow_id = workflow["id"]
                    # Get workflow details to find first step
                    wf_response = requests.get(
                        f"{BASE_URL}/workflows/{workflow_id}",
                        headers=headers
                    )
                    if wf_response.status_code == 200:
                        wf_data = wf_response.json()
                        if wf_data.get("steps"):
                            first_step_id = wf_data["steps"][0]["id"]
                            requests.post(
                                f"{BASE_URL}/workflows/steps/{first_step_id}/approve",
                                headers=headers,
                                json={
                                    "action": "approved",
                                    "comments": "Reviewed and approved. All documentation is in order."
                                }
                            )
                            print_info("  → First step approved")
        except Exception as e:
            print_error(f"Failed to create workflow: {e}")

def print_summary(audit_map, user_map, dept_map):
    """Print summary of created data"""
    print_section("Data Generation Summary")
    
    print_info(f"Total Departments Created: {len(dept_map)}")
    print_info(f"Total Users Created: {len(user_map)}")
    print_info(f"Total Audits Created: {len(audit_map)}")
    
    print("\n" + Colors.YELLOW + "User Roles Distribution:" + Colors.END)
    role_counts = {}
    for user in USERS:
        role = user["role"]
        role_counts[role] = role_counts.get(role, 0) + 1
    
    for role, count in role_counts.items():
        print(f"  • {role}: {count}")
    
    print("\n" + Colors.YELLOW + "Audit Status Distribution:" + Colors.END)
    status_counts = {}
    for audit in audit_map:
        status = audit["template"]["status"]
        status_counts[status] = status_counts.get(status, 0) + 1
    
    for status, count in status_counts.items():
        print(f"  • {status}: {count}")
    
    print("\n" + Colors.GREEN + "✓ Comprehensive dummy data generation completed!" + Colors.END)
    print(Colors.BLUE + "\nYou can now log in with any of these users:" + Colors.END)
    print("  • admin@audit.com (System Admin)")
    print("  • audit.manager@audit.com (Audit Manager)")
    print("  • senior.auditor@audit.com (Senior Auditor)")
    print("  • finance.head@company.com (Finance Department Head)")
    print("  • it.head@company.com (IT Department Head)")
    print("\nAll users have no password (passwordless authentication)")

def main():
    """Main execution function"""
    print_section("Comprehensive Dummy Data Generator")
    print_info("This script will create realistic data showcasing all system features")
    print_info(f"Target API: {BASE_URL}\n")
    
    # Get authentication token
    print_info("Authenticating as admin...")
    token = get_auth_token(ADMIN_EMAIL)
    
    if not token:
        print_error("Failed to authenticate. Please ensure:")
        print("  1. Backend server is running")
        print("  2. Admin user exists in database")
        print("  3. BASE_URL is correct")
        sys.exit(1)
    
    print_success("Authentication successful\n")
    
    try:
        # Create all data
        dept_map = create_departments(token)
        user_map = create_users(token, dept_map)
        audit_map = create_audits(token, dept_map, user_map)
        create_work_programs(token, audit_map)
        create_evidence(token, audit_map, user_map)
        finding_map = create_findings(token, audit_map)
        create_queries(token, audit_map, user_map)
        create_reports(token, audit_map)
        create_followups(token, audit_map, finding_map, user_map)
        create_workflows(token, audit_map, dept_map, user_map)
        
        # Print summary
        print_summary(audit_map, user_map, dept_map)
        
    except Exception as e:
        print_error(f"An error occurred: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
