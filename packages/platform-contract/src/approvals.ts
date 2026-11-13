import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The versions that wait for an admin (docs/sdk.md §3). The registry audits a decision and refuses a
// second one.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});

export const listApprovalsRoute = defineRoute({
  method: "get",
  path: "/api/approvals",
  summary: "The versions that wait for a decision, with what each asks for",
  tags: ["approvals"],
  responses: {
    200: json(
      z.strictObject({
        versions: z.array(
          z.strictObject({
            tool: z.string(),
            /** The version's id. */
            id: z.string(),
            version: z.string(),
            approvals: z.array(
              z.strictObject({ id: z.string(), resource: z.string(), kind: z.string() }),
            ),
          }),
        ),
      }),
      "The waiting versions",
    ),
    401: json(ErrorSchema, "Not signed in"),
    403: json(ErrorSchema, "Lacks the permission"),
  },
});

export const decideApprovalRoute = defineRoute({
  method: "post",
  path: "/api/approvals/{id}",
  summary: "Approve or reject one request, once",
  tags: ["approvals"],
  request: {
    params: z.object({ id: z.string() }),
    body: {
      required: true,
      content: {
        "application/json": { schema: z.object({ decision: z.enum(["approved", "rejected"]) }) },
      },
    },
  },
  responses: {
    200: json(
      z.strictObject({ id: z.string(), status: z.enum(["pending", "approved", "rejected"]) }),
      "The request as decided",
    ),
    400: json(ErrorSchema, "`decision` is `approved` or `rejected`"),
    401: json(ErrorSchema, "Not signed in"),
    403: json(ErrorSchema, "Lacks the permission"),
    404: json(ErrorSchema, "No such approval in this workspace"),
    409: json(ErrorSchema, "Already decided, or the registry refused"),
  },
});
