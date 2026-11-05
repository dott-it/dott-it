import { useSession } from 'next-auth/react'
import { useMemo } from 'react'
import { createHttpClientWithAuth } from '@/lib/service'

export function useAuthHttpClient() {
  const { data: session } = useSession()
  const authToken = session?.user?.authToken || null

  console.log('🔑 useAuthHttpClient:', {
    hasSession: !!session,
    hasUser: !!session?.user,
    hasAuthToken: !!authToken,
    authToken: authToken ? '***' + authToken.slice(-5) : null,
  })

  // Memoize the HTTP client to prevent recreation on every render
  return useMemo(() => {
    return createHttpClientWithAuth(authToken)
  }, [authToken])
}

