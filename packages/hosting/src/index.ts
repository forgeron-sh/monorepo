// Deployment interface of a tool, whatever the hosting mode (docs/ARCHITECTURE.md, "Hosting modes").
// Neutral: plain data in and out, no Node API, so the gateway (a Worker) and the CLI can both use it.
// The implementations are separate: `./local` here, `./self-host` through the Cloudflare API; cloud comes later.
export * from "./core";
export { deploy, PreviewDataError, restore, teardownPreview } from "./deploy";
export type { DeployOptions, Deployment, PreviewData } from "./deploy";
export {
  CloudflareError,
  createCloudflareClient,
  createRestD1,
  createSelfHostHosting,
  workerName,
} from "./self-host";
export type { CloudflareClient, CloudflareOptions, SelfHostOptions } from "./self-host";
export { applyMigrations, migrationStatus, MigrationError, revertMigrations } from "./migrate";
export type {
  BuildMigration,
  D1Database,
  MigrateOptions,
  MigrateResult,
  MigrationErrorCode,
  MigrationStatement,
} from "./migrate";
