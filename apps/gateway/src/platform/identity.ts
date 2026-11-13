import {
  deleteConnectorClientRoute,
  deleteIdentityProviderRoute,
  getIdentityProviderRoute,
  listConnectorClientsRoute,
  putConnectorClientRoute,
  putIdentityProviderRoute,
} from "@forgeron/platform-contract";
import { missingToGrant, PLATFORM } from "@forgeron/permissions";
import type { OpenAPIHono } from "@hono/zod-openapi";
import { parseIdentityProviderInput, parseSamlProviderInput } from "../identity/sign-in/presets";
import { methodNotAllowed, platformRoute, type PlatformEnv } from "./app";

// The sign-in configuration of a workspace, edited in the console by who holds `settings:write` (D-041, D-050): the
// provider (OIDC or SAML) and the OAuth clients of the delegated connectors. A client secret goes in
// and never comes out. A change is audited (D-046), never with a secret in it.

const https = (value: unknown): string | undefined =>
  typeof value === "string" && value.length <= 1024 && /^https:\/\/[^\s/]+(\/[^\s]*)?$/.test(value)
    ? value
    : undefined;

const noKey = { error: "NOT_CONFIGURED", message: "The gateway has no secret key." };
const connectorType = /^[a-z][a-z0-9-]*$/;

/**
 * Mapping a provider's group to a team puts its people in that team at their first sign-in, so it is a
 * grant of the team's permissions (anti-escalation, D-136): the caller must hold them. Returns what
 * they lack, empty when they may.
 */
async function lackedForGroups(
  env: PlatformEnv["Bindings"],
  held: readonly string[],
  groupTeams: Record<string, string> | undefined,
): Promise<string[]> {
  const wanted = new Set(Object.values(groupTeams ?? {}));
  if (wanted.size === 0) return [];
  const given = (await env.registry.listTeams(env.workspace))
    .filter((t) => wanted.has(t.id))
    .flatMap((t) => t.effective);
  return missingToGrant(PLATFORM, held, given).map((p) => PLATFORM.permissions[p].label);
}

const refusedGroups = (lacking: string[]) => ({
  error: "FORBIDDEN" as const,
  message: `Mapping these groups gives permissions you do not hold: ${lacking.join(", ")}.`,
});

export function mountIdentity(app: OpenAPIHono<PlatformEnv>): void {
  const audited = (c: { env: PlatformEnv["Bindings"]; get(k: "person"): { id: string } }) => {
    return (subject: string, detail: Record<string, unknown> = {}) =>
      c.env.registry
        .recordAudit({
          actor: c.get("person").id,
          interface: "api",
          kind: "access",
          subject,
          detail: { workspace: c.env.workspace, ...detail },
        })
        .catch(() => undefined);
  };

  app.openapi(platformRoute(getIdentityProviderRoute, "settings:read"), async (c) => {
    const { config, workspace } = c.env;
    const saml = await config.getSamlProvider(workspace);
    return c.json(
      {
        provider: saml
          ? { kind: "saml", ...saml }
          : ((await config.getIdentityProvider(workspace)) ?? null),
      },
      200,
    );
  });

  app.openapi(platformRoute(putIdentityProviderRoute, "settings:write"), async (c) => {
    const { config, workspace, canKeepSecrets } = c.env;
    const body: unknown = c.req.valid("json");
    const person = c.get("person");
    if ((body as { kind?: unknown } | null | undefined)?.kind === "saml") {
      // SAML (D-050): public certificates only, no secret to keep. Saving it replaces an OIDC provider.
      const saml = await parseSamlProviderInput(body);
      if ("message" in saml) return c.json({ error: "INVALID", message: saml.message }, 400);
      const lackedSaml = await lackedForGroups(c.env, person.permissions, saml.input.groupTeams);
      if (lackedSaml.length > 0) return c.json(refusedGroups(lackedSaml), 403);
      await config.setSamlProvider(workspace, saml.input, person.id);
      await audited(c)("identity-provider:set", {
        kind: "saml",
        idpEntityId: saml.input.idpEntityId,
        certificates: saml.input.certificates.length,
      });
      return c.json(
        { provider: { kind: "saml", ...(await config.getSamlProvider(workspace)) } },
        200,
      );
    }
    const parsed = parseIdentityProviderInput(body);
    if ("message" in parsed) return c.json({ error: "INVALID", message: parsed.message }, 400);
    const lacked = await lackedForGroups(c.env, person.permissions, parsed.input.groupTeams);
    if (lacked.length > 0) return c.json(refusedGroups(lacked), 403);
    if (parsed.input.clientSecret && !canKeepSecrets) return c.json(noKey, 501);
    await config.setIdentityProvider(workspace, parsed.input, person.id);
    await audited(c)("identity-provider:set", {
      kind: parsed.input.kind,
      secretChanged: parsed.input.clientSecret !== undefined,
    });
    return c.json({ provider: (await config.getIdentityProvider(workspace)) ?? null }, 200);
  });

  app.openapi(platformRoute(deleteIdentityProviderRoute, "settings:write"), async (c) => {
    if (!(await c.env.config.deleteIdentityProvider(c.env.workspace))) {
      return c.json({ error: "NOT_FOUND", message: "No provider is configured." }, 404);
    }
    await audited(c)("identity-provider:delete");
    return c.body(null, 204);
  });

  app.openapi(platformRoute(listConnectorClientsRoute, "settings:read"), async (c) =>
    c.json({ clients: await c.env.config.listConnectorClients(c.env.workspace) }, 200),
  );

  app.openapi(platformRoute(putConnectorClientRoute, "settings:write"), async (c) => {
    const { config, workspace, canKeepSecrets } = c.env;
    const connector = c.req.valid("param").type;
    if (!connectorType.test(connector)) {
      return c.json({ error: "NOT_FOUND", message: "There is no such connector type." }, 404);
    }
    const b = ((c.req.valid("json") as Record<string, unknown> | null) ?? {}) as Record<
      string,
      unknown
    >;
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
      return c.json(
        {
          error: "INVALID",
          message:
            "`authorizeUrl` and `tokenUrl` (https), `clientId` and `clientSecret` are required.",
        },
        400,
      );
    }
    if (!canKeepSecrets) return c.json(noKey, 501);
    const result = await config.setConnectorClient(
      workspace,
      connector,
      { authorizeUrl, tokenUrl, clientId, ...(clientSecret ? { clientSecret } : {}) },
      c.get("person").id,
    );
    if (result === "SECRET_REQUIRED") {
      return c.json(
        { error: "INVALID", message: "A new OAuth client needs its `clientSecret`." },
        400,
      );
    }
    await audited(c)(`connector-client:${connector}:set`, {
      secretChanged: clientSecret !== undefined,
    });
    return c.json({ connector }, result === "created" ? 201 : 200);
  });

  app.openapi(platformRoute(deleteConnectorClientRoute, "settings:write"), async (c) => {
    const connector = c.req.valid("param").type;
    if (!(await c.env.config.deleteConnectorClient(c.env.workspace, connector))) {
      return c.json({ error: "NOT_FOUND", message: `No OAuth client for ${connector}.` }, 404);
    }
    await audited(c)(`connector-client:${connector}:delete`);
    return c.body(null, 204);
  });

  app.all("/api/identity-provider", methodNotAllowed);
  app.all("/api/connector-clients", methodNotAllowed);
  app.all("/api/connector-clients/:type", methodNotAllowed);
}
