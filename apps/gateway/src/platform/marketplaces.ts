import type { Manifest } from "@forgeron/manifest";
import {
  addMarketplaceRoute,
  installMarketplaceToolRoute,
  listMarketplacesRoute,
  listMarketplaceToolsRoute,
  marketplaceToolCardRoute,
  planMarketplaceToolRoute,
  removeMarketplaceRoute,
  syncMarketplaceRoute,
} from "@forgeron/platform-contract";
import { marketplaceSource, RegistryError, TEMPLATE_WORKSPACE } from "@forgeron/registry";
import type { Context } from "hono";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { MarketplaceError } from "../marketplace/github";
import { syncMarketplace } from "../marketplace/sync";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// The marketplaces of a workspace (D-116), for admins. `official` is the platform's catalogue
// (`@templates`, D-081), synced from `OFFICIAL_MARKETPLACE` when it is set; any other id is a GitHub
// repository the workspace added, whose tools live in `@mp:<id>`. Installing copies a tool into the
// workspace with the template install (one batch, audited, approvals pending).

const OFFICIAL = "official";

type Found = { source: string; repo?: string; token?: string; id: string };

/** Where a marketplace id points, for this workspace; `undefined` for another workspace's or none. */
async function locate(
  c: Context<PlatformEnv>,
  id: string,
  withToken = false,
): Promise<Found | undefined> {
  if (id === OFFICIAL) {
    return {
      id,
      source: TEMPLATE_WORKSPACE,
      ...(c.env.officialMarketplace ? { repo: c.env.officialMarketplace } : {}),
    };
  }
  const found = await c.env.registry.findMarketplace(c.env.workspace, id);
  if (!found) return undefined;
  const token = withToken ? await c.env.registry.marketplaceToken(c.env.workspace, id) : undefined;
  return { id, source: marketplaceSource(id), repo: found.repo, ...(token ? { token } : {}) };
}

const missing = (what = "marketplace") => ({
  error: "NOT_FOUND",
  message: `There is no such ${what}.`,
});

const summaryOf = (m: Manifest) => m.summary ?? m.description ?? "";

export function mountMarketplaces(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(platformRoute(listMarketplacesRoute, "admin"), async (c) => {
    const added = await c.env.registry.listMarketplaces(c.env.workspace);
    return c.json(
      {
        marketplaces: [
          {
            id: OFFICIAL,
            repo: c.env.officialMarketplace ?? null,
            title: null,
            official: true,
            hasToken: false,
            syncedAt: null,
            syncError: null,
          },
          ...added.map((m) => ({
            id: m.id,
            repo: m.repo,
            title: m.title ?? null,
            official: false,
            hasToken: m.hasToken,
            syncedAt: m.syncedAt ?? null,
            syncError: m.syncError ?? null,
          })),
        ],
      },
      200,
    );
  });

  app.openapi(platformRoute(addMarketplaceRoute, "admin"), async (c) => {
    const body = c.req.valid("json");
    try {
      const m = await c.env.registry.addMarketplace({
        workspace: c.env.workspace,
        repo: body.repo.trim(),
        ...(body.token ? { token: body.token } : {}),
        actor: c.get("person").id,
        ...(c.env.via ? { via: c.env.via } : {}),
      });
      return c.json(
        {
          id: m.id,
          repo: m.repo,
          title: null,
          official: false,
          hasToken: m.hasToken,
          syncedAt: null,
          syncError: null,
        },
        201,
      );
    } catch (error) {
      if (error instanceof RegistryError) {
        if (error.code === "INVALID")
          return c.json({ error: error.code, message: error.message }, 400);
        if (error.code === "ALREADY_EXISTS") {
          return c.json({ error: error.code, message: error.message }, 409);
        }
      }
      throw error;
    }
  });

  app.openapi(platformRoute(removeMarketplaceRoute, "admin"), async (c) => {
    const { id } = c.req.valid("param");
    if (id === OFFICIAL || !(await c.env.registry.findMarketplace(c.env.workspace, id))) {
      return c.json(missing(), 404);
    }
    await c.env.registry.removeMarketplace({
      workspace: c.env.workspace,
      id,
      actor: c.get("person").id,
      ...(c.env.via ? { via: c.env.via } : {}),
    });
    return c.body(null, 204);
  });

  app.openapi(platformRoute(syncMarketplaceRoute, "admin"), async (c) => {
    const { id } = c.req.valid("param");
    const found = await locate(c, id, true);
    if (!found) return c.json(missing(), 404);
    if (!found.repo) {
      return c.json(
        {
          error: "NOT_CONFIGURED",
          message: "The official marketplace has no repository on this platform.",
        },
        502,
      );
    }
    try {
      const report = await syncMarketplace(c.env.registry, found.source, {
        repo: found.repo,
        fetch: c.env.marketplaceFetch,
        ...(found.token ? { token: found.token } : {}),
      });
      if (id !== OFFICIAL) {
        await c.env.registry.recordMarketplaceSync(c.env.workspace, id, {
          ...(report.title ? { title: report.title } : {}),
        });
      }
      return c.json({ title: report.title ?? null, tools: report.tools }, 200);
    } catch (error) {
      if (!(error instanceof MarketplaceError)) throw error;
      if (id !== OFFICIAL) {
        await c.env.registry.recordMarketplaceSync(c.env.workspace, id, { error: error.message });
      }
      return c.json({ error: "MARKETPLACE_UNREADABLE", message: error.message }, 502);
    }
  });

  app.openapi(platformRoute(listMarketplaceToolsRoute, "admin"), async (c) => {
    const found = await locate(c, c.req.valid("param").id);
    if (!found) return c.json(missing(), 404);
    const tools = [];
    for (const t of await c.env.registry.listTemplates(found.source)) {
      const described = await c.env.registry.describeTemplate(t.name, found.source);
      if (!described) continue;
      tools.push({
        name: t.name,
        title: described.manifest.title ?? t.name,
        summary: summaryOf(described.manifest),
        version: t.version,
        resources: t.resources,
        installed: (await c.env.registry.findTool(c.env.workspace, t.name)) !== undefined,
      });
    }
    return c.json({ tools }, 200);
  });

  app.openapi(platformRoute(marketplaceToolCardRoute, "admin"), async (c) => {
    const { id, tool } = c.req.valid("param");
    const found = await locate(c, id);
    const d = found ? await c.env.registry.describeTemplate(tool, found.source) : undefined;
    if (!d) return c.json(missing("marketplace or tool"), 404);
    const m = d.manifest;
    const r = m.resources ?? {};
    return c.json(
      {
        name: d.name,
        title: m.title ?? d.name,
        summary: summaryOf(m),
        version: d.version,
        resources: d.resources,
        installed: (await c.env.registry.findTool(c.env.workspace, d.name)) !== undefined,
        description: m.description ?? null,
        publishedAt: d.publishedAt,
        readme: d.readme ?? null,
        guide: d.guide ?? null,
        interfaces: { ...m.interfaces },
        roles: Object.entries(m.roles ?? {}).map(([name, role]) => ({
          name,
          label: role.label ?? name,
        })),
        actions: Object.entries(m.actions ?? {}).map(([name, a]) => ({
          name,
          access: a.access,
          description: a.description,
        })),
        network: r.network?.allow ?? [],
        secrets: Object.entries(r.secrets ?? {}).map(([name, s]) => ({ name, why: s.why ?? null })),
        userSecrets: Object.entries(r.userSecrets ?? {}).map(([name, s]) => ({
          name,
          label: s.label,
        })),
        connectors: Object.entries(r.connectors ?? {}).map(([name, k]) => ({ name, type: k.type })),
        database: r.db !== undefined,
        changelog: d.changelog,
      },
      200,
    );
  });

  app.openapi(platformRoute(installMarketplaceToolRoute, "admin"), async (c) => {
    const { id, tool } = c.req.valid("param");
    const found = await locate(c, id);
    if (!found) return c.json(missing(), 404);
    try {
      const installed = await c.env.registry.installTemplate({
        workspace: c.env.workspace,
        template: tool,
        source: found.source,
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

  app.openapi(platformRoute(planMarketplaceToolRoute, "admin"), async (c) => {
    const { id, tool } = c.req.valid("param");
    const found = await locate(c, id);
    if (!found) return c.json(missing(), 404);
    try {
      const plan = await c.env.registry.createInstallPlan({
        workspace: c.env.workspace,
        template: tool,
        source: found.source,
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

  app.all("/api/marketplaces", methodNotAllowed);
  app.all("/api/marketplaces/:id", methodNotAllowed);
  app.all("/api/marketplaces/:id/sync", methodNotAllowed);
  app.all("/api/marketplaces/:id/tools", methodNotAllowed);
  app.all("/api/marketplaces/:id/tools/:tool", methodNotAllowed);
  app.all("/api/marketplaces/:id/tools/:tool/install", methodNotAllowed);
  app.all("/api/marketplaces/:id/tools/:tool/install-plan", methodNotAllowed);
}
