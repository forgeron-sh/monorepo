import type { RegisteredEnvironment } from "../../kernel/errors";
import type { Kernel } from "../../kernel/kernel";
import { text } from "../../kernel/rows";
import type { ConnectionTokens, ConnectionInfo } from "./types";
import type { Catalog } from "../catalog/public";

/** What this module asks of the catalog: narrow, and only through its public API. */
export type CatalogPort = { requireTool: Catalog["requireTool"] };

export function createConnections(kernel: Kernel, catalog: CatalogPort) {
  const { now, all, first, write, secretBox } = kernel;
  const { requireTool } = catalog;
  const connectionSlot = (c: {
    toolId: string;
    environment: string;
    userId: string;
    connector: string;
  }) => `connection/${c.toolId}/${c.environment}/${c.userId}/${c.connector}`;

  return {
    // ---- connections (a person's OAuth consent for a delegated connector, tokens sealed)
    /** Keeps or replaces a person's consent. The tokens are encrypted before the database. */
    async saveConnection(input: {
      toolId: string;
      environment: RegisteredEnvironment;
      userId: string;
      connector: string;
      scopes: string[];
      tokens: ConnectionTokens;
      expiresAt?: string;
    }): Promise<void> {
      await requireTool(input.toolId);
      const sealed = await secretBox().seal(connectionSlot(input), JSON.stringify(input.tokens));
      const at = now();
      await write(
        `INSERT INTO "connections" ("tool_id", "environment", "user_id", "connector", "scopes", "expires_at", "iv", "ciphertext", "created_at", "updated_at")
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON CONFLICT ("tool_id", "environment", "user_id", "connector")
DO UPDATE SET "scopes" = excluded."scopes", "expires_at" = excluded."expires_at", "iv" = excluded."iv", "ciphertext" = excluded."ciphertext", "updated_at" = excluded."updated_at"`,
        input.toolId,
        input.environment,
        input.userId,
        input.connector,
        JSON.stringify(input.scopes),
        input.expiresAt ?? null,
        sealed.iv,
        sealed.ciphertext,
        at,
        at,
      );
    },
    /** The consents of a tool's environment, for the admin: who consented to what, never a token. */
    async listConnections(
      toolId: string,
      environment: RegisteredEnvironment,
      filter: { userId?: string } = {},
    ): Promise<ConnectionInfo[]> {
      const rows = await all(
        `SELECT "user_id", "connector", "scopes", "expires_at", "created_at", "updated_at" FROM "connections"
WHERE "tool_id" = ? AND "environment" = ? ${filter.userId === undefined ? "" : 'AND "user_id" = ?'}
ORDER BY "user_id", "connector"`,
        toolId,
        environment,
        ...(filter.userId === undefined ? [] : [filter.userId]),
      );
      return rows.map((r) => ({
        userId: String(r.user_id),
        connector: String(r.connector),
        scopes: JSON.parse(String(r.scopes)) as string[],
        ...(text(r.expires_at) ? { expiresAt: text(r.expires_at) } : {}),
        createdAt: String(r.created_at),
        updatedAt: String(r.updated_at),
      }));
    },
    /** The admin revokes a person's consent (or the person withdraws it). True if there was one. */
    async revokeConnection(input: {
      toolId: string;
      environment: RegisteredEnvironment;
      userId: string;
      connector: string;
    }): Promise<boolean> {
      const existed = await first(
        `SELECT 1 AS found FROM "connections" WHERE "tool_id" = ? AND "environment" = ? AND "user_id" = ? AND "connector" = ?`,
        input.toolId,
        input.environment,
        input.userId,
        input.connector,
      );
      await write(
        `DELETE FROM "connections" WHERE "tool_id" = ? AND "environment" = ? AND "user_id" = ? AND "connector" = ?`,
        input.toolId,
        input.environment,
        input.userId,
        input.connector,
      );
      return existed !== undefined;
    },
    /** The decrypted tokens, for the connector's session at run time: never for a person or the admin. */
    async readConnection(input: {
      toolId: string;
      environment: RegisteredEnvironment;
      userId: string;
      connector: string;
    }): Promise<(ConnectionTokens & { expiresAt?: string; scopes: string[] }) | undefined> {
      const row = await first(
        `SELECT "scopes", "expires_at", "iv", "ciphertext" FROM "connections" WHERE "tool_id" = ? AND "environment" = ? AND "user_id" = ? AND "connector" = ?`,
        input.toolId,
        input.environment,
        input.userId,
        input.connector,
      );
      if (!row) return undefined;
      const tokens = JSON.parse(
        await secretBox().open(connectionSlot(input), {
          iv: String(row.iv),
          ciphertext: String(row.ciphertext),
        }),
      ) as ConnectionTokens;
      return {
        ...tokens,
        scopes: JSON.parse(String(row.scopes)) as string[],
        ...(text(row.expires_at) ? { expiresAt: text(row.expires_at) } : {}),
      };
    },
  };
}
