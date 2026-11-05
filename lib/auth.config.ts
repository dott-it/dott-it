import NextAuth, { NextAuthConfig } from 'next-auth'
import GoogleProvider from 'next-auth/providers/google'
import CredentialsProvider from 'next-auth/providers/credentials'

import { getTenantByEmail } from '@/app/api/auth/utils/tenant'
import { userPrisma } from '@/lib/user-prisma'
import { signAuthToken } from '@/lib/auth'
import { authenticateCredentials } from '@/lib/credential-auth'

import { prisma } from '@/lib/prisma'

const authConfig: NextAuthConfig = {
  // The `any` cast is required here because we are using a separate
  // Prisma client for the user database. The PrismaAdapter expects the
  // default PrismaClient type, but our `userPrisma` instance is from a
  // generated client in a different location.
  trustHost: true, // Trust all hosts (needed for tests and development)
  session: {
    strategy: 'jwt',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      checks: ["state"],
      profile(profile) {
        console.log('🔍 Google profile received:', {
          sub: profile.sub,
          email: profile.email,
          name: profile.name,
        })
        return {
          id: profile.sub, // Ensure the 'id' (sub) is returned
          email: profile.email,
          image: profile.picture,
          name: profile.name,
        }
      },
    }),
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          const loginResult = await authenticateCredentials({
            email: typeof credentials?.email === 'string' ? credentials.email : undefined,
            password: typeof credentials?.password === 'string' ? credentials.password : undefined,
          })

          if (loginResult.success) {
            return {
              id: loginResult.user.id,
              email: loginResult.user.email,
              name: loginResult.user.name,
              tenantId: loginResult.user.tenantId,
            }
          }

          throw new Error(loginResult.message)
        } catch (error) {
          console.error('Error in authorize:', error)
          // Re-throw to let NextAuth handle the error
          throw error
        }
      }
    })
  ],
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: '/login',
    signOut: '/login',
  },
  callbacks: {
    async signIn({ user, account: _account, profile: _profile }) {
      console.log('signIn callback:', {
        userEmail: user.email,
        userName: user.name,
        accountProvider: _account?.provider,
        profileEmail: _profile?.email,
      })
      if (!user.email) {
        return false
      }

      

      const tenant = await getTenantByEmail(user.email)
      console.log('Found tenant:', tenant)

      if (!tenant) {
        console.log('No tenant found for email:', user.email)
        return false // Prevent sign-in if no tenant is found
      }

      // Update the user's tenant information
      try {
        const userDB = await userPrisma.user.findUnique({
          where: { email: user.email },
        })
        console.log('User DB:', userDB)
        if (userDB) {
          if (!userDB.active) {
            console.log(`Blocked sign-in for inactive user ${user.email}`)
            return false
          }
          await userPrisma.user.update({
            where: { email: user.email },
            data: { tenantId: tenant.id },
          })
          await prisma.userReference.upsert({
            where: { correlationId: userDB.id },
            update: { tenantId: tenant.id, correlationId: userDB.id },
            create: {
              tenantId: tenant.id,
              correlationId: userDB.id,
            },
          })
        }else{
         const userCreated= await userPrisma.user.create({
            data: {
              tenantId: tenant.id,
              name: user.name,
              email: user.email,
              image: user.image,
              active: true,
            },
          })
          await prisma.userReference.create({
            data: {
              tenantId: tenant.id,
              correlationId: userCreated.id,
            },
          })
        }
        console.log(`Updated tenant for user ${user.email} to ${tenant.id}`)
      } catch (error) {
        console.error('Error updating user tenant:', error)
        return false
      }

      return true
    },

    async session({ session, token }) {
      console.log('🔐 NextAuth session callback:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasToken: !!token,
        tokenId: token?.id,
        userEmail: session?.user?.email,
      })

      if (session.user && token?.id) {
        // Generate auth token for API requests
        const authToken = signAuthToken({
          sub: token.id as string,
          email: session.user.email!,
          tenantId: (token.tenantId as string) || null,
        })

        session.user.id = token.id as string
        session.user.authToken = authToken
        session.user.tenantId = (token.tenantId as string) || null

        console.log('✅ Auth token generated:', {
          userId: session.user.id,
          email: session.user.email,
          tenantId: session.user.tenantId,
          tokenLength: authToken.length,
        })
      }
      return session
    },
    async jwt({ token, user, account }) {
      console.log('🔑 NextAuth JWT callback:', {
        hasToken: !!token,
        hasUser: !!user,
        hasAccount: !!account,
        userId: user?.id,
        userEmail: user?.email,
        tokenId: token?.id,
      })

      if (user) {
        // Get the user from database to use the correct ID
        try {
          const userDB = await userPrisma.user.findUnique({
            where: { email: user.email! },
          })
          
          if (userDB) {
            if (!userDB.active) {
              throw new Error(`Inactive user ${user.email} attempted to authenticate`)
            }
            // Use the database ID instead of the Google ID
            token.id = userDB.id
            console.log('✅ JWT token updated with database user ID:', userDB.id)
          } else {
            // Fallback to Google ID if user not found in database
            token.id = user.id
            console.log('⚠️ JWT token using Google ID (user not found in DB):', user.id)
          }
        } catch (error) {
          console.error('Error fetching user from database:', error)
          // Fallback to Google ID
          token.id = user.id
          console.log('⚠️ JWT token using Google ID (DB error):', user.id)
        }

        // Get tenant info for the token
        try {
          const tenant = await getTenantByEmail(user.email!)
          if (tenant) {
            token.tenantId = tenant.id
            console.log('✅ JWT token updated with tenant ID:', tenant.id)
          }
        } catch (error) {
          console.warn('Failed to get tenant for user:', user.email, error)
        }
      }

      console.log('🔑 JWT token final state:', { id: token.id, tenantId: token.tenantId })
      return token
    },
  },
}

export const { handlers, auth } = NextAuth(authConfig)
