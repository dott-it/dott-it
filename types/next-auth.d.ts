import { DefaultSession, DefaultUser } from 'next-auth'
import { DefaultJWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      authToken: string
      tenantId: string | null
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    tenantId?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT extends DefaultJWT {
    tenantId?: string | null
  }
}

