// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { button, cleanup, click, fakeApi, mount, type } from "../../../test-utils";
import { UpdatePanel } from "./update-panel";

afterEach(cleanup);

const release = {
  version: "1.1.0",
  changelog: ["Tickets by team"],
  approvals: ["resources.secrets.ODOO_KEY"],
};
const production = {
  name: "production",
  autoUpdate: false,
  serves: "1.0.0",
  address: "https://acme.test/t/odoo/",
  update: release,
};
const source = {
  kind: "marketplace",
  marketplace: "m1",
  productionBranch: "main",
  autoUpdate: false,
  production: "1.0.0",
  update: release,
  channels: [production],
};
const box = (page: HTMLElement, text: string) =>
  [...page.querySelectorAll("label")]
    .find((l) => l.textContent?.startsWith(text))!
    .querySelector("input")!;

describe("the permanent channels of a tool (D-121, D-125)", () => {
  it("shows the release, asks to approve what it asks for, then updates production", async () => {
    let updated = 0;
    const { api, sent } = fakeApi({
      "/api/tools/odoo/source": source,
      "POST /api/tools/odoo/update": { tool: "odoo", channel: "production", version: "1.1.0" },
    });
    const page = await mount(<UpdatePanel tool="odoo" api={api} onUpdated={() => updated++} />);
    expect(page.textContent).toContain("Comes from a marketplace of the workspace");
    expect(page.textContent).toContain("serves 1.0.0");
    expect(page.textContent).toContain("Release available: 1.1.0");
    expect(page.textContent).toContain("Tickets by team");
    expect(page.textContent).toContain("resources.secrets.ODOO_KEY");
    expect(page.textContent).not.toContain("without a release");
    expect(button(page, "Update Production").disabled).toBe(true);
    await click(box(page, "I approve"));
    await click(button(page, "Update Production"));
    expect(sent).toEqual([
      {
        method: "POST",
        path: "/api/tools/odoo/update",
        body: { version: "1.1.0", approve: true },
      },
    ]);
    expect(updated).toBe(1);
  });

  it("updates another channel by its name, and saves whether it updates by itself", async () => {
    const staging = {
      name: "staging",
      follows: "staging",
      autoUpdate: false,
      serves: null,
      address: "https://acme.test/t/crm~staging/",
      update: {
        version: "2.0.0-preview.staging+abc",
        branch: "staging",
        changelog: [],
        approvals: [],
      },
    };
    const { api, sent } = fakeApi({
      "/api/tools/crm/source": {
        ...source,
        kind: "repo",
        repo: "acme/crm",
        update: null,
        channels: [{ ...production, follows: "main", update: null }, staging],
      },
      "PUT /api/tools/crm/channels/staging": { ...staging, autoUpdate: true },
      "POST /api/tools/crm/update": { tool: "crm", channel: "staging", version: "x" },
    });
    const page = await mount(<UpdatePanel tool="crm" api={api} onUpdated={() => {}} />);
    expect(page.textContent).toContain("GitHub, acme/crm");
    expect(page.textContent).toContain("Up to date with the releases of main.");
    expect(page.textContent).toContain("follows staging");
    await click(button(page, "Update staging"));
    expect(sent.at(-1)!.body).toEqual({ version: "2.0.0-preview.staging+abc", channel: "staging" });
    const card = page.querySelector<HTMLElement>('[aria-label="Channel staging"]')!;
    await click(box(card, "Update by itself"));
    expect(sent.at(-1)).toEqual({
      method: "PUT",
      path: "/api/tools/crm/channels/staging",
      body: { autoUpdate: true },
    });
  });

  it("does not let a release go when the plan finds a conflict, and offers the prompt", async () => {
    const { api } = fakeApi({
      "/api/tools/crm/source": {
        ...source,
        kind: "repo",
        channels: [
          {
            ...production,
            follows: "main",
            update: {
              version: "1.1.0",
              branch: "main",
              changelog: ["x"],
              approvals: [],
              plan: {
                ok: false,
                alreadyServed: false,
                conflicts: [
                  { code: "MIGRATION_MISSING", subject: "0002_other", message: "It lacks it." },
                ],
                requiresAllowDestructive: false,
                migrations: { checked: true, pending: [], destructive: [] },
                prompt: "Fix it on the branch.",
              },
            },
          },
        ],
      },
    });
    const page = await mount(<UpdatePanel tool="crm" api={api} onUpdated={() => {}} />);
    expect(page.textContent).toContain("MIGRATION_MISSING");
    expect(page.textContent).toContain("Copy prompt for your agent");
    expect(button(page, "Update Production").disabled).toBe(true);
  });

  it("adds a channel that follows a branch", async () => {
    const { api, sent } = fakeApi({
      "/api/tools/crm/source": { ...source, kind: "repo", update: null, channels: [production] },
      "POST /api/tools/crm/channels": {
        name: "recette",
        follows: "main",
        autoUpdate: false,
        serves: null,
        address: "x",
        update: null,
      },
    });
    const page = await mount(<UpdatePanel tool="crm" api={api} onUpdated={() => {}} />);
    await click(button(page, "Add a channel"));
    const form = page.querySelector<HTMLElement>('form[aria-label="Add a channel"]')!;
    const [name, follows] = [
      ...form.querySelectorAll<HTMLInputElement>("input[type=text], input:not([type])"),
    ];
    expect(button(form, "Add channel").disabled).toBe(true);
    await type(name!, "recette");
    await type(follows!, "main");
    await click(button(form, "Add channel"));
    expect(sent.at(-1)).toEqual({
      method: "POST",
      path: "/api/tools/crm/channels",
      body: { name: "recette", follows: "main" },
    });
  });
});
