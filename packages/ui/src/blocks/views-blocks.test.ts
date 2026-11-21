// @vitest-environment jsdom
import { act, createElement as h, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  CalendarView,
  CalendarViewBody,
  CalendarViewNext,
  CalendarViewTitle,
  CalendarViewToday,
  CalendarViewToolbar,
  Timeline,
  TimelineBar,
  TimelineLabel,
  TimelineRow,
  TimelineRows,
  TimelineScroller,
  TimelineToolbar,
  TimelineTrack,
  calendarDays,
  projectFields,
  timelinePlace,
  timelineRange,
  type IssueItem,
  type ProjectItem,
  type TimelineDates,
} from "../index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
afterEach(() => {
  host?.remove();
  host = undefined;
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(element));
  return { el: host, root };
};
const key = async (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...init }));
  });

const TODAY = "2026-11-18";

interface Project {
  id: string;
  name: string;
  start?: string;
  end?: string;
  due?: string;
}
const projects: Project[] = [
  { id: "lyon", name: "Lyon depot", start: "2026-11-02", end: "2026-11-27" },
  { id: "audit", name: "Auditor pack", due: "2026-12-15" },
  { id: "racks", name: "Racks", start: "2026-11-16", end: "2026-11-20" },
];

describe("timeline geometry", () => {
  it("aligns the range on whole weeks, months, quarters, with today inside", () => {
    const dates = ["2026-11-02", "2026-12-15"];
    expect(timelineRange(dates, TODAY, "weeks")).toEqual({
      start: "2026-11-02",
      end: "2026-12-27",
      days: 56,
    });
    const months = timelineRange(dates, TODAY, "months");
    expect(months.start).toBe("2026-11-01");
    expect(months.end).toBe("2027-04-30");
    const quarters = timelineRange(dates, TODAY, "quarters");
    expect(quarters.start).toBe("2026-10-01");
    expect(quarters.end).toBe("2027-09-30");
    expect(timelineRange([], "2027-01-06", "weeks").start).toBe("2027-01-04");
  });
  it("places a bar from the start of its first day to the end of its last, a point mid-day", () => {
    const range = timelineRange([], TODAY, "weeks"); // from Monday 2026-11-16
    expect(range.start).toBe("2026-11-16");
    expect(timelinePlace("2026-11-16", "2026-11-20", range, "weeks")).toEqual({
      kind: "bar",
      x: 0,
      width: 5 * 28,
    });
    expect(timelinePlace(null, "2026-11-17", range, "weeks")).toEqual({
      kind: "point",
      x: 28 + 14,
      width: 0,
    });
    expect(timelinePlace("2026-11-16", "2026-11-20", range, "months")?.width).toBe(5 * 6);
    expect(timelinePlace(undefined, null, range, "weeks")).toBeNull();
  });
});

describe("Timeline", () => {
  it("draws rows, bars, points, today, and one tab stop", () => {
    const out = html(
      h(Timeline<Project>, { records: projects, today: TODAY, defaultZoom: "weeks" }),
    );
    expect(out).toContain('data-bar="lyon"');
    expect(out).toContain("fg-tl-point");
    expect(out).toContain("NOV 18");
    expect(out).toContain("Lyon depot, Nov 2 to Nov 27");
    expect(out).toContain("Auditor pack, due Dec 15");
    expect(out.match(/tabindex="0"/g)).toHaveLength(1);
    expect(out).toContain("fg-tl-weekend");
  });
  it("reads issues as they are: id and title, due date as a point", () => {
    const issues: IssueItem[] = [
      { id: "OPS-40", title: "Supplier invoices", status: "todo", due: "2026-11-20" },
    ];
    const out = html(h(Timeline<IssueItem>, { records: issues, today: TODAY }));
    expect(out).toContain('data-record="OPS-40"');
    expect(out).toContain("OPS-40</span>");
    expect(out).toContain("Supplier invoices, due Nov 20");
  });
  it("draws section headers for groups, and folds them", async () => {
    const onCollapsedChange = vi.fn<(keys: string[]) => void>();
    const { el } = await mount(
      h(Timeline<Project>, {
        today: TODAY,
        onCollapsedChange,
        groups: [
          { key: "a", name: "Warehouse", records: projects.slice(0, 2) },
          { key: "b", name: "Finance", records: projects.slice(2) },
        ],
      }),
    );
    expect(el.textContent).toContain("Warehouse");
    const toggle = el.querySelector<HTMLButtonElement>(".fg-tl-toggle")!;
    await act(async () => toggle.click());
    expect(onCollapsedChange).toHaveBeenCalledWith(["a"]);
    expect(el.querySelector('[data-record="lyon"]')).toBeNull();
    expect(el.querySelector('[data-record="racks"]')).not.toBeNull();
  });
  it("changes zoom from the toolbar, and the width with it", async () => {
    const onZoomChange = vi.fn<(z: string) => void>();
    const { el } = await mount(
      h(Timeline<Project>, {
        records: projects,
        today: TODAY,
        defaultZoom: "months",
        onZoomChange,
      }),
    );
    const width = () =>
      (el.querySelector(".fg-tl") as HTMLElement).style.getPropertyValue("--fg-tl-w");
    expect(width()).toBe(`${181 * 6}px`); // Nov 1 2026 → Apr 30 2027
    const weeks = [...el.querySelectorAll<HTMLButtonElement>(".fg-seg-item")].find(
      (b) => b.textContent === "Weeks",
    )!;
    await act(async () => weeks.click());
    expect(onZoomChange).toHaveBeenCalledWith("weeks");
    expect(width()).toBe(`${56 * 28}px`);
    expect(el.querySelector(".fg-tl-weeks")).not.toBeNull();
  });
  it("moves with the arrows and opens with Enter", async () => {
    const onOpen = vi.fn<(id: string) => void>();
    const onSelectedChange = vi.fn<(id: string) => void>();
    const { el } = await mount(
      h(Timeline<Project>, { records: projects, today: TODAY, onOpen, onSelectedChange }),
    );
    const first = el.querySelector<HTMLButtonElement>('[data-record="lyon"]')!;
    first.focus();
    await key(first, "ArrowDown");
    expect(document.activeElement?.getAttribute("data-record")).toBe("audit");
    await key(document.activeElement!, "End");
    expect(document.activeElement?.getAttribute("data-record")).toBe("racks");
    expect(onSelectedChange).toHaveBeenLastCalledWith("racks");
    expect(document.activeElement?.getAttribute("aria-current")).toBe("true");
    await act(async () => (document.activeElement as HTMLElement).click());
    expect(onOpen).toHaveBeenCalledWith("racks");
  });
  it("moves and stretches dates with Alt and the arrows", async () => {
    const onChange = vi.fn<(id: string, d: TimelineDates) => void>();
    const { el } = await mount(
      h(Timeline<Project>, { records: projects, today: TODAY, defaultZoom: "weeks", onChange }),
    );
    const lyon = el.querySelector<HTMLButtonElement>('[data-record="lyon"]')!;
    await key(lyon, "ArrowRight", { altKey: true });
    expect(onChange).toHaveBeenLastCalledWith("lyon", { start: "2026-11-03", end: "2026-11-28" });
    await key(lyon, "ArrowLeft", { altKey: true, shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith("lyon", { start: "2026-11-02", end: "2026-11-26" });
    const audit = el.querySelector<HTMLButtonElement>('[data-record="audit"]')!;
    await key(audit, "ArrowLeft", { altKey: true });
    expect(onChange).toHaveBeenLastCalledWith("audit", { start: null, end: "2026-12-14" });
  });
  it("moves by a week at the months zoom, and not at all without onChange", async () => {
    const onChange = vi.fn<(id: string, d: TimelineDates) => void>();
    const { el } = await mount(h(Timeline<Project>, { records: projects, today: TODAY, onChange }));
    await key(el.querySelector('[data-record="racks"]')!, "ArrowRight", { altKey: true });
    expect(onChange).toHaveBeenLastCalledWith("racks", { start: "2026-11-23", end: "2026-11-27" });
    expect(html(h(Timeline<Project>, { records: projects, today: TODAY }))).not.toContain(
      "fg-tl-grip",
    );
  });
  it("says so when there is nothing", () => {
    expect(html(h(Timeline<Project>, { records: [], today: TODAY }))).toContain("Nothing to place");
  });
});

const tasks: Project[] = [
  { id: "a", name: "Count pallets", due: "2026-11-18" },
  { id: "b", name: "Print labels", due: "2026-11-18" },
  { id: "c", name: "Call carrier", due: "2026-11-18" },
  { id: "d", name: "Book truck", due: "2026-11-18" },
  { id: "e", name: "Close books", due: "2026-11-18" },
  { id: "f", name: "Pay rent", due: "2026-12-01" },
  { id: "g", name: "No date" },
];

describe("calendarDays", () => {
  it("keeps whole weeks of the month, Monday first, and a week", () => {
    const nov = calendarDays(TODAY, "month");
    expect(nov[0]).toBe("2026-10-26");
    expect(nov).toHaveLength(42);
    const feb = calendarDays("2027-02-10", "month");
    expect(feb[0]).toBe("2027-02-01");
    expect(feb).toHaveLength(28);
    expect(calendarDays(TODAY, "week")).toEqual([
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
      "2026-11-21",
      "2026-11-22",
    ]);
  });
});

describe("CalendarView", () => {
  it("places records on their day, caps a day with +n more, marks today", () => {
    const out = html(h(CalendarView<Project>, { records: tasks, today: TODAY }));
    expect(out).toContain("November 2026");
    expect(out).toMatch(/data-day="2026-11-18"[^>]*aria-current="date"/);
    expect(out).toContain("+2 more");
    expect(out).toContain('data-item="f"');
    expect(out).not.toContain("No date");
    expect(out.match(/role="gridcell"/g)).toHaveLength(42);
    expect(out.match(/tabindex="0"/g)).toHaveLength(1);
  });
  it("shows every record of a day in week mode", () => {
    const out = html(
      h(CalendarView<Project>, { records: tasks, today: TODAY, defaultMode: "week" }),
    );
    expect(out).not.toContain("more");
    expect(out.match(/data-item=/g)).toHaveLength(5);
    expect(out).toContain("W47");
  });
  it("goes to the next month and back to today", async () => {
    const onDateChange = vi.fn<(d: string) => void>();
    const { el } = await mount(
      h(CalendarView<Project>, { records: tasks, today: TODAY, onDateChange }),
    );
    await act(async () =>
      el.querySelector<HTMLButtonElement>('[aria-label="Next month"]')!.click(),
    );
    expect(onDateChange).toHaveBeenLastCalledWith("2026-12-18");
    expect(el.textContent).toContain("December 2026");
    const todayBtn = [...el.querySelectorAll("button")].find((b) => b.textContent === "Today")!;
    await act(async () => todayBtn.click());
    expect(el.textContent).toContain("November 2026");
  });
  it("moves between days with the arrows, into a day with Enter, out with Escape", async () => {
    const onOpen = vi.fn<(id: string) => void>();
    const { el } = await mount(h(CalendarView<Project>, { records: tasks, today: TODAY, onOpen }));
    const day = el.querySelector<HTMLElement>('[data-day="2026-11-18"]')!;
    day.focus();
    await key(day, "ArrowRight");
    expect(document.activeElement?.getAttribute("data-day")).toBe("2026-11-19");
    await key(document.activeElement!, "ArrowLeft");
    await key(document.activeElement!, "Enter");
    expect(document.activeElement?.getAttribute("data-item")).toBe("a");
    await key(document.activeElement!, "ArrowDown");
    expect(document.activeElement?.getAttribute("data-item")).toBe("b");
    await act(async () => (document.activeElement as HTMLElement).click());
    expect(onOpen).toHaveBeenCalledWith("b");
    await key(document.activeElement!, "Escape");
    expect(document.activeElement?.getAttribute("data-day")).toBe("2026-11-18");
    await key(document.activeElement!, "PageDown");
    expect(document.activeElement?.getAttribute("data-day")).toBe("2026-12-18");
    expect(el.textContent).toContain("December 2026");
  });
  it("moves a record to another day with Alt and the arrows, the focus with it", async () => {
    const onChange = vi.fn<(id: string, date: string) => void>();
    function Owner() {
      const [records, setRecords] = useState(tasks);
      return h(CalendarView<Project>, {
        records,
        today: TODAY,
        onChange: (id, date) => {
          onChange(id, date);
          setRecords((all) => all.map((r) => (r.id === id ? { ...r, due: date } : r)));
        },
      });
    }
    const { el } = await mount(h(Owner));
    const item = el.querySelector<HTMLElement>('[data-item="f"]')!;
    item.focus();
    await key(item, "ArrowDown", { altKey: true });
    expect(onChange).toHaveBeenCalledWith("f", "2026-12-08");
    expect(el.textContent).toContain("December 2026");
    expect(el.querySelector('[data-day="2026-12-08"] [data-item="f"]')).not.toBeNull();
    expect(document.activeElement?.getAttribute("data-item")).toBe("f");
  });
  it("opens the week of a day from +n more", async () => {
    const onModeChange = vi.fn<(m: string) => void>();
    const { el } = await mount(
      h(CalendarView<Project>, { records: tasks, today: TODAY, onModeChange }),
    );
    await act(async () => el.querySelector<HTMLButtonElement>("[data-more]")!.click());
    expect(onModeChange).toHaveBeenCalledWith("week");
    expect(el.querySelectorAll("[data-item]")).toHaveLength(5);
  });
});

describe("views on the records model", () => {
  const items: ProjectItem[] = [
    { id: "a", name: "Alpha", status: "started", target: "2026-11-19", issues: 3, done: 1 },
    { id: "b", name: "Beta", status: "planned", target: "2026-11-19", issues: 1, done: 0 },
    { id: "c", name: "Gamma", status: "planned", issues: 0, done: 0 },
  ];
  it("places a calendar item by a date field, with a status mark", () => {
    const out = html(
      h(CalendarView<ProjectItem>, {
        records: items,
        today: TODAY,
        fields: projectFields,
        dateField: "target",
        labelField: "name",
        markField: "status",
      }),
    );
    expect(out.match(/data-item=/g)).toHaveLength(2);
    expect(out).toContain("Alpha");
    expect(out).toContain("fg-ilist-mark");
  });
  it("lets getDate win over the date field", () => {
    const out = html(
      h(CalendarView<ProjectItem>, {
        records: items,
        today: TODAY,
        fields: projectFields,
        dateField: "target",
        getDate: () => null,
      }),
    );
    expect(out).not.toContain("data-item=");
  });
  it("sections a timeline by a field and ends bars on a date field", () => {
    const out = html(
      h(Timeline<ProjectItem>, {
        records: items,
        today: TODAY,
        fields: projectFields,
        endField: "target",
        groupField: "status",
        labelField: "name",
      }),
    );
    expect(out).toContain("In Progress");
    expect(out).toContain("Planned");
    expect(out.match(/data-bar=/g)).toHaveLength(2);
  });
});

describe("the views blocks in parts", () => {
  it("composes the CalendarView from its toolbar and the grid", async () => {
    const records = [{ id: "a", title: "Ship", date: "2026-11-18" }];
    const { el } = await mount(
      h(
        CalendarView<{ id: string; title: string; date: string }>,
        { records, today: TODAY, className: "mine", "aria-label": "Plan" } as never,
        h(
          CalendarViewToolbar,
          null,
          h(CalendarViewToday),
          h(CalendarViewNext),
          h(CalendarViewTitle, { className: "when" }),
        ),
        h(CalendarViewBody, { maxPerDay: 2 }),
      ),
    );
    const root = el.querySelector<HTMLElement>('[data-slot="calendar-view"]')!;
    expect(root.classList.contains("mine")).toBe(true);
    expect(root.getAttribute("aria-label")).toBe("Plan");
    expect(el.querySelector(".when")?.textContent).toBe("November 2026");
    // The previous arrow was left out.
    expect(el.querySelector('[aria-label="Previous month"]')).toBeNull();
    expect(el.querySelector('[data-slot="day-grid"]')).not.toBeNull();
    expect(el.querySelector('[data-day="2026-11-18"] [data-item="a"]')).not.toBeNull();
    await act(async () =>
      el.querySelector<HTMLButtonElement>('[aria-label="Next month"]')!.click(),
    );
    expect(el.querySelector(".when")?.textContent).toBe("December 2026");
  });

  it("composes the Timeline and lets a row be drawn from its parts", async () => {
    const { el } = await mount(
      h(
        Timeline<Project>,
        { records: projects, today: TODAY, defaultZoom: "weeks" },
        h(TimelineToolbar),
        h(
          TimelineScroller,
          null,
          h(
            "div",
            null,
            h(TimelineRows<Project>, {
              children: (row) =>
                row.kind === "record"
                  ? h(
                      TimelineRow<Project>,
                      { key: row.key, record: row.record, className: "mine" },
                      h(TimelineLabel<Project>, { record: row.record }),
                      h(
                        TimelineTrack<Project>,
                        { record: row.record },
                        h(TimelineBar<Project>, { record: row.record }),
                      ),
                    )
                  : null,
            }),
          ),
        ),
      ),
    );
    expect(el.querySelector('[data-slot="timeline"]')?.classList.contains("fg-tl-weeks")).toBe(
      true,
    );
    expect(el.querySelectorAll(".fg-tl-row.mine")).toHaveLength(3);
    expect(el.querySelectorAll("[data-bar]")).toHaveLength(3);
    expect(el.querySelector(".fg-tl-pill")).toBeNull();
  });

  it("says it is empty in the parts form too, through the shorthand", async () => {
    const { el } = await mount(
      h(Timeline<Project>, { records: [], today: TODAY, empty: "Nothing" }),
    );
    expect(el.querySelector(".fg-tl-empty")?.textContent).toBe("Nothing");
  });
});
