@echo off
REM Production Deployment Script for ISO Audit System (Windows)
REM This script automates the deployment process with proper error handling

setlocal enabledelayedexpansion

set ENVIRONMENT=%1
if "%ENVIRONMENT%"=="" set ENVIRONMENT=production

set BACKUP_BEFORE_DEPLOY=%BACKUP_BEFORE_DEPLOY%
if "%BACKUP_BEFORE_DEPLOY%"=="" set BACKUP_BEFORE_DEPLOY=true

echo Starting deployment for %ENVIRONMENT% environment

REM Function to print status
:print_status
echo [INFO] %~1
goto :eof

:print_warning
echo [WARNING] %~1
goto :eof

:print_error
echo [ERROR] %~1
goto :eof

REM Check if required files exist
:check_requirements
call :print_status "Checking deployment requirements..."

if not exist ".env.prod" (
    call :print_error ".env.prod file not found. Please create it from .env.prod template."
    exit /b 1
)

if not exist "docker-compose.prod.yml" (
    call :print_error "docker-compose.prod.yml not found."
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker is not running. Please start Docker first."
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if errorlevel 1 (
    call :print_error "Docker Compose is not installed."
    exit /b 1
)

call :print_status "Requirements check passed"
goto :eof

REM Create necessary directories
:create_directories
call :print_status "Creating necessary directories..."

if not exist "logs\nginx" mkdir logs\nginx
if not exist "backups" mkdir backups
if not exist "nginx\ssl" mkdir nginx\ssl
if not exist "monitoring\grafana\dashboards" mkdir monitoring\grafana\dashboards
if not exist "monitoring\grafana\datasources" mkdir monitoring\grafana\datasources

call :print_status "Directories created successfully"
goto :eof

REM Generate SSL certificates (self-signed for development)
:generate_ssl_certificates
call :print_status "Checking SSL certificates..."

if not exist "nginx\ssl\cert.pem" (
    call :print_warning "SSL certificates not found. Generating self-signed certificates..."
    call :print_warning "For production, replace with proper SSL certificates from a CA."
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 -keyout nginx\ssl\key.pem -out nginx\ssl\cert.pem -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
    
    call :print_status "Self-signed SSL certificates generated"
) else (
    call :print_status "SSL certificates found"
)
goto :eof

REM Backup existing database
:backup_database
if "%BACKUP_BEFORE_DEPLOY%"=="true" (
    call :print_status "Creating pre-deployment backup..."
    
    docker-compose -f docker-compose.prod.yml ps db | findstr "Up" >nul
    if not errorlevel 1 (
        for /f "tokens=2 delims= " %%i in ('date /t') do set current_date=%%i
        for /f "tokens=1 delims= " %%i in ('time /t') do set current_time=%%i
        set timestamp=%current_date:~6,4%%current_date:~0,2%%current_date:~3,2%_%current_time:~0,2%%current_time:~3,2%
        set timestamp=!timestamp: =0!
        
        docker-compose -f docker-compose.prod.yml exec -T db pg_dump -U audit_user -d audit_db --clean --no-owner --no-privileges > backups\pre_deploy_backup_!timestamp!.sql
        
        call :print_status "Pre-deployment backup created"
    ) else (
        call :print_warning "Database not running, skipping backup"
    )
)
goto :eof

REM Deploy the application
:deploy_application
call :print_status "Deploying application..."

REM Copy environment file
copy .env.prod .env

REM Pull latest images
call :print_status "Pulling latest Docker images..."
docker-compose -f docker-compose.prod.yml pull

REM Build and start services
call :print_status "Building and starting services..."
docker-compose -f docker-compose.prod.yml up -d --build

REM Wait for services to be ready
call :print_status "Waiting for services to be ready..."
timeout /t 30 /nobreak >nul

REM Run database migrations
call :print_status "Running database migrations..."
docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head

call :print_status "Application deployed successfully"
goto :eof

REM Verify deployment
:verify_deployment
call :print_status "Verifying deployment..."

REM Check if all services are running
docker-compose -f docker-compose.prod.yml ps | findstr "Exit" >nul
if not errorlevel 1 (
    call :print_error "Some services failed to start"
    docker-compose -f docker-compose.prod.yml ps
    exit /b 1
)

REM Health checks
call :print_status "Running health checks..."

REM Check backend health
curl -f http://localhost:8000/health >nul 2>&1
if not errorlevel 1 (
    call :print_status "Backend health check passed"
) else (
    call :print_warning "Backend health check failed"
)

REM Check frontend
curl -f http://localhost:3000 >nul 2>&1
if not errorlevel 1 (
    call :print_status "Frontend health check passed"
) else (
    call :print_warning "Frontend health check failed"
)

call :print_status "Deployment verification completed"
goto :eof

REM Setup monitoring
:setup_monitoring
call :print_status "Setting up monitoring..."

REM Wait a bit for services to fully start
timeout /t 10 /nobreak >nul

REM Check if Prometheus is accessible
curl -f http://localhost:9090/-/healthy >nul 2>&1
if not errorlevel 1 (
    call :print_status "Prometheus is running"
) else (
    call :print_warning "Prometheus health check failed"
)

REM Check if Grafana is accessible
curl -f http://localhost:3001/api/health >nul 2>&1
if not errorlevel 1 (
    call :print_status "Grafana is running"
    call :print_status "Grafana dashboard available at: http://localhost:3001"
    call :print_status "Default login: admin / %GRAFANA_PASSWORD%"
) else (
    call :print_warning "Grafana health check failed"
)
goto :eof

REM Main deployment process
:main
call :print_status "ISO Audit System Production Deployment"
call :print_status "Environment: %ENVIRONMENT%"

call :check_requirements
if errorlevel 1 exit /b 1

call :create_directories
call :generate_ssl_certificates
call :backup_database
call :deploy_application
if errorlevel 1 exit /b 1

call :verify_deployment
call :setup_monitoring

call :print_status "Deployment completed successfully!"
echo.
call :print_status "Services available at:"
call :print_status "- Frontend: https://localhost (HTTP redirects to HTTPS)"
call :print_status "- Backend API: https://localhost/api"
call :print_status "- Grafana: http://localhost:3001"
call :print_status "- Prometheus: http://localhost:9090"
echo.
call :print_status "Important next steps:"
call :print_status "1. Update .env.prod with your actual production values"
call :print_status "2. Replace self-signed SSL certificates with proper CA certificates"
call :print_status "3. Configure your domain name in nginx configuration"
call :print_status "4. Set up external monitoring and alerting"
call :print_status "5. Configure email notifications for alerts"
echo.
call :print_status "For troubleshooting, check logs with:"
call :print_status "docker-compose -f docker-compose.prod.yml logs [service_name]"

goto :eof

REM Run main function
call :main %*