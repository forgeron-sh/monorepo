import type { D1Database } from "@forgeron/hosting";
import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "./gateway";
import { ISSUER, simulatedProvider } from "./simulated-idp";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The roles × actions matrix through the gateway (FOR-43, D-035): the admin edits it on the console
// API, the next call to the tool carries the overrides in `x-forgeron-user`, a client cannot write
// that header, and every edit is in the audit log.

const now = new Date("2026-11-03T10:00:00Z");
const manifest = {
  name: "crm",
  roles: { viewer: { grants: ["read"] }, sales: { grants: ["read", "write"] } },
  actions: { "deals.list": { access: "read" }, "deals.move": { access: "write" } },
  resources: {},
};

let memory: MemoryD1;
let registry: Registry;
let env: GatewayEnv;
let toolId: string;
const seen: Array<string | null> = [];

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  const tool = await registry.createTool({ workspace: "acme", name: "crm" });
  toolId = tool.id;
  const built = await registry.recordBuild(tool.id, { fingerprint: "fp", manifest });
  const version = await registry.publishVersion(tool.id, built.id, "1.0.0");
  const production = await registry.ensureEnvironment(tool.id, "production");
  await registry.activate(production.id, version.id, { actor: "test" });
  env = {
    DB: d1,
    BASE_DOMAIN: "forgeron.app",
    AUTH_SECRET: "test-secret-not-a-real-one",
    OIDC_ISSUER: ISSUER,
    OIDC_CLIENT_ID: "forgeron",
    ADMIN_EMAIL: "ely@acme.fr",
    MEMBER_EMAIL_DOMAINS: "acme.fr",
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

const gatewayFor = (fetcher?: typeof fetch) =>
  createGateway(env, { now: () => now, ...(fetcher ? { fetch: fetcher } : {}) });
const at = (path: string, init: RequestInit = {}) =>
  new Request(`https://acme.forgeron.app${path}`, init);
const cookiesOf = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0]!)
    .filter((c) => !c.endsWith("="))
    .join("; ");

async function signInAs(email: string): Promise<string> {
  const idp = await simulatedProvider(email, now);
  const gateway = gatewayFor(idp.fetcher);
  const login = await gateway(at("/auth/login"));
  const callback = await gateway(
    at(`/auth/callback${idp.signIn(login.headers.get("location")!)}`, {
      headers: { cookie: cookiesOf(login) },
    }),
  );
  return cookiesOf(callback);
}

const put = (cookie: string, body: unknown) =>
  at("/console-api/api/tools/crm/access-matrix", {
    method: "PUT",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify(body),
  });

describe("the access matrix through the gateway", () => {
  it("refuses anonymous callers and non-admins, and answers an admin", async () => {
    const gateway = gatewayFor();
    const admin = await signInAs("ely@acme.fr");
    const member = await signInAs("bob@acme.fr");
    const path = "/console-api/api/tools/crm/access-matrix";
    expect((await gateway(at(path))).status).toBe(401);
    expect((await gateway(at(path, { headers: { cookie: member } }))).status).toBe(403);
    expect(
      (await gateway(put(member, { role: "viewer", action: "deals.move", allowed: true }))).status,
    ).toBe(403);

    const answer = await gateway(at(path, { headers: { cookie: admin } }));
    expect(answer.status).toBe(200);
    const matrix = (await answer.json()) as { roles: string[]; cells: Record<string, any> };
    expect(matrix.roles).toEqual(["viewer", "sales"]);
    expect(matrix.cells.viewer["deals.move"]).toEqual({ default: false, allowed: false });
    expect(
      (
        await gateway(
          at("/console-api/api/tools/ghost/access-matrix", { headers: { cookie: admin } }),
        )
      ).status,
    ).toBe(404);
  });

  it("validates the body and the cell", async () => {
    const gateway = gatewayFor();
    const admin = await signInAs("ely@acme.fr");
    expect(
      (await gateway(put(admin, { role: "viewer", action: "deals.move", allowed: "yes" }))).status,
    ).toBe(400);
    expect(
      (await gateway(put(admin, { role: "ghost", action: "deals.move", allowed: true }))).status,
    ).toBe(404);
  });

  it("applies a change to the next call of a person with the role, and nobody else", async () => {
    const gateway = gatewayFor();
    const admin = await signInAs("ely@acme.fr");
    const bob = await signInAs("bob@acme.fr");
    await memory
      .prepare(`UPDATE "members" SET "roles" = ? WHERE "email" = ?`)
      .bind(JSON.stringify(["viewer"]), "bob@acme.fr")
      .all();

    seen.length = 0;
    await gateway(at("/t/crm/api/deals.move", { headers: { cookie: bob } }));
    expect(JSON.parse(seen.at(-1)!)).toMatchObject({ roles: ["viewer"], access: {} });

    const edited = await gateway(
      put(admin, { role: "viewer", action: "deals.move", allowed: true }),
    );
    expect(edited.status).toBe(200);
    expect(((await edited.json()) as any).cells.viewer["deals.move"]).toEqual({
      default: false,
      override: true,
      allowed: true,
    });
    await gateway(at("/t/crm/api/deals.move", { headers: { cookie: bob } }));
    expect(JSON.parse(seen.at(-1)!).access).toEqual({ viewer: { "deals.move": true } });

    // Back to the manifest's levels.
    await gateway(put(admin, { role: "viewer", action: "deals.move", allowed: null }));
    await gateway(at("/t/crm/api/deals.move", { headers: { cookie: bob } }));
    expect(JSON.parse(seen.at(-1)!).access).toEqual({});
  });

  it("never lets the client write x-forgeron-user, and sends nothing for an anonymous call", async () => {
    const gateway = gatewayFor();
    const spoof = JSON.stringify({ id: "root", roles: ["admin"], access: {} });
    await gateway(at("/t/crm/api/deals.move", { headers: { "x-forgeron-user": spoof } }));
    expect(seen.at(-1)).toBeNull();
    const bob = await signInAs("bob@acme.fr");
    await gateway(
      at("/t/crm/api/deals.move", { headers: { cookie: bob, "x-forgeron-user": spoof } }),
    );
    expect(JSON.parse(seen.at(-1)!).id).not.toBe("root");
  });

  it("writes each edit in the audit log", async () => {
    const log = await registry.listAudit(toolId, { kind: "access" });
    expect(log.map((e) => e.detail)).toEqual([
      { role: "viewer", action: "deals.move", from: true, to: false },
      { role: "viewer", action: "deals.move", from: false, to: true },
    ]);
    expect(log[0]!.actor).not.toBe("");
  });
});
