# Overview

## Validation and Middleware Structure

- utils [env.ts] file for Env Var validation
- utils [appError] file for App Error handling
- utils [catchAsync] file for async error handling
- schemas folder for defining types and schemas
- routes handales validation of req body, req params, and req query
- routes handales user authenticateion
- routes handales user authorization
- models folder for buesiness logic(methods)
- models folder for conputed properties
- models folder for prisma middleware(password hashing on create and update)
- models folder for prisma middleware(soft delete on delete)
- models folder for prisma middleware(soft delete on update)
- middleware [error.ts] file for handling errors catched on app error middleware
- middleware [validation.ts] file parsind schemas and throwing errors or passing to next??
- controllers folder for defining controllers (define responsibility of each controller)
- controllers folder for defining services (define responsibility of each service)

1. Environment Variable Validation - **DONE**

   - Handle at application startup before anything runs.
   - use tools like dotenv with zod or envsafe to validate required environment variables.

2. Application Error Handling - **DONE**

   - Centralized error-handling middleware at the end of your middleware chain.

   - Capture known errors (like validation/authentication failures) and unexpected errors.

   - handle all find and throws

3. Request Validation (Body, Params, Query) - **DONE**
   Define validation middleware separately for each request type.

   - Use zod schemas for validation.

   - Apply validation as route-level middleware before hitting business logic.

4. User Authentication **IMPROVE**

   - Implement authentication as middleware (e.g., JWT, session-based).
   - Ensure authentication runs early in the middleware chain for protected routes.
   - Use Passport.js or custom middleware to verify tokens and authenticate users.

5. User Authorization **IMPROVE**

   - Authorization middleware comes after authentication.
   - Check user roles/permissions for specific actions.
   - Implement role-based access control (RBAC) or attribute-based access control (ABAC).

6. Business Logic **IMPROVE**

   - Place business logic within route handlers or in dedicated service layers.
   - Avoid embedding business logic in middleware; middleware should handle cross-cutting concerns only.
   - Use dependency injection or service classes to organize and maintain business logic.

7. Password Hashing (User Creation & Update) - **IMPROVE**

   - Implement password hashing in a Prisma middleware or a pre-save hook.
   - Use secure hashing libraries such as bcrypt or argon2.
   - Ensure that password updates always trigger re-hashing before saving to the database.

8. Soft Delete for Users **IMPROVE**

   - Use Prisma middleware or model hooks to implement soft deletes.
   - Instead of removing records, set a `deletedAt` timestamp to mark them as deleted.
   - Update queries to exclude soft-deleted users by default, unless explicitly requested.

## Middleware Ordering **IMPROVE**

- **Environment variable validation** (before app starts)
- **Request validation** (before business logic)
- **Authentication** (before protected routes)
- **Authorization** (after authentication)
- **Business logic** (route handlers/services)
- **Error handling** (last in the chain)
