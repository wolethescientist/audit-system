# Audit Management System - Backend

FastAPI backend for the Audit Management System.

## Features

- 🚀 FastAPI framework
- 🔐 JWT authentication (NO bcrypt/passlib)
- 🗄️ PostgreSQL with SQLAlchemy
- 📝 Alembic migrations
- ✅ Pydantic v2 validation
- 🔒 Role-based access control
- 📊 Analytics endpoints
- 📚 Auto-generated API docs

## Getting Started

### Install Dependencies

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your Supabase credentials:
```env
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
JWT_SECRET_KEY=your-secret-key
```

### Run Migrations

```bash
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

### Start Server

```bash
uvicorn app.main:app --reload
```

Server runs on: [http://localhost:8000](http://localhost:8000)

API Docs: [http://localhost:8000/docs](http://localhost:8000/docs)

## Project Structure

```
app/
├── routers/         # API route handlers
├── main.py          # FastAPI app
├── models.py        # SQLAlchemy models
├── schemas.py       # Pydantic schemas
├── auth.py          # Authentication logic
├── database.py      # Database connection
└── config.py        # Configuration
```

## API Endpoints

### Authentication
- POST `/auth/signup` - Register user
- POST `/auth/login` - Login
- GET `/auth/validate` - Validate token

### Users
- POST `/users/` - Create user
- GET `/users/` - List users
- GET `/users/{id}` - Get user
- PUT `/users/{id}` - Update user
- DELETE `/users/{id}` - Disable user

### Departments
- POST `/departments/` - Create department
- GET `/departments/` - List departments

### Audits
- POST `/audits/` - Create audit
- GET `/audits/` - List audits
- GET `/audits/{id}` - Get audit
- PUT `/audits/{id}` - Update audit
- POST `/audits/{id}/team` - Add team member
- POST `/audits/{id}/work-program` - Create work program
- POST `/audits/{id}/evidence` - Upload evidence
- POST `/audits/{id}/findings` - Create finding
- POST `/audits/{id}/queries` - Create query
- POST `/audits/{id}/report` - Create report
- POST `/audits/{id}/followup` - Create follow-up
- POST `/audits/{id}/finalize` - Finalize audit

### Analytics
- GET `/analytics/dashboard` - Dashboard metrics
- GET `/analytics/findings-summary` - Findings summary
- GET `/analytics/audit-completion` - Completion stats

## User Roles

1. **system_admin** - Full system access
2. **audit_manager** - Manage audits and teams
3. **auditor** - Execute audits
4. **department_head** - Department oversight
5. **department_officer** - Department operations
6. **viewer** - Read-only access

## Database Models

- User
- Department
- Audit
- AuditTeam
- AuditWorkProgram
- AuditEvidence
- AuditFinding
- AuditQuery
- AuditReport
- AuditFollowup

## Security

- JWT token authentication
- Role-based authorization
- Token expiration handling
- CORS configuration
- Input validation with Pydantic

## Development

### Create Migration
```bash
alembic revision --autogenerate -m "Description"
```

### Apply Migration
```bash
alembic upgrade head
```

### Rollback Migration
```bash
alembic downgrade -1
```

### Run Tests
```bash
pytest
```

## Production Deployment

1. Set secure JWT_SECRET_KEY
2. Use production database
3. Enable HTTPS
4. Configure CORS for production domain
5. Use Gunicorn with Uvicorn workers:
   ```bash
   gunicorn app.main:app -w 4 -k uvicorn.workers.UvicornWorker
   ```
