// Receiving a build from CI (sdk.md §4 and §15): `POST /deploy`, authenticated by a deployment
// token (`FORGERON_TOKEN`) or by GitHub Actions' identity token (D-123), and `POST /deploy-tokens`,
// where someone who holds `tools:write` issues a deployment token. The
// platform builds nothing: the body is the build CI already made. Each deployment lands in the
// environment's history (who, when, which version) through `deployBuild`.
import type { Build, DeployOptions, Hosting } from "@forgeron/hosting";
import {
  closePreview,
  deployBuild,
  docsProblem,
  isReleaseVersion,
  type DeploymentCommit,
  type Registry,
  type Tool,
} from "@forgeron/registry";
import { verifyActionsToken, type ActionsRun } from "../github/actions-oidc";
import { audienceOf, parseAudience } from "../identity/authn/audience";
import { looksLikeJwt } from "../identity/authn/jwt";
import { holds, PLATFORM } from "@forgeron/permissions";
import type { Person } from "../kernel/person";
import { issueToken, verifyToken } from "../identity/authn/tokens";
import { releaseReached } from "../sources/update";
import { viewsProblem } from "../views/check";

/** The only scope a deployment token has today. */
export const DEPLOY_SCOPE = "deploy";

const NAME = /^[a-z0-9][a-z0-9-]{0,39}$/;
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
 * of this workspace, shown once. Only someone who holds `tools:write` may issue one.
 */
export async function handleCreateDeployToken(
  request: Request,
  context: TokenIssuerContext,
): Promise<Response> {
  if (request.method !== "POST") return fail(405, "METHOD_NOT_ALLOWED", "Use POST.");
  const person = await context.authenticate(request);
  if (!person) return fail(401, "UNAUTHENTICATED", "Sign in to create a deployment token.");
  if (!holds(PLATFORM, person.permissions, "tools:write")) {
    return fail(
      403,
      "FORBIDDEN",
      "Creating a deployment token needs the permission \u201cBuild tools\u201d.",
    );
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

const clip = (value: string, max: number) => value.slice(0, max);

/**
 * The commit CI says the build comes from, kept for the console. `undefined` when none is sent,
 * `null` when what was sent is not one. The message is cut to its first line.
 */
function commitOf(value: unknown): DeploymentCommit | undefined | null {
  if (value === undefined) return undefined;
  if (typeof value !== "object" || value === null || Array.isArray(value)) return null;
  const { sha, message, author } = value as Record<string, unknown>;
  if (typeof sha !== "string" || !/^[0-9a-f]{7,64}$/i.test(sha)) return null;
  if (message !== undefined && typeof message !== "string") return null;
  if (author !== undefined && typeof author !== "string") return null;
  const first = message?.split("\n")[0]?.trim();
  return {
    sha: sha.toLowerCase(),
    ...(first ? { message: clip(first, 200) } : {}),
    ...(author?.trim() ? { author: clip(author.trim(), 100) } : {}),
  };
}

/** What `deployCaller` needs: the token secret, and GitHub's keys for a run of GitHub Actions. */
export interface CallerContext {
  workspace: string;
  secret: string;
  now(): Date;
  registry: Registry;
  /**
   * GitHub Actions (D-123): the audience a run's identity token must name (the workspace's address)
   * and the `fetch` that reads GitHub's keys. Without it, only deployment tokens are taken.
   */
  actions?: { audience: string; fetch: typeof fetch };
}

/**
 * Who deploys, and which tool: a deployment token carries its tool, a run of GitHub Actions is the
 * repository's, and the tool is the one linked to that repository in this workspace. `refused` is an
 * answer to give as it is; `reason` says why there is no deployment credential (none was sent, or a
 * token that is not a deployment token), and the caller decides whether a session may do instead.
 */
export type DeployCaller =
  | { ok: true; actor: string; tool: string; run?: ActionsRun }
  | { ok: false; refused: Response }
  | { ok: false; reason: string };

const bearerOf = (request: Request) =>
  /^Bearer (\S+)$/i.exec(request.headers.get("authorization") ?? "")?.[1];

export async function deployCaller(
  request: Request,
  context: CallerContext,
): Promise<DeployCaller> {
  const token = bearerOf(request);
  if (!token) return { ok: false, reason: "missing" };
  // A deployment token is `fgt.<claims>.<sig>`: three parts as well, so it is told apart first.
  if (!token.startsWith("fgt.") && looksLikeJwt(token) && context.actions) {
    let run: ActionsRun;
    try {
      run = await verifyActionsToken(token, {
        audience: context.actions.audience,
        now: context.now(),
        fetch: context.actions.fetch,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        refused: fail(
          401,
          "UNAUTHENTICATED",
          `This is not a valid GitHub Actions token: ${message}`,
        ),
      };
    }
    const tool = await context.registry.toolByRepository(context.workspace, {
      repo: run.repository,
      ...(run.repositoryId === undefined ? {} : { repoId: run.repositoryId }),
    });
    if (!tool) {
      return {
        ok: false,
        refused: fail(
          403,
          "FORBIDDEN",
          `No tool of this workspace comes from ${run.repository}: add it from GitHub in Forgeron first.`,
        ),
      };
    }
    return { ok: true, actor: `github:${run.repository}`, tool: tool.name, run };
  }
  const check = await verifyToken(token, {
    secret: context.secret,
    now: context.now(),
    scope: DEPLOY_SCOPE,
  });
  if (!check.ok) return { ok: false, reason: check.reason };
  const audience = parseAudience(check.claims.aud);
  if (!audience || audience.workspace !== context.workspace) {
    return {
      ok: false,
      refused: fail(403, "FORBIDDEN", "This token was not issued for this workspace."),
    };
  }
  return { ok: true, actor: check.claims.sub, tool: audience.tool };
}

const MISSING = "Send the deployment token as FORGERON_TOKEN, or deploy from GitHub Actions.";

export interface DeployContext extends CallerContext {
  hosting: Hosting;
  /**
   * Fills the new database of a preview with the tool's seed. The gateway cannot run the tool's
   * code itself, so whoever assembles it says how (`preview.data: seed` leaves it empty without).
   */
  seed?: (build: Build) => DeployOptions["seed"];
  /**
   * The person behind the request (session or CLI token). Closing a preview accepts a person who holds
   * `tools:write` as well as the tool's deployment token: the console's "Close preview".
   */
  authenticate?(request: Request): Person | undefined | Promise<Person | undefined>;
  /**
   * After a deployment, what GitHub is told (a commit status with the address, D-123). Best effort:
   * whatever it does, the deployment's answer is the same.
   */
  report?(
    tool: Tool,
    deployed: { sha: string; url: string; environment: string; branch?: string },
  ): Promise<unknown>;
}

/**
 * `POST /deploy` `{ branch, version, build, allowDestructive? }`, with `Authorization: Bearer
 * $FORGERON_TOKEN` or a GitHub Actions identity token. The tool is the credential's, never the body's:
 * a token for `crm` cannot deploy another tool, nor a build whose manifest names another. A build goes
 * to its branch's temporary channel only (D-125); when it is a release, the permanent channels that
 * follow the branch and update by themselves take it.
 */
export async function handleDeploy(request: Request, context: DeployContext): Promise<Response> {
  if (request.method === "DELETE") return handleClosePreview(request, context);
  if (request.method !== "POST") return fail(405, "METHOD_NOT_ALLOWED", "Use POST or DELETE.");
  const caller = await deployCaller(request, context);
  if (!caller.ok) {
    if ("refused" in caller) return caller.refused;
    return caller.reason === "missing"
      ? fail(401, "UNAUTHENTICATED", MISSING)
      : fail(401, "UNAUTHENTICATED", `This is not a valid deployment token (${caller.reason}).`);
  }

  const body = await bodyOf(request);
  if (!body) return fail(400, "INVALID", "The body must be a JSON object.");
  const { environment, branch, version, build, allowDestructive } = body;
  const commit = commitOf(body.commit);
  if (commit === null) {
    return fail(400, "INVALID", "commit: { sha, message?, author? } as strings.");
  }
  // A permanent channel takes the releases of the branch it follows, never a build sent to it (D-125).
  if (environment === "production") {
    return fail(
      400,
      "NOT_A_BRANCH",
      "A build goes to its branch. Production takes the releases of the branch it follows: release on that branch and push (`forgeron release`, then `git push --follow-tags`).",
    );
  }
  if (environment !== undefined && environment !== "preview") {
    return fail(400, "INVALID", "environment: preview, or nothing.");
  }
  if (typeof branch !== "string" || branch === "") {
    return fail(400, "INVALID", "branch: the branch that was pushed.");
  }
  // `~` names a permanent channel (`/t/<tool>~<name>`); Git refuses it in a branch name.
  if (branch.includes("~") || branch.length > 200) {
    return fail(400, "INVALID", "branch: not a branch name.");
  }
  if (typeof version !== "string" || version === "") {
    return fail(400, "INVALID", "version: the number to publish.");
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
  if (manifestName !== caller.tool) {
    return fail(403, "FORBIDDEN", `This token is for "${caller.tool}", not "${manifestName}".`);
  }

  // The views are served on the workspace origin: names and sizes are checked here too (D-134).
  const views = viewsProblem(uploaded.views);
  if (typeof views === "string") return fail(400, "INVALID", views);

  // The documentation is shown to every member: check it again, whatever the CLI did (D-061).
  const docs = await docsProblem(uploaded.manifest!, uploaded.docs);
  if (docs) return fail(400, "INVALID", docs);

  const { registry } = context;
  const tool =
    (await registry.findTool(context.workspace, caller.tool)) ??
    (await registry.createTool({ workspace: context.workspace, name: caller.tool }));
  const seed = context.seed?.(uploaded as Build);
  try {
    const deployed = await deployBuild(registry, context.hosting, {
      tool,
      environment: "preview",
      branch,
      actor: caller.actor,
      ...(seed ? { seed } : {}),
      ...(commit ? { commit } : {}),
      build: uploaded as Build,
      version,
      ...(allowDestructive === true ? { allowDestructive: true } : {}),
    });
    // A release reaches the permanent channels that follow its branch (D-125): each that updates by
    // itself takes it when nothing stops it. Never fails the deployment.
    const source = await registry.toolSource(tool.id);
    const channels =
      source.kind === "repo" && (await isReleaseVersion(registry, deployed.version))
        ? await releaseReached(registry, context.hosting, tool, branch, caller.actor)
        : [];
    const reached = channels.find((c) => c.channel === "production");
    const production = reached
      ? "version" in reached
        ? { version: reached.version }
        : { waiting: reached.waiting }
      : undefined;
    // GitHub shows the address beside the commit. Never fails the deployment.
    const sha = commit?.sha ?? caller.run?.sha;
    if (sha && context.report) {
      await context
        .report(tool, {
          sha,
          url: deployed.activation.url,
          environment: "preview",
          branch,
        })
        .catch(() => undefined);
    }
    return json(200, {
      tool: tool.name,
      version: deployed.version.version,
      environment: "preview",
      url: deployed.activation.url,
      applied: deployed.applied,
      ...(production ? { production } : {}),
      ...(channels.length ? { channels } : {}),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return fail(500, "DEPLOY_FAILED", message);
  }
}

/**
 * `DELETE /deploy` `{ branch }`, with the deployment token of the tool or its repository's run: the branch was merged or
 * deleted, so its preview goes with its Worker, its database and everything it owns (CI calls it).
 * Removing a preview that is already gone succeeds.
 */
async function handleClosePreview(request: Request, context: DeployContext): Promise<Response> {
  let toolName: string | undefined;
  let named: unknown;
  const body = await bodyOf(request);
  const caller = await deployCaller(request, context);
  if (caller.ok) {
    // The tool is the credential's, never the body's.
    toolName = caller.tool;
  } else if ("refused" in caller) {
    return caller.refused;
  } else if (caller.reason !== "missing") {
    return fail(401, "UNAUTHENTICATED", `This is not a valid deployment token (${caller.reason}).`);
  } else {
    const person = await context.authenticate?.(request);
    if (!person) return fail(401, "UNAUTHENTICATED", MISSING);
    if (!holds(PLATFORM, person.permissions, "tools:write")) {
      return fail(403, "FORBIDDEN", "This needs the permission \u201cBuild tools\u201d.");
    }
    named = body?.tool;
    if (typeof named !== "string" || named === "") {
      return fail(400, "INVALID", "tool: the name of the tool.");
    }
    toolName = named;
  }
  const branch = body?.branch;
  if (typeof branch !== "string" || branch === "") {
    return fail(400, "INVALID", "branch: the branch whose preview to remove.");
  }
  const tool = await context.registry.findTool(context.workspace, toolName);
  if (!tool) return json(200, { tool: toolName, branch, removed: false });
  try {
    await closePreview(context.registry, context.hosting, tool, branch);
  } catch (error) {
    return fail(500, "DEPLOY_FAILED", error instanceof Error ? error.message : String(error));
  }
  return json(200, { tool: tool.name, branch, removed: true });
}
