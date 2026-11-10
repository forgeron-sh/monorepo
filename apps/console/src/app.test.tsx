// @vitest-environment jsdom
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { App } from "./app";
import { setThemePreference } from "./shell/theme";
import { cleanup, click, fakeApi, flush, mount, NOW, refusal, type } from "./test-utils";
import { loadWorkspace } from "./workspace";

// A page is a lazy import: under a loaded machine it takes longer than the default second.
const waitFor = (check: () => void) => vi.waitFor(check, { timeout: 4000 });

beforeEach(() => {
  window.scrollTo = () => {};
});

afterEach(async () => {
  await cleanup();
  window.history.replaceState(null, "", "/");
  delete document.documentElement.dataset.theme;
  setThemePreference("system");
});

const workspace = (roles: string[] = ["admin"]) => ({
  workspace: "demo",
  endpoint: "https://demo.example.test",
  person: { id: "m1", email: "ada@acme.fr", name: "ada", roles, admin: roles.includes("admin") },
  setup: { members: 1, invitations: 0, tools: 0, deployed: 0, called: false },
  signIn: {
    email: { enabled: true, mail: "email" },
    oidc: { enabled: false, configured: false },
    saml: { enabled: false, configured: false },
  },
  install: { baseDomain: "example.test" },
});
const routes = (roles?: string[]) => ({
  "/api/workspace": workspace(roles),
  "/api/approvals": {
    versions: [
      {
        tool: "crm",
        id: "v",
        version: "1",
        approvals: [{ id: "a", resource: "resources.network", kind: "resource.added" }],
      },
    ],
  },
  "/api/tools": { tools: [] },
  "/api/members": { members: [], invitations: [], settings: { domains: [] } },
  "/api/audit": { entries: [] },
  "/api/identity-provider": { provider: null },
});

describe("workspace loader", () => {
  it("keeps what the shell draws", async () => {
    const info = await loadWorkspace(async () => ({ ...workspace(), extra: "dropped" }));
    expect(info.person.admin).toBe(true);
    expect(info.signIn?.email.mail).toBe("email");
    expect(JSON.stringify(info)).not.toContain("dropped");
  });
});

describe("App", () => {
  beforeEach(() => window.history.replaceState(null, "", "/"));

  it("draws the workspace switcher, the grouped navigation and the person menu", async () => {
    const { api } = fakeApi(routes());
    const page = await mount(<App api={api} now={() => NOW} />);
    const side = page.querySelector(".fg-shell-side")!;
    const switcher = side.querySelector<HTMLButtonElement>('button[aria-label="Workspace"]')!;
    expect(switcher.textContent).toContain("demo");
    expect(side.textContent).not.toContain("forgeron");
    expect([...side.querySelectorAll("nav a")].map((a) => a.textContent)).toEqual([
      "Home",
      "Tools",
      "Members",
      "Approvals1",
      "Audit log",
      "Settings",
    ]);
    expect(side.querySelector(".fg-nav-heading")?.textContent).toBe("Administration");
    expect(side.querySelector('[aria-current="page"]')?.textContent).toBe("Home");
    const person = side.querySelector<HTMLButtonElement>('button[aria-label="Your account"]')!;
    expect(person.textContent).toContain("ada");
    expect(side.querySelector('a[href="/auth/logout"]')).toBeNull();
  });

  it("opens the workspace menu with settings and invite for an admin only", async () => {
    const { api } = fakeApi(routes());
    const page = await mount(<App api={api} now={() => NOW} />);
    await click(page.querySelector('button[aria-label="Workspace"]'));
    const items = [
      ...page.querySelectorAll('[role="menu"] [role="menuitem"], [role="menuitemradio"]'),
    ];
    expect(items.map((i) => i.textContent)).toEqual([
      "demo✓",
      "Workspace settings",
      "Invite people",
    ]);
    await cleanup();
    const member = fakeApi(routes(["developer"]));
    const other = await mount(<App api={member.api} now={() => NOW} />);
    await click(other.querySelector('button[aria-label="Workspace"]'));
    expect(
      [...other.querySelectorAll('[role="menu"] [role^="menuitem"]')].map((i) => i.textContent),
    ).toEqual(["demo✓"]);
  });

  it("opens the person menu with the theme, documentation and sign out, and applies the theme", async () => {
    const { api } = fakeApi(routes());
    const page = await mount(<App api={api} now={() => NOW} />);
    await click(page.querySelector('button[aria-label="Your account"]'));
    const menu = page.querySelector('[role="menu"]')!;
    expect([...menu.querySelectorAll('[role="menuitemradio"]')].map((i) => i.textContent)).toEqual([
      "System✓",
      "Forge (dark)",
      "Atelier (light)",
    ]);
    expect(menu.querySelector('a[href="/auth/logout"]')?.textContent).toBe("Sign out");
    expect(menu.textContent).toContain("Documentation");
    await click(
      [...menu.querySelectorAll("button")].find((b) => b.textContent === "Atelier (light)"),
    );
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(window.localStorage.getItem("forgeron-theme")).toBe("atelier");
  });

  it("goes with `g` then a letter, and opens the search with `/`", async () => {
    const { api } = fakeApi(routes());
    const page = await mount(<App api={api} now={() => NOW} />);
    const press = (key: string) =>
      act(async () => {
        window.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
      });
    await press("g");
    await press("m");
    await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("Members"));
    expect(window.location.pathname).toBe("/members");
    await press("m");
    expect(window.location.pathname).toBe("/members");
    await press("/");
    const dialog = document.querySelector('[role="dialog"]')!;
    expect(dialog).toBeTruthy();
    const input = dialog.querySelector("input")!;
    await type(input, "domains");
    expect([...dialog.querySelectorAll("a")].map((a) => a.textContent)).toEqual([
      "DomainsSettings · Workspace",
    ]);
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }));
    });
    expect(window.location.pathname).toBe("/settings/domains");
  });

  it("does not take the shortcuts while typing in a field", async () => {
    window.history.replaceState(null, "", "/settings/domains");
    const { api } = fakeApi(routes());
    const page = await mount(<App api={api} now={() => NOW} />);
    await waitFor(() => expect(page.querySelector("form")).toBeTruthy());
    const input = page.querySelector("input")!;
    await act(async () => {
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "g", bubbles: true }));
      input.dispatchEvent(new KeyboardEvent("keydown", { key: "t", bubbles: true }));
    });
    expect(window.location.pathname).toBe("/settings/domains");
  });

  describe("the settings area", () => {
    it("has its own sidebar, a way back, and every group for an admin", async () => {
      window.history.replaceState(null, "", "/settings/profile");
      const { api } = fakeApi(routes());
      const page = await mount(<App api={api} now={() => NOW} />);
      const side = page.querySelector(".fg-shell-side")!;
      await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("Profile"));
      expect(side.querySelector('a[href="/"]')?.textContent).toBe("Back to app");
      expect([...side.querySelectorAll(".fg-nav-heading")].map((h) => h.textContent)).toEqual([
        "Account",
        "Workspace",
        "Administration",
      ]);
      expect([...side.querySelectorAll("nav a")].map((a) => a.textContent)).toEqual([
        "Back to app",
        "Profile",
        "Preferences",
        "Security",
        "Connected accounts",
        "Personal secrets",
        "General",
        "Members",
        "Roles and access",
        "Sign-in",
        "Domains",
        "Audit log",
        "Approvals",
        "Usage and seats",
        "Sealing key",
        "Install information",
      ]);
      expect(side.querySelector('[aria-current="page"]')?.textContent).toBe("Profile");
    });

    it("shows a member the Account group only, and refuses a workspace page", async () => {
      window.history.replaceState(null, "", "/settings/profile");
      const { api } = fakeApi(routes(["developer"]));
      const page = await mount(<App api={api} now={() => NOW} />);
      await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("Profile"));
      expect(
        [...page.querySelectorAll(".fg-shell-side .fg-nav-heading")].map((h) => h.textContent),
      ).toEqual(["Account"]);
      await cleanup();
      window.history.replaceState(null, "", "/settings/members");
      const denied = await mount(<App api={api} now={() => NOW} />);
      expect(denied.textContent).toContain("This page is for admins.");
    });

    it("opens the first page from /settings", async () => {
      window.history.replaceState(null, "", "/settings");
      const { api } = fakeApi(routes());
      const page = await mount(<App api={api} now={() => NOW} />);
      await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("Profile"));
      expect(window.location.pathname).toBe("/settings/profile");
    });

    it("opens the invite dialog from the workspace menu", async () => {
      const { api } = fakeApi(routes());
      const page = await mount(<App api={api} now={() => NOW} />);
      await click(page.querySelector('button[aria-label="Workspace"]'));
      await click(page.querySelector('a[href="/settings/members?invite"]'));
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeTruthy());
      expect(window.location.pathname).toBe("/settings/members");
    });

    it("draws rows with a control, and the pages that have no data yet say so", async () => {
      window.history.replaceState(null, "", "/settings/preferences");
      const { api } = fakeApi(routes());
      const page = await mount(<App api={api} now={() => NOW} />);
      await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("Preferences"));
      expect(page.querySelector(".fg-srow select")).toBeTruthy();
      await click(
        [...page.querySelectorAll("nav a")].find((a) => a.textContent === "Connected accounts"),
      );
      await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("Connected accounts"));
      expect(page.textContent).toContain("Nothing to show yet");
    });

    it("tells the workspace, its roles and its usage from the platform's answers", async () => {
      window.history.replaceState(null, "", "/settings/workspace");
      const { api } = fakeApi({
        ...routes(),
        "/api/members": {
          members: [{ id: "m1", email: "ada@acme.fr", name: "ada", roles: ["admin"] }],
          invitations: [],
          settings: { domains: [], defaultRole: "", source: "install" },
        },
        "/api/tools": { tools: [] },
      });
      const page = await mount(<App api={api} now={() => NOW} />);
      await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("General"));
      expect(page.textContent).toContain("https://demo.example.test");
      expect(page.querySelector(".fg-sgroup-danger")).toBeTruthy();
      await click(
        [...page.querySelectorAll("nav a")].find((a) => a.textContent === "Roles and access"),
      );
      await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("Roles and access"));
      await waitFor(() => expect(page.textContent).toContain("1 member"));
      await click(
        [...page.querySelectorAll("nav a")].find((a) => a.textContent === "Usage and seats"),
      );
      await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("Usage and seats"));
      expect(page.textContent).toContain("Pending invitations");
    });
  });

  it("routes with the History API, moves focus to the content, and follows back", async () => {
    const { api } = fakeApi(routes());
    const page = await mount(<App api={api} now={() => NOW} />);
    const link = [...page.querySelectorAll("nav a")].find((a) => a.textContent === "Members");
    await click(link);
    await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("Members"));
    expect(window.location.pathname).toBe("/members");
    expect(page.querySelector('[aria-current="page"]')?.textContent).toBe("Members");
    expect(document.activeElement?.id).toBe("content");
    window.history.pushState(null, "", "/tools");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("Tools"));
  });

  it("opens a deep link, and says so for an unknown path", async () => {
    window.history.replaceState(null, "", "/audit");
    const { api } = fakeApi(routes());
    const page = await mount(<App api={api} now={() => NOW} />);
    await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("Audit log"));
    await cleanup();
    window.history.replaceState(null, "", "/nope");
    const lost = await mount(<App api={api} now={() => NOW} />);
    expect(lost.textContent).toContain("This page does not exist.");
  });

  it("shows a member only what they may use", async () => {
    window.history.replaceState(null, "", "/members");
    const { api, reads } = fakeApi(routes(["developer"]));
    const page = await mount(<App api={api} now={() => NOW} />);
    expect([...page.querySelectorAll("nav a")].map((a) => a.textContent)).toEqual([
      "Home",
      "Tools",
      "Settings",
    ]);
    expect(page.textContent).toContain("This page is for admins.");
    expect(reads).not.toContain("/api/approvals");
  });

  it("offers to sign in when there is no session", async () => {
    const { api } = fakeApi({
      "/api/workspace": () => {
        throw refusal(401);
      },
    });
    const page = await mount(<App api={api} now={() => NOW} />);
    expect(page.textContent).toContain("Sign in to continue");
    expect(page.querySelector('a[href="/auth/login"]')).toBeTruthy();
  });

  it("says what happened, and retries, when the workspace does not answer", async () => {
    let up = false;
    const { api } = fakeApi({
      "/api/workspace": () => {
        if (!up) throw refusal(500);
        return workspace();
      },
    });
    const page = await mount(<App api={api} now={() => NOW} />);
    expect(page.textContent).toContain("The console could not load");
    up = true;
    await click([...page.querySelectorAll("button")].find((b) => b.textContent === "Try again"));
    await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("Home"));
  });

  it("opens the menu on a phone and closes it when moving or pressing Escape", async () => {
    const { api } = fakeApi(routes());
    const page = await mount(<App api={api} now={() => NOW} />);
    const menu = () => page.querySelector<HTMLButtonElement>(".fg-topbar button")!;
    await click(menu());
    expect(page.querySelector(".fg-shell-open")).toBeTruthy();
    expect(menu().getAttribute("aria-expanded")).toBe("true");
    await click([...page.querySelectorAll("nav a")].find((a) => a.textContent === "Tools"));
    expect(page.querySelector(".fg-shell-open")).toBeNull();
    await click(menu());
    await Promise.resolve(window.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape" })));
    await flush();
    expect(page.querySelector(".fg-shell-open")).toBeNull();
  });

  it("follows the system colour scheme: Atelier when light, Forge by default", async () => {
    let light = true;
    const listeners = new Set<() => void>();
    window.matchMedia = ((query: string) => ({
      get matches() {
        return light && query.includes("light");
      },
      addEventListener: (_: string, l: () => void) => listeners.add(l),
      removeEventListener: (_: string, l: () => void) => listeners.delete(l),
    })) as never;
    const { api } = fakeApi(routes());
    await mount(<App api={api} now={() => NOW} />);
    expect(document.documentElement.dataset.theme).toBe("light");
    light = false;
    listeners.forEach((l) => l());
    expect(document.documentElement.dataset.theme).toBeUndefined();
  });
});
