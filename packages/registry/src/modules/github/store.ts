// The GitHub App of a workspace (D-123): what GitHub gave when an admin made it from the console, and
// where it is installed. The keys are sealed at once and only the gateway's GitHub code opens them;
// this module never reaches GitHub itself.
import { RegistryError } from "../../kernel/errors";
import type { Kernel } from "../../kernel/kernel";
import {
  toGithubApp,
  toGithubInstallation,
  type GithubApp,
  type GithubAppKeys,
  type GithubInstallation,
} from "./types";

const slot = (workspace: string) => `github-app/${workspace}`;

export function createGithub(kernel: Kernel) {
  const { d1, now, all, first, auditStatement, secretBox } = kernel;

  return {
    /** The workspace's GitHub App, or `undefined`: never its keys. */
    async githubApp(workspace: string): Promise<GithubApp | undefined> {
      const row = await first(`SELECT * FROM "github_apps" WHERE "workspace" = ?`, workspace);
      return row ? toGithubApp(row) : undefined;
    },

    /** The app's keys, opened. Only the gateway's GitHub code calls it. */
    async githubAppKeys(workspace: string): Promise<GithubAppKeys> {
      const row = await first(
        `SELECT "iv", "ciphertext" FROM "github_apps" WHERE "workspace" = ?`,
        workspace,
      );
      if (!row) throw new RegistryError("NOT_FOUND", "This workspace has no GitHub App.");
      const opened = await secretBox().open(slot(workspace), {
        iv: String(row.iv),
        ciphertext: String(row.ciphertext),
      });
      return JSON.parse(opened) as GithubAppKeys;
    },

    /**
     * Keeps the app GitHub made for the workspace, its keys sealed. A workspace has one: saving
     * another replaces it, and forgets the installations of the old one. Audited, without the keys.
     */
    async saveGithubApp(input: {
      workspace: string;
      app: Omit<GithubApp, "workspace" | "createdBy" | "createdAt">;
      keys: GithubAppKeys;
      actor: string;
    }): Promise<GithubApp> {
      const at = now();
      const sealed = await secretBox().seal(slot(input.workspace), JSON.stringify(input.keys));
      const { app } = input;
      await d1.batch([
        d1
          .prepare(`DELETE FROM "github_installations" WHERE "workspace" = ?`)
          .bind(input.workspace),
        d1
          .prepare(
            `INSERT INTO "github_apps" ("workspace", "app_id", "slug", "client_id", "owner", "html_url", "iv", "ciphertext", "created_by", "created_at") VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT ("workspace") DO UPDATE SET "app_id" = excluded."app_id", "slug" = excluded."slug", "client_id" = excluded."client_id", "owner" = excluded."owner", "html_url" = excluded."html_url", "iv" = excluded."iv", "ciphertext" = excluded."ciphertext", "created_by" = excluded."created_by", "created_at" = excluded."created_at"`,
          )
          .bind(
            input.workspace,
            app.appId,
            app.slug,
            app.clientId,
            app.owner,
            app.htmlUrl,
            sealed.iv,
            sealed.ciphertext,
            input.actor,
            at,
          ),
        auditStatement(
          {
            actor: input.actor,
            kind: "access",
            subject: `github-app:${app.slug}`,
            detail: { event: "github-app-connected", workspace: input.workspace, owner: app.owner },
          },
          at,
        ),
      ]);
      return (await this.githubApp(input.workspace))!;
    },

    /**
     * Forgets the workspace's app, its keys and its installations. The app itself stays on GitHub,
     * where its owner deletes it. Audited.
     */
    async removeGithubApp(input: { workspace: string; actor: string }): Promise<void> {
      const found = await this.githubApp(input.workspace);
      if (!found) throw new RegistryError("NOT_FOUND", "This workspace has no GitHub App.");
      const at = now();
      await d1.batch([
        d1
          .prepare(`DELETE FROM "github_installations" WHERE "workspace" = ?`)
          .bind(input.workspace),
        d1.prepare(`DELETE FROM "github_apps" WHERE "workspace" = ?`).bind(input.workspace),
        auditStatement(
          {
            actor: input.actor,
            kind: "access",
            subject: `github-app:${found.slug}`,
            detail: { event: "github-app-disconnected", workspace: input.workspace },
          },
          at,
        ),
      ]);
    },

    /** Where the app is installed, in the order it was. */
    async listGithubInstallations(workspace: string): Promise<GithubInstallation[]> {
      return (
        await all(
          `SELECT * FROM "github_installations" WHERE "workspace" = ? ORDER BY "created_at", "installation_id"`,
          workspace,
        )
      ).map(toGithubInstallation);
    },

    /** Records an installation (GitHub's redirect after it, or its webhook); once is enough. */
    async addGithubInstallation(input: {
      workspace: string;
      installationId: number;
      account: string;
      accountType: "Organization" | "User";
    }): Promise<GithubInstallation> {
      await kernel.write(
        `INSERT INTO "github_installations" ("workspace", "installation_id", "account", "account_type", "created_at") VALUES (?, ?, ?, ?, ?) ON CONFLICT ("workspace", "installation_id") DO UPDATE SET "account" = excluded."account", "account_type" = excluded."account_type"`,
        input.workspace,
        input.installationId,
        input.account,
        input.accountType,
        now(),
      );
      return (await this.listGithubInstallations(input.workspace)).find(
        (i) => i.installationId === input.installationId,
      )!;
    },

    /** Forgets an installation that was removed on GitHub. */
    async removeGithubInstallation(workspace: string, installationId: number): Promise<void> {
      await kernel.write(
        `DELETE FROM "github_installations" WHERE "workspace" = ? AND "installation_id" = ?`,
        workspace,
        installationId,
      );
    },
  };
}
