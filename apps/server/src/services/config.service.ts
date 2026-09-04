import { prisma } from "@repo/database";
import type {
  Config,
  ConfigCreateInput,
  ConfigDTO,
  ConfigQueryParams,
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

const CONFIG_UPDATE_FIELDS = [
  "name",
  "featuredProductId",
  "showCaseCoverId",
  "showCaseWideId",
  "showCaseGridId",
] as const satisfies readonly (keyof ConfigUpdateInput)[];

export class ConfigService extends AbstractCrudService<
  Config,
  ConfigCreateInput,
  ConfigUpdateInput,
  ConfigDTO,
  ConfigQueryParams
> {
  protected toDTO(entity: Config): ConfigDTO {
    return entity;
  }

  // ***** Persistence Layer Methods *****

  protected async persistFindMany(
    params: Pagination & ConfigQueryParams,
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

  protected filterUpdateInput(input: ConfigUpdateInput): ConfigUpdateInput {
    return this.pickFieldsByAllowed(input, [...CONFIG_UPDATE_FIELDS]);
  }

  protected async persistUpdate(id: string, input: ConfigUpdateInput) {
    return this.nullOnMissingRecord(() =>
      prisma.config.update({ where: { id }, data: input }),
    );
  }

  protected async persistDelete(id: string) {
    return this.falseOnMissingRecord(() =>
      prisma.config.delete({ where: { id } }),
    );
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
