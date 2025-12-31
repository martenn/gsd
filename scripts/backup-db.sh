#!/bin/bash
#
# GSD Database Backup Script
# Creates compressed PostgreSQL backups and manages retention
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="$PROJECT_ROOT/backups"
DATE=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/gsd-$DATE.sql"
KEEP_DAYS=7

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

echo "========================================="
echo "GSD Database Backup"
echo "========================================="
echo ""
echo "Backup directory: $BACKUP_DIR"
echo "Backup file:      gsd-$DATE.sql.gz"
echo ""

# Create backup
echo "Creating database backup..."
cd "$PROJECT_ROOT"

if ! docker compose exec -T postgres pg_dump -U gsd_user gsd > "$BACKUP_FILE"; then
    echo "ERROR: Database backup failed!"
    rm -f "$BACKUP_FILE"
    exit 1
fi

# Compress backup
echo "Compressing backup..."
gzip "$BACKUP_FILE"

# Calculate size
BACKUP_SIZE=$(du -h "$BACKUP_FILE.gz" | cut -f1)
echo "Backup created: $BACKUP_FILE.gz ($BACKUP_SIZE)"

# Delete old backups
echo ""
echo "Cleaning up old backups (keeping last $KEEP_DAYS days)..."
DELETED_COUNT=$(find "$BACKUP_DIR" -name "gsd-*.sql.gz" -mtime +$KEEP_DAYS -delete -print | wc -l)
echo "Deleted $DELETED_COUNT old backup(s)"

# List current backups
echo ""
echo "Current backups:"
ls -lh "$BACKUP_DIR"/gsd-*.sql.gz 2>/dev/null || echo "  (none)"

echo ""
echo "Backup completed successfully!"
echo ""
