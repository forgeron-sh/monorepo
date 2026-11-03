import type { ConnectorClient, ConnectorDefinition, ConnectorMode } from "../connectors";
import { createConnectorClient } from "../connectors";
import type { Fetch } from "../context";
import { mockFetch } from "./mock-fetch";

export interface MockConnectorOptions {
  /** The upstream: `mockFetch({...})`. Without it, every call fails. */
  fetch?: Fetch;
  mode?: ConnectorMode;
  scopes?: string[];
  /** The fake token the connector adds to calls; `"test-token"` by default. */
  token?: string;
}

/**
 * A fake `ctx.connectors.<name>` for `createTestTool({ connectors })`: the real connector,
 * with its host filter and its client, over a simulated upstream and a fake token.
 */
export function mockConnector<Extra extends object>(
  definition: ConnectorDefinition<Extra>,
  options: MockConnectorOptions = {},
): ConnectorClient<Extra> {
  const mode = options.mode ?? definition.modes[0]!;
  const scopes = options.scopes ?? [...definition.scopes];
  return createConnectorClient(
    definition,
    { type: definition.type, mode, scopes, why: "test" },
    {
      mode,
      scopes,
      token: async () => options.token ?? "test-token",
      fetch: options.fetch ?? mockFetch({}),
    },
  );
}
