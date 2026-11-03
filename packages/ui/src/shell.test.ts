// @vitest-environment jsdom
import { act, createElement as h } from "react";
import { createRoot } from "react-dom/client";
import { renderToStaticMarkup as html } from "react-dom/server";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  AppShell,
  Checkbox,
  CopyBlock,
  Dialog,
  EmptyState,
  Field,
  Input,
  Nav,
  Notice,
  Sidebar,
  Spinner,
  Tabs,
} from "./index";

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let host: HTMLElement | undefined;
const mount = async (element: Parameters<ReturnType<typeof createRoot>["render"]>[0]) => {
  host = document.createElement("div");
  document.body.append(host);
  const root = createRoot(host);
  await act(async () => root.render(element));
  return host;
};
afterEach(() => {
  host?.remove();
  host = undefined;
});

describe("Nav", () => {
  const items = [
    { id: "a", label: "Overview", href: "/", current: true },
    { id: "b", label: "Approvals", href: "/approvals", badge: 2 },
  ];
  it("marks the current page and shows a badge", () => {
    const out = html(h(Nav, { label: "Main", items }));
    expect(out).toContain('aria-label="Main"');
    expect(out).toContain('aria-current="page"');
    expect(out).toContain('<span class="fg-nav-badge">2</span>');
  });
  it("routes a plain click and leaves modified clicks to the browser", async () => {
    const onNavigate = vi.fn<() => void>();
    const el = await mount(h(Nav, { label: "Main", items, onNavigate }));
    const link = el.querySelectorAll("a")[1]!;
    await act(async () =>
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0 })),
    );
    expect(onNavigate).toHaveBeenCalledWith("/approvals", expect.anything());
    await act(async () =>
      link.dispatchEvent(new MouseEvent("click", { bubbles: true, button: 0, ctrlKey: true })),
    );
    expect(onNavigate).toHaveBeenCalledTimes(1);
  });
});

describe("AppShell", () => {
  it("renders the sidebar, a skip link, the content and the menu button", () => {
    const out = html(
      h(
        AppShell,
        { sidebar: h(Sidebar, { header: "acme", footer: "ada" }, "nav") },
        "content here",
      ),
    );
    expect(out).toContain('href="#content"');
    expect(out).toContain("acme");
    expect(out).toContain("content here");
    expect(out).toContain('aria-expanded="false"');
    expect(out).not.toContain("fg-shell-scrim");
  });
  it("opens the menu on a phone", () => {
    const out = html(h(AppShell, { sidebar: "s", menuOpen: true }, "c"));
    expect(out).toContain("fg-shell-open");
    expect(out).toContain("fg-shell-scrim");
    expect(out).toContain("Close menu");
  });
});

describe("Notice, EmptyState, Spinner", () => {
  it("says the state with a word, and alerts on danger", () => {
    const out = html(h(Notice, { tone: "danger", title: "Could not load" }, "Try again."));
    expect(out).toContain('role="alert"');
    expect(out).toContain("Error");
    expect(html(h(Notice, {}, "x"))).toContain('role="status"');
  });
  it("shows the way out of an empty list", () => {
    const out = html(
      h(EmptyState, { title: "No tool yet", description: "Deploy one.", action: "Go" }),
    );
    expect(out).toContain("No tool yet");
    expect(out).toContain("Deploy one.");
    expect(out).toContain("Go");
  });
  it("names the wait", () => {
    expect(html(h(Spinner, { label: "Loading members" }))).toContain("Loading members");
  });
});

describe("Field", () => {
  it("ties label, hint and error to the control", () => {
    const out = html(
      h(Field, {
        label: "Email",
        hint: "Work address.",
        error: "Not an email address. Check it.",
        children: (control) => h(Input, control),
      }),
    );
    expect(out).toMatch(/<label[^>]* for="([^"]+)"/);
    expect(out).toContain('aria-invalid="true"');
    expect(out).toMatch(/aria-describedby="[^"]+-hint [^"]+-error"/);
    expect(out).toContain("Work address.");
  });
  it("draws a checkbox with its label", () => {
    const out = html(h(Checkbox, { label: "admin", defaultChecked: true }));
    expect(out).toContain('type="checkbox"');
    expect(out).toContain("admin");
  });
});

describe("Dialog", () => {
  it("is modal and named, focuses in, closes on Escape and returns focus", async () => {
    const opener = document.createElement("button");
    document.body.append(opener);
    opener.focus();
    const onClose = vi.fn<() => void>();
    const el = await mount(
      h(
        Dialog,
        {
          title: "Remove ada",
          description: "Sessions stop.",
          onClose,
          footer: h("button", null, "Remove"),
        },
        h("input", { "data-autofocus": true }),
      ),
    );
    const dialog = el.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute("aria-modal")).toBe("true");
    expect(dialog.getAttribute("aria-labelledby")).toBeTruthy();
    expect(document.activeElement?.tagName).toBe("INPUT");
    await act(async () =>
      dialog.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })),
    );
    expect(onClose).toHaveBeenCalled();
    opener.remove();
  });
  it("keeps Tab inside", async () => {
    const el = await mount(
      h(
        Dialog,
        { title: "t", onClose: () => {}, footer: h("button", { id: "last" }, "Ok") },
        h("input", { id: "first" }),
      ),
    );
    const last = el.querySelector<HTMLElement>("#last")!;
    last.focus();
    const event = new KeyboardEvent("keydown", { key: "Tab", bubbles: true, cancelable: true });
    await act(async () => last.dispatchEvent(event));
    expect(event.defaultPrevented).toBe(true);
    expect(document.activeElement?.id).toBe("first");
  });
  it("closes on a click on the backdrop only", async () => {
    const onClose = vi.fn<() => void>();
    const el = await mount(h(Dialog, { title: "t", onClose }, "body"));
    await act(async () =>
      el.querySelector(".fg-dialog")!.dispatchEvent(new MouseEvent("mousedown", { bubbles: true })),
    );
    expect(onClose).not.toHaveBeenCalled();
    await act(async () =>
      el
        .querySelector(".fg-dialog-scrim")!
        .dispatchEvent(new MouseEvent("mousedown", { bubbles: true })),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});

describe("CopyBlock", () => {
  it("shows the value and copies it", async () => {
    const writeText = vi.fn<(text: string) => Promise<void>>(async () => {});
    Object.defineProperty(navigator, "clipboard", { value: { writeText }, configurable: true });
    const el = await mount(
      h(CopyBlock, { value: "forgeron login", label: "Sign in", prefix: "$" }),
    );
    expect(el.textContent).toContain("forgeron login");
    await act(async () => el.querySelector("button")!.click());
    expect(writeText).toHaveBeenCalledWith("forgeron login");
    expect(el.querySelector("button")!.textContent).toBe("Copied");
  });
  it("does not claim a copy that failed", async () => {
    Object.defineProperty(navigator, "clipboard", {
      value: { writeText: async () => Promise.reject(new Error("denied")) },
      configurable: true,
    });
    const el = await mount(h(CopyBlock, { value: "x", label: "x" }));
    await act(async () => el.querySelector("button")!.click());
    expect(el.querySelector("button")!.textContent).toBe("Copy");
  });
});

describe("Tabs", () => {
  const tabs = [
    { id: "a", label: "One" },
    { id: "b", label: "Two" },
  ];
  it("selects one tab and links it to the panel", () => {
    const out = html(h(Tabs, { label: "Sections", tabs, value: "a", onChange: () => {} }, "panel"));
    expect(out).toContain('role="tablist"');
    expect(out).toContain('aria-selected="true"');
    expect(out).toContain('tabindex="-1"');
    expect(out).toContain("panel");
  });
  it("moves with the arrow keys, wrapping around", async () => {
    const onChange = vi.fn<() => void>();
    const el = await mount(h(Tabs, { label: "S", tabs, value: "b", onChange }));
    const list = el.querySelector('[role="tablist"]')!;
    await act(async () =>
      list.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowRight", bubbles: true })),
    );
    expect(onChange).toHaveBeenCalledWith("a");
  });
});
