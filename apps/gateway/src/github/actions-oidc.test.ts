import type { Build, D1Database, Hosting } from "@forgeron/hosting";
import {
  createRegistry,
  createSecretBox,
  migratePlatform,
  type Registry,
} from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { handleDeploy, deployCaller } from "../deploy/deploy";
import { handlePromote } from "../deploy/promote";
import { issueToken } from "../identity/authn/tokens";
import { verifyActionsToken } from "./actions-oidc";
import { reportDeployment } from "./app";
import { simulatedGithub } from "./simulated-github";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// CI with no stored token (D-123): a run of GitHub Actions proves which repository it is (an OIDC
// token for the workspace's address), and the gateway deploys the tool linked to that repository.

const secret = "test-secret-not-a-real-one";
const now = new Date("2026-11-10T10:00:00Z");
const ORIGIN = "https://acme.forgeron.test";

let memory: MemoryD1;
let registry: Registry;
let github: Awaited<ReturnType<typeof simulatedGithub>>;
beforeEach(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, {
    now: () => now,
    secrets: await createSecretBox(btoa(String.fromCharCode(...new Uint8Array(32).fill(3)))),
  });
  github = await simulatedGithub({ now: () => now });
});
afterEach(() => memory.close());

const hosting: Hosting = {
  provision: async (environment) => ({ environment, bindings: [] }),
  upload: async (provisioned, build) => ({ provisioned, build }),
  migrate: async () => ({ applied: [] }),
  activate: async ({ provisioned }) => ({
    url: `https://${provisioned.environment.name}.test`,
  }),
  teardown: async () => {},
};

const build = (name = "crm"): Build => ({
  manifest: { name, resources: {} } as unknown as Build["manifest"],
  worker: "export default {}",
  fingerprint: "fp1",
  changelog: { entries: [{}], declared: "patch", detected: "patch" },
});

const context = () => ({
  workspace: "acme",
  secret,
  now: () => now,
  registry,
  hosting,
  actions: { audience: ORIGIN, fetch: github.fetch },
});

const request = (token: string | undefined, body: unknown = {}, path = "/deploy") =>
  new Request(`${ORIGIN}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

async function linked(name = "crm", repo = "acme-sh/crm", repoId = 101) {
  const tool = await registry.createTool({ workspace: "acme", name });
  await registry.linkRepository({
    toolId: tool.id,
    repo,
    repoId,
    productionBranch: "main",
    actor: "p",
  });
  return tool;
}

describe("a GitHub Actions identity token", () => {
  it("is taken for the workspace's address, before it expires, and says which repository", async () => {
    const token = await github.actionsToken({
      repository: "acme-sh/crm",
      repositoryId: 101,
      audience: ORIGIN,
    });
    expect(await verifyActionsToken(token, { audience: ORIGIN, now, fetch: github.fetch })).toEqual(
      {
        repository: "acme-sh/crm",
        repositoryId: 101,
        ref: "refs/heads/main",
        sha: "a".repeat(40),
        actor: "someone",
      },
    );
  });

  it("is refused for another audience, once expired, or signed by another key", async () => {
    const other = await github.actionsToken({
      repository: "acme-sh/crm",
      audience: "https://other.forgeron.test",
    });
    await expect(
      verifyActionsToken(other, { audience: ORIGIN, now, fetch: github.fetch }),
    ).rejects.toThrow("another audience");
    const old = await github.actionsToken({ repository: "acme-sh/crm", audience: ORIGIN });
    await expect(
      verifyActionsToken(old, {
        audience: ORIGIN,
        now: new Date(now.getTime() + 600_000),
        fetch: github.fetch,
      }),
    ).rejects.toThrow("expired");
    const stranger = await simulatedGithub({ now: () => now });
    const forged = await stranger.actionsToken({ repository: "acme-sh/crm", audience: ORIGIN });
    await expect(
      verifyActionsToken(forged, { audience: ORIGIN, now, fetch: github.fetch }),
    ).rejects.toThrow("signature");
  });
});

describe("deployCaller", () => {
  it("takes a deployment token as before, and a run of the linked repository", async () => {
    await linked();
    const token = await issueToken({
      secret,
      person: "deploy:ci",
      workspace: "acme",
      tool: "crm",
      ttlSeconds: 600,
      now,
      scope: "deploy",
    });
    expect(await deployCaller(request(token), context())).toEqual({
      ok: true,
      actor: "deploy:ci",
      tool: "crm",
    });
    const run = await github.actionsToken({
      repository: "Acme-sh/CRM",
      repositoryId: 101,
      audience: ORIGIN,
    });
    expect(await deployCaller(request(run), context())).toMatchObject({
      ok: true,
      actor: "github:Acme-sh/CRM",
      tool: "crm",
      run: { repositoryId: 101 },
    });
    expect(await deployCaller(request(undefined), context())).toEqual({
      ok: false,
      reason: "missing",
    });
  });

  it("refuses a repository linked to no tool, and a token for another workspace", async () => {
    const run = await github.actionsToken({ repository: "acme-sh/other", audience: ORIGIN });
    const refused = await deployCaller(request(run), context());
    expect(refused.ok).toBe(false);
    const answer = (refused as { refused: Response }).refused;
    expect(answer.status).toBe(403);
    expect(await answer.json()).toMatchObject({ error: { message: /acme-sh\/other/ } });

    const elsewhere = await github.actionsToken({
      repository: "acme-sh/crm",
      audience: "https://globex.forgeron.test",
    });
    const wrong = (await deployCaller(request(elsewhere), context())) as { refused: Response };
    expect(wrong.refused.status).toBe(401);
    // The same name with another number is another repository (deleted, then made again).
    await linked();
    const remade = await github.actionsToken({
      repository: "acme-sh/crm",
      repositoryId: 999,
      audience: ORIGIN,
    });
    expect(
      ((await deployCaller(request(remade), context())) as { refused: Response }).refused.status,
    ).toBe(403);
    // Without the GitHub side wired, a JWT is just not a deployment token.
    const { actions: _, ...tokenOnly } = context();
    expect(await deployCaller(request(run), tokenOnly)).toEqual({ ok: false, reason: "malformed" });
  });
});

describe("POST /deploy from GitHub Actions", () => {
  it("deploys the linked tool's preview, and the build must be that tool's", async () => {
    await linked();
    const run = await github.actionsToken({
      repository: "acme-sh/crm",
      repositoryId: 101,
      audience: ORIGIN,
    });
    const reported: unknown[] = [];
    const deployed = await handleDeploy(
      request(run, {
        environment: "preview",
        branch: "feat",
        version: "1.0.0-preview.feat+fp1",
        build: build(),
      }),
      { ...context(), report: async (_tool, info) => reported.push(info) },
    );
    expect(deployed.status).toBe(200);
    expect(await deployed.json()).toMatchObject({ tool: "crm", environment: "preview" });
    // No commit in the body: the run's own sha.
    expect(reported).toEqual([
      { sha: "a".repeat(40), url: "https://preview.test", environment: "preview", branch: "feat" },
    ]);
    const tool = (await registry.findTool("acme", "crm"))!;
    const versions = await registry.listVersions(tool.id);
    expect(versions.map((v) => v.version)).toEqual(["1.0.0-preview.feat+fp1"]);

    const other = await handleDeploy(
      request(run, { environment: "preview", branch: "feat", version: "1", build: build("odoo") }),
      context(),
    );
    expect(other.status).toBe(403);
  });

  it("a report that fails does not fail the deployment", async () => {
    await linked();
    const run = await github.actionsToken({
      repository: "acme-sh/crm",
      repositoryId: 101,
      audience: ORIGIN,
    });
    const deployed = await handleDeploy(
      request(run, { environment: "preview", branch: "main", version: "1", build: build() }),
      {
        ...context(),
        report: async () => {
          throw new Error("GitHub is down");
        },
      },
    );
    expect(deployed.status).toBe(200);
  });

  it("promotes with a run of the tool's repository", async () => {
    await linked();
    const run = await github.actionsToken({
      repository: "acme-sh/crm",
      repositoryId: 101,
      audience: ORIGIN,
    });
    const answer = await handlePromote(request(run, { version: "9.9.9" }, "/promote"), {
      ...context(),
      authenticate: () => undefined,
    });
    // The caller is accepted: the version is what is missing.
    expect(answer.status).not.toBe(401);
    expect(answer.status).not.toBe(403);
  });
});

describe("the commit status after a deployment", () => {
  it("is set with the preview's address when the app is installed on the repository's owner", async () => {
    const tool = await linked();
    github.addRepository("acme-sh/crm", {}, 101);
    const done = {
      sha: "b".repeat(40),
      url: "https://p.test",
      environment: "preview",
      branch: "x",
    };
    const ctx = { registry, workspace: "acme", fetch: github.fetch, now: () => now };
    // No app yet: nothing is said.
    expect(await reportDeployment(ctx, tool, done)).toBe(false);
    await registry.saveGithubApp({
      workspace: "acme",
      app: { appId: 42, slug: "forgeron-acme", clientId: "c", owner: "acme-sh", htmlUrl: "h" },
      keys: { privateKey: github.pem, webhookSecret: "w", clientSecret: "s" },
      actor: "p",
    });
    // Not installed on acme-sh yet.
    expect(await reportDeployment(ctx, tool, done)).toBe(false);
    await registry.addGithubInstallation({
      workspace: "acme",
      installationId: 7,
      account: "acme-sh",
      accountType: "Organization",
    });
    expect(await reportDeployment(ctx, tool, done)).toBe(true);
    expect(github.state.statuses).toEqual([
      {
        repo: "acme-sh/crm",
        sha: "b".repeat(40),
        body: {
          state: "success",
          target_url: "https://p.test",
          context: "forgeron/preview",
          description: "Preview of x on Forgeron",
        },
      },
    ]);
  });
});
