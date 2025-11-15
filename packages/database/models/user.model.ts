import { Prisma } from "../generated/prisma/client.js";
import bcrypt from "bcrypt";

const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 12);
};

export const UserExtensions = Prisma.defineExtension({
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
