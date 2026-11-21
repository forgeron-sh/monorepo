// @vitest-environment jsdom
import { act, createElement as h, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuLabel,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
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

describe("Drawer parts", () => {
  it("opens from its trigger and slides from the bottom by default", async () => {
    await mount(
      h(
        Drawer,
        null,
        h(DrawerTrigger, null, "Open"),
        h(
          DrawerContent,
          null,
          h(
            DrawerHeader,
            null,
            h(DrawerTitle, null, "Move goal"),
            h(DrawerDescription, null, "Set your daily goal."),
          ),
          h(DrawerFooter, null, h(DrawerClose, null, "Cancel")),
        ),
      ),
    );
    await act(async () => host!.querySelector("button")!.click());
    const popup = document.querySelector(".fg-sheet")!;
    expect(popup.getAttribute("data-side")).toBe("bottom");
    expect(popup.querySelector(".fg-dialog-title")?.textContent).toBe("Move goal");
    expect(popup.querySelector(".fg-sheet-foot")).not.toBeNull();
  });

  it("takes a direction", async () => {
    await mount(
      h(
        Drawer,
        { direction: "right", defaultOpen: true },
        h(DrawerContent, null, h(DrawerTitle, null, "T")),
      ),
    );
    expect(document.querySelector(".fg-sheet")?.getAttribute("data-side")).toBe("right");
  });

  it("keeps the props-driven drawer when given a title", () => {
    const out = html(h(Drawer, { title: "Row 1041", onClose: () => {} }, "Body"));
    expect(out).toContain("fg-drawer-title");
  });
});

describe("Sheet", () => {
  it("opens on the right by default, with a close button", async () => {
    await mount(
      h(
        Sheet,
        null,
        h(SheetTrigger, null, "Open"),
        h(
          SheetContent,
          null,
          h(
            SheetHeader,
            null,
            h(SheetTitle, null, "Edit profile"),
            h(SheetDescription, null, "Make changes."),
          ),
          h(SheetFooter, null, h(SheetClose, null, "Done")),
        ),
      ),
    );
    await act(async () => host!.querySelector("button")!.click());
    const popup = document.querySelector('[role="dialog"]')!;
    expect(popup.getAttribute("data-side")).toBe("right");
    expect(popup.querySelector(".fg-dialog-title")?.textContent).toBe("Edit profile");
    expect(popup.querySelector('.fg-dialog-x[aria-label="Close"]')).not.toBeNull();
  });

  it("takes a side and can hide the close button", async () => {
    await mount(
      h(
        Sheet,
        { defaultOpen: true },
        h(SheetContent, { side: "left", showCloseButton: false }, h(SheetTitle, null, "T")),
      ),
    );
    const popup = document.querySelector('[role="dialog"]')!;
    expect(popup.getAttribute("data-side")).toBe("left");
    expect(popup.querySelector(".fg-dialog-x")).toBeNull();
  });
});

describe("AlertDialog", () => {
  it("asks, and closes on Cancel", async () => {
    const onOpenChange = vi.fn<(open: boolean) => void>();
    await mount(
      h(
        AlertDialog,
        { onOpenChange },
        h(AlertDialogTrigger, null, "Delete"),
        h(
          AlertDialogContent,
          null,
          h(
            AlertDialogHeader,
            null,
            h(AlertDialogTitle, null, "Are you sure?"),
            h(AlertDialogDescription, null, "This cannot be undone."),
          ),
          h(
            AlertDialogFooter,
            null,
            h(AlertDialogCancel, null, "Cancel"),
            h(AlertDialogAction, null, "Continue"),
          ),
        ),
      ),
    );
    await act(async () => host!.querySelector("button")!.click());
    const popup = document.querySelector('[role="alertdialog"]')!;
    expect(popup.className).toContain("fg-dialog-popup");
    expect(popup.querySelector(".fg-btn-primary")?.textContent).toBe("Continue");
    const cancel = popup.querySelector<HTMLElement>(".fg-btn-secondary")!;
    await act(async () => cancel.click());
    expect(onOpenChange.mock.calls.at(-1)?.[0]).toBe(false);
  });
});

describe("ContextMenu parts", () => {
  it("opens on a right click with its items", async () => {
    const onClick = vi.fn<() => void>();
    await mount(
      h(
        ContextMenu,
        null,
        h(ContextMenuTrigger, { className: "area" }, "Right click here"),
        h(
          ContextMenuContent,
          null,
          h(ContextMenuLabel, null, "Actions"),
          h(ContextMenuItem, { onClick }, "Back", h(ContextMenuShortcut, null, "⌘[")),
          h(ContextMenuSeparator),
          h(ContextMenuItem, { variant: "destructive" }, "Delete"),
        ),
      ),
    );
    const area = host!.querySelector(".area")!;
    await act(async () => {
      area.dispatchEvent(
        new MouseEvent("contextmenu", {
          bubbles: true,
          cancelable: true,
          clientX: 10,
          clientY: 10,
        }),
      );
    });
    const items = [...document.querySelectorAll('[role="menuitem"]')];
    expect(items.map((i) => i.textContent)).toEqual(["Back⌘[", "Delete"]);
    expect(items[1]!.className).toContain("fg-pop-danger");
    expect(document.querySelector(".fg-pop-heading")?.textContent).toBe("Actions");
    await act(async () => (items[0] as HTMLElement).click());
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("keeps the props-driven menu when given items", () => {
    const out = html(
      h(ContextMenu, {
        items: [{ id: "a", label: "A" }],
        onSelect: () => {},
        children: "Area",
      }),
    );
    expect(out).toContain("Area");
  });
});
