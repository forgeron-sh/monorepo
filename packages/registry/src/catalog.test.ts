import { applyMigrations, type Build, type D1Database, type Hosting } from "@forgeron/hosting";
import { createMemoryD1, type MemoryD1 } from "@forgeron/sdk/testing/d1";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createRegistry,
  deployBuild,
  docsProblem,
  findCard,
  listCatalog,
  migratePlatform,
  platformMigrations,
  type Registry,
  type Tool,
} from "./index";

vi.setConfig({ testTimeout: 60_000, hookTimeout: 60_000 });

let memory: MemoryD1;
let d1: D1Database;
let registry: Registry;
let tool: Tool;
beforeEach(async () => {
  memory = await createMemoryD1();
  d1 = memory as unknown as D1Database;
  await migratePlatform(d1);
  registry = createRegistry(d1);
  tool = await registry.createTool({ workspace: "acme", name: "crm" });
});
afterEach(() => memory.close());

const hex = async (bytes: Uint8Array) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", bytes))]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
const b64 = (bytes: Uint8Array) => Buffer.from(bytes).toString("base64");
const encode = (text: string) => new TextEncoder().encode(text);

const hosting: Hosting = {
  async provision(environment) {
    return { environment, bindings: [] };
  },
  async upload(provisioned, build) {
    return { provisioned, build };
  },
  async migrate() {
    return { applied: [] };
  },
  async activate() {
    return { url: "https://x.test" };
  },
  async teardown() {},
};

const baseManifest = {
  name: "crm",
  title: "CRM",
  description: "Companies and leads.",
  interfaces: { mcp: true, api: true, cli: false, web: false },
  profiles: {
    sales: { label: "Sales", grants: ["read", "write"] },
    viewer: { grants: ["read"] },
    nobody: { grants: [] },
  },
  actions: {
    "deals.list": { access: "read" },
    "deals.move": { access: "write" },
  },
  resources: {
    secrets: { HUBSPOT_KEY: { why: "Import" } },
    userSecrets: { ODOO_KEY: { label: "Odoo key", why: "Tickets" } },
    connectors: { microsoft: { type: "microsoft-365", mode: "delegated", scopes: [], why: "x" } },
  },
};

const PNG = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 1, 2, 3, 4]);
const SVG = encode('<svg xmlns="http://www.w3.org/2000/svg"><rect width="1" height="1"/></svg>');

async function withDocs(
  readme: string | undefined,
  assets: Array<{ path: string; type: string; bytes: Uint8Array }>,
  fingerprint = "fp1",
  manifest: Record<string, unknown> = {},
): Promise<Build> {
  const entries = await Promise.all(
    assets.map(async (a) => ({
      path: a.path,
      type: a.type,
      size: a.bytes.length,
      hash: await hex(a.bytes),
      base64: b64(a.bytes),
    })),
  );
  return {
    manifest: {
      ...baseManifest,
      icon: assets.find((a) => a.path.endsWith(".svg"))?.path,
      docs: {
        ...(readme === undefined
          ? {}
          : { readme: { size: encode(readme).length, hash: await hex(encode(readme)) } }),
        assets: entries.map((a) => ({ path: a.path, type: a.type, size: a.size, hash: a.hash })),
      },
      ...manifest,
    } as unknown as Build["manifest"],
    worker: "export default {}",
    fingerprint,
    changelog: {
      entries: [{ type: "added", summary: "First" }],
      declared: "minor",
      detected: "minor",
    },
    docs: { ...(readme === undefined ? {} : { readme }), assets: entries },
  };
}

const NO_RESOURCES = { resources: {} };

const publish = (
  build: Build,
  version: string,
  environment: "production" | "preview" = "preview",
) =>
  deployBuild(registry, hosting, {
    tool,
    environment,
    ...(environment === "preview" ? { branch: "feat" } : {}),
    build,
    version,
    actor: "ci",
  });

describe("the documentation of a version", () => {
  it("stores the README and the images with the version, and reads them back", async () => {
    const build = await withDocs("# CRM\n![a](docs/a.png)", [
      { path: "docs/a.png", type: "image/png", bytes: PNG },
      { path: "docs/icon.svg", type: "image/svg+xml", bytes: SVG },
    ]);
    const { version } = await publish(build, "1.0.0");
    const record = (await registry.getVersion(version.id))!;
    expect(await registry.readmeOf(tool.id, record.buildId)).toBe("# CRM\n![a](docs/a.png)");
    const asset = await registry.assetOf(tool.id, record.buildId, "docs/a.png");
    expect([...asset!.bytes]).toEqual([...PNG]);
    expect(asset!.type).toBe("image/png");
    // The README is not an asset.
    expect(await registry.assetOf(tool.id, record.buildId, "README.md")).toBeUndefined();
    expect(await registry.assetOf(tool.id, record.buildId, "docs/none.png")).toBeUndefined();
  });

  it("chunks a large file and stores an unchanged one once", async () => {
    const big = new Uint8Array(150_000).map((_, i) => (i * 7) % 251);
    const first = await withDocs("# 1", [{ path: "docs/big.png", type: "image/png", bytes: big }]);
    const one = await publish(first, "1.0.0");
    const parts = (await d1.prepare(`SELECT COUNT(*) AS n FROM "docs_blobs"`).all())
      .results as Array<{
      n: number;
    }>;
    expect(parts[0]!.n).toBeGreaterThan(10);

    const second = await withDocs(
      "# 2",
      [{ path: "docs/big.png", type: "image/png", bytes: big }],
      "fp2",
    );
    const two = await publish(second, "1.1.0");
    const after = (await d1.prepare(`SELECT COUNT(*) AS n FROM "docs_blobs"`).all())
      .results as Array<{
      n: number;
    }>;
    // The image is shared; only the new README was added.
    expect(after[0]!.n).toBe(parts[0]!.n + 1);
    const asset = await registry.assetOf(tool.id, two.version.buildId, "docs/big.png");
    expect(asset!.bytes.length).toBe(big.length);
    expect(await registry.readmeOf(tool.id, one.version.buildId)).toBe("# 1");
    expect(await registry.readmeOf(tool.id, two.version.buildId)).toBe("# 2");
  });

  it("refuses what the manifest does not list, or what is not what it says", async () => {
    const good = await withDocs("# x", [{ path: "docs/a.png", type: "image/png", bytes: PNG }]);
    expect(await docsProblem(good.manifest, good.docs)).toBeUndefined();

    const problem = async (change: (b: Build) => void) => {
      const build = structuredClone(good);
      change(build);
      return docsProblem(build.manifest, build.docs);
    };
    expect(await problem((b) => (b.docs!.assets[0]!.path = "../a.png"))).toMatch(
      /not a path inside/,
    );
    expect(await problem((b) => (b.docs!.assets[0]!.path = "/etc/a.png"))).toMatch(
      /not a path inside/,
    );
    expect(await problem((b) => (b.docs!.readme = "# changed"))).toMatch(/README is not the one/);
    expect(await problem((b) => (b.docs!.assets[0]!.base64 = b64(encode("other"))))).toMatch(
      /size does not match|hash does not match/,
    );
    expect(await problem((b) => (b.docs!.assets[0]!.type = "text/html"))).toMatch(
      /allowed image type/,
    );
    expect(await problem((b) => (b.manifest.docs = undefined))).toMatch(/lists no documentation/);
    expect(await problem((b) => (b.docs!.assets = []))).toMatch(/was not sent/);
  });

  it("refuses an SVG with a script, even when its hash is right", async () => {
    const evil = encode('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
    const build = await withDocs("# x", [
      { path: "docs/e.svg", type: "image/svg+xml", bytes: evil },
    ]);
    await expect(publish(build, "1.0.0")).rejects.toMatchObject({ code: "INVALID_DOCS" });
    expect(await registry.listVersions(tool.id)).toEqual([]);
  });

  it("is added by migration 0021 to a platform that predates it, keeping what it holds", async () => {
    const other = await createMemoryD1();
    try {
      const old = other as unknown as D1Database;
      const before = platformMigrations.findIndex((m) => m.name === "0021_tool_docs");
      expect(before).toBeGreaterThan(0);
      await applyMigrations(old, platformMigrations.slice(0, before));
      await old.batch([
        old.prepare(`INSERT INTO "tools" VALUES ('t1', 'acme', 'crm', '2026-11-03T12:00:00.000Z')`),
      ]);
      await migratePlatform(old);
      const tools = (await old.prepare(`SELECT "name" FROM "tools"`).all()).results;
      expect(tools).toEqual([{ name: "crm" }]);
      await old.prepare(`SELECT * FROM "build_docs"`).all();
    } finally {
      other.close();
    }
  });
});

describe("the catalog", () => {
  beforeEach(async () => {
    await registry.createTeam("acme", { id: "support", name: "Support" }, "ely", ["*"]);
  });
  const ADMIN = { subjects: ["everyone", "team:admin"] };
  const EVERYONE = { subjects: ["everyone"] };

  it("lists a tool with what the person may do, and the teams to ask for when nothing", async () => {
    await publish(
      await withDocs(
        "# CRM",
        [{ path: "docs/icon.svg", type: "image/svg+xml", bytes: SVG }],
        "fp1",
        NO_RESOURCES,
      ),
      "1.0.0",
      "production",
    );

    // A new tool gives the admin team every permission (D-127, D-137).
    const admin = await listCatalog(registry, "acme", ADMIN);
    expect(admin).toHaveLength(1);
    expect(admin[0]).toMatchObject({
      name: "crm",
      title: "CRM",
      summary: "Companies and leads.",
      productionVersion: "1.0.0",
      interfaces: { mcp: true, api: true, cli: false, web: false },
      access: "granted",
    });
    expect(admin[0]!.icon).toMatch(
      /^\/console-api\/api\/catalog\/crm\/assets\/docs\/icon\.svg\?v=[0-9a-f]{64}$/,
    );

    // Everyone: the tool is still there, with the teams that open it. `everyone` has the default
    // profile, the one with the fewest permissions here (`nobody`): it opens nothing.
    const nobody = await listCatalog(registry, "acme", EVERYONE);
    expect(nobody[0]).toMatchObject({ name: "crm", access: "requestable" });
    expect(nobody[0]!.subjects).toEqual([
      { subject: "team:admin", name: "Admins", label: "Admins (all permissions)" },
    ]);
    // A tool's profile name is not a team: a subject that is no team gives nothing.
    expect(
      (await listCatalog(registry, "acme", { subjects: ["everyone", "team:viewer"] }))[0]!.access,
    ).toBe("requestable");
    await registry.setAccessGrants(
      tool.id,
      [
        { subject: "team:support", grant: { kind: "profile", profile: "sales" } },
        { subject: "everyone", grant: { kind: "profile", profile: "viewer" } },
      ],
      "ely",
    );
    // Everyone first, then the teams by name.
    expect((await listCatalog(registry, "acme", EVERYONE))[0]!.subjects).toEqual([
      { subject: "everyone", name: "Everyone", label: "Everyone (viewer)" },
      { subject: "team:admin", name: "Admins", label: "Admins (all permissions)" },
      { subject: "team:support", name: "Support", label: "Support (Sales)" },
    ]);
  });

  it("follows the grants and the exceptions: either can open or close a subject", async () => {
    await publish(await withDocs(undefined, []), "1.0.0");
    await registry.setAccessException(tool.id, "everyone", "deals.list", true, "ely");
    expect((await listCatalog(registry, "acme", EVERYONE))[0]!.access).toBe("granted");
    await registry.setAccessGrants(
      tool.id,
      [{ subject: "team:support", grant: { kind: "profile", profile: "viewer" } }],
      "ely",
    );
    const support = { subjects: ["team:support"] };
    expect((await listCatalog(registry, "acme", support))[0]!.access).toBe("granted");
    await registry.setAccessException(tool.id, "team:support", "deals.list", false, "ely");
    expect((await listCatalog(registry, "acme", support))[0]!.access).toBe("requestable");
  });

  it("gives the admin team what its grant says, as the runtime does (D-127)", async () => {
    await publish(await withDocs(undefined, []), "1.0.0");
    expect((await listCatalog(registry, "acme", ADMIN))[0]!.access).toBe("granted");
    // Someone may take the access away from `team:admin`: the card and the runtime then agree.
    await registry.setAccessGrants(
      tool.id,
      [{ subject: "team:admin", grant: { kind: "none" } }],
      "ely",
    );
    const admin = (await listCatalog(registry, "acme", ADMIN))[0]!;
    expect(admin.access).toBe("requestable");
    expect(admin.subjects).toEqual([]);
  });

  it("does not list a tool without a version, nor one of another workspace", async () => {
    await registry.createTool({ workspace: "acme", name: "empty" });
    const other = await registry.createTool({ workspace: "other", name: "secret" });
    await deployBuild(registry, hosting, {
      tool: other,
      environment: "preview",
      branch: "feat",
      build: await withDocs(undefined, []),
      version: "1.0.0",
      actor: "ci",
    });
    expect(await listCatalog(registry, "acme", ADMIN)).toEqual([]);
  });

  it("shows a tool that only has a preview, without a production version", async () => {
    await publish(await withDocs("# p", []), "1.0.0-preview.feat+abc", "preview");
    expect(
      (await listCatalog(registry, "acme", { subjects: [] }))[0]!.productionVersion,
    ).toBeNull();
  });

  it("answers the card: README, images, connection, requirements, access and release", async () => {
    await publish(
      await withDocs(
        "# CRM\n![a](docs/a.png)",
        [{ path: "docs/a.png", type: "image/png", bytes: PNG }],
        "fp1",
      ),
      "1.0.0",
    );
    await registry.setAccessGrants(
      tool.id,
      [{ subject: "everyone", grant: { kind: "profile", profile: "viewer" } }],
      "ely",
    );
    const card = (await findCard(registry, "acme", "crm", EVERYONE, "https://acme.forgeron.app"))!;
    expect(card.readme).toBe("# CRM\n![a](docs/a.png)");
    expect(card.assets).toEqual([
      expect.objectContaining({ path: "docs/a.png", type: "image/png", size: PNG.length }),
    ]);
    expect(card.connect).toEqual({
      mcp: { url: "https://acme.forgeron.app/t/crm/mcp" },
      api: { baseUrl: "https://acme.forgeron.app/t/crm/api" },
      cli: null,
    });
    expect(card.requiredSecrets).toEqual([{ name: "HUBSPOT_KEY", why: "Import" }]);
    expect(card.requiredUserSecrets).toEqual([
      { name: "ODOO_KEY", label: "Odoo key", why: "Tickets" },
    ]);
    expect(card.connectors).toEqual([
      { name: "microsoft", type: "microsoft-365", mode: "delegated" },
    ]);
    expect(card.yourAccess).toEqual([
      { action: "deals.list", allowed: true },
      { action: "deals.move", allowed: false },
    ]);
    expect(card.lastRelease).toMatchObject({ version: "1.0.0" });
    expect(card.lastRelease!.changelog).toHaveLength(1);
    expect(
      await findCard(registry, "acme", "missing", { subjects: [] }, "https://x"),
    ).toBeUndefined();
  });

  it("has a card without README for a tool that has none", async () => {
    await publish(await withDocs(undefined, []), "1.0.0");
    const card = (await findCard(registry, "acme", "crm", { subjects: [] }, "https://x"))!;
    expect(card.readme).toBeNull();
    expect(card.guide).toBeNull();
    expect(card.assets).toEqual([]);
  });

  it("serves the guide apart from the README, and the summary before the description (D-115)", async () => {
    const guide = "# Use the CRM\n![a](docs/a.png)";
    const build = await withDocs("# CRM, technical", [
      { path: "docs/a.png", type: "image/png", bytes: PNG },
    ]);
    build.docs!.guide = guide;
    build.manifest.docs!.guide = { size: encode(guide).length, hash: await hex(encode(guide)) };
    build.manifest.summary = "Your companies and leads, from Claude.";
    expect(await docsProblem(build.manifest, build.docs)).toBeUndefined();
    await publish(build, "1.0.0");
    const card = (await findCard(registry, "acme", "crm", { subjects: [] }, "https://x"))!;
    expect(card.readme).toBe("# CRM, technical");
    expect(card.guide).toBe(guide);
    expect(card.summary).toBe("Your companies and leads, from Claude.");
    // Neither markdown file is an image of the card.
    expect(card.assets.map((a) => a.path)).toEqual(["docs/a.png"]);

    const tampered = structuredClone(build);
    tampered.docs!.guide = "# changed";
    expect(await docsProblem(tampered.manifest, tampered.docs)).toMatch(/guide is not the one/);
    delete tampered.docs!.guide;
    expect(await docsProblem(tampered.manifest, tampered.docs)).toMatch(/guide that was not sent/);
  });
});
