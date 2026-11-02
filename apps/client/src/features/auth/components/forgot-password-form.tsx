import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { paths } from "@/config/paths";
import { useForgotPassword } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { normalizeError } from "@/lib/errors/errors";
import { applyServerErrors } from "@/lib/errors/form-errors";
import { AuthForgotPasswordRequestSchema, ErrorCode } from "@repo/domain";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { ResetLinkSent } from "./reset-link-sent";

export function ForgotPasswordForm({ className }: React.ComponentProps<"div">) {
  // The address the link was requested for; set, it replaces the form in place.
  const [sentTo, setSentTo] = useState<string | null>(null);
  const { mutate: requestResetLink, isPending } = useForgotPassword();
  const form = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: AuthForgotPasswordRequestSchema.shape.body,
    },

    onSubmit: async ({ value }) => {
      requestResetLink(value, {
        onSuccess: () => setSentTo(value.email),
        onError: (error) => {
          const failure = normalizeError(error);
          const message = applyServerErrors(form, failure);
          if (message) {
            toast.error(
              failure.code === ErrorCode.TOO_MANY_REQUESTS
                ? "Too many requests"
                : "Request failed",
              { description: message },
            );
          }
        },
      });
    },
  });

  return (
    <Container classes={cn("flex flex-col gap-6 text-neutral-900", className)}>
      {sentTo ? (
        <ResetLinkSent
          email={sentTo}
          onTryAnotherEmail={() => setSentTo(null)}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold tracking-600 text-primary-500 uppercase">
              Account recovery
            </p>
            <h1 className="text-2xl font-bold tracking-300 uppercase md:text-3xl">
              Forgot your password?
            </h1>
            <p className="opacity-50">
              Enter the email you signed up with and we will send you a link to
              set a new one.
            </p>
          </div>
          <form
            id="forgot-password-form"
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field
                name="email"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="m@example.com"
                        type="email"
                        required
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />

              <Field>
                <Button
                  type="submit"
                  form="forgot-password-form"
                  variant="accent"
                  size="lg"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Spinner size="sm" variant="light" />
                      Sending
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </Button>
                <p className="text-center text-sm">
                  Remembered it?{" "}
                  <Link
                    to={paths.auth.login.path}
                    className="font-bold text-primary-500"
                  >
                    Back to login
                  </Link>
                </p>
              </Field>
            </FieldGroup>
          </form>
        </>
      )}
    </Container>
  );
}
