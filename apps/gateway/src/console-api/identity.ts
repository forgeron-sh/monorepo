import type { IdentityConfig } from "@forgeron/registry";
import { parseIdentityProviderInput } from "../identity/presets";

// The sign-in configuration of a workspace, edited by an admin in the console (D-037):
//   GET|PUT|DELETE /api/identity-provider          -> the workspace's OIDC provider (Entra ID, Google, any OIDC)
//   GET            /api/connector-clients          -> the OAuth clients of the delegated connectors
//   PUT|DELETE     /api/connector-clients/<type>   -> set or remove one
// A client secret goes in and never comes out: the answers say only whether one is kept.

const CLIENT = /^\/api\/connector-clients(?:\/([a-z][a-z0-9-]*))?$/;

export interface IdentityApiOptions {
  config: IdentityConfig;
  workspace: string;
  /** Whether the gateway can seal a secret (`SECRETS_KEY` is bound). */
  canKeepSecrets: boolean;
  caller(request: Request): Promise<{ admin: boolean; id: string } | undefined>;
}

const json = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const https = (value: unknown): string | undefined =>
  typeof value === "string" && value.length <= 1024 && /^https:\/\/[^\s/]+(\/[^\s]*)?$/.test(value)
    ? value
    : undefined;

const readBody = async (request: Request): Promise<unknown> => {
  try {
    return await request.json();
  } catch {
    return undefined;
  }
};

export async function handleIdentity(
  request: Request,
  options: IdentityApiOptions,
): Promise<Response | undefined> {
  const path = new URL(request.url).pathname;
  const client = CLIENT.exec(path);
  if (path !== "/api/identity-provider" && !client) return undefined;

  const caller = await options.caller(request);
  if (!caller) return json(401, { error: "UNAUTHENTICATED" });
  if (!caller.admin) return json(403, { error: "FORBIDDEN", message: "This is for admins." });
  const { config, workspace } = options;

  if (path === "/api/identity-provider") {
    if (request.method === "GET") {
      return json(200, { provider: (await config.getIdentityProvider(workspace)) ?? null });
    }
    if (request.method === "DELETE") {
      return (await config.deleteIdentityProvider(workspace))
        ? new Response(null, { status: 204 })
        : json(404, { error: "NOT_FOUND", message: "No provider is configured." });
    }
    if (request.method === "PUT") {
      const parsed = parseIdentityProviderInput(await readBody(request));
      if ("message" in parsed) return json(400, { error: "INVALID", message: parsed.message });
      if (parsed.input.clientSecret && !options.canKeepSecrets) {
        return json(501, { error: "NOT_CONFIGURED", message: "The gateway has no secret key." });
      }
      await config.setIdentityProvider(workspace, parsed.input, caller.id);
      return json(200, { provider: await config.getIdentityProvider(workspace) });
    }
    return json(405, { error: "METHOD_NOT_ALLOWED" });
  }

  const connector = client![1];
  if (request.method === "GET" && connector === undefined) {
    return json(200, { clients: await config.listConnectorClients(workspace) });
  }
  if (connector === undefined) return json(405, { error: "METHOD_NOT_ALLOWED" });
  if (request.method === "DELETE") {
    return (await config.deleteConnectorClient(workspace, connector))
      ? new Response(null, { status: 204 })
      : json(404, { error: "NOT_FOUND", message: `No OAuth client for ${connector}.` });
  }
  if (request.method === "PUT") {
    const b = ((await readBody(request)) ?? {}) as Record<string, unknown>;
    const authorizeUrl = https(b.authorizeUrl);
    const tokenUrl = https(b.tokenUrl);
    const clientId =
      typeof b.clientId === "string" && b.clientId.trim() ? b.clientId.trim() : undefined;
    const clientSecret =
      typeof b.clientSecret === "string" && b.clientSecret ? b.clientSecret : undefined;
    if (
      !authorizeUrl ||
      !tokenUrl ||
      !clientId ||
      (b.clientSecret !== undefined && !clientSecret)
    ) {
      return json(400, {
        error: "INVALID",
        message:
          "`authorizeUrl` and `tokenUrl` (https), `clientId` and `clientSecret` are required.",
      });
    }
    if (!options.canKeepSecrets) {
      return json(501, { error: "NOT_CONFIGURED", message: "The gateway has no secret key." });
    }
    const result = await config.setConnectorClient(
      workspace,
      connector,
      { authorizeUrl, tokenUrl, clientId, ...(clientSecret ? { clientSecret } : {}) },
      caller.id,
    );
    if (result === "SECRET_REQUIRED") {
      return json(400, {
        error: "INVALID",
        message: "A new OAuth client needs its `clientSecret`.",
      });
    }
    return json(result === "created" ? 201 : 200, { connector });
  }
  return json(405, { error: "METHOD_NOT_ALLOWED" });
}
