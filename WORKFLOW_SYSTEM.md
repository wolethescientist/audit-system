# Workflow & Approval System

## Overview

The Workflow & Approval System enables multi-department routing with digital signatures and approval chains. Users can create workflows that route audits through multiple departments sequentially, where each department can review, approve, reject, or sign documents.

## Key Features

✅ **Multi-Department Routing** - Route audits through multiple departments in sequence  
✅ **Digital Signatures** - Canvas-based signature capture for document signing  
✅ **Approval Actions** - Approve, Reject, Return for Revision, or Sign  
✅ **Audit Trail** - Complete history of all approvals with timestamps and IP addresses  
✅ **Role-Based Access** - Only authorized users can approve steps  
✅ **Real-Time Status** - Track workflow progress in real-time  
✅ **Due Date Tracking** - Set deadlines for each workflow step  

---

## How It Works

### 1. Create a Workflow

1. Navigate to **Workflows** → **Create Workflow**
2. Select the audit to attach the workflow to
3. Give the workflow a name and description
4. Add workflow steps:
   - Select department for each step
   - Optionally assign to specific user
   - Choose action required (Review & Approve, Sign, etc.)
   - Set due date (optional)
5. Click **Create Workflow**

### 2. Start the Workflow

1. Open the workflow detail page
2. Click **Start Workflow**
3. The first step becomes active and assigned users are notified

### 3. Approve/Reject Steps

When a step is assigned to you:

1. Go to **Workflows** (you'll see pending workflows)
2. Open the workflow
3. Click **Take Action** on your step
4. Choose action:
   - **Approve** - Move to next step
   - **Reject** - Stop workflow
   - **Return for Revision** - Send back for changes
   - **Sign & Approve** - Add digital signature and approve
5. Add comments (optional)
6. If signing, draw your signature on the canvas
7. Click **Submit**

### 4. Track Progress

- View all workflow steps and their status
- See who approved/rejected each step
- View signatures and comments
- Monitor current step and overall progress

---

## Database Schema

### Workflows Table
```sql
- id (UUID)
- audit_id (UUID) - Foreign key to audits
- name (String) - Workflow name
- description (Text) - Optional description
- created_by_id (UUID) - User who created it
- status (Enum) - pending, in_progress, approved, rejected, completed
- current_step (Integer) - Current active step number
- created_at (DateTime)
- completed_at (DateTime)
```

### Workflow Steps Table
```sql
- id (UUID)
- workflow_id (UUID) - Foreign key to workflows
- step_order (Integer) - Step sequence number
- department_id (UUID) - Department responsible
- assigned_to_id (UUID) - Optional specific user
- action_required (String) - Type of action needed
- status (Enum) - pending, in_progress, approved, rejected
- due_date (DateTime) - Optional deadline
- started_at (DateTime)
- completed_at (DateTime)
- created_at (DateTime)
```

### Workflow Approvals Table
```sql
- id (UUID)
- workflow_step_id (UUID) - Foreign key to workflow_steps
- user_id (UUID) - User who took action
- action (Enum) - approved, rejected, returned, signed
- comments (Text) - Optional comments
- signature_data (Text) - Base64 encoded signature image
- ip_address (String) - IP address for audit trail
- created_at (DateTime)
```

---

## API Endpoints

### Create Workflow
```http
POST /workflows/
Authorization: Bearer {token}

{
  "audit_id": "uuid",
  "name": "Financial Audit Approval",
  "description": "Multi-department approval process",
  "steps": [
    {
      "step_order": 1,
      "department_id": "uuid",
      "assigned_to_id": "uuid",
      "action_required": "review_and_approve",
      "due_date": "2024-12-31T23:59:59"
    }
  ]
}
```

### List Workflows
```http
GET /workflows/
GET /workflows/?audit_id={uuid}
GET /workflows/?status=in_progress
Authorization: Bearer {token}
```

### Get Workflow Details
```http
GET /workflows/{workflow_id}
Authorization: Bearer {token}
```

### Start Workflow
```http
POST /workflows/{workflow_id}/start
Authorization: Bearer {token}
```

### Get Workflow Steps
```http
GET /workflows/{workflow_id}/steps
Authorization: Bearer {token}
```

### Approve/Reject Step
```http
POST /workflows/{workflow_id}/steps/{step_id}/approve
Authorization: Bearer {token}

{
  "action": "approved",  // approved, rejected, returned, signed
  "comments": "Looks good",
  "signature_data": "data:image/png;base64,..."  // For signed action
}
```

### Get Step Approvals
```http
GET /workflows/{workflow_id}/steps/{step_id}/approvals
Authorization: Bearer {token}
```

### Get My Pending Workflows
```http
GET /workflows/my-pending
Authorization: Bearer {token}
```

---

## Frontend Pages

### `/workflows`
- List all workflows
- Filter by status (All, Pending, In Progress, Completed)
- Click to view details

### `/workflows/create`
- Create new workflow
- Select audit
- Add multiple steps
- Configure each step (department, assignee, action, due date)

### `/workflows/[id]`
- View workflow details
- See all steps and their status
- View approval history
- Take action on assigned steps
- Digital signature canvas for signing

---

## Workflow States

### Workflow Status
- **PENDING** - Created but not started
- **IN_PROGRESS** - Currently active
- **APPROVED** - All steps approved
- **REJECTED** - Rejected at some step
- **COMPLETED** - Successfully finished

### Step Status
- **PENDING** - Waiting to be activated
- **IN_PROGRESS** - Currently active, awaiting action
- **APPROVED** - Approved and completed
- **REJECTED** - Rejected

### Approval Actions
- **APPROVED** - Standard approval
- **REJECTED** - Reject and stop workflow
- **RETURNED** - Send back for revision
- **SIGNED** - Approve with digital signature

---

## Use Cases

### Example 1: Financial Audit Approval
```
Step 1: Finance Department → Review
Step 2: Audit Committee → Approve
Step 3: CEO → Sign
Step 4: Board of Directors → Final Approval
```

### Example 2: Compliance Review
```
Step 1: Compliance Team → Review findings
Step 2: Legal Department → Legal review
Step 3: Risk Management → Risk assessment
Step 4: Management → Acknowledge
```

### Example 3: Internal Audit Sign-off
```
Step 1: Audit Team Lead → Review report
Step 2: Audit Manager → Approve
Step 3: Department Head → Sign
Step 4: Internal Audit Director → Final sign-off
```

---

## Security Features

✅ **Role-Based Access** - Only authorized users can approve  
✅ **IP Address Logging** - Track where approvals came from  
✅ **Timestamp Tracking** - Exact time of each action  
✅ **Immutable Audit Trail** - Cannot delete or modify approvals  
✅ **Digital Signatures** - Captured as base64 images  
✅ **Department Validation** - Users must belong to assigned department  

---

## Migration Instructions

### Backend Setup

1. **Run the migration:**
```bash
cd backend
alembic upgrade head
```

2. **Restart the backend:**
```bash
uvicorn app.main:app --reload
```

### Frontend Setup

No additional setup needed. The pages are already created.

---

## Testing the System

### 1. Create Test Data

First, ensure you have:
- Multiple departments
- Users assigned to different departments
- At least one audit

### 2. Create a Workflow

```bash
curl -X POST http://localhost:8000/workflows/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "audit_id": "audit-uuid",
    "name": "Test Approval Workflow",
    "description": "Testing multi-department approval",
    "steps": [
      {
        "step_order": 1,
        "department_id": "dept1-uuid",
        "action_required": "review_and_approve"
      },
      {
        "step_order": 2,
        "department_id": "dept2-uuid",
        "action_required": "sign"
      }
    ]
  }'
```

### 3. Start the Workflow

```bash
curl -X POST http://localhost:8000/workflows/{workflow_id}/start \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Approve a Step

```bash
curl -X POST http://localhost:8000/workflows/{workflow_id}/steps/{step_id}/approve \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "approved",
    "comments": "Approved for next step"
  }'
```

---

## Troubleshooting

### Issue: Cannot approve step
**Solution:** Ensure you're assigned to the step or belong to the step's department

### Issue: Workflow not starting
**Solution:** Check that workflow status is "pending" and has at least one step

### Issue: Signature not saving
**Solution:** Ensure you draw on the canvas before submitting

### Issue: Missing workflows in list
**Solution:** Check your department assignment and workflow filters

---

## Future Enhancements

- Email notifications for pending approvals
- Workflow templates for common processes
- Parallel approval steps (multiple departments at once)
- Conditional routing based on audit findings
- Mobile signature capture
- Workflow analytics and reporting
- Automatic escalation for overdue steps
- Workflow versioning and cloning

---

## Summary

The Workflow & Approval System provides a complete solution for routing audits through multiple departments with digital signatures and comprehensive audit trails. It replaces manual paper-based approval processes with a modern, secure, and trackable digital workflow.

**Key Benefits:**
- Faster approval cycles
- Complete audit trail
- Digital signatures
- Real-time tracking
- Role-based security
- Flexible routing
