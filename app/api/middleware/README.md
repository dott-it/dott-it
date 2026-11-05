# Authorization Middleware

This middleware provides authentication and authorization functionality for API routes using Next.js App Router.

## Features

- **Session Validation**: Validates user sessions using `getUserBySessionId()`
- **User Context**: Provides authenticated user data to protected routes
- **Error Handling**: Returns appropriate HTTP status codes and error messages
- **Type Safety**: Full TypeScript support with proper type definitions
- **Utility Functions**: Helper functions for tenant access and admin role checks

## Usage

### Basic Authorization

Use the `withAuth` higher-order function to wrap your API route handlers:

```typescript
import { NextResponse } from 'next/server'
import { withAuth, AuthorizedRequest } from '../middleware/authorization.middleware'

async function protectedHandler(request: AuthorizedRequest) {
  // Access the authenticated user
  const user = request.user
  
  return NextResponse.json({
    message: `Hello ${user.name || user.email}!`,
    userId: user.id,
    tenantId: user.tenantId
  })
}

// Export the wrapped handler
export const GET = withAuth(protectedHandler)
export const POST = withAuth(protectedHandler)
```

### Manual Authorization Check

For more control, use the `withAuthorization` function directly:

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { withAuthorization } from '../middleware/authorization.middleware'

export async function GET(request: NextRequest) {
  const authResult = await withAuthorization(request)
  
  if (!authResult.success) {
    return authResult.response!
  }
  
  const user = authResult.user!
  
  // Your protected logic here
  return NextResponse.json({ user })
}
```

### Route with Parameters

For routes with dynamic parameters:

```typescript
import { withAuth, AuthorizedRequest } from '../middleware/authorization.middleware'

async function getAssessment(
  request: AuthorizedRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const user = request.user
  
  // Check if user has access to this assessment
  // Your logic here
  
  return NextResponse.json({ assessmentId: id, userId: user.id })
}

export const GET = withAuth(getAssessment)
```

## Utility Functions

### Tenant Access Check

```typescript
import { hasTenantAccess } from '../middleware/authorization.middleware'

// Check if user has access to specific tenant
if (!hasTenantAccess(user, requiredTenantId)) {
  return NextResponse.json(
    { error: 'Access denied to this tenant' },
    { status: 403 }
  )
}
```

### Admin Role Check

```typescript
import { isAdmin } from '../middleware/authorization.middleware'

// Check if user is admin
if (!isAdmin(user)) {
  return NextResponse.json(
    { error: 'Admin access required' },
    { status: 403 }
  )
}
```

## Error Responses

The middleware returns standardized error responses:

### Unauthorized (401)
```json
{
  "error": "Unauthorized",
  "message": "Valid session required to access this resource",
  "type": "UNAUTHORIZED"
}
```

### Authorization Error (500)
```json
{
  "error": "Authorization Error",
  "message": "An error occurred during authorization",
  "details": "Error details here",
  "type": "AUTHORIZATION_ERROR"
}
```

## Types

### AuthorizedRequest
```typescript
interface AuthorizedRequest extends NextRequest {
  user: User
}
```

### AuthorizationResult
```typescript
interface AuthorizationResult {
  success: boolean
  user?: User
  response?: NextResponse
}
```

### User
```typescript
interface User {
  id: string
  email: string
  name?: string
  tenantId?: string | null
  role?: string
  createdAt?: Date
  updatedAt?: Date
}
```

## Best Practices

1. **Always use `withAuth`** for simple route protection
2. **Use manual authorization** when you need custom logic before/after auth
3. **Check tenant access** for multi-tenant applications
4. **Validate user roles** for admin-only endpoints
5. **Handle errors gracefully** and provide meaningful error messages
6. **Log authorization events** for security monitoring

## Logging and Debugging

The middleware includes comprehensive logging to help with debugging and monitoring:

### Log Format
All logs include:
- **Request ID**: Unique identifier for each request (e.g., `[abc1234]`)
- **Emoji indicators**: Visual cues for different log types
- **Timestamps**: ISO format timestamps
- **Duration tracking**: Performance metrics

### Log Types

#### 🔐 Authorization Start
```
🔐 [abc1234] Authorization middleware started: {
  method: "GET",
  url: "http://localhost:3000/api/test-auth",
  pathname: "/api/test-auth",
  userAgent: "Mozilla/5.0...",
  timestamp: "2024-01-15T10:30:00.000Z"
}
```

#### 🔍 Session Lookup
```
🔍 [abc1234] Calling getUserBySessionId...
```

#### 👤 User Data
```
👤 [abc1234] Raw Prisma user data: {
  id: "user-123",
  email: "test@example.com",
  name: "Test User",
  tenantId: "tenant-456",
  role: "admin",
  hasEmail: true,
  hasName: true,
  hasTenant: true,
  hasRole: true
}
```

#### ✅ Success
```
✅ [abc1234] Authorization successful: {
  userId: "user-123",
  email: "test@example.com",
  name: "Test User",
  tenantId: "tenant-456",
  role: "admin",
  duration: "45ms",
  timestamp: "2024-01-15T10:30:00.045Z"
}
```

#### ❌ Authorization Failed
```
❌ [abc1234] Authorization failed - No valid session found: {
  duration: "23ms",
  reason: "No user returned from getUserBySessionId",
  timestamp: "2024-01-15T10:30:00.023Z"
}
```

#### 🛡️ withAuth Wrapper
```
🛡️ [abc1234] withAuth wrapper called: {
  method: "GET",
  url: "http://localhost:3000/api/test-auth",
  pathname: "/api/test-auth",
  timestamp: "2024-01-15T10:30:00.000Z"
}
```

#### 🎯 Handler Execution
```
🎯 [abc1234] withAuth - Calling protected handler: {
  userId: "user-123",
  userEmail: "test@example.com",
  timestamp: "2024-01-15T10:30:00.045Z"
}
```

#### 🎉 Handler Success
```
🎉 [abc1234] withAuth - Handler completed successfully: {
  handlerDuration: "12ms",
  totalDuration: "57ms",
  responseStatus: 200,
  timestamp: "2024-01-15T10:30:00.057Z"
}
```

#### 🏢 Tenant Access Check
```
🏢 Tenant access check: {
  userId: "user-123",
  userTenantId: "tenant-456",
  requiredTenantId: "tenant-456",
  hasAccess: true,
  timestamp: "2024-01-15T10:30:00.060Z"
}
```

#### 👑 Admin Role Check
```
👑 Admin role check: {
  userId: "user-123",
  userRole: "admin",
  isAdmin: true,
  timestamp: "2024-01-15T10:30:00.062Z"
}
```

#### 💥 Errors
```
💥 [abc1234] Authorization error: {
  error: "Database connection failed",
  stack: "Error: Database connection failed\n    at...",
  duration: "5000ms",
  timestamp: "2024-01-15T10:30:05.000Z"
}
```

### Testing the Logs

You can test the middleware logging by making requests to the test endpoint:

```bash
# Test with authentication
curl -H "Cookie: next-auth.session-token=your-session-token" \
     http://localhost:3000/api/test-auth

# Test without authentication (will show failure logs)
curl http://localhost:3000/api/test-auth
```

### Log Filtering

To filter logs in your console, you can use:
- `🔐` - Authorization start
- `🔍` - Session lookup
- `👤` - User data
- `✅` - Success
- `❌` - Authorization failed
- `🛡️` - withAuth wrapper
- `🎯` - Handler execution
- `🎉` - Handler success
- `🏢` - Tenant access
- `👑` - Admin role
- `💥` - Errors

## Security Considerations

- The middleware validates sessions on every request
- User data is transformed to ensure type safety
- Error messages don't expose sensitive information
- All authorization failures are logged for monitoring
- Request IDs help correlate logs across the request lifecycle
- Performance metrics help identify slow authorization checks
