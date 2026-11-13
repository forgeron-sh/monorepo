// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act } from "react";
import { button, cleanup, click, fakeApi, mount, type } from "../../../test-utils";
import { branches, pageProps, toolsApi, tools, versions } from "../test-helpers";
import ToolPage from "./tool-page";

afterEach(cleanup);
beforeEach(() => window.history.replaceState(null, "", "/admin/tools/crm"));

const routes = {
  "/api/tools": tools,
  "/api/tools/crm/branches": branches,
  "/api/tools/crm/versions": versions,
  "/api/tools/crm/activity": { entries: [] },
  "/api/tools/crm/secrets-status": { secrets: [] },
  "/api/tools/crm/availability": { mode: "nobody", teams: [], people: [], updatedAt: "x" },
  "/api/members": { members: [], invitations: [], settings: { domains: [], defaultTeams: [] } },
  "/api/teams": { teams: [] },
};
const tabLabels = (c: HTMLElement) =>
  [...c.querySelectorAll('[role="tab"]')].map((t) => t.textContent);
/** The first open of a tab imports its code: waits until nothing says "Loading". */
const flushLazy = async () => {
  for (let i = 0; i < 100; i++) {
    await act(async () => new Promise((r) => setTimeout(r, 20)));
    if (!document.body.textContent?.includes("Loading")) return;
  }
};

describe("the tool page", () => {
  it("draws the header and the registered tabs, and opens the first one", async () => {
    const page = await mount(<ToolPage name="crm" {...pageProps(toolsApi(routes).api)} />);
    await flushLazy();
    expect(page.querySelector("h1")?.textContent).toBe("crm");
    expect(page.textContent).toContain("Companies, contacts and deals.");
    expect(tabLabels(page)).toEqual([
      "Channels",
      "Releases",
      "CI",
      "Access",
      "Secrets",
      "Activity",
    ]);
    expect(page.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe("Channels");
    expect(page.textContent).toContain("feat-export");
  });

  it("opens the tab the address names, and moves between tabs without leaving the page", async () => {
    window.history.replaceState(null, "", "/admin/tools/crm?tab=versions");
    const page = await mount(<ToolPage name="crm" {...pageProps(toolsApi(routes).api)} />);
    await flushLazy();
    expect(page.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe("Releases");
    expect(page.textContent).toContain("Compared with");
    const activity = [...page.querySelectorAll('[role="tab"]')].find(
      (t) => t.textContent === "Activity",
    );
    await click(activity);
    await flushLazy();
    expect(window.location.search).toBe("?tab=activity");
    expect(page.textContent).toContain("Nothing has happened yet");
  });

  it("opens the page for the old Availability tab, whose rule is now in the header (D-129)", async () => {
    window.history.replaceState(null, "", "/admin/tools/crm?tab=availability");
    const page = await mount(<ToolPage name="crm" {...pageProps(toolsApi(routes).api)} />);
    await flushLazy();
    expect(window.location.search).toBe("");
    expect(page.querySelector('[role="tab"][aria-selected="true"]')?.textContent).toBe("Channels");
    expect(page.querySelector(".ft-header-title")?.textContent).toContain("Draft");
    expect(page.querySelector(".ft-branch-pick, .ft-branch-pick-label")).toBeNull();
  });

  it("shows a person with no permission none of the administration tabs, the secrets included (D-118, D-136)", async () => {
    const page = await mount(
      <ToolPage name="crm" {...pageProps(toolsApi(routes).api, { permissions: [] })} />,
    );
    await flushLazy();
    expect(tabLabels(page)).toEqual([]);
    // Sharing a channel is for whoever holds tools:publish (D-129, D-136).
    expect(page.querySelector(".ft-publish")).toBeNull();
  });

  it("shows production by default, and moves to a branch's address, keeping the tab (D-120)", async () => {
    window.history.replaceState(null, "", "/admin/tools/crm?tab=versions");
    const went: string[] = [];
    const page = await mount(
      <ToolPage name="crm" {...pageProps(toolsApi(routes).api, { go: (h) => went.push(h) })} />,
    );
    await flushLazy();
    const pick = page.querySelector<HTMLSelectElement>("select.ft-channel-pick")!;
    expect([...pick.options].map((o) => o.textContent)).toEqual([
      "Production · 1.4.0",
      "staging · 1.4.0",
      "Branch feat-export",
    ]);
    expect(pick.value).toBe("");
    expect(page.querySelector(".ft-branch-band")).toBeNull();
    await act(async () => {
      pick.value = "feat-export";
      pick.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(went).toEqual(["/admin/tools/crm/tree/feat-export?tab=versions"]);
  });

  it("on a branch, says so above every tab and marks the tabs that every branch shares", async () => {
    window.history.replaceState(null, "", "/admin/tools/crm/tree/feat-export?tab=versions");
    const went: string[] = [];
    const page = await mount(
      <ToolPage
        name="crm"
        branch="feat-export"
        {...pageProps(toolsApi(routes).api, { go: (h) => went.push(h) })}
      />,
    );
    await flushLazy();
    expect(page.querySelector<HTMLSelectElement>("select.ft-channel-pick")!.value).toBe(
      "feat-export",
    );
    expect(page.querySelector(".ft-branch-band")?.textContent).toContain("feat-export");
    expect(page.textContent).toContain("The same for every channel.");
    await click(
      [...page.querySelectorAll("button")].find((b) => b.textContent === "Back to production"),
    );
    expect(went).toEqual(["/admin/tools/crm?tab=versions"]);
  });

  it("shows a permanent channel by its reference, ~<name> (D-125)", async () => {
    window.history.replaceState(null, "", "/admin/tools/crm/tree/~staging?tab=versions");
    const page = await mount(
      <ToolPage name="crm" branch="~staging" {...pageProps(toolsApi(routes).api)} />,
    );
    await flushLazy();
    expect(page.querySelector<HTMLSelectElement>("select.ft-channel-pick")!.value).toBe("~staging");
    expect(page.querySelector(".ft-branch-band")?.textContent).toContain("Channel");
    expect(page.querySelector(".ft-branch-band")?.textContent).toContain("staging");
  });

  it("shows production, with a word, for a branch that has no preview anymore", async () => {
    window.history.replaceState(null, "", "/admin/tools/crm/tree/gone?tab=versions");
    const page = await mount(
      <ToolPage name="crm" branch="gone" {...pageProps(toolsApi(routes).api)} />,
    );
    await flushLazy();
    expect(page.textContent).toContain("The channel gone is gone.");
    expect(page.querySelector(".ft-branch-band")).toBeNull();
    expect(window.location.pathname).toBe("/admin/tools/crm");
    expect(window.location.search).toBe("?tab=versions");
  });

  it("says when the tool does not exist, and when the list cannot be loaded", async () => {
    const missing = await mount(<ToolPage name="nope" {...pageProps(toolsApi(routes).api)} />);
    expect(missing.textContent).toContain("There is no tool named nope.");
    await cleanup();
    const broken = await mount(<ToolPage name="crm" {...pageProps(toolsApi({}).api)} />);
    expect(broken.textContent).toContain("The tool could not be loaded.");
  });
});

// The header's actions (D-136): "Open in my tools" and "View on GitHub" moved into the chevron of the
// publish button, with "Unpublish" and "Delete tool…"; whoever may not publish has a small menu.

const SOURCE = {
  kind: "repo",
  repo: "acme-sh/crm",
  productionBranch: "main",
  autoUpdate: false,
  production: "1.4.0",
  update: null,
  channels: [],
};
const published = {
  ...routes,
  "/api/tools/crm/source": SOURCE,
  "/api/tools/crm/availability": { mode: "everyone", teams: [], people: [], updatedAt: "x" },
};
const menuItems = () =>
  [...document.querySelectorAll('[role="menu"] [role="menuitem"]')].map((i) => i.textContent);
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')!;
const openMenu = (page: HTMLElement, label: string) =>
  click(page.querySelector(`button[aria-label="${label}"]`));

describe("the header's actions", () => {
  it("has no arrow button any more: the chevron menu holds the tool's actions", async () => {
    const went: string[] = [];
    const open = vi.spyOn(window, "open").mockReturnValue(null);
    const page = await mount(
      <ToolPage name="crm" {...pageProps(toolsApi(published).api, { go: (h) => went.push(h) })} />,
    );
    await flushLazy();
    expect(page.querySelector(".ft-open-mine")).toBeNull();
    await openMenu(page, "More sharing actions");
    expect(menuItems()).toEqual([
      "Who has access",
      "Open in my tools",
      "View on GitHub",
      "Unpublish",
      "Delete tool…",
    ]);
    await click(
      [...document.querySelectorAll('[role="menuitem"]')].find(
        (i) => i.textContent === "View on GitHub",
      ),
    );
    expect(open).toHaveBeenCalledWith(
      "https://github.com/acme-sh/crm",
      "_blank",
      "noopener,noreferrer",
    );
    await openMenu(page, "More sharing actions");
    await click(
      [...document.querySelectorAll('[role="menuitem"]')].find(
        (i) => i.textContent === "Open in my tools",
      ),
    );
    expect(went).toEqual([expect.stringContaining("crm")]);
    open.mockRestore();
  });

  it("leaves out View on GitHub for a tool with no repository, and Delete tool without tools:delete", async () => {
    const page = await mount(
      <ToolPage
        name="crm"
        {...pageProps(toolsApi(routes).api, {
          permissions: ["tools:read", "tools:publish", "access:read"],
        })}
      />,
    );
    await flushLazy();
    await openMenu(page, "More sharing actions");
    expect(menuItems()).toEqual(["Who has access", "Open in my tools"]);
  });

  it("gives a person who may not publish a small menu with what they may use", async () => {
    const reader = await mount(
      <ToolPage
        name="crm"
        {...pageProps(toolsApi(published).api, { permissions: ["tools:read"] })}
      />,
    );
    await flushLazy();
    expect(reader.querySelector(".ft-publish")).toBeNull();
    await openMenu(reader, "Tool actions");
    expect(menuItems()).toEqual(["Open in my tools", "View on GitHub"]);
    await cleanup();
    const remover = await mount(
      <ToolPage
        name="crm"
        {...pageProps(toolsApi(published).api, { permissions: ["tools:read", "tools:delete"] })}
      />,
    );
    await flushLazy();
    await openMenu(remover, "Tool actions");
    expect(menuItems()).toEqual(["Open in my tools", "View on GitHub", "Delete tool…"]);
  });

  it("deletes the tool for good once its name is typed, then goes back to the tools", async () => {
    const went: string[] = [];
    const { api, sent } = fakeApi({ ...published, "DELETE /api/tools/crm": { deleted: true } });
    const page = await mount(
      <ToolPage name="crm" {...pageProps(api, { go: (h) => went.push(h) })} />,
    );
    await flushLazy();
    await openMenu(page, "More sharing actions");
    await click(
      [...document.querySelectorAll('[role="menuitem"]')].find(
        (i) => i.textContent === "Delete tool…",
      ),
    );
    expect(dialog().textContent).toContain("Delete crm?");
    expect(button(dialog(), "Delete tool").disabled).toBe(true);
    await type(dialog().querySelector("input")!, "cr");
    expect(button(dialog(), "Delete tool").disabled).toBe(true);
    await type(dialog().querySelector("input")!, "crm");
    await click(button(dialog(), "Delete tool"));
    expect(sent).toContainEqual({
      method: "DELETE",
      path: "/api/tools/crm",
      body: { confirm: "crm" },
    });
    expect(went).toEqual(["/admin/tools"]);
  });
});

describe("a tool whose first version is not deployed yet", () => {
  const draftRoutes = (ci: unknown) => ({
    "/api/tools": tools,
    "/api/tools/draft/branches": { tool: "draft", production: null, channels: [], branches: [] },
    "/api/tools/draft/versions": { tool: "draft", versions: [] },
    "/api/tools/draft/source": { ...SOURCE, repo: "acme-sh/draft", production: null },
    "/api/tools/draft/ci": ci,
    "/api/tools/draft/availability": { mode: "nobody", teams: [], people: [], updatedAt: "x" },
    "/api/members": { members: [], invitations: [], settings: { domains: [], defaultTeams: [] } },
    "/api/teams": { teams: [] },
  });
  const run = (status: string, over: object = {}) => ({
    id: 5,
    workflow: "forgeron",
    branch: "main",
    message: "feat: first",
    sha: "a".repeat(40),
    actor: "ada",
    status,
    startedAt: "2026-11-03T11:50:00Z",
    durationSeconds: null,
    url: "https://github.com/acme-sh/draft/actions/runs/5",
    ...over,
  });
  const ok = (...runs: object[]) => ({
    state: "ok",
    repo: "acme-sh/draft",
    productionBranch: "main",
    actionsUrl: "https://github.com/acme-sh/draft/actions",
    runs,
  });
  const show = async (ci: unknown) => {
    const page = await mount(
      <ToolPage name="draft" {...pageProps(toolsApi(draftRoutes(ci)).api)} />,
    );
    await flushLazy();
    return page;
  };

  it("says Importing while the CI runs, and turns Publish off with the reason", async () => {
    const page = await show(ok(run("in_progress")));
    expect(page.textContent).toContain("Importing");
    expect(page.textContent).not.toContain("Not deployed");
    expect(page.textContent).toContain(
      "Nothing to publish yet: no version is deployed on this channel.",
    );
    expect(button(page, "Publish").disabled).toBe(true);
    expect(button(page, "View the run ↗").getAttribute("href")).toBe(
      "https://github.com/acme-sh/draft/actions/runs/5",
    );
  });

  it("says CI failed, with the run, when the last run failed", async () => {
    const page = await show(ok(run("failure", { id: 6 }), run("success", { branch: "feat" })));
    expect(page.textContent).toContain("CI failed");
    expect(page.textContent).toContain("The last CI run failed");
  });

  it("says Waiting for CI when no run was seen, and points to the CI tab", async () => {
    const page = await show(ok());
    expect(page.textContent).toContain("Waiting for CI");
    await click(button(page, "View CI"));
    expect(window.location.search).toBe("?tab=ci");
  });

  it("says nothing of the CI where it cannot be read", async () => {
    const page = await show({ state: "no-permission", repo: "acme-sh/draft", settingsUrl: "x" });
    expect(page.textContent).not.toContain("Importing");
    expect(page.textContent).toContain("Nothing deployed");
  });
});
