// ============================================================================
// WORKSPACE & ARCHITECTURE
// ============================================================================
// TODO OpenAPI + zod-to-openapi: Generate OpenAPI from your zod schemas; use a client generator (or orval) to produce typed clients for frontend.
// TODO add web folder and react ts config
// TODO what happens when i delete a category with products? cascade or restrict?

// TODO LIST - Get all Users (pagination + filtering) extended keys should satisfy UserFilter
//      Location: packages/domain/src/user.ts
//      Context: UserGetAllRequestSchema currently allows only pagination/filtering on basic fields
//      Goal: Extend filtering capabilities to include all fields defined in UserFilter interface
//      Considerations:
//        - Update UserGetAllRequestSchema to dynamically generate filters based on UserFilter keys
//        - Ensure type safety and validation for new filter fields
//      Benefits: More flexible user retrieval, better admin capabilities for user management
// ============================================================================
// BUILD & CONFIGURATION
// ============================================================================

// TODO fix env configs and make sure they are optimal
//      Location: apps/server/src/utils/env.ts
//      Note: The error is thrown inside the createEnv function

// TODO prod script for database -  add prisma push, needed if there is no database

// TODO standardize tsconfig files across packages and apps for monorepo
//     "composite": true,
// "declarationMap": true'

// ============================================================================
// SERVER & API
// ============================================================================
// TODO handel CORS in server
// TODO implement forgot password and reset password
// TODO switch to cloudinary upload images and products from dashboard? url or image upload
// TODO add errors for update same value
// TODO checkout prices return from backend
// TODO handle slugs ,where is generated create update, user provide??
// TODO add rate limiting middleware to server
// TODO add helmet middleware to server

// ============================================================================
// ERROR HANDLING & VALIDATION
// ============================================================================

// TODO improve abstract-crud-service typing ,constraints on Where, Select to match Entity structure
//      Location: apps/server/src/services/abstract-crud.service.ts
//      Context: Generic types Where, Select are currently unconstrained (any)
//      Goal: Constrain Where, Select to match Entity structure for better type safety
//      Considerations:
//        - Use mapped types or conditional types to derive Where, Select from Entity
//        - Ensure compatibility with Prisma's filtering and selection capabilities
//      Benefits: Improved type safety, better developer experience with autocompletion and error checking
// ============================================================================
// DATABASE & MODELS
// ============================================================================

// TODO Consider removing NAME enum from Category schema
//      Current: name is NAME enum (Headphones|Earphones|Speakers)
//      Problem: Can't create new categories at runtime without schema migration + deploy
//      Recommendation: Change to name: String, slug: String @unique
//      Impact: More flexible content management, better i18n support, admin can add categories
//      Trade-off: Lose compile-time type safety for category names

// TODO Prisma optional field syntax: field? Type vs field Type?
//      Location: packages/database/prisma/schema/
//      Context: Optional fields in Prisma nested types can be declared two ways
//      Option 1: showCaseImage? ProductImagesProperties
//        - Field is optional (can be omitted entirely)
//        - Cleaner JSON, no null values in payload
//        - Better for optional images (featured, showcase, etc.)
//      Option 2: showCaseImage ProductImagesProperties?
//        - Field is required but can have null value
//        - Always include key, even if null
//      Recommendation: Use Option 1 (field?) for image types since not all products have all images
//      Current: Mix of both approaches in ProductImages type (should standardize)

// TODO Handle nested creates when creating Category with related Products
//      Context: Category can have products relation in Prisma
//      Consider: Should POST /categories accept nested product creation?
//      Example: { name: "Monitors", products: { create: [...] } }
//      Decision needed:
//        - Option 1: Keep Category create simple (no nested creates), manage products separately
//        - Option 2: Support nested creates with proper validation and transaction handling
//        - Option 3: Separate endpoint for bulk category+products creation
//      Current: CategoryService.create only handles CategoryCreateInput (no nested products)

// TODO soft delete for users needs a lot of work to be complete

// ============================================================================
// DATA & SEEDING
// ============================================================================

// TODO yx1 wireless earphones does not have related product image
// TODO add null values to product seed/? check which values are null by default
// TODO isNew as a virtual property - less than a year since arrival

// ============================================================================
// CODE ORGANIZATION & QUALITY
// ============================================================================
// TODO jsdoc comments for all service methods

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

// ============================================================================
// LEARNING & DOCUMENTATION
// ============================================================================

// TODO go over prisma basic principles
// TODO go over prisma relations (one to many, one to one, many to many)
// TODO go over prisma data types
// TODO go over express basic principles
// TODO go over turborepo core-concepts,https://turborepo.com/docs/core-concepts
// TODO go over monorepo best practices
// TODO basicly go over the whole project structure and understand each part

// // Query (pagination / sorting / filtering)
// export const ProductListQuerySchema = z
//   .object({
//     page: z
//       .string()
//       .regex(/^[0-9]+$/)
//       .transform(Number)
//       .optional()
//       .default(1),
//     limit: z
//       .string()
//       .regex(/^[0-9]+$/)
//       .transform(Number)
//       .optional()
//       .default(20),
//     sort: z
//       .string()
//       .optional()
//       .refine(
//         (val) =>
//           !val ||
//           [
//             "price",
//             "-price",
//             "name",
//             "-name",
//             "createdAt",
//             "-createdAt",
//           ].includes(val),
//         { message: "Invalid sort field" }
//       ),
//     minPrice: z
//       .string()
//       .regex(/^[0-9]+$/)
//       .transform(Number)
//       .optional(),
//     maxPrice: z
//       .string()
//       .regex(/^[0-9]+$/)
//       .transform(Number)
//       .optional(),
//     category: z.string().optional(),
//     fields: z
//       .string()
//       .optional()
//       .refine(
//         (val) =>
//           !val ||
//           val
//             .split(",")
//             .every((f) =>
//               ["id", "name", "slug", "price", "categoryId"].includes(f.trim())
//             ),
//         { message: "Invalid fields projection" }
//       ),
//   })
//   .refine((q) => !(q.minPrice && q.maxPrice && q.minPrice > q.maxPrice), {
//     message: "minPrice cannot exceed maxPrice",
//     path: ["minPrice"],
//   });
