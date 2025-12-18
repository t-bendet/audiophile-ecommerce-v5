// ** General / Infrastructure
// TODO go over all loaders and actions and make sure errors are thrown properly
// TODO standardize error handling strategy between server and client

// TODO rethink the whole error handling strategy,for backend and frontend(big task)
// TODO go over route-error-boundary and errors.ts ,allagin with error handling on server and make sure errors are thrown on loaders ,also make sure each error hs a type(also in env)

//   throw new Error(
//     `Failed to fetch categories: ${result.error.issues
//       .map((i) => `${i.path.join(".")}: ${i.message}`)
//       .join("; ")}`,
//   );
// }
// TODO go over client loaders throws errors
// TODO standerdize parsing error throwing in api clients

// TODO refactor to use bulletproof-react auth patterns
// TODO axios refresher
// TODO change src attributes to z.url in all schemas
// TODO go over stephen grider steps for planning routes
// TODO Provider check bulletproof react patterns for react-query setup
// TODO layouts refactor - bulletproof react patterns
// TODO decide on category strategy - const or dynamic from api(navlinks.ts and navbar.tsx behave differently)
// TODO https://reactrouter.com/api/utils/createContext
// TODO React 19’s Document Metadata
// TODO react router middleware

// ** API Client (src/lib/api-client.ts)
// TODO go over changes again
// TODO make this baseURL configurable
// TODO type the error response properly
// TODO explore api interceptors,and check if i can move the error handling from there

// ** Authentication / Authorization
// TODO Lib - auth and authorization files
// TODO Provider -  add AuthLoader
// TODO add signup and login pages,and buttons to navbar

// ** Components
// TODO work on responsive design (ErrorBlock.tsx)
// TODO Dialog - create variants for cart,thank you and nav ,refactor
// TODO Navbar handle dialog and avatar
// TODO helmet component -no meta data showing

// ** Products Feature
// TODO needs more work,also for the return type of the products (get-products.ts)
// TODO redo or delete this file (refactor-attampt.ts)
// TODO decide on strategy for add and remove from cart actions,design wrapper and + - small button (product-actions.tsx)
// TODO work on buttons (product-card/index.tsx)
// TODO add error boundary handling for missing context values (product-card/index.tsx)
// TODO go over this details and test (product-card/index.tsx - card variants)
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
