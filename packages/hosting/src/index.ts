// Deployment interface of a tool, whatever the hosting mode (docs/ARCHITECTURE.md, "Hosting modes").
// Neutral: plain data in and out, no Node API, so the gateway (a Worker) and the CLI can both use it.
// The implementations are separate: `./local` here, `./self-host` through the Cloudflare API; cloud comes later.
export * from "./core";
export { GATEWAY_COMPATIBILITY_DATE, GATEWAY_COMPATIBILITY_FLAGS } from "./gateway-runtime";
export { markSeedPending, seedStatus } from "./seed-marker";
export { deploy, PreviewDataError, restore, teardownPreview } from "./deploy";
export type { DeployOptions, Deployment, PreviewData } from "./deploy";
export {
  CloudflareError,
  createCloudflareClient,
  createRestD1,
  GATEWAY_ASSETS_CONFIG,
  uploadAssets,
  createGatewayBindings,
  createSelfHostHosting,
  serviceBindingName,
  workerName,
} from "./self-host";
export type {
  Asset,
  CloudflareClient,
  CloudflareOptions,
  GatewayBindings,
  GatewayBindingsOptions,
  SelfHostOptions,
} from "./self-host";
export { createCloudHosting, ensureDispatchNamespace } from "./cloud";
export type { CloudOptions } from "./cloud";
export {
  applyMigrations,
  checkMigrations,
  migrationStatus,
  MigrationError,
  revertMigrations,
} from "./migrate";
export type {
  BuildMigration,
  D1Database,
  MigrateOptions,
  MigrateResult,
  MigrationCheck,
  MigrationConflict,
  MigrationErrorCode,
  MigrationStatement,
} from "./migrate";
