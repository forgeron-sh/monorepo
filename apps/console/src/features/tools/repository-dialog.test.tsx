// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { button, cleanup, click, fakeApi, mount, type } from "../../test-utils";
import { RepositoryDialog } from "./repository-dialog";

afterEach(cleanup);

describe("adding a tool from GitHub (D-121)", () => {
  it("creates the tool and shows its token once, with the steps", async () => {
    let added = 0;
    const { api, sent } = fakeApi({
      "POST /api/tools/from-repository": {
        tool: "odoo",
        repo: "edicia-sh/odoo",
        productionBranch: "main",
        token: "test-token-not-real",
        expiresAt: "2027-11-10T00:00:00.000Z",
      },
    });
    await mount(<RepositoryDialog api={api} onClose={() => {}} onAdded={() => added++} />);
    const dialog = () => document.querySelector<HTMLElement>('[role="dialog"]')!;
    const inputs = () => [...dialog().querySelectorAll<HTMLInputElement>("input")];
    expect(button(dialog(), "Add").disabled).toBe(true);
    await type(inputs()[0]!, "odoo");
    await type(inputs()[1]!, "not a repo");
    expect(button(dialog(), "Add").disabled).toBe(true);
    await type(inputs()[1]!, "edicia-sh/odoo");
    await click(button(dialog(), "Add"));
    expect(sent).toEqual([
      {
        method: "POST",
        path: "/api/tools/from-repository",
        body: { name: "odoo", repo: "edicia-sh/odoo", productionBranch: "main" },
      },
    ]);
    expect(added).toBe(1);
    expect(dialog().textContent).toContain("odoo is added");
    expect(dialog().textContent).toContain("test-token-not-real");
    expect(dialog().textContent).toContain("FORGERON_TOKEN");
    expect(dialog().textContent).toContain("The token is shown once.");
  });
});
