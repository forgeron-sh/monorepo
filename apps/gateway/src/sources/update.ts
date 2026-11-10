// A tool's update (D-121): what it would bring, and putting it in production. A marketplace tool
// moves to the catalogue's latest release; a repository tool to what the preview of its production
// branch serves. Approvals are a detail of the update: the admin approves in the same step. A new
// version goes by itself when the tool says so and it asks for nothing new.
import type { Hosting } from "@forgeron/hosting";
import { diffResourceChanges, type Manifest } from "@forgeron/manifest";
import {
  approveVersion,
  marketplaceSource,
  promoteVersion,
  TEMPLATE_WORKSPACE,
  type Registry,
  type Tool,
  type ToolSource,
} from "@forgeron/registry";

export class UpdateError extends Error {
  override name = "UpdateError";
  constructor(
    readonly code: "NO_UPDATE" | "STALE",
    message: string,
  ) {
    super(message);
  }
}

/** The marketplace id the console knows: `official` for `@templates`, else the id of `@mp:<id>`. */
export function marketplaceIdOf(source: string | undefined): string | undefined {
  if (source === undefined) return undefined;
  if (source === TEMPLATE_WORKSPACE) return "official";
  const prefix = marketplaceSource("");
  return source.startsWith(prefix) ? source.slice(prefix.length) : undefined;
}

/** A changelog entry is free-form: a string, or an object with a line of text in it. */
function line(entry: unknown): string {
  if (typeof entry === "string") return entry;
  if (typeof entry === "object" && entry !== null) {
    const { description, text } = entry as { description?: unknown; text?: unknown };
    if (typeof description === "string") return description;
    if (typeof text === "string") return text;
  }
  return "";
}

const entriesOf = (changelog: unknown): unknown[] => {
  const entries = (changelog as { entries?: unknown } | null | undefined)?.entries;
  return Array.isArray(entries) ? entries : [];
};

async function productionOf(registry: Registry, tool: Tool) {
  const production = (await registry.listEnvironments(tool.id)).find(
    (e) => e.name === "production" && e.versionId,
  );
  const served = production?.versionId
    ? await registry.getVersion(production.versionId)
    : undefined;
  const build = served ? await registry.getBuild(served.buildId) : undefined;
  return { version: served?.version ?? null, manifest: build?.manifest as Manifest | undefined };
}

export interface DescribedUpdate {
  version: string;
  branch?: string;
  release: boolean;
  changelog: string[];
  approvals: string[];
}

/** What the waiting update would bring, or `null`. Reads only. */
export async function describeUpdate(
  registry: Registry,
  tool: Tool,
  source: ToolSource,
): Promise<{ production: string | null; update: DescribedUpdate | null }> {
  const production = await productionOf(registry, tool);
  const update = await registry.availableUpdate(tool.id);
  if (!update) return { production: production.version, update: null };
  const copied = await registry.findVersion(tool.id, update.version);
  let entries: unknown[];
  let approvals: string[];
  if (copied) {
    entries = entriesOf((await registry.getBuild(copied.buildId))?.changelog);
    approvals = (await registry.unapproved(copied.id)).map((a) => a.resource);
  } else {
    // A marketplace release not copied yet: read it in the catalogue.
    const described = await registry.describeTemplate(source.sourceTool!, source.source);
    entries = described?.changelog ?? [];
    approvals = diffResourceChanges(
      production.manifest?.resources ?? {},
      described?.manifest.resources ?? {},
    )
      .filter((c) => c.needsApproval)
      .map((c) => c.subject);
  }
  return {
    production: production.version,
    update: {
      version: update.version,
      ...(update.branch ? { branch: update.branch } : {}),
      // A marketplace publishes releases: its versions are releases even when they list nothing.
      release: source.kind === "marketplace" || entries.length > 0,
      changelog: entries.map(line).filter(Boolean),
      approvals,
    },
  };
}

export interface UpdateInput {
  actor: string;
  via?: string;
  /** Approves what the update asks for, in the same step: an admin's. */
  approve?: boolean;
  /** Takes a build with no release, knowingly: an admin's. */
  withoutRelease?: boolean;
  /** The version the admin read: refused if the update changed since. */
  expected?: string;
}

/** Puts the waiting update in production. Throws what a promotion throws, or an `UpdateError`. */
export async function putUpdateInProduction(
  registry: Registry,
  hosting: Hosting,
  tool: Tool,
  input: UpdateInput,
) {
  const source = await registry.toolSource(tool.id);
  const update = await registry.availableUpdate(tool.id);
  if (!update) throw new UpdateError("NO_UPDATE", `${tool.name} has no update waiting.`);
  if (input.expected !== undefined && update.version !== input.expected) {
    throw new UpdateError(
      "STALE",
      `The update is now ${update.version}, not ${input.expected}: read it again.`,
    );
  }
  if (source.kind === "marketplace") {
    await registry.updateFromSource({
      toolId: tool.id,
      actor: input.actor,
      ...(input.via ? { via: input.via } : {}),
    });
  }
  return promoteVersion(registry, hosting, {
    tool,
    version: update.version,
    to: "production",
    actor: input.actor,
    ...(input.via ? { via: input.via } : {}),
    ...(input.approve ? { approve: true } : {}),
    // A marketplace's publication is its release (D-121).
    ...(source.kind === "marketplace" || input.withoutRelease ? { withoutRelease: true } : {}),
  });
}

/**
 * The update goes by itself when the tool says so (`autoUpdate`) and nothing stops it: no approval to
 * give, a release (for a repository tool), migrations that apply. Otherwise it waits for an admin, and
 * the reason is returned. Never throws: a deployment or a sync does not fail because of it.
 */
export async function updateByItself(
  registry: Registry,
  hosting: Hosting,
  tool: Tool,
  actor: string,
): Promise<{ version: string } | { waiting: string } | undefined> {
  const source = await registry.toolSource(tool.id);
  if (!source.autoUpdate) return undefined;
  try {
    const done = await putUpdateInProduction(registry, hosting, tool, { actor });
    return { version: done.version.version };
  } catch (error) {
    return { waiting: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * After an install (D-121): the admin read what the tool asks for and installed it, which is the
 * approval. It then goes to production where the gateway can deploy; a refusal leaves it installed,
 * and says why.
 */
export async function goLiveAfterInstall(
  registry: Registry,
  hosting: Hosting | undefined,
  input: { workspace: string; tool: string; version: { id: string; version: string } },
  actor: string,
  via?: string,
): Promise<{ production: boolean; waiting?: string }> {
  if (!hosting) {
    await approveVersion(registry, input.version.id, actor, via);
    return { production: false, waiting: "This gateway cannot deploy." };
  }
  const tool = (await registry.findTool(input.workspace, input.tool))!;
  try {
    await promoteVersion(registry, hosting, {
      tool,
      version: input.version.version,
      to: "production",
      actor,
      ...(via ? { via } : {}),
      approve: true,
      // A catalogue's publication is its release.
      withoutRelease: true,
    });
    return { production: true };
  } catch (error) {
    return { production: false, waiting: error instanceof Error ? error.message : String(error) };
  }
}
