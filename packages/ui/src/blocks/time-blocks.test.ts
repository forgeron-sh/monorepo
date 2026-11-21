// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AvailabilityEditor,
  DurationInput,
  RecurrenceEditor,
  ResourceSchedule,
  SlotPicker,
  TimeGrid,
  TimezonePicker,
  convertTime,
  daySlots,
  defaultWeekly,
  describeRecurrence,
  expandRecurrence,
  findConflicts,
  formatMinutes,
  formatOffset,
  layoutOverlaps,
  nextOccurrences,
  normalizeSpans,
  parseMinutes,
  parseRrule,
  recurrenceToRrule,
  slotsOnDay,
  snapMinutes,
  spanErrors,
  spansOn,
  timezoneOffset,
  viewDays,
  type Recurrence,
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
  return host;
};
const key = async (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...init }));
  });

const NOW = "2026-11-18T10:07";

describe("time model", () => {
  it("snaps minutes and reads durations", () => {
    expect(snapMinutes(67)).toBe(60);
    expect(snapMinutes(68)).toBe(75);
    expect(snapMinutes(61, 15, "ceil")).toBe(75);
    expect(snapMinutes(74, 15, "floor")).toBe(60);
    expect(formatMinutes(90)).toBe("1 h 30");
    expect(formatMinutes(45)).toBe("45 min");
    expect(parseMinutes("1h30")).toBe(90);
    expect(parseMinutes("1.5h")).toBe(90);
    expect(parseMinutes("45")).toBe(45);
    expect(parseMinutes("soon")).toBeNull();
  });

  it("lays out overlapping events in columns of their cluster", () => {
    const items = [
      { id: "a", start: 540, end: 600 },
      { id: "b", start: 570, end: 630 },
      { id: "c", start: 600, end: 660 },
      { id: "d", start: 720, end: 780 },
    ];
    const placed = layoutOverlaps(items, (i) => i);
    const by = Object.fromEntries(placed.map((p) => [p.item.id, p]));
    expect([by.a!.column, by.a!.columns]).toEqual([0, 2]);
    expect([by.b!.column, by.b!.columns]).toEqual([1, 2]);
    // c starts when a ends: it reuses column 0.
    expect([by.c!.column, by.c!.columns]).toEqual([0, 2]);
    expect([by.d!.column, by.d!.columns]).toEqual([0, 1]);
  });

  it("gives the days of a view", () => {
    expect(viewDays("2026-11-18", "day")).toEqual(["2026-11-18"]);
    expect(viewDays("2026-11-18", "workweek")).toEqual([
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
    ]);
    expect(viewDays("2026-11-22", "week")).toHaveLength(7);
    expect(viewDays("2026-11-22", "week")[0]).toBe("2026-11-16");
  });

  it("expands recurrences", () => {
    const daily: Recurrence = { frequency: "daily", interval: 2, end: { kind: "count", count: 3 } };
    expect(expandRecurrence(daily, "2026-11-18")).toEqual([
      "2026-11-18",
      "2026-11-20",
      "2026-11-22",
    ]);
    const weekly: Recurrence = {
      frequency: "weekly",
      interval: 2,
      weekdays: [0, 2],
      end: { kind: "until", date: "2026-12-16" },
    };
    expect(expandRecurrence(weekly, "2026-11-18")).toEqual([
      "2026-11-18",
      "2026-11-30",
      "2026-12-02",
      "2026-12-14",
      "2026-12-16",
    ]);
    const monthly: Recurrence = {
      frequency: "monthly",
      interval: 1,
      end: { kind: "count", count: 4 },
    };
    expect(expandRecurrence(monthly, "2026-01-31")).toEqual([
      "2026-01-31",
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
    ]);
    const yearly: Recurrence = { frequency: "yearly", interval: 1, end: { kind: "never" } };
    expect(expandRecurrence(yearly, "2028-02-29", { limit: 2 })).toEqual([
      "2028-02-29",
      "2029-02-28",
    ]);
    expect(nextOccurrences(daily, "2026-11-18", "2026-11-18", 5)).toEqual([
      "2026-11-20",
      "2026-11-22",
    ]);
    expect(
      expandRecurrence(weekly, "2026-11-18", { from: "2026-12-01", to: "2026-12-10" }),
    ).toEqual(["2026-12-02"]);
  });

  it("says a recurrence in words and in RRULE", () => {
    const rule: Recurrence = {
      frequency: "weekly",
      interval: 2,
      weekdays: [0, 2],
      end: { kind: "until", date: "2026-12-31" },
    };
    expect(describeRecurrence(rule, "2026-11-18")).toBe(
      "Every 2 weeks on Monday and Wednesday, until Dec 31",
    );
    expect(
      describeRecurrence({ frequency: "daily", interval: 1, end: { kind: "never" } }, "2026-11-18"),
    ).toBe("Every day");
    expect(
      describeRecurrence(
        { frequency: "monthly", interval: 1, end: { kind: "never" } },
        "2026-11-22",
      ),
    ).toBe("Every month on the 22nd");
    const text = recurrenceToRrule(rule);
    expect(text).toBe("FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE;UNTIL=20261231");
    expect(parseRrule(text)).toEqual(rule);
    expect(parseRrule("FREQ=NOPE")).toBeNull();
  });

  it("converts between time zones, daylight saving included", () => {
    expect(convertTime("2026-11-18", "09:00", "Europe/Paris", "America/New_York")).toEqual({
      date: "2026-11-18",
      time: "03:00",
    });
    // Paris is on summer time, New York too: six hours apart; the day changes in Tokyo.
    expect(convertTime("2026-07-01", "20:00", "Europe/Paris", "Asia/Tokyo")).toEqual({
      date: "2026-07-02",
      time: "03:00",
    });
    expect(timezoneOffset("Europe/Paris", Date.UTC(2026, 0, 15, 12))).toBe(60);
    expect(timezoneOffset("Europe/Paris", Date.UTC(2026, 6, 15, 12))).toBe(120);
    expect(formatOffset(330)).toBe("UTC+5:30");
    expect(formatOffset(-300)).toBe("UTC-5");
    expect(formatOffset(0)).toBe("UTC");
  });

  it("validates and merges spans, and reads exceptions over weekly hours", () => {
    expect(
      spanErrors([
        { start: "09:00", end: "12:00" },
        { start: "11:00", end: "13:00" },
        { start: "15:00", end: "14:00" },
      ]),
    ).toEqual([null, "Overlaps another range", "The end must be after the start"]);
    expect(
      normalizeSpans([
        { start: "13:00", end: "17:00" },
        { start: "09:00", end: "13:00" },
        { start: "18:00", end: "17:00" },
      ]),
    ).toEqual([{ start: "09:00", end: "17:00" }]);
    const a = {
      weekly: defaultWeekly(),
      exceptions: [
        { date: "2026-11-18", kind: "off" as const, spans: [] },
        { date: "2026-11-19", kind: "hours" as const, spans: [{ start: "10:00", end: "12:00" }] },
      ],
    };
    expect(spansOn("2026-11-17", a)).toEqual([{ start: "09:00", end: "17:00" }]);
    expect(spansOn("2026-11-18", a)).toEqual([]);
    expect(spansOn("2026-11-19", a)).toEqual([{ start: "10:00", end: "12:00" }]);
    expect(spansOn("2026-11-21", a)).toEqual([]);
  });

  it("computes slots, blocks the busy and moves them to another zone", () => {
    const a = { weekly: defaultWeekly(), exceptions: [] };
    const slots = daySlots(
      "2026-11-17",
      a,
      [{ date: "2026-11-17", start: "10:00", end: "11:00" }],
      60,
      60,
    );
    expect(slots.map((s) => [s.time, s.available])).toEqual([
      ["09:00", true],
      ["10:00", false],
      ["11:00", true],
      ["12:00", true],
      ["13:00", true],
      ["14:00", true],
      ["15:00", true],
      ["16:00", true],
    ]);
    const seen = slotsOnDay(
      "2026-11-17",
      slots,
      "Europe/Paris",
      "America/New_York",
      "2026-11-17T04:00",
    );
    expect(seen[0]).toMatchObject({ time: "03:00", available: false, reason: "past" });
    expect(seen[1]).toMatchObject({ time: "04:00", available: false, reason: "busy" });
    expect(seen[2]).toMatchObject({ time: "05:00", available: true });
    expect(seen[2]!.host).toEqual({ date: "2026-11-17", time: "11:00", timezone: "Europe/Paris" });
  });

  it("finds the blocks of a resource that overlap", () => {
    const c = findConflicts([
      { id: "a", resource: "x", start: "2026-11-16", end: "2026-11-18" },
      { id: "b", resource: "x", start: "2026-11-18", end: "2026-11-20" },
      { id: "c", resource: "y", start: "2026-11-16", end: "2026-11-20" },
      { id: "d", resource: "x", start: "2026-11-21", end: "2026-11-22" },
    ]);
    expect(c.get("a")).toEqual(["b"]);
    expect(c.get("b")).toEqual(["a"]);
    expect(c.has("c")).toBe(false);
    expect(c.has("d")).toBe(false);
  });
});

interface Meeting {
  id: string;
  title: string;
  date: string;
  start: string;
  end: string;
  resource?: string;
  allDay?: boolean;
}
const meetings: Meeting[] = [
  { id: "m1", title: "Standup", date: "2026-11-18", start: "09:00", end: "09:30" },
  { id: "m2", title: "Review", date: "2026-11-18", start: "09:15", end: "10:15" },
  { id: "m3", title: "Planning", date: "2026-11-19", start: "14:00", end: "15:00" },
  { id: "m4", title: "Offsite", date: "2026-11-18", start: "00:00", end: "24:00", allDay: true },
];

describe("TimeGrid", () => {
  it("draws a work week with overlaps, an all-day row and the now line", async () => {
    const el = await mount(
      h(TimeGrid<Meeting>, { records: meetings, date: "2026-11-18", now: NOW }),
    );
    expect(el.querySelectorAll(".fg-tg-head")).toHaveLength(5);
    expect(el.querySelectorAll("[data-event]")).toHaveLength(4);
    expect(el.querySelector(".fg-tg-now")).not.toBeNull();
    expect(el.querySelector(".fg-tg-head-today")?.textContent).toContain("Wed 18");
    expect(el.querySelector(".fg-tg-alldayrow")).not.toBeNull();
    const standup = el.querySelector<HTMLElement>('[data-event="m1"]')!.parentElement!;
    expect(standup.style.left).toContain("0%");
    expect(standup.style.width).toContain("50%");
  });

  it("changes view and day through the toolbar", async () => {
    const onDateChange = vi.fn<(...args: any[]) => void>();
    const el = await mount(
      h(TimeGrid<Meeting>, {
        records: meetings,
        defaultDate: "2026-11-18",
        now: NOW,
        onDateChange,
      }),
    );
    const next = el.querySelector<HTMLElement>('[aria-label="Next week"]')!;
    await act(async () => next.click());
    expect(onDateChange).toHaveBeenCalledWith("2026-11-25");
    const day = [...el.querySelectorAll<HTMLElement>(".fg-seg button")].find(
      (b) => b.textContent === "Day",
    )!;
    await act(async () => day.click());
    expect(el.querySelectorAll(".fg-tg-head")).toHaveLength(1);
  });

  it("moves an event with the arrows and resizes it with Shift", async () => {
    const onChange = vi.fn<(...args: any[]) => void>();
    const el = await mount(
      h(TimeGrid<Meeting>, { records: meetings, date: "2026-11-18", now: NOW, onChange }),
    );
    const ev = el.querySelector<HTMLElement>('[data-event="m3"]')!;
    await key(ev, "ArrowDown");
    expect(onChange).toHaveBeenLastCalledWith("m3", {
      date: "2026-11-19",
      start: "14:15",
      end: "15:15",
    });
    await key(ev, "ArrowDown", { shiftKey: true });
    expect(onChange).toHaveBeenLastCalledWith("m3", {
      date: "2026-11-19",
      start: "14:00",
      end: "15:15",
    });
    await key(ev, "ArrowLeft");
    expect(onChange).toHaveBeenLastCalledWith("m3", {
      date: "2026-11-18",
      start: "14:00",
      end: "15:00",
    });
  });

  it("creates from a column with the keyboard", async () => {
    const onCreate = vi.fn<(...args: any[]) => void>();
    const el = await mount(
      h(TimeGrid<Meeting>, { records: [], date: "2026-11-18", now: NOW, onCreate }),
    );
    const col = el.querySelector<HTMLElement>('[data-col="2026-11-18"]')!;
    col.focus();
    await key(col, "ArrowDown");
    expect(el.querySelector(".fg-tg-ghost")).not.toBeNull();
    await key(col, "ArrowDown", { shiftKey: true });
    await key(col, "Enter");
    expect(onCreate).toHaveBeenCalledTimes(1);
    const slot = onCreate.mock.calls[0]![0];
    expect(slot.date).toBe("2026-11-18");
    expect(slot.end > slot.start).toBe(true);
  });

  it("hatches what is outside the working hours and makes columns for resources", async () => {
    const el = await mount(
      h(TimeGrid<Meeting>, {
        records: [
          {
            id: "r",
            title: "Cut",
            date: "2026-11-18",
            start: "10:00",
            end: "11:00",
            resource: "b",
          },
        ],
        date: "2026-11-18",
        now: NOW,
        view: "day",
        resources: [
          { id: "a", name: "Alice" },
          { id: "b", name: "Bruno" },
        ],
        workingHours: defaultWeekly(),
      }),
    );
    expect(el.querySelectorAll(".fg-tg-col")).toHaveLength(2);
    expect(el.querySelectorAll(".fg-tg-off").length).toBe(4);
    const second = el.querySelectorAll(".fg-tg-col")[1]!;
    expect(second.querySelector('[data-event="r"]')).not.toBeNull();
    expect(el.querySelectorAll(".fg-tg-col")[0]!.querySelector("[data-event]")).toBeNull();
  });
});

describe("AvailabilityEditor", () => {
  it("adds a range, copies a day and keeps its value controlled-or-not", async () => {
    const onChange = vi.fn<(...args: any[]) => void>();
    const el = await mount(
      h(AvailabilityEditor, {
        defaultValue: { timezone: "Europe/Paris", weekly: defaultWeekly(), exceptions: [] },
        onChange,
      }),
    );
    expect(el.querySelectorAll(".fg-av-day")).toHaveLength(7);
    const add = el.querySelector<HTMLElement>('[aria-label="Add a range to Monday"]')!;
    await act(async () => add.click());
    expect(onChange).toHaveBeenCalledTimes(1);
    const next = onChange.mock.calls[0]![0];
    expect(next.weekly[0]).toHaveLength(2);
    expect(
      el.querySelector(".fg-av-day .fg-av-spans")!.querySelectorAll(".fg-av-span"),
    ).toHaveLength(2);
    const sat = el.querySelectorAll<HTMLInputElement>('.fg-av-day input[role="switch"]')[5]!;
    await act(async () => sat.click());
    expect(onChange.mock.calls.at(-1)![0].weekly[5]).toEqual([{ start: "09:00", end: "17:00" }]);
  });
});

describe("SlotPicker", () => {
  const availability = { timezone: "Europe/Paris", weekly: defaultWeekly(), exceptions: [] };
  it("lists the slots of a day, struck when taken, and chooses one", async () => {
    const onChange = vi.fn<(...args: any[]) => void>();
    const el = await mount(
      h(SlotPicker, {
        availability,
        busy: [{ date: "2026-11-18", start: "09:00", end: "10:00" }],
        duration: 60,
        defaultDate: "2026-11-18",
        now: "2026-11-18T08:00",
        onChange,
      }),
    );
    const options = el.querySelectorAll<HTMLElement>('[role="option"]');
    expect(options).toHaveLength(8);
    expect(options[0]!.getAttribute("aria-disabled")).toBe("true");
    await act(async () => options[0]!.click());
    expect(onChange).not.toHaveBeenCalled();
    await act(async () => options[1]!.click());
    expect(onChange.mock.calls[0]![0]).toMatchObject({
      date: "2026-11-18",
      time: "10:00",
      duration: 60,
    });
    expect(el.querySelector(".fg-slot-summary")?.textContent).toContain("10:00 – 11:00");
    expect(el.querySelectorAll(".fg-slot-day")).toHaveLength(7);
  });
});

describe("RecurrenceEditor", () => {
  it("turns on, says the rule and lists the next dates", async () => {
    const onChange = vi.fn<(...args: any[]) => void>();
    const el = await mount(h(RecurrenceEditor, { start: "2026-11-18", onChange }));
    expect(el.textContent).toContain("Does not repeat");
    const sw = el.querySelector<HTMLInputElement>('input[role="switch"]')!;
    await act(async () => sw.click());
    expect(onChange).toHaveBeenLastCalledWith({
      frequency: "weekly",
      interval: 1,
      end: { kind: "never" },
    });
    expect(el.querySelector(".fg-rec-summary")?.textContent).toContain("Every week on Wednesday");
    expect(el.querySelectorAll(".fg-rec-next li")).toHaveLength(3);
    const mo = el.querySelector<HTMLElement>('[aria-label="Monday"]')!;
    await act(async () => mo.click());
    expect(onChange.mock.calls.at(-1)![0].weekdays).toEqual([0, 2]);
  });

  it("keeps one weekday on and presses the chips with the toggle group", async () => {
    const onChange = vi.fn<(...args: any[]) => void>();
    const el = await mount(
      h(RecurrenceEditor, {
        start: "2026-11-18",
        defaultValue: { frequency: "weekly", interval: 1, end: { kind: "never" } },
        onChange,
      }),
    );
    const we = el.querySelector<HTMLElement>('[aria-label="Wednesday"]')!;
    expect(we.getAttribute("aria-pressed")).toBe("true");
    expect(el.querySelector(".fg-rec-days")?.getAttribute("aria-label")).toBe("On these days");
    await act(async () => we.click());
    expect(onChange).not.toHaveBeenCalled();
    expect(we.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("fields", () => {
  it("DurationInput carries minutes into hours and picks a preset", async () => {
    const onChange = vi.fn<(...args: any[]) => void>();
    const el = await mount(h(DurationInput, { label: "Duration", defaultValue: 75, onChange }));
    const inputs = el.querySelectorAll<HTMLInputElement>("input");
    expect(inputs[0]!.value).toBe("1");
    expect(inputs[1]!.value).toBe("15");
    const preset = [...el.querySelectorAll<HTMLElement>(".fg-dur-preset")].find(
      (b) => b.textContent === "30 min",
    )!;
    await act(async () => preset.click());
    expect(onChange).toHaveBeenLastCalledWith(30);
    expect(preset.getAttribute("aria-pressed")).toBe("true");
  });

  it("TimezonePicker holds a zone", async () => {
    const el = await mount(
      h(TimezonePicker, {
        label: "Time zone",
        defaultValue: "Europe/Paris",
        timezones: ["Europe/Paris", "America/New_York"],
        now: Date.UTC(2026, 10, 18, 12),
      }),
    );
    expect(el.querySelector("input")).not.toBeNull();
    expect((el.querySelector("input") as HTMLInputElement).value).toContain("Europe/Paris");
  });
});

describe("ResourceSchedule", () => {
  it("makes sections of resources and marks the clashes", async () => {
    const blocks = [
      { id: "1", name: "Leave", resource: "ana", start: "2026-11-16", end: "2026-11-18" },
      { id: "2", name: "Shift", resource: "ana", start: "2026-11-18", end: "2026-11-20" },
      { id: "3", name: "Shift", resource: "bob", start: "2026-11-16", end: "2026-11-20" },
    ];
    const onConflicts = vi.fn<(...args: any[]) => void>();
    const el = await mount(
      h(ResourceSchedule<(typeof blocks)[number]>, {
        resources: [
          { id: "ana", name: "Ana" },
          { id: "bob", name: "Bob" },
        ],
        blocks,
        today: "2026-11-18",
        onConflicts,
      }),
    );
    expect(el.textContent).toContain("Ana");
    expect(el.textContent).toContain("Bob");
    expect(el.textContent).toContain("Conflict with another block");
    expect(onConflicts).toHaveBeenCalled();
    expect([...onConflicts.mock.calls[0]![0].keys()].sort()).toEqual(["1", "2"]);
  });
});
