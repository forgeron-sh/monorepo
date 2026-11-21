// @vitest-environment jsdom
// As in shadcn, every part carries `data-slot="<kebab-name>"` on its root element, before `...rest`
// so that a caller can rename it. A sample of parts from several files.
import { act, createElement as h, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it } from "vitest";
import {
  Badge,
  Calendar,
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  Menu,
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SettingsGroup,
  SettingsRow,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let unmount: (() => void) | undefined;
const mount = async (element: ReactElement) => {
  host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(element));
  unmount = () => root.unmount();
  return host;
};
afterEach(async () => {
  await act(async () => unmount?.());
  host?.remove();
  host = undefined;
});

/** The `data-slot` values of a markup string, in document order. */
const slotsIn = (markup: string) => [...markup.matchAll(/data-slot="([^"]*)"/g)].map((m) => m[1]);
/** The `data-slot` values of everything in the document, portals included. */
const slotsOnPage = () =>
  [...document.body.querySelectorAll("[data-slot]")].map((el) => el.getAttribute("data-slot"));

describe("data-slot on parts", () => {
  it("names the parts of an open Dialog, portal included", async () => {
    await mount(
      h(
        Dialog,
        { defaultOpen: true },
        h(DialogTrigger, null, "Open"),
        h(
          DialogContent,
          null,
          h(
            DialogHeader,
            null,
            h(DialogTitle, null, "Rename"),
            h(DialogDescription, null, "Pick a name."),
          ),
          h(DialogFooter, null, h(DialogClose, null, "Cancel")),
        ),
      ),
    );
    const slots = slotsOnPage();
    for (const name of [
      "dialog-trigger",
      "dialog-content",
      "dialog-header",
      "dialog-title",
      "dialog-description",
      "dialog-footer",
      "dialog-close",
    ]) {
      expect(slots).toContain(name);
    }
  });

  it("names the props-driven Dialog", () => {
    const out = renderToStaticMarkup(h(Dialog, { title: "T", onClose: () => {} }, "body"));
    expect(slotsIn(out)).toEqual(["dialog"]);
  });

  it("names the parts of an open Select", async () => {
    await mount(
      h(
        Select,
        {
          defaultOpen: true,
          defaultValue: "a",
          items: [
            { value: "a", label: "A" },
            { value: "b", label: "B" },
          ],
        },
        h(SelectTrigger, null, h(SelectValue, null)),
        h(
          SelectContent,
          null,
          h(SelectItem, { value: "a" }, "A"),
          h(SelectItem, { value: "b" }, "B"),
        ),
      ),
    );
    const slots = slotsOnPage();
    for (const name of ["select-trigger", "select-value", "select-content", "select-item"]) {
      expect(slots).toContain(name);
    }
  });

  it("names the native Select", () => {
    const out = renderToStaticMarkup(h(Select, { options: [{ value: "a", label: "A" }] }));
    expect(slotsIn(out)).toEqual(["native-select"]);
  });

  it("names the parts of Tabs", async () => {
    await mount(
      h(
        Tabs,
        { defaultValue: "a" },
        h(TabsList, null, h(TabsTrigger, { value: "a" }, "A")),
        h(TabsContent, { value: "a" }, "panel"),
      ),
    );
    expect(slotsOnPage()).toEqual(["tabs", "tabs-list", "tabs-trigger", "tabs-content"]);
  });

  it("names the props-driven Tabs and its inner parts", () => {
    const out = renderToStaticMarkup(
      h(
        Tabs,
        { label: "Views", tabs: [{ id: "a", label: "A" }], value: "a", onChange: () => {} },
        "panel",
      ),
    );
    expect(slotsIn(out)).toEqual(["tabs", "tabs-list", "tabs-trigger", "tabs-content"]);
  });

  it("names the parts of a Table", () => {
    const out = renderToStaticMarkup(
      h(
        Table,
        null,
        h(TableCaption, null, "c"),
        h(TableHeader, null, h(TableRow, null, h(TableHead, null, "h"))),
        h(TableBody, null, h(TableRow, null, h(TableCell, null, "x"))),
        h(TableFooter, null, h(TableRow, null, h(TableCell, null, "f"))),
      ),
    );
    const slots = new Set(slotsIn(out));
    for (const name of [
      "table-container",
      "table",
      "table-caption",
      "table-header",
      "table-row",
      "table-head",
      "table-body",
      "table-cell",
      "table-footer",
    ]) {
      expect(slots).toContain(name);
    }
  });

  it("names the parts of a Command", () => {
    const out = renderToStaticMarkup(
      h(
        Command,
        null,
        h(CommandInput, null),
        h(
          CommandList,
          null,
          h(CommandEmpty, null, "none"),
          h(
            CommandGroup,
            { heading: "Go" },
            h(CommandItem, null, "Inbox", h(CommandShortcut, null, "G I")),
          ),
          h(CommandSeparator, null),
        ),
      ),
    );
    const slots = new Set(slotsIn(out));
    for (const name of [
      "command",
      "command-input",
      "command-list",
      "command-empty",
      "command-group",
      "command-item",
      "command-shortcut",
      "command-separator",
    ]) {
      expect(slots).toContain(name);
    }
  });

  it("names the parts of a Calendar", () => {
    const out = renderToStaticMarkup(h(Calendar, { today: "2026-11-17" }));
    const slots = new Set(slotsIn(out));
    for (const name of [
      "calendar",
      "calendar-header",
      "calendar-previous",
      "calendar-title",
      "calendar-next",
      "calendar-grid",
      "calendar-cell",
      "calendar-day",
    ]) {
      expect(slots).toContain(name);
    }
  });

  it("names the parts of a Sidebar", () => {
    const out = renderToStaticMarkup(
      h(
        Sidebar,
        null,
        h(SidebarHeader, null, "acme"),
        h(
          SidebarContent,
          null,
          h(
            SidebarGroup,
            null,
            h(SidebarGroupLabel, null, "Work"),
            h(SidebarMenu, null, h(SidebarMenuItem, null, h(SidebarMenuButton, null, "Inbox"))),
          ),
        ),
        h(SidebarFooter, null, "ada"),
      ),
    );
    expect(slotsIn(out)).toEqual([
      "sidebar",
      "sidebar-header",
      "sidebar-content",
      "sidebar-group",
      "sidebar-group-label",
      "sidebar-menu",
      "sidebar-menu-item",
      "sidebar-menu-button",
      "sidebar-footer",
    ]);
  });

  it("names the parts of Pagination, Settings and Field", () => {
    const pages = renderToStaticMarkup(
      h(
        Pagination,
        null,
        h(PaginationContent, null, h(PaginationItem, null, h(PaginationLink, null, "1"))),
      ),
    );
    expect(slotsIn(pages)).toEqual([
      "pagination",
      "pagination-content",
      "pagination-item",
      "pagination-link",
    ]);
    const settings = renderToStaticMarkup(
      h(SettingsGroup, { title: "T" }, h(SettingsRow, { label: "L" }, "ctl")),
    );
    expect(new Set(slotsIn(settings))).toEqual(
      new Set([
        "settings-group",
        "settings-group-header",
        "settings-group-title",
        "settings-group-card",
        "settings-row",
        "settings-row-text",
        "settings-row-label",
        "settings-row-control",
      ]),
    );
    expect(
      slotsIn(renderToStaticMarkup(h(Field, { label: "Name", children: () => null }))),
    ).toEqual(["field"]);
  });

  it("names an atom and a presets root", () => {
    expect(slotsIn(renderToStaticMarkup(h(Badge, null, "new")))).toEqual(["badge"]);
    const menu = renderToStaticMarkup(
      h(Menu, {
        label: "Account",
        trigger: "Ada",
        entries: [{ kind: "action", label: "Out", onSelect: () => {} }],
      }),
    );
    expect(slotsIn(menu)[0]).toBe("menu");
  });

  it("lets a caller rename a slot, and add props to the root", () => {
    const out = renderToStaticMarkup(
      h(TableRow, { "data-slot": "mine", "data-testid": "row", className: "x" } as never),
    );
    expect(out).toContain('data-slot="mine"');
    expect(out).not.toContain('data-slot="table-row"');
    expect(out).toContain('data-testid="row"');
    expect(out).toContain('class="fg-table-row x"');
    const menu = renderToStaticMarkup(
      h(Menu, { label: "A", trigger: "t", entries: [], "data-testid": "m" } as never),
    );
    expect(menu).toContain('data-testid="m"');
  });
});
