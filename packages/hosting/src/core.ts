// Deployment interface of a tool, whatever the hosting mode (docs/ARCHITECTURE.md, "Hosting modes").
// Neutral: plain data in and out, no Node API, so the gateway (a Worker) and the CLI can both use it.
// The implementations are separate: `./local` here, `./self-host` through the Cloudflare API; cloud comes later.
import type { Manifest } from "@forgeron/manifest";
import type { BuildMigration, D1Database, MigrateOptions, MigrateResult } from "./migrate";

export type EnvironmentName = "local" | "preview" | "production";

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
  /** `changelog.json`: what production checks before accepting the build (sdk.md §16). */
  changelog?: BuildChangelog;
  /** The README and the images it references (D-061); the manifest has their hashes. */
  docs?: BuildDocs;
}

/**
 * A built tool in one file, as `forgeron bundle` writes it (D-115): what a marketplace hands to a
 * platform that has no build step. `build` is the body of a deployment; `name` and `version` repeat the
 * manifest's, so a reader refuses a file that says one thing and carries another.
 */
export interface ToolBundle {
  format: typeof BUNDLE_FORMAT;
  name: string;
  version: string;
  build: Build;
}

export const BUNDLE_FORMAT = "forgeron.bundle/1";

/** The documentation of a build: `manifest.docs` lists the same files by hash. */
export interface BuildDocs {
  readme?: string;
  /** `GUIDE.md`: the tool explained to the people who use it, without technical detail (D-115). */
  guide?: string;
  assets: Array<{ path: string; type: string; size: number; hash: string; base64: string }>;
}

export type Impact = "none" | "patch" | "minor" | "major";

export interface BuildChangelog {
  /** The entries of this version. */
  entries: readonly unknown[];
  /** The strongest impact the entries declare. */
  declared: Impact;
  /** The impact found by comparing the manifest with the last release. */
  detected: Impact;
}

export type BindingKind = "d1" | "kv" | "r2" | "queue";

/** A resource of the manifest, as the Worker will find it in its `env`. */
export interface Binding {
  /** The name in `env`. */
  name: string;
  kind: BindingKind;
  /** Where the host made the resource (a database id, a namespace id, a bucket name), once provisioned. */
  id?: string;
  /** The host created it in this very `provision`: nothing was there before (a new branch's database). */
  fresh?: boolean;
}

export interface Provisioned {
  environment: Environment;
  bindings: Binding[];
}

export interface Uploaded {
  provisioned: Provisioned;
  build: Build;
  /** What the host calls the uploaded code, when it keeps it apart from what serves (self-host). */
  versionId?: string;
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
  /** The environment's database, to fill it (a preview's seed). Absent when the host cannot reach it. */
  database?(provisioned: Provisioned): D1Database | undefined;
  /**
   * The database of an environment that is already deployed, found by name: no deployment is
   * involved, so the gateway can read a tool's data (the console's database explorer). The caller
   * must only ever read from it. `undefined` when the environment has no database.
   */
  openDatabase?(environment: Environment): Promise<D1Database | undefined>;
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

const RANK: Record<Impact, number> = { none: 0, patch: 1, minor: 2, major: 3 };

export class ChangelogRefusal extends Error {
  override name = "ChangelogRefusal";
  readonly code: "NO_ENTRY" | "IMPACT_TOO_LOW";
  constructor(code: ChangelogRefusal["code"], message: string) {
    super(message);
    this.code = code;
  }
}

/**
 * Production takes a build only if the changelog covers the change; a preview is never
 * blocked (sdk.md §14, §16). A host calls it before it uploads.
 */
export function assertDeployable(environment: Environment, build: Build): void {
  if (environment.name !== "production") return;
  const { changelog } = build;
  if (!changelog || changelog.entries.length === 0) {
    throw new ChangelogRefusal(
      "NO_ENTRY",
      `${environment.name} takes a version with a changelog entry: run \`forgeron change\`, then \`forgeron release\`.`,
    );
  }
  if (RANK[changelog.declared] < RANK[changelog.detected]) {
    throw new ChangelogRefusal(
      "IMPACT_TOO_LOW",
      `The changelog declares ${changelog.declared}, but the manifest changed by ${changelog.detected}: declare ${changelog.detected} or more.`,
    );
  }
}

export function environmentKey({ tool, name, branch }: Environment): string {
  return [tool, name, branch].filter(Boolean).join(":");
}
