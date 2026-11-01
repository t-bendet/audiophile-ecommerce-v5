import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { normalizeError } from "@/lib/errors/errors";
import type { UserDTO } from "@repo/domain";
import { useState } from "react";
import { toast } from "sonner";
import { useSetUserActive } from "../api/get-admin-users";
import { ActiveBadge, RoleBadge } from "./user-badges";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

const overline = "text-xs font-bold tracking-600 uppercase text-neutral-500";

type AccountPanelProps = {
  user: UserDTO;
  /** The signed-in admin's own page offers no deactivate button. */
  isSelf: boolean;
};

/** The user's fields and, behind a confirmation, the one write this page offers. */
export function AccountPanel({ user, isSelf }: AccountPanelProps) {
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
      {!isSelf && <ActiveToggle user={user} />}
    </section>
  );
}

const COPY = {
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
  const copy = user.active ? COPY.deactivate : COPY.reactivate;

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
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{copy.title}</DialogTitle>
          <DialogDescription>{copy.description}</DialogDescription>
        </DialogHeader>
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
