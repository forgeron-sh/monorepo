// @vitest-environment jsdom
import { act, createElement as h, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "./index";

// shadcn's compound parts next to our props-driven roots (D-156).

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

describe("Dialog parts", () => {
  it("opens from its trigger, as the shadcn example writes it", async () => {
    await mount(
      h(
        Dialog,
        null,
        h(DialogTrigger, { asChild: true }, h(Button, { variant: "outline" }, "Edit profile")),
        h(
          DialogContent,
          null,
          h(
            DialogHeader,
            null,
            h(DialogTitle, null, "Edit profile"),
            h(DialogDescription, null, "Save when done."),
          ),
          h(DialogFooter, null, h(Button, null, "Save")),
        ),
      ),
    );
    const trigger = host!.querySelector("button")!;
    expect(trigger.className).toContain("fg-btn-secondary");
    await act(async () => trigger.click());
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.className).toContain("fg-dialog-popup");
    expect(dialog.querySelector(".fg-dialog-title")?.textContent).toBe("Edit profile");
    expect(dialog.getAttribute("aria-labelledby")).toBe(
      dialog.querySelector(".fg-dialog-title")!.id,
    );
    expect(dialog.querySelector('.fg-dialog-x[aria-label="Close"]')).not.toBeNull();
    expect(document.querySelector(".fg-dialog-backdrop")).not.toBeNull();
  });

  it("keeps the props-driven dialog when given a title", () => {
    const out = html(h(Dialog, { title: "Delete", onClose: () => {} }, "Sure?"));
    expect(out).toContain('class="fg-dialog-title"');
    expect(out).toContain("fg-dialog-scrim");
  });
});

describe("Select parts", () => {
  it("draws the trigger and the chosen value", async () => {
    await mount(
      h(
        Select,
        {
          defaultValue: "light",
          items: [
            { value: "light", label: "Light" },
            { value: "dark", label: "Dark" },
          ],
        },
        h(SelectTrigger, { className: "w-48" }, h(SelectValue, { placeholder: "Theme" })),
        h(
          SelectContent,
          null,
          h(SelectItem, { value: "light" }, "Light"),
          h(SelectItem, { value: "dark" }, "Dark"),
        ),
      ),
    );
    const trigger = host!.querySelector(".fg-selm-trigger")!;
    expect(trigger.className).toContain("w-48");
    expect(trigger.querySelector(".fg-selm-value")?.textContent).toBe("Light");
  });

  it("keeps the native select when given options", () => {
    expect(html(h(Select, { options: [{ value: "a", label: "A" }] }))).toContain("<select");
  });
});

describe("Tabs parts", () => {
  it("shows the panel of the chosen tab and moves with a click", async () => {
    const onValueChange = vi.fn<(value: unknown) => void>();
    await mount(
      h(
        Tabs,
        { defaultValue: "account", onValueChange },
        h(
          TabsList,
          null,
          h(TabsTrigger, { value: "account" }, "Account"),
          h(TabsTrigger, { value: "password" }, "Password"),
        ),
        h(TabsContent, { value: "account" }, "Account panel"),
        h(TabsContent, { value: "password" }, "Password panel"),
      ),
    );
    const tabs = [...host!.querySelectorAll<HTMLElement>('[role="tab"]')];
    expect(tabs.map((t) => t.className)).toEqual(["fg-tab", "fg-tab"]);
    expect(tabs[0]!.getAttribute("aria-selected")).toBe("true");
    await act(async () => tabs[1]!.click());
    expect(onValueChange.mock.calls[0]?.[0]).toBe("password");
    expect(host!.querySelector('[role="tabpanel"]:not([hidden])')?.textContent).toBe(
      "Password panel",
    );
  });

  it("keeps the props-driven tabs when given tabs", () => {
    const out = html(
      h(Tabs, { label: "Tool", tabs: [{ id: "a", label: "A" }], value: "a", onChange: () => {} }),
    );
    expect(out).toContain('aria-label="Tool"');
  });
});

describe("Popover, Tooltip and DropdownMenu parts", () => {
  it("opens a popover from its trigger", async () => {
    await mount(
      h(
        Popover,
        null,
        h(PopoverTrigger, null, "Open"),
        h(PopoverContent, { className: "w-80" }, "Dimensions"),
      ),
    );
    await act(async () => host!.querySelector("button")!.click());
    const popup = document.querySelector(".fg-popover")!;
    expect(popup.className).toContain("w-80");
    expect(popup.textContent).toBe("Dimensions");
  });

  it("renders a tooltip trigger, and the props-driven tooltip with content", async () => {
    await mount(
      h(
        Tooltip,
        null,
        h(TooltipTrigger, { asChild: true }, h("button", null, "Hover")),
        h(TooltipContent, null, "Add"),
      ),
    );
    expect(host!.querySelector("button")?.textContent).toBe("Hover");
    await mount(h(Tooltip, { content: "Add", children: h("button", null, "Hover") }));
    expect(host!.querySelector("button")?.textContent).toBe("Hover");
  });

  it("opens a dropdown menu with a label, a separator and a destructive item", async () => {
    const onClick = vi.fn<() => void>();
    await mount(
      h(
        DropdownMenu,
        null,
        h(DropdownMenuTrigger, null, "Open"),
        h(
          DropdownMenuContent,
          null,
          h(DropdownMenuLabel, null, "My account"),
          h(DropdownMenuSeparator),
          h(DropdownMenuItem, { onClick }, "Profile"),
          h(DropdownMenuItem, { variant: "destructive" }, "Log out"),
        ),
      ),
    );
    await act(async () => host!.querySelector("button")!.click());
    const menu = document.querySelector('[role="menu"]')!;
    const items = [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')];
    expect(items.map((i) => i.textContent)).toEqual(["Profile", "Log out"]);
    expect(items[1]!.className).toContain("fg-pop-danger");
    expect(menu.querySelector(".fg-pop-heading")?.textContent).toBe("My account");
    await act(async () => items[0]!.click());
    expect(onClick).toHaveBeenCalledOnce();
  });
});
