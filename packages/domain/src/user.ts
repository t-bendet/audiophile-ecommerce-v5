import type { Prisma, User as PrismaUser } from "@repo/database";
import { z } from "zod";
import {
  createRequestSchema,
  EmptyResponse,
  EmptyResponseSchema,
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
    .strict() satisfies z.ZodType<UserUpdateInput>,
});

// DELETE - Delete Me
export const UserDeleteMeRequestSchema = createRequestSchema({
  params: z.object({}).strict(),
});

// Admin Schemas

// LIST - Get all Users (pagination + filtering) - admin only

export const UserGetAllRequestSchema = createRequestSchema({
  query: z
    .object({
      sort: z.string().optional(),
      fields: z.string().optional(),
      page: z.coerce.number().int().positive().optional(),
      limit: z.coerce.number().int().positive().optional(),
      role: z.enum(ROLE).optional(),
    })
    .optional(),
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
    createdAt: z.date(),
    v: z.number(),
  })
  .strict();

// * =====  DTO Types (if needed)=====

export type UserDTO = z.infer<typeof UserDTOSchema>;

// * =====   Response Schemas & Types ( For Frontend)=====

// List response (array + pagination)
export const UserGetAllResponseSchema = ListResponseSchema(UserDTOSchema);
export type UserGetAllResponse = ListResponse<UserDTO>;

// Detail/Get response (single DTO)
export const UserGetByIdResponseSchema =
  SingleItemResponseSchema(UserDTOSchema);
export type UserGetByIdResponse = SingleItemResponse<UserDTO>;

// Create response (single DTO)
export const UserCreateResponseSchema = SingleItemResponseSchema(UserDTOSchema);
export type UserCreateResponse = SingleItemResponse<UserDTO>;

// Update response (single DTO)
export const UserUpdateByIdResponseSchema =
  SingleItemResponseSchema(UserDTOSchema);
export type UserUpdateByIdResponse = SingleItemResponse<UserDTO>;

// Delete response (no content)
export const UserDeleteByIdResponseSchema = EmptyResponseSchema;
export type UserDeleteByIdResponse = EmptyResponse;
