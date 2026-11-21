// @vitest-environment jsdom
import { InboxIcon, Tick01Icon } from "@forgeron/icons";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AppSidebar,
  AppSidebarFold,
  AppSidebarFooter,
  AppSidebarHeader,
  AppSidebarItem,
  AppSidebarLink,
  AppSidebarMenu,
  AppSidebarNav,
  AppSidebarSection,
  AppSidebarSwitcher,
  InboxList,
  InboxListPreview,
  InboxListRow,
  InboxListTime,
  InboxListTitle,
  InboxListWho,
  type InboxItem,
} from "./navigation";

// The markup these cases pin, without the shadcn `data-slot` names (data-slot.test.ts checks them).
const html = (...args: Parameters<typeof renderToStaticMarkup>) =>
  renderToStaticMarkup(...args).replace(/ data-slot="[^"]*"/g, "");

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
const roots: Array<ReturnType<typeof createRoot>> = [];
// Unmount, not only remove: a portalled popup left open keeps its focus trap on the body and
// takes the focus of the next test.
afterEach(async () => {
  await act(async () => {
    for (const root of roots.splice(0)) root.unmount();
  });
  host?.remove();
  host = undefined;
  document.body.innerHTML = "";
});
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  roots.push(root);
  await act(async () => root.render(element));
  return host;
};
const key = async (target: Element, k: string) =>
  act(async () => {
    target.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
  });

describe("AppSidebar", () => {
  const markup = html(
    h(AppSidebar, {
      app: { name: "Tasks", icon: Tick01Icon },
      current: "#/team/OPS/issues",
      items: [
        { href: "#/inbox", label: "Inbox", icon: InboxIcon, count: 4 },
        { href: "#/my", label: "My issues" },
      ],
      sections: [
        {
          label: "Your teams",
          items: [
            {
              label: "Operations",
              initial: "O",
              items: [{ href: "#/team/OPS/issues", label: "Issues" }],
            },
            {
              label: "Sales",
              initial: "S",
              defaultOpen: false,
              items: [{ href: "#/team/SAL/issues", label: "Issues" }],
            },
          ],
        },
      ],
    }),
  );
  it("is a labelled navigation landmark with the current page marked", () => {
    expect(markup).toContain(
      '<nav aria-label="Tasks navigation" class="fg-sidebar-body fg-aside-nav">',
    );
    expect(markup).toMatch(/href="#\/team\/OPS\/issues" aria-current="page"/);
    expect(markup.match(/aria-current/g)).toHaveLength(1);
  });
  it("shows the count and folds sections and teams", () => {
    expect(markup).toContain('<span class="fg-aside-badge">4</span>');
    expect(markup).toContain('aria-expanded="false"');
    expect(markup).toContain("Your teams");
    expect(markup).toContain(">O</span>");
  });
  it("folds a section on its heading", async () => {
    const el = await mount(
      h(AppSidebar, {
        app: { name: "Tasks", icon: Tick01Icon },
        items: [],
        sections: [{ label: "Workspace", items: [{ href: "#/projects", label: "Projects" }] }],
      }),
    );
    const heading = el.querySelector<HTMLButtonElement>(".fg-aside-h")!;
    const list = document.getElementById(heading.getAttribute("aria-controls")!)!;
    expect(list.hidden).toBe(false);
    await act(async () => heading.click());
    expect(heading.getAttribute("aria-expanded")).toBe("false");
    expect(list.hidden).toBe(true);
  });
  it("hands clicks to onNavigate", async () => {
    const onNavigate = vi.fn<(href: string, e: { preventDefault: () => void }) => void>((_, e) =>
      e.preventDefault(),
    );
    const el = await mount(
      h(AppSidebar, {
        app: { name: "Tasks", icon: Tick01Icon },
        items: [{ href: "#/my", label: "My issues" }],
        onNavigate,
      }),
    );
    await act(async () => el.querySelector<HTMLAnchorElement>(".fg-aside-item")!.click());
    expect(onNavigate.mock.calls[0]![0]).toBe("#/my");
  });
});

describe("InboxList", () => {
  const items: InboxItem[] = [
    {
      id: "n1",
      reference: "OPS-40",
      title: "Supplier invoices arrive twice from Odoo",
      preview: "Hugo Bernard commented: “Odoo sends the webhook twice…”",
      time: "2h",
      unread: true,
      person: "Hugo Bernard",
    },
    {
      id: "n2",
      reference: "OPS-31",
      title: "Supplier portal: sign-in with an expired invite",
      preview: "Léa Martin mentioned you",
      time: "4h",
    },
  ];
  it("marks unread rows and the selected one", () => {
    const out = html(h(InboxList, { items, selectedId: "n2", onSelect: () => {} }));
    expect(out).toContain('role="listbox"');
    expect(out).toContain("fg-inbox-row fg-inbox-unread");
    expect(out).toContain("fg-led-accent");
    expect(out.match(/aria-selected="true"/g)).toHaveLength(1);
    expect(out).toContain("OPS-31</span>Supplier portal");
  });
  it("selects with the arrows and j / k", async () => {
    const onSelect = vi.fn<(id: string) => void>();
    const el = await mount(h(InboxList, { items, selectedId: "n1", onSelect }));
    const list = el.querySelector("[role=listbox]")!;
    expect(list.getAttribute("aria-activedescendant")).toMatch(/n1$/);
    await key(list, "ArrowDown");
    expect(onSelect).toHaveBeenLastCalledWith("n2");
    // Controlled: the selection stays on n1 until the caller moves it.
    await key(list, "j");
    expect(onSelect).toHaveBeenCalledTimes(2);
    await key(list, "ArrowUp");
    await key(list, "k");
    expect(onSelect).toHaveBeenCalledTimes(2);
  });
  it("shows the empty text when there is nothing", () => {
    expect(html(h(InboxList, { items: [], onSelect: () => {}, empty: "All read" }))).toContain(
      "All read",
    );
  });
});

describe("navigation parts", () => {
  const markup = renderToStaticMarkup(
    h(
      AppSidebar,
      { current: "#/inbox", className: "mine" },
      h(
        AppSidebarHeader,
        null,
        h(AppSidebarSwitcher, { app: { name: "Tasks", icon: Tick01Icon } }),
      ),
      h(
        AppSidebarNav,
        { "aria-label": "Tasks navigation" },
        h(
          AppSidebarMenu,
          null,
          h(
            AppSidebarItem,
            null,
            h(AppSidebarLink, { href: "#/inbox", icon: InboxIcon, count: 3 }, "Inbox"),
          ),
        ),
        h(
          AppSidebarSection,
          { label: "Teams" },
          h(
            AppSidebarMenu,
            null,
            h(
              AppSidebarItem,
              null,
              h(
                AppSidebarFold,
                { label: "Ops", initial: "O" },
                h(AppSidebarLink, { href: "#/ops", nested: true }, "Issues"),
              ),
            ),
          ),
        ),
      ),
      h(AppSidebarFooter, null, "Help"),
    ),
  );
  it("names every part and keeps the classes of the preset", () => {
    for (const slot of [
      "app-sidebar",
      "app-sidebar-header",
      "app-sidebar-switcher",
      "app-sidebar-nav",
      "app-sidebar-menu",
      "app-sidebar-item",
      "app-sidebar-link",
      "app-sidebar-section",
      "app-sidebar-fold",
      "app-sidebar-footer",
    ])
      expect(markup).toContain(`data-slot="${slot}"`);
    expect(markup).toContain('class="fg-sidebar fg-aside mine"');
    expect(markup).toContain("fg-sidebar-body fg-aside-nav");
  });
  it("marks the link of the current page from the root", () => {
    expect(markup.match(/aria-current="page"/g)).toHaveLength(1);
    expect(markup).toMatch(/href="#\/inbox" aria-current="page"/);
  });
  it("tells the clicks of the links to the root's onNavigate", async () => {
    const onNavigate = vi.fn<(href: string) => void>();
    const el = await mount(
      h(
        AppSidebar,
        { onNavigate: (href: string, event) => (event.preventDefault(), onNavigate(href)) },
        h(AppSidebarLink, { href: "#/x" }, "X"),
      ),
    );
    await act(async () => el.querySelector<HTMLElement>("a")!.click());
    expect(onNavigate).toHaveBeenCalledWith("#/x");
  });
  it("composes the rows of an InboxList", () => {
    const items: InboxItem[] = [{ id: "a", title: "T", preview: "P", time: "2h", unread: true }];
    const out = renderToStaticMarkup(
      h(
        InboxList,
        { items, selectedId: "a", onSelect: () => {}, className: "mine" },
        h(
          InboxListRow,
          { id: "a", unread: true, className: "row" },
          h(InboxListWho, { person: "Hugo Bernard" }),
          h(InboxListTitle, { reference: "OPS-1" }, "T"),
          h(InboxListTime, { unread: true }, "2h"),
          h(InboxListPreview, null, "P"),
        ),
      ),
    );
    expect(out).toContain('data-slot="inbox-list"');
    expect(out).toContain('data-slot="inbox-list-row"');
    expect(out).toContain("fg-inbox-row fg-inbox-unread row");
    expect(out).toContain('class="fg-inbox mine"');
    expect(out).toContain("fg-led-accent");
  });
});
