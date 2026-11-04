import { Metadata } from "@/components/seo/metadata";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { paths } from "@/config/paths";
import {
  authInputClass,
  authLabelClass,
} from "@/features/auth/components/auth-styles";
import { PasswordStrengthMeter } from "@/features/auth/components/password-strength-meter";
import { QueryClient } from "@tanstack/react-query";
import { useId, useState } from "react";
import { LoaderFunctionArgs, useNavigate } from "react-router";
import { toast } from "sonner";
import { panelTitle, sectionTitle } from "./shell";
import { useProto } from "./store";

// Two security pages. Nothing here calls PATCH /auth/updateMyPassword or
// DELETE /users/deleteMe; the saves are stubs that only show the outcome.

const SESSIONS_COPY =
  "Changing your password signs you out of every other device. This one stays signed in.";

const DEACTIVATE_COPY =
  "Deactivating signs you out everywhere and closes your account to sign-in. Your orders stay on record. Contact us if you want it reactivated.";

const SOLE_ADMIN_COPY =
  "You are the only active admin. Make another user an admin from the dashboard before deactivating this account.";

function PasswordFields({ idPrefix }: { idPrefix: string }) {
  const [password, setPassword] = useState("");
  return (
    <FieldGroup>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-current`} className={authLabelClass}>
          Current password
        </FieldLabel>
        <Input
          id={`${idPrefix}-current`}
          name="passwordCurrent"
          type="password"
          autoComplete="current-password"
          className={authInputClass}
          required
        />
      </Field>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-new`} className={authLabelClass}>
          New password
        </FieldLabel>
        <Input
          id={`${idPrefix}-new`}
          name="password"
          type="password"
          autoComplete="new-password"
          aria-describedby={`${idPrefix}-hint`}
          className={authInputClass}
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
        />
        <PasswordStrengthMeter password={password} />
        <p id={`${idPrefix}-hint`} className="text-sm text-neutral-500">
          Between 8 and 20 characters.
        </p>
      </Field>
      <Field>
        <FieldLabel htmlFor={`${idPrefix}-confirm`} className={authLabelClass}>
          Confirm new password
        </FieldLabel>
        <Input
          id={`${idPrefix}-confirm`}
          name="passwordConfirm"
          type="password"
          autoComplete="new-password"
          className={authInputClass}
          required
        />
      </Field>
    </FieldGroup>
  );
}

const passwordUpdated = () =>
  toast.success("Password updated", {
    description: "Every other device has been signed out.",
  });

function useDeactivate() {
  const navigate = useNavigate();
  return () => {
    void navigate(paths.home.getHref(), { replace: true });
    toast.success("Account deactivated", {
      description: "You have been signed out. Contact us to reactivate.",
    });
  };
}

function SoleAdminNotice({ children }: { children: React.ReactNode }) {
  const reasonId = useId();
  return (
    <>
      <Button variant="outline" className="w-fit" disabled aria-describedby={reasonId}>
        {children}
      </Button>
      <p id={reasonId} className="text-sm text-neutral-500">
        {SOLE_ADMIN_COPY}
      </p>
    </>
  );
}

function DeactivateWithPassword() {
  const [open, setOpen] = useState(false);
  const deactivate = useDeactivate();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-fit">
          Deactivate account
        </Button>
      </DialogTrigger>
      <DialogContent
        placement="centred"
        closeButton
        title={<span className="text-lg leading-none font-semibold">Deactivate your account?</span>}
        description={<span className="text-sm text-neutral-500">{DEACTIVATE_COPY}</span>}
        className="grid gap-6 p-6"
      >
        <form
          id="deactivate-form"
          onSubmit={(event) => {
            event.preventDefault();
            setOpen(false);
            deactivate();
          }}
        >
          <Field>
            <FieldLabel htmlFor="deactivate-password" className={authLabelClass}>
              Your password
            </FieldLabel>
            <Input
              id="deactivate-password"
              type="password"
              autoComplete="current-password"
              className={authInputClass}
              required
            />
          </Field>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep my account</Button>
          </DialogClose>
          <Button type="submit" form="deactivate-form" variant="destructive">
            Deactivate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DeactivateWithTypedWord() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const deactivate = useDeactivate();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-fit">
          Deactivate account
        </Button>
      </DialogTrigger>
      <DialogContent
        placement="centred"
        closeButton
        title={<span className="text-lg leading-none font-semibold">Deactivate your account?</span>}
        description={<span className="text-sm text-neutral-500">{DEACTIVATE_COPY}</span>}
        className="grid gap-6 p-6"
      >
        <Field>
          <FieldLabel htmlFor="deactivate-word" className={authLabelClass}>
            Type DEACTIVATE to confirm
          </FieldLabel>
          <Input
            id="deactivate-word"
            value={typed}
            onChange={(event) => setTyped(event.target.value)}
            className={authInputClass}
            autoComplete="off"
          />
        </Field>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Keep my account</Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={typed !== "DEACTIVATE"}
            onClick={() => {
              setOpen(false);
              deactivate();
            }}
          >
            Deactivate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SecurityA({ soleAdmin }: { soleAdmin: boolean }) {
  return (
    <div className="flex flex-col gap-10">
      <section aria-label="Change password" className="max-w-md">
        <h2 className={sectionTitle}>Change password</h2>
        <p className="mt-1 text-sm text-neutral-500">{SESSIONS_COPY}</p>
        <form
          className="mt-6"
          onSubmit={(event) => {
            event.preventDefault();
            event.currentTarget.reset();
            passwordUpdated();
          }}
        >
          <PasswordFields idPrefix="security" />
          <Button type="submit" variant="accent" className="mt-6">
            Update password
          </Button>
        </form>
      </section>
      <section aria-label="Deactivate account" className="flex max-w-md flex-col gap-4 rounded-lg border border-primary-700/30 p-6">
        <h2 className="text-xs font-bold tracking-600 text-primary-700 uppercase">
          Deactivate account
        </h2>
        <p className="text-sm text-neutral-500">{DEACTIVATE_COPY}</p>
        {soleAdmin ? (
          <SoleAdminNotice>Deactivate account</SoleAdminNotice>
        ) : (
          <DeactivateWithPassword />
        )}
      </section>
    </div>
  );
}

function ChangePasswordDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-fit">
          Change password
        </Button>
      </DialogTrigger>
      <DialogContent
        placement="centred"
        closeButton
        title={<span className="text-lg leading-none font-semibold">Change your password</span>}
        description={<span className="text-sm text-neutral-500">{SESSIONS_COPY}</span>}
        className="grid gap-6 p-6"
      >
        <form
          id="change-password"
          onSubmit={(event) => {
            event.preventDefault();
            setOpen(false);
            passwordUpdated();
          }}
        >
          <PasswordFields idPrefix="dialog" />
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button type="submit" form="change-password" variant="accent">
            Update password
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SecurityB({ soleAdmin }: { soleAdmin: boolean }) {
  return (
    <div className="flex flex-col gap-6">
      <h2 className={sectionTitle}>Security</h2>
      <div className="grid gap-6 md:grid-cols-2">
        <section aria-label="Password" className="flex flex-col gap-4 rounded-lg bg-neutral-200 p-6">
          <h3 className={panelTitle}>Password</h3>
          <p className="text-sm">
            Use a password you have not used on this site before.
          </p>
          <p className="text-sm text-neutral-500">{SESSIONS_COPY}</p>
          <ChangePasswordDialog />
        </section>
        <section aria-label="Account" className="flex flex-col gap-4 rounded-lg bg-neutral-200 p-6">
          <h3 className={panelTitle}>Account</h3>
          <p className="text-sm text-neutral-500">{DEACTIVATE_COPY}</p>
          {soleAdmin ? (
            <SoleAdminNotice>Deactivate account</SoleAdminNotice>
          ) : (
            <DeactivateWithTypedWord />
          )}
        </section>
      </div>
    </div>
  );
}

const SECURITIES = { A: SecurityA, B: SecurityB } as const;

export default function PrototypeSecurityPage() {
  const { security, role } = useProto();
  const Security = SECURITIES[security];
  return (
    <>
      <Metadata title="Security" noIndex />
      <Security soleAdmin={role === "sole-admin"} />
    </>
  );
}

export const clientLoader =
  (_queryClient: QueryClient) => async (_context: LoaderFunctionArgs) => null;
