import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { paths } from "@/config/paths";
import currencyFormatter from "@/utils/formatters";
import type { AdminOrderDTO } from "@repo/domain";
import { Link } from "react-router";
import { shortOrderId } from "../order-id";
import { OrderStatusBadge, PaymentStatusBadge } from "./status-badges";

const dateFormatter = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

const overline = "text-xs font-bold tracking-600 uppercase";

/** Every order as table rows from `md` up and as stacked cards below. */
export function OrdersTable({ orders }: { orders: AdminOrderDTO[] }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-lg bg-neutral-100 md:block">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent">
              {["Order", "Date", "Customer", "Total", "Status", "Payment"].map(
                (heading) => (
                  <TableHead
                    key={heading}
                    className={`${overline} h-14 px-6 text-neutral-500`}
                  >
                    {heading}
                  </TableHead>
                ),
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id} className="h-16">
                <TableCell className="px-6 font-bold">
                  <Link
                    to={paths.admin.order.getHref(order.id)}
                    className="hover:text-primary-500"
                  >
                    {shortOrderId(order.id)}
                  </Link>
                </TableCell>
                <TableCell className="px-6">
                  {dateFormatter.format(order.createdAt)}
                </TableCell>
                <TableCell className="max-w-64 truncate px-6">
                  {order.customer.email}
                </TableCell>
                <TableCell className="px-6 font-bold">
                  {currencyFormatter(order.total)}
                </TableCell>
                <TableCell className="px-6">
                  <OrderStatusBadge status={order.status} />
                </TableCell>
                <TableCell className="px-6">
                  <PaymentStatusBadge status={order.paymentStatus} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <ul className="flex flex-col gap-4 md:hidden">
        {orders.map((order) => (
          <li key={order.id}>
            <Link
              to={paths.admin.order.getHref(order.id)}
              className="flex flex-col gap-3 rounded-lg bg-neutral-100 p-5"
            >
              <span className="flex items-baseline justify-between gap-4">
                <span className="font-bold">{shortOrderId(order.id)}</span>
                <span className="text-sm text-neutral-500">
                  {dateFormatter.format(order.createdAt)}
                </span>
              </span>
              <span className="truncate text-sm">{order.customer.email}</span>
              <span className="flex items-center justify-between gap-4">
                <span className="flex gap-2">
                  <OrderStatusBadge status={order.status} />
                  <PaymentStatusBadge status={order.paymentStatus} />
                </span>
                <span className="font-bold">
                  {currencyFormatter(order.total)}
                </span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
