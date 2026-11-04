type Value = string | number | boolean;
type Options<T> = readonly [T, ...T[]];
type HarnessConfig = {
  issue: number;
  axes: Record<string, Options<{ key: string; name: string }>>;
  toggles: Record<string, Options<Value>>;
};

function defineHarness<const T extends HarnessConfig>(definition: T): T {
  if (Object.keys(definition.axes).length === 0) {
    throw new Error("Define at least one prototype axis");
  }
  for (const key of Object.keys(definition.axes)) {
    if (key in definition.toggles || key === "timings") {
      throw new Error(`Duplicate or reserved prototype key: ${key}`);
    }
  }
  if ("timings" in definition.toggles) {
    throw new Error("timings is reserved for navigation measurements");
  }
  return definition;
}

// Group 3 (account area and order detail) has no parent issue yet; 0 stands in.
export const config = defineHarness({
  issue: 0,
  axes: {
    shell: [
      { key: "A", name: "Underline tabs" },
      { key: "B", name: "Sidebar" },
      { key: "C", name: "Dark band" },
    ],
    detail: [
      { key: "A", name: "Receipt with stepper" },
      { key: "B", name: "Split with rail" },
      { key: "C", name: "Tracker first" },
    ],
    profile: [
      { key: "A", name: "Inline form" },
      { key: "B", name: "Hub with edit dialogs" },
    ],
    security: [
      { key: "A", name: "Sections, password re-entry" },
      { key: "B", name: "Dialogs, typed word" },
    ],
  },
  toggles: {
    status: ["real", "pending", "shipped", "delivered", "cancelled"],
    actor: ["hidden", "shown"],
    link: ["heading", "button"],
    role: ["shopper", "sole-admin"],
  },
});

export const storageKey = `PROTOTYPE-${config.issue}`;
export const commentMarker = `PROTOTYPE (#${config.issue})`;
