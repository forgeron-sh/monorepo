// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  COLOR_PALETTE,
  ColorPickerClear,
  ColorPickerInput,
  ColorPickerPanel,
  ColorPickerRoot,
  ColorPickerSwatch,
  ColorPickerSwatches,
} from "./color-picker";
import {
  FileInput,
  FileInputDrop,
  FileInputHint,
  FileInputItem,
  FileInputLimits,
  FileInputList,
  FileInputTrigger,
} from "./file-input";
import {
  CurrencyPicker,
  CurrencyPickerItem,
  MoneyInput,
  MoneyInputField,
  MoneyInputSymbol,
  NumberInput,
  NumberInputAffix,
  NumberInputDecrement,
  NumberInputField,
  NumberInputIncrement,
} from "./numbers";
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, OtpInput } from "./otp-input";
import { Rating, RatingItem } from "./rating";
import { Stepper, StepperDecrement, StepperField, StepperIncrement } from "./stepper";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
afterEach(() => {
  host?.remove();
  host = undefined;
  document.body.innerHTML = "";
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(element));
  return host;
};
const key = (el: Element, k: string) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true }));
  });
const type = (el: HTMLInputElement, text: string) =>
  act(async () => {
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(el, text);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
const paste = (el: Element, text: string) =>
  act(async () => {
    const event = new Event("paste", { bubbles: true, cancelable: true });
    (event as unknown as { clipboardData: unknown }).clipboardData = { getData: () => text };
    el.dispatchEvent(event);
  });

describe("InputOTP parts", () => {
  const code = (done?: (v: string) => void) =>
    h(
      InputOTP,
      { label: "Code", maxLength: 4, ...(done ? { onComplete: done } : {}) },
      h(InputOTPGroup, null, h(InputOTPSlot, { index: 0 }), h(InputOTPSlot, { index: 1 })),
      h(InputOTPSeparator),
      h(InputOTPGroup, null, h(InputOTPSlot, { index: 2 }), h(InputOTPSlot, { index: 3 })),
    );

  it("lays cells out in groups with a separator and names each cell", async () => {
    const page = await mount(code());
    expect(page.querySelectorAll(".fg-otp-group")).toHaveLength(2);
    expect(page.querySelector(".fg-otp-sep")?.getAttribute("aria-hidden")).toBe("true");
    const cells = page.querySelectorAll<HTMLInputElement>("input");
    expect(cells).toHaveLength(4);
    expect(cells[3]!.getAttribute("aria-label")).toBe("Code, character 4 of 4");
    expect(cells[0]!.autocomplete).toBe("one-time-code");
  });

  it("fills every cell from a paste across groups and completes once", async () => {
    const done = vi.fn<(v: string) => void>();
    const page = await mount(code(done));
    const cells = page.querySelectorAll<HTMLInputElement>("input");
    await paste(cells[2]!, "1234");
    expect([...cells].map((c) => c.value).join("")).toBe("1234");
    expect(done).toHaveBeenCalledTimes(1);
    expect(done).toHaveBeenCalledWith("1234");
  });

  it("moves between groups with the arrows", async () => {
    const page = await mount(code());
    const cells = page.querySelectorAll<HTMLInputElement>("input");
    cells[1]!.focus();
    await key(cells[1]!, "ArrowRight");
    expect(document.activeElement).toBe(cells[2]);
    await key(cells[2]!, "End");
    expect(document.activeElement).toBe(cells[3]);
  });

  it("is what OtpInput draws: same cells, the gap on the first of a group", async () => {
    const page = await mount(h(OtpInput, { label: "Code", length: 6, group: 3 }));
    const cells = page.querySelectorAll<HTMLInputElement>(".fg-otp-cell");
    expect(cells).toHaveLength(6);
    expect(cells[3]!.className).toContain("fg-otp-gap");
    expect(cells[2]!.className).not.toContain("fg-otp-gap");
  });

  it("refuses a slot outside an InputOTP", () => {
    expect(() => html(h(InputOTPSlot, { index: 0 }))).toThrow(/InputOTP/);
  });
});

describe("Stepper parts", () => {
  it("draws the props form from its parts, markup only", () => {
    const markup = html(h(Stepper, { label: "Seats", value: 4 }));
    expect(markup).toContain('data-step="-1"');
    expect(markup).toContain('aria-label="Fewer: Seats"');
    expect(markup).toContain('value="4"');
    expect(markup).toContain('data-step="1"');
  });

  it("takes the parts in any order, with other glyphs", () => {
    const markup = html(
      h(
        Stepper,
        { label: "Seats", className: "x" },
        h(StepperField, { defaultValue: 2 }),
        h(StepperDecrement, null, "-"),
        h(StepperIncrement, null, "+"),
      ),
    );
    expect(markup.indexOf("<input")).toBeLessThan(markup.indexOf('data-step="-1"'));
    expect(markup).toContain('aria-label="More: Seats"');
    expect(markup).toContain("fg-stepper x");
  });
});

describe("Rating parts", () => {
  it("lights the items it is given and moves like a slider", async () => {
    const spy = vi.fn<(v: number | null) => void>();
    const page = await mount(
      h(
        Rating,
        { label: "Quality", max: 3, defaultValue: 1, onChange: spy },
        h(RatingItem, { index: 0 }),
        h(RatingItem, { index: 1 }),
        h(RatingItem, { index: 2 }),
      ),
    );
    const slider = page.querySelector('[role="slider"]')!;
    expect(page.querySelectorAll("[data-star]")).toHaveLength(3);
    expect(page.querySelectorAll(".fg-star-on")).toHaveLength(1);
    await key(slider, "ArrowRight");
    expect(spy).toHaveBeenLastCalledWith(2);
    expect(page.querySelectorAll(".fg-star-on")).toHaveLength(2);
  });

  it("chooses an item by click, and hands its fill to a custom glyph", async () => {
    const spy = vi.fn<(v: number | null) => void>();
    const mine = (fill: number) => h("b", { className: "mine" }, String(fill));
    const page = await mount(
      h(
        Rating,
        { label: "Mood", max: 2, onChange: spy },
        h(RatingItem, { index: 0, children: mine }),
        h(RatingItem, { index: 1, children: mine }),
      ),
    );
    const stars = page.querySelectorAll<HTMLElement>("[data-star]");
    await act(async () => stars[1]!.click());
    expect(spy).toHaveBeenLastCalledWith(2);
    expect([...page.querySelectorAll(".mine")].map((n) => n.textContent)).toEqual(["1", "1"]);
  });

  it("reads as an image when read only, still from its parts", () => {
    const markup = html(
      h(
        Rating,
        { label: "Quality", max: 2, readOnly: true, defaultValue: 1 },
        h(RatingItem, { index: 0 }),
        h(RatingItem, { index: 1 }),
      ),
    );
    expect(markup).toContain('role="img"');
    expect(markup).toContain('aria-label="Quality: 1 out of 2"');
  });
});

describe("NumberInput and MoneyInput parts", () => {
  it("composes the buttons, an affix and the field in any order", async () => {
    const spy = vi.fn<(v: unknown) => void>();
    const page = await mount(
      h(
        NumberInput,
        { label: "Weight", defaultValue: 5, max: 6, onChange: spy },
        h(NumberInputField),
        h(NumberInputAffix, null, "kg"),
        h(NumberInputDecrement),
        h(NumberInputIncrement),
      ),
    );
    const input = page.querySelector<HTMLInputElement>("input")!;
    expect(input.getAttribute("role")).toBe("spinbutton");
    expect(page.querySelector(".fg-num-affix")?.textContent).toBe("kg");
    await act(async () =>
      page.querySelector<HTMLButtonElement>('[aria-label="Increase Weight"]')!.click(),
    );
    expect(spy).toHaveBeenLastCalledWith(6);
    expect(page.querySelector<HTMLButtonElement>('[aria-label="Increase Weight"]')!.disabled).toBe(
      true,
    );
    await key(input, "ArrowDown");
    expect(spy).toHaveBeenLastCalledWith(5);
  });

  it("keeps the props form identical: buttons around the field, bare without", () => {
    const withButtons = html(h(NumberInput, { label: "A", defaultValue: 1 }));
    expect(withButtons.indexOf("Decrease A")).toBeLessThan(withButtons.indexOf("spinbutton"));
    expect(withButtons.indexOf("spinbutton")).toBeLessThan(withButtons.indexOf("Increase A"));
    const bare = html(h(NumberInput, { label: "A", defaultValue: 1, buttons: false, suffix: "%" }));
    expect(bare).toContain("fg-num-bare");
    expect(bare).not.toContain("fg-num-btn");
    expect(bare.indexOf("spinbutton")).toBeLessThan(bare.indexOf("%"));
  });

  it("puts the money symbol where the parts put it, in minor units", async () => {
    const spy = vi.fn<(v: unknown) => void>();
    const page = await mount(
      h(
        MoneyInput,
        { label: "Price", currency: "EUR", locale: "fr-FR", defaultValue: 1250, onChange: spy },
        h(MoneyInputSymbol),
        h(MoneyInputField),
      ),
    );
    const first = page.querySelector(".fg-num")!.firstElementChild!;
    expect(first.className).toBe("fg-num-affix");
    expect(first.textContent).toContain("€");
    await key(page.querySelector("input")!, "ArrowUp");
    expect(spy).toHaveBeenLastCalledWith(1350);
  });

  it("refuses a part outside its root", () => {
    expect(() => html(h(NumberInputField))).toThrow(/NumberInput/);
    expect(() => html(h(MoneyInputSymbol))).toThrow(/MoneyInput/);
  });
});

describe("CurrencyPicker over the Select parts", () => {
  it("shows the chosen currency by its code and name, named for assistive technology", async () => {
    const page = await mount(h(CurrencyPicker, { defaultValue: "USD", locale: "en" }));
    const trigger = page.querySelector("button")!;
    expect(trigger.textContent).toContain("USD · US Dollar");
    expect(page.textContent).toContain("Currency");
    expect(page.querySelector(".fg-sr")?.textContent).toBe("Currency");
  });

  it("is the Select root when given children, with CurrencyPickerItem for rows", () => {
    expect(typeof CurrencyPickerItem).toBe("function");
    const markup = html(
      h(
        CurrencyPicker,
        { defaultValue: "EUR", items: [{ value: "EUR", label: "Euro" }] },
        h("span", null, "inside"),
      ),
    );
    expect(markup).toContain("inside");
  });
});

describe("FileInput parts", () => {
  const file = (name: string, size = 3) =>
    new File(["x".repeat(size)], name, { type: "text/plain" });

  it("composes the frame, hint, button, limits and list", async () => {
    const spy = vi.fn<(files: File[]) => void>();
    const page = await mount(
      h(
        FileInput,
        { label: "Docs", maxSize: 2048, defaultValue: [file("a.txt")], onChange: spy },
        h(
          FileInputDrop,
          null,
          h(FileInputHint, null, "Drop here"),
          h(FileInputTrigger, null, "Pick"),
          h(FileInputLimits),
        ),
        h(FileInputList),
      ),
    );
    expect(page.querySelector(".fg-file-hint")?.textContent).toBe("Drop here");
    expect(page.querySelector(".fg-file-limits")?.textContent).toBe("up to 2 KB");
    expect(page.querySelector('input[type="file"]')?.getAttribute("aria-label")).toBe("Docs");
    expect(page.querySelectorAll(".fg-file-row")).toHaveLength(1);
    await act(async () =>
      page.querySelector<HTMLButtonElement>('[aria-label="Remove a.txt"]')!.click(),
    );
    expect(spy).toHaveBeenLastCalledWith([]);
    expect(page.querySelector(".fg-file-list")).toBeNull();
  });

  it("takes dropped files, refuses the ones over the limit and says why", async () => {
    const reject = vi.fn<(r: unknown) => void>();
    const change = vi.fn<(files: File[]) => void>();
    const page = await mount(
      h(
        FileInput,
        { label: "Docs", multiple: true, maxSize: 4, onChange: change, onReject: reject },
        h(FileInputDrop, null, h(FileInputTrigger)),
        h(FileInputList, {
          children: (f: File, i: number) =>
            h(FileInputItem, { file: f, index: i, key: i, children: f.name }),
        }),
      ),
    );
    const drop = page.querySelector(".fg-file-drop")!;
    await act(async () => {
      const event = new Event("drop", { bubbles: true, cancelable: true });
      (event as unknown as { dataTransfer: unknown }).dataTransfer = {
        files: [file("ok.txt", 2), file("big.txt", 9)],
      };
      drop.dispatchEvent(event);
    });
    expect(change).toHaveBeenLastCalledWith([expect.objectContaining({ name: "ok.txt" })]);
    expect(reject).toHaveBeenCalledWith([expect.objectContaining({ reason: "size" })]);
    expect(page.querySelector(".fg-file-row")?.textContent).toBe("ok.txt");
  });

  it("keeps the props form: hint, button text by `multiple`, limits", () => {
    const markup = html(
      h(FileInput, { label: "Docs", accept: "image/*", multiple: true, hint: "Here" }),
    );
    expect(markup).toContain("Here");
    expect(markup).toContain("Choose files");
    expect(markup).toContain("image/*");
  });
});

describe("ColorPicker parts", () => {
  it("composes an inline picker from swatches, input and clear", async () => {
    const spy = vi.fn<(v: unknown) => void>();
    const page = await mount(
      h(
        ColorPickerRoot,
        { label: "Colour", inline: true, defaultValue: null, columns: 2, onChange: spy },
        h(
          ColorPickerPanel,
          null,
          h(
            ColorPickerSwatches,
            null,
            h(ColorPickerSwatch, { value: "#ff4f1f", label: "Ember" }),
            h(ColorPickerSwatch, { value: "#3ddc84", label: "Green" }),
          ),
          h(ColorPickerInput),
          h(ColorPickerClear),
        ),
      ),
    );
    const cells = page.querySelectorAll<HTMLElement>('[role="radio"]');
    expect(cells).toHaveLength(2);
    // Nothing chosen: the tab stop is the first swatch of the palette.
    expect(cells[0]!.getAttribute("tabindex")).toBe("0");
    expect(page.querySelector(".fg-range-preset")).toBeNull();
    await act(async () => cells[1]!.click());
    expect(spy).toHaveBeenLastCalledWith("#3ddc84");
    expect(cells[1]!.getAttribute("aria-checked")).toBe("true");
    const hex = page.querySelector<HTMLInputElement>(".fg-input")!;
    expect(hex.value).toBe("#3ddc84");
    await type(hex, "#abc");
    expect(spy).toHaveBeenLastCalledWith("#aabbcc");
    await act(async () => page.querySelector<HTMLButtonElement>(".fg-range-preset")!.click());
    expect(spy).toHaveBeenLastCalledWith(null);
  });

  it("walks the grid with the arrows", async () => {
    const page = await mount(
      h(
        ColorPickerRoot,
        { label: "Colour", inline: true, columns: 4 },
        h(ColorPickerPanel, null, h(ColorPickerSwatches)),
      ),
    );
    const cells = page.querySelectorAll<HTMLElement>('[role="radio"]');
    expect(cells).toHaveLength(COLOR_PALETTE.length);
    cells[1]!.focus();
    await key(page.querySelector('[role="radiogroup"]')!, "ArrowDown");
    expect(document.activeElement).toBe(cells[5]);
  });

  it("refuses a part outside its root", () => {
    expect(() => html(h(ColorPickerSwatches))).toThrow(/ColorPickerRoot/);
  });
});
