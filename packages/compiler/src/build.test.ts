import { ManifestSchema } from "@forgeron/manifest";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { createTestTool } from "@forgeron/sdk/testing";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { buildAll, buildTool, discoverTools, fingerprintSources, type BuildResult } from "./index";

const fixture = (name: string) => fileURLToPath(new URL(`../fixtures/${name}`, import.meta.url));

describe("discoverTools", () => {
  let root: string;
  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), "forgeron-discover-"));
    for (const dir of ["one", "group/two", "node_modules/dep", ".git/x", "one/.forgeron/build"]) {
      await mkdir(join(root, dir), { recursive: true });
      await writeFile(join(root, dir, "forgeron.config.ts"), "export default {};");
    }
    await mkdir(join(root, "no-tool"), { recursive: true });
    await writeFile(join(root, "no-tool", "index.ts"), "");
  });
  afterAll(() => rm(root, { recursive: true, force: true }));

  it("finds every folder with a config, at any depth", async () => {
    const found = await discoverTools(root);
    expect(found.map((dir) => dir.slice(root.length + 1))).toEqual(["group/two", "one"]);
  });

  it("finds a tool at the root itself", async () => {
    expect(await discoverTools(join(root, "one"))).toEqual([join(root, "one")]);
  });
});

describe("buildTool", () => {
  let result: BuildResult;
  const out = (file: string) => join(result.outDir, file);
  const json = async (file: string) => JSON.parse(await readFile(out(file), "utf8"));

  beforeAll(async () => {
    result = await buildTool(fixture("hello"));
  }, 60_000);

  it("writes the Worker, the manifest and the build record, and nothing else", async () => {
    const { readdir } = await import("node:fs/promises");
    expect((await readdir(result.outDir)).sort()).toEqual([
      "build.json",
      "manifest.json",
      "worker.js",
    ]);
  });

  it("reports the tool and the version of its package.json", () => {
    expect(result).toMatchObject({ name: "hello", version: "1.4.0" });
  });

  it("writes a manifest that validates", async () => {
    expect(ManifestSchema.safeParse(await json("manifest.json")).success).toBe(true);
  });

  it("names actions after their path, and ignores files starting with an underscore", async () => {
    const { actions } = await json("manifest.json");
    expect(Object.keys(actions).sort()).toEqual(["ping", "tickets.greet", "tickets.purge"]);
  });

  it("describes an action with its JSON Schema, from the Zod schema", async () => {
    const { actions } = await json("manifest.json");
    expect(actions["tickets.greet"]).toMatchObject({
      description: "Greets someone.",
      access: "read",
      input: {
        type: "object",
        properties: {
          name: { type: "string", description: "Who to greet" },
          loud: { type: "boolean", default: false },
        },
        required: ["name"],
      },
      output: { type: "object", properties: { message: { type: "string" } } },
    });
    expect(actions["tickets.greet"].input.$schema).toBeUndefined();
  });

  it("resolves the defaults", async () => {
    const { actions } = await json("manifest.json");
    expect(actions.ping).toMatchObject({
      confirm: false,
      cli: { args: [] },
      http: { method: "GET" },
      interfaces: ["mcp", "api", "cli"],
    });
    // A deletion asks for confirmation and is a POST; `interfaces` narrows what the tool exposes.
    expect(actions["tickets.purge"]).toMatchObject({
      confirm: true,
      cli: { args: ["id"] },
      http: { method: "POST" },
      interfaces: ["mcp", "cli"],
    });
  });

  it("exposes only the interfaces the config lists", async () => {
    expect((await json("manifest.json")).interfaces).toEqual({
      mcp: true,
      api: true,
      cli: true,
      web: false,
    });
  });

  it("carries roles, resources and scheduled tasks", async () => {
    const manifest = await json("manifest.json");
    expect(manifest.roles.support.grants).toEqual(["read", "write"]);
    expect(manifest.resources.network.allow).toEqual(["api.example.com"]);
    expect(manifest.jobs).toEqual({ nightly: { cron: "0 2 * * *", timezone: "Europe/Paris" } });
  });

  it("records a fingerprint of the code and the hash of each file", async () => {
    const record = await json("build.json");
    expect(record.fingerprint).toMatch(/^[0-9a-f]{64}$/);
    expect(record).toMatchObject({
      name: "hello",
      version: "1.4.0",
      fingerprint: result.fingerprint,
    });
    expect(Object.keys(record.files)).toEqual(["worker.js", "manifest.json"]);
  });

  it("gives the same fingerprint to the same code", async () => {
    expect((await buildTool(fixture("hello"))).fingerprint).toBe(result.fingerprint);
  }, 60_000);

  it("builds a Worker that serves the tool", async () => {
    const worker = (await import(pathToFileURL(out("worker.js")).href)) as {
      default: { fetch(request: Request): Promise<Response> };
    };
    const asked = (path: string, init: RequestInit = {}) =>
      worker.default.fetch(
        new Request(`https://tool.test${path}`, {
          ...init,
          headers: {
            "x-forgeron-user": JSON.stringify({
              id: "u1",
              email: "a@b.c",
              name: "A",
              roles: ["reader"],
            }),
          },
        }),
      );

    const greeted = await asked("/api/tickets.greet?name=Ely&loud=");
    expect(greeted.status).toBe(400);

    const post = await asked("/api/tickets.greet", { method: "POST", body: '{"name":"Ely"}' });
    expect(post.status).toBe(405);

    const ping = await asked("/api/ping");
    expect(await ping.json()).toEqual({ pong: true });

    const mcp = await asked("/mcp", {
      method: "POST",
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    const { result: listed } = (await mcp.json()) as { result: { tools: Array<{ name: string }> } };
    expect(listed.tools.map((t) => t.name).sort()).toEqual(["hello_ping", "hello_tickets_greet"]);
  });

  it("builds a Worker that `createTestTool` can run, with the platform of a test", async () => {
    const tool = await createTestTool({ dir: result.dir, as: { roles: ["support"] } });
    expect(await tool.call("ping")).toEqual({ pong: true });
    expect(await tool.call("tickets.greet", { name: "Ely", loud: true })).toEqual({
      message: "HELLO, ELY!",
    });
    // `tickets.purge` needs "delete", which no role of the tool grants.
    await expect(tool.call("tickets.purge", { id: "1" })).rejects.toMatchObject({
      code: "FORBIDDEN",
    });
    await expect(tool.call("tickets.greet", { loud: true })).rejects.toMatchObject({
      code: "INVALID",
    });
  });

  it("refuses a call that carries no identity", async () => {
    const worker = (await import(pathToFileURL(out("worker.js")).href)) as {
      default: { fetch(request: Request): Promise<Response> };
    };
    const response = await worker.default.fetch(new Request("https://tool.test/api/ping"));
    expect(response.status).toBe(401);
  });
});

describe("failures", () => {
  it("names the file whose default export is not an action", async () => {
    await expect(buildTool(fixture("broken"))).rejects.toThrow(/actions\/oops.*not an action/);
  }, 60_000);

  it("refuses a tool whose package.json has no version", async () => {
    const dir = await mkdtemp(join(tmpdir(), "forgeron-noversion-"));
    await writeFile(join(dir, "package.json"), "{}");
    await expect(buildTool(dir)).rejects.toThrow(/no version/);
    await rm(dir, { recursive: true, force: true });
  });

  it("refuses two tools with the same name", async () => {
    await expect(buildAll(fixture("dup"))).rejects.toThrow(/Two tools are named "twin"/);
  }, 60_000);
});

describe("fingerprintSources", () => {
  let dir: string;
  beforeAll(async () => {
    dir = await mkdtemp(join(tmpdir(), "forgeron-fingerprint-"));
    await mkdir(join(dir, "actions"), { recursive: true });
    await writeFile(join(dir, "actions", "a.ts"), "export default 1;");
  });
  afterAll(() => rm(dir, { recursive: true, force: true }));

  it("changes when a source file changes", async () => {
    const before = await fingerprintSources(dir);
    await writeFile(join(dir, "actions", "a.ts"), "export default 2;");
    expect(await fingerprintSources(dir)).not.toBe(before);
  });

  it("changes when a file is added", async () => {
    const before = await fingerprintSources(dir);
    await writeFile(join(dir, "lib.ts"), "");
    expect(await fingerprintSources(dir)).not.toBe(before);
  });

  it("ignores node_modules and the build output", async () => {
    const before = await fingerprintSources(dir);
    for (const ignored of ["node_modules/x", ".forgeron/build"]) {
      await mkdir(join(dir, ignored), { recursive: true });
      await writeFile(join(dir, ignored, "f.js"), "noise");
    }
    expect(await fingerprintSources(dir)).toBe(before);
  });
});
