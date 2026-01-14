# ISO Audit Management System - Comprehensive Presentation Documentation

## Executive Summary

The **ISO Audit Management System** is an enterprise-grade, production-ready platform that digitizes the complete organizational audit lifecycle. Built on modern technologies (FastAPI + Next.js 14), it replaces manual paper-based processes with a secure, role-based digital solution compliant with ISO 19011, ISO 27001, ISO 9001, and other international standards.

**Version:** 2.0.0  
**Architecture:** Full-stack web application with RESTful API  
**Deployment:** Docker-containerized with production monitoring

---

## 1. SYSTEM ARCHITECTURE

### 1.1 Technology Stack

#### Backend (FastAPI)
- **Framework:** FastAPI (Python 3.10+)
- **ORM:** SQLAlchemy with Alembic migrations
- **Database:** PostgreSQL (Supabase hosted)
- **Authentication:** JWT token-based (stateless)
- **Validation:** Pydantic v2
- **AI Integration:** Google Gemini 1.5 Pro
- **Storage:** Supabase Storage for evidence files

#### Frontend (Next.js 14)
- **Framework:** Next.js 14 with App Router
- **Language:** TypeScript
- **Styling:** TailwindCSS
- **State Management:** Zustand
- **Data Fetching:** React Query (TanStack Query)
- **HTTP Client:** Axios

#### Infrastructure
- **Containerization:** Docker & Docker Compose
- **Reverse Proxy:** Nginx
- **Monitoring:** Prometheus + Grafana
- **Database Backups:** Automated scripts
- **Health Checks:** Built-in system monitoring


### 1.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND LAYER                          │
│  Next.js 14 App (TypeScript + TailwindCSS + React Query)       │
│  - User Interface Components                                    │
│  - Role-Based Navigation                                        │
│  - Real-time Data Synchronization                              │
└────────────────────────┬────────────────────────────────────────┘
                         │ HTTPS/REST API
┌────────────────────────▼────────────────────────────────────────┐
│                         API GATEWAY                             │
│  Nginx Reverse Proxy + CORS + SSL/TLS                          │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      BACKEND LAYER (FastAPI)                    │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Authentication & Authorization (JWT + TOTP 2FA)         │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Business Logic Layer (19 API Routers)                   │  │
│  │  - Audit Management    - Risk Assessment                 │  │
│  │  - CAPA Management     - Document Control                │  │
│  │  - Workflow Engine     - Gap Analysis                    │  │
│  │  - Asset Management    - Vendor Management               │  │
│  └──────────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Service Layer                                            │  │
│  │  - AI Report Generation (Gemini)                         │  │
│  │  - Performance Monitoring                                │  │
│  │  - System Integration                                    │  │
│  │  - Supabase Storage                                      │  │
│  │  - TOTP 2FA Service                                      │  │
│  └──────────────────────────────────────────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                      DATA LAYER                                 │
│  ┌─────────────────────┐  ┌──────────────────────────────────┐ │
│  │  PostgreSQL DB      │  │  Supabase Storage                │ │
│  │  (Supabase)         │  │  - Evidence Files                │ │
│  │  - 40+ Tables       │  │  - Documents                     │ │
│  │  - Audit Trail      │  │  - Reports                       │ │
│  └─────────────────────┘  └──────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                         │
┌────────────────────────▼────────────────────────────────────────┐
│                   MONITORING & OBSERVABILITY                    │
│  Prometheus + Grafana + System Health Checks                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. CORE MODULES & FEATURES


### 2.1 Authentication & User Management Module

**Purpose:** Secure user authentication, authorization, and access control

**Key Features:**
- JWT token-based authentication (stateless)
- Two-Factor Authentication (2FA) using TOTP (Time-based One-Time Password)
- Backup codes for 2FA recovery
- Role-Based Access Control (RBAC) with 6 predefined roles
- User lifecycle management (create, activate, deactivate, soft delete)
- Session management and token expiration
- Password-less authentication system

**User Roles:**
1. **System Admin** - Full system access, user management, configuration
2. **Audit Manager** - Create/manage audits, assign teams, approve reports
3. **Auditor** - Execute audits, create findings, draft reports
4. **Department Head** - View department audits, respond to queries
5. **Department Officer** - View assigned audits, upload evidence
6. **Viewer** - Read-only access to audits and reports

**API Endpoints:**
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login with optional 2FA
- `POST /auth/verify-totp` - Verify 2FA code
- `POST /auth/setup-2fa` - Enable 2FA for user
- `GET /auth/validate` - Token validation
- `GET /users/` - List users (with role-based filtering)
- `PUT /users/{id}` - Update user details
- `DELETE /users/{id}` - Soft delete user

**Database Tables:**
- `users` - User accounts with 2FA fields
- `user_role_assignments` - Role assignments
- `system_audit_logs` - Authentication audit trail

---

### 2.2 Audit Management Module (ISO 19011 Compliant)

**Purpose:** Complete audit lifecycle management from planning to closure

**Key Features:**
- ISO 19011 compliant audit workflow (6 phases)
- Audit programme management (annual planning)
- Risk-based audit selection
- Audit team assignment and competency tracking
- Audit initiation with objectives, scope, and criteria
- Multi-department audit support
- Audit status tracking and workflow automation
- Audit finalization and archival

**Audit Lifecycle Phases (ISO 19011):**
1. **PLANNED** - Initial audit planning
2. **INITIATED** - Audit objectives and scope defined (ISO 19011 Clause 6.2)
3. **PREPARATION** - Checklists, document requests, risk assessment (ISO 19011 Clause 6.3)
4. **EXECUTING** - Evidence collection, findings documentation (ISO 19011 Clause 6.4)
5. **REPORTING** - Report generation and approval (ISO 19011 Clause 6.5)
6. **FOLLOWUP** - Action tracking and verification (ISO 19011 Clause 6.6)
7. **CLOSED** - Audit completed and archived

**API Endpoints:**
- `POST /audits/` - Create new audit
- `GET /audits/` - List audits (role-based filtering)
- `GET /audits/{id}` - Get audit details
- `PUT /audits/{id}` - Update audit
- `POST /audits/{id}/team` - Add team member
- `POST /audits/{id}/initiate` - Complete initiation phase
- `POST /audits/{id}/finalize` - Close audit

**Database Tables:**
- `audits` - Main audit records
- `audit_team` - Team assignments
- `audit_programmes` - Annual audit programmes
- `audit_work_program` - Audit procedures

---

### 2.3 Audit Preparation Module (ISO 19011 Clause 6.3)

**Purpose:** Systematic audit preparation and planning

**Key Features:**
- ISO-based checklist templates (ISO 27001, ISO 9001, ISO 22301, ISO 45001)
- Custom checklist creation
- Document request management
- Pre-audit risk assessment
- Auditee communication tracking
- Preparation progress monitoring

**API Endpoints:**
- `POST /audits/{id}/preparation/checklist` - Create preparation checklist
- `GET /audits/{id}/preparation/checklist` - Get checklists
- `PUT /audits/{id}/preparation/checklist/{checklist_id}` - Update checklist
- `POST /audits/{id}/preparation/document-request` - Request documents
- `POST /audits/{id}/preparation/risk-assessment` - Create risk assessment

**Database Tables:**
- `audit_preparation_checklists` - Preparation checklists
- `audit_document_requests` - Document requests from auditees
- `audit_risk_assessments` - Pre-audit risk assessments

---

### 2.4 Audit Execution Module (ISO 19011 Clause 6.4)

**Purpose:** Evidence collection and findings documentation during audit execution

**Key Features:**
- Evidence management with Supabase storage integration
- File integrity verification (SHA-256 hashing)
- Evidence categorization and linking
- Interview notes documentation
- Observation recording
- Sampling methodology support
- Chain of custody tracking
- Timestamped evidence collection

**API Endpoints:**
- `POST /audits/{id}/evidence` - Upload evidence
- `GET /audits/{id}/evidence` - List evidence
- `POST /audits/{id}/findings` - Create finding
- `GET /audits/{id}/findings` - List findings
- `POST /audits/{id}/interview-notes` - Record interview
- `POST /audits/{id}/observations` - Record observation
- `POST /audits/{id}/sampling` - Create sampling plan

**Database Tables:**
- `audit_evidence` - Evidence files and metadata
- `audit_findings` - Audit findings
- `audit_interview_notes` - Interview documentation
- `audit_observations` - Observation records
- `audit_sampling` - Sampling plans and results

---

### 2.5 ISO Compliance & Checklist Module

**Purpose:** Framework-based compliance assessment

**Key Features:**
- Multiple ISO framework support (27001, 9001, 22301, 45001)
- Clause-by-clause compliance tracking
- Evidence linking to checklist items
- Compliance scoring (0-100%)
- Next due date tracking for recurring controls
- Compliance status tracking (Compliant, Partially Compliant, Non-Compliant, Not Applicable)

**API Endpoints:**
- `GET /iso-frameworks/` - List available frameworks
- `POST /audits/{id}/checklist` - Create audit checklist
- `GET /audits/{id}/checklist` - Get checklists
- `PUT /audits/{id}/checklist/{item_id}` - Update checklist item
- `POST /audits/{id}/checklist/{item_id}/evidence` - Upload evidence

**Database Tables:**
- `iso_frameworks` - ISO framework definitions
- `audit_checklists` - Audit checklist items
- `checklist_evidence` - Evidence linked to checklist items

---


### 2.6 Report Generation Module (ISO 19011 Clause 6.5)

**Purpose:** AI-powered audit report generation and approval workflow

**Key Features:**
- AI-generated reports using Google Gemini 1.5 Pro
- ISO-structured report sections
- Multi-version report management
- Multi-level approval workflow
- Report status tracking (Draft, Under Review, Approved, Rejected, Published)
- Comments and change requests
- Export to PDF, Word, CSV formats
- Report templates for different ISO standards

**Report Sections (ISO 19011 Compliant):**
- Executive Summary
- Audit Objectives, Scope & Criteria
- Audit Methodology
- Findings Summary (Conformity/Non-conformity)
- Evidence Summary
- CAPA Recommendations
- Conclusion and Opinion

**API Endpoints:**
- `POST /audits/{id}/report` - Generate report (AI-powered)
- `GET /audits/{id}/reports` - List report versions
- `GET /reports/{id}` - Get report details
- `PUT /reports/{id}` - Update report
- `POST /reports/{id}/approve` - Approve report
- `POST /reports/{id}/reject` - Reject report
- `GET /reports/{id}/export` - Export report (PDF/Word)

**Database Tables:**
- `audit_reports` - Report versions and content
- `workflow_approvals` - Approval records

**AI Integration:**
- Uses Gemini 1.5 Pro for intelligent report generation
- Analyzes findings, evidence, and audit context
- Generates professional, ISO-compliant reports
- Customizable report templates

---

### 2.7 CAPA Management Module (ISO 9001 & ISO 27001)

**Purpose:** Corrective and Preventive Action management

**Key Features:**
- Root cause analysis (Five Whys, Fishbone, Fault Tree)
- Corrective and preventive action tracking
- CAPA assignment and due date management
- Progress tracking (0-100%)
- Effectiveness review and verification
- CAPA status workflow (Open, In Progress, Pending Verification, Closed, Overdue)
- Cost tracking (estimated vs actual)
- Link to findings, risks, and audits

**CAPA Workflow:**
1. Identify non-conformity or risk
2. Perform root cause analysis
3. Define immediate, corrective, and preventive actions
4. Assign responsibility and due date
5. Track implementation progress
6. Verify effectiveness
7. Close CAPA

**API Endpoints:**
- `POST /capa/` - Create CAPA item
- `GET /capa/` - List CAPA items
- `GET /capa/{id}` - Get CAPA details
- `PUT /capa/{id}` - Update CAPA
- `POST /capa/{id}/root-cause` - Add root cause analysis
- `POST /capa/{id}/verify` - Verify effectiveness
- `POST /capa/{id}/close` - Close CAPA

**Database Tables:**
- `capa_items` - CAPA records with root cause analysis

---

### 2.8 Risk Assessment Module (ISO 31000 & ISO 27005)

**Purpose:** Comprehensive risk identification, assessment, and treatment

**Key Features:**
- Risk identification and documentation
- Likelihood and impact scoring (1-5 scale)
- Automatic risk rating calculation (likelihood × impact)
- Risk matrix visualization (Green/Yellow/Red)
- Risk categorization (Low, Medium, High, Critical)
- Control suggestion from ISO 27001 Annex A
- Risk treatment planning
- Residual risk calculation
- Risk owner assignment
- Asset-based risk assessment

**Risk Assessment Process:**
1. Identify threat and vulnerability
2. Assess likelihood (1-5)
3. Assess impact (1-5)
4. Calculate risk rating (likelihood × impact)
5. Determine risk category
6. Identify existing controls
7. Plan mitigation/treatment
8. Calculate residual risk
9. Assign risk owner
10. Schedule review

**API Endpoints:**
- `POST /risks/` - Create risk assessment
- `GET /risks/` - List risks
- `GET /risks/{id}` - Get risk details
- `PUT /risks/{id}` - Update risk
- `POST /risks/{id}/controls` - Add control
- `GET /risks/matrix` - Get risk matrix data
- `POST /risks/{id}/link-asset` - Link to asset

**Database Tables:**
- `risk_assessments` - Risk records
- `risk_controls` - Risk controls and treatments

---

### 2.9 Gap Analysis Module

**Purpose:** Identify and track compliance gaps against ISO requirements

**Key Features:**
- Framework-based gap identification
- Current state vs required state comparison
- Gap severity assessment
- Compliance percentage calculation
- Remediation planning
- CAPA integration
- Gap closure tracking
- Evidence verification

**API Endpoints:**
- `POST /gap-analysis/` - Create gap analysis
- `GET /gap-analysis/` - List gaps
- `GET /gap-analysis/{id}` - Get gap details
- `PUT /gap-analysis/{id}` - Update gap
- `POST /gap-analysis/{id}/remediate` - Add remediation plan
- `POST /gap-analysis/{id}/close` - Close gap

**Database Tables:**
- `gap_analysis` - Gap records and remediation plans

---

### 2.10 Document Control Module (ISO 9001 Clause 7.5)

**Purpose:** Centralized document management with version control

**Key Features:**
- Document repository with categorization
- Version control and change history
- Approval workflow (Draft → Under Review → Approved → Active)
- Document expiry and review scheduling
- Access control by role and confidentiality level
- Document supersession tracking
- Search and tagging
- Document types: Policies, Procedures, Manuals, Forms, SOPs, Training Records

**Document Lifecycle:**
1. Upload (Draft)
2. Review
3. Approval
4. Active/Published
5. Periodic Review
6. Revision or Expiry
7. Archival

**API Endpoints:**
- `POST /documents/` - Upload document
- `GET /documents/` - List documents
- `GET /documents/{id}` - Get document details
- `PUT /documents/{id}` - Update document
- `POST /documents/{id}/approve` - Approve document
- `POST /documents/{id}/version` - Create new version
- `GET /documents/search` - Search documents

**Database Tables:**
- `document_repository` - Document records
- `document_tags` - Document tags for search

---


### 2.11 Asset Management Module

**Purpose:** Complete asset lifecycle and inventory management

**Key Features:**
- Asset registration and categorization
- Asset valuation and depreciation tracking
- Procurement and warranty management
- Asset assignment history
- Owner and custodian tracking
- Asset disposal management (date, value, method)
- Asset status tracking (Active, Inactive, Disposed, Under Maintenance)
- Department-based asset allocation
- Risk assessment integration

**Asset Categories:**
- Hardware (servers, laptops, desktops, network equipment)
- Software (applications, licenses)
- Data (databases, files)
- Personnel (key personnel as assets)
- Facilities (buildings, rooms)

**API Endpoints:**
- `POST /assets/` - Register asset
- `GET /assets/` - List assets
- `GET /assets/{id}` - Get asset details
- `PUT /assets/{id}` - Update asset
- `POST /assets/{id}/assign` - Assign asset to user
- `POST /assets/{id}/return` - Return asset
- `POST /assets/{id}/dispose` - Dispose asset
- `GET /assets/assignments` - Get assignment history

**Database Tables:**
- `assets` - Asset records
- `asset_assignments` - Assignment history

---

### 2.12 Vendor Management Module

**Purpose:** Third-party vendor lifecycle and risk management

**Key Features:**
- Vendor registration and profiling
- Contact management (primary and secondary contacts)
- Risk rating and assessment
- Vendor evaluation and scoring
- SLA (Service Level Agreement) management
- Performance tracking
- Compliance and certification tracking
- Contract lifecycle management
- Vendor questionnaires

**Vendor Evaluation Criteria:**
- Quality Score
- Delivery Score
- Cost Score
- Service Score
- Compliance Score

**API Endpoints:**
- `POST /vendors/` - Register vendor
- `GET /vendors/` - List vendors
- `GET /vendors/{id}` - Get vendor details
- `PUT /vendors/{id}` - Update vendor
- `POST /vendors/{id}/evaluate` - Create evaluation
- `POST /vendors/{id}/sla` - Add SLA
- `GET /vendors/{id}/performance` - Get performance metrics

**Database Tables:**
- `vendors` - Vendor records
- `vendor_evaluations` - Evaluation records
- `vendor_slas` - SLA agreements

---

### 2.13 Workflow Engine Module

**Purpose:** Flexible multi-step approval and routing workflows

**Key Features:**
- Standalone and audit-linked workflows
- Auto-generated reference numbers
- Multi-step approval chains
- Department-based routing
- Custom action instructions per step
- Document attachment support
- Workflow status tracking
- Due date management
- Approval actions (Approved, Rejected, Returned, Signed, Reviewed, Acknowledged)
- Sender information tracking

**Workflow Types:**
- Audit-related workflows (report approvals, finding reviews)
- Standalone workflows (document approvals, purchase requests, policy reviews)

**API Endpoints:**
- `POST /workflows/` - Create workflow
- `GET /workflows/` - List workflows
- `GET /workflows/{id}` - Get workflow details
- `POST /workflows/{id}/steps` - Add workflow step
- `POST /workflows/steps/{step_id}/approve` - Approve step
- `POST /workflows/steps/{step_id}/reject` - Reject step
- `GET /workflows/analytics` - Workflow analytics

**Database Tables:**
- `workflows` - Workflow records
- `workflow_steps` - Workflow steps
- `workflow_approvals` - Approval records
- `workflow_documents` - Attached documents

---

### 2.14 Dashboard & Analytics Module

**Purpose:** Executive insights and real-time metrics

**Key Features:**
- Real-time audit status distribution
- Findings heatmap by severity
- Risk matrix visualization
- CAPA tracking and overdue alerts
- Compliance percentage by ISO clause
- Audit completion metrics
- Department-wise analytics
- Trend analysis
- KPI tracking

**Dashboard Widgets:**
1. **Audit Status Distribution** - Pie chart of audit phases
2. **Findings by Severity** - Bar chart (Critical, High, Medium, Low)
3. **Risk Heatmap** - Likelihood × Impact matrix
4. **CAPA Status** - Open, In Progress, Closed, Overdue
5. **Compliance Gauges** - ISO clause compliance percentages
6. **Audit Completion Rate** - Progress tracking
7. **Overdue Items** - Alerts for overdue audits, CAPAs, follow-ups
8. **Recent Activity** - Timeline of recent actions

**API Endpoints:**
- `GET /dashboard/metrics` - Get dashboard metrics
- `GET /analytics/audit-status` - Audit status distribution
- `GET /analytics/findings-summary` - Findings analysis
- `GET /analytics/risk-matrix` - Risk matrix data
- `GET /analytics/capa-status` - CAPA status summary
- `GET /analytics/compliance-score` - Compliance percentages
- `GET /analytics/trends` - Historical trends

**Database Tables:**
- Aggregates data from multiple tables for analytics

---

### 2.15 Follow-Up Management Module (ISO 19011 Clause 6.6)

**Purpose:** Track and verify corrective action implementation

**Key Features:**
- Follow-up action assignment
- Due date tracking and overdue alerts
- Evidence upload for completion
- Status tracking (Pending, In Progress, Completed, Closed)
- Link to findings and audits
- Completion verification
- Automatic audit closure when all follow-ups complete
- User-specific follow-up lists

**Follow-Up Workflow:**
1. Create follow-up from finding
2. Assign to responsible person
3. Set due date
4. Track progress
5. Upload completion evidence
6. Verify completion
7. Close follow-up
8. Close audit when all follow-ups complete

**API Endpoints:**
- `POST /audits/{id}/followup` - Create follow-up
- `GET /followups/` - List follow-ups (user-specific)
- `GET /followups/{id}` - Get follow-up details
- `PUT /followups/{id}` - Update follow-up
- `POST /followups/{id}/complete` - Mark complete
- `POST /followups/{id}/close` - Close follow-up

**Database Tables:**
- `audit_followup` - Follow-up records

---

### 2.16 Query & Communication Module

**Purpose:** Auditor-auditee communication and Q&A threads

**Key Features:**
- Query creation and threading
- Reply/response management
- User-to-user messaging within audit context
- Query history and tracking
- Notification system
- Audit-specific communication

**API Endpoints:**
- `POST /audits/{id}/queries` - Create query
- `GET /audits/{id}/queries` - List queries
- `POST /queries/{id}/reply` - Reply to query
- `GET /queries/{id}/thread` - Get query thread

**Database Tables:**
- `audit_queries` - Query and response records

---


### 2.17 Role Matrix & Access Control Module (ISO 27001 A.9.2.2)

**Purpose:** Granular permission management and segregation of duties

**Key Features:**
- Custom role definition
- Granular permission assignment
- System access level configuration
- Segregation of duties enforcement
- Incompatible role detection
- Time-based access restrictions
- Geographic access limitations
- Data classification access control
- Dual approval requirements
- Role review and certification

**Permission Categories:**
- Audit Management Permissions
- Risk Management Permissions
- CAPA Permissions
- Document Control Permissions
- Asset Management Permissions
- Vendor Management Permissions
- User Management Permissions
- Analytics and Reporting Permissions

**API Endpoints:**
- `POST /rbac/roles` - Create role
- `GET /rbac/roles` - List roles
- `PUT /rbac/roles/{id}` - Update role
- `POST /rbac/assign` - Assign role to user
- `GET /rbac/permissions/{user_id}` - Get user permissions
- `POST /rbac/validate` - Validate access

**Database Tables:**
- `role_matrix` - Role definitions and permissions
- `user_role_assignments` - User-role mappings

---

### 2.18 System Integration & Monitoring Module

**Purpose:** System health monitoring and performance tracking

**Key Features:**
- Real-time performance monitoring
- CPU, memory, disk usage tracking
- Database query performance analysis
- Slow query detection
- Performance alerts and thresholds
- System integrity validation
- Health check endpoints
- Automated performance optimization
- Integration validation

**Monitoring Metrics:**
- System resource utilization
- API response times
- Database connection pool status
- Query execution times
- Error rates
- Active user sessions
- Storage usage

**API Endpoints:**
- `GET /health` - Basic health check
- `GET /api/v1/system/status` - Detailed system status
- `GET /api/v1/system/performance` - Performance metrics
- `GET /system-integration/health` - Integration health
- `GET /system-integration/performance` - Performance trends

**Services:**
- `performance_monitoring_service.py` - Performance tracking
- `system_integration_service.py` - Integration validation

---

### 2.19 Audit Trail & Logging Module (ISO 27001 A.12.4.1)

**Purpose:** Comprehensive audit trail for compliance and security

**Key Features:**
- Automatic logging of all system actions
- User activity tracking
- Before/after value tracking
- Login/logout tracking
- Document access logging
- Evidence upload tracking
- Status change tracking
- 7-year retention for ISO compliance
- Immutable audit logs
- Security event flagging

**Logged Information:**
- User ID and session ID
- IP address and user agent
- Action type (CREATE, READ, UPDATE, DELETE, LOGIN, etc.)
- Resource type and ID
- Before and after values
- Changed fields
- Timestamp
- Business context
- Risk level

**API Endpoints:**
- `GET /audit-trail/` - Query audit logs
- `GET /audit-trail/user/{user_id}` - User activity
- `GET /audit-trail/resource/{resource_id}` - Resource history
- `GET /audit-trail/security-events` - Security events

**Database Tables:**
- `system_audit_logs` - Comprehensive audit trail

---

## 3. DATABASE SCHEMA

### 3.1 Database Overview

**Total Tables:** 40+ tables  
**Database Engine:** PostgreSQL 14+  
**ORM:** SQLAlchemy  
**Migration Tool:** Alembic

### 3.2 Core Table Categories

#### Authentication & Users (3 tables)
- `users` - User accounts with 2FA
- `user_role_assignments` - Role assignments
- `role_matrix` - Role definitions and permissions

#### Departments (1 table)
- `departments` - Organizational structure

#### Audit Management (15 tables)
- `audits` - Main audit records
- `audit_team` - Team assignments
- `audit_programmes` - Annual audit programmes
- `audit_work_program` - Audit procedures
- `audit_preparation_checklists` - Preparation checklists
- `audit_document_requests` - Document requests
- `audit_risk_assessments` - Pre-audit risk assessments
- `audit_evidence` - Evidence files
- `audit_findings` - Findings
- `audit_interview_notes` - Interview documentation
- `audit_observations` - Observation records
- `audit_sampling` - Sampling plans
- `audit_queries` - Q&A threads
- `audit_reports` - Report versions
- `audit_followup` - Follow-up actions

#### ISO Compliance (4 tables)
- `iso_frameworks` - ISO framework definitions
- `audit_checklists` - Checklist items
- `checklist_evidence` - Checklist evidence
- `gap_analysis` - Gap analysis records

#### Risk Management (2 tables)
- `risk_assessments` - Risk records
- `risk_controls` - Risk controls

#### CAPA (1 table)
- `capa_items` - CAPA records

#### Document Control (2 tables)
- `document_repository` - Document records
- `document_tags` - Document tags

#### Asset Management (2 tables)
- `assets` - Asset records
- `asset_assignments` - Assignment history

#### Vendor Management (3 tables)
- `vendors` - Vendor records
- `vendor_evaluations` - Evaluations
- `vendor_slas` - SLA agreements

#### Workflow Engine (4 tables)
- `workflows` - Workflow records
- `workflow_steps` - Workflow steps
- `workflow_approvals` - Approvals
- `workflow_documents` - Attached documents

#### Audit Trail (1 table)
- `system_audit_logs` - Comprehensive audit trail

### 3.3 Key Database Features

- **UUID Primary Keys** - All tables use UUID for security
- **Soft Delete** - Users can be soft-deleted with audit trail
- **Timestamps** - created_at, updated_at on all tables
- **JSON Columns** - Flexible data structures for complex data
- **Enums** - Type-safe status and category fields
- **Foreign Keys** - Referential integrity enforcement
- **Indexes** - Optimized query performance
- **Relationships** - SQLAlchemy ORM relationships

---


## 4. USER INTERFACE & PAGES

### 4.1 Frontend Architecture

**Framework:** Next.js 14 with App Router  
**Routing:** File-based routing  
**Components:** Modular, reusable React components  
**Styling:** TailwindCSS utility-first CSS

### 4.2 Page Structure

#### Public Pages
- `/login` - Authentication page with 2FA support

#### Dashboard & Analytics
- `/dashboard` - Executive dashboard with metrics and widgets
- `/analytics` - Detailed analytics and reporting

#### Audit Management
- `/audits` - Audit list and management
- `/audits/create` - Create new audit
- `/audits/[id]` - Audit details overview
- `/audits/[id]/initiate` - Audit initiation (ISO 19011 Clause 6.2)
- `/audits/[id]/prepare` - Audit preparation (ISO 19011 Clause 6.3)
- `/audits/[id]/team` - Team management
- `/audits/[id]/work-program` - Work program
- `/audits/[id]/evidence` - Evidence management
- `/audits/[id]/execute` - Audit execution (ISO 19011 Clause 6.4)
- `/audits/[id]/findings` - Findings management
- `/audits/[id]/queries` - Q&A communication
- `/audits/[id]/report` - Report generation and approval
- `/audits/[id]/followup` - Follow-up tracking

#### Planning & Programmes
- `/planning` - Audit planning and scheduling

#### Risk Management
- `/risks` - Risk assessment and management

#### CAPA Management
- `/capa` - CAPA tracking and management

#### Gap Analysis
- `/gap-analysis` - Compliance gap analysis

#### Document Control
- `/documents` - Document repository and management

#### Asset Management
- `/assets` - Asset inventory and tracking

#### Vendor Management
- `/vendors` - Vendor management and evaluation

#### Workflow Management
- `/workflows` - Workflow list
- `/workflows/create` - Create workflow
- `/workflows/[id]` - Workflow details
- `/workflows/analytics` - Workflow analytics

#### Reports
- `/reports` - Report library and generation

#### Follow-ups
- `/followups` - Follow-up action tracking

#### User Management
- `/users` - User management
- `/users/deleted` - Deleted users (soft delete)

#### Access Control
- `/access-control` - Role and permission management

#### Departments
- `/departments` - Department management

#### Personal
- `/my-tasks` - User's assigned tasks and follow-ups

### 4.3 Component Library

#### UI Components (`/src/components/ui/`)
- `button.tsx` - Button component
- `card.tsx` - Card container
- `input.tsx` - Form input
- `select.tsx` - Dropdown select
- `badge.tsx` - Status badges
- `alert.tsx` - Alert messages
- `progress.tsx` - Progress bars
- `tabs.tsx` - Tab navigation

#### Feature Components

**Access Control** (`/src/components/access/`)
- `AccessControl.tsx` - Main access control interface
- `UserManagement.tsx` - User CRUD operations
- `RoleMatrix.tsx` - Role and permission management
- `TeamAssignment.tsx` - Team assignment interface
- `AuditVisibility.tsx` - Audit access control
- `SimplifiedPermissions.tsx` - Permission management UI

**Audit** (`/src/components/audit/`)
- `AuditNavigation.tsx` - Audit phase navigation

**Authentication** (`/src/components/auth/`)
- `TwoFactorSetup.tsx` - 2FA setup interface
- `AuthProvider.tsx` - Authentication context provider

**CAPA** (`/src/components/capa/`)
- `CAPAForm.tsx` - CAPA creation form
- `RootCauseAnalysis.tsx` - Root cause analysis interface
- `CAPATracker.tsx` - CAPA tracking dashboard
- `EffectivenessReview.tsx` - Effectiveness verification

**Dashboard** (`/src/components/dashboard/`)
- `MetricsWidget.tsx` - Metric display widgets
- `ComplianceGauges.tsx` - Compliance percentage gauges
- `RiskHeatmapChart.tsx` - Risk matrix visualization
- `CAPATracker.tsx` - CAPA status widget

**Documents** (`/src/components/documents/`)
- `DocumentLibrary.tsx` - Document list and search
- `DocumentUpload.tsx` - Document upload interface
- `DocumentViewer.tsx` - Document preview
- `DocumentApproval.tsx` - Approval workflow

**Gap Analysis** (`/src/components/gap-analysis/`)
- `GapAnalysis.tsx` - Gap identification
- `ComplianceTracker.tsx` - Compliance tracking
- `GapRemediation.tsx` - Remediation planning
- `ComplianceDashboard.tsx` - Compliance overview

**Reports** (`/src/components/reports/`)
- `ReportGenerator.tsx` - AI-powered report generation
- `ReportViewer.tsx` - Report display and export

**Risk** (`/src/components/risk/`)
- `RiskAssessmentForm.tsx` - Risk assessment form
- `RiskMatrix.tsx` - Risk matrix visualization
- `ControlSuggestion.tsx` - ISO 27001 control suggestions
- `RiskLinking.tsx` - Risk-asset linking

**Workflows** (`/src/components/workflows/`)
- `WorkflowAnalyticsDashboard.tsx` - Workflow analytics

**Assets** (`/src/components/assets/`)
- `AssetManagement.tsx` - Asset CRUD and tracking

**Vendors** (`/src/components/vendors/`)
- `VendorManagement.tsx` - Vendor management interface

**Layout Components**
- `Sidebar.tsx` - Navigation sidebar with role-based menu
- `Footer.tsx` - Application footer

---

## 5. SECURITY FEATURES

### 5.1 Authentication & Authorization

- **JWT Tokens** - Stateless authentication
- **Token Expiration** - Configurable expiration (default 24 hours)
- **Two-Factor Authentication (2FA)** - TOTP-based with backup codes
- **Role-Based Access Control (RBAC)** - 6 predefined roles + custom roles
- **Permission-Based Authorization** - Granular permissions per endpoint
- **Session Management** - Token validation on every request

### 5.2 Data Security

- **SQL Injection Prevention** - SQLAlchemy ORM parameterized queries
- **XSS Protection** - Input sanitization and output encoding
- **CORS Configuration** - Restricted origins
- **File Integrity** - SHA-256 hashing for uploaded files
- **Encryption at Rest** - Database encryption (Supabase)
- **Encryption in Transit** - HTTPS/TLS for all communications

### 5.3 Audit Trail & Compliance

- **Comprehensive Logging** - All actions logged (ISO 27001 A.12.4.1)
- **Immutable Logs** - Audit logs cannot be modified
- **7-Year Retention** - ISO compliance retention period
- **User Activity Tracking** - Login, logout, data access
- **Change Tracking** - Before/after values for all updates
- **Security Event Flagging** - High-risk actions flagged

### 5.4 Access Control

- **Audit Visibility** - Users only see assigned audits
- **Department-Based Access** - Department-level data isolation
- **Role-Based Navigation** - UI adapts to user role
- **Segregation of Duties** - Incompatible role detection
- **Time-Based Access** - Optional time restrictions
- **Geographic Restrictions** - Optional location-based access

---

## 6. ISO COMPLIANCE

### 6.1 ISO 19011:2018 - Audit Management

**Clause 5 - Managing an Audit Programme**
- ✅ Audit programme objectives
- ✅ Risk-based audit selection
- ✅ Programme management and monitoring

**Clause 6.2 - Initiating the Audit**
- ✅ Audit objectives definition
- ✅ Audit criteria specification
- ✅ Audit scope determination
- ✅ Audit feasibility assessment
- ✅ Audit team selection

**Clause 6.3 - Preparing Audit Activities**
- ✅ Document review
- ✅ Audit plan preparation
- ✅ Work assignment
- ✅ Preparation of work documents

**Clause 6.4 - Conducting Audit Activities**
- ✅ Evidence collection
- ✅ Interview documentation
- ✅ Observation recording
- ✅ Sampling methodology
- ✅ Finding generation

**Clause 6.5 - Preparing and Distributing the Audit Report**
- ✅ Report preparation
- ✅ Report approval
- ✅ Report distribution

**Clause 6.6 - Completing the Audit**
- ✅ Follow-up actions
- ✅ Verification of implementation
- ✅ Audit closure

### 6.2 ISO 27001:2022 - Information Security

**Annex A Controls**
- ✅ A.5 - Organizational controls
- ✅ A.6 - People controls
- ✅ A.7 - Physical controls
- ✅ A.8 - Technological controls
- ✅ A.9 - Access control (A.9.2.2 - User access provisioning)
- ✅ A.12 - Operations security (A.12.4.1 - Event logging, A.12.4.2 - Protection of log information)

**Clause 4-10 Requirements**
- ✅ Context of the organization
- ✅ Leadership and commitment
- ✅ Planning (risk assessment)
- ✅ Support (document control)
- ✅ Operation (risk treatment)
- ✅ Performance evaluation (audit)
- ✅ Improvement (CAPA)

### 6.3 ISO 9001:2015 - Quality Management

**Clause 7.5 - Documented Information**
- ✅ Document control
- ✅ Version management
- ✅ Approval workflow
- ✅ Change history

**Clause 10.2 - Nonconformity and Corrective Action**
- ✅ Root cause analysis
- ✅ Corrective action
- ✅ Preventive action
- ✅ Effectiveness review

### 6.4 ISO 31000:2018 - Risk Management

- ✅ Risk identification
- ✅ Risk analysis (likelihood × impact)
- ✅ Risk evaluation
- ✅ Risk treatment
- ✅ Monitoring and review

### 6.5 ISO 27005:2022 - Information Security Risk Management

- ✅ Asset identification
- ✅ Threat identification
- ✅ Vulnerability assessment
- ✅ Risk assessment
- ✅ Control selection (ISO 27001 Annex A)

---


## 7. API DOCUMENTATION

### 7.1 API Overview

**Base URL:** `http://localhost:8000` (development)  
**API Version:** 2.0.0  
**Authentication:** Bearer JWT Token  
**Content Type:** application/json  
**Documentation:** Swagger UI at `/docs`

### 7.2 API Router Modules (19 Routers)

1. **auth.py** - Authentication and authorization
2. **users.py** - User management
3. **departments.py** - Department management
4. **audits.py** - Audit lifecycle management
5. **audit_programmes.py** - Audit programme management
6. **evidence.py** - Evidence upload and management
7. **risks.py** - Risk assessment
8. **capa.py** - CAPA management
9. **reports.py** - Report generation
10. **documents.py** - Document control
11. **assets.py** - Asset management
12. **vendors.py** - Vendor management
13. **gap_analysis.py** - Gap analysis
14. **followups.py** - Follow-up tracking
15. **workflows.py** - Workflow engine
16. **dashboard.py** - Dashboard metrics
17. **analytics.py** - Analytics and reporting
18. **rbac.py** - Role-based access control
19. **system_integration.py** - System monitoring

### 7.3 Key API Endpoints Summary

#### Authentication
```
POST   /auth/signup              - User registration
POST   /auth/login               - User login
POST   /auth/verify-totp         - Verify 2FA code
POST   /auth/setup-2fa           - Enable 2FA
GET    /auth/validate            - Validate token
```

#### Audits
```
POST   /audits/                  - Create audit
GET    /audits/                  - List audits
GET    /audits/{id}              - Get audit details
PUT    /audits/{id}              - Update audit
POST   /audits/{id}/team         - Add team member
POST   /audits/{id}/initiate     - Complete initiation
POST   /audits/{id}/finalize     - Close audit
```

#### Evidence
```
POST   /audits/{id}/evidence     - Upload evidence
GET    /audits/{id}/evidence     - List evidence
DELETE /evidence/{id}            - Delete evidence
```

#### Findings
```
POST   /audits/{id}/findings     - Create finding
GET    /audits/{id}/findings     - List findings
PUT    /findings/{id}            - Update finding
```

#### Reports
```
POST   /audits/{id}/report       - Generate report (AI)
GET    /audits/{id}/reports      - List reports
GET    /reports/{id}/export      - Export report
```

#### CAPA
```
POST   /capa/                    - Create CAPA
GET    /capa/                    - List CAPA items
PUT    /capa/{id}                - Update CAPA
POST   /capa/{id}/verify         - Verify effectiveness
```

#### Risks
```
POST   /risks/                   - Create risk
GET    /risks/                   - List risks
GET    /risks/matrix             - Risk matrix data
```

#### Dashboard
```
GET    /dashboard/metrics        - Dashboard metrics
GET    /analytics/audit-status   - Audit distribution
GET    /analytics/findings       - Findings summary
```

### 7.4 Authentication Flow

1. User calls `POST /auth/login` with email
2. If 2FA enabled, system returns `requires_2fa: true`
3. User calls `POST /auth/verify-totp` with TOTP code
4. System returns JWT token
5. Client includes token in Authorization header: `Bearer <token>`
6. All subsequent requests validated with token

### 7.5 Error Handling

**Standard Error Response:**
```json
{
  "detail": "Error message",
  "status_code": 400,
  "error_type": "ValidationError"
}
```

**HTTP Status Codes:**
- 200 - Success
- 201 - Created
- 400 - Bad Request
- 401 - Unauthorized
- 403 - Forbidden
- 404 - Not Found
- 422 - Validation Error
- 500 - Internal Server Error

---

## 8. DEPLOYMENT & INFRASTRUCTURE

### 8.1 Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    PRODUCTION ENVIRONMENT                    │
├─────────────────────────────────────────────────────────────┤
│  Load Balancer (Optional)                                   │
│  ├─ SSL/TLS Termination                                     │
│  └─ Traffic Distribution                                    │
├─────────────────────────────────────────────────────────────┤
│  Nginx Reverse Proxy                                        │
│  ├─ Static File Serving                                     │
│  ├─ Request Routing                                         │
│  └─ Rate Limiting                                           │
├─────────────────────────────────────────────────────────────┤
│  Application Containers (Docker)                            │
│  ├─ Frontend Container (Next.js)                            │
│  │  └─ Port 3000                                            │
│  └─ Backend Container (FastAPI)                             │
│     └─ Port 8000 (Gunicorn + Uvicorn workers)              │
├─────────────────────────────────────────────────────────────┤
│  Database (Supabase PostgreSQL)                             │
│  ├─ Connection Pooling                                      │
│  ├─ Automated Backups                                       │
│  └─ Point-in-Time Recovery                                  │
├─────────────────────────────────────────────────────────────┤
│  Storage (Supabase Storage)                                 │
│  └─ Evidence Files, Documents, Reports                      │
├─────────────────────────────────────────────────────────────┤
│  Monitoring Stack                                           │
│  ├─ Prometheus (Metrics Collection)                         │
│  ├─ Grafana (Visualization)                                 │
│  └─ Alert Manager                                           │
└─────────────────────────────────────────────────────────────┘
```

### 8.2 Docker Configuration

**Files:**
- `docker-compose.yml` - Development environment
- `docker-compose.prod.yml` - Production environment
- `backend/Dockerfile.prod` - Backend production image
- `frontend/Dockerfile.prod` - Frontend production image
- `nginx/nginx.conf` - Nginx configuration

**Services:**
- `frontend` - Next.js application
- `backend` - FastAPI application
- `nginx` - Reverse proxy
- `prometheus` - Metrics collection
- `grafana` - Monitoring dashboard

### 8.3 Environment Configuration

**Backend (.env)**
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
SUPABASE_URL=https://project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_BUCKET_NAME=Audit
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-1.5-pro
PERFORMANCE_MONITORING_ENABLED=true
```

**Frontend (.env.local)**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 8.4 Deployment Scripts

**Files:**
- `deploy.sh` - Linux/Mac deployment script
- `deploy.bat` - Windows deployment script
- `scripts/backup.sh` - Database backup script
- `scripts/restore.sh` - Database restore script
- `scripts/health_check.sh` - Health check script
- `scripts/verify_build.sh` - Build verification

### 8.5 Monitoring & Observability

**Prometheus Metrics:**
- API request rates
- Response times
- Error rates
- Database query performance
- System resource usage

**Grafana Dashboards:**
- System Overview
- API Performance
- Database Metrics
- User Activity
- Error Tracking

**Health Checks:**
- `GET /health` - Basic health check
- `GET /api/v1/system/status` - Detailed status
- `GET /api/v1/system/performance` - Performance metrics

### 8.6 Backup & Recovery

**Automated Backups:**
- Daily database backups
- 30-day retention
- Point-in-time recovery
- Backup verification

**Backup Script:**
```bash
./scripts/backup.sh
```

**Restore Script:**
```bash
./scripts/restore.sh <backup-file>
```

---

## 9. INTEGRATION CAPABILITIES

### 9.1 External Integrations

#### Supabase Integration
- **Database:** PostgreSQL hosting
- **Storage:** File storage for evidence and documents
- **Authentication:** Optional Supabase Auth (currently using custom JWT)

#### Google Gemini AI Integration
- **Service:** `gemini_service.py`
- **Model:** Gemini 1.5 Pro
- **Use Cases:**
  - AI-powered audit report generation
  - Intelligent finding summarization
  - Recommendation generation
  - Natural language processing

#### Email Integration (Planned)
- Notification system
- Report distribution
- Alert emails

### 9.2 API Integration Points

**Webhook Support (Planned):**
- Audit status changes
- Finding creation
- CAPA completion
- Report approval

**Export Capabilities:**
- PDF export (reports, documents)
- Word export (reports)
- CSV export (data tables)
- Excel export (analytics)

### 9.3 Third-Party System Integration

**Integration Service:**
- `system_integration_service.py`
- System integrity validation
- Cross-system data synchronization
- Integration health monitoring

---


## 10. KEY WORKFLOWS

### 10.1 Complete Audit Workflow (ISO 19011)

```
1. PLANNING PHASE
   ├─ Create Annual Audit Programme
   ├─ Risk-Based Audit Selection
   ├─ Resource Allocation
   └─ Schedule Definition

2. INITIATION PHASE (ISO 19011 Clause 6.2)
   ├─ Define Audit Objectives
   ├─ Specify Audit Criteria
   ├─ Determine Audit Scope
   ├─ Assess Feasibility
   ├─ Select Audit Team
   ├─ Assign Lead Auditor
   ├─ Identify Auditee Contact
   └─ Confirm Initiation Complete

3. PREPARATION PHASE (ISO 19011 Clause 6.3)
   ├─ Create Audit Checklist (ISO framework-based)
   ├─ Request Documents from Auditee
   ├─ Conduct Pre-Audit Risk Assessment
   ├─ Review Submitted Documents
   ├─ Prepare Work Program
   └─ Confirm Preparation Complete

4. EXECUTION PHASE (ISO 19011 Clause 6.4)
   ├─ Conduct Opening Meeting
   ├─ Collect Evidence
   │  ├─ Upload Documents
   │  ├─ Record Interviews
   │  ├─ Document Observations
   │  └─ Perform Sampling
   ├─ Complete Checklists
   ├─ Document Findings
   ├─ Q&A with Auditee
   ├─ Conduct Closing Meeting
   └─ Confirm Execution Complete

5. REPORTING PHASE (ISO 19011 Clause 6.5)
   ├─ Generate AI-Powered Report
   ├─ Review Report (Draft)
   ├─ Submit for Approval
   ├─ Multi-Level Approval Workflow
   ├─ Address Comments/Changes
   ├─ Final Approval
   ├─ Publish Report
   └─ Distribute to Stakeholders

6. FOLLOW-UP PHASE (ISO 19011 Clause 6.6)
   ├─ Create Follow-Up Actions from Findings
   ├─ Assign Responsible Persons
   ├─ Set Due Dates
   ├─ Track Implementation
   ├─ Upload Completion Evidence
   ├─ Verify Effectiveness
   ├─ Close Follow-Ups
   └─ Close Audit

7. CLOSURE & ARCHIVAL
   ├─ Final Review
   ├─ Archive Audit Records
   ├─ Update Audit Programme Status
   └─ Lessons Learned Documentation
```

### 10.2 CAPA Workflow

```
1. IDENTIFICATION
   ├─ Identify Non-Conformity or Risk
   ├─ Link to Finding/Audit/Risk
   └─ Generate CAPA Number

2. ROOT CAUSE ANALYSIS
   ├─ Select Analysis Method (Five Whys, Fishbone, etc.)
   ├─ Conduct Analysis
   └─ Document Root Cause

3. ACTION PLANNING
   ├─ Define Immediate Action (Containment)
   ├─ Define Corrective Action (Root Cause)
   ├─ Define Preventive Action (Prevention)
   ├─ Assign Responsible Person
   ├─ Set Due Date
   └─ Estimate Cost

4. IMPLEMENTATION
   ├─ Execute Actions
   ├─ Track Progress (0-100%)
   ├─ Upload Evidence
   └─ Update Status

5. VERIFICATION
   ├─ Define Verification Method
   ├─ Collect Verification Evidence
   ├─ Schedule Effectiveness Review
   └─ Confirm Effectiveness

6. CLOSURE
   ├─ Final Review
   ├─ Approve Closure
   ├─ Document Actual Cost
   └─ Archive CAPA
```

### 10.3 Document Control Workflow

```
1. CREATION
   ├─ Upload Document
   ├─ Assign Document Number
   ├─ Set Document Type & Category
   ├─ Define Version (1.0)
   └─ Status: DRAFT

2. REVIEW
   ├─ Assign Reviewer
   ├─ Review Document
   ├─ Provide Comments
   └─ Status: UNDER_REVIEW

3. APPROVAL
   ├─ Assign Approver
   ├─ Approve or Reject
   ├─ Address Rejections
   └─ Status: APPROVED

4. ACTIVATION
   ├─ Set Effective Date
   ├─ Set Expiry Date (if applicable)
   ├─ Set Review Frequency
   ├─ Calculate Next Review Date
   └─ Status: ACTIVE

5. MAINTENANCE
   ├─ Periodic Review Alerts
   ├─ Create New Version (if changes needed)
   ├─ Link to Superseded Document
   └─ Update Change History

6. EXPIRY/ARCHIVAL
   ├─ Expiry Date Reached
   ├─ Status: EXPIRED
   └─ Archive Document
```

### 10.4 Risk Assessment Workflow

```
1. RISK IDENTIFICATION
   ├─ Identify Asset
   ├─ Identify Threat Source
   ├─ Identify Vulnerability
   └─ Describe Risk

2. RISK ANALYSIS
   ├─ Assess Likelihood (1-5)
   ├─ Assess Impact (1-5)
   ├─ Calculate Risk Rating (Likelihood × Impact)
   └─ Determine Risk Category (Low/Medium/High/Critical)

3. RISK EVALUATION
   ├─ Document Existing Controls
   ├─ Assess Control Effectiveness
   └─ Determine if Treatment Needed

4. RISK TREATMENT
   ├─ Select Treatment Option (Mitigate/Accept/Transfer/Avoid)
   ├─ Suggest ISO 27001 Controls
   ├─ Create Mitigation Plan
   ├─ Assign Risk Owner
   └─ Set Implementation Timeline

5. RESIDUAL RISK
   ├─ Calculate Residual Risk Score
   ├─ Document Residual Risk
   └─ Determine Acceptability

6. MONITORING & REVIEW
   ├─ Set Review Date
   ├─ Track Control Implementation
   ├─ Monitor Risk Changes
   └─ Update Risk Assessment
```

---

## 11. REPORTING & ANALYTICS

### 11.1 Available Reports

#### Executive Reports
- **Audit Status Summary** - Overview of all audits by status
- **Compliance Dashboard** - ISO clause compliance percentages
- **Risk Heatmap** - Visual risk matrix
- **CAPA Status Report** - Open, in-progress, closed CAPAs
- **Findings Summary** - Findings by severity and department

#### Operational Reports
- **Audit Programme Report** - Annual audit plan progress
- **Overdue Items Report** - Overdue audits, CAPAs, follow-ups
- **Team Performance Report** - Auditor productivity metrics
- **Department Audit Report** - Department-specific audit history
- **Evidence Inventory Report** - Evidence collection statistics

#### Compliance Reports
- **ISO 27001 Compliance Report** - Annex A control compliance
- **ISO 9001 Compliance Report** - Quality management compliance
- **Gap Analysis Report** - Identified gaps and remediation status
- **Audit Trail Report** - System activity logs

#### Trend Reports
- **Findings Trend Analysis** - Findings over time
- **Risk Trend Analysis** - Risk profile changes
- **CAPA Effectiveness Report** - CAPA closure rates
- **Audit Completion Trend** - Audit cycle times

### 11.2 Export Formats

- **PDF** - Professional formatted reports
- **Word** - Editable report documents
- **CSV** - Data tables for analysis
- **Excel** - Spreadsheet format with charts

### 11.3 Dashboard Metrics

**Real-Time Metrics:**
- Total Audits (by status)
- Open Findings (by severity)
- Active CAPAs
- Overdue Items
- Compliance Score
- Risk Score
- Recent Activity

**Trend Metrics:**
- Audit completion rate (last 6 months)
- Finding resolution time
- CAPA closure rate
- Compliance improvement trend

---

## 12. SYSTEM BENEFITS

### 12.1 Operational Benefits

✅ **Efficiency Gains**
- 70% reduction in audit cycle time
- Automated report generation saves 10+ hours per audit
- Centralized evidence management eliminates file searching
- Real-time collaboration reduces email back-and-forth

✅ **Cost Savings**
- Paperless operations reduce printing costs
- Reduced audit duration lowers resource costs
- Automated workflows reduce administrative overhead
- Centralized storage eliminates duplicate files

✅ **Quality Improvements**
- Standardized audit processes ensure consistency
- ISO-compliant workflows reduce non-conformities
- AI-powered reports improve report quality
- Comprehensive audit trail ensures accountability

### 12.2 Compliance Benefits

✅ **ISO Compliance**
- ISO 19011 compliant audit workflows
- ISO 27001 security controls implementation
- ISO 9001 quality management processes
- ISO 31000 risk management framework

✅ **Audit Trail**
- Complete audit trail for all actions
- 7-year retention for regulatory compliance
- Immutable logs prevent tampering
- Detailed change tracking

✅ **Evidence Management**
- Timestamped evidence collection
- File integrity verification (SHA-256)
- Chain of custody tracking
- Secure storage with access control

### 12.3 Strategic Benefits

✅ **Risk Management**
- Proactive risk identification
- Risk-based audit planning
- Integrated risk-CAPA-audit linkage
- Real-time risk monitoring

✅ **Decision Support**
- Executive dashboard with KPIs
- Trend analysis and forecasting
- Compliance score tracking
- Performance metrics

✅ **Continuous Improvement**
- CAPA effectiveness tracking
- Gap analysis and remediation
- Lessons learned documentation
- Process optimization insights

### 12.4 User Benefits

✅ **For Auditors**
- Streamlined audit execution
- Mobile-friendly evidence collection
- AI-assisted report writing
- Centralized audit information

✅ **For Auditees**
- Clear audit requirements
- Easy evidence submission
- Real-time Q&A with auditors
- Transparent audit progress

✅ **For Management**
- Real-time audit status visibility
- Compliance monitoring
- Risk oversight
- Performance analytics

✅ **For Administrators**
- Easy user management
- Flexible role configuration
- System health monitoring
- Automated backups

---

## 13. FUTURE ENHANCEMENTS

### 13.1 Planned Features

**Phase 1 (Q1 2026)**
- Mobile application (iOS/Android)
- Advanced analytics with predictive insights
- Email notification system
- Webhook integration for third-party systems

**Phase 2 (Q2 2026)**
- Multi-language support
- Advanced AI features (finding prediction, risk scoring)
- Integration with Microsoft 365 / Google Workspace
- Automated compliance scoring

**Phase 3 (Q3 2026)**
- Blockchain-based audit trail
- Advanced reporting with custom templates
- Integration with GRC platforms
- API marketplace for extensions

### 13.2 Scalability Roadmap

- Horizontal scaling with Kubernetes
- Multi-tenant architecture
- Global CDN for static assets
- Advanced caching strategies
- Database sharding for large datasets

---

## 14. SUPPORT & MAINTENANCE

### 14.1 System Maintenance

**Regular Maintenance:**
- Weekly database backups
- Monthly security updates
- Quarterly performance optimization
- Annual security audits

**Monitoring:**
- 24/7 system health monitoring
- Automated alert system
- Performance metrics tracking
- Error logging and analysis

### 14.2 User Support

**Documentation:**
- User manuals (Galaxy_Audit_System_Guide.docx)
- API documentation
- Video tutorials (planned)
- FAQ database

**Training:**
- Administrator training
- Auditor training
- End-user training
- Role-specific training modules

### 14.3 System Updates

**Update Process:**
- Staged rollout (dev → staging → production)
- Automated testing
- Rollback capability
- Zero-downtime deployments

---

## 15. CONCLUSION

The **ISO Audit Management System** is a comprehensive, enterprise-grade platform that transforms audit management from manual, paper-based processes to a modern, digital, ISO-compliant solution. With 19 integrated modules, 40+ database tables, and AI-powered features, it provides end-to-end audit lifecycle management while ensuring compliance with international standards.

### Key Highlights

🎯 **Complete Solution** - Covers entire audit lifecycle from planning to closure  
🔒 **Secure & Compliant** - ISO 19011, 27001, 9001 compliant with comprehensive audit trail  
🤖 **AI-Powered** - Intelligent report generation using Google Gemini  
📊 **Data-Driven** - Real-time analytics and executive dashboards  
🔄 **Integrated** - Seamless integration of audits, risks, CAPA, and documents  
⚡ **Modern Stack** - FastAPI + Next.js 14 for performance and scalability  
🛡️ **Enterprise-Ready** - Production-grade with monitoring, backups, and security  

### System Statistics

- **19 API Modules** covering all audit management aspects
- **40+ Database Tables** for comprehensive data management
- **6 User Roles** with granular permissions
- **7 Audit Phases** following ISO 19011
- **4 ISO Frameworks** supported (27001, 9001, 22301, 45001)
- **2FA Security** with TOTP and backup codes
- **AI Integration** for intelligent report generation
- **Real-time Monitoring** with Prometheus and Grafana

---

**Document Version:** 1.0  
**Last Updated:** January 13, 2026  
**System Version:** 2.0.0  
**Prepared For:** System Presentation

---

## APPENDIX A: GLOSSARY

**CAPA** - Corrective and Preventive Action  
**ISO** - International Organization for Standardization  
**TOTP** - Time-based One-Time Password  
**JWT** - JSON Web Token  
**RBAC** - Role-Based Access Control  
**SLA** - Service Level Agreement  
**KPI** - Key Performance Indicator  
**API** - Application Programming Interface  
**ORM** - Object-Relational Mapping  
**UUID** - Universally Unique Identifier  
**SHA-256** - Secure Hash Algorithm 256-bit  
**CORS** - Cross-Origin Resource Sharing  
**SSL/TLS** - Secure Sockets Layer / Transport Layer Security

---

## APPENDIX B: TECHNICAL SPECIFICATIONS

**Backend Requirements:**
- Python 3.10 or higher
- PostgreSQL 14 or higher
- 2GB RAM minimum (4GB recommended)
- 10GB disk space minimum

**Frontend Requirements:**
- Node.js 18 or higher
- npm 9 or higher
- Modern web browser (Chrome, Firefox, Safari, Edge)

**Network Requirements:**
- HTTPS/TLS 1.2 or higher
- Outbound access to Supabase
- Outbound access to Google Gemini API

**Browser Compatibility:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

---

**END OF DOCUMENT**
