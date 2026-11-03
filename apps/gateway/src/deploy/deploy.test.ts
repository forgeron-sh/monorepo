import type { Build, D1Database, Hosting } from "@forgeron/hosting";
import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import { Miniflare } from "miniflare";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { issueToken } from "../identity/tokens";
import { handleCreateDeployToken, handleDeploy } from "./deploy";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const secret = "test-secret-not-a-real-one";
const now = new Date("2026-11-03T10:00:00Z");

let mf: Miniflare;
let registry: Registry;
beforeEach(async () => {
  mf = new Miniflare({
    modules: true,
    script: "export default { fetch() { return new Response('') } }",
    compatibilityDate: "2026-07-01",
    d1Databases: ["DB"],
  });
  const d1 = (await mf.getD1Database("DB")) as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { now: () => now });
});
afterEach(() => mf.dispose());

function fakeHosting(failMigrate = false) {
  const calls: string[] = [];
  const hosting: Hosting = {
    async provision(environment) {
      calls.push("provision");
      return { environment, bindings: [] };
    },
    async upload(provisioned, build) {
      calls.push("upload");
      return { provisioned, build };
    },
    async migrate() {
      calls.push("migrate");
      if (failMigrate) throw new Error("migration failed");
      return { applied: [] };
    },
    async activate({ provisioned }) {
      calls.push("activate");
      return { url: `https://${provisioned.environment.name}.test` };
    },
    async teardown() {},
  };
  return { hosting, calls };
}

const build = (name = "crm", fingerprint = "fp1"): Build => ({
  manifest: { name, resources: {} } as unknown as Build["manifest"],
  worker: "export default {}",
  fingerprint,
  changelog: { entries: [{}], declared: "patch", detected: "patch" },
});

/** The audit log of a tool's environment: who put which version there, and when. */
async function historyOf(environment: string, branch?: string) {
  const tool = (await registry.findTool("acme", "crm"))!;
  const target = (await registry.listEnvironments(tool.id)).find(
    (e) => e.name === environment && e.branch === branch,
  )!;
  const versions = await registry.listVersions(tool.id);
  return (await registry.history(target.id)).map((d) => ({
    actor: d.actor,
    kind: d.kind,
    at: d.createdAt,
    version: versions.find((v) => v.id === d.versionId)?.version,
  }));
}

const deploymentToken = (tool = "crm", workspace = "acme", ttlSeconds = 600) =>
  issueToken({
    secret,
    person: "deploy:ci",
    workspace,
    tool,
    ttlSeconds,
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

const upload = (over: Record<string, unknown> = {}) => ({
  environment: "production",
  version: "1.0.0",
  build: build(),
  ...over,
});

describe("POST /deploy", () => {
  const context = (hosting = fakeHosting().hosting) => ({
    workspace: "acme",
    secret,
    now: () => now,
    registry,
    hosting,
  });

  it("deploys the uploaded build for a valid FORGERON_TOKEN and answers where it is served", async () => {
    const { hosting, calls } = fakeHosting();
    const response = await handleDeploy(
      post("/deploy", upload(), await deploymentToken()),
      context(hosting),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      tool: "crm",
      version: "1.0.0",
      environment: "production",
      url: "https://production.test",
      applied: [],
    });
    expect(calls).toEqual(["provision", "upload", "migrate", "activate"]);
  });

  it("records who deployed which version, and when", async () => {
    await handleDeploy(post("/deploy", upload(), await deploymentToken()), context());
    expect(await historyOf("production")).toEqual([
      { actor: "deploy:ci", kind: "deploy", at: now.toISOString(), version: "1.0.0" },
    ]);
  });

  it("answers with the reason when the deployment fails, and records nothing", async () => {
    const response = await handleDeploy(
      post("/deploy", upload(), await deploymentToken()),
      context(fakeHosting(true).hosting),
    );
    expect(response.status).toBe(500);
    expect(await response.json()).toMatchObject({
      error: { code: "DEPLOY_FAILED", message: "migration failed" },
    });
    expect(await historyOf("production")).toEqual([]);
  });

  it("refuses a missing token, a malformed one, an expired one and a forged one", async () => {
    const cases: Array<[string, string | undefined]> = [
      ["missing", undefined],
      ["malformed", "not-a-token"],
      ["expired", await deploymentToken("crm", "acme", 1).then((t) => t)],
    ];
    for (const [label, token] of cases) {
      const request = post("/deploy", upload(), token);
      const later = {
        ...context(),
        now: () => (label === "expired" ? new Date(now.getTime() + 5000) : now),
      };
      expect([label, (await handleDeploy(request, later)).status]).toEqual([label, 401]);
    }
    const [prefix, claims, signature = ""] = (await deploymentToken()).split(".");
    // The first character of the signature uses all its bits: the last one does not.
    const forged = [prefix, claims, (signature[0] === "A" ? "B" : "A") + signature.slice(1)].join(
      ".",
    );
    expect((await handleDeploy(post("/deploy", upload(), forged), context())).status).toBe(401);
    expect(await registry.listTools("acme")).toEqual([]);
  });

  it("refuses a person's API token, which has no deploy scope", async () => {
    const person = await issueToken({
      secret,
      person: "u1",
      workspace: "acme",
      tool: "crm",
      ttlSeconds: 600,
      now,
    });
    expect((await handleDeploy(post("/deploy", upload(), person), context())).status).toBe(401);
  });

  it("refuses a token of another workspace, and a build of another tool", async () => {
    const elsewhere = await deploymentToken("crm", "other");
    expect((await handleDeploy(post("/deploy", upload(), elsewhere), context())).status).toBe(403);
    const other = upload({ build: build("odoo") });
    expect(
      (await handleDeploy(post("/deploy", other, await deploymentToken()), context())).status,
    ).toBe(403);
    expect(await registry.listTools("acme")).toEqual([]);
  });

  it("refuses a body that is not a build", async () => {
    const token = await deploymentToken();
    for (const bad of [
      upload({ environment: "staging" }),
      upload({ environment: "preview" }),
      upload({ version: "" }),
      upload({ build: { worker: "x" } }),
    ]) {
      expect((await handleDeploy(post("/deploy", bad, token), context())).status).toBe(400);
    }
  });

  it("deploys a preview for its branch", async () => {
    const response = await handleDeploy(
      post(
        "/deploy",
        upload({ environment: "preview", branch: "feat/a", version: "0.0.1-a" }),
        await deploymentToken(),
      ),
      context(),
    );
    expect(response.status).toBe(200);
    expect(await historyOf("preview", "feat/a")).toMatchObject([
      { actor: "deploy:ci", version: "0.0.1-a" },
    ]);
  });
});

describe("POST /deploy-tokens", () => {
  const admin = { id: "u1", email: "ada@acme.fr", name: "Ada", roles: ["admin"] };
  const member = { ...admin, id: "u2", roles: ["management"] };
  const issuer = (person?: typeof admin) => ({
    workspace: "acme",
    secret,
    now: () => now,
    authenticate: () => person,
  });
  const create = (body: unknown) => post("/deploy-tokens", body);
  const body = { tool: "crm", name: "ci", scope: "deploy", days: 90 };

  it("gives an administrator a deployment token that deploys, once, for that tool", async () => {
    const response = await handleCreateDeployToken(create(body), issuer(admin));
    expect(response.status).toBe(201);
    const created = (await response.json()) as { token: string; expiresAt: string };
    expect(created).toMatchObject({
      name: "ci",
      scope: "deploy",
      workspace: "acme",
      tool: "crm",
      expiresAt: "2027-02-01T10:00:00.000Z",
    });
    const deployed = await handleDeploy(post("/deploy", upload(), created.token), {
      workspace: "acme",
      secret,
      now: () => now,
      registry,
      hosting: fakeHosting().hosting,
    });
    expect(deployed.status).toBe(200);
    expect(await historyOf("production")).toMatchObject([{ actor: "deploy:ci" }]);
  });

  it("is for administrators only", async () => {
    expect((await handleCreateDeployToken(create(body), issuer())).status).toBe(401);
    expect((await handleCreateDeployToken(create(body), issuer(member))).status).toBe(403);
  });

  it("refuses a name, scope, lifetime or tool that is not valid", async () => {
    for (const bad of [
      { ...body, name: "Not Valid" },
      { ...body, scope: "admin" },
      { ...body, days: 0 },
      { ...body, days: 366 },
      { ...body, tool: "crm/api" },
      { ...body, tool: undefined },
    ]) {
      expect((await handleCreateDeployToken(create(bad), issuer(admin))).status).toBe(400);
    }
  });
});
