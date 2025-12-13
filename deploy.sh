#!/bin/bash

# Production Deployment Script for ISO Audit System
# This script automates the deployment process with proper error handling

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
BACKUP_BEFORE_DEPLOY=${BACKUP_BEFORE_DEPLOY:-true}

echo -e "${GREEN}Starting deployment for ${ENVIRONMENT} environment${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required files exist
check_requirements() {
    print_status "Checking deployment requirements..."
    
    if [ ! -f ".env.prod" ]; then
        print_error ".env.prod file not found. Please create it from .env.prod template."
        exit 1
    fi
    
    if [ ! -f "docker-compose.prod.yml" ]; then
        print_error "docker-compose.prod.yml not found."
        exit 1
    fi
    
    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        print_error "Docker is not running. Please start Docker first."
        exit 1
    fi
    
    # Check if Docker Compose is available
    if ! command -v docker-compose > /dev/null 2>&1; then
        print_error "Docker Compose is not installed."
        exit 1
    fi
    
    print_status "Requirements check passed"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p logs/nginx
    mkdir -p backups
    mkdir -p nginx/ssl
    mkdir -p monitoring/grafana/dashboards
    mkdir -p monitoring/grafana/datasources
    
    # Set proper permissions
    chmod +x scripts/backup.sh
    chmod +x scripts/restore.sh
    
    print_status "Directories created successfully"
}

# Generate SSL certificates (self-signed for development)
generate_ssl_certificates() {
    print_status "Checking SSL certificates..."
    
    if [ ! -f "nginx/ssl/cert.pem" ] || [ ! -f "nginx/ssl/key.pem" ]; then
        print_warning "SSL certificates not found. Generating self-signed certificates..."
        print_warning "For production, replace with proper SSL certificates from a CA."
        
        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
        
        print_status "Self-signed SSL certificates generated"
    else
        print_status "SSL certificates found"
    fi
}

# Backup existing database
backup_database() {
    if [ "$BACKUP_BEFORE_DEPLOY" = "true" ]; then
        print_status "Creating pre-deployment backup..."
        
        if docker-compose -f docker-compose.prod.yml ps db | grep -q "Up"; then
            docker-compose -f docker-compose.prod.yml exec -T db pg_dump \
                -U ${POSTGRES_USER:-audit_user} \
                -d ${POSTGRES_DB:-audit_db} \
                --clean --no-owner --no-privileges \
                | gzip > "backups/pre_deploy_backup_$(date +%Y%m%d_%H%M%S).sql.gz"
            
            print_status "Pre-deployment backup created"
        else
            print_warning "Database not running, skipping backup"
        fi
    fi
}

# Deploy the application
deploy_application() {
    print_status "Deploying application..."
    
    # Copy environment file
    cp .env.prod .env
    
    # Pull latest images
    print_status "Pulling latest Docker images..."
    docker-compose -f docker-compose.prod.yml pull
    
    # Build and start services
    print_status "Building and starting services..."
    docker-compose -f docker-compose.prod.yml up -d --build
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Run database migrations
    print_status "Running database migrations..."
    docker-compose -f docker-compose.prod.yml exec -T backend alembic upgrade head
    
    print_status "Application deployed successfully"
}

# Verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Check if all services are running
    if docker-compose -f docker-compose.prod.yml ps | grep -q "Exit"; then
        print_error "Some services failed to start"
        docker-compose -f docker-compose.prod.yml ps
        exit 1
    fi
    
    # Health checks
    print_status "Running health checks..."
    
    # Check backend health
    if curl -f http://localhost:8000/health > /dev/null 2>&1; then
        print_status "Backend health check passed"
    else
        print_warning "Backend health check failed"
    fi
    
    # Check frontend
    if curl -f http://localhost:3000 > /dev/null 2>&1; then
        print_status "Frontend health check passed"
    else
        print_warning "Frontend health check failed"
    fi
    
    # Check database connection
    if docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U ${POSTGRES_USER:-audit_user} > /dev/null 2>&1; then
        print_status "Database health check passed"
    else
        print_warning "Database health check failed"
    fi
    
    print_status "Deployment verification completed"
}

# Setup monitoring
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Check if Prometheus is accessible
    sleep 10
    if curl -f http://localhost:9090/-/healthy > /dev/null 2>&1; then
        print_status "Prometheus is running"
    else
        print_warning "Prometheus health check failed"
    fi
    
    # Check if Grafana is accessible
    if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
        print_status "Grafana is running"
        print_status "Grafana dashboard available at: http://localhost:3001"
        print_status "Default login: admin / \${GRAFANA_PASSWORD}"
    else
        print_warning "Grafana health check failed"
    fi
}

# Setup backup cron job
setup_backup_cron() {
    print_status "Setting up automated backups..."
    
    # Create backup cron job
    CRON_SCHEDULE=${BACKUP_SCHEDULE:-"0 2 * * *"}
    BACKUP_COMMAND="cd $(pwd) && docker-compose -f docker-compose.prod.yml run --rm backup"
    
    # Add to crontab if not already present
    (crontab -l 2>/dev/null | grep -v "$BACKUP_COMMAND"; echo "$CRON_SCHEDULE $BACKUP_COMMAND") | crontab -
    
    print_status "Automated backup scheduled: $CRON_SCHEDULE"
}

# Main deployment process
main() {
    print_status "ISO Audit System Production Deployment"
    print_status "Environment: $ENVIRONMENT"
    
    check_requirements
    create_directories
    generate_ssl_certificates
    backup_database
    deploy_application
    verify_deployment
    setup_monitoring
    setup_backup_cron
    
    print_status "Deployment completed successfully!"
    print_status ""
    print_status "Services available at:"
    print_status "- Frontend: https://localhost (HTTP redirects to HTTPS)"
    print_status "- Backend API: https://localhost/api"
    print_status "- Grafana: http://localhost:3001"
    print_status "- Prometheus: http://localhost:9090"
    print_status ""
    print_status "Important next steps:"
    print_status "1. Update .env.prod with your actual production values"
    print_status "2. Replace self-signed SSL certificates with proper CA certificates"
    print_status "3. Configure your domain name in nginx configuration"
    print_status "4. Set up external monitoring and alerting"
    print_status "5. Configure email notifications for alerts"
    print_status ""
    print_status "For troubleshooting, check logs with:"
    print_status "docker-compose -f docker-compose.prod.yml logs [service_name]"
}

# Run main function
main "$@"