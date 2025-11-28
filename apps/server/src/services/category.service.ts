import { prisma } from "@repo/database";
import type {
  Category,
  CategoryCreateInput,
  CategorySelect,
  CategoryUpdateInput,
  CategoryWhereInput,
  NAME,
} from "@repo/domain";
import { NAME as NAME_ENUM } from "@repo/domain";
import AppError from "../utils/appError.js";
import { AbstractCrudService } from "./abstract-crud.service.js";

export type CategoryDTO = Pick<Category, "id" | "name" | "thumbnail">;

export class CategoryService extends AbstractCrudService<
  Category,
  CategoryCreateInput,
  CategoryUpdateInput,
  CategoryDTO,
  CategoryWhereInput,
  CategorySelect,
  { name?: NAME }
> {
  protected toDTO({
    id,
    name,
    thumbnail,
    createdAt,
    v,
  }: Category): CategoryDTO {
    return {
      id,
      name,
      thumbnail,
      createdAt,
      v,
    } as CategoryDTO;
  }

  protected buildWhere(filter?: { name?: NAME }): CategoryWhereInput {
    if (!filter?.name) {
      return {};
    }

    // Validate and cast to NAME enum
    const nameValue = filter.name as NAME;

    if (!Object.values(NAME_ENUM).includes(nameValue)) {
      throw new AppError(`Invalid name value: ${filter.name}`, 400);
    }

    return {
      name: { equals: nameValue },
    };
  }

  protected parseFilter(query: any): { name?: NAME } | undefined {
    return query.name ? { name: query.name as NAME } : undefined;
  }

  protected parseSelect(fields?: string): CategorySelect | undefined {
    if (!fields || typeof fields !== "string") {
      return undefined;
    }

    const selectKeys = fields.split(",") as (keyof CategorySelect)[];
    // Basic validation - only allow known scalar fields
    const validFields = ["id", "name", "thumbnail", "createdAt", "updatedAt"];
    return selectKeys.reduce((acc, key) => {
      if (validFields.includes(key as string)) {
        acc[key] = true;
      }
      return acc;
    }, {} as CategorySelect);
  }

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
