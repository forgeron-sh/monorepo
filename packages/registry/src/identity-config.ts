// The workspace's sign-in provider and the OAuth clients of its delegated connectors, kept in the
// platform D1 (D-033). Client secrets are sealed with the registry's key and never listed.
import type { D1Database } from "@forgeron/hosting";
import type { SecretBox } from "./secret-box";

export type IdentityProviderKind = "oidc" | "entra" | "google";

/** How a workspace signs people in. Only `clientSecret` is secret, and it is never returned by a list. */
export interface IdentityProviderConfig {
  kind: IdentityProviderKind;
  /** `oidc` only: the issuer URL. `entra` and `google` derive theirs. */
  issuer?: string;
  clientId: string;
  /** `entra` only: the directory (tenant) id; a token from another tenant is refused. */
  tenant?: string;
  /** `google` only: the Workspace domain (`hd`); a token from another domain is refused. */
  hostedDomain?: string;
  /** Claim holding the email; `email` by default. */
  emailClaim?: string;
  /** Claim holding the groups, an array of strings; none by default. */
  groupsClaim?: string;
  /** Role granted at a member's first sign-in for each group they belong to. */
  groupRoles: Record<string, string>;
  updatedBy: string;
  updatedAt: string;
}

export interface IdentityProviderInput {
  kind: IdentityProviderKind;
  issuer?: string;
  clientId: string;
  /** Omitted: the one already kept stays. */
  clientSecret?: string;
  tenant?: string;
  hostedDomain?: string;
  emailClaim?: string;
  groupsClaim?: string;
  groupRoles?: Record<string, string>;
}

/** The OAuth client of one connector type (`microsoft-365`), as the platform registered it. */
export interface ConnectorClientConfig {
  connector: string;
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  updatedBy: string;
  updatedAt: string;
}

export interface ConnectorClientInput {
  authorizeUrl: string;
  tokenUrl: string;
  clientId: string;
  clientSecret?: string;
}

type Row = Record<string, unknown>;
const text = (v: unknown) => (v === null || v === undefined ? undefined : String(v));

export function createIdentityConfig(
  d1: D1Database,
  options: { secrets?: SecretBox; now?: () => Date } = {},
) {
  const now = () => (options.now?.() ?? new Date()).toISOString();
  const rows = async (sql: string, ...values: unknown[]) =>
    ((
      await d1
        .prepare(sql)
        .bind(...values)
        .all()
    ).results ?? []) as Row[];
  const box = () => {
    if (!options.secrets)
      throw new Error("The registry has no secret key: it cannot keep secrets.");
    return options.secrets;
  };
  const providerSlot = (workspace: string) => `identity-provider/${workspace}`;
  const clientSlot = (workspace: string, connector: string) =>
    `connector-client/${workspace}/${connector}`;

  const toProvider = (r: Row): IdentityProviderConfig => ({
    kind: String(r.kind) as IdentityProviderKind,
    ...(text(r.issuer) ? { issuer: text(r.issuer)! } : {}),
    clientId: String(r.client_id),
    ...(text(r.tenant) ? { tenant: text(r.tenant)! } : {}),
    ...(text(r.hosted_domain) ? { hostedDomain: text(r.hosted_domain)! } : {}),
    ...(text(r.email_claim) ? { emailClaim: text(r.email_claim)! } : {}),
    ...(text(r.groups_claim) ? { groupsClaim: text(r.groups_claim)! } : {}),
    groupRoles: JSON.parse(String(r.group_roles)) as Record<string, string>,
    updatedBy: String(r.updated_by),
    updatedAt: String(r.updated_at),
  });
  const toClient = (r: Row): ConnectorClientConfig => ({
    connector: String(r.connector),
    authorizeUrl: String(r.authorize_url),
    tokenUrl: String(r.token_url),
    clientId: String(r.client_id),
    updatedBy: String(r.updated_by),
    updatedAt: String(r.updated_at),
  });

  return {
    /** The provider, with its secret when `withSecret` (for the sign-in only: never for an API answer). */
    async getIdentityProvider(
      workspace: string,
      withSecret = false,
    ): Promise<
      (IdentityProviderConfig & { clientSecret?: string; hasSecret: boolean }) | undefined
    > {
      const row = (
        await rows(`SELECT * FROM "identity_providers" WHERE "workspace" = ?`, workspace)
      )[0];
      if (!row) return undefined;
      const hasSecret = row.ciphertext !== null && row.ciphertext !== undefined;
      const secret =
        withSecret && hasSecret
          ? await box().open(providerSlot(workspace), {
              iv: String(row.iv),
              ciphertext: String(row.ciphertext),
            })
          : undefined;
      return { ...toProvider(row), hasSecret, ...(secret ? { clientSecret: secret } : {}) };
    },
    async setIdentityProvider(
      workspace: string,
      input: IdentityProviderInput,
      actor: string,
    ): Promise<void> {
      const sealed = input.clientSecret
        ? await box().seal(providerSlot(workspace), input.clientSecret)
        : undefined;
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "identity_providers" ("workspace", "kind", "issuer", "client_id", "tenant", "hosted_domain", "email_claim", "groups_claim", "group_roles", "iv", "ciphertext", "updated_by", "updated_at")
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT ("workspace") DO UPDATE SET "kind" = excluded."kind", "issuer" = excluded."issuer", "client_id" = excluded."client_id", "tenant" = excluded."tenant", "hosted_domain" = excluded."hosted_domain", "email_claim" = excluded."email_claim", "groups_claim" = excluded."groups_claim", "group_roles" = excluded."group_roles",
  "iv" = COALESCE(excluded."iv", "identity_providers"."iv"), "ciphertext" = COALESCE(excluded."ciphertext", "identity_providers"."ciphertext"),
  "updated_by" = excluded."updated_by", "updated_at" = excluded."updated_at"`,
          )
          .bind(
            workspace,
            input.kind,
            input.issuer ?? null,
            input.clientId,
            input.tenant ?? null,
            input.hostedDomain ?? null,
            input.emailClaim ?? null,
            input.groupsClaim ?? null,
            JSON.stringify(input.groupRoles ?? {}),
            sealed?.iv ?? null,
            sealed?.ciphertext ?? null,
            actor,
            at,
          ),
      ]);
    },
    async deleteIdentityProvider(workspace: string): Promise<boolean> {
      const existed = (
        await rows(`SELECT 1 AS x FROM "identity_providers" WHERE "workspace" = ?`, workspace)
      )[0];
      await d1.batch([
        d1.prepare(`DELETE FROM "identity_providers" WHERE "workspace" = ?`).bind(workspace),
      ]);
      return existed !== undefined;
    },

    /** The OAuth clients of the connectors, without secrets. */
    async listConnectorClients(workspace: string): Promise<ConnectorClientConfig[]> {
      return (
        await rows(
          `SELECT * FROM "connector_clients" WHERE "workspace" = ? ORDER BY "connector"`,
          workspace,
        )
      ).map(toClient);
    },
    /** With secrets, for the consent exchange only. */
    async connectorClientsWithSecrets(
      workspace: string,
    ): Promise<Array<ConnectorClientConfig & { clientSecret: string }>> {
      const found = await rows(
        `SELECT * FROM "connector_clients" WHERE "workspace" = ?`,
        workspace,
      );
      return Promise.all(
        found.map(async (r) => ({
          ...toClient(r),
          clientSecret: await box().open(clientSlot(workspace, String(r.connector)), {
            iv: String(r.iv),
            ciphertext: String(r.ciphertext),
          }),
        })),
      );
    },
    /** A new client needs its secret; an existing one keeps its secret when none is given. */
    async setConnectorClient(
      workspace: string,
      connector: string,
      input: ConnectorClientInput,
      actor: string,
    ): Promise<"created" | "updated" | "SECRET_REQUIRED"> {
      const existing = (
        await rows(
          `SELECT 1 AS x FROM "connector_clients" WHERE "workspace" = ? AND "connector" = ?`,
          workspace,
          connector,
        )
      )[0];
      if (!existing && !input.clientSecret) return "SECRET_REQUIRED";
      const sealed = input.clientSecret
        ? await box().seal(clientSlot(workspace, connector), input.clientSecret)
        : undefined;
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "connector_clients" ("workspace", "connector", "authorize_url", "token_url", "client_id", "iv", "ciphertext", "updated_by", "updated_at")
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT ("workspace", "connector") DO UPDATE SET "authorize_url" = excluded."authorize_url", "token_url" = excluded."token_url", "client_id" = excluded."client_id",
  "iv" = COALESCE(excluded."iv", "connector_clients"."iv"), "ciphertext" = COALESCE(excluded."ciphertext", "connector_clients"."ciphertext"),
  "updated_by" = excluded."updated_by", "updated_at" = excluded."updated_at"`,
          )
          .bind(
            workspace,
            connector,
            input.authorizeUrl,
            input.tokenUrl,
            input.clientId,
            sealed?.iv ?? null,
            sealed?.ciphertext ?? null,
            actor,
            now(),
          ),
      ]);
      return existing ? "updated" : "created";
    },
    async deleteConnectorClient(workspace: string, connector: string): Promise<boolean> {
      const existed = (
        await rows(
          `SELECT 1 AS x FROM "connector_clients" WHERE "workspace" = ? AND "connector" = ?`,
          workspace,
          connector,
        )
      )[0];
      await d1.batch([
        d1
          .prepare(`DELETE FROM "connector_clients" WHERE "workspace" = ? AND "connector" = ?`)
          .bind(workspace, connector),
      ]);
      return existed !== undefined;
    },
  };
}

export type IdentityConfig = ReturnType<typeof createIdentityConfig>;
