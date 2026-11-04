import type { Row } from "../../kernel/rows";
import { text } from "../../kernel/rows";

export type ApprovalStatus = "pending" | "approved" | "rejected";

export interface Approval {
  id: string;
  toolId: string;
  versionId: string;
  resource: string;
  kind: string;
  status: ApprovalStatus;
  requestedAt: string;
  decidedBy?: string;
  decidedAt?: string;
}

export const toApproval = (r: Row): Approval => ({
  id: String(r.id),
  toolId: String(r.tool_id),
  versionId: String(r.version_id),
  resource: String(r.resource),
  kind: String(r.kind),
  status: r.status as ApprovalStatus,
  requestedAt: String(r.requested_at),
  ...(text(r.decided_by) ? { decidedBy: text(r.decided_by) } : {}),
  ...(text(r.decided_at) ? { decidedAt: text(r.decided_at) } : {}),
});
