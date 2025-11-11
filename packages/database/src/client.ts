import { PrismaClient } from "../generated/prisma/client";
import { ProductExtensions } from "../models/product.model";
import { UserExtensions } from "../models/user.model";
// Instantiate the extended Prisma client to infer its type
const extendedPrisma = new PrismaClient({
  omit: {
    user: { password: true, passwordConfirm: true, active: true },
  },
})
  .$extends(UserExtensions)
  .$extends(ProductExtensions);

type ExtendedPrismaClient = typeof extendedPrisma;

// Use globalThis for broader environment compatibility

// const globalForPrisma = global as unknown as { prisma: ExtendedPrismaClient };

const globalForPrisma = globalThis as typeof globalThis & {
  prisma: ExtendedPrismaClient;
};

// Named export with global memoization
export const prisma: ExtendedPrismaClient =
  globalForPrisma.prisma || extendedPrisma;

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export * from "../generated/prisma/client";
