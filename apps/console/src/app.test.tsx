// @vitest-environment jsdom
import {
  BUILT_IN_TEAMS,
  expand,
  PLATFORM,
  PLATFORM_PERMISSIONS,
  type PlatformPermission,
} from "@forgeron/permissions";
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

// What the built-in teams give (D-137): the admin team holds everything, the developer team builds.
const ADMIN: readonly PlatformPermission[] = PLATFORM_PERMISSIONS;
const DEVELOPER: readonly PlatformPermission[] = PLATFORM_PERMISSIONS.filter((p) =>
  expand(PLATFORM, BUILT_IN_TEAMS.find((t) => t.id === "developer")!.permissions).has(p),
);
const NOBODY: readonly PlatformPermission[] = [];

const workspace = (permissions: readonly PlatformPermission[] = ADMIN) => ({
  workspace: "demo",
  endpoint: "https://demo.example.test",
  person: {
    id: "m1",
    email: "ada@acme.fr",
    name: "ada",
    teams: permissions === ADMIN ? ["admin"] : permissions === DEVELOPER ? ["developer"] : [],
    permissions,
  },
  setup: { members: 1, invitations: 0, tools: 0, deployed: 0, called: false },
  signIn: {
    email: { enabled: true, mail: "email" },
    oidc: { enabled: false, configured: false },
    saml: { enabled: false, configured: false },
  },
  install: { baseDomain: "example.test" },
});
const routes = (permissions?: readonly PlatformPermission[]) => ({
  "/api/workspace": workspace(permissions),
  "/api/teams": { teams: [] },
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
  "/api/library": { tools: [] },
});

describe("workspace loader", () => {
  it("keeps what the shell draws", async () => {
    const info = await loadWorkspace(async () => ({
      ...workspace(),
      person: { ...workspace().person, permissions: [...ADMIN, "tools:fly"], admin: true },
      extra: "dropped",
    }));
    expect(info.person.teams).toEqual(["admin"]);
    expect(info.person.permissions).toEqual(PLATFORM_PERMISSIONS);
    expect(info.person).not.toHaveProperty("admin");
    expect(info.person).not.toHaveProperty("roles");
    expect(info.signIn?.email.mail).toBe("email");
    expect(JSON.stringify(info)).not.toContain("dropped");
  });
});

describe("App", () => {
  beforeEach(() => window.history.replaceState(null, "", "/"));

  it("draws the workspace switcher, the grouped navigation and the person menu", async () => {
    const { api, reads } = fakeApi(routes());
    const page = await mount(<App api={api} now={() => NOW} />);
    const side = page.querySelector(".fg-shell-side")!;
    const switcher = side.querySelector<HTMLButtonElement>('button[aria-label="Workspace"]')!;
    expect(switcher.textContent).toContain("demo");
    expect(side.textContent).not.toContain("forgeron");
    expect([...side.querySelectorAll("nav a")].map((a) => a.textContent)).toEqual([
      "Home",
      "My tools",
      "Discover",
      "Tools",
      "Marketplace",
      "Members",
      "Teams",
      "Settings",
    ]);
    expect(side.querySelector(".fg-nav-heading")?.textContent).toBe("Administration");
    expect(side.querySelector('[aria-current="page"]')?.textContent).toBe("Home");
    // No screen of approvals (D-121): nothing reads them to count them.
    expect(reads).not.toContain("/api/approvals");
    const person = side.querySelector<HTMLButtonElement>('button[aria-label="Your account"]')!;
    expect(person.textContent).toContain("ada");
    expect(side.querySelector('a[href="/auth/logout"]')).toBeNull();
  });

  it("opens the workspace menu with settings and invite for those who hold the permissions", async () => {
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
    const member = fakeApi(routes(DEVELOPER));
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
    // The shortcut of Roles and access is gone; Teams has its own.
    await press("g");
    await press("r");
    expect(window.location.pathname).toBe("/");
    await press("g");
    await press("e");
    await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("Teams"));
    expect(window.location.pathname).toBe("/admin/teams");
    await press("g");
    await press("p");
    await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("Members"));
    expect(window.location.pathname).toBe("/admin/members");
    await press("m");
    expect(window.location.pathname).toBe("/admin/members");
    await press("g");
    await press("m");
    await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("My tools"));
    expect(window.location.pathname).toBe("/library");
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
        "Operations",
      ]);
      expect([...side.querySelectorAll("nav a")].map((a) => a.textContent)).toEqual([
        "Back to app",
        "Profile",
        "Preferences",
        "Security",
        "Connected accounts",
        "Personal secrets",
        "General",
        "Sign-in",
        "Domains",
        "GitHub",
        "Audit log",
        "Usage and seats",
        "Sealing key",
        "Install information",
      ]);
      expect(side.querySelector('[aria-current="page"]')?.textContent).toBe("Profile");
    });

    it("shows a member the Account group only, and refuses a workspace page", async () => {
      window.history.replaceState(null, "", "/settings/profile");
      const { api } = fakeApi(routes(DEVELOPER));
      const page = await mount(<App api={api} now={() => NOW} />);
      await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("Profile"));
      expect(
        [...page.querySelectorAll(".fg-shell-side .fg-nav-heading")].map((h) => h.textContent),
      ).toEqual(["Account"]);
      await cleanup();
      window.history.replaceState(null, "", "/settings/domains");
      const denied = await mount(<App api={api} now={() => NOW} />);
      expect(denied.textContent).toContain('This page needs the permission "See members".');
      expect(denied.textContent).toContain('Ask someone who manages teams for "See members".');
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
      await click(page.querySelector('a[href="/admin/members?invite"]'));
      await waitFor(() => expect(document.querySelector('[role="dialog"]')).toBeTruthy());
      expect(window.location.pathname).toBe("/admin/members");
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

    it("tells the workspace, its teams and its usage from the platform's answers", async () => {
      window.history.replaceState(null, "", "/settings/workspace");
      const { api } = fakeApi({
        ...routes(),
        "/api/members": {
          members: [{ id: "m1", email: "ada@acme.fr", name: "ada", teams: ["admin"] }],
          invitations: [],
          settings: { domains: [], defaultTeams: [], source: "install" },
        },
        "/api/tools": { tools: [] },
      });
      const page = await mount(<App api={api} now={() => NOW} />);
      await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("General"));
      expect(page.textContent).toContain("https://demo.example.test");
      expect(page.querySelector(".fg-sgroup-danger")).toBeTruthy();
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
    expect(window.location.pathname).toBe("/admin/members");
    expect(page.querySelector('[aria-current="page"]')?.textContent).toBe("Members");
    expect(document.activeElement?.id).toBe("content");
    window.history.pushState(null, "", "/admin/tools");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("Tools"));
  });

  it("opens a deep link, and says so for an unknown path", async () => {
    window.history.replaceState(null, "", "/settings/audit");
    const { api } = fakeApi(routes());
    const page = await mount(<App api={api} now={() => NOW} />);
    await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("Audit log"));
    await cleanup();
    window.history.replaceState(null, "", "/nope");
    const lost = await mount(<App api={api} now={() => NOW} />);
    expect(lost.textContent).toContain("This page does not exist.");
  });

  it("shows the navigation of the permissions a person holds, and guards the rest (D-137)", async () => {
    window.history.replaceState(null, "", "/admin/members");
    const { api, reads } = fakeApi(routes(DEVELOPER));
    const page = await mount(<App api={api} now={() => NOW} />);
    // A developer builds and publishes: Tools and Marketplace; Teams is read by everyone.
    expect([...page.querySelectorAll("nav a")].map((a) => a.textContent)).toEqual([
      "Home",
      "My tools",
      "Discover",
      "Tools",
      "Marketplace",
      "Teams",
      "Settings",
    ]);
    expect(page.textContent).toContain('This page needs the permission "See members".');
    expect(reads).not.toContain("/api/approvals");
    expect(reads).not.toContain("/api/members");
  });

  it("shows someone in no team their own space and the teams, read-only", async () => {
    window.history.replaceState(null, "", "/admin/tools");
    const { api } = fakeApi(routes(NOBODY));
    const page = await mount(<App api={api} now={() => NOW} />);
    const side = page.querySelector(".fg-shell-side")!;
    expect([...side.querySelectorAll("nav a")].map((a) => a.textContent)).toEqual([
      "Home",
      "My tools",
      "Discover",
      "Teams",
      "Settings",
    ]);
    expect(page.textContent).toContain('This page needs the permission "See tools".');
    expect(page.textContent).not.toMatch(/\brole/i);
  });

  it("opens a team's page for anyone signed in, with the controls of those who may change it", async () => {
    window.history.replaceState(null, "", "/admin/teams/support");
    const team = {
      id: "support",
      name: "Support",
      description: "",
      members: [],
      builtIn: false,
      locked: false,
      permissions: [],
      effective: [],
    };
    const { api } = fakeApi({
      ...routes(NOBODY),
      "/api/teams": { teams: [team] },
      "/api/permissions": { groups: [] },
    });
    const page = await mount(<App api={api} now={() => NOW} />);
    await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe("Support"));
    expect(page.textContent).toContain("Permissions on Forgeron");
    expect([...page.querySelectorAll("button")].some((b) => b.textContent === "Save changes")).toBe(
      false,
    );
  });

  describe("old addresses (D-128)", () => {
    it.each([
      ["/members", "/admin/members", "", "Members"],
      ["/settings/members", "/admin/members", "?invite", "Members"],
      ["/settings/roles", "/admin/teams", "", "Teams"],
      ["/admin/roles", "/admin/teams", "", "Teams"],
      ["/audit", "/settings/audit", "", "Audit log"],
      ["/tools", "/admin/tools", "", "Tools"],
      ["/marketplace", "/admin/marketplace", "", "Marketplace"],
    ])("%s goes to %s, keeping the query", async (from, to, query, title) => {
      window.history.replaceState(null, "", from + query);
      const { api } = fakeApi({ ...routes(), "/api/marketplaces": { marketplaces: [] } });
      const page = await mount(<App api={api} now={() => NOW} />);
      await waitFor(() => expect(page.querySelector("h1")?.textContent).toBe(title));
      expect(window.location.pathname).toBe(to);
      expect(window.location.search).toBe(query);
    });
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
