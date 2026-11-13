import type { Build, D1Database, Environment, Hosting } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRegistry,
  createSecretBox,
  deleteToolEverywhere,
  deployBuild,
  migratePlatform,
  type Registry,
  type Tool,
} from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// Deleting a tool for good: every environment is torn down, production included, then the registry
// forgets the tool with everything attached to it (access, availability, libraries, secrets, sources).

let memory: MemoryD1;
let registry: Registry;
let torn: Environment[];
let failing = false;

const hosting: Hosting = {
  async provision(environment) {
    return { environment, bindings: [] };
  },
  async upload(provisioned, build) {
    return { provisioned, build };
  },
  async migrate() {
    return { applied: [] };
  },
  async activate() {
    return { url: "https://x.test" };
  },
  async teardown(environment) {
    if (failing) throw new Error("the host is down");
    torn.push(environment);
  },
};

beforeEach(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, {
    secrets: await createSecretBox(btoa(String.fromCharCode(...new Uint8Array(32).fill(7)))),
  });
  torn = [];
  failing = false;
});
afterEach(() => memory.close());

const manifest = {
  profiles: { user: { grants: ["read"], default: true } },
  actions: { "deals.list": { access: "read" } },
  resources: {},
} as unknown as Build["manifest"];

const ship = (
  tool: Tool,
  environment: "production" | "preview",
  fingerprint: string,
  branch?: string,
) =>
  deployBuild(registry, hosting, {
    tool,
    environment,
    ...(branch ? { branch } : {}),
    build: {
      manifest,
      worker: "//",
      fingerprint,
      changelog: { entries: [{}], declared: "patch", detected: "patch" },
    },
    version: environment === "production" ? "1.0.0" : "1.1.0-feat",
    actor: "ci",
  });

/** Every table that has a `tool_id` column, with the rows it holds for a tool. */
async function rowsOf(toolId: string): Promise<Record<string, number>> {
  const d1 = memory as unknown as D1Database;
  const all = async (sql: string, ...values: string[]) =>
    (
      await d1
        .prepare(sql)
        .bind(...values)
        .all()
    ).results as Array<Record<string, unknown>>;
  const counts: Record<string, number> = {};
  for (const { name } of await all(`SELECT name FROM sqlite_master WHERE type = 'table'`)) {
    const columns = await all(`PRAGMA table_info("${String(name)}")`);
    if (!columns.some((c) => c.name === "tool_id")) continue;
    const [row] = await all(
      `SELECT COUNT(*) AS n FROM "${String(name)}" WHERE "tool_id" = ?`,
      toolId,
    );
    counts[String(name)] = Number(row!.n);
  }
  return counts;
}

/** A tool with something in every place a tool leaves rows. */
async function fill(name: string): Promise<Tool> {
  const tool = await registry.createTool({ workspace: "acme", name });
  await registry.linkRepository({
    toolId: tool.id,
    repo: `acme-sh/${name}`,
    productionBranch: "main",
    actor: "p",
  });
  await ship(tool, "production", `${name}-prod`);
  await ship(tool, "preview", `${name}-feat`, "feat-a");
  await registry.addChannel({ toolId: tool.id, name: "staging", actor: "p" });
  await registry.setAvailability({ toolId: tool.id, mode: "everyone", actor: "p" });
  await registry.setChannelAccess({
    toolId: tool.id,
    channel: "feat-a",
    mode: "everyone",
    actor: "p",
  });
  await registry.installForPerson({ toolId: tool.id, person: "p-ana" });
  await registry.setSecret(tool.id, "production", "API_KEY", "not-a-real-secret");
  await registry.seedAccessGrants(tool.id, manifest, "p");
  await registry.setAccessException(tool.id, "everyone", "deals.list", false, "p");
  return tool;
}

describe("deleteToolEverywhere", () => {
  it("tears down production, every channel and every preview, then forgets the tool and its rows", async () => {
    const tool = await fill("crm");
    const before = await rowsOf(tool.id);
    // The fixture really filled the places it claims to.
    for (const table of [
      "builds",
      "versions",
      "environments",
      "tool_sources",
      "tool_availability",
      "channel_access",
    ]) {
      expect({ table, rows: before[table] }).toMatchObject({ table, rows: expect.any(Number) });
      expect(before[table] ?? 0).toBeGreaterThan(0);
    }
    expect(Object.values(before).filter((n) => n > 0).length).toBeGreaterThanOrEqual(8);
    expect(before["audit_log"]).toBeGreaterThan(0);

    await deleteToolEverywhere(registry, hosting, tool);

    expect(torn).toHaveLength(3);
    expect(torn).toEqual(
      expect.arrayContaining([
        { tool: "crm", name: "production" },
        { tool: "crm", name: "preview", branch: "feat-a" },
        { tool: "crm", name: "channel", channel: "staging" },
      ]),
    );
    expect(await registry.findTool("acme", "crm")).toBeUndefined();
    // Everything but the audit log, which has no foreign key and keeps what happened.
    expect(
      Object.entries(await rowsOf(tool.id)).filter(([table, n]) => n > 0 && table !== "audit_log"),
    ).toEqual([]);
    expect(await registry.libraryOf("p-ana")).toEqual(new Set());
  });

  it("leaves another tool, and the audit lines of the deleted one, alone", async () => {
    const gone = await fill("crm");
    const kept = await fill("odoo");
    const audit = (await registry.listAudit(gone.id)).length;
    expect(audit).toBeGreaterThan(0);
    const keptRows = await rowsOf(kept.id);
    await deleteToolEverywhere(registry, hosting, gone);
    expect(await rowsOf(kept.id)).toEqual(keptRows);
    expect(await registry.findTool("acme", "odoo")).toBeDefined();
    // The audit log has no foreign key to the tool: what happened stays readable.
    expect((await registry.listAudit(gone.id)).length).toBe(audit);
  });

  it("deletes a tool that never had an environment", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "fresh" });
    await deleteToolEverywhere(registry, hosting, tool);
    expect(torn).toEqual([]);
    expect(await registry.findTool("acme", "fresh")).toBeUndefined();
  });

  it("keeps everything when a host fails, so that the deletion can be tried again", async () => {
    const tool = await fill("crm");
    const before = await rowsOf(tool.id);
    failing = true;
    await expect(deleteToolEverywhere(registry, hosting, tool)).rejects.toThrow("the host is down");
    expect(await rowsOf(tool.id)).toEqual(before);
    failing = false;
    await deleteToolEverywhere(registry, hosting, tool);
    expect(await registry.findTool("acme", "crm")).toBeUndefined();
  });
});
