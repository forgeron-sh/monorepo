import { handleCall } from "./api";
import { handleCli } from "./cli";
import { createEngine } from "./engine";
import { errorResponse } from "./http";
import { handleMcp } from "./mcp";
import type { CallSource, Outcome, QueuedDelivery, RuntimeOptions, User } from "./types";

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

  return {
    invoke: (user, action, input, via = "tool") => engine.invoke(user, via, action, input),
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
      const user = await options.authenticate(request);
      if (!user) {
        return errorResponse(
          { code: "UNAUTHENTICATED", message: "Sign in to call this tool." },
          401,
        );
      }
      const path = new URL(request.url).pathname.replace(/\/+$/, "") || "/";
      const actionOf = (prefix: string) => decodeURIComponent(path.slice(prefix.length));

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
}
