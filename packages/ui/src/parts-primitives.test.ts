// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Avatar } from "./avatar";
import { Segmented } from "./controls";
import { Popover, PopoverArrow, PopoverContent, PopoverTrigger } from "./popover";
import {
  AvatarGroup,
  AvatarGroupCount,
  CommandLine,
  CommandLineCopy,
  CommandLinePrompt,
  CommandLineText,
  IconPicker,
  IconPickerContent,
  IconPickerGrid,
  IconPickerHeader,
  IconPickerSearch,
  IconPickerTrigger,
  Scale,
  ScaleEnds,
  ScaleItem,
  ScaleLabel,
  ScaleRow,
  TagInput,
  TagInputField,
  TagInputList,
  TagInputTag,
  TagInputTags,
  TimezonePicker,
  TimezonePickerContent,
  TimezonePickerInput,
} from "./parts-primitives";
import { CopyBlock } from "./copy-block";
import { EmptyState, Notice, Spinner } from "./feedback";
import { Markdown } from "./markdown";
import { Page } from "./page";
import { PixelFigure } from "./pixel-figure";
import { PixelText } from "./pixel-text";
import { PixelTitle } from "./pixel-title";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let root: ReturnType<typeof createRoot> | undefined;
afterEach(async () => {
  await act(async () => root?.unmount());
  host?.remove();
  host = undefined;
  root = undefined;
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  const r = createRoot(host);
  root = r;
  await act(async () => r.render(element));
  return host;
};
const slot = (el: Element, name: string) => el.querySelector(`[data-slot="${name}"]`);

describe("data-slot can be overridden by the caller", () => {
  it.each([
    ["CommandLine", h(CommandLine, { "data-slot": "x" } as never, "ls")],
    ["CopyBlock", h(CopyBlock, { "data-slot": "x", value: "v", label: "l" } as never)],
    ["Notice", h(Notice, { "data-slot": "x" } as never, "a")],
    ["EmptyState", h(EmptyState, { "data-slot": "x", title: "t" } as never)],
    ["Spinner", h(Spinner, { "data-slot": "x" } as never)],
    ["Markdown", h(Markdown, { "data-slot": "x", children: "a" } as never)],
    ["Page", h(Page, { "data-slot": "x" } as never, "a")],
    ["PixelText", h(PixelText, { "data-slot": "x", text: "a" } as never)],
    ["PixelTitle", h(PixelTitle, { "data-slot": "x", text: "a" } as never)],
    ["PixelFigure", h(PixelFigure, { "data-slot": "x", text: "1" } as never)],
  ])("%s", (_name, element) => {
    const out = html(element);
    // The root's own slot is the caller's; inner elements keep theirs.
    expect(out).toMatch(/^<[a-z]+[^>]*data-slot="x"/);
    expect(out.match(/^<[a-z]+[^>]*>/)![0]).not.toMatch(/data-slot="[a-z-]+"[^>]*data-slot="x"/);
  });

  it("Segmented forwards rest and data-slot to the root, in both forms", () => {
    const options = [{ value: "a", label: "A" }];
    const props = h(Segmented, {
      label: "View",
      options,
      value: "a",
      onChange: () => {},
      "data-slot": "x",
      id: "seg",
    } as never);
    expect(html(props)).toContain('data-slot="x"');
    expect(html(props)).toContain('id="seg"');
  });
});

describe("TagInput parts", () => {
  it("renders the composed form and the shorthand the same way", () => {
    const composed = html(
      h(
        TagInput,
        { defaultValue: ["a", "b"] },
        h(
          TagInputList,
          { "aria-label": "Tags, added" },
          h(TagInputTags),
          h(TagInputField, { "aria-label": "Tags" }),
        ),
      ),
    );
    const short = html(h(TagInput, { label: "Tags", defaultValue: ["a", "b"] }));
    expect(composed).toContain('data-slot="tag-input-tag"');
    expect(composed.match(/fg-combo-chip"/g)).toHaveLength(2);
    expect(short.match(/fg-combo-chip"/g)).toHaveLength(2);
  });

  it("adds a tag on Enter and removes it, and forwards className and rest", async () => {
    const onChange = vi.fn<(value: unknown) => void>();
    const el = await mount(
      h(
        TagInput,
        { onChange, className: "root-x", "data-x": "1" } as never,
        h(
          TagInputList,
          { className: "list-x" },
          h(TagInputTags),
          h(TagInputField, { "aria-label": "Tags", className: "f-x" }),
        ),
      ),
    );
    expect(slot(el, "tag-input")?.className).toContain("root-x");
    expect(slot(el, "tag-input")?.getAttribute("data-x")).toBe("1");
    expect(slot(el, "tag-input-list")?.className).toContain("list-x");
    const input = slot(el, "tag-input-field") as HTMLInputElement;
    expect(input.className).toContain("f-x");
    const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
    await act(async () => {
      set.call(input, "red");
      input.dispatchEvent(new Event("input", { bubbles: true }));
    });
    await act(async () =>
      input.dispatchEvent(
        new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true }),
      ),
    );
    expect(onChange).toHaveBeenLastCalledWith(["red"]);
    await act(async () =>
      (el.querySelector('[aria-label="Remove red"]') as HTMLButtonElement).click(),
    );
    expect(onChange).toHaveBeenLastCalledWith([]);
  });

  it("TagInputTag takes className and rest", () => {
    const out = html(
      h(
        TagInput,
        { defaultValue: ["a"] },
        h(
          TagInputList,
          null,
          h(TagInputTag, { value: "a", className: "t-x", "data-y": "2" } as never),
        ),
      ),
    );
    expect(out).toContain("t-x");
    expect(out).toContain('data-y="2"');
  });
});

describe("TimezonePicker parts", () => {
  it("renders the composed input and the shorthand", () => {
    const composed = html(
      h(
        TimezonePicker,
        { defaultValue: "Europe/Paris", timezones: ["Europe/Paris", "UTC"], now: 0 },
        h(TimezonePickerInput, { "aria-label": "Zone", className: "in-x" }),
        h(TimezonePickerContent, null),
      ),
    );
    expect(composed).toContain('data-slot="timezone-picker-input"');
    expect(composed).toContain("fg-tz");
    expect(composed).toContain("in-x");
    expect(html(h(TimezonePicker, { label: "Zone", defaultValue: "UTC" }))).toContain(
      'data-slot="timezone-picker"',
    );
  });

  it("opens with the zones, offset and clock on each row", async () => {
    const el = await mount(
      h(
        TimezonePicker,
        { timezones: ["Europe/Paris", "Asia/Tokyo"], now: Date.UTC(2026, 0, 1, 12) },
        h(TimezonePickerInput, { "aria-label": "Zone" }),
        h(TimezonePickerContent, { className: "c-x" }),
      ),
    );
    const input = el.querySelector("input") as HTMLInputElement;
    await act(async () => input.focus());
    await act(async () => input.click());
    await act(async () =>
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })),
    );
    const rows = document.querySelectorAll('[data-slot="timezone-picker-item"]');
    expect(rows.length).toBe(2);
    expect(document.querySelector('[data-slot="timezone-picker-content"]')?.className).toContain(
      "c-x",
    );
  });
});

describe("IconPicker parts", () => {
  it("composes trigger, content, header, search and grid", async () => {
    const onChange = vi.fn<(value: unknown) => void>();
    const el = await mount(
      h(
        IconPicker,
        { onChange, label: "Icon" },
        h(IconPickerTrigger, { className: "tr-x", "data-z": "3" } as never),
        h(
          IconPickerContent,
          { className: "co-x" },
          h(IconPickerHeader, { className: "he-x" }),
          h(IconPickerSearch, { className: "se-x" }),
          h(IconPickerGrid, { className: "gr-x" }),
        ),
      ),
    );
    const trigger = slot(el, "icon-picker") as HTMLButtonElement;
    expect(trigger.className).toContain("tr-x");
    expect(trigger.getAttribute("data-z")).toBe("3");
    await act(async () => trigger.click());
    const doc = document.body;
    expect(slot(doc, "icon-picker-content")?.className).toContain("co-x");
    expect(slot(doc, "icon-picker-header")?.className).toContain("he-x");
    expect(slot(doc, "icon-picker-search")?.className).toContain("se-x");
    expect(slot(doc, "icon-picker-grid")?.className).toContain("gr-x");
    const item = slot(doc, "icon-picker-item") as HTMLElement;
    expect(item).toBeTruthy();
    await act(async () => item.click());
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

describe("Scale parts", () => {
  it("renders the composed scale like the shorthand", () => {
    const composed = html(
      h(
        Scale,
        { min: 1, max: 3, defaultValue: 2 },
        h(ScaleLabel, null, "How was it?"),
        h(
          ScaleRow,
          { label: "How was it?" },
          h(ScaleItem, { value: 1 }),
          h(ScaleItem, { value: 2 }),
          h(ScaleItem, { value: 3 }),
        ),
        h(ScaleEnds, null, h("span", null, "Bad"), h("span", null, "Good")),
      ),
    );
    const short = html(
      h(Scale, {
        label: "How was it?",
        min: 1,
        max: 3,
        defaultValue: 2,
        lowLabel: "Bad",
        highLabel: "Good",
      }),
    );
    expect(composed.match(/fg-scale-cell/g)).toHaveLength(3);
    expect(short.match(/fg-scale-cell/g)).toHaveLength(3);
    expect(composed).toContain('data-slot="scale-item"');
  });

  it("picks, toggles off and moves with the arrows", async () => {
    const onChange = vi.fn<(value: unknown) => void>();
    const el = await mount(
      h(
        Scale,
        { min: 1, max: 3, onChange, className: "s-x" },
        h(
          ScaleRow,
          { label: "Q", className: "r-x" },
          h(ScaleItem, { value: 1, className: "i-x" }),
          h(ScaleItem, { value: 2 }),
          h(ScaleItem, { value: 3 }),
        ),
      ),
    );
    expect(slot(el, "scale")?.className).toContain("s-x");
    expect(slot(el, "scale-row")?.className).toContain("r-x");
    const items = el.querySelectorAll<HTMLButtonElement>('[data-slot="scale-item"]');
    expect(items[0]!.className).toContain("i-x");
    await act(async () => items[1]!.click());
    expect(onChange).toHaveBeenLastCalledWith(2);
    await act(async () =>
      slot(el, "scale-row")!.dispatchEvent(
        new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true, cancelable: true }),
      ),
    );
    expect(onChange).toHaveBeenLastCalledWith(3);
    await act(async () => items[2]!.click());
    expect(onChange).toHaveBeenLastCalledWith(null);
  });
});

describe("AvatarGroup parts", () => {
  it("composes avatars and a count; the names form is unchanged", () => {
    const composed = html(
      h(
        AvatarGroup,
        { className: "g-x", "data-k": "1" } as never,
        h(Avatar, { name: "Ada Lovelace" }),
        h(Avatar, { name: "Alan Turing" }),
        h(AvatarGroupCount, { className: "c-x", "data-c": "2" } as never, "+3"),
      ),
    );
    expect(composed).toContain('role="group"');
    expect(composed).toContain("g-x");
    expect(composed).toContain('data-k="1"');
    expect(composed).toContain('data-slot="avatar-group-count"');
    expect(composed).toContain("c-x");
    expect(composed).toContain(">+3<");
    const short = html(h(AvatarGroup, { names: ["a", "b", "c"], max: 2 }));
    expect(short).toContain('role="img"');
    expect(short).toContain("+1");
    expect(short).toContain('data-slot="avatar-group-count"');
  });
});

describe("CommandLine parts", () => {
  it("keeps the shorthand", () => {
    const out = html(h(CommandLine, null, "npx forgeron init"));
    expect(out).toContain("fg-cmd-prompt");
    expect(out).toContain("npx forgeron init");
  });

  it("composes prompt, text and copy, and copies", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const el = await mount(
      h(
        CommandLine,
        { className: "cl-x" } as never,
        h(CommandLinePrompt, { className: "p-x" }, "#"),
        h(CommandLineText, { className: "t-x" }, "ls -la"),
        h(CommandLineCopy, { value: "ls -la", className: "b-x", "data-b": "1" } as never),
      ),
    );
    expect(slot(el, "command-line")?.className).toContain("cl-x");
    expect(slot(el, "command-line-prompt")?.className).toContain("p-x");
    expect(slot(el, "command-line-text")?.className).toContain("t-x");
    const button = slot(el, "command-line-copy") as HTMLButtonElement;
    expect(button.className).toContain("b-x");
    expect(button.getAttribute("data-b")).toBe("1");
    await act(async () => button.click());
    expect(writeText).toHaveBeenCalledWith("ls -la");
    expect(button.textContent).toBe("Copied");
  });
});

describe("PopoverContent anchor and PopoverArrow", () => {
  it("opens against an anchor element and renders the arrow", async () => {
    const anchor = document.createElement("div");
    document.body.append(anchor);
    await mount(
      h(
        Popover,
        { defaultOpen: true },
        h(PopoverTrigger, null, "open"),
        h(
          PopoverContent,
          { anchor, "data-a": "1" } as never,
          h(PopoverArrow, { className: "ar-x", "data-r": "1" } as never),
          "body",
        ),
      ),
    );
    const arrow = slot(document.body, "popover-arrow");
    expect(arrow).toBeTruthy();
    expect(arrow?.className).toContain("fg-popover-arrow");
    expect(arrow?.className).toContain("ar-x");
    expect(arrow?.getAttribute("data-r")).toBe("1");
    anchor.remove();
  });
});
