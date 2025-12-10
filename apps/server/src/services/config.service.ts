import { prisma } from "@repo/database";
import type {
  baseQueryParams,
  Config,
  ConfigCreateInput,
  ConfigDTO,
  ConfigSelect,
  ConfigUpdateInput,
  ConfigWhereInput,
} from "@repo/domain";
import { AbstractCrudService } from "./abstract-crud.service.js";

// TODO scalar fields and filter should match

export interface ConfigFilter {}

export interface ConfigQueryParams extends baseQueryParams, ConfigFilter {}

export class ConfigService extends AbstractCrudService<
  Config,
  ConfigCreateInput,
  ConfigUpdateInput,
  ConfigDTO,
  ConfigWhereInput,
  ConfigSelect,
  ConfigFilter
> {
  protected toDTO(entity: Config): ConfigDTO {
    return entity;
  }

  // ***** Persistence Layer Methods (to be implemented by subclasses) *****
  // *include filtering, pagination, ordering, selection as needed for list operations*

  protected async persistFindMany(params: {
    where: ConfigWhereInput;
    skip: number;
    take: number;
    orderBy?: any;
    select?: ConfigSelect;
  }): Promise<{ data: Config[]; total: number }> {
    const [data, total] = await prisma.$transaction([
      prisma.config.findMany({
        where: params.where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
        select: params.select,
      }),
      prisma.config.count({ where: params.where }),
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

  protected parseSelect(fields?: string): ConfigSelect | undefined {
    if (!fields || typeof fields !== "string") {
      return undefined;
    }

    const selectKeys = fields.split(",");
    // Use const assertion for better type inference
    const validFields = [
      "id",
      "name",
      "createdAt",
      "v",
      "featuredProduct",
      "showCaseProducts",
    ] as const;

    const select: Partial<ConfigSelect> = {};

    for (const key of selectKeys) {
      // Type-safe check using readonly array
      if (validFields.includes(key as (typeof validFields)[number])) {
        select[key as keyof ConfigSelect] = true;
      }
    }

    return Object.keys(select).length > 0
      ? (select as ConfigSelect)
      : undefined;
  }

  protected buildWhere(filter?: ConfigFilter): ConfigWhereInput {
    // Config typically has no filters (singleton pattern)
    return {};
  }

  protected parseFilter(query: ConfigQueryParams): ConfigFilter | undefined {
    // Config typically has no filters (singleton pattern)
    return undefined;
  }

  // ** Helper Methods (optional overrides) **
  async getUniqueConfig(): Promise<ConfigDTO | null> {
    const entity = await prisma.config.findFirst();
    return entity ? this.toDTO(entity) : null;
  }
}

export const configService = new ConfigService();
