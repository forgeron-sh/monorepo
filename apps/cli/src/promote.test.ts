import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { run } from "./cli";
import type { Io } from "./io";

// A workspace endpoint that answers `POST /promote` and `POST /rollback` the way the gateway does.
let server: Server;
let endpoint: string;
const requests: Array<{ path?: string; authorization?: string; body: unknown }> = [];
let answer: { status: number; body: unknown } = { status: 200, body: {} };

beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      requests.push({
        path: req.url,
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
const savedConfig = process.env.XDG_CONFIG_HOME;
const savedToken = process.env.FORGERON_TOKEN;
afterEach(async () => {
  if (savedConfig === undefined) delete process.env.XDG_CONFIG_HOME;
  else process.env.XDG_CONFIG_HOME = savedConfig;
  if (savedToken === undefined) delete process.env.FORGERON_TOKEN;
  else process.env.FORGERON_TOKEN = savedToken;
  requests.length = 0;
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

async function setup({ credentials = "person-token", env = undefined as string | undefined } = {}) {
  const cwd = await mkdtemp(join(tmpdir(), "forgeron-promote-"));
  const config = await mkdtemp(join(tmpdir(), "forgeron-config-"));
  dirs.push(cwd, config);
  process.env.XDG_CONFIG_HOME = config;
  if (env === undefined) delete process.env.FORGERON_TOKEN;
  else process.env.FORGERON_TOKEN = env;
  await mkdir(join(cwd, ".forgeron"));
  await writeFile(
    join(cwd, ".forgeron", "project.json"),
    JSON.stringify({ tool: "crm", workspace: "acme", endpoint }),
  );
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

describe("forgeron promote", () => {
  it("asks the gateway to promote the version, with the login token", async () => {
    answer = {
      status: 200,
      body: { version: "1.1.0", url: "https://acme.forgeron.app/t/crm", applied: ["0002"] },
    };
    const { io, logs } = await setup();
    expect(await run(["promote", "1.1.0", "--to", "production"], io)).toBe(0);
    expect(requests).toEqual([
      {
        path: "/promote",
        authorization: "Bearer person-token",
        body: { tool: "crm", version: "1.1.0", to: "production" },
      },
    ]);
    expect(logs.join("\n")).toContain("Promoted crm@1.1.0 to production");
    expect(logs.join("\n")).toContain("Migrations applied: 0002");
  });

  it("prefers FORGERON_TOKEN and passes --allow-destructive", async () => {
    answer = { status: 200, body: { version: "1.1.0" } };
    const { io } = await setup({ env: "fgt.ci" });
    expect(await run(["promote", "1.1.0", "--to", "production", "--allow-destructive"], io)).toBe(
      0,
    );
    expect(requests[0]).toMatchObject({
      authorization: "Bearer fgt.ci",
      body: { to: "production", allowDestructive: true },
    });
  });

  it("prints the gateway's reason and exits 1 when it refuses", async () => {
    answer = {
      status: 422,
      body: {
        error: { code: "NO_ENTRY", message: "production takes a version with a changelog entry." },
      },
    };
    const { io, errors } = await setup();
    expect(await run(["promote", "1.1.0", "--to", "production"], io)).toBe(1);
    expect(errors).toEqual(["production takes a version with a changelog entry."]);
  });

  it("is a wrong use without a version, a target, or for the pilot or a group", async () => {
    const { io } = await setup();
    expect(await run(["promote", "--to", "production"], io)).toBe(2);
    expect(await run(["promote", "1.1.0"], io)).toBe(2);
    expect(await run(["promote", "1.1.0", "--to", "staging"], io)).toBe(2);
    expect(await run(["promote", "1.1.0", "--to", "pilot"], io)).toBe(2);
    expect(await run(["promote", "1.1.0", "--to", "production", "--group", "x"], io)).toBe(2);
    expect(await run(["promote", "1.1.0", "--to", "preview"], io)).toBe(2);
    expect(requests).toEqual([]);
  });

  it("asks to sign in when there is no credential", async () => {
    const { io, errors } = await setup({ credentials: "" });
    expect(await run(["promote", "1.1.0", "--to", "production"], io)).toBe(2);
    expect(errors[0]).toContain("forgeron login");
  });
});

describe("forgeron rollback", () => {
  it("rolls production back by default and says no migration was rolled back", async () => {
    answer = { status: 200, body: { version: "1.0.0" } };
    const { io, logs } = await setup();
    expect(await run(["rollback"], io)).toBe(0);
    expect(requests).toEqual([
      {
        path: "/rollback",
        authorization: "Bearer person-token",
        body: { tool: "crm", environment: "production" },
      },
    ]);
    expect(logs.join("\n")).toContain("Rolled back crm on production to 1.0.0");
    expect(logs.join("\n")).toContain("forgeron db rollback");
  });

  it("rolls back the environment it is given", async () => {
    answer = { status: 200, body: { version: "1.0.0" } };
    const { io } = await setup();
    expect(await run(["rollback", "--env", "preview", "--branch", "feat"], io)).toBe(0);
    expect(requests[0]!.body).toEqual({ tool: "crm", environment: "preview", branch: "feat" });
  });

  it("prints the gateway's reason when there is nothing to go back to", async () => {
    answer = {
      status: 409,
      body: {
        error: {
          code: "NO_PREVIOUS",
          message: "The production environment has no earlier version.",
        },
      },
    };
    const { io, errors } = await setup();
    expect(await run(["rollback"], io)).toBe(1);
    expect(errors).toEqual(["The production environment has no earlier version."]);
  });

  it("is a wrong use for an unknown environment or a preview without a branch", async () => {
    const { io } = await setup();
    expect(await run(["rollback", "--env", "staging"], io)).toBe(2);
    expect(await run(["rollback", "--env", "pilot"], io)).toBe(2);
    expect(await run(["rollback", "--env", "preview"], io)).toBe(2);
  });
});

describe("forgeron deploy", () => {
  it("has no pilot and no group", async () => {
    const { io } = await setup({ env: "fgt.ci" });
    expect(await run(["deploy", "--env", "pilot"], io)).toBe(2);
    expect(await run(["deploy", "--env", "production", "--group", "early"], io)).toBe(2);
  });
});
