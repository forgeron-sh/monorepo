// Receiving a build from CI (sdk.md §4 and §15): `POST /deploy`, authenticated by a deployment
// token (`FORGERON_TOKEN`), and `POST /deploy-tokens`, where an administrator issues one. The
// platform builds nothing: the body is the build CI already made. Each deployment lands in the
// environment's history (who, when, which version) through `deployBuild`.
import type { Build, DeployOptions, Hosting } from "@forgeron/hosting";
import {
  closePreview,
  deployBuild,
  type Registry,
  type RegisteredEnvironment,
} from "@forgeron/registry";
import { audienceOf, parseAudience } from "../identity/audience";
import type { Person } from "../identity/authenticate";
import { issueToken, verifyToken } from "../identity/tokens";

/** The only scope a deployment token has today. */
export const DEPLOY_SCOPE = "deploy";

const NAME = /^[a-z0-9][a-z0-9-]{0,39}$/;
const ENVIRONMENTS: RegisteredEnvironment[] = ["preview", "pilot", "production"];
const DAY = 24 * 60 * 60;
const MAX_DAYS = 365;

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
const fail = (status: number, code: string, message: string) =>
  json(status, { error: { code, message } });

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

export interface TokenIssuerContext {
  /** The workspace the request was dispatched to. */
  workspace: string;
  secret: string;
  now(): Date;
  /** The person behind the request (session or personal token); `undefined` if anonymous. */
  authenticate(request: Request): Person | undefined | Promise<Person | undefined>;
}

/**
 * `POST /deploy-tokens` `{ tool, name, scope: "deploy", days }`: a deployment token for one tool
 * of this workspace, shown once. Only an administrator of the workspace may issue one.
 */
export async function handleCreateDeployToken(
  request: Request,
  context: TokenIssuerContext,
): Promise<Response> {
  if (request.method !== "POST") return fail(405, "METHOD_NOT_ALLOWED", "Use POST.");
  const person = await context.authenticate(request);
  if (!person) return fail(401, "UNAUTHENTICATED", "Sign in to create a deployment token.");
  if (!person.roles.includes("admin")) {
    return fail(403, "FORBIDDEN", "Only an administrator can create a deployment token.");
  }

  const body = await bodyOf(request);
  if (!body) return fail(400, "INVALID", "The body must be a JSON object.");
  const { tool, name, scope, days } = body;
  if (typeof name !== "string" || !NAME.test(name)) {
    return fail(400, "INVALID", "name: use a-z, 0-9 and '-', up to 40 characters.");
  }
  if (scope !== DEPLOY_SCOPE) {
    return fail(400, "INVALID", `scope: "${DEPLOY_SCOPE}" is the only scope.`);
  }
  if (typeof days !== "number" || !Number.isInteger(days) || days < 1 || days > MAX_DAYS) {
    return fail(400, "INVALID", `days: a whole number from 1 to ${MAX_DAYS}.`);
  }
  if (typeof tool !== "string") return fail(400, "INVALID", "tool: the name of the tool.");
  try {
    audienceOf(context.workspace, tool);
  } catch (error) {
    return fail(400, "INVALID", error instanceof Error ? error.message : String(error));
  }

  const now = context.now();
  const token = await issueToken({
    secret: context.secret,
    person: `deploy:${name}`,
    workspace: context.workspace,
    tool,
    ttlSeconds: days * DAY,
    now,
    scope: DEPLOY_SCOPE,
  });
  return json(201, {
    token,
    name,
    scope: DEPLOY_SCOPE,
    workspace: context.workspace,
    tool,
    expiresAt: new Date(now.getTime() + days * DAY * 1000).toISOString(),
  });
}

export interface DeployContext {
  workspace: string;
  secret: string;
  now(): Date;
  registry: Registry;
  hosting: Hosting;
  /**
   * Fills the new database of a preview with the tool's seed. The gateway cannot run the tool's
   * code itself, so whoever assembles it says how (`preview.data: seed` leaves it empty without).
   */
  seed?: (build: Build) => DeployOptions["seed"];
}

/**
 * `POST /deploy` `{ environment, branch?, version, build, allowDestructive? }`, with
 * `Authorization: Bearer $FORGERON_TOKEN`. The tool is the token's, never the body's: a token
 * for `crm` cannot deploy another tool, nor a build whose manifest names another.
 */
export async function handleDeploy(request: Request, context: DeployContext): Promise<Response> {
  if (request.method === "DELETE") return handleClosePreview(request, context);
  if (request.method !== "POST") return fail(405, "METHOD_NOT_ALLOWED", "Use POST or DELETE.");
  const token = /^Bearer (\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) return fail(401, "UNAUTHENTICATED", "Send the deployment token as FORGERON_TOKEN.");
  const check = await verifyToken(token, {
    secret: context.secret,
    now: context.now(),
    scope: DEPLOY_SCOPE,
  });
  if (!check.ok) {
    return fail(401, "UNAUTHENTICATED", `This is not a valid deployment token (${check.reason}).`);
  }
  const audience = parseAudience(check.claims.aud);
  if (!audience || audience.workspace !== context.workspace) {
    return fail(403, "FORBIDDEN", "This token was not issued for this workspace.");
  }

  const body = await bodyOf(request);
  if (!body) return fail(400, "INVALID", "The body must be a JSON object.");
  const { environment, branch, version, build, allowDestructive, group } = body;
  if (!ENVIRONMENTS.includes(environment as RegisteredEnvironment)) {
    return fail(400, "INVALID", `environment: one of ${ENVIRONMENTS.join(", ")}.`);
  }
  if (environment === "preview" && (typeof branch !== "string" || branch === "")) {
    return fail(400, "INVALID", "branch: a preview is tied to a branch.");
  }
  if (typeof version !== "string" || version === "") {
    return fail(400, "INVALID", "version: the number to publish.");
  }
  if (group !== undefined && (typeof group !== "string" || !NAME.test(group))) {
    return fail(400, "INVALID", "group: a name of a-z, 0-9 and '-', up to 40 characters.");
  }
  if (group !== undefined && environment !== "pilot") {
    return fail(400, "INVALID", "group: only the pilot has a group.");
  }
  const uploaded = build as Partial<Build> | null;
  const manifestName = (uploaded?.manifest as { name?: unknown } | undefined)?.name;
  if (
    !uploaded ||
    typeof uploaded.worker !== "string" ||
    typeof uploaded.fingerprint !== "string" ||
    typeof manifestName !== "string"
  ) {
    return fail(400, "INVALID", "build: a manifest, a worker and a fingerprint.");
  }
  if (manifestName !== audience.tool) {
    return fail(403, "FORBIDDEN", `This token is for "${audience.tool}", not "${manifestName}".`);
  }

  const { registry } = context;
  const tool =
    (await registry.findTool(context.workspace, audience.tool)) ??
    (await registry.createTool({ workspace: context.workspace, name: audience.tool }));
  const seed = context.seed?.(uploaded as Build);
  try {
    const deployed = await deployBuild(registry, context.hosting, {
      tool,
      environment: environment as RegisteredEnvironment,
      ...(typeof branch === "string" && branch ? { branch } : {}),
      actor: check.claims.sub,
      ...(seed ? { seed } : {}),
      build: uploaded as Build,
      version,
      ...(typeof group === "string" ? { group } : {}),
      ...(allowDestructive === true ? { allowDestructive: true } : {}),
    });
    return json(200, {
      tool: tool.name,
      version: deployed.version.version,
      environment: environment,
      url: deployed.activation.url,
      applied: deployed.applied,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fail(500, "DEPLOY_FAILED", message);
  }
}

/**
 * `DELETE /deploy` `{ branch }`, with the deployment token of the tool: the branch was merged or
 * deleted, so its preview goes with its Worker, its database and everything it owns (CI calls it).
 * Removing a preview that is already gone succeeds.
 */
async function handleClosePreview(request: Request, context: DeployContext): Promise<Response> {
  const token = /^Bearer (\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];
  if (!token) return fail(401, "UNAUTHENTICATED", "Send the deployment token as FORGERON_TOKEN.");
  const check = await verifyToken(token, {
    secret: context.secret,
    now: context.now(),
    scope: DEPLOY_SCOPE,
  });
  if (!check.ok) {
    return fail(401, "UNAUTHENTICATED", `This is not a valid deployment token (${check.reason}).`);
  }
  const audience = parseAudience(check.claims.aud);
  if (!audience || audience.workspace !== context.workspace) {
    return fail(403, "FORBIDDEN", "This token was not issued for this workspace.");
  }
  const body = await bodyOf(request);
  const branch = body?.branch;
  if (typeof branch !== "string" || branch === "") {
    return fail(400, "INVALID", "branch: the branch whose preview to remove.");
  }
  // The tool is the token's, never the body's.
  const tool = await context.registry.findTool(context.workspace, audience.tool);
  if (!tool) return json(200, { tool: audience.tool, branch, removed: false });
  try {
    await closePreview(context.registry, context.hosting, tool, branch);
  } catch (error) {
    return fail(500, "DEPLOY_FAILED", error instanceof Error ? error.message : String(error));
  }
  return json(200, { tool: tool.name, branch, removed: true });
}
