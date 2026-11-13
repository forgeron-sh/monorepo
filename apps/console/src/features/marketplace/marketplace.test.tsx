// @vitest-environment jsdom
import { afterEach, describe, expect, it, vi } from "vitest";
import type { PageProps } from "../../shell/page-props";
import {
  button,
  cleanup,
  click,
  fakeApi,
  field,
  mount,
  NOW,
  refusal,
  type,
} from "../../test-utils";
import type { WorkspaceInfo } from "../../workspace";
import MarketplacePage from "./pages/marketplace-page";
import ToolSheet from "./pages/tool-sheet";

afterEach(cleanup);

const props = (api: PageProps["api"], go = vi.fn<(href: string) => void>()): PageProps => ({
  ws: {
    workspace: "acme",
    person: { teams: ["admin"], permissions: ["marketplace:write"] },
  } as unknown as WorkspaceInfo,
  api,
  now: () => NOW,
  go,
  params: {},
});

const official = {
  id: "official",
  repo: "forgeron-sh/templates",
  title: null,
  official: true,
  hasToken: false,
  syncedAt: null,
  syncError: null,
};
const edicia = {
  id: "m1",
  repo: "edicia-sh/tools",
  title: "Outils Edicia",
  official: false,
  hasToken: true,
  syncedAt: "2026-11-03T09:00:00Z",
  syncError: null,
};
const odoo = {
  name: "odoo",
  title: "Odoo gateway",
  summary: "Your tickets from Claude.",
  version: "1.0.0",
  resources: ["resources.network"],
  installed: false,
};

describe("the marketplace screen (D-116)", () => {
  it("shows a tab per marketplace and what the selected one offers", async () => {
    const { api } = fakeApi({
      "/api/marketplaces": { marketplaces: [official, edicia] },
      "/api/marketplaces/official/tools": { tools: [] },
      "/api/marketplaces/m1/tools": { tools: [odoo] },
    });
    const container = await mount(<MarketplacePage {...props(api)} />);
    expect([...container.querySelectorAll("[role=tab]")].map((t) => t.textContent)).toEqual([
      "Official",
      "Outils Edicia",
    ]);
    expect(container.textContent).toContain("Nothing to install yet");
    await click(button(container, "Outils Edicia"));
    expect(container.textContent).toContain("Odoo gateway");
    expect(container.textContent).toContain("Asks for 1");
    expect(container.textContent).toContain("private, read with a token");
  });

  it("adds a marketplace with its token, syncs it at once and opens its tab", async () => {
    const { api, sent } = fakeApi({
      "/api/marketplaces": { marketplaces: [official] },
      "/api/marketplaces/official/tools": { tools: [] },
      "/api/marketplaces/m1/tools": { tools: [] },
      "POST /api/marketplaces": { ...edicia, title: null, syncedAt: null },
      "POST /api/marketplaces/m1/sync": { title: "Outils Edicia", tools: [] },
    });
    const container = await mount(<MarketplacePage {...props(api)} />);
    await click(button(container, "Add a marketplace"));
    await type(field(document.body, "Repository"), "edicia-sh/tools");
    await type(field(document.body, "Read token"), "test-token");
    await click(button(document.body, "Add"));
    expect(sent.map((s) => [s.method, s.path, s.body])).toEqual([
      ["POST", "/api/marketplaces", { repo: "edicia-sh/tools", token: "test-token" }],
      ["POST", "/api/marketplaces/m1/sync", undefined],
    ]);
  });

  it("says why a sync failed", async () => {
    const { api } = fakeApi({
      "/api/marketplaces": { marketplaces: [official, edicia] },
      "/api/marketplaces/official/tools": { tools: [] },
      "/api/marketplaces/m1/tools": { tools: [] },
      "POST /api/marketplaces/m1/sync": () => {
        throw refusal(502, "GitHub refused the token for edicia-sh/tools.");
      },
    });
    const container = await mount(<MarketplacePage {...props(api)} />);
    await click(button(container, "Outils Edicia"));
    await click(button(container, "Sync"));
    expect(container.textContent).toContain("GitHub refused the token for edicia-sh/tools.");
  });
});

describe("the technical sheet of a tool", () => {
  const card = {
    ...odoo,
    description: null,
    publishedAt: "2026-11-01T00:00:00Z",
    readme: "# Technical",
    guide: "# For the agents",
    interfaces: { mcp: true, api: false, cli: true, web: false },
    profiles: [{ name: "support", label: "Support" }],
    actions: [{ name: "tickets.list", access: "read", description: "Lists tickets." }],
    network: ["*.odoo.com"],
    secrets: [],
    userSecrets: [{ name: "ODOO_API_KEY", label: "Odoo API key" }],
    connectors: [],
    database: false,
    changelog: [],
  };

  it("shows what the tool asks for, then installs it after a confirmation", async () => {
    const go = vi.fn<(href: string) => void>();
    const { api, sent } = fakeApi({
      "/api/marketplaces/m1/tools/odoo": card,
      "POST /api/marketplaces/m1/tools/odoo/install": {
        tool: "odoo",
        version: "1.0.0",
        approvals: [{ resource: "resources.network", kind: "resource.added" }],
        production: true,
      },
    });
    const container = await mount(<ToolSheet {...props(api, go)} id="m1" tool="odoo" />);
    expect(container.textContent).toContain("*.odoo.com");
    expect(container.textContent).toContain("Odoo API key");
    await click(button(container, "What its users read"));
    expect(container.textContent).toContain("For the agents");
    await click(button(container, "Install"));
    expect(document.body.textContent).toContain("resources.network");
    const confirm = () =>
      [...document.querySelectorAll<HTMLButtonElement>("[role=dialog] button")].find(
        (b) => b.textContent === "Install",
      )!;
    // What it asks for is approved in the dialog (D-121): not before the box is ticked.
    expect(confirm().disabled).toBe(true);
    await click(document.querySelector("[role=dialog] input[type=checkbox]"));
    await click(confirm());
    expect(sent.map((s) => s.path)).toEqual(["/api/marketplaces/m1/tools/odoo/install"]);
    expect(go).toHaveBeenCalledWith("/admin/tools/odoo");
  });
});
