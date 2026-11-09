import type { Manifest } from "@forgeron/manifest";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { createRuntime, missingSetup, type User, type UserSecretStore } from "./index";

const ALL = ["mcp", "api", "cli", "web"] as const;
const manifest: Manifest = {
  name: "odoo-gateway",
  version: "1.0.0",
  title: "Odoo gateway",
  interfaces: { mcp: true, api: true, cli: true, web: true },
  roles: { reader: { grants: ["read"] } },
  actions: {
    "tickets.mine": {
      description: "My tickets.",
      access: "read",
      input: { type: "object", properties: {} },
      confirm: false,
      cli: { args: [] },
      http: { method: "GET" },
      interfaces: [...ALL],
    },
  },
  views: {},
  jobs: {},
  events: {},
  resources: {
    userSecrets: {
      ODOO_API_KEY: {
        label: "Odoo API key",
        help: "In your Odoo profile.",
        why: "Read your tickets",
      },
    },
  },
  uses: {},
  preview: { data: "seed" },
};

const ana: User = { id: "u1", email: "ana@acme.test", name: "Ana", roles: ["reader"] };
const ben: User = { id: "u2", email: "ben@acme.test", name: "Ben", roles: ["reader"] };

function setup() {
  const data = new Map<string, Record<string, string>>();
  const store: UserSecretStore = {
    read: async (user) => ({ ...data.get(user.id) }),
    write: async (user, name, value) =>
      void data.set(user.id, { ...data.get(user.id), [name]: value }),
  };
  let current = ana;
  let seen: unknown;
  const runtime = createRuntime({
    manifest,
    baseUrl: "https://acme.forgeron.test/t/odoo-gateway",
    authenticate: () => current,
    platform: { userSecretStore: store },
    actions: {
      "tickets.mine": {
        input: z.object({}),
        run: (ctx) => ((seen = ctx.userSecrets), { ok: true }),
      },
    },
  });
  return { runtime, data, as: (u: User) => (current = u), seen: () => seen };
}

const get = (path: string, headers: Record<string, string> = {}) =>
  new Request(`https://acme.forgeron.test${path}`, { headers });
const mcpCall = (version?: string) =>
  new Request("https://acme.forgeron.test/mcp", {
    method: "POST",
    ...(version ? { headers: { "mcp-protocol-version": version } } : {}),
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "odoo-gateway_tickets_mine", arguments: {} },
    }),
  });

describe("per-person secrets on first use", () => {
  it("API: 428 with the missing secret and an input link", async () => {
    const { runtime } = setup();
    const response = await runtime.fetch(get("/api/tickets.mine"));
    expect(response.status).toBe(428);
    const body = (await response.json()) as {
      error: {
        code: string;
        details: { inputUrl: string; missing: Array<{ name: string; label: string }> };
      };
    };
    expect(body.error.code).toBe("SECRET_REQUIRED");
    expect(body.error.details.inputUrl).toBe("https://acme.forgeron.test/t/odoo-gateway/secrets");
    expect(body.error.details.missing).toEqual([
      expect.objectContaining({ name: "ODOO_API_KEY", label: "Odoo API key" }),
    ]);
  });

  it("MCP: a tool error that carries the link", async () => {
    const { runtime } = setup();
    const answer = (await (await runtime.fetch(mcpCall())).json()) as {
      result: { isError: boolean; content: Array<{ text: string }> };
    };
    expect(answer.result.isError).toBe(true);
    expect(answer.result.content[0]!.text).toContain(
      "https://acme.forgeron.test/t/odoo-gateway/secrets",
    );
  });

  it("MCP 2025-11-25: URL elicitation, so the client opens the page and calls again", async () => {
    const { runtime } = setup();
    const answer = (await (await runtime.fetch(mcpCall("2025-11-25"))).json()) as {
      result?: unknown;
      error: {
        code: number;
        data: { elicitations: Array<{ mode: string; url: string; elicitationId: string }> };
      };
    };
    expect(answer.result).toBeUndefined();
    expect(answer.error.code).toBe(-32042);
    expect(answer.error.data.elicitations).toEqual([
      expect.objectContaining({
        mode: "url",
        url: "https://acme.forgeron.test/t/odoo-gateway/secrets",
        elicitationId: expect.any(String),
      }),
    ]);
  });

  it("MCP: once the secret is entered the same call succeeds", async () => {
    const { runtime, data } = setup();
    data.set("u1", { ODOO_API_KEY: "test-only-value" });
    const answer = (await (await runtime.fetch(mcpCall("2025-11-25"))).json()) as {
      result: { isError: boolean };
    };
    expect(answer.result.isError).toBe(false);
  });

  it("web and CLI input: the form stores the value, then the action sees it as ctx.userSecrets", async () => {
    const { runtime, data, seen } = setup();
    const page = await runtime.fetch(get("/secrets"));
    expect(page.status).toBe(200);
    const html = await page.text();
    expect(html).toContain('type="password"');
    expect(html).toContain("Odoo API key");

    const post = await runtime.fetch(
      new Request("https://acme.forgeron.test/secrets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ODOO_API_KEY: "test-only-value" }),
      }),
    );
    expect(await post.json()).toEqual({ saved: ["ODOO_API_KEY"] });
    expect(data.get("u1")).toEqual({ ODOO_API_KEY: "test-only-value" });

    expect((await runtime.fetch(get("/api/tickets.mine"))).status).toBe(200);
    expect(seen()).toEqual({ ODOO_API_KEY: "test-only-value" });
  });

  it("never shows a stored value back, and keeps each person's own", async () => {
    const { runtime, data, as, seen } = setup();
    data.set("u1", { ODOO_API_KEY: "ana-test-value" });
    expect(await (await runtime.fetch(get("/secrets"))).text()).not.toContain("ana-test-value");

    as(ben);
    expect((await runtime.fetch(get("/api/tickets.mine"))).status).toBe(428);
    as(ana);
    await runtime.fetch(get("/api/tickets.mine"));
    expect(seen()).toEqual({ ODOO_API_KEY: "ana-test-value" });
  });

  it("refuses an undeclared name, a cross-site post and an empty page for anonymous callers", async () => {
    const { runtime, data } = setup();
    const post = (body: unknown, headers: Record<string, string> = {}) =>
      runtime.fetch(
        new Request("https://acme.forgeron.test/secrets", {
          method: "POST",
          headers: { "content-type": "application/json", ...headers },
          body: JSON.stringify(body),
        }),
      );
    expect((await post({ OTHER: "x" })).status).toBe(400);
    expect((await post({ ODOO_API_KEY: "x" }, { origin: "https://evil.test" })).status).toBe(403);
    expect(data.size).toBe(0);
  });
});

describe("missingSetup (D-097)", () => {
  const withSetup: Manifest = {
    ...manifest,
    setup: {
      fields: {
        firstName: { type: "text", label: "First name", required: true },
        team: { type: "choice", label: "Team", required: false, options: ["a"] },
      },
    },
  };
  const secretNames = Object.keys(manifest.resources.userSecrets ?? {});

  it("lists the required fields with no value and the secrets that are not set", () => {
    expect(missingSetup(withSetup, { setup: {}, secrets: {} })).toEqual({
      fields: ["firstName"],
      secrets: secretNames,
    });
  });

  it("is empty once everything required is given; an optional field is never missing", () => {
    const given = Object.fromEntries(secretNames.map((n) => [n, "v"]));
    expect(missingSetup(withSetup, { setup: { firstName: "Ana" }, secrets: given })).toEqual({
      fields: [],
      secrets: [],
    });
  });

  it("asks nothing of a tool that declares nothing", () => {
    expect(missingSetup({ ...manifest, resources: {} }, { setup: {}, secrets: {} })).toEqual({
      fields: [],
      secrets: [],
    });
  });
});
