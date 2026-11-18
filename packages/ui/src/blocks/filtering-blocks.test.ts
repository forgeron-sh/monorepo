// @vitest-environment jsdom
import { Folder01Icon, Loading03Icon } from "@forgeron/icons";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DisplayMenu,
  FilterBar,
  FilterMenu,
  ViewHeader,
  matchesFilters,
  operatorText,
  setFilterValues,
  toggleFilterOperator,
  toggleFilterValue,
  type DisplayOptions,
  type Filter,
  type FilterField,
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

const fields: FilterField[] = [
  {
    id: "status",
    label: "Status",
    icon: Loading03Icon,
    options: [
      { value: "todo", label: "Todo" },
      { value: "progress", label: "In Progress" },
      { value: "done", label: "Done" },
    ],
  },
  {
    id: "project",
    label: "Project",
    icon: Folder01Icon,
    options: [
      { value: "q4", label: "Q4 closing" },
      { value: "portal", label: "Supplier portal" },
    ],
  },
];

describe("filter model", () => {
  it("says the operator for one value or several", () => {
    expect(operatorText("is", 1)).toBe("is");
    expect(operatorText("is", 2)).toBe("is any of");
    expect(operatorText("is-not", 1)).toBe("is not");
    expect(operatorText("is-not", 3)).toBe("is none of");
  });
  it("adds a filter with its first value and drops it with its last", () => {
    let f: Filter[] = toggleFilterValue([], "status", "todo");
    expect(f).toEqual([{ field: "status", operator: "is", values: ["todo"] }]);
    f = toggleFilterValue(f, "status", "done");
    expect(f[0]?.values).toEqual(["todo", "done"]);
    f = toggleFilterValue(toggleFilterValue(f, "status", "todo"), "status", "done");
    expect(f).toEqual([]);
    expect(
      setFilterValues([{ field: "status", operator: "is", values: ["x"] }], "status", []),
    ).toEqual([]);
  });
  it("toggles is and is not", () => {
    const f = toggleFilterOperator(
      [{ field: "status", operator: "is", values: ["todo"] }],
      "status",
    );
    expect(f[0]?.operator).toBe("is-not");
    expect(toggleFilterOperator(f, "status")[0]?.operator).toBe("is");
  });
  it("matches strings, lists and nobody", () => {
    const issue: Record<string, string | string[] | null> = {
      status: "todo",
      labels: ["Bug", "Customer"],
      assignee: null,
    };
    const read = (field: string) => issue[field];
    expect(matchesFilters([], read)).toBe(true);
    expect(
      matchesFilters([{ field: "status", operator: "is", values: ["todo", "done"] }], read),
    ).toBe(true);
    expect(matchesFilters([{ field: "status", operator: "is-not", values: ["todo"] }], read)).toBe(
      false,
    );
    expect(matchesFilters([{ field: "labels", operator: "is", values: ["Customer"] }], read)).toBe(
      true,
    );
    expect(matchesFilters([{ field: "assignee", operator: "is", values: ["_"] }], read)).toBe(true);
  });
});

describe("FilterBar", () => {
  it("renders nothing without filters", () => {
    expect(html(h(FilterBar, { fields, value: [], onChange: () => {} }))).toBe("");
  });
  it("says each filter: field, operator, values, a remove button", () => {
    const out = html(
      h(FilterBar, {
        fields,
        value: [{ field: "status", operator: "is", values: ["todo", "progress"] }],
        onChange: () => {},
      }),
    );
    expect(out).toContain('aria-label="Filters"');
    expect(out).toContain("Status");
    expect(out).toContain("is any of");
    expect(out).toContain("Todo, In Progress");
    expect(out).toContain('aria-label="Remove the status filter"');
    expect(out).toContain("Clear");
  });
  it("counts the values past two", () => {
    const out = html(
      h(FilterBar, {
        fields,
        value: [{ field: "status", operator: "is-not", values: ["todo", "progress", "done"] }],
        onChange: () => {},
      }),
    );
    expect(out).toContain("is none of");
    expect(out).toContain("3 values");
  });
  it("toggles the operator, removes a filter, clears them all", async () => {
    const onChange = vi.fn<(value: Filter[]) => void>();
    const value: Filter[] = [
      { field: "status", operator: "is", values: ["todo"] },
      { field: "project", operator: "is", values: ["q4"] },
    ];
    const el = await mount(h(FilterBar, { fields, value, onChange }));
    await click(el.querySelector(".fg-filter-op"));
    expect(onChange).toHaveBeenLastCalledWith([
      { field: "status", operator: "is-not", values: ["todo"] },
      value[1],
    ]);
    await click(el.querySelector('[aria-label="Remove the project filter"]'));
    expect(onChange).toHaveBeenLastCalledWith([value[0]]);
    await click(byText("Clear", "button"));
    expect(onChange).toHaveBeenLastCalledWith([]);
  });
});

describe("FilterMenu", () => {
  it("opens on the fields, then the values of the one chosen", async () => {
    const onChange = vi.fn<(value: Filter[]) => void>();
    const el = await mount(h(FilterMenu, { fields, value: [], onChange }));
    await click(el.querySelector(".fg-filters-trigger"));
    expect(document.querySelector('[aria-label="Filter by"]')).not.toBeNull();
    const project = [...document.querySelectorAll('[role="option"]')].find((o) =>
      o.textContent?.includes("Project"),
    );
    await click(project);
    expect(document.querySelector('[aria-label="Project"][role="dialog"]')).not.toBeNull();
    const portal = [...document.querySelectorAll('[role="option"]')].find((o) =>
      o.textContent?.includes("Supplier portal"),
    );
    await click(portal);
    expect(onChange).toHaveBeenLastCalledWith([
      { field: "project", operator: "is", values: ["portal"] },
    ]);
  });
});

const display: DisplayOptions = {
  layout: "list",
  grouping: "status",
  ordering: "priority",
  toggles: { subIssues: true },
  properties: ["id"],
};
const displayProps = {
  groupings: [
    { value: "status", label: "Status" },
    { value: "none", label: "No grouping" },
  ],
  orderings: [{ value: "priority", label: "Priority" }],
  toggles: [
    { id: "subIssues", label: "Show sub-issues" },
    { id: "emptyGroups", label: "Show empty groups" },
  ],
  properties: [
    { id: "id", label: "ID" },
    { id: "status", label: "Status" },
    { id: "assignee", label: "Assignee" },
  ],
};

describe("DisplayMenu", () => {
  it("changes the layout, a switch and the properties, in their order", async () => {
    const onChange = vi.fn<(value: DisplayOptions) => void>();
    const el = await mount(h(DisplayMenu, { value: display, onChange, ...displayProps }));
    expect(el.textContent).toContain("Display");
    await click(el.querySelector(".fg-display-trigger"));
    await click(byText("Board", "button"));
    expect(onChange).toHaveBeenLastCalledWith({ ...display, layout: "board" });
    await click(
      [...document.querySelectorAll<HTMLInputElement>('[role="switch"]')].find(
        (s) => s.closest("label")?.textContent === "Show empty groups",
      ),
    );
    expect(onChange).toHaveBeenLastCalledWith({
      ...display,
      toggles: { subIssues: true, emptyGroups: true },
    });
    await click(byText("Assignee", "button"));
    expect(onChange).toHaveBeenLastCalledWith({ ...display, properties: ["id", "assignee"] });
    await click(byText("ID", "button"));
    expect(onChange).toHaveBeenLastCalledWith({ ...display, properties: [] });
  });
  it("offers a reset only when the value differs from the default", async () => {
    const onChange = vi.fn<(value: DisplayOptions) => void>();
    await mount(
      h(DisplayMenu, {
        value: { ...display, layout: "board" },
        onChange,
        defaultValue: display,
        ...displayProps,
      }),
    );
    await click(document.querySelector(".fg-display-trigger"));
    await click(byText("Reset to default", "button"));
    expect(onChange).toHaveBeenLastCalledWith(display);
  });
});

describe("ViewHeader", () => {
  const tabs = [
    { value: "all", label: "All issues", count: 40 },
    { value: "active", label: "Active", count: 12 },
  ];
  it("shows the count on the current tab only", () => {
    const out = html(h(ViewHeader, { title: "Issues", tabs, tab: "active" }));
    expect(out).toContain("Issues");
    expect(out).toContain('aria-label="Views"');
    expect(out).toContain("12");
    expect(out).not.toContain("40");
    expect(out).toMatch(/aria-pressed="true"[^>]*>Active/);
  });
  it("renders link tabs with aria-current and the slots on the right", () => {
    const out = html(
      h(ViewHeader, {
        breadcrumb: [{ label: "Operations", href: "#ops" }, { label: "Issues" }],
        tabs: tabs.map((t) => ({ ...t, href: `#${t.value}` })),
        tab: "all",
        action: h("button", null, "New issue"),
      }),
    );
    expect(out).toContain('aria-label="Breadcrumb"');
    expect(out).toContain('href="#all" aria-current="page"');
    expect(out).toContain("fg-vhead-actions");
    expect(out).toContain("New issue");
  });
  it("calls onTabChange", async () => {
    const onTabChange = vi.fn<(value: string) => void>();
    await mount(h(ViewHeader, { tabs, tab: "all", onTabChange }));
    await click(byText("Active", "button"));
    expect(onTabChange).toHaveBeenCalledWith("active");
  });
});
