import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// Where a tool comes from, its channels and their updates (D-121, D-125). A tool is installed from a
// marketplace (its latest release, updated when a newer one is published) or deployed by a GitHub
// repository's CI (each pushed branch a temporary channel). Its permanent channels (production, and
// the ones an admin adds) each follow a branch and take only its releases. An admin reads what an
// update would bring, then updates the channel, approving in the same step what it asks for. An
// admin also adds a tool from a repository, and copies a branch's data into another branch.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const body = <T extends z.ZodType>(schema: T) => ({
  required: true,
  content: { "application/json": { schema } },
});
const notSignedIn = json(ErrorSchema, "Not signed in");
const notAdmin = json(ErrorSchema, "Not an admin");
const params = z.object({ tool: z.string() });
const REPO = /^[A-Za-z0-9-]{1,39}\/[A-Za-z0-9._-]{1,100}$/;
const branchName = z.string().min(1).max(200);

const planConflict = z.strictObject({
  code: z.string().describe("`MIGRATION_MISSING`, `CHANGELOG_NO_ENTRY`, `PENDING_APPROVAL`…"),
  subject: z.string().optional().describe("A migration, a resource"),
  message: z.string(),
});

/** The plan of an update (D-113, D-125): what it would do and what stops it. */
export const UpdatePlanSchema = z.strictObject({
  tool: z.string(),
  version: z.string().describe("The release that would go to the channel"),
  from: z.strictObject({ branch: z.string() }).optional(),
  to: z.strictObject({ channel: z.string(), currentVersion: z.string().optional() }),
  alreadyServed: z.boolean(),
  ok: z.boolean().describe("No conflict: it can go"),
  conflicts: z.array(planConflict),
  requiresAllowDestructive: z.boolean(),
  migrations: z.strictObject({
    checked: z.boolean().describe("False when the channel's database could not be read"),
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

/** What an update would bring: the release, and what an admin is asked before it goes. */
export const AvailableUpdateSchema = z.strictObject({
  version: z.string(),
  /** For a repository tool: the branch it was released on. */
  branch: z.string().optional(),
  /** The changelog lines of the release. */
  changelog: z.array(z.string()),
  /** What it asks for that production does not have (`resources.network`…): approved with the update. */
  approvals: z.array(z.string()),
  /** What stops it, found before anything moves, when the gateway could check. */
  plan: UpdatePlanSchema.optional(),
});

/** A permanent channel (D-125): production, or one an admin added. */
export const ChannelSchema = z.strictObject({
  /** `production`, or the name an admin gave. */
  name: z.string(),
  /** The branch whose releases it takes; absent for a marketplace tool. */
  follows: z.string().optional(),
  /** It takes a release by itself when the release asks for nothing new. */
  autoUpdate: z.boolean(),
  /** The version it serves, or `null`. */
  serves: z.string().nullable(),
  /** Where it answers: `/t/<tool>/`, `/t/<tool>~<name>/`. */
  address: z.string(),
  /** The release that waits for it, or `null`. */
  update: AvailableUpdateSchema.nullable(),
});

export const ToolSourceSchema = z.strictObject({
  kind: z.enum(["marketplace", "repo"]),
  /** `official`, or the id of a marketplace of the workspace. */
  marketplace: z.string().optional(),
  repo: z.string().optional(),
  /** The branch production follows. */
  productionBranch: z.string(),
  /** Production takes a release by itself. */
  autoUpdate: z.boolean(),
  /** The version production serves, or `null`. */
  production: z.string().nullable(),
  /** Production's update. */
  update: AvailableUpdateSchema.nullable(),
  /** Every permanent channel, production first. */
  channels: z.array(ChannelSchema),
});

export const getToolSourceRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/source",
  summary: "Where a tool comes from, and the update waiting for it",
  tags: ["sources"],
  request: { params },
  responses: {
    200: json(ToolSourceSchema, "The source"),
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such tool"),
  },
});

export const putToolSourceRoute = defineRoute({
  method: "put",
  path: "/api/tools/{tool}/source",
  summary: "Whether a release goes to production by itself, and which branch production follows",
  tags: ["sources"],
  request: {
    params,
    body: body(
      z.object({
        autoUpdate: z.boolean().optional(),
        productionBranch: branchName.optional(),
      }),
    ),
  },
  responses: {
    200: json(ToolSourceSchema, "The source now"),
    400: json(ErrorSchema, "Not a setting"),
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such tool"),
  },
});

export const updateToolRoute = defineRoute({
  method: "post",
  path: "/api/tools/{tool}/update",
  summary: "Put the waiting release on a permanent channel (production by default)",
  tags: ["sources"],
  request: {
    params,
    body: body(
      z.object({
        /** The permanent channel: production when absent. */
        channel: z.string().min(1).max(30).optional(),
        /** Approves, in the same step, what the update asks for. */
        approve: z.boolean().optional(),
        /** A pending destructive migration may run (it drops or rewrites data). */
        allowDestructive: z.boolean().optional(),
        /** The version the admin read: refused if the update changed since (`STALE`). */
        version: z.string().min(1).max(200),
      }),
    ),
  },
  responses: {
    200: json(
      z.strictObject({ tool: z.string(), channel: z.string(), version: z.string() }),
      "The channel serves it",
    ),
    400: json(ErrorSchema, "Not a request"),
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such tool or channel, or no update waiting (`NO_UPDATE`)"),
    409: json(
      ErrorSchema,
      "The update changed (`STALE`), waits for approvals (`PENDING_APPROVAL`) or a migration refused (`MIGRATION_REFUSED`)",
    ),
    422: json(ErrorSchema, "Not a release (`NO_ENTRY`) or a release that declares too little"),
    501: json(ErrorSchema, "This gateway cannot deploy (`NOT_CONFIGURED`)"),
  },
});

const channelName = z.string().regex(/^[a-z][a-z0-9-]{0,29}$/);
const channelParams = z.object({ tool: z.string(), channel: z.string() });

export const addChannelRoute = defineRoute({
  method: "post",
  path: "/api/tools/{tool}/channels",
  summary: "Add a permanent channel that follows a branch (D-125)",
  tags: ["sources"],
  request: {
    params,
    body: body(
      z.object({
        name: channelName,
        /** The branch whose releases it takes; a repository tool only. */
        follows: branchName.optional(),
        autoUpdate: z.boolean().optional(),
      }),
    ),
  },
  responses: {
    201: json(ChannelSchema, "The channel, serving nothing yet"),
    400: json(ErrorSchema, "Not a name a channel can take, or no branch to follow"),
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such tool"),
    409: json(ErrorSchema, "The tool already has a channel of that name"),
  },
});

export const putChannelRoute = defineRoute({
  method: "put",
  path: "/api/tools/{tool}/channels/{channel}",
  summary: "Change the branch a permanent channel follows, or whether it updates by itself",
  tags: ["sources"],
  request: {
    params: channelParams,
    body: body(
      z.object({
        follows: branchName.optional(),
        autoUpdate: z.boolean().optional(),
      }),
    ),
  },
  responses: {
    200: json(ChannelSchema, "The channel now"),
    400: json(ErrorSchema, "Not a setting"),
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such tool or channel"),
  },
});

export const removeChannelRoute = defineRoute({
  method: "delete",
  path: "/api/tools/{tool}/channels/{channel}",
  summary: "Remove a permanent channel, with its Worker and its database (never production)",
  tags: ["sources"],
  request: {
    params: channelParams,
    body: body(z.object({ /** The channel's name, typed by the admin. */ confirm: z.string() })),
  },
  responses: {
    200: json(z.strictObject({ removed: z.literal(true) }), "Removed"),
    400: json(ErrorSchema, "Not confirmed, or production"),
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such tool or channel"),
    501: json(ErrorSchema, "This gateway cannot deploy (`NOT_CONFIGURED`)"),
  },
});

export const addRepositoryToolRoute = defineRoute({
  method: "post",
  path: "/api/tools/from-repository",
  summary: "Add a tool that a GitHub repository's CI deploys, with its deployment token",
  tags: ["sources"],
  request: {
    body: body(
      z.object({
        name: z.string().regex(/^[a-z][a-z0-9-]{0,39}$/),
        repo: z.string().regex(REPO),
        productionBranch: branchName.optional(),
      }),
    ),
  },
  responses: {
    201: json(
      z.strictObject({
        tool: z.string(),
        repo: z.string(),
        productionBranch: z.string(),
        /** `FORGERON_TOKEN` for the repository's secrets: shown once. */
        token: z.string(),
        expiresAt: z.string(),
      }),
      "The tool, and the token its CI deploys with",
    ),
    400: json(ErrorSchema, "Not a tool name or a repository"),
    401: notSignedIn,
    403: notAdmin,
    409: json(ErrorSchema, "The workspace already has a tool of that name"),
    501: json(ErrorSchema, "This gateway cannot issue tokens (`NOT_CONFIGURED`)"),
  },
});

export const copyBranchDataRoute = defineRoute({
  method: "post",
  path: "/api/tools/{tool}/branches/{branch}/data",
  summary: "Replace a branch's data by another branch's (never production's)",
  tags: ["sources"],
  request: {
    params: z.object({ tool: z.string(), branch: z.string() }),
    body: body(
      z.object({
        from: branchName,
        /** The tool's name, typed by the admin: the target's data is replaced. */
        confirm: z.string(),
      }),
    ),
  },
  responses: {
    200: json(
      z.strictObject({
        tables: z.array(z.strictObject({ name: z.string(), rows: z.number().int() })),
      }),
      "What was copied",
    ),
    400: json(ErrorSchema, "Not confirmed, the same branch, or not a request"),
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such tool, or a branch with no preview"),
    409: json(ErrorSchema, "The two databases are not on the same migrations (`SCHEMA_DIFFERS`)"),
    413: json(ErrorSchema, "The source has too many rows (`TOO_LARGE`)"),
    501: json(ErrorSchema, "This gateway cannot reach the databases (`NOT_CONFIGURED`)"),
  },
});
