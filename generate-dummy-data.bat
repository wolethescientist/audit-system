@echo off
echo ============================================================
echo Comprehensive Dummy Data Generator
echo ============================================================
echo.
echo This script will populate your database with realistic data
echo showcasing all features for each role.
echo.
echo Prerequisites:
echo   1. Backend server must be running (port 8000)
echo   2. Admin user must exist (admin@audit.com)
echo   3. Python requests library installed
echo.
pause

echo.
echo Checking if backend is running...
curl -s http://localhost:8000/docs > nul 2>&1
if errorlevel 1 (
    echo [ERROR] Backend server is not running!
    echo Please start the backend first:
    echo   cd backend
    echo   python -m uvicorn app.main:app --reload
    echo.
    pause
    exit /b 1
)

echo [OK] Backend server is running
echo.
echo Starting data generation...
echo.

python generate-comprehensive-dummy-data.py

if errorlevel 1 (
    echo.
    echo [ERROR] Data generation failed!
    echo Please check the error messages above.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo Data generation completed successfully!
echo ============================================================
echo.
echo You can now login to the system with any of these users:
echo   - admin@audit.com (System Admin)
echo   - audit.manager@audit.com (Audit Manager)
echo   - senior.auditor@audit.com (Senior Auditor)
echo   - finance.head@company.com (Finance Department Head)
echo   - it.head@company.com (IT Department Head)
echo.
echo Frontend URL: http://localhost:3000
echo.
pause
