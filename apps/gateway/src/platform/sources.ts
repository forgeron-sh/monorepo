import { ChangelogRefusal, MigrationError } from "@forgeron/hosting";
import {
  addChannelRoute,
  addRepositoryToolRoute,
  copyBranchDataRoute,
  deleteToolRoute,
  getToolSourceRoute,
  putChannelRoute,
  putToolSourceRoute,
  removeChannelRoute,
  updateToolRoute,
} from "@forgeron/platform-contract";
import {
  closeChannel,
  deleteToolEverywhere,
  RegistryError,
  type Registry,
  type Tool,
  type ToolSource,
} from "@forgeron/registry";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { issueToken } from "../identity/authn/tokens";
import { DEPLOY_SCOPE } from "../deploy/deploy";
import { describeUpdate, marketplaceIdOf, updateChannel, UpdateError } from "../sources/update";
import { CopyError, copyDatabase } from "../sources/branch-data";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// Where a tool comes from, its permanent channels and their updates (D-121, D-125), for who holds `tools:write` (or `tools:read`, to look). An
// update puts a release of the branch a channel follows on that channel, with what it asks for
// approved in the same step: there is no screen of approvals, and no promotion between branches.
// Adding a tool from a repository creates it with no environment and gives the token its CI deploys
// with.

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

/** Where a permanent channel answers: `/t/<tool>/`, `/t/<tool>~<name>/` (D-125). */
const channelAddress = (origin: string, tool: string, channel: string) =>
  `${origin}/t/${tool}${channel === "production" ? "" : `~${channel}`}/`;

/** One permanent channel as the console reads it, with the release waiting for it. */
async function channelJson(
  c: { env: PlatformEnv["Bindings"] },
  registry: Registry,
  tool: Tool,
  source: ToolSource,
  name: string,
) {
  const hosting = c.env.hosting(c.env.workspace);
  const channel = (await registry.permanentChannels(tool.id)).find((x) => x.name === name)!;
  const described = await describeUpdate(registry, tool, source, name, hosting);
  return {
    name,
    ...(channel.follows ? { follows: channel.follows } : {}),
    autoUpdate: channel.autoUpdate,
    serves: described.production,
    address: channelAddress(c.env.origin, tool.name, name),
    update: described.update,
  };
}

/** The tool's source and every permanent channel, production first. */
async function sourceAnswer(c: { env: PlatformEnv["Bindings"] }, registry: Registry, tool: Tool) {
  const source = await registry.toolSource(tool.id);
  const channels = [];
  for (const channel of await registry.permanentChannels(tool.id)) {
    channels.push(await channelJson(c, registry, tool, source, channel.name));
  }
  const production = channels[0]!;
  return {
    ...sourceJson(source),
    production: production.serves,
    update: production.update,
    channels,
  };
}

export function mountSources(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(platformRoute(getToolSourceRoute, "tools:read"), async (c) => {
    const { registry, workspace } = c.env;
    const tool = await registry.findTool(workspace, c.req.valid("param").tool);
    if (!tool) return c.json(missing("There is no such tool."), 404);
    return c.json(await sourceAnswer(c, registry, tool), 200);
  });

  app.openapi(platformRoute(putToolSourceRoute, "tools:write"), async (c) => {
    const { registry, workspace } = c.env;
    const tool = await registry.findTool(workspace, c.req.valid("param").tool);
    if (!tool) return c.json(missing("There is no such tool."), 404);
    const body = c.req.valid("json");
    await registry.setToolSource({
      toolId: tool.id,
      ...(body.autoUpdate === undefined ? {} : { autoUpdate: body.autoUpdate }),
      ...(body.productionBranch === undefined ? {} : { productionBranch: body.productionBranch }),
      actor: c.get("person").id,
    });
    return c.json(await sourceAnswer(c, registry, tool), 200);
  });

  app.openapi(platformRoute(addChannelRoute, "tools:write"), async (c) => {
    const { registry, workspace } = c.env;
    const tool = await registry.findTool(workspace, c.req.valid("param").tool);
    if (!tool) return c.json(missing("There is no such tool."), 404);
    const body = c.req.valid("json");
    const source = await registry.toolSource(tool.id);
    if (source.kind === "repo" && !body.follows) {
      return c.json(
        { error: "INVALID", message: "follows: the branch whose releases it takes." },
        400,
      );
    }
    try {
      await registry.addChannel({
        toolId: tool.id,
        name: body.name,
        ...(source.kind === "repo" && body.follows ? { follows: body.follows } : {}),
        ...(body.autoUpdate === undefined ? {} : { autoUpdate: body.autoUpdate }),
        actor: c.get("person").id,
        ...(c.env.via ? { via: c.env.via } : {}),
      });
    } catch (error) {
      if (error instanceof RegistryError && error.code === "ALREADY_EXISTS") {
        return c.json({ error: error.code, message: error.message }, 409);
      }
      if (error instanceof RegistryError && error.code === "INVALID") {
        return c.json({ error: error.code, message: error.message }, 400);
      }
      throw error;
    }
    return c.json(await channelJson(c, registry, tool, source, body.name), 201);
  });

  app.openapi(platformRoute(putChannelRoute, "tools:write"), async (c) => {
    const { registry, workspace } = c.env;
    const { tool: name, channel } = c.req.valid("param");
    const tool = await registry.findTool(workspace, name);
    if (!tool) return c.json(missing("There is no such tool."), 404);
    const body = c.req.valid("json");
    const actor = c.get("person").id;
    if (channel === "production") {
      // Production's settings are the source's: the same as `PUT /source`.
      await registry.setToolSource({
        toolId: tool.id,
        ...(body.autoUpdate === undefined ? {} : { autoUpdate: body.autoUpdate }),
        ...(body.follows === undefined ? {} : { productionBranch: body.follows }),
        actor,
      });
    } else {
      if (!(await registry.findChannel(tool.id, channel))) {
        return c.json(missing(`There is no channel ${channel}.`), 404);
      }
      await registry.setChannel({
        toolId: tool.id,
        name: channel,
        ...(body.follows === undefined ? {} : { follows: body.follows }),
        ...(body.autoUpdate === undefined ? {} : { autoUpdate: body.autoUpdate }),
        actor,
        ...(c.env.via ? { via: c.env.via } : {}),
      });
    }
    const source = await registry.toolSource(tool.id);
    return c.json(await channelJson(c, registry, tool, source, channel), 200);
  });

  app.openapi(platformRoute(removeChannelRoute, "tools:write"), async (c) => {
    const { registry, workspace } = c.env;
    const { tool: name, channel } = c.req.valid("param");
    const tool = await registry.findTool(workspace, name);
    if (!tool) return c.json(missing("There is no such tool."), 404);
    if (channel === "production") {
      return c.json({ error: "INVALID", message: "Production is never removed." }, 400);
    }
    if (c.req.valid("json").confirm !== channel) {
      return c.json({ error: "NOT_CONFIRMED", message: `Type ${channel} to confirm.` }, 400);
    }
    if (!(await registry.findChannel(tool.id, channel))) {
      return c.json(missing(`There is no channel ${channel}.`), 404);
    }
    const hosting = c.env.hosting(workspace);
    if (!hosting) return c.json(NOT_CONFIGURED, 501);
    await closeChannel(registry, hosting, tool, channel);
    await registry.recordAudit({
      toolId: tool.id,
      actor: c.get("person").id,
      ...(c.env.via ? { via: c.env.via } : {}),
      kind: "access",
      subject: `channel:${channel}`,
      detail: { event: "channel-removed" },
    });
    return c.json({ removed: true as const }, 200);
  });

  app.openapi(platformRoute(deleteToolRoute, "tools:delete"), async (c) => {
    const { registry, workspace } = c.env;
    const tool = await registry.findTool(workspace, c.req.valid("param").tool);
    if (!tool) return c.json(missing("There is no such tool."), 404);
    if (c.req.valid("json").confirm !== tool.name) {
      return c.json({ error: "NOT_CONFIRMED", message: `Type ${tool.name} to confirm.` }, 400);
    }
    const hosting = c.env.hosting(workspace);
    if (!hosting) return c.json(NOT_CONFIGURED, 501);
    // Every Worker and database first, production included: a host that fails leaves the tool as it
    // was. The audit line outlives the tool (it holds no foreign key).
    const environments = (await registry.listEnvironments(tool.id)).length;
    await deleteToolEverywhere(registry, hosting, tool);
    await registry.recordAudit({
      toolId: tool.id,
      actor: c.get("person").id,
      ...(c.env.via ? { via: c.env.via } : {}),
      kind: "access",
      subject: "tool:deleted",
      detail: { event: "tool-deleted", tool: tool.name, environments },
    });
    return c.json({ deleted: true as const }, 200);
  });

  app.openapi(platformRoute(updateToolRoute, "tools:write"), async (c) => {
    const { registry, workspace } = c.env;
    const tool = await registry.findTool(workspace, c.req.valid("param").tool);
    if (!tool) return c.json(missing("There is no such tool."), 404);
    const hosting = c.env.hosting(workspace);
    if (!hosting) return c.json(NOT_CONFIGURED, 501);
    const body = c.req.valid("json");
    const channel = body.channel ?? "production";
    try {
      const done = await updateChannel(registry, hosting, tool, {
        actor: c.get("person").email,
        channel,
        ...(c.env.via ? { via: c.env.via } : {}),
        ...(body.approve ? { approve: true } : {}),
        ...(body.allowDestructive ? { allowDestructive: true } : {}),
        expected: body.version,
      });
      return c.json({ tool: tool.name, channel, version: done.version.version }, 200);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (error instanceof UpdateError) {
        return error.code === "STALE"
          ? c.json({ error: error.code, message }, 409)
          : c.json({ error: error.code, message }, 404);
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

  app.openapi(platformRoute(addRepositoryToolRoute, "tools:write"), async (c) => {
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
    // Nobody may add it to their library until someone who may give access says who (D-117).
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

  app.openapi(platformRoute(copyBranchDataRoute, "tools:data"), async (c) => {
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
  app.all("/api/tools/:tool/channels", methodNotAllowed);
  app.all("/api/tools/:tool/channels/:channel", methodNotAllowed);
  app.all("/api/tools/from-repository", methodNotAllowed);
}
