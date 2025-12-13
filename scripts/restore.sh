#!/bin/bash

# Production Database Restore Script
# Usage: ./restore.sh <backup_file>

set -e

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file>"
    echo "Example: $0 audit_db_backup_20241213_120000.sql.gz"
    exit 1
fi

BACKUP_FILE=$1
BACKUP_DIR="/backups"
FULL_PATH="${BACKUP_DIR}/${BACKUP_FILE}"

# Database connection parameters
DB_HOST=${POSTGRES_HOST:-db}
DB_PORT=${POSTGRES_PORT:-5432}
DB_NAME=${POSTGRES_DB}
DB_USER=${POSTGRES_USER}

# Verify backup file exists
if [ ! -f "${FULL_PATH}" ]; then
    echo "ERROR: Backup file not found: ${FULL_PATH}"
    exit 1
fi

echo "Starting database restore from ${BACKUP_FILE} at $(date)"

# Create a pre-restore backup
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
PRE_RESTORE_BACKUP="pre_restore_backup_${TIMESTAMP}.sql.gz"

echo "Creating pre-restore backup: ${PRE_RESTORE_BACKUP}"
PGPASSWORD=${POSTGRES_PASSWORD} pg_dump \
    -h ${DB_HOST} \
    -p ${DB_PORT} \
    -U ${DB_USER} \
    -d ${DB_NAME} \
    --verbose \
    --clean \
    --no-owner \
    --no-privileges \
    --format=plain | gzip > ${BACKUP_DIR}/${PRE_RESTORE_BACKUP}

# Restore from backup
echo "Restoring database from backup..."

if [[ ${BACKUP_FILE} == *.gz ]]; then
    # Compressed backup
    gunzip -c ${FULL_PATH} | PGPASSWORD=${POSTGRES_PASSWORD} psql \
        -h ${DB_HOST} \
        -p ${DB_PORT} \
        -U ${DB_USER} \
        -d ${DB_NAME} \
        --verbose
else
    # Uncompressed backup
    PGPASSWORD=${POSTGRES_PASSWORD} psql \
        -h ${DB_HOST} \
        -p ${DB_PORT} \
        -U ${DB_USER} \
        -d ${DB_NAME} \
        --verbose \
        -f ${FULL_PATH}
fi

# Verify restore
echo "Verifying database restore..."
PGPASSWORD=${POSTGRES_PASSWORD} psql \
    -h ${DB_HOST} \
    -p ${DB_PORT} \
    -U ${DB_USER} \
    -d ${DB_NAME} \
    -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';"

echo "Database restore completed successfully at $(date)"
echo "Pre-restore backup saved as: ${PRE_RESTORE_BACKUP}"

exit 0