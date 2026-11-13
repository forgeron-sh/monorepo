import type { Build, D1Database, Hosting } from "@forgeron/hosting";
import {
  createRegistry,
  marketplaceSource,
  migratePlatform,
  type Registry,
} from "@forgeron/registry";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { handleDeploy } from "../deploy/deploy";
import { ADMIN, describeRouteMatrix } from "./route-matrix";
import { platformCaller } from "./test-app";
import type { ConsolePerson } from "./app";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

const SECRET = "test-secret-not-a-real-one";
const SOURCE = marketplaceSource("m1");

/** A host that deploys nothing and says what it was asked. */
function fakeHosting(): Hosting {
  return {
    async provision(environment) {
      return { environment, bindings: [] };
    },
    async upload(provisioned, build) {
      return { provisioned, build };
    },
    async migrate() {
      return { applied: [] };
    },
    async activate({ provisioned }) {
      return { url: `https://${provisioned.environment.name}.test` };
    },
    async teardown() {},
  };
}

let memory: MemoryD1;
let registry: Registry;
let person: ConsolePerson | undefined;
let call: (request: Request) => Promise<Response | undefined>;
const hosting = fakeHosting();

beforeAll(async () => {
  memory = await createMemoryD1();
  const d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  call = platformCaller({
    registry,
    who: () => person,
    hosting: () => hosting,
    tokenSecret: SECRET,
  });
});
afterAll(() => memory.close());

const as = async (request: Request, who: ConsolePerson | undefined) => {
  person = who;
  return (await call(request))!;
};
const url = (path: string) => `https://acme.forgeron.test${path}`;
const send = (method: string, path: string, body: unknown) =>
  as(
    new Request(url(path), {
      method,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    }),
    ADMIN,
  );
const read = (path: string) => as(new Request(url(path)), ADMIN);

describeRouteMatrix({
  title: "GET a tool's source",
  access: "tools:read",
  call: as,
  method: "GET",
  path: "/api/tools/x/source",
});
describeRouteMatrix({
  title: "PUT a tool's source",
  access: "tools:write",
  call: as,
  method: "PUT",
  path: "/api/tools/x/source",
  valid: { autoUpdate: true },
  invalid: [{ autoUpdate: "yes" }, { productionBranch: "" }],
});
describeRouteMatrix({
  title: "POST a tool's update",
  access: "tools:write",
  call: as,
  method: "POST",
  path: "/api/tools/x/update",
  valid: { version: "1.0.0" },
  invalid: [{}, { version: "" }, { version: "1.0.0", approve: "yes" }],
});
describeRouteMatrix({
  title: "POST a permanent channel",
  access: "tools:write",
  call: as,
  method: "POST",
  path: "/api/tools/x/channels",
  valid: { name: "staging", follows: "staging" },
  invalid: [{}, { name: "Staging" }, { name: "x".repeat(31) }, { name: "ok", autoUpdate: "yes" }],
});
describeRouteMatrix({
  title: "PUT a permanent channel",
  access: "tools:write",
  call: as,
  method: "PUT",
  path: "/api/tools/x/channels/staging",
  valid: { autoUpdate: true },
  invalid: [{ autoUpdate: "yes" }, { follows: "" }],
});
describeRouteMatrix({
  title: "DELETE a permanent channel",
  access: "tools:write",
  call: as,
  method: "DELETE",
  path: "/api/tools/x/channels/staging",
  valid: { confirm: "staging" },
  invalid: [{}],
});
describeRouteMatrix({
  title: "POST a tool from a repository",
  access: "tools:write",
  call: as,
  method: "POST",
  path: "/api/tools/from-repository",
  valid: { name: "matrix", repo: "acme/matrix" },
  invalid: [{}, { name: "Bad Name", repo: "acme/x" }, { name: "ok", repo: "not a repo" }],
});

/** What a marketplace sync records for one release. */
async function offer(version: string, resources: object) {
  const tool =
    (await registry.findTool(SOURCE, "odoo")) ??
    (await registry.createTool({ workspace: SOURCE, name: "odoo" }));
  const build = await registry.recordBuild(tool.id, {
    fingerprint: `odoo-${version}`,
    manifest: { name: "odoo", profiles: {}, actions: {}, resources },
    worker: `// odoo ${version}`,
    changelog: {
      entries: [{ description: `Odoo ${version}` }],
      declared: "minor",
      detected: "minor",
    },
  });
  await registry.publishVersion(tool.id, build.id, version);
}

describe("a marketplace tool's update (D-121)", () => {
  it("shows what the newer release asks for, and puts it in production approved in the same step", async () => {
    await offer("1.0.0", { network: { allow: ["*.odoo.com"], why: "Odoo" } });
    await registry.installTemplate({
      workspace: "acme",
      template: "odoo",
      source: SOURCE,
      actor: "p",
    });
    // Installed without going to production (as by the registry alone): the update is that version.
    let source = await (await read("/api/tools/odoo/source")).json();
    expect(source).toMatchObject({
      kind: "marketplace",
      marketplace: "m1",
      production: null,
      update: { version: "1.0.0", approvals: ["resources.network"] },
    });
    expect((await send("POST", "/api/tools/odoo/update", { version: "1.0.0" })).status).toBe(409);
    const first = await send("POST", "/api/tools/odoo/update", { version: "1.0.0", approve: true });
    expect(first.status).toBe(200);
    expect(await first.json()).toEqual({ tool: "odoo", channel: "production", version: "1.0.0" });

    await offer("1.1.0", {
      network: { allow: ["*.odoo.com"], why: "Odoo" },
      secrets: { ODOO_KEY: { why: "API" } },
    });
    source = await (await read("/api/tools/odoo/source")).json();
    expect(source).toMatchObject({
      production: "1.0.0",
      update: {
        version: "1.1.0",
        changelog: ["Odoo 1.1.0"],
        approvals: ["resources.secrets.ODOO_KEY"],
      },
    });
    // The admin read 1.0.0; the update is 1.1.0 now.
    const stale = await send("POST", "/api/tools/odoo/update", { version: "1.0.1", approve: true });
    expect(stale.status).toBe(409);
    expect(await stale.json()).toMatchObject({ error: "STALE" });
    const waits = await send("POST", "/api/tools/odoo/update", { version: "1.1.0" });
    expect(waits.status).toBe(409);
    expect(await waits.json()).toMatchObject({ error: "PENDING_APPROVAL" });
    expect(
      (await send("POST", "/api/tools/odoo/update", { version: "1.1.0", approve: true })).status,
    ).toBe(200);
    source = await (await read("/api/tools/odoo/source")).json();
    expect(source).toMatchObject({ production: "1.1.0", update: null });
    expect((await send("POST", "/api/tools/odoo/update", { version: "1.1.0" })).status).toBe(404);

    // Another permanent channel of a marketplace tool follows the marketplace's releases (D-125).
    const added = await send("POST", "/api/tools/odoo/channels", { name: "recette" });
    expect(added.status).toBe(201);
    expect(await added.json()).toMatchObject({
      name: "recette",
      serves: null,
      address: "https://acme.forgeron.test/t/odoo~recette/",
      update: { version: "1.1.0" },
    });
    const updated = await send("POST", "/api/tools/odoo/update", {
      version: "1.1.0",
      channel: "recette",
    });
    expect(await updated.json()).toEqual({ tool: "odoo", channel: "recette", version: "1.1.0" });
  });
});

type Deployed = {
  production?: { version?: string; waiting?: string };
  channels?: Array<{ channel: string; version?: string; waiting?: string }>;
};
const deployRequest = (token: string, branch: string, fingerprint: string, released: boolean) =>
  new Request("https://acme.forgeron.test/deploy", {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
    body: JSON.stringify({
      branch,
      version: `1.0.0-preview.${branch}+${fingerprint}`,
      build: {
        manifest: { name: "crm", profiles: {}, actions: {}, resources: {} },
        worker: `// ${fingerprint}`,
        fingerprint,
        changelog: released
          ? {
              entries: [{ description: "A change" }],
              declared: "patch",
              detected: "patch",
              released: true,
            }
          : { entries: [], declared: "none", detected: "none", released: false },
      } as unknown as Build,
    }),
  });

describe("a repository tool's channels (D-121, D-125)", () => {
  it("is added with its token; each permanent channel takes only the releases of its branch", async () => {
    const added = await send("POST", "/api/tools/from-repository", {
      name: "crm",
      repo: "acme/crm",
    });
    expect(added.status).toBe(201);
    const { token, productionBranch } = (await added.json()) as {
      token: string;
      productionBranch: string;
    };
    expect(productionBranch).toBe("main");
    expect(
      (await send("POST", "/api/tools/from-repository", { name: "crm", repo: "acme/crm" })).status,
    ).toBe(409);
    const tool = (await registry.findTool("acme", "crm"))!;
    expect(await registry.availabilityOf(tool.id)).toMatchObject({ mode: "nobody" });

    const deploy = (branch: string, fp: string, released: boolean) =>
      handleDeploy(deployRequest(token, branch, fp, released), {
        workspace: "acme",
        secret: SECRET,
        now: () => new Date(),
        registry,
        hosting,
      }).then((r) => r.json() as Promise<Deployed>);
    // A release on a feature branch is that branch's: production does not follow it.
    expect((await deploy("feat", "aaa", true)).production).toBeUndefined();
    let source = await (await read("/api/tools/crm/source")).json();
    expect(source).toMatchObject({ kind: "repo", repo: "acme/crm", update: null });

    // A build of `main` that is not a release reaches no permanent channel.
    expect((await deploy("main", "bbb", false)).production).toBeUndefined();
    source = await (await read("/api/tools/crm/source")).json();
    expect(source).toMatchObject({ update: null });
    expect(
      (await send("POST", "/api/tools/crm/update", { version: "1.0.0-preview.main+bbb" })).status,
    ).toBe(404);

    // A release of `main` waits for the admin's Update, with its plan.
    await deploy("main", "ccc", true);
    source = await (await read("/api/tools/crm/source")).json();
    expect(source).toMatchObject({
      update: { version: "1.0.0-preview.main+ccc", branch: "main", plan: { ok: true } },
      channels: [{ name: "production", follows: "main", serves: null }],
    });
    expect(
      (await send("POST", "/api/tools/crm/update", { version: "1.0.0-preview.main+ccc" })).status,
    ).toBe(200);

    // A staging channel follows `staging`, updates by itself, and has its own address.
    const staging = await send("POST", "/api/tools/crm/channels", {
      name: "staging",
      follows: "staging",
      autoUpdate: true,
    });
    expect(staging.status).toBe(201);
    expect(await staging.json()).toMatchObject({
      name: "staging",
      follows: "staging",
      autoUpdate: true,
      serves: null,
      address: "https://acme.forgeron.test/t/crm~staging/",
      update: null,
    });
    expect(
      (await send("POST", "/api/tools/crm/channels", { name: "staging", follows: "x" })).status,
    ).toBe(409);
    expect((await send("POST", "/api/tools/crm/channels", { name: "qa" })).status).toBe(400);
    expect(await deploy("staging", "ddd", true)).toMatchObject({
      channels: [{ channel: "staging", version: "1.0.0-preview.staging+ddd" }],
    });
    expect((await deploy("staging", "eee", false)).channels).toBeUndefined();

    // Production updates by itself now: a release on `main` goes; staging is not touched.
    expect(
      (await send("PUT", "/api/tools/crm/channels/production", { autoUpdate: true })).status,
    ).toBe(200);
    expect((await deploy("main", "fff", true)).production).toEqual({
      version: "1.0.0-preview.main+fff",
    });
    source = await (await read("/api/tools/crm/source")).json();
    expect(source).toMatchObject({
      autoUpdate: true,
      production: "1.0.0-preview.main+fff",
      channels: [
        { name: "production", serves: "1.0.0-preview.main+fff", update: null },
        { name: "staging", serves: "1.0.0-preview.staging+ddd", update: null },
      ],
    });

    // A channel is removed, typed to confirm; production never is.
    expect(
      (await send("DELETE", "/api/tools/crm/channels/staging", { confirm: "nope" })).status,
    ).toBe(400);
    expect(
      (await send("DELETE", "/api/tools/crm/channels/production", { confirm: "production" }))
        .status,
    ).toBe(400);
    expect(
      (await send("DELETE", "/api/tools/crm/channels/staging", { confirm: "staging" })).status,
    ).toBe(200);
    expect(await registry.findChannel(tool.id, "staging")).toBeUndefined();
  });
});

describeRouteMatrix({
  title: "POST a branch's data",
  access: "tools:data",
  call: as,
  method: "POST",
  path: "/api/tools/x/branches/b/data",
  valid: { from: "a", confirm: "x" },
  invalid: [{}, { from: "", confirm: "x" }, { from: "a" }],
});

describe("copying a branch's data (D-121)", () => {
  it("copies between two branches, confirmed, and never touches production", async () => {
    const dbs = new Map<string, MemoryD1>();
    const dbOf = async (branch: string) => {
      if (!dbs.has(branch)) {
        const m = await createMemoryD1();
        const d1 = m as unknown as D1Database;
        await d1.batch([
          d1.prepare(`CREATE TABLE "_forgeron_migrations" ("name" TEXT PRIMARY KEY)`),
          d1.prepare(`CREATE TABLE "notes" ("id" INTEGER PRIMARY KEY, "text" TEXT)`),
        ]);
        dbs.set(branch, m);
      }
      return dbs.get(branch)! as unknown as D1Database;
    };
    const withDatabases: Hosting = { ...fakeHosting(), openDatabase: (e) => dbOf(e.branch ?? "") };
    const caller = platformCaller({ registry, who: () => ADMIN, hosting: () => withDatabases });
    const tool = await registry.createTool({ workspace: "acme", name: "notes" });
    const build = await registry.recordBuild(tool.id, {
      fingerprint: "n1",
      manifest: { name: "notes", profiles: {}, actions: {}, resources: {} },
      worker: "//",
    });
    const version = await registry.publishVersion(tool.id, build.id, "1.0.0");
    for (const b of ["a", "b"]) {
      const env = await registry.ensureEnvironment(tool.id, "preview", b);
      await registry.activate(env.id, version.id, { actor: "t" });
    }
    await (await dbOf("a")).prepare(`INSERT INTO "notes" VALUES (1, 'from a')`).all();
    const copy = (branch: string, body: unknown) =>
      caller(
        new Request(url(`/api/tools/notes/branches/${branch}/data`), {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(body),
        }),
      ).then((r) => r!);

    expect((await copy("b", { from: "a", confirm: "nope" })).status).toBe(400);
    expect((await copy("b", { from: "production", confirm: "notes" })).status).toBe(404);
    const done = await copy("b", { from: "a", confirm: "notes" });
    expect(done.status).toBe(200);
    expect(await done.json()).toEqual({ tables: [{ name: "notes", rows: 1 }] });
    expect((await (await dbOf("b")).prepare(`SELECT "text" FROM "notes"`).all()).results).toEqual([
      { text: "from a" },
    ]);
    expect((await registry.listAudit(tool.id)).some((l) => l.subject === "data:a->b")).toBe(true);
    for (const m of dbs.values()) m.close();
  });
});
