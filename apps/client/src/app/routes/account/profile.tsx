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
import { getApi } from "@/lib/api-client";
import { getUserQueryOptions, USER_QUERY_KEY } from "@/lib/auth";
import { normalizeError } from "@/lib/errors/errors";
import { applyServerErrors } from "@/lib/errors/form-errors";
import { UserDTOResponseSchema, UserUpdateMeRequestSchema } from "@repo/domain";
import { useForm } from "@tanstack/react-form";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import { toast } from "sonner";

const joined = new Intl.DateTimeFormat("en-US", { dateStyle: "long" });

export default function ProfilePage() {
  const { data: user } = useSuspenseQuery(getUserQueryOptions());
  const queryClient = useQueryClient();
  const { mutate, isPending } = useMutation({
    mutationFn: async (body: { name?: string; email?: string }) => {
      const response = await getApi().patch("/users/updateMe", body);
      return UserDTOResponseSchema.parse(response.data);
    },
    onSuccess: (response) => {
      queryClient.setQueryData([USER_QUERY_KEY], response);
      form.reset({ name: response.data.name, email: response.data.email });
      toast.success("Profile updated");
    },
    onError: (error) => {
      const message = applyServerErrors(form, normalizeError(error));
      if (message)
        toast.error("Profile update failed", { description: message });
    },
  });
  const form = useForm({
    defaultValues: { name: user.name, email: user.email },
    validators: { onSubmit: UserUpdateMeRequestSchema.shape.body.required() },
    onSubmit: ({ value }) => {
      const changes = {
        ...(value.name !== user.name && { name: value.name }),
        ...(value.email !== user.email && { email: value.email }),
      };
      if (Object.keys(changes).length) mutate(changes);
    },
  });

  return (
    <section aria-label="Profile" className="max-w-md">
      <Metadata title="Your Profile" noIndex />
      <h2 className="text-xl font-bold tracking-200 uppercase">Profile</h2>
      <p className="mt-1 text-sm text-neutral-500">
        Member since {joined.format(user.createdAt)}
      </p>
      <form
        className="mt-6"
        onSubmit={(event) => {
          event.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup>
          {(["name", "email"] as const).map((name) => (
            <form.Field
              key={name}
              name={name}
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={name} className={authLabelClass}>
                      {name === "name" ? "Name" : "Email"}
                    </FieldLabel>
                    <Input
                      id={name}
                      name={name}
                      type={name === "email" ? "email" : "text"}
                      autoComplete={name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={isInvalid}
                      aria-describedby={
                        name === "email" ? "email-hint" : undefined
                      }
                      className={authInputClass}
                      required
                    />
                    {name === "email" && (
                      <p id="email-hint" className="text-sm text-neutral-500">
                        You sign in with this email. Order emails go to the
                        address on each order.
                      </p>
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
              <Spinner size="sm" variant="light" /> Saving
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </form>
    </section>
  );
}
