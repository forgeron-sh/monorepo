import type { D1Database } from "@forgeron/hosting";
import {
  createRegistry,
  createSecretBox,
  marketplaceSource,
  migratePlatform,
  TEMPLATE_WORKSPACE,
  type Registry,
} from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { ConsolePerson } from "./app";
import { ADMIN, describeRouteMatrix } from "./route-matrix";
import { platformCaller } from "./test-app";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// 32 bytes of zeros: a test key. The GitHub token below is no real token either.
const TEST_KEY = btoa(String.fromCharCode(...new Uint8Array(32)));
const TOKEN = "test-github-token";
const API = "https://api.github.com";

const encode = (s: string) => new TextEncoder().encode(s);
const hex = async (bytes: Uint8Array) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

/** A bundle as `forgeron bundle` writes it (D-115), for a tool with a README and a guide. */
async function bundleOf(name: string, version: string) {
  const readme = `# ${name}, technical`;
  const guide = `# ${name} for you`;
  const file = async (t: string) => ({ size: encode(t).length, hash: await hex(encode(t)) });
  const manifest = {
    name,
    version,
    title: "Odoo",
    summary: "Your tickets from Claude.",
    docs: { readme: await file(readme), guide: await file(guide), assets: [] },
    interfaces: { mcp: true, api: false, cli: true, web: false },
    roles: { support: { label: "Support", grants: ["read"] } },
    actions: {},
    views: {},
    jobs: {},
    events: {},
    resources: { network: { allow: ["*.odoo.com"], why: "Odoo" } },
    uses: {},
    preview: { data: "seed" },
  };
  return JSON.stringify({
    format: "forgeron.bundle/1",
    name,
    version,
    build: {
      manifest,
      worker: "export default {}",
      fingerprint: `${name}-${version}`,
      docs: { readme, guide, assets: [] },
    },
  });
}

/** A simulated GitHub: what each address answers, and every request it saw. */
let routes: Record<string, () => Response>;
const seen: Request[] = [];
const github: typeof fetch = async (input, init) => {
  const request = new Request(input, init);
  seen.push(request);
  const answer = routes[request.url];
  return answer ? answer() : new Response("{}", { status: 404 });
};

async function publish(
  repo: string,
  tools: Array<{ name: string; version: string; body?: string; sha?: string }>,
) {
  const entries: unknown[] = [];
  for (const t of tools) {
    const body = t.body ?? (await bundleOf(t.name, t.version));
    const asset = `${t.name}-${t.version}.forgeron.json`;
    const assetUrl = `${API}/repos/${repo}/releases/assets/${t.name}`;
    routes[`${API}/repos/${repo}/releases/tags/${encodeURIComponent(`${t.name}@${t.version}`)}`] =
      () => Response.json({ assets: [{ name: asset, url: assetUrl, size: body.length }] });
    routes[assetUrl] = () => new Response(body);
    entries.push({
      name: t.name,
      version: t.version,
      release: `${t.name}@${t.version}`,
      asset,
      sha256: t.sha ?? (await hex(encode(body))),
    });
  }
  routes[`${API}/repos/${repo}/contents/forgeron-marketplace.json`] = () =>
    new Response(JSON.stringify({ name: "edicia", title: "Outils Edicia", tools: entries }));
}

let memory: MemoryD1;
let registry: Registry;
let person: ConsolePerson | undefined;
let call: (request: Request) => Promise<Response | undefined>;

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { secrets: await createSecretBox(TEST_KEY) });
  call = platformCaller({
    registry,
    who: () => person,
    marketplaceFetch: github,
    officialMarketplace: "forgeron-sh/templates",
  });
});
afterAll(() => memory.close());
beforeEach(() => {
  routes = {};
  seen.length = 0;
});

const as = async (request: Request, who: ConsolePerson | undefined) => {
  person = who;
  return (await call(request))!;
};
const through = (request: Request) => as(request, ADMIN);
const url = (path: string) => `https://acme.forgeron.test${path}`;
const post = (path: string, body?: unknown) =>
  new Request(url(path), {
    method: "POST",
    ...(body === undefined
      ? {}
      : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
  });
const admin = { access: "admin" as const, call: as };

describeRouteMatrix({
  title: "GET marketplaces",
  ...admin,
  method: "GET",
  path: "/api/marketplaces",
});
describeRouteMatrix({
  title: "POST add a marketplace",
  ...admin,
  method: "POST",
  path: "/api/marketplaces",
  valid: { repo: "matrix/repo" },
  invalid: [{}, { repo: 3 }],
});
describeRouteMatrix({
  title: "GET what the official marketplace offers",
  ...admin,
  method: "GET",
  path: "/api/marketplaces/official/tools",
});

async function add(repo: string, token?: string) {
  const res = await through(post("/api/marketplaces", { repo, ...(token ? { token } : {}) }));
  expect(res.status).toBe(201);
  return (await res.json()) as { id: string; hasToken: boolean };
}

describe("the marketplace routes (D-116)", () => {
  it("list the official catalogue first, then the added ones, never with a token", async () => {
    const m = await add("edicia-sh/tools", TOKEN);
    expect(m.hasToken).toBe(true);
    const res = await through(new Request(url("/api/marketplaces")));
    const text = await res.text();
    expect(text).not.toContain(TOKEN);
    const body = JSON.parse(text) as { marketplaces: Array<{ id: string; official: boolean }> };
    expect(body.marketplaces[0]).toMatchObject({
      id: "official",
      official: true,
      repo: "forgeron-sh/templates",
    });
    expect(body.marketplaces.some((x) => x.id === m.id && !x.official)).toBe(true);
    expect((await through(post("/api/marketplaces", { repo: "edicia-sh/tools" }))).status).toBe(
      409,
    );
    expect((await through(post("/api/marketplaces", { repo: "not a repo" }))).status).toBe(400);
  });

  it("sync with the token, then list, read the card and install the tool", async () => {
    const m = await add("acme/tools-sync", TOKEN);
    await publish("acme/tools-sync", [{ name: "odoo", version: "1.0.0" }]);
    const synced = await through(post(`/api/marketplaces/${m.id}/sync`));
    expect(synced.status).toBe(200);
    expect(await synced.json()).toEqual({
      title: "Outils Edicia",
      tools: [{ name: "odoo", version: "1.0.0", status: "added" }],
    });
    // The token went to the API only.
    for (const r of seen) {
      expect(new URL(r.url).host).toBe("api.github.com");
      expect(r.headers.get("authorization")).toBe(`Bearer ${TOKEN}`);
    }
    // A second sync downloads nothing.
    seen.length = 0;
    const again = (await (await through(post(`/api/marketplaces/${m.id}/sync`))).json()) as {
      tools: Array<{ status: string }>;
    };
    expect(again.tools[0]!.status).toBe("current");
    expect(seen).toHaveLength(1);

    const list = await through(new Request(url(`/api/marketplaces/${m.id}/tools`)));
    expect(await list.json()).toEqual({
      tools: [
        {
          name: "odoo",
          title: "Odoo",
          summary: "Your tickets from Claude.",
          version: "1.0.0",
          resources: ["resources.network"],
          installed: false,
        },
      ],
    });
    const card = (await (
      await through(new Request(url(`/api/marketplaces/${m.id}/tools/odoo`)))
    ).json()) as Record<string, unknown>;
    expect(card).toMatchObject({
      readme: "# odoo, technical",
      guide: "# odoo for you",
      network: ["*.odoo.com"],
      roles: [{ name: "support", label: "Support" }],
      database: false,
    });

    const installed = await through(post(`/api/marketplaces/${m.id}/tools/odoo/install`));
    expect(installed.status).toBe(201);
    expect(await installed.json()).toEqual({
      tool: "odoo",
      version: "1.0.0",
      approvals: [{ resource: "resources.network", kind: "resource.added" }],
    });
    expect((await through(post(`/api/marketplaces/${m.id}/tools/odoo/install`))).status).toBe(409);
    expect(await registry.findTool("acme", "odoo")).toBeDefined();
  });

  it("refuse a bundle whose hash or content is not what the index says, and keep the others", async () => {
    const m = await add("acme/tools-bad");
    const good = await bundleOf("good", "1.0.0");
    const other = await bundleOf("other", "2.0.0");
    await publish("acme/tools-bad", [
      { name: "good", version: "1.0.0", body: good },
      { name: "hashed", version: "1.0.0", sha: "0".repeat(64) },
      { name: "lying", version: "1.0.0", body: other },
    ]);
    const res = (await (await through(post(`/api/marketplaces/${m.id}/sync`))).json()) as {
      tools: Array<{ name: string; status: string; reason?: string }>;
    };
    expect(res.tools.map((t) => [t.name, t.status])).toEqual([
      ["good", "added"],
      ["hashed", "refused"],
      ["lying", "refused"],
    ]);
    expect(res.tools[1]!.reason).toMatch(/SHA-256/);
    expect(res.tools[2]!.reason).toMatch(/another tool or version/);
    expect(await registry.listTemplates(marketplaceSource(m.id))).toHaveLength(1);
  });

  it("answer 502 with a message GitHub's refusal explains, and record it", async () => {
    const m = await add("acme/private");
    const res = await through(post(`/api/marketplaces/${m.id}/sync`));
    expect(res.status).toBe(502);
    expect(await res.json()).toMatchObject({
      error: "MARKETPLACE_UNREADABLE",
      message: expect.stringMatching(/read token/),
    });
    expect(await registry.findMarketplace("acme", m.id)).toMatchObject({
      syncError: expect.stringMatching(/read token/),
    });
  });

  it("sync the official catalogue into the templates, and install through a plan", async () => {
    await publish("forgeron-sh/templates", [{ name: "crm-x", version: "3.0.0" }]);
    expect((await through(post("/api/marketplaces/official/sync"))).status).toBe(200);
    expect((await registry.listTemplates()).map((t) => t.name)).toContain("crm-x");
    expect(seen.every((r) => r.headers.get("authorization") === null)).toBe(true);
    const planned = await through(post("/api/marketplaces/official/tools/crm-x/install-plan"));
    expect(planned.status).toBe(201);
    const { plan } = (await planned.json()) as { plan: string };
    expect((await through(post(`/api/install-plans/${plan}/install`))).status).toBe(201);
    expect(await registry.findTool("acme", "crm-x")).toBeDefined();
    expect(await registry.findTool(TEMPLATE_WORKSPACE, "crm-x")).toBeDefined();
  });

  it("remove a marketplace of the workspace only, and never the official one", async () => {
    const m = await add("acme/remove-me");
    const other = platformCaller({
      registry,
      who: () => ADMIN,
      workspace: "other",
      marketplaceFetch: github,
    });
    const del = (id: string) => new Request(url(`/api/marketplaces/${id}`), { method: "DELETE" });
    expect((await other(del(m.id)))!.status).toBe(404);
    expect((await through(del("official"))).status).toBe(404);
    expect((await through(del(m.id))).status).toBe(204);
    expect(await registry.findMarketplace("acme", m.id)).toBeUndefined();
  });
});
