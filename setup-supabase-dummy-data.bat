@echo off
echo ============================================================
echo Supabase Dummy Data Setup - Complete Guide
echo ============================================================
echo.
echo This script will help you populate your Supabase database
echo with comprehensive dummy data.
echo.
echo ============================================================
echo STEP 1: Verify System Readiness
echo ============================================================
echo.

python verify-supabase-ready.py

if errorlevel 1 (
    echo.
    echo ============================================================
    echo Please fix the issues above before continuing.
    echo ============================================================
    echo.
    echo Quick fixes:
    echo   1. Start backend: cd backend ^&^& python -m uvicorn app.main:app --reload
    echo   2. Run migrations: cd backend ^&^& alembic upgrade head
    echo   3. Create admin: python create-test-users.py
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================================
echo STEP 2: Generate Dummy Data
echo ============================================================
echo.
echo This will create:
echo   - 14 Departments (with sub-departments)
echo   - 14 Users (all roles)
echo   - 6 Complete Audits (various stages)
echo   - 50+ Work Programs
echo   - 60+ Evidence Documents
echo   - 25+ Findings (all severities)
echo   - 40+ Queries
echo   - 5 Reports
echo   - 15+ Follow-ups
echo   - 3 Workflows
echo.
pause

python generate-comprehensive-dummy-data.py

if errorlevel 1 (
    echo.
    echo [ERROR] Data generation failed!
    pause
    exit /b 1
)

echo.
echo ============================================================
echo STEP 3: Verify Data in Supabase
echo ============================================================
echo.
echo Data has been created in your Supabase database!
echo.
echo To verify:
echo   1. Go to: https://supabase.com/dashboard
echo   2. Select your project
echo   3. Go to Table Editor
echo   4. Check tables: departments, users, audits, etc.
echo.
echo ============================================================
echo STEP 4: Test in Frontend
echo ============================================================
echo.
echo Login credentials (passwordless):
echo   - admin@audit.com (System Admin)
echo   - audit.manager@audit.com (Audit Manager)
echo   - senior.auditor@audit.com (Senior Auditor)
echo   - finance.head@company.com (Finance Head)
echo   - it.head@company.com (IT Head)
echo.
echo Frontend URL: http://localhost:3000
echo.
echo ============================================================
echo Setup Complete!
echo ============================================================
echo.
pause
