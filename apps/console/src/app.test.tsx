// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { App } from "./app";
import { cleanup, click, fakeApi, flush, mount, NOW, refusal } from "./test-utils";
import { loadWorkspace } from "./workspace";

beforeEach(() => {
  window.scrollTo = () => {};
});

afterEach(async () => {
  await cleanup();
  window.history.replaceState(null, "", "/");
  delete document.documentElement.dataset.theme;
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

  it("draws the sidebar with the workspace, the person, sign-out and the pending count", async () => {
    const { api } = fakeApi(routes());
    const page = await mount(<App api={api} now={() => NOW} />);
    const side = page.querySelector(".fg-shell-side")!;
    expect(side.textContent).toContain("demo");
    expect(side.textContent).toContain("ada@acme.fr");
    expect([...side.querySelectorAll("nav a")].map((a) => a.textContent)).toEqual([
      "Overview",
      "Tools",
      "Members",
      "Approvals1",
      "Audit log",
      "Settings",
    ]);
    expect(side.querySelector('a[href="/auth/logout"]')?.textContent).toBe("Sign out");
    expect(side.querySelector('[aria-current="page"]')?.textContent).toBe("Overview");
  });

  it("routes with the History API, moves focus to the content, and follows back", async () => {
    const { api } = fakeApi(routes());
    const page = await mount(<App api={api} now={() => NOW} />);
    const link = [...page.querySelectorAll("nav a")].find((a) => a.textContent === "Members");
    await click(link);
    await flush();
    expect(window.location.pathname).toBe("/members");
    expect(page.querySelector("h1")?.textContent).toBe("Members");
    expect(page.querySelector('[aria-current="page"]')?.textContent).toBe("Members");
    expect(document.activeElement?.id).toBe("content");
    window.history.pushState(null, "", "/tools");
    window.dispatchEvent(new PopStateEvent("popstate"));
    await flush();
    expect(page.querySelector("h1")?.textContent).toBe("Tools");
  });

  it("opens a deep link, and says so for an unknown path", async () => {
    window.history.replaceState(null, "", "/audit");
    const { api } = fakeApi(routes());
    const page = await mount(<App api={api} now={() => NOW} />);
    expect(page.querySelector("h1")?.textContent).toBe("Audit log");
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
      "Overview",
      "Tools",
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
    expect(page.querySelector("h1")?.textContent).toBe("Overview");
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
