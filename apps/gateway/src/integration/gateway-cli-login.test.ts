import { createHash, randomBytes } from "node:crypto";
import type { D1Database } from "@forgeron/hosting";
import { migratePlatform } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "../gateway";
import { ISSUER, simulatedProvider } from "../simulated-idp";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// `forgeron login` against the gateway handler. apps/cli cannot be imported from here (apps do not
// import each other), so this plays the CLI step for step as `apps/cli/src/commands/login.ts` does:
// PKCE challenge, `GET /auth/cli?redirect_uri&state&code_challenge&code_challenge_method=S256`,
// the browser signing in at the provider, the loopback callback, `POST /auth/cli/token` with
// `{ code, code_verifier, redirect_uri }`, then `GET /whoami` with the token as a Bearer.

const now = new Date("2026-11-03T10:00:00Z");
const ENDPOINT = "https://acme.forgeron.app";
const REDIRECT = "http://127.0.0.1:43111/callback";

let memory: MemoryD1;
let env: GatewayEnv;
beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  env = {
    DB: d1,
    BASE_DOMAIN: "forgeron.app",
    AUTH_SECRET: "test-secret-not-a-real-one",
    OIDC_ISSUER: ISSUER,
    OIDC_CLIENT_ID: "forgeron",
    ADMIN_EMAIL: "ely@acme.fr",
  };
});
afterAll(() => memory.close());

const b64 = (bytes: Buffer) => bytes.toString("base64url");
const gatewayWith = (fetcher?: typeof fetch) =>
  createGateway(env, { now: () => now, ...(fetcher ? { fetch: fetcher } : {}) });

const pkce = () => {
  const verifier = b64(randomBytes(32));
  return { verifier, challenge: b64(createHash("sha256").update(verifier).digest()) };
};
const authorizeUrl = (challenge: string, state: string, over: Record<string, string> = {}) =>
  `${ENDPOINT}/auth/cli?${new URLSearchParams({
    redirect_uri: REDIRECT,
    state,
    code_challenge: challenge,
    code_challenge_method: "S256",
    ...over,
  })}`;
const cookiesOf = (response: Response) =>
  response.headers
    .getSetCookie()
    .map((c) => c.split(";")[0]!)
    .filter((c) => !c.endsWith("="))
    .join("; ");

/** The browser: opens the URL the CLI printed, signs in at the provider, lands on the loopback. */
async function browser(url: string, email: string) {
  const idp = await simulatedProvider(email, now);
  const gateway = gatewayWith(idp.fetcher);
  const first = await gateway(new Request(url));
  expect(first.status).toBe(302);
  const login = await gateway(new Request(new URL(first.headers.get("location")!, ENDPOINT)));
  const callback = await gateway(
    new Request(`${ENDPOINT}/auth/callback${idp.signIn(login.headers.get("location")!)}`, {
      headers: { cookie: cookiesOf(login) },
    }),
  );
  if (callback.status !== 302) return { status: callback.status, location: undefined };
  // Back to /auth/cli, now with the session.
  const back = await gateway(
    new Request(new URL(callback.headers.get("location")!, ENDPOINT), {
      headers: { cookie: cookiesOf(callback) },
    }),
  );
  // The page asks first: nothing reaches the loopback address until Authorize is pressed.
  expect(back.status).toBe(200);
  expect(back.headers.get("location")).toBeNull();
  return answer(gateway, back, cookiesOf(callback), ENDPOINT);
}

const decode = (text: string) =>
  text.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'");

/** Presses a button of the CLI confirmation page: what the page hands back to the CLI. */
async function answer(
  gateway: (request: Request) => Promise<Response>,
  confirmation: Response,
  cookie: string,
  origin: string,
  decision: "allow" | "deny" = "allow",
) {
  const html = await confirmation.text();
  const fields = new URLSearchParams(
    [...html.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)">/g)].map(
      (m): [string, string] => [decode(m[1]!), decode(m[2]!)],
    ),
  );
  fields.set("decision", decision);
  const posted = await gateway(
    new Request(`${origin}/auth/cli`, {
      method: "POST",
      headers: { cookie, origin, "content-type": "application/x-www-form-urlencoded" },
      body: fields,
    }),
  );
  const refresh = /http-equiv="refresh" content="0;url=([^"]+)"/.exec(await posted.clone().text());
  return { status: posted.status, location: refresh ? decode(refresh[1]!) : undefined };
}

const exchange = (body: unknown) =>
  gatewayWith()(
    new Request(`${ENDPOINT}/auth/cli/token`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
  );

describe("forgeron login against the gateway", () => {
  it("signs the CLI in: browser, loopback code, PKCE exchange, then whoami", async () => {
    const { verifier, challenge } = pkce();
    const landed = await browser(authorizeUrl(challenge, "st1"), "ely@acme.fr");
    expect(landed.status).toBe(200);
    const back = new URL(landed.location!);
    expect(`${back.origin}${back.pathname}`).toBe(REDIRECT);
    expect(back.searchParams.get("state")).toBe("st1");
    const code = back.searchParams.get("code")!;

    const traded = await exchange({ code, code_verifier: verifier, redirect_uri: REDIRECT });
    expect(traded.status).toBe(200);
    const { token } = (await traded.json()) as { token: string };

    const gateway = gatewayWith();
    const me = await gateway(
      new Request(`${ENDPOINT}/whoami`, { headers: { authorization: `Bearer ${token}` } }),
    );
    expect(await me.json()).toMatchObject({
      email: "ely@acme.fr",
      workspace: "acme",
      teams: ["admin"],
    });
    // A CLI token is the person on the platform, never a way into a tool.
    const tool = await gateway(
      new Request(`${ENDPOINT}/console-api/api/tools`, {
        headers: { authorization: `Bearer ${token}` },
      }),
    );
    expect(tool.status).toBe(200);
    expect(
      (
        await gateway(
          new Request(`${ENDPOINT}/auth/token`, {
            method: "POST",
            headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
            body: JSON.stringify({ tool: "crm", days: 1 }),
          }),
        )
      ).status,
    ).toBe(401);
  });

  it("spends the code once, and refuses a wrong verifier, redirect or workspace", async () => {
    const { verifier, challenge } = pkce();
    const landed = await browser(authorizeUrl(challenge, "st2"), "ely@acme.fr");
    const code = new URL(landed.location!).searchParams.get("code")!;
    const good = { code, code_verifier: verifier, redirect_uri: REDIRECT };
    expect((await exchange({ ...good, code_verifier: "wrong" })).status).toBe(400);
    expect((await exchange({ ...good, redirect_uri: "http://127.0.0.1:1/callback" })).status).toBe(
      400,
    );
    const other = await createGateway(env, { now: () => now })(
      new Request("https://globex.forgeron.app/auth/cli/token", {
        method: "POST",
        body: JSON.stringify(good),
      }),
    );
    expect(other.status).toBe(400);
    expect((await exchange(good)).status).toBe(200);
    expect((await exchange(good)).status).toBe(400);
  });

  it("refuses an expired code", async () => {
    const { verifier, challenge } = pkce();
    const landed = await browser(authorizeUrl(challenge, "st3"), "ely@acme.fr");
    const code = new URL(landed.location!).searchParams.get("code")!;
    const later = createGateway(env, { now: () => new Date(now.getTime() + 61_000) });
    const response = await later(
      new Request(`${ENDPOINT}/auth/cli/token`, {
        method: "POST",
        body: JSON.stringify({ code, code_verifier: verifier, redirect_uri: REDIRECT }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("only sends the code to the CLI's loopback address", async () => {
    const { challenge } = pkce();
    const gateway = gatewayWith();
    for (const redirect_uri of [
      "https://evil.test/callback",
      "http://127.0.0.1.evil.test:1/callback",
      "http://localhost:4000/callback",
      "http://127.0.0.1:4000/other",
    ]) {
      const response = await gateway(new Request(authorizeUrl(challenge, "s", { redirect_uri })));
      expect([redirect_uri, response.status]).toEqual([redirect_uri, 400]);
    }
    const noPkce = await gateway(
      new Request(authorizeUrl(challenge, "s", { code_challenge_method: "plain" })),
    );
    expect(noPkce.status).toBe(400);
  });

  it("stores nothing for a person the workspace does not admit", async () => {
    const { challenge } = pkce();
    const landed = await browser(authorizeUrl(challenge, "st4"), "stranger@elsewhere.test");
    expect(landed).toEqual({ status: 403 });
  });

  it("does not let sign-in be sent anywhere but the CLI page", async () => {
    const gateway = gatewayWith((await simulatedProvider("x@acme.fr", now)).fetcher);
    const login = await gateway(
      new Request(`${ENDPOINT}/auth/login?next=${encodeURIComponent("https://evil.test/")}`),
    );
    expect(login.status).toBe(302);
    // The state cookie carries no `next`: the callback would go to "/".
    expect(login.headers.get("location")).toContain(ISSUER);
  });
});
