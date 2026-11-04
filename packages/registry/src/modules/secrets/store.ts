import type { RegisteredEnvironment } from "../../kernel/errors";
import type { Kernel } from "../../kernel/kernel";
import type { SecretState, SecretStatus } from "./types";
import type { Catalog } from "../catalog/public";

/** What this module asks of the catalog: narrow, and only through its public API. */
export type CatalogPort = { requireTool: Catalog["requireTool"] } & Pick<
  Catalog["api"],
  "getBuild" | "listVersions"
>;

export function createSecrets(kernel: Kernel, catalog: CatalogPort) {
  const { now, all, write, secretBox } = kernel;
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
  };
}
