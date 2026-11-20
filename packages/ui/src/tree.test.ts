// @vitest-environment jsdom
import { act, createElement as h, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Tree, TreeGroup, TreeItem, TreeItemContent } from "./tree";
import {
  treeNavigate,
  treeParentIndex,
  treeRangeIds,
  treeSiblingBranches,
  treeTypeahead,
  type TreeRow,
} from "./tree-model";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const row = (id: string, level: number, extra: Partial<TreeRow> = {}): TreeRow => ({
  id,
  level,
  branch: false,
  expanded: false,
  disabled: false,
  text: id,
  ...extra,
});

// docs (open)
//   guide
//   api (branch, closed)
// notes
const ROWS: TreeRow[] = [
  row("docs", 1, { branch: true, expanded: true, text: "Docs" }),
  row("guide", 2, { text: "Guide" }),
  row("api", 2, { branch: true, text: "API" }),
  row("notes", 1, { text: "Notes" }),
];

describe("tree model", () => {
  it("finds the parent by level", () => {
    expect(treeParentIndex(ROWS, 1)).toBe(0);
    expect(treeParentIndex(ROWS, 3)).toBe(-1);
  });
  it("walks the arrows as the pattern says", () => {
    expect(treeNavigate(ROWS, 0, "ArrowDown")).toEqual({ focus: 1 });
    expect(treeNavigate(ROWS, 3, "ArrowDown")).toEqual({ focus: 3 });
    expect(treeNavigate(ROWS, 0, "ArrowRight")).toEqual({ focus: 1 });
    expect(treeNavigate(ROWS, 2, "ArrowRight")).toEqual({ expand: "api" });
    expect(treeNavigate(ROWS, 1, "ArrowRight")).toEqual({});
    expect(treeNavigate(ROWS, 0, "ArrowLeft")).toEqual({ collapse: "docs" });
    expect(treeNavigate(ROWS, 1, "ArrowLeft")).toEqual({ focus: 0 });
    expect(treeNavigate(ROWS, 3, "ArrowLeft")).toEqual({});
    expect(treeNavigate(ROWS, 1, "End")).toEqual({ focus: 3 });
    expect(treeNavigate(ROWS, 1, "x")).toBeNull();
  });
  it("lists the sibling branches and a range without disabled rows", () => {
    expect(treeSiblingBranches(ROWS, 1).map((r) => r.id)).toEqual(["api"]);
    const rows = [row("a", 1), row("b", 1, { disabled: true }), row("c", 1)];
    expect(treeRangeIds(rows, 2, 0)).toEqual(["a", "c"]);
  });
  it("types ahead: a letter cycles, a word narrows", () => {
    const rows = [row("a", 1, { text: "Apple" }), row("b", 1, { text: "Avocado" }), row("c", 1)];
    expect(treeTypeahead(rows, 0, "a")).toBe(1);
    expect(treeTypeahead(rows, 1, "a")).toBe(0);
    expect(treeTypeahead(rows, 0, "aa")).toBe(1);
    expect(treeTypeahead(rows, 0, "av")).toBe(1);
    expect(treeTypeahead(rows, 0, "z")).toBe(-1);
  });
});

let host: HTMLElement | undefined;
afterEach(() => {
  host?.remove();
  host = undefined;
});
const mount = async (element: ReactNode) => {
  host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(element));
  return host;
};
const key = async (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, ...init }));
  });
const click = async (el: Element, init: MouseEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(new MouseEvent("click", { bubbles: true, ...init }));
  });

const sample = (props: Record<string, unknown> = {}) =>
  h(
    Tree,
    { "aria-label": "Pages", ...props },
    h(
      TreeItem,
      { id: "docs", textValue: "Docs" },
      h(TreeItemContent, null, "Docs"),
      h(
        TreeGroup,
        null,
        h(TreeItem, { id: "guide", textValue: "Guide" }, h(TreeItemContent, null, "Guide")),
        h(
          TreeItem,
          { id: "api", textValue: "API" },
          h(TreeItemContent, null, "API"),
          h(
            TreeGroup,
            null,
            h(TreeItem, { id: "rest", textValue: "REST" }, h(TreeItemContent, null, "REST")),
          ),
        ),
      ),
    ),
    h(TreeItem, { id: "notes", textValue: "Notes" }, h(TreeItemContent, null, "Notes")),
    h(TreeItem, { id: "off", textValue: "Off", disabled: true }, h(TreeItemContent, null, "Off")),
  );

const item = (el: HTMLElement, id: string) =>
  el.querySelector<HTMLElement>(`[data-tree-id="${id}"]`)!;

describe("Tree", () => {
  it("has the roles, levels, sets and the open state", () => {
    const out = html(sample({ defaultExpanded: ["docs"], defaultSelected: ["guide"] }));
    expect(out).toContain('role="tree"');
    expect(out).toContain('aria-label="Pages"');
    expect(out).toContain('role="group"');
    expect(out).toMatch(/aria-level="2"[^>]*aria-setsize="2"[^>]*aria-posinset="1"/);
    expect(out).toContain('aria-expanded="true"');
    expect(out).toContain('aria-expanded="false"');
    expect(out).toContain('aria-selected="true"');
    // The closed group's items are not drawn.
    expect(out).not.toContain("REST");
  });

  it("walks, opens, closes and climbs from the keyboard", async () => {
    const el = await mount(sample({ defaultExpanded: ["docs"] }));
    item(el, "docs").focus();
    await key(item(el, "docs"), "ArrowDown");
    expect(document.activeElement).toBe(item(el, "guide"));
    await key(item(el, "guide"), "ArrowDown");
    expect(document.activeElement).toBe(item(el, "api"));
    await key(item(el, "api"), "ArrowRight");
    expect(item(el, "api").getAttribute("aria-expanded")).toBe("true");
    await key(item(el, "api"), "ArrowRight");
    expect(document.activeElement).toBe(item(el, "rest"));
    await key(item(el, "rest"), "ArrowLeft");
    expect(document.activeElement).toBe(item(el, "api"));
    await key(item(el, "api"), "ArrowLeft");
    expect(item(el, "api").getAttribute("aria-expanded")).toBe("false");
    await key(item(el, "api"), "End");
    expect(document.activeElement).toBe(item(el, "off"));
    await key(item(el, "off"), "Home");
    expect(document.activeElement).toBe(item(el, "docs"));
  });

  it("keeps one tab stop that follows the focus", async () => {
    const el = await mount(sample({ defaultExpanded: ["docs"] }));
    const stops = () =>
      [...el.querySelectorAll<HTMLElement>('[role="treeitem"]')]
        .filter((i) => i.tabIndex === 0)
        .map((i) => i.dataset.treeId);
    expect(stops()).toEqual(["docs"]);
    item(el, "guide").focus();
    await act(async () => {});
    expect(stops()).toEqual(["guide"]);
  });

  it("opens the siblings with * and finds a row by typing", async () => {
    const el = await mount(sample({ defaultExpanded: ["docs"] }));
    item(el, "guide").focus();
    await key(item(el, "guide"), "*");
    expect(item(el, "api").getAttribute("aria-expanded")).toBe("true");
    await key(item(el, "guide"), "n");
    expect(document.activeElement).toBe(item(el, "notes"));
  });

  it("selects with Enter and Space, and activates with Enter", async () => {
    const onSelectedChange = vi.fn<(ids: string[]) => void>();
    const onActivate = vi.fn<(id: string) => void>();
    const el = await mount(sample({ onSelectedChange, onActivate }));
    item(el, "notes").focus();
    await key(item(el, "notes"), "Enter");
    expect(onSelectedChange).toHaveBeenLastCalledWith(["notes"]);
    expect(onActivate).toHaveBeenCalledWith("notes");
    expect(item(el, "notes").getAttribute("aria-selected")).toBe("true");
    // A disabled row is neither selected nor activated.
    item(el, "off").focus();
    await key(item(el, "off"), "Enter");
    expect(onActivate).toHaveBeenCalledTimes(1);
    expect(item(el, "off").getAttribute("aria-selected")).toBe("false");
  });

  it("selects several: Space toggles, Shift and the arrows extend, Ctrl A takes all but disabled", async () => {
    const onSelectedChange = vi.fn<(ids: string[]) => void>();
    const el = await mount(
      sample({ selectionMode: "multiple", defaultExpanded: ["docs"], onSelectedChange }),
    );
    expect(el.querySelector('[role="tree"]')!.getAttribute("aria-multiselectable")).toBe("true");
    item(el, "docs").focus();
    await key(item(el, "docs"), " ");
    await key(item(el, "docs"), "ArrowDown", { shiftKey: true });
    expect(onSelectedChange).toHaveBeenLastCalledWith(["docs", "guide"]);
    await key(item(el, "guide"), "ArrowDown", { shiftKey: true });
    expect(onSelectedChange).toHaveBeenLastCalledWith(["docs", "guide", "api"]);
    await key(item(el, "api"), "a", { ctrlKey: true });
    expect(onSelectedChange).toHaveBeenLastCalledWith(["docs", "guide", "api", "notes"]);
  });

  it("selects by click, with a modifier toggling in multiple mode", async () => {
    const onSelectedChange = vi.fn<(ids: string[]) => void>();
    const el = await mount(sample({ selectionMode: "multiple", onSelectedChange }));
    await click(el.querySelector('[data-tree-id="docs"] > .fg-tree-row')!);
    await click(el.querySelector('[data-tree-id="notes"] > .fg-tree-row')!, { metaKey: true });
    expect(onSelectedChange).toHaveBeenLastCalledWith(["docs", "notes"]);
  });

  it("opens and closes from the chevron, controlled or not", async () => {
    const onExpandedChange = vi.fn<(ids: string[]) => void>();
    const el = await mount(sample({ onExpandedChange }));
    await click(item(el, "docs").querySelector(".fg-tree-twisty")!);
    expect(onExpandedChange).toHaveBeenLastCalledWith(["docs"]);
    expect(item(el, "docs").getAttribute("aria-expanded")).toBe("true");
    host!.remove();
    const fixed = await mount(sample({ expanded: [], onExpandedChange }));
    await click(item(fixed, "docs").querySelector(".fg-tree-twisty")!);
    expect(item(fixed, "docs").getAttribute("aria-expanded")).toBe("false");
  });

  it("has no aria-selected without selection, and leaves keys typed in a field alone", async () => {
    const el = await mount(
      h(
        Tree,
        { "aria-label": "x", selectionMode: "none" },
        h(
          TreeItem,
          { id: "a", textValue: "A" },
          h(TreeItemContent, null, h("input", { "aria-label": "name" })),
        ),
        h(TreeItem, { id: "b", textValue: "B" }, h(TreeItemContent, null, "B")),
      ),
    );
    expect(item(el, "a").hasAttribute("aria-selected")).toBe(false);
    const input = el.querySelector("input")!;
    input.focus();
    await key(input, "b");
    expect(document.activeElement).toBe(input);
  });

  it("walks a flat list with levels given, drawn with render", async () => {
    const el = await mount(
      h(
        Tree,
        { "aria-label": "Layers", render: h("div"), expanded: ["g"] },
        h(TreeItem, { id: "g", render: h("div"), hasChildren: true, level: 1 }, "Group"),
        h(TreeItem, { id: "c", render: h("div"), level: 2 }, "Child"),
        h(TreeItem, { id: "z", render: h("div"), level: 1 }, "Zed"),
      ),
    );
    expect(el.querySelector("div[role=tree]")).not.toBeNull();
    item(el, "c").focus();
    await key(item(el, "c"), "ArrowLeft");
    expect(document.activeElement).toBe(item(el, "g"));
  });
});
