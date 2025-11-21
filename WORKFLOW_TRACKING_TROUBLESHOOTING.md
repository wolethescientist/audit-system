# Workflow Tracking Troubleshooting Guide

## Issue: Progress Not Showing

### What You Should See

When you open a workflow detail page, you should see:

```
┌─────────────────────────────────────────────────────────┐
│ Workflow Reference Number                                │
│ WF-2024-00123                              [IN PROGRESS] │
└─────────────────────────────────────────────────────────┘

← Back to Workflows          Last updated: 10:30:45 AM  🔄 Refresh

Financial Audit Approval Process

┌──────────┬──────────┬──────────┬──────────┐
│ Total    │ Current  │ Completed│ Pending  │
│ Steps    │ Step     │ Steps    │ Steps    │
│   5      │   2      │    1     │    3     │
└──────────┴──────────┴──────────┴──────────┘

Workflow Progress
Step 2 of 5                                    40% Complete
[████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░]

Timeline:
✓ Step 1: Finance - APPROVED
  Assigned to: John Doe
  Completed: Nov 21, 10:30 AM
  
⚡ Step 2: HR - IN PROGRESS (pulsing)
  Assigned to: Sarah Smith
  Started: Nov 21, 11:00 AM
  [Take Action on This Step]
  
○ Step 3: Legal - PENDING
  Assigned to: Mike Johnson
```

### Common Issues & Solutions

#### 1. Workflow Shows "Not Started Yet"

**Symptom**: You see "⚠️ Workflow not started yet" message

**Solution**:
1. Look for the green "Start Workflow" button
2. Click it to activate the workflow
3. First step will become "IN PROGRESS"
4. Progress tracking will begin

#### 2. Progress Bar Shows 0%

**Symptom**: Progress bar is empty, shows "Step 0 of X"

**Cause**: Workflow is in PENDING status

**Solution**:
1. Click "Start Workflow" button
2. Wait for page to refresh (auto-refreshes every 10 seconds)
3. Or click the 🔄 Refresh button manually

#### 3. Steps Not Showing

**Symptom**: Timeline is empty or not visible

**Possible Causes**:
- Workflow has no steps defined
- Data loading error
- Browser console errors

**Solution**:
1. Check browser console (F12) for errors
2. Click 🔄 Refresh button
3. Go back and re-open the workflow
4. Verify workflow was created with steps

#### 4. Can't See Action Button

**Symptom**: No "Take Action" button visible

**Possible Causes**:
- Not your turn yet (step is PENDING)
- Step already completed
- Not assigned to this step

**Solution**:
1. Check step status - must be "IN PROGRESS"
2. Verify you're assigned to this step
3. Check "Assigned to" field matches your name
4. Wait for previous steps to complete

#### 5. Reference Number Not Showing

**Symptom**: No reference number at top of page

**Cause**: Workflow created before reference number feature was added

**Solution**:
1. Run database migration: `cd backend && python -m alembic upgrade head`
2. Create a new workflow to test
3. Old workflows may not have reference numbers

## How to Test Workflow Tracking

### Step-by-Step Test

**1. Create Workflow**
```
- Go to Workflows → Create Workflow
- Select an audit
- Add workflow name
- Add 3 steps with different staff
- Click "Create Workflow"
- Note the reference number in success message
```

**2. View Workflow**
```
- Click on the workflow from list
- Should see:
  ✓ Reference number at top
  ✓ Summary cards (Total, Current, Completed, Pending)
  ✓ Progress bar at 0%
  ✓ All 3 steps listed as PENDING
  ✓ Green "Start Workflow" button
```

**3. Start Workflow**
```
- Click "Start Workflow"
- Page refreshes
- Should see:
  ✓ Progress bar moves to 33% (Step 1 of 3)
  ✓ Step 1 changes to IN PROGRESS (blue, pulsing)
  ✓ Step 1 shows "Started" timestamp
  ✓ "Start Workflow" button disappears
```

**4. Login as Staff 1**
```
- Logout and login as staff assigned to Step 1
- Go to "My Tasks"
- Should see workflow in "Action Required" section
- Click "Take Action Now"
- Should see workflow detail page
- Should see "Take Action on This Step" button on Step 1
```

**5. Take Action**
```
- Click "Take Action on This Step"
- Modal opens
- Select action (Approve/Reject/etc.)
- Add comments
- Click "Submit"
- Page refreshes
- Should see:
  ✓ Step 1 changes to APPROVED (green checkmark)
  ✓ Step 1 shows "Completed" timestamp
  ✓ Step 1 shows action history with your name
  ✓ Progress bar moves to 66% (Step 2 of 3)
  ✓ Step 2 changes to IN PROGRESS (blue, pulsing)
```

**6. Login as Staff 2**
```
- Logout and login as staff assigned to Step 2
- Go to "My Tasks"
- Should see workflow in "Action Required" section
- Take action on Step 2
- Verify progress updates
```

**7. Complete All Steps**
```
- Continue with Staff 3
- After last step is approved:
  ✓ Progress bar shows 100%
  ✓ All steps show green checkmarks
  ✓ Workflow status changes to "COMPLETED"
  ✓ No more "Take Action" buttons
```

## Verification Checklist

Use this checklist to verify tracking is working:

- [ ] Reference number visible at top
- [ ] Summary cards show correct counts
- [ ] Progress bar shows correct percentage
- [ ] All steps listed in timeline
- [ ] Step statuses are correct (Pending/In Progress/Approved)
- [ ] Pulsing animation on active step
- [ ] Assigned staff names visible
- [ ] Timestamps showing (Started/Completed)
- [ ] Action history showing after actions taken
- [ ] Comments visible in action history
- [ ] Signatures visible (if applicable)
- [ ] "Take Action" button only for assigned staff
- [ ] Auto-refresh working (every 10 seconds)
- [ ] Manual refresh button working
- [ ] "Last updated" timestamp updating

## Debug Mode

To see what's happening behind the scenes:

**1. Open Browser Console** (F12)

**2. Check for Errors**
```javascript
// Look for red error messages
// Common errors:
- 401 Unauthorized (login again)
- 404 Not Found (workflow doesn't exist)
- 500 Server Error (backend issue)
```

**3. Check Network Tab**
```
- Look for API calls to:
  /workflows/{id}
  /workflows/{id}/steps
  /workflows/{id}/steps/{step_id}/approvals
- Verify they return 200 OK
- Check response data
```

**4. Check Workflow Data**
```javascript
// In console, type:
console.log(workflow);
console.log(steps);
console.log(approvals);

// Should show:
- workflow object with reference_number
- steps array with all steps
- approvals object with action history
```

## Still Not Working?

If tracking still isn't showing after trying all above:

1. **Clear Browser Cache**
   - Ctrl+Shift+Delete
   - Clear cached images and files
   - Reload page

2. **Check Backend is Running**
   ```bash
   # Should see backend running on port 8000
   curl http://localhost:8000/docs
   ```

3. **Check Database Migration**
   ```bash
   cd backend
   python -m alembic current
   # Should show latest migration with reference_number
   ```

4. **Create Fresh Workflow**
   - Create a brand new workflow
   - Test with that one
   - Old workflows may have data issues

5. **Check Browser Compatibility**
   - Use Chrome, Firefox, or Edge
   - Update to latest version
   - Disable browser extensions

## Expected Behavior Summary

### For Creator
- See ALL workflows they created
- See complete progress tracking
- See all steps and their statuses
- See action history for all steps
- Cannot take action (unless also assigned)

### For Assigned Staff (My Turn)
- See workflow in "My Tasks" → "Action Required"
- See "Take Action" button on their step
- Can take action immediately
- See progress update after action

### For Assigned Staff (Waiting)
- See workflow in "My Tasks" → "Upcoming"
- See "WAITING" badge
- See "View Progress" button
- Cannot take action yet
- Can view progress

### For Non-Assigned Staff
- Do NOT see workflow at all
- Not in "My Tasks"
- Not in "Workflows" list
- No access to workflow detail page

## Contact Support

If none of the above solutions work, provide:
1. Screenshot of workflow detail page
2. Browser console errors (F12)
3. Workflow reference number
4. Your user role and department
5. Steps to reproduce the issue
