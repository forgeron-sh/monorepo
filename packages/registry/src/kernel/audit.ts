export type AuditKind = "action" | "deployment" | "promotion" | "rollback" | "approval" | "access";
export type AuditResult = "ok" | "denied" | "error";
export type AuditInterface = "mcp" | "api" | "cli" | "web";

export interface AuditEntry {
  toolId?: string;
  /** Who: a person's id. */
  actor: string;
  /** Through which interface an action was called. */
  interface?: AuditInterface;
  /** `VIA_FORGERON_MCP` for the admin MCP. */
  via?: string;
  kind: AuditKind;
  /** The action called, the resource approved, the version deployed. */
  subject: string;
  versionId?: string;
  result?: AuditResult;
  detail?: unknown;
}
