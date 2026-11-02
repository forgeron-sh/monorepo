import {
  createTestTool as create,
  mockFetch,
  type MockRoute,
  type TestToolOptions,
} from "@forgeron/sdk/testing";

// `createTestTool` runs the built tool (`.forgeron/build/`), found from the current directory:
// `forgeron test` runs Vitest from the tool folder. In this monorepo Vitest runs from the root,
// so the folder is given here.
const dir = new URL("..", import.meta.url).pathname;
export const createTestTool = (options: TestToolOptions = {}) => create({ dir, ...options });

const ODOO = "https://acme.odoo.com";

/** What the tool needs from the admin and from each person. No real secret. */
export const secrets = { ODOO_URL: ODOO, ODOO_DB: "acme" };
export const userSecrets = { ODOO_LOGIN: "ely@acme.fr", ODOO_API_KEY: "test-key" };

export const support = { email: "ely@acme.fr", roles: ["support"], userSecrets };
export const reader = { email: "ely@acme.fr", roles: ["reader"], userSecrets };

/** A simulated Odoo: every JSON-RPC call goes to `POST <url>/jsonrpc`. */
export const odooRpc = (route: MockRoute) => mockFetch({ [`POST ${ODOO}/jsonrpc`]: route });

export const rpcResult = (result: unknown) => ({ jsonrpc: "2.0", id: null, result });
export const rpcError = (name: string, message: string) => ({
  jsonrpc: "2.0",
  id: null,
  error: { data: { name, message } },
});
