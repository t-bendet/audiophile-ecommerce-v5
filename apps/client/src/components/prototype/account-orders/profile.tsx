import { Metadata } from "@/components/seo/metadata";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { paths } from "@/config/paths";
import {
  authInputClass,
  authLabelClass,
} from "@/features/auth/components/auth-styles";
import { listOrdersQueryOptions } from "@/features/orders/api/get-orders";
import { getUserQueryOptions } from "@/lib/auth";
import type { UserDTO } from "@repo/domain";
import { QueryClient, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, LoaderFunctionArgs } from "react-router";
import { toast } from "sonner";
import { StatusBadge } from "./order-parts";
import { orderHref } from "./orders-list";
import { panelTitle, sectionTitle } from "./shell";
import { useProto } from "./store";
import { dateFormatter, shortOrderId } from "./timeline";

// Two profile pages. Nothing here calls PATCH /users/updateMe; saves are stubs.

const joined = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

function DetailsFields({ user, idPrefix }: { user: UserDTO; idPrefix: string }) {
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-name`} className={authLabelClass}>
          Name
        </FieldLabel>
        <Input
          id={`${idPrefix}-name`}
          name="name"
          defaultValue={user.name}
          autoComplete="name"
          className={authInputClass}
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-email`} className={authLabelClass}>
          Email
        </FieldLabel>
        <Input
          id={`${idPrefix}-email`}
          name="email"
          type="email"
          defaultValue={user.email}
          autoComplete="email"
          className={authInputClass}
          required
        />
        <p className="text-sm text-neutral-500">
          You sign in with this email. Order emails go to the address on each order.
        </p>
      </Field>
    </FieldGroup>
  );
}

function ProfileA({ user }: { user: UserDTO }) {
  return (
    <section aria-label="Profile" className="max-w-md">
      <h2 className={sectionTitle}>Profile</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Member since {joined.format(user.createdAt)}
      </p>
      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          toast.success("Profile updated");
        }}
      >
        <DetailsFields user={user} idPrefix="profile" />
        <Button type="submit" variant="accent" className="mt-6">
          Save changes
        </Button>
      </form>
    </section>
  );
}

function EditDetailsDialog({ user }: { user: UserDTO }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-fit">
          Edit details
        </Button>
      </DialogTrigger>
      <DialogContent
        placement="centred"
        closeButton
        title={<span className="text-lg leading-none font-semibold">Edit your details</span>}
        className="grid gap-6 p-6"
      >
        <form
          id="edit-details"
          onSubmit={(event) => {
            event.preventDefault();
            setOpen(false);
            toast.success("Profile updated");
          }}
        >
          <DetailsFields user={user} idPrefix="dialog" />
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="edit-details" variant="accent">
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RecentOrders() {
  const { data } = useQuery(listOrdersQueryOptions());
  const orders = data?.data.slice(0, 2) ?? [];
  return (
    <section aria-label="Recent orders" className="flex flex-col gap-4 rounded-lg bg-neutral-200 p-6">
      <h3 className={panelTitle}>Recent orders</h3>
      {orders.length === 0 ? (
        <p className="text-sm text-neutral-500">You have no orders yet.</p>
      ) : (
        <ul className="divide-y divide-neutral-400">
          {orders.map((order) => (
            <li key={order.id} className="flex items-center justify-between gap-3 py-3 text-sm">
              <Link to={orderHref(order.id)} className="font-bold hover:text-primary-500">
                {shortOrderId(order.id)}
                <span className="ml-2 font-normal text-neutral-500">
                  {dateFormatter.format(order.createdAt)}
                </span>
              </Link>
              <StatusBadge status={order.status} />
            </li>
          ))}
        </ul>
      )}
      <Link to={paths.account.orders.getHref()} className="text-xs font-bold tracking-600 text-primary-500 uppercase">
        All orders
      </Link>
    </section>
  );
}

function ProfileB({ user }: { user: UserDTO }) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className={sectionTitle}>Profile</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <section aria-label="Your details" className="flex flex-col gap-5 rounded-lg bg-neutral-200 p-6">
          <h3 className={panelTitle}>Your details</h3>
          <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3 text-sm">
            <dt className={panelTitle}>Name</dt>
            <dd className="font-bold capitalize">{user.name}</dd>
            <dt className={panelTitle}>Email</dt>
            <dd className="break-all">{user.email}</dd>
            <dt className={panelTitle}>Joined</dt>
            <dd>{joined.format(user.createdAt)}</dd>
          </dl>
          <EditDetailsDialog user={user} />
        </section>
        <RecentOrders />
      </div>
      <p className="text-sm text-neutral-500">
        Change your password or deactivate your account under{" "}
        <Link to={paths.account.security.getHref()} className="font-bold text-primary-500">
          Security
        </Link>
        .
      </p>
    </div>
  );
}

const PROFILES = { A: ProfileA, B: ProfileB } as const;

export default function PrototypeProfilePage() {
  const { data: user } = useSuspenseQuery(getUserQueryOptions());
  const { profile } = useProto();
  const Profile = PROFILES[profile];
  return (
    <>
      <Metadata title="Your Profile" noIndex />
      <Profile user={user} />
    </>
  );
}

export const clientLoader =
  (_queryClient: QueryClient) => async (_context: LoaderFunctionArgs) => null;
