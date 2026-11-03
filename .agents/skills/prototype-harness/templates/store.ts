import { useSyncExternalStore } from "react";
import { config, storageKey } from "./config";

type Axes = typeof config.axes;
type Toggles = typeof config.toggles;
export type Choices = {
  -readonly [K in keyof Axes]: Axes[K][number]["key"];
} & {
  -readonly [K in keyof Toggles]: Toggles[K][number];
};
type ChoiceKey = keyof Choices;
type ChoiceValue = Choices[ChoiceKey];
type Timings = { wait?: number; total?: number };
type State = Choices & { timings: Timings };

export const groups = [
  ...Object.entries(config.axes).map(([key, options]) => ({
    key,
    options: options.map(({ key: value, name }) => ({ value, name })),
  })),
  ...Object.entries(config.toggles).map(([key, values]) => ({
    key,
    options: values.map((value) => ({ value, name: String(value) })),
  })),
] as { key: ChoiceKey; options: { value: ChoiceValue; name: string }[] }[];

const defaults = Object.fromEntries(
  groups.map(({ key, options }) => [key, options[0].value]),
) as Choices;

function parseChoices(read: (key: ChoiceKey) => unknown): Partial<Choices> {
  return Object.fromEntries(
    groups.flatMap(({ key, options }) => {
      const value = read(key);
      const option = options.find((option) => String(option.value) === value);
      return option ? [[key, option.value]] : [];
    }),
  );
}

function initial(): State {
  if (typeof window === "undefined") return { ...defaults, timings: {} };
  let stored: Partial<Choices> = {};
  try {
    const saved = JSON.parse(sessionStorage.getItem(storageKey) ?? "{}");
    stored = parseChoices((key) => String(saved?.[key]));
  } catch {
    // A stale or unavailable session must not prevent the prototype from opening.
  }
  const params = new URLSearchParams(window.location.search);
  const fromUrl = parseChoices((key) => params.get(key));
  return { ...defaults, ...stored, ...fromUrl, timings: {} };
}

let state = initial();
const listeners = new Set<() => void>();

function persist() {
  if (typeof window === "undefined") return;
  try {
    const { timings: _timings, ...choices } = state;
    sessionStorage.setItem(storageKey, JSON.stringify(choices));
  } catch {
    // URL choices still work when browser storage is unavailable.
  }
}
persist();

export const proto = () => state;

export function syncUrl() {
  const url = new URL(window.location.href);
  for (const { key } of groups) url.searchParams.set(key, String(state[key]));
  if (url.href !== window.location.href) {
    // Keep React Router's location key and history index without rerunning loaders.
    window.history.replaceState(window.history.state, "", url);
  }
}

export function setProto(patch: Partial<Choices>) {
  state = { ...state, ...patch };
  persist();
  syncUrl();
  listeners.forEach((listener) => listener());
}

export function setTimings(timings: Timings) {
  state = { ...state, timings };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const useProto = () => useSyncExternalStore(subscribe, proto);
