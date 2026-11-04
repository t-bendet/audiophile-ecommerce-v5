import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { useState } from "react";
import { toast } from "sonner";
import {
  useUpdateOrderStatus,
  useUpdatePaymentStatus,
} from "../api/get-admin-orders";
import {
  latestStatuses,
  orderStatusOptions,
  paymentStatusOptions,
  refundMayBeDue,
  statusLabel,
  type FulfilmentStatuses,
} from "../transitions";
import { OrderStatusBadge, PaymentStatusBadge } from "./status-badges";

const overline = "text-xs font-bold tracking-600 uppercase text-neutral-500";

/**
 * The sticky panel on the order detail. Each select offers the current value
 * plus the moves the domain tables allow; the server enforces the same tables.
 * A saved move resets the form to the order the save answered, so it becomes
 * the new starting point in place.
 */
export function FulfilmentForm({ order }: { order: AdminOrderDTO }) {
  const updateStatus = useUpdateOrderStatus(order.id);
  const updatePayment = useUpdatePaymentStatus(order.id);
  const [saved, setSaved] = useState<FulfilmentStatuses>();
  const current = latestStatuses(order, saved);

  const form = useForm({
    defaultValues: {
      status: current.status,
      paymentStatus: current.paymentStatus,
      trackingNumber: "",
      carrier: "",
    },
    onSubmit: async ({ value }) => {
      try {
        let latest = current;
        if (value.status !== current.status) {
          const response = await updateStatus.mutateAsync({
            status: value.status,
            ...(value.status === "SHIPPED" && {
              trackingNumber: value.trackingNumber,
              carrier: value.carrier,
            }),
          });
          latest = response.data;
          setSaved(latest);
        }
        if (value.paymentStatus !== current.paymentStatus) {
          const response = await updatePayment.mutateAsync({
            paymentStatus: value.paymentStatus,
          });
          latest = response.data;
          setSaved(latest);
        }
        form.reset({
          status: latest.status,
          paymentStatus: latest.paymentStatus,
          trackingNumber: "",
          carrier: "",
        });
        toast.success("Order updated");
      } catch (error) {
        const message = applyServerErrors(form, normalizeError(error));
        if (message) {
          toast.error("Order not updated", { description: message });
        }
      }
    },
  });

  const statusOptions = orderStatusOptions(current.status);
  const paymentOptions = paymentStatusOptions(current.paymentStatus);

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
        <OrderStatusBadge status={current.status} />
        <PaymentStatusBadge status={current.paymentStatus} />
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
          status === "SHIPPED" &&
          current.status !== "SHIPPED" && (
            <>
              {(["carrier", "trackingNumber"] as const).map((name) => (
                <form.Field
                  key={name}
                  name={name}
                  children={(field) => {
                    const isInvalid = field.state.meta.errors.length > 0;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={name}>
                          {name === "carrier" ? "Carrier" : "Tracking number"}
                        </FieldLabel>
                        <Input
                          id={name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(event) =>
                            field.handleChange(event.target.value)
                          }
                          aria-invalid={isInvalid}
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />
              ))}
            </>
          )
        }
      />
      {(current.status === "SHIPPED" || current.status === "DELIVERED") &&
        (() => {
          const shipment = [...order.events]
            .reverse()
            .find(
              (event) => event.status === "SHIPPED" && event.trackingNumber,
            );
          return (
            shipment && (
              <div>
                <p>{shipment.carrier}</p>
                <p className="font-mono">{shipment.trackingNumber}</p>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    void navigator.clipboard.writeText(shipment.trackingNumber!)
                  }
                >
                  Copy tracking number
                </Button>
              </div>
            )
          );
        })()}

      <form.Subscribe
        selector={(state) => state.values.status}
        children={(status) =>
          refundMayBeDue(current, status) && (
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
          state.values.status !== current.status ||
            state.values.paymentStatus !== current.paymentStatus,
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
