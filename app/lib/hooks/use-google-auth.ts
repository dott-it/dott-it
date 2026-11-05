import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface GoogleUser {
  email: string
  name: string
  picture?: string
}

interface AuthState {
  user: GoogleUser | null
  token: string | null
}

export function useGoogleAuth() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const signInWithGoogle = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Mock Google authentication for demo purposes
      // In a real implementation, this would integrate with Google OAuth
      const mockUser: GoogleUser = {
        email: 'demo.teacher@gmail.com',
        name: 'Demo Teacher',
        picture: 'https://via.placeholder.com/150',
      }

      const mockToken = `google-token-${Date.now()}`

      // Store auth data in localStorage
      const authData: AuthState = {
        user: mockUser,
        token: mockToken,
      }

      localStorage.setItem('v2-auth', JSON.stringify(authData))

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Redirect to workspace
      router.push('/workspace')
    } catch (err) {
      setError('Failed to sign in with Google')
      console.error('Google sign-in error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  const signOutUser = async () => {
    try {
      setIsLoading(true)
      setError('')

      // Clear auth data
      localStorage.removeItem('v2-auth')

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      // Redirect to login
      router.push('/login')
    } catch (err) {
      setError('Failed to sign out')
      console.error('Sign-out error:', err)
    } finally {
      setIsLoading(false)
    }
  }

  return {
    signInWithGoogle,
    signOutUser,
    isLoading,
    error,
  }
}
