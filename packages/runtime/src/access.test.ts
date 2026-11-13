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
  profiles: {
    reader: { grants: ["read"] },
    support: { grants: ["read", "write"] },
    manager: { grants: ["admin"] },
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
  events: {},
  resources: { network: { allow: ["*.odoo.com", "odoo.acme.fr"], why: "Odoo API" } },
  uses: {},
  preview: { data: "seed" },
};

const run = vi.fn<(interfaceName: string) => void>();
const actions: Record<string, RuntimeAction> = Object.fromEntries(
  Object.keys(manifest.actions).map((name) => [
    name,
    {
      input: z.object({}).passthrough(),
      run: (ctx: { interface: string }) => {
        run(ctx.interface);
        return { ran: name };
      },
    } satisfies RuntimeAction,
  ]),
);

const user = (subjects: string[], rest: Partial<User> = {}): User => ({
  id: "u1",
  email: "ely@acme.fr",
  name: "Ely",
  subjects,
  ...rest,
});
// A person with the permissions the gateway gave each of their subjects (D-137).
const given = (permissions: Record<string, string[]>): User =>
  user(Object.keys(permissions), { permissions });
const reader = given({ everyone: ["read"] });
const support = given({ everyone: ["read"], "team:support": ["read", "write"] });
const people: Record<string, User> = {
  reader,
  support,
  admin: given({ everyone: ["admin"] }),
  nobody: user([]),
  // What was set in the console, forwarded with the subjects (no new version).
  readerMayReply: { ...reader, access: { everyone: { "tickets.reply": true } } },
  supportMayNotReply: { ...support, access: { "team:support": { "tickets.reply": false } } },
  // The override of a subject the person is not part of changes nothing for them.
  readerOtherSubject: { ...reader, access: { "team:support": { "tickets.reply": true } } },
  // One subject refused by the console, another that may by level: the person may.
  twoSubjects: {
    ...support,
    access: { "team:support": { "tickets.reply": false }, everyone: { "tickets.reply": true } },
  },
  // D-137: what the gateway gave the person's subjects in this tool.
  mappedSupport: given({ everyone: [], "team:sales": ["read", "write"] }),
  // A team named like a profile, given nothing: the name gives nothing.
  unmappedReader: given({ everyone: [], "team:reader": [] }),
  // Without the gateway, `everyone` is read with the default grants: the profile with the fewest
  // permissions here (`reader`, first of the one-permission profiles).
  everyone: user(["everyone"]),
  // And the admin team with every permission.
  adminTeam: user(["everyone", "team:admin"]),
};
const bearer = (request: Request) => request.headers.get("authorization")?.slice(7);

const build = (overrides: Partial<Parameters<typeof createRuntime>[0]> = {}) =>
  createRuntime({
    manifest,
    actions,
    authenticate: (request) => people[bearer(request) ?? ""],
    ...overrides,
  });

const headers = (as: string) => ({ authorization: `Bearer ${as}` });
const runtime = build();

// One call on one interface; returns whether the action ran (the CLI executes through the API).
async function attempt(as: string, via: "mcp" | "api" | "web", name: string): Promise<boolean> {
  const before = run.mock.calls.length;
  let status: number;
  let refusal = "FORBIDDEN";
  if (via === "mcp") {
    const response = await runtime.fetch(
      new Request("https://tool.test/mcp", {
        method: "POST",
        headers: headers(as),
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: { name: toolName(manifest.name, name), arguments: {} },
        }),
      }),
    );
    const body = (await response.json()) as {
      result?: { isError: boolean; content: { text: string }[] };
    };
    const refused = body.result?.isError ?? false;
    // A refusal through MCP is always the FORBIDDEN of the shared check, never another failure.
    refusal = refused ? (body.result?.content[0]?.text ?? "") : "FORBIDDEN";
    status = refused ? 403 : 200;
  } else {
    const path = via === "api" ? `/api/${name}` : `/_f/call/${name}`;
    const response = await runtime.fetch(
      new Request(`https://tool.test${path}`, {
        method: via === "api" ? manifest.actions[name]!.http.method : "POST",
        headers: headers(as),
        body: via === "api" && manifest.actions[name]!.http.method === "GET" ? undefined : "{}",
      }),
    );
    status = response.status;
  }
  expect(refusal.startsWith("FORBIDDEN")).toBe(true);
  const ran = run.mock.calls.length > before;
  expect(ran).toBe(status === 200);
  return ran;
}

describe("the permissions given to subjects in the tool (D-137)", () => {
  it("reads the permissions the gateway gave, on every interface", async () => {
    for (const via of ["mcp", "api", "web"] as const) {
      expect(await attempt("mappedSupport", via, "tickets.reply")).toBe(true);
      expect(await attempt("unmappedReader", via, "tickets.list")).toBe(false);
    }
  });

  it("reads a subject with the default grants when no gateway gave any", async () => {
    expect(await attempt("everyone", "api", "tickets.list")).toBe(true);
    expect(await attempt("everyone", "api", "tickets.reply")).toBe(false);
    expect(await attempt("adminTeam", "api", "tickets.reply")).toBe(true);
    expect(await attempt("adminTeam", "mcp", "admin.purge")).toBe(true);
  });
});

describe("the subjects × actions matrix set in the console", () => {
  it("allows a subject an action its levels do not give, on every interface", async () => {
    for (const via of ["mcp", "api", "web"] as const) {
      expect(await attempt("readerMayReply", via, "tickets.reply")).toBe(true);
      // Only that cell changed: the same subject still cannot do what it was never given.
      expect(await attempt("readerMayReply", via, "tickets.crash")).toBe(true);
    }
  });

  it("refuses a subject an action its levels give, on every interface", async () => {
    for (const via of ["mcp", "api", "web"] as const) {
      expect(await attempt("supportMayNotReply", via, "tickets.reply")).toBe(false);
      expect(await attempt("supportMayNotReply", via, "tickets.list")).toBe(true);
    }
  });

  it("ignores the override of a subject the person is not part of", async () => {
    expect(await attempt("readerOtherSubject", "api", "tickets.reply")).toBe(false);
  });

  it("lets the person do what any of their subjects may", async () => {
    expect(await attempt("twoSubjects", "api", "tickets.reply")).toBe(true);
  });

  it("lists on MCP only the actions the matrix allows", async () => {
    const names = async (as: string) => {
      const response = await runtime.fetch(
        new Request("https://tool.test/mcp", {
          method: "POST",
          headers: headers(as),
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
        }),
      );
      const body = (await response.json()) as { result: { tools: { name: string }[] } };
      return body.result.tools.map((t) => t.name);
    };
    expect(await names("readerMayReply")).toContain(toolName(manifest.name, "tickets.reply"));
    expect(await names("reader")).not.toContain(toolName(manifest.name, "tickets.reply"));
    expect(await names("supportMayNotReply")).not.toContain(
      toolName(manifest.name, "tickets.reply"),
    );
  });
});

describe("access on every interface", () => {
  const exposedOn = (via: "mcp" | "api" | "web") =>
    Object.keys(manifest.actions).filter((name) =>
      manifest.actions[name]!.interfaces.includes(via),
    );

  it("gives every person the same answer on MCP, API and Web", async () => {
    for (const as of Object.keys(people)) {
      for (const name of Object.keys(manifest.actions)) {
        const answers = new Map<string, boolean>();
        for (const via of ["mcp", "api", "web"] as const) {
          if (exposedOn(via).includes(name)) answers.set(via, await attempt(as, via, name));
        }
        expect({ call: `${as} on ${name}`, distinct: new Set(answers.values()).size }).toEqual({
          call: `${as} on ${name}`,
          distinct: 1,
        });
      }
    }
  });

  it("refuses by access level: reader reads only, support writes, admin does not read", async () => {
    expect(await attempt("reader", "api", "tickets.list")).toBe(true);
    expect(await attempt("reader", "api", "tickets.reply")).toBe(false);
    expect(await attempt("reader", "mcp", "tickets.reply")).toBe(false);
    expect(await attempt("reader", "web", "tickets.reply")).toBe(false);
    expect(await attempt("support", "mcp", "tickets.reply")).toBe(true);
    expect(await attempt("nobody", "mcp", "tickets.list")).toBe(false);
    expect(await attempt("admin", "api", "tickets.list")).toBe(false);
  });

  it("lists to Claude only what the same person may call through the API", async () => {
    for (const as of Object.keys(people)) {
      const response = await runtime.fetch(
        new Request("https://tool.test/mcp", {
          method: "POST",
          headers: headers(as),
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
        }),
      );
      const { result } = (await response.json()) as { result: { tools: { name: string }[] } };
      const listed = result.tools.map((tool) => tool.name).sort();
      const callable: string[] = [];
      for (const name of exposedOn("mcp")) {
        if (await attempt(as, "mcp", name)) callable.push(toolName(manifest.name, name));
      }
      expect({ as, listed }).toEqual({ as, listed: callable.sort() });
    }
  });

  it("tells the action which interface called it, and checks access first on each", async () => {
    run.mockClear();
    await attempt("support", "mcp", "tickets.reply");
    await attempt("support", "api", "tickets.reply");
    await attempt("support", "web", "tickets.reply");
    expect(run.mock.calls.map(([via]) => via)).toEqual(["mcp", "api", "web"]);
  });

  it("applies the same check to calls from jobs and other tools (invoke)", async () => {
    const refused = await runtime.invoke(people.reader!, "tickets.reply", {});
    expect(refused).toMatchObject({ ok: false, error: { code: "FORBIDDEN" } });
    expect(await runtime.invoke(people.support!, "tickets.reply", {})).toMatchObject({ ok: true });
  });

  it("serves the CLI manifest to a person only what the API would let them call", async () => {
    // The CLI executes through /api: its manifest is public to signed-in callers, the call is not.
    const response = await runtime.fetch(
      new Request("https://tool.test/cli", { headers: headers("reader") }),
    );
    expect(response.status).toBe(200);
    expect(await attempt("reader", "api", "tickets.reply")).toBe(false);
  });
});

describe("token audience", () => {
  const audienceOf = (as: string, audience: string | undefined) => (request: Request) => {
    const person = people[bearer(request) ?? ""];
    return person && audience !== undefined ? { user: person, audience } : person;
  };
  const tool = (audience: string | undefined) =>
    build({ audience: "acme/crm", authenticate: audienceOf("support", audience) });
  const paths = [
    ["api", "/api/tickets.list", "GET"],
    ["web", "/_f/call/tickets.list", "POST"],
    ["cli", "/cli", "GET"],
    ["mcp", "/mcp", "POST"],
  ] as const;

  for (const [name, path, method] of paths) {
    it(`accepts a token for acme/crm and refuses another tool's on ${name}`, async () => {
      const send = (audience: string | undefined) =>
        tool(audience).fetch(
          new Request(`https://tool.test${path}`, {
            method,
            headers: headers("support"),
            body:
              method === "POST"
                ? JSON.stringify({ jsonrpc: "2.0", id: 1, method: "ping" })
                : undefined,
          }),
        );
      expect((await send("acme/crm")).status).toBe(200);
      for (const wrong of ["acme/odoo", "other/crm", "acme/crm2", undefined]) {
        const response = await send(wrong);
        expect({ wrong: String(wrong), status: response.status }).toEqual({
          wrong: String(wrong),
          status: 403,
        });
        expect(await response.json()).toMatchObject({ error: { code: "FORBIDDEN" } });
      }
    });
  }

  it("does not run the action for a token of another audience", async () => {
    run.mockClear();
    const response = await tool("acme/odoo").fetch(
      new Request("https://tool.test/api/tickets.list", { headers: headers("support") }),
    );
    expect(response.status).toBe(403);
    expect(run).not.toHaveBeenCalled();
  });

  it("answers 401 before the audience when nobody signed", async () => {
    const response = await tool("acme/crm").fetch(
      new Request("https://tool.test/api/tickets.list"),
    );
    expect(response.status).toBe(401);
  });

  it("checks no audience when the tool declares none", async () => {
    const response = await build({ authenticate: audienceOf("support", "acme/odoo") }).fetch(
      new Request("https://tool.test/api/tickets.list", { headers: headers("support") }),
    );
    expect(response.status).toBe(200);
  });
});
