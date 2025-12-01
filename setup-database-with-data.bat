@echo off
echo ============================================
echo Database Setup with Comprehensive Dummy Data
echo ============================================
echo.

echo Step 1: Running Alembic migrations to create tables...
cd backend
alembic upgrade head
if %ERRORLEVEL% NEQ 0 (
    echo ERROR: Failed to run migrations
    cd ..
    pause
    exit /b 1
)
cd ..
echo ✓ Migrations completed successfully
echo.

echo Step 2: Loading comprehensive dummy data...
echo Please enter your database connection details:
echo.

set /p DB_HOST="Database Host (default: localhost): "
if "%DB_HOST%"=="" set DB_HOST=localhost

set /p DB_PORT="Database Port (default: 5432): "
if "%DB_PORT%"=="" set DB_PORT=5432

set /p DB_NAME="Database Name: "
set /p DB_USER="Database User: "
set /p DB_PASS="Database Password: "

echo.
echo Connecting to: postgresql://%DB_USER%@%DB_HOST%:%DB_PORT%/%DB_NAME%
echo.

psql -h %DB_HOST% -p %DB_PORT% -U %DB_USER% -d %DB_NAME% -f comprehensive-dummy-data.sql

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: Failed to load dummy data
    echo.
    echo If psql is not found, you need to:
    echo 1. Install PostgreSQL client tools
    echo 2. Add PostgreSQL bin directory to your PATH
    echo.
    pause
    exit /b 1
)

echo.
echo ============================================
echo ✓ Database setup completed successfully!
echo ============================================
echo.
echo Your database now contains:
echo - 10 Departments
echo - 20 Users across all roles
echo - 7 Audits in various statuses
echo - Complete audit data (teams, work programs, evidence, findings, queries, reports)
echo - 6 Workflows with steps and approvals
echo.
echo You can now start the application and login with any user.
echo Default password for all users: password123
echo.
echo Sample users:
echo - admin@audit.com (System Admin)
echo - manager1@audit.com (Audit Manager)
echo - auditor1@audit.com (Auditor)
echo - finance.head@company.com (Department Head)
echo.
pause
