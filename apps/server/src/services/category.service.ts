import { Category, Prisma } from "@repo/database";
import { NAME, prisma } from "@repo/database";
import type { CategoryCreateInput, CategoryUpdateInput } from "@repo/domain";
import { AbstractCrudService } from "./abstract-crud.service.js";
import AppError from "../utils/appError.js";

export type CategoryDTO = Pick<Category, "id" | "name" | "thumbnail">;

export class CategoryService extends AbstractCrudService<
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryDTO,
  Prisma.CategoryWhereInput,
  Prisma.CategorySelect,
  { name?: NAME }
> {
  protected toDTO({ id, name, thumbnail }: Category): CategoryDTO {
    return {
      id,
      name,
      thumbnail,
    } as CategoryDTO;
  }

  protected buildWhere(filter?: { name?: NAME }): Prisma.CategoryWhereInput {
    if (!filter?.name) {
      return {};
    }

    // Validate and cast to NAME enum
    const nameValue = filter.name as NAME;

    if (!Object.values(NAME).includes(nameValue)) {
      throw new AppError(`Invalid name value: ${filter.name}`, 400);
    }

    return {
      name: { equals: nameValue },
    };
  }

  protected parseFilter(query: any): { name?: NAME } | undefined {
    return query.name ? { name: query.name as NAME } : undefined;
  }

  protected parseSelect(fields?: string): Prisma.CategorySelect | undefined {
    if (!fields || typeof fields !== "string") {
      return undefined;
    }

    const selectKeys = fields.split(",") as (keyof Prisma.CategorySelect)[];
    return selectKeys.reduce((acc, key) => {
      if (key in Prisma.CategoryScalarFieldEnum) {
        acc[key] = true;
      }
      return acc;
    }, {} as Prisma.CategorySelect);
  }

  protected async persistFindMany(params: {
    where: Prisma.CategoryWhereInput;
    skip: number;
    take: number;
    orderBy?: any;
    select?: Prisma.CategorySelect;
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
}

export const categoryService = new CategoryService();
