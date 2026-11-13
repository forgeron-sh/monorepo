// A permanent channel's update (D-121, D-125): what it would bring, and putting it on the channel. A
// marketplace tool moves to the catalogue's latest release; a repository tool to the latest release
// of the branch the channel follows. A build that is not a release never reaches a permanent channel.
// Approvals are a detail of the update: the admin approves in the same step. A release goes by itself
// when the channel says so and it asks for nothing new. Forgeron never moves code between branches.
import type { Hosting } from "@forgeron/hosting";
import { diffResourceChanges, type Manifest } from "@forgeron/manifest";
import {
  approveVersion,
  marketplaceSource,
  planUpdate,
  putOnChannel,
  TEMPLATE_WORKSPACE,
  type Registry,
  type Tool,
  type ToolSource,
  type UpdatePlan,
} from "@forgeron/registry";

export class UpdateError extends Error {
  override name = "UpdateError";
  constructor(
    readonly code: "NO_UPDATE" | "STALE" | "NO_CHANNEL",
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

/** What a permanent channel serves: its version and manifest. */
async function servedOn(registry: Registry, tool: Tool, channel: string) {
  const found = (await registry.permanentChannels(tool.id)).find((c) => c.name === channel);
  const served = found?.environment?.versionId
    ? await registry.getVersion(found.environment.versionId)
    : undefined;
  const build = served ? await registry.getBuild(served.buildId) : undefined;
  return { version: served?.version ?? null, manifest: build?.manifest as Manifest | undefined };
}

export interface DescribedUpdate {
  version: string;
  branch?: string;
  changelog: string[];
  approvals: string[];
  /** What stops it, read before anything moves; absent when the gateway could not check. */
  plan?: UpdatePlan;
}

/**
 * What the release waiting for a permanent channel would bring, or `null`. Reads only. With a host,
 * the plan says what would stop it (D-113): migrations against the channel's own database, approvals.
 */
export async function describeUpdate(
  registry: Registry,
  tool: Tool,
  source: ToolSource,
  channel = "production",
  hosting?: Hosting,
): Promise<{ production: string | null; update: DescribedUpdate | null }> {
  const served = await servedOn(registry, tool, channel);
  const update = await registry.availableUpdate(tool.id, channel);
  if (!update) return { production: served.version, update: null };
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
      served.manifest?.resources ?? {},
      described?.manifest.resources ?? {},
    )
      .filter((c) => c.needsApproval)
      .map((c) => c.subject);
  }
  let plan: UpdatePlan | undefined;
  if (copied && hosting) {
    try {
      plan = await planUpdate(registry, hosting, {
        tool,
        channel,
        version: update.version,
        ...(source.kind === "marketplace" ? { published: true } : {}),
      });
    } catch {
      plan = undefined;
    }
  }
  return {
    production: served.version,
    update: {
      version: update.version,
      ...(update.branch ? { branch: update.branch } : {}),
      changelog: entries.map(line).filter(Boolean),
      approvals,
      ...(plan ? { plan } : {}),
    },
  };
}

export interface UpdateInput {
  actor: string;
  via?: string;
  /** The permanent channel: production when absent. */
  channel?: string;
  /** Approves what the update asks for, in the same step: an admin's. */
  approve?: boolean;
  /** A pending destructive migration may run: an admin's. */
  allowDestructive?: boolean;
  /** The version the admin read: refused if the update changed since. */
  expected?: string;
}

/**
 * Puts the waiting release on a permanent channel (production by default). Throws what a deployment
 * throws, or an `UpdateError`.
 */
export async function updateChannel(
  registry: Registry,
  hosting: Hosting,
  tool: Tool,
  input: UpdateInput,
) {
  const channel = input.channel ?? "production";
  if (
    channel !== "production" &&
    !(await registry.permanentChannels(tool.id)).some((c) => c.name === channel)
  ) {
    throw new UpdateError("NO_CHANNEL", `${tool.name} has no channel ${channel}.`);
  }
  const source = await registry.toolSource(tool.id);
  const update = await registry.availableUpdate(tool.id, channel);
  if (!update) {
    throw new UpdateError("NO_UPDATE", `${tool.name} has no update waiting on ${channel}.`);
  }
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
  return putOnChannel(registry, hosting, {
    tool,
    version: update.version,
    ...(channel === "production" ? { to: "production" as const } : { to: "channel", channel }),
    actor: input.actor,
    ...(input.via ? { via: input.via } : {}),
    ...(input.approve ? { approve: true } : {}),
    ...(input.allowDestructive ? { allowDestructive: true } : {}),
    // A marketplace's publication is its release (D-121).
    ...(source.kind === "marketplace" ? { published: true } : {}),
  });
}

/**
 * The update goes by itself when the channel says so (`autoUpdate`) and nothing stops it: no approval
 * to give, migrations that apply. Otherwise it waits for an update by a person, and the reason is returned. Never
 * throws: a deployment or a sync does not fail because of it.
 */
export async function updateByItself(
  registry: Registry,
  hosting: Hosting,
  tool: Tool,
  actor: string,
  channel = "production",
): Promise<{ version: string } | { waiting: string } | undefined> {
  const found = (await registry.permanentChannels(tool.id)).find((c) => c.name === channel);
  if (!found?.autoUpdate) return undefined;
  try {
    const done = await updateChannel(registry, hosting, tool, { actor, channel });
    return { version: done.version.version };
  } catch (error) {
    return { waiting: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * After a release lands on a branch (D-125): every permanent channel that follows it and updates by
 * itself takes it, or says why it waits. Never throws.
 */
export async function releaseReached(
  registry: Registry,
  hosting: Hosting,
  tool: Tool,
  branch: string,
  actor: string,
): Promise<Array<{ channel: string } & ({ version: string } | { waiting: string })>> {
  const done: Array<{ channel: string } & ({ version: string } | { waiting: string })> = [];
  for (const channel of await registry.permanentChannels(tool.id)) {
    if (channel.follows !== branch || !channel.autoUpdate) continue;
    const result = await updateByItself(registry, hosting, tool, actor, channel.name);
    if (result) done.push({ channel: channel.name, ...result });
  }
  return done;
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
    await putOnChannel(registry, hosting, {
      tool,
      version: input.version.version,
      to: "production",
      actor,
      ...(via ? { via } : {}),
      approve: true,
      // A catalogue's publication is its release.
      published: true,
    });
    return { production: true };
  } catch (error) {
    return { production: false, waiting: error instanceof Error ? error.message : String(error) };
  }
}
