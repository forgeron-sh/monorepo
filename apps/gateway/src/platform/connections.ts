import {
  listConnectionsRoute,
  revokeConnectionRoute,
  secretsStatusRoute,
} from "@forgeron/platform-contract";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// Delegated connectors, for admins (docs/sdk.md §10): who consented to what, never a token; and the
// secrets a tool declares with whether each environment has them (no value is read).

const missing = (message: string) => ({ error: "NOT_FOUND", message });
const isEnvironment = (name: string): name is "preview" | "production" =>
  name === "preview" || name === "production";

export function mountConnections(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(
    platformRoute(listConnectionsRoute, "admin", "Connections are for admins."),
    async (c) => {
      const { registry, workspace } = c.env;
      const { tool: name, environment } = c.req.valid("param");
      const tool = await registry.findTool(workspace, name);
      if (!tool) return c.json(missing(`There is no tool ${name}.`), 404);
      if (!isEnvironment(environment)) return c.json(missing("There is no such environment."), 404);
      return c.json({ connections: await registry.listConnections(tool.id, environment) }, 200);
    },
  );

  app.openapi(
    platformRoute(revokeConnectionRoute, "admin", "Connections are for admins."),
    async (c) => {
      const { registry, workspace } = c.env;
      const { tool: name, environment, connector } = c.req.valid("param");
      const tool = await registry.findTool(workspace, name);
      if (!tool) return c.json(missing(`There is no tool ${name}.`), 404);
      if (!isEnvironment(environment)) return c.json(missing("There is no such environment."), 404);
      // The person's id is decoded here, once, from the address as it was sent: Hono's own decoding
      // of a malformed one would pass it on as it is, where a bad encoding is a 400.
      let userId: string;
      try {
        userId = decodeURIComponent(new URL(c.req.url).pathname.split("/")[7] ?? "");
      } catch {
        return c.json({ error: "INVALID", message: "The person is not valid." }, 400);
      }
      const revoked = await registry.revokeConnection({
        toolId: tool.id,
        environment,
        userId,
        connector,
      });
      if (!revoked) {
        return c.json(missing("That person has no such consent."), 404);
      }
      await registry
        .recordAudit({
          toolId: tool.id,
          actor: c.get("person").id,
          interface: "api",
          kind: "access",
          subject: `connector-consent:${connector}:revoke`,
          detail: { environment, person: userId },
        })
        .catch(() => undefined);
      return c.body(null, 204);
    },
  );

  app.openapi(
    platformRoute(secretsStatusRoute, "developer", "Secrets status is for developers and admins."),
    async (c) => {
      const { registry, workspace } = c.env;
      const name = c.req.valid("param").tool;
      const tool = await registry.findTool(workspace, name);
      if (!tool) return c.json(missing(`There is no tool ${name}.`), 404);
      return c.json({ secrets: await registry.secretsStatus(tool.id) }, 200);
    },
  );

  // Connections take GET on the list and DELETE on one consent; anything else is 405 first.
  app.on(
    ["POST", "PUT", "PATCH", "OPTIONS"],
    "/api/tools/:tool/environments/:environment/connections",
    methodNotAllowed,
  );
  app.on(
    ["GET", "POST", "PUT", "PATCH", "OPTIONS"],
    "/api/tools/:tool/environments/:environment/connections/:user/:connector",
    methodNotAllowed,
  );
  app.all("/api/tools/:tool/secrets-status", methodNotAllowed);
}
