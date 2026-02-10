// ============================================================================
// GENERAL / INFRASTRUCTURE
// ============================================================================
// TODO React 19's Document Metadata

// ============================================================================
// TYPES & API
// ============================================================================
// File: src/types/api.ts
// Line: 5
// TODO refactor other request params to extend TBaseRequestParams

// ============================================================================
// AUTHENTICATION / AUTHORIZATION
// ============================================================================
// TODO Lib - authorization files
// TODO refactor auth to use react router middleware, refactor getauthstatus to use as enabled in get user query
// TODO improve react query usage for auth and user data (caching, stale time, refetching...)
// TODO add password strength meter
// TODO add show/hide password toggle
// TODO add refresh token handling here if needed

// File: src/features/auth/login-form.tsx
// Line: 117
// TODO implement forgot password functionality

// ============================================================================
// CART & CHECKOUT
// ============================================================================
// TODO checkout layout and components
// TODO what happens at checkout? create customer account?
// TODO centralize cart state management and sync logic, consider using Zustand or similar for local cart state and syncing with server on login/checkout
// TODO centralize queryclient usage and auth status checking, consider creating a custom hook that wraps useQueryClient and provides helper functions for auth checks and cart syncing to avoid repeating this logic in multiple places
// TODO price and shipping in checkout page - for now we are using fixed shipping and calculating tax on the client, but we might want to move this logic to the server in the future for better accuracy and to handle edge cases (e.g. different tax rates for different products or locations)

// File: src/features/cart/api/get-cart.ts
// Line: 36
// TODO remove this to central auth

// File: src/lib/cart-sync.ts
// Line: 24
// TODO optimize by sending only changed items instead of full cart, but this is simpler for now and cart sizes are expected to be small

// File: src/lib/cart-sync.ts
// Line: 25
// TODO handle potential merge conflicts (e.g. same product in both carts) - for now we just let the server handle merging logic and assume it will sum quantities, but we might want to add client-side logic later to provide better UX

// File: src/lib/cart-sync.ts
// Line: 26
// TODO mutation to sync cart on the server and return the merged cart, so we can update local cache immediately without waiting for next fetch - this would require changes to our API and cart hooks, so we can consider it as a future enhancement

// ============================================================================
// ERROR HANDLING
// ============================================================================
// TODO add severity levels to errors

// File: src/lib/errors/errors.ts
// Line: 25
// TODO consider using treeifyError for better error paths

// File: src/lib/errors/errors.ts
// Line: 26
// TODO consider which error messages to expose to client (on route level and feature level and form level)

// File: src/lib/errors/errors.ts
// Line: 109-111
// TODO if it is a post/create/update request, and we have error.response.data.error.details as zod error details,
//      it means server side validation failed, and something was wrong with the request payload or params (usually payload on this kind of requests)
//      we can reconstruct a zod error from the details and provide more specific validation error to client

// ============================================================================
// COMPONENTS & UI
// ============================================================================
// TODO add skeleton loaders where needed
// TODO work on responsive design (ErrorBlock.tsx)
// TODO Dialog - create variants for cart, thank you and nav, refactor
// TODO switch toast to sonner

// File: src/components/layouts/content-layout/nav-bar/user-dropdown/logged-in-user-dropdown.tsx
// Line: 25
// TODO useSuspense with a fallback loader, redo after middleware refactor

// ============================================================================
// PRODUCTS FEATURE
// ============================================================================
// TODO needs more work, also for the return type of the products (get-products.ts)
// TODO redo or delete this file (refactor-attempt.ts)
// TODO work on buttons, go over this details and test (product-card/index.tsx - card variants)
// TODO -actions - add to cart, increase, decrease (routes/product/index.tsx)
// TODO add get all products with filter

// ============================================================================
// HOME PAGE
// ============================================================================
// TODO add svg to zx9 and finish spacings - add children to responsive picture? (show-case-products-section.tsx)
// TODO svg workshop (show-case-products-section.tsx)

// ============================================================================
// OPTIMIZATIONS & PERFORMANCE
// ============================================================================
// TODO custom container css
// TODO https://react.dev/reference/react-dom/preload
// TODO webP image format
// TODO add min size for site
