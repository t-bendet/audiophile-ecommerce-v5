// ** General / Infrastructure

// TODO React 19’s Document Metadata

// ** Authentication / Authorization
// TODO Lib - authorization files

// ** Components
// TODO add skeleton loaders where needed
// TODO work on responsive design (ErrorBlock.tsx)
// TODO Dialog - create variants for cart,thank you and nav ,refactor
// ** Products Feature
// TODO needs more work,also for the return type of the products (get-products.ts)
// TODO redo or delete this file (refactor-attampt.ts)
// TODO decide on strategy for add and remove from cart actions,design wrapper and + - small button (product-actions.tsx)
// TODO work on buttons ,go over this details and test (product-card/index.tsx - card variants)
// TODO -actions - add to cart, increase, decrease (routes/product/index.tsx)
// ** Home Page
// TODO add svg to zx9 and finish spacings - add children to responsive picture? (show-case-products-section.tsx)
// TODO svg workshop (show-case-products-section.tsx)

// ** Checkout / Cart
// TODO what happens at checkout? create customer account?

// ** Bonus Points
// TODO add get all products with filter

// ** Optimizations
// TODO custom container css
// TODO https://react.dev/reference/react-dom/preload
// TODO webP
// TODO add min size for site
// TODO add severity levels to errors
// TODO switch toast to sonner
// TODO add refresh token handling here if needed
// TODO refactor auth to use react router middleware,refactor getauthstatus to use as enabled in get user query
// TODO improve react query usage for auth and user data (caching,stale time,refetching...)
// TODO add password strength meter
// TODO add show/hide password toggle

// ** next steps

// TODO checkout layout and components
// TODO remove items from cart
// TODO centralize cart state management and sync logic, consider using Zustand or similar for local cart state and syncing with server on login/checkout
// TODO centralize queryclient usage and auth status checking, consider creating a custom hook that wraps useQueryClient and provides helper functions for auth checks and cart syncing to avoid repeating this logic in multiple places
// TODO price and shipping in checkout page - for now we are using fixed shipping and calculating tax on the client, but we might want to move this logic to the server in the future for better accuracy and to handle edge cases (e.g. different tax rates for different products or locations)
