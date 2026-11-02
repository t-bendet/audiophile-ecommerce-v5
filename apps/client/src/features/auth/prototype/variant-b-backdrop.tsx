// PROTOTYPE variant B (#352): imagery behind a centred card. The XX99 Mark II
// featured shot fills the viewport under a dark gradient, the logo sits above a
// white card. The card keeps the shadcn title style and the black button; the
// orange is reserved for links. On a phone the card becomes a sheet pinned to
// the bottom over the same image.
import Logo from "@/assets/logo.svg?react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { FieldDescription, FieldGroup } from "@/components/ui/field";
import { ArrowLeft } from "lucide-react";
import { type ReactNode } from "react";
import { Link } from "react-router";
import { LandingStub, PasswordField, SubmitButton, TextField } from "./fields";
import { ERRORS, MEDIA, RESET_EXPIRY_COPY, SAMPLE_EMAIL } from "./copy";
import type { Page, VariantProps } from "./params";

const LINK = "font-medium text-primary-500 underline-offset-4 hover:underline";

const Head = ({
  title,
  description,
}: {
  title: ReactNode;
  description: ReactNode;
}) => (
  <CardHeader className="text-center">
    <CardTitle className="text-xl">{title}</CardTitle>
    <CardDescription>{description}</CardDescription>
  </CardHeader>
);

export function VariantB({ page, state, go }: VariantProps) {
  const pending = state === "pending";
  const error = state === "error";
  const jump = (next: Page) => (e: React.MouseEvent) => {
    e.preventDefault();
    go(next);
  };

  const login = (
    <>
      <Head title="Welcome back" description="Login with your account" />
      <CardContent>
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
          />
          <SubmitButton size="lg" pending={pending} pendingLabel="Signing in">
            Login
          </SubmitButton>
          <FieldDescription className="text-center">
            <a href="#" onClick={jump("forgot")} className={LINK}>
              Forgot your password?
            </a>
          </FieldDescription>
          <FieldDescription className="text-center">
            Don&apos;t have an account?{" "}
            <a href="#" onClick={jump("signup")} className={LINK}>
              Sign up
            </a>
          </FieldDescription>
        </FieldGroup>
      </CardContent>
    </>
  );

  const signup = (
    <>
      <Head
        title="Create your account"
        description="Enter your information to create your account"
      />
      <CardContent>
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
          />
          <PasswordField
            id="passwordConfirm"
            label="Confirm Password"
            autoComplete="new-password"
            error={error ? ERRORS.confirm : undefined}
          />
          <FieldDescription>Must be 8 to 20 characters long.</FieldDescription>
          <SubmitButton
            size="lg"
            pending={pending}
            pendingLabel="Creating account"
          >
            Create Account
          </SubmitButton>
          <FieldDescription className="text-center">
            Already have an account?{" "}
            <a href="#" onClick={jump("login")} className={LINK}>
              Login
            </a>
          </FieldDescription>
        </FieldGroup>
      </CardContent>
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
        <CardContent>
          <FieldGroup>
            <Button variant="outline" size="lg" asChild>
              <a href="#" onClick={jump("forgot")}>
                Send it again
              </a>
            </Button>
            <FieldDescription className="text-center">
              <a href="#" onClick={jump("login")} className={LINK}>
                Back to login
              </a>
            </FieldDescription>
          </FieldGroup>
        </CardContent>
      </>
    ) : (
      <>
        <Head
          title="Reset your password"
          description="Enter your email and we will send you a reset link"
        />
        <CardContent>
          <FieldGroup>
            <TextField
              id="email"
              label="Email"
              type="email"
              placeholder={SAMPLE_EMAIL}
              error={error ? ERRORS.email : undefined}
            />
            <SubmitButton size="lg" pending={pending} pendingLabel="Sending">
              Send reset link
            </SubmitButton>
            <FieldDescription className="text-center">
              <a href="#" onClick={jump("login")} className={LINK}>
                Back to login
              </a>
            </FieldDescription>
          </FieldGroup>
        </CardContent>
      </>
    );

  const reset =
    state === "invalid" ? (
      <>
        <Head
          title="This link is no longer valid"
          description={`Reset links work once and expire after ${RESET_EXPIRY_COPY}. Request a new one to continue.`}
        />
        <CardContent>
          <FieldGroup>
            <Button size="lg" asChild>
              <a href="#" onClick={jump("forgot")}>
                Request a new link
              </a>
            </Button>
            <FieldDescription className="text-center">
              <a href="#" onClick={jump("login")} className={LINK}>
                Back to login
              </a>
            </FieldDescription>
          </FieldGroup>
        </CardContent>
      </>
    ) : state === "success" ? (
      <CardContent className="pt-6">
        <LandingStub />
      </CardContent>
    ) : (
      <>
        <Head
          title="Choose a new password"
          description="It must be 8 to 20 characters long"
        />
        <CardContent>
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
              Save password
            </SubmitButton>
          </FieldGroup>
        </CardContent>
      </>
    );

  const content = { login, signup, forgot, reset }[page];

  return (
    <div className="relative min-h-svh bg-neutral-900 text-neutral-900">
      <img
        src={`${MEDIA}/products/xx99-mark-two-headphones/featured-desktop.jpg`}
        alt=""
        className="absolute inset-0 h-full w-full object-cover object-top"
      />
      <div
        aria-hidden
        className="absolute inset-0 bg-linear-to-b from-neutral-900/10 via-neutral-900/40 to-neutral-900"
      />
      <div className="relative flex min-h-svh flex-col items-center pt-10 sm:justify-center sm:px-6 sm:py-10">
        <Link to="/" className="mb-10 sm:mb-8">
          <Logo title="audiophile logo" />
        </Link>
        <Card className="mt-auto w-full max-w-md rounded-none rounded-t-3xl border-0 pt-2 sm:mt-0 sm:rounded-xl">
          {content}
        </Card>
        <Button
          variant="link"
          asChild
          className="mt-6 gap-2 px-0 text-neutral-100 opacity-70 max-sm:hidden"
        >
          <Link to="/">
            <ArrowLeft className="size-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  );
}
