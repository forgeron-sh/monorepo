// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from "./combobox";
import { quarterOptions, sizeOptions, statusOptions } from "./pickers";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { Toolbar, ToolbarButton } from "./toolbar";

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

describe("ToolbarButton", () => {
  it("takes children, and names an icon-less button from label", () => {
    const out = html(
      h(
        Toolbar,
        { label: "Tools" },
        h(ToolbarButton, { label: "Bold", className: "x" }, h("b", null, "B")),
        h(ToolbarButton, { label: "Plain" }),
      ),
    );
    expect(out).toContain('aria-label="Bold"');
    expect(out).toContain("<b>B</b>");
    expect(out).toContain("<span>Plain</span>");
  });

  it("renders as another element with `render`, and forwards rest props", async () => {
    const page = await mount(
      h(
        Toolbar,
        { label: "Tools", "data-test": "bar" } as never,
        h(ToolbarButton, { render: h("a", { href: "/x" }), "data-k": "1" } as never, "Go"),
      ),
    );
    expect(page.querySelector("a.fg-tool")?.getAttribute("data-k")).toBe("1");
    expect(page.querySelector("[data-test=bar]")).not.toBeNull();
  });

  it("asChild makes its child the tool", () => {
    const out = html(
      h(
        Toolbar,
        { label: "Tools" },
        h(ToolbarButton, { asChild: true }, h("a", { href: "/y" }, "Link")),
      ),
    );
    expect(out).toContain('<a href="/y"');
    expect(out).toContain("fg-tool");
  });
});

describe("Select parts", () => {
  it("the chip trigger has no caret; items take a glyph and a hint", () => {
    const out = html(
      h(
        Select,
        { defaultValue: "a", open: true } as never,
        h(SelectTrigger, { variant: "chip" }, h(SelectValue)),
        h(
          SelectContent,
          null,
          h(SelectItem, { value: "a", glyph: h("i", { className: "g" }), hint: "⌘1" }, "A"),
        ),
      ),
    );
    expect(out).toContain("fg-selm-chip");
    expect(out).not.toContain("fg-selm-caret");
  });
});

describe("Combobox parts", () => {
  it("composes as the root of the parts", async () => {
    const page = await mount(
      h(
        Combobox,
        { items: ["a", "b"] },
        h(ComboboxInput, { "aria-label": "Pick" }),
        h(
          ComboboxContent,
          null,
          h(ComboboxEmpty, null, "None"),
          h(ComboboxList, {
            children: (v: string) => h(ComboboxItem, { key: v, value: v }, v),
          }),
        ),
      ),
    );
    expect(page.querySelector("input")?.getAttribute("role")).toBe("combobox");
    expect(page.querySelector(".fg-combo .fg-combo-btn")).not.toBeNull();
  });
});

describe("picker options", () => {
  it("lists are exported", () => {
    expect(statusOptions.map((o) => o.value)).toEqual([
      "backlog",
      "todo",
      "progress",
      "review",
      "done",
      "canceled",
    ]);
    expect(sizeOptions([0, 1, 2, 3, 5, 8])[5]?.hint).toBe("8 pt");
    expect(quarterOptions([2026])).toHaveLength(4);
  });
});
