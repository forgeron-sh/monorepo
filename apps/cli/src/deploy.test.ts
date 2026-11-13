import { cp, mkdir, rm, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { run } from "./cli";
import type { Io } from "./io";

const fixtures = fileURLToPath(new URL("../fixtures", import.meta.url));

// A workspace endpoint that answers `POST /deploy` the way the gateway does.
let server: Server;
let endpoint: string;
const uploads: Array<{ authorization?: string; body: Record<string, unknown> }> = [];
let answer: { status: number; body: unknown } = { status: 200, body: {} };

beforeAll(async () => {
  server = createServer((req, res) => {
    let raw = "";
    req.on("data", (chunk) => (raw += chunk));
    req.on("end", () => {
      uploads.push({
        ...(req.headers.authorization ? { authorization: req.headers.authorization } : {}),
        body: JSON.parse(raw || "{}"),
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
  for (const key of ["FORGERON_TOKEN", "GITHUB_HEAD_REF", "GITHUB_REF_NAME", "GITHUB_SHA"]) {
    if (saved[key] === undefined) delete process.env[key];
    else process.env[key] = saved[key];
  }
  uploads.length = 0;
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

/** A tool inside the repository, so that `@forgeron/sdk` resolves, linked to the test endpoint. */
async function linked(withEndpoint = true) {
  const dir = join(fixtures, `.work-deploy-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  dirs.push(dir);
  await cp(join(fixtures, "greeter"), dir, {
    recursive: true,
    filter: (s) => !s.includes(".forgeron"),
  });
  await mkdir(join(dir, ".forgeron"));
  await writeFile(
    join(dir, ".forgeron", "project.json"),
    JSON.stringify({ tool: "greeter", workspace: "acme", ...(withEndpoint ? { endpoint } : {}) }),
  );
  const logs: string[] = [];
  const errors: string[] = [];
  const io: Io = {
    cwd: dir,
    log: (m) => void logs.push(m),
    error: (m) => void errors.push(m),
    exec: async () => 0,
    stopped: new Promise(() => {}),
  };
  return { io, logs, errors };
}

describe("forgeron deploy", () => {
  it("builds, uploads with FORGERON_TOKEN and says where the build is served", async () => {
    process.env.FORGERON_TOKEN = "fgt.example.token";
    answer = {
      status: 200,
      body: { version: "x", url: "https://acme.test/t/greeter", applied: [] },
    };
    const { io, logs, errors } = await linked();
    const code = await run(["deploy", "--branch", "feat/a"], io);
    expect([code, errors]).toEqual([0, []]);

    expect(uploads).toHaveLength(1);
    const [upload] = uploads;
    expect(upload?.authorization).toBe("Bearer fgt.example.token");
    expect(upload?.body).not.toHaveProperty("environment");
    expect(upload?.body).toMatchObject({
      branch: "feat/a",
      version: expect.stringMatching(/^\d+\.\d+\.\d+-preview\.feat-a\+[0-9a-f]{7}$/),
      build: {
        manifest: { name: "greeter" },
        worker: expect.stringContaining("export"),
        fingerprint: expect.any(String),
      },
    });
    expect(logs[0]).toContain("Deployed greeter@x to feat/a: https://acme.test/t/greeter");
  });

  it("takes the branch GitHub gives CI, and says which permanent channels took a release", async () => {
    process.env.FORGERON_TOKEN = "t";
    process.env.GITHUB_HEAD_REF = "feat/b";
    answer = {
      status: 200,
      body: {
        channels: [
          { channel: "production", version: "1.2.0" },
          { channel: "staging", waiting: "staging waits for an admin to approve: x." },
        ],
      },
    };
    const preview = await linked();
    expect(await run(["deploy", "--allow-destructive"], preview.io)).toBe(0);
    expect(uploads[0]?.body).toMatchObject({ branch: "feat/b", allowDestructive: true });
    expect(preview.logs.join("\n")).toContain("The channel production took the release 1.2.0.");
    expect(preview.logs.join("\n")).toContain("The channel staging waits for approval");
    // There is no environment to choose: production takes releases of its branch (D-125).
    expect(await run(["deploy", "--env", "production"], preview.io)).toBe(2);
  });

  it("sends the commit of the checkout, for the console's list of branches", async () => {
    process.env.FORGERON_TOKEN = "t";
    delete process.env.GITHUB_SHA;
    answer = { status: 200, body: {} };
    const { io } = await linked();
    const sha = "a41f9e0c3d2b1a0f9e8d7c6b5a4f3e2d1c0b9a87";
    const capture = vi.fn<NonNullable<Io["capture"]>>(async () => ({
      code: 0,
      stdout: `${sha}\x1fAdd the export\x1fAda\n`,
    }));
    expect(await run(["deploy", "--branch", "feat/a"], { ...io, capture })).toBe(0);
    expect(uploads.at(-1)?.body.commit).toEqual({ sha, message: "Add the export", author: "Ada" });

    // No git to ask: nothing is sent, and the deployment goes on.
    expect(await run(["deploy", "--branch", "feat/a"], io)).toBe(0);
    expect(uploads.at(-1)?.body).not.toHaveProperty("commit");

    // CI gives the sha; the checkout's subject is not that commit's, so only the sha goes.
    process.env.GITHUB_SHA = "b".repeat(40);
    expect(await run(["deploy", "--branch", "feat/a"], { ...io, capture })).toBe(0);
    expect(uploads.at(-1)?.body.commit).toEqual({ sha: "b".repeat(40) });
  });

  it("shows what the gateway refused, and exits 1", async () => {
    process.env.FORGERON_TOKEN = "t";
    answer = { status: 401, body: { error: { message: "This is not a valid deployment token." } } };
    const { io, errors } = await linked();
    expect(await run(["deploy", "--branch", "b"], io)).toBe(1);
    expect(errors).toEqual(["This is not a valid deployment token."]);
  });

  it("is a wrong use without a token, a branch, a linked tool or a known environment", async () => {
    const send = async (args: string[], link = true) => run(args, (await linked(link)).io);
    delete process.env.FORGERON_TOKEN;
    expect(await send(["deploy", "--branch", "b"])).toBe(2);
    process.env.FORGERON_TOKEN = "t";
    delete process.env.GITHUB_HEAD_REF;
    delete process.env.GITHUB_REF_NAME;
    expect(await send(["deploy"])).toBe(2);
    expect(await send(["deploy", "--branch", "b"], false)).toBe(2);
    expect(await send(["deploy", "--env", "staging", "--branch", "b"])).toBe(2);
    expect(uploads).toEqual([]);
  });
});
