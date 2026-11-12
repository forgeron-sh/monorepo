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

// A person's library through the whole gateway (D-117): who may add a tool, what a tool with a rule
// answers to someone who has not added it, the setup it sends them to, and removing it. The people,
// keys and values are test values; the tool is the real runtime behind the dispatcher.

const SECRET = "test-secret-not-a-real-one";
const KEY = btoa(String.fromCharCode(...new Uint8Array(32)));
const ORIGIN = "https://acme.forgeron.app";
const now = new Date("2026-11-10T10:00:00Z");

const action = {
  description: "My tickets.",
  access: "read" as const,
  input: { type: "object" as const, properties: {} },
  confirm: false,
  cli: { args: [] },
  http: { method: "GET" as const },
  interfaces: ["mcp", "api", "cli", "web"] as Array<"mcp" | "api" | "cli" | "web">,
};
const manifestOf = (name: string): Manifest => ({
  name,
  version: "1.0.0",
  summary: `Your ${name} from Claude.`,
  interfaces: { mcp: true, api: true, cli: true, web: false },
  roles: { reader: { grants: ["read"] } },
  actions: { "tickets.mine": action },
  views: {},
  jobs: {},
  events: {},
  resources: {},
  setup: { fields: { firstName: { type: "text", label: "First name", required: true } } },
  uses: {},
  preview: { data: "seed" },
});

function toolWorker(request: Request, name: string) {
  const setupHeader = request.headers.get("x-forgeron-user-setup");
  return createRuntime({
    manifest: manifestOf(name),
    baseUrl: request.headers.get("x-forgeron-base-url") ?? "",
    authenticate: (r) => {
      const raw = r.headers.get("x-forgeron-user");
      return raw ? { ...JSON.parse(raw), roles: ["reader"] } : undefined;
    },
    platform: {
      userSecretStore: { read: async () => ({}), write: async () => undefined },
      ...(setupHeader !== null ? { userSetup: JSON.parse(setupHeader) } : {}),
    },
    actions: {
      "tickets.mine": {
        input: { safeParse: (data: unknown) => ({ success: true, data }) },
        run: () => ({ ok: true }),
      },
    },
  }).fetch(request);
}

let memory: MemoryD1;
let registry: Registry;
let env: GatewayEnv;
let ana = "";
let ben = "";
let root = "";
let odooId = "";

async function publish(name: string) {
  const tool = await registry.createTool({ workspace: "acme", name });
  const built = await registry.recordBuild(tool.id, {
    fingerprint: name,
    manifest: manifestOf(name),
  });
  const version = await registry.publishVersion(tool.id, built.id, "1.0.0");
  const production = await registry.ensureEnvironment(tool.id, "production");
  await registry.activate(production.id, version.id, { actor: "test" });
  return tool.id;
}

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { secrets: await createSecretBox(KEY), now: () => now });
  odooId = await publish("odoo");
  await publish("legacy");
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
  ana = await member("ana", ["reader", "support"]);
  ben = await member("ben", ["reader"]);
  root = await member("root", ["admin"]);
  env = {
    DB: d1,
    BASE_DOMAIN: "forgeron.app",
    AUTH_SECRET: SECRET,
    SECRETS_KEY: KEY,
    DISPATCHER: {
      get: (worker: string) => ({
        fetch: (request: Request) => toolWorker(request, worker.split("--")[1]!),
      }),
    },
  };
});
afterAll(() => memory.close());

const gateway = () => createGateway(env, { now: () => now });
const cookieOf = async (person: string) =>
  (
    await openSession({ person, workspace: "acme" }, { secret: SECRET, ttlSeconds: 3600, now })
  ).split(";")[0]!;
const consoleApi = async (
  person: string,
  path: string,
  method = "GET",
  body?: unknown,
): Promise<Response> =>
  gateway()(
    new Request(`${ORIGIN}/console-api${path}`, {
      method,
      headers: {
        cookie: await cookieOf(person),
        origin: ORIGIN,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
  );
const callTool = async (person: string, tool = "odoo") =>
  gateway()(
    new Request(`${ORIGIN}/t/${tool}/api/tickets.mine`, {
      headers: {
        authorization: `Bearer ${await issueToken({
          secret: SECRET,
          person,
          workspace: "acme",
          tool,
          ttlSeconds: 86_400,
          now,
        })}`,
      },
    }),
  );
const names = async (person: string) =>
  (
    (await (await consoleApi(person, "/api/library")).json()) as { tools: Array<{ name: string }> }
  ).tools.map((t) => t.name);

describe("a person's library (D-117)", () => {
  it("leaves a tool with no rule open as before: listed, usable, not removable", async () => {
    expect(await names(ben)).toContain("legacy");
    expect((await callTool(ben, "legacy")).status).toBe(428);
    const removed = await consoleApi(ben, "/api/library/legacy", "DELETE");
    expect(removed.status).toBe(409);
  });

  it("hides a tool nobody may add, and refuses its calls, even from someone who had a token", async () => {
    await registry.setAvailability({ toolId: odooId, mode: "nobody", actor: root });
    expect(await names(ana)).not.toContain("odoo");
    const refused = await callTool(ana);
    expect(refused.status).toBe(403);
    expect(await refused.json()).toMatchObject({ error: { code: "NOT_AVAILABLE" } });
    expect((await consoleApi(ana, "/api/library/odoo", "POST")).status).toBe(404);
  });

  it("lets an admin open it to a role, through the console API, audited", async () => {
    const set = await consoleApi(root, "/api/tools/odoo/availability", "PUT", {
      mode: "roles",
      roles: ["support"],
    });
    expect(set.status).toBe(200);
    expect(await set.json()).toMatchObject({ mode: "roles", roles: ["support"] });
    expect((await consoleApi(ana, "/api/tools/odoo/availability")).status).toBe(403);
    expect(await names(ana)).toContain("odoo");
    expect(await names(ben)).not.toContain("odoo");
    const [line] = await registry.listAudit(odooId, { kind: "access" });
    expect(line).toMatchObject({ actor: root, subject: "availability" });
  });

  it("refuses a call until the person adds it, then sends them to its setup, then it works", async () => {
    const before = await callTool(ana);
    expect(before.status).toBe(403);
    expect(await before.json()).toMatchObject({ error: { code: "NOT_IN_LIBRARY" } });

    const card = (await (await consoleApi(ana, "/api/library/odoo")).json()) as Record<string, any>;
    expect(card).toMatchObject({
      installed: false,
      managed: true,
      summary: "Your odoo from Claude.",
    });
    expect(card.use).toEqual({ web: null, mcp: null, cli: null });

    const added = await consoleApi(ana, "/api/library/odoo", "POST");
    expect(await added.json()).toEqual({
      installed: true,
      setupUrl: "/t/odoo/setup?next=%2Flibrary%2Fodoo",
    });
    expect((await callTool(ana)).status).toBe(428);
    // The setup page sends the person back to their library.
    const setup = await gateway()(
      new Request(`${ORIGIN}/t/odoo/setup?next=%2Flibrary%2Fodoo`, {
        method: "POST",
        headers: {
          cookie: await cookieOf(ana),
          origin: ORIGIN,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ firstName: "Ana" }),
      }),
    );
    expect(setup.status).toBe(200);
    expect(await setup.text()).toContain('href="/library/odoo"');
    expect((await callTool(ana)).status).toBe(200);
    const ready = (await (await consoleApi(ana, "/api/library/odoo")).json()) as Record<
      string,
      any
    >;
    expect(ready).toMatchObject({ installed: true, needsSetup: false, setupUrl: null });
    expect(ready.use.mcp).toEqual({ url: `${ORIGIN}/t/odoo/mcp` });
  });

  it("removes it with what the person gave it: calls are refused and the setup is asked again", async () => {
    expect((await consoleApi(ana, "/api/library/odoo", "DELETE")).status).toBe(204);
    expect((await callTool(ana)).status).toBe(403);
    expect(await registry.readUserSetup(odooId, ana)).toEqual({});
    expect((await consoleApi(ana, "/api/library/odoo", "DELETE")).status).toBe(404);
  });

  it("opened to everyone, lists it for all and still asks each person to add it", async () => {
    await registry.setAvailability({ toolId: odooId, mode: "everyone", actor: root });
    expect(await names(ben)).toContain("odoo");
    expect((await callTool(ben)).status).toBe(403);
  });
});

describe("production and pilots (D-119)", () => {
  it("brings a new production version to the people who added the tool, with nothing to do", async () => {
    await registry.installForPerson({ toolId: odooId, person: ana });
    await registry.writeUserSetup({ toolId: odooId, person: ana, values: { firstName: "Ana" } });
    expect((await callTool(ana)).status).toBe(200);
    const built = await registry.recordBuild(odooId, {
      fingerprint: "odoo-2",
      manifest: manifestOf("odoo"),
    });
    const next = await registry.publishVersion(odooId, built.id, "1.1.0");
    const production = await registry.ensureEnvironment(odooId, "production");
    await registry.activate(production.id, next.id, { actor: "test" });
    expect((await callTool(ana)).status).toBe(200);
    expect(await registry.isInstalled(odooId, ana)).toBe(true);
  });

  const callPilot = async (person: string) =>
    gateway()(
      new Request(`${ORIGIN}/t/odoo@pilot-a/api/tickets.mine`, {
        headers: {
          authorization: `Bearer ${await issueToken({
            secret: SECRET,
            person,
            workspace: "acme",
            tool: "odoo",
            ttlSeconds: 86_400,
            now,
          })}`,
        },
      }),
    );

  it("keeps a branch for admins and developers until an admin opens it as a pilot", async () => {
    const built = await registry.recordBuild(odooId, {
      fingerprint: "odoo-pilot",
      manifest: manifestOf("odoo"),
    });
    const version = await registry.publishVersion(odooId, built.id, "1.2.0-pilot-a");
    const preview = await registry.ensureEnvironment(odooId, "preview", "pilot-a");
    await registry.activate(preview.id, version.id, { actor: "test" });

    expect((await callPilot(ben)).status).toBe(403);
    expect((await consoleApi(ben, "/api/library/odoo/pilots/pilot-a")).status).toBe(404);
    expect((await consoleApi(root, "/api/tools/odoo/previews/pilot-a/availability")).status).toBe(
      200,
    );
    expect((await consoleApi(root, "/api/tools/odoo/previews/nope/availability")).status).toBe(404);
    const opened = await consoleApi(root, "/api/tools/odoo/previews/pilot-a/availability", "PUT", {
      mode: "people",
      people: [ben],
    });
    expect(opened.status).toBe(200);
  });

  it("lists the pilot as a tool of its own, reached once added and set up, and removed apart", async () => {
    const library = (await (await consoleApi(ben, "/api/library")).json()) as {
      tools: Array<{ name: string; pilot: string | null; installed: boolean }>;
    };
    expect(library.tools.filter((t) => t.name === "odoo")).toEqual([
      expect.objectContaining({ pilot: null, installed: false }),
      expect.objectContaining({ pilot: "pilot-a", installed: false }),
    ]);
    // Another person was not given the pilot.
    const others = (await (await consoleApi(ana, "/api/library")).json()) as {
      tools: Array<{ pilot: string | null }>;
    };
    expect(others.tools.some((t) => t.pilot === "pilot-a")).toBe(false);

    expect((await callPilot(ben)).status).toBe(403);
    const added = await consoleApi(ben, "/api/library/odoo/pilots/pilot-a", "POST");
    expect(await added.json()).toEqual({
      installed: true,
      setupUrl: "/t/odoo@pilot-a/setup?next=%2Flibrary%2Fodoo%2Fpilots%2Fpilot-a",
    });
    await registry.writeUserSetup({ toolId: odooId, person: ben, values: { firstName: "Ben" } });
    expect((await callPilot(ben)).status).toBe(200);
    // The pilot is not the tool: ben has not added the tool itself.
    expect((await callTool(ben)).status).toBe(403);
    const card = (await (await consoleApi(ben, "/api/library/odoo/pilots/pilot-a")).json()) as any;
    expect(card).toMatchObject({ pilot: "pilot-a", installed: true, needsSetup: false });
    expect(card.use.mcp).toEqual({ url: `${ORIGIN}/t/odoo@pilot-a/mcp` });

    expect((await consoleApi(ben, "/api/library/odoo/pilots/pilot-a", "DELETE")).status).toBe(204);
    expect((await callPilot(ben)).status).toBe(403);
  });
});

describe("a permanent channel's access (D-125)", () => {
  const callStaging = async (person: string) =>
    gateway()(
      new Request(`${ORIGIN}/t/odoo~staging/api/tickets.mine`, {
        headers: {
          authorization: `Bearer ${await issueToken({
            secret: SECRET,
            person,
            workspace: "acme",
            tool: "odoo",
            ttlSeconds: 86_400,
            now,
          })}`,
        },
      }),
    );

  it("has its own rule and library entry, apart from production and from a branch", async () => {
    const built = await registry.recordBuild(odooId, {
      fingerprint: "odoo-staging",
      manifest: manifestOf("odoo"),
    });
    const version = await registry.publishVersion(odooId, built.id, "1.3.0", "staging");
    const staging = await registry.addChannel({
      toolId: odooId,
      name: "staging",
      follows: "staging",
      actor: root,
    });
    await registry.activate(staging.id, version.id, { actor: "test" });

    // Nobody but admins and developers until an admin opens it.
    expect((await callStaging(ben)).status).toBe(403);
    expect((await consoleApi(root, "/api/tools/odoo/previews/~staging/availability")).status).toBe(
      200,
    );
    const opened = await consoleApi(root, "/api/tools/odoo/previews/~staging/availability", "PUT", {
      mode: "people",
      people: [ben],
    });
    expect(opened.status).toBe(200);
    const library = (await (await consoleApi(ben, "/api/library")).json()) as {
      tools: Array<{ name: string; pilot: string | null }>;
    };
    expect(library.tools.some((t) => t.name === "odoo" && t.pilot === "~staging")).toBe(true);

    const added = await consoleApi(ben, "/api/library/odoo/pilots/~staging", "POST");
    expect(added.status).toBe(200);
    // Ben gave the tool's setup already: the setup values belong to the tool.
    expect(await added.json()).toEqual({ installed: true, setupUrl: null });
    expect((await callStaging(ben)).status).toBe(200);
    // Another person was not given it.
    expect((await callStaging(ana)).status).toBe(403);
    const card = (await (await consoleApi(ben, "/api/library/odoo/pilots/~staging")).json()) as any;
    expect(card.use.mcp).toEqual({ url: `${ORIGIN}/t/odoo~staging/mcp` });
  });
});
