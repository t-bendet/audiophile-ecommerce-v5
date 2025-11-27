import { PrismaClient } from "../generated/prisma/client.js";
import type { NAME } from "../generated/prisma/enums.js";
import bcrypt from "bcrypt";

const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 12);
};

// Prisma Extensions Use cases:

// Input validation before saving to DB
// Computed fields that should always exist
// Data transformations that are DB-layer concerns

// Factory function to create extended Prisma client
function createPrismaClient() {
  const client = new PrismaClient({
    omit: {
      user: { password: true, passwordConfirm: true, active: true },
    },
  })
    .$extends({
      name: "productExtensions",
      model: {
        product: {
          async getProductsByCategory(categoryName: NAME) {
            const products = await client.product.findMany({
              where: {
                category: {
                  is: {
                    name: categoryName,
                  },
                },
              },
              select: {
                id: true,
                fullLabel: true,
                slug: true,
                images: {
                  select: {
                    introImage: true,
                  },
                },
                isNewProduct: true,
                description: true,
              },
            });
            return products;
          },
        },
      },
    })
    .$extends({
      name: "userExtensions",
      query: {
        user: {
          $allOperations(params: any) {
            const { model: _model, operation, args, query } = params;
            const findMethods = [
              "findFirst",
              "findMany",
              "findFirstOrThrow",
              "aggregate",
              "findUniqueOrThrow",
              "findUnique",
              "findMany",
            ] as const;
            type FindMethod = (typeof findMethods)[number];
            let queryArgs = args;
            if (findMethods.includes(operation as FindMethod)) {
              queryArgs = {
                ...args,
                // @ts-ignore
                ...(args.where
                  ? // @ts-ignore
                    { where: { ...args.where, active: { not: false } } }
                  : {}),
              };
            }
            return query(queryArgs);
          },
          // ** user input should be validated before this functions are called
          async create({ args, query }: any) {
            const hashedPassword = await hashPassword(args.data.password);
            args.data.password = hashedPassword;
            args.data.passwordConfirm = hashedPassword;
            return query(args);
          },
          async update({ args, query }: any) {
            // if password and password confirm exist ,iit can only be update password route
            if (args.data.password && args.data.passwordConfirm) {
              const hashedPassword = await hashPassword(
                args.data.password as string
              );
              args.data.password = hashedPassword;
              args.data.passwordConfirm = hashedPassword;
              //*  subtract 1 second, because the JWT can be created faster then saving the document,
              //* and then the changedPasswordAfter function will fail the auth process
              args.data.passwordChangedAt = new Date(Date.now() - 1000);
            }
            return query(args);
          },
          // *  soft delete all find methods will not return users marked as not active
        },
      },
      model: {
        user: {
          validatePassword: async function (
            candidatePassword: string,
            userPassword: string
          ) {
            return await bcrypt.compare(candidatePassword, userPassword);
          },
          isPasswordChangedAfter: async function (
            JWTTimestamp: number,
            passwordChangedAt: Date
          ) {
            if (passwordChangedAt) {
              const changedTimestamp = parseInt(
                (passwordChangedAt.getTime() / 1000).toString(),
                10
              );

              return JWTTimestamp < changedTimestamp;
            }
            // False means NOT changed
            return false;
          },
        },
      },
      result: {
        user: {},
      },
    });

  return client;
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
