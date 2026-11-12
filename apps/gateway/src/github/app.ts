// A workspace's GitHub App at work (D-123): its JWT, a token for the installation that covers a
// repository's owner, and the commit status a deployment leaves on GitHub.
import type { GithubApp, GithubInstallation, Registry, Tool } from "@forgeron/registry";
import { appJwt, githubApi, type GithubApi } from "./client";

export interface GithubContext {
  registry: Registry;
  workspace: string;
  fetch: typeof fetch;
  now(): Date;
}

export interface WorkspaceApp {
  app: GithubApp;
  api: GithubApi;
  webhookSecret: string;
  installations: GithubInstallation[];
  /** The app's own JWT, for the calls GitHub asks it to sign. */
  jwt(): Promise<string>;
  /** The installation on an organisation or account, and a token for it; `undefined` when none. */
  tokenFor(owner: string): Promise<{ token: string; installation: GithubInstallation } | undefined>;
  /** A token for one installation. */
  installationToken(installationId: number): Promise<string>;
}

/** The workspace's app, ready to call GitHub; `undefined` when the workspace has none. */
export async function workspaceApp(context: GithubContext): Promise<WorkspaceApp | undefined> {
  const { registry, workspace } = context;
  const app = await registry.githubApp(workspace);
  if (!app) return undefined;
  const keys = await registry.githubAppKeys(workspace);
  const installations = await registry.listGithubInstallations(workspace);
  const api = githubApi(context.fetch);
  let jwt: Promise<string> | undefined;
  const self: WorkspaceApp = {
    app,
    api,
    webhookSecret: keys.webhookSecret,
    installations,
    jwt: () => (jwt ??= appJwt(app.appId, keys.privateKey, context.now())),
    installationToken: async (id) => api.installationToken(await self.jwt(), id),
    async tokenFor(owner) {
      const installation = installations.find(
        (i) => i.account.toLowerCase() === owner.toLowerCase(),
      );
      if (!installation) return undefined;
      return { token: await self.installationToken(installation.installationId), installation };
    },
  };
  return self;
}

/**
 * After a deployment of a repository tool: a commit status `forgeron/<environment>` with the address
 * it is served at, beside the commit on GitHub. Best effort: GitHub refusing, or no app, changes
 * nothing for the deployment.
 */
export async function reportDeployment(
  context: GithubContext,
  tool: Tool,
  deployed: { sha: string; url: string; environment: string; branch?: string },
): Promise<boolean> {
  try {
    const source = await context.registry.toolSource(tool.id);
    if (source.kind !== "repo" || !source.repo) return false;
    const app = await workspaceApp(context);
    const access = await app?.tokenFor(source.repo.split("/")[0]!);
    if (!app || !access) return false;
    await app.api.setStatus(access.token, source.repo, deployed.sha, {
      state: "success",
      targetUrl: deployed.url,
      context: `forgeron/${deployed.environment}`,
      description:
        deployed.environment === "preview" && deployed.branch
          ? `Preview of ${deployed.branch} on Forgeron`
          : `Deployed to ${deployed.environment} on Forgeron`,
    });
    return true;
  } catch {
    return false;
  }
}
