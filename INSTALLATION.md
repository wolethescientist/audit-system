# Installation Guide

## Automated Setup (Recommended)

### Windows
```bash
setup.bat
```

### Mac/Linux
```bash
chmod +x setup.sh
./setup.sh
```

## Manual Setup

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- PostgreSQL database (Supabase account recommended)
- Git

### Step 1: Clone Repository
```bash
git clone <repository-url>
cd audit-management-system
```

### Step 2: Backend Setup

#### 2.1 Create Virtual Environment
```bash
cd backend
python -m venv venv
```

#### 2.2 Activate Virtual Environment

**Windows:**
```bash
venv\Scripts\activate
```

**Mac/Linux:**
```bash
source venv/bin/activate
```

#### 2.3 Install Dependencies
```bash
pip install -r requirements.txt
```

#### 2.4 Configure Environment
```bash
cp .env.example .env
```

Edit `.env` file with your credentials:
```env
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
JWT_SECRET_KEY=your-secret-key-change-this-in-production
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440
```

#### 2.5 Setup Database

**Create Supabase Project:**
1. Go to https://supabase.com
2. Create a new project
3. Get your connection string from Settings > Database
4. Copy the connection string to `DATABASE_URL` in `.env`

**Run Migrations:**
```bash
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

#### 2.6 Start Backend Server
```bash
uvicorn app.main:app --reload
```

Backend will be available at: http://localhost:8000
API Documentation: http://localhost:8000/docs

### Step 3: Frontend Setup

Open a new terminal window.

#### 3.1 Navigate to Frontend
```bash
cd frontend
```

#### 3.2 Install Dependencies
```bash
npm install
```

#### 3.3 Configure Environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

#### 3.4 Start Development Server
```bash
npm run dev
```

Frontend will be available at: http://localhost:3000

### Step 4: Create First User

Using curl:
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "full_name": "System Admin",
    "role": "system_admin"
  }'
```

Or use the Swagger UI at http://localhost:8000/docs

### Step 5: Login

1. Open http://localhost:3000
2. Enter email: `admin@company.com`
3. Click "Sign In"
4. You'll be redirected to the dashboard

## Troubleshooting

### Backend Issues

**Error: ModuleNotFoundError**
```bash
# Make sure virtual environment is activated
source venv/bin/activate  # Mac/Linux
venv\Scripts\activate     # Windows

# Reinstall dependencies
pip install -r requirements.txt
```

**Error: Database connection failed**
- Check your `DATABASE_URL` in `.env`
- Ensure Supabase project is running
- Verify network connectivity

**Error: Alembic migration failed**
- Delete all files in `alembic/versions/` except `__init__.py`
- Drop all tables in your database
- Run migrations again

### Frontend Issues

**Error: Module not found**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

**Error: Cannot connect to API**
- Ensure backend is running on port 8000
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Verify CORS settings in `backend/app/main.py`

**TypeScript errors**
```bash
# Delete .next folder and rebuild
rm -rf .next
npm run dev
```

### Database Issues

**Error: Permission denied**
- Check database user permissions
- Ensure user has CREATE, ALTER, DROP privileges

**Error: Table already exists**
- Drop all tables and run migrations again
- Or use `alembic downgrade base` then `alembic upgrade head`

## Verification

### Backend Health Check
```bash
curl http://localhost:8000/health
```

Expected response:
```json
{"status": "healthy"}
```

### Frontend Health Check
Open http://localhost:3000 - should redirect to login page

### API Documentation
Open http://localhost:8000/docs - should show Swagger UI

## Next Steps

1. **Create Departments**
   - Navigate to /departments
   - Add your organizational structure

2. **Create Users**
   - Navigate to /users
   - Add team members with appropriate roles

3. **Create First Audit**
   - Navigate to /audits
   - Click "Create Audit"
   - Fill in audit details

4. **Explore Features**
   - Dashboard analytics
   - Audit planning
   - Report generation
   - Follow-up tracking

## Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions.

## Support

For issues and questions:
- Check [QUICK_START.md](QUICK_START.md)
- Review [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- See [TESTING.md](TESTING.md) for testing procedures

## Common Commands Reference

### Backend
```bash
# Start server
uvicorn app.main:app --reload

# Create migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Run tests
pytest
```

### Frontend
```bash
# Development
npm run dev

# Production build
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Environment Variables Reference

### Backend (.env)
| Variable | Description | Example |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | postgresql://user:pass@host:5432/db |
| SUPABASE_URL | Supabase project URL | https://xxx.supabase.co |
| SUPABASE_KEY | Supabase anon key | eyJhbGc... |
| JWT_SECRET_KEY | Secret for JWT signing | your-secret-key |
| JWT_ALGORITHM | JWT algorithm | HS256 |
| JWT_EXPIRATION_MINUTES | Token expiration time | 1440 |

### Frontend (.env.local)
| Variable | Description | Example |
|----------|-------------|---------|
| NEXT_PUBLIC_API_URL | Backend API URL | http://localhost:8000 |

## System Requirements

### Minimum
- CPU: 2 cores
- RAM: 4 GB
- Storage: 10 GB
- OS: Windows 10, macOS 10.15, Ubuntu 20.04

### Recommended
- CPU: 4 cores
- RAM: 8 GB
- Storage: 20 GB
- OS: Windows 11, macOS 12+, Ubuntu 22.04

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
