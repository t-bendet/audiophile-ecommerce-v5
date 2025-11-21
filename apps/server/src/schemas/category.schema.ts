import { $Enums, Prisma, prisma } from "@repo/database";

// ** Base Types

export type TCategoryName = $Enums.NAME;

export const CategoryNameValues = Object.values($Enums.NAME);

export type CategoryCreateInput = Prisma.CategoryCreateInput;

// *  Category Read

export type CategoryCreateResult = Prisma.Result<
  typeof prisma.category,
  CategoryCreateInput,
  "create"
>;
