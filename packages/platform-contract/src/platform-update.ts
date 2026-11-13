import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The platform updating itself from the console (D-138): what is newer, and the run that updates.
// The platform is shared by its workspaces, so nothing here is a workspace's.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const notSignedIn = json(ErrorSchema, "Not signed in");
const lacksPermission = json(ErrorSchema, "Lacks the permission");

/** What an update does, in this order. */
export const UPDATE_STEP_NAMES = [
  "download",
  "restore-point",
  "migrate",
  "code",
  "deploy",
] as const;

/** Why this platform cannot update itself from the console right now. */
export const UPDATE_BLOCKED_CODES = [
  /** `SELF_UPDATE=off`. */
  "OFF",
  /** Forgeron Cloud: its operator updates it. */
  "CLOUD",
  /** Not a self-host install made by `forgeron platform install`: no Worker of its own to update. */
  "NOT_SELF_HOST",
  /** The install made before D-138 does not know its database id yet. */
  "NO_DATABASE_ID",
  /** The gateway holds no Cloudflare account or token. */
  "NO_CREDENTIALS",
  /** GitHub could not be asked, or has no release. */
  "RELEASES_UNAVAILABLE",
  /** The latest release carries no `forgeron-platform.json`. */
  "NO_ARTIFACT",
] as const;

export const UpdateStepSchema = z.strictObject({
  name: z.enum(UPDATE_STEP_NAMES),
  state: z.enum(["pending", "running", "done", "failed"]),
  /** What the step did, or why it failed: fit to show a person. */
  message: z.string().optional(),
});

export const UpdateRunSchema = z.strictObject({
  id: z.string(),
  from: z.string().describe("The version that was running"),
  to: z.string().describe("The version asked for"),
  state: z.enum(["running", "succeeded", "failed"]),
  steps: z.array(UpdateStepSchema),
  /** The Time Travel restore point of the platform's database, once taken. */
  bookmark: z.string().optional(),
  startedAt: z.string(),
  finishedAt: z.string().optional(),
  error: z.string().optional(),
  /** On a failure after the database may have changed: the command that restores the restore point. */
  restoreCommand: z.string().optional(),
});
export type UpdateRun = z.infer<typeof UpdateRunSchema>;

const UpdateStateSchema = z.strictObject({
  current: z.strictObject({ version: z.string(), commit: z.string().optional() }),
  /** The newest release of the repository the install updates from; absent when it could not be read. */
  latest: z
    .strictObject({
      version: z.string(),
      publishedAt: z.string(),
      /** The release's page on GitHub. */
      url: z.string(),
      /** The release's notes, markdown. */
      notes: z.string(),
    })
    .optional(),
  /** Whether `latest` is newer than `current`. */
  available: z.boolean(),
  /** The migrations of the release this database has not applied; absent when the release was not read. */
  pending: z.strictObject({ migrations: z.array(z.string()) }).optional(),
  blocked: z.strictObject({ code: z.enum(UPDATE_BLOCKED_CODES), message: z.string() }).optional(),
  running: UpdateRunSchema.optional(),
  /** The latest run when it failed and nothing newer has run since: what to do about it. */
  lastFailed: UpdateRunSchema.optional(),
});

export type UpdateState = z.infer<typeof UpdateStateSchema>;
export type UpdateBlocked = NonNullable<UpdateState["blocked"]>;

export const getPlatformUpdateRoute = defineRoute({
  method: "get",
  path: "/api/platform/update",
  summary: "The version this platform runs, the latest release, and what updating would do",
  tags: ["platform"],
  responses: {
    200: json(UpdateStateSchema, "The state of updates"),
    401: notSignedIn,
    403: lacksPermission,
  },
});

export const startPlatformUpdateRoute = defineRoute({
  method: "post",
  path: "/api/platform/update",
  summary: "Update this platform to a release, with a restore point of its database",
  description:
    "Answers 202 at once; the work goes on after the answer and the run is read with `GET /api/platform/update/runs/{id}`.",
  tags: ["platform"],
  request: {
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.strictObject({
            version: z
              .string()
              .regex(/^\d+\.\d+\.\d+$/)
              .describe("The release to update to, without the `v`: `0.6.0`"),
          }),
        },
      },
    },
  },
  responses: {
    202: json(z.strictObject({ run: UpdateRunSchema }), "The run has started"),
    400: json(ErrorSchema, "Invalid input"),
    401: notSignedIn,
    403: lacksPermission,
    409: json(
      ErrorSchema,
      "`RUNNING` (an update is already running), `NOT_NEWER` (the same version or an older one), or a reason the platform cannot update itself (`blocked.code`)",
    ),
  },
});

export const getPlatformUpdateRunRoute = defineRoute({
  method: "get",
  path: "/api/platform/update/runs/{id}",
  summary: "An update run and its steps",
  tags: ["platform"],
  request: { params: z.object({ id: z.string() }) },
  responses: {
    200: json(z.strictObject({ run: UpdateRunSchema }), "The run"),
    401: notSignedIn,
    403: lacksPermission,
    404: json(ErrorSchema, "No such run"),
  },
});
