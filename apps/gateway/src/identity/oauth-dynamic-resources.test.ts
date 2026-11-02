import { createHash, randomBytes } from "node:crypto";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { Miniflare } from "miniflare";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

// Spike FOR-19: can the gateway issue tokens scoped to a tool, with the tools created and deleted
// while it runs, though `workers-oauth-provider` fixes its resources at construction?
// Answer in docs/DECISIONS.md (D-013): yes, if the authorization server is built from the registry
// instead of once. Each test is one finding, run on the real library in workerd.

const library = readFileSync(
  createRequire(import.meta.url).resolve("@cloudflare/workers-oauth-provider"),
  "utf8",
);

// The prototype of the gateway: one authorization server per workspace, its resources taken from a
// registry (here a KV key) and a protected resource per tool. `x-mode: static` builds the
// provider once per isolate, the way the library's examples do.
const gateway = `
import { OAuthAuthorizationServer, OAuthResourceServer } from "./oauth-provider.js";
const ISSUER = "https://acme.forgeron.app";
const resourceOf = (tool) => ISSUER + "/t/" + tool + "/mcp";
const registry = async (env) => JSON.parse((await env.OAUTH_KV.get("registry")) ?? "[]");
const options = (resources) => ({
  issuer: ISSUER, resources, scopesSupported: ["tool"], clientRegistrationEndpoint: ISSUER + "/register",
});
let cached;
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/admin/tools" && request.method === "POST") {
      const { name } = await request.json();
      const list = await registry(env);
      list.push(name === "workspace" ? ISSUER + "/mcp" : resourceOf(name));
      await env.OAUTH_KV.put("registry", JSON.stringify(list));
      return Response.json(list);
    }
    if (url.pathname === "/empty") {
      try { new OAuthAuthorizationServer(options([])); return Response.json({ built: true }); }
      catch (error) { return Response.json({ error: String(error.message) }); }
    }
    const mode = request.headers.get("x-mode") ?? "per-request";
    const as = mode === "static"
      ? (cached ??= new OAuthAuthorizationServer(options(await registry(env))))
      : new OAuthAuthorizationServer(options(await registry(env)));
    if (url.pathname === "/authorize") {
      const api = as.getOAuthApi(env);
      let req;
      try { req = await api.parseAuthRequest(request); }
      catch (error) { return Response.json({ code: error.code, description: error.description }, { status: 400 }); }
      const { redirectTo } = await api.completeAuthorization({ request: req, userId: "ely", metadata: {}, scope: req.scope, props: { user: "ely" } });
      return Response.redirect(redirectTo, 302);
    }
    const match = url.pathname.match(/^\\/t\\/([^/]+)\\/mcp/);
    if (match) {
      const server = new OAuthResourceServer({
        resourceMetadata: { resource: resourceOf(match[1]), authorization_servers: [ISSUER] },
        validateToken: () => (resource, token) => as.validateToken(resource, token, env),
        handler: { fetch: (_req, _env, c) => Response.json({ tool: match[1], audience: c.auth.audience }) },
      });
      return server.fetch(request, env, ctx);
    }
    return as.fetch(request, env, ctx);
  },
};`;

const H = "https://acme.forgeron.app";
const REDIRECT = "http://localhost/cb";
let mf: Miniflare;
const send = (path: string, init: RequestInit & { headers?: Record<string, string> } = {}) =>
  mf.dispatchFetch(H + path, { redirect: "manual", ...init } as never);
const b64 = (bytes: Buffer) => bytes.toString("base64url");

const createTool = (name: string) =>
  send("/admin/tools", { method: "POST", body: JSON.stringify({ name }) });

async function registerClient(): Promise<string> {
  const res = await send("/register", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      client_name: "claude",
      redirect_uris: [REDIRECT],
      token_endpoint_auth_method: "none",
      grant_types: ["authorization_code"],
      response_types: ["code"],
    }),
  });
  return ((await res.json()) as { client_id: string }).client_id;
}

/** The authorization-code flow with PKCE, as an MCP client runs it for one tool. */
async function getToken(clientId: string, tool: string, mode = "per-request") {
  const verifier = b64(randomBytes(32));
  const query = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: REDIRECT,
    code_challenge: b64(createHash("sha256").update(verifier).digest()),
    code_challenge_method: "S256",
    scope: "tool",
    state: "s",
    resource: `${H}/t/${tool}/mcp`,
  });
  const auth = await send(`/authorize?${query}`, { headers: { "x-mode": mode } });
  if (auth.status !== 302)
    return { error: (await auth.json()) as { code: string; description: string } };
  const code = new URL(auth.headers.get("location")!).searchParams.get("code")!;
  const res = await send("/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", "x-mode": mode },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      code,
      redirect_uri: REDIRECT,
      client_id: clientId,
      code_verifier: verifier,
      resource: `${H}/t/${tool}/mcp`,
    }),
  });
  return { token: ((await res.json()) as { access_token: string }).access_token };
}

const callTool = async (tool: string, token: string) => {
  const res = await send(`/t/${tool}/mcp`, { headers: { authorization: `Bearer ${token}` } });
  return {
    status: res.status,
    body: res.status === 200 ? ((await res.json()) as object) : undefined,
  };
};

beforeAll(async () => {
  mf = new Miniflare({
    modules: [
      { type: "ESModule", path: "gateway.js", contents: gateway },
      { type: "ESModule", path: "oauth-provider.js", contents: library },
    ],
    compatibilityDate: "2026-07-01",
    compatibilityFlags: ["nodejs_compat"],
    kvNamespaces: ["OAUTH_KV"],
  });
  await mf.ready;
  // A workspace always declares one resource: the library refuses an empty list.
  await createTool("workspace");
}, 60_000);
afterAll(() => mf.dispose());

describe("tokens scoped to a tool, with tools created while the gateway runs", () => {
  it("gives a tool created at runtime a valid token, without redeploying", async () => {
    const client = await registerClient();
    await createTool("crm");
    const crm = await getToken(client, "crm");
    expect(await callTool("crm", crm.token!)).toEqual({
      status: 200,
      body: { tool: "crm", audience: `${H}/t/crm/mcp` },
    });

    // The same running Worker, a second tool created now.
    await createTool("odoo");
    const odoo = await getToken(await registerClient(), "odoo");
    expect(await callTool("odoo", odoo.token!)).toEqual({
      status: 200,
      body: { tool: "odoo", audience: `${H}/t/odoo/mcp` },
    });
  });

  it("a token is good for its own tool only", async () => {
    await createTool("sales");
    await createTool("support");
    const client = await registerClient();
    const sales = await getToken(client, "sales");
    const support = await getToken(client, "support");
    expect((await callTool("support", sales.token!)).status).toBe(401);
    expect((await callTool("sales", support.token!)).status).toBe(401);
    // And each is still good for its own tool.
    expect((await callTool("sales", sales.token!)).status).toBe(200);
    expect((await callTool("support", support.token!)).status).toBe(200);
  });

  it("a provider built once rejects a tool created after it: the risk of the Toolbox POC", async () => {
    const client = await registerClient();
    await createTool("early");
    // Builds the provider once, with the tools that exist now.
    expect((await getToken(client, "early", "static")).token).toBeTruthy();

    await createTool("late");
    const late = await getToken(client, "late", "static");
    expect(late.error).toMatchObject({
      code: "invalid_target",
      description: "The resource parameter must name exactly one configured protected resource",
    });
    // Built from the registry each time, the same request works.
    expect((await getToken(client, "late")).token).toBeTruthy();
  });

  it("refuses an empty list of resources: a workspace always declares one", async () => {
    const body = (await (await send("/empty")).json()) as { error: string };
    expect(body.error).toContain("resources must list at least one canonical protected resource");
  });
});

describe("what the gateway has to handle itself", () => {
  it("a deleted tool: the library fails closed with a 503, so the gateway answers 404 first", async () => {
    await createTool("gone");
    const client = await registerClient();
    const gone = await getToken(client, "gone");
    expect((await callTool("gone", gone.token!)).status).toBe(200);

    const kv = (await mf.getKVNamespace("OAUTH_KV")) as unknown as {
      get(key: string): Promise<string | null>;
      put(key: string, value: string): Promise<void>;
    };
    const list = (JSON.parse((await kv.get("registry"))!) as string[]).filter(
      (r) => !r.includes("/t/gone/"),
    );
    await kv.put("registry", JSON.stringify(list));
    expect((await callTool("gone", gone.token!)).status).toBe(503);
  });

  it("authorizing the same client again for the same tool revokes the previous grant", async () => {
    await createTool("planner");
    const client = await registerClient();
    const first = await getToken(client, "planner");
    expect((await callTool("planner", first.token!)).status).toBe(200);
    const second = await getToken(client, "planner");
    expect((await callTool("planner", second.token!)).status).toBe(200);
    expect((await callTool("planner", first.token!)).status).toBe(401);
  });
});
