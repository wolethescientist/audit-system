# Dummy Data Quick Reference Card

## Quick Start

```bash
# Windows
generate-dummy-data.bat

# Linux/Mac
./generate-dummy-data.sh

# Or directly
python generate-comprehensive-dummy-data.py
```

## Test Users

| Email | Password | Role | Use Case |
|-------|----------|------|----------|
| admin@audit.com | (none) | System Admin | Full system access, user management |
| audit.manager@audit.com | (none) | Audit Manager | Manage audits, assign teams, approve reports |
| senior.auditor@audit.com | (none) | Auditor | Create findings, upload evidence, draft reports |
| junior.auditor@audit.com | (none) | Auditor | Assist in audits, document work programs |
| finance.head@company.com | (none) | Dept Head | Review findings, approve actions, respond to queries |
| finance.officer@company.com | (none) | Dept Officer | Execute follow-ups, upload evidence |
| hr.head@company.com | (none) | Dept Head | HR department oversight |
| hr.officer@company.com | (none) | Dept Officer | HR follow-up actions |
| it.head@company.com | (none) | Dept Head | IT department oversight |
| it.officer@company.com | (none) | Dept Officer | IT follow-up actions |
| ops.head@company.com | (none) | Dept Head | Operations oversight |
| procurement.head@company.com | (none) | Dept Head | Procurement oversight |
| legal.head@company.com | (none) | Dept Head | Legal compliance oversight |
| viewer@company.com | (none) | Viewer | Read-only access |

## Generated Data Summary

### Departments (14)
- Finance Department (+ 2 sub-departments)
- Human Resources (+ 2 sub-departments)
- Information Technology (+ 2 sub-departments)
- Operations
- Procurement
- Legal & Compliance
- Marketing
- Sales

### Audits (6)

| Audit | Status | Risk | Findings | Queries | Evidence |
|-------|--------|------|----------|---------|----------|
| Annual Financial Audit 2025 | Executing | High | 5 | 8 | 12 |
| IT Security Audit | Reporting | Critical | 7 | 10 | 15 |
| HR Compliance Audit | Follow-up | Medium | 4 | 6 | 10 |
| Procurement Process Audit | Executing | High | 6 | 7 | 11 |
| Operations Efficiency Audit | Planned | Medium | 0 | 3 | 5 |
| Legal Compliance Audit | Closed | High | 3 | 4 | 8 |

### Findings by Severity

- **Critical (2 types)**: Access controls, disaster recovery
- **High (3 types)**: Password policies, segregation of duties, vendor due diligence
- **Medium (3 types)**: Software inventory, training records, policy documentation
- **Low (2 types)**: Data entry errors, file naming conventions

### Workflows (3)
- Multi-step approval processes
- Department-specific assignments
- Various action types
- Some with completed first steps

## Feature Testing Checklist

### As System Admin
- [ ] View all departments and users
- [ ] Create new users
- [ ] Assign roles and permissions
- [ ] View system-wide analytics
- [ ] Access all audits

### As Audit Manager
- [ ] View assigned audits
- [ ] Create new audits
- [ ] Assign audit teams
- [ ] Review and approve reports
- [ ] Monitor workflow progress
- [ ] View team performance metrics

### As Auditor
- [ ] View assigned audits
- [ ] Create and update findings
- [ ] Upload evidence documents
- [ ] Send queries to departments
- [ ] Update work programs
- [ ] Draft audit reports
- [ ] Track audit progress

### As Department Head
- [ ] View audits for your department
- [ ] Respond to audit queries
- [ ] Review findings
- [ ] Provide management responses
- [ ] Approve workflow steps
- [ ] Monitor follow-up actions

### As Department Officer
- [ ] View assigned follow-up actions
- [ ] Update action status
- [ ] Upload evidence
- [ ] Respond to queries
- [ ] Complete assigned tasks

### As Viewer
- [ ] View audits (read-only)
- [ ] View reports (read-only)
- [ ] View analytics dashboard
- [ ] Cannot modify any data

## Common Test Scenarios

### Scenario 1: Complete Audit Lifecycle
1. Login as **audit.manager@audit.com**
2. View "Operations Efficiency Audit" (Planned status)
3. Add team members
4. Create work program
5. Login as **senior.auditor@audit.com**
6. Add findings and evidence
7. Draft report
8. Login as **audit.manager@audit.com**
9. Review and approve report
10. Create follow-up actions

### Scenario 2: Workflow Approval
1. Login as **audit.manager@audit.com**
2. View existing workflows
3. Check workflow with pending steps
4. Login as department head assigned to next step
5. Review and approve/reject
6. Check workflow progress

### Scenario 3: Finding Follow-up
1. Login as **finance.officer@company.com**
2. View "My Tasks" page
3. See assigned follow-up actions
4. Upload evidence
5. Update status to "In Progress"
6. Add completion notes
7. Mark as "Completed"

### Scenario 4: Query Communication
1. Login as **senior.auditor@audit.com**
2. Open an executing audit
3. Go to Queries tab
4. View existing queries
5. Send new query to department
6. Login as department user
7. View and respond to query

### Scenario 5: Analytics Dashboard
1. Login as **audit.manager@audit.com**
2. View Analytics page
3. Check audit status distribution
4. Review findings by severity
5. Monitor overdue follow-ups
6. View department-wise metrics

## Data Relationships

```
Department
  ├── Users (Department Head, Officers)
  └── Audits
       ├── Audit Team (Auditors assigned)
       ├── Work Programs (Procedures)
       ├── Evidence (Documents)
       ├── Findings
       │    └── Follow-ups (Assigned to Officers)
       ├── Queries (Between Auditors & Dept Staff)
       ├── Reports (Draft → Review → Approved → Published)
       └── Workflows
            └── Workflow Steps (Department approvals)
                 └── Approvals (User actions)
```

## API Endpoints to Test

```bash
# Get all audits
GET http://localhost:8000/audits

# Get specific audit
GET http://localhost:8000/audits/{audit_id}

# Get audit findings
GET http://localhost:8000/audits/{audit_id}/findings

# Get workflows
GET http://localhost:8000/workflows

# Get my tasks
GET http://localhost:8000/workflows/my-tasks

# Get analytics
GET http://localhost:8000/analytics/overview
```

## Troubleshooting

### No data appears
- Check backend is running: `http://localhost:8000/docs`
- Verify admin user exists
- Check console for errors

### Authentication fails
- Ensure passwordless auth is enabled
- Check user email is correct
- Verify backend configuration

### Missing relationships
- Check foreign key constraints
- Verify UUIDs are valid
- Review database logs

## Reset and Regenerate

To start fresh:

```bash
# Stop backend
# Reset database
cd backend
alembic downgrade base
alembic upgrade head

# Recreate admin user
python create-test-users.py

# Regenerate dummy data
python generate-comprehensive-dummy-data.py
```

## Support

For issues or questions:
1. Check DUMMY_DATA_GUIDE.md for detailed documentation
2. Review backend logs for errors
3. Verify all prerequisites are met
4. Check database constraints and relationships
