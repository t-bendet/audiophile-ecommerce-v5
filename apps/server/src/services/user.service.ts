import { prisma } from "@repo/database";
import type {
  UserCreateInput,
  UserDTO,
  UserPublicInfo,
  UserQueryParams,
  UserSelfUpdateInput,
  UserUpdateInput,
  UserWhereInput,
} from "@repo/domain";
import { AppError, ErrorCode, USER_QUERY_FIELDS } from "@repo/domain";
import {
  parseOrderBy,
  rejectUnknownFields,
  type Pagination,
} from "../utils/query.js";
import { emailTakenError, isEmailTakenError } from "./auth.service.js";
import { AbstractCrudService } from "./abstract-crud.service.js";

const SELF_UPDATE_FIELDS = [
  "name",
  "email",
] as const satisfies readonly (keyof UserSelfUpdateInput)[];

const PRIVILEGED_UPDATE_FIELDS = [
  "name",
  "email",
  "role",
  "emailVerified",
  "active",
] as const satisfies readonly (keyof UserUpdateInput)[];

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
      active: entity.active,
      createdAt: entity.createdAt,
      v: entity.v,
    };

    return dto satisfies UserDTO;
  }

  // ***** Public CRUD Methods *****

  /** Self-service surface: narrows the input to the fields a user owns. */
  override async update(
    id: string,
    input: UserSelfUpdateInput,
  ): Promise<UserDTO> {
    try {
      return await super.update(
        id,
        this.pickFieldsByAllowed(input, [
          ...SELF_UPDATE_FIELDS,
        ]) as UserUpdateInput,
      );
    } catch (error) {
      if (isEmailTakenError(error)) throw emailTakenError();
      throw error;
    }
  }

  /**
   * Privileged surface: the only path that may write role, emailVerified or
   * active. An admin cannot deactivate their own account or change their own
   * role, and the last active admin cannot be demoted.
   */
  async updateAsAdmin(
    id: string,
    input: UserUpdateInput,
    actingUserId?: string,
  ): Promise<UserDTO> {
    if (input.active === false && id === actingUserId) {
      throw new AppError(
        "You cannot deactivate your own account.",
        ErrorCode.FORBIDDEN,
      );
    }
    if (input.role === "USER" && (await this.isLastActiveAdmin(id))) {
      throw new AppError(
        "The last active admin cannot be demoted.",
        ErrorCode.FORBIDDEN,
      );
    }
    if (input.role !== undefined && id === actingUserId) {
      throw new AppError(
        "You cannot change your own role.",
        ErrorCode.FORBIDDEN,
      );
    }
    return super.update(id, input);
  }

  async deactivate(id: string, password: string): Promise<void> {
    const user = await prisma.user.findUnique({
      where: { id },
      omit: { password: false },
    });
    if (
      !user ||
      !(await prisma.user.validatePassword(password, user.password))
    ) {
      throw new AppError(
        "Your current password is wrong.",
        ErrorCode.INVALID_CREDENTIALS,
        undefined,
        [
          {
            code: "invalid",
            message: "Your current password is wrong.",
            path: ["body", "password"],
          },
        ],
      );
    }
    if (await this.isLastActiveAdmin(id)) {
      throw new AppError(
        "The last active admin cannot deactivate their account.",
        ErrorCode.FORBIDDEN,
      );
    }
    await super.update(id, { active: false });
  }

  /** Whether `id` is an active admin and no other active admin exists. */
  async isLastActiveAdmin(id: string): Promise<boolean> {
    const user = await prisma.user.findUnique({ where: { id } });
    if (user?.role !== "ADMIN" || !user.active) return false;
    const otherActiveAdmins = await prisma.user.count({
      where: { role: "ADMIN", active: true, id: { not: id } },
    });
    return otherActiveAdmins === 0;
  }

  /** How many accounts were created since `since`, or ever when it is null. */
  async countCreatedSince(since: Date | null): Promise<number> {
    return prisma.user.count({
      where: since ? { createdAt: { gte: since } } : {},
    });
  }

  // ***** Persistence Layer Methods *****

  protected async persistFindMany(
    params: Pagination & UserQueryParams,
  ): Promise<{ data: UserPublicInfo[]; total: number }> {
    const { skip, take, search, role, active, sort, fields } = params;

    const where = this.buildUserWhere({ search, role, active });
    rejectUnknownFields(fields, USER_QUERY_FIELDS);
    const orderBy = parseOrderBy(sort, USER_QUERY_FIELDS);

    const [data, total] = await prisma.$transaction([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy,
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
    return this.pickFieldsByAllowed(input, [
      ...PRIVILEGED_UPDATE_FIELDS,
    ]) as UserUpdateInput;
  }

  protected async persistUpdate(id: string, input: UserUpdateInput) {
    return this.nullOnMissingRecord(() =>
      prisma.user.update({ where: { id }, data: input }),
    );
  }

  protected async persistDelete(id: string) {
    return this.falseOnMissingRecord(() =>
      prisma.user.delete({ where: { id } }),
    );
  }

  // ===== Private Query Builders =====

  private buildUserWhere({
    search,
    role,
    active,
  }: Pick<UserQueryParams, "search" | "role" | "active">): UserWhereInput {
    return {
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
      ...(role && { role }),
      ...(active !== undefined && { active }),
    };
  }
}

export const userService = new UserService();
