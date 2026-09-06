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
- Toast notifications for background/async failures are triggered at the React Query/component layer; Axios stays classification-only

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
│           └─ Re-throws: Critical errors                           │
│           └─ Redirects: Auth failures, to the login page          │
│           └─ STATUS: ✅ Implemented                               │
│                                                                    │
│  Layer 4: API Client (Axios Interceptor)                          │
│           └─ Classifies: HTTP errors → AppError                   │
│           └─ Classification only: no redirects, no UI             │
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
            └─ Reject the raw AxiosError; no classification here
                ↓
            React Query catches the raw AxiosError
                ├─ retry callback: processAxiosError() → read statusCode
                ├─ If 4xx (or a Zod error): No retry
                ├─ Otherwise: Retry up to 2x with backoff
                └─ After retries exhausted OR 4xx: throw the raw error
                   to the ErrorBoundary
                    ↓
                ErrorBoundary catches error
                    ├─ Call normalizeError(error) → AppError
                    ├─ If critical: Re-throw to parent
                    └─ If non-critical: Render error UI inline
                            ↓
                        User sees: Error message + Retry button
```

**Key characteristics of current flow:**

- ✅ Axios is pure transport; it rejects the raw error unclassified
- ✅ React Query handles retry strategy based on the classified status code
- ✅ All errors normalized via `normalizeError()` before processing
- ✅ Components/queries decide toast and UI handling
- ✅ Errors bubble to appropriate boundary
- ✅ TypeScript guard functions for safe error handling
- ✅ Clear separation of concerns (transport, retry, UI)
- ✅ Zod validation errors handled consistently
- ❌ No centralized middleware for cross-cutting concerns
- ❌ No uniform error context across app

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
- Redirects auth failures to the login page
- Re-throws critical errors to parent
- Keeps rest of app functional

**Code:** `apps/client/src/components/errors/error-block.tsx`

**Classification rule:**

- Catches error and checks `isAuthError(error)` first
- If YES → Render `RedirectToLogin` (no retry button; a retry would reuse the
  same dead cookie)
- Otherwise checks `isCriticalError(error)`
- If YES → Re-throw (bubbles to RouteErrorBoundary)
- If NO → Handle locally with inline UI

#### Layer 4: Axios Interceptor (API Client)

**Location:** HTTP request/response boundary

**Purpose:** Transport only; no business logic

**Catches:**

- HTTP errors (any status code)
- Network failures
- Request/response errors

**Behavior:**

- For all errors: Throws raw HTTP error (no classification)
- No toasts, no retries, no UI decisions
- Pure transport: just passes error up

**Code:** `apps/client/src/lib/api-client.ts`

#### Layer 5: React Query

**Location:** Data fetching layer

**Purpose:** Cache management and retry logic

**Catches:**

- Raw HTTP errors from Axios
- Network errors
- Retry failures

**Behavior:**

- Classifies error: `processAxiosError(error)` → `AppError`, then reads only
  its `statusCode`; the `AppError` itself is discarded
- Decides retry from that status:
  - 4xx errors, and client-side Zod errors: No retry (fail fast)
  - Everything else: Retry up to 2x with exponential backoff
- Throws the **raw** error to ErrorBoundary (if `throwOnError: true`), which
  normalizes it there
- Stores the raw error in query state (if `throwOnError: false`)
- Does NOT handle toasts; components decide

**Code:** `apps/client/src/lib/react-query.ts`

### Error Normalization (Single Entry Point)

All errors are normalized through a **single entry point** before any processing:

```typescript
// lib/errors/errors.ts
export function normalizeError(error: unknown): AppError {
  if (isAxiosError(error)) {
    return processAxiosError(error); // HTTP classification
  } else if (error instanceof ZodError) {
    // Validation errors from forms
    const message = `Validation failed: ${error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ")}`;
    // Status omitted: AppError derives it from ERROR_CODE_TO_STATUS (422)
    return new AppError(
      message,
      ErrorCode.VALIDATION_ERROR,
      undefined,
      error.issues,
    );
  } else if (error instanceof Error) {
    return new AppError(
      error.message,
      ErrorCode.INTERNAL_ERROR,
      500,
      undefined,
      error.stack,
    );
  } else if (typeof error === "string") {
    return new AppError(error, ErrorCode.INTERNAL_ERROR, 500);
  }
  return new AppError(
    "An unknown error occurred",
    ErrorCode.INTERNAL_ERROR,
    500,
  );
}
```

**Handles:**

- ✅ Axios errors (network, HTTP status, timeouts)
- ✅ Zod validation errors (field-level details)
- ✅ JavaScript errors (stack trace preservation)
- ✅ String errors (edge cases)
- ✅ Unknown types (fallback)

**All error boundaries call `normalizeError()` before checking criticality or displaying UI.**

### Practical Error Handling Patterns

#### Pattern 1: Critical Data in Loaders (Fail-Fast)

**Use when:** Data is required for page to render meaningfully

```typescript
// src/routes/product/[id].tsx
export const loader = async (context: LoaderFunctionArgs) => {
  const queryClient = context.get(queryClientContext);

  try {
    // ensureQueryData blocks render until successful
    // throwOnError: true throws on failure → RouteErrorBoundary
    return await queryClient.ensureQueryData(
      getProductByIdQueryOptions(id)
    );
  } catch (error) {
    // Normalize and throw for RouteErrorBoundary
    throw normalizeError(error);
  }
};

export const route = {
  loader,
  errorElement: <RouteErrorBoundary />,
};
```

**Why this works:**

- ✅ Explicit: We declare "this data is critical"
- ✅ Blocking: Page doesn't render until it succeeds
- ✅ Fail-fast: RouteErrorBoundary catches immediately
- ✅ Full-page error: User sees comprehensive error UI with navigation options

---

#### Pattern 2: Non-Critical Data in Components (Graceful Degradation)

**Use when:** Data is optional/supplementary; page can function without it

```typescript
// src/components/featured-product.tsx
const FeaturedProduct = () => {
  // useSuspenseQuery throws to nearest boundary (SafeRenderWithErrorBlock)
  const { data: product } = useSuspenseQuery(
    getProductByIdQueryOptions(featuredId)
  );

  return <ProductCard product={product} />;
};

export default FeaturedProduct;
```

**Wrapped with SafeRenderWithErrorBlock:**

```typescript
// src/components/page-sections/featured-section.tsx
export const FeaturedSection = () => {
  return (
    <SafeRenderWithErrorBlock
      title="Featured Product"
      spinnerClasses="h-40"
    >
      <FeaturedProduct />
    </SafeRenderWithErrorBlock>
  );
};
```

**Why this works:**

- ✅ Graceful degradation: Error shows inline instead of breaking whole page
- ✅ User choice: User can retry just this section
- ✅ Non-blocking: Rest of page still renders
- ⚠️ **Defensive re-throw**: If error is critical (forgot to handle in loader), SafeRenderWithErrorBlock rethrows to RouteErrorBoundary

**SafeRenderWithErrorBlock behavior:**

1. Catch error from child component
2. Call `normalizeError(error)` → consistent AppError
3. Check `isAuthError(normalizedError)` → render `RedirectToLogin`
   - The session is dead; a "Retry" button would refetch with the same cookie
4. Check `isCriticalError(normalizedError)` → DEFENSIVE re-throw
   - ⚠️ **This is a safety net**: Critical errors should fail in loaders
   - If we reach here, we forgot to handle something → rethrow to RouteErrorBoundary
5. For everything else: Render ErrorBlock with title, message, "Retry" button

---

#### Pattern 3: Prefetching (Fire-and-Forget)

**Use when:** Optimizing navigation by preloading data on hover/focus

```typescript
// src/components/product-card.tsx
const handleMouseEnter = () => {
  // Fire-and-forget: silently load data
  // throwOnError: false → errors logged only
  queryClient.prefetchQuery(getProductByIdQueryOptions(productId));
};

const handleFocus = () => {
  // Accessibility: same behavior for keyboard navigation
  queryClient.prefetchQuery(getProductByIdQueryOptions(productId));
};

<Link
  to={`/products/${productId}`}
  onMouseEnter={handleMouseEnter}
  onFocus={handleFocus}
>
  {product.name}
</Link>
```

**Why this works:**

- ✅ Non-blocking: Doesn't affect UI if it fails
- ✅ Silent failure: Errors logged but not shown
- ✅ Optional data: If prefetch succeeds, navigation is instant; if it fails, loader handles it normally
- ✅ Accessibility: Both mouse and keyboard users benefit

---

#### Pattern 4: Form Submission Error Handling

**Use when:** Handling errors from user-initiated actions (forms, mutations)

```typescript
const ContactForm = () => {
  const [error, setError] = useState<AppError | null>(null);

  const handleSubmit = async (formData: unknown) => {
    try {
      setError(null);
      await submitContactForm(formData);
    } catch (error) {
      const normalized = normalizeError(error);
      setError(normalized);  // Show inline error
    }
  };

  return (
    <>
      {error && <ErrorBlock message={error.message} />}
      <form onSubmit={handleSubmit}>
        {/* form fields */}
      </form>
    </>
  );
};
```

**Why this works:**

- ✅ Explicit error state: Form controls when/how to show errors
- ✅ Inline feedback: User sees error next to form
- ✅ Normalized: Uses same error format as rest of app
- ✅ No boundary throw: Validation errors don't break page

---

**Code:** `apps/client/src/lib/react-query.ts`

---

# PART 2: ERROR CLASSIFICATION

## Error Classification Strategy

Errors are classified early at the API boundary by `normalizeError()`, which delegates axios failures to `processAxiosError()`, converting raw HTTP responses into typed `AppError` with semantic `ErrorCode` values.

**Why classification matters:**

- **Code-first approach**: Server provides semantic error type; we don't guess from status
- **No status-code fallback**: a response without a usable `code` becomes `INTERNAL_ERROR, 500`; the status is never consulted
- **Type safety**: All errors are `AppError` with known `ErrorCode` and `statusCode`
- **Consistency**: Same classification logic across all endpoints

### Classification Decision Tree

```
normalizeError(error)
    │
    ├─ error instanceof AppError?
    │   └─ YES → return it unchanged (already normalized)
    │
    ├─ isAxiosError(error)?
    │   └─ YES → processAxiosError(error) → see tree below
    │
    ├─ isClientZodError(error)?
    │   └─ YES → AppError(VALIDATION_ERROR)
    │            status omitted; derived from ERROR_CODE_TO_STATUS
    │
    ├─ error instanceof Error?
    │   └─ YES → AppError(INTERNAL_ERROR)
    │
    ├─ typeof error === "string"?
    │   └─ YES → AppError(INTERNAL_ERROR)
    │
    └─ anything else → AppError(INTERNAL_ERROR, 500)
```

`processAxiosError` has exactly three outcomes, checked in this order. There is no `switch` on `error.code` and no status-code ladder:

```
processAxiosError(error)
    │
    ├─ error.code === "ERR_NETWORK"  OR  error.response is absent?
    │   └─ YES → AppError(EXTERNAL_SERVICE_ERROR, 503)
    │            "Network connection failed. Please check your
    │             internet connection."
    │
    ├─ error.code === "ERR_BAD_RESPONSE" or "ERR_BAD_REQUEST"?
    │   │        (a response exists here — branch 1 returned if it did not)
    │   │
    │   └─ YES → is error.response.data.error a well-formed AppError?
    │            isAppError(): code is a known ErrorCode, statusCode is a
    │            number, message is a string
    │            │
    │            ├─ YES → pass the server's error through unchanged:
    │            │        AppError(message, code, statusCode, details)
    │            │
    │            └─ NO → fall through to the catch-all below
    │
    └─ everything else → AppError(INTERNAL_ERROR, 500)
                         "Something went very wrong!"
```

**The pass-through branch is the only source of semantic codes.** `VALIDATION_ERROR 422`, `NOT_FOUND 404` and `UNAUTHORIZED 401` do reach the client, but they are read out of the response body — the client never derives a code from the HTTP status. A 404 from something that is not our API (a proxy, a CDN error page) carries no `data.error`, fails `isAppError`, and becomes `INTERNAL_ERROR, 500`.

**Every other axios code is unhandled.** Codes such as `ETIMEDOUT` or `ERR_CANCELED` reach the 503 branch only because they usually arrive with no `error.response`; when a response is present they land on the `INTERNAL_ERROR, 500` catch-all.

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
// Module-private: used inside processAxiosError, never exported
isAppError(error): boolean

// Check if error is critical (should bubble to parent boundary)
isCriticalError(error): boolean
// Critical: INTERNAL_ERROR, EXTERNAL_SERVICE_ERROR, or any statusCode >= 500

// Check if the session is dead (should redirect to login)
isAuthError(error): boolean
// Auth: UNAUTHORIZED, INVALID_TOKEN, TOKEN_EXPIRED
// NOT INVALID_CREDENTIALS - a rejected login is not an expired session
```

The module exports exactly five things: `isClientZodError`, `processAxiosError`,
`isCriticalError`, `isAuthError` and `normalizeError`.

The two predicates are disjoint and neither subsumes the other: a critical error
means the route cannot render, an auth error means the route could render for
somebody who is signed in.

**Axios Error Codes Reference:**

`processAxiosError` matches three `error.code` values and ignores the rest:

- `ERR_NETWORK` - no internet connection or network failure → 503 branch
- `ERR_BAD_RESPONSE` - a 5xx response → pass-through branch
- `ERR_BAD_REQUEST` - a 4xx response → pass-through branch

Both pass-through codes only carry the server's error forward when `response.data.error` satisfies `isAppError`; otherwise they fall to the `INTERNAL_ERROR, 500` catch-all, as does every unmatched code (`ECONNABORTED`, `ETIMEDOUT`, `ERR_CANCELED`, `ERR_FR_TOO_MANY_REDIRECTS`, `ERR_INVALID_URL`, `ERR_BAD_OPTION`, `ERR_BAD_OPTION_VALUE`, `ERR_DEPRECATED`, `ERR_NOT_SUPPORT`) that arrives with a response.

**Code reference:** [apps/client/src/lib/errors/errors.ts](apps/client/src/lib/errors/errors.ts) and [axios documentation](https://axios-http.com/docs/intro)

---

# PART 3: ERROR HANDLING STRATEGY

## ErrorBoundary Hierarchy Decision Tree

Errors flow through the boundary hierarchy based on their criticality:

```
Error Occurs in Component
    │
    ├─ Component-level ErrorBoundary (ErrorBlock)
    │   │
    │   ├─ isAuthError(error)?
    │   │   ├─ YES → Render RedirectToLogin
    │   │   │        Auth when the code is:
    │   │   │        - UNAUTHORIZED (no or unusable session)
    │   │   │        - INVALID_TOKEN (cookie does not verify)
    │   │   │        - TOKEN_EXPIRED (cookie outlived its JWT)
    │   │   │        Clears the cached auth status, then navigates to
    │   │   │        /auth/login?redirectTo=<current location>
    │   │   │
    │   │   └─ NO → fall through
    │   │
    │   ├─ isCriticalError(error)?
    │   │   ├─ YES → Re-throw to parent (RouteErrorBoundary)
    │   │   │        Critical when the code is:
    │   │   │        - INTERNAL_ERROR (server error from a loader/API)
    │   │   │        - EXTERNAL_SERVICE_ERROR (network failure)
    │   │   │        or when statusCode >= 500, whatever the code
    │   │   │
    │   │   └─ NO → Handle locally
    │   │            Display: title, message, retry button
    │   │            Examples: 404 Not Found, 422 Validation Error,
    │   │                      401 INVALID_CREDENTIALS
    │
    ├─ Route-level ErrorBoundary (RouteErrorBoundary)
    │   │
    │   ├─ isRouteErrorResponse()?
    │   │   └─ YES → Handle React Router errors
    │   │            - Status 404 → "Page Not Found"
    │   │            - Status 400 → "Bad Request"
    │   │
    │   ├─ Anything else → normalizeError(error) → AppError
    │   │   └─ Extract statusCode and message
    │   │            - isAuthError() → RedirectToLogin
    │   │            - Code NOT_FOUND → title: "Not Found"
    │   │            - isCriticalError() → title: "Critical Application Error"
    │   │              (message sanitized)
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

Toasts are used for **background/async errors that don't block navigation** and are triggered by React Query/component handlers (Axios does not emit toasts):

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

**Implementation:** Triggered in React Query/component error handlers; `api-client` is classification-only

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
            ErrorBoundary catches (checks isAuthError, then isCriticalError)
            ↓
            If auth: Redirect to login
            If critical: Show error page
            Otherwise: ErrorBlock handles locally
```

**Why throw all errors?**

- Simpler error handling flow (ErrorBoundary hierarchy handles all cases)
- Avoids duplicate error handling in every component
- ErrorBoundary's `isAuthError()` / `isCriticalError()` checks determine final behavior
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

### Environment Initialization Pattern

Environment variables must be validated at app startup within the ErrorBoundary scope so that validation errors can be properly caught and displayed.

**Implementation: `InitializeEnv` Component**

```typescript
// apps/client/src/config/env.ts
export const InitializeEnv = () => {
  initializeEnv(); // Validates env and throws AppError if invalid
  return null;
};
```

**Usage: Independent component inside ErrorBoundary**

```typescript
// apps/client/src/app/provider.tsx
export const AppProvider = ({ children }: AppProviderProps) => {
  return (
    <React.Suspense fallback={<Spinner />}>
      <ErrorBoundary FallbackComponent={MainErrorFallback}>
        <InitializeEnv /> {/* Standalone component, no children */}
        <QueryClientProvider client={queryClient}>
          {/* ... rest of providers ... */}
          {children}
        </QueryClientProvider>
      </ErrorBoundary>
    </React.Suspense>
  );
};
```

**How it works:**

1. `AppProvider` wraps everything in `ErrorBoundary`
2. `InitializeEnv` is rendered inside the boundary as a standalone component
3. If `initializeEnv()` throws `AppError`, the boundary catches it
4. `MainErrorFallback` displays the validation error to the user
5. `QueryClientProvider` and children are not rendered until env is valid

**Why this pattern:**

- ✅ Simple and declarative (component inside boundary)
- ✅ No need for wrapper components or higher-order functions
- ✅ Clear separation of concerns (initialization vs providers)
- ✅ Reusable for other initialization logic (e.g., `InitializeAuth`, `InitializeTheme`)

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
// Axios just classifies and throws (no toasts here)
// Toasts are handled in React Query/component error paths
interceptor.response.use(
  (response) => response.data,
  (error) => {
    throw processAxiosError(error); // That's it!
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

- [ ] Toasts handled in React Query/components (Axios classification-only)
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
| 422         | VALIDATION_ERROR       | Invalid input           | Fix and retry            |
| 401         | UNAUTHORIZED           | Not authenticated       | Log in                   |
| 401         | INVALID_TOKEN          | Cookie does not verify  | Log in                   |
| 401         | TOKEN_EXPIRED          | Cookie outlived its JWT | Log in                   |
| 401         | INVALID_CREDENTIALS    | Login attempt rejected  | Correct the form         |
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

The first three are what `isAuthError` matches: the session is dead and a
redirect to login fixes it. `FORBIDDEN` is not — the session is fine, the user
just may not do this — and neither is `INVALID_CREDENTIALS`, which belongs to
the login form.

**Validation (form errors)**

- VALIDATION_ERROR (422)

**Not Found (resource missing)**

- NOT_FOUND (404)

**Server Issues (possible retry)**

- INTERNAL_ERROR (500)
- SERVICE_UNAVAILABLE (503)
- EXTERNAL_SERVICE_ERROR (network/5xx)

## Key Components

### apps/client/src/lib/errors/errors.ts

**Exports:**

- `normalizeError(error): AppError` - Single entry point; normalizes any error
- `processAxiosError(axiosError): AppError` - Classify an Axios error
- `isClientZodError(error): error is ZodError` - Type guard for Zod errors
- `isCriticalError(error): boolean` - Check if error is critical
- `isAuthError(error): boolean` - Check if the session is dead

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
- `SafeRenderWithErrorBlock` - Suspense + ErrorBoundary wrapper around a feature
- `RedirectToLogin` - Clears the cached auth status, then navigates to login

## Error Flow Examples

### Example 1: Failed Login

A rejected login never reaches an error boundary: it is a mutation, and the form
reports it itself.

```
User enters invalid password
    ↓
POST /auth/login { email, password }
    ↓
Server returns 401 with { error: { code: "INVALID_CREDENTIALS", ... } }
    (and clears the jwt cookie)
    ↓
Axios interceptor rejects the raw AxiosError (code ERR_BAD_REQUEST)
    ↓
useLogin mutation: onError runs (mutations do not use throwOnError)
    ↓
LoginForm calls normalizeError() → processAxiosError()
    ↓
Pass-through branch: response.data.error is a well-formed AppError
    ↓
AppError(INVALID_CREDENTIALS, 401, "Invalid email or password")
    (the code comes from the response body, never from the 401 status)
    ↓
Show: a destructive toast, "Login Failed" + the server's message
    ↓
The user stays on the form and can try again
```

`INVALID_CREDENTIALS` is a 401 but is deliberately **not** an auth error by
`isAuthError`. Signing in again is exactly what the user is already doing;
redirecting them to the login page they are standing on would be a loop.

### Example 1b: Expired Session on a Protected Query

```
User's cookie outlives its JWT (or the signing secret rotated)
    ↓
Cached auth status still says isAuthenticated: true (staleTime: Infinity)
    ↓
UserAreaLayout renders, useSuspenseQuery(getUserQueryOptions)
    (in the component body, ABOVE the SafeRenderWithErrorBlock it renders,
     so that boundary cannot catch this one)
    ↓
GET /api/v1/users/me
    ↓
Server returns 401 with { error: { code: "TOKEN_EXPIRED", ... } }
    ↓
React Query retry callback: 401 → 4xx, no retry
    ↓
throwOnError: true → Throw past the layout to the route errorElement,
                     RouteErrorBoundary on the /account subtree
    ↓
normalizeError() → AppError(TOKEN_EXPIRED, 401)
    ↓
Check: isAuthError(error)? → YES
    ↓
RedirectToLogin: write isAuthenticated: false into the auth status cache,
                 null the cached user, THEN navigate
    (order matters - the auth layout's loader reads that cached status and
     would bounce a stale `true` straight back to /account)
    ↓
Navigate to /auth/login?redirectTo=/account/profile
    ↓
User signs in; LoginForm reads redirectTo and returns them to /account/profile
```

### Example 2: 5xx Server Error During Product Load

```
User navigates to /products
    ↓
Route loader calls useQuery(getProductsQueryOptions)
    ↓
GET /api/products
    ↓
Server returns 500 with { error: { code: "INTERNAL_ERROR", ... } }
    ↓
Axios interceptor rejects the raw AxiosError (code ERR_BAD_RESPONSE)
    ↓
React Query retry callback: processAxiosError() → 500 → not 4xx, retry
    │
    ├─ Retry 1: Still 500
    ├─ Wait 1s
    ├─ Retry 2: Still 500
    ├─ Wait 2s
    └─ Give up (failureCount === 2), still errored
    ↓
throwOnError: true → Throw the raw AxiosError to the ErrorBoundary
    ↓
ProductList ErrorBoundary catches, calls normalizeError()
    ↓
Pass-through branch → AppError(INTERNAL_ERROR, 500)
    ↓
Check: isCriticalError(error)? → YES
       INTERNAL_ERROR is in criticalCodes, and 500 >= 500
    ↓
Re-throw to parent (RouteErrorBoundary)
    ↓
Show: "Critical Application Error", message sanitized to
      "A critical error occurred. Please try again later."
```

### Example 3: Validation Error on Form Submit

```
User submits form with invalid data
    ↓
Form validation component checks fields
    ↓
useMutation(submitFormMutation) with throwOnError: false
    ↓
POST /api/user/update { ...invalid data }
    ↓
Server returns 422 with { error: { code: "VALIDATION_ERROR", details: [...] } }
    ├─ "email" → "Invalid email format"
    ├─ "age" → "Must be 18 or older"
    └─ "name" → "Required"
    ↓
Axios interceptor rejects the raw AxiosError (code ERR_BAD_REQUEST)
    ↓
Mutation rejects; no retry (mutations do not retry by default)
    ↓
Component catches and calls normalizeError()
    ↓
Pass-through branch → AppError(VALIDATION_ERROR, 422, "Invalid input")
    with details carried over from the response body
    (the code comes from the body, never from the 422 status)
    ↓
Check: isCriticalError(error)? → NO
       VALIDATION_ERROR is not in criticalCodes, and 422 < 500
    ↓
Handle locally: branch on error.code, read error.details
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
Axios throws ERR_NETWORK (no error.response)
    ↓
Axios interceptor rejects the raw AxiosError
    ↓
React Query retry callback: processAxiosError() → 503 → not 4xx, retry
    │
    ├─ Retry 1: Still no network
    ├─ Wait 1s
    ├─ Retry 2: Network restored!
    └─ Success
    ↓
Data refetches successfully; no error ever reaches a boundary
    ↓
Component shows updated data
```

Had the retries been exhausted instead, the boundary's `normalizeError()`
would produce `AppError(EXTERNAL_SERVICE_ERROR, 503)`, and
`isCriticalError()` returns **YES** for it — it is in `criticalCodes`, and
503 >= 500 — so the error re-throws to `RouteErrorBoundary` rather than
rendering inline.

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

**Valid scenario:** For `VALIDATION_ERROR` (422) responses on form submissions, include `details` field in production to show field-level error messages to the user.

**When to include `details`:**

✅ `VALIDATION_ERROR` (422): Include field-level messages for form errors  
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
- 422 validation error responses
- 500/503 server error with retry
- 401 auth redirect
- Loader function failures
- Component render errors
- Concurrent multiple failures

---

**Last Updated:** September 6, 2026
**Status:** Current implementation complete (v1), Target state documented (v2)
