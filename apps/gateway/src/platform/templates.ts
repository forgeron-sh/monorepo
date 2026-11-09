import {
  createInstallPlanRoute,
  installFromPlanRoute,
  installTemplateRoute,
  listTemplatesRoute,
} from "@forgeron/platform-contract";
import { RegistryError } from "@forgeron/registry";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// The template catalogue and its installation (D-081), for admins. The registry audits the install
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

  // The two-step install of the admin MCP (D-092): a plan, then the plan's identifier and nothing else.
  app.openapi(platformRoute(createInstallPlanRoute, "admin"), async (c) => {
    try {
      const plan = await c.env.registry.createInstallPlan({
        workspace: c.env.workspace,
        template: c.req.valid("param").name,
        person: c.get("person").id,
        ...(c.env.via ? { via: c.env.via } : {}),
      });
      return c.json(
        {
          plan: plan.id,
          template: plan.template,
          version: plan.version,
          resources: plan.resources,
          expiresAt: plan.expiresAt,
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

  app.openapi(platformRoute(installFromPlanRoute, "admin"), async (c) => {
    try {
      const done = await c.env.registry.installFromPlan({
        workspace: c.env.workspace,
        plan: c.req.valid("param").plan,
        person: c.get("person").id,
        ...(c.env.via ? { via: c.env.via } : {}),
      });
      if (done === "unknown") {
        return c.json({ error: "NOT_FOUND", message: "There is no such install plan." }, 404);
      }
      if (done === "used") {
        return c.json({ error: "PLAN_USED", message: "This plan was already used." }, 409);
      }
      if (done === "stale") {
        return c.json(
          {
            error: "PLAN_STALE",
            message: "The template has a newer version than the plan showed: ask for a new plan.",
          },
          409,
        );
      }
      if (done === "expired") {
        return c.json({ error: "PLAN_EXPIRED", message: "This plan expired." }, 410);
      }
      return c.json(
        { tool: done.tool.name, version: done.version.version, approvals: done.approvals },
        201,
      );
    } catch (error) {
      if (error instanceof RegistryError && error.code === "ALREADY_EXISTS") {
        return c.json({ error: error.code, message: error.message }, 409);
      }
      throw error;
    }
  });

  app.all("/api/templates", methodNotAllowed);
  app.all("/api/templates/:name/install-plan", methodNotAllowed);
  app.all("/api/install-plans/:plan/install", methodNotAllowed);
  app.all("/api/templates/:name/install", methodNotAllowed);
}
