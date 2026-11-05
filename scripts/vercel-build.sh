#!/bin/bash

# Exit immediately if a command exits with a non-zero status.
set -e

# Run Prisma Generate for both schemas
echo "Running prisma generate..."

# Generate Assessment Client
prisma generate --schema=prisma/assessment/schema.prisma

# Generate User Client
prisma generate --schema=prisma/user/schema.prisma

# Temporarily skip migrate on Vercel: Neon pooled DATABASE_URL causes P1002
# advisory-lock timeouts and blocks production deploys (e.g. name-fix #405)
# even when there are no pending migrations.
# Re-enable with RUN_PRISMA_MIGRATE=1, or after wiring Neon directUrl (#406).
if [ "${RUN_PRISMA_MIGRATE:-}" = "1" ]; then
  echo "Running prisma migrate deploy (RUN_PRISMA_MIGRATE=1)..."

  STUCK_ASSESSMENT_MIGRATION="20260803160000_assessment_tenant_google_form_unique"

  # Preview/prod can be stuck on P3009 if an earlier unique-index attempt failed mid-way.
  # Mark that migration rolled back once, then retry with the fixed SQL.
  set +e
  ASSESSMENT_MIGRATE_OUTPUT="$(prisma migrate deploy --schema=prisma/assessment/schema.prisma 2>&1)"
  ASSESSMENT_MIGRATE_STATUS=$?
  set -e
  printf '%s\n' "$ASSESSMENT_MIGRATE_OUTPUT"

  if [ "$ASSESSMENT_MIGRATE_STATUS" -ne 0 ]; then
    # Escape hatch only for Vercel preview deploys stuck on P3009 from an earlier
    # failed unique-index attempt. Never auto-resolve on production.
    if [ "${VERCEL_ENV:-}" = "preview" ] \
      && printf '%s\n' "$ASSESSMENT_MIGRATE_OUTPUT" | grep -q "P3009" \
      && printf '%s\n' "$ASSESSMENT_MIGRATE_OUTPUT" | grep -q "$STUCK_ASSESSMENT_MIGRATION"; then
      echo "Preview: resolving failed migration ${STUCK_ASSESSMENT_MIGRATION} as rolled-back, then retrying deploy..."
      prisma migrate resolve --rolled-back "${STUCK_ASSESSMENT_MIGRATION}" --schema=prisma/assessment/schema.prisma
      prisma migrate deploy --schema=prisma/assessment/schema.prisma
    else
      exit "$ASSESSMENT_MIGRATE_STATUS"
    fi
  fi

  # Deploy User Schema
  prisma migrate deploy --schema=prisma/user/schema.prisma
else
  echo "Skipping prisma migrate deploy (P1002 workaround)."
  echo "Set RUN_PRISMA_MIGRATE=1 to run migrations during build."
fi

# Run the Next.js build
echo "Running next build..."
next build
