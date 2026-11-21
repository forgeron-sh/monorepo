// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DayGrid,
  DayGridBody,
  DayGridDay,
  DayGridHeader,
  DayGridItems,
  DayGridMore,
  DayGridNumber,
  type DayGridItemData,
} from "./day-grid";
import {
  EventGrid,
  EventGridBody,
  EventGridColumn,
  EventGridColumns,
  EventGridHeader,
  useEventGrid,
  type EventGridColumnData,
  type EventGridEvent,
} from "./event-grid";
import {
  PeriodNav,
  PeriodNavBadge,
  PeriodNavGroup,
  PeriodNavNext,
  PeriodNavPrevious,
  PeriodNavTitle,
  PeriodNavToday,
} from "./period-nav";
import { SlotList, SlotListEmpty, SlotListItem } from "./slot-list";

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
  return host;
};
const key = async (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...init }));
  });

describe("PeriodNav", () => {
  it("forwards className, rest, data-slot and asChild on every part", () => {
    const out = html(
      h(
        PeriodNav,
        { className: "a", id: "bar" },
        h(
          PeriodNavGroup,
          { className: "b" },
          h(PeriodNavToday, { className: "c" }),
          h(PeriodNavPrevious, { label: "Back", className: "d" }),
          h(PeriodNavNext, { label: "Forth" }),
          h(PeriodNavTitle, { className: "e" }, "November"),
          h(PeriodNavBadge, { asChild: true }, h("b", { className: "f" }, "W47")),
        ),
      ),
    );
    expect(out).toContain('data-slot="period-nav"');
    expect(out).toContain('class="fg-pn a"');
    expect(out).toContain('id="bar"');
    expect(out).toContain("fg-pn-group b");
    expect(out).toContain('data-slot="period-nav-today"');
    expect(out).toContain('aria-label="Back"');
    expect(out).toContain('aria-label="Forth"');
    expect(out).toContain('aria-live="polite"');
    expect(out).toContain("<b ");
    expect(out).toContain("fg-pn-badge f");
  });
});

describe("SlotList", () => {
  it("builds its items from `items`, skips none, and chooses on click", async () => {
    const onValueChange = vi.fn<(...args: any[]) => void>();
    const el = await mount(
      h(SlotList, {
        label: "Times",
        value: "09:30",
        onValueChange,
        items: [
          { value: "09:00", label: "09:00" },
          { value: "09:30", label: "09:30" },
          { value: "10:00", label: "10:00", disabled: true },
        ],
      }),
    );
    const list = el.querySelector<HTMLElement>('[role="listbox"]')!;
    expect(list.dataset.slot).toBe("slot-list");
    expect(list.getAttribute("aria-label")).toBe("Times");
    const options = [...el.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(options.map((o) => o.getAttribute("aria-selected"))).toEqual(["false", "true", "false"]);
    expect(options.map((o) => o.tabIndex)).toEqual([-1, 0, -1]);
    await act(async () => options[2]!.click());
    expect(onValueChange).not.toHaveBeenCalled();
    await act(async () => options[0]!.click());
    expect(onValueChange).toHaveBeenCalledWith("09:00");
  });

  it("moves the focus with the arrows, a row at a time, and enters on the first free slot", async () => {
    const el = await mount(
      h(
        SlotList,
        { columns: 2 },
        h(SlotListItem, { value: "a", disabled: true }, "a"),
        h(SlotListItem, { value: "b" }, "b"),
        h(SlotListItem, { value: "c", className: "mine" }, "c"),
        h(SlotListItem, { value: "d" }, "d"),
      ),
    );
    const list = el.querySelector<HTMLElement>('[role="listbox"]')!;
    expect(list.tabIndex).toBe(0);
    await act(async () => list.focus());
    const options = [...el.querySelectorAll<HTMLElement>('[role="option"]')];
    expect(document.activeElement).toBe(options[1]);
    await key(options[1]!, "ArrowDown");
    expect(document.activeElement).toBe(options[3]);
    await key(options[3]!, "Home");
    expect(document.activeElement).toBe(options[0]);
    expect(options[2]!.className).toContain("mine");
  });

  it("renders SlotListEmpty with its class", () => {
    expect(html(h(SlotListEmpty, { className: "x" }, "None"))).toContain('class="fg-sl-empty x"');
  });
});

const items: DayGridItemData[] = [
  { id: "a", day: "2026-11-18", label: "A" },
  { id: "b", day: "2026-11-18", label: "B" },
  { id: "c", day: "2026-11-18", label: "C" },
  { id: "d", day: "2026-11-18", label: "D" },
  { id: "e", day: "2026-11-18", label: "E" },
];
const week = [
  "2026-11-16",
  "2026-11-17",
  "2026-11-18",
  "2026-11-19",
  "2026-11-20",
  "2026-11-21",
  "2026-11-22",
];

describe("DayGrid", () => {
  it("draws the days and caps a day's items under 'more'", async () => {
    const onMore = vi.fn<(...args: any[]) => void>();
    const el = await mount(
      h(DayGrid, {
        days: week,
        items,
        date: "2026-11-18",
        today: "2026-11-18",
        month: "2026-11",
        onMore,
        maxPerDay: 2,
        className: "mine",
      }),
    );
    const grid = el.querySelector<HTMLElement>('[role="grid"]')!;
    expect(grid.dataset.slot).toBe("day-grid");
    expect(grid.classList.contains("mine")).toBe(true);
    expect(el.querySelectorAll('[role="gridcell"]')).toHaveLength(7);
    expect(el.querySelectorAll("[data-item]")).toHaveLength(2);
    const more = el.querySelector<HTMLButtonElement>("[data-more]")!;
    expect(more.textContent).toBe("+3 more");
    await act(async () => more.click());
    expect(onMore).toHaveBeenCalledWith("2026-11-18");
    expect(el.querySelector('[data-day="2026-11-18"]')?.getAttribute("aria-current")).toBe("date");
  });

  it("composes its days from parts and moves an item with Alt and the arrows", async () => {
    const onChange = vi.fn<(...args: any[]) => void>();
    const onDateChange = vi.fn<(...args: any[]) => void>();
    const el = await mount(
      h(
        DayGrid,
        { days: week, items: items.slice(0, 1), date: "2026-11-18", onChange, onDateChange },
        h(DayGridHeader),
        h(DayGridBody, {
          children: (row: string[]) =>
            h(
              "div",
              { key: row[0], role: "row" },
              row.map((day: string) =>
                h(
                  DayGridDay,
                  { key: day, day, className: "cell" },
                  h(DayGridNumber, { day }),
                  h(DayGridItems, { day }),
                  h(DayGridMore, { day }),
                ),
              ),
            ),
        }),
      ),
    );
    expect(el.querySelectorAll(".fg-dg-day.cell")).toHaveLength(7);
    const item = el.querySelector<HTMLElement>('[data-item="a"]')!;
    await key(item, "ArrowRight", { altKey: true });
    expect(onChange).toHaveBeenCalledWith("a", "2026-11-19");
    expect(onDateChange).toHaveBeenCalledWith("2026-11-19");
  });
});

const events: EventGridEvent[] = [
  { id: "m1", label: "Standup", date: "2026-11-18", start: 540, end: 570 },
  { id: "m2", label: "Review", date: "2026-11-18", start: 555, end: 615 },
  { id: "m3", label: "Offsite", date: "2026-11-18", start: 0, end: 1440, allDay: true },
];

describe("EventGrid", () => {
  it("draws the columns, the events side by side and the all-day row", async () => {
    const el = await mount(
      h(EventGrid, {
        days: ["2026-11-18", "2026-11-19"],
        events,
        now: "2026-11-18T10:00",
        className: "mine",
      }),
    );
    const root = el.querySelector<HTMLElement>('[data-slot="event-grid"]')!;
    expect(root.classList.contains("mine")).toBe(true);
    expect(root.style.getPropertyValue("--fg-eg-n")).toBe("2");
    expect(el.querySelectorAll(".fg-eg-head")).toHaveLength(2);
    expect(el.querySelectorAll(".fg-eg-col")).toHaveLength(2);
    expect(el.querySelectorAll("[data-event]")).toHaveLength(3);
    expect(el.querySelector(".fg-eg-alldayrow")).not.toBeNull();
    expect(el.querySelector(".fg-eg-now")).not.toBeNull();
    const first = el.querySelector<HTMLElement>('[data-event="m1"]')!.parentElement!;
    expect(first.dataset.slot).toBe("event-grid-event");
    expect(first.style.width).toContain("50%");
  });

  it("composes from parts, with a column drawn by hand, and creates from the keyboard", async () => {
    const onCreate = vi.fn<(...args: any[]) => void>();
    const Probe = () => h("output", null, String(useEventGrid().columns.length));
    const el = await mount(
      h(
        EventGrid,
        { days: ["2026-11-18"], events: [], now: "2026-11-18T10:00", onCreate },
        h(EventGridHeader),
        h(Probe),
        h(
          EventGridBody,
          null,
          h(EventGridColumns, {
            children: (column: EventGridColumnData, index: number) =>
              h(EventGridColumn, { key: column.key, column, index, className: "mine" }),
          }),
        ),
      ),
    );
    expect(el.querySelector("output")?.textContent).toBe("1");
    const col = el.querySelector<HTMLElement>("[data-col]")!;
    expect(col.classList.contains("mine")).toBe(true);
    col.focus();
    await key(col, "Enter");
    expect(onCreate).toHaveBeenCalledTimes(1);
    expect(onCreate.mock.calls[0]![0]).toMatchObject({ date: "2026-11-18" });
  });

  it("asks for the next period past the last column", async () => {
    const onPage = vi.fn<(...args: any[]) => void>();
    const el = await mount(
      h(EventGrid, { days: ["2026-11-18"], events: [], now: "2026-11-18T10:00", onPage }),
    );
    const col = el.querySelector<HTMLElement>("[data-col]")!;
    await key(col, "ArrowRight");
    expect(onPage).toHaveBeenCalledWith(1);
    await key(col, "PageUp");
    expect(onPage).toHaveBeenCalledWith(-1);
  });
});
