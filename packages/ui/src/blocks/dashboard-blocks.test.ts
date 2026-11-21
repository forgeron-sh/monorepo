// @vitest-environment jsdom
import { act, createElement as h, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DASHBOARD_COLUMNS,
  DateRangeCompare,
  DateRangeComparePeriod,
  DateRangeCompareSummary,
  DeltaBadge,
  Donut,
  Funnel,
  Gauge,
  Heatmap,
  MetricPicker,
  MetricPickerMeasure,
  MetricPickerSteps,
  MetricPickerSummary,
  StackedBar,
  WidgetFrame,
  WidgetFrameBody,
  WidgetFrameContent,
  WidgetFrameHeader,
  WidgetFrameTitles,
  WidgetFrameTools,
  WidgetFrameExpand,
  WidgetGrid,
  WidgetGridCanvas,
  WidgetGridContent,
  WidgetGridEditBar,
  WidgetGridGrab,
  WidgetGridItem,
  WidgetGridStatus,
  dashboardBucketUnit,
  dashboardBuckets,
  dashboardCalendarCells,
  dashboardCollides,
  dashboardCompact,
  dashboardCompareRanges,
  dashboardDeltaWay,
  dashboardDragBox,
  dashboardEmptyQuery,
  dashboardFormatPercent,
  dashboardFunnel,
  dashboardGaugeState,
  dashboardHeatLevel,
  dashboardKeyBox,
  dashboardNextSlot,
  dashboardPatternOn,
  dashboardPlace,
  dashboardQueryText,
  dashboardRatio,
  dashboardRing,
  dashboardStack,
  dashboardSync,
  type DashboardPeriod,
  type DashboardQuery,
  type DashboardRanges,
  type WidgetLayout,
} from "../index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let reactRoot: ReturnType<typeof createRoot> | undefined;
afterEach(async () => {
  await act(async () => reactRoot?.unmount());
  reactRoot = undefined;
  host?.remove();
  host = undefined;
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  reactRoot = createRoot(host);
  await act(async () => reactRoot!.render(element));
  return host;
};
const key = async (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...init }));
  });

const at = (id: string, x: number, y: number, w: number, h: number): WidgetLayout => ({
  id,
  x,
  y,
  w,
  h,
});

describe("dashboard grid model", () => {
  it("says when two widgets share a cell", () => {
    expect(dashboardCollides(at("a", 0, 0, 4, 2), at("b", 3, 1, 4, 2))).toBe(true);
    expect(dashboardCollides(at("a", 0, 0, 4, 2), at("b", 4, 0, 4, 2))).toBe(false);
    expect(dashboardCollides(at("a", 0, 0, 4, 2), at("a", 0, 0, 4, 2))).toBe(false);
  });

  it("clamps a box to the grid and the limits", () => {
    const [a] = dashboardPlace([at("a", 0, 0, 4, 2)], "a", { x: 11, y: -3, w: 6, h: 0 });
    expect(a).toEqual(at("a", 6, 0, 6, 1));
    const [b] = dashboardPlace(
      [at("a", 0, 0, 4, 2)],
      "a",
      { x: 0, y: 0, w: 1, h: 1 },
      {
        limits: { minW: 3, minH: 2 },
      },
    );
    expect([b!.w, b!.h]).toEqual([3, 2]);
  });

  it("pushes down what a widget lands on and lets the rest fall back", () => {
    const layout = [at("a", 0, 0, 6, 2), at("b", 6, 0, 6, 2), at("c", 0, 2, 6, 2)];
    const next = dashboardPlace(layout, "b", { x: 0, y: 0, w: 6, h: 2 });
    const by = Object.fromEntries(next.map((i) => [i.id, i]));
    expect(by.b).toMatchObject({ x: 0, y: 0 });
    expect(by.a!.y).toBe(2);
    expect(by.c!.y).toBe(4);
    for (const i of next) for (const j of next) expect(dashboardCollides(i, j)).toBe(false);
  });

  it("swaps two rows when one is dragged under the other", () => {
    const layout = [at("a", 0, 0, 12, 2), at("b", 0, 2, 12, 2)];
    const past = dashboardPlace(layout, "a", { x: 0, y: 4, w: 12, h: 2 });
    const by = Object.fromEntries(past.map((i) => [i.id, i]));
    expect(by.b!.y).toBe(0);
    expect(by.a!.y).toBe(2);
    // Dropped half way over the other: it is pushed down, and no gap is left.
    const half = dashboardPlace(layout, "a", { x: 0, y: 3, w: 12, h: 2 });
    expect(half.map((i) => [i.id, i.y])).toEqual([
      ["a", 0],
      ["b", 2],
    ]);
  });

  it("compacts upward, keeping the widget being dragged where it is", () => {
    const layout = [at("a", 0, 5, 4, 2), at("b", 4, 9, 4, 2)];
    expect(dashboardCompact(layout).map((i) => i.y)).toEqual([0, 0]);
    expect(dashboardCompact(layout, ["a"]).map((i) => i.y)).toEqual([5, 0]);
  });

  it("finds the first free slot", () => {
    const layout = [at("a", 0, 0, 8, 2)];
    expect(dashboardNextSlot(layout, 4, 2)).toEqual({ x: 8, y: 0, w: 4, h: 2 });
    expect(dashboardNextSlot(layout, 6, 1)).toEqual({ x: 0, y: 2, w: 6, h: 1 });
  });

  it("fits a layout to its widgets: drops the gone, places the new, separates overlaps", () => {
    const synced = dashboardSync(
      [at("a", 0, 0, 6, 2), at("gone", 6, 0, 6, 2), at("b", 2, 0, 6, 2)],
      ["a", "b", "c"],
    );
    expect(synced.map((i) => i.id)).toEqual(["a", "b", "c"]);
    for (const i of synced) {
      expect(i.x + i.w).toBeLessThanOrEqual(DASHBOARD_COLUMNS);
      for (const j of synced) expect(dashboardCollides(i, j)).toBe(false);
    }
  });

  it("turns arrows into moves and Shift arrows into resizes", () => {
    const box = { x: 2, y: 2, w: 3, h: 2 };
    expect(dashboardKeyBox(box, "ArrowRight", false)).toEqual({ x: 3, y: 2, w: 3, h: 2 });
    expect(dashboardKeyBox(box, "ArrowUp", false)).toEqual({ x: 2, y: 1, w: 3, h: 2 });
    expect(dashboardKeyBox(box, "ArrowRight", true)).toEqual({ x: 2, y: 2, w: 4, h: 2 });
    expect(dashboardKeyBox(box, "ArrowUp", true)).toEqual({ x: 2, y: 2, w: 3, h: 1 });
    expect(dashboardKeyBox(box, "a", false)).toBeNull();
  });

  it("turns a pointer drag into whole cells", () => {
    const m = { colW: 80, rowH: 96, gap: 12 };
    expect(dashboardDragBox({ x: 0, y: 0, w: 4, h: 2 }, 190, 200, m, "move")).toEqual({
      x: 2,
      y: 2,
      w: 4,
      h: 2,
    });
    expect(dashboardDragBox({ x: 0, y: 0, w: 4, h: 2 }, 92, 0, m, "resize")).toEqual({
      x: 0,
      y: 0,
      w: 5,
      h: 2,
    });
  });
});

describe("dashboard arithmetic", () => {
  it("buckets a series by day, week and month, keeping empty slices", () => {
    const points = [
      { date: "2026-11-02", value: 3 },
      { date: "2026-11-03", value: 4 },
      { date: "2026-11-10", value: 5 },
      { date: "2026-12-30", value: 99 },
    ];
    const days = dashboardBuckets(points, "2026-11-01", "2026-11-07", "day");
    expect(days).toHaveLength(7);
    expect(days.map((d) => d.value)).toEqual([0, 3, 4, 0, 0, 0, 0]);
    const weeks = dashboardBuckets(points, "2026-11-01", "2026-11-30", "week");
    expect(weeks.map((w) => [w.start, w.end])).toEqual([
      ["2026-11-01", "2026-11-01"],
      ["2026-11-02", "2026-11-08"],
      ["2026-11-09", "2026-11-15"],
      ["2026-11-16", "2026-11-22"],
      ["2026-11-23", "2026-11-29"],
      ["2026-11-30", "2026-11-30"],
    ]);
    expect(weeks.map((w) => w.value)).toEqual([0, 7, 5, 0, 0, 0]);
    const months = dashboardBuckets(points, "2026-11-01", "2026-12-31", "month");
    expect(months.map((m) => [m.label, m.value])).toEqual([
      ["Nov", 12],
      ["Dec", 99],
    ]);
    expect(dashboardBuckets(points, "2026-11-09", "2026-11-01")).toEqual([]);
  });

  it("picks the unit that suits a period", () => {
    expect(dashboardBucketUnit("2026-11-01", "2026-11-30")).toBe("day");
    expect(dashboardBucketUnit("2026-09-01", "2026-11-30")).toBe("week");
    expect(dashboardBucketUnit("2026-01-01", "2026-11-30")).toBe("month");
  });

  it("works out ratios and percents", () => {
    expect(dashboardRatio(112, 100)).toBeCloseTo(0.12);
    expect(dashboardRatio(80, 100)).toBeCloseTo(-0.2);
    expect(dashboardRatio(5, 0)).toBeNull();
    expect(dashboardRatio(0, 0)).toBe(0);
    expect(dashboardRatio(-5, -10)).toBeCloseTo(0.5);
    expect(dashboardFormatPercent(0.124)).toBe("12%");
    expect(dashboardFormatPercent(0.1245, { digits: 1, sign: true })).toBe("+12.5%");
    expect(dashboardFormatPercent(-0.06, { sign: true })).toBe("−6%");
    expect(dashboardFormatPercent(0, { sign: true })).toBe("±0%");
  });

  it("reads which way a delta went and whether it is good news", () => {
    expect(dashboardDeltaWay(0.1)).toEqual({ way: "up", tone: "good" });
    expect(dashboardDeltaWay(0.1, "down")).toEqual({ way: "up", tone: "bad" });
    expect(dashboardDeltaWay(-0.1, "down")).toEqual({ way: "down", tone: "good" });
    expect(dashboardDeltaWay(0.0001)).toEqual({ way: "flat", tone: "flat" });
  });

  it("works out the conversion of a funnel", () => {
    const { rows, overall } = dashboardFunnel([
      { label: "Lead", value: 200 },
      { label: "Qualified", value: 80 },
      { label: "Won", value: 20 },
    ]);
    expect(rows[1]).toMatchObject({ ofFirst: 0.4, ofPrevious: 0.4, lost: 120 });
    expect(rows[2]).toMatchObject({ ofFirst: 0.1, ofPrevious: 0.25, lost: 60 });
    expect(rows[0]!.ofPrevious).toBeNull();
    expect(overall).toBeCloseTo(0.1);
    expect(
      dashboardFunnel([
        { label: "x", value: 0 },
        { label: "y", value: 0 },
      ]).overall,
    ).toBe(0);
  });

  it("steps heat in levels, zero apart", () => {
    expect([0, 1, 25, 50, 75, 100].map((v) => dashboardHeatLevel(v, 100))).toEqual([
      0, 1, 1, 2, 3, 4,
    ]);
    expect(dashboardHeatLevel(5, 0)).toBe(0);
  });

  it("lays a period out as weeks of seven rows", () => {
    const weeks = dashboardCalendarCells("2026-11-04", "2026-11-17");
    expect(weeks).toHaveLength(3);
    expect(weeks[0]![0]).toBeNull();
    expect(weeks[0]![2]).toBe("2026-11-04");
    expect(weeks[2]![1]).toBe("2026-11-17");
    expect(weeks[2]![2]).toBeNull();
    expect(dashboardCalendarCells("2026-11-08", "2026-11-08", "sun")[0]![0]).toBe("2026-11-08");
  });

  it("draws rings in whole pixels, in order around the circle", () => {
    const ring = dashboardRing(40, 8);
    expect(ring.length).toBeGreaterThan(300);
    expect(ring.every((c) => c.t >= 0 && c.t < 1)).toBe(true);
    const top = ring.find((c) => c.x === 20 && c.y === 0)!;
    const right = ring.find((c) => c.x === 39 && c.y === 20)!;
    expect(top.t).toBeLessThan(0.02);
    expect(right.t).toBeCloseTo(0.25, 1);
    const half = dashboardRing(40, 8, "half");
    expect(Math.max(...half.map((c) => c.y))).toBeLessThanOrEqual(20);
    expect(half.find((c) => c.x === 0)!.t).toBeLessThan(0.1);
    expect(half.find((c) => c.x === 39)!.t).toBeGreaterThan(0.9);
  });

  it("has six distinct fill patterns", () => {
    const sig = (k: number) =>
      [0, 1, 2, 3]
        .flatMap((y) => [0, 1, 2, 3].map((x) => (dashboardPatternOn(k, x, y) ? 1 : 0)))
        .join("");
    expect(new Set([0, 1, 2, 3, 4, 5].map(sig)).size).toBe(6);
    expect(sig(6)).toBe(sig(0));
  });

  it("stacks series, hides some, normalizes", () => {
    const items = [
      { label: "A", values: { x: 6, y: 2 } },
      { label: "B", values: { x: 2, y: 2 } },
    ];
    const series = [{ key: "x" }, { key: "y" }];
    const plain = dashboardStack(items, series);
    expect(plain[0]!.total).toBe(8);
    expect(plain[0]!.segments[0]!.share).toBeCloseTo(0.75);
    expect(plain[1]!.segments[0]!.share).toBeCloseTo(0.25);
    expect(dashboardStack(items, series, { normalize: true })[1]!.segments[0]!.share).toBeCloseTo(
      0.5,
    );
    expect(dashboardStack(items, series, { hidden: ["y"] })[0]!.segments).toHaveLength(1);
  });

  it("states a gauge in words", () => {
    expect(dashboardGaugeState(30, { target: 100 })).toMatchObject({
      label: "Behind",
      tone: "bad",
    });
    expect(dashboardGaugeState(80, { target: 100 })).toMatchObject({
      label: "Close",
      tone: "warn",
    });
    const met = dashboardGaugeState(100, { target: 100, max: 200 });
    expect(met).toMatchObject({ label: "On target", tone: "good", fraction: 0.5, targetAt: 0.5 });
    const custom = dashboardGaugeState(5, {
      target: 4,
      thresholds: [
        { at: 0, label: "Fast", tone: "good" },
        { at: 4, label: "Slow", tone: "bad" },
      ],
    });
    expect(custom.label).toBe("Slow");
  });
});

describe("comparing periods", () => {
  const range = { from: "2026-11-01", to: "2026-11-30" };
  it("takes the same number of days just before", () => {
    const r = dashboardCompareRanges({ range, compare: "previous-period" });
    expect(r.days).toBe(30);
    expect(r.previous).toEqual({ from: "2026-10-02", to: "2026-10-31" });
  });
  it("shifts a year back, keeping Feb 29 inside February", () => {
    expect(dashboardCompareRanges({ range, compare: "previous-year" }).previous).toEqual({
      from: "2025-11-01",
      to: "2025-11-30",
    });
    expect(
      dashboardCompareRanges({
        range: { from: "2028-02-29", to: "2028-03-05" },
        compare: "previous-year",
      }).previous,
    ).toEqual({ from: "2027-02-28", to: "2027-03-05" });
  });
  it("uses the custom range, or none", () => {
    const custom = { from: "2026-01-01", to: "2026-01-31" };
    expect(dashboardCompareRanges({ range, compare: "custom", custom }).previous).toEqual(custom);
    expect(dashboardCompareRanges({ range, compare: "custom" }).previous).toBeNull();
    expect(dashboardCompareRanges({ range, compare: "none" }).previous).toBeNull();
    expect(
      dashboardCompareRanges({
        range: { from: "2026-11-01", to: null },
        compare: "previous-period",
      }),
    ).toEqual({ current: null, previous: null, days: 0 });
  });
});

describe("query description", () => {
  const catalog = {
    measures: [{ id: "revenue", label: "Revenue" }],
    groupings: [
      { id: "created", label: "Created", kind: "time" as const },
      { id: "stage", label: "Stage" },
    ],
    fields: [
      {
        id: "stage",
        label: "Stage",
        icon: {} as never,
        options: [{ value: "won", label: "Won" }],
      },
    ],
  };
  it("writes a query as a sentence", () => {
    expect(dashboardQueryText(dashboardEmptyQuery, catalog)).toBe("Pick a measure");
    const query: DashboardQuery = {
      measure: "revenue",
      aggregation: "sum",
      groupBy: "created",
      interval: "week",
      filters: [{ field: "stage", operator: "is", values: ["won"] }],
    };
    expect(dashboardQueryText(query, catalog)).toBe(
      "Sum of Revenue, by Created per week, where Stage is Won",
    );
  });
});

describe("charts", () => {
  it("funnel: bars, conversion text and a table", () => {
    const out = html(
      h(Funnel, {
        title: "Pipeline",
        items: [
          { label: "Lead", value: 200 },
          { label: "Won", value: 20 },
        ],
        highlight: "Won",
      }),
    );
    expect(out).toContain("Pipeline");
    expect(out).toContain("10%");
    expect(out).toContain("Overall");
    expect(out).toContain("fg-dash-hi");
    expect(out).toContain("<table");
    expect(out).toContain("Of the stage before");
  });

  it("donut: a key with swatch, value and share, and a table", () => {
    const out = html(
      h(Donut, {
        title: "By source",
        items: [
          { label: "Web", value: 60 },
          { label: "Mail", value: 40 },
        ],
      }),
    );
    expect(out).toContain("Web");
    expect(out).toContain("60%");
    expect(out).toContain("fg-dash-swatch");
    expect(out).toContain("<table");
    expect(out).toContain("<path");
  });

  it("gauge: a meter with its state in words", () => {
    const out = html(h(Gauge, { title: "Quota", value: 80, target: 100 }));
    expect(out).toContain('role="meter"');
    expect(out).toContain('aria-valuenow="80"');
    expect(out).toContain("Close");
    expect(out).toContain("80%");
  });

  it("stacked bar: both orientations, a legend, a table", () => {
    const props = {
      title: "Tickets",
      series: [
        { key: "open", label: "Open" },
        { key: "done", label: "Done" },
      ],
      items: [{ label: "Mon", values: { open: 3, done: 5 } }],
    };
    const horizontal = html(h(StackedBar, props));
    expect(horizontal).toContain("Open");
    expect(horizontal).toContain('aria-pressed="true"');
    expect(horizontal).toContain("<table");
    expect(html(h(StackedBar, { ...props, orientation: "vertical" }))).toContain("fg-dash-stack-v");
  });

  it("heatmap: a labelled grid of cells, matrix and calendar", () => {
    const matrix = html(
      h(Heatmap, {
        title: "Activity",
        rows: ["Sales", "Ops"],
        columns: ["Mon", "Tue"],
        values: [
          [1, 4],
          [0, 2],
        ],
        unit: "activities",
      }),
    );
    expect(matrix).toContain('role="grid"');
    expect(matrix).toContain("Sales · Tue: 4 activities");
    expect(matrix).toContain("fg-dash-l4");
    const calendar = html(
      h(Heatmap, {
        title: "Commits",
        items: [{ date: "2026-11-04", value: 3 }],
        from: "2026-11-04",
        to: "2026-11-15",
      }),
    );
    expect(calendar).toContain("Nov 4: 3");
    expect(calendar).toContain("fg-dash-hc-none");
  });

  it("heatmap: the arrows walk the cells", async () => {
    const el = await mount(
      h(Heatmap, {
        title: "Activity",
        rows: ["Sales", "Ops"],
        columns: ["Mon", "Tue"],
        values: [
          [1, 4],
          [0, 2],
        ],
      }),
    );
    const cells = () => [...el.querySelectorAll<HTMLElement>('[role="gridcell"]')];
    expect(
      cells()
        .find((c) => c.tabIndex === 0)!
        .getAttribute("aria-label"),
    ).toBe("Sales · Mon: 1");
    await key(el.querySelector('[role="grid"]')!, "ArrowRight");
    expect(el.querySelector("output")!.textContent).toBe("Sales · Tue: 4");
    await key(el.querySelector('[role="grid"]')!, "ArrowDown");
    expect(el.querySelector("output")!.textContent).toBe("Ops · Tue: 2");
  });
});

describe("DeltaBadge", () => {
  it("says the sign, the arrow and the word, whatever the colour", () => {
    const good = html(h(DeltaBadge, { delta: 0.124, value: "€48k", hint: "vs last month" }));
    expect(good).toContain("+12.4%");
    expect(good).toContain("Better");
    expect(good).toContain("fg-dash-delta-good");
    expect(good).toContain("up, ");
    const bad = html(h(DeltaBadge, { delta: 0.09, better: "down" }));
    expect(bad).toContain("Worse");
    expect(bad).toContain("fg-dash-delta-bad");
    const down = html(h(DeltaBadge, { delta: -0.06, better: "down" }));
    expect(down).toContain("−6%".replace("−6%", "−6.0%").replace(".0", ""));
    expect(down).toContain("Better");
    expect(html(h(DeltaBadge, { delta: 0 }))).toContain("Flat");
    expect(html(h(DeltaBadge, { delta: null }))).toContain("No comparison");
    const quiet = html(h(DeltaBadge, { delta: 0.1, showWord: false }));
    expect(quiet).not.toContain("fg-dash-delta-word");
    expect(quiet).toContain("Better");
  });
});

describe("WidgetFrame", () => {
  it("shows the content, then loading, error with retry, empty", async () => {
    const retry = vi.fn<() => void>();
    const el = await mount(
      h(
        WidgetFrame,
        { title: "Revenue", subtitle: "Last 30 days", onRetry: retry },
        h("p", {}, "content"),
      ),
    );
    expect(el.querySelector("h3")!.textContent).toBe("Revenue");
    expect(el.textContent).toContain("content");
    await act(async () =>
      reactRoot!.render(h(WidgetFrame, { title: "Revenue", loading: true }, "content")),
    );
    expect(el.querySelector('[role="status"]')!.textContent).toContain("Loading");
    expect(el.textContent).not.toContain("content");
    await act(async () =>
      reactRoot!.render(
        h(WidgetFrame, { title: "Revenue", error: "Timed out", onRetry: retry }, "content"),
      ),
    );
    expect(el.querySelector('[role="alert"]')!.textContent).toContain("Timed out");
    const button = [...el.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Retry"),
    )!;
    await act(async () => button.click());
    expect(retry).toHaveBeenCalledOnce();
    await act(async () =>
      reactRoot!.render(
        h(WidgetFrame, { title: "Revenue", empty: true, emptyText: "Nothing yet" }, "content"),
      ),
    );
    expect(el.textContent).toContain("Nothing yet");
  });

  it("opens in a dialog, full size", async () => {
    const el = await mount(
      h(WidgetFrame, { title: "Revenue", expandable: true }, h("p", {}, "content")),
    );
    const open = el.querySelector<HTMLButtonElement>('button[aria-label="Open full size"]')!;
    await act(async () => open.click());
    expect(document.querySelector('[role="dialog"]')).not.toBeNull();
    expect(el.querySelector('button[aria-label="Close full size"]')).not.toBeNull();
    await key(document.querySelector('[role="dialog"]')!, "Escape");
    expect(document.querySelector('[role="dialog"]')).toBeNull();
  });
});

describe("WidgetGrid", () => {
  const widgets = [
    { id: "a", label: "Revenue", content: h("p", {}, "A") },
    { id: "b", label: "Leads", content: h("p", {}, "B") },
    { id: "c", label: "Funnel", content: h("p", {}, "C"), locked: true },
  ];
  const start = [at("a", 0, 0, 4, 2), at("b", 4, 0, 4, 2), at("c", 8, 0, 4, 2)];

  it("places widgets from a layout and lists new ones in it", async () => {
    const onLayoutChange = vi.fn<(layout: WidgetLayout[]) => void>();
    const el = await mount(
      h(WidgetGrid, { widgets, layout: [at("a", 0, 0, 6, 2)], onLayoutChange }),
    );
    const cells = [...el.querySelectorAll<HTMLElement>(".fg-dash-cell")];
    expect(cells).toHaveLength(3);
    expect(cells[0]!.style.getPropertyValue("--w")).toBe("6");
    expect(onLayoutChange).toHaveBeenCalled();
    const sent = onLayoutChange.mock.calls.at(-1)![0] as WidgetLayout[];
    expect(sent.map((i) => i.id).sort()).toEqual(["a", "b", "c"]);
  });

  it("has no edit controls until editing", async () => {
    const el = await mount(h(WidgetGrid, { widgets, defaultLayout: start }));
    expect(el.querySelector(".fg-dash-grab")).toBeNull();
    expect(el.querySelector("[inert]")).toBeNull();
  });

  it("moves with the arrows and resizes with Shift, pushing the rest down", async () => {
    const onLayoutChange = vi.fn<(layout: WidgetLayout[]) => void>();
    const el = await mount(
      h(WidgetGrid, {
        widgets,
        defaultLayout: start,
        defaultEditing: true,
        onLayoutChange,
        onRemoveWidget: () => {},
      }),
    );
    const grabs = [...el.querySelectorAll<HTMLElement>(".fg-dash-grab")];
    expect(grabs).toHaveLength(2);
    expect(el.querySelector("[inert]")).not.toBeNull();
    await key(grabs[0]!, "ArrowRight");
    let last = onLayoutChange.mock.calls.at(-1)![0] as WidgetLayout[];
    expect(last.find((i) => i.id === "a")).toMatchObject({ x: 1, w: 4 });
    expect(last.find((i) => i.id === "b")!.y).toBe(2);
    expect(el.querySelector('[role="status"]')!.textContent).toBe(
      "Revenue: column 2, row 1, 4 wide, 2 tall",
    );
    await key(grabs[0]!, "ArrowDown", { shiftKey: true });
    last = onLayoutChange.mock.calls.at(-1)![0] as WidgetLayout[];
    expect(last.find((i) => i.id === "a")!.h).toBe(3);
    for (const i of last) for (const j of last) expect(dashboardCollides(i, j)).toBe(false);
  });

  it("removes and adds through hooks", async () => {
    const onRemoveWidget = vi.fn<(id: string) => void>();
    const onAddWidget = vi.fn<() => void>();
    const el = await mount(
      h(WidgetGrid, { widgets, defaultLayout: start, editing: true, onRemoveWidget, onAddWidget }),
    );
    await act(async () =>
      el.querySelector<HTMLButtonElement>('button[aria-label="Remove Leads"]')!.click(),
    );
    expect(onRemoveWidget).toHaveBeenCalledWith("b");
    const add = [...el.querySelectorAll("button")].find((b) =>
      b.textContent?.includes("Add widget"),
    )!;
    await act(async () => add.click());
    expect(onAddWidget).toHaveBeenCalledOnce();
    await key(el.querySelector(".fg-dash-grab")!, "Delete");
    expect(onRemoveWidget).toHaveBeenCalledWith("a");
  });

  it("is a single column under the collapse width", async () => {
    const original = globalThis.ResizeObserver;
    class Narrow {
      constructor(private cb: (entries: unknown[]) => void) {}
      observe() {
        this.cb([{ contentRect: { width: 400 } }]);
      }
      disconnect() {}
    }
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = Narrow;
    try {
      const el = await mount(h(WidgetGrid, { widgets, defaultLayout: start, editing: true }));
      expect(el.querySelector(".fg-dash-grid-stack")).not.toBeNull();
      expect(el.querySelector(".fg-dash-size")).toBeNull();
    } finally {
      (globalThis as { ResizeObserver?: unknown }).ResizeObserver = original;
    }
  });
});

describe("DateRangeCompare", () => {
  it("offers the comparisons and hears the two ranges", async () => {
    const onChange = vi.fn<(period: DashboardPeriod, ranges: DashboardRanges) => void>();
    const el = await mount(
      h(DateRangeCompare, {
        today: "2026-11-18",
        defaultValue: {
          range: { from: "2026-11-01", to: "2026-11-30" },
          compare: "none",
        },
        onChange,
      }),
    );
    const select = el.querySelector<HTMLSelectElement>("select")!;
    expect([...select.options].map((o) => o.value)).toEqual([
      "none",
      "previous-period",
      "previous-year",
      "custom",
    ]);
    await act(async () => {
      select.value = "previous-year";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const [period, ranges] = onChange.mock.calls.at(-1)!;
    expect(period.compare).toBe("previous-year");
    expect(ranges.previous).toEqual({ from: "2025-11-01", to: "2025-11-30" });
    expect(el.querySelector(".fg-dash-compare-sum")!.textContent).toContain("vs Nov 1, 2025");
    await act(async () => {
      select.value = "custom";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(el.querySelectorAll(".fg-range-trigger")).toHaveLength(2);
  });
});

describe("MetricPicker", () => {
  const measures = [
    { id: "revenue", label: "Revenue", aggregations: ["sum", "avg"] as const },
    { id: "tickets", label: "Tickets", aggregations: ["count"] as const },
  ];
  const groupings = [
    { id: "created", label: "Created", kind: "time" as const },
    { id: "owner", label: "Owner" },
  ];

  it("shows the sentence of its value and the slice of time for a time grouping", async () => {
    const seen: DashboardQuery[] = [];
    function Host() {
      const [query, setQuery] = useState<DashboardQuery>({
        ...dashboardEmptyQuery,
        measure: "revenue",
        aggregation: "sum",
        groupBy: "created",
      });
      return h(MetricPicker, {
        measures: measures.map((m) => ({ ...m, aggregations: [...m.aggregations] })),
        groupings,
        value: query,
        onChange: (next: DashboardQuery) => {
          seen.push(next);
          setQuery(next);
        },
      });
    }
    const el = await mount(h(Host));
    expect(el.querySelector(".fg-dash-mp-sum")!.textContent).toBe(
      "Sum of Revenue, by Created per month",
    );
    const week = [...el.querySelectorAll<HTMLButtonElement>(".fg-seg-item")].find(
      (b) => b.textContent === "week",
    )!;
    await act(async () => week.click());
    expect(seen.at(-1)!.interval).toBe("week");
    expect(el.querySelector(".fg-dash-mp-sum")!.textContent).toContain("per week");
    const select = el.querySelector<HTMLSelectElement>("select")!;
    await act(async () => {
      select.value = "avg";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(seen.at(-1)!.aggregation).toBe("avg");
  });

  it("starts without a measure and says so", async () => {
    const el = await mount(
      h(MetricPicker, {
        measures: measures.map((m) => ({ ...m, aggregations: [...m.aggregations] })),
        groupings,
      }),
    );
    expect(el.querySelector(".fg-dash-mp-sum")!.textContent).toBe("Pick a measure");
    expect(el.querySelector("select")).toBeNull();
  });
});

describe("parts of the dashboard blocks", () => {
  it("WidgetFrame: a layout of parts, with the rest and the states of the root", async () => {
    const el = await mount(
      h(
        WidgetFrame,
        {
          title: "Revenue",
          subtitle: "30 days",
          error: "Timed out",
          className: "mine",
          "data-x": "1",
        } as never,
        h(
          WidgetFrameHeader,
          null,
          h(WidgetFrameTitles),
          h(WidgetFrameTools, null, h(WidgetFrameExpand)),
        ),
        h(WidgetFrameContent, null, h(WidgetFrameBody, { className: "body" }, "chart")),
      ),
    );
    const frame = el.querySelector<HTMLElement>('[data-slot="widget-frame"]')!;
    expect(frame.className).toContain("mine");
    expect(frame.getAttribute("data-x")).toBe("1");
    expect(el.querySelector("h3")!.textContent).toBe("Revenue");
    expect(el.querySelector(".fg-dash-frame-sub")!.textContent).toBe("30 days");
    expect(el.querySelector(".body")!.textContent).toContain("Timed out");
    expect(el.textContent).not.toContain("chart");
    expect(el.querySelector(".fg-dash-frame-tools")!.children).toHaveLength(0);
  });

  it("WidgetGrid: the parts alone, an item and its grab", async () => {
    const widgets = [
      { id: "a", label: "Revenue", content: h("p", {}, "A") },
      { id: "b", label: "Leads", content: h("p", {}, "B") },
    ];
    const el = await mount(
      h(
        WidgetGrid,
        {
          widgets,
          defaultLayout: [at("a", 0, 0, 4, 2), at("b", 4, 0, 4, 2)],
          editing: true,
          className: "mine",
          "data-x": "1",
        } as never,
        h(WidgetGridEditBar),
        h(WidgetGridCanvas, null, ((widget: { id: string }) =>
          h(
            WidgetGridItem,
            { id: widget.id, className: "cell-" + widget.id },
            h(WidgetGridContent),
            h(WidgetGridGrab),
          )) as never),
        h(WidgetGridStatus),
      ),
    );
    const grid = el.querySelector<HTMLElement>('[data-slot="widget-grid"]')!;
    expect(grid.className).toContain("mine");
    expect(grid.getAttribute("data-x")).toBe("1");
    expect(el.querySelector(".cell-a")).not.toBeNull();
    expect(el.querySelectorAll(".fg-dash-grab")).toHaveLength(2);
    expect(el.querySelector(".fg-dash-size")).toBeNull();
    expect(el.querySelector(".fg-dash-edithint")).not.toBeNull();
    const grab = el.querySelector<HTMLElement>(".fg-dash-grab")!;
    await key(grab, "ArrowRight");
    expect(el.querySelector('[role="status"]')!.textContent).toContain("Revenue");
  });

  it("DateRangeCompare: the period and its summary as parts", async () => {
    const el = await mount(
      h(
        DateRangeCompare,
        {
          today: "2026-11-20",
          defaultValue: {
            range: { from: "2026-11-01", to: "2026-11-30" },
            compare: "previous-period",
          },
          "data-x": "1",
        } as never,
        h(DateRangeComparePeriod),
        h(DateRangeCompareSummary),
      ),
    );
    expect(el.querySelector('[data-slot="date-range-compare"]')!.getAttribute("data-x")).toBe("1");
    expect(el.querySelector(".fg-dash-compare-vs")).toBeNull();
    expect(el.querySelector(".fg-dash-compare-sum")!.textContent).toContain("vs");
  });

  it("MetricPicker: parts and the sentence", async () => {
    const el = await mount(
      h(
        MetricPicker,
        {
          measures: [{ id: "deals", label: "Deals" }],
          groupings: [{ id: "owner", label: "Owner" }],
          defaultValue: { ...dashboardEmptyQuery, measure: "deals" },
          "data-x": "1",
        } as never,
        h(MetricPickerSteps, null, h(MetricPickerMeasure)),
        h(MetricPickerSummary),
      ),
    );
    expect(el.querySelector('[data-slot="metric-picker"]')!.getAttribute("data-x")).toBe("1");
    expect(el.querySelectorAll(".fg-dash-mp-step")).toHaveLength(1);
    expect(el.querySelector(".fg-dash-mp-sum")!.textContent).toContain("Deals");
  });
});
