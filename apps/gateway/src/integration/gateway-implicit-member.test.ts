import type { D1Database } from "@forgeron/hosting";
import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "../gateway";
import { openSession } from "../identity/authn/session";
import { issueToken } from "../identity/authn/tokens";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// Every person holds `member` (D-128): a person given no role gets what each tool maps `member` to
// (the default profile), only on a tool they may add (its availability, D-117), and an admin's
// exception on `member` still wins. The people and keys are test values; the tool is a stub that
// records what the gateway forwards.

const SECRET = "test-secret-not-a-real-one";
const ORIGIN = "https://acme.forgeron.app";
const now = new Date("2026-11-12T10:00:00Z");
const manifest = (name: string) => ({
  name,
  interfaces: { mcp: true, api: true, cli: true, web: false },
  roles: { user: { grants: ["read"] }, manager: { grants: ["read", "write"] } },
  actions: { "deals.list": { access: "read" }, "deals.move": { access: "write" } },
  views: {},
  resources: {},
});

let memory: MemoryD1;
let registry: Registry;
let env: GatewayEnv;
let cleo = "";
let root = "";
const ids: Record<string, string> = {};
const seen: Array<string | null> = [];

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { now: () => now });
  for (const name of ["crm", "vault"]) {
    const tool = await registry.createTool({ workspace: "acme", name });
    const built = await registry.recordBuild(tool.id, {
      fingerprint: name,
      manifest: manifest(name),
    });
    const version = await registry.publishVersion(tool.id, built.id, "1.0.0");
    const production = await registry.ensureEnvironment(tool.id, "production");
    await registry.activate(production.id, version.id, { actor: "test" });
    ids[name] = tool.id;
  }
  const add = async (subject: string, roles: string[]) =>
    (
      await registry.addMember({
        workspace: "acme",
        subject,
        email: `${subject}@acme.test`,
        name: subject,
        roles,
      })
    ).id;
  // Cleo was given no role at all; root is the admin.
  cleo = await add("cleo", []);
  root = await add("root", ["admin"]);
  await registry.setAvailability({ toolId: ids.crm!, mode: "everyone", actor: root });
  await registry.setAvailability({ toolId: ids.vault!, mode: "nobody", actor: root });
  env = {
    DB: d1,
    BASE_DOMAIN: "forgeron.app",
    AUTH_SECRET: SECRET,
    DISPATCHER: {
      get: () => ({
        fetch: (request: Request) => {
          seen.push(request.headers.get("x-forgeron-user"));
          return Response.json({ ok: true });
        },
      }),
    },
  };
});
afterAll(() => memory.close());

const gateway = () => createGateway(env, { now: () => now });
const consoleApi = async (person: string, path: string, method = "GET", body?: unknown) =>
  gateway()(
    new Request(`${ORIGIN}/console-api${path}`, {
      method,
      headers: {
        cookie: (
          await openSession(
            { person, workspace: "acme" },
            { secret: SECRET, ttlSeconds: 3600, now },
          )
        ).split(";")[0]!,
        origin: ORIGIN,
        ...(body === undefined ? {} : { "content-type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    }),
  );
const call = async (tool: string) =>
  gateway()(
    new Request(`${ORIGIN}/t/${tool}/api/deals.list`, {
      headers: {
        authorization: `Bearer ${await issueToken({
          secret: SECRET,
          person: cleo,
          workspace: "acme",
          tool,
          ttlSeconds: 86_400,
          now,
        })}`,
      },
    }),
  );

describe("everyone holds member (D-128)", () => {
  it("gives a person with no role the member profile on a tool they may add", async () => {
    expect((await registry.findMember("acme", cleo))?.roles).toEqual([]);
    expect((await consoleApi(cleo, "/api/library/crm", "POST")).status).toBe(200);
    seen.length = 0;
    expect((await call("crm")).status).toBe(200);
    expect(JSON.parse(seen.at(-1)!)).toMatchObject({
      roles: ["member"],
      permissions: { member: ["read"] },
      access: { member: { "deals.list": true, "deals.move": false } },
    });
  });

  it("opens nothing on a tool nobody may add", async () => {
    const library = (await (await consoleApi(cleo, "/api/library")).json()) as {
      tools: Array<{ name: string }>;
    };
    expect(library.tools.map((t) => t.name)).not.toContain("vault");
    seen.length = 0;
    const refused = await call("vault");
    expect(refused.status).toBe(403);
    expect(await refused.json()).toMatchObject({ error: { code: "NOT_AVAILABLE" } });
    expect(seen).toEqual([]);
  });

  it("lets an admin's exception on member win over the profile", async () => {
    const put = await consoleApi(root, "/api/tools/crm/access-matrix", "PUT", {
      changes: [{ role: "member", action: "deals.list", allowed: false }],
    });
    expect(put.status).toBe(200);
    await call("crm");
    expect(JSON.parse(seen.at(-1)!).access).toEqual({
      member: { "deals.list": false, "deals.move": false },
    });
  });

  it("keeps the stored roles as they were given: member is added when the person is read", async () => {
    const members = (await (await consoleApi(root, "/api/members")).json()) as {
      members: Array<{ id: string; roles: string[] }>;
    };
    expect(members.members.find((m) => m.id === cleo)?.roles).toEqual([]);
    const me = (await (await consoleApi(cleo, "/api/workspace")).json()) as {
      person: { roles: string[] };
    };
    expect(me.person.roles).toEqual(["member"]);
  });
});
