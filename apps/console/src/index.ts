// Workspace console, served as assets by the gateway.
export { loadSecretsStatus, SecretsStatus, type SecretStatusRow } from "./secrets-status";
export {
  loadPendingApprovals,
  PendingApprovals,
  type PendingApprovalsProps,
  type PendingVersion,
  type RequestedResource,
} from "./pending-approvals";
export {
  AccessMatrix,
  loadAccessMatrix,
  type AccessCell,
  type AccessMatrixData,
  type AccessMatrixProps,
} from "./access-matrix";
