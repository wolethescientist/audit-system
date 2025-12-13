#!/bin/bash

# Production Database Backup Script
# This script creates automated backups with retention policy for ISO compliance

set -e

# Configuration
BACKUP_DIR="/backups"
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-30}
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="audit_db_backup_${TIMESTAMP}.sql"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# Database connection parameters
DB_HOST=${POSTGRES_HOST:-db}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB}
DB_USER=${POSTGRES_USER}

# Create backup directory if it doesn't exist
mkdir -p ${BACKUP_DIR}

echo "Starting database backup at $(date)"

# Create database backup
PGPASSWORD=${POSTGRES_PASSWORD} pg_dump \
    -h ${DB_HOST} \
    -p ${DB_PORT} \
    -U ${DB_USER} \
    -d ${DB_NAME} \
    --verbose \
    --clean \
    --no-owner \
    --no-privileges \
    --format=plain \
    > ${BACKUP_DIR}/${BACKUP_FILE}

# Compress the backup
gzip ${BACKUP_DIR}/${BACKUP_FILE}

# Verify backup integrity
if [ -f "${BACKUP_DIR}/${COMPRESSED_FILE}" ]; then
    echo "Backup created successfully: ${COMPRESSED_FILE}"
    
    # Test backup integrity
    gunzip -t ${BACKUP_DIR}/${COMPRESSED_FILE}
    if [ $? -eq 0 ]; then
        echo "Backup integrity verified"
    else
        echo "ERROR: Backup integrity check failed"
        exit 1
    fi
else
    echo "ERROR: Backup file not created"
    exit 1
fi

# Create backup metadata
cat > ${BACKUP_DIR}/${TIMESTAMP}_metadata.json << EOF
{
    "timestamp": "${TIMESTAMP}",
    "database": "${DB_NAME}",
    "backup_file": "${COMPRESSED_FILE}",
    "size_bytes": $(stat -c%s ${BACKUP_DIR}/${COMPRESSED_FILE}),
    "created_at": "$(date -Iseconds)",
    "retention_until": "$(date -d "+${RETENTION_DAYS} days" -Iseconds)",
    "backup_type": "full",
    "compression": "gzip"
}
EOF

# Clean up old backups (retention policy)
echo "Cleaning up backups older than ${RETENTION_DAYS} days"
find ${BACKUP_DIR} -name "audit_db_backup_*.sql.gz" -mtime +${RETENTION_DAYS} -delete
find ${BACKUP_DIR} -name "*_metadata.json" -mtime +${RETENTION_DAYS} -delete

# Log backup completion
echo "Database backup completed successfully at $(date)"

# Optional: Send notification (uncomment if email is configured)
# echo "Database backup completed: ${COMPRESSED_FILE}" | mail -s "Audit System Backup Success" ${ADMIN_EMAIL}

exit 0