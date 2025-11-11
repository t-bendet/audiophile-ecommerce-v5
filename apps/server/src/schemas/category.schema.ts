import { $Enums, NAME, Prisma, prisma } from "@repo/database";

// ** Base Types

export type TCategoryName = $Enums.NAME;

export const CategoryName = Object.values(NAME);

export type CategoryCreateInput = Prisma.CategoryCreateInput;

// *  Category Read

export type ReadOutput = Prisma.Result<
  typeof prisma.category,
  CategoryCreateInput,
  "create"
>;
