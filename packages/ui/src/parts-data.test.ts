// @vitest-environment jsdom
import { act, createElement as h, type ReactElement } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandLine,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  Eyebrow,
  Label,
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./index";

// The markup these cases pin, without the shadcn `data-slot` names (data-slot.test.ts checks them).
const html = (...args: Parameters<typeof renderToStaticMarkup>) =>
  renderToStaticMarkup(...args).replace(/ data-slot="[^"]*"/g, "");

// shadcn's Table, Label and Command parts next to the props-driven Table (D-156).

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

describe("Table parts", () => {
  it("draws the composed table, as the shadcn example writes it", () => {
    const out = html(
      h(
        Table,
        null,
        h(TableCaption, null, "A list of invoices."),
        h(TableHeader, null, h(TableRow, null, h(TableHead, null, "Invoice"))),
        h(TableBody, null, h(TableRow, null, h(TableCell, null, "INV001"))),
        h(TableFooter, null, h(TableRow, null, h(TableCell, null, "Total"))),
      ),
    );
    expect(out).toContain('class="fg-table-wrap"');
    expect(out).toContain('<table class="fg-table">');
    expect(out).toContain("<caption");
    expect(out).toContain('<thead class="fg-table-header">');
    expect(out).toContain('<th class="fg-table-head">Invoice</th>');
    expect(out).toContain('<td class="fg-table-cell">INV001</td>');
    expect(out).toContain("<tfoot");
  });

  it("merges className on the table and on its frame", () => {
    const out = html(h(Table, { className: "w-full", containerClassName: "mine" }));
    expect(out).toContain('class="fg-table-wrap mine"');
    expect(out).toContain('class="fg-table w-full"');
  });

  it("keeps the data table when given columns", () => {
    const out = html(
      h(Table<{ id: string }>, {
        columns: [{ key: "id", header: "Number" }],
        rows: [{ id: "A1" }],
        rowKey: (r) => r.id,
      }),
    );
    expect(out).toContain('scope="col"');
    expect(out).toContain("A1");
  });
});

describe("Label and Eyebrow", () => {
  it("draws shadcn's label for a control", () => {
    const out = html(h(Label, { htmlFor: "email", className: "mine" }, "Email"));
    expect(out).toBe('<label for="email" class="fg-field-label mine">Email</label>');
  });
  it("keeps the eyebrow and the command line under their new names", () => {
    expect(html(h(Eyebrow, null, "Version"))).toContain("fg-label-eyebrow");
    expect(html(h(CommandLine, null, "npx forgeron init"))).toContain('class="fg-cmd"');
  });
});

const palette = (onSelect: (value: string) => void) =>
  h(
    Command,
    null,
    h(CommandInput, { placeholder: "Type a command…" }),
    h(
      CommandList,
      null,
      h(CommandEmpty, null, "No results found."),
      h(
        CommandGroup,
        { heading: "Suggestions" },
        h(CommandItem, { onSelect }, "Calendar"),
        h(CommandItem, { onSelect, keywords: ["emoji"] }, "Search Emoji"),
        h(CommandItem, { onSelect, disabled: true }, "Calculator"),
      ),
      h(CommandSeparator, null),
      h(
        CommandGroup,
        { heading: "Settings" },
        h(CommandItem, { onSelect, value: "profile" }, "Profile", h(CommandShortcut, null, "⌘P")),
      ),
    ),
  );

const rows = (root: HTMLElement) =>
  [...root.querySelectorAll('[role="option"]')].map((n) => n.textContent);
const type = async (input: HTMLInputElement, value: string) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!;
  await act(async () => {
    set.call(input, value);
    input.dispatchEvent(new Event("input", { bubbles: true }));
  });
};
const key = async (el: HTMLElement, name: string) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true }));
  });

describe("Command parts", () => {
  it("highlights the first enabled row and filters while typing", async () => {
    const root = await mount(palette(() => {}));
    expect(rows(root)).toEqual(["Calendar", "Search Emoji", "Calculator", "Profile⌘P"]);
    const input = root.querySelector("input")!;
    expect(input.getAttribute("role")).toBe("combobox");
    expect(root.querySelector("[data-highlighted]")?.textContent).toBe("Calendar");
    expect(input.getAttribute("aria-activedescendant")).toBe(
      root.querySelector("[data-highlighted]")!.id,
    );
    await type(input, "emoji");
    expect(rows(root)).toEqual(["Search Emoji"]);
    expect(root.querySelector("[data-highlighted]")?.textContent).toBe("Search Emoji");
    expect(root.querySelector('[role="separator"]')).toBeNull();
    await type(input, "zzz");
    expect(rows(root)).toEqual([]);
    expect(root.textContent).toContain("No results found.");
  });

  it("moves with the arrows, skips disabled rows and runs on Enter", async () => {
    const onSelect = vi.fn<(value: string) => void>();
    const root = await mount(palette(onSelect));
    const input = root.querySelector("input")!;
    await key(input, "ArrowDown");
    expect(root.querySelector("[data-highlighted]")?.textContent).toBe("Search Emoji");
    await key(input, "ArrowDown");
    expect(root.querySelector("[data-highlighted]")?.textContent).toContain("Profile");
    await key(input, "ArrowDown");
    expect(root.querySelector("[data-highlighted]")?.textContent).toBe("Calendar");
    await key(input, "ArrowUp");
    await key(input, "Enter");
    expect(onSelect).toHaveBeenCalledWith("profile");
  });

  it("runs a row on click, but not a disabled one", async () => {
    const onSelect = vi.fn<(value: string) => void>();
    const root = await mount(palette(onSelect));
    const [calendar, , calculator] = root.querySelectorAll<HTMLElement>('[role="option"]');
    await act(async () => calculator!.click());
    expect(onSelect).not.toHaveBeenCalled();
    await act(async () => calendar!.click());
    expect(onSelect).toHaveBeenCalledWith("Calendar");
  });

  it("opens in a dialog", async () => {
    await mount(
      h(
        CommandDialog,
        { open: true, onOpenChange: () => {} },
        h(
          Command,
          null,
          h(CommandInput, { placeholder: "Search" }),
          h(CommandList, null, h(CommandItem, null, "Calendar")),
        ),
      ),
    );
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog.className).toContain("fg-cmd-dialog");
    expect(dialog.querySelector(".fg-dialog-x")).toBeNull();
    expect(dialog.querySelector('[role="option"]')?.textContent).toBe("Calendar");
  });
});
