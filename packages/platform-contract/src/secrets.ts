import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The secrets of a tool in one environment (docs/sdk.md §5, "Secrets and access"), for admins. A value
// goes in and never comes out: the answers carry names.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});
export const MAX_SECRET_VALUE = 16 * 1024;
const where = {
  tool: z.string().describe("The tool's name"),
  environment: z.string().describe("`preview` or `production`; any other is a 404"),
};

export const listSecretsRoute = defineRoute({
  method: "get",
  path: "/api/tools/{tool}/environments/{environment}/secrets",
  summary: "The names of the secrets set in an environment",
  tags: ["secrets"],
  request: { params: z.object(where) },
  responses: {
    200: json(z.strictObject({ secrets: z.array(z.string()) }), "The names"),
    401: json(ErrorSchema, "Not signed in"),
    403: json(ErrorSchema, "Lacks the permission"),
    404: json(ErrorSchema, "No such tool or environment"),
  },
});

export const setSecretRoute = defineRoute({
  method: "put",
  path: "/api/tools/{tool}/environments/{environment}/secrets/{name}",
  summary: "Set a secret's value (sealed in the registry; it never comes out)",
  tags: ["secrets"],
  request: {
    params: z.object({
      ...where,
      name: z.string().describe("`A-Z`, digits and `_`, from a letter"),
    }),
    body: {
      required: true,
      content: {
        "application/json": {
          schema: z.object({ value: z.string().min(1).max(MAX_SECRET_VALUE) }),
        },
      },
    },
  },
  responses: {
    204: { description: "Set" },
    400: json(ErrorSchema, "`value` is a non-empty string (16 KB max), or the body is not JSON"),
    401: json(ErrorSchema, "Not signed in"),
    403: json(ErrorSchema, "Lacks the permission"),
    404: json(ErrorSchema, "No such tool, environment or secret name"),
    500: json(ErrorSchema, "The registry refused: `error` is its code"),
  },
});
