import { $Enums } from "@repo/database";

// ** Base Types

export type TCategoryName = $Enums.NAME;

export const CategoryNameValues = Object.values($Enums.NAME) as [
  $Enums.NAME,
  ...$Enums.NAME[],
];

// export type CreateCategoryInput = Prisma.CategoryCreateInput;

// export type CreateCategoryResult = Prisma.CategoryGetPayload<{}>;
