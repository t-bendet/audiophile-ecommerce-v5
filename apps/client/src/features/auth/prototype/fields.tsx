// PROTOTYPE: form atoms every variant composes differently (#352). Local state only.
import { Button, type ButtonProps } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/cn";
import { type ReactNode, useState } from "react";
import { PasswordStrengthMeter } from "../components/password-strength-meter";
import { PasswordVisibilityToggle } from "../components/password-visibility-toggle";

type FieldProps = {
  id: string;
  label: string;
  error?: string;
  labelExtra?: ReactNode;
  labelClassName?: string;
  inputClassName?: string;
};

export function TextField({
  id,
  label,
  error,
  labelExtra,
  labelClassName,
  inputClassName,
  type = "text",
  placeholder,
  defaultValue = "",
  autoComplete,
}: FieldProps & {
  type?: string;
  placeholder?: string;
  defaultValue?: string;
  autoComplete?: string;
}) {
  const [value, setValue] = useState(defaultValue);
  return (
    <Field data-invalid={!!error}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FieldLabel htmlFor={id} className={labelClassName}>
          {label}
        </FieldLabel>
        {labelExtra}
      </div>
      <Input
        id={id}
        name={id}
        type={type}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-invalid={!!error}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={inputClassName}
        required
      />
      {error && <FieldError>{error}</FieldError>}
    </Field>
  );
}

export function PasswordField({
  id,
  label,
  error,
  labelExtra,
  labelClassName,
  inputClassName,
  withMeter,
  below,
  autoComplete,
}: FieldProps & {
  withMeter?: boolean;
  below?: ReactNode;
  autoComplete?: string;
}) {
  const [value, setValue] = useState("");
  const [visible, setVisible] = useState(false);
  return (
    <Field data-invalid={!!error}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FieldLabel htmlFor={id} className={labelClassName}>
          {label}
        </FieldLabel>
        {labelExtra}
      </div>
      <div className="relative">
        <Input
          id={id}
          name={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          aria-invalid={!!error}
          autoComplete={autoComplete}
          className={cn("pr-16", inputClassName)}
          required
        />
        <PasswordVisibilityToggle
          isVisible={visible}
          onToggle={() => setVisible((v) => !v)}
        />
      </div>
      {withMeter && <PasswordStrengthMeter password={value} />}
      {error && <FieldError>{error}</FieldError>}
      {below}
    </Field>
  );
}

export function SubmitButton({
  pending,
  pendingLabel,
  children,
  className,
  ...props
}: ButtonProps & { pending: boolean; pendingLabel: string }) {
  return (
    <Button
      type="button"
      disabled={pending}
      aria-busy={pending}
      className={cn("w-full", className)}
      {...props}
    >
      {pending && <Spinner size="sm" className="text-current" />}
      {pending ? pendingLabel : children}
    </Button>
  );
}

// Where a successful reset lands. A stub: the real page is /account/profile.
export function LandingStub({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border-2 border-dashed border-neutral-400 p-6 text-sm text-neutral-500",
        className,
      )}
    >
      <p className="mb-1 font-bold text-neutral-900">Signed in</p>
      <p>
        The shopper lands on <code>/account/profile</code> with their new
        session. The toast at the bottom right is the only confirmation.
      </p>
    </div>
  );
}
