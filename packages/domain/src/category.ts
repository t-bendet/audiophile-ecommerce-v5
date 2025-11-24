import { $Enums } from "@repo/database";

export type TCategoryName = $Enums.NAME;

export const CategoryNameValues = Object.values($Enums.NAME) as [
  $Enums.NAME,
  ...$Enums.NAME[],
];
