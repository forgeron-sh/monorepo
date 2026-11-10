import { z } from "zod";
import { defineRoute } from "./route";

// The platform routes outside `/console-api`: the ones the CLI and CI call with a Bearer token (a
// deployment token, or the token of `forgeron login`), or a person's session for the console's own
// "Promote" and "Close preview". Each answers its refusals as `{ error: { code, message } }`, not as
// the console API's `{ error, message }`: this is the shape the CLI reads. The hand-written pages
// under `/auth/` (sign-in, the CLI's authorization page) are not routes of the API and stay as they are.

export const MAX_TOKEN_DAYS = 30;
export const MAX_DEPLOY_TOKEN_DAYS = 365;

/** The refusal of these routes: a code to branch on and a sentence to show. */
export const PlatformErrorSchema = z.strictObject({
  error: z.strictObject({ code: z.string(), message: z.string() }),
});

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const refusal = (description: string) => json(PlatformErrorSchema, description);
const jsonBody = <T extends z.ZodType>(schema: T) => ({
  required: true as const,
  content: { "application/json": { schema } },
});

const environment = z.enum(["preview", "production"]);

export const whoamiRoute = defineRoute({
  method: "get",
  path: "/whoami",
  summary: "Who the token or the session is",
  description: "A session cookie or `Authorization: Bearer` with a token of `forgeron login`.",
  tags: ["cli"],
  responses: {
    200: json(
      z.looseObject({
        id: z.string(),
        email: z.string(),
        name: z.string().optional(),
        roles: z.array(z.string()),
        workspace: z.string(),
      }),
      "The person and the workspace",
    ),
    401: refusal("Not signed in, or the token is not valid any more"),
  },
});

export const createDeployTokenRoute = defineRoute({
  method: "post",
  path: "/deploy-tokens",
  summary: "A deployment token for one tool, shown once",
  description:
    "Only an administrator of the workspace, by session or by a token of `forgeron login`.",
  tags: ["cli"],
  request: {
    body: jsonBody(
      z.strictObject({
        tool: z.string(),
        name: z.string().describe("`a-z`, `0-9` and `-`, up to 40 characters"),
        scope: z.literal("deploy"),
        days: z.number().int().min(1).max(MAX_DEPLOY_TOKEN_DAYS),
      }),
    ),
  },
  responses: {
    201: json(
      z.strictObject({
        token: z.string(),
        name: z.string(),
        scope: z.literal("deploy"),
        workspace: z.string(),
        tool: z.string(),
        expiresAt: z.string(),
      }),
      "The token, shown once",
    ),
    400: refusal("The body is not valid"),
    401: refusal("Not signed in"),
    403: refusal("Not an administrator"),
  },
});

const deployed = z.strictObject({
  tool: z.string(),
  version: z.string(),
  environment,
  url: z.string().optional(),
  applied: z.array(z.string()),
});

export const deployRoute = defineRoute({
  method: "post",
  path: "/deploy",
  summary: "Publish a build of the tool to an environment",
  description:
    "With the tool's deployment token (`FORGERON_TOKEN`). The tool is the token's, never the body's.",
  tags: ["cli"],
  request: {
    body: jsonBody(
      z.looseObject({
        environment,
        branch: z.string().optional().describe("Required for a preview"),
        version: z.string(),
        commit: z
          .strictObject({
            sha: z.string(),
            message: z.string().optional(),
            author: z.string().optional(),
          })
          .optional(),
        allowDestructive: z.boolean().optional(),
        build: z
          .looseObject({
            manifest: z.looseObject({ name: z.string() }),
            worker: z.string(),
            fingerprint: z.string(),
          })
          .describe(
            "The manifest, the worker, the fingerprint, and the optional migrations, changelog and docs",
          ),
      }),
    ),
  },
  responses: {
    200: json(deployed, "Deployed"),
    400: refusal("The body is not valid"),
    401: refusal("No valid deployment token"),
    403: refusal("The token is for another tool or workspace"),
    500: refusal("The deployment failed (`DEPLOY_FAILED`)"),
    501: refusal("This gateway has no Cloudflare account to deploy to"),
  },
});

export const closePreviewRoute = defineRoute({
  method: "delete",
  path: "/deploy",
  summary: "Remove the preview of a branch",
  description:
    "With the tool's deployment token, or an administrator by session (who names the `tool`). Removing a preview that is already gone succeeds.",
  tags: ["cli"],
  request: {
    body: jsonBody(z.strictObject({ branch: z.string(), tool: z.string().optional() })),
  },
  responses: {
    200: json(
      z.strictObject({ tool: z.string(), branch: z.string(), removed: z.boolean() }),
      "`removed` is false when there was no preview",
    ),
    400: refusal("The body is not valid"),
    401: refusal("No valid token"),
    403: refusal("Not allowed"),
    500: refusal("The removal failed (`DEPLOY_FAILED`)"),
    501: refusal("This gateway has no Cloudflare account to deploy to"),
  },
});

const promotionErrors = {
  400: refusal("The body is not valid"),
  401: refusal("Not signed in, and no deployment token"),
  403: refusal("Not an administrator, or a token for another tool"),
  404: refusal("No such tool, or no such version"),
  409: refusal("A migration is refused, there is nothing to go back to, or an approval is pending"),
  422: refusal("The changelog or the artifact refuses it"),
  500: refusal("It failed (`PROMOTE_FAILED`)"),
  501: refusal("This gateway has no Cloudflare account to deploy to"),
};

const planConflict = z.strictObject({
  code: z.string().describe("`MIGRATION_MISSING`, `CHANGELOG_NO_ENTRY`, `PENDING_APPROVAL`…"),
  subject: z.string().optional().describe("A migration, a resource"),
  message: z.string(),
});

/** The plan of a promotion (D-112): what it would do and what stops it. */
const promotionPlan = z.strictObject({
  tool: z.string(),
  version: z.string().describe("The version that would be promoted"),
  from: z.strictObject({ branch: z.string() }).optional(),
  to: z.strictObject({
    environment: environment,
    branch: z.string().optional(),
    currentVersion: z.string().optional(),
  }),
  alreadyServed: z.boolean(),
  ok: z.boolean().describe("No conflict: it can go"),
  conflicts: z.array(planConflict),
  requiresAllowDestructive: z.boolean(),
  migrations: z.strictObject({
    checked: z.boolean().describe("False when the target's database could not be read"),
    applied: z.array(z.string()),
    pending: z.array(z.string()),
    destructive: z.array(z.string()),
  }),
  changes: z.array(
    z.strictObject({
      kind: z.string(),
      subject: z.string(),
      impact: z.enum(["patch", "minor", "major"]),
      detail: z.string().optional(),
      needsApproval: z.literal(true).optional(),
    }),
  ),
  impact: z.enum(["none", "patch", "minor", "major"]),
  prompt: z.string().optional().describe("For an agent, when `ok` is false"),
});

export const promotionPlanRoute = defineRoute({
  method: "post",
  path: "/promote/plan",
  summary: "Can this version go to the environment, and what stops it",
  description:
    "Read only: the migrations are compared with the target's database without being applied. Name the version, or the branch whose preview serves it. Same callers as a promotion.",
  tags: ["cli"],
  request: {
    body: jsonBody(
      z.strictObject({
        tool: z.string().optional(),
        version: z.string().optional(),
        fromBranch: z.string().optional().describe("The branch whose preview serves the version"),
        to: environment,
        branch: z.string().optional().describe("Required for a preview target"),
      }),
    ),
  },
  responses: {
    200: json(promotionPlan, "The plan"),
    400: refusal("The body is not valid"),
    401: refusal("Not signed in, and no deployment token"),
    403: refusal("Not an administrator, or a token for another tool"),
    404: refusal("No such tool, version or branch"),
    501: refusal("This gateway has no Cloudflare account to deploy to"),
  },
});

export const promoteRoute = defineRoute({
  method: "post",
  path: "/promote",
  summary: "Put a version the tool already has on another environment",
  description:
    "With the tool's deployment token, or an administrator by session or by a token of `forgeron login` (who names the `tool`). Nothing is rebuilt.",
  tags: ["cli"],
  request: {
    body: jsonBody(
      z.strictObject({
        tool: z.string().optional(),
        version: z.string().optional().describe("Or `fromBranch`"),
        fromBranch: z.string().optional().describe("The branch whose preview serves the version"),
        to: environment,
        branch: z.string().optional().describe("Required for a preview"),
        allowDestructive: z.boolean().optional(),
        reason: z.string().max(500).optional(),
      }),
    ),
  },
  responses: { 200: json(deployed, "Promoted"), ...promotionErrors },
});

export const rollbackRoute = defineRoute({
  method: "post",
  path: "/rollback",
  summary: "Serve the version an environment served before the current one",
  description:
    "Who may call it is the same as for a promotion. No migration is applied or rolled back.",
  tags: ["cli"],
  request: {
    body: jsonBody(
      z.strictObject({
        tool: z.string().optional(),
        environment,
        branch: z.string().optional().describe("Required for a preview"),
        reason: z.string().max(500).optional(),
      }),
    ),
  },
  responses: {
    200: json(
      z.strictObject({
        tool: z.string(),
        version: z.string(),
        environment,
        url: z.string().optional(),
      }),
      "Rolled back",
    ),
    ...promotionErrors,
  },
});

export const issueTokenRoute = defineRoute({
  method: "post",
  path: "/auth/token",
  summary: "A personal token bound to one tool",
  description: "For a person signed in by session.",
  tags: ["cli"],
  request: {
    body: jsonBody(
      z.strictObject({ tool: z.string(), days: z.number().int().min(1).max(MAX_TOKEN_DAYS) }),
    ),
  },
  responses: {
    201: json(
      z.strictObject({
        token: z.string(),
        id: z.string().describe("Names the token to the revocation"),
        workspace: z.string(),
        tool: z.string(),
        expiresAt: z.string(),
      }),
      "The token, shown once",
    ),
    400: refusal("The body is not valid"),
    401: refusal("Not signed in"),
    404: refusal("No such tool"),
  },
});

export const revokeTokenRoute = defineRoute({
  method: "post",
  path: "/auth/token/revoke",
  summary: "Void one of the caller's tokens, or all of them",
  tags: ["cli"],
  request: {
    body: jsonBody(
      z.union([z.strictObject({ id: z.string() }), z.strictObject({ all: z.literal(true) })]),
    ),
  },
  responses: {
    200: json(z.strictObject({ revoked: z.string() }), "The id, or `all`"),
    400: refusal("The body is not valid"),
    401: refusal("Not signed in"),
  },
});

export const cliTokenRoute = defineRoute({
  method: "post",
  path: "/auth/cli/token",
  summary: "Trade the code of `forgeron login` for the person's CLI token",
  description: "The last step of the PKCE exchange; the code is used once.",
  tags: ["cli"],
  request: {
    body: jsonBody(
      z.strictObject({ code: z.string(), code_verifier: z.string(), redirect_uri: z.string() }),
    ),
  },
  responses: {
    200: json(z.strictObject({ token: z.string() }), "The CLI token"),
    400: refusal("The code is not valid, or has expired"),
  },
});
