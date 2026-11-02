// Deployment interface of a tool, whatever the hosting mode (docs/ARCHITECTURE.md, "Hosting modes").
// Neutral: plain data in and out, no Node API, so the gateway (a Worker) and the CLI can both use it.
// The implementations are separate: `./local` here; cloud and self-host come later.
import type { Manifest } from "@forgeron/manifest";
import type { BuildMigration, MigrateOptions, MigrateResult } from "./migrate";

export type EnvironmentName = "local" | "preview" | "pilot" | "production";

/** One deployment target: a tool in an environment (a preview also has its branch). */
export interface Environment {
  tool: string;
  name: EnvironmentName;
  branch?: string;
}

/** What `forgeron build` produces and a host needs: the Worker's code and the manifest. */
export interface Build {
  manifest: Manifest;
  /** The source of the Worker, an ES module. */
  worker: string;
  /** The hash of the sources: the same code gives the same fingerprint. */
  fingerprint: string;
  /** `db/migrations/`, in the order they apply. */
  migrations?: BuildMigration[];
}

export type BindingKind = "d1" | "kv" | "r2" | "queue";

/** A resource of the manifest, as the Worker will find it in its `env`. */
export interface Binding {
  /** The name in `env`. */
  name: string;
  kind: BindingKind;
}

export interface Provisioned {
  environment: Environment;
  bindings: Binding[];
}

export interface Uploaded {
  provisioned: Provisioned;
  build: Build;
}

export interface Activation {
  /** Where the environment answers. */
  url: string;
}

export interface Hosting {
  /** Creates the resources the manifest asks for, for this environment. */
  provision(environment: Environment, manifest: Manifest): Promise<Provisioned>;
  /** Sends a build's Worker with its bindings. */
  upload(provisioned: Provisioned, build: Build): Promise<Uploaded>;
  /** Applies the build's pending migrations to the environment's database, before traffic switches. */
  migrate(uploaded: Uploaded, options?: MigrateOptions): Promise<MigrateResult>;
  /** Makes the environment serve this build. */
  activate(uploaded: Uploaded): Promise<Activation>;
  /** Deletes the environment and its resources. */
  teardown(environment: Environment): Promise<void>;
}

/** The bindings a tool's resources become: one D1, KV, R2 or queue per declared resource. */
export function bindingsOf(manifest: Manifest): Binding[] {
  const { resources } = manifest;
  const bindings: Binding[] = [];
  if (resources.db) bindings.push({ name: "DB", kind: "d1" });
  if (resources.cache) bindings.push({ name: "CACHE", kind: "kv" });
  if (resources.files) bindings.push({ name: "FILES", kind: "r2" });
  if (resources.queue) bindings.push({ name: "QUEUE", kind: "queue" });
  return bindings;
}

export function environmentKey({ tool, name, branch }: Environment): string {
  return [tool, name, branch].filter(Boolean).join(":");
}

export { applyMigrations, migrationStatus, MigrationError, revertMigrations } from "./migrate";
export type {
  BuildMigration,
  D1Database,
  MigrateOptions,
  MigrateResult,
  MigrationErrorCode,
  MigrationStatement,
} from "./migrate";
