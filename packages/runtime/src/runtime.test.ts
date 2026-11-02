import type { Manifest } from "@forgeron/manifest";
import { describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { createRuntime, toolName, type RuntimeAction, type User } from "./index";

const ALL = ["mcp", "api", "cli", "web"] as const;

const action = (
  access: string,
  method: "GET" | "POST",
  input: object,
  extra: Partial<Manifest["actions"][string]> = {},
): Manifest["actions"][string] => ({
  description: `Action with ${access} access.`,
  access,
  input: { type: "object", ...input },
  confirm: false,
  cli: { args: [] },
  http: { method },
  interfaces: [...ALL],
  ...extra,
});

const manifest: Manifest = {
  name: "odoo-gateway",
  version: "1.0.0",
  title: "Odoo gateway",
  description: "Odoo tickets.",
  interfaces: { mcp: true, api: true, cli: true, web: true },
  roles: {
    reader: { grants: ["read"] },
    support: { grants: ["read", "write"] },
    admin: { grants: ["admin"] },
  },
  actions: {
    "tickets.list": action(
      "read",
      "GET",
      {
        properties: {
          stage: { type: "string", description: "Stage name" },
          maxResults: { type: "integer", default: 20 },
        },
      },
      { output: { type: "object", properties: { count: { type: "integer" } } } },
    ),
    "tickets.reply": action(
      "write",
      "POST",
      {
        properties: { id: { type: "integer" }, message: { type: "string" } },
        required: ["id", "message"],
      },
      { confirm: true, cli: { args: ["id", "message"] } },
    ),
    "tickets.fail": action("read", "GET", { properties: {} }),
    "tickets.deny": action("read", "GET", { properties: {} }),
    "tickets.crash": action("read", "GET", { properties: {} }),
    "tickets.fetch": action("read", "POST", { properties: { url: { type: "string" } } }),
    "tickets.whoami": action("read", "GET", { properties: {} }),
    "tickets.throw": action("read", "POST", { properties: { code: { type: "string" } } }),
    "tickets.ctx": action("read", "GET", { properties: {} }),
    "admin.purge": action("admin", "POST", { properties: {} }, { interfaces: ["mcp"] }),
  },
  views: {},
  jobs: {},
  resources: { network: { allow: ["*.odoo.com", "odoo.acme.fr"], why: "Odoo API" } },
  uses: {},
  preview: { data: "seed" },
};

class ToolError extends Error {
  override name = "ToolError";
  constructor(
    readonly code: string,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
  }
}

type LogFn = (message: string, data?: unknown) => void;

const log = {
  info: vi.fn<(message: string, data?: unknown) => void>(),
  warn: vi.fn<(message: string, data?: unknown) => void>(),
  error: vi.fn<(message: string, data?: unknown) => void>(),
};

const actions: Record<string, RuntimeAction> = {
  "tickets.list": {
    input: z.object({ stage: z.string().optional(), maxResults: z.coerce.number().default(20) }),
    output: z.object({ count: z.number() }),
    run: (ctx) => ({ count: (ctx.input as { maxResults: number }).maxResults, secret: "stripped" }),
  },
  "tickets.reply": {
    input: z.object({ id: z.number().int(), message: z.string().min(1) }),
    run: (ctx) => ({ replied: (ctx.input as { id: number }).id }),
  },
  "tickets.fail": {
    input: z.object({}),
    run: () => {
      throw new ToolError("UPSTREAM", "Odoo is down", { status: 503 });
    },
  },
  "tickets.deny": {
    input: z.object({}),
    run: () => {
      throw new ToolError("FORBIDDEN", "Odoo says no");
    },
  },
  "tickets.crash": {
    input: z.object({}),
    run: () => {
      throw new Error("password=hunter2 leaked in a stack trace");
    },
  },
  "tickets.fetch": {
    input: z.object({ url: z.string() }),
    run: async (ctx) => {
      const res = await ctx.fetch((ctx.input as { url: string }).url);
      return { status: res.status };
    },
  },
  "tickets.whoami": {
    input: z.object({}),
    run: (ctx) => ({
      id: ctx.user.id,
      via: ctx.interface,
      env: ctx.env,
      canWrite: ctx.can("write"),
    }),
  },
  "tickets.throw": {
    input: z.object({ code: z.string() }),
    run: (ctx) => {
      throw new ToolError(
        (ctx.input as { code: string }).code,
        `It is ${(ctx.input as { code: string }).code}.`,
      );
    },
  },
  "tickets.ctx": {
    input: z.object({}),
    run: async (ctx) => {
      ctx.log.info("hello", { a: 1 });
      await ctx.emit("thing.done", { id: 1 });
      return { now: ctx.now().toISOString() };
    },
  },
  "admin.purge": { input: z.object({}), run: () => ({ purged: true }) },
};

const user = (roles: string[]): User => ({ id: "u1", email: "ely@acme.fr", name: "Ely", roles });
const bearer = (request: Request) => request.headers.get("authorization")?.slice(7);
const people: Record<string, User> = {
  reader: user(["reader"]),
  support: user(["support"]),
  admin: user(["support", "admin"]),
  nobody: user([]),
};

function build(overrides: Partial<Parameters<typeof createRuntime>[0]> = {}) {
  return createRuntime({
    manifest,
    actions,
    authenticate: (request) => people[bearer(request) ?? ""],
    platform: {
      log,
      fetch: async () => ({ ok: true, status: 200, json: async () => ({}), text: async () => "" }),
    },
    ...overrides,
  });
}

const call = (as: string | undefined, path: string, init: RequestInit = {}) =>
  build().fetch(
    new Request(`https://tool.test${path}`, {
      ...init,
      headers: { ...(as ? { authorization: `Bearer ${as}` } : {}), ...init.headers },
    }),
  );

const post = (as: string | undefined, path: string, body: unknown) =>
  call(as, path, { method: "POST", body: JSON.stringify(body) });

describe("createRuntime", () => {
  it("fails at startup when the manifest declares an action with no code", () => {
    const { "tickets.list": _, ...rest } = actions;
    expect(() => build({ actions: rest })).toThrow(/"tickets.list" but no code/);
  });

  it("answers 401 to a call nobody signed", async () => {
    const response = await call(undefined, "/api/tickets.list");
    expect(response.status).toBe(401);
    expect(await response.json()).toMatchObject({ error: { code: "UNAUTHENTICATED" } });
  });

  it("answers 404 to a path that is not an interface", async () => {
    expect((await call("reader", "/nothing")).status).toBe(404);
  });

  it("does not serve an interface the tool turned off", async () => {
    const off = { ...manifest, interfaces: { ...manifest.interfaces, mcp: false, web: false } };
    const runtime = build({ manifest: off });
    const ask = (path: string) =>
      runtime.fetch(
        new Request(`https://tool.test${path}`, {
          method: "POST",
          headers: { authorization: "Bearer support" },
          body: "{}",
        }),
      );
    expect((await ask("/mcp")).status).toBe(404);
    expect((await ask("/_f/call/tickets.reply")).status).toBe(404);
  });
});

describe("API", () => {
  it("runs a read action over GET, with the query string as input", async () => {
    const response = await call("reader", "/api/tickets.list?maxResults=5");
    expect(response.status).toBe(200);
    // The output schema strips what it does not declare.
    expect(await response.json()).toEqual({ count: 5 });
  });

  it("runs a write action over POST, with a JSON body", async () => {
    const response = await post("support", "/api/tickets.reply", { id: 7, message: "Hello" });
    expect(await response.json()).toEqual({ replied: 7 });
  });

  it("checks the access level before anything else", async () => {
    // Even an invalid input gets a 403: a refused person learns nothing about the input.
    const response = await post("reader", "/api/tickets.reply", { nonsense: true });
    expect(response.status).toBe(403);
    expect(await response.json()).toMatchObject({ error: { code: "FORBIDDEN" } });
  });

  it("refuses a person with no role", async () => {
    expect((await call("nobody", "/api/tickets.list")).status).toBe(403);
  });

  it("rejects an invalid input with the issues", async () => {
    const response = await post("support", "/api/tickets.reply", { id: "x", message: "" });
    expect(response.status).toBe(400);
    const { error } = (await response.json()) as { error: { code: string; details: unknown[] } };
    expect(error.code).toBe("INVALID");
    expect(error.details).toHaveLength(2);
  });

  it("rejects a body that is not JSON", async () => {
    const response = await call("support", "/api/tickets.reply", { method: "POST", body: "{" });
    expect(response.status).toBe(400);
  });

  it("answers 405 with the right method when it differs", async () => {
    const response = await call("support", "/api/tickets.reply");
    expect(response.status).toBe(405);
    expect(response.headers.get("allow")).toBe("POST");
  });

  it("answers 404 to an unknown action and to one hidden from the API", async () => {
    expect((await call("admin", "/api/tickets.nope")).status).toBe(404);
    expect((await post("admin", "/api/admin.purge", {})).status).toBe(404);
  });

  it.each([
    ["tickets.fail", 502, "UPSTREAM"],
    ["tickets.deny", 403, "FORBIDDEN"],
  ])("maps the ToolError of %s to HTTP %i", async (name, status, code) => {
    const response = await call("reader", `/api/${name}`);
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ error: { code } });
  });

  it("keeps the details of a ToolError", async () => {
    const body = (await (await call("reader", "/api/tickets.fail")).json()) as {
      error: { details: unknown };
    };
    expect(body.error.details).toEqual({ status: 503 });
  });

  it("hides an unexpected exception behind a generic 500", async () => {
    log.error.mockClear();
    const response = await call("reader", "/api/tickets.crash");
    expect(response.status).toBe(500);
    const text = await response.text();
    expect(text).not.toContain("hunter2");
    expect(JSON.parse(text)).toEqual({ error: { code: "INTERNAL", message: "Internal error." } });
    expect(log.error).toHaveBeenCalled();
  });

  it("builds the context from the call", async () => {
    const response = await call("support", "/api/tickets.whoami");
    expect(await response.json()).toEqual({
      id: "u1",
      via: "api",
      env: "local",
      canWrite: true,
    });
  });
});

describe("outbound calls", () => {
  const fetchOf = (url: string) => post("reader", "/api/tickets.fetch", { url });

  it.each(["https://acme.odoo.com/jsonrpc", "https://odoo.acme.fr/x", "https://ACME.ODOO.COM/x"])(
    "lets through %s",
    async (url) => {
      expect(await (await fetchOf(url)).json()).toEqual({ status: 200 });
    },
  );

  it.each(["https://evil.example.com/", "https://odoo.com/", "https://acme.odoo.com.evil.io/"])(
    "refuses %s: nothing is allowed by default",
    async (url) => {
      const response = await fetchOf(url);
      expect(response.status).toBe(403);
      expect(await response.json()).toMatchObject({ error: { code: "FORBIDDEN" } });
    },
  );
});

describe("MCP", () => {
  const rpc = (as: string, message: unknown) => post(as, "/mcp", message);
  const result = async (response: Response) =>
    ((await response.json()) as { result: Record<string, unknown> }).result;

  it("initializes with the version the client asked for", async () => {
    const init = await result(
      await rpc("reader", {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "2025-03-26" },
      }),
    );
    expect(init).toMatchObject({
      protocolVersion: "2025-03-26",
      capabilities: { tools: {} },
      serverInfo: { name: "odoo-gateway", version: "1.0.0" },
    });
  });

  it("falls back to the latest version it supports", async () => {
    const init = await result(
      await rpc("reader", {
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: { protocolVersion: "1999-01-01" },
      }),
    );
    expect(init.protocolVersion).toBe("2025-06-18");
  });

  it("names tools <tool>_<group>_<verb>", () => {
    expect(toolName("crm", "deals.move")).toBe("crm_deals_move");
  });

  it("lists only the tools the person may call", async () => {
    const list = async (as: string) => {
      const { tools } = (await result(
        await rpc(as, { jsonrpc: "2.0", id: 1, method: "tools/list" }),
      )) as { tools: Array<{ name: string }> };
      return tools.map((t) => t.name);
    };
    const reader = await list("reader");
    expect(reader).toContain("odoo-gateway_tickets_list");
    expect(reader).not.toContain("odoo-gateway_tickets_reply");
    expect(await list("support")).toContain("odoo-gateway_tickets_reply");
    expect(await list("admin")).toContain("odoo-gateway_admin_purge");
    expect(await list("nobody")).toEqual([]);
  });

  it("describes a tool with its schema and annotations", async () => {
    const { tools } = (await result(
      await rpc("support", { jsonrpc: "2.0", id: 1, method: "tools/list" }),
    )) as { tools: Array<Record<string, unknown>> };
    const reply = tools.find((t) => t.name === "odoo-gateway_tickets_reply");
    expect(reply).toMatchObject({
      description: "Action with write access.",
      inputSchema: { type: "object", required: ["id", "message"] },
      annotations: { readOnlyHint: false, destructiveHint: true },
    });
    const list = tools.find((t) => t.name === "odoo-gateway_tickets_list");
    expect(list).toMatchObject({
      outputSchema: { type: "object" },
      annotations: { readOnlyHint: true, destructiveHint: false },
    });
  });

  it("calls a tool and returns the result as text and structured content", async () => {
    const out = await result(
      await rpc("support", {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: { name: "odoo-gateway_tickets_reply", arguments: { id: 3, message: "Hi" } },
      }),
    );
    expect(out).toEqual({
      content: [{ type: "text", text: '{"replied":3}' }],
      structuredContent: { replied: 3 },
      isError: false,
    });
  });

  it("reports an action failure inside the result, not as a protocol error", async () => {
    const out = await result(
      await rpc("reader", {
        jsonrpc: "2.0",
        id: 3,
        method: "tools/call",
        params: { name: "odoo-gateway_tickets_reply", arguments: { id: 3, message: "Hi" } },
      }),
    );
    expect(out).toMatchObject({ isError: true });
    expect(JSON.stringify(out)).toContain("FORBIDDEN");
  });

  it("refuses an unknown tool with a protocol error", async () => {
    const body = (await (
      await rpc("support", {
        jsonrpc: "2.0",
        id: 4,
        method: "tools/call",
        params: { name: "nope" },
      })
    ).json()) as { error: { code: number } };
    expect(body.error.code).toBe(-32602);
  });

  it("gives a notification no answer", async () => {
    const response = await rpc("reader", { jsonrpc: "2.0", method: "notifications/initialized" });
    expect(response.status).toBe(202);
  });

  it("answers a batch", async () => {
    const response = await rpc("reader", [
      { jsonrpc: "2.0", id: 1, method: "ping" },
      { jsonrpc: "2.0", method: "notifications/initialized" },
    ]);
    expect(await response.json()).toEqual([{ jsonrpc: "2.0", id: 1, result: {} }]);
  });

  it("rejects a malformed message", async () => {
    const response = await call("reader", "/mcp", { method: "POST", body: "{" });
    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: { code: -32700 } });
    const unknown = await rpc("reader", { jsonrpc: "2.0", id: 9, method: "nope" });
    expect(await unknown.json()).toMatchObject({ error: { code: -32601 } });
  });

  it("does not open a stream on GET", async () => {
    expect((await call("reader", "/mcp")).status).toBe(405);
  });

  it("runs the action with the MCP interface in its context", async () => {
    const out = await result(
      await rpc("support", {
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: { name: "odoo-gateway_tickets_whoami" },
      }),
    );
    expect(out.structuredContent).toMatchObject({ via: "mcp" });
  });
});

describe("CLI", () => {
  const commands = async (as: string) =>
    ((await (await call(as, "/cli")).json()) as { commands: Array<Record<string, unknown>> })
      .commands;

  it("serves the command manifest", async () => {
    const body = await (await call("support", "/cli")).json();
    expect(body).toMatchObject({ tool: "odoo-gateway", version: "1.0.0", title: "Odoo gateway" });
  });

  it("turns cli.args into arguments and the other fields into options", async () => {
    const reply = (await commands("support")).find((c) => c.action === "tickets.reply");
    expect(reply).toMatchObject({
      path: ["tickets", "reply"],
      confirm: true,
      args: [
        { name: "id", type: "integer", required: true },
        { name: "message", type: "string", required: true },
      ],
      options: [],
    });
    const list = (await commands("support")).find((c) => c.action === "tickets.list");
    expect(list).toMatchObject({
      args: [],
      options: [
        { name: "stage", flag: "--stage", type: "string", description: "Stage name" },
        { name: "maxResults", flag: "--max-results", type: "integer", default: 20 },
      ],
    });
  });

  it("lists only the commands the person may run, and none hidden from the CLI", async () => {
    const names = async (as: string) => (await commands(as)).map((c) => c.action);
    expect(await names("reader")).not.toContain("tickets.reply");
    expect(await names("admin")).not.toContain("admin.purge");
  });

  it("shows a help page to a browser", async () => {
    const response = await call("reader", "/cli", { headers: { accept: "text/html" } });
    expect(response.headers.get("content-type")).toContain("text/html");
    const html = await response.text();
    expect(html).toContain("forgeron odoo-gateway tickets list");
    expect(html).toContain("forgeron login");
  });
});

describe("Web", () => {
  it("serves the actions to the views, through the web interface", async () => {
    const response = await post("support", "/_f/call/tickets.whoami", {});
    expect(await response.json()).toMatchObject({ via: "web" });
  });

  it("checks access there too", async () => {
    const response = await post("reader", "/_f/call/tickets.reply", { id: 1, message: "x" });
    expect(response.status).toBe(403);
  });

  it("only takes POST", async () => {
    expect((await call("reader", "/_f/call/tickets.whoami")).status).toBe(405);
  });
});

describe("hiding an action from an interface", () => {
  it("keeps it out of the other interfaces, and of the context of the others", async () => {
    const hidden = {
      ...manifest,
      actions: {
        ...manifest.actions,
        "tickets.list": { ...manifest.actions["tickets.list"]!, interfaces: ["mcp" as const] },
      },
    };
    const runtime = build({ manifest: hidden });
    const api = await runtime.fetch(
      new Request("https://tool.test/api/tickets.list", {
        headers: { authorization: "Bearer reader" },
      }),
    );
    expect(api.status).toBe(404);
  });
});

describe("invoke", () => {
  const runtime = build();

  it("runs an action for a person, whatever the interfaces of the tool", async () => {
    // `admin.purge` is only on MCP, `tickets.list` is on every interface: neither is hidden.
    const outcome = await runtime.invoke(people.admin!, "admin.purge");
    expect(outcome).toEqual({ ok: true, result: { purged: true } });
  });

  it("still checks access and validation", async () => {
    expect(
      await runtime.invoke(people.reader!, "tickets.reply", { id: 1, message: "x" }),
    ).toMatchObject({
      ok: false,
      error: { code: "FORBIDDEN" },
    });
    expect(await runtime.invoke(people.support!, "tickets.reply", { id: "x" })).toMatchObject({
      ok: false,
      error: { code: "INVALID" },
    });
  });

  it("tells the action it was called by another tool, unless told otherwise", async () => {
    const asTool = await runtime.invoke(people.reader!, "tickets.whoami");
    expect(asTool).toMatchObject({ ok: true, result: { via: "tool" } });
    const asMcp = await runtime.invoke(people.reader!, "tickets.whoami", {}, "mcp");
    expect(asMcp).toMatchObject({ ok: true, result: { via: "mcp" } });
  });

  it("answers NOT_FOUND to an unknown action", async () => {
    expect(await runtime.invoke(people.admin!, "nope")).toMatchObject({
      ok: false,
      error: { code: "NOT_FOUND" },
    });
  });
});

describe("error codes", () => {
  // sdk.md §6: the same code, whichever interface the caller used.
  const table = [
    ["INVALID", 400, 2],
    ["FORBIDDEN", 403, 3],
    ["NOT_FOUND", 404, 4],
    ["CONFLICT", 409, 1],
    ["RATE_LIMITED", 429, 1],
    ["UPSTREAM", 502, 1],
  ] as const;

  it.each(table)("%s is HTTP %i over the API", async (code, status) => {
    const response = await post("reader", "/api/tickets.throw", { code });
    expect(response.status).toBe(status);
    expect(await response.json()).toMatchObject({ error: { code, message: `It is ${code}.` } });
  });

  it.each(table)("%s is a tool error over MCP, not a protocol error", async (code) => {
    const response = await post("reader", "/mcp", {
      jsonrpc: "2.0",
      id: 1,
      method: "tools/call",
      params: { name: "odoo-gateway_tickets_throw", arguments: { code } },
    });
    const body = (await response.json()) as {
      result: { isError: boolean; content: Array<{ text: string }> };
    };
    expect(response.status).toBe(200);
    expect(body.result.isError).toBe(true);
    expect(body.result.content[0]?.text).toBe(`${code}: It is ${code}.`);
  });

  it("tells the CLI which exit code each error code gets", async () => {
    const body = (await (await call("reader", "/cli")).json()) as {
      exitCodes: Record<string, number>;
    };
    expect(body.exitCodes).toEqual({
      INVALID: 2,
      FORBIDDEN: 3,
      NOT_FOUND: 4,
      CONFLICT: 1,
      RATE_LIMITED: 1,
      UPSTREAM: 1,
      INTERNAL: 1,
    });
    for (const [code, , exit] of table) expect(body.exitCodes[code]).toBe(exit);
  });

  it("refuses with FORBIDDEN before running the action, whatever the interface", async () => {
    const ran = vi.fn<() => void>();
    const guarded = { ...actions, "tickets.reply": { ...actions["tickets.reply"]!, run: ran } };
    const runtime = build({ actions: guarded });
    const response = await runtime.fetch(
      new Request("https://tool.test/api/tickets.reply", {
        method: "POST",
        headers: { authorization: "Bearer reader" },
        body: JSON.stringify({ id: 1, message: "x" }),
      }),
    );
    expect(response.status).toBe(403);
    expect(ran).not.toHaveBeenCalled();
  });
});

describe("ctx members", () => {
  it("emit, log and now come from the platform", async () => {
    const emit = vi.fn<(event: string, payload?: unknown) => void>();
    const info = vi.fn<(message: string, data?: unknown) => void>();
    const runtime = build({
      platform: {
        log: { info, warn: vi.fn<LogFn>(), error: vi.fn<LogFn>() },
        emit,
        now: () => new Date("2026-10-20T07:00:00Z"),
      },
    });
    const response = await runtime.fetch(
      new Request("https://tool.test/api/tickets.ctx", {
        headers: { authorization: "Bearer reader" },
      }),
    );
    expect(await response.json()).toEqual({ now: "2026-10-20T07:00:00.000Z" });
    expect(emit).toHaveBeenCalledWith("thing.done", { id: 1 });
    expect(info).toHaveBeenCalledWith("hello", { a: 1 });
  });

  it("logs an outbound call it refused", async () => {
    const warn = vi.fn<(message: string, data?: unknown) => void>();
    const runtime = build({
      platform: { log: { info: vi.fn<LogFn>(), warn, error: vi.fn<LogFn>() } },
    });
    const response = await runtime.fetch(
      new Request("https://tool.test/api/tickets.fetch", {
        method: "POST",
        headers: { authorization: "Bearer reader" },
        body: JSON.stringify({ url: "https://evil.example.com/x" }),
      }),
    );
    expect(response.status).toBe(403);
    expect(warn).toHaveBeenCalledWith(
      'Outbound calls to "evil.example.com" are not allowed by resources.network.',
      { url: "https://evil.example.com/x" },
    );
  });
});
