import type { Manifest } from "@forgeron/manifest";
import { matchesCron, parseCron, zoneFormatter } from "./cron";
import type {
  ActionContext,
  ErrorCode,
  Failure,
  Fetch,
  CallSource,
  Interface,
  Logger,
  Outcome,
  Platform,
  QueuedDelivery,
  RuntimeAction,
  RuntimeOptions,
  User,
} from "./types";
import { HTTP_STATUS } from "./types";

// Runs an action for an interface: exposure, access, validation, `ctx`, errors (sdk.md §6, §7).
// It knows nothing of HTTP or JSON-RPC: the routes turn its outcome into a response.

const CODES = new Set<string>(Object.keys(HTTP_STATUS));

/** Recognised by shape, so that the runtime needs no import of `@forgeron/sdk`. */
function toolFailure(error: unknown): Failure | undefined {
  if (!(error instanceof Error) || error.name !== "ToolError") return undefined;
  const { code, details } = error as Error & { code?: unknown; details?: unknown };
  if (typeof code !== "string" || !CODES.has(code) || code === "INTERNAL") return undefined;
  return details === undefined
    ? { code: code as ErrorCode, message: error.message }
    : { code: code as ErrorCode, message: error.message, details };
}

class Forbidden extends Error {
  readonly code = "FORBIDDEN";
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}

function hostAllowed(host: string, patterns: readonly string[]): boolean {
  const lower = host.toLowerCase();
  return patterns.some((pattern) => {
    const p = pattern.toLowerCase();
    return p.startsWith("*.") ? lower.endsWith(p.slice(1)) : lower === p;
  });
}

/** Outbound calls are forbidden by default: only `resources.network.allow` goes through. */
function filteredFetch(base: Fetch, allow: readonly string[], log: Logger): Fetch {
  return (url, init) => {
    const host = new URL(url).hostname;
    if (!hostAllowed(host, allow)) {
      const message = `Outbound calls to "${host}" are not allowed by resources.network.`;
      log.warn(message, { url });
      throw new Forbidden(message);
    }
    return base(url, init);
  };
}

function unavailable(name: string): never {
  throw new Error(`ctx.${name} is not provided by this runtime.`);
}

function missing(name: string): unknown {
  return new Proxy({}, { get: () => unavailable(name) });
}

const failure = (code: ErrorCode, message: string, details?: unknown): Outcome => ({
  ok: false,
  error: details === undefined ? { code, message } : { code, message, details },
});

const isInterface = (via: CallSource): via is Interface => via !== "job" && via !== "tool";

interface ListedAction {
  name: string;
  entry: Manifest["actions"][string];
}

export interface Engine {
  /** The actions this person may call through this interface. */
  list(user: User, via: Interface): ListedAction[];
  invoke(user: User, via: CallSource, name: string, rawInput: unknown): Promise<Outcome>;
  /** Runs a `queue` handler that the platform's queue handed back. Throws on failure, to be retried. */
  deliver(delivery: QueuedDelivery): Promise<void>;
  /** Runs a scheduled task now, as the tool. */
  runJob(name: string): Promise<void>;
  /** The tasks whose cron expression matches this minute, in their time zone. */
  jobsDue(now: Date): string[];
}

// A `queue` handler is retried three times after its first failure (sdk.md §9).
const RETRIES = 3;
// A handler that emits what leads back to itself would never end.
const MAX_DEPTH = 8;

export function createEngine(options: RuntimeOptions): Engine {
  const { manifest, actions } = options;
  const events = options.events ?? {};
  const jobs = options.jobs ?? {};
  for (const name of Object.keys(manifest.actions)) {
    if (!actions[name])
      throw new Error(`The manifest declares "${name}" but no code implements it.`);
  }
  for (const name of Object.keys(manifest.events)) {
    if (!events[name])
      throw new Error(
        `The manifest declares the event handler "${name}" but no code implements it.`,
      );
  }
  for (const name of Object.keys(manifest.jobs)) {
    if (!jobs[name])
      throw new Error(`The manifest declares the task "${name}" but no code implements it.`);
  }

  // Parsed once, so that a bad expression or time zone fails at startup, not at the first tick.
  const defaultZone = options.timeZone ?? "UTC";
  const schedules = Object.entries(manifest.jobs).map(([name, job]) => ({
    name,
    cron: parseCron(job.cron),
    zone: zoneFormatter(job.timezone ?? defaultZone),
  }));

  const env = options.env ?? "local";
  const platform: Platform = {
    secrets: {},
    userSecrets: {},
    connectors: {},
    fetch: (url, init) => fetch(url, init),
    files: missing("files"),
    cache: missing("cache"),
    tools: {},
    log: console,
    emit: () => {},
    now: () => new Date(),
    ...options.platform,
  };
  // Only a tool that declared `resources.db` has one; the platform gives it, or says it did not.
  const db = manifest.resources.db ? (platform.db ?? missing("db")) : undefined;
  const outbound = filteredFetch(
    platform.fetch,
    manifest.resources.network?.allow ?? [],
    platform.log,
  );

  const grants = (user: User): Set<string> =>
    new Set(user.roles.flatMap((role) => manifest.roles[role]?.grants ?? []));

  // The one access check, for every interface: a role may call an action if the console says so,
  // else if one of its levels is the action's. The person may if one of their roles may.
  const mayCall = (user: User, name: string, level: string): boolean =>
    user.roles.some(
      (role) => user.access?.[role]?.[name] ?? (manifest.roles[role]?.grants ?? []).includes(level),
    );

  // A call from a task or another tool does not go through an interface: it is not hidden by `interfaces`.
  const exposed = (name: string, via: CallSource): RuntimeAction | undefined => {
    const entry = manifest.actions[name];
    if (!entry) return undefined;
    if (via === "job" || via === "tool") return actions[name];
    return manifest.interfaces[via] && entry.interfaces.includes(via) ? actions[name] : undefined;
  };

  const handlersOf = (event: string) =>
    Object.entries(manifest.events).filter(([, handler]) => handler.event === event);

  // `ctx.emit`: `sync` handlers run now, inside the caller, and an error of theirs is the caller's
  // error; `queue` handlers wait in `queued` until the caller has succeeded.
  function emitter(user: User, queued: QueuedDelivery[], depth: number): ActionContext["emit"] {
    return async (event, payload) => {
      if (depth >= MAX_DEPTH) {
        throw new Error(
          `"${event}" is emitted ${MAX_DEPTH} levels deep: a handler leads back to itself.`,
        );
      }
      await platform.emit(event, payload);
      for (const [name, handler] of handlersOf(event)) {
        if (handler.mode === "queue") queued.push({ handler: name, event, payload, user });
        else await runHandler({ handler: name, event, payload, user }, queued, depth + 1);
      }
    };
  }

  async function runHandler(
    { handler, payload, user }: QueuedDelivery,
    queued: QueuedDelivery[],
    depth: number,
  ): Promise<void> {
    await events[handler]!.handler({
      payload,
      user,
      emit: emitter(user, queued, depth),
      secrets: platform.secrets,
      fetch: outbound,
      db,
      log: platform.log,
      now: platform.now,
      env,
    });
  }

  // After the caller succeeded: hand each `queue` delivery to the platform's queue, or run it here,
  // with its retries, when there is none.
  async function dispatch(queued: QueuedDelivery[]): Promise<void> {
    for (const delivery of queued.splice(0)) {
      try {
        if (platform.enqueue) {
          await platform.enqueue(delivery);
          continue;
        }
        for (let attempt = 0; ; attempt++) {
          const next: QueuedDelivery[] = [];
          try {
            await runHandler(delivery, next, 1);
            await dispatch(next);
            break;
          } catch (error) {
            if (attempt >= RETRIES) throw error;
            platform.log.warn(
              `"${delivery.handler}" failed, retry ${attempt + 1} of ${RETRIES}.`,
              String(error),
            );
          }
        }
      } catch (error) {
        platform.log.error(
          `The handler "${delivery.handler}" of "${delivery.event}" failed.`,
          error,
        );
      }
    }
  }

  return {
    list(user, via) {
      return Object.entries(manifest.actions)
        .filter(([name, entry]) => exposed(name, via) && mayCall(user, name, entry.access))
        .map(([name, entry]) => ({ name, entry }));
    },

    async invoke(user, via, name, rawInput) {
      const entry = manifest.actions[name];
      const impl = exposed(name, via);
      if (!entry || !impl) return failure("NOT_FOUND", `Unknown action "${name}".`);

      // Before anything else, so that a refused person learns nothing about the input.
      const allowed = grants(user);
      if (!mayCall(user, name, entry.access)) {
        return failure("FORBIDDEN", `The access level "${entry.access}" is required.`);
      }

      const parsed = impl.input.safeParse(rawInput ?? {});
      if (!parsed.success) {
        return failure("INVALID", "The input is not valid.", parsed.error?.issues);
      }

      // Per-person secrets, first use: the caller's own values, or the list of what is missing.
      let userSecrets = platform.userSecrets;
      const declared = Object.entries(manifest.resources.userSecrets ?? {});
      if (platform.userSecretStore && declared.length > 0 && isInterface(via)) {
        const own = await platform.userSecretStore.read(user);
        const missingOnes = declared.filter(([secret]) => !own[secret]);
        if (missingOnes.length > 0) {
          const inputUrl = `${(options.baseUrl ?? "").replace(/\/+$/, "")}/secrets`;
          return failure(
            "SECRET_REQUIRED",
            `Your ${missingOnes.map(([, s]) => s.label).join(", ")} is needed first: enter it at ${inputUrl}`,
            {
              inputUrl,
              missing: missingOnes.map(([secret, s]) => ({
                name: secret,
                label: s.label,
                ...(s.help ? { help: s.help } : {}),
                why: s.why,
              })),
            },
          );
        }
        userSecrets = Object.fromEntries(declared.map(([secret]) => [secret, own[secret]]));
      }

      const queued: QueuedDelivery[] = [];
      const ctx: ActionContext = {
        input: parsed.data,
        user,
        can: (level) => allowed.has(level),
        interface: via,
        emit: emitter(user, queued, 0),
        secrets: platform.secrets,
        userSecrets,
        connectors: platform.connectors,
        fetch: outbound,
        files: platform.files,
        cache: platform.cache,
        db,
        tools: platform.tools,
        log: platform.log,
        now: platform.now,
        env,
      };

      try {
        const result = await impl.run(ctx);
        if (impl.output) {
          const checked = impl.output.safeParse(result);
          if (!checked.success) {
            platform.log.error(
              `The output of "${name}" does not match its schema.`,
              checked.error?.issues,
            );
            return failure("INTERNAL", "Internal error.");
          }
          await dispatch(queued);
          return { ok: true, result: checked.data };
        }
        await dispatch(queued);
        return { ok: true, result };
      } catch (error) {
        const known = toolFailure(error);
        if (known) return { ok: false, error: known };
        // The detail stays in the log, never returned to the caller.
        platform.log.error(`"${name}" failed.`, error);
        return failure("INTERNAL", "Internal error.");
      }
    },

    async deliver(delivery) {
      if (!events[delivery.handler])
        throw new Error(`Unknown event handler "${delivery.handler}".`);
      const next: QueuedDelivery[] = [];
      await runHandler(delivery, next, 1);
      await dispatch(next);
    },

    async runJob(name) {
      const job = jobs[name];
      if (!job) throw new Error(`Unknown scheduled task "${name}".`);
      // The task acts as the tool: no person, so no access level and no per-person secret.
      const user: User = {
        id: `tool:${manifest.name}`,
        email: "",
        name: `tool:${manifest.name}`,
        roles: [],
      };
      const queued: QueuedDelivery[] = [];
      await job.handler({
        input: undefined,
        user,
        can: () => false,
        interface: "job",
        emit: emitter(user, queued, 0),
        secrets: platform.secrets,
        userSecrets: {},
        connectors: platform.connectors,
        fetch: outbound,
        files: platform.files,
        cache: platform.cache,
        db,
        tools: platform.tools,
        log: platform.log,
        now: platform.now,
        env,
      });
      await dispatch(queued);
    },

    jobsDue(now) {
      return schedules.filter((s) => matchesCron(s.cron, now, s.zone)).map((s) => s.name);
    },
  };
}
