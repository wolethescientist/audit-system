# Quick Start: Generate Dummy Data for Supabase

## TL;DR - 3 Simple Steps

### 1️⃣ Start Backend
```bash
cd backend
python -m uvicorn app.main:app --reload
```

### 2️⃣ Verify Setup
```bash
python verify-supabase-ready.py
```

### 3️⃣ Generate Data
```bash
python generate-comprehensive-dummy-data.py
```

## What You Get

✅ **14 Departments** - Finance, HR, IT, Operations, etc.  
✅ **14 Users** - All roles (Admin, Managers, Auditors, Dept Heads, Officers)  
✅ **6 Complete Audits** - Different stages and risk levels  
✅ **100+ Related Records** - Findings, Evidence, Queries, Reports, Workflows  

## Login Credentials (After Generation)

| Email | Role | Use Case |
|-------|------|----------|
| admin@audit.com | System Admin | Full system access |
| audit.manager@audit.com | Audit Manager | Manage audits & teams |
| senior.auditor@audit.com | Senior Auditor | Create findings & reports |
| finance.head@company.com | Dept Head | Review findings & approve |
| finance.officer@company.com | Dept Officer | Execute follow-ups |

All users use **passwordless authentication** - just enter email!

## Troubleshooting

### Backend not running?
```bash
cd backend
python -m uvicorn app.main:app --reload
```

### Admin user missing?
```bash
python create-test-users.py
```

### Tables not created?
```bash
cd backend
alembic upgrade head
```

### Start fresh?
```bash
cd backend
alembic downgrade base
alembic upgrade head
python create-test-users.py
cd ..
python generate-comprehensive-dummy-data.py
```

## Verify in Supabase

1. Go to https://supabase.com/dashboard
2. Select your project
3. Open **Table Editor**
4. Check these tables:
   - `departments` → 14 records
   - `users` → 14 records
   - `audits` → 6 records
   - `audit_findings` → 25+ records

## Test in Frontend

```bash
cd frontend
npm run dev
```

Visit: http://localhost:3000/login

Login with any email above (no password needed)

## Files Reference

| File | Purpose |
|------|---------|
| `generate-comprehensive-dummy-data.py` | Main data generator |
| `verify-supabase-ready.py` | Check if system is ready |
| `setup-supabase-dummy-data.bat` | Windows automated setup |
| `SUPABASE_DUMMY_DATA_SETUP.md` | Detailed guide |
| `DUMMY_DATA_GUIDE.md` | Feature documentation |

## Need Help?

Read the detailed guides:
- **SUPABASE_DUMMY_DATA_SETUP.md** - Complete Supabase setup
- **DUMMY_DATA_GUIDE.md** - Feature details and customization

## How It Works

```
Your Script → Backend API (localhost:8000) → Supabase Database
```

The script calls your FastAPI backend, which is already connected to Supabase via the `DATABASE_URL` in `backend/.env`. No direct Supabase connection needed!
