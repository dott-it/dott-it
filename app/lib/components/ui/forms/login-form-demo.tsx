import React from 'react'
import { LoginForm } from '@/app/lib/components/auth'
import { LoginCard } from '../layout/card'
import { Card, CardHeader, CardTitle, CardContent } from '../layout/card'

export function LoginFormDemo() {
  return (
    <div className="space-y-8 p-6">
      <div>
        <h2 className="mb-4 text-2xl font-bold">LoginForm Component</h2>
        <p className="mb-6 text-muted-foreground">
          A complete login form component that handles authentication logic, UI, and state management.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h3 className="mb-4 text-xl font-semibold">Default LoginForm</h3>
          <p className="mb-4 text-muted-foreground">
            Full-featured login form with Google auth and demo info:
          </p>
          <LoginCard title="Default Example">
            <LoginForm />
          </LoginCard>
        </div>

        <div>
          <h3 className="mb-4 text-xl font-semibold">Simplified LoginForm</h3>
          <p className="mb-4 text-muted-foreground">
            Without Google auth and demo info:
          </p>
          <LoginCard title="Simplified Example">
            <LoginForm showGoogleAuth={false} />
          </LoginCard>
        </div>

        <div>
          <h3 className="mb-4 text-xl font-semibold">Custom Redirect</h3>
          <p className="mb-4 text-muted-foreground">
            With custom redirect URL:
          </p>
          <LoginCard title="Custom Redirect">
            <LoginForm redirectTo="/dashboard" />
          </LoginCard>
        </div>

        <div>
          <h3 className="mb-4 text-xl font-semibold">With Custom Callback</h3>
          <p className="mb-4 text-muted-foreground">
            With custom success handler:
          </p>
          <LoginCard title="Custom Callback">
            <LoginForm 
              // onSuccess={(user) => {
              //   alert(`Welcome ${user.name}! (${user.email})`)
              // }}
            />
          </LoginCard>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">Props Reference</h3>
        <Card>
          <CardHeader>
            <CardTitle>LoginFormProps</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-4 border-b py-2">
                <div className="font-medium">Prop</div>
                <div className="font-medium">Type</div>
                <div className="font-medium">Description</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 py-2">
                <code className="rounded bg-gray-100 px-2 py-1 text-xs">onSuccess</code>
                <code className="text-xs text-muted-foreground">{'(user) => void'}</code>
                <span>Custom callback on successful login</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 py-2">
                <code className="rounded bg-gray-100 px-2 py-1 text-xs">redirectTo</code>
                <code className="text-xs text-muted-foreground">string</code>
                <span>URL to redirect after login (default: &quot;/workspace&quot;)</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 py-2">
                <code className="rounded bg-gray-100 px-2 py-1 text-xs">showDemoInfo</code>
                <code className="text-xs text-muted-foreground">boolean</code>
                <span>Show demo mode information (default: true)</span>
              </div>
              
              <div className="grid grid-cols-3 gap-4 py-2">
                <code className="rounded bg-gray-100 px-2 py-1 text-xs">showGoogleAuth</code>
                <code className="text-xs text-muted-foreground">boolean</code>
                <span>Show Google authentication option (default: true)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">Usage Examples</h3>
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle size="md">Simple Login Page</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-sm">
{`<LoginCard title="Sign In">
  <LoginForm />
</LoginCard>`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle size="md">Email-only Login</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-sm">
{`<LoginCard title="Sign In">
  <LoginForm 
    showGoogleAuth={false}
    showDemoInfo={false}
  />
</LoginCard>`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle size="md">Custom Success Handler</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-sm">
{`<LoginCard title="Sign In">
  <LoginForm 
    onSuccess={(user) => {
      // Custom logic after login
      console.log('User logged in:', user)
      showWelcomeModal(user)
    }}
  />
</LoginCard>`}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle size="md">As Standalone Component</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="overflow-x-auto rounded bg-gray-50 p-4 text-sm">
{`// Can be used outside of LoginCard
<div className="max-w-md mx-auto">
  <h1>Welcome Back</h1>
  <LoginForm redirectTo="/dashboard" />
</div>`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-xl font-semibold">Features</h3>
        <Card>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <h4 className="font-medium">✅ Included Features:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Email/password authentication</li>
                  <li>• Google OAuth integration</li>
                  <li>• Form validation</li>
                  <li>• Loading states</li>
                  <li>• Error handling</li>
                  <li>• Session management</li>
                  <li>• Responsive design</li>
                  <li>• Accessibility features</li>
                </ul>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">🎛️ Customizable:</h4>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Success callback</li>
                  <li>• Redirect URL</li>
                  <li>• Google auth toggle</li>
                  <li>• Demo info toggle</li>
                  <li>• Form ref forwarding</li>
                  <li>• Additional form props</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
