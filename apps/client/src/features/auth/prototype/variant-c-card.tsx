// PROTOTYPE variant C (#352): card only, no imagery. The storefront's light grey
// page with a slim header holding the dark logo and Back to Home, a white panel
// for the form, black button, neutral links. The least brand of the three. On a
// phone the panel runs edge to edge and loses its border.
import Logo from "@/assets/logo.svg?react";
import { Button } from "@/components/ui/button";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { ArrowLeft } from "lucide-react";
import { type ReactNode } from "react";
import { Link } from "react-router";
import { LandingStub, PasswordField, SubmitButton, TextField } from "./fields";
import { ERRORS, RESET_EXPIRY_COPY, SAMPLE_EMAIL } from "./copy";
import type { Page, VariantProps } from "./params";

const LINK = "font-medium text-neutral-900 underline underline-offset-4";

const Head = ({
  title,
  description,
}: {
  title: ReactNode;
  description?: ReactNode;
}) => (
  <header className="mb-8">
    <h1 className="text-xl font-bold">{title}</h1>
    {description && <p className="mt-2 text-sm opacity-60">{description}</p>}
  </header>
);

export function VariantC({ page, state, go }: VariantProps) {
  const pending = state === "pending";
  const error = state === "error";
  const jump = (next: Page) => (e: React.MouseEvent) => {
    e.preventDefault();
    go(next);
  };

  const login = (
    <>
      <Head title="Log in" />
      <FieldGroup>
        <TextField
          id="email"
          label="Email"
          type="email"
          placeholder={SAMPLE_EMAIL}
          error={error ? ERRORS.email : undefined}
        />
        <PasswordField
          id="password"
          label="Password"
          autoComplete="current-password"
          below={
            <p className="text-right text-xs">
              <a href="#" onClick={jump("forgot")} className={LINK}>
                Forgot your password?
              </a>
            </p>
          }
        />
        <SubmitButton size="lg" pending={pending} pendingLabel="Signing in">
          Log in
        </SubmitButton>
      </FieldGroup>
      <p className="mt-8 border-t border-neutral-200 pt-6 text-center text-sm">
        New here?{" "}
        <a href="#" onClick={jump("signup")} className={LINK}>
          Create an account
        </a>
      </p>
    </>
  );

  const signup = (
    <>
      <Head title="Create an account" />
      <FieldGroup>
        <TextField
          id="name"
          label="Full Name"
          placeholder="John Doe"
          error={error ? ERRORS.name : undefined}
        />
        <TextField
          id="email"
          label="Email"
          type="email"
          placeholder={SAMPLE_EMAIL}
          error={error ? ERRORS.email : undefined}
        />
        <PasswordField
          id="password"
          label="Password"
          withMeter
          autoComplete="new-password"
          error={error ? ERRORS.password : undefined}
          below={<p className="text-xs opacity-60">8 to 20 characters.</p>}
        />
        <PasswordField
          id="passwordConfirm"
          label="Confirm Password"
          autoComplete="new-password"
          error={error ? ERRORS.confirm : undefined}
        />
        <SubmitButton
          size="lg"
          pending={pending}
          pendingLabel="Creating account"
        >
          Create Account
        </SubmitButton>
      </FieldGroup>
      <p className="mt-8 border-t border-neutral-200 pt-6 text-center text-sm">
        Already have an account?{" "}
        <a href="#" onClick={jump("login")} className={LINK}>
          Log in
        </a>
      </p>
    </>
  );

  const forgot =
    state === "sent" ? (
      <>
        <Head
          title="Check your inbox"
          description={
            <>
              If an account exists for <strong>{SAMPLE_EMAIL}</strong>, we sent
              it a link to reset the password. It works once and expires in{" "}
              {RESET_EXPIRY_COPY}.
            </>
          }
        />
        <p className="text-sm opacity-60">
          Nothing there? Check your spam folder or{" "}
          <a href="#" onClick={jump("forgot")} className={LINK}>
            try again
          </a>
          .
        </p>
        <p className="mt-8 border-t border-neutral-200 pt-6 text-center text-sm">
          <a href="#" onClick={jump("login")} className={LINK}>
            Back to log in
          </a>
        </p>
      </>
    ) : (
      <>
        <Head
          title="Forgot your password?"
          description="We will email you a link to set a new one."
        />
        <FieldGroup>
          <TextField
            id="email"
            label="Email"
            type="email"
            placeholder={SAMPLE_EMAIL}
            error={error ? ERRORS.email : undefined}
          />
          <SubmitButton size="lg" pending={pending} pendingLabel="Sending">
            Email me a link
          </SubmitButton>
        </FieldGroup>
        <p className="mt-8 border-t border-neutral-200 pt-6 text-center text-sm">
          <a href="#" onClick={jump("login")} className={LINK}>
            Back to log in
          </a>
        </p>
      </>
    );

  const reset =
    state === "invalid" ? (
      <>
        <Head
          title="That link has expired"
          description={`Reset links work once and expire after ${RESET_EXPIRY_COPY}.`}
        />
        <Button size="lg" asChild>
          <a href="#" onClick={jump("forgot")}>
            Request a new link
          </a>
        </Button>
        <p className="mt-8 border-t border-neutral-200 pt-6 text-center text-sm">
          <a href="#" onClick={jump("login")} className={LINK}>
            Back to log in
          </a>
        </p>
      </>
    ) : state === "success" ? (
      <LandingStub />
    ) : (
      <>
        <Head
          title="Set a new password"
          description="8 to 20 characters, entered twice."
        />
        <FieldGroup>
          <PasswordField
            id="password"
            label="New password"
            withMeter
            autoComplete="new-password"
            error={error ? ERRORS.password : undefined}
          />
          <PasswordField
            id="passwordConfirm"
            label="Confirm new password"
            autoComplete="new-password"
            error={error ? ERRORS.confirm : undefined}
          />
          <SubmitButton
            size="lg"
            pending={pending}
            pendingLabel="Saving"
            onClick={() => go("reset", "success")}
          >
            Save and log in
          </SubmitButton>
        </FieldGroup>
      </>
    );

  const content = { login, signup, forgot, reset }[page];

  return (
    <div className="flex min-h-svh flex-col bg-neutral-200 text-neutral-900">
      <header className="flex h-18 items-center justify-between px-6 md:px-10">
        <Link to="/" className="[&_path]:fill-neutral-900">
          <Logo title="audiophile logo" />
        </Link>
        <Button variant="link" asChild className="gap-2 px-0">
          <Link to="/">
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
        </Button>
      </header>
      <main className="flex flex-1 flex-col items-center pt-4 pb-16 sm:px-6 md:pt-16">
        <div className="w-full max-w-md bg-white p-6 sm:rounded-xl sm:border sm:border-neutral-400/40 md:p-10">
          {content}
        </div>
        <FieldDescription className="mt-6 max-w-md px-6 text-center">
          By clicking continue, you agree to our{" "}
          <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
        </FieldDescription>
      </main>
    </div>
  );
}
