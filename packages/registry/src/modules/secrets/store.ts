import type { RegisteredEnvironment } from "../../kernel/errors";
import type { Kernel } from "../../kernel/kernel";
import type { SecretRequestInfo, SecretRequestRefusal, SecretState, SecretStatus } from "./types";
import type { Catalog } from "../catalog/public";

/** What this module asks of the catalog: narrow, and only through its public API. */
export type CatalogPort = { requireTool: Catalog["requireTool"] } & Pick<
  Catalog["api"],
  "getBuild" | "listVersions"
>;

/** How long a link to enter a secret lives (D-083). */
const SECRET_REQUEST_TTL_MS = 15 * 60 * 1000;

const toBase64Url = (bytes: Uint8Array) =>
  btoa(String.fromCharCode(...bytes))
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/, "");

/** What is stored in place of a link's token: nobody can get the link back from the database. */
async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function createSecrets(kernel: Kernel, catalog: CatalogPort) {
  const { d1, now, newId, all, first, write, secretBox, auditStatement } = kernel;
  const { requireTool } = catalog;
  const slot = (toolId: string, environment: string, name: string) =>
    `${toolId}/${environment}/${name}`;

  const userSlot = (toolId: string, person: string, name: string) =>
    `user/${toolId}/${person}/${name}`;

  return {
    // ---- secrets (resources.secrets: set by the admin, per tool and environment, encrypted)
    /** Sets or replaces a secret. The value is encrypted before it reaches the database. */
    async setSecret(
      toolId: string,
      environment: RegisteredEnvironment,
      name: string,
      value: string,
    ): Promise<void> {
      await requireTool(toolId);
      const sealed = await secretBox().seal(slot(toolId, environment, name), value);
      await write(
        `INSERT INTO "secrets" ("tool_id", "environment", "name", "iv", "ciphertext", "updated_at")
VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT ("tool_id", "environment", "name")
DO UPDATE SET "iv" = excluded."iv", "ciphertext" = excluded."ciphertext", "updated_at" = excluded."updated_at"`,
        toolId,
        environment,
        name,
        sealed.iv,
        sealed.ciphertext,
        now(),
      );
    },
    /** The names of the secrets that are set, never their values. */
    async secretNames(toolId: string, environment: RegisteredEnvironment): Promise<string[]> {
      return (
        await all(
          `SELECT "name" FROM "secrets" WHERE "tool_id" = ? AND "environment" = ? ORDER BY "name"`,
          toolId,
          environment,
        )
      ).map((r) => String(r.name));
    },
    /**
     * The secrets the tool declares (`resources.secrets` of its latest published version) and,
     * for each environment, whether it is set or missing. The same answer feeds the console and
     * the admin MCP's `secrets_status`.
     */
    async secretsStatus(toolId: string): Promise<SecretStatus[]> {
      await requireTool(toolId);
      const latest = (await catalog.listVersions(toolId)).at(-1);
      const build = latest ? await catalog.getBuild(latest.buildId) : undefined;
      const declared = Object.keys(
        (build?.manifest as { resources?: { secrets?: Record<string, unknown> } } | null)?.resources
          ?.secrets ?? {},
      ).sort();
      const set = {
        preview: new Set(await this.secretNames(toolId, "preview")),
        production: new Set(await this.secretNames(toolId, "production")),
      };
      const state = (env: RegisteredEnvironment, name: string): SecretState =>
        set[env].has(name) ? "set" : "missing";
      return declared.map((name) => ({
        name,
        environments: {
          preview: state("preview", name),
          production: state("production", name),
        },
      }));
    },
    async deleteSecret(
      toolId: string,
      environment: RegisteredEnvironment,
      name: string,
    ): Promise<void> {
      await write(
        `DELETE FROM "secrets" WHERE "tool_id" = ? AND "environment" = ? AND "name" = ?`,
        toolId,
        environment,
        name,
      );
    },
    /** The decrypted secrets of an environment: for the runtime's `ctx.secrets`, never for a person. */
    async readSecrets(
      toolId: string,
      environment: RegisteredEnvironment,
    ): Promise<Record<string, string>> {
      const box = secretBox();
      const out: Record<string, string> = {};
      for (const r of await all(
        `SELECT "name", "iv", "ciphertext" FROM "secrets" WHERE "tool_id" = ? AND "environment" = ?`,
        toolId,
        environment,
      )) {
        const name = String(r.name);
        out[name] = await box.open(slot(toolId, environment, name), {
          iv: String(r.iv),
          ciphertext: String(r.ciphertext),
        });
      }
      return out;
    },

    // ---- per-person secrets (resources.userSecrets: typed by each person, sealed, D-036)
    /** Sets or replaces the secret of one person for one tool. Encrypted before the database. */
    async setUserSecret(input: { toolId: string; person: string; name: string; value: string }) {
      const sealed = await secretBox().seal(
        userSlot(input.toolId, input.person, input.name),
        input.value,
      );
      await write(
        `INSERT INTO "user_secrets" ("tool_id", "person", "name", "iv", "ciphertext", "updated_at") VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT ("tool_id", "person", "name") DO UPDATE SET "iv" = excluded."iv", "ciphertext" = excluded."ciphertext", "updated_at" = excluded."updated_at"`,
        input.toolId,
        input.person,
        input.name,
        sealed.iv,
        sealed.ciphertext,
        now(),
      );
    },
    /**
     * The decrypted secrets of ONE person for one tool. Only the gateway calls this, to hand a person
     * their own to the tool they call: no route of the platform returns what it gives back.
     */
    async readUserSecrets(toolId: string, person: string): Promise<Record<string, string>> {
      const box = secretBox();
      const out: Record<string, string> = {};
      for (const r of await all(
        `SELECT "name", "iv", "ciphertext" FROM "user_secrets" WHERE "tool_id" = ? AND "person" = ?`,
        toolId,
        person,
      )) {
        const name = String(r.name);
        out[name] = await box.open(userSlot(toolId, person, name), {
          iv: String(r.iv),
          ciphertext: String(r.ciphertext),
        });
      }
      return out;
    },
    /** Who holds which per-person secrets of a tool: names only, for the admin to revoke from. */
    async userSecretHolders(toolId: string): Promise<Array<{ person: string; names: string[] }>> {
      const by = new Map<string, string[]>();
      for (const r of await all(
        `SELECT "person", "name" FROM "user_secrets" WHERE "tool_id" = ? ORDER BY "person", "name"`,
        toolId,
      )) {
        by.set(String(r.person), [...(by.get(String(r.person)) ?? []), String(r.name)]);
      }
      return [...by].map(([person, names]) => ({ person, names }));
    },
    /** The admin's revocation: one secret of one person, or all of that person's, for a tool. */
    async revokeUserSecrets(toolId: string, person: string, name?: string): Promise<number> {
      const found = await all(
        name === undefined
          ? `SELECT 1 FROM "user_secrets" WHERE "tool_id" = ? AND "person" = ?`
          : `SELECT 1 FROM "user_secrets" WHERE "tool_id" = ? AND "person" = ? AND "name" = ?`,
        ...(name === undefined ? [toolId, person] : [toolId, person, name]),
      );
      if (found.length === 0) return 0;
      await write(
        name === undefined
          ? `DELETE FROM "user_secrets" WHERE "tool_id" = ? AND "person" = ?`
          : `DELETE FROM "user_secrets" WHERE "tool_id" = ? AND "person" = ? AND "name" = ?`,
        ...(name === undefined ? [toolId, person] : [toolId, person, name]),
      );
      return found.length;
    },

    // ---- requests to enter a secret (D-083): the admin MCP never sees a value, it hands a link
    /**
     * Opens a link where `person` types the secret `name` of a tool in an environment. Returns the
     * link's token once; only its hash is kept. The line in the audit log carries no token.
     */
    async requestSecret(input: {
      toolId: string;
      environment: RegisteredEnvironment;
      name: string;
      person: string;
      via?: string;
    }): Promise<{ token: string; expiresAt: string }> {
      await requireTool(input.toolId);
      const token = toBase64Url(crypto.getRandomValues(new Uint8Array(32)));
      const at = now();
      const expiresAt = new Date(Date.parse(at) + SECRET_REQUEST_TTL_MS).toISOString();
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "secret_requests" ("id", "token_hash", "tool_id", "environment", "name", "person", "created_at", "expires_at") VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            newId(),
            await hashToken(token),
            input.toolId,
            input.environment,
            input.name,
            input.person,
            at,
            expiresAt,
          ),
        auditStatement(
          {
            toolId: input.toolId,
            actor: input.person,
            ...(input.via ? { via: input.via } : {}),
            kind: "access",
            subject: `secret:${input.name}`,
            detail: { event: "secret-requested", environment: input.environment },
          },
          at,
        ),
      ]);
      return { token, expiresAt };
    },
    /** What a link is for, if `person` may use it now; otherwise why not. Spends nothing. */
    async secretRequest(
      workspace: string,
      token: string,
      person: string,
    ): Promise<SecretRequestInfo | SecretRequestRefusal> {
      const row = await first(
        `SELECT r."tool_id", t."name" AS "tool", r."environment", r."name", r."person", r."expires_at", r."used_at"
FROM "secret_requests" r JOIN "tools" t ON t."id" = r."tool_id"
WHERE r."token_hash" = ? AND t."workspace" = ?`,
        await hashToken(token),
        workspace,
      );
      // Another person's link, or another workspace's, is the same answer as no link.
      if (!row || String(row.person) !== person) return "unknown";
      if (row.used_at !== null && row.used_at !== undefined) return "used";
      if (String(row.expires_at) <= now()) return "expired";
      return {
        toolId: String(row.tool_id),
        tool: String(row.tool),
        environment: String(row.environment) as RegisteredEnvironment,
        name: String(row.name),
        expiresAt: String(row.expires_at),
      };
    },
    /**
     * Spends the link and sets the secret. The claim, the sealed value and the audit line are ONE
     * `d1.batch`: the claim is a conditional update, and the other two are written only if this
     * batch made it, so two parallel uses cannot both set a value, and a use never leaves a line
     * without a secret or a secret without a line.
     */
    async fulfilSecretRequest(
      workspace: string,
      token: string,
      person: string,
      value: string,
      via?: string,
    ): Promise<SecretRequestInfo | SecretRequestRefusal> {
      const info = await this.secretRequest(workspace, token, person);
      if (typeof info === "string") return info;
      const hash = await hashToken(token);
      const sealed = await secretBox().seal(slot(info.toolId, info.environment, info.name), value);
      const at = now();
      const claim = newId();
      const mine = {
        sql: `SELECT 1 FROM "secret_requests" WHERE "token_hash" = ? AND "claim" = ?`,
        values: [hash, claim],
      };
      await d1.batch([
        d1
          .prepare(
            `UPDATE "secret_requests" SET "used_at" = ?, "claim" = ? WHERE "token_hash" = ? AND "person" = ? AND "used_at" IS NULL AND "expires_at" > ?`,
          )
          .bind(at, claim, hash, person, at),
        d1
          .prepare(
            `INSERT INTO "secrets" ("tool_id", "environment", "name", "iv", "ciphertext", "updated_at")
SELECT ?, ?, ?, ?, ?, ? WHERE EXISTS (${mine.sql})
ON CONFLICT ("tool_id", "environment", "name")
DO UPDATE SET "iv" = excluded."iv", "ciphertext" = excluded."ciphertext", "updated_at" = excluded."updated_at"`,
          )
          .bind(
            info.toolId,
            info.environment,
            info.name,
            sealed.iv,
            sealed.ciphertext,
            at,
            ...mine.values,
          ),
        auditStatement(
          {
            toolId: info.toolId,
            actor: person,
            ...(via ? { via } : {}),
            kind: "access",
            subject: `secret:${info.name}`,
            detail: { event: "secret-set", environment: info.environment },
          },
          at,
          mine,
        ),
      ]);
      const won = await first(mine.sql, ...mine.values);
      return won
        ? info
        : (await this.secretRequest(workspace, token, person)) === "expired"
          ? "expired"
          : "used";
    },
  };
}
