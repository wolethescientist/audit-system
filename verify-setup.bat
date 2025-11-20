@echo off
echo ========================================
echo Audit Management System - Verification
echo ========================================
echo.

echo Checking Prerequisites...
echo.

REM Check Python
where python >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Python is installed
    python --version
) else (
    echo [!!] Python is not installed
    echo     Install Python 3.10+
)
echo.

REM Check Node
where node >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Node.js is installed
    node --version
) else (
    echo [!!] Node.js is not installed
    echo     Install Node.js 18+
)
echo.

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] npm is installed
    npm --version
) else (
    echo [!!] npm is not installed
)
echo.

echo Checking Backend Setup...
echo.

if exist backend (
    echo [OK] Backend directory exists
    
    if exist backend\venv (
        echo [OK] Virtual environment exists
    ) else (
        echo [!!] Virtual environment not found
        echo     Run: cd backend ^&^& python -m venv venv
    )
    
    if exist backend\.env (
        echo [OK] .env file exists
    ) else (
        echo [!!] .env file not found
        echo     Run: cd backend ^&^& copy .env.example .env
    )
    
    if exist backend\requirements.txt (
        echo [OK] requirements.txt exists
    )
) else (
    echo [!!] Backend directory not found
)
echo.

echo Checking Frontend Setup...
echo.

if exist frontend (
    echo [OK] Frontend directory exists
    
    if exist frontend\node_modules (
        echo [OK] node_modules exists
    ) else (
        echo [!!] node_modules not found
        echo     Run: cd frontend ^&^& npm install
    )
    
    if exist frontend\.env.local (
        echo [OK] .env.local exists
    ) else (
        echo [!!] .env.local not found
        echo     Run: cd frontend ^&^& copy .env.example .env.local
    )
    
    if exist frontend\package.json (
        echo [OK] package.json exists
    )
) else (
    echo [!!] Frontend directory not found
)
echo.

echo Checking Services...
echo.

curl -s http://localhost:8000/health >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Backend server is running (port 8000)
) else (
    echo [!!] Backend server is not running
    echo     Start: cd backend ^&^& uvicorn app.main:app --reload
)

curl -s http://localhost:3000 >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] Frontend server is running (port 3000)
) else (
    echo [!!] Frontend server is not running
    echo     Start: cd frontend ^&^& npm run dev
)
echo.

echo ========================================
echo Verification Complete
echo ========================================
echo.
echo Next Steps:
echo 1. Install missing dependencies
echo 2. Configure environment files
echo 3. Run database migrations
echo 4. Start both servers
echo.
echo See INSTALLATION.md for detailed instructions
echo.
pause
