// Receiving a build: record it, deploy it through `hosting`, and record what the environment now
// serves. The registry is written only for what happened: a build that fails to deploy stays
// recorded (CI can retry), but the environment keeps pointing at its previous version.
import {
  deploy,
  teardownPreview,
  type Build,
  type Deployment,
  type Hosting,
} from "@forgeron/hosting";
import type {
  EnvironmentRecord,
  Registry,
  RegisteredEnvironment,
  Tool,
  VersionRecord,
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
}

export interface DeployedBuild extends Deployment {
  version: VersionRecord;
  environment: EnvironmentRecord;
}

export async function deployBuild(
  registry: Registry,
  hosting: Hosting,
  input: DeployBuildInput,
): Promise<DeployedBuild> {
  const { tool, build } = input;
  const target = await registry.ensureEnvironment(tool.id, input.environment, input.branch);
  const recorded = await registry.recordBuild(tool.id, {
    fingerprint: build.fingerprint,
    manifest: build.manifest,
    ...(build.changelog ? { changelog: build.changelog } : {}),
  });
  const version = await registry.publishVersion(tool.id, recorded.id, input.version);
  const deployment = await deploy(
    hosting,
    {
      tool: tool.name,
      name: input.environment,
      ...(input.branch ? { branch: input.branch } : {}),
    },
    build,
    input.allowDestructive === undefined ? {} : { allowDestructive: input.allowDestructive },
  );
  const environment = await registry.activate(target.id, version.id, deployment.activation.url);
  return { ...deployment, version, environment };
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
