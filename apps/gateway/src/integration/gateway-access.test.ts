import type { D1Database } from "@forgeron/hosting";
import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "../gateway";
import { ISSUER, simulatedProvider } from "../simulated-idp";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The access of a tool through the gateway (FOR-43, D-039, D-127, D-137): someone who holds
// `access:write` gives subjects (everyone, a team) a profile of the tool and sets exceptions on the console API, the next call to the tool carries the
// result in `x-forgeron-user`, a client cannot write that header, and every edit is in the audit log.

const now = new Date("2026-11-03T10:00:00Z");
const manifest = {
  name: "crm",
  profiles: { viewer: { grants: ["read"] }, sales: { grants: ["read", "write"] } },
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

/** Gives Bob a team, the way the console would: he is told apart by his teams alone. */
async function putBobIn(team: string): Promise<void> {
  const bob = (await registry.findMemberByEmail("acme", "bob@acme.fr"))!;
  await registry.createTeam("acme", { id: team, name: "Viewers", members: [bob.id] }, bob.id, [
    "*",
  ]);
}

const put = (cookie: string, body: unknown) =>
  at("/console-api/api/tools/crm/access-matrix", {
    method: "PUT",
    headers: { cookie, "content-type": "application/json" },
    body: JSON.stringify({ changes: Array.isArray(body) ? body : [body] }),
  });

describe("the access matrix through the gateway", () => {
  it("refuses anonymous callers and those without `access:read`, and answers an admin", async () => {
    const gateway = gatewayFor();
    const admin = await signInAs("ely@acme.fr");
    const member = await signInAs("bob@acme.fr");
    const path = "/console-api/api/tools/crm/access-matrix";
    expect((await gateway(at(path))).status).toBe(401);
    expect((await gateway(at(path, { headers: { cookie: member } }))).status).toBe(403);
    expect(
      (await gateway(put(member, { subject: "everyone", action: "deals.move", allowed: true })))
        .status,
    ).toBe(403);

    const answer = await gateway(at(path, { headers: { cookie: admin } }));
    expect(answer.status).toBe(200);
    const matrix = (await answer.json()) as {
      subjects: string[];
      subjectLabels: Record<string, string>;
      cells: Record<string, any>;
    };
    // The tool was never deployed through `deployBuild`: its default grants are shown all the same.
    expect(matrix.subjects).toEqual(["everyone", "team:admin", "team:developer"]);
    expect(matrix.subjectLabels).toMatchObject({ everyone: "Everyone", "team:admin": "Admins" });
    expect(matrix.cells["team:admin"]["deals.move"]).toEqual({ default: true, allowed: true });
    expect(matrix.cells.everyone["deals.move"]).toEqual({ default: false, allowed: false });
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
      (await gateway(put(admin, { subject: "everyone", action: "deals.move", allowed: "yes" })))
        .status,
    ).toBe(400);
    expect(
      (await gateway(put(admin, { subject: "no space", action: "deals.move", allowed: true })))
        .status,
    ).toBe(400);
    const profiles = (subject: string, grant: unknown) =>
      at("/console-api/api/tools/crm/access-matrix", {
        method: "PUT",
        headers: { cookie: admin, "content-type": "application/json" },
        body: JSON.stringify({ grants: [{ subject, grant }] }),
      });
    expect(
      (await gateway(profiles("everyone", { kind: "profile", profile: "ghost" }))).status,
    ).toBe(404);
    expect((await gateway(profiles("team:ghost", { kind: "all" }))).status).toBe(404);
    expect((await gateway(profiles("no space", { kind: "all" }))).status).toBe(400);
    expect((await gateway(profiles("everyone", { kind: "everything" }))).status).toBe(400);
  });

  it("applies several cells together, and none when one is wrong", async () => {
    const gateway = gatewayFor();
    const admin = await signInAs("ely@acme.fr");
    const bad = await gateway(
      put(admin, [
        { subject: "team:admin", action: "deals.list", allowed: false },
        { subject: "team:admin", action: "ghost", allowed: true },
      ]),
    );
    expect(bad.status).toBe(404);
    expect(await registry.accessExceptions(toolId)).toEqual({});

    const both = await gateway(
      put(admin, [
        { subject: "team:admin", action: "deals.list", allowed: false },
        { subject: "everyone", action: "view:board", allowed: true },
      ]),
    );
    expect(both.status).toBe(200);
    const matrix = (await both.json()) as { views: string[]; cells: Record<string, any> };
    expect(matrix.views).toEqual(["board"]);
    expect(matrix.cells.everyone["view:board"]).toEqual({
      default: false,
      override: true,
      allowed: true,
    });
    expect(await registry.accessExceptions(toolId)).toEqual({
      "team:admin": { "deals.list": false },
      everyone: { "view:board": true },
    });
    expect((await gateway(put(admin, []))).status).toBe(400);
    // Give both back, so the next tests start from the manifest's levels.
    await gateway(
      put(admin, [
        { subject: "team:admin", action: "deals.list", allowed: null },
        { subject: "everyone", action: "view:board", allowed: null },
      ]),
    );
    expect(await registry.accessExceptions(toolId)).toEqual({});
  });

  it("applies a change to the next call of a person in the team, and nobody else", async () => {
    const gateway = gatewayFor();
    const admin = await signInAs("ely@acme.fr");
    const bob = await signInAs("bob@acme.fr");
    await putBobIn("viewers");
    const none = { "deals.list": false, "deals.move": false, "view:board": false };

    // `team:viewers` has no grant in the tool: being in it gives nothing (D-127, D-137). Bob also
    // belongs to `everyone`, which the tool gives its default profile.
    const asEveryone = { ...none, "deals.list": true };
    seen.length = 0;
    await gateway(at("/t/crm/api/deals.move", { headers: { cookie: bob } }));
    expect(JSON.parse(seen.at(-1)!)).toMatchObject({
      subjects: ["everyone", "team:viewers"],
      permissions: { everyone: ["read"], "team:viewers": [] },
      access: { everyone: asEveryone, "team:viewers": none },
      // legacy (D-137): a runtime built before D-137 reads the subjects as `roles`.
      roles: ["everyone", "team:viewers"],
    });

    const mapped = await gateway(
      at("/console-api/api/tools/crm/access-matrix", {
        method: "PUT",
        headers: { cookie: admin, "content-type": "application/json" },
        body: JSON.stringify({
          grants: [{ subject: "team:viewers", grant: { kind: "profile", profile: "sales" } }],
        }),
      }),
    );
    expect(mapped.status).toBe(200);
    expect(((await mapped.json()) as any).grants["team:viewers"]).toEqual({
      kind: "profile",
      profile: "sales",
    });
    await gateway(at("/t/crm/api/deals.move", { headers: { cookie: bob } }));
    expect(JSON.parse(seen.at(-1)!)).toMatchObject({
      permissions: { "team:viewers": ["read", "write"] },
      access: {
        "team:viewers": { "deals.list": true, "deals.move": true, "view:board": true },
      },
    });

    const edited = await gateway(
      put(admin, { subject: "team:viewers", action: "deals.move", allowed: false }),
    );
    expect(edited.status).toBe(200);
    expect(((await edited.json()) as any).cells["team:viewers"]["deals.move"]).toEqual({
      default: true,
      override: false,
      allowed: false,
    });
    await gateway(at("/t/crm/api/deals.move", { headers: { cookie: bob } }));
    expect(JSON.parse(seen.at(-1)!).access).toEqual({
      everyone: asEveryone,
      "team:viewers": { "deals.list": true, "deals.move": false, "view:board": true },
    });

    // Back to the grant.
    await gateway(put(admin, { subject: "team:viewers", action: "deals.move", allowed: null }));
    await gateway(at("/t/crm/api/deals.move", { headers: { cookie: bob } }));
    expect(JSON.parse(seen.at(-1)!).access).toEqual({
      everyone: asEveryone,
      "team:viewers": { "deals.list": true, "deals.move": true, "view:board": true },
    });
  });

  it("never lets the client write x-forgeron-user, and sends nothing for an anonymous call", async () => {
    const gateway = gatewayFor();
    const spoof = JSON.stringify({ id: "root", subjects: ["team:admin"], access: {} });
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
    expect(log.filter((e) => e.subject === "team:viewers:deals.move").map((e) => e.detail)).toEqual(
      [
        { subject: "team:viewers", action: "deals.move", from: false, to: true },
        { subject: "team:viewers", action: "deals.move", from: true, to: false },
      ],
    );
    // The batch of two cells left two lines, and the one that failed left none.
    expect(log.filter((e) => e.subject === "everyone:view:board").map((e) => e.detail)).toEqual([
      { subject: "everyone", action: "view:board", from: true, to: false },
      { subject: "everyone", action: "view:board", from: false, to: true },
    ]);
    expect(log.filter((e) => e.subject === "grant:team:viewers").map((e) => e.detail)).toEqual([
      {
        subject: "team:viewers",
        from: { kind: "none" },
        to: { kind: "profile", profile: "sales" },
      },
    ]);
    expect(log.some((e) => e.subject.includes("ghost"))).toBe(false);
    expect(log[0]!.actor).not.toBe("");
  });
});
