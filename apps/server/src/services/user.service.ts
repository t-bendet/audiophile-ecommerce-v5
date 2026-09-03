import { prisma } from "@repo/database";
import type {
  ROLE,
  UserCreateInput,
  UserDTO,
  UserPublicInfo,
  UserQueryParams,
  UserSelect,
  UserSelfUpdateInput,
  UserUpdateInput,
} from "@repo/domain";
import { parseOrderBy, parseSelect, type Pagination } from "../utils/query.js";
import { isRecordNotFoundError } from "../utils/prisma-errors.js";
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

  /** Privileged surface: the only path that may write role, emailVerified or active. */
  async updateAsAdmin(id: string, input: UserUpdateInput): Promise<UserDTO> {
    return super.update(id, input);
  }

  async deactivate(id: string): Promise<void> {
    await this.updateAsAdmin(id, { active: false });
  }

  // ***** Persistence Layer Methods *****

  protected async persistFindMany(
    params: Pagination & UserQueryParams,
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
    return this.pickFieldsByAllowed(input, [
      ...PRIVILEGED_UPDATE_FIELDS,
    ]) as UserUpdateInput;
  }

  protected async persistUpdate(id: string, input: UserUpdateInput) {
    try {
      const entity = await prisma.user.update({
        where: { id },
        data: input,
      });
      return entity;
    } catch (e) {
      if (isRecordNotFoundError(e)) return null;
      throw e;
    }
  }

  protected async persistDelete(id: string) {
    try {
      await prisma.user.delete({ where: { id } });
      return true;
    } catch (e) {
      if (isRecordNotFoundError(e)) return false;
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
