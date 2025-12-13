#!/bin/bash

# Production Build Verification Script
# This script verifies that the application builds successfully for production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

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

# Verify backend build
verify_backend() {
    print_status "Verifying backend build..."
    
    cd backend
    
    # Check if requirements are satisfied
    if pip install -r requirements.txt --dry-run > /dev/null 2>&1; then
        print_status "Backend dependencies verified"
    else
        print_error "Backend dependency issues detected"
        return 1
    fi
    
    # Check Python syntax
    if python -m py_compile app/main.py; then
        print_status "Backend Python syntax verified"
    else
        print_error "Backend Python syntax errors detected"
        return 1
    fi
    
    cd ..
}

# Verify frontend build
verify_frontend() {
    print_status "Verifying frontend build..."
    
    cd frontend
    
    # Install dependencies
    print_status "Installing frontend dependencies..."
    npm ci --only=production
    
    # Run TypeScript check
    print_status "Running TypeScript check..."
    if npx tsc --noEmit; then
        print_status "TypeScript check passed"
    else
        print_warning "TypeScript issues detected (non-blocking for production)"
    fi
    
    # Run ESLint check
    print_status "Running ESLint check..."
    if npm run lint; then
        print_status "ESLint check passed"
    else
        print_warning "ESLint issues detected (non-blocking for production)"
    fi
    
    # Build the application
    print_status "Building frontend application..."
    if NODE_ENV=production npm run build:prod; then
        print_status "Frontend build successful"
    else
        print_error "Frontend build failed"
        return 1
    fi
    
    # Verify build output
    if [ -d ".next" ] && [ -f ".next/BUILD_ID" ]; then
        print_status "Build artifacts verified"
    else
        print_error "Build artifacts missing"
        return 1
    fi
    
    cd ..
}

# Verify Docker builds
verify_docker_builds() {
    print_status "Verifying Docker builds..."
    
    # Build backend Docker image
    print_status "Building backend Docker image..."
    if docker build -f backend/Dockerfile.prod -t audit-backend:test backend/; then
        print_status "Backend Docker build successful"
        docker rmi audit-backend:test
    else
        print_error "Backend Docker build failed"
        return 1
    fi
    
    # Build frontend Docker image
    print_status "Building frontend Docker image..."
    if docker build -f frontend/Dockerfile.prod -t audit-frontend:test frontend/; then
        print_status "Frontend Docker build successful"
        docker rmi audit-frontend:test
    else
        print_error "Frontend Docker build failed"
        return 1
    fi
}

# Verify configuration files
verify_configuration() {
    print_status "Verifying configuration files..."
    
    # Check required files exist
    local required_files=(
        "docker-compose.prod.yml"
        ".env.prod"
        "nginx/nginx.conf"
        "monitoring/prometheus.yml"
        "scripts/backup.sh"
        "scripts/restore.sh"
    )
    
    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            print_status "Configuration file verified: $file"
        else
            print_error "Missing configuration file: $file"
            return 1
        fi
    done
    
    # Validate docker-compose file
    if docker-compose -f docker-compose.prod.yml config > /dev/null 2>&1; then
        print_status "Docker Compose configuration valid"
    else
        print_error "Docker Compose configuration invalid"
        return 1
    fi
}

# Main verification function
main() {
    print_status "Starting production build verification..."
    
    local verification_failed=false
    
    # Run all verifications
    if ! verify_configuration; then
        verification_failed=true
    fi
    
    if ! verify_backend; then
        verification_failed=true
    fi
    
    if ! verify_frontend; then
        verification_failed=true
    fi
    
    if ! verify_docker_builds; then
        verification_failed=true
    fi
    
    # Summary
    echo ""
    if [ "$verification_failed" = true ]; then
        print_error "Build verification failed - please fix the issues above"
        exit 1
    else
        print_status "All build verifications passed successfully!"
        print_status "The application is ready for production deployment"
        exit 0
    fi
}

# Run main function
main "$@"