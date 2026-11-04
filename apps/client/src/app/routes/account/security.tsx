import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { getUserQueryOptions, markSignedOut, USER_QUERY_KEY } from "@/lib/auth";
import { clearGuestCart } from "@/lib/cart-storage";
import cartKeys from "@/features/cart/api/cart-keys";
import { UserDeleteMeRequestSchema } from "@repo/domain";
import { useQueryClient, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router";
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
    <div className="max-w-md">
      <section aria-label="Change password">
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
      <DeactivateAccount />
    </div>
  );
}

const deactivationDescription =
  "Deactivating signs you out everywhere and closes your account to sign-in. Your orders stay on record. Contact us if you want it reactivated.";

function DeactivateAccount() {
  const { data: user } = useSuspenseQuery(getUserQueryOptions());
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { mutate, isPending } = useMutation({
    mutationFn: async (body: { password: string }) =>
      getApi().delete("/users/deleteMe", { data: body }),
    onSuccess: () => {
      markSignedOut(queryClient);
      clearGuestCart();
      queryClient.removeQueries({ queryKey: [USER_QUERY_KEY] });
      queryClient.invalidateQueries({
        queryKey: cartKeys.all,
        refetchType: "none",
      });
      navigate("/", { replace: true });
      toast.success("Account deactivated", {
        description: "You have been signed out. Contact us to reactivate.",
      });
    },
    onError: (error) => {
      const message = applyServerErrors(form, normalizeError(error));
      if (!message) document.getElementById("deactivation-password")?.focus();
      if (message)
        toast.error("Account not deactivated", { description: message });
    },
  });
  const form = useForm({
    defaultValues: { password: "" },
    validators: { onSubmit: UserDeleteMeRequestSchema.shape.body },
    onSubmit: ({ value }) => mutate(value),
  });
  return (
    <section
      className="mt-10 rounded-lg border border-primary-700/30 p-6"
      aria-label="Deactivate account"
    >
      <h2 className="text-xs font-bold tracking-600 text-primary-700 uppercase">
        Deactivate account
      </h2>
      <p className="mt-3 text-sm text-neutral-500">{deactivationDescription}</p>
      <Dialog
        onOpenChange={(open) => {
          if (!open) form.reset();
        }}
      >
        <DialogTrigger asChild>
          <Button
            className="mt-6"
            variant="outline"
            disabled={user.soleActiveAdmin}
            aria-describedby={
              user.soleActiveAdmin ? "sole-admin-notice" : undefined
            }
          >
            Deactivate account
          </Button>
        </DialogTrigger>
        {user.soleActiveAdmin && (
          <p id="sole-admin-notice" className="mt-3 text-sm text-neutral-500">
            You are the only active admin. Make another user an admin from the
            dashboard before deactivating this account.
          </p>
        )}
        <DialogContent
          placement="centred"
          title="Deactivate your account?"
          description={deactivationDescription}
          closeButton
          className="space-y-4 p-6"
        >
          <form
            onSubmit={(event) => {
              event.preventDefault();
              form.handleSubmit();
            }}
          >
            <form.Field
              name="password"
              children={(field) => {
                const invalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={invalid}>
                    <FieldLabel
                      htmlFor="deactivation-password"
                      className={authLabelClass}
                    >
                      Your password
                    </FieldLabel>
                    <Input
                      id="deactivation-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={invalid}
                      className={authInputClass}
                      required
                    />
                    {invalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            />
            <DialogFooter className="mt-6">
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Keep my account
                </Button>
              </DialogClose>
              <Button type="submit" variant="destructive" disabled={isPending}>
                Deactivate
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
