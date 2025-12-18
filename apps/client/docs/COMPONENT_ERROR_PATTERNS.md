# Component Error Handling Patterns

**Purpose:** Document how components should handle errors in the new architecture where Axios is pure transport and React Query classifies for retries.

**Key Principle:** Components own the decision of whether to show inline error UI, throw to boundary, or display a toast.

---

## Quick Reference

| Scenario                                          | Error Type | Query Setting                              | Component Pattern                            |
| ------------------------------------------------- | ---------- | ------------------------------------------ | -------------------------------------------- |
| **Critical Data** (product page, required config) | 4xx or 5xx | `throwOnError: true`                       | ErrorBoundary catches, shows error page      |
| **Optional Data** (related products, enrichment)  | 4xx or 5xx | `throwOnError: false`                      | Check `query.error`, show inline or fallback |
| **Refetch Background Error** (user refreshing)    | 5xx only   | Mix: critical throwOnError, optional don't | Show toast, keep stale UI visible            |
| **Form Submission** (user action)                 | 4xx or 5xx | `throwOnError: false`                      | Show inline validation errors or retry       |

---

## Pattern 1: Critical Data (Blocking)

**Scenario:** Product detail page needs product data to render.  
**Decision:** Fail fast; error page is appropriate.

```typescript
// apps/client/src/routes/product.tsx

import { useQuery } from "@tanstack/react-query";
import { getProductByIdQueryOptions } from "@/lib/query-options";

export function ProductPage() {
  const { id } = useParams();

  // Query with throwOnError: true (default for critical)
  const query = useQuery(getProductByIdQueryOptions(id));

  if (query.isPending) return <LoadingSpinner />;

  // If error, ErrorBoundary catches and shows error page
  // (no check needed here; error is thrown)

  return (
    <div>
      <h1>{query.data.name}</h1>
      <p>{query.data.description}</p>
      {/* render product details */}
    </div>
  );
}
```

**Error Flow:**

1. Query fails → Axios throws raw HTTP error
2. React Query classifies via `classifyHttpError()` in retry handler
3. No retry for 4xx, or retries exhausted for 5xx
4. React Query throws `AppError` (because `throwOnError: true`)
5. ErrorBoundary catches → shows error page

---

## Pattern 2: Optional Data (Non-Blocking)

**Scenario:** Related products section; nice-to-have but not critical.  
**Decision:** Allow navigation; show fallback or empty state inline.

```typescript
// apps/client/src/components/related-products.tsx

import { useQuery } from "@tanstack/react-query";
import { getRelatedProductsQueryOptions } from "@/lib/query-options";
import { classifyHttpError } from "@/lib/errors";
import { toast } from "@/hooks/use-toast";

export function RelatedProducts({ productId }: { productId: string }) {
  // Query with throwOnError: false (don't throw for optional data)
  const query = useQuery({
    ...getRelatedProductsQueryOptions(productId),
    throwOnError: false, // Override global default
  });

  if (query.isPending) {
    return <div className="skeleton-grid">Loading related...</div>;
  }

  if (query.isError) {
    // Handle error inline
    const error = query.error;
    const appError = classifyHttpError(error); // Classify here

    // Show fallback UI for non-critical data
    return (
      <div className="border rounded p-4 bg-gray-50">
        <p className="text-sm text-gray-600">
          {appError.message || "Could not load related products"}
        </p>
        <button
          onClick={() => query.refetch()}
          className="mt-2 text-sm text-blue-600 hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-4">
      {query.data.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
```

**Error Flow:**

1. Query fails → Axios throws raw HTTP error
2. React Query classifies for retry decision
3. No retry for 4xx, or retries exhausted for 5xx
4. Error stored in `query.error` (because `throwOnError: false`)
5. Component checks `query.isError` and renders fallback UI
6. User can click retry button manually

---

## Pattern 3: Background Refetch with Toast

**Scenario:** User already viewing data; refetch in background fails.  
**Decision:** Keep existing UI, show non-intrusive toast notification.

```typescript
// apps/client/src/components/product-list.tsx

import { useQuery } from "@tanstack/react-query";
import { getProductsQueryOptions } from "@/lib/query-options";
import { classifyHttpError } from "@/lib/errors";
import { useEffect } from "react";
import { toast } from "@/hooks/use-toast";

export function ProductList() {
  const query = useQuery({
    ...getProductsQueryOptions(),
    throwOnError: false, // Handle errors inline
  });

  // Detect refetch errors and show toast
  useEffect(() => {
    if (query.isRefetchError) {
      const appError = classifyHttpError(query.error);

      // Only toast on background/refetch errors (not initial load)
      toast({
        type: "background",
        title: "Failed to refresh",
        description: appError.message,
        variant: "destructive",
      });
    }
  }, [query.isRefetchError, query.error]);

  if (query.isPending) {
    return <LoadingSpinner />;
  }

  if (query.isLoadingError) {
    // Initial load failed; show error UI
    return <ErrorBlock error={classifyHttpError(query.error)} />;
  }

  // Show stale data with toast message visible
  return (
    <div>
      <ProductGrid products={query.data} />
      {/* Toast appears in corner, doesn't block UI */}
    </div>
  );
}
```

**Error Flow:**

1. Initial load succeeds
2. User sees data
3. Background refetch starts (React Query's default)
4. Refetch fails → Axios throws raw error
5. React Query classifies and retries
6. Error stored in `query.error` + `query.isRefetchError` set
7. `useEffect` detects refetch error and shows toast
8. Existing data remains visible (stale but functional)

---

## Pattern 4: Form Submission with Validation

**Scenario:** Form submission that might return validation errors.  
**Decision:** Show field-specific errors inline; optionally toast on network error.

```typescript
// apps/client/src/components/sign-up-form.tsx

import { useMutation } from "@tanstack/react-query";
import { postSignUp } from "@/lib/api/auth";
import { classifyHttpError, isAppError } from "@/lib/errors";
import { useState } from "react";

export function SignUpForm() {
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: (data) => postSignUp(data),
    throwOnError: false, // Handle errors inline
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({}); // Clear previous errors

    try {
      const response = await mutation.mutateAsync(formData);
      // Success; redirect or show message
    } catch (error) {
      const appError = classifyHttpError(error);

      // Handle validation errors (400/422)
      if (appError.statusCode === 422 && appError.details?.fields) {
        setFieldErrors(appError.details.fields);
      } else if (appError.statusCode === 400) {
        // Generic 400 error
        setFieldErrors({ form: appError.message });
      } else {
        // Network or server error
        toast({
          type: "background",
          title: "Sign up failed",
          description: appError.message,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {fieldErrors.form && (
        <div className="p-3 bg-red-50 text-red-600 rounded mb-4">
          {fieldErrors.form}
        </div>
      )}

      <input
        name="email"
        placeholder="Email"
        {...register("email")}
      />
      {fieldErrors.email && (
        <p className="text-red-600 text-sm">{fieldErrors.email}</p>
      )}

      <input
        name="password"
        type="password"
        placeholder="Password"
        {...register("password")}
      />
      {fieldErrors.password && (
        <p className="text-red-600 text-sm">{fieldErrors.password}</p>
      )}

      <button type="submit" disabled={mutation.isPending}>
        {mutation.isPending ? "Signing up..." : "Sign Up"}
      </button>
    </form>
  );
}
```

**Error Flow:**

1. User submits form
2. Request sent → Axios throws raw error
3. Mutation catches error (no React Query retry for mutations by default)
4. Component classifies error via `classifyHttpError()`
5. Check status code:
   - 422 validation: Set `fieldErrors` from `appError.details`
   - 400 bad request: Show generic form error
   - 5xx/network: Show toast notification
6. Component re-renders with errors displayed

---

## Pattern 5: Component-Level Error Boundary for Feature Isolation

**Scenario:** Complex feature (checkout, reviews) with multiple API calls.  
**Decision:** Catch critical errors, show feature-specific fallback using `SafeRenderWithErrorBlock`.

```typescript
// apps/client/src/components/product-reviews.tsx

import { SafeRenderWithErrorBlock } from "@/components/errors/SafeRenderWithErrorBlock";
import { useQuery } from "@tanstack/react-query";
import { getReviewsQueryOptions } from "@/lib/query-options";

function ReviewsContent() {
  const query = useQuery({
    ...getReviewsQueryOptions(),
    throwOnError: true, // Throw critical errors
  });

  if (query.isPending) return null; // Suspense handles loading

  return (
    <div className="reviews-section">
      {query.data.map((review) => (
        <ReviewCard key={review.id} review={review} />
      ))}
    </div>
  );
}

export function ProductReviews() {
  return (
    <SafeRenderWithErrorBlock
      title="Product Reviews"
      containerClasses="bg-yellow-50 border border-yellow-200"
    >
      <ReviewsContent />
    </SafeRenderWithErrorBlock>
  );
}
```

**How it works:**

- `SafeRenderWithErrorBlock` wraps the component with `QueryErrorResetBoundary` for retry functionality
- `Suspense` boundary handles loading states (returns `null` in content component)
- `ErrorBoundary` catches thrown errors and displays `ErrorBlock` fallback
- User can click reset button to retry
- Rest of page remains functional

**Error Flow:**

1. Reviews query fails
2. `throwOnError: true` → React Query throws error
3. `ErrorBoundary` (inside SafeRenderWithErrorBlock) catches
4. `ErrorBlock` renders with title "Product Reviews" and error message
5. User can click retry to reset and refetch

## SafeRenderWithErrorBlock Component

**Location:** `apps/client/src/components/errors/SafeRenderWithErrorBlock.tsx`

This is the primary component for wrapping sections that need error boundaries. It combines:

- `QueryErrorResetBoundary` for retry functionality
- `ErrorBoundary` to catch thrown errors
- `Suspense` for loading states
- `ErrorBlock` fallback UI

**Props:**

```typescript
type SafeRenderWithErrorBlockProps = {
  title: string; // Title for error message
  containerClasses?: string; // Classes for ErrorBlock container
  spinnerClasses?: string; // Classes for loading spinner
  fallback?: React.ReactNode; // Custom loading fallback
  children: React.ReactNode;
};
```

**Usage:**

```typescript
import { SafeRenderWithErrorBlock } from "@/components/errors/SafeRenderWithErrorBlock";

export function MyFeature() {
  return (
    <SafeRenderWithErrorBlock
      title="Feature Name"
      containerClasses="bg-blue-50"
    >
      <MyContent /> {/* Return null for loading, throw error for failures */}
    </SafeRenderWithErrorBlock>
  );
}
```

---

**File:** `apps/client/src/lib/query-options.ts`

Define query options with appropriate `throwOnError` defaults:

```typescript
import { queryOptions } from "@tanstack/react-query";
import { getApi } from "@/lib/api-client";

// Critical data: throw errors to boundary
export const getProductByIdQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["products", id],
    queryFn: async () => {
      const api = getApi();
      const { data } = await api.get(`/products/${id}`);
      return data;
    },
    throwOnError: true, // Critical; block navigation
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

// Optional data: handle errors inline
export const getRelatedProductsQueryOptions = (id: string) =>
  queryOptions({
    queryKey: ["products", id, "related"],
    queryFn: async () => {
      const api = getApi();
      const { data } = await api.get(`/products/${id}/related`);
      return data;
    },
    throwOnError: false, // Optional; show fallback inline
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
```

---

## Decision Matrix

Use this to decide error handling per component/query:

```
Is the data REQUIRED for the page to be useful?
│
├─ YES (critical)
│  ├─ throwOnError: true
│  ├─ ErrorBoundary handles page-level error
│  └─ User sees error page or fallback
│
└─ NO (optional)
   ├─ throwOnError: false
   ├─ Component checks query.isError
   ├─ Show inline fallback or empty state
   └─ User continues with degraded experience
       │
       └─ Is it a refetch (background update)?
          │
          ├─ YES (data already visible)
          │  └─ Show toast; keep stale UI
          │
          └─ NO (initial load)
             └─ Show inline error with retry button
```

---

## Common Mistakes to Avoid

### ❌ Mistake 1: Classifying at Axios Level

```typescript
// DON'T: Classify in Axios
interceptor.response.use(
  (response) => response,
  (error) => Promise.reject(classifyHttpError(error)), // ❌ Don't do this
);

// DO: Classify in React Query or component
const query = useQuery({
  queryFn: () => getApi().get("/data"),
  throwOnError: true,
  // React Query will handle error when thrown
});
```

**Why:** Components need raw errors to decide how to handle them.

### ❌ Mistake 2: Showing Toast for Every Error

```typescript
// DON'T: Toast on all errors
const query = useQuery({
  queryFn: async () => {
    try {
      return await getApi().get("/data");
    } catch (error) {
      toast({ title: "Error", description: "Failed" }); // ❌ Toasts on initial load
      throw error;
    }
  },
});
```

**Why:** Initial load errors should show UI, not toast. Only refetch errors get toasts.

### ❌ Mistake 3: Not Classifying Errors at All

```typescript
// DON'T: Use raw error
if (query.error) {
  return <div>{query.error.message}</div>; // ❌ May not have .message
}

// DO: Classify first
if (query.error) {
  const appError = classifyHttpError(query.error);
  return <div>{appError.message}</div>;
}
```

**Why:** Raw errors may not have the expected shape; classification normalizes them.

### ❌ Mistake 4: Mixing Toast and Error Boundary

```typescript
// DON'T: Both throw and toast
const query = useQuery({
  queryFn: () => getApi().get("/data"),
  throwOnError: true,
});

useEffect(() => {
  if (query.error) {
    toast({ title: "Error" }); // ❌ Never reached; error already thrown
  }
}, [query.error]);
```

**Why:** If `throwOnError: true`, error never reaches component state; boundary catches first.

---

## Testing Error Scenarios

### Unit Test Example

```typescript
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductList } from './product-list';

describe('ProductList error handling', () => {
  it('shows error inline for optional data', async () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false }, // Disable retries for testing
      },
    });

    // Mock API to return error
    vi.mock('@/lib/api-client', () => ({
      getApi: () => ({
        get: vi.fn().mockRejectedValue(
          new Error('Server error')
        ),
      }),
    }));

    render(
      <QueryClientProvider client={queryClient}>
        <ProductList />
      </QueryClientProvider>
    );

    // Wait for error UI to appear
    expect(await screen.findByText(/could not load/i)).toBeInTheDocument();
  });

  it('throws error to boundary for critical data', async () => {
    // Similar setup but with throwOnError: true
    // ErrorBoundary should catch and show fallback
  });
});
```

---

## Summary

| Layer             | Responsibility                                     | Does NOT Do                              |
| ----------------- | -------------------------------------------------- | ---------------------------------------- |
| **Axios**         | Transport only; handle 401 redirects               | No classification, no toasts, no retries |
| **React Query**   | Classify errors; decide retries; throw if critical | Handle UI; show toasts                   |
| **Component**     | Classify errors; show inline/toast; error handling | Make HTTP requests directly              |
| **ErrorBoundary** | Catch thrown errors; show error page               | Handle optional/background errors        |

**Last Updated:** December 18, 2025
