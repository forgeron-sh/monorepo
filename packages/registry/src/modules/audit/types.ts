import type { AuditEntry, AuditInterface, AuditKind, AuditResult } from "../../kernel/audit";
import type { Row } from "../../kernel/rows";
import { json, text } from "../../kernel/rows";

/** What the admin MCP writes in `via`: its calls are the person's, made through Forgeron's MCP. */
export const VIA_FORGERON_MCP = "Forgeron MCP";

export interface AuditRecord extends Omit<AuditEntry, "result"> {
  id: string;
  at: string;
  result: AuditResult;
}

export const toAudit = (r: Row): AuditRecord => ({
  id: String(r.id),
  at: String(r.at),
  ...(text(r.tool_id) ? { toolId: text(r.tool_id) } : {}),
  actor: String(r.actor),
  ...(text(r.interface) ? { interface: text(r.interface) as AuditInterface } : {}),
  ...(text(r.via) ? { via: text(r.via) } : {}),
  kind: r.kind as AuditKind,
  subject: String(r.subject),
  ...(text(r.version_id) ? { versionId: text(r.version_id) } : {}),
  result: r.result as AuditResult,
  ...(text(r.detail) !== undefined ? { detail: json(r.detail) } : {}),
});
