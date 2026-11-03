import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Io } from "../io";
import { platform } from "./platform";

// A throwaway value: it protects nothing and is not a secret.
const TOKEN = "test-token-not-a-real-secret";
const SESSION = "test-session-token-not-a-real-secret";
const GATEWAY = "test-gateway-token-not-a-real-secret";

// Throwaway JWTs of the simulated asset upload: they protect nothing.
const UPLOAD_JWT = "test-upload-jwt";
const COMPLETION_JWT = "test-completion-jwt";
const ZONE = { id: "zone-1", name: "forgeron.example.test" };

interface Calls {
  method: string;
  path: string;
  body?: Record<string, unknown>;
}

/** A simulated Cloudflare account: only the routes the install calls. */
function fakeCloudflare(
  expected = TOKEN,
  zones: Array<{ id: string; name: string }> = [ZONE],
  /** The environments the registry holds (what a tool deployment registered). */
  environments: Array<{
    workspace: string;
    tool: string;
    environment: string;
    branch: string;
  }> = [],
) {
  const calls: Calls[] = [];
  const databases = new Map<string, string>();
  const workers = new Set<string>();
  const versions: Array<Array<{ type: string; name: string; text?: string }>> = [];
  const stored = new Set<string>();
  const uploaded: Record<string, string>[] = [];
  const records: Array<{ id: string; name: string; proxied: boolean }> = [];
  const routes: Array<{ id: string; pattern: string; script: string }> = [];
  const ok = (result: unknown) => Response.json({ success: true, errors: [], result });
  const missing = () =>
    Response.json(
      { success: false, errors: [{ message: "not found" }], result: null },
      { status: 404 },
    );
  const fetcher: typeof fetch = async (input, init) => {
    const url = new URL(String(input));
    const method = init?.method ?? "GET";
    const path = url.pathname.replace(/^\/client\/v4(\/accounts\/[^/]+)?/, "");
    const body =
      init?.body && typeof init.body === "string"
        ? (JSON.parse(String(init.body)) as Record<string, unknown>)
        : undefined;
    calls.push({ method, path, ...(body ? { body } : {}) });
    // The asset upload is the one call Cloudflare authorises with the session's JWT, not the API token.
    expect(new Headers(init?.headers).get("authorization")).toBe(
      path === "/workers/assets/upload" ? `Bearer ${UPLOAD_JWT}` : `Bearer ${expected}`,
    );
    let m: RegExpMatchArray | null;
    if (method === "POST" && /^\/workers\/scripts\/[^/]+\/assets-upload-session$/.test(path)) {
      // Like Cloudflare: only the files it does not hold yet are asked for.
      const wanted = Object.values(body!.manifest as Record<string, { hash: string }>)
        .map((f) => f.hash)
        .filter((h) => !stored.has(h));
      return ok({
        jwt: wanted.length ? UPLOAD_JWT : COMPLETION_JWT,
        buckets: wanted.length ? [wanted] : [],
      });
    }
    if (method === "POST" && path === "/workers/assets/upload") {
      if (url.searchParams.get("base64") !== "true") return missing();
      const form = init!.body as FormData;
      const part: Record<string, string> = {};
      for (const [hash, file] of form.entries()) {
        stored.add(hash);
        part[hash] = `${(file as Blob).type}:${await (file as Blob).text()}`;
      }
      uploaded.push(part);
      return Response.json(
        { success: true, errors: [], result: { jwt: COMPLETION_JWT } },
        { status: 201 },
      );
    }
    if (method === "GET" && path === "/zones") {
      // Only the zones of the account in the query, like Cloudflare's `account.id` filter.
      if (url.searchParams.get("account.id") !== "acc-1") return ok([]);
      return ok(zones.filter((z) => z.name === url.searchParams.get("name")));
    }
    if ((m = path.match(/^\/zones\/([^/]+)\/dns_records$/))) {
      if (method === "GET")
        return ok(records.filter((r) => r.name === url.searchParams.get("name")));
      records.push({ id: "rec-1", name: String(body?.name), proxied: body?.proxied === true });
      return ok(records.at(-1));
    }
    if ((m = path.match(/^\/zones\/([^/]+)\/workers\/routes$/))) {
      if (method === "GET") return ok(routes);
      routes.push({ id: "route-1", pattern: String(body?.pattern), script: String(body?.script) });
      return ok(routes.at(-1));
    }
    if (method === "GET" && path === "/d1/database") {
      return ok([...databases].map(([uuid, name]) => ({ uuid, name })));
    }
    if (method === "POST" && path === "/d1/database") {
      databases.set("db-1", String(body?.name));
      return ok({ uuid: "db-1", name: body?.name });
    }
    if (method === "POST" && /^\/d1\/database\/[^/]+\/query$/.test(path)) {
      if (typeof body?.sql === "string" && body.sql.includes('FROM "environments"')) {
        return ok([{ results: environments }]);
      }
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
    if (method === "POST" && /\/versions$/.test(path)) {
      // `inherit` copies a binding from the latest earlier version, else error 10057 (one per name).
      const previous = versions.at(-1) ?? [];
      const wanted = (body!.bindings as Array<{ type: string; name: string }>) ?? [];
      const missing = wanted.filter(
        (b) => b.type === "inherit" && !previous.some((p) => p.name === b.name),
      );
      if (missing.length) {
        return Response.json(
          {
            success: false,
            errors: missing.map((b) => ({ code: 10057, message: `cannot inherit ${b.name}` })),
            result: null,
          },
          { status: 400 },
        );
      }
      versions.push(
        wanted.map((b) => (b.type === "inherit" ? previous.find((p) => p.name === b.name)! : b)),
      );
      return ok({ id: `version-${versions.length}` });
    }
    if (method === "POST" && /\/deployments$/.test(path)) return ok({ id: "deployment-1" });
    return missing();
  };
  return { fetcher, calls, databases, records, routes, uploaded, versions };
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
  delete process.env.OIDC_CLIENT_SECRET;
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

  it("attaches a proxied wildcard record and the route to the gateway, and changes nothing on a second run", async () => {
    const cf = fakeCloudflare();
    await platform(install(), io, { fetch: cf.fetcher });
    expect(cf.records).toEqual([{ id: "rec-1", name: "*.forgeron.example.test", proxied: true }]);
    expect(cf.routes).toEqual([
      { id: "route-1", pattern: "*.forgeron.example.test/*", script: "forgeron-gateway" },
    ]);
    const writes = cf.calls.filter((c) => c.method === "POST" && c.path.startsWith("/zones/"));
    expect(writes).toHaveLength(2);
    await platform(install(), io, { fetch: cf.fetcher });
    expect(
      cf.calls.filter((c) => c.method === "POST" && c.path.startsWith("/zones/")),
    ).toHaveLength(2);
    expect(logs.join("\n")).toContain('Found the route "*.forgeron.example.test/*"');
  });

  it("fails with a usage error when the zone is not on the account, or the route points elsewhere", async () => {
    await expect(
      platform(install(), io, { fetch: fakeCloudflare(TOKEN, []).fetcher }),
    ).rejects.toMatchObject({
      name: "UsageError",
      message: expect.stringContaining("not on this Cloudflare account"),
    });
    const cf = fakeCloudflare();
    cf.routes.push({ id: "r", pattern: "*.forgeron.example.test/*", script: "other" });
    await expect(platform(install(), io, { fetch: cf.fetcher })).rejects.toThrow(
      /already points to "other"/,
    );
  });

  describe("--console", () => {
    beforeEach(async () => {
      await mkdir(join(dir, "dist", "assets"), { recursive: true });
      await mkdir(join(dir, "dist", ".vite"));
      await writeFile(
        join(dir, "dist", "index.html"),
        "<!doctype html><title>Forgeron console</title>",
      );
      await writeFile(join(dir, "dist", "assets", "app.js"), "console.log(1);");
      await writeFile(join(dir, "dist", ".vite", "manifest.json"), "{}");
    });
    const versionOf = (cf: ReturnType<typeof fakeCloudflare>) =>
      cf.calls.find((c) => c.path.endsWith("/versions"))!.body!;

    it("uploads the build as assets, then deploys the gateway version with the completion token", async () => {
      const cf = fakeCloudflare();
      expect(await platform(install(["--console", "dist"]), io, { fetch: cf.fetcher })).toBe(0);
      const session = cf.calls.find((c) => c.path.endsWith("/assets-upload-session"))!;
      expect(session.path).toBe("/workers/scripts/forgeron-gateway/assets-upload-session");
      expect(Object.keys(session.body!.manifest as object)).toEqual([
        "/assets/app.js",
        "/index.html",
      ]);
      expect(cf.uploaded).toHaveLength(1);
      expect(Object.values(cf.uploaded[0]!).sort()).toEqual([
        `text/html:${btoa("<!doctype html><title>Forgeron console</title>")}`,
        `text/javascript:${btoa("console.log(1);")}`,
      ]);
      const version = versionOf(cf);
      expect(version.assets).toEqual({
        jwt: COMPLETION_JWT,
        config: { not_found_handling: "single-page-application", run_worker_first: true },
      });
      expect(version.bindings).toContainEqual({ type: "assets", name: "ASSETS" });
      expect(cf.calls.findIndex((c) => c.path.endsWith("/versions"))).toBeGreaterThan(
        cf.calls.findIndex((c) => c.path === "/workers/assets/upload"),
      );
      expect(logs.join("\n")).toContain("Deployed the console (2 files)");
      expect(logs.join("\n")).not.toContain("not deployed");
      expect(JSON.stringify(cf.calls)).not.toContain(".vite");
    });

    it("uploads nothing a second time: Cloudflare already holds the files", async () => {
      const cf = fakeCloudflare();
      await platform(install(["--console", "dist"]), io, { fetch: cf.fetcher });
      await platform(install(["--console", "dist"]), io, { fetch: cf.fetcher });
      expect(cf.uploaded).toHaveLength(1);
      expect((versionOf(cf).assets as { jwt: string }).jwt).toBe(COMPLETION_JWT);
    });

    it("says the console is not deployed without --console, and sends no assets", async () => {
      const cf = fakeCloudflare();
      await platform(install(), io, { fetch: cf.fetcher });
      expect(logs.join("\n")).toContain("The console is not deployed");
      expect(cf.calls.some((c) => c.path.includes("assets"))).toBe(false);
      expect(versionOf(cf).assets).toBeUndefined();
    });

    it("refuses a missing or empty build directory before calling Cloudflare", async () => {
      const cf = fakeCloudflare();
      await expect(
        platform(install(["--console", "nope"]), io, { fetch: cf.fetcher }),
      ).rejects.toThrow(/Cannot read the console build/);
      await mkdir(join(dir, "empty"));
      await expect(
        platform(install(["--console", "empty"]), io, { fetch: cf.fetcher }),
      ).rejects.toThrow(/no index.html/);
      expect(cf.calls).toHaveLength(0);
    });
  });

  describe("identity and keys", () => {
    const OIDC = [
      "--oidc-issuer",
      "https://login.example.test",
      "--oidc-client-id",
      "client-1",
      "--admin-email",
      "admin@example.test",
    ];
    const latest = (cf: ReturnType<typeof fakeCloudflare>) => cf.versions.at(-1)!;
    const named = (cf: ReturnType<typeof fakeCloudflare>, n: string) =>
      latest(cf).find((b) => b.name === n);

    it("generates AUTH_SECRET and SECRETS_KEY (32 random bytes, base64, different), never printed", async () => {
      const cf = fakeCloudflare();
      await platform(install(OIDC), io, { fetch: cf.fetcher });
      const auth = named(cf, "AUTH_SECRET")!;
      const box = named(cf, "SECRETS_KEY")!;
      for (const key of [auth, box]) {
        expect(key.type).toBe("secret_text");
        expect(Buffer.from(key.text!, "base64")).toHaveLength(32);
      }
      expect(auth.text).not.toBe(box.text);
      const output = [...logs, ...errors].join("\n");
      expect(output).not.toContain(auth.text!);
      expect(output).not.toContain(box.text!);
      expect(output).toContain("Generated the gateway keys AUTH_SECRET, SECRETS_KEY");
    });

    it("stores the OIDC settings; the client secret comes from the environment only", async () => {
      process.env.OIDC_CLIENT_SECRET = "test-oidc-secret-not-real";
      const cf = fakeCloudflare();
      await platform(install([...OIDC, "--member-email-domains", "Example.test, other.test"]), io, {
        fetch: cf.fetcher,
      });
      expect(named(cf, "OIDC_ISSUER")).toEqual({
        type: "plain_text",
        name: "OIDC_ISSUER",
        text: "https://login.example.test",
      });
      expect(named(cf, "OIDC_CLIENT_ID")?.text).toBe("client-1");
      expect(named(cf, "ADMIN_EMAIL")?.text).toBe("admin@example.test");
      expect(named(cf, "MEMBER_EMAIL_DOMAINS")?.text).toBe("example.test,other.test");
      expect(named(cf, "OIDC_CLIENT_SECRET")).toMatchObject({
        type: "secret_text",
        text: "test-oidc-secret-not-real",
      });
      expect([...logs, ...errors].join("\n")).not.toContain("test-oidc-secret-not-real");
      delete process.env.OIDC_CLIENT_SECRET;
    });

    it("keeps the existing keys and identity settings on a second run", async () => {
      const cf = fakeCloudflare();
      await platform(install(OIDC), io, { fetch: cf.fetcher });
      const first = [named(cf, "AUTH_SECRET"), named(cf, "SECRETS_KEY"), named(cf, "ADMIN_EMAIL")];
      logs.length = 0;
      await platform(install(), io, { fetch: cf.fetcher });
      expect([
        named(cf, "AUTH_SECRET"),
        named(cf, "SECRETS_KEY"),
        named(cf, "ADMIN_EMAIL"),
      ]).toEqual(first);
      expect(named(cf, "OIDC_ISSUER")?.text).toBe("https://login.example.test");
      expect(logs.join("\n")).toContain("Kept the gateway's existing keys");
      const raw = cf.calls.filter((c) => c.path.endsWith("/versions")).at(-1)!.body!;
      expect(JSON.stringify(raw.bindings)).toContain('{"type":"inherit","name":"AUTH_SECRET"}');
      expect(JSON.stringify(raw)).not.toContain(first[0]!.text!);
    });

    describe("tool bindings (D-031)", () => {
      const crm = { workspace: "acme", tool: "crm", environment: "production", branch: "" };

      it("stores the gateway code in the platform D1 and tells the gateway its own name", async () => {
        const cf = fakeCloudflare();
        await platform(install(), io, { fetch: cf.fetcher });
        const stored = cf.calls
          .filter((c) => c.path.endsWith("/query") && Array.isArray(c.body?.batch))
          .flatMap((c) => c.body!.batch as Array<{ sql: string; params: unknown[] }>)
          .filter((s) => s.sql.includes('INSERT INTO "gateway_code"'));
        expect(stored.map((s) => s.params[1]).join("")).toBe(
          "export default { fetch: () => new Response('ok') };",
        );
        expect(named(cf, "GATEWAY_WORKER")).toEqual({
          type: "plain_text",
          name: "GATEWAY_WORKER",
          text: "forgeron-gateway",
        });
      });

      it("carries over the TOOL_<WORKER> bindings of the tools already bound, without sending them", async () => {
        const cf = fakeCloudflare(TOKEN, [ZONE], [crm]);
        await platform(install(), io, { fetch: cf.fetcher });
        // The gateway as a tool deployment left it: the Worker bound.
        cf.versions[cf.versions.length - 1]!.push({
          type: "service",
          name: "TOOL_ACME__CRM__PRODUCTION",
          service: "acme--crm--production",
        } as never);
        await platform(install(), io, { fetch: cf.fetcher });
        const upload = cf.calls.filter((c) => c.path.endsWith("/versions")).at(-1)!.body!;
        expect(upload.bindings).toContainEqual({
          type: "inherit",
          name: "TOOL_ACME__CRM__PRODUCTION",
        });
        expect(latest(cf).map((b) => b.name)).toContain("TOOL_ACME__CRM__PRODUCTION");
        expect(latest(cf).find((b) => b.name === "TOOL_ACME__CRM__PRODUCTION")).toMatchObject({
          type: "service",
          service: "acme--crm--production",
        });
      });

      it("installs anyway when a registered tool has no binding to carry over, and says so", async () => {
        const cf = fakeCloudflare(TOKEN, [ZONE], [crm]);
        await platform(install(), io, { fetch: cf.fetcher });
        logs.length = 0;
        expect(await platform(install(), io, { fetch: cf.fetcher })).toBe(0);
        expect(latest(cf).some((b) => b.name === "TOOL_ACME__CRM__PRODUCTION")).toBe(false);
        expect(logs.join("\n")).toContain("TOOL_ACME__CRM__PRODUCTION");
        expect(logs.join("\n")).toContain("not bound until they are deployed again");
      });
    });

    it("generates only the key a previous version lacks, and keeps the other", async () => {
      const cf = fakeCloudflare();
      await platform(install(OIDC), io, { fetch: cf.fetcher });
      const auth = named(cf, "AUTH_SECRET")!;
      // An earlier install that predates SECRETS_KEY.
      cf.versions[cf.versions.length - 1] = latest(cf).filter((b) => b.name !== "SECRETS_KEY");
      logs.length = 0;
      await platform(install(), io, { fetch: cf.fetcher });
      expect(named(cf, "AUTH_SECRET")).toEqual(auth);
      expect(Buffer.from(named(cf, "SECRETS_KEY")!.text!, "base64")).toHaveLength(32);
      expect(logs.join("\n")).toContain("Generated the gateway keys SECRETS_KEY");
    });

    it("refuses an identity provider that is incomplete or badly shaped, before calling Cloudflare", async () => {
      const cf = fakeCloudflare();
      const bad: Array<[string[], RegExp]> = [
        [["--oidc-issuer", "https://login.example.test"], /together/],
        [["--oidc-client-id", "c"], /together/],
        [
          [
            "--oidc-issuer",
            "http://login.example.test",
            "--oidc-client-id",
            "c",
            "--admin-email",
            "a@b.co",
          ],
          /https/,
        ],
        [
          ["--oidc-issuer", "not a url", "--oidc-client-id", "c", "--admin-email", "a@b.co"],
          /must be a URL/,
        ],
        [
          ["--oidc-issuer", "https://x.test", "--oidc-client-id", "a b", "--admin-email", "a@b.co"],
          /client-id/,
        ],
        [
          ["--oidc-issuer", "https://x.test", "--oidc-client-id", "c", "--admin-email", "nope"],
          /email/,
        ],
        [["--oidc-issuer", "https://x.test", "--oidc-client-id", "c"], /Nobody could sign in/],
        [
          [
            "--oidc-issuer",
            "https://x.test",
            "--oidc-client-id",
            "c",
            "--member-email-domains",
            "a b",
          ],
          /domains/,
        ],
      ];
      for (const [extra, message] of bad) {
        await expect(platform(install(extra), io, { fetch: cf.fetcher })).rejects.toThrow(message);
      }
      process.env.OIDC_CLIENT_SECRET = "has space";
      await expect(platform(install(OIDC), io, { fetch: cf.fetcher })).rejects.toThrow(
        /OIDC_CLIENT_SECRET/,
      );
      delete process.env.OIDC_CLIENT_SECRET;
      process.env.OIDC_CLIENT_SECRET = "secret-without-provider";
      await expect(platform(install(), io, { fetch: cf.fetcher })).rejects.toThrow(/together/);
      delete process.env.OIDC_CLIENT_SECRET;
      expect(cf.calls).toHaveLength(0);
    });

    it("says sign-in is not configured when no identity flag is given on a first install", async () => {
      const cf = fakeCloudflare();
      await platform(install(), io, { fetch: cf.fetcher });
      expect(logs.join("\n")).toContain("Sign-in is NOT configured");
      expect(named(cf, "OIDC_ISSUER")).toBeUndefined();
    });
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
