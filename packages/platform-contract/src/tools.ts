import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The tools of a workspace and what a tool's page reads (docs/sdk.md §15 and §17, docs/console-ux.md,
// "Tool page"). The list is for any signed-in member; the rest is for admins and developers: the
// commits, authors, audit lines and manifest of a tool are the team's, not the audience's.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const notSignedIn = json(ErrorSchema, "Not signed in");
const notForYou = json(ErrorSchema, "Lacks the permission");
const noTool = json(ErrorSchema, "No such tool");
const tool = z.object({ tool: z.string().describe("The tool's name") });
const impact = z.enum(["none", "patch", "minor", "major"]);
/** `production` and `channel` are permanent channels; `preview` is a branch's temporary channel (D-125). */
const environment = z.enum(["production", "preview", "channel"]);
const commit = z.strictObject({
  sha: z.string(),
  message: z.string().optional(),
  author: z.string().optional(),
});

const ToolListingSchema = z.strictObject({
  name: z.string(),
  production: z.string().nullable(),
  /** One entry per branch with a temporary channel. */
  previews: z.array(z.strictObject({ branch: z.string(), version: z.string() })),
  /** One entry per permanent channel other than production that serves a version (D-125). */
  channels: z.array(z.strictObject({ channel: z.string(), version: z.string() })).optional(),
  /** The tool's description from its manifest: the production version's, else the latest published. */
  summary: z.string().nullable(),
  /** The latest deployment, to any environment. */
  lastDeployment: z.strictObject({ at: z.string(), version: z.string() }).nullable(),
});

const DeploymentLineSchema = z.strictObject({
  at: z.string(),
  kind: z.string(),
  version: z.string(),
  /** The email of a member, or what CI signs with. */
  actor: z.string(),
  commit: commit.optional(),
});

const BranchRowSchema = z.strictObject({
  environment,
  /** A temporary channel's branch. */
  branch: z.string().optional(),
  /** A permanent channel's name, other than production. */
  channel: z.string().optional(),
  /** The branch a permanent channel follows. */
  follows: z.string().optional(),
  /** Only a deployment that went through exists here: a build that failed leaves no row. */
  status: z.literal("ready"),
  version: z.string(),
  commit: commit.optional(),
  /** Who put this version on the environment. */
  deployedBy: z.string(),
  deployedAt: z.string(),
  url: z.string().optional(),
  /** What Roll back would serve again; permanent channels only. */
  rollbackTo: z.string().optional(),
  migrations: z.strictObject({ count: z.number().int(), last: z.string().optional() }),
  /**
   * The latest deployments of this channel, newest first. On a temporary channel, its commits as
   * Forgeron recorded them.
   */
  deployments: z.array(DeploymentLineSchema),
});

const BranchesAnswerSchema = z.strictObject({
  tool: z.string(),
  production: BranchRowSchema.nullable(),
  /** The permanent channels other than production that serve a version. */
  channels: z.array(BranchRowSchema).optional(),
  /** The temporary channels, one per branch. */
  branches: z.array(BranchRowSchema),
});

const VersionRowSchema = z.strictObject({
  version: z.string(),
  publishedAt: z.string(),
  /** Where it is served now. */
  environments: z.array(
    z.strictObject({
      environment,
      branch: z.string().optional(),
      channel: z.string().optional(),
    }),
  ),
  /** The branch whose push made it, when known. */
  branch: z.string().optional(),
  /** A release (`forgeron release`): only releases reach a permanent channel (D-125). */
  release: z.boolean().optional(),
  /** What the author wrote; `null` for a version published without a changelog. */
  changelog: z
    .strictObject({
      entries: z.array(
        z.strictObject({ type: z.string(), bump: z.string(), description: z.string() }),
      ),
      declared: impact,
      detected: impact,
    })
    .nullable(),
  /** The version published just before this one, `null` for the first. */
  previous: z.string().nullable(),
  /** The manifest compared with that version's; empty for the first or when it cannot be compared. */
  changes: z.array(z.strictObject({ kind: z.string(), subject: z.string(), impact: z.string() })),
  impact,
});

const VersionsAnswerSchema = z.strictObject({
  tool: z.string(),
  /** Newest first. */
  versions: z.array(VersionRowSchema),
});

const ActivityAnswerSchema = z.strictObject({
  tool: z.string(),
  /** The tool's audit lines, newest first. */
  entries: z.array(
    z.strictObject({
      id: z.string(),
      at: z.string(),
      actor: z.string(),
      interface: z.string().optional(),
      kind: z.string(),
      subject: z.string(),
      result: z.string(),
    }),
  ),
});

export const listToolsRoute = defineRoute({
  method: "get",
  path: "/api/tools",
  summary: "The workspace's tools and the version each environment serves",
  tags: ["tools"],
  responses: {
    200: json(z.strictObject({ tools: z.array(ToolListingSchema) }), "The tools, by name"),
    401: notSignedIn,
  },
});

export const toolBranchesRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/branches",
  summary:
    "The channels: production, the other permanent ones, and one per branch, with the last deployments of each",
  tags: ["tools"],
  request: { params: tool },
  responses: {
    200: json(BranchesAnswerSchema, "The environments"),
    401: notSignedIn,
    403: notForYou,
    404: noTool,
  },
});

export const toolVersionsRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/versions",
  summary:
    "The versions, newest first, each with its changelog and what changed since the one before",
  tags: ["tools"],
  request: { params: tool },
  responses: {
    200: json(VersionsAnswerSchema, "The versions"),
    401: notSignedIn,
    403: notForYou,
    404: noTool,
  },
});

export const toolActivityRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/activity",
  summary: "The tool's audit lines, newest first",
  tags: ["tools"],
  request: {
    params: tool,
    query: z.object({
      limit: z
        .string()
        .optional()
        .describe("How many lines: 50 by default, at most 200; any other value is read as 50"),
    }),
  },
  responses: {
    200: json(ActivityAnswerSchema, "The lines"),
    401: notSignedIn,
    403: notForYou,
    404: noTool,
  },
});

export const toolManifestRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/manifest",
  summary:
    "The manifest of the version production serves, else of the latest one published; with `branch`, of the version that branch's preview serves",
  tags: ["tools"],
  request: {
    params: tool,
    query: z.object({
      branch: z
        .string()
        .min(1)
        .optional()
        .describe("A channel other than production: a branch, or `~<name>` for a permanent one"),
    }),
  },
  responses: {
    200: json(
      z.strictObject({ manifest: z.record(z.string(), z.unknown()) }),
      "The manifest (`@forgeron/manifest`)",
    ),
    401: notSignedIn,
    403: json(ErrorSchema, "Lacks the permission"),
    404: json(
      ErrorSchema,
      "No such tool, no version published yet, or no preview for the branch (`NO_MANIFEST`)",
    ),
  },
});
