import type { Manifest } from "@forgeron/manifest";
import { createRuntime } from "@forgeron/runtime";
import { describe, expect, it } from "vitest";
import type { Person } from "../kernel/person";
import { tokenAuthenticator } from "../identity/authenticate";
import { issueToken } from "../identity/tokens";
import { servePlayground } from "./serve";

const secret = "test-secret-not-a-real-one";
const now = new Date("2026-11-03T10:00:00Z");

const action = (access: string) => ({
  description: "An action.",
  access,
  input: { type: "object" },
  confirm: false,
  cli: { args: [] },
  http: { method: "GET" },
  interfaces: ["mcp", "api", "cli", "web"],
});
const manifest = {
  name: "crm",
  version: "1.0.0",
  title: "CRM",
  description: "A CRM.",
  interfaces: { mcp: true, api: true, cli: true, web: true },
  roles: {
    reader: { grants: ["read"] },
    boss: { grants: ["read", "admin"] },
    nobody: { grants: [] },
  },
  actions: { "deals.list": action("read"), "deals.purge": action("admin") },
  views: {},
  jobs: {},
  events: {},
  resources: { secrets: { API_KEY: { why: "Calls the API" } } },
  uses: {},
  preview: { data: "seed" },
} as unknown as Manifest;

const person = (...roles: string[]): Person => ({
  id: "u1",
  email: "e@acme.fr",
  name: "Ely",
  roles,
});
const get = (path: string, who: Person | undefined, method = "GET") =>
  servePlayground(new Request(`https://acme.forgeron.app${path}`, { method }), {
    tool: "crm",
    manifest,
    person: who,
  });

describe("servePlayground", () => {
  it("leaves any other path to the tool", () => {
    expect(get("/api/deals.list", person("reader"))).toBeUndefined();
    expect(get("/playground", person("reader"))).toBeUndefined();
    expect(get("/play/other", person("reader"))).toBeUndefined();
  });

  it("serves the page, pointed at this tool, with a CSP that keeps it on its own origin", async () => {
    const response = get("/play", person("reader"))!;
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(response.headers.get("content-security-policy")).toContain("connect-src 'self'");
    const html = await response.text();
    expect(html).toContain('const BASE = "/t/crm";');
    expect(html).toContain('const MANIFEST_URL = "/t/crm/play/manifest";');
  });

  it("refuses someone who is not signed in, and someone with no access to the tool", async () => {
    for (const path of ["/play", "/play/manifest"]) {
      expect(get(path, undefined)?.status).toBe(401);
      expect(get(path, person())?.status).toBe(403);
      expect(get(path, person("nobody"))?.status).toBe(403);
      expect(get(path, person("ghost"))?.status).toBe(403);
    }
  });

  it("lists only what the person can run, and none of the platform's business", async () => {
    const reader = (await get("/play/manifest", person("reader"))!.json()) as Manifest;
    expect(Object.keys(reader.actions)).toEqual(["deals.list"]);
    expect(reader).not.toHaveProperty("resources");
    expect(reader).not.toHaveProperty("uses");
    const boss = (await get("/play/manifest", person("boss"))!.json()) as Manifest;
    expect(Object.keys(boss.actions)).toEqual(["deals.list", "deals.purge"]);
    expect(boss.name).toBe("crm");
  });

  it("only answers GET", () => {
    expect(get("/play", person("reader"), "POST")?.status).toBe(405);
  });

  // The page's calls go to the tool's runtime, which checks the access level itself.
  it("does not widen anything: the tool still refuses an action the person cannot run", async () => {
    const runtime = createRuntime({
      manifest: manifest as Parameters<typeof createRuntime>[0]["manifest"],
      actions: {
        "deals.list": {
          input: { safeParse: (data: unknown) => ({ success: true, data }) },
          run: () => 1,
        },
        "deals.purge": {
          input: { safeParse: (data: unknown) => ({ success: true, data }) },
          run: () => 1,
        },
      },
      authenticate: tokenAuthenticator({
        secret,
        now: () => now,
        resolvePerson: () => person("reader"),
      }),
    });
    const token = await issueToken({
      secret,
      person: "u1",
      workspace: "acme",
      tool: "crm",
      ttlSeconds: 60,
      now,
    });
    const call = (name: string) =>
      runtime.fetch(
        new Request(`https://acme.forgeron.app/api/${name}`, {
          headers: { authorization: `Bearer ${token}` },
        }),
      );
    expect((await call("deals.list")).status).toBe(200);
    expect((await call("deals.purge")).status).toBe(403);
  });
});
