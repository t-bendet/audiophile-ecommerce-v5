import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { paths } from "@/config/paths";
import type { UserDTO } from "@repo/domain";
import { Link } from "react-router";
import { ActiveBadge, RoleBadge } from "./user-badges";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

const overline = "text-xs font-bold tracking-600 uppercase";

/** Every user as table rows from `md` up and as stacked cards below. */
export function UsersTable({ users }: { users: UserDTO[] }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-lg bg-neutral-100 md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {["Name", "Email", "Role", "Active", "Created"].map((heading) => (
                <TableHead
                  key={heading}
                  className={`${overline} h-14 px-6 text-neutral-500`}
                >
                  {heading}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="h-16">
                <TableCell className="px-6 font-bold">
                  <Link
                    to={paths.admin.user.getHref(user.id)}
                    className="hover:text-primary-500"
                  >
                    {user.name}
                  </Link>
                </TableCell>
                <TableCell className="max-w-64 truncate px-6">
                  {user.email}
                </TableCell>
                <TableCell className="px-6">
                  <RoleBadge role={user.role} />
                </TableCell>
                <TableCell className="px-6">
                  <ActiveBadge active={user.active} />
                </TableCell>
                <TableCell className="px-6">
                  {dateFormatter.format(user.createdAt)}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="flex flex-col gap-4 md:hidden">
        {users.map((user) => (
          <li key={user.id}>
            <Link
              to={paths.admin.user.getHref(user.id)}
              className="flex items-center justify-between gap-4 rounded-lg bg-neutral-100 p-5"
            >
              <span className="flex min-w-0 flex-col gap-1">
                <span className="truncate font-bold">{user.name}</span>
                <span className="truncate text-sm text-neutral-500">
                  {user.email}
                </span>
              </span>
              <ActiveBadge active={user.active} />
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
