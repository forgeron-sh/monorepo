import { RegistryError } from "../../kernel/errors";
import type { Kernel } from "../../kernel/kernel";
import { toApproval } from "./types";
import type { ApprovalStatus, Approval } from "./types";
import type { Catalog, VersionRecord } from "../catalog/public";

/** What this module asks of the catalog: narrow, and only through its public API. */
export type CatalogPort = { requireTool: Catalog["requireTool"] } & Pick<
  Catalog["api"],
  "getVersion"
>;

export function createApprovals(kernel: Kernel, catalog: CatalogPort) {
  const { d1, now, newId, all, first, write, auditStatement } = kernel;
  return {
    // ---- approvals
    /** A version asks for a resource. Asking again gives back the same request. */
    async requestApproval(
      versionId: string,
      input: { resource: string; kind: string },
    ): Promise<Approval> {
      const version = await catalog.getVersion(versionId);
      if (!version) throw new RegistryError("NOT_FOUND", `There is no version ${versionId}.`);
      const found = await first(
        `SELECT * FROM "approvals" WHERE "version_id" = ? AND "resource" = ?`,
        versionId,
        input.resource,
      );
      if (found) return toApproval(found);
      const id = newId();
      await write(
        `INSERT INTO "approvals" ("id", "tool_id", "version_id", "resource", "kind", "requested_at") VALUES (?, ?, ?, ?, ?, ?)`,
        id,
        version.toolId,
        versionId,
        input.resource,
        input.kind,
        now(),
      );
      return toApproval((await first(`SELECT * FROM "approvals" WHERE "id" = ?`, id))!);
    },
    /** Decides a pending request, once. */
    async decideApproval(
      id: string,
      decision: Exclude<ApprovalStatus, "pending">,
      decidedBy: string,
      via?: string,
    ): Promise<Approval> {
      const row = await first(`SELECT * FROM "approvals" WHERE "id" = ?`, id);
      if (!row) throw new RegistryError("NOT_FOUND", `There is no approval ${id}.`);
      if (row.status !== "pending") {
        throw new RegistryError(
          "ALREADY_DECIDED",
          `The approval ${id} is already ${String(row.status)}.`,
        );
      }
      const at = now();
      await d1.batch([
        d1
          .prepare(
            `UPDATE "approvals" SET "status" = ?, "decided_by" = ?, "decided_at" = ? WHERE "id" = ? AND "status" = 'pending'`,
          )
          .bind(decision, decidedBy, at, id),
        auditStatement(
          {
            toolId: String(row.tool_id),
            actor: decidedBy,
            ...(via ? { via } : {}),
            kind: "approval",
            subject: String(row.resource),
            versionId: String(row.version_id),
            detail: { decision, kind: String(row.kind) },
          },
          at,
        ),
      ]);
      return toApproval((await first(`SELECT * FROM "approvals" WHERE "id" = ?`, id))!);
    },
    async listApprovals(toolId: string, status?: ApprovalStatus): Promise<Approval[]> {
      const rows = status
        ? await all(
            `SELECT * FROM "approvals" WHERE "tool_id" = ? AND "status" = ? ORDER BY "requested_at", "rowid"`,
            toolId,
            status,
          )
        : await all(
            `SELECT * FROM "approvals" WHERE "tool_id" = ? ORDER BY "requested_at", "rowid"`,
            toolId,
          );
      return rows.map(toApproval);
    },
    /** The versions of a tool that wait for an admin, with what they ask for. */
    async pendingVersions(
      toolId: string,
    ): Promise<{ version: VersionRecord; approvals: Approval[] }[]> {
      const pending = await this.listApprovals(toolId, "pending");
      const byVersion = new Map<string, Approval[]>();
      for (const approval of pending) {
        byVersion.set(approval.versionId, [...(byVersion.get(approval.versionId) ?? []), approval]);
      }
      const out: { version: VersionRecord; approvals: Approval[] }[] = [];
      for (const [versionId, approvals] of byVersion) {
        const version = await catalog.getVersion(versionId);
        if (version) out.push({ version, approvals });
      }
      return out;
    },

    async unapproved(versionId: string): Promise<Approval[]> {
      return (
        await all(
          `SELECT * FROM "approvals" WHERE "version_id" = ? AND "status" != 'approved' ORDER BY "rowid"`,
          versionId,
        )
      ).map(toApproval);
    },
  };
}
