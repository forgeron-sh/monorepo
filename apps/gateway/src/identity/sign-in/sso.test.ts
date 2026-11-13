import { createHash } from "node:crypto";
import { describe, expect, it } from "vitest";
import { createAuth, type AuthOptions } from "./auth";
import { workspaceOf } from "../../kernel/workspace";
import { tokenAuthenticator } from "../authn/authenticate";
import { OidcError, completeLogin, startLogin, type OidcProvider } from "./oidc";
import { toBase64Url } from "../authn/sealed";
import { SESSION_COOKIE, closeSession, cookieOf, openSession, readSession } from "../authn/session";

const secret = "test-secret-not-a-real-one";
const now = new Date("2026-11-03T10:00:00Z");
const ISSUER = "https://idp.example.test";
const provider: OidcProvider = {
  issuer: ISSUER,
  clientId: "forgeron",
  clientSecret: "client-secret-for-tests",
  redirectUri: "https://acme.forgeron.app/auth/callback",
};

// A simulated OIDC provider: discovery, JWKS and token endpoint, with a real RSA key, and
// PKCE and single-use codes enforced the way a real provider does.
async function simulatedProvider(overrides: Record<string, unknown> = {}, alg = "RS256") {
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
  const log: string[] = [];
  const enc = new TextEncoder();
  const sign = async (claims: object, header: object = { alg, kid: "k1" }) => {
    const body = `${toBase64Url(enc.encode(JSON.stringify(header)))}.${toBase64Url(enc.encode(JSON.stringify(claims)))}`;
    const signature = await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      pair.privateKey,
      enc.encode(body),
    );
    return `${body}.${toBase64Url(new Uint8Array(signature))}`;
  };
  const fetcher = async (input: string, init?: RequestInit): Promise<Response> => {
    const url = new URL(input);
    log.push(url.pathname);
    if (url.pathname === "/.well-known/openid-configuration") {
      return Response.json({
        issuer: ISSUER,
        authorization_endpoint: `${ISSUER}/authorize`,
        token_endpoint: `${ISSUER}/token`,
        jwks_uri: `${ISSUER}/jwks`,
        ...(overrides.discovery as object),
      });
    }
    if (url.pathname === "/jwks") return Response.json({ keys: [jwk] });
    if (url.pathname === "/token") {
      const form = new URLSearchParams(String(init?.body));
      const issued = codes.get(form.get("code") ?? "");
      codes.delete(form.get("code") ?? "");
      const verified = createHash("sha256")
        .update(form.get("code_verifier") ?? "")
        .digest("base64url");
      if (!issued || issued.challenge !== verified || form.get("client_id") !== "forgeron") {
        return Response.json({ error: "invalid_grant" }, { status: 400 });
      }
      const exp = Math.floor(now.getTime() / 1000) + 300;
      return Response.json({
        id_token: await sign({
          iss: ISSUER,
          aud: "forgeron",
          sub: "idp-user-1",
          email: "ely@acme.fr",
          name: "Ely",
          exp,
          nonce: issued.nonce,
          ...(overrides.claims as object),
        }),
      });
    }
    return new Response("nope", { status: 404 });
  };
  /** What the person's browser does at the provider: signs in and comes back with a code. */
  const signIn = (authorizeUrl: string): string => {
    const q = new URL(authorizeUrl).searchParams;
    const code = `code-${codes.size + 1}`;
    codes.set(code, { challenge: q.get("code_challenge")!, nonce: q.get("nonce")! });
    return `?code=${code}&state=${q.get("state")}`;
  };
  return { fetcher, signIn, sign, log };
}

describe("OpenID Connect against a simulated provider", () => {
  it("signs a person in: PKCE, state, nonce and a verified ID token", async () => {
    const idp = await simulatedProvider();
    const { url, login } = await startLogin(provider, idp.fetcher);
    const query = new URL(url).searchParams;
    expect(query.get("code_challenge_method")).toBe("S256");
    expect(query.get("scope")).toBe("openid email profile");
    expect(query.get("redirect_uri")).toBe(provider.redirectUri);
    const identity = await completeLogin({
      provider,
      fetch: idp.fetcher,
      now,
      query: new URLSearchParams(idp.signIn(url)),
      login,
    });
    expect(identity).toEqual({
      subject: "idp-user-1",
      email: "ely@acme.fr",
      name: "Ely",
      groups: [],
    });
  });

  const failing: [string, Record<string, unknown>, string][] = [
    ["another issuer", { claims: { iss: "https://evil.test" } }, "another issuer"],
    ["another client", { claims: { aud: "someone-else" } }, "another client"],
    ["an expired token", { claims: { exp: 1 } }, "expired"],
    ["a wrong nonce", { claims: { nonce: "replayed" } }, "nonce"],
    ["no email", { claims: { email: undefined } }, "no subject or email"],
    [
      "a discovery document of another issuer",
      { discovery: { issuer: "https://evil.test" } },
      "does not match",
    ],
  ];
  for (const [label, overrides, message] of failing) {
    it(`refuses ${label}`, async () => {
      const idp = await simulatedProvider(overrides);
      const attempt = async () => {
        const { url, login } = await startLogin(provider, idp.fetcher);
        return completeLogin({
          provider,
          fetch: idp.fetcher,
          now,
          query: new URLSearchParams(idp.signIn(url)),
          login,
        });
      };
      await expect(attempt()).rejects.toThrow(message);
    });
  }

  it("refuses a token signed with another algorithm than RS256", async () => {
    const idp = await simulatedProvider({}, "HS256");
    const { url, login } = await startLogin(provider, idp.fetcher);
    await expect(
      completeLogin({
        provider,
        fetch: idp.fetcher,
        now,
        query: new URLSearchParams(idp.signIn(url)),
        login,
      }),
    ).rejects.toThrow("RS256");
  });

  it("refuses a token signed by a key the provider does not publish", async () => {
    const idp = await simulatedProvider();
    const other = await simulatedProvider();
    const { url, login } = await startLogin(provider, idp.fetcher);
    const forged = await other.sign({
      iss: ISSUER,
      aud: "forgeron",
      sub: "x",
      email: "x@y.z",
      nonce: login.nonce,
      exp: 9e9,
    });
    const tricky = async (input: string, init?: RequestInit) =>
      new URL(input).pathname === "/token"
        ? Response.json({ id_token: forged })
        : idp.fetcher(input, init);
    await expect(
      completeLogin({
        provider,
        fetch: tricky,
        now,
        query: new URLSearchParams(idp.signIn(url)),
        login,
      }),
    ).rejects.toThrow("signature");
  });

  it("refuses a state that is not the one it started, and a reused code", async () => {
    const idp = await simulatedProvider();
    const { url, login } = await startLogin(provider, idp.fetcher);
    const back = idp.signIn(url);
    await expect(
      completeLogin({
        provider,
        fetch: idp.fetcher,
        now,
        query: new URLSearchParams(back.replace(login.state, "other")),
        login,
      }),
    ).rejects.toThrow("state");
    await completeLogin({
      provider,
      fetch: idp.fetcher,
      now,
      query: new URLSearchParams(back),
      login,
    });
    await expect(
      completeLogin({ provider, fetch: idp.fetcher, now, query: new URLSearchParams(back), login }),
    ).rejects.toThrow(OidcError);
  });
});

describe("session cookie", () => {
  it("is HttpOnly, Secure, SameSite=Lax, host-bound, on /", async () => {
    const header = await openSession(
      { person: "u1", workspace: "acme" },
      { secret, ttlSeconds: 3600, now },
    );
    expect(header.startsWith(`${SESSION_COOKIE}=`)).toBe(true);
    expect(SESSION_COOKIE.startsWith("__Host-")).toBe(true);
    for (const attribute of ["HttpOnly", "Secure", "SameSite=Lax", "Path=/", "Max-Age=3600"]) {
      expect(header).toContain(attribute);
    }
    expect(header).not.toContain("Domain");
    expect(closeSession()).toContain("Max-Age=0");
  });

  const requestWith = (header: string) =>
    new Request("https://acme.forgeron.app/", { headers: { cookie: header.split(";")[0]! } });

  it("is read for its own workspace until it expires", async () => {
    const header = await openSession(
      { person: "u1", workspace: "acme" },
      { secret, ttlSeconds: 60, now },
    );
    const read = (workspace: string, at: Date, key = secret) =>
      readSession(requestWith(header), { secret: key, workspace, now: at });
    expect(await read("acme", now)).toEqual({ person: "u1", workspace: "acme" });
    expect(await read("globex", now)).toBeUndefined();
    expect(await read("acme", new Date(now.getTime() + 60_000))).toBeUndefined();
    expect(await read("acme", now, "another secret")).toBeUndefined();
  });

  it("is not a token for a tool: API and MCP callers need an audience token", async () => {
    const header = await openSession(
      { person: "u1", workspace: "acme" },
      { secret, ttlSeconds: 60, now },
    );
    const authenticate = tokenAuthenticator({
      secret,
      now: () => now,
      resolvePerson: (id) => ({ id, email: "e", name: "n", subjects: ["everyone"] }),
    });
    const cookie = cookieOf(requestWith(header), SESSION_COOKIE)!;
    expect(await authenticate(requestWith(header))).toBeUndefined();
    expect(
      await authenticate(
        new Request("https://acme.forgeron.app/t/crm/api/x", {
          headers: { authorization: `Bearer ${cookie}` },
        }),
      ),
    ).toBeUndefined();
  });
});

describe("/auth routes", () => {
  async function setup(member = true) {
    const idp = await simulatedProvider();
    const options: AuthOptions = {
      workspaceOf: (host) => workspaceOf(host, "forgeron.app"),
      secret,
      providerFor: (workspace) => (workspace === "acme" ? provider : undefined),
      resolvePerson: (_workspace, identity) =>
        member && identity.email === "ely@acme.fr" ? { id: "u1" } : undefined,
      fetch: idp.fetcher,
      now: () => now,
      sessionTtlSeconds: 3600,
    };
    return { auth: createAuth(options), idp };
  }
  const cookieHeader = (response: Response) =>
    response.headers
      .getSetCookie()
      .map((c) => c.split(";")[0])
      .join("; ");

  it("goes to the provider, comes back, and opens a session", async () => {
    const { auth, idp } = await setup();
    const login = (await auth(new Request("https://acme.forgeron.app/auth/login")))!;
    expect(login.status).toBe(302);
    const [state] = login.headers.getSetCookie();
    expect(state).toContain("HttpOnly");
    expect(state).toContain("Secure");
    expect(state).toContain("SameSite=Lax");

    const back = idp.signIn(login.headers.get("location")!);
    const callback = (await auth(
      new Request(`https://acme.forgeron.app/auth/callback${back}`, {
        headers: { cookie: cookieHeader(login) },
      }),
    ))!;
    expect(callback.status).toBe(302);
    expect(callback.headers.get("location")).toBe("/");
    const cookies = callback.headers.getSetCookie();
    const session = cookies.find((c) => c.startsWith(SESSION_COOKIE))!;
    expect(session).toMatch(/HttpOnly; Secure; SameSite=Lax/);
    const read = await readSession(
      new Request("https://acme.forgeron.app/", { headers: { cookie: session.split(";")[0]! } }),
      { secret, workspace: "acme", now },
    );
    expect(read).toEqual({ person: "u1", workspace: "acme" });
  });

  it("refuses an identity that is not a member of the workspace, with no session", async () => {
    const { auth, idp } = await setup(false);
    const login = (await auth(new Request("https://acme.forgeron.app/auth/login")))!;
    const callback = (await auth(
      new Request(
        `https://acme.forgeron.app/auth/callback${idp.signIn(login.headers.get("location")!)}`,
        {
          headers: { cookie: cookieHeader(login) },
        },
      ),
    ))!;
    expect(callback.status).toBe(403);
    expect(callback.headers.getSetCookie().some((c) => c.startsWith(SESSION_COOKIE))).toBe(false);
  });

  it("refuses a callback that did not start here, or whose provider check fails", async () => {
    const { auth, idp } = await setup();
    const login = (await auth(new Request("https://acme.forgeron.app/auth/login")))!;
    const back = idp.signIn(login.headers.get("location")!);
    expect(
      (await auth(new Request(`https://acme.forgeron.app/auth/callback${back}`)))!.status,
    ).toBe(400);
    const wrong = back.replace(/state=[^&]+/, "state=forged");
    const response = (await auth(
      new Request(`https://acme.forgeron.app/auth/callback${wrong}`, {
        headers: { cookie: cookieHeader(login) },
      }),
    ))!;
    expect(response.status).toBe(401);
    expect(response.headers.getSetCookie()).toEqual([]);
  });

  it("does not take a sign-in state from another workspace", async () => {
    const { auth } = await setup();
    const login = (await auth(new Request("https://acme.forgeron.app/auth/login")))!;
    const response = (await auth(
      new Request("https://globex.forgeron.app/auth/callback?code=x&state=y", {
        headers: { cookie: cookieHeader(login) },
      }),
    ))!;
    expect(response.status).toBe(404);
  });

  it("logs out, and leaves other paths and unknown hosts alone", async () => {
    const { auth } = await setup();
    const out = (await auth(new Request("https://acme.forgeron.app/auth/logout")))!;
    expect(out.headers.get("set-cookie")).toContain("Max-Age=0");
    expect(await auth(new Request("https://acme.forgeron.app/t/crm/mcp"))).toBeUndefined();
    expect((await auth(new Request("https://www.forgeron.app/auth/login")))!.status).toBe(404);
  });
});
