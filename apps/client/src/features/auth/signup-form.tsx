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
import { useToast } from "@/hooks/use-toast";
import { USER_QUERY_KEY, useSignup } from "@/lib/auth";
import { cn } from "@/lib/cn";
import { normalizeError } from "@/lib/errors/errors";
import { AuthSignUpRequestSchema } from "@repo/domain";
import { useForm } from "@tanstack/react-form";
import { useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate, useSearchParams } from "react-router";

// TODO add password strength meter
// TODO add show/hide password toggle
// TODO add password confirmation match error message

export function SignupForm({ className }: React.ComponentProps<"div">) {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

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
      onChange: AuthSignUpRequestSchema.shape.body,
    },
    onSubmit: async ({ value }) => {
      signup(value, {
        onSuccess: async () => {
          // Check for redirectTo param (from protected route redirect)
          const redirectTo = searchParams.get("redirectTo");
          redirectTo
            ? navigate(redirectTo)
            : navigate(paths.account.root.getHref());
        },
        async onError(error) {
          const normalizedError = normalizeError(error);
          toast({
            title: "Signup Failed",
            description: normalizedError.message,
            variant: "destructive",
            duration: 3000,
          });
          await queryClient.setQueryData([USER_QUERY_KEY], null);
        },
      });
    },
  });

  return (
    <Container classes={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader className="text-center">
          <CardTitle className="text-xl">Create your account</CardTitle>
          <CardDescription>
            Enter your information to create your account
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                      <FieldLabel htmlFor={field.name}>Full Name</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        type="text"
                        placeholder="John Doe"
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
                        type="email"
                        placeholder="m@example.com"
                        required
                      />
                      {isInvalid && (
                        <FieldError errors={field.state.meta.errors} />
                      )}
                    </Field>
                  );
                }}
              />

              <Field className="grid grid-cols-2 gap-4">
                <form.Field
                  name="password"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field
                        data-invalid={isInvalid}
                        className="justify-between"
                      >
                        <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          type="password"
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
                  name="passwordConfirm"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>
                          Confirm Password
                        </FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          type="password"
                          required
                        />
                        {isInvalid && (
                          <FieldError errors={field.state.meta.errors} />
                        )}
                      </Field>
                    );
                  }}
                />
              </Field>

              <FieldDescription>
                Must be at least 8 characters long.
              </FieldDescription>

              <Field>
                <Button type="submit" form="signup-form" disabled={isPending}>
                  Create Account
                </Button>
                <FieldDescription className="text-primary-500 text-center">
                  Already have an account?{" "}
                  <Link to={paths.auth.login.path}>Login</Link>
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
