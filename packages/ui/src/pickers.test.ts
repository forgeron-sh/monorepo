import { createElement as h } from "react";
import { renderToStaticMarkup as html } from "react-dom/server";
import { describe, expect, it } from "vitest";
import {
  LabelPicker,
  PersonPicker,
  PriorityGlyph,
  PriorityPicker,
  QuarterGlyph,
  QuarterPicker,
  SizePicker,
  StatusGlyph,
  StatusPicker,
} from "./index";

describe("glyphs", () => {
  it("draws on the 12-pixel grid, decorative, in the colour of its meaning", () => {
    const out = html(h(StatusGlyph, { status: "progress" }));
    expect(out).toMatch(/^<svg class="fg-glyph fg-st-progress" viewBox="0 0 12 12"/);
    expect(out).toContain('aria-hidden="true"');
    expect(out).toContain('opacity="0.35"');
  });
  it("sets urgent apart in ember", () => {
    expect(html(h(PriorityGlyph, { level: 1 }))).toContain("fg-pr-urgent");
    expect(html(h(PriorityGlyph, { level: 3 }))).toContain('class="fg-glyph fg-pr"');
  });
  it("fills the cell of the quarter", () => {
    const q1 = html(h(QuarterGlyph, { quarter: 1 }));
    const q4 = html(h(QuarterGlyph, { quarter: 4 }));
    expect(q1).not.toBe(q4);
    expect(q1).toContain("M1 1h1v1h-1z");
  });
});

describe("pickers", () => {
  it("shows the current status with its glyph and name", () => {
    const out = html(h(StatusPicker, { value: "review" }));
    expect(out).toContain("fg-st-review");
    expect(out).toContain("In Review");
    expect(out).toContain("fg-selm-chip");
  });
  it("renames states", () => {
    expect(html(h(StatusPicker, { value: "done", names: { done: "Solved" } }))).toContain("Solved");
  });
  it("keeps the name for assistive technology when only the mark shows", () => {
    const out = html(h(PriorityPicker, { value: 1, markOnly: true }));
    expect(out).toContain('<span class="fg-sr">Urgent</span>');
    expect(out).toContain("fg-selm-mark");
  });
  it("writes sizes and quarters", () => {
    expect(html(h(SizePicker, { value: 3 }))).toContain(">M<");
    expect(html(h(QuarterPicker, { years: [2026], value: "2026-Q4" }))).toContain("Q4 2026");
    expect(html(h(QuarterPicker, { years: [2026], value: null, clearable: true }))).toContain(
      "No quarter",
    );
  });
  it("marks the viewer and names nobody", () => {
    const people = [
      { id: "a", name: "Ana Bel" },
      { id: "b", name: "Cy Dee" },
    ];
    expect(html(h(PersonPicker, { people, me: "a", value: "a" }))).toContain("Ana Bel (you)");
    expect(html(h(PersonPicker, { people, value: null, noneLabel: "No assignee" }))).toContain(
      "No assignee",
    );
  });
  it("lists the chosen labels with their colours", () => {
    const out = html(
      h(LabelPicker, {
        labels: [
          { value: "bug", label: "Bug", color: "red" },
          { value: "ops", label: "Warehouse", color: "orange" },
        ],
        value: ["bug"],
      }),
    );
    expect(out).toContain("background:red");
    expect(out).toContain("Bug");
    expect(out).not.toContain("Warehouse");
    expect(out).toContain("fg-selm-chip");
  });
  it("draws labels as a form field with its caret", () => {
    const out = html(
      h(LabelPicker, {
        labels: [{ value: "bug", label: "Bug", color: "red" }],
        variant: "field",
      }),
    );
    expect(out).not.toContain("fg-selm-chip");
    expect(out).toContain("fg-selm-caret");
  });
});
