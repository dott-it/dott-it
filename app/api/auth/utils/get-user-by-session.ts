import { auth } from '@/lib/auth.config';
import { userPrisma } from '@/lib/user-prisma';

/**
 * Retrieves a user based on a session token.
 * @returns The user object or null if not found or if the session is invalid.
 */
export async function getUserBySessionId() {
    try {
    console.log('🔍 getUserBySessionId: Starting session lookup...')
    const session = await auth()

    console.log('🔍 getUserBySessionId: Session data:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      userId: session?.user?.id,
      userEmail: session?.user?.email,
      sessionKeys: session ? Object.keys(session) : [],
    })

    if (!session) {
        console.log('❌ getUserBySessionId: No session found for the given token or session is missing userId.');
        return null
    }

    if (!session.user?.id) {
        console.log('❌ getUserBySessionId: Session exists but no user ID found:', {
          sessionUser: session.user,
          sessionKeys: Object.keys(session),
        });
        return null
    }

    console.log('🔍 getUserBySessionId: Looking up user in database with ID:', session.user.id)
    
    // 2. Find the user in the user database using the userId from the session
    const user = await userPrisma.user.findUnique({
      where: {
        id: session.user.id,
      },
    })

    console.log('🔍 getUserBySessionId: Database lookup result:', {
      foundUser: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userName: user?.name,
      userTenantId: user?.tenantId,
    })

    if (!user) {
        console.log(`❌ getUserBySessionId: No user found with ID: ${session.user.id}`);
        return null;
    }

    if (!user.active) {
      console.log(`🚫 getUserBySessionId: User ${user.id} is inactive`);
      return null;
    }

    console.log('✅ getUserBySessionId: User found successfully:', {
      id: user.id,
      email: user.email,
      name: user.name,
      tenantId: user.tenantId,
      role: user.role,
    })

    return user
  } catch (error) {
    console.error('💥 getUserBySessionId: Error retrieving user by session ID:', error);
    return null;
  }
}