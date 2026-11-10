import {
  getAvailabilityRoute,
  getPilotAvailabilityRoute,
  installLibraryToolRoute,
  installPilotRoute,
  pilotCardRoute,
  putPilotAvailabilityRoute,
  uninstallPilotRoute,
  libraryCardRoute,
  listLibraryRoute,
  putAvailabilityRoute,
  uninstallLibraryToolRoute,
} from "@forgeron/platform-contract";
import { findCard, isAvailable, listCatalog, type Availability } from "@forgeron/registry";
import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import {
  needsSetup,
  pilotNeedsSetup,
  pilotSetupPath,
  previewManifest,
  setupPath,
} from "../library/library";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// A person's library (D-117): the tools they may add, those they added, how to use one; and, for an
// admin, who may add a tool. A tool with no rule predates libraries: it is in everyone's library who
// may call it, and cannot be removed. A member only ever sees tools that serve production.

const missing = { error: "NOT_FOUND", message: "There is no such tool in your library." };

/** One tool of the catalog as the person's library sees it, or `undefined` when they may not add it. */
async function entryOf(c: Context<PlatformEnv>, tool: { name: string; access: string }) {
  const person = c.get("person");
  const record = await c.env.registry.findTool(c.env.workspace, tool.name);
  if (!record) return undefined;
  const rule = await c.env.registry.availabilityOf(record.id);
  if (rule) {
    if (!isAvailable(rule, person)) return undefined;
  } else if (tool.access !== "granted") {
    return undefined;
  }
  const installed = rule ? await c.env.registry.isInstalled(record.id, person.id) : true;
  return {
    id: record.id,
    managed: rule !== undefined,
    installed,
    needsSetup: installed ? await needsSetup(c.env.registry, record.id, person.id) : false,
  };
}

/** A branch as a pilot for this person, or `undefined` when it is not opened to them (D-119). */
async function pilotOf(c: Context<PlatformEnv>, toolId: string, name: string, branch: string) {
  const person = c.get("person");
  const rule = await c.env.registry.previewAvailabilityOf(toolId, branch);
  if (!rule || !isAvailable(rule, person)) return undefined;
  const manifest = await previewManifest(c.env.registry, toolId, branch);
  if (!manifest) return undefined;
  const installed = await c.env.registry.isPilotInstalled(toolId, branch, person.id);
  const pending = installed
    ? await pilotNeedsSetup(c.env.registry, toolId, branch, person.id)
    : false;
  return {
    manifest,
    entry: {
      name,
      title: manifest.title ?? name,
      summary: manifest.summary ?? manifest.description ?? "",
      icon: null,
      installed,
      managed: true,
      needsSetup: pending,
      pilot: branch,
    },
  };
}

const noPilot = { error: "NOT_FOUND", message: "There is no such pilot in your library." };

const availabilityBody = (rule: Availability | undefined) =>
  rule
    ? { mode: rule.mode, roles: rule.roles, people: rule.people, updatedAt: rule.updatedAt ?? null }
    : { mode: "open" as const, roles: [], people: [], updatedAt: null };

export function mountLibrary(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(platformRoute(listLibraryRoute, "member"), async (c) => {
    const person = c.get("person");
    const tools = [];
    for (const tool of await listCatalog(c.env.registry, c.env.workspace, {
      roles: person.roles,
    })) {
      if (tool.productionVersion === null) continue;
      const entry = await entryOf(c, tool);
      if (!entry) continue;
      tools.push({
        name: tool.name,
        title: tool.title,
        summary: tool.summary,
        icon: tool.icon,
        installed: entry.installed,
        managed: entry.managed,
        needsSetup: entry.needsSetup,
        pilot: null,
      });
    }
    // Pilots (D-119): each branch an admin opened to this person, as a tool of its own.
    for (const record of await c.env.registry.listTools(c.env.workspace)) {
      for (const env of await c.env.registry.listEnvironments(record.id)) {
        if (env.name !== "preview" || !env.branch || !env.versionId) continue;
        const pilot = await pilotOf(c, record.id, record.name, env.branch);
        if (pilot) tools.push(pilot.entry);
      }
    }
    return c.json({ tools }, 200);
  });

  app.openapi(platformRoute(libraryCardRoute, "member"), async (c) => {
    const person = c.get("person");
    const name = c.req.valid("param").tool;
    const card = await findCard(
      c.env.registry,
      c.env.workspace,
      name,
      { roles: person.roles },
      c.env.origin,
    );
    const entry = card && card.productionVersion !== null ? await entryOf(c, card) : undefined;
    if (!card || !entry) return c.json(missing, 404);
    const usable = entry.installed;
    return c.json(
      {
        name: card.name,
        title: card.title,
        summary: card.summary,
        icon: card.icon,
        installed: entry.installed,
        managed: entry.managed,
        needsSetup: entry.needsSetup,
        pilot: null,
        guide: card.guide,
        images: Object.fromEntries(card.assets.map((a) => [a.path, a.url])),
        setupUrl: entry.needsSetup ? setupPath(card.name) : null,
        use: {
          web: usable && card.interfaces.web ? { url: `${c.env.origin}/t/${card.name}/` } : null,
          mcp: usable ? card.connect.mcp : null,
          cli: usable ? card.connect.cli : null,
        },
      },
      200,
    );
  });

  app.openapi(platformRoute(installLibraryToolRoute, "member"), async (c) => {
    const person = c.get("person");
    const name = c.req.valid("param").tool;
    const card = await findCard(
      c.env.registry,
      c.env.workspace,
      name,
      { roles: person.roles },
      c.env.origin,
    );
    const entry = card && card.productionVersion !== null ? await entryOf(c, card) : undefined;
    if (!entry) return c.json(missing, 404);
    if (entry.managed) {
      await c.env.registry.installForPerson({
        toolId: entry.id,
        person: person.id,
        ...(c.env.via ? { via: c.env.via } : {}),
      });
    }
    const pending = await needsSetup(c.env.registry, entry.id, person.id);
    return c.json({ installed: true as const, setupUrl: pending ? setupPath(name) : null }, 200);
  });

  app.openapi(platformRoute(uninstallLibraryToolRoute, "member"), async (c) => {
    const person = c.get("person");
    const record = await c.env.registry.findTool(c.env.workspace, c.req.valid("param").tool);
    if (!record) return c.json(missing, 404);
    if (!(await c.env.registry.availabilityOf(record.id))) {
      return c.json(
        { error: "OPEN_TOOL", message: "This tool is open to everyone: it cannot be removed." },
        409,
      );
    }
    const removed = await c.env.registry.uninstallForPerson({
      toolId: record.id,
      person: person.id,
      ...(c.env.via ? { via: c.env.via } : {}),
    });
    return removed ? c.body(null, 204) : c.json(missing, 404);
  });

  app.openapi(platformRoute(getAvailabilityRoute, "admin"), async (c) => {
    const record = await c.env.registry.findTool(c.env.workspace, c.req.valid("param").tool);
    if (!record) return c.json({ error: "NOT_FOUND", message: "There is no such tool." }, 404);
    return c.json(availabilityBody(await c.env.registry.availabilityOf(record.id)), 200);
  });

  app.openapi(platformRoute(putAvailabilityRoute, "admin"), async (c) => {
    const record = await c.env.registry.findTool(c.env.workspace, c.req.valid("param").tool);
    if (!record) return c.json({ error: "NOT_FOUND", message: "There is no such tool." }, 404);
    const body = c.req.valid("json");
    if (body.mode === "people") {
      for (const id of body.people ?? []) {
        if (!(await c.env.registry.findMember(c.env.workspace, id))) {
          return c.json(
            { error: "INVALID", message: `${id} is not a member of the workspace.` },
            400,
          );
        }
      }
    }
    const rule = await c.env.registry.setAvailability({
      toolId: record.id,
      mode: body.mode,
      ...(body.roles ? { roles: body.roles } : {}),
      ...(body.people ? { people: body.people } : {}),
      actor: c.get("person").id,
      ...(c.env.via ? { via: c.env.via } : {}),
    });
    return c.json(availabilityBody(rule), 200);
  });

  app.openapi(platformRoute(pilotCardRoute, "member"), async (c) => {
    const { tool, branch } = c.req.valid("param");
    const record = await c.env.registry.findTool(c.env.workspace, tool);
    const pilot = record ? await pilotOf(c, record.id, tool, branch) : undefined;
    if (!record || !pilot) return c.json(noPilot, 404);
    const env = (await c.env.registry.listEnvironments(record.id)).find(
      (e) => e.name === "preview" && e.branch === branch,
    );
    const version = env?.versionId ? await c.env.registry.getVersion(env.versionId) : undefined;
    const guide = version ? await c.env.registry.guideOf(record.id, version.buildId) : undefined;
    const usable = pilot.entry.installed;
    const base = `${c.env.origin}/t/${tool}@${branch}`;
    const i = pilot.manifest.interfaces;
    return c.json(
      {
        ...pilot.entry,
        guide: guide ?? null,
        images: {},
        setupUrl: pilot.entry.needsSetup ? pilotSetupPath(tool, branch) : null,
        use: {
          web: usable && i.web ? { url: `${base}/` } : null,
          mcp: usable && i.mcp ? { url: `${base}/mcp` } : null,
          cli: null,
        },
      },
      200,
    );
  });

  app.openapi(platformRoute(installPilotRoute, "member"), async (c) => {
    const { tool, branch } = c.req.valid("param");
    const person = c.get("person");
    const record = await c.env.registry.findTool(c.env.workspace, tool);
    const pilot = record ? await pilotOf(c, record.id, tool, branch) : undefined;
    if (!record || !pilot) return c.json(noPilot, 404);
    await c.env.registry.installPilotForPerson({
      toolId: record.id,
      branch,
      person: person.id,
      ...(c.env.via ? { via: c.env.via } : {}),
    });
    const pending = await pilotNeedsSetup(c.env.registry, record.id, branch, person.id);
    return c.json(
      { installed: true as const, setupUrl: pending ? pilotSetupPath(tool, branch) : null },
      200,
    );
  });

  app.openapi(platformRoute(uninstallPilotRoute, "member"), async (c) => {
    const { tool, branch } = c.req.valid("param");
    const record = await c.env.registry.findTool(c.env.workspace, tool);
    const removed = record
      ? await c.env.registry.uninstallPilotForPerson({
          toolId: record.id,
          branch,
          person: c.get("person").id,
          ...(c.env.via ? { via: c.env.via } : {}),
        })
      : false;
    return removed ? c.body(null, 204) : c.json(noPilot, 404);
  });

  const previewOf = async (c: Context<PlatformEnv>, tool: string, branch: string) => {
    const record = await c.env.registry.findTool(c.env.workspace, tool);
    if (!record) return undefined;
    const env = (await c.env.registry.listEnvironments(record.id)).find(
      (e) => e.name === "preview" && e.branch === branch,
    );
    return env ? record : undefined;
  };

  app.openapi(platformRoute(getPilotAvailabilityRoute, "admin"), async (c) => {
    const { tool, branch } = c.req.valid("param");
    const record = await previewOf(c, tool, branch);
    if (!record) return c.json({ error: "NOT_FOUND", message: "There is no such preview." }, 404);
    return c.json(
      availabilityBody(await c.env.registry.previewAvailabilityOf(record.id, branch)),
      200,
    );
  });

  app.openapi(platformRoute(putPilotAvailabilityRoute, "admin"), async (c) => {
    const { tool, branch } = c.req.valid("param");
    const record = await previewOf(c, tool, branch);
    if (!record) return c.json({ error: "NOT_FOUND", message: "There is no such preview." }, 404);
    const body = c.req.valid("json");
    if (body.mode === "people") {
      for (const id of body.people ?? []) {
        if (!(await c.env.registry.findMember(c.env.workspace, id))) {
          return c.json(
            { error: "INVALID", message: `${id} is not a member of the workspace.` },
            400,
          );
        }
      }
    }
    const rule = await c.env.registry.setPreviewAvailability({
      toolId: record.id,
      branch,
      mode: body.mode,
      ...(body.roles ? { roles: body.roles } : {}),
      ...(body.people ? { people: body.people } : {}),
      actor: c.get("person").id,
      ...(c.env.via ? { via: c.env.via } : {}),
    });
    return c.json(availabilityBody(rule), 200);
  });

  app.all("/api/library/:tool/pilots/:branch", methodNotAllowed);
  app.all("/api/tools/:tool/previews/:branch/availability", methodNotAllowed);
  app.all("/api/library", methodNotAllowed);
  app.all("/api/library/:tool", methodNotAllowed);
  app.all("/api/tools/:tool/availability", methodNotAllowed);
}
