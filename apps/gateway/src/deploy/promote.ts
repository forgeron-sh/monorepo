// Promoting a version and rolling an environment back (sdk.md §5, §15): `POST /promote` and
// `POST /rollback`. Both act on a version the registry already holds, so nothing is rebuilt and
// nothing is uploaded by the caller (D-033). The caller is a deployment token for the tool (CI), or
// a workspace administrator by session or `forgeron login` token: a developer or a plain member
// cannot move production.
import { ChangelogRefusal, MigrationError, type Hosting } from "@forgeron/hosting";
import {
  promoteVersion,
  rollbackEnvironment,
  RegistryError,
  type RegisteredEnvironment,
  type Registry,
} from "@forgeron/registry";
import { parseAudience } from "../identity/audience";
import type { Person } from "../identity/authenticate";
import { verifyToken } from "../identity/tokens";
import { DEPLOY_SCOPE } from "./deploy";

const ENVIRONMENTS: RegisteredEnvironment[] = ["preview", "production"];

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
const fail = (status: number, code: string, message: string) =>
  json(status, { error: { code, message } });

export interface PromoteContext {
  workspace: string;
  secret: string;
  now(): Date;
  registry: Registry;
  hosting: Hosting;
  /** The person behind the request (session or CLI token); `undefined` if anonymous. */
  authenticate(request: Request): Person | undefined | Promise<Person | undefined>;
}

/** Who acts, and on which tool: a deployment token carries its tool, an administrator names one. */
type Actor = { actor: string; tool?: string } | Response;

async function actorOf(request: Request, context: PromoteContext): Promise<Actor> {
  const token = /^Bearer (\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
  if (token) {
    const check = await verifyToken(token, {
      secret: context.secret,
      now: context.now(),
      scope: DEPLOY_SCOPE,
    });
    if (check.ok) {
      const audience = parseAudience(check.claims.aud);
      if (!audience || audience.workspace !== context.workspace) {
        return fail(403, "FORBIDDEN", "This token was not issued for this workspace.");
      }
      return { actor: check.claims.sub, tool: audience.tool };
    }
  }
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
  return { actor: person.email };
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
  return fail(500, "PROMOTE_FAILED", message);
}

/** The common head of both routes: method, caller, body, tool, environment and branch. */
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
  const { branch } = body;
  if (environment === "preview" && (typeof branch !== "string" || branch === "")) {
    return fail(400, "INVALID", "branch: a preview is tied to a branch.");
  }
  if (branch !== undefined && typeof branch !== "string") {
    return fail(400, "INVALID", "branch: a string.");
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
    tool,
    body,
    environment: environment as RegisteredEnvironment,
    ...(typeof branch === "string" && branch ? { branch } : {}),
  };
}

/**
 * `POST /promote` `{ tool?, version, to, branch?, allowDestructive? }`: puts a version the
 * tool already has on another environment, from the code recorded with its build. The target takes
 * it under the rules of a deployment: the changelog must cover the change (FOR-64), a destructive
 * migration needs `allowDestructive`, and what the version asks for must be approved.
 */
export async function handlePromote(request: Request, context: PromoteContext) {
  const ready = await prepare(request, context, "to");
  if (ready instanceof Response) return ready;
  const { actor, tool, body, environment, branch } = ready;
  const { version, allowDestructive } = body;
  if (typeof version !== "string" || version === "") {
    return fail(400, "INVALID", "version: the number to promote.");
  }
  try {
    const promoted = await promoteVersion(context.registry, context.hosting, {
      tool,
      version,
      to: environment,
      ...(branch ? { branch } : {}),
      ...(allowDestructive === true ? { allowDestructive: true } : {}),
      actor,
    });
    return json(200, {
      tool: tool.name,
      version: promoted.version.version,
      environment,
      url: promoted.activation.url,
      applied: promoted.applied,
    });
  } catch (error) {
    return failed(error);
  }
}

/**
 * `POST /rollback` `{ tool?, environment, branch? }`: the version the environment served before
 * the current one serves again. No migration is applied or rolled back.
 */
export async function handleRollback(request: Request, context: PromoteContext) {
  const ready = await prepare(request, context, "environment");
  if (ready instanceof Response) return ready;
  const { actor, tool, environment, branch } = ready;
  try {
    const rolled = await rollbackEnvironment(context.registry, context.hosting, {
      tool,
      environment,
      ...(branch ? { branch } : {}),
      actor,
    });
    return json(200, {
      tool: tool.name,
      version: rolled.version.version,
      environment,
      ...(rolled.environment.url ? { url: rolled.environment.url } : {}),
    });
  } catch (error) {
    return failed(error);
  }
}
