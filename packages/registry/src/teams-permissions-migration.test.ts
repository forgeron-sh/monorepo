import { applyMigrations, type D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegistry, platformMigrations } from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// An install from before D-137: people with workspace roles (`admin`, `member`, `developer`, a typed
// one, and a D-132 team named `team-product` in the access matrix), invitations, the membership
// settings, the groups of both identity providers, what the tools give to roles, and who may add a
// tool. `0042_teams_permissions` turns every role into a team or `everyone` and every row follows.
let memory: MemoryD1;
let d1: D1Database;
let applied: string[] = [];

const run = (sql: string, ...values: unknown[]) => d1.batch([d1.prepare(sql).bind(...values)]);
const rows = async (sql: string, ...values: unknown[]) =>
  ((
    await d1
      .prepare(sql)
      .bind(...values)
      .all()
  ).results ?? []) as Record<string, unknown>[];
const at = "2026-11-12T12:00:00.000Z";

const member = (workspace: string, id: string, roles: string[]) =>
  run(
    `INSERT INTO "members" ("workspace", "id", "subject", "email", "name", "roles", "created_at") VALUES (?, ?, ?, ?, ?, ?, ?)`,
    workspace,
    id,
    `s-${id}`,
    `${id}@${workspace}.test`,
    id,
    JSON.stringify(roles),
    at,
  );
const grant = (tool: string, role: string, kind: string, profile: string | null) =>
  run(
    `INSERT INTO "role_profiles" ("tool_id", "role", "kind", "profile", "permissions", "updated_by", "updated_at") VALUES (?, ?, ?, ?, NULL, 'ada', ?)`,
    tool,
    role,
    kind,
    profile,
    at,
  );
const availability = (tool: string, mode: string, subjects: string[]) =>
  run(
    `INSERT INTO "tool_availability" ("tool_id", "mode", "subjects", "updated_by", "updated_at") VALUES (?, ?, ?, 'ada', ?)`,
    tool,
    mode,
    JSON.stringify(subjects),
    at,
  );

beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  const index = platformMigrations.findIndex((m) => m.name === "0042_teams_permissions");
  await applyMigrations(d1, platformMigrations.slice(0, index));

  // acme: an admin, plain members, a developer, a typed role, one who holds several, and `Admin`
  // (another case: not the administrators). globex has an admin; initech has a tool and nobody.
  await member("acme", "ada", ["admin"]);
  await member("acme", "bea", ["member"]);
  await member("acme", "cleo", ["developer"]);
  await member("acme", "dan", ["support"]);
  await member("acme", "eve", ["member", "support", "Sales_Ops"]);
  await member("acme", "fay", ["Admin"]);
  await member("globex", "gus", ["admin"]);

  // A team of D-132, named `team-product` in the matrix, with dan in it.
  await run(
    `INSERT INTO "teams" ("workspace", "id", "name", "description", "created_at") VALUES ('acme', 'product', 'Product', 'The product team', ?)`,
    at,
  );
  await run(
    `INSERT INTO "team_members" ("workspace", "team_id", "member_id") VALUES ('acme', 'product', 'dan')`,
  );

  await run(
    `INSERT INTO "invitations" ("workspace", "email", "roles", "invited_by", "created_at", "expires_at") VALUES ('acme', 'x@acme.test', '["developer","support","member"]', 'ada', ?, '2999-01-01T00:00:00.000Z'), ('acme', 'y@acme.test', '[]', 'ada', ?, '2999-01-01T00:00:00.000Z')`,
    at,
    at,
  );
  await run(
    `INSERT INTO "membership_settings" ("workspace", "domains", "default_role", "updated_by", "updated_at") VALUES ('acme', '["acme.test"]', 'support', 'ada', ?), ('globex', '["globex.test"]', NULL, 'gus', ?)`,
    at,
    at,
  );
  await run(
    `INSERT INTO "identity_providers" ("workspace", "kind", "client_id", "group_roles", "updated_by", "updated_at") VALUES ('acme', 'google', 'c', '{"g-admins":"admin","g-support":"support","g-all":"member"}', 'ada', ?)`,
    at,
  );
  await run(
    `INSERT INTO "saml_providers" ("workspace", "idp_entity_id", "sso_url", "certificates", "group_roles", "updated_by", "updated_at") VALUES ('globex', 'e', 'https://x.test', '[]', '{"devs":"developer","ops":"Sales_Ops"}', 'gus', ?)`,
    at,
  );

  // Tools: what they give to roles and who may add them.
  await run(`INSERT INTO "tools" VALUES ('t-crm', 'acme', 'crm', ?)`, at);
  await run(`INSERT INTO "tools" VALUES ('t-odoo', 'acme', 'odoo', ?)`, at);
  await run(`INSERT INTO "tools" VALUES ('t-lone', 'initech', 'lone', ?)`, at);
  await grant("t-crm", "admin", "all", null);
  await grant("t-crm", "member", "profile", "reader");
  await grant("t-crm", "developer", "profile", "reader");
  await grant("t-crm", "support", "profile", "reader");
  await grant("t-crm", "team-product", "profile", "reader");
  await run(
    `INSERT INTO "role_access" ("tool_id", "role", "action", "allowed", "updated_by", "updated_at") VALUES ('t-crm', 'support', 'deals.move', 1, 'ada', ?), ('t-crm', 'team-product', 'deals.move', 1, 'ada', ?), ('t-crm', 'member', 'deals.delete', 0, 'ada', ?)`,
    at,
    at,
    at,
  );
  await availability("t-crm", "roles", ["member"]);
  await availability("t-odoo", "roles", ["support", "team-product", "admin"]);
  await availability("t-lone", "nobody", []);
  await run(
    `INSERT INTO "channel_access" ("tool_id", "channel", "mode", "subjects", "updated_by", "updated_at") VALUES ('t-odoo', '~beta', 'roles', '["developer","Sales_Ops"]', 'ada', ?), ('t-odoo', 'feat', 'people', '["bea"]', 'ada', ?)`,
    at,
    at,
  );
  // A stored build declares its profiles under `roles`.
  await run(
    `INSERT INTO "builds" ("id", "tool_id", "fingerprint", "manifest", "changelog", "created_at") VALUES ('b1', 't-crm', 'fp', ?, NULL, ?)`,
    JSON.stringify({ name: "crm", roles: { reader: { grants: ["read"] } }, actions: {} }),
    at,
  );

  applied = (await applyMigrations(d1, platformMigrations)).applied;
});
afterEach(() => memory.close());

describe("0042_teams_permissions", () => {
  it("applies the one migration", () => {
    expect(applied).toEqual(["0042_teams_permissions"]);
  });

  it("creates the admin and developer teams in every workspace that has people or tools", async () => {
    const teams = await rows(
      `SELECT "workspace", "id", "name", "built_in" FROM "teams" ORDER BY "workspace", "id"`,
    );
    expect(teams).toEqual([
      { workspace: "acme", id: "admin", name: "Admins", built_in: 1 },
      { workspace: "acme", id: "admin-team", name: "Admin", built_in: 0 },
      { workspace: "acme", id: "developer", name: "Developers", built_in: 1 },
      { workspace: "acme", id: "product", name: "Product", built_in: 0 },
      { workspace: "acme", id: "sales-ops", name: "Sales_Ops", built_in: 0 },
      { workspace: "acme", id: "support", name: "support", built_in: 0 },
      { workspace: "globex", id: "admin", name: "Admins", built_in: 1 },
      { workspace: "globex", id: "developer", name: "Developers", built_in: 1 },
      { workspace: "globex", id: "sales-ops", name: "Sales_Ops", built_in: 0 },
      { workspace: "initech", id: "admin", name: "Admins", built_in: 1 },
      { workspace: "initech", id: "developer", name: "Developers", built_in: 1 },
    ]);
    const registry = createRegistry(d1);
    const [admin, developer] = await registry.listTeams("acme");
    expect(admin).toMatchObject({ id: "admin", locked: true, permissions: ["*"] });
    expect(developer?.permissions).toEqual([
      "tools:write",
      "tools:publish",
      "tools:data",
      "access:read",
      "marketplace:read",
    ]);
    // A typed role has no permission on the platform.
    expect((await registry.findTeam("acme", "support"))?.permissions).toEqual([]);
  });

  it("puts each person in the teams of their roles; `member` is no team", async () => {
    const registry = createRegistry(d1);
    const teamsOf = async (workspace: string, id: string) =>
      (await registry.findMember(workspace, id))?.teams;
    expect(await teamsOf("acme", "ada")).toEqual(["admin"]);
    expect(await teamsOf("acme", "bea")).toEqual([]);
    expect(await teamsOf("acme", "cleo")).toEqual(["developer"]);
    // Their D-132 team stays, with the team of their role.
    expect(await teamsOf("acme", "dan")).toEqual(["product", "support"]);
    expect(await teamsOf("acme", "eve")).toEqual(["sales-ops", "support"]);
    // `Admin` is not `admin`: no administrator by a change of case.
    expect(await teamsOf("acme", "fay")).toEqual(["admin-team"]);
    expect(await registry.platformPermissionsOf("acme", "fay")).toEqual([]);
    expect(await teamsOf("globex", "gus")).toEqual(["admin"]);
    expect((await registry.platformPermissionsOf("acme", "ada")).length).toBeGreaterThan(10);
    expect(await registry.platformPermissionsOf("acme", "bea")).toEqual([]);
    expect(await registry.platformPermissionsOf("acme", "cleo")).toContain("tools:publish");
    await expect(rows(`SELECT "roles" FROM "members"`)).rejects.toThrow(/roles/);
  });

  it("turns the invitations' roles and the domain's default role into teams", async () => {
    const registry = createRegistry(d1);
    expect((await registry.findInvitation("acme", "x@acme.test"))?.teams).toEqual([
      "developer",
      "support",
    ]);
    expect((await registry.findInvitation("acme", "y@acme.test"))?.teams).toEqual([]);
    expect(await registry.getMembershipSettings("acme")).toEqual({
      domains: ["acme.test"],
      defaultTeams: ["support"],
    });
    expect(await registry.getMembershipSettings("globex")).toEqual({
      domains: ["globex.test"],
      defaultTeams: [],
    });
  });

  it("turns the group roles of both identity providers into group teams", async () => {
    expect(await rows(`SELECT "group_teams" FROM "identity_providers"`)).toEqual([
      { group_teams: '{"g-admins":"admin","g-support":"support"}' },
    ]);
    expect(await rows(`SELECT "group_teams" FROM "saml_providers"`)).toEqual([
      { group_teams: '{"devs":"developer","ops":"sales-ops"}' },
    ]);
  });

  it("keys what a tool gives by subject: member is everyone, team-<id> is team:<id>", async () => {
    const registry = createRegistry(d1);
    expect(await registry.accessGrants("t-crm")).toEqual({
      "team:admin": { kind: "all" },
      everyone: { kind: "profile", profile: "reader" },
      "team:developer": { kind: "profile", profile: "reader" },
      "team:support": { kind: "profile", profile: "reader" },
      "team:product": { kind: "profile", profile: "reader" },
    });
    expect(await registry.accessExceptions("t-crm")).toEqual({
      "team:support": { "deals.move": true },
      "team:product": { "deals.move": true },
      everyone: { "deals.delete": false },
    });
    await expect(rows(`SELECT 1 FROM "role_profiles"`)).rejects.toThrow(/role_profiles/);
    await expect(rows(`SELECT 1 FROM "role_access"`)).rejects.toThrow(/role_access/);
  });

  it("rewrites who may add a tool or a channel: `member` is everyone, the rest are teams", async () => {
    const registry = createRegistry(d1);
    expect(await registry.availabilityOf("t-crm")).toMatchObject({ mode: "everyone", teams: [] });
    expect(await registry.availabilityOf("t-odoo")).toMatchObject({
      mode: "teams",
      teams: ["admin", "product", "support"],
    });
    expect(await registry.availabilityOf("t-lone")).toMatchObject({ mode: "nobody" });
    expect(await registry.channelAccessOf("t-odoo", "~beta")).toMatchObject({
      mode: "teams",
      teams: ["developer", "sales-ops"],
    });
    expect(await registry.channelAccessOf("t-odoo", "feat")).toMatchObject({
      mode: "people",
      people: ["bea"],
    });
  });

  it("stores a build's profiles under `profiles`", async () => {
    const [row] = await rows(`SELECT "manifest" FROM "builds" WHERE "id" = 'b1'`);
    expect(JSON.parse(String(row?.manifest))).toEqual({
      name: "crm",
      profiles: { reader: { grants: ["read"] } },
      actions: {},
    });
  });

  it("leaves no helper table behind", async () => {
    expect(
      await rows(`SELECT "name" FROM "sqlite_master" WHERE "name" LIKE '\\_role\\_%' ESCAPE '\\'`),
    ).toEqual([]);
  });
});
