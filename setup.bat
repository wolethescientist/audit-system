@echo off
echo ========================================
echo Audit Management System - Setup Script
echo ========================================
echo.

echo Step 1: Setting up Backend...
cd backend

if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)

echo Activating virtual environment...
call venv\Scripts\activate

echo Installing Python dependencies...
pip install -r requirements.txt

if not exist .env (
    echo Creating .env file from template...
    copy .env.example .env
    echo.
    echo IMPORTANT: Please edit backend\.env with your Supabase credentials!
    echo.
    pause
)

cd ..

echo.
echo Step 2: Setting up Frontend...
cd frontend

if not exist node_modules (
    echo Installing Node.js dependencies...
    call npm install
)

if not exist .env.local (
    echo Creating .env.local file from template...
    copy .env.example .env.local
)

cd ..

echo.
echo ========================================
echo Setup Complete!
echo ========================================
echo.
echo Next steps:
echo 1. Edit backend\.env with your Supabase credentials
echo 2. Run database migrations:
echo    cd backend
echo    venv\Scripts\activate
echo    alembic revision --autogenerate -m "Initial migration"
echo    alembic upgrade head
echo.
echo 3. Start the backend:
echo    cd backend
echo    venv\Scripts\activate
echo    uvicorn app.main:app --reload
echo.
echo 4. Start the frontend (in a new terminal):
echo    cd frontend
echo    npm run dev
echo.
echo 5. Open http://localhost:3000 in your browser
echo.
pause
