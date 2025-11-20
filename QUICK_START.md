# Quick Start Guide

## Prerequisites

- Python 3.10+
- Node.js 18+
- PostgreSQL (Supabase account)
- Git

## Step 1: Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd audit-management-system
```

## Step 2: Backend Setup

```bash
# Navigate to backend
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Mac/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
JWT_SECRET_KEY=your-secret-key-change-this
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440
```

```bash
# Run migrations
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head

# Start backend server
uvicorn app.main:app --reload
```

Backend will run on: `http://localhost:8000`

## Step 3: Frontend Setup

Open a new terminal:

```bash
# Navigate to frontend
cd frontend

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

```bash
# Start development server
npm run dev
```

Frontend will run on: `http://localhost:3000`

## Step 4: Create First User

```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "full_name": "System Admin",
    "role": "system_admin"
  }'
```

## Step 5: Login

1. Open browser: `http://localhost:3000`
2. Enter email: `admin@company.com`
3. Click "Sign In"

## Testing the API

Visit: `http://localhost:8000/docs` for interactive API documentation (Swagger UI)

## Common Commands

### Backend
```bash
# Run migrations
alembic upgrade head

# Create new migration
alembic revision --autogenerate -m "Description"

# Rollback migration
alembic downgrade -1

# Start server
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
# Development
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Troubleshooting

### Database Connection Error
- Check Supabase credentials in `.env`
- Ensure database is accessible
- Verify connection string format

### Frontend API Error
- Ensure backend is running on port 8000
- Check CORS settings in `backend/app/main.py`
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

### Migration Errors
- Delete `alembic/versions/*.py` (except `__init__.py`)
- Drop all tables in database
- Run migrations again

## Next Steps

1. Create departments
2. Add users with different roles
3. Create your first audit
4. Explore the dashboard
5. Test the complete audit workflow

## Support

For issues and questions, refer to:
- `API_DOCUMENTATION.md` - Complete API reference
- `FEATURES.md` - Feature list
- `DEPLOYMENT.md` - Production deployment guide
