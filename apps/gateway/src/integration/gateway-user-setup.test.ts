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
import { openSession } from "../identity/authn/session";
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
    "setup.check": {
      description: "Checks a setup.",
      access: "read",
      input: { type: "object", properties: {} },
      confirm: false,
      cli: { args: [] },
      http: { method: "GET" },
      interfaces: [],
    },
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
    userSecrets: {
      ODOO_API_KEY: { label: "Odoo API key", why: "Read your tickets", kind: "odoo.api-key" },
    },
  },
  setup: {
    fields: {
      firstName: { type: "text", label: "First name", required: true, maxLength: 20 },
      team: { type: "choice", label: "Team", required: false, options: ["support", "sales"] },
    },
    check: "setup.check",
  },
  uses: {},
  preview: { data: "seed" },
};

const seen: Array<{ user: string; setup: unknown; secrets: unknown }> = [];
// What the tool's setup check was asked about, to prove it sees the values about to be kept.
const checked: Array<{ setup: unknown; secrets: unknown }> = [];

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
      "setup.check": {
        input: { safeParse: (data: unknown) => ({ success: true, data }) },
        run: (ctx) => {
          checked.push({ setup: ctx.user.setup, secrets: ctx.userSecrets });
          return {
            errors: {
              ...(ctx.user.setup.firstName === "Nobody"
                ? { firstName: "That name is not accepted." }
                : {}),
              ...(ctx.userSecrets.ODOO_API_KEY === "wrong"
                ? { ODOO_API_KEY: "Odoo refused this key." }
                : {}),
            },
          };
        },
      },
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
let hrId = "";

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
  // A second tool that asks for the same kind of secret (D-105).
  const hr = await registry.createTool({ workspace: "acme", name: "hr" });
  hrId = hr.id;
  const hrBuilt = await registry.recordBuild(hr.id, {
    fingerprint: "hr",
    manifest: { ...manifest, name: "hr" },
  });
  const hrVersion = await registry.publishVersion(hr.id, hrBuilt.id, "1.0.0");
  const hrProduction = await registry.ensureEnvironment(hr.id, "production");
  await registry.activate(hrProduction.id, hrVersion.id, { actor: "test" });
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
    // Ordered by person id, which is random: compare as a set.
    const listed = await registry.listUserSetup(toolId);
    expect(listed).toHaveLength(2);
    expect(listed).toEqual(
      expect.arrayContaining([
        { person: ana, values: { firstName: "Ana" } },
        { person: ben, values: { firstName: "Ben", team: "sales" } },
      ]),
    );
    expect(await registry.clearUserSetup(toolId, ana)).toBe(1);
    expect((await call("/t/crm/api/tickets.mine", await tokenFor(ana))).status).toBe(428);
    expect(admin).not.toBe("");
  });
});

describe("a tool's check of its setup (D-101)", () => {
  let cara = "";
  beforeAll(async () => {
    cara = (
      await registry.addMember({
        workspace: "acme",
        subject: "cara",
        email: "cara@acme.test",
        name: "cara",
        roles: [],
      })
    ).id;
  });

  it("refuses what the tool refuses, keeps nothing, and says which field and why", async () => {
    const token = await tokenFor(cara);
    const refused = await call(
      "/t/crm/setup",
      token,
      form({ firstName: "Nobody", team: "sales", ODOO_API_KEY: "wrong" }),
    );
    expect(refused.status).toBe(400);
    const html = await refused.text();
    expect(html).toContain("That name is not accepted.");
    expect(html).toContain("Odoo refused this key.");
    expect(html).toContain("Not saved");
    // The secret is not sent back to the browser, and nothing was kept, not even the good field.
    expect(html).not.toContain("wrong");
    expect(await registry.readUserSetup(toolId, cara)).toEqual({});
    expect(await registry.readUserSecrets(toolId, cara)).toEqual({});

    const asJson = await call("/t/crm/setup", token, json({ ODOO_API_KEY: "wrong" }));
    expect(asJson.status).toBe(400);
    expect(await asJson.json()).toMatchObject({
      error: { fields: { ODOO_API_KEY: "Odoo refused this key." } },
    });
  });

  it("accepts what the tool accepts, and lets the check see the values already kept", async () => {
    const token = await tokenFor(cara);
    expect((await call("/t/crm/setup", token, json({ firstName: "Cara" }))).status).toBe(200);
    checked.length = 0;
    // Only a secret is given now: the check still sees the first name kept before.
    const ok = await call("/t/crm/setup", token, json({ ODOO_API_KEY: "a-good-test-key" }));
    expect(ok.status).toBe(200);
    expect(checked).toEqual([
      { setup: { firstName: "Cara" }, secrets: { ODOO_API_KEY: "a-good-test-key" } },
    ]);
    expect(await registry.readUserSecrets(toolId, cara)).toEqual({
      ODOO_API_KEY: "a-good-test-key",
    });
  });

  it("is not asked when nothing is given", async () => {
    checked.length = 0;
    const empty = await call("/t/crm/setup", await tokenFor(cara), json({}));
    expect(empty.status).toBe(200);
    expect(checked).toEqual([]);
  });

  it("is the platform's to ask: a caller reaching for the check path, with the marker, gets nothing", async () => {
    const token = await tokenFor(cara);
    const forged = await call("/t/crm/_f/setup-check", token, {
      method: "POST",
      headers: { "x-forgeron-setup-check": "1", "content-type": "application/json" },
      body: JSON.stringify({ setup: { firstName: "x" }, secrets: {} }),
    });
    expect(forged.status).toBe(404);
    // And the action is on no interface: the API does not know it.
    expect((await call("/t/crm/api/setup.check", token)).status).toBe(404);
  });

  it("keeps nothing when the tool cannot be reached: the person is told to try again", async () => {
    const token = await tokenFor(cara);
    const down = {
      DISPATCHER: {
        get: () => ({
          fetch: () => {
            throw new Error("the tool is down");
          },
        }),
      },
    } as Partial<GatewayEnv>;
    const response = await createGateway(
      { ...env, ...down },
      { now: () => now },
    )(
      new Request("https://acme.forgeron.app/t/crm/setup", {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: JSON.stringify({ firstName: "Changed" }),
      }),
    );
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      error: { message: "The check could not be completed. Try again." },
    });
    expect((await registry.readUserSetup(toolId, cara)).firstName).toBe("Cara");
  });
});

describe("offering a saved secret to a second tool (D-105)", () => {
  let dan = "";
  let eve = "";
  let danSecret = "";
  beforeAll(async () => {
    const add = async (subject: string) =>
      (
        await registry.addMember({
          workspace: "acme",
          subject,
          email: `${subject}@acme.test`,
          name: subject,
          roles: [],
        })
      ).id;
    dan = await add("dan");
    eve = await add("eve");
    // Dan gives the first tool his key: it is saved, named as the tool names it, with its kind.
    const first = await call(
      "/t/crm/setup",
      await tokenFor(dan),
      json({ firstName: "Dan", ODOO_API_KEY: "dan-test-key" }),
    );
    if (first.status !== 200) throw new Error(`The setup was refused: ${first.status}`);
    danSecret = (await registry.listPersonSecrets("acme", dan))[0]!.id;
  });

  it("is saved with the tool's own label and kind, and listed without its value", async () => {
    const saved = await registry.listPersonSecrets("acme", dan);
    expect(saved).toEqual([
      expect.objectContaining({
        id: danSecret,
        label: "Odoo API key",
        kind: "odoo.api-key",
        versions: 1,
        usedBy: [{ tool: "crm", field: "ODOO_API_KEY", scope: "*" }],
      }),
    ]);
    expect(JSON.stringify(saved)).not.toContain("dan-test-key");
  });

  it("is offered on the other tool's page, under its kind, with where it is used, and never shown", async () => {
    const page = await (await call("/t/hr/setup", await tokenFor(dan, "hr"))).text();
    expect(page).toContain('name="use:ODOO_API_KEY"');
    expect(page).toContain("Same kind");
    expect(page).toContain("Odoo API key (used by crm)");
    expect(page).not.toContain("dan-test-key");
    // Not offered on the tool that already uses it, nor to a person who saved nothing.
    expect(await (await call("/t/crm/setup", await tokenFor(dan))).text()).not.toContain(
      "use:ODOO",
    );
    expect(await (await call("/t/hr/setup", await tokenFor(eve, "hr"))).text()).not.toContain(
      "use:",
    );
  });

  it("binds it to the second tool by the person's choice, checks it first, audits it and keeps one secret", async () => {
    const token = await tokenFor(dan, "hr");
    const chosen = await call(
      "/t/hr/setup",
      token,
      json({ firstName: "Dan", "use:ODOO_API_KEY": danSecret }),
    );
    expect(chosen.status).toBe(200);
    expect(await registry.readUserSecrets(hrId, dan)).toEqual({ ODOO_API_KEY: "dan-test-key" });
    // One secret, two bindings: the key is the same value for both tools.
    const listed = await registry.listPersonSecrets("acme", dan);
    expect(listed).toHaveLength(1);
    expect(listed[0]!.usedBy.map((u) => u.tool).sort()).toEqual(["crm", "hr"]);
    // The audit line names the field and the secret's id, never a value.
    const lines = await registry.listAudit(hrId);
    const bound = lines.find((l) => l.subject === "secret:bound");
    expect(bound).toMatchObject({ actor: dan, kind: "access" });
    expect(JSON.stringify(lines)).not.toContain("dan-test-key");
    // The check ran on the chosen value.
    expect(checked.at(-1)).toMatchObject({ secrets: { ODOO_API_KEY: "dan-test-key" } });
  });

  it("changing the saved key once changes it for both tools", async () => {
    const crmTool = (await registry.findTool("acme", "crm"))!;
    await registry.setUserSecret({
      toolId: crmTool.id,
      person: dan,
      name: "ODOO_API_KEY",
      value: "dan-new-key",
    });
    expect(await registry.readUserSecrets(hrId, dan)).toEqual({ ODOO_API_KEY: "dan-new-key" });
    expect((await registry.listPersonSecrets("acme", dan))[0]!.versions).toBe(2);
  });

  it("refuses a secret that is not the person's, a choice and a typed value together, and a saved key the tool refuses", async () => {
    const token = await tokenFor(eve, "hr");
    const foreign = await call("/t/hr/setup", token, json({ "use:ODOO_API_KEY": danSecret }));
    expect(foreign.status).toBe(400);
    expect(await foreign.json()).toMatchObject({
      error: { fields: { ODOO_API_KEY: "That saved secret is not available." } },
    });
    expect(await registry.readUserSecrets(hrId, eve)).toEqual({});

    const both = await call(
      "/t/hr/setup",
      await tokenFor(dan, "hr"),
      json({ ODOO_API_KEY: "typed", "use:ODOO_API_KEY": danSecret }),
    );
    expect(both.status).toBe(400);
  });

  it("checks the chosen value, and binds nothing when the tool refuses it", async () => {
    const gina = (
      await registry.addMember({
        workspace: "acme",
        subject: "gina",
        email: "gina@acme.test",
        name: "gina",
        roles: [],
      })
    ).id;
    // A key Odoo no longer accepts, saved earlier (set here without going through the check).
    await registry.setUserSecret({
      toolId: toolId,
      person: gina,
      name: "ODOO_API_KEY",
      value: "wrong",
    });
    const id = (await registry.listPersonSecrets("acme", gina))[0]!.id;
    const refused = await call(
      "/t/hr/setup",
      await tokenFor(gina, "hr"),
      json({ firstName: "Gina", "use:ODOO_API_KEY": id }),
    );
    expect(refused.status).toBe(400);
    expect(await refused.json()).toMatchObject({
      error: { fields: { ODOO_API_KEY: "Odoo refused this key." } },
    });
    expect(await registry.readUserSecrets(hrId, gina)).toEqual({});
    expect((await registry.listPersonSecrets("acme", gina))[0]!.usedBy).toHaveLength(1);
  });

  it("never binds by field name: a tool asking for the same name gets nothing the person did not choose", async () => {
    // Eve typed nothing and chose nothing: her calls are asked again, whatever Dan saved.
    expect((await call("/t/hr/api/tickets.mine", await tokenFor(eve, "hr"))).status).toBe(428);
  });
});

describe("a person's own page of secrets (D-106)", () => {
  const ORIGIN = "https://acme.forgeron.app";
  let hana = "";
  let other = "";
  let cookie = "";
  let otherCookie = "";
  let secretId = "";

  const session = async (person: string) =>
    (
      await openSession({ person, workspace: "acme" }, { secret: SECRET, ttlSeconds: 3600, now })
    ).split(";")[0]!;
  const page = (path = "/my/secrets", who = cookie) =>
    gateway()(new Request(`${ORIGIN}${path}`, { headers: { cookie: who } }));
  const act = (fields: Record<string, string>, who = cookie, origin = ORIGIN) =>
    gateway()(
      new Request(`${ORIGIN}/my/secrets`, {
        method: "POST",
        headers: { cookie: who, origin, "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(fields),
      }),
    );

  beforeAll(async () => {
    const add = async (subject: string) =>
      (
        await registry.addMember({
          workspace: "acme",
          subject,
          email: `${subject}@acme.test`,
          name: subject,
          roles: [],
        })
      ).id;
    hana = await add("hana");
    other = await add("other");
    cookie = await session(hana);
    otherCookie = await session(other);
    // Hana gave the first tool her key, and chose it for the second.
    const first = await call(
      "/t/crm/setup",
      await tokenFor(hana),
      json({ firstName: "Hana", ODOO_API_KEY: "hana-key-one" }),
    );
    if (first.status !== 200) throw new Error(`The setup was refused: ${first.status}`);
    secretId = (await registry.listPersonSecrets("acme", hana))[0]!.id;
    await registry.bindUserSecret({ toolId: hrId, person: hana, field: "ODOO_API_KEY", secretId });
  });

  it("is for a signed-in person's session only: a token or nobody is sent to sign in", async () => {
    const out = await gateway()(new Request(`${ORIGIN}/my/secrets`));
    expect(out.status).toBe(302);
    expect(out.headers.get("location")).toBe("/auth/login?next=%2Fmy%2Fsecrets");
    const bearer = await gateway()(
      new Request(`${ORIGIN}/my/secrets`, {
        headers: { authorization: `Bearer ${await tokenFor(hana)}` },
      }),
    );
    expect(bearer.status).toBe(302);
    expect((await act({ action: "new" }, "")).status).toBe(401);
  });

  it("lists the secret with its tools, versions and who changed it, and never a value", async () => {
    const response = await page();
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain("<h1>Your secrets</h1>");
    expect(html).toContain("Odoo API key");
    expect(html).toContain("odoo.api-key");
    expect(html).toMatch(/<strong>crm<\/strong>/);
    expect(html).toMatch(/<strong>hr<\/strong>/);
    expect(html).toContain("by you");
    expect(html).not.toContain("hana-key-one");
    expect(html).not.toContain("<script");
    // Another person sees none of it.
    const mine = await (await page("/my/secrets", otherCookie)).text();
    expect(mine).not.toContain("Odoo API key");
  });

  it("refuses a post that did not come from the page, and a secret that is not the person's", async () => {
    expect(
      (
        await act(
          { action: "version", secret: secretId, value: "x" },
          cookie,
          "https://evil.example",
        )
      ).status,
    ).toBe(403);
    const foreign = await act(
      { action: "version", secret: secretId, value: "stolen" },
      otherCookie,
    );
    expect(foreign.status).toBe(400);
    expect(await foreign.text()).toContain("That is not one of your secrets.");
    expect(
      (await act({ action: "delete", secret: secretId, confirm: "yes" }, otherCookie)).status,
    ).toBe(400);
    expect(await registry.readUserSecrets(toolId, hana)).toEqual({ ODOO_API_KEY: "hana-key-one" });
  });

  it("changes the key once for every tool that follows the latest, after each tool's own check", async () => {
    checked.length = 0;
    // A key the tool refuses is kept nowhere: not as a version, not for either tool.
    const refused = await act({ action: "version", secret: secretId, value: "wrong" });
    expect(refused.status).toBe(400);
    expect(await refused.text()).toContain("Odoo refused this key.");
    expect((await registry.listPersonSecrets("acme", hana))[0]!.versions).toBe(1);
    expect(await registry.readUserSecrets(hrId, hana)).toEqual({ ODOO_API_KEY: "hana-key-one" });

    checked.length = 0;
    const ok = await act({ action: "version", secret: secretId, value: "hana-key-two" });
    expect(ok.status).toBe(303);
    expect(ok.headers.get("location")).toBe("/my/secrets?done=version");
    // The check ran for both tools, on the new value, and both now get it.
    expect(checked.map((c) => (c.secrets as Record<string, string>).ODOO_API_KEY)).toEqual([
      "hana-key-two",
      "hana-key-two",
    ]);
    expect(await registry.readUserSecrets(toolId, hana)).toEqual({ ODOO_API_KEY: "hana-key-two" });
    expect(await registry.readUserSecrets(hrId, hana)).toEqual({ ODOO_API_KEY: "hana-key-two" });
    const done = await (await page("/my/secrets?done=version")).text();
    expect(done).toContain("The new value is saved.");
    expect(done).toContain("Version 2");
    // A message that is not one of the page's own is not echoed.
    expect(await (await page("/my/secrets?done=<script>")).text()).not.toContain("<script>");
  });

  it("keeps a tool on an earlier version when the person pins it, and follows the latest again when they unpin", async () => {
    const pin = (version: string) =>
      act({
        action: "bind",
        tool: "hr",
        field: "ODOO_API_KEY",
        scope: "*",
        secret: secretId,
        pin: version,
      });
    expect((await pin("1")).status).toBe(303);
    expect(await registry.readUserSecrets(hrId, hana)).toEqual({ ODOO_API_KEY: "hana-key-one" });
    expect(await registry.readUserSecrets(toolId, hana)).toEqual({ ODOO_API_KEY: "hana-key-two" });
    // A pinned tool is not asked about a new value it will not get: only crm is checked.
    checked.length = 0;
    expect(
      (await act({ action: "version", secret: secretId, value: "hana-key-three" })).status,
    ).toBe(303);
    expect(checked).toHaveLength(1);
    expect(await registry.readUserSecrets(hrId, hana)).toEqual({ ODOO_API_KEY: "hana-key-one" });
    expect((await pin("")).status).toBe(303);
    expect(await registry.readUserSecrets(hrId, hana)).toEqual({ ODOO_API_KEY: "hana-key-three" });
    expect((await pin("9")).status).toBe(400);
    // Only a binding the person has can be changed.
    expect(
      (
        await act({
          action: "bind",
          tool: "hr",
          field: "NOPE",
          scope: "*",
          secret: secretId,
          pin: "",
        })
      ).status,
    ).toBe(400);
  });

  it("stops one tool using the secret, keeps the secret for the other, and deletes it only when confirmed", async () => {
    expect(
      (await act({ action: "unbind", tool: "hr", field: "ODOO_API_KEY", scope: "*" })).headers.get(
        "location",
      ),
    ).toBe("/my/secrets?done=unbound");
    expect(await registry.readUserSecrets(hrId, hana)).toEqual({});
    expect(await registry.readUserSecrets(toolId, hana)).toEqual({
      ODOO_API_KEY: "hana-key-three",
    });
    const unconfirmed = await act({ action: "delete", secret: secretId });
    expect(unconfirmed.status).toBe(400);
    expect(await registry.listPersonSecrets("acme", hana)).toHaveLength(1);
    expect((await act({ action: "delete", secret: secretId, confirm: "yes" })).status).toBe(303);
    expect(await registry.listPersonSecrets("acme", hana)).toEqual([]);
    // The tool asks again: the person is asked at its setup page.
    expect((await call("/t/crm/api/tickets.mine", await tokenFor(hana))).status).toBe(428);
  });

  it("saves a secret no tool uses yet, renames it, and checks what it is given", async () => {
    expect((await act({ action: "new", label: "", value: "v" })).status).toBe(400);
    expect(
      (await act({ action: "new", label: "Spare", kind: "Not A Kind", value: "v" })).status,
    ).toBe(400);
    expect(
      (await act({ action: "new", label: "Spare", kind: "odoo.api-key", value: "spare-value" }))
        .status,
    ).toBe(303);
    const [spare] = await registry.listPersonSecrets("acme", hana);
    expect(spare).toMatchObject({ label: "Spare", kind: "odoo.api-key", usedBy: [] });
    expect((await act({ action: "rename", secret: spare!.id, label: "Spare key" })).status).toBe(
      303,
    );
    expect((await registry.listPersonSecrets("acme", hana))[0]!.label).toBe("Spare key");
    // A tool that asks for the same kind offers it.
    const offered = await (await call("/t/hr/setup", await tokenFor(hana, "hr"))).text();
    expect(offered).toContain("Spare key");
    expect(offered).not.toContain("spare-value");
    expect((await act({ action: "nonsense" })).status).toBe(400);
  });
});

describe("a different secret for a preview or a branch (D-109)", () => {
  const ORIGIN = "https://acme.forgeron.app";
  let dev = "";
  let cookie = "";
  let normal = "";
  let testKey = "";

  const act = (fields: Record<string, string>) =>
    gateway()(
      new Request(`${ORIGIN}/my/secrets`, {
        method: "POST",
        headers: {
          cookie,
          origin: ORIGIN,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(fields),
      }),
    );
  /** What the tool's Worker is handed for a call to this path. */
  const secretsAt = async (path: string, token: string) => {
    seen.length = 0;
    expect((await call(path, token)).status).toBe(200);
    return (seen[0]?.secrets ?? {}) as Record<string, string>;
  };

  beforeAll(async () => {
    dev = (
      await registry.addMember({
        workspace: "acme",
        subject: "devon",
        email: "devon@acme.test",
        name: "devon",
        roles: ["developer"],
      })
    ).id;
    cookie = (
      await openSession(
        { person: dev, workspace: "acme" },
        { secret: SECRET, ttlSeconds: 3600, now },
      )
    ).split(";")[0]!;
    // Two preview branches of the tool.
    for (const branch of ["feature-x", "feature-y"]) {
      const version = (await registry.listVersions(toolId))[0]!;
      const preview = await registry.ensureEnvironment(toolId, "preview", branch);
      await registry.activate(preview.id, version.id, { actor: "test" });
    }
    const first = await call(
      "/t/crm/setup",
      await tokenFor(dev),
      json({ firstName: "Devon", ODOO_API_KEY: "devon-real-key" }),
    );
    if (first.status !== 200) throw new Error(`The setup was refused: ${first.status}`);
    const own = (await registry.listPersonSecrets("acme", dev))[0]!;
    normal = own.id;
    // A second secret of their own: the key for a test instance.
    await registry.createPersonSecret({
      workspace: "acme",
      person: dev,
      label: "Test instance",
      kind: "odoo.api-key",
      value: "devon-test-key",
    });
    testKey = (await registry.listPersonSecrets("acme", dev)).find(
      (s) => s.label === "Test instance",
    )!.id;
  });

  it("serves the person's usual secret to production and to every preview until they say otherwise", async () => {
    const token = await tokenFor(dev);
    expect(await secretsAt("/t/crm/api/tickets.mine", token)).toEqual({
      ODOO_API_KEY: "devon-real-key",
    });
    expect(await secretsAt("/t/crm@feature-x/api/tickets.mine", token)).toEqual({
      ODOO_API_KEY: "devon-real-key",
    });
  });

  it("serves another secret to one branch's preview, and the usual one everywhere else", async () => {
    const out = await act({
      action: "override",
      tool: "crm",
      field: "ODOO_API_KEY",
      where: "branch",
      branch: "feature-x",
      secret: testKey,
    });
    expect(out.headers.get("location")).toBe("/my/secrets?done=overridden");
    const token = await tokenFor(dev);
    expect(await secretsAt("/t/crm@feature-x/api/tickets.mine", token)).toEqual({
      ODOO_API_KEY: "devon-test-key",
    });
    expect(await secretsAt("/t/crm@feature-y/api/tickets.mine", token)).toEqual({
      ODOO_API_KEY: "devon-real-key",
    });
    expect(await secretsAt("/t/crm/api/tickets.mine", token)).toEqual({
      ODOO_API_KEY: "devon-real-key",
    });
    // The page says where each is used, in words.
    const text = await (
      await gateway()(new Request(`${ORIGIN}/my/secrets`, { headers: { cookie } }))
    ).text();
    expect(text).toContain("the preview of feature-x");
    expect(text).not.toContain("devon-test-key");
  });

  it("lets every preview, then production, have their own, the most specific winning", async () => {
    const token = await tokenFor(dev);
    expect(
      (
        await act({
          action: "override",
          tool: "crm",
          field: "ODOO_API_KEY",
          where: "preview",
          secret: testKey,
        })
      ).status,
    ).toBe(303);
    // feature-y now follows the preview override, feature-x still has its own branch one.
    expect(await secretsAt("/t/crm@feature-y/api/tickets.mine", token)).toEqual({
      ODOO_API_KEY: "devon-test-key",
    });
    expect(
      (
        await act({
          action: "override",
          tool: "crm",
          field: "ODOO_API_KEY",
          where: "production",
          secret: normal,
        })
      ).status,
    ).toBe(303);
    expect(await secretsAt("/t/crm/api/tickets.mine", token)).toEqual({
      ODOO_API_KEY: "devon-real-key",
    });
  });

  it("refuses a branch that is not one, a secret that is not theirs and a tool they have no secret for", async () => {
    const base = { action: "override", tool: "crm", field: "ODOO_API_KEY", secret: testKey };
    expect((await act({ ...base, where: "branch", branch: "Not A Branch!" })).status).toBe(400);
    expect((await act({ ...base, where: "elsewhere" })).status).toBe(400);
    expect((await act({ ...base, where: "preview", secret: "sec_nobody" })).status).toBe(400);
    expect((await act({ ...base, where: "preview", tool: "nothing" })).status).toBe(400);
    expect((await act({ ...base, where: "preview", field: "NOPE" })).status).toBe(400);
  });

  it("asks the tool to check the secret it would now get", async () => {
    await registry.addSecretVersion({
      workspace: "acme",
      person: dev,
      secretId: testKey,
      value: "wrong",
    });
    const before = (await registry.listPersonSecrets("acme", dev)).find((s) => s.id === testKey)!;
    const out = await act({
      action: "override",
      tool: "crm",
      field: "ODOO_API_KEY",
      where: "branch",
      branch: "feature-z",
      secret: testKey,
    });
    expect(out.status).toBe(400);
    expect(await out.text()).toContain("Odoo refused this key");
    const after = (await registry.listPersonSecrets("acme", dev)).find((s) => s.id === testKey)!;
    expect(after.usedBy).toEqual(before.usedBy);
  });
});

describe("the setup page's link and connections (D-111)", () => {
  it("links to the person's own secrets", async () => {
    const html = await (await call("/t/crm/setup", await tokenFor(ana))).text();
    expect(html).toContain('href="/my/secrets"');
  });

  it("shows a delegated connector as a step: a link to connect, then connected once consented", async () => {
    const cal = await registry.createTool({ workspace: "acme", name: "cal" });
    const built = await registry.recordBuild(cal.id, {
      fingerprint: "cal",
      manifest: {
        ...manifest,
        name: "cal",
        resources: {
          connectors: {
            google: {
              type: "google-calendar",
              mode: "delegated",
              scopes: ["calendar.read"],
              why: "Read your calendar",
            },
          },
        },
        setup: undefined,
      } as Manifest,
    });
    const version = await registry.publishVersion(cal.id, built.id, "1.0.0");
    const production = await registry.ensureEnvironment(cal.id, "production");
    await registry.activate(production.id, version.id, { actor: "test" });

    const token = await tokenFor(ana, "cal");
    const before = await (await call("/t/cal/secrets", token)).text();
    expect(before).toContain("Connections");
    expect(before).toContain("google-calendar");
    expect(before).toContain("Read your calendar");
    expect(before).toContain("/console-api/api/tools/cal/environments/production/consent/google");
    expect(before).not.toContain("Connected");

    await registry.saveConnection({
      toolId: cal.id,
      environment: "production",
      userId: ana,
      connector: "google-calendar",
      scopes: ["calendar.read"],
      tokens: { accessToken: "test-access", refreshToken: "test-refresh" },
    });
    const after = await (await call("/t/cal/secrets", token)).text();
    expect(after).toContain("Connected");
    expect(after).not.toContain("test-access");
    // Another person has not consented.
    expect(await (await call("/t/cal/secrets", await tokenFor(ben, "cal"))).text()).not.toContain(
      "Connected",
    );
  });
});
