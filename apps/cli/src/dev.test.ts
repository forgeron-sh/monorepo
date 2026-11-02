import { cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { startDev, type DevSession } from "./dev";

const fixtures = fileURLToPath(new URL("../fixtures", import.meta.url));
const greeter = join(fixtures, "greeter");
const dbping = join(fixtures, "dbping");

const sessions: DevSession[] = [];
const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(sessions.splice(0).map((s) => s.stop()));
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

const dev = async (dir: string, options?: Parameters<typeof startDev>[1]) => {
  const session = await startDev(dir, options);
  sessions.push(session);
  return session;
};

const rpc = async (url: string, method: string, params?: unknown) => {
  const response = await fetch(`${url}/mcp`, {
    method: "POST",
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  return ((await response.json()) as { result: Record<string, unknown> }).result;
};

describe("forgeron dev", () => {
  it("builds the tool, runs it in workerd and exposes its MCP endpoint", async () => {
    const session = await dev(greeter);
    expect(session.name).toBe("greeter");
    expect(session.url).toMatch(/^http:\/\/127\.0\.0\.1:\d+$/);

    const { tools } = (await rpc(session.url, "tools/list")) as { tools: Array<{ name: string }> };
    expect(tools.map((t) => t.name)).toEqual(["greeter_hello"]);
  }, 60_000);

  it("calls an action as the local developer", async () => {
    const session = await dev(greeter);
    const result = await rpc(session.url, "tools/call", {
      name: "greeter_hello",
      arguments: { name: "Ely" },
    });
    expect(result.structuredContent).toEqual({ message: "Hello, Ely!", as: "dev" });
  }, 60_000);

  it("gives a tool with a database its D1 binding, in workerd", async () => {
    const session = await dev(dbping);
    const result = await rpc(session.url, "tools/call", { name: "dbping_db_ping", arguments: {} });
    expect(result.structuredContent).toEqual({ one: 1 });
  }, 60_000);

  describe("with a database", () => {
    // A copy inside the repository, so that `@forgeron/sdk` resolves; its local database is its own.
    const copy = async (name: string) => {
      const dir = join(fixtures, `.work-${name}-${Date.now()}`);
      dirs.push(dir);
      await cp(dbping, dir, { recursive: true, filter: (src) => !src.includes(".forgeron") });
      return dir;
    };
    // An object comes back as structured content, an array as JSON text.
    const call = async (url: string, tool: string, args: object = {}) => {
      const result = (await rpc(url, "tools/call", { name: tool, arguments: args })) as {
        structuredContent?: unknown;
        isError?: boolean;
        content?: Array<{ text: string }>;
      };
      const data = result.structuredContent ?? JSON.parse(result.content?.[0]?.text ?? "null");
      return { ...result, data };
    };

    it("applies the migrations before serving: the tables are there", async () => {
      const session = await dev(await copy("db-tables"));
      expect(
        (await call(session.url, "dbping_things_add", { name: "first" })).structuredContent,
      ).toEqual({ name: "first" });
      expect((await call(session.url, "dbping_things_list")).data).toEqual([{ name: "first" }]);
    }, 90_000);

    it("keeps the local database from one session to the next", async () => {
      const dir = await copy("db-persist");
      const first = await startDev(dir);
      await call(first.url, "dbping_things_add", { name: "kept" });
      await first.stop();

      const second = await dev(dir);
      expect((await call(second.url, "dbping_things_list")).data).toEqual([{ name: "kept" }]);
    }, 120_000);

    it("applies a migration added while running, and keeps the data", async () => {
      const dir = await copy("db-reload");
      const session = await dev(dir);
      await call(session.url, "dbping_things_add", { name: "before" });

      await writeFile(
        join(dir, "db", "schema.ts"),
        'import { schema, t, table } from "@forgeron/sdk/db";\n\nexport default schema({ things: table("things", { id: t.id(), name: t.text().notNull(), note: t.text() }) });\n',
      );
      const { generateMigration } = await import("@forgeron/compiler");
      expect((await generateMigration(dir))?.name).toBe("0002_update");
      await session.reload();

      expect((await call(session.url, "dbping_things_list")).data).toEqual([{ name: "before" }]);
    }, 120_000);

    it("keeps serving the previous build when a migration fails, and its data", async () => {
      const dir = await copy("db-fail");
      const session = await dev(dir);
      await call(session.url, "dbping_things_add", { name: "safe" });

      await writeFile(
        join(dir, "db", "migrations", "0002_broken.ts"),
        'import { migration } from "@forgeron/sdk/db";\nexport default migration({ up: ["CREATE TABLE \\"ok\\" (\\"id\\" TEXT)", "INSERT INTO nope VALUES (1)"], down: [] });\n',
      );
      // Its snapshot matches the schema: only the migration is wrong.
      await expect(session.reload()).rejects.toThrow(/0002_broken failed and was rolled back/);
      expect((await call(session.url, "dbping_things_list")).data).toEqual([{ name: "safe" }]);
    }, 120_000);

    it("refuses a migration that was applied and then edited", async () => {
      const dir = await copy("db-edited");
      const session = await dev(dir);
      const file = join(dir, "db", "migrations", "0001_init.ts");
      await writeFile(file, `${await readFile(file, "utf8")}\n// edited after it was applied\n`);
      await expect(session.reload()).rejects.toThrow(
        /0001_init was applied and its file has changed/,
      );
    }, 120_000);
  });

  it("exposes the other interfaces too", async () => {
    const session = await dev(greeter);
    expect(await (await fetch(`${session.url}/api/hello?name=Ely`)).json()).toMatchObject({
      message: "Hello, Ely!",
    });
    const cli = (await (await fetch(`${session.url}/cli`)).json()) as { tool: string };
    expect(cli.tool).toBe("greeter");
  }, 60_000);

  it("keeps the URL and serves the new code after a reload", async () => {
    // A copy inside the repository, so that `@forgeron/sdk` still resolves.
    const copy = join(fixtures, `.work-${Date.now()}`);
    dirs.push(copy);
    await cp(greeter, copy, { recursive: true, filter: (src) => !src.includes(".forgeron") });

    const session = await dev(copy);
    const before = (await rpc(session.url, "tools/list")) as {
      tools: Array<{ description: string }>;
    };
    expect(before.tools[0]?.description).toBe("Says hello.");

    const file = join(copy, "actions", "hello.ts");
    await writeFile(
      file,
      (await readFile(file, "utf8")).replace("Says hello.", "Says hello, loudly."),
    );
    await session.reload();

    const after = (await rpc(session.url, "tools/list")) as {
      tools: Array<{ description: string }>;
    };
    expect(after.tools[0]?.description).toBe("Says hello, loudly.");
  }, 90_000);

  it("keeps serving the previous build when the new one does not build", async () => {
    const copy = join(fixtures, `.work-${Date.now()}-broken`);
    dirs.push(copy);
    await cp(greeter, copy, { recursive: true, filter: (src) => !src.includes(".forgeron") });
    const session = await dev(copy);

    await writeFile(join(copy, "actions", "hello.ts"), "export default { not: 'an action' };\n");
    await expect(session.reload()).rejects.toThrow(/not an action/);

    const { tools } = (await rpc(session.url, "tools/list")) as { tools: Array<{ name: string }> };
    expect(tools.map((t) => t.name)).toEqual(["greeter_hello"]);
  }, 90_000);

  it("refuses a folder that is not a tool", async () => {
    const empty = await mkdtemp(join(tmpdir(), "forgeron-dev-"));
    dirs.push(empty);
    await expect(startDev(empty)).rejects.toThrow(/package\.json|ENOENT/);
  });
});
