# Comprehensive Dummy Data Generator Guide

This guide explains how to use the comprehensive dummy data generator to populate your Audit Management System with realistic data that showcases all features for each role.

## Overview

The `generate-comprehensive-dummy-data.py` script creates:

- **14 Departments** (including parent-child relationships)
- **14 Users** across all roles (System Admin, Audit Manager, Auditors, Department Heads, Officers, Viewer)
- **6 Complete Audits** in various stages (planned, executing, reporting, followup, closed)
- **Work Programs** with multiple procedures per audit
- **Evidence Documents** with realistic file names and descriptions
- **Findings** across all severity levels (Critical, High, Medium, Low)
- **Queries** between auditors and department staff
- **Audit Reports** in different statuses
- **Follow-up Actions** for findings
- **Workflows** with multi-step approval processes

## Features Highlighted

### For Each Role:

#### System Admin
- Full access to all departments and users
- Can manage system-wide configurations
- View all audits and analytics

#### Audit Manager
- Assigned as manager to multiple audits
- Can create and oversee audit workflows
- Review and approve audit reports
- Monitor team performance

#### Auditors (Senior & Junior)
- Assigned to audit teams with specific roles
- Create findings, evidence, and work programs
- Send queries to department staff
- Draft audit reports

#### Department Heads
- Receive audit queries and respond
- Review findings related to their departments
- Participate in workflow approvals
- Provide management responses

#### Department Officers
- Assigned follow-up actions
- Upload evidence and documentation
- Respond to auditor queries
- Execute corrective actions

#### Viewer
- Read-only access to audits and reports
- View analytics and dashboards
- No modification permissions

## Prerequisites

1. **Backend server must be running**
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload
   ```

2. **Admin user must exist**
   - Email: `admin@audit.com`
   - The script uses passwordless authentication

3. **Python requests library**
   ```bash
   pip install requests
   ```

## Usage

### Basic Usage

```bash
python generate-comprehensive-dummy-data.py
```

### What Gets Created

#### Departments (14 total)
- Finance Department
  - Accounts Payable (sub-department)
  - Accounts Receivable (sub-department)
- Human Resources
  - Payroll (sub-department)
  - Recruitment (sub-department)
- Information Technology
  - Network Security (sub-department)
  - Software Development (sub-department)
- Operations
- Procurement
- Legal & Compliance
- Marketing
- Sales

#### Users (14 total)
| Email | Role | Department |
|-------|------|------------|
| admin@audit.com | System Admin | None |
| audit.manager@audit.com | Audit Manager | None |
| senior.auditor@audit.com | Auditor | None |
| junior.auditor@audit.com | Auditor | None |
| finance.head@company.com | Department Head | Finance |
| finance.officer@company.com | Department Officer | Finance |
| hr.head@company.com | Department Head | HR |
| hr.officer@company.com | Department Officer | HR |
| it.head@company.com | Department Head | IT |
| it.officer@company.com | Department Officer | IT |
| ops.head@company.com | Department Head | Operations |
| procurement.head@company.com | Department Head | Procurement |
| legal.head@company.com | Department Head | Legal |
| viewer@company.com | Viewer | None |

#### Audits (6 comprehensive audits)

1. **Annual Financial Audit 2025** (Executing)
   - Risk: High
   - 5 findings, 8 queries, 12 evidence items
   - Department: Finance

2. **IT Security and Infrastructure Audit** (Reporting)
   - Risk: Critical
   - 7 findings, 10 queries, 15 evidence items
   - Department: IT

3. **HR Compliance and Payroll Audit** (Follow-up)
   - Risk: Medium
   - 4 findings, 6 queries, 10 evidence items
   - Department: HR

4. **Procurement Process Audit** (Executing)
   - Risk: High
   - 6 findings, 7 queries, 11 evidence items
   - Department: Procurement

5. **Operations Efficiency Audit** (Planned)
   - Risk: Medium
   - 0 findings, 3 queries, 5 evidence items
   - Department: Operations

6. **Legal and Regulatory Compliance Audit** (Closed)
   - Risk: High
   - 3 findings, 4 queries, 8 evidence items
   - Department: Legal & Compliance

## Data Details

### Findings by Severity

**Critical Findings:**
- Inadequate Access Controls to Financial Systems
- Missing Disaster Recovery Plan

**High Findings:**
- Weak Password Policies
- Inadequate Segregation of Duties
- Incomplete Vendor Due Diligence

**Medium Findings:**
- Outdated Software Inventory
- Insufficient Employee Training Records
- Incomplete Documentation of Policies

**Low Findings:**
- Minor Data Entry Errors in Reports
- Inconsistent File Naming Conventions

### Work Program Procedures

Each audit includes 8-12 procedures such as:
- Review and test internal controls
- Examine compliance with regulations
- Assess risk management framework
- Evaluate governance structures
- Test transaction accuracy
- Review access controls
- Assess backup procedures
- Evaluate vendor management

### Evidence Types

- Financial statements and reports
- Access control matrices
- Vendor contracts
- Policy manuals
- Training records
- Backup test results
- Audit trail reports
- Risk assessment matrices
- Compliance checklists
- Internal control documentation

### Workflows

3 workflows are created with:
- Multi-step approval processes
- Department-specific assignments
- Various action types (review, approve, sign-off, acknowledge)
- Due dates for each step
- Some workflows have first step already approved

## Testing Different Roles

After running the script, you can test the system with different user perspectives:

### Test as Audit Manager
```bash
# Login with: audit.manager@audit.com
```
- View all audits you're managing
- Review team assignments
- Check workflow progress
- Approve reports

### Test as Auditor
```bash
# Login with: senior.auditor@audit.com
```
- View assigned audits
- Add findings and evidence
- Send queries to departments
- Update work programs

### Test as Department Head
```bash
# Login with: finance.head@company.com
```
- View audits for your department
- Respond to queries
- Review findings
- Participate in workflows

### Test as Department Officer
```bash
# Login with: finance.officer@company.com
```
- View assigned follow-up actions
- Upload evidence
- Update task status
- Respond to queries

## Customization

You can modify the script to:

1. **Change the number of audits**: Edit `AUDIT_TEMPLATES` list
2. **Add more departments**: Edit `DEPARTMENTS` list
3. **Add more users**: Edit `USERS` list
4. **Adjust finding severity distribution**: Modify `create_findings()` function
5. **Change API endpoint**: Update `BASE_URL` variable

## Troubleshooting

### Authentication Failed
- Ensure backend is running on `http://localhost:8000`
- Verify admin user exists in database
- Check that passwordless auth is enabled

### Connection Refused
- Start the backend server first
- Verify the port number (default: 8000)
- Check firewall settings

### Data Already Exists
- The script will skip existing departments/users
- To start fresh, reset your database:
  ```bash
  cd backend
  alembic downgrade base
  alembic upgrade head
  ```

## Output

The script provides colored output showing:
- ✓ Green checkmarks for successful operations
- ℹ Blue info messages for progress updates
- ✗ Red X marks for errors
- Yellow section headers

Example output:
```
============================================================
Creating Departments
============================================================
✓ Created department: Finance Department
✓ Created department: Human Resources
✓ Created sub-department: Accounts Payable under Finance Department
...

============================================================
Data Generation Summary
============================================================
ℹ Total Departments Created: 14
ℹ Total Users Created: 14
ℹ Total Audits Created: 6
```

## Next Steps

After generating the data:

1. **Login to the frontend** at `http://localhost:3000`
2. **Test different user roles** to see role-based access control
3. **Explore all features**:
   - Dashboard analytics
   - Audit management
   - Workflow approvals
   - Finding tracking
   - Report generation
   - Follow-up actions
4. **Verify data integrity** by checking relationships between entities

## Notes

- All users use passwordless authentication
- Dates are generated relative to current date
- Random elements ensure varied data
- Relationships between entities are properly maintained
- Data follows all model constraints and validations
