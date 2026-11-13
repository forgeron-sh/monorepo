// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "../../../api";
import { button, cleanup, click, mount, type } from "../../../test-utils";
import { pageProps, toolsApi, tools } from "../test-helpers";
import ToolsPage from "./tools-page";

afterEach(cleanup);
beforeEach(() => window.localStorage.clear());

const page = (routes: Record<string, unknown>, go = vi.fn<(href: string) => void>()) =>
  mount(<ToolsPage {...pageProps(toolsApi(routes).api, { go })} />).then((container) => ({
    container,
    go,
  }));

describe("the tools list", () => {
  it("shows each tool with its summary, production version, previews and last deployment", async () => {
    const { container } = await page({ "/api/tools": tools });
    const rows = [...container.querySelectorAll("tbody tr")].map((r) => r.textContent);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toContain("crmCompanies, contacts and deals.");
    expect(rows[0]).toContain("1.4.0");
    expect(rows[0]).toContain("3 hours ago");
    expect(rows[0]).toContain("Live");
    expect(rows[1]).toContain("Not deployed");
    expect(rows[1]).toContain("Never");
    expect(rows[2]).toContain("Preview only");
  });

  it("opens the tool of a row", async () => {
    const { container, go } = await page({ "/api/tools": tools });
    await click(container.querySelector("tbody tr"));
    expect(go).toHaveBeenCalledWith("/admin/tools/crm");
  });

  it("searches by name and by summary, and says when nothing matches", async () => {
    const { container } = await page({ "/api/tools": tools });
    const search = container.querySelector<HTMLInputElement>("input[type=search]")!;
    await type(search, "invoices");
    expect([...container.querySelectorAll("tbody tr")].map((r) => r.textContent)).toEqual([
      expect.stringContaining("odoo"),
    ]);
    await type(search, "zzz");
    expect(container.textContent).toContain('No tool matches "zzz".');
  });

  it("switches to a grid of cards that link to the tools, and remembers the choice", async () => {
    const { container, go } = await page({ "/api/tools": tools });
    await click(button(container, "Grid"));
    expect(container.querySelector("table")).toBeNull();
    const cards = [...container.querySelectorAll<HTMLAnchorElement>("a.ft-card")];
    expect(cards.map((c) => c.getAttribute("href"))).toEqual([
      "/admin/tools/crm",
      "/admin/tools/draft",
      "/admin/tools/odoo",
    ]);
    expect(cards[1]!.textContent).toContain("No description.");
    await click(cards[0]);
    expect(go).toHaveBeenCalledWith("/admin/tools/crm");

    await cleanup();
    const again = await page({ "/api/tools": tools });
    expect(again.container.querySelector("a.ft-card")).not.toBeNull();
    expect(button(again.container, "Grid").getAttribute("aria-pressed")).toBe("true");
  });

  it("shows the first commands when there is no tool", async () => {
    const { container } = await page({ "/api/tools": { tools: [] } });
    expect(container.textContent).toContain("No tool yet");
    expect(container.textContent).toContain("forgeron init");
    expect(container.textContent).toContain("forgeron link --workspace demo");
    expect(container.textContent).toContain("forgeron deploy --env preview --branch <name>");
  });

  it("says what failed and asks again on a retry", async () => {
    let fail = true;
    const { container } = await page({
      "/api/tools": () => {
        if (fail) throw new ApiError("/api/tools: 500", 500);
        return tools;
      },
    });
    expect(container.textContent).toContain("The tools could not be loaded.");
    fail = false;
    await click(button(container, "Try again"));
    expect(container.querySelectorAll("tbody tr")).toHaveLength(3);
  });
});

// A tool added from GitHub says what its CI is doing until its first version is deployed.
describe("a tool with nothing deployed yet", () => {
  const run = (status: string, over: object = {}) => ({
    id: 1,
    workflow: "forgeron",
    branch: "main",
    message: "feat: first",
    sha: "a".repeat(40),
    actor: "ada",
    status,
    startedAt: "2026-11-03T11:50:00Z",
    durationSeconds: null,
    url: "https://github.com/acme-sh/draft/actions/runs/1",
    ...over,
  });
  const ci = (...runs: object[]) => ({
    state: "ok",
    repo: "acme-sh/draft",
    productionBranch: "main",
    actionsUrl: "https://github.com/acme-sh/draft/actions",
    runs,
  });
  const draftRow = (container: HTMLElement) => container.querySelectorAll("tbody tr")[1]!;

  it("says Importing while a run goes, CI failed with the run, Waiting for CI with no run", async () => {
    for (const [answer, word] of [
      [ci(run("in_progress")), "Importing"],
      [ci(run("queued")), "Importing"],
      [ci(run("failure")), "CI failed"],
      [ci(), "Waiting for CI"],
      [ci(run("cancelled")), "Waiting for CI"],
    ] as const) {
      const { container } = await page({ "/api/tools": tools, "/api/tools/draft/ci": answer });
      expect(draftRow(container).textContent).toContain(word);
      expect(draftRow(container).textContent).not.toContain("Not deployed");
      await cleanup();
    }
    const { container } = await page({
      "/api/tools": tools,
      "/api/tools/draft/ci": ci(run("failure")),
    });
    const link = draftRow(container).querySelector<HTMLAnchorElement>("a.ft-run-link")!;
    expect(link.getAttribute("href")).toBe("https://github.com/acme-sh/draft/actions/runs/1");
  });

  it("looks at the production branch's runs first, and ignores another branch's failure", async () => {
    const { container } = await page({
      "/api/tools": tools,
      "/api/tools/draft/ci": ci(
        run("failure", { branch: "feat-x" }),
        run("in_progress", { branch: "main", id: 2 }),
      ),
    });
    expect(draftRow(container).textContent).toContain("Importing");
  });

  it("reads the CI of the tools that have nothing deployed only", async () => {
    const { api, reads } = toolsApi({ "/api/tools": tools, "/api/tools/draft/ci": ci() });
    await mount(<ToolsPage {...pageProps(api)} />);
    expect(reads.filter((r) => r.endsWith("/ci"))).toEqual(["/api/tools/draft/ci"]);
  });

  it("keeps Not deployed for a tool with no repository, or whose CI cannot be read", async () => {
    for (const answer of [
      { state: "no-repository" },
      { state: "no-app", repo: "acme-sh/draft" },
      { state: "no-permission", repo: "acme-sh/draft", settingsUrl: "https://github.com/x" },
    ]) {
      const { container } = await page({ "/api/tools": tools, "/api/tools/draft/ci": answer });
      expect(draftRow(container).textContent).toContain("Not deployed");
      await cleanup();
    }
    // The CI route failing changes nothing either.
    const { container } = await page({ "/api/tools": tools });
    expect(draftRow(container).textContent).toContain("Not deployed");
  });

  it("says it in the grid as well", async () => {
    const { container } = await page({
      "/api/tools": tools,
      "/api/tools/draft/ci": ci(run("in_progress")),
    });
    await click(button(container, "Grid"));
    const card = container.querySelectorAll("a.ft-card")[1]!;
    expect(card.textContent).toContain("Importing");
    expect(card.textContent).not.toContain("Not deployed");
  });
});
