import { prisma } from "@repo/database";
import type {
  baseQueryParams,
  ROLE,
  UserPublicInfo,
  UserCreateInput,
  UserDTO,
  UserSelect,
  UserUpdateInput,
  UserWhereInput,
} from "@repo/domain";
import { AbstractCrudService } from "./abstract-crud.service.js";

// TODO scalar fields and filter should match
// TODO add update for admin to change user roles, active status, etc.

export interface UserFilter extends Partial<Pick<UserPublicInfo, "role">> {}

export interface UserQueryParams extends baseQueryParams, UserFilter {}

export class UserService extends AbstractCrudService<
  UserPublicInfo,
  UserCreateInput,
  UserUpdateInput,
  UserDTO,
  UserWhereInput,
  UserSelect,
  UserFilter
> {
  protected toDTO(entity: UserPublicInfo): UserDTO {
    const dto = {
      id: entity.id,
      name: entity.name,
      email: entity.email,
      role: entity.role,
      emailVerified: entity.emailVerified,
      createdAt: entity.createdAt,
      v: entity.v,
    };

    return dto satisfies UserDTO;
  }

  // ***** Persistence Layer Methods (to be implemented by subclasses) *****
  // *include filtering, pagination, ordering, selection as needed for list operations*

  protected async persistFindMany(params: {
    where: UserWhereInput;
    skip: number;
    take: number;
    orderBy?: any;
    select?: UserSelect;
  }): Promise<{ data: UserPublicInfo[]; total: number }> {
    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where: params.where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
        select: params.select,
      }),
      prisma.user.count({ where: params.where }),
    ]);
    return { data, total };
  }

  protected async persistFindById(id: string) {
    return prisma.user.findUnique({ where: { id } });
  }

  protected async persistCreate(input: UserCreateInput) {
    return prisma.user.create({ data: input });
  }

  /**
   * Whitelist only allowed fields for updates
   * Prevents clients from updating fields like 'password', 'passwordConfirm', etc.
   */
  protected filterUpdateInput(input: UserUpdateInput): UserUpdateInput {
    // Define which fields are allowed to be updated through this service
    const allowedFields: (keyof UserUpdateInput)[] = [
      "name",
      "email",
      "role",
      "emailVerified",
      "active",
      // Add other updateable fields here
    ];

    return this.pickFieldsByAllowed(input, allowedFields) as UserUpdateInput;
  }

  protected async persistUpdate(id: string, input: UserUpdateInput) {
    try {
      const entity = await prisma.user.update({
        where: { id },
        data: input,
      });
      return entity;
    } catch (e: any) {
      if (e?.code === "P2025") return null;
      throw e;
    }
  }

  protected async persistDelete(id: string) {
    try {
      await prisma.user.delete({ where: { id } });
      return true;
    } catch (e: any) {
      if (e?.code === "P2025") return false;
      throw e;
    }
  }

  protected parseSelect(fields?: string): UserSelect | undefined {
    if (!fields || typeof fields !== "string") {
      return undefined;
    }

    const selectKeys = fields.split(",");
    const validFields = [
      "id",
      "name",
      "email",
      "role",
      "password",
      "passwordConfirm",
      "passwordChangedAt",
      "passwordResetToken",
      "passwordResetExpires",
      "emailVerified",
      "createdAt",
      "active",
      "v",
    ] as const;

    const select: Partial<UserSelect> = {};

    for (const key of selectKeys) {
      if (validFields.includes(key as (typeof validFields)[number])) {
        select[key as keyof UserSelect] = true;
      }
    }

    return Object.keys(select).length > 0 ? (select as UserSelect) : undefined;
  }

  protected buildWhere(filter?: UserFilter): UserWhereInput {
    if (!filter) return {};
    const where: UserWhereInput = {};
    if (filter.role) {
      where.role = { equals: filter.role as ROLE };
    }
    return where;
  }

  protected parseFilter(query: UserQueryParams): UserFilter | undefined {
    if (!query?.role) return {};
    return { role: query.role };
  }

  // ** Helper Methods (optional overrides) **
}

export const userService = new UserService();
