import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// Delegated connectors (docs/sdk.md §10), for admins: who consented to what, and revoking one consent.
// The answers say who consented to what, never a token.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const tool = z.string().describe("The tool's name");
const environment = z.string().describe("`preview` or `production`; any other is a 404");

const ConnectionSchema = z.strictObject({
  /** The person's id. */
  userId: z.string(),
  connector: z.string(),
  scopes: z.array(z.string()),
  /** When the access token expires, if the provider said. */
  expiresAt: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const listConnectionsRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/environments/{environment}/connections",
  summary: "Who consented to a connector of the tool, in one environment",
  tags: ["connections"],
  request: { params: z.object({ tool, environment }) },
  responses: {
    200: json(z.strictObject({ connections: z.array(ConnectionSchema) }), "The consents"),
    401: json(ErrorSchema, "Not signed in"),
    403: json(ErrorSchema, "Not an admin"),
    404: json(ErrorSchema, "No such tool or environment"),
  },
});

export const revokeConnectionRoute = defineRoute({
  method: "delete",
  path: "/api/tools/{tool}/environments/{environment}/connections/{user}/{connector}",
  summary: "Revoke one person's consent to a connector",
  tags: ["connections"],
  request: {
    params: z.object({
      tool,
      environment,
      user: z.string().describe("The person's id, URL-encoded"),
      connector: z.string(),
    }),
  },
  responses: {
    204: { description: "Revoked, and written to the audit log" },
    400: json(ErrorSchema, "The person is not a valid URL-encoded id"),
    401: json(ErrorSchema, "Not signed in"),
    403: json(ErrorSchema, "Not an admin"),
    404: json(ErrorSchema, "No such tool, environment or consent"),
  },
});
