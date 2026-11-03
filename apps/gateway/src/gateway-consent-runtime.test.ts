import type { D1Database } from "@forgeron/hosting";
import {
  createRegistry,
  createSecretBox,
  migratePlatform,
  type Registry,
} from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "./gateway";
import { simulatedProvider } from "./simulated-idp";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// A person's consent at run time (D-046): the tool's Worker is handed the caller's own access token
// (refreshed with the sealed refresh token), or the link to consent; the refresh token never leaves.

let clock = new Date("2026-11-03T10:00:00Z");
const now = () => clock;
// Throwaway key made of zeros: it protects nothing and is not a secret.
const KEY = btoa(String.fromCharCode(...new Uint8Array(32)));

let memory: MemoryD1;
let registry: Registry;
let env: GatewayEnv;
let toolId = "";
const seen: Array<Headers> = [];
let admin = "";
let ana = "";
let refreshAnswer: "ok" | "revoked" | "down" | "5xx" = "ok";
let issued = 0;

const client = {
  authorizeUrl: "https://login.example.test/authorize",
  tokenUrl: "https://login.example.test/token",
  clientId: "connector-client",
  clientSecret: "connector-secret-for-tests",
};
// The connector's identity provider, simulated: a code gives tokens, a refresh gives new ones.
const provider = (async (url: string, init?: RequestInit) => {
  if (String(url) !== client.tokenUrl) return new Response("nope", { status: 404 });
  const form = new URLSearchParams(String(init?.body));
  if (form.get("grant_type") === "refresh_token") {
    if (form.get("refresh_token") !== "rt-secret") return Response.json({}, { status: 400 });
    if (refreshAnswer === "down") throw new Error("network down");
    if (refreshAnswer === "5xx") return new Response("<html>bad gateway</html>", { status: 502 });
    if (refreshAnswer === "revoked")
      return Response.json({ error: "invalid_grant" }, { status: 400 });
    return Response.json({ access_token: `at-${++issued}`, expires_in: 3600 });
  }
  return Response.json({
    access_token: `at-${++issued}`,
    refresh_token: "rt-secret",
    expires_in: 3600,
  });
}) as typeof fetch;

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { secrets: await createSecretBox(KEY), now });
  const tool = await registry.createTool({ workspace: "acme", name: "mail" });
  toolId = tool.id;
  const built = await registry.recordBuild(tool.id, {
    fingerprint: "fp",
    manifest: {
      name: "mail",
      resources: {
        connectors: {
          microsoft: { type: "microsoft-365", mode: "delegated", scopes: ["Mail.Send"], why: "x" },
          odoo: { type: "odoo", mode: "application", scopes: [], why: "x" },
        },
      },
    },
  });
  const version = await registry.publishVersion(tool.id, built.id, "1.0.0");
  const production = await registry.ensureEnvironment(tool.id, "production");
  await registry.activate(production.id, version.id, { actor: "test" });
  env = {
    DB: d1,
    BASE_DOMAIN: "forgeron.app",
    AUTH_SECRET: "test-secret-not-a-real-one",
    SECRETS_KEY: KEY,
    OIDC_ISSUER: "https://idp.example.test",
    OIDC_CLIENT_ID: "forgeron",
    ADMIN_EMAIL: "root@acme.fr",
    MEMBER_EMAIL_DOMAINS: "acme.fr",
    DISPATCHER: {
      get: () => ({
        fetch: (request: Request) => {
          seen.push(request.headers);
          return Response.json({ ok: true });
        },
      }),
    },
  };
  admin = await signIn("root@acme.fr");
  ana = await signIn("ana@acme.fr");
});
afterAll(() => memory.close());

const gatewayFor = (fetcher?: typeof fetch) =>
  createGateway(env, { now, ...(fetcher ? { fetch: fetcher } : {}) });
const at = (path: string, init: RequestInit = {}) =>
  new Request(`https://acme.forgeron.app${path}`, init);
const cookiesOf = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0]!)
    .filter((c) => !c.endsWith("="))
    .join("; ");
const send = (method: string, body: unknown, cookie: string) => ({
  method,
  headers: { "content-type": "application/json", cookie },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

async function signIn(email: string): Promise<string> {
  const idp = await simulatedProvider(email, clock);
  const gateway = gatewayFor(idp.fetcher);
  const login = await gateway(at("/auth/login"));
  const callback = await gateway(
    at(`/auth/callback${idp.signIn(login.headers.get("location")!)}`, {
      headers: { cookie: cookiesOf(login) },
    }),
  );
  return cookiesOf(callback);
}

const callTool = async (cookie: string, extra: Record<string, string> = {}) => {
  seen.length = 0;
  const response = await gatewayFor(provider)(
    at("/t/mail/api/send", { headers: { cookie, ...extra } }),
  );
  expect(response.status).toBe(200);
  const headers = seen[0]!;
  const parse = (name: string) =>
    JSON.parse(headers.get(name) ?? "null") as Record<string, string> | null;
  return {
    tokens: parse("x-forgeron-connector-tokens"),
    links: parse("x-forgeron-connector-consent"),
    all: JSON.stringify([...headers.entries()]),
  };
};

const consentPath = "/console-api/api/tools/mail/environments/production/consent/microsoft";
const auditOf = async (subjectLike: string) =>
  (
    await memory
      .prepare(
        `SELECT "actor", "kind", "subject", "detail" FROM "audit_log" WHERE "subject" LIKE ? ORDER BY "rowid"`,
      )
      .bind(subjectLike)
      .all()
  ).results as Array<{ actor: string; kind: string; subject: string; detail: string }>;

describe("the tool's call carries the caller's own consent", () => {
  it("registering the OAuth client is audited, without the secret", async () => {
    const put = await gatewayFor()(
      at("/console-api/api/connector-clients/microsoft-365", send("PUT", client, admin)),
    );
    expect(put.status).toBe(201);
    const lines = await auditOf("connector-client:%");
    expect(lines).toEqual([
      expect.objectContaining({ kind: "access", subject: "connector-client:microsoft-365:set" }),
    ]);
    expect(JSON.stringify(lines)).not.toContain("connector-secret-for-tests");
  });

  it("before consent: no token, the link to consent, and a spoofed header is dropped", async () => {
    const before = await callTool(ana, {
      "x-forgeron-connector-tokens": JSON.stringify({ microsoft: "forged" }),
    });
    expect(before.tokens).toBeNull();
    expect(before.links).toEqual({
      microsoft: `https://acme.forgeron.app${consentPath}`,
    });
    expect(before.all).not.toContain("forged");
    // The application-mode connector needs nobody's consent.
    expect(before.links).not.toHaveProperty("odoo");
    expect(await auditOf("connector-token:%")).toEqual([]);
  });

  it("after consent: the access token, never the refresh token, and one audit line per use", async () => {
    const gateway = gatewayFor(provider);
    const start = await gateway(at(consentPath, send("GET", undefined, ana)));
    const state = new URL(start.headers.get("location")!).searchParams.get("state")!;
    const done = await gateway(
      at(
        `/console-api/api/consent/callback?state=${encodeURIComponent(state)}&code=c`,
        send("GET", undefined, ana),
      ),
    );
    expect(done.status).toBe(200);
    expect(done.headers.get("content-type")).toContain("application/json");
    // A person who follows the provider's redirect with a state it did not give gets a page.
    const request = send("GET", undefined, ana);
    const refused = await gateway(
      at("/console-api/api/consent/callback?state=unknown&code=c", {
        ...request,
        headers: { ...request.headers, accept: "text/html" },
      }),
    );
    expect(refused.headers.get("content-type")).toContain("text/html");
    expect(refused.status).toBeGreaterThanOrEqual(400);
    expect(await refused.text()).toContain("<h1>");

    const after = await callTool(ana);
    expect(after.tokens).toEqual({ microsoft: "at-1" });
    expect(after.links).toBeNull();
    expect(after.all).not.toContain("rt-secret");
    const lines = await auditOf("connector-token:%");
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ kind: "access", subject: "connector-token:microsoft-365" });
    // Someone else's call gets nothing of Ana's.
    const other = await callTool(admin);
    expect(other.tokens).toBeNull();
    expect(other.all).not.toContain("at-1");
  });

  it("refreshes an expired token with the sealed refresh token", async () => {
    clock = new Date(clock.getTime() + 2 * 3600_000);
    const refreshed = await callTool(ana);
    expect(refreshed.tokens).toEqual({ microsoft: "at-2" });
    expect(refreshed.all).not.toContain("rt-secret");
  });

  it("a provider that is down is a 502, not a request to consent again", async () => {
    clock = new Date(clock.getTime() + 2 * 3600_000);
    refreshAnswer = "down";
    const response = await gatewayFor(provider)(
      at("/t/mail/api/send", { headers: { cookie: ana } }),
    );
    expect(response.status).toBe(502);
    refreshAnswer = "ok";
  });

  it("a 5xx from the token endpoint is a retryable 502 and the consent is kept", async () => {
    refreshAnswer = "5xx";
    const response = await gatewayFor(provider)(
      at("/t/mail/api/send", { headers: { cookie: ana } }),
    );
    expect(response.status).toBe(502);
    expect(response.headers.get("retry-after")).toBe("30");
    expect(await response.json()).toMatchObject({ error: { code: "UPSTREAM", retryable: true } });
    refreshAnswer = "ok";
    // The provider is back: the same consent still gives a token, no new consent needed.
    const again = await callTool(ana);
    expect(again.links).toBeNull();
    expect(again.tokens).toMatchObject({ microsoft: expect.stringMatching(/^at-/) });
  });

  it("a revoked refresh token sends the person back to consent", async () => {
    clock = new Date(clock.getTime() + 90 * 60_000);
    refreshAnswer = "revoked";
    const revoked = await callTool(ana);
    expect(revoked.tokens).toBeNull();
    expect(revoked.links).toHaveProperty("microsoft");
    refreshAnswer = "ok";
  });

  it("an admin's revocation takes effect on the next call and is audited", async () => {
    const gateway = gatewayFor(provider);
    const start = await gateway(at(consentPath, send("GET", undefined, ana)));
    const state = new URL(start.headers.get("location")!).searchParams.get("state")!;
    await gateway(
      at(
        `/console-api/api/consent/callback?state=${encodeURIComponent(state)}&code=c`,
        send("GET", undefined, ana),
      ),
    );
    expect((await callTool(ana)).tokens).not.toBeNull();
    const person = (await registry.listConnections(toolId, "production"))[0]!.userId;
    const revoked = await gateway(
      at(
        `/console-api/api/tools/mail/environments/production/connections/${encodeURIComponent(person)}/microsoft-365`,
        send("DELETE", undefined, admin),
      ),
    );
    expect(revoked.status).toBe(204);
    expect((await callTool(ana)).tokens).toBeNull();
    expect(await auditOf("connector-consent:%")).toEqual([
      expect.objectContaining({ subject: "connector-consent:microsoft-365:grant" }),
      expect.objectContaining({ subject: "connector-consent:microsoft-365:grant" }),
      expect.objectContaining({ subject: "connector-consent:microsoft-365:revoke" }),
    ]);
  });

  it("changes of the sign-in provider are audited", async () => {
    const gateway = gatewayFor();
    await gateway(
      at(
        "/console-api/api/identity-provider",
        send(
          "PUT",
          {
            kind: "google",
            clientId: "id",
            clientSecret: "google-secret-for-tests",
            hostedDomain: "acme.fr",
          },
          admin,
        ),
      ),
    );
    await gateway(at("/console-api/api/identity-provider", send("DELETE", undefined, admin)));
    const lines = await auditOf("identity-provider:%");
    expect(lines.map((l) => l.subject)).toEqual([
      "identity-provider:set",
      "identity-provider:delete",
    ]);
    expect(JSON.stringify(lines)).not.toContain("google-secret-for-tests");
  });
});
