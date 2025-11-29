// ===== Prisma Client & Types =====
import type { Prisma as PrismaNS } from "../generated/prisma/client.js";
// Re-export everything from generated Prisma client
export { PrismaClient, $Enums, Prisma } from "../generated/prisma/client.js";

// Export all types (models and namespace types)
export type * from "../generated/prisma/client.js";

// Explicit re-exports for commonly used types
export type {
  Category,
  Product,
  User,
  Config,
} from "../generated/prisma/client.js";

// Named aliases for common input/output types to improve IntelliSense in dependents
export type CategoryCreateInput = PrismaNS.CategoryCreateInput;
export type CategoryUpdateInput = PrismaNS.CategoryUpdateInput;
export type CategoryWhereInput = PrismaNS.CategoryWhereInput;
export type CategorySelect = PrismaNS.CategorySelect;
export type CategoryScalarFieldEnum = PrismaNS.CategoryScalarFieldEnum;

// ===== Extended Client =====
// Export the extended client instance and type
export { prisma, type ExtendedPrismaClient } from "./client.js";
