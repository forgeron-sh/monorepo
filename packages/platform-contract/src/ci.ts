import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The CI of a tool that a GitHub repository deploys: the recent GitHub Actions runs of its
// repository, read with the workspace's GitHub App. Whoever sees the tool reads them (`tools:read`).
// GitHub's answers 403 and 404 (the app was installed before it asked to read Actions, and its owner
// has not accepted the new permission) become a state of their own, with where to accept it.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});

/** What a run is, in the words the console shows. */
export const CiStatusSchema = z.enum(["queued", "in_progress", "success", "failure", "cancelled"]);

export const CiRunSchema = z.strictObject({
  id: z.number().int(),
  /** The workflow's name. */
  workflow: z.string(),
  branch: z.string(),
  /** The commit's message, first line. */
  message: z.string(),
  sha: z.string(),
  /** The login of whoever pushed, or the actor GitHub names. */
  actor: z.string(),
  status: CiStatusSchema,
  startedAt: z.string(),
  /** Seconds, for a run that has finished. */
  durationSeconds: z.number().int().nullable(),
  /** The run on github.com. */
  url: z.string(),
});

export const CiAnswerSchema = z.discriminatedUnion("state", [
  z.strictObject({
    state: z.literal("ok"),
    repo: z.string(),
    productionBranch: z.string(),
    /** `https://github.com/<repo>/actions`. */
    actionsUrl: z.string(),
    /** Newest first. */
    runs: z.array(CiRunSchema),
  }),
  /** The tool does not come from a repository. */
  z.strictObject({ state: z.literal("no-repository") }),
  /** The tool has a repository, and the workspace has no GitHub App (or none that sees it). */
  z.strictObject({ state: z.literal("no-app"), repo: z.string() }),
  /** The app is not allowed to read Actions yet: its owner accepts it in the app's settings. */
  z.strictObject({
    state: z.literal("no-permission"),
    repo: z.string(),
    settingsUrl: z.string(),
  }),
]);

export const toolCiRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/ci",
  summary: "The recent GitHub Actions runs of the tool's repository, newest first",
  tags: ["tools"],
  request: {
    params: z.object({ tool: z.string() }),
    query: z.object({
      /** Only the runs of this branch. */
      branch: z.string().min(1).max(200).optional(),
      /** How many runs (default 20). */
      limit: z.coerce.number().int().min(1).max(50).optional(),
    }),
  },
  responses: {
    200: json(CiAnswerSchema, "The runs, or why they cannot be read"),
    401: json(ErrorSchema, "Not signed in"),
    403: json(ErrorSchema, "Lacks the permission"),
    404: json(ErrorSchema, "No such tool"),
    502: json(ErrorSchema, "GitHub refused (`GITHUB`)"),
  },
});
