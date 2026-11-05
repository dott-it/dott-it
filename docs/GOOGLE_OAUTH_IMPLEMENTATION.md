# Google OAuth Implementation Guide

This document explains how to implement real Google OAuth authentication in the Eddo Workspace application.

## Current Implementation

The current implementation includes:

- A `GoogleButton` component with the official Google logo
- A `useGoogleAuth` hook for managing Google authentication state
- Integration with the login page
- Mock authentication flow for demo purposes

## Files Created/Modified

### Components

- `app/v2/shared/components/ui/google-button.tsx` - Google sign-in button component
- `app/v2/shared/components/ui/index.ts` - Updated to export GoogleButton

### Hooks

- `app/v2/hooks/use-google-auth.ts` - Hook for Google authentication logic

### Pages

- `app/v2/(auth)/login/page.tsx` - Updated to include Google sign-in

### Tests

- `app/v2/__tests__/google-button.test.tsx` - Component tests
- `app/v2/__tests__/use-google-auth.test.tsx` - Hook tests
- `app/v2/__tests__/login-page-google.test.tsx` - Integration tests

## Real Google OAuth Implementation

To implement real Google OAuth, follow these steps:

### 1. Set up Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the Google+ API
4. Go to "Credentials" and create OAuth 2.0 Client ID
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google` (development)
   - `https://yourdomain.com/api/auth/callback/google` (production)

### 2. Install Required Dependencies

```bash
npm install next-auth @auth/core @auth/prisma-adapter
```

### 3. Configure NextAuth.js

Create `app/api/auth/[...nextauth]/route.ts`:

```typescript
import NextAuth from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import { PrismaAdapter } from '@auth/prisma-adapter'
import { prisma } from '@/lib/prisma'

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id
        session.user.role = user.role || 'teacher'
      }
      return session
    },
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role
      }
      return token
    },
  },
  pages: {
    signIn: '/v2/login',
  },
})

export { handler as GET, handler as POST }
```

### 4. Update Environment Variables

Add to `.env.local`:

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### 5. Update Database Schema

Add to `prisma/schema.prisma`:

```prisma
model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model User {
  id            String    @id @default(cuid())
  name          String?
  email         String?   @unique
  emailVerified DateTime?
  image         String?
  role          String    @default("teacher")
  accounts      Account[]
  sessions      Session[]
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
}
```

### 6. Update useGoogleAuth Hook

Replace the mock implementation with real NextAuth.js:

```typescript
import { signIn, signOut, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function useGoogleAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const signInWithGoogle = async () => {
    try {
      await signIn('google', { callbackUrl: '/v2/workspace' })
    } catch (error) {
      console.error('Google sign-in error:', error)
      throw error
    }
  }

  const signOutUser = async () => {
    await signOut({ callbackUrl: '/v2/login' })
  }

  return {
    signInWithGoogle,
    signOutUser,
    session,
    isLoading: status === 'loading',
    isAuthenticated: status === 'authenticated',
  }
}
```

### 7. Update Login Page

Replace the mock authentication with NextAuth.js:

```typescript
import { signIn } from 'next-auth/react'

// In the Google button click handler:
const handleGoogleSignIn = () => {
  signIn('google', { callbackUrl: '/v2/workspace' })
}
```

### 8. Add Session Provider

Wrap your app with SessionProvider in `app/v2/layout.tsx`:

```typescript
import { SessionProvider } from 'next-auth/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>
}
```

## Testing

The existing tests provide a good foundation. Update them to work with NextAuth.js:

1. Mock `next-auth/react` functions
2. Test session states
3. Verify redirect behavior
4. Test error handling

## Security Considerations

1. **Environment Variables**: Never commit secrets to version control
2. **HTTPS**: Use HTTPS in production
3. **CSRF Protection**: NextAuth.js handles this automatically
4. **Session Management**: Use secure session storage
5. **Rate Limiting**: Implement rate limiting for auth endpoints

## Migration from Mock to Real

1. Deploy the NextAuth.js configuration
2. Update environment variables
3. Run database migrations
4. Test the authentication flow
5. Remove mock authentication code
6. Update tests to use real authentication

## Troubleshooting

### Common Issues

1. **Redirect URI Mismatch**: Ensure redirect URIs match exactly
2. **CORS Issues**: Configure CORS for your domain
3. **Session Not Persisting**: Check NextAuth.js configuration
4. **Database Connection**: Verify Prisma adapter setup

### Debug Mode

Enable NextAuth.js debug mode:

```typescript
const handler = NextAuth({
  debug: true,
  // ... other config
})
```

## Resources

- [NextAuth.js Documentation](https://next-auth.js.org/)
- [Google OAuth 2.0 Documentation](https://developers.google.com/identity/protocols/oauth2)
- [Prisma Adapter Documentation](https://next-auth.js.org/adapters/prisma)
