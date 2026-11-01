import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { normalizeError } from "@/lib/errors/errors";
import { applyServerErrors } from "@/lib/errors/form-errors";
import {
  CreateOrderInput,
  CreateOrderInputSchema,
  OrderDTO,
} from "@repo/domain";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";
import { useCreateOrder } from "../api/get-orders";

const PAYMENT_METHODS = ["e-Money", "Cash on Delivery"] as const;

const addressFields = <P extends "shippingAddress" | "billingAddress">(
  prefix: P,
) =>
  [
    {
      name: `${prefix}.address`,
      label: "Address",
      autoComplete: "street-address",
    },
    { name: `${prefix}.city`, label: "City", autoComplete: "address-level2" },
    { name: `${prefix}.state`, label: "State", autoComplete: "address-level1" },
    {
      name: `${prefix}.zipCode`,
      label: "ZIP code",
      autoComplete: "postal-code",
    },
    {
      name: `${prefix}.country`,
      label: "Country",
      autoComplete: "country-name",
    },
  ] as const;

const SHIPPING_FIELDS = [
  {
    name: "shippingAddress.fullName",
    label: "Full name",
    autoComplete: "name",
  },
  {
    name: "shippingAddress.email",
    label: "Email",
    autoComplete: "email",
    type: "email",
  },
  {
    name: "shippingAddress.phone",
    label: "Phone",
    autoComplete: "tel",
    type: "tel",
  },
  ...addressFields("shippingAddress"),
] as const;

const BILLING_FIELDS = [
  { name: "billingAddress.fullName", label: "Full name", autoComplete: "name" },
  ...addressFields("billingAddress"),
] as const;

const EMPTY_ADDRESS = {
  fullName: "",
  address: "",
  city: "",
  state: "",
  zipCode: "",
  country: "",
};

const EMPTY_ORDER: CreateOrderInput = {
  shippingAddress: { ...EMPTY_ADDRESS, email: "", phone: "" },
  billingAddress: { ...EMPTY_ADDRESS },
  paymentMethod: PAYMENT_METHODS[0],
};

type CheckoutFormProps = {
  onOrderCreated: (order: OrderDTO) => void;
};

export function CheckoutForm({ onOrderCreated }: CheckoutFormProps) {
  const { mutate: createOrder, isPending } = useCreateOrder();

  const form = useForm({
    defaultValues: EMPTY_ORDER,
    validators: { onSubmit: CreateOrderInputSchema },
    onSubmit: ({ value }) => {
      createOrder(value, {
        onSuccess: (response) => onOrderCreated(response.data),
        onError: (error) => {
          const message = applyServerErrors(form, normalizeError(error));
          if (message) {
            toast.error("Order Failed", { description: message });
          }
        },
      });
    },
  });

  const renderTextField = (
    textField:
      (typeof SHIPPING_FIELDS)[number] | (typeof BILLING_FIELDS)[number],
  ) => (
    <form.Field
      key={textField.name}
      name={textField.name}
      children={(field) => {
        const isInvalid =
          field.state.meta.isTouched && !field.state.meta.isValid;
        return (
          <Field data-invalid={isInvalid}>
            <FieldLabel htmlFor={field.name}>{textField.label}</FieldLabel>
            <Input
              id={field.name}
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(e) => field.handleChange(e.target.value)}
              aria-invalid={isInvalid}
              type={"type" in textField ? textField.type : "text"}
              autoComplete={textField.autoComplete}
              required
            />
            {isInvalid && <FieldError errors={field.state.meta.errors} />}
          </Field>
        );
      }}
    />
  );

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void form.handleSubmit();
      }}
    >
      <FieldGroup>
        <FieldSet>
          <FieldLegend>Shipping details</FieldLegend>
          <div className="grid gap-4 sm:grid-cols-2">
            {SHIPPING_FIELDS.map(renderTextField)}
          </div>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Billing address</FieldLegend>
          <div className="grid gap-4 sm:grid-cols-2">
            {BILLING_FIELDS.map(renderTextField)}
          </div>
        </FieldSet>

        <FieldSet>
          <FieldLegend>Payment method</FieldLegend>
          <form.Field
            name="paymentMethod"
            children={(field) => (
              <div className="flex flex-col gap-3">
                {PAYMENT_METHODS.map((method) => {
                  const id = `payment-method-${method}`;
                  return (
                    <FieldLabel
                      key={method}
                      htmlFor={id}
                      className="items-center rounded-md border p-4 has-checked:border-primary-500"
                    >
                      <input
                        id={id}
                        type="radio"
                        name={field.name}
                        value={method}
                        checked={field.state.value === method}
                        onChange={() => field.handleChange(method)}
                        className="accent-primary-500"
                      />
                      {method}
                    </FieldLabel>
                  );
                })}
              </div>
            )}
          />
        </FieldSet>

        <Button
          type="submit"
          variant="accent"
          className="w-full"
          disabled={isPending}
        >
          Continue & Pay
        </Button>
      </FieldGroup>
    </form>
  );
}
