import { useEffect, useState } from "react";
import { useLocation } from "react-router";
import { groups, proto, setProto, syncUrl, useProto } from "./store";

const pill = (active: boolean) =>
  "rounded-full px-2 py-1 hover:bg-fuchsia-800 " +
  (active ? "bg-fuchsia-500 text-fuchsia-950" : "");
const [firstAxis, ...otherGroups] = groups;

function cycle(delta: number) {
  const { key, options } = firstAxis;
  const index = options.findIndex(({ value }) => value === proto()[key]);
  const next = options[(index + delta + options.length) % options.length];
  setProto({ [key]: next.value });
}

export function PrototypeSwitcher() {
  const state = useProto();
  const { key } = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    // Links drop the params, and the router writes history after the commit.
    const id = setTimeout(syncUrl, 0);
    return () => clearTimeout(id);
  }, [key]);

  useEffect(() => {
    if (!import.meta.env.DEV) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.closest("input, textarea, select") || target.isContentEditable)
      ) {
        return;
      }
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        cycle(event.key === "ArrowLeft" ? -1 : 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (!import.meta.env.DEV) return null;

  if (collapsed) {
    return (
      <button
        data-prototype-switcher
        type="button"
        aria-label="Expand the prototype bar"
        onClick={() => setCollapsed(false)}
        className="fixed right-3 bottom-3 z-100 rounded-full border-2 border-fuchsia-500 bg-fuchsia-950/95 px-3 py-1.5 font-mono text-xs text-fuchsia-50 shadow-2xl"
      >
        proto {state[firstAxis.key]}
      </button>
    );
  }

  const selected = firstAxis.options.find(
    ({ value }) => value === state[firstAxis.key],
  );

  return (
    <div
      data-prototype-switcher
      className="pointer-events-none fixed inset-x-0 bottom-3 z-100 flex justify-center px-3"
    >
      <div className="pointer-events-auto flex max-w-full flex-col items-center gap-1 rounded-2xl border-2 border-fuchsia-500 bg-fuchsia-950/95 px-3 py-1.5 font-mono text-xs text-fuchsia-50 shadow-2xl backdrop-blur">
        <div className="flex flex-wrap items-center justify-center gap-x-2">
          <span className="opacity-60">{firstAxis.key}</span>
          <button
            type="button"
            aria-label={`Previous ${firstAxis.key} variant`}
            onClick={() => cycle(-1)}
            className={pill(false)}
          >
            ←
          </button>
          <span className="font-bold tracking-wide">
            {state[firstAxis.key]} ({selected?.name})
          </span>
          <button
            type="button"
            aria-label={`Next ${firstAxis.key} variant`}
            onClick={() => cycle(1)}
            className={pill(false)}
          >
            →
          </button>
          <button
            type="button"
            aria-label="Collapse the prototype bar"
            onClick={() => setCollapsed(true)}
            className={pill(false)}
          >
            ▾
          </button>
        </div>
        {otherGroups.map(({ key: groupKey, options }) => (
          <div
            key={groupKey}
            role="group"
            aria-label={groupKey}
            className="flex flex-wrap items-center justify-center gap-1"
          >
            <span className="opacity-60">{groupKey}</span>
            {options.map(({ value, name }) => (
              <button
                key={String(value)}
                type="button"
                title={name}
                aria-pressed={state[groupKey] === value}
                onClick={() => setProto({ [groupKey]: value })}
                className={pill(state[groupKey] === value)}
              >
                {String(value)}
              </button>
            ))}
            <span className="opacity-80">
              {options.find(({ value }) => value === state[groupKey])?.name}
            </span>
          </div>
        ))}
        {/* extras: add session-specific controls here, such as a last-nav timing
            readout from state.timings or a /checkout-only thank-you button. */}
      </div>
    </div>
  );
}
