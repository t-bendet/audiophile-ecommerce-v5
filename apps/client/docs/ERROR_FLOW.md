# Error Flow in Client Application

## Table of Contents

1. [Overview](#overview)
2. [PART 1: Current State (v1)](#part-1-current-state)
3. [PART 2: Error Classification](#part-2-error-classification)
4. [PART 3: Error Handling Strategy](#part-3-error-handling-strategy)
5. [PART 4: React Query Integration](#part-4-react-query-integration)
6. [PART 5: Target State (v2 with Middleware)](#part-5-target-state)
7. [PART 6: Implementation Roadmap](#part-6-implementation-roadmap)
8. [PART 7: Reference & Examples](#part-7-reference--examples)

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
            ├─ If network: Classify to AppError(EXTERNAL_SERVICE_ERROR)
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

**Code:** `apps/client/src/components/errors/main.tsx`

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

**Code:** `apps/client/src/components/errors/ErrorBlock.tsx`

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
Error Received
    │
    ├─ Is Axios Error (use isAxiosError())?
    │   └─ NO → Handle as generic Error
    │
    └─ YES → Check axios error code
        │
        ├─ Network/Transport Errors?
        │   ├─ ERR_NETWORK → No internet connection
        │   ├─ ECONNABORTED → Connection aborted
        │   ├─ ETIMEDOUT → Request timeout
        │   ├─ ERR_BAD_RESPONSE → Invalid response format
        │   └─ Result: AppError(EXTERNAL_SERVICE_ERROR, 503)
        │
        ├─ Request Errors?
        │   ├─ ERR_BAD_REQUEST → Malformed request
        │   ├─ ERR_INVALID_URL → Invalid URL
        │   ├─ ERR_BAD_OPTION → Invalid axios config
        │   └─ Result: AppError(BAD_REQUEST, 400)
        │
        ├─ Axios Config Errors?
        │   ├─ ERR_BAD_OPTION_VALUE → Invalid config value
        │   ├─ ERR_DEPRECATED → Deprecated feature used
        │   └─ Result: AppError(INTERNAL_ERROR, 500)
        │
        ├─ Redirect/Cancellation Errors?
        │   ├─ ERR_FR_TOO_MANY_REDIRECTS → Too many redirects
        │   ├─ ERR_CANCELED → Request cancelled
        │   └─ Result: AppError(OPERATION_FAILED, 500 or skip)
        │
        ├─ HTTP Response Exists?
        │   │
        │   ├─ Server provided custom code field?
        │   │   ├─ YES → Map code to ErrorCode enum
        │   │   │        Examples: "VALIDATION_ERROR", "NOT_FOUND", "UNAUTHORIZED"
        │   │   │
        │   │   └─ NO → Fall back to status code
        │   │
        │   ├─ Status 400 or 422?
        │   │   └─ AppError(VALIDATION_ERROR, 400)
        │   │       "Please check your input..."
        │   │
        │   ├─ Status 401?
        │   │   └─ AppError(UNAUTHORIZED, 401)
        │   │       "Please log in to continue..."
        │   │
        │   ├─ Status 403?
        │   │   └─ AppError(FORBIDDEN, 403)
        │   │       "You don't have permission..."
        │   │
        │   ├─ Status 404?
        │   │   └─ AppError(NOT_FOUND, 404)
        │   │       "Resource not found..."
        │   │
        │   └─ Status 5xx?
        │       └─ AppError(INTERNAL_ERROR, 500)
        │           "Service temporarily unavailable. Retrying..."
        │
        └─ No HTTP Response?
            └─ Already handled by network/transport error check above
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
// Check if error is from axios (before other type checks)
isAxiosError(error): boolean
// Returns true if error originated from axios
// Use this FIRST to differentiate axios-specific errors from generic errors

// Check if error is AppError (vs generic Error)
isAppError(error): boolean

// Check if error is critical (should bubble to parent boundary)
isCriticalError(error): boolean
// Critical codes: UNAUTHORIZED, INVALID_TOKEN, TOKEN_EXPIRED, VALIDATION_ERROR

// Get user-friendly message from error
getErrorMessage(error): string
```

**Axios Error Codes Reference:**

When `isAxiosError(error)` returns true, check `error.code` for:

- **Network/Transport Errors:**
  - `ERR_NETWORK` - No internet connection or network failure
  - `ECONNABORTED` - Connection was aborted
  - `ETIMEDOUT` - Request timeout
  - `ERR_BAD_RESPONSE` - Server responded with invalid data format

- **Request/Configuration Errors:**
  - `ERR_BAD_REQUEST` - Malformed request syntax
  - `ERR_INVALID_URL` - URL is invalid
  - `ERR_BAD_OPTION` - Invalid axios configuration option
  - `ERR_BAD_OPTION_VALUE` - Invalid value for axios option

- **Axios-Specific Errors:**
  - `ERR_FR_TOO_MANY_REDIRECTS` - Too many HTTP redirects
  - `ERR_CANCELED` - Request was cancelled
  - `ERR_DEPRECATED` - Using deprecated axios feature
  - `ERR_NOT_SUPPORT` - Unsupported operation for environment

**Code reference:** [apps/client/src/lib/errors.ts](apps/client/src/lib/errors.ts) and [axios documentation](https://axios-http.com/docs/intro)

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

❌ **404 Not Found**

- Shown as page content
- User must navigate elsewhere

❌ **Other 4xx Errors**

- Field-specific or context-specific handling
- User action required based on error type

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
const queryConfig = {
  queries: {
    // Throw errors to ErrorBoundary (with opt-out for optional data)
    throwOnError: (_error, query) => {
      // Don't throw for certain query keys (e.g., optional data)
      if (query.queryKey[0] === "optional-data") return false;

      // Throw all other errors to ErrorBoundary
      return true;
    },

    // Retry strategy based on error type
    retry: (failureCount, error) => {
      const axiosError = error as { response?: { status: number } };
      const status = axiosError?.response?.status;

      // Don't retry client errors (4xx)
      if (status && status >= 400 && status < 500) {
        return false;
      }

      // Retry server/network errors up to 2 times
      return failureCount < 2;
    },

    // Other defaults
    staleTime: 1000 * 60, // 60 seconds - data fresh for 1 minute
    refetchOnWindowFocus: false, // Don't refresh when app regains focus
    // Note: refetchOnReconnect and refetchOnMount handled by React Query defaults
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

**Current implementation (throws all errors by default):**

```
Error occurs in query
    ↓
Check: Is this "optional-data" query?
    ├─ YES → Store in query.error (don't throw)
    │        ↓
    │        Component can read query.error
    │        ↓
    │        Component renders with error UI inline
    │
    └─ NO → Throw error
            ↓
            ErrorBoundary catches (checks isCriticalError)
            ↓
            If critical: Show error page
            If not critical: ErrorBlock handles locally
```

**Why throw all errors?**

- Simpler error handling flow (ErrorBoundary hierarchy handles all cases)
- Avoids duplicate error handling in every component
- ErrorBoundary's `isCriticalError()` check determines final behavior
- Components can still use `query.error` if they want to handle locally

**When `throwOnError: false` (alternative approach):**

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

### Handling Errors Inline vs Throwing to ErrorBoundary

**Current behavior with `throwOnError: true`:**

With the current global configuration, ALL queries (including regular `useQuery`) will throw errors to the nearest ErrorBoundary. This means you cannot check `query.error` inline:

```typescript
function MyComponent() {
  const query = useQuery(someQueryOptions);

  // ❌ This code never executes because error is thrown before render completes
  if (query.error) {
    return <div>Error: {query.error.message}</div>;
  }

  return <div>{query.data}</div>;
}
```

**The error will be thrown and caught by ErrorBoundary**, preventing inline error handling.

**To handle errors inline within a component:**

**Option 1: Override per-query**

```typescript
const query = useQuery({
  ...someQueryOptions,
  throwOnError: false, // Override global config for this query only
});

// ✅ Now you can check query.error and handle inline
if (query.error) {
  return <div>Error: {query.error.message}</div>;
}
```

**Option 2: Use query metadata for conditional throwing**

Modify your global config to check query metadata:

```typescript
// apps/client/src/lib/react-query.ts
throwOnError: (_error, query) => {
  // Don't throw for queries marked for inline error handling
  if (query.meta?.inlineErrors) return false;

  // Don't throw for optional data
  if (query.queryKey[0] === "optional-data") return false;

  // Throw all others to ErrorBoundary
  return true;
};
```

Then mark queries that need inline error handling:

```typescript
const query = useQuery({
  ...someQueryOptions,
  meta: { inlineErrors: true }, // Signal: handle errors inline
});

// ✅ Now error is stored in query.error, not thrown
if (query.error) {
  return <div>Error: {query.error.message}</div>;
}
```

**When to use each approach:**

- **Throw to ErrorBoundary (throwOnError: true):**
  - Critical errors that should prevent component rendering
  - When using Suspense boundaries
  - Consistent error UI across features
  - Default for most queries

- **Handle inline (throwOnError: false):**
  - Optional/non-critical data
  - Need custom error UI per component
  - Want to show partial data with error message
  - Background refetch errors while showing cached data

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

### Middleware Retry Strategies

Middleware can coordinate retries at the route/navigation level, complementing React Query’s per-query retries.

**Approach 1: Retry route once and invalidate queries**

```typescript
export const errorMiddleware: Route.MiddlewareFunction = async (
  { request, context },
  next,
) => {
  const queryClient = context.get(queryClientContext);
  let attempts = 0;
  const maxAttempts = 2;

  while (attempts <= maxAttempts) {
    try {
      return await next();
    } catch (error) {
      if (!isAppError(error)) throw error;

      // Only retry server/network errors
      if (
        error.statusCode >= 500 ||
        error.code === ErrorCode.EXTERNAL_SERVICE_ERROR
      ) {
        attempts++;
        if (attempts <= maxAttempts) {
          await delay(1000 * attempts); // simple backoff
          queryClient.invalidateQueries(); // refetch failed data
          continue; // retry route load
        }
      }
      throw error; // no retry for 4xx or after max attempts
    }
  }
};
```

**Approach 2: Error-type driven strategy**

```typescript
function shouldRetry(error: AppError): boolean {
  if (error.statusCode >= 400 && error.statusCode < 500) return false; // user action
  return [
    ErrorCode.EXTERNAL_SERVICE_ERROR,
    ErrorCode.SERVICE_UNAVAILABLE,
    ErrorCode.INTERNAL_ERROR,
  ].includes(error.code);
}

export const errorMiddleware: Route.MiddlewareFunction = async ({}, next) => {
  try {
    return await next();
  } catch (error) {
    if (!isAppError(error)) throw error;
    if (!shouldRetry(error)) throw error;

    // Retry with controlled backoff
    await delay(1500);
    return next();
  }
};
```

**Approach 3: Circuit breaker (protect backend)**

```typescript
const circuits = new Map<string, { failures: number; lastFailure: number }>();

export const errorMiddleware: Route.MiddlewareFunction = async (
  { request },
  next,
) => {
  const key = new URL(request.url).pathname;
  const circuit = circuits.get(key) ?? { failures: 0, lastFailure: 0 };

  // Open circuit: too many failures recently
  if (circuit.failures >= 5 && Date.now() - circuit.lastFailure < 60_000) {
    throw new AppError(
      "Service temporarily unavailable. Please try again later.",
      ErrorCode.SERVICE_UNAVAILABLE,
      503,
    );
  }

  try {
    const res = await next();
    circuits.set(key, { failures: 0, lastFailure: 0 });
    return res;
  } catch (error) {
    if (isAppError(error) && error.statusCode >= 500) {
      circuit.failures += 1;
      circuit.lastFailure = Date.now();
      circuits.set(key, circuit);
      // One controlled retry
      await delay(1000 * Math.min(circuit.failures, 3));
      return next();
    }
    throw error;
  }
};
```

**Hybrid: Let React Query handle per-query retries; middleware handles route-level policies**

- React Query: keep `retry` for 5xx/network per query (up to 2 attempts).
- Middleware: log, gate, and optionally retry the entire route once when systemic errors occur.

**Trade-offs (summary):**

- React Query retries: granular, fast; good when only some queries fail.
- Middleware retries: coordinated, broader; good for dependent queries that should succeed together.
- Circuit breaker: prevents thrashing when a route is consistently failing.

### Loader Prefetch Error Handling

Route loaders prefetch critical data **before** the route component renders. Errors in prefetch can either **block navigation** or **allow navigation** with error state in the component.

**Approach 1: Blocking prefetch (fail-fast)**

Throw prefetch errors to block navigation and show error page:

```typescript
export const loader = async ({ context }: LoaderFunctionArgs) => {
  const queryClient = context.get(queryClientContext);

  try {
    // Ensure critical data is loaded; throw if it fails
    await queryClient.ensureQueryData(getProductsQueryOptions());
    return null;
  } catch (error) {
    // Error prevents route load; ErrorBoundary shows error page
    throw error;
  }
};
```

**When to use blocking:**

- Critical data the page cannot function without
- Auth/permission checks (401/403 should block)
- SEO-critical pages that need full data

**Approach 2: Non-blocking prefetch (graceful degradation)**

Catch prefetch errors and allow navigation; component handles missing data:

```typescript
export const loader = async ({ context }: LoaderFunctionArgs) => {
  const queryClient = context.get(queryClientContext);

  // Attempt prefetch but don't block if it fails
  await queryClient.prefetchQuery(getProductsQueryOptions()).catch((error) => {
    console.warn("Prefetch failed, component will handle:", error);
    // Silently continue; component shows loading/retry state
  });

  return null; // Allow navigation regardless of prefetch result
};
```

**When to use non-blocking:**

- Optional/supplementary data (related products, recommendations)
- Data with fallback UI (skeleton, cached data)
- Background loading that's nice-to-have but not critical

**Approach 3: Hybrid (critical + optional)**

Prefetch multiple queries; fail on critical, succeed on optional:

```typescript
export const loader = async ({ context }: LoaderFunctionArgs) => {
  const queryClient = context.get(queryClientContext);

  try {
    // Critical: must succeed
    await queryClient.ensureQueryData(getProductByIdQueryOptions(id));
  } catch (error) {
    // Critical prefetch failed; block navigation
    throw error;
  }

  // Optional: best-effort, don't block
  queryClient.prefetchQuery(getRelatedProductsQueryOptions()).catch(() => {
    console.warn("Related products prefetch failed");
  });

  return null;
};
```

**Error handling in component:**

When using non-blocking prefetch, component receives the query state normally:

```typescript
function ProductPage() {
  const query = useQuery(getProductsQueryOptions());

  if (query.isPending) return <LoadingSpinner />;
  if (query.isError) return <ErrorBlock error={query.error} />;

  // Data loaded (either from prefetch or background fetch)
  return <ProductList data={query.data} />;
}
```

**Decision tree for prefetch strategy:**

```
Is the data essential for page function?
    │
    ├─ YES → Use blocking prefetch
    │        ├─ Throw on prefetch error
    │        └─ ErrorBoundary shows error page
    │
    └─ NO → Use non-blocking prefetch
            ├─ Catch prefetch error silently
            └─ Component loads with query state (loading/error/success)
```

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

| HTTP Status | ErrorCode              | Meaning                 | User Action              |
| ----------- | ---------------------- | ----------------------- | ------------------------ |
| 400         | VALIDATION_ERROR       | Invalid input           | Fix and retry            |
| 401         | UNAUTHORIZED           | Not authenticated       | Log in                   |
| 403         | FORBIDDEN              | Not authorized          | Contact support          |
| 404         | NOT_FOUND              | Resource missing        | Navigate elsewhere       |
| 500         | INTERNAL_ERROR         | Server error            | Retry or contact support |
| 503         | SERVICE_UNAVAILABLE    | Service down            | Retry later              |
| 5xx/Network | EXTERNAL_SERVICE_ERROR | Server/connection issue | Retry                    |

### Error Codes by Category

**Authentication (user action required)**

- UNAUTHORIZED (401)
- INVALID_TOKEN
- TOKEN_EXPIRED
- FORBIDDEN (403)

**Validation (form errors)**

- VALIDATION_ERROR (400/422)

**Not Found (resource missing)**

- NOT_FOUND (404)

**Server Issues (possible retry)**

- INTERNAL_ERROR (500)
- SERVICE_UNAVAILABLE (503)
- EXTERNAL_SERVICE_ERROR (network/5xx)

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
React Query throwOnError: true → Throw error to ErrorBoundary
    ↓
LoginForm ErrorBoundary catches
    ↓
Check: isCriticalError(error)? → YES (UNAUTHORIZED is critical)
    ↓
Re-throw to parent (RouteErrorBoundary)
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
    └─ Give up, still errored
    ↓
throwOnError: true → Throw error to ErrorBoundary
    ↓
ProductList ErrorBoundary catches
    ↓
Check: isCriticalError(error)? → NO (INTERNAL_ERROR is not critical)
    ↓
Render error inline with ErrorBlock
    ↓
Show: "Failed to load products. Please try again."
    ↓
Show retry button
    ↓
User clicks retry → refetch happens
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
throwOnError: true → Throw error to ErrorBoundary
    ↓
Form component ErrorBoundary catches
    ↓
Check: isCriticalError(error)? → YES (VALIDATION_ERROR is critical)
    ↓
Re-throw to parent form boundary
    ↓
Parent can access error.details for field-level errors
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
Stale time (60s) expires
    ↓
Component unmounts and remounts (route change)
    ↓
React Query starts refetch (refetchOnMount: "stale")
    ↓
GET /api/products/:id (no network)
    ↓
Axios throws ERR_NETWORK
    ↓
Axios interceptor catches
    ↓
classifyHttpError() → AppError(EXTERNAL_SERVICE_ERROR, 503)
    ↓
Show toast: "Network connection lost..."
    ↓
Throw AppError to React Query
    ↓
React Query: Is network error? → Retry (up to 2x)
    │
    ├─ Retry 1: Still no network
    ├─ Wait 1s
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

### Production Use Case: Form Validation Details

**Valid scenario:** For `VALIDATION_ERROR` (400/422) responses on form submissions, include `details` field in production to show field-level error messages to the user.

**When to include `details`:**

✅ `VALIDATION_ERROR` (400/422): Include field-level messages for form errors  
❌ `UNAUTHORIZED` (401): No details (no sensitive auth info)  
❌ `FORBIDDEN` (403): No details  
❌ `NOT_FOUND` (404): No details  
❌ `INTERNAL_ERROR` (500): No details (no internal stack traces)

**Production example with `details`:**

```json
{
  "code": "VALIDATION_ERROR",
  "statusCode": 422,
  "message": "Please check your input and try again",
  "details": {
    "email": "Invalid email format",
    "age": "Must be at least 18",
    "password": "Password must be at least 8 characters"
  }
}
```

**Guidelines for `details` in production:**

1. **Sanitize:** Only include user-facing validation messages; no SQL/Prisma errors, stack traces, or internal codes.
2. **Whitelist fields:** Only include form field names; no PII beyond what user entered.
3. **Structure:** Simple `Record<string, string>` with field name → user-friendly message.
4. **Keep it actionable:** Messages should guide users on how to fix the error.

**Server-side implementation (example):**

```typescript
// On validation error, extract Zod/validation errors and shape details
const validationErrors = parseZodError(error); // { email: "...", age: "..." }

throw new AppError(
  "Please check your input and try again",
  ErrorCode.VALIDATION_ERROR,
  422,
  { details: validationErrors }, // Only for VALIDATION_ERROR
);
```

**Client-side handling:**

For form submissions, configure the mutation to handle errors inline and display `details`:

```typescript
const mutation = useMutation({
  mutationFn: submitForm,
  meta: { inlineErrors: true }, // Override global throwOnError for this mutation
});

if (mutation.error?.details) {
  // Render field-level errors from details
  return (
    <>
      {Object.entries(mutation.error.details).map(([field, message]) => (
        <span key={field} className="text-red-500 text-sm">{message}</span>
      ))}
    </>
  );
}
```

Or if `VALIDATION_ERROR` remains critical (thrown to ErrorBoundary), ensure the parent form boundary reads `error.details`:

```typescript
export function FormErrorBoundary({ children, onSubmit }: Props) {
  return (
    <ErrorBoundary
      FallbackComponent={({ error }) => {
        if (isAppError(error) && error.code === ErrorCode.VALIDATION_ERROR) {
          // Pass details to form for field-level rendering
          return <FormWithErrors error={error} details={error.details} />;
        }
        return <ErrorBlock error={error} />;
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
```

---

## Open Questions

1. **Should we implement middleware immediately or incrementally?**
   - ✅ **Decision:** Incremental (lower risk)
   - **Rationale:** Start with Phase 1 (logging, error context). Phase 2+ (retry, rate limiting) when needed. See PART 6: Implementation Roadmap.

2. **Should middleware processing be async or sync?**
   - ✅ **Decision:** Sync first, with design for async expansion
   - **Approach:** Log and classify errors synchronously. Fire-and-forget async for non-blocking operations (telemetry, analytics).

   ```typescript
   // Sync logging + error context
   export async function errorProcessingMiddleware({ request }, next) {
     const start = performance.now();
     const response = await next();

     // Sync: log timing and status
     const duration = performance.now() - start;
     if (!response.ok) {
       const error = await response.json().catch(() => ({}));
       console.error(
         `[${request.method}] ${request.url} - ${response.status} (${duration}ms)`,
       );
     }

     // Fire-and-forget async: send telemetry (doesn't block)
     if (!response.ok && duration > 5000) {
       sendTelemetryAsync({
         method: request.method,
         url: request.url,
         status: response.status,
         duration,
       }).catch(console.error);
     }

     return response;
   }

   // To expand to fully async in future: move sync operations into async context
   // export async function errorProcessingMiddleware({ request }, next) {
   //   const error = await classifyErrorAsync(response); // if needed
   // }
   ```

3. **What errors should trigger automatic retry in middleware vs React Query?**
   - ✅ **Decision:** React Query handles retry (current approach)
   - **Rationale:** React Query already configured with retry strategy. Middleware focuses on logging and error context, not retry logic. Simpler, cleaner separation of concerns.

4. **How to handle errors in middleware that occur during prefetch?**
   - ✅ **Decision:** Allow navigation, trigger fallback UI or error page per critical error strategy
   - **Approach:** Use loader error boundaries + critical/non-critical classification. See PART 5: Loader Prefetch Error Handling.
   - **Pattern:** Blocking errors (auth, critical data) prevent navigation; non-blocking (enrichment data) allow navigation with fallback UI.

5. **Should QueryClientContext be always available or opt-in per route?**
   - ✅ **Decision:** Always available (simpler implementation)
   - **Rationale:** Single provider at root. No per-route configuration. Signal intent via middleware naming and error handling strategy, not context availability.
   - **Pattern:** See PART 5: QueryClientContext Guidance.

---

## Known Gaps in Current Implementation

Based on analysis of the codebase, these areas could be improved:

### ✅ What's Currently Working

1. **Global Error Boundary** - `MainErrorFallback` catches app-level errors
2. **Route Error Boundary** - `RouteErrorBoundary` catches routing errors
3. **Component-level Error Boundaries** - Individual features have error isolation
4. **API Interceptor** - Classifies HTTP errors consistently
5. **Suspense Boundaries** - Used with ErrorBoundary for async loading

### ⚠️ Known Limitations

1. **Loader Errors** - Route loaders may not throw errors that bubble to error boundaries
2. **Optional Data Queries** - Some non-critical queries might not need throwOnError
3. **Layout Components** - Nav/footer have no error isolation (affects whole page)
4. **Related Products** - Error in this section crashes entire page
5. **Zod Validation** - Schema mismatch errors need better user messaging

### Testing Scenarios

When testing error handling, verify:

- Network disconnection and recovery
- 404 invalid routes/product slugs
- 400/422 validation error responses
- 500/503 server error with retry
- 401 auth redirect
- Loader function failures
- Component render errors
- Concurrent multiple failures

---

**Last Updated:** December 17, 2025
**Status:** Current implementation complete (v1), Target state documented (v2)
