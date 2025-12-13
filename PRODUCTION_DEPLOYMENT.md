# Production Deployment Guide

## ISO Audit System - Production Environment Setup

This guide provides comprehensive instructions for deploying the ISO Audit System in a production environment with full ISO 27001 compliance, monitoring, and disaster recovery capabilities.

## Prerequisites

### System Requirements
- **Operating System**: Linux (Ubuntu 20.04+ recommended) or Windows Server 2019+
- **CPU**: Minimum 4 cores, 8 cores recommended
- **RAM**: Minimum 8GB, 16GB recommended
- **Storage**: Minimum 100GB SSD, 500GB recommended
- **Network**: Stable internet connection with static IP

### Software Requirements
- Docker Engine 20.10+
- Docker Compose 2.0+
- OpenSSL (for SSL certificate generation)
- Cron (for automated backups)
- Git (for deployment)

## Pre-Deployment Checklist

### 1. Environment Configuration
```bash
# Clone the repository
git clone <repository-url>
cd iso-audit-system

# Copy and configure environment file
cp .env.prod .env

# Edit .env with your production values
nano .env
```

### 2. Required Environment Variables
Update the following variables in `.env`:

```bash
# Database Configuration
DATABASE_URL=postgresql://audit_user:SECURE_PASSWORD@db:5432/audit_db
POSTGRES_USER=audit_user
POSTGRES_PASSWORD=SECURE_PASSWORD_HERE
POSTGRES_DB=audit_db

# JWT Security (Generate secure keys)
JWT_SECRET_KEY=GENERATE_SECURE_32_CHAR_KEY_HERE
JWT_ALGORITHM=HS256
JWT_EXPIRATION_MINUTES=1440

# GEMINI AI Configuration
GEMINI_API_KEY=your-actual-gemini-api-key
GEMINI_MODEL=gemini-1.5-pro

# Domain Configuration
NEXT_PUBLIC_API_URL=https://your-domain.com

# Monitoring
GRAFANA_PASSWORD=secure_grafana_password

# Email Configuration (for alerts)
SMTP_HOST=smtp.your-provider.com
SMTP_PORT=587
SMTP_USERNAME=your-email@domain.com
SMTP_PASSWORD=your-email-password
SMTP_FROM_EMAIL=audit-system@your-domain.com
```

### 3. SSL Certificate Setup

#### Option A: Let's Encrypt (Recommended for production)
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# Generate certificates
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

#### Option B: Self-signed (Development/Testing only)
```bash
# Generate self-signed certificates
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout nginx/ssl/key.pem \
    -out nginx/ssl/cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=your-domain.com"
```

### 4. Domain Configuration
Update `nginx/nginx.conf` with your actual domain:
```nginx
server_name your-domain.com www.your-domain.com;
```

## Deployment Process

### 1. Pre-Deployment Verification
```bash
# Verify build compatibility (Linux/Mac)
chmod +x scripts/verify_build.sh
./scripts/verify_build.sh

# Or on Windows
scripts/verify_build.bat
```

### 2. Automated Deployment
```bash
# Make deployment script executable (Linux/Mac)
chmod +x deploy.sh

# Run deployment
./deploy.sh production

# Or on Windows
deploy.bat production
```

### 2. Manual Deployment Steps
If you prefer manual deployment:

```bash
# Create necessary directories
mkdir -p logs/nginx backups nginx/ssl monitoring/grafana/{dashboards,datasources}

# Set permissions
chmod +x scripts/backup.sh scripts/restore.sh

# Copy environment file
cp .env.prod .env

# Deploy services
docker-compose -f docker-compose.prod.yml up -d --build

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend alembic upgrade head

# Verify deployment
docker-compose -f docker-compose.prod.yml ps
```

## Post-Deployment Configuration

### 1. Database Setup
```bash
# Create initial admin user (run inside backend container)
docker-compose -f docker-compose.prod.yml exec backend python -c "
from app.database import SessionLocal
from app.models import User
from app.auth import get_password_hash
import uuid

db = SessionLocal()
admin_user = User(
    id=uuid.uuid4(),
    username='admin',
    email='admin@your-domain.com',
    hashed_password=get_password_hash('secure_admin_password'),
    is_active=True,
    role='admin'
)
db.add(admin_user)
db.commit()
print('Admin user created successfully')
"
```

### 2. GEMINI AI Configuration
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Update `GEMINI_API_KEY` in your `.env` file
4. Restart the backend service:
```bash
docker-compose -f docker-compose.prod.yml restart backend
```

### 3. Monitoring Setup
Access monitoring dashboards:
- **Grafana**: http://your-domain:3001 (admin / your_grafana_password)
- **Prometheus**: http://your-domain:9090

Import pre-configured dashboards in Grafana for system monitoring.

### 4. Backup Configuration
Automated backups are configured to run daily at 2 AM. Verify the cron job:
```bash
crontab -l | grep backup
```

Manual backup:
```bash
docker-compose -f docker-compose.prod.yml run --rm backup
```

## Security Configuration

### 1. Firewall Setup
```bash
# Allow only necessary ports
sudo ufw allow 22    # SSH
sudo ufw allow 80    # HTTP (redirects to HTTPS)
sudo ufw allow 443   # HTTPS
sudo ufw allow 3001  # Grafana (restrict to admin IPs)
sudo ufw allow 9090  # Prometheus (restrict to admin IPs)
sudo ufw enable
```

### 2. ISO 27001 Compliance Features
The system includes the following ISO 27001 compliance features:
- **A.12.4.1**: Comprehensive audit logging
- **A.12.4.2**: Log integrity protection
- **A.12.4.3**: Administrator activity monitoring
- **A.9.1.2**: Network access controls
- **A.10.1.1**: Cryptographic controls (TLS 1.3, AES-256)

### 3. Regular Security Updates
```bash
# Update system packages
sudo apt-get update && sudo apt-get upgrade

# Update Docker images
docker-compose -f docker-compose.prod.yml pull
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring and Alerting

### 1. Health Checks
The system provides multiple health check endpoints:
- **Basic Health**: `https://your-domain.com/health`
- **System Status**: `https://your-domain.com/api/v1/system/status`
- **Performance**: `https://your-domain.com/api/v1/system/performance`

### 2. Alert Configuration
Alerts are configured for:
- High CPU usage (>80%)
- High memory usage (>85%)
- High disk usage (>90%)
- Database connectivity issues
- API response time degradation
- Failed login attempts
- Backup failures
- SSL certificate expiry

### 3. Log Management
Logs are stored in the following locations:
- **Application Logs**: `./logs/`
- **Nginx Logs**: `./logs/nginx/`
- **Database Logs**: Docker container logs

View logs:
```bash
# Application logs
docker-compose -f docker-compose.prod.yml logs backend

# All services
docker-compose -f docker-compose.prod.yml logs

# Follow logs in real-time
docker-compose -f docker-compose.prod.yml logs -f
```

## Backup and Disaster Recovery

### 1. Backup Strategy
- **Frequency**: Daily automated backups at 2 AM
- **Retention**: 30 days (configurable)
- **Location**: `./backups/` directory
- **Format**: Compressed SQL dumps with metadata

### 2. Backup Verification
```bash
# List available backups
ls -la backups/

# Verify backup integrity
gunzip -t backups/audit_db_backup_YYYYMMDD_HHMMSS.sql.gz
```

### 3. Disaster Recovery
```bash
# Stop services
docker-compose -f docker-compose.prod.yml down

# Restore from backup
./scripts/restore.sh audit_db_backup_YYYYMMDD_HHMMSS.sql.gz

# Start services
docker-compose -f docker-compose.prod.yml up -d
```

### 4. Data Migration
For migrating to a new server:
```bash
# On old server - create backup
docker-compose -f docker-compose.prod.yml run --rm backup

# Copy backup to new server
scp backups/latest_backup.sql.gz user@new-server:/path/to/backups/

# On new server - restore
./scripts/restore.sh latest_backup.sql.gz
```

## Performance Optimization

### 1. Database Optimization
```sql
-- Run these queries periodically for maintenance
VACUUM ANALYZE;
REINDEX DATABASE audit_db;

-- Monitor slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### 2. Application Performance
- **Connection Pooling**: Configured in SQLAlchemy
- **Caching**: Redis for session and data caching
- **CDN**: Configure for static assets
- **Load Balancing**: Use nginx upstream for multiple backend instances

### 3. Scaling Considerations
For high-load environments:
```yaml
# Scale backend instances
docker-compose -f docker-compose.prod.yml up -d --scale backend=3

# Add read replicas for database
# Configure in docker-compose.prod.yml
```

## Troubleshooting

### 1. Common Issues

#### Services won't start
```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs

# Check disk space
df -h

# Check memory usage
free -h
```

#### Database connection issues
```bash
# Check database status
docker-compose -f docker-compose.prod.yml exec db pg_isready

# Check database logs
docker-compose -f docker-compose.prod.yml logs db
```

#### SSL certificate issues
```bash
# Verify certificate
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Check certificate expiry
openssl x509 -in nginx/ssl/cert.pem -noout -dates
```

### 2. Performance Issues
```bash
# Check system resources
docker stats

# Check database performance
docker-compose -f docker-compose.prod.yml exec db psql -U audit_user -d audit_db -c "
SELECT * FROM get_database_stats();
"
```

### 3. Emergency Procedures

#### Service Recovery
```bash
# Restart all services
docker-compose -f docker-compose.prod.yml restart

# Restart specific service
docker-compose -f docker-compose.prod.yml restart backend
```

#### Database Recovery
```bash
# Emergency database restore
./scripts/restore.sh latest_backup.sql.gz

# Check database integrity
docker-compose -f docker-compose.prod.yml exec db pg_dump --schema-only -U audit_user audit_db > schema_check.sql
```

## Maintenance Schedule

### Daily
- Monitor system health via Grafana dashboards
- Check backup completion
- Review security alerts

### Weekly
- Review performance metrics
- Update system packages
- Verify SSL certificate status

### Monthly
- Database maintenance (VACUUM, REINDEX)
- Security audit review
- Backup restoration test
- Update Docker images

### Quarterly
- Full security assessment
- Disaster recovery drill
- Performance optimization review
- Compliance audit

## Support and Documentation

### 1. System Documentation
- **API Documentation**: `https://your-domain.com/docs`
- **Admin Guide**: Available in the application
- **User Manual**: Accessible from the help section

### 2. Monitoring Dashboards
- **System Health**: Grafana dashboard
- **Application Metrics**: Built-in performance monitoring
- **Security Events**: Audit trail logs

### 3. Contact Information
For technical support and emergency response, maintain contact information for:
- System Administrator
- Database Administrator
- Security Team
- Infrastructure Team

## Compliance and Auditing

### ISO 27001 Compliance
The system maintains compliance with:
- **A.12.4**: Event logging
- **A.12.6**: Management of technical vulnerabilities
- **A.17.1**: Information security continuity
- **A.18.2**: Compliance with security policies

### Audit Trail
All system activities are logged with:
- User identification
- Timestamp
- Action performed
- Before/after values
- IP address
- Session information

### Regular Compliance Checks
- Monthly compliance reports
- Quarterly security assessments
- Annual penetration testing
- Continuous vulnerability monitoring

This deployment guide ensures a secure, scalable, and compliant production environment for the ISO Audit Management System.