// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AppShell, Nav, SettingsGroup, SettingsRow, Sidebar, SplitPane } from "./index";
import {
  AppShellHeader,
  AppShellMain,
  AppShellSidebar,
  NavBadge,
  NavLabel,
  NavLink,
  NavList,
  NavListItem,
  SettingsGroupCard,
  SettingsGroupDescription,
  SettingsGroupHeader,
  SettingsGroupTitle,
  SettingsRowControl,
  SettingsRowDescription,
  SettingsRowLabel,
  SettingsRowText,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SplitPaneHandle,
  SplitPanePanel,
} from "./parts-shell";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  await act(async () => createRoot(host!).render(element));
  return host;
};
afterEach(() => {
  host?.remove();
  host = undefined;
});
const key = (el: Element, k: string, init: KeyboardEventInit = {}) =>
  act(async () => {
    el.dispatchEvent(
      new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true, ...init }),
    );
  });

describe("Sidebar parts", () => {
  it("lays the parts out as written, with className and rest", () => {
    const out = html(
      h(
        Sidebar,
        { className: "mine", "data-x": "1" } as never,
        h(SidebarHeader, { className: "h" }, "acme"),
        h(
          SidebarContent,
          null,
          h(
            SidebarGroup,
            null,
            h(SidebarGroupLabel, null, "Work"),
            h(
              SidebarMenu,
              null,
              h(SidebarMenuItem, null, h(SidebarMenuButton, { isActive: true }, "Inbox")),
            ),
          ),
        ),
        h(SidebarFooter, null, "ada"),
      ),
    );
    expect(out).toContain('class="fg-sidebar mine"');
    expect(out).toContain('data-x="1"');
    expect(out.match(/fg-sidebar-body/g)).toHaveLength(1);
    expect(out).toContain('class="fg-sidebar-head h"');
    expect(out).toContain('type="button"');
    expect(out).toContain('aria-current="page"');
  });
  it("still wraps plain children and the header and footer props", () => {
    const out = html(h(Sidebar, { header: "acme", footer: "ada" }, "nav"));
    expect(out.indexOf("fg-sidebar-head")).toBeLessThan(out.indexOf("fg-sidebar-body"));
    expect(out.indexOf("fg-sidebar-body")).toBeLessThan(out.indexOf("fg-sidebar-foot"));
  });
  it("gives its props to the link with asChild", () => {
    const out = html(
      h(
        SidebarMenuButton,
        { asChild: true, isActive: true, className: "x" },
        h("a", { href: "/a", className: "own" }, "A"),
      ),
    );
    expect(out).toBe(
      '<a href="/a" class="fg-sidebar-btn x own" aria-current="page" data-active="">A</a>',
    );
  });
  it("collapses through its provider", async () => {
    const el = await mount(
      h(
        SidebarProvider,
        null,
        h(SidebarTrigger, null),
        h(Sidebar, null, h(SidebarContent, null, "body")),
      ),
    );
    const side = el.querySelector(".fg-sidebar")!;
    const trigger = el.querySelector("button")!;
    expect(side.getAttribute("data-state")).toBe("open");
    await act(async () => trigger.click());
    expect(side.getAttribute("data-state")).toBe("collapsed");
    expect(trigger.getAttribute("aria-expanded")).toBe("false");
  });
});

describe("Nav parts", () => {
  it("builds a nav from its parts", () => {
    const out = html(
      h(
        Nav,
        { label: "Main", className: "n" },
        h(
          NavList,
          null,
          h(
            NavListItem,
            null,
            h(
              NavLink,
              { href: "/", current: true },
              h(NavLabel, null, "Home"),
              h(NavBadge, null, 2),
            ),
          ),
        ),
      ),
    );
    expect(out).toContain('aria-label="Main"');
    expect(out).toContain('class="fg-nav n"');
    expect(out).toContain('aria-current="page"');
    expect(out).toContain('<span class="fg-nav-badge">2</span>');
  });
  it("routes a plain click on a part link", async () => {
    const onNavigate = vi.fn<() => void>();
    const el = await mount(h(NavLink, { href: "/x", onNavigate }, "x"));
    await act(async () =>
      el.querySelector("a")!.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 })),
    );
    expect(onNavigate).toHaveBeenCalledWith("/x", expect.anything());
  });
});

describe("AppShell parts", () => {
  const shell = (props: Record<string, unknown> = {}) =>
    h(
      AppShell,
      props,
      h(AppShellHeader, null, "Acme"),
      h(AppShellSidebar, { className: "side" }, "nav"),
      h(AppShellMain, null, "content"),
    );
  it("renders the skip link, the header, the sidebar and the main", () => {
    const out = html(shell());
    expect(out).toContain('href="#content"');
    expect(out).toContain('aria-expanded="false"');
    expect(out).toContain('class="fg-shell-side side"');
    expect(out).toContain('id="content"');
    expect(out).not.toContain("fg-shell-scrim");
  });
  it("opens its menu by itself, and tells the caller", async () => {
    const onMenuOpenChange = vi.fn<(open: boolean) => void>();
    const el = await mount(shell({ onMenuOpenChange }));
    await act(async () => el.querySelector<HTMLButtonElement>(".fg-topbar button")!.click());
    expect(onMenuOpenChange).toHaveBeenCalledWith(true);
    expect(el.querySelector(".fg-shell-open")).not.toBeNull();
    expect(el.querySelector(".fg-shell-scrim")).not.toBeNull();
  });
  it("needs a shell around its parts", () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => html(h(AppShellMain, null, "x"))).toThrow(
      "AppShellMain must be inside an AppShell",
    );
  });
});

describe("SplitPane parts", () => {
  const pane = (props: Record<string, unknown> = {}) =>
    h(
      SplitPane,
      { defaultSize: 200, min: 100, keyStep: 10, ...props },
      h(SplitPanePanel, { className: "a" }, "a"),
      h(SplitPaneHandle, { label: "Resize" }),
      h(SplitPanePanel, { secondary: true }, "b"),
    );
  it("lays out the panels around the handle", () => {
    const out = html(pane());
    expect(out).toContain('class="fg-split-first a"');
    expect(out).toContain("fg-split-second");
    expect(out).toContain('aria-label="Resize"');
    expect(out).toContain('aria-valuenow="200"');
  });
  it("moves with the arrows, Home, and a double click, and reports the end", async () => {
    const onChange = vi.fn<(n: number) => void>();
    const onChangeEnd = vi.fn<(n: number) => void>();
    const el = await mount(pane({ onChange, onChangeEnd }));
    const bar = el.querySelector("[role=separator]")!;
    await key(bar, "ArrowRight");
    expect(bar.getAttribute("aria-valuenow")).toBe("210");
    await key(bar, "ArrowLeft", { shiftKey: true });
    expect(bar.getAttribute("aria-valuenow")).toBe("170");
    await key(bar, "Home");
    expect(bar.getAttribute("aria-valuenow")).toBe("100");
    expect(onChangeEnd).toHaveBeenLastCalledWith(100);
    await act(async () => bar.dispatchEvent(new MouseEvent("dblclick", { bubbles: true })));
    expect(bar.getAttribute("aria-valuenow")).toBe("200");
    expect(onChange).toHaveBeenCalled();
    expect(el.querySelector(".fg-split-first")!.id).toBe(bar.getAttribute("aria-controls"));
  });
});

describe("Settings parts", () => {
  it("lays a group out as written", () => {
    const out = html(
      h(
        SettingsGroup,
        { className: "g", tone: "danger" },
        h(
          SettingsGroupHeader,
          null,
          h(SettingsGroupTitle, null, "Danger"),
          h(SettingsGroupDescription, null, "Careful."),
        ),
        h(SettingsGroupCard, { className: "c" }, "rows"),
      ),
    );
    expect(out).toContain("fg-sgroup fg-sgroup-danger g");
    expect(out.match(/fg-sgroup-card/g)).toHaveLength(1);
    expect(out).toContain('<h2 class="fg-sgroup-title">Danger</h2>');
  });
  it("keeps the title and rows props", () => {
    const out = html(h(SettingsGroup, { title: "T" }, h(SettingsRow, { label: "L" }, "ctl")));
    expect(out).toContain("fg-sgroup-card");
    expect(out).toContain('<span class="fg-srow-label">L</span>');
    expect(out).toContain('<div class="fg-srow-control">ctl</div>');
  });
  it("builds a row from its parts, and a link row with asChild", () => {
    const out = html(
      h(
        SettingsRow,
        { className: "r" },
        h(
          SettingsRowText,
          null,
          h(SettingsRowLabel, null, "Name"),
          h(SettingsRowDescription, null, "d"),
        ),
        h(SettingsRowControl, null, "ctl"),
      ),
    );
    expect(out).toContain('class="fg-srow r"');
    expect(out).toContain("fg-srow-desc");
    const link = html(
      h(SettingsRow, { asChild: true }, h("a", { href: "/s" }, h(SettingsRowText, null, "x"))),
    );
    expect(link).toContain('<a href="/s" class="fg-srow">');
  });
});
