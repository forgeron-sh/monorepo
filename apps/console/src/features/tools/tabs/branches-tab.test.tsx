// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { act } from "react";
import { ApiError } from "../../../api";
import { button, cleanup, click, mount, type } from "../../../test-utils";
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

describe("the channels (D-125)", () => {
  it("shows the permanent channels first, then one row per branch with its commit, author, status and version", async () => {
    const { page } = await show();
    const production = page.querySelector('ul[aria-label="Permanent channels"]')!;
    expect(production.textContent).toContain("Production");
    expect(production.textContent).toContain("c0ffee4");
    expect(production.textContent).toContain("Require a page size");
    expect(production.textContent).toContain("6 days ago");
    expect(production.textContent).toContain("demo.test/t/crm");
    expect(production.textContent).toContain("1.4.0");
    expect(button(production as HTMLElement, "Roll back")).toBeTruthy();

    expect(production.textContent).toContain("staging");
    expect(production.querySelector('[title="Follows staging"]')).toBeTruthy();
    const rows = [...page.querySelectorAll('ul[aria-label="Branches"] > li')];
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
    const rows = () => page.querySelectorAll('ul[aria-label="Branches"] > li').length;
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
    expect(page.textContent).toContain("No branch matches these filters.");
  });

  it("expands a branch to its database, last migration and its commits", async () => {
    const { page } = await show();
    expect(page.textContent).not.toContain("0004_export_index");
    await click(byLabel(page, "Show the details of feat-export"));
    expect(page.textContent).toContain("4 migrations applied.");
    expect(page.textContent).toContain("0004_export_index");
    expect(page.textContent).toContain("Commits");
    await click(byLabel(page, "Hide the details of feat-export"));
    expect(page.textContent).not.toContain("0004_export_index");
  });

  it("rolls production back through a dialog that shows both versions and what leaves", async () => {
    const { page, platform } = await show(routes, { "POST /rollback": { version: "1.3.0" } });
    await click(button(page.querySelector<HTMLElement>('li[data-env="production"]')!, "Roll back"));
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

  it("rolls a permanent channel back to a release it served, by its name", async () => {
    const { page, platform } = await show(routes, { "POST /rollback": { version: "1.3.0" } });
    await click(button(page.querySelector<HTMLElement>('li[data-env="channel"]')!, "Roll back"));
    expect(dialog().textContent).toContain("Roll back staging");
    await click(button(dialog(), "Roll back"));
    expect(platform).toEqual([
      {
        path: "/rollback",
        body: { tool: "crm", environment: "channel", channel: "staging" },
        method: "POST",
      },
    ]);
  });

  it("offers no promotion: a branch can only be closed", async () => {
    const { page } = await show();
    await click(byLabel(page, "Actions for feat-export"));
    expect(button(page, "Promote to production")).toBeUndefined();
    expect(button(page, "Close channel")).toBeTruthy();
  });

  it("closes a branch's channel only once its name is typed", async () => {
    const { page, platform } = await show();
    await click(byLabel(page, "Actions for feat-export"));
    await click(button(page, "Close channel"));
    const d = dialog();
    const confirm = button(d, "Close channel");
    expect(confirm.disabled).toBe(true);
    await type(d.querySelector("input")!, "feat-export");
    expect(confirm.disabled).toBe(false);
    await click(confirm);
    expect(platform).toEqual([
      { path: "/deploy", body: { tool: "crm", branch: "feat-export" }, method: "DELETE" },
    ]);
  });

  it("hides Roll back when production has no earlier version, and the menu from a non-admin", async () => {
    const lone = {
      ...branches,
      production: { ...branches.production, rollbackTo: undefined },
      channels: [],
    };
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
      "/api/tools/crm/branches": { tool: "crm", production: null, channels: [], branches: [] },
    });
    expect(empty.page.textContent).toContain("Nothing is deployed yet");
    expect(empty.page.textContent).toContain("forgeron release");
    await cleanup();
    const broken = await show({
      "/api/tools/crm/branches": () => {
        throw new ApiError("500", 500);
      },
    });
    expect(broken.page.textContent).toContain("The channels could not be loaded.");
  });

  it("still lists the channels when the changelog cannot be loaded, and says so in the dialog", async () => {
    const { page } = await show({ "/api/tools/crm/branches": branches });
    await click(button(page.querySelector<HTMLElement>('li[data-env="production"]')!, "Roll back"));
    expect(dialog().textContent).toContain("The changelog could not be loaded.");
  });
});
