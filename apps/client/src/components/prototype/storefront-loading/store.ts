// PROTOTYPE (#359): throwaway variant store for the loading-states and dialogs session.
// Loaders run outside React, so the choice lives in a module store. It is mirrored into the URL
// (?loading= ?dialog= ?menu= ?delay= ?auth=) and sessionStorage; the URL wins on a full load.
import { useSyncExternalStore } from "react";

export const LOADING_VARIANTS = [
  { key: "0", name: "Today: await, no pending UI" },
  { key: "A", name: "Await, keep the page, progress bar" },
  { key: "B", name: "Stream, skeleton at once" },
  { key: "C", name: "Await, skeleton during the wait" },
] as const;

export const DIALOG_VARIANTS = [
  { key: "A", name: "Sheets below the nav" },
  { key: "B", name: "Bottom drawers" },
  { key: "C", name: "Side panels" },
] as const;

export const MENU_VARIANTS = [
  { key: "A", name: "Skeleton pill" },
  { key: "B", name: "Nameless greeting" },
  { key: "C", name: "Spinner (today's fallback)" },
] as const;

export const DELAYS = [0, 800, 2000] as const;

type State = {
  loading: (typeof LOADING_VARIANTS)[number]["key"];
  dialog: (typeof DIALOG_VARIANTS)[number]["key"];
  menu: (typeof MENU_VARIANTS)[number]["key"];
  delay: number;
  // "fresh": the middleware refetches /users/me on every navigation, as today.
  auth: "fresh" | "cached";
  // "cold": each navigation drops the destination's queries first; "warm" is today.
  cache: "cold" | "warm";
  holdMenu: boolean;
  thankYou: boolean;
  timings: { user?: number; total?: number };
};

const DEFAULTS: State = {
  loading: "0",
  dialog: "A",
  menu: "A",
  delay: 800,
  auth: "fresh",
  cache: "cold",
  holdMenu: false,
  thankYou: false,
  timings: {},
};

const STORAGE_KEY = "PROTOTYPE-359";

const initial = (): State => {
  if (typeof window === "undefined") return DEFAULTS;
  let stored: Partial<State>;
  try {
    stored = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "{}");
  } catch {
    stored = {};
  }
  const url = new URLSearchParams(window.location.search);
  const fromUrl: Partial<State> = {};
  const loading = url.get("loading");
  if (LOADING_VARIANTS.some((v) => v.key === loading))
    fromUrl.loading = loading as State["loading"];
  const dialog = url.get("dialog");
  if (DIALOG_VARIANTS.some((v) => v.key === dialog))
    fromUrl.dialog = dialog as State["dialog"];
  const menu = url.get("menu");
  if (MENU_VARIANTS.some((v) => v.key === menu))
    fromUrl.menu = menu as State["menu"];
  const delay = url.get("delay");
  if (delay !== null && !Number.isNaN(Number(delay)))
    fromUrl.delay = Number(delay);
  const auth = url.get("auth");
  if (auth === "fresh" || auth === "cached") fromUrl.auth = auth;
  const cache = url.get("cache");
  if (cache === "cold" || cache === "warm") fromUrl.cache = cache;
  return { ...DEFAULTS, ...stored, ...fromUrl, thankYou: false, timings: {} };
};

let state: State = initial();
// PROTOTYPE (#359): persist URL choices too, so a later full page load keeps them.
if (typeof window !== "undefined") {
  const { thankYou: _thankYou, timings: _timings, ...persisted } = state;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
}
const listeners = new Set<() => void>();

export const proto = () => state;

const URL_KEYS = [
  "loading",
  "dialog",
  "menu",
  "delay",
  "auth",
  "cache",
] as const;

/**
 * Writes the five URL keys onto the current address without a router navigation, so no loader
 * re-runs. history.state is kept: React Router stores its location key and index there.
 */
export const syncUrl = () => {
  const url = new URL(window.location.href);
  for (const key of URL_KEYS) url.searchParams.set(key, String(state[key]));
  if (url.href !== window.location.href) {
    window.history.replaceState(window.history.state, "", url);
  }
};

export const setProto = (patch: Partial<State>) => {
  state = { ...state, ...patch };
  const { thankYou: _thankYou, timings: _timings, ...persisted } = state;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  syncUrl();
  listeners.forEach((listener) => listener());
};

/** The last navigation's timings in ms; not persisted, not in the URL. */
export const setTimings = (timings: State["timings"]) => {
  state = { ...state, timings };
  listeners.forEach((listener) => listener());
};

export const useProto = () =>
  useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    () => state,
  );

/** Await-in-the-loader variants: today, A and C. B streams. */
export const loadersAwait = () => state.loading !== "B";
