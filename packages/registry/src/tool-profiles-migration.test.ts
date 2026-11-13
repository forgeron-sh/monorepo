import { applyMigrations, type D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegistry, findCard, migratePlatform, platformMigrations } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// An install from before D-127: tools whose roles shared the workspace's role names, an admin
// matrix, and a tool with no version. The migration writes each tool's mapping so that everyone
// keeps what they had, and adds the default mapping: an admin can call `echo` with no manual step.
// Then D-136 turns the roles into subjects (`0042_teams_permissions`): the whole chain runs here,
// and the assertions are on what is left, keyed by subject. The builds are stored with `roles`, as
// they were: the migration of D-136 renames them to `profiles`.
let memory: MemoryD1;
let d1: D1Database;

const run = (sql: string, ...values: unknown[]) => d1.batch([d1.prepare(sql).bind(...values)]);
const at = "2026-11-12T12:00:00.000Z";

const manifest = (roles: Record<string, unknown>, actions: Record<string, string>) =>
  JSON.stringify({
    name: "x",
    version: "1.0.0",
    interfaces: { mcp: true, api: true, cli: false, web: false },
    roles,
    actions: Object.fromEntries(
      Object.entries(actions).map(([name, access]) => [name, { access, description: name }]),
    ),
    views: {},
    jobs: {},
    events: {},
    resources: {},
    uses: {},
    preview: { data: "empty" },
  });

async function tool(id: string, name: string) {
  await run(`INSERT INTO "tools" VALUES (?, 'acme', ?, ?)`, id, name, at);
}
async function version(tool: string, id: string, body: string, created: string) {
  await run(
    `INSERT INTO "builds" ("id", "tool_id", "fingerprint", "manifest", "changelog", "created_at") VALUES (?, ?, ?, ?, NULL, ?)`,
    `b-${id}`,
    tool,
    `fp-${id}`,
    body,
    created,
  );
  await run(
    `INSERT INTO "versions" ("id", "tool_id", "build_id", "version", "created_at") VALUES (?, ?, ?, ?, ?)`,
    id,
    tool,
    `b-${id}`,
    `1.0.${id.length}-${id}`,
    created,
  );
}
async function environment(tool: string, id: string, name: string, versionId: string) {
  await run(
    `INSERT INTO "environments" ("id", "tool_id", "name", "branch", "channel", "version_id", "url", "activated_at", "created_at") VALUES (?, ?, ?, ?, '', ?, NULL, ?, ?)`,
    id,
    tool,
    name,
    name === "production" ? "" : "main",
    versionId,
    at,
    at,
  );
}

beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  const before = platformMigrations.findIndex((m) => m.name === "0038_tool_profiles");
  await applyMigrations(d1, platformMigrations.slice(0, before));

  // echo: one role, `reader` (« Utilisateur »), in production and on the temporary channel `main`.
  await tool("t-echo", "echo");
  await version(
    "t-echo",
    "v1",
    manifest({ reader: { label: "Utilisateur", grants: ["read"] } }, { echo: "read" }),
    "2026-11-10T00:00:00.000Z",
  );
  await environment("t-echo", "e-echo-prod", "production", "v1");
  await environment("t-echo", "e-echo-main", "preview", "v1");

  // crm: a role named `admin`, a matrix set by an admin, and a later version on a channel only.
  await tool("t-crm", "crm");
  await version(
    "t-crm",
    "v2",
    manifest(
      {
        sales: { grants: ["read", "write"] },
        admin: { grants: ["read", "delete"] },
        viewer: { grants: ["read"] },
      },
      { "deals.list": "read", "deals.move": "write", "deals.delete": "delete" },
    ),
    "2026-11-10T00:00:00.000Z",
  );
  await version(
    "t-crm",
    "v3",
    manifest({ other: { grants: ["read"] } }, { "deals.list": "read" }),
    "2026-11-11T00:00:00.000Z",
  );
  await environment("t-crm", "e-crm-prod", "production", "v2");
  await environment("t-crm", "e-crm-feat", "preview", "v3");
  await run(
    `INSERT INTO "role_access" VALUES ('t-crm', 'viewer', 'deals.move', 1, 'ada', ?), ('t-crm', 'legacy', 'deals.list', 1, 'ada', ?)`,
    at,
    at,
  );

  // A tool with only a preview: the latest version is read. A tool with no version: no row.
  await tool("t-draft", "draft");
  await version(
    "t-draft",
    "v4",
    manifest({ big: { grants: ["read", "write"] } }, { "notes.write": "write" }),
    "2026-11-10T00:00:00.000Z",
  );
  await environment("t-draft", "e-draft-feat", "preview", "v4");
  await tool("t-empty", "empty");

  await migratePlatform(d1);
});
afterEach(() => memory.close());

describe("0038_tool_profiles, then 0042_teams_permissions", () => {
  it("gives each tool role its profile, then the admin team all and everyone the default profile", async () => {
    const registry = createRegistry(d1);
    expect(await registry.accessGrants("t-echo")).toEqual({
      "team:admin": { kind: "all" },
      everyone: { kind: "profile", profile: "reader" },
      "team:reader": { kind: "profile", profile: "reader" },
    });
    // A role named like `admin` keeps what it gave: the name wins over the default.
    expect(await registry.accessGrants("t-crm")).toEqual({
      "team:admin": { kind: "profile", profile: "admin" },
      "team:legacy": { kind: "profile", profile: "legacy" },
      everyone: { kind: "profile", profile: "viewer" },
      "team:sales": { kind: "profile", profile: "sales" },
      "team:viewer": { kind: "profile", profile: "viewer" },
    });
    expect(await registry.accessGrants("t-draft")).toEqual({
      "team:admin": { kind: "all" },
      "team:big": { kind: "profile", profile: "big" },
      everyone: { kind: "profile", profile: "big" },
    });
    expect(await registry.accessGrants("t-empty")).toEqual({});
  });

  it("reads the stored builds' profiles under `profiles`", async () => {
    const registry = createRegistry(d1);
    const manifest = (await registry.getBuild("b-v1"))!.manifest as Record<string, unknown>;
    expect(Object.keys(manifest.profiles as object)).toEqual(["reader"]);
    expect(manifest.roles).toBeUndefined();
  });

  it("lets an admin call echo with no manual step, and keeps a reader's access", async () => {
    const registry = createRegistry(d1);
    expect(await registry.accessFor("t-echo", ["everyone", "team:admin"])).toEqual({
      permissions: { everyone: ["read"], "team:admin": ["read"] },
      access: { everyone: { echo: true }, "team:admin": { echo: true } },
    });
    expect((await registry.accessFor("t-echo", ["team:reader"])).access["team:reader"]).toEqual({
      echo: true,
    });
    const card = await findCard(
      registry,
      "acme",
      "echo",
      { subjects: ["team:admin"] },
      "https://x",
    );
    expect(card?.access).toBe("granted");
    // The temporary channel reads the same grants.
    const channel = await findCard(
      registry,
      "acme",
      "echo",
      { subjects: ["team:admin"] },
      "https://x",
      "main",
    );
    expect(channel?.access).toBe("granted");
  });

  it("keeps the admin's matrix as exceptions on top of the grants", async () => {
    const registry = createRegistry(d1);
    expect((await registry.accessFor("t-crm", ["team:viewer"])).access["team:viewer"]).toEqual({
      "deals.list": true,
      "deals.move": true,
      "deals.delete": false,
    });
    expect((await registry.accessFor("t-crm", ["team:legacy"])).access["team:legacy"]).toEqual({
      "deals.list": true,
      "deals.move": false,
      "deals.delete": false,
    });
    expect((await registry.accessFor("t-crm", ["team:admin"])).access["team:admin"]).toEqual({
      "deals.list": true,
      "deals.move": false,
      "deals.delete": true,
    });
  });

  it("writes nothing over the migrated grants at the next deployment", async () => {
    const registry = createRegistry(d1);
    const manifestOf = (await registry.getBuild("b-v1"))!.manifest;
    await registry.seedAccessGrants("t-echo", manifestOf as never, "ci");
    expect(Object.keys(await registry.accessGrants("t-echo")).sort()).toEqual([
      "everyone",
      "team:admin",
      "team:reader",
    ]);
  });
});
