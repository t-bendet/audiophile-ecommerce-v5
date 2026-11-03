// PROTOTYPE (#359): floating bar for the loading and dialog variants. Rendered in development only.
// ← / → cycle the loading variant. Choices survive navigation through sessionStorage.
import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import {
  DELAYS,
  DIALOG_VARIANTS,
  LOADING_VARIANTS,
  MENU_VARIANTS,
  setProto,
  useProto,
} from "./store";

const pill = (active: boolean) =>
  "rounded-full px-2 py-0.5 hover:bg-fuchsia-800 " +
  (active ? "bg-fuchsia-500 text-fuchsia-950" : "");

const Divider = () => (
  <span className="mx-1 h-4 w-px bg-fuchsia-400/50" aria-hidden />
);

export function PrototypeSwitcher() {
  const state = useProto();
  const { pathname } = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const index = Math.max(
    0,
    LOADING_VARIANTS.findIndex((v) => v.key === state.loading),
  );

  const cycle = (delta: number) => {
    const next =
      LOADING_VARIANTS[
        (index + delta + LOADING_VARIANTS.length) % LOADING_VARIANTS.length
      ];
    setProto({ loading: next.key });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowLeft") cycle(-1);
      if (event.key === "ArrowRight") cycle(1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  if (!import.meta.env.DEV) return null;

  if (collapsed) {
    return (
      <button
        type="button"
        onClick={() => setCollapsed(false)}
        className="fixed right-3 bottom-3 z-100 rounded-full border-2 border-fuchsia-500 bg-fuchsia-950/95 px-3 py-1.5 font-mono text-xs text-fuchsia-50 shadow-2xl"
      >
        proto {state.loading}/{state.dialog}/{state.menu}
      </button>
    );
  }

  return (
    <div
      data-prototype-switcher
      className="pointer-events-none fixed inset-x-0 bottom-3 z-100 flex justify-center px-3"
    >
      <div className="pointer-events-auto flex max-w-full flex-col items-center gap-1 rounded-2xl border-2 border-fuchsia-500 bg-fuchsia-950/95 px-3 py-1.5 font-mono text-xs text-fuchsia-50 shadow-2xl backdrop-blur">
        <div className="flex flex-wrap items-center justify-center gap-x-2">
          <span className="opacity-60">loading</span>
          <button
            type="button"
            aria-label="Previous loading variant"
            onClick={() => cycle(-1)}
            className="rounded-full px-2 py-1 hover:bg-fuchsia-800"
          >
            ←
          </button>
          <span className="font-bold tracking-wide">
            {LOADING_VARIANTS[index].key}{" "}
            <span className="font-normal opacity-80">
              ({LOADING_VARIANTS[index].name})
            </span>
          </span>
          <button
            type="button"
            aria-label="Next loading variant"
            onClick={() => cycle(1)}
            className="rounded-full px-2 py-1 hover:bg-fuchsia-800"
          >
            →
          </button>
          <button
            type="button"
            aria-label="Collapse the prototype bar"
            onClick={() => setCollapsed(true)}
            className="rounded-full px-2 py-1 opacity-60 hover:bg-fuchsia-800"
          >
            ▾
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
          <span className="opacity-60">dialogs</span>
          {DIALOG_VARIANTS.map((v) => (
            <button
              key={v.key}
              type="button"
              title={v.name}
              onClick={() => setProto({ dialog: v.key })}
              className={pill(state.dialog === v.key)}
            >
              {v.key}
            </button>
          ))}
          <span className="hidden opacity-80 sm:inline">
            ({DIALOG_VARIANTS.find((v) => v.key === state.dialog)?.name ?? ""})
          </span>
          <Divider />
          <span className="opacity-60">menu</span>
          {MENU_VARIANTS.map((v) => (
            <button
              key={v.key}
              type="button"
              title={v.name}
              onClick={() => setProto({ menu: v.key })}
              className={pill(state.menu === v.key)}
            >
              {v.key}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setProto({ holdMenu: !state.holdMenu })}
            className={pill(state.holdMenu)}
          >
            hold
          </button>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-1 gap-y-1">
          <span className="opacity-60">delay</span>
          {DELAYS.map((ms) => (
            <button
              key={ms}
              type="button"
              onClick={() => setProto({ delay: ms })}
              className={pill(state.delay === ms)}
            >
              {ms}
            </button>
          ))}
          <Divider />
          <span className="opacity-60">/users/me</span>
          {(["fresh", "cached"] as const).map((auth) => (
            <button
              key={auth}
              type="button"
              onClick={() => setProto({ auth })}
              className={pill(state.auth === auth)}
            >
              {auth}
            </button>
          ))}
          {pathname === "/checkout" && (
            <>
              <Divider />
              <button
                type="button"
                onClick={() => setProto({ thankYou: true })}
                className={pill(state.thankYou)}
              >
                thank-you
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
