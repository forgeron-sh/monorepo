// The marketplaces a workspace added (D-116). A marketplace is a GitHub repository whose index lists
// tools built into one file each (D-115); the gateway reads it and records each tool in the hidden
// workspace `@mp:<id>`, from where an install copies it like a template (D-081). This module keeps the
// list, the sealed read token and the state of the last sync; it never reaches GitHub itself.
import { RegistryError } from "../../kernel/errors";
import type { Kernel } from "../../kernel/kernel";
import type { Catalog } from "../catalog/public";
import { marketplaceSource, REPO, toMarketplace, type Marketplace } from "./types";

export type CatalogPort = Pick<Catalog["api"], "listTools" | "deleteTool">;

const slot = (workspace: string, id: string) => `marketplace/${workspace}/${id}`;

export function createMarketplaces(kernel: Kernel, catalog: CatalogPort) {
  const { d1, now, newId, all, first, write, auditStatement, secretBox } = kernel;

  return {
    /** The workspace's marketplaces, in the order they were added. */
    async listMarketplaces(workspace: string): Promise<Marketplace[]> {
      return (
        await all(
          `SELECT * FROM "marketplaces" WHERE "workspace" = ? ORDER BY "created_at", "repo"`,
          workspace,
        )
      ).map(toMarketplace);
    },

    async findMarketplace(workspace: string, id: string): Promise<Marketplace | undefined> {
      const row = await first(
        `SELECT * FROM "marketplaces" WHERE "workspace" = ? AND "id" = ?`,
        workspace,
        id,
      );
      return row ? toMarketplace(row) : undefined;
    },

    /**
     * Adds a GitHub repository as a marketplace of the workspace, with its read token when it is
     * private. The token is sealed at once and never given back. Audited, without the token.
     */
    async addMarketplace(input: {
      workspace: string;
      repo: string;
      token?: string;
      actor: string;
      via?: string;
    }): Promise<Marketplace> {
      if (!REPO.test(input.repo)) {
        throw new RegistryError(
          "INVALID",
          `"${input.repo}" is not a GitHub repository (owner/name).`,
        );
      }
      const repo = input.repo;
      const taken = await first(
        `SELECT 1 FROM "marketplaces" WHERE "workspace" = ? AND lower("repo") = lower(?)`,
        input.workspace,
        repo,
      );
      if (taken) {
        throw new RegistryError("ALREADY_EXISTS", `The marketplace ${repo} is already added.`);
      }
      const id = newId();
      const at = now();
      const sealed =
        input.token === undefined || input.token === ""
          ? undefined
          : await secretBox().seal(slot(input.workspace, id), input.token);
      await d1.batch([
        d1
          .prepare(
            `INSERT INTO "marketplaces" ("id", "workspace", "repo", "iv", "ciphertext", "created_by", "created_at") VALUES (?, ?, ?, ?, ?, ?, ?)`,
          )
          .bind(
            id,
            input.workspace,
            repo,
            sealed?.iv ?? null,
            sealed?.ciphertext ?? null,
            input.actor,
            at,
          ),
        auditStatement(
          {
            actor: input.actor,
            ...(input.via ? { via: input.via } : {}),
            kind: "access",
            subject: `marketplace:${repo}`,
            detail: { event: "marketplace-added", workspace: input.workspace, token: !!sealed },
          },
          at,
        ),
      ]);
      return (await this.findMarketplace(input.workspace, id))!;
    },

    /** The read token of a marketplace, opened; `undefined` for a public one. Only the sync calls it. */
    async marketplaceToken(workspace: string, id: string): Promise<string | undefined> {
      const row = await first(
        `SELECT "iv", "ciphertext" FROM "marketplaces" WHERE "workspace" = ? AND "id" = ?`,
        workspace,
        id,
      );
      if (!row) throw new RegistryError("NOT_FOUND", `There is no marketplace ${id}.`);
      if (row.ciphertext === null || row.ciphertext === undefined) return undefined;
      return secretBox().open(slot(workspace, id), {
        iv: String(row.iv),
        ciphertext: String(row.ciphertext),
      });
    },

    /** Records how the last sync went: the index's title, or why it failed. */
    async recordMarketplaceSync(
      workspace: string,
      id: string,
      outcome: { title?: string } | { error: string },
    ): Promise<void> {
      const at = now();
      if ("error" in outcome) {
        await write(
          `UPDATE "marketplaces" SET "sync_error" = ? WHERE "workspace" = ? AND "id" = ?`,
          outcome.error.slice(0, 500),
          workspace,
          id,
        );
        return;
      }
      await write(
        `UPDATE "marketplaces" SET "synced_at" = ?, "sync_error" = NULL, "title" = COALESCE(?, "title") WHERE "workspace" = ? AND "id" = ?`,
        at,
        outcome.title ?? null,
        workspace,
        id,
      );
    },

    /**
     * Removes a marketplace, its token and what it offered. The tools already installed from it are
     * the workspace's own and stay. Audited.
     */
    async removeMarketplace(input: {
      workspace: string;
      id: string;
      actor: string;
      via?: string;
    }): Promise<void> {
      const found = await this.findMarketplace(input.workspace, input.id);
      if (!found) throw new RegistryError("NOT_FOUND", `There is no marketplace ${input.id}.`);
      for (const tool of await catalog.listTools(marketplaceSource(input.id))) {
        await catalog.deleteTool(tool.id);
      }
      const at = now();
      await d1.batch([
        d1
          .prepare(`DELETE FROM "marketplaces" WHERE "workspace" = ? AND "id" = ?`)
          .bind(input.workspace, input.id),
        auditStatement(
          {
            actor: input.actor,
            ...(input.via ? { via: input.via } : {}),
            kind: "access",
            subject: `marketplace:${found.repo}`,
            detail: { event: "marketplace-removed", workspace: input.workspace },
          },
          at,
        ),
      ]);
    },
  };
}
