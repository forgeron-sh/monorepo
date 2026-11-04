import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The roles × actions matrix of a tool (docs/sdk.md §3, D-039). `action` is an action name or
// `view:<name>`; a change of `null` gives the cell back to the manifest's levels. The changes are
// applied together with their audit lines: all or none (D-047).

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});

const AccessMatrixSchema = z.strictObject({
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
});

const tool = z.object({ tool: z.string().describe("The tool's name") });
const notSignedIn = json(ErrorSchema, "Not signed in");
const notAdmin = json(ErrorSchema, "Not an admin");
const noTool = json(ErrorSchema, "No such tool");

export const MAX_ACCESS_CHANGES = 500;

export const getAccessMatrixRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/access-matrix",
  summary: "The tool's roles × actions matrix",
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
  summary: "Change cells of the matrix, all or none",
  tags: ["access"],
  request: {
    params: tool,
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({
            changes: z
              .array(
                z.object({
                  role: z.string(),
                  action: z.string(),
                  allowed: z.boolean().nullable(),
                }),
              )
              .min(1)
              .max(MAX_ACCESS_CHANGES),
          }),
        },
      },
    },
  },
  responses: {
    200: json(AccessMatrixSchema, "The matrix now"),
    400: json(ErrorSchema, "`changes` is not 1 to 500 of { role, action, allowed }"),
    401: notSignedIn,
    403: notAdmin,
    404: noTool,
    409: json(ErrorSchema, "The tool has no version published yet (`NO_MANIFEST`)"),
    500: json(ErrorSchema, "The registry refused: `error` is its code"),
  },
});
