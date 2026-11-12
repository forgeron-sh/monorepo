import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The Access tab of a tool (docs/sdk.md §3, D-039, D-127): what each workspace role is given in the
// tool (a profile, a custom set of permissions, all of them, or none) and the per-action exceptions.
// `action` is an action name or `view:<name>`; a change of `null` gives the cell back to the mapping.
// The changes are applied together with their audit lines: all or none (D-047).

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});

/** What a workspace role is given in a tool (D-127). */
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
  /** The workspace roles with a mapping or an exception: `admin`, `member`, then by name. */
  roles: z.array(z.string()),
  actions: z.array(z.string()),
  /** The views of the tool; their cells are keyed `view:<name>` (D-043). */
  views: z.array(z.string()),
  /** The key of each column in `cells`: the actions, then `view:<name>` for each view. */
  subjects: z.array(z.string()),
  cells: z.record(
    z.string(),
    z.record(
      z.string(),
      z.strictObject({
        /** What the role's levels say for this action. */
        default: z.boolean(),
        /** What an admin set in the console, if anything. */
        override: z.boolean().optional(),
        /** What applies: the override, else the default. */
        allowed: z.boolean(),
      }),
    ),
  ),
  /** The permission each subject requires. */
  levels: z.record(z.string(), z.string()),
  /** Every permission of the tool: what its actions and views require. */
  permissions: z.array(z.string()),
  /** The profiles the tool suggests, with the one `member` gets when the tool arrives. */
  profiles: z.record(
    z.string(),
    z.strictObject({
      label: z.string().optional(),
      grants: z.array(z.string()),
      default: z.boolean(),
    }),
  ),
  /** What each role of `roles` is given. */
  mapping: z.record(z.string(), ProfileGrantSchema),
});

const tool = z.object({ tool: z.string().describe("The tool's name") });
const notSignedIn = json(ErrorSchema, "Not signed in");
const notAdmin = json(ErrorSchema, "Not an admin");
const noTool = json(ErrorSchema, "No such tool");

export const MAX_ACCESS_CHANGES = 500;
export const MAX_PROFILE_CHANGES = 100;

export const getAccessMatrixRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/access-matrix",
  summary: "The tool's profiles, the mapping of workspace roles, and the matrix",
  tags: ["access"],
  request: { params: tool },
  responses: {
    200: json(AccessMatrixSchema, "The matrix"),
    401: notSignedIn,
    403: notAdmin,
    404: noTool,
    409: json(ErrorSchema, "The tool has no version published yet (`NO_MANIFEST`)"),
    500: json(ErrorSchema, "The registry refused: `error` is its code"),
  },
});

export const putAccessMatrixRoute = defineRoute({
  method: "put",
  path: "/api/tools/{tool}/access-matrix",
  summary: "Change the mapping of roles and cells of the matrix, all or none",
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
                    role: z.string(),
                    action: z.string(),
                    allowed: z.boolean().nullable(),
                  }),
                )
                .max(MAX_ACCESS_CHANGES)
                .optional(),
              /** What workspace roles are given in the tool (D-127), applied before `changes`. */
              profiles: z
                .array(z.object({ role: z.string(), grant: ProfileGrantSchema }))
                .max(MAX_PROFILE_CHANGES)
                .optional(),
            })
            .refine((body) => (body.changes?.length ?? 0) + (body.profiles?.length ?? 0) > 0, {
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
      "Neither `changes` (up to 500 of { role, action, allowed }) nor `profiles` (up to 100 of { role, grant })",
    ),
    401: notSignedIn,
    403: notAdmin,
    404: noTool,
    409: json(ErrorSchema, "The tool has no version published yet (`NO_MANIFEST`)"),
    500: json(ErrorSchema, "The registry refused: `error` is its code"),
  },
});
