# Workflow System - Quick Setup Guide

## What Was Added

The system now includes a complete **Workflow & Approval System** that allows:
- Creating workflows that route through multiple departments
- Digital signature capture
- Approval/rejection with comments
- Complete audit trail
- Real-time status tracking

---

## Setup Steps

### 1. Backend Setup

```bash
cd backend

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Run database migration
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload
```

The backend will be available at: `http://localhost:8000`

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

The frontend will be available at: `http://localhost:3000`

---

## Quick Test

### 1. Login to the system
Navigate to `http://localhost:3000` and login

### 2. Create Departments (if not already created)
- Go to **Departments**
- Create at least 2 departments (e.g., "Finance", "Audit Committee")

### 3. Create Users
- Go to **Users**
- Create users and assign them to different departments

### 4. Create an Audit
- Go to **Audits** → **Create Audit**
- Fill in the details and create

### 5. Create a Workflow
- Go to **Workflows** → **Create Workflow**
- Select the audit you just created
- Add workflow steps:
  - Step 1: Finance Department → Review and Approve
  - Step 2: Audit Committee → Sign
- Click **Create Workflow**

### 6. Start the Workflow
- Open the workflow you created
- Click **Start Workflow**
- The first step will become active

### 7. Approve a Step
- Login as a user from the Finance department
- Go to **Workflows**
- Open the workflow
- Click **Take Action** on Step 1
- Select "Approve"
- Add comments
- Click **Submit**

### 8. Sign a Step
- Login as a user from the Audit Committee
- Go to **Workflows**
- Open the workflow
- Click **Take Action** on Step 2
- Select "Sign & Approve"
- Draw your signature on the canvas
- Click **Submit**

### 9. View Results
- Check the workflow status (should be "Completed")
- View all approvals and signatures
- See the complete audit trail

---

## New Files Created

### Backend
- `backend/app/routers/workflows.py` - Workflow API endpoints
- `backend/alembic/versions/add_workflow_tables.py` - Database migration

### Frontend
- `frontend/src/app/workflows/page.tsx` - Workflow list page
- `frontend/src/app/workflows/create/page.tsx` - Create workflow page
- `frontend/src/app/workflows/[id]/page.tsx` - Workflow detail & approval page

### Modified Files
- `backend/app/models.py` - Added Workflow, WorkflowStep, WorkflowApproval models
- `backend/app/schemas.py` - Added workflow schemas
- `backend/app/main.py` - Registered workflow router
- `frontend/src/lib/types.ts` - Added workflow types
- `frontend/src/components/Sidebar.tsx` - Added Workflows navigation link

---

## API Endpoints

All workflow endpoints are under `/workflows/`:

- `POST /workflows/` - Create workflow
- `GET /workflows/` - List workflows
- `GET /workflows/{id}` - Get workflow details
- `POST /workflows/{id}/start` - Start workflow
- `GET /workflows/{id}/steps` - Get workflow steps
- `POST /workflows/{id}/steps/{step_id}/approve` - Approve/reject step
- `GET /workflows/{id}/steps/{step_id}/approvals` - Get step approvals
- `GET /workflows/my-pending` - Get my pending workflows

Full API documentation: See `WORKFLOW_SYSTEM.md`

---

## Features

✅ Multi-department routing  
✅ Digital signatures with canvas  
✅ Approve/Reject/Return actions  
✅ Comments on each action  
✅ IP address tracking  
✅ Complete audit trail  
✅ Due date tracking  
✅ Role-based access control  
✅ Real-time status updates  

---

## Troubleshooting

### Migration Error
If you get a migration error, try:
```bash
alembic downgrade -1
alembic upgrade head
```

### Frontend Build Error
If you see TypeScript errors:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

### Cannot Approve Step
Make sure:
- You're logged in as a user from the correct department
- The step status is "in_progress"
- The workflow has been started

---

## Next Steps

1. Test the workflow system with real data
2. Create workflow templates for common processes
3. Add email notifications (future enhancement)
4. Customize approval actions as needed

For detailed documentation, see `WORKFLOW_SYSTEM.md`
