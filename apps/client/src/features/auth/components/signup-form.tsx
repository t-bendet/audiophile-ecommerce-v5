import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { paths } from "@/config/paths";
import { USER_QUERY_KEY, useSignup } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { normalizeError } from "@/lib/errors/errors";
import { applyServerErrors } from "@/lib/errors/form-errors";
import { AuthSignUpRequestSchema } from "@repo/domain";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  authInputClass,
  authLabelClass,
  authLeadClass,
  authLinkClass,
  authOverlineClass,
  authTitleClass,
} from "./auth-styles";
import { PasswordStrengthMeter } from "./password-strength-meter";
import { PasswordVisibilityToggle } from "./password-visibility-toggle";

export function SignupForm({ className }: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isPasswordConfirmVisible, setIsPasswordConfirmVisible] =
    useState(false);

  const queryClient = useQueryClient();
  const { mutate: signup, isPending } = useSignup(queryClient);

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirm: "",
    },
    validators: {
      onSubmit: AuthSignUpRequestSchema.shape.body,
    },
    onSubmit: async ({ value }) => {
      signup(value, {
        onSuccess: async () => {
          navigate(
            searchParams.get("redirectTo") ?? paths.account.root.getHref(),
          );
        },
        async onError(error) {
          const message = applyServerErrors(form, normalizeError(error));
          if (message) {
            toast.error("Signup Failed", { description: message });
          }
          await queryClient.setQueryData([USER_QUERY_KEY], null);
        },
      });
    },
  });

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <div className="flex flex-col gap-3">
        <p className={authOverlineClass}>Account</p>
        <h1 className={authTitleClass}>Create your account</h1>
        <p className={authLeadClass}>
          Your orders, addresses and receipts in one place.
        </p>
      </div>
      <form
        id="signup-form"
        onSubmit={(e) => {
          e.preventDefault();
          // Reset the form with current values to retrigger zod costume validation
          form.reset({
            // New custom values
            name: form.getFieldValue("name"),
            email: form.getFieldValue("email"),
            password: form.getFieldValue("password"),
            passwordConfirm: form.getFieldValue("passwordConfirm"),
          });

          form.handleSubmit();
        }}
      >
        <FieldGroup>
          <form.Field
            name="name"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name} className={authLabelClass}>
                    Full name
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    className={authInputClass}
                    type="text"
                    placeholder="John Doe"
                    required
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <form.Field
            name="email"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name} className={authLabelClass}>
                    Email
                  </FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    className={authInputClass}
                    type="email"
                    placeholder="m@example.com"
                    required
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <form.Field
            name="password"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid}>
                  <FieldLabel htmlFor={field.name} className={authLabelClass}>
                    Password
                  </FieldLabel>
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
                      className={cn(authInputClass, "pr-16")}
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
                  <p id="password-hint" className="text-sm text-neutral-500">
                    Between 8 and 20 characters.
                  </p>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
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
                  <FieldLabel htmlFor={field.name} className={authLabelClass}>
                    Confirm password
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
                      className={cn(authInputClass, "pr-16")}
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
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />

          <Field>
            <Button
              type="submit"
              form="signup-form"
              variant="accent"
              size="lg"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Spinner size="sm" variant="light" />
                  Creating account
                </>
              ) : (
                "Create account"
              )}
            </Button>
            <p className="text-sm">
              Already have an account?{" "}
              <Link to={paths.auth.login.path} className={authLinkClass}>
                Login
              </Link>
            </p>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
