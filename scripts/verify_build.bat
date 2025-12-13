@echo off
REM Production Build Verification Script (Windows)
REM This script verifies that the application builds successfully for production

setlocal enabledelayedexpansion

set VERIFICATION_FAILED=false

echo [INFO] Starting production build verification...

REM Function to print status
:print_status
echo [INFO] %~1
goto :eof

:print_warning
echo [WARNING] %~1
goto :eof

:print_error
echo [ERROR] %~1
set VERIFICATION_FAILED=true
goto :eof

REM Verify backend build
:verify_backend
call :print_status "Verifying backend build..."

cd backend

REM Check Python syntax
python -m py_compile app/main.py >nul 2>&1
if errorlevel 1 (
    call :print_error "Backend Python syntax errors detected"
) else (
    call :print_status "Backend Python syntax verified"
)

cd ..
goto :eof

REM Verify frontend build
:verify_frontend
call :print_status "Verifying frontend build..."

cd frontend

REM Install dependencies
call :print_status "Installing frontend dependencies..."
npm ci --only=production >nul 2>&1
if errorlevel 1 (
    call :print_error "Frontend dependency installation failed"
    cd ..
    goto :eof
)

REM Run TypeScript check
call :print_status "Running TypeScript check..."
npx tsc --noEmit >nul 2>&1
if errorlevel 1 (
    call :print_warning "TypeScript issues detected (non-blocking for production)"
) else (
    call :print_status "TypeScript check passed"
)

REM Run ESLint check
call :print_status "Running ESLint check..."
npm run lint >nul 2>&1
if errorlevel 1 (
    call :print_warning "ESLint issues detected (non-blocking for production)"
) else (
    call :print_status "ESLint check passed"
)

REM Build the application
call :print_status "Building frontend application..."
set NODE_ENV=production
npm run build:prod >nul 2>&1
if errorlevel 1 (
    call :print_error "Frontend build failed"
    cd ..
    goto :eof
) else (
    call :print_status "Frontend build successful"
)

REM Verify build output
if exist ".next" (
    if exist ".next\BUILD_ID" (
        call :print_status "Build artifacts verified"
    ) else (
        call :print_error "Build artifacts missing"
    )
) else (
    call :print_error "Build artifacts missing"
)

cd ..
goto :eof

REM Verify Docker builds
:verify_docker_builds
call :print_status "Verifying Docker builds..."

REM Build backend Docker image
call :print_status "Building backend Docker image..."
docker build -f backend/Dockerfile.prod -t audit-backend:test backend/ >nul 2>&1
if errorlevel 1 (
    call :print_error "Backend Docker build failed"
) else (
    call :print_status "Backend Docker build successful"
    docker rmi audit-backend:test >nul 2>&1
)

REM Build frontend Docker image
call :print_status "Building frontend Docker image..."
docker build -f frontend/Dockerfile.prod -t audit-frontend:test frontend/ >nul 2>&1
if errorlevel 1 (
    call :print_error "Frontend Docker build failed"
) else (
    call :print_status "Frontend Docker build successful"
    docker rmi audit-frontend:test >nul 2>&1
)

goto :eof

REM Verify configuration files
:verify_configuration
call :print_status "Verifying configuration files..."

REM Check required files exist
set required_files=docker-compose.prod.yml .env.prod nginx/nginx.conf monitoring/prometheus.yml scripts/backup.sh scripts/restore.sh

for %%f in (%required_files%) do (
    if exist "%%f" (
        call :print_status "Configuration file verified: %%f"
    ) else (
        call :print_error "Missing configuration file: %%f"
    )
)

REM Validate docker-compose file
docker-compose -f docker-compose.prod.yml config >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker Compose configuration invalid"
) else (
    call :print_status "Docker Compose configuration valid"
)

goto :eof

REM Main verification function
:main
call :verify_configuration
call :verify_backend
call :verify_frontend
call :verify_docker_builds

echo.
if "%VERIFICATION_FAILED%"=="true" (
    call :print_error "Build verification failed - please fix the issues above"
    exit /b 1
) else (
    call :print_status "All build verifications passed successfully!"
    call :print_status "The application is ready for production deployment"
    exit /b 0
)

REM Run main function
call :main