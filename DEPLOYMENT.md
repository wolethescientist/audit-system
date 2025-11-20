# Deployment Guide

## Backend Deployment

### Prerequisites
1. Python 3.10+
2. PostgreSQL database (Supabase)
3. Environment variables configured

### Steps

1. **Install dependencies**
```bash
cd backend
pip install -r requirements.txt
```

2. **Configure environment**
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. **Run migrations**
```bash
alembic revision --autogenerate -m "Initial migration"
alembic upgrade head
```

4. **Start the server**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Production Deployment
- Use Gunicorn with Uvicorn workers
- Set up reverse proxy (Nginx)
- Enable HTTPS
- Configure CORS properly

## Frontend Deployment

### Prerequisites
1. Node.js 18+
2. Backend API URL

### Steps

1. **Install dependencies**
```bash
cd frontend
npm install
```

2. **Configure environment**
```bash
cp .env.example .env.local
# Set NEXT_PUBLIC_API_URL to your backend URL
```

3. **Build for production**
```bash
npm run build
```

4. **Start production server**
```bash
npm start
```

### Deployment Platforms
- **Vercel**: Automatic deployment from Git
- **Netlify**: Static export with API proxy
- **Docker**: Use provided Dockerfile

## Database Setup

1. Create a Supabase project
2. Get connection string from Settings > Database
3. Run migrations using Alembic
4. Disable RLS (Row Level Security) as auth is handled by FastAPI

## Initial Data

Create a system admin user:
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "full_name": "System Admin",
    "role": "system_admin"
  }'
```

## Security Checklist

- [ ] Change JWT_SECRET_KEY in production
- [ ] Enable HTTPS
- [ ] Configure CORS for production domains
- [ ] Set up rate limiting
- [ ] Enable database backups
- [ ] Configure logging and monitoring
- [ ] Set up file upload size limits
- [ ] Review and test all role permissions
