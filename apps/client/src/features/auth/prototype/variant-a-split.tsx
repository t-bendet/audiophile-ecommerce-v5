// PROTOTYPE variant A (#352): split pane. A dark brand pane with the logo, the
// showcase speaker and the tagline on the left; the form on white, left-aligned,
// with the storefront's uppercase headings and the orange accent button. On a
// phone the pane collapses to a logo band and the form fills the width, no card.
import Logo from "@/assets/logo.svg?react";
import PatternCircles from "@/assets/pattern-circles.svg?react";
import { Button } from "@/components/ui/button";
import { FieldGroup } from "@/components/ui/field";
import { ArrowLeft, MailCheck, TimerOff } from "lucide-react";
import { type ReactNode } from "react";
import { Link } from "react-router";
import { LandingStub, PasswordField, SubmitButton, TextField } from "./fields";
import { ERRORS, MEDIA, RESET_EXPIRY_COPY, SAMPLE_EMAIL } from "./copy";
import type { Page, VariantProps } from "./params";

const INPUT = "h-12 rounded-none border-neutral-400 px-5 text-base";
const LABEL = "text-xs font-bold tracking-600 uppercase";
const ORANGE_LINK =
  "text-sm font-bold text-primary-500 underline-offset-4 hover:underline";

const Overline = ({ children }: { children: ReactNode }) => (
  <p className="mb-3 text-xs font-bold tracking-600 text-primary-500 uppercase">
    {children}
  </p>
);
const Title = ({ children }: { children: ReactNode }) => (
  <h1 className="mb-4 text-2xl font-bold tracking-300 uppercase md:text-3xl">
    {children}
  </h1>
);
const Lead = ({ children }: { children: ReactNode }) => (
  <p className="mb-10 opacity-50">{children}</p>
);

export function VariantA({ page, state, go }: VariantProps) {
  const pending = state === "pending";
  const error = state === "error";
  const jump = (next: Page) => (e: React.MouseEvent) => {
    e.preventDefault();
    go(next);
  };

  const login = (
    <>
      <Overline>Account</Overline>
      <Title>Welcome back</Title>
      <Lead>Sign in to see your orders and check out faster.</Lead>
      <FieldGroup>
        <TextField
          id="email"
          label="Email"
          type="email"
          placeholder={SAMPLE_EMAIL}
          labelClassName={LABEL}
          inputClassName={INPUT}
          error={error ? ERRORS.email : undefined}
        />
        <PasswordField
          id="password"
          label="Password"
          labelClassName={LABEL}
          inputClassName={INPUT}
          labelExtra={
            <a href="#" onClick={jump("forgot")} className={ORANGE_LINK}>
              Forgot your password?
            </a>
          }
        />
        <SubmitButton
          variant="accent"
          size="lg"
          pending={pending}
          pendingLabel="Signing in"
        >
          Login
        </SubmitButton>
      </FieldGroup>
      <p className="mt-8 text-sm opacity-70">
        Don&apos;t have an account?{" "}
        <a href="#" onClick={jump("signup")} className={ORANGE_LINK}>
          Sign up
        </a>
      </p>
    </>
  );

  const signup = (
    <>
      <Overline>Account</Overline>
      <Title>Create your account</Title>
      <Lead>Your orders, addresses and receipts in one place.</Lead>
      <FieldGroup>
        <TextField
          id="name"
          label="Full name"
          placeholder="John Doe"
          labelClassName={LABEL}
          inputClassName={INPUT}
          error={error ? ERRORS.name : undefined}
        />
        <TextField
          id="email"
          label="Email"
          type="email"
          placeholder={SAMPLE_EMAIL}
          labelClassName={LABEL}
          inputClassName={INPUT}
          error={error ? ERRORS.email : undefined}
        />
        <PasswordField
          id="password"
          label="Password"
          labelClassName={LABEL}
          inputClassName={INPUT}
          withMeter
          error={error ? ERRORS.password : undefined}
          below={
            <p className="text-xs opacity-50">Between 8 and 20 characters.</p>
          }
        />
        <PasswordField
          id="passwordConfirm"
          label="Confirm password"
          labelClassName={LABEL}
          inputClassName={INPUT}
          error={error ? ERRORS.confirm : undefined}
        />
        <SubmitButton
          variant="accent"
          size="lg"
          pending={pending}
          pendingLabel="Creating account"
        >
          Create account
        </SubmitButton>
      </FieldGroup>
      <p className="mt-8 text-sm opacity-70">
        Already have an account?{" "}
        <a href="#" onClick={jump("login")} className={ORANGE_LINK}>
          Login
        </a>
      </p>
    </>
  );

  const forgot =
    state === "sent" ? (
      <>
        <span className="mb-6 flex size-14 items-center justify-center rounded-full bg-primary-500 text-neutral-100">
          <MailCheck className="size-7" />
        </span>
        <Overline>Account recovery</Overline>
        <Title>Check your inbox</Title>
        <p className="mb-3 opacity-50">
          If an account exists for <strong>{SAMPLE_EMAIL}</strong>, we have sent
          it a link to reset the password. The link works once and expires in{" "}
          {RESET_EXPIRY_COPY}.
        </p>
        <p className="mb-10 opacity-50">
          Nothing there? Check your spam folder, or{" "}
          <a href="#" onClick={jump("forgot")} className={ORANGE_LINK}>
            try another email
          </a>
          .
        </p>
        <Button variant="outline" size="lg" asChild>
          <a href="#" onClick={jump("login")}>
            Back to login
          </a>
        </Button>
      </>
    ) : (
      <>
        <Overline>Account recovery</Overline>
        <Title>Forgot your password?</Title>
        <Lead>
          Enter the email you signed up with and we will send you a link to set
          a new one.
        </Lead>
        <FieldGroup>
          <TextField
            id="email"
            label="Email"
            type="email"
            placeholder={SAMPLE_EMAIL}
            labelClassName={LABEL}
            inputClassName={INPUT}
            error={error ? ERRORS.email : undefined}
          />
          <SubmitButton
            variant="accent"
            size="lg"
            pending={pending}
            pendingLabel="Sending"
          >
            Send reset link
          </SubmitButton>
        </FieldGroup>
        <p className="mt-8 text-sm opacity-70">
          Remembered it?{" "}
          <a href="#" onClick={jump("login")} className={ORANGE_LINK}>
            Back to login
          </a>
        </p>
      </>
    );

  const reset =
    state === "invalid" ? (
      <>
        <span className="mb-6 flex size-14 items-center justify-center rounded-full bg-neutral-900 text-neutral-100">
          <TimerOff className="size-7" />
        </span>
        <Overline>Account recovery</Overline>
        <Title>This link has expired</Title>
        <Lead>
          Reset links work once and expire after {RESET_EXPIRY_COPY}. Request a
          new one and we will email it to you.
        </Lead>
        <Button variant="accent" size="lg" asChild>
          <a href="#" onClick={jump("forgot")}>
            Request a new link
          </a>
        </Button>
        <p className="mt-8 text-sm opacity-70">
          <a href="#" onClick={jump("login")} className={ORANGE_LINK}>
            Back to login
          </a>
        </p>
      </>
    ) : state === "success" ? (
      <LandingStub />
    ) : (
      <>
        <Overline>Account recovery</Overline>
        <Title>Set a new password</Title>
        <Lead>Choose a password you have not used on this site before.</Lead>
        <FieldGroup>
          <PasswordField
            id="password"
            label="New password"
            labelClassName={LABEL}
            inputClassName={INPUT}
            withMeter
            autoComplete="new-password"
            error={error ? ERRORS.password : undefined}
            below={
              <p className="text-xs opacity-50">Between 8 and 20 characters.</p>
            }
          />
          <PasswordField
            id="passwordConfirm"
            label="Confirm new password"
            labelClassName={LABEL}
            inputClassName={INPUT}
            autoComplete="new-password"
            error={error ? ERRORS.confirm : undefined}
          />
          <SubmitButton
            variant="accent"
            size="lg"
            pending={pending}
            pendingLabel="Saving"
            onClick={() => go("reset", "success")}
          >
            Save new password
          </SubmitButton>
        </FieldGroup>
      </>
    );

  const content = { login, signup, forgot, reset }[page];

  return (
    <div className="grid min-h-svh grid-rows-[auto_1fr] bg-white text-neutral-900 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:grid-rows-1">
      <aside className="relative flex h-18 items-center justify-between overflow-hidden bg-neutral-900 px-6 text-neutral-100 lg:h-auto lg:flex-col lg:items-start lg:p-12">
        <Link to="/" className="relative z-10">
          <Logo title="audiophile logo" />
        </Link>
        <Link
          to="/"
          className="relative z-10 flex items-center gap-2 text-xs font-bold tracking-600 uppercase opacity-60 hover:opacity-100 lg:hidden"
        >
          <ArrowLeft className="size-4" />
          Home
        </Link>
        <div className="relative hidden w-full flex-1 items-center justify-center lg:flex">
          <PatternCircles
            aria-hidden
            viewBox="0 0 944 944"
            className="pointer-events-none absolute top-1/2 left-1/2 h-auto max-h-none w-[160%] max-w-none -translate-1/2 opacity-40"
          />
          <img
            src={`${MEDIA}/products/zx9-speaker/showcase-desktop.png`}
            alt=""
            width={410}
            height={493}
            className="relative max-h-[60vh] w-auto"
          />
        </div>
        <p className="relative z-10 hidden text-2xl font-bold tracking-300 uppercase lg:block">
          Bringing you the <span className="text-primary-500">best</span> audio
          gear
        </p>
      </aside>
      <main className="flex flex-col px-6 py-10 md:px-10 lg:px-20 lg:py-12">
        <div className="hidden justify-end lg:flex">
          <Button variant="link" asChild className="gap-2 px-0">
            <Link to="/">
              <ArrowLeft className="size-4" />
              Back to Home
            </Link>
          </Button>
        </div>
        <div className="w-full max-w-md py-6 lg:my-auto lg:py-10">
          {content}
        </div>
      </main>
    </div>
  );
}
