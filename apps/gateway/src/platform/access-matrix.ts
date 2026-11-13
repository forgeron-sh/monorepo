import {
  getAccessMatrixRoute,
  MAX_ACCESS_CHANGES,
  MAX_GRANT_CHANGES,
  putAccessMatrixRoute,
} from "@forgeron/platform-contract";
import { RegistryError } from "@forgeron/registry";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// The Access tab of a tool, for who holds `access:read` / `access:write` (docs/sdk.md §3, D-039, D-127,
// D-137): what each subject (`everyone`, a team) is given in the tool, and the per-action exceptions. A change is written to the audit log by the
// registry and takes effect on the next call, on every interface.

const missing = (name: string) => ({ error: "NOT_FOUND", message: `There is no tool ${name}.` });
const status = (code: string) =>
  code === "NOT_FOUND" ? 404 : code === "NO_MANIFEST" ? 409 : code === "INVALID" ? 400 : 500;

export function mountAccessMatrix(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(platformRoute(getAccessMatrixRoute, "access:read"), async (c) => {
    const { registry, workspace } = c.env;
    const name = c.req.valid("param").tool;
    const tool = await registry.findTool(workspace, name);
    if (!tool) return c.json(missing(name), 404);
    try {
      return c.json(await registry.accessMatrix(tool.id), 200);
    } catch (error) {
      if (error instanceof RegistryError) {
        return c.json({ error: error.code, message: error.message }, status(error.code) as 409);
      }
      throw error;
    }
  });

  app.openapi(
    platformRoute(putAccessMatrixRoute, "access:write"),
    async (c) => {
      const { registry, workspace } = c.env;
      const name = c.req.valid("param").tool;
      const tool = await registry.findTool(workspace, name);
      if (!tool) return c.json(missing(name), 404);
      try {
        const body = c.req.valid("json");
        await registry.updateAccess(
          tool.id,
          {
            ...(body.grants ? { grants: body.grants } : {}),
            changes: (body.changes ?? []).map((change) => ({
              subject: change.subject,
              action: change.action,
              allowed: change.allowed ?? undefined,
            })),
          },
          c.get("person").id,
          c.env.via,
        );
        return c.json(await registry.accessMatrix(tool.id), 200);
      } catch (error) {
        if (error instanceof RegistryError) {
          return c.json({ error: error.code, message: error.message }, status(error.code) as 409);
        }
        throw error;
      }
    },
    // The message the old handler gave, which the console shows as it is.
    (result, c) =>
      result.success
        ? undefined
        : c.json(
            {
              error: "INVALID",
              message: `Give \`grants\` (up to ${MAX_GRANT_CHANGES} of { subject, grant }) or \`changes\` (up to ${MAX_ACCESS_CHANGES} of { subject, action, allowed: true, false or null }).`,
            },
            400,
          ),
  );

  app.all("/api/tools/:tool/access-matrix", methodNotAllowed);
}
