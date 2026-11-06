import { readFileSync } from "node:fs";
import { applyMigrations, type BuildMigration, type D1Database } from "@forgeron/hosting";
import { createMemoryD1 } from "@forgeron/sdk/testing/d1";
import { describe, expect, it, vi } from "vitest";
import { composeMigrations, platformMigrations } from "./migrations";
import { createRegistry } from "./registry";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// `migrations.golden.json` is the platform's list as it was installed (0001 to 0022), taken before the
// registry was split into modules. A migration already applied somewhere is never edited, renamed or
// reordered: when a migration is added, append it to the frozen copy; never change an existing entry.
const golden = JSON.parse(
  readFileSync(new URL("./migrations.golden.json", import.meta.url), "utf8"),
) as BuildMigration[];

describe("the composed platform migrations", () => {
  it("are, entry by entry, the frozen list: names, fingerprints, statements and order", () => {
    expect(platformMigrations.map((m) => m.name)).toEqual(golden.map((m) => m.name));
    expect(platformMigrations.map((m) => m.fingerprint)).toEqual(golden.map((m) => m.fingerprint));
    expect(JSON.parse(JSON.stringify(platformMigrations))).toEqual(golden);
  });

  it("apply on a D1 and record the frozen names and fingerprints in order", async () => {
    const memory = await createMemoryD1();
    try {
      const d1 = memory as unknown as D1Database;
      const result = await applyMigrations(d1, platformMigrations);
      expect(result.applied).toEqual(golden.map((m) => m.name));
      const rows = (
        await d1
          .prepare(`SELECT "name", "fingerprint" FROM "_forgeron_migrations" ORDER BY "name"`)
          .all()
      ).results as { name: string; fingerprint: string }[];
      expect(rows).toEqual(golden.map(({ name, fingerprint }) => ({ name, fingerprint })));
      // The registry runs on the schema the composed list built.
      const registry = createRegistry(d1);
      const tool = await registry.createTool({ workspace: "acme", name: "crm" });
      expect(await registry.listTools("acme")).toEqual([tool]);
    } finally {
      memory.close();
    }
  });

  it("find a D1 installed with the frozen list up to date: nothing missing, edited or late", async () => {
    const memory = await createMemoryD1();
    try {
      const d1 = memory as unknown as D1Database;
      await applyMigrations(d1, golden);
      expect((await applyMigrations(d1, platformMigrations)).applied).toEqual([]);
    } finally {
      memory.close();
    }
  });
});

describe("composeMigrations", () => {
  const m = (name: string): BuildMigration => ({
    name,
    fingerprint: `${name}-v1`,
    destructive: false,
    up: [],
    down: [],
  });

  it("orders the modules' lists by name, whatever the order of the lists", () => {
    expect(
      composeMigrations([[m("0003_c"), m("0001_a")], [m("0002_b")]]).map((x) => x.name),
    ).toEqual(["0001_a", "0002_b", "0003_c"]);
  });

  it("refuses a name declared by two modules", () => {
    expect(() => composeMigrations([[m("0001_a")], [m("0001_a")]])).toThrow(/declared twice/);
  });
});
