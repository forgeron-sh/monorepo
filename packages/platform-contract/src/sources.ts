import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// Where a tool comes from, and its updates (D-121). A tool is installed from a marketplace (its latest
// release, updated when a newer one is published) or deployed by a GitHub repository's CI (each branch
// a preview, its production branch the candidate for production). An admin reads what an update would
// bring, then puts it in production, approving in the same step what it asks for. An admin also adds a
// tool from a repository, and copies a branch's data into another branch.

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

/** What an update would bring: the version, and what an admin is asked before it goes. */
export const AvailableUpdateSchema = z.strictObject({
  version: z.string(),
  /** For a repository tool: the branch whose preview serves it. */
  branch: z.string().optional(),
  /** False for a build with no release: no changelog, users are not told what changes. */
  release: z.boolean(),
  /** The changelog lines, when it is a release. */
  changelog: z.array(z.string()),
  /** What it asks for that production does not have (`resources.network`…): approved with the update. */
  approvals: z.array(z.string()),
});

export const ToolSourceSchema = z.strictObject({
  kind: z.enum(["marketplace", "repo"]),
  /** `official`, or the id of a marketplace of the workspace. */
  marketplace: z.string().optional(),
  repo: z.string().optional(),
  productionBranch: z.string(),
  autoUpdate: z.boolean(),
  /** The version production serves, or `null`. */
  production: z.string().nullable(),
  update: AvailableUpdateSchema.nullable(),
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
  summary: "Whether a new version goes to production by itself, and which branch is production's",
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
  summary: "Put the waiting update in production",
  tags: ["sources"],
  request: {
    params,
    body: body(
      z.object({
        /** Approves, in the same step, what the update asks for. */
        approve: z.boolean().optional(),
        /** Takes a build with no release, knowingly. */
        withoutRelease: z.boolean().optional(),
        /** The version the admin read: refused if the update changed since (`STALE`). */
        version: z.string().min(1).max(200),
      }),
    ),
  },
  responses: {
    200: json(z.strictObject({ tool: z.string(), version: z.string() }), "In production"),
    400: json(ErrorSchema, "Not a request"),
    401: notSignedIn,
    403: notAdmin,
    404: json(ErrorSchema, "No such tool, or no update waiting (`NO_UPDATE`)"),
    409: json(
      ErrorSchema,
      "The update changed (`STALE`), waits for approvals (`PENDING_APPROVAL`) or a migration refused (`MIGRATION_REFUSED`)",
    ),
    422: json(ErrorSchema, "No release (`NO_ENTRY`) or a release that declares too little"),
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
