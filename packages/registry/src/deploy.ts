// Receiving a build on a branch's temporary channel, putting a release on a permanent channel, rolling
// a channel back: each is recorded in the audit log (who, when, which version). The registry is
// written only for what happened: a build that fails to deploy stays recorded (CI can retry), but the
// channel keeps pointing at its previous version (D-125).
import { diffResourceChanges, type Manifest } from "@forgeron/manifest";
import {
  deploy,
  isPermanent,
  isRelease,
  restore,
  teardownPreview,
  type Build,
  type BuildMigration,
  type DeployOptions,
  type Deployment,
  type Hosting,
} from "@forgeron/hosting";
import { docsProblem } from "./docs-check";
import {
  RegistryError,
  type Approval,
  type BuildRecord,
  type DeploymentCommit,
  type EnvironmentRecord,
  type Registry,
  type RegisteredEnvironment,
  type Tool,
  type VersionRecord,
} from "./registry";

export interface DeployBuildInput {
  tool: Tool;
  environment: RegisteredEnvironment;
  /** A preview is tied to a branch; the version keeps it (D-125). */
  branch?: string;
  /** A permanent channel other than production: its name. */
  channel?: string;
  build: Build;
  /** The number the version is published under. */
  version: string;
  allowDestructive?: boolean;
  /** Fills a preview's new database (`preview.data: seed`): see `DeployOptions.seed`. */
  seed?: DeployOptions["seed"];
  /** Who deploys: written in the audit log. */
  actor: string;
  /** The commit CI built from, kept with the deployment for the console. */
  commit?: DeploymentCommit;
}

export interface DeployedBuild extends Deployment {
  version: VersionRecord;
  environment: EnvironmentRecord;
}

/** A permanent channel: it takes only releases, approved, and keeps its data (D-125). */
const guarded = (name: RegisteredEnvironment) => isPermanent({ name });

/**
 * What a version asks for that production does not have yet (sdk.md §3): each resource added or
 * broadened becomes a pending approval. With no production version, everything it asks for is new.
 */
async function requestApprovals(
  registry: Registry,
  tool: Tool,
  version: VersionRecord,
  manifest: Manifest,
): Promise<void> {
  const production = (await registry.listEnvironments(tool.id)).find(
    (e) => e.name === "production",
  );
  const served = production?.versionId
    ? await registry.getVersion(production.versionId)
    : undefined;
  const baseline = served ? (await registry.getBuild(served.buildId))?.manifest : undefined;
  const previous = (baseline as Manifest | undefined)?.resources ?? {};
  for (const change of diffResourceChanges(previous, manifest.resources)) {
    if (change.needsApproval) {
      await registry.requestApproval(version.id, { resource: change.subject, kind: change.kind });
    }
  }
}

/** A permanent channel waits for an admin; a preview does not. */
async function assertApproved(
  registry: Registry,
  environment: RegisteredEnvironment,
  version: VersionRecord,
): Promise<void> {
  if (!guarded(environment)) return;
  const waiting = await registry.unapproved(version.id);
  if (waiting.length > 0) {
    throw new RegistryError(
      "PENDING_APPROVAL",
      `${environment} waits for an admin to approve: ${waiting.map((a) => a.resource).join(", ")}.`,
    );
  }
}

/** The key of an environment in the registry: a preview's branch, a channel's name, or none. */
const keyOf = (name: RegisteredEnvironment, branch?: string, channel?: string) =>
  name === "preview" ? branch : name === "channel" ? channel : undefined;

const target = (tool: Tool, name: RegisteredEnvironment, branch?: string, channel?: string) => ({
  tool: tool.name,
  name,
  ...(name === "preview" && branch ? { branch } : {}),
  ...(name === "channel" && channel ? { channel } : {}),
});

/** A recorded build, as a host takes it. A build recorded without its code cannot be redeployed. */
function buildOf(record: BuildRecord): Build {
  if (record.worker === undefined) {
    throw new RegistryError(
      "NO_ARTIFACT",
      `The build ${record.fingerprint} was recorded without its code: deploy it again from CI.`,
    );
  }
  return {
    manifest: record.manifest as Build["manifest"],
    worker: record.worker,
    fingerprint: record.fingerprint,
    ...(record.migrations ? { migrations: record.migrations as BuildMigration[] } : {}),
    ...(record.changelog ? { changelog: record.changelog as NonNullable<Build["changelog"]> } : {}),
    ...(record.views ? { views: record.views } : {}),
  };
}

export async function deployBuild(
  registry: Registry,
  hosting: Hosting,
  input: DeployBuildInput,
): Promise<DeployedBuild> {
  const { tool, build } = input;
  const problem = await docsProblem(build.manifest, build.docs);
  if (problem) throw new RegistryError("INVALID_DOCS", problem);
  const slot = await registry.ensureEnvironment(
    tool.id,
    input.environment,
    keyOf(input.environment, input.branch, input.channel),
  );
  const recorded = await registry.recordBuild(tool.id, {
    fingerprint: build.fingerprint,
    manifest: build.manifest,
    worker: build.worker,
    ...(build.migrations ? { migrations: build.migrations } : {}),
    ...(build.changelog ? { changelog: build.changelog } : {}),
    ...(build.views ? { views: build.views } : {}),
  });
  if (build.docs) await registry.storeDocs(tool.id, recorded.id, build.docs);
  const version = await registry.publishVersion(
    tool.id,
    recorded.id,
    input.version,
    input.environment === "preview" ? input.branch : undefined,
  );
  await requestApprovals(registry, tool, version, build.manifest);
  await assertApproved(registry, input.environment, version);
  const deployment = await deploy(
    hosting,
    target(tool, input.environment, input.branch, input.channel),
    build,
    {
      ...(input.allowDestructive === undefined ? {} : { allowDestructive: input.allowDestructive }),
      ...(input.seed ? { seed: input.seed } : {}),
    },
  );
  const environment = await registry.activate(slot.id, version.id, {
    actor: input.actor,
    url: deployment.activation.url,
    ...(input.commit ? { commit: input.commit } : {}),
  });
  // The tool arrives with its default mapping (D-127): `admin` all, `member` the default profile.
  await registry.seedAccessGrants(tool.id, build.manifest as Manifest, input.actor);
  return { ...deployment, version, environment };
}

export interface PutOnChannelInput {
  tool: Tool;
  /** The version number, as published. */
  version: string;
  /** A permanent channel: production, or another one (`channel` names it). */
  to: "production" | "channel";
  channel?: string;
  allowDestructive?: boolean;
  actor: string;
  /** Through which door the call came, when it is not the CLI or the console. */
  via?: string;
  /** Why, as the person wrote it: kept in the audit line. */
  reason?: string;
  /**
   * The admin approves, in the same step, what the version asks for (D-121): approvals are a detail
   * of the update, not a screen. Only a person may pass it, never a deployment token.
   */
  approve?: boolean;
  /** A marketplace's publication is its release (D-121): its changelog may list nothing. */
  published?: boolean;
}

/**
 * Puts a release the tool already has on a permanent channel, from the code recorded with its build:
 * no rebuild (D-125, the update). The channel takes it under the rules of a permanent channel: a
 * release that covers the change, approved, and no destructive migration without `allowDestructive`.
 * Nothing moves between branches: the release was made on the branch the channel follows.
 */
export async function putOnChannel(
  registry: Registry,
  hosting: Hosting,
  input: PutOnChannelInput,
): Promise<DeployedBuild> {
  const { tool } = input;
  const version = await registry.findVersion(tool.id, input.version);
  if (!version) {
    throw new RegistryError("NOT_FOUND", `The tool ${tool.name} has no version ${input.version}.`);
  }
  const record = await registry.getBuild(version.buildId);
  if (!record) throw new RegistryError("NOT_FOUND", `There is no build ${version.buildId}.`);
  const slot = await registry.ensureEnvironment(
    tool.id,
    input.to,
    keyOf(input.to, undefined, input.channel),
  );
  if (input.approve) await approveVersion(registry, version.id, input.actor, input.via);
  await assertApproved(registry, input.to, version);
  const deployment = await deploy(
    hosting,
    target(tool, input.to, undefined, input.channel),
    buildOf(record),
    {
      ...(input.allowDestructive === undefined ? {} : { allowDestructive: input.allowDestructive }),
      ...(input.published ? { published: true } : {}),
    },
  );
  const environment = await registry.activate(slot.id, version.id, {
    actor: input.actor,
    ...(input.via ? { via: input.via } : {}),
    kind: "promote",
    url: deployment.activation.url,
    ...(input.reason ? { reason: input.reason } : {}),
  });
  await registry.seedAccessGrants(tool.id, record.manifest as Manifest, input.actor);
  return { ...deployment, version, environment };
}

/** Whether a version is a release: its build's changelog says so (D-125). */
export async function isReleaseVersion(
  registry: Registry,
  version: VersionRecord,
): Promise<boolean> {
  const build = await registry.getBuild(version.buildId);
  return isRelease(build?.changelog as Build["changelog"]);
}

export interface RollbackInput {
  tool: Tool;
  environment: RegisteredEnvironment;
  branch?: string;
  /** A permanent channel other than production: its name. */
  channel?: string;
  actor: string;
  /** Through which door the call came, when it is not the CLI or the console. */
  via?: string;
  /** Why, as the person wrote it: kept in the audit line. */
  reason?: string;
}

/**
 * Puts the version the channel served before the current one back on traffic: a version it served,
 * so no new code (D-125). No migration is rolled back or applied (`forgeron db rollback` is explicit).
 */
export async function rollbackEnvironment(
  registry: Registry,
  hosting: Hosting,
  input: RollbackInput,
): Promise<{ version: VersionRecord; environment: EnvironmentRecord }> {
  const { tool } = input;
  const slot = await registry.ensureEnvironment(
    tool.id,
    input.environment,
    keyOf(input.environment, input.branch, input.channel),
  );
  const previous = await registry.previousVersion(slot.id);
  if (!previous) {
    const where = input.channel ? `channel ${input.channel}` : `${input.environment} environment`;
    throw new RegistryError("NO_PREVIOUS", `The ${where} has no earlier version.`);
  }
  const record = await registry.getBuild(previous.buildId);
  if (!record) throw new RegistryError("NOT_FOUND", `There is no build ${previous.buildId}.`);
  const { activation } = await restore(
    hosting,
    target(tool, input.environment, input.branch, input.channel),
    buildOf(record),
  );
  const environment = await registry.activate(slot.id, previous.id, {
    actor: input.actor,
    ...(input.via ? { via: input.via } : {}),
    kind: "rollback",
    url: activation.url,
    ...(input.reason ? { reason: input.reason } : {}),
  });
  return { version: previous, environment };
}

/** A merged or deleted branch: the preview is torn down, then forgotten. */
export async function closePreview(
  registry: Registry,
  hosting: Hosting,
  tool: Tool,
  branch: string,
): Promise<void> {
  await teardownPreview(hosting, tool.name, branch);
  const environment = (await registry.listEnvironments(tool.id)).find(
    (e) => e.name === "preview" && e.branch === branch,
  );
  if (environment) await registry.removeEnvironment(environment.id);
}

/**
 * An admin removes a permanent channel other than production: its Worker and its database go, then
 * the channel is forgotten with its history (D-125). Production is never removed.
 */
export async function closeChannel(
  registry: Registry,
  hosting: Hosting,
  tool: Tool,
  channel: string,
): Promise<void> {
  const environment = await registry.findChannel(tool.id, channel);
  if (!environment) throw new RegistryError("NOT_FOUND", `There is no channel ${channel}.`);
  await hosting.teardown({ tool: tool.name, name: "channel", channel });
  await registry.removeEnvironment(environment.id);
}

/** An admin accepts everything a version asks for: it can now reach production. */
export async function approveVersion(
  registry: Registry,
  versionId: string,
  actor: string,
  via?: string,
): Promise<Approval[]> {
  return decideVersion(registry, versionId, "approved", actor, via);
}

/** An admin refuses what a version asks for: it stays out of production. */
export async function rejectVersion(
  registry: Registry,
  versionId: string,
  actor: string,
  via?: string,
): Promise<Approval[]> {
  return decideVersion(registry, versionId, "rejected", actor, via);
}

async function decideVersion(
  registry: Registry,
  versionId: string,
  decision: "approved" | "rejected",
  actor: string,
  via?: string,
): Promise<Approval[]> {
  const version = await registry.getVersion(versionId);
  if (!version) throw new RegistryError("NOT_FOUND", `There is no version ${versionId}.`);
  const pending = (await registry.listApprovals(version.toolId, "pending")).filter(
    (a) => a.versionId === versionId,
  );
  const decided: Approval[] = [];
  for (const approval of pending) {
    decided.push(await registry.decideApproval(approval.id, decision, actor, via));
  }
  return decided;
}
