// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Avatar, Menu, Nav, SettingsGroup, SettingsRow, type MenuEntry } from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
let mounted: ReturnType<typeof createRoot> | undefined;
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  mounted = root;
  await act(async () => root.render(element));
  return host;
};
afterEach(async () => {
  await act(async () => mounted?.unmount());
  mounted = undefined;
  host?.remove();
  host = undefined;
});
const key = (el: Element, k: string) =>
  act(async () => {
    el.dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true }));
  });

const settle = (ms = 50) => act(async () => new Promise((r) => setTimeout(r, ms)));

describe("Menu", () => {
  const entries = (spy = vi.fn<(arg?: string) => void>()): MenuEntry[] => [
    { kind: "heading", label: "Theme" },
    { kind: "radio", label: "System", checked: false, onSelect: () => spy("system") },
    { kind: "radio", label: "Forge", checked: true, onSelect: () => spy("forge") },
    { kind: "separator" },
    { kind: "link", label: "Documentation", href: "/docs", onSelect: spy },
    { kind: "action", label: "Sign out", tone: "danger", onSelect: () => spy("out") },
  ];
  // The menu is Base UI's, drawn in a portal: query the document, not the host.
  const menu = () => document.querySelector('[role="menu"]');
  const open = async (spy = vi.fn<(arg?: string) => void>()) => {
    const page = await mount(
      h(Menu, { trigger: "demo", label: "Workspace", entries: entries(spy) }),
    );
    const button = page.querySelector("button")!;
    await act(async () => button.click());
    await settle(300);
    return { page, button, spy };
  };

  it("opens on click, names the roles and focuses the checked choice", async () => {
    const { button } = await open();
    expect(button.getAttribute("aria-expanded")).toBe("true");
    expect(button.getAttribute("aria-haspopup")).toBe("menu");
    expect(menu()!.getAttribute("aria-label")).toBe("Workspace");
    expect(menu()!.querySelectorAll('[role="menuitemradio"]')).toHaveLength(2);
    expect(document.activeElement?.textContent).toContain("Forge");
    expect(document.activeElement?.getAttribute("aria-checked")).toBe("true");
  });

  it("moves with the arrows and closes on Escape", async () => {
    const { button } = await open();
    await key(document.activeElement!, "ArrowDown");
    expect(document.activeElement?.textContent).toBe("Documentation");
    await key(document.activeElement!, "End");
    expect(document.activeElement?.textContent).toBe("Sign out");
    await key(document.activeElement!, "Escape");
    await settle();
    expect(menu()).toBeNull();
    expect(button.getAttribute("aria-expanded")).toBe("false");
  });

  it("runs the choice, closes, and routes a plain link click through onSelect", async () => {
    const { page, spy } = await open();
    const radios = document.querySelectorAll<HTMLElement>('[role="menuitemradio"]');
    await act(async () => radios[0]!.click());
    expect(spy).toHaveBeenCalledWith("system");
    await settle();
    expect(menu()).toBeNull();
    await act(async () => page.querySelector("button")!.click());
    const link = document.querySelector<HTMLAnchorElement>('a[role="menuitem"]')!;
    expect(link.getAttribute("href")).toBe("/docs");
    await act(async () => link.click());
    expect(spy).toHaveBeenCalledWith("/docs");
  });

  it("writes a danger action in the danger tone and runs it", async () => {
    const { spy } = await open();
    const out = [...document.querySelectorAll<HTMLElement>('[role="menuitem"]')].find(
      (i) => i.textContent === "Sign out",
    )!;
    expect(out.className).toContain("fg-pop-danger");
    await act(async () => out.click());
    expect(spy).toHaveBeenCalledWith("out");
    await settle();
    expect(menu()).toBeNull();
  });

  it("closes on a click outside", async () => {
    await open();
    await act(async () => {
      document.body.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
      document.body.dispatchEvent(new MouseEvent("mousedown", { bubbles: true }));
      document.body.click();
    });
    await settle();
    expect(menu()).toBeNull();
  });

  it("opens with the Down arrow from the button", async () => {
    const page = await mount(h(Menu, { trigger: "x", label: "M", entries: entries() }));
    await key(page.querySelector("button")!, "ArrowDown");
    expect(menu()).toBeTruthy();
  });
});

describe("Avatar", () => {
  it("draws initials from a name or an email, hidden from assistive technology", async () => {
    const page = await mount(
      h(
        "div",
        null,
        h(Avatar, { name: "Ada Lovelace" }),
        h(Avatar, { name: "grace.hopper@acme.fr" }),
        h(Avatar, { name: "ada" }),
      ),
    );
    expect([...page.querySelectorAll(".fg-avatar")].map((a) => a.textContent)).toEqual([
      "AL",
      "GH",
      "AD",
    ]);
    expect(page.querySelector(".fg-avatar")!.getAttribute("aria-hidden")).toBe("true");
  });
});

describe("SettingsGroup and SettingsRow", () => {
  it("draws a titled card of rows, a control on the right and a chevron on a link row", async () => {
    const go = vi.fn<(href: string, event: unknown) => void>();
    const page = await mount(
      h(
        SettingsGroup,
        { title: "Workspace", description: "Shared by everyone." },
        h(
          SettingsRow,
          { label: "Name", description: "Shown in the switcher." },
          h("button", null, "Edit"),
        ),
        h(SettingsRow, { label: "Members", href: "/settings/members", value: "4", onNavigate: go }),
      ),
    );
    expect(page.querySelector("h2")?.textContent).toBe("Workspace");
    const rows = page.querySelectorAll(".fg-srow");
    expect(rows[0]!.querySelector(".fg-srow-control button")).toBeTruthy();
    const link = rows[1] as HTMLAnchorElement;
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("href")).toBe("/settings/members");
    expect(link.querySelector("svg")).toBeTruthy();
    await act(async () => link.click());
    expect(go).toHaveBeenCalledWith("/settings/members", expect.anything());
  });
  it("marks a danger zone", async () => {
    const page = await mount(h(SettingsGroup, { title: "Danger zone", tone: "danger" }));
    expect(page.querySelector(".fg-sgroup-danger")).toBeTruthy();
  });
});

describe("Nav heading and icon", () => {
  it("writes the heading above the list and the icon before the label", async () => {
    const page = await mount(
      h(Nav, {
        label: "Account",
        heading: "Account",
        items: [{ id: "p", href: "/p", label: "Profile", icon: h("i", null) }],
      }),
    );
    expect(page.querySelector(".fg-nav-heading")?.textContent).toBe("Account");
    expect(page.querySelector(".fg-nav-icon i")).toBeTruthy();
  });
});
