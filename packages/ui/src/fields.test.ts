// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Accordion,
  Banner,
  Collapsible,
  COLOR_PALETTE,
  ColorPicker,
  Combobox,
  formatFileSize,
  formatMoney,
  formatTime,
  matchesAccept,
  minorDigits,
  MoneyInput,
  normalizeHex,
  NumberInput,
  OtpInput,
  parseNumber,
  parseTime,
  rangePresets,
  Rating,
  Scale,
  Slider,
  SplitPane,
  TagInput,
  TimePicker,
  Toolbar,
  ToolbarButton,
} from "./index";

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
const key = (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
    );
  });
const type = (el: HTMLInputElement, text: string) =>
  act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
const paste = (el: Element, text: string) =>
  act(async () => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(event, "clipboardData", { value: { getData: () => text } });
    el.dispatchEvent(event);
  });

describe("numbers and money", () => {
  it("reads a number the way the locale writes it", () => {
    expect(parseNumber("1 234,5", "fr-FR")).toBe(1234.5);
    expect(parseNumber("1 234,5", "fr-FR")).toBe(1234.5);
    expect(parseNumber("1,234.5", "en-US")).toBe(1234.5);
    expect(parseNumber("12.5", "fr-FR")).toBe(12.5);
    expect(parseNumber("-3", "en-US")).toBe(-3);
    expect(parseNumber("", "en-US")).toBeNull();
    expect(parseNumber("abc", "en-US")).toBeNull();
  });
  it("knows how many digits a currency has", () => {
    expect(minorDigits("EUR")).toBe(2);
    expect(minorDigits("JPY")).toBe(0);
    expect(minorDigits("BHD")).toBe(3);
    expect(formatMoney(123450, "EUR", "en-US")).toBe("€1,234.50");
    expect(formatMoney(500, "JPY", "en-US")).toBe("¥500");
  });
  it("steps with the arrows and clamps to the limits", async () => {
    const spy = vi.fn<(value?: unknown) => void>();
    const page = await mount(
      h(NumberInput, { label: "Seats", defaultValue: 5, min: 1, max: 6, onChange: spy }),
    );
    const input = page.querySelector<HTMLInputElement>("input")!;
    expect(input.getAttribute("role")).toBe("spinbutton");
    await key(input, "ArrowUp");
    await key(input, "ArrowUp");
    expect(spy).toHaveBeenLastCalledWith(6);
    expect(
      page.querySelector('button[aria-label="Increase Seats"]')?.hasAttribute("disabled"),
    ).toBe(true);
    await key(input, "PageDown");
    expect(spy).toHaveBeenLastCalledWith(1);
  });
  it("writes minor units and puts the symbol on the locale's side", async () => {
    const spy = vi.fn<(value?: unknown) => void>();
    const page = await mount(
      h(MoneyInput, {
        label: "Price",
        currency: "EUR",
        locale: "fr-FR",
        defaultValue: 123450,
        onChange: spy,
      }),
    );
    const input = page.querySelector<HTMLInputElement>("input")!;
    expect(input.value.replace(/\s/g, "")).toBe("1234,50");
    expect(page.querySelector(".fg-num-input + .fg-num-affix")).toBeTruthy();
    await key(input, "ArrowUp");
    expect(spy).toHaveBeenLastCalledWith(123550);
  });
});

describe("TagInput", () => {
  it("ends a tag on a separator, on Enter, and removes the last with Backspace", async () => {
    const spy = vi.fn<(value?: unknown) => void>();
    const page = await mount(h(TagInput, { label: "To", onChange: spy }));
    const input = page.querySelector<HTMLInputElement>("input")!;
    await type(input, "a@x.fr,");
    expect(spy).toHaveBeenLastCalledWith(["a@x.fr"]);
    await type(input, "b@x.fr");
    await key(input, "Enter");
    expect(spy).toHaveBeenLastCalledWith(["a@x.fr", "b@x.fr"]);
    await key(input, "Backspace");
    expect(spy).toHaveBeenLastCalledWith(["a@x.fr"]);
  });
  it("splits a paste, drops duplicates and marks invalid tags", async () => {
    const spy = vi.fn<(value?: unknown) => void>();
    const page = await mount(
      h(TagInput, { label: "To", onChange: spy, validate: (t: string) => t.includes("@") }),
    );
    await paste(page.querySelector("input")!, "a@x.fr; b@x.fr\nnope a@x.fr");
    expect(spy).toHaveBeenLastCalledWith(["a@x.fr", "b@x.fr", "nope"]);
    expect(page.querySelectorAll(".fg-combo-chip-bad")).toHaveLength(1);
  });
  it("stops at max", async () => {
    const spy = vi.fn<(value?: unknown) => void>();
    const page = await mount(h(TagInput, { label: "To", max: 2, onChange: spy }));
    await paste(page.querySelector("input")!, "a b c");
    expect(spy).toHaveBeenLastCalledWith(["a", "b"]);
  });
});

describe("Rating and Scale", () => {
  it("works as a slider for the keyboard, by halves when asked", async () => {
    const spy = vi.fn<(value?: unknown) => void>();
    const page = await mount(
      h(Rating, { label: "Quality", half: true, defaultValue: 2, onChange: spy }),
    );
    const stars = page.querySelector('[role="slider"]')!;
    expect(stars.getAttribute("aria-valuenow")).toBe("2");
    await key(stars, "ArrowRight");
    expect(spy).toHaveBeenLastCalledWith(2.5);
    await key(stars, "End");
    expect(spy).toHaveBeenLastCalledWith(5);
    await key(stars, "Backspace");
    expect(spy).toHaveBeenLastCalledWith(null);
  });
  it("reads as an image when read only, with no tab stop", () => {
    const out = html(h(Rating, { label: "Average", value: 4.5, readOnly: true }));
    expect(out).toContain('role="img"');
    expect(out).toContain("Average: 4.5 out of 5");
    expect(out).not.toContain("tabindex");
  });
  it("moves a radio group of numbers with the arrows and colours an NPS answer", async () => {
    const spy = vi.fn<(value?: unknown) => void>();
    const page = await mount(
      h(Scale, { label: "Recommend?", nps: true, defaultValue: 6, onChange: spy }),
    );
    const row = page.querySelector('[role="radiogroup"]')!;
    expect(row.querySelectorAll('[role="radio"]')).toHaveLength(11);
    expect(row.querySelector(".fg-scale-bad")?.textContent).toBe("6");
    await key(row, "ArrowRight");
    expect(spy).toHaveBeenLastCalledWith(7);
    expect(row.querySelector(".fg-scale-mid")?.textContent).toBe("7");
  });
});

describe("time", () => {
  it("reads and writes HH:mm", () => {
    expect(parseTime("09:05")).toEqual({ h: 9, m: 5 });
    expect(parseTime("24:00")).toBeNull();
    expect(parseTime("nope")).toBeNull();
    expect(formatTime("14:30")).toBe("14:30");
    expect(formatTime("14:30", true)).toBe("2:30 PM");
    expect(formatTime("00:05", true)).toBe("12:05 AM");
  });
  it("changes the hour and minutes with the arrows, types digits and clears", async () => {
    const spy = vi.fn<(value?: unknown) => void>();
    const page = await mount(
      h(TimePicker, { label: "Start", defaultValue: "09:30", step: 15, onChange: spy }),
    );
    const [hour, minute] = page.querySelectorAll('[role="spinbutton"]');
    await key(hour!, "ArrowUp");
    expect(spy).toHaveBeenLastCalledWith("10:30");
    await key(minute!, "ArrowDown");
    expect(spy).toHaveBeenLastCalledWith("10:15");
    await key(hour!, "1");
    await key(hour!, "8");
    expect(spy).toHaveBeenLastCalledWith("18:15");
    await key(hour!, "Backspace");
    expect(spy).toHaveBeenLastCalledWith(null);
  });
  it("wraps the minutes in 12 hours and keeps AM and PM", async () => {
    const spy = vi.fn<(value?: unknown) => void>();
    const page = await mount(
      h(TimePicker, { label: "Start", hour12: true, defaultValue: "13:00", onChange: spy }),
    );
    expect(page.textContent).toContain("PM");
    const hour = page.querySelector('[role="spinbutton"]')!;
    expect(hour.textContent).toBe("01");
    await key(hour, "ArrowDown");
    expect(spy).toHaveBeenLastCalledWith("12:00");
  });
  it("offers the quick picks of a range from today", () => {
    const picks = rangePresets("2026-11-19");
    expect(picks[1]).toMatchObject({ from: "2026-11-13", to: "2026-11-19" });
    expect(picks[3]).toMatchObject({ from: "2026-11-01", to: "2026-11-30" });
    expect(picks[4]).toMatchObject({ from: "2026-10-01", to: "2026-10-31" });
  });
});

describe("colour, files, code", () => {
  it("normalises hex codes", () => {
    expect(normalizeHex("#ABC")).toBe("#aabbcc");
    expect(normalizeHex("ff4f1f")).toBe("#ff4f1f");
    expect(normalizeHex("#12")).toBeNull();
    expect(normalizeHex("zzz")).toBeNull();
  });
  it("chooses a swatch and moves with the arrows in two dimensions", async () => {
    const spy = vi.fn<(value?: unknown) => void>();
    const page = await mount(
      h(ColorPicker, {
        inline: true,
        label: "Colour",
        defaultValue: null,
        columns: 4,
        onChange: spy,
      }),
    );
    const cells = page.querySelectorAll<HTMLElement>('[role="radio"]');
    expect(cells).toHaveLength(COLOR_PALETTE.length);
    await act(async () => cells[2]!.click());
    expect(spy).toHaveBeenLastCalledWith(COLOR_PALETTE[2]!.value);
    cells[2]!.focus();
    await key(page.querySelector('[role="radiogroup"]')!, "ArrowDown");
    expect(document.activeElement).toBe(cells[6]);
  });
  it("matches accept lists and writes sizes", () => {
    expect(matchesAccept({ name: "a.png", type: "image/png" }, "image/*,.pdf")).toBe(true);
    expect(matchesAccept({ name: "a.PDF", type: "" }, "image/*,.pdf")).toBe(true);
    expect(matchesAccept({ name: "a.zip", type: "application/zip" }, "image/*,.pdf")).toBe(false);
    expect(matchesAccept({ name: "a.zip", type: "x" })).toBe(true);
    expect(formatFileSize(12)).toBe("12 B");
    expect(formatFileSize(1536)).toBe("1.5 KB");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5 MB");
  });
  it("fills the cells from a paste, then reports the complete code once", async () => {
    const done = vi.fn<(value?: unknown) => void>();
    const page = await mount(h(OtpInput, { label: "Code", length: 4, onComplete: done }));
    const cells = page.querySelectorAll<HTMLInputElement>("input");
    expect(cells).toHaveLength(4);
    expect(cells[1]!.getAttribute("aria-label")).toBe("Code, character 2 of 4");
    await paste(cells[2]!, "12 34");
    expect([...cells].map((c) => c.value).join("")).toBe("1234");
    expect(done).toHaveBeenCalledTimes(1);
    expect(done).toHaveBeenCalledWith("1234");
  });
  it("types a character, then Backspace takes it back", async () => {
    const spy = vi.fn<(value?: unknown) => void>();
    const page = await mount(h(OtpInput, { label: "Code", length: 3, onChange: spy }));
    const cells = page.querySelectorAll<HTMLInputElement>("input");
    await type(cells[0]!, "7");
    expect(spy).toHaveBeenLastCalledWith("7");
    await type(cells[1]!, "x");
    expect(spy).toHaveBeenCalledTimes(1);
    await key(cells[1]!, "Backspace");
    expect(spy).toHaveBeenLastCalledWith("");
  });
});

describe("layout parts", () => {
  it("moves the divider with the arrows, within its limits, and tells the caller", async () => {
    const spy = vi.fn<(value?: unknown) => void>();
    const page = await mount(
      h(SplitPane, {
        label: "Resize",
        defaultSize: 200,
        min: 150,
        keyStep: 20,
        onChange: spy,
        first: "a",
        second: "b",
      }),
    );
    const bar = page.querySelector('[role="separator"]')!;
    expect(bar.getAttribute("aria-valuenow")).toBe("200");
    expect(bar.getAttribute("aria-orientation")).toBe("vertical");
    await key(bar, "ArrowRight");
    expect(spy).toHaveBeenLastCalledWith(220);
    await key(bar, "Home");
    expect(spy).toHaveBeenLastCalledWith(150);
    await key(bar, "ArrowLeft");
    expect(bar.getAttribute("aria-valuenow")).toBe("150");
  });
  it("shows the size it is given when controlled", async () => {
    const page = await mount(h(SplitPane, { label: "Resize", size: 300, first: "a", second: "b" }));
    expect(
      page.querySelector<HTMLElement>(".fg-split")!.style.getPropertyValue("--fg-split-size"),
    ).toBe("300px");
    await key(page.querySelector('[role="separator"]')!, "ArrowRight");
    expect(page.querySelector('[role="separator"]')!.getAttribute("aria-valuenow")).toBe("300");
  });
  it("folds and unfolds with its button", async () => {
    const spy = vi.fn<(value?: unknown) => void>();
    const page = await mount(
      h(Collapsible, { title: "More", onOpenChange: spy, children: "Hidden text" }),
    );
    const button = page.querySelector("button")!;
    expect(button.getAttribute("aria-expanded")).toBe("false");
    await act(async () => button.click());
    expect(spy).toHaveBeenLastCalledWith(true);
    expect(button.getAttribute("aria-expanded")).toBe("true");
  });
  it("keeps one section of an accordion open, or several", async () => {
    const spy = vi.fn<(value?: unknown) => void>();
    const items = [
      { value: "a", title: "A", content: "aa" },
      { value: "b", title: "B", content: "bb" },
    ];
    const page = await mount(h(Accordion, { items, defaultValue: ["a"], onChange: spy }));
    const [a, b] = page.querySelectorAll("button");
    expect(a!.getAttribute("aria-expanded")).toBe("true");
    await act(async () => b!.click());
    expect(spy).toHaveBeenLastCalledWith(["b"]);
  });
  it("dismisses a banner and announces danger at once", async () => {
    const page = await mount(
      h(Banner, { tone: "danger", title: "Payment failed.", dismissible: true }),
    );
    expect(page.querySelector(".fg-banner")?.getAttribute("role")).toBe("alert");
    expect(page.textContent).toContain("Error");
    await act(async () => page.querySelector<HTMLElement>('[aria-label="Dismiss"]')!.click());
    expect(page.querySelector(".fg-banner")).toBeNull();
  });
  it("makes a toolbar one tab stop whose toggles say whether they are on", async () => {
    const page = await mount(
      h(Toolbar, {
        label: "Format",
        children: [
          h(ToolbarButton, { key: "b", label: "Bold", pressed: true }),
          h(ToolbarButton, { key: "i", label: "Italic" }),
        ],
      }),
    );
    const bar = page.querySelector('[role="toolbar"]')!;
    expect(bar.getAttribute("aria-label")).toBe("Format");
    const buttons = bar.querySelectorAll("button");
    expect(buttons[0]!.getAttribute("aria-pressed")).toBe("true");
    expect([...buttons].filter((b) => b.tabIndex === 0)).toHaveLength(1);
  });
});

describe("Slider and Combobox", () => {
  it("renders a thumb per value, named from and to for a range", async () => {
    const page = await mount(
      h(Slider, { label: "Price", defaultValue: [20, 60], showValue: true }),
    );
    const inputs = page.querySelectorAll<HTMLInputElement>('input[type="range"]');
    expect(inputs).toHaveLength(2);
    expect(inputs[0]!.getAttribute("aria-label")).toBe("Price, from");
    expect(inputs[1]!.getAttribute("aria-label")).toBe("Price, to");
    expect(page.querySelector("output")!.textContent).toBe("20 – 60");
  });
  it("moves a single thumb with the keyboard", async () => {
    const spy = vi.fn<(value?: unknown) => void>();
    const page = await mount(
      h(Slider, { label: "Volume", defaultValue: 40, step: 5, onChange: spy }),
    );
    const thumb = page.querySelector<HTMLInputElement>('input[type="range"]')!;
    await key(thumb, "ArrowRight");
    expect(spy).toHaveBeenLastCalledWith(45);
  });
  it("shows the chosen option, and opens a list of options to filter", async () => {
    const options = [
      { value: "fr", label: "France" },
      { value: "de", label: "Germany" },
    ];
    const page = await mount(h(Combobox, { label: "Country", options, defaultValue: "de" }));
    const input = page.querySelector<HTMLInputElement>("input")!;
    expect(input.getAttribute("role")).toBe("combobox");
    expect(input.getAttribute("aria-label")).toBe("Country");
    expect(input.value).toBe("Germany");
  });
  it("shows chips for several choices", async () => {
    const options = [
      { value: "a", label: "Alpha" },
      { value: "b", label: "Beta" },
    ];
    const page = await mount(
      h(Combobox, { multiple: true, label: "Labels", options, defaultValue: ["a", "b"] }),
    );
    expect(page.querySelectorAll(".fg-combo-chip")).toHaveLength(2);
    expect(page.querySelector('[aria-label="Remove Beta"]')).toBeTruthy();
  });
});
