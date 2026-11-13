import {
  listToolsRoute,
  toolActivityRoute,
  toolBranchesRoute,
  toolManifestRoute,
  toolVersionsRoute,
} from "@forgeron/platform-contract";
import { RegistryError } from "@forgeron/registry";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { activityOf, branches, versionsOf } from "../console-api/tool-pages";
import { listTools } from "../console-api/tools";
import { previewManifest } from "../library/library";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// The tools of the workspace and what a tool's page reads. The list is for any signed-in member; the
// rest is for who holds `tools:read` (the commits, authors, audit lines and manifest are the team's).

const missing = (message: string) => ({ error: "NOT_FOUND", message });

export function mountTools(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(platformRoute(listToolsRoute, "signed-in"), async (c) =>
    c.json({ tools: await listTools(c.env.registry, c.env.workspace) }, 200),
  );

  // Each tool route finds its tool first (404), after the checks on who calls.
  app.openapi(platformRoute(toolBranchesRoute, "tools:read"), async (c) => {
    const { registry, workspace, origin } = c.env;
    const tool = await registry.findTool(workspace, c.req.valid("param").tool);
    if (!tool) return c.json(missing("There is no such tool."), 404);
    return c.json(await branches(registry, workspace, tool, origin), 200);
  });

  app.openapi(platformRoute(toolVersionsRoute, "tools:read"), async (c) => {
    const { registry, workspace } = c.env;
    const tool = await registry.findTool(workspace, c.req.valid("param").tool);
    if (!tool) return c.json(missing("There is no such tool."), 404);
    return c.json(await versionsOf(registry, tool), 200);
  });

  app.openapi(platformRoute(toolActivityRoute, "tools:read"), async (c) => {
    const { registry, workspace } = c.env;
    const tool = await registry.findTool(workspace, c.req.valid("param").tool);
    if (!tool) return c.json(missing("There is no such tool."), 404);
    return c.json(await activityOf(registry, workspace, tool, c.req.valid("query").limit), 200);
  });

  app.openapi(platformRoute(toolManifestRoute, "tools:read"), async (c) => {
    const { registry, workspace } = c.env;
    const name = c.req.valid("param").tool;
    const tool = await registry.findTool(workspace, name);
    if (!tool) return c.json(missing(`There is no tool ${name}.`), 404);
    const { branch } = c.req.valid("query");
    if (branch !== undefined) {
      const manifest = await previewManifest(registry, tool.id, branch);
      return manifest
        ? c.json({ manifest: manifest as Record<string, unknown> }, 200)
        : c.json({ error: "NO_MANIFEST", message: `The branch ${branch} has no preview.` }, 404);
    }
    try {
      return c.json({ manifest: await registry.currentManifest(tool.id) }, 200);
    } catch (error) {
      if (error instanceof RegistryError && error.code === "NO_MANIFEST") {
        return c.json({ error: "NO_MANIFEST", message: error.message }, 404);
      }
      throw error;
    }
  });

  // Any other method is 405, before anyone is asked who they are, as the old handlers answered.
  app.all("/api/tools", methodNotAllowed);
  app.all("/api/tools/:tool/branches", methodNotAllowed);
  app.all("/api/tools/:tool/versions", methodNotAllowed);
  app.all("/api/tools/:tool/activity", methodNotAllowed);
  app.all("/api/tools/:tool/manifest", methodNotAllowed);
}
