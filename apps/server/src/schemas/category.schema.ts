import { $Enums, Prisma } from "@repo/database";

// ** Base Types

export type TCategoryName = $Enums.NAME;

export const CategoryNameValues = Object.values($Enums.NAME) as [
  $Enums.NAME,
  ...$Enums.NAME[],
];

export type CategoryCreateInput = Prisma.CategoryCreateInput;

// *  Category Read

export type CategoryCreateResult = Prisma.CategoryGetPayload<{}>;
