#!/bin/bash

# System Health Check Script
# This script performs comprehensive health checks for the ISO Audit System

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
HEALTH_CHECK_URL="http://localhost:8000/health"
FRONTEND_URL="http://localhost:3000"
GRAFANA_URL="http://localhost:3001/api/health"
PROMETHEUS_URL="http://localhost:9090/-/healthy"

# Function to print status
print_status() {
    echo -e "${GREEN}[PASS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
}

# Check if service is running
check_service() {
    local service_name=$1
    local url=$2
    local timeout=${3:-10}
    
    if curl -f -s --max-time $timeout "$url" > /dev/null 2>&1; then
        print_status "$service_name is healthy"
        return 0
    else
        print_error "$service_name is not responding"
        return 1
    fi
}

# Check Docker services
check_docker_services() {
    echo "Checking Docker services..."
    
    local services=("backend" "frontend" "db" "redis" "nginx")
    local failed_services=()
    
    for service in "${services[@]}"; do
        if docker-compose -f docker-compose.prod.yml ps "$service" | grep -q "Up"; then
            print_status "Docker service $service is running"
        else
            print_error "Docker service $service is not running"
            failed_services+=("$service")
        fi
    done
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        print_status "All Docker services are running"
        return 0
    else
        print_error "Failed services: ${failed_services[*]}"
        return 1
    fi
}

# Check database connectivity
check_database() {
    echo "Checking database connectivity..."
    
    if docker-compose -f docker-compose.prod.yml exec -T db pg_isready -U ${POSTGRES_USER:-audit_user} > /dev/null 2>&1; then
        print_status "Database is accepting connections"
        
        # Check database size and performance
        local db_stats=$(docker-compose -f docker-compose.prod.yml exec -T db psql -U ${POSTGRES_USER:-audit_user} -d ${POSTGRES_DB:-audit_db} -t -c "
            SELECT 
                pg_size_pretty(pg_database_size('${POSTGRES_DB:-audit_db}')) as db_size,
                (SELECT count(*) FROM pg_stat_activity WHERE state = 'active') as active_connections,
                (SELECT count(*) FROM pg_stat_activity) as total_connections;
        " 2>/dev/null)
        
        if [ $? -eq 0 ]; then
            echo "Database statistics: $db_stats"
            print_status "Database performance check completed"
        else
            print_warning "Could not retrieve database statistics"
        fi
        
        return 0
    else
        print_error "Database is not accepting connections"
        return 1
    fi
}

# Check system resources
check_system_resources() {
    echo "Checking system resources..."
    
    # Check disk usage
    local disk_usage=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
    if [ "$disk_usage" -lt 90 ]; then
        print_status "Disk usage: ${disk_usage}% (healthy)"
    elif [ "$disk_usage" -lt 95 ]; then
        print_warning "Disk usage: ${disk_usage}% (warning)"
    else
        print_error "Disk usage: ${disk_usage}% (critical)"
    fi
    
    # Check memory usage
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
    if [ "$memory_usage" -lt 85 ]; then
        print_status "Memory usage: ${memory_usage}% (healthy)"
    elif [ "$memory_usage" -lt 95 ]; then
        print_warning "Memory usage: ${memory_usage}% (warning)"
    else
        print_error "Memory usage: ${memory_usage}% (critical)"
    fi
    
    # Check CPU load
    local cpu_load=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')
    local cpu_cores=$(nproc)
    local cpu_usage=$(echo "scale=0; $cpu_load * 100 / $cpu_cores" | bc -l 2>/dev/null || echo "0")
    
    if [ "$cpu_usage" -lt 80 ]; then
        print_status "CPU load: ${cpu_load} (${cpu_usage}% of capacity)"
    elif [ "$cpu_usage" -lt 90 ]; then
        print_warning "CPU load: ${cpu_load} (${cpu_usage}% of capacity)"
    else
        print_error "CPU load: ${cpu_load} (${cpu_usage}% of capacity)"
    fi
}

# Check SSL certificates
check_ssl_certificates() {
    echo "Checking SSL certificates..."
    
    if [ -f "nginx/ssl/cert.pem" ]; then
        local expiry_date=$(openssl x509 -in nginx/ssl/cert.pem -noout -enddate | cut -d= -f2)
        local expiry_timestamp=$(date -d "$expiry_date" +%s)
        local current_timestamp=$(date +%s)
        local days_until_expiry=$(( (expiry_timestamp - current_timestamp) / 86400 ))
        
        if [ "$days_until_expiry" -gt 30 ]; then
            print_status "SSL certificate expires in $days_until_expiry days"
        elif [ "$days_until_expiry" -gt 7 ]; then
            print_warning "SSL certificate expires in $days_until_expiry days"
        else
            print_error "SSL certificate expires in $days_until_expiry days (renewal required)"
        fi
    else
        print_error "SSL certificate not found"
    fi
}

# Check backup status
check_backup_status() {
    echo "Checking backup status..."
    
    local backup_dir="./backups"
    if [ -d "$backup_dir" ]; then
        local latest_backup=$(ls -t "$backup_dir"/*.sql.gz 2>/dev/null | head -1)
        if [ -n "$latest_backup" ]; then
            local backup_age=$(( ($(date +%s) - $(stat -c %Y "$latest_backup")) / 86400 ))
            if [ "$backup_age" -eq 0 ]; then
                print_status "Latest backup: today"
            elif [ "$backup_age" -eq 1 ]; then
                print_status "Latest backup: 1 day ago"
            elif [ "$backup_age" -lt 2 ]; then
                print_warning "Latest backup: $backup_age days ago"
            else
                print_error "Latest backup: $backup_age days ago (backup may be failing)"
            fi
            
            # Check backup integrity
            if gunzip -t "$latest_backup" 2>/dev/null; then
                print_status "Latest backup integrity verified"
            else
                print_error "Latest backup integrity check failed"
            fi
        else
            print_error "No backups found"
        fi
    else
        print_error "Backup directory not found"
    fi
}

# Check log files for errors
check_logs() {
    echo "Checking recent logs for errors..."
    
    # Check for critical errors in the last hour
    local error_count=$(docker-compose -f docker-compose.prod.yml logs --since=1h 2>/dev/null | grep -i "error\|critical\|fatal" | wc -l)
    
    if [ "$error_count" -eq 0 ]; then
        print_status "No critical errors in recent logs"
    elif [ "$error_count" -lt 5 ]; then
        print_warning "$error_count errors found in recent logs"
    else
        print_error "$error_count errors found in recent logs (investigation required)"
    fi
}

# Check network connectivity
check_network() {
    echo "Checking network connectivity..."
    
    # Check external connectivity
    if ping -c 1 8.8.8.8 > /dev/null 2>&1; then
        print_status "External network connectivity OK"
    else
        print_error "External network connectivity failed"
    fi
    
    # Check DNS resolution
    if nslookup google.com > /dev/null 2>&1; then
        print_status "DNS resolution OK"
    else
        print_error "DNS resolution failed"
    fi
}

# Generate health report
generate_report() {
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local report_file="health_report_$(date +%Y%m%d_%H%M%S).txt"
    
    echo "=== ISO Audit System Health Report ===" > "$report_file"
    echo "Generated: $timestamp" >> "$report_file"
    echo "" >> "$report_file"
    
    # Redirect all output to both console and file
    exec > >(tee -a "$report_file")
}

# Main health check function
main() {
    echo "=== ISO Audit System Health Check ==="
    echo "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
    echo ""
    
    local checks_passed=0
    local total_checks=0
    
    # Run all health checks
    check_docker_services && ((checks_passed++))
    ((total_checks++))
    echo ""
    
    check_service "Backend API" "$HEALTH_CHECK_URL" && ((checks_passed++))
    ((total_checks++))
    echo ""
    
    check_service "Frontend" "$FRONTEND_URL" && ((checks_passed++))
    ((total_checks++))
    echo ""
    
    check_service "Grafana" "$GRAFANA_URL" && ((checks_passed++))
    ((total_checks++))
    echo ""
    
    check_service "Prometheus" "$PROMETHEUS_URL" && ((checks_passed++))
    ((total_checks++))
    echo ""
    
    check_database && ((checks_passed++))
    ((total_checks++))
    echo ""
    
    check_system_resources && ((checks_passed++))
    ((total_checks++))
    echo ""
    
    check_ssl_certificates && ((checks_passed++))
    ((total_checks++))
    echo ""
    
    check_backup_status && ((checks_passed++))
    ((total_checks++))
    echo ""
    
    check_logs && ((checks_passed++))
    ((total_checks++))
    echo ""
    
    check_network && ((checks_passed++))
    ((total_checks++))
    echo ""
    
    # Summary
    echo "=== Health Check Summary ==="
    echo "Checks passed: $checks_passed/$total_checks"
    
    if [ "$checks_passed" -eq "$total_checks" ]; then
        print_status "All health checks passed - System is healthy"
        exit 0
    elif [ "$checks_passed" -gt $((total_checks * 70 / 100)) ]; then
        print_warning "Most health checks passed - System has minor issues"
        exit 1
    else
        print_error "Multiple health checks failed - System requires attention"
        exit 2
    fi
}

# Run main function
main "$@"