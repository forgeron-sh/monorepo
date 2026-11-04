import type { AuditEntry, AuditInterface, AuditKind, AuditResult } from "../../kernel/audit";
import type { Kernel } from "../../kernel/kernel";
import { toAudit } from "./types";
import type { AuditRecord } from "./types";

export function createAudit(kernel: Kernel) {
  const { d1, now, all, auditStatement } = kernel;
  return {
    // ---- audit log
    /** Writes one line of the audit log. */
    async recordAudit(entry: AuditEntry): Promise<void> {
      await d1.batch([auditStatement(entry, now())]);
    },
    /** An action call: who, when, through which interface, with what result. */
    async recordActionCall(call: {
      toolId: string;
      actor: string;
      interface: AuditInterface;
      action: string;
      result: AuditResult;
      via?: string;
    }): Promise<void> {
      await this.recordAudit({
        toolId: call.toolId,
        actor: call.actor,
        interface: call.interface,
        ...(call.via ? { via: call.via } : {}),
        kind: "action",
        subject: call.action,
        result: call.result,
      });
    },
    /** Newest first. */
    async listAudit(
      toolId: string,
      filter: { kind?: AuditKind; limit?: number } = {},
    ): Promise<AuditRecord[]> {
      const rows = filter.kind
        ? await all(
            `SELECT * FROM "audit_log" WHERE "tool_id" = ? AND "kind" = ? ORDER BY "rowid" DESC LIMIT ?`,
            toolId,
            filter.kind,
            filter.limit ?? 100,
          )
        : await all(
            `SELECT * FROM "audit_log" WHERE "tool_id" = ? ORDER BY "rowid" DESC LIMIT ?`,
            toolId,
            filter.limit ?? 100,
          );
      return rows.map(toAudit);
    },
  };
}
