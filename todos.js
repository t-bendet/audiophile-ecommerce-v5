// ============================================================================
// WORKSPACE & ARCHITECTURE
// ============================================================================

// TODO add web folder and react ts config

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

// Prisma Extensions (Not Recommended for this)
// Use cases:

// Input validation before saving to DB
// Computed fields that should always exist
// Data transformations that are DB-layer concerns

// ============================================================================
// ERROR HANDLING & VALIDATION
// ============================================================================

// TODO add proper error handling middleware, remove my fixes and use zod flatteners
//      Location: apps/server/src/middlewares/error.middleware.ts
//      Note: refactor response structure, do we need status? reshape the error object for a normal error response
//      Reference: https://www.youtube.com/watch?v=T4Q1NvSePxs

// TODO rethink how to handle validateSchema message formatted errors

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

// ============================================================================
// LEARNING & DOCUMENTATION
// ============================================================================

// TODO go over prisma basic principles
// TODO go over prisma relations (one to many, one to one, many to many)
// TODO go over prisma data types
// TODO go over express basic principles
// TODO go over turborepo core-concepts,https://turborepo.com/docs/core-concepts
// TODO go over monorepo best practices
// TODO ts wizard ts config part
// TODO basicly go over the whole project structure and understand each part

// import z from "zod";
// import { IdValidator, NameValidator } from "./index.js";

// // Params
// export const ProductIdParamsSchema = z.object({
//   id: IdValidator("Product"),
// });

// export const ProductSlugParamsSchema = z.object({
//   slug: z
//     .string({ message: "Slug is required" })
//     .regex(/^[a-z0-9-]+$/i, { message: "Invalid slug format" })
//     .min(3)
//     .max(80),
// });

// export const ProductCategoryParamsSchema = z.object({
//   category: z.string({ message: "Category is required" }).min(2).max(40),
// });

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

// // Common sub-schemas
// const ImageSchema = z.object({
//   url: z.string().url(),
//   alt: z.string().min(1).max(120),
// });

// const IncludedItemSchema = z.object({
//   name: z.string().min(1).max(60),
//   quantity: z.number().int().positive(),
// });

// // Create
// export const ProductCreateSchema = z.object({
//   name: NameValidator("Product"),
//   slug: z
//     .string({ message: "Slug is required" })
//     .regex(/^[a-z0-9-]+$/i, { message: "Invalid slug format" })
//     .min(3)
//     .max(80),
//   description: z.string().min(10).max(5000),
//   price: z.number().positive().max(100000),
//   inventory: z.number().int().nonnegative().default(0),
//   categoryId: IdValidator("Category"),
//   featured: z.boolean().optional(),
//   showInShowcase: z.boolean().optional(),
//   images: z.array(ImageSchema).max(10).optional().default([]),
//   includedItems: z.array(IncludedItemSchema).max(20).optional().default([]),
// });

// // Update (partial; disallow changing slug if desired)
// export const ProductUpdateSchema = ProductCreateSchema.partial().extend({
//   slug: z
//     .string()
//     .regex(/^[a-z0-9-]+$/i)
//     .min(3)
//     .max(80)
//     .optional(),
// });

// // Public DTO output schema (shape sent to clients)
// export const ProductPublicSchema = z.object({
//   id: z.string(),
//   name: z.string(),
//   slug: z.string(),
//   price: z.number(),
//   description: z.string(),
//   categoryId: z.string(),
//   featured: z.boolean().optional(),
//   showInShowcase: z.boolean().optional(),
//   images: z.array(ImageSchema).optional(),
//   includedItems: z.array(IncludedItemSchema).optional(),
// });

// export type ProductCreateInput = z.infer<typeof ProductCreateSchema>;
// export type ProductUpdateInput = z.infer<typeof ProductUpdateSchema>;
// export type ProductListQuery = z.infer<typeof ProductListQuerySchema>;
// export type ProductPublic = z.infer<typeof ProductPublicSchema>;
// export type ProductIdParams = z.infer<typeof ProductIdParamsSchema>;
// export type ProductSlugParams = z.infer<typeof ProductSlugParamsSchema>;
// export type ProductCategoryParams = z.infer<typeof ProductCategoryParamsSchema>;

// // Mapper helper (domain object -> public DTO)
// export const toProductPublic = (product: any): ProductPublic => {
//   // Defensive picking
//   const base = {
//     id: product.id,
//     name: product.name,
//     slug: product.slug,
//     price: product.price,
//     description: product.description,
//     categoryId: product.categoryId,
//     featured: product.featured,
//     showInShowcase: product.showInShowcase,
//     images: product.images || [],
//     includedItems: product.includedItems || [],
//   };
//   return ProductPublicSchema.parse(base);
// };
