// PROTOTYPE switcher: floating bar that cycles ?variant= and sets ?page= / ?state=.
// Rendered only in development builds.
import { useEffect } from "react";
import { useSearchParams } from "react-router";

type Variant = { key: string; name: string };
type Page = { key: string; label: string };

export function PrototypeSwitcher({
  variants,
  pages,
  states,
}: {
  variants: Variant[];
  pages: Page[];
  states: readonly string[];
}) {
  const [params, setParams] = useSearchParams();
  const current = params.get("variant") ?? variants[0].key;
  const page = params.get("page") ?? pages[0].key;
  const state = params.get("state") ?? states[0];
  const index = Math.max(
    0,
    variants.findIndex((v) => v.key === current),
  );

  const update = (entries: Record<string, string>) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        for (const [key, value] of Object.entries(entries)) {
          next.set(key, value);
        }
        return next;
      },
      { replace: true },
    );

  const cycle = (delta: number) => {
    const next = variants[(index + delta + variants.length) % variants.length];
    update({ variant: next.key });
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

  const pill = (active: boolean) =>
    "rounded-full px-2 py-0.5 hover:bg-fuchsia-800 " +
    (active ? "bg-fuchsia-500 text-fuchsia-950" : "");

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-3 z-100 flex justify-center px-3">
      <div className="pointer-events-auto flex max-w-full flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-2xl border-2 border-fuchsia-500 bg-fuchsia-950/95 px-3 py-1.5 font-mono text-xs text-fuchsia-50 shadow-2xl backdrop-blur">
        <button
          type="button"
          aria-label="Previous variant"
          onClick={() => cycle(-1)}
          className="rounded-full px-2 py-1 hover:bg-fuchsia-800"
        >
          ←
        </button>
        <span className="font-bold tracking-wide">
          {variants[index].key}{" "}
          <span className="hidden font-normal opacity-80 sm:inline">
            ({variants[index].name})
          </span>
        </span>
        <button
          type="button"
          aria-label="Next variant"
          onClick={() => cycle(1)}
          className="rounded-full px-2 py-1 hover:bg-fuchsia-800"
        >
          →
        </button>
        <span className="mx-1 h-4 w-px bg-fuchsia-400/50" aria-hidden />
        {pages.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => update({ page: p.key, state: states[0] })}
            className={pill(page === p.key)}
          >
            {p.label}
          </button>
        ))}
        <span className="mx-1 h-4 w-px bg-fuchsia-400/50" aria-hidden />
        {states.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => update({ state: s })}
            className={pill(state === s)}
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  );
}
