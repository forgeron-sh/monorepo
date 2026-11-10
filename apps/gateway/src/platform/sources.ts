import { ChangelogRefusal, MigrationError } from "@forgeron/hosting";
import {
  addRepositoryToolRoute,
  copyBranchDataRoute,
  getToolSourceRoute,
  putToolSourceRoute,
  updateToolRoute,
} from "@forgeron/platform-contract";
import { RegistryError, type ToolSource } from "@forgeron/registry";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { issueToken } from "../identity/authn/tokens";
import { DEPLOY_SCOPE } from "../deploy/deploy";
import {
  describeUpdate,
  marketplaceIdOf,
  putUpdateInProduction,
  UpdateError,
} from "../sources/update";
import { CopyError, copyDatabase } from "../sources/branch-data";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// Where a tool comes from, and its update (D-121), for admins. The update is put in production with
// what it asks for approved in the same step: there is no screen of approvals. Adding a tool from a
// repository creates it with no environment and gives the token its CI deploys with.

const missing = (message: string) => ({ error: "NOT_FOUND", message });
const NOT_CONFIGURED = {
  error: "NOT_CONFIGURED",
  message: "This gateway has no Cloudflare account to deploy to.",
};
/** The deployment token of a repository's CI: a year, as the longest `forgeron token` gives. */
const TOKEN_DAYS = 365;
const DAY = 24 * 60 * 60;

const sourceJson = (source: ToolSource) => ({
  kind: source.kind,
  ...(marketplaceIdOf(source.source) ? { marketplace: marketplaceIdOf(source.source)! } : {}),
  ...(source.repo ? { repo: source.repo } : {}),
  productionBranch: source.productionBranch,
  autoUpdate: source.autoUpdate,
});

export function mountSources(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(platformRoute(getToolSourceRoute, "admin"), async (c) => {
    const { registry, workspace } = c.env;
    const tool = await registry.findTool(workspace, c.req.valid("param").tool);
    if (!tool) return c.json(missing("There is no such tool."), 404);
    const source = await registry.toolSource(tool.id);
    return c.json(
      { ...sourceJson(source), ...(await describeUpdate(registry, tool, source)) },
      200,
    );
  });

  app.openapi(platformRoute(putToolSourceRoute, "admin"), async (c) => {
    const { registry, workspace } = c.env;
    const tool = await registry.findTool(workspace, c.req.valid("param").tool);
    if (!tool) return c.json(missing("There is no such tool."), 404);
    const body = c.req.valid("json");
    const source = await registry.setToolSource({
      toolId: tool.id,
      ...(body.autoUpdate === undefined ? {} : { autoUpdate: body.autoUpdate }),
      ...(body.productionBranch === undefined ? {} : { productionBranch: body.productionBranch }),
      actor: c.get("person").id,
    });
    return c.json(
      { ...sourceJson(source), ...(await describeUpdate(registry, tool, source)) },
      200,
    );
  });

  app.openapi(platformRoute(updateToolRoute, "admin"), async (c) => {
    const { registry, workspace } = c.env;
    const tool = await registry.findTool(workspace, c.req.valid("param").tool);
    if (!tool) return c.json(missing("There is no such tool."), 404);
    const hosting = c.env.hosting(workspace);
    if (!hosting) return c.json(NOT_CONFIGURED, 501);
    const body = c.req.valid("json");
    try {
      const done = await putUpdateInProduction(registry, hosting, tool, {
        actor: c.get("person").email,
        ...(c.env.via ? { via: c.env.via } : {}),
        ...(body.approve ? { approve: true } : {}),
        ...(body.withoutRelease ? { withoutRelease: true } : {}),
        expected: body.version,
      });
      return c.json({ tool: tool.name, version: done.version.version }, 200);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (error instanceof UpdateError) {
        return error.code === "NO_UPDATE"
          ? c.json({ error: error.code, message }, 404)
          : c.json({ error: error.code, message }, 409);
      }
      if (error instanceof ChangelogRefusal) return c.json({ error: error.code, message }, 422);
      if (error instanceof MigrationError) {
        return c.json({ error: "MIGRATION_REFUSED", message }, 409);
      }
      if (error instanceof RegistryError && error.code === "PENDING_APPROVAL") {
        return c.json({ error: error.code, message }, 409);
      }
      throw error;
    }
  });

  app.openapi(platformRoute(addRepositoryToolRoute, "admin"), async (c) => {
    const { registry, workspace, bearer, now } = c.env;
    if (!bearer) {
      return c.json({ error: "NOT_CONFIGURED", message: "This gateway cannot issue tokens." }, 501);
    }
    const body = c.req.valid("json");
    if (await registry.findTool(workspace, body.name)) {
      return c.json(
        { error: "ALREADY_EXISTS", message: `The workspace already has a tool ${body.name}.` },
        409,
      );
    }
    const actor = c.get("person").id;
    const productionBranch = body.productionBranch ?? "main";
    const tool = await registry.createTool({ workspace, name: body.name });
    await registry.linkRepository({ toolId: tool.id, repo: body.repo, productionBranch, actor });
    // Nobody may add it to their library until an admin says who (D-117).
    await registry.setAvailability({ toolId: tool.id, mode: "nobody", actor });
    const at = now();
    const token = await issueToken({
      secret: bearer.secret,
      person: "deploy:github",
      workspace,
      tool: tool.name,
      ttlSeconds: TOKEN_DAYS * DAY,
      now: at,
      scope: DEPLOY_SCOPE,
    });
    return c.json(
      {
        tool: tool.name,
        repo: body.repo,
        productionBranch,
        token,
        expiresAt: new Date(at.getTime() + TOKEN_DAYS * DAY * 1000).toISOString(),
      },
      201,
    );
  });

  app.openapi(platformRoute(copyBranchDataRoute, "admin"), async (c) => {
    const { registry, workspace } = c.env;
    const { tool: name, branch } = c.req.valid("param");
    const tool = await registry.findTool(workspace, name);
    if (!tool) return c.json(missing("There is no such tool."), 404);
    const { from, confirm } = c.req.valid("json");
    if (confirm !== tool.name) {
      return c.json({ error: "NOT_CONFIRMED", message: `Type ${tool.name} to confirm.` }, 400);
    }
    if (from === branch) {
      return c.json({ error: "INVALID", message: "Copy from another branch." }, 400);
    }
    // Branches only: production's data is never copied, nor replaced (D-121).
    const previews = (await registry.listEnvironments(tool.id)).filter((e) => e.name === "preview");
    for (const b of [from, branch]) {
      if (!previews.some((e) => e.branch === b)) {
        return c.json(missing(`The branch ${b} has no preview.`), 404);
      }
    }
    const hosting = c.env.hosting(workspace);
    if (!hosting?.openDatabase) {
      return c.json(
        { error: "NOT_CONFIGURED", message: "This gateway cannot reach the databases." },
        501,
      );
    }
    const open = (b: string) =>
      hosting.openDatabase!({ tool: tool.name, name: "preview", branch: b });
    const [source, target] = await Promise.all([open(from), open(branch)]);
    if (!source || !target) return c.json(missing("One of the branches has no database."), 404);
    try {
      const tables = await copyDatabase(source, target);
      await registry.recordAudit({
        toolId: tool.id,
        actor: c.get("person").email,
        ...(c.env.via ? { via: c.env.via } : {}),
        kind: "access",
        subject: `data:${from}->${branch}`,
        detail: { event: "branch-data-copied", from, to: branch, tables },
      });
      return c.json({ tables }, 200);
    } catch (error) {
      if (error instanceof CopyError) {
        return error.code === "TOO_LARGE"
          ? c.json({ error: error.code, message: error.message }, 413)
          : c.json({ error: error.code, message: error.message }, 409);
      }
      throw error;
    }
  });

  app.all("/api/tools/:tool/branches/:branch/data", methodNotAllowed);
  app.all("/api/tools/:tool/source", methodNotAllowed);
  app.all("/api/tools/:tool/update", methodNotAllowed);
  app.all("/api/tools/from-repository", methodNotAllowed);
}
