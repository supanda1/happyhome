#!/bin/bash
# Database Backup Script for Happy Homes
# Runs pg_dump from the postgres container and keeps last 7 daily backups
#
# Usage: ./scripts/backup-db.sh
# Cron:  0 2 * * * /path/to/scripts/backup-db.sh >> /var/log/db-backup.log 2>&1

set -euo pipefail

BACKUP_DIR="/backups"
CONTAINER_NAME="myapp_db"
DB_NAME="household_services"
DB_USER="postgres"
RETENTION_DAYS=7
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/household_services_${TIMESTAMP}.sql.gz"

# Create backup directory if it doesn't exist
mkdir -p "${BACKUP_DIR}"

echo "[$(date)] Starting database backup..."

# Run pg_dump inside the container and compress
docker exec "${CONTAINER_NAME}" pg_dump -U "${DB_USER}" "${DB_NAME}" | gzip > "${BACKUP_FILE}"

if [ $? -eq 0 ] && [ -s "${BACKUP_FILE}" ]; then
    FILESIZE=$(du -h "${BACKUP_FILE}" | cut -f1)
    echo "[$(date)] Backup completed: ${BACKUP_FILE} (${FILESIZE})"
else
    echo "[$(date)] ERROR: Backup failed or file is empty"
    rm -f "${BACKUP_FILE}"
    exit 1
fi

# Remove backups older than retention period
echo "[$(date)] Removing backups older than ${RETENTION_DAYS} days..."
find "${BACKUP_DIR}" -name "household_services_*.sql.gz" -mtime +${RETENTION_DAYS} -delete

REMAINING=$(find "${BACKUP_DIR}" -name "household_services_*.sql.gz" | wc -l)
echo "[$(date)] Backup complete. ${REMAINING} backup(s) retained."
