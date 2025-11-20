# Audit Management System

🏢 **Enterprise-grade audit workflow digitization platform**

A complete, production-ready system that digitizes the entire organizational audit lifecycle from planning to close-up, replacing manual paper-based processes with a modern, secure, role-based digital platform.

---

## 🎯 System Overview

This system manages the complete audit workflow:

**Audit Planning** → **Audit Execution** → **Report Writing & Approvals** → **Follow-Up** → **Close-Up**

### Key Features

✅ **Multi-role access control** - 6 distinct user roles with granular permissions  
✅ **Complete audit lifecycle** - From planning to archival  
✅ **Digital working papers** - Evidence management and documentation  
✅ **Automated workflows** - Multi-level approval processes  
✅ **Real-time collaboration** - Q&A threads between auditors and auditees  
✅ **Analytics dashboard** - Executive insights and metrics  
✅ **Stateless architecture** - No file storage in database  
✅ **Modern UI** - Responsive, intuitive interface  

---

## 🚀 Tech Stack

### Backend
- **FastAPI** - High-performance Python web framework
- **SQLAlchemy** - ORM for database operations
- **Alembic** - Database migrations
- **Pydantic v2** - Data validation
- **JWT** - Token-based authentication (NO bcrypt/passlib)
- **PostgreSQL** - Supabase hosted database

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **TailwindCSS** - Modern utility-first styling
- **React Query** - Data fetching and caching
- **Zustand** - Lightweight state management
- **Axios** - HTTP client

---

## ⚠️ IMPORTANT: Frontend Errors Are Normal!

If you see TypeScript errors in the frontend like `Cannot find module 'next'` or `Cannot find module '@tanstack/react-query'`, **this is completely normal!** These errors will disappear after running `npm install`.

See [ERRORS_EXPLAINED.md](ERRORS_EXPLAINED.md) for details.

## 📋 Quick Start

### Prerequisites
- Python 3.10+
- Node.js 18+
- PostgreSQL (Supabase account)

### 1. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your Supabase credentials

# Run migrations
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

Backend runs on: **http://localhost:8000**  
API Docs: **http://localhost:8000/docs**

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with API URL

# Start development server
npm run dev
```

Frontend runs on: **http://localhost:3000**

### 3. Create First User

```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "full_name": "System Admin",
    "role": "system_admin"
  }'
```

### 4. Login

Open **http://localhost:3000** and login with: `admin@company.com`

---

## 📁 Project Structure

```
audit-management-system/
├── backend/              # FastAPI application
│   ├── app/
│   │   ├── routers/      # API endpoints
│   │   ├── models.py     # Database models
│   │   ├── schemas.py    # Pydantic schemas
│   │   ├── auth.py       # Authentication
│   │   └── main.py       # App entry point
│   ├── alembic/          # Database migrations
│   └── requirements.txt
│
├── frontend/             # Next.js application
│   ├── src/
│   │   ├── app/          # Pages (App Router)
│   │   ├── components/   # React components
│   │   ├── lib/          # Utilities
│   │   └── store/        # State management
│   └── package.json
│
└── docs/                 # Documentation
```

---

## 🔐 User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **System Admin** | Full system access, user management, configuration |
| **Audit Manager** | Create/manage audits, assign teams, approve reports |
| **Auditor** | Execute audits, create findings, draft reports |
| **Department Head** | View department audits, respond to queries |
| **Department Officer** | View assigned audits, upload evidence |
| **Viewer** | Read-only access to audits and reports |

---

## 📊 Core Modules

### 1. User & Role Management
- Create and manage users
- Assign roles and departments
- Enable/disable user accounts

### 2. Audit Planning
- Create annual audit plans
- Define scope and objectives
- Risk rating assignment
- Team allocation

### 3. Audit Execution
- Digital working papers
- Evidence management (URL references)
- Q&A query threads
- Finding documentation

### 4. Report Writing & Approvals
- Auto-generate reports from findings
- Multi-level approval workflow
- Version control
- Comments and change requests

### 5. Follow-Up Management
- Action plan assignment
- Due date tracking
- Completion verification
- Overdue alerts

### 6. Close-Up & Archival
- Final review checklist
- Audit finalization
- Status locking

### 7. Analytics Dashboard
- Audit status distribution
- Findings heatmap
- Risk analysis
- Completion metrics

---

## 🔌 API Endpoints

### Authentication
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /auth/validate` - Token validation

### Audits
- `POST /audits/` - Create audit
- `GET /audits/` - List audits
- `GET /audits/{id}` - Get audit details
- `POST /audits/{id}/team` - Add team member
- `POST /audits/{id}/evidence` - Upload evidence
- `POST /audits/{id}/findings` - Create finding
- `POST /audits/{id}/report` - Create report
- `POST /audits/{id}/followup` - Create follow-up
- `POST /audits/{id}/finalize` - Close audit

### Analytics
- `GET /analytics/dashboard` - Dashboard metrics
- `GET /analytics/findings-summary` - Findings analysis

**Full API documentation:** See `API_DOCUMENTATION.md`

---

## 📖 Documentation

- **[QUICK_START.md](QUICK_START.md)** - Detailed setup guide
- **[API_DOCUMENTATION.md](API_DOCUMENTATION.md)** - Complete API reference
- **[FEATURES.md](FEATURES.md)** - Feature list and capabilities
- **[PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md)** - Codebase structure
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Production deployment guide

---

## 🛠️ Development

### Backend Development

```bash
# Create new migration
alembic revision --autogenerate -m "Description"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Start with auto-reload
uvicorn app.main:app --reload
```

### Frontend Development

```bash
# Development mode
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

---

## 🔒 Security Features

- JWT token-based authentication
- Role-based authorization on all routes
- Token expiration handling
- CORS configuration
- Input validation with Pydantic v2
- SQL injection prevention via ORM
- XSS protection

---

## 🚢 Deployment

### Backend (FastAPI)
- Deploy to AWS, GCP, Azure, or DigitalOcean
- Use Gunicorn with Uvicorn workers
- Set up reverse proxy (Nginx)
- Enable HTTPS with SSL certificates

### Frontend (Next.js)
- Deploy to Vercel (recommended)
- Or Netlify, AWS Amplify
- Configure environment variables
- Set up custom domain

### Database
- Use Supabase (managed PostgreSQL)
- Or self-hosted PostgreSQL
- Enable automated backups
- Configure connection pooling

**Detailed deployment guide:** See `DEPLOYMENT.md`

---

## 📝 Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:password@host:port/database
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🧪 Testing

### Backend
```bash
pytest
```

### Frontend
```bash
npm test
```

### API Testing
- Use Swagger UI at `http://localhost:8000/docs`
- Or import into Postman/Insomnia

---

## 📦 Database Schema

**10 Core Tables:**
1. `users` - User accounts
2. `departments` - Organizational structure
3. `audits` - Audit records
4. `audit_team` - Team assignments
5. `audit_work_program` - Procedures
6. `audit_evidence` - Evidence references
7. `audit_findings` - Findings
8. `audit_queries` - Q&A threads
9. `audit_reports` - Report versions
10. `audit_followup` - Follow-up actions

---

## 🎨 UI Pages

- `/login` - Authentication
- `/dashboard` - Executive dashboard
- `/audits` - Audit management
- `/audits/create` - Create new audit
- `/audits/[id]` - Audit details
- `/planning` - Audit planning
- `/reports` - Report management
- `/followups` - Follow-up tracking
- `/analytics` - Analytics dashboard
- `/users` - User management
- `/departments` - Department management

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

---

## 📄 License

This project is proprietary software for enterprise use.

---

## 💡 Support

For issues, questions, or feature requests:
- Check the documentation files
- Review API documentation
- Contact system administrator

---

## ✨ Key Highlights

✅ **No bcrypt/passlib** - Uses JWT only as specified  
✅ **Stateless** - No file storage in database  
✅ **Role-based** - 6 distinct user roles  
✅ **Complete workflow** - Full audit lifecycle  
✅ **Modern stack** - FastAPI + Next.js 14  
✅ **Production-ready** - Enterprise-grade architecture  
✅ **Well-documented** - Comprehensive guides  
✅ **Type-safe** - TypeScript + Pydantic  

---

**Built with ❤️ for enterprise audit management**
