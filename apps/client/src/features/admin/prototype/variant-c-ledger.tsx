// PROTOTYPE Variant C (#320): deliberately different. No sidebar: a top bar with
// a horizontal tab strip (scrolls on a phone, same shell at every width). Lists
// are dense borderless "ledger" rows that reflow instead of stacking to cards;
// filters live in a right-hand side panel; detail pages are single column with
// the status selects inline in the title row. Loading is a spinner.
import ErrorBlock from "@/components/errors/error-block";
import LoadingSpinner from "@/components/ui/loading-spinner";
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
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/cn";
import currencyFormatter from "@/utils/formatters";
import {
  ChevronLeft,
  ChevronRight,
  Inbox,
  Plus,
  SlidersHorizontal,
  X,
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
  sectionOf,
  type Page,
  type VariantProps,
  type ViewState,
} from "./params";

export function VariantC({ page, state, go }: VariantProps) {
  const active = sectionOf(page);
  return (
    <div className="min-h-dvh bg-white text-neutral-900">
      <header className="sticky top-0 z-30 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-12 max-w-6xl items-center gap-4 px-4">
          <a href="/" className="flex items-baseline gap-2">
            <span className="text-lg font-bold tracking-tight lowercase">
              audiophile
            </span>
            <span className="text-xs text-neutral-500">/ admin</span>
          </a>
          <div className="ml-auto flex items-center gap-3 text-xs text-neutral-500">
            <span className="hidden sm:inline">admin@example.com</span>
            <span className="flex size-7 items-center justify-center rounded-full bg-neutral-900 text-[0.625rem] font-bold text-white">
              AD
            </span>
          </div>
        </div>
        <nav className="mx-auto flex max-w-6xl [scrollbar-width:none] gap-1 overflow-x-auto px-2">
          {NAV.map((n) => (
            <button
              key={n.page}
              type="button"
              onClick={() => go(n.page)}
              className={cn(
                "relative shrink-0 px-3 pt-1 pb-2.5 text-sm font-medium whitespace-nowrap text-neutral-500 hover:text-neutral-900",
                n.page === active &&
                  "text-neutral-900 after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-neutral-900",
              )}
            >
              {n.label}
            </button>
          ))}
        </nav>
      </header>
      <main className="mx-auto flex max-w-6xl flex-col gap-5 px-4 py-6 pb-24">
        {renderPage(page, state, go)}
      </main>
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
      return <ProductEdit product={products[2]} go={go} />;
    case "homepage":
      return <HomepagePage />;
  }
}

// ---------- status language: coloured dot + plain text ----------

const orderDot: Record<OrderStatus, string> = {
  PENDING: "bg-neutral-400",
  PROCESSING: "bg-amber-500",
  SHIPPED: "bg-sky-500",
  DELIVERED: "bg-emerald-500",
  CANCELLED: "bg-red-500",
};
const paymentDot: Record<PaymentStatus, string> = {
  PENDING: "bg-neutral-400",
  PAID: "bg-emerald-500",
  FAILED: "bg-red-500",
  REFUNDED: "bg-violet-500",
};
function Dot({ color, children }: { color: string; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm whitespace-nowrap">
      <span className={cn("size-2 rounded-full", color)} />
      {children}
    </span>
  );
}
const OrderDot = ({ status }: { status: OrderStatus }) => (
  <Dot color={orderDot[status]}>{statusLabel(status)}</Dot>
);
const PaymentDot = ({ status }: { status: PaymentStatus }) => (
  <Dot color={paymentDot[status]}>{statusLabel(status)}</Dot>
);

// ---------- scaffolding ----------

function TitleRow({
  title,
  crumb,
  onBack,
  children,
}: {
  title: ReactNode;
  crumb?: string;
  onBack?: () => void;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <div>
        {crumb && (
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900"
          >
            <ChevronLeft className="size-3" /> {crumb}
          </button>
        )}
        <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      </div>
      <div className="ml-auto flex flex-wrap items-center gap-2">
        {children}
      </div>
    </div>
  );
}

function FiltersPanel({
  count,
  children,
}: {
  count: number;
  children: ReactNode;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-8 tracking-normal normal-case"
        >
          <SlidersHorizontal /> Filters
          {count > 0 && (
            <span className="rounded-full bg-neutral-900 px-1.5 text-[0.625rem] text-white">
              {count}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-80 flex-col gap-6 p-6">
        <SheetHeader className="p-0">
          <SheetTitle>Filters</SheetTitle>
          <SheetDescription>
            Narrow the list. Filters are kept in the URL.
          </SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4">{children}</div>
        <SheetFooter className="mt-auto flex-row p-0">
          <SheetClose asChild>
            <Button variant="outline" size="sm" className="flex-1">
              Clear
            </Button>
          </SheetClose>
          <SheetClose asChild>
            <Button size="sm" className="flex-1">
              Apply
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

function FilterField({
  label,
  options,
  placeholder = "Any",
}: {
  label: string;
  options: string[];
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs text-neutral-500">{label}</Label>
      <Select>
        <SelectTrigger className="w-full">
          <SelectValue placeholder={placeholder} />
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

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex h-6 items-center gap-1 rounded-md bg-neutral-100 px-2 text-xs">
      {children}
      <X className="size-3 text-neutral-500" />
    </span>
  );
}

function Pager({ total }: { total: number }) {
  return (
    <div className="flex items-center justify-end gap-3 text-xs text-neutral-500 tabular-nums">
      1–{Math.min(20, total)} of {total}
      <span className="flex">
        <button
          type="button"
          className="rounded p-1 hover:bg-neutral-100 disabled:opacity-40"
          disabled
        >
          <ChevronLeft className="size-4" />
        </button>
        <button
          type="button"
          className="rounded p-1 hover:bg-neutral-100 disabled:opacity-40"
          disabled={total <= 20}
        >
          <ChevronRight className="size-4" />
        </button>
      </span>
    </div>
  );
}

function Ledger({
  state,
  header,
  rows,
  emptyText,
}: {
  state: ViewState;
  header: ReactNode;
  rows: ReactNode;
  emptyText: string;
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
    return <LoadingSpinner size="lg" className="py-16" />;
  }
  if (state === "empty") {
    return (
      <div className="flex flex-col items-center gap-2 border-y py-16 text-center text-sm text-neutral-500">
        <Inbox className="size-5" />
        {emptyText}
      </div>
    );
  }
  return (
    <div className="border-y">
      <div className="hidden text-xs text-neutral-500 md:block">{header}</div>
      <div className="divide-y">{rows}</div>
    </div>
  );
}

const ordersGrid =
  "grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-2 py-2 md:grid-cols-[6rem_6.5rem_minmax(0,1fr)_7rem_8rem_8rem] md:items-center md:py-0 md:leading-10";

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
      <TitleRow title="Orders">
        <Input placeholder="Order id or email" className="h-8 w-48 md:w-64" />
        <FiltersPanel count={1}>
          <FilterField label="Status" options={ORDER_STATUSES} />
          <FilterField label="Payment" options={PAYMENT_STATUSES} />
        </FiltersPanel>
      </TitleRow>
      <div className="flex gap-2">
        <Chip>status: Processing</Chip>
      </div>
      <Ledger
        state={state}
        emptyText="No orders match. Clear a filter or widen the search."
        header={
          <div className={ordersGrid}>
            <span>Order</span>
            <span>Date</span>
            <span>Customer</span>
            <span className="text-right">Total</span>
            <span>Status</span>
            <span>Payment</span>
          </div>
        }
        rows={orders.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => go("order")}
            className={cn(
              ordersGrid,
              "w-full text-left text-sm hover:bg-neutral-50",
            )}
          >
            <span className="font-mono text-xs leading-6 md:leading-10">
              …{o.id.slice(-6)}
            </span>
            <span className="text-right text-neutral-500 md:text-left">
              {formatDate(o.createdAt)}
            </span>
            <span className="col-span-2 truncate text-neutral-500 md:col-span-1 md:text-neutral-900">
              {o.customer.email}
            </span>
            <span className="font-medium tabular-nums md:text-right">
              {currencyFormatter(o.total)}
            </span>
            <span className="flex justify-end gap-3 md:contents">
              <OrderDot status={o.status} />
              <PaymentDot status={o.paymentStatus} />
            </span>
          </button>
        ))}
      />
      {state === "data" && <Pager total={orders.length} />}
    </>
  );
}

function InlineSelect({
  value,
  options,
  onChange,
  label,
}: {
  value: string;
  options: string[];
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger size="sm" aria-label={label} className="h-8">
        <span className="text-xs text-neutral-500">{label}</span>
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
  );
}

function Kv({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="contents">
          <dt className="text-neutral-500">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="border-b pb-2 text-xs font-semibold tracking-wide text-neutral-500 uppercase">
      {children}
    </h2>
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
  if (state === "loading")
    return <LoadingSpinner size="lg" className="py-16" />;
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
    <>
      <TitleRow
        title={<span className="font-mono">{order.id}</span>}
        crumb="Orders"
        onBack={() => go("orders")}
      >
        <InlineSelect
          label="Status"
          value={edit.status}
          options={edit.statusOptions}
          onChange={(v) => edit.setStatus(v as OrderStatus)}
        />
        <InlineSelect
          label="Payment"
          value={edit.payment}
          options={edit.paymentOptions}
          onChange={(v) => edit.setPayment(v as PaymentStatus)}
        />
        <Button
          size="sm"
          className="h-8"
          disabled={!edit.dirty}
          onClick={edit.save}
        >
          Save
        </Button>
      </TitleRow>
      {edit.refundDue && (
        <p className="border-l-2 border-amber-500 bg-amber-50 px-3 py-2 text-sm">
          Paid order. Cancelling may mean a refund is due; set payment to
          Refunded once issued.
        </p>
      )}
      <Kv
        rows={[
          ["Placed", formatDateTime(order.createdAt)],
          [
            "Customer",
            <button
              type="button"
              onClick={() => go("user")}
              className="underline-offset-4 hover:underline"
            >
              <span className="capitalize">{order.customer.name}</span> ·{" "}
              {order.customer.email}
            </button>,
          ],
          ["Payment method", order.paymentMethod],
          [
            "Current",
            <span className="flex gap-4">
              <OrderDot status={order.status} />
              <PaymentDot status={order.paymentStatus} />
            </span>,
          ],
        ]}
      />
      <SectionTitle>Items</SectionTitle>
      <div className="divide-y text-sm">
        {order.items.map((i) => (
          <div
            key={i.productId}
            className="grid grid-cols-[2.5rem_1fr_auto_auto] items-center gap-4 py-2"
          >
            <img
              src={thumbnailUrl(productById(i.productId).slug)}
              alt=""
              className="size-10 rounded object-cover"
            />
            <span>{i.name}</span>
            <span className="text-neutral-500 tabular-nums">
              {i.quantity} × {currencyFormatter(i.price)}
            </span>
            <span className="w-24 text-right tabular-nums">
              {currencyFormatter(i.price * i.quantity)}
            </span>
          </div>
        ))}
        <div className="grid grid-cols-[1fr_auto] gap-x-8 gap-y-1 py-3 text-right tabular-nums">
          <span className="text-neutral-500">Subtotal</span>
          <span>{currencyFormatter(order.subtotal)}</span>
          <span className="text-neutral-500">Shipping</span>
          <span>{currencyFormatter(order.shipping)}</span>
          <span className="text-neutral-500">VAT</span>
          <span>{currencyFormatter(order.vat)}</span>
          <span className="font-semibold">Total</span>
          <span className="font-semibold">
            {currencyFormatter(order.total)}
          </span>
        </div>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        {(["shippingAddress", "billingAddress"] as const).map((key) => (
          <div key={key} className="flex flex-col gap-3">
            <SectionTitle>
              {key === "shippingAddress" ? "Shipping" : "Billing"}
            </SectionTitle>
            <p className="text-sm">
              {order[key].fullName}
              <br />
              {order[key].address}
              <br />
              {order[key].city}, {order[key].state} {order[key].zipCode}
              <br />
              {order[key].country}
            </p>
          </div>
        ))}
      </div>
    </>
  );
}

const usersGrid =
  "grid grid-cols-[1fr_auto] gap-x-4 gap-y-1 px-2 py-2 md:grid-cols-[10rem_minmax(0,1fr)_5rem_7rem_7rem] md:items-center md:py-0 md:leading-10";

function UsersPage({ state, go }: { state: ViewState; go: (p: Page) => void }) {
  return (
    <>
      <TitleRow title="Users">
        <Input placeholder="Name or email" className="h-8 w-48 md:w-64" />
        <FiltersPanel count={0}>
          <FilterField label="Role" options={["ADMIN", "USER"]} />
          <FilterField label="Active" options={["ACTIVE", "INACTIVE"]} />
        </FiltersPanel>
      </TitleRow>
      <Ledger
        state={state}
        emptyText="No users match."
        header={
          <div className={usersGrid}>
            <span>Name</span>
            <span>Email</span>
            <span>Role</span>
            <span>Active</span>
            <span>Created</span>
          </div>
        }
        rows={users.map((u) => (
          <button
            key={u.id}
            type="button"
            onClick={() => go("user")}
            className={cn(
              usersGrid,
              "w-full text-left text-sm hover:bg-neutral-50",
            )}
          >
            <span className="font-medium capitalize">{u.name}</span>
            <span className="text-right text-xs text-neutral-500 md:order-3 md:text-left md:text-sm">
              {u.role}
            </span>
            <span className="truncate text-neutral-500 md:order-2 md:text-neutral-900">
              {u.email}
            </span>
            <span className="text-right md:order-4 md:text-left">
              <Dot color={u.active ? "bg-emerald-500" : "bg-red-500"}>
                {u.active ? "Active" : "Deactivated"}
              </Dot>
            </span>
            <span className="hidden text-neutral-500 md:order-5 md:block">
              {formatDate(u.createdAt)}
            </span>
          </button>
        ))}
      />
      {state === "data" && <Pager total={users.length} />}
    </>
  );
}

function UserDetail({ user, go }: { user: User; go: (p: Page) => void }) {
  const theirs = orders.filter((o) => o.customer.id === user.id);
  return (
    <>
      <TitleRow
        title={<span className="capitalize">{user.name}</span>}
        crumb="Users"
        onBack={() => go("users")}
      >
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="h-8">
              Deactivate
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deactivate {user.name}?</DialogTitle>
              <DialogDescription>
                Sign-in is refused with a clear message; orders are kept; you
                can reactivate later.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" size="sm">
                  Cancel
                </Button>
              </DialogClose>
              <DialogClose asChild>
                <Button variant="destructive" size="sm">
                  Deactivate
                </Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </TitleRow>
      <Kv
        rows={[
          ["Email", user.email],
          ["Role", user.role],
          [
            "Active",
            <Dot color={user.active ? "bg-emerald-500" : "bg-red-500"}>
              {user.active ? "Active" : "Deactivated"}
            </Dot>,
          ],
          ["Created", formatDate(user.createdAt)],
        ]}
      />
      <SectionTitle>Orders ({theirs.length})</SectionTitle>
      <div className="divide-y">
        {theirs.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => go("order")}
            className={cn(
              ordersGrid,
              "w-full text-left text-sm hover:bg-neutral-50",
            )}
          >
            <span className="font-mono text-xs leading-6 md:leading-10">
              …{o.id.slice(-6)}
            </span>
            <span className="text-right text-neutral-500 md:text-left">
              {formatDate(o.createdAt)}
            </span>
            <span className="hidden md:block" />
            <span className="font-medium tabular-nums md:text-right">
              {currencyFormatter(o.total)}
            </span>
            <span className="flex justify-end gap-3 md:contents">
              <OrderDot status={o.status} />
              <PaymentDot status={o.paymentStatus} />
            </span>
          </button>
        ))}
      </div>
    </>
  );
}

const productsGrid =
  "grid grid-cols-[2.5rem_1fr_auto] items-center gap-x-4 px-2 py-2 md:grid-cols-[2.5rem_minmax(0,1fr)_8rem_6rem_5rem]";

function ProductsPage({
  state,
  go,
}: {
  state: ViewState;
  go: (p: Page) => void;
}) {
  return (
    <>
      <TitleRow title="Products">
        <Input placeholder="Search" className="h-8 w-48 md:w-64" />
      </TitleRow>
      <Ledger
        state={state}
        emptyText="No products."
        header={
          <div className={productsGrid}>
            <span />
            <span>Product</span>
            <span>Category</span>
            <span className="text-right">Price</span>
            <span className="text-right">New</span>
          </div>
        }
        rows={products.map((p) => (
          <button
            key={p.id}
            type="button"
            onClick={() => go("product")}
            className={cn(
              productsGrid,
              "w-full text-left text-sm hover:bg-neutral-50",
            )}
          >
            <img
              src={thumbnailUrl(p.slug)}
              alt=""
              className="size-10 rounded object-cover"
            />
            <span className="truncate">
              <span className="font-medium">{p.name}</span>
              <span className="text-neutral-500 md:hidden">
                {" "}
                · {p.category}
              </span>
            </span>
            <span className="hidden text-neutral-500 md:block">
              {p.category}
            </span>
            <span className="text-right tabular-nums">
              {currencyFormatter(p.price)}
            </span>
            <span className="hidden text-right text-xs text-neutral-500 md:block">
              {p.isNewProduct ? "yes" : ""}
            </span>
          </button>
        ))}
      />
    </>
  );
}

function Field({
  label,
  children,
  hint,
  wide,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  wide?: boolean;
}) {
  return (
    <div
      className={cn(
        "grid gap-1.5 md:grid-cols-[10rem_1fr] md:items-start",
        wide && "md:[&>*:last-child]:col-span-1",
      )}
    >
      <Label className="text-sm text-neutral-500 md:pt-2">{label}</Label>
      <div className="flex flex-col gap-1">
        {children}
        {hint && <p className="text-xs text-neutral-500">{hint}</p>}
      </div>
    </div>
  );
}
const textarea =
  "min-h-24 w-full rounded-md border border-input px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function ProductEdit({
  product,
  go,
}: {
  product: Product;
  go: (p: Page) => void;
}) {
  const { draft, update, updateItem, addItem, removeItem, save } =
    useProductEdit(product);
  const dirty = JSON.stringify(draft) !== JSON.stringify(product);
  return (
    <>
      <TitleRow
        title={draft.name}
        crumb="Products"
        onBack={() => go("products")}
      >
        <span className="font-mono text-xs text-neutral-500">
          /product/{draft.slug}
        </span>
      </TitleRow>
      <div className="flex max-w-3xl flex-col gap-8">
        <div className="flex flex-col gap-4">
          <SectionTitle>Details</SectionTitle>
          <Field label="Name">
            <Input
              value={draft.name}
              onChange={(e) => update("name", e.target.value)}
            />
          </Field>
          <Field
            label="Price (USD)"
            hint="Entered in dollars, stored in cents."
          >
            <Input
              type="number"
              className="w-40"
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
              <SelectTrigger className="w-40">
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
            <label className="flex h-9 items-center gap-2 text-sm">
              <input
                type="checkbox"
                className="size-4"
                checked={draft.isNewProduct}
                onChange={(e) => update("isNewProduct", e.target.checked)}
              />
              Show the "new product" overline
            </label>
          </Field>
        </div>
        <div className="flex flex-col gap-4">
          <SectionTitle>Copy</SectionTitle>
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
        <div className="flex flex-col gap-4">
          <SectionTitle>Included items</SectionTitle>
          <Field label="Rows">
            <div className="flex flex-col gap-2">
              {draft.includedItems.map((row, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    className="w-16"
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) =>
                      updateItem(i, { quantity: Number(e.target.value) })
                    }
                  />
                  <Input
                    value={row.item}
                    onChange={(e) => updateItem(i, { item: e.target.value })}
                  />
                  <button
                    type="button"
                    aria-label="Remove"
                    onClick={() => removeItem(i)}
                    className="rounded p-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="flex w-fit items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900"
              >
                <Plus className="size-4" /> Add item
              </button>
            </div>
          </Field>
        </div>
        <div className="flex flex-col gap-4">
          <SectionTitle>Labels</SectionTitle>
          <Field label="Cart label">
            <Input
              className="w-60"
              value={draft.cartLabel}
              onChange={(e) => update("cartLabel", e.target.value)}
            />
          </Field>
          <Field label="Short label">
            <Input
              className="w-60"
              value={draft.shortLabel}
              onChange={(e) => update("shortLabel", e.target.value)}
            />
          </Field>
          <Field label="Full label">
            <Input
              className="w-60"
              value={draft.fullLabel}
              onChange={(e) => update("fullLabel", e.target.value)}
            />
          </Field>
        </div>
        <div className="flex flex-col gap-4">
          <SectionTitle>Read only</SectionTitle>
          <Field label="Slug">
            <p className="font-mono text-sm text-neutral-500">{draft.slug}</p>
          </Field>
          <Field label="Images" hint="Published from packages/media.">
            <div className="flex gap-2">
              {["thumbnail", "featured", "showcase"].map((kind) => (
                <figure
                  key={kind}
                  className="text-center text-[0.625rem] text-neutral-500"
                >
                  <img
                    src={thumbnailUrl(draft.slug)}
                    alt=""
                    className="size-16 rounded border object-cover"
                  />
                  <figcaption className="mt-1">{kind}</figcaption>
                </figure>
              ))}
            </div>
          </Field>
        </div>
      </div>
      <div
        className={cn(
          "fixed inset-x-0 bottom-14 z-30 border-t bg-white/95 backdrop-blur transition-transform",
          dirty ? "translate-y-0" : "translate-y-full",
        )}
      >
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 text-sm">
          <span className="text-neutral-500">Unsaved changes</span>
          <Button size="sm" className="ml-auto h-8" onClick={save}>
            Save
          </Button>
        </div>
      </div>
    </>
  );
}

function HomepagePage() {
  const { slots, isTaken, save } = useHomepageSlots();
  return (
    <>
      <TitleRow title="Homepage">
        <Button size="sm" className="h-8" onClick={save}>
          Save
        </Button>
      </TitleRow>
      <p className="text-sm text-neutral-500">
        Each slot lists only products with the image it renders. A product can
        hold one slot.
      </p>
      <div className="divide-y border-y">
        {slots.map((slot) => {
          const product = productById(slot.productId);
          return (
            <div
              key={slot.key}
              className="grid grid-cols-[3rem_1fr] items-center gap-4 py-3 md:grid-cols-[10rem_3rem_1fr_16rem]"
            >
              <span className="col-span-2 text-sm text-neutral-500 md:col-span-1">
                {slot.label}
              </span>
              <img
                src={thumbnailUrl(product.slug)}
                alt=""
                className="size-12 rounded object-cover"
              />
              <span className="text-sm font-medium">{product.name}</span>
              <Select value={slot.productId} onValueChange={slot.set}>
                <SelectTrigger
                  size="sm"
                  className="col-span-2 w-full md:col-span-1"
                >
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
            </div>
          );
        })}
      </div>
    </>
  );
}

function StatsPage({ state, go }: { state: ViewState; go: (p: Page) => void }) {
  const [period, setPeriod] = useState<Period>("30d");
  const stats = statsFor(period);
  const periodControl = (
    <div className="flex rounded-md border p-0.5 text-xs">
      {PERIODS.map((p) => (
        <button
          key={p.value}
          type="button"
          onClick={() => setPeriod(p.value)}
          className={cn(
            "rounded px-2.5 py-1",
            period === p.value
              ? "bg-neutral-900 text-white"
              : "text-neutral-500 hover:text-neutral-900",
          )}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
  if (state === "error") {
    return (
      <>
        <TitleRow title="Stats">{periodControl}</TitleRow>
        <ErrorBlock
          title="Error loading stats"
          message="We couldn't compute the numbers."
          onReset={() => undefined}
          containerClasses="py-10"
        />
      </>
    );
  }
  if (state === "loading") {
    return (
      <>
        <TitleRow title="Stats">{periodControl}</TitleRow>
        <LoadingSpinner size="lg" className="py-16" />
      </>
    );
  }
  return (
    <>
      <TitleRow title="Stats">{periodControl}</TitleRow>
      <div className="grid grid-cols-3 divide-x border-y">
        {[
          ["Orders", String(stats.ordersCount)],
          ["Revenue", currencyFormatter(stats.revenue)],
          ["New customers", String(stats.newUsers)],
        ].map(([k, v]) => (
          <div key={k} className="px-4 py-5 first:pl-0">
            <p className="text-xs text-neutral-500">{k}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums md:text-3xl">
              {v}
            </p>
          </div>
        ))}
      </div>
      <div className="grid gap-8 md:grid-cols-2">
        <div className="flex flex-col gap-3">
          <SectionTitle>By status</SectionTitle>
          <div className="divide-y text-sm">
            {ORDER_STATUSES.map((s) => (
              <div key={s} className="flex items-center justify-between py-2">
                <OrderDot status={s} />
                <span className="tabular-nums">{stats.ordersByStatus[s]}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3">
          <SectionTitle>Top products</SectionTitle>
          <div className="divide-y text-sm">
            {stats.topProducts.map((t) => (
              <button
                key={t.productId}
                type="button"
                onClick={() => go("product")}
                className="flex w-full items-center gap-3 py-2 text-left hover:bg-neutral-50"
              >
                <img
                  src={thumbnailUrl(productById(t.productId).slug)}
                  alt=""
                  className="size-8 rounded object-cover"
                />
                <span className="flex-1">{productById(t.productId).name}</span>
                <span className="text-neutral-500 tabular-nums">
                  {t.quantity}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
