import { prisma } from "@repo/database";
import type {
  ROLE,
  UserCreateInput,
  UserDTO,
  UserPublicInfo,
  UserSelect,
  UserUpdateInput,
} from "@repo/domain";
import { AbstractCrudService } from "./abstract-crud.service.js";

export class UserService extends AbstractCrudService<
  UserPublicInfo,
  UserCreateInput,
  UserUpdateInput,
  UserDTO
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

  protected async persistFindMany(params: {
    page?: number;
    limit?: number;
    [key: string]: any;
  }): Promise<{ data: UserPublicInfo[]; total: number }> {
    const { page = 1, limit = 20, role, sort, fields } = params;
    const skip = (page - 1) * limit;

    const where = this.buildUserWhere(role);
    const select = this.parseUserSelect(fields);
    const orderBy = this.parseUserOrderBy(sort);

    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
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

  // ===== Private Query Builders =====

  private buildUserWhere(role?: string) {
    if (!role || typeof role !== "string") {
      return {};
    }
    return {
      role: { equals: role as ROLE },
    };
  }

  private parseUserSelect(fields?: string): UserSelect | undefined {
    if (!fields || typeof fields !== "string") {
      return undefined;
    }

    const selectKeys = fields.split(",");
    const validFields = [
      "id",
      "name",
      "email",
      "role",
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

  private parseUserOrderBy(sort?: string) {
    if (!sort || typeof sort !== "string") {
      return [{ id: "desc" as const }];
    }

    return sort.split(",").map((field: string) => {
      const isDescending = field.startsWith("-");
      const fieldName = isDescending ? field.substring(1) : field;
      return { [fieldName]: isDescending ? "desc" : "asc" };
    });
  }
}

export const userService = new UserService();
