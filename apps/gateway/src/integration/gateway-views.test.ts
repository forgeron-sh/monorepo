import type { D1Database } from "@forgeron/hosting";
import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "../gateway";
import { ISSUER, simulatedProvider } from "../simulated-idp";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// A tool's pages on the platform (D-134): the page of a view, the built files it loads, and the calls it
// makes with its token, through the whole gateway.

const now = new Date("2026-11-03T10:00:00Z");
let memory: MemoryD1;
let registry: Registry;
let env: GatewayEnv;
const workerCalls: Array<{ path: string; user: string | null; auth: string | null }> = [];

const manifest = {
  name: "notes",
  version: "1.0.0",
  profiles: { member: { grants: ["read", "write"], default: true } },
  actions: { "notes.list": { access: "read" } },
  views: {
    notes: { title: "Notes", path: "/", access: "read", entry: "views/notes.js" },
    board: { title: "Board", path: "/board", access: "read", entry: "views/board.js" },
  },
  resources: {},
};

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
    views: {
      "views/notes.js": "export default 'notes';",
      "views/board.js": "export default 'board';",
    },
  });
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
          workerCalls.push({
            path: new URL(request.url).pathname,
            user: request.headers.get("x-forgeron-user"),
            auth: request.headers.get("authorization"),
          });
          return Response.json([{ id: "n1" }]);
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

async function signIn(email: string): Promise<string> {
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

const bootstrapOf = (html: string) =>
  JSON.parse(
    html.match(/id="forgeron-bootstrap" type="application\/json">(.*)<\/script>/)![1]!,
  ) as {
    token: string;
    base: string;
    user: { email: string };
    callable: string[];
  };

describe("a tool's pages on the platform", () => {
  it("serves the page of a view to a signed-in person, sandboxed, with a token bound to the tool", async () => {
    const cookie = await signIn("ely@acme.fr");
    const page = await gatewayFor()(at("/t/notes/", { headers: { cookie } }));
    expect(page.status).toBe(200);
    expect(page.headers.get("content-security-policy")).toContain("sandbox allow-scripts");
    const html = await page.text();
    expect(html).toContain('src="/t/notes/_f/views/notes.js"');
    const bootstrap = bootstrapOf(html);
    expect(bootstrap).toMatchObject({ base: "/t/notes", user: { email: "ely@acme.fr" } });
    expect(bootstrap.callable).toContain("notes.list");
    expect(bootstrap.token.startsWith("fgt.")).toBe(true);
  });

  it("opens the first page when the tool has none at the root, and refuses a stranger", async () => {
    const gateway = gatewayFor();
    expect((await gateway(at("/t/notes/board"))).status).toBe(401);
    const cookie = await signIn("ely@acme.fr");
    expect((await gateway(at("/t/notes/board", { headers: { cookie } }))).status).toBe(200);
  });

  it("serves the built files without a cookie (a sandboxed page sends none), with CORS", async () => {
    const file = await gatewayFor()(at("/t/notes/_f/views/notes.js"));
    expect(file.status).toBe(200);
    expect(await file.text()).toBe("export default 'notes';");
    expect(file.headers.get("access-control-allow-origin")).toBe("*");
    expect(file.headers.get("content-type")).toContain("javascript");
    expect((await gatewayFor()(at("/t/notes/_f/views/none.js"))).status).toBe(404);
  });

  it("lets the page call its tool with its token, answers the preflight, and adds CORS to the answer", async () => {
    const cookie = await signIn("ely@acme.fr");
    const gateway = gatewayFor();
    const { token } = bootstrapOf(
      await (await gateway(at("/t/notes/", { headers: { cookie } }))).text(),
    );
    const preflight = await gateway(at("/t/notes/_f/call/notes.list", { method: "OPTIONS" }));
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get("access-control-allow-headers")).toContain("authorization");
    workerCalls.length = 0;
    const call = await gateway(
      at("/t/notes/_f/call/notes.list", {
        method: "POST",
        headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
        body: "{}",
      }),
    );
    expect(call.status).toBe(200);
    expect(call.headers.get("access-control-allow-origin")).toBe("*");
    expect(workerCalls).toHaveLength(1);
    expect(JSON.parse(workerCalls[0]!.user!)).toMatchObject({ email: "ely@acme.fr" });
    // A token that proves nobody reaches the tool as nobody: it carries no identity.
    await gateway(
      at("/t/notes/_f/call/notes.list", {
        method: "POST",
        headers: { authorization: "Bearer nope" },
        body: "{}",
      }),
    );
    expect(workerCalls.at(-1)!.user).toBeNull();
  });
});
