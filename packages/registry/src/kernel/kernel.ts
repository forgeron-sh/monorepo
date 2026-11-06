// What every module shares: the D1 handle, the clock, ids, the three SQL helpers, the secret box
// and the audit statement. Generic: it knows no module (rule `kernel-is-generic`). `auditStatement`
// lives here, not in the audit module, so that a module puts the audit line in the same `d1.batch`
// as the write it records.
import type { D1Database } from "@forgeron/hosting";
import type { SecretBox } from "../secret-box";
import type { AuditEntry } from "./audit";
import { RegistryError } from "./errors";
import type { Row } from "./rows";

export interface RegistryOptions {
  now?: () => Date;
  newId?: () => string;
  /** Encrypts tool secrets at rest; without it the secret methods refuse to run. */
  secrets?: SecretBox;
}

export function createKernel(d1: D1Database, options: RegistryOptions = {}) {
  const now = () => (options.now?.() ?? new Date()).toISOString();
  const newId = options.newId ?? (() => crypto.randomUUID());

  const all = async (sql: string, ...values: unknown[]): Promise<Row[]> =>
    ((
      await d1
        .prepare(sql)
        .bind(...values)
        .all()
    ).results ?? []) as Row[];
  const first = async (sql: string, ...values: unknown[]) => (await all(sql, ...values))[0];
  const write = (sql: string, ...values: unknown[]) => d1.batch([d1.prepare(sql).bind(...values)]);

  /**
   * The audit line as a statement for a `d1.batch`. With `onlyIf` (a SQL condition and its values)
   * the line is written only when the condition holds, so that a batch whose first statement
   * claims something can keep the line from a claim that was lost.
   */
  const auditStatement = (
    entry: AuditEntry,
    at: string,
    onlyIf?: { sql: string; values: unknown[] },
  ) =>
    d1
      .prepare(
        `INSERT INTO "audit_log" ("id", "at", "tool_id", "actor", "interface", "via", "kind", "subject", "version_id", "result", "detail") ${
          onlyIf
            ? `SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE EXISTS (${onlyIf.sql})`
            : "VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)"
        }`,
      )
      .bind(
        newId(),
        at,
        entry.toolId ?? null,
        entry.actor,
        entry.interface ?? null,
        entry.via ?? null,
        entry.kind,
        entry.subject,
        entry.versionId ?? null,
        entry.result ?? "ok",
        entry.detail === undefined ? null : JSON.stringify(entry.detail),
        ...(onlyIf?.values ?? []),
      );

  const secretBox = (): SecretBox => {
    if (!options.secrets) {
      throw new RegistryError(
        "NO_SECRET_KEY",
        "The registry has no secret key: it cannot keep secrets.",
      );
    }
    return options.secrets;
  };
  return { d1, now, newId, all, first, write, auditStatement, secretBox };
}

export type Kernel = ReturnType<typeof createKernel>;
