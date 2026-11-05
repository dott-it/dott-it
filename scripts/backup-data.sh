#!/bin/bash

# Script to backup data before migration
# This script exports any important data that might be lost during migration

set -e

echo "💾 Creating data backup before migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    echo "Please set your DATABASE_URL and run this script again"
    exit 1
fi

# Create backup directory
BACKUP_DIR="backup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📁 Backup directory: $BACKUP_DIR"

# Export Member table data if it exists
echo "📋 Exporting Member table data..."
psql "$DATABASE_URL" -c "\COPY (SELECT * FROM \"Member\") TO '$BACKUP_DIR/member_data.csv' CSV HEADER;" 2>/dev/null || echo "Member table doesn't exist or is empty"

# Export TeamMember data with memberId if it exists
echo "📋 Exporting TeamMember data..."
psql "$DATABASE_URL" -c "\COPY (SELECT * FROM \"TeamMember\") TO '$BACKUP_DIR/team_member_data.csv' CSV HEADER;" 2>/dev/null || echo "TeamMember table doesn't exist or is empty"

# Export all other important tables
echo "📋 Exporting other table data..."
psql "$DATABASE_URL" -c "\COPY (SELECT * FROM \"Tenant\") TO '$BACKUP_DIR/tenant_data.csv' CSV HEADER;" 2>/dev/null || echo "Tenant table doesn't exist or is empty"
psql "$DATABASE_URL" -c "\COPY (SELECT * FROM \"Teacher\") TO '$BACKUP_DIR/teacher_data.csv' CSV HEADER;" 2>/dev/null || echo "Teacher table doesn't exist or is empty"
psql "$DATABASE_URL" -c "\COPY (SELECT * FROM \"Team\") TO '$BACKUP_DIR/team_data.csv' CSV HEADER;" 2>/dev/null || echo "Team table doesn't exist or is empty"
psql "$DATABASE_URL" -c "\COPY (SELECT * FROM \"Learner\") TO '$BACKUP_DIR/learner_data.csv' CSV HEADER;" 2>/dev/null || echo "Learner table doesn't exist or is empty"

echo "✅ Backup completed in $BACKUP_DIR"
echo "📝 Review the backup files before proceeding with migration" 