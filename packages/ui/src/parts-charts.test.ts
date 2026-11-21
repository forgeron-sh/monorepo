// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import {
  BarChart,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
  Donut,
  DonutCenter,
  DonutKey,
  DonutRing,
  Funnel,
  Heatmap,
  KpiRow,
  KpiRowItem,
  LineChart,
  StackedBar,
  StackedBarBars,
  StackedBarKey,
  StatusStrip,
  Waffle,
  WaffleGrid,
  WaffleKey,
  WaffleNote,
  Waterfall,
  type ChartConfig,
} from "./index";

// shadcn's Chart parts around our pixel charts (D-157).

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const config: ChartConfig = {
  views: { label: "Views", color: "var(--danger)" },
  visits: { label: "Visits" },
};
const points = [
  { label: "Mon", value: 3 },
  { label: "Tue", value: 5 },
];

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

describe("ChartContainer", () => {
  it("sets one colour variable per key, the config's or a default", () => {
    const out = html(h(ChartContainer, { config }, h("span")));
    expect(out).toContain("--color-views:var(--danger)");
    expect(out).toContain("--color-visits:var(--ink)");
    expect(out).toContain("--fg-series-0:var(--color-views)");
  });
  it("colours a chart by its dataKey and leaves it alone outside", () => {
    const inside = html(
      h(ChartContainer, { config }, h(LineChart, { title: "T", points, dataKey: "visits" })),
    );
    expect(inside).toContain("--fg-chart-c:var(--color-visits)");
    expect(html(h(LineChart, { title: "T", points }))).not.toContain("--fg-chart-c");
    expect(html(h(BarChart, { title: "T", data: [{ label: "a", value: 1 }] }))).not.toContain(
      "--fg-bar-series",
    );
  });
});

describe("ChartTooltip", () => {
  it("shows what a chart reports, with the config's label", () => {
    const el = mount(
      h(
        ChartContainer,
        { config },
        h(LineChart, { title: "Traffic", points, dataKey: "views" }),
        h(ChartTooltip, { content: h(ChartTooltipContent, { indicator: "line" }) }),
      ),
    );
    expect(el.querySelector(".fg-chart-tip")).toBeNull();
    const plot = el.querySelector<HTMLElement>(".fg-line-plot")!;
    act(() => {
      plot.focus();
      plot.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowLeft", bubbles: true }));
    });
    const tip = el.querySelector(".fg-chart-tip")!;
    expect(tip.textContent).toContain("Mon");
    expect(tip.textContent).toContain("Views");
    expect(tip.querySelector(".fg-chart-tip-line")).not.toBeNull();
  });
  it("hides the label and the indicator on request", () => {
    const out = html(
      h(
        ChartContainer,
        { config },
        h(ChartTooltipContent, {
          payload: [{ dataKey: "views", value: 4 }],
          label: "Mon",
          hideLabel: true,
          hideIndicator: true,
        }),
      ),
    );
    expect(out).not.toContain("fg-chart-tip-label");
    expect(out).not.toContain("fg-chart-tip-mark");
    expect(out).toContain("Views");
  });
  it("is reported by the donut and the stacked bar too", () => {
    const out = html(
      h(
        ChartContainer,
        { config },
        h(Donut, { title: "Share", items: [{ label: "views", value: 2 }] }),
        h(StackedBar, {
          title: "S",
          series: [{ key: "views", label: "Views" }],
          items: [{ label: "A", values: { views: 1 } }],
        }),
      ),
    );
    expect(out).toContain("fg-dash-donut");
    expect(out).toContain("fg-dash-stack");
  });
});

describe("ChartLegend", () => {
  it("lists the series of the config", () => {
    const out = html(
      h(ChartContainer, { config }, h(ChartLegend, { content: h(ChartLegendContent) })),
    );
    expect(out).toContain("Views");
    expect(out).toContain("Visits");
    expect(out).toContain("--fg-mark:var(--color-views)");
  });
  it("takes an icon from the config", () => {
    const Icon = () => h("i", { className: "mine" });
    const out = html(
      h(ChartContainer, { config: { a: { label: "A", icon: Icon } } }, h(ChartLegend)),
    );
    expect(out).toContain('class="mine"');
  });
});

describe("every chart in a container", () => {
  const read = (el: HTMLElement) =>
    act(() => {
      el.dispatchEvent(new MouseEvent("pointermove", { bubbles: true, clientX: 1, clientY: 1 }));
    });
  it("passes its attributes and class through", () => {
    const out = html(
      h(Funnel, {
        title: "F",
        items: [{ label: "a", value: 1 }],
        id: "own",
        "data-x": "1",
        className: "mine",
      } as Parameters<typeof Funnel>[0]),
    );
    expect(out).toContain('id="own"');
    expect(out).toContain('data-x="1"');
    expect(out).toContain("mine");
    const heat = html(
      h(Heatmap, {
        title: "H",
        rows: ["a"],
        columns: ["x"],
        values: [[1]],
        id: "heat",
      }),
    );
    expect(heat).toContain('id="heat"');
    expect(heat).not.toContain("columns=");
  });
  it("reports the funnel's stage to the tooltip", () => {
    const el = mount(
      h(
        ChartContainer,
        { config },
        h(Funnel, {
          title: "Deals",
          dataKey: "views",
          items: [
            { label: "Lead", value: 10 },
            { label: "Won", value: 4 },
          ],
        }),
        h(ChartTooltip),
      ),
    );
    expect(el.querySelector(".fg-dash-funnel")!.getAttribute("style")).toContain(
      "--fg-chart-c: var(--color-views)",
    );
    read(el.querySelectorAll<HTMLElement>(".fg-dash-fun-row")[1]!);
    const tip = el.querySelector(".fg-chart-tip")!;
    expect(tip.textContent).toContain("Won");
    expect(tip.textContent).toContain("Views");
    expect(tip.textContent).toContain("40%");
  });
  it("reports the heatmap's cell when the keyboard reads it", () => {
    const el = mount(
      h(
        ChartContainer,
        { config },
        h(Heatmap, {
          title: "Load",
          rows: ["Support"],
          columns: ["9h", "10h"],
          values: [[3, 7]],
        }),
        h(ChartTooltip),
      ),
    );
    act(() => el.querySelectorAll<HTMLElement>("[role=gridcell]")[1]!.focus());
    const tip = el.querySelector(".fg-chart-tip")!;
    expect(tip.textContent).toContain("Support · 10h");
    expect(tip.textContent).toContain("7");
  });
  it("takes the colours of slices and states from the config", () => {
    const out = html(
      h(
        ChartContainer,
        {
          config: { Billing: { color: "red" }, down: { color: "black" }, good: { color: "blue" } },
        },
        h(Donut, {
          title: "D",
          items: [
            { label: "Billing", value: 2 },
            { label: "Other", value: 1 },
          ],
        }),
        h(Waffle, { title: "W", items: [{ label: "Billing", value: 2 }] }),
        h(StatusStrip, { title: "S", items: [{ label: "Mon", status: "down" }] }),
        h(Waterfall, { title: "F", start: { label: "Oct", value: 10 }, steps: [] }),
      ),
    );
    expect(out).toContain("fill:var(--color-Billing)");
    expect(out).toContain("--c:var(--color-Billing)");
    expect(out).toContain("--fg-strip-down:var(--color-down)");
    expect(out).toContain("--fg-tone-good:var(--color-good)");
  });
  it("leaves the colours alone outside a container", () => {
    const out = html(h(Donut, { title: "D", items: [{ label: "Billing", value: 2 }] }));
    expect(out).not.toContain("--color-");
  });
});

describe("Donut parts", () => {
  const rows = [
    { browser: "chrome", visitors: 3 },
    { browser: "safari", visitors: 1 },
  ];
  const browsers: ChartConfig = { chrome: { label: "Chrome", color: "red" }, safari: {} };
  it("reads shadcn's rows through dataKey and nameKey, names slices from the config", () => {
    const out = html(
      h(
        ChartContainer,
        { config: browsers },
        h(Donut, { title: "Visitors", data: rows, dataKey: "visitors", nameKey: "browser" }),
      ),
    );
    expect(out).toContain("Chrome");
    expect(out).toContain("75%");
    expect(out).toContain("fill:var(--color-chrome)");
    expect(out).toContain("fg-dash-legend");
    expect(out).toContain("<table");
  });
  it("lays the parts out as given, with the table always there", () => {
    const out = html(
      h(
        Donut,
        { title: "Visitors", data: rows, dataKey: "visitors", nameKey: "browser" },
        h(DonutKey, { hideShare: true }),
        h(DonutRing, { size: 80 }, h(DonutCenter, { label: "Visitors" })),
      ),
    );
    expect(out.indexOf("fg-dash-legend")).toBeLessThan(out.indexOf("fg-dash-ring"));
    expect(out).toContain("<small>Visitors</small>");
    expect(out).toContain('width="80"');
    expect(out).not.toContain("fg-dash-legend-share");
    expect(out).toContain("<table");
  });
  it("draws the same donut from items as before", () => {
    const items = [
      { label: "a", value: 1 },
      { label: "b", value: 3 },
    ];
    const plain = html(h(Donut, { title: "T", items, center: "Hi" }));
    const parts = html(
      h(Donut, { title: "T", items }, h(DonutRing, null, h(DonutCenter, null, "Hi")), h(DonutKey)),
    );
    expect(parts).toBe(plain);
  });
  it("spotlights a slice from the key", () => {
    const el = mount(
      h(Donut, {
        title: "T",
        items: [
          { label: "a", value: 1 },
          { label: "b", value: 3 },
        ],
      }),
    );
    act(() => el.querySelector<HTMLButtonElement>(".fg-dash-legend-item")!.click());
    expect(el.querySelectorAll("path.fg-dash-dim")).toHaveLength(1);
  });
  it("refuses a part outside a Donut", () => {
    expect(() => html(h(DonutKey))).toThrow(/within a <Donut/);
  });
});

describe("Waffle parts", () => {
  const items = [
    { label: "a", value: 1 },
    { label: "b", value: 3 },
  ];
  it("lays the parts out as given, with the table always there", () => {
    const out = html(
      h(
        Waffle,
        { title: "T", items },
        h(WaffleKey, { hideShare: true }),
        h(WaffleGrid, { columns: 5 }),
        h(WaffleNote, null, "Each square, one seat"),
      ),
    );
    expect(out.indexOf("fg-dash-legend")).toBeLessThan(out.indexOf("fg-dash-waffle-grid"));
    expect(out).not.toContain("fg-dash-legend-share");
    expect(out).toContain("Each square, one seat");
    expect(out).toContain("<table");
  });
  it("reads shadcn's rows through dataKey and nameKey", () => {
    const out = html(
      h(
        ChartContainer,
        { config: { chrome: { label: "Chrome", color: "red" } } },
        h(Waffle, {
          title: "T",
          data: [
            { browser: "chrome", visitors: 3 },
            { browser: "safari", visitors: 1 },
          ],
          dataKey: "visitors",
          nameKey: "browser",
        }),
      ),
    );
    expect(out).toContain("Chrome");
    expect(out).toContain("75%");
    expect(out).toContain("var(--color-chrome)");
  });
  it("refuses a part outside a Waffle", () => {
    expect(() => html(h(WaffleGrid))).toThrow(/within a <Waffle/);
  });
});

describe("KpiRow items", () => {
  const kpis = [
    { label: "Revenue", value: "€48k", delta: 0.12 },
    { label: "Tickets", value: "12", delta: 0.1, better: "down" as const },
  ];
  it("draws the same row from items and from KpiRowItem children", () => {
    const plain = html(h(KpiRow, { items: kpis }));
    const parts = html(
      h(
        KpiRow,
        null,
        kpis.map((k) => h(KpiRowItem, { key: k.label, ...k })),
      ),
    );
    expect(parts).toBe(plain);
  });
  it("puts an item's children under its figure", () => {
    const out = html(
      h(KpiRow, null, h(KpiRowItem, { label: "Revenue", value: "€48k" }, "Goal €50k")),
    );
    expect(out).toContain('<dd class="fg-kpi-more">Goal €50k</dd>');
  });
  it("refuses an item outside a KpiRow", () => {
    expect(() => html(h(KpiRowItem, { label: "a", value: 1 }))).toThrow(/within a <KpiRow/);
  });
});

describe("StackedBar parts", () => {
  const bars = [
    { label: "Q1", values: { views: 3, visits: 1 } },
    { label: "Q2", values: { views: 2, visits: 2 } },
  ];
  const series = [
    { key: "views", label: "Views" },
    { key: "visits", label: "Visits" },
  ];
  it("draws the same chart from the parts as before", () => {
    const plain = html(h(StackedBar, { title: "T", series, items: bars }));
    const parts = html(
      h(StackedBar, { title: "T", series, items: bars }, h(StackedBarKey), h(StackedBarBars)),
    );
    expect(parts).toBe(plain);
  });
  it("takes its series from the container's config", () => {
    const out = html(h(ChartContainer, { config }, h(StackedBar, { title: "T", items: bars })));
    expect(out).toContain('<th scope="col">Views</th>');
    expect(out).toContain('<th scope="col">Visits</th>');
  });
  it("lays the parts out as given", () => {
    const out = html(
      h(StackedBar, { title: "T", series, items: bars }, h(StackedBarBars), h(StackedBarKey)),
    );
    expect(out.indexOf("fg-dash-stack-list")).toBeLessThan(out.indexOf("fg-dash-legend"));
  });
  it("refuses a part outside a StackedBar", () => {
    expect(() => html(h(StackedBarBars))).toThrow(/within a <StackedBar/);
  });
});
