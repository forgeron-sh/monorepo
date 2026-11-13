import { toolCiRoute } from "@forgeron/platform-contract";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { workspaceApp } from "../github/app";
import { GithubError } from "../github/client";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// The CI of a tool that a repository deploys: its GitHub Actions runs, read with the workspace's
// GitHub App for whoever holds `tools:read`. The app asks for `actions: read` in its manifest, but an
// installation made before that has not accepted it: GitHub answers 403 (or 404), and the answer says
// so with the page where the owner accepts it, instead of failing.

/** Where the owner of an installation accepts the permissions the app asks for. */
const settingsUrl = (installation: {
  installationId: number;
  account: string;
  accountType: string;
}) =>
  installation.accountType === "Organization"
    ? `https://github.com/organizations/${encodeURIComponent(installation.account)}/settings/installations/${installation.installationId}`
    : `https://github.com/settings/installations/${installation.installationId}`;

export function mountCi(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(platformRoute(toolCiRoute, "tools:read"), async (c) => {
    const { registry, workspace } = c.env;
    const tool = await registry.findTool(workspace, c.req.valid("param").tool);
    if (!tool) return c.json({ error: "NOT_FOUND", message: "There is no such tool." }, 404);
    const source = await registry.toolSource(tool.id);
    if (source.kind !== "repo" || !source.repo)
      return c.json({ state: "no-repository" as const }, 200);
    const repo = source.repo;
    const github = await workspaceApp({
      registry,
      workspace,
      fetch: c.env.githubFetch,
      now: c.env.now,
    });
    const access = await github?.tokenFor(repo.split("/")[0]!);
    if (!github || !access) return c.json({ state: "no-app" as const, repo }, 200);
    const { branch, limit } = c.req.valid("query");
    try {
      const runs = await github.api.workflowRuns(access.token, repo, {
        ...(branch ? { branch } : {}),
        ...(limit ? { limit } : {}),
      });
      return c.json(
        {
          state: "ok" as const,
          repo,
          productionBranch: source.productionBranch,
          actionsUrl: `https://github.com/${repo}/actions`,
          runs,
        },
        200,
      );
    } catch (error) {
      if (!(error instanceof GithubError)) throw error;
      if (error.status === 403 || error.status === 404) {
        return c.json(
          {
            state: "no-permission" as const,
            repo,
            settingsUrl: settingsUrl(access.installation),
          },
          200,
        );
      }
      return c.json({ error: "GITHUB", message: error.message }, 502);
    }
  });

  app.all("/api/tools/:tool/ci", methodNotAllowed);
}
