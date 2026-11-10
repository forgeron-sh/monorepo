import { applyMigrations, type D1Database } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRegistry, createSecretBox, migratePlatform, type Registry } from "./index";
import { platformMigrations } from "./migrations";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The registry of a person's secrets (D-104): a secret, its versions, and the bindings that say which tool
// field uses it, in which scope. The four methods the gateway uses keep their names and meaning.

const KEY = btoa(String.fromCharCode(...new Uint8Array(32)));
let memory: MemoryD1;
let d1: D1Database;
let registry: Registry;
beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { secrets: await createSecretBox(KEY) });
});
afterEach(() => memory.close());

const rows = async (sql: string, ...values: unknown[]) =>
  ((
    await d1
      .prepare(sql)
      .bind(...values)
      .all()
  ).results ?? []) as Array<Record<string, unknown>>;

describe("a person's secret and its versions", () => {
  it("makes one secret, one version and one tool-wide binding, and a new value is a new version of the same secret", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "odoo" });
    await registry.setUserSecret({
      toolId: tool.id,
      person: "p1",
      name: "ODOO_API_KEY",
      value: "key-one",
    });
    await registry.setUserSecret({
      toolId: tool.id,
      person: "p1",
      name: "ODOO_API_KEY",
      value: "key-two",
    });

    expect(await registry.readUserSecrets(tool.id, "p1")).toEqual({ ODOO_API_KEY: "key-two" });
    const secrets = await rows(`SELECT "id", "workspace", "person", "label" FROM "person_secrets"`);
    expect(secrets).toHaveLength(1);
    expect(secrets[0]).toMatchObject({ workspace: "acme", person: "p1", label: "ODOO_API_KEY" });
    // Two immutable versions under the same identity, and one binding.
    const versions = await rows(
      `SELECT "version", "created_by", "via" FROM "person_secret_versions" ORDER BY "version"`,
    );
    expect(versions).toEqual([
      { version: 1, created_by: "p1", via: "setup" },
      { version: 2, created_by: "p1", via: "setup" },
    ]);
    expect(await rows(`SELECT "field", "scope", "pin" FROM "secret_bindings"`)).toEqual([
      { field: "ODOO_API_KEY", scope: "*", pin: null },
    ]);
  });

  it("seals every version for its person, secret and version: it opens nowhere else", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "odoo" });
    await registry.setUserSecret({
      toolId: tool.id,
      person: "p1",
      name: "K",
      value: "only-for-p1",
    });
    await registry.setUserSecret({
      toolId: tool.id,
      person: "p2",
      name: "K",
      value: "only-for-p2",
    });
    expect(JSON.stringify(await rows(`SELECT * FROM "person_secret_versions"`))).not.toContain(
      "only-for",
    );
    // A ciphertext moved to another person's version does not open.
    const [a, b] = await rows(
      `SELECT "secret_id", "iv", "ciphertext" FROM "person_secret_versions"`,
    );
    await d1
      .prepare(
        `UPDATE "person_secret_versions" SET "iv" = ?, "ciphertext" = ? WHERE "secret_id" = ?`,
      )
      .bind(a!.iv, a!.ciphertext, b!.secret_id)
      .all();
    await expect(registry.readUserSecrets(tool.id, "p1")).resolves.toBeDefined();
    await expect(registry.readUserSecrets(tool.id, "p2")).rejects.toMatchObject({
      name: "OperationError",
    });
  });

  it("records who typed a version, and how", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "odoo" });
    await registry.setUserSecret({
      toolId: tool.id,
      person: "p1",
      name: "K",
      value: "v",
      by: "admin-1",
      via: "admin",
    });
    expect(await rows(`SELECT "created_by", "via" FROM "person_secret_versions"`)).toEqual([
      { created_by: "admin-1", via: "admin" },
    ]);
  });

  it("keeps one person's, one tool's and one field's secrets apart", async () => {
    const odoo = await registry.createTool({ workspace: "acme", name: "odoo" });
    const crm = await registry.createTool({ workspace: "acme", name: "crm" });
    await registry.setUserSecret({ toolId: odoo.id, person: "p1", name: "KEY", value: "odoo-p1" });
    await registry.setUserSecret({
      toolId: odoo.id,
      person: "p1",
      name: "LOGIN",
      value: "login-p1",
    });
    await registry.setUserSecret({ toolId: odoo.id, person: "p2", name: "KEY", value: "odoo-p2" });
    await registry.setUserSecret({ toolId: crm.id, person: "p1", name: "KEY", value: "crm-p1" });
    expect(await registry.readUserSecrets(odoo.id, "p1")).toEqual({
      KEY: "odoo-p1",
      LOGIN: "login-p1",
    });
    expect(await registry.readUserSecrets(odoo.id, "p2")).toEqual({ KEY: "odoo-p2" });
    expect(await registry.readUserSecrets(crm.id, "p1")).toEqual({ KEY: "crm-p1" });
    expect(await registry.readUserSecrets(crm.id, "p3")).toEqual({});
    expect(await registry.userSecretHolders(odoo.id)).toEqual([
      { person: "p1", names: ["KEY", "LOGIN"] },
      { person: "p2", names: ["KEY"] },
    ]);
  });
});

describe("which binding applies where a call is served", () => {
  // Bindings other than the tool-wide one are made by the person's page (a later ticket); here they are
  // written directly, to prove how a call resolves them.
  async function bind(toolId: string, person: string, scope: string, value: string, pin?: number) {
    const box = await createSecretBox(KEY);
    const id = `sec_${scope}`;
    const aad = `secret/acme/${person}/${id}/1`;
    const sealed = await box.seal(aad, value);
    await d1
      .prepare(
        `INSERT INTO "person_secrets" ("id", "workspace", "person", "label", "created_at") VALUES (?, 'acme', ?, 'K', 'now')`,
      )
      .bind(id, person)
      .all();
    await d1
      .prepare(
        `INSERT INTO "person_secret_versions" ("secret_id", "version", "iv", "ciphertext", "aad", "created_at", "created_by", "via") VALUES (?, 1, ?, ?, ?, 'now', ?, 'test')`,
      )
      .bind(id, sealed.iv, sealed.ciphertext, aad, person)
      .all();
    await d1
      .prepare(
        `INSERT INTO "secret_bindings" ("tool_id", "person", "field", "scope", "secret_id", "pin") VALUES (?, ?, 'K', ?, ?, ?)`,
      )
      .bind(toolId, person, scope, id, pin ?? null)
      .all();
  }

  it("takes the most specific one: a branch, then preview, then production, then tool-wide", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "odoo" });
    await registry.setUserSecret({ toolId: tool.id, person: "p1", name: "K", value: "tool-wide" });
    expect(
      await registry.readUserSecrets(tool.id, "p1", { environment: "preview", branch: "feat" }),
    ).toEqual({
      K: "tool-wide",
    });
    await bind(tool.id, "p1", "production", "prod-only");
    await bind(tool.id, "p1", "preview", "any-preview");
    await bind(tool.id, "p1", "preview:feat", "branch-feat");

    const at = (served: Parameters<Registry["readUserSecrets"]>[2]) =>
      registry.readUserSecrets(tool.id, "p1", served);
    expect(await at({})).toEqual({ K: "prod-only" });
    expect(await at({ environment: "production" })).toEqual({ K: "prod-only" });
    expect(await at({ environment: "preview", branch: "feat" })).toEqual({ K: "branch-feat" });
    expect(await at({ environment: "preview", branch: "other" })).toEqual({ K: "any-preview" });
    expect(await at({ environment: "preview" })).toEqual({ K: "any-preview" });
  });

  it("gives a field nothing where only another scope has a binding", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "odoo" });
    await bind(tool.id, "p1", "preview:feat", "branch-only");
    expect(await registry.readUserSecrets(tool.id, "p1")).toEqual({});
    expect(
      await registry.readUserSecrets(tool.id, "p1", { environment: "preview", branch: "feat" }),
    ).toEqual({
      K: "branch-only",
    });
  });

  it("refuses a scope that is not one", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "odoo" });
    await expect(bind(tool.id, "p1", "staging", "x")).rejects.toThrow(/CHECK|constraint/i);
  });
});

describe("clearing and removing", () => {
  it("an admin's revocation clears the field everywhere, and deletes a secret nothing uses any more", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "odoo" });
    await registry.setUserSecret({ toolId: tool.id, person: "p1", name: "KEY", value: "v" });
    await registry.setUserSecret({ toolId: tool.id, person: "p1", name: "LOGIN", value: "l" });
    expect(await registry.revokeUserSecrets(tool.id, "p1", "KEY")).toBe(1);
    expect(await registry.revokeUserSecrets(tool.id, "p1", "KEY")).toBe(0);
    expect(await registry.readUserSecrets(tool.id, "p1")).toEqual({ LOGIN: "l" });
    expect(await rows(`SELECT "label" FROM "person_secrets"`)).toEqual([{ label: "LOGIN" }]);
    expect(await rows(`SELECT 1 FROM "person_secret_versions"`)).toHaveLength(1);
    expect(await registry.revokeUserSecrets(tool.id, "p1")).toBe(1);
    expect(await rows(`SELECT 1 FROM "person_secrets"`)).toEqual([]);
    expect(await rows(`SELECT 1 FROM "person_secret_versions"`)).toEqual([]);
  });

  it("keeps a secret another tool still uses, and one that is not bound at all", async () => {
    const odoo = await registry.createTool({ workspace: "acme", name: "odoo" });
    const crm = await registry.createTool({ workspace: "acme", name: "crm" });
    await registry.setUserSecret({ toolId: odoo.id, person: "p1", name: "KEY", value: "shared" });
    const [{ id }] = (await rows(`SELECT "id" FROM "person_secrets"`)) as [{ id: string }];
    // The same secret bound to a second tool (the person's page will do this): clearing one keeps the other.
    await d1
      .prepare(
        `INSERT INTO "secret_bindings" ("tool_id", "person", "field", "scope", "secret_id") VALUES (?, 'p1', 'KEY', '*', ?)`,
      )
      .bind(crm.id, id)
      .all();
    // And a secret the person keeps, bound to nothing.
    await d1
      .prepare(
        `INSERT INTO "person_secrets" ("id", "workspace", "person", "label", "created_at") VALUES ('sec_kept', 'acme', 'p1', 'Kept', 'now')`,
      )
      .all();
    expect(await registry.revokeUserSecrets(odoo.id, "p1")).toBe(1);
    expect(await registry.readUserSecrets(crm.id, "p1")).toEqual({ KEY: "shared" });
    expect(await rows(`SELECT "id" FROM "person_secrets" ORDER BY "id"`)).toEqual(
      [{ id }, { id: "sec_kept" }].sort((x, y) => (x.id < y.id ? -1 : 1)),
    );
  });

  it("goes with the person: removing a member removes their secrets, versions and bindings and nobody else's", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "odoo" });
    const ana = (
      await registry.addMember({
        workspace: "acme",
        subject: "ana",
        email: "ana@acme.test",
        name: "Ana",
        roles: [],
      })
    ).id;
    const admin = (
      await registry.addMember({
        workspace: "acme",
        subject: "root",
        email: "root@acme.test",
        name: "Root",
        roles: ["admin"],
      })
    ).id;
    await registry.setUserSecret({ toolId: tool.id, person: ana, name: "KEY", value: "ana-key" });
    await registry.setUserSecret({
      toolId: tool.id,
      person: "other",
      name: "KEY",
      value: "other-key",
    });
    await registry.removeMember("acme", ana, admin);
    expect(await registry.readUserSecrets(tool.id, ana)).toEqual({});
    expect(await registry.readUserSecrets(tool.id, "other")).toEqual({ KEY: "other-key" });
    expect(await rows(`SELECT "person" FROM "person_secrets"`)).toEqual([{ person: "other" }]);
    expect(await rows(`SELECT 1 FROM "person_secret_versions"`)).toHaveLength(1);
    expect(await rows(`SELECT "person" FROM "secret_bindings"`)).toEqual([{ person: "other" }]);
  });

  it("keeps a person's secrets when a tool is deleted from the catalogue's point of view: the bindings go, the secret stays", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "odoo" });
    await registry.setUserSecret({ toolId: tool.id, person: "p1", name: "KEY", value: "v" });
    await d1.prepare(`DELETE FROM "tools" WHERE "id" = ?`).bind(tool.id).all();
    expect(await rows(`SELECT 1 FROM "secret_bindings"`)).toEqual([]);
    expect(await rows(`SELECT 1 FROM "person_secrets"`)).toHaveLength(1);
  });
});

describe("secrets typed before the registry existed (D-036)", () => {
  it("convert without being opened, and keep opening with the additional data they were sealed with", async () => {
    // A database as installed before 0027, holding a value sealed the old way.
    const old = await createMemoryD1();
    try {
      const before = old as unknown as D1Database;
      await applyMigrations(
        before,
        platformMigrations.filter((m) => m.name < "0027"),
      );
      const box = await createSecretBox(KEY);
      await before
        .prepare(
          `INSERT INTO "tools" ("id", "workspace", "name", "created_at") VALUES ('t1', 'acme', 'odoo', 'then')`,
        )
        .all();
      const sealed = await box.seal("user/t1/p1/ODOO_API_KEY", "typed-before-the-registry");
      await before
        .prepare(
          `INSERT INTO "user_secrets" ("tool_id", "person", "name", "iv", "ciphertext", "updated_at") VALUES ('t1', 'p1', 'ODOO_API_KEY', ?, ?, 'then')`,
        )
        .bind(sealed.iv, sealed.ciphertext)
        .all();
      // The registry arrives.
      expect((await applyMigrations(before, platformMigrations)).applied).toEqual([
        "0027_secret_registry",
        "0028_drop_user_secrets",
        "0029_marketplaces",
        "0030_install_plans_source",
        "0031_library",
      ]);
      // The legacy table is gone once the rows are converted (D-110).
      await expect(before.prepare(`SELECT 1 FROM "user_secrets"`).all()).rejects.toBeDefined();
      const upgraded = createRegistry(before, { secrets: box });
      expect(await upgraded.readUserSecrets("t1", "p1")).toEqual({
        ODOO_API_KEY: "typed-before-the-registry",
      });
      expect(
        (
          await before
            .prepare(
              `SELECT "workspace", "label", "via" FROM "person_secrets" s JOIN "person_secret_versions" v ON v."secret_id" = s."id"`,
            )
            .all()
        ).results,
      ).toEqual([{ workspace: "acme", label: "ODOO_API_KEY", via: "legacy" }]);
      // A new value is the next version of the same secret, not a second one.
      await upgraded.setUserSecret({
        toolId: "t1",
        person: "p1",
        name: "ODOO_API_KEY",
        value: "rotated",
      });
      expect(await upgraded.readUserSecrets("t1", "p1")).toEqual({ ODOO_API_KEY: "rotated" });
      expect(
        (await before.prepare(`SELECT COUNT(*) AS n FROM "person_secrets"`).all()).results,
      ).toEqual([{ n: 1 }]);
    } finally {
      old.close();
    }
  });
});

describe("offering a saved secret to another tool (D-105)", () => {
  it("lists a person's own secrets without a value: label, kind, versions and where they are used", async () => {
    const odoo = await registry.createTool({ workspace: "acme", name: "odoo" });
    await registry.setUserSecret({
      toolId: odoo.id,
      person: "p1",
      name: "ODOO_API_KEY",
      value: "key-one",
      label: "Odoo API key",
      kind: "odoo.api-key",
    });
    await registry.setUserSecret({
      toolId: odoo.id,
      person: "p1",
      name: "ODOO_API_KEY",
      value: "key-two",
    });
    await registry.setUserSecret({
      toolId: odoo.id,
      person: "p2",
      name: "ODOO_API_KEY",
      value: "not-p1",
    });
    const listed = await registry.listPersonSecrets("acme", "p1");
    expect(listed).toEqual([
      {
        id: expect.stringMatching(/^sec_/),
        label: "Odoo API key",
        kind: "odoo.api-key",
        versions: 2,
        updatedAt: expect.any(String),
        history: [
          { version: 2, createdAt: expect.any(String), via: "setup", byPerson: true },
          { version: 1, createdAt: expect.any(String), via: "setup", byPerson: true },
        ],
        usedBy: [{ tool: "odoo", field: "ODOO_API_KEY", scope: "*" }],
      },
    ]);
    expect(JSON.stringify(listed)).not.toContain("key-");
    expect(await registry.listPersonSecrets("acme", "nobody")).toEqual([]);
    expect(await registry.listPersonSecrets("other-workspace", "p1")).toEqual([]);
  });

  it("opens only the person's own secret, in their workspace", async () => {
    const odoo = await registry.createTool({ workspace: "acme", name: "odoo" });
    await registry.setUserSecret({ toolId: odoo.id, person: "p1", name: "K", value: "p1-value" });
    const id = (await registry.listPersonSecrets("acme", "p1"))[0]!.id;
    expect(await registry.readPersonSecret("acme", "p1", id)).toBe("p1-value");
    expect(await registry.readPersonSecret("acme", "p2", id)).toBeUndefined();
    expect(await registry.readPersonSecret("other-workspace", "p1", id)).toBeUndefined();
    expect(await registry.readPersonSecret("acme", "p1", "sec_unknown")).toBeUndefined();
  });

  it("binds a saved secret to another tool's field: one secret, two bindings, audited without a value", async () => {
    const odoo = await registry.createTool({ workspace: "acme", name: "odoo" });
    const hr = await registry.createTool({ workspace: "acme", name: "hr" });
    await registry.setUserSecret({
      toolId: odoo.id,
      person: "p1",
      name: "K",
      value: "shared-value",
    });
    const id = (await registry.listPersonSecrets("acme", "p1"))[0]!.id;
    await registry.bindUserSecret({ toolId: hr.id, person: "p1", field: "HR_KEY", secretId: id });
    expect(await registry.readUserSecrets(hr.id, "p1")).toEqual({ HR_KEY: "shared-value" });
    expect(await registry.listPersonSecrets("acme", "p1")).toHaveLength(1);
    const lines = await registry.listAudit(hr.id);
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ actor: "p1", kind: "access", subject: "secret:bound" });
    expect(JSON.stringify(lines)).not.toContain("shared-value");
    // Rotating once changes what both tools get.
    await registry.setUserSecret({ toolId: odoo.id, person: "p1", name: "K", value: "rotated" });
    expect(await registry.readUserSecrets(hr.id, "p1")).toEqual({ HR_KEY: "rotated" });
    // Clearing one tool's field keeps the secret for the other.
    expect(await registry.revokeUserSecrets(hr.id, "p1")).toBe(1);
    expect(await registry.readUserSecrets(odoo.id, "p1")).toEqual({ K: "rotated" });
  });

  it("refuses to bind a secret that is not the person's, or from another workspace", async () => {
    const odoo = await registry.createTool({ workspace: "acme", name: "odoo" });
    const away = await registry.createTool({ workspace: "globex", name: "odoo" });
    await registry.setUserSecret({ toolId: odoo.id, person: "p1", name: "K", value: "mine" });
    const id = (await registry.listPersonSecrets("acme", "p1"))[0]!.id;
    await expect(
      registry.bindUserSecret({ toolId: odoo.id, person: "p2", field: "K", secretId: id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(
      registry.bindUserSecret({ toolId: away.id, person: "p1", field: "K", secretId: id }),
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
    expect(await registry.readUserSecrets(odoo.id, "p2")).toEqual({});
    expect(await registry.listAudit(odoo.id)).toEqual([]);
  });
});

describe("managing one's own secrets (D-106)", () => {
  const odoo = async () => registry.createTool({ workspace: "acme", name: "odoo" });

  it("makes a secret that no tool uses, and adds versions that the audit records without a value", async () => {
    const id = await registry.createPersonSecret({
      workspace: "acme",
      person: "p1",
      label: "My Odoo key",
      kind: "odoo.api-key",
      value: "first-value",
    });
    expect(await registry.readPersonSecret("acme", "p1", id)).toBe("first-value");
    expect(
      await registry.addSecretVersion({
        workspace: "acme",
        person: "p1",
        secretId: id,
        value: "second-value",
      }),
    ).toBe(2);
    expect(await registry.readPersonSecret("acme", "p1", id)).toBe("second-value");
    // An earlier version is still readable, by its number.
    expect(await registry.readPersonSecret("acme", "p1", id, 1)).toBe("first-value");
    expect(await registry.readPersonSecret("acme", "p1", id, 9)).toBeUndefined();
    const [listed] = await registry.listPersonSecrets("acme", "p1");
    expect(listed).toMatchObject({
      label: "My Odoo key",
      kind: "odoo.api-key",
      versions: 2,
      usedBy: [],
    });
    const lines = (
      await d1.prepare(`SELECT "subject", "actor", "detail" FROM "audit_log" ORDER BY "at"`).all()
    ).results as Array<{ subject: string; detail: string }>;
    expect(lines.map((l) => l.subject)).toEqual(["secret:created", "secret:version"]);
    expect(JSON.stringify(lines)).not.toContain("-value");
  });

  it("refuses a version for a secret that is not the person's", async () => {
    const id = await registry.createPersonSecret({
      workspace: "acme",
      person: "p1",
      label: "K",
      value: "v",
    });
    expect(
      await registry.addSecretVersion({
        workspace: "acme",
        person: "p2",
        secretId: id,
        value: "x",
      }),
    ).toBeUndefined();
    expect(
      await registry.addSecretVersion({
        workspace: "other",
        person: "p1",
        secretId: id,
        value: "x",
      }),
    ).toBeUndefined();
    expect(await registry.renamePersonSecret("acme", "p2", id, "Stolen")).toBe(false);
    expect(await registry.deletePersonSecret("acme", "p2", id)).toBeUndefined();
    expect(await registry.renamePersonSecret("acme", "p1", id, "Renamed")).toBe(true);
    expect((await registry.listPersonSecrets("acme", "p1"))[0]!.label).toBe("Renamed");
  });

  it("pins a binding to an earlier version, and refuses a version or a scope that does not exist", async () => {
    const tool = await odoo();
    await registry.setUserSecret({ toolId: tool.id, person: "p1", name: "K", value: "v-one" });
    const id = (await registry.listPersonSecrets("acme", "p1"))[0]!.id;
    await registry.addSecretVersion({
      workspace: "acme",
      person: "p1",
      secretId: id,
      value: "v-two",
    });
    expect(await registry.readUserSecrets(tool.id, "p1")).toEqual({ K: "v-two" });
    await registry.bindUserSecret({
      toolId: tool.id,
      person: "p1",
      field: "K",
      secretId: id,
      pin: 1,
    });
    expect(await registry.readUserSecrets(tool.id, "p1")).toEqual({ K: "v-one" });
    expect((await registry.listPersonSecrets("acme", "p1"))[0]!.usedBy).toEqual([
      { tool: "odoo", field: "K", scope: "*", pin: 1 },
    ]);
    await expect(
      registry.bindUserSecret({ toolId: tool.id, person: "p1", field: "K", secretId: id, pin: 5 }),
    ).rejects.toMatchObject({ code: "INVALID" });
    await expect(
      registry.bindUserSecret({
        toolId: tool.id,
        person: "p1",
        field: "K",
        secretId: id,
        scope: "staging",
      }),
    ).rejects.toMatchObject({ code: "INVALID" });
    // A new value typed at the tool's own page is the latest again: the pin is cleared.
    await registry.setUserSecret({ toolId: tool.id, person: "p1", name: "K", value: "v-three" });
    expect(await registry.readUserSecrets(tool.id, "p1")).toEqual({ K: "v-three" });
  });

  it("unbinds one scope and keeps the secret; deletes a secret with its versions and bindings", async () => {
    const tool = await odoo();
    await registry.setUserSecret({ toolId: tool.id, person: "p1", name: "K", value: "v" });
    const id = (await registry.listPersonSecrets("acme", "p1"))[0]!.id;
    await registry.bindUserSecret({
      toolId: tool.id,
      person: "p1",
      field: "K",
      secretId: id,
      scope: "preview:feat",
    });
    expect(
      await registry.unbindUserSecret({
        toolId: tool.id,
        person: "p1",
        field: "K",
        scope: "preview:feat",
      }),
    ).toBe(true);
    expect(
      await registry.unbindUserSecret({
        toolId: tool.id,
        person: "p1",
        field: "K",
        scope: "preview:feat",
      }),
    ).toBe(false);
    expect(await registry.readUserSecrets(tool.id, "p1")).toEqual({ K: "v" });
    expect(await registry.deletePersonSecret("acme", "p1", id)).toBe(1);
    expect(await registry.readUserSecrets(tool.id, "p1")).toEqual({});
    expect(await registry.listPersonSecrets("acme", "p1")).toEqual([]);
    expect(await registry.deletePersonSecret("acme", "p1", id)).toBeUndefined();
  });
});
