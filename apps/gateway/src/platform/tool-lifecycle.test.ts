import type { D1Database, Environment, Hosting } from "@forgeron/hosting";
import {
  createRegistry,
  createSecretBox,
  migratePlatform,
  type Registry,
  type Tool,
} from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { simulatedGithub, type SimulatedRun } from "../github/simulated-github";
import type { ConsolePerson } from "./app";
import { ADMIN, describeRouteMatrix } from "./route-matrix";
import { platformCaller } from "./test-app";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// A tool's CI (GitHub Actions' runs through the workspace's app, simulated), publishing a tool only
// when a version is deployed, and deleting a tool for good.

const now = new Date("2026-11-13T10:00:00Z");
const ORIGIN = "https://acme.forgeron.test";

let memory: MemoryD1;
let registry: Registry;
let github: Awaited<ReturnType<typeof simulatedGithub>>;
let person: ConsolePerson | undefined;
let torn: Environment[];
let failTeardown: boolean;

const hosting: Hosting = {
  provision: async (environment) => ({ environment, bindings: [] }),
  upload: async (provisioned, build) => ({ provisioned, build }),
  migrate: async () => ({ applied: [] }),
  activate: async ({ provisioned }) => ({ url: `https://${provisioned.environment.name}.test` }),
  teardown: async (environment) => {
    if (failTeardown) throw new Error("Cloudflare is down");
    torn.push(environment);
  },
};

beforeEach(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, {
    now: () => now,
    secrets: await createSecretBox(btoa(String.fromCharCode(...new Uint8Array(32).fill(4)))),
  });
  github = await simulatedGithub({ now: () => now });
  person = ADMIN;
  torn = [];
  failTeardown = false;
});
afterEach(() => memory.close());

const call = (): ReturnType<typeof platformCaller> =>
  platformCaller({
    registry,
    who: () => person,
    hosting: () => hosting,
    githubFetch: github.fetch,
    now: () => now,
  });
const as = async (request: Request, who: ConsolePerson | undefined) => {
  person = who;
  return (await call()(request))!;
};
const api = (method: string, path: string, body?: unknown) =>
  as(
    new Request(`${ORIGIN}${path}`, {
      method,
      ...(body === undefined
        ? {}
        : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
    }),
    ADMIN,
  );

/** The workspace's GitHub App, installed on acme-sh. */
async function connect() {
  await registry.saveGithubApp({
    workspace: "acme",
    app: {
      appId: 42,
      slug: "forgeron-acme",
      clientId: "Iv1.simulated",
      owner: "acme-sh",
      htmlUrl: "https://github.com/apps/forgeron-acme",
    },
    keys: {
      privateKey: github.pem,
      webhookSecret: github.state.webhookSecret,
      clientSecret: "simulated-client-secret",
    },
    actor: "p",
  });
  await registry.addGithubInstallation({
    workspace: "acme",
    installationId: 7,
    account: "acme-sh",
    accountType: "Organization",
  });
}

/** A tool linked to a repository of acme-sh, with nothing deployed. */
async function repositoryTool(name = "crm", branch = "main"): Promise<Tool> {
  github.addRepository(`acme-sh/${name}`);
  const tool = await registry.createTool({ workspace: "acme", name });
  await registry.linkRepository({
    toolId: tool.id,
    repo: `acme-sh/${name}`,
    productionBranch: branch,
    actor: "p",
  });
  return tool;
}

/** What the tests read of the CI answer. */
interface CiBody {
  runs: Array<{ status: string; durationSeconds: number | null; actor: string }>;
}

let nextRun = 1;
const run = (over: Partial<SimulatedRun> = {}): SimulatedRun => ({
  id: nextRun++,
  name: "forgeron",
  head_branch: "main",
  head_sha: "a".repeat(40),
  head_commit: { message: "feat: first\n\nA longer body" },
  actor: { login: "ana" },
  status: "completed",
  conclusion: "success",
  run_started_at: "2026-11-13T09:00:00Z",
  updated_at: "2026-11-13T09:02:05Z",
  html_url: `https://github.com/acme-sh/crm/actions/runs/${nextRun}`,
  ...over,
});

/** Puts a version on production (or a branch's preview, or a channel), as a deployment would. */
async function deploy(tool: Tool, name: "production" | "preview" | "channel", key?: string) {
  const build = await registry.recordBuild(tool.id, {
    fingerprint: `fp-${tool.name}-${name}-${key ?? ""}`,
    manifest: { name: tool.name, profiles: {}, actions: {}, resources: {} },
    worker: "// worker",
  });
  const version = await registry.publishVersion(
    tool.id,
    build.id,
    `1.0.${Math.floor(Math.random() * 1e6)}`,
  );
  const environment =
    name === "channel"
      ? await registry.addChannel({ toolId: tool.id, name: key!, actor: "p" })
      : await registry.ensureEnvironment(tool.id, name, key);
  await registry.activate(environment.id, version.id, { actor: "p", url: "https://x.test" });
}

describeRouteMatrix({
  title: "GET a tool's CI",
  access: "tools:read",
  call: as,
  method: "GET",
  path: "/api/tools/x/ci",
});
describeRouteMatrix({
  title: "DELETE a tool",
  access: "tools:delete",
  call: as,
  method: "DELETE",
  path: "/api/tools/x",
  valid: { confirm: "x" },
  invalid: [{}],
});

describe("a tool's CI", () => {
  it("answers 404 for an unknown tool and no-repository for a tool without a repository", async () => {
    expect((await api("GET", "/api/tools/nope/ci")).status).toBe(404);
    await registry.createTool({ workspace: "acme", name: "plain" });
    const answer = await api("GET", "/api/tools/plain/ci");
    expect(answer.status).toBe(200);
    expect(await answer.json()).toEqual({ state: "no-repository" });
    expect(github.state.calls).toEqual([]);
  });

  it("says there is no app when the workspace has none, or none on the repository's owner", async () => {
    await repositoryTool();
    expect(await (await api("GET", "/api/tools/crm/ci")).json()).toEqual({
      state: "no-app",
      repo: "acme-sh/crm",
    });
    await connect();
    const other = await registry.createTool({ workspace: "acme", name: "elsewhere" });
    await registry.linkRepository({
      toolId: other.id,
      repo: "other-org/elsewhere",
      productionBranch: "main",
      actor: "p",
    });
    expect(await (await api("GET", "/api/tools/elsewhere/ci")).json()).toEqual({
      state: "no-app",
      repo: "other-org/elsewhere",
    });
  });

  it("lists the runs of the repository, newest first, in the five states", async () => {
    await connect();
    await repositoryTool();
    github.state.runs.set("acme-sh/crm", [
      run({ status: "queued", conclusion: null, run_started_at: "2026-11-13T09:50:00Z" }),
      run({ status: "in_progress", conclusion: null, head_branch: "feat/x" }),
      run({ conclusion: "failure", head_commit: { message: "fix: it" } }),
      run({ conclusion: "cancelled", actor: { login: "bot" } }),
      run(),
    ]);
    const answer = (await (await api("GET", "/api/tools/crm/ci")).json()) as CiBody;
    expect(answer).toMatchObject({
      state: "ok",
      repo: "acme-sh/crm",
      productionBranch: "main",
      actionsUrl: "https://github.com/acme-sh/crm/actions",
    });
    expect(answer.runs.map((r) => r.status)).toEqual([
      "queued",
      "in_progress",
      "failure",
      "cancelled",
      "success",
    ]);
    expect(answer.runs[4]!).toMatchObject({
      workflow: "forgeron",
      branch: "main",
      message: "feat: first",
      actor: "ana",
      startedAt: "2026-11-13T09:00:00Z",
      durationSeconds: 125,
    });
    // A run that has not finished has no duration yet.
    expect(answer.runs[1]!.durationSeconds).toBeNull();
    expect(answer.runs[3]!.actor).toBe("bot");
  });

  it("filters by branch and limits the answer", async () => {
    await connect();
    await repositoryTool();
    github.state.runs.set("acme-sh/crm", [
      run({ head_branch: "feat/x" }),
      run(),
      run(),
      run({ head_branch: "feat/x" }),
    ]);
    const onBranch = (await (
      await api("GET", "/api/tools/crm/ci?branch=feat%2Fx")
    ).json()) as CiBody;
    expect(onBranch.runs).toHaveLength(2);
    const few = (await (await api("GET", "/api/tools/crm/ci?limit=1")).json()) as CiBody;
    expect(few.runs).toHaveLength(1);
    expect(github.state.calls.at(-1)).toBe("GET /repos/acme-sh/crm/actions/runs");
    expect((await api("GET", "/api/tools/crm/ci?limit=500")).status).toBe(400);
  });

  it("maps GitHub refusing Actions to no-permission, with where the owner accepts it", async () => {
    await connect();
    await repositoryTool();
    github.state.actionsAllowed = false;
    const answer = await api("GET", "/api/tools/crm/ci");
    expect(answer.status).toBe(200);
    expect(await answer.json()).toEqual({
      state: "no-permission",
      repo: "acme-sh/crm",
      settingsUrl: "https://github.com/organizations/acme-sh/settings/installations/7",
    });
  });

  it("answers 502 when GitHub fails otherwise", async () => {
    await connect();
    await repositoryTool();
    const broken = platformCaller({
      registry,
      who: () => ADMIN,
      now: () => now,
      githubFetch: (async (input: string | URL | Request, init?: RequestInit) =>
        new Request(input, init).url.includes("/actions/runs")
          ? Response.json({ message: "Server Error" }, { status: 500 })
          : github.fetch(input, init)) as typeof fetch,
    });
    const answer = (await broken(new Request(`${ORIGIN}/api/tools/crm/ci`)))!;
    expect(answer.status).toBe(502);
    expect(await answer.json()).toMatchObject({ error: "GITHUB" });
  });
});

describe("publishing needs a version", () => {
  it("refuses a rule other than nobody while production has no version, and lets nobody through", async () => {
    await registry.createTool({ workspace: "acme", name: "fresh" });
    for (const body of [
      { mode: "everyone" },
      { mode: "teams", teams: ["support"] },
      { mode: "people", people: [] },
    ]) {
      const refused = await api("PUT", "/api/tools/fresh/availability", body);
      expect(refused.status).toBe(409);
      expect(await refused.json()).toEqual({
        error: "NO_VERSION",
        message: "Nothing to publish yet: no version is deployed on this channel.",
      });
    }
    expect((await api("PUT", "/api/tools/fresh/availability", { mode: "nobody" })).status).toBe(
      200,
    );
  });

  it("accepts the rule once production serves a version", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "live" });
    await deploy(tool, "production");
    const set = await api("PUT", "/api/tools/live/availability", { mode: "everyone" });
    expect(set.status).toBe(200);
    expect(await set.json()).toMatchObject({ mode: "everyone" });
  });

  it("applies the same rule to a branch's temporary channel and to a permanent one", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "pilots" });
    await deploy(tool, "preview", "feat-a");
    await registry.ensureEnvironment(tool.id, "preview", "empty");
    await registry.addChannel({ toolId: tool.id, name: "staging", actor: "p" });
    const rule = { mode: "everyone" };
    expect((await api("PUT", "/api/tools/pilots/previews/feat-a/availability", rule)).status).toBe(
      200,
    );
    // The environment exists but nothing was activated on it: nothing to publish.
    for (const ref of ["empty", "~staging"]) {
      const refused = await api("PUT", `/api/tools/pilots/previews/${ref}/availability`, rule);
      expect(refused.status).toBe(409);
      expect(await refused.json()).toMatchObject({ error: "NO_VERSION" });
      const back = await api("PUT", `/api/tools/pilots/previews/${ref}/availability`, {
        mode: "nobody",
      });
      expect(back.status).toBe(200);
    }
    // Unpublishing a channel that was published stays possible.
    expect(
      (await api("PUT", "/api/tools/pilots/previews/feat-a/availability", { mode: "nobody" }))
        .status,
    ).toBe(200);
  });
});

describe("deleting a tool for good", () => {
  it("answers 404 for an unknown tool and 400 until its name is typed", async () => {
    expect((await api("DELETE", "/api/tools/nope", { confirm: "nope" })).status).toBe(404);
    await registry.createTool({ workspace: "acme", name: "crm" });
    const refused = await api("DELETE", "/api/tools/crm", { confirm: "other" });
    expect(refused.status).toBe(400);
    expect(await refused.json()).toMatchObject({ error: "NOT_CONFIRMED" });
    expect(await registry.findTool("acme", "crm")).toBeDefined();
    expect(torn).toEqual([]);
  });

  it("answers 501 where there is no hosting", async () => {
    await registry.createTool({ workspace: "acme", name: "crm" });
    person = ADMIN;
    const bare = platformCaller({ registry, who: () => person });
    const answer = (await bare(
      new Request(`${ORIGIN}/api/tools/crm`, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: "crm" }),
      }),
    ))!;
    expect(answer.status).toBe(501);
    expect(await registry.findTool("acme", "crm")).toBeDefined();
  });

  it("tears down every environment, production included, then forgets the tool and audits it", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "crm" });
    await deploy(tool, "production");
    await deploy(tool, "preview", "feat-a");
    await deploy(tool, "channel", "staging");
    await registry.setAvailability({ toolId: tool.id, mode: "everyone", actor: "p" });
    const gone = await api("DELETE", "/api/tools/crm", { confirm: "crm" });
    expect(gone.status).toBe(200);
    expect(await gone.json()).toEqual({ deleted: true });
    expect(torn).toEqual(
      expect.arrayContaining([
        { tool: "crm", name: "production" },
        { tool: "crm", name: "preview", branch: "feat-a" },
        { tool: "crm", name: "channel", channel: "staging" },
      ]),
    );
    expect(torn).toHaveLength(3);
    expect(await registry.findTool("acme", "crm")).toBeUndefined();
    expect((await api("GET", "/api/tools/crm/ci")).status).toBe(404);
    // The audit line outlives the tool.
    const lines = await registry.listAudit(tool.id, { kind: "access" });
    expect(lines[0]).toMatchObject({
      actor: ADMIN.id,
      subject: "tool:deleted",
      detail: { event: "tool-deleted", tool: "crm", environments: 3 },
    });
  });

  it("keeps the tool when a host fails, so that it can be tried again", async () => {
    const tool = await registry.createTool({ workspace: "acme", name: "crm" });
    await deploy(tool, "production");
    failTeardown = true;
    await expect(api("DELETE", "/api/tools/crm", { confirm: "crm" })).rejects.toThrow(
      "Cloudflare is down",
    );
    expect(await registry.findTool("acme", "crm")).toBeDefined();
    failTeardown = false;
    expect((await api("DELETE", "/api/tools/crm", { confirm: "crm" })).status).toBe(200);
  });

  it("leaves the other tools of the workspace alone", async () => {
    const keep = await registry.createTool({ workspace: "acme", name: "keep" });
    await deploy(keep, "production");
    await registry.createTool({ workspace: "acme", name: "crm" });
    await api("DELETE", "/api/tools/crm", { confirm: "crm" });
    expect(await registry.findTool("acme", "keep")).toBeDefined();
    expect(torn).toEqual([]);
  });
});
