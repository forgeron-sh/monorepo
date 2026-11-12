import type { D1Database } from "@forgeron/hosting";
import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "../gateway";
import { ISSUER, simulatedProvider } from "../simulated-idp";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// Realtime through the whole gateway (D-135): the page's WebSocket goes to the room of the tool's channel
// with the person's identity, what the tool's actions published goes to the room and not to the caller,
// and an install without the Durable Object says so.

const now = new Date("2026-11-03T10:00:00Z");
let memory: MemoryD1;
let registry: Registry;
const room: Array<{
  url: string;
  headers: Record<string, string>;
  body: string | null;
  id: unknown;
}> = [];

const manifest = {
  name: "notes",
  version: "1.0.0",
  roles: { member: { grants: ["read", "write"], default: true } },
  actions: { "notes.list": { access: "read" }, "notes.add": { access: "write" } },
  views: { notes: { title: "Notes", path: "/", access: "read", entry: "views/notes.js" } },
  realtime: { channels: { notes: { access: "read" } } },
  resources: {},
};
const published = [{ channel: "notes", event: "changed" }];
const header = btoa(unescape(encodeURIComponent(JSON.stringify(published))));

const makeEnv = (withRoom: boolean): GatewayEnv => ({
  DB: memory as unknown as D1Database,
  BASE_DOMAIN: "forgeron.app",
  AUTH_SECRET: "test-secret-not-a-real-one",
  OIDC_ISSUER: ISSUER,
  OIDC_CLIENT_ID: "forgeron",
  ADMIN_EMAIL: "ely@acme.fr",
  MEMBER_EMAIL_DOMAINS: "acme.fr",
  DISPATCHER: {
    get: () => ({
      fetch: (request: Request) =>
        new Response(JSON.stringify([]), {
          headers: new URL(request.url).pathname.includes("notes.add")
            ? { "content-type": "application/json", "x-forgeron-realtime": header }
            : { "content-type": "application/json" },
        }),
    }),
  },
  ...(withRoom
    ? {
        REALTIME: {
          idFromName: (name: string) => name,
          get: (id: unknown) => ({
            fetch: async (request: Request) => {
              room.push({
                url: request.url,
                headers: Object.fromEntries(request.headers),
                body: request.method === "POST" ? await request.text() : null,
                id,
              });
              return new Response("upgraded", { status: 200 });
            },
          }),
        },
      }
    : {}),
});

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  const tool = await registry.createTool({ workspace: "acme", name: "notes" });
  const built = await registry.recordBuild(tool.id, {
    fingerprint: "fp",
    manifest,
    worker: "export default {}",
    views: { "views/notes.js": "export default 1;" },
  });
  const version = await registry.publishVersion(tool.id, built.id, "1.0.0");
  const production = await registry.ensureEnvironment(tool.id, "production");
  await registry.activate(production.id, version.id, { actor: "test" });
});
afterAll(() => memory.close());

const gatewayFor = (env: GatewayEnv, fetcher?: typeof fetch) =>
  createGateway(env, { now: () => now, ...(fetcher ? { fetch: fetcher } : {}) });
const at = (path: string, init: RequestInit = {}) =>
  new Request(`https://acme.forgeron.app${path}`, init);
const cookiesOf = (r: Response) =>
  r.headers
    .getSetCookie()
    .map((c) => c.split(";")[0]!)
    .filter((c) => !c.endsWith("="))
    .join("; ");

async function viewToken(env: GatewayEnv): Promise<string> {
  const idp = await simulatedProvider("ely@acme.fr", now);
  const gateway = gatewayFor(env, idp.fetcher);
  const login = await gateway(at("/auth/login"));
  const callback = await gateway(
    at(`/auth/callback${idp.signIn(login.headers.get("location")!)}`, {
      headers: { cookie: cookiesOf(login) },
    }),
  );
  const page = await gatewayFor(env)(at("/t/notes/", { headers: { cookie: cookiesOf(callback) } }));
  return JSON.parse((await page.text()).match(/type="application\/json">(.*)<\/script>/)![1]!)
    .token as string;
}

const upgrade = (query = "") =>
  at(`/t/notes/_f/realtime${query}`, { headers: { upgrade: "websocket" } });

describe("realtime through the gateway", () => {
  it("says so when the install has no room", async () => {
    const answer = await gatewayFor(makeEnv(false))(upgrade("?token=x"));
    expect(answer.status).toBe(501);
    expect(((await answer.json()) as { error: { code: string } }).error.code).toBe("NOT_ENABLED");
  });

  it("refuses a socket with no token, or a token that proves nobody", async () => {
    const gateway = gatewayFor(makeEnv(true));
    expect((await gateway(upgrade())).status).toBe(401);
    expect((await gateway(upgrade("?token=nope"))).status).toBe(401);
    expect(room).toEqual([]);
  });

  it("hands the room the person, what the manifest says of its channels and the tool's Worker", async () => {
    const env = makeEnv(true);
    const token = await viewToken(env);
    const answer = await gatewayFor(env)(upgrade(`?token=${encodeURIComponent(token)}`));
    expect(answer.status).toBe(200);
    expect(room).toHaveLength(1);
    expect(room[0]).toMatchObject({ url: "https://room/connect", id: "acme/notes" });
    const context = JSON.parse(room[0]!.headers["x-forgeron-room-context"]!);
    expect(context.user).toMatchObject({
      email: "ely@acme.fr",
      roles: expect.arrayContaining(["admin"]),
    });
    expect(context.manifest.realtime.channels.notes.access).toBe("read");
    expect(context.worker).toBe("acme--notes--production");
  });

  it("sends what an action published to the room, and keeps it from the caller", async () => {
    const env = makeEnv(true);
    const token = await viewToken(env);
    room.length = 0;
    const answer = await gatewayFor(env)(
      at("/t/notes/_f/call/notes.add", {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: "{}",
      }),
    );
    expect(answer.status).toBe(200);
    expect(answer.headers.get("x-forgeron-realtime")).toBeNull();
    expect(room).toHaveLength(1);
    expect(room[0]).toMatchObject({ url: "https://room/publish", id: "acme/notes" });
    expect(JSON.parse(room[0]!.body!)).toEqual(published);
  });

  it("does not let a caller forge what the gateway sets", async () => {
    const env = makeEnv(true);
    room.length = 0;
    const seen: string[] = [];
    (env.DISPATCHER as { get: unknown }).get = () => ({
      fetch: (request: Request) => {
        seen.push(
          request.headers.get("x-forgeron-directory") ?? "none",
          request.headers.get("x-forgeron-realtime") ?? "none",
        );
        return Response.json([]);
      },
    });
    await gatewayFor(env)(
      at("/t/notes/api/notes.list", {
        headers: { "x-forgeron-directory": '{"members":[]}', "x-forgeron-realtime": "e30=" },
      }),
    );
    expect(seen).toEqual(["none", "none"]);
  });
});
