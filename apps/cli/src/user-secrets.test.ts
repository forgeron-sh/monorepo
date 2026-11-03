import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { run } from "./cli";
import type { Io } from "./io";
import { missingSecretsOf, promptUserSecrets } from "./commands/user-secrets";

// A workspace endpoint that answers `POST /t/<tool>/secrets` the way the gateway does.
let server: Server;
let endpoint: string;
const requests: Array<{ url?: string; authorization?: string; body: unknown }> = [];
let status = 200;

beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      requests.push({
        ...(req.url ? { url: req.url } : {}),
        ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}),
        body: JSON.parse(raw || "null"),
      });
      res.statusCode = status;
      res.end("{}");
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});
afterAll(() => new Promise((resolve) => server.close(resolve)));

const dirs: string[] = [];
const saved = process.env.XDG_CONFIG_HOME;
afterEach(async () => {
  process.env.XDG_CONFIG_HOME = saved as string;
  if (saved === undefined) delete process.env.XDG_CONFIG_HOME;
  requests.length = 0;
  status = 200;
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

async function setup(typed: string[]) {
  const cwd = await mkdtemp(join(tmpdir(), "forgeron-usersecrets-"));
  const config = await mkdtemp(join(tmpdir(), "forgeron-config-"));
  dirs.push(cwd, config);
  process.env.XDG_CONFIG_HOME = config;
  await mkdir(join(cwd, ".forgeron"));
  await writeFile(
    join(cwd, ".forgeron", "project.json"),
    JSON.stringify({ tool: "crm", workspace: "acme", endpoint }),
  );
  await mkdir(join(config, "forgeron"));
  await writeFile(join(config, "forgeron", "credentials"), "login-token\n");
  const logs: string[] = [];
  const prompts: string[] = [];
  const io: Io = {
    cwd,
    log: (m) => void logs.push(m),
    error: () => {},
    exec: async () => 0,
    readSecret: async (prompt) => (prompts.push(prompt), typed.shift() ?? ""),
    stopped: new Promise(() => {}),
  };
  return { io, logs, prompts };
}

describe("forgeron secrets set --user", () => {
  it("prompts without echo and stores the value for this tool through the gateway", async () => {
    const { io, logs } = await setup(["typed-test-value"]);
    expect(await run(["secrets", "set", "ODOO_API_KEY", "--user"], io)).toBe(0);
    expect(requests).toEqual([
      {
        url: "/t/crm/secrets",
        authorization: "Bearer login-token",
        body: { ODOO_API_KEY: "typed-test-value" },
      },
    ]);
    expect(logs.join("\n")).not.toContain("typed-test-value");
  });

  it("stores nothing when the value is empty", async () => {
    const { io } = await setup([""]);
    expect(await run(["secrets", "set", "ODOO_API_KEY", "--user"], io)).toBe(2);
    expect(requests).toEqual([]);
  });

  it("shows what the workspace refused, and exits 1", async () => {
    status = 403;
    const { io } = await setup(["v"]);
    expect(await run(["secrets", "set", "ODOO_API_KEY", "--user"], io)).toBe(1);
  });
});

describe("a missing secret answered by a tool (428)", () => {
  const body = {
    error: {
      code: "SECRET_REQUIRED",
      details: { missing: [{ name: "K", label: "The key", why: "To read your tickets" }] },
    },
  };

  it("is read from the error and prompted for with the tool's own label and reason", async () => {
    const missing = missingSecretsOf(body)!;
    expect(missing).toHaveLength(1);
    expect(missingSecretsOf({ error: { code: "FORBIDDEN" } })).toBeUndefined();
    const { io, logs, prompts } = await setup(["abc"]);
    expect(await promptUserSecrets(io, { endpoint, tool: "crm", token: "t" }, missing)).toBe(true);
    expect(prompts).toEqual(["The key: "]);
    expect(logs[0]).toContain("To read your tickets");
    expect(requests[0]?.body).toEqual({ K: "abc" });
  });
});
