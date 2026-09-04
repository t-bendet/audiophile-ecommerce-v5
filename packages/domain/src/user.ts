import type { Prisma, User as PrismaUser } from "@repo/database";
import { z } from "zod";
import type { ExtendedQueryParams } from "./common.js";
import {
  createQueryParamsSchema,
  createRequestSchema,
  ListResponse,
  ListResponseSchema,
  SingleItemResponse,
  SingleItemResponseSchema,
} from "./common.js";
import {
  EmailValidator,
  IdValidator,
  NameValidator,
  PasswordValidator,
} from "./shared.js";

// * ===== Database Type Re-exports (Service Generics )=====

export type User = PrismaUser;
export type UserCreateInput = Prisma.UserCreateInput;
export type UserUpdateInput = Prisma.UserUpdateInput;
export type UserSelfUpdateInput = Pick<UserUpdateInput, "name" | "email">;
export type UserWhereInput = Prisma.UserWhereInput;
export type UserSelect = Prisma.UserSelect;
export type UserScalarFieldEnum = Prisma.UserScalarFieldEnum;

// *  ===== Entity Specific Types =====

export const ROLE = ["ADMIN", "USER"] as const;
export type ROLE = (typeof ROLE)[number];

// * =====  Common Schemas =====

export type UserPublicInfo = Omit<
  User,
  "password" | "passwordConfirm" | "active"
>;

// * ===== RequestSchemas =====

// User Schemas

// GET - Get single user by ID
export const UserGetMeRequestSchema = createRequestSchema({
  params: z.object({}).strict(),
});

// PATCH - Update Me

export const UserUpdateMeRequestSchema = createRequestSchema({
  params: z.object({}).strict(),
  body: z
    .object({
      name: NameValidator("User").optional(),
      email: EmailValidator.optional(),
    })
    .strict() satisfies z.ZodType<UserSelfUpdateInput>,
});

// DELETE - Delete Me
export const UserDeleteMeRequestSchema = createRequestSchema({
  params: z.object({}).strict(),
});

// Admin Schemas

// LIST - Get all Users (pagination + filtering) - admin only

export type UserQueryParams = ExtendedQueryParams<{ role?: ROLE }>;

export const USER_QUERY_FIELDS = [
  "id",
  "name",
  "email",
  "role",
  "emailVerified",
  "createdAt",
  "active",
  "v",
] as const satisfies readonly (keyof UserSelect)[];

export const UserQueryParamsSchema = createQueryParamsSchema(USER_QUERY_FIELDS)
  .extend({ role: z.enum(ROLE).optional() })
  .strict() satisfies z.ZodType<UserQueryParams>;

export const UserGetAllRequestSchema = createRequestSchema({
  query: UserQueryParamsSchema,
});

// CREATE - Create new user - admin only
export const UserCreateRequestSchema = createRequestSchema({
  body: z
    .object({
      name: NameValidator("User"),
      email: EmailValidator,
      password: PasswordValidator(),
      passwordConfirm: PasswordValidator("Password confirm"),
      role: z.enum(ROLE).optional(),
      active: z.boolean().optional(),
      emailVerified: z.boolean().optional(),
    })
    .strict()
    .refine((data) => data.password === data.passwordConfirm, {
      message: "Password and PasswordConfirm must match!",
      params: { passwordConfirm: "passwordConfirm" },
      path: ["password match"],
    }) satisfies z.Schema<UserCreateInput>,
});

// GET - Get single user by ID - admin only
export const UserGetByIdRequestSchema = createRequestSchema({
  params: z.object({ id: IdValidator("User") }).strict(),
});

// UPDATE - Update existing user  admin only
export const UserUpdateByIdRequestSchema = createRequestSchema({
  params: z.object({ id: IdValidator("User") }).strict(),
  body: z
    .object({
      name: NameValidator("User"),
      email: EmailValidator.optional(),
      role: z.enum(ROLE).optional(),
      active: z.boolean().optional(),
      emailVerified: z.boolean().optional(),
    })
    .strict() satisfies z.ZodType<UserUpdateInput>,
});

// DELETE - Delete user by ID
export const UserDeleteByIdRequestSchema = createRequestSchema({
  params: z.object({ id: IdValidator("User") }).strict(),
});

// * =====  DTO Schemas ( base and others if needed)=====

export const UserDTOSchema = z
  .object({
    id: IdValidator("User"),
    name: NameValidator("User"),
    email: EmailValidator,
    role: z.enum(ROLE),
    emailVerified: z.boolean(),
    createdAt: z.coerce.date(),
    v: z.number(),
  })
  .strict();

// * =====  DTO Types (if needed)=====

export type UserDTO = z.infer<typeof UserDTOSchema>;

// * =====   Response Schemas & Types ( For Frontend)=====

// List response (array + pagination)
export const UserGetAllResponseSchema = ListResponseSchema(UserDTOSchema);
export type UserGetAllResponse = ListResponse<UserDTO>;

// GetMe response (single DTO)
export const UserDTOResponseSchema = SingleItemResponseSchema(UserDTOSchema);
export type UserDTOResponse = SingleItemResponse<UserDTO>;
