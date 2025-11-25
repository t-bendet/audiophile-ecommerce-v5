// ============================================================================
// WORKSPACE & ARCHITECTURE
// ============================================================================
// TODO go over turborepo core-concepts,https://turborepo.com/docs/core-concepts
// TODO go over monorepo best practices,https://blog.logrocket.com/monorepo-best-practices-2023/
// TODO ts wizard ts config part
// TODO basicly go over the whole project structure and understand each part

// TODO add type folder for shared types, zod schemas, prisma types etc
// TODO add web folder and react ts config
// TODO the prisma client extensions and custom methods organization and usage across packages,check what types i am getting

// ============================================================================
// BUILD & CONFIGURATION
// ============================================================================

// TODO fix env configs and make sure they are optimal
//      Location: apps/server/src/utils/env.ts
//      Note: The error is thrown inside the createEnv function

// TODO prod script for database -  add prisma push, needed if there is no database

// ============================================================================
// SERVER & API
// ============================================================================

// TODO handel CORS in server
// TODO implement forgot password and reset password
// TODO switch to cloudinary upload images and products from dashboard? url or image upload
// TODO add update all details for admins (users, products, orders)
// TODO add errors for update same value
// TODO checkout prices return from backend

// ============================================================================
// ERROR HANDLING & VALIDATION
// ============================================================================

// TODO add proper error handling middleware, remove my fixes and use zod flatteners
//      Location: apps/server/src/middlewares/error.middleware.ts
//      Note: refactor response structure, do we need status? reshape the error object for a normal error response
//      Reference: https://www.youtube.com/watch?v=T4Q1NvSePxs

// TODO rethink how to handle validateSchema message formatted errors
// TODO zod deprecation warnings fix

// TODO Template literal types for error codes are awesome
//      References:
//      - https://www.youtube.com/shorts/zOseJFD447U
//      - https://engineering.udacity.com/handling-errors-like-a-pro-in-typescript-d7a314ad4991
//      - https://kentcdodds.com/blog/get-a-catch-block-error-message-with-typescript
//      - https://medium.com/@turkishtechnology/error-handling-in-typescript-5b060e52b29b

// ============================================================================
// DATABASE & MODELS
// ============================================================================

// TODO Create a one to one relation with config
//      Location: packages/database/models/product.model.ts
// ** to product schema
//           featuredProductId  String                  @db.ObjectId
// featuredProduct  Product                 @relation(fields: [featuredProductId], references: [id])
// ** to config seed
//       featuredProductId: createdProductsMap["xx99 mark two headphones"],
// TODO soft delete for users needs a lot of work to be complete
// TODO remove confirm password from user schema, and use it in backend logic

// ============================================================================
// DATA & SEEDING
// ============================================================================

// TODO yx1 wireless earphones does not have related product image
// TODO add null values to product seed/?
// TODO isNew as a virtual property - less than a year since arrival

// ============================================================================
// CODE ORGANIZATION & QUALITY
// ============================================================================

// TODO Restructure middlewares folder:
//      Current: error.middleware.ts, error.handlers.ts, validation.middleware.ts
//      Proposed:
//      middlewares/
//      ├── index.ts                 # Export all
//      ├── validation.ts            # Remove .middleware suffix
//      └── error/
//          ├── index.ts             # Export errorHandler
//          ├── handler.ts           # Main error handler (current error.middleware.ts)
//          ├── handlers.ts          # Specific error handlers
//          └── types.ts             # Type guards
//      Benefits: Better organization, easier imports, more scalable

// TODO services, split into different files

// TODO consider if these asserts are useful, or if they are just a way to make typescript happy
//      Example code:
//      type User = {
//        id: number;
//        name: string;
//      };
//
//      function isUser(value: unknown): value is User {
//        return (
//          typeof value === "object" &&
//          value !== null &&
//          "id" in value &&
//          typeof value.id === "number" &&
//          "name" in value &&
//          typeof value.name === "string"
//        );
//      }
//
//      function saveToDatabase(user: User) {
//        console.log("Saving user:", user.name);
//      }
//
//      function assert(condition: unknown, msg?: string): asserts condition {
//        if (condition === false) throw new Error(msg);
//      }
//
//      function updateUser(userData: unknown) {
//        assert(isUser(userData), "Not a valid user");
//        saveToDatabase(userData); // ✅ Type-safe now!
//      }
//
//      updateUser({ id: 1, name: "John Doe" }); // ✅ Works
//
//      function assertIsUser(value: unknown): asserts value is User {
//        if (!isUser(value)) {
//          throw new Error("Not a valid user");
//        }
//      }
//
//      function assertUser(value: unknown): asserts value is UserPublicInfo {
//        PublicInfoSchema.parse(value);
//      }

// TODO add error assertion?
//      Example:
//      function isPrismaError(
//        err: unknown
//      ): asserts err is PrismaClientKnownRequestError {
//        if (!(err instanceof PrismaClientKnownRequestError)) {
//          throw new Error("Wrong error type");
//        }
//      }

// ============================================================================
// LEARNING & DOCUMENTATION
// ============================================================================

// TODO go over prisma basic principles
// TODO go over prisma relations (one to many, one to one, many to many)
// TODO go over prisma data types
// TODO go over express basic principles
