# Error Flow in Client Application

## Table of Contents

1. [Overview](#overview)
2. [Current State (v1)](#current-state-v1)
   - Architecture
   - Error Flow Diagram
   - How Each Layer Works
3. [Error Classification](#error-classification)
4. [Error Handling Strategy](#error-handling-strategy)
   - ErrorBoundary Hierarchy
   - Toast Rules
   - Retry Logic
5. [React Query Integration](#react-query-integration)
6. [Target State (v2 with Middleware)](#target-state-v2-with-middleware)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Reference & Examples](#reference--examples)

---

# Overview

This document describes how errors are handled across the client application, from network requests through to user-facing error messages. It covers both the **current state** of error handling and a **proposed target state** with centralized middleware for better error management.

**Key principles:**

- Errors are classified early (at API boundary) into typed `AppError` with `ErrorCode`
- Errors bubble up through ErrorBoundary hierarchy with clear catch/re-throw rules
- React Query handles retry logic automatically based on error type
- Development shows detailed errors; production shows sanitized messages
- Toast notifications are reserved for background/async failures only

---

# PART 1: CURRENT STATE

## Current State (v1)

### Architecture Overview

The current implementation uses a **5-layer error handling approach** without centralized middleware:

```
┌────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYERS                          │
├────────────────────────────────────────────────────────────────────┤
│  Layer 1: React ErrorBoundary (MainErrorFallback)                 │
│           └─ Catches: Render errors, initialization errors        │
│           └─ STATUS: ✅ Implemented                               │
│                                                                    │
│  Layer 2: React Router ErrorBoundary (RouteErrorBoundary)         │
│           └─ Catches: Route loader errors, navigation errors      │
│           └─ STATUS: ✅ Implemented                               │
│                                                                    │
│  Layer 3: Component-level ErrorBoundary (ErrorBlock)              │
│           └─ Catches: Feature-specific errors, query errors       │
│           └─ Re-throws: Critical errors (auth, validation)        │
│           └─ STATUS: ✅ Implemented                               │
│                                                                    │
│  Layer 4: API Client (Axios Interceptor)                          │
│           └─ Classifies: HTTP errors → AppError                   │
│           └─ Handles: 401 redirects, 5xx toasts                   │
│           └─ STATUS: ✅ Implemented                               │
│                                                                    │
│  Layer 5: React Query                                             │
│           └─ Manages: Query errors, retry logic                   │
│           └─ Throws: Errors to boundaries (throwOnError: true)    │
│           └─ STATUS: ✅ Implemented                               │
└────────────────────────────────────────────────────────────────────┘
```

### Current Error Flow

**How errors currently flow through the system:**

```
User Interaction (click, navigation, etc.)
    ↓
React Router loads route data (if applicable)
    ↓
Component calls API via React Query useQuery()
    ↓
Axios makes HTTP request
    ↓
[Error or Response]
    │
    ├─→ Success: Return data
    │
    └─→ HTTP Error (any status)
            ↓
        Axios Interceptor (response.use())
            ├─ If 401: Set redirectTo, classify to AppError(UNAUTHORIZED)
            ├─ If 4xx: Classify to AppError(from server code field)
            ├─ If 5xx: Show toast, classify to AppError
            ├─ If network: Classify to AppError(NETWORK_ERROR)
            └─ Throw AppError to React Query
                ↓
            React Query catches AppError
                ├─ Check error classification
                ├─ If 4xx: No retry, throw to component
                ├─ If 5xx: Retry up to 2x with backoff
                └─ After retries exhausted OR 4xx: throw to ErrorBoundary
                    ↓
                ErrorBoundary catches AppError
                    ├─ If critical: Re-throw to parent
                    └─ If non-critical: Render error UI inline
                            ↓
                        User sees: Error message + Retry button
```

**Key characteristics of current flow:**

- ✅ Errors classified at API boundary (single point)
- ✅ Retry handled automatically by React Query
- ✅ Errors bubble to appropriate boundary
- ✅ TypeScript guard functions for safe error handling
- ❌ Toast logic in Axios (could show on non-critical 5xx)
- ❌ No centralized middleware for cross-cutting concerns
- ❌ No uniform error context across app
- ❌ Retry strategy applies equally to all errors (not flexible)

### What Each Layer Does

#### Layer 1: React ErrorBoundary (MainErrorFallback)

**Location:** Root of app

**Purpose:** Last resort error boundary

**Catches:**

- Render errors (buggy components)
- Initialization errors (app startup)
- Uncaught errors from lower boundaries

**Behavior:**

- Shows critical error page
- Offers refresh button
- Logs error to console (dev) or monitoring service (prod)

**Code:** `apps/client/src/components/errors/main-error-fallback.tsx`

#### Layer 2: React Router ErrorBoundary (RouteErrorBoundary)

**Location:** Route level (applied to all routes)

**Purpose:** Handle route-level errors

**Catches:**

- Route loader errors (async data fetching)
- Navigation errors
- Errors re-thrown from components

**Behavior:**

- Extracts statusCode and message
- Maps to user-friendly titles (404 → "Not Found")
- Shows route-specific error page
- Prevents full app crash

**Code:** `apps/client/src/components/errors/route-error-boundary.tsx`

#### Layer 3: Component ErrorBoundary (ErrorBlock)

**Location:** Individual features/components

**Purpose:** Graceful degradation of features

**Catches:**

- Feature-specific query errors
- Component render errors
- User interaction errors

**Behavior:**

- Shows inline error UI
- Offers retry button
- Re-throws critical errors to parent
- Keeps rest of app functional

**Code:** `apps/client/src/components/errors/error-block.tsx`

**Re-throw rule:**

- Catches error and checks `isCriticalError(error)`
- If YES → Re-throw (bubbles to RouteErrorBoundary)
- If NO → Handle locally with inline UI

#### Layer 4: Axios Interceptor (API Client)

**Location:** HTTP request/response boundary

**Purpose:** Error classification and handling

**Catches:**

- HTTP errors (any status code)
- Network failures
- Request/response errors

**Behavior:**

- Classifies error to `AppError` (see Error Classification)
- For 401: Sets `redirectTo` for auth handler
- For 5xx: Shows toast notification
- For 4xx: No toast (shown inline)
- Throws `AppError` to React Query

**Code:** `apps/client/src/lib/api-client.ts`

#### Layer 5: React Query

**Location:** Data fetching layer

**Purpose:** Cache management and retry logic

**Catches:**

- Query errors from Axios
- Network errors
- Retry failures

**Behavior:**

- Retries based on error classification:
  - 4xx errors: No retry (user's fault)
  - 5xx errors: Retry up to 2x with backoff
- Throws errors to ErrorBoundary (if `throwOnError: true`)
- Stores errors in query state (if `throwOnError: false`)

**Code:** `apps/client/src/lib/react-query.ts`

---

# PART 2: ERROR CLASSIFICATION

## Error Classification Strategy

Errors are classified early at the API boundary using `classifyHttpError()` function, converting raw HTTP responses into typed `AppError` with semantic `ErrorCode` values.

**Why classification matters:**

- **Code-first approach**: Server provides semantic error type; we don't guess from status
- **Fallback strategy**: If server doesn't provide code, we infer from HTTP semantics
- **Type safety**: All errors are `AppError` with known `ErrorCode` and `statusCode`
- **Consistency**: Same classification logic across all endpoints

### Classification Decision Tree

```
HTTP Error Response
    │
    ├─ Network Error (ERR_NETWORK or no response)?
    │   └─ YES → AppError(NETWORK_ERROR, 503)
    │             "Network connection failed..."
    │
    └─ HTTP Response Exists
        │
        ├─ Server provided custom code field?
        │   ├─ YES → Map code to ErrorCode enum
        │   │        Examples: "VALIDATION_ERROR", "NOT_FOUND", "UNAUTHORIZED"
        │   │
        │   └─ NO → Fall back to status code
        │
        ├─ Status 400 or 422?
        │   └─ AppError(VALIDATION_ERROR, 400)
        │       "Please check your input..."
        │
        ├─ Status 401?
        │   └─ AppError(UNAUTHORIZED, 401)
        │       "Please log in to continue..."
        │
        ├─ Status 403?
        │   └─ AppError(FORBIDDEN, 403)
        │       "You don't have permission..."
        │
        ├─ Status 404?
        │   └─ AppError(NOT_FOUND, 404)
        │       "Resource not found..."
        │
        ├─ Status 409?
        │   └─ AppError(CONFLICT, 409)
        │       "Resource already exists..."
        │
        ├─ Status 429?
        │   └─ AppError(RATE_LIMITED, 429)
        │       "Too many requests. Please wait..."
        │
        └─ Status 5xx?
            └─ AppError(INTERNAL_ERROR, 500)
                "Service temporarily unavailable. Retrying..."
```

### Classification Result

All errors are normalized to `AppError` structure:

```typescript
interface AppError {
  statusCode: number; // HTTP status or error-specific code
  code: ErrorCode; // Semantic error classification
  message: string; // User-friendly message
  details?: Record<string, any>; // Structured error data (e.g., field errors)
}
```

**Type guards for classification:**

```typescript
// Check if error is AppError (vs generic Error)
isAppError(error): boolean

// Check if error is critical (should bubble to parent boundary)
isCriticalError(error): boolean
// Critical codes: UNAUTHORIZED, INVALID_TOKEN, TOKEN_EXPIRED, VALIDATION_ERROR

// Get user-friendly message from error
getErrorMessage(error): string
```

**Code reference:** [apps/client/src/lib/errors.ts](apps/client/src/lib/errors.ts)

---

# PART 3: ERROR HANDLING STRATEGY

## ErrorBoundary Hierarchy Decision Tree

Errors flow through the boundary hierarchy based on their criticality:

```
Error Occurs in Component
    │
    ├─ Component-level ErrorBoundary (ErrorBlock)
    │   │
    │   ├─ isCriticalError(error)?
    │   │   ├─ YES → Re-throw to parent (RouteErrorBoundary)
    │   │   │        Critical error codes:
    │   │   │        - UNAUTHORIZED (auth required)
    │   │   │        - INVALID_TOKEN (session invalid)
    │   │   │        - TOKEN_EXPIRED (token expired)
    │   │   │        - VALIDATION_ERROR (form errors)
    │   │   │
    │   │   └─ NO → Handle locally
    │   │            Display: title, message, retry button
    │   │            Examples: 404 Not Found, 500 Server Error
    │
    ├─ Route-level ErrorBoundary (RouteErrorBoundary)
    │   │
    │   ├─ isRouteErrorResponse()?
    │   │   └─ YES → Handle React Router errors
    │   │            - Status 404 → "Page Not Found"
    │   │            - Status 400 → "Bad Request"
    │   │
    │   ├─ isAppError()?
    │   │   └─ YES → Extract statusCode and message
    │   │            - Status 404 → title: "Not Found"
    │   │            - Other → title: "Request Failed"
    │   │
    │   ├─ Unknown Error
    │   │   └─ Show: "An error occurred"
    │   │
    │   └─ Display: statusCode, title, message, back/home links
    │
    └─ Root ErrorBoundary (MainErrorFallback)
        │
        └─ Display: Generic error message + refresh button
```

## Toast Notification Strategy

Toasts are used for **background/async errors that don't block navigation**:

### When to Show Toast

✅ **5xx Server Errors**

- Service is temporarily unavailable
- Retry in progress (React Query retrying)
- User can continue with stale data

✅ **Network Failures**

- Connection lost
- User should know network is down
- Auto-recovery when connection restored

✅ **Auth Session Expiration**

- User logged out (401)
- Informing user they need to log in

### When NOT to Show Toast

❌ **4xx Validation Errors**

- Field-specific errors shown inline with form
- User action required to fix

❌ **404 Not Found**

- Shown as page content
- User must navigate elsewhere

❌ **409 Conflict**

- Handled in component logic
- Resource state should be refreshed

❌ **429 Rate Limited**

- Shown inline with countdown
- User should wait before retrying

**Implementation:** `apps/client/src/lib/api-client.ts`

## Retry Logic

React Query handles retries automatically based on error classification:

```
Query fails with error
    │
    ├─ Is error a 4xx (client error)?
    │   └─ NO RETRY
    │       Reason: User must fix issue or contact support
    │       Error shown: In component UI
    │
    └─ Is error a 5xx or network error?
        └─ RETRY UP TO 2 TIMES
            - Exponential backoff (wait between retries)
            - Example: Wait 1s, then 2s, then give up
            - Reason: Server might recover
            - Error shown: After retries exhausted
```

**Configuration:** `apps/client/src/lib/react-query.ts`

---

# PART 4: REACT QUERY INTEGRATION

## React Query Error Handling

### Overview

React Query manages server state and automatically handles caching, refetching, and error retries. It's configured to integrate with our ErrorBoundary hierarchy.

### Custom Defaults Configuration

```typescript
// apps/client/src/lib/react-query.ts
const queryClientConfig = {
  defaultOptions: {
    queries: {
      // Throw errors to ErrorBoundary for critical codes only
      throwOnError: (error) => {
        return isAppError(error) && isCriticalError(error);
      },

      // Retry strategy based on error type
      retry: (failureCount, error) => {
        if (!isAppError(error)) return true; // Retry unknown errors

        // 4xx errors: don't retry (user's fault or data conflict)
        if (error.statusCode >= 400 && error.statusCode < 500) {
          return false;
        }

        // 5xx errors: retry up to 2 times
        return failureCount < 2;
      },

      // Other defaults
      staleTime: 60000, // 60 seconds - data fresh for 1 minute
      gcTime: 5 * 60 * 1000, // 5 minutes - cleanup unused data
      refetchOnWindowFocus: true, // Refresh when app regains focus
      refetchOnReconnect: true, // Refresh when network reconnects
      refetchOnMount: "stale", // Refresh stale data on component mount
    },
  },
};
```

### Error States Available in Component

After a query finishes (or during loading), React Query provides these error-related states:

```typescript
const query = useQuery(options);

// Error values:
query.error; // The AppError instance (or generic Error)
query.isError; // true if error occurred
query.isLoadingError; // true if error during initial fetch
query.isRefetchError; // true if error during background refetch
query.failureCount; // Number of failed attempts
query.failureReason; // The error (same as query.error)

// Status values:
query.status; // 'loading' | 'error' | 'success'
query.fetchStatus; // 'idle' | 'fetching' | 'paused'
query.isPending; // Same as status === 'loading'
query.isLoading; // First load (isPending && fetchStatus === 'fetching')
query.isFetching; // Any fetch in progress
```

### Using Error States in Components

**Example 1: Handle all cases**

```typescript
const query = useQuery(getProductsQueryOptions());

if (query.isPending) return <LoadingSpinner />;

if (query.isLoadingError) {
  // Error during initial fetch
  return <ErrorBlock error={query.error} />;
}

if (query.isRefetchError) {
  // Error during background refetch, show notification
  return (
    <>
      <ProductList data={query.data} />
      <Toast severity="warning">
        Failed to refresh: {query.error?.message}
      </Toast>
    </>
  );
}

return <ProductList data={query.data} />;
```

**Example 2: Throw errors to boundary**

```typescript
// With throwOnError: true, errors from critical codes
// are automatically thrown to ErrorBoundary
const query = useQuery(getCriticalDataOptions());

// If query fails with UNAUTHORIZED:
// - React Query throws error
// - ErrorBoundary catches it
// - Component doesn't render

if (query.isPending) return <Loading />;
return <Content data={query.data} />;
```

### throwOnError Behavior

`throwOnError` controls whether errors are thrown to ErrorBoundary or stored in query state:

**When `throwOnError: true` (conditional function):**

```
Error occurs in query
    ↓
Check: isCriticalError(error)?
    ├─ YES → Throw error
    │        ↓
    │        ErrorBoundary catches
    │        ↓
    │        Component doesn't render (error UI shown)
    │
    └─ NO → Store in query.error
            ↓
            Component can read query.error
            ↓
            Component renders with error UI inline
```

**When `throwOnError: false`:**

```
Error occurs in query
    ↓
Error stored in query.error
    ↓
Component re-renders
    ↓
Component can access query.error and query.isError
    ↓
Component renders error UI inline (or retries)
```

---

# PART 5: TARGET STATE

## Target State (v2 with Middleware)

This section describes the **proposed future architecture** with React Router v7 middleware for centralized error handling.

### What Middleware Adds

**React Router v7 Middleware** provides:

1. **Centralized Error Context** - Shared error state across routes
2. **Request/Response Interception** - Process all errors in one place
3. **Pre-Route Processing** - Validate auth, load critical data before component renders
4. **Error Transformation** - Consistent error formatting/logging
5. **Cross-Route Concerns** - Handle auth, logging, timing in middleware

### Target Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                  PROPOSED ARCHITECTURE (v2)                        │
├────────────────────────────────────────────────────────────────────┤
│  Middleware Layer                                                  │
│  ├─ Error Context (type-safe context)                            │
│  ├─ Root Middleware (catch-all error handler)                    │
│  └─ Feature Middleware (route-specific handlers)                 │
│     └─ STATUS: 🔄 Proposed                                       │
│                                                                    │
│  + Existing Layers 1-5 (unchanged)                               │
│     ├─ ErrorBoundaries (error UI)                                │
│     ├─ Axios Interceptor (classification)                        │
│     └─ React Query (retry logic)                                 │
└────────────────────────────────────────────────────────────────────┘
```

### How Middleware Integrates with Current System

**Current flow:**

```
HTTP Error → Axios → AppError → React Query → ErrorBoundary
```

**With middleware:**

```
HTTP Error → Axios → AppError → React Query → Middleware (intercept) → ErrorBoundary
```

**Middleware processes:**

- Error classification verification
- Error context assignment
- Logging and monitoring
- Conditional retry or transformation
- Boundary selection (which boundary should handle?)

### Implementation Pattern (5 Steps)

**Step 1: Create error context**

```typescript
import { createContext } from "react";
import type { AppError } from "@repo/domain";

interface ErrorHandler {
  processError(error: AppError): Promise<void>;
  logError(error: AppError): void;
}

export const errorContext = createContext<ErrorHandler | null>(null);
```

**Step 2: Create root middleware**

```typescript
export const errorMiddleware: Route.MiddlewareFunction = async (
  { request, context },
  next,
) => {
  const errorHandler = context.get(errorContext);

  try {
    return await next();
  } catch (error) {
    if (isAppError(error)) {
      // Process error (logging, retry decision, etc.)
      await errorHandler?.processError(error);

      // Check if error should stop navigation
      if (isCriticalError(error)) {
        throw error; // Let ErrorBoundary handle
      }
    }
    throw error;
  }
};
```

**Step 3: Apply middleware to routes**

```typescript
export const routes: Route.Object[] = [
  {
    path: '/',
    middleware: [errorMiddleware],
    element: <Layout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      // Routes inherit error middleware
    ],
  },
];
```

**Step 4: Update ErrorBoundaries**

```typescript
// Access error context in boundaries
export function RouteErrorBoundary() {
  const errorHandler = useContext(errorContext);

  return <ErrorUI {...} />;
}
```

**Step 5: Simplify Axios interceptor**

```typescript
// Move toast logic to middleware
// Axios just classifies and throws
interceptor.response.use(
  (response) => response.data,
  (error) => {
    throw classifyHttpError(error); // That's it!
  },
);
```

---

# PART 6: IMPLEMENTATION ROADMAP

## Migration Strategy

Moving from current state (v1) to target state (v2) can be done in phases:

### Phase 1: Preparation (No code changes)

- [ ] Review error context API
- [ ] Design error middleware strategy
- [ ] Plan middleware integration points

### Phase 2: Add Middleware Infrastructure

- [ ] Create error context type
- [ ] Implement root errorMiddleware
- [ ] Add QueryClientContext for loader prefetching
- [ ] Verify middleware runs correctly

### Phase 3: Move Cross-Cutting Logic

- [ ] Move toast logic from Axios → middleware
- [ ] Move logging logic from components → middleware
- [ ] Add error transformation in middleware

### Phase 4: Optimize Data Loading

- [ ] Use middleware to prefetch critical data
- [ ] Integrate queryClient.ensureQueryData in loaders
- [ ] Reduce initial loading states

### Phase 5: Enhanced Error Handling

- [ ] Implement conditional retry logic in middleware
- [ ] Add error classification verification
- [ ] Add error recovery strategies

### Phase 6: Clean Up

- [ ] Remove redundant error handling in components
- [ ] Simplify Axios interceptor
- [ ] Remove client-side error guards if now in middleware

### Phase 7: Monitor & Refine

- [ ] Monitor error rates and types
- [ ] Gather user feedback on error messages
- [ ] Refine error categories based on real usage

---

# PART 7: REFERENCE & EXAMPLES

## Error Types & Status Codes

### HTTP Status Codes → ErrorCode Mapping

| HTTP Status | ErrorCode           | Meaning           | User Action              |
| ----------- | ------------------- | ----------------- | ------------------------ |
| 400         | VALIDATION_ERROR    | Invalid input     | Fix and retry            |
| 401         | UNAUTHORIZED        | Not authenticated | Log in                   |
| 403         | FORBIDDEN           | Not authorized    | Contact support          |
| 404         | NOT_FOUND           | Resource missing  | Navigate elsewhere       |
| 409         | CONFLICT            | Resource conflict | Refresh and retry        |
| 429         | RATE_LIMITED        | Too many requests | Wait and retry           |
| 500         | INTERNAL_ERROR      | Server error      | Retry or contact support |
| 503         | SERVICE_UNAVAILABLE | Service down      | Retry later              |
| Network     | NETWORK_ERROR       | No connection     | Check network            |

### Error Codes by Category

**Authentication (user action required)**

- UNAUTHORIZED (401)
- INVALID_TOKEN
- TOKEN_EXPIRED
- FORBIDDEN (403)

**Validation (form errors)**

- VALIDATION_ERROR (400/422)
- CONFLICT (409)

**Not Found (resource missing)**

- NOT_FOUND (404)

**Server Issues (possible retry)**

- INTERNAL_ERROR (500)
- SERVICE_UNAVAILABLE (503)
- EXTERNAL_SERVICE_ERROR

**Network Issues (transient)**

- NETWORK_ERROR

## Key Components

### apps/client/src/lib/errors.ts

**Functions:**

- `classifyHttpError(axiosError): AppError` - Classify raw HTTP error
- `isAppError(error): boolean` - Type guard for AppError
- `isCriticalError(error): boolean` - Check if error is critical
- `getErrorMessage(error): string` - Get user-friendly message

### apps/client/src/lib/api-client.ts

**Exports:**

- `getApi(): AxiosInstance` - Lazy-initialize Axios client
- Response interceptor - Classify errors and throw AppError

### apps/client/src/lib/react-query.ts

**Exports:**

- `queryClient: QueryClient` - Configured React Query client
- `useQuery()` - Hook for fetching data (configured with custom defaults)
- Query options - `getProductsQueryOptions()`, etc.

### apps/client/src/components/errors/

**Components:**

- `MainErrorFallback` - Root error boundary UI
- `RouteErrorBoundary` - Route-level error boundary
- `ErrorBlock` - Feature-level error boundary

## Error Flow Examples

### Example 1: Failed Login

```
User enters invalid password
    ↓
Form submission
    ↓
useQuery(loginQueryOptions)
    ↓
POST /auth/login { email, password }
    ↓
Server returns 401 UNAUTHORIZED { code: "UNAUTHORIZED" }
    ↓
Axios interceptor catches response error
    ↓
classifyHttpError() → AppError(UNAUTHORIZED, 401, "Invalid credentials")
    ↓
Throw AppError to React Query
    ↓
React Query sees isCriticalError(error) = true
    ↓
Throw error (throwOnError: true condition met)
    ↓
LoginForm ErrorBoundary catches
    ↓
isCriticalError = true → Re-throw to parent
    ↓
RouteErrorBoundary catches
    ↓
Show: "Invalid email or password"
    ↓
Display login form again
```

### Example 2: 5xx Server Error During Product Load

```
User navigates to /products
    ↓
Route loader calls useQuery(getProductsQueryOptions)
    ↓
GET /api/products
    ↓
Server returns 500 INTERNAL_ERROR
    ↓
Axios interceptor catches
    ↓
Show toast: "Server error. Retrying..."
    ↓
classifyHttpError() → AppError(INTERNAL_ERROR, 500)
    ↓
Throw AppError to React Query
    ↓
React Query: Is 5xx? → Retry (up to 2 times)
    │
    ├─ Retry 1: Still 500
    ├─ Wait 1s
    ├─ Retry 2: Still 500
    ├─ Wait 2s
    └─ Give up
    ↓
throwOnError: false (not critical) → Store in query.error
    ↓
Route loader gets query error
    ↓
Throw error to RouteErrorBoundary
    ↓
Show: "Failed to load products. Please try again."
    ↓
Show retry button
```

### Example 3: Validation Error on Form Submit

```
User submits form with invalid data
    ↓
Form validation component checks fields
    ↓
isMutation(submitFormMutation)
    ↓
POST /api/user/update { ...invalid data }
    ↓
Server returns 422 VALIDATION_ERROR with field errors
    ├─ "email" → "Invalid email format"
    ├─ "age" → "Must be 18 or older"
    └─ "name" → "Required"
    ↓
Axios interceptor catches
    ↓
No toast (4xx error)
    ↓
classifyHttpError() → AppError(VALIDATION_ERROR, 422, "Invalid input")
    ↓
AppError.details = { email, age, name } (field errors)
    ↓
Throw AppError to React Query
    ↓
React Query: Is 4xx? → No retry
    ↓
throwOnError: false → Store in query.error
    ↓
Component can access mutation.error.details
    ↓
Show field-level errors next to inputs
    ↓
User fixes errors and resubmits
```

### Example 4: Network Failure During Background Refetch

```
User viewing product page
    ↓
Component has useQuery(getProductByIdQueryOptions)
    ↓
Data already cached and fresh
    ↓
User loses internet connection
    ↓
Window loses focus and regains focus (refetchOnWindowFocus: true)
    ↓
React Query starts background refetch
    ↓
GET /api/products/:id (no network)
    ↓
Axios throws ERR_NETWORK
    ↓
Axios interceptor catches
    ↓
classifyHttpError() → AppError(NETWORK_ERROR, 503)
    ↓
Show toast: "Network connection lost..."
    ↓
Throw AppError to React Query
    ↓
React Query: Is 5xx/network? → Retry (up to 2x)
    │
    ├─ Retry 1: Still no network
    ├─ Retry 2: Network restored!
    └─ Success
    ↓
Toast updates: "Connection restored!"
    ↓
Data refetches successfully
    ↓
Component shows updated data
```

## Development vs Production Errors

### Development Mode

**Error response includes:**

- Full error message
- Stack trace
- Request/response details
- All validation details
- Internal error codes

**Example:**

```json
{
  "code": "VALIDATION_ERROR",
  "statusCode": 422,
  "message": "Validation failed",
  "details": {
    "email": "Invalid email format",
    "age": "Must be at least 18"
  },
  "stack": "Error: ... at validateForm ..."
}
```

### Production Mode

**Error response includes:**

- User-friendly message only
- Error code (for client-side handling)
- No stack trace or implementation details

**Example:**

```json
{
  "code": "VALIDATION_ERROR",
  "statusCode": 422,
  "message": "Please check your input and try again"
}
```

---

## Open Questions

1. **Should we implement middleware immediately or incrementally?**
   - Pro: Incremental = lower risk
   - Con: Incremental = extended parallel code paths

2. **Should middleware processing be async or sync?**
   - Pro: Async = can call services, write logs
   - Con: Async = delays error handling

3. **What errors should trigger automatic retry in middleware vs React Query?**
   - Current: React Query handles retry
   - Proposed: Could move to middleware for more control

4. **How to handle errors in middleware that occur during prefetch?**
   - Should they block route load or allow navigation?
   - Should they trigger fallback UI or show error page?

5. **Should QueryClientContext be always available or opt-in per route?**
   - Always available = simpler implementation
   - Opt-in = more control, clearer intent

---

**Last Updated:** 2024
**Status:** Current implementation complete (v1), Target state documented (v2)
