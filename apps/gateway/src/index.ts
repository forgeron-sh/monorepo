// Public Worker of the platform: dispatch, identity, registry, admin MCP, deployment.
// Mounted so far: dispatch of `/t/<tool>…` (FOR-22). The other paths answer 404 until their parts exist.
import { createGateway, type GatewayEnv } from "./gateway";

export { DEPLOY_SCOPE, handleCreateDeployToken, handleDeploy } from "./deploy/deploy";
export type { DeployContext, TokenIssuerContext } from "./deploy/deploy";

export default {
  fetch: (request: Request, env: GatewayEnv) => createGateway(env)(request),
};
