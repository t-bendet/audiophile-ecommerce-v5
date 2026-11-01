import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  IdValidator,
  ORDER_STATUS,
  PAYMENT_STATUS,
  type OrderStatus,
  type PaymentStatus,
} from "@repo/domain";
import { useState } from "react";
import { AdminOrderFilters } from "../filters";
import { statusLabel } from "../transitions";

// Radix reserves the empty string for clearing a select, so "any" needs a value.
const ANY = "ANY";

type OrdersFiltersProps = {
  filters: AdminOrderFilters;
  onApply: (filters: AdminOrderFilters) => void;
};

/** The toolbar above the orders table; applying resets to the first page. */
export function OrdersFilters({ filters, onApply }: OrdersFiltersProps) {
  const [orderId, setOrderId] = useState(filters.orderId ?? "");
  const [customerEmail, setCustomerEmail] = useState(
    filters.customerEmail ?? "",
  );
  const [status, setStatus] = useState<OrderStatus | typeof ANY>(
    filters.status ?? ANY,
  );
  const [paymentStatus, setPaymentStatus] = useState<
    PaymentStatus | typeof ANY
  >(filters.paymentStatus ?? ANY);
  const [orderIdError, setOrderIdError] = useState<string>();

  const apply = () => {
    const trimmedId = orderId.trim();
    if (trimmedId) {
      const result = IdValidator("Order").safeParse(trimmedId);
      if (!result.success) {
        setOrderIdError("An order id is 24 characters long");
        return;
      }
    }
    setOrderIdError(undefined);
    onApply({
      ...(trimmedId && { orderId: trimmedId }),
      ...(customerEmail.trim() && { customerEmail: customerEmail.trim() }),
      ...(status !== ANY && { status }),
      ...(paymentStatus !== ANY && { paymentStatus }),
      ...(filters.userId && { userId: filters.userId }),
    });
  };

  return (
    <form
      aria-label="Filter orders"
      className="flex flex-col gap-4 rounded-lg bg-neutral-100 p-5 md:flex-row md:flex-wrap md:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        apply();
      }}
    >
      <Field className="md:flex-1" data-invalid={!!orderIdError}>
        <FieldLabel htmlFor="filter-order-id">Order id</FieldLabel>
        <Input
          id="filter-order-id"
          value={orderId}
          onChange={(event) => setOrderId(event.target.value)}
          aria-invalid={!!orderIdError}
          placeholder="Exact order id"
        />
        {orderIdError && <FieldError>{orderIdError}</FieldError>}
      </Field>
      <Field className="md:flex-1">
        <FieldLabel htmlFor="filter-customer-email">Customer email</FieldLabel>
        <Input
          id="filter-customer-email"
          type="search"
          value={customerEmail}
          onChange={(event) => setCustomerEmail(event.target.value)}
          placeholder="Part of an email"
        />
      </Field>
      <Field className="md:w-40">
        <FieldLabel htmlFor="filter-status">Status</FieldLabel>
        <Select
          value={status}
          onValueChange={(value) => setStatus(value as OrderStatus)}
        >
          <SelectTrigger id="filter-status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any status</SelectItem>
            {Object.values(ORDER_STATUS).map((value) => (
              <SelectItem key={value} value={value}>
                {statusLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Field className="md:w-40">
        <FieldLabel htmlFor="filter-payment-status">Payment status</FieldLabel>
        <Select
          value={paymentStatus}
          onValueChange={(value) => setPaymentStatus(value as PaymentStatus)}
        >
          <SelectTrigger id="filter-payment-status" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ANY}>Any payment</SelectItem>
            {Object.values(PAYMENT_STATUS).map((value) => (
              <SelectItem key={value} value={value}>
                {statusLabel(value)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>
      <Button type="submit" variant="accent" className="md:self-end">
        Apply
      </Button>
    </form>
  );
}
