import type { D1Database, Hosting } from "@forgeron/hosting";
import {
  createRegistry,
  createSecretBox,
  migratePlatform,
  type Registry,
} from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "../gateway";
import { openSession } from "../identity/authn/session";
import { issueToken } from "../identity/authn/tokens";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// `secret_request` (sdk.md §17, D-083) through the whole gateway: the MCP hands a link and never sees
// a value; the person types the value on the console API, once, as themselves, before the link
// expires. The people, the keys and the values are test values.

const SECRET = "test-secret-not-a-real-one";
const KEY = btoa(String.fromCharCode(...new Uint8Array(32)));
const VALUE = "typed-by-the-person-test-value";
const ORIGIN = "https://acme.forgeron.app";
const now = new Date("2026-11-06T10:00:00Z");

let memory: MemoryD1;
let registry: Registry;
let env: GatewayEnv;
let toolId = "";
let ana = ""; // a member
let dev = ""; // a developer
let dev2 = ""; // another developer
let root = ""; // an administrator

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { secrets: await createSecretBox(KEY), now: () => now });
  toolId = (await registry.createTool({ workspace: "acme", name: "hr" })).id;
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
  dev = await member("dev", ["developer"]);
  dev2 = await member("dev2", ["developer"]);
  root = await member("root", ["admin"]);
  env = { DB: d1, BASE_DOMAIN: "forgeron.app", AUTH_SECRET: SECRET, SECRETS_KEY: KEY };
});
afterAll(() => memory.close());
afterEach(() => vi.restoreAllMocks());

const hosting: Hosting = {} as Hosting;
const gateway = (at = now) => createGateway(env, { now: () => at, hosting: () => hosting });

const bearer = (person: string) =>
  issueToken({
    secret: SECRET,
    person,
    workspace: "acme",
    tool: "platform",
    ttlSeconds: 86_400,
    now,
    scope: "cli",
  });
let next = 1;
const mcp = async (person: string, name: string, args: unknown = {}) => {
  const response = await gateway()(
    new Request(`${ORIGIN}/mcp`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${await bearer(person)}`,
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: next++,
        method: "tools/call",
        params: { name, arguments: args },
      }),
    }),
  );
  const { result } = (await response.json()) as { result: any };
  const text = result.content[0].text as string;
  return {
    error: result.isError === true,
    text,
    data: result.isError ? undefined : JSON.parse(text),
  };
};
const requestLink = async (
  person = dev,
  args: Record<string, string> = { tool: "hr", environment: "production", name: "HR_KEY" },
) => {
  const answer = await mcp(person, "secret_request", args);
  expect(answer.error).toBe(false);
  return answer.data as { url: string; expiresAt: string; note: string };
};
const tokenOf = (url: string) => url.split("#")[1]!;

const cookie = async (person: string) =>
  (
    await openSession({ person, workspace: "acme" }, { secret: SECRET, ttlSeconds: 600, now })
  ).split(";")[0]!;
const consoleApi = async (
  person: string | undefined,
  path: string,
  body: unknown,
  { at = now, headers = {} }: { at?: Date; headers?: Record<string, string> } = {},
) =>
  gateway(at)(
    new Request(`${ORIGIN}/console-api${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        origin: ORIGIN,
        ...(person ? { cookie: await cookie(person) } : {}),
        ...headers,
      },
      body: JSON.stringify(body),
    }),
  );
const lookup = (person: string | undefined, token: string, at = now) =>
  consoleApi(person, "/api/secret-requests/lookup", { token }, { at });
const fulfil = (person: string | undefined, token: string, value = VALUE, at = now) =>
  consoleApi(person, "/api/secret-requests/fulfil", { token, value }, { at });
const audit = async () =>
  (
    await (memory as unknown as D1Database)
      .prepare(
        `SELECT "actor", "via", "kind", "subject", "detail" FROM "audit_log" WHERE "subject" LIKE 'secret:%' ORDER BY rowid`,
      )
      .all()
  ).results as Array<Record<string, string | null>>;

describe("the MCP tool", () => {
  it("is offered to a developer and an admin, not to a member", async () => {
    const list = async (person: string) => {
      const response = await gateway()(
        new Request(`${ORIGIN}/mcp`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${await bearer(person)}`,
          },
          body: JSON.stringify({ jsonrpc: "2.0", id: next++, method: "tools/list" }),
        }),
      );
      return ((await response.json()) as any).result.tools.map((t: any) => t.name) as string[];
    };
    expect(await list(dev)).toContain("secret_request");
    expect(await list(root)).toContain("secret_request");
    expect(await list(ana)).not.toContain("secret_request");
    const refused = await mcp(ana, "secret_request", {
      tool: "hr",
      environment: "production",
      name: "HR_KEY",
    });
    expect(refused.error).toBe(true);
    expect(refused.text).toMatch(/^403/);
  });

  it("returns only a link to the console page, with the token after the #", async () => {
    const answer = await requestLink();
    expect(Object.keys(answer).sort()).toEqual(["expiresAt", "note", "url"]);
    expect(answer.url).toMatch(/^https:\/\/acme\.forgeron\.app\/secret-request#[A-Za-z0-9_-]{43}$/);
    expect(new URL(answer.url).search).toBe("");
    expect(Date.parse(answer.expiresAt) - now.getTime()).toBe(15 * 60 * 1000);
  });

  it("takes no value: one passed anyway is refused and echoed nowhere", async () => {
    const answer = await mcp(dev, "secret_request", {
      tool: "hr",
      environment: "production",
      name: "HR_KEY",
      value: VALUE,
    });
    expect(answer.error).toBe(true);
    expect(answer.text).not.toContain(VALUE);
    expect(await registry.secretNames(toolId, "production")).toEqual([]);
  });

  it("refuses a tool, an environment or a name that is not real", async () => {
    const bad = (args: Record<string, string>) => mcp(dev, "secret_request", args);
    expect((await bad({ tool: "nope", environment: "production", name: "A" })).text).toMatch(
      /^404/,
    );
    expect((await bad({ tool: "hr", environment: "pilot", name: "A" })).error).toBe(true);
    expect((await bad({ tool: "hr", environment: "production", name: "lower" })).error).toBe(true);
  });
});

describe("the console API, with the link", () => {
  it("tells the person where the secret goes, then sets it, once, and never echoes it", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const info = vi.spyOn(console, "info").mockImplementation(() => {});
    const error = vi.spyOn(console, "error").mockImplementation(() => {});
    const { url } = await requestLink();
    const token = tokenOf(url);

    const seen = await lookup(dev, token);
    expect(seen.status).toBe(200);
    const seenBody = await seen.json();
    expect(seenBody).toEqual({
      tool: "hr",
      environment: "production",
      name: "HR_KEY",
      expiresAt: new Date(now.getTime() + 15 * 60 * 1000).toISOString(),
    });
    // Looking does not spend the link.
    const done = await fulfil(dev, token);
    expect(done.status).toBe(204);
    expect(await done.text()).toBe("");
    expect(await registry.readSecrets(toolId, "production")).toEqual({ HR_KEY: VALUE });

    // The link is spent: neither the same person nor anyone else can use it again.
    const again = await fulfil(dev, token, "second-test-value");
    expect(again.status).toBe(404);
    expect((await lookup(dev, token)).status).toBe(404);
    expect(await registry.readSecrets(toolId, "production")).toEqual({ HR_KEY: VALUE });

    // The audit lines name the person, say how the link was asked for, and hold no value, no token.
    const lines = await audit();
    expect(lines.slice(-2).map((l) => [l.actor, l.via, l.kind, l.subject])).toEqual([
      [dev, "Forgeron MCP", "access", "secret:HR_KEY"],
      [dev, null, "access", "secret:HR_KEY"],
    ]);
    const everything = JSON.stringify([
      lines,
      (await (memory as unknown as D1Database).prepare(`SELECT * FROM "secret_requests"`).all())
        .results,
      seenBody,
      await again.text(),
      [warn, log, info, error].map((spy) => spy.mock.calls),
    ]);
    expect(everything).not.toContain(VALUE);
    expect(everything).not.toContain("second-test-value");
    expect(everything).not.toContain(token);
  });

  it("is refused to another person, however much they are an admin, and the owner can still use it", async () => {
    const token = tokenOf((await requestLink()).url);
    for (const other of [root, dev2, ana]) {
      expect((await lookup(other, token)).status).toBe(404);
      const refused = await fulfil(other, token, "intruder-test-value");
      expect(refused.status).toBe(404);
      expect(await refused.text()).not.toContain("intruder-test-value");
    }
    expect(await registry.readSecrets(toolId, "production")).not.toEqual({
      HR_KEY: "intruder-test-value",
    });
    expect((await fulfil(dev, token, "owner-test-value")).status).toBe(204);
    expect(await registry.readSecrets(toolId, "production")).toEqual({
      HR_KEY: "owner-test-value",
    });
  });

  it("is refused to nobody signed in, and to a CLI token, which is not a session", async () => {
    const token = tokenOf((await requestLink()).url);
    expect((await fulfil(undefined, token)).status).toBe(401);
    const withBearer = await consoleApi(
      undefined,
      "/api/secret-requests/fulfil",
      { token, value: VALUE },
      { headers: { authorization: `Bearer ${await bearer(dev)}` } },
    );
    expect(withBearer.status).toBe(401);
    expect(await registry.secretRequest("acme", token, dev)).toMatchObject({ name: "HR_KEY" });
  });

  it("is refused after its expiry, with 410, and sets nothing", async () => {
    const token = tokenOf((await requestLink()).url);
    // The link lives 15 minutes (the registry's own test steps the clock); here its expiry is
    // brought to now, to see how the gateway answers a link that ran out.
    const d1 = memory as unknown as D1Database;
    await d1.batch([
      d1
        .prepare(`UPDATE "secret_requests" SET "expires_at" = ? WHERE "expires_at" > ?`)
        .bind(now.toISOString(), now.toISOString()),
    ]);
    expect((await lookup(dev, token)).status).toBe(410);
    const refused = await fulfil(dev, token, "late-test-value");
    expect(refused.status).toBe(410);
    expect(await refused.text()).not.toContain("late-test-value");
    expect(await registry.readSecrets(toolId, "production")).not.toEqual({
      HR_KEY: "late-test-value",
    });
  });

  it("refuses a write from another origin, and a body that is not what the route takes", async () => {
    const token = tokenOf((await requestLink()).url);
    const cross = await consoleApi(
      dev,
      "/api/secret-requests/fulfil",
      { token, value: VALUE },
      { headers: { origin: "https://evil.example" } },
    );
    expect(cross.status).toBe(403);
    for (const body of [{ token }, { token, value: "" }, { value: VALUE }, { token, value: 1 }]) {
      expect((await consoleApi(dev, "/api/secret-requests/fulfil", body)).status).toBe(400);
    }
    expect(
      (await consoleApi(dev, "/api/secret-requests/fulfil", { token, value: VALUE, x: 1 })).status,
    ).toBe(400);
    expect(await registry.secretRequest("acme", token, dev)).toMatchObject({ name: "HR_KEY" });
  });

  it("does not take the token in a path or a query", async () => {
    const token = tokenOf((await requestLink()).url);
    for (const path of [
      `/console-api/api/secret-requests/${token}`,
      `/console-api/api/secret-requests/lookup?token=${token}`,
    ]) {
      const response = await gateway()(
        new Request(`${ORIGIN}${path}`, { headers: { cookie: await cookie(dev) } }),
      );
      expect([404, 405]).toContain(response.status);
    }
  });

  it("does not let a member ask for a link on the route either", async () => {
    const response = await consoleApi(
      ana,
      "/api/tools/hr/environments/production/secrets/HR_KEY/request",
      undefined,
    );
    expect(response.status).toBe(403);
  });
});
