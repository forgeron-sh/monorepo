// The public surface of the approvals module: the only file another part of the registry may import.
export { createApprovals } from "./store";
export type { Approval, ApprovalStatus } from "./types";
