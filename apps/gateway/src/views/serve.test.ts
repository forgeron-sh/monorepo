import { createRuntime, type ViewBootstrap } from "@forgeron/runtime";
import { createHttpRuntime, createMemoryParams } from "@forgeron/sdk/react";
import { describe, expect, it, vi } from "vitest";
import { audienceOf } from "../identity/authn/audience";
import type { Person } from "../kernel/person";
import { tokenAuthenticator } from "../identity/authn/authenticate";
import { verifyToken } from "../identity/authn/tokens";
import { serveView, VIEW_CSP, VIEW_TOKEN_TTL_SECONDS, type ViewAssets } from "./serve";

const secret = "test-secret-not-a-real-one";
const now = new Date("2026-11-03T10:00:00Z");
const ely: Person = { id: "u1", email: "ely@acme.fr", name: "Ely", roles: ["reader"] };

const view = (path: string, access: string, entry?: string) => ({
  title: "Pipeline",
  path,
  access,
  ...(entry ? { entry } : {}),
});
const manifest = {
  roles: { reader: { grants: ["read"] }, boss: { grants: ["read", "admin"] } },
  actions: {
    "deals.list": { access: "read" },
    "deals.delete": { access: "admin" },
  },
  views: {
    pipeline: view("/pipeline", "read", "views/pipeline.js"),
    settings: view("/settings", "admin", "views/settings.js"),
    unbuilt: view("/unbuilt", "read"),
  },
} as Parameters<typeof serveView>[1]["manifest"];

const files: Record<string, string> = { "views/pipeline.js": "export default {};" };
const assets: ViewAssets = {
  read: async (file) =>
    file in files ? { body: files[file]!, contentType: "text/javascript" } : undefined,
};

const serveAny = (
  path: string,
  options: {
    person?: Person | null;
    method?: string;
    access?: Record<string, Record<string, boolean>>;
  } = {},
) =>
  serveView(new Request(`https://acme.forgeron.app${path}`, { method: options.method }), {
    secret,
    now,
    workspace: "acme",
    tool: "crm",
    manifest,
    person: options.person === null ? undefined : (options.person ?? ely),
    assets,
    ...(options.access ? { access: options.access } : {}),
  });

const bootstrapOf = async (response: Response): Promise<ViewBootstrap> => {
  const html = await response.text();
  const json = /<script id="forgeron-bootstrap" type="application\/json">(.*)<\/script>/.exec(html);
  return JSON.parse(json![1]!) as ViewBootstrap;
};

describe("serveView and the roles × actions matrix", () => {
  const serve = async (...args: Parameters<typeof serveAny>) => (await serveAny(...args))!;

  it("opens a view to a role the console granted, and shuts one it refused", async () => {
    const granted = await serve("/settings", { access: { reader: { "view:settings": true } } });
    expect(granted.status).toBe(200);
    const refused = await serve("/pipeline", { access: { reader: { "view:pipeline": false } } });
    expect(refused.status).toBe(403);
    // An override of another role, or of an action of the same name, changes nothing.
    expect((await serve("/settings", { access: { boss: { "view:settings": true } } })).status).toBe(
      403,
    );
    expect((await serve("/settings", { access: { reader: { settings: true } } })).status).toBe(403);
  });

  it("tells the page which actions the person may call, overrides included", async () => {
    expect((await bootstrapOf(await serve("/pipeline"))).callable).toEqual(["deals.list"]);
    const wider = await serve("/pipeline", { access: { reader: { "deals.delete": true } } });
    const widerBootstrap = await bootstrapOf(wider);
    expect(widerBootstrap.callable).toEqual(["deals.delete", "deals.list"]);
    const narrower = await serve("/pipeline", { access: { reader: { "deals.list": false } } });
    expect((await bootstrapOf(narrower)).callable).toEqual([]);
    // What the page's runtime answers is what the bootstrap says.
    const runtime = createHttpRuntime(widerBootstrap, { params: createMemoryParams() });
    expect([runtime.canCall("deals.delete"), runtime.canCall("deals.list")]).toEqual([true, true]);
  });
});

const serve = serveAny;

describe("serveView", () => {
  it("carries the sandbox CSP on every response it makes", async () => {
    const answers = await Promise.all([
      serve("/pipeline"),
      serve("/pipeline", { person: null }),
      serve("/settings"),
      serve("/pipeline", { method: "POST" }),
      serve("/_f/views/pipeline.js"),
      serve("/_f/views/missing.js"),
      serve("/_f/views//x.js"),
    ]);
    expect(VIEW_CSP).toBe("sandbox allow-scripts allow-forms allow-popups allow-downloads");
    for (const response of answers) {
      expect(response?.headers.get("content-security-policy")).toBe(VIEW_CSP);
      expect(response?.headers.get("x-content-type-options")).toBe("nosniff");
    }
  });

  it("leaves a path that is not a view to the tool", async () => {
    expect(await serve("/api/deals.list")).toBeUndefined();
    expect(await serve("/")).toBeUndefined();
  });

  it("checks access before rendering and before issuing a token", async () => {
    expect((await serve("/pipeline", { person: null }))?.status).toBe(401);
    const denied = await serve("/settings");
    expect(denied?.status).toBe(403);
    expect(await denied?.text()).not.toContain("fgt.");
    expect((await serve("/settings", { person: { ...ely, roles: ["boss"] } }))?.status).toBe(200);
    expect((await serve("/unbuilt"))?.status).toBe(404);
  });

  it("serves the page with the person, what they hold and a token for this tool only", async () => {
    const response = (await serve("/pipeline"))!;
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/html");
    expect(response.headers.get("cache-control")).toBe("no-store");
    const html = await response.clone().text();
    expect(html).toContain('<script type="module" src="/t/crm/_f/views/pipeline.js"></script>');

    const bootstrap = await bootstrapOf(response);
    expect(bootstrap).toMatchObject({
      workspace: "acme",
      tool: "crm",
      view: "pipeline",
      base: "/t/crm",
      user: ely,
      grants: ["read"],
      expiresAt: now.getTime() / 1000 + VIEW_TOKEN_TTL_SECONDS,
    });
    expect(await verifyToken(bootstrap.token, { secret, now })).toMatchObject({
      ok: true,
      claims: { sub: "u1", aud: "acme/crm", exp: bootstrap.expiresAt },
    });
    expect(await verifyToken(bootstrap.token, { secret, now, audience: "acme/odoo" })).toEqual({
      ok: false,
      reason: "audience",
    });
    // Short-lived.
    expect(
      await verifyToken(bootstrap.token, {
        secret,
        now: new Date(now.getTime() + VIEW_TOKEN_TTL_SECONDS * 1000),
      }),
    ).toEqual({ ok: false, reason: "expired" });
  });

  it("cannot be broken out of by what the person is called", async () => {
    const hostile = { ...ely, name: '</script><script>alert("x")</script>' };
    const html = await (await serve("/pipeline", { person: hostile }))!.text();
    expect(html.match(/<\/script>/g)).toHaveLength(2);
    expect(await bootstrapOf(new Response(html))).toMatchObject({ user: { name: hostile.name } });
  });

  it("serves built files without asking who is there, for a page with an opaque origin", async () => {
    const response = (await serve("/_f/views/pipeline.js", { person: null }))!;
    expect(response.status).toBe(200);
    expect(await response.text()).toBe("export default {};");
    expect(response.headers.get("content-type")).toBe("text/javascript");
    expect(response.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("does not let a path leave the views", async () => {
    const read = vi.fn<ViewAssets["read"]>(assets.read);
    for (const path of [
      "/_f/views//x.js",
      "/_f/views/a%5Cb.js",
      "/_f/views/a%2F..%2Fb.js",
      "/_f/views/%E0",
    ]) {
      const response = await serveView(new Request(`https://acme.forgeron.app${path}`), {
        secret,
        now,
        workspace: "acme",
        tool: "crm",
        manifest,
        person: ely,
        assets: { read },
      });
      expect(response?.status).toBe(404);
    }
    expect(read).not.toHaveBeenCalled();
  });
});

// The page's hooks, with the token it was given, against the runtimes of two tools of the workspace.
describe("the token of a view", () => {
  const action = {
    description: "List.",
    access: "read",
    input: { type: "object" },
    confirm: false,
    cli: { args: [] },
    http: { method: "GET" },
    interfaces: ["mcp", "api", "cli", "web"],
  };
  const toolManifest = (name: string) =>
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
  const toolRuntime = (tool: string) =>
    createRuntime({
      manifest: toolManifest(tool),
      actions: {
        "deals.list": {
          input: { safeParse: (data: unknown) => ({ success: true, data }) },
          run: () => ({ tool }),
        },
      },
      audience: audienceOf("acme", tool),
      authenticate: tokenAuthenticator({
        secret,
        now: () => now,
        resolvePerson: (id) => (id === "u1" ? ely : undefined),
      }),
    });

  const pageToken = async () => bootstrapOf((await serve("/pipeline"))!);
  const hooksOf = (bootstrap: ViewBootstrap, tool: string, at = now) =>
    createHttpRuntime(bootstrap, {
      params: createMemoryParams(),
      now: () => at,
      // The browser would send this to `https://acme.forgeron.app/t/<tool>/…`; the dispatcher
      // strips the prefix, which is done here.
      fetch: (url, init) =>
        toolRuntime(tool).fetch(
          new Request(url.replace("/t/crm", "").replace(/^/, "https://acme.forgeron.app"), init),
        ),
    });

  it("is what the hooks call their tool with", async () => {
    const bootstrap = await pageToken();
    const runtime = hooksOf(bootstrap, "crm");
    expect(await runtime.call("deals.list", {})).toEqual({ tool: "crm" });
    expect(runtime.user).toEqual(ely);
    expect(runtime.can("read")).toBe(true);
    expect(runtime.can("admin")).toBe(false);
  });

  it("is refused by the API and by the views endpoint of another tool", async () => {
    const bootstrap = await pageToken();
    await expect(hooksOf(bootstrap, "odoo").call("deals.list", {})).rejects.toThrow(
      'not issued for "acme/odoo"',
    );
    const api = await toolRuntime("odoo").fetch(
      new Request("https://acme.forgeron.app/api/deals.list", {
        headers: { authorization: `Bearer ${bootstrap.token}` },
      }),
    );
    expect(api.status).toBe(403);
  });

  it("stops being used by the hooks when it expires (the server checks `exp` itself, see tokens.test.ts)", async () => {
    const bootstrap = await pageToken();
    const after = new Date(bootstrap.expiresAt * 1000);
    const send = vi.fn<() => Promise<Response>>();
    const runtime = createHttpRuntime(bootstrap, {
      params: createMemoryParams(),
      now: () => after,
      fetch: send,
    });
    await expect(runtime.call("deals.list", {})).rejects.toThrow("expired");
    expect(send).not.toHaveBeenCalled();
  });
});
