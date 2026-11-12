import { z } from "zod";
import { defineRoute } from "./route";

// The platform routes outside `/console-api`: the ones the CLI and CI call with a Bearer token (a
// deployment token, or the token of `forgeron login`), or a person's session for the console's own
// "Roll back" and "Close preview". Each answers its refusals as `{ error: { code, message } }`, not as
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
/** Where a rollback acts: production, a permanent channel (`channel`), or a branch's preview (D-125). */
const rollbackEnvironment = z.enum(["preview", "production", "channel"]);

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
  /**
   * After a release on the branch production follows (D-121, D-125): the version production took by
   * itself, or why it waits for an admin. Absent when production does not update by itself.
   */
  production: z
    .union([z.strictObject({ version: z.string() }), z.strictObject({ waiting: z.string() })])
    .optional(),
  /**
   * After a release on a branch that permanent channels follow (D-125): what each channel that
   * updates by itself did, production included.
   */
  channels: z
    .array(
      z.union([
        z.strictObject({ channel: z.string(), version: z.string() }),
        z.strictObject({ channel: z.string(), waiting: z.string() }),
      ]),
    )
    .optional(),
});

export const deployRoute = defineRoute({
  method: "post",
  path: "/deploy",
  summary: "Publish a build of a branch to its temporary channel",
  description:
    "With the tool's deployment token (`FORGERON_TOKEN`) or GitHub Actions' identity. The tool is the credential's, never the body's. A build goes to its branch's temporary channel only (D-125): a permanent channel takes the releases of the branch it follows, by itself or by an admin's update. `environment: production` is refused.",
  tags: ["cli"],
  request: {
    body: jsonBody(
      z.looseObject({
        environment: z.literal("preview").optional(),
        branch: z.string().describe("The branch that was pushed"),
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

const rollbackErrors = {
  400: refusal("The body is not valid"),
  401: refusal("Not signed in, and no deployment token"),
  403: refusal("Not an administrator, or a token for another tool"),
  404: refusal("No such tool, or no such version"),
  409: refusal("A migration is refused, there is nothing to go back to, or an approval is pending"),
  422: refusal("The changelog or the artifact refuses it"),
  500: refusal("It failed (`ROLLBACK_FAILED`)"),
  501: refusal("This gateway has no Cloudflare account to deploy to"),
};

export const rollbackRoute = defineRoute({
  method: "post",
  path: "/rollback",
  summary: "Serve the version a channel served before the current one",
  description:
    "With the tool's deployment token, or an administrator by session or by a token of `forgeron login` (who names the `tool`). The channel goes back to a version it served: no new code (D-125). No migration is applied or rolled back.",
  tags: ["cli"],
  request: {
    body: jsonBody(
      z.strictObject({
        tool: z.string().optional(),
        environment: rollbackEnvironment,
        branch: z.string().optional().describe("Required for a preview"),
        channel: z.string().optional().describe("Required for a permanent channel (`channel`)"),
        reason: z.string().max(500).optional(),
      }),
    ),
  },
  responses: {
    200: json(
      z.strictObject({
        tool: z.string(),
        version: z.string(),
        environment: rollbackEnvironment,
        channel: z.string().optional(),
        url: z.string().optional(),
      }),
      "Rolled back",
    ),
    ...rollbackErrors,
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
