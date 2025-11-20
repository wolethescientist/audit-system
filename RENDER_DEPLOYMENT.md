# Render Deployment Guide

## Backend (FastAPI)

### Start Command:
```bash
alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

### Build Command:
```bash
pip install -r requirements.txt
```

### Environment Variables:
- `DATABASE_URL` - Your Supabase PostgreSQL URL
- `JWT_SECRET_KEY` - Generate with: `python -c "import secrets; print(secrets.token_hex(32))"`
- `JWT_ALGORITHM` - `HS256`
- `JWT_EXPIRATION_MINUTES` - `1440`
- `PYTHON_VERSION` - `3.11`

### Root Directory:
`backend`

---

## Frontend (Next.js)

### Start Command:
```bash
npm start
```

### Build Command:
```bash
npm install && npm run build
```

### Environment Variables:
- `NEXT_PUBLIC_API_URL` - Your backend URL (e.g., `https://audit-system-backend.onrender.com`)
- `NODE_VERSION` - `18`

### Root Directory:
`frontend`

---

## Quick Deploy Steps:

### Option 1: Using render.yaml (Recommended)
1. Push code to GitHub
2. Connect Render to your repo
3. Render will auto-detect `render.yaml`
4. Set DATABASE_URL in Render dashboard
5. Deploy both services

### Option 2: Manual Setup

**Backend:**
1. New Web Service
2. Connect repo
3. Root Directory: `backend`
4. Build Command: `pip install -r requirements.txt`
5. Start Command: `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Add environment variables
7. Deploy

**Frontend:**
1. New Web Service
2. Connect repo
3. Root Directory: `frontend`
4. Build Command: `npm install && npm run build`
5. Start Command: `npm start`
6. Add NEXT_PUBLIC_API_URL (backend URL)
7. Deploy

---

## Post-Deployment:

1. Run the user creation script against production:
```bash
python create-test-users.py
# Update API_URL to your production backend URL
```

2. Test login at your frontend URL

3. Create initial departments and users via API

---

## Troubleshooting:

**Database Connection Issues:**
- Ensure DATABASE_URL uses connection pooler (port 6543)
- Check Supabase IP allowlist

**Build Failures:**
- Check Python version (3.11+)
- Check Node version (18+)
- Verify all dependencies in requirements.txt

**CORS Errors:**
- Update CORS origins in backend/app/main.py
- Add your frontend URL to allowed origins
