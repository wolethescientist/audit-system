# Quick Fix Guide

## 🚨 Seeing Frontend Errors?

### The Problem
```
❌ Cannot find module 'next'
❌ Cannot find module '@tanstack/react-query'
❌ Cannot find module 'zustand'
```

### The Solution
```bash
cd frontend
npm install
```

**That's it!** All errors will be fixed. ✅

---

## Complete Setup (5 Minutes)

### 1. Backend Setup (2 minutes)
```bash
cd backend
python -m venv venv
source venv/bin/activate          # Mac/Linux
# OR
venv\Scripts\activate              # Windows

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Supabase credentials

alembic revision --autogenerate -m "Initial"
alembic upgrade head
uvicorn app.main:app --reload
```

### 2. Frontend Setup (2 minutes)
```bash
cd frontend
npm install                        # ← This fixes all errors!
cp .env.example .env.local
npm run dev
```

### 3. Create User (30 seconds)
```bash
curl -X POST http://localhost:8000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@test.com","full_name":"Admin","role":"system_admin"}'
```

### 4. Login (30 seconds)
- Open http://localhost:3000
- Enter: admin@test.com
- Click "Sign In"

---

## Automated Setup

### Windows
```bash
setup.bat
```

### Mac/Linux
```bash
chmod +x setup.sh
./setup.sh
```

---

## Verify Setup

### Windows
```bash
verify-setup.bat
```

### Mac/Linux
```bash
chmod +x verify-setup.sh
./verify-setup.sh
```

---

## Troubleshooting

### Backend won't start
```bash
# Check Python version
python --version  # Need 3.10+

# Check .env file exists
ls backend/.env

# Check database connection
# Edit backend/.env with correct Supabase URL
```

### Frontend errors persist
```bash
# Clear everything and reinstall
cd frontend
rm -rf node_modules package-lock.json .next
npm install

# Restart IDE
# Close and reopen VS Code/WebStorm
```

### Port already in use
```bash
# Backend (port 8000)
# Windows:
netstat -ano | findstr :8000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:8000 | xargs kill -9

# Frontend (port 3000)
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Mac/Linux:
lsof -ti:3000 | xargs kill -9
```

---

## Documentation

| File | Purpose |
|------|---------|
| [README.md](README.md) | Project overview |
| [ERRORS_EXPLAINED.md](ERRORS_EXPLAINED.md) | Why you see errors |
| [FRONTEND_SETUP.md](FRONTEND_SETUP.md) | Frontend setup guide |
| [INSTALLATION.md](INSTALLATION.md) | Complete installation |
| [QUICK_START.md](QUICK_START.md) | Quick start guide |
| [API_DOCUMENTATION.md](API_DOCUMENTATION.md) | API reference |
| [TESTING.md](TESTING.md) | Testing guide |
| [DEPLOYMENT.md](DEPLOYMENT.md) | Production deployment |

---

## Key URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:3000 | Web interface |
| Backend | http://localhost:8000 | API server |
| API Docs | http://localhost:8000/docs | Swagger UI |
| Health Check | http://localhost:8000/health | Server status |

---

## Common Commands

### Backend
```bash
# Start server
uvicorn app.main:app --reload

# Run migrations
alembic upgrade head

# Create migration
alembic revision --autogenerate -m "Description"
```

### Frontend
```bash
# Install dependencies (fixes all errors!)
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

---

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=postgresql://user:pass@host:5432/db
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_KEY=your-key
JWT_SECRET_KEY=your-secret
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Need Help?

1. **Read the error message** - It usually tells you what's wrong
2. **Check [ERRORS_EXPLAINED.md](ERRORS_EXPLAINED.md)** - Explains common errors
3. **Run verification script** - `verify-setup.bat` or `verify-setup.sh`
4. **Check documentation** - See files listed above
5. **Start fresh** - Delete `node_modules` and `venv`, reinstall

---

## Success Checklist

- [ ] Python 3.10+ installed
- [ ] Node.js 18+ installed
- [ ] Supabase account created
- [ ] Backend `.env` configured
- [ ] Backend dependencies installed
- [ ] Database migrations run
- [ ] Backend server running (port 8000)
- [ ] Frontend dependencies installed (`npm install`)
- [ ] Frontend `.env.local` configured
- [ ] Frontend server running (port 3000)
- [ ] No TypeScript errors in IDE
- [ ] Can access http://localhost:3000
- [ ] Can login to application

---

**Remember:** `npm install` fixes all frontend errors! 🎉
