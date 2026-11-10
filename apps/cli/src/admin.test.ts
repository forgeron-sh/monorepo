import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { run } from "./cli";
import type { Io } from "./io";

// `forgeron admin` and `forgeron api` (D-112): the admin operations from a terminal, with the token of
// `forgeron login`, through the workspace's console API.

let server: Server;
let endpoint: string;
const requests: Array<{ method: string; path: string; authorization?: string; body: unknown }> = [];
const answers = new Map<string, { status: number; body?: unknown }>();

beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      const method = String(req.method);
      const path = String(req.url);
      requests.push({
        method,
        path,
        ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}),
        body: raw ? JSON.parse(raw) : undefined,
      });
      const answer = answers.get(`${method} ${path.split("?")[0]}`) ?? { status: 404, body: {} };
      res.statusCode = answer.status;
      res.end(answer.body === undefined ? "" : JSON.stringify(answer.body));
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise((resolve) => server.close(resolve)));

const dirs: string[] = [];
const saved = {
  config: process.env.XDG_CONFIG_HOME,
  token: process.env.FORGERON_TOKEN,
  endpoint: process.env.FORGERON_ENDPOINT,
};
afterEach(async () => {
  for (const [key, value] of [
    ["XDG_CONFIG_HOME", saved.config],
    ["FORGERON_TOKEN", saved.token],
    ["FORGERON_ENDPOINT", saved.endpoint],
  ] as const) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  requests.length = 0;
  answers.clear();
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

async function setup({ secret }: { secret?: string } = {}) {
  const cwd = await mkdtemp(join(tmpdir(), "forgeron-admin-"));
  const config = await mkdtemp(join(tmpdir(), "forgeron-config-"));
  dirs.push(cwd, config);
  process.env.XDG_CONFIG_HOME = config;
  delete process.env.FORGERON_TOKEN;
  process.env.FORGERON_ENDPOINT = endpoint;
  await mkdir(join(config, "forgeron"));
  await writeFile(join(config, "forgeron", "credentials"), "admin-token\n");
  await mkdir(join(cwd, ".forgeron"));
  await writeFile(join(cwd, ".forgeron", "project.json"), JSON.stringify({ tool: "crm" }));
  const logs: string[] = [];
  const errors: string[] = [];
  const io: Io = {
    cwd,
    log: (m) => void logs.push(m),
    error: (m) => void errors.push(m),
    exec: async () => 0,
    stopped: new Promise(() => {}),
    ...(secret === undefined ? {} : { readSecret: async () => secret }),
  };
  return { io, logs, errors, cwd };
}
const set = (key: string, status: number, body?: unknown) => answers.set(key, { status, body });

describe("forgeron admin", () => {
  it("lists the tools, the approvals and the members as tables, with the signed-in token", async () => {
    const { io, logs } = await setup();
    set("GET /console-api/api/tools", 200, {
      tools: [
        {
          name: "crm",
          production: "1.4.0",
          previews: [{ branch: "a", version: "1.5.0" }],
          summary: null,
          lastDeployment: null,
        },
      ],
    });
    expect(await run(["admin", "tools", "list"], io)).toBe(0);
    expect(requests[0]!.authorization).toBe("Bearer admin-token");
    expect(logs.join("\n")).toMatch(/TOOL\s+PRODUCTION\s+PREVIEWS\s+crm\s+1\.4\.0\s+1/);

    logs.length = 0;
    set("GET /console-api/api/approvals", 200, {
      versions: [
        {
          tool: "hr",
          id: "v1",
          version: "1.1.0",
          approvals: [{ id: "apr_1", resource: "resources.network", kind: "added" }],
        },
      ],
    });
    expect(await run(["admin", "approvals", "list"], io)).toBe(0);
    expect(logs.join("\n")).toContain("apr_1");
    expect(logs.join("\n")).toContain("resources.network");

    logs.length = 0;
    set("GET /console-api/api/members", 200, {
      members: [{ id: "m1", email: "ada@acme.test", name: "ada", roles: ["admin"] }],
      invitations: [{ email: "eve@acme.test", roles: [], expiresAt: "2026-11-24T10:00:00Z" }],
      settings: { domains: [], defaultRole: "", source: "install" },
    });
    expect(await run(["admin", "members", "list"], io)).toBe(0);
    expect(logs.join("\n")).toContain("ada@acme.test");
    expect(logs.join("\n")).toContain("invited  eve@acme.test");
  });

  it("decides an approval, invites, changes roles and removes, with what each route takes", async () => {
    const { io, logs } = await setup();
    set("POST /console-api/api/approvals/apr_1", 200, { id: "apr_1", status: "approved" });
    expect(await run(["admin", "approvals", "approve", "apr_1"], io)).toBe(0);
    expect(requests.at(-1)!.body).toEqual({ decision: "approved" });
    expect(await run(["admin", "approvals", "reject", "apr_1"], io)).toBe(0);
    expect(requests.at(-1)!.body).toEqual({ decision: "rejected" });

    set("POST /console-api/api/invitations", 201, { email: "eve@acme.test" });
    expect(
      await run(["admin", "members", "invite", "eve@acme.test", "--role", "developer, reader"], io),
    ).toBe(0);
    expect(requests.at(-1)!.body).toEqual({
      email: "eve@acme.test",
      roles: ["developer", "reader"],
    });

    set("PATCH /console-api/api/members/m2", 200, { id: "m2", roles: ["developer"] });
    expect(await run(["admin", "members", "roles", "m2", "--set", "developer"], io)).toBe(0);
    expect(requests.at(-1)!.body).toEqual({ roles: ["developer"] });
    set("DELETE /console-api/api/members/m2", 204);
    expect(await run(["admin", "members", "remove", "m2"], io)).toBe(0);
    expect(logs.join("\n")).toContain("Removed m2.");
  });

  it("lists who holds a tool's secrets by name, revokes one or all, and shows no value", async () => {
    const { io, logs } = await setup();
    set("GET /console-api/api/tools/crm/user-secrets", 200, {
      holders: [{ person: "m2", names: ["ODOO_API_KEY"] }],
    });
    expect(await run(["admin", "user-secrets", "list"], io)).toBe(0);
    expect(logs.join("\n")).toContain("ODOO_API_KEY");
    set("DELETE /console-api/api/tools/crm/user-secrets/m2/ODOO_API_KEY", 200, { revoked: 1 });
    expect(
      await run(
        ["admin", "user-secrets", "revoke", "--person", "m2", "--name", "ODOO_API_KEY"],
        io,
      ),
    ).toBe(0);
    set("DELETE /console-api/api/tools/crm/user-secrets/m2", 200, { revoked: 2 });
    expect(await run(["admin", "user-secrets", "revoke", "--person", "m2"], io)).toBe(0);
    expect(logs.join("\n")).toContain("Revoked 2 secrets.");
  });

  it("sets a person's secret from a typed value: in the body only, never in an argument, a path or an output", async () => {
    const VALUE = "typed-test-value-not-a-real-secret";
    const { io, logs, errors } = await setup({ secret: VALUE });
    set("PUT /console-api/api/tools/crm/user-secrets/m2/ODOO_API_KEY", 204);
    expect(
      await run(["admin", "user-secrets", "set", "--person", "m2", "--name", "ODOO_API_KEY"], io),
    ).toBe(0);
    expect(requests[0]).toMatchObject({ method: "PUT", body: { value: VALUE } });
    expect(requests.map((r) => r.path).join()).not.toContain(VALUE);
    expect([...logs, ...errors].join("\n")).not.toContain(VALUE);
    // Without a keyboard it does not guess one.
    const none = await setup();
    await expect(
      run(["admin", "user-secrets", "set", "--person", "m2", "--name", "ODOO_API_KEY"], none.io),
    ).resolves.toBe(2);
  });

  it("re-seals and says when a value is unreadable (exit 3), and revokes a person's tokens", async () => {
    const { io, logs } = await setup();
    set("POST /console-api/api/secrets/reseal", 200, { resealed: 4, current: 1, unreadable: 0 });
    expect(await run(["admin", "reseal"], io)).toBe(0);
    expect(logs.join("\n")).toContain("4 sealed again, 1 already current, 0 unreadable");
    set("POST /console-api/api/secrets/reseal", 200, { resealed: 0, current: 0, unreadable: 2 });
    expect(await run(["admin", "reseal"], io)).toBe(3);
    set("POST /console-api/api/people/m2/tokens/revoke", 200, { revoked: "all", person: "m2" });
    expect(await run(["admin", "revoke-tokens", "m2"], io)).toBe(0);
  });

  it("reads the audit log", async () => {
    const { io, logs } = await setup();
    set("GET /console-api/api/audit", 200, {
      entries: [
        {
          id: "1",
          at: "2026-11-10T10:00:00Z",
          tool: "crm",
          actor: "ada@acme.test",
          kind: "promotion",
          subject: "production:1.2.0",
          result: "ok",
        },
      ],
    });
    expect(await run(["admin", "audit", "--limit", "20"], io)).toBe(0);
    expect(requests[0]!.path).toBe("/console-api/api/audit?limit=20");
    expect(logs.join("\n")).toContain("production:1.2.0");
  });

  it("says what the workspace said when it refuses, and what to do when not signed in or not an admin", async () => {
    const { io, errors } = await setup();
    set("GET /console-api/api/tools", 403, { error: "FORBIDDEN", message: "Admins only." });
    expect(await run(["admin", "tools", "list"], io)).toBe(1);
    expect(errors.join("\n")).toContain("Admins only.");
    set("GET /console-api/api/tools", 401, { error: "UNAUTHENTICATED" });
    expect(await run(["admin", "tools", "list"], io)).toBe(1);
    expect(errors.join("\n")).toContain("forgeron login");
  });

  it("is a wrong use without an area, with an unknown one, or without a workspace", async () => {
    const { io } = await setup();
    expect(await run(["admin"], io)).toBe(2);
    expect(await run(["admin", "tools", "frobnicate"], io)).toBe(2);
    expect(await run(["admin", "approvals", "approve"], io)).toBe(2);
    expect(await run(["admin", "members", "roles", "m2"], io)).toBe(2);
    delete process.env.FORGERON_ENDPOINT;
    expect(await run(["admin", "tools", "list"], io)).toBe(2);
  });
});

describe("forgeron api", () => {
  it("calls a route with the token and prints the answer, and sends the data as JSON", async () => {
    const { io, logs } = await setup();
    set("GET /console-api/api/tools", 200, { tools: [] });
    expect(await run(["api", "get", "/api/tools"], io)).toBe(0);
    expect(requests[0]).toMatchObject({ method: "GET", authorization: "Bearer admin-token" });
    expect(JSON.parse(logs.join(""))).toEqual({ tools: [] });
    set("POST /console-api/api/approvals/apr_1", 200, { id: "apr_1", status: "approved" });
    expect(
      await run(["api", "POST", "/api/approvals/apr_1", "--data", '{"decision":"approved"}'], io),
    ).toBe(0);
    expect(requests.at(-1)!.body).toEqual({ decision: "approved" });
  });

  it("reads the data from a file, exits 1 with the body on a refusal, and keeps to the console API", async () => {
    const { io, errors, cwd } = await setup();
    await writeFile(join(cwd, "body.json"), '{"decision":"rejected"}');
    set("POST /console-api/api/approvals/apr_2", 409, {
      error: "ALREADY_DECIDED",
      message: "Decided.",
    });
    expect(await run(["api", "POST", "/api/approvals/apr_2", "--data-file", "body.json"], io)).toBe(
      1,
    );
    expect(requests[0]!.body).toEqual({ decision: "rejected" });
    expect(errors.join("\n")).toContain("ALREADY_DECIDED");
    for (const argv of [
      ["api", "GET", "/whoami"],
      ["api", "GET", "/api/../deploy"],
      ["api", "FETCH", "/api/tools"],
      ["api", "GET"],
      ["api", "POST", "/api/x", "--data", "{not json"],
      ["api", "POST", "/api/x", "--data", "{}", "--data-file", "body.json"],
    ]) {
      expect(await run(argv, io)).toBe(2);
    }
  });
});
