// PROTOTYPE route for #352: three variants of the auth layout on one throwaway
// route, switchable via ?variant= (A|B|C), ?page= and ?state=. Registered only
// in development builds. Nothing here ships.
import { PrototypeSwitcher } from "@/components/prototype/prototype-switcher";
import {
  PAGE_LABELS,
  PAGES,
  STATES_FOR_PAGE,
  usePrototypeParams,
} from "@/features/auth/prototype/params";
import { VariantA } from "@/features/auth/prototype/variant-a-split";
import { VariantB } from "@/features/auth/prototype/variant-b-backdrop";
import { VariantC } from "@/features/auth/prototype/variant-c-card";
import { useEffect } from "react";
import { toast } from "sonner";

const VARIANTS = [
  { key: "A", name: "Split pane, full brand" },
  { key: "B", name: "Imagery behind a centred card" },
  { key: "C", name: "Card only, no imagery" },
];

const PAGE_OPTIONS = PAGES.map((key) => ({ key, label: PAGE_LABELS[key] }));

export default function AuthPrototypePage() {
  const { variant, page, state, go } = usePrototypeParams();
  const props = { page, state, go };

  // Toasts are the feedback the client guide gives to unmatched server errors.
  useEffect(() => {
    if (page === "login" && state === "error") {
      toast.error("Login Failed", {
        description: "Incorrect email or password",
      });
    }
    if (page === "forgot" && state === "limited") {
      toast.error("Too many requests", {
        description: "Please wait a few minutes before trying again.",
      });
    }
    if (page === "reset" && state === "success") {
      toast.success("Password updated", {
        description: "You are signed in with your new password.",
      });
    }
  }, [page, state, variant]);

  return (
    <>
      <title>Auth prototype | audiophile</title>
      <meta name="robots" content="noindex, nofollow" />
      {variant === "B" ? (
        <VariantB {...props} />
      ) : variant === "C" ? (
        <VariantC {...props} />
      ) : (
        <VariantA {...props} />
      )}
      <PrototypeSwitcher
        variants={VARIANTS}
        pages={PAGE_OPTIONS}
        states={STATES_FOR_PAGE[page]}
      />
    </>
  );
}
