import { z } from "zod";
import { ErrorSchema } from "./error";
import { defineRoute } from "./route";

// The template catalogue and the installation of a template (D-081, docs/sdk.md §17). Both are for
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

const plan = z.strictObject({
  /** What `installPlanRoute` accepts: single-use, bound to the caller and the workspace, 15 minutes. */
  plan: z.string(),
  template: z.string(),
  /** The version this plan will install: a newer one makes the plan stale. */
  version: z.string(),
  /** What an admin will have to approve (`resources.db`, `resources.network`…). */
  resources: z.array(z.string()),
  expiresAt: z.string(),
});

export const createInstallPlanRoute = defineRoute({
  method: "post",
  path: "/api/templates/{name}/install-plan",
  summary: "Show what installing a template would create, and record the plan; creates nothing",
  tags: ["templates"],
  request: { params: z.object({ name: z.string() }) },
  responses: {
    201: json(plan, "The plan"),
    401: json(ErrorSchema, "Not signed in"),
    403: json(ErrorSchema, "Not an admin"),
    404: json(ErrorSchema, "No such template"),
    409: json(ErrorSchema, "The workspace already has a tool of that name"),
  },
});

export const installFromPlanRoute = defineRoute({
  method: "post",
  path: "/api/install-plans/{plan}/install",
  summary: "Install the template a plan showed; the plan is spent",
  tags: ["templates"],
  request: { params: z.object({ plan: z.string() }) },
  responses: {
    201: json(
      z.strictObject({
        tool: z.string(),
        version: z.string(),
        approvals: z.array(z.strictObject({ resource: z.string(), kind: z.string() })),
      }),
      "The tool, created: it has a version and no environment",
    ),
    401: json(ErrorSchema, "Not signed in"),
    403: json(ErrorSchema, "Not an admin"),
    404: json(ErrorSchema, "No such plan, or it is another person's or another workspace's"),
    409: json(ErrorSchema, "The plan was already used, or its template has a newer version"),
    410: json(ErrorSchema, "The plan expired"),
  },
});
