import type { UserDTO } from "@repo/domain";
import type { AdminUserFilters } from "./filters";

/** The users list query whose total counts the active admins. */
export const ACTIVE_ADMINS_FILTERS = {
  role: "ADMIN",
  active: true,
} as const satisfies AdminUserFilters;

/** Whether `user` is an active admin and `activeAdminTotal` counts no other. */
export const isLastActiveAdmin = (
  user: Pick<UserDTO, "role" | "active">,
  activeAdminTotal: number,
): boolean => user.role === "ADMIN" && user.active && activeAdminTotal <= 1;
