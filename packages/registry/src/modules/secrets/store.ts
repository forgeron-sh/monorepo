import { RegistryError, type RegisteredEnvironment } from "../../kernel/errors";
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
      /** For a secret this makes: what the person calls it, and what it is (D-105). A rotation keeps both. */
      label?: string;
      kind?: string;
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
                  `INSERT INTO "person_secrets" ("id", "workspace", "person", "label", "kind", "created_at") VALUES (?, ?, ?, ?, ?, ?)`,
                )
                .bind(
                  id,
                  tool.workspace,
                  input.person,
                  input.label ?? input.name,
                  input.kind ?? null,
                  at,
                ),
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
        // An admin typing a person's secret leaves a line the person can see (D-107): who, for whom, which
        // field and secret. Never the value.
        ...(input.via === "admin"
          ? [
              auditStatement(
                {
                  toolId: input.toolId,
                  actor: input.by ?? input.person,
                  kind: "access",
                  subject: "secret:set-by-admin",
                  detail: {
                    tool: tool.name,
                    field: input.name,
                    secret: id,
                    version,
                    person: input.person,
                  },
                },
                at,
              ),
            ]
          : []),
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
    /**
     * A person's saved secrets in a workspace, without a value: what they are called, what kind, how
     * many versions, when last changed, and which tools use them (D-105). Only the person's own.
     */
    async listPersonSecrets(
      workspace: string,
      person: string,
    ): Promise<
      Array<{
        id: string;
        label: string;
        kind?: string;
        versions: number;
        updatedAt: string;
        /** Newest first: when, how, and whether the person themselves typed it. */
        history: Array<{ version: number; createdAt: string; via: string; byPerson: boolean }>;
        usedBy: Array<{ tool: string; field: string; scope: string; pin?: number }>;
      }>
    > {
      const secrets = await all(
        `SELECT s."id", s."label", s."kind", COUNT(v."version") AS "versions", MAX(v."created_at") AS "updated_at"
FROM "person_secrets" s JOIN "person_secret_versions" v ON v."secret_id" = s."id"
WHERE s."workspace" = ? AND s."person" = ? AND s."archived_at" IS NULL
GROUP BY s."id" ORDER BY s."created_at", s."id"`,
        workspace,
        person,
      );
      const uses = await all(
        `SELECT b."secret_id", t."name" AS "tool", b."field", b."scope", b."pin"
FROM "secret_bindings" b JOIN "tools" t ON t."id" = b."tool_id"
WHERE b."person" = ? AND t."workspace" = ? ORDER BY t."name", b."field", b."scope"`,
        person,
        workspace,
      );
      const versions = await all(
        `SELECT v."secret_id", v."version", v."created_at", v."created_by", v."via"
FROM "person_secret_versions" v JOIN "person_secrets" s ON s."id" = v."secret_id"
WHERE s."workspace" = ? AND s."person" = ? ORDER BY v."version" DESC`,
        workspace,
        person,
      );
      return secrets.map((r) => ({
        id: String(r.id),
        label: String(r.label),
        ...(r.kind === null || r.kind === undefined ? {} : { kind: String(r.kind) }),
        versions: Number(r.versions),
        updatedAt: String(r.updated_at),
        history: versions
          .filter((v) => String(v.secret_id) === String(r.id))
          .map((v) => ({
            version: Number(v.version),
            createdAt: String(v.created_at),
            via: String(v.via),
            byPerson: String(v.created_by) === person,
          })),
        usedBy: uses
          .filter((u) => String(u.secret_id) === String(r.id))
          .map((u) => ({
            tool: String(u.tool),
            field: String(u.field),
            scope: String(u.scope),
            ...(u.pin === null || u.pin === undefined ? {} : { pin: Number(u.pin) }),
          })),
      }));
    },
    /**
     * The latest value of one of the person's own secrets, for the setup page to check it and bind it
     * to a tool: `undefined` if it is not theirs in this workspace. The page never shows it.
     */
    async readPersonSecret(
      workspace: string,
      person: string,
      secretId: string,
      /** A version to read instead of the latest. */
      version?: number,
    ): Promise<string | undefined> {
      const row = await first(
        `SELECT v."iv", v."ciphertext", v."aad" FROM "person_secrets" s JOIN "person_secret_versions" v ON v."secret_id" = s."id"
WHERE s."id" = ? AND s."workspace" = ? AND s."person" = ? AND s."archived_at" IS NULL${version === undefined ? "" : ` AND v."version" = ?`}
ORDER BY v."version" DESC LIMIT 1`,
        secretId,
        workspace,
        person,
        ...(version === undefined ? [] : [version]),
      );
      return row
        ? secretBox().open(String(row.aad), {
            iv: String(row.iv),
            ciphertext: String(row.ciphertext),
          })
        : undefined;
    },
    /**
     * Makes the tool-wide binding of a field use one of the person's saved secrets, on its latest
     * version (D-105). Refused if the secret is not the person's in the tool's workspace. The audit
     * line names the field and the secret's id, never a value, and is written in the same batch.
     */
    async bindUserSecret(input: {
      toolId: string;
      person: string;
      field: string;
      secretId: string;
      /** Where it applies: `*` (the default), `production`, `preview` or `preview:<branch>`. */
      scope?: string;
      /** A version to keep using; none follows the latest. */
      pin?: number | null;
      via?: string;
    }): Promise<void> {
      const tool = await requireTool(input.toolId);
      const scope = input.scope ?? "*";
      if (!/^(\*|production|preview|preview:[a-z0-9][a-z0-9._-]*)$/.test(scope)) {
        throw new RegistryError("INVALID", `"${scope}" is not a scope of a binding.`);
      }
      const owned = await first(
        `SELECT 1 FROM "person_secrets" WHERE "id" = ? AND "workspace" = ? AND "person" = ? AND "archived_at" IS NULL`,
        input.secretId,
        tool.workspace,
        input.person,
      );
      if (!owned) throw new RegistryError("NOT_FOUND", "That is not one of your saved secrets.");
      const pin = input.pin ?? null;
      if (
        pin !== null &&
        !(await first(
          `SELECT 1 FROM "person_secret_versions" WHERE "secret_id" = ? AND "version" = ?`,
          input.secretId,
          pin,
        ))
      ) {
        throw new RegistryError("INVALID", `That secret has no version ${pin}.`);
      }
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "secret_bindings" ("tool_id", "person", "field", "scope", "secret_id", "pin") VALUES (?, ?, ?, ?, ?, ?)
ON CONFLICT ("tool_id", "person", "field", "scope") DO UPDATE SET "secret_id" = excluded."secret_id", "pin" = excluded."pin"`,
          )
          .bind(input.toolId, input.person, input.field, scope, input.secretId, pin),
        auditStatement(
          {
            toolId: input.toolId,
            actor: input.person,
            ...(input.via ? { via: input.via } : {}),
            kind: "access",
            subject: "secret:bound",
            detail: {
              field: input.field,
              secret: input.secretId,
              scope,
              ...(pin === null ? {} : { pin }),
            },
          },
          at,
        ),
      ]);
    },
    /** Stops a tool's field from using a secret in one scope. The secret stays in the person's registry. */
    async unbindUserSecret(input: {
      toolId: string;
      person: string;
      field: string;
      scope?: string;
    }): Promise<boolean> {
      const scope = input.scope ?? "*";
      const bound = await first(
        `SELECT "secret_id" FROM "secret_bindings" WHERE "tool_id" = ? AND "person" = ? AND "field" = ? AND "scope" = ?`,
        input.toolId,
        input.person,
        input.field,
        scope,
      );
      if (!bound) return false;
      await d1.batch([
        d1
          .prepare(
            `DELETE FROM "secret_bindings" WHERE "tool_id" = ? AND "person" = ? AND "field" = ? AND "scope" = ?`,
          )
          .bind(input.toolId, input.person, input.field, scope),
        auditStatement(
          {
            toolId: input.toolId,
            actor: input.person,
            kind: "access",
            subject: "secret:unbound",
            detail: { field: input.field, secret: String(bound.secret_id), scope },
          },
          now(),
        ),
      ]);
      return true;
    },
    /** A secret of the person's own that no tool uses yet: what they call it, what kind, and its first value. */
    async createPersonSecret(input: {
      workspace: string;
      person: string;
      label: string;
      kind?: string;
      value: string;
      by?: string;
      via?: "my-secrets" | "admin";
    }): Promise<string> {
      const id = `sec_${newId()}`;
      const at = now();
      const aad = secretAad(input.workspace, input.person, id, 1);
      const sealed = await secretBox().seal(aad, input.value);
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "person_secrets" ("id", "workspace", "person", "label", "kind", "created_at") VALUES (?, ?, ?, ?, ?, ?)`,
          )
          .bind(id, input.workspace, input.person, input.label, input.kind ?? null, at),
        d1
          .prepare(
            `INSERT INTO "person_secret_versions" ("secret_id", "version", "iv", "ciphertext", "aad", "created_at", "created_by", "via") VALUES (?, 1, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            id,
            sealed.iv,
            sealed.ciphertext,
            aad,
            at,
            input.by ?? input.person,
            input.via ?? "my-secrets",
          ),
        auditStatement(
          {
            actor: input.by ?? input.person,
            kind: "access",
            subject: "secret:created",
            detail: { secret: id, person: input.person },
          },
          at,
        ),
      ]);
      return id;
    },
    /**
     * A new version of one of the person's secrets: every binding on "latest" uses it from now on, one
     * still pinned to an older version keeps that one. Returns the version, or `undefined` if the secret
     * is not the person's. The audit line names the secret and the version, never a value.
     */
    async addSecretVersion(input: {
      workspace: string;
      person: string;
      secretId: string;
      value: string;
      by?: string;
      via?: "my-secrets" | "admin";
    }): Promise<number | undefined> {
      const row = await first(
        `SELECT (SELECT MAX("version") FROM "person_secret_versions" WHERE "secret_id" = s."id") AS "latest"
FROM "person_secrets" s WHERE s."id" = ? AND s."workspace" = ? AND s."person" = ? AND s."archived_at" IS NULL`,
        input.secretId,
        input.workspace,
        input.person,
      );
      if (!row) return undefined;
      const version = Number(row.latest) + 1;
      const at = now();
      const aad = secretAad(input.workspace, input.person, input.secretId, version);
      const sealed = await secretBox().seal(aad, input.value);
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "person_secret_versions" ("secret_id", "version", "iv", "ciphertext", "aad", "created_at", "created_by", "via") VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            input.secretId,
            version,
            sealed.iv,
            sealed.ciphertext,
            aad,
            at,
            input.by ?? input.person,
            input.via ?? "my-secrets",
          ),
        auditStatement(
          {
            actor: input.by ?? input.person,
            kind: "access",
            subject: "secret:version",
            detail: {
              secret: input.secretId,
              version,
              person: input.person,
              via: input.via ?? "my-secrets",
            },
          },
          at,
        ),
      ]);
      return version;
    },
    /** What the person calls one of their secrets. */
    async renamePersonSecret(
      workspace: string,
      person: string,
      secretId: string,
      label: string,
    ): Promise<boolean> {
      const row = await first(
        `SELECT 1 FROM "person_secrets" WHERE "id" = ? AND "workspace" = ? AND "person" = ? AND "archived_at" IS NULL`,
        secretId,
        workspace,
        person,
      );
      if (!row) return false;
      await write(`UPDATE "person_secrets" SET "label" = ? WHERE "id" = ?`, label, secretId);
      return true;
    },
    /**
     * Deletes one of the person's secrets with its versions and every binding on it: the tools that
     * used it ask again. Returns how many bindings it ended, or `undefined` if it is not theirs.
     */
    async deletePersonSecret(
      workspace: string,
      person: string,
      secretId: string,
    ): Promise<number | undefined> {
      const row = await first(
        `SELECT 1 FROM "person_secrets" WHERE "id" = ? AND "workspace" = ? AND "person" = ?`,
        secretId,
        workspace,
        person,
      );
      if (!row) return undefined;
      const bindings = await all(`SELECT 1 FROM "secret_bindings" WHERE "secret_id" = ?`, secretId);
      await d1.batch([
        d1.prepare(`DELETE FROM "secret_bindings" WHERE "secret_id" = ?`).bind(secretId),
        d1.prepare(`DELETE FROM "person_secret_versions" WHERE "secret_id" = ?`).bind(secretId),
        d1.prepare(`DELETE FROM "person_secrets" WHERE "id" = ?`).bind(secretId),
        auditStatement(
          {
            actor: person,
            kind: "access",
            subject: "secret:deleted",
            detail: { secret: secretId, bindings: bindings.length },
          },
          now(),
        ),
      ]);
      return bindings.length;
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
