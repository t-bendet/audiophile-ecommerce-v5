// PROTOTYPE Variant B (#320): the storefront's brand carried into the admin.
// Dark neutral-900 sidebar with an orange active bar, Manrope overlines,
// neutral-200 page, white cards. Below md the sidebar becomes a bottom tab bar.
// Lists stack to cards on a phone; order detail is summary left, actions right.
import Logo from "@/assets/logo.svg?react";
import ErrorBlock from "@/components/errors/error-block";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/cn";
import currencyFormatter from "@/utils/formatters";
import {
  ArrowLeft,
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Headphones,
  Home,
  Plus,
  ShoppingBag,
  Trash2,
  Users,
  type LucideIcon,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import {
  formatDate,
  formatDateTime,
  ORDER_STATUSES,
  orders,
  PAYMENT_STATUSES,
  PERIODS,
  productById,
  products,
  shortId,
  statsFor,
  statusLabel,
  thumbnailUrl,
  users,
  type Order,
  type OrderStatus,
  type PaymentStatus,
  type Period,
  type Product,
  type User,
} from "./data";
import { useHomepageSlots, useOrderEdit, useProductEdit } from "./hooks";
import {
  NAV,
  PAGE_TITLES,
  sectionOf,
  type Page,
  type VariantProps,
  type ViewState,
} from "./params";

const icons: Record<string, LucideIcon> = {
  orders: ShoppingBag,
  users: Users,
  products: Headphones,
  homepage: Home,
  stats: BarChart3,
};

const overline = "text-xs font-bold tracking-600 uppercase";

export function VariantB({ page, state, go }: VariantProps) {
  const active = sectionOf(page);
  const parent =
    page === "order"
      ? "orders"
      : page === "user"
        ? "users"
        : page === "product"
          ? "products"
          : null;
  return (
    <div className="flex min-h-dvh bg-neutral-200 font-Manrope text-neutral-900">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col bg-neutral-900 text-neutral-100 md:flex">
        <a
          href="/"
          className="flex h-24 items-center px-6 hover:*:*:fill-primary-500"
        >
          <Logo title="audiophile logo" />
        </a>
        <p className={cn(overline, "px-6 pb-3 text-neutral-100/50")}>Admin</p>
        <nav className="flex flex-col">
          {NAV.map((n) => {
            const Icon = icons[n.page];
            const isActive = n.page === active;
            return (
              <button
                key={n.page}
                type="button"
                onClick={() => go(n.page)}
                className={cn(
                  "relative flex h-12 items-center gap-4 px-6 text-left transition-colors hover:text-primary-500",
                  overline,
                  isActive ? "text-primary-500" : "text-neutral-100",
                )}
              >
                {isActive && (
                  <span className="absolute inset-y-2 left-0 w-1 bg-primary-500" />
                )}
                <Icon className="size-4" />
                {n.label}
              </button>
            );
          })}
        </nav>
        <div className="mt-auto border-t border-neutral-100/20 p-6 text-sm">
          <p className="font-bold capitalize">admin</p>
          <p className="text-neutral-100/50">admin@example.com</p>
          <a
            href="/"
            className={cn(
              overline,
              "mt-4 flex items-center gap-2 text-neutral-100/70 hover:text-primary-500",
            )}
          >
            <ArrowLeft className="size-4" /> Storefront
          </a>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col pb-24 md:pb-10">
        <header className="flex h-20 items-center gap-4 border-b border-neutral-400/40 bg-neutral-100 px-5 md:px-10">
          <Logo
            title="audiophile logo"
            className="shrink-0 *:fill-neutral-900 md:hidden"
          />
          <div className="min-w-0">
            {parent && (
              <button
                type="button"
                onClick={() => go(parent)}
                className={cn(
                  overline,
                  "flex items-center gap-1 text-neutral-500 hover:text-primary-500",
                )}
              >
                <ChevronLeft className="size-3" /> {PAGE_TITLES[parent]}
              </button>
            )}
            <h1 className="truncate text-2xl font-bold tracking-200 uppercase">
              {PAGE_TITLES[page]}
            </h1>
          </div>
        </header>
        <main className="flex flex-col gap-6 p-5 md:p-10">
          {renderPage(page, state, go)}
        </main>
      </div>

      <nav className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch justify-around border-t border-neutral-100/20 bg-neutral-900 text-neutral-100 md:hidden">
        {NAV.map((n) => {
          const Icon = icons[n.page];
          const isActive = n.page === active;
          return (
            <button
              key={n.page}
              type="button"
              onClick={() => go(n.page)}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[0.625rem] font-bold tracking-200 uppercase",
                isActive ? "text-primary-500" : "text-neutral-100/70",
              )}
            >
              <Icon className="size-5" />
              {n.label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

function renderPage(page: Page, state: ViewState, go: (p: Page) => void) {
  switch (page) {
    case "stats":
      return <StatsPage state={state} go={go} />;
    case "orders":
      return <OrdersPage state={state} go={go} />;
    case "order":
      return <OrderDetail order={orders[2]} state={state} go={go} />;
    case "users":
      return <UsersPage state={state} go={go} />;
    case "user":
      return <UserDetail user={users[2]} go={go} />;
    case "products":
      return <ProductsPage state={state} go={go} />;
    case "product":
      return <ProductEdit product={products[2]} />;
    case "homepage":
      return <HomepagePage />;
  }
}

// ---------- status language: filled pill, brand colours, overline type ----------

const orderPill: Record<OrderStatus, string> = {
  PENDING: "bg-neutral-200 text-neutral-500",
  PROCESSING: "bg-primary-400/30 text-primary-500",
  SHIPPED: "bg-sky-100 text-sky-700",
  DELIVERED: "bg-emerald-100 text-emerald-700",
  CANCELLED: "bg-primary-700/10 text-primary-700",
};
const paymentPill: Record<PaymentStatus, string> = {
  PENDING: "bg-neutral-200 text-neutral-500",
  PAID: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-primary-700/10 text-primary-700",
  REFUNDED: "bg-amber-100 text-amber-700",
};

function Pill({
  className,
  children,
}: {
  className: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-6 items-center rounded-full px-2.5 text-[0.625rem] font-bold tracking-300 uppercase",
        className,
      )}
    >
      {children}
    </span>
  );
}
const OrderPill = ({ status }: { status: OrderStatus }) => (
  <Pill className={orderPill[status]}>{statusLabel(status)}</Pill>
);
const PaymentPill = ({ status }: { status: PaymentStatus }) => (
  <Pill className={paymentPill[status]}>{statusLabel(status)}</Pill>
);

// ---------- scaffolding ----------

function Panel({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg bg-neutral-100 p-6", className)}>
      {(title || action) && (
        <header className="mb-5 flex items-center justify-between gap-4">
          {title && (
            <h2 className={cn(overline, "text-neutral-900")}>{title}</h2>
          )}
          {action}
        </header>
      )}
      {children}
    </section>
  );
}

function FilterBar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-end gap-3 rounded-lg bg-neutral-100 p-4">
      {children}
    </div>
  );
}

function LabelledSelect({
  label,
  options,
  className = "w-40",
}: {
  label: string;
  options: string[];
  className?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className={cn(overline, "text-[0.625rem] text-neutral-500")}>
        {label}
      </Label>
      <Select>
        <SelectTrigger className={cn("bg-neutral-100", className)}>
          <SelectValue placeholder="All" />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {statusLabel(o)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function Pagination({ total }: { total: number }) {
  return (
    <div className="flex items-center justify-between gap-4 text-sm text-neutral-500">
      <span>
        Showing 1–{Math.min(10, total)} of {total}
      </span>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" disabled>
          <ChevronLeft /> Prev
        </Button>
        <Button variant="outline" size="sm" disabled={total <= 10}>
          Next <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

function ListStates({
  state,
  cols,
  emptyText,
  children,
}: {
  state: ViewState;
  cols: number;
  emptyText: string;
  children: ReactNode;
}) {
  if (state === "error") {
    return (
      <ErrorBlock
        title="Error loading list"
        message="Something went wrong on our side. Please try again."
        onReset={() => undefined}
        containerClasses="py-10"
      />
    );
  }
  if (state === "loading") {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="grid gap-4 rounded-lg bg-neutral-100 p-4 md:grid-cols-5"
          >
            {Array.from({ length: Math.min(cols, 5) }).map((_, j) => (
              <Skeleton key={j} className="h-5 rounded-full bg-neutral-200" />
            ))}
          </div>
        ))}
      </div>
    );
  }
  if (state === "empty") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-lg bg-neutral-100 p-16 text-center">
        <p className={cn(overline, "text-neutral-500")}>Nothing here yet</p>
        <p className="max-w-sm text-neutral-500">{emptyText}</p>
        <Button variant="accent">Clear filters</Button>
      </div>
    );
  }
  return <>{children}</>;
}

// ---------- pages ----------

function OrdersPage({
  state,
  go,
}: {
  state: ViewState;
  go: (p: Page) => void;
}) {
  return (
    <>
      <FilterBar>
        <div className="flex min-w-60 flex-1 flex-col gap-1.5">
          <Label className={cn(overline, "text-[0.625rem] text-neutral-500")}>
            Order id or customer email
          </Label>
          <Input placeholder="Search" className="bg-neutral-100" />
        </div>
        <LabelledSelect label="Status" options={ORDER_STATUSES} />
        <LabelledSelect label="Payment" options={PAYMENT_STATUSES} />
        <Button variant="accent" size="sm" className="h-9">
          Apply
        </Button>
      </FilterBar>
      <ListStates
        state={state}
        cols={6}
        emptyText="No orders match these filters. Try a wider status or clear the search."
      >
        {/* desktop: table */}
        <Panel className="hidden p-0 md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {[
                  "Order",
                  "Date",
                  "Customer",
                  "Total",
                  "Status",
                  "Payment",
                ].map((h) => (
                  <TableHead
                    key={h}
                    className={cn(
                      overline,
                      "h-14 px-6 text-[0.625rem] text-neutral-500",
                      h === "Total" && "text-right",
                    )}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((o) => (
                <TableRow
                  key={o.id}
                  className="h-16 cursor-pointer"
                  onClick={() => go("order")}
                >
                  <TableCell className="px-6 font-bold">
                    {shortId(o.id)}
                  </TableCell>
                  <TableCell className="px-6 whitespace-nowrap text-neutral-500">
                    {formatDate(o.createdAt)}
                  </TableCell>
                  <TableCell className="max-w-56 truncate px-6">
                    {o.customer.email}
                  </TableCell>
                  <TableCell className="px-6 text-right font-bold tabular-nums">
                    {currencyFormatter(o.total)}
                  </TableCell>
                  <TableCell className="px-6">
                    <OrderPill status={o.status} />
                  </TableCell>
                  <TableCell className="px-6">
                    <PaymentPill status={o.paymentStatus} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
        {/* phone: stacked cards */}
        <ul className="flex flex-col gap-3 md:hidden">
          {orders.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => go("order")}
                className="flex w-full flex-col gap-3 rounded-lg bg-neutral-100 p-4 text-left"
              >
                <div className="flex items-baseline justify-between">
                  <span className="font-bold">{shortId(o.id)}</span>
                  <span className="text-sm text-neutral-500">
                    {formatDate(o.createdAt)}
                  </span>
                </div>
                <p className="truncate text-sm">{o.customer.email}</p>
                <div className="flex items-center justify-between">
                  <div className="flex gap-2">
                    <OrderPill status={o.status} />
                    <PaymentPill status={o.paymentStatus} />
                  </div>
                  <span className="font-bold tabular-nums">
                    {currencyFormatter(o.total)}
                  </span>
                </div>
              </button>
            </li>
          ))}
        </ul>
        <Pagination total={orders.length} />
      </ListStates>
    </>
  );
}

function StatusField({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className={cn(overline, "text-[0.625rem] text-neutral-500")}>
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-full bg-neutral-100">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {statusLabel(o)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function OrderDetail({
  order,
  state,
  go,
}: {
  order: Order;
  state: ViewState;
  go: (p: Page) => void;
}) {
  const edit = useOrderEdit(order);
  if (state === "loading") {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Skeleton className="h-80 rounded-lg bg-neutral-100" />
        <Skeleton className="h-80 rounded-lg bg-neutral-100" />
      </div>
    );
  }
  if (state === "error") {
    return (
      <ErrorBlock
        title="Error loading order"
        message="We couldn't load this order."
        onReset={() => undefined}
        containerClasses="py-10"
      />
    );
  }
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-6">
        <Panel
          title={`Order ${shortId(order.id)}`}
          action={
            <span className="text-sm text-neutral-500">
              {formatDateTime(order.createdAt)}
            </span>
          }
        >
          <ul className="divide-y divide-neutral-200">
            {order.items.map((i) => (
              <li key={i.productId} className="flex items-center gap-4 py-3">
                <img
                  src={thumbnailUrl(productById(i.productId).slug)}
                  alt=""
                  className="size-14 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="font-bold">{i.name}</p>
                  <p className="text-sm text-neutral-500">
                    {currencyFormatter(i.price)}
                  </p>
                </div>
                <span className="font-bold text-neutral-500">
                  x{i.quantity}
                </span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 grid grid-cols-2 gap-y-2 border-t border-neutral-200 pt-4">
            {[
              ["Total", order.subtotal],
              ["Shipping", order.shipping],
              ["VAT (included)", order.vat],
            ].map(([k, v]) => (
              <div key={String(k)} className="contents">
                <dt className={cn(overline, "text-neutral-500")}>{k}</dt>
                <dd className="text-right font-bold tabular-nums">
                  {currencyFormatter(Number(v))}
                </dd>
              </div>
            ))}
            <dt className={cn(overline, "mt-2 text-neutral-500")}>
              Grand total
            </dt>
            <dd className="mt-2 text-right text-lg font-bold text-primary-500 tabular-nums">
              {currencyFormatter(order.total)}
            </dd>
          </dl>
        </Panel>
        <div className="grid gap-6 md:grid-cols-3">
          <Panel title="Customer">
            <p className="font-bold capitalize">{order.customer.name}</p>
            <p className="text-sm text-neutral-500">{order.customer.email}</p>
            <Button
              variant="link"
              className="mt-2 px-0 text-sm"
              onClick={() => go("user")}
            >
              View customer
            </Button>
          </Panel>
          {(["shippingAddress", "billingAddress"] as const).map((key) => (
            <Panel
              key={key}
              title={key === "shippingAddress" ? "Ships to" : "Billed to"}
            >
              <p className="font-bold">{order[key].fullName}</p>
              <p className="text-sm text-neutral-500">{order[key].address}</p>
              <p className="text-sm text-neutral-500">
                {order[key].city}, {order[key].state} {order[key].zipCode}
              </p>
            </Panel>
          ))}
        </div>
      </div>
      <Panel
        title="Fulfilment"
        className="h-fit max-lg:order-first lg:sticky lg:top-6"
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <OrderPill status={order.status} />
            <PaymentPill status={order.paymentStatus} />
          </div>
          <StatusField
            label="Move order to"
            value={edit.status}
            options={edit.statusOptions}
            onChange={(v) => edit.setStatus(v as OrderStatus)}
          />
          <StatusField
            label="Payment"
            value={edit.payment}
            options={edit.paymentOptions}
            onChange={(v) => edit.setPayment(v as PaymentStatus)}
          />
          {edit.refundDue && (
            <p className="rounded bg-primary-400/20 p-3 text-sm text-neutral-900">
              <span className="font-bold text-primary-700">Paid order.</span>{" "}
              Cancelling may mean a refund is due; mark payment Refunded once
              issued.
            </p>
          )}
          <Button
            variant="accent"
            size="lg"
            disabled={!edit.dirty}
            onClick={edit.save}
          >
            Save
          </Button>
          <p className="text-xs text-neutral-500">
            {order.paymentMethod} · No gateway: payment status is set by hand.
          </p>
        </div>
      </Panel>
    </div>
  );
}

function UsersPage({ state, go }: { state: ViewState; go: (p: Page) => void }) {
  return (
    <>
      <FilterBar>
        <div className="flex min-w-60 flex-1 flex-col gap-1.5">
          <Label className={cn(overline, "text-[0.625rem] text-neutral-500")}>
            Name or email
          </Label>
          <Input placeholder="Search" className="bg-neutral-100" />
        </div>
        <LabelledSelect
          label="Role"
          options={["ADMIN", "USER"]}
          className="w-32"
        />
        <LabelledSelect
          label="Active"
          options={["ACTIVE", "INACTIVE"]}
          className="w-32"
        />
        <Button variant="accent" size="sm" className="h-9">
          Apply
        </Button>
      </FilterBar>
      <ListStates
        state={state}
        cols={5}
        emptyText="No users match. Clear the search or widen the filters."
      >
        <Panel className="hidden p-0 md:block">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {["Name", "Email", "Role", "Active", "Created"].map((h) => (
                  <TableHead
                    key={h}
                    className={cn(
                      overline,
                      "h-14 px-6 text-[0.625rem] text-neutral-500",
                    )}
                  >
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow
                  key={u.id}
                  className="h-16 cursor-pointer"
                  onClick={() => go("user")}
                >
                  <TableCell className="px-6 font-bold capitalize">
                    {u.name}
                  </TableCell>
                  <TableCell className="px-6">{u.email}</TableCell>
                  <TableCell className="px-6">
                    <Pill
                      className={
                        u.role === "ADMIN"
                          ? "bg-neutral-900 text-neutral-100"
                          : "bg-neutral-200 text-neutral-500"
                      }
                    >
                      {u.role}
                    </Pill>
                  </TableCell>
                  <TableCell className="px-6">
                    <Pill
                      className={
                        u.active
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-primary-700/10 text-primary-700"
                      }
                    >
                      {u.active ? "Active" : "Deactivated"}
                    </Pill>
                  </TableCell>
                  <TableCell className="px-6 whitespace-nowrap text-neutral-500">
                    {formatDate(u.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
        <ul className="flex flex-col gap-3 md:hidden">
          {users.map((u) => (
            <li key={u.id}>
              <button
                type="button"
                onClick={() => go("user")}
                className="flex w-full items-center gap-4 rounded-lg bg-neutral-100 p-4 text-left"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-bold capitalize">{u.name}</p>
                  <p className="truncate text-sm text-neutral-500">{u.email}</p>
                </div>
                <Pill
                  className={
                    u.active
                      ? "bg-emerald-100 text-emerald-700"
                      : "bg-primary-700/10 text-primary-700"
                  }
                >
                  {u.active ? "Active" : "Off"}
                </Pill>
              </button>
            </li>
          ))}
        </ul>
        <Pagination total={users.length} />
      </ListStates>
    </>
  );
}

function UserDetail({ user, go }: { user: User; go: (p: Page) => void }) {
  const theirs = orders.filter((o) => o.customer.id === user.id);
  return (
    <div className="grid gap-6 lg:grid-cols-[20rem_1fr]">
      <Panel title="Account" className="h-fit">
        <p className="text-xl font-bold capitalize">{user.name}</p>
        <p className="text-sm text-neutral-500">{user.email}</p>
        <dl className="mt-4 grid grid-cols-2 gap-y-2 text-sm">
          <dt className="text-neutral-500">Role</dt>
          <dd>
            <Pill
              className={
                user.role === "ADMIN"
                  ? "bg-neutral-900 text-neutral-100"
                  : "bg-neutral-200 text-neutral-500"
              }
            >
              {user.role}
            </Pill>
          </dd>
          <dt className="text-neutral-500">Status</dt>
          <dd>{user.active ? "Active" : "Deactivated"}</dd>
          <dt className="text-neutral-500">Joined</dt>
          <dd>{formatDate(user.createdAt)}</dd>
        </dl>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="mt-6 w-full">
              Deactivate account
            </Button>
          </DialogTrigger>
          <DialogContent className="font-Manrope">
            <DialogHeader>
              <DialogTitle className="uppercase">
                Deactivate {user.name}?
              </DialogTitle>
              <DialogDescription>
                They will be told the account is deactivated at sign-in. Orders
                are kept. You can reactivate later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" size="sm">
                  Keep active
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="accent" size="sm">
                  Deactivate
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Panel>
      <Panel title={`Orders (${theirs.length})`}>
        <ul className="divide-y divide-neutral-200">
          {theirs.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                onClick={() => go("order")}
                className="flex w-full flex-wrap items-center gap-x-6 gap-y-2 py-3 text-left"
              >
                <span className="font-bold">{shortId(o.id)}</span>
                <span className="text-sm text-neutral-500">
                  {formatDate(o.createdAt)}
                </span>
                <span className="ml-auto flex gap-2">
                  <OrderPill status={o.status} />
                  <PaymentPill status={o.paymentStatus} />
                </span>
                <span className="w-24 text-right font-bold tabular-nums">
                  {currencyFormatter(o.total)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </Panel>
    </div>
  );
}

function ProductsPage({
  state,
  go,
}: {
  state: ViewState;
  go: (p: Page) => void;
}) {
  return (
    <ListStates
      state={state}
      cols={4}
      emptyText="No products in the catalogue."
    >
      <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {products.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => go("product")}
              className="flex w-full items-center gap-4 rounded-lg bg-neutral-100 p-4 text-left hover:ring-2 hover:ring-primary-500"
            >
              <img
                src={thumbnailUrl(p.slug)}
                alt=""
                className="size-20 rounded-lg object-cover"
              />
              <div className="min-w-0 flex-1">
                {p.isNewProduct && (
                  <p
                    className={cn(overline, "text-[0.625rem] text-primary-500")}
                  >
                    New product
                  </p>
                )}
                <p className="truncate font-bold uppercase">{p.name}</p>
                <p className="text-sm text-neutral-500">{p.category}</p>
                <p className="mt-1 font-bold tabular-nums">
                  {currencyFormatter(p.price)}
                </p>
              </div>
            </button>
          </li>
        ))}
      </ul>
      <Pagination total={products.length} />
    </ListStates>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className={cn(overline, "text-[0.625rem] text-neutral-500")}>
        {label}
      </Label>
      {children}
      {hint && <p className="text-xs text-neutral-500">{hint}</p>}
    </div>
  );
}
const textarea =
  "min-h-24 w-full rounded-md border border-neutral-400 px-3 py-2 text-sm outline-none focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/30";
const input =
  "border-neutral-400 focus-visible:border-primary-500 focus-visible:ring-primary-500/30";

function ProductEdit({ product }: { product: Product }) {
  const { draft, update, updateItem, addItem, removeItem, save } =
    useProductEdit(product);
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="flex flex-col gap-6">
        <Panel title="Basics">
          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <Input
                className={input}
                value={draft.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </Field>
            <Field
              label="Price (USD)"
              hint="Entered in dollars, stored in cents."
            >
              <Input
                className={input}
                type="number"
                value={draft.price}
                onChange={(e) => update("price", Number(e.target.value))}
              />
            </Field>
            <Field label="Category">
              <Select
                value={draft.category}
                onValueChange={(v) =>
                  update("category", v as Product["category"])
                }
              >
                <SelectTrigger className={cn("w-full", input)}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {["Headphones", "Earphones", "Speakers"].map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="New product">
              <label className="flex h-9 items-center gap-3 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-primary-500"
                  checked={draft.isNewProduct}
                  onChange={(e) => update("isNewProduct", e.target.checked)}
                />
                Show the orange "new product" overline
              </label>
            </Field>
          </div>
        </Panel>
        <Panel title="Copy">
          <div className="grid gap-4">
            <Field label="Description">
              <textarea
                className={textarea}
                value={draft.description}
                onChange={(e) => update("description", e.target.value)}
              />
            </Field>
            <Field label="Features">
              <textarea
                className={textarea}
                value={draft.featuresText}
                onChange={(e) => update("featuresText", e.target.value)}
              />
            </Field>
          </div>
        </Panel>
        <Panel
          title="In the box"
          action={
            <Button variant="outline" size="sm" onClick={addItem}>
              <Plus /> Add
            </Button>
          }
        >
          <ul className="flex flex-col gap-2">
            {draft.includedItems.map((row, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="w-10 font-bold text-primary-500 tabular-nums">
                  {row.quantity}x
                </span>
                <Input
                  className={cn("w-20", input)}
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={(e) =>
                    updateItem(i, { quantity: Number(e.target.value) })
                  }
                />
                <Input
                  className={input}
                  value={row.item}
                  onChange={(e) => updateItem(i, { item: e.target.value })}
                />
                <Button
                  variant="link"
                  size="icon"
                  aria-label="Remove"
                  onClick={() => removeItem(i)}
                >
                  <Trash2 />
                </Button>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Labels">
          <div className="grid gap-4 md:grid-cols-3">
            <Field label="Cart">
              <Input
                className={input}
                value={draft.cartLabel}
                onChange={(e) => update("cartLabel", e.target.value)}
              />
            </Field>
            <Field label="Short">
              <Input
                className={input}
                value={draft.shortLabel}
                onChange={(e) => update("shortLabel", e.target.value)}
              />
            </Field>
            <Field label="Full">
              <Input
                className={input}
                value={draft.fullLabel}
                onChange={(e) => update("fullLabel", e.target.value)}
              />
            </Field>
          </div>
        </Panel>
      </div>
      <div className="flex flex-col gap-6 max-lg:order-first lg:sticky lg:top-6 lg:h-fit">
        <Panel title="Publish">
          <Button variant="accent" size="lg" onClick={save}>
            Save product
          </Button>
          <p className="mt-3 text-xs text-neutral-500">
            Visible on the storefront immediately.
          </p>
        </Panel>
        <Panel title="Read only">
          <Field label="Slug">
            <p className="rounded bg-neutral-200 px-3 py-2 font-mono text-xs text-neutral-500">
              /product/{draft.slug}
            </p>
          </Field>
          <div className="mt-4 grid grid-cols-3 gap-2">
            {["thumbnail", "featured", "showcase"].map((kind) => (
              <figure
                key={kind}
                className="text-center text-[0.625rem] text-neutral-500"
              >
                <img
                  src={thumbnailUrl(draft.slug)}
                  alt=""
                  className="aspect-square rounded object-cover grayscale-[40%]"
                />
                <figcaption className="mt-1 capitalize">{kind}</figcaption>
              </figure>
            ))}
          </div>
          <p className="mt-3 text-xs text-neutral-500">
            Images are published from packages/media.
          </p>
        </Panel>
      </div>
    </div>
  );
}

function HomepagePage() {
  const { slots, isTaken, save } = useHomepageSlots();
  const [changing, setChanging] = useState<string | null>(null);
  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {slots.map((slot) => {
          const product = productById(slot.productId);
          const open = changing === slot.key;
          return (
            <article
              key={slot.key}
              className="flex flex-col overflow-hidden rounded-lg bg-neutral-100"
            >
              <div
                className={cn(
                  "relative aspect-square",
                  slot.key === "featured" ? "bg-primary-500" : "bg-neutral-200",
                )}
              >
                <img
                  src={thumbnailUrl(product.slug)}
                  alt=""
                  className="absolute inset-0 size-full object-cover mix-blend-multiply"
                />
                <p
                  className={cn(
                    overline,
                    "absolute top-4 left-4 text-[0.625rem]",
                    slot.key === "featured"
                      ? "text-neutral-100"
                      : "text-neutral-500",
                  )}
                >
                  {slot.label}
                </p>
              </div>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <p className="font-bold uppercase">{product.name}</p>
                {open ? (
                  <Select
                    value={slot.productId}
                    onValueChange={(v) => {
                      slot.set(v);
                      setChanging(null);
                    }}
                  >
                    <SelectTrigger className={cn("w-full", input)}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {slot.options.map((p) => (
                        <SelectItem
                          key={p.id}
                          value={p.id}
                          disabled={isTaken(slot.key, p.id)}
                        >
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-auto"
                    onClick={() => setChanging(slot.key)}
                  >
                    Change
                  </Button>
                )}
              </div>
            </article>
          );
        })}
      </div>
      <div className="flex items-center justify-between rounded-lg bg-neutral-100 p-4">
        <p className="text-sm text-neutral-500">
          Only products with the matching image are offered; a product can hold
          one slot.
        </p>
        <Button variant="accent" onClick={save}>
          Save homepage
        </Button>
      </div>
    </>
  );
}

function StatsPage({ state, go }: { state: ViewState; go: (p: Page) => void }) {
  const [period, setPeriod] = useState<Period>("30d");
  const stats = statsFor(period);
  const periodTabs = (
    <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
      <TabsList className="bg-neutral-100">
        {PERIODS.map((p) => (
          <TabsTrigger
            key={p.value}
            value={p.value}
            className={cn(
              overline,
              "text-[0.625rem] data-[state=active]:bg-neutral-900 data-[state=active]:text-neutral-100",
            )}
          >
            {p.label}
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
  if (state === "error") {
    return (
      <ErrorBlock
        title="Error loading stats"
        message="We couldn't compute the numbers."
        onReset={() => undefined}
        containerClasses="py-10"
      />
    );
  }
  if (state === "loading") {
    return (
      <>
        <div className="flex justify-end">{periodTabs}</div>
        <div className="grid gap-4 md:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-36 rounded-lg bg-neutral-100" />
          ))}
        </div>
      </>
    );
  }
  const cards = [
    ["Orders", String(stats.ordersCount)],
    ["Revenue", currencyFormatter(stats.revenue)],
    ["New customers", String(stats.newUsers)],
  ];
  return (
    <>
      <div className="flex justify-end">{periodTabs}</div>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map(([label, value]) => (
          <article
            key={label}
            className="relative overflow-hidden rounded-lg bg-neutral-100 p-6 before:absolute before:top-0 before:left-6 before:h-1 before:w-16 before:bg-primary-500"
          >
            <p className={cn(overline, "text-neutral-500")}>{label}</p>
            <p className="mt-3 text-4xl font-bold tracking-200 tabular-nums">
              {value}
            </p>
          </article>
        ))}
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title="Orders by status">
          <ul className="divide-y divide-neutral-200">
            {ORDER_STATUSES.map((s) => (
              <li key={s} className="flex items-center justify-between py-3">
                <OrderPill status={s} />
                <span className="font-bold tabular-nums">
                  {stats.ordersByStatus[s]}
                </span>
              </li>
            ))}
          </ul>
        </Panel>
        <Panel title="Best sellers">
          <ul className="divide-y divide-neutral-200">
            {stats.topProducts.map((t, i) => (
              <li key={t.productId}>
                <button
                  type="button"
                  onClick={() => go("product")}
                  className="flex w-full items-center gap-4 py-3 text-left"
                >
                  <span className="w-6 font-bold text-primary-500">
                    {i + 1}
                  </span>
                  <img
                    src={thumbnailUrl(productById(t.productId).slug)}
                    alt=""
                    className="size-10 rounded object-cover"
                  />
                  <span className="flex-1 font-bold uppercase">
                    {productById(t.productId).name}
                  </span>
                  <span className="text-sm text-neutral-500">
                    {t.quantity} sold
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </>
  );
}
