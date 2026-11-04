import type { Kernel } from "../../kernel/kernel";

export function createIdentityStore(kernel: Kernel) {
  const { d1, now, newId, first } = kernel;
  return {
    // ---- one-time codes (D-028)
    /**
     * Spends a one-time code: `true` the first time, `false` if it was already spent. Spent codes
     * past their expiry are forgotten.
     */
    async spendCode(id: string, expiresAt: Date): Promise<boolean> {
      try {
        await d1.batch([
          d1.prepare(`DELETE FROM "cli_codes" WHERE "expires_at" < ?`).bind(now()),
          d1
            .prepare(`INSERT INTO "cli_codes" ("id", "expires_at") VALUES (?, ?)`)
            .bind(id, expiresAt.toISOString()),
        ]);
        return true;
      } catch (error) {
        if (/UNIQUE|constraint/i.test(String(error))) return false;
        throw error;
      }
    },

    // ---- token revocation (D-035)
    /** Voids one token, named by its `jti`, until `expiresAt` (its own expiry). */
    async revokeToken(workspace: string, person: string, jti: string, expiresAt: Date) {
      await d1.batch([
        d1.prepare(`DELETE FROM "token_revocations" WHERE "expires_at" < ?`).bind(now()),
        d1
          .prepare(
            `INSERT INTO "token_revocations" ("id", "workspace", "person", "jti", "at", "expires_at") VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            newId(),
            workspace,
            person,
            jti,
            Math.floor(Date.parse(now()) / 1000),
            expiresAt.toISOString(),
          ),
      ]);
    },
    /**
     * Voids every token of a person issued up to now, those of the same second included: when in
     * doubt the token is refused. `lifetime` is the longest a token can live.
     */
    async revokePersonTokens(workspace: string, person: string, lifetimeSeconds: number) {
      await d1.batch([
        d1.prepare(`DELETE FROM "token_revocations" WHERE "expires_at" < ?`).bind(now()),
        d1
          .prepare(
            `INSERT INTO "token_revocations" ("id", "workspace", "person", "jti", "at", "expires_at") VALUES (?, ?, ?, NULL, ?, ?)`,
          )
          .bind(
            newId(),
            workspace,
            person,
            Math.floor(Date.parse(now()) / 1000),
            new Date(Date.parse(now()) + lifetimeSeconds * 1000).toISOString(),
          ),
      ]);
    },
    /** Is this token void? `issuedAt` is the token's `iat`, in seconds; `jti` is absent on old tokens. */
    async isTokenRevoked(
      workspace: string,
      person: string,
      jti: string | undefined,
      issuedAt: number,
    ): Promise<boolean> {
      const row = await first(
        `SELECT 1 AS "hit" FROM "token_revocations" WHERE "workspace" = ? AND "person" = ? AND (("jti" IS NULL AND "at" >= ?) OR "jti" = ?) LIMIT 1`,
        workspace,
        person,
        issuedAt,
        jti ?? "",
      );
      return row !== undefined;
    },
  };
}
