import type { Build, D1Database, Hosting } from "@forgeron/hosting";
import {
  createRegistry,
  deployBuild,
  migratePlatform,
  putOnChannel,
  type Registry,
} from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Person } from "../kernel/person";
import { issueToken } from "../identity/authn/tokens";
import { handleRollback } from "./rollback";
import type { PlatformPermission } from "@forgeron/permissions";
import { testPerson } from "../kernel/test-person";

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

const person = (permissions: PlatformPermission[]): Person =>
  testPerson(permissions, [], { id: "m1" });

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

describe("POST /rollback", () => {
  it("puts the previous version back, applies no migration and audits it", async () => {
    const tool = await seed();
    await putOnChannel(registry, fakeHosting().hosting, {
      tool,
      version: "1.1.0",
      to: "production",
      actor: "deploy:ci",
    });
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
      context(fakeHosting().hosting, person(["tools:publish"])),
    );
    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({ error: { code: "NO_PREVIOUS" } });
  });

  it("keeps the reason in the audit line, and bounds it", async () => {
    const tool = await seed();
    const publisher = person(["tools:publish"]);
    const { hosting } = fakeHosting();
    await putOnChannel(registry, hosting, { tool, version: "1.2.0", to: "production", actor: "a" });
    const rolled = await handleRollback(
      post("/rollback", { tool: "crm", environment: "production", reason: "Export is broken" }),
      context(hosting, publisher),
    );
    expect(rolled.status).toBe(200);
    const [line] = await registry.listAudit(tool.id, { limit: 1 });
    expect([line!.kind, (line!.detail as { reason?: string }).reason]).toEqual([
      "rollback",
      "Export is broken",
    ]);
    for (const reason of [3, "x".repeat(501)]) {
      const refused = await handleRollback(
        post("/rollback", { tool: "crm", environment: "production", reason }),
        context(hosting, publisher),
      );
      expect(refused.status).toBe(400);
    }
  });

  it("rolls a permanent channel back to a release it served (D-125)", async () => {
    const tool = await seed();
    await registry.addChannel({ toolId: tool.id, name: "staging", follows: "feat", actor: "a" });
    const { hosting } = fakeHosting();
    for (const version of ["1.1.0", "1.2.0"]) {
      await putOnChannel(registry, hosting, {
        tool,
        version,
        to: "channel",
        channel: "staging",
        actor: "a",
      });
    }
    const missing = await handleRollback(
      post("/rollback", { tool: "crm", environment: "channel" }),
      context(hosting, person(["tools:publish"])),
    );
    expect(missing.status).toBe(400);
    const response = await handleRollback(
      post("/rollback", { tool: "crm", environment: "channel", channel: "staging" }),
      context(hosting, person(["tools:publish"])),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      version: "1.1.0",
      environment: "channel",
      channel: "staging",
    });
    const ghost = await handleRollback(
      post("/rollback", { tool: "crm", environment: "channel", channel: "ghost" }),
      context(hosting, person(["tools:publish"])),
    );
    expect(ghost.status).toBe(404);
  });

  it("is for who holds `tools:publish` and deployment tokens only", async () => {
    await seed();
    const body = { tool: "crm", environment: "production" };
    const ctx = (who?: Person) => context(fakeHosting().hosting, who);
    expect((await handleRollback(post("/rollback", body), ctx())).status).toBe(401);
    expect((await handleRollback(post("/rollback", body), ctx(person([])))).status).toBe(403);
    expect(
      (await handleRollback(post("/rollback", body), ctx(person(["tools:write", "tools:data"]))))
        .status,
    ).toBe(403);
  });
});
