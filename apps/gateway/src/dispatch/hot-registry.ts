// The registry as the path of a call to a tool reads it (D-143, D-146). A call used to ask the platform's D1
// about the same things again and again (the tool, its environments, its manifest, the person, their teams,
// the matrix of access) and each question is a trip to the database. Here the answers are kept in the memory
// of the Worker, so that the calls of a person who is working hit the database once.
//
// What keeps this safe:
// - every change made through the gateway raises the registry's generation (one number in D1), and what is
//   kept is used as it is for the seconds of D-143, then, for minutes, while the generation it was read under is
//   still the current one: one small read, made at most once a second and sent with the other reads (D-146);
// - a write made through this Worker empties the memory at once, before and after it runs, so the person who
//   made the change does not wait for anything;
// - nothing is kept longer than a few minutes, and where the generation cannot be read, nothing is kept past
//   the seconds of D-143 (`IDENTITY_TTL`, `CATALOG_TTL`);
// - a failure is never kept, and a call that is already running is shared, not repeated;
// - what is secret is never kept: a person's secrets are read at each call.

import type { Registry } from "@forgeron/registry";

/** Who the person is and what they may do: what a revocation or a change of team must reach quickly. */
const IDENTITY_TTL_MS = 5_000;
/** The tool, its versions and who may use it: changes at a deployment or a click in the console. */
const CATALOG_TTL_MS = 10_000;
/** How long an answer is kept at most, when the generation says it is still true (D-146). */
const MAX_AGE_MS = 5 * 60_000;
/** How long the generation read last is trusted before it is read again (D-146). */
const CHECK_MS = 1_000;

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
  // Asked by `listTeams` at each read: it writes only the first time a workspace is read, the built-in teams
  // every reader would create the same way, and `listTeams` reads again after it. Treated as a write, it
  // emptied the memory at every read of the teams, and would raise the generation for every Worker (D-146).
  "ensureBuiltInTeams",
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
  "readRegistryGeneration",
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
  interface Kept {
    at: number;
    ttl: number;
    /** The generation the answer was read under, once known; `undefined` while unknown or unreadable. */
    generation?: number;
    answer: Promise<unknown>;
  }
  const kept = new Map<string, Kept>();
  // The generation as last read, when, and the read in flight (D-146).
  let generation: number | undefined;
  let checkedAt = Number.NEGATIVE_INFINITY;
  let checking: { at: number; read: Promise<number | undefined> } | undefined;
  const clear = () => {
    kept.clear();
    checkedAt = Number.NEGATIVE_INFINITY;
  };
  /** The current generation, read again when the last read is older than `CHECK_MS`; `undefined` if unreadable. */
  const current = (): Promise<number | undefined> => {
    const at = now();
    if (generation !== undefined && at - checkedAt < CHECK_MS) return Promise.resolve(generation);
    // A read in flight is shared while it is recent enough to be trusted itself.
    if (checking && at - checking.at < CHECK_MS) return checking.read;
    const read = Promise.resolve()
      .then(() => registry.readRegistryGeneration())
      .then(
        (n) => {
          // Trusted from when it was asked, not from when it answered: never longer than it should be.
          if (at >= checkedAt) {
            generation = n;
            checkedAt = at;
          }
          return n;
        },
        () => {
          generation = undefined;
          return undefined;
        },
      );
    const mine = { at, read };
    checking = mine;
    void read.finally(() => {
      if (checking === mine) checking = undefined;
    });
    return read;
  };
  /** Past its seconds, an answer is still true while the generation it was read under is the current one. */
  const stillTrue = (entry: Kept, generationNow: number | undefined, at: number) =>
    generationNow !== undefined && entry.generation === generationNow && at - entry.at < MAX_AGE_MS;

  const tracked = new Proxy(registry, {
    get(target, name) {
      const value = Reflect.get(target, name, target) as unknown;
      if (typeof value !== "function" || typeof name !== "string" || changesNothing(name)) {
        return value;
      }
      return (...args: unknown[]) => {
        // Empty before (a read that starts during the write sees the database) and after (what a read that
        // began before the write brought back is stale by now). The generation is raised after the write,
        // failed or not, so every other Worker reads again (D-146); raising it never fails the write.
        clear();
        const raise = () =>
          Promise.resolve()
            .then(() => target.bumpRegistryGeneration())
            .catch(() => undefined)
            .finally(clear);
        const result = (value as (...a: unknown[]) => unknown).apply(target, args);
        return isThenable(result) ? Promise.resolve(result).finally(raise) : (void raise(), result);
      };
    },
  });

  const remember = (
    key: string,
    ttl: number,
    read: () => unknown,
    checked: Promise<number | undefined>,
  ) => {
    if (kept.size >= MAX_ENTRIES) kept.clear();
    const pending = Promise.resolve(read());
    const entry: Kept = { at: now(), ttl, answer: pending };
    kept.set(key, entry);
    // The generation asked with the read (in the same batch, D-146) or before it: never a later one, so what
    // is kept is never thought newer than it is.
    void checked.then((n) => {
      entry.generation = n;
    });
    // A failure is not an answer: the next call asks again.
    pending.catch(() => {
      if (kept.get(key) === entry) kept.delete(key);
    });
    return pending;
  };

  const answer = (name: string, ttl: number, args: unknown[], read: () => unknown) => {
    // The third argument of `accessFor` is a manifest the caller already has: it does not make another question.
    const asked = name === "accessFor" ? args.slice(0, 2) : args;
    const key = `${name}\u0000${JSON.stringify(asked)}`;
    const found = kept.get(key);
    // Within the seconds of D-143 an answer is used as it is: no question at all.
    if (found && now() - found.at < found.ttl) return found.answer;
    // Past them, the generation says whether it is still true (D-146). Asked now, so that it goes with the
    // reads this call starts in the same turn.
    const checked = current();
    if (!found) return remember(key, ttl, read, checked);
    return checked.then((n) =>
      kept.get(key) === found && stillTrue(found, n, now())
        ? found.answer
        : remember(key, ttl, read, Promise.resolve(n)),
    );
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
