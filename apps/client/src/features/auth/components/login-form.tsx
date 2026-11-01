import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
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
    <Container classes={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl capitalize">welcome back</CardTitle>
          <CardDescription>Login with your account</CardDescription>
        </CardHeader>
        <CardContent>
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

              <form.Field
                name="password"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <div className="flex flex-wrap justify-between">
                        <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                        <a
                          href="#"
                          className="text-sm underline-offset-4 hover:underline"
                        >
                          Forgot your password?
                        </a>
                      </div>
                      <div className="relative">
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          className="pr-16"
                          placeholder="Enter your password"
                          required
                          type={isPasswordVisible ? "text" : "password"}
                        />
                        <PasswordVisibilityToggle
                          isVisible={isPasswordVisible}
                          onToggle={() => setIsPasswordVisible((prev) => !prev)}
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
                <Button type="submit" form="login-form" disabled={isPending}>
                  Login
                </Button>
                {isDeactivated && (
                  <p
                    role="alert"
                    className="text-center text-sm font-medium text-primary-700"
                  >
                    {ACCOUNT_DEACTIVATED_MESSAGE}
                  </p>
                )}
                <FieldDescription className="text-center text-primary-500">
                  Don&apos;t have an account?{" "}
                  <Link to={paths.auth.signup.path}>Sign up</Link>
                </FieldDescription>
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
      <FieldDescription className="px-6 text-center">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </FieldDescription>
    </Container>
  );
}
