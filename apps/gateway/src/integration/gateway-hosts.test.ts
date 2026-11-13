import type { D1Database, Hosting } from "@forgeron/hosting";
import { migratePlatform } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "../gateway";
import { simulatedGithub } from "../github/simulated-github";
import { memoryMailSender } from "../mail/mail";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// D-126: a workspace served on any host. `acme` answers on its primary origin (its first mapped host),
// on a second mapped host (a Worker's workers.dev address) and, in single-workspace mode, on any other
// host. What is mailed, shown and checked is the primary origin, whatever host the request came on.

const PRIMARY = "https://tools.acme.test";
const WORKERS_DEV = "https://forgeron-gateway.acct.workers.dev";
const SECRET = "test-secret-not-a-real-one";
const KEY = btoa(String.fromCharCode(...new Uint8Array(32)));
const clock = new Date("2026-11-12T10:00:00Z");

let memory: MemoryD1;
let env: GatewayEnv;
const mail = memoryMailSender();
let github: Awaited<ReturnType<typeof simulatedGithub>>;

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  github = await simulatedGithub({ now: () => clock });
  env = {
    DB: d1,
    BASE_DOMAIN: "forgeron.test",
    WORKSPACE_HOSTS: "tools.acme.test=acme,forgeron-gateway.acct.workers.dev=acme",
    AUTH_SECRET: SECRET,
    SECRETS_KEY: KEY,
    ADMIN_EMAIL: "root@acme.fr",
    SIGN_IN_METHODS: "email,oidc",
    OIDC_ISSUER: "https://idp.test",
    OIDC_CLIENT_ID: "forgeron",
  };
});
afterAll(() => memory.close());

const gateway = (over: Partial<GatewayEnv> = {}) =>
  createGateway(
    { ...env, ...over },
    {
      now: () => clock,
      mail,
      fetch: github.fetch,
      // `/deploy` needs a hosting to answer at all; the credential is checked before it is used.
      hosting: () => ({}) as Hosting,
    },
  );
const cookiesOf = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0]!)
    .filter((c) => !c.endsWith("="))
    .join("; ");
const lastCode = () => /(\d{4}) (\d{4})/.exec(mail.sent.at(-1)!.text)!.slice(1, 3).join("");

/** Signs in by email code on `origin`: the session cookie of that host. */
async function signIn(origin: string, email = "root@acme.fr") {
  const form = (fields: Record<string, string>, cookie = "") =>
    new Request(`${origin}/auth/email/${fields.code ? "verify" : "request"}`, {
      method: "POST",
      headers: {
        origin,
        "content-type": "application/x-www-form-urlencoded",
        "cf-connecting-ip": "203.0.113.9",
        ...(cookie ? { cookie } : {}),
      },
      body: new URLSearchParams(fields),
    });
  const asked = await gateway()(form({ email }));
  expect(asked.status).toBe(200);
  const done = await gateway()(form({ code: lastCode() }, cookiesOf(asked)));
  expect(done.status).toBe(303);
  const session = done.headers.getSetCookie().find((c) => c.startsWith("__Host-fg_session="))!;
  // A host cookie: valid on the host that set it, never shared with another.
  expect(session).not.toMatch(/Domain/i);
  return cookiesOf(done);
}

const get = (url: string, cookie?: string) =>
  gateway()(new Request(url, cookie ? { headers: { cookie } } : {}));

describe("which workspace a host serves", () => {
  it("serves a mapped host: sign-in by email and the session work there", async () => {
    const session = await signIn(WORKERS_DEV);
    const me = await get(`${WORKERS_DEV}/whoami`, session);
    expect(me.status).toBe(200);
    expect(await me.json()).toMatchObject({ email: "root@acme.fr", workspace: "acme" });
  });

  it("keeps the subdomain rule beside the mapped hosts", async () => {
    expect((await get("https://globex.forgeron.test/whoami")).status).toBe(401);
  });

  it("answers an unknown host as before when no default workspace is set", async () => {
    const answer = await get("https://elsewhere.example/whoami");
    expect(answer.status).toBe(404);
    expect(await answer.json()).toMatchObject({ error: { code: "NOT_FOUND" } });
  });

  it("serves the default workspace on any other host", async () => {
    const gw = gateway({ DEFAULT_WORKSPACE: "acme" });
    const session = await signIn(WORKERS_DEV);
    // The session of one host is not sent to another; an unknown host is acme's, and asks for one.
    const anon = await gw(new Request("https://elsewhere.example/whoami"));
    expect(anon.status).toBe(401);
    const page = await gw(new Request("https://elsewhere.example/auth/login"));
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("acme");
    expect(session).toContain("__Host-fg_session=");
  });

  it("serves no workers.dev host when only the base domain is set", async () => {
    // Nothing set but the base domain: the behaviour before D-126.
    const answer = await gateway({ WORKSPACE_HOSTS: undefined })(
      new Request(`${WORKERS_DEV}/whoami`),
    );
    expect(answer.status).toBe(404);
  });
});

describe("the primary origin", () => {
  it("is the address the console shows, whatever host it is asked on", async () => {
    const session = await signIn(WORKERS_DEV);
    const answer = await get(`${WORKERS_DEV}/console-api/api/workspace`, session);
    expect(answer.status).toBe(200);
    expect(await answer.json()).toMatchObject({
      workspace: "acme",
      endpoint: PRIMARY,
      install: { baseDomain: "forgeron.test" },
    });
  });

  it("is the address in a mailed invitation", async () => {
    const session = await signIn(WORKERS_DEV);
    const invited = await gateway()(
      new Request(`${WORKERS_DEV}/console-api/api/invitations`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie: session },
        body: JSON.stringify({ email: "ada@external.test", teams: ["developer"] }),
      }),
    );
    expect(invited.status).toBe(201);
    expect(mail.sent.at(-1)!.text).toContain(`${PRIMARY}/auth/invite/`);
    expect(mail.sent.at(-1)!.text).not.toContain(WORKERS_DEV);
  });

  it("is in the GitHub App's manifest: its webhook and its redirect", async () => {
    const session = await signIn(WORKERS_DEV);
    const page = await get(`${WORKERS_DEV}/github/app/new?owner=acme-sh`, session);
    expect(page.status).toBe(200);
    const manifest = JSON.parse(
      /name="manifest" value="([^"]+)"/
        .exec(await page.text())![1]!
        .replaceAll("&quot;", '"')
        .replaceAll("&amp;", "&")
        .replaceAll("&#39;", "'"),
    );
    expect(manifest).toMatchObject({
      url: PRIMARY,
      hook_attributes: { url: `${PRIMARY}/github/webhook` },
      redirect_url: `${PRIMARY}/github/app/callback`,
      setup_url: `${PRIMARY}/github/app/installed`,
    });
  });

  it("is the one audience a GitHub Actions token may name, on any host", async () => {
    const deploy = async (audience: string, origin: string) => {
      const token = await github.actionsToken({ repository: "acme-sh/crm", audience });
      return gateway()(
        new Request(`${origin}/deploy`, {
          method: "POST",
          headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
          body: "{}",
        }),
      );
    };
    // Another accepted host is not an audience: the token is refused before anything else.
    const other = await deploy(WORKERS_DEV, WORKERS_DEV);
    expect(other.status).toBe(401);
    expect(await other.json()).toMatchObject({ error: { code: "UNAUTHENTICATED" } });
    // The primary origin passes the check on any host; the repository then holds no tool here.
    for (const origin of [WORKERS_DEV, PRIMARY]) {
      const primary = await deploy(PRIMARY, origin);
      expect(primary.status).toBe(403);
      expect(await primary.json()).toMatchObject({ error: { code: "FORBIDDEN" } });
    }
  });

  it("is where single sign-on starts, where the provider sends people back", async () => {
    const started = await get(`${WORKERS_DEV}/auth/login?method=oidc&next=%2Fauth%2Fcli%3Fx%3D1`);
    expect(started.status).toBe(302);
    expect(started.headers.get("location")).toBe(
      `${PRIMARY}/auth/login?method=oidc&next=%2Fauth%2Fcli%3Fx%3D1`,
    );
    expect(started.headers.getSetCookie()).toEqual([]);
  });

  it("is not imposed on an MCP client: it signs in on the host it connects to", async () => {
    const document = await get(`${WORKERS_DEV}/.well-known/oauth-authorization-server`);
    expect(document.status).toBe(200);
    expect(await document.json()).toMatchObject({
      issuer: WORKERS_DEV,
      authorization_endpoint: `${WORKERS_DEV}/oauth/authorize`,
    });
  });
});
