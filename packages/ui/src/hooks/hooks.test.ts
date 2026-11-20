// @vitest-environment jsdom
import { Delete02Icon, UserIcon } from "@forgeron/icons";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { collectionMove, collectionTypeahead } from "../collection-model";
import {
  buildCommands,
  buildMenu,
  formatShortcut,
  useActions,
  useCollection,
  useControllableState,
  useDisclosure,
  type Action,
} from "../index";

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
const press = async (key: string) =>
  act(async () => {
    document.body.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });

describe("useControllableState", () => {
  function Counter(props: { value?: number; onChange?: (n: number) => void }) {
    const [n, setN] = useControllableState({ ...props, defaultValue: 0 });
    return h("button", { type: "button", onClick: () => setN((c) => c + 1) }, String(n));
  }
  it("keeps its own value when the caller gives none", async () => {
    const onChange = vi.fn<(n: number) => void>();
    const el = await mount(h(Counter, { onChange }));
    await act(async () => el.querySelector("button")!.click());
    expect(el.textContent).toBe("1");
    expect(onChange).toHaveBeenCalledWith(1);
  });
  it("shows the caller's value and only asks for a change", async () => {
    const onChange = vi.fn<(n: number) => void>();
    const el = await mount(h(Counter, { value: 5, onChange }));
    await act(async () => el.querySelector("button")!.click());
    expect(el.textContent).toBe("5");
    expect(onChange).toHaveBeenCalledWith(6);
  });
});

describe("useDisclosure", () => {
  it("opens, closes and toggles", async () => {
    function Probe() {
      const d = useDisclosure();
      return h(
        "div",
        null,
        h("button", { type: "button", id: "open", onClick: d.onOpen }),
        h("button", { type: "button", id: "toggle", onClick: d.toggle }),
        h("span", null, d.open ? "open" : "closed"),
      );
    }
    const el = await mount(h(Probe));
    await act(async () => el.querySelector<HTMLElement>("#open")!.click());
    expect(el.querySelector("span")!.textContent).toBe("open");
    await act(async () => el.querySelector<HTMLElement>("#toggle")!.click());
    expect(el.querySelector("span")!.textContent).toBe("closed");
  });
});

const assign = vi.fn<() => void>();
const remove = vi.fn<() => void>();
const actions: Action[] = [
  { id: "delete", label: "Delete", icon: Delete02Icon, danger: true, run: remove },
  { id: "assign-me", label: "Assign to me", icon: UserIcon, shortcut: "i", run: assign },
  { id: "copy", label: "Copy link", group: "Share", shortcut: "mod+shift+c" },
  {
    id: "status",
    label: "Status",
    actions: [
      { id: "status:todo", label: "Todo", checked: true, run: () => {} },
      { id: "status:done", label: "Done", run: () => {} },
    ],
  },
];

describe("buildMenu", () => {
  it("keeps groups apart, puts the danger last and shows the shortcut caps", () => {
    const menu = buildMenu(actions);
    expect(menu.map((e) => ("id" in e ? e.id : "—"))).toEqual([
      "assign-me",
      "status",
      "—",
      "copy",
      "—",
      "delete",
    ]);
    const copy = menu.find((e) => "id" in e && e.id === "copy");
    expect(copy && "kbd" in copy ? copy.kbd : null).toEqual(["⌘", "⇧", "C"]);
  });
});

describe("buildCommands", () => {
  it("names the choices after their action, and groups by group", () => {
    const groups = buildCommands(actions);
    expect(groups.map((g) => g.label)).toEqual(["Actions", "Share"]);
    expect(groups[0]!.items.map((i) => i.label)).toContain("Status: Done");
  });
});

describe("formatShortcut", () => {
  it("reads mod as ⌘ or Ctrl", () => {
    expect(formatShortcut("mod+k")).toEqual(["⌘", "K"]);
    expect(formatShortcut("mod+enter", { mac: false })).toEqual(["Ctrl", "↵"]);
  });
});

describe("useActions", () => {
  it("runs an action by id and from its shortcut", async () => {
    const ran: boolean[] = [];
    function Probe() {
      const a = useActions(actions);
      return h(
        "div",
        null,
        h("button", { type: "button", id: "del", onClick: () => ran.push(a.run("delete")) }),
        h("button", { type: "button", id: "copy", onClick: () => ran.push(a.run("copy")) }),
      );
    }
    const el = await mount(h(Probe));
    await act(async () => el.querySelector<HTMLElement>("#del")!.click());
    await act(async () => el.querySelector<HTMLElement>("#copy")!.click());
    expect(ran).toEqual([true, false]);
    expect(remove).toHaveBeenCalledTimes(1);
    await press("i");
    expect(assign).toHaveBeenCalledTimes(1);
  });
});

describe("collection model", () => {
  it("moves by the arrows of its orientation, clamped, and lands on the first from nowhere", () => {
    const v = { orientation: "vertical" as const };
    expect(collectionMove("ArrowDown", 0, 3, v)).toBe(1);
    expect(collectionMove("ArrowDown", 2, 3, v)).toBe(2);
    expect(collectionMove("ArrowUp", -1, 3, v)).toBe(0);
    expect(collectionMove("ArrowRight", 0, 3, v)).toBeNull();
    expect(collectionMove("j", 0, 3, v)).toBeNull();
    expect(collectionMove("j", 0, 3, { ...v, vimKeys: true })).toBe(1);
    expect(collectionMove("End", 0, 3, v)).toBe(2);
    expect(collectionMove("Home", 2, 3, { orientation: "horizontal" })).toBe(0);
    expect(collectionMove("ArrowDown", 0, 3, { orientation: "horizontal" })).toBeNull();
  });
  it("moves a grid by its columns, and stays on the last row", () => {
    const g = { orientation: "grid" as const, columns: 3 };
    expect(collectionMove("ArrowDown", 1, 7, g)).toBe(4);
    expect(collectionMove("ArrowDown", 4, 7, g)).toBe(4);
    expect(collectionMove("ArrowUp", 4, 7, g)).toBe(1);
    expect(collectionMove("ArrowUp", 1, 7, g)).toBe(1);
    expect(collectionMove("ArrowRight", 1, 7, g)).toBe(2);
    expect(collectionMove("ArrowDown", 0, 3, { orientation: "grid", rowStep: () => 2 })).toBe(2);
  });
  it("finds a word by its start, one letter after the focus and wrapping", () => {
    const texts = ["Alpha", "Beta", "Bravo", "Charlie"];
    expect(collectionTypeahead(texts, 0, "b")).toBe(1);
    expect(collectionTypeahead(texts, 1, "b")).toBe(2);
    expect(collectionTypeahead(texts, 2, "b")).toBe(1);
    expect(collectionTypeahead(texts, 2, "br")).toBe(2);
    expect(collectionTypeahead(texts, 0, "z")).toBe(-1);
  });
});

describe("useCollection", () => {
  const ITEMS = [
    { id: "a", name: "Alpha" },
    { id: "b", name: "Beta" },
    { id: "c", name: "Bravo" },
    { id: "d", name: "Delta" },
  ];
  interface ProbeProps {
    mode?: "none" | "single" | "multiple";
    onSelectedChange?: (ids: string[]) => void;
    onAction?: (id: string) => void;
    defaultSelected?: string[];
    focusMode?: "roving" | "activedescendant";
    onKeyDown?: (event: { key: string; preventDefault: () => void }) => void;
  }
  function Probe({ mode = "multiple", onKeyDown, focusMode = "roving", ...rest }: ProbeProps) {
    const c = useCollection({
      items: ITEMS,
      getId: (i) => i.id,
      getText: (i) => i.name,
      selectionMode: mode,
      focusMode,
      ...rest,
    });
    return h(
      "div",
      c.getContainerProps({
        role: "listbox",
        ...(onKeyDown ? { onKeyDown } : {}),
      }),
      ITEMS.map((i) =>
        h("div", { key: i.id, ...c.getItemProps(i.id, { role: "option" }) }, i.name),
      ),
    );
  }
  const options = (el: HTMLElement) => [...el.querySelectorAll<HTMLElement>("[role=option]")];
  const press2 = async (el: Element, k: string, init: KeyboardEventInit = {}) =>
    act(async () => {
      el.dispatchEvent(
        new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
      );
    });
  const tap = async (el: Element, init: MouseEventInit = {}) =>
    act(async () => {
      el.dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true, ...init }));
    });

  it("has one tab stop that moves with the focus, and the arrows select", async () => {
    const onSelectedChange = vi.fn<(ids: string[]) => void>();
    const el = await mount(h(Probe, { onSelectedChange }));
    const [a, b] = options(el);
    expect(options(el).map((o) => o.tabIndex)).toEqual([0, -1, -1, -1]);
    a!.focus();
    await press2(a!, "ArrowDown");
    expect(document.activeElement).toBe(b);
    expect(onSelectedChange).toHaveBeenLastCalledWith(["b"]);
    expect(options(el).map((o) => o.tabIndex)).toEqual([-1, 0, -1, -1]);
    expect(b!.getAttribute("aria-selected")).toBe("true");
  });
  it("selects with a click, toggles with Ctrl, extends with Shift", async () => {
    const onSelectedChange = vi.fn<(ids: string[]) => void>();
    const el = await mount(h(Probe, { onSelectedChange }));
    const o = options(el);
    await tap(o[0]!);
    await tap(o[2]!, { ctrlKey: true });
    expect(onSelectedChange).toHaveBeenLastCalledWith(["a", "c"]);
    await tap(o[3]!, { shiftKey: true });
    expect(onSelectedChange).toHaveBeenLastCalledWith(["c", "d"]);
    await tap(o[1]!);
    expect(onSelectedChange).toHaveBeenLastCalledWith(["b"]);
  });
  it("extends with Shift and the arrows, takes all with Ctrl A, clears with Escape", async () => {
    const onSelectedChange = vi.fn<(ids: string[]) => void>();
    const el = await mount(h(Probe, { onSelectedChange }));
    const o = options(el);
    await tap(o[1]!);
    o[1]!.focus();
    await press2(o[1]!, "ArrowDown", { shiftKey: true });
    expect(onSelectedChange).toHaveBeenLastCalledWith(["b", "c"]);
    await press2(document.activeElement!, "a", { ctrlKey: true });
    expect(onSelectedChange).toHaveBeenLastCalledWith(["a", "b", "c", "d"]);
    await press2(document.activeElement!, "Escape");
    expect(onSelectedChange).toHaveBeenLastCalledWith([]);
  });
  it("moves with Ctrl and the arrows without selecting; Space then selects", async () => {
    const onSelectedChange = vi.fn<(ids: string[]) => void>();
    const el = await mount(h(Probe, { onSelectedChange, defaultSelected: ["a"] }));
    const o = options(el);
    o[0]!.focus();
    await press2(o[0]!, "ArrowDown", { ctrlKey: true });
    expect(document.activeElement).toBe(o[1]);
    expect(onSelectedChange).not.toHaveBeenCalled();
    await press2(o[1]!, " ", { ctrlKey: true });
    expect(onSelectedChange).toHaveBeenLastCalledWith(["a", "b"]);
    await press2(o[1]!, " ");
    expect(onSelectedChange).toHaveBeenLastCalledWith(["b"]);
  });
  it("opens with Enter and a double click, and jumps to a typed word", async () => {
    const onAction = vi.fn<(id: string) => void>();
    const el = await mount(h(Probe, { onAction }));
    const o = options(el);
    o[0]!.focus();
    await press2(o[0]!, "d");
    expect(document.activeElement).toBe(o[3]);
    await press2(o[3]!, "Enter");
    expect(onAction).toHaveBeenLastCalledWith("d");
    await act(async () => o[1]!.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
    expect(onAction).toHaveBeenLastCalledWith("b");
  });
  it("selects nothing in mode none and one at a time in mode single", async () => {
    const none = vi.fn<(ids: string[]) => void>();
    let el = await mount(h(Probe, { mode: "none", onSelectedChange: none }));
    await tap(options(el)[1]!);
    expect(none).not.toHaveBeenCalled();
    expect(options(el)[1]!.hasAttribute("aria-selected")).toBe(false);
    await act(async () => root?.unmount());
    host?.remove();
    const one = vi.fn<(ids: string[]) => void>();
    el = await mount(h(Probe, { mode: "single", onSelectedChange: one }));
    await tap(options(el)[0]!);
    await tap(options(el)[2]!, { ctrlKey: true });
    expect(one).toHaveBeenLastCalledWith(["c"]);
  });
  it("leaves a key to a handler that handled it", async () => {
    const onSelectedChange = vi.fn<(ids: string[]) => void>();
    const el = await mount(
      h(Probe, {
        onSelectedChange,
        onKeyDown: (e) => {
          if (e.key === "ArrowDown") e.preventDefault();
        },
      }),
    );
    const o = options(el);
    o[0]!.focus();
    await press2(o[0]!, "ArrowDown");
    expect(document.activeElement).toBe(o[0]);
    expect(onSelectedChange).not.toHaveBeenCalled();
  });
  it("points at the active item from the container with activedescendant", async () => {
    const el = await mount(h(Probe, { focusMode: "activedescendant", defaultSelected: ["b"] }));
    const list = el.querySelector<HTMLElement>("[role=listbox]")!;
    expect(list.tabIndex).toBe(0);
    expect(list.getAttribute("aria-activedescendant")).toBe(options(el)[1]!.id);
    expect(options(el)[0]!.hasAttribute("tabindex")).toBe(false);
    await press2(list, "ArrowDown");
    expect(list.getAttribute("aria-activedescendant")).toBe(options(el)[2]!.id);
  });
});
