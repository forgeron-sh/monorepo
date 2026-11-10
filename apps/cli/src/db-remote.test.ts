import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { run } from "./cli";
import type { Io } from "./io";

// `forgeron db status|shell --env preview|production` (D-112): through the workspace's console API.

let server: Server;
let endpoint: string;
const requests: Array<{ method?: string; path: string; authorization?: string; body: unknown }> =
  [];
const answers = new Map<string, { status: number; body: unknown }>();

beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      const path = String(req.url);
      requests.push({
        method: req.method,
        path,
        ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}),
        body: raw ? JSON.parse(raw) : undefined,
      });
      const answer = answers.get(path.split("?")[0]!) ?? { status: 404, body: {} };
      res.statusCode = answer.status;
      res.end(JSON.stringify(answer.body));
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

async function setup({ linked = true, signedIn = true } = {}) {
  const cwd = await mkdtemp(join(tmpdir(), "forgeron-db-"));
  const config = await mkdtemp(join(tmpdir(), "forgeron-config-"));
  dirs.push(cwd, config);
  process.env.XDG_CONFIG_HOME = config;
  delete process.env.FORGERON_TOKEN;
  delete process.env.FORGERON_ENDPOINT;
  if (linked) {
    await mkdir(join(cwd, ".forgeron"));
    await writeFile(
      join(cwd, ".forgeron", "project.json"),
      JSON.stringify({ tool: "crm", workspace: "acme", endpoint }),
    );
  }
  if (signedIn) {
    await mkdir(join(config, "forgeron"));
    await writeFile(join(config, "forgeron", "credentials"), "person-token\n");
  }
  const logs: string[] = [];
  const errors: string[] = [];
  const io: Io = {
    cwd,
    log: (m) => void logs.push(m),
    error: (m) => void errors.push(m),
    exec: async () => 0,
    stopped: new Promise(() => {}),
  };
  return { io, logs, errors };
}

const status = {
  environment: "production",
  version: "1.0.0",
  applied: ["0001_init"],
  pending: ["0002_drop"],
  destructive: ["0002_drop"],
  conflicts: [] as Array<{ code: string; migration: string; message: string }>,
};

describe("forgeron db status on a remote environment", () => {
  it("shows what is applied and pending, flags the destructive ones, with the signed-in token", async () => {
    const { io, logs } = await setup();
    answers.set("/console-api/api/tools/crm/db/migrations", { status: 200, body: status });
    expect(await run(["db", "status", "--env", "production"], io)).toBe(0);
    expect(requests[0]).toMatchObject({
      method: "GET",
      path: "/console-api/api/tools/crm/db/migrations?env=production",
      authorization: "Bearer person-token",
    });
    const out = logs.join("\n");
    expect(out).toContain("crm on production, serving 1.0.0");
    expect(out).toContain("applied  0001_init");
    expect(out).toContain("pending  0002_drop  (drops or rewrites data)");
  });

  it("lists the conflicts and exits 3, like a promotion refused for them", async () => {
    const { io, logs } = await setup();
    answers.set("/console-api/api/tools/crm/db/migrations", {
      status: 200,
      body: {
        ...status,
        conflicts: [
          {
            code: "MIGRATION_MISSING",
            migration: "0003_other",
            message: "It was applied, but this build lacks it.",
          },
        ],
      },
    });
    expect(await run(["db", "status", "--env", "production"], io)).toBe(3);
    expect(logs.join("\n")).toContain("conflict MIGRATION_MISSING 0003_other");
  });

  it("needs a branch for a preview, and works outside a tool's folder with --tool and --endpoint", async () => {
    const { io } = await setup({ linked: false });
    await expect(run(["db", "status", "--env", "preview"], io)).resolves.toBe(2);
    await expect(run(["db", "status", "--env", "production"], io)).resolves.toBe(2);
    answers.set("/console-api/api/tools/hr/db/migrations", { status: 200, body: status });
    expect(
      await run(
        [
          "db",
          "status",
          "--env",
          "preview",
          "--branch",
          "feat",
          "--tool",
          "hr",
          "--endpoint",
          endpoint,
        ],
        io,
      ),
    ).toBe(0);
    expect(requests.at(-1)!.path).toBe(
      "/console-api/api/tools/hr/db/migrations?env=preview&branch=feat",
    );
  });
});

describe("forgeron db shell on a remote environment", () => {
  it("runs a read and prints the rows", async () => {
    const { io, logs } = await setup();
    answers.set("/console-api/api/tools/crm/db/query", {
      status: 200,
      body: { write: false, rows: [{ n: 2 }], rowCount: 1, truncated: false },
    });
    expect(
      await run(
        ["db", "shell", "--env", "production", "--sql", "SELECT COUNT(*) AS n FROM deals"],
        io,
      ),
    ).toBe(0);
    expect(requests[0]).toMatchObject({
      method: "POST",
      body: { sql: "SELECT COUNT(*) AS n FROM deals", env: "production" },
    });
    expect(JSON.parse(logs.join(""))).toEqual([{ n: 2 }]);
  });

  it("sends the write and the confirmation as flags, and says what the workspace refused", async () => {
    const { io, errors } = await setup();
    answers.set("/console-api/api/tools/crm/db/query", {
      status: 409,
      body: {
        error: "CONFIRM_REQUIRED",
        message: 'A write on production needs `confirm` set to "crm".',
      },
    });
    expect(
      await run(
        ["db", "shell", "--env", "production", "--sql", "DELETE FROM deals", "--write"],
        io,
      ),
    ).toBe(1);
    expect(requests[0]!.body).toMatchObject({ write: true });
    expect(requests[0]!.body).not.toHaveProperty("confirm");
    expect(errors.join("\n")).toContain("A write on production needs `confirm`");
    answers.set("/console-api/api/tools/crm/db/query", {
      status: 200,
      body: { write: true, rows: [], rowCount: 0, truncated: false },
    });
    expect(
      await run(
        [
          "db",
          "shell",
          "--env",
          "production",
          "--sql",
          "DELETE FROM deals",
          "--write",
          "--confirm",
          "crm",
        ],
        io,
      ),
    ).toBe(0);
    expect(requests.at(-1)!.body).toMatchObject({ write: true, confirm: "crm" });
  });

  it("tells a person who is not signed in, or not an admin, what to do", async () => {
    const out = await setup({ signedIn: false });
    await expect(
      run(["db", "shell", "--env", "production", "--sql", "SELECT 1"], out.io),
    ).resolves.toBe(2);
    const { io, errors } = await setup();
    answers.set("/console-api/api/tools/crm/db/query", {
      status: 403,
      body: { error: "FORBIDDEN", message: "The database operations are for admins." },
    });
    expect(await run(["db", "shell", "--env", "production", "--sql", "SELECT 1"], io)).toBe(1);
    expect(errors.join("\n")).toContain("for admins");
  });

  it("only offers status and shell on a remote environment, and still refuses a write without --write locally", async () => {
    const { io } = await setup();
    await expect(run(["db", "migrate", "--env", "production"], io)).resolves.toBe(2);
    await expect(run(["db", "shell", "--env", "production"], io)).resolves.toBe(2);
    await expect(run(["db", "status", "--env", "staging"], io)).resolves.toBe(2);
  });
});
