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
    403: json(ErrorSchema, "Lacks the permission"),
    404: json(ErrorSchema, "No such tool"),
  },
});

// Sealing again what the platform keeps under a replaced key (D-108), for the workspace's admins. It
// answers counts, never a value.
export const resealSecretsRoute = defineRoute({
  method: "post",
  path: "/api/secrets/reseal",
  summary: "Seal this workspace's stored secrets again under the current key",
  tags: ["secrets"],
  responses: {
    200: json(
      z.strictObject({
        resealed: z.number().int().describe("Values moved from a previous key to the current one"),
        current: z.number().int().describe("Values already under the current key"),
        unreadable: z.number().int().describe("Values no key opens: left as they are"),
      }),
      "What was done",
    ),
    401: json(ErrorSchema, "Not signed in"),
    403: json(ErrorSchema, "Lacks the permission"),
    409: json(ErrorSchema, "The gateway has no `SECRETS_KEY`"),
  },
});
