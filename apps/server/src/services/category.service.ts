import { prisma } from "@repo/database";
import type {
  Category,
  CategoryCreateInput,
  CategoryDTO,
  CategorySelect,
  CategoryUpdateInput,
  NAME,
} from "@repo/domain";
import { NAME as NAME_ENUM } from "@repo/domain";
import { parseOrderBy, parseSelect, type Pagination } from "../utils/query.js";
import { AbstractCrudService } from "./abstract-crud.service.js";

const CATEGORY_QUERY_FIELDS = [
  "id",
  "name",
  "createdAt",
  "v",
  "thumbnail",
] as const satisfies readonly (keyof CategorySelect)[];

export class CategoryService extends AbstractCrudService<
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryDTO
> {
  protected toDTO(entity: Category): CategoryDTO {
    return entity;
  }

  protected async persistFindMany(
    params: Pagination & { [key: string]: any }
  ): Promise<{ data: Category[]; total: number }> {
    const { skip, take, name, sort, fields } = params;

    const where = this.buildCategoryWhere(name);
    const select = parseSelect(fields, CATEGORY_QUERY_FIELDS);
    const orderBy = parseOrderBy(sort, CATEGORY_QUERY_FIELDS);

    const [data, total] = await prisma.$transaction([
      prisma.category.findMany({
        where,
        skip,
        take,
        orderBy,
        select,
      }),
      prisma.category.count({ where }),
    ]);
    return { data, total };
  }

  protected async persistFindById(id: string) {
    return prisma.category.findUnique({ where: { id } });
  }

  protected async persistCreate(input: CategoryCreateInput) {
    return prisma.category.create({ data: input });
  }

  protected filterUpdateInput(input: CategoryUpdateInput): CategoryUpdateInput {
    const allowedFields: (keyof CategoryUpdateInput)[] = ["name", "thumbnail"];
    return this.pickFieldsByAllowed(input, allowedFields);
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

  // ===== Private Query Builders =====

  private buildCategoryWhere(name?: string) {
    if (!name || typeof name !== "string") {
      return {};
    }

    // Validate that the name is a valid NAME enum value
    if (!Object.values(NAME_ENUM).includes(name as NAME)) {
      return {};
    }

    return {
      name: name as NAME,
    };
  }
}

export const categoryService = new CategoryService();
