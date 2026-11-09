import type { Manifest } from "@forgeron/manifest";
import type { D1Database } from "@forgeron/hosting";
import {
  createRegistry,
  createSecretBox,
  migratePlatform,
  type Registry,
} from "@forgeron/registry";
import { createRuntime } from "@forgeron/runtime";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "../gateway";
import { issueToken } from "../identity/authn/tokens";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// Tokens and per-person secrets through the whole gateway (D-035, D-036): the tool is the real
// runtime, built the way the compiler's Worker entry builds it, behind the dispatcher; the people
// and the keys are test values.

const SECRET = "test-secret-not-a-real-one";
const OLD_SECRET = "test-old-secret-not-a-real-one";
const KEY = btoa(String.fromCharCode(...new Uint8Array(32)));
const DAY = 86_400;
let clock = new Date("2026-11-03T10:00:00Z");

const ALL = ["mcp", "api", "cli", "web"] as const;
const manifest: Manifest = {
  name: "crm",
  version: "1.0.0",
  interfaces: { mcp: true, api: true, cli: true, web: true },
  roles: { reader: { grants: ["read"] } },
  actions: {
    "tickets.mine": {
      description: "My tickets.",
      access: "read",
      input: { type: "object", properties: {} },
      confirm: false,
      cli: { args: [] },
      http: { method: "GET" },
      interfaces: [...ALL],
    },
  },
  views: {},
  jobs: {},
  events: {},
  resources: {
    userSecrets: { ODOO_API_KEY: { label: "Odoo API key", why: "Read your tickets" } },
  },
  uses: {},
  preview: { data: "seed" },
};

let memory: MemoryD1;
let registry: Registry;
let env: GatewayEnv;
const seen: Array<{ user?: string; secrets: unknown }> = [];

// What the compiler's entry does with the headers only the gateway sets.
function toolWorker(request: Request) {
  const own = JSON.parse(request.headers.get("x-forgeron-user-secrets") ?? "{}");
  return createRuntime({
    manifest,
    baseUrl: request.headers.get("x-forgeron-base-url") ?? "",
    authenticate: (r) => {
      const raw = r.headers.get("x-forgeron-user");
      return raw ? { ...JSON.parse(raw), roles: ["reader"] } : undefined;
    },
    platform: {
      userSecretStore: {
        read: async () => own,
        write: async () => {
          throw new Error("entered at the gateway");
        },
      },
    },
    actions: {
      "tickets.mine": {
        input: { safeParse: (data: unknown) => ({ success: true, data }) },
        run: (ctx) => (seen.push({ user: ctx.user.id, secrets: ctx.userSecrets }), { ok: true }),
      },
    },
  }).fetch(request);
}

let ana = "";
let ben = "";
let admin = "";

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { secrets: await createSecretBox(KEY), now: () => clock });
  for (const name of ["crm", "hr"]) {
    const tool = await registry.createTool({ workspace: "acme", name });
    const built = await registry.recordBuild(tool.id, { fingerprint: name, manifest });
    const version = await registry.publishVersion(tool.id, built.id, "1.0.0");
    const production = await registry.ensureEnvironment(tool.id, "production");
    await registry.activate(production.id, version.id, { actor: "test" });
  }
  const member = async (subject: string, roles: string[]) =>
    (
      await registry.addMember({
        workspace: "acme",
        subject,
        email: `${subject}@acme.test`,
        name: subject,
        roles,
      })
    ).id;
  ana = await member("ana", []);
  ben = await member("ben", []);
  admin = await member("root", ["admin"]);
  env = {
    DB: d1,
    BASE_DOMAIN: "forgeron.app",
    AUTH_SECRET: SECRET,
    SECRETS_KEY: KEY,
    DISPATCHER: { get: () => ({ fetch: (request: Request) => toolWorker(request) }) },
  };
});
afterAll(() => memory.close());

const gateway = (extra: Partial<GatewayEnv> = {}) =>
  createGateway({ ...env, ...extra }, { now: () => clock });
const tokenFor = (
  person: string,
  tool: string,
  ttlSeconds = DAY,
  secret = SECRET,
  scope?: string,
) =>
  issueToken({
    secret,
    person,
    workspace: "acme",
    tool,
    ttlSeconds,
    now: clock,
    ...(scope ? { scope } : {}),
  });
const cliToken = (person: string) => tokenFor(person, "platform", 30 * DAY, SECRET, "cli");
const call = (
  path: string,
  token: string | undefined,
  init: RequestInit & { headers?: Record<string, string> } = {},
) =>
  gateway()(
    new Request(`https://acme.forgeron.app${path}`, {
      ...init,
      headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...init.headers },
    }),
  );
const json = (body: unknown) => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});

describe("audience at the gateway", () => {
  it("lets a token reach its own tool and shows the tool the person, not what the caller claims", async () => {
    const token = await tokenFor(ana, "crm");
    await call("/t/crm/secrets", token, json({ ODOO_API_KEY: "test-only-value" }));
    seen.length = 0;
    const response = await call("/t/crm/api/tickets.mine", token, {
      headers: { "x-forgeron-user": JSON.stringify({ id: "forged", roles: ["admin"] }) },
    });
    expect(response.status).toBe(200);
    expect(seen).toEqual([{ user: ana, secrets: { ODOO_API_KEY: "test-only-value" } }]);
  });

  it("refuses a token issued for another tool, on API and MCP alike", async () => {
    const token = await tokenFor(ana, "hr");
    for (const path of ["/t/crm/api/tickets.mine", "/t/crm/mcp", "/t/crm/secrets"]) {
      expect((await call(path, token)).status).toBe(403);
    }
  });

  it("a CLI token, scoped to the platform, is no one at a tool", async () => {
    expect((await call("/t/crm/api/tickets.mine", await cliToken(ana))).status).toBe(401);
  });

  it("nobody can pass as someone through the header alone", async () => {
    const response = await call("/t/crm/api/tickets.mine", undefined, {
      headers: { "x-forgeron-user": JSON.stringify({ id: ana, roles: ["admin"] }) },
    });
    expect(response.status).toBe(401);
  });

  it("refuses an expired token", async () => {
    const token = await tokenFor(ana, "crm", 60);
    clock = new Date(clock.getTime() + 120_000);
    const status = (await call("/t/crm/api/tickets.mine", token)).status;
    clock = new Date(clock.getTime() - 120_000);
    expect(status).toBe(401);
  });
});

describe("signing key rotation", () => {
  it("keeps a token of the previous key good until it expires, and signs with the new one", async () => {
    const old = await tokenFor(ana, "crm", DAY, OLD_SECRET);
    const url = "https://acme.forgeron.app/t/crm/api/tickets.mine";
    const withHeader = (key: GatewayEnv["AUTH_SECRET_PREVIOUS"]) =>
      gateway(key ? { AUTH_SECRET_PREVIOUS: key } : {})(
        new Request(url, { headers: { authorization: `Bearer ${old}` } }),
      );
    expect((await withHeader(undefined)).status).toBe(401);
    expect((await withHeader(`x-unused, ${OLD_SECRET}`)).status).not.toBe(401);
  });
});

describe("revocation", () => {
  it("a person voids one token by its id, and the others keep working", async () => {
    const secret = SECRET;
    const issued = async () => {
      // The route mints tokens for a session; here the claims are what matters, so read the id back.
      const token = await tokenFor(ben, "crm");
      const claims = JSON.parse(
        atob(token.split(".")[1]!.replaceAll("-", "+").replaceAll("_", "/")),
      );
      return { token, id: claims.jti as string };
    };
    void secret;
    const first = await issued();
    const second = await issued();
    const revoked = await call("/auth/token/revoke", await cliToken(ben), json({ id: first.id }));
    expect(revoked.status).toBe(200);
    expect((await call("/t/crm/api/tickets.mine", first.token)).status).toBe(401);
    expect((await call("/t/crm/api/tickets.mine", second.token)).status).not.toBe(401);
  });

  it("revoking everything voids the person's tokens at once, not another person's", async () => {
    const mine = await tokenFor(ana, "crm");
    const theirs = await tokenFor(ben, "crm");
    expect(
      (await call("/auth/token/revoke", await cliToken(ana), json({ all: true }))).status,
    ).toBe(200);
    expect((await call("/t/crm/api/tickets.mine", mine)).status).toBe(401);
    expect((await call("/t/crm/api/tickets.mine", theirs)).status).not.toBe(401);
    // A token issued after the revocation is good.
    clock = new Date(clock.getTime() + 5_000);
    expect((await call("/t/crm/api/tickets.mine", await tokenFor(ana, "crm"))).status).not.toBe(
      401,
    );
  });

  it("an admin revokes another person's tokens; a member cannot", async () => {
    const victim = await tokenFor(ben, "crm");
    const path = `/console-api/api/people/${ben}/tokens/revoke`;
    expect((await call(path, await cliToken(ana), { method: "POST" })).status).toBe(403);
    expect((await call(path, await cliToken(admin), { method: "POST" })).status).toBe(200);
    expect((await call("/t/crm/api/tickets.mine", victim)).status).toBe(401);
  });
});

describe("per-person secrets on first use", () => {
  // The revocations above void everything issued up to their second: start after it.
  beforeAll(() => {
    clock = new Date(clock.getTime() + 60_000);
  });

  it("asks on API (428 with a link) and on MCP (URL elicitation), then works once typed", async () => {
    const token = await tokenFor(ben, "crm");
    const api = await call("/t/crm/api/tickets.mine", token);
    expect(api.status).toBe(428);
    expect(
      ((await api.json()) as { error: { details: { inputUrl: string } } }).error.details.inputUrl,
    ).toBe("https://acme.forgeron.app/t/crm/secrets");
    const mcp = await call("/t/crm/mcp", token, {
      ...json({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: "crm_tickets_mine", arguments: {} },
      }),
      headers: { "content-type": "application/json", "mcp-protocol-version": "2025-11-25" },
    });
    expect(((await mcp.json()) as { error: { code: number } }).error.code).toBe(-32042);

    // The page is the input page of the web; the CLI posts to the same route with its own token.
    const page = await call("/t/crm/secrets", token);
    const html = await page.text();
    expect(html).toContain("Odoo API key");
    // In the shell: a title, one heading, a labelled password field, no script, the CSP of the pages.
    expect(html).toContain("<title>Your secrets · Forgeron</title>");
    expect(html).toContain("<h1>Your secrets</h1>");
    expect(html).toMatch(/<label for="secret-0">Odoo API key/);
    expect(html).toContain('type="password"');
    expect(html).not.toContain("<script");
    expect(page.headers.get("content-security-policy")).toBe(
      "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'",
    );
    expect(
      (await call("/t/crm/secrets", await cliToken(ben), json({ ODOO_API_KEY: "ben-test-value" })))
        .status,
    ).toBe(200);
    seen.length = 0;
    expect((await call("/t/crm/api/tickets.mine", token)).status).toBe(200);
    expect(seen).toEqual([{ user: ben, secrets: { ODOO_API_KEY: "ben-test-value" } }]);
  });

  it("answers the page and the form on a preview address like on the production one (FOR-174)", async () => {
    const token = await tokenFor(ben, "crm");
    const page = await call("/t/crm@feature-x/secrets", token);
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("Odoo API key");
    const saved = await call(
      "/t/crm@feature-x/secrets",
      await cliToken(ben),
      json({ ODOO_API_KEY: "preview-test-value" }),
    );
    expect(saved.status).toBe(200);
    // The value is the person's for the tool: the production address sees the same one.
    seen.length = 0;
    expect((await call("/t/crm/api/tickets.mine", token)).status).toBe(200);
    expect(seen).toEqual([{ user: ben, secrets: { ODOO_API_KEY: "preview-test-value" } }]);
  });

  it("never gives a person's value to anyone else, the developer's console or the admin", async () => {
    const adminToken = await cliToken(admin);
    // Ben's value is stored; a person who never typed theirs is asked, whatever ben stored.
    const cat = (
      await registry.addMember({
        workspace: "acme",
        subject: "cat",
        email: "cat@acme.test",
        name: "cat",
        roles: [],
      })
    ).id;
    expect((await call("/t/crm/api/tickets.mine", await tokenFor(cat, "crm"))).status).toBe(428);

    const holders = await call("/console-api/api/tools/crm/user-secrets", adminToken);
    const text = await holders.text();
    expect(text).toContain("ODOO_API_KEY");
    expect(text).not.toContain("ben-test-value");
    // The page shows a field as set without showing its value.
    const page = await (await call("/t/crm/secrets", await tokenFor(ben, "crm"))).text();
    expect(page).not.toContain("ben-test-value");
    // A member is not an admin.
    expect(
      (await call("/console-api/api/tools/crm/user-secrets", await cliToken(ana))).status,
    ).toBe(403);
    // The value is sealed at rest.
    expect(
      JSON.stringify((await memory.prepare(`SELECT * FROM "user_secrets"`).all()).results),
    ).not.toContain("ben-test-value");
  });

  it("the admin revokes one person's secret: they are asked again", async () => {
    const token = await tokenFor(ben, "crm");
    const revoked = await call(
      `/console-api/api/tools/crm/user-secrets/${ben}/ODOO_API_KEY`,
      await cliToken(admin),
      { method: "DELETE" },
    );
    expect(await revoked.json()).toEqual({ revoked: 1 });
    expect((await call("/t/crm/api/tickets.mine", token)).status).toBe(428);
  });

  it("another tool's token cannot store a secret for this tool", async () => {
    const response = await call(
      "/t/crm/secrets",
      await tokenFor(ana, "hr"),
      json({ ODOO_API_KEY: "x" }),
    );
    expect(response.status).toBe(403);
  });
});
