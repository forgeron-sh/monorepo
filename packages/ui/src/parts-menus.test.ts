// @vitest-environment jsdom
import { InboxIcon, MoreHorizontalIcon } from "@forgeron/icons";
import { act, createElement as h, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ActionMenu,
  CommandPalette,
  ContextMenu,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  IconButton,
  Modal,
  filterCommands,
  type CommandPaletteGroup,
} from "./index";

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
const key = async (target: Element, k: string) =>
  act(async () => {
    target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
  });

const groups: CommandPaletteGroup[] = [
  {
    label: "Go to",
    items: [
      { id: "inbox", label: "Inbox", icon: InboxIcon },
      { id: "settings", label: "Settings", keywords: ["preferences"] },
    ],
  },
  {
    label: "Issues",
    items: [
      { id: "OPS-40", label: "Supplier invoices arrive twice from Odoo", hint: "OPS-40" },
      { id: "OPS-22", label: "Fire exit signage audit", hint: "OPS-22" },
    ],
  },
];

describe("filterCommands", () => {
  it("keeps everything for an empty query", () => {
    expect(filterCommands(groups, "  ")).toHaveLength(2);
  });
  it("matches label, hint and keywords, case-insensitively, and drops empty groups", () => {
    expect(filterCommands(groups, "PREFER")).toEqual([
      { label: "Go to", items: [groups[0]!.items[1]] },
    ]);
    expect(filterCommands(groups, "ops-22")[0]!.items.map((i) => i.id)).toEqual(["OPS-22"]);
    expect(filterCommands(groups, "odoo twice")[0]!.items.map((i) => i.id)).toEqual(["OPS-40"]);
    expect(filterCommands(groups, "nothing")).toEqual([]);
  });
});

describe("CommandPalette", () => {
  const Harness = ({ onSelect }: { onSelect: (id: string) => void }) => {
    const [open, setOpen] = useState(true);
    return h(CommandPalette, { open, onOpenChange: setOpen, groups, onSelect });
  };

  it("moves with the arrows, runs with Enter, then closes", async () => {
    const onSelect = vi.fn<(id: string) => void>();
    await mount(h(Harness, { onSelect }));
    const input = document.querySelector<HTMLInputElement>("[role=combobox]")!;
    expect(input).not.toBeNull();
    const active = () => document.getElementById(input.getAttribute("aria-activedescendant")!);
    expect(active()?.textContent).toContain("Inbox");
    await key(input, "ArrowDown");
    expect(active()?.textContent).toContain("Settings");
    await key(input, "ArrowUp");
    await key(input, "ArrowUp");
    expect(active()?.textContent).toContain("Fire exit");
    await key(input, "Enter");
    expect(onSelect).toHaveBeenCalledWith("OPS-22");
    expect(document.querySelector("[role=combobox]")).toBeNull();
  });

  it("filters as you type and says when nothing matches", async () => {
    await mount(h(Harness, { onSelect: () => {} }));
    const input = document.querySelector<HTMLInputElement>("[role=combobox]")!;
    const type = async (value: string) =>
      act(async () => {
        const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
        set.call(input, value);
        input.dispatchEvent(new Event("input", { bubbles: true }));
      });
    await type("signage");
    expect(document.querySelectorAll("[role=option]")).toHaveLength(1);
    expect(document.querySelector(".fg-palette-group")?.textContent).toBe("Issues");
    await type("zzz");
    expect(document.querySelectorAll("[role=option]")).toHaveLength(0);
    expect(document.querySelector(".fg-palette-empty")?.textContent).toBe("No results for “zzz”");
  });
});

describe("ActionMenu", () => {
  it("renders its trigger, and its rows, submenus and danger row once open", async () => {
    const onSelect = vi.fn<(id: string) => void>();
    expect(
      html(
        h(ActionMenu, {
          trigger: h(IconButton, { icon: MoreHorizontalIcon, label: "Issue actions" }),
          items: [],
          onSelect,
        }),
      ),
    ).toContain('aria-label="Issue actions"');
    await mount(
      h(ActionMenu, {
        trigger: h(IconButton, { icon: MoreHorizontalIcon, label: "Issue actions" }),
        open: true,
        label: "Actions on OPS-40",
        items: [
          {
            id: "status",
            label: "Status",
            kbd: "S",
            items: [{ id: "status:done", label: "Done", checked: true }],
          },
          { separator: true },
          { id: "copy", label: "Copy ID" },
          { id: "delete", label: "Delete issue", danger: true },
        ],
        onSelect,
      }),
    );
    const menu = document.querySelector("[role=menu]")!;
    expect(menu.getAttribute("aria-label")).toBe("Actions on OPS-40");
    const rows = [...document.querySelectorAll("[role=menuitem]")];
    expect(rows.map((r) => r.textContent)).toEqual(["StatusS", "Copy ID", "Delete issue"]);
    expect(rows[0]!.getAttribute("aria-haspopup")).toBe("menu");
    expect(rows[2]!.className).toContain("fg-amenu-danger");
    expect(document.querySelector("[role=separator]")).not.toBeNull();
    await act(async () => (rows[1] as HTMLElement).click());
    expect(onSelect).toHaveBeenCalledWith("copy");
  });
});

describe("ActionMenu submenus", () => {
  it("opens a submenu built on the DropdownMenu parts", async () => {
    await mount(
      h(
        DropdownMenu,
        { open: true },
        h(DropdownMenuTrigger, null, "Open"),
        h(
          DropdownMenuContent,
          null,
          h(DropdownMenuItem, null, "Copy"),
          h(
            DropdownMenuSub,
            null,
            h(DropdownMenuSubTrigger, null, "More"),
            h(DropdownMenuSubContent, null, h(DropdownMenuItem, null, "Deeper")),
          ),
        ),
      ),
    );
    const rows = [...document.querySelectorAll("[role=menuitem]")];
    expect(rows.map((r) => r.textContent)).toEqual(["Copy", "More"]);
    expect(rows[1]!.getAttribute("aria-haspopup")).toBe("menu");
  });
});

describe("ContextMenu with items", () => {
  it("opens its rows on a right click in the area", async () => {
    const onSelect = vi.fn<(id: string) => void>();
    const el = await mount(
      h(ContextMenu, {
        items: [
          { id: "a", label: "Rename" },
          { separator: true },
          { id: "d", label: "Delete", danger: true },
        ],
        onSelect,
        label: "Actions",
        areaClassName: "area",
        children: "Right click",
      }),
    );
    const area = el.querySelector(".area")!;
    expect(area.textContent).toBe("Right click");
    await act(async () => {
      area.dispatchEvent(
        new MouseEvent("contextmenu", { bubbles: true, cancelable: true, clientX: 5, clientY: 5 }),
      );
    });
    const rows = [...document.querySelectorAll("[role=menuitem]")];
    expect(rows.map((r) => r.textContent)).toEqual(["Rename", "Delete"]);
    expect(rows[1]!.className).toContain("fg-amenu-danger");
    await act(async () => (rows[0] as HTMLElement).click());
    expect(onSelect).toHaveBeenCalledWith("a");
  });
});

describe("Modal", () => {
  it("is a dialog named by its title, with a close button that asks to close", async () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    await mount(
      h(Modal, { open: true, onOpenChange, title: "New issue", context: "OPS", children: "Body" }),
    );
    const dialog = document.querySelector("[role=dialog]")!;
    expect(dialog.className).toContain("fg-modal");
    expect(dialog.getAttribute("aria-labelledby")).toBe(
      document.querySelector(".fg-modal-title")!.id,
    );
    expect(document.querySelector(".fg-modal-head")?.textContent).toContain("OPS");
    await act(async () => document.querySelector<HTMLElement>(".fg-modal-close")!.click());
    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
