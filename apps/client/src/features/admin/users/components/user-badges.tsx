import { Badge } from "@/components/ui/badge";
import type { ROLE } from "@repo/domain";

/** The role pill: filled dark for an admin, neutral for a shopper. */
export function RoleBadge({ role }: { role: ROLE }) {
  return (
    <Badge variant={role.toLowerCase() as Lowercase<ROLE>}>
      {role.charAt(0) + role.slice(1).toLowerCase()}
    </Badge>
  );
}

/** The active-state pill, in the Delivered and Cancelled colours. */
export function ActiveBadge({ active }: { active: boolean }) {
  return active ? (
    <Badge variant="active">Active</Badge>
  ) : (
    <Badge variant="deactivated">Deactivated</Badge>
  );
}
