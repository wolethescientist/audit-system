# Project Structure

```
audit-management-system/
│
├── backend/                          # FastAPI Backend
│   ├── alembic/                      # Database migrations
│   │   ├── versions/                 # Migration files
│   │   │   └── __init__.py
│   │   ├── env.py                    # Alembic environment
│   │   └── script.py.mako            # Migration template
│   │
│   ├── app/                          # Application code
│   │   ├── routers/                  # API routes
│   │   │   ├── __init__.py
│   │   │   ├── auth.py               # Authentication endpoints
│   │   │   ├── users.py              # User management
│   │   │   ├── departments.py        # Department management
│   │   │   ├── audits.py             # Audit operations
│   │   │   └── analytics.py          # Analytics & dashboard
│   │   │
│   │   ├── __init__.py
│   │   ├── main.py                   # FastAPI app entry point
│   │   ├── config.py                 # Configuration settings
│   │   ├── database.py               # Database connection
│   │   ├── models.py                 # SQLAlchemy models
│   │   ├── schemas.py                # Pydantic schemas
│   │   └── auth.py                   # Authentication logic
│   │
│   ├── .env.example                  # Environment variables template
│   ├── .gitignore
│   ├── alembic.ini                   # Alembic configuration
│   ├── requirements.txt              # Python dependencies
│   └── setup_db.sql                  # Database setup script
│
├── frontend/                         # Next.js Frontend
│   ├── src/
│   │   ├── app/                      # Next.js 14 App Router
│   │   │   ├── audits/               # Audit pages
│   │   │   │   ├── [id]/             # Dynamic audit detail
│   │   │   │   │   └── page.tsx
│   │   │   │   ├── create/           # Create audit
│   │   │   │   │   └── page.tsx
│   │   │   │   └── page.tsx          # Audit list
│   │   │   │
│   │   │   ├── analytics/            # Analytics dashboard
│   │   │   │   └── page.tsx
│   │   │   ├── dashboard/            # Main dashboard
│   │   │   │   └── page.tsx
│   │   │   ├── departments/          # Department management
│   │   │   │   └── page.tsx
│   │   │   ├── followups/            # Follow-up tracking
│   │   │   │   └── page.tsx
│   │   │   ├── login/                # Login page
│   │   │   │   └── page.tsx
│   │   │   ├── planning/             # Audit planning
│   │   │   │   └── page.tsx
│   │   │   ├── reports/              # Report management
│   │   │   │   └── page.tsx
│   │   │   ├── users/                # User management
│   │   │   │   └── page.tsx
│   │   │   │
│   │   │   ├── globals.css           # Global styles
│   │   │   ├── layout.tsx            # Root layout
│   │   │   ├── page.tsx              # Home page
│   │   │   └── providers.tsx         # React Query provider
│   │   │
│   │   ├── components/               # Reusable components
│   │   │   └── Sidebar.tsx           # Navigation sidebar
│   │   │
│   │   ├── lib/                      # Utilities
│   │   │   ├── api.ts                # Axios configuration
│   │   │   └── types.ts              # TypeScript types
│   │   │
│   │   └── store/                    # State management
│   │       └── authStore.ts          # Zustand auth store
│   │
│   ├── .env.example                  # Environment variables template
│   ├── .gitignore
│   ├── next.config.js                # Next.js configuration
│   ├── package.json                  # Node dependencies
│   ├── postcss.config.js             # PostCSS configuration
│   ├── tailwind.config.ts            # Tailwind configuration
│   └── tsconfig.json                 # TypeScript configuration
│
├── .gitignore                        # Root gitignore
├── API_DOCUMENTATION.md              # Complete API reference
├── DEPLOYMENT.md                     # Deployment guide
├── FEATURES.md                       # Feature list
├── PROJECT_STRUCTURE.md              # This file
├── QUICK_START.md                    # Quick start guide
└── README.md                         # Project overview
```

## Key Files Explained

### Backend

**app/main.py**
- FastAPI application entry point
- CORS configuration
- Router registration

**app/models.py**
- SQLAlchemy ORM models
- Database table definitions
- Relationships between entities

**app/schemas.py**
- Pydantic v2 models
- Request/response validation
- Data serialization

**app/auth.py**
- JWT token creation and verification
- Role-based access control
- Authentication middleware

**app/database.py**
- Database connection setup
- Session management
- Database dependency injection

**app/config.py**
- Environment variable loading
- Application settings
- Configuration management

### Frontend

**src/app/layout.tsx**
- Root layout component
- Global providers
- Font configuration

**src/lib/api.ts**
- Axios instance configuration
- Request/response interceptors
- Token management

**src/lib/types.ts**
- TypeScript interfaces
- Enums for status values
- Type definitions

**src/store/authStore.ts**
- Zustand state management
- Authentication state
- User session handling

**src/components/Sidebar.tsx**
- Navigation component
- Role-based menu items
- User profile display

## Database Schema

### Core Tables
1. **users** - User accounts and authentication
2. **departments** - Organizational hierarchy
3. **audits** - Audit records and metadata

### Audit Workflow Tables
4. **audit_team** - Team member assignments
5. **audit_work_program** - Audit procedures
6. **audit_evidence** - Evidence references (URLs)
7. **audit_findings** - Audit findings and issues
8. **audit_queries** - Q&A communication
9. **audit_reports** - Report versions
10. **audit_followup** - Follow-up actions

## API Routes

### Authentication
- POST `/auth/signup` - User registration
- POST `/auth/login` - User login
- GET `/auth/validate` - Token validation

### Users
- POST `/users/` - Create user
- GET `/users/` - List users
- GET `/users/{id}` - Get user
- PUT `/users/{id}` - Update user
- DELETE `/users/{id}` - Disable user

### Departments
- POST `/departments/` - Create department
- GET `/departments/` - List departments
- GET `/departments/{id}` - Get department

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
- GET `/analytics/findings-summary` - Findings analysis
- GET `/analytics/audit-completion` - Completion stats

## Frontend Routes

- `/` - Home (redirects to dashboard or login)
- `/login` - Authentication page
- `/dashboard` - Executive dashboard
- `/audits` - Audit listing
- `/audits/create` - Create new audit
- `/audits/[id]` - Audit details
- `/planning` - Audit planning
- `/reports` - Report management
- `/followups` - Follow-up tracking
- `/analytics` - Analytics dashboard
- `/users` - User management (admin only)
- `/departments` - Department management (admin only)

## Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **SQLAlchemy** - ORM for database operations
- **Alembic** - Database migration tool
- **Pydantic v2** - Data validation
- **Python-JOSE** - JWT token handling
- **Psycopg2** - PostgreSQL adapter

### Frontend
- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **TailwindCSS** - Utility-first CSS framework
- **React Query** - Data fetching and caching
- **Zustand** - State management
- **Axios** - HTTP client

### Database
- **PostgreSQL** - Relational database
- **Supabase** - PostgreSQL hosting

## Development Workflow

1. **Backend Development**
   - Modify models in `app/models.py`
   - Create migration: `alembic revision --autogenerate`
   - Apply migration: `alembic upgrade head`
   - Add routes in `app/routers/`
   - Test with Swagger UI at `/docs`

2. **Frontend Development**
   - Create pages in `src/app/`
   - Add components in `src/components/`
   - Define types in `src/lib/types.ts`
   - Use React Query for data fetching
   - Style with Tailwind classes

3. **Testing**
   - Backend: Use FastAPI test client
   - Frontend: Manual testing in browser
   - API: Test with Swagger UI or Postman

4. **Deployment**
   - Backend: Deploy to cloud platform (AWS, GCP, Azure)
   - Frontend: Deploy to Vercel or Netlify
   - Database: Use Supabase or managed PostgreSQL
