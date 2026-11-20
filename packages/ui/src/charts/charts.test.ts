// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import {
  BulletChart,
  DivergingBar,
  Dumbbell,
  Histogram,
  LineChart,
  Waterfall,
  dashboardExtent,
  dashboardHistogram,
  dashboardNiceStep,
  dashboardQuantile,
  dashboardWaterfall,
  ChartContainer,
  ChartTooltip,
  ColumnChart,
  StatusStrip,
  Waffle,
  dashboardBullet,
  dashboardStatusSummary,
  dashboardWaffle,
  type ChartConfig,
} from "../index";
import { columnLayout } from "./column-chart";
import { placeMarkers } from "./markers";
import { dashboardWaterfallFloor } from "./model";
import { dashSeriesIndexes } from "./parts";

// ColumnChart, Waffle, StatusStrip, BulletChart, Waterfall, Dumbbell, DivergingBar, Histogram and
// the markers of the time charts, and the arithmetic under them.

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const mounted: Array<() => void> = [];
afterEach(() => {
  for (const un of mounted.splice(0)) un();
});
function mount(node: ReturnType<typeof h>) {
  const el = document.createElement("div");
  document.body.append(el);
  const root = createRoot(el);
  act(() => root.render(node));
  mounted.push(() => {
    act(() => root.unmount());
    el.remove();
  });
  return el;
}
const key = (el: Element, k: string) =>
  act(() => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
  });

describe("dashboardWaffle", () => {
  it("gives every square to a slice, by largest remainder", () => {
    const counts = dashboardWaffle([412, 238, 126, 74]);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(100);
    expect(counts).toEqual([48, 28, 15, 9]);
  });
  it("keeps one square for a small slice and none for nothing", () => {
    expect(dashboardWaffle([1000, 1, 0])).toEqual([99, 1, 0]);
    expect(dashboardWaffle([0, 0])).toEqual([0, 0]);
    expect(dashboardWaffle([-3, Number.NaN, 2])).toEqual([0, 0, 100]);
  });
  it("adds up to any grid size", () => {
    const counts = dashboardWaffle([1, 1, 1], 20);
    expect(counts.reduce((a, b) => a + b, 0)).toBe(20);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });
});

describe("dashboardStatusSummary", () => {
  it("counts the states and the share up, ignoring periods without data", () => {
    const s = dashboardStatusSummary([
      { status: "ok" },
      { status: "ok" },
      { status: "degraded" },
      { status: "down" },
      { status: "none" },
    ]);
    expect(s).toMatchObject({ ok: 2, degraded: 1, down: 1, none: 1 });
    expect(s.up).toBe(0.75);
    expect(dashboardStatusSummary([]).up).toBe(1);
  });
});

describe("dashboardBullet", () => {
  it("ends the scale at the last band and places value and target on it", () => {
    const s = dashboardBullet(50, { target: 75, bands: [100, 25, 50] });
    expect(s.max).toBe(100);
    expect(s.bands).toEqual([0.25, 0.5, 1]);
    expect(s.value).toBe(0.5);
    expect(s.target).toBe(0.75);
    expect(s.ofTarget).toBeCloseTo(2 / 3);
  });
  it("leaves room above value and target when there is no band, and clamps", () => {
    const s = dashboardBullet(120, { target: 100 });
    expect(s.max).toBe(144);
    expect(dashboardBullet(500, { max: 100 }).value).toBe(1);
    expect(dashboardBullet(10, {}).target).toBeNull();
  });
});

describe("dashSeriesIndexes", () => {
  it("leaves ember to the highlighted item alone", () => {
    const ks = dashSeriesIndexes(["a", "b", "c", "d", "e", "f"], "c");
    expect(ks[2]).toBe(0);
    // Patterns 0 and 3 are the ember ones.
    expect(ks.filter((k, i) => i !== 2 && (k === 0 || k === 3))).toEqual([]);
  });
});

describe("ColumnChart", () => {
  const points = ["W1", "W2", "W3", "W4"].map((label, i) => ({ label, value: (i + 1) * 10 }));

  it("lays columns out inside their slots, from zero, with a gap", () => {
    const cols = columnLayout([0, 20, 40], 60, 50, 40, 6);
    expect(cols.map((c) => c.h)).toEqual([0, 22, 43]);
    for (const c of cols) {
      expect(c.x).toBeGreaterThanOrEqual(c.slot.x);
      expect(c.x + c.w).toBeLessThanOrEqual(c.slot.x + c.slot.w);
      expect(c.w).toBeLessThan(c.slot.w);
    }
  });
  it("reads the highlighted column first and says target and previous in its key and table", () => {
    const out = html(
      h(ColumnChart, {
        title: "Deploys",
        points,
        previous: [5, 5, 5, 5],
        target: 25,
        highlight: "W2",
      }),
    );
    expect(out).toMatch(/fg-line-readout[^>]*>.*W2.*<b>20<\/b>/);
    expect(out).toContain("fg-cols-key");
    expect(out).toContain("Target <b>25</b>");
    expect(out).toContain("Deploys, target 25");
    expect(out).toContain('<th scope="col">Before</th>');
  });
  it("walks the columns with the arrows and reports them to the tooltip", () => {
    const config: ChartConfig = { runs: { label: "Runs" } };
    const el = mount(
      h(
        ChartContainer,
        { config },
        h(ColumnChart, { title: "Runs", points, dataKey: "runs" }),
        h(ChartTooltip),
      ),
    );
    const plot = el.querySelector<HTMLElement>(".fg-line-plot")!;
    act(() => plot.focus());
    key(plot, "Home");
    expect(el.querySelector(".fg-line-readout")!.textContent).toContain("W1");
    key(plot, "ArrowRight");
    expect(el.querySelector(".fg-chart-tip")!.textContent).toContain("W2");
    expect(el.querySelector(".fg-chart-tip")!.textContent).toContain("Runs");
    expect(el.querySelector(".fg-cols")!.getAttribute("style")).toContain("--color-runs");
  });
});

describe("Waffle", () => {
  const items = [
    { label: "Email", value: 3 },
    { label: "Chat", value: 1 },
  ];
  it("draws one square per share and a key with value and share", () => {
    const out = html(h(Waffle, { title: "Channels", items, cells: 20 }));
    expect(out.match(/fg-dash-waffle-cell/g)).toHaveLength(20);
    expect(out.match(/fg-dash-s0/g)!.length).toBeGreaterThanOrEqual(15);
    expect(out).toContain("75%");
    expect(out).toContain("One square is 5% of 4.");
  });
  it("spotlights a slice from the key and dims the others", () => {
    const el = mount(h(Waffle, { title: "Channels", items, cells: 4 }));
    const chat = [...el.querySelectorAll("button")].find((b) => b.textContent?.includes("Chat"))!;
    act(() => chat.click());
    expect(chat.getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelectorAll(".fg-dash-waffle-cell.fg-dash-dim")).toHaveLength(3);
  });
});

describe("StatusStrip", () => {
  const items = [
    { label: "Mon", status: "ok" as const },
    { label: "Tue", status: "down" as const, note: "Outage" },
    { label: "Wed", status: "degraded" as const },
    { label: "Thu", status: "none" as const },
  ];
  it("says the share up, counts each state in its key and gives every period in a table", () => {
    const out = html(h(StatusStrip, { title: "API", items }));
    expect(out).toContain("66.7% up");
    expect(out).toMatch(/Down <b>1<\/b>/);
    expect(out).not.toMatch(/No data <b>/);
    expect(out).toContain("<td>Outage</td>");
  });
  it("reads a period with the arrows, in its own words", () => {
    const el = mount(h(StatusStrip, { title: "Runs", items, labels: { down: "Failed" } }));
    const strip = el.querySelector<HTMLElement>(".fg-strip-cells")!;
    key(strip, "Home");
    key(strip, "ArrowRight");
    const readout = el.querySelector(".fg-line-readout")!.textContent;
    expect(readout).toContain("Tue");
    expect(readout).toContain("Failed");
    expect(readout).toContain("Outage");
    expect(el.querySelectorAll(".fg-strip-active")).toHaveLength(1);
  });
});

describe("BulletChart", () => {
  it("is a meter per row that says the value, the target and the share of it", () => {
    const out = html(
      h(BulletChart, {
        title: "Quarter",
        items: [
          { label: "NPS", value: 38, target: 45, bands: [20, 40, 60] },
          { label: "Deals", value: 41, target: 36 },
        ],
      }),
    );
    expect(out.match(/role="meter"/g)).toHaveLength(2);
    expect(out).toContain('aria-valuetext="38, target 45, 84% of it"');
    expect(out.match(/fg-bullet-band /g)).toHaveLength(3);
    expect(out).toContain("fg-bullet-met");
    expect(out).toContain("✓ 114%");
  });
});

describe("dashboardWaterfall", () => {
  const start = { label: "Oct", value: 100 };
  const steps = [
    { label: "New", value: 30 },
    { label: "Churn", value: -50 },
    { label: "Sub", value: 0 },
    { label: "Upsell", value: 0.1 },
  ];
  it("floats each step from the running total and ends on a total", () => {
    const { bars, min, max, total } = dashboardWaterfall(start, steps, { totals: ["Sub"] });
    expect(bars.map((b) => [b.label, b.kind, b.from, b.to])).toEqual([
      ["Oct", "total", 0, 100],
      ["New", "up", 100, 130],
      ["Churn", "down", 130, 80],
      ["Sub", "total", 0, 80],
      ["Upsell", "up", 80, 80.1],
      ["End", "total", 0, 80.1],
    ]);
    expect([min, max, total]).toEqual([0, 130, 80.1]);
  });
  it("holds zero when the total goes below it, and can leave the end out", () => {
    const { bars, min } = dashboardWaterfall(start, [{ label: "Loss", value: -140 }], {
      end: false,
    });
    expect(bars).toHaveLength(2);
    expect(min).toBe(-40);
  });
  it("starts the scale under the lowest level only when the changes are small", () => {
    const small = dashboardWaterfall({ label: "A", value: 48200 }, [{ label: "B", value: 3300 }]);
    const floor = dashboardWaterfallFloor(small.bars, small.max);
    expect(floor).toBeGreaterThan(0);
    expect(floor).toBeLessThan(48200);
    const big = dashboardWaterfall({ label: "A", value: 100 }, [{ label: "B", value: 90 }]);
    expect(dashboardWaterfallFloor(big.bars, big.max)).toBe(0);
  });
});

describe("distribution", () => {
  it("rounds a step to the nearest 1, 2 or 5", () => {
    expect([0.13, 3, 4, 30, 80, 0].map(dashboardNiceStep)).toEqual([0.1, 2, 5, 20, 100, 1]);
  });
  it("interpolates quantiles and ignores what is not a number", () => {
    expect(dashboardQuantile([4, 1, 3, 2, Number.NaN], 0.5)).toBe(2.5);
    expect(dashboardQuantile([10, 20], 0.95)).toBeCloseTo(19.5);
    expect(dashboardQuantile([], 0.5)).toBeNaN();
  });
  it("counts every value in round bins, the top one included", () => {
    const bins = dashboardHistogram([0, 1, 9, 10, 10], { bins: 5 });
    expect(bins.map((b) => b.from)).toEqual([0, 2, 4, 6, 8]);
    expect(bins.reduce((sum, b) => sum + b.count, 0)).toBe(5);
    expect(bins[4]!.count).toBe(3);
    expect(dashboardHistogram([])).toEqual([]);
    expect(dashboardHistogram([5, 5])).toHaveLength(1);
  });
  it("gives a scale room around the values, or holds zero", () => {
    const [lo, hi] = dashboardExtent([10, 20]);
    expect(lo).toBeLessThan(10);
    expect(hi).toBeGreaterThan(20);
    expect(dashboardExtent([10, 20], { zero: true })[0]).toBe(0);
    expect(dashboardExtent([3, 3])).toEqual([1.88, 4.12]);
  });
});

describe("markers", () => {
  it("number the events in order and drop those on no point", () => {
    const placed = placeMarkers(
      [
        { at: "W2", label: "Launch" },
        { at: "W9", label: "Lost" },
        { at: "W1", label: "Beta" },
      ],
      ["W1", "W2", "W3"],
    );
    expect(placed.map((m) => [m.n, m.index, m.label])).toEqual([
      [1, 1, "Launch"],
      [3, 0, "Beta"],
    ]);
  });
  it("are flagged on the line chart, keyed under it and read with their point", () => {
    const el = mount(
      h(LineChart, {
        title: "Signups",
        points: [
          { label: "W1", value: 1 },
          { label: "W2", value: 2 },
        ],
        markers: [{ at: "W1", label: "Beta opens" }],
      }),
    );
    expect(el.querySelectorAll(".fg-mark")).toHaveLength(1);
    expect(el.querySelector(".fg-mark-key")!.textContent).toContain("W1Beta opens");
    const plot = el.querySelector<HTMLElement>(".fg-line-plot")!;
    key(plot, "Home");
    expect(el.querySelector(".fg-line-readout")!.textContent).toContain("Beta opens");
  });
  it("sit above the status strip", () => {
    const out = html(
      h(StatusStrip, {
        title: "API",
        items: [{ label: "Mon", status: "ok" }],
        markers: [{ at: "Mon", label: "Deploy" }],
      }),
    );
    expect(out).toContain("fg-strip-flagged");
    expect(out).toContain("Deploy");
  });
});

describe("Waterfall", () => {
  it("writes signed steps, tones them by which way is good, and says when the scale is cut", () => {
    const out = html(
      h(Waterfall, {
        title: "Costs",
        start: { label: "Q3", value: 48200 },
        steps: [
          { label: "Cloud", value: 2100 },
          { label: "Tools", value: -1300 },
        ],
        better: "down",
        end: "Q4",
      }),
    );
    expect(out).toContain("+2100");
    expect(out).toContain("−1300");
    expect(out).toMatch(/fg-fall-up fg-fall-bad/);
    expect(out).toMatch(/fg-fall-down fg-fall-good/);
    expect(out).toContain("the totals are cut");
    expect(out).toContain("fg-fall-cut");
    expect(out).toMatch(/Q3 → Q4.*<b>\+800<\/b>/);
  });
  it("reads a bar with the arrows: its change and where the total stands", () => {
    const el = mount(
      h(Waterfall, {
        title: "MRR",
        start: { label: "Oct", value: 10 },
        steps: [{ label: "New", value: 5 }],
      }),
    );
    const plot = el.querySelector<HTMLElement>(".fg-fall-plot")!;
    key(plot, "ArrowRight");
    key(plot, "ArrowRight");
    const readout = el.querySelector(".fg-line-readout")!.textContent;
    expect(readout).toContain("New");
    expect(readout).toContain("+5");
    expect(readout).toContain("→ 15");
  });
});

describe("Dumbbell", () => {
  it("writes the change without float noise, toned by which way is good", () => {
    const out = html(
      h(Dumbbell, {
        title: "Response",
        better: "down",
        items: [
          { label: "Onboarding", from: 9.8, to: 5.1 },
          { label: "Sales", from: 2.4, to: 3.9 },
        ],
      }),
    );
    expect(out).toContain("−4.7");
    expect(out).not.toContain("4.70000");
    expect(out).toMatch(/fg-bell-row fg-bell-good.*Onboarding/);
    expect(out).toMatch(/fg-bell-row fg-bell-bad.*Sales/);
  });
  it("sorts by the size of the change", () => {
    const out = html(
      h(Dumbbell, {
        title: "T",
        sort: "change",
        items: [
          { label: "Small", from: 1, to: 2 },
          { label: "Big", from: 1, to: 9 },
        ],
      }),
    );
    expect(out.indexOf("Big")).toBeLessThan(out.indexOf("Small"));
  });
});

describe("DivergingBar", () => {
  it("names its sides and sends each bar the right way from the middle", () => {
    const out = html(
      h(DivergingBar, {
        title: "Budget",
        sides: ["Under", "Over"],
        better: "down",
        items: [
          { label: "Eng", value: 4 },
          { label: "Ops", value: -2 },
        ],
      }),
    );
    expect(out).toContain("← Under");
    expect(out).toContain("Over →");
    expect(out).toMatch(/fg-div-up fg-div-bad.*left:50%;width:50%/);
    expect(out).toMatch(/fg-div-down fg-div-good.*right:50%;width:25%/);
    expect(out).toContain("−2");
  });
});

describe("Histogram", () => {
  it("says its quantiles and the share past the threshold", () => {
    const values = Array.from({ length: 100 }, (_, i) => i + 1);
    const out = html(
      h(Histogram, { title: "Latency", values, unit: "requests", threshold: 91, bins: 10 }),
    );
    expect(out).toContain("p50 <b>50.5</b>");
    expect(out).toContain("p95 <b>95.05</b>");
    expect(out).toMatch(/over 91.*<b>10%<\/b>/);
    expect(out).toContain("<b>100</b>");
  });
});
