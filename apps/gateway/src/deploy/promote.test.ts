import { MigrationError, type Build, type D1Database, type Hosting } from "@forgeron/hosting";
import { createRegistry, deployBuild, migratePlatform, type Registry } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Person } from "../identity/authenticate";
import { issueToken } from "../identity/tokens";
import { handlePromote, handleRollback } from "./promote";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const secret = "test-secret-not-a-real-one";
const now = new Date("2026-11-03T10:00:00Z");

let memory: MemoryD1;
let registry: Registry;
beforeEach(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { now: () => now });
});
afterEach(() => memory.close());

const build = (fingerprint: string, over: Partial<Build> = {}): Build => ({
  manifest: { name: "crm", resources: {} } as unknown as Build["manifest"],
  worker: `// ${fingerprint}`,
  fingerprint,
  changelog: { entries: [{}], declared: "patch", detected: "patch" },
  ...over,
});

function fakeHosting(migrate?: () => Promise<{ applied: string[] }>) {
  const calls: string[] = [];
  const hosting: Hosting = {
    async provision(environment) {
      calls.push("provision");
      return { environment, bindings: [] };
    },
    async upload(provisioned, b) {
      calls.push(`upload:${b.fingerprint}`);
      return { provisioned, build: b };
    },
    async migrate() {
      calls.push("migrate");
      return migrate ? migrate() : { applied: [] };
    },
    async activate({ provisioned }) {
      calls.push("activate");
      return { url: `https://${provisioned.environment.name}.test` };
    },
    async teardown() {},
  };
  return { hosting, calls };
}

const person = (roles: string[]): Person => ({
  id: "m1",
  email: "ada@acme.test",
  name: "Ada",
  roles,
});

const context = (hosting: Hosting, who?: Person) => ({
  workspace: "acme",
  secret,
  now: () => now,
  registry,
  hosting,
  authenticate: () => who,
});

const deployToken = (tool = "crm") =>
  issueToken({
    secret,
    person: "deploy:ci",
    workspace: "acme",
    tool,
    ttlSeconds: 600,
    now,
    scope: "deploy",
  });

const post = (path: string, body: unknown, token?: string) =>
  new Request(`https://acme.forgeron.app${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

/** 1.0.0 on production; 1.1.0 then 1.2.0 on the preview of a branch. */
async function seed() {
  const tool = await registry.createTool({ workspace: "acme", name: "crm" });
  const { hosting } = fakeHosting();
  const dep = (environment: "preview" | "production", fp: string, version: string) =>
    deployBuild(registry, hosting, {
      tool,
      environment,
      ...(environment === "preview" ? { branch: "feat" } : {}),
      build: build(fp),
      version,
      actor: "ci",
    });
  await dep("production", "fp1", "1.0.0");
  await dep("preview", "fp2", "1.1.0");
  await dep("preview", "fp3", "1.2.0");
  return tool;
}

const historyOf = async (name: "preview" | "production") => {
  const tool = (await registry.findTool("acme", "crm"))!;
  const env = (await registry.listEnvironments(tool.id)).find((e) => e.name === name)!;
  const versions = await registry.listVersions(tool.id);
  return (await registry.history(env.id)).map((d) => ({
    actor: d.actor,
    kind: d.kind,
    version: versions.find((v) => v.id === d.versionId)?.version,
  }));
};

describe("POST /promote", () => {
  it("promotes an existing version for a deployment token, without a rebuild, and audits it", async () => {
    await seed();
    const { hosting, calls } = fakeHosting();
    const response = await handlePromote(
      post("/promote", { version: "1.1.0", to: "production" }, await deployToken()),
      context(hosting),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      tool: "crm",
      version: "1.1.0",
      environment: "production",
      url: "https://production.test",
    });
    // The code uploaded is the one recorded with the build of 1.1.0.
    expect(calls).toContain("upload:fp2");
    expect(await historyOf("production")).toEqual([
      { actor: "ci", kind: "deploy", version: "1.0.0" },
      { actor: "deploy:ci", kind: "promote", version: "1.1.0" },
    ]);
  });

  it("lets an administrator promote, recorded under their email", async () => {
    await seed();
    const response = await handlePromote(
      post("/promote", { tool: "crm", version: "1.2.0", to: "production" }),
      context(fakeHosting().hosting, person(["admin"])),
    );
    expect(response.status).toBe(200);
    expect((await historyOf("production")).at(-1)).toEqual({
      actor: "ada@acme.test",
      kind: "promote",
      version: "1.2.0",
    });
  });

  it("keeps the reason of a promotion and of a rollback in the audit line, and bounds it", async () => {
    await seed();
    const admin = person(["admin"]);
    const { hosting } = fakeHosting();
    const promoted = await handlePromote(
      post("/promote", { tool: "crm", version: "1.2.0", to: "production", reason: " Ship it " }),
      context(hosting, admin),
    );
    expect(promoted.status).toBe(200);
    const rolled = await handleRollback(
      post("/rollback", { tool: "crm", environment: "production", reason: "Export is broken" }),
      context(hosting, admin),
    );
    expect(rolled.status).toBe(200);
    const tool = (await registry.findTool("acme", "crm"))!;
    const lines = await registry.listAudit(tool.id, { limit: 2 });
    expect(lines.map((l) => [l.kind, (l.detail as { reason?: string }).reason])).toEqual([
      ["rollback", "Export is broken"],
      ["promotion", "Ship it"],
    ]);
    for (const reason of [3, "x".repeat(501)]) {
      const refused = await handlePromote(
        post("/promote", { tool: "crm", version: "1.2.0", to: "production", reason }),
        context(hosting, admin),
      );
      expect(refused.status).toBe(400);
    }
  });

  it("refuses anonymous callers, developers, other tools' tokens and other workspaces' tokens", async () => {
    await seed();
    const { hosting, calls } = fakeHosting();
    const body = { tool: "crm", version: "1.1.0", to: "production" };
    expect((await handlePromote(post("/promote", body), context(hosting))).status).toBe(401);
    expect(
      (await handlePromote(post("/promote", body), context(hosting, person(["developer"])))).status,
    ).toBe(403);
    expect(
      (await handlePromote(post("/promote", body, await deployToken("odoo")), context(hosting)))
        .status,
    ).toBe(403);
    const foreign = await issueToken({
      secret,
      person: "deploy:ci",
      workspace: "globex",
      tool: "crm",
      ttlSeconds: 600,
      now,
      scope: "deploy",
    });
    expect((await handlePromote(post("/promote", body, foreign), context(hosting))).status).toBe(
      403,
    );
    expect(calls).toEqual([]);
  });

  it("refuses a version whose changelog does not cover the change (FOR-64)", async () => {
    await seed();
    // A preview takes a build with no changelog; production must not take it by promotion.
    const tool = (await registry.findTool("acme", "crm"))!;
    await deployBuild(registry, fakeHosting().hosting, {
      tool,
      environment: "preview",
      branch: "feat",
      build: build("fp9", { changelog: undefined }),
      version: "1.3.0-preview.feat",
      actor: "ci",
    });
    const response = await handlePromote(
      post("/promote", { version: "1.3.0-preview.feat", to: "production" }, await deployToken()),
      context(fakeHosting().hosting),
    );
    expect(response.status).toBe(422);
    expect(await response.json()).toMatchObject({ error: { code: "NO_ENTRY" } });
    expect(await historyOf("production")).toHaveLength(1);
  });

  it("answers 409 when the migrations are refused, and records no promotion", async () => {
    await seed();
    const { hosting } = fakeHosting(async () => {
      throw new MigrationError(
        "DESTRUCTIVE",
        "0002",
        "0002 is destructive: pass --allow-destructive.",
      );
    });
    const response = await handlePromote(
      post("/promote", { version: "1.1.0", to: "production" }, await deployToken()),
      context(hosting),
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: "MIGRATION_REFUSED" } });
    expect(await historyOf("production")).toHaveLength(1);
  });

  it("answers 404 for a version the tool does not have, and 400 for a bad body", async () => {
    await seed();
    const token = await deployToken();
    const ctx = context(fakeHosting().hosting);
    expect(
      (await handlePromote(post("/promote", { version: "9.9.9", to: "production" }, token), ctx))
        .status,
    ).toBe(404);
    expect(
      (await handlePromote(post("/promote", { version: "1.0.0", to: "staging" }, token), ctx))
        .status,
    ).toBe(400);
    // There is no pilot environment, and no group to promote to.
    expect(
      (await handlePromote(post("/promote", { version: "1.0.0", to: "pilot" }, token), ctx)).status,
    ).toBe(400);
    expect(
      (await handlePromote(new Request("https://acme.forgeron.app/promote"), ctx)).status,
    ).toBe(405);
  });
});

describe("POST /rollback", () => {
  it("puts the previous version back, applies no migration and audits it", async () => {
    await seed();
    const promoted = await handlePromote(
      post("/promote", { version: "1.1.0", to: "production" }, await deployToken()),
      context(fakeHosting().hosting),
    );
    expect(promoted.status).toBe(200);
    const { hosting, calls } = fakeHosting();
    const response = await handleRollback(
      post("/rollback", { environment: "production" }, await deployToken()),
      context(hosting),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ version: "1.0.0", environment: "production" });
    expect(calls).not.toContain("migrate");
    expect(await historyOf("production")).toEqual([
      { actor: "ci", kind: "deploy", version: "1.0.0" },
      { actor: "deploy:ci", kind: "promote", version: "1.1.0" },
      { actor: "deploy:ci", kind: "rollback", version: "1.0.0" },
    ]);
  });

  it("refuses the pilot, which no longer exists", async () => {
    await seed();
    const response = await handleRollback(
      post("/rollback", { environment: "pilot" }, await deployToken()),
      context(fakeHosting().hosting),
    );
    expect(response.status).toBe(400);
  });

  it("answers 409 when the environment has no earlier version", async () => {
    await seed();
    const response = await handleRollback(
      post("/rollback", { tool: "crm", environment: "production" }, undefined),
      context(fakeHosting().hosting, person(["admin"])),
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: "NO_PREVIOUS" } });
  });

  it("is for administrators and deployment tokens only", async () => {
    await seed();
    const body = { tool: "crm", environment: "production" };
    const ctx = (who?: Person) => context(fakeHosting().hosting, who);
    expect((await handleRollback(post("/rollback", body), ctx())).status).toBe(401);
    expect((await handleRollback(post("/rollback", body), ctx(person([])))).status).toBe(403);
  });
});
