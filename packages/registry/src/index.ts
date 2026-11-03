// The registry of the platform D1 (docs/ARCHITECTURE.md, "The platform"). Neutral: usable from the
// gateway (a Worker) and from a script.
import { applyMigrations, type D1Database, type MigrateOptions } from "@forgeron/hosting";
import { platformMigrations } from "./migrations";

export { platformMigrations } from "./migrations";
export { closePreview, deployBuild } from "./deploy";
export type { DeployBuildInput, DeployedBuild } from "./deploy";
export { createRegistry, RegistryError } from "./registry";
export type {
  Approval,
  AuditEntry,
  ApprovalStatus,
  BuildRecord,
  EnvironmentRecord,
  Registry,
  RegistryErrorCode,
  RegistryOptions,
  RegisteredEnvironment,
  Tool,
  VersionRecord,
} from "./registry";

/** Brings the platform D1 up to the current schema: the pending migrations, one batch each. */
export function migratePlatform(d1: D1Database, options?: MigrateOptions) {
  return applyMigrations(d1, platformMigrations, options);
}
