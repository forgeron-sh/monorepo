import {
  cliTokenRoute,
  createDeployTokenRoute,
  deployRoute,
  issueTokenRoute,
  promoteRoute,
  promotionPlanRoute,
  revokeTokenRoute,
  rollbackRoute,
  whoamiRoute,
} from "@forgeron/platform-contract";
import type { OpenAPIHono } from "@hono/zod-openapi";
import type { Context, MiddlewareHandler } from "hono";
import { handleCreateDeployToken, handleDeploy } from "../deploy/deploy";
import { handlePromote, handlePromotePlan, handleRollback } from "../deploy/promote";
import { handleCliToken } from "../identity/cli-login/cli";
import { handleIssueToken, handleRevokeToken } from "../identity/authn/issue";
import { reportDeployment } from "../github/app";
import type { PlatformEnv } from "./app";

// The routes the CLI and CI call, outside `/console-api` (D-075, FOR-154): `/whoami`, `/deploy-tokens`,
// `/deploy`, `/promote`, `/rollback`, `/auth/token`, `/auth/token/revoke` and `/auth/cli/token`. They are
// in the contract, so the CLI calls them through the typed client, and they are mounted on the same Hono
// app. Their checks stay in the handlers because the order is part of what they promise: a deployment
// token is tried before a session, a refusal says `{ error: { code, message } }` (not the console's
// shape), and a method a path does not take is answered by the handler, with its own words. Every method
// reaches the handler for that reason, as the database explorer's does.
//
// Not described in `/api/openapi.json`: that document is the console's API, served under `/console-api`.

const NOT_CONFIGURED = {
  error: {
    code: "NOT_CONFIGURED",
    message: "This gateway has no Cloudflare account to deploy to.",
  },
};

/** Answers on `/whoami`… only: `/console-api/whoami` is not a route, and the chain says so. */
export const rootOnly: MiddlewareHandler<PlatformEnv> = async (c, next) => {
  if (c.env.surface !== "root" || !c.env.bearer) return c.notFound();
  await next();
};

const deployment = (c: Context<PlatformEnv>) => {
  const { workspace, registry, now, bearer, githubFetch, origin } = c.env;
  const hosting = c.env.hosting(workspace);
  return {
    context: {
      workspace,
      ...(c.env.via ? { via: c.env.via } : {}),
      secret: bearer!.secret,
      now,
      registry,
      authenticate: () => bearer!.person(),
      // A run of GitHub Actions names the workspace's address as its audience (D-123).
      actions: { audience: origin, fetch: githubFetch },
    },
    hosting,
  };
};

const when = (c: Context<PlatformEnv>) => ({
  workspace: c.env.workspace,
  registry: c.env.registry,
  now: c.env.now,
});

export function mountBearer(app: OpenAPIHono<PlatformEnv>): void {
  const mount = (path: string, serve: (c: Context<PlatformEnv>) => Response | Promise<Response>) =>
    app.all(path, rootOnly, serve);

  mount(whoamiRoute.path, async (c) => {
    if (c.req.method !== "GET" && c.req.method !== "HEAD") {
      return c.json({ error: "METHOD_NOT_ALLOWED" }, 405);
    }
    const person = await c.env.bearer!.person();
    return person
      ? Response.json(
          { ...person, workspace: c.env.workspace },
          { headers: { "cache-control": "no-store" } },
        )
      : Response.json(
          { error: { code: "UNAUTHENTICATED", message: "Not signed in." } },
          { status: 401 },
        );
  });
  mount(createDeployTokenRoute.path, (c) =>
    handleCreateDeployToken(c.req.raw, {
      workspace: c.env.workspace,
      secret: c.env.bearer!.secret,
      now: c.env.now,
      authenticate: () => c.env.bearer!.person(),
    }),
  );
  // One path, two routes of the contract (`deployRoute` and `closePreviewRoute`): `POST` deploys and
  // `DELETE` closes a preview; `handleDeploy` tells them apart.
  mount(deployRoute.path, (c) => {
    const { context, hosting } = deployment(c);
    if (!hosting) return Response.json(NOT_CONFIGURED, { status: 501 });
    const github = {
      registry: c.env.registry,
      workspace: c.env.workspace,
      fetch: c.env.githubFetch,
      now: c.env.now,
    };
    return handleDeploy(c.req.raw, {
      ...context,
      hosting,
      report: (tool, deployed) => reportDeployment(github, tool, deployed),
    });
  });
  for (const [route, handle] of [
    [promoteRoute, handlePromote],
    [promotionPlanRoute, handlePromotePlan],
    [rollbackRoute, handleRollback],
  ] as const) {
    mount(route.path, (c) => {
      const { context, hosting } = deployment(c);
      if (!hosting) return Response.json(NOT_CONFIGURED, { status: 501 });
      return handle(c.req.raw, { ...context, hosting });
    });
  }
  mount(issueTokenRoute.path, (c) =>
    handleIssueToken(c.req.raw, {
      ...when(c),
      secret: c.env.bearer!.secret,
      session: () => c.env.bearer!.session(),
    }),
  );
  mount(revokeTokenRoute.path, (c) =>
    handleRevokeToken(c.req.raw, { ...when(c), person: () => c.env.bearer!.person() }),
  );
  mount(cliTokenRoute.path, (c) =>
    handleCliToken(c.req.raw, {
      ...when(c),
      secret: c.env.bearer!.secret,
      session: () => c.env.bearer!.session(),
    }),
  );
}
