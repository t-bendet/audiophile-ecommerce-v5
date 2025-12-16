# Error Flow in Client Application

## Client Error Architecture Overview

```
┌────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LAYERS                          │
├────────────────────────────────────────────────────────────────────┤
│  Layer 1: React ErrorBoundary (MainErrorFallback)                 │
│           └─ Catches: Render errors, initialization errors        │
│                                                                    │
│  Layer 2: React Router ErrorBoundary (RouteErrorBoundary)         │
│           └─ Catches: Route loader errors, navigation errors      │
│                                                                    │
│  Layer 3: Component-level ErrorBoundary (ErrorBlock)              │
│           └─ Catches: Feature-specific errors, query errors       │
│           └─ Re-throws: Critical errors (auth, validation)        │
│                                                                    │
│  Layer 4: API Client (Axios Interceptor)                          │
│           └─ Classifies: HTTP errors → AppError                   │
│           └─ Toasts: Server errors (5xx)                          │
│                                                                    │
│  Layer 5: React Query                                             │
│           └─ Manages: Query errors, retry logic                   │
│           └─ Throws: Errors to boundaries (throwOnError: true)    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Complete Error Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    USER ACTION / PAGE LOAD                          │
└────────────────────────────────┬────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │  React Query Request   │
                    │  (useQuery/useMutation)│
                    └────────┬───────────────┘
                             │
                             ▼
                  ┌──────────────────────────┐
                  │  getApi() - Lazy Init    │
                  │  api-client.ts           │
                  └────┬────────────┬────────┘
                       │            │
              ✅ SUCCESS          ❌ ENV ERROR
                       │            │
                       │            ▼
                       │   ┌─────────────────────┐
                       │   │ throw AppError      │
                       │   │ INTERNAL_ERROR (500)│
                       │   │ "An unexpected      │
                       │   │  error occurred"    │
                       │   └──────┬──────────────┘
                       │          │
                       ▼          │
            ┌──────────────────┐ │
            │  Axios Request   │ │
            │  to Server       │ │
            └────┬─────────────┘ │
                 │                │
    ┌────────────┴────────────┐  │
    │                         │  │
✅ SUCCESS               ❌ ERROR  │
    │                         │  │
    ▼                         ▼  │
┌─────────┐       ┌──────────────────────────┐
│ Return  │       │ Axios Response           │
│ Data    │       │ Interceptor              │
└────┬────┘       │ api-client.ts            │
     │            └──────┬───────────────────┘
     │                   │
     │         ┌─────────┴─────────┐
     │         │                   │
     │    is Cancelled?        Extract Status
     │         │                   │
     │         ▼                   │
     │    Return (ignore)          │
     │                             │
     │              ┌──────────────┴──────────────┐
     │              │                             │
     │         401 Status?                    Other Status
     │              │                             │
     │              ▼                             ▼
     │    ┌─────────────────┐         ┌─────────────────────┐
     │    │ Set redirectTo  │         │ 4xx (400-499)?      │
     │    │ Reject original │         │                     │
     │    └─────────────────┘         └──────┬──────────────┘
     │                                       │
     │                          ┌────────────┴────────────┐
     │                          │                         │
     │                      YES (4xx)                 NO (5xx/Network)
     │                          │                         │
     │                          ▼                         ▼
     │              ┌─────────────────────┐   ┌─────────────────────┐
     │              │ classifyHttpError() │   │ Show Toast          │
     │              │ → AppError          │   │ "An unexpected      │
     │              │ Reject AppError     │   │  error occurred"    │
     │              └──────┬──────────────┘   └──────┬──────────────┘
     │                     │                         │
     │                     │                         ▼
     │                     │              ┌─────────────────────┐
     │                     │              │ classifyHttpError() │
     │                     │              │ → AppError          │
     │                     │              │ Reject AppError     │
     │                     │              └──────┬──────────────┘
     │                     │                     │
     └─────────────────────┴─────────────────────┘
                           │
                           ▼
                ┌──────────────────────────┐
                │  React Query             │
                │  Error Handling          │
                └──────┬───────────────────┘
                       │
                       │ throwOnError: true
                       ▼
            ┌──────────────────────────┐
            │  Should Retry?           │
            │  (react-query.ts)        │
            └──────┬───────────────────┘
                   │
      ┌────────────┴────────────┐
      │                         │
  4xx Status?              5xx/Network?
      │                         │
      ▼                         ▼
  DON'T RETRY              RETRY (max 2)
      │                         │
      └────────┬────────────────┘
               │
               ▼
    ┌──────────────────────────┐
    │  Throw Error to          │
    │  ErrorBoundary           │
    └──────┬───────────────────┘
           │
           ▼
┌────────────────────────────────┐
│  ErrorBoundary Hierarchy       │
└──────┬─────────────────────────┘
       │
       ├─► Component-level ErrorBoundary (ErrorBlock)
       │   │
       │   ├─ isCriticalError()?
       │   │   ├─ YES → Re-throw (bubble up)
       │   │   └─ NO  → Display inline error UI
       │   │
       │   └─ Display: title, message, retry button
       │
       ├─► Route-level ErrorBoundary (RouteErrorBoundary)
       │   │
       │   ├─ isRouteErrorResponse() → 404/400 pages
       │   ├─ isAppError() → Extract statusCode, message
       │   ├─ isCriticalError() → Generic "Critical Error"
       │   └─ Unknown → Generic 500 error
       │   │
       │   └─ Display: statusCode, title, message, back/home buttons
       │
       └─► App-level ErrorBoundary (MainErrorFallback)
           │
           └─ Display: Generic error + refresh button
```

---

## Error Classification Flow (classifyHttpError)

```
Axios Error Received
    │
    ├─ Network Error (ERR_NETWORK or no response)?
    │   └─ YES → AppError(EXTERNAL_SERVICE_ERROR, 503)
    │             "Network connection failed..."
    │
    └─ HTTP Response Error
        │
        ├─ Status 400 or 422?
        │   └─ AppError(VALIDATION_ERROR, status)
        │
        ├─ Status 401?
        │   └─ AppError(UNAUTHORIZED, 401)
        │
        ├─ Status 403?
        │   └─ AppError(FORBIDDEN, 403)
        │
        ├─ Status 404?
        │   └─ AppError(NOT_FOUND, 404)
        │
        └─ Other Status (5xx or unknown)?
            └─ AppError(INTERNAL_ERROR, status ?? 500)
```

---

## ErrorBoundary Hierarchy Decision Tree

```
Error Occurs
    │
    ├─ Component-level ErrorBoundary (ErrorBlock)
    │   │
    │   ├─ isCriticalError(error)?
    │   │   ├─ YES → throw error (bubble to router)
    │   │   │        Critical Codes:
    │   │   │        - UNAUTHORIZED
    │   │   │        - INVALID_TOKEN
    │   │   │        - TOKEN_EXPIRED
    │   │   │        - VALIDATION_ERROR
    │   │   │
    │   │   └─ NO → Display ErrorBlock component
    │   │            - Show title, message
    │   │            - Optional retry button
    │   │            - Inline error UI
    │
    ├─ Route-level ErrorBoundary (RouteErrorBoundary)
    │   │
    │   ├─ isRouteErrorResponse()?
    │   │   └─ YES → Handle React Router errors
    │   │            - Status 404 → "Page Not Found"
    │   │            - Status 400 → "Bad Request"
    │   │            - Use error.statusText
    │   │
    │   ├─ isAppError()?
    │   │   └─ YES → Extract statusCode and message
    │   │            - Status 404 → title: "Not Found"
    │   │            - Other → title: "Request Failed"
    │   │            - Display statusCode, title, message
    │   │
    │   ├─ isCriticalError()?
    │   │   └─ YES → Generic critical error page
    │   │            - title: "Critical Error"
    │   │            - message: "A critical error occurred..."
    │   │
    │   └─ Unknown Error?
    │       └─ Generic 500 error page
    │            - statusCode: 500
    │            - title: "Something went wrong"
    │            - message: getErrorMessage(error)
    │
    └─ App-level ErrorBoundary (MainErrorFallback)
        │
        └─ Display generic error page
             - "Ooops, something went wrong :("
             - Refresh button → reload entire app
```

---

## React Query Configuration

### Query Defaults (react-query.ts)

```typescript
{
  throwOnError: true,     // Throw errors to ErrorBoundary
  refetchOnWindowFocus: false,
  retry: (failureCount, error) => {
    // Don't retry 4xx errors
    if (status >= 400 && status < 500) return false;

    // Retry 5xx/network up to 2 times
    return failureCount < 2;
  },
  staleTime: 60000,      // 1 minute
}
```

### Error Propagation

1. **Query fails** → Axios interceptor classifies error → AppError
2. **React Query** checks retry logic:
   - 4xx: No retry, throw immediately
   - 5xx/Network: Retry up to 2 times
3. **throwOnError: true** → Error thrown to nearest ErrorBoundary
4. **ErrorBoundary** catches and renders fallback UI

---

## Error Types & Status Codes

### Network Errors

| Type              | ErrorCode              | Status | User Message                                                        |
| ----------------- | ---------------------- | ------ | ------------------------------------------------------------------- |
| Network failure   | EXTERNAL_SERVICE_ERROR | 503    | "Network connection failed. Please check your internet connection." |
| Cancelled request | (ignored)              | -      | (No error shown)                                                    |

### Client Errors (4xx)

| Status | ErrorCode        | Handling                 | User Message                       |
| ------ | ---------------- | ------------------------ | ---------------------------------- |
| 400    | VALIDATION_ERROR | No retry, show error     | Server message or "Request failed" |
| 401    | UNAUTHORIZED     | Set redirectTo, no toast | Server message                     |
| 403    | FORBIDDEN        | No retry, show error     | Server message                     |
| 404    | NOT_FOUND        | No retry, show error     | "Not Found" or server message      |
| 422    | VALIDATION_ERROR | No retry, show error     | Server message                     |

### Server Errors (5xx)

| Status      | ErrorCode              | Handling             | User Message                   |
| ----------- | ---------------------- | -------------------- | ------------------------------ |
| 5xx         | INTERNAL_ERROR         | Retry 2x, show toast | "An unexpected error occurred" |
| No response | EXTERNAL_SERVICE_ERROR | Retry 2x, show toast | "Network connection failed..." |

### Critical Errors (Bubble to Router)

| ErrorCode        | Behavior                    |
| ---------------- | --------------------------- |
| UNAUTHORIZED     | Re-throw to router boundary |
| INVALID_TOKEN    | Re-throw to router boundary |
| TOKEN_EXPIRED    | Re-throw to router boundary |
| VALIDATION_ERROR | Re-throw to router boundary |

---

## Key Components

### 1. classifyHttpError (lib/errors.ts)

```typescript
// Converts Axios errors to typed AppError
// Maps status codes to ErrorCode enum
// Extracts server message when available
```

### 2. isAppError (lib/errors.ts)

```typescript
// Type guard for AppError instances
// Checks instanceof AppError OR object shape
```

### 3. isCriticalError (lib/errors.ts)

```typescript
// Identifies errors that should bubble up
// Auth failures, token issues, validation errors
// Used by ErrorBlock to re-throw
```

### 4. Axios Interceptor (lib/api-client.ts)

```typescript
// Response interceptor:
// - Ignore cancelled requests
// - Handle 401: set redirectTo
// - Handle 4xx: classify and reject
// - Handle 5xx: show toast, classify and reject
```

### 5. ErrorBlock (components/errors/ErrorBlock.tsx)

```typescript
// Component-level error boundary fallback
// Re-throws critical errors
// Displays inline error UI for non-critical
```

### 6. RouteErrorBoundary (components/errors/route-error-boundary.tsx)

```typescript
// Route-level error boundary
// Handles AppError, RouteErrorResponse, unknown errors
// Displays full-page error UI with navigation
```

### 7. MainErrorFallback (components/errors/main.tsx)

```typescript
// App-level error boundary fallback
// Last resort for uncaught errors
// Displays generic error with refresh button
```

---

## Error Flow Examples

### Example 1: Network Failure

```
User clicks button → React Query fires request
    ↓
Axios request fails (network down)
    ↓
Interceptor: classifyHttpError() → AppError(EXTERNAL_SERVICE_ERROR, 503)
    ↓
Toast shown: "An unexpected error occurred"
    ↓
React Query: retry (1st attempt)
    ↓
Still fails → retry (2nd attempt)
    ↓
Still fails → throwOnError: true
    ↓
ErrorBlock catches → isCriticalError? NO
    ↓
Display inline error UI with retry button
```

### Example 2: 401 Unauthorized

```
User accesses protected resource
    ↓
Axios request → Server returns 401
    ↓
Interceptor: status === 401 → set error.redirectTo
    ↓
Interceptor: reject(error) (not classified yet, original axios error)
    ↓
Auth layer handles redirect
    ↓
(If not handled by auth layer)
    ↓
React Query: no retry (would be 4xx if classified)
    ↓
Error reaches boundary
    ↓
Component ErrorBlock: isCriticalError? depends on classification
    ↓
May bubble to RouteErrorBoundary
```

### Example 3: Validation Error (422)

```
User submits invalid form data
    ↓
Axios request → Server returns 422
    ↓
Interceptor: status === 422 → classifyHttpError() → AppError(VALIDATION_ERROR, 422)
    ↓
React Query: no retry (4xx)
    ↓
throwOnError: true
    ↓
Component ErrorBlock: isCriticalError(VALIDATION_ERROR)? YES
    ↓
Re-throw error (bubble up)
    ↓
RouteErrorBoundary: isAppError? YES
    ↓
Display: statusCode 422, title "Request Failed", server message
```

### Example 4: Render Error

```
Component throws error during render
    ↓
Nearest ErrorBoundary catches (Component-level)
    ↓
If ErrorBlock: isCriticalError? Check error type
    ↓
If critical or not AppError: may bubble to parent
    ↓
Eventually caught by MainErrorFallback
    ↓
Display: "Ooops, something went wrong" + refresh button
```

---

## Environment Initialization Error

```
App loads → getApi() called for first time
    ↓
import("@/config/env") → Validation fails
    ↓
Catch block: throw AppError(INTERNAL_ERROR, 500)
    Message: "An unexpected error occurred"
    Details: [{ code: "ENV_IMPORT_FAILED", message: original.message }]
    ↓
Error propagates before any boundary is ready
    ↓
MainErrorFallback catches at app level
    ↓
Display: Generic error page with refresh button
```

---

## Toast Strategy

**Show Toast:**

- Server errors (5xx)
- Network errors (no response)
- Message: "An unexpected error occurred" (generic)

**Don't Show Toast:**

- Client errors (4xx) - Let UI components handle display
- 401 errors - Auth layer handles redirect
- Cancelled requests - User-initiated cancellation

**Toast Configuration:**

```typescript
toast({
  type: "background",
  title: "Server Error",
  description: "An unexpected error occurred",
  variant: "destructive",
});
```

---

## Security & UX Notes

### ✅ Security Best Practices

- Generic error messages in production ("An unexpected error occurred")
- Server-specific messages only for operational errors (4xx)
- No stack traces or implementation details exposed
- Error details logged internally (AppError.details) but not displayed

### ✅ User Experience

- **Component-level errors**: Inline display, doesn't break entire page
- **Critical errors**: Full-page display with navigation options
- **Toast notifications**: Only for background/async failures (5xx)
- **Retry mechanisms**:
  - Automatic: React Query retry (5xx/network, max 2 attempts)
  - Manual: Retry button in ErrorBlock component

### ✅ Developer Experience

- Typed errors (AppError) with ErrorCode enum
- Consistent error classification (classifyHttpError)
- Clear error propagation hierarchy
- React Query DevTools in development mode
- All errors eventually caught (no uncaught promise rejections)

---

## Error Boundary Comparison: Client vs Server

| Aspect                | Client                       | Server                        |
| --------------------- | ---------------------------- | ----------------------------- |
| **Primary Goal**      | Prevent app crash, show UI   | Return proper HTTP response   |
| **Error Propagation** | Bubble up through boundaries | Pass through middleware chain |
| **Retry Logic**       | React Query (automatic)      | N/A (client decides)          |
| **User Feedback**     | UI components + toasts       | JSON response                 |
| **Critical Errors**   | Re-throw to router           | Log + 500 response            |
| **Development**       | Full errors + DevTools       | Full errors + stack traces    |
| **Production**        | Generic messages             | Sanitized messages            |
| **Type System**       | Shared AppError/ErrorCode    | Shared AppError/ErrorCode     |

---

## Open Questions & Improvement Areas

### 🤔 Current Gaps

1. **401 handling**: Interceptor sets `redirectTo` but doesn't classify to AppError immediately
   - Should 401 be classified before rejection?
   - Who handles the redirect - auth layer or error system?

2. **Toast vs Boundary**: Some errors show toast AND hit boundary
   - Is double notification desired?
   - Should toast replace inline error for 5xx?

3. **ErrorBlock critical re-throw**: VALIDATION_ERROR is marked critical
   - Should validation errors be handled inline instead?
   - Current behavior sends them to router boundary

4. **Environment errors**: Thrown before boundaries are ready
   - Should env validation happen at build time?
   - How to improve DX for env config errors?

### 🎯 Potential Improvements

1. **Consistent error classification**: Classify ALL errors in interceptor
2. **Standardize 401 flow**: Unified auth error → redirect pattern
3. **Error tracking**: Add error reporting service integration points
4. **Loading states**: Better UX during retry attempts
5. **Error recovery**: More granular retry strategies per error type
6. **Documentation**: Update this doc as patterns evolve

---

## 🚀 PROPOSED STRATEGY: Server-First Error Classification

### Problem Statement

**Current approach** (client/src/lib/errors.ts):

```typescript
classifyHttpError(error) {
  const status = error.response.status;
  // Maps status codes → ErrorCode
  if (status === 400 || status === 422) return AppError(VALIDATION_ERROR, status);
  if (status === 401) return AppError(UNAUTHORIZED, 401);
  // ... etc
}
```

**Issues:**

1. ❌ **Ignores server's `code` field**: Server already sends proper ErrorCode in response
2. ❌ **Status-based guessing**: 400 could be VALIDATION_ERROR, INVALID_INPUT, BAD_REQUEST, etc.
3. ❌ **Loss of precision**: Server's semantic error code is discarded
4. ❌ **Duplication**: Client re-implements error classification logic

### Server Response Structure

When server sends errors, response includes:

```typescript
{
  success: false,
  timestamp: "2025-12-16T...",
  data: null,
  error: {
    code: "VALIDATION_ERROR",        // ← ErrorCode enum value
    message: "Invalid email format",  // ← Specific user message
    details: [...],                   // ← Field-level errors (Zod)
    stack: "..." // Only in development
  }
}
```

### Proposed Solution: Code-First Classification

**Priority order:**

1. **First**: Check `error.response.data.error.code` → Use server's ErrorCode
2. **Fallback**: If `code` missing, use status code mapping (backward compatibility)
3. **Last resort**: Network errors → EXTERNAL_SERVICE_ERROR

**New classifyHttpError implementation:**

```typescript
export function classifyHttpError(error: unknown): AppError {
  const axiosError = error as {
    response?: {
      status: number;
      data?: {
        error?: {
          code?: ErrorCode;
          message?: string;
          details?: ErrorDetail[];
        };
      };
    };
    message: string;
    code?: string;
  };

  // Network/connection errors
  if (axiosError.code === "ERR_NETWORK" || !axiosError.response) {
    return new AppError(
      "Network connection failed. Please check your internet connection.",
      ErrorCode.EXTERNAL_SERVICE_ERROR,
      503,
    );
  }

  const response = axiosError.response;
  const serverError = response.data?.error;

  // PRIORITY 1: Use server's error code if available
  if (
    serverError?.code &&
    Object.values(ErrorCode).includes(serverError.code)
  ) {
    return new AppError(
      serverError.message || "Request failed",
      serverError.code,
      response.status,
      serverError.details,
    );
  }

  // PRIORITY 2: Fallback to status code mapping (backward compatibility)
  const status = response.status;
  const message =
    serverError?.message || axiosError.message || "Request failed";

  if (status === 400 || status === 422) {
    return new AppError(message, ErrorCode.VALIDATION_ERROR, status);
  }
  if (status === 401) {
    return new AppError(message, ErrorCode.UNAUTHORIZED, status);
  }
  if (status === 403) {
    return new AppError(message, ErrorCode.FORBIDDEN, status);
  }
  if (status === 404) {
    return new AppError(message, ErrorCode.NOT_FOUND, status);
  }

  // Unknown status → generic internal error
  return new AppError(message, ErrorCode.INTERNAL_ERROR, status ?? 500);
}
```

**Benefits:**

- ✅ Preserves server's semantic error codes
- ✅ Uses server's user-facing messages
- ✅ Includes validation details from Zod
- ✅ Backward compatible with non-standard responses
- ✅ Single source of truth (server decides error classification)

---

## 🛠️ PROPOSED: Centralized Error Middleware (React Router v7)

### React Router v7 Middleware Pattern

**Documentation**: https://reactrouter.com/how-to/middleware

React Router v7 introduces a powerful middleware system that runs before/after route handlers:

```typescript
// Middleware chain: parent → child (down) → handlers → child → parent (up)
export const middleware: Route.MiddlewareFunction[] = [
  async ({ request, context }, next) => {
    // Code before handlers
    const response = await next(); // Execute handlers
    // Code after handlers
    return response;
  },
];
```

**Key features:**

- Type-safe context via `createContext()` and `RouterContextProvider`
- Errors thrown in middleware are caught by ErrorBoundary
- `next()` never throws - always returns Response (even for errors)
- Supports both server middleware (Framework mode) and client middleware (Data mode)

### Proposed Implementation Strategy

Instead of scattering error processing logic across interceptors and components, we can use React Router middleware to:

1. **Classify errors** from server responses (prioritize `code` field)
2. **Process errors** based on environment (dev vs prod)
3. **Share error context** with route handlers and boundaries
4. **Centralize decisions** (toast/no-toast, bubble/handle)

**Location**: `apps/client/src/middleware/error-middleware.ts`

#### Step 1: Create Error Context

```typescript
// apps/client/src/context/error-context.ts
import { createContext } from "react-router";
import { AppError } from "@repo/domain";

export type ProcessedError = {
  appError: AppError;
  userMessage: string;
  showToast: boolean;
  showDetails: boolean;
  details?: unknown;
  stack?: string;
};

export const errorContext = createContext<ProcessedError | null>(null);
```

#### Step 2: Root Error Middleware

```typescript
// apps/client/src/middleware/error-middleware.ts
import { AppError, ErrorCode } from "@repo/domain";
import { errorContext, ProcessedError } from "@/context/error-context";
import { classifyHttpError, isAppError } from "@/lib/errors";
import { toast } from "@/hooks/use-toast";

/**
 * Root-level error handling middleware
 * Catches errors from loaders/actions and processes them
 */
export const errorMiddleware: Route.MiddlewareFunction = async (
  { context },
  next,
) => {
  try {
    const response = await next();

    // Check if response contains error (from ErrorBoundary)
    if (response.status >= 400) {
      // Error was handled by boundary, no additional processing needed
      return response;
    }

    return response;
  } catch (error) {
    // This catch should rarely execute since next() doesn't throw
    // But we handle it for safety
    const processed = processError(error);

    // Store in context for ErrorBoundary to access
    context.set(errorContext, processed);

    // Show toast if needed
    if (processed.showToast) {
      toast({
        title: "Error",
        description: processed.userMessage,
        variant: "destructive",
      });
    }

    // Re-throw the classified AppError for ErrorBoundary
    throw processed.appError;
  }
};

/**
 * Process error based on environment and error type
 */
export function processError(error: unknown): ProcessedError {
  const isDev = import.meta.env.DEV;

  // Classify error first
  const appError = isAppError(error) ? error : classifyHttpError(error);

  // Development: show full details
  if (isDev) {
    return {
      appError,
      userMessage: appError.message,
      showToast: shouldShowToast(appError),
      showDetails: true,
      details: appError.details,
      stack: (error as Error).stack,
    };
  }

  // Production: sanitize messages
  return {
    appError,
    userMessage: getSafeUserMessage(appError),
    showToast: shouldShowToast(appError),
    showDetails: false,
    details: undefined,
    stack: undefined,
  };
}

/**
 * Determine user-facing message based on error code
 */
function getSafeUserMessage(error: AppError): string {
  // Operational errors (4xx): show specific message
  if (error.statusCode >= 400 && error.statusCode < 500) {
    return error.message;
  }

  // Server/network errors (5xx): generic message
  return "An unexpected error occurred. Please try again later.";
}

/**
 * Decide whether to show toast notification
 */
function shouldShowToast(error: AppError): boolean {
  const code = error.code;

  // Don't toast for expected client errors
  if (error.statusCode >= 400 && error.statusCode < 500) {
    // Exception: show toast for auth errors (user kicked out)
    if (
      code === ErrorCode.UNAUTHORIZED ||
      code === ErrorCode.TOKEN_EXPIRED ||
      code === ErrorCode.INVALID_TOKEN
    ) {
      return true;
    }
    return false;
  }

  // Toast for server errors (5xx) and network failures
  return true;
}

/**
 * Check if error should bubble to router boundary
 */
export function shouldBubbleToRouter(error: AppError): boolean {
  // Critical errors: auth failures, env issues
  return (
    error.code === ErrorCode.UNAUTHORIZED ||
    error.code === ErrorCode.INVALID_TOKEN ||
    error.code === ErrorCode.TOKEN_EXPIRED ||
    error.code === ErrorCode.INTERNAL_ERROR
  );
}
```

#### Step 3: Apply Middleware to Root Route

```typescript
// apps/client/src/app/router.tsx
import { errorMiddleware } from "@/middleware/error-middleware";

const createAppRouter = (queryClient: QueryClient) =>
  createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      errorElement: <MainErrorFallback />,
      middleware: [errorMiddleware], // 👈 Apply at root
      children: [
        {
          path: "/",
          element: <ContentLayout />,
          ErrorBoundary: MainErrorFallback,
          children: [
            // ... child routes
          ],
        },
      ],
    },
  ]);
```

#### Step 4: Update ErrorBoundary to Use Context

```typescript
// apps/client/src/components/errors/route-error-boundary.tsx
import { useRouteError } from "react-router-dom";
import { errorContext } from "@/context/error-context";
import { processError } from "@/middleware/error-middleware";

export function RouteErrorBoundary() {
  const error = useRouteError();
  const context = useContext(errorContext); // Optional: might not be set

  // Use context if available, otherwise process error directly
  const processed = context ?? processError(error);

  return (
    <Container>
      <h1>{processed.appError.statusCode}</h1>
      <h2>{getTitle(processed.appError)}</h2>
      <p>{processed.userMessage}</p>

      {processed.showDetails && (
        <div>
          <h3>Debug Info</h3>
          {processed.details && (
            <pre>{JSON.stringify(processed.details, null, 2)}</pre>
          )}
          {processed.stack && <pre>{processed.stack}</pre>}
        </div>
      )}
    </Container>
  );
}
```

#### Step 5: Simplified Axios Interceptor

```typescript
// apps/client/src/lib/api-client.ts
import { classifyHttpError } from "@/lib/errors";

apiInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (isCancel(error)) return Promise.reject(error);

    // Handle 401 redirects
    if (error.response?.status === 401) {
      const redirectTo = window.location.pathname;
      error.redirectTo = redirectTo;
      return Promise.reject(error);
    }

    // Classify error and reject (middleware will handle toast/processing)
    const appError = classifyHttpError(error);
    return Promise.reject(appError);
  },
);
```

### Alternative: Client Middleware (Data Mode)

For client-side error processing without server involvement:

```typescript
// apps/client/src/middleware/client-error-middleware.ts
export const clientErrorMiddleware: Route.ClientMiddlewareFunction = async (
  { context },
  next,
) => {
  const results = await next();

  // Check for errors in loader/action results
  const errors = Object.values(results).filter(
    (r) => r.type === "error" || isRouteErrorResponse(r.result),
  );

  if (errors.length > 0) {
    errors.forEach((errorResult) => {
      const processed = processError(errorResult.result);

      if (processed.showToast) {
        toast({
          title: "Error",
          description: processed.userMessage,
          variant: "destructive",
        });
      }

      // Store in context for boundaries
      context.set(errorContext, processed);
    });
  }

  return results;
};

// Apply to routes
export const clientMiddleware: Route.ClientMiddlewareFunction[] = [
  clientErrorMiddleware,
];
```

---

### Benefits of React Router Middleware Approach

**Advantages:**

- ✅ **Native integration**: Uses React Router's built-in middleware system
- ✅ **Type-safe context**: Share error state with type safety across routes
- ✅ **Centralized logic**: All error processing in one middleware
- ✅ **Error boundary integration**: Natural flow with ErrorBoundary
- ✅ **No double processing**: Process once in middleware, use everywhere
- ✅ **Flexible placement**: Can apply at root or specific route levels

**Comparison to interceptor-only approach:**

- Interceptor: Early error classification, can't access route context
- Middleware: Full access to route context, can share processed errors
- **Best of both**: Use interceptor for classification, middleware for processing/routing

---

## 📋 Implementation Plan (React Router Middleware)

### Phase 1: Update Error Classification

1. ✅ Update `classifyHttpError` to prioritize `response.data.error.code`
2. ✅ Add validation for ErrorCode enum values
3. ✅ Preserve `details` array from server
4. ✅ Test with real server responses

### Phase 2: Create Error Context & Middleware

1. ✅ Create `context/error-context.ts` with `ProcessedError` type
2. ✅ Create `middleware/error-middleware.ts` with:
   - `errorMiddleware` function (React Router middleware)
   - `processError` helper (classification + processing)
   - `getSafeUserMessage` (dev vs prod messages)
   - `shouldShowToast` (toast decision logic)
   - `shouldBubbleToRouter` (critical error detection)
3. ✅ Add types for `ProcessedError` context

### Phase 3: Apply Middleware to Routes

1. ✅ Update `router.tsx` to apply `errorMiddleware` at root level
2. ✅ Consider client-side middleware for Data Mode routes
3. ✅ Test middleware execution order (parent → child → handlers → child → parent)

### Phase 4: Update Error Boundaries

1. ✅ Update `RouteErrorBoundary` to read from `errorContext`
2. ✅ Fallback to `processError` if context not available
3. ✅ Update `ErrorBlock` to use `shouldBubbleToRouter`
4. ✅ Remove duplicate error processing logic

### Phase 5: Simplify Axios Interceptor

1. ✅ Keep classification logic (`classifyHttpError`)
2. ✅ Remove toast logic (moved to middleware)
3. ✅ Keep 401 redirect handling
4. ✅ Reject with classified `AppError`

### Phase 6: Clean Up & Test

1. ✅ Remove old `isCriticalError` in favor of `shouldBubbleToRouter`
2. ✅ Remove duplicate message sanitization
3. ✅ Test dev vs prod error display
4. ✅ Test toast behavior for different error codes
5. ✅ Test error context propagation through middleware

### Phase 7: Documentation

1. ✅ Update ERROR_FLOW.md with React Router middleware patterns
2. ✅ Add JSDoc comments to error-middleware
3. ✅ Document middleware execution flow
4. ✅ Add examples of context usage

---

## 🎯 Expected Outcomes with React Router Middleware

### Better Error Semantics

```typescript
// BEFORE: Client guesses based on status
Server sends 400 → Client: "must be VALIDATION_ERROR"

// AFTER: Client uses server's classification
Server sends { code: "INVALID_ID", status: 400 } → Client: ErrorCode.INVALID_ID
Server sends { code: "MISSING_REQUIRED_FIELD", status: 400 } → Client: ErrorCode.MISSING_REQUIRED_FIELD
```

### Consistent Dev/Prod Experience

```typescript
// Development (via middleware context)
{
  userMessage: "User with email 'test@example.com' already exists",
  showDetails: true,
  details: [{ path: ["email"], message: "..." }],
  stack: "Error: ...\n  at ..."
}

// Production (via middleware context)
{
  userMessage: "User with email 'test@example.com' already exists", // 4xx: show specific
  showDetails: false,
  details: undefined,
  stack: undefined
}

// Production (5xx - via middleware context)
{
  userMessage: "An unexpected error occurred. Please try again later.", // Generic
  showDetails: false,
  details: undefined,
  stack: undefined
}
```

### Centralized Decision Making via Middleware

- **Where to show error**: Middleware decides (toast vs inline vs boundary)
- **What to show**: Middleware decides (specific vs generic message)
- **How to show**: Middleware decides (with/without details and stack)
- **Whether to bubble**: Middleware decides (critical vs local handling)
- **Context sharing**: Middleware stores processed error in React Router context
- **Single source of truth**: All error boundaries read from same context

---

## ⚖️ Trade-offs & Considerations

### Pros

- ✅ **Single source of truth**: Server classification via `code` field
- ✅ **Native React Router integration**: Uses built-in middleware system
- ✅ **Type-safe context**: Share error state across routes with type safety
- ✅ **Consistent sanitization**: Dev vs prod messages in one place
- ✅ **Centralized logic**: All processing in middleware, not scattered
- ✅ **Better semantic precision**: Use server's ErrorCode directly
- ✅ **Preserves validation details**: Zod errors from server maintained
- ✅ **Flexible toast control**: Middleware decides when to show notifications

### Cons

- ⚠️ **Server dependency**: Requires server to send proper `code` field
- ⚠️ **Fallback complexity**: Need status-based classification for backward compatibility
- ⚠️ **Learning curve**: Team needs to understand React Router middleware
- ⚠️ **Migration effort**: Must update multiple integration points
- ⚠️ **Malformed responses**: Must handle cases where server response is unexpected

### Migration Strategy

**Phase 1: Classification**

- Update `classifyHttpError` to prioritize server's `code` field
- Keep status-based fallback for backward compatibility
- Add logging to track which errors use fallback

**Phase 2: Middleware Setup**

- Create error context and middleware
- Apply at root level initially
- Test with existing error boundaries

**Phase 3: Integration**

- Update boundaries to read from context
- Simplify Axios interceptor
- Remove duplicate logic

**Phase 4: Server Updates**

- Ensure all server endpoints send `code` field
- Monitor fallback usage
- Eventually remove status-based fallback

**Phase 5: Optimization**

- Add route-specific middleware where needed
- Fine-tune toast behavior
- Add error tracking/reporting integration
