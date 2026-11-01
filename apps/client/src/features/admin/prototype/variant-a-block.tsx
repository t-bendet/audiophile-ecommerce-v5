// PROTOTYPE Variant A (#320): shadcn `dashboard-01` adopted wholesale.
// Neutral palette, offcanvas sidebar (Sheet on mobile), breadcrumb header,
// stat cards + chart card, data tables that scroll horizontally on a phone.
import ErrorBlock from "@/components/errors/error-block";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
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
import currencyFormatter from "@/utils/formatters";
import {
  IconChevronLeft,
  IconChevronRight,
  IconChevronsLeft,
  IconChevronsRight,
  IconCircleCheckFilled,
  IconCircleXFilled,
  IconClock,
  IconLayoutColumns,
  IconLoader,
  IconPlus,
  IconReceiptRefund,
  IconTrash,
  IconTruck,
} from "@tabler/icons-react";
import { useState, type CSSProperties, type ReactNode } from "react";
import { AppSidebar } from "./block/app-sidebar";
import { ChartAreaInteractive } from "./block/chart-area-interactive";
import { SectionCards } from "./block/section-cards";
import { SiteHeader, type Crumb } from "./block/site-header";
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
  sectionOf,
  type Page,
  type VariantProps,
  type ViewState,
} from "./params";

export function VariantA({ page, state, go }: VariantProps) {
  const { crumbs, actions, body } = renderPage(page, state, go);
  return (
    <SidebarProvider
      className="text-foreground"
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as CSSProperties
      }
    >
      <AppSidebar variant="inset" active={sectionOf(page)} onNavigate={go} />
      <SidebarInset>
        <SiteHeader crumbs={crumbs} actions={actions} />
        <div className="flex flex-1 flex-col pb-20">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {body}
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function renderPage(
  page: Page,
  state: ViewState,
  go: (p: Page) => void,
): { crumbs: Crumb[]; actions?: ReactNode; body: ReactNode } {
  const order = orders[2];
  const user = users[2];
  const product = products[2];
  switch (page) {
    case "stats":
      return {
        crumbs: [{ label: "Stats" }],
        body: <StatsPage state={state} go={go} />,
      };
    case "orders":
      return {
        crumbs: [{ label: "Orders" }],
        body: <OrdersPage state={state} go={go} />,
      };
    case "order":
      return {
        crumbs: [
          { label: "Orders", onClick: () => go("orders") },
          { label: shortId(order.id) },
        ],
        body: <OrderDetail order={order} state={state} go={go} />,
      };
    case "users":
      return {
        crumbs: [{ label: "Users" }],
        body: <UsersPage state={state} go={go} />,
      };
    case "user":
      return {
        crumbs: [
          { label: "Users", onClick: () => go("users") },
          { label: user.name },
        ],
        body: <UserDetail user={user} go={go} />,
      };
    case "products":
      return {
        crumbs: [{ label: "Products" }],
        body: <ProductsPage state={state} go={go} />,
      };
    case "product":
      return {
        crumbs: [
          { label: "Products", onClick: () => go("products") },
          { label: product.name },
        ],
        body: <ProductEdit product={product} />,
      };
    case "homepage":
      return { crumbs: [{ label: "Homepage" }], body: <HomepagePage /> };
  }
}

// ---------- status language: block style, outline badge + icon ----------

const orderIcon: Record<OrderStatus, ReactNode> = {
  PENDING: <IconClock className="text-muted-foreground" />,
  PROCESSING: <IconLoader className="text-muted-foreground" />,
  SHIPPED: <IconTruck className="text-blue-500" />,
  DELIVERED: <IconCircleCheckFilled className="fill-green-500" />,
  CANCELLED: <IconCircleXFilled className="fill-red-500" />,
};
const paymentIcon: Record<PaymentStatus, ReactNode> = {
  PENDING: <IconClock className="text-muted-foreground" />,
  PAID: <IconCircleCheckFilled className="fill-green-500" />,
  FAILED: <IconCircleXFilled className="fill-red-500" />,
  REFUNDED: <IconReceiptRefund className="text-amber-600" />,
};

function OrderBadge({ status }: { status: OrderStatus }) {
  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      {orderIcon[status]}
      {statusLabel(status)}
    </Badge>
  );
}
function PaymentBadge({ status }: { status: PaymentStatus }) {
  return (
    <Badge variant="outline" className="px-1.5 text-muted-foreground">
      {paymentIcon[status]}
      {statusLabel(status)}
    </Badge>
  );
}

// ---------- list scaffolding ----------

function Px({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`px-4 lg:px-6 ${className}`}>{children}</div>;
}

function ListFrame({
  toolbar,
  columns,
  state,
  rows,
  skeletonCols,
  emptyText,
  total,
}: {
  toolbar: ReactNode;
  columns: ReactNode;
  state: ViewState;
  rows: ReactNode[];
  skeletonCols: number;
  emptyText: string;
  total: number;
}) {
  if (state === "error") {
    return (
      <Px>
        {toolbar}
        <div className="mt-6">
          <ErrorBlock
            title="Error loading list"
            message="Something went wrong on our side. Please try again."
            onReset={() => undefined}
          />
        </div>
      </Px>
    );
  }
  return (
    <Px className="flex flex-col gap-4">
      {toolbar}
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            <TableRow>{columns}</TableRow>
          </TableHeader>
          <TableBody>
            {state === "loading" &&
              Array.from({ length: 6 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: skeletonCols }).map((_, j) => (
                    <TableCell key={j}>
                      <Skeleton className="h-4 w-full" />
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            {state === "empty" && (
              <TableRow>
                <TableCell
                  colSpan={skeletonCols}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyText}
                </TableCell>
              </TableRow>
            )}
            {state === "data" && rows}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between">
        <div className="hidden flex-1 text-sm text-muted-foreground lg:flex">
          {state === "data" ? `${total} rows` : ""}
        </div>
        <div className="flex w-full items-center gap-8 lg:w-fit">
          <div className="hidden items-center gap-2 lg:flex">
            <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label>
            <Select defaultValue="10">
              <SelectTrigger size="sm" className="w-20" id="rows-per-page">
                <SelectValue placeholder="10" />
              </SelectTrigger>
              <SelectContent side="top">
                {[10, 20, 50].map((n) => (
                  <SelectItem key={n} value={String(n)}>
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="flex w-fit items-center justify-center text-sm font-medium">
            Page 1 of {Math.max(1, Math.ceil(total / 10))}
          </div>
          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <Button
              variant="outline"
              className="hidden h-8 w-8 p-0 lg:flex"
              size="icon"
              disabled
            >
              <IconChevronsLeft />
            </Button>
            <Button variant="outline" className="size-8" size="icon" disabled>
              <IconChevronLeft />
            </Button>
            <Button variant="outline" className="size-8" size="icon">
              <IconChevronRight />
            </Button>
            <Button
              variant="outline"
              className="hidden size-8 lg:flex"
              size="icon"
            >
              <IconChevronsRight />
            </Button>
          </div>
        </div>
      </div>
    </Px>
  );
}

function FilterSelect({
  placeholder,
  options,
  width = "w-36",
}: {
  placeholder: string;
  options: string[];
  width?: string;
}) {
  return (
    <Select>
      <SelectTrigger size="sm" className={width}>
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
  );
}

function ColumnsMenu({ columns }: { columns: string[] }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="ml-auto">
          <IconLayoutColumns />
          <span className="hidden lg:inline">Columns</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        {columns.map((c) => (
          <DropdownMenuCheckboxItem key={c} checked className="capitalize">
            {c}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
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
    <ListFrame
      state={state}
      total={orders.length}
      skeletonCols={6}
      emptyText="No orders match these filters."
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Order id or customer email"
            className="h-8 w-64"
          />
          <FilterSelect placeholder="Status" options={ORDER_STATUSES} />
          <FilterSelect placeholder="Payment" options={PAYMENT_STATUSES} />
          <ColumnsMenu
            columns={["id", "date", "customer", "total", "status", "payment"]}
          />
        </div>
      }
      columns={
        <>
          <TableHead className="w-10">
            <Checkbox aria-label="Select all" />
          </TableHead>
          <TableHead>Order</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead className="text-right">Total</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Payment</TableHead>
        </>
      }
      rows={orders.map((o) => (
        <TableRow
          key={o.id}
          className="cursor-pointer"
          onClick={() => go("order")}
        >
          <TableCell onClick={(e) => e.stopPropagation()}>
            <Checkbox aria-label="Select row" />
          </TableCell>
          <TableCell className="font-mono text-xs">{shortId(o.id)}</TableCell>
          <TableCell className="whitespace-nowrap">
            {formatDate(o.createdAt)}
          </TableCell>
          <TableCell className="max-w-48 truncate">
            {o.customer.email}
          </TableCell>
          <TableCell className="text-right tabular-nums">
            {currencyFormatter(o.total)}
          </TableCell>
          <TableCell>
            <OrderBadge status={o.status} />
          </TableCell>
          <TableCell>
            <PaymentBadge status={o.paymentStatus} />
          </TableCell>
        </TableRow>
      ))}
    />
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
      <Px className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 lg:col-span-2" />
        <Skeleton className="h-64" />
      </Px>
    );
  }
  if (state === "error") {
    return (
      <Px>
        <ErrorBlock
          title="Error loading order"
          message="We couldn't load this order."
          onReset={() => undefined}
        />
      </Px>
    );
  }
  return (
    <Px className="grid gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
            <CardDescription>
              Placed {formatDateTime(order.createdAt)} · {order.paymentMethod}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Subtotal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {order.items.map((i) => (
                  <TableRow key={i.productId}>
                    <TableCell className="flex items-center gap-3">
                      <img
                        src={thumbnailUrl(productById(i.productId).slug)}
                        alt=""
                        className="size-9 rounded object-cover"
                      />
                      {i.name}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {currencyFormatter(i.price)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {i.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {currencyFormatter(i.price * i.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <dl className="mt-4 ml-auto grid w-56 grid-cols-2 gap-1 text-sm">
              <dt className="text-muted-foreground">Subtotal</dt>
              <dd className="text-right tabular-nums">
                {currencyFormatter(order.subtotal)}
              </dd>
              <dt className="text-muted-foreground">Shipping</dt>
              <dd className="text-right tabular-nums">
                {currencyFormatter(order.shipping)}
              </dd>
              <dt className="text-muted-foreground">VAT</dt>
              <dd className="text-right tabular-nums">
                {currencyFormatter(order.vat)}
              </dd>
              <dt className="font-medium">Total</dt>
              <dd className="text-right font-medium tabular-nums">
                {currencyFormatter(order.total)}
              </dd>
            </dl>
          </CardContent>
        </Card>
        <div className="grid gap-4 md:grid-cols-2">
          {(["shippingAddress", "billingAddress"] as const).map((key) => (
            <Card key={key}>
              <CardHeader>
                <CardTitle>
                  {key === "shippingAddress"
                    ? "Shipping address"
                    : "Billing address"}
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                <p className="text-foreground">{order[key].fullName}</p>
                <p>{order[key].address}</p>
                <p>
                  {order[key].city}, {order[key].state} {order[key].zipCode}
                </p>
                <p>{order[key].country}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Customer</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <p className="font-medium capitalize">{order.customer.name}</p>
            <p className="text-muted-foreground">{order.customer.email}</p>
            <Button
              variant="link"
              className="mt-2 h-auto p-0 text-sm"
              onClick={() => go("user")}
            >
              View customer
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Fulfilment</CardTitle>
            <CardDescription>
              Only the moves allowed from the current state are offered.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Order status</Label>
              <Select
                value={edit.status}
                onValueChange={(v) => edit.setStatus(v as OrderStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {edit.statusOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label>Payment status</Label>
              <Select
                value={edit.payment}
                onValueChange={(v) => edit.setPayment(v as PaymentStatus)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {edit.paymentOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {statusLabel(s)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {edit.refundDue && (
              <p className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                This order is paid. Cancelling it may mean a refund is due; set
                payment status to Refunded once issued.
              </p>
            )}
            <Button size="sm" disabled={!edit.dirty} onClick={edit.save}>
              Save changes
            </Button>
          </CardContent>
        </Card>
      </div>
    </Px>
  );
}

function UsersPage({ state, go }: { state: ViewState; go: (p: Page) => void }) {
  return (
    <ListFrame
      state={state}
      total={users.length}
      skeletonCols={5}
      emptyText="No users match."
      toolbar={
        <div className="flex flex-wrap items-center gap-2">
          <Input placeholder="Name or email" className="h-8 w-64" />
          <FilterSelect
            placeholder="Role"
            options={["ADMIN", "USER"]}
            width="w-28"
          />
          <FilterSelect
            placeholder="Active"
            options={["ACTIVE", "INACTIVE"]}
            width="w-28"
          />
          <ColumnsMenu
            columns={["name", "email", "role", "active", "created"]}
          />
        </div>
      }
      columns={
        <>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Active</TableHead>
          <TableHead>Created</TableHead>
        </>
      }
      rows={users.map((u) => (
        <TableRow
          key={u.id}
          className="cursor-pointer"
          onClick={() => go("user")}
        >
          <TableCell className="font-medium capitalize">{u.name}</TableCell>
          <TableCell>{u.email}</TableCell>
          <TableCell>
            <Badge variant={u.role === "ADMIN" ? "default" : "secondary"}>
              {u.role}
            </Badge>
          </TableCell>
          <TableCell>
            <Badge variant="outline" className="px-1.5 text-muted-foreground">
              {u.active ? (
                <IconCircleCheckFilled className="fill-green-500" />
              ) : (
                <IconCircleXFilled className="fill-red-500" />
              )}
              {u.active ? "Active" : "Deactivated"}
            </Badge>
          </TableCell>
          <TableCell className="whitespace-nowrap">
            {formatDate(u.createdAt)}
          </TableCell>
        </TableRow>
      ))}
    />
  );
}

function UserDetail({ user, go }: { user: User; go: (p: Page) => void }) {
  const theirs = orders.filter((o) => o.customer.id === user.id);
  return (
    <Px className="grid gap-4 lg:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle className="capitalize">{user.name}</CardTitle>
          <CardDescription>{user.email}</CardDescription>
          <CardAction>
            <Badge variant={user.role === "ADMIN" ? "default" : "secondary"}>
              {user.role}
            </Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 text-sm">
          <dl className="grid grid-cols-2 gap-1">
            <dt className="text-muted-foreground">Status</dt>
            <dd>{user.active ? "Active" : "Deactivated"}</dd>
            <dt className="text-muted-foreground">Created</dt>
            <dd>{formatDate(user.createdAt)}</dd>
            <dt className="text-muted-foreground">Orders</dt>
            <dd>{theirs.length}</dd>
          </dl>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive" size="sm">
                Deactivate account
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Deactivate {user.name}?</DialogTitle>
                <DialogDescription>
                  They will not be able to sign in until an admin reactivates
                  them. Their orders are kept.
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
        </CardContent>
      </Card>
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {theirs.map((o) => (
                <TableRow
                  key={o.id}
                  className="cursor-pointer"
                  onClick={() => go("order")}
                >
                  <TableCell className="font-mono text-xs">
                    {shortId(o.id)}
                  </TableCell>
                  <TableCell>{formatDate(o.createdAt)}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {currencyFormatter(o.total)}
                  </TableCell>
                  <TableCell>
                    <OrderBadge status={o.status} />
                  </TableCell>
                  <TableCell>
                    <PaymentBadge status={o.paymentStatus} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </Px>
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
    <ListFrame
      state={state}
      total={products.length}
      skeletonCols={4}
      emptyText="No products."
      toolbar={
        <div className="flex items-center gap-2">
          <Input placeholder="Search products" className="h-8 w-64" />
          <ColumnsMenu columns={["name", "category", "price", "new"]} />
        </div>
      }
      columns={
        <>
          <TableHead>Product</TableHead>
          <TableHead>Category</TableHead>
          <TableHead className="text-right">Price</TableHead>
          <TableHead>New</TableHead>
        </>
      }
      rows={products.map((p) => (
        <TableRow
          key={p.id}
          className="cursor-pointer"
          onClick={() => go("product")}
        >
          <TableCell className="flex items-center gap-3 font-medium">
            <img
              src={thumbnailUrl(p.slug)}
              alt=""
              className="size-9 rounded object-cover"
            />
            {p.name}
          </TableCell>
          <TableCell>{p.category}</TableCell>
          <TableCell className="text-right tabular-nums">
            {currencyFormatter(p.price)}
          </TableCell>
          <TableCell>
            {p.isNewProduct && <Badge variant="secondary">New</Badge>}
          </TableCell>
        </TableRow>
      ))}
    />
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
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

const textarea =
  "min-h-20 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

function ProductEdit({ product }: { product: Product }) {
  const { draft, update, updateItem, addItem, removeItem, save } =
    useProductEdit(product);
  return (
    <Px className="grid gap-4 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Field label="Name">
              <Input
                value={draft.name}
                onChange={(e) => update("name", e.target.value)}
              />
            </Field>
            <Field label="Price (USD)" hint="Stored in cents.">
              <Input
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
                <SelectTrigger className="w-full">
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
            <div className="flex items-end gap-2 pb-2">
              <Checkbox
                id="isNew"
                checked={draft.isNewProduct}
                onCheckedChange={(v) => update("isNewProduct", v === true)}
              />
              <Label htmlFor="isNew">Show the "new product" overline</Label>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Copy</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4">
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
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Included items</CardTitle>
            <CardAction>
              <Button variant="outline" size="sm" onClick={addItem}>
                <IconPlus /> Add row
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {draft.includedItems.map((row, i) => (
              <div key={i} className="flex items-center gap-2">
                <Input
                  className="w-20"
                  type="number"
                  min={1}
                  value={row.quantity}
                  onChange={(e) =>
                    updateItem(i, { quantity: Number(e.target.value) })
                  }
                />
                <Input
                  value={row.item}
                  placeholder="Item"
                  onChange={(e) => updateItem(i, { item: e.target.value })}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove"
                  onClick={() => removeItem(i)}
                >
                  <IconTrash />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Labels</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <Field label="Cart label">
              <Input
                value={draft.cartLabel}
                onChange={(e) => update("cartLabel", e.target.value)}
              />
            </Field>
            <Field label="Short label">
              <Input
                value={draft.shortLabel}
                onChange={(e) => update("shortLabel", e.target.value)}
              />
            </Field>
            <Field label="Full label">
              <Input
                value={draft.fullLabel}
                onChange={(e) => update("fullLabel", e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>
        <div className="flex justify-end">
          <Button size="sm" onClick={save}>
            Save product
          </Button>
        </div>
      </div>
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Slug</CardTitle>
            <CardDescription>Public URL; not editable.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input value={`/product/${draft.slug}`} disabled />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Images</CardTitle>
            <CardDescription>
              Published from packages/media; not editable here.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3">
            {["thumbnail", "featured", "showcase"].map((kind) => (
              <figure
                key={kind}
                className="flex flex-col gap-1 text-xs text-muted-foreground"
              >
                <img
                  src={thumbnailUrl(draft.slug)}
                  alt=""
                  className="aspect-square rounded-md object-cover opacity-80"
                />
                <figcaption className="font-mono">
                  products/{draft.slug}/{kind}.jpg
                </figcaption>
              </figure>
            ))}
          </CardContent>
        </Card>
      </div>
    </Px>
  );
}

function HomepagePage() {
  const { slots, isTaken, save } = useHomepageSlots();
  return (
    <Px>
      <Card>
        <CardHeader>
          <CardTitle>Homepage slots</CardTitle>
          <CardDescription>
            Each list only offers products that carry the image that slot
            renders.
          </CardDescription>
          <CardAction>
            <Button size="sm" onClick={save}>
              Save
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid gap-4 @3xl/main:grid-cols-4">
          {slots.map((slot) => (
            <div key={slot.key} className="flex flex-col gap-2">
              <Label>{slot.label}</Label>
              <Select value={slot.productId} onValueChange={slot.set}>
                <SelectTrigger className="w-full">
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
              <img
                src={thumbnailUrl(productById(slot.productId).slug)}
                alt=""
                className="aspect-square w-20 rounded-md border object-cover"
              />
            </div>
          ))}
        </CardContent>
      </Card>
    </Px>
  );
}

function StatsPage({ state, go }: { state: ViewState; go: (p: Page) => void }) {
  const [period, setPeriod] = useState<Period>("30d");
  const stats = statsFor(period);
  if (state === "error") {
    return (
      <Px>
        <ErrorBlock
          title="Error loading stats"
          message="We couldn't compute the numbers."
          onReset={() => undefined}
        />
      </Px>
    );
  }
  if (state === "loading") {
    return (
      <Px className="grid gap-4 @xl/main:grid-cols-3">
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-36" />
        <Skeleton className="h-64 @xl/main:col-span-3" />
      </Px>
    );
  }
  return (
    <>
      <Px>
        <Tabs value={period} onValueChange={(v) => setPeriod(v as Period)}>
          <TabsList>
            {PERIODS.map((p) => (
              <TabsTrigger key={p.value} value={p.value}>
                {p.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </Px>
      <SectionCards stats={stats} />
      <Px>
        <ChartAreaInteractive />
      </Px>
      <Px className="grid gap-4 @3xl/main:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Orders by status</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {ORDER_STATUSES.map((s) => (
                  <TableRow key={s}>
                    <TableCell>
                      <OrderBadge status={s} />
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {stats.ordersByStatus[s]}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Top products</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableBody>
                {stats.topProducts.map((t) => (
                  <TableRow
                    key={t.productId}
                    className="cursor-pointer"
                    onClick={() => go("product")}
                  >
                    <TableCell className="flex items-center gap-3">
                      <img
                        src={thumbnailUrl(productById(t.productId).slug)}
                        alt=""
                        className="size-8 rounded object-cover"
                      />
                      {productById(t.productId).name}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {t.quantity} sold
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </Px>
    </>
  );
}
