// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AvatarGroup, SearchBox, Segmented, Swatch } from "./index";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "./parts-input-group";
import { SegmentedItem } from "./controls";
import {
  MentionPicker,
  MentionPickerEmpty,
  MentionPickerItem,
  MentionPickerList,
} from "./mention-picker";
import {
  ExpressionInput,
  ExpressionInputBox,
  ExpressionInputField,
  ExpressionInputList,
  ExpressionInputPreview,
  ExpressionInputTrigger,
} from "./expression-input";

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
const click = async (el: Element | null) => {
  await act(async () => {
    el?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
};

describe("InputGroup", () => {
  it("forwards className, rest and data-slot on every part", () => {
    const out = html(
      h(
        InputGroup,
        { className: "a", id: "g" },
        h(
          InputGroupAddon,
          { align: "inline-end", className: "b" },
          h(InputGroupText, { className: "c" }, "kg"),
        ),
        h(InputGroupInput, { className: "d", placeholder: "w" }),
        h(InputGroupTextarea, { className: "e" }),
        h(InputGroupButton, { className: "f", size: "icon-sm" }, "x"),
      ),
    );
    for (const slot of [
      "input-group",
      "input-group-addon",
      "input-group-text",
      "input-group-control",
      "input-group-button",
    ])
      expect(out).toContain(`data-slot="${slot}"`);
    expect(out).toContain('data-align="inline-end"');
    expect(out).toContain('id="g"');
    expect(out).toMatch(/class="fg-input-group a"/);
    expect(out).toContain('data-size="icon-sm"');
    for (const c of ["b", "c", "d", "e", "f"])
      expect(out).toMatch(new RegExp(`class="[^"]*\\b${c}"`));
  });
  it("puts the focus in the control when the addon is clicked, not when a button is", async () => {
    const el = await mount(
      h(
        InputGroup,
        null,
        h(
          InputGroupAddon,
          null,
          h("span", { id: "icon" }, "i"),
          h(InputGroupButton, { id: "btn" }, "b"),
        ),
        h(InputGroupInput, { "aria-label": "Q" }),
      ),
    );
    const input = el.querySelector("input")!;
    await click(el.querySelector("#btn"));
    expect(document.activeElement).not.toBe(input);
    await click(el.querySelector("#icon"));
    expect(document.activeElement).toBe(input);
  });
});

describe("SearchBox", () => {
  it("is a preset over InputGroup with the same props", () => {
    const out = html(h(SearchBox, { placeholder: "Find", shortcut: "/", className: "x" }));
    expect(out).toContain('data-slot="search-box"');
    expect(out).toMatch(/class="fg-input-group fg-search x"/);
    expect(out).toContain(
      'type="search" aria-label="Search" class="fg-input-group-control fg-search-input"',
    );
    expect(out).toContain('<kbd class="fg-kbd">/</kbd>');
    expect(html(h(SearchBox, {}))).not.toContain("fg-kbd");
  });
});

describe("Segmented", () => {
  const options = [
    { value: "a", label: "A" },
    { value: "b", label: "B" },
  ];
  it("keeps one chosen and calls onChange with the other", async () => {
    const onChange = vi.fn<(v: string) => void>();
    const el = await mount(h(Segmented, { label: "V", value: "a", options, onChange }));
    const [a, b] = [...el.querySelectorAll("button")];
    expect(a!.getAttribute("aria-pressed")).toBe("true");
    await click(a!);
    expect(onChange).not.toHaveBeenCalled();
    expect(a!.getAttribute("aria-pressed")).toBe("true");
    await click(b!);
    expect(onChange).toHaveBeenCalledWith("b");
  });
  it("composes with SegmentedItem when options are absent", async () => {
    const onChange = vi.fn<(v: string) => void>();
    const el = await mount(
      h(
        Segmented,
        { label: "V", defaultValue: "a", onChange, className: "x" },
        h(SegmentedItem, { value: "a" }, "A"),
        h(SegmentedItem, { value: "b" }, "B"),
      ),
    );
    expect(el.querySelector('[role="group"]')?.className).toContain("fg-seg x");
    await click(el.querySelectorAll("button")[1]!);
    expect(onChange).toHaveBeenCalledWith("b");
    expect(el.querySelectorAll("button")[1]!.getAttribute("aria-pressed")).toBe("true");
  });
});

describe("identity atoms", () => {
  it("forward className, rest and data-slot", () => {
    expect(html(h(Swatch, { color: "red", className: "s", id: "w" }, "Name"))).toMatch(
      /data-slot="swatch"[^>]*id="w"[^>]*class="fg-swatch s"/,
    );
    const out = html(
      h(AvatarGroup, { names: ["Ana Bel", "Cy Dee"], max: 1, className: "g", id: "ag" }),
    );
    expect(out).toContain('data-slot="avatar-group"');
    expect(out).toContain('id="ag"');
    expect(out).toContain('class="fg-avatars g"');
  });
});

describe("MentionPicker", () => {
  const options = [
    { id: "a", label: "Ana", hint: "Lead" },
    { id: "b", label: "Bo" },
  ];
  it("composes from its parts and keeps the old shape", async () => {
    const onSelect = vi.fn<(o: object) => void>();
    const el = await mount(
      h(
        MentionPicker,
        { id: "mp", activeIndex: 1, onSelect, className: "r", "data-x": "1" } as never,
        h(
          MentionPickerList,
          { label: "People", className: "l" },
          options.map((o, i) =>
            h(MentionPickerItem, { key: o.id, option: o, index: i, className: "i" }),
          ),
        ),
        h(MentionPickerEmpty, null, "none"),
      ),
    );
    expect(el.querySelector('[data-slot="mention-picker"]')?.className).toContain("r");
    expect(el.querySelector("ul")?.getAttribute("id")).toBe("mp");
    expect(el.querySelectorAll('[role="option"]')[1]?.getAttribute("aria-selected")).toBe("true");
    await click(el.querySelector("li"));
    expect(onSelect).toHaveBeenCalledWith(options[0]);
    const old = html(
      h(MentionPicker, { id: "p", label: "P", options: [], activeIndex: 0, onSelect: () => {} }),
    );
    expect(old).toContain("No match");
  });
});

describe("ExpressionInput parts", () => {
  it("take className, rest and a data-slot", async () => {
    const el = await mount(
      h(
        ExpressionInput,
        {
          variables: [],
          "aria-label": "T",
          defaultValue: "{{ a }}",
          sample: { a: 1 },
          className: "root",
        },
        h(
          ExpressionInputBox,
          { className: "box" },
          h(ExpressionInputField, { className: "field", "data-k": "1" } as never),
          h(ExpressionInputTrigger, { className: "fx" }),
          h(ExpressionInputList, { className: "list" }),
        ),
        h(ExpressionInputPreview, { className: "pre" }),
      ),
    );
    for (const slot of [
      "expression-input",
      "expression-input-box",
      "expression-input-field",
      "expression-input-trigger",
      "expression-input-preview",
    ])
      expect(el.querySelector(`[data-slot="${slot}"]`)).not.toBeNull();
    expect(el.querySelector(".field")?.getAttribute("data-k")).toBe("1");
    expect(el.querySelector(".root")).not.toBeNull();
  });
});
