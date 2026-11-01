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
import { parseOrderBy, parseSelect, type Pagination } from "../utils/query.js";
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
    return super.update(
      id,
      this.pickFieldsByAllowed(input, [
        ...SELF_UPDATE_FIELDS,
      ]) as UserUpdateInput,
    );
  }

  /**
   * Privileged surface: the only path that may write role, emailVerified or
   * active. An admin cannot deactivate their own account.
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
    return super.update(id, input);
  }

  async deactivate(id: string): Promise<void> {
    await this.updateAsAdmin(id, { active: false });
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
