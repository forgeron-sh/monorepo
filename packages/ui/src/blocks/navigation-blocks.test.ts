// @vitest-environment jsdom
import { InboxIcon, Tick01Icon } from "@forgeron/icons";
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppSidebar, InboxList, type InboxItem } from "./navigation";

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
    expect(markup).toContain('<nav class="fg-aside-nav" aria-label="Tasks navigation">');
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
