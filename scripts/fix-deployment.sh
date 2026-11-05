#!/bin/bash

# Script to fix deployment issues with Prisma migrations
# This script handles the data loss warnings during deployment

set -e

echo "🔧 Fixing deployment issues..."

# Generate Prisma client
echo "📦 Generating Prisma client..."
npx prisma generate

# Push schema changes with data loss accepted
echo "🗄️  Pushing database schema changes..."
npx prisma db push --accept-data-loss

# Seed the database
echo "🌱 Seeding database..."
pnpm db:seed

# Build the application
echo "🏗️  Building application..."
next build

echo "✅ Deployment fix completed successfully!" 