// Public Worker of the platform: dispatch, identity, registry, admin MCP, deployment.
// Mounted: dispatch of `/t/<tool>…`, sign-in (`/auth/*`), `/whoami`, `/deploy`, `/deploy-tokens` and the console API.
// Not mounted, answering 404: `/mcp`, `/api` and `/cli` of the workspace (admin MCP, platform API).
import { createGateway, type GatewayEnv } from "./gateway";

export { DEPLOY_SCOPE, handleCreateDeployToken, handleDeploy } from "./deploy/deploy";
export type { DeployContext, TokenIssuerContext } from "./deploy/deploy";

export default {
  // The sign-in mail goes out after the answer (`waitUntil`), so the answer does not say whether one was sent.
  fetch: (request: Request, env: GatewayEnv, ctx: { waitUntil(work: Promise<unknown>): void }) =>
    createGateway(env, { defer: (work) => ctx.waitUntil(work) })(request),
};
