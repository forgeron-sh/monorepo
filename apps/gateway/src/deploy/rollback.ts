// Rolling a channel back (sdk.md §5, §15): `POST /rollback`. The channel serves again a version it
// served before, from the code the registry holds: nothing is rebuilt, no new code arrives (D-033,
// D-125). The caller is a deployment token for the tool (CI), or a workspace administrator by session
// or `forgeron login` token: a developer or a plain member cannot move a permanent channel. There is
// no promotion between branches any more (D-125): a permanent channel takes the releases of the
// branch it follows, through its update (`/api/tools/{tool}/update`).
import { ChangelogRefusal, MigrationError, type Hosting } from "@forgeron/hosting";
import { rollbackEnvironment, RegistryError, type RegisteredEnvironment } from "@forgeron/registry";
import type { Person } from "../kernel/person";
import { deployCaller, type CallerContext } from "./deploy";

const ENVIRONMENTS: RegisteredEnvironment[] = ["preview", "production", "channel"];

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
const fail = (status: number, code: string, message: string) =>
  json(status, { error: { code, message } });

export interface PromoteContext extends CallerContext {
  hosting: Hosting;
  /** The door the call came through, when it is not the CLI (`VIA_FORGERON_MCP`). */
  via?: string;
  /** The person behind the request (session or CLI token); `undefined` if anonymous. */
  authenticate(request: Request): Person | undefined | Promise<Person | undefined>;
}

/** Who acts, and on which tool: a deployment token carries its tool, an administrator names one. */
type Actor = { actor: string; tool?: string; person: boolean } | Response;

async function actorOf(request: Request, context: PromoteContext): Promise<Actor> {
  // A deployment token, or a run of the tool's repository (D-123); anything else may be a person's.
  const caller = await deployCaller(request, context);
  if (caller.ok) return { actor: caller.actor, tool: caller.tool, person: false };
  if ("refused" in caller) return caller.refused;
  const person = await context.authenticate(request);
  if (!person) {
    return fail(
      401,
      "UNAUTHENTICATED",
      "Sign in with `forgeron login`, or send a deployment token as FORGERON_TOKEN.",
    );
  }
  if (!person.roles.includes("admin")) {
    return fail(403, "FORBIDDEN", "Only an administrator of the workspace can do this.");
  }
  return { actor: person.email, person: true };
}

async function bodyOf(request: Request): Promise<Record<string, unknown> | undefined> {
  try {
    const body: unknown = await request.json();
    return typeof body === "object" && body !== null && !Array.isArray(body)
      ? (body as Record<string, unknown>)
      : undefined;
  } catch {
    return undefined;
  }
}

/** A refusal of the rules is the caller's to fix (4xx); anything else is the platform's (500). */
function failed(error: unknown): Response {
  const message = error instanceof Error ? error.message : String(error);
  if (error instanceof ChangelogRefusal) return fail(422, error.code, message);
  if (error instanceof MigrationError) return fail(409, "MIGRATION_REFUSED", message);
  if (error instanceof RegistryError) {
    if (error.code === "NOT_FOUND") return fail(404, error.code, message);
    if (error.code === "PENDING_APPROVAL" || error.code === "NO_PREVIOUS") {
      return fail(409, error.code, message);
    }
    if (error.code === "NO_ARTIFACT" || error.code === "BRANCH_REQUIRED") {
      return fail(422, error.code, message);
    }
  }
  return fail(500, "ROLLBACK_FAILED", message);
}

/** The head of the route: method, caller, body, tool, environment, branch and channel. */
async function prepare(request: Request, context: PromoteContext, environmentKey: string) {
  if (request.method !== "POST") return fail(405, "METHOD_NOT_ALLOWED", "Use POST.");
  const who = await actorOf(request, context);
  if (who instanceof Response) return who;
  const body = await bodyOf(request);
  if (!body) return fail(400, "INVALID", "The body must be a JSON object.");
  const environment = body[environmentKey];
  if (!ENVIRONMENTS.includes(environment as RegisteredEnvironment)) {
    return fail(400, "INVALID", `${environmentKey}: one of ${ENVIRONMENTS.join(", ")}.`);
  }
  const { branch, reason } = body;
  if (reason !== undefined && (typeof reason !== "string" || reason.length > 500)) {
    return fail(400, "INVALID", "reason: a text of at most 500 characters.");
  }
  if (environment === "preview" && (typeof branch !== "string" || branch === "")) {
    return fail(400, "INVALID", "branch: a preview is tied to a branch.");
  }
  if (branch !== undefined && typeof branch !== "string") {
    return fail(400, "INVALID", "branch: a string.");
  }
  const { channel } = body;
  if (environment === "channel" && (typeof channel !== "string" || channel === "")) {
    return fail(400, "INVALID", "channel: the permanent channel's name.");
  }
  // A deployment token is for one tool: it cannot act on another, whatever the body says.
  const named = body.tool;
  if (named !== undefined && typeof named !== "string") {
    return fail(400, "INVALID", "tool: the name of the tool.");
  }
  if (who.tool !== undefined && named !== undefined && named !== who.tool) {
    return fail(403, "FORBIDDEN", `This token is for "${who.tool}", not "${named}".`);
  }
  const toolName = who.tool ?? named;
  if (!toolName) return fail(400, "INVALID", "tool: the name of the tool.");
  const tool = await context.registry.findTool(context.workspace, toolName);
  if (!tool) return fail(404, "NOT_FOUND", `There is no tool ${toolName}.`);
  return {
    actor: who.actor,
    person: who.person,
    tool,
    body,
    environment: environment as RegisteredEnvironment,
    ...(typeof branch === "string" && branch ? { branch } : {}),
    ...(environment === "channel" && typeof channel === "string" ? { channel } : {}),
    ...(typeof reason === "string" && reason.trim() ? { reason: reason.trim() } : {}),
  };
}

/**
 * `POST /rollback` `{ tool?, environment, branch?, channel? }`: the version the channel served before
 * the current one serves again. No migration is applied or rolled back.
 */
export async function handleRollback(request: Request, context: PromoteContext) {
  const ready = await prepare(request, context, "environment");
  if (ready instanceof Response) return ready;
  const { actor, tool, environment, branch, channel, reason } = ready;
  try {
    const rolled = await rollbackEnvironment(context.registry, context.hosting, {
      tool,
      environment,
      ...(branch ? { branch } : {}),
      ...(channel ? { channel } : {}),
      ...(reason ? { reason } : {}),
      ...(context.via ? { via: context.via } : {}),
      actor,
    });
    return json(200, {
      tool: tool.name,
      version: rolled.version.version,
      environment,
      ...(channel ? { channel } : {}),
      ...(rolled.environment.url ? { url: rolled.environment.url } : {}),
    });
  } catch (error) {
    return failed(error);
  }
}
