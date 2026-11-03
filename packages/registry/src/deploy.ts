// Receiving a build, promoting a version, rolling an environment back: each is recorded in the
// audit log (who, when, which version). The registry is written only for what happened: a build
// that fails to deploy stays recorded (CI can retry), but the environment keeps pointing at its
// previous version.
import { diffResourceChanges, type Manifest } from "@forgeron/manifest";
import {
  deploy,
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
  type EnvironmentRecord,
  type Registry,
  type RegisteredEnvironment,
  type Tool,
  type VersionRecord,
} from "./registry";

export interface DeployBuildInput {
  tool: Tool;
  environment: RegisteredEnvironment;
  /** A preview is tied to a branch. */
  branch?: string;
  build: Build;
  /** The number the version is published under. */
  version: string;
  allowDestructive?: boolean;
  /** Fills a preview's new database (`preview.data: seed`): see `DeployOptions.seed`. */
  seed?: DeployOptions["seed"];
  /** Who deploys: written in the audit log. */
  actor: string;
}

export interface DeployedBuild extends Deployment {
  version: VersionRecord;
  environment: EnvironmentRecord;
}

const guarded = (name: RegisteredEnvironment) => name === "production";

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

/** Production waits for an admin; a preview does not. */
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

const target = (tool: Tool, name: RegisteredEnvironment, branch?: string) => ({
  tool: tool.name,
  name,
  ...(branch ? { branch } : {}),
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
  const slot = await registry.ensureEnvironment(tool.id, input.environment, input.branch);
  const recorded = await registry.recordBuild(tool.id, {
    fingerprint: build.fingerprint,
    manifest: build.manifest,
    worker: build.worker,
    ...(build.migrations ? { migrations: build.migrations } : {}),
    ...(build.changelog ? { changelog: build.changelog } : {}),
  });
  if (build.docs) await registry.storeDocs(tool.id, recorded.id, build.docs);
  const version = await registry.publishVersion(tool.id, recorded.id, input.version);
  await requestApprovals(registry, tool, version, build.manifest);
  await assertApproved(registry, input.environment, version);
  const deployment = await deploy(hosting, target(tool, input.environment, input.branch), build, {
    ...(input.allowDestructive === undefined ? {} : { allowDestructive: input.allowDestructive }),
    ...(input.seed ? { seed: input.seed } : {}),
  });
  const environment = await registry.activate(slot.id, version.id, {
    actor: input.actor,
    url: deployment.activation.url,
  });
  return { ...deployment, version, environment };
}

export interface PromoteInput {
  tool: Tool;
  /** The version number, as published. */
  version: string;
  to: RegisteredEnvironment;
  branch?: string;
  allowDestructive?: boolean;
  actor: string;
}

/**
 * Puts an existing version on another environment, from the code recorded with its build: no
 * rebuild. The target takes it under the same rules as a deployment (changelog, destructive
 * migrations).
 */
export async function promoteVersion(
  registry: Registry,
  hosting: Hosting,
  input: PromoteInput,
): Promise<DeployedBuild> {
  const { tool } = input;
  const version = await registry.findVersion(tool.id, input.version);
  if (!version) {
    throw new RegistryError("NOT_FOUND", `The tool ${tool.name} has no version ${input.version}.`);
  }
  const record = await registry.getBuild(version.buildId);
  if (!record) throw new RegistryError("NOT_FOUND", `There is no build ${version.buildId}.`);
  const slot = await registry.ensureEnvironment(tool.id, input.to, input.branch);
  await assertApproved(registry, input.to, version);
  const deployment = await deploy(
    hosting,
    target(tool, input.to, input.branch),
    buildOf(record),
    input.allowDestructive === undefined ? {} : { allowDestructive: input.allowDestructive },
  );
  const environment = await registry.activate(slot.id, version.id, {
    actor: input.actor,
    kind: "promote",
    url: deployment.activation.url,
  });
  return { ...deployment, version, environment };
}

export interface RollbackInput {
  tool: Tool;
  environment: RegisteredEnvironment;
  branch?: string;
  actor: string;
}

/**
 * Puts the version the environment served before the current one back on traffic. No migration is
 * rolled back or applied (`forgeron db rollback` is explicit).
 */
export async function rollbackEnvironment(
  registry: Registry,
  hosting: Hosting,
  input: RollbackInput,
): Promise<{ version: VersionRecord; environment: EnvironmentRecord }> {
  const { tool } = input;
  const slot = await registry.ensureEnvironment(tool.id, input.environment, input.branch);
  const previous = await registry.previousVersion(slot.id);
  if (!previous) {
    throw new RegistryError(
      "NO_PREVIOUS",
      `The ${input.environment} environment has no earlier version.`,
    );
  }
  const record = await registry.getBuild(previous.buildId);
  if (!record) throw new RegistryError("NOT_FOUND", `There is no build ${previous.buildId}.`);
  const { activation } = await restore(
    hosting,
    target(tool, input.environment, input.branch),
    buildOf(record),
  );
  const environment = await registry.activate(slot.id, previous.id, {
    actor: input.actor,
    kind: "rollback",
    url: activation.url,
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
