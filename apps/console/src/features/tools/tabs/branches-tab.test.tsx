// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act } from "react";
import { ApiError } from "../../../api";
import { button, cleanup, click, mount, refusal, type } from "../../../test-utils";
import { branches, tabProps, toolsApi, versions } from "../test-helpers";
import BranchesTab from "./branches-tab";

afterEach(cleanup);

const routes = {
  "/api/tools/crm/branches": branches,
  "/api/tools/crm/versions": versions,
};
const show = (r: Record<string, unknown> = routes, p: Record<string, unknown> = {}) => {
  const fake = toolsApi(r, p);
  return mount(<BranchesTab {...tabProps(fake.api)} />).then((page) => ({
    page,
    ...fake,
  }));
};
const byLabel = (page: HTMLElement, label: string) =>
  page.querySelector<HTMLElement>(`[aria-label="${label}"]`)!;
const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')!;

describe("the branches", () => {
  it("shows production first, then one row per preview with its commit, author, status and version", async () => {
    const { page } = await show();
    const production = page.querySelector('ul[aria-label="Production"]')!;
    expect(production.textContent).toContain("Production");
    expect(production.textContent).toContain("c0ffee4");
    expect(production.textContent).toContain("Require a page size");
    expect(production.textContent).toContain("6 days ago");
    expect(production.textContent).toContain("demo.test/t/crm");
    expect(production.textContent).toContain("1.4.0");
    expect(button(production as HTMLElement, "Roll back")).toBeTruthy();

    const rows = [...page.querySelectorAll('ul[aria-label="Previews"] > li')];
    expect(rows.map((r) => r.getAttribute("data-env"))).toEqual(["preview", "preview"]);
    expect(rows[0]!.textContent).toContain("feat-export");
    expect(rows[0]!.textContent).toContain("5e8d77b");
    expect(rows[0]!.textContent).toContain("Bob");
    expect(rows[0]!.textContent).toContain("Ready");
    expect(rows[1]!.textContent).toContain("Failed");
    const link = rows[0]!.querySelector<HTMLAnchorElement>('a[href="https://feat-export.test"]')!;
    expect(link.target).toBe("_blank");
    expect(link.rel).toContain("noopener");
  });

  it("filters by branch, status and author", async () => {
    const { page } = await show();
    const rows = () => page.querySelectorAll('ul[aria-label="Previews"] > li').length;
    await type(page.querySelector<HTMLInputElement>('input[aria-label="Branch"]')!, "search");
    expect(rows()).toBe(1);
    await type(page.querySelector<HTMLInputElement>('input[aria-label="Branch"]')!, "");
    const select = (label: string, value: string) =>
      act(async () => {
        const el = byLabel(page, label) as HTMLSelectElement;
        Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, "value")!.set!.call(el, value);
        el.dispatchEvent(new Event("change", { bubbles: true }));
      });
    await select("Status", "failed");
    expect(rows()).toBe(1);
    expect(page.textContent).toContain("fix-search");
    await select("Status", "");
    await select("Author", "Bob");
    expect(rows()).toBe(1);
    expect(page.textContent).toContain("feat-export");
    await select("Author", "Claire");
    await type(page.querySelector<HTMLInputElement>('input[aria-label="Branch"]')!, "export");
    expect(page.textContent).toContain("No preview matches these filters.");
  });

  it("expands a row to its database, last migration and recent deployments", async () => {
    const { page } = await show();
    expect(page.textContent).not.toContain("0004_export_index");
    await click(byLabel(page, "Show the details of feat-export"));
    expect(page.textContent).toContain("4 migrations applied.");
    expect(page.textContent).toContain("0004_export_index");
    expect(page.textContent).toContain("Recent deployments");
    await click(byLabel(page, "Hide the details of feat-export"));
    expect(page.textContent).not.toContain("0004_export_index");
  });

  it("rolls production back through a dialog that shows both versions and what leaves", async () => {
    const { page, platform } = await show(routes, { "POST /rollback": { version: "1.3.0" } });
    await click(button(page, "Roll back"));
    const d = dialog();
    expect(d.textContent).toContain("Roll back production");
    expect(d.textContent).toContain("1.4.0");
    expect(d.textContent).toContain("1.3.0");
    expect(d.textContent).toContain("Migrations are not rolled back.");
    await type(d.querySelector("textarea")!, " Export is broken ");
    await click(button(d, "Roll back"));
    expect(platform).toEqual([
      {
        path: "/rollback",
        body: { tool: "crm", environment: "production", reason: "Export is broken" },
        method: "POST",
      },
    ]);
    expect(dialog()).toBeNull();
  });

  it("promotes a preview, showing its changelog and impact, and reloads", async () => {
    const { page, platform, reads } = await show(routes, { "POST /promote": { version: "1.5.1" } });
    await click(byLabel(page, "Actions for feat-export"));
    await click(button(page, "Promote to production"));
    const d = dialog();
    expect(d.textContent).toContain("Promote to production");
    expect(d.textContent).toContain("From1.4.0");
    expect(d.textContent).toContain("To1.5.1");
    expect(d.textContent).toContain("Patch");
    expect(d.textContent).toContain("The export keeps the column order.");
    const before = reads.filter((r) => r.endsWith("/branches")).length;
    await click(button(d, "Promote"));
    expect(platform).toEqual([
      {
        path: "/promote/plan",
        body: { tool: "crm", version: "1.5.1", to: "production" },
        method: "POST",
      },
      {
        path: "/promote",
        body: { tool: "crm", version: "1.5.1", to: "production" },
        method: "POST",
      },
    ]);
    expect(reads.filter((r) => r.endsWith("/branches")).length).toBe(before + 1);
  });

  describe("the plan of a promotion (D-113)", () => {
    const plan = {
      tool: "crm",
      version: "1.5.1",
      alreadyServed: false,
      ok: true,
      conflicts: [],
      requiresAllowDestructive: false,
      migrations: {
        checked: true,
        applied: ["0001_init"],
        pending: ["0002_stage"],
        destructive: [],
      },
      changes: [],
      impact: "patch",
    };
    const open = async (answer: unknown) => {
      const shown = await show(routes, {
        "POST /promote/plan": answer,
        "POST /promote": { version: "1.5.1" },
      });
      await click(byLabel(shown.page, "Actions for feat-export"));
      await click(button(shown.page, "Promote to production"));
      return shown;
    };

    it("shows the migrations that will run when nothing stops it, and promotes", async () => {
      const { platform } = await open(plan);
      expect(dialog().textContent).toContain("Migrations that will run");
      expect(dialog().textContent).toContain("0002_stage");
      expect(button(dialog(), "Promote").disabled).toBe(false);
      await click(button(dialog(), "Promote"));
      expect(platform.map((c) => c.path)).toEqual(["/promote/plan", "/promote"]);
    });

    it("lists the conflicts, offers the prompt and the commands, and does not let it go", async () => {
      const written: string[] = [];
      Object.defineProperty(navigator, "clipboard", {
        configurable: true,
        value: { writeText: async (text: string) => void written.push(text) },
      });
      const { platform } = await open({
        ...plan,
        ok: false,
        conflicts: [
          {
            code: "MIGRATION_MISSING",
            subject: "0002_other",
            message: "It was applied there, but this version lacks it.",
          },
        ],
        prompt: "Help me promote crm. MIGRATION_MISSING (0002_other).",
      });
      const d = dialog();
      expect(d.textContent).toContain("cannot go to production yet (1 problem)");
      expect(d.textContent).toContain("MIGRATION_MISSING");
      expect(d.textContent).toContain("0002_other");
      expect(d.textContent).toContain("forgeron db status --env production");
      expect(d.textContent).toContain("forgeron promote --from-branch feat-export --to production");
      expect(button(d, "Promote").disabled).toBe(true);
      await click(button(d, "Copy prompt for your agent"));
      expect(written).toEqual(["Help me promote crm. MIGRATION_MISSING (0002_other)."]);
      expect(d.textContent).toContain("Copied");
      expect(platform.map((c) => c.path)).toEqual(["/promote/plan"]);
    });

    it("keeps a destructive migration for the terminal", async () => {
      await open({
        ...plan,
        requiresAllowDestructive: true,
        migrations: { ...plan.migrations, destructive: ["0002_stage"] },
      });
      expect(dialog().textContent).toContain("It drops or rewrites data.");
      expect(dialog().textContent).toContain("--allow-destructive");
      expect(button(dialog(), "Promote").disabled).toBe(true);
    });

    it("approves what the version asks for, and takes a build with no release, in the dialog (D-121)", async () => {
      const { platform } = await open({
        ...plan,
        ok: false,
        conflicts: [
          { code: "PENDING_APPROVAL", subject: "resources.network", message: "Waits." },
          { code: "CHANGELOG_NO_ENTRY", message: "No entry." },
        ],
      });
      const d = dialog();
      expect(d.textContent).not.toContain("cannot go to production yet");
      expect(d.textContent).toContain("This version asks for");
      expect(d.textContent).toContain("resources.network");
      expect(d.textContent).toContain("This build is not a release.");
      expect(button(d, "Promote").disabled).toBe(true);
      const box = (label: string) =>
        [...d.querySelectorAll("label")]
          .find((l) => l.textContent === label)!
          .querySelector("input");
      await click(box("I approve what it asks for"));
      expect(button(d, "Promote").disabled).toBe(true);
      await click(box("Put it in production without a release"));
      await click(button(d, "Promote"));
      expect(platform.at(-1)).toMatchObject({
        path: "/promote",
        body: { approve: true, withoutRelease: true },
      });
    });

    it("says when production already serves the version", async () => {
      await open({ ...plan, alreadyServed: true });
      expect(dialog().textContent).toContain("Production already serves this version.");
    });
  });

  it("says why the platform refused, and keeps the dialog open", async () => {
    const { page } = await show(routes, {
      "POST /promote": () => {
        throw refusal(409, "1.5.1 asks for a network access an admin has not approved yet.");
      },
    });
    await click(byLabel(page, "Actions for feat-export"));
    await click(button(page, "Promote to production"));
    await click(button(dialog(), "Promote"));
    expect(dialog().textContent).toContain("The platform refused.");
    expect(dialog().textContent).toContain("has not approved yet");
    await click(button(dialog(), "Cancel"));
    expect(dialog()).toBeNull();
  });

  describe("a refusal the admin may accept, when the plan did not say it (D-121)", () => {
    const tick = (label: string) =>
      click(
        [...dialog().querySelectorAll("label")]
          .find((l) => l.textContent === label)!
          .querySelector("input")!,
      );
    // No plan (the platform did not give one), then a refusal on the first try only.
    const refusing = (error: ApiError) => {
      let tries = 0;
      return show(routes, {
        "POST /promote/plan": () => {
          throw refusal(405);
        },
        "POST /promote": () => {
          if (tries++ === 0) throw error;
          return { version: "1.5.1" };
        },
      });
    };
    const promoteFeat = async (page: HTMLElement) => {
      await click(byLabel(page, "Actions for feat-export"));
      await click(button(page, "Promote to production"));
      await click(button(dialog(), "Promote"));
    };

    it("offers to put a build with no release in production, and sends it knowingly", async () => {
      const { page, platform } = await refusing(
        refusal(422, "production takes a version with a changelog entry.", "NO_ENTRY"),
      );
      await promoteFeat(page);
      const d = dialog();
      expect(d.textContent).not.toContain("The platform refused.");
      expect(d.textContent).toContain("This build is not a release.");
      expect(button(d, "Promote").disabled).toBe(true);
      await tick("Put it in production without a release");
      await click(button(d, "Promote"));
      expect(platform.at(-1)).toMatchObject({
        path: "/promote",
        body: { tool: "crm", version: "1.5.1", to: "production", withoutRelease: true },
      });
      expect(dialog()).toBeNull();
    });

    it("offers to approve what the version asks for, and sends the approval", async () => {
      const { page, platform } = await refusing(
        refusal(409, "resources.network waits for an admin to approve it.", "PENDING_APPROVAL"),
      );
      await promoteFeat(page);
      const d = dialog();
      expect(d.textContent).not.toContain("The platform refused.");
      expect(d.textContent).toContain("This version asks for");
      expect(d.textContent).toContain("resources.network waits for an admin");
      expect(button(d, "Promote").disabled).toBe(true);
      await tick("I approve what it asks for");
      await click(button(d, "Promote"));
      expect(platform.at(-1)).toMatchObject({ path: "/promote", body: { approve: true } });
      expect(dialog()).toBeNull();
    });

    it("still says why for any other refusal", async () => {
      const { page } = await refusing(
        refusal(422, "The changelog declares too little.", "IMPACT_TOO_LOW"),
      );
      await promoteFeat(page);
      expect(dialog().textContent).toContain("The platform refused.");
      expect(dialog().textContent).toContain("declares too little");
      expect(dialog().textContent).not.toContain("Put it in production without a release");
    });
  });

  it("closes a preview only once its name is typed", async () => {
    const { page, platform } = await show();
    await click(byLabel(page, "Actions for feat-export"));
    await click(button(page, "Close preview"));
    const d = dialog();
    const confirm = button(d, "Close preview");
    expect(confirm.disabled).toBe(true);
    await type(d.querySelector("input")!, "feat-export");
    expect(confirm.disabled).toBe(false);
    await click(confirm);
    expect(platform).toEqual([
      { path: "/deploy", body: { tool: "crm", branch: "feat-export" }, method: "DELETE" },
    ]);
  });

  it("hides Roll back when production has no earlier version, and the menu from a non-admin", async () => {
    const lone = { ...branches, production: { ...branches.production, rollbackTo: undefined } };
    const { page } = await show({ ...routes, "/api/tools/crm/branches": lone });
    expect(button(page, "Roll back")).toBeUndefined();
    await cleanup();
    const fake = toolsApi(routes);
    const member = await mount(<BranchesTab {...tabProps(fake.api, "crm", false)} />);
    expect(member.querySelector('[aria-label="Actions for feat-export"]')).toBeNull();
  });

  it("explains an empty tool with the command, and an error with a retry", async () => {
    const empty = await show({
      ...routes,
      "/api/tools/crm/branches": { tool: "crm", production: null, branches: [] },
    });
    expect(empty.page.textContent).toContain("Nothing is deployed yet");
    expect(empty.page.textContent).toContain("forgeron deploy --env preview --branch <name>");
    await cleanup();
    const broken = await show({
      "/api/tools/crm/branches": () => {
        throw new ApiError("500", 500);
      },
    });
    expect(broken.page.textContent).toContain("The branches could not be loaded.");
  });

  it("still lists the branches when the changelog cannot be loaded, and says so in the dialog", async () => {
    const { page } = await show({ "/api/tools/crm/branches": branches });
    await click(byLabel(page, "Actions for feat-export"));
    await click(button(page, "Promote to production"));
    expect(dialog().textContent).toContain("The changelog could not be loaded.");
  });
});
