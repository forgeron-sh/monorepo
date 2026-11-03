// The short-lived ids of SAML sign-in, in the platform D1 (D-049): a request id is recorded when the
// person is sent to the identity provider and used once when the response comes back; an assertion id
// is recorded when accepted, so the same assertion cannot sign anyone in twice. Each is one statement,
// so two simultaneous responses cannot both win. Expired rows are purged when a sign-in starts.
import type { D1Database } from "@forgeron/hosting";

export function createSamlRequests(d1: D1Database) {
  const iso = (d: Date) => d.toISOString();
  const returned = async (sql: string, ...values: unknown[]) =>
    (
      ((
        await d1
          .prepare(sql)
          .bind(...values)
          .all()
      ).results ?? []) as unknown[]
    ).length > 0;
  return {
    async open(workspace: string, id: string, expiresAt: Date, now: Date): Promise<void> {
      await d1.batch([
        d1.prepare(`DELETE FROM "saml_requests" WHERE "expires_at" <= ?`).bind(iso(now)),
        d1
          .prepare(
            `INSERT INTO "saml_requests" ("workspace", "id", "kind", "expires_at") VALUES (?, ?, 'request', ?)`,
          )
          .bind(workspace, id, iso(expiresAt)),
      ]);
    },
    /** Uses a request id once: `false` if it is unknown, expired or already used. */
    take: (workspace: string, id: string, now: Date): Promise<boolean> =>
      returned(
        `DELETE FROM "saml_requests" WHERE "workspace" = ? AND "id" = ? AND "kind" = 'request' AND "expires_at" > ? RETURNING "id"`,
        workspace,
        id,
        iso(now),
      ),
    /** Records an accepted assertion id: `false` if it is already recorded and not expired (a replay). */
    remember: (workspace: string, id: string, until: Date, now: Date): Promise<boolean> =>
      returned(
        `INSERT INTO "saml_requests" ("workspace", "id", "kind", "expires_at") VALUES (?, ?, 'assertion', ?)
ON CONFLICT ("workspace", "id", "kind") DO UPDATE SET "expires_at" = excluded."expires_at" WHERE "saml_requests"."expires_at" <= ? RETURNING "id"`,
        workspace,
        id,
        iso(until),
        iso(now),
      ),
  };
}
