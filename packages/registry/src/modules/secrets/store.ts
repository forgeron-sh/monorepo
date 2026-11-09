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

  /** What a version of a person's secret is sealed with: bound to the person, the secret and its version (D-104). */
  const secretAad = (workspace: string, person: string, id: string, version: number) =>
    `secret/${workspace}/${person}/${id}/${version}`;

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

    // ---- per-person secrets (resources.userSecrets, D-036), kept in a registry of the person's secrets (D-104)
    // A secret has a stable id and numbered, immutable versions; a binding says which tool field uses it,
    // in which scope, and which version (a pin, or the latest). These four methods keep their names and
    // meaning: a person's value for a tool field, by default the tool-wide binding.
    /**
     * Sets or replaces the secret of one person for one tool field: a new **version** of the secret the
     * tool-wide binding points at, or a new secret and binding. Encrypted before the database. The
     * binding follows the latest version: typing a value is choosing to use it.
     */
    async setUserSecret(input: {
      toolId: string;
      person: string;
      name: string;
      value: string;
      /** Who typed it: the person by default. */
      by?: string;
      via?: "setup" | "admin";
    }) {
      const tool = await requireTool(input.toolId);
      const bound = await first(
        `SELECT b."secret_id" AS "id", (SELECT MAX("version") FROM "person_secret_versions" WHERE "secret_id" = b."secret_id") AS "latest"
FROM "secret_bindings" b WHERE b."tool_id" = ? AND b."person" = ? AND b."field" = ? AND b."scope" = '*'`,
        input.toolId,
        input.person,
        input.name,
      );
      const at = now();
      const id = bound ? String(bound.id) : `sec_${newId()}`;
      const version = bound ? Number(bound.latest) + 1 : 1;
      const aad = secretAad(tool.workspace, input.person, id, version);
      const sealed = await secretBox().seal(aad, input.value);
      await d1.batch([
        ...(bound
          ? [
              d1
                .prepare(
                  `UPDATE "secret_bindings" SET "pin" = NULL WHERE "tool_id" = ? AND "person" = ? AND "field" = ? AND "scope" = '*'`,
                )
                .bind(input.toolId, input.person, input.name),
            ]
          : [
              d1
                .prepare(
                  `INSERT INTO "person_secrets" ("id", "workspace", "person", "label", "kind", "created_at") VALUES (?, ?, ?, ?, NULL, ?)`,
                )
                .bind(id, tool.workspace, input.person, input.name, at),
            ]),
        d1
          .prepare(
            `INSERT INTO "person_secret_versions" ("secret_id", "version", "iv", "ciphertext", "aad", "created_at", "created_by", "via") VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            id,
            version,
            sealed.iv,
            sealed.ciphertext,
            aad,
            at,
            input.by ?? input.person,
            input.via ?? "setup",
          ),
        ...(bound
          ? []
          : [
              d1
                .prepare(
                  `INSERT INTO "secret_bindings" ("tool_id", "person", "field", "scope", "secret_id", "pin") VALUES (?, ?, ?, '*', ?, NULL)`,
                )
                .bind(input.toolId, input.person, input.name, id),
            ]),
      ]);
    },
    /**
     * The decrypted secrets of ONE person for one tool. Only the gateway calls this, to hand a person
     * their own to the tool they call: no route of the platform returns what it gives back. For each
     * field the most specific binding that applies to where the call is served wins: `preview:<branch>`,
     * then `preview`, then `production`, then the tool-wide `*`; its version is its pin, or the latest.
     */
    async readUserSecrets(
      toolId: string,
      person: string,
      served: { environment?: "production" | "preview"; branch?: string } = {},
    ): Promise<Record<string, string>> {
      const order =
        served.environment === "preview"
          ? [...(served.branch ? [`preview:${served.branch}`] : []), "preview", "*"]
          : ["production", "*"];
      const rows = await all(
        `SELECT b."field", b."scope", v."iv", v."ciphertext", v."aad"
FROM "secret_bindings" b JOIN "person_secret_versions" v
  ON v."secret_id" = b."secret_id"
 AND v."version" = COALESCE(b."pin", (SELECT MAX("version") FROM "person_secret_versions" WHERE "secret_id" = b."secret_id"))
WHERE b."tool_id" = ? AND b."person" = ?`,
        toolId,
        person,
      );
      const best = new Map<string, (typeof rows)[number]>();
      for (const r of rows) {
        const rank = order.indexOf(String(r.scope));
        if (rank === -1) continue;
        const current = best.get(String(r.field));
        if (!current || rank < order.indexOf(String(current.scope))) best.set(String(r.field), r);
      }
      const box = secretBox();
      const out: Record<string, string> = {};
      for (const [field, r] of best) {
        out[field] = await box.open(String(r.aad), {
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
        `SELECT DISTINCT "person", "field" FROM "secret_bindings" WHERE "tool_id" = ? ORDER BY "person", "field"`,
        toolId,
      )) {
        by.set(String(r.person), [...(by.get(String(r.person)) ?? []), String(r.field)]);
      }
      return [...by].map(([person, names]) => ({ person, names }));
    },
    /**
     * The admin's revocation: one field of one person, or all of that person's, for a tool, in every
     * scope. The person is asked again. A secret that no binding uses any more is deleted with its
     * versions; one that another tool still uses stays. Returns how many fields were cleared.
     */
    async revokeUserSecrets(toolId: string, person: string, name?: string): Promise<number> {
      const where = name === undefined ? "" : ` AND "field" = ?`;
      const args = name === undefined ? [toolId, person] : [toolId, person, name];
      const bound = await all(
        `SELECT "field", "secret_id" FROM "secret_bindings" WHERE "tool_id" = ? AND "person" = ?${where}`,
        ...args,
      );
      if (bound.length === 0) return 0;
      const ids = [...new Set(bound.map((r) => String(r.secret_id)))];
      const marks = ids.map(() => "?").join(", ");
      await d1.batch([
        d1
          .prepare(`DELETE FROM "secret_bindings" WHERE "tool_id" = ? AND "person" = ?${where}`)
          .bind(...args),
        // Only the secrets this call unbound, and only if nothing else uses them.
        d1
          .prepare(
            `DELETE FROM "person_secret_versions" WHERE "secret_id" IN (${marks}) AND NOT EXISTS (SELECT 1 FROM "secret_bindings" b WHERE b."secret_id" = "person_secret_versions"."secret_id")`,
          )
          .bind(...ids),
        d1
          .prepare(
            `DELETE FROM "person_secrets" WHERE "id" IN (${marks}) AND NOT EXISTS (SELECT 1 FROM "secret_bindings" b WHERE b."secret_id" = "person_secrets"."id")`,
          )
          .bind(...ids),
      ]);
      return new Set(bound.map((r) => String(r.field))).size;
    },

    // ---- plain per-person values of a tool's setup (D-097): in clear, the person's own and the admin's to see
    /** One person's plain values for a tool. The gateway hands them to the tool they call, as it does their secrets. */
    async readUserSetup(toolId: string, person: string): Promise<Record<string, string>> {
      return Object.fromEntries(
        (
          await all(
            `SELECT "name", "value" FROM "user_setup" WHERE "tool_id" = ? AND "person" = ?`,
            toolId,
            person,
          )
        ).map((r) => [String(r.name), String(r.value)]),
      );
    },
    /** Sets the given values (an empty string removes one), in one batch with the audit line (names only, never a value). */
    async writeUserSetup(input: {
      toolId: string;
      person: string;
      values: Record<string, string>;
      via?: string;
    }): Promise<void> {
      await requireTool(input.toolId);
      const at = now();
      const names = Object.keys(input.values);
      if (names.length === 0) return;
      await d1.batch([
        ...names.map((name) =>
          input.values[name] === ""
            ? d1
                .prepare(
                  `DELETE FROM "user_setup" WHERE "tool_id" = ? AND "person" = ? AND "name" = ?`,
                )
                .bind(input.toolId, input.person, name)
            : d1
                .prepare(
                  `INSERT INTO "user_setup" ("tool_id", "person", "name", "value", "updated_at") VALUES (?, ?, ?, ?, ?)
ON CONFLICT ("tool_id", "person", "name") DO UPDATE SET "value" = excluded."value", "updated_at" = excluded."updated_at"`,
                )
                .bind(input.toolId, input.person, name, input.values[name], at),
        ),
        auditStatement(
          {
            toolId: input.toolId,
            actor: input.person,
            ...(input.via ? { via: input.via } : {}),
            kind: "access",
            subject: "setup:set",
            detail: { names },
          },
          at,
        ),
      ]);
    },
    /** What everyone gave a tool, for an admin to read and clear: people, names and values. */
    async listUserSetup(
      toolId: string,
    ): Promise<Array<{ person: string; values: Record<string, string> }>> {
      const by = new Map<string, Record<string, string>>();
      for (const r of await all(
        `SELECT "person", "name", "value" FROM "user_setup" WHERE "tool_id" = ? ORDER BY "person", "name"`,
        toolId,
      )) {
        const person = String(r.person);
        by.set(person, { ...by.get(person), [String(r.name)]: String(r.value) });
      }
      return [...by].map(([person, values]) => ({ person, values }));
    },
    /** The admin's clearing: one value of one person, or all of theirs, for a tool. The person is asked again. */
    async clearUserSetup(toolId: string, person: string, name?: string): Promise<number> {
      const found = await all(
        name === undefined
          ? `SELECT 1 FROM "user_setup" WHERE "tool_id" = ? AND "person" = ?`
          : `SELECT 1 FROM "user_setup" WHERE "tool_id" = ? AND "person" = ? AND "name" = ?`,
        ...(name === undefined ? [toolId, person] : [toolId, person, name]),
      );
      if (found.length === 0) return 0;
      await write(
        name === undefined
          ? `DELETE FROM "user_setup" WHERE "tool_id" = ? AND "person" = ?`
          : `DELETE FROM "user_setup" WHERE "tool_id" = ? AND "person" = ? AND "name" = ?`,
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
