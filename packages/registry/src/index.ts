// The registry of the platform D1 (docs/ARCHITECTURE.md, "The platform"). Neutral: usable from the
// gateway (a Worker) and from a script.
import { applyMigrations, type D1Database, type MigrateOptions } from "@forgeron/hosting";
import { platformMigrations } from "./migrations";

export { platformMigrations } from "./migrations";
export {
  approveVersion,
  closePreview,
  deployBuild,
  promoteVersion,
  rejectVersion,
  rollbackEnvironment,
} from "./deploy";
export type { DeployBuildInput, DeployedBuild, PromoteInput, RollbackInput } from "./deploy";
export { createRegistry, RegistryError, VIA_FORGERON_MCP } from "./registry";
export { ConsentError, createConsent } from "./consent";
export type {
  Consent,
  ConsentErrorCode,
  ConsentFetch,
  ConsentOptions,
  ConsentTarget,
  OAuthProvider,
} from "./consent";
export { createSecretBox, type SealedSecret, type SecretBox } from "./secret-box";
export type {
  AccessCell,
  AccessMatrix,
  Approval,
  AuditEntry,
  AuditInterface,
  AuditKind,
  AuditRecord,
  AuditResult,
  ApprovalStatus,
  BuildRecord,
  ConnectionInfo,
  ConnectionTokens,
  DeploymentKind,
  DeploymentRecord,
  EnvironmentRecord,
  Member,
  Registry,
  RegistryErrorCode,
  RegistryOptions,
  SecretState,
  SecretStatus,
  RegisteredEnvironment,
  Tool,
  VersionRecord,
} from "./registry";

/** Brings the platform D1 up to the current schema: the pending migrations, one batch each. */
export function migratePlatform(d1: D1Database, options?: MigrateOptions) {
  return applyMigrations(d1, platformMigrations, options);
}
