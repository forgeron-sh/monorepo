import {
  createGithubToolRoute,
  disconnectGithubRoute,
  getGithubRoute,
  linkGithubRepositoryRoute,
  listGithubRepositoriesRoute,
} from "@forgeron/platform-contract";
import { toolFiles, workflow, WORKFLOW_PATH } from "@forgeron/scaffold";
import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import { workspaceApp, type GithubContext } from "../github/app";
import { githubApi, GithubError } from "../github/client";
import { handleGithubWebhook } from "../github/webhook";
import { seal, unseal } from "../identity/authn/sealed";
import { escape, notice, page, paragraph } from "../pages/shell";
import { GATEWAY_VERSION } from "../version";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";
import { rootOnly } from "./bearer";

// The workspace's GitHub App (D-123). An admin makes it from the console: `/github/app/new` posts
// GitHub's manifest (what the app is, which permissions, where GitHub calls back), GitHub creates the
// app and comes back to `/github/app/callback` with a code, traded once for the app and its keys,
// sealed. The admin then installs it on an organisation or an account (`/github/app/installed`), and
// GitHub tells the workspace what happens on its repositories at `/github/webhook`. The console's
// routes (`/api/github…`) list the repositories it may see, link one to a tool, or make a new one.

/** The paths outside `/console-api`: they join `BEARER_PATHS` in `gateway.ts`. */
export const GITHUB_PATHS = [
  "/github/app/new",
  "/github/app/callback",
  "/github/app/installed",
  "/github/webhook",
] as const;

const STATE = "ghapp";
const STATE_TTL_SECONDS = 60 * 60;
/** GitHub's longest name for an app. */
const MAX_APP_NAME = 34;
const OWNER = /^[A-Za-z0-9](?:[A-Za-z0-9-]{0,38})$/;

/** The page that posts the manifest goes to GitHub: its form may post there, and nowhere else. */
const MANIFEST_CSP =
  "default-src 'none'; style-src 'unsafe-inline'; form-action https://github.com; frame-ancestors 'none'; base-uri 'none'";

const githubOf = (c: Context<PlatformEnv>): GithubContext => ({
  registry: c.env.registry,
  workspace: c.env.workspace,
  fetch: c.env.githubFetch,
  now: c.env.now,
});

const message = (title: string, text: string, status: number, workspace: string) =>
  page({ title, eyebrow: "GitHub", workspace, status }, notice("danger", text));

const backTo = (c: Context<PlatformEnv>, query: string) =>
  c.redirect(`${c.env.origin}/settings/github${query}`, 303);

/** What GitHub is asked to make (its "app manifest"): the workspace's own app. */
function manifestOf(origin: string) {
  const host = new URL(origin).host;
  return {
    name: `Forgeron · ${host}`.slice(0, MAX_APP_NAME),
    url: origin,
    hook_attributes: { url: `${origin}/github/webhook`, active: true },
    redirect_url: `${origin}/github/app/callback`,
    setup_url: `${origin}/github/app/installed`,
    setup_on_update: true,
    public: false,
    // Contents and workflows to make a tool's repository and its CI, administration to create the
    // repository, statuses to show a preview's address beside its commit.
    default_permissions: {
      administration: "write",
      contents: "write",
      workflows: "write",
      statuses: "write",
      metadata: "read",
    },
    default_events: ["delete"],
  };
}

/** The admin of a browser session, or the page that says why not. */
async function admin(c: Context<PlatformEnv>): Promise<{ id: string } | Response> {
  const person = await c.env.identity();
  if (!person) {
    return message(
      "Sign in first",
      "Sign in to the console, then try again.",
      401,
      c.env.workspace,
    );
  }
  if (!person.admin) {
    return message(
      "Not allowed",
      "Only an administrator can connect GitHub.",
      403,
      c.env.workspace,
    );
  }
  return { id: person.id };
}

function mountRoot(app: OpenAPIHono<PlatformEnv>): void {
  const mount = (path: string, serve: (c: Context<PlatformEnv>) => Response | Promise<Response>) =>
    app.all(path, rootOnly, serve);

  mount("/github/app/new", async (c) => {
    if (c.req.method !== "GET") return c.json({ error: "METHOD_NOT_ALLOWED" }, 405);
    const who = await admin(c);
    if (who instanceof Response) return who;
    if (!c.env.canKeepSecrets) {
      return message(
        "Not available",
        "This gateway cannot keep the app's keys (SECRETS_KEY is not set).",
        501,
        c.env.workspace,
      );
    }
    const owner = c.req.query("owner")?.trim() ?? "";
    if (owner !== "" && !OWNER.test(owner)) {
      return message("Not an owner", "That is not a GitHub organisation.", 400, c.env.workspace);
    }
    const exp = Math.floor(c.env.now().getTime() / 1000) + STATE_TTL_SECONDS;
    const state = await seal(STATE, { ws: c.env.workspace, by: who.id, exp }, c.env.bearer!.secret);
    const action = owner
      ? `https://github.com/organizations/${encodeURIComponent(owner)}/settings/apps/new`
      : "https://github.com/settings/apps/new";
    const manifest = JSON.stringify(manifestOf(c.env.origin));
    return page(
      {
        title: "Create the GitHub App",
        eyebrow: "GitHub",
        workspace: c.env.workspace,
        headers: { "content-security-policy": MANIFEST_CSP },
      },
      paragraph(
        `GitHub will create an app for this workspace${owner ? ` in ${owner}` : " on your account"}. Check its name, then create it: GitHub brings you back here.`,
      ) +
        `<form method="post" action="${escape(`${action}?state=${encodeURIComponent(state)}`)}">` +
        `<input type="hidden" name="manifest" value="${escape(manifest)}">` +
        `<button type="submit" class="btn primary">Continue to GitHub</button></form>`,
    );
  });

  mount("/github/app/callback", async (c) => {
    if (c.req.method !== "GET") return c.json({ error: "METHOD_NOT_ALLOWED" }, 405);
    const who = await admin(c);
    if (who instanceof Response) return who;
    const claims = await unseal(STATE, c.req.query("state") ?? "", c.env.bearer!.secret);
    const now = c.env.now().getTime() / 1000;
    if (
      !claims ||
      claims.ws !== c.env.workspace ||
      claims.by !== who.id ||
      typeof claims.exp !== "number" ||
      claims.exp < now
    ) {
      return message(
        "Start again",
        "This link has expired or was not started here. Connect GitHub again from the console.",
        400,
        c.env.workspace,
      );
    }
    const code = c.req.query("code");
    if (!code) return message("Start again", "GitHub sent no code.", 400, c.env.workspace);
    try {
      const made = await githubApi(c.env.githubFetch).convertManifest(code);
      await c.env.registry.saveGithubApp({
        workspace: c.env.workspace,
        app: {
          appId: made.id,
          slug: made.slug,
          clientId: made.clientId,
          owner: made.owner,
          htmlUrl: made.htmlUrl,
        },
        keys: {
          privateKey: made.pem,
          webhookSecret: made.webhookSecret,
          clientSecret: made.clientSecret,
        },
        actor: who.id,
      });
    } catch (error) {
      const text = error instanceof GithubError ? error.message : "GitHub could not be reached.";
      return message("GitHub refused", text, 502, c.env.workspace);
    }
    return backTo(c, "?connected=1");
  });

  mount("/github/app/installed", async (c) => {
    if (c.req.method !== "GET") return c.json({ error: "METHOD_NOT_ALLOWED" }, 405);
    const who = await admin(c);
    if (who instanceof Response) return who;
    const id = Number(c.req.query("installation_id"));
    if (!Number.isSafeInteger(id) || id <= 0) return backTo(c, "");
    const app = await workspaceApp(githubOf(c));
    if (!app) return backTo(c, "");
    try {
      // GitHub says which installation; the app's own JWT says whose it is, so a forged link cannot
      // attach another app's installation.
      const found = await app.api.installation(await app.jwt(), id);
      await c.env.registry.addGithubInstallation({
        workspace: c.env.workspace,
        installationId: id,
        account: found.account,
        accountType: found.accountType,
      });
    } catch (error) {
      const text = error instanceof GithubError ? error.message : "GitHub could not be reached.";
      return message("GitHub refused", text, 502, c.env.workspace);
    }
    return backTo(c, "?installed=1");
  });

  mount("/github/webhook", (c) =>
    handleGithubWebhook(c.req.raw, {
      workspace: c.env.workspace,
      registry: c.env.registry,
      hosting: c.env.hosting(c.env.workspace),
    }),
  );
}

const notConnected = {
  error: "NOT_CONNECTED",
  message: "This workspace has no GitHub App: connect GitHub in Settings first.",
};
const refusedBy = (error: GithubError) => ({ error: "GITHUB", message: error.message });

function mountConsole(app: OpenAPIHono<PlatformEnv>): void {
  app.openapi(platformRoute(getGithubRoute, "admin"), async (c) => {
    const { registry, workspace } = c.env;
    const found = await registry.githubApp(workspace);
    const installations = found ? await registry.listGithubInstallations(workspace) : [];
    return c.json(
      {
        available: c.env.canKeepSecrets && c.env.bearer !== undefined,
        app: found
          ? {
              slug: found.slug,
              owner: found.owner,
              htmlUrl: found.htmlUrl,
              installUrl: `https://github.com/apps/${encodeURIComponent(found.slug)}/installations/new`,
              createdAt: found.createdAt,
            }
          : null,
        installations: installations.map((i) => ({
          id: i.installationId,
          account: i.account,
          accountType: i.accountType,
        })),
      },
      200,
    );
  });

  app.openapi(platformRoute(disconnectGithubRoute, "admin"), async (c) => {
    const { registry, workspace } = c.env;
    if (!(await registry.githubApp(workspace))) return c.json(notConnected, 404);
    await registry.removeGithubApp({ workspace, actor: c.get("person").id });
    return c.body(null, 204);
  });

  app.openapi(platformRoute(listGithubRepositoriesRoute, "admin"), async (c) => {
    const { registry, workspace } = c.env;
    const app = await workspaceApp(githubOf(c));
    if (!app) return c.json(notConnected, 404);
    try {
      const repositories = [];
      for (const installation of app.installations) {
        const token = await app.installationToken(installation.installationId);
        for (const repo of await app.api.repositories(token)) {
          const [forgeron, hasWorkflow, tool] = await Promise.all([
            app.api.hasFile(token, repo.fullName, "forgeron.config.ts"),
            app.api.hasFile(token, repo.fullName, WORKFLOW_PATH),
            registry.toolByRepository(workspace, { repo: repo.fullName, repoId: repo.id }),
          ]);
          repositories.push({
            repo: repo.fullName,
            id: repo.id,
            private: repo.private,
            defaultBranch: repo.defaultBranch,
            forgeron,
            workflow: hasWorkflow,
            tool: tool?.name ?? null,
          });
        }
      }
      return c.json({ repositories }, 200);
    } catch (error) {
      if (error instanceof GithubError) return c.json(refusedBy(error), 502);
      throw error;
    }
  });

  app.openapi(platformRoute(linkGithubRepositoryRoute, "admin"), async (c) => {
    const { registry, workspace } = c.env;
    const app = await workspaceApp(githubOf(c));
    if (!app) return c.json(notConnected, 404);
    const body = c.req.valid("json");
    if (await registry.findTool(workspace, body.name)) {
      return c.json(
        { error: "ALREADY_EXISTS", message: `The workspace already has a tool ${body.name}.` },
        409,
      );
    }
    try {
      const access = await app.tokenFor(body.repo.split("/")[0]!);
      const found = access
        ? (await app.api.repositories(access.token)).find(
            (r) => r.fullName.toLowerCase() === body.repo.toLowerCase(),
          )
        : undefined;
      if (!access || !found) {
        return c.json(
          { error: "NOT_FOUND", message: `The app may not see ${body.repo}: install it there.` },
          404,
        );
      }
      const linked = await registry.toolByRepository(workspace, {
        repo: found.fullName,
        repoId: found.id,
      });
      if (linked) {
        return c.json(
          { error: "ALREADY_EXISTS", message: `${found.fullName} is the tool ${linked.name}'s.` },
          409,
        );
      }
      const actor = c.get("person").id;
      const productionBranch = body.productionBranch ?? found.defaultBranch;
      const tool = await registry.createTool({ workspace, name: body.name });
      await registry.linkRepository({
        toolId: tool.id,
        repo: found.fullName,
        repoId: found.id,
        productionBranch,
        actor,
      });
      // Nobody may add it to their library until an admin says who (D-117).
      await registry.setAvailability({ toolId: tool.id, mode: "nobody", actor });
      let state: "added" | "present" | "missing" = "present";
      if (!(await app.api.hasFile(access.token, found.fullName, WORKFLOW_PATH))) {
        state = "missing";
        if (body.addWorkflow) {
          await app.api.commitFiles(
            access.token,
            found.fullName,
            found.defaultBranch,
            { [WORKFLOW_PATH]: workflow({ version: GATEWAY_VERSION, endpoint: c.env.origin }) },
            "ci: deploy with Forgeron",
          );
          state = "added";
        }
      }
      return c.json(
        { tool: tool.name, repo: found.fullName, productionBranch, workflow: state },
        201,
      );
    } catch (error) {
      if (error instanceof GithubError) return c.json(refusedBy(error), 502);
      throw error;
    }
  });

  app.openapi(platformRoute(createGithubToolRoute, "admin"), async (c) => {
    const { registry, workspace } = c.env;
    const app = await workspaceApp(githubOf(c));
    if (!app) return c.json(notConnected, 404);
    const body = c.req.valid("json");
    if (await registry.findTool(workspace, body.name)) {
      return c.json(
        { error: "ALREADY_EXISTS", message: `The workspace already has a tool ${body.name}.` },
        409,
      );
    }
    try {
      const access = await app.tokenFor(body.owner);
      if (!access) {
        return c.json(
          { error: "NOT_FOUND", message: `The app is not installed on ${body.owner}.` },
          404,
        );
      }
      // GitHub lets an app make a repository in an organisation only, not in a person's account.
      if (access.installation.accountType !== "Organization") {
        return c.json(
          {
            error: "INVALID",
            message: `${body.owner} is a personal account: GitHub lets an app create repositories in an organisation only. Create the repository, then add it from GitHub.`,
          },
          400,
        );
      }
      const made = await app.api.createRepository(access.token, body.owner, {
        name: body.name,
        private: body.private ?? true,
        description: `A Forgeron tool of ${workspace}.`,
      });
      const actor = c.get("person").id;
      const tool = await registry.createTool({ workspace, name: body.name });
      // Linked before the first push, so that its CI is recognised when it runs.
      await registry.linkRepository({
        toolId: tool.id,
        repo: made.fullName,
        repoId: made.id,
        productionBranch: made.defaultBranch,
        actor,
      });
      await registry.setAvailability({ toolId: tool.id, mode: "nobody", actor });
      await app.api.commitFiles(
        access.token,
        made.fullName,
        made.defaultBranch,
        toolFiles({ name: body.name, version: GATEWAY_VERSION, endpoint: c.env.origin }),
        `feat: ${body.name}, made with Forgeron`,
      );
      return c.json(
        { tool: tool.name, repo: made.fullName, url: `https://github.com/${made.fullName}` },
        201,
      );
    } catch (error) {
      if (error instanceof GithubError) {
        return error.status === 422
          ? c.json(
              { error: "ALREADY_EXISTS", message: `${body.owner}/${body.name} exists on GitHub.` },
              409,
            )
          : c.json(refusedBy(error), 502);
      }
      throw error;
    }
  });

  app.all("/api/github", methodNotAllowed);
  app.all("/api/github/repositories", methodNotAllowed);
  app.all("/api/github/repositories/link", methodNotAllowed);
  app.all("/api/github/tools", methodNotAllowed);
}

export function mountGithub(app: OpenAPIHono<PlatformEnv>): void {
  mountRoot(app);
  mountConsole(app);
}
