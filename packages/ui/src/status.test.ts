// @vitest-environment jsdom
import { createElement as h } from "react";
import { renderToStaticMarkup as html } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  Status,
  StatusIndicator,
  StatusLabel,
  StatusOf,
  defineStatuses,
  type StatusKey,
} from "./parts-status";

const TASK = defineStatuses({
  done: { label: "Done", tone: "success", order: 3 },
  open: { label: "Open", tone: "accent", glyph: "o" },
  late: { label: "Late", tone: "danger", order: 2 },
});

describe("defineStatuses", () => {
  it("orders items by `order`, then by definition", () => {
    expect(TASK.items.map((i) => i.value)).toEqual(["open", "late", "done"]);
    expect(TASK.keys).toEqual(["open", "late", "done"]);
  });
  it("gives options for pickers, glyph only when defined", () => {
    expect(TASK.items[0]).toEqual({ value: "open", label: "Open", tone: "accent", glyph: "o" });
    expect("glyph" in TASK.items[1]!).toBe(false);
  });
  it("looks up by key", () => {
    expect(TASK.label("late")).toBe("Late");
    expect(TASK.tone("done")).toBe("success");
    expect(TASK.get("open").value).toBe("open");
    expect(TASK.has("nope")).toBe(false);
    expect(() => TASK.get("nope" as StatusKey<typeof TASK>)).toThrow("Unknown status");
  });
});

describe("Status", () => {
  it("draws the dot of the root's tone and the word", () => {
    const out = html(
      h(Status, { tone: "warning" }, h(StatusIndicator), h(StatusLabel, null, "Draft")),
    );
    expect(out).toContain("fg-status");
    expect(out).toContain("fg-led-warning");
    expect(out).toContain('aria-hidden="true"');
    expect(out).toContain("Draft");
  });
  it("replaces the dot with children and keeps it decorative", () => {
    const out = html(h(Status, { tone: "success" }, h(StatusIndicator, null, "✓")));
    expect(out).not.toContain("fg-led");
    expect(out).toContain('aria-hidden="true"');
  });
  it("is props-driven with a label", () => {
    const out = html(h(Status, { tone: "danger", label: "Failed", className: "x" }));
    expect(out).toContain("fg-led-danger");
    expect(out).toContain("Failed");
    expect(out).toContain("x");
  });
  it("draws strong in the text colour", () => {
    expect(html(h(Status, { tone: "strong", label: "Sent" }))).toContain("fg-led-current");
  });
  it("renders its child with asChild", () => {
    const out = html(
      h(Status, { asChild: true, tone: "success" }, h("li", { className: "row" }, "x")),
    );
    expect(out).toMatch(/^<li/);
    expect(out).toContain("fg-status");
    expect(out).toContain("row");
  });
  it("StatusOf reads the set", () => {
    const out = html(h(StatusOf, { set: TASK, value: "late" }));
    expect(out).toContain("fg-led-danger");
    expect(out).toContain("Late");
    expect(html(h(StatusOf, { set: TASK, value: "open" }))).toContain(">o<");
  });
});
