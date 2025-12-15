# Error Handling Strategy - Client App

## Current State Analysis

### ✅ What's Working

1. **Global Error Boundary**: `MainErrorFallback` in `provider.tsx` catches app-level errors
2. **Route Error Boundary**: `ErrorBoundary: MainErrorFallback` on ContentLayout catches routing errors
3. **Component-level Error Boundaries**: Home, Category, and Product routes use `react-error-boundary` for granular error handling
4. **API Interceptor**: `api-client.ts` shows toast notifications for failed requests
5. **Suspense Boundaries**: Used with ErrorBoundary for async data loading

### ❌ Critical Gaps Identified

1. **Loader Errors Not Caught by Route ErrorBoundary**
   - `clientLoader` functions use `ensureQueryData` which doesn't throw
   - Loader errors won't trigger route-level error boundaries
   - No fallback for loader failures

2. **Query Error Handling Inconsistent**
   - `throwOnError: false` in query config (commented out)
   - Some components use Suspense without ErrorBoundary wrapper
   - Query errors might not bubble to boundaries

3. **Missing Error Boundaries**
   - Layout components (nav, footer) have no error isolation
   - BestGearSection has no error boundary
   - Related products section lacks error handling

4. **API Error Handling Issues**
   - Toast shows for ALL errors (even expected ones like 404)
   - 401 redirect happens in interceptor (should be in auth layer)
   - No retry strategy for transient failures
   - Console.log left in production code

5. **Zod Parse Errors**
   - API response validation throws errors but doesn't differentiate from network errors
   - No user-friendly messages for schema mismatches

6. **Navigation Errors**
   - No handling for invalid routes/params
   - 404 route lacks error boundary

## Recommended Strategy

### 1. Router-Level Error Handling

**Add errorElement to all routes:**

```tsx
const createAppRouter = (queryClient: QueryClient) =>
  createBrowserRouter([
    {
      path: "/",
      element: <RootLayout />,
      errorElement: <RootErrorBoundary />, // Catches route/loader errors
      children: [
        {
          path: "/",
          element: <ContentLayout />,
          errorElement: <LayoutErrorBoundary />, // Catches layout errors
          children: [
            {
              path: paths.home.path,
              lazy: { ... },
              errorElement: <RouteErrorBoundary />, // Catches route-specific errors
            },
            // ... other routes
          ],
        },
      ],
    },
  ]);
```

**Create specialized error components:**

- `RootErrorBoundary` - Full-page errors (routing, navigation)
- `LayoutErrorBoundary` - Layout errors (preserve nav/footer if possible)
- `RouteErrorBoundary` - Route-specific errors (show error in main content area)

### 2. Loader Error Handling

**Use React Router's error throwing mechanism:**

```tsx
export const clientLoader =
  (queryClient: QueryClient) =>
  async ({ params }: LoaderFunctionArgs) => {
    try {
      const slug = params.productSlug as string;

      // Validate params
      if (!slug || slug.length < 2) {
        throw new Response("Invalid product slug", { status: 400 });
      }

      const query = getProductBySlugQueryOptions(slug);
      await queryClient.ensureQueryData(query);

      return null;
    } catch (error) {
      // Check if product not found
      if (error.response?.status === 404) {
        throw new Response("Product not found", { status: 404 });
      }

      // Re-throw other errors to be caught by errorElement
      throw error;
    }
  };
```

### 3. Query Configuration

**Enable selective error throwing:**

```tsx
export const queryConfig = {
  queries: {
    throwOnError: (error, query) => {
      // Don't throw for certain query keys (e.g., optional data)
      if (query.queryKey[0] === "optional-data") return false;

      // Throw for Suspense to catch errors
      return true;
    },
    refetchOnWindowFocus: false, // Prevent unwanted refetches
    retry: (failureCount, error) => {
      // Don't retry on 4xx errors
      if (error?.response?.status >= 400 && error?.response?.status < 500) {
        return false;
      }
      // Retry network errors up to 2 times
      return failureCount < 2;
    },
    staleTime: 1000 * 60, // 1 minute
  },
} satisfies DefaultOptions;
```

### 4. API Client Improvements

**Separate error handling concerns:**

```tsx
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't handle cancelled requests
    if (isCancel(error)) {
      return Promise.reject(error);
    }

    const status = error.response?.status;

    // Let auth errors bubble without toast (handle in auth layer)
    if (status === 401 || status === 403) {
      return Promise.reject(error);
    }

    // Don't show toast for expected errors (handle in UI)
    if (status === 404 || status === 400) {
      return Promise.reject(error);
    }

    // Show toast only for unexpected server/network errors
    if (status >= 500 || !status) {
      toast({
        title: "Something went wrong",
        description: "Please try again later",
        variant: "destructive",
      });
    }

    return Promise.reject(error);
  },
);
```

### 5. Error Classification

**Create error types for better handling:**

```tsx
// src/lib/errors.ts
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public issues: string[],
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class NetworkError extends Error {
  constructor(message = "Network connection failed") {
    super(message);
    this.name = "NetworkError";
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError;
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}
```

### 6. Component Error Boundaries

**Standardize error boundary usage:**

```tsx
// src/components/errors/section-error-boundary.tsx
export function SectionErrorBoundary({
  children,
  title = "Error loading section",
  onRetry,
}: Props) {
  return (
    <ErrorBoundary
      FallbackComponent={({ error, resetErrorBoundary }) => (
        <Container>
          <ErrorBlock
            title={title}
            message={getErrorMessage(error)}
            onReset={() => {
              onRetry?.();
              resetErrorBoundary();
            }}
          />
        </Container>
      )}
    >
      <Suspense fallback={<LoadingSpinner />}>{children}</Suspense>
    </ErrorBoundary>
  );
}
```

### 7. Error Logging & Monitoring

**Add error reporting:**

```tsx
// src/lib/error-reporting.ts
export function reportError(error: Error, context?: Record<string, unknown>) {
  if (env.MODE === 'production') {
    // Send to error tracking service (Sentry, LogRocket, etc.)
    // errorTracker.captureException(error, { extra: context });
  } else {
    console.error('Error:', error, 'Context:', context);
  }
}

// Use in error boundaries
<ErrorBoundary
  onError={(error, errorInfo) => {
    reportError(error, { componentStack: errorInfo.componentStack });
  }}
  FallbackComponent={ErrorFallback}
>
```

## Implementation Priority

1. **HIGH - Loader Error Handling**: Add try-catch and Response throwing
2. **HIGH - Route ErrorElements**: Add errorElement to all routes
3. **MEDIUM - Query Config**: Enable throwOnError and retry strategy
4. **MEDIUM - API Interceptor**: Remove toast for expected errors
5. **MEDIUM - Error Classification**: Create error type classes
6. **LOW - Error Reporting**: Add monitoring/logging service
7. **LOW - Standardize Components**: Create reusable error boundary components

## Testing Strategy

1. **Network Errors**: Disconnect network, test all data fetching
2. **404 Errors**: Invalid product slugs, category names
3. **Validation Errors**: Malformed API responses (mock bad data)
4. **Loader Errors**: Invalid route params, missing data
5. **Component Errors**: Force render errors in components
6. **Navigation Errors**: Invalid routes, broken links
7. **Concurrent Errors**: Multiple failed requests at once

## Files Requiring Updates

### High Priority

- [ ] `src/app/router.tsx` - Add errorElement to routes
- [ ] `src/app/routes/*/index.tsx` - Update loaders with error handling
- [ ] `src/lib/react-query.ts` - Configure throwOnError and retry
- [ ] `src/lib/api-client.ts` - Improve error interceptor

### Medium Priority

- [ ] `src/lib/errors.ts` - Create (new file)
- [ ] `src/components/errors/route-error-boundary.tsx` - Create (new file)
- [ ] `src/components/errors/section-error-boundary.tsx` - Create (new file)
- [ ] `src/features/*/api/*.ts` - Wrap Zod parsing in try-catch with custom errors

### Low Priority

- [ ] `src/lib/error-reporting.ts` - Create (new file)
- [ ] All error boundaries - Add onError callback for logging
