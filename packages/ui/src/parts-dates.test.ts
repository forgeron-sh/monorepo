// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Calendar, DatePicker, DateRangePicker, TimePicker, Toaster, useToast } from "./index";
import {
  CalendarDay,
  CalendarGrid,
  CalendarHeader,
  CalendarNext,
  CalendarTitle,
  DatePickerCalendar,
  DatePickerContent,
  DatePickerTrigger,
  DateRangePickerCalendar,
  DateRangePickerContent,
  DateRangePickerFooter,
  DateRangePickerTrigger,
  TimePickerHour,
  TimePickerMinute,
  TimePickerSeparator,
  Toast,
  ToastDescription,
  ToastTitle,
} from "./parts-dates";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let mounted: ReturnType<typeof createRoot> | undefined;
afterEach(async () => {
  await act(async () => mounted?.unmount());
  host?.remove();
  host = undefined;
  mounted = undefined;
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  mounted = root;
  await act(async () => root.render(element));
  return host;
};
const click = (el: Element | null | undefined) =>
  act(async () => {
    (el as HTMLElement).click();
  });

describe("Calendar parts", () => {
  const today = "2026-11-17";
  it("draws what the children say, in the same classes", () => {
    const out = html(
      h(
        Calendar,
        { value: "2026-11-18", today, label: "Due" },
        h(CalendarHeader, null, h(CalendarTitle), h(CalendarNext, { label: "Later" })),
        h(CalendarGrid, { className: "mine" }),
      ),
    );
    expect(out).toContain('class="fg-cal-head"');
    expect(out).toContain("November 2026");
    expect(out).toContain('aria-label="Later"');
    expect(out).not.toContain("Previous month");
    expect(out).toContain('role="grid" aria-label="Due, November 2026"');
    expect(out).toContain("fg-cal-grid mine");
    expect(out).toMatch(/data-day="2026-11-18" tabindex="0"[^>]*class="fg-cal-day fg-cal-on"/);
  });
  it("draws each day with renderDay and keeps the keyboard", async () => {
    const onChange = vi.fn<(value: string) => void>();
    const root = await mount(
      h(
        Calendar,
        { value: "2026-11-18", today, onChange },
        h(CalendarGrid, {
          renderDay: (iso: string) =>
            h(CalendarDay, { date: iso, className: "custom", "data-x": "1" } as never),
        }),
      ),
    );
    const day = root.querySelector<HTMLButtonElement>('[data-day="2026-11-18"]')!;
    expect(day.classList.contains("custom")).toBe(true);
    day.focus();
    await act(async () => {
      day.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true }));
    });
    expect(document.activeElement?.getAttribute("data-day")).toBe("2026-11-19");
    await click(document.activeElement);
    expect(onChange).toHaveBeenCalledWith("2026-11-19");
  });
  it("refuses a part outside a Calendar", () => {
    const quiet = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => html(h(CalendarTitle))).toThrow("goes inside a Calendar");
    quiet.mockRestore();
  });
});

describe("DatePicker parts", () => {
  it("composes trigger, panel and calendar, and chooses", async () => {
    const onChange = vi.fn<(value: string | null) => void>();
    await mount(
      h(
        DatePicker,
        { today: "2026-11-17", onChange },
        h(DatePickerTrigger, { label: "Due date" }),
        h(DatePickerContent, { label: "Due date" }, h(DatePickerCalendar, { label: "Due date" })),
      ),
    );
    const trigger = document.querySelector<HTMLElement>("button[aria-label='Due date']")!;
    expect(trigger.className).toContain("fg-selm-chip");
    await click(trigger);
    const panel = document.querySelector("[aria-label='Due date'].fg-datepop");
    expect(panel).not.toBeNull();
    await click(document.querySelector("[data-day='2026-11-20']"));
    expect(onChange).toHaveBeenCalledWith("2026-11-20");
    expect(document.querySelector(".fg-datepop")).toBeNull();
  });
  it("keeps the props form", async () => {
    await mount(
      h(DatePicker, { label: "Due date", today: "2026-11-17", defaultValue: "2026-11-18" }),
    );
    const trigger = document.querySelector<HTMLElement>("button[aria-label='Due date: Nov 18']")!;
    await click(trigger);
    expect(document.body.textContent).toContain("Tomorrow");
    expect(document.body.textContent).toContain("Remove due date");
  });
});

describe("DateRangePicker parts", () => {
  it("composes the parts and applies a range after two clicks", async () => {
    const onChange = vi.fn<(range: unknown) => void>();
    await mount(
      h(
        DateRangePicker,
        { today: "2026-11-17", onChange },
        h(DateRangePickerTrigger, { label: "Period", variant: "chip" }),
        h(
          DateRangePickerContent,
          { label: "Period" },
          h(DateRangePickerCalendar, { label: "Period" }),
          h(DateRangePickerFooter),
        ),
      ),
    );
    await click(document.querySelector("button[aria-label='Period']"));
    expect(document.body.textContent).toContain("Choose the first day");
    await click(document.querySelector("[data-day='2026-11-10']"));
    expect(document.body.textContent).toContain("choose the end");
    await click(document.querySelector("[data-day='2026-11-05']"));
    expect(onChange).toHaveBeenCalledWith({ from: "2026-11-05", to: "2026-11-10" });
  });
});

describe("TimePicker parts", () => {
  it("draws only the segments given, and types", async () => {
    const onChange = vi.fn<(value: string | null) => void>();
    const root = await mount(
      h(
        TimePicker,
        { label: "Start", onChange },
        h(TimePickerHour),
        h(TimePickerSeparator, { children: "h" }),
        h(TimePickerMinute),
      ),
    );
    expect(root.querySelectorAll("[role=spinbutton]")).toHaveLength(2);
    expect(root.querySelector(".fg-time-open")).toBeNull();
    expect(root.querySelector(".fg-time-colon")?.textContent).toBe("h");
    const hour = root.querySelector<HTMLElement>("[aria-label='Start, hour']")!;
    await act(async () => {
      hour.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith("01:00");
  });
  it("keeps the props form with its list", () => {
    const out = html(h(TimePicker, { label: "Start", hour12: true, defaultValue: "14:30" }));
    expect(out).toContain("02");
    expect(out).toContain("PM");
    expect(out).toContain("fg-time-open");
  });
});

describe("Toast parts", () => {
  function Fire() {
    const toast = useToast();
    return h("button", {
      id: "fire",
      onClick: () => toast.add({ title: "Saved", description: "ok" }),
    });
  }
  it("draws a toast from its parts through renderToast", async () => {
    await mount(
      h(
        Toaster,
        {
          renderToast: (toast) =>
            h(Toast, { toast, className: "mine" }, h(ToastTitle), h(ToastDescription)),
        },
        h(Fire),
      ),
    );
    await click(document.getElementById("fire"));
    const toast = document.querySelector(".fg-toast");
    expect(toast?.classList.contains("mine")).toBe(true);
    expect(toast?.textContent).toContain("Saved");
    expect(toast?.querySelector(".fg-toast-close")).toBeNull();
  });
  it("keeps the default toast", async () => {
    await mount(h(Toaster, null, h(Fire)));
    await click(document.getElementById("fire"));
    expect(document.querySelector(".fg-toast .fg-toast-close")).not.toBeNull();
  });
});
