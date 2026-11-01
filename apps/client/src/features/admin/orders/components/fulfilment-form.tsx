import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { normalizeError } from "@/lib/errors/errors";
import { applyServerErrors } from "@/lib/errors/form-errors";
import type { AdminOrderDTO, OrderStatus, PaymentStatus } from "@repo/domain";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import {
  useUpdateOrderStatus,
  useUpdatePaymentStatus,
} from "../api/get-admin-orders";
import {
  orderStatusOptions,
  paymentStatusOptions,
  refundMayBeDue,
  statusLabel,
} from "../transitions";
import { OrderStatusBadge, PaymentStatusBadge } from "./status-badges";

const overline = "text-xs font-bold tracking-600 uppercase text-neutral-500";

/**
 * The sticky panel on the order detail. Each select offers the current value
 * plus the moves the domain tables allow; the server enforces the same tables.
 * Mount it with a key that changes when the order's statuses do, so a saved
 * move becomes the new starting point.
 */
export function FulfilmentForm({ order }: { order: AdminOrderDTO }) {
  const updateStatus = useUpdateOrderStatus(order.id);
  const updatePayment = useUpdatePaymentStatus(order.id);

  const form = useForm({
    defaultValues: {
      status: order.status,
      paymentStatus: order.paymentStatus,
    },
    onSubmit: async ({ value }) => {
      try {
        if (value.status !== order.status) {
          await updateStatus.mutateAsync({ status: value.status });
        }
        if (value.paymentStatus !== order.paymentStatus) {
          await updatePayment.mutateAsync({
            paymentStatus: value.paymentStatus,
          });
        }
        toast.success("Order updated");
      } catch (error) {
        const message = applyServerErrors(form, normalizeError(error));
        if (message) {
          toast.error("Order not updated", { description: message });
        }
      }
    },
  });

  const statusOptions = orderStatusOptions(order.status);
  const paymentOptions = paymentStatusOptions(order.paymentStatus);

  return (
    <form
      aria-label="Fulfilment"
      className="flex flex-col gap-5 rounded-lg bg-neutral-100 p-6"
      onSubmit={(event) => {
        event.preventDefault();
        void form.handleSubmit();
      }}
    >
      <h2 className={overline}>Fulfilment</h2>
      <div className="flex gap-2">
        <OrderStatusBadge status={order.status} />
        <PaymentStatusBadge status={order.paymentStatus} />
      </div>

      <form.Field
        name="status"
        children={(field) => {
          const isInvalid = field.state.meta.errors.length > 0;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Move order to</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as OrderStatus)
                }
                disabled={statusOptions.length === 1}
              >
                <SelectTrigger
                  id={field.name}
                  className="w-full"
                  aria-invalid={isInvalid}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((value) => (
                    <SelectItem key={value} value={value}>
                      {statusLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      />

      <form.Subscribe
        selector={(state) => state.values.status}
        children={(status) =>
          refundMayBeDue(order, status) && (
            <p
              role="note"
              className="rounded-md border-l-4 border-primary-500 bg-primary-400/30 p-3 text-sm"
            >
              This order is paid. Cancelling it may leave a refund due; mark the
              payment Refunded once it is returned.
            </p>
          )
        }
      />

      <form.Field
        name="paymentStatus"
        children={(field) => {
          const isInvalid = field.state.meta.errors.length > 0;
          return (
            <Field data-invalid={isInvalid}>
              <FieldLabel htmlFor={field.name}>Payment status</FieldLabel>
              <Select
                value={field.state.value}
                onValueChange={(value) =>
                  field.handleChange(value as PaymentStatus)
                }
                disabled={paymentOptions.length === 1}
              >
                <SelectTrigger
                  id={field.name}
                  className="w-full"
                  aria-invalid={isInvalid}
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentOptions.map((value) => (
                    <SelectItem key={value} value={value}>
                      {statusLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {isInvalid && <FieldError errors={field.state.meta.errors} />}
            </Field>
          );
        }}
      />

      <form.Subscribe
        selector={(state) => [
          state.values.status !== order.status ||
            state.values.paymentStatus !== order.paymentStatus,
          state.isSubmitting,
        ]}
        children={([isChanged, isSubmitting]) => (
          <Button
            type="submit"
            variant="accent"
            className="w-full"
            disabled={!isChanged || isSubmitting}
          >
            Save
          </Button>
        )}
      />
      <p className="text-xs text-neutral-500">
        Payment status is set by hand until a payment gateway exists.
      </p>
    </form>
  );
}
