import {
  getAccessMatrixRoute,
  MAX_ACCESS_CHANGES,
  putAccessMatrixRoute,
} from "@forgeron/platform-contract";
import { RegistryError } from "@forgeron/registry";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// The roles × actions matrix of a tool, for admins (docs/sdk.md §3, D-039). A change is written to the
// audit log by the registry and takes effect on the next call, on every interface.

const FORBIDDEN = "The access matrix is for admins.";
const missing = (name: string) => ({ error: "NOT_FOUND", message: `There is no tool ${name}.` });
const status = (code: string) => (code === "NOT_FOUND" ? 404 : code === "NO_MANIFEST" ? 409 : 500);

export function mountAccessMatrix(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(platformRoute(getAccessMatrixRoute, "admin", FORBIDDEN), async (c) => {
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
    platformRoute(putAccessMatrixRoute, "admin", FORBIDDEN),
    async (c) => {
      const { registry, workspace } = c.env;
      const name = c.req.valid("param").tool;
      const tool = await registry.findTool(workspace, name);
      if (!tool) return c.json(missing(name), 404);
      try {
        await registry.setRoleAccessMany(
          tool.id,
          c.req.valid("json").changes.map((change) => ({
            role: change.role,
            action: change.action,
            allowed: change.allowed ?? undefined,
          })),
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
              message: `\`changes\` is 1 to ${MAX_ACCESS_CHANGES} of { role, action, allowed: true, false or null }.`,
            },
            400,
          ),
  );

  app.all("/api/tools/:tool/access-matrix", methodNotAllowed);
}
