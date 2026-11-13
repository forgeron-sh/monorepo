import type { Build, D1Database, Hosting } from "@forgeron/hosting";
import { createRegistry, migratePlatform, type Registry } from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { issueToken } from "../identity/authn/tokens";
import { handleCreateDeployToken, handleDeploy } from "./deploy";
import type { PlatformPermission } from "@forgeron/permissions";
import type { Person } from "../kernel/person";
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

function fakeHosting(failMigrate = false) {
  const calls: string[] = [];
  const uploaded: Array<{ name: string; channel?: string }> = [];
  const hosting: Hosting = {
    async provision(environment) {
      calls.push("provision");
      return { environment, bindings: [] };
    },
    async upload(provisioned, build) {
      calls.push("upload");
      const { name, channel } = provisioned.environment;
      uploaded.push({ name, ...(channel ? { channel } : {}) });
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
  return { hosting, calls, uploaded };
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
  branch: "main",
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

  it("refuses production: a permanent channel takes releases of its branch, not builds (D-125)", async () => {
    const refused = await handleDeploy(
      post("/deploy", upload({ environment: "production" }), await deploymentToken()),
      context(),
    );
    expect(refused.status).toBe(400);
    expect(await refused.json()).toMatchObject({ error: { code: "NOT_A_BRANCH" } });
    expect(await registry.listTools("acme")).toEqual([]);
  });

  it("puts a release of a branch on the permanent channels that follow it and update by themselves", async () => {
    const token = await deploymentToken();
    const { hosting, uploaded } = fakeHosting();
    // The tool exists, from a repository; production and staging follow main and update by themselves.
    const tool = await registry.createTool({ workspace: "acme", name: "crm" });
    await registry.linkRepository({
      toolId: tool.id,
      repo: "acme/crm",
      productionBranch: "main",
      actor: "a",
    });
    await registry.setToolSource({ toolId: tool.id, autoUpdate: true, actor: "a" });
    await registry.addChannel({
      toolId: tool.id,
      name: "staging",
      follows: "main",
      autoUpdate: true,
      actor: "a",
    });
    await registry.addChannel({ toolId: tool.id, name: "recette", follows: "main", actor: "a" });
    await registry.addChannel({
      toolId: tool.id,
      name: "other",
      follows: "dev",
      autoUpdate: true,
      actor: "a",
    });

    // Not a release: only the branch's temporary channel takes it.
    const wip = {
      ...build("crm", "wip"),
      changelog: { entries: [], declared: "none", detected: "none" },
    };
    const first = await handleDeploy(
      post("/deploy", upload({ build: wip, version: "1.0.0-wip" }), token),
      context(hosting),
    );
    expect(await first.json()).not.toHaveProperty("channels");
    expect(uploaded.map((u) => u.name)).toEqual(["preview"]);

    // A release: production and staging take it; recette waits for approval; other follows dev.
    const released = {
      ...build(),
      changelog: { entries: [{}], declared: "patch", detected: "patch", released: true },
    };
    const second = await handleDeploy(
      post("/deploy", upload({ build: released }), token),
      context(hosting),
    );
    expect(await second.json()).toMatchObject({
      production: { version: "1.0.0" },
      channels: [
        { channel: "production", version: "1.0.0" },
        { channel: "staging", version: "1.0.0" },
      ],
    });
    expect(uploaded.map((u) => [u.name, u.channel])).toEqual([
      ["preview", undefined],
      ["preview", undefined],
      ["production", undefined],
      ["channel", "staging"],
    ]);
    expect(await registry.availableUpdate(tool.id, "recette")).toEqual({
      version: "1.0.0",
      branch: "main",
    });
  });

  it("refuses the pilot, which no longer exists", async () => {
    const refused = await handleDeploy(
      post("/deploy", upload({ environment: "pilot" }), await deploymentToken()),
      context(),
    );
    expect(refused.status).toBe(400);
  });

  it("stores the README and the images of the build, and refuses documentation that lies", async () => {
    const hash = async (bytes: Uint8Array) =>
      [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 1]);
    const readme = "# CRM\n![a](docs/a.png)";
    const documented = async (over: { svg?: string } = {}) => {
      const files = [{ path: "docs/a.png", type: "image/png", bytes: png }];
      if (over.svg) {
        files.push({
          path: "docs/i.svg",
          type: "image/svg+xml",
          bytes: new TextEncoder().encode(over.svg),
        });
      }
      const assets = await Promise.all(
        files.map(async (f) => ({
          path: f.path,
          type: f.type,
          size: f.bytes.length,
          hash: await hash(f.bytes),
          base64: Buffer.from(f.bytes).toString("base64"),
        })),
      );
      const encoded = new TextEncoder().encode(readme);
      const b = build();
      return {
        ...b,
        manifest: {
          ...b.manifest,
          docs: {
            readme: { size: encoded.length, hash: await hash(encoded) },
            assets: assets.map((a) => ({ path: a.path, type: a.type, size: a.size, hash: a.hash })),
          },
        },
        docs: { readme, assets },
      };
    };

    const { hosting } = fakeHosting();
    const evil = await handleDeploy(
      post(
        "/deploy",
        upload({ build: await documented({ svg: "<svg><script>alert(1)</script></svg>" }) }),
        await deploymentToken(),
      ),
      context(hosting),
    );
    expect(evil.status).toBe(400);
    expect(((await evil.json()) as { error: { message: string } }).error.message).toMatch(
      /docs\/i\.svg.*SVG is refused/,
    );
    expect(await registry.findTool("acme", "crm")).toBeUndefined();

    const traversal = await documented();
    traversal.docs.assets[0]!.path = "../a.png";
    expect(
      (
        await handleDeploy(
          post("/deploy", upload({ build: traversal }), await deploymentToken()),
          context(hosting),
        )
      ).status,
    ).toBe(400);

    const ok = await handleDeploy(
      post("/deploy", upload({ build: await documented() }), await deploymentToken()),
      context(hosting),
    );
    expect(ok.status).toBe(200);
    const tool = (await registry.findTool("acme", "crm"))!;
    const [version] = await registry.listVersions(tool.id);
    expect(await registry.readmeOf(tool.id, version!.buildId)).toBe(readme);
    expect((await registry.assetOf(tool.id, version!.buildId, "docs/a.png"))!.bytes.length).toBe(5);
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
      environment: "preview",
      url: "https://preview.test",
      applied: [],
    });
    expect(calls).toEqual(["provision", "upload", "migrate", "activate"]);
  });

  it("records who deployed which version, and when", async () => {
    await handleDeploy(post("/deploy", upload(), await deploymentToken()), context());
    expect(await historyOf("preview", "main")).toEqual([
      { actor: "deploy:ci", kind: "deploy", at: now.toISOString(), version: "1.0.0" },
    ]);
  });

  it("keeps the commit CI reports, cut to its first line, and refuses one that is not a commit", async () => {
    const commit = { sha: "A41F9E0C", message: "Add the export\n\nLong body", author: " Ada " };
    const token = await deploymentToken();
    const ok = await handleDeploy(post("/deploy", upload({ commit }), token), context());
    expect(ok.status).toBe(200);
    const tool = (await registry.findTool("acme", "crm"))!;
    expect((await registry.listDeployments(tool.id))[0]?.commit).toEqual({
      sha: "a41f9e0c",
      message: "Add the export",
      author: "Ada",
    });
    for (const bad of ["a41f9e0", { sha: "not-a-hash" }, { sha: "a41f9e0", message: 3 }]) {
      const refused = await handleDeploy(
        post("/deploy", upload({ commit: bad }), token),
        context(),
      );
      expect(refused.status).toBe(400);
    }
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
    expect(await historyOf("preview", "main")).toEqual([]);
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
      upload({ branch: "" }),
      upload({ branch: undefined }),
      upload({ branch: "~staging" }),
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

describe("a preview's seed", () => {
  it("is run on the new database of the branch, with the seed of the build's tool", async () => {
    const db = { name: "the branch's database" } as unknown as D1Database;
    const { hosting } = fakeHosting();
    const base = hosting.provision;
    hosting.provision = async (environment, manifest) => ({
      ...(await base(environment, manifest)),
      bindings: [{ name: "DB", kind: "d1", id: "db-1", fresh: true }],
    });
    hosting.database = () => db;
    const seeded: unknown[] = [];
    const response = await handleDeploy(
      post(
        "/deploy",
        upload({ environment: "preview", branch: "feat/a", version: "0.0.1-a" }),
        await deploymentToken(),
      ),
      {
        workspace: "acme",
        secret,
        now: () => now,
        registry,
        hosting,
        seed: (build) => async (received) => void seeded.push([build.fingerprint, received]),
      },
    );
    expect(response.status).toBe(200);
    expect(seeded).toEqual([["fp1", db]]);
  });
});

describe("DELETE /deploy", () => {
  const remove = (body: unknown, token?: string) =>
    new Request("https://acme.forgeron.app/deploy", {
      method: "DELETE",
      headers: {
        "content-type": "application/json",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
  const context = (hosting: Hosting) => ({
    workspace: "acme",
    secret,
    now: () => now,
    registry,
    hosting,
  });

  it("removes the preview of a merged or deleted branch, with what it owns", async () => {
    const { hosting } = fakeHosting();
    const torn: unknown[] = [];
    hosting.teardown = async (environment) => void torn.push(environment);
    const token = await deploymentToken();
    await handleDeploy(
      post("/deploy", upload({ environment: "preview", branch: "feat/a" }), token),
      context(hosting),
    );
    const response = await handleDeploy(remove({ branch: "feat/a" }, token), context(hosting));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ tool: "crm", branch: "feat/a", removed: true });
    expect(torn).toEqual([{ tool: "crm", name: "preview", branch: "feat/a" }]);
    const tool = (await registry.findTool("acme", "crm"))!;
    expect((await registry.listEnvironments(tool.id)).some((e) => e.name === "preview")).toBe(
      false,
    );
  });

  it("lets a person who holds `tools:write` close a preview, naming the tool", async () => {
    const { hosting } = fakeHosting();
    await handleDeploy(
      post(
        "/deploy",
        upload({ environment: "preview", branch: "feat/a" }),
        await deploymentToken(),
      ),
      context(hosting),
    );
    const person = (permissions: PlatformPermission[]) =>
      testPerson(permissions, [], { id: "u1", email: "ada@acme.fr" });
    const closeAs = (who: ReturnType<typeof person> | undefined, body: unknown) =>
      handleDeploy(remove(body), { ...context(hosting), authenticate: () => who });
    expect((await closeAs(undefined, { tool: "crm", branch: "feat/a" })).status).toBe(401);
    expect(
      (await closeAs(person(["tools:read", "tools:publish"]), { tool: "crm", branch: "feat/a" }))
        .status,
    ).toBe(403);
    expect((await closeAs(person(["tools:write"]), { branch: "feat/a" })).status).toBe(400);
    const closed = await closeAs(person(["tools:write"]), { tool: "crm", branch: "feat/a" });
    expect(await closed.json()).toEqual({ tool: "crm", branch: "feat/a", removed: true });
  });

  it("succeeds for a tool the workspace does not know, and refuses without a valid token or a branch", async () => {
    const { hosting } = fakeHosting();
    const ok = await handleDeploy(
      remove({ branch: "x" }, await deploymentToken("ghost")),
      context(hosting),
    );
    expect(await ok.json()).toMatchObject({ removed: false });
    expect((await handleDeploy(remove({ branch: "x" }), context(hosting))).status).toBe(401);
    expect((await handleDeploy(remove({}, await deploymentToken()), context(hosting))).status).toBe(
      400,
    );
  });
});

describe("POST /deploy-tokens", () => {
  const builder = testPerson(["tools:write"], [], { id: "u1", email: "ada@acme.fr" });
  const member = testPerson(["tools:read"], ["management"], { id: "u2", email: "ada@acme.fr" });
  const issuer = (person?: Person) => ({
    workspace: "acme",
    secret,
    now: () => now,
    authenticate: () => person,
  });
  const create = (body: unknown) => post("/deploy-tokens", body);
  const body = { tool: "crm", name: "ci", scope: "deploy", days: 90 };

  it("gives a person who holds `tools:write` a deployment token that deploys, once, for that tool", async () => {
    const response = await handleCreateDeployToken(create(body), issuer(builder));
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
    expect(await historyOf("preview", "main")).toMatchObject([{ actor: "deploy:ci" }]);
  });

  it("is for who holds `tools:write` only", async () => {
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
      expect((await handleCreateDeployToken(create(bad), issuer(builder))).status).toBe(400);
    }
  });
});
