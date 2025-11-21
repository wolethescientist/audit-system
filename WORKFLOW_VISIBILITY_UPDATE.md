# Workflow Visibility Update - All Assigned Staff Can See Workflow

## What Changed

### Previous Behavior ❌
- Staff 1 sees workflow → takes action
- Staff 2 **doesn't see workflow** until Staff 1 completes
- Staff 3 **doesn't see workflow** until Staff 2 completes
- Staff 4, 5, 6 **don't see workflow** until their turn

**Problem**: Staff don't know they have a workflow coming until it's their turn

### New Behavior ✅
- **ALL assigned staff see the workflow immediately** when created
- Staff 1 can take action (Step 1 is active)
- Staff 2, 3, 4, 5, 6 can **see the workflow** but **cannot take action yet**
- When Staff 1 completes → Staff 2 can now take action
- Staff 3, 4, 5, 6 still see it but still cannot act
- And so on...

**Benefit**: Everyone knows they have a workflow coming and can track progress

## Implementation

### Backend Changes

#### 1. New Endpoint: `/workflows/my-workflows`
```python
@router.get("/my-workflows", response_model=List[WorkflowDetailResponse])
def get_my_workflows(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all workflows where I'm assigned to any step (for visibility)"""
```

**Purpose**: Returns ALL workflows where user is assigned to ANY step, regardless of whether that step is active yet.

#### 2. Updated Endpoint: `/workflows/my-pending`
```python
@router.get("/my-pending", response_model=List[WorkflowDetailResponse])
def get_my_pending_workflows(...):
    """Get workflows where I need to take action NOW (my step is currently active)"""
```

**Purpose**: Returns only workflows where user's step is currently IN_PROGRESS (for badge count).

#### 3. Updated Endpoint: `/workflows/`
```python
@router.get("/", response_model=List[WorkflowResponse])
def list_workflows(...):
    """List workflows visible to current user (created by them or assigned to them in ANY step)"""
```

**Purpose**: Shows all workflows user is involved in, not just active ones.

### Frontend Changes

#### 1. My Tasks Page - Two Sections

**Section 1: Action Required** (Red pulsing dot)
- Shows workflows where it's YOUR TURN
- Your step is currently IN_PROGRESS
- You can take action NOW
- Button: "Take Action Now →" (Blue)

**Section 2: Upcoming - Waiting for Previous Steps** (Blue dot)
- Shows workflows where you're assigned but it's NOT your turn yet
- Your step is PENDING
- You can VIEW but cannot act
- Button: "View Progress →" (Gray)
- Shows which step is currently active

#### 2. Visual Indicators

**My Turn (Active)**:
```
┌─────────────────────────────────────────────────────┐
│ Financial Audit  [WF-2024-00123]                    │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │  2  Your Action Required                        │ │
│ │     Step 2 - Currently Active                   │ │
│ │     Action Type: Review and Approve             │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ [Take Action Now →]  (Blue button)                  │
└─────────────────────────────────────────────────────┘
```

**Waiting (Upcoming)**:
```
┌─────────────────────────────────────────────────────┐
│ Financial Audit  [WF-2024-00123]  [WAITING]         │
│                                                      │
│ ┌─────────────────────────────────────────────────┐ │
│ │  4  Your Upcoming Step                          │ │
│ │     Step 4 - Waiting for Step 2                 │ │
│ │     Action Type: Sign Document                  │ │
│ │     Status: Pending                             │ │
│ └─────────────────────────────────────────────────┘ │
│                                                      │
│ [View Progress →]  (Gray button)                    │
└─────────────────────────────────────────────────────┘
```

## Example Workflow Journey

### Workflow Created with 6 Steps

**Step 1**: John (Finance) - Review and Approve
**Step 2**: Sarah (HR) - Sign Document  
**Step 3**: Mike (Legal) - Review Only
**Step 4**: Lisa (Operations) - Acknowledge
**Step 5**: Tom (IT) - Review and Approve
**Step 6**: Jane (CEO) - Sign Document

### What Each Staff Sees

#### Day 1 - 10:00 AM: Workflow Created & Started

**John (Step 1) sees:**
```
Action Required (1)
├─ Financial Audit [WF-2024-00123]
   └─ Step 1: Your Action Required - Currently Active
      [Take Action Now →]
```

**Sarah (Step 2) sees:**
```
Upcoming - Waiting for Previous Steps (1)
├─ Financial Audit [WF-2024-00123]  [WAITING]
   └─ Step 2: Your Upcoming Step - Waiting for Step 1
      [View Progress →]
```

**Mike, Lisa, Tom, Jane (Steps 3-6) see:**
```
Upcoming - Waiting for Previous Steps (1)
├─ Financial Audit [WF-2024-00123]  [WAITING]
   └─ Step 3/4/5/6: Your Upcoming Step - Waiting for Step 1
      [View Progress →]
```

#### Day 1 - 10:30 AM: John Approves Step 1

**John (Step 1) sees:**
```
(No tasks - his step is complete)
```

**Sarah (Step 2) sees:**
```
Action Required (1)  ← MOVED TO ACTIVE!
├─ Financial Audit [WF-2024-00123]
   └─ Step 2: Your Action Required - Currently Active
      [Take Action Now →]
```

**Mike, Lisa, Tom, Jane (Steps 3-6) see:**
```
Upcoming - Waiting for Previous Steps (1)
├─ Financial Audit [WF-2024-00123]  [WAITING]
   └─ Step 3/4/5/6: Your Upcoming Step - Waiting for Step 2
      [View Progress →]
```

#### Day 1 - 11:00 AM: Sarah Signs Step 2

**Sarah (Step 2) sees:**
```
(No tasks - her step is complete)
```

**Mike (Step 3) sees:**
```
Action Required (1)  ← NOW HIS TURN!
├─ Financial Audit [WF-2024-00123]
   └─ Step 3: Your Action Required - Currently Active
      [Take Action Now →]
```

**Lisa, Tom, Jane (Steps 4-6) see:**
```
Upcoming - Waiting for Previous Steps (1)
├─ Financial Audit [WF-2024-00123]  [WAITING]
   └─ Step 4/5/6: Your Upcoming Step - Waiting for Step 3
      [View Progress →]
```

## Benefits

### 1. **Visibility**
✅ All assigned staff know they have a workflow coming
✅ Can see their position in the queue (Step 4 of 6)
✅ Can track progress in real-time

### 2. **Planning**
✅ Staff can prepare for their action
✅ Know approximately when it will be their turn
✅ Can review workflow details in advance

### 3. **Transparency**
✅ Everyone sees the same workflow
✅ No surprises when it's your turn
✅ Clear indication of who's currently acting

### 4. **Accountability**
✅ Staff can't claim they didn't know
✅ Can see if previous steps are delayed
✅ Can follow up if needed

### 5. **Context**
✅ See what actions others took
✅ Understand workflow history
✅ Make informed decisions

## User Experience

### For Active Staff (My Turn)
1. See workflow in "Action Required" section
2. Red pulsing dot indicates urgency
3. Blue border and background
4. "Take Action Now" button is prominent
5. Can immediately take action

### For Waiting Staff (Upcoming)
1. See workflow in "Upcoming" section
2. Blue dot indicates it's coming
3. Gray border and faded appearance
4. "WAITING" badge clearly visible
5. "View Progress" button to track
6. Shows which step is currently active
7. Cannot take action yet (button is gray)

## Technical Details

### API Endpoints

**GET /workflows/my-workflows**
- Returns: All workflows where user is assigned to ANY step
- Used by: My Tasks page to show all workflows
- Filter: User assigned to any step (pending, in_progress, or approved)

**GET /workflows/my-pending**
- Returns: Workflows where user's step is IN_PROGRESS
- Used by: Sidebar badge count
- Filter: User's step status = in_progress

**GET /workflows/**
- Returns: Workflows created by user OR assigned to user in any step
- Used by: Workflows list page
- Filter: Creator OR assigned to any step

### Data Flow

```
1. User opens "My Tasks"
2. Frontend calls /workflows/my-workflows
3. Backend returns ALL workflows where user is assigned
4. Frontend gets steps for each workflow
5. Frontend identifies user's step
6. Frontend checks if step is in_progress (isMyTurn)
7. Frontend sorts: Active first, then by step order
8. Frontend displays in two sections
```

### Sorting Logic

```javascript
tasksData.sort((a, b) => {
  // My turn tasks first
  if (a.isMyTurn && !b.isMyTurn) return -1;
  if (!a.isMyTurn && b.isMyTurn) return 1;
  // Then by step order
  return a.step.step_order - b.step.step_order;
});
```

## Testing Checklist

- [ ] Create workflow with 6 staff
- [ ] Login as Staff 1 (Step 1)
- [ ] Verify workflow shows in "Action Required"
- [ ] Login as Staff 2 (Step 2)
- [ ] Verify workflow shows in "Upcoming - Waiting"
- [ ] Verify "WAITING" badge is visible
- [ ] Verify button says "View Progress"
- [ ] Click "View Progress" and see workflow details
- [ ] Verify cannot take action (button not available)
- [ ] Login as Staff 1 and complete Step 1
- [ ] Login as Staff 2 again
- [ ] Verify workflow MOVED to "Action Required"
- [ ] Verify can now take action
- [ ] Login as Staff 3-6
- [ ] Verify all see workflow in "Upcoming"
- [ ] Complete all steps sequentially
- [ ] Verify each staff sees workflow move to "Action Required" when it's their turn

## Summary

The workflow system now provides:
- ✅ **Full visibility**: All assigned staff see the workflow from the start
- ✅ **Clear status**: "Action Required" vs "Upcoming - Waiting"
- ✅ **Sequential control**: Can only act when it's your turn
- ✅ **Progress tracking**: See which step is currently active
- ✅ **Better planning**: Know what's coming
- ✅ **Transparency**: Everyone sees the same information
- ✅ **Accountability**: No excuses for missing workflows

Staff can now see their upcoming workflows and track progress, while still maintaining sequential processing where only the current step can take action!
