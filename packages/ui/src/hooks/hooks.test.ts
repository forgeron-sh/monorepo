// @vitest-environment jsdom
import { Delete02Icon, UserIcon } from "@forgeron/icons";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildCommands,
  buildMenu,
  formatShortcut,
  useActions,
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
