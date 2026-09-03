import { prisma } from "@repo/database";
import type {
  Config,
  ConfigCreateInput,
  ConfigDTO,
  ConfigSelect,
  ConfigUpdateInput,
} from "@repo/domain";
import { parseOrderBy, parseSelect, type Pagination } from "../utils/query.js";
import { AbstractCrudService } from "./abstract-crud.service.js";

const CONFIG_QUERY_FIELDS = [
  "id",
  "name",
  "createdAt",
  "v",
] as const satisfies readonly (keyof ConfigSelect)[];

export class ConfigService extends AbstractCrudService<
  Config,
  ConfigCreateInput,
  ConfigUpdateInput,
  ConfigDTO
> {
  protected toDTO(entity: Config): ConfigDTO {
    return entity;
  }

  // ***** Persistence Layer Methods *****

  protected async persistFindMany(
    params: Pagination & { [key: string]: any }
  ): Promise<{ data: Config[]; total: number }> {
    const { skip, take, sort, fields } = params;

    const where = this.buildConfigWhere();
    const select = parseSelect(fields, CONFIG_QUERY_FIELDS);
    const orderBy = parseOrderBy(sort, CONFIG_QUERY_FIELDS);

    const [data, total] = await prisma.$transaction([
      prisma.config.findMany({
        where,
        skip,
        take,
        orderBy,
        select,
      }),
      prisma.config.count({ where }),
    ]);
    return { data, total };
  }

  protected async persistFindById(id: string) {
    return prisma.config.findUnique({ where: { id } });
  }

  protected async persistCreate(input: ConfigCreateInput) {
    return prisma.config.create({ data: input });
  }

  /**
   * Whitelist only allowed fields for updates
   * Prevents clients from updating fields like 'id', 'createdAt', 'v', etc.
   */
  protected filterUpdateInput(input: ConfigUpdateInput): ConfigUpdateInput {
    // Define which fields are not allowed to be updated
    const disallowedFields: (keyof typeof input)[] = [
      "createdAt",
      "v",
      // Add other non-updateable fields here
    ];

    return this.pickFieldsByNotAllowed(input, disallowedFields);
  }

  protected async persistUpdate(id: string, input: ConfigUpdateInput) {
    try {
      const entity = await prisma.config.update({
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
      await prisma.config.delete({ where: { id } });
      return true;
    } catch (e: any) {
      if (e?.code === "P2025") return false;
      throw e;
    }
  }

  // ===== Private Query Builders =====

  private buildConfigWhere() {
    // Config typically has no filters (singleton pattern)
    return {};
  }

  async getUniqueConfig(): Promise<ConfigDTO | null> {
    const entity = await prisma.config.findFirst();
    return entity ? this.toDTO(entity) : null;
  }
}

export const configService = new ConfigService();
