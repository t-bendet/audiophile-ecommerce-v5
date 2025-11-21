import { PrismaClient } from "../generated/prisma/client.js";
import { ProductExtensions } from "../models/product.model.js";
import { UserExtensions } from "../models/user.model.js";

// Factory function to create extended Prisma client
function createPrismaClient() {
  const client = new PrismaClient({
    omit: {
      user: { password: true, passwordConfirm: true, active: true },
    },
  });

  return client.$extends(UserExtensions).$extends(ProductExtensions);
}

// Infer type from factory return
export type ExtendedPrismaClient = ReturnType<typeof createPrismaClient>;

// Use globalThis for broader environment compatibility
const globalForPrisma = globalThis as typeof globalThis & {
  prisma: ExtendedPrismaClient | undefined;
};

// Named export with global memoization
export const prisma: ExtendedPrismaClient =
  globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "../generated/prisma/client.js";
