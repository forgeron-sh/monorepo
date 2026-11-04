import type { D1Database } from "@forgeron/hosting";
import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "./gateway";
import { ISSUER, simulatedProvider } from "./simulated-idp";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The catalog through the gateway (FOR-137, D-061): any signed-in member reads it, a person with no role
// sees the tool as `requestable`, a README is text and never HTML, an image is served from the bundle
// with `nosniff` and a CSP, and no path leaves the bundle.

const now = new Date("2026-11-03T10:00:00Z");
const README = '# CRM\n<script>alert("x")</script>\n![shot](docs/shot.png)';
const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 9, 9, 9]);
const SVG = '<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>';

const hex = async (bytes: Uint8Array) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

let memory: MemoryD1;
let registry: Registry;
let env: GatewayEnv;
let pngHash: string;

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);

  const tool = await registry.createTool({ workspace: "acme", name: "crm" });
  const svg = new TextEncoder().encode(SVG);
  pngHash = await hex(PNG);
  const files = [
    { path: "docs/shot.png", type: "image/png", bytes: PNG },
    { path: "docs/icon.svg", type: "image/svg+xml", bytes: svg },
  ];
  const build = await registry.recordBuild(tool.id, {
    fingerprint: "fp",
    manifest: {
      name: "crm",
      title: "CRM",
      description: "Companies and leads.",
      icon: "docs/icon.svg",
      interfaces: { mcp: true, api: true, cli: true, web: false },
      roles: {
        viewer: { label: "Viewer", grants: ["read"] },
        sales: { grants: ["read", "write"] },
      },
      actions: { "deals.list": { access: "read" }, "deals.move": { access: "write" } },
      resources: {},
    },
  });
  await registry.storeDocs(tool.id, build.id, {
    readme: README,
    assets: await Promise.all(
      files.map(async (f) => ({
        path: f.path,
        type: f.type,
        size: f.bytes.length,
        hash: await hex(f.bytes),
        base64: Buffer.from(f.bytes).toString("base64"),
      })),
    ),
  });
  const version = await registry.publishVersion(tool.id, build.id, "1.0.0");
  const production = await registry.ensureEnvironment(tool.id, "production");
  await registry.activate(production.id, version.id, { actor: "test" });
  // A tool of another workspace, with the same name: never visible here.
  await registry.createTool({ workspace: "globex", name: "secret" });

  // A member who has a role, and one who has none (bob@acme.fr signs in with the domain, roleless).
  await registry.addMember({
    workspace: "acme",
    subject: "carol-subject",
    email: "carol@acme.fr",
    name: "Carol",
    roles: ["viewer"],
  });

  env = {
    DB: d1,
    BASE_DOMAIN: "forgeron.app",
    AUTH_SECRET: "test-secret-not-a-real-one",
    OIDC_ISSUER: ISSUER,
    OIDC_CLIENT_ID: "forgeron",
    ADMIN_EMAIL: "ely@acme.fr",
    MEMBER_EMAIL_DOMAINS: "acme.fr",
    DISPATCHER: { get: () => ({ fetch: () => Response.json({ ok: true }) }) },
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

const API = "/console-api/api/catalog";

describe("the catalog through the gateway", () => {
  it("is for signed-in members: anonymous is 401, on the list, the card and the images", async () => {
    const gateway = gatewayFor();
    for (const path of [API, `${API}/crm`, `${API}/crm/assets/docs/shot.png`]) {
      expect((await gateway(at(path))).status).toBe(401);
    }
  });

  it("lists the tool as requestable for a member with no role, with the roles to ask for", async () => {
    const gateway = gatewayFor();
    const bob = await signInAs("bob@acme.fr");
    const answer = await gateway(at(API, { headers: { cookie: bob } }));
    expect(answer.status).toBe(200);
    const { tools } = (await answer.json()) as { tools: Array<Record<string, any>> };
    expect(tools).toHaveLength(1);
    expect(tools[0]).toMatchObject({
      name: "crm",
      title: "CRM",
      summary: "Companies and leads.",
      productionVersion: "1.0.0",
      interfaces: { mcp: true, api: true, cli: true, web: false },
      access: "requestable",
      roles: [
        { name: "viewer", label: "Viewer" },
        { name: "sales", label: "sales" },
      ],
    });
    expect(tools[0]!.icon).toMatch(
      /^\/console-api\/api\/catalog\/crm\/assets\/docs\/icon\.svg\?v=/,
    );
  });

  it("says granted to a person whose role may call an action, and which ones", async () => {
    const gateway = gatewayFor();
    const carol = await signInAs("carol@acme.fr");
    const card = (await (
      await gateway(at(`${API}/crm`, { headers: { cookie: carol } }))
    ).json()) as any;
    expect(card.access).toBe("granted");
    expect(card.yourAccess).toEqual([
      { action: "deals.list", allowed: true },
      { action: "deals.move", allowed: false },
    ]);
    expect(card.connect).toEqual({
      mcp: { url: "https://acme.forgeron.app/t/crm/mcp" },
      api: { baseUrl: "https://acme.forgeron.app/t/crm/api" },
      cli: { command: "forgeron crm --help" },
    });
    expect(card.assets.map((a: { path: string }) => a.path)).toEqual([
      "docs/icon.svg",
      "docs/shot.png",
    ]);
    expect(card.lastRelease).toMatchObject({ version: "1.0.0" });
  });

  it("returns the README as a JSON string of markdown, never as HTML", async () => {
    const gateway = gatewayFor();
    const bob = await signInAs("bob@acme.fr");
    const response = await gateway(at(`${API}/crm`, { headers: { cookie: bob } }));
    expect(response.headers.get("content-type")).toBe("application/json");
    expect(response.headers.get("cache-control")).toBe("no-store");
    const card = (await response.json()) as { readme: string };
    expect(card.readme).toBe(README);
    // The README is not reachable as a file either.
    expect(
      (await gateway(at(`${API}/crm/assets/README.md`, { headers: { cookie: bob } }))).status,
    ).toBe(404);
  });

  it("serves an image with its type, nosniff, a strict CSP and an immutable cache keyed by hash", async () => {
    const gateway = gatewayFor();
    const bob = await signInAs("bob@acme.fr");
    const png = await gateway(
      at(`${API}/crm/assets/docs/shot.png?v=${pngHash}`, { headers: { cookie: bob } }),
    );
    expect(png.status).toBe(200);
    expect(png.headers.get("content-type")).toBe("image/png");
    expect(png.headers.get("x-content-type-options")).toBe("nosniff");
    expect(png.headers.get("content-security-policy")).toBe("default-src 'none'; sandbox");
    expect(png.headers.get("cache-control")).toBe("private, max-age=31536000, immutable");
    expect([...new Uint8Array(await png.arrayBuffer())]).toEqual([...PNG]);

    const svg = await gateway(at(`${API}/crm/assets/docs/icon.svg`, { headers: { cookie: bob } }));
    expect(svg.headers.get("content-type")).toBe("image/svg+xml");
    expect(svg.headers.get("content-security-policy")).toBe(
      "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    );
    // Without the hash of the file, the answer is not cached as immutable.
    expect(svg.headers.get("cache-control")).toBe("private, no-store");
  });

  it("refuses a path that leaves the bundle, a file that is not there, and another tool", async () => {
    const gateway = gatewayFor();
    const bob = await signInAs("bob@acme.fr");
    const get = (path: string) => gateway(at(`${API}${path}`, { headers: { cookie: bob } }));
    for (const path of [
      "/crm/assets/..%2F..%2Fforgeron.config.ts",
      "/crm/assets/docs%2F..%2F..%2Fx.png",
      "/crm/assets/%2e%2e/%2e%2e/etc/passwd",
      "/crm/assets/docs%5C..%5Cshot.png",
      "/crm/assets/docs/shot.png%00.svg",
      "/crm/assets//docs/shot.png",
      "/crm/assets/%E0%A4%A",
      "/crm/assets/docs/none.png",
      "/ghost",
      "/ghost/assets/docs/shot.png",
      "/secret",
    ]) {
      expect((await get(path)).status).toBe(404);
    }
  });

  it("answers GET only", async () => {
    const gateway = gatewayFor();
    const bob = await signInAs("bob@acme.fr");
    expect((await gateway(at(API, { method: "POST", headers: { cookie: bob } }))).status).toBe(405);
  });

  it("answers 405 to another method on the card and the image too, even to nobody", async () => {
    const gateway = gatewayFor();
    for (const path of [`${API}/crm`, `${API}/crm/assets/docs/shot.png`]) {
      for (const method of ["POST", "PUT", "DELETE"]) {
        expect((await gateway(at(path, { method }))).status).toBe(405);
      }
    }
  });

  it("answers HEAD for an image without a body, with the same headers", async () => {
    const gateway = gatewayFor();
    const bob = await signInAs("bob@acme.fr");
    const head = await gateway(
      at(`${API}/crm/assets/docs/shot.png?v=${pngHash}`, {
        method: "HEAD",
        headers: { cookie: bob },
      }),
    );
    expect(head.status).toBe(200);
    expect(head.headers.get("content-type")).toBe("image/png");
    expect(head.headers.get("cache-control")).toBe("private, max-age=31536000, immutable");
    expect(await head.text()).toBe("");
  });
});

describe("the OpenAPI document", () => {
  const DOC = "/console-api/api/openapi.json";

  it("is for signed-in members, like the catalog it describes: anonymous is 401", async () => {
    const gateway = gatewayFor();
    const anonymous = await gateway(at(DOC));
    expect(anonymous.status).toBe(401);
    expect(await anonymous.json()).toEqual({ error: "UNAUTHENTICATED" });
  });

  it("is OpenAPI 3.1, never cached, and lists the catalog routes with their answers", async () => {
    const gateway = gatewayFor();
    const bob = await signInAs("bob@acme.fr");
    const response = await gateway(at(DOC, { headers: { cookie: bob } }));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    const doc = (await response.json()) as {
      openapi: string;
      servers: { url: string }[];
      paths: Record<string, Record<string, { responses: Record<string, unknown> }>>;
    };
    expect(doc.openapi).toBe("3.1.0");
    expect(doc.servers).toEqual([{ url: "/console-api" }]);
    expect(Object.keys(doc.paths)).toEqual(
      expect.arrayContaining([
        "/api/catalog",
        "/api/catalog/{tool}",
        "/api/catalog/{tool}/assets/{path}",
      ]),
    );
    expect(Object.keys(doc.paths["/api/catalog/{tool}"]!.get!.responses).sort()).toEqual([
      "200",
      "401",
      "404",
      "500",
    ]);
    const image = doc.paths["/api/catalog/{tool}/assets/{path}"]!.get!.responses["200"] as {
      content: object;
    };
    expect(Object.keys(image.content).sort()).toEqual([
      "image/gif",
      "image/jpeg",
      "image/png",
      "image/svg+xml",
      "image/webp",
    ]);
  });

  it("is not a way to write: a POST is not answered by Hono", async () => {
    const gateway = gatewayFor();
    const bob = await signInAs("bob@acme.fr");
    const res = await gateway(at(DOC, { method: "POST", headers: { cookie: bob } }));
    expect(res.status).toBe(404);
  });
});
