// The one-time codes of the sign-in by email (D-049), kept in the platform D1. A code is stored as
// a hash only. Each row is one request: it counts for the rate limits whether or not a mail was
// sent, so that the limits cannot tell an address that may sign in from one that may not.
import type { D1Database } from "@forgeron/hosting";

type Row = Record<string, unknown>;

export function createEmailCodes(d1: D1Database, options: { now?: () => Date } = {}) {
  const now = () => options.now?.() ?? new Date();
  const rows = async (sql: string, ...values: unknown[]) =>
    ((
      await d1
        .prepare(sql)
        .bind(...values)
        .all()
    ).results ?? []) as Row[];

  return {
    /** Requests for this email (or from this address) in the last `seconds`. */
    async countRecent(
      workspace: string,
      by: { email: string } | { ipHash: string },
      seconds: number,
    ): Promise<number> {
      const since = new Date(now().getTime() - seconds * 1000).toISOString();
      const [column, value] = "email" in by ? ["email", by.email] : ["ip_hash", by.ipHash];
      const row = (
        await rows(
          `SELECT COUNT(*) AS n FROM "email_codes" WHERE "workspace" = ? AND "${column}" = ? AND "created_at" >= ?`,
          workspace,
          value,
          since,
        )
      )[0];
      return Number(row?.n ?? 0);
    },

    /** Records a request and forgets the ones too old to count for anything. */
    async create(input: {
      id: string;
      workspace: string;
      email: string;
      codeHash: string;
      ipHash: string;
      ttlSeconds: number;
    }): Promise<void> {
      const at = now();
      await d1.batch([
        d1
          .prepare(`DELETE FROM "email_codes" WHERE "created_at" < ?`)
          .bind(new Date(at.getTime() - 2 * 60 * 60 * 1000).toISOString()),
        d1
          .prepare(
            `INSERT INTO "email_codes" ("id", "workspace", "email", "code_hash", "ip_hash", "attempts", "created_at", "expires_at") VALUES (?, ?, ?, ?, ?, 0, ?, ?)`,
          )
          .bind(
            input.id,
            input.workspace,
            input.email,
            input.codeHash,
            input.ipHash,
            at.toISOString(),
            new Date(at.getTime() + input.ttlSeconds * 1000).toISOString(),
          ),
      ]);
    },

    /**
     * Spends one try at a code: the counter goes up in the same statement that reads the row, so
     * parallel guesses cannot exceed `maxAttempts`. `undefined` when the request is unknown,
     * expired, used, or out of tries.
     */
    async attempt(
      id: string,
      workspace: string,
      maxAttempts: number,
    ): Promise<{ email: string; codeHash: string } | undefined> {
      const row = (
        await rows(
          `UPDATE "email_codes" SET "attempts" = "attempts" + 1 WHERE "id" = ? AND "workspace" = ? AND "used_at" IS NULL AND "attempts" < ? AND "expires_at" > ? RETURNING "email", "code_hash"`,
          id,
          workspace,
          maxAttempts,
          now().toISOString(),
        )
      )[0];
      return row ? { email: String(row.email), codeHash: String(row.code_hash) } : undefined;
    },

    /** Makes the code single-use: true for the one caller that spends it. */
    async spend(id: string): Promise<boolean> {
      const row = (
        await rows(
          `UPDATE "email_codes" SET "used_at" = ? WHERE "id" = ? AND "used_at" IS NULL RETURNING "id"`,
          now().toISOString(),
          id,
        )
      )[0];
      return row !== undefined;
    },
  };
}

export type EmailCodes = ReturnType<typeof createEmailCodes>;
