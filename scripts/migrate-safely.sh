#!/bin/bash

# Safe migration script that handles required columns with proper defaults
# This script migrates the database without losing data

set -e

echo "🔧 Starting safe database migration..."

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL environment variable is not set"
    exit 1
fi

echo "📋 Step 1: Creating backup..."
./scripts/backup-data.sh

echo "📋 Step 2: Running custom migration..."
psql "$DATABASE_URL" -f prisma/migrations/20250101000000_fix_required_columns/migration.sql

echo "📋 Step 3: Generating Prisma client..."
npx prisma generate

echo "📋 Step 4: Pushing schema changes..."
npx prisma db push

echo "📋 Step 5: Seeding database..."
pnpm db:seed

echo "📋 Step 6: Building application..."
next build

echo "✅ Migration completed successfully!" 