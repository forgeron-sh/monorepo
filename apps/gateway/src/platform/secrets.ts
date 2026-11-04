import { listSecretsRoute, setSecretRoute } from "@forgeron/platform-contract";
import { RegistryError } from "@forgeron/registry";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// The secrets of a tool in one environment (docs/sdk.md §5), for admins. A value goes in and never
// comes out: the answers carry names.

const FORBIDDEN = "Secrets are for admins.";
const SECRET_NAME = /^[A-Z][A-Z0-9_]*$/;
const missing = (message: string) => ({ error: "NOT_FOUND", message });
const isEnvironment = (name: string): name is "preview" | "production" =>
  name === "preview" || name === "production";

export function mountSecrets(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(platformRoute(listSecretsRoute, "admin", FORBIDDEN), async (c) => {
    const { registry, workspace } = c.env;
    const { tool: name, environment } = c.req.valid("param");
    const tool = await registry.findTool(workspace, name);
    if (!tool) return c.json(missing(`There is no tool ${name}.`), 404);
    if (!isEnvironment(environment)) return c.json(missing("There is no such environment."), 404);
    return c.json({ secrets: await registry.secretNames(tool.id, environment) }, 200);
  });

  app.openapi(
    platformRoute(setSecretRoute, "admin", FORBIDDEN),
    async (c) => {
      const { registry, workspace } = c.env;
      const { tool: toolName, environment, name } = c.req.valid("param");
      const tool = await registry.findTool(workspace, toolName);
      if (!tool) return c.json(missing(`There is no tool ${toolName}.`), 404);
      if (!isEnvironment(environment)) return c.json(missing("There is no such environment."), 404);
      if (!SECRET_NAME.test(name)) return c.json(missing("There is no such secret name."), 404);
      try {
        await registry.setSecret(tool.id, environment, name, c.req.valid("json").value);
      } catch (error) {
        if (error instanceof RegistryError) return c.json({ error: error.code }, 500);
        throw error;
      }
      return c.body(null, 204);
    },
    (result, c) =>
      result.success
        ? undefined
        : c.json({ error: "INVALID", message: "`value` is a non-empty string (16 KB max)." }, 400),
  );

  app.on(
    ["POST", "PATCH", "DELETE", "OPTIONS"],
    "/api/tools/:tool/environments/:environment/secrets",
    methodNotAllowed,
  );
  app.on(
    ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    "/api/tools/:tool/environments/:environment/secrets/:name",
    methodNotAllowed,
  );
}
