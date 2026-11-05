import * as React from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GoogleButton, Alert, AlertDescription, FormField } from '../ui'
import { Button } from '../ui/buttons/button-compounds'
import { Divider } from '../ui/layout'
import { signIn } from 'next-auth/react'
import { Suspense } from 'react'

interface LoginFormProps {
  redirectTo?: string
  showGoogleAuth?: boolean
}

// Mapeamento de erros do NextAuth para mensagens amigáveis
const getErrorMessage = (error: string): string => {
  const errorMap: Record<string, string> = {
    'CredentialsSignin': 'Incorrect email or password',
    'Email and password are required': 'Please fill in all fields',
    'Invalid credentials': 'Incorrect email or password',
    'Invalid email or password.': 'Incorrect email or password',
    'Email is not valid.': 'Please enter a valid email',
    'Email and password are required.': 'Please fill in all fields',
    'INVALID_CREDENTIALS': 'Incorrect email or password',
    'VALIDATION_ERROR': 'Invalid data provided',
    'SERVER_ERROR': 'Internal server error. Please try again.',
    'SERVER_MISCONFIGURATION': 'Server configuration error',
    'Default': 'Authentication error. Please try again.' 
  }

  return errorMap[error] || errorMap['Default']
}

const getCurrentDeploymentRedirectPath = (url: string, fallback: string): string => {
  if (url.startsWith('/')) {
    return url
  }

  try {
    const parsedUrl = new URL(url)
    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}` || fallback
  } catch {
    return fallback
  }
}

// Componente interno que usa useSearchParams
const LoginFormContent = React.forwardRef<HTMLFormElement, LoginFormProps>(
  ({ redirectTo = '/workspace', showGoogleAuth = true, ...props }, ref) => {
    const [email, setEmail] = React.useState('')
    const [password, setPassword] = React.useState('')
    const [isLoading, setIsLoading] = React.useState(false)
    const [error, setError] = React.useState('')
    const [fieldErrors, setFieldErrors] = React.useState<{
      email?: string
      password?: string
    }>({})
    
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || redirectTo

    // Validation of fields
    const validateFields = () => {
      const errors: { email?: string; password?: string } = {}
      
      if (!email.trim()) {
        errors.email = 'Email is required'
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.email = 'Please enter a valid email'
      }
      
      if (!password.trim()) {
        errors.password = 'Password is required'
      } else if (password.length < 6) {
        errors.password = 'Password must be at least 6 characters long'
      }
      
      setFieldErrors(errors)
      return Object.keys(errors).length === 0
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      
      // Clear previous errors
      setError('')
      setFieldErrors({})
      
      // Validate fields
      if (!validateFields()) {
        return
      }
      
      setIsLoading(true)

      try {
        // First, validate credentials with our API
        const loginResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email.trim(),
            password,
          }),
        })

        const loginData = await loginResponse.json()

        if (!loginResponse.ok) {
          // Handle specific API errors
          const errorMessage = loginData.message || 'Authentication failed'
          setError(errorMessage)
          setIsLoading(false)
          return
        }

        // If API login successful, use NextAuth to create session
        const result = await signIn('credentials', {
          redirect: false,
          email: email.trim(),
          password,
          callbackUrl,
        })

        if (result?.error) {
          const friendlyError = getErrorMessage(result.error)
          setError(friendlyError)
        } else if (result?.url) {
          router.push(getCurrentDeploymentRedirectPath(result.url, callbackUrl))
        } else {
          setError('Unexpected error. Please try again.')
        }
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Login error:', err)
        setError('Connection error. Please check your internet and try again.')
      } finally {
        setIsLoading(false)
      }
    }

    const handleGoogleSignIn = async () => {
      try {
        setError('')
        await signIn('google', { callbackUrl })
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Google sign-in error:', err)
        setError('Error logging in with Google. Please try again.')
      }
    }

    return (
      <div className="space-y-6" >
        <form ref={ref} onSubmit={handleSubmit} className="space-y-4" {...props}>
          <FormField
            label="Email"
            type="email"
            placeholder="teacher@school.edu"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value)
              // Clear field error when user types
              if (fieldErrors.email) {
                setFieldErrors(prev => ({ ...prev, email: undefined }))
              }
            }}
            required
            error={fieldErrors.email}
          />

          <FormField
            label="Password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              // Clear field error when user types
              if (fieldErrors.password) {
                setFieldErrors(prev => ({ ...prev, password: undefined }))
              }
            }}
            required
            error={fieldErrors.password}
          />

          <Button.SubmitWithLoading
            className="w-full"
            isLoading={isLoading}
            loadingText="Logging in..."
            disabled={isLoading}
          >
            Login
          </Button.SubmitWithLoading>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </form>

        {showGoogleAuth && (
          <>
            <Divider>Or continue with</Divider>
            <GoogleButton 
              onClick={handleGoogleSignIn}
              disabled={isLoading}
            />
          </>
        )}
      </div>
    )
  },
)
LoginFormContent.displayName = 'LoginFormContent'

// Main component that wraps with Suspense
const LoginForm = React.forwardRef<HTMLFormElement, LoginFormProps>(
  (props, ref) => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
        <LoginFormContent ref={ref} {...props} />
      </Suspense>
    )
  },
)
LoginForm.displayName = 'LoginForm'

export { LoginForm }
export type { LoginFormProps }
