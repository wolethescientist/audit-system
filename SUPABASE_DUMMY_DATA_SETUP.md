# How to Generate Dummy Data in Supabase

This guide explains how to populate your Supabase database with comprehensive dummy data.

## Important: How It Works

The dummy data script works by:
1. **Calling your Backend API** (FastAPI running on localhost:8000)
2. **Your Backend connects to Supabase** using the DATABASE_URL in `.env`
3. **Data is inserted into Supabase** through your API endpoints

So you DON'T need to connect directly to Supabase - the script uses your existing backend!

## Prerequisites

### 1. Ensure Backend is Connected to Supabase

Your `backend/.env` file should have:
```env
DATABASE_URL=postgresql://postgres.jyvstpksqrdifxpgywvd:password@aws-1-eu-west-1.pooler.supabase.com:6543/postgres
JWT_SECRET_KEY=4ba8ab2309ca863dd985d687f87e0d1da9851ca589e0153b3850698d62a5d87a
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440
```

✅ **Your backend is already configured for Supabase!**

### 2. Run Database Migrations

Make sure all tables are created in Supabase:

```bash
cd backend
alembic upgrade head
```

This creates all the necessary tables in your Supabase database.

### 3. Create Admin User

You need an admin user to authenticate. Run this script:

```bash
python create-test-users.py
```

Or manually create the admin user in Supabase SQL Editor:

```sql
INSERT INTO users (id, email, full_name, role, is_active, created_at)
VALUES (
    gen_random_uuid(),
    'admin@audit.com',
    'System Administrator',
    'system_admin',
    true,
    NOW()
);
```

### 4. Install Python Dependencies

```bash
pip install requests
```

## Step-by-Step Instructions

### Step 1: Start Your Backend Server

The backend must be running to process API requests:

```bash
cd backend
python -m uvicorn app.main:app --reload
```

You should see:
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

### Step 2: Verify Backend Connection

Open your browser and go to:
- http://localhost:8000/docs

You should see the FastAPI Swagger documentation.

### Step 3: Run the Dummy Data Generator

**Option A: Using the batch file (Windows)**
```bash
generate-dummy-data.bat
```

**Option B: Using the shell script (Linux/Mac)**
```bash
chmod +x generate-dummy-data.sh
./generate-dummy-data.sh
```

**Option C: Direct Python execution**
```bash
python generate-comprehensive-dummy-data.py
```

### Step 4: Monitor Progress

The script will show colored output:
```
============================================================
Creating Departments
============================================================
✓ Created department: Finance Department
✓ Created department: Human Resources
...

============================================================
Creating Users
============================================================
✓ Created user: Sarah Johnson (audit_manager)
✓ Created user: Michael Chen (auditor)
...

============================================================
Creating Audits
============================================================
✓ Created audit: Annual Financial Audit 2025
...
```

### Step 5: Verify Data in Supabase

1. **Go to Supabase Dashboard**: https://supabase.com/dashboard
2. **Select your project**
3. **Go to Table Editor**
4. **Check these tables**:
   - `departments` - Should have 14 departments
   - `users` - Should have 14 users
   - `audits` - Should have 6 audits
   - `audit_findings` - Should have multiple findings
   - `audit_evidence` - Should have evidence files
   - `workflows` - Should have 3 workflows

## What Gets Created in Supabase

### Tables Populated:

1. **departments** (14 records)
   - Finance, HR, IT, Operations, Procurement, Legal, Marketing, Sales
   - Including sub-departments

2. **users** (14 records)
   - 1 System Admin
   - 1 Audit Manager
   - 2 Auditors
   - 5 Department Heads
   - 4 Department Officers
   - 1 Viewer

3. **audits** (6 records)
   - Various statuses: planned, executing, reporting, followup, closed
   - Different risk ratings: Critical, High, Medium

4. **audit_team** (12 records)
   - Team assignments for each audit

5. **audit_work_program** (50-70 records)
   - Work procedures for each audit

6. **audit_evidence** (60-80 records)
   - Evidence documents with URLs

7. **audit_findings** (25-30 records)
   - Findings across all severity levels

8. **audit_queries** (40-50 records)
   - Queries between auditors and departments

9. **audit_reports** (5 records)
   - Reports in various statuses

10. **audit_followup** (15-20 records)
    - Follow-up actions for findings

11. **workflows** (3 records)
    - Multi-step approval workflows

12. **workflow_steps** (12-15 records)
    - Individual workflow steps

13. **workflow_approvals** (3-5 records)
    - Approval actions

## Troubleshooting

### Error: "Failed to authenticate"

**Problem**: Admin user doesn't exist or backend isn't running

**Solution**:
```bash
# 1. Make sure backend is running
cd backend
python -m uvicorn app.main:app --reload

# 2. Create admin user
python create-test-users.py
```

### Error: "Connection refused"

**Problem**: Backend server is not running

**Solution**:
```bash
cd backend
python -m uvicorn app.main:app --reload
```

### Error: "Foreign key constraint violation"

**Problem**: Database tables don't exist or migrations not run

**Solution**:
```bash
cd backend
alembic upgrade head
```

### Error: "Duplicate key value violates unique constraint"

**Problem**: Data already exists in database

**Solution**: Either:
1. Skip and use existing data
2. Or reset database:
```bash
cd backend
alembic downgrade base
alembic upgrade head
python create-test-users.py
python generate-comprehensive-dummy-data.py
```

## Verify Data in Frontend

After generating data, test it in the frontend:

1. **Start Frontend**:
   ```bash
   cd frontend
   npm run dev
   ```

2. **Login**: http://localhost:3000/login
   - Email: `admin@audit.com`
   - No password needed (passwordless auth)

3. **Check Dashboard**: You should see:
   - 6 total audits
   - Various audit statuses
   - Findings statistics
   - Department data

4. **Test Different Roles**:
   - `audit.manager@audit.com` - Audit Manager view
   - `senior.auditor@audit.com` - Auditor view
   - `finance.head@company.com` - Department Head view
   - `finance.officer@company.com` - Department Officer view

## View Data Directly in Supabase

### Using Supabase SQL Editor:

```sql
-- Check departments
SELECT * FROM departments ORDER BY created_at;

-- Check users by role
SELECT role, COUNT(*) as count 
FROM users 
GROUP BY role;

-- Check audits by status
SELECT status, COUNT(*) as count 
FROM audits 
GROUP BY status;

-- Check findings by severity
SELECT severity, COUNT(*) as count 
FROM audit_findings 
GROUP BY severity;

-- Check workflows
SELECT w.name, w.status, COUNT(ws.id) as steps
FROM workflows w
LEFT JOIN workflow_steps ws ON w.id = ws.workflow_id
GROUP BY w.id, w.name, w.status;
```

## Data Summary

After successful generation, you'll have:

- ✅ **14 Departments** with hierarchical structure
- ✅ **14 Users** across all roles
- ✅ **6 Complete Audits** in different stages
- ✅ **50+ Work Program Items**
- ✅ **60+ Evidence Documents**
- ✅ **25+ Findings** (Critical, High, Medium, Low)
- ✅ **40+ Queries** between users
- ✅ **5 Audit Reports**
- ✅ **15+ Follow-up Actions**
- ✅ **3 Workflows** with multiple steps

## Next Steps

1. **Login to Frontend** and explore the data
2. **Test Role-Based Access** with different users
3. **Try Creating New Audits** to see the full workflow
4. **Test Workflow Approvals** with department heads
5. **Generate Reports** and export data

## Need to Reset?

To start fresh:

```bash
# 1. Reset database
cd backend
alembic downgrade base
alembic upgrade head

# 2. Recreate admin user
python create-test-users.py

# 3. Generate dummy data again
python generate-comprehensive-dummy-data.py
```

## Support

If you encounter issues:
1. Check backend logs for errors
2. Verify Supabase connection in backend/.env
3. Ensure all migrations are applied
4. Check that admin user exists
5. Verify API is accessible at http://localhost:8000/docs
