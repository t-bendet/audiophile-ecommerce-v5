import { prisma } from "@repo/database";
import type {
  Config,
  ConfigCreateInput,
  ConfigDTO,
  ConfigSelect,
  ConfigUpdateInput,
} from "@repo/domain";
import { AbstractCrudService } from "./abstract-crud.service.js";

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

  protected async persistFindMany(params: {
    page?: number;
    limit?: number;
    [key: string]: any;
  }): Promise<{ data: Config[]; total: number }> {
    const { page = 1, limit = 20, sort, fields } = params;
    const skip = (page - 1) * limit;

    const where = this.buildConfigWhere();
    const select = this.parseConfigSelect(fields);
    const orderBy = this.parseConfigOrderBy(sort);

    const [data, total] = await prisma.$transaction([
      prisma.config.findMany({
        where,
        skip,
        take: limit,
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

  protected parseSelect(fields?: string): ConfigSelect | undefined {
    if (!fields || typeof fields !== "string") {
      return undefined;
    }

    const selectKeys = fields.split(",");
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
      if (validFields.includes(key as (typeof validFields)[number])) {
        select[key as keyof ConfigSelect] = true;
      }
    }

    return Object.keys(select).length > 0
      ? (select as ConfigSelect)
      : undefined;
  }

  // ===== Private Query Builders =====

  private buildConfigWhere() {
    // Config typically has no filters (singleton pattern)
    return {};
  }

  private parseConfigSelect(fields?: string): ConfigSelect | undefined {
    if (!fields || typeof fields !== "string") {
      return undefined;
    }

    const selectKeys = fields.split(",");
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
      if (validFields.includes(key as (typeof validFields)[number])) {
        select[key as keyof ConfigSelect] = true;
      }
    }

    return Object.keys(select).length > 0
      ? (select as ConfigSelect)
      : undefined;
  }

  private parseConfigOrderBy(sort?: string) {
    if (!sort || typeof sort !== "string") {
      return [{ id: "desc" as const }];
    }

    return sort.split(",").map((field: string) => {
      const isDescending = field.startsWith("-");
      const fieldName = isDescending ? field.substring(1) : field;
      return { [fieldName]: isDescending ? "desc" : "asc" };
    });
  }
  async getUniqueConfig(): Promise<ConfigDTO | null> {
    const entity = await prisma.config.findFirst();
    return entity ? this.toDTO(entity) : null;
  }
}

export const configService = new ConfigService();
