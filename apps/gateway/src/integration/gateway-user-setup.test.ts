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

// A tool's setup through the whole gateway (D-097): the page that asks for it, what the tool gets,
// the 428 while a required value is missing, and what a person can and cannot reach. The tool is the
// real runtime behind the dispatcher; the people, the keys and the values are test values.

const SECRET = "test-secret-not-a-real-one";
const KEY = btoa(String.fromCharCode(...new Uint8Array(32)));
const now = new Date("2026-11-09T10:00:00Z");

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
      interfaces: ["mcp", "api", "cli", "web"],
    },
  },
  views: {},
  jobs: {},
  events: {},
  resources: {
    userSecrets: { ODOO_API_KEY: { label: "Odoo API key", why: "Read your tickets" } },
  },
  setup: {
    fields: {
      firstName: { type: "text", label: "First name", required: true, maxLength: 20 },
      team: { type: "choice", label: "Team", required: false, options: ["support", "sales"] },
    },
  },
  uses: {},
  preview: { data: "seed" },
};

const seen: Array<{ user: string; setup: unknown; secrets: unknown }> = [];

// What the compiler's entry does with the headers only the gateway sets.
function toolWorker(request: Request) {
  const own = JSON.parse(request.headers.get("x-forgeron-user-secrets") ?? "{}");
  const setupHeader = request.headers.get("x-forgeron-user-setup");
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
      ...(setupHeader !== null ? { userSetup: JSON.parse(setupHeader) } : {}),
    },
    actions: {
      "tickets.mine": {
        input: { safeParse: (data: unknown) => ({ success: true, data }) },
        run: (ctx) => (
          seen.push({ user: ctx.user.id, setup: ctx.user.setup, secrets: ctx.userSecrets }),
          { ok: true }
        ),
      },
    },
  }).fetch(request);
}

let memory: MemoryD1;
let registry: Registry;
let env: GatewayEnv;
let ana = "";
let ben = "";
let admin = "";
let toolId = "";

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { secrets: await createSecretBox(KEY), now: () => now });
  const tool = await registry.createTool({ workspace: "acme", name: "crm" });
  toolId = tool.id;
  const built = await registry.recordBuild(tool.id, { fingerprint: "crm", manifest });
  const version = await registry.publishVersion(tool.id, built.id, "1.0.0");
  const production = await registry.ensureEnvironment(tool.id, "production");
  await registry.activate(production.id, version.id, { actor: "test" });
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

const gateway = () => createGateway(env, { now: () => now });
const tokenFor = (person: string, tool = "crm", scope?: string) =>
  issueToken({
    secret: SECRET,
    person,
    workspace: "acme",
    tool,
    ttlSeconds: 86_400,
    now,
    ...(scope ? { scope } : {}),
  });
const call = (path: string, token: string | undefined, init: RequestInit = {}) =>
  gateway()(
    new Request(`https://acme.forgeron.app${path}`, {
      ...init,
      headers: {
        ...(token ? { authorization: `Bearer ${token}` } : {}),
        ...(init.headers as Record<string, string> | undefined),
      },
    }),
  );
const json = (body: unknown) => ({
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify(body),
});
const form = (body: Record<string, string>) => ({
  method: "POST",
  headers: { "content-type": "application/x-www-form-urlencoded" },
  body: new URLSearchParams(body),
});

describe("a tool's setup through the gateway (D-097)", () => {
  it("asks for the plain fields and the secrets together, with one link, until they are given", async () => {
    const token = await tokenFor(ana);
    const asked = await call("/t/crm/api/tickets.mine", token);
    expect(asked.status).toBe(428);
    const body = (await asked.json()) as {
      error: { details: { inputUrl: string; missing: Array<{ name: string }> } };
    };
    expect(body.error.details.inputUrl).toBe("https://acme.forgeron.app/t/crm/setup");
    expect(body.error.details.missing.map((m) => m.name)).toEqual(["firstName", "ODOO_API_KEY"]);

    // Plain values alone are not enough: the secret is still missing.
    expect((await call("/t/crm/setup", token, json({ firstName: "Ana" }))).status).toBe(200);
    const stillMissing = (await (await call("/t/crm/api/tickets.mine", token)).json()) as any;
    expect(stillMissing.error.details.missing.map((m: any) => m.name)).toEqual(["ODOO_API_KEY"]);

    expect(
      (await call("/t/crm/setup", token, json({ ODOO_API_KEY: "test-only-value" }))).status,
    ).toBe(200);
    seen.length = 0;
    const done = await call("/t/crm/api/tickets.mine", token);
    expect(done.status).toBe(200);
    expect(seen).toEqual([
      { user: ana, setup: { firstName: "Ana" }, secrets: { ODOO_API_KEY: "test-only-value" } },
    ]);
  });

  it("shows the page, prefilled for its owner, with the secret as set and never its value", async () => {
    const page = await call("/t/crm/setup", await tokenFor(ana));
    const html = await page.text();
    expect(page.status).toBe(200);
    expect(html).toContain("<h1>Your setup</h1>");
    expect(html).toMatch(/<label for="field-0">First name<\/label>/);
    expect(html).toContain('value="Ana"');
    expect(html).toContain("Team (optional)");
    expect(html).toContain("<select");
    expect(html).toContain('type="password"');
    expect(html).toContain("Set");
    expect(html).not.toContain("test-only-value");
    expect(html).not.toContain("<script");
  });

  it("keeps each person's values apart: another person sees and gets none of them", async () => {
    const token = await tokenFor(ben);
    const html = await (await call("/t/crm/setup", token)).text();
    expect(html).not.toContain('value="Ana"');
    expect((await call("/t/crm/api/tickets.mine", token)).status).toBe(428);
  });

  it("works from the web form and checks it: required, choice and length, all or none", async () => {
    const token = await tokenFor(ben);
    const empty = await call(
      "/t/crm/setup",
      token,
      form({ firstName: "", team: "", ODOO_API_KEY: "" }),
    );
    expect(empty.status).toBe(400);
    expect(await empty.text()).toContain("This is required.");
    const bad = await call(
      "/t/crm/setup",
      token,
      form({ firstName: "Ben", team: "marketing", ODOO_API_KEY: "k" }),
    );
    expect(bad.status).toBe(400);
    expect(await bad.text()).toContain("Choose one of: support, sales.");
    // Nothing was kept, not even the valid part.
    expect(await registry.readUserSetup(toolId, ben)).toEqual({});
    expect(await registry.readUserSecrets(toolId, ben)).toEqual({});

    const tooLong = await call("/t/crm/setup", token, json({ firstName: "x".repeat(21) }));
    expect(tooLong.status).toBe(400);
    expect(await tooLong.json()).toMatchObject({
      error: { fields: { firstName: expect.any(String) } },
    });

    const ok = await call(
      "/t/crm/setup",
      token,
      form({ firstName: "Ben", team: "sales", ODOO_API_KEY: "ben-test-value" }),
    );
    expect(ok.status).toBe(200);
    expect(await registry.readUserSetup(toolId, ben)).toEqual({ firstName: "Ben", team: "sales" });
    seen.length = 0;
    expect((await call("/t/crm/api/tickets.mine", token)).status).toBe(200);
    expect(seen[0]).toMatchObject({ setup: { firstName: "Ben", team: "sales" } });
  });

  it("answers on /secrets and on a preview address like on /setup, and refuses an unknown field", async () => {
    const token = await tokenFor(ana);
    expect((await call("/t/crm/secrets", token)).status).toBe(200);
    expect((await call("/t/crm@feature-x/setup", token)).status).toBe(200);
    const unknown = await call("/t/crm/setup", token, json({ nickname: "x" }));
    expect(unknown.status).toBe(400);
  });

  it("is for the person: another tool's token and a CLI-scoped one for another person's tool are refused", async () => {
    expect((await call("/t/crm/setup", await tokenFor(ana, "hr"))).status).toBe(403);
    expect((await call("/t/crm/setup", undefined)).status).toBe(401);
  });

  it("cannot be forged: the header a caller sends is dropped, the gateway's is what the tool sees", async () => {
    const token = await tokenFor(ben);
    seen.length = 0;
    const response = await call("/t/crm/api/tickets.mine", token, {
      headers: { "x-forgeron-user-setup": JSON.stringify({ firstName: "Forged" }) },
    });
    expect(response.status).toBe(200);
    expect(seen[0]).toMatchObject({ setup: { firstName: "Ben", team: "sales" } });
  });

  it("is listed and cleared by an admin, who then sees the person asked again", async () => {
    expect(await registry.listUserSetup(toolId)).toEqual([
      { person: ana, values: { firstName: "Ana" } },
      { person: ben, values: { firstName: "Ben", team: "sales" } },
    ]);
    expect(await registry.clearUserSetup(toolId, ana)).toBe(1);
    expect((await call("/t/crm/api/tickets.mine", await tokenFor(ana))).status).toBe(428);
    expect(admin).not.toBe("");
  });
});
