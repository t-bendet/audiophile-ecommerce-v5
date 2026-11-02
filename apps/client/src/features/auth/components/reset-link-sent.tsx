import { Button } from "@/components/ui/button";
import { paths } from "@/config/paths";
import { PASSWORD_RESET_EXPIRY_LABEL } from "@repo/domain";
import { MailCheck } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router";

type ResetLinkSentProps = {
  email: string;
  onTryAnotherEmail: () => void;
};

/** Worded the same whether or not the email has an account, so the page never says which. */
export function ResetLinkSent({
  email,
  onTryAnotherEmail,
}: ResetLinkSentProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  // The form that held focus is gone; move it to what replaced it.
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex size-14 items-center justify-center rounded-full bg-primary-500 text-neutral-100">
        <MailCheck className="size-6" aria-hidden />
      </div>
      <div className="flex flex-col gap-3">
        <p className="text-xs font-bold tracking-600 text-primary-500 uppercase">
          Account recovery
        </p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className="text-2xl font-bold tracking-300 uppercase outline-none md:text-3xl"
        >
          Check your inbox
        </h1>
      </div>
      <p className="opacity-50">
        If an account exists for <strong>{email}</strong>, we have sent it a
        link to reset the password. The link works once and expires in{" "}
        {PASSWORD_RESET_EXPIRY_LABEL}.
      </p>
      <p className="text-sm">
        Nothing there? Check your spam folder, or{" "}
        <button
          type="button"
          onClick={onTryAnotherEmail}
          className="cursor-pointer font-bold text-primary-500"
        >
          try another email
        </button>
        .
      </p>
      <Button variant="outline" size="lg" asChild>
        <Link to={paths.auth.login.path}>Back to login</Link>
      </Button>
    </div>
  );
}
