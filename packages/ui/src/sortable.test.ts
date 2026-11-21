// @vitest-environment jsdom
import { act, createElement as h, useState, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Sortable, SortableDropIndicator, SortableHandle, SortableItem } from "./sortable";
import {
  clampIndex,
  moveById,
  moveItem,
  sortableDropPosition,
  sortableKeyStep,
  sortableMoveText,
  sortableSlotIndex,
  sortableStepTarget,
} from "./sortable-model";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

describe("sortable model", () => {
  it("moves an item, a copy, and leaves an out-of-range move alone", () => {
    const list = [1, 2, 3];
    expect(moveItem(list, 0, 2)).toEqual([2, 3, 1]);
    expect(moveItem(list, 2, 0)).toEqual([3, 1, 2]);
    expect(moveItem(list, 0, 5)).toEqual([1, 2, 3]);
    expect(moveItem(list, 0, 2)).not.toBe(list);
  });
  it("moves by id and keeps the target in the list", () => {
    const rows = [{ id: "a" }, { id: "b" }, { id: "c" }];
    const ids = (l: typeof rows) => l.map((r) => r.id);
    expect(ids(moveById(rows, (r) => r.id, "a", 9))).toEqual(["b", "c", "a"]);
    expect(ids(moveById(rows, (r) => r.id, "zz", 1))).toEqual(["a", "b", "c"]);
  });
  it("clamps an index to a range", () => {
    expect(clampIndex(-3, 5)).toBe(0);
    expect(clampIndex(9, 5)).toBe(4);
    expect(clampIndex(0, 5, [1, 4])).toBe(1);
    expect(clampIndex(9, 5, [1, 3])).toBe(3);
  });
  it("reads the drop position from the pointer in the row", () => {
    expect(sortableDropPosition(2, 20)).toBe("before");
    expect(sortableDropPosition(12, 20)).toBe("after");
    expect(sortableDropPosition(2, 20, true)).toBe("before");
    expect(sortableDropPosition(10, 20, true)).toBe("inside");
    expect(sortableDropPosition(19, 20, true)).toBe("after");
    expect(sortableDropPosition(5.4, 20, [0.28, 0.72])).toBe("before");
    // No layout: a row that can hold others takes the drop inside.
    expect(sortableDropPosition(0, 0, true)).toBe("inside");
    expect(sortableDropPosition(0, 0)).toBe("after");
  });
  it("counts the slot a drop lands on", () => {
    expect(sortableSlotIndex(0, 3)).toBe(2);
    expect(sortableSlotIndex(3, 1)).toBe(1);
    expect(sortableSlotIndex(-1, 2)).toBe(2);
  });
  it("maps keys to steps along the axis", () => {
    expect(sortableKeyStep("ArrowUp")).toEqual({ delta: -1 });
    expect(sortableKeyStep("ArrowDown")).toEqual({ delta: 1 });
    expect(sortableKeyStep("ArrowRight")).toBeNull();
    expect(sortableKeyStep("ArrowRight", "horizontal")).toEqual({ delta: 1 });
    expect(sortableKeyStep("Home")).toBeNull();
    expect(sortableKeyStep("End", "vertical", true)).toEqual({ edge: "last" });
    expect(sortableStepTarget({ edge: "last" }, 1, 5)).toBe(4);
    expect(sortableStepTarget({ delta: -1 }, 1, 5)).toBe(0);
  });
  it("says a move in words", () => {
    expect(sortableMoveText("Status", 3, 5)).toBe("Moved Status to position 3 of 5");
  });
});

const ITEMS = [
  { id: "a", name: "Name" },
  { id: "b", name: "Status" },
  { id: "c", name: "Owner" },
];

let host: HTMLElement | null = null;
afterEach(() => {
  host?.remove();
  host = null;
});

const mount = async (node: ReturnType<typeof h>) => {
  host = document.createElement("div");
  document.body.append(host);
  await act(async () => createRoot(host!).render(node));
  return host;
};

const key = (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
    );
  });

const drag = (el: Element, type: string, clientY = 0) =>
  act(async () => {
    const event = new Event(type, { bubbles: true, cancelable: true });
    Object.defineProperty(event, "dataTransfer", {
      value: { setData: () => {}, dropEffect: "none", effectAllowed: "none" },
    });
    Object.defineProperty(event, "clientY", { value: clientY });
    el.dispatchEvent(event);
  });

// Sortable is generic; the harness only needs it loose.
const List = Sortable as unknown as (props: Record<string, unknown>) => ReactNode;
type Item = (typeof ITEMS)[number];

const list = (extra: Record<string, unknown> = {}) => {
  const Harness = () => {
    const [seen, setSeen] = useState<string[]>([]);
    return h(
      "div",
      null,
      h(List, {
        defaultItems: ITEMS,
        label: "Columns",
        getLabel: (i: Item) => i.name,
        onReorder: (next: Item[]) => setSeen(next.map((i) => i.id)),
        ...extra,
        children: (item: Item) =>
          h(
            SortableItem,
            { id: item.id, key: item.id },
            h(SortableHandle),
            item.name,
            h(SortableDropIndicator),
          ),
      }),
      h("output", { "data-seen": seen.join("") }),
    );
  };
  return h(Harness);
};

const items = (root: ParentNode) => [...root.querySelectorAll<HTMLElement>("[data-sortable-id]")];
const order = (root: ParentNode) => items(root).map((el) => el.dataset.sortableId);

describe("Sortable", () => {
  it("draws a named list of draggable items with a handle", () => {
    const out = html(
      h(List, {
        items: ITEMS,
        label: "Columns",
        children: (item: Item) => h(SortableItem, { id: item.id }, h(SortableHandle), item.name),
      }),
    );
    expect(out).toContain('aria-label="Columns"');
    expect(out).toContain('class="fg-sortable"');
    expect(out).toContain('draggable="true"');
    expect(out).toContain('data-sortable-handle=""');
    expect(out).toContain('role="status"');
  });

  it("moves the focused item with Alt and the arrows, and says it in words", async () => {
    const root = await mount(list());
    const second = items(root)[1]!;
    second.focus();
    await key(second, "ArrowUp", { altKey: true });
    expect(order(root)).toEqual(["b", "a", "c"]);
    expect(root.querySelector<HTMLElement>("output")!.dataset.seen).toBe("bac");
    expect(root.querySelector("[role=status]")!.textContent).toBe(
      "Moved Status to position 1 of 3",
    );
    expect(document.activeElement).toBe(items(root)[0]);
    // At the top: nothing moves, nothing is said again.
    await key(items(root)[0]!, "ArrowUp", { altKey: true });
    expect(order(root)).toEqual(["b", "a", "c"]);
  });

  it("leaves a plain arrow to the page unless navigating", async () => {
    const root = await mount(list());
    const first = items(root)[0]!;
    const event = new KeyboardEvent("keydown", {
      key: "ArrowDown",
      bubbles: true,
      cancelable: true,
    });
    await act(async () => void first.dispatchEvent(event));
    expect(event.defaultPrevented).toBe(false);
    const root2 = await mount(list({ navigate: true }));
    const top = items(root2)[0]!;
    top.focus();
    await key(top, "ArrowDown");
    expect(document.activeElement).toBe(items(root2)[1]);
  });

  it("drags an item onto another and marks the one under the pointer", async () => {
    const root = await mount(list());
    const [a, , c] = items(root);
    await drag(a!, "dragstart");
    expect(a!.hasAttribute("data-dragging")).toBe(true);
    await drag(c!, "dragover");
    expect(c!.getAttribute("data-over")).toBe("after");
    expect(c!.querySelector(".fg-sortable-indicator")).not.toBeNull();
    await drag(c!, "drop");
    expect(order(root)).toEqual(["b", "c", "a"]);
    expect(root.querySelector("[role=status]")!.textContent).toBe("Moved Name to position 3 of 3");
    expect(root.querySelector("[data-dragging]")).toBeNull();
  });

  it("drags only by the handle when it has one", async () => {
    const root = await mount(list({ handle: true }));
    const [a] = items(root);
    expect(a!.getAttribute("draggable")).toBeNull();
    expect(a!.querySelector(".fg-sortable-handle")!.getAttribute("draggable")).toBe("true");
    // A drag that starts elsewhere in the item is not a drag of the item.
    await drag(a!, "dragstart");
    expect(a!.hasAttribute("data-dragging")).toBe(false);
    await drag(a!.querySelector(".fg-sortable-handle")!, "dragstart");
    expect(a!.hasAttribute("data-dragging")).toBe(true);
  });

  it("keeps a disabled item where it is, and a drop out of its range", async () => {
    const root = await mount(list({ disabled: (id: string) => id === "a", range: [1, 2] }));
    const [a, b] = items(root);
    expect(a!.getAttribute("draggable")).toBe("false");
    await key(a!, "ArrowDown", { altKey: true });
    expect(order(root)).toEqual(["a", "b", "c"]);
    await key(b!, "ArrowUp", { altKey: true });
    expect(order(root)).toEqual(["a", "b", "c"]);
  });

  it("asks canDrop and takes no drop it refuses", async () => {
    const onReorder = vi.fn<(...args: unknown[]) => void>();
    const root = await mount(
      list({ canDrop: (_: string, over: string) => over !== "c", onReorder }),
    );
    const [a, , c] = items(root);
    await drag(a!, "dragstart");
    await drag(c!, "dragover");
    expect(c!.hasAttribute("data-over")).toBe(false);
    await drag(c!, "drop");
    expect(order(root)).toEqual(["a", "b", "c"]);
  });

  it("hands a pointer drop to onItemDrop with its position, inside included", async () => {
    const onItemDrop = vi.fn<(...args: unknown[]) => void>();
    const root = await mount(list({ onItemDrop, nest: () => true }));
    const [a, b] = items(root);
    await drag(a!, "dragstart");
    // jsdom has no layout: a row that nests takes the drop inside.
    await drag(b!, "dragover");
    expect(b!.getAttribute("data-over")).toBe("inside");
    await drag(b!, "drop");
    expect(onItemDrop).toHaveBeenCalledWith({ id: "a", overId: "b", position: "inside" });
    expect(order(root)).toEqual(["a", "b", "c"]);
  });

  it("merges the handlers it is given with its own", async () => {
    const onKeyDown = vi.fn<(...args: unknown[]) => void>();
    const root = await mount(
      h(List, {
        defaultItems: ITEMS,
        children: (item: Item) => h(SortableItem, { id: item.id, onKeyDown }, item.name),
      }),
    );
    await key(items(root)[1]!, "ArrowUp", { altKey: true });
    expect(onKeyDown).toHaveBeenCalledTimes(1);
    expect(order(root)).toEqual(["b", "a", "c"]);
  });
});
