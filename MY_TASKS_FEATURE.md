# My Tasks Feature - Staff Workflow Actions

## Overview
The "My Tasks" feature provides a dedicated page where staff members can see all workflows waiting for their action. This solves the problem of staff not knowing where to find and act on workflows assigned to them.

## What Was Added

### 1. My Tasks Page (`/my-tasks`)

**Purpose**: Central location for staff to see and act on pending workflows

**Features**:
- Shows only workflows where the current user needs to take action
- Displays workflows in priority order (overdue first)
- Auto-refreshes every 30 seconds
- Clear action buttons
- Complete workflow context

**What Staff See**:
```
┌─────────────────────────────────────────────────────────┐
│ My Tasks                                                 │
│ Workflows waiting for your action                       │
├─────────────────────────────────────────────────────────┤
│                                                          │
│ Financial Audit Approval  [WF-2024-00123]    OVERDUE   │
│ Audit: Financial Audit 2024                             │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │  2  Your Action Required                         │   │
│ │     Step 2 of workflow                           │   │
│ │                                                   │   │
│ │  Action Type: Review and Approve                 │   │
│ │  Due Date: Nov 20, 2024                          │   │
│ │  Started: Nov 21, 2024                           │   │
│ └──────────────────────────────────────────────────┘   │
│                                                          │
│ [Take Action Now →]                                     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### 2. Sidebar Navigation

**Added "My Tasks" Link**:
- Positioned prominently after Dashboard
- Shows badge with count of pending tasks
- Badge updates automatically every minute
- Red badge for visibility

**Visual**:
```
Dashboard
My Tasks  [3]  ← Red badge showing 3 pending tasks
Audits
Workflows
...
```

### 3. Task Information Display

Each task card shows:
- **Workflow Name**: Clear identification
- **Reference Number**: For tracking (e.g., WF-2024-00123)
- **Audit Title**: Context about what audit this relates to
- **Step Number**: Which step you're on
- **Action Type**: What you need to do (Review, Sign, Acknowledge, etc.)
- **Due Date**: When action is due
- **Overdue Badge**: If past due date
- **Take Action Button**: Direct link to workflow

### 4. Color Coding

**Action Types**:
- 🔵 **Review and Approve**: Blue badge
- 🟣 **Sign Document**: Purple badge
- 🟢 **Review Only**: Green badge
- 🟡 **Acknowledge**: Yellow badge

**Status**:
- 🔴 **Overdue**: Red border and badge
- 🔵 **On Time**: Blue border

## User Flow

### For Staff Members

**1. Login**
```
Staff logs in → Sees "My Tasks" in sidebar with badge [2]
```

**2. Navigate to My Tasks**
```
Click "My Tasks" → See list of workflows waiting for action
```

**3. View Task Details**
```
Each task shows:
- What workflow it is
- What action is needed
- When it's due
- Context about the audit
```

**4. Take Action**
```
Click "Take Action Now" → Opens workflow detail page
→ See full workflow context
→ Take required action (Approve, Sign, Review, Acknowledge)
```

**5. After Action**
```
Action recorded → Workflow moves to next step
→ Task removed from "My Tasks" list
→ Badge count decreases
```

## Example Scenarios

### Scenario 1: Staff with Pending Tasks

**Sarah (HR Manager) logs in:**
1. Sees "My Tasks [2]" in sidebar
2. Clicks "My Tasks"
3. Sees 2 workflows:
   - Financial Audit - Review and Approve (Due today)
   - IT Audit - Sign Document (Due tomorrow)
4. Clicks "Take Action Now" on Financial Audit
5. Reviews workflow details
6. Clicks "Take Action" button
7. Selects "Approve" and adds comments
8. Submits action
9. Workflow moves to next step
10. Returns to "My Tasks" - now shows [1]

### Scenario 2: Staff with No Tasks

**John (Auditor) logs in:**
1. Sees "My Tasks" in sidebar (no badge)
2. Clicks "My Tasks"
3. Sees message: "All caught up! You have no pending workflow actions."
4. Can focus on other work

### Scenario 3: Overdue Task

**Mike (Department Head) logs in:**
1. Sees "My Tasks [1]" in sidebar
2. Clicks "My Tasks"
3. Sees workflow with red "OVERDUE" badge
4. Due date shown in red
5. Takes immediate action
6. Workflow continues

## Access Control

### Who Sees What

**Staff Member A (assigned to Step 1)**:
- Sees workflow in "My Tasks" when Step 1 is active
- Can take action on Step 1
- After action, workflow disappears from their tasks

**Staff Member B (assigned to Step 2)**:
- Does NOT see workflow until Step 1 is complete
- Sees workflow in "My Tasks" when Step 2 becomes active
- Can take action on Step 2

**Staff Member C (not assigned)**:
- Does NOT see workflow at all
- Workflow never appears in their "My Tasks"

**Creator**:
- Can see workflow in "Workflows" page
- Can track progress
- Does NOT see it in "My Tasks" (unless also assigned to a step)

## Technical Implementation

### Backend API Used
- `GET /workflows/my-pending`: Returns workflows with steps assigned to current user that are in progress

### Frontend Components
- **Page**: `/my-tasks/page.tsx`
- **Sidebar**: Updated with "My Tasks" link and badge
- **Auto-refresh**: Every 30 seconds for tasks, every 60 seconds for badge count

### Data Flow
```
1. User opens "My Tasks" page
2. Frontend calls /workflows/my-pending
3. Backend filters workflows:
   - Where user is assigned to a step
   - Where step status is "in_progress"
   - Where step is current active step
4. Frontend displays tasks
5. Auto-refresh keeps data current
```

## Benefits

### For Staff
✅ **Clear visibility**: Know exactly what needs action
✅ **Centralized location**: One place for all tasks
✅ **Priority indication**: See overdue tasks first
✅ **Context**: Understand what each task is about
✅ **Easy action**: One-click to take action

### For Managers
✅ **Accountability**: Staff can't claim they didn't see it
✅ **Tracking**: Badge count shows workload
✅ **Efficiency**: Faster workflow completion
✅ **Transparency**: Everyone knows their responsibilities

### For Organization
✅ **Faster workflows**: Reduced delays
✅ **Better compliance**: Actions taken on time
✅ **Audit trail**: Clear record of who did what
✅ **Improved communication**: Less "where is this?" questions

## Key Features

1. **Auto-Refresh**: Tasks update automatically
2. **Badge Count**: Shows number of pending tasks
3. **Overdue Alerts**: Red badges for overdue tasks
4. **Action Types**: Color-coded by action required
5. **Context**: Shows audit and workflow details
6. **Direct Action**: One-click to workflow
7. **Empty State**: Friendly message when no tasks
8. **Responsive**: Works on all screen sizes

## Navigation Path

```
Login → Dashboard → My Tasks (in sidebar)
                  ↓
            List of pending tasks
                  ↓
            Click "Take Action Now"
                  ↓
            Workflow detail page
                  ↓
            Take action (Approve/Sign/Review/Acknowledge)
                  ↓
            Action recorded
                  ↓
            Workflow moves to next step
                  ↓
            Task removed from "My Tasks"
```

## Testing Checklist

- [ ] Create workflow and assign to Staff A
- [ ] Login as Staff A
- [ ] Verify "My Tasks" shows badge [1]
- [ ] Click "My Tasks" and see the workflow
- [ ] Verify workflow details are correct
- [ ] Click "Take Action Now"
- [ ] Take action on workflow
- [ ] Verify task disappears from "My Tasks"
- [ ] Verify badge count decreases
- [ ] Login as Staff B (not assigned)
- [ ] Verify "My Tasks" is empty
- [ ] Login as Staff C (assigned to Step 2)
- [ ] Verify workflow does NOT appear yet
- [ ] Complete Step 1
- [ ] Login as Staff C again
- [ ] Verify workflow NOW appears in "My Tasks"

## Summary

The "My Tasks" feature provides:
- ✅ Dedicated page for staff to see pending workflows
- ✅ Badge count in sidebar showing number of tasks
- ✅ Auto-refresh for real-time updates
- ✅ Clear action buttons and workflow context
- ✅ Overdue indicators
- ✅ Access control (only see assigned workflows)
- ✅ Direct path to take action

Staff members now have a clear, centralized location to see and act on workflows assigned to them!
