// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DEFAULT_LAYOUTS,
  DisplayLayouts,
  DisplayMenu,
  DisplayReset,
  DisplaySelect,
  DisplayWhen,
  LayoutSwitch,
  MORE_LAYOUTS,
  matchShortcut,
  useShortcuts,
  viewRecords,
  type DisplayOptions,
  type ViewSpec,
} from "../index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let root: ReturnType<typeof createRoot> | undefined;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  host = undefined;
  root = undefined;
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  const r = createRoot(host);
  root = r;
  await act(async () => r.render(element));
  return host;
};
const click = async (el: Element | null | undefined) => {
  if (!el) throw new Error("element not found");
  await act(async () => (el as HTMLElement).click());
};
const byText = (text: string, selector = "*") =>
  [...document.querySelectorAll(selector)].find((e) => e.textContent?.trim() === text);

interface Issue {
  id: string;
  status: string;
  priority: number;
  labels: string[];
}
const issues: Issue[] = [
  { id: "A", status: "todo", priority: 3, labels: ["bug"] },
  { id: "B", status: "done", priority: 1, labels: [] },
  { id: "C", status: "todo", priority: 1, labels: ["bug", "ui"] },
  { id: "D", status: "progress", priority: 2, labels: ["ui"] },
];
const spec: ViewSpec<Issue> = {
  read: (r, field) => (field === "labels" ? r.labels : field === "status" ? r.status : null),
  groupings: {
    status: { key: (r) => r.status, order: ["backlog", "todo", "progress", "done"] },
  },
  orderings: { priority: (a, b) => a.priority - b.priority },
};

describe("viewRecords", () => {
  it("filters, orders, then groups in the grouping's order", () => {
    const out = viewRecords(
      issues,
      spec,
      [{ field: "labels", operator: "is", values: ["bug", "ui"] }],
      { grouping: "status", ordering: "priority" },
    );
    expect(out.groups.map((g) => [g.key, g.records.map((r) => r.id)])).toEqual([
      ["todo", ["C", "A"]],
      ["progress", ["D"]],
    ]);
    expect(out.records.map((r) => r.id)).toEqual(["C", "A", "D"]);
  });
  it("keeps empty groups when asked, and puts everything in one group without grouping", () => {
    const kept = viewRecords(
      issues,
      spec,
      [],
      { grouping: "status", ordering: "x" },
      {
        keepEmpty: true,
      },
    );
    expect(kept.groups.map((g) => g.key)).toEqual(["backlog", "todo", "progress", "done"]);
    const flat = viewRecords(issues, spec, [], { grouping: "none", ordering: "priority" });
    expect(flat.groups).toHaveLength(1);
    expect(flat.records.map((r) => r.id)).toEqual(["B", "C", "D", "A"]);
  });
});

describe("matchShortcut", () => {
  const ev = (key: string, mods: Partial<KeyboardEvent> = {}) => ({
    key,
    metaKey: false,
    ctrlKey: false,
    altKey: false,
    shiftKey: false,
    ...mods,
  });
  it("matches a key and its modifiers exactly", () => {
    expect(matchShortcut(ev("f"), "F")).toBe(true);
    expect(matchShortcut(ev("F", { shiftKey: true }), "shift+f")).toBe(true);
    expect(matchShortcut(ev("f", { shiftKey: true }), "f")).toBe(false);
    expect(matchShortcut(ev("1", { ctrlKey: true }), "ctrl+1")).toBe(true);
  });
});

describe("useShortcuts", () => {
  it("runs a binding, but not while typing in a field", async () => {
    const run = vi.fn<() => void>();
    function Probe() {
      useShortcuts({ f: run });
      return h("input", { "aria-label": "Search" });
    }
    const el = await mount(h(Probe));
    await act(async () => {
      document.body.dispatchEvent(new KeyboardEvent("keydown", { key: "f", bubbles: true }));
    });
    expect(run).toHaveBeenCalledTimes(1);
    const input = el.querySelector("input")!;
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "f", bubbles: true }));
    });
    expect(run).toHaveBeenCalledTimes(1);
  });
});

const display: DisplayOptions = {
  layout: "list",
  grouping: "status",
  ordering: "priority",
  toggles: {},
  properties: [],
};

describe("DisplayMenu parts", () => {
  it("adds a layout, and shows its own options only when it is chosen", async () => {
    const onChange = vi.fn<(value: DisplayOptions) => void>();
    const zooms = [
      { value: "week", label: "Week" },
      { value: "month", label: "Month" },
    ];
    const menu = (value: DisplayOptions) =>
      h(
        DisplayMenu,
        { value, onChange, open: true, defaultValue: display },
        h(DisplayLayouts, { layouts: [...DEFAULT_LAYOUTS, MORE_LAYOUTS.timeline] }),
        h(
          DisplayWhen,
          { layout: "timeline" },
          h(DisplaySelect, { name: "zoom", label: "Zoom", options: zooms }),
        ),
        h(DisplayReset),
      );
    await mount(menu(display));
    expect(byText("Zoom")).toBeUndefined();
    expect(byText("Reset to default", "button")).toBeUndefined();
    await click(byText("Timeline", "button"));
    expect(onChange).toHaveBeenLastCalledWith({ ...display, layout: "timeline" });
    await act(async () => root?.render(menu({ ...display, layout: "timeline" })));
    expect(byText("Zoom")).toBeDefined();
    expect(byText("Reset to default", "button")).toBeDefined();
  });
});

describe("LayoutSwitch", () => {
  it("names each layout and marks the current one", async () => {
    const onChange = vi.fn<(layout: string) => void>();
    const el = await mount(h(LayoutSwitch, { value: "board", onChange }));
    const board = el.querySelector('[aria-label="Board"]');
    expect(board?.getAttribute("aria-pressed")).toBe("true");
    await click(el.querySelector('[aria-label="List"]'));
    expect(onChange).toHaveBeenCalledWith("list");
  });
});
