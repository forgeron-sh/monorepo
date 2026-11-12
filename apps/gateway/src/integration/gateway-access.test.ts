import type { D1Database } from "@forgeron/hosting";
import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "../gateway";
import { ISSUER, simulatedProvider } from "../simulated-idp";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The access of a tool through the gateway (FOR-43, D-039, D-127): the admin maps workspace roles to
// the tool's profiles and sets exceptions on the console API, the next call to the tool carries the
// result in `x-forgeron-user`, a client cannot write that header, and every edit is in the audit log.

const now = new Date("2026-11-03T10:00:00Z");
const manifest = {
  name: "crm",
  roles: { viewer: { grants: ["read"] }, sales: { grants: ["read", "write"] } },
  actions: { "deals.list": { access: "read" }, "deals.move": { access: "write" } },
  views: { board: { title: "Board", path: "/board", access: "write" } },
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
    body: JSON.stringify({ changes: Array.isArray(body) ? body : [body] }),
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
    // The tool was never deployed through `deployBuild`: its default mapping is shown all the same.
    expect(matrix.roles).toEqual(["admin", "member"]);
    expect(matrix.cells.admin["deals.move"]).toEqual({ default: true, allowed: true });
    expect(matrix.cells.member["deals.move"]).toEqual({ default: false, allowed: false });
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
      (await gateway(put(admin, { role: "no space", action: "deals.move", allowed: true }))).status,
    ).toBe(404);
    const profiles = (role: string, grant: unknown) =>
      at("/console-api/api/tools/crm/access-matrix", {
        method: "PUT",
        headers: { cookie: admin, "content-type": "application/json" },
        body: JSON.stringify({ profiles: [{ role, grant }] }),
      });
    expect((await gateway(profiles("support", { kind: "profile", profile: "ghost" }))).status).toBe(
      404,
    );
    expect((await gateway(profiles("no space", { kind: "all" }))).status).toBe(400);
    expect((await gateway(profiles("support", { kind: "everything" }))).status).toBe(400);
  });

  it("applies several cells together, and none when one is wrong", async () => {
    const gateway = gatewayFor();
    const admin = await signInAs("ely@acme.fr");
    const bad = await gateway(
      put(admin, [
        { role: "sales", action: "deals.list", allowed: false },
        { role: "sales", action: "ghost", allowed: true },
      ]),
    );
    expect(bad.status).toBe(404);
    expect(await registry.roleAccess(toolId)).toEqual({});

    const both = await gateway(
      put(admin, [
        { role: "sales", action: "deals.list", allowed: false },
        { role: "viewer", action: "view:board", allowed: true },
      ]),
    );
    expect(both.status).toBe(200);
    const matrix = (await both.json()) as { views: string[]; cells: Record<string, any> };
    expect(matrix.views).toEqual(["board"]);
    expect(matrix.cells.viewer["view:board"]).toEqual({
      default: false,
      override: true,
      allowed: true,
    });
    expect(await registry.roleAccess(toolId)).toEqual({
      sales: { "deals.list": false },
      viewer: { "view:board": true },
    });
    expect((await gateway(put(admin, []))).status).toBe(400);
    // Give both back, so the next tests start from the manifest's levels.
    await gateway(
      put(admin, [
        { role: "sales", action: "deals.list", allowed: null },
        { role: "viewer", action: "view:board", allowed: null },
      ]),
    );
    expect(await registry.roleAccess(toolId)).toEqual({});
  });

  it("applies a change to the next call of a person with the role, and nobody else", async () => {
    const gateway = gatewayFor();
    const admin = await signInAs("ely@acme.fr");
    const bob = await signInAs("bob@acme.fr");
    await memory
      .prepare(`UPDATE "members" SET "roles" = ? WHERE "email" = ?`)
      .bind(JSON.stringify(["viewer"]), "bob@acme.fr")
      .all();
    const none = { "deals.list": false, "deals.move": false, "view:board": false };

    // `viewer` is a workspace role the tool does not map: holding it gives nothing (D-127).
    seen.length = 0;
    await gateway(at("/t/crm/api/deals.move", { headers: { cookie: bob } }));
    expect(JSON.parse(seen.at(-1)!)).toMatchObject({
      roles: ["viewer"],
      permissions: { viewer: [] },
      access: { viewer: none },
    });

    const mapped = await gateway(
      at("/console-api/api/tools/crm/access-matrix", {
        method: "PUT",
        headers: { cookie: admin, "content-type": "application/json" },
        body: JSON.stringify({
          profiles: [{ role: "viewer", grant: { kind: "profile", profile: "viewer" } }],
        }),
      }),
    );
    expect(mapped.status).toBe(200);
    expect(((await mapped.json()) as any).mapping.viewer).toEqual({
      kind: "profile",
      profile: "viewer",
    });
    await gateway(at("/t/crm/api/deals.move", { headers: { cookie: bob } }));
    expect(JSON.parse(seen.at(-1)!)).toMatchObject({
      permissions: { viewer: ["read"] },
      access: { viewer: { ...none, "deals.list": true } },
    });

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
    expect(JSON.parse(seen.at(-1)!).access).toEqual({
      viewer: { ...none, "deals.list": true, "deals.move": true },
    });

    // Back to the mapping.
    await gateway(put(admin, { role: "viewer", action: "deals.move", allowed: null }));
    await gateway(at("/t/crm/api/deals.move", { headers: { cookie: bob } }));
    expect(JSON.parse(seen.at(-1)!).access).toEqual({ viewer: { ...none, "deals.list": true } });
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
    expect(log.filter((e) => e.subject === "viewer:deals.move").map((e) => e.detail)).toEqual([
      { role: "viewer", action: "deals.move", from: true, to: false },
      { role: "viewer", action: "deals.move", from: false, to: true },
    ]);
    // The batch of two cells left two lines, and the one that failed left none.
    expect(log.filter((e) => e.subject === "viewer:view:board").map((e) => e.detail)).toEqual([
      { role: "viewer", action: "view:board", from: true, to: false },
      { role: "viewer", action: "view:board", from: false, to: true },
    ]);
    expect(log.filter((e) => e.subject === "profile:viewer").map((e) => e.detail)).toEqual([
      { role: "viewer", from: { kind: "none" }, to: { kind: "profile", profile: "viewer" } },
    ]);
    expect(log.some((e) => e.subject.includes("ghost") || e.subject.includes("support"))).toBe(
      false,
    );
    expect(log[0]!.actor).not.toBe("");
  });
});
