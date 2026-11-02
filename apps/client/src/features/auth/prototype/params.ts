// PROTOTYPE: URL state shared by every variant (#352).
import { useCallback } from "react";
import { useSearchParams } from "react-router";

export const PAGES = ["login", "signup", "forgot", "reset"] as const;
export type Page = (typeof PAGES)[number];

// idle: the form. pending: submit in flight. error: inline field errors.
// limited: the forgot route answered 429 (toast). sent: forgot's "check your inbox".
// invalid: reset's expired-or-used link. success: reset done, the landing stub.
export const STATES = [
  "idle",
  "pending",
  "error",
  "limited",
  "sent",
  "invalid",
  "success",
] as const;
export type ViewState = (typeof STATES)[number];

export const STATES_FOR_PAGE: Record<Page, readonly ViewState[]> = {
  login: ["idle", "pending", "error"],
  signup: ["idle", "pending", "error"],
  forgot: ["idle", "pending", "error", "limited", "sent"],
  reset: ["idle", "pending", "error", "invalid", "success"],
};

export const PAGE_LABELS: Record<Page, string> = {
  login: "Login",
  signup: "Signup",
  forgot: "Forgot",
  reset: "Reset",
};

export type VariantProps = {
  page: Page;
  state: ViewState;
  go: (page: Page, state?: ViewState) => void;
};

const isPage = (v: string | null): v is Page => PAGES.includes(v as Page);
const isState = (v: string | null): v is ViewState =>
  STATES.includes(v as ViewState);

export function usePrototypeParams() {
  const [params, setParams] = useSearchParams();
  const variant = params.get("variant") ?? "A";
  const page: Page = isPage(params.get("page"))
    ? (params.get("page") as Page)
    : "login";
  const rawState: ViewState = isState(params.get("state"))
    ? (params.get("state") as ViewState)
    : "idle";
  const state = STATES_FOR_PAGE[page].includes(rawState) ? rawState : "idle";

  const go = useCallback(
    (next: Page, nextState: ViewState = "idle") => {
      setParams(
        (prev) => {
          const out = new URLSearchParams(prev);
          out.set("page", next);
          out.set("state", nextState);
          return out;
        },
        { replace: true },
      );
    },
    [setParams],
  );

  return { variant, page, state, go };
}
