import { createRuntime } from "@forgeron/runtime";
import { describe, expect, it, vi } from "vitest";
import { audienceOf, parseAudience } from "./audience";
import type { Person } from "../kernel/person";
import { tokenAuthenticator } from "./authenticate";
import { issueToken, verifyToken } from "./tokens";

const secret = "test-secret-not-a-real-one";
const now = new Date("2026-11-03T10:00:00Z");
const later = (seconds: number) => new Date(now.getTime() + seconds * 1000);
const issue = (tool: string, workspace = "acme", ttlSeconds = 600) =>
  issueToken({ secret, person: "u1", workspace, tool, ttlSeconds, now });

describe("audience", () => {
  it("is <workspace>/<tool>", () => {
    expect(audienceOf("acme", "crm")).toBe("acme/crm");
    expect(parseAudience("acme/crm")).toEqual({ workspace: "acme", tool: "crm" });
  });

  it("refuses names that could reach another tool or workspace", () => {
    expect(() => audienceOf("acme", "crm/api")).toThrow("not a tool name");
    expect(() => audienceOf("acme", "crm@feat")).toThrow("not a tool name");
    expect(() => audienceOf("AC", "crm")).toThrow("not a workspace name");
    for (const bad of ["acme", "acme/crm/x", "acme/", "/crm", "acme/crm@b"]) {
      expect(parseAudience(bad)).toBeUndefined();
    }
  });
});

describe("tokens", () => {
  it("carry the workspace and the tool as audience, and the person", async () => {
    const check = await verifyToken(await issue("crm"), { secret, now });
    expect(check).toEqual({
      ok: true,
      claims: {
        sub: "u1",
        aud: "acme/crm",
        iat: now.getTime() / 1000,
        exp: now.getTime() / 1000 + 600,
        jti: expect.any(String),
      },
    });
  });

  it("have an id of their own, and no two share one", async () => {
    const [a, b] = await Promise.all([issue("crm"), issue("crm")]);
    const idOf = async (t: string) => {
      const check = await verifyToken(t, { secret, now });
      return check.ok ? check.claims.jti : undefined;
    };
    expect(await idOf(a)).not.toBe(await idOf(b));
  });

  it("verify under a previous key after a rotation, never sign with it", async () => {
    const token = await issue("crm");
    expect(await verifyToken(token, { secret: "the-new-key", now })).toEqual({
      ok: false,
      reason: "signature",
    });
    expect(
      await verifyToken(token, { secret: "the-new-key", previousSecrets: [secret], now }),
    ).toMatchObject({ ok: true });
  });

  it("are refused for any other tool or workspace", async () => {
    const token = await issue("crm");
    expect(await verifyToken(token, { secret, now, audience: "acme/crm" })).toMatchObject({
      ok: true,
    });
    for (const other of ["acme/odoo", "other/crm", "acme/crm2", "acme/cr"]) {
      expect(await verifyToken(token, { secret, now, audience: other })).toEqual({
        ok: false,
        reason: "audience",
      });
    }
  });

  it("expire, at the second they say", async () => {
    const token = await issue("crm", "acme", 60);
    expect(await verifyToken(token, { secret, now: later(59) })).toMatchObject({ ok: true });
    expect(await verifyToken(token, { secret, now: later(60) })).toEqual({
      ok: false,
      reason: "expired",
    });
  });

  it("cannot be forged: another secret, or claims rewritten to another tool", async () => {
    const token = await issue("crm");
    expect(await verifyToken(token, { secret: "other", now })).toEqual({
      ok: false,
      reason: "signature",
    });

    const [prefix, payload, signature] = token.split(".");
    const claims = JSON.parse(atob(payload!.replaceAll("-", "+").replaceAll("_", "/")));
    const forged = btoa(JSON.stringify({ ...claims, aud: "acme/odoo" }))
      .replaceAll("+", "-")
      .replaceAll("/", "_")
      .replaceAll("=", "");
    expect(
      await verifyToken(`${prefix}.${forged}.${signature}`, { secret, now, audience: "acme/odoo" }),
    ).toEqual({
      ok: false,
      reason: "signature",
    });
  });

  it("refuses what is not a token", async () => {
    for (const bad of ["", "abc", "fgt.a.b.c", "jwt.a.b", "fgt..", "fgt.!!.??"]) {
      expect(await verifyToken(bad, { secret, now })).toMatchObject({ ok: false });
    }
  });

  it("need a positive lifetime, with no default", async () => {
    await expect(issue("crm", "acme", 0)).rejects.toThrow("positive lifetime");
  });
});

// The runtime of a tool behind the gateway's authenticator, on the three interfaces a token reaches.
const person = (roles: string[]): Person => ({
  id: "u1",
  email: "ely@acme.fr",
  name: "Ely",
  roles,
});
const action = {
  description: "List.",
  access: "read",
  input: { type: "object" },
  confirm: false,
  cli: { args: [] },
  http: { method: "GET" },
  interfaces: ["mcp", "api", "cli", "web"],
};
const manifest = (name: string) =>
  ({
    name,
    version: "1.0.0",
    title: name,
    description: name,
    interfaces: { mcp: true, api: true, cli: true, web: true },
    roles: { reader: { grants: ["read"] } },
    actions: { "deals.list": action },
    views: {},
    jobs: {},
    events: {},
    resources: {},
    uses: {},
    preview: { data: "seed" },
  }) as Parameters<typeof createRuntime>[0]["manifest"];

function toolRuntime(tool: string) {
  const run = vi.fn<() => unknown>(() => ({ tool }));
  const runtime = createRuntime({
    manifest: manifest(tool),
    actions: {
      "deals.list": { input: { safeParse: (data: unknown) => ({ success: true, data }) }, run },
    },
    audience: audienceOf("acme", tool),
    authenticate: tokenAuthenticator({
      secret,
      now: () => now,
      resolvePerson: (id) => (id === "u1" ? person(["reader"]) : undefined),
    }),
  });
  return { runtime, run };
}

describe("a token for one tool is refused by every other tool", () => {
  const tools = ["crm", "odoo", "inventory"];
  const reach = [
    ["API", "/api/deals.list", "GET"],
    ["CLI", "/cli", "GET"],
    ["MCP", "/mcp", "POST"],
  ] as const;

  for (const [label, path, method] of reach) {
    it(`on ${label}`, async () => {
      for (const issuedFor of tools) {
        const token = await issue(issuedFor);
        for (const target of tools) {
          const { runtime, run } = toolRuntime(target);
          const response = await runtime.fetch(
            new Request(`https://acme.forgeron.app${path}`, {
              method,
              headers: { authorization: `Bearer ${token}` },
              body:
                method === "POST"
                  ? JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" })
                  : undefined,
            }),
          );
          expect({ issuedFor, target, status: response.status }).toEqual({
            issuedFor,
            target,
            status: issuedFor === target ? 200 : 403,
          });
          expect(run.mock.calls.length).toBe(label === "API" && issuedFor === target ? 1 : 0);
        }
      }
    });
  }

  it("answers 401 to an expired token, a forged one, a token of a gone person or none", async () => {
    const { runtime } = toolRuntime("crm");
    const get = (authorization?: string) =>
      runtime.fetch(
        new Request("https://acme.forgeron.app/api/deals.list", {
          headers: authorization ? { authorization } : {},
        }),
      );
    expect(
      (await get(`Bearer ${await issue("crm", "acme", 600).then((t) => t.slice(0, -2) + "xx")}`))
        .status,
    ).toBe(401);
    const expired = await issueToken({
      secret,
      person: "u1",
      workspace: "acme",
      tool: "crm",
      ttlSeconds: 1,
      now: later(-10),
    });
    expect((await get(`Bearer ${expired}`)).status).toBe(401);
    const gone = await issueToken({
      secret,
      person: "ghost",
      workspace: "acme",
      tool: "crm",
      ttlSeconds: 60,
      now,
    });
    expect((await get(`Bearer ${gone}`)).status).toBe(401);
    expect((await get()).status).toBe(401);
  });
});

describe("scoped tokens", () => {
  const scoped = () =>
    issueToken({
      secret,
      person: "deploy:ci",
      workspace: "acme",
      tool: "crm",
      ttlSeconds: 600,
      now,
      scope: "deploy",
    });

  it("are accepted only where their scope is asked for", async () => {
    expect(await verifyToken(await scoped(), { secret, now, scope: "deploy" })).toMatchObject({
      ok: true,
      claims: { sub: "deploy:ci", scp: "deploy" },
    });
    expect(await verifyToken(await scoped(), { secret, now })).toEqual({
      ok: false,
      reason: "scope",
    });
    expect(await verifyToken(await scoped(), { secret, now, scope: "other" })).toEqual({
      ok: false,
      reason: "scope",
    });
  });

  it("are not a person's token, and a person's token is not a deployment token", async () => {
    expect(await verifyToken(await issue("crm"), { secret, now, scope: "deploy" })).toEqual({
      ok: false,
      reason: "scope",
    });
  });
});
