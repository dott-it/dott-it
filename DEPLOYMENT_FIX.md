# Deployment Fix Guide

## Issue Summary

Your Vercel deployment is failing due to Prisma database migration issues. The error indicates that there are schema mismatches between your current Prisma schema and the database:

1. **Member table exists** in the database but not in your schema (3 rows)
2. **memberId column exists** in TeamMember table but not in your schema (4 non-null values)
3. **Unique constraint** needs to be added on `[teamId, teacherId]`

## Root Cause

The database contains an older schema version that includes:

- A `Member` table (3 rows)
- A `memberId` column in `TeamMember` table (4 non-null values)

Your current schema has been updated to remove these elements, but the database hasn't been migrated.

## Solutions

### Option 1: Quick Fix (Recommended for Production)

Update your Vercel configuration to force reset the database during migration:

```json
{
  "buildCommand": "prisma generate && prisma db push --force-reset && pnpm db:seed && next build",
  "installCommand": "pnpm install",
  "framework": "nextjs"
}
```

**This has already been applied to your `vercel.json` file.**

⚠️ **Warning:** This will reset your database and lose all existing data. Only use this if you're okay with losing the current data.

### Option 2: Safe Migration (Recommended for Development)

1. **Backup existing data:**

   ```bash
   ./scripts/backup-data.sh
   ```

2. **Run the safe migration locally:**

   ```bash
   ./scripts/migrate-safely.sh
   ```

3. **Deploy to Vercel:**
   ```bash
   vercel --prod
   ```

### Option 3: Manual Database Reset (Nuclear Option)

If you don't need to preserve any existing data:

1. **Reset the database:**

   ```bash
   npx prisma db push --force-reset
   ```

2. **Seed the database:**

   ```bash
   pnpm db:seed
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

## Migration Files Created

### 1. `prisma/migrations/20250101000000_fix_required_columns/migration.sql`

This migration safely handles:

- Dropping the `Member` table if it exists
- Removing the `memberId` column from `TeamMember` if it exists
- Adding the unique constraint on `[teamId, teacherId]`

### 2. `scripts/backup-data.sh`

Backup script to preserve any important data before migration.

### 3. `scripts/migrate-safely.sh`

Safe migration script that handles required columns with proper defaults.

## Next Steps

1. **For immediate deployment:** The `vercel.json` has been updated with `--force-reset` flag
2. **For safe migration:** Run the backup script first, then the safe migration script
3. **Deploy:** Push your changes to trigger a new Vercel deployment

## Data Loss Assessment

Based on the error message:

- **Member table:** 3 rows (likely test data)
- **TeamMember memberId column:** 4 non-null values (likely test data)

If this is production data you need to preserve, use Option 2. If this is test data or you're okay with losing it, use Option 1.

## Verification

After deployment, verify that:

1. The application builds successfully
2. Database connections work
3. All functionality is preserved
4. No data loss occurred (if using Option 2)

## Rollback Plan

If issues occur:

1. Restore from backup files (if using Option 2)
2. Revert `vercel.json` changes
3. Contact support if needed
