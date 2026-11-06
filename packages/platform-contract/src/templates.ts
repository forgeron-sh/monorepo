import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The template catalogue and the installation of a template (D-080, docs/sdk.md §17). Both are for
// admins: installing creates a tool and its requests for resources.

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { "application/json": { schema } },
});

export const listTemplatesRoute = defineRoute({
  method: "get",
  path: "/api/templates",
  summary: "The templates of the catalogue, with the resources each asks for",
  tags: ["templates"],
  responses: {
    200: json(
      z.strictObject({
        templates: z.array(
          z.strictObject({
            name: z.string(),
            /** The latest version, the one an installation copies. */
            version: z.string(),
            /** What an admin will have to approve (`resources.db`, `resources.network`…). */
            resources: z.array(z.string()),
          }),
        ),
      }),
      "The templates",
    ),
    401: json(ErrorSchema, "Not signed in"),
    403: json(ErrorSchema, "Not an admin"),
  },
});

export const installTemplateRoute = defineRoute({
  method: "post",
  path: "/api/templates/{name}/install",
  summary:
    "Create a tool in the workspace from a template, with its requests for resources pending",
  tags: ["templates"],
  request: { params: z.object({ name: z.string() }) },
  responses: {
    201: json(
      z.strictObject({
        tool: z.string(),
        version: z.string(),
        /** The requests an admin still has to decide before production. */
        approvals: z.array(z.strictObject({ resource: z.string(), kind: z.string() })),
      }),
      "The tool, created: it has a version and no environment",
    ),
    401: json(ErrorSchema, "Not signed in"),
    403: json(ErrorSchema, "Not an admin"),
    404: json(ErrorSchema, "No such template"),
    409: json(ErrorSchema, "The workspace already has a tool of that name"),
  },
});
