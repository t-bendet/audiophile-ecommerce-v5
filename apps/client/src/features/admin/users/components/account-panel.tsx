import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { normalizeError } from "@/lib/errors/errors";
import type { UserDTO } from "@repo/domain";
import { useId, useState } from "react";
import { toast } from "sonner";
import { useSetUserActive, useSetUserRole } from "../api/get-admin-users";
import { ActiveBadge, RoleBadge } from "./user-badges";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

const overline = "text-xs font-bold tracking-600 uppercase text-neutral-500";

type AccountPanelProps = {
  user: UserDTO;
  /** The signed-in admin's own page offers neither write. */
  isSelf: boolean;
  /** The last active admin's role control is disabled and says why. */
  isLastActiveAdmin: boolean;
};

/** The user's fields and, each behind a confirmation, the active and role writes. */
export function AccountPanel({
  user,
  isSelf,
  isLastActiveAdmin,
}: AccountPanelProps) {
  return (
    <section
      aria-label="Account"
      className="flex flex-col gap-5 rounded-lg bg-neutral-100 p-6"
    >
      <h2 className={overline}>Account</h2>
      <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
        <dt className={overline}>Name</dt>
        <dd className="font-bold">{user.name}</dd>
        <dt className={overline}>Email</dt>
        <dd className="truncate">{user.email}</dd>
        <dt className={overline}>Role</dt>
        <dd>
          <RoleBadge role={user.role} />
        </dd>
        <dt className={overline}>Status</dt>
        <dd>
          <ActiveBadge active={user.active} />
        </dd>
        <dt className={overline}>Joined</dt>
        <dd>{dateFormatter.format(user.createdAt)}</dd>
      </dl>
      {!isSelf && (
        <div className="flex flex-col gap-3">
          <ActiveToggle user={user} />
          <RoleToggle user={user} isLastActiveAdmin={isLastActiveAdmin} />
        </div>
      )}
    </section>
  );
}

const ACTIVE_COPY = {
  deactivate: {
    button: "Deactivate account",
    title: "Deactivate this account?",
    description:
      "The shopper will be signed out and told the account has been deactivated when they next sign in. Their orders stay. You can reactivate the account later.",
    keep: "Keep active",
    confirm: "Deactivate",
    done: "Account deactivated",
    failed: "Account not deactivated",
  },
  reactivate: {
    button: "Reactivate account",
    title: "Reactivate this account?",
    description: "The shopper will be able to sign in again.",
    keep: "Keep deactivated",
    confirm: "Reactivate",
    done: "Account reactivated",
    failed: "Account not reactivated",
  },
} as const;

function ActiveToggle({ user }: { user: UserDTO }) {
  const [open, setOpen] = useState(false);
  const setActive = useSetUserActive(user.id);
  const copy = user.active ? ACTIVE_COPY.deactivate : ACTIVE_COPY.reactivate;

  const confirm = () =>
    setActive.mutate(!user.active, {
      onSuccess: () => {
        setOpen(false);
        toast.success(copy.done);
      },
      onError: (error) => {
        setOpen(false);
        toast.error(copy.failed, {
          description: normalizeError(error).message,
        });
      },
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-fit">
          {copy.button}
        </Button>
      </DialogTrigger>
      <DialogContent
        placement="centred"
        closeButton
        title={
          <span className="text-lg leading-none font-semibold">
            {copy.title}
          </span>
        }
        description={
          <span className="text-sm text-neutral-500">{copy.description}</span>
        }
        className="grid gap-4 p-6"
      >
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{copy.keep}</Button>
          </DialogClose>
          <Button
            variant="accent"
            onClick={confirm}
            disabled={setActive.isPending}
          >
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const ROLE_COPY = {
  promote: {
    button: "Make admin",
    title: "Promote to admin?",
    description:
      "They will reach the dashboard the next time they open a page, and can manage orders, users, the catalogue and the homepage.",
    keep: "Keep as shopper",
    confirm: "Promote",
    done: "Promoted to admin",
    failed: "Not promoted",
  },
  demote: {
    button: "Make shopper",
    title: "Demote to shopper?",
    description:
      "They will lose the dashboard the next time they open a page. Their account and orders stay.",
    keep: "Keep as admin",
    confirm: "Demote",
    done: "Demoted to shopper",
    failed: "Not demoted",
  },
} as const;

function RoleToggle({
  user,
  isLastActiveAdmin,
}: {
  user: UserDTO;
  isLastActiveAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const setRole = useSetUserRole(user.id);
  const reasonId = useId();
  const isAdmin = user.role === "ADMIN";
  const copy = isAdmin ? ROLE_COPY.demote : ROLE_COPY.promote;

  if (isLastActiveAdmin) {
    return (
      <>
        <Button
          variant="outline"
          className="w-fit"
          disabled
          aria-describedby={reasonId}
        >
          {copy.button}
        </Button>
        <p id={reasonId} className="text-xs text-neutral-500">
          This is the last active admin. Promote another user first.
        </p>
      </>
    );
  }

  const confirm = () =>
    setRole.mutate(isAdmin ? "USER" : "ADMIN", {
      onSuccess: () => {
        setOpen(false);
        toast.success(copy.done);
      },
      onError: (error) => {
        setOpen(false);
        toast.error(copy.failed, {
          description: normalizeError(error).message,
        });
      },
    });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-fit">
          {copy.button}
        </Button>
      </DialogTrigger>
      <DialogContent
        placement="centred"
        closeButton
        title={
          <span className="text-lg leading-none font-semibold">
            {copy.title}
          </span>
        }
        description={
          <span className="text-sm text-neutral-500">{copy.description}</span>
        }
        className="grid gap-4 p-6"
      >
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">{copy.keep}</Button>
          </DialogClose>
          <Button
            variant="accent"
            onClick={confirm}
            disabled={setRole.isPending}
          >
            {copy.confirm}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
