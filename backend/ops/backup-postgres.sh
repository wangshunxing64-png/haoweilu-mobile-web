#!/bin/sh
set -eu

BACKUP_DIR="${BACKUP_DIR:-./backups}"
POSTGRES_USER="${POSTGRES_USER:-ai_review}"
POSTGRES_DB="${POSTGRES_DB:-ai_review}"
TIMESTAMP="$(date '+%Y%m%d-%H%M%S')"
mkdir -p "$BACKUP_DIR"

docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" \
  | gzip > "$BACKUP_DIR/ai-review-$TIMESTAMP.sql.gz"

echo "Backup written to $BACKUP_DIR/ai-review-$TIMESTAMP.sql.gz"
