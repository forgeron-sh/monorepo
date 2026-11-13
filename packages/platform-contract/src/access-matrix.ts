import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The Access tab of a tool (docs/sdk.md §3, D-039, D-127, D-137): what each subject (`everyone`, or a
// team as `team:<id>`) is given in the tool (a profile, a custom set of permissions, all of them, or
// none) and the per-action exceptions. `action` is an action name or `view:<name>`; a change of
// `null` gives the cell back to the grant.
// The changes are applied together with their audit lines: all or none (D-047).

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});

/** What a subject is given in a tool (D-127). */
const ProfileGrantSchema = z.discriminatedUnion("kind", [
  z.strictObject({ kind: z.literal("all") }),
  z.strictObject({ kind: z.literal("profile"), profile: z.string().min(1).max(100) }),
  z.strictObject({
    kind: z.literal("custom"),
    permissions: z.array(z.string().min(1).max(100)).max(100),
  }),
  z.strictObject({ kind: z.literal("none") }),
]);

const AccessMatrixSchema = z.strictObject({
  /** The rows: `everyone` first, then the workspace's teams (`team:<id>`) by name. */
  subjects: z.array(z.string()),
  /** What to show for each subject: "Everyone", a team's name (the id of a team that is gone). */
  subjectLabels: z.record(z.string(), z.string()),
  actions: z.array(z.string()),
  /** The views of the tool; their cells are keyed `view:<name>` (D-043). */
  views: z.array(z.string()),
  /** The key of each column in `cells`: the actions, then `view:<name>` for each view. */
  columns: z.array(z.string()),
  cells: z.record(
    z.string(),
    z.record(
      z.string(),
      z.strictObject({
        /** What the subject's grant says for this action. */
        default: z.boolean(),
        /** What someone set in the console, if anything. */
        override: z.boolean().optional(),
        /** What applies: the override, else the default. */
        allowed: z.boolean(),
      }),
    ),
  ),
  /** The permission each column requires. */
  levels: z.record(z.string(), z.string()),
  /** Every permission of the tool: what its actions and views require. */
  permissions: z.array(z.string()),
  /** The profiles the tool suggests, with the one `everyone` gets when the tool arrives. */
  profiles: z.record(
    z.string(),
    z.strictObject({
      label: z.string().optional(),
      grants: z.array(z.string()),
      default: z.boolean(),
    }),
  ),
  /** What each subject of `subjects` is given; `none` for one with nothing. */
  grants: z.record(z.string(), ProfileGrantSchema),
});

const tool = z.object({ tool: z.string().describe("The tool's name") });
const notSignedIn = json(ErrorSchema, "Not signed in");
const notAllowed = json(ErrorSchema, "Lacks the permission");
const noTool = json(ErrorSchema, "No such tool");

export const MAX_ACCESS_CHANGES = 500;
export const MAX_GRANT_CHANGES = 100;

export const getAccessMatrixRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/access-matrix",
  summary: "The tool's profiles, what everyone and each team are given, and the matrix",
  tags: ["access"],
  request: { params: tool },
  responses: {
    200: json(AccessMatrixSchema, "The matrix"),
    401: notSignedIn,
    403: notAllowed,
    404: noTool,
    409: json(ErrorSchema, "The tool has no version published yet (`NO_MANIFEST`)"),
    500: json(ErrorSchema, "The registry refused: `error` is its code"),
  },
});

export const putAccessMatrixRoute = defineRoute({
  method: "put",
  path: "/api/tools/{tool}/access-matrix",
  summary: "Change what subjects are given and cells of the matrix, all or none",
  tags: ["access"],
  request: {
    params: tool,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z
            .object({
              changes: z
                .array(
                  z.object({
                    subject: z.string(),
                    action: z.string(),
                    allowed: z.boolean().nullable(),
                  }),
                )
                .max(MAX_ACCESS_CHANGES)
                .optional(),
              /** What subjects are given in the tool (D-127, D-137), applied before `changes`. */
              grants: z
                .array(z.object({ subject: z.string(), grant: ProfileGrantSchema }))
                .max(MAX_GRANT_CHANGES)
                .optional(),
            })
            .refine((body) => (body.changes?.length ?? 0) + (body.grants?.length ?? 0) > 0, {
              message: "Nothing to change.",
            }),
        },
      },
    },
  },
  responses: {
    200: json(AccessMatrixSchema, "The matrix now"),
    400: json(
      ErrorSchema,
      "Neither `changes` (up to 500 of { subject, action, allowed }) nor `grants` (up to 100 of { subject, grant }), or a subject that is not `everyone` or `team:<id>`",
    ),
    401: notSignedIn,
    403: notAllowed,
    404: noTool,
    409: json(ErrorSchema, "The tool has no version published yet (`NO_MANIFEST`)"),
    500: json(ErrorSchema, "The registry refused: `error` is its code"),
  },
});
