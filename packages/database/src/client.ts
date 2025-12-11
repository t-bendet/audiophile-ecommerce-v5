import bcrypt from "bcrypt";
import { PrismaClient, $Enums } from "../generated/prisma/client.js";

type NAME = $Enums.NAME;

const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 12);
};

// Prisma Extensions Use cases:

// Input validation before saving to DB
// Computed fields that should always exist
// Data transformations that are DB-layer concerns

// Create base client
const baseClient = new PrismaClient({
  omit: {
    user: { password: true, passwordConfirm: true, active: true },
  },
});

const clientWithProductExtensions = baseClient.$extends({
  name: "productExtensions",
  model: {},
});

const fullyExtendedClient = clientWithProductExtensions.$extends({
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
            ...(args.where
              ? { where: { ...args.where, active: { not: false } } }
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

// Export the fully extended client instance
export const prisma = fullyExtendedClient;

// Export the type derived from the instance
export type ExtendedPrismaClient = typeof prisma;
