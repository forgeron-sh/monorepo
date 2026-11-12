import type { D1Database } from "@forgeron/hosting";
import {
  createRegistry,
  createSecretBox,
  migratePlatform,
  type Registry,
} from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "../gateway";
import { simulatedProvider } from "../simulated-idp";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// Workspace sign-in through Entra ID and Google Workspace presets, configured in the platform D1
// by an admin, and a person's consent for a delegated connector, all against simulated providers.

const now = new Date("2026-11-03T10:00:00Z");
// Throwaway keys made of zeros: they protect nothing and are not secrets.
const KEY = btoa(String.fromCharCode(...new Uint8Array(32)));
const TENANT = "11111111-2222-3333-4444-555555555555";
const ENTRA = `https://login.microsoftonline.com/${TENANT}/v2.0`;
const GOOGLE = "https://accounts.google.com";

let memory: MemoryD1;
let registry: Registry;
let env: GatewayEnv;

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { secrets: await createSecretBox(KEY) });
  const tool = await registry.createTool({ workspace: "acme", name: "mail" });
  const built = await registry.recordBuild(tool.id, {
    fingerprint: "fp",
    manifest: {
      name: "mail",
      resources: {
        connectors: {
          microsoft: { type: "microsoft-365", mode: "delegated", scopes: ["Mail.Send"], why: "x" },
        },
      },
    },
  });
  await registry.publishVersion(tool.id, built.id, "1.0.0");
  env = {
    DB: d1,
    BASE_DOMAIN: "forgeron.app",
    AUTH_SECRET: "test-secret-not-a-real-one",
    SECRETS_KEY: KEY,
    ADMIN_EMAIL: "root@acme.fr",
    MEMBER_EMAIL_DOMAINS: "acme.fr",
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
const send = (method: string, body?: unknown, cookie = "") => ({
  method,
  headers: { "content-type": "application/json", cookie },
  ...(body === undefined ? {} : { body: JSON.stringify(body) }),
});

async function signIn(
  email: string,
  idp: Awaited<ReturnType<typeof simulatedProvider>>,
): Promise<{ status: number; cookie: string; authorize: string }> {
  const gateway = gatewayFor(idp.fetcher);
  const login = await gateway(at("/auth/login"));
  const authorize = login.headers.get("location") ?? "";
  if (login.status !== 302) return { status: login.status, cookie: "", authorize };
  const callback = await gateway(
    at(`/auth/callback${idp.signIn(authorize)}`, { headers: { cookie: cookiesOf(login) } }),
  );
  return { status: callback.status, cookie: cookiesOf(callback), authorize };
}

describe("provider configuration", () => {
  let admin = "";

  it("signs in the administrator through the environment provider, then an admin saves Entra", async () => {
    // Environment provider first (no saved one yet).
    env.OIDC_ISSUER = "https://idp.example.test";
    env.OIDC_CLIENT_ID = "forgeron";
    const first = await signIn("root@acme.fr", await simulatedProvider("root@acme.fr", now));
    expect(first.status).toBe(302);
    admin = first.cookie;

    const gateway = gatewayFor();
    const bad = await gateway(
      at(
        "/console-api/api/identity-provider",
        send("PUT", { kind: "entra", clientId: "forgeron", tenant: "common" }, admin),
      ),
    );
    expect(bad.status).toBe(400);
    const saved = await gateway(
      at(
        "/console-api/api/identity-provider",
        send(
          "PUT",
          {
            kind: "entra",
            clientId: "forgeron",
            clientSecret: "entra-secret-for-tests",
            tenant: TENANT,
            groupRoles: { "grp-devs": "developer" },
          },
          admin,
        ),
      ),
    );
    expect(saved.status).toBe(200);
    const text = await saved.text();
    expect(text).not.toContain("entra-secret-for-tests");
    expect(JSON.parse(text).provider).toMatchObject({
      kind: "entra",
      tenant: TENANT,
      hasSecret: true,
    });
  });

  it("refuses the configuration to a non-admin and to nobody", async () => {
    const gateway = gatewayFor();
    expect((await gateway(at("/console-api/api/identity-provider"))).status).toBe(401);
    const idp = await simulatedProvider("dev@acme.fr", now, {
      issuer: ENTRA,
      claims: { tid: TENANT, preferred_username: "dev@acme.fr" },
    });
    const member = await signIn("dev@acme.fr", idp);
    expect(member.status).toBe(302);
    const denied = await gateway(
      at("/console-api/api/identity-provider", send("GET", undefined, member.cookie)),
    );
    expect(denied.status).toBe(403);
  });

  it("signs in through Entra: the tenant is enforced, the UPN is the email, groups give roles", async () => {
    const idp = await simulatedProvider("lea@acme.fr", now, {
      issuer: ENTRA,
      claims: { tid: TENANT, preferred_username: "lea@acme.fr", groups: ["grp-devs", "other"] },
    });
    const person = await signIn("ignored@elsewhere.test", idp);
    expect(person.status).toBe(302);
    expect(person.authorize).toContain("login.microsoftonline.com");
    const me = await gatewayFor()(at("/whoami", { headers: { cookie: person.cookie } }));
    expect(await me.json()).toMatchObject({ email: "lea@acme.fr", roles: ["developer", "member"] });

    // A token from another directory is refused, even with a valid signature.
    const other = await simulatedProvider("x@acme.fr", now, {
      issuer: ENTRA,
      claims: { tid: "99999999-2222-3333-4444-555555555555", preferred_username: "x@acme.fr" },
    });
    expect((await signIn("x@acme.fr", other)).status).toBe(401);
  });

  it("a group alone admits a person from outside the allowed domains; nobody else", async () => {
    const via = await simulatedProvider("ext@partner.test", now, {
      issuer: ENTRA,
      claims: { tid: TENANT, preferred_username: "ext@partner.test", groups: ["grp-devs"] },
    });
    expect((await signIn("ext@partner.test", via)).status).toBe(302);
    const no = await simulatedProvider("nope@partner.test", now, {
      issuer: ENTRA,
      claims: { tid: TENANT, preferred_username: "nope@partner.test", groups: [] },
    });
    expect((await signIn("nope@partner.test", no)).status).toBe(403);
  });

  it("switches to Google Workspace: hosted domain enforced, unverified email refused", async () => {
    const gateway = gatewayFor();
    const put = await gateway(
      at(
        "/console-api/api/identity-provider",
        send("PUT", { kind: "google", clientId: "forgeron", hostedDomain: "acme.fr" }, admin),
      ),
    );
    expect(put.status).toBe(200);
    const ok = await signIn(
      "ada@acme.fr",
      await simulatedProvider("ada@acme.fr", now, {
        issuer: GOOGLE,
        claims: { hd: "acme.fr", email_verified: true },
      }),
    );
    expect(ok.status).toBe(302);
    expect(ok.authorize).toContain("accounts.google.com");
    expect(new URL(ok.authorize).searchParams.get("hd")).toBe("acme.fr");
    const wrongDomain = await signIn(
      "bob@acme.fr",
      await simulatedProvider("bob@acme.fr", now, {
        issuer: GOOGLE,
        claims: { hd: "evil.test", email_verified: true },
      }),
    );
    expect(wrongDomain.status).toBe(401);
    const noHd = await signIn(
      "cy@acme.fr",
      await simulatedProvider("cy@acme.fr", now, {
        issuer: GOOGLE,
        claims: { email_verified: true },
      }),
    );
    expect(noHd.status).toBe(401);
    const unverified = await signIn(
      "di@acme.fr",
      await simulatedProvider("di@acme.fr", now, {
        issuer: GOOGLE,
        claims: { hd: "acme.fr", email_verified: false },
      }),
    );
    expect(unverified.status).toBe(401);
  });

  it("removing the saved provider falls back to the environment's", async () => {
    const gateway = gatewayFor();
    expect(
      (await gateway(at("/console-api/api/identity-provider", send("DELETE", undefined, admin))))
        .status,
    ).toBe(204);
    const back = await signIn("root@acme.fr", await simulatedProvider("root@acme.fr", now));
    expect(back.status).toBe(302);
    expect(back.authorize).toContain("idp.example.test");
  });
});

describe("a person's consent for a delegated connector", () => {
  let admin = "";
  let person = "";
  const connectorClient = {
    authorizeUrl: "https://login.example.test/authorize",
    tokenUrl: "https://login.example.test/token",
    clientId: "connector-client",
    clientSecret: "connector-secret-for-tests",
  };
  const provider = (async (url: string) => {
    if (String(url) === connectorClient.tokenUrl) {
      return Response.json({ access_token: "at-1", refresh_token: "rt-1", expires_in: 3600 });
    }
    return new Response("nope", { status: 404 });
  }) as typeof fetch;

  beforeAll(async () => {
    env.OIDC_ISSUER = "https://idp.example.test";
    admin = (await signIn("root@acme.fr", await simulatedProvider("root@acme.fr", now))).cookie;
    person = (await signIn("ada@acme.fr", await simulatedProvider("ada@acme.fr", now))).cookie;
  });

  const consentPath = "/console-api/api/tools/mail/environments/production/consent";

  it("fails closed until an admin registers the connector's OAuth client", async () => {
    const gateway = gatewayFor();
    expect((await gateway(at(`${consentPath}/microsoft`))).status).toBe(401);
    const unknown = await gateway(at(`${consentPath}/microsoft`, send("GET", undefined, person)));
    expect(unknown.status).toBe(404);
    expect(await unknown.json()).toMatchObject({ error: "UNKNOWN_CONNECTOR" });
    const asPerson = await gateway(
      at("/console-api/api/connector-clients/microsoft-365", send("PUT", connectorClient, person)),
    );
    expect(asPerson.status).toBe(403);
    const noSecret = await gateway(
      at(
        "/console-api/api/connector-clients/microsoft-365",
        send("PUT", { ...connectorClient, clientSecret: undefined }, admin),
      ),
    );
    expect(noSecret.status).toBe(400);
    const set = await gateway(
      at("/console-api/api/connector-clients/microsoft-365", send("PUT", connectorClient, admin)),
    );
    expect(set.status).toBe(201);
    const listed = await (
      await gateway(at("/console-api/api/connector-clients", send("GET", undefined, admin)))
    ).text();
    expect(listed).toContain("connector-client");
    expect(listed).not.toContain("connector-secret-for-tests");
  });

  it("sends the person to the provider, keeps their tokens, lists, and lets them withdraw", async () => {
    const gateway = gatewayFor(provider);
    const start = await gateway(at(`${consentPath}/microsoft`, send("GET", undefined, person)));
    expect(start.status).toBe(302);
    const location = new URL(start.headers.get("location")!);
    expect(location.origin + location.pathname).toBe(connectorClient.authorizeUrl);
    expect(location.searchParams.get("scope")).toBe("Mail.Send");
    expect(location.searchParams.get("redirect_uri")).toBe(
      "https://acme.forgeron.app/console-api/api/consent/callback",
    );
    const state = location.searchParams.get("state")!;

    // Someone else cannot complete a consent started by the person.
    const stolen = await gateway(
      at(
        `/console-api/api/consent/callback?state=${encodeURIComponent(state)}&code=c`,
        send("GET", undefined, admin),
      ),
    );
    expect(stolen.status).toBe(400);
    const done = await gateway(
      at(
        `/console-api/api/consent/callback?state=${encodeURIComponent(state)}&code=c`,
        send("GET", undefined, person),
      ),
    );
    expect(done.status).toBe(200);

    const mine = await (await gateway(at(consentPath, send("GET", undefined, person)))).text();
    expect(JSON.parse(mine).connections).toHaveLength(1);
    expect(mine).not.toContain("at-1");
    // The admin sees who consented, never a token; the stored tokens are sealed.
    const forAdmin = await (
      await gateway(
        at(
          "/console-api/api/tools/mail/environments/production/connections",
          send("GET", undefined, admin),
        ),
      )
    ).text();
    expect(forAdmin).toContain("microsoft-365");
    expect(forAdmin).not.toContain("at-1");
    expect(
      JSON.stringify((await memory.prepare(`SELECT * FROM "connections"`).all()).results),
    ).not.toContain("at-1");

    const withdrawn = await gateway(
      at(`${consentPath}/microsoft`, send("DELETE", undefined, person)),
    );
    expect(withdrawn.status).toBe(204);
    expect(
      (await gateway(at(`${consentPath}/microsoft`, send("DELETE", undefined, person)))).status,
    ).toBe(404);
  });

  it("lets an admin revoke a person's consent", async () => {
    const gateway = gatewayFor(provider);
    const start = await gateway(at(`${consentPath}/microsoft`, send("GET", undefined, person)));
    const state = new URL(start.headers.get("location")!).searchParams.get("state")!;
    await gateway(
      at(
        `/console-api/api/consent/callback?state=${encodeURIComponent(state)}&code=c`,
        send("GET", undefined, person),
      ),
    );
    const users = (
      await registry.listConnections((await registry.findTool("acme", "mail"))!.id, "production")
    ).map((c) => c.userId);
    expect(users).toHaveLength(1);
    const revoked = await gateway(
      at(
        `/console-api/api/tools/mail/environments/production/connections/${encodeURIComponent(users[0]!)}/microsoft-365`,
        send("DELETE", undefined, admin),
      ),
    );
    expect(revoked.status).toBe(204);
    expect(
      await registry.listConnections((await registry.findTool("acme", "mail"))!.id, "production"),
    ).toEqual([]);
  });
});
