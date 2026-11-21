import { createElement as h } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Kbd, Progress, RadioGroup, Segmented, Separator, Switch } from "./index";

// The markup these cases pin, without the shadcn `data-slot` names (data-slot.test.ts checks them).
const html = (...args: Parameters<typeof renderToStaticMarkup>) =>
  renderToStaticMarkup(...args).replace(/ data-slot="[^"]*"/g, "");

describe("Switch", () => {
  it("is a checkbox with the switch role, inside its label", () => {
    const out = html(h(Switch, { label: "Notify me", defaultChecked: true }));
    expect(out).toMatch(/^<label class="fg-switch">/);
    expect(out).toContain('type="checkbox" role="switch" class="fg-switch-input"');
    expect(out).toContain("checked");
    expect(out).toContain("<span>Notify me</span>");
  });
});

describe("RadioGroup", () => {
  const options = [
    { value: "day", label: "Day" },
    { value: "week", label: "Week", hint: "Monday to Sunday" },
  ];
  it("names the group once with a legend and shares one name", () => {
    const out = html(h(RadioGroup, { label: "Range", name: "range", options, value: "week" }));
    expect(out).toMatch(/^<fieldset class="fg-radios"><legend class="fg-field-label">Range/);
    expect(out.match(/name="range"/g)).toHaveLength(2);
    expect(out).toContain(`checked="" value="week"`);
    expect(out).toContain('<span class="fg-radio-hint">Monday to Sunday</span>');
  });
  it("lays the options in a row on demand", () => {
    expect(html(h(RadioGroup, { label: "Range", options, direction: "row" }))).toContain(
      'class="fg-radios fg-radios-row"',
    );
  });
});

describe("Segmented", () => {
  it("presses the chosen segment and names the group", () => {
    const out = html(
      h(Segmented, {
        label: "View",
        value: "board",
        onChange: () => {},
        options: [
          { value: "list", label: "List" },
          { value: "board", label: "Board" },
        ],
      }),
    );
    expect(out).toMatch(/^<div[^>]*role="group"[^>]*aria-label="View"[^>]*class="[^"]*fg-seg"/);
    expect(out).toMatch(/aria-pressed="false"[^>]*>List<\/button>/);
    expect(out).toMatch(/aria-pressed="true"[^>]*>Board<\/button>/);
  });
});

describe("Kbd", () => {
  it("draws one cap per key", () => {
    expect(html(h(Kbd, { keys: ["⌘", "K"] }))).toBe(
      '<span class="fg-kbds"><kbd class="fg-kbd">⌘</kbd><kbd class="fg-kbd">K</kbd></span>',
    );
    expect(html(h(Kbd, { keys: "Esc" }))).toContain('<kbd class="fg-kbd">Esc</kbd>');
  });
});

describe("Progress", () => {
  it("tells the value to assistive technology and clamps the fill", () => {
    const out = html(h(Progress, { label: "Upload", value: 150, max: 200, showValue: true }));
    expect(out).toContain('role="progressbar" aria-label="Upload"');
    expect(out).toContain('aria-valuenow="150"');
    expect(out).toContain("width:75%");
    expect(out).toContain('<span class="fg-progress-value">75%</span>');
    expect(html(h(Progress, { label: "Over", value: 300, max: 100 }))).toContain("width:100%");
  });
  it("has no value when the end is unknown", () => {
    const out = html(h(Progress, { label: "Syncing" }));
    expect(out).not.toContain("aria-valuenow");
    expect(out).toContain("fg-progress-indeterminate");
  });
});

describe("Separator", () => {
  it("is a line with its orientation, or a hatched band with a label", () => {
    expect(html(h(Separator, { orientation: "vertical" }))).toBe(
      '<div class="fg-sep fg-sep-vertical" role="separator" aria-orientation="vertical"></div>',
    );
    expect(html(h(Separator, { variant: "hatch" }, "/0.2 → Settings"))).toBe(
      '<div class="fg-sep-hatch" role="separator"><span>/0.2 → Settings</span></div>',
    );
  });
});
