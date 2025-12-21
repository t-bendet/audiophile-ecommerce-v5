# Error Chain Mapping - Client Application

## Overview

This document maps the complete error flow chain in the client application, from error origin through transformation, classification, and final UI display. It clarifies **what errors exist**, **where they transform**, and **why**.

---

## Error Origins & Types

### 1. Server HTTP Errors (via Axios)

**Origin:** Backend API responses with error status codes (4xx, 5xx)

**Structure sent by server:**

```typescript
// Server sends this in response body (via createErrorResponse)
{
  success: false,
  timestamp: "2025-12-21T...",
  data: null,
  error: {  // ⚠️ IMPORTANT: Error object is nested HERE
    message: "Product not found",
    code: "NOT_FOUND",  // ErrorCode enum
    details?: Record<string, any>, // Optional (e.g., validation field errors)
    stack?: string  // Only in development
  }
}
```

**Axios Error Structure received by client:**

```typescript
{
  name: "AxiosError",
  message: "Request failed with status code 404",
  code: "ERR_BAD_REQUEST", // Axios-specific code
  config: {...}, // Request config
  request: {...}, // XMLHttpRequest
  response: {
    status: 404,
    statusText: "Not Found",
    headers: {...},
    data: {
      success: false,
      timestamp: "...",
      data: null,
      error: {  // ⚠️ IMPORTANT: Server error object is HERE
        message: "Product not found",
        code: "NOT_FOUND",
        details: undefined
      }
    }
  },
  isAxiosError: true
}
```

**Key Insight:** The server's error details are nested at `error.response.data.error`, NOT directly at `error.response.data`.

---

### 2. Network/Connection Errors (via Axios)

**Origin:** Network failures, timeouts, DNS issues

**Axios Error Structure:**

```typescript
{
  name: "AxiosError",
  message: "Network Error",
  code: "ERR_NETWORK" | "ECONNABORTED" | "ETIMEDOUT",
  config: {...},
  request: {...},
  response: undefined, // ⚠️ NO response object
  isAxiosError: true
}
```

**Key Insight:** When `error.response` is undefined, it's a network/connection error, not a server error.

## Axios Error Codes Reference

When Axios encounters an error, it sets `error.code` to one of these values:

### Network/Connection Errors (Retryable)

| Error Code     | Meaning                                                                  | Retry? |
| -------------- | ------------------------------------------------------------------------ | ------ |
| `ERR_NETWORK`  | Network connection failed (no internet, DNS failure, connection refused) | ✅ Yes |
| `ECONNABORTED` | Connection aborted - request was terminated before completion            | ✅ Yes |
| `ETIMEDOUT`    | Request timeout - server didn't respond within the timeout period        | ✅ Yes |

### Request/Configuration Errors (Non-Retryable)

| Error Code             | Meaning                                                  | Retry? |
| ---------------------- | -------------------------------------------------------- | ------ |
| `ERR_BAD_REQUEST`      | Malformed HTTP request or bad request syntax             | ❌ No  |
| `ERR_INVALID_URL`      | URL provided is invalid or malformed                     | ❌ No  |
| `ERR_BAD_OPTION`       | Invalid Axios configuration option used                  | ❌ No  |
| `ERR_BAD_OPTION_VALUE` | Invalid value provided for an Axios configuration option | ❌ No  |

### Response Errors (Non-Retryable)

| Error Code         | Meaning                                                 | Retry? |
| ------------------ | ------------------------------------------------------- | ------ |
| `ERR_BAD_RESPONSE` | Server response is in an unexpected format or corrupted | ❌ No  |

### Redirect Errors (Non-Retryable)

| Error Code                  | Meaning                                          | Retry? |
| --------------------------- | ------------------------------------------------ | ------ |
| `ERR_FR_TOO_MANY_REDIRECTS` | Too many HTTP redirects (infinite redirect loop) | ❌ No  |

### Operation Errors (Non-Retryable)

| Error Code        | Meaning                                                        | Retry? |
| ----------------- | -------------------------------------------------------------- | ------ |
| `ERR_CANCELED`    | Request was explicitly canceled via CancelToken or AbortSignal | ❌ No  |
| `ERR_NOT_SUPPORT` | Operation is not supported in the current environment          | ❌ No  |
| `ERR_DEPRECATED`  | Deprecated Axios feature used                                  | ❌ No  |

**Usage in React Query:** The `retry` callback in [apps/client/src/lib/react-query.ts](apps/client/src/lib/react-query.ts) uses this information to decide whether to retry failed requests.

### 3. Client-Side Validation Errors (Zod)

**Origin:** Form validation before API call, or schema validation after API response

**Structure:**

```typescript
{
  name: "ZodError",
  issues: [
    {
      code: "invalid_type",
      expected: "string",
      received: "undefined",
      path: ["email"],
      message: "Required"
    },
    // ... more issues
  ],
  format(): {...} // Formatted errors
}
```

**Key Insight:** ZodErrors are NOT from Axios. They occur locally before/after HTTP calls.

---

### 4. Generic JavaScript Errors

**Origin:** Component crashes, unexpected exceptions, programming errors

**Structure:**

```typescript
{
  name: "Error" | "TypeError" | "ReferenceError",
  message: "Cannot read property 'x' of undefined",
  stack: "Error: ...\n    at Component (file:///...)"
}
```

**Key Insight:** Generic errors are caught by ErrorBoundaries, not Axios.

---

### 5. String/Unknown Errors

**Origin:** Manual `throw "error message"` or `throw null`

**Structure:**

```typescript
"Something went wrong"; // Plain string
// or
null;
// or
undefined;
```

**Key Insight:** Rare but must be handled defensively.

---

## Error Transformation Chain

### Chain 1: Server HTTP Error → AppError

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. SERVER RESPONSE (HTTP 404)                                       │
├─────────────────────────────────────────────────────────────────────┤
│ Response Body:                                                      │
│ {                                                                   │
│   status: "fail",                                                   │
│   message: "Product not found",                                     │
│   statusCode: 404,                                                  │
│   code: "NOT_FOUND"                                                 │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 2. AXIOS RECEIVES ERROR                                             │
├─────────────────────────────────────────────────────────────────────┤
│ Location: apps/client/src/lib/api-client.ts                        │
│ Function: apiInstance.interceptors.response (error handler)        │
│                                                                     │
│ Error Structure:                                                    │
│ {                                                                   │
│   name: "AxiosError",                                               │
│   message: "Request failed with status code 404",                   │
│   code: "ERR_BAD_REQUEST",                                          │
│   response: {                                                       │
│     status: 404,                                                    │
│     data: {                      ← Server error is HERE            │
│       status: "fail",                                               │
│       message: "Product not found",                                 │
│       statusCode: 404,                                              │
│       code: "NOT_FOUND"                                             │
│     }                                                               │
│   },                                                                │
│   isAxiosError: true                                                │
│ }                                                                   │
│                                                                     │
│ Action: return Promise.reject(error) // Throw raw Axios error      │
│ Why: Let React Query handle classification and retry logic         │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 3. REACT QUERY CATCHES ERROR                                        │
├─────────────────────────────────────────────────────────────────────┤
│ Location: apps/client/src/lib/react-query.ts                       │
│ Function: retry callback                                            │
│                                                                     │
│ Action: classifyAxiosError(error) // For retry decision only       │
│ Result: status = 404 → Don't retry (4xx = client error)            │
│                                                                     │
│ Then: throwOnError: true → Throw error to ErrorBoundary            │
│ Why: Boundaries handle UI, React Query handles caching/retry       │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4A. LOADER CATCHES ERROR (if in loader)                             │
├─────────────────────────────────────────────────────────────────────┤
│ Location: apps/client/src/app/routes/product/index.tsx             │
│ Function: loader try/catch                                          │
│                                                                     │
│ Code:                                                               │
│   try {                                                             │
│     return await queryClient.ensureQueryData(query);                │
│   } catch (error) {                                                 │
│     throw normalizeError(error); // ← FIRST NORMALIZATION          │
│   }                                                                 │
│                                                                     │
│ normalizeError() receives: AxiosError                               │
│ normalizeError() returns: AppError {                                │
│   message: "Product not found",                                     │
│   code: ErrorCode.NOT_FOUND,                                        │
│   statusCode: 404,                                                  │
│   details: undefined                                                │
│ }                                                                   │
│                                                                     │
│ Why normalize here: Add loader-specific context before throwing    │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4B. ERROR BOUNDARY CATCHES ERROR (if in component)                  │
├─────────────────────────────────────────────────────────────────────┤
│ Location: apps/client/src/components/errors/safe-render-with-      │
│           error-block.tsx                                           │
│ Function: FallbackComponent                                         │
│                                                                     │
│ Code:                                                               │
│   const normalizedError = normalizeError(error); // NORMALIZATION  │
│   if (isCriticalError(normalizedError)) {                          │
│     throw normalizedError; // Re-throw to RouteErrorBoundary       │
│   }                                                                 │
│   return <ErrorBlock message={normalizedError.message} />;         │
│                                                                     │
│ normalizeError() receives: AxiosError (if not normalized in loader)│
│ normalizeError() returns: AppError                                  │
│                                                                     │
│ Why normalize here: Boundaries receive many error types            │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 5. ROUTE ERROR BOUNDARY (if error bubbled up)                       │
├─────────────────────────────────────────────────────────────────────┤
│ Location: apps/client/src/components/errors/route-error-boundary   │
│ Function: RouteErrorBoundary component                              │
│                                                                     │
│ Code:                                                               │
│   const error = useRouteError();                                    │
│   const normalizedError = normalizeError(error); // NORMALIZATION  │
│   let message = getErrorMessage(normalizedError);                   │
│                                                                     │
│ Why normalize again: Defensive - error might be thrown from loader │
│ without normalization, or might be React Router Response error     │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 6. DISPLAY ERROR UI                                                 │
├─────────────────────────────────────────────────────────────────────┤
│ User sees:                                                          │
│   Status Code: 404                                                  │
│   Title: "Not Found"                                                │
│   Message: "Product not found"                                      │
│   Actions: [Go Back] [Go Home]                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Chain 2: Network Error → AppError

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. NETWORK FAILURE (No internet, timeout, DNS error)                │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 2. AXIOS DETECTS NETWORK ERROR                                      │
├─────────────────────────────────────────────────────────────────────┤
│ Error Structure:                                                    │
│ {                                                                   │
│   name: "AxiosError",                                               │
│   message: "Network Error",                                         │
│   code: "ERR_NETWORK",                                              │
│   response: undefined, // ⚠️ NO response                           │
│   isAxiosError: true                                                │
│ }                                                                   │
│                                                                     │
│ Action: return Promise.reject(error)                                │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 3. REACT QUERY CATCHES ERROR                                        │
├─────────────────────────────────────────────────────────────────────┤
│ Action: classifyAxiosError(error)                                   │
│ Result: No response → Retry up to 2 times (network errors retry)   │
│                                                                     │
│ After retries exhausted: throwOnError: true → Throw to boundary    │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4. normalizeError() IN BOUNDARY                                     │
├─────────────────────────────────────────────────────────────────────┤
│ Input: AxiosError with no response                                  │
│                                                                     │
│ classifyAxiosError() logic:                                         │
│   if (error.code === "ERR_NETWORK" || !error.response) {           │
│     return new AppError(                                            │
│       "Network connection failed...",                               │
│       ErrorCode.EXTERNAL_SERVICE_ERROR,                             │
│       503                                                           │
│     );                                                              │
│   }                                                                 │
│                                                                     │
│ Output: AppError with 503 status and EXTERNAL_SERVICE_ERROR code   │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 5. DISPLAY ERROR UI                                                 │
├─────────────────────────────────────────────────────────────────────┤
│ User sees:                                                          │
│   Status Code: 503                                                  │
│   Title: "Request Failed"                                           │
│   Message: "Network connection failed. Please check your internet  │
│             connection."                                            │
│   Actions: [Retry] (via ErrorBlock)                                │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Chain 3: Zod Validation Error → AppError

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. CLIENT-SIDE VALIDATION (Form submission)                         │
├─────────────────────────────────────────────────────────────────────┤
│ Code:                                                               │
│   const schema = z.object({ email: z.string().email() });          │
│   schema.parse({ email: "invalid" }); // Throws ZodError           │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 2. ZodError THROWN                                                  │
├─────────────────────────────────────────────────────────────────────┤
│ Error Structure:                                                    │
│ {                                                                   │
│   name: "ZodError",                                                 │
│   issues: [                                                         │
│     {                                                               │
│       code: "invalid_string",                                       │
│       validation: "email",                                          │
│       path: ["email"],                                              │
│       message: "Invalid email"                                      │
│     }                                                               │
│   ]                                                                 │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 3. normalizeError() CATCHES ZodError                                │
├─────────────────────────────────────────────────────────────────────┤
│ Location: Any boundary or try/catch that calls normalizeError()    │
│                                                                     │
│ Code:                                                               │
│   if (error instanceof ZodError) {                                  │
│     const message = `Validation failed: ${issues.map(...).join()}`;│
│     const details = error.issues.map(...);                          │
│     return new AppError(                                            │
│       message,                                                      │
│       ErrorCode.VALIDATION_ERROR,                                   │
│       422,                                                          │
│       details                                                       │
│     );                                                              │
│   }                                                                 │
│                                                                     │
│ Output: AppError {                                                  │
│   message: "Validation failed: email: Invalid email",               │
│   code: ErrorCode.VALIDATION_ERROR,                                 │
│   statusCode: 422,                                                  │
│   details: [{ code: "invalid_string", path: ["email"], ... }]      │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4. DISPLAY ERROR UI                                                 │
├─────────────────────────────────────────────────────────────────────┤
│ User sees:                                                          │
│   Inline form error: "Invalid email"                               │
│   Or ErrorBlock: "Validation failed: email: Invalid email"         │
└─────────────────────────────────────────────────────────────────────┘
```

---

### Chain 4: Generic JavaScript Error → AppError

```
┌─────────────────────────────────────────────────────────────────────┐
│ 1. COMPONENT CRASH (Unexpected exception)                           │
├─────────────────────────────────────────────────────────────────────┤
│ Code:                                                               │
│   const user = props.user;                                          │
│   return <div>{user.name}</div>; // user is undefined              │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 2. JavaScript Error THROWN                                          │
├─────────────────────────────────────────────────────────────────────┤
│ Error Structure:                                                    │
│ {                                                                   │
│   name: "TypeError",                                                │
│   message: "Cannot read properties of undefined (reading 'name')", │
│   stack: "TypeError: Cannot read...\n    at Component..."          │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 3. ErrorBoundary CATCHES                                            │
├─────────────────────────────────────────────────────────────────────┤
│ Location: Nearest ErrorBoundary (SafeRenderWithErrorBlock or Route)│
│                                                                     │
│ Code:                                                               │
│   const normalizedError = normalizeError(error);                    │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 4. normalizeError() HANDLES Generic Error                           │
├─────────────────────────────────────────────────────────────────────┤
│ Code:                                                               │
│   if (error instanceof Error) {                                     │
│     return new AppError(                                            │
│       error.message,                                                │
│       ErrorCode.INTERNAL_ERROR,                                     │
│       500,                                                          │
│       undefined                                                     │
│     );                                                              │
│   }                                                                 │
│                                                                     │
│ Output: AppError {                                                  │
│   message: "Cannot read properties of undefined (reading 'name')", │
│   code: ErrorCode.INTERNAL_ERROR,                                   │
│   statusCode: 500,                                                  │
│   details: undefined                                                │
│ }                                                                   │
└─────────────────────────────────────────────────────────────────────┘
                                ↓
┌─────────────────────────────────────────────────────────────────────┐
│ 5. DISPLAY ERROR UI                                                 │
├─────────────────────────────────────────────────────────────────────┤
│ Development: Show full error message and stack trace                │
│ Production: Show generic "Something went wrong" message             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Key Data Transformation Points

### Point 1: Server Response → Axios Error

**Location:** Axios receives HTTP response

**Before:**

```javascript
// HTTP Response Body
{
  status: "fail",
  message: "Product not found",
  statusCode: 404,
  code: "NOT_FOUND"
}
```

**After:**

```javascript
// AxiosError object
{
  name: "AxiosError",
  response: {
    data: {
      success: false,
      timestamp: "...",
      data: null,
      error: {         // ← Server error object is nested here
        message: "Product not found",
        code: "NOT_FOUND"
      }
    }
  }
}
```

**Why:** Axios wraps server responses in its own error structure

---

### Point 2: Axios Error → AppError

**Location:** `classifyAxiosError()` in `apps/client/src/lib/errors/errors.ts`

**Before:**

```javascript
// AxiosError
{
  response: {
    status: 404,
    data: {
      success: false,
      timestamp: "...",
      data: null,
      error: {
        message: "Product not found",
        code: "NOT_FOUND"
      }
    }
  }
}
```

**After:**

```javascript
// AppError
{
  message: "Product not found",
  code: ErrorCode.NOT_FOUND,
  statusCode: 404,
  details: undefined
}
```

**Transformation Logic:**

```typescript
const status = error.response.status;
const message = error.response.data?.error?.message || error.message;
const code = error.response.data?.error?.code; // Backend ErrorCode

if (code) {
  return new AppError(message, code, status);
} else if (status === 404) {
  return new AppError(message, ErrorCode.NOT_FOUND, status);
}
// ... more status mappings
```

**Why:** Extract server's semantic error code and message from nested `error` object, discard Axios wrapper

---

### Point 3: Any Error → AppError

**Location:** `normalizeError()` in `apps/client/src/lib/errors/errors.ts`

**Input Types:**

- AxiosError (HTTP/network)
- ZodError (validation)
- Error (generic JS)
- string (manual throw)
- unknown (anything else)

**Output:** Always `AppError`

**Why:** Single error type simplifies boundary logic and UI rendering

---

## Critical Error Extraction Issue

### ⚠️ CURRENT PROBLEM

**Code currently looks at:**

```typescript
const message = error.response.data?.message; // ✅ Correct
const code = error.response.data?.code; // ✅ Correct
```

**Server sends:**

```typescript
// Response body structure (from createErrorResponse)
{
  success: false,
  timestamp: "2025-12-21T...",
  data: null,
  error: {              // ← Error object is nested here
    message: "Product not found",
    code: "NOT_FOUND",
    details: undefined
  }
}
```

**Axios wraps it as:**

```typescript
{
  response: {
    data: {
      success: false,
      timestamp: "...",
      data: null,
      error: {           // ← Server error is HERE (nested)
        message: "Product not found",
        code: "NOT_FOUND"
      }
    }
  }
}
```

### ⚠️ CURRENT PROBLEM - CODE NEEDS UPDATE

**Current code incorrectly looks at:**

```typescript
const message = error.response.data?.message; // ❌ WRONG - looks at root
const code = error.response.data?.code; // ❌ WRONG - looks at root
```

**Should be:**

```typescript
const message = error.response.data?.error?.message; // ✅ CORRECT - nested
const code = error.response.data?.error?.code; // ✅ CORRECT - nested
const details = error.response.data?.error?.details; // ✅ CORRECT - nested
```

**Required access paths:**

- `error.response.data.error.message` ← Server's error message
- `error.response.data.error.code` ← Server's ErrorCode
- `error.response.data.error.details` ← Optional validation details (e.g., Zod field errors)

---

## Where normalizeError() Is Called

### Call Site 1: Loader try/catch

**File:** `apps/client/src/app/routes/product/index.tsx:187`

```typescript
try {
  return await queryClient.ensureQueryData(query);
} catch (error) {
  throw normalizeError(error); // ← Normalize before throwing to route boundary
}
```

### Call Site 2: SafeRenderWithErrorBlock

**File:** `apps/client/src/components/errors/safe-render-with-error-block.tsx:28`

```typescript
FallbackComponent={({ error }) => {
  const normalizedError = normalizeError(error); // ← Normalize caught error
  if (isCriticalError(normalizedError)) throw normalizedError;
  return <ErrorBlock message={normalizedError.message} />;
}}
```

### Call Site 3: RouteErrorBoundary

**File:** `apps/client/src/components/errors/route-error-boundary.tsx:14`

```typescript
const error = useRouteError();
const normalizedError = normalizeError(error); // ← Defensive normalization
```

### Call Site 4: React Query retry (indirect)

**File:** `apps/client/src/lib/react-query.ts:15`

```typescript
retry: (failureCount, error) => {
  const classifiedError = classifyAxiosError(error); // ← For retry logic
  const status = classifiedError.statusCode;
  if (status >= 400 && status < 500) return false; // Don't retry
  return failureCount < 2;
};
```

---

## Decision Tree: When Errors Are Transformed

```
Error Occurs
    │
    ├─ In Axios request?
    │   └─ YES → Axios wraps it (Point 1)
    │            ↓
    │       React Query catches raw AxiosError
    │            ↓
    │       Decides retry (calls classifyAxiosError for status only)
    │            ↓
    │       throwOnError: true → Throw to boundary
    │            ↓
    │       [TRANSFORMATION]
    │            ↓
    │       ├─ In loader? → normalizeError() in try/catch (Call Site 1)
    │       └─ In component? → normalizeError() in boundary (Call Site 2)
    │
    ├─ In component render?
    │   └─ YES → ErrorBoundary catches
    │            ↓
    │       [TRANSFORMATION]
    │       normalizeError() in boundary (Call Site 2 or 3)
    │
    ├─ In form validation?
    │   └─ YES → ZodError thrown
    │            ↓
    │       [TRANSFORMATION]
    │       normalizeError() in try/catch or boundary
    │
    └─ Unknown error?
        └─ YES → ErrorBoundary catches
                 ↓
            [TRANSFORMATION]
            normalizeError() in boundary (defensive)
```

---

## Why Multiple normalizeError() Calls?

### Reason 1: Different Entry Points

- **Loaders:** Normalize in try/catch to add route context before throwing
- **Components:** Normalize in boundary to handle any error type
- **Boundaries:** Defensive normalization (error might be pre-normalized or not)

### Reason 2: Safety Net

If error is already `AppError`, `normalizeError()` returns it as-is (no-op):

```typescript
if (error instanceof AppError) {
  return error; // Already normalized
}
```

### Reason 3: Consistent Type

All boundaries work with `AppError` after normalization, simplifying logic:

```typescript
const normalizedError = normalizeError(error); // Now guaranteed AppError
const message = getErrorMessage(normalizedError); // Type-safe
if (isCriticalError(normalizedError)) { ... } // Type-safe
```

---

## Summary: Error Flow Rules

1. **Axios always throws raw errors** (AxiosError with server error nested at `response.data.error`)
2. **React Query handles retry** (classifies for retry decision, then throws)
3. **Loaders normalize first** (to add context before throwing to route boundary)
4. **Boundaries normalize defensively** (in case error wasn't pre-normalized)
5. **All UI works with AppError** (single type after normalization)
6. **⚠️ Server error data lives at `error.response.data.error`**, not directly at `error.response.data`
7. **Client code needs update** to access `error.response.data.error.message` and `error.response.data.error.code`

---

**Last Updated:** December 21, 2025
