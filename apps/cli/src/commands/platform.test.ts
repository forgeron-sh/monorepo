import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Io } from "../io";
import { platform } from "./platform";

// A throwaway value: it protects nothing and is not a secret.
const TOKEN = "test-token-not-a-real-secret";
const SESSION = "test-session-token-not-a-real-secret";
const GATEWAY = "test-gateway-token-not-a-real-secret";

interface Calls {
  method: string;
  path: string;
  body?: Record<string, unknown>;
}

/** A simulated Cloudflare account: only the routes the install calls. */
function fakeCloudflare(expected = TOKEN) {
  const calls: Calls[] = [];
  const databases = new Map<string, string>();
  const workers = new Set<string>();
  const ok = (result: unknown) => Response.json({ success: true, errors: [], result });
  const missing = () =>
    Response.json(
      { success: false, errors: [{ message: "not found" }], result: null },
      { status: 404 },
    );
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const path = url.pathname.replace(/^\/client\/v4\/accounts\/[^/]+/, "");
    const body = init?.body
      ? (JSON.parse(String(init.body)) as Record<string, unknown>)
      : undefined;
    calls.push({ method, path, ...(body ? { body } : {}) });
    expect(new Headers(init?.headers).get("authorization")).toBe(`Bearer ${expected}`);
    let m: RegExpMatchArray | null;
    if (method === "GET" && path === "/d1/database") {
      return ok([...databases].map(([uuid, name]) => ({ uuid, name })));
    }
    if (method === "POST" && path === "/d1/database") {
      databases.set("db-1", String(body?.name));
      return ok({ uuid: "db-1", name: body?.name });
    }
    if (method === "POST" && /^\/d1\/database\/[^/]+\/query$/.test(path)) {
      return ok(
        Array.isArray(body?.batch)
          ? (body.batch as unknown[]).map(() => ({ results: [] }))
          : [{ results: [] }],
      );
    }
    if ((m = path.match(/^\/workers\/workers\/([^/]+)$/)) && method === "GET") {
      return workers.has(m[1]!) ? ok({ name: m[1] }) : missing();
    }
    if (method === "POST" && path === "/workers/workers") {
      workers.add(String(body?.name));
      return ok({ name: body?.name });
    }
    if (method === "POST" && /\/versions$/.test(path)) return ok({ id: "version-1" });
    if (method === "POST" && /\/deployments$/.test(path)) return ok({ id: "deployment-1" });
    return missing();
  };
  return { fetcher, calls, databases };
}

let dir: string;
let logs: string[];
let errors: string[];
let io: Io;

beforeEach(async () => {
  dir = await mkdtemp(join(tmpdir(), "forgeron-platform-"));
  await writeFile(join(dir, "gateway.js"), "export default { fetch: () => new Response('ok') };");
  logs = [];
  errors = [];
  io = {
    cwd: dir,
    log: (m) => void logs.push(m),
    error: (m) => void errors.push(m),
    exec: vi.fn<Io["exec"]>(async () => 0),
    capture: vi.fn<NonNullable<Io["capture"]>>(async () => ({ code: 0, stdout: `${SESSION}\n` })),
    stopped: new Promise(() => {}),
  };
  process.env.CLOUDFLARE_API_TOKEN = TOKEN;
});
afterEach(async () => {
  delete process.env.CLOUDFLARE_API_TOKEN;
  delete process.env.GATEWAY_CLOUDFLARE_API_TOKEN;
  await rm(dir, { recursive: true, force: true });
});

const install = (extra: string[] = []) => [
  "install",
  "--account",
  "acc-1",
  "--domain",
  "forgeron.example.test",
  "--gateway",
  "gateway.js",
  ...extra,
];

describe("forgeron platform install", () => {
  it("creates and migrates the platform D1, then deploys the gateway with the token as a secret", async () => {
    const cf = fakeCloudflare();
    expect(await platform(install(), io, { fetch: cf.fetcher })).toBe(0);

    expect(cf.databases.get("db-1")).toBe("forgeron-platform");
    const migration = cf.calls.find((c) => c.path === "/d1/database/db-1/query" && c.body?.batch);
    expect(JSON.stringify(migration?.body)).toContain('CREATE TABLE \\"tools\\"');

    const upload = cf.calls.find((c) => c.path.endsWith("/versions"))!;
    expect(upload.path).toBe("/workers/workers/forgeron-gateway/versions");
    const bindings = upload.body!.bindings as Array<Record<string, string>>;
    expect(bindings).toContainEqual({ type: "d1", name: "DB", id: "db-1" });
    expect(bindings).toContainEqual({
      type: "secret_text",
      name: "CLOUDFLARE_API_TOKEN",
      text: TOKEN,
    });
    expect(bindings).toContainEqual({
      type: "plain_text",
      name: "BASE_DOMAIN",
      text: "forgeron.example.test",
    });
    expect(cf.calls.some((c) => c.path === "/workers/scripts/forgeron-gateway/deployments")).toBe(
      true,
    );
  });

  it("never prints the token", async () => {
    await platform(install(), io, { fetch: fakeCloudflare().fetcher });
    expect([...logs, ...errors].join("\n")).not.toContain(TOKEN);
  });

  it("can be run again: the D1 and the Worker are reused", async () => {
    const cf = fakeCloudflare();
    await platform(install(), io, { fetch: cf.fetcher });
    logs.length = 0;
    expect(await platform(install(), io, { fetch: cf.fetcher })).toBe(0);
    expect(logs[0]).toContain("Found the platform D1");
    expect(cf.calls.filter((c) => c.method === "POST" && c.path === "/d1/database")).toHaveLength(
      1,
    );
    expect(
      cf.calls.filter((c) => c.method === "POST" && c.path === "/workers/workers"),
    ).toHaveLength(1);
  });

  it("refuses a missing token, a missing option and an unreadable bundle", async () => {
    delete process.env.CLOUDFLARE_API_TOKEN;
    await expect(platform(install(), io)).rejects.toThrow(/CLOUDFLARE_API_TOKEN/);
    process.env.CLOUDFLARE_API_TOKEN = TOKEN;
    await expect(platform(["install", "--account", "a"], io)).rejects.toThrow(/Usage/);
    await expect(
      platform(
        install().map((a) => (a === "gateway.js" ? "nope.js" : a)),
        io,
      ),
    ).rejects.toThrow(/Cannot read the gateway bundle/);
    await expect(platform(["uninstall"], io)).rejects.toThrow(/Usage/);
  });

  describe("--auth wrangler", () => {
    const secretOf = (cf: ReturnType<typeof fakeCloudflare>) =>
      (
        cf.calls.find((c) => c.path.endsWith("/versions"))!.body!.bindings as Array<
          Record<string, string>
        >
      ).find((b) => b.name === "CLOUDFLARE_API_TOKEN");

    it("calls Cloudflare with the wrangler token, run without a shell, and does not store it", async () => {
      delete process.env.CLOUDFLARE_API_TOKEN;
      const cf = fakeCloudflare(SESSION);
      expect(await platform(install(["--auth", "wrangler"]), io, { fetch: cf.fetcher })).toBe(0);
      expect(io.capture).toHaveBeenCalledWith("wrangler", ["auth", "token"], dir);
      expect(secretOf(cf)).toBeUndefined();
      expect(JSON.stringify(cf.calls)).not.toContain(SESSION);
      const output = logs.join("\n");
      expect(output).toContain("WITHOUT a CLOUDFLARE_API_TOKEN secret");
      expect(output).not.toContain(SESSION);
    });

    it("stores GATEWAY_CLOUDFLARE_API_TOKEN as the gateway's secret when given", async () => {
      process.env.GATEWAY_CLOUDFLARE_API_TOKEN = GATEWAY;
      const cf = fakeCloudflare(SESSION);
      await platform(install(["--auth", "wrangler"]), io, { fetch: cf.fetcher });
      expect(secretOf(cf)).toEqual({
        type: "secret_text",
        name: "CLOUDFLARE_API_TOKEN",
        text: GATEWAY,
      });
      expect(JSON.stringify(cf.calls)).not.toContain(SESSION);
      expect([...logs, ...errors].join("\n")).not.toContain(GATEWAY);
    });

    it("tells the person to run wrangler login when wrangler is missing, fails or prints nothing usable", async () => {
      for (const capture of [
        async () => {
          throw new Error(`spawn wrangler ENOENT ${SESSION}`);
        },
        async () => ({ code: 1, stdout: SESSION }),
        async () => ({ code: 0, stdout: "" }),
        async () => ({ code: 0, stdout: `${SESSION}\nother` }),
      ]) {
        io.capture = capture;
        const failure = await platform(install(["--auth", "wrangler"]), io, {
          fetch: fakeCloudflare(SESSION).fetcher,
        }).then(
          () => new Error("did not fail"),
          (e: unknown) => e as Error,
        );
        expect(failure.name).toBe("UsageError");
        expect(failure.message).toContain("wrangler login");
        expect(failure.message).not.toContain(SESSION);
      }
    });
  });

  it("refuses oauth without any effect, and an unknown --auth with the supported names", async () => {
    const cf = fakeCloudflare();
    await expect(platform(install(["--auth", "oauth"]), io, { fetch: cf.fetcher })).rejects.toThrow(
      /planned, not available/,
    );
    await expect(platform(install(["--auth", "nope"]), io, { fetch: cf.fetcher })).rejects.toThrow(
      /token, wrangler, oauth/,
    );
    expect(cf.calls).toHaveLength(0);
    expect(io.capture).not.toHaveBeenCalled();
  });

  it("does not look at wrangler without --auth", async () => {
    await platform(install(), io, { fetch: fakeCloudflare().fetcher });
    expect(io.capture).not.toHaveBeenCalled();
  });
});
