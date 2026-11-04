import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { run } from "./cli";
import type { Io } from "./io";

// A workspace endpoint that answers `DELETE /deploy` the way the gateway does.
let server: Server;
let endpoint: string;
const requests: Array<{ method?: string; path?: string; authorization?: string; body: unknown }> =
  [];
let answer: { status: number; body: unknown } = { status: 200, body: { removed: true } };

beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      requests.push({
        ...(req.method ? { method: req.method } : {}),
        ...(req.url ? { path: req.url } : {}),
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
const saved = { ...process.env };
afterEach(async () => {
  for (const key of ["FORGERON_TOKEN", "GITHUB_HEAD_REF", "GITHUB_REF_NAME"]) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
  requests.length = 0;
  answer = { status: 200, body: { removed: true } };
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

async function linked(withEndpoint = true) {
  const cwd = await mkdtemp(join(tmpdir(), "forgeron-preview-"));
  dirs.push(cwd);
  await mkdir(join(cwd, ".forgeron"));
  await writeFile(
    join(cwd, ".forgeron", "project.json"),
    JSON.stringify({ tool: "crm", workspace: "acme", ...(withEndpoint ? { endpoint } : {}) }),
  );
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

describe("forgeron preview close", () => {
  it("asks the workspace to close the preview of the branch with FORGERON_TOKEN", async () => {
    process.env.FORGERON_TOKEN = "fgt.example.token";
    const { io, logs } = await linked();
    expect(await run(["preview", "close", "--branch", "feat/a"], io)).toBe(0);
    expect(requests).toEqual([
      {
        method: "DELETE",
        path: "/deploy",
        authorization: "Bearer fgt.example.token",
        body: { branch: "feat/a" },
      },
    ]);
    expect(logs).toEqual(["Closed the preview of crm for feat/a."]);
  });

  it("takes the pull request's branch from CI and says when there was nothing to close", async () => {
    process.env.FORGERON_TOKEN = "t";
    process.env.GITHUB_HEAD_REF = "feat/b";
    answer = { status: 200, body: { removed: false } };
    const { io, logs } = await linked();
    expect(await run(["preview", "close"], io)).toBe(0);
    expect(requests[0]?.body).toEqual({ branch: "feat/b" });
    expect(logs).toEqual(["crm had no preview for feat/b."]);
  });

  it("is a wrong use without a branch, a token, a link or the right words", async () => {
    delete process.env.GITHUB_HEAD_REF;
    delete process.env.GITHUB_REF_NAME;
    delete process.env.FORGERON_TOKEN;
    const { io } = await linked();
    expect(await run(["preview"], io)).toBe(2);
    expect(await run(["preview", "close"], io)).toBe(2);
    expect(await run(["preview", "close", "--branch", "x"], io)).toBe(2);
    process.env.FORGERON_TOKEN = "t";
    expect(await run(["preview", "close", "--branch", "x"], (await linked(false)).io)).toBe(2);
    expect(requests).toHaveLength(0);
  });

  it("fails with the workspace's message when it refuses", async () => {
    process.env.FORGERON_TOKEN = "t";
    answer = { status: 401, body: { error: { message: "Not a valid deployment token." } } };
    const { io, errors } = await linked();
    expect(await run(["preview", "close", "--branch", "x"], io)).toBe(1);
    expect(errors).toEqual(["Not a valid deployment token."]);
  });
});
