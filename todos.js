/**
 * Consolidated TODOs for my-turborepo
 * Last updated: 2025-11-15
 */

// ============================================================================
// WORKSPACE & ARCHITECTURE
// ============================================================================

// TODO add type folder for shared types, zod schemas, prisma types etc
// TODO add web folder and react ts config
// TODO rethink server database logic, after separating server and client, maybe move to a separate package

// ============================================================================
// BUILD & CONFIGURATION
// ============================================================================

// TODO fix env configs and make sure they are optimal
//      Location: apps/server/src/utils/env.ts
//      Note: The error is thrown inside the createEnv function

// TODO consider prisma push when building a pros script, needed if there is no database
// TODO prod script for database

// ============================================================================
// SERVER & API
// ============================================================================

// TODO go over server changes and make sure everything is optimal
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

// TODO product.model.ts and user.model.ts files changes, why any?!?!?
//      Location: packages/database/models/product.model.ts
//      Note: Create a one to one relation with config? This is a temporary solution
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

// ============================================================================
// COMPLETED / ADDRESSED
// ============================================================================

// ✅ go over tsconfigs differences and make sure they are optimal
//    Status: Standardized tsconfig.json and tsconfig.build.json for both server and database
//    Date: 2025-11-13

// ✅ fixprisma import check file
//    Status: Implemented robust postgenerate/postbuild fixer for .js extensions
//    Location: packages/database/scripts/fix-prisma-imports-robust.cjs
//    Date: 2025-11-13
