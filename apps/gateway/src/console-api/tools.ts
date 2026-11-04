import type { RegisteredEnvironment, Registry } from "@forgeron/registry";

// The workspace's tools and the version each environment serves (docs/sdk.md sections 15 and 17).
// `listTools` is the one source: `GET /api/tools` (`platform/tools.ts`) answers with it and the admin
// MCP's `tools_list` is to answer with the same call, so the two cannot disagree.

export interface ToolListing {
  name: string;
  production: string | null;
  /** One entry per branch with a preview. */
  previews: Array<{ branch: string; version: string }>;
  /** The tool's description from its manifest: the production version's, else the latest published. */
  summary: string | null;
  /** The latest deployment, to any environment. */
  lastDeployment: { at: string; version: string } | null;
}

export async function listTools(
  registry: Pick<
    Registry,
    | "getBuild"
    | "getVersion"
    | "listDeployments"
    | "listEnvironments"
    | "listTools"
    | "listVersions"
  >,
  workspace: string,
): Promise<ToolListing[]> {
  const listing: ToolListing[] = [];
  for (const tool of await registry.listTools(workspace)) {
    const versions = new Map((await registry.listVersions(tool.id)).map((v) => [v.id, v.version]));
    const entry: ToolListing = {
      name: tool.name,
      production: null,
      previews: [],
      summary: null,
      lastDeployment: null,
    };
    let served: string | undefined;
    for (const environment of await registry.listEnvironments(tool.id)) {
      const version = environment.versionId ? versions.get(environment.versionId) : undefined;
      if (version === undefined) continue; // created, nothing activated yet
      const name: RegisteredEnvironment = environment.name;
      if (name === "production") {
        entry.production = version;
        served = environment.versionId;
      } else if (environment.branch) entry.previews.push({ branch: environment.branch, version });
    }
    const [latest] = await registry.listDeployments(tool.id, 1);
    if (latest) {
      entry.lastDeployment = {
        at: latest.createdAt,
        version: versions.get(latest.versionId) ?? latest.versionId,
      };
    }
    const summaryOf = (versionId: string | undefined) =>
      versionId ? registry.getVersion(versionId) : undefined;
    const described = (await summaryOf(served)) ?? (await registry.listVersions(tool.id)).at(-1);
    const manifest = described ? (await registry.getBuild(described.buildId))?.manifest : undefined;
    const description = (manifest as { description?: unknown } | undefined)?.description;
    if (typeof description === "string" && description) entry.summary = description;
    listing.push(entry);
  }
  return listing.sort((a, b) => a.name.localeCompare(b.name));
}
