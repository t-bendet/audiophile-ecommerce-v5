import type { Category, Prisma } from "@repo/database";
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
  { name?: string }
> {
  protected toDTO({ id, name, thumbnail }: Category): CategoryDTO {
    return {
      id,
      name,
      thumbnail,
    } as CategoryDTO;
  }

  protected buildWhere(filter?: { name?: string }): Prisma.CategoryWhereInput {
    if (!filter?.name) {
      return {};
    }

    // Validate and cast to NAME enum
    const nameValue = filter.name as NAME;

    // TODO AppError
    if (!Object.values(NAME).includes(nameValue)) {
      throw new AppError(`Invalid name value: ${filter.name}`, 400);
    }

    return {
      name: { equals: nameValue },
    };
  }

  // Convenience method: derive pagination + filter from raw query without APIFeatures
  async listFromQuery(query: any) {
    const pageRaw = query?.page;
    const limitRaw = query?.limit;
    const sortRaw = query?.sort as string | undefined; // e.g., "label:asc" or "createdAt:desc"

    const page = typeof pageRaw !== "undefined" ? Number(pageRaw) || 1 : 1;
    const limit = typeof limitRaw !== "undefined" ? Number(limitRaw) || 20 : 20;

    let orderBy: any | undefined = undefined;
    if (sortRaw && typeof sortRaw === "string") {
      const [field, dir] = sortRaw.split(":");
      if (field) {
        orderBy = { [field]: dir === "desc" ? "desc" : "asc" };
      }
    }

    const filter = {
      name: query?.name as string | undefined,
    };
    return this.list({ filter, page, limit, orderBy });
  }

  protected async persistFindMany(params: {
    where: any;
    skip: number;
    take: number;
    orderBy?: any;
  }): Promise<{ data: Category[]; total: number }> {
    const [data, total] = await prisma.$transaction([
      prisma.category.findMany({
        where: params.where,
        skip: params.skip,
        take: params.take,
        orderBy: params.orderBy,
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
