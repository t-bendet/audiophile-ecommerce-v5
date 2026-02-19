// ===== Prisma Client & Types =====
// Re-export everything from generated Prisma client
export { PrismaClient, $Enums, Prisma } from "../generated/prisma/client.js";

// Export all types (models and namespace types)
export type * from "../generated/prisma/client.js";

// Export enums (values + types)
export * from "../generated/prisma/enums.js";

// ===== Extended Client =====
// Export the extended client instance and type
export { prisma, type ExtendedPrismaClient } from "./client.js";
