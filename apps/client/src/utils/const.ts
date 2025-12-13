import { $Enums } from "database";

// FIXME : This is a temporary solution to avoid circular dependency issues.
// It should be replaced with a proper enum or type definition in the future.
export const categoryNames = [
  "Headphones",
  "Earphones",
  "Speakers",
] as const satisfies $Enums.NAME[];
