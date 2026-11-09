import { handleCall } from "./api";
import { handleCli } from "./cli";
import { createEngine, type SetupCandidate } from "./engine";
import { errorResponse } from "./http";
import { handleMcp } from "./mcp";
import { handleSecretsInput } from "./secrets";
import type { CallSource, Outcome, QueuedDelivery, RuntimeOptions, User } from "./types";

/** What the tool's setup check says about the values a person is about to give (D-101). */
export type SetupCheck =
  | { ok: true }
  | {
      ok: false;
      /** One sentence for the person. */
      message: string;
      /** A message per field (a plain field's name or a secret's), when the tool says which is wrong. */
      errors: Record<string, string>;
    };

export interface Runtime {
  /**
   * Answers a request whose path is relative to the tool: the gateway strips `/t/<tool>`.
   * `/mcp`, `/api/<action>`, `/cli`, and `/_f/call/<action>` for the views.
   */
  fetch(request: Request): Promise<Response>;
  /**
   * Runs an action for a person, as a call from another tool or a task: through access
   * and validation, but not hidden by `interfaces`. This is what tests call.
   */
  invoke(user: User, action: string, input?: unknown, via?: CallSource): Promise<Outcome>;
  /**
   * Runs the tool's `setup.check` action with the values a person is about to give, as the platform
   * (no access level is asked: it is not the person calling). The action reads `ctx.user.setup` and
   * `ctx.userSecrets` as these values and returns `{ errors: { field: "why" } }` to refuse some, or
   * nothing to accept them. A tool without a check accepts everything.
   */
  checkSetup(user: User, candidate: SetupCandidate): Promise<SetupCheck>;
  /** The queue consumer: runs a `queue` handler once; the platform retries when it throws. */
  deliver(delivery: QueuedDelivery): Promise<void>;
  /** Runs a scheduled task now (`forgeron jobs run`). */
  runJob(name: string): Promise<void>;
  /**
   * The cron trigger: runs the tasks due at `now` (a task named in its own time zone, the
   * workspace's by default) and returns their names. A failing task does not stop the others.
   */
  scheduled(now?: Date): Promise<string[]>;
}

/** Builds the Worker side of a tool: one action, four interfaces (sdk.md §7). */
export function createRuntime(options: RuntimeOptions): Runtime {
  const { manifest } = options;
  const engine = createEngine(options);
  const notFound = () => errorResponse({ code: "NOT_FOUND", message: "Not found." });

  const runtime: Runtime = {
    invoke: (user, action, input, via = "tool") => engine.invoke(user, via, action, input),
    async checkSetup(user, candidate) {
      const name = manifest.setup?.check;
      if (!name) return { ok: true };
      const outcome = await engine.invoke(user, "tool", name, {}, candidate);
      if (!outcome.ok) {
        // A refusal the tool wrote is for the person; anything else is not theirs to read.
        const known = outcome.error.code === "INVALID" || outcome.error.code === "FORBIDDEN";
        return {
          ok: false,
          message: known ? outcome.error.message : "The check could not be completed. Try again.",
          errors: {},
        };
      }
      const named = new Set([
        ...Object.keys(manifest.setup?.fields ?? {}),
        ...Object.keys(manifest.resources.userSecrets ?? {}),
      ]);
      const given = (outcome.result as { errors?: unknown } | null | undefined)?.errors;
      const errors = Object.fromEntries(
        Object.entries(given && typeof given === "object" ? given : {}).filter(
          (e): e is [string, string] => named.has(e[0]) && typeof e[1] === "string" && e[1] !== "",
        ),
      );
      return Object.keys(errors).length === 0
        ? { ok: true }
        : { ok: false, message: "Some values are not valid.", errors };
    },
    deliver: (delivery) => engine.deliver(delivery),
    runJob: (name) => engine.runJob(name),
    async scheduled(now = new Date()) {
      const due = engine.jobsDue(now);
      for (const name of due) {
        await engine.runJob(name).catch((error: unknown) => {
          (options.platform?.log ?? console).error(`The task "${name}" failed.`, error);
        });
      }
      return due;
    },
    async fetch(request) {
      const identity = await options.authenticate(request);
      const user = identity && "user" in identity ? identity.user : identity;
      if (!user) {
        return errorResponse(
          { code: "UNAUTHENTICATED", message: "Sign in to call this tool." },
          401,
        );
      }
      if (options.audience !== undefined) {
        const audience = identity && "user" in identity ? identity.audience : undefined;
        if (audience !== options.audience) {
          return errorResponse({
            code: "FORBIDDEN",
            message: `This token was not issued for "${options.audience}".`,
          });
        }
      }
      const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
      const actionOf = (prefix: string) => decodeURIComponent(path.slice(prefix.length));

      // The gateway asks the tool to check a setup before it keeps it (D-101). The header is one only the
      // gateway can set (the dispatcher drops it from callers), so on any other path this is a 404.
      if (
        path === "/_f/setup-check" &&
        request.method === "POST" &&
        request.headers.get("x-forgeron-setup-check") === "1"
      ) {
        const body = (await request.json().catch(() => ({}))) as {
          setup?: unknown;
          secrets?: unknown;
        };
        const strings = (value: unknown): Record<string, string> =>
          Object.fromEntries(
            Object.entries(value && typeof value === "object" ? value : {}).filter(
              (e): e is [string, string] => typeof e[1] === "string",
            ),
          );
        return Response.json(
          await runtime.checkSetup(user, {
            setup: strings(body.setup),
            secrets: strings(body.secrets),
          }),
          { headers: { "cache-control": "no-store" } },
        );
      }

      const store = options.platform?.userSecretStore;
      if (path === "/secrets" && store) {
        return handleSecretsInput(request, manifest, user, store, options.baseUrl ?? "");
      }
      if (path === "/mcp" && manifest.interfaces.mcp)
        return handleMcp(request, engine, manifest, user);
      if (path === "/cli" && manifest.interfaces.cli)
        return handleCli(request, engine, manifest, user);
      if (path.startsWith("/api/") && manifest.interfaces.api) {
        return handleCall(request, engine, manifest, user, "api", actionOf("/api/"));
      }
      if (path.startsWith("/_f/call/") && manifest.interfaces.web) {
        return handleCall(request, engine, manifest, user, "web", actionOf("/_f/call/"));
      }
      return notFound();
    },
  };
  return runtime;
}
