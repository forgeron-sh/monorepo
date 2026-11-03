import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { run } from "./cli";
import type { Io } from "./io";

// A workspace endpoint that answers `POST /deploy-tokens` the way the gateway does.
let server: Server;
let endpoint: string;
const requests: Array<{ authorization?: string; body: unknown }> = [];
let answer: { status: number; body: unknown } = { status: 201, body: {} };

beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      requests.push({
        ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}),
        body: JSON.parse(raw || "null"),
      });
      res.statusCode = answer.status;
      res.end(JSON.stringify(answer.body));
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
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

async function setup({ linked = true, credentials = "person-token" } = {}) {
  const cwd = await mkdtemp(join(tmpdir(), "forgeron-token-"));
  const config = await mkdtemp(join(tmpdir(), "forgeron-config-"));
  dirs.push(cwd, config);
  process.env.XDG_CONFIG_HOME = config;
  if (linked) {
    await mkdir(join(cwd, ".forgeron"));
    await writeFile(
      join(cwd, ".forgeron", "project.json"),
      JSON.stringify({ tool: "crm", workspace: "acme", endpoint }),
    );
  }
  if (credentials) {
    await mkdir(join(config, "forgeron"));
    await writeFile(join(config, "forgeron", "credentials"), `${credentials}\n`);
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

const create = ["token", "create", "--name", "ci", "--scope", "deploy"];

describe("forgeron token create", () => {
  it("asks the workspace for a deployment token and prints it for FORGERON_TOKEN", async () => {
    answer = {
      status: 201,
      body: { token: "fgt.example.token", expiresAt: "2027-02-01T10:00:00.000Z" },
    };
    const { io, logs } = await setup();
    expect(await run(create, io)).toBe(0);
    expect(requests).toEqual([
      {
        authorization: "Bearer person-token",
        body: { tool: "crm", name: "ci", scope: "deploy", days: 90 },
      },
    ]);
    expect(logs.join("\n")).toContain("FORGERON_TOKEN");
    expect(logs.at(-1)).toBe("fgt.example.token");
  });

  it("passes the lifetime asked with --days", async () => {
    answer = { status: 201, body: { token: "t", expiresAt: "x" } };
    const { io } = await setup();
    expect(await run([...create, "--days", "30"], io)).toBe(0);
    expect(requests[0]?.body).toMatchObject({ days: 30 });
  });

  it("shows what the workspace refused, and exits 1", async () => {
    answer = {
      status: 403,
      body: { error: { message: "Only an administrator can create a deployment token." } },
    };
    const { io, errors } = await setup();
    expect(await run(create, io)).toBe(1);
    expect(errors).toEqual(["Only an administrator can create a deployment token."]);
  });

  it("is a wrong use without a name, with another scope, or with a bad lifetime", async () => {
    const { io, errors } = await setup();
    expect(await run(["token", "create", "--scope", "deploy"], io)).toBe(2);
    expect(await run(["token", "create", "--name", "ci", "--scope", "admin"], io)).toBe(2);
    expect(await run([...create, "--days", "0"], io)).toBe(2);
    expect(await run(["token"], io)).toBe(2);
    expect(errors.some((e) => e.includes('"deploy" is the only one'))).toBe(true);
    expect(requests).toEqual([]);
  });

  it("needs a linked tool and a signed-in person, and sends nothing without them", async () => {
    const unlinked = await setup({ linked: false });
    expect(await run(create, unlinked.io)).toBe(2);
    expect(unlinked.errors[0]).toContain("forgeron link");
    const anonymous = await setup({ credentials: "" });
    expect(await run(create, anonymous.io)).toBe(2);
    expect(anonymous.errors[0]).toContain("forgeron login");
    expect(requests).toEqual([]);
  });
});
