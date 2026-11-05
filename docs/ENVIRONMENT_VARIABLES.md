# Environment Variables

This document describes the environment variables used in the Dott.it Workspace application.

## Base URL Configuration

### Production Environment

- **`VERCEL_URL`**: Automatically set by Vercel deployment platform
  - Used for server-side API calls in production
  - Falls back to `dott-it-workspace.vercel.app` if not set
  - Example: `https://dott-it-workspace.vercel.app`

### Development Environment

- **`NEXT_PUBLIC_BASE_URL`**: Optional custom base URL for development
  - Can be set to override the default localhost URL
  - Falls back to `http://localhost:3000` if not set
  - Example: `http://localhost:3000` or `http://localhost:3001`

### Usage

The base URL configuration is used in server-side components that need to make API calls:

```typescript
const baseUrl =
  process.env.NODE_ENV === 'production'
    ? `https://${process.env.VERCEL_URL || 'dott-it-workspace.vercel.app'}`
    : process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
```

### Files Using Base URL

- `app/workspace/assessments/[id]/page.tsx` - Assessment detail page (server component)
- `components/assignment-dialog.tsx` - Assessment submission links
- `scripts/seed-database.ts` - Database seeding with domain configuration
- `tests/openscied-grade8-library.test.js` - Test base URL configuration

### Client Components

Client components use relative URLs for API calls, which are automatically resolved by the browser:

```typescript
const response = await fetch('/api/assessments')
```

## Database Configuration

- **`DATABASE_URL`**: Prisma database connection string
- **`DIRECT_URL`**: Direct database connection for migrations

## Authentication

- **`NEXTAUTH_SECRET`**: Secret for NextAuth.js
- **`NEXTAUTH_URL`**: Base URL for NextAuth.js
- **`PREVIEW_LOGIN_EMAIL`**: Optional email for password login on Vercel preview deployments and local development
- **`PREVIEW_LOGIN_PASSWORD`**: Optional password for preview/local password login
- **`PREVIEW_LOGIN_NAME`**: Optional display name for the preview login user

## Google Forms (sync / digitize)

- **`GOOGLE_FORMS_IMPERSONATE_USER`**: Workspace user the service account impersonates for Forms API (domain-wide delegation). Used by digitize, learner-name refresh, and backoffice **Sync responses** (`POST /api/assessments/[id]/sync-responses`).
  - Production Forms are typically shared with **`forms-access@demo.dott.it`**. Set this env (and SA DWD) to that account so pull/sync can read responses.
  - Local digitize defaults may use `forms@demo.dott.it` — that is a different account; Forms shared only with `forms-access@` will 403 if this env does not match.
- **`GOOGLE_SERVICE_ACCOUNT_JSON`** / **`GOOGLE_APPLICATION_CREDENTIALS`**: Service account credentials for Forms/Drive (see `lib/library/export/load-google-service-account-credentials.ts`).

## Scheduled jobs (Vercel Cron)

- **`CRON_SECRET`**: Bearer token required by cron routes (e.g. first programmatic thematic analysis). Vercel Cron sends `Authorization: Bearer <CRON_SECRET>` when invoking scheduled paths. Set the same value in the Vercel project environment and in `.env.local` for manual testing:

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  http://localhost:3000/api/cron/thematic-analysis-first-run
```

- **`THEMATIC_CRON_MAX_ASSESSMENTS`** (optional): Safety cap on how many eligible assessments a single cron run processes. Omit to process all eligible assessments until the function time limit is reached.

## Deployment

- **`VERCEL_URL`**: Automatically set by Vercel
- **`VERCEL_ENV`**: Automatically set by Vercel. Preview login is enabled when this is `preview`.
- **`NODE_ENV`**: Set to `production` in production environments

## Preview Login Environment Setup

Preview login is intended for Vercel preview deployments and for local testing of those previews. It is enabled only when all of the following are true:

- `PREVIEW_LOGIN_EMAIL` is set.
- `PREVIEW_LOGIN_PASSWORD` is set.
- Either `VERCEL_ENV=preview` or `NODE_ENV=development`.

For Vercel previews, store `PREVIEW_LOGIN_EMAIL`, `PREVIEW_LOGIN_PASSWORD`, `PREVIEW_LOGIN_NAME`, and `NEXTAUTH_SECRET` in the Vercel preview environment. Neon is configured to create child branches for preview deployments, and `scripts/vercel-build.sh` runs `scripts/configure-neon-preview-env.mjs` before Prisma generate and migration commands. That script resolves the child branch endpoint and exports both database URLs:

- `DATABASE_URL` for the assessment database.
- `USER_DATABASE` for the user database.

For local preview-login testing, create or refresh `.env.preview.local` with the same values used by the preview deployment:

```env
VERCEL_ENV=preview
NEXTAUTH_SECRET="your-preview-secret"
NEXTAUTH_URL="http://localhost:3000"
PREVIEW_LOGIN_EMAIL="teacher@demo.dott.it"
PREVIEW_LOGIN_PASSWORD="use-a-long-random-password"
PREVIEW_LOGIN_NAME="Preview User"
DATABASE_URL="postgresql://..."
USER_DATABASE="postgresql://..."
```

Run the local server with the preview environment loaded. If `.env.local` contains stale values, especially `DATABASE_URL`, `USER_DATABASE`, or a missing `NEXTAUTH_SECRET`, it can override or conflict with the preview setup and cause login to fail before the workspace loads. Move `.env.local` aside while testing preview login, then restore it afterward:

```sh
mv .env.local /tmp/dott-it-workspace.env.local.backup
set -a
source .env.preview.local
set +a
pnpm dev
mv /tmp/dott-it-workspace.env.local.backup .env.local
```

Do not commit `.env.preview.local`, `.env.local`, or any file containing preview passwords or database URLs.

## Local Development Setup

1. Create a `.env.local` file in the project root
2. Add the following variables:

```env
# Optional: Override default localhost URL
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# Test configuration
TEST_BASE_URL=http://localhost:3000

# Submission domain for assessment links
NEXT_PUBLIC_SUBMISSION_DOMAIN=opensci.ed

# Domain configuration for seeding
DEMO_DOMAIN=demo.dott.it
DEV_DOMAIN=demo.dott.it

# Database
DATABASE_URL="your-database-url"
DIRECT_URL="your-direct-database-url"

# Authentication
NEXTAUTH_SECRET="your-secret"
NEXTAUTH_URL="http://localhost:3000"

# Cron (thematic analysis first run)
CRON_SECRET="your-cron-secret"

# Vercel preview-only login
PREVIEW_LOGIN_EMAIL="teacher@demo.dott.it"
PREVIEW_LOGIN_PASSWORD="use-a-long-random-password"
PREVIEW_LOGIN_NAME="Preview User"

# Demo Mode (optional)
DEMO_MODE=true
DEMO_MODE_MESSAGE="This is a demo environment. All data is for demonstration purposes only."
DEMO_READ_ONLY=false
DEMO_ASSESSMENT_ID="8-6-lesson-11-green-anole-lizard-explanation"
DEMO_TENANT_ID="demo"
```

## Testing

The base URL configuration is tested in `tests/base-url-config.test.js` to ensure:

- VERCEL_URL is used in production
- Proper fallbacks are in place
- No hardcoded incorrect URLs exist

## Additional Environment Variables

### Test Configuration

- **`TEST_BASE_URL`**: Base URL for running tests (defaults to `http://localhost:3000`)

### Submission Configuration

- **`NEXT_PUBLIC_SUBMISSION_DOMAIN`**: Domain for assessment submission links (defaults to `opensci.ed`)

### Demo Mode Configuration

- **`DEMO_MODE`**: Enable demo mode when set to 'true'

  - Shows demo banner and indicators
  - Enables anonymous access
  - Uses mock data and sample assessments
  - Example: `DEMO_MODE=true`

- **`DEMO_MODE_MESSAGE`**: Custom message for demo mode banner

  - Defaults to "This is a demo environment. All data is for demonstration purposes only."
  - Example: `DEMO_MODE_MESSAGE="Welcome to our demo environment!"`

- **`DEMO_READ_ONLY`**: Enable read-only mode in demo

  - Prevents data modifications when set to 'true'
  - Example: `DEMO_READ_ONLY=true`

- **`DEMO_ASSESSMENT_ID`**: Default assessment ID for demo mode

  - Defaults to '8-6-lesson-11-green-anole-lizard-explanation'
  - Example: `DEMO_ASSESSMENT_ID=your-demo-assessment-id`

- **`DEMO_TENANT_ID`**: Tenant ID for demo mode
  - Defaults to 'demo'
  - Example: `DEMO_TENANT_ID=demo-tenant`

# Domain Configuration

- **`DEMO_DOMAIN`**: Domain for demo environment (defaults to `demo.dott.it`)
- **`DEV_DOMAIN`**: Domain for development environment (defaults to `demo.dott.it`)
