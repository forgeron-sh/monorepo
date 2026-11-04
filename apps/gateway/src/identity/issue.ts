import type { Registry } from "@forgeron/registry";
import type { Person } from "../kernel/person";
import { issueToken } from "./tokens";

// `POST /auth/token` `{ tool, days }`: a signed-in person asks for an API or CLI token bound to one
// tool of the workspace (D-015, sdk.md §7). The lifetime is the caller's choice, within a bound.

const DAY = 24 * 60 * 60;
/** The longest a personal token lives; it cannot be revoked before (D-015). */
const MAX_TOKEN_DAYS = 30;
/** The longest any token lives (CLI tokens, D-031, are 30 days too): how long a revocation is kept. */
export const LONGEST_TOKEN_SECONDS = MAX_TOKEN_DAYS * DAY;

const fail = (status: number, code: string, message: string) =>
  Response.json({ error: { code, message } }, { status });

export interface IssueContext {
  workspace: string;
  secret: string;
  registry: Registry;
  now(): Date;
  /** The person of the session cookie; `undefined` if there is none. */
  session(request: Request): Promise<Person | undefined>;
}

export async function handleIssueToken(request: Request, context: IssueContext) {
  if (request.method !== "POST") return fail(405, "METHOD_NOT_ALLOWED", "Use POST.");
  const person = await context.session(request);
  if (!person) return fail(401, "UNAUTHENTICATED", "Sign in to get a token.");

  let body: { tool?: unknown; days?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail(400, "INVALID", "The body must be a JSON object.");
  }
  const { tool, days } = body ?? {};
  if (typeof tool !== "string") return fail(400, "INVALID", "tool: the name of the tool.");
  if (typeof days !== "number" || !Number.isInteger(days) || days < 1 || days > MAX_TOKEN_DAYS) {
    return fail(400, "INVALID", `days: a whole number from 1 to ${MAX_TOKEN_DAYS}.`);
  }
  if (!(await context.registry.findTool(context.workspace, tool))) {
    return fail(404, "NOT_FOUND", `There is no tool ${tool}.`);
  }
  const now = context.now();
  const id = crypto.randomUUID();
  const token = await issueToken({
    jti: id,
    secret: context.secret,
    person: person.id,
    workspace: context.workspace,
    tool,
    ttlSeconds: days * DAY,
    now,
  });
  return Response.json(
    {
      token,
      /** Names this token to `POST /auth/token/revoke`. */
      id,
      workspace: context.workspace,
      tool,
      expiresAt: new Date(now.getTime() + days * DAY * 1000).toISOString(),
    },
    { status: 201, headers: { "cache-control": "no-store" } },
  );
}

export interface RevokeContext {
  workspace: string;
  registry: Registry;
  now(): Date;
  /** The person of the session cookie or of a CLI token: anyone may revoke their own tokens. */
  person(request: Request): Promise<Person | undefined>;
}

/**
 * `POST /auth/token/revoke` `{ id }` or `{ all: true }` (D-035): a person voids one of their own
 * tokens, named by the `id` that came with it, or every token they hold (those of `forgeron login`
 * included). Takes effect at once: the gateway checks the list at each call.
 */
export async function handleRevokeToken(request: Request, context: RevokeContext) {
  if (request.method !== "POST") return fail(405, "METHOD_NOT_ALLOWED", "Use POST.");
  const person = await context.person(request);
  if (!person) return fail(401, "UNAUTHENTICATED", "Sign in to revoke a token.");
  let body: { id?: unknown; all?: unknown } = {};
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return fail(400, "INVALID", "The body must be a JSON object.");
  }
  const { id, all } = body ?? {};
  if (all === true) {
    await context.registry.revokePersonTokens(context.workspace, person.id, LONGEST_TOKEN_SECONDS);
    return Response.json({ revoked: "all" });
  }
  if (typeof id !== "string" || id === "") {
    return fail(400, "INVALID", "id: the id of the token, or all: true.");
  }
  await context.registry.revokeToken(
    context.workspace,
    person.id,
    id,
    new Date(context.now().getTime() + LONGEST_TOKEN_SECONDS * 1000),
  );
  return Response.json({ revoked: id });
}
