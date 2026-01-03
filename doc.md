# Galaxy ISO Audit Management System - User Guide

Welcome to the Galaxy ISO Audit Management System. This guide explains all features and how to use them effectively.

---

## System Overview

This system helps organizations manage audits following ISO 19011 guidelines. It covers the complete audit lifecycle from planning to follow-up, with built-in compliance tracking, risk management, and corrective action management.

---

## User Roles

The system has 6 user roles with different access levels:

| Role | Description | Access Level |
|------|-------------|--------------|
| **System Admin** | Full system access. Manages users, departments, and system settings | All features |
| **Audit Manager** | Plans and oversees audits. Assigns auditors and reviews reports | Planning, Analytics, Assets, Vendors, Access Control |
| **Auditor** | Conducts audits, collects evidence, documents findings | Audits, Evidence, Findings, Reports |
| **Department Head** | Reviews audit findings for their department. Approves corrective actions | View audits, Approve workflows, CAPA |
| **Department Officer** | Responds to audit queries. Provides evidence and implements actions | View assigned audits, Upload evidence, Respond to queries |
| **Viewer** | Read-only access to audit information | View only |

---

## Sidebar Features

### 1. Dashboard
**What it does:** Shows a summary of your audit program at a glance.

**You will see:**
- Total audits and their status (planned, executing, closed)
- Open findings by severity (critical, high, medium, low)
- Risk heatmap showing risk distribution
- Compliance scores across ISO frameworks
- CAPA (Corrective Action) status tracker
- Overdue follow-ups

**ISO Reference:** ISO 19011 Clause 5.5 - Monitoring the audit programme

---

### 2. Audits
**What it does:** Create and manage individual audits through their complete lifecycle.

**Audit Lifecycle (ISO 19011 Clause 6):**

| Phase | ISO Clause | What Happens |
|-------|------------|--------------|
| **Planned** | 6.2 | Audit is scheduled but not started |
| **Initiated** | 6.2 | Define objectives, scope, criteria, and assign team |
| **Preparation** | 6.3 | Create checklists, request documents, plan interviews |
| **Executing** | 6.4 | Collect evidence, conduct interviews, document observations |
| **Reporting** | 6.5 | Generate audit report with findings and recommendations |
| **Follow-up** | 6.6 | Track corrective actions and verify implementation |
| **Closed** | - | Audit complete, all actions verified |

**How to use:**
1. Click "Create Audit" to start a new audit
2. Fill in title, year, scope, and risk rating
3. Follow the guided workflow through each phase
4. Use the navigation tabs to access different audit sections

**Audit Sub-sections:**
- **Initiate** - Set objectives, scope, criteria, methodology
- **Team** - Assign lead auditor and team members
- **Prepare** - Create checklists and document requests
- **Work Program** - Define audit procedures
- **Evidence** - Upload and manage audit evidence
- **Findings** - Document non-conformities and observations
- **Queries** - Communication between auditors and auditees
- **Report** - Generate and approve audit reports
- **Follow-up** - Track corrective action implementation

---

### 3. Workflows
**What it does:** Manages approval processes for audit reports and documents.

**How it works:**
1. Create a workflow linked to an audit
2. Add approval steps with assigned departments/users
3. Each step must be approved before moving to the next
4. Track workflow status: Pending → In Progress → Approved/Rejected

**Actions available:**
- Approve - Accept and move to next step
- Reject - Send back with comments
- Return - Request changes
- Sign - Add digital signature
- Review - Mark as reviewed
- Acknowledge - Confirm receipt

**ISO Reference:** ISO 19011 Clause 6.5.2 - Approving and distributing the audit report

---

### 4. Planning
**What it does:** Plan your annual audit schedule.

**Features:**
- Create annual audit programmes
- Schedule audits by quarter
- Risk-based audit selection
- Resource allocation

**ISO Reference:** ISO 19011 Clause 5 - Managing an audit programme

**Access:** System Admin, Audit Manager only

---

### 5. Reports
**What it does:** Generate and manage audit reports.

**Report types:**
- Individual audit reports
- Summary reports
- Compliance reports
- Trend analysis reports

**Features:**
- AI-powered report generation
- Version control
- Review and approval workflow
- Export to PDF/Word

**ISO Reference:** ISO 19011 Clause 6.5 - Preparing and distributing the audit report

---

### 6. Follow-ups
**What it does:** Track corrective actions after audits.

**How to use:**
1. View all follow-up items across audits
2. Filter by status: Pending, In Progress, Completed, Overdue
3. Assign responsible persons
4. Set due dates
5. Upload evidence of completion
6. Verify implementation

**ISO Reference:** ISO 19011 Clause 6.6 - Conducting audit follow-up

---

### 7. Risk Assessment
**What it does:** Identify, assess, and manage risks.

**Features:**
- Create risk assessments linked to audits or assets
- Risk matrix visualization (5x5 grid)
- Calculate risk scores (Likelihood × Impact)
- Define mitigation plans
- Link controls to risks
- AI-suggested controls based on ISO 27001

**Risk Categories:**
| Score | Category |
|-------|----------|
| 1-4 | Low |
| 5-9 | Medium |
| 10-15 | High |
| 16-25 | Critical |

**ISO Reference:** ISO 31000 - Risk Management

---

### 8. CAPA Management
**What it does:** Manage Corrective and Preventive Actions.

**CAPA Types:**
- **Corrective** - Fix existing problems
- **Preventive** - Prevent future problems
- **Both** - Combined approach

**CAPA Workflow:**
1. **Open** - CAPA created
2. **In Progress** - Actions being implemented
3. **Pending Verification** - Awaiting effectiveness check
4. **Closed** - Verified and complete

**Features:**
- Root cause analysis (5 Whys, Fishbone, etc.)
- Link to findings and risks
- Track progress percentage
- Effectiveness review
- Cost tracking

**ISO Reference:** ISO 9001 Clause 10.2 - Nonconformity and corrective action

---

### 9. Documents
**What it does:** Central document library with version control.

**Document lifecycle:**
- Draft → Under Review → Approved → Active → Expired/Archived

**Features:**
- Upload documents with metadata
- Version control
- Approval workflow
- Expiry tracking
- Confidentiality levels (Public, Internal, Confidential, Restricted)
- Search and filter

**ISO Reference:** ISO 9001 Clause 7.5 - Documented information

---

### 10. Assets
**What it does:** Manage organizational assets for audit scope.

**Asset categories:**
- Hardware
- Software
- Data
- People
- Facilities
- Services

**Features:**
- Asset inventory
- Criticality assessment
- Link assets to risks
- Track asset owners

**ISO Reference:** ISO 27001 Annex A.8 - Asset management

**Access:** System Admin, Audit Manager only

---

### 11. Vendors
**What it does:** Manage third-party vendors and suppliers.

**Features:**
- Vendor registry
- Risk rating (Low, Medium, High, Critical)
- Compliance tracking
- Contract management
- Performance monitoring

**ISO Reference:** ISO 27001 Annex A.15 - Supplier relationships

**Access:** System Admin, Audit Manager only

---

### 12. Analytics
**What it does:** Advanced reporting and trend analysis.

**Reports available:**
- Audit completion trends
- Finding trends by severity
- Compliance score trends
- Risk distribution analysis
- CAPA effectiveness metrics
- Department performance

**ISO Reference:** ISO 19011 Clause 5.6 - Reviewing and improving the audit programme

**Access:** System Admin, Audit Manager only

---

### 13. Users
**What it does:** Manage system users.

**Features:**
- Create/edit users
- Assign roles
- Assign to departments
- Activate/deactivate accounts

**Access:** System Admin only

---

### 14. Departments
**What it does:** Manage organizational structure.

**Features:**
- Create departments
- Set parent-child relationships
- Assign department heads

**Access:** System Admin only

---

### 15. Access Control
**What it does:** Fine-grained permission management with enhanced Role-Based Access Control (RBAC).

The Access Control module has 4 sub-features (tabs):

**Access:** System Admin, Audit Manager only

**ISO References:**
- ISO 27001 A.9.2.2 - User access provisioning
- ISO 27001 A.6.1.2 - Segregation of duties
- ISO 27001 A.12.4.1 - Event logging

---

#### Sub-Feature 1: Team Assignment

**What it does:** Assign auditors to audit teams with proper roles per ISO 19011 requirements.

**How to use:**
1. Enter or select an Audit ID
2. Select a Lead Auditor from available users
3. Add team members and assign their role in the audit
4. Click "Assign Team"

**Audit Team Roles:**
| Role | Description |
|------|-------------|
| Lead Auditor | Heads the audit team, responsible for overall audit |
| Senior Auditor | Experienced auditor, can mentor others |
| Auditor | Conducts audit procedures and collects evidence |
| Technical Specialist | Provides expertise in specific technical areas |
| Observer | Watches the audit process (for training/oversight) |
| Trainee Auditor | Learning auditor under supervision |

**Team Statistics shown:**
- Total team size
- Number of auditors by role type
- Competency verification status

**ISO 19011 Compliance:**
- Team competency must be verified before audit execution
- Lead auditor must have appropriate qualifications
- Team composition should match audit scope and complexity

---

#### Sub-Feature 2: User Management

**What it does:** Manage users and assign additional roles from the role matrix.

**How to use:**
1. Search or filter users by name, role, or department
2. Click on a user to select them
3. View their current details and role assignments
4. Assign additional roles if needed

**User Details shown:**
- Name and email
- Primary role (system role)
- Department
- Active/Inactive status

**Assigning Additional Roles:**
1. Select a role from the Role Matrix dropdown
2. Enter a reason for the assignment
3. Check "Temporary Assignment" if time-limited
4. Set expiry date for temporary roles
5. Click "Assign Role"

**Role Assignment Features:**
- Multiple roles can be assigned to one user
- Temporary assignments auto-expire
- Assignment reasons are logged for audit trail
- View all current and historical assignments

**Why use additional roles?**
- Give a user extra permissions for a specific project
- Temporary access during staff absence
- Cross-department collaboration needs

---

#### Sub-Feature 3: Audit Visibility

**What it does:** Controls which audits users can see based on their role and department.

**Your Audit Access section shows:**
- Number of audits you can access
- Your access level (Full, Department, Assigned Only, None)
- List of accessible audits with status and access reason

**Access Levels Explained:**
| Level | Who Gets It | What They See |
|-------|-------------|---------------|
| Full Access | System Administrators | All audits in the system |
| Department + Assigned | Audit Managers | Audits in their department + audits assigned to them |
| Assigned Only | Auditors | Only audits they are assigned to |
| Department Audits | Department Staff | Audits related to their department |

**Admin Features (System Admin only):**

**Check User Access:**
1. Select any user from the dropdown
2. See their access level and accessible audit count
3. Useful for troubleshooting access issues

**Admin Override:**
Use this for emergency access situations:
1. Enter the Audit ID
2. Select the user who needs access
3. Enter a reason (required for audit trail)
4. Click "Apply Admin Override"

⚠️ **Warning:** Admin overrides are logged and audited. Use only for legitimate emergency access.

**Department Access Summary:**
Shows how each role type accesses audits:
- System Administrators → Full System Access
- Audit Managers → Department + Assigned
- Auditors → Assigned Audits Only
- Department Staff → Department Audits

---

#### Sub-Feature 4: Role Matrix

**What it does:** Define custom roles with specific permissions for fine-grained access control.

**Overview Cards show:**
- Total Roles in the system
- System Roles (high privilege)
- Global Roles (cross-department)
- Audit Roles (audit-specific)

**Role Categories:**
| Category | Purpose | Example |
|----------|---------|---------|
| System | High-level system administration | System Administrator |
| Audit | Audit-related activities | Lead Auditor, Auditor |
| Business | Business operations | Department Manager |
| Compliance | Compliance activities | Compliance Officer |

**Role Scope:**
- **Global Role** - Applies across all departments
- **Department Role** - Limited to specific department

**Creating a New Role:**
1. Click "Create Role"
2. Enter role name and description
3. Select category (System, Audit, Business, Compliance)
4. Check "Global Role" if it applies across departments
5. Select permissions (see below)
6. Click save

**Available Permissions:**

**Audit Management:**
- Create Audits
- View All Audits
- View Assigned Audits
- Edit Audits
- Delete Audits
- Approve Reports

**System Management:**
- Manage Users
- Manage Departments
- View Analytics
- Export Data

**Risk & CAPA:**
- Create Risks
- Assess Risks
- Approve Risk Treatments
- Create CAPA
- Assign CAPA
- Close CAPA

**Document Control:**
- Upload Documents
- Approve Documents
- Archive Documents

**Asset & Vendor:**
- Manage Assets
- Assign Assets
- Manage Vendors
- Evaluate Vendors

**Managing Existing Roles:**
- View role details (click eye icon)
- Edit role permissions (click edit icon)
- Delete role (click trash icon) - use with caution

**Role Table shows:**
- Role name and description
- Category badge
- Scope (Global/Department)
- Number of permissions
- Active/Inactive status

---

#### How Access Control Relates to Other Features

```
┌─────────────────────────────────────────────────────────────┐
│                    ACCESS CONTROL                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │    ROLE     │    │    USER     │    │   AUDIT     │     │
│  │   MATRIX    │───►│ MANAGEMENT  │───►│ VISIBILITY  │     │
│  │ (Define     │    │ (Assign     │    │ (Control    │     │
│  │  permissions)│    │  roles)     │    │  what's seen)│    │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│         │                  │                  │             │
│         └──────────────────┼──────────────────┘             │
│                            │                                │
│                            ▼                                │
│                   ┌─────────────┐                           │
│                   │    TEAM     │                           │
│                   │ ASSIGNMENT  │                           │
│                   │ (Assign to  │                           │
│                   │  audits)    │                           │
│                   └─────────────┘                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────┐
              │   AFFECTS ALL FEATURES  │
              ├─────────────────────────┤
              │ • Audits (who can see)  │
              │ • Reports (who approves)│
              │ • CAPA (who assigns)    │
              │ • Documents (who views) │
              │ • Analytics (who sees)  │
              └─────────────────────────┘
```

**Connection to other features:**

| Feature | How Access Control Affects It |
|---------|-------------------------------|
| Audits | Determines who can create, view, edit audits |
| Team Assignment | Controls who can be assigned to audit teams |
| Workflows | Determines who can approve workflow steps |
| Reports | Controls who can generate and approve reports |
| CAPA | Determines who can create, assign, close CAPAs |
| Documents | Controls document upload and approval rights |
| Analytics | Limits who can view analytics data |
| Risk Assessment | Controls who can create and assess risks |

---

#### Best Practices for Access Control

1. **Follow least privilege** - Give users only the permissions they need
2. **Use temporary assignments** - For short-term access needs, set expiry dates
3. **Document override reasons** - Always explain why emergency access was granted
4. **Review roles regularly** - Audit role assignments quarterly
5. **Verify team competency** - Ensure audit team members are qualified
6. **Segregate duties** - Don't let one person control entire processes

---

## Gap Analysis
**What it does:** Compare your organization against ISO framework requirements.

**Features:**
- Select ISO framework (ISO 27001, ISO 9001, etc.)
- Assess compliance for each clause
- Identify gaps
- Create remediation plans
- Link gaps to CAPA items
- Track closure progress

**Compliance Dashboard shows:**
- Overall compliance percentage
- Gaps by severity
- Remediation progress

**ISO Reference:** Multiple frameworks supported

---

## How to Conduct an Audit (Step-by-Step)

### Step 1: Create the Audit
1. Go to **Audits** → **Create Audit**
2. Enter audit title, year, scope
3. Select department and risk rating
4. Click **Create**

### Step 2: Initiate (ISO 19011 Clause 6.2)
1. Open the audit → **Initiate** tab
2. Define audit objectives
3. Set audit criteria (standards to audit against)
4. Define detailed scope
5. Select methodology
6. Confirm feasibility

### Step 3: Assign Team
1. Go to **Team** tab
2. Assign lead auditor
3. Add team members with roles
4. Verify competency

### Step 4: Prepare (ISO 19011 Clause 6.3)
1. Go to **Prepare** tab
2. Create audit checklists
3. Send document requests to auditees
4. Conduct risk assessment
5. Plan interview schedule

### Step 5: Execute (ISO 19011 Clause 6.4)
1. Click **Start Execution**
2. Go to **Evidence** tab to upload evidence
3. Use **Work Program** to track procedures
4. Document observations
5. Conduct interviews and record notes
6. Go to **Findings** to document non-conformities

### Step 6: Report (ISO 19011 Clause 6.5)
1. Click **Start Reporting**
2. Go to **Report** tab
3. Generate report (AI-assisted)
4. Review and edit content
5. Submit for approval
6. Create workflow for sign-off

### Step 7: Follow-up (ISO 19011 Clause 6.6)
1. Click **Start Follow-up**
2. Go to **Follow-up** tab
3. Create follow-up items for each finding
4. Assign responsible persons
5. Set due dates
6. Track completion
7. Verify effectiveness

### Step 8: Close Audit
1. Ensure all follow-ups are complete
2. Click **Close Audit**
3. Audit moves to Closed status

---

## Tips for Success

1. **Always upload evidence** - Every finding should have supporting evidence
2. **Use the workflow system** - Get proper approvals for reports
3. **Track CAPA items** - Don't let corrective actions slip
4. **Review the dashboard daily** - Stay on top of overdue items
5. **Document everything** - The system maintains full audit trail

---

## How Features Relate to Each Other

Understanding how features connect helps you use the system more effectively.

### Core Relationships Diagram

```
                    ┌─────────────┐
                    │  PLANNING   │
                    │ (Schedule)  │
                    └──────┬──────┘
                           │ creates
                           ▼
┌──────────┐        ┌─────────────┐        ┌──────────────┐
│  ASSETS  │◄──────►│   AUDITS    │◄──────►│  DEPARTMENTS │
│(What we  │ scope  │  (Central   │ owns   │ (Who is      │
│ audit)   │        │   Hub)      │        │  audited)    │
└──────────┘        └──────┬──────┘        └──────────────┘
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│   EVIDENCE   │   │   FINDINGS   │   │   REPORTS    │
│ (Proof)      │   │ (Problems)   │   │ (Summary)    │
└──────────────┘   └──────┬───────┘   └──────┬───────┘
                          │                   │
                          │                   │ requires
                          ▼                   ▼
                   ┌──────────────┐   ┌──────────────┐
                   │     CAPA     │   │  WORKFLOWS   │
                   │ (Fix it)     │   │ (Approve it) │
                   └──────┬───────┘   └──────────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │  FOLLOW-UPS  │
                   │ (Track it)   │
                   └──────────────┘
```

### Detailed Feature Connections

#### Audits → Everything
Audits are the central hub. Almost everything connects to an audit:

| Feature | Connection to Audit |
|---------|---------------------|
| Evidence | Evidence is uploaded FOR a specific audit |
| Findings | Findings are discovered DURING an audit |
| Reports | Reports summarize AN audit |
| Workflows | Workflows approve audit reports |
| CAPA | CAPA items fix problems found in audits |
| Follow-ups | Follow-ups track actions from audit findings |
| Risk Assessment | Risks can be identified during audits |
| Gap Analysis | Gaps are assessed as part of audits |

#### Findings → CAPA → Follow-ups
This is the corrective action chain:

1. **Finding discovered** → A problem is found during audit execution
2. **CAPA created** → A corrective/preventive action is defined to fix the finding
3. **Follow-up assigned** → Tasks are created to track CAPA implementation
4. **Verification** → Follow-up confirms the fix worked

**Example flow:**
```
Finding: "Password policy not enforced"
    ↓
CAPA: "Implement password complexity requirements"
    ↓
Follow-up: "IT to configure Active Directory by Jan 15"
    ↓
Verification: "Tested - passwords now require 12 characters"
```

#### Risk Assessment → CAPA
Risks can trigger preventive actions:

- High/Critical risks should have CAPA items to mitigate them
- Risk controls link to CAPA for implementation tracking
- When you create a risk, you can directly create a linked CAPA

#### Risk Assessment → Assets
Risks are often tied to assets:

- Each asset can have multiple risk assessments
- Asset criticality affects risk scoring
- Risk matrix shows risks by asset category

#### Gap Analysis → CAPA
Compliance gaps need corrective actions:

- Each gap identified can generate a CAPA item
- Gap closure is tracked through CAPA completion
- Compliance score improves as CAPAs close

#### Documents → Audits
Documents support the audit process:

- Policies and procedures are audit criteria
- Evidence documents are uploaded during execution
- Audit reports are stored as controlled documents

#### Workflows → Reports
Workflows manage report approval:

- When a report is ready, create a workflow
- Workflow routes report through approvers
- Each department head reviews and signs
- Report is published only after workflow completes

#### Vendors → Risk Assessment
Third-party risks:

- Vendors have risk ratings
- High-risk vendors should have risk assessments
- Vendor audits can be scheduled based on risk

#### Assets → Audits
Assets define audit scope:

- Select which assets are in scope for an audit
- Asset owners are notified of audits
- Findings can be linked to specific assets

#### Departments → Users → Audits
Organizational structure:

- Users belong to departments
- Departments are assigned to audits (as auditee)
- Department heads approve findings for their area
- Workflow steps route to departments

#### Dashboard → Everything
Dashboard aggregates all data:

- Shows audit counts from **Audits**
- Shows finding counts from **Findings**
- Shows risk heatmap from **Risk Assessment**
- Shows compliance scores from **Gap Analysis**
- Shows CAPA status from **CAPA Management**
- Shows overdue items from **Follow-ups**

#### Analytics → Everything
Analytics provides trends across:

- Audit completion rates over time
- Finding trends by severity
- CAPA closure rates
- Compliance improvement
- Risk reduction

### Common Workflows Between Features

#### Workflow 1: Complete Audit Cycle
```
Planning → Audit Created → Team Assigned → Preparation → 
Execution (Evidence + Findings) → Report → Workflow Approval → 
CAPA Created → Follow-ups → Verification → Audit Closed
```

#### Workflow 2: Risk-Based Audit
```
Risk Assessment → High Risk Identified → Audit Planned → 
Audit Executed → Controls Tested → CAPA for Weak Controls → 
Risk Re-assessed → Risk Reduced
```

#### Workflow 3: Compliance Gap Closure
```
Gap Analysis → Gap Identified → CAPA Created → 
Actions Implemented → Evidence Uploaded → 
Gap Verified → Compliance Score Updated
```

#### Workflow 4: Document Control
```
Document Uploaded (Draft) → Review Workflow Created → 
Reviewers Approve → Document Active → 
Linked to Audit as Criteria → Expiry Tracked
```

### Quick Reference: What Links to What

| If you're in... | You can link to... |
|-----------------|---------------------|
| Audit | Department, Users (team), Assets, Documents |
| Finding | Audit, CAPA, Follow-up, Evidence |
| CAPA | Audit, Finding, Risk, Gap, User (assignee) |
| Risk | Audit, Asset, CAPA, Controls |
| Gap | Framework, Audit, CAPA, Department |
| Document | Department, Audit (as evidence) |
| Workflow | Audit, Report, Users (approvers) |
| Follow-up | Audit, Finding, User (assignee) |

### Data Flow Summary

**Input sources:**
- Users create audits, risks, documents
- Auditors upload evidence and findings
- System generates reports

**Processing:**
- Workflows route approvals
- CAPA tracks corrective actions
- Follow-ups monitor completion

**Output/Reporting:**
- Dashboard shows real-time status
- Analytics shows trends
- Reports document results

---

## Need Help?

Contact your System Administrator for:
- Password resets
- Role changes
- Access issues
- Training requests

---

*This system follows ISO 19011:2018 Guidelines for auditing management systems*
