// The platform updating itself from the console (D-138). One module for the whole of it: what is
// newer (`state`), the run that updates (`start`) and what a run says (`run`). The order of a run is
// the decision's:
//
//   1. download the release's artifact, check its sha256, format, version and size
//   2. take a Time Travel restore point of the platform D1 (none, no update)
//   3. apply the artifact's migrations (the running gateway applies the new schema, as the CLI does)
//   4. keep the new code and console in the platform D1
//   5. upload a new version of this Worker through the path that binds a tool (D-032), every binding
//      inherited, and deploy it at 100 %
//
// Each step is written to the platform D1 as it starts and ends, so the console can poll it. The
// request answers 202 and the work goes on in `defer` (`ctx.waitUntil`): see `start`.
import {
  applyMigrations,
  checkMigrations,
  createCloudflareClient,
  type D1Database,
  type GatewayBindings,
} from "@forgeron/hosting";
import {
  UPDATE_BLOCKED_CODES,
  type UpdateBlocked,
  type UpdateRun as UpdateRunBody,
  type UpdateState,
} from "@forgeron/platform-contract";
import {
  RegistryError,
  saveGatewayAssets,
  saveGatewayCode,
  type Registry,
  type UpdateRun,
  type UpdateStep,
  type UpdateStepName,
} from "@forgeron/registry";
import type { GatewayEnv } from "../env";
import { downloadArtifact } from "./artifact";
import { createReleases, DEFAULT_UPDATE_REPOSITORY, REPOSITORY, type Release } from "./releases";
import { compareVersions } from "./version";

/**
 * A run that has not ended after this long is a run the Worker was cut short in (work after the
 * answer is cancelled 30 seconds after it): it is ended as failed so that it does not block the next.
 */
const STALE_AFTER_MS = 10 * 60_000;
const PREVIEW_TTL_MS = 10 * 60_000;

type Store = Pick<
  Registry,
  | "startUpdateRun"
  | "saveUpdateSteps"
  | "finishUpdateRun"
  | "interruptStaleUpdates"
  | "findRunningUpdate"
  | "getUpdateRun"
  | "listUpdateRuns"
>;

export interface UpdateOptions {
  env: GatewayEnv;
  /** Reaches GitHub (the release and its artifact) and Cloudflare (the restore point, the new version). */
  fetch: () => typeof fetch;
  now: () => Date;
  /** Runs work after the answer (`ctx.waitUntil`); without it the work is awaited. */
  defer?: (work: Promise<unknown>) => void;
  /** The release this gateway was built from. */
  current: { version: string; commit?: string };
  /** The gateway uploading a new version of itself (D-032), or `undefined` when it is not a self-host install. */
  gateway?: (fetcher: typeof fetch) => GatewayBindings | undefined;
}

export type StartResult =
  | { status: "started"; run: UpdateRunBody }
  | { status: "blocked"; blocked: UpdateBlocked }
  | { status: "running" }
  | { status: "not-newer"; current: string };

/** What the route handlers use. */
export interface PlatformUpdate {
  state(): Promise<UpdateState>;
  start(version: string, actor: string): Promise<StartResult>;
  run(id: string): Promise<UpdateRunBody | undefined>;
}

const blockedCode = (
  code: (typeof UPDATE_BLOCKED_CODES)[number],
  message: string,
): UpdateBlocked => ({
  code,
  message,
});

/** Why this install cannot update itself, from its own configuration; `undefined` when it can. */
function blockedByInstall(env: GatewayEnv): UpdateBlocked | undefined {
  const base = env.BASE_DOMAIN ?? "";
  if (env.DISPATCHER !== undefined || base === "forgeron.app" || base.endsWith(".forgeron.app")) {
    return blockedCode("CLOUD", "Forgeron Cloud is updated by its operator: nothing to do here.");
  }
  if ((env.SELF_UPDATE ?? "").trim().toLowerCase() === "off") {
    return blockedCode(
      "OFF",
      "Updating from the console is turned off on this install (SELF_UPDATE=off).",
    );
  }
  if (typeof env.GATEWAY_WORKER !== "string") {
    return blockedCode(
      "NOT_SELF_HOST",
      "This gateway was not installed with `forgeron platform install`, so it cannot update itself. Update it the way you installed it.",
    );
  }
  if (!env.CLOUDFLARE_ACCOUNT_ID || !env.CLOUDFLARE_API_TOKEN) {
    return blockedCode(
      "NO_CREDENTIALS",
      "This install holds no Cloudflare account or token. Run `forgeron platform install` once more.",
    );
  }
  if (!env.PLATFORM_D1_ID) {
    return blockedCode(
      "NO_DATABASE_ID",
      "Run `forgeron platform install` once more: this install does not know its database id yet.",
    );
  }
  return undefined;
}

/** The command that puts the database back to its restore point. */
export const restoreCommand = (database: string, bookmark: string) =>
  `wrangler d1 time-travel restore ${database} --bookmark ${bookmark}`;

const reason = (error: unknown) =>
  error instanceof Error && error.message ? error.message : "Something went wrong.";

const mb = (bytes: number) => `${(bytes / 1024 / 1024).toFixed(1)} MB`;

/** Built once per Worker: it holds what is cached in memory (the releases, the migrations of a release). */
export function createPlatformUpdates(options: UpdateOptions) {
  const { env, now } = options;
  const fetcher: typeof fetch = (input, init) => options.fetch()(input, init);
  const releases = createReleases({ fetch: fetcher, now });
  const repository = env.UPDATE_REPOSITORY?.trim() || DEFAULT_UPDATE_REPOSITORY;
  const previews = new Map<string, { at: number; migrations?: string[]; error?: string }>();

  const present = (run: UpdateRun): UpdateRunBody => {
    // The database may have changed from the migrations on: a failure from there says how to go back.
    const touched = run.steps.find((s) => s.name === "migrate")?.state !== "pending";
    return {
      id: run.id,
      from: run.fromVersion,
      to: run.toVersion,
      state: run.state,
      steps: run.steps,
      ...(run.bookmark ? { bookmark: run.bookmark } : {}),
      startedAt: run.startedAt,
      ...(run.finishedAt ? { finishedAt: run.finishedAt } : {}),
      ...(run.error ? { error: run.error } : {}),
      ...(run.state === "failed" && run.bookmark && touched && env.PLATFORM_D1_ID
        ? { restoreCommand: restoreCommand(env.PLATFORM_D1_ID, run.bookmark) }
        : {}),
    };
  };

  /** The migrations of a release this database has not applied: from the artifact, read once per ten minutes. */
  async function pendingOf(db: D1Database, version: string) {
    const at = now().getTime();
    let kept = previews.get(version);
    if (!kept || at - kept.at >= PREVIEW_TTL_MS) {
      try {
        const artifact = await downloadArtifact({ fetch: fetcher, repository, version });
        // Only the names are kept: the artifact itself is not held in memory between requests.
        kept = { at, migrations: artifact.migrations.map((m) => m.name) };
      } catch (error) {
        kept = { at, error: reason(error) };
      }
      previews.set(version, kept);
    }
    const failure = kept.error;
    if (failure !== undefined) return { error: failure };
    const applied = new Set(
      (
        (await db
          .prepare(`SELECT "name" FROM "_forgeron_migrations"`)
          .all()
          .catch(() => ({ results: [] }))) as { results?: { name: string }[] }
      ).results?.map((r) => r.name) ?? [],
    );
    return { migrations: (kept.migrations ?? []).filter((n) => !applied.has(n)).sort() };
  }

  const interrupted = (store: Store) =>
    store.interruptStaleUpdates(new Date(now().getTime() - STALE_AFTER_MS).toISOString());

  async function perform(store: Store, run: UpdateRun): Promise<void> {
    const steps: UpdateStep[] = run.steps.map((s) => ({ ...s }));
    const record = (bookmark?: string) => store.saveUpdateSteps(run.id, steps, bookmark);
    const step = (name: UpdateStepName) => steps.find((s) => s.name === name)!;
    let at: UpdateStepName = "download";
    const begin = async (name: UpdateStepName) => {
      at = name;
      step(name).state = "running";
      await record();
    };
    const end = async (message: string, bookmark?: string) => {
      const s = step(at);
      s.state = "done";
      s.message = message;
      await record(bookmark);
    };

    try {
      const db = env.DB;

      await begin("download");
      const artifact = await downloadArtifact({
        fetch: fetcher,
        repository,
        version: run.toVersion,
      });
      // Before anything changes: a release this database cannot take is refused here, not half way.
      const check = await checkMigrations(db, artifact.migrations);
      if (check.conflicts.length > 0) {
        throw new Error(
          `This release cannot be applied to this database: ${check.conflicts.map((c) => c.message).join(" ")}`,
        );
      }
      if (check.destructive.length > 0) {
        throw new Error(
          `This release has a migration that drops or rewrites data (${check.destructive.join(", ")}): it cannot be applied from the console. Run \`forgeron platform install\` from a checkout of the release.`,
        );
      }
      await end(`Downloaded ${mb(artifact.size)}; the checksum matches the release.`);

      await begin("restore-point");
      const cloudflare = createCloudflareClient({
        accountId: env.CLOUDFLARE_ACCOUNT_ID!,
        apiToken: env.CLOUDFLARE_API_TOKEN!,
        fetch: fetcher,
      });
      const { bookmark } = await cloudflare.request<{ bookmark?: string }>(
        "GET",
        `/d1/database/${env.PLATFORM_D1_ID}/time_travel/bookmark`,
      );
      if (!bookmark) throw new Error("Cloudflare gave no restore point for the database.");
      await end(`The database can be restored to ${bookmark}.`, bookmark);

      await begin("migrate");
      const { applied } = await applyMigrations(db, artifact.migrations);
      await end(
        applied.length
          ? `Applied ${applied.length} migration${applied.length === 1 ? "" : "s"}: ${applied.join(", ")}.`
          : "Nothing to migrate.",
      );

      await begin("code");
      await saveGatewayCode(db, artifact.worker);
      await saveGatewayAssets(db, artifact.assets);
      await end(
        `Kept the gateway and its ${artifact.assets.length} console file${artifact.assets.length === 1 ? "" : "s"}.`,
      );

      await begin("deploy");
      const gateway = options.gateway?.(fetcher);
      if (!gateway) throw new Error("This gateway cannot upload a new version of itself.");
      await gateway.redeploy();
      await end(`Version ${run.toVersion} is deployed at 100 %.`);

      await store.finishUpdateRun(run.id, { result: "succeeded", steps });
    } catch (error) {
      const message = reason(error);
      const failed = step(at);
      failed.state = "failed";
      failed.message = message;
      // What the person is told: the step, and what was done by then.
      const changed = step("migrate").state !== "pending";
      await store
        .finishUpdateRun(run.id, {
          result: "failed",
          steps,
          error: changed
            ? `${message} The database may already have changed: restore it to the restore point to go back.`
            : message,
        })
        .catch((cause: unknown) => {
          // The row is the only record: say so in the logs, never the error's detail.
          console.error(
            "platform update: the run could not be recorded",
            reason(cause).slice(0, 200),
          );
        });
    }
  }

  return {
    /** The updates as one registry sees them: the platform D1 is shared, any workspace's registry reads it. */
    of(store: Store): PlatformUpdate {
      const db = env.DB;
      return {
        async state(): Promise<UpdateState> {
          await interrupted(store);
          const running = await store.findRunningUpdate();
          const last = (await store.listUpdateRuns(1))[0];
          const base = {
            current: {
              version: options.current.version,
              ...(options.current.commit ? { commit: options.current.commit } : {}),
            },
            ...(running ? { running: present(running) } : {}),
            ...(last && last.state === "failed" ? { lastFailed: present(last) } : {}),
          };
          const blocked = blockedByInstall(env);
          if (blocked) return { ...base, available: false, blocked };
          if (!REPOSITORY.test(repository)) {
            return {
              ...base,
              available: false,
              blocked: blockedCode(
                "RELEASES_UNAVAILABLE",
                `UPDATE_REPOSITORY must be \`owner/name\`; it says \`${repository.slice(0, 80)}\`.`,
              ),
            };
          }
          let latest: Release | undefined;
          try {
            latest = await releases.latest(repository);
          } catch (error) {
            return {
              ...base,
              available: false,
              blocked: blockedCode("RELEASES_UNAVAILABLE", reason(error)),
            };
          }
          if (!latest) {
            return {
              ...base,
              available: false,
              blocked: blockedCode("RELEASES_UNAVAILABLE", `${repository} has no release yet.`),
            };
          }
          const available = compareVersions(latest.version, options.current.version) > 0;
          const answer = {
            ...base,
            latest: {
              version: latest.version,
              publishedAt: latest.publishedAt,
              url: latest.url,
              notes: latest.notes,
            },
            available,
          };
          if (!available) return answer;
          if (!latest.hasArtifact) {
            return {
              ...answer,
              blocked: blockedCode(
                "NO_ARTIFACT",
                `Release v${latest.version} carries no platform artifact: it cannot be installed from the console.`,
              ),
            };
          }
          if (running) return answer;
          const pending = await pendingOf(db, latest.version);
          if (pending.error !== undefined) {
            return { ...answer, blocked: blockedCode("NO_ARTIFACT", pending.error) };
          }
          return { ...answer, pending: { migrations: pending.migrations ?? [] } };
        },

        /**
         * Starts a run and answers with it at once; the work goes on in `defer` (`ctx.waitUntil`) and
         * the console polls the run. The alternative, answering when done, would keep the person's
         * request open for the whole update and cancel it, half way, if the tab closes. The price is
         * that a Worker's work after its answer is cut short after 30 seconds: a run that never ends
         * is found and ended as failed (`STALE_AFTER_MS`), with its restore point on record.
         */
        async start(version, actor): Promise<StartResult> {
          const blocked = blockedByInstall(env);
          if (blocked) return { status: "blocked", blocked };
          await interrupted(store);
          if (await store.findRunningUpdate()) return { status: "running" };
          if (compareVersions(version, options.current.version) <= 0) {
            return { status: "not-newer", current: options.current.version };
          }
          let run: UpdateRun;
          try {
            run = await store.startUpdateRun({
              fromVersion: options.current.version,
              toVersion: version,
              actor,
            });
          } catch (error) {
            if (error instanceof RegistryError && error.code === "ALREADY_EXISTS") {
              return { status: "running" };
            }
            throw error;
          }
          const work = perform(store, run);
          if (options.defer) options.defer(work);
          else await work;
          return { status: "started", run: present(run) };
        },

        async run(id) {
          await interrupted(store);
          const run = await store.getUpdateRun(id);
          return run ? present(run) : undefined;
        },
      };
    },
  };
}
