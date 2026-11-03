// What the gateway does with a build it receives (docs/ARCHITECTURE.md, "Publishing a tool"):
// check it, create the resources, upload the Worker, migrate the database, then switch traffic.
// Nothing before the last step changes what the environment serves, so any failure leaves the
// previous version serving (sdk.md §8, point 4).
import {
  assertDeployable,
  type Activation,
  type Build,
  type Environment,
  type Hosting,
  type Uploaded,
} from "./core";
import type { MigrateOptions } from "./migrate";

export interface DeployOptions {
  /** Pilot and production refuse a destructive migration unless told (`--allow-destructive`). */
  allowDestructive?: boolean;
  now?: MigrateOptions["now"];
}

export interface Deployment {
  uploaded: Uploaded;
  /** The migrations this deployment applied. */
  applied: string[];
  activation: Activation;
}

export async function deploy(
  hosting: Hosting,
  environment: Environment,
  build: Build,
  options: DeployOptions = {},
): Promise<Deployment> {
  assertDeployable(environment, build);
  const provisioned = await hosting.provision(environment, build.manifest);
  const uploaded = await hosting.upload(provisioned, build);
  // A preview owns its database: it may drop what it likes. The others share one.
  const guarded = environment.name === "pilot" || environment.name === "production";
  const { applied } = await hosting.migrate(uploaded, {
    allowDestructive: options.allowDestructive ?? !guarded,
    ...(options.now ? { now: options.now } : {}),
  });
  const activation = await hosting.activate(uploaded);
  return { uploaded, applied, activation };
}

/** A merged or deleted branch: its preview and everything it owns goes. */
export async function teardownPreview(hosting: Hosting, tool: string, branch: string) {
  await hosting.teardown({ tool, name: "preview", branch });
}
