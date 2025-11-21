# Workflow System Requirements & Implementation

## Overview
The workflow system enables sequential approval processes across departments with proper access control, tracking, and action types.

## Key Features Implemented

### 1. Reference Number Tracking
- **Auto-generated**: Each workflow gets a unique reference number (format: `WF-YYYY-XXXXX`)
- **Example**: `WF-2024-00123`
- **Purpose**: Easy tracking and reference in communications
- **Visibility**: Displayed prominently on all workflow pages

### 2. Access Control & Visibility
Workflows are **only visible** to:
- The user who created the workflow (creator)
- Staff assigned to any step in the workflow
- Department members where steps are assigned

**Implementation**:
- Backend filters workflows based on user access
- Users cannot see workflows they're not involved in
- Prevents unauthorized access to workflow details

### 3. Sequential Processing
- **Strict Order**: Steps must be completed in sequence (Step 1 → Step 2 → Step 3...)
- **Blocking**: Step 2 cannot be acted upon until Step 1 is completed
- **Rejection Handling**: If any step is rejected, the entire workflow ends immediately
  - All remaining steps are marked as rejected
  - Workflow status changes to "REJECTED"
  - No further actions can be taken

### 4. Action Types

#### a) Review and Approve
- Staff reviews the content
- Can choose: Approve, Reject, or Return for Revision
- Once approved, records the action and moves to next step
- **Database Update**: Records approval with timestamp and user info

#### b) Sign Document
- Requires e-signature capability
- Staff must draw/upload signature
- Signature is captured as base64 image data
- **Validation**: Cannot submit without signature
- Once signed, workflow moves to next step
- **Database Update**: Stores signature data with approval record

#### c) Review Only
- Staff reviews the content
- Clicks "Mark as Reviewed" button
- No approval/rejection - just acknowledgment of review
- **Database Update**: Records review action with "reviewed" status
- Automatically moves to next step

#### d) Acknowledge
- Staff acknowledges receipt/awareness
- Clicks "Acknowledge" button
- Simple confirmation action
- **Database Update**: Records acknowledgment with "acknowledged" status
- Automatically moves to next step

### 5. Real-time Progress Tracking
The workflow creator can see:
- Current step number
- Status of each step (Pending, In Progress, Approved, Rejected)
- Who acted on each step
- When each action was taken
- Comments from each approver
- Signatures (if applicable)

**Visual Indicators**:
- Step numbers with color-coded status
- Timeline view of workflow progress
- Approval history for each step

## Database Schema

### Workflows Table
```sql
- id (UUID, Primary Key)
- reference_number (String, Unique, Indexed) -- NEW
- audit_id (UUID, Foreign Key)
- name (String)
- description (Text)
- created_by_id (UUID, Foreign Key)
- status (Enum: pending, in_progress, approved, rejected, completed)
- current_step (Integer)
- created_at (DateTime)
- completed_at (DateTime)
```

### Workflow Steps Table
```sql
- id (UUID, Primary Key)
- workflow_id (UUID, Foreign Key)
- step_order (Integer)
- department_id (UUID, Foreign Key)
- assigned_to_id (UUID, Foreign Key, Optional)
- action_required (String: review_and_approve, sign, review, acknowledge)
- status (Enum: pending, in_progress, approved, rejected)
- due_date (DateTime, Optional)
- started_at (DateTime)
- completed_at (DateTime)
```

### Workflow Approvals Table
```sql
- id (UUID, Primary Key)
- workflow_step_id (UUID, Foreign Key)
- user_id (UUID, Foreign Key)
- action (Enum: approved, rejected, returned, signed, reviewed, acknowledged) -- UPDATED
- comments (Text, Optional)
- signature_data (Text, Optional) -- Base64 encoded signature
- ip_address (String)
- created_at (DateTime)
```

## API Endpoints

### Create Workflow
```
POST /workflows/
Body: {
  audit_id: UUID,
  name: string,
  description: string,
  steps: [
    {
      step_order: number,
      department_id: UUID,
      assigned_to_id: UUID (optional),
      action_required: "review_and_approve" | "sign" | "review" | "acknowledge",
      due_date: datetime (optional)
    }
  ]
}
```

### List Workflows (Filtered by Access)
```
GET /workflows/
Query Params: audit_id, status
Returns: Only workflows user has access to
```

### Get Workflow Details
```
GET /workflows/{workflow_id}
Returns: Full workflow with steps (if user has access)
```

### Start Workflow
```
POST /workflows/{workflow_id}/start
Action: Activates first step
```

### Take Action on Step
```
POST /workflows/{workflow_id}/steps/{step_id}/approve
Body: {
  action: "approved" | "rejected" | "signed" | "reviewed" | "acknowledged",
  comments: string (optional),
  signature_data: string (optional, required for "signed")
}
```

### Get My Pending Workflows
```
GET /workflows/my-pending
Returns: Workflows with steps assigned to current user that are in progress
```

## Frontend Components

### Workflow List Page (`/workflows`)
- Shows all workflows user has access to
- Displays reference number prominently
- Filter by status
- Shows current step and overall status

### Create Workflow Page (`/workflows/create`)
- Select audit
- Add workflow name and description
- Add multiple steps with:
  - Department selection
  - Staff assignment (optional)
  - Action type selection
  - Due date (optional)
- Steps can be reordered, added, or removed

### Workflow Detail Page (`/workflows/{id}`)
- Shows reference number at top
- Displays all steps with status
- Shows approval history for each step
- "Take Action" button for assigned users
- Modal for taking action with:
  - Action selection (based on step requirement)
  - Comments field
  - Signature canvas (for sign actions)

## Workflow Lifecycle

1. **Creation**: Creator sets up workflow with steps
2. **Pending**: Workflow created but not started
3. **Start**: Creator or authorized user starts workflow
4. **In Progress**: 
   - First step becomes active
   - Assigned user/department can take action
5. **Step Completion**:
   - User takes required action
   - System records action in database
   - If approved/signed/reviewed/acknowledged: Move to next step
   - If rejected: End workflow immediately
6. **Completion**: All steps approved → Workflow marked as completed
7. **Rejection**: Any step rejected → Workflow marked as rejected

## Security & Validation

- **Authentication**: All endpoints require valid JWT token
- **Authorization**: Users can only act on steps assigned to them or their department
- **Step Validation**: Cannot act on steps that aren't in progress
- **Action Validation**: Action must match step requirement
- **Signature Validation**: Signature required for sign actions
- **Sequential Enforcement**: Cannot skip steps

## Migration Instructions

To apply the database changes:

```bash
cd backend
python -m alembic upgrade head
```

This will:
- Add `reference_number` column to workflows table
- Generate reference numbers for existing workflows
- Add unique constraint and index

## Testing Checklist

- [ ] Create workflow with multiple steps
- [ ] Verify reference number is generated
- [ ] Verify only assigned users see workflow
- [ ] Test sequential processing (cannot skip steps)
- [ ] Test rejection stops workflow
- [ ] Test each action type:
  - [ ] Review and Approve
  - [ ] Sign Document (with signature)
  - [ ] Review Only
  - [ ] Acknowledge
- [ ] Verify creator can see real-time progress
- [ ] Test access control (unauthorized users blocked)
- [ ] Verify approval history is recorded correctly

## Future Enhancements

- Email notifications when workflow reaches a user
- Workflow templates for common processes
- Bulk workflow creation
- Workflow analytics and reporting
- Mobile signature support
- Document attachment to workflows
- Workflow delegation/reassignment
