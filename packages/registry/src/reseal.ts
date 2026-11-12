// Re-sealing (D-108): every value the platform keeps sealed, opened with the current key or a previous
// one and sealed again under the current key, so that a replaced `SECRETS_KEY` can be dropped from
// `SECRETS_KEY_PREVIOUS`. One workspace at a time: an admin only touches what is their workspace's.
import type { D1Database } from "@forgeron/hosting";
import type { SecretBox } from "./secret-box";

export interface ResealReport {
  /** Values that were under a previous key and are now under the current one. */
  resealed: number;
  /** Values that were already under the current key. */
  current: number;
  /** Values no key opens: they stay as they are and must be typed again. */
  unreadable: number;
}

type Row = Record<string, unknown>;

export function createReseal(d1: D1Database, box: SecretBox) {
  const rows = async (sql: string, ...values: unknown[]) =>
    ((
      await d1
        .prepare(sql)
        .bind(...values)
        .all()
    ).results ?? []) as Row[];

  return {
    /**
     * Seals again, in this workspace, the secrets of its tools, the versions of its people's secrets,
     * its connections, its sign-in provider, its connectors' OAuth clients, its marketplaces' read tokens and its GitHub App's keys. A value changed while this
     * runs is left alone: the update only applies to the value that was read, and a value written
     * meanwhile is already under the current key.
     */
    async resealSecrets(workspace: string): Promise<ResealReport> {
      const report: ResealReport = { resealed: 0, current: 0, unreadable: 0 };
      const each = async (
        found: Row[],
        slotOf: (r: Row) => string,
        update: (
          r: Row,
          sealed: { iv: string; ciphertext: string },
        ) => ReturnType<D1Database["prepare"]>,
      ) => {
        for (const r of found) {
          if (r.ciphertext === null || r.ciphertext === undefined) continue;
          const old = { iv: String(r.iv), ciphertext: String(r.ciphertext) };
          let sealed;
          try {
            sealed = await box.reseal(slotOf(r), old);
          } catch {
            report.unreadable += 1;
            continue;
          }
          if (!sealed) {
            report.current += 1;
            continue;
          }
          await update(r, sealed).all();
          report.resealed += 1;
        }
      };
      const guard = `"iv" = ? AND "ciphertext" = ?`;

      await each(
        await rows(
          `SELECT s."tool_id", s."environment", s."name", s."iv", s."ciphertext" FROM "secrets" s JOIN "tools" t ON t."id" = s."tool_id" WHERE t."workspace" = ?`,
          workspace,
        ),
        (r) => `${String(r.tool_id)}/${String(r.environment)}/${String(r.name)}`,
        (r, sealed) =>
          d1
            .prepare(
              `UPDATE "secrets" SET "iv" = ?, "ciphertext" = ? WHERE "tool_id" = ? AND "environment" = ? AND "name" = ? AND ${guard}`,
            )
            .bind(
              sealed.iv,
              sealed.ciphertext,
              r.tool_id,
              r.environment,
              r.name,
              r.iv,
              r.ciphertext,
            ),
      );
      // A version stores its own additional data (D-104), which is its slot.
      await each(
        await rows(
          `SELECT v."secret_id", v."version", v."iv", v."ciphertext", v."aad" FROM "person_secret_versions" v JOIN "person_secrets" p ON p."id" = v."secret_id" WHERE p."workspace" = ?`,
          workspace,
        ),
        (r) => String(r.aad),
        (r, sealed) =>
          d1
            .prepare(
              `UPDATE "person_secret_versions" SET "iv" = ?, "ciphertext" = ? WHERE "secret_id" = ? AND "version" = ? AND ${guard}`,
            )
            .bind(sealed.iv, sealed.ciphertext, r.secret_id, r.version, r.iv, r.ciphertext),
      );
      await each(
        await rows(
          `SELECT c."tool_id", c."environment", c."user_id", c."connector", c."iv", c."ciphertext" FROM "connections" c JOIN "tools" t ON t."id" = c."tool_id" WHERE t."workspace" = ?`,
          workspace,
        ),
        (r) =>
          `connection/${String(r.tool_id)}/${String(r.environment)}/${String(r.user_id)}/${String(r.connector)}`,
        (r, sealed) =>
          d1
            .prepare(
              `UPDATE "connections" SET "iv" = ?, "ciphertext" = ? WHERE "tool_id" = ? AND "environment" = ? AND "user_id" = ? AND "connector" = ? AND ${guard}`,
            )
            .bind(
              sealed.iv,
              sealed.ciphertext,
              r.tool_id,
              r.environment,
              r.user_id,
              r.connector,
              r.iv,
              r.ciphertext,
            ),
      );
      await each(
        await rows(
          `SELECT "iv", "ciphertext" FROM "identity_providers" WHERE "workspace" = ?`,
          workspace,
        ),
        () => `identity-provider/${workspace}`,
        (r, sealed) =>
          d1
            .prepare(
              `UPDATE "identity_providers" SET "iv" = ?, "ciphertext" = ? WHERE "workspace" = ? AND ${guard}`,
            )
            .bind(sealed.iv, sealed.ciphertext, workspace, r.iv, r.ciphertext),
      );
      await each(
        await rows(
          `SELECT "connector", "iv", "ciphertext" FROM "connector_clients" WHERE "workspace" = ?`,
          workspace,
        ),
        (r) => `connector-client/${workspace}/${String(r.connector)}`,
        (r, sealed) =>
          d1
            .prepare(
              `UPDATE "connector_clients" SET "iv" = ?, "ciphertext" = ? WHERE "workspace" = ? AND "connector" = ? AND ${guard}`,
            )
            .bind(sealed.iv, sealed.ciphertext, workspace, r.connector, r.iv, r.ciphertext),
      );
      await each(
        await rows(
          `SELECT "id", "iv", "ciphertext" FROM "marketplaces" WHERE "workspace" = ?`,
          workspace,
        ),
        (r) => `marketplace/${workspace}/${String(r.id)}`,
        (r, sealed) =>
          d1
            .prepare(
              `UPDATE "marketplaces" SET "iv" = ?, "ciphertext" = ? WHERE "workspace" = ? AND "id" = ? AND ${guard}`,
            )
            .bind(sealed.iv, sealed.ciphertext, workspace, r.id, r.iv, r.ciphertext),
      );
      await each(
        await rows(`SELECT "iv", "ciphertext" FROM "github_apps" WHERE "workspace" = ?`, workspace),
        () => `github-app/${workspace}`,
        (r, sealed) =>
          d1
            .prepare(
              `UPDATE "github_apps" SET "iv" = ?, "ciphertext" = ? WHERE "workspace" = ? AND ${guard}`,
            )
            .bind(sealed.iv, sealed.ciphertext, workspace, r.iv, r.ciphertext),
      );
      return report;
    },
  };
}
