import { Metadata } from "@/components/seo/metadata";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import {
  authInputClass,
  authLabelClass,
} from "@/features/auth/components/auth-styles";
import { PasswordStrengthMeter } from "@/features/auth/components/password-strength-meter";
import { getApi } from "@/lib/api-client";
import { normalizeError } from "@/lib/errors/errors";
import { applyServerErrors } from "@/lib/errors/form-errors";
import {
  AuthUpdatePasswordRequestSchema,
  UserDTOResponseSchema,
  type AuthUpdateUserPasswordRequest,
} from "@repo/domain";
import { useForm } from "@tanstack/react-form";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";

export default function SecurityPage() {
  const { mutate, isPending } = useMutation({
    mutationFn: async (body: AuthUpdateUserPasswordRequest) => {
      const response = await getApi().patch("/auth/updateMyPassword", body);
      return UserDTOResponseSchema.parse(response.data);
    },
    onSuccess: () => {
      form.reset();
      toast.success("Password updated", {
        description: "Every other device has been signed out.",
      });
    },
    onError: (error) => {
      const message = applyServerErrors(form, normalizeError(error));
      if (message)
        toast.error("Password update failed", { description: message });
    },
  });
  const form = useForm({
    defaultValues: { currentPassword: "", password: "", passwordConfirm: "" },
    validators: { onSubmit: AuthUpdatePasswordRequestSchema.shape.body },
    onSubmit: ({ value }) => mutate(value),
  });

  return (
    <section aria-label="Change password" className="max-w-md">
      <Metadata title="Security" noIndex />
      <h2 className="text-xl font-bold tracking-200 uppercase">
        Change password
      </h2>
      <p className="mt-1 text-sm text-neutral-500">
        Changing your password signs you out of every other device. This one
        stays signed in.
      </p>
      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          {(
            [
              ["currentPassword", "Current password"],
              ["password", "New password"],
              ["passwordConfirm", "Confirm new password"],
            ] as const
          ).map(([name, label]) => (
            <form.Field
              key={name}
              name={name}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={name} className={authLabelClass}>
                      {label}
                    </FieldLabel>
                    <Input
                      id={name}
                      name={name}
                      type="password"
                      autoComplete={
                        name === "currentPassword"
                          ? "current-password"
                          : "new-password"
                      }
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={isInvalid}
                      aria-describedby={
                        name === "password" ? "password-hint" : undefined
                      }
                      className={authInputClass}
                      required
                    />
                    {name === "password" && (
                      <>
                        <PasswordStrengthMeter password={field.state.value} />
                        <p
                          id="password-hint"
                          className="text-sm text-neutral-500"
                        >
                          Between 8 and 20 characters.
                        </p>
                      </>
                    )}
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          ))}
        </FieldGroup>
        <Button
          type="submit"
          variant="accent"
          className="mt-6"
          disabled={isPending}
        >
          {isPending ? (
            <>
              <Spinner size="sm" variant="light" /> Updating
            </>
          ) : (
            "Update password"
          )}
        </Button>
      </form>
    </section>
  );
}
