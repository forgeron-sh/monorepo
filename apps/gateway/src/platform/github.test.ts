import type { D1Database, Hosting } from "@forgeron/hosting";
import {
  createRegistry,
  createSecretBox,
  migratePlatform,
  type Registry,
} from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGateway, type GatewayEnv } from "../gateway";
import { simulatedGithub } from "../github/simulated-github";
import { seal } from "../identity/authn/sealed";
import type { ConsolePerson } from "./app";
import { ADMIN, MEMBER, describeRouteMatrix } from "./route-matrix";
import { platformCaller } from "./test-app";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The workspace's GitHub App (D-123): made from its manifest, installed, told what happens on its
// repositories, and used by the console to list, link and make repositories. GitHub is simulated.

const SECRET = "test-secret-not-a-real-one";
const ORIGIN = "https://acme.forgeron.test";
const now = new Date("2026-11-10T10:00:00Z");

let memory: MemoryD1;
let registry: Registry;
let github: Awaited<ReturnType<typeof simulatedGithub>>;
let person: ConsolePerson | undefined;
const closed: string[] = [];
const hosting: Hosting = {
  provision: async (environment) => ({ environment, bindings: [] }),
  upload: async (provisioned, build) => ({ provisioned, build }),
  migrate: async () => ({ applied: [] }),
  activate: async ({ provisioned }) => ({ url: `https://${provisioned.environment.name}.test` }),
  teardown: async (environment) => {
    closed.push(`${environment.tool}@${environment.branch}`);
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
  closed.length = 0;
  person = ADMIN;
});
afterEach(() => memory.close());

const caller = (surface: "console" | "root") =>
  platformCaller({
    registry,
    who: () => person,
    hosting: () => hosting,
    tokenSecret: SECRET,
    canKeepSecrets: true,
    githubFetch: github.fetch,
    now: () => now,
    surface,
  });
const root = async (path: string, init?: RequestInit) =>
  (await caller("root")(new Request(`${ORIGIN}${path}`, init)))!;
const api = async (method: string, path: string, body?: unknown) =>
  (await caller("console")(
    new Request(`${ORIGIN}${path}`, {
      method,
      ...(body === undefined
        ? {}
        : { headers: { "content-type": "application/json" }, body: JSON.stringify(body) }),
    }),
  ))!;

/** The app as the manifest flow leaves it: GitHub's code traded, then installed on acme-sh. */
async function connect() {
  const state = await seal(
    "ghapp",
    { ws: "acme", by: ADMIN.id, exp: now.getTime() / 1000 + 600 },
    SECRET,
  );
  const back = await root(`/github/app/callback?code=code-1&state=${encodeURIComponent(state)}`);
  expect(back.status).toBe(303);
  const installed = await root("/github/app/installed?installation_id=7&setup_action=install");
  expect(installed.headers.get("location")).toBe(`${ORIGIN}/settings/github?installed=1`);
  return back;
}

describe("making the app from its manifest", () => {
  it("sends the manifest to GitHub from an admin's page, with a signed state", async () => {
    const answer = await root("/github/app/new?owner=acme-sh");
    expect(answer.status).toBe(200);
    expect(answer.headers.get("content-security-policy")).toContain(
      "form-action https://github.com",
    );
    const html = await answer.text();
    expect(html).toContain(
      'action="https://github.com/organizations/acme-sh/settings/apps/new?state=ghapp.',
    );
    const manifest = JSON.parse(
      /name="manifest" value="([^"]+)"/
        .exec(html)![1]!
        .replaceAll("&quot;", '"')
        .replaceAll("&amp;", "&")
        .replaceAll("&#39;", "'"),
    );
    expect(manifest).toMatchObject({
      name: "Forgeron · acme.forgeron.test",
      hook_attributes: { url: `${ORIGIN}/github/webhook` },
      redirect_url: `${ORIGIN}/github/app/callback`,
      setup_url: `${ORIGIN}/github/app/installed`,
      public: false,
      default_permissions: {
        contents: "write",
        workflows: "write",
        statuses: "write",
        administration: "write",
        metadata: "read",
      },
      default_events: ["delete"],
    });
    expect(manifest.name.length).toBeLessThanOrEqual(34);
  });

  it("is for admins, and needs a gateway that keeps secrets", async () => {
    person = MEMBER;
    expect((await root("/github/app/new")).status).toBe(403);
    person = undefined;
    expect((await root("/github/app/new")).status).toBe(401);
    person = ADMIN;
    const without = platformCaller({
      registry,
      who: () => person,
      tokenSecret: SECRET,
      surface: "root",
    });
    expect((await without(new Request(`${ORIGIN}/github/app/new`)))!.status).toBe(501);
    // Not on the console's surface.
    expect(await caller("console")(new Request(`${ORIGIN}/github/app/new`))).toBeUndefined();
  });

  it("trades GitHub's code for the app and seals its keys, then records the installation", async () => {
    const back = await connect();
    expect(back.headers.get("location")).toBe(`${ORIGIN}/settings/github?connected=1`);
    expect(await registry.githubApp("acme")).toMatchObject({
      appId: 42,
      slug: "forgeron-acme",
      owner: "acme-sh",
    });
    expect((await registry.githubAppKeys("acme")).privateKey).toContain("BEGIN RSA PRIVATE KEY");
    // The installation was checked with the app's own JWT, signed with the key GitHub gave.
    expect(github.state.calls).toContain("GET /app/installations/7");
    expect(await registry.listGithubInstallations("acme")).toMatchObject([
      { installationId: 7, account: "acme-sh", accountType: "Organization" },
    ]);
    const status = await (await api("GET", "/api/github")).json();
    expect(status).toEqual({
      available: true,
      app: {
        slug: "forgeron-acme",
        owner: "acme-sh",
        htmlUrl: "https://github.com/apps/forgeron-acme",
        installUrl: "https://github.com/apps/forgeron-acme/installations/new",
        createdAt: now.toISOString(),
      },
      installations: [{ id: 7, account: "acme-sh", accountType: "Organization" }],
    });
  });

  it("refuses a state that is not this admin's, expired, or forged, and a code GitHub refuses", async () => {
    const state = (claims: object) => seal("ghapp", claims, SECRET);
    const exp = now.getTime() / 1000 + 600;
    for (const s of [
      await state({ ws: "globex", by: ADMIN.id, exp }),
      await state({ ws: "acme", by: "p-other", exp }),
      await state({ ws: "acme", by: ADMIN.id, exp: now.getTime() / 1000 - 1 }),
      await seal("ghapp", { ws: "acme", by: ADMIN.id, exp }, "another-secret-entirely"),
    ]) {
      const answer = await root(`/github/app/callback?code=code-1&state=${encodeURIComponent(s)}`);
      expect(answer.status).toBe(400);
    }
    expect(await registry.githubApp("acme")).toBeUndefined();
    const used = await state({ ws: "acme", by: ADMIN.id, exp });
    expect(
      (await root(`/github/app/callback?code=code-9&state=${encodeURIComponent(used)}`)).status,
    ).toBe(502);
  });

  it("does not record an installation GitHub does not know for this app", async () => {
    await connect();
    const answer = await root("/github/app/installed?installation_id=99");
    expect(answer.status).toBe(502);
    expect(await registry.listGithubInstallations("acme")).toHaveLength(1);
  });
});

describe("the webhook", () => {
  it("refuses a delivery that is not signed by the app's secret", async () => {
    await connect();
    const forged = await github.deliver(ORIGIN, "ping", {}, "not-the-secret");
    expect((await root("/github/webhook", forged)).status).toBe(401);
    const unsigned = new Request(`${ORIGIN}/github/webhook`, { method: "POST", body: "{}" });
    expect((await root("/github/webhook", unsigned)).status).toBe(401);
    const ping = await github.deliver(ORIGIN, "ping", { zen: "Keep it simple." });
    expect((await root("/github/webhook", ping)).status).toBe(200);
  });

  it("answers 404 when the workspace has no app", async () => {
    const ping = await github.deliver(ORIGIN, "ping", {});
    expect((await root("/github/webhook", ping)).status).toBe(404);
  });

  it("closes the preview of a deleted branch of a linked repository", async () => {
    await connect();
    const tool = await registry.createTool({ workspace: "acme", name: "crm" });
    await registry.linkRepository({
      toolId: tool.id,
      repo: "acme-sh/crm",
      repoId: 101,
      productionBranch: "main",
      actor: "p",
    });
    await registry.ensureEnvironment(tool.id, "preview", "feat");
    const deleted = await github.deliver(ORIGIN, "delete", {
      ref: "feat",
      ref_type: "branch",
      repository: { id: 101, full_name: "acme-sh/crm" },
    });
    const answer = await root("/github/webhook", deleted);
    expect(await answer.json()).toEqual({ tool: "crm", branch: "feat", removed: true });
    expect(closed).toEqual(["crm@feat"]);
    expect(await registry.listEnvironments(tool.id)).toEqual([]);
    // A tag, or a repository linked to nothing, changes nothing.
    const tag = await github.deliver(ORIGIN, "delete", {
      ref: "v1",
      ref_type: "tag",
      repository: { id: 101, full_name: "acme-sh/crm" },
    });
    expect((await root("/github/webhook", tag)).status).toBe(202);
    const other = await github.deliver(ORIGIN, "delete", {
      ref: "feat",
      ref_type: "branch",
      repository: { id: 5, full_name: "acme-sh/other" },
    });
    expect((await root("/github/webhook", other)).status).toBe(202);
  });

  it("records an installation added or removed on GitHub", async () => {
    await connect();
    const added = await github.deliver(ORIGIN, "installation", {
      action: "created",
      installation: { id: 8, account: { login: "someone", type: "User" } },
    });
    expect((await root("/github/webhook", added)).status).toBe(200);
    expect((await registry.listGithubInstallations("acme")).map((i) => i.account)).toEqual([
      "acme-sh",
      "someone",
    ]);
    const removed = await github.deliver(ORIGIN, "installation", {
      action: "deleted",
      installation: { id: 7, account: { login: "acme-sh", type: "Organization" } },
    });
    expect((await root("/github/webhook", removed)).status).toBe(200);
    expect((await registry.listGithubInstallations("acme")).map((i) => i.account)).toEqual([
      "someone",
    ]);
  });
});

describe("the console's GitHub", () => {
  it("lists the repositories, with whether each holds a tool and which tool is linked", async () => {
    expect((await api("GET", "/api/github/repositories")).status).toBe(404);
    await connect();
    github.addRepository("acme-sh/crm", { "forgeron.config.ts": "x" }, 101);
    github.addRepository(
      "acme-sh/odoo",
      { "forgeron.config.ts": "x", ".github/workflows/forgeron.yml": "y" },
      102,
    );
    github.addRepository("acme-sh/site", {}, 103);
    github.addRepository("globex/hidden", { "forgeron.config.ts": "x" }, 104);
    const odoo = await registry.createTool({ workspace: "acme", name: "odoo" });
    await registry.linkRepository({
      toolId: odoo.id,
      repo: "acme-sh/odoo",
      productionBranch: "main",
      actor: "p",
    });
    const listed = (await (await api("GET", "/api/github/repositories")).json()) as {
      repositories: unknown[];
    };
    expect(listed.repositories).toEqual([
      {
        repo: "acme-sh/crm",
        id: 101,
        private: true,
        defaultBranch: "main",
        forgeron: true,
        workflow: false,
        tool: null,
      },
      {
        repo: "acme-sh/odoo",
        id: 102,
        private: true,
        defaultBranch: "main",
        forgeron: true,
        workflow: true,
        tool: "odoo",
      },
      {
        repo: "acme-sh/site",
        id: 103,
        private: true,
        defaultBranch: "main",
        forgeron: false,
        workflow: false,
        tool: null,
      },
    ]);
  });

  it("links a repository in a click, with its number, and adds the workflow when asked", async () => {
    await connect();
    const repo = github.addRepository("acme-sh/crm", { "forgeron.config.ts": "x" }, 101);
    repo.commits.push({ sha: "c".repeat(40), message: "first", files: {} });
    const linked = await api("POST", "/api/github/repositories/link", {
      repo: "acme-sh/crm",
      name: "crm",
      addWorkflow: true,
    });
    expect(linked.status).toBe(201);
    expect(await linked.json()).toEqual({
      tool: "crm",
      repo: "acme-sh/crm",
      productionBranch: "main",
      workflow: "added",
    });
    const tool = (await registry.findTool("acme", "crm"))!;
    expect(await registry.toolSource(tool.id)).toMatchObject({ repo: "acme-sh/crm", repoId: 101 });
    const workflow = repo.files[".github/workflows/forgeron.yml"]!;
    expect(workflow).toContain("id-token: write");
    expect(workflow).toContain("uses: forgeron-sh/monorepo/.github/actions/deploy@v0.0.0");
    expect(workflow).toContain(`endpoint: ${ORIGIN}`);
    expect(workflow).not.toContain("secrets.");
    // Twice is refused: the repository is the tool's.
    const again = await api("POST", "/api/github/repositories/link", {
      repo: "acme-sh/crm",
      name: "crm-2",
    });
    expect(again.status).toBe(409);
    // A repository the app may not see.
    const hidden = await api("POST", "/api/github/repositories/link", {
      repo: "globex/x",
      name: "x",
    });
    expect(hidden.status).toBe(404);
  });

  it("makes a new tool: a repository made as forgeron init would, linked before its first push", async () => {
    await connect();
    const made = await api("POST", "/api/github/tools", { name: "tickets", owner: "acme-sh" });
    expect(made.status).toBe(201);
    expect(await made.json()).toEqual({
      tool: "tickets",
      repo: "acme-sh/tickets",
      url: "https://github.com/acme-sh/tickets",
    });
    const repo = github.state.repositories.get("acme-sh/tickets")!;
    expect(repo.private).toBe(true);
    expect(Object.keys(repo.files).sort()).toEqual(
      [
        ".forgeron/.gitignore",
        ".forgeron/project.json",
        ".github/workflows/forgeron.yml",
        "AGENTS.md",
        "CLAUDE.md",
        "README.md",
        "actions/ping.ts",
        "changes/.gitkeep",
        "docs/lifecycle.md",
        "forgeron.config.ts",
        "package.json",
        "tests/ping.test.ts",
      ].sort(),
    );
    expect(JSON.parse(repo.files[".forgeron/project.json"]!)).toEqual({
      tool: "tickets",
      endpoint: ORIGIN,
    });
    expect(repo.commits.at(-1)!.message).toBe("feat: tickets, made with Forgeron");
    const tool = (await registry.findTool("acme", "tickets"))!;
    expect(await registry.toolSource(tool.id)).toMatchObject({
      repo: "acme-sh/tickets",
      repoId: repo.id,
    });
    // The name is taken now, here and on GitHub.
    expect(
      (await api("POST", "/api/github/tools", { name: "tickets", owner: "acme-sh" })).status,
    ).toBe(409);
    github.addRepository("acme-sh/taken", {});
    expect(
      (await api("POST", "/api/github/tools", { name: "taken", owner: "acme-sh" })).status,
    ).toBe(409);
    expect(await registry.findTool("acme", "taken")).toBeUndefined();
    // Not installed there.
    expect((await api("POST", "/api/github/tools", { name: "x", owner: "globex" })).status).toBe(
      404,
    );
  });

  it("refuses to make a repository in a personal account, which GitHub does not allow an app", async () => {
    await connect();
    await registry.addGithubInstallation({
      workspace: "acme",
      installationId: 8,
      account: "someone",
      accountType: "User",
    });
    github.state.installations.set(8, { account: "someone", type: "User" });
    const answer = await api("POST", "/api/github/tools", { name: "mine", owner: "someone" });
    expect(answer.status).toBe(400);
    expect(((await answer.json()) as { message: string }).message).toContain("organisation");
  });

  it("disconnects: the app and its installations are forgotten", async () => {
    await connect();
    expect((await api("DELETE", "/api/github")).status).toBe(204);
    expect(await (await api("GET", "/api/github")).json()).toMatchObject({
      app: null,
      installations: [],
    });
    expect((await api("DELETE", "/api/github")).status).toBe(404);
  });
});

const as = async (request: Request, who: ConsolePerson | undefined) => {
  person = who;
  return (await caller("console")(request))!;
};
describeRouteMatrix({
  title: "GET /api/github",
  access: "settings:read",
  call: as,
  method: "GET",
  path: "/api/github",
});
describeRouteMatrix({
  title: "DELETE /api/github",
  access: "settings:write",
  call: as,
  method: "DELETE",
  path: "/api/github",
});
describeRouteMatrix({
  title: "GET /api/github/repositories",
  access: "tools:write",
  call: as,
  method: "GET",
  path: "/api/github/repositories",
});
describeRouteMatrix({
  title: "POST /api/github/repositories/link",
  access: "tools:write",
  call: as,
  method: "POST",
  path: "/api/github/repositories/link",
  invalid: [{ repo: "nope", name: "crm" }, { repo: "a/b", name: "Not A Name" }, {}],
  valid: { repo: "acme-sh/crm", name: "crm" },
});
describeRouteMatrix({
  title: "POST /api/github/tools",
  access: "tools:write",
  call: as,
  method: "POST",
  path: "/api/github/tools",
  invalid: [{ name: "x", owner: "-bad" }, { owner: "acme-sh" }],
  valid: { name: "crm", owner: "acme-sh" },
});

describe("through the gateway", () => {
  let gatewayMemory: MemoryD1;
  let env: GatewayEnv;
  beforeEach(async () => {
    gatewayMemory = await createMemoryD1();
    const d1 = gatewayMemory as unknown as D1Database;
    await migratePlatform(d1);
    env = { DB: d1, BASE_DOMAIN: "forgeron.app", AUTH_SECRET: SECRET };
  });
  afterEach(() => gatewayMemory.close());

  it("serves the webhook and the app's pages outside /console-api", async () => {
    const gateway = createGateway(env);
    const hook = await gateway(
      new Request("https://acme.forgeron.app/github/webhook", { method: "POST", body: "{}" }),
    );
    expect(hook.status).toBe(404);
    expect(await hook.json()).toMatchObject({ error: { code: "NOT_FOUND" } });
    const page = await gateway(new Request("https://acme.forgeron.app/github/app/new"));
    expect(page.status).toBe(401);
  });
});
