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
import { useResetPassword } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { normalizeError } from "@/lib/errors/errors";
import { applyServerErrors } from "@/lib/errors/form-errors";
import { AuthResetPasswordRequestSchema, ErrorCode } from "@repo/domain";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import { PasswordStrengthMeter } from "./password-strength-meter";
import { PasswordVisibilityToggle } from "./password-visibility-toggle";
import { ResetLinkExpired } from "./reset-link-expired";

export function ResetPasswordForm({ className }: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] =
    useState(false);
  // The token is not checked up front; the save's answer says whether it worked.
  const [isLinkExpired, setIsLinkExpired] = useState(false);

  const queryClient = useQueryClient();
  const { mutate: resetPassword, isPending } = useResetPassword(queryClient);

  const form = useForm({
    defaultValues: {
      // A form value with no input: a missing token is sent and refused like a bad one.
      token: searchParams.get("token") ?? "",
      password: "",
      passwordConfirm: "",
    },
    validators: {
      onSubmit: AuthResetPasswordRequestSchema.shape.body,
    },
    onSubmit: async ({ value }) => {
      resetPassword(value, {
        onSuccess: () => {
          navigate(paths.account.profile.getHref());
          toast.success("Password updated", {
            description: "You are signed in with your new password.",
          });
        },
        onError: (error) => {
          const failure = normalizeError(error);
          if (failure.code === ErrorCode.PASSWORD_RESET_TOKEN_INVALID) {
            setIsLinkExpired(true);
            return;
          }
          const message = applyServerErrors(form, failure);
          if (message) {
            toast.error("Reset failed", { description: message });
          }
        },
      });
    },
  });

  return (
    <Container classes={cn("flex flex-col gap-6 text-neutral-900", className)}>
      {isLinkExpired ? (
        <ResetLinkExpired />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold tracking-600 text-primary-500 uppercase">
              Account recovery
            </p>
            <h1 className="text-2xl font-bold tracking-300 uppercase md:text-3xl">
              Set a new password
            </h1>
            <p className="opacity-50">
              Choose a password you have not used on this site before.
            </p>
          </div>
          <form
            id="reset-password-form"
            onSubmit={(e) => {
              e.preventDefault();
              // Reset with the current values to retrigger the schema's refinement.
              form.reset({
                token: form.getFieldValue("token"),
                password: form.getFieldValue("password"),
                passwordConfirm: form.getFieldValue("passwordConfirm"),
              });
              form.handleSubmit();
            }}
          >
            <FieldGroup>
              <form.Field
                name="password"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>New password</FieldLabel>
                      <div className="relative">
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          aria-describedby="password-hint"
                          autoComplete="new-password"
                          className="pr-16"
                          type={isPasswordVisible ? "text" : "password"}
                          required
                        />
                        <PasswordVisibilityToggle
                          isVisible={isPasswordVisible}
                          onToggle={() => setIsPasswordVisible((prev) => !prev)}
                        />
                      </div>
                      <PasswordStrengthMeter password={field.state.value} />
                      {/* Its own colour, so the field's invalid state does not turn it red. */}
                      <p
                        id="password-hint"
                        className="text-sm text-neutral-500"
                      >
                        Between 8 and 20 characters.
                      </p>
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />

              <form.Field
                name="passwordConfirm"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>
                        Confirm new password
                      </FieldLabel>
                      <div className="relative">
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          autoComplete="new-password"
                          className="pr-16"
                          type={isPasswordConfirmVisible ? "text" : "password"}
                          required
                        />
                        <PasswordVisibilityToggle
                          isVisible={isPasswordConfirmVisible}
                          onToggle={() =>
                            setIsPasswordConfirmVisible((prev) => !prev)
                          }
                        />
                      </div>
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
                  form="reset-password-form"
                  variant="accent"
                  size="lg"
                  disabled={isPending}
                >
                  {isPending ? (
                    <>
                      <Spinner size="sm" variant="light" />
                      Saving
                    </>
                  ) : (
                    "Save new password"
                  )}
                </Button>
              </Field>
            </FieldGroup>
          </form>
        </>
      )}
    </Container>
  );
}
