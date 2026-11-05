# Setup Instructions

## Environment Variables

This application requires a Neon database connection. Follow these steps to set it up:

### 1. Create a Neon Database

1. Go to [https://neon.tech](https://neon.tech) and sign up for a free account
2. Create a new project
3. Copy your database connection string

### 2. Configure Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```bash
# Database Configuration
DATABASE_URL=your-neon-database-url-here
POSTGRES_URL=your-neon-database-url-here

# Application Configuration
# No authentication required

# Optional: OAuth Providers
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 3. Install Dependencies

```bash
pnpm install
```

### 4. Run the Development Server

```bash
pnpm dev
```

### 5. Lint and Test

Before committing code, run the following commands to ensure linting and tests pass:

```bash
pnpm lint
pnpm test
```

The tests are designed to run offline. To include the optional network
accessibility checks, run:

```bash
TEST_ONLINE=1 pnpm test
```

## Application Features

The application provides:

- **Credentials**: In local development, use a database-backed user with a password. In Vercel preview deployments, set `PREVIEW_LOGIN_EMAIL` and `PREVIEW_LOGIN_PASSWORD` on the Preview environment to enable preview-only password login.
- **Google OAuth**: Enabled only for production builds when valid credentials are provided.

## Database Schema

If you need to set up database tables, you can use the following SQL:

```sql
-- Example users table
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  password VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Troubleshooting

### "No database connection string was provided" Error

This error occurs when the DATABASE_URL or POSTGRES_URL environment variables are not set. Make sure:

1. You have created a `.env.local` file
2. The file contains valid database URLs
3. You have restarted the development server after adding the environment variables

### Authentication Errors

If you're getting authentication errors:

1. No authentication setup required
2. The application works without authentication
3. Check that your OAuth provider credentials are correct (if using social login)
