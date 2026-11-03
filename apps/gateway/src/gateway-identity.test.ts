import { createHash } from "node:crypto";
import type { Build, D1Database, Hosting } from "@forgeron/hosting";
import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "./gateway";
import { toBase64Url } from "./identity/sealed";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The gateway with its identity parts mounted: sign-in against a simulated OIDC provider, a session,
// the console API, a token for a tool, a tool call, and a deployment from a deployment token.

const now = new Date("2026-11-03T10:00:00Z");
const ISSUER = "https://idp.example.test";
const enc = new TextEncoder();

async function simulatedProvider(email: string) {
  const pair = await crypto.subtle.generateKey(
    {
      name: "RSASSA-PKCS1-v1_5",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["sign", "verify"],
  );
  const jwk = { ...(await crypto.subtle.exportKey("jwk", pair.publicKey)), kid: "k1", use: "sig" };
  const codes = new Map<string, { challenge: string; nonce: string }>();
  const sign = async (claims: object) => {
    const body = `${toBase64Url(enc.encode(JSON.stringify({ alg: "RS256", kid: "k1" })))}.${toBase64Url(enc.encode(JSON.stringify(claims)))}`;
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      pair.privateKey,
      enc.encode(body),
    );
    return `${body}.${toBase64Url(new Uint8Array(signature))}`;
  };
  const fetcher = (async (input: string, init?: RequestInit): Promise<Response> => {
    const url = new URL(input);
    if (url.pathname === "/.well-known/openid-configuration") {
      return Response.json({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/authorize`,
        token_endpoint: `${ISSUER}/token`,
        jwks_uri: `${ISSUER}/jwks`,
      });
    }
    if (url.pathname === "/jwks") return Response.json({ keys: [jwk] });
    if (url.pathname === "/token") {
      const form = new URLSearchParams(String(init?.body));
      const issued = codes.get(form.get("code") ?? "");
      const verified = createHash("sha256")
        .update(form.get("code_verifier") ?? "")
        .digest("base64url");
      if (!issued || issued.challenge !== verified) {
        return Response.json({ error: "invalid_grant" }, { status: 400 });
      }
      return Response.json({
        id_token: await sign({
          iss: ISSUER,
          aud: "forgeron",
          sub: `idp-${email}`,
          email,
          name: "Someone",
          exp: Math.floor(now.getTime() / 1000) + 300,
          nonce: issued.nonce,
        }),
      });
    }
    return new Response("nope", { status: 404 });
  }) as typeof fetch;
  /** The browser at the provider: signs in and comes back with a code. */
  const signIn = (authorizeUrl: string) => {
    const q = new URL(authorizeUrl).searchParams;
    codes.set("code-1", { challenge: q.get("code_challenge")!, nonce: q.get("nonce")! });
    return `?code=code-1&state=${q.get("state")}`;
  };
  return { fetcher, signIn };
}

let memory: MemoryD1;
let registry: Registry;
let env: GatewayEnv;
const deployed: string[] = [];
const toolCalls: string[] = [];

const hosting: Hosting = {
  async provision(environment) {
    return { environment, bindings: [] };
  },
  async upload(provisioned, build) {
    return { provisioned, build };
  },
  async migrate() {
    return { applied: [] };
  },
  async activate({ provisioned }) {
    deployed.push(provisioned.environment.name);
    return { url: "https://acme.forgeron.app/t/crm" };
  },
  async teardown() {},
};

const build: Build = {
  manifest: { name: "crm", resources: {} } as unknown as Build["manifest"],
  worker: "export default {}",
  fingerprint: "fp1",
  changelog: { entries: [{}], declared: "patch", detected: "patch" },
};

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  const tool = await registry.createTool({ workspace: "acme", name: "crm" });
  const built = await registry.recordBuild(tool.id, {
    fingerprint: "seed",
    manifest: { name: "crm" },
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
      get: (worker) => ({
        fetch: (request: Request) => {
          toolCalls.push(`${worker} ${request.headers.get("authorization") ? "with" : "no"} token`);
          return Response.json({ ok: true });
        },
      }),
    },
  };
});
afterAll(() => memory.close());

const gatewayFor = (fetcher?: typeof fetch) =>
  createGateway(env, {
    now: () => now,
    hosting: () => hosting,
    ...(fetcher ? { fetch: fetcher } : {}),
  });

const at = (path: string, init: RequestInit = {}) =>
  new Request(`https://acme.forgeron.app${path}`, init);
const cookiesOf = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0]!)
    .filter((c) => !c.endsWith("="))
    .join("; ");

/** Signs a person in through the whole flow and returns their session cookie. */
async function signInAs(email: string): Promise<{ status: number; cookie: string }> {
  const idp = await simulatedProvider(email);
  const gateway = gatewayFor(idp.fetcher);
  const login = await gateway(at("/auth/login"));
  expect(login.status).toBe(302);
  const callback = await gateway(
    at(`/auth/callback${idp.signIn(login.headers.get("location")!)}`, {
      headers: { cookie: cookiesOf(login) },
    }),
  );
  return { status: callback.status, cookie: cookiesOf(callback) };
}

const json = (body: unknown, headers: Record<string, string> = {}) => ({
  method: "POST",
  headers: { "content-type": "application/json", ...headers },
  body: JSON.stringify(body),
});

describe("the gateway with identity mounted", () => {
  it("refuses every step without credentials", async () => {
    const gateway = gatewayFor();
    expect((await gateway(at("/whoami"))).status).toBe(401);
    expect((await gateway(at("/console-api/api/tools"))).status).toBe(401);
    expect((await gateway(at("/auth/token", json({ tool: "crm", days: 1 })))).status).toBe(401);
    expect(
      (
        await gateway(
          at("/deploy-tokens", json({ tool: "crm", name: "ci", scope: "deploy", days: 1 })),
        )
      ).status,
    ).toBe(401);
    expect(
      (await gateway(at("/deploy", json({ environment: "production", version: "1.0.0", build }))))
        .status,
    ).toBe(401);
    // An anonymous call to a tool is not a seat.
    await gateway(at("/t/crm/api/x"));
    expect(await registry.countSeats("acme")).toBe(0);
  });

  it("refuses a person the workspace does not know, with no session", async () => {
    const refused = await signInAs("stranger@elsewhere.test");
    expect(refused).toEqual({ status: 403, cookie: "" });
  });

  it("signs in, calls the console API, mints a token, calls a tool and deploys from a deployment token", async () => {
    const { status, cookie } = await signInAs("ely@acme.fr");
    expect(status).toBe(302);
    expect(cookie).toContain("__Host-fg_session=");
    const gateway = gatewayFor();

    const me = await gateway(at("/whoami", { headers: { cookie } }));
    expect(await me.json()).toMatchObject({ email: "ely@acme.fr", roles: ["admin"] });

    const tools = await gateway(at("/console-api/api/tools", { headers: { cookie } }));
    expect(tools.status).toBe(200);

    // A personal token for one tool, and a call to that tool with it: the person is a seat.
    const issued = await gateway(at("/auth/token", json({ tool: "crm", days: 1 }, { cookie })));
    expect(issued.status).toBe(201);
    const { token } = (await issued.json()) as { token: string };
    const call = await gateway(
      at("/t/crm/api/x", { headers: { authorization: `Bearer ${token}` } }),
    );
    expect(call.status).toBe(200);
    expect(toolCalls.at(-1)).toBe("acme--crm--production with token");
    expect(await registry.countSeats("acme")).toBe(1);
    // The token is a person's, not a way to mint more tokens, and it is no deployment token.
    expect(
      (
        await gateway(
          at("/auth/token", json({ tool: "crm", days: 1 }, { authorization: `Bearer ${token}` })),
        )
      ).status,
    ).toBe(401);
    expect(
      (
        await gateway(
          at(
            "/deploy",
            json(
              { environment: "production", version: "1.0.1", build },
              { authorization: `Bearer ${token}` },
            ),
          ),
        )
      ).status,
    ).toBe(401);
    // The token works where it was issued: another workspace does not know it.
    const other = new Request("https://globex.forgeron.app/whoami", {
      headers: { authorization: `Bearer ${token}` },
    });
    expect((await gateway(other)).status).toBe(401);
    // An unknown tool gets no token.
    expect(
      (await gateway(at("/auth/token", json({ tool: "nope", days: 1 }, { cookie })))).status,
    ).toBe(404);

    // A deployment token, created by the administrator, deploys; it is nothing else.
    const created = await gateway(
      at("/deploy-tokens", json({ tool: "crm", name: "ci", scope: "deploy", days: 1 }, { cookie })),
    );
    expect(created.status).toBe(201);
    const { token: deployToken } = (await created.json()) as { token: string };
    const deploy = await gateway(
      at(
        "/deploy",
        json(
          { environment: "production", version: "1.0.1", build },
          { authorization: `Bearer ${deployToken}` },
        ),
      ),
    );
    expect(deploy.status).toBe(200);
    expect(deployed).toEqual(["production"]);
    expect(
      (await gateway(at("/whoami", { headers: { authorization: `Bearer ${deployToken}` } })))
        .status,
    ).toBe(401);
    expect(
      (
        await gateway(
          at("/console-api/api/tools", { headers: { authorization: `Bearer ${deployToken}` } }),
        )
      ).status,
    ).toBe(401);
  });

  it("makes a member of an allowed domain, without a role, who cannot create a deployment token", async () => {
    const { status, cookie } = await signInAs("anna@acme.fr");
    expect(status).toBe(302);
    const gateway = gatewayFor();
    expect(await (await gateway(at("/whoami", { headers: { cookie } }))).json()).toMatchObject({
      roles: [],
    });
    const refused = await gateway(
      at("/deploy-tokens", json({ tool: "crm", name: "ci", scope: "deploy", days: 1 }, { cookie })),
    );
    expect(refused.status).toBe(403);
  });

  it("ends the session and answers 404 on /auth when sign-in is not configured", async () => {
    const logout = await gatewayFor()(at("/auth/logout"));
    expect(logout.headers.get("set-cookie")).toContain("Max-Age=0");
    const bare = createGateway(
      { ...env, OIDC_ISSUER: undefined as unknown as string },
      { now: () => now },
    );
    expect((await bare(at("/auth/login"))).status).toBe(404);
  });

  it("keeps identity off, failing closed, without AUTH_SECRET", async () => {
    const off = createGateway({ DB: env.DB, BASE_DOMAIN: "forgeron.app" }, { now: () => now });
    expect((await off(at("/whoami"))).status).toBe(404);
    expect((await off(at("/console-api/api/tools"))).status).toBe(401);
  });
});
