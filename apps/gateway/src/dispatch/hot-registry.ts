// The registry as the path of a call to a tool reads it (D-143). A call used to ask the platform's D1 about
// the same things again and again (the tool, its environments, its manifest, the person, their teams, the
// matrix of access) and each question is a trip to the database. Here the answers are kept in the memory
// of the Worker for a few seconds, so that the calls of a person who is working hit the database once.
//
// What keeps this safe:
// - the answers are kept for seconds, never longer (`IDENTITY_TTL`, `CATALOG_TTL`): an edit made in another
//   instance of the Worker applies within that time;
// - a write made through this Worker empties the memory at once, before and after it runs, so the person who
//   made the change does not wait for anything;
// - a failure is never kept, and a call that is already running is shared, not repeated;
// - what is secret is never kept: a person's secrets are read at each call.

import type { Registry } from "@forgeron/registry";

/** Who the person is and what they may do: what a revocation or a change of team must reach quickly. */
const IDENTITY_TTL_MS = 5_000;
/** The tool, its versions and who may use it: changes at a deployment or a click in the console. */
const CATALOG_TTL_MS = 10_000;

const IDENTITY = [
  "findMember",
  "teamsOfMember",
  "platformPermissionsOf",
  "isTokenRevoked",
  "availabilityOf",
  "isInstalled",
  "channelAccessOf",
  "isChannelInstalled",
  "readUserSetup",
];
const CATALOG = [
  "findTool",
  "listEnvironments",
  "environmentsOfTool",
  "getVersion",
  "getBuild",
  "servedBuild",
  "currentManifest",
  "accessFor",
  "accessGrants",
  "accessExceptions",
  "listMembers",
  "listTeams",
];
const TTL = new Map<string, number>([
  ...IDENTITY.map((name): [string, number] => [name, IDENTITY_TTL_MS]),
  ...CATALOG.map((name): [string, number] => [name, CATALOG_TTL_MS]),
]);

/**
 * What does not change what the cached reads would answer, so it does not empty the memory: a read, and
 * the counters and the log a call writes. Anything else is a write.
 */
const READS = /^(find|list|get|read|count|is)[A-Z]/;
const WRITES_THAT_CHANGE_NOTHING_READ = new Set([
  "recordSeat",
  "recordUsage",
  "recordActionCall",
  "recordAudit",
]);
const READ_NAMES = new Set([
  ...TTL.keys(),
  "availabilityOf",
  "channelAccessOf",
  "libraryOf",
  "channelsOf",
  "docsOf",
  "guideOf",
  "readmeOf",
  "assetOf",
  "accessMatrix",
  "toolSource",
  "toolByRepository",
  "usageReport",
  "secretNames",
  "secretsStatus",
  "userSecretHolders",
  "history",
  "permanentChannels",
  "versionsOfBranch",
  "pendingVersions",
  "previousVersion",
  "unapproved",
]);
const changesNothing = (name: string) =>
  READS.test(name) || READ_NAMES.has(name) || WRITES_THAT_CHANGE_NOTHING_READ.has(name);

/** Most answers kept at once: a Worker that lives long does not grow without end. */
const MAX_ENTRIES = 2_000;

const isThenable = (value: unknown): value is PromiseLike<unknown> =>
  typeof (value as { then?: unknown } | null)?.then === "function";

export interface HotRegistry {
  /** The registry for everything but the hot path: it reads the database, and its writes empty the memory. */
  tracked: Registry;
  /** The registry for the path of a call: the reads above are kept for a few seconds. */
  hot: Registry;
  /** Empties the memory (tests, and whatever knows that the database changed under it). */
  clear(): void;
}

export function createHotRegistry(
  registry: Registry,
  options: { now?: () => number } = {},
): HotRegistry {
  const now = options.now ?? (() => Date.now());
  const kept = new Map<string, { at: number; ttl: number; answer: Promise<unknown> }>();
  const clear = () => kept.clear();

  const tracked = new Proxy(registry, {
    get(target, name) {
      const value = Reflect.get(target, name, target) as unknown;
      if (typeof value !== "function" || typeof name !== "string" || changesNothing(name)) {
        return value;
      }
      return (...args: unknown[]) => {
        // Empty before (a read that starts during the write sees the database) and after (what a read that
        // began before the write brought back is stale by now).
        clear();
        const result = (value as (...a: unknown[]) => unknown).apply(target, args);
        return isThenable(result) ? Promise.resolve(result).finally(clear) : (clear(), result);
      };
    },
  });

  const answer = (name: string, ttl: number, args: unknown[], read: () => unknown) => {
    // The third argument of `accessFor` is a manifest the caller already has: it does not make another question.
    const asked = name === "accessFor" ? args.slice(0, 2) : args;
    const key = `${name}\u0000${JSON.stringify(asked)}`;
    const at = now();
    const found = kept.get(key);
    if (found && at - found.at < found.ttl) return found.answer;
    if (kept.size >= MAX_ENTRIES) clear();
    const pending = Promise.resolve(read());
    const entry = { at, ttl, answer: pending };
    kept.set(key, entry);
    // A failure is not an answer: the next call asks again.
    pending.catch(() => {
      if (kept.get(key) === entry) kept.delete(key);
    });
    return pending;
  };

  const hot: Registry = new Proxy(registry, {
    get(_target, name) {
      const value = Reflect.get(tracked, name, tracked) as unknown;
      if (typeof value !== "function") return value;
      const ttl = typeof name === "string" ? TTL.get(name) : undefined;
      return ttl === undefined
        ? (value as (...a: unknown[]) => unknown).bind(tracked)
        : (...args: unknown[]) =>
            // `this` is the hot registry: what a method reads of its own (`accessFor` reads the manifest)
            // is shared with the same read made at the same time, not asked again.
            answer(name as string, ttl, args, () =>
              (value as (...a: unknown[]) => unknown).apply(hot, args),
            );
    },
  });

  return { tracked, hot, clear };
}
