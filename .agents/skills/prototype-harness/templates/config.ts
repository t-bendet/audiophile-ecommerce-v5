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

export const config = defineHarness({
  issue: 383,
  axes: {
    layout: [
      { key: "A", name: "Stacked" },
      { key: "B", name: "Split" },
    ],
    detail: [
      { key: "A", name: "Compact" },
      { key: "B", name: "Expanded" },
    ],
  },
  toggles: {
    delay: [0, 800, 2000],
    cache: ["cold", "warm"],
  },
});

export const storageKey = `PROTOTYPE-${config.issue}`;
export const commentMarker = `PROTOTYPE (#${config.issue})`;
