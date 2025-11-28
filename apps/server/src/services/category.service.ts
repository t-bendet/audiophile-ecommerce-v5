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

  // Convenience method: derive pagination + filter from raw query without APIFeatures
  // TODO neccsesary?, mayabe add to abstract class
  // TODO go over select types constraints and inference
  async listFromQuery(query: any) {
    const sortRaw = query?.sort as string | undefined; // e.g., "label:asc" or "createdAt:desc"

    const page =
      typeof query?.page !== "undefined" ? Number(query?.page) || 1 : 1;
    const limit =
      typeof query?.limit !== "undefined" ? Number(query?.limit) || 20 : 20;

    let orderBy: any | undefined = undefined;

    if (sortRaw && typeof sortRaw === "string") {
      const [field, dir] = sortRaw.split(":");
      if (field) {
        orderBy = { [field]: dir === "desc" ? "desc" : "asc" };
      }
    }

    const selectKeys = (query?.select as keyof Prisma.CategorySelect)
      ? query?.select
      : undefined;
    const filter = {
      name: query?.name as NAME | undefined,
    };

    const selects = selectKeys?.split(",") as (keyof Prisma.CategorySelect)[];
    const select =
      selects && selects.length > 0
        ? selects.reduce((acc, key) => {
            if (key in Prisma.CategoryScalarFieldEnum) acc[key] = true;
            return acc;
          }, {} as Prisma.CategorySelect)
        : undefined;

    return this.list({
      filter,
      page,
      limit,
      orderBy,
      select,
    });
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
