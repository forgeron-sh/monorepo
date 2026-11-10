// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { button, cleanup, click, fakeApi, mount } from "../../../test-utils";
import { UpdatePanel } from "./update-panel";

afterEach(cleanup);

const source = {
  kind: "marketplace",
  marketplace: "m1",
  productionBranch: "main",
  autoUpdate: false,
  production: "1.0.0",
  update: {
    version: "1.1.0",
    release: true,
    changelog: ["Tickets by team"],
    approvals: ["resources.secrets.ODOO_KEY"],
  },
};
const box = (page: HTMLElement, text: string) =>
  [...page.querySelectorAll("label")]
    .find((l) => l.textContent?.startsWith(text))!
    .querySelector("input")!;

describe("the updates of a tool (D-121)", () => {
  it("shows the release, asks to approve what it asks for, then puts it in production", async () => {
    let updated = 0;
    const { api, sent } = fakeApi({
      "/api/tools/odoo/source": source,
      "POST /api/tools/odoo/update": { tool: "odoo", version: "1.1.0" },
    });
    const page = await mount(<UpdatePanel tool="odoo" api={api} onUpdated={() => updated++} />);
    expect(page.textContent).toContain("Comes from a marketplace of the workspace");
    expect(page.textContent).toContain("production serves 1.0.0");
    expect(page.textContent).toContain("Update available: 1.1.0");
    expect(page.textContent).toContain("Tickets by team");
    expect(page.textContent).toContain("resources.secrets.ODOO_KEY");
    expect(button(page, "Update production").disabled).toBe(true);
    await click(box(page, "I approve"));
    await click(button(page, "Update production"));
    expect(sent).toEqual([
      {
        method: "POST",
        path: "/api/tools/odoo/update",
        body: { version: "1.1.0", approve: true },
      },
    ]);
    expect(updated).toBe(1);
  });

  it("asks before a build with no release, and saves the automatic update", async () => {
    const { api, sent } = fakeApi({
      "/api/tools/crm/source": {
        kind: "repo",
        repo: "acme/crm",
        productionBranch: "main",
        autoUpdate: false,
        production: null,
        update: {
          version: "1.0.0-preview.main+abc",
          branch: "main",
          release: false,
          changelog: [],
          approvals: [],
        },
      },
      "PUT /api/tools/crm/source": { ...source, kind: "repo", autoUpdate: true, update: null },
      "POST /api/tools/crm/update": { tool: "crm", version: "1.0.0-preview.main+abc" },
    });
    const page = await mount(<UpdatePanel tool="crm" api={api} onUpdated={() => {}} />);
    expect(page.textContent).toContain("GitHub, acme/crm");
    expect(page.textContent).toContain("production follows main");
    expect(page.textContent).toContain("Not a release");
    expect(button(page, "Update production").disabled).toBe(true);
    await click(box(page, "Put it in production without a release"));
    await click(button(page, "Update production"));
    expect(sent.at(-1)!.body).toEqual({ version: "1.0.0-preview.main+abc", withoutRelease: true });
    await click(box(page, "Update by itself"));
    expect(sent.at(-1)).toEqual({
      method: "PUT",
      path: "/api/tools/crm/source",
      body: { autoUpdate: true },
    });
  });
});
