import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { D1Database } from "@forgeron/hosting";
import {
  createRegistry,
  createSecretBox,
  migratePlatform,
  platformMigrations,
  RegistryError,
  type Registry,
} from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// A throwaway key made of zeros: it protects nothing and is not a secret.
const TEST_KEY = btoa(String.fromCharCode(...new Uint8Array(32)));

let memory: MemoryD1;
let d1: D1Database;
let registry: Registry;
let tick = 0;

beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, {
    secrets: await createSecretBox(TEST_KEY),
    now: () => new Date(Date.UTC(2026, 10, 3, 12, 0, tick++)),
  });
});
afterEach(() => memory.close());

const code = async (promise: Promise<unknown>) =>
  promise.then(
    () => undefined,
    (error: RegistryError) => error.code,
  );

async function seed() {
  const tool = await registry.createTool({ workspace: "acme", name: "crm" });
  const build = await registry.recordBuild(tool.id, {
    fingerprint: "fp1",
    manifest: { name: "crm" },
    changelog: { entries: [], declared: "none", detected: "none" },
  });
  const version = await registry.publishVersion(tool.id, build.id, "1.0.0");
  return { tool, build, version };
}

describe("migrations", () => {
  it("are recorded and run once", async () => {
    expect(await migratePlatform(d1)).toEqual({ applied: [] });
    const { results } = await d1.prepare(`SELECT "name" FROM "_forgeron_migrations"`).all();
    expect(results).toEqual(platformMigrations.map((m) => ({ name: m.name })));
  });
});

describe("tools", () => {
  it("creates, finds and lists by workspace", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "crm" });
    await registry.createTool({ workspace: "acme", name: "assets" });
    await registry.createTool({ workspace: "other", name: "crm" });
    expect(await registry.findTool("acme", "crm")).toEqual(tool);
    expect((await registry.listTools("acme")).map((t) => t.name)).toEqual(["assets", "crm"]);
  });

  it("refuses a second tool of the same name in a workspace", async () => {
    await registry.createTool({ workspace: "acme", name: "crm" });
    expect(await code(registry.createTool({ workspace: "acme", name: "crm" }))).toBe(
      "ALREADY_EXISTS",
    );
  });

  it("deleting a tool deletes everything under it", async () => {
    const { tool, version } = await seed();
    const env = await registry.ensureEnvironment(tool.id, "production");
    await registry.activate(env.id, version.id, { actor: "ely" });
    await registry.requestApproval(version.id, { resource: "DB", kind: "d1" });
    await registry.deleteTool(tool.id);
    for (const table of ["builds", "versions", "environments", "approvals"]) {
      const { results } = await d1.prepare(`SELECT count(*) AS n FROM "${table}"`).all();
      expect(results).toEqual([{ n: 0 }]);
    }
  });
});

describe("builds and versions", () => {
  it("records a build once per fingerprint and round-trips its JSON", async () => {
    const { tool, build } = await seed();
    const again = await registry.recordBuild(tool.id, {
      fingerprint: "fp1",
      manifest: { other: 1 },
    });
    expect(again.id).toBe(build.id);
    expect(again.manifest).toEqual({ name: "crm" });
    const bare = await registry.recordBuild(tool.id, { fingerprint: "fp2", manifest: {} });
    expect(bare.changelog).toBeNull();
  });

  it("publishes a version number once, for a build of the same tool", async () => {
    const { tool, build } = await seed();
    expect(await code(registry.publishVersion(tool.id, build.id, "1.0.0"))).toBe("ALREADY_EXISTS");
    const other = await registry.createTool({ workspace: "acme", name: "assets" });
    expect(await code(registry.publishVersion(other.id, build.id, "1.0.0"))).toBe("WRONG_TOOL");
    expect(await code(registry.publishVersion(tool.id, "missing", "2.0.0"))).toBe("NOT_FOUND");
  });

  it("lists versions in publication order", async () => {
    const { tool, build } = await seed();
    await registry.publishVersion(tool.id, build.id, "0.9.0");
    expect((await registry.listVersions(tool.id)).map((v) => v.version)).toEqual([
      "1.0.0",
      "0.9.0",
    ]);
  });
});

describe("environments", () => {
  it("has one production per tool and one preview per branch", async () => {
    const { tool } = await seed();
    const production = await registry.ensureEnvironment(tool.id, "production");
    expect((await registry.ensureEnvironment(tool.id, "production")).id).toBe(production.id);
    const a = await registry.ensureEnvironment(tool.id, "preview", "feat/a");
    const b = await registry.ensureEnvironment(tool.id, "preview", "feat/b");
    expect(a.id).not.toBe(b.id);
    expect(a.branch).toBe("feat/a");
    expect(production.branch).toBeUndefined();
    expect(await code(registry.ensureEnvironment(tool.id, "preview"))).toBe("BRANCH_REQUIRED");
    expect(await registry.listEnvironments(tool.id)).toHaveLength(3);
  });

  it("records which version an environment serves, and keeps the last one", async () => {
    const { tool, build, version } = await seed();
    const second = await registry.publishVersion(tool.id, build.id, "1.1.0");
    const env = await registry.ensureEnvironment(tool.id, "production");
    expect(env.versionId).toBeUndefined();
    await registry.activate(env.id, version.id, {
      actor: "ely",
      url: "https://production.example",
    });
    const switched = await registry.activate(env.id, second.id, { actor: "ely" });
    expect(switched.versionId).toBe(second.id);
    expect(switched.url).toBeUndefined();
    expect(switched.activatedAt).toBeDefined();
  });

  it("refuses a version of another tool, and a deleted version leaves the environment idle", async () => {
    const { tool, version } = await seed();
    const other = await registry.createTool({ workspace: "acme", name: "assets" });
    const otherEnv = await registry.ensureEnvironment(other.id, "production");
    expect(await code(registry.activate(otherEnv.id, version.id, { actor: "ely" }))).toBe(
      "WRONG_TOOL",
    );
    expect(await code(registry.activate("missing", version.id, { actor: "ely" }))).toBe(
      "NOT_FOUND",
    );
    const env = await registry.ensureEnvironment(tool.id, "production");
    await registry.activate(env.id, version.id, { actor: "ely" });
    await d1.batch([d1.prepare(`DELETE FROM "versions" WHERE "id" = ?`).bind(version.id)]);
    expect((await registry.listEnvironments(tool.id))[0]?.versionId).toBeUndefined();
  });

  it("removes a preview", async () => {
    const { tool } = await seed();
    const env = await registry.ensureEnvironment(tool.id, "preview", "feat/a");
    await registry.removeEnvironment(env.id);
    expect(await registry.listEnvironments(tool.id)).toEqual([]);
  });
});

describe("approvals", () => {
  it("is requested once per version and resource", async () => {
    const { version } = await seed();
    const first = await registry.requestApproval(version.id, { resource: "DB", kind: "d1" });
    const again = await registry.requestApproval(version.id, { resource: "DB", kind: "d1" });
    expect(again.id).toBe(first.id);
    expect(first.status).toBe("pending");
    expect(await code(registry.requestApproval("missing", { resource: "DB", kind: "d1" }))).toBe(
      "NOT_FOUND",
    );
  });

  it("is decided once, by someone, and unblocks the version", async () => {
    const { tool, version } = await seed();
    const db = await registry.requestApproval(version.id, { resource: "DB", kind: "d1" });
    const files = await registry.requestApproval(version.id, { resource: "FILES", kind: "r2" });
    expect(await registry.unapproved(version.id)).toHaveLength(2);

    const approved = await registry.decideApproval(db.id, "approved", "ely");
    expect(approved).toMatchObject({ status: "approved", decidedBy: "ely" });
    expect(approved.decidedAt).toBeDefined();
    expect(await code(registry.decideApproval(db.id, "rejected", "eve"))).toBe("ALREADY_DECIDED");
    expect(await code(registry.decideApproval("missing", "approved", "ely"))).toBe("NOT_FOUND");

    expect((await registry.unapproved(version.id)).map((a) => a.id)).toEqual([files.id]);
    await registry.decideApproval(files.id, "rejected", "ely");
    expect(await registry.unapproved(version.id)).toHaveLength(1);
    expect((await registry.listApprovals(tool.id, "approved")).map((a) => a.id)).toEqual([db.id]);
    expect(await registry.listApprovals(tool.id)).toHaveLength(2);
  });
});

describe("secrets", () => {
  it("keeps values encrypted at rest and gives them back to the runtime", async () => {
    const { tool } = await seed();
    await registry.setSecret(tool.id, "production", "ODOO_KEY", "sk-test-value");
    await registry.setSecret(tool.id, "production", "ODOO_KEY", "sk-test-value-2");
    const raw = (await d1.prepare(`SELECT * FROM "secrets"`).all()).results as Array<
      Record<string, string>
    >;
    expect(raw).toHaveLength(1);
    expect(JSON.stringify(raw)).not.toContain("sk-test-value");
    expect(await registry.readSecrets(tool.id, "production")).toEqual({
      ODOO_KEY: "sk-test-value-2",
    });
    expect(await registry.readSecrets(tool.id, "preview")).toEqual({});
  });

  it("lists names only, per environment, and deletes", async () => {
    const { tool } = await seed();
    await registry.setSecret(tool.id, "preview", "B", "x");
    await registry.setSecret(tool.id, "preview", "A", "y");
    await registry.setSecret(tool.id, "production", "C", "z");
    expect(await registry.secretNames(tool.id, "preview")).toEqual(["A", "B"]);
    await registry.deleteSecret(tool.id, "preview", "A");
    expect(await registry.secretNames(tool.id, "preview")).toEqual(["B"]);
  });

  it("does not open a ciphertext moved to another slot", async () => {
    const { tool } = await seed();
    await registry.setSecret(tool.id, "preview", "A", "x");
    await d1.batch([d1.prepare(`UPDATE "secrets" SET "name" = 'B'`)]);
    await expect(registry.readSecrets(tool.id, "preview")).rejects.toThrow(
      /operation failed|decrypt|cipher/i,
    );
  });

  it("refuses to keep secrets without a key", async () => {
    const { tool } = await seed();
    const keyless = createRegistry(d1);
    expect(await code(keyless.setSecret(tool.id, "preview", "A", "x"))).toBe("NO_SECRET_KEY");
  });

  it("rejects a key that is not 32 bytes", async () => {
    await expect(createSecretBox(btoa("short"))).rejects.toThrow(/32 bytes/);
  });

  it("reports declared secrets as set or missing per environment, with no value", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "hub" });
    const build = await registry.recordBuild(tool.id, {
      fingerprint: "fp-secrets",
      manifest: { name: "hub", resources: { secrets: { ODOO_KEY: {}, API_KEY: {} } } },
    });
    await registry.publishVersion(tool.id, build.id, "1.0.0");
    await registry.setSecret(tool.id, "production", "ODOO_KEY", "test-only-value");
    await registry.setSecret(tool.id, "preview", "UNDECLARED", "x");

    const status = await registry.secretsStatus(tool.id);
    expect(status).toEqual([
      {
        name: "API_KEY",
        environments: { preview: "missing", production: "missing" },
      },
      {
        name: "ODOO_KEY",
        environments: { preview: "missing", production: "set" },
      },
    ]);
    expect(JSON.stringify(status)).not.toContain("test-only-value");
  });

  it("has no declared secret before a first version", async () => {
    const { tool } = await seed();
    expect(await registry.secretsStatus(tool.id)).toEqual([]);
  });
});

describe("members", () => {
  it("adds a person to a workspace and finds them by id and by identity subject", async () => {
    const added = await registry.addMember({
      workspace: "acme",
      subject: "sub-1",
      email: "ely@acme.fr",
      name: "Ely",
      roles: ["admin"],
    });
    expect(await registry.findMember("acme", added.id)).toEqual(added);
    expect(await registry.findMemberBySubject("acme", "sub-1")).toEqual(added);
    expect(await registry.findMember("globex", added.id)).toBeUndefined();
    expect(await registry.findMemberBySubject("globex", "sub-1")).toBeUndefined();
  });

  it("refuses the same identity twice in a workspace", async () => {
    const input = { workspace: "acme", subject: "s", email: "a@a.fr", name: "A", roles: [] };
    await registry.addMember(input);
    await expect(registry.addMember(input)).rejects.toThrow(/UNIQUE/);
  });
});

describe("one-time codes", () => {
  it("spends a code once", async () => {
    const until = new Date(Date.now() + 60_000);
    expect(await registry.spendCode("c1", until)).toBe(true);
    expect(await registry.spendCode("c1", until)).toBe(false);
    expect(await registry.spendCode("c2", until)).toBe(true);
  });
});

describe("seats", () => {
  it("counts a person once per workspace and month, whatever their calls", async () => {
    await registry.recordSeat("acme", "p1");
    await registry.recordSeat("acme", "p1");
    await registry.recordSeat("acme", "p2");
    await registry.recordSeat("globex", "p1");
    expect(await registry.countSeats("acme")).toBe(2);
    expect(await registry.countSeats("globex")).toBe(1);
    expect(await registry.countSeats("nobody")).toBe(0);
  });

  it("counts by calendar month, in UTC", async () => {
    let at = new Date(Date.UTC(2026, 9, 31, 23, 59, 0));
    const monthly = createRegistry(d1, { now: () => at });
    await monthly.recordSeat("acme", "p1");
    at = new Date(Date.UTC(2026, 10, 1, 0, 0, 0));
    await monthly.recordSeat("acme", "p1");
    await monthly.recordSeat("acme", "p2");
    expect(await monthly.countSeats("acme", "2026-10")).toBe(1);
    expect(await monthly.countSeats("acme")).toBe(2);
  });

  it("does not count a tool acting on its own behalf, and keeps nothing else", async () => {
    await registry.recordSeat("acme", "tool:crm");
    await registry.recordSeat("acme", "");
    await registry.recordSeat("acme", "p1");
    expect(await registry.countSeats("acme")).toBe(1);
    const rows = (await d1.prepare(`SELECT * FROM "seats"`).all()).results as Array<
      Record<string, unknown>
    >;
    expect(Object.keys(rows[0]!).sort()).toEqual(["month", "person_id", "workspace"]);
  });
});

describe("token revocation", () => {
  it("voids one token by its id, and all of a person's tokens up to now", async () => {
    const exp = new Date(Date.UTC(2026, 11, 1));
    const iat = Math.floor(Date.UTC(2026, 10, 3, 11, 0, 0) / 1000);
    expect(await registry.isTokenRevoked("acme", "p1", "a", iat)).toBe(false);
    await registry.revokeToken("acme", "p1", "a", exp);
    expect(await registry.isTokenRevoked("acme", "p1", "a", iat)).toBe(true);
    expect(await registry.isTokenRevoked("acme", "p1", "b", iat)).toBe(false);
    expect(await registry.isTokenRevoked("acme", "p2", "a", iat)).toBe(false);
    expect(await registry.isTokenRevoked("other", "p1", "a", iat)).toBe(false);

    await registry.revokePersonTokens("acme", "p1", 30 * 86_400);
    expect(await registry.isTokenRevoked("acme", "p1", "b", iat)).toBe(true);
    expect(await registry.isTokenRevoked("acme", "p1", undefined, iat)).toBe(true);
    // A token issued well after the revocation is good.
    expect(
      await registry.isTokenRevoked("acme", "p1", "c", Math.floor(Date.UTC(2026, 10, 4) / 1000)),
    ).toBe(false);
    expect(await registry.isTokenRevoked("acme", "p2", "b", iat)).toBe(false);
  });
});

describe("per-person secrets", () => {
  it("keeps one value per person and tool, encrypted, and revokes by person or name", async () => {
    const { tool } = await seed();
    await registry.setUserSecret({ toolId: tool.id, person: "p1", name: "KEY", value: "v-one" });
    await registry.setUserSecret({ toolId: tool.id, person: "p1", name: "KEY", value: "v-two" });
    await registry.setUserSecret({ toolId: tool.id, person: "p1", name: "OTHER", value: "x" });
    await registry.setUserSecret({ toolId: tool.id, person: "p2", name: "KEY", value: "v-p2" });

    expect(await registry.readUserSecrets(tool.id, "p1")).toEqual({ KEY: "v-two", OTHER: "x" });
    expect(await registry.readUserSecrets(tool.id, "p2")).toEqual({ KEY: "v-p2" });
    expect(await registry.readUserSecrets(tool.id, "p3")).toEqual({});
    const raw = JSON.stringify((await d1.prepare(`SELECT * FROM "user_secrets"`).all()).results);
    expect(raw).not.toContain("v-two");
    expect(await registry.userSecretHolders(tool.id)).toEqual([
      { person: "p1", names: ["KEY", "OTHER"] },
      { person: "p2", names: ["KEY"] },
    ]);

    expect(await registry.revokeUserSecrets(tool.id, "p1", "KEY")).toBe(1);
    expect(await registry.readUserSecrets(tool.id, "p1")).toEqual({ OTHER: "x" });
    expect(await registry.revokeUserSecrets(tool.id, "p1")).toBe(1);
    expect(await registry.revokeUserSecrets(tool.id, "p1")).toBe(0);
    expect(await registry.readUserSecrets(tool.id, "p2")).toEqual({ KEY: "v-p2" });
  });
});
