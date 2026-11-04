import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The secrets a tool declares and whether each environment has them (docs/sdk.md §17; the admin MCP's
// `secrets_status` answers the same). No value is read, so none can leave.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
const state = z.enum(["set", "missing"]);

export const secretsStatusRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/secrets-status",
  summary: "Whether each declared secret is set in each environment, never its value",
  tags: ["secrets"],
  request: { params: z.object({ tool: z.string().describe("The tool's name") }) },
  responses: {
    200: json(
      z.strictObject({
        secrets: z.array(
          z.strictObject({
            name: z.string(),
            environments: z.strictObject({ preview: state, production: state }),
          }),
        ),
      }),
      "The secrets",
    ),
    401: json(ErrorSchema, "Not signed in"),
    403: json(ErrorSchema, "Not an admin or a developer"),
    404: json(ErrorSchema, "No such tool"),
  },
});
