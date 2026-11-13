import type { Manifest } from "@forgeron/manifest";
import type { Build, D1Database, Hosting } from "@forgeron/hosting";
import {
  createRegistry,
  createSecretBox,
  deployBuild,
  migratePlatform,
  TEMPLATE_WORKSPACE,
  type Registry,
} from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { BUILT_IN_TEAMS, holds, PLATFORM, type PlatformPermission } from "@forgeron/permissions";
import { redacted } from "../admin-mcp/server";
import { TOOLS } from "../admin-mcp/tools";
import { createGateway, type GatewayEnv } from "../gateway";
import { openSession } from "../identity/authn/session";
import { issueToken } from "../identity/authn/tokens";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

// The admin MCP (`/mcp`, sdk.md §17, D-079) through the whole gateway: real registry, real platform
// routes, CLI tokens as Bearer. Every safeguard has a test here. The people, the keys and the secret
// value are test values.

const SECRET = "test-secret-not-a-real-one";
const KEY = btoa(String.fromCharCode(...new Uint8Array(32)));
const VALUE = "hr-secret-value-for-the-test-only";
const DAY = 86_400;
const now = new Date("2026-11-04T10:00:00Z");

const ALL = ["mcp", "api", "cli", "web"] as const;
const manifest = {
  name: "crm",
  version: "1.0.0",
  interfaces: { mcp: true, api: true, cli: true, web: true },
  profiles: { reader: { grants: ["read"] } },
  actions: {
    "tickets.mine": {
      description: "My tickets.",
      access: "read",
      input: { type: "object", properties: {} },
      confirm: false,
      cli: { args: [] },
      http: { method: "GET" },
      interfaces: [...ALL],
    },
  },
  views: {},
  jobs: {},
  events: {},
  resources: {},
  uses: {},
  preview: { data: "seed" },
} as unknown as Manifest;

const build = (fingerprint: string): Build => ({
  manifest,
  worker: `// ${fingerprint}`,
  fingerprint,
  changelog: { entries: [{}], declared: "patch", detected: "patch" },
});

const hosting: Hosting = {
  async provision(environment) {
    return { environment, bindings: [] };
  },
  async upload(provisioned, b) {
    return { provisioned, build: b };
  },
  async migrate() {
    return { applied: [] };
  },
  async activate({ provisioned }) {
    return { url: `https://${provisioned.environment.name}.test` };
  },
  async teardown() {},
};

let memory: MemoryD1;
let registry: Registry;
let env: GatewayEnv;
let ana = ""; // a member, in no team
let viewer = ""; // in a team that may see tools
let dev = ""; // in the developer team
let root = ""; // in the admin team
let other = ""; // a second member of the admin team
let approvalId = "";

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1, { secrets: await createSecretBox(KEY), now: () => now });

  // crm: 1.0.0 on production; 1.1.0 and 1.2.0 on the preview of `feat`.
  const crm = await registry.createTool({ workspace: "acme", name: "crm" });
  const deploy = (environment: "preview" | "production", fp: string, version: string) =>
    deployBuild(registry, hosting, {
      tool: crm,
      environment,
      ...(environment === "preview" ? { branch: "feat" } : {}),
      build: build(fp),
      version,
      actor: "ci",
    });
  await deploy("production", "fp1", "1.0.0");
  await deploy("preview", "fp2", "1.1.0");
  await deploy("preview", "fp3", "1.2.0");

  // hr: declares a secret, which is set; a version waits for an approval.
  const hr = await registry.createTool({ workspace: "acme", name: "hr" });
  const hrBuild = await registry.recordBuild(hr.id, {
    fingerprint: "hr",
    manifest: { ...manifest, name: "hr", resources: { secrets: { HR_KEY: { why: "Reads" } } } },
  });
  const hrVersion = await registry.publishVersion(hr.id, hrBuild.id, "1.0.0");
  await registry.setSecret(hr.id, "production", "HR_KEY", VALUE);
  approvalId = (
    await registry.requestApproval(hrVersion.id, {
      resource: "resources.network",
      kind: "resource.added",
    })
  ).id;

  const member = async (subject: string, teams: string[]) =>
    (
      await registry.addMember({
        workspace: "acme",
        subject,
        email: `${subject}@acme.test`,
        name: subject,
        teams,
      })
    ).id;
  // A team that may see tools and nothing else.
  await registry.createTeam(
    "acme",
    { id: "viewers", name: "Viewers", permissions: ["tools:read"] },
    "root",
    ["*"],
  );
  ana = await member("ana", []);
  viewer = await member("viewer", ["viewers"]);
  dev = await member("dev", ["developer"]);
  root = await member("root", ["admin"]);
  other = await member("other", ["admin"]);
  env = { DB: d1, BASE_DOMAIN: "forgeron.app", AUTH_SECRET: SECRET, SECRETS_KEY: KEY };
});
afterAll(() => memory.close());

const gateway = () => createGateway(env, { now: () => now, hosting: () => hosting });
const token = (
  person: string,
  { tool = "platform", scope = "cli", workspace = "acme", ttl = 30 * DAY } = {},
) =>
  issueToken({
    secret: SECRET,
    person,
    workspace,
    tool,
    ttlSeconds: ttl,
    now,
    ...(scope ? { scope } : {}),
  });

let next = 1;
const post = (bearer: string | undefined, body: unknown, headers: Record<string, string> = {}) =>
  gateway()(
    new Request("https://acme.forgeron.app/mcp", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(bearer ? { authorization: `Bearer ${bearer}` } : {}),
        ...headers,
      },
      body: JSON.stringify(body),
    }),
  );
const rpc = async (bearer: string, method: string, params?: unknown) =>
  (await (await post(bearer, { jsonrpc: "2.0", id: next++, method, params })).json()) as {
    result?: any;
    error?: { code: number; message: string };
  };
const call = async (person: string, name: string, args: unknown = {}) => {
  const { result } = await rpc(await token(person), "tools/call", { name, arguments: args });
  const text = result.content[0].text as string;
  return {
    error: result.isError === true,
    text,
    data: result.isError ? undefined : JSON.parse(text),
  };
};
const listed = async (person: string) =>
  ((await rpc(await token(person), "tools/list")).result.tools as any[]).map((t) => t.name);
const audit = async (subject: string) =>
  (
    await (memory as unknown as D1Database)
      .prepare(`SELECT "actor", "via", "kind" FROM "audit_log" WHERE "subject" = ?`)
      .bind(subject)
      .all()
  ).results as Array<{ actor: string; via: string | null; kind: string }>;
const auditCount = async () =>
  (
    (await (memory as unknown as D1Database).prepare(`SELECT "id" FROM "audit_log"`).all())
      .results ?? []
  ).length;

describe("who may reach /mcp", () => {
  it("answers 401 to nobody, and never lists a tool to them", async () => {
    const response = await post(undefined, { jsonrpc: "2.0", id: 1, method: "tools/list" });
    expect(response.status).toBe(401);
    expect(response.headers.get("www-authenticate")).toBe(
      'Bearer resource_metadata="https://acme.forgeron.app/.well-known/oauth-protected-resource"',
    );
  });

  it("refuses a token issued for a tool, a deployment token and a token of another workspace", async () => {
    const body = { jsonrpc: "2.0", id: 1, method: "tools/list" };
    expect((await post(await token(root, { tool: "crm", scope: "" }), body)).status).toBe(401);
    expect((await post(await token(root, { tool: "crm", scope: "deploy" }), body)).status).toBe(
      401,
    );
    expect((await post(await token(root, { workspace: "other-ws" }), body)).status).toBe(401);
  });

  it("refuses an expired token", async () => {
    const body = { jsonrpc: "2.0", id: 1, method: "tools/list" };
    expect((await post(await token(root, { ttl: 60 }), body)).status).toBe(200);
    const later = createGateway(env, { now: () => new Date(now.getTime() + 120_000) });
    const expired = await later(
      new Request("https://acme.forgeron.app/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${await token(root, { ttl: 60 })}`,
        },
        body: JSON.stringify(body),
      }),
    );
    expect(expired.status).toBe(401);
  });

  it("does not take a session cookie, which a browser could be made to send", async () => {
    const cookie = (
      await openSession(
        { person: root, workspace: "acme" },
        { secret: SECRET, ttlSeconds: 600, now },
      )
    ).split(";")[0]!;
    const response = await post(
      undefined,
      { jsonrpc: "2.0", id: 1, method: "tools/list" },
      { cookie },
    );
    expect(response.status).toBe(401);
  });

  it("takes POST only: any other method meets the JSON 404 the workspace gives its API paths", async () => {
    const response = await gateway()(
      new Request("https://acme.forgeron.app/mcp", {
        headers: { authorization: `Bearer ${await token(root)}` },
      }),
    );
    expect(response.status).toBe(404);
    expect(response.headers.get("content-type")).toContain("application/json");
  });
});

describe("the tools and the permission they require", () => {
  const SIGNED_IN = ["catalog_search", "catalog_get", "tools_list", "tool_get", "team_list"];
  const TOOLS_READ = ["tool_versions", "tool_changelog", "secrets_status", "tool_source"];
  const requiring = (permissions: PlatformPermission[]) =>
    TOOLS.filter((t) => t.requires === "signed-in" || holds(PLATFORM, permissions, t.requires))
      .map((t) => t.name)
      .sort();

  it("offers each person the tools their permissions allow", async () => {
    expect((await listed(ana)).sort()).toEqual([...SIGNED_IN].sort());
    expect((await listed(viewer)).sort()).toEqual([...SIGNED_IN, ...TOOLS_READ].sort());
    // The developer team is given `tools:write`, `tools:publish`, `tools:data`, `access:read` and
    // `marketplace:read`: the tools that need more are not offered.
    const developer = BUILT_IN_TEAMS.find((t) => t.id === "developer")!.permissions;
    expect((await listed(dev)).sort()).toEqual(requiring(developer as PlatformPermission[]));
    expect(await listed(dev)).not.toContain("access_grant");
    expect(await listed(dev)).not.toContain("resources_approve");
    expect((await listed(root)).sort()).toEqual(TOOLS.map((t) => t.name).sort());
    expect(TOOLS).toHaveLength(26);
  });

  it("marks what changes something with destructiveHint, and nothing else", async () => {
    const tools = (await rpc(await token(root), "tools/list")).result.tools as any[];
    const destructive = tools.filter((t) => t.annotations.destructiveHint).map((t) => t.name);
    expect(destructive.sort()).toEqual(
      [
        "access_grant",
        "access_revoke",
        "member_set_teams",
        "resources_approve",
        "team_set_members",
        "team_set_permissions",
        "tool_install",
        "tool_rollback",
        "tool_update",
      ].sort(),
    );
    for (const t of tools) {
      expect(t.annotations.readOnlyHint).toBe(!t.annotations.destructiveHint);
      expect(t.annotations.openWorldHint).toBe(false);
    }
  });

  it("refuses a person a tool whose permission they lack, and changes nothing", async () => {
    const before = await auditCount();
    const refused = [
      ["access_grant", { subject: "everyone", tool: "crm", profile: "reader" }],
      ["access_revoke", { subject: "everyone", tool: "crm" }],
      ["member_set_teams", { person: "ana@acme.test", teams: ["admin"] }],
      ["team_set_members", { team: "admin", members: ["ana@acme.test"] }],
      ["team_set_permissions", { team: "viewers", permissions: ["*"] }],
      ["resources_approve", { id: approvalId }],
      ["resources_pending", {}],
      ["usage_report", {}],
    ] as const;
    // A person with no permission, and one who may only see tools, are refused all of them and the
    // tools below that need more than `tools:read`.
    for (const person of [ana, viewer]) {
      for (const [name, args] of [
        ...refused,
        ["tool_update", { tool: "crm", version: "1.1.0" }],
        ["tool_rollback", { tool: "crm", environment: "production" }],
        ["template_list", {}],
        ["marketplace_list", {}],
        ["marketplace_tools", { marketplace: "official" }],
        ["tool_install_plan", { template: "inventory" }],
        ["tool_install", { plan: "anything" }],
        ["access_list", {}],
        ...(person === ana ? ([["tool_source", { tool: "crm" }]] as const) : []),
      ] as const) {
        const answer = await call(person, name, args);
        expect(answer.error, `${person} ${name}`).toBe(true);
        expect(answer.text).toMatch(/^403 FORBIDDEN/);
      }
    }
    // The developer team holds neither approval, access, members, teams nor usage.
    for (const [name, args] of refused) {
      const answer = await call(dev, name, args);
      expect(answer.error, `dev ${name}`).toBe(true);
      expect(answer.text).toMatch(/^403 FORBIDDEN/);
    }
    expect(await auditCount()).toBe(before);
    expect((await registry.findMember("acme", ana))?.teams).toEqual([]);
    expect(
      (await registry.listApprovals((await registry.findTool("acme", "hr"))!.id))[0]!.status,
    ).toBe("pending");
  });

  it("names the permission a tool needs in its refusal and in its listing", async () => {
    expect((await call(ana, "usage_report")).text).toBe(
      "403 FORBIDDEN: usage_report is for people who hold the permission \u201cSee usage\u201d.",
    );
    const tools = (await rpc(await token(root), "tools/list")).result.tools as any[];
    expect(tools.find((t) => t.name === "usage_report").description).toMatch(
      /For people who hold the permission \u201cSee usage\u201d\.$/,
    );
    expect(tools.find((t) => t.name === "tools_list").description).toMatch(
      /For any signed-in person\.$/,
    );
  });

  it("refuses a member a tool of the tool pages", async () => {
    expect((await call(ana, "tool_versions", { tool: "crm" })).text).toMatch(/^403/);
    expect((await call(ana, "secrets_status", { tool: "hr" })).text).toMatch(/^403/);
    expect((await call(viewer, "secrets_status", { tool: "hr" })).error).toBe(false);
    expect((await call(dev, "secrets_status", { tool: "hr" })).error).toBe(false);
  });

  it("reads the permissions from the person, never from an argument, and reads them now", async () => {
    // No tool takes an identity to act as or a person to act for.
    for (const t of TOOLS) {
      const properties = Object.keys((t.input.toJSONSchema() as any).properties ?? {});
      expect(properties).not.toContain("as");
      expect(properties).not.toContain("actor");
      expect(properties).not.toContain("caller");
    }
    const forged = await call(ana, "tools_list", { as: "admin", teams: ["admin"] });
    expect(forged.error).toBe(true);
    expect(forged.text).toMatch(/^400 INVALID/);

    // The token of a person who has left a team is a token of a person without its permissions.
    const extra = (
      await registry.addMember({
        workspace: "acme",
        subject: "temp",
        email: "temp@acme.test",
        name: "temp",
        teams: ["admin"],
      })
    ).id;
    expect(await listed(extra)).toContain("tool_update");
    await registry.setMemberTeams("acme", extra, [], root, ["*"]);
    expect(await listed(extra)).not.toContain("tool_update");
    expect((await call(extra, "tool_update", { tool: "crm", version: "1.1.0" })).text).toMatch(
      /^403/,
    );
    await registry.removeMember("acme", extra, root);
    // And a person removed from the workspace is nobody.
    const gone = await post(await token(extra), { jsonrpc: "2.0", id: 1, method: "tools/list" });
    expect(gone.status).toBe(401);
  });

  it("refuses an input the tool does not declare", async () => {
    const answer = await call(root, "tool_versions", { tool: "crm", extra: true });
    expect(answer.error).toBe(true);
    expect((await call(root, "tool_versions", { tool: "../x" })).text).toMatch(/^400 INVALID/);
  });
});

describe("what the tools read", () => {
  it("searches and shows the catalog, the tools and their versions", async () => {
    expect(
      (await call(ana, "catalog_search", { query: "CR" })).data.tools.map((t: any) => t.name),
    ).toEqual(["crm"]);
    expect((await call(ana, "tools_list")).data.tools.map((t: any) => t.name)).toEqual([
      "crm",
      "hr",
    ]);
    const got = (await call(ana, "tool_get", { tool: "crm" })).data;
    expect(got.listing.production).toBe("1.0.0");
    expect(got.card.name).toBe("crm");
    expect((await call(ana, "tool_get", { tool: "nope" })).text).toMatch(/^404/);
    const versions = (await call(dev, "tool_versions", { tool: "crm" })).data.versions;
    expect(versions.map((v: any) => v.version)).toEqual(["1.2.0", "1.1.0", "1.0.0"]);
  });

  it("gives the changelog after a version, as the route that carries it does", async () => {
    const all = (await call(dev, "tool_changelog", { tool: "crm" })).data.versions;
    expect(all.map((v: any) => v.version)).toEqual(["1.2.0", "1.1.0", "1.0.0"]);
    const since = (await call(dev, "tool_changelog", { tool: "crm", since: "1.0.0" })).data
      .versions;
    expect(since.map((v: any) => v.version)).toEqual(["1.2.0", "1.1.0"]);
    expect((await call(dev, "tool_changelog", { tool: "crm", since: "9.9.9" })).text).toMatch(
      /^404/,
    );
  });

  it("writes nothing to the audit log when it only reads", async () => {
    const before = await auditCount();
    for (const [name, args] of [
      ["tools_list", {}],
      ["tool_versions", { tool: "crm" }],
      ["access_list", {}],
      ["access_list", { tool: "crm" }],
      ["resources_pending", {}],
      ["secrets_status", { tool: "hr" }],
    ] as const) {
      expect((await call(root, name, args)).error).toBe(false);
    }
    expect(await auditCount()).toBe(before);
  });
});

describe("what the tools change goes through the console's path, audited via the MCP", () => {
  it("changes the teams of a member, found by email", async () => {
    const granted = await call(root, "member_set_teams", {
      person: "ana@acme.test",
      teams: ["viewers"],
    });
    expect(granted.error).toBe(false);
    expect((await registry.findMember("acme", ana))?.teams).toEqual(["viewers"]);
    const lines = (await audit("member:teams")).filter((l) => l.via !== null);
    expect(lines).toEqual([{ actor: root, via: "Forgeron MCP", kind: "access" }]);

    await call(root, "member_set_teams", { person: ana, teams: [] });
    expect((await registry.findMember("acme", ana))?.teams).toEqual([]);
    expect(
      (await call(root, "member_set_teams", { person: "nobody@acme.test", teams: [] })).text,
    ).toMatch(/^404/);
    // The registry's own rules hold: the admin team keeps a member.
    await call(root, "member_set_teams", { person: other, teams: [] });
    expect((await call(root, "member_set_teams", { person: root, teams: [] })).text).toMatch(
      /LAST_ADMIN/,
    );
    await call(root, "member_set_teams", { person: other, teams: ["admin"] });
  });

  it("lists the teams, and sets the members and the permissions of one", async () => {
    const listedTeams = (await call(ana, "team_list")).data.teams as Array<{ id: string }>;
    expect(listedTeams.map((t) => t.id)).toEqual(
      expect.arrayContaining(["admin", "developer", "viewers"]),
    );
    expect(
      (await call(root, "team_set_members", { team: "viewers", members: ["ana@acme.test"] })).data
        .members,
    ).toEqual([ana]);
    const set = await call(root, "team_set_permissions", {
      team: "viewers",
      permissions: ["tools:read", "audit:read"],
    });
    expect(set.data.permissions).toEqual(["tools:read", "audit:read"]);
    expect((await audit("team:permissions")).at(-1)).toMatchObject({ via: "Forgeron MCP" });
    // Back to what the other tests expect.
    await call(root, "team_set_members", { team: "viewers", members: [viewer] });
    await call(root, "team_set_permissions", { team: "viewers", permissions: ["tools:read"] });
    // Within what the caller holds: a developer is not offered the tool, and the route refuses too.
    expect(
      (await call(dev, "team_set_permissions", { team: "viewers", permissions: ["*"] })).text,
    ).toMatch(/^403/);
  });

  it("allows and refuses a subject an action of a tool, and says so in the audit log", async () => {
    expect(
      (
        await call(root, "access_grant", {
          tool: "crm",
          subject: "everyone",
          action: "tickets.mine",
        })
      ).error,
    ).toBe(false);
    expect(
      (
        await call(root, "access_revoke", {
          tool: "crm",
          subject: "everyone",
          action: "tickets.mine",
        })
      ).error,
    ).toBe(false);
    const lines = await audit("everyone:tickets.mine");
    expect(lines).toHaveLength(2);
    expect(lines.every((l) => l.via === "Forgeron MCP" && l.actor === root)).toBe(true);
    // Not both a person and a cell, and an action the tool does not have is refused.
    expect(
      (
        await call(root, "access_grant", {
          person: ana,
          tool: "crm",
          subject: "everyone",
          action: "tickets.mine",
        })
      ).error,
    ).toBe(true);
    expect(
      (
        await call(root, "access_grant", {
          tool: "crm",
          subject: "everyone",
          action: "tickets.ghost",
        })
      ).text,
    ).toMatch(/^404/);
    // A subject is everyone or a team.
    expect(
      (
        await call(root, "access_grant", {
          tool: "crm",
          subject: "support",
          action: "tickets.mine",
        })
      ).text,
    ).toMatch(/^400 INVALID/);
  });

  it("gives a team a profile of a tool, and nothing (D-127, D-136)", async () => {
    const granted = await call(root, "access_grant", {
      tool: "crm",
      subject: "team:developer",
      profile: "reader",
    });
    expect(granted.error).toBe(false);
    expect(granted.data.grants["team:developer"]).toEqual({ kind: "profile", profile: "reader" });
    expect(
      (
        await call(root, "access_grant", {
          tool: "crm",
          subject: "team:viewers",
          permissions: ["read"],
        })
      ).data.grants["team:viewers"],
    ).toEqual({ kind: "custom", permissions: ["read"] });
    const revoked = await call(root, "access_revoke", { tool: "crm", subject: "team:developer" });
    expect(revoked.data.grants["team:developer"]).toEqual({ kind: "none" });
    const lines = await audit("grant:team:developer");
    expect(lines).toHaveLength(2);
    expect(lines.every((l) => l.via === "Forgeron MCP" && l.actor === root)).toBe(true);
    // A grant names exactly one of profile, permissions, all; a profile must be the tool's.
    expect((await call(root, "access_grant", { tool: "crm", subject: "everyone" })).error).toBe(
      true,
    );
    expect(
      (await call(root, "access_grant", { tool: "crm", subject: "everyone", profile: "ghost" }))
        .text,
    ).toMatch(/^404/);
    expect(
      (await call(root, "access_revoke", { tool: "crm", subject: "everyone", profile: "reader" }))
        .error,
    ).toBe(true);
  });

  it("approves a pending resource once", async () => {
    const pending = (await call(root, "resources_pending")).data.versions;
    expect(pending[0].approvals[0].id).toBe(approvalId);
    expect((await call(root, "resources_approve", { id: approvalId })).data.status).toBe(
      "approved",
    );
    expect((await audit("resources.network")).at(-1)).toEqual({
      actor: root,
      via: "Forgeron MCP",
      kind: "approval",
    });
    expect((await call(root, "resources_approve", { id: approvalId })).text).toMatch(
      /ALREADY_DECIDED/,
    );
  });

  it("updates a permanent channel and rolls it back with the caller's identity, audited via the MCP", async () => {
    // A release on `main`, the branch production follows (D-125).
    const crm = (await registry.findTool("acme", "crm"))!;
    await deployBuild(registry, hosting, {
      tool: crm,
      environment: "preview",
      branch: "main",
      build: build("fp-main"),
      version: "1.3.0",
      actor: "ci",
    });
    const source = await call(root, "tool_source", { tool: "crm" });
    expect(source.data).toMatchObject({
      update: { version: "1.3.0", branch: "main", plan: { ok: true } },
      channels: [{ name: "production", follows: "main", serves: "1.0.0" }],
    });
    const stale = await call(root, "tool_update", { tool: "crm", version: "1.1.0" });
    expect(stale.text).toMatch(/^409 STALE/);
    const updated = await call(root, "tool_update", { tool: "crm", version: "1.3.0" });
    expect(updated.data).toEqual({ tool: "crm", channel: "production", version: "1.3.0" });
    expect((await audit("production:1.3.0")).at(-1)).toMatchObject({
      via: "Forgeron MCP",
      kind: "promotion",
    });
    const rolled = await call(root, "tool_rollback", { tool: "crm", environment: "production" });
    expect(rolled.data.version).toBe("1.0.0");
    expect((await audit("production:1.0.0")).at(-1)).toMatchObject({
      via: "Forgeron MCP",
      kind: "rollback",
      // `/rollback` names the actor by email, as it does for the CLI.
      actor: "root@acme.test",
    });
    expect(
      (await call(root, "tool_update", { tool: "crm", version: "1.3.0", channel: "ghost" })).text,
    ).toMatch(/^404/);
  });
});

describe("no promotion between branches (D-125)", () => {
  it("has no promotion tool, and the workspace origin no promotion route", async () => {
    expect(TOOLS.map((t) => t.name)).not.toContain("tool_promote");
    expect(TOOLS.map((t) => t.name)).not.toContain("tool_promote_plan");
    for (const path of ["/promote", "/promote/plan"]) {
      const response = await gateway()(
        new Request(`https://acme.forgeron.app${path}`, {
          method: "POST",
          headers: {
            "content-type": "application/json",
            authorization: `Bearer ${await token(root)}`,
          },
          body: JSON.stringify({ tool: "crm", version: "1.1.0", to: "production" }),
        }),
      );
      expect([path, response.status === 200]).toEqual([path, false]);
    }
  });
});

describe("no secret value, token or credential goes through the MCP", () => {
  it("shows a secret's status and never its value, whatever the tool", async () => {
    const status = (await call(dev, "secrets_status", { tool: "hr" })).data;
    expect(status.secrets[0].name).toBe("HR_KEY");
    const seen: string[] = [];
    for (const person of [ana, dev, root]) {
      for (const [name, args] of [
        ["catalog_search", {}],
        ["catalog_get", { tool: "hr" }],
        ["tools_list", {}],
        ["tool_get", { tool: "hr" }],
        ["tool_versions", { tool: "hr" }],
        ["tool_changelog", { tool: "hr" }],
        ["secrets_status", { tool: "hr" }],
        ["resources_pending", {}],
        ["access_list", {}],
        ["access_list", { tool: "crm" }],
      ] as const) {
        seen.push((await call(person, name, args)).text);
      }
    }
    expect(seen.join("\n")).not.toContain(VALUE);
    expect(seen.join("\n")).not.toContain("fgt.");
    expect(seen.join("\n")).not.toContain("fgc.");
  });

  it("has no tool that takes a secret value, and refuses one passed anyway", async () => {
    for (const t of TOOLS) {
      const properties = Object.keys((t.input.toJSONSchema() as any).properties ?? {});
      for (const forbidden of ["value", "secret", "password", "token", "key"]) {
        expect(properties).not.toContain(forbidden);
      }
    }
    const answer = await call(root, "secrets_status", { tool: "hr", value: VALUE });
    expect(answer.error).toBe(true);
    expect(answer.text).not.toContain(VALUE);
  });

  it("blanks a field that looks like a secret in any answer, as a second lock", () => {
    expect(
      redacted({ a: [{ value: "x", token: "y", name: "n", nested: { clientSecret: "z" } }] }),
    ).toEqual({
      a: [
        {
          value: "[redacted]",
          token: "[redacted]",
          name: "n",
          nested: { clientSecret: "[redacted]" },
        },
      ],
    });
  });
});

describe("the protocol", () => {
  it("initializes, pings and answers a notification with 202", async () => {
    const bearer = await token(ana);
    const init = await rpc(bearer, "initialize", { protocolVersion: "2025-06-18" });
    expect(init.result.protocolVersion).toBe("2025-06-18");
    expect(init.result.capabilities).toEqual({ tools: { listChanged: false } });
    expect((await rpc(bearer, "ping")).result).toEqual({});
    const note = await post(bearer, { jsonrpc: "2.0", method: "notifications/initialized" });
    expect(note.status).toBe(202);
    expect((await rpc(bearer, "nope")).error?.code).toBe(-32601);
    expect((await rpc(bearer, "tools/call", { name: "nope" })).error?.code).toBe(-32602);
    const bad = (await (await post(bearer, "not a message")).json()) as {
      error: { code: number };
    };
    expect(bad.error.code).toBe(-32600);
  });

  it("is not the tools' own /t/<tool>/mcp, and the console never serves it", async () => {
    const response = await gateway()(
      new Request("https://acme.forgeron.app/mcp/extra", { headers: { accept: "text/html" } }),
    );
    expect(response.status).toBe(404);
  });
});

describe("installing a template takes two steps (D-092)", () => {
  const publishTemplate = async (name: string, version: string) => {
    const t =
      (await registry.findTool(TEMPLATE_WORKSPACE, name)) ??
      (await registry.createTool({ workspace: TEMPLATE_WORKSPACE, name }));
    const b = await registry.recordBuild(t.id, {
      fingerprint: `${name}-${version}`,
      manifest: { ...manifest, name, resources: { db: { why: "rows" } } },
      worker: `// ${name}`,
    });
    await registry.publishVersion(t.id, b.id, version);
  };
  const planOf = async (person: string, template: string) =>
    (await call(person, "tool_install_plan", { template })).data.plan as string;

  it("a plan creates nothing; the plan's identifier installs, once, and says what waits for approval", async () => {
    await publishTemplate("inventory", "0.4.0");
    expect((await call(root, "template_list")).data.templates).toEqual([
      { name: "inventory", version: "0.4.0", resources: ["resources.db"] },
    ]);
    const planned = await call(root, "tool_install_plan", { template: "inventory" });
    expect(planned.data).toMatchObject({
      template: "inventory",
      version: "0.4.0",
      resources: ["resources.db"],
    });
    expect(await registry.findTool("acme", "inventory")).toBeUndefined();

    const done = await call(root, "tool_install", { plan: planned.data.plan });
    // What the plan showed is approved by the install, and the tool is in production (D-121).
    expect(done.data).toEqual({
      tool: "inventory",
      version: "0.4.0",
      approvals: [{ resource: "resources.db", kind: "resource.added" }],
      production: true,
    });
    const installed = (await registry.findTool("acme", "inventory"))!;
    expect((await registry.listApprovals(installed.id)).map((a) => [a.resource, a.status])).toEqual(
      [["resources.db", "approved"]],
    );
    expect((await audit("inventory:0.4.0")).map((l) => [l.actor, l.via, l.kind])).toEqual([
      [root, "Forgeron MCP", "install"],
    ]);
    expect((await audit("install-plan:inventory")).map((l) => l.via)).toEqual(["Forgeron MCP"]);
    // The same plan, again: refused, and nothing more is created.
    const again = await call(root, "tool_install", { plan: planned.data.plan });
    expect(again.error).toBe(true);
    expect(again.text).toMatch(/409 PLAN_USED/);
  });

  it("refuses an unknown plan, and another administrator's plan, with the same words", async () => {
    await publishTemplate("stock", "1.0.0");
    const mine = await planOf(root, "stock");
    const foreign = await call(other, "tool_install", { plan: mine });
    const unknown = await call(other, "tool_install", { plan: "no-such-plan" });
    expect(foreign.error).toBe(true);
    expect(foreign.text).toBe(unknown.text);
    expect(await registry.findTool("acme", "stock")).toBeUndefined();
    // Neither spent it: its owner still installs.
    expect((await call(root, "tool_install", { plan: mine })).error).toBe(false);
  });

  it("refuses a plan whose template changed since it was shown", async () => {
    await publishTemplate("ledger", "1.0.0");
    const plan = await planOf(root, "ledger");
    await publishTemplate("ledger", "1.1.0");
    const refused = await call(root, "tool_install", { plan });
    expect(refused.error).toBe(true);
    expect(refused.text).toMatch(/PLAN_STALE/);
    expect(await registry.findTool("acme", "ledger")).toBeUndefined();
  });

  it("takes no value and no argument but the plan's identifier", async () => {
    const refused = await call(root, "tool_install", { plan: "x", template: "inventory" });
    expect(refused.error).toBe(true);
  });
});

describe("usage_report (D-093)", () => {
  it("is read only, for administrators, and reports counts by tool and by person", async () => {
    await registry.recordUsage("acme", "crm", ana);
    await registry.recordUsage("acme", "crm", dev);
    const tools = (await rpc(await token(root), "tools/list")).result.tools as any[];
    const tool = tools.find((t) => t.name === "usage_report");
    expect(tool.annotations.readOnlyHint).toBe(true);
    const day = now.toISOString().slice(0, 10);
    const report = (await call(root, "usage_report", { from: day, to: day })).data;
    expect(report.tools).toEqual([{ tool: "crm", calls: 2, people: 2 }]);
    expect(report.people.map((p: any) => p.email).sort()).toEqual([
      "ana@acme.test",
      "dev@acme.test",
    ]);
    expect(JSON.stringify(report)).not.toMatch(/token|secret|path/i);
    expect((await call(root, "usage_report", { from: "yesterday" })).error).toBe(true);
  });
});
