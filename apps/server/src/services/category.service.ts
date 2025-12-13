import { prisma } from "@repo/database";
import type {
  Category,
  CategoryCreateInput,
  CategoryDTO,
  CategorySelect,
  CategoryUpdateInput,
  CategoryWhereInput,
  NAME,
} from "@repo/domain";
import { ErrorCode, NAME as NAME_ENUM } from "@repo/domain";
import AppError from "../utils/appError.js";
import { AbstractCrudService } from "./abstract-crud.service.js";

export class CategoryService extends AbstractCrudService<
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryDTO
> {
  protected toDTO(entity: Category): CategoryDTO {
    return entity;
  }

  protected async persistFindMany(params: {
    page?: number;
    limit?: number;
    [key: string]: any;
  }): Promise<{ data: Category[]; total: number }> {
    const { page = 1, limit = 20, name, sort, fields } = params;
    const skip = (page - 1) * limit;

    const where = this.buildCategoryWhere(name);
    const select = this.parseCategorySelect(fields);
    const orderBy = this.parseCategoryOrderBy(sort);

    const [data, total] = await prisma.$transaction([
      prisma.category.findMany({
        where,
        skip,
        take: limit,
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

  private parseCategorySelect(fields?: string) {
    if (!fields || typeof fields !== "string") {
      return undefined;
    }

    const selectKeys = fields.split(",");
    const validFields = ["id", "name", "createdAt", "v", "thumbnail"] as const;

    const select: Partial<CategorySelect> = {};
    for (const key of selectKeys) {
      if (validFields.includes(key as (typeof validFields)[number])) {
        select[key as keyof CategorySelect] = true;
      }
    }

    return Object.keys(select).length > 0
      ? (select as CategorySelect)
      : undefined;
  }

  private parseCategoryOrderBy(sort?: string) {
    if (!sort || typeof sort !== "string") {
      return [{ id: "desc" as const }];
    }

    return sort.split(",").map((field: string) => {
      const isDescending = field.startsWith("-");
      const fieldName = isDescending ? field.substring(1) : field;
      return { [fieldName]: isDescending ? "desc" : "asc" };
    });
  }
}

export const categoryService = new CategoryService();
