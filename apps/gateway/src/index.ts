// Public Worker of the platform: dispatch, identity, registry, admin MCP, deployment.
// Mounted so far: dispatch of `/t/<tool>…` (FOR-22). The other paths answer 404 until their parts exist.
import { createGateway, type GatewayEnv } from "./gateway";

export default {
  fetch: (request: Request, env: GatewayEnv) => createGateway(env)(request),
};
