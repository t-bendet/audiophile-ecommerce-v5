import { prisma } from "@repo/database";
import type {
  Category,
  CategoryCreateInput,
  CategorySelect,
  CategoryUpdateInput,
  CategoryWhereInput,
  NAME,
  CategoryScalarFieldEnum,
} from "@repo/domain";
import { NAME as NAME_ENUM } from "@repo/domain";
import AppError from "../utils/appError.js";
import { AbstractCrudService } from "./abstract-crud.service.js";

// DTO type and filter,declared in service
export type CategoryDTO = Pick<
  Category,
  "id" | "name" | "thumbnail" | "createdAt" | "v"
>;
// TODO scalar fields and filter should match

export type CategoryFilter = Pick<Category, "name">;

// TODO define query params type
export type CategoryQueryParams = {
  name?: string;
  page?: string | number;
  limit?: string | number;
  sort?: string;
  fields?: string;
};
export class CategoryService extends AbstractCrudService<
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryDTO,
  CategoryWhereInput,
  CategorySelect,
  CategoryFilter
> {
  protected toDTO(entity: Category): CategoryDTO {
    return {
      id: entity.id,
      name: entity.name,
      thumbnail: entity.thumbnail,
      createdAt: entity.createdAt,
      v: entity.v,
    };
  }

  // ***** Persistence Layer Methods (to be implemented by subclasses) *****
  // *include filtering, pagination, ordering, selection as needed for list operations*

  protected async persistFindMany(params: {
    where: CategoryWhereInput;
    skip: number;
    take: number;
    orderBy?: any;
    select?: CategorySelect;
  }): Promise<{ data: Category[]; total: number }> {
    const [data, total] = await prisma.$transaction([
      prisma.category.findMany({
        where: params.where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
        select: params.select,
      }),
      prisma.category.count({ where: params.where }),
    ]);
    return { data, total };
  }

  protected async persistFindById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  }

  protected async persistCreate(input: CategoryCreateInput) {
    return prisma.category.create({ data: input });
  }

  /**
   * Whitelist only allowed fields for updates
   * Prevents clients from updating fields like 'id', 'createdAt', 'v', etc.
   */
  protected filterUpdateInput(input: CategoryUpdateInput): CategoryUpdateInput {
    // Define which fields are allowed to be updated
    const allowedFields: (keyof CategoryUpdateInput)[] = [
      "name",
      "thumbnail",
      // Add other updateable fields here
    ];

    return this.pickFields(input, allowedFields);
  }

  protected async persistUpdate(id: string, input: CategoryUpdateInput) {
    try {
      const entity = await prisma.category.update({
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
      await prisma.category.delete({ where: { id } });
      return true;
    } catch (e: any) {
      if (e?.code === "P2025") return false;
      throw e;
    }
  }

  protected parseSelect(fields?: string): CategorySelect | undefined {
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
    ] as const satisfies readonly CategoryScalarFieldEnum[];

    const select: Partial<CategorySelect> = {};

    for (const key of selectKeys) {
      // Type-safe check using readonly array
      if (validFields.includes(key as (typeof validFields)[number])) {
        select[key as keyof CategorySelect] = true;
      }
    }

    return Object.keys(select).length > 0
      ? (select as CategorySelect)
      : undefined;
  }

  protected buildWhere(filter?: CategoryFilter): CategoryWhereInput {
    if (!filter?.name) {
      return {};
    }

    if (!Object.values(NAME_ENUM).includes(filter.name)) {
      throw new AppError(`Invalid name value: ${filter.name}`, 400);
    }

    return {
      name: { equals: filter.name },
    };
  }

  protected parseFilter(
    query: CategoryQueryParams
  ): CategoryFilter | undefined {
    if (!query.name || typeof query.name !== "string") {
      return undefined;
    }

    // Type guard: validate the name is a valid NAME enum value
    if (!Object.values(NAME_ENUM).includes(query.name as NAME)) {
      return undefined;
    }

    return { name: query.name as NAME };
  }

  // ** Helper Methods (optional overrides) **
}

export const categoryService = new CategoryService();
