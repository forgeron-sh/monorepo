import type { Manifest } from "@forgeron/manifest";
import { ConsentError, type Consent, type Registry } from "@forgeron/registry";
import type { Forwarding } from "./dispatch";

// A person's OAuth consent at run time (D-046, sdk.md §10). For each delegated connector the tool
// declares, the gateway hands the call the caller's own access token, refreshed with the sealed
// refresh token when it is about to expire; the refresh token never leaves the gateway. A person
// who has not consented (or whose consent was revoked) gets the link to give it instead, which the
// runtime turns into the same 428 / URL elicitation as a missing per-person secret.

export interface ConnectorTokensContext {
  registry: Registry;
  workspace: string;
  /** The consent exchange, with the OAuth clients of these connector types loaded. */
  consent(types: string[]): Promise<Consent>;
  /** Where a person gives consent for a connector of a tool, in an environment. */
  consentUrl(tool: string, environment: "preview" | "production", name: string): string;
}

export async function connectorHeaders(
  tool: { id: string; name: string },
  manifest: Manifest,
  person: { id: string },
  environment: "preview" | "production",
  context: ConnectorTokensContext,
): Promise<Forwarding> {
  const delegated = Object.entries(manifest.resources.connectors ?? {}).filter(
    ([, c]) => c.mode === "delegated",
  );
  if (delegated.length === 0) return { headers: {} };
  const consent = await context.consent(delegated.map(([, c]) => c.type));
  const tokens: Record<string, string> = {};
  const links: Record<string, string> = {};
  for (const [name, declared] of delegated) {
    try {
      tokens[name] = await consent.accessToken({
        toolId: tool.id,
        environment,
        userId: person.id,
        connector: declared.type,
      });
    } catch (error) {
      if (error instanceof ConsentError) {
        // CONSENT_REQUIRED: never consented, revoked, or the provider no longer honors the refresh
        // token. UNKNOWN_CONNECTOR: the admin has not registered the OAuth client yet.
        if (error.code === "CONSENT_REQUIRED" || error.code === "UNKNOWN_CONNECTOR") {
          links[name] = context.consentUrl(tool.name, environment, name);
          continue;
        }
      }
      // The provider could not be reached or failed to answer (5xx, network, not OAuth): the consent
      // is kept, and asking the person to consent again would not help. The caller may retry.
      return {
        refuse: Response.json(
          {
            error: {
              code: "UPSTREAM",
              message: `The consent for ${name} could not be refreshed: try again later.`,
              retryable: true,
            },
          },
          { status: 502, headers: { "retry-after": "30" } },
        ),
      };
    }
    // One line per token handed over: who, for which tool, environment and connector.
    await context.registry
      .recordAudit({
        toolId: tool.id,
        actor: person.id,
        kind: "access",
        subject: `connector-token:${declared.type}`,
        detail: { environment, connector: name },
      })
      .catch(() => undefined);
  }
  return {
    headers: {
      ...(Object.keys(tokens).length > 0
        ? { "x-forgeron-connector-tokens": JSON.stringify(tokens) }
        : {}),
      ...(Object.keys(links).length > 0
        ? { "x-forgeron-connector-consent": JSON.stringify(links) }
        : {}),
    },
  };
}
