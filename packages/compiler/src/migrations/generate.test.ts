import { createSchemaSql } from "@forgeron/sdk/db";
import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { DatabaseSync } from "node:sqlite";
import { afterEach, describe, expect, it } from "vitest";
import { buildTool, generateMigration } from "../index";
import { structure } from "./structure";

// The generator on a tool, from its first migration to its next change, and the build that follows.

const fixtures = fileURLToPath(new URL("../../fixtures", import.meta.url));
const dirs: string[] = [];
afterEach(async () => {
  await Promise.all(dirs.splice(0).map((d) => rm(d, { recursive: true, force: true })));
});

// A copy of the db-tool fixture without its migrations, inside the repository so `@forgeron/sdk` resolves.
async function freshTool(): Promise<string> {
  const dir = join(fixtures, `.work-generate-${Date.now()}-${dirs.length}`);
  dirs.push(dir);
  await cp(join(fixtures, "db-tool"), dir, {
    recursive: true,
    filter: (src) => !src.includes(".forgeron") && !src.includes(`${join("db", "migrations")}`),
  });
  return dir;
}

const read = (dir: string, ...path: string[]) => readFile(join(dir, ...path), "utf8");

describe("forgeron db generate", () => {
  it("writes the first migration and the snapshot", async () => {
    const dir = await freshTool();
    const result = await generateMigration(dir);
    expect(result).toEqual({
      file: join("db", "migrations", "0001_init.ts"),
      name: "0001_init",
      statements: 4,
      destructive: false,
      reversible: true,
    });
    const source = await read(dir, "db", "migrations", "0001_init.ts");
    expect(source).toContain('import { migration } from "@forgeron/sdk/db";');
    expect(source).toContain('"CREATE TABLE \\"companies\\"');
    expect(source).toContain('"DROP TABLE \\"deals\\"');
    expect(source).not.toContain("destructive");
    const snapshot = JSON.parse(await read(dir, "db", "migrations", "meta", "snapshot.json"));
    expect(snapshot.tables.map((t: { name: string }) => t.name)).toEqual(["companies", "deals"]);
  }, 60_000);

  it("writes nothing when the schema has not changed", async () => {
    const dir = await freshTool();
    await generateMigration(dir);
    expect(await generateMigration(dir)).toBeUndefined();
    expect(await readdir(join(dir, "db", "migrations"))).toEqual(["0001_init.ts", "meta"]);
  }, 60_000);

  it("writes the next migration when the schema changes: numbered, named, and in place when it can", async () => {
    const dir = await freshTool();
    await generateMigration(dir);
    const schema = join(dir, "db", "schema.ts");
    await writeFile(
      schema,
      (await readFile(schema, "utf8")).replace(
        "title: t.text().notNull(),",
        "title: t.text().notNull(),\n    notes: t.text(),",
      ),
    );

    const result = await generateMigration(dir, { name: "deal_notes" });
    expect(result).toMatchObject({
      name: "0002_deal_notes",
      statements: 1,
      destructive: false,
      reversible: true,
    });
    const source = await read(dir, "db", "migrations", "0002_deal_notes.ts");
    expect(source).toContain('ALTER TABLE \\"deals\\" ADD COLUMN \\"notes\\" TEXT');
    expect(source).toContain('ALTER TABLE \\"deals\\" DROP COLUMN \\"notes\\"');
  }, 60_000);

  it("marks a migration destructive when it drops data", async () => {
    const dir = await freshTool();
    await generateMigration(dir);
    const schema = join(dir, "db", "schema.ts");
    await writeFile(
      schema,
      (await readFile(schema, "utf8")).replace("title: t.text().notNull(),\n", ""),
    );
    const result = await generateMigration(dir);
    expect(result).toMatchObject({ destructive: true });
    expect(await read(dir, "db", "migrations", "0002_update.ts")).toContain("destructive: true,");
  }, 60_000);

  it("refuses a change that needs a rebuild of a table other tables point at, and writes nothing", async () => {
    const dir = await freshTool();
    await generateMigration(dir);
    // Making `name` unique on a table that deals point at needs a rebuild the generator refuses.
    const schema = join(dir, "db", "schema.ts");
    await writeFile(
      schema,
      (await readFile(schema, "utf8")).replace(
        "name: t.text().notNull(),",
        "name: t.text().notNull().unique(),",
      ),
    );
    await expect(generateMigration(dir)).rejects.toThrow(/other tables point at it/);
    expect(await readdir(join(dir, "db", "migrations"))).toEqual(["0001_init.ts", "meta"]);
  }, 60_000);

  it("refuses a name that is not a-z, 0-9 and _", async () => {
    const dir = await freshTool();
    await expect(generateMigration(dir, { name: "Add Notes" })).rejects.toThrow(
      /is not a migration name/,
    );
  }, 60_000);

  it("needs a schema", async () => {
    await expect(generateMigration(join(fixtures, "hello"))).rejects.toThrow(/no db\/schema\.ts/);
  }, 60_000);

  it("takes a relative path", async () => {
    const dir = await freshTool();
    const relative = join("packages", "compiler", "fixtures", dir.split("/fixtures/")[1]!);
    expect(await generateMigration(relative)).toMatchObject({ name: "0001_init" });
  }, 60_000);
});

describe("the build, with migrations", () => {
  it("records them, with the fingerprint of their file, and the migrations build the schema's database", async () => {
    const dir = await freshTool();
    await generateMigration(dir);
    const built = await buildTool(dir);
    const migrations = JSON.parse(await read(built.outDir, "migrations.json")) as Array<{
      name: string;
      fingerprint: string;
      up: Array<{ sql: string }>;
      down: Array<{ sql: string }>;
      destructive: boolean;
    }>;
    expect(migrations).toHaveLength(1);
    expect(migrations[0]).toMatchObject({ name: "0001_init", destructive: false });
    expect(migrations[0]!.fingerprint).toMatch(/^[0-9a-f]{64}$/);

    // Applied one after the other, they leave the database that the schema describes.
    const worker = (await import(pathToFileURL(join(built.outDir, "worker.js")).href)) as {
      schema: Parameters<typeof createSchemaSql>[0];
      migrations: typeof migrations;
    };
    const fromMigrations = new DatabaseSync(":memory:");
    for (const m of worker.migrations) for (const s of m.up) fromMigrations.exec(s.sql);
    const fromSchema = new DatabaseSync(":memory:");
    for (const sql of createSchemaSql(worker.schema)) fromSchema.exec(sql);
    expect(structure(fromMigrations)).toEqual(structure(fromSchema));

    // And the way back leaves nothing.
    for (const m of [...worker.migrations].reverse())
      for (const s of m.down) fromMigrations.exec(s.sql);
    expect(structure(fromMigrations)).toEqual({});
  }, 60_000);

  it("refuses a schema that moved since the last migration", async () => {
    const dir = await freshTool();
    await generateMigration(dir);
    const schema = join(dir, "db", "schema.ts");
    await writeFile(
      schema,
      (await readFile(schema, "utf8")).replace(
        "title: t.text().notNull(),",
        "title: t.text().notNull(),\n    notes: t.text(),",
      ),
    );
    await expect(buildTool(dir)).rejects.toThrow(
      /db\/schema\.ts has changed since the last migration.*forgeron db generate/,
    );
  }, 60_000);

  it("refuses a schema that never had a migration", async () => {
    await expect(buildTool(join(fixtures, "rules", "schema-ahead"))).rejects.toThrow(
      /run `forgeron db generate`/,
    );
  }, 60_000);

  it("refuses a migration file that does not follow NNNN_name, or that exports something else", async () => {
    const dir = await freshTool();
    await generateMigration(dir);
    const folder = join(dir, "db", "migrations");
    await writeFile(
      join(folder, "add-notes.ts"),
      'import { migration } from "@forgeron/sdk/db";\nexport default migration({ up: [], down: [] });\n',
    );
    await expect(buildTool(dir)).rejects.toThrow(/named NNNN_<name>/);
    await rm(join(folder, "add-notes.ts"));
    await writeFile(join(folder, "0002_oops.ts"), "export default { not: 'a migration' };\n");
    await expect(buildTool(dir)).rejects.toThrow(/not a migration/);
  }, 60_000);

  it("refuses two migrations with the same number", async () => {
    const dir = await freshTool();
    await generateMigration(dir);
    await mkdir(join(dir, "db", "migrations"), { recursive: true });
    await writeFile(
      join(dir, "db", "migrations", "0001_other.ts"),
      'import { migration } from "@forgeron/sdk/db";\nexport default migration({ up: [], down: [] });\n',
    );
    await expect(buildTool(dir)).rejects.toThrow(/Two migrations have the number 0001/);
  }, 60_000);

  it("lets a migration be written with Kysely and parameters", async () => {
    const dir = await freshTool();
    await generateMigration(dir);
    await writeFile(
      join(dir, "db", "migrations", "0002_seed.ts"),
      `import { migration } from "@forgeron/sdk/db";
export default migration({
  up: (db) => [db.insertInto("companies").values({ id: "c0", name: "Seed" })],
  down: (db) => [db.deleteFrom("companies").where("id", "=", "c0")],
});
`,
    );
    const built = await buildTool(dir);
    const [, seed] = JSON.parse(await read(built.outDir, "migrations.json")) as Array<{
      up: Array<{ sql: string; parameters: unknown[] }>;
    }>;
    expect(seed!.up).toEqual([
      { sql: 'insert into "companies" ("id", "name") values (?, ?)', parameters: ["c0", "Seed"] },
    ]);
  }, 60_000);
});
