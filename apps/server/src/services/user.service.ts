import { prisma } from "@repo/database";
import type {
  ROLE,
  UserCreateInput,
  UserDTO,
  UserPublicInfo,
  UserQueryParams,
  UserSelect,
  UserUpdateInput,
} from "@repo/domain";
import { parseOrderBy, parseSelect, type Pagination } from "../utils/query.js";
import { AbstractCrudService } from "./abstract-crud.service.js";

const USER_QUERY_FIELDS = [
  "id",
  "name",
  "email",
  "role",
  "emailVerified",
  "createdAt",
  "active",
  "v",
] as const satisfies readonly (keyof UserSelect)[];

export class UserService extends AbstractCrudService<
  UserPublicInfo,
  UserCreateInput,
  UserUpdateInput,
  UserDTO,
  UserQueryParams
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

  // ***** Persistence Layer Methods *****

  protected async persistFindMany(
    params: Pagination & UserQueryParams
  ): Promise<{ data: UserPublicInfo[]; total: number }> {
    const { skip, take, role, sort, fields } = params;

    const where = this.buildUserWhere(role);
    const select = parseSelect(fields, USER_QUERY_FIELDS);
    const orderBy = parseOrderBy(sort, USER_QUERY_FIELDS);

    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
        select,
      }),
      prisma.user.count({ where }),
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

  // ===== Private Query Builders =====

  private buildUserWhere(role?: ROLE) {
    if (!role) {
      return {};
    }
    return {
      role: { equals: role },
    };
  }
}

export const userService = new UserService();
