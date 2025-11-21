# Debug: My Tasks Not Showing

## Quick Checklist

### 1. Check User Information
Open browser console (F12) and run:
```javascript
// Get current user
fetch('http://localhost:8000/auth/validate', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
.then(r => r.json())
.then(user => {
  console.log('Current User:');
  console.log('ID:', user.id);
  console.log('Name:', user.full_name);
  console.log('Department ID:', user.department_id);
});
```

### 2. Check Workflows Assigned to You
```javascript
// Get workflows assigned to you
fetch('http://localhost:8000/workflows/my-workflows', {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
.then(r => r.json())
.then(workflows => {
  console.log('My Workflows:', workflows.length);
  workflows.forEach(w => {
    console.log(`- ${w.reference_number}: ${w.name} (${w.status})`);
  });
});
```

### 3. Check Workflow Steps
```javascript
// Replace WORKFLOW_ID with actual workflow ID
const workflowId = 'PASTE_WORKFLOW_ID_HERE';

fetch(`http://localhost:8000/workflows/${workflowId}/steps`, {
  headers: { 'Authorization': 'Bearer ' + localStorage.getItem('token') }
})
.then(r => r.json())
.then(steps => {
  console.log('Workflow Steps:');
  steps.forEach(step => {
    console.log(`Step ${step.step_order}:`);
    console.log('  Assigned to ID:', step.assigned_to_id);
    console.log('  Department ID:', step.department_id);
    console.log('  Status:', step.status);
    console.log('  Action:', step.action_required);
  });
});
```

## Common Issues & Solutions

### Issue 1: "No workflows found"

**Symptom**: Console shows "Found workflows: 0"

**Possible Causes**:
1. No workflows created yet
2. User not assigned to any workflow
3. All workflows are completed/rejected

**Solution**:
1. Create a new workflow
2. Assign it to the current user
3. Make sure to start the workflow

### Issue 2: "No matching step found"

**Symptom**: Console shows "No matching step found for this workflow"

**Possible Causes**:
1. User ID doesn't match `assigned_to_id`
2. User's department doesn't match `department_id`
3. Step assigned to different user/department

**Solution**:
1. Check user's ID and department ID (see checklist #1)
2. Check step's assigned_to_id and department_id (see checklist #3)
3. Make sure they match

**Example**:
```
User ID: 123e4567-e89b-12d3-a456-426614174000
User Dept: 789e4567-e89b-12d3-a456-426614174000

Step assigned_to_id: 123e4567-e89b-12d3-a456-426614174000  ✅ MATCH
OR
Step department_id: 789e4567-e89b-12d3-a456-426614174000   ✅ MATCH
```

### Issue 3: "Workflow not started"

**Symptom**: Workflow shows in list but not in My Tasks

**Possible Cause**: Workflow status is PENDING

**Solution**:
1. Open the workflow detail page
2. Click "Start Workflow" button
3. First step will become IN_PROGRESS
4. Assigned staff will see it in My Tasks

### Issue 4: "Wrong step is active"

**Symptom**: Workflow shows in "Upcoming" but should be in "Action Required"

**Possible Cause**: Your step is PENDING, not IN_PROGRESS

**Solution**:
1. Previous steps must be completed first
2. Workflow moves sequentially
3. Wait for previous staff to complete their step

## Step-by-Step Test

### 1. Create Test Workflow

```sql
-- Get user IDs
SELECT id, full_name, email, department_id FROM users;

-- Create workflow (via UI or API)
-- Assign Step 1 to User A
-- Assign Step 2 to User B
-- Assign Step 3 to User C
```

### 2. Login as User A

```
1. Login with User A credentials
2. Go to Workflows
3. Click "My Tasks" tab
4. Should see workflow in "Upcoming" (if not started)
5. Open workflow detail
6. Click "Start Workflow"
7. Go back to "My Tasks"
8. Should now see workflow in "Action Required"
```

### 3. Take Action as User A

```
1. Click "Take Action Now"
2. Select action (Approve/Reject/etc.)
3. Add comments
4. Submit
5. Workflow moves to Step 2
```

### 4. Login as User B

```
1. Logout User A
2. Login with User B credentials
3. Go to Workflows → My Tasks
4. Should see workflow in "Action Required"
5. Take action
6. Workflow moves to Step 3
```

### 5. Login as User C

```
1. Logout User B
2. Login with User C credentials
3. Go to Workflows → My Tasks
4. Should see workflow in "Action Required"
5. Take action
6. Workflow completes
```

## Database Verification

### Check Workflow Assignment

```sql
-- Check workflow steps
SELECT 
  w.reference_number,
  w.status as workflow_status,
  ws.step_order,
  ws.status as step_status,
  ws.assigned_to_id,
  ws.department_id,
  u.full_name as assigned_to,
  d.name as department
FROM workflows w
JOIN workflow_steps ws ON ws.workflow_id = w.id
LEFT JOIN users u ON u.id = ws.assigned_to_id
LEFT JOIN departments d ON d.id = ws.department_id
WHERE w.reference_number = 'WF-2024-XXXXX'  -- Replace with your workflow ref
ORDER BY ws.step_order;
```

### Check User Details

```sql
-- Check user information
SELECT 
  id,
  full_name,
  email,
  role,
  department_id,
  d.name as department_name
FROM users u
LEFT JOIN departments d ON d.id = u.department_id
WHERE email = 'user@example.com';  -- Replace with user email
```

## Console Debugging

### Enable Detailed Logging

The code now includes detailed console logging. When you click "My Tasks" tab, you should see:

```
Fetching workflows for user: abc123... John Doe
Found workflows: 2
Processing workflow: WF-2024-00123 in_progress
Workflow steps: 3
Step 1: assigned_to=abc123..., my_id=abc123..., dept=def456..., my_dept=def456..., match=true
Found my step: 1 in_progress
Is my turn? true
Processing workflow: WF-2024-00124 in_progress
Workflow steps: 2
Step 1: assigned_to=xyz789..., my_id=abc123..., dept=def456..., my_dept=def456..., match=false
Step 2: assigned_to=abc123..., my_id=abc123..., dept=def456..., my_dept=def456..., match=true
Found my step: 2 pending
Is my turn? false
Total tasks found: 2
```

### What to Look For

**Good Signs**:
- ✅ "Found workflows: X" (X > 0)
- ✅ "match=true" for at least one step
- ✅ "Found my step: X"
- ✅ "Total tasks found: X" (X > 0)

**Bad Signs**:
- ❌ "Found workflows: 0" - No workflows assigned
- ❌ "match=false" for all steps - User not assigned to any step
- ❌ "No matching step found" - Assignment mismatch
- ❌ "Total tasks found: 0" - No tasks to show

## Still Not Working?

If tasks still don't show after checking everything:

### 1. Clear Browser Cache
```
Ctrl+Shift+Delete
Clear cached images and files
Reload page
```

### 2. Check Backend Logs
```bash
# In backend terminal, look for errors
# Should see API calls to /workflows/my-workflows
```

### 3. Verify Database Migration
```bash
cd backend
python -m alembic current
# Should show latest migration
```

### 4. Test with Fresh Workflow
```
1. Create brand new workflow
2. Assign to current logged-in user
3. Start workflow immediately
4. Check My Tasks tab
```

### 5. Check Browser Console for Errors
```
F12 → Console tab
Look for red error messages
Common errors:
- 401 Unauthorized (login again)
- 404 Not Found (workflow doesn't exist)
- 500 Server Error (backend issue)
```

## Contact Information

If still having issues, provide:
1. Screenshot of browser console logs
2. User email/ID
3. Workflow reference number
4. Database query results (workflow steps)
5. Steps to reproduce

This will help diagnose the exact issue!
