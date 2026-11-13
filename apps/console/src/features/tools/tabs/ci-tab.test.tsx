// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { cleanup, fakeApi, mount } from "../../../test-utils";
import { tabProps } from "../test-helpers";
import CiTab, { duration } from "./ci-tab";

afterEach(cleanup);

const run = (id: number, status: string, over: object = {}) => ({
  id,
  workflow: "forgeron",
  branch: "main",
  message: `commit ${id}`,
  sha: "a".repeat(40),
  actor: "ada",
  status,
  startedAt: "2026-11-03T11:00:00Z",
  durationSeconds: 125,
  url: `https://github.com/acme-sh/crm/actions/runs/${id}`,
  ...over,
});
const ok = (runs: object[]) => ({
  state: "ok",
  repo: "acme-sh/crm",
  productionBranch: "main",
  actionsUrl: "https://github.com/acme-sh/crm/actions",
  runs,
});
const show = async (answer: unknown) =>
  mount(<CiTab {...tabProps(fakeApi({ "/api/tools/crm/ci": answer }).api)} />);

describe("the CI tab", () => {
  it("lists the runs as given, each linking to its run, with the five states", async () => {
    const view = await show(
      ok([
        run(5, "queued", { durationSeconds: null }),
        run(4, "in_progress", { durationSeconds: null, branch: "feat-x", actor: "bob" }),
        run(3, "success"),
        run(2, "failure", { durationSeconds: 45 }),
        run(1, "cancelled", { message: "" }),
      ]),
    );
    const rows = [...view.querySelectorAll("tbody tr")];
    expect(rows).toHaveLength(5);
    expect(rows.map((r) => r.querySelector(".fg-badge")?.textContent)).toEqual([
      "Queued",
      "In progress",
      "Success",
      "Failed",
      "Cancelled",
    ]);
    expect(rows[1]!.textContent).toContain("feat-x");
    expect(rows[1]!.textContent).toContain("bob");
    expect(rows[2]!.textContent).toContain("commit 3");
    expect(rows[2]!.textContent).toContain("2m 5s");
    expect(rows[2]!.textContent).toContain("1 hour ago");
    expect(rows[3]!.textContent).toContain("45s");
    // A commit with no message shows its short sha.
    expect(rows[4]!.textContent).toContain("aaaaaaa");
    const link = rows[2]!.querySelector<HTMLAnchorElement>("a")!;
    expect(link.getAttribute("href")).toBe("https://github.com/acme-sh/crm/actions/runs/3");
    expect(link.getAttribute("target")).toBe("_blank");
  });

  it("links to the repository's Actions and says what a run does", async () => {
    const view = await show(ok([run(1, "success")]));
    const github = [...view.querySelectorAll("a")].find(
      (a) => a.textContent === "View on GitHub ↗",
    )!;
    expect(github.getAttribute("href")).toBe("https://github.com/acme-sh/crm/actions");
    expect(view.textContent).toContain(
      "A successful run on main deploys a release; on another branch, a temporary channel.",
    );
  });

  it("says so when there is no run yet", async () => {
    const view = await show(ok([]));
    expect(view.textContent).toContain("No run yet.");
  });

  it("explains a tool with no repository", async () => {
    const view = await show({ state: "no-repository" });
    expect(view.textContent).toContain("This tool has no repository");
    expect(view.querySelector("a")).toBeNull();
  });

  it("explains a repository the app cannot reach, with a link to it", async () => {
    const view = await show({ state: "no-app", repo: "acme-sh/crm" });
    expect(view.textContent).toContain("Forgeron cannot reach this repository");
    expect(view.querySelector("a")?.getAttribute("href")).toBe("https://github.com/acme-sh/crm");
  });

  it("tells the owner to allow reading Actions in the GitHub App's settings", async () => {
    const view = await show({
      state: "no-permission",
      repo: "acme-sh/crm",
      settingsUrl: "https://github.com/organizations/acme-sh/settings/installations/7",
    });
    expect(view.textContent).toContain(
      "Allow Forgeron to read Actions in the GitHub App's settings",
    );
    const links = [...view.querySelectorAll("a")];
    expect(links.map((a) => a.getAttribute("href"))).toEqual([
      "https://github.com/organizations/acme-sh/settings/installations/7",
      "https://github.com/acme-sh/crm",
    ]);
  });

  it("says when the runs could not be read", async () => {
    const view = await mount(<CiTab {...tabProps(fakeApi({}).api)} />);
    expect(view.textContent).toContain("The CI runs could not be loaded.");
  });

  it("writes a duration", () => {
    expect([null, 7, 125, 3_780].map(duration)).toEqual(["", "7s", "2m 5s", "1h 3m"]);
  });
});
