import { installTemplateRoute, listTemplatesRoute } from "@forgeron/platform-contract";
import { RegistryError } from "@forgeron/registry";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// The template catalogue and its installation (D-080), for admins. The registry audits the install
// in the same batch as the tool; the actor is the person, and `via` the door when it is the MCP.

export function mountTemplates(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(platformRoute(listTemplatesRoute, "admin"), async (c) =>
    c.json({ templates: await c.env.registry.listTemplates() }, 200),
  );

  app.openapi(platformRoute(installTemplateRoute, "admin"), async (c) => {
    try {
      const installed = await c.env.registry.installTemplate({
        workspace: c.env.workspace,
        template: c.req.valid("param").name,
        actor: c.get("person").id,
        ...(c.env.via ? { via: c.env.via } : {}),
      });
      return c.json(
        {
          tool: installed.tool.name,
          version: installed.version.version,
          approvals: installed.approvals,
        },
        201,
      );
    } catch (error) {
      if (error instanceof RegistryError) {
        if (error.code === "NOT_FOUND")
          return c.json({ error: error.code, message: error.message }, 404);
        if (error.code === "ALREADY_EXISTS") {
          return c.json({ error: error.code, message: error.message }, 409);
        }
      }
      throw error;
    }
  });

  app.all("/api/templates", methodNotAllowed);
  app.all("/api/templates/:name/install", methodNotAllowed);
}
