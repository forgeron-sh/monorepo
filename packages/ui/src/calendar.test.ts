// @vitest-environment jsdom
import { CloudIcon, Folder01Icon } from "@forgeron/icons";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { addDays, addMonths, formatLong, formatShort, monthGrid, weekday } from "./dates";
import {
  AppTile,
  AvatarGroup,
  Breadcrumb,
  Calendar,
  EmptyState,
  IconButton,
  Progress,
  SearchBox,
  Swatch,
  duePresets,
} from "./index";

// The markup these cases pin, without the shadcn `data-slot` names (the forwarding tests check them).
const html = (...args: Parameters<typeof renderToStaticMarkup>) =>
  renderToStaticMarkup(...args).replace(/ data-slot="[^"]*"/g, "");

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

describe("dates", () => {
  it("counts days across months and years", () => {
    expect(addDays("2026-11-30", 1)).toBe("2026-12-01");
    expect(addDays("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDays("2026-03-01", -1)).toBe("2026-02-28");
  });
  it("keeps the day inside a shorter month", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-12-15", 1)).toBe("2027-01-15");
  });
  it("starts the grid on the Monday on or before the 1st, six weeks long", () => {
    const grid = monthGrid(2026, 10);
    expect(grid).toHaveLength(42);
    expect(grid[0]).toBe("2026-10-26");
    expect(weekday(grid[0]!)).toBe(0);
    expect(grid).toContain("2026-11-30");
  });
  it("names days short and long", () => {
    expect(formatShort("2026-11-18", 2026)).toBe("Nov 18");
    expect(formatShort("2027-01-04", 2026)).toBe("Jan 4, 2027");
    expect(formatLong("2026-11-18")).toBe("Wednesday 18 November 2026");
  });
  it("offers tomorrow, Friday, next Monday and two weeks out", () => {
    expect(duePresets("2026-11-17").map((p) => p.value)).toEqual([
      "2026-11-18",
      "2026-11-20",
      "2026-11-23",
      "2026-12-01",
    ]);
  });
});

describe("Calendar", () => {
  it("marks today and the chosen day, one tab stop", () => {
    const out = html(h(Calendar, { value: "2026-11-18", today: "2026-11-17", label: "Due date" }));
    expect(out).toContain('role="grid" aria-label="Due date, November 2026"');
    expect(out.match(/tabindex="0"/g)).toHaveLength(1);
    expect(out).toMatch(/data-day="2026-11-18" tabindex="0"[^>]*class="fg-cal-day fg-cal-on"/);
    expect(out).toContain('aria-current="date"');
  });
  it("moves with the arrows and chooses with Enter", async () => {
    const onChange = vi.fn<(value: string) => void>();
    const root = await mount(h(Calendar, { value: "2026-11-18", today: "2026-11-17", onChange }));
    const start = root.querySelector<HTMLButtonElement>('[data-day="2026-11-18"]')!;
    start.focus();
    await act(async () => {
      start.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    });
    expect(document.activeElement?.getAttribute("data-day")).toBe("2026-11-25");
    await act(async () => {
      document.activeElement!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "PageDown", bubbles: true }),
      );
    });
    expect(document.activeElement?.getAttribute("data-day")).toBe("2026-12-25");
    expect(root.textContent).toContain("December 2026");
    await act(async () => {
      document.activeElement!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true }),
      );
    });
    expect(onChange).toHaveBeenCalledWith("2026-12-25");
  });
  it("refuses days out of range", () => {
    const out = html(h(Calendar, { today: "2026-11-17", min: "2026-11-17" }));
    expect(out).toMatch(/data-day="2026-11-16"[^>]*disabled=""/);
  });
});

describe("atoms from the app prototypes", () => {
  it("names an icon button by its label", () => {
    const out = html(h(IconButton, { icon: CloudIcon, label: "Sync", variant: "boxed" }));
    expect(out).toMatch(
      /^<button type="button" aria-label="Sync" class="fg-iconbtn fg-iconbtn-boxed">/,
    );
  });
  it("draws an app tile, named only when asked", () => {
    expect(html(h(AppTile, { icon: Folder01Icon }))).toContain('aria-hidden="true"');
    expect(html(h(AppTile, { icon: Folder01Icon, label: "Drive", tone: "ink" }))).toContain(
      'class="fg-tile fg-tile-ink" style="width:32px;height:32px" role="img" aria-label="Drive"',
    );
  });
  it("counts the people past the limit", () => {
    const out = html(h(AvatarGroup, { names: ["Ana Bel", "Cy Dee", "Ed Fox"], max: 2 }));
    expect(out).toContain('aria-label="Ana Bel, Cy Dee, Ed Fox"');
    expect(out).toContain(">+1</span>");
  });
  it("marks the current page last in the breadcrumb", () => {
    const out = html(
      h(Breadcrumb, { items: [{ label: "Operations", href: "/ops" }, { label: "OPS-40" }] }),
    );
    expect(out).toContain('<nav aria-label="Breadcrumb"');
    expect(out).toContain('<a class="fg-crumb" href="/ops">');
    expect(out).toContain('aria-current="page"');
    expect(out.match(/fg-crumb-sep/g)).toHaveLength(1);
  });
  it("keeps the search box a named search input with its shortcut", () => {
    const out = html(h(SearchBox, { placeholder: "Search issues", shortcut: "/" }));
    expect(out).toContain('type="search" aria-label="Search"');
    expect(out).toContain('<kbd class="fg-kbd">/</kbd>');
  });
  it("writes the swatch's name, or hides a bare one", () => {
    expect(html(h(Swatch, { color: "#3ddc84" }, "Marketing"))).toContain("<span>Marketing</span>");
    expect(html(h(Swatch, { color: "#3ddc84" }))).toContain('aria-hidden="true"');
  });
  it("lights the right number of blocks", () => {
    const out = html(h(Progress, { label: "Steps", value: 3, max: 5, segments: 5 }));
    expect(out.match(/fg-progress-seg fg-progress-on/g)).toHaveLength(3);
    expect(out.match(/class="fg-progress-seg/g)).toHaveLength(5);
  });
  it("sets an empty state in the hatched field", () => {
    const out = html(
      h(EmptyState, { title: "No form here yet.", variant: "hatch", icon: Folder01Icon }),
    );
    expect(out).toMatch(/^<div class="fg-empty fg-empty-hatch">/);
    expect(out).toContain("fg-empty-icon");
  });
});
