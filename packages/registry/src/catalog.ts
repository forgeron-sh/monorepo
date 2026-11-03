// The catalog of a workspace (docs/console-ux.md, "Catalog API", D-056): every tool that has a version,
// with whether the person may call it. A tool nobody may use is listed too: the card says which role
// to ask an admin for. The version shown is the one production serves, else the latest published.
import {
  mayAccess,
  type CatalogAsset,
  type CatalogTool,
  type Manifest,
  type ToolCard,
} from "@forgeron/manifest";
import type { BuildRecord, DocFile, Registry, Tool, VersionRecord } from "./registry";

export interface CatalogCaller {
  /** The person's roles in the workspace. */
  roles: readonly string[];
}

/** Where the console API serves an image: the hash makes the answer immutable. */
export const assetUrl = (tool: string, path: string, hash: string): string =>
  `/console-api/api/catalog/${tool}/assets/${path.split("/").map(encodeURIComponent).join("/")}?v=${hash}`;

interface Shown {
  tool: Tool;
  version: VersionRecord;
  build: BuildRecord;
  manifest: Manifest;
  production: string | null;
}

async function shown(registry: Registry, tool: Tool): Promise<Shown | undefined> {
  const versions = await registry.listVersions(tool.id);
  if (versions.length === 0) return undefined;
  const production = (await registry.listEnvironments(tool.id)).find(
    (e) => e.name === "production" && e.versionId,
  );
  const served = production ? versions.find((v) => v.id === production.versionId) : undefined;
  const version = served ?? versions.at(-1)!;
  const build = await registry.getBuild(version.buildId);
  if (!build) return undefined;
  return {
    tool,
    version,
    build,
    manifest: build.manifest as Manifest,
    production: served?.version ?? null,
  };
}

async function describe(
  registry: Registry,
  s: Shown,
  caller: CatalogCaller,
  files: readonly DocFile[],
): Promise<{ entry: CatalogTool; allowed: Map<string, boolean> }> {
  const { manifest } = s;
  const roles = manifest.roles ?? {};
  const who = { roles: caller.roles, access: await registry.roleAccess(s.tool.id) };
  const actions = Object.entries(manifest.actions ?? {});
  const allowed = new Map(
    actions.map(([name, a]) => [name, mayAccess(who, roles, name, a.access)]),
  );
  // The roles worth asking for: those that may call something once the admin's matrix is applied.
  const asking = Object.entries(roles)
    .filter(([role]) =>
      actions.some(([name, a]) =>
        mayAccess({ roles: [role], access: who.access }, roles, name, a.access),
      ),
    )
    .map(([name, role]) => ({ name, label: role.label ?? name }));
  const icon = manifest.icon ? files.find((f) => f.path === manifest.icon) : undefined;
  return {
    allowed,
    entry: {
      name: s.tool.name,
      title: manifest.title ?? s.tool.name,
      summary: manifest.description ?? "",
      icon: icon ? assetUrl(s.tool.name, icon.path, icon.hash) : null,
      productionVersion: s.production,
      interfaces: { ...manifest.interfaces },
      access: [...allowed.values()].some(Boolean) ? "granted" : "requestable",
      roles: asking,
    },
  };
}

/** The tools of the workspace with what this person may do, sorted by name. */
export async function listCatalog(
  registry: Registry,
  workspace: string,
  caller: CatalogCaller,
): Promise<CatalogTool[]> {
  const tools: CatalogTool[] = [];
  for (const tool of await registry.listTools(workspace)) {
    const s = await shown(registry, tool);
    if (!s) continue;
    const files = await registry.docsOf(s.build.id);
    tools.push((await describe(registry, s, caller, files)).entry);
  }
  return tools.sort((a, b) => a.name.localeCompare(b.name));
}

/** The card of one tool, or `undefined` for a tool with no version (or none of that name). */
export async function findCard(
  registry: Registry,
  workspace: string,
  name: string,
  caller: CatalogCaller,
  origin: string,
): Promise<ToolCard | undefined> {
  const tool = await registry.findTool(workspace, name);
  if (!tool) return undefined;
  const s = await shown(registry, tool);
  if (!s) return undefined;
  const files = await registry.docsOf(s.build.id);
  const { entry, allowed } = await describe(registry, s, caller, files);
  const { manifest } = s;
  const assets: CatalogAsset[] = files
    .filter((f) => f.type !== "text/markdown")
    .map((f) => ({
      path: f.path,
      type: f.type as CatalogAsset["type"],
      size: f.size,
      url: assetUrl(tool.name, f.path, f.hash),
    }));
  const exposed = manifest.interfaces;
  const changelog = (s.build.changelog as { entries?: unknown[] } | null | undefined)?.entries;
  return {
    ...entry,
    readme: (await registry.readmeOf(tool.id, s.build.id)) ?? null,
    assets,
    connect: {
      mcp: exposed.mcp ? { url: `${origin}/t/${tool.name}/mcp` } : null,
      api: exposed.api ? { baseUrl: `${origin}/t/${tool.name}/api` } : null,
      cli: exposed.cli ? { command: `forgeron ${tool.name} --help` } : null,
    },
    requiredSecrets: Object.entries(manifest.resources?.secrets ?? {}).map(([n, v]) => ({
      name: n,
      why: v.why ?? null,
    })),
    requiredUserSecrets: Object.entries(manifest.resources?.userSecrets ?? {}).map(([n, v]) => ({
      name: n,
      label: v.label,
      why: v.why,
    })),
    connectors: Object.entries(manifest.resources?.connectors ?? {}).map(([n, c]) => ({
      name: n,
      type: c.type,
      mode: c.mode,
    })),
    yourAccess: [...allowed].map(([action, ok]) => ({ action, allowed: ok })),
    lastRelease: {
      version: s.version.version,
      date: s.version.createdAt,
      changelog: Array.isArray(changelog) ? changelog : [],
    },
  };
}
