import { createHash, randomBytes } from "node:crypto";
import type { D1Database } from "@forgeron/hosting";
import type { Manifest } from "@forgeron/manifest";
import {
  createRegistry,
  createSecretBox,
  migratePlatform,
  type Registry,
} from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "../gateway";
import { openSession } from "../identity/authn/session";
import { issueToken } from "../identity/authn/tokens";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// OAuth for MCP clients (D-094) through the whole gateway, played as Claude plays it: read the
// resource metadata, register, send the person to /oauth/authorize, trade the code with PKCE, call
// /mcp with the access token, refresh, revoke. The people, the secret and the client are test values.

const SECRET = "test-secret-not-a-real-one";
const KEY = btoa(String.fromCharCode(...new Uint8Array(32)));
const ORIGIN = "https://acme.forgeron.app";
const REDIRECT = "https://client.example/callback";
let clock = new Date("2026-11-09T10:00:00Z");
const tick = (seconds: number) => (clock = new Date(clock.getTime() + seconds * 1000));

// A tool of the workspace: a Worker that answers who the gateway says the caller is, or 401 with a
// challenge of its own that the gateway must not pass on.
const toolWorker = (request: Request) => {
  const user = request.headers.get("x-forgeron-user");
  return user
    ? Response.json({
        jsonrpc: "2.0",
        id: 1,
        result: { user: (JSON.parse(user) as { id: string }).id },
      })
    : new Response("no", { status: 401, headers: { "www-authenticate": 'Bearer realm="evil"' } });
};
const crm = {
  name: "crm",
  version: "1.0.0",
  interfaces: { mcp: true, api: true, cli: true, web: true },
  profiles: {},
  actions: {},
  views: {},
  jobs: {},
  events: {},
  resources: {},
  uses: {},
  preview: { data: "seed" },
} as unknown as Manifest;

let memory: MemoryD1;
let registry: Registry;
let env: GatewayEnv;
let ana = ""; // a member
let root = ""; // an administrator
const cookies: Record<string, string> = {};

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { now: () => clock, secrets: await createSecretBox(KEY) });
  const member = async (subject: string, teams: string[]) =>
    (
      await registry.addMember({
        workspace: "acme",
        subject,
        email: `${subject}@acme.test`,
        name: subject,
        teams,
      })
    ).id;
  ana = await member("ana", []);
  root = await member("root", ["admin"]);
  for (const name of ["crm", "hr", "onboard"]) {
    const tool = await registry.createTool({ workspace: "acme", name });
    const built = await registry.recordBuild(tool.id, {
      fingerprint: name,
      manifest: {
        ...crm,
        name,
        // A tool that asks each person for their first name before it works (D-097).
        ...(name === "onboard"
          ? {
              setup: {
                fields: { firstName: { type: "text", label: "First name", required: true } },
              },
            }
          : {}),
      } as Manifest,
    });
    const version = await registry.publishVersion(tool.id, built.id, "1.0.0");
    const production = await registry.ensureEnvironment(tool.id, "production");
    await registry.activate(production.id, version.id, { actor: "test" });
  }
  env = {
    DB: d1,
    BASE_DOMAIN: "forgeron.app",
    AUTH_SECRET: SECRET,
    SECRETS_KEY: KEY,
    DISPATCHER: { get: () => ({ fetch: (request: Request) => toolWorker(request) }) },
  } as GatewayEnv;
  for (const [name, id] of [
    ["ana", ana],
    ["root", root],
  ] as const) {
    cookies[name] = (
      await openSession(
        { person: id, workspace: "acme" },
        { secret: SECRET, ttlSeconds: 86_400, now: clock },
      )
    ).split(";")[0]!;
  }
});
afterAll(() => memory.close());

const gateway = () => createGateway(env, { now: () => clock });
const get = (path: string, headers: Record<string, string> = {}) =>
  gateway()(new Request(`${ORIGIN}${path}`, { headers }));
const form = (path: string, body: Record<string, string>, headers: Record<string, string> = {}) =>
  gateway()(
    new Request(`${ORIGIN}${path}`, {
      method: "POST",
      headers: { "content-type": "application/x-www-form-urlencoded", ...headers },
      body: new URLSearchParams(body),
    }),
  );
const decode = (text: string) =>
  text.replaceAll("&amp;", "&").replaceAll("&quot;", '"').replaceAll("&#39;", "'");

const pkce = () => {
  const verifier = randomBytes(32).toString("base64url");
  return { verifier, challenge: createHash("sha256").update(verifier).digest("base64url") };
};
const register = async (over: Record<string, unknown> = {}) =>
  gateway()(
    new Request(`${ORIGIN}/oauth/register`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ redirect_uris: [REDIRECT], client_name: "Claude", ...over }),
    }),
  );
const clientId = async () => ((await (await register()).json()) as { client_id: string }).client_id;
const authorizeQuery = (client: string, challenge: string, over: Record<string, string> = {}) =>
  new URLSearchParams({
    response_type: "code",
    client_id: client,
    redirect_uri: REDIRECT,
    state: "st1",
    code_challenge: challenge,
    code_challenge_method: "S256",
    resource: `${ORIGIN}/mcp`,
    ...over,
  });

/** The person presses a button of the consent page; what the page sends the browser to. */
async function answer(page: Response, cookie: string, decision: "allow" | "deny" = "allow") {
  const html = await page.text();
  const fields = Object.fromEntries(
    [...html.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)">/g)].map((m) => [
      decode(m[1]!),
      decode(m[2]!),
    ]),
  );
  const posted = await form(
    "/oauth/authorize",
    { ...fields, decision },
    { cookie, origin: ORIGIN },
  );
  const refresh = /http-equiv="refresh" content="0;url=([^"]+)"/.exec(await posted.text());
  return { status: posted.status, to: refresh ? new URL(decode(refresh[1]!)) : undefined };
}

/** The whole dance for one person: the tokens an app ends up with. */
async function connect(person: "ana" | "root", over: { client?: string; resource?: string } = {}) {
  const client = over.client ?? (await clientId());
  const { verifier, challenge } = pkce();
  const page = await get(
    `/oauth/authorize?${authorizeQuery(client, challenge, over.resource ? { resource: over.resource } : {})}`,
    { cookie: cookies[person]! },
  );
  expect(page.status).toBe(200);
  const { to } = await answer(page, cookies[person]!);
  const code = to!.searchParams.get("code")!;
  const traded = await form("/oauth/token", {
    grant_type: "authorization_code",
    code,
    code_verifier: verifier,
    redirect_uri: REDIRECT,
    client_id: client,
  });
  return { client, code, verifier, traded };
}
type Tokens = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: string;
};
const tokensOf = async (response: Response) => (await response.json()) as Tokens;

const mcp = async (bearer: string | undefined, method: string, params?: unknown) => {
  const response = await gateway()(
    new Request(`${ORIGIN}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    }),
  );
  return {
    status: response.status,
    headers: response.headers,
    body: (await response.json()) as any,
  };
};
const toolNames = async (bearer: string) =>
  ((await mcp(bearer, "tools/list")).body.result.tools as any[]).map((t) => t.name as string);

describe("what a client reads first", () => {
  it("is told where the authorization server is, by the 401 and by the documents", async () => {
    const refused = await mcp(undefined, "tools/list");
    expect(refused.status).toBe(401);
    expect(refused.headers.get("www-authenticate")).toBe(
      `Bearer resource_metadata="${ORIGIN}/.well-known/oauth-protected-resource"`,
    );
    const resource = (await (await get("/.well-known/oauth-protected-resource")).json()) as any;
    expect(resource).toMatchObject({
      resource: `${ORIGIN}/mcp`,
      authorization_servers: [ORIGIN],
    });
    const server = (await (await get("/.well-known/oauth-authorization-server")).json()) as any;
    expect(server).toMatchObject({
      issuer: ORIGIN,
      authorization_endpoint: `${ORIGIN}/oauth/authorize`,
      token_endpoint: `${ORIGIN}/oauth/token`,
      registration_endpoint: `${ORIGIN}/oauth/register`,
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none"],
    });
  });

  it("registers a public client, and refuses an address that is neither https nor this machine's", async () => {
    const ok = await register({ redirect_uris: ["http://127.0.0.1:5555/cb", REDIRECT] });
    expect(ok.status).toBe(201);
    expect(await ok.json()).toMatchObject({
      client_name: "Claude",
      token_endpoint_auth_method: "none",
    });
    for (const redirect_uris of [
      ["http://evil.example/cb"],
      ["https://client.example/cb#frag"],
      ["https://user:pw@client.example/cb"],
      ["javascript:alert(1)"],
      [],
      "https://client.example/cb",
    ]) {
      expect((await register({ redirect_uris })).status).toBe(400);
    }
    expect((await register({ token_endpoint_auth_method: "client_secret_basic" })).status).toBe(
      400,
    );
  });
});

describe("signing in an MCP client", () => {
  it("sends a signed-out person to sign in, then back; a click is needed to allow", async () => {
    const client = await clientId();
    const { challenge } = pkce();
    const url = `/oauth/authorize?${authorizeQuery(client, challenge)}`;
    const out = await get(url);
    expect(out.status).toBe(302);
    expect(out.headers.get("location")).toBe(`/auth/login?next=${encodeURIComponent(url)}`);
    const page = await get(url, { cookie: cookies.ana! });
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain("Claude");
    expect(html).toContain("ana@acme.test");
    expect(html).toContain("client.example");
    expect(page.headers.get("location")).toBeNull();
  });

  it("gives the administrator the whole admin MCP and a member only the signed-in tools", async () => {
    const admin = await tokensOf((await connect("root")).traded);
    const member = await tokensOf((await connect("ana")).traded);
    expect(admin).toMatchObject({ token_type: "Bearer", expires_in: 3600 });
    expect(await toolNames(admin.access_token)).toContain("tool_install");
    const names = await toolNames(member.access_token);
    expect(names).toEqual(["catalog_search", "catalog_get", "tools_list", "tool_get", "team_list"]);
    const refused = await mcp(member.access_token, "tools/call", {
      name: "access_grant",
      arguments: { subject: "everyone", tool: "crm", all: true },
    });
    expect(refused.body.error ?? refused.body.result?.isError).toBeTruthy();
    expect((await registry.findMember("acme", ana))?.teams).toEqual([]);
  });

  it("refuses the access token everywhere but the admin MCP", async () => {
    const { access_token } = await tokensOf((await connect("root")).traded);
    const bearer = { authorization: `Bearer ${access_token}` };
    expect((await get("/whoami", bearer)).status).toBe(401);
    expect((await get("/console-api/api/workspace", bearer)).status).toBe(401);
    expect((await get("/t/crm/mcp", bearer)).status).not.toBe(200);
    // And a token made for the CLI, or for a tool, is not an OAuth token: the admin MCP still takes the CLI's.
    const cli = await issueToken({
      secret: SECRET,
      person: root,
      workspace: "acme",
      tool: "platform",
      ttlSeconds: 60,
      now: clock,
      scope: "cli",
    });
    expect((await mcp(cli, "tools/list")).status).toBe(200);
  });

  it("expires the access token after an hour, and a refresh token renews it", async () => {
    const first = await tokensOf((await connect("root")).traded);
    tick(3601);
    expect((await mcp(first.access_token, "tools/list")).status).toBe(401);
    const renewed = await form("/oauth/token", {
      grant_type: "refresh_token",
      refresh_token: first.refresh_token,
      client_id: await (async () => {
        const claims = JSON.parse(
          Buffer.from(first.refresh_token.split(".")[1]!, "base64url").toString(),
        );
        return claims.cid as string;
      })(),
    });
    expect(renewed.status).toBe(200);
    const next = await tokensOf(renewed);
    expect(next.refresh_token).not.toBe(first.refresh_token);
    expect((await mcp(next.access_token, "tools/list")).status).toBe(200);
  });

  it("ends the connection when a refresh token is used twice", async () => {
    const { client, traded } = await connect("root");
    const first = await tokensOf(traded);
    const rotate = (refresh_token: string) =>
      form("/oauth/token", { grant_type: "refresh_token", refresh_token, client_id: client });
    const second = await tokensOf(await rotate(first.refresh_token));
    expect((await mcp(second.access_token, "tools/list")).status).toBe(200);
    const replay = await rotate(first.refresh_token);
    expect(replay.status).toBe(400);
    expect(await replay.json()).toMatchObject({ error: "invalid_grant" });
    // Whoever holds a copy, the whole connection is over: the newer tokens stop too.
    expect((await mcp(second.access_token, "tools/list")).status).toBe(401);
    expect((await rotate(second.refresh_token)).status).toBe(400);
  });

  it("revokes a connection on request: the access token and the refresh token both stop", async () => {
    const { client, traded } = await connect("ana");
    const tokens = await tokensOf(traded);
    expect((await mcp(tokens.access_token, "tools/list")).status).toBe(200);
    expect((await form("/oauth/revoke", { token: tokens.refresh_token })).status).toBe(200);
    expect((await mcp(tokens.access_token, "tools/list")).status).toBe(401);
    expect(
      (
        await form("/oauth/token", {
          grant_type: "refresh_token",
          refresh_token: tokens.refresh_token,
          client_id: client,
        })
      ).status,
    ).toBe(400);
    // An unknown token is a 200 too: revocation says nothing about what exists.
    expect((await form("/oauth/revoke", { token: "nonsense" })).status).toBe(200);
  });

  it("stops at once for a person who is removed or whose tokens are all revoked", async () => {
    const { access_token } = await tokensOf((await connect("ana")).traded);
    expect((await mcp(access_token, "tools/list")).status).toBe(200);
    await registry.revokePersonTokens("acme", ana, 86_400);
    expect((await mcp(access_token, "tools/list")).status).toBe(401);
  });
});

describe("what the authorization step refuses", () => {
  it("shows an error, and redirects nowhere, for a client or an address that is not registered", async () => {
    const { challenge } = pkce();
    const client = await clientId();
    for (const query of [
      authorizeQuery("not-a-client", challenge),
      authorizeQuery(client, challenge, { redirect_uri: "https://evil.example/cb" }),
    ]) {
      const response = await get(`/oauth/authorize?${query}`, { cookie: cookies.ana! });
      expect(response.status).toBe(400);
      expect(response.headers.get("location")).toBeNull();
    }
    // A client registered at another workspace is not this workspace's: its id is signed for that one.
    const other = await gateway()(
      new Request("https://globex.forgeron.app/oauth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ redirect_uris: [REDIRECT] }),
      }),
    );
    const foreign = ((await other.json()) as { client_id: string }).client_id;
    const refused = await get(`/oauth/authorize?${authorizeQuery(foreign, challenge)}`, {
      cookie: cookies.ana!,
    });
    expect(refused.status).toBe(400);
  });

  it("requires S256 PKCE, the code response type, this workspace's MCP as the resource and a known scope", async () => {
    const client = await clientId();
    const { challenge } = pkce();
    const asked = (over: Record<string, string>) =>
      get(`/oauth/authorize?${authorizeQuery(client, challenge, over)}`, { cookie: cookies.ana! });
    expect((await asked({ code_challenge_method: "plain" })).status).toBe(400);
    expect((await asked({ response_type: "token" })).status).toBe(400);
    expect((await asked({ resource: "https://acme.forgeron.app/t/ghost/mcp" })).status).toBe(400);
    expect((await asked({ scope: "admin" })).status).toBe(400);
    expect((await asked({ scope: "mcp" })).status).toBe(200);
    expect(
      (await get(`/oauth/authorize?${authorizeQuery(client, "")}`, { cookie: cookies.ana! }))
        .status,
    ).toBe(400);
  });

  it("tells the app when the person says no, and refuses an answer that did not come from the page", async () => {
    const client = await clientId();
    const { challenge } = pkce();
    const page = await get(`/oauth/authorize?${authorizeQuery(client, challenge)}`, {
      cookie: cookies.ana!,
    });
    const html = await page.clone().text();
    const denied = await answer(page, cookies.ana!, "deny");
    expect(denied.to!.searchParams.get("error")).toBe("access_denied");
    expect(denied.to!.searchParams.get("state")).toBe("st1");
    expect(denied.to!.searchParams.get("code")).toBeNull();
    const fields = Object.fromEntries(
      [...html.matchAll(/<input type="hidden" name="([^"]+)" value="([^"]*)">/g)].map((m) => [
        decode(m[1]!),
        decode(m[2]!),
      ]),
    );
    const foreign = await form(
      "/oauth/authorize",
      { ...fields, decision: "allow" },
      { cookie: cookies.ana!, origin: "https://evil.example" },
    );
    expect(foreign.status).toBe(403);
    const signedOut = await form(
      "/oauth/authorize",
      { ...fields, decision: "allow" },
      { origin: ORIGIN },
    );
    expect(signedOut.status).toBe(401);
  });

  it("trades a code once, for its own client and address, with its own verifier", async () => {
    const { client, code, verifier, traded } = await connect("ana");
    expect(traded.status).toBe(200);
    const again = (over: Record<string, string> = {}) =>
      form("/oauth/token", {
        grant_type: "authorization_code",
        code,
        code_verifier: verifier,
        redirect_uri: REDIRECT,
        client_id: client,
        ...over,
      });
    expect(await (await again()).json()).toMatchObject({ error: "invalid_grant" });

    const second = await connect("ana");
    for (const over of [
      { code_verifier: pkce().verifier },
      { redirect_uri: "https://client.example/other" },
      { client_id: await clientId() },
    ]) {
      const { code: fresh } = await (async () => {
        const c = await connect("ana");
        return { code: c.code, verifier: c.verifier, client: c.client };
      })();
      const refused = await form("/oauth/token", {
        grant_type: "authorization_code",
        code: fresh,
        code_verifier: second.verifier,
        redirect_uri: REDIRECT,
        client_id: second.client,
        ...over,
      });
      expect(refused.status).toBe(400);
    }
    expect((await form("/oauth/token", { grant_type: "password", username: "ana" })).status).toBe(
      400,
    );
  });

  it("lets a code live a minute only", async () => {
    const client = await clientId();
    const { verifier, challenge } = pkce();
    const page = await get(`/oauth/authorize?${authorizeQuery(client, challenge)}`, {
      cookie: cookies.ana!,
    });
    const { to } = await answer(page, cookies.ana!);
    tick(61);
    const late = await form("/oauth/token", {
      grant_type: "authorization_code",
      code: to!.searchParams.get("code")!,
      code_verifier: verifier,
      redirect_uri: REDIRECT,
      client_id: client,
    });
    expect(late.status).toBe(400);
  });
});

describe("signing in to a tool's MCP (D-095)", () => {
  const TOOL = `${ORIGIN}/t/crm/mcp`;
  const call = (path: string, bearer?: string) =>
    get(path, bearer ? { authorization: `Bearer ${bearer}` } : {});

  it("tells a client where to sign in: the gateway's challenge on a 401, and a document per tool", async () => {
    const refused = await call("/t/crm/mcp");
    expect(refused.status).toBe(401);
    // The tool's own challenge is dropped: only the gateway says where to sign in.
    expect(refused.headers.get("www-authenticate")).toBe(
      `Bearer resource_metadata="${ORIGIN}/.well-known/oauth-protected-resource/t/crm/mcp"`,
    );
    const document = (await (
      await get("/.well-known/oauth-protected-resource/t/crm/mcp")
    ).json()) as any;
    expect(document).toMatchObject({ resource: TOOL, authorization_servers: [ORIGIN] });
    // A preview of the tool has one too, and a tool that does not exist has none.
    expect(
      ((await (await get("/.well-known/oauth-protected-resource/t/crm@feat/mcp")).json()) as any)
        .resource,
    ).toBe(`${ORIGIN}/t/crm@feat/mcp`);
    expect((await get("/.well-known/oauth-protected-resource/t/ghost/mcp")).status).toBe(404);
    expect((await get("/.well-known/oauth-protected-resource/t/platform/mcp")).status).toBe(404);
  });

  it("gives a person a token for that tool: it is them there, and nowhere else", async () => {
    const page = await get(
      `/oauth/authorize?${authorizeQuery(await clientId(), pkce().challenge, { resource: TOOL })}`,
      { cookie: cookies.ana! },
    );
    const html = await page.text();
    expect(html).toContain("crm");
    expect(html).toContain("ana@acme.test");

    const { traded } = await connect("ana", { resource: TOOL });
    const tokens = await tokensOf(traded);
    expect(tokens.expires_in).toBe(3600);
    const here = await call("/t/crm/mcp", tokens.access_token);
    expect(here.status).toBe(200);
    expect(await here.json()).toMatchObject({ result: { user: ana } });
    // Not the same tool's API, CLI or secrets page, not another tool, not the admin MCP.
    for (const path of ["/t/crm/api/tickets.mine", "/t/crm/cli", "/t/crm/secrets"]) {
      expect((await call(path, tokens.access_token)).status).not.toBe(200);
    }
    expect((await call("/t/hr/mcp", tokens.access_token)).status).toBe(401);
    expect((await mcp(tokens.access_token, "tools/list")).status).toBe(401);
    expect((await call("/whoami", tokens.access_token)).status).toBe(401);
  });

  it("does not let the admin MCP's token reach a tool, nor a tool's token the admin MCP", async () => {
    const admin = await tokensOf((await connect("root")).traded);
    expect((await call("/t/crm/mcp", admin.access_token)).status).toBe(401);
    const tool = await tokensOf((await connect("root", { resource: TOOL })).traded);
    expect((await mcp(tool.access_token, "tools/list")).status).toBe(401);
  });

  it("keeps the tool through a refresh, and ends it with the connection", async () => {
    const { client, traded } = await connect("ana", { resource: TOOL });
    const first = await tokensOf(traded);
    const renewed = await tokensOf(
      await form("/oauth/token", {
        grant_type: "refresh_token",
        refresh_token: first.refresh_token,
        client_id: client,
      }),
    );
    expect((await call("/t/crm/mcp", renewed.access_token)).status).toBe(200);
    expect((await call("/t/hr/mcp", renewed.access_token)).status).toBe(401);
    await form("/oauth/revoke", { token: renewed.refresh_token });
    expect((await call("/t/crm/mcp", renewed.access_token)).status).toBe(401);
  });

  it("refuses a resource that is not an MCP of this workspace, and a code traded for another", async () => {
    const client = await clientId();
    const { challenge } = pkce();
    for (const resource of [
      `${ORIGIN}/t/ghost/mcp`,
      `${ORIGIN}/t/platform/mcp`,
      `${ORIGIN}/t/crm/api`,
      "https://globex.forgeron.app/t/crm/mcp",
      "https://evil.example/t/crm/mcp",
    ]) {
      const asked = await get(
        `/oauth/authorize?${authorizeQuery(client, challenge, { resource })}`,
        {
          cookie: cookies.ana!,
        },
      );
      expect(asked.status).toBe(400);
    }
    const { verifier, challenge: good } = pkce();
    const page = await get(`/oauth/authorize?${authorizeQuery(client, good, { resource: TOOL })}`, {
      cookie: cookies.ana!,
    });
    const { to } = await answer(page, cookies.ana!);
    const wrong = await form("/oauth/token", {
      grant_type: "authorization_code",
      code: to!.searchParams.get("code")!,
      code_verifier: verifier,
      redirect_uri: REDIRECT,
      client_id: client,
      resource: `${ORIGIN}/mcp`,
    });
    expect(wrong.status).toBe(400);
    expect(await wrong.json()).toMatchObject({ error: "invalid_target" });
  });

  it("stops when the tool is deleted from the workspace's point of view: no new token for it", async () => {
    const extra = await registry.createTool({ workspace: "acme", name: "temp" });
    const { client, traded } = await connect("ana", { resource: `${ORIGIN}/t/temp/mcp` });
    const tokens = await tokensOf(traded);
    expect(extra.name).toBe("temp");
    await (memory as unknown as D1Database)
      .prepare(`DELETE FROM "tools" WHERE "id" = ?`)
      .bind(extra.id)
      .all();
    const refused = await form("/oauth/token", {
      grant_type: "refresh_token",
      refresh_token: tokens.refresh_token,
      client_id: client,
    });
    expect(refused.status).toBe(400);
    expect(await refused.json()).toMatchObject({ error: "invalid_target" });
  });
});

describe("the tool's setup at the connection (D-098)", () => {
  const ONBOARD = `${ORIGIN}/t/onboard/mcp`;
  const asked = (person: "ana" | "root", client: string, challenge: string) =>
    get(`/oauth/authorize?${authorizeQuery(client, challenge, { resource: ONBOARD })}`, {
      cookie: cookies[person]!,
    });

  it("sends a person who has not given their setup to the setup page, then back, then to the click", async () => {
    const client = await clientId();
    const { verifier, challenge } = pkce();
    const first = await asked("ana", client, challenge);
    expect(first.status).toBe(302);
    const to = new URL(first.headers.get("location")!, ORIGIN);
    expect(to.pathname).toBe("/t/onboard/setup");
    const next = to.searchParams.get("next")!;
    expect(next.startsWith("/oauth/authorize?")).toBe(true);

    // The setup page keeps the way back, and offers it once the values are saved.
    const page = await get(`${to.pathname}${to.search}`, { cookie: cookies.ana! });
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("First name");
    const saved = await gateway()(
      new Request(`${ORIGIN}${to.pathname}${to.search}`, {
        method: "POST",
        headers: { cookie: cookies.ana!, "content-type": "application/json" },
        body: JSON.stringify({ firstName: "Ana" }),
      }),
    );
    expect(saved.status).toBe(200);
    // A form post gets the page with the link to carry on.
    const posted = await gateway()(
      new Request(`${ORIGIN}${to.pathname}${to.search}`, {
        method: "POST",
        headers: { cookie: cookies.ana!, "content-type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ firstName: "Ana" }),
      }),
    );
    expect(await posted.text()).toContain(`href="${next.replaceAll("&", "&amp;")}"`);

    // Back at the authorization step: the setup is done, so the person is asked to allow.
    const again = await get(next, { cookie: cookies.ana! });
    expect(again.status).toBe(200);
    const { to: back } = await answer(again, cookies.ana!);
    const traded = await form("/oauth/token", {
      grant_type: "authorization_code",
      code: back!.searchParams.get("code")!,
      code_verifier: verifier,
      redirect_uri: REDIRECT,
      client_id: client,
    });
    const tokens = await tokensOf(traded);
    expect(
      await (
        await get("/t/onboard/mcp", { authorization: `Bearer ${tokens.access_token}` })
      ).json(),
    ).toMatchObject({
      result: { user: ana },
    });
  });

  it("does not issue a token for a tool whose setup is not done, even to a form posted by hand", async () => {
    const client = await clientId();
    const { challenge } = pkce();
    const refused = await form(
      "/oauth/authorize",
      {
        response_type: "code",
        client_id: client,
        redirect_uri: REDIRECT,
        state: "st1",
        code_challenge: challenge,
        code_challenge_method: "S256",
        resource: ONBOARD,
        decision: "allow",
      },
      { cookie: cookies.root!, origin: ORIGIN },
    );
    expect(refused.status).toBe(400);
    expect(await refused.text()).not.toContain("code=");
  });

  it("asks nothing for a tool with no setup, nor for the admin MCP", async () => {
    const client = await clientId();
    const { challenge } = pkce();
    const plain = await get(
      `/oauth/authorize?${authorizeQuery(client, challenge, { resource: `${ORIGIN}/t/crm/mcp` })}`,
      { cookie: cookies.root! },
    );
    expect(plain.status).toBe(200);
    const admin = await get(`/oauth/authorize?${authorizeQuery(client, challenge)}`, {
      cookie: cookies.root!,
    });
    expect(admin.status).toBe(200);
  });

  it("sends a person on only to the authorization step, never to another address", async () => {
    for (const next of [
      "https://evil.example/",
      "//evil.example/",
      "/console",
      "/oauth/authorize/../x",
      "/t/crm/mcp",
    ]) {
      const page = await get(`/t/onboard/setup?next=${encodeURIComponent(next)}`, {
        cookie: cookies.root!,
      });
      const html = await page.text();
      expect(html).not.toContain(next);
      expect(html).not.toContain("?next=");
    }
  });
});
