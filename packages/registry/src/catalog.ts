// The catalog of a workspace (docs/console-ux.md, "Catalog API", D-061): every tool that has a version,
// with whether the person may call it. A tool nobody may use is listed too: the card says which
// teams open it (D-127, D-136). The version shown is the one production serves, else the latest published; for
// a branch (D-120), the one its preview serves.
import { EVERYONE } from "@forgeron/permissions";
import {
  mayAccess,
  resolveAccess,
  type CatalogAsset,
  type CatalogTool,
  type Manifest,
  type ToolCard,
} from "@forgeron/manifest";
import { channelRef, isPermanentRef } from "./channels";
import type { BuildRecord, DocFile, Registry, Tool, VersionRecord } from "./registry";

export interface CatalogCaller {
  /** The person's subjects (`subjectsOf(teams)` of `@forgeron/permissions`): `everyone` and `team:<id>`. */
  subjects: readonly string[];
}

/** Where the console API serves an image: the hash makes the answer immutable. */
export const assetUrl = (tool: string, path: string, hash: string, branch?: string): string =>
  `/console-api/api/catalog/${tool}/assets/${path.split("/").map(encodeURIComponent).join("/")}?v=${hash}${branch ? `&branch=${encodeURIComponent(branch)}` : ""}`;

interface Shown {
  tool: Tool;
  version: VersionRecord;
  build: BuildRecord;
  manifest: Manifest;
  production: string | null;
}

async function shown(registry: Registry, tool: Tool, branch?: string): Promise<Shown | undefined> {
  const versions = await registry.listVersions(tool.id);
  if (versions.length === 0) return undefined;
  const environment = (await registry.listEnvironments(tool.id)).find((e) =>
    branch === undefined
      ? e.name === "production" && e.versionId
      : e.name !== "production" && channelRef(e) === branch && e.versionId,
  );
  const served = environment ? versions.find((v) => v.id === environment.versionId) : undefined;
  // A branch shows what its preview serves, or nothing: never production's version under its name.
  if (branch !== undefined && !served) return undefined;
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
  branch?: string,
): Promise<{ entry: CatalogTool; allowed: Map<string, boolean> }> {
  const { manifest } = s;
  const profiles = manifest.profiles ?? {};
  // The same check as the runtime's, with what the gateway would forward (D-127, D-136): the
  // person's subjects, each given permissions of this tool, and the per-action exceptions.
  const grants = await registry.accessGrants(s.tool.id, manifest);
  const overrides = await registry.accessExceptions(s.tool.id);
  const who = {
    subjects: caller.subjects,
    ...resolveAccess(caller.subjects, grants, overrides, manifest),
  };
  const actions = Object.entries(manifest.actions ?? {});
  const allowed = new Map(
    actions.map(([name, a]) => [name, mayAccess(who, profiles, name, a.access)]),
  );
  // The subjects worth asking for: those that may call something in this tool, `everyone` first,
  // then the teams by name. The label says what the subject is given: the profile's label, or all
  // the permissions.
  const teamNames = new Map(
    (await registry.listTeams(s.tool.workspace)).map((t) => [`team:${t.id}`, t.name]),
  );
  const mapped = [...new Set([...Object.keys(grants), ...Object.keys(overrides)])];
  const nameOf = (subject: string) =>
    subject === EVERYONE ? "Everyone" : (teamNames.get(subject) ?? subject);
  const asking = mapped
    .filter((subject) => {
      const one = {
        subjects: [subject],
        ...resolveAccess([subject], grants, overrides, manifest),
      };
      return actions.some(([name, a]) => mayAccess(one, profiles, name, a.access));
    })
    .sort(
      (a, b) =>
        Number(b === EVERYONE) - Number(a === EVERYONE) || nameOf(a).localeCompare(nameOf(b)),
    )
    .map((subject) => {
      const grant = grants[subject];
      const name = nameOf(subject);
      const label =
        grant?.kind === "profile"
          ? `${name} (${profiles[grant.profile]?.label ?? grant.profile})`
          : grant?.kind === "all"
            ? `${name} (all permissions)`
            : name;
      return { subject, name, label };
    });
  const icon = manifest.icon ? files.find((f) => f.path === manifest.icon) : undefined;
  return {
    allowed,
    entry: {
      name: s.tool.name,
      title: manifest.title ?? s.tool.name,
      summary: manifest.summary ?? manifest.description ?? "",
      icon: icon ? assetUrl(s.tool.name, icon.path, icon.hash, branch) : null,
      productionVersion: s.production,
      interfaces: { ...manifest.interfaces },
      access: [...allowed.values()].some(Boolean) ? "granted" : "requestable",
      subjects: asking,
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

/**
 * The card of one tool, or `undefined` for a tool with no version (or none of that name). With a
 * branch, the card of the version its preview serves, or `undefined` when it has no preview.
 */
export async function findCard(
  registry: Registry,
  workspace: string,
  name: string,
  caller: CatalogCaller,
  origin: string,
  branch?: string,
): Promise<ToolCard | undefined> {
  const tool = await registry.findTool(workspace, name);
  if (!tool) return undefined;
  const s = await shown(registry, tool, branch);
  if (!s) return undefined;
  const files = await registry.docsOf(s.build.id);
  const { entry, allowed } = await describe(registry, s, caller, files, branch);
  const { manifest } = s;
  const assets: CatalogAsset[] = files
    .filter((f) => f.type !== "text/markdown")
    .map((f) => ({
      path: f.path,
      type: f.type as CatalogAsset["type"],
      size: f.size,
      url: assetUrl(tool.name, f.path, f.hash, branch),
    }));
  const exposed = manifest.interfaces;
  // A branch's channel answers at `/t/<tool>@<branch>/` (D-119), a permanent one at `/t/<tool>~<name>/`
  // (D-125): `branch` is the channel's reference.
  const at =
    branch === undefined
      ? tool.name
      : isPermanentRef(branch)
        ? `${tool.name}~${encodeURIComponent(branch.slice(1))}`
        : `${tool.name}@${encodeURIComponent(branch)}`;
  const changelog = (s.build.changelog as { entries?: unknown[] } | null | undefined)?.entries;
  return {
    ...entry,
    readme: (await registry.readmeOf(tool.id, s.build.id)) ?? null,
    guide: (await registry.guideOf(tool.id, s.build.id)) ?? null,
    assets,
    connect: {
      mcp: exposed.mcp ? { url: `${origin}/t/${at}/mcp` } : null,
      api: exposed.api ? { baseUrl: `${origin}/t/${at}/api` } : null,
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

/** One image of the version the catalog shows (or a branch's), or `undefined` (no such tool, version or file). */
export async function findAsset(
  registry: Registry,
  workspace: string,
  name: string,
  path: string,
  branch?: string,
): Promise<{ type: string; hash: string; bytes: Uint8Array } | undefined> {
  const tool = await registry.findTool(workspace, name);
  const s = tool ? await shown(registry, tool, branch) : undefined;
  if (!tool || !s) return undefined;
  return registry.assetOf(tool.id, s.build.id, path);
}
