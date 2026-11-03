// Public Worker of the platform: dispatch, identity, registry, admin MCP, deployment.
// Mounted: dispatch of `/t/<tool>…`, sign-in (`/auth/*`), `/whoami`, `/deploy`, `/deploy-tokens` and the console API.
// Not mounted, answering 404: `/mcp`, `/api` and `/cli` of the workspace (admin MCP, platform API).
import { createGateway, type GatewayEnv } from "./gateway";
import { negotiated } from "./pages/errors";

export { DEPLOY_SCOPE, handleCreateDeployToken, handleDeploy } from "./deploy/deploy";
export type { DeployContext, TokenIssuerContext } from "./deploy/deploy";

export default {
  // The sign-in mail goes out after the answer (`waitUntil`), so the answer does not say whether one was sent.
  fetch: async (
    request: Request,
    env: GatewayEnv,
    ctx: { waitUntil(work: Promise<unknown>): void },
  ) => {
    try {
      return await createGateway(env, { defer: (work) => ctx.waitUntil(work) })(request);
    } catch (error) {
      // What failed goes to the logs, never to the page.
      console.error("gateway error:", error instanceof Error ? error.name : "error");
      return negotiated(
        request,
        500,
        Response.json(
          { error: { code: "INTERNAL", message: "The gateway failed to answer." } },
          { status: 500 },
        ),
      );
    }
  },
};
