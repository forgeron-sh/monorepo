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
  type Provisioned,
  type Uploaded,
} from "./core";
import type { D1Database, MigrateOptions } from "./migrate";
import { markSeedPending } from "./seed-marker";

/** What a preview's new database holds after a deployment (`preview.data`, sdk.md §3). */
export type PreviewData = "seed" | "empty" | "snapshot";

export class PreviewDataError extends Error {
  override name = "PreviewDataError";
}

export interface DeployOptions {
  /**
   * Fills the new database of a preview with the tool's seed (`db/seed.ts`). Whoever deploys has
   * the seed: the host only knows the database. Without it, the seed is left to the preview's
   * Worker (`seed-marker.ts`).
   */
  seed?: (db: D1Database) => void | Promise<void>;
  /** Pilot and production refuse a destructive migration unless told (`--allow-destructive`). */
  allowDestructive?: boolean;
  now?: MigrateOptions["now"];
}

export interface Deployment {
  /** Whether the environment's database was created by this deployment, and how it was filled. */
  database?: {
    fresh: boolean;
    data?: PreviewData;
    seeded: boolean;
    /** The seed is left to the preview's Worker, which runs it on its first request (D-033). */
    pending?: boolean;
  };
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
  const database = await fillPreview(hosting, environment, build, provisioned, options);
  const activation = await hosting.activate(uploaded);
  return { ...(database ? { database } : {}), uploaded, applied, activation };
}

// In preview each branch has a fresh database: filled once, when it is created, according to
// `preview.data`. A branch that deploys again keeps its data (a seed is not run again on data).
async function fillPreview(
  hosting: Hosting,
  environment: Environment,
  build: Build,
  provisioned: Provisioned,
  options: DeployOptions,
): Promise<Deployment["database"]> {
  if (environment.name !== "preview") return undefined;
  const binding = provisioned.bindings.find((b) => b.kind === "d1");
  if (!binding) return undefined;
  const fresh = binding.fresh === true;
  if (!fresh) return { fresh, seeded: false };

  const data: PreviewData = build.manifest.preview?.data ?? "seed";
  if (data === "snapshot") {
    throw new PreviewDataError("preview.data: snapshot is not implemented yet: use seed or empty.");
  }
  const db = hosting.database?.(provisioned);
  if (data === "empty" || !db) return { fresh, data, seeded: false };
  if (!options.seed) {
    // Nobody here can run the seed (the gateway does not evaluate a tool's code): the Worker does.
    await markSeedPending(db);
    return { fresh, data, seeded: false, pending: true };
  }
  try {
    await options.seed(db);
  } catch (error) {
    // The database would stay half filled and, no longer fresh, never be seeded again: start over.
    await hosting.teardown(environment);
    throw new PreviewDataError(
      `The seed failed, the preview was removed so that the next deployment starts clean: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error },
    );
  }
  return { fresh, data, seeded: true };
}

/** A merged or deleted branch: its preview and everything it owns goes. */
export async function teardownPreview(hosting: Hosting, tool: string, branch: string) {
  await hosting.teardown({ tool, name: "preview", branch });
}

/**
 * Puts an earlier build back on traffic: provision, upload, activate, **without migrating**. An
 * earlier build has fewer migrations than the database, and none is rolled back implicitly
 * (`forgeron db rollback` does that, explicitly).
 */
export async function restore(hosting: Hosting, environment: Environment, build: Build) {
  const provisioned = await hosting.provision(environment, build.manifest);
  const uploaded = await hosting.upload(provisioned, build);
  const activation = await hosting.activate(uploaded);
  return { uploaded, activation };
}
