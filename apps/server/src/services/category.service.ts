import { prisma } from "@repo/database";
import type {
  Category,
  CategoryCreateInput,
  CategoryDTO,
  CategoryQueryParams,
  CategoryUpdateInput,
  NAME,
} from "@repo/domain";
import { CATEGORY_QUERY_FIELDS } from "@repo/domain";
import { parseOrderBy, parseSelect, type Pagination } from "../utils/query.js";
import { AbstractCrudService } from "./abstract-crud.service.js";

const CATEGORY_UPDATE_FIELDS = [
  "name",
  "thumbnail",
] as const satisfies readonly (keyof CategoryUpdateInput)[];

export class CategoryService extends AbstractCrudService<
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryDTO,
  CategoryQueryParams
> {
  protected toDTO(entity: Category): CategoryDTO {
    return entity;
  }

  protected async persistFindMany(
    params: Pagination & CategoryQueryParams,
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
    return this.pickFieldsByAllowed(input, [...CATEGORY_UPDATE_FIELDS]);
  }

  protected async persistUpdate(id: string, input: CategoryUpdateInput) {
    return this.nullOnMissingRecord(() =>
      prisma.category.update({ where: { id }, data: input }),
    );
  }

  protected async persistDelete(id: string) {
    return this.falseOnMissingRecord(() =>
      prisma.category.delete({ where: { id } }),
    );
  }

  // ===== Private Query Builders =====

  private buildCategoryWhere(name?: NAME) {
    return name ? { name } : {};
  }
}

export const categoryService = new CategoryService();
