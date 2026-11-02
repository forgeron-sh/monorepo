import type { Manifest } from "@forgeron/manifest";
import type {
  ActionContext,
  ErrorCode,
  Failure,
  Fetch,
  CallSource,
  Interface,
  Outcome,
  Platform,
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
function filteredFetch(base: Fetch, allow: readonly string[]): Fetch {
  return (url, init) => {
    const host = new URL(url).hostname;
    if (!hostAllowed(host, allow)) {
      throw new Forbidden(`Outbound calls to "${host}" are not allowed by resources.network.`);
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

interface ListedAction {
  name: string;
  entry: Manifest["actions"][string];
}

export interface Engine {
  /** The actions this person may call through this interface. */
  list(user: User, via: Interface): ListedAction[];
  invoke(user: User, via: CallSource, name: string, rawInput: unknown): Promise<Outcome>;
}

export function createEngine(options: RuntimeOptions): Engine {
  const { manifest, actions } = options;
  for (const name of Object.keys(manifest.actions)) {
    if (!actions[name])
      throw new Error(`The manifest declares "${name}" but no code implements it.`);
  }

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
  const outbound = filteredFetch(platform.fetch, manifest.resources.network?.allow ?? []);

  const grants = (user: User): Set<string> =>
    new Set(user.roles.flatMap((role) => manifest.roles[role]?.grants ?? []));

  // A call from a task or another tool does not go through an interface: it is not hidden by `interfaces`.
  const exposed = (name: string, via: CallSource): RuntimeAction | undefined => {
    const entry = manifest.actions[name];
    if (!entry) return undefined;
    if (via === "job" || via === "tool") return actions[name];
    return manifest.interfaces[via] && entry.interfaces.includes(via) ? actions[name] : undefined;
  };

  return {
    list(user, via) {
      const allowed = grants(user);
      return Object.entries(manifest.actions)
        .filter(([name, entry]) => exposed(name, via) && allowed.has(entry.access))
        .map(([name, entry]) => ({ name, entry }));
    },

    async invoke(user, via, name, rawInput) {
      const entry = manifest.actions[name];
      const impl = exposed(name, via);
      if (!entry || !impl) return failure("NOT_FOUND", `Unknown action "${name}".`);

      // Before anything else, so that a refused person learns nothing about the input.
      const allowed = grants(user);
      if (!allowed.has(entry.access)) {
        return failure("FORBIDDEN", `The access level "${entry.access}" is required.`);
      }

      const parsed = impl.input.safeParse(rawInput ?? {});
      if (!parsed.success) {
        return failure("INVALID", "The input is not valid.", parsed.error?.issues);
      }

      const ctx: ActionContext = {
        input: parsed.data,
        user,
        can: (level) => allowed.has(level),
        interface: via,
        emit: platform.emit,
        secrets: platform.secrets,
        userSecrets: platform.userSecrets,
        connectors: platform.connectors,
        fetch: outbound,
        files: platform.files,
        cache: platform.cache,
        tools: platform.tools,
        log: platform.log,
        now: platform.now,
        env,
      };

      try {
        const result = await impl.run(ctx);
        if (!impl.output) return { ok: true, result };
        const checked = impl.output.safeParse(result);
        if (checked.success) return { ok: true, result: checked.data };
        platform.log.error(
          `The output of "${name}" does not match its schema.`,
          checked.error?.issues,
        );
        return failure("INTERNAL", "Internal error.");
      } catch (error) {
        const known = toolFailure(error);
        if (known) return { ok: false, error: known };
        // The detail stays in the log, never returned to the caller.
        platform.log.error(`"${name}" failed.`, error);
        return failure("INTERNAL", "Internal error.");
      }
    },
  };
}
