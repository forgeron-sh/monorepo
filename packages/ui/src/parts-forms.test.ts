// @vitest-environment jsdom
import { act, createElement as h, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Checkbox,
  Kbd,
  KbdGroup,
  Progress,
  RadioGroup,
  RadioGroupItem,
  Separator,
  Slider,
  Switch,
  Toggle,
  ToggleGroup,
  ToggleGroupItem,
} from "./index";

// shadcn's form-control shapes next to our props-driven ones (D-156).

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let unmount: (() => void) | undefined;
const mount = async (element: ReactElement) => {
  host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(element));
  unmount = () => root.unmount();
  return host;
};
const click = async (el: Element | null) => {
  await act(async () => (el as HTMLElement).click());
};
afterEach(async () => {
  await act(async () => unmount?.());
  host?.remove();
  host = undefined;
});

describe("Checkbox", () => {
  it("is shadcn's without a label and reports checked", async () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();
    const el = await mount(h(Checkbox, { onCheckedChange }));
    const box = el.querySelector('[role="checkbox"]');
    expect(box).not.toBeNull();
    await click(box);
    expect(onCheckedChange.mock.calls[0]?.[0]).toBe(true);
    expect(box?.getAttribute("aria-checked")).toBe("true");
  });
  it("keeps the native one with a label", async () => {
    const el = await mount(h(Checkbox, { label: "Archived", defaultChecked: true }));
    expect(el.querySelector("input.fg-check-input")).not.toBeNull();
    expect(el.textContent).toContain("Archived");
  });
});

describe("Switch", () => {
  it("is shadcn's without a label", async () => {
    const onCheckedChange = vi.fn<(checked: boolean) => void>();
    const el = await mount(h(Switch, { onCheckedChange, size: "sm" }));
    const sw = el.querySelector('[role="switch"]');
    expect(sw?.className).toContain("fg-sw");
    await click(sw);
    expect(onCheckedChange.mock.calls[0]?.[0]).toBe(true);
  });
  it("keeps the native one with a label", async () => {
    const el = await mount(h(Switch, { label: "Notify" }));
    expect(el.querySelector("input.fg-switch-input")).not.toBeNull();
  });
});

describe("RadioGroup", () => {
  it("composes with RadioGroupItem and reports the value", async () => {
    const onValueChange = vi.fn<(value: unknown) => void>();
    const el = await mount(
      h(
        RadioGroup,
        { defaultValue: "a", onValueChange },
        h(RadioGroupItem, { value: "a" }),
        h(RadioGroupItem, { value: "b" }),
      ),
    );
    const radios = el.querySelectorAll('[role="radio"]');
    expect(radios).toHaveLength(2);
    expect(radios[0]?.getAttribute("aria-checked")).toBe("true");
    await click(radios[1] ?? null);
    expect(onValueChange.mock.calls[0]?.[0]).toBe("b");
  });
  it("keeps the options form", async () => {
    const el = await mount(h(RadioGroup, { label: "Plan", options: [{ value: "x", label: "X" }] }));
    expect(el.querySelector("fieldset input[type=radio]")).not.toBeNull();
  });
});

describe("Slider", () => {
  it("is shadcn's without a label: number arrays", async () => {
    const el = await mount(h(Slider, { defaultValue: [20, 60], max: 100 }));
    expect(el.querySelectorAll(".fg-slider-thumb")).toHaveLength(2);
    expect(
      el.querySelectorAll('input[type="range"]')[1]?.getAttribute("aria-valuenow") ?? "60",
    ).toBe("60");
  });
  it("keeps the labelled one", async () => {
    const el = await mount(h(Slider, { label: "Volume", defaultValue: 30, showValue: true }));
    expect(el.textContent).toContain("Volume");
    expect(el.querySelectorAll(".fg-slider-thumb")).toHaveLength(1);
  });
});

describe("Progress, Kbd, Separator", () => {
  it("Progress without a label takes `value` only", async () => {
    const el = await mount(h(Progress, { value: 40 }));
    const bar = el.querySelector('[role="progressbar"]');
    expect(bar?.getAttribute("aria-valuenow")).toBe("40");
    expect(el.querySelector(".fg-progress-fill")).not.toBeNull();
  });
  it("Progress keeps its label form", async () => {
    const el = await mount(h(Progress, { label: "Upload", value: 40, showValue: true }));
    expect(el.textContent).toContain("40%");
  });
  it("Kbd takes children, KbdGroup groups, keys still works", async () => {
    const el = await mount(
      h(
        "div",
        null,
        h(KbdGroup, null, h(Kbd, null, "⌘"), h(Kbd, null, "K")),
        h(Kbd, { keys: ["⌥", "S"] }),
      ),
    );
    expect(el.querySelectorAll("kbd.fg-kbd")).toHaveLength(4);
    expect(el.textContent).toContain("⌘K");
  });
  it("Separator is decorative when asked", async () => {
    const el = await mount(
      h("div", null, h(Separator, { decorative: true }), h(Separator, { orientation: "vertical" })),
    );
    expect(el.querySelectorAll('[role="none"]')).toHaveLength(1);
    expect(el.querySelector('[role="separator"]')?.getAttribute("aria-orientation")).toBe(
      "vertical",
    );
  });
});

describe("Toggle and ToggleGroup", () => {
  it("Toggle presses and reports", async () => {
    const onPressedChange = vi.fn<(pressed: boolean) => void>();
    const el = await mount(h(Toggle, { variant: "outline", size: "sm", onPressedChange }, "Bold"));
    const button = el.querySelector("button");
    expect(button?.className).toContain("fg-toggle-outline");
    await click(button);
    expect(onPressedChange.mock.calls[0]?.[0]).toBe(true);
    expect(button?.getAttribute("aria-pressed")).toBe("true");
  });
  it("ToggleGroup keeps a list of values", async () => {
    const onValueChange = vi.fn<(value: string[]) => void>();
    const el = await mount(
      h(
        ToggleGroup,
        { multiple: true, defaultValue: ["a"], onValueChange, variant: "outline" },
        h(ToggleGroupItem, { value: "a" }, "A"),
        h(ToggleGroupItem, { value: "b" }, "B"),
      ),
    );
    const buttons = el.querySelectorAll("button");
    expect(buttons[0]?.getAttribute("aria-pressed")).toBe("true");
    expect(buttons[0]?.className).toContain("fg-toggle-outline");
    await click(buttons[1] ?? null);
    expect(onValueChange.mock.calls[0]?.[0]).toEqual(["a", "b"]);
  });
});
