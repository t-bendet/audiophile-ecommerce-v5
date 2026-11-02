import { Button } from "@/components/ui/button";
import { paths } from "@/config/paths";
import { cn } from "@/lib/cn";
import { PASSWORD_RESET_EXPIRY_LABEL } from "@repo/domain";
import { TimerOff } from "lucide-react";
import { useEffect, useRef } from "react";
import { Link } from "react-router";
import {
  authLeadClass,
  authLinkClass,
  authOverlineClass,
  authTitleClass,
} from "./auth-styles";

/** One state for an invalid, expired or used link: the shopper's next step is the same. */
export function ResetLinkExpired() {
  const headingRef = useRef<HTMLHeadingElement>(null);
  // The form that held focus is gone; move it to what replaced it.
  useEffect(() => headingRef.current?.focus(), []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex size-14 items-center justify-center rounded-full bg-neutral-900 text-neutral-100">
        <TimerOff className="size-6" aria-hidden />
      </div>
      <div className="flex flex-col gap-3">
        <p className={authOverlineClass}>Account recovery</p>
        <h1
          ref={headingRef}
          tabIndex={-1}
          className={cn(authTitleClass, "outline-none")}
        >
          This link has expired
        </h1>
      </div>
      <p className={authLeadClass}>
        Reset links work once and expire after {PASSWORD_RESET_EXPIRY_LABEL}.
        Request a new one and we will email it to you.
      </p>
      <Button variant="accent" size="lg" asChild>
        <Link to={paths.auth.forgotPassword.path}>Request a new link</Link>
      </Button>
      <Link to={paths.auth.login.path} className={cn(authLinkClass, "text-sm")}>
        Back to login
      </Link>
    </div>
  );
}
