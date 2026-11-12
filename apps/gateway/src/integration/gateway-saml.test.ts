import type { D1Database } from "@forgeron/hosting";
import { createIdentityConfig, createRegistry, migratePlatform } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "../gateway";
import { encodeResponse, simulatedSamlIdp, type SimulatedSamlIdp } from "../simulated-saml-idp";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// Workspace sign-in through SAML, from the redirect to the session, against a simulated identity
// provider that signs real assertions; the provider is configured the way an admin does.

const now = new Date("2026-11-03T10:00:00Z");
// A throwaway key made of zeros: it protects nothing and is not a secret.
const KEY = btoa(String.fromCharCode(...new Uint8Array(32)));
const SP = "https://acme.forgeron.app/auth/saml/metadata";
const ACS = "https://acme.forgeron.app/auth/saml/acs";

let memory: MemoryD1;
let env: GatewayEnv;
let idp: SimulatedSamlIdp;

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  env = {
    DB: d1,
    BASE_DOMAIN: "forgeron.app",
    AUTH_SECRET: "test-secret-not-a-real-one",
    SECRETS_KEY: KEY,
    ADMIN_EMAIL: "root@acme.fr",
    MEMBER_EMAIL_DOMAINS: "acme.fr",
  };
  idp = await simulatedSamlIdp();
  await createIdentityConfig(d1, { now: () => now }).setSamlProvider(
    "acme",
    {
      idpEntityId: idp.entityId,
      ssoUrl: "https://idp.example.test/sso",
      certificates: [idp.certificate],
      emailAttribute: "email",
      groupsAttribute: "groups",
      nameAttribute: "displayName",
      groupRoles: { devs: "developer" },
    },
    "bootstrap",
  );
});
afterAll(() => memory.close());

const gateway = () => createGateway(env, { now: () => now });
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

async function requestIdOf(location: string): Promise<string> {
  const packed = Uint8Array.from(atob(new URL(location).searchParams.get("SAMLRequest")!), (c) =>
    c.charCodeAt(0),
  );
  const xml = await new Response(
    new Blob([packed]).stream().pipeThrough(new DecompressionStream("deflate-raw")),
  ).text();
  return /ID="([^"]+)"/.exec(xml)![1]!;
}

const post = (xml: string, relay: string, cookie: string) =>
  at("/auth/saml/acs", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", cookie },
    body: new URLSearchParams({ SAMLResponse: encodeResponse(xml), RelayState: relay }),
  });

let counter = 0;

/** The whole browser trip: login, the provider's answer, the POST to the ACS. */
async function signIn(
  email: string,
  options: {
    groups?: string[];
    sign?: "assertion" | "response" | "none";
    assertionId?: string;
  } = {},
) {
  const login = await gateway()(at("/auth/login"));
  const location = login.headers.get("location") ?? "";
  const relay = new URL(location).searchParams.get("RelayState") ?? "";
  const xml = await idp.respond({
    requestId: await requestIdOf(location),
    acsUrl: ACS,
    audience: SP,
    nameId: email,
    attributes: { email: [email], groups: options.groups ?? [], displayName: ["Someone"] },
    sign: options.sign ?? "assertion",
    // Each assertion has its own id, as an identity provider issues them: a repeat is a replay.
    assertionId: options.assertionId ?? `_assertion-${++counter}`,
  });
  const cookie = cookiesOf(login);
  const response = await gateway()(post(xml, relay, cookie));
  return { login, response, xml, relay, cookie, session: cookiesOf(response) };
}

describe("SAML sign-in", () => {
  it("sends the person to the provider with a signed-free AuthnRequest and a cross-site-safe state cookie", async () => {
    const login = await gateway()(at("/auth/login"));
    expect(login.status).toBe(302);
    expect(login.headers.get("location")).toMatch(
      /^https:\/\/idp\.example\.test\/sso\?SAMLRequest=/,
    );
    const state = login.headers.getSetCookie()[0]!;
    expect(state).toMatch(/^__Host-fg_saml=/);
    expect(state).toContain("SameSite=None");
    expect(state).toContain("Secure");
    expect(state).toContain("HttpOnly");
  });

  it("serves the service provider metadata for the identity provider's administrator", async () => {
    const response = await gateway()(at("/auth/saml/metadata"));
    expect(response.status).toBe(200);
    const text = await response.text();
    expect(text).toContain(`entityID="${SP}"`);
    expect(text).toContain(`Location="${ACS}"`);
  });

  it("opens the same session as OIDC: HttpOnly, Secure, Lax, and /whoami knows the person", async () => {
    const result = await signIn("lea@acme.fr", { groups: ["devs"] });
    expect(result.response.status).toBe(303);
    expect(result.response.headers.get("location")).toBe("/");
    const set = result.response.headers
      .getSetCookie()
      .find((c) => c.startsWith("__Host-fg_session="))!;
    expect(set).toContain("HttpOnly");
    expect(set).toContain("Secure");
    expect(set).toContain("SameSite=Lax");
    const me = await gateway()(at("/whoami", { headers: { cookie: result.session } }));
    expect(await me.json()).toMatchObject({ email: "lea@acme.fr", roles: ["developer", "member"] });
  });

  it("admits the administrator and a member of an allowed domain, and refuses anyone else", async () => {
    expect((await signIn("root@acme.fr")).response.status).toBe(303);
    expect((await signIn("dev@acme.fr", { assertionId: "_a2" })).response.status).toBe(303);
    const outsider = await signIn("nope@partner.test", { assertionId: "_a3" });
    expect(outsider.response.status).toBe(403);
    expect(outsider.session).toBe("");
  });

  it("admits a person of a mapped group from outside the allowed domains", async () => {
    const result = await signIn("ext@partner.test", { groups: ["devs"], assertionId: "_a4" });
    expect(result.response.status).toBe(303);
  });

  it("refuses an answer posted twice, and one that does not come with the state cookie", async () => {
    const first = await signIn("twice@acme.fr", { assertionId: "_a5" });
    expect(first.response.status).toBe(303);
    const again = await gateway()(post(first.xml, first.relay, first.cookie));
    expect(again.status).toBe(401);
    expect(((await again.json()) as { error: { message: string } }).error.message).toMatch(
      /unknown|already/,
    );

    const login = await gateway()(at("/auth/login"));
    const location = login.headers.get("location")!;
    const xml = await idp.respond({
      requestId: await requestIdOf(location),
      acsUrl: ACS,
      audience: SP,
      assertionId: "_a6",
    });
    const noCookie = await gateway()(
      post(xml, new URL(location).searchParams.get("RelayState")!, ""),
    );
    expect(noCookie.status).toBe(400);
  });

  it("refuses an unsigned response", async () => {
    const result = await signIn("evil@acme.fr", { sign: "none", assertionId: "_a7" });
    expect(result.response.status).toBe(401);
    expect(result.session).toBe("");
  });

  it("refuses an answer to a request this gateway never made (IdP-initiated)", async () => {
    const login = await gateway()(at("/auth/login"));
    const xml = await idp.respond({
      requestId: "_unsolicited",
      acsUrl: ACS,
      audience: SP,
      assertionId: "_a8",
    });
    const response = await gateway()(
      post(
        xml,
        new URL(login.headers.get("location")!).searchParams.get("RelayState")!,
        cookiesOf(login),
      ),
    );
    expect(response.status).toBe(401);
  });
});

describe("the member policy of the workspace", () => {
  it("applies to SAML sign-ins: saved domains and the default role replace the install's", async () => {
    await createRegistry(env.DB).setMembershipSettings(
      "acme",
      { domains: ["partner.test"], defaultRole: "viewer" },
      "root",
    );
    // acme.fr was the install's domain: the saved policy replaces it.
    expect((await signIn("late@acme.fr")).response.status).toBe(403);
    const joined = await signIn("pat@partner.test");
    expect(joined.response.status).toBe(303);
    const me = await gateway()(at("/whoami", { headers: { cookie: joined.session } }));
    expect(await me.json()).toMatchObject({
      email: "pat@partner.test",
      roles: ["viewer", "member"],
    });
  });
});

describe("SAML provider configuration", () => {
  let admin = "";
  const put = (body: unknown) =>
    gateway()(at("/console-api/api/identity-provider", send("PUT", body, admin)));

  it("is read and edited by an admin only", async () => {
    admin = (await signIn("root@acme.fr", { assertionId: "_c1" })).session;
    expect((await gateway()(at("/console-api/api/identity-provider"))).status).toBe(401);
    const member = (await signIn("dev@acme.fr", { assertionId: "_c2" })).session;
    expect(
      (await gateway()(at("/console-api/api/identity-provider", send("GET", undefined, member))))
        .status,
    ).toBe(403);
    const read = await gateway()(
      at("/console-api/api/identity-provider", send("GET", undefined, admin)),
    );
    const { provider } = (await read.json()) as { provider: Record<string, unknown> };
    expect(provider).toMatchObject({
      kind: "saml",
      idpEntityId: idp.entityId,
      groupRoles: { devs: "developer" },
    });
  });

  it("refuses what cannot work, when it is saved", async () => {
    const good = {
      kind: "saml",
      idpEntityId: idp.entityId,
      ssoUrl: "https://idp.example.test/sso",
      certificates: [idp.certificate],
    };
    expect((await put({ ...good, ssoUrl: "http://idp.example.test/sso" })).status).toBe(400);
    expect((await put({ ...good, certificates: [] })).status).toBe(400);
    const garbage = await put({ ...good, certificates: ["not a certificate"] });
    expect(garbage.status).toBe(400);
    expect(((await garbage.json()) as { message: string }).message).toMatch(/certificate/);
    expect((await put({ ...good, idpEntityId: "" })).status).toBe(400);
    expect((await put({ ...good, groupRoles: { devs: "Not A Role" } })).status).toBe(400);
  });

  it("saves a new provider, audits it without any secret, and applies it at the next sign-in", async () => {
    const other = await simulatedSamlIdp({
      entityId: "https://other.example.test/saml",
      kind: "ec",
    });
    const saved = await put({
      kind: "saml",
      idpEntityId: other.entityId,
      ssoUrl: "https://other.example.test/sso",
      certificates: [other.certificate],
      emailAttribute: "email",
    });
    expect(saved.status).toBe(200);
    expect(((await saved.json()) as { provider: { kind: string } }).provider.kind).toBe("saml");

    const login = await gateway()(at("/auth/login"));
    expect(login.headers.get("location")).toContain("https://other.example.test/sso?");
    // The previous provider's signature no longer counts.
    const stale = await idp.respond({
      requestId: await requestIdOf(login.headers.get("location")!),
      acsUrl: ACS,
      audience: SP,
      assertionId: "_c9",
    });
    const refused = await gateway()(
      post(
        stale,
        new URL(login.headers.get("location")!).searchParams.get("RelayState")!,
        cookiesOf(login),
      ),
    );
    expect(refused.status).toBe(401);

    const audit = (
      await memory
        .prepare(`SELECT "actor", "subject", "detail" FROM "audit_log" WHERE "subject" = ?`)
        .bind("identity-provider:set")
        .all()
    ).results as Array<{ actor: string; detail: string }>;
    expect(audit).toHaveLength(1);
    expect(JSON.parse(audit[0]!.detail)).toMatchObject({
      workspace: "acme",
      kind: "saml",
      idpEntityId: other.entityId,
      certificates: 1,
    });
    expect(JSON.stringify(audit)).not.toContain("BEGIN CERTIFICATE");
  });

  it("is replaced by an OIDC provider, and removed", async () => {
    const oidc = await put({
      kind: "oidc",
      clientId: "forgeron",
      issuer: "https://idp.example.test",
    });
    expect(oidc.status).toBe(200);
    // SAML is off: its routes are gone (the OIDC login itself is proven in gateway-sso.test.ts).
    expect((await gateway()(at("/auth/saml/metadata"))).status).toBe(404);
    const gone = await gateway()(
      at("/console-api/api/identity-provider", send("DELETE", undefined, admin)),
    );
    expect(gone.status).toBe(204);
    expect((await gateway()(at("/auth/saml/metadata"))).status).toBe(404);
  });
});
