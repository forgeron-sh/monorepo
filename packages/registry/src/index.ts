// The registry of the platform D1 (docs/ARCHITECTURE.md, "The platform"). Neutral: usable from the
// gateway (a Worker) and from a script.
import { applyMigrations, type D1Database, type MigrateOptions } from "@forgeron/hosting";
import { platformMigrations } from "./migrations";

export { platformMigrations } from "./migrations";
export { createRegistry, RegistryError } from "./registry";
export { createSecretBox, type SealedSecret, type SecretBox } from "./secret-box";
export type {
  Approval,
  ApprovalStatus,
  BuildRecord,
  EnvironmentRecord,
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
