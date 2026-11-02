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
import { useLogin, USER_QUERY_KEY } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { isDeactivatedError, normalizeError } from "@/lib/errors/errors";
import { applyServerErrors } from "@/lib/errors/form-errors";
import {
  ACCOUNT_DEACTIVATED_MESSAGE,
  AuthLoginRequestSchema,
} from "@repo/domain";
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
import { PasswordVisibilityToggle } from "./password-visibility-toggle";

export function LoginForm({ className }: React.ComponentProps<"div">) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  // Arriving with `reason=deactivated` means a signed-in session just ended this way.
  const [isDeactivated, setIsDeactivated] = useState(
    searchParams.get("reason") === "deactivated",
  );

  const queryClient = useQueryClient();
  const { mutate: login, isPending } = useLogin(queryClient);
  const form = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    validators: {
      onSubmit: AuthLoginRequestSchema.shape.body,
    },

    onSubmit: async ({ value }) => {
      login(value, {
        onSuccess: async () => {
          navigate(
            searchParams.get("redirectTo") ?? paths.account.root.getHref(),
          );
        },
        onError: async (error) => {
          const failure = normalizeError(error);
          // Explained under the form rather than toasted: it is about the account, not the attempt.
          setIsDeactivated(isDeactivatedError(failure));
          if (!isDeactivatedError(failure)) {
            const message = applyServerErrors(form, failure);
            if (message) {
              toast.error("Login Failed", { description: message });
            }
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
        <h1 className={authTitleClass}>Welcome back</h1>
        <p className={authLeadClass}>
          Sign in to see your orders and check out faster.
        </p>
      </div>
      <form
        id="login-form"
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
                    placeholder="m@example.com"
                    type="email"
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
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <FieldLabel htmlFor={field.name} className={authLabelClass}>
                      Password
                    </FieldLabel>
                    <Link
                      to={paths.auth.forgotPassword.path}
                      className={cn(authLinkClass, "text-sm")}
                    >
                      Forgot your password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Input
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      aria-invalid={isInvalid}
                      className={cn(authInputClass, "pr-16")}
                      placeholder="Enter your password"
                      required
                      type={isPasswordVisible ? "text" : "password"}
                    />
                    <PasswordVisibilityToggle
                      isVisible={isPasswordVisible}
                      onToggle={() => setIsPasswordVisible((prev) => !prev)}
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
              form="login-form"
              variant="accent"
              size="lg"
              disabled={isPending}
            >
              {isPending ? (
                <>
                  <Spinner size="sm" variant="light" />
                  Signing in
                </>
              ) : (
                "Login"
              )}
            </Button>
            {isDeactivated && (
              <p
                role="alert"
                className="text-center text-sm font-medium text-primary-700"
              >
                {ACCOUNT_DEACTIVATED_MESSAGE}
              </p>
            )}
            <p className="text-sm">
              Don&apos;t have an account?{" "}
              <Link to={paths.auth.signup.path} className={authLinkClass}>
                Sign up
              </Link>
            </p>
          </Field>
        </FieldGroup>
      </form>
    </div>
  );
}
