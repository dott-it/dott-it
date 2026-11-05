# Mock Server Documentation

A flexible mock server implementation for Next.js applications that supports both file-based mocking and proxy fallback to real APIs.

## Features

- **File-based mocking**: Serve responses from JSON files
- **Proxy fallback**: Forward requests to real APIs when mocks aren't available
- **Mock variants**: Support different response variants based on headers
- **Cookie handling**: Proper cookie domain removal for local development
- **Flexible configuration**: Customizable logging, interceptors, and error handling
- **TypeScript support**: Full type safety with proper error handling

## Quick Start

### 1. Basic Setup

```typescript
import { MockServer } from './mock-server';
import { getMockFile } from './your-mock-file-loader';

const mockServer = new MockServer({
    getMockFile,
    proxyUrl: 'https://api.example.com', // Optional
    mockApiPath: '/api/mock',
    mockVariantHeader: 'x-mock-variants'
});

// In your Next.js API route
export async function GET(request: Request, { params }: { params: { path: string[] } }) {
    const handler = mockServer.getHandler();
    return handler(request, { params });
}
```

### 2. Mock File Structure

Create mock files in this structure:
```
mocks/
├── get/
│   ├── users.json
│   ├── users-admin.json (variant)
│   └── posts-123.json
├── post/
│   └── users.json
└── put/
    └── users-123.json
```

### 3. Mock File Format

```json
{
  "mock": {
    "data": {
      "users": [
        { "id": 1, "name": "John Doe" }
      ]
    },
    "response": {
      "status": 200,
      "headers": {
        "Content-Type": "application/json"
      }
    }
  }
}
```

## Configuration Options

### MockServerOptions

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `getMockFile` | `(method: string, path: string) => Promise<Result<object>>` | ✅ | Function to load mock files |
| `enabled` | `boolean` | ❌ | Enable/disable mock server (default: true) |
| `proxyUrl` | `string` | ❌ | Fallback API URL for proxy requests |
| `mockApiPath` | `string` | ❌ | Base path for mock API |
| `mockVariantHeader` | `string` | ❌ | Header name for mock variants |
| `notFound` | `() => Response` | ❌ | Custom 404 handler |
| `logger` | `(message: any, ...args: any[]) => void` | ❌ | Custom logging function |
| `fetchFn` | `typeof fetch` | ❌ | Custom fetch implementation |
| `mockProxyIntercept` | `(path: string, request: Request) => void` | ❌ | Proxy request interceptor |

## Mock Variants

Support different responses based on request headers:

### Setup
```typescript
const mockServer = new MockServer({
    mockVariantHeader: 'x-mock-variants',
    // ... other options
});
```

### Usage
```bash
# Request with variant header
curl -H "x-mock-variants: admin;role" \
     -H "admin: true" \
     -H "role: manager" \
     /api/users
```

### File Naming
- Base file: `users.json`
- Variant files: `users_ADMIN=true.json`, `users_ADMIN=true_ROLE=manager.json`

## Error Handling

The mock server uses a `Result<T>` type for error handling:

```typescript
import { error, isResultError } from '@/utils/result';

async function getMockFile(method: string, path: string): Promise<Result<object>> {
    try {
        const content = await loadFile(`${method}/${path}.json`);
        return JSON.parse(content);
    } catch (e) {
        return error(new Error(`Mock file not found: ${path}`));
    }
}
```

## Proxy Mode

When a mock file isn't found, requests can be forwarded to a real API:

```typescript
const mockServer = new MockServer({
    proxyUrl: 'https://api.example.com',
    mockProxyIntercept: (path, request) => {
        console.log(`Proxying ${request.method} ${path}`);
    },
    // ... other options
});
```

### Features
- Automatic cookie domain removal
- Header filtering for security
- Redirect handling
- 404 retry with trailing slash

## Logging

Custom logging can be configured:

```typescript
const mockServer = new MockServer({
    logger: (message, ...args) => {
        console.log(`[MockServer] ${message}`, ...args);
    },
    // ... other options
});
```

## Next.js Integration

### API Route Example (`app/api/mock/[...path]/route.ts`)

```typescript
import { MockServer } from '@/server/mock-server';
import { getMockFile } from '@/lib/mock-loader';

const mockServer = new MockServer({
    getMockFile,
    proxyUrl: process.env.API_URL,
    mockApiPath: '/api/mock',
    mockVariantHeader: 'x-mock-variants',
    enabled: process.env.NODE_ENV === 'development'
});

const handler = mockServer.getHandler();

export async function GET(request: Request, { params }: { params: { path: string[] } }) {
    return handler(request, { params });
}

export async function POST(request: Request, { params }: { params: { path: string[] } }) {
    return handler(request, { params });
}

export async function PUT(request: Request, { params }: { params: { path: string[] } }) {
    return handler(request, { params });
}

export async function DELETE(request: Request, { params }: { params: { path: string[] } }) {
    return handler(request, { params });
}
```

## Testing

The mock server is designed to work seamlessly with your testing setup:

```typescript
// In your test setup
const testMockServer = new MockServer({
    enabled: true,
    getMockFile: async (method, path) => {
        // Return test-specific mock data
        return { data: { test: true } };
    }
});
```

## Troubleshooting

### Common Issues

1. **Mock files not found**
   - Check file path structure matches HTTP method and route
   - Ensure `getMockFile` function is correctly implemented

2. **Proxy requests failing**
   - Verify `proxyUrl` is accessible
   - Check network connectivity and CORS settings

3. **Headers not working**
   - Ensure `mockVariantHeader` matches client headers
   - Check header case sensitivity

4. **TypeScript errors**
   - Import types: `import type { MockServerOptions } from './mock-server'`
   - Ensure `Result<T>` type is properly imported

### Debug Mode

Enable detailed logging:

```typescript
const mockServer = new MockServer({
    logger: console.log, // Enable all logs
    // ... other options
});
```

## Best Practices

1. **File Organization**: Keep mock files organized by HTTP method and route structure
2. **Error Handling**: Always handle errors in `getMockFile` implementation
3. **Performance**: Cache mock files in production-like environments
4. **Security**: Don't expose sensitive data in mock files
5. **Testing**: Use different mock configurations for different test scenarios

## Migration Guide

If upgrading from a previous version, note these breaking changes:

- `proxyUrl`, `mockApiPath`, and `mockVariantHeader` are now optional
- Improved error handling with `Result<T>` type
- Better TypeScript support with proper type definitions
- Enhanced logging with structured messages
