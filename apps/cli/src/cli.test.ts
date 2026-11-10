import { createTestTool } from "@forgeron/sdk/testing";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { cp, mkdir, mkdtemp, readdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { run } from "./cli";
import { checkShell } from "./commands/db";
import type { Io } from "./io";

const fixtures = fileURLToPath(new URL("../fixtures", import.meta.url));
const here = fileURLToPath(new URL(".", import.meta.url));

interface Captured {
  io: Io;
  logs: string[];
  errors: string[];
  stop: () => void;
  exec: ReturnType<typeof vi.fn<Io["exec"]>>;
}

const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

function capture(cwd: string): Captured {
  const logs: string[] = [];
  const errors: string[] = [];
  let stop!: () => void;
  const stopped = new Promise<void>((resolve) => (stop = resolve));
  const exec = vi.fn<Io["exec"]>(async () => 0);
  return {
    io: {
      cwd,
      log: (m) => void logs.push(m),
      error: (m) => void errors.push(m),
      exec,
      capture: async () => ({ code: 0, stdout: "" }),
      stopped,
    },
    logs,
    errors,
    stop,
    exec,
  };
}

const empty = async () => {
  const dir = await mkdtemp(join(tmpdir(), "forgeron-cli-"));
  dirs.push(dir);
  return dir;
};

// A tool inside the repository, so that `@forgeron/sdk` resolves.
const work = async (name: string) => {
  const dir = join(fixtures, `.work-${name}-${Date.now()}`);
  dirs.push(dir);
  await cp(join(fixtures, "greeter"), dir, {
    recursive: true,
    filter: (s) => !s.includes(".forgeron"),
  });
  return dir;
};

const json = async (path: string) =>
  JSON.parse(await readFile(path, "utf8")) as Record<string, unknown>;

describe("forgeron", () => {
  it("prints the version", async () => {
    const c = capture("/");
    expect(await run(["--version"], c.io)).toBe(0);
    expect(c.logs).toEqual(["forgeron 0.0.0"]);
  });

  it("shows the usage when there is no command", async () => {
    const c = capture("/");
    expect(await run([], c.io)).toBe(0);
    expect(c.errors[0]).toContain("Usage: forgeron <command>");
  });

  it("exits 2 on an unknown command, and on an unknown flag", async () => {
    const c = capture("/");
    expect(await run(["frobnicate"], c.io)).toBe(2);
    expect(c.errors[0]).toContain('unknown command "frobnicate"');
    const d = capture("/");
    expect(await run(["build", "--nope"], d.io)).toBe(2);
  });
});

describe("forgeron init", () => {
  it("creates a tool in a new folder, with .forgeron/project.json", async () => {
    const root = await empty();
    const c = capture(root);
    expect(await run(["init", "my-tool"], c.io)).toBe(0);

    const dir = join(root, "my-tool");
    expect(await json(join(dir, ".forgeron", "project.json"))).toEqual({ tool: "my-tool" });
    expect(await json(join(dir, "package.json"))).toMatchObject({
      name: "my-tool",
      version: "0.1.0",
    });
    expect(await readFile(join(dir, "forgeron.config.ts"), "utf8")).toContain('name: "my-tool"');
    expect(await readFile(join(dir, ".forgeron", ".gitignore"), "utf8")).toBe(
      "local/\ngenerated/\nbuild/\n",
    );
    await expect(stat(join(dir, "changes"))).resolves.toBeDefined();
    expect(c.logs[0]).toContain("Created my-tool");
  });

  it("uses the current folder, named after it, when no name is given", async () => {
    const root = await empty();
    const dir = join(root, "from-cwd");
    await mkdir(dir);
    const c = capture(dir);
    expect(await run(["init"], c.io)).toBe(0);
    expect((await json(join(dir, ".forgeron", "project.json"))).tool).toBe("from-cwd");
  });

  it("refuses a folder that is not empty, and writes nothing in it", async () => {
    const root = await empty();
    await run(["init", "my-tool"], capture(root).io);
    const c = capture(root);
    expect(await run(["init", "my-tool"], c.io)).toBe(2);
    expect(c.errors[0]).toContain("is not empty");
  });

  it.each(["My Tool", "UPPER", "a_b"])("refuses the name %s", async (name) => {
    const root = await empty();
    const c = capture(root);
    expect(await run(["init", name], c.io)).toBe(2);
    expect(c.errors[0]).toContain("is not a tool name");
  });

  describe("--template", () => {
    let server: Server;
    let registry = "";
    const packed = mkdtempSync(join(tmpdir(), "forgeron-pack-"));
    let tarball = new Uint8Array();

    beforeAll(async () => {
      const crm = join(here, "../../../templates/crm");
      const out = spawnSync("bun", ["pm", "pack", "--destination", packed], { cwd: crm });
      if (out.status !== 0) throw new Error(out.stderr.toString());
      tarball = new Uint8Array(readFileSync(join(packed, readdirSync(packed)[0] as string)));
      server = createServer((req, res) => {
        if (req.url?.startsWith("/-/v1/search")) {
          res.end(
            JSON.stringify({
              objects: [
                {
                  package: {
                    name: "@forgeron/template-crm",
                    version: "0.0.0",
                    description: "Sales CRM",
                  },
                },
                {
                  package: {
                    name: "@forgeron/template-stock",
                    version: "1.2.0",
                    description: "Inventory",
                  },
                },
                {
                  package: { name: "@forgeron/sdk", version: "0.0.0", description: "crm helpers" },
                },
              ],
            }),
          );
        } else if (req.url?.endsWith("%2Ftemplate-crm/latest")) {
          res.end(JSON.stringify({ version: "0.0.0", dist: { tarball: `${registry}/crm.tgz` } }));
        } else if (req.url === "/crm.tgz") {
          res.end(tarball);
        } else {
          res.statusCode = 404;
          res.end("{}");
        }
      });
      await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
      registry = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
      process.env.FORGERON_REGISTRY = registry;
    });
    afterAll(async () => {
      delete process.env.FORGERON_REGISTRY;
      await new Promise((done) => server.close(done));
      rmSync(packed, { recursive: true, force: true });
    });

    it("creates the tool from the published package", async () => {
      const root = await empty();
      const c = capture(root);
      expect(await run(["init", "sales", "--template", "crm"], c.io)).toBe(0);
      const dir = join(root, "sales");
      const pkg = JSON.parse(await readFile(join(dir, "package.json"), "utf8"));
      expect(pkg).toMatchObject({ name: "sales", version: "0.1.0", private: true });
      expect(pkg.dependencies["@forgeron/sdk"]).toBe("0.0.0");
      expect(await readFile(join(dir, "forgeron.config.ts"), "utf8")).toContain('name: "sales"');
      await expect(readFile(join(dir, "actions/deals/create.ts"), "utf8")).resolves.toContain(
        "action(",
      );
      expect(JSON.parse(await readFile(join(dir, ".forgeron/project.json"), "utf8"))).toEqual({
        tool: "sales",
      });
      expect(c.logs.join("\n")).toContain("from template crm@0.0.0");
    });

    it("searches the catalog by name and description, templates only", async () => {
      const c = capture(await empty());
      expect(await run(["catalog", "search", "crm"], c.io)).toBe(0);
      expect(c.logs).toEqual(["crm  0.0.0  Sales CRM"]);
      const d = capture(await empty());
      expect(await run(["catalog", "search", "inventory"], d.io)).toBe(0);
      expect(d.logs).toEqual(["stock  1.2.0  Inventory"]);
      const e = capture(await empty());
      expect(await run(["catalog", "search", "zzz"], e.io)).toBe(0);
      expect(e.logs).toEqual(['No template matches "zzz".']);
    });

    it("shows the resources and installs only once approved", async () => {
      const root = await empty();
      const refused = capture(root);
      refused.io.confirm = async () => false;
      expect(await run(["install", "crm", "--name", "sales"], refused.io)).toBe(1);
      expect(refused.logs[0]).toContain("requests:");
      expect(refused.logs.join("\n")).toContain("Database (D1)");
      expect(refused.errors[0]).toContain("Not approved");
      await expect(stat(join(root, "sales", "package.json"))).rejects.toThrow("ENOENT");

      const noTerminal = capture(root);
      expect(await run(["install", "crm", "--name", "sales"], noTerminal.io)).toBe(1);
      expect(noTerminal.errors[0]).toContain("pass --yes");

      const approved = capture(root);
      approved.io.confirm = async () => true;
      expect(await run(["install", "crm", "--name", "sales"], approved.io)).toBe(0);
      const config = await readFile(join(root, "sales", "forgeron.config.ts"), "utf8");
      expect(config).toContain('name: "sales"');
      await expect(stat(join(root, "sales", ".forgeron/build"))).rejects.toThrow("ENOENT");
    });

    it("installs with --yes under the template's name by default", async () => {
      const root = await empty();
      const c = capture(root);
      expect(await run(["install", "crm", "--yes"], c.io)).toBe(0);
      await expect(stat(join(root, "crm", "package.json"))).resolves.toBeTruthy();
    });

    it("says when the template is not published", async () => {
      const c = capture(await empty());
      expect(await run(["init", "x", "--template", "nope"], c.io)).toBe(2);
      expect(c.errors[0]).toContain("No template named");
    });

    it("plays a template from a scratch copy and installs nothing", async () => {
      const root = await empty();
      const c = capture(root);
      const done = run(["play", "--template", "crm", "--no-open", "--port", "0"], c.io);
      await vi.waitFor(() => expect(c.logs.join("\n")).toContain("Playground of"), {
        timeout: 60_000,
      });
      expect(c.logs[0]).toContain("Template crm@0.0.0");
      const url = /Playground of \S+: (\S+)/.exec(c.logs.join("\n"))![1]!;
      const manifest = (await (await fetch(`${url}/_play/manifest`)).json()) as {
        actions: Record<string, unknown>;
      };
      expect(Object.keys(manifest.actions).length).toBeGreaterThan(0);
      expect(await readdir(root)).toEqual([]);
      c.stop();
      expect(await done).toBe(0);
      expect(await readdir(root)).toEqual([]);
    }, 120_000);

    it("exits 4 when the template to play does not exist", async () => {
      const root = await empty();
      const c = capture(root);
      expect(await run(["play", "--template", "nope"], c.io)).toBe(4);
      expect(c.errors[0]).toContain('No template named "nope"');
      expect(await readdir(root)).toEqual([]);
    });
  });

  describe("secrets", () => {
    let server: Server;
    let endpoint = "";
    const requests: Array<{ method: string; url: string; auth?: string; body: string }> = [];
    let status = 200;

    beforeAll(async () => {
      server = createServer((req, res) => {
        let body = "";
        req.on("data", (c) => (body += c));
        req.on("end", () => {
          requests.push({
            method: req.method ?? "",
            url: req.url ?? "",
            auth: req.headers.authorization,
            body,
          });
          res.statusCode = status === 200 && req.method === "PUT" ? 204 : status;
          res.setHeader("content-type", "application/json");
          res.end(req.method === "GET" ? JSON.stringify({ secrets: ["A_KEY", "B_KEY"] }) : "");
        });
      });
      await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
      endpoint = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
    });
    afterAll(async () => {
      delete process.env.FORGERON_TOKEN;
      await new Promise((done) => server.close(done));
    });

    const linked = async () => {
      const dir = await empty();
      await mkdir(join(dir, ".forgeron"), { recursive: true });
      await writeFile(
        join(dir, ".forgeron/project.json"),
        JSON.stringify({ tool: "crm", workspace: "acme", endpoint }),
      );
      requests.length = 0;
      status = 200;
      process.env.FORGERON_TOKEN = "test-token-not-real";
      return capture(dir);
    };

    it("reads the value from the keyboard and sends it in the body only", async () => {
      const c = await linked();
      const readSecret = vi.fn<NonNullable<Io["readSecret"]>>(async () => "typed-value");
      c.io.readSecret = readSecret;
      expect(await run(["secrets", "set", "ODOO_KEY", "--env", "production"], c.io)).toBe(0);
      expect(readSecret).toHaveBeenCalledOnce();
      expect(requests).toEqual([
        {
          method: "PUT",
          url: "/api/tools/crm/environments/production/secrets/ODOO_KEY",
          auth: "Bearer test-token-not-real",
          body: JSON.stringify({ value: "typed-value" }),
        },
      ]);
      expect(c.logs.join("\n")).not.toContain("typed-value");
    });

    it("refuses a value passed as an argument", async () => {
      const c = await linked();
      expect(await run(["secrets", "set", "ODOO_KEY", "oops"], c.io)).toBe(2);
      expect(requests).toEqual([]);
    });

    it("lists names, production by default", async () => {
      const c = await linked();
      expect(await run(["secrets", "list"], c.io)).toBe(0);
      expect(c.logs).toEqual(["A_KEY", "B_KEY"]);
      expect(requests[0]?.url).toBe("/api/tools/crm/environments/production/secrets");
    });

    it("explains a refused token and a missing link or token", async () => {
      const c = await linked();
      status = 403;
      expect(await run(["secrets", "list"], c.io)).toBe(1);
      expect(c.errors[0]).toContain("admin");
      delete process.env.FORGERON_TOKEN;
      expect(await run(["secrets", "list"], c.io)).toBe(2);
      expect(await run(["secrets", "list"], capture(await empty()).io)).toBe(2);
    });

    it("refuses an unknown environment and a bad name", async () => {
      const c = await linked();
      expect(await run(["secrets", "list", "--env", "dev"], c.io)).toBe(2);
      expect(await run(["secrets", "set", "lower"], c.io)).toBe(2);
    });
  });

  it("creates a tool that builds and whose own test passes", async () => {
    // Inside the repository, so that `@forgeron/sdk` resolves.
    const root = join(fixtures, `.work-init-${Date.now()}`);
    dirs.push(root);
    await mkdir(root, { recursive: true });
    expect(await run(["init", "scaffolded"], capture(root).io)).toBe(0);
    const dir = join(root, "scaffolded");

    const built = capture(dir);
    expect(await run(["build"], built.io)).toBe(0);
    expect(built.logs[0]).toMatch(/^.+@0\.1\.0 {2}[0-9a-f]{12} {2}\.forgeron\/build$/);

    const tool = await createTestTool({ dir });
    expect(await tool.call("ping")).toEqual({ pong: true });
  }, 60_000);
});

describe("forgeron link", () => {
  const initialized = async () => {
    const root = await empty();
    await run(["init", "crm"], capture(root).io);
    return join(root, "crm");
  };

  it("records the workspace and its address in project.json", async () => {
    const dir = await initialized();
    const c = capture(dir);
    expect(await run(["link", "--workspace", "acme"], c.io)).toBe(0);
    expect(await json(join(dir, ".forgeron", "project.json"))).toEqual({
      tool: "crm",
      workspace: "acme",
      endpoint: "https://acme.forgeron.app",
    });
    expect(c.logs[0]).toBe("Linked crm to acme (https://acme.forgeron.app).");
  });

  it("takes another endpoint, for a self-hosted platform", async () => {
    const dir = await initialized();
    await run(
      ["link", "--workspace", "acme", "--endpoint", "https://tools.acme.fr"],
      capture(dir).io,
    );
    expect((await json(join(dir, ".forgeron", "project.json"))).endpoint).toBe(
      "https://tools.acme.fr",
    );
  });

  it("forgets the tool id when the workspace changes, and keeps it when it does not", async () => {
    const dir = await initialized();
    await run(["link", "--workspace", "acme"], capture(dir).io);
    const file = join(dir, ".forgeron", "project.json");
    await writeFile(
      file,
      JSON.stringify({
        tool: "crm",
        workspace: "acme",
        endpoint: "https://acme.forgeron.app",
        toolId: "tool_1",
      }),
    );

    await run(["link", "--workspace", "acme"], capture(dir).io);
    expect((await json(file)).toolId).toBe("tool_1");
    await run(["link", "--workspace", "globex"], capture(dir).io);
    expect(await json(file)).toEqual({
      tool: "crm",
      workspace: "globex",
      endpoint: "https://globex.forgeron.app",
    });
  });

  it.each(["ab", "Acme", "a b", "api", "console"])(
    "refuses the workspace %s",
    async (workspace) => {
      const dir = await initialized();
      const c = capture(dir);
      expect(await run(["link", "--workspace", workspace], c.io)).toBe(2);
      expect(c.errors[0]).toMatch(/not a workspace name|reserved/);
    },
  );

  it("needs --workspace", async () => {
    const c = capture(await initialized());
    expect(await run(["link"], c.io)).toBe(2);
    expect(c.errors[0]).toContain("Usage: forgeron link --workspace");
  });

  it("needs a tool folder", async () => {
    const c = capture(await empty());
    expect(await run(["link", "--workspace", "acme"], c.io)).toBe(2);
    expect(c.errors[0]).toContain("no .forgeron/project.json");
  });
});

describe("forgeron build", () => {
  it("builds the tool into .forgeron/build/ and says what it made", async () => {
    const dir = await work("build");
    const c = capture(dir);
    expect(await run(["build"], c.io)).toBe(0);
    expect(c.logs).toHaveLength(1);
    expect(c.logs[0]).toMatch(/^greeter@0\.3\.0 {2}[0-9a-f]{12} {2}\.forgeron\/build$/);
    for (const file of ["worker.js", "manifest.json", "build.json"]) {
      await expect(stat(join(dir, ".forgeron", "build", file))).resolves.toBeDefined();
    }
  }, 60_000);

  it("fails when there is no tool", async () => {
    const c = capture(await empty());
    expect(await run(["build"], c.io)).toBe(1);
    expect(c.errors[0]).toContain("No tool found");
  });

  it("fails with the reason when a tool does not build", async () => {
    const dir = await work("broken");
    await writeFile(join(dir, "actions", "hello.ts"), "export default { not: 'an action' };\n");
    const c = capture(dir);
    expect(await run(["build"], c.io)).toBe(1);
    expect(c.errors[0]).toContain("not an action");
  }, 60_000);
});

describe("forgeron test", () => {
  it("builds first, then runs vitest once by default", async () => {
    const dir = await work("test");
    const c = capture(dir);
    expect(await run(["test"], c.io)).toBe(0);
    await expect(stat(join(dir, ".forgeron", "build", "worker.js"))).resolves.toBeDefined();
    const [command, args, cwd] = c.exec.mock.calls[0]!;
    expect(command).toBe(process.execPath);
    expect(args.slice(1)).toEqual(["run"]);
    expect(args[0]).toMatch(/vitest\.mjs$/);
    expect(cwd).toBe(dir);
  }, 60_000);

  it("passes its arguments to vitest and returns its exit code", async () => {
    const dir = await work("test-args");
    const c = capture(dir);
    c.exec.mockResolvedValueOnce(1);
    expect(await run(["test", "--watch", "tickets"], c.io)).toBe(1);
    expect(c.exec.mock.calls[0]![1].slice(1)).toEqual(["--watch", "tickets"]);
  }, 60_000);

  it("does not run vitest when the build fails", async () => {
    const dir = await work("test-broken");
    await writeFile(join(dir, "actions", "hello.ts"), "export default 1;\n");
    const c = capture(dir);
    expect(await run(["test"], c.io)).toBe(1);
    expect(c.exec).not.toHaveBeenCalled();
  }, 60_000);

  it("fails when there is no tool", async () => {
    const c = capture(await empty());
    expect(await run(["test"], c.io)).toBe(1);
    expect(c.exec).not.toHaveBeenCalled();
  });
});

describe("forgeron db", () => {
  // Copies of tools with a database, without their migrations, inside the repository.
  const dbTool = async (name: string, from: string) => {
    const dir = join(fixtures, `.work-${name}-${Date.now()}`);
    dirs.push(dir);
    await cp(from, dir, {
      recursive: true,
      filter: (src) => !src.includes(".forgeron") && !src.includes(join("db", "migrations")),
    });
    return dir;
  };
  const dbping = join(fixtures, "dbping");
  const pipeline = fileURLToPath(
    new URL("../../../packages/compiler/fixtures/db-tool", import.meta.url),
  );

  it("generate writes the first migration, and says to read it", async () => {
    const dir = await dbTool("db-gen", dbping);
    const c = capture(dir);
    expect(await run(["db", "generate"], c.io)).toBe(0);
    expect(c.logs[0]).toBe(`Wrote ${join("db", "migrations", "0001_init.ts")} (1 statement).`);
    expect(c.logs.at(-1)).toContain("commit it with db/migrations/meta/snapshot.json");
    await expect(stat(join(dir, "db", "migrations", "0001_init.ts"))).resolves.toBeDefined();
  }, 60_000);

  it("says when there is nothing to generate", async () => {
    const dir = await dbTool("db-nothing", dbping);
    await run(["db", "generate"], capture(dir).io);
    const c = capture(dir);
    expect(await run(["db", "generate"], c.io)).toBe(0);
    expect(c.logs).toEqual([
      "The schema has not changed since the last migration: nothing to generate.",
    ]);
  }, 60_000);

  it("takes a name, and warns about a migration that drops data", async () => {
    const dir = await dbTool("db-drop", dbping);
    await run(["db", "generate"], capture(dir).io);
    await writeFile(
      join(dir, "db", "schema.ts"),
      'import { schema, t, table } from "@forgeron/sdk/db";\n\nexport default schema({ things: table("things", { id: t.id() }) });\n',
    );
    const c = capture(dir);
    expect(await run(["db", "generate", "--name", "drop_name"], c.io)).toBe(0);
    expect(c.logs[0]).toContain("0002_drop_name.ts");
    expect(c.logs[1]).toContain("marked destructive");
  }, 60_000);

  it("exits 1 with advice when the change cannot be written safely", async () => {
    const dir = await dbTool("db-refused", pipeline);
    await run(["db", "generate"], capture(dir).io);
    const schema = join(dir, "db", "schema.ts");
    await writeFile(
      schema,
      (await readFile(schema, "utf8")).replace(
        "name: t.text().notNull(),",
        "name: t.text().notNull().unique(),",
      ),
    );
    const c = capture(dir);
    expect(await run(["db", "generate"], c.io)).toBe(1);
    expect(c.errors[0]).toContain("other tables point at it");
  }, 60_000);

  it("fails for a tool without a schema", async () => {
    const dir = await work("db-noschema");
    const c = capture(dir);
    expect(await run(["db", "generate"], c.io)).toBe(1);
    expect(c.errors[0]).toContain("no db/schema.ts");
  }, 60_000);

  it("exits 2 for a wrong use, and says what is not there yet", async () => {
    const none = capture("/");
    expect(await run(["db"], none.io)).toBe(2);
    const unknown = capture("/");
    expect(await run(["db", "frobnicate"], unknown.io)).toBe(2);
    expect(unknown.errors[0]).toContain('unknown subcommand "frobnicate"');
    const remote = capture("/");
    expect(await run(["db", "migrate", "--env", "production"], remote.io)).toBe(2);
    expect(remote.errors[0]).toContain("only status and shell are available");
    const stray = capture("/");
    expect(await run(["db", "generate", "extra"], stray.io)).toBe(2);
  });

  describe("on the local database", () => {
    const prepared = async (name: string) => {
      const dir = await dbTool(name, dbping);
      await run(["db", "generate"], capture(dir).io);
      return dir;
    };
    const sql = async (dir: string, statement: string) => {
      const c = capture(dir);
      expect(await run(["db", "shell", "--sql", statement], c.io)).toBe(0);
      return JSON.parse(c.logs[0]!) as unknown[];
    };

    it("migrates, says what is applied, and rolls back", async () => {
      const dir = await prepared("db-migrate");
      const before = capture(dir);
      expect(await run(["db", "status"], before.io)).toBe(0);
      expect(before.logs).toEqual(["pending  0001_init"]);

      const up = capture(dir);
      expect(await run(["db", "migrate"], up.io)).toBe(0);
      expect(up.logs).toEqual(["Applied 0001_init."]);
      const again = capture(dir);
      await run(["db", "migrate"], again.io);
      expect(again.logs).toEqual(["Nothing to apply."]);
      const after = capture(dir);
      await run(["db", "status"], after.io);
      expect(after.logs).toEqual(["applied  0001_init"]);

      const down = capture(dir);
      expect(await run(["db", "rollback"], down.io)).toBe(0);
      expect(down.logs).toEqual(["Reverted 0001_init."]);
      const none = capture(dir);
      await run(["db", "rollback"], none.io);
      expect(none.logs).toEqual(["Nothing to revert."]);
    }, 60_000);

    it("refuses a number of steps that is not one", async () => {
      const c = capture(await prepared("db-steps"));
      expect(await run(["db", "rollback", "--steps", "0"], c.io)).toBe(2);
    }, 60_000);

    it("seeds the database after migrating it, and the shell reads it", async () => {
      const dir = await prepared("db-seed");
      const c = capture(dir);
      expect(await run(["db", "seed"], c.io)).toBe(0);
      expect(c.logs).toEqual(["Seeded the local database."]);
      expect(await sql(dir, "SELECT name FROM things")).toEqual([{ name: "seeded" }]);
      await sql(dir, "DELETE FROM things");
      expect(await sql(dir, "SELECT name FROM things")).toEqual([]);
    }, 60_000);

    it("says so when the tool has no seed", async () => {
      const dir = await prepared("db-noseed");
      await rm(join(dir, "db", "seed.ts"));
      const c = capture(dir);
      expect(await run(["db", "seed"], c.io)).toBe(1);
      expect(c.errors[0]).toContain("no db/seed.ts");
    }, 60_000);
  });

  describe("the shell outside local", () => {
    it("is read-only unless --write and the admin role", () => {
      const read = { write: false, role: undefined };
      expect(() => checkShell("production", "SELECT 1", read)).not.toThrow();
      expect(() => checkShell("production", "DELETE FROM things", read)).toThrow("read-only");
      expect(() => checkShell("production", "SELECT 1; DROP TABLE things", read)).toThrow(
        "read-only",
      );
      expect(() =>
        checkShell("production", "DELETE FROM things", { write: true, role: "reader" }),
      ).toThrow("admin role");
      expect(() =>
        checkShell("production", "DELETE FROM things", { write: true, role: "admin" }),
      ).not.toThrow();
      expect(() => checkShell("local", "DELETE FROM things", read)).not.toThrow();
    });

    it("exits 2 on a write without --write, before reaching any environment", async () => {
      const c = capture("/");
      expect(
        await run(["db", "shell", "--env", "production", "--sql", "DELETE FROM things"], c.io),
      ).toBe(2);
      expect(c.errors[0]).toContain("read-only");
    });
  });
});

describe("forgeron dev", () => {
  const mcp = async (url: string, method: string, params?: unknown) =>
    (
      (await (
        await fetch(`${url}/mcp`, {
          method: "POST",
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
        })
      ).json()) as {
        result: { tools?: Array<{ name: string }> };
      }
    ).result;

  const serve = async (args: string[], dir: string) => {
    const c = capture(dir);
    const done = run(["dev", ...args], c.io);
    await vi.waitFor(() => expect(c.logs.join("\n")).toContain("runs at"), { timeout: 30_000 });
    const url = /runs at (\S+)/.exec(c.logs[0]!)![1]!;
    return { c, url, done };
  };

  it("runs the tool until it is told to stop", async () => {
    const dir = await work("dev");
    const { c, url, done } = await serve(["--port", "0"], dir);
    expect(c.logs.join("\n")).toContain(`MCP  ${url}/mcp`);
    expect((await mcp(url, "tools/list")).tools?.map((t) => t.name)).toEqual(["greeter_hello"]);
    c.stop();
    expect(await done).toBe(0);
    await expect(fetch(url)).rejects.toThrow(/fetch failed/);
  }, 90_000);

  it("runs as a role: a person who may call nothing sees no tool", async () => {
    const dir = await work("dev-as");
    const { c, url, done } = await serve(["--port", "0", "--as", "nobody"], dir);
    expect(c.logs[0]).toContain('as "nobody"');
    expect((await mcp(url, "tools/list")).tools).toEqual([]);
    c.stop();
    await done;
  }, 90_000);

  it("refuses a role the tool does not have, naming the ones it has", async () => {
    const dir = await work("dev-bad-role");
    const c = capture(dir);
    expect(await run(["dev", "--port", "0", "--as", "boss"], c.io)).toBe(2);
    expect(c.errors[0]).toContain("--as boss: the tool has no such role (roles: reader, nobody)");
  }, 60_000);

  it("refuses a port that is not a port", async () => {
    const c = capture(await empty());
    expect(await run(["dev", "--port", "abc"], c.io)).toBe(2);
    expect(c.errors[0]).toContain("not a port number");
  });

  it("says when the port is taken", async () => {
    const dir = await work("dev-port");
    const first = await serve(["--port", "0"], dir);
    const port = new URL(first.url).port;
    const other = capture(await work("dev-port-2"));
    expect(await run(["dev", "--port", port], other.io)).toBe(2);
    expect(other.errors[0]).toContain(`Port ${port} is already in use`);
    first.c.stop();
    await first.done;
  }, 120_000);
});

describe("forgeron play", () => {
  const open = async (args: string[], dir: string) => {
    const c = capture(dir);
    const done = run(["play", "--no-open", ...args], c.io);
    await vi.waitFor(() => expect(c.logs.join("\n")).toContain("Playground of"), {
      timeout: 30_000,
    });
    const url = /Playground of \S+: (\S+)/.exec(c.logs[0]!)![1]!;
    return { c, url, done };
  };

  it("serves the playground, the manifest and the tool's API on one address", async () => {
    const { c, url, done } = await open(["--port", "0"], await work("play"));
    const page = await fetch(url);
    expect(page.headers.get("content-type")).toContain("text/html");
    expect(await page.text()).toContain("Forgeron playground");

    const manifest = (await (await fetch(`${url}/_play/manifest`)).json()) as {
      actions: Record<string, { input: unknown }>;
    };
    expect(Object.keys(manifest.actions)).toEqual(["hello"]);

    const called = await fetch(`${url}/api/hello?name=Ely`);
    expect(await called.json()).toEqual({ message: "Hello, Ely!", as: "dev" });
    c.stop();
    expect(await done).toBe(0);
    await expect(fetch(url)).rejects.toThrow(/fetch failed/);
  }, 90_000);

  it("serves what the page reads to show the MCP, API and CLI of an action", async () => {
    const { c, url, done } = await open(["--port", "0"], await work("play-preview"));
    const page = await (await fetch(url)).text();
    expect(page).toContain("What each interface sees");

    const list = (await (
      await fetch(`${url}/mcp`, {
        method: "POST",
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
      })
    ).json()) as { result: { tools: Array<{ name: string; description: string }> } };
    expect(list.result.tools[0]).toMatchObject({
      name: "greeter_hello",
      description: "Says hello.",
    });

    const cli = (await (
      await fetch(`${url}/cli`, { headers: { accept: "application/json" } })
    ).json()) as {
      commands: Array<{ command: string; options: Array<{ flag: string }> }>;
    };
    expect(cli.commands[0]).toMatchObject({ command: "forgeron greeter hello" });
    expect(cli.commands[0]!.options.map((o) => o.flag)).toEqual(["--name"]);
    c.stop();
    await done;
  }, 90_000);

  it("refuses a port that is not a port", async () => {
    const c = capture(await empty());
    expect(await run(["play", "--port", "abc"], c.io)).toBe(2);
    expect(c.errors[0]).toContain("not a port number");
  });

  it("says when the port is taken", async () => {
    const first = await open(["--port", "0"], await work("play-port"));
    const port = new URL(first.url).port;
    const other = capture(await work("play-port-2"));
    expect(await run(["play", "--no-open", "--port", port], other.io)).toBe(2);
    expect(other.errors[0]).toContain(`Port ${port} is already in use`);
    first.c.stop();
    await first.done;
  }, 120_000);
});

describe("forgeron change and release", () => {
  const helloTool = async (name: string) => {
    const dir = join(fixtures, `.work-${name}-${Date.now()}`);
    dirs.push(dir);
    await cp(join(fixtures, "greeter"), dir, {
      recursive: true,
      filter: (src) => !src.includes(".forgeron"),
    });
    return dir;
  };

  it("adds a change, checks it, and releases with a commit and a tag", async () => {
    const dir = await helloTool("change");
    const add = capture(dir);
    expect(
      await run(
        ["change", "--type", "added", "--bump", "minor", "-m", "Greets in French."],
        add.io,
      ),
    ).toBe(0);
    expect(add.logs[0]).toMatch(/^Wrote changes\/\d{4}-\d{2}-\d{2}-greets-in-french\.md\.$/);

    const check = capture(dir);
    expect(await run(["change", "check"], check.io)).toBe(0);
    expect(check.logs).toEqual(["No change to declare."]);

    const rel = capture(dir);
    expect(await run(["release"], rel.io)).toBe(0);
    const tag = `greeter@${JSON.parse(await readFile(join(dir, "package.json"), "utf8")).version}`;
    expect(rel.logs.at(-1)).toBe(`Committed and tagged ${tag}.`);
    expect(rel.exec.mock.calls.map(([, args]) => args[0])).toEqual(["add", "commit", "tag"]);
    expect(rel.exec.mock.calls.at(-1)?.[1]).toEqual(["tag", tag]);
  }, 120_000);

  it("releases without git on request, and says when there is nothing to release", async () => {
    const dir = await helloTool("release-nogit");
    const nothing = capture(dir);
    expect(await run(["release"], nothing.io)).toBe(1);
    expect(nothing.errors[0]).toContain("nothing to release");
    await run(["change", "--type", "fixed", "--bump", "patch", "-m", "A fix."], capture(dir).io);
    const c = capture(dir);
    expect(await run(["release", "--no-git"], c.io)).toBe(0);
    expect(c.exec).not.toHaveBeenCalled();
  }, 120_000);

  it("exits 2 for a wrong use", async () => {
    const missing = capture("/");
    expect(await run(["change", "--type", "added"], missing.io)).toBe(2);
    const type = capture("/");
    expect(await run(["change", "--type", "new", "--bump", "minor", "-m", "x"], type.io)).toBe(2);
    expect(type.errors[0]).toContain("--type new");
    const bump = capture("/");
    expect(await run(["change", "--type", "added", "--bump", "tiny", "-m", "x"], bump.io)).toBe(2);
  });
});
