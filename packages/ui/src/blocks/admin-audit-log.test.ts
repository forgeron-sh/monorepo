// @vitest-environment jsdom
import { PackageIcon } from "@forgeron/icons";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AppShell,
  AuditLog,
  AuditLogDay,
  AuditLogEvent,
  BarChart,
  Drawer,
  KpiRow,
  LineChart,
  SettingsRow,
  Sparkline,
  Table,
  type AuditEvent,
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
const key = async (el: Element, k: string) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
  });

describe("KpiRow", () => {
  it("writes each figure with its label, and the change in words as well as colour", () => {
    const out = html(
      h(KpiRow, {
        items: [
          { label: "Revenue", value: "€48.2k", delta: 0.124, hint: "vs last month" },
          { label: "Open tickets", value: "37", delta: 0.09, better: "down" },
          { label: "Win rate", value: "31%", delta: 0 },
        ],
      }),
    );
    expect(out).toContain("<dt");
    expect(out).toContain("€48.2k");
    expect(out).toContain("+12.4%");
    expect(out).toContain("vs last month");
    expect(out).toMatch(/fg-kpi-good[^>]*>[\s\S]*?up [\s\S]*?\+12\.4%/);
    expect(out).toMatch(/fg-kpi-bad[^>]*>[\s\S]*?up [\s\S]*?\+9%/);
    expect(out).toMatch(/fg-kpi-flat[^>]*>[\s\S]*?unchanged [\s\S]*?±0%/);
  });
  it("takes a format for a change that is not a ratio, and draws the trend", () => {
    const out = html(
      h(KpiRow, {
        formatDelta: (d: number) => `+${d}`,
        items: [{ label: "Deploys", value: "64", delta: 12, trend: [1, 3, 2, 5] }],
      }),
    );
    expect(out).toContain("+12");
    expect(out).toContain("fg-spark");
  });
});

describe("Sparkline", () => {
  it("is decorative without a label and an image with one", () => {
    expect(html(h(Sparkline, { values: [1, 2, 3] }))).toContain('aria-hidden="true"');
    const named = html(h(Sparkline, { values: [1, 2, 3], label: "Signups" }));
    expect(named).toContain('role="img"');
    expect(named).toContain('aria-label="Signups"');
  });
  it("draws whole pixels: a path of rectangles only", () => {
    const out = html(h(Sparkline, { values: [1, 4, 2], width: 24, height: 8 }));
    expect(out).toContain('viewBox="0 0 12 4"');
    expect(out).toMatch(/<path d="(M\d+ \d+h\d+v\d+h-\d+z)+"/);
  });
});

describe("LineChart", () => {
  const points = [
    { label: "W1", value: 10 },
    { label: "W2", value: 30 },
    { label: "W3", value: 20 },
  ];
  it("reads the last point and gives every value as a table", () => {
    const out = html(h(LineChart, { title: "Signups", points, previous: [5, 6, 7] }));
    expect(out).toContain("<figcaption");
    expect(out).toMatch(/<output[^>]*>[\s\S]*W3[\s\S]*20[\s\S]*before 7/);
    expect(out).toContain("<caption>Signups</caption>");
    expect(out).toMatch(/<th scope="row">W2<\/th><td>30<\/td><td>6<\/td>/);
  });
  it("moves the readout with the arrows", async () => {
    const el = await mount(h(LineChart, { title: "Signups", points }));
    const plot = el.querySelector(".fg-line-plot")!;
    const readout = () => el.querySelector("output")!.textContent;
    expect(readout()).toContain("W3");
    await key(plot, "ArrowLeft");
    expect(readout()).toContain("W2");
    await key(plot, "Home");
    expect(readout()).toContain("W1");
    await key(plot, "ArrowLeft");
    expect(readout()).toContain("W1");
    await key(plot, "End");
    expect(readout()).toContain("W3");
  });
});

describe("AuditLog", () => {
  const events: AuditEvent[] = [
    { id: "a", at: "2026-11-18 09:42", actor: "Camille Roy", action: "deployed", target: "x 1.4" },
    {
      id: "b",
      at: "2026-11-17 09:15",
      actor: "crm-import",
      actorIcon: PackageIcon,
      action: "read",
      target: "crm.leads",
      outcome: "denied",
      detail: "Not granted.",
    },
    { id: "c", at: "2026-10-02 08:00", actor: "Léa Martin", action: "installed" },
  ];
  it("groups by day, names today and yesterday, and writes a refusal", () => {
    const out = html(h(AuditLog, { events, today: "2026-11-18" }));
    expect(out).toContain("Today · Nov 18");
    expect(out).toContain("Yesterday · Nov 17");
    expect(out).toContain("Oct 2");
    expect(out).toContain('dateTime="2026-11-18T09:42"');
    expect(out).toContain("Denied");
    expect(out.match(/fg-timeline-group-label/g)).toHaveLength(3);
  });
  it("folds the detail of a row open and shut", async () => {
    const el = await mount(h(AuditLog, { events, today: "2026-11-18" }));
    const button = el.querySelector<HTMLButtonElement>("button.fg-audit-line")!;
    const panel = el.querySelector<HTMLElement>(
      `#${CSS.escape(button.getAttribute("aria-controls")!)}`,
    )!;
    expect(button.getAttribute("aria-expanded")).toBe("false");
    expect(panel.hidden).toBe(true);
    await act(async () => button.click());
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(panel.hidden).toBe(false);
    expect(panel.textContent).toBe("Not granted.");
    await act(async () => button.click());
    expect(panel.hidden).toBe(true);
  });
  it("says when there is nothing", () => {
    expect(html(h(AuditLog, { events: [], empty: "Quiet" }))).toContain("Quiet");
  });
});

describe("AuditLog parts", () => {
  const event: AuditEvent = {
    id: "a",
    at: "2026-11-18 09:42",
    actor: "Camille Roy",
    action: "deployed",
    detail: "Request body.",
  };
  it("composes the days and the events, and folds an event open", async () => {
    const el = await mount(
      h(
        AuditLog,
        { events: [event], today: "2026-11-18", className: "mine" },
        h(AuditLogDay, { day: "2026-11-18" }, h(AuditLogEvent, { event, className: "ev" })),
      ),
    );
    expect(el.querySelector("[data-slot=audit-log]")?.className).toBe("fg-audit mine");
    expect(el.querySelector("[data-slot=audit-log-day]")).toBeTruthy();
    const row = el.querySelector("[data-slot=audit-log-event]")!;
    expect(row.className).toContain("ev");
    await act(async () => row.querySelector<HTMLButtonElement>("button")!.click());
    expect(row.querySelector<HTMLElement>(".fg-audit-detail")!.hidden).toBe(false);
  });
});

describe("Older blocks, improved", () => {
  it("BarChart marks the highlighted bar", () => {
    const out = html(
      h(BarChart, {
        title: "t",
        highlight: "b",
        data: [
          { label: "a", value: 1 },
          { label: "b", value: 2 },
        ],
      }),
    );
    expect(out.match(/fg-bars-hi/g)).toHaveLength(1);
    expect(out).toMatch(/fg-bars-hi[\s\S]*>b</);
  });
  it("Table takes a name", () => {
    const out = html(h(Table, { label: "Invoices", columns: [], rows: [], rowKey: () => 0 }));
    expect(out).toContain('aria-label="Invoices"');
  });
  it("Drawer closes on its icon button and on Escape, and shows its actions", async () => {
    const onClose = vi.fn<() => void>();
    const el = await mount(
      h(Drawer, { title: "Row", onClose, actions: h("button", { id: "copy" }, "Copy") }, "b"),
    );
    expect(el.querySelector("#copy")).not.toBeNull();
    const close = el.querySelector<HTMLButtonElement>('button[aria-label="Close"]')!;
    await act(async () => close.click());
    expect(onClose).toHaveBeenCalledTimes(1);
    await key(el.querySelector("aside")!, "Escape");
    expect(onClose).toHaveBeenCalledTimes(2);
  });
  it("AppShell fills a box, and two shells do not share the sidebar's id", () => {
    const one = html(h(AppShell, { sidebar: "s", frame: "box", className: "x" }, "c"));
    expect(one).toContain("fg-shell fg-shell-box x");
    const ids = html(
      h("div", null, h(AppShell, { sidebar: "a" }), h(AppShell, { sidebar: "b" })),
    ).match(/aria-controls="([^"]+)"/g)!;
    expect(ids).toHaveLength(2);
    expect(ids[0]).not.toBe(ids[1]);
    expect(one).toContain('aria-label="Menu"');
  });
  it("SettingsRow ends a link row with a pixel chevron", () => {
    const out = html(h(SettingsRow, { label: "Members", href: "/m", value: "48" }));
    expect(out).toContain("fg-srow-chev");
    expect(out).not.toContain("stroke=");
  });
});
